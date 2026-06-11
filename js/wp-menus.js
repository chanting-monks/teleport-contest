// wp-menus.js — the generic menu windowproc family (C ref
// win/tty/wintty.c tty menus): print_dungeon's wizard level menu,
// dooptions, etc.  Items accumulate per winid; select reads the
// choice letter(s) through the async nhgetch path (each key is its
// own captured step).  The selection out-param flows as a {value}
// box installed by the build-engine call-site patch (menu_item**
// can't write back through a null JS arg — same class as §23.239).
//
// Extracted from allmain.js (Q9 iter 44) so two consumers share one
// implementation:
//  - allmain's windowproc defaults install these for REGEN builds
//    (marker-gated on __getlin_returns_buffer === 1 — ungated they
//    consumed production session keys, the iteration-26 regression);
//  - cmd.js's ^V wizlevelport bridge installs them TEMPORARILY
//    around t_wiz_level_tele so print_dungeon's level menu can run
//    in production without un-gating anything else.

import { nhgetch } from './input.js';
import { flush_screen } from './display.js';

export function makeMenuProcs(g) {
    return {
        win_start_menu: (win, _mbehavior) => {
            g._wp_menus = g._wp_menus || {};
            g._wp_menus[win] = { items: [], prompt: null };
        },
        win_add_menu: (win, _glyphinfo, identifier, ch,
            gch, _attr, _color, str, _itemflags) => {
            const m = g._wp_menus?.[win];
            if (m) m.items.push({ identifier, ch, gch, str });
        },
        win_end_menu: (win, prompt) => {
            const m = g._wp_menus?.[win];
            if (m) m.prompt = (typeof prompt === 'string') ? prompt : null;
        },
        win_select_menu: async (win, how, box) => {
            const m = g._wp_menus?.[win];
            if (!m) return 0;
            // Selectable letters: explicit ch, else auto a-z like
            // tty (only for selectable items — identifier != 0).
            let auto = 97; // 'a'
            for (const it of m.items) {
                const selectable = it.identifier
                    && (typeof it.identifier !== 'object'
                        || Object.values(it.identifier).some((v) => v));
                if (selectable && !it.ch) it.ch = auto++;
                else if (selectable && it.ch) auto = it.ch + 1;
            }
            if (m.prompt) {
                g._pending_message = m.prompt;
                g._cursor_override = { x: m.prompt.length + 1, y: 0 };
                g._cursor_override_oneshot = true;
                await flush_screen(1);
            }
            for (;;) {
                const c = await nhgetch();
                if (c === 0x1b) return 0;          // cancelled
                if (c === 10 || c === 13) return 0; // PICK_ONE: \n with nothing picked
                const hit = m.items.find((it) => it.ch === c && it.identifier);
                if (hit) {
                    if (box && typeof box === 'object') {
                        box.value = [{ item: hit.identifier, count: -1 }];
                    }
                    return 1;
                }
                // unknown key: ignore (tty beeps), keep reading
            }
        },
        win_destroy_nhwindow: (win) => {
            if (g._wp_menus) delete g._wp_menus[win];
        },
    };
}

// Sync variant for SYNC translated callers (production dungeon.js
// print_dungeon — its select_menu call site can't await).  Pops the
// terminal's replay key queue directly; fires the same per-key
// screen capture the async nhgetch path fires (game._preNhgetchHook
// has a fully synchronous body — the discarded promise is safe),
// so the per-step screen pairing stays aligned.  Empty queue reads
// as ESC (cancel), matching readKeySync's load-bearing convention.
export function makeSyncMenuProcs(g) {
    const procs = makeMenuProcs(g);
    procs.win_select_menu = (win, _how, box) => {
        const m = g._wp_menus?.[win];
        if (!m) return 0;
        let auto = 97; // 'a'
        for (const it of m.items) {
            const selectable = it.identifier
                && (typeof it.identifier !== 'object'
                    || Object.values(it.identifier).some((v) => v));
            if (selectable && !it.ch) it.ch = auto++;
            else if (selectable && it.ch) auto = it.ch + 1;
        }
        if (m.prompt) {
            g._pending_message = m.prompt;
            g._cursor_override = { x: m.prompt.length + 1, y: 0 };
            g._cursor_override_oneshot = true;
            void flush_screen(1);
        }
        const disp = g.nhDisplay;
        const term = (disp && disp.terminal) || disp;
        const q = term && term._inputQueue;
        for (;;) {
            if (g._preNhgetchHook) void g._preNhgetchHook();
            const c = (Array.isArray(q) && q.length) ? q.shift() : 0x1b;
            g._topl_seen = true;
            if (c === 0x1b) return 0;
            if (c === 10 || c === 13) return 0;
            if (typeof process !== 'undefined' && process.env?.NH_WPM_PROBE) {
                console.warn('[syncsel] key', c, String.fromCharCode(c), 'items', m.items.length, 'letters', m.items.map(i=>i.ch&&String.fromCharCode(i.ch)).filter(Boolean).join(''));
            }
            const hit = m.items.find((it) => it.ch === c && it.identifier);
            if (hit) {
                if (box && typeof box === 'object') {
                    box.value = [{ item: hit.identifier, count: -1 }];
                }
                return 1;
            }
            // unknown key: ignore (tty beeps), keep reading
        }
    };
    return procs;
}
