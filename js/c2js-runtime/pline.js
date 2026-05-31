// pline.js — message-printing wrappers from src/pline.c.
//
// For the PRNG-parity harness these don't fire rn2; in the engine
// path they need to update game._pending_message so flush_screen
// renders the message on row 0.  We selectively route pline() (the
// most common path) and a few specific helpers.  Helpers that take
// printf-style varargs are kept no-op for now because we don't have
// printf formatting wired here — using them naively would emit a
// literal "%s" instead of the substituted text, which produces WORSE
// output than no message at all.  Only literal-string callers get
// routed.
//
// Gate via globalThis.__nh_engine_pline so the harness can opt out
// when running PRNG-only mode (no msg state needed).

import { game } from '../gstate.js';
import { pline as _enginePline } from '../display.js';

function _coerceStr(v) {
    if (typeof v === 'string') return v;
    if (v && typeof v.value === 'string') return v.value;
    if (Array.isArray(v)) {
        let s = '';
        for (let i = 0; i < v.length && v[i]; i++) s += String.fromCharCode(v[i]);
        return s;
    }
    return '';
}
function _setMsg(s) {
    if (typeof game === 'undefined' || !game) return;
    // Only update when the caller's string contains no unresolved
    // printf substitutions.  A literal "%s %s" would overwrite a good
    // message with broken text.
    if (s && s.indexOf('%') >= 0) return;
    // Delegate to display.js's queue-aware pline so multi-message
    // sequences (e.g. outrumor's fortune cookie: "scrap of paper" /
    // "It reads:" / rumor text in seed1800; multi-pline sequences
    // in seed0367 priest-quest-tour) build up the --More-- queue
    // instead of each overwriting the prior pending.  display.js's
    // pline is `async` but contains no internal `await`s — the queue
    // mutations land synchronously before the returned promise
    // resolves, so translated callers (which invoke pline without
    // await) still see correct state ordering.  Routed 2026-05-31.
    //
    // Known trade-off: this exposes seed0501's existing translator
    // bug where JS getdir returns 0 for valid '.' direction (empty
    // input queue → ESC fallback), causing spelleffects's `else if
    // (!getdir(null))` branch to fire a spurious pline_The that was
    // previously masked by the overwrite behavior.  Net per-session:
    // seed0367 +191 P, seed0383 +5 P, seed0002 +1 S; seed0006/0030/
    // 0106/0360/0361/0399/4500 small P losses (-84 total); seed0501/
    // 0398/0108 -1 S each.  Aggregate +112 P, -2 S, 0 PASS change.
    // Worth landing because (a) it's spec-aligned (matches C's
    // update_topl flow in win/tty/topl.c:251), (b) the seed1800
    // partial fix unblocks further progress on the eat-cookie path,
    // (c) the seed0501 regression is a separate getdir bug to be
    // fixed independently.
    if (typeof _enginePline === 'function') {
        _enginePline(s);
        return;
    }
    game._pending_message = s;
}

// Resolve the common pline("%s", literal) pattern.  Translated code
// often emits `pline("%s", c_common_strings.c_Never_mind)` etc. —
// dropping these via the %-skip guard left row 0 blank where C had
// the literal text.  Substituting %s with the first arg is exact for
// this pattern; other printf-style formats still drop (the broader
// substitution would risk emitting subtly-wrong text).
function _applyFmt(fmt, args) {
    const f = _coerceStr(fmt);
    if (f.indexOf('%') < 0) return f;
    // Substitute supported printf conversions:
    //   %s  → string (via _coerceStr)
    //   %d  → integer
    //   %ld → long int
    //   %u  → unsigned int
    //   %c  → single character (from number code)
    //   %%  → literal '%'
    // Bail (return raw fmt → _setMsg's %-guard drops) for any
    // other specifier (%f, %x, %*, %p, etc.) to avoid emitting
    // subtly-wrong output.  Use_stethoscope-style "Status of %s
    // (%s, %s): Level %d HP %d(%d) AC %d%s." now substitutes
    // correctly instead of being dropped wholesale.
    let out = '';
    let ai = 0;
    let j = 0;
    while (j < f.length) {
        const ch = f[j];
        if (ch !== '%') { out += ch; j++; continue; }
        // Parse "%[l]?[d|s|u|c|%]"
        let k = j + 1;
        // Optional 'l' length modifier (%ld, %lu)
        if (f[k] === 'l') k++;
        const conv = f[k];
        if (conv === 's') {
            out += _coerceStr(args[ai++] ?? '');
            j = k + 1;
        } else if (conv === 'd' || conv === 'u') {
            const v = args[ai++];
            const n = (typeof v === 'number') ? v : parseInt(v, 10) || 0;
            out += String(n | 0);
            j = k + 1;
        } else if (conv === 'c') {
            const v = args[ai++];
            const n = (typeof v === 'number') ? v : 0;
            out += (n >= 32 && n < 127) ? String.fromCharCode(n) : '';
            j = k + 1;
        } else if (conv === '%') {
            out += '%';
            j = k + 1;
        } else {
            // Unsupported specifier — bail and let _setMsg drop the
            // partially-formatted message (less wrong than emitting
            // a half-substituted string).
            return f;
        }
    }
    return out;
}

// _setMsg already skips strings with '%' so literal-only callers
// (no printf substitution) land on _pending_message; format-string
// callers (e.g. `You("stop.  %s won't fit through.", YMonnam(mtmp))`)
// silently drop because printf isn't wired here.  The "%s"-only case
// goes through _applyFmt above which substitutes safely.
export function pline(fmt, ...args) { _setMsg(_applyFmt(fmt, args)); }
export function pline_The(fmt, ...args) { _setMsg('The ' + _applyFmt(fmt, args)); }
export function pline_dir(_dir, fmt, ...args) { _setMsg(_applyFmt(fmt, args)); }

// C ref pline.c — these wrap pline with a fixed prefix.  Route them
// the same way (literal-arg only); _setMsg's '%'-skip guards against
// emitting literal "%s" placeholders.
export function You(fmt, ...args) { _setMsg('You ' + _applyFmt(fmt, args)); }
export function Your(fmt, ...args) { _setMsg('Your ' + _applyFmt(fmt, args)); }
export function You_feel(fmt, ...args) { _setMsg('You feel ' + _applyFmt(fmt, args)); }
export function You_hear(fmt, ...args) { _setMsg('You hear ' + _applyFmt(fmt, args)); }
export function You_see(fmt, ...args) { _setMsg('You see ' + _applyFmt(fmt, args)); }
export function You_cant(fmt, ...args) { _setMsg("You can't " + _applyFmt(fmt, args)); }
export function You_ex(_dummy, fmt, ...args) { _setMsg('You ' + _applyFmt(fmt, args)); }

export function verbalize(_fmt, ..._args) {}
export function verbalize_dir(_dir, _fmt, ..._args) {}

export function raw_print(_msg) {}
export function raw_printf(_fmt, ..._args) {}

export function vraw_printf(_fmt, _args) {}
export function vpline(fmt, args) { _setMsg(_applyFmt(fmt, Array.isArray(args) ? args : [])); }
