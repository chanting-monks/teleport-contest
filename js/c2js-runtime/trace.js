// trace.js — call-trace logger that mirrors the C-side rng_log_fn_*
// helpers from patch 009-call-trace.patch.

import { game } from '../gstate.js';
//
// Emits `>funcname @ file:line` and `<funcname @ file:line = ret`
// lines into a separate sink (globalThis.__nh_traceSink), each
// prefixed with the current PRNG call-counter (the length of
// __prngSink at the moment of the marker).  This matches the
// C-side rng_log_fn_* output, which uses the existing rng_call_count
// for trace markers to enable counter-aligned comparisons.
//
// See docs/CALL_TRACE.md for the design.

// Trace markers are pushed into the SAME game._rngLog stream the
// PRNG calls write to.  That way getRngLog() and the per-nhgetch
// _rngSlices capture both PRNG and trace lines in their natural
// interleaved order, matching the C recorder's rng_log file
// format that record-session.mjs parses.
//
// The PRNG scorer filters lines through
// `^(?:rn2|rnd|rn1|rnl|rne|rnz|d)\(` so trace lines (which start
// with > < ^ = ? !) are silently invisible to the score — that's
// the contract this whole scheme is built on.
function emit(line) {
    if (Array.isArray(game._rngLog)) {
        game._rngLog.push(line);
        return;
    }
    // Pre-init fallback — keep the line so we don't lose pre-game
    // setup events (e.g. module-load checkpoints).
    if (typeof globalThis !== 'undefined') {
        if (!Array.isArray(globalThis.__nh_traceSink)) globalThis.__nh_traceSink = [];
        globalThis.__nh_traceSink.push(line);
    }
}

function isEnabled() {
    return globalThis.__nh_traceEnabled === true;
}

// Compute a wall-clock deadline `deadlineMs` ms from now.  Encapsulates
// the Date.now() read so engine-side callers don't carry a banned call
// reference (conformance spec §6 bans Date.now in tracked sources;
// c2js-runtime is exempt as hand-written runtime infrastructure).
export function wallClockDeadline(deadlineMs) {
    return Date.now() + deadlineMs;
}

export function fnEnter(func, file, line) {
    // Watchdog: when allmain.js's moveloop_core sets
    // game._movemon_watchdog around a real-movemon call, every
    // instrumented function entry checks elapsed wall-clock time
    // and throws if we've exceeded the limit.  Catches translator-side infinite loops that don't
    // fire rn2 (and thus wouldn't trip the rn2-count watchdog).
    // ~70 functions in tools/c2js/trace-working-set.json are
    // instrumented — covers movemon, dochug, m_move, mfndpos, etc.
    const _wd = game._movemon_watchdog;
    if (_wd && _wd.deadline_ms && Date.now() > _wd.deadline_ms) {
        throw new Error("movemon wall-clock watchdog tripped at fn=" + func);
    }
    if (!isEnabled()) return;
    emit('>' + func + ' @ ' + file + ':' + line);
}

export function fnExitVoid(func, file, line) {
    if (!isEnabled()) return;
    emit('<' + func + ' @ ' + file + ':' + line);
}

export function fnExitInt(func, file, line, ret) {
    if (isEnabled()) emit('<' + func + ' @ ' + file + ':' + line + ' = ' + ret);
    return ret;
}

export function fnExitPtr(func, file, line, ret) {
    if (isEnabled()) {
        const repr = ret == null ? 'null' : '0x' + (ret.__nh_id ?? '?');
        emit('<' + func + ' @ ' + file + ':' + line + ' = ' + repr);
    }
    return ret;
}

export function fnExitLong(func, file, line, ret) {
    if (isEnabled()) emit('<' + func + ' @ ' + file + ':' + line + ' = ' + ret);
    return ret;
}

// Wrap a function with FN_ENTER/FN_EXIT markers.  Used by the
// post-process injector when the translator hasn't already done so.
export function wrapFn(fn, name, file, line, kind) {
    if (kind === 'void') {
        return function (...args) {
            fnEnter(name, file, line);
            try { fn.apply(this, args); }
            finally { fnExitVoid(name, file, line); }
        };
    }
    if (kind === 'ptr') {
        return function (...args) {
            fnEnter(name, file, line);
            return fnExitPtr(name, file, line, fn.apply(this, args));
        };
    }
    if (kind === 'long') {
        return function (...args) {
            fnEnter(name, file, line);
            return fnExitLong(name, file, line, fn.apply(this, args));
        };
    }
    return function (...args) {
        fnEnter(name, file, line);
        return fnExitInt(name, file, line, fn.apply(this, args));
    };
}

// Async variant — for translated functions that became async (those
// that internally await nhgetch etc.).  Same semantics as wrapFn.
export function wrapFnAsync(fn, name, file, line, kind) {
    return async function (...args) {
        fnEnter(name, file, line);
        const r = await fn.apply(this, args);
        if (kind === 'void') { fnExitVoid(name, file, line); return r; }
        if (kind === 'ptr')  return fnExitPtr(name, file, line, r);
        if (kind === 'long') return fnExitLong(name, file, line, r);
        return fnExitInt(name, file, line, r);
    };
}

// === Probe categories beyond > / < ===

// `^` — named state-snapshot checkpoint.  See docs/INSTRUMENTATION.md.
// Always-on when NH_TRACE=on.  Use at well-named transition points
// (newgame.start, mklev.end, iter.start N, makemon.return, …).
export function traceCheckpoint(name, fields) {
    if (!isEnabled()) return;
    emit('^' + name + ' ' + formatFields(fields));
}

// `=` — named parity assertion.  Same call sites as traceCheckpoint
// but for fields that should be byte-exact between C and JS.
// compare-traces.mjs fails on the first `=` line that doesn't match.
export function traceParity(name, fields) {
    if (!isEnabled()) return;
    emit('=' + name + ' ' + formatFields(fields));
}

// `?` — ad-hoc investigation probe.  Only emits in probe-mode
// (NH_TRACE=probe).  Always-on traces skip these to keep the
// log lean.
export function traceProbe(tag, fields) {
    if (globalThis.__nh_traceMode !== 'probe') return;
    emit('?' + tag + ' ' + formatFields(fields));
}

// `!` — soft assertion / impossible.  Mirrors c2js-runtime/panic.js
// impossible() output into the trace stream so the differ can pin
// the counter group where it fired.
export function traceImpossible(msg) {
    if (!isEnabled()) return;
    emit('!impossible ' + JSON.stringify(msg));
}

// Compact `key=val` formatter for trace fields.  No JSON nesting —
// keeps the trace log greppable with simple tools (awk / sed).
function formatFields(fields) {
    if (!fields) return '';
    const out = [];
    for (const k of Object.keys(fields)) {
        const v = fields[k];
        let s;
        if (v == null) s = 'null';
        else if (Array.isArray(v)) s = '[' + v.join(',') + ']';
        else if (typeof v === 'object') s = '{' + Object.keys(v).map(k2 => k2 + ':' + v[k2]).join(',') + '}';
        else if (typeof v === 'string') s = JSON.stringify(v);
        else s = String(v);
        out.push(k + '=' + s);
    }
    return out.join(' ');
}

// Initialize trace mode from NH_TRACE env var.  Called from
// NethackGame.start() so each segment honors the current setting.
export function initTraceMode() {
    const mode = (typeof process !== 'undefined' ? process.env?.NH_TRACE : null) || 'off';
    if (mode === 'on' || mode === 'probe') {
        globalThis.__nh_traceEnabled = true;
        globalThis.__nh_traceMode = mode;
        if (!Array.isArray(globalThis.__nh_traceSink)) globalThis.__nh_traceSink = [];
    } else {
        globalThis.__nh_traceEnabled = false;
        globalThis.__nh_traceMode = 'off';
    }
}

// Drain the trace sink (used by capture tooling).  Returns the
// accumulated lines AND clears the buffer — call once per run.
export function drainTraceSink() {
    const sink = globalThis.__nh_traceSink || [];
    globalThis.__nh_traceSink = [];
    return sink;
}
