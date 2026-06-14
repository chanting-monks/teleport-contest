// input.js — Keystroke input handling.
// Provides async nhgetch() that reads from an input queue.

import { game } from './gstate.js';
import { KEY_BINDINGS } from './terminal.js';
import { flush_screen } from './display.js';

const _inputQueue = [];

export function pushKey(key) {
    _inputQueue.push(typeof key === 'number' ? key : key.charCodeAt(0));
}

export function pushKeys(keys) {
    for (const k of keys) pushKey(k);
}

// C ref: tty_nhgetch — read one key.
// In replay mode, reads from the input queue.
// In browser mode, waits for a real keypress.
//
// Drains game._dmore_queue here: a pline overflow leaves a --More--
// suffix on the topl plus one or more queued messages.  Each loop
// iteration captures the current topl, reads one key (the dismiss),
// advances the queue to the next deferred message, redraws, and
// loops.  When the queue is empty, the read key is returned and
// game._topl_seen is set so the next pline starts a fresh topl.
export async function nhgetch() {
    while (true) {
        const hook = game._preNhgetchHook;
        if (hook) await hook();

        let key;
        if (_inputQueue.length > 0) {
            key = _inputQueue.shift();
        } else {
            const display = game?.nhDisplay;
            if (display?.readKey) {
                key = await display.readKey({ bindings: KEY_BINDINGS.VI_KEYS });
            } else {
                throw new Error('Input queue empty - test may be missing keystrokes');
            }
        }

        const q = game._dmore_queue;
        if (q && q.length > 0) {
            // C ref win/tty/topl.c more() -> xwaitforspace("\033"):
            // ONLY space, newline, or ESC dismiss a --More--; any
            // other key is CONSUMED (tty beeps) and the More stays.
            // The lenient any-key dismissal here let key cascades
            // (e.g. seed0501's 'y' + '#turn' after "You know
            // \"healing\" quite well already.--More--") sail through
            // prompts C rejects.  Each deleted cmd.js bridge carried
            // its own strict More state machine (LEARNINGS §23.198);
            // this is the single shared implementation.
            if (!(key === 0x20 || key === 0x0a || key === 0x0d || key === 0x1b)) {
                continue;
            }
            if (key === 0x1b) {
                // C ref win/tty/topl.c xwaitforspace: ESC sets
                // WIN_STOP — every remaining queued MESSAGE is
                // suppressed, not just the current one.  A queued yn
                // PROMPT still shows (tty_yn_function clears WIN_STOP
                // before prompting).  seed0102: ESC at the fire-swap
                // More chain must skip the "dagger (alternate
                // weapon)" line and reveal "In what direction?"
                // directly; dismissing one-at-a-time left JS a full
                // step behind C for the rest of the session.
                const promptText = game._yn_prompt_text;
                const last = q[q.length - 1];
                game._dmore_queue = null;
                if (typeof promptText === 'string' && promptText
                    && typeof last === 'string'
                    && last.endsWith(promptText)) {
                    game._pending_message = last;
                    game._cursor_override = { x: last.length + 1, y: 0 };
                    game._cursor_override_oneshot = true;
                } else {
                    game._pending_message = '';
                }
                await flush_screen(1);
                continue;
            }
            const next = q.shift();
            if (q.length > 0) {
                game._pending_message = next + '--More--';
            } else {
                game._pending_message = next;
                game._dmore_queue = null;
                // Revealing a yn/getobj prompt queued behind the
                // More chain: park the cursor after the query (C
                // tty leaves it there while reading the response).
                // The override win_yn_function set was consumed by
                // its own pre-chain flush.
                // endsWith, not equality: display.js pline may have
                // CONCATENATED the prompt onto the previous queued
                // message ("<msg>  <prompt>" within the topl fit) —
                // C parks the cursor after the whole combined line.
                if (typeof game._yn_prompt_text === 'string'
                    && game._yn_prompt_text && typeof next === 'string'
                    && next.endsWith(game._yn_prompt_text)) {
                    game._cursor_override = { x: next.length + 1, y: 0 };
                    game._cursor_override_oneshot = true;
                }
            }
            // Redraw terminal so the next pre-hook capture sees the
            // new topl rather than the just-dismissed --More-- state.
            await flush_screen(1);
            continue;
        }

        game._topl_seen = true;
        return key;
    }
}

// (readKeySync removed 2026-06-13: the last synchronous key-read.  Its
// sole caller, the win_yn_function windowproc, was migrated to the async
// nhgetch path mirroring win_getlin — completing the async-flip migration.
// readKeySync always returned ESC here anyway because _inputQueue is only
// fed by interactive browser keystrokes, never in the scoring harness.)
