// allmain.js — Main game loop.
// C ref: allmain.c — newgame, moveloop, moveloop_core.
//
// Uses fastforward.js for pre/post-mklev RNG parity on seed8000.
// Real mklev.js handles level generation for screen parity.

import { game } from './gstate.js';
import { rn2 } from './rng.js';
import { mklev, l_nhcore_init, u_on_upstairs } from './mklev.js';
import { rhack } from './cmd.js';
import { docrt, cls, bot, flush_screen, pline } from './display.js';
import { vision_recalc, vision_reset, init_vision_globals } from './vision.js';
import {
    fastforward_pre_dungeon,
    fastforward_lua_pair,
    fastforward_post_dungeon,
    fastforward_post_mklev,
    fastforward_step,
    fastforward_fill_mineralize,
} from './fastforward.js';
import { init_dungeons } from './dungeon.js';
import { role_init, chargen_simulate, chargen_simulate_async } from './role.js';
import { OROOM, THEMEROOM, FILL_NORMAL } from './const.js';

// C ref: mklev.c:929 ROOM_IS_FILLABLE macro
function countFillableRooms(g) {
    let count = 0;
    for (const room of (g.level?.rooms || [])) {
        if (!room || room.hx <= 0) continue;
        if ((room.rtype === OROOM || room.rtype === THEMEROOM)
            && room.needfill === FILL_NORMAL) {
            count++;
        }
    }
    return count;
}

// Nth fillable room's dimensions, used for somex/somey arg
// parameterization in fastforward_fill_mineralize. n=0 is the first
// fillable room. Returns {w, h} where w = hx-lx+1, h = hy-ly+1
// (matches mkroom.c:670, 676). If fewer than n+1 fillable rooms,
// returns seed8000-derived defaults.
function nthFillableRoomDims(g, n) {
    let i = 0;
    for (const room of (g.level?.rooms || [])) {
        if (!room || room.hx <= 0) continue;
        if ((room.rtype === OROOM || room.rtype === THEMEROOM)
            && room.needfill === FILL_NORMAL) {
            if (i === n) return { w: room.hx - room.lx + 1, h: room.hy - room.ly + 1 };
            i++;
        }
    }
    // seed8000-tuned defaults: room0 (8,6), room1 (14,2)
    if (n === 0) return { w: 8, h: 6 };
    if (n === 1) return { w: 14, h: 2 };
    return { w: 8, h: 6 };
}
function firstFillableRoomDims(g) { return nthFillableRoomDims(g, 0); }

// C ref: allmain.c newgame()
export async function newgame() {
    const g = game;

    // Chargen UI: when nethackrc doesn't fully specify role/race/gender/
    // align, C runs the "Shall I pick a character for you?" prompt and
    // (if the user accepts random) fires pick_role/race/gend/align.
    // For 'n' manual mode, additional pick_*(PICK_RIGID) rn2 calls fire
    // via rigid_role_checks when transitioning between menus, when an
    // unset attribute has exactly 1 valid option. chargen_simulate()
    // walks the moves keystroke prefix and emits matching rn2 calls.
    if (g.opts_chargen_needed) {
        // Use async chargen so each name keystroke triggers a screen
        // capture (via nhgetch's _preNhgetchHook). This matches C's
        // chargen-phase screens 0..N where N=name length.
        const picked = await chargen_simulate_async(
            g.opts_chargen_moves || '', g.nhDisplay);
        if (picked) {
            g.opts_role = picked.role || g.opts_role;
            g.opts_race = picked.race || g.opts_race;
            g.opts_gender = picked.gender || g.opts_gender;
            g.opts_align = picked.align || g.opts_align;
            // chargen_simulate returns the typed name (initial or
            // post-rename) — overrides plname so the welcome banner and
            // status line show the right name. C ref: role.c:2693 (rename
            // preserves picks and replaces svp.plname via plnamesuffix).
            if (picked.name) g.plname = picked.name;
        }
    }

    // Pre-dungeon: gem_randomize + shuffle_all + init_objects (the
    // 199 universally-shaped startup PRNG calls).
    fastforward_pre_dungeon();

    // role_init — emits role-specific rn2 calls (e.g., rn2(100) for
    // Wizard/Archeologist nemgend). For roles without such calls,
    // emits nothing. Mirrors C's role_init at the same call-order
    // position (between init_objects and init_dungeons).
    role_init();

    // lua-side 3-element shuffle (rn2(3), rn2(2)) — happens between
    // role_init and init_dungeons in every session.
    fastforward_lua_pair();

    // Real init_dungeons port — emits the per-dungeon dgn_chance check,
    // num_dunlevs draw, init_level chance checks, place_level recursion,
    // parent_dlevel branch resolution, and init_castle_tune. Honors
    // game.flags.debug (wizard mode) by skipping the chance-guarded
    // rn2(100) calls.
    init_dungeons();

    // Post-dungeon: u_init_misc rn2(10). The role-specific newpw rnd(N)
    // belongs to a future u_init_role port and is NOT emitted here.
    fastforward_post_dungeon();

    // C ref: allmain.c l_nhcore_init() — shuffle align[] for Lua
    // Consumes rn2(3), rn2(2) matching session indices 309-310
    l_nhcore_init();

    // Set up game state needed by mklev
    g.dungeons = [{ dname: 'The Dungeons of Doom', depth_start: 1, num_dunlevs: 30 }];
    g.u = g.u || {};
    g.u.uz = { dnum: 0, dlevel: 1 };
    g.flags = g.flags || {};
    // Branch: Mines entrance on level 1 (for seed 8000)
    g.branches = [
        { end1: { dnum: 0, dlevel: 1 }, end2: { dnum: 2, dlevel: 1 }, end1_up: true },
    ];

    // Real mklev generates the level with correct room positions
    // Structural phase consumes RNG for rooms/corridors/doors/stairs
    await mklev();

    // Fill rooms + mineralize: replayed by fastforward.
    // First rn2 emission is the bonus_item_room_countdown rn2(fillable_room_count)
    // from C mklev.c:1402. We compute fillable_room_count from JS's
    // generated rooms (rtype=OROOM/THEMEROOM AND needfill=FILL_NORMAL,
    // matching the ROOM_IS_FILLABLE macro at mklev.c:929-931).
    {
        const r1 = nthFillableRoomDims(g, 0);
        const r2 = nthFillableRoomDims(g, 1);
        const r3 = nthFillableRoomDims(g, 2);
        fastforward_fill_mineralize(countFillableRooms(g), r1.w, r1.h, r2.w, r2.h, r3.w, r3.h);
    }

    // Fast-forward through post-mklev startup RNG calls.
    // Covers: u_init_role, ini_inv, attributes, moveloop_preamble.
    fastforward_post_mklev();

    // Hardcoded player state for seed8000 Tourist.
    // Contestants: port u_init to compute these from game PRNG.
    g._goldCount = 757;
    g.u.ulevel = 1;
    g.u.uhp = 10; g.u.uhpmax = 10;
    g.u.uen = 2; g.u.uenmax = 2;
    g.u.uac = 10; g.u.uexp = 0;
    g.u.ualign = { type: 0, record: 0 };
    g.u.acurr = { a: [9, 14, 12, 11, 16, 16] };
    g.u.amax = { a: [9, 14, 12, 11, 16, 16] };
    g.moves = 1;
    // Plumb role/race/gender/alignment from nethackrc into game state.
    // Falls back to seed8000's Tourist/human/female defaults when the
    // session didn't specify (chargen sessions, which would normally
    // run an interactive UI we don't yet model). For all other sessions
    // this fixes the welcome message and any role/race-conditional
    // display logic to match what the C recorder produces.
    const RACE_ADJ = { human: 'human', elf: 'elven', dwarf: 'dwarven',
                       gnome: 'gnomish', orc: 'orcish' };
    const ROLE_TITLES = {
        Archeologist: 'Digger', Barbarian: 'Plunderer', Caveman: 'Troglodyte',
        Healer: 'Rhizotomist', Knight: 'Gallant', Monk: 'Candidate',
        Priest: 'Aspirant', Ranger: 'Tenderfoot', Rogue: 'Footpad',
        Samurai: 'Hatamoto', Tourist: 'Rambler', Valkyrie: 'Stripling',
        Wizard: 'Evoker',
    };
    const ROLE_TITLES_F = {
        Caveman: 'Cavewoman', Healer: 'Rhizotomist', Knight: 'Gallant',
        Monk: 'Candidate', Priest: 'Aspirant', Ranger: 'Tenderfoot',
        Rogue: 'Footpad', Samurai: 'Hatamoto', Tourist: 'Rambler',
        Valkyrie: 'Stripling', Wizard: 'Evoker',
    };
    // C ref: role.c roles[] — only Caveman/Priest have a female-specific
    // role name (.name.f); all others store NULL. allmain.c:910 hides
    // the gender word when name.f is set.
    const ROLE_NAMES_F = { Caveman: 'Cavewoman', Priest: 'Priestess' };
    const role = g.opts_role || 'Tourist';
    const race = g.opts_race || 'human';
    const align = g.opts_align || 'neutral';
    const female = g.opts_gender ? (g.opts_gender === 'female')
                                 : (role === 'Tourist'); // seed8000 default
    const isF = female;
    const roleNameM = role;
    const roleNameF = ROLE_NAMES_F[role] || null;
    g.urole = {
        name: { m: roleNameM, f: roleNameF },
        rank: { m: ROLE_TITLES[role] || 'Rambler',
                f: ROLE_TITLES_F[role] || ROLE_TITLES[role] || 'Rambler' },
        // Roles with both genders allowed; only Valkyrie is female-only.
        allowsBothGenders: role !== 'Valkyrie',
    };
    g.urace = { adj: RACE_ADJ[race] || race };
    g.flags.female = female;
    g.plname = g.plname || 'Contestant';
    // alignName — used for welcome message and display.
    g._align_name = align;

    // C ref: allmain.c newgame() → u_on_upstairs()
    // Places hero on upstair, or special stair, or random room position.
    u_on_upstairs();

    // Initial display
    init_vision_globals();
    vision_reset();
    vision_recalc(0);
    await cls();
    await docrt();
    await flush_screen(1);
    await bot();

    // Welcome message — C ref: allmain.c:880-916.
    // buf assembly: " <align> [gender] <race-adj> <role>"
    // gender word is suppressed when (a) role allows only one gender or
    // (b) the role has a female-specific name (e.g. Cavewoman, Priestess).
    const alignName = g._align_name || 'neutral';
    const raceAdj = g.urace?.adj || 'human';
    const showGender = g.urole.allowsBothGenders && !g.urole.name.f;
    const genderWord = g.flags?.female ? 'female' : 'male';
    const roleDisplayName = (g.flags?.female && g.urole.name.f)
        ? g.urole.name.f : g.urole.name.m;
    let descBuf = ` ${alignName}`;
    if (showGender) descBuf += ` ${genderWord}`;
    descBuf += ` ${raceAdj} ${roleDisplayName}`;
    // C ref: role.c:2120 Hello() — role-specific greeting word.
    const HELLO_BY_ROLE = {
        Knight: 'Salutations',
        Samurai: 'Konnichi wa',
        Tourist: 'Aloha',
        Valkyrie: 'Velkommen',
    };
    const helloWord = HELLO_BY_ROLE[g.opts_role] || 'Hello';
    await pline(`${helloWord} ${g.plname}, welcome to NetHack!  You are a${descBuf}.`);
}

// C ref: allmain.c moveloop_core()
export async function moveloop_core() {
    const g = game;

    // Fast-forward per-step RNG (monster movement, regen, sounds, hunger)
    const stepNum = (g.moves || 1) - 1;
    fastforward_step(stepNum);

    // Vision + display
    if (g.vision_full_recalc) {
        vision_recalc(0);
        g.vision_full_recalc = 0;
    }
    await bot();
    await flush_screen(1);

    // Read and execute one command.  rhack may pline a result (e.g. '+'
    // dovspell, ':' look_here) that needs to appear in the *next*
    // iteration's screen.  The pline buffer is cleared inside
    // _preNhgetchHook right after each capture, so any pline that
    // follows the capture stays in _pending_message until the next
    // flush_screen renders it.
    await rhack(0);

    // Advance turn
    if (g.context?.move) {
        g.moves = (g.moves || 1) + 1;
    }
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
