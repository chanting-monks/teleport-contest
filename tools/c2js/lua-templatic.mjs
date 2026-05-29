// lua-templatic.mjs — convert templatic NetHack level-design .lua
// files into a JS function that calls the same des.* / selection.*
// methods.
//
// These files (Bar-fila.lua, bigrm-N.lua, sokoban-N.lua, themerms
// per-room closures, ...) describe level layout with a small subset
// of Lua: namespace-method calls, simple control flow, local vars,
// and short anonymous functions.  No real Lua VM needed — we
// transpile them once into a JS module and call that.  This
// eliminates the fengari runtime AND the sync/async boundary that
// blocks NH_EMIT_ASYNC=1 (the JS function can be `async` and
// `await` its des.* calls naturally).
//
// Handles:
//   - Top-level calls into ALLOWED_NAMESPACES (des, selection,
//     monster, obj, feature) and free-standing functions
//   - Method-call sugar `a:method(...)`  →  JS `a.method(...)`
//   - Method-chain dispatch `selection.room():percentage(30)`
//   - `local var = expr`  →  `let var = expr`
//   - `if cond then ... end`  /  `if ... else ... end`
//   - `for i = lo, hi do ... end`  (1-based numeric for)
//   - `for i = lo, hi, step do ... end`
//   - Anonymous function literals `function(x, y) ... end`
//     →  `async (x, y) => { ... }`
//   - Binary operators: + - * / % == ~= < <= > >= and or ..
//   - Unary operators: - not #
//   - Argument literals: strings, numbers, booleans, nil, tables
//   - Table literals: `{k=v, k=v}`, `{a, b, c}`, `[2] = "x"`
//   - Strings: "..."  '...'  [[ ... ]]
//   - Comments:  `-- to EOL`  and  `--[[ ... ]]`
//
// Does NOT handle (caller must hand-port if encountered):
//   - `function name(...) end` top-level function definitions
//   - while / repeat loops
//   - for-in (generic for) loops
//   - goto / break
//   - Multi-value assignments and returns
//   - string.format and other library calls beyond the helpers
//
// ⚠ INDEX SEMANTICS: Lua arrays are 1-indexed; JS arrays are
// 0-indexed.  This transpiler emits `arr[expr]` literally — for
// numeric indices that follow Lua-style 1-based ordering, the
// generated JS would read the wrong element.  Currently this is
// a known limitation; closures that mix Lua-table indexing with
// runtime numeric values need either:
//   - hand-port instead of transpile, OR
//   - manual `[expr - 1]` in the generated JS, OR
//   - a future enhancement that adds `_at(arr, i)` wrapping.
// For the templatic NetHack files, most array uses are
// `themerooms[i].contents()` style accessed inside the closure
// body — these can be hand-fixed in follow-up integration if
// generated output is used directly.
//
// Output: a parsed program AST `{ body: [stmt, ...] }`.  Render
// with `renderJsCalls(ast)` to get a JS module source string.

// Recognized top-level namespaces.  Calls to these resolve via
// the module-level destructuring import in the generated JS.
const ALLOWED_NAMESPACES = new Set([
    'des', 'selection', 'monster', 'obj', 'feature',
]);

// Helper functions / values transpiler-emitted code can reference
// without quoting.  These get destructured from the env at the
// top of each generated function.
const ALLOWED_HELPERS = new Set([
    'percent', 'd', 'shuffle', 'mathRandom', 'nh',
    'level_difficulty',
    'pline', 'impossible',
]);

const LUA_KEYWORDS = new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
    'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or',
    'repeat', 'return', 'then', 'true', 'until', 'while',
]);

export function parseTemplaticLua(source) {
    const p = new Parser(source);
    const body = parseBlock(p, /*topLevel=*/true);
    if (!p.atEnd()) p.fail('expected end of file');
    return { body };
}

// ── Statement parsing ─────────────────────────────────────────────

function parseBlock(p, topLevel = false) {
    const stmts = [];
    while (!p.atEnd()) {
        p.skipTrivia();
        if (p.atEnd()) break;
        // Block terminators
        if (p.matchKeyword('end') || p.matchKeyword('else')
            || p.matchKeyword('elseif') || p.matchKeyword('until')) break;
        const stmt = parseStatement(p, topLevel);
        if (stmt) stmts.push(stmt);
        // Optional trailing semicolon
        p.skipTrivia();
        if (p.peek() === ';') p.advance();
    }
    return stmts;
}

function parseStatement(p, topLevel) {
    p.skipTrivia();
    if (p.consumeKeyword('local')) return parseLocal(p);
    if (p.consumeKeyword('if'))    return parseIf(p);
    if (p.consumeKeyword('for'))   return parseFor(p);
    if (p.consumeKeyword('return')) return parseReturn(p);
    if (p.matchKeyword('function')) {
        // Either `function name(...)` (top-level def) or
        // `function ...` as expression (anonymous).  Distinguish by
        // peeking: if `function` is followed by `(` it's anonymous;
        // else it's a named def.
        const save = p.i;
        p.consumeKeyword('function');
        p.skipTrivia();
        if (p.peek() === '(') {
            // Anonymous expression statement (rare; usually inside expr).
            p.i = save;
            const expr = parseExpr(p);
            return { kind: 'exprstmt', expr };
        }
        // Named function def — global `function NAME(...) ... end`
        // becomes `globalThis.NAME = async function(...) { ... }`.
        const name = p.parseIdent();
        if (!name) p.fail("expected name after 'function'");
        const fn = parseAnonFn(p);  // parses (params) body end
        return { kind: 'function_decl', name, fn };
    }
    if (p.consumeKeyword('do')) {
        const body = parseBlock(p);
        p.expectKeyword('end');
        return { kind: 'block', body };
    }
    if (p.consumeKeyword('while')) {
        const cond = parseExpr(p);
        p.expectKeyword('do');
        const body = parseBlock(p);
        p.expectKeyword('end');
        return { kind: 'while', cond, body };
    }
    if (p.consumeKeyword('repeat')) {
        const body = parseBlock(p);
        p.expectKeyword('until');
        const cond = parseExpr(p);
        return { kind: 'repeat', body, cond };
    }
    if (p.consumeKeyword('break')) return { kind: 'break' };
    // Expression statement: a call (assignment to ns.x not supported).
    // Could also be a re-assignment to a local: `var = expr`, or a
    // multi-assignment `a, b = x, y` (Lua-only — JS equivalent is
    // `[a, b] = [x, y]` via destructuring).
    const expr = parseExpr(p);
    p.skipTrivia();
    // Multi-target: collect additional targets while we see commas.
    const targets = [expr];
    while (p.peek() === ',') {
        p.advance();
        targets.push(parseExpr(p));
    }
    p.skipTrivia();
    if (p.peek() === '=' && p.peek(1) !== '=') {
        p.advance();
        const values = [parseExpr(p)];
        while (p.peek() === ',') {
            p.advance();
            values.push(parseExpr(p));
        }
        if (targets.length === 1 && values.length === 1) {
            return { kind: 'assign', target: targets[0], value: values[0] };
        }
        return { kind: 'multi_assign', targets, values };
    }
    if (targets.length !== 1) p.fail('expected = after multiple targets');
    return { kind: 'exprstmt', expr };
}

function parseLocal(p) {
    p.skipTrivia();
    const name = p.parseIdent();
    if (!name) p.fail("expected name after 'local'");
    p.skipTrivia();
    let init = null;
    if (p.peek() === '=') {
        p.advance();
        init = parseExpr(p);
    }
    return { kind: 'local', name, init };
}

function parseIf(p) {
    const cond = parseExpr(p);
    p.expectKeyword('then');
    const body = parseBlock(p);
    const branches = [{ cond, body }];
    while (p.consumeKeyword('elseif')) {
        const c = parseExpr(p);
        p.expectKeyword('then');
        branches.push({ cond: c, body: parseBlock(p) });
    }
    let elseBody = null;
    if (p.consumeKeyword('else')) {
        elseBody = parseBlock(p);
    }
    p.expectKeyword('end');
    return { kind: 'if', branches, else: elseBody };
}

function parseFor(p) {
    p.skipTrivia();
    const varName = p.parseIdent();
    if (!varName) p.fail("expected variable after 'for'");
    p.skipTrivia();
    if (p.peek() === '=') {
        // Numeric for: `for i = lo, hi [, step] do ... end`
        p.advance();
        const lo = parseExpr(p);
        p.expect(',');
        const hi = parseExpr(p);
        let step = null;
        p.skipTrivia();
        if (p.peek() === ',') {
            p.advance();
            step = parseExpr(p);
        }
        p.expectKeyword('do');
        const body = parseBlock(p);
        p.expectKeyword('end');
        return { kind: 'for_num', var: varName, lo, hi, step, body };
    }
    if (p.peek() === ',') {
        // Generic for: `for k, v in pairs(t) do ... end` or
        // `for i, v in ipairs(t) do ... end`
        p.advance();
        const valName = p.parseIdent();
        if (!valName) p.fail("expected second variable in generic for");
        p.expectKeyword('in');
        const iter = parseExpr(p);
        p.expectKeyword('do');
        const body = parseBlock(p);
        p.expectKeyword('end');
        return { kind: 'for_in', keyVar: varName, valVar: valName, iter, body };
    }
    p.fail(`expected '=' or ',' after for-variable, got '${p.peek()}'`);
}

function parseReturn(p) {
    p.skipTrivia();
    // Optional value
    if (p.atEnd() || p.matchKeyword('end') || p.matchKeyword('else')
        || p.matchKeyword('elseif') || p.peek() === ';') {
        return { kind: 'return', value: null };
    }
    const value = parseExpr(p);
    return { kind: 'return', value };
}

// ── Expression parsing — precedence climbing ──────────────────────

const BIN_OPS = [
    // Lua precedence groups (lowest to highest); within each group,
    // left-associative.
    { ops: ['or'], prec: 1 },
    { ops: ['and'], prec: 2 },
    { ops: ['<', '<=', '>', '>=', '==', '~='], prec: 3 },
    { ops: ['..'], prec: 4, right: true },
    { ops: ['+', '-'], prec: 5 },
    { ops: ['*', '/', '%'], prec: 6 },
    // Unary at prec 7; handled in parseUnary
];

function lookupBinOp(p) {
    p.skipTrivia();
    const c = p.peek(), c2 = p.peek(1);
    // Two-char ops
    if (c === '=' && c2 === '=') return { op: '==', len: 2 };
    if (c === '~' && c2 === '=') return { op: '~=', len: 2 };
    if (c === '<' && c2 === '=') return { op: '<=', len: 2 };
    if (c === '>' && c2 === '=') return { op: '>=', len: 2 };
    if (c === '.' && c2 === '.') return { op: '..', len: 2 };
    // One-char
    if ('+-*/%<>'.includes(c)) return { op: c, len: 1 };
    // Word ops
    if (p.matchKeyword('and')) return { op: 'and', len: 3, word: true };
    if (p.matchKeyword('or'))  return { op: 'or',  len: 2, word: true };
    return null;
}

function precOf(op) {
    for (const g of BIN_OPS) if (g.ops.includes(op)) return g;
    return null;
}

function parseExpr(p, minPrec = 1) {
    let left = parseUnary(p);
    while (true) {
        const opInfo = lookupBinOp(p);
        if (!opInfo) break;
        const g = precOf(opInfo.op);
        if (!g || g.prec < minPrec) break;
        p.skipTrivia();
        if (opInfo.word) p.consumeKeyword(opInfo.op);
        else { for (let k = 0; k < opInfo.len; k++) p.advance(); }
        const rightPrec = g.right ? g.prec : g.prec + 1;
        const right = parseExpr(p, rightPrec);
        left = { kind: 'binop', op: opInfo.op, left, right };
    }
    return left;
}

function parseUnary(p) {
    p.skipTrivia();
    if (p.peek() === '-' && !/[0-9]/.test(p.peek(1))) {
        p.advance();
        return { kind: 'unop', op: '-', operand: parseUnary(p) };
    }
    if (p.matchKeyword('not')) {
        p.consumeKeyword('not');
        return { kind: 'unop', op: 'not', operand: parseUnary(p) };
    }
    if (p.peek() === '#') {
        p.advance();
        return { kind: 'unop', op: '#', operand: parseUnary(p) };
    }
    return parsePostfix(p);
}

function parsePostfix(p) {
    let base = parsePrimary(p);
    while (true) {
        p.skipTrivia();
        const c = p.peek();
        if (c === '.' && p.peek(1) !== '.') {
            // Field access: .ident — followed optionally by call or chain
            p.advance();
            const name = p.parseIdent();
            base = { kind: 'field', target: base, name };
        } else if (c === ':') {
            // Method-call sugar: a:method(args)
            p.advance();
            const name = p.parseIdent();
            p.skipTrivia();
            // Either parenthesized args or single string/table arg
            const args = parseCallArgs(p);
            base = { kind: 'method', target: base, name, args };
        } else if (c === '(') {
            // Function call
            p.advance();
            const args = parseExprList(p, ')');
            p.expect(')');
            base = { kind: 'call', callee: base, args };
        } else if (c === '[') {
            p.advance();
            const idx = parseExpr(p);
            p.expect(']');
            base = { kind: 'index', target: base, index: idx };
        } else if (c === '{' || c === '"' || c === "'") {
            // Lua call sugar: `f"str"` or `f{table}` is `f("str")` / `f({...})`
            const arg = parseValue(p);
            base = { kind: 'call', callee: base, args: [arg] };
        } else break;
    }
    return base;
}

function parseCallArgs(p) {
    p.skipTrivia();
    if (p.peek() === '(') {
        p.advance();
        const args = parseExprList(p, ')');
        p.expect(')');
        return args;
    }
    if (p.peek() === '{' || p.peek() === '"' || p.peek() === "'"
        || (p.peek() === '[' && p.peek(1) === '[')) {
        return [parseValue(p)];
    }
    p.fail('expected ( or { after method call');
}

function parseExprList(p, terminator) {
    p.skipTrivia();
    if (p.peek() === terminator) return [];
    const out = [parseExpr(p)];
    while (true) {
        p.skipTrivia();
        if (p.peek() === ',') {
            p.advance();
            out.push(parseExpr(p));
        } else break;
    }
    return out;
}

function parsePrimary(p) {
    p.skipTrivia();
    const c = p.peek();
    if (c === '(') {
        p.advance();
        const e = parseExpr(p);
        p.expect(')');
        return { kind: 'paren', expr: e };
    }
    // Literal or compound
    return parseValue(p);
}

// parseValue — atomic value or compound literal.  Used both as
// an expression atom (parseUnary → parsePrimary → parseValue) and
// as the value side of a `local x = ...`.  Handles literals
// (number, string, bool, nil), tables, anonymous functions, and
// identifiers.
function parseValue(p) {
    p.skipTrivia();
    const c = p.peek();
    if (c === '"' || c === "'") return { kind: 'str', value: parseStringLit(p, c) };
    if (c === '[' && p.peek(1) === '[') return { kind: 'str', value: parseLongString(p) };
    if (c === '{') return parseTable(p);
    if (c === '-' && /[0-9]/.test(p.peek(1))) return { kind: 'num', value: parseNumber(p) };
    if (/[0-9]/.test(c)) return { kind: 'num', value: parseNumber(p) };
    // Identifier or keyword
    const id = p.parseIdent();
    if (id === 'true')  return { kind: 'bool', value: true };
    if (id === 'false') return { kind: 'bool', value: false };
    if (id === 'nil')   return { kind: 'nil' };
    if (id === 'function') return parseAnonFn(p);
    if (!id) p.fail('expected value');
    return { kind: 'ident', name: id };
}

function parseAnonFn(p) {
    p.expect('(');
    const params = [];
    p.skipTrivia();
    if (p.peek() !== ')') {
        params.push(p.parseIdent());
        while (true) {
            p.skipTrivia();
            if (p.peek() === ',') {
                p.advance();
                params.push(p.parseIdent());
            } else break;
        }
    }
    p.expect(')');
    const body = parseBlock(p);
    p.expectKeyword('end');
    return { kind: 'function', params, body };
}

function parseStringLit(p, q) {
    p.advance();
    let s = '';
    while (p.i < p.s.length && p.s[p.i] !== q) {
        const c = p.advance();
        if (c === '\\') {
            const n = p.advance();
            if (n === 'n') s += '\n';
            else if (n === 't') s += '\t';
            else if (n === 'r') s += '\r';
            else if (n === '\\') s += '\\';
            else if (n === q) s += q;
            else s += n;
        } else s += c;
    }
    if (p.s[p.i] !== q) p.fail('unterminated string');
    p.i++;
    return s;
}

function parseLongString(p) {
    p.i += 2;
    if (p.s[p.i] === '\n') p.i++;
    let s = '';
    while (p.i < p.s.length
        && !(p.s[p.i] === ']' && p.s[p.i + 1] === ']')) {
        s += p.s[p.i++];
    }
    if (p.s[p.i] !== ']') p.fail('unterminated long string');
    p.i += 2;
    return s;
}

function parseNumber(p) {
    p.skipTrivia();
    const start = p.i;
    if (p.s[p.i] === '-') p.i++;
    while (p.i < p.s.length && /[0-9.eE+-]/.test(p.s[p.i])) {
        // Stop at '+' / '-' that's a binary op rather than part of
        // exponent.  Crude: exponent only after e/E.
        if ((p.s[p.i] === '+' || p.s[p.i] === '-')
            && !'eE'.includes(p.s[p.i - 1])) break;
        p.i++;
    }
    const txt = p.s.slice(start, p.i);
    const n = Number(txt);
    if (Number.isNaN(n)) p.fail(`bad number '${txt}'`);
    return n;
}

function parseTable(p) {
    p.advance();  // {
    const entries = [];  // { key?, value } records
    let pos = 1;
    let n = 0;
    while (true) {
        p.skipTrivia();
        if (p.peek() === '}') { p.advance(); break; }
        if (p.peek() === '[') {
            p.advance();
            const k = parseExpr(p);
            p.expect(']');
            p.expect('=');
            const v = parseExpr(p);
            entries.push({ key: k, value: v });
        } else {
            // Try ident-key form (`name = value`) first.
            const save = p.i;
            const id = p.parseIdent();
            p.skipTrivia();
            if (id && p.peek() === '=' && p.peek(1) !== '=') {
                p.advance();
                const v = parseExpr(p);
                entries.push({ key: { kind: 'str', value: id }, value: v });
            } else {
                p.i = save;
                entries.push({ key: null, value: parseExpr(p), pos: pos++ });
            }
        }
        p.skipTrivia();
        if (p.peek() === ',' || p.peek() === ';') p.advance();
        else if (p.peek() === '}') { p.advance(); break; }
        n++;
        if (n > 100000) p.fail('table loop runaway');
    }
    return { kind: 'table', entries };
}

// ── Renderer: AST → JS source ─────────────────────────────────────

export function renderJsCalls(ast) {
    // Compatibility: accept either an array of legacy `{ ns, method,
    // args }` records or the new AST.
    if (Array.isArray(ast)) {
        return renderLegacyCalls(ast);
    }
    const body = ast.body || [];
    const env = collectEnvUses(body);
    const destruct = [...env].sort().join(', ');
    const lines = [`export default async function({ ${destruct} }) {`];
    // Top-level scope: declared idents start with env names + any
    // names declared at top level.  Assignments to non-declared
    // idents emit `globalThis.NAME = ...` so Lua-style implicit
    // globals work in strict-mode ES modules.
    const ctx = { scopeStack: [new Set([...env, 'globalThis'])] };
    // Pre-scan top-level locals so they're declared before use
    // in any out-of-order references.
    for (const s of body) {
        if (s.kind === 'local') ctx.scopeStack[0].add(s.name);
        if (s.kind === 'function_decl') ctx.scopeStack[0].add(s.name);
    }
    for (const s of body) lines.push('  ' + renderStmt(s, 1, ctx));
    lines.push('}');
    return lines.join('\n');
}

function inScope(ctx, name) {
    for (const s of ctx.scopeStack) if (s.has(name)) return true;
    return false;
}

function renderLegacyCalls(calls) {
    const usedNs = new Set();
    for (const { ns } of calls) usedNs.add(ns);
    const destruct = [...usedNs].sort().join(', ');
    const lines = [`export default async function({ ${destruct} }) {`];
    for (const { ns, method, args } of calls) {
        const argsJs = args.map(legacyLit).join(', ');
        lines.push(`  await ${ns}.${method}(${argsJs});`);
    }
    lines.push('}');
    return lines.join('\n');
}

function collectEnvUses(stmts) {
    const used = new Set();
    function walk(node) {
        if (!node || typeof node !== 'object') return;
        if (node.kind === 'ident'
            && (ALLOWED_NAMESPACES.has(node.name) || ALLOWED_HELPERS.has(node.name))) {
            used.add(node.name);
        }
        for (const k of Object.keys(node)) {
            const v = node[k];
            if (Array.isArray(v)) v.forEach(walk);
            else if (v && typeof v === 'object') walk(v);
        }
    }
    stmts.forEach(walk);
    return used;
}

function indent(n) { return '  '.repeat(n); }

function renderStmt(stmt, depth, ctx = null) {
    // Fallback context — used when called from places that don't
    // thread one through.  Behaves as if every ident is in scope
    // (matching pre-globalThis behavior for embedded blocks).
    if (!ctx) ctx = { scopeStack: [new Set(['globalThis'])] };
    const ind = indent(depth);
    switch (stmt.kind) {
    case 'local': {
        // Declare in current scope so subsequent references resolve.
        const scope = ctx.scopeStack[ctx.scopeStack.length - 1];
        scope.add(stmt.name);
        if (stmt.init === null) return `let ${jsName(stmt.name)};`;
        return `let ${jsName(stmt.name)} = ${renderExpr(stmt.init, depth, ctx)};`;
    }
    case 'assign': {
        // Lua implicit-global: assignment to an undeclared ident
        // creates a global.  In JS strict mode that throws — emit
        // `globalThis.NAME = ...` so the behavior is preserved.
        if (stmt.target.kind === 'ident' && !inScope(ctx, stmt.target.name)) {
            return `globalThis.${jsName(stmt.target.name)} = ${renderExpr(stmt.value, depth, ctx)};`;
        }
        return `${renderExpr(stmt.target, depth, ctx)} = ${renderExpr(stmt.value, depth, ctx)};`;
    }
    case 'multi_assign': {
        // Lua `a, b = x, y` → JS `[a, b] = [x, y]` (parallel
        // assignment via destructuring).  All RHS values are
        // evaluated before any LHS write.  Same globalThis fix
        // for undeclared ident targets.
        const lhs = stmt.targets.map(t => {
            if (t.kind === 'ident' && !inScope(ctx, t.name)) {
                return `globalThis.${jsName(t.name)}`;
            }
            return renderExpr(t, depth, ctx);
        }).join(', ');
        const rhs = stmt.values.map(v => renderExpr(v, depth, ctx)).join(', ');
        return `[${lhs}] = [${rhs}];`;
    }
    case 'for_in': {
        // Lua generic for with ipairs(t)/pairs(t): emit JS forEach.
        // Detect `ipairs(t)` or `pairs(t)` and emit indexed/entries
        // iteration.  Other iterators fall back to runtime call.
        const iter = stmt.iter;
        const lines = [];
        if (iter.kind === 'call' && iter.callee?.kind === 'ident'
            && (iter.callee.name === 'ipairs' || iter.callee.name === 'pairs')
            && iter.args.length === 1) {
            const isIpairs = iter.callee.name === 'ipairs';
            const iterTarget = renderExpr(iter.args[0], depth, ctx);
            // Push body scope with key/value vars + any locals declared
            // in the body.  Without this, refs to `i` / `v` / locals
            // inside the body emit `globalThis.i` etc., breaking parity.
            const bodyScope = new Set([stmt.keyVar, stmt.valVar]);
            for (const s of stmt.body) {
                if (s.kind === 'local') bodyScope.add(s.name);
            }
            const innerCtx = { scopeStack: [...ctx.scopeStack, bodyScope] };
            if (isIpairs) {
                // ipairs(t) iterates t[1..#t]; emit `for (let i=0; i<t.length; i++)`
                const k = jsName(stmt.keyVar);
                const v = jsName(stmt.valVar);
                lines.push(`for (let __ip_i = 0; __ip_i < ${iterTarget}.length; __ip_i++) {`);
                lines.push(`${indent(depth + 1)}const ${k} = __ip_i + 1;`);
                lines.push(`${indent(depth + 1)}const ${v} = ${iterTarget}[__ip_i];`);
                for (const s of stmt.body) lines.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, innerCtx)}`);
                lines.push(`${ind}}`);
            } else {
                // pairs(t) iterates keys.  Use Object.entries.
                const k = jsName(stmt.keyVar);
                const v = jsName(stmt.valVar);
                lines.push(`for (const [${k}, ${v}] of Object.entries(${iterTarget})) {`);
                for (const s of stmt.body) lines.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, innerCtx)}`);
                lines.push(`${ind}}`);
            }
            return lines.join('\n' + ind);
        }
        // Fallback: opaque iterator (rare).
        return `/* TODO generic for with non-pairs/ipairs iterator */`;
    }
    case 'while': {
        // Push body scope so locals stay scoped.
        const bodyScope = new Set();
        for (const s of stmt.body) {
            if (s.kind === 'local') bodyScope.add(s.name);
        }
        const innerCtx = { scopeStack: [...ctx.scopeStack, bodyScope] };
        const lines = [`while (${renderExpr(stmt.cond, depth, ctx)}) {`];
        for (const s of stmt.body) lines.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, innerCtx)}`);
        lines.push(`${ind}}`);
        return lines.join('\n' + ind);
    }
    case 'repeat': {
        // Lua: `repeat body until cond`  (exit when cond true)
        // JS:  `do { body } while (!cond)`
        // Push body scope.  Note: in Lua, the `until` cond can see
        // body locals; in JS the do-while cond can also see them
        // because the do-block is the same scope.
        const bodyScope = new Set();
        for (const s of stmt.body) {
            if (s.kind === 'local') bodyScope.add(s.name);
        }
        const innerCtx = { scopeStack: [...ctx.scopeStack, bodyScope] };
        const lines = ['do {'];
        for (const s of stmt.body) lines.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, innerCtx)}`);
        lines.push(`${ind}} while (!(${renderExpr(stmt.cond, depth, innerCtx)}));`);
        return lines.join('\n' + ind);
    }
    case 'break': return 'break;';
    case 'function_decl': {
        // Top-level `function NAME(...) ... end` — Lua sets a
        // global of that name.  In JS, expose via globalThis so
        // other modules (and the Lua bridge during the transition)
        // can call them.  The function body is rendered as an
        // arrow function (consistent with anonymous funcs).
        const params = stmt.fn.params.map(jsName).join(', ');
        // Push body scope: params + body-level locals.
        const bodyScope = new Set(stmt.fn.params);
        for (const s of stmt.fn.body) {
            if (s.kind === 'local') bodyScope.add(s.name);
        }
        const innerCtx = { scopeStack: [...ctx.scopeStack, bodyScope] };
        const lines = [`globalThis.${jsName(stmt.name)} = async (${params}) => {`];
        for (const s of stmt.fn.body) lines.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, innerCtx)}`);
        lines.push(`${ind}};`);
        return lines.join('\n' + ind);
    }
    case 'if': {
        const parts = [];
        for (let i = 0; i < stmt.branches.length; i++) {
            const br = stmt.branches[i];
            const head = (i === 0) ? 'if' : 'else if';
            // Each branch gets its own scope for body locals.
            const branchScope = new Set();
            for (const s of br.body) {
                if (s.kind === 'local') branchScope.add(s.name);
            }
            const branchCtx = { scopeStack: [...ctx.scopeStack, branchScope] };
            parts.push(`${head} (${renderExpr(br.cond, depth, ctx)}) {`);
            for (const s of br.body) parts.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, branchCtx)}`);
            parts.push(`${ind}}`);
        }
        if (stmt.else) {
            const elseScope = new Set();
            for (const s of stmt.else) {
                if (s.kind === 'local') elseScope.add(s.name);
            }
            const elseCtx = { scopeStack: [...ctx.scopeStack, elseScope] };
            parts[parts.length - 1] = `${ind}} else {`;
            for (const s of stmt.else) parts.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, elseCtx)}`);
            parts.push(`${ind}}`);
        }
        return parts.join('\n' + ind);
    }
    case 'for_num': {
        const v = jsName(stmt.var);
        const lo = renderExpr(stmt.lo, depth, ctx);
        const hi = renderExpr(stmt.hi, depth, ctx);
        const step = stmt.step ? renderExpr(stmt.step, depth, ctx) : '1';
        // The loop variable is in scope within the body.
        const innerCtx = { scopeStack: [...ctx.scopeStack, new Set([stmt.var])] };
        // Lua: for i = lo, hi [, step] do — inclusive end.  Step can
        // be negative; we use the sign at runtime via condition.
        // For the common case (no step or step >= 0) the condition is
        // i <= hi; for negative step it's i >= hi.  Emit generic form.
        const parts = [];
        parts.push(`for (let ${v} = ${lo}; (${step}) > 0 ? ${v} <= ${hi} : ${v} >= ${hi}; ${v} += ${step}) {`);
        for (const s of stmt.body) parts.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, innerCtx)}`);
        parts.push(`${ind}}`);
        return parts.join('\n' + ind);
    }
    case 'block': {
        const parts = ['{'];
        for (const s of stmt.body) parts.push(`${indent(depth + 1)}${renderStmt(s, depth + 1, ctx)}`);
        parts.push(`${ind}}`);
        return parts.join('\n' + ind);
    }
    case 'return': {
        if (stmt.value === null) return 'return;';
        return `return ${renderExpr(stmt.value, depth, ctx)};`;
    }
    case 'exprstmt': {
        // Top-level call expression: await it if it's a known async
        // dispatch (ns.method() or method() into ALLOWED_NAMESPACES).
        const e = stmt.expr;
        const needsAwait = isAsyncCall(e);
        const rendered = renderExpr(e, depth, ctx);
        return (needsAwait ? `await ${rendered};` : `${rendered};`);
    }
    default:
        return `/* TODO unhandled stmt: ${stmt.kind} */`;
    }
}

function isAsyncCall(e) {
    if (!e || typeof e !== 'object') return false;
    if (e.kind === 'call') {
        // ns.method(...) — async if ns is a known dispatch namespace
        const callee = e.callee;
        if (callee?.kind === 'field' && callee.target?.kind === 'ident'
            && ALLOWED_NAMESPACES.has(callee.target.name)) return true;
        // helper(...) — async if helper name is in known async set
        if (callee?.kind === 'ident' && ALLOWED_NAMESPACES.has(callee.name)) return true;
        return false;
    }
    if (e.kind === 'method') {
        // a:method() — async if target eventually resolves to ns
        return isAsyncCallTarget(e.target);
    }
    return false;
}

function isAsyncCallTarget(t) {
    if (!t) return false;
    if (t.kind === 'ident' && ALLOWED_NAMESPACES.has(t.name)) return true;
    if (t.kind === 'field') return isAsyncCallTarget(t.target);
    if (t.kind === 'call') return isAsyncCall(t);
    if (t.kind === 'method') return isAsyncCallTarget(t.target);
    return false;
}

function renderExpr(e, depth, ctx = null) {
    if (!ctx) ctx = { scopeStack: [new Set(['globalThis'])] };
    if (!e || typeof e !== 'object') return String(e);
    switch (e.kind) {
    case 'num':  return String(e.value);
    case 'str':  return JSON.stringify(e.value);
    case 'bool': return String(e.value);
    case 'nil':  return 'null';
    case 'ident': {
        // Look up identifier reference.  If it's not in scope, it's
        // a Lua-implicit-global read — rewrite to `globalThis.NAME`
        // so it resolves at runtime (Lua-style globals like the
        // user-defined `themerooms_generate`, `nh_lua_variables`,
        // `tutorial_enter`, etc., are exposed as globalThis props
        // by their respective hand-ports).
        if (!inScope(ctx, e.name)) {
            return `globalThis.${jsName(e.name)}`;
        }
        return jsName(e.name);
    }
    case 'paren': return `(${renderExpr(e.expr, depth, ctx)})`;
    case 'field': return `${renderExpr(e.target, depth, ctx)}.${e.name}`;
    case 'index': return `${renderExpr(e.target, depth, ctx)}[${renderExpr(e.index, depth, ctx)}]`;
    case 'call': {
        const args = e.args.map(a => renderExpr(a, depth, ctx)).join(', ');
        return `${renderExpr(e.callee, depth, ctx)}(${args})`;
    }
    case 'method': {
        const args = e.args.map(a => renderExpr(a, depth, ctx)).join(', ');
        return `${renderExpr(e.target, depth, ctx)}.${e.name}(${args})`;
    }
    case 'binop': {
        const opMap = { '~=': '!==', '==': '===', 'and': '&&', 'or': '||', '..': '+', '%': '%' };
        const jsOp = opMap[e.op] || e.op;
        return `${renderExpr(e.left, depth, ctx)} ${jsOp} ${renderExpr(e.right, depth, ctx)}`;
    }
    case 'unop': {
        if (e.op === 'not') return `!${renderExpr(e.operand, depth, ctx)}`;
        if (e.op === '#')   return `${renderExpr(e.operand, depth, ctx)}.length`;
        return `${e.op}${renderExpr(e.operand, depth, ctx)}`;
    }
    case 'function': {
        // Anonymous function: parameters are in scope inside body.
        const params = e.params.map(jsName).join(', ');
        const innerCtx = { scopeStack: [...ctx.scopeStack, new Set(e.params)] };
        // Pre-scan local decls in function body so refs resolve.
        for (const s of e.body) {
            if (s.kind === 'local') innerCtx.scopeStack[innerCtx.scopeStack.length - 1].add(s.name);
        }
        const lines = ['(async (' + params + ') => {'];
        for (const s of e.body) lines.push(`${indent(depth + 2)}${renderStmt(s, depth + 2, innerCtx)}`);
        lines.push(`${indent(depth + 1)}})`);
        return lines.join('\n');
    }
    case 'table': {
        // Mixed key-value + array.  If all entries are positional,
        // emit JS array; if all keyed, emit object; if mixed, emit
        // object with numeric keys.
        const allPos = e.entries.every(en => en.key === null);
        const allKeyed = e.entries.every(en => en.key !== null);
        if (allPos) {
            return '[' + e.entries.map(en => renderExpr(en.value, depth, ctx)).join(', ') + ']';
        }
        if (allKeyed) {
            const items = e.entries.map(en => {
                const k = en.key;
                if (k.kind === 'str' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(k.value)) {
                    return `${k.value}: ${renderExpr(en.value, depth, ctx)}`;
                }
                return `[${renderExpr(k, depth, ctx)}]: ${renderExpr(en.value, depth, ctx)}`;
            });
            return '{ ' + items.join(', ') + ' }';
        }
        // Mixed
        const items = e.entries.map(en => {
            if (en.key === null) {
                return `${en.pos}: ${renderExpr(en.value, depth, ctx)}`;
            }
            const k = en.key;
            if (k.kind === 'str' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(k.value)) {
                return `${k.value}: ${renderExpr(en.value, depth, ctx)}`;
            }
            return `[${renderExpr(k, depth, ctx)}]: ${renderExpr(en.value, depth, ctx)}`;
        });
        return '{ ' + items.join(', ') + ' }';
    }
    default:
        return `/* TODO unhandled expr: ${e.kind} */`;
    }
}

// JS-reserved-word avoidance for transpiled Lua names.
const JS_RESERVED = new Set([
    'class', 'function', 'var', 'let', 'const', 'return', 'if', 'else',
    'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
    'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'this', 'super',
    'async', 'await', 'yield', 'true', 'false', 'null', 'undefined',
    'try', 'catch', 'finally', 'throw', 'void', 'export', 'import',
    'with', 'enum', 'debugger', 'extends',
]);

function jsName(luaName) {
    if (JS_RESERVED.has(luaName)) return luaName + '_';
    return luaName;
}

// Legacy literal renderer (for the old { ns, method, args } shape).
function legacyLit(v) {
    if (v === null) return 'null';
    if (typeof v === 'boolean') return String(v);
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(legacyLit).join(', ') + ']';
    if (typeof v === 'object') {
        if (typeof v.__call === 'string' && Array.isArray(v.args)) {
            return `${v.__call}(${v.args.map(legacyLit).join(', ')})`;
        }
        const entries = Object.entries(v).map(([k, val]) => {
            const safe = /^[A-Za-z_][A-Za-z0-9_]*$/.test(k);
            return (safe ? k : JSON.stringify(k)) + ': ' + legacyLit(val);
        });
        return '{ ' + entries.join(', ') + ' }';
    }
    return String(v);
}

// ── Parser primitives ─────────────────────────────────────────────

class Parser {
    constructor(src) { this.s = src; this.i = 0; }
    atEnd() { this.skipTrivia(); return this.i >= this.s.length; }
    peek(o = 0) { return this.s[this.i + o]; }
    advance() { return this.s[this.i++]; }
    fail(msg) {
        const before = this.s.slice(Math.max(0, this.i - 30), this.i);
        const after = this.s.slice(this.i, this.i + 30);
        const line = this.s.slice(0, this.i).split('\n').length;
        throw new Error(`lua-templatic parse error at line ${line}: ${msg}\n  near: ...${before}|${after}...`);
    }
    skipTrivia() {
        while (this.i < this.s.length) {
            const c = this.s[this.i];
            if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { this.i++; continue; }
            if (c === '-' && this.s[this.i + 1] === '-') {
                if (this.s[this.i + 2] === '[' && this.s[this.i + 3] === '[') {
                    this.i += 4;
                    while (this.i < this.s.length
                        && !(this.s[this.i] === ']' && this.s[this.i + 1] === ']')) this.i++;
                    if (this.i < this.s.length) this.i += 2;
                } else {
                    while (this.i < this.s.length && this.s[this.i] !== '\n') this.i++;
                }
                continue;
            }
            break;
        }
    }
    expect(ch) {
        this.skipTrivia();
        if (this.s[this.i] !== ch) this.fail(`expected '${ch}', got '${this.s[this.i] || 'EOF'}'`);
        this.i++;
    }
    parseIdent() {
        this.skipTrivia();
        const start = this.i;
        if (!/[A-Za-z_]/.test(this.s[this.i])) return '';
        while (this.i < this.s.length && /[A-Za-z0-9_]/.test(this.s[this.i])) this.i++;
        return this.s.slice(start, this.i);
    }
    // Match a keyword at current pos (without consuming).  Requires
    // an identifier boundary after.
    matchKeyword(kw) {
        this.skipTrivia();
        const end = this.i + kw.length;
        if (this.s.slice(this.i, end) !== kw) return false;
        if (end < this.s.length && /[A-Za-z0-9_]/.test(this.s[end])) return false;
        return true;
    }
    consumeKeyword(kw) {
        if (this.matchKeyword(kw)) { this.i += kw.length; return true; }
        return false;
    }
    expectKeyword(kw) {
        if (!this.consumeKeyword(kw)) this.fail(`expected keyword '${kw}'`);
    }
}
