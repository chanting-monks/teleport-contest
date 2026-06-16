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
            // PICK_ANY (how===2) selection state — referenced by fmtLine so a
            // toggled item shows '+' instead of '-' (C wintty.c tty_menu_item:
            // selected entries render "<letter> + <text>"; seed0002 pickup
            // step49 'a' → "a + 11 darts").
            const selected = [];
            const fmtLine = (it) => {
                const s = cstr(it.str);
                if (!it.selectable && it.attr) {
                    return { text: ' ' + s, attr: 1 /* inverse */ };
                }
                if (it.selectable) {
                    const mark = selected.includes(it) ? '+' : '-';
                    return ' ' + String.fromCharCode(it.ch) + ' ' + mark + ' ' + s;
                }
                // Unselectable non-heading: gutter only.  The 4-space
                // letter-column pad is the CALLER's job (C tport_menu
                // sprintf("    %s") for unreachable levels) — adding
                // it here double-padded knox to 10 leading spaces.
                return ' ' + s;
            };
            // Rebuilt on every render so toggled-item '+' marks (PICK_ANY)
            // update; the page split is selection-independent (one line per
            // item) so the page count is stable.
            const buildPages = () => {
                const result = [];
                let cur = [];
                const capacity = CONTENT_ROWS;
                if (m.prompt) {
                    cur.push({ text: ' ' + cstr(m.prompt), attr: 1 });
                    cur.push('');
                }
                for (const it of m.items) {
                    if (cur.length >= capacity) { result.push(cur); cur = []; }
                    cur.push(fmtLine(it));
                }
                if (cur.length || !result.length) result.push(cur);
                return result;
            };
            const pages = buildPages();
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
            // ── Popup offset (C ref wintty.c tty_display_nhwindow, the
            // H2344_BROKEN branch this build compiles):
            //   offx = min(cols/2, cols - maxcol - 1), clamp >= 0;
            //   then offx = 0 (full-screen) if maxrow >= rows (24).
            // maxcol is built in tty_end_menu as the widest line:
            //   len = strlen(curr->str) + 2  (a space at beg & end), where
            //   curr->str is "X - <str>" (4-char "%c - " prefix) for a
            //   SELECTABLE item (tty_add_menu, identifier != 0) or the bare
            //   <str> for a heading; plus the pager line ("(end) " = 6, or
            //   "(N of N) " when multi-page).  All capped at cols.
            //   Verified against the recorder's MENUOFFX probe across 15
            //   distinct menus in seed0002/seed0399 (pickup maxcol=20
            //   offx=40; the ^V level menu is 3-page so offx=0).
            const COLS = 80; /* ttyDisplay->cols */
            const cWidth = (s, selectable) =>
                Math.min((selectable ? 4 + s.length : s.length) + 2, COLS);
            let maxcol = 0;
            if (m.prompt) maxcol = Math.max(maxcol, cWidth(cstr(m.prompt), false));
            for (const it of m.items)
                maxcol = Math.max(maxcol, cWidth(cstr(it.str), !!it.selectable));
            const pagerLen = (numPages > 1)
                ? `(${numPages} of ${numPages}) `.length : '(end) '.length;
            maxcol = Math.max(maxcol, Math.min(pagerLen, COLS));
            let menuOffx = Math.min(Math.floor(COLS / 2), COLS - maxcol - 1);
            if (menuOffx < 0) menuOffx = 0;
            // Multi-page (maxrow = lmax+1 = rows) and full single pages
            // (nitems+1 >= rows) fall back to full-screen (offx = 0).
            if (numPages > 1) menuOffx = 0;
            let page = 0;
            const showPage = async () => {
                const freshPages = buildPages();
                const lines = freshPages[page].concat([pager(page)]);
                // A single page that fills the screen renders full-screen
                // too (C: maxrow >= rows).  lines already includes the
                // pager row, so >= rows means no room for a popup window.
                const offx = (lines.length >= 24) ? 0 : menuOffx;
                g._menu_overlay = {
                    pages: freshPages.map((pl, i) => (i === page ? lines : pl)),
                    page, kind: (offx > 0) ? 'popup' : 'text',
                    cType: 'NHW_MENU', offx,
                };
                g._pending_message = '';
                await flush_screen(1);
            };
            const closeMenu = () => { g._menu_overlay = null; };
            // PICK_ANY (how===2, e.g. pickup ',' / drop) is a MULTI-select:
            // C ref wintty.c process_menu_window — pressing an accelerator
            // TOGGLES that item, and MENU_ACCEPT ('\n'/'\r', or space on the
            // last page) finishes and returns ALL selected items.  PICK_ONE
            // (how===1, e.g. ^V level-teleport) returns immediately on the
            // first accelerator.  The old code returned after the first
            // letter for ANY how>0, so a PICK_ANY pickup grabbed only one
            // item and leaked the rest to rhack (seed0002 mv44: keys a,c,\r
            // pick darts+gems but JS took only 'a', leaving the gems on the
            // floor → the dog's dogfood/obj_resists count forked at idx 3766).
            const finishAny = () => {
                closeMenu();
                if (box && typeof box === 'object') {
                    box.value = selected.map((it) => ({ item: it.identifier, count: -1 }));
                }
                return selected.length;
            };
            await showPage();
            for (;;) {
                const c = await nhgetch();
                if (c === 0x1b) {
                    closeMenu();
                    if (box && typeof box === 'object') box.value = [];
                    return 0;
                }
                if (c === 10 || c === 13) {
                    if (how === 2) return finishAny();
                    closeMenu(); return 0;
                }
                if (c === 0x20 /* space */) {
                    if (page < numPages - 1) { page++; await showPage(); continue; }
                    if (how === 2) return finishAny();
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
                        if (how === 1) {
                            // PICK_ONE: select and return immediately.
                            if (box && typeof box === 'object') {
                                box.value = [{ item: hit.identifier, count: -1 }];
                            }
                            closeMenu();
                            return 1;
                        }
                        // PICK_ANY: toggle this item and keep reading.
                        const idx = selected.indexOf(hit);
                        if (idx >= 0) selected.splice(idx, 1);
                        else selected.push(hit);
                        await showPage();
                        continue;
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
