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
import { initRng, enableRngLog, clearRngLog, getRngLog } from './rng.js';
import { pushKey, nhgetch } from './input.js';
import { newgame, moveloop_core } from './allmain.js';
import { parseNethackrc, detectChargenNeeded } from './options.js';
import { flush_screen } from './display.js';
import { GameDisplay } from './game_display.js';

// ── NethackGame ──
// Wraps a single game session with replay infrastructure.
export class NethackGame {
    constructor(opts = {}) {
        this._seed = opts.seed || 0;
        this._datetime = opts.datetime || null;
        this._nethackrc = opts.nethackrc || '';
        this._moves = opts.moves || '';
        this._screens = [];
        this._cursors = [];
        this._rngSlices = [];
        this._lastRngIdx = 0;
        this._nhgetchCount = 0;
        // The rng log is cumulative across segments of one session,
        // mirroring how C's recorder captures the full per-process call
        // sequence. Reset it on game-construction (= first segment),
        // never on segment 2+. initRng/enableRngLog deliberately do
        // NOT touch the log.
        clearRngLog();
    }

    async start() {
        const g = resetGame();

        // Parse nethackrc
        const opts = parseNethackrc(this._nethackrc);
        g.plname = opts.name || 'Hero';
        g.flags = { verbose: true, ...opts.flags };
        // Wizard/debug mode forces plname to "wizard" (overriding any
        // OPTIONS=name:... value).  C ref: src/options.c:10138
        // set_playmode() — gp.plnamelen = strlen(strcpy(svp.plname,
        // "wizard")). Affects sessions like seed5006 with
        // playmode:debug in their rc.
        if (g.flags.debug) g.plname = 'wizard';
        g.iflags = { ...opts.iflags };
        if (opts.preferred_pet) g.preferred_pet = opts.preferred_pet;
        if (opts.tutorial_set) g.tutorial_set_in_config = true;
        // Role/race/gender/align strings from nethackrc — needed by
        // role_init for nemgend/ldrgend rn2 calls and (eventually) by
        // u_init_role for stat / inventory rolls.
        g.opts_role = (opts.role && opts.role !== -1) ? opts.role : '';
        g.opts_race = (opts.race && opts.race !== -1) ? opts.race : '';
        g.opts_align = (opts.align && opts.align !== -1) ? opts.align : '';
        g.opts_gender = (opts.gender && opts.gender !== -1) ? opts.gender : '';
        // Chargen runs interactively whenever any of role/race/gender/
        // align is unset in nethackrc. role.js's chargen_simulate()
        // models both 'y' (full-random) and 'n' (manual menu) flows.
        g.opts_chargen_needed = detectChargenNeeded(opts);
        g.opts_chargen_moves = this._moves;

        // Initialize hero struct
        g.u = { ux: 0, uy: 0, ux0: 0, uy0: 0 };
        g.context = { move: 0 };
        g.program_state = {};
        g.moves = 1;

        // TODO: Map role/race/gender/align from opts to role data
        g.urole = { name: { m: 'Rambler', f: 'Rambler' } };
        g.urace = { adj: 'human' };

        // Initialize PRNG
        initRng(this._seed);
        enableRngLog();

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
            nhGame._screens.push(term?.serialize ? term.serialize() : '');
            nhGame._rngSlices.push(slice);

            const cursor = disp ? [disp.cursorCol ?? 0, disp.cursorRow ?? 0, 1] : null;
            nhGame._cursors.push(cursor);

            // After capturing the screen, clear the pline buffer so the
            // next flush_screen starts fresh.  C's topl tracks "did the
            // user see this message yet?"; here we model "yes, at the
            // capture that just happened" by clearing now.  Any pline
            // fired after this hook (e.g. by rhack handlers like '+'
            // dovspell) will appear in the *next* iteration's screen.
            game._pending_message = '';
        };
    }

    getScreens() { return this._screens; }
    getCursors() { return this._cursors; }
    getRngLog() { return getRngLog(); }
    // Per-step PRNG slices, parallel to getScreens(). Each entry is the
    // log of PRNG calls that fired since the previous capture (i.e.
    // since the previous nhgetch). Useful for tooling like the PS
    // visualizer that wants to attribute calls to individual keystrokes;
    // the judge ignores this and uses getRngLog() flat.
    getRngSlices() { return this._rngSlices; }
}

// ── Per-segment runner — the contest contract ──
//
// The judge calls this once per segment. Input is a clean replay
// descriptor with exactly four fields (NO recorded answers):
//
//   { seed: number,        // PRNG seed
//     datetime: string,    // fixed datetime "YYYYMMDDHHMMSS"
//     nethackrc: string,   // game-options rc text
//     moves: string }      // raw key sequence to replay from launch
//
// prevGame is null on the first segment; on later segments it carries
// forward the previous segment's captures so the judge can read back
// cumulative screens/cursors/RngLog at the end.
//
// Cross-segment C-side state (bones, record file, save) is the
// contestant's responsibility — see how the C side preserves it.
export async function runSegment(input, prevGame = null) {
    const { seed, nethackrc } = input;
    const moves = input.moves || '';

    const nhGame = prevGame || new NethackGame({ seed, nethackrc, moves });
    if (prevGame) {
        nhGame._seed = seed;
        nhGame._nethackrc = nethackrc;
        nhGame._moves = moves;
    }

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

