// stdio.js — minimal libc stdio shim for c2js translator output.
//
// Phase 1: implements just enough printf/fprintf to round-trip the
// 01-arith test.  Format specifiers supported:
//   %d / %i — signed integer (32-bit truncation)
//   %u      — unsigned integer
//   %s      — string
//   %c      — character (numeric → fromCharCode, string → first char)
//   %%      — literal percent
//
// Width / precision / flags are added later phases as the translator
// hits real NetHack code that needs them.  For now, omitted features
// throw rather than silently wrong-print.

// Length modifiers (l, h, ll, hh, L, z, j, t) are accepted and ignored
// — JS doesn't distinguish int/long/long-long widths.  This is required
// for C source like `printf("%ld", val)` and `%-2ld` to match cleanly.
const FORMAT_RE = /%([-+ #0]*)(\d*|\*)(?:\.(\d+|\*))?(?:ll|hh|[lhLzjt])?([dDiouxXeEfFgGsScCp%])/g;

// `%s` argument coerce: char-array buffers (typical of `char buf[BUFSZ]`
// translations) need to be walked to NUL.  Without this, `String(buf)`
// returns the comma-joined repr ("65,66,67,0") instead of "ABC", which
// poisons every pline / sprintf call that takes a buffer.
function coerceArgForS(arg) {
    if (arg == null) return '(null)';
    if (Array.isArray(arg)) {
        let out = '';
        for (let i = 0; i < arg.length; i++) {
            if (!arg[i]) break;
            out += String.fromCharCode(arg[i]);
        }
        return out;
    }
    return String(arg);
}

// Parse a printf-style spec like "%04X" or "%-12s" or "%-2ld" and return
// { flags, width, conv } where width is the parsed numeric width
// (0 if absent), the length modifier (l, h, ll, hh, L, z, j, t) is
// accepted and ignored, and conv is the conversion char.
function parseSpec(spec) {
    // spec is the WHOLE match including the % and conversion char.
    // Format: %[flags][width][.precision][length]conv
    const m = /^%([-+ #0]*)(\d*)(?:\.(\d+))?(?:ll|hh|[lhLzjt])?([a-zA-Z%])$/.exec(spec);
    if (!m) return { flags: '', width: 0, precision: -1, conv: spec[spec.length - 1] };
    return {
        flags: m[1] || '',
        width: m[2] ? parseInt(m[2], 10) : 0,
        precision: m[3] ? parseInt(m[3], 10) : -1,
        conv: m[4],
    };
}

function padded(s, width, flags) {
    if (width <= s.length) return s;
    const padCh = (flags.includes('0') && !flags.includes('-')) ? '0' : ' ';
    if (flags.includes('-')) return s + ' '.repeat(width - s.length);
    return padCh.repeat(width - s.length) + s;
}

function formatOne(spec, arg) {
    const { flags, width, conv } = parseSpec(spec);
    if (conv === '%') return '%';
    if (conv === 'd' || conv === 'i' || conv === 'D') {
        let n = arg | 0;
        let s = String(Math.abs(n));
        // C printf: '+' flag forces sign on positive numbers (and 0);
        // ' ' flag uses a leading space for positives if '+' isn't set.
        // Without this, NetHack's enchantment display ("%+d" → "+2"/"+0")
        // drops the sign — e.g. doname for a +2 dart printed "2 dart"
        // instead of "+2 dart", and combined with prefix-arith bugs
        // produced "a 2 a 2 2dart" garbage in seed1800 step 25.
        let signPrefix;
        if (n < 0) signPrefix = '-';
        else if (flags.includes('+')) signPrefix = '+';
        else if (flags.includes(' ')) signPrefix = ' ';
        else signPrefix = '';
        return padded(signPrefix + s, width, flags);
    }
    if (conv === 'u') {
        let n = arg >>> 0;
        return padded(String(n), width, flags);
    }
    if (conv === 'x') {
        let n = (arg >>> 0).toString(16);
        return padded(n, width, flags);
    }
    if (conv === 'X') {
        let n = (arg >>> 0).toString(16).toUpperCase();
        return padded(n, width, flags);
    }
    if (conv === 'o') {
        let n = (arg >>> 0).toString(8);
        return padded(n, width, flags);
    }
    if (conv === 'p') {
        // Pointer — print as hex; only used in debug output in C
        return padded((arg >>> 0).toString(16), width, flags);
    }
    if (conv === 's') {
        // C printf '.precision' on %s = max chars to print.
        // sprintf(buf, "%.16s", plname) truncates plname to 16 chars
        // (used by rip.js for tombstone, botl.js for hilite, etc.).
        const { precision } = parseSpec(spec);
        let str = coerceArgForS(arg);
        if (precision >= 0 && str.length > precision) str = str.slice(0, precision);
        return padded(str, width, flags);
    }
    if (conv === 'c') {
        if (typeof arg === 'number') return String.fromCharCode(arg & 0xff);
        return coerceArgForS(arg).charAt(0);
    }
    if (conv === 'f' || conv === 'F' || conv === 'e' || conv === 'E' || conv === 'g' || conv === 'G') {
        // Floating point — fall back to JS String() coercion.  Width/
        // precision honored minimally.
        return padded(String(Number(arg)), width, flags);
    }
    throw new Error(`stdio.js printf: unsupported format spec "${spec}"`);
}

export function format_string(fmt, args) {
    let out = '';
    let i = 0;
    let lastEnd = 0;
    let m;
    FORMAT_RE.lastIndex = 0;
    while ((m = FORMAT_RE.exec(fmt)) !== null) {
        out += fmt.slice(lastEnd, m.index);
        if (m[0] === '%%') {
            out += '%';
        } else {
            // C printf '*' in width / precision consumes one int arg
            // BEFORE the value arg.  m[0] = whole spec, m[2] = width
            // (digits or "*"), m[3] = precision (digits or "*").
            // Without handling these, "%.*s" with args [16, str] ate
            // 16 as the value and dropped the string; sprintf(buf,
            // "%.*s", 16, plname) printed undefined / garbage.
            let spec = m[0];
            if (m[2] === '*') {
                const w = (args[i++] | 0);
                spec = spec.replace('*', String(Math.abs(w)));
                if (w < 0 && !m[1].includes('-')) {
                    // negative width per C printf = left-justify flag.
                    spec = spec.replace('%', '%-');
                }
            }
            if (m[3] === '*') {
                const p = (args[i++] | 0);
                spec = spec.replace('.*', '.' + String(Math.max(0, p)));
            }
            out += formatOne(spec, args[i++]);
        }
        lastEnd = FORMAT_RE.lastIndex;
    }
    out += fmt.slice(lastEnd);
    return out;
}

export function printf(fmt, ...args) {
    const s = format_string(fmt, args);
    process.stdout.write(s);
    return s.length;
}

export function fprintf(stream, fmt, ...args) {
    const s = format_string(fmt, args);
    if (stream === 'stderr' || stream === 2) process.stderr.write(s);
    else process.stdout.write(s);
    return s.length;
}

export function puts(s) {
    process.stdout.write(s + '\n');
    return s.length + 1;
}

export function putchar(c) {
    const ch = typeof c === 'number' ? String.fromCharCode(c & 0xff) : String(c);
    process.stdout.write(ch);
    return c;
}

// vsnprintf(buf, size, fmt, va_list): format into buf, max `size`
// chars including the trailing nul.  Translated NetHack uses this
// from livelog_printf, raw_printf, etc. — printf-style helpers
// that don't fire PRNG.  No-op (returns 0) is sufficient for
// PRNG-faithful play.
export function vsnprintf(_buf, _size, _fmt, _va) { return 0; }

// snprintf / nh_snprintf / sprintf — return the formatted string.
// Translated NetHack uses these like
//   buf = sprintf(buf, "Foo %s", x);
// where the JS-side `buf` becomes the formatted string.  Return
// the formatted result so display code (which reads `buf` as a
// string in win_putstr) sees correct text.
//
// When the destination buf is a JS Array (i.e. a C `char[N]` local),
// ALSO mutate it in place so caller-side `describe_level(buf, …)`
// outparam pattern sees the result through their array reference.
// The translator's `buf = sprintf(buf, …)` rebinds the local to the
// returned string for in-function use, but the caller's array stays
// updated via the in-place mutate.  Without this, every C function
// that fills a `char *` outparam by sprintf'ing into it produced an
// all-zeros array on the caller side — the canonical example is
// `describe_level(buf, …)` called from `impossible(…, buf)` in
// dmonsfree, which produced "dmonsfree: 1 removed doesn't match 0
// pending on " (empty after "on ").
function coerceFmtArg(fmt) {
    if (fmt == null) return '';
    if (Array.isArray(fmt)) {
        let r = '';
        for (let i = 0; i < fmt.length && fmt[i]; i++) r += String.fromCharCode(fmt[i]);
        return r;
    }
    return String(fmt);
}

// Copy `str`'s bytes into char-array `buf` (NUL-terminated, truncated
// to buf's length).  No-op for non-array buf.  Internal helper for
// sprintf/snprintf/strcat-family runtime mutate.
function writeIntoCharArray(buf, str) {
    if (!Array.isArray(buf)) return;
    const lim = buf.length;
    let i = 0;
    for (; i < str.length && i < lim; i++) buf[i] = str.charCodeAt(i);
    if (i < lim) buf[i] = 0;
}

export function snprintf(_buf, _size, fmt, ...args) {
    const result = format_string(coerceFmtArg(fmt), args);
    writeIntoCharArray(_buf, result);
    return result;
}
export function nh_snprintf(_label, _line, _buf, _size, fmt, ...args) {
    const result = format_string(coerceFmtArg(fmt), args);
    writeIntoCharArray(_buf, result);
    return result;
}
export function sprintf(_buf, fmt, ...args) {
    const result = format_string(coerceFmtArg(fmt), args);
    writeIntoCharArray(_buf, result);
    return result;
}
