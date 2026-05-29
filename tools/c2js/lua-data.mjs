// lua-data.mjs — minimal Lua-to-JS converter for the declarative
// subset NetHack uses in its dat/*.lua files.
//
// Handles:
//   - Top-level assignments:  `name = <value>`
//   - Table literals: array-style `{1, 2, 3}`, key-value
//     `{name = "x", base = 5}`, mixed, nested, trailing commas
//   - Strings:  "..."  '...'  [[ ... ]]
//   - Numbers (integer and float), unary minus
//   - Booleans, nil
//   - Comments:  `-- to EOL`  and  `--[[ ... ]]`
//   - Bracketed keys:  `[3] = "x"`  (parsed but rendered the same as
//     positional when the index follows array order)
//
// Does NOT handle:
//   - Function definitions, control flow, operators beyond unary `-`
//   - Method calls (`obj:method(...)`), string concatenation, format
//   - Long strings with custom level (`[==[ ... ]==]`)
//
// Anything outside the declarative subset triggers a parse error so
// the caller knows to hand-port that file instead.

export function parseLuaData(source) {
    const p = new Parser(source);
    const out = {};
    while (!p.atEnd()) {
        p.skipTrivia();
        if (p.atEnd()) break;
        const name = p.parseIdent();
        if (!name) p.fail('expected identifier');
        p.expect('=');
        const value = p.parseValue();
        out[name] = value;
        // Optional trailing semicolon.
        p.skipTrivia();
        if (p.peek() === ';') p.advance();
    }
    return out;
}

class Parser {
    constructor(src) { this.s = src; this.i = 0; }
    atEnd() { this.skipTrivia(); return this.i >= this.s.length; }
    peek(o = 0) { return this.s[this.i + o]; }
    advance() { return this.s[this.i++]; }
    fail(msg) {
        const before = this.s.slice(Math.max(0, this.i - 30), this.i);
        const after = this.s.slice(this.i, this.i + 30);
        const line = this.s.slice(0, this.i).split('\n').length;
        throw new Error(`lua-data parse error at line ${line}: ${msg}\n  near: ...${before}|${after}...`);
    }
    skipTrivia() {
        while (this.i < this.s.length) {
            const c = this.s[this.i];
            if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { this.i++; continue; }
            if (c === '-' && this.s[this.i + 1] === '-') {
                this.i += 2;
                if (this.s[this.i] === '[' && this.s[this.i + 1] === '[') {
                    // long comment
                    this.i += 2;
                    const end = this.s.indexOf(']]', this.i);
                    if (end < 0) this.fail('unterminated long comment');
                    this.i = end + 2;
                } else {
                    while (this.i < this.s.length && this.s[this.i] !== '\n') this.i++;
                }
                continue;
            }
            break;
        }
    }
    expect(s) {
        this.skipTrivia();
        for (let k = 0; k < s.length; k++) {
            if (this.s[this.i + k] !== s[k]) this.fail(`expected '${s}'`);
        }
        this.i += s.length;
    }
    match(s) {
        this.skipTrivia();
        for (let k = 0; k < s.length; k++) {
            if (this.s[this.i + k] !== s[k]) return false;
        }
        this.i += s.length;
        return true;
    }
    parseIdent() {
        this.skipTrivia();
        const start = this.i;
        if (!/[A-Za-z_]/.test(this.s[this.i])) return null;
        while (this.i < this.s.length && /[A-Za-z_0-9]/.test(this.s[this.i])) this.i++;
        return this.s.slice(start, this.i);
    }
    parseValue() {
        this.skipTrivia();
        const c = this.s[this.i];
        if (c === '{') return this.parseTable();
        if (c === '"' || c === "'") return this.parseString(c);
        if (c === '[' && this.s[this.i + 1] === '[') return this.parseLongString();
        if (c === '-' || (c >= '0' && c <= '9')) return this.parseNumber();
        // Keyword: true / false / nil / identifier (rare in dat files,
        // but we accept ident-as-string-fallback never — fail instead).
        if (this.match('true')) return true;
        if (this.match('false')) return false;
        if (this.match('nil')) return null;
        this.fail(`unexpected character '${c}'`);
        return undefined;
    }
    parseString(quote) {
        this.advance(); // opening quote
        let out = '';
        while (this.i < this.s.length && this.s[this.i] !== quote) {
            if (this.s[this.i] === '\\' && this.i + 1 < this.s.length) {
                const e = this.s[this.i + 1];
                this.i += 2;
                switch (e) {
                    case 'n': out += '\n'; break;
                    case 't': out += '\t'; break;
                    case 'r': out += '\r'; break;
                    case '\\': out += '\\'; break;
                    case '"': out += '"'; break;
                    case "'": out += "'"; break;
                    case '0': out += '\0'; break;
                    default: out += e;
                }
                continue;
            }
            out += this.s[this.i++];
        }
        if (this.s[this.i] !== quote) this.fail('unterminated string');
        this.advance(); // closing quote
        return out;
    }
    parseLongString() {
        this.expect('[[');
        const end = this.s.indexOf(']]', this.i);
        if (end < 0) this.fail('unterminated long string');
        const out = this.s.slice(this.i, end);
        this.i = end + 2;
        // Long strings beginning with a newline strip that newline.
        return out.startsWith('\n') ? out.slice(1) : out;
    }
    parseNumber() {
        const start = this.i;
        if (this.s[this.i] === '-') this.i++;
        while (this.i < this.s.length && /[0-9]/.test(this.s[this.i])) this.i++;
        if (this.s[this.i] === '.') {
            this.i++;
            while (this.i < this.s.length && /[0-9]/.test(this.s[this.i])) this.i++;
        }
        if (this.s[this.i] === 'e' || this.s[this.i] === 'E') {
            this.i++;
            if (this.s[this.i] === '+' || this.s[this.i] === '-') this.i++;
            while (this.i < this.s.length && /[0-9]/.test(this.s[this.i])) this.i++;
        }
        return Number(this.s.slice(start, this.i));
    }
    parseTable() {
        this.expect('{');
        // We model Lua tables as JS objects.  Array-style entries get
        // keys 1, 2, 3, ... (1-indexed, matching Lua); key=value entries
        // become string-keyed properties.  This faithfully preserves
        // distinct namespaces — Lua does the same.
        const t = {};
        let nextArrayIdx = 1;
        let isPureArray = true;
        for (;;) {
            this.skipTrivia();
            if (this.peek() === '}') { this.advance(); break; }
            // Possible forms:
            //   IDENT = VALUE
            //   [VALUE] = VALUE
            //   VALUE              (positional; assigned to nextArrayIdx)
            const startIdx = this.i;
            // Try IDENT = …
            const id = this.tryIdentEquals();
            if (id !== null) {
                t[id] = this.parseValue();
                isPureArray = false;
            } else if (this.peek() === '[') {
                this.advance();
                const k = this.parseValue();
                this.expect(']');
                this.expect('=');
                t[String(k)] = this.parseValue();
                if (typeof k === 'number' && k === nextArrayIdx) nextArrayIdx++;
                else isPureArray = false;
            } else {
                t[String(nextArrayIdx)] = this.parseValue();
                nextArrayIdx++;
            }
            // separator: ',' or ';' (both legal); trailing one allowed
            this.skipTrivia();
            if (this.peek() === ',' || this.peek() === ';') {
                this.advance();
                continue;
            }
            this.skipTrivia();
            if (this.peek() === '}') { this.advance(); break; }
            this.fail("expected ',' ';' or '}'");
        }
        // If the table is a pure 1-indexed sequence, convert to a JS
        // array so consumers can use `.length`.  Lua tables with
        // explicit numeric indices that happen to start at 1 also fit.
        if (isPureArray) {
            const arr = [];
            for (let k = 1; k < nextArrayIdx; k++) arr.push(t[String(k)]);
            return arr;
        }
        return t;
    }
    // Look-ahead helper: if the next non-trivia tokens form `IDENT =`,
    // consume them and return the ident.  Otherwise rewind and return
    // null.
    tryIdentEquals() {
        const save = this.i;
        this.skipTrivia();
        if (!/[A-Za-z_]/.test(this.s[this.i] || '')) { this.i = save; return null; }
        let j = this.i;
        while (j < this.s.length && /[A-Za-z_0-9]/.test(this.s[j])) j++;
        const name = this.s.slice(this.i, j);
        let k = j;
        while (k < this.s.length && /\s/.test(this.s[k])) k++;
        if (this.s[k] !== '=' || this.s[k + 1] === '=') { this.i = save; return null; }
        this.i = k + 1;
        return name;
    }
}
