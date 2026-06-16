// jsmain.js — Game engine: NethackGame class + per-segment runner.
// C ref: unixmain.c — nethack_main() initialization and game setup.
//
// Contest contract: the judge orchestrates sessions (load JSON,
// normalize v4/v5, loop segments, aggregate scores). It calls
// runSegment(segment, prevGame) for each game segment and reads back
// game.getScreens() / getRngLog() / getCursors() to compare with
// C-recorded session data.
//
// For browser play, see nethack.js (uses NethackGame directly).

import { game, resetGame } from './gstate.js';
import { initRng, enableRngLog, getRngLog } from './rng.js';
import { pushKey, nhgetch } from './input.js';
import { newgame, moveloop_core } from './allmain.js';
import { parseNethackrc } from './options.js';
import { flush_screen } from './display.js';
import { GameDisplay } from './game_display.js';
import { initTraceMode } from './c2js-runtime/trace.js';

// ── NethackGame ──
// Wraps a single game session with replay infrastructure.
export class NethackGame {
    constructor(opts = {}) {
        this._seed = opts.seed || 0;
        this._datetime = opts.datetime || null;
        this._nethackrc = opts.nethackrc || '';
        // Cross-segment persistence handle. The judge sandbox passes a
        // shared Web-Storage-shaped object here so save / record /
        // bones survive across segments of a session; the browser
        // /play/<owner>/ page passes a localStorage-backed view so
        // those files also survive page reloads. If a port doesn't
        // need persistence (no save/restore implemented yet), it can
        // ignore this; the field just sits unused.
        this._storage = opts.storage || null;
        this._screens = [];
        this._cursors = [];
        this._rngSlices = [];
        // Animation frames captured during each step.  Outer index
        // matches _screens (one entry per input boundary); inner array
        // is the frames that fired between this boundary and the
        // previous one, in emit order.  Populated by animationFrame()
        // calls; committed at each input boundary.
        this._animFramesByStep = [];
        this._pendingAnimFrames = [];
        this._lastRngIdx = 0;
        this._nhgetchCount = 0;
    }

    // Universal animation-frame hook.  Call once per intermediate
    // animation state — typically inside whatever your port writes as
    // the equivalent of NetHack's nh_delay_output() (zap beams, thrown
    // objects, hurtle steps, explosion expansions).
    //
    // Same call, same code, in every runtime:
    //   * Browser /play/  — your writes to the Terminal already update
    //                        the visible DOM cells; we yield via
    //                        requestAnimationFrame so the browser
    //                        actually paints between frames.
    //   * Judge sandbox    — the Terminal is a pure data structure;
    //                        we yield a microtask, effectively
    //                        immediate.
    //   * Local score.sh   — same as judge sandbox.
    //
    // The yield mechanism is the only environment-sensitive bit, and
    // it is invisible to contestant code: every caller writes the same
    // `await game.animationFrame()`.
    //
    // Frames are scored as a SUPPLEMENTAL metric (see API.md).  Not
    // implementing animation frames doesn't penalise your official
    // RNG / screen score in any way.
    async animationFrame() {
        const disp = game?.nhDisplay;
        const term = disp?.terminal || disp;
        this._pendingAnimFrames.push({
            screen: term?.serialize ? term.serialize() : '',
            cursor: disp ? [disp.cursorCol ?? 0, disp.cursorRow ?? 0, 1] : null,
        });
        if (typeof requestAnimationFrame === 'function') {
            await new Promise((resolve) => requestAnimationFrame(resolve));
        } else {
            await null;
        }
    }

    async start() {
        const g = resetGame();

        // Wire session datetime → globalThis.__nh_localtime so the
        // translated calendar.c functions (phase_of_the_moon, friday_13th,
        // night, midnight) compute against the RECORDING's date instead
        // of the JS process clock.  Format: "YYYYMMDDHHMMSS" (e.g.
        // "20000922140000").  Without this, every session's moon-phase
        // / friday-13th flags depend on the wall-clock day the replay
        // runs on — only by chance matching the canonical recording's
        // calendar event flags.
        if (this._datetime && /^\d{14}$/.test(this._datetime)) {
            const s = this._datetime;
            const Y = +s.slice(0, 4), M = +s.slice(4, 6) - 1, D = +s.slice(6, 8);
            const H = +s.slice(8, 10), Mi = +s.slice(10, 12), Se = +s.slice(12, 14);
            const d = new Date(Y, M, D, H, Mi, Se);
            // C struct tm layout (the translated calendar code reads
            // tm_year, tm_yday, tm_mon, tm_mday, tm_hour, tm_wday).
            // Note: tm_year is years-since-1900; tm_mon is 0..11;
            // tm_wday is 0..6 (Sun=0); tm_yday is 0..365.
            const start = new Date(Y, 0, 1);
            const tm_yday = Math.floor((d - start) / 86400000);
            const _tm = {
                tm_sec: Se, tm_min: Mi, tm_hour: H,
                tm_mday: D, tm_mon: M, tm_year: Y - 1900,
                tm_wday: d.getDay(), tm_yday,
                tm_isdst: 0, tm_gmtoff: 0, tm_zone: null,
            };
            globalThis.localtime = () => _tm;
            // Also expose via __nh_localtime so the c2js-runtime
            // calendar.localtime export can resolve it without colliding
            // with autostub's globalThis.localtime no-op.
            globalThis.__nh_localtime = () => _tm;
        }

        // Parse nethackrc.  Note: resetGame restores the
        // post-module-load snapshot which includes the FULL struct
        // shapes for game.u / game.flags / game.iflags from
        // translated decl.js.  Don't replace those structs here —
        // merge rc options into them.  Replacing wholesale would
        // destroy the ~hundred nested fields the translated chargen
        // functions read.
        const opts = parseNethackrc(this._nethackrc);
        // C ref options.c:10138 set_playmode() — under playmode:debug,
        // strcpy(svp.plname, "wizard") overwrites whatever name: option
        // was provided in the rc file.  Mirror that here so wizmode
        // sessions (seed5006-tourist-stress-disaster, etc.) show
        // "wizard the <rank>" on the status line rather than the
        // rc-configured name.
        if (opts.flags?.debug) {
            g.plname = 'wizard';
            g._rcHasName = true;
        } else {
            g.plname = opts.name || 'Hero';
            // Track whether the rc-file supplied a name explicitly.
            // C ref allmain.c: `if (!*svp.plname) askname()` always asks
            // when plname is empty in rc; the JS 'Hero' fallback masks
            // this — without the flag, sessions like seed0017 (role
            // set, name missing) skip askname and start consuming the
            // typed-name characters as game commands.
            g._rcHasName = !!opts.name;
        }
        g.flags = g.flags || {};
        // Track which g.flags / g.iflags keys we explicitly write below
        // so allmain.js newgame() knows to restore those (and only those)
        // after decl_globals_init.  Without this set, allmain.js's naive
        // `Object.keys(rcFlags)` walk restores every flag — including
        // safe_dog=0 from the resetGame snapshot — clobbering the
        // NHOPTB defaults the in-place initoptions walk applies.
        g._rcWrittenFlags = new Set();
        g._rcWrittenIflags = new Set();
        // BIND=key:command rebinds (C options.c parsebindings).
        // Stored as {charCode: extcmdName}; rhack remaps bound keys
        // to the equivalent built-in dispatch before the switch.
        if (Array.isArray(opts.binds)) {
            g._cmd_key_binds = {};
            for (const b of opts.binds) g._cmd_key_binds[b.key] = b.cmd;
        }
        const __setFlag = (k, v) => { g.flags[k] = v; g._rcWrittenFlags.add(k); };
        const __setIflag = (k, v) => { g.iflags[k] = v; g._rcWrittenIflags.add(k); };
        __setFlag('verbose', true);
        // C-correct default (ref options.c:7258 initoptions_init):
        // flags.menu_style = MENU_FULL.  With 0 (TRADITIONAL) the
        // 'Z' cast flow showed "[a-b *?]" prompts where C renders
        // the spell menu (seed0501 step 4).
        __setFlag('menu_style', 2);
        // C-correct default (ref options.c:7207 initoptions_init):
        // flags.pickup_burden = MOD_ENCUMBER (2, "stressed").  decl.js
        // zero-inits it to UNENCUMBERED (0), which makes
        // hold_another_object (invent.js:1220) drop a picked/wished item
        // whenever adding it raises near_capacity() above 0 — vs C's
        // threshold of 2.  seed0399: the last wished item (spellbook)
        // pushes the hero to SLT_ENCUMBER(1); C holds it (1 !> 2), JS
        // dropped it (1 > 0), so JS lost the encumber "--More--" and the
        // recorded keys desynced.
        __setFlag('pickup_burden', 2);
        // More C initoptions_init defaults (options.c:7200-7260) that decl.js
        // zero-inits.  Sessions were recorded with C's defaults, so JS must
        // match to consume the same confirmation/pickup keys.  Tested as a
        // group; bisect on regression.
        __setFlag('paranoia_bits', 0x0020 | 0x0400 | 0x0800); // PRAY|SWIM|TRAP
        __setFlag('pile_limit', 5);     // PILE_LIMIT_DFLT
        __setFlag('runmode', 1);        // RUN_LEAP
        __setFlag('sortloot', 'l'.charCodeAt(0)); // 'l'
        // C-correct default (ref optlist.h:410 NHOPTB(legacy, ..., On, ...)).
        // rc options like `!legacy` override below.
        __setFlag('legacy', 1);
        // C-correct default (ref optlist.h:213 NHOPTB(bones, ..., On, ...)).
        // Required so the translated mklev path's getbones() reaches its
        // rn2(3) probability check at bones.c:645 (otherwise an undefined
        // flag short-circuits, dropping that RNG call and shifting every
        // subsequent makelevel() rn2() down by one).
        __setFlag('bones', 1);
        // C-correct default (ref optlist.h:181 NHOPTB(autoopen, ..., On, ...)).
        // Required so translated hack.js domove_core fires the
        // doopen_indir → rnl(20) call when the player walks into a
        // closed door.  Without this, every "first move bumps a
        // door" session (seed0077, seed0030) skips that rn2 and
        // diverges from C at the door-bump moment.
        __setFlag('autoopen', 1);
        // C-correct default (ref optlist.h NHOPTB(confirm, ..., On, ...)).
        // flags.confirm gates the y/n attack-confirmation prompt for
        // peaceful monsters (apply.js:2607 travel filter; do_attack /
        // attack_checks for moveinto-peaceful).  Without the default,
        // multi-turn paths involving peaceful monsters take different
        // branches than C — seed0107 (samurai twoweapon enhance) +76,
        // seed0002 (healer reflection) +57, seed0030 (ten deaths) +26.
        __setFlag('confirm', 1);
        // C-correct default (ref options.c:7173 sets
        // flags.paranoia_bits = PARANOID_PRAY | PARANOID_SWIM |
        // PARANOID_TRAP = 0x20 | 0x400 | 0x800 = 0xC20).
        // Affects paranoid_query gates in were.js and pickup.js
        // for confirmation prompts.  +3 P aggregate.
        __setFlag('paranoia_bits', 0xC20);
        // C-correct default (ref optlist.h NHOPTB(tutorial, ..., On, ...)).
        // Sessions that don't set !tutorial in their rc (e.g. seed0103
        // Knight, seed0102 Ranger) get the "Do you want a tutorial?"
        // prompt at game start.  Without the default JS skipped the
        // tutorial render for those sessions and missed step 2's
        // canonical capture.  rc options like `!tutorial` override below
        // via the opts.flags merge.
        __setFlag('tutorial', 1);
        // safe_dog is set unconditionally by allmain.js's allopt_init
        // walk (safe_pet → flags.safe_dog initval=1).  The env-gate
        // that previously lived here was a temporary debugging hook
        // for the seed0030 hang that has since been fixed; verified
        // 2026-05-22 that removing the gate is score-neutral and
        // game.flags.safe_dog === 1 in both states.
        if (opts.flags) for (const k of Object.keys(opts.flags)) __setFlag(k, opts.flags[k]);
        g.iflags = g.iflags || {};
        // C-correct default (ref optlist.h NHOPTB(status_updates,
        // ..., On, ...)).  iflags.status_updates gates bot()'s
        // condition-bitmask rebuild paths (botl.js:218 + :234).
        // When undefined-falsy, status drawing skips a code path
        // that fires before chargen ends, shifting downstream RNG.
        // Effect: +23 P aggregate across multi-level sessions.
        __setIflag('status_updates', 1);
        if (opts.iflags) for (const k of Object.keys(opts.iflags)) __setIflag(k, opts.iflags[k]);
        if (opts.preferred_pet) g.preferred_pet = opts.preferred_pet;
        if (opts.tutorial_set) g.tutorial_set_in_config = true;
        // Stash rc symset name for allmain.js newgame() to apply AFTER
        // decl_globals_init builds the g.symset[] struct array.  C ref
        // options.c parse_symset_file → set_symset_handling.  H_DEC=2
        // (DECgraphics), H_IBM=1, H_UTF8=5, H_UNK=0 (default ASCII).
        if (opts.symset) {
            g._rcSymsetName = opts.symset;
        }
        // Thread gender from rc into g.flags.female so non-default
        // sessions (e.g. role:Tourist,gender:male) don't get the
        // skeleton's hardcoded female default that mismatches the
        // recording's pronoun "human male" vs "human female".
        if (typeof opts.gender === 'string') {
            __setFlag('initgend', opts.gender === 'female' ? 1 : 0);
            __setFlag('female', (opts.gender === 'female'));
        }
        // Stash parsed role/race/align where allmain.js can read
        // them to override the seed8000-specific hardcoded
        // female-Tourist defaults.
        g._optsRole = opts.role;
        g._optsRace = opts.race;
        g._optsAlign = opts.align;

        // Per-session runtime fields not in decl.js's top-level
        // (and we want fresh each session).
        g.context = g.context || {};
        g.context.move = 0;
        g.program_state = g.program_state || {};
        g.moves = 1;

        // Initialize PRNG
        await initRng(this._seed);
        enableRngLog();
        // Trace mode (NH_TRACE=on emits >/</^/= ; NH_TRACE=probe
        // also emits ?).  See docs/INSTRUMENTATION.md.  The trace
        // markers interleave into game._rngLog alongside PRNG calls;
        // the scorer filters them out by the rn2/rnd/... regex so
        // they're invisible to scoring but visible to the differ.
        initTraceMode();

        // Install display
        if (this._pendingDisplay) {
            g.nhDisplay = this._pendingDisplay;
            this._pendingDisplay = null;
        }

        // Install capture hook
        this._installCaptureHook();

        // Run game startup
        await newgame();
    }

    _installCaptureHook() {
        const nhGame = this;
        game._preNhgetchHook = async () => {
            const keyIdx = nhGame._nhgetchCount++;

            // Capture RNG slice since last capture
            const fullLog = getRngLog() || [];
            const slice = fullLog.slice(nhGame._lastRngIdx);
            nhGame._lastRngIdx = fullLog.length;

            // Capture screen from the terminal grid. The fixture for
            // screen scoring is the Terminal: contestants drive it
            // however they like, judge reads back terminal.serialize()
            // and compares to the C session's recorded screen.
            const disp = game?.nhDisplay;
            const term = disp?.terminal || disp;
            let __screen = term?.serialize ? term.serialize() : '';
            // Menu-serialize wrap: when a menu overlay carries explicit
            // canonical encoded rows (e.g., the spell-cast menu's header
            // row that the frozen serializer can't represent because its
            // firstCol scan drops leading-space attr), substitute those
            // rows in place.  Per memory feedback_serialize_leading_space_attr.md
            // — the documented workaround.
            const __mo = game._menu_overlay;
            if (__mo && Array.isArray(__mo._encodedRows) && __mo._encodedRows.length) {
                const __rows = __screen.split('\n');
                for (const fix of __mo._encodedRows) {
                    if (typeof fix?.row === 'number' && fix.row >= 0 && fix.row < __rows.length && typeof fix.encoded === 'string') {
                        __rows[fix.row] = fix.encoded;
                    }
                }
                __screen = __rows.join('\n');
            }
            nhGame._screens.push(__screen);
            nhGame._rngSlices.push(slice);

            const cursor = disp ? [disp.cursorCol ?? 0, disp.cursorRow ?? 0, 1] : null;
            nhGame._cursors.push(cursor);

            // Clear one-shot cursor overrides set by sync prompts
            // (win_yn_function etc).  The override positioned the cursor
            // for THIS capture; subsequent captures should fall back to
            // the default hero position unless something else sets a
            // fresh override.
            if (game._cursor_override_oneshot) {
                game._cursor_override = null;
                game._cursor_override_oneshot = false;
            }

            // Commit animation frames accumulated since the previous
            // input boundary as belonging to this step.  Frames are
            // captured by animationFrame() into _pendingAnimFrames; we
            // snapshot and reset here so the next step starts empty.
            nhGame._animFramesByStep.push(nhGame._pendingAnimFrames);
            nhGame._pendingAnimFrames = [];
        };
        // Synchronous animation-frame snapshot, invoked from
        // win_delay_output (allmain.js).  Each win_delay_output call in
        // the translated code marks a visible animation boundary
        // (zap-beam step, thrown-object trajectory step, run-mode
        // crawl frame, dig stage, mthrowu volley step).  We push the
        // current terminal-grid serialization plus cursor position
        // into the pending bucket; jsmain.js's _preNhgetchHook commits
        // the bucket to _animFramesByStep at the NEXT input boundary,
        // so each step's frames are attributed to the keystroke that
        // initiated them.
        //
        // Sync (no await): the translated callers fire
        // (game.windowprocs.win_delay_output)() without await, so the
        // push must complete in one tick.  serialize() is sync;
        // tmp_at/newsym already called flush_screen(0) by the time
        // win_delay_output fires, so the grid reflects the current
        // animation state.
        game._captureAnimFrame = () => {
            const disp = game?.nhDisplay;
            const term = disp?.terminal || disp;
            const savedCells = [];
            // C's anim recorder snapshots between flush_screen and the
            // next pline — row 0 (topl) is empty in canonical frames
            // even when an adjacent input boundary's screen has a
            // message.  Mirror that by force-blanking row 0 across
            // the capture and restoring afterward; keeps the
            // boundary-screen capture (which fires from
            // _preNhgetchHook with the topl intact) unaffected.
            if (disp?.setCell && disp?.grid && disp.cols) {
                for (let c = 0; c < disp.cols; c++) {
                    const old = disp.grid[0] ? disp.grid[0][c] : null;
                    savedCells.push({ x: c, y: 0, old });
                    disp.setCell(c, 0, ' ', /* NO_COLOR */ 8, 0);
                }
            }
            // Translated domove updates u.ux/u.uy and calls newsym on
            // the OLD position (u.ux0/u.uy0), but doesn't call
            // newsym(u.ux, u.uy) to repaint the hero at the new
            // position before runmode_delay_output fires.  C's
            // tty_delay_output sees a terminal with hero ALREADY at
            // the new cell because curs_on_u / show_glyph in the C
            // display layer paints it.  We mirror C's expected state
            // by force-writing '@' at (u.ux, u.uy) and clearing
            // (u.ux0, u.uy0) for the snapshot only, then restoring.
            // Map (x=1..79, y=0..21) → terminal cell (col=x-1, row=y+1).
            //
            // No PRNG calls — pure terminal-grid manipulation.
            const u = game?.u;
            if (disp?.setCell && disp?.grid && u
                && typeof u.ux === 'number' && typeof u.uy === 'number') {
                const newTx = u.ux - 1, newTy = u.uy + 1;
                if (newTy >= 1 && newTy < disp.rows
                    && newTx >= 0 && newTx < disp.cols) {
                    const old = disp.grid[newTy] ? disp.grid[newTy][newTx] : null;
                    savedCells.push({ x: newTx, y: newTy, old });
                    disp.setCell(newTx, newTy, '@',
                                  /* CLR_WHITE */ 15, 0);
                }
                if (typeof u.ux0 === 'number' && typeof u.uy0 === 'number'
                    && (u.ux0 !== u.ux || u.uy0 !== u.uy)) {
                    const oldTx = u.ux0 - 1, oldTy = u.uy0 + 1;
                    if (oldTy >= 1 && oldTy < disp.rows
                        && oldTx >= 0 && oldTx < disp.cols) {
                        const old = disp.grid[oldTy] ? disp.grid[oldTy][oldTx] : null;
                        // Only override if the OLD cell still has the
                        // hero glyph (translated newsym didn't clear
                        // it).  If newsym already painted floor, leave
                        // it alone.
                        if (old && old.ch === '@') {
                            savedCells.push({ x: oldTx, y: oldTy, old });
                            // Floor approximation — middle-dot.  Matches
                            // ASCII / Unicode floor in our renderer.
                            disp.setCell(oldTx, oldTy, '·',
                                          /* NO_COLOR */ 8, 0);
                        }
                    }
                }
            }
            const screen = term?.serialize ? term.serialize() : '';
            // Restore all touched cells in reverse order so any
            // re-touched coord goes back to its original content.
            if (disp?.setCell) {
                for (let i = savedCells.length - 1; i >= 0; i--) {
                    const s = savedCells[i];
                    const c = s.old || {};
                    disp.setCell(s.x, s.y, c.ch ?? ' ',
                                  c.color ?? 8, c.attr ?? 0);
                }
            }
            nhGame._pendingAnimFrames.push({
                screen,
                cursor: disp ? [disp.cursorCol ?? 0, disp.cursorRow ?? 0, 1] : null,
            });
        };
    }

    getScreens() { return this._screens; }
    getCursors() { return this._cursors; }
    // Flatten the per-step slices across ALL segments — game._rngLog
    // gets reset on every initRng/enableRngLog call (once per
    // segment's start()), so it only ever contains the latest
    // segment's RNG.  The judge reads getRngLog() once at the end
    // of a multi-segment session and compares against C's flattened
    // all-segments trace; returning the slice union is the only
    // way to get a complete log for multi-segment sessions
    // (seed0030, seed0013-friday13-save, etc.).
    getRngLog() {
        const out = [];
        for (const slice of this._rngSlices) {
            for (const entry of slice) out.push(entry);
        }
        return out;
    }
    // Per-step PRNG slices, parallel to getScreens(). Each entry is the
    // log of PRNG calls that fired since the previous capture (i.e.
    // since the previous nhgetch). Useful for tooling like the PS
    // visualizer that wants to attribute calls to individual keystrokes.
    getRngSlices() { return this._rngSlices; }
    // Per-step animation frames, parallel to getScreens().  Each entry
    // is the array of frames captured (via animationFrame()) between
    // the previous input boundary and this one — i.e. the intermediate
    // display states for that step's animation.  Empty inner arrays
    // for steps that didn't animate.  SUPPLEMENTAL metric — not part
    // of the official ranking; see API.md.
    getAnimationFramesByStep() { return this._animFramesByStep; }
}

// ── Per-segment runner — the contest contract ──
//
// The judge calls this once per segment. Input is a clean replay
// descriptor with up to five fields (NO recorded answers):
//
//   { seed: number,        // PRNG seed
//     datetime: string,    // fixed datetime "YYYYMMDDHHMMSS"
//     nethackrc: string,   // game-options rc text
//     moves: string,       // raw key sequence to replay from launch
//     storage: object }    // Web-Storage-shaped (getItem/setItem/...)
//                          //   handle for cross-segment persistence —
//                          //   shared across all segments of a
//                          //   session. The browser passes a
//                          //   localStorage-backed view so save files
//                          //   survive page reload too.
//
// Each call returns a self-contained game whose getScreens() /
// getRngLog() / getCursors() / getAnimationFramesByStep() cover ONLY
// this segment. The harness concatenates them itself. Cross-segment
// C-side state (bones, record file, save) lives in `input.storage`.
export async function runSegment(input) {
    const { seed, nethackrc, storage, datetime } = input;
    const moves = input.moves || '';

    // Session epoch — bump per segment so stale cross-session async
    // chains (parked on promises when the previous session ended)
    // die at the des-bridge guard instead of spending this session's
    // PRNG (Q9 iteration 33, the seed0108 pollution).
    globalThis.__nh_session_epoch = (globalThis.__nh_session_epoch || 0) + 1;

    // Q9.5(b) — restore fresh-process module state (translator-
    // hoisted C statics) so back-to-back sessions in one process
    // match fresh-process-per-session runs.  No-op on the frozen
    // production tree (no registrations).
    const { __nh_reset_statics } = await import('./c2js-runtime/static-registry.js');
    __nh_reset_statics();

    const nhGame = new NethackGame({ seed, nethackrc, storage, datetime });

    const display = new GameDisplay(null);
    display.onEmptyQueue = () => { throw new Error('Input queue empty - test may be missing keystrokes'); };
    nhGame._pendingDisplay = display;

    for (const ch of moves) display.pushKey(ch.charCodeAt(0));

    await nhGame.start();

    // Drive the game loop until input is exhausted. The judge looks
    // at game.getScreens() afterwards; whatever the contestant
    // captured is what gets compared.
    const maxIter = Math.max(moves.length * 8, 1024);
    for (let iter = 0; iter < maxIter; iter++) {
        try {
            await moveloop_core();
        } catch (e) {
            if (String(e?.message || '').includes('Input queue empty')) break;
            throw e;
        }
    }

    return nhGame;
}

