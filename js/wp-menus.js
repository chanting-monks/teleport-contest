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

// Translated callers build menu strings in C-style char-code array
// buffers (sprintf into `buf`); coerce to a JS string at the NUL.
function cstr(s) {
    if (typeof s === 'string') return s;
    if (Array.isArray(s)) {
        let out = '';
        for (let i = 0; i < s.length && s[i]; i++) out += String.fromCharCode(s[i]);
        return out;
    }
    return s == null ? '' : String(s);
}

export function makeMenuProcs(g) {
    return {
        win_start_menu: (win, _mbehavior) => {
            g._wp_menus = g._wp_menus || {};
            g._wp_menus[win] = { items: [], prompt: null };
        },
        win_add_menu: (win, _glyphinfo, identifier, ch,
            gch, attr, _color, str, _itemflags) => {
            const m = g._wp_menus?.[win];
            // Snapshot str NOW: translated callers (print_dungeon)
            // reuse one char-code buf array for every entry, so a
            // stored reference would render every line as the buf's
            // FINAL content.  Same for identifier (an `any` union
            // object reused per iteration) — copy its scalar.
            if (m) {
                m.items.push({
                    identifier: (identifier && typeof identifier === 'object')
                        ? { ...identifier } : identifier,
                    ch, gch, attr, str: cstr(str),
                });
            }
        },
        win_end_menu: (win, prompt) => {
            const m = g._wp_menus?.[win];
            if (m) m.prompt = (typeof prompt === 'string') ? prompt : null;
        },
        win_select_menu: async (win, how, box) => {
            const m = g._wp_menus?.[win];
            if (!m) return 0;
            // Selectable letters: explicit ch, else auto a-z then A-Z
            // like tty (only for selectable items — identifier != 0).
            let auto = 97; // 'a'
            for (const it of m.items) {
                const selectable = it.identifier
                    && (typeof it.identifier !== 'object'
                        || Object.values(it.identifier).some((v) => v));
                it.selectable = !!selectable;
                if (selectable && !it.ch) {
                    it.ch = auto;
                    auto = (auto === 122 /* z */) ? 65 /* A */ : auto + 1;
                } else if (selectable && it.ch) {
                    auto = (it.ch === 122) ? 65 : it.ch + 1;
                }
            }
            // ── Render as a full-screen tty menu (C ref wintty.c
            // process_menu_window; layout verified against seed2600's
            // recorded wizard level-teleport menu, steps 23-25):
            //  page 1 row 0: ' ' + title, INVERSE; row 1 blank;
            //  heading item (ATR_HEADING, attr!=0, identifier 0):
            //    ' ' + str, INVERSE;
            //  selectable: ' ' + letter + ' - ' + str;
            //  non-selectable, non-heading: ' ' + 4 spaces + str
            //    (the letter-column width, e.g. unreachable Ft Ludios);
            //  last row of each page: ' (N of M)' (or ' (end)' when
            //    a single page); cursor parks right after the ')'.
            // 23 content rows per page (the pager row is the 24th).
            const CONTENT_ROWS = 23;
            const fmtLine = (it) => {
                const s = cstr(it.str);
                if (!it.selectable && it.attr) {
                    return { text: ' ' + s, attr: 1 /* inverse */ };
                }
                if (it.selectable) {
                    return ' ' + String.fromCharCode(it.ch) + ' - ' + s;
                }
                // Unselectable non-heading: gutter only.  The 4-space
                // letter-column pad is the CALLER's job (C tport_menu
                // sprintf("    %s") for unreachable levels) — adding
                // it here double-padded knox to 10 leading spaces.
                return ' ' + s;
            };
            const pages = [];
            {
                let cur = [];
                let capacity = CONTENT_ROWS;
                if (m.prompt) {
                    cur.push({ text: ' ' + cstr(m.prompt), attr: 1 });
                    cur.push('');
                }
                for (const it of m.items) {
                    if (cur.length >= capacity) { pages.push(cur); cur = []; }
                    cur.push(fmtLine(it));
                }
                if (cur.length || !pages.length) pages.push(cur);
            }
            const pageItems = [];
            {
                // Track which items landed on which page for the
                // tty current-page-only accelerator match.
                let pi = 0, used = (m.prompt ? 2 : 0);
                pageItems.push([]);
                for (const it of m.items) {
                    if (used >= CONTENT_ROWS) { pageItems.push([]); pi++; used = 0; }
                    pageItems[pi].push(it);
                    used++;
                }
            }
            const numPages = pages.length;
            const pager = (n) => (numPages > 1) ? ` (${n + 1} of ${numPages})` : ' (end)';
            let page = 0;
            const showPage = async () => {
                const lines = pages[page].concat([pager(page)]);
                g._menu_overlay = {
                    pages: pages.map((pl, i) => (i === page ? lines : pl)),
                    page, kind: 'text', cType: 'NHW_MENU', offx: 0,
                };
                g._pending_message = '';
                await flush_screen(1);
            };
            const closeMenu = () => { g._menu_overlay = null; };
            await showPage();
            for (;;) {
                const c = await nhgetch();
                if (c === 0x1b) { closeMenu(); return 0; }
                if (c === 10 || c === 13) { closeMenu(); return 0; }
                if (c === 0x20 /* space */) {
                    if (page < numPages - 1) { page++; await showPage(); continue; }
                    closeMenu(); return 0; // space on last page exits
                }
                if (c === 62 /* > */) {
                    if (page < numPages - 1) { page++; await showPage(); }
                    continue;
                }
                if (c === 60 /* < */) {
                    if (page > 0) { page--; await showPage(); }
                    continue;
                }
                if (c === 94 /* ^ */) { page = 0; await showPage(); continue; }
                if (c === 124 /* | */) { page = numPages - 1; await showPage(); continue; }
                if (how > 0) {
                    // tty matches accelerators on the CURRENT page only.
                    const hit = (pageItems[page] || []).find(
                        (it) => it.ch === c && it.selectable);
                    if (hit) {
                        if (box && typeof box === 'object') {
                            box.value = [{ item: hit.identifier, count: -1 }];
                        }
                        closeMenu();
                        return 1;
                    }
                }
                // unknown key: ignore (tty beeps), keep reading
            }
        },
        win_destroy_nhwindow: (win) => {
            if (g._wp_menus) delete g._wp_menus[win];
        },
    };
}
