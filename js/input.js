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
            const next = q.shift();
            if (q.length > 0) {
                game._pending_message = next + '--More--';
            } else {
                game._pending_message = next;
                game._dmore_queue = null;
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

// Synchronous queue-pop for sync code paths (e.g. translated
// yn_function called from doride / dosearch / engrave prompts).
// Returns 27 (ESC) when the queue is empty so the caller can
// abort cleanly instead of hanging.  Does NOT fire the pre-nhgetch
// hook — score capture happens at the next async nhgetch.
export function readKeySync() {
    if (_inputQueue.length > 0) return _inputQueue.shift();
    return 27;
}

// Reset input state
export function resetInputState() {
    _inputQueue.length = 0;
}
