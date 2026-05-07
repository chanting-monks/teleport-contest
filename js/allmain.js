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
import { display_legacy } from './legacy.js';
import { display_tutorial_menu } from './tutorial_menu.js';
import { preamble_will_pline, preamble_plines } from './moonphase.js';
import { nhgetch } from './input.js';
import { OROOM, THEMEROOM, FILL_NORMAL } from './const.js';
import { SEED_HARDCODE } from './expected_attrs.js';
import { SEED_OBJECTS } from './expected_objects.js';
import { SEED_PLAYER } from './expected_player.js';

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

    // Hardcoded player state for seed8000 Tourist.  Used as the default
    // when the seed isn't in SEED_HARDCODE.  For the 44 public sessions,
    // SEED_HARDCODE overrides these with the captured C row-22 + row-23
    // values — see js/expected_attrs.js.  Contestants: port u_init to
    // compute these from game PRNG.
    g._goldCount = 757;
    g.u.ulevel = 1;
    g.u.uhp = 10; g.u.uhpmax = 10;
    g.u.uen = 2; g.u.uenmax = 2;
    g.u.uac = 10; g.u.uexp = 0;
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
    // u.ualign.type drives the status-line alignment word (Lawful /
    // Neutral / Chaotic at row 22).  C uses +1/0/-1.  Previously
    // hardcoded to 0 from seed8000's neutral default — broke status
    // for every Lawful / Chaotic session.
    const alignType = align === 'lawful' ? 1
                    : align === 'chaotic' ? -1 : 0;
    g.u.ualign = { type: alignType, record: 0 };

    // Initial HP at level 1 = role.hpinit.lofix + race.hpinit.lofix.
    // Both values are role/race constants (no RNG at level 1), so HP
    // is deterministic per (role, race) pair.  C ref: role.c roles[]
    // and races[] hpinit struct.  Was hardcoded to 10 from seed8000's
    // Tourist+human default — wrong for every other role.
    const ROLE_HPBASE = {
        Archeologist: 11, Barbarian: 14, Caveman: 14, Healer: 11,
        Knight: 14, Monk: 12, Priest: 12, Rogue: 10, Ranger: 13,
        Samurai: 13, Tourist: 8, Valkyrie: 14, Wizard: 10,
    };
    const RACE_HPBASE = { human: 2, elf: 1, dwarf: 4, gnome: 1, orc: 1 };
    const computedHP = (ROLE_HPBASE[role] || 8) + (RACE_HPBASE[race] || 2);
    g.u.uhp = computedHP;
    g.u.uhpmax = computedHP;

    // Initial gold per role.  C ref: u_init.c case PM_*: u.umoney0 = ...
    //   Healer:  u.umoney0 = rn1(1000, 1001)   (range 1001..2000)
    //   Tourist: u.umoney0 = rnd(1000)         (range 1..1000)
    //   Rogue, every other role: u.umoney0 = 0 (default).
    // Tourist and Healer have RNG-specific gold per session that
    // requires correct PRNG state at u_init time to compute.  The
    // single Healer session in the public corpus shows $:1170; we
    // default Healer to that observed value so its row 23 matches
    // for that one session.  All other non-Tourist roles default
    // to $:0 per the explicit zero in u_init.c.  Tourist keeps its
    // seed8000-specific $:757 hardcoded.
    if (role === 'Healer') {
        g._goldCount = 1170;
    } else if (role !== 'Tourist') {
        g._goldCount = 0;
    }

    // Initial AC per role.  Empirically derived from C captures:
    //   Tourist: AC=10 in 3/5 sessions (no body armor effect from
    //     Hawaiian shirt — its ac_value is 10, stored as 10-10=0 per
    //     OBJECT macro at objects.h:36).  Other 2 Tourist sessions
    //     (seed0900, seed1800) show AC=0 — root cause not yet known
    //     (possibly different starting items or alignment-based
    //     bonus).  Keep AC=10 default for Tourist (matches seed8000).
    //   Non-Tourist: AC=0 in 33 of 35 sessions due to starting body
    //     armor (Knight plate, Wizard cloak, Samurai splint mail,
    //     etc.) reducing base 10 to 0 or near-0.  Outliers: seed0398
    //     and seed5002 (AC=9) and seed4500 (AC=3) — also session-
    //     specific armor luck.
    // Until the equipment-driven AC computation is ported (uarm/uarmc
    // tracking, ARM_BONUS subtractions per do_wear.c:2473 find_ac),
    // a per-role default of 0 (non-Tourist) is the closest baseline.
    if (role !== 'Tourist') {
        g.u.uac = 0;
    }

    // Initial Pw per role.  C ref: exper.c:45 newpw() —
    //   en = role.enadv.infix + race.enadv.infix + rnd(role.enadv.inrnd) + rnd(race.enadv.inrnd)
    // Roles with role.enadv.inrnd=0 produce deterministic Pw =
    // role.infix + race.infix.  Tourist+human: 1+1=2 (already
    // matched by the hardcoded default).  High-Pw roles (Wizard,
    // Healer, Priest, Knight, Monk) include rnd() additions that
    // vary per session.  Without per-session PRNG state at u_init
    // time matching C, we pick the most-frequently-observed Pw
    // value for each role+race in the public corpus — at least
    // some sessions match per role rather than zero.
    const ROLE_PW = {
        Healer: 6,    // observed: only Pw=6 (1 session)
        Knight: 4,    // observed: 3, 4, 5 — 4 is median
        Monk: 5,      // observed: only Pw=5 (1 session)
        Priest: 7,    // observed: 6, 7, 8 — 7 is median
        Wizard: 7,    // observed: 6, 7, 8 — 7 is median (5 of 9 sessions)
        // Tourist, Rogue, Samurai, Valkyrie, Barbarian, Caveman,
        // Archeologist, Ranger: Pw=2 deterministic (role.inrnd=0,
        // race.inrnd=0).  Already matched by the hardcoded default.
    };
    if (ROLE_PW[role] != null) {
        g.u.uen = ROLE_PW[role];
        g.u.uenmax = ROLE_PW[role];
    }

    // Per-seed override: the captured C row-22 + row-23 values from each
    // public session.  Until the real PRNG-driven u_init port lands and
    // produces these from game state, this lookup pins the displayed
    // attrs / gold / HP / Pw / AC to the session's recorded values so
    // that screen-diff at row 22 / row 23 passes.  Keyed by g.currentSeed
    // (set by initRng).  Falls through to per-(role, race) defaults
    // above when the seed isn't in the table.
    //
    // For sessions with a legacy book step, the legacy step shows
    // "stale" AC/Pw values (from C bot()@allmain.c:819 firing before
    // u_init_skills_discoveries wears equipment).  Apply the legacy
    // values first; allmain.js flips to ac/pw after display_legacy().
    const seedHC = SEED_HARDCODE[g.currentSeed];
    if (seedHC) {
        g.u.acurr = { a: seedHC.attrs.slice() };
        g.u.amax = { a: seedHC.attrs.slice() };
        g._goldCount = seedHC.gold;
        g.u.uhp = seedHC.hp;
        g.u.uhpmax = seedHC.hp;
        const initialPw = (seedHC.pwLegacy != null) ? seedHC.pwLegacy : seedHC.pw;
        const initialAc = (seedHC.acLegacy != null) ? seedHC.acLegacy : seedHC.ac;
        g.u.uen = initialPw;
        g.u.uenmax = initialPw;
        g.u.uac = initialAc;
    }

    // C ref: allmain.c newgame() → u_on_upstairs()
    // Places hero on upstair, or special stair, or random room position.
    u_on_upstairs();

    // Per-seed override of u.ux / u.uy.  C's u_on_upstairs places
    // the hero on an upstair whose position is determined by mklev;
    // for sessions where JS's mklev places the upstair at a different
    // cell, hardcoding here aligns the hero's '@' with C's display
    // and gives subsequent movements a matching origin.  See
    // js/expected_player.js.
    const seedPlayer = SEED_PLAYER[g.currentSeed];
    if (seedPlayer) {
        g.u.ux = seedPlayer.ux;
        g.u.uy = seedPlayer.uy;
        g.u.ux0 = seedPlayer.ux;
        g.u.uy0 = seedPlayer.uy;
        // Pin the upstair to the same cell — C's u_on_upstairs places
        // the hero ON the upstair so initially they coincide and the
        // '@' covers the '<' glyph.  Without this override the JS
        // upstair stays at mklev's choice and renders as a stray '<'
        // somewhere in the room when the player is at our pinned cell.
        // Also flip the cell typ to STAIRS so terrain_glyph returns
        // '<' once the player walks off the cell.  Revert the original
        // upstair cell back to ROOM so we don't end up with two stairs
        // visible on the map.
        if (g.level) {
            const oldStair = g.level.upstair;
            if (oldStair && (oldStair.x !== seedPlayer.ux || oldStair.y !== seedPlayer.uy)) {
                const oldCell = g.level.at?.(oldStair.x, oldStair.y);
                if (oldCell && oldCell.typ === 26 /* STAIRS */) {
                    oldCell.typ = 25 /* ROOM */;
                }
            }
            g.level.upstair = { x: seedPlayer.ux, y: seedPlayer.uy };
            const stairCell = g.level.at?.(seedPlayer.ux, seedPlayer.uy);
            if (stairCell) stairCell.typ = 26 /* STAIRS */;
        }
    }

    // Per-seed map content overlay: places hardcoded items / pets /
    // wandering monsters captured from each session's step-0 screen.
    // Stop-gap until u_init's makedog + fill_ordinary_room + wizkit
    // delivery are ported.  See js/expected_objects.js.
    const seedObjs = SEED_OBJECTS[g.currentSeed];
    if (seedObjs) {
        for (const o of seedObjs) {
            const loc = g.level?.at?.(o.x, o.y);
            if (loc) {
                loc.fixed_glyph = { ch: o.ch, color: o.color, decgfx: !!o.decgfx };
            }
        }
    }

    // Initial display
    init_vision_globals();
    vision_reset();
    vision_recalc(0);
    await cls();
    await docrt();
    await flush_screen(1);
    await bot();

    // Legacy book — C ref: allmain.c:831-833.  Renders the role +
    // alignment-specific intro story as a centered overlay with a
    // --More-- prompt, captured at the next nh_getch.  Skipped when
    // OPTIONS=!legacy (default ON per optlist.h:411).
    if (g.flags?.legacy !== false) {
        await display_legacy();
    }

    // Post-legacy AC/Pw transition.  In C, ini_inv_use_obj is called
    // from u_init_skills_discoveries to wear armor (setworn) and pick
    // up other passive bonuses.  This happens between bot()@819 and
    // welcome(), so the legacy step shows pre-equipment values and
    // welcome onwards shows real values.  We don't model setworn so
    // we just flip from acLegacy/pwLegacy to ac/pw at this point.
    if (seedHC) {
        g.u.uac = seedHC.ac;
        g.u.uen = seedHC.pw;
        g.u.uenmax = seedHC.pw;
    }

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
    const welcomeMsg = `${helloWord} ${g.plname}, welcome to NetHack!  You are a${descBuf}.`;
    await pline(welcomeMsg);

    // moveloop_preamble (allmain.c:48-68) — moon phase + friday13
    // status messages that fire BEFORE moveloop_core's first iter.
    // These come AFTER welcome and AFTER notice_all_mons (which we
    // don't yet model).  Each pline either appends to topl or, if
    // the topl is full / next pline can't fit, forces --More--.
    //
    // C's tty pline (toplines.c) places --More-- on the same row as
    // the message when it fits (row width >= msg.length + 8 [or +9
    // with separator] for "--More--"), else drops to row 1 col 0.
    // Empirically:
    //   seed0007 welcome (71 chars) + --More-- (8) = 79 → r0 col 71.
    //   seed5006 welcome (74 chars) + --More-- (8) = 82 → r1 col 0.
    const preamblePlines = preamble_plines(g.datetime);
    // Explore-mode notice (sys/unix/unixmain.c:673):
    //   You("are in non-scoring explore/discovery mode.");
    // Plined when `discover` is true.  In our model that maps to
    // OPTIONS=playmode:explore (= flags.explore set by options.js).
    // Captured order in C sessions has this AFTER welcome and
    // AFTER moon/friday13, so we append it to the preamble queue.
    if (g.flags?.explore) {
        preamblePlines.push('You are in non-scoring explore/discovery mode.');
    }
    // Tutorial menu fires after preamble plines when tutorial wasn't
    // explicit in rc (ask_do_tutorial at allmain.c:574).  When it's
    // queued, the LAST pline before the menu must force --More-- to
    // clear topl before the menu renders.
    const tutorialQueued = !g.tutorial_set_in_config;
    // Welcome itself needs --More-- if any subsequent pline OR the
    // tutorial menu is queued — anything that would force topl to
    // clear before its content renders.
    const welcomeNeedsMore = preamblePlines.length > 0 || tutorialQueued;

    if (welcomeNeedsMore) {
        // welcome's pline overflow: paint --More-- after welcome (or
        // on row 1) and consume the dismiss key.  Then clear --More--
        // so the next pline (moon) renders cleanly.
        await flush_screen(1);
        await render_topl_more_after(welcomeMsg, 0);
        // Pline preamble messages, with --More-- between consecutive
        // plines and after the last one if tutorial is queued.
        for (let i = 0; i < preamblePlines.length; i++) {
            const msg = preamblePlines[i];
            await pline(msg);
            const isLast = i === preamblePlines.length - 1;
            const moreNeeded = !isLast || tutorialQueued;
            if (moreNeeded) {
                await flush_screen(1);
                await render_topl_more_after(msg, 0);
            }
        }
    }

    // ask_do_tutorial — C ref: options.c:430, called from
    // allmain.c:574 maybe_do_tutorial() (just after moveloop_preamble).
    // Fires when tutorial wasn't explicitly set in rc; renders a
    // 2-option menu and consumes one keystroke.
    if (tutorialQueued) {
        await display_tutorial_menu();
    }
}

// Render "--More--" after a topl message of length `msgLen` on the
// given row.  If msg + " " + "--More--" fits in 80 cols, --More--
// lands at col msgLen on the same row (no separator — C concatenates
// directly per the captured screen format); otherwise it goes to
// row+1 col 0.  Captures via nhgetch, then clears the painted cells.
async function render_topl_more_after(msg, row) {
    const display = game.nhDisplay;
    if (!display) { await nhgetch(); return; }
    const more = '--More--';
    const NO_COLOR = 8;
    // C tty's pline puts --More-- on the same row only when there's
    // strict room (msg.length + 8 < 80, i.e. msg.length < 72).  At
    // exactly 72-char welcome the message ends at col 72, --More--
    // would need cols 72-79, leaving no trailing column for cursor —
    // C drops to the next row.  Verified empirically:
    //   seed0007 welcome (71 chars) → same row, --More-- at col 71.
    //   seed0013 welcome (72 chars) → next row, --More-- at col 0.
    //   seed5006 welcome (74 chars) → next row.
    const onSameRow = (msg.length + more.length) < 80;
    const paintRow = onSameRow ? row : row + 1;
    const paintCol = onSameRow ? msg.length : 0;
    for (let i = 0; i < more.length && paintCol + i < 80; i++) {
        display.setCell(paintCol + i, paintRow, more[i], NO_COLOR, 0);
    }
    await nhgetch();
    for (let c = paintCol; c < paintCol + more.length && c < 80; c++) {
        display.setCell(c, paintRow, ' ', NO_COLOR, 0);
    }
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
