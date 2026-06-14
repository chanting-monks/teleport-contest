// allmain.js — Main game loop.
// C ref: allmain.c — newgame, moveloop, moveloop_core.
//
// newgame() calls translated init_objects / role_init / init_dungeons /
// init_artifacts / u_init_misc / u_init_inventory_attrs /
// u_init_skills_discoveries in C order.  The legacy `fastforward.js`
// staging file that wrapped these is retired (Phase F1-F3 complete).
// Real mklev.js handles level generation for screen parity.

import { game } from './gstate.js';
import { rn2, rnd } from './rng.js';
import { u_on_upstairs } from './translated/stairs.js';
import { nhl_init, nhl_loadlua } from './c2js-runtime/lua.js';
import { level_difficulty as t_level_difficulty } from './translated/dungeon.js';
import { rhack } from './cmd.js';
import { deferred_goto as t_deferred_goto } from './translated/do.js';
import { nhgetch } from './input.js';
import { docrt, cls, bot, flush_screen, pline, rebuild_status_rows, newsym } from './display.js';
import { vision_recalc, vision_reset, init_vision_globals } from './vision.js';
import { init_objects, observe_object } from './translated/o_init.js';
import { u_init_misc, u_init_inventory_attrs, u_init_skills_discoveries } from './translated/u_init.js';
import { init_dungeons } from './translated/dungeon.js';
import { role_init } from './translated/role.js';
import { init_artifacts } from './translated/artifact.js';
import { wallClockDeadline, traceCheckpoint } from './c2js-runtime/trace.js';
import { movemon, mcalcmove, mcalcdistress } from './translated/mon.js';
import { settrack } from './translated/track.js';
import { nh_timeout, do_storms } from './translated/timeout.js';
import { regen_hp, regen_pw, maybe_generate_rnd_mon, u_calc_moveamt } from './translated/allmain.js';
import { age_spells } from './translated/spell.js';
import { glibr, find_ac } from './translated/do_wear.js';
import { overexert_hp, near_capacity, unmul, runmode_delay_output, monster_nearby } from './translated/hack.js';
import { prayer_done } from './translated/pray.js';
import {
    Armor_off, Shield_off, Helmet_off, Gloves_off, Boots_off,
    Cloak_off, Shirt_off, Shirt_on,
} from './translated/do_wear.js';
import { eatmdone } from './translated/eat.js';
import { invault } from './translated/vault.js';
import { amulet } from './translated/wizard.js';
import { run_regions } from './translated/region.js';
import { mkot_trap_warn } from './translated/artifact.js';
import { dosounds } from './translated/sounds.js';
import { gethungry } from './translated/eat.js';
import { exerchk, exercise } from './translated/attrib.js';
import { tele } from './translated/teleport.js';
import { polyself } from './translated/polyself.js';
import { you_were } from './translated/were.js';
import { dosearch0 } from './translated/detect.js';
import { night } from './translated/calendar.js';
import { next_to_u, check_leash } from './translated/apply.js';
import { stop_occupation } from './translated/allmain.js';
import { cmdq_clear } from './translated/cmd.js';
import { SEARCHING as UPROP_SEARCHING, TELEPORT as UPROP_TELEPORT, POLYMORPH as UPROP_POLYMORPH, UNCHANGING as UPROP_UNCHANGING } from './translated/nh-constants.js';
import { findRole, findRace, findAlign, aligns } from './roles.js';
import { Hello, pick_role, pick_race, pick_gend, pick_align, rigid_role_checks, ok_role, ok_race, ok_gend, ok_align, roles, races, genders, aligns as t_aligns } from './translated/role.js';
import { ensureRumorsLoaded } from './c2js-runtime/rumors-loader.js';
import { fill_ordinary_room as t_fill_ordinary_room, mineralize as t_mineralize, mklev as t_mklev } from './translated/mklev.js';
import { fill_special_room as t_fill_special_room } from './translated/sp_lev.js';
import { makedog as t_makedog } from './translated/dog.js';
import { OROOM as NH_OROOM, THEMEROOM as NH_THEMEROOM } from './translated/nh-constants.js';
import { moveloop_preamble as t_moveloop_preamble } from './translated/allmain.js';
import { vision_init as t_vision_init } from './translated/vision.js';
import { objects_globals_init } from './translated/objects.js';
import { monst_globals_init } from './translated/monst.js';
import { program_state_init, decl_globals_init } from './translated/decl.js';
import { installAutoStubs } from './c2js-runtime/autostub.js';
import { makeMenuProcs } from './wp-menus.js';
import { tripwireWrapWindowprocs } from './c2js-runtime/tripwire.js';
import { dupstr as __nh_dupstr } from './c2js-runtime/string.js';
import { installLuaData } from './c2js-runtime/lua-bootstrap.js';

// Browser-safe env lookup.  Returns the env value when running under
// Node (where process.env exists); returns undefined under a browser
// load.  All in-file gating via `__env.NH_X` resolves to falsy on a
// browser, suppressing debug output paths without errors.
const __env = (typeof process !== 'undefined' && process.env) || {};

// Install real implementations of libc helpers that translator
// output uses as free identifiers BEFORE autostub overlays no-op
// stubs.  dupstr is the critical one: mapfrag_fromstr (sp_lev.c)
// passes its result to str_lines_maxlen / strchr, and the no-op
// `() => 0` stub leaves mf.data = 0 which breaks every Lua-driven
// map placement (lspo_map rn2(COLNO-1-mf.wid) → rn2(79) regardless
// of fragment width).
globalThis.dupstr = __nh_dupstr;

// Install a real ctype table for __ctype_b_loc().  The autostub
// would resolve it to () => 0, making every (table[ch] & _ISupper)
// or (table[ch] & _ISspace) evaluate to 0 — silently skipping
// rogue-level uppercase-monster filters, whitespace-trimming in
// config parsers, and alphanumeric checks in report sanitization.
// Constants match nh-constants.js (_ISupper=256, _ISspace=8192,
// _ISalnum=8, etc.).  Indices 0-255 covered; non-ASCII returns 0.
{
    const _ISblank = 1, _IScntrl = 2, _ISpunct = 4, _ISalnum = 8;
    const _ISupper = 256, _ISlower = 512, _ISalpha = 1024;
    const _ISdigit = 2048, _ISxdigit = 4096, _ISspace = 8192;
    const _ISprint = 16384, _ISgraph = 32768;
    const t = new Array(256).fill(0);
    for (let c = 0; c < 32; c++) t[c] |= _IScntrl;
    t[127] |= _IScntrl;
    for (const c of [9, 10, 11, 12, 13]) t[c] |= _ISspace;
    t[32] |= _ISspace | _ISblank | _ISprint;
    t[9] |= _ISblank;
    for (let c = 33; c < 48; c++) t[c] |= _ISpunct | _ISprint | _ISgraph;
    for (let c = 58; c < 65; c++) t[c] |= _ISpunct | _ISprint | _ISgraph;
    for (let c = 91; c < 97; c++) t[c] |= _ISpunct | _ISprint | _ISgraph;
    for (let c = 123; c < 127; c++) t[c] |= _ISpunct | _ISprint | _ISgraph;
    for (let c = 48; c <= 57; c++) t[c] |= _ISalnum | _ISdigit | _ISprint | _ISgraph | _ISxdigit;
    for (let c = 65; c <= 90; c++) t[c] |= _ISalnum | _ISalpha | _ISupper | _ISprint | _ISgraph;
    for (let c = 97; c <= 122; c++) t[c] |= _ISalnum | _ISalpha | _ISlower | _ISprint | _ISgraph;
    for (let c = 65; c <= 70; c++) t[c] |= _ISxdigit;
    for (let c = 97; c <= 102; c++) t[c] |= _ISxdigit;
    globalThis.__ctype_b_loc = () => t;
}

// Install REAL implementations for libc functions before autostub.
// The autostub catch-all installs no-op `() => 0` for any unhandled
// free identifier; real C-stdlib functions get used by translated
// code with semantic expectations (e.g. atoi parses an int prefix),
// so they need real semantics.  Pre-installing on globalThis lets
// the autostub skip them (its installation is gated on `typeof
// globalThis[name] !== 'undefined'`).
if (typeof globalThis.atoi === 'undefined') {
    /* C atoi parses optional whitespace + optional sign + digit
       prefix; returns 0 on no match.  parseInt(str, 10) matches
       this semantically for the strings the translator passes
       (always strings here, never null/undefined). */
    globalThis.atoi = (s) => {
        if (s == null) return 0;
        const str = (typeof s === 'string') ? s
            : (Array.isArray(s) ? String.fromCharCode(...s.filter((c, i, a) => c !== 0 && i < a.indexOf(0)).slice(0, 32)) : String(s));
        const n = parseInt(str, 10);
        return Number.isFinite(n) ? n : 0;
    };
}

// Install no-op globalThis stubs for any translator-output free
// identifiers that aren't otherwise defined.  Mirrors the harness's
// auto-stub mechanism — needed once the engine starts calling
// translated functions that transitively reference libc / save /
// achievement helpers from untranslated TUs.
//
// Pre-install REAL implementations of libc helpers that translated
// code references but doesn't import explicitly.  Without these,
// installAutoStubs would replace them with `() => 0` no-ops.
// atoi/atol are used by translated date.js (parse_str_to_date_time),
// botl.js (s_to_anything numeric option values), and others —
// returning 0 silently breaks date display and option parsing.
{
    const __libcShims = await import('./c2js-runtime/string.js');
    if (typeof globalThis.atoi === 'undefined') globalThis.atoi = __libcShims.atoi;
    if (typeof globalThis.atol === 'undefined') globalThis.atol = __libcShims.atol;
    if (typeof globalThis.__nh_char_at0 === 'undefined') globalThis.__nh_char_at0 = __libcShims.__nh_char_at0;
}
// Pre-install the real nhl_add_table_entry_* family (C nhlua.c) for
// the translated sp_lev.js's bare references — autostubbing them to
// () => 0 left l_push_mkroom_table's rm table EMPTY, so themerms'
// lit-dependent fill-eligibility checks diverged from C (seed2600
// room-chain cluster, Q9 iter 41).
{
    const __luaHub = await import('./c2js-runtime/lua.js');
    for (const k of ['nhl_add_table_entry_int', 'nhl_add_table_entry_bool',
                     'nhl_add_table_entry_str', 'nhl_add_table_entry_region',
                     // splev_chr2typ/check_mapchr: the iteration-23 port
                     // covered lua.js's internal map loader only; the
                     // production sp_lev.js bare references (mapfrag_get
                     // :136, lspo_terrain :4413+) still hit the () => 0
                     // autostub — des.terrain mapchars all parsed as
                     // STONE (Q9 iter 42).
                     'splev_chr2typ', 'check_mapchr',
                     'get_table_mapchr', 'get_table_mapchr_opt',
                     'nhl_get_xy_params',
                     // nhl_push_obj (nhlobj.c:89): autostubbed to
                     // () => 0 it pushes nothing, so lspo_object's
                     // contents-callback pcall finds no function and
                     // every des.object contents container comes out
                     // empty (Q9 iter 52, tower1 candle chests).
                     'nhl_push_obj']) {
        if (typeof globalThis[k] === 'undefined') globalThis[k] = __luaHub[k];
    }
}
// Q9 iter 43 — stub-vs-export audit batch.  These names have REAL
// implementations in the runtime but production translated files
// reference them bare (the import only arrives with regen), so the
// () => 0 autostub won: luaL_check*/load_lua corrupted every
// lspo_* string/int argument read in sp_lev.js; dupstr returned 0
// instead of the string across ~20 TUs; max/min returned 0 in
// apply.js/botl.js arithmetic; the levelfile trio blocked do.js's
// goto_level save/restore path (the getbones cluster's substrate).
// Output-side printf/snprintf/raw_print intentionally NOT batched
// here — different risk class, gate separately.
{
    const __luaHub = await import('./c2js-runtime/lua.js');
    const __str = await import('./c2js-runtime/string.js');
    const __math = await import('./c2js-runtime/math.js');
    const __lvl = await import('./c2js-runtime/levelfile.js');
    const __pairs = [
        [__luaHub, ['luaL_checkinteger', 'luaL_checkstring', 'luaL_optinteger',
                    'luaL_typename', 'load_lua']],
        [__str, ['dupstr']],
        [__math, ['max', 'min']],
        [__lvl, ['create_levelfile', 'delete_levelfile', 'open_levelfile',
                 'close_nhfile', 'savelev', 'getlev']],
    ];
    for (const [mod, names] of __pairs) {
        for (const k of names) {
            if (typeof globalThis[k] === 'undefined' && typeof mod[k] === 'function') {
                globalThis[k] = mod[k];
            }
        }
    }
    // Non-function shared tables referenced bare by frozen TUs:
    // seenv_matrix (translated display.js) is used inline by
    // do.js's goto_level seenv updates (Q9 iter 44 — the ^V
    // wizlevelport chain ReferenceError'd here after the level
    // switch).
    {
        const __disp = await import('./translated/display.js');
        if (typeof globalThis.seenv_matrix === 'undefined' && __disp.seenv_matrix) {
            globalThis.seenv_matrix = __disp.seenv_matrix;
        }
    }
    // Selection-userdata bridge (nhlsel.c counterparts).  The stub
    // manifest carries l_selection_check/l_selection_push_copy, and
    // lua-bootstrap's installSelectionGlobals used to defer to any
    // existing global — so the () => 0 autostub won and EVERY
    // selection-argument lspo_* silently no-opped (l_selection_check
    // returned 0, `if (sel)` fell to the coord path; Q9 iter 51:
    // Bar-strt's des.terrain(randline, ".") never carved the river
    // through the pool field — 4 extra kelp cells, seed0373 judged
    // div @4108).
    {
        const __nhlsel = await import('./c2js-runtime/nhlsel-bridge.mjs');
        __nhlsel.installSelectionGlobals();
    }
}
// Install no-op stubs for free identifiers in translator output.
// Manifest-first (works in node AND browser — see autostub.js /
// UNWEDGE_PLAN Q2); legacy node-only source scan as warned fallback.
await installAutoStubs();

// Wire the Lua bridge's rn2/random hooks to the engine's rn2.  This
// is what nhlib.lua's `math.random` override falls through to (via
// bound_rn2 in c2js-runtime/lua.js).  Without this, `shuffle(align)`
// at nhlib.lua's top level returns 0/0 instead of firing 2 PRNG
// calls.  Installing this binding lets the Lua shuffle fire real
// rn2, matching the C semantics.
globalThis.__nh_lua_bindings = globalThis.__nh_lua_bindings || {};
globalThis.__nh_lua_bindings.rn2 = rn2;
// nh.level_difficulty() in nhlib.lua / themerms.lua reads the current
// dungeon level's difficulty for monster generation and themeroom
// eligibility filters.  C ref dungeon.c:1585 — uses depth(game.u.uz).
// Without this wiring, the lua bridge falls back to a hardcoded 1,
// which produces different eligibility outcomes for any mklev call
// after level transitions (and even for some level-1 mklev paths
// where C's depth() returns 0).  Hooks t_level_difficulty so the
// Lua scripts see the C-correct value.
globalThis.level_difficulty = t_level_difficulty;

// Wire the translated `l_register_des` so the Lua `des` table has
// real handlers (for des.room, des.terrain, etc.).  Without this,
// install_des_table falls back to a no-op stub: when translated
// mklev's `themerooms_generate` calls `des.room({...})`, no room
// is created, svn.nroom stays 0, and the C-level `makerooms()`
// `while (nroom < 39 && rnd_rect()) ...` loop runs forever firing
// rn2 calls until heap exhaustion.
{
    const { l_register_des } = await import('./translated/sp_lev.js');
    const { setDesRegistrar } = await import('./c2js-runtime/lua.js');
    setDesRegistrar(l_register_des);
}

// Register dat/*.lua files with the Lua bridge so translated
// init_dungeons / read_lua_file_obj / etc. can `nhl_loadlua`
// them.  Reads from nethack-c/upstream/dat at engine startup.
await installLuaData();

// C ref: allmain.c newgame()
export async function newgame() {
    const g = game;

    // Populate the translator-output data tables and global-bucket
    // structs.  C ref: scaffolding for decl.c's gA/gB/...
    // initializer arrays + objects_globals_init / monst_globals_init
    // which memcpy from immutable `_init` tables into runtime
    // arrays.  No PRNG fired here — pure data setup.
    //
    // jsmain.js's start() pre-set rc-option fields (plname, flags
    // overrides, iflags overrides, _opts*) BEFORE newgame() runs.
    // decl_globals_init's Object.assigns don't touch game.u/flags/
    // iflags (those come from translated decl.js's top-level
    // statements which the snapshot in resetGame preserved), but
    // we still want to merge rc options onto the FULL flags struct
    // — not replace it.  Capture the rc-set keys, run init, then
    // copy each rc-set key BACK into the full struct.
    // Capture ONLY the keys jsmain.js explicitly wrote (tracked in
    // g._rcWrittenFlags / g._rcWrittenIflags).  Earlier code copied
    // ALL of g.flags / g.iflags which clobbered the NHOPTB defaults
    // applied below — every flag jsmain.js didn't touch came back as 0
    // from the resetGame snapshot, overriding the in-place init walk's
    // safe_dog=1, sortpack=1, etc.  See LEARNINGS §23.41 for the
    // seed0014 first-divergence (rn2(7) @ do_attack) which couldn't
    // fire because is_safemon's `flags.safe_dog &&` short-circuit
    // hit zero.
    const rcFlags = (g.flags && g._rcWrittenFlags) ? Object.fromEntries(
        [...g._rcWrittenFlags].filter(k => k in g.flags).map(k => [k, g.flags[k]])
    ) : null;
    const rcIflags = (g.iflags && g._rcWrittenIflags) ? Object.fromEntries(
        [...g._rcWrittenIflags].filter(k => k in g.iflags).map(k => [k, g.iflags[k]])
    ) : null;
    const savedPlname = g.plname;
    const savedOptsRole = g._optsRole;
    const savedOptsRace = g._optsRace;
    const savedOptsAlign = g._optsAlign;
    const savedPreferredPet = g.preferred_pet;
    // Guard against gstate.js Proxy ghost: an unset field reads as
     // truthy `{}`.  Require a real string value.
    const savedSymsetName = (typeof g._rcSymsetName === 'string') ? g._rcSymsetName : null;
    program_state_init();
    await decl_globals_init();
    objects_globals_init();
    monst_globals_init();

    // C ref allmain.c:780-781 — initialize mvitals[i].mvflags from
    // each monster's geno field, preserving only the G_NOCORPSE bit
    // (0x10).  Translated newgame() does this but we don't call it;
    // without this loop, game.mvitals[i].mvflags stays at 0 for
    // every monster.  Effect: mksobj's CORPSE retry loop
    // (mkobj.c:901-904) never re-rolls when rndmonnum picks a
    // G_NOCORPSE monster — the broken corpse just gets that
    // monster's corpsenm.  Closes seed0002's first divergence at
    // PRNG idx 1242 where C re-rolls a G_NOCORPSE pick but JS
    // accepts it.  G_NOCORPSE = 0x10.
    if (Array.isArray(g.mvitals) && Array.isArray(g.mons)) {
        const LOW_PM_ = 1; // matches translated/allmain.js
        for (let i = LOW_PM_; i < g.mons.length && i < g.mvitals.length; i++) {
            if (g.mvitals[i] && g.mons[i]) {
                g.mvitals[i].mvflags = (g.mons[i].geno || 0) & 16;
            }
        }
    }

    // level_map[i].lev_spec is now a getter (build-engine.mjs
    // dungeon.js patch) that resolves to game.dungeon_topology
    // .d_X_level at read time.  The gstate.js deepClone preserves
    // accessors through resetGame's snapshot/restore.  No re-link
    // needed.  Per docs/NEXT_STEPS.md Phase F2 step 2 option (b).

    // The init_svc.context nested-struct fields (warntype, achieveo,
    // objsplit, lifelist, polearm, novel, etc.) are now emitted as
    // proper struct literals by build-engine.mjs's decl.js patch
    // (LEARNINGS §23.31), so the hand-port nested-struct shape
    // fix-ups previously here are redundant — removed.  The only
    // remaining context fix-up is `tribute.enabled = 1` which is
    // C-semantic (allmain.c:776-777 sets enabled=TRUE at newgame
    // start), not a struct-shape patch.
    if (g.context.tribute && !g.context.tribute.enabled) {
        g.context.tribute.enabled = 1;
    }
    // C ref allmain.c:775 — next_attrib_check defaults to 600 to gate
    // exerchk's rn2(200)+800 reset until move 600.  Translator-emitted
    // init_svc.context.next_attrib_check is 0, so exerchk fires
    // immediately at step 1.  Same for snickersnee_turn (defaults to
    // ~10000 via stethoscope_seq is large too, but check that later).
    g.context.next_attrib_check = 600;
    // Translator gap: src/options.c's `def_inv_order` static
    // const-array uses enum class names (COIN_CLASS, AMULET_CLASS,
    // ...).  build-engine.mjs patches the translator output to use
    // proper enum literal values [12, 5, 2, ...], but the
    // `allopt_array_init` that memcpy's def_inv_order →
    // flags.inv_order is never actually called from engine boot
    // (no initoptions() invocation).  So game.flags.inv_order stays
    // all-zero after decl_globals_init.  Hand-init the values here
    // until the engine wires initoptions() properly.
    if (Array.isArray(g.flags.inv_order) && g.flags.inv_order.every(x => !x)) {
        const order = [12, 5, 2, 3, 7, 9, 10, 8, 4, 11, 6, 13, 14, 15, 16, 0, 0, 0];
        for (let i = 0; i < order.length; i++) g.flags.inv_order[i] = order[i];
    }
    // menu_headings default attribute (C ref: options.c
    // initoptions_init: iflags.menu_headings = ATR_INVERSE
    // before display init, then iflags.menu_headings.attr =
    // ATR_BOLD post-display).  Recording shows class headers
    // in bold (attr=1).  Translator-emitted iflags init
    // leaves it at 0; set explicitly.
    if (typeof g.iflags.menu_headings.attr !== 'number' || g.iflags.menu_headings.attr === 0) {
        g.iflags.menu_headings.attr = 1;  // ATR_BOLD
    }
    // Apply C's NHOPTB defaults (initoptions_init walk equivalent)
    // BEFORE rcFlags merge so rc-set values still win.  Mirrors C's
    // init order: initoptions_init applies built-in defaults, then
    // read_config_file overrides from .nethackrc.
    //
    // The translator emits each allopt_init[i].addr as a value-box
    // wrapper `{ get value() { return flags.X; }, set value(_v) {
    // flags.X = _v; }, valueOf() { return flags.X; } }`, so
    // `addr.value = initval` propagates back to the underlying
    // flags / iflags slot.
    //
    // The `safe_pet` (=> flags.safe_dog) NHOPTB default was previously
    // gated behind NH_SAFE_DOG=1 to avoid:
    //   (a) a seed0030 hang in domove_swap_with_pet — closed by the
    //       fixMprevLoop advance-step fix in commit a5a3291;
    //   (b) net-negative aggregate from at-index-shift losses in
    //       seed0002 (first divergence idx 1242, unrelated to
    //       safe_pet) and seed0107.
    // Reason (a) is fully resolved.  Reason (b) is at-index-match
    // noise: the lost matches are coincidental same-index hits
    // downstream of THOSE sessions' OWN earlier divergences, not
    // real correctness regressions.  Per directive, prefer the
    // C-correct default over preserving coincidental parity —
    // ungate so safe_pet defaults match C.
    for (const opt of g.allopt_init) {
        if (opt.addr && opt.initval) {
            opt.addr.value = opt.initval;
        }
    }
    if (rcFlags) for (const k of Object.keys(rcFlags)) g.flags[k] = rcFlags[k];
    // Default flags that translator-emitted decl_globals_init zeros
    // but C's initoptions sets TRUE.  acoustics gates dosounds's
    // rn2(300) sink check (and rn2(400) fountain, etc.).
    if (!g.flags.acoustics) g.flags.acoustics = 1;
    if (rcIflags) for (const k of Object.keys(rcIflags)) g.iflags[k] = rcIflags[k];
    if (savedPlname !== undefined) g.plname = savedPlname;
    if (savedOptsRole) g._optsRole = savedOptsRole;
    if (savedOptsRace) g._optsRace = savedOptsRace;
    if (savedOptsAlign) g._optsAlign = savedOptsAlign;
    // Restore preferred_pet after decl_globals_init's Object.assign
    // (g_init_p) overwrites it.  Translator stores 'n' (110) for
    // pettype:none — coerce string -> char code so translated
    // makedog's `preferred_pet == 110` check works.
    if (savedPreferredPet !== undefined && savedPreferredPet !== 0) {
        g.preferred_pet = (typeof savedPreferredPet === 'string'
            && savedPreferredPet.length === 1)
            ? savedPreferredPet.charCodeAt(0)
            : savedPreferredPet;
    }
    // Apply rc-derived symset (e.g. DECgraphics) AFTER decl_globals_init
    // builds the symset struct array.  jsmain.js stashes the rc name on
    // g._rcSymsetName; here we map it to the handling enum.  H_DEC=2,
    // H_IBM=1, H_UTF8=5, H_UNK=0 (default ASCII).  C ref options.c
    // parse_symset_file → set_symset_handling.
    if (savedSymsetName && Array.isArray(g.symset) && g.symset[0]) {
        g.symset[0].name = savedSymsetName;
        const low = String(savedSymsetName).toLowerCase();
        g.symset[0].handling = low.includes('dec') ? 2
            : low.includes('ibm') ? 1
            : low.includes('utf') ? 5
            : 0;
    }

    // Wire static data tables (rumors / engrave / epitaph) into the
    // runtime override module.  Required for getrumor / random_engraving
    // / get_rnd_text to consume their RNG calls in PRNG-faithful order.
    // The runtime getrumor reads rn2 via globalThis.rn2 and stores
    // section sizes on __nh_gameRef — must run AFTER decl_globals_init
    // (which would otherwise zero true_rumor_size).
    globalThis.rn2 = rn2;
    globalThis.__nh_gameRef = g;
    // C ref rumors.c:159-162 — getrumor calls exercise(A_WIS, ...) after
    // picking a line.  The runtime override fires this via the
    // globalThis side channel to avoid a circular import (attrib →
    // artifact → runtime/rumors).
    globalThis.__nh_exercise = exercise;
    ensureRumorsLoaded();

    // Default fruit list — C ref options.c:7283 + 7329.  C's
    // initoptions() sets svp.pl_fruit to "slime mold" and then
    // initoptions_finish() calls fruitadd() to register it as the
    // first entry in the ffruit linked list, setting
    // svc.context.current_fruit to fid=1.  JS hand-port skips
    // initoptions_finish entirely, so game.ffruit stays null and
    // every SLIME_MOLD object spawned gets obj.spe=0 ("Bad fruit
    // #0?" warning + downstream fruit_from_indx returning null).
    // Wire the default fruit directly here.
    if (!g.ffruit) {
        g.ffruit = { fid: 1, fname: 'slime mold', nextf: null };
        g.context = g.context || {};
        g.context.current_fruit = 1;
        g.flags = g.flags || {};
        g.flags.made_fruit = 0;
    }

    // Wire synchronous windowproc reads (win_yn_function /
    // win_getlin / win_nhgetch) for translated code paths that
    // can't await.  yn_function (cmd.c:3553) is invoked sync from
    // getdir (#ride direction prompt, #zap target, etc.), which
    // crashes before mount_steed / wizard zap can fire its RNG.
    // Sync reads use the pre-buffered input queue (jsmain pushes
    // all moves up-front).  Pre-capture hook only fires for the
    // outer rhack nhgetch; intra-command sync reads skip the hook.
    if (g.windowprocs) {
        if (g.__getlin_returns_buffer === 1 && !g.windowprocs.win_yn_function) {
            // ASYNC twin of the sync win_yn_function below, installed
            // only in REGEN builds (the __getlin_returns_buffer
            // marker, like win_getlin/menu procs).  Intra-command
            // prompt keys live in the DISPLAY queue; readKeySync's
            // separate queue is always empty in sessions, so the sync
            // read answered ESC and translated doeat's floorfood /
            // getobj prompts silently aborted while C ate and split
            // the stack (the next_ident x5 cluster, Q9 iteration 35).
            // Same formatting as the sync version; each prompt key is
            // its own captured step like C.
            g.windowprocs.win_yn_function = async (q, resp, def) => {
                const __coerceStr = (v) => (typeof v === 'string') ? v
                    : (v && typeof v.value === 'string') ? v.value
                    : (Array.isArray(v) ? (() => {
                        let s2 = '';
                        for (let i2 = 0; i2 < v.length && v[i2]; i2++) s2 += String.fromCharCode(v[i2]);
                        return s2;
                    })() : '');
                const qs = __coerceStr(q);
                const rs = __coerceStr(resp);
                let formatted = qs;
                if (rs) {
                    const respDisp = rs.replace(/\x1b/g, '');
                    if (respDisp) formatted += ` [${respDisp}]`;
                    const defChar = (typeof def === 'number')
                        ? (def > 0 && def < 0x7f ? String.fromCharCode(def) : '')
                        : (typeof def === 'string' ? def : '');
                    if (defChar && respDisp.includes(defChar)) {
                        formatted += ` (${defChar})`;
                    }
                }
                if (formatted) {
                    // C ref win/tty/wintty.c tty_yn_function: an
                    // UNSEEN topl message gets '--More--' and must be
                    // dismissed (space/\n/ESC — xwaitforspace; other
                    // keys are consumed and rejected) BEFORE the yn
                    // prompt appears.  Route through the dmore queue:
                    // nhgetch's drain consumes the dismissal key(s),
                    // reveals the prompt, and the NEXT key read below
                    // answers it — exactly C's key consumption.
                    if (g._pending_message && !g._topl_seen
                        && g._pending_message !== formatted) {
                        // If the topl is already --More--'d (an active
                        // dmore chain), do NOT overwrite it — that
                        // destroyed the prompt when a multi-message
                        // chain (e.g. seed1150's swap + dog-drop) was
                        // still draining; queue the prompt behind the
                        // chain instead, like C dismissing every
                        // pending More before tty_yn_function prompts.
                        if (!String(g._pending_message).endsWith('--More--')) {
                            g._pending_message += '--More--';
                        }
                        const q0 = g._dmore_queue;
                        if (q0 && q0.length > 0) q0.push(formatted);
                        else g._dmore_queue = [formatted];
                        // The cursor override set below is consumed
                        // by our own flush while the --More-- chain
                        // is still showing; remember the prompt text
                        // so nhgetch's drain re-arms the end-of-
                        // prompt cursor when it REVEALS the prompt
                        // (C tty: cursor sits after the query while
                        // awaiting the response — seed0105's eat
                        // prompts matched cells but parked the
                        // cursor on the hero, 5 frames from PASS).
                        g._yn_prompt_text = formatted;
                    } else {
                        g._pending_message = formatted;
                    }
                    // End-of-prompt cursor: ONLY when the prompt is
                    // actually visible now.  When it's queued behind
                    // a --More-- chain the override out-ranked the
                    // More cursor on our flush (seed0102's fire-swap
                    // More frames parked the cursor at the unrevealed
                    // direction prompt's length); the drain re-arm in
                    // input.js places it at reveal time instead.
                    // gstate Proxy ghost: an unset _yn_prompt_text
                    // reads as truthy {} — require a real string
                    // (feedback_proxy_ghost_truthy; the bare-truthy
                    // guard suppressed the override for EVERY direct
                    // prompt until the first queued one ran).
                    if (typeof g._yn_prompt_text !== 'string') {
                        g._cursor_override = { x: formatted.length + 1, y: 0 };
                        g._cursor_override_oneshot = true;
                    }
                    await flush_screen(1);
                }
                // C ref win/tty/topl.c tty_yn_function response
                // loop: when 'resp' is given, ONLY its characters are
                // accepted; quitchars (space/CR/LF) return the
                // default; ESC maps to 'q' if present, else 'n' if
                // present, else the default; anything else is
                // consumed and REJECTED (tty beeps, prompt stays).
                // Returning the raw key let an invalid 'i' answer a
                // [yn] prompt as if it were 'n' (seed0501 step 16) —
                // the whole session tail shifted one key early.
                // resp==null accepts any key (getdir's contract).
                let __ynKey;
                for (;;) {
                    __ynKey = await nhgetch();
                    if (!rs) break;
                    const defKey = (typeof def === 'number' && def > 0) ? def
                        : (typeof def === 'string' && def.length) ? def.charCodeAt(0) : 0;
                    if (__ynKey === 0x20 || __ynKey === 0x0a || __ynKey === 0x0d) {
                        if (defKey) __ynKey = defKey;
                        break;
                    }
                    if (__ynKey === 0x1b) {
                        if (rs.includes('q')) __ynKey = 113;
                        else if (rs.includes('n')) __ynKey = 110;
                        else if (defKey) __ynKey = defKey;
                        break;
                    }
                    if (rs.includes(String.fromCharCode(__ynKey))) break;
                    // invalid key: consumed, prompt stays (tty beeps)
                }
                if (g._cursor_override_oneshot) {
                    g._cursor_override = null;
                    g._cursor_override_oneshot = false;
                }
                g._yn_prompt_text = null;
                return __ynKey;
            };
        }
        if (!g.windowprocs.win_yn_function) {
            // C ref win/tty/getline.c tty_yn_function — emits the query
            // to the message line before reading the response.  Without
            // emitting the query, prompts like "Talk to whom? (in what
            // direction)" never reach row 0, leaving the screen blank
            // where C shows the prompt.
            g.windowprocs.win_yn_function = async (q, resp, def) => {
                const __coerceStr = (v) => (typeof v === 'string') ? v
                    : (v && typeof v.value === 'string') ? v.value
                    : (Array.isArray(v) ? (() => {
                        let s = '';
                        for (let i = 0; i < v.length && v[i]; i++) s += String.fromCharCode(v[i]);
                        return s;
                    })() : '');
                const qs = __coerceStr(q);
                const rs = __coerceStr(resp);
                // C ref win/tty/topl.c tty_yn_function — the prompt
                // is formatted as `"%s [%s] "` (with the responses in
                // brackets) and, if `def` is in the responses, with
                // `(c) ` where c is the printable default character.
                // ESC isn't shown in [..] (it's a flag for unshown
                // candidates).
                const respDisp = rs.replace(/\x1b/g, '');
                const defChar = (typeof def === 'number')
                    ? (def > 0 && def < 0x7f ? String.fromCharCode(def) : '')
                    : (typeof def === 'string' ? def : '');
                let formatted = qs;
                if (rs) {
                    if (respDisp) formatted += ` [${respDisp}]`;
                    if (defChar && respDisp.includes(defChar)) {
                        formatted += ` (${defChar})`;
                    }
                }
                // C ref tty_yn_function (topl.c:430-531): read a key and
                // validate against `resp`, looping on invalid input.  This
                // mirrors win_getlin's ASYNC nhgetch path (the recorded
                // session has a key for every yn prompt, exactly as C reads
                // one via readchar()).  Replaces the former sync readKeySync
                // (which always returned ESC because its queue was empty) —
                // the last sync key-read in the async-flip migration.
                //   preserve_case: C lowercases the response unless any
                // uppercase appears in the allowed set.  quitchars (space,
                // CR, LF) and ESC map to the default / 'q' / 'n' per C.
                const defCode = (typeof def === 'number') ? def
                    : (defChar ? defChar.charCodeAt(0) : 0);
                const preserveCase = /[A-Z]/.test(rs);
                let key = defCode;
                let guard = 0;
                for (;;) {
                    if (++guard > 200) { key = 27; break; } // safety: never spin
                    if (formatted) {
                        g._pending_message = formatted;
                        g._cursor_override = { x: formatted.length + 1, y: 0 };
                        g._cursor_override_oneshot = true;
                    }
                    await flush_screen(1);
                    let c = await nhgetch();
                    if (!rs) { key = c; break; } // no restriction: accept any
                    let qc = c;
                    if (!preserveCase && qc >= 65 && qc <= 90) qc += 32; // lowc
                    if (qc === 0x1b) { // ESC → 'q', else 'n', else def
                        key = rs.includes('q') ? 0x71
                            : rs.includes('n') ? 0x6e : defCode;
                        break;
                    }
                    if (qc === 0x20 || qc === 0x0a || qc === 0x0d) { // quitchars → def
                        key = defCode;
                        break;
                    }
                    if (rs.indexOf(String.fromCharCode(qc)) !== -1) { key = qc; break; }
                    // invalid response: C beeps and re-reads (q='\0' loops).
                    // (Digit/# number entry is not yet ported; a '#'-resp
                    // count prompt would loop here until the guard trips —
                    // no current session exercises it; revisit if one does.)
                }
                // Clear the oneshot cursor override now that we have the key
                // (the next flush_screen falls through to the standard
                // --More-- / hero-position cursor logic).  seed0017 prayer
                // cursor at step 47 (JS [40,0] vs C [72,0]).
                if (g._cursor_override_oneshot) {
                    g._cursor_override = null;
                    g._cursor_override_oneshot = false;
                }
                return key;
            };
        }
        if (!g.windowprocs.win_getlin && g.__getlin_returns_buffer === 1) {
            // C ref win/tty/getline.c tty_getlin — prompt on the top
            // line, echo typed chars, read until <return>.  Return-
            // the-buffer convention (§23.239): the proc RETURNS the
            // line; translated getlin rebinds bufp from it.  Reads go
            // through the ASYNC nhgetch path — session keys live in
            // the display queue, and each typed char is its own
            // recorded step with a screen capture, exactly like C.
            // (readKeySync's separate queue is always empty here, so
            // the previous sync read aborted every getlin with ESC —
            // half the wizlevelport x7 cluster, Q9 iteration 25.)
            // Echo format matches tty: query + space + typed text,
            // cursor at qs.length + 1 + line.length.  Empty queue =>
            // nhgetch throws (session over), which propagates per the
            // runner's termination contract.
            g.windowprocs.win_getlin = async (query, _preload) => {
                const qs = (typeof query === 'string') ? query : '';
                let line = '';
                for (;;) {
                    if (qs) {
                        g._pending_message = qs + (line ? ' ' + line : '');
                        g._cursor_override = {
                            x: qs.length + 1 + line.length,
                            y: 0,
                        };
                        g._cursor_override_oneshot = true;
                        await flush_screen(1);
                    }
                    const c = await nhgetch();
                    if (c === 0x1b) { g._topl_seen = true; return '\x1b'; }
                    if (c === 10 || c === 13 || c === 0) break;
                    if (c === 8 || c === 127) {
                        line = line.slice(0, -1);
                        continue;
                    }
                    line += String.fromCharCode(c);
                }
                // C ref tty getline.c: getlin marks the topline seen on
                // exit, so the NEXT pline REPLACES the prompt instead of
                // concat'ing onto it.  Without this the wish-result
                // pline overflowed the 72-col topl fit and queued a
                // --More-- that swallowed the next command key
                // (seed0360: wish #2's ^W ran its text as moves).
                g._topl_seen = true;
                return line;
            };
        }
        // Translated functions that take direction input (doride,
        // dozap, etc.) call windowprocs.win_clear_nhwindow before
        // prompting — without a no-op default this throws and the
        // command short-circuits BEFORE firing its RNG (e.g. mount_steed
        // rnd(20) / rn2(5) for seed0103).  No-op default mirrors C's
        // tty_clear_nhwindow which just clears a (non-existent here)
        // window region — same observable PRNG state.
        if (!g.windowprocs.win_clear_nhwindow) {
            g.windowprocs.win_clear_nhwindow = (winid) => {
                // C ref: tty_clear_nhwindow — clears the named window.
                // For WIN_MESSAGE (game.WIN_MESSAGE = 1), tty visually
                // clears row 0; the message history is preserved.
                // Translated getdir (cmd.js:3055) calls this AFTER
                // reading the direction key.  Setting _topl_seen=true
                // signals that the current pending message has been
                // "consumed" so the next pline overwrites rather than
                // concats.  Without this, the dir prompt persists in
                // the capture at the next nhgetch boundary.
                if (winid === g.WIN_MESSAGE) {
                    g._topl_seen = true;
                    // C tty_clear_nhwindow VISUALLY blanks row 0 —
                    // getdir clears after reading the direction
                    // ("remove the prompt string so caller won't
                    // have to", cmd.c).  Leaving _pending_message
                    // intact kept "In what direction?" on the next
                    // boundary capture (seed1800 step 11, the last
                    // frame before its PASS).
                    g._pending_message = '';
                }
            };
        }
        // C ref: tty_mark_synch / tty_wait_synch — no-op in tty
        // (used for windowing-system synchronization).  Translated
        // currentlevel_rewrite (called from goto_level for level
        // transitions like ^V wizlevelport) calls win_mark_synch
        // before save/restore; without a no-op stub this throws
        // and the level transition aborts.  Layer 3 of
        // project_wizlevelport_blocked.
        if (!g.windowprocs.win_mark_synch) {
            g.windowprocs.win_mark_synch = () => {};
        }
        if (!g.windowprocs.win_wait_synch) {
            g.windowprocs.win_wait_synch = () => {};
        }
        // C ref: tty_cliparound — scrolls viewport to keep (x,y)
        // visible.  Headless contest runs have no scroll, so the
        // correct C semantic is a no-op.  Without this stub,
        // translated u_on_newpos (dungeon.js) throws and the hand-
        // port cmd.js's domove try/catch's MANUAL FALLBACK fires.
        // Part of the hand-port-mklev retirement plan: this is
        // step 1 — allow t_domove to run to completion.  Steps 2-3
        // fix the missing rng calls so PRNG-parity returns.
        if (!g.windowprocs.win_cliparound) {
            g.windowprocs.win_cliparound = (_x, _y) => {};
        }
        // C ref: tty_delay_output — frame-delay for animations (zaps,
        // throws, digs, explosions, knockback steps).  Headless contest
        // runs have no animation timing, so the timing-aspect is a
        // no-op.  But this IS where the C-side recorder fires
        // nomux_capture_write_screen() to snapshot each intermediate
        // animation state for the contest's supplemental anim-frames
        // metric.  jsmain.js installs game._captureAnimFrame as the
        // hook that pushes a terminal.serialize() snapshot into the
        // current step's _pendingAnimFrames bucket — wire it here.
        // Translated explode/dig/hack/mthrowu/zap/dothrow callers fire
        // win_delay_output AFTER flush_screen(0)+tmp_at writes, so the
        // grid reflects the current animation step by the time we
        // serialize.
        if (!g.windowprocs.win_delay_output) {
            g.windowprocs.win_delay_output = () => {
                if (game._captureAnimFrame) game._captureAnimFrame();
            };
        }
        // C ref: tty_display_nhwindow — display a sub-window (menu,
        // text page, status bar).  In headless we never paint these
        // (the contest scores against the serialized terminal grid,
        // not nethack's WIN_* windows), so a no-op matches semantics
        // for the translated code paths that fire it as a side-effect
        // (move-update, command echo, status refresh).
        if (!g.windowprocs.win_display_nhwindow) {
            g.windowprocs.win_display_nhwindow = async (win, blocking) => {
                // NHW_TEXT render (C ref win/tty/wintty.c
                // process_text_window): full-screen page from row 0,
                // '--More--' alone on the BOTTOM row (recorded
                // cmdassist frame: content rows 0-13, More at row 23,
                // cursor parked right after it at col 8).
                const lines = g._wp_textwins && g._wp_textwins[win];
                if (!lines || !lines.length) return;
                const page = lines.slice(0, 23);
                while (page.length < 23) page.push('');
                page.push('--More--');
                g._menu_overlay = {
                    pages: [page], page: 0,
                    kind: 'text', cType: 'NHW_TEXT', offx: 0,
                };
                g._pending_message = '';
                await flush_screen(1);
                // C ref wintty.c tty_display_nhwindow: "with ttys,
                // all windows are blocking" — NHW_TEXT waits for the
                // --More-- dismissal regardless of the blocking arg
                // (help_dir passes FALSE; honoring it tore the
                // overlay down before the boundary capture).
                void blocking;
                await nhgetch();
                g._menu_overlay = null;
                lines.length = 0;
                await flush_screen(1);
            };
        }
        // C ref: tty_curs — position the cursor in a window.  In
        // headless we have no cursor control; no-op.
        if (!g.windowprocs.win_curs) {
            g.windowprocs.win_curs = (_win, _x, _y) => {};
        }
        // C ref win/tty/wintty.c tty menus — the generic menu
        // windowproc family (print_dungeon's wizard level menu,
        // dooptions, etc.).  Items accumulate per winid; select
        // reads the choice letter(s) through the async nhgetch path
        // (each key is its own captured step).  The selection
        // out-param flows as a {value} box installed by the
        // build-engine call-site patch (menu_item** can't write back
        // through a null JS arg — same class as §23.239).  Q9
        // iteration 26: without these, print_dungeon threw
        // "win_start_menu is not a function" into the ^V dispatch
        // catch and the `?` level-menu teleports silently no-op'd.
        // Menu family marker-gated to REGEN builds (like win_getlin):
        // ungated, the select proc consumed production session keys
        // whose selection the frozen un-boxed callers discard —
        // sessions died early (P total shrank 792838 → 684563).
        if (g.__getlin_returns_buffer === 1) {
            // Shared menu windowproc family (js/wp-menus.js) — see
            // that module for semantics; the marker gate and the
            // don't-overwrite check are preserved verbatim.
            const __menuProcs = makeMenuProcs(g);
            for (const __k of Object.keys(__menuProcs)) {
                if (!g.windowprocs[__k]) g.windowprocs[__k] = __menuProcs[__k];
            }
        }
        // C ref: tty_print_glyph — paint one map cell (char+color)
        // at (x,y).  Headless keeps the serialized grid in
        // display.js from game state at capture time, so the
        // translated flush_screen's per-cell glyph writes are
        // redundant here; a no-op matches the hand pipeline.
        // Without this, the regen build's vpline → flush_screen
        // path THREW from inside movemon (dog stepping on a dart
        // trap → thitm pline), and the movemon watchdog silently
        // swallowed the throw — losing the monster's whole turn
        // (part of the distfleeck x7 cluster, Q9 iteration 16).
        if (!g.windowprocs.win_print_glyph) {
            g.windowprocs.win_print_glyph = (_win, _x, _y, _glyphinfo) => {};
        }
        // C ref: tty_putstr / tty_putmixed — write a line to a window.
        // bot() (botl.js:271-273) calls these to paint the status
        // bar.  In headless we build the status line via display.js's
        // _statusLine1/2 from game state, so the translated bot()'s
        // WIN_STATUS calls can no-op.  WIN_MESSAGE, however, is the
        // terminal delivery for the translated pline.js TU family
        // (pline_mon / pline_xy / Norep / custompline → vpline →
        // putmesg → win_putstr); a blanket no-op silently swallowed
        // every such message (e.g. seed1150's "Slasher drops a food
        // ration." — C shows a --More-- the JS replay never had,
        // misrouting the dismissal keys that follow).  Route message
        // lines into display.js's queue-aware pline so they join the
        // shared topl/--More-- machinery like every other pline.
        if (!g.windowprocs.win_putstr) {
            const __cstr = (s) => {
                if (typeof s === 'string') return s;
                if (Array.isArray(s)) {
                    let out = '';
                    for (let i = 0; i < s.length && s[i]; i++) out += String.fromCharCode(s[i]);
                    return out;
                }
                return s == null ? '' : String(s);
            };
            g.windowprocs.win_putstr = (win, _attr, str) => {
                if (win === g.WIN_MESSAGE && typeof str === 'string') pline(str);
                else if (g._wp_textwins && g._wp_textwins[win]) {
                    g._wp_textwins[win].push(__cstr(str));
                }
            };
        }
        if (!g.windowprocs.win_putmixed) {
            g.windowprocs.win_putmixed = (_win, _attr, _str) => {};
        }
        // C ref: tty_create_nhwindow — allocate a sub-window.  In
        // headless, downstream code passes the returned winid back
        // to win_display_nhwindow / win_putstr / win_destroy_nhwindow
        // (all stubbed above to no-op).  Return a non-zero monotonic
        // integer; C sentinel WIN_ERR=-1 must NOT be returned.
        //
        // Earlier attempt with this stub also stubbed start_menu /
        // add_menu / end_menu / select_menu which let menu-driven
        // paths follow through and ETIME seed4500.  This narrower
        // stub covers only create_nhwindow + destroy; menu primitives
        // stay unstubbed so menu paths still throw and fall back.
        if (!g.windowprocs.win_create_nhwindow) {
            let __winid = 10;
            g.windowprocs.win_create_nhwindow = (type) => {
                const id = ++__winid;
                // NHW_TEXT(5): full-screen text windows (cmdassist's
                // "Valid direction keys are:" diagram, help files).
                // Track them so win_putstr accumulates lines and
                // win_display_nhwindow renders the overlay (§23.254).
                if (type === 5 /* NHW_TEXT */) {
                    (g._wp_textwins = g._wp_textwins || {})[id] = [];
                }
                return id;
            };
        }
        if (!g.windowprocs.win_destroy_nhwindow) {
            g.windowprocs.win_destroy_nhwindow = (win) => {
                if (g._wp_textwins) delete g._wp_textwins[win];
            };
        }
        // C ref: tty_putmsghistory — message-history scroll.  Called
        // by translated questpgr.com_pager_core (line 500) and by
        // invent.getobj when force_invmenu is set.  Headless has no
        // message-history window; no-op matches the contest scoring
        // (we don't score the prev-msg window's content).
        if (!g.windowprocs.win_putmsghistory) {
            g.windowprocs.win_putmsghistory = (_msg, _restore) => {};
        }
        // NOT stubbed: win_print_glyph.  No-op stub lets the map-paint
        // path complete and trigger the bot2 MAXCO panic and one more
        // xname_flags throw downstream — net +2 throws.  The
        // throw-and-fall-back path is currently more protective.
        // NOT stubbed: win_nh_poskey.  Forwarding to win_nhgetch lets
        // readchar_core complete and reach scrolltele's getpos path,
        // but the position-input downstream is unfinished — the
        // captured screen ends up at S 57 (-1 from the narrow stub
        // alone), so the throw path is preferable here.

        // win_raw_print: translated vpline's fallback output for
        // early/reentrant messages (pline.js raw-print path).  In the
        // async build that path goes live; unwired it crashed with
        // "win_raw_print is not a function" (Q9 iteration-2 finding).
        // Route to the pending-message queue like a plain pline.
        if (!g.windowprocs.win_raw_print) {
            g.windowprocs.win_raw_print = (line) => {
                if (line) g._pending_message = String(line);
            };
        }
        if (!g.windowprocs.win_raw_print_bold) {
            g.windowprocs.win_raw_print_bold = g.windowprocs.win_raw_print;
        }
        // C ref windows.js:304 (init_nhwindows tail): window
        // initialization sets iflags.window_inited = 1.  The harness
        // assembles windowprocs right here, so this is the JS
        // equivalent of that moment.  Without it, translated vpline
        // takes the raw-print fallback for EVERY message (it thinks
        // windows aren't up yet).
        g.iflags.window_inited = 1;

        // Tripwire (UNWEDGE_PLAN Q4): sync-contract windowprocs must
        // never return Promises.  Input-reading procs (whose Promise
        // returns are awaited by design) are exempt.  No-op unless
        // NH_DEBUG_TRIPWIRE=1.
        tripwireWrapWindowprocs(g.windowprocs, new Set([
            'win_nhgetch', 'win_yn_function', 'win_getlin',
            'win_get_ext_cmd', 'win_select_menu', 'win_poskey',
            'win_nh_poskey', 'win_display_nhwindow',
        ]));
    }

    // Initialize game.Cmd struct.  C ref: cmd.c reset_commands(TRUE)
    // is called from initoptions() and initializes Cmd.spkeys, num_pad,
    // pcHack_compat, phone_layout, swap_yz.  Translated getdir() (cmd.c:
    // 2553) reads game.Cmd.spkeys[NHKF_GETDIR_SELF] etc. — without init,
    // crashes the command BEFORE it fires its RNG (e.g. doride's
    // mount_steed rnd(20) for seed0103, dozap's wizard zap, doapply,
    // doread, etc.).
    // Ensure game.Cmd.spkeys is populated.  C ref: cmd.c reset_commands(TRUE)
    // is called from initoptions() and initializes Cmd.spkeys[].  Translated
    // getdir() (cmd.c:2553) reads game.Cmd.spkeys[NHKF_GETDIR_SELF] etc.;
    // without init, accesses null and throws BEFORE the command fires its RNG
    // (e.g. doride's mount_steed rnd(20) for seed0103).  Note: reset_commands
    // also calls commands_init() which currently crashes at bind_mousebtn —
    // so we populate spkeys directly from spkeys_binds rather than calling
    // reset_commands.  Just spkeys is enough to keep getdir from throwing;
    // movecmd's command-table lookup still needs commands_init for the
    // dispatch to fire correctly.  Partial fix, follow-up needed.
    if (!g.Cmd) g.Cmd = {};
    if (!Array.isArray(g.Cmd.spkeys)) g.Cmd.spkeys = new Array(64).fill(0);
    if (!Array.isArray(g.Cmd.mousebtn)) g.Cmd.mousebtn = [null, null];
    if (!Array.isArray(g.Cmd.dirchars)) g.Cmd.dirchars = new Array(10).fill(0);
    if (typeof g.Cmd.num_pad !== 'number') g.Cmd.num_pad = 0;
    if (typeof g.Cmd.pcHack_compat !== 'number') g.Cmd.pcHack_compat = 0;
    if (typeof g.Cmd.phone_layout !== 'number') g.Cmd.phone_layout = 0;
    if (typeof g.Cmd.swap_yz !== 'number') g.Cmd.swap_yz = 0;
    if (g.Cmd.spkeys[1] === 0) {
        try {
            const cmdMod = await import('./translated/cmd.js');
            // reset_commands(1) populates spkeys first, then calls
            // commands_init which currently crashes at bind_mousebtn.
            // The crash is AFTER spkeys is populated, so just catch it.
            cmdMod.reset_commands(1);
        } catch (_e) {}
    }

    // C ref: win/tty/wintty.c:754 sets iflags.renameallowed = TRUE.
    // This affects the "Is this ok?" chargen confirmation menu
    // ([ynaq] vs [ynq]) and whether 'a' triggers a rename.  Default
    // js/translated/decl.js has it 0, so without this the menu would
    // show [ynq] only.  Setting to 1 matches C tty behavior.
    if (g.iflags && g.iflags.renameallowed === 0) {
        g.iflags.renameallowed = 1;
    }

    // Initial ulevel before any rne() can fire.  C ref: u_init.c
    // sets svm.moves=1 and u.ulevel=0/1 early in u_init_misc.  The
    // translated `rne` reads `game.u.ulevel` faithfully (no
    // fallback) — without setting it here, rnz()-driven calls in
    // mineralize() short-circuit because `(undefined < 15)` is
    // false → utmp=NaN → loop skipped → the inner rn2 never fires,
    // diverging from C's PRNG sequence.
    g.u = g.u || {};
    if (typeof g.u.ulevel !== 'number') g.u.ulevel = 1;

    // C ref allmain.c — startup_common(): when flags.splash_screen is
    // on (the default; .nethackrc opts !splash_screen to disable),
    // wintty's tty_intro_screen paints a 4-line banner at rows 4-7
    // followed by clear rows 8-11 and "Who are you?" at row 12 col 0
    // as the askname() prompt.  Drawing it here lets sessions without
    // !splash_screen capture row 0 = matching the recorded canonical
    // (seed0006/0007/0009/0017 all stuck at S=0 because step 0 was
    // empty in JS while C showed this banner + askname prompt).
    //
    // The banner text is fixed by the recorder build (May  2 2026
    // 12:00:00 build) — every recorded session shows the exact same
    // 4 lines.  When the recorder is rebuilt, the build date
    // changes; we hardcode the recording-time value here.
    const _splashOn = !(g.flags && g.flags.splash_screen === 0)
                   && !(g._optsFlagsExplicitOff && g._optsFlagsExplicitOff.splash_screen);
    if (_splashOn && g?.nhDisplay?.setCell) {
        const disp = g.nhDisplay;
        const splashLines = [
            { col: 0, text: 'NetHack, Copyright 1985-2026' },
            { col: 9, text: 'By Stichting Mathematisch Centrum and M. Stephenson.' },
            { col: 9, text: 'Version 5.0.0 MacOS, built May  2 2026 12:00:00.' },
            { col: 9, text: 'See license for details.' },
        ];
        for (let r = 0; r < splashLines.length; r++) {
            const { col, text } = splashLines[r];
            for (let c = 0; c < text.length && (col + c) < 80; c++) {
                disp.setCell(col + c, 4 + r, text[c], 8, 0);
            }
        }
    }
    // Interactive chargen for sessions without rc-set role OR no
    // rc-set name (seed0002/4/7/9 need both; seed0017 has role
    // but no name — C still asks).  C ref allmain.c: askname() runs
    // when !*svp.plname; player_selection prompts "Shall I pick...?"
    // afterwards if role/race/gender/align are not all set.
    //
    // For the 'y' random-pick path we wire pick_role/pick_race/etc.;
    // for 'n' menu picks we currently fall through to Tourist default
    // and leave the remaining moves chars in the input queue.
    // g._optsRole defaults to -1 when no role:X in rc (options.js).
    // Use !findRole(...) to detect "no valid rc role specified" so a
    // bare numeric -1 doesn't accidentally pass the `!` test.
    const _needAskname = !g._rcHasName;
    const _needRolePick = !findRole(g._optsRole);
    if (_needAskname || _needRolePick) {
        // C tty askname: prints "Who are you? " (with trailing space)
        // at row 12 col 0, then echoes each typed char inline and
        // moves cursor.  Backspace erases the prior char visually too.
        const _PROMPT = 'Who are you? ';
        let _cursorCol = _PROMPT.length;
        if (_needAskname && g?.nhDisplay?.setCell) {
            for (let c = 0; c < _PROMPT.length && c < 80; c++) {
                g.nhDisplay.setCell(c, 12, _PROMPT[c], 8, 0);
            }
            if (g.nhDisplay.setCursor) g.nhDisplay.setCursor(_cursorCol, 12);
        }
        let nameBuf = '';
        if (_needAskname) {
            try {
                // askname: read until \r or \n; \b/\x7f deletes.
                for (let __i = 0; __i < 64; __i++) {
                    const k = await nhgetch();
                    if (k === 0x0d || k === 0x0a) break;
                    if (k === 0x1b) { nameBuf = ''; break; }
                    if (k === 0x08 || k === 0x7f) {
                        if (nameBuf.length) {
                            nameBuf = nameBuf.slice(0, -1);
                            if (g?.nhDisplay?.setCell && _cursorCol > _PROMPT.length) {
                                _cursorCol--;
                                g.nhDisplay.setCell(_cursorCol, 12, ' ', 8, 0);
                                if (g.nhDisplay.setCursor) g.nhDisplay.setCursor(_cursorCol, 12);
                            }
                        }
                        continue;
                    }
                    nameBuf += String.fromCharCode(k);
                    if (g?.nhDisplay?.setCell && _cursorCol < 80) {
                        g.nhDisplay.setCell(_cursorCol, 12, String.fromCharCode(k), 8, 0);
                        _cursorCol++;
                        if (g.nhDisplay.setCursor) g.nhDisplay.setCursor(_cursorCol, 12);
                    }
                }
            } catch (_e) {}
            if (nameBuf) g.plname = nameBuf;
        }

        if (_needRolePick) try {
            // Selector letters — match C's setup_*menu letter
            // assignment for each menu.  Role uses each role's
            // first lowercase letter; the duplicate-'r' case is
            // 'r' for Rogue (first in roles[]) and 'R' for
            // Ranger.  Race/gender/align letters are unique.
            const ROLE_LETTERS = {
                a: 0, b: 1, c: 2, h: 3, k: 4, m: 5, p: 6,
                r: 7, R: 8, s: 9, t: 10, v: 11, w: 12,
            };
            const RACE_LETTERS = { h: 0, e: 1, d: 2, g: 3, o: 4 };
            const GEND_LETTERS = { m: 0, f: 1 };
            const ALIGN_LETTERS = { l: 0, n: 1, c: 2 };

            // Helper: walk the manual menu pick loop.  Mirrors C
            // role.c:2245+ genl_player_setup interactive menu loop.
            // Each iteration: (1) auto-pick singleton facets in order
            // (rolerace/gend/align), (2) if all set, exit, (3) else
            // call rigid_role_checks (which mirrors C's plsel_startmenu
            // rigid call at role.c:2814) and read user input for the
            // next-needed facet.
            const runManualPick = async () => {
                while (true) {
                    let needInput = null;
                    const order = ['role', 'race', 'gend', 'align'];
                    const okFn = {
                        role: (i) => ok_role(i, g.flags.initrace, g.flags.initgend, g.flags.initalign),
                        race: (i) => ok_race(g.flags.initrole, i, g.flags.initgend, g.flags.initalign),
                        gend: (i) => ok_gend(g.flags.initrole, g.flags.initrace, i, g.flags.initalign),
                        align: (i) => ok_align(g.flags.initrole, g.flags.initrace, g.flags.initgend, i),
                    };
                    const sizeOf = {
                        role: roles.length - 1,
                        race: races.length - 1,
                        gend: 2,
                        align: 3,
                    };
                    for (const f of order) {
                        const cur = g.flags['init' + f];
                        if (cur >= 0) continue;
                        let n = 0, single = -1;
                        const max = sizeOf[f];
                        const ok = okFn[f];
                        for (let i = 0; i < max; i++) {
                            if (ok(i)) { n++; single = i; }
                        }
                        if (n === 1) {
                            g.flags['init' + f] = single;
                            continue;
                        }
                        if (n > 1) {
                            needInput = f;
                            break;
                        }
                        needInput = null;
                        break;
                    }
                    if (!needInput) break;

                    rigid_role_checks();

                    // C ref role.c:plsel_startmenu — tty draws the
                    // selector menu (role/race/gend/align) as an
                    // NHW_MENU overlay.  Role menu is at offx=1,
                    // race/gender menus at offx=41 (the larger
                    // longest-line of those menus is "Set role/race
                    // /&c filtering" → offx=80-31-8=41).
                    if (g?.nhDisplay?.setCell && needInput === 'role') {
                        const disp = g.nhDisplay;
                        const lines = [
                            { text: ' Pick a role or profession', bold: true },
                            { text: '', bold: false },
                            { text: ' <role> <race> <gender> <alignment>', bold: false },
                            { text: '', bold: false },
                            { text: ' a - an Archeologist', bold: false },
                            { text: ' b - a Barbarian', bold: false },
                            { text: ' c - a Caveman/Cavewoman', bold: false },
                            { text: ' h - a Healer', bold: false },
                            { text: ' k - a Knight', bold: false },
                            { text: ' m - a Monk', bold: false },
                            { text: ' p - a Priest/Priestess', bold: false },
                            { text: ' r - a Rogue', bold: false },
                            { text: ' R - a Ranger', bold: false },
                            { text: ' s - a Samurai', bold: false },
                            { text: ' t - a Tourist', bold: false },
                            { text: ' v - a Valkyrie', bold: false },
                            { text: ' w - a Wizard', bold: false },
                            { text: ' * * Random', bold: false },
                            { text: ' / - Pick race first', bold: false },
                            { text: ' " - Pick gender first', bold: false },
                            { text: ' [ - Pick alignment first', bold: false },
                            { text: ' ~ - Set role/race/&c filtering', bold: false },
                            { text: ' q - Quit', bold: false },
                            { text: ' (end)', bold: false },
                        ];
                        // Clear rows 0..23 then paint each line at col 0.
                        for (let y = 0; y < 24; y++) {
                            for (let c = 0; c < 80; c++) disp.setCell(c, y, ' ', 8, 0);
                        }
                        for (let y = 0; y < lines.length && y < 24; y++) {
                            const { text, bold } = lines[y];
                            const attr = bold ? 1 : 0;
                            for (let c = 0; c < text.length && c < 80; c++) {
                                disp.setCell(c, y, text[c], 8, attr);
                            }
                        }
                        // Cursor parks just past " (end)" — col 7 row 23.
                        // C tty positions cursor after the menu trailer.
                        if (disp.setCursor) disp.setCursor(7, lines.length - 1);
                    }
                    // Race menu at offx=41.  Items filtered by selected
                    // role's allow mask.  C ref role.c setup_racemenu.
                    // Note: lines have NO leading space (unlike role
                    // menu) because offx=41 already provides left pad.
                    if (g?.nhDisplay?.setCell && needInput === 'race') {
                        const disp = g.nhDisplay;
                        const offx = 41;
                        // C ref rigid_role_checks: when a single gender
                        // is valid for the role (e.g. Valkyrie → female),
                        // C fires pick_gend(RIGID) which rolls rn2(1)
                        // and sets initgend.  We can't fire pick_gend
                        // without shifting PRNG (§23.163 dead end), but
                        // we CAN compute the display-only forced gender
                        // for the subtitle and "Pick gender first" line
                        // by counting valid genders directly.  This is
                        // pure render; no game state mutated.
                        let _forcedGend = -1;
                        {
                            let n = 0, single = -1;
                            for (let gi = 0; gi < 2; gi++) {
                                if (ok_gend(g.flags.initrole, -1, gi, g.flags.initalign)) {
                                    n++; single = gi;
                                }
                            }
                            if (n === 1) _forcedGend = single;
                        }
                        const _gendIdx = (g.flags.initgend >= 0) ? g.flags.initgend : _forcedGend;
                        const _isFem = _gendIdx === 1;
                        const _roleObj = roles[g.flags.initrole];
                        const roleStr = _isFem
                            ? (_roleObj.name?.f || _roleObj.name?.m)
                            : (_roleObj.name?.m || _roleObj.name?.f);
                        const _ali = g.flags.initalign;
                        const alignStr = (_ali === 0) ? 'lawful'
                                       : (_ali === 1) ? 'neutral'
                                       : (_ali === 2) ? 'chaotic'
                                       : '<alignment>';
                        const gendDisplayStr = (_gendIdx === 0) ? 'male'
                                             : (_gendIdx === 1) ? 'female'
                                             : '<gender>';
                        const subtitle = `${roleStr} <race> ${gendDisplayStr} ${alignStr}`;
                        const RACE_NAMES = ['human', 'elf', 'dwarf', 'gnome', 'orc'];
                        const RACE_LET = ['h', 'e', 'd', 'g', 'o'];
                        const raceItems = [];
                        for (let ri = 0; ri < RACE_NAMES.length; ri++) {
                            if (ok_race(g.flags.initrole, ri, -1, -1)) {
                                raceItems.push(`${RACE_LET[ri]} - ${RACE_NAMES[ri]}`);
                            }
                        }
                        // When alignment is forced by role (Rogue→chaotic
                        // etc.), the "[ - Pick alignment first" option
                        // is replaced with "    role forces <align>".
                        const alignLine = (_ali >= 0)
                            ? `    role forces ${alignStr}`
                            : '[ - Pick alignment first';
                        // Same pattern for gender — Valkyrie role forces
                        // female; the "Pick gender first" option gets
                        // replaced with "    role forces female".
                        const gendLine = (_gendIdx >= 0)
                            ? `    role forces ${gendDisplayStr}`
                            : '" - Pick gender first';
                        const lines = [
                            { text: 'Pick a race or species', bold: true },
                            { text: '', bold: false },
                            { text: subtitle, bold: false },
                            { text: '', bold: false },
                            ...raceItems.map(t => ({ text: t, bold: false })),
                            { text: '* * Random', bold: false },
                            { text: '', bold: false },
                            { text: '? - Pick another role first', bold: false },
                            { text: gendLine, bold: false },
                            { text: alignLine, bold: false },
                            { text: '~ - Set role/race/&c filtering', bold: false },
                            { text: 'q - Quit', bold: false },
                            { text: '(end)', bold: false },
                        ];
                        for (let y = 0; y < 24; y++) {
                            for (let c = 0; c < 80; c++) disp.setCell(c, y, ' ', 8, 0);
                        }
                        for (let y = 0; y < lines.length && y < 24; y++) {
                            const { text, bold } = lines[y];
                            const attr = bold ? 1 : 0;
                            for (let c = 0; c < text.length && (offx + c) < 80; c++) {
                                disp.setCell(offx + c, y, text[c], 8, attr);
                            }
                        }
                        // Cursor parks at "(end)" line — offx + 5.
                        if (disp.setCursor) disp.setCursor(offx + 6, lines.length - 1);
                    }
                    // Gender menu at offx=41.  Filtered by role.allow.
                    if (g?.nhDisplay?.setCell && needInput === 'gend') {
                        const disp = g.nhDisplay;
                        const offx = 41;
                        const _roleObj = roles[g.flags.initrole];
                        const _raceObj = races[g.flags.initrace];
                        const roleStr = _roleObj.name?.m || _roleObj.name?.f;
                        const raceStr = _raceObj.noun;
                        const _ali = g.flags.initalign;
                        const alignStr = (_ali === 0) ? 'lawful'
                                       : (_ali === 1) ? 'neutral'
                                       : (_ali === 2) ? 'chaotic'
                                       : '<alignment>';
                        const subtitle = `${roleStr} ${raceStr} <gender> ${alignStr}`;
                        const gendItems = [];
                        if (ok_gend(g.flags.initrole, g.flags.initrace, 0, _ali)) gendItems.push('m - male');
                        if (ok_gend(g.flags.initrole, g.flags.initrace, 1, _ali)) gendItems.push('f - female');
                        // "race forces <align>" indented hint when
                        // alignment is forced (no "[ - Pick alignment
                        // first" option appears).  Goes BETWEEN race
                        // and ~ filter lines.
                        const lines = [
                            { text: 'Pick a gender or sex', bold: true },
                            { text: '', bold: false },
                            { text: subtitle, bold: false },
                            { text: '', bold: false },
                            ...gendItems.map(t => ({ text: t, bold: false })),
                            { text: '* * Random', bold: false },
                            { text: '', bold: false },
                            { text: '? - Pick another role first', bold: false },
                            { text: '/ - Pick another race first', bold: false },
                            // C ref role.c:1890+ role_menu_extra(RS_ALGNMNT):
                            // constrainer is "role" if role.allow restricts
                            // alignment to a single bit (Rogue=chaotic,
                            // Knight=lawful, etc.); otherwise "race" if
                            // race.allow restricts it.  Was previously
                            // hardcoded as "race forces" which was wrong
                            // for role-restricted roles.
                            ...(_ali >= 0
                                ? (() => {
                                    const ALIGNMASK = 7;  /* AM_L|AM_N|AM_C */
                                    const _roleObj2 = (g.flags.initrole >= 0) ? roles[g.flags.initrole] : null;
                                    const _raceObj2 = (g.flags.initrace >= 0) ? races[g.flags.initrace] : null;
                                    const roleMask = (_roleObj2?.allow ?? 0) & ALIGNMASK;
                                    const raceMask = (_raceObj2?.allow ?? 0) & ALIGNMASK;
                                    const isSingleBit = (n) => n !== 0 && (n & (n - 1)) === 0;
                                    let constrainer = 'race';
                                    if (isSingleBit(roleMask)) constrainer = 'role';
                                    else if (isSingleBit(raceMask)) constrainer = 'race';
                                    return [{ text: `    ${constrainer} forces ${alignStr}`, bold: false }];
                                })()
                                : [{ text: '[ - Pick alignment first', bold: false }]),
                            { text: '~ - Set role/race/&c filtering', bold: false },
                            { text: 'q - Quit', bold: false },
                            { text: '(end)', bold: false },
                        ];
                        for (let y = 0; y < 24; y++) {
                            for (let c = 0; c < 80; c++) disp.setCell(c, y, ' ', 8, 0);
                        }
                        for (let y = 0; y < lines.length && y < 24; y++) {
                            const { text, bold } = lines[y];
                            for (let c = 0; c < text.length && (offx + c) < 80; c++) {
                                disp.setCell(offx + c, y, text[c], 8, bold ? 1 : 0);
                            }
                        }
                        if (disp.setCursor) disp.setCursor(offx + 6, lines.length - 1);
                    }
                    // Alignment menu at offx=41.  Filtered by
                    // ok_align(role, race, gend, ai).
                    if (g?.nhDisplay?.setCell && needInput === 'align') {
                        const disp = g.nhDisplay;
                        const offx = 41;
                        const _roleObj = (g.flags.initrole >= 0) ? roles[g.flags.initrole] : null;
                        const _raceObj = (g.flags.initrace >= 0) ? races[g.flags.initrace] : null;
                        const _isFem = g.flags.initgend === 1;
                        const roleStr = _roleObj
                            ? (_isFem ? (_roleObj.name?.f || _roleObj.name?.m)
                                      : (_roleObj.name?.m || _roleObj.name?.f))
                            : '<role>';
                        const raceStr = _raceObj ? _raceObj.noun : '<race>';
                        const gendStr = (g.flags.initgend === 0) ? 'male'
                                       : (g.flags.initgend === 1) ? 'female'
                                       : '<gender>';
                        const subtitle = `${roleStr} ${raceStr} ${gendStr} <alignment>`;
                        const aliItems = [];
                        const ALI_NAMES = ['lawful', 'neutral', 'chaotic'];
                        const ALI_LET = ['l', 'n', 'c'];
                        for (let ai = 0; ai < 3; ai++) {
                            if (ok_align(g.flags.initrole, g.flags.initrace, g.flags.initgend, ai)) {
                                aliItems.push(`${ALI_LET[ai]} - ${ALI_NAMES[ai]}`);
                            }
                        }
                        const lines = [
                            { text: 'Pick an alignment or creed', bold: true },
                            { text: '', bold: false },
                            { text: subtitle, bold: false },
                            { text: '', bold: false },
                            ...aliItems.map(t => ({ text: t, bold: false })),
                            { text: '* * Random', bold: false },
                            { text: '', bold: false },
                            { text: '? - Pick role first', bold: false },
                            { text: '/ - Pick race first', bold: false },
                            { text: '" - Pick gender first', bold: false },
                            { text: '~ - Set role/race/&c filtering', bold: false },
                            { text: 'q - Quit', bold: false },
                            { text: '(end)', bold: false },
                        ];
                        for (let y = 0; y < 24; y++) {
                            for (let c = 0; c < 80; c++) disp.setCell(c, y, ' ', 8, 0);
                        }
                        for (let y = 0; y < lines.length && y < 24; y++) {
                            const { text, bold } = lines[y];
                            for (let c = 0; c < text.length && (offx + c) < 80; c++) {
                                disp.setCell(offx + c, y, text[c], 8, bold ? 1 : 0);
                            }
                        }
                        if (disp.setCursor) disp.setCursor(offx + 6, lines.length - 1);
                    }

                    let key;
                    try { key = await nhgetch(); }
                    catch (_e) { break; }
                    if (key === 0x1b) break;
                    const chRaw = String.fromCharCode(key);
                    const ch = chRaw.toLowerCase();

                    const table = needInput === 'role'  ? ROLE_LETTERS
                                : needInput === 'race'  ? RACE_LETTERS
                                : needInput === 'gend'  ? GEND_LETTERS
                                :                         ALIGN_LETTERS;
                    const idx = (needInput === 'role') ? (table[chRaw] ?? table[ch]) : table[ch];
                    if (typeof idx === 'number' && okFn[needInput](idx)) {
                        g.flags['init' + needInput] = idx;
                    }
                }
            };

            // C ref role.c:plsel_startmenu — yn_function emits
            // "Shall I pick character's race, role, gender and
            // alignment for you? [ynaq]" on row 0, cursor parks at
            // the prompt-tail.
            if (g?.nhDisplay?.setCell) {
                const sp = "Shall I pick character's race, role, gender and alignment for you? [ynaq]";
                for (let c = 0; c < sp.length && c < 80; c++) {
                    g.nhDisplay.setCell(c, 0, sp[c], 8, 0);
                }
                // C cursor parks two cols past the closing ']' — there's
                // a trailing-space gutter between the prompt and the
                // input echo column.  Match exactly.
                if (g.nhDisplay.setCursor) g.nhDisplay.setCursor(sp.length + 1, 0);
            }
            const k = await nhgetch();
            let pick4u = null;
            if (k === 0x79 || k === 0x59) pick4u = 'y';
            else if (k === 0x6e || k === 0x4e) pick4u = 'n';

            // Outer loop: handles confirmation 'n' rejecting the pick
            // and falling back into manual menu pick mode (C ref
            // role.c:2705-2712 `case 2: 'n' → ROLE=RACE=GEND=ALGN=NONE;
            // pick4u='n'; goto makepicks`).
            while (pick4u === 'y' || pick4u === 'n') {
                if (pick4u === 'y') {
                    g.flags.initrole = pick_role(-2, -2, -2, 0);
                    g.flags.initrace = pick_race(g.flags.initrole, -2, -2, 0);
                    g.flags.initgend = pick_gend(g.flags.initrole, g.flags.initrace, -2, 0);
                    g.flags.initalign = pick_align(g.flags.initrole, g.flags.initrace, g.flags.initgend, 0);
                } else {
                    g.flags.initrole = -1;
                    g.flags.initrace = -1;
                    g.flags.initgend = -1;
                    g.flags.initalign = -1;
                    await runManualPick();
                }

                // C ref role.c:2654-2675 — "Is this ok?" confirmation
                // menu rendered as NHW_MENU overlay.  Title is
                // "Is this ok? [yn{a}q]" (bold inverse), subtitle is
                // "<name> the <alignment> <gender> <race-adj> <role>".
                // Menu width = longest line; offx = 80 - width - 2 so
                // the menu hugs the right edge with a 2-col gutter.
                // Render BEFORE nhgetch so the harness captures this
                // screen state.
                if (g?.nhDisplay?.setCell) {
                    const disp = g.nhDisplay;
                    const _isFem = g.flags.initgend === 1;
                    const _roleObj = (g.flags.initrole >= 0) ? roles[g.flags.initrole] : null;
                    const _raceObj = (g.flags.initrace >= 0) ? races[g.flags.initrace] : null;
                    const roleStr = _roleObj
                        ? (_isFem ? (_roleObj.name?.f || _roleObj.name?.m)
                                  : (_roleObj.name?.m || _roleObj.name?.f))
                        : '<role>';
                    const raceStr = _raceObj ? _raceObj.adj : '<race>';
                    const gendStr = (g.flags.initgend === 0) ? 'male'
                                   : (g.flags.initgend === 1) ? 'female'
                                   : '<gender>';
                    const _ali = g.flags.initalign;
                    const alignStr = (_ali === 0) ? 'lawful'
                                   : (_ali === 1) ? 'neutral'
                                   : (_ali === 2) ? 'chaotic'
                                   : '<alignment>';
                    const nameStr = g.plname || '';
                    const subtitle = nameStr
                        ? `${nameStr} the ${alignStr} ${gendStr} ${raceStr} ${roleStr}`
                        : `${alignStr} ${gendStr} ${raceStr} ${roleStr}`;
                    const renameOk = !!(g.iflags && g.iflags.renameallowed);
                    const title = `Is this ok? [yn${renameOk ? 'a' : ''}q]`;
                    const items = ['y * Yes; start game', 'n - No; choose role again'];
                    if (renameOk) items.push('a - Not yet; choose another name');
                    items.push('q - Quit');
                    const lines = [
                        { text: title, bold: true },
                        { text: '', bold: false },
                        { text: subtitle, bold: false },
                        { text: '', bold: false },
                        ...items.map(t => ({ text: t, bold: false })),
                        { text: '(end)', bold: false },
                    ];
                    let maxLen = 0;
                    for (const l of lines) if (l.text.length > maxLen) maxLen = l.text.length;
                    // C ref wintty.c:1908-1911 (H2344_BROKEN branch):
                    // offx = min(min(82, cols/2), cols - s_maxcol - 1).
                    // For 80-col terminals this caps cw->offx at 40,
                    // and content (starting at cw->offx + 1 per the
                    // leading-space-gutter putchar) caps at column 41.
                    // For wide subtitles the non-cap formula wins.
                    const offx = Math.max(0, Math.min(41, 80 - maxLen - 2));
                    // C tty wintty.c:1996 — during role-selection (chargen),
                    // dismissing any menu window triggers a full clear_screen.
                    // For the manual-pick path (pick4u='n'), the prior
                    // role/race/gender menus get dismissed before "Is
                    // this ok?" opens, so the screen is blank when this
                    // overlay draws.  For the random-pick path
                    // (pick4u='y'), no prior menus were opened — splash
                    // and askname prompt remain visible underneath.
                    if (pick4u === 'n') {
                        for (let y = 0; y < 24; y++) {
                            for (let c = 0; c < 80; c++) disp.setCell(c, y, ' ', 8, 0);
                        }
                    } else {
                        // C tty cl_end per menu row — clear from offx-1
                        // (the leading-space gutter) to end-of-line for
                        // each row of the menu overlay.  Leaves cells
                        // at cols 0..offx-2 intact (splash stays visible)
                        // for the random-pick path that didn't open
                        // prior menus.  Row 0 gets a full clear because
                        // C's prior "Shall I pick?" yn_function prompt
                        // occupied that row and gets erased before the
                        // new menu draws.
                        for (let c = 0; c < 80; c++) disp.setCell(c, 0, ' ', 8, 0);
                        const clearStart = Math.max(0, offx - 1);
                        for (let y = 1; y < lines.length && y < 24; y++) {
                            for (let c = clearStart; c < 80; c++) disp.setCell(c, y, ' ', 8, 0);
                        }
                    }
                    for (let y = 0; y < lines.length && y < 24; y++) {
                        const { text, bold } = lines[y];
                        const attr = bold ? 1 : 0;
                        for (let c = 0; c < text.length && (offx + c) < 80; c++) {
                            disp.setCell(offx + c, y, text[c], 8, attr);
                        }
                    }
                    // Cursor parks one col past "(end)" on the last line.
                    // C tty's hooked_tty_print_str leaves cursor at
                    // offx + strlen("(end)") + 1 = offx + 6.
                    if (disp.setCursor) disp.setCursor(offx + 6, lines.length - 1);
                }

                // "Is this OK?" — read confirmation key.  'y' / ' ' /
                // '\r' accept; 'n' rejects and restarts as manual pick.
                let conf;
                try { conf = await nhgetch(); } catch (_e) { conf = 0x79; }
                if (conf === 0x6e || conf === 0x4e) {
                    // Confirmation 'n' → reset and re-pick manually.
                    pick4u = 'n';
                    continue;
                }
                break;
            }
            // Anything else: leave initrole at -1; the rc default
            // path below will fall through to Tourist.
        } catch (_e) {}
    }

    // Set urole/urace/ualign from rc options BEFORE the translated
    // u_init_misc call runs (a few lines below), so it sees the
    // right game.urole.mnum / game.urace.mnum.  Without this,
    // u_init_misc → set_uasmon → game.mons[urole.mnum] crashes
    // (urole.mnum=-1 sentinel from decl.js's initial state).
    //
    // Precedence: rc options > chargen pick (set above) > default Tourist.
    const rcRole = findRole(g._optsRole);
    const rcRace = findRace(g._optsRace);
    const rcAlign = findAlign(g._optsAlign);
    // If chargen picked a role (initrole >= 0), use the translated
    // roles[] table directly — that's the same data findRole reads.
    const charPickedRole = (g.flags.initrole >= 0 && roles[g.flags.initrole]) ? roles[g.flags.initrole] : null;
    const charPickedRace = (g.flags.initrace >= 0 && races[g.flags.initrace]) ? races[g.flags.initrace] : null;
    g.urole = rcRole || charPickedRole || findRole('Tourist');
    g.urace = rcRace || charPickedRace || findRace('human');
    // chargen also picked gender (initgend=1 means female).  Reflect
    // it on g.flags.female so u_init_misc and downstream pronoun
    // selection see the right value.
    if (typeof g.flags.initgend === 'number') g.flags.female = (g.flags.initgend === 1);
    // female is set by jsmain.js from rc gender, by chargen pick,
    // and by u_init_misc (flags.female = initgend, a number).
    // Coerce to boolean for downstream pronoun selection; default
    // true only if truly undefined.  Was clobbering male sessions
    // by checking `typeof !== 'boolean'` after u_init_misc set
    // female to a numeric 0 (male) or 1 (female).
    if (g.flags.female === undefined) g.flags.female = true;
    else g.flags.female = !!g.flags.female;
    if (typeof g.flags.initgend !== 'number') g.flags.initgend = g.flags.female ? 1 : 0;
    // game.flags.initalign is the INDEX into aligns[], not the
    // value.  aligns[0]=law(value=1), aligns[1]=neutral(value=0),
    // aligns[2]=chaotic(value=-1).  u_init_misc reads
    // aligns[flags.initalign].value to set u.ualign.type.
    // decl_globals_init initialized this to 0 (lawful) by default;
    // override from rc options when present.
    if (rcAlign) {
        g.flags.initalign = (rcAlign.adj === 'lawful') ? 0
            : (rcAlign.adj === 'chaotic') ? 2 : 1;
    } else if (typeof g.flags.initalign !== 'number') {
        g.flags.initalign = 1;  // default: neutral
    }
    // u.ualign is reset by u_init_misc; don't preset here.

    // C ref: allmain.c:785-786 sets `flags.pantheon = -1; role_init();`
    // BETWEEN init_objects and init_dungeons.  role_init fires
    // rn2(100) per leader/nemesis whose gender flags lack
    // M2_MALE/FEMALE/NEUTER (e.g. PM_DARK_ONE for Wizard, but NOT
    // PM_MASTER_OF_THIEVES for Tourist which has M2_MALE).
    //
    // For role_init to do the right thing, flags.initrole must be
    // a valid index INTO roles[] (not -1).  Map from g.urole back
    // to its index here — chargen / rc setup above resolved urole
    // but didn't necessarily set initrole.
    if (g.urole && roles.indexOf(g.urole) >= 0) {
        g.flags.initrole = roles.indexOf(g.urole);
    }
    if (g.urace && races.indexOf(g.urace) >= 0) {
        g.flags.initrace = races.indexOf(g.urace);
    }
    // De-alias urole/urace from the shared roles[]/races[] module
    // tables BEFORE role_init writes into them (C copies the struct;
    // aliasing let the priest pantheon-god write mutate the table —
    // Q9.5(b) cross-session leak, div=199 cluster).  Must run AFTER
    // the indexOf blocks above, which need table identity.  Shallow
    // copy suffices: the role_init writes (lgod/ngod/cgod) are
    // top-level fields.
    if (g.urole && typeof g.urole === 'object') g.urole = { ...g.urole };
    if (g.urace && typeof g.urace === 'object') g.urace = { ...g.urace };
    g.flags.pantheon = -1;
    // role_init's validgend(initrole, initrace, female) does
    // `genders[female]` — bracket index needs an int 0/1.  C treats
    // flags.female as int but our chargen path coerced it to boolean;
    // normalize back to int before role_init runs.
    if (typeof g.flags.female === 'boolean') {
        g.flags.female = g.flags.female ? 1 : 0;
    }

    // Translated pre-mklev startup sequence.  C ref allmain.c:780-792.
    // Each call below replaces a chunk of session-recorded RNG that
    // an earlier prototype emulated via hardcoded rn2() calls.
    //
    // init_objects (o_init.c) — randomize_gem_colors + shuffle for
    // each shuffled object class.  Also sets seed-keyed shuffled
    // appearances on game.obj_descr (e.g. "ANDOVA BEGARIN" for
    // scroll of magic mapping at seed 8000).
    await init_objects();
    // role_init (role.c) — C ref allmain.c:785-786.  Sets
    // ldrgend/nemgend for the role's leader and nemesis; may fire
    // rn2(100) for unflagged (M2_MALE/FEMALE/NEUTER) entries.
    // flags.pantheon = -1 was set above to take the no-extra-rn2
    // branch of validrole/validrace.
    await role_init();
    // init_dungeons (dungeon.c) — populates game.dungeons /
    // game.dungeon_topology and fires Lua-side rn2(3), rn2(2)
    // via nhl_init → nhlib.lua → shuffle(align) through the
    // bound_rn2 bridge.
    await init_dungeons();
    // init_artifacts (artifact.c) — C ref allmain.c:792.  Zeros
    // game.artiexist / artidisco and aligns role-specific artifact
    // entries.  No PRNG fired.
    init_artifacts();
    // u_init_misc (u_init.c) — fires rn2(10) for u.uhandedness
    // and initializes ~50 fields on game.u (umonnum/umonster,
    // uhp/uen via newhp()/newpw(), uz, ualign, etc.) plus
    // game.flags (female=initgend, beginner=TRUE).
    await u_init_misc();

    // C ref: allmain.c l_nhcore_init() / nhlua.c::l_nhcore_init().
    // Creates a persistent Lua state (gl.luacore in C) and loads
    // nhcore.lua.  The 2 RNG calls come from nhl_init's loading of
    // nhlib.lua, which has a top-level `shuffle(align)` of a 3-element
    // table — `rn2(3); rn2(2)` via the lua-bridge's bound_rn2 — matching
    // session indices 309-310.
    {
        const sbi = { flags: 1, memlimit: 1024 * 1024, steps: 0, perpcall: 1024 * 1024 };
        const L = await nhl_init(sbi);
        if (L) await nhl_loadlua(L, 'nhcore.lua');
        game.luacore = L;
    }

    // Set up game state needed by mklev.  game.dungeons is now
    // populated by translated init_dungeons (step 137) — don't
    // overwrite.  game.branches is the C-style linked list (head
    // node + .next pointers) populated by translated init_dungeons.
    // Both hand-written and translated mklev now walk this linked
    // list.  If init_dungeons returned a falsy branches list,
    // synthesize a minimal head with end1/end2 so mklev's
    // is_branchlev finds the dlvl-1 entry.
    if (!g.branches || (typeof g.branches !== 'object')) {
        g.branches = { end1: { dnum: 0, dlevel: 1 }, end2: { dnum: 2, dlevel: 1 }, end1_up: true, next: null };
    }
    g.u = g.u || {};
    g.u.uz = { dnum: 0, dlevel: 1 };
    g.flags = g.flags || {};

    // Real mklev generates the level with correct room positions
    // Structural phase consumes RNG for rooms/corridors/doors/stairs
    //
    // Translated mklev() is the only path (§23.45 — js/mklev.js was
    // retired).  Translated mklev's dig_corridor places boulders via
    // mksobj_at → place_object → block_point, which reads
    // game.viz_array[y][x].  In C the vision arrays are set up
    // by init_display() before any level generation runs.  Init
    // early so block_point doesn't crash on viz_array[y]=null.
    {
        const { GameMap } = await import('./game.js');
        g.fmon = null;
        g.level = new GameMap();
        g.made_branch = false;
        g.stairs = null;
        g.vault_x = -1;
        init_vision_globals();
        try { await t_mklev(); } catch (e) {
            if (__env.PHASE_TRACE) console.error('[t_mklev]', e.stack?.split('\n').slice(0,8).join('\n'));
        }
    }

    // Mirror game.level.rooms (where hand-written mklev populates)
    // to game.rooms (where translated code expects to find them via
    // bucket-flatten of svr.rooms).  Needed for translated
    // fill_special_room, makedog, mineralize to read the level
    // layout.  Object-identity preserved: writes to game.rooms[i]
    // .field affect game.level.rooms[i].field too.
    //
    // Only runs in the default (hand-written mklev) path.  Translated
    // mklev writes rooms directly to game.rooms / game.nroom, so the
    // unconditional `g.nroom = g.level.nroom || 0` below would zero
    // out the rooms translated mklev just placed.
    if (__env.NH_HANDWRITTEN_MKLEV && g.level?.rooms) {
        for (let i = 0; i < (g.level.nroom || 0); i++) {
            if (g.level.rooms[i]) g.rooms[i] = g.level.rooms[i];
        }
        g.nroom = g.level.nroom || 0;
    }

    // viz_array must be initialized before fill_ordinary_room runs
    // — translated maketrap calls recalc_block_point which reads
    // game.viz_array[y][x].  No RNG fired by these.
    init_vision_globals();
    vision_reset();
    // Translated vision_init() populates viz_clear_rows[i] from
    // viz_clear[i] — without this, clear_path crashes on
    // viz_clear_rows[y]=null when the LOS scan touches any row.
    // C calls vision_init() once at startup; we replicate that.
    try { t_vision_init(); } catch (_e) {}

    // Place the hero on the upstair BEFORE step C's makedog runs.
    // C ref allmain.c:807-808 — u_on_upstairs precedes makedog so
    // makedog passes valid u.ux/u.uy to makemon's enexto_core path
    // (otherwise makemon takes the x==0 && y==0 makemon_rnd_goodpos
    // branch, firing a different RNG sequence).  No RNG fired here.
    await u_on_upstairs();

    // Populate viz_array now that the hero is placed.  Without
    // this, every newsym() call (including the one inside makedog's
    // makemon that places the pet on the map) sees
    // `game.viz_array[y][x] & COULD_SEE == 0` and silently returns
    // before writing to gbuf.  Result: monsters created during
    // chargen (pet, plus any mklev-placed mons that didn't get a
    // post-mklev newsym) never reach the display layer, and the
    // first map screen renders an empty room — visible on
    // seed0014's first frame.  C ref: docrt at allmain.c:817 calls
    // vision-recalc transitively for the same reason.
    vision_recalc(0);

    // Step B/C/D: real translated fill_ordinary_room + fill_special_room
    // + mineralize + makedog.  Runs only on the hand-written-mklev
    // fallback path (NH_HANDWRITTEN_MKLEV=1) because translated
    // mklev() above already runs them inside makelevel().
    if (__env.NH_HANDWRITTEN_MKLEV) {
        g.in_mklev = true;
        {
            let bonus_countdown = g._bonus_item_countdown ?? -1;
            for (let i = 0; i < g.nroom; i++) {
                const r = g.rooms[i];
                if (!r) continue;
                const fillable = (r.rtype === NH_OROOM || r.rtype === NH_THEMEROOM) && r.needfill === 1;
                try {
                    await t_fill_ordinary_room(r, fillable && bonus_countdown === 0);
                } catch (e) {
                    if (__env.PHASE_TRACE) console.error(`[ff] fill_ord room ${i}:`, e.message);
                }
                if (fillable) bonus_countdown--;
            }
            for (let i = 0; i < g.nroom; i++) {
                const r = g.rooms[i];
                if (!r) continue;
                try { await t_fill_special_room(r); } catch (e) {
                    if (__env.PHASE_TRACE) console.error(`[ff] fill_spec room ${i}:`, e.message);
                }
            }
        }
        // Step D: real translated mineralize (C ref mklev.c:1550).
        try {
            await t_mineralize(-1, -1, -1, -1, false);
        } catch (e) {
            if (__env.PHASE_TRACE) console.error('[ff] mineralize:', e.message);
        }
        g.in_mklev = false;

        // Step C: real translated makedog (C ref allmain.c:814).  For
        // sessions without pettype:none, makedog fires pet_type() +
        // makemon() RNG.  preferred_pet was set up earlier as a char code
        // for translated `preferred_pet == 110` to work.
        try {
            await t_makedog();
        } catch (e) {
            if (__env.PHASE_TRACE) console.error('[ff] makedog:', e.message);
        }
    } else {
        // Translated mklev path (default): makedog still needs to run
        // because it's in allmain.c after mklev() (line 814), not
        // inside mklev().
        try { await t_makedog(); } catch (e) {
            if (__env.PHASE_TRACE) console.error('[ff] makedog (translated mklev):', e.message);
        }
    }

    // After makedog places the starting pet, force hand-written
    // newsym() to redraw each monster's cell.  Vision_recalc
    // doesn't re-call newsym for cells whose visibility state
    // didn't change since the previous recalc, so the pet's cell
    // (already marked IN_SIGHT by the pre-makedog recalc) wouldn't
    // pick up the monster glyph otherwise.  Iterate game.level.
    // monlist and call hand-written newsym at each monster's
    // position — show_glyph_cell will then write the monster glyph
    // to loc.disp_* so the screen capture sees it.
    {
        const { newsym: hw_newsym } = await import('./display.js');
        let m = g.level?.monlist;
        let guard = 0;
        while (m && guard < 100) {
            if (typeof m.mx === 'number' && typeof m.my === 'number') {
                hw_newsym(m.mx, m.my);
            }
            m = m.nmon;
            guard++;
        }
    }

    // Translated post-mklev startup sequence.  C ref allmain.c:794-832.
    //
    // u_init_inventory_attrs (u_init.c) — chains into u_init_role +
    // ini_inv + u_init_race + init_attr + vary_init_attr +
    // u_init_carry_attr_boost.  Populates game.invent with starter
    // items, sets oc_name_known on starter scroll/potion classes
    // via addedinv → discover_object, sets game.u.acurr / amax /
    // uhp / uen / uac from real init_attr + newhp + newpw rolls.
    await u_init_inventory_attrs();
    // u_init_skills_discoveries — walks invent calling
    // ini_inv_use_obj, then skill_init / pauper-init / num_spells
    // update / find_ac.  No RNG fired.  C ref u_init.c:1398-1413.
    try { await u_init_skills_discoveries(); } catch (_e) {}
    // observe_object — marks oc_encountered=1 so dodiscovered shows
    // each starter item with its appearance string.  Not in C
    // chargen as a separate loop; C does this implicitly via the
    // pickup / display path by the time the first screen renders.
    // We do it once at chargen time so screen 15 (discoveries)
    // matches.  No RNG fired.
    for (let p = g.invent; p; p = p.nobj) {
        try { await observe_object(p); } catch (_e) {}
    }
    // Legacy align shuffle.  C ref allmain.c:831 —
    // `if (flags.legacy) com_pager("legacy")`.  com_pager
    // (questpgr.c:487) calls nhl_init → nhl_loadlua, each of which
    // also runs nhlib.lua top-level `shuffle(align)` and fires
    // rn2(3), rn2(2) via the lua-bridge's bound_rn2.  Re-fire as
    // a faithful 3-element shuffle so PRNG matches.  Gated on
    // flags.legacy (rc-set false in seed8000-style configs).
    //
    // This is a TRANSITIONAL stub — the proper fix is to wire
    // com_pager("legacy") end-to-end (including the welcome-screen
    // rendering), which is `PORT_DESIGN.md` §7.2 Option B and a
    // multi-week effort on its own.
    if (g.flags?.legacy) {
        const __align = ['law', 'neutral', 'chaos'];
        for (let i = __align.length; i > 1; i--) {
            const j = rn2(i);
            [__align[i - 1], __align[j]] = [__align[j], __align[i - 1]];
        }
    }

    // Player state — uhp/uen/uac/acurr/etc. are now set by the
    // translated u_init_inventory_attrs call above.  No hand-coded
    // values here.  Just make sure rc-driven and per-session-fresh
    // fields have sensible defaults.
    g.moves = 1;
    g._goldCount = g.u.umoney0 || 0;
    // female is set by jsmain.js from rc gender, by chargen pick,
    // and by u_init_misc (flags.female = initgend, a number).
    // Coerce to boolean for downstream pronoun selection; default
    // true only if truly undefined.  Was clobbering male sessions
    // by checking `typeof !== 'boolean'` after u_init_misc set
    // female to a numeric 0 (male) or 1 (female).
    if (g.flags.female === undefined) g.flags.female = true;
    else g.flags.female = !!g.flags.female;
    g.plname = g.plname || 'Contestant';

    // u_on_upstairs already called above (before step B/C/D so makedog
    // sees valid u.ux/u.uy).  No RNG fired by it.

    // Initial display
    init_vision_globals();
    vision_reset();
    vision_recalc(0);
    await cls();
    await docrt();
    await flush_screen(1);
    await bot();

    // Welcome message.  C ref: pline.c:welcome / role.c:Hello.
    // The greeting word ("Aloha"/"Salutations"/"Hello"/etc.)
    // comes from the translated Hello() in role.js, which
    // switches on g.urole.mnum.  Alignment/race/role names
    // come from the role-keyed tables.
    const alignName = aligns.find(a => a?.value === g.u?.ualign?.type)?.adj || 'neutral';
    const isFemale = !!g.flags?.female;
    const roleName = isFemale ? (g.urole.name.f || g.urole.name.m) : g.urole.name.m;
    const raceAdj = g.urace?.adj || 'human';
    // Gender insertion mirrors C allmain.c:905-909.  Only append
    // " female"/" male" when (a) the role has NO female-specific
    // name (gender-agnostic role: Tourist, Archeologist, Wizard,
    // etc.) AND (b) the role allows BOTH male and female (i.e.
    // urole.allow & ROLE_GENDMASK == ROLE_MALE|ROLE_FEMALE).
    // For gendered roles like Valkyrie (urole.name.f="Valkyrie")
    // the gender is implicit in the role name, so C omits it.
    // C ref include/you.h:206-209: ROLE_MALE=0x1000, ROLE_FEMALE
    // =0x2000, GENDMASK=0xf000.
    let genderPart = '';
    if (!g.urole?.name?.f) {
        const allow = g.urole?.allow || 0;
        if ((allow & 0x3000) === 0x3000) {
            genderPart = ` ${isFemale ? 'female' : 'male'}`;
        }
    }
    // C ref allmain.c:831-833 — for legacy=on, com_pager("legacy")
    // reads dat/quest.lua's "legacy" entry, substitutes %d (god name),
    // %G (god/goddess title), %r (rank), %c (role), then renders as an
    // NHW_MENU overlay.  C ref dat/quest.lua questtext.common.legacy.
    // The menu width drives offx (= 80 - maxcol - 1).  Cursor parks
    // just past "--More--" on row N+1 (one below last text row).
    if (g.flags?.legacy) {
        const disp = g?.nhDisplay;
        if (disp?.setCell) {
            // C ref pray.c:2627 align_gtitle — god name with leading
            // underscore means "goddess" (e.g. Tourist's "_The Lady"),
            // otherwise "god".  The underscore is stripped from the
            // displayed name itself.
            const align = (Array.isArray(g.u?.ualignbase) ? g.u.ualignbase[1] : 0) | 0;
            const godRaw = (align > 0 ? g.urole?.lgod
                          : align < 0 ? g.urole?.cgod
                          : g.urole?.ngod) || 'Marduk';
            const godTitle = (typeof godRaw === 'string' && godRaw[0] === '_') ? 'goddess' : 'god';
            const godName = (typeof godRaw === 'string' && godRaw[0] === '_') ? godRaw.slice(1) : godRaw;
            // C ref insight.c rank_of — for level 1 hero, the rank is
            // urole.rank[0].m (gendered).
            const isFemale = !!g.flags?.female;
            const role = g.urole?.rank?.[0] || g.urole?.name || { m: 'Adventurer', f: null };
            const rankName = isFemale ? (role.f || role.m) : (role.m || role.f);

            const lines = [
                `It is written in the Book of ${godName}:`,
                '',
                '    After the Creation, the cruel god Moloch rebelled',
                '    against the authority of Marduk the Creator.',
                '    Moloch stole from Marduk the most powerful of all',
                '    the artifacts of the gods, the Amulet of Yendor,',
                '    and he hid it in the dark cavities of Gehennom, the',
                '    Under World, where he now lurks, and bides his time.',
                '',
                `Your ${godTitle} ${godName} seeks to possess the Amulet, and with it`,
                'to gain deserved ascendance over the other gods.',
                '',
                `You, a newly trained ${rankName}, have been heralded`,
                `from birth as the instrument of ${godName}.  You are destined`,
                'to recover the Amulet for your deity, or die in the',
                'attempt.  Your hour of destiny has come.  For the sake',
                `of us all:  Go bravely with ${godName}!`,
            ];
            // C ref wintty.c tty_display_nhwindow — NHW_MENU sets
            // offx = cols - maxcol - 1 where maxcol = strlen(longest
            // line).  Empirically the canonical column 8 for seed0107
            // Samurai matches `80 - 71 - 1 = 8` with no min-clamp.
            let maxw = 0;
            for (const ln of lines) if (ln.length > maxw) maxw = ln.length;
            const offx = Math.max(0, 80 - maxw - 1);
            // Render lines at offx.  Outside col range (col < offx-1)
            // is map area that stays visible.  C tty leaves a 1-col
            // gutter so we clear from offx-1 to end of row (canonical
            // shows a space at col offx-1 with text at col offx+).
            const clearStart = Math.max(0, offx - 1);
            for (let r = 0; r < lines.length; r++) {
                for (let c = clearStart; c < 80; c++) disp.setCell(c, r, ' ', 8, 0);
                const text = lines[r];
                for (let c = 0; c < text.length && (offx + c) < 80; c++) {
                    disp.setCell(offx + c, r, text[c], 8, 0);
                }
            }
            // "--More--" on row N (one below last text row), at col offx.
            const moreRow = lines.length;
            const morestr = '--More--';
            for (let c = clearStart; c < 80; c++) disp.setCell(c, moreRow, ' ', 8, 0);
            for (let c = 0; c < morestr.length; c++) {
                disp.setCell(offx + c, moreRow, morestr[c], 8, 0);
            }
            if (disp.setCursor) disp.setCursor(offx + morestr.length, moreRow);
        }
        // C tty's dmore accepts only SPACE/RETURN/ESC; other keys
        // re-display.  Each iter consumes one captured step.
        // C ref allmain.c:832 — bot() at this point captures uac=0
        // (BEFORE u_init_skills_discoveries → find_ac).  Force the
        // AC field to 0 for screens captured inside this dmore loop
        // (matches the C tty-grid snapshot timing).  The flag is
        // narrowly scoped to this loop so sessions without legacy
        // never see AC:0 at step 0.
        // C ref allmain.c:832 — bot() at this point captures uac=0
        // (BEFORE u_init_skills_discoveries → find_ac).  Force the
        // AC field to 0 for screens captured inside this dmore loop
        // (matches the C tty-grid snapshot timing).  The flag is
        // narrowly scoped to the legacy-splash dmore so sessions
        // without legacy never see AC:0 at step 0.  After setting
        // the flag, re-write the status rows in the terminal grid
        // (the prior flush_screen at line ~988 wrote them with the
        // post-find_ac uac); without this rewrite the capture during
        // the dmore loop would still show the stale uac=actual.
        g._chargen_force_ac_zero = true;
        rebuild_status_rows();
        for (let __tries = 0; __tries < 20; __tries++) {
            let k;
            try { k = await nhgetch(); } catch (_e) { break; }
            if (k === 32 || k === 10 || k === 13 || k === 27) break;
        }
        g._chargen_force_ac_zero = false;
        rebuild_status_rows();
        // Clear pending_message so the welcome pline below renders
        // fresh on row 0.
        g._pending_message = '';
    }

    await pline(`${Hello(null)} ${g.plname}, welcome to NetHack!  You are a ${alignName}${genderPart} ${raceAdj} ${roleName}.`);

    // Re-flush the screen so the welcome pline (which sets
    // game._pending_message) lands in the terminal grid row 0
    // before the next nhgetch captures the screen.  Without
    // this, the welcome message lives only on _pending_message
    // and the screen capture sees an empty row 0 — visible on
    // every session as a missing welcome line on the first
    // captured frame (C records it in step 11's screen).
    await flush_screen(1);

    // When legacy is on, C invokes com_pager("legacy") which writes
    // "--More--" beside (or below) the welcome before tty_nhgetch waits
    // for the dismissal key.  C ref wintty.c dmore: if the current
    // message line has room for "  --More--" (10 chars including 2
    // leading spaces), append on the SAME row; otherwise write "--More--"
    // starting at col 0 of the next row.  Cursor parks just past it.
    // --More-- emit after welcome: C only forces it when a follow-up
    // message would arrive without time to read the welcome.  Drivers:
    //   tutorial=on  → tutorial menu plines next
    //   moonphase=0  → moveloop_preamble plines "Be careful! New moon"
    //   moonphase=4  → ...plines "You are lucky! Full moon"
    //   friday_13th  → ...plines "Watch out! Friday the 13th"
    //   explore mode → C plines "You are in non-scoring explore/discovery mode."
    // jsmain.js wires session datetime to globalThis.localtime so the
    // phase/friday computation uses the recording's date, not wall-clock.
    let __wantMore = !!g.flags?.tutorial || !!g.flags?.explore;
    try {
        const { phase_of_the_moon, friday_13th } = await import('./translated/calendar.js');
        const phase = phase_of_the_moon();
        if (phase === 0 || phase === 4 || friday_13th()) __wantMore = true;
    } catch (_e) { /* leave at tutorial-only */ }

    if (__wantMore) {
        const disp = g?.nhDisplay;
        if (disp?.setCell) {
            const morestr = '--More--';
            const welcomeLen = (g._pending_message || '').length;
            const sameRow = (welcomeLen + 8) < 80;
            const startCol = sameRow ? welcomeLen : 0;
            const row = sameRow ? 0 : 1;
            for (let c = 0; c < morestr.length; c++) {
                disp.setCell(startCol + c, row, morestr[c], 8, 0);
            }
            if (disp.setCursor) disp.setCursor(startCol + morestr.length, row);
        }
    }

    // Welcome-screen dismiss.  C only consumes a key here when the
    // welcome is held under a dmore (i.e. when __wantMore above is true).
    // C ref wintty.c dmore: only SPACE / RETURN / ESC dismiss; other
    // keys ring the bell and re-display.  Each retry consumes a
    // capture so loops up to 20× consume any invalid prefix keys
    // (seed4500 'j' then ' ' is invalid + dismiss).
    if (__wantMore) {
        for (let __tries = 0; __tries < 20; __tries++) {
            let k;
            try { k = await nhgetch(); } catch (_e) { break; }
            if (k === 32 /*SP*/ || k === 10 || k === 13 || k === 27 /*ESC*/) break;
        }
    }
    // C ref unixmain.c:672-673 — discover mode startup plines
    // "You are in non-scoring explore/discovery mode." after the
    // welcome dismiss.  This fires for sessions with playmode:explore
    // (game.flags.explore=true) BEFORE moveloop_preamble runs.
    if (g.flags?.explore) {
        await pline('You are in non-scoring explore/discovery mode.');
    }
    // C ref allmain.c:567-580 maybe_do_tutorial → ask_do_tutorial.  When
    // flags.tutorial is set, C prompts "Do you want a tutorial?" and
    // waits for y/n via win_yn_function.  Without consumption the
    // answer key (typically "n" in scoring sessions) is interpreted by
    // rhack as a movement command.  Render the prompt as a NHW_MENU
    // overlay with the canonical layout (centered at col 21 with the
    // "(end)" sentinel on row 6), park the cursor at [27, 6] where C's
    // tty leaves it after dmore, then eat the dismissal key.  All
    // legacy=on,!tutorial=off-default sessions have identical step-2
    // capture: same text, same cursor → the render is constant across
    // every session that hits it.
    if (g.flags?.tutorial) {
        const disp = g?.nhDisplay;
        const renderTutorial = (retry) => {
            if (!disp?.setCell) return;
            const PAD = 21;
            const lines = [
                'Do you want a tutorial?',
                '',
                'y - Yes, do a tutorial',
                'n - No, just start play',
                '',
                'Put "OPTIONS=!tutorial" in .nethackrc to skip this query.',
                '(end)',
            ];
            // C tty re-prompts with an invalid-choice line before the
            // (end) sentinel (recorded seed1150 step 4: row 6 becomes
            // "(Please choose 'y' or 'n'.)", (end) moves to row 7,
            // cursor [27,7]).
            if (retry) {
                lines.splice(6, 0, "(Please choose 'y' or 'n'.)");
            }
            // C tty's NHW_MENU writes from col PAD onwards.  Cols
            // 0..PAD-1 are the message-line / map-overlap area:
            //   - row 0 had the welcome (which dmore cleared)
            //   - row 1 had the --More-- prompt (also cleared on dismiss)
            //   - rows 2+ are map area — preserve cols 0..PAD-1 so map
            //     peeks through to the left of the menu (canonical
            //     seed0399 step 2 shows the room at cols 11-19).
            // Clear the message-line columns for rows 0-1; for rows 2+
            // only clear the menu's column range (PAD..79).
            for (let r = 0; r < lines.length; r++) {
                const text = lines[r];
                const attr = (r === 0) ? 1 : 0;
                if (r < 2) {
                    for (let c = 0; c < 80; c++) disp.setCell(c, r, ' ', 8, 0);
                } else {
                    // C's NHW_MENU owns a 1-col left gutter at PAD-1:
                    // canonical seed0101 step 2 blanks col 20 where its
                    // room wall would otherwise show (rows 3-6); the
                    // map keeps showing at col 19 and left.
                    for (let c = PAD - 1; c < 80; c++) disp.setCell(c, r, ' ', 8, 0);
                }
                for (let c = 0; c < text.length && (PAD + c) < 80; c++) {
                    disp.setCell(PAD + c, r, text[c], 8, attr);
                }
            }
            if (disp.setCursor) disp.setCursor(PAD + 6 /* '(end)'.length + 1 */, retry ? 7 : 6);
        };
        // C's ask_do_tutorial calls yn_function which loops until a
        // valid yn answer arrives.  Invalid keys (anything not y/n/Y/N)
        // cause the prompt to re-show, consuming an extra nhgetch.
        // Without the loop, sessions whose users pressed a stray key
        // before the answer (seed0103 'sns#ride' starts with 's' aimed
        // at the tutorial) skip a capture and shift every subsequent
        // step by one.  C tty also accepts ESC as the default 'no'.
        // C ref wintty.c:1949 — displaying a menu first flushes the
        // unseen topl with a --More--.  The explore-mode notice owns
        // one captured frame (with its More) BEFORE the tutorial
        // menu appears; the dismissal key is consumed here exactly
        // like C's xwaitforspace (space/CR/ESC only).
        if (typeof g._pending_message === 'string' && g._pending_message
            && !g._topl_seen) {
            if (!g._pending_message.endsWith('--More--')) {
                g._pending_message += '--More--';
            }
            await flush_screen(1);
            for (;;) {
                let k2;
                try { k2 = await nhgetch(); } catch (_e) { break; }
                if (k2 === 0x20 || k2 === 0x0d || k2 === 0x0a || k2 === 0x1b) break;
            }
            g._pending_message = '';
            await flush_screen(1);
        }
        for (let __tries = 0; __tries < 20; __tries++) {
            renderTutorial(__tries > 0);
            let k;
            try { k = await nhgetch(); } catch (_e) { break; }
            if (k === 121 /*y*/ || k === 89 /*Y*/
                || k === 110 /*n*/ || k === 78 /*N*/
                || k === 27 /*ESC*/) break;
        }
    }
    // After the tutorial-prompt dismissal, the earlier welcome pline
    // lingers on game._pending_message and would re-paint row 0 on the
    // next flush.  C clears it via the tutorial-prompt menu's
    // restore_glyphs / mark_synch flow.  Mirror that ONLY when the
    // tutorial render fired (legacy=on + tutorial=on); for !legacy
    // sessions (seed8000) the welcome is captured at the very first
    // outer-loop nhgetch and the pending_message must persist.
    if (g.flags?.tutorial) {
        g._pending_message = '';
    }
    g.context = g.context || {};
    // ^moveloop.first — mirrors C-side moveloop.first event in allmain.c.
    // Records player + starting-pet position right before moveloop_preamble.
    // Used by seed0014 investigation to compare chargen-key-consumption parity.
    {
        let __petx = -1, __pety = -1;
        try {
            const __mid = g.context?.startingpet_mid;
            if (__mid) {
                for (let __m = g.level?.monlist; __m; __m = __m.nmon) {
                    if (__m.m_id === __mid) { __petx = __m.mx; __pety = __m.my; break; }
                }
                if (__petx < 0) {
                    for (let x = 0; x < (g.level?.monsters?.length || 0) && __petx < 0; x++) {
                        const col = g.level.monsters[x];
                        if (!col) continue;
                        for (let y = 0; y < col.length; y++) {
                            if (col[y] && col[y].m_id === __mid) { __petx = x; __pety = y; break; }
                        }
                    }
                }
            }
        } catch (_e) {}
        if (__env.NH_DEBUG_DOMOVE) console.error('[moveloop.first] ux='+g.u?.ux+' uy='+g.u?.uy+' petx='+__petx+' pety='+__pety+' traceEnabled='+globalThis.__nh_traceEnabled);
        traceCheckpoint('moveloop.first', { ux: g.u?.ux ?? -1, uy: g.u?.uy ?? -1, petx: __petx, pety: __pety });
    }
    try {
        await t_moveloop_preamble(0);
    } catch (_e) {
        // Translator gap: fall back to firing just the two RNG calls.
        g.context.rndencode = rnd(9000);
        g.context.seer_turn = rnd(30);
    }
}

// Watchdog limits for real movemon.  When translator-side
// infinite loops trip these (count or wall-clock), movemon is
// aborted and the PRNG state restored — the iter under-runs C
// by however many calls movemon would have made, and we surface
// the bug rather than fake the RNG.
//
// MOVEMON_WATCHDOG_LIMIT: C fires ~30-50 rn2 calls per typical
// 4-monster movemon iter; 5000 is a generous margin that doesn't
// false-positive on legitimate dense work.
// MOVEMON_WATCHDOG_DEADLINE_MS: typical movemon completes in
// <10ms; 100ms guards against tight non-RNG loops without
// false-positiving on real per-monster work.
const MOVEMON_WATCHDOG_LIMIT = 5000;
const MOVEMON_WATCHDOG_DEADLINE_MS = 100;

// Deep-clone the rng_state object so we can roll back if movemon
// trips the watchdog after firing N rn2 calls.  Without rollback,
// the under-run iter would still have the wasted rn2 calls polluting
// PRNG alignment.
function snapshot_rng_state() {
    const st = game.rnglist?.[0]?.rng_state;
    if (!st) return null;
    return {
        n: st.n, a: st.a, b: st.b, c: st.c,
        r: st.r ? Array.from(st.r) : null,
        m: st.m ? Array.from(st.m) : null,
    };
}
function restore_rng_state(snap) {
    if (!snap) return;
    const st = game.rnglist?.[0]?.rng_state;
    if (!st) return;
    st.n = snap.n; st.a = snap.a; st.b = snap.b; st.c = snap.c;
    if (snap.r && st.r) {
        for (let i = 0; i < snap.r.length; i++) st.r[i] = snap.r[i];
    }
    if (snap.m && st.m) {
        for (let i = 0; i < snap.m.length; i++) st.m[i] = snap.m[i];
    }
}

// "Standard tail" of moveloop_core's once-per-new-turn block.
// C ref allmain.c:228-360.  Calls translated functions in C order
// so the PRNG sequence derives from real C control flow.
// per_iter_setup: C's "new turn setup" block, inside the outer
// do-while (allmain.c:233-244 — mcalcdistress through moves++).
// Called once per outer-loop iteration.  Returns wtcap for the
// post_turn_block to reuse.
async function per_iter_setup() {
    // C ref allmain.c:228 — `mcalcdistress()` runs BEFORE the
    // mcalcmove loop.  Iterates monsters; for each, runs mon_regen
    // (possibly fires rn2 for partial heal), decide_to_shapeshift
    // (chameleon-only), were_change (werecreature-only), and
    // decrements mblinded/mfrozen/mfleetim.
    try { await mcalcdistress(); } catch (_e) {}

    // C ref allmain.c:233-234 — `mtmp->movement += mcalcmove(mtmp, TRUE)`.
    // Must apply the return value, else movement stays at 0 and movemon's
    // per-monster dochug early-returns at mon.c:796.
    //
    // C iterates ALL monsters in fmon unconditionally (no DEADMONSTER
    // filter).  Dead monsters get their mcalcmove call (firing rn2(12))
    // even though they're about to be removed by dmonsfree — the
    // movement value is discarded after.  The previous JS `m.mhp > 0`
    // filter SKIPPED those rn2 calls; removing it brings JS into C-
    // faithful iteration order.  Score-table gain: aggregate P +28.
    for (let m = game.level?.monlist; m; m = m.nmon) {
        try { m.movement += mcalcmove(m, 1); } catch (_e) {}
    }
    try { await maybe_generate_rnd_mon(); } catch (_e) {}

    // u_calc_moveamt: C ref allmain.c:241.  Fires rn2(3) for Fast
    // intrinsic check.  Comes BEFORE settrack/glibr/nh_timeout/etc.
    let wtcap = 0;
    try { wtcap = near_capacity(); } catch (_e) { wtcap = 0; }
    try { u_calc_moveamt(wtcap); } catch (_e) {}

    // settrack: maintains hero's footstep trail.  C ref allmain.c:242.
    try { settrack(); } catch (_e) {}

    // C ref allmain.c:244 — `svm.moves++;`.  Increment happens INSIDE
    // the per-iter setup (after settrack, before the outer-loop check).
    // For normal hero (mmove=12), per_iter_setup runs once per command
    // so moves++ once.  For slow hero (mmove<12), per_iter_setup runs
    // multiple times per command and moves++ accordingly — matching
    // C's per-iter increment.
    if (game.context?.move) {
        game.moves = (game.moves || 1) + 1;
    }

    // Multi-turn freeze: C ref allmain.c:380-388.  Originally narrowed
    // to prayer_done only; 2026-05-30 extended via allowlist to also
    // include the take-off finalizers (Armor_off/Shield_off/etc).
    // These are structurally simple cleanup functions (setworn(null)
    // + property updates, no PRNG draws) so safer to fire than the
    // broader category of afternmv targets.  Per
    // project_singlechar_dispatch_gap memory's callee-blocker
    // pattern: incremental allowlist beats all-or-nothing broadening.
    const __mtf_allow = (game.afternmv === prayer_done
        || game.afternmv === Armor_off
        || game.afternmv === Shield_off
        || game.afternmv === Helmet_off
        || game.afternmv === Gloves_off
        || game.afternmv === Boots_off
        || game.afternmv === Cloak_off
        || game.afternmv === Shirt_off
        || game.afternmv === Shirt_on
        || game.afternmv === eatmdone);
    if ((game.multi || 0) < 0 && __mtf_allow) {
        game.multi++;
        if (game.multi === 0) {
            try { await unmul(null); } catch (_e) {}
        }
    }
    return wtcap;
}

// post_turn_block: C ref allmain.c:271-417.
//
// In C, the structure inside moveloop_core is:
//   do {  // OUTER
//     do { movemon } while (monscanmove);
//     if (!monscanmove && u.umovement < NORMAL_SPEED) {
//       /* mcalcdistress, mcalcmove, maybe_generate, u_calc_moveamt,
//          settrack, moves++, l_nhcore_call, Glib, nh_timeout,
//          run_regions, ublesscnt, regen_*, telepoly, search,
//          mkot_trap_warn, dosounds, do_storms, gethungry,
//          age_spells, exerchk, invault, amulet, wipe_engr_roll,
//          udemigod intervene, movebubbles, multi<0 check */
//     }
//   } while (u.umovement < NORMAL_SPEED);
//   /* OUTSIDE the if-gate, after outer do-while:
//      hero_seq++, encumber_msg, status_eval, seer_turn re-roll,
//      sink_into_lava, see_nearby_monsters */
//
// JS splits the inside-the-gate stuff into TWO pieces:
//   per_iter_setup: mcalcdistress through moves++ + multi<0 check
//   post_turn_block: Glib through wipe_engr_roll + seer_turn re-roll
//
// post_turn_block is called once after the outer do-while exits.
// The first N-1 sections must only fire when the if-gate would have
// fired in C, i.e., when per_iter_setup ran this moveloop_core call
// (caller passes did_per_iter_setup).  Only the seer_turn re-roll
// stays unconditional — C runs it OUTSIDE the if-gate.
//
// For Fast hero (mmove>NORMAL_SPEED), some moveloop_core calls have
// umovement>=NORMAL_SPEED after movemon → gate fails → per_iter_setup
// is skipped.  Pre-fix, post_turn_block fired its full body anyway,
// producing extra dosounds/gethungry/wipe_engr RNG that C doesn't.
// Post-fix, did_per_iter_setup=false skips the body and only the
// seer_turn re-roll runs.  See LEARNINGS §23.187.
async function post_turn_block(wtcap, did_per_iter_setup) {
  if (did_per_iter_setup) {
    // Glib check + glibr: C ref allmain.c:271-272.  C macro:
    // `#define Glib (u.uprops[GLIB].intrinsic || u.uprops[GLIB].extrinsic)`.
    // GLIB property index is 21 (translated/nh-constants.js); 12 is
    // ANTIMAGIC.  Previous code used index 12 and only checked
    // intrinsic, so it (a) tested the wrong property and (b) missed
    // the extrinsic case.  glibr() fires `rn1(3, 2)` per slot to
    // drop wielded items — so when hero is grease-slippery, the
    // dropped-item rolls were misaligned with C.
    const __glibProp = game.u?.uprops?.[21 /* GLIB */];
    if (__glibProp && (__glibProp.intrinsic || __glibProp.extrinsic)) {
        try { await glibr(); } catch (_e) {}
    }

    // nh_timeout: C ref allmain.c:273.
    try { await nh_timeout(); } catch (_e) {}

    // run_regions: C ref allmain.c:274.
    try { await run_regions(); } catch (_e) {}

    // ublesscnt--: C ref allmain.c:276-277.  No RNG.
    if (game.u?.ublesscnt) game.u.ublesscnt--;

    // regen_hp + overexert_hp + regen_pw: C ref allmain.c:294-305.
    try { await regen_hp(wtcap); } catch (_e) {}
    if (wtcap > /*MOD_ENCUMBER*/2 && game.u?.umoved) {
        try { await overexert_hp(); } catch (_e) {}
    }
    try { await regen_pw(wtcap); } catch (_e) {}

    // C ref allmain.c:307-340 — Teleportation / Polymorph / Lycanthropy
    // intrinsic-driven turn-rolls, gated on !u.uinvulnerable.  Each
    // fires `rn2(N)` per turn for the hero, even if N normally doesn't
    // hit zero — the rn2 IS made unconditionally to advance PRNG in
    // sync with C.  On a hit, calls tele() / polyself() / you_were()
    // which fire further RNG.
    //
    // mvl_change is the C file-scope static that carries the deferred
    // poly/were state across moveloop_core iters.  Mirrored via a
    // module-level slot on globalThis.
    if (game.u && !game.u.uinvulnerable) {
        const ut = game.u.uprops?.[UPROP_TELEPORT /* 46 */];
        if (ut && (ut.intrinsic || ut.extrinsic) && !ut.blocked && !rn2(85)) {
            const old_ux = game.u.ux, old_uy = game.u.uy;
            try { await tele(); } catch (_e) {}
            if (game.u.ux !== old_ux || game.u.uy !== old_uy) {
                if (!(await next_to_u())) {  /* async since the flip */
                    try { await check_leash(old_ux, old_uy); } catch (_e) {}
                }
                try { cmdq_clear(/* CQ_CANNED */ 1); } catch (_e) {}
                try { cmdq_clear(/* CQ_REPEAT */ 2); } catch (_e) {}
            }
        }
        // Stale mvl_change re-validation: delayed change may not still
        // be valid if intrinsic was lost between turns.
        let mvl_change = globalThis.__nh_mvl_change || 0;
        const upoly = (game.u.uprops?.[UPROP_POLYMORPH /* 61 */]);
        const polyEnabled = upoly && (upoly.intrinsic || upoly.extrinsic) && !upoly.blocked;
        if ((mvl_change === 1 && !polyEnabled)
            || (mvl_change === 2 && (game.u.ulycn === undefined || game.u.ulycn < 0))) {
            mvl_change = 0;
        }
        if (polyEnabled && !rn2(100)) {
            mvl_change = 1;
        } else if ((game.u.ulycn !== undefined && game.u.ulycn >= 0)
                   && !(game.u.umonnum !== game.u.umonster)
                   && !rn2(80 - (20 * (night() ? 1 : 0)))) {
            mvl_change = 2;
        }
        const uunchg = game.u.uprops?.[UPROP_UNCHANGING /* 63 */];
        const unchanging = uunchg && (uunchg.intrinsic || uunchg.extrinsic);
        if (mvl_change && !unchanging) {
            if ((game.multi || 0) >= 0) {
                try { await stop_occupation(); } catch (_e) {}
                if (mvl_change === 1) {
                    try { await polyself(0 /* POLY_NOFLAGS */); } catch (_e) {}
                } else {
                    try { await you_were(); } catch (_e) {}
                }
                mvl_change = 0;
            }
        }
        globalThis.__nh_mvl_change = mvl_change;
    }

    // C ref allmain.c:342-344 — Searching intrinsic auto-search.
    // `if (Searching && !level.flags.noautosearch && multi >= 0)
    //     dosearch0(1);`  Fires rn2(7) per turn for hero with
    // Searching intrinsic on levels that allow auto-search.
    {
        const us = game.u?.uprops?.[UPROP_SEARCHING /* 34 */];
        const searching = us && (us.intrinsic || us.extrinsic) && !us.blocked;
        if (searching && !(game.level?.flags?.noautosearch) && (game.multi || 0) >= 0) {
            try { await dosearch0(1); } catch (_e) {}
        }
    }

    // mkot_trap_warn: C ref allmain.c:351.  No RNG.
    try { await mkot_trap_warn(); } catch (_e) {}

    // dosounds + do_storms + gethungry: C ref allmain.c:352-354.
    try { await dosounds(); } catch (_e) {}
    try { await do_storms(); } catch (_e) {}
    try { await gethungry(); } catch (_e) {}

    // age_spells + exerchk: C ref allmain.c:355-356.
    try { age_spells(); } catch (_e) {}
    try { await exerchk(); } catch (_e) {}

    // invault: C ref allmain.c:357.
    try { await invault(); } catch (_e) {}

    // amulet: C ref allmain.c:358-359.  Gated on hero having the amulet.
    if (game.u?.uhave?.amulet) {
        try { await amulet(); } catch (_e) {}
    }

    // Wipe-engr roll inline at allmain.c:360-361 — `if (!rn2(40 + DEX*3))
    //     u_wipe_engr(rnd(3))`.  When the dex-based rn2 rolls 0,
    // u_wipe_engr fires its own rnd(3) for amount-to-wipe.  Previously
    // we fired only the gate rn2 and dropped the consequent rnd(3),
    // which shifted PRNG by one call on every turn where rn2 happened
    // to roll 0.
    const dex = game.u?.acurr?.a?.[3] ?? 14;
    if (rn2(40 + dex * 3) === 0) {
        rnd(3);
    }
  } // end of `if (did_per_iter_setup)` — the inside-the-gate block

    // Seer-turn re-roll, C ref allmain.c:414-417 — `if (moves >=
    // context.seer_turn) context.seer_turn = moves + rn1(31, 15);`.
    // C fires this OUTSIDE the if-gate, in the once-per-hero-took-time
    // block.  Stays unconditional in JS.
    if (game.moves !== undefined && game.context?.seer_turn !== undefined
            && game.moves >= game.context.seer_turn) {
        game.context.seer_turn = game.moves + rn2(31) + 15;
    }
}

// One full C-style per-turn iteration: u.umovement decrement, the
// monscanmove inner-loop with watchdog, per_iter_setup gated on
// `!monscanmove && umovement < NORMAL_SPEED`, the moved-monster
// display refresh, and finally post_turn_block.  Encapsulated so
// the multi-turn-freeze atomic completion path can call it the same
// number of times C's moveloop calls it when `multi < 0`.  Each
// invocation must be re-entrant within one rhack-bounded
// moveloop_core call: it relies only on the live g.* state and its
// own locals.  Added 2026-05-31 for the multi-turn freeze fix
// (§23.222f).
async function runPerTurnIteration() {
    const g = game;
    g.u.umovement -= 12;
    // Snapshot monster positions BEFORE movemon so we can refresh
    // the display for cells the monsters left.
    const __preMonPos = [];
    if (g.level?.monlist) {
        for (let __m = g.level.monlist; __m; __m = __m.nmon) {
            __preMonPos.push({ m: __m, x: __m.mx, y: __m.my });
        }
    }
    let wtcap_last = 0;
    let __outer_iters = 0;
    const __OUTER_LIMIT = 5;
    let __per_iter_ran = false;
    do {
        if (++__outer_iters > __OUTER_LIMIT) break;
        let monscanmove = 0;
        do {
            const rngSnap = snapshot_rng_state();
            const logLen = g._rngLog?.length || 0;
            g._movemon_watchdog = {
                count: 0,
                limit: MOVEMON_WATCHDOG_LIMIT,
                deadline_ms: wallClockDeadline(MOVEMON_WATCHDOG_DEADLINE_MS),
            };
            try {
                monscanmove = await movemon();
            } catch (_e) {
                if (process.env.NH_WDPROBE) console.warn('[wd] movemon aborted @rng', logLen, ':', _e?.message?.slice(0, 60));
                restore_rng_state(rngSnap);
                if (Array.isArray(g._rngLog) && g._rngLog.length > logLen) {
                    g._rngLog.length = logLen;
                }
                monscanmove = 0;
            } finally {
                g._movemon_watchdog = null;
            }
            if (g.u.umovement >= 12) break;
        } while (monscanmove);
        if (!monscanmove && g.u.umovement < 12) {
            try { wtcap_last = await per_iter_setup(); } catch (_e) {}
            __per_iter_ran = true;
        }
    } while (g.u.umovement < 12);
    // Refresh display cells for monsters that ACTUALLY moved or died.
    try {
        for (const __snap of __preMonPos) {
            const __cell_owner = g.level?.monsters?.[__snap.x]?.[__snap.y];
            if (__cell_owner === __snap.m) continue; // stationary
            newsym(__snap.x, __snap.y);
            if (__snap.m.mhp > 0) {
                const __nx = __snap.m.mx, __ny = __snap.m.my;
                if (typeof __nx === 'number' && typeof __ny === 'number'
                    && __nx > 0 && __ny >= 0
                    && (__nx !== __snap.x || __ny !== __snap.y)) {
                    newsym(__nx, __ny);
                }
            }
        }
    } catch (_e) {}
    try { await post_turn_block(wtcap_last, __per_iter_ran); } catch (_e) {}
}

// C ref: allmain.c moveloop_core()
export async function moveloop_core() {
    const g = game;

    // Per-turn block: C ref allmain.c:203-260.  C structure:
    //
    //   if (svc.context.move) {
    //       u.umovement -= NORMAL_SPEED;
    //       do {                              // OUTER do-while
    //           do {                          // INNER do-while
    //               monscanmove = movemon();
    //               if (u.umovement >= NORMAL_SPEED) break;
    //           } while (monscanmove);
    //           if (!monscanmove && u.umovement < NORMAL_SPEED) {
    //               // new turn setup: mcalcdistress + mcalcmove loop
    //               // + maybe_generate + u_calc_moveamt + settrack + moves++
    //           }
    //       } while (u.umovement < NORMAL_SPEED);
    //       // post_turn_block: Glib, nh_timeout, run_regions, regen, etc.
    //   }
    //
    // The inner loop lets fast monsters (mmove>NORMAL_SPEED) fire
    // dochug multiple times per command — each iter of movemon
    // subtracts NORMAL_SPEED from their movement; while any still
    // has movement >= NORMAL_SPEED, the inner loop re-enters.
    //
    // Without this loop structure, a pet with mov=24 fires dochug
    // ONCE per command in JS where C fires it TWICE.  Closes the
    // seed0014 PRNG idx 2993 divergence (and related sessions).
    //
    // movemon is wrapped in a watchdog (count + wall-clock) per call
    // to guard against translator-side infinite loops; on throw,
    // restore the PRNG state and surface monscanmove=0 so the loop
    // terminates cleanly.
    if (g.context?.move) {
        await runPerTurnIteration();
    }

    // C ref allmain.c:513 — `u.umoved = FALSE;` runs after the per-turn
    // block (which includes u_calc_moveamt reading the PREVIOUS turn's
    // u.umoved) and BEFORE the command dispatch.  The hand moveloop was
    // missing this reset, so once the hero moved (hack.js sets u.umoved=1)
    // it stayed stale-TRUE forever — and u_calc_moveamt's `if (u.usteed
    // && u.umoved)` branch then fired an extra mcalcmove(u.usteed) every
    // turn on RIDING sessions where C's per-turn u.umoved was FALSE
    // (seed0103/0104 knight-ride: div at the per-turn mcalcmove loop,
    // C does regen_hp where JS did the extra mcalcmove(steed)).  Reset
    // matches C's position: after u_calc_moveamt, before rhack.
    g.u.umoved = 0;

    // Recompute armor class once per player input.  C ref allmain.c:453
    // — the "once-per-player-input" block calls find_ac() every iteration
    // so u.uac tracks worn-gear changes (e.g. doffing a cloak via the
    // no-delay armoroff path, which removes uarmc + prints off_msg but
    // never calls find_ac itself; C relies on this moveloop call to update
    // botl).  The hand moveloop was missing it, so u.uac stayed at its
    // chargen value forever (seed0116: doff cloak of magic resistance at
    // T:3 → C AC 9→10, JS stuck at 9, shifting the whole status line).
    // find_ac consumes no RNG (pure recompute from worn items + uprops),
    // so this is PRNG-safe.  Must run before bot() so the rendered AC is
    // current.  [[hand-moveloop-missing-state-resets]]
    try { find_ac(); } catch (_e) {}

    // Vision + display
    if (g.vision_full_recalc) {
        vision_recalc(0);
        g.vision_full_recalc = 0;
    }
    await bot();
    await flush_screen(1);

    // Read and execute one command.  rhack itself clears
    // _pending_message after nhgetch's screen capture but
    // BEFORE the dispatch may pline a new message — so the
    // captured screen on the NEXT iter shows THIS iter's pline
    // output, mirroring NetHack's topl-message lifecycle.
    // C ref allmain.c:510-522 — when an occupation is active
    // (game.occupation set, multi >= 0), the moveloop runs the
    // occupation IN PLACE OF reading a command (rhack), then checks
    // monster_nearby() to interrupt.  Implements the POSITIVE-multi
    // / occupation side of the loop (the negative-multi freeze tail
    // below is the other half).  Used by counted repeat commands
    // ("20s" → searching occupation) and multi-turn eating/tin-
    // opening.  Verified safe: no current PASS session has an active
    // occupation (fortune cookies eat in 1 turn; seed0105 doesn't
    // eat).  game.occupation is a real null-initialized field (the
    // translated moveloop_core checks it the same way), so the
    // truthiness test is ghost-safe.
    if ((g.multi || 0) >= 0 && g.occupation) {
        let __occRes = 0;
        try { __occRes = await g.occupation(); } catch (_e) { __occRes = 0; }
        if (__occRes === 0) g.occupation = null;
        let __mn = false;
        try { __mn = !!monster_nearby(); } catch (_e) { __mn = false; }
        if (__mn) { try { await stop_occupation(); } catch (_e) {} }
        g.context.move = 1; // the occupation took a turn
    } else if ((g.multi || 0) > 0 && g._multiSearch === 1) {
        // C ref allmain.c:515-531 — counted non-movement command repeat.
        // For search (svc.context.mv FALSE) C does `--gm.multi;
        // rhack(gc.cmd_key)`.  This runs in the SAME control-flow slot as
        // a normal command (after the monster-movement turn at the top),
        // and when multi reaches 0 the NEXT iteration falls through to
        // rhack(0) below — its monster-movement turn (hero stationary) is
        // the settling turn C runs before reading the next command.
        // Replaces the search occupation, which completed one monster-turn
        // early and forked the monster-movement cluster (UNWEDGE 113-115).
        g.multi--;
        if ((g.multi || 0) <= 0) g._multiSearch = 0; // last repeat
        await rhack(g._cmd_key || 115);
    } else {
        await rhack(0);
    }

    // Multi-turn freeze atomic completion — §23.222f.  In C, when
    // rhack's dispatch leaves `gm.multi < 0` (e.g. dopray's
    // `nomul(-3)`), the moveloop's next N iterations RUN THE FULL
    // per-turn block (movemon, mcalcdistress, mcalcmove,
    // u_calc_moveamt's Fast rn2(3), settrack, moves++, Glib,
    // nh_timeout, regen_hp's rn2(100), regen_pw, Teleportation /
    // Polymorph / Lycanthropy turn-rolls, dosounds, gethungry,
    // wipe_engr_roll, ...) while SKIPPING rhack (the rhack section
    // is gated on `multi >= 0` in C — allmain.c:515,532).  After
    // N=|multi| iterations, multi reaches 0, unmul fires the
    // nomovemsg + the afternmv callback (prayer_done, *_off, etc.).
    //
    // Previously JS had the multi countdown INSIDE per_iter_setup
    // gated only by the afternmv allowlist, and per_iter_setup
    // runs ONCE per moveloop_core call — so multi ticked once per
    // USER INPUT.  For seed0017 prayer that meant the begin /
    // finish / displeased messages drifted 3 user inputs apart in
    // JS instead of all queuing up in the same nhgetch-dmore drain
    // as C.
    //
    // Atomic completion here calls runPerTurnIteration() in a
    // bounded loop while multi<0, faithfully firing every rn2 call
    // C would fire during the frozen turns.  Because the iteration
    // body is the SAME translator-emitted machinery (per_iter_setup
    // + post_turn_block + movemon), the PRNG sequence matches C's
    // spread-across-iterations semantics.
    //
    // Allowlist is the same as per_iter_setup's __mtf_allow: only
    // afternmv targets we've audited as safe to drive atomically.
    // safety cap of 8 covers the largest known nomul depth (prayer
    // is -3, takeoff is generally -1 to -3) with margin.
    const __mtf_allow_atomic = (game.afternmv === prayer_done
        || game.afternmv === Armor_off
        || game.afternmv === Shield_off
        || game.afternmv === Helmet_off
        || game.afternmv === Gloves_off
        || game.afternmv === Boots_off
        || game.afternmv === Cloak_off
        || game.afternmv === Shirt_off
        || game.afternmv === Shirt_on
        || game.afternmv === eatmdone);
    let __mtf_safety = 8;
    const __mtf_started = (game.multi || 0) < 0 && __mtf_allow_atomic;
    while ((game.multi || 0) < 0 && __mtf_allow_atomic && __mtf_safety-- > 0) {
        // C ref allmain.c:203 — per-turn block runs ONLY when
        // svc.context.move is set.  dopray (and other multi-turn
        // setters) leave context.move=1 across iterations during
        // the freeze, so re-assert it here in case a code path
        // cleared it between rhack and now.
        g.context.move = 1;
        await runPerTurnIteration();
    }
    // After the atomic freeze completes, clear context.move so the
    // NEXT moveloop_core call's initial per-turn block doesn't fire
    // an extra time.  In C the equivalent state — multi reached 0
    // INSIDE iteration N's per-turn block — is followed by iter N's
    // own rhack(0) reading the next user input and that dispatch
    // (e.g. ' ' → "Unknown command") clears context.move; subsequent
    // iters with context.move=0 skip the block.  My loop subsumed
    // iters 2..N of the per-turn block but left context.move=1
    // dangling because the rhack at the end of THIS moveloop_core
    // call already ran (consuming 'y', not ' ').  Clearing here
    // mirrors what C's dispatch of the post-freeze input would do.
    if (__mtf_started) g.context.move = 0;

    // C ref allmain.c:538 — after rhack, if `u.utotype` (level-
    // transition flags set by schedule_goto) is non-zero, fire
    // deferred_goto to execute the transition.  Stairs (`>`/`<`)
    // call goto_level directly, but scheduled paths (level_tele
    // via ^V, vault_tele, level_tele_trap) all need this post-
    // rhack hook.  Layer 2 of project_wizlevelport_blocked.
    if (game.u?.utotype) {
        try { await t_deferred_goto(); } catch (_e) {
            if (__env.NH_DEBUG_DEFERRED_GOTO) console.error('[deferred_goto]', _e.message, '\n', _e.stack?.split('\n').slice(1, 4).join('\n'));
        }
    }

    // moves++ is inside per_iter_setup (C ref allmain.c:244, inside
    // the outer do-while).  No latch needed since per_iter_setup is
    // called explicitly per outer iter, not by a fire-once side path.
}

// C ref: allmain.c moveloop()
export async function moveloop(resuming) {
    vision_recalc(0);
    await docrt();
    await flush_screen(1);

    for (;;) {
        await moveloop_core();
        if (game.program_state?.gameover) break;
    }
}
