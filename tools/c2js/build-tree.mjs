// build-tree.mjs — multi-file translator driver.
//
// Single-file translation (`tools/c2js/build.mjs --translate-file`)
// can't resolve cross-TU references: a function declared in TU A and
// called from TU B emits as a bare reference in B's output, which
// fails at module load.  This driver runs a two-phase build:
//
//   Phase 1 (symbol scan): parse every input .c file and collect each
//     top-level declaration's name into a global symbol table mapping
//     `name` → `output JS path`.
//
//   Phase 2 (translate): walk each file with the symbol table
//     available; the translator's declRefExpr now emits an `import`
//     for any non-local name found in the table.
//
// Inputs:
//   sources       — array of absolute paths to .c source files
//   outputDir     — directory to write translated .js files into
//   parserOpts    — extra clang flags (-I dirs, -D defines)
//
// Output: array of absolute paths to the generated .js files.
//
// Naming: each `<basename>.c` produces `<basename>.js` in outputDir
// per spec §11 (one JS file per C file, same name).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseCFile } from './parser.mjs';
import { translateUnit } from './translate.mjs';
import { computeAsyncClosure, tracePath } from './async-closure.mjs';

// Walk every node in the TU and collect RecordDecls (struct
// definitions) into `out` Map<structName, fields[]>.  fields are
// `{name, type}` mirroring translate.mjs's recordDecl format.
// First-seen wins; later inclusions of the same struct are ignored.
// Also follows TypedefDecls so a typedef alias like `NhRect` resolves
// to the underlying struct's fields.
//
// Anonymous structs (no `name`) are registered under a synthetic key
// matching clang's qualType form: `__anon:FILE:LINE:COL`.  This lets
// `structRegistryKey` resolve types like `struct (anonymous struct at
// /path/foo.c:3957:14)` so positional initializers `{ "ordinary",
// OROOM }` emit `{name: ..., type: ...}` instead of bare arrays.
// File context is tracked across the walk because clang only emits
// `loc.file` when the file changes from the parent node.
function collectAllStructs(node, out, typedefAliases = new Map(), state = { currentFile: null }) {
    if (!node || typeof node !== 'object') return;
    if (node.loc?.file) state.currentFile = node.loc.file;
    if (node.kind === 'RecordDecl' && node.completeDefinition) {
        const fields = [];
        for (const c of node.inner || []) {
            if (c.kind === 'FieldDecl' && c.name) {
                fields.push({ name: c.name, type: c.type?.qualType || '' });
            }
        }
        if (node.name && !out.has(node.name)) {
            out.set(node.name, fields);
        } else if (!node.name && state.currentFile && node.loc?.line && node.loc?.col) {
            const key = `__anon:${state.currentFile}:${node.loc.line}:${node.loc.col}`;
            if (!out.has(key)) out.set(key, fields);
        }
    }
    if (node.kind === 'TypedefDecl' && node.name) {
        const t = (node.type?.qualType || '').replace(/^(const|volatile|restrict|_Atomic)\s+/, '');
        const m = t.match(/^struct\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/);
        if (m) typedefAliases.set(node.name, m[1]);
    }
    const savedFile = state.currentFile;
    for (const child of node.inner || []) collectAllStructs(child, out, typedefAliases, state);
    state.currentFile = savedFile;
}

// Tiny constant-expression evaluator over clang's AST.  Used during
// enum extraction so an enumerator written as
// `FIRST_OBJECT = LAST_GENERIC + 1` resolves to a concrete integer
// rather than falling back to (prev + 1).  Returns undefined when an
// operand can't be resolved; the caller then keeps the auto-increment
// fallback so worst-case it matches today's behavior.
function evalConstExpr(node, scope) {
    if (!node || typeof node !== 'object') return undefined;
    switch (node.kind) {
        case 'ConstantExpr':
            if (typeof node.value === 'string') return parseInt(node.value, 10);
            return evalConstExpr(node.inner?.[0], scope);
        case 'ParenExpr':
        case 'ImplicitCastExpr':
        case 'CStyleCastExpr':
            return evalConstExpr(node.inner?.[0], scope);
        case 'IntegerLiteral':
            return parseInt(node.value, 10);
        case 'CharacterLiteral':
            return typeof node.value === 'number' ? node.value : parseInt(node.value, 10);
        case 'DeclRefExpr': {
            const refName = node.referencedDecl?.name;
            if (refName && scope.has(refName)) return scope.get(refName);
            return undefined;
        }
        case 'UnaryOperator': {
            const a = evalConstExpr(node.inner?.[0], scope);
            if (a === undefined) return undefined;
            switch (node.opcode) {
                case '-': return -a;
                case '+': return +a;
                case '~': return ~a;
                case '!': return a ? 0 : 1;
                default: return undefined;
            }
        }
        case 'BinaryOperator': {
            const a = evalConstExpr(node.inner?.[0], scope);
            const b = evalConstExpr(node.inner?.[1], scope);
            if (a === undefined || b === undefined) return undefined;
            switch (node.opcode) {
                case '+': return a + b;
                case '-': return a - b;
                case '*': return a * b;
                case '/': return Math.trunc(a / b);
                case '%': return a % b;
                case '&': return a & b;
                case '|': return a | b;
                case '^': return a ^ b;
                case '<<': return a << b;
                case '>>': return a >> b;
                case '<': return a < b ? 1 : 0;
                case '<=': return a <= b ? 1 : 0;
                case '>': return a > b ? 1 : 0;
                case '>=': return a >= b ? 1 : 0;
                case '==': return a === b ? 1 : 0;
                case '!=': return a !== b ? 1 : 0;
                case '&&': return (a && b) ? 1 : 0;
                case '||': return (a || b) ? 1 : 0;
                default: return undefined;
            }
        }
        case 'ConditionalOperator': {
            const c = evalConstExpr(node.inner?.[0], scope);
            if (c === undefined) return undefined;
            return c ? evalConstExpr(node.inner?.[1], scope)
                     : evalConstExpr(node.inner?.[2], scope);
        }
        case 'UnaryExprOrTypeTraitExpr':
            // sizeof / alignof — fall through to undefined so caller
            // can decide what to do.
            return undefined;
        default:
            return undefined;
    }
}

// Walk the TU AST collecting which function parameters are scalar
// pointers — `int *`, `short *`, `long *`, `unsigned int *`, etc.
// Stored in `out` as Map<funcName, indices[]>.  Skipped if the
// function is already known (first declaration wins).  These
// parameters become out-params at translate time (ref objects) so
// the C `*p = X` idiom works.
function collectScalarPtrParams(node, out) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'FunctionDecl' && node.name) {
        if (!out.has(node.name)) {
            const indices = [];
            const params = (node.inner || []).filter((n) => n.kind === 'ParmVarDecl');
            params.forEach((p, i) => {
                if (isScalarPtrType(p.type?.qualType || '')) indices.push(i);
            });
            if (indices.length) out.set(node.name, indices);
        }
        return; // don't recurse into the body — params are at the top
    }
    for (const child of node.inner || []) collectScalarPtrParams(child, out);
}

// Detect the C casted-alias-of-void-pointer pattern:
//   void f(genericptr_t param) {
//       int *p = (int *) param;       // OR  T *p = (T *) param;
//       ...
//       *p = X;                       // writes through param's target
//   }
// When the body has this pattern with a SCALAR target type, the
// parameter is functionally a scalar-ptr out-param even though its
// declared type is `void *` / `genericptr_t`.  Widen the parameter's
// classification so callsites wrap `&caller_var` as a `{value}` box
// and the body's `*p = X` (after lvalue-aliasing in translate.mjs)
// becomes `p.value = X`.
function functionHasCastedScalarAlias(fnNode) {
    let aliasedParam = null;
    function walk(n) {
        if (!n || aliasedParam) return;
        if (n.kind === 'VarDecl' && n.name) {
            // Check that the var's type is a scalar pointer.
            const vt = (n.type?.qualType || '').replace(/^const\s+/, '').trim();
            if (isScalarPtrType(vt)) {
                // Check that the initializer is a CStyleCastExpr to that
                // type, with a parameter DeclRef inside.
                const init = (n.inner || []).find((c) =>
                    c?.kind === 'CStyleCastExpr' || c?.kind === 'ImplicitCastExpr'
                    || c?.kind === 'DeclRefExpr');
                if (init) {
                    let cur = init;
                    while (cur && (cur.kind === 'CStyleCastExpr'
                        || cur.kind === 'ImplicitCastExpr'
                        || cur.kind === 'ParenExpr')) {
                        cur = cur.inner?.[0];
                    }
                    if (cur?.kind === 'DeclRefExpr') {
                        const refName = cur.referencedDecl?.name || cur.name;
                        if (refName) aliasedParam = refName;
                    }
                }
            }
        }
        for (const c of n.inner || []) {
            walk(c);
            if (aliasedParam) return;
        }
    }
    walk(fnNode);
    return aliasedParam;
}

// Same shape as collectScalarPtrParams but for `struct T *` parameters.
// Used by translate.mjs to emit `Object.assign(p, X)` for `*p = X`
// pointer-mutation writes (the C "wholesale struct overwrite" idiom).
// Distinct from scalar because struct out-params don't need callsite
// `{value: ...}` boxing — JS objects already pass by reference.
function collectStructPtrParams(node, out) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'FunctionDecl' && node.name) {
        if (!out.has(node.name)) {
            const indices = [];
            const params = (node.inner || []).filter((n) => n.kind === 'ParmVarDecl');
            params.forEach((p, i) => {
                if (isStructPtrType(p.type?.qualType || '')) indices.push(i);
            });
            if (indices.length) out.set(node.name, indices);
        }
        return;
    }
    for (const child of node.inner || []) collectStructPtrParams(child, out);
}

// True for any `T **` (pointer-to-pointer of any type).  Used to
// identify candidate double-pointer out-params; a body-scan in
// `collectDoublePtrOutParams` further confirms the function actually
// writes `*param = X` before classifying.
function isDoublePtrType(t) {
    if (!t) return false;
    let s = t.replace(/^(const|volatile|restrict|_Atomic)\s+/, '').trim();
    if (!/\*\s*\*\s*$/.test(s)) return false;     // must end in **
    if (s.includes('(')) return false;            // exclude function pointers
    return true;
}

// Strip ParenExpr and various cast wrappers to reach the underlying
// expression node — used by the AST walker below to recognize
// `*paramName = ...` writes despite implicit/explicit casts.
function stripExprCasts(n) {
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr'
                 || n.kind === 'CStyleCastExpr')) {
        n = n.inner?.[0];
    }
    return n;
}

// True if `fnNode`'s body has any `*paramName = X` assignment.  Used
// to filter `T **` parameters: only those whose function body writes
// through them are out-params; others (e.g. read-only access to an
// array of pointers) shouldn't get callsite boxing.
function functionWritesViaParam(fnNode, paramName) {
    let found = false;
    function walk(n) {
        if (!n || found) return;
        if (n.kind === 'BinaryOperator' && n.opcode === '=' && n.inner?.length >= 1) {
            const lhs = stripExprCasts(n.inner[0]);
            if (lhs?.kind === 'UnaryOperator' && lhs.opcode === '*') {
                const target = stripExprCasts(lhs.inner?.[0]);
                if (target?.kind === 'DeclRefExpr'
                    && (target.referencedDecl?.name || target.name) === paramName) {
                    found = true;
                    return;
                }
            }
        }
        for (const c of n.inner || []) {
            walk(c);
            if (found) return;
        }
    }
    walk(fnNode);
    return found;
}

// Collect functions whose `T **` parameters are real out-params (body
// has `*param = X`).  Same shape as collectScalarPtrParams but scoped
// to double-pointer types.  These get the same `.value` boxing as
// scalar out-params: function-side `*p = X` -> `p.value = X`, callsite
// wraps `&local` as `{get value, set value}`.
// Find functions whose body has a casted-alias of a parameter that
// produces a scalar-ptr lvalue.  Add the parameter's index to the
// out-param registry.  Used to handle `void f(void *param)` callees
// that locally cast and write through param.
function collectCastedAliasParams(node, out) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'FunctionDecl' && node.name) {
        const hasBody = (node.inner || []).some((n) => n.kind === 'CompoundStmt');
        if (hasBody) {
            const aliasedName = functionHasCastedScalarAlias(node);
            if (aliasedName) {
                const params = (node.inner || []).filter((n) => n.kind === 'ParmVarDecl');
                const idx = params.findIndex((p) => p.name === aliasedName);
                if (idx >= 0) {
                    const existing = out.get(node.name) || [];
                    if (!existing.includes(idx)) {
                        const merged = [...existing, idx].sort((a, b) => a - b);
                        out.set(node.name, merged);
                    }
                }
            }
        }
        return;
    }
    for (const child of node.inner || []) collectCastedAliasParams(child, out);
}

function collectDoublePtrOutParams(node, out) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'FunctionDecl' && node.name) {
        // Only consider definitions (have a body).  Forward decls
        // get no body-scan signal so we'd misclassify them.
        const hasBody = (node.inner || []).some((n) => n.kind === 'CompoundStmt');
        if (hasBody) {
            const params = (node.inner || []).filter((n) => n.kind === 'ParmVarDecl');
            const newIndices = [];
            for (let i = 0; i < params.length; i++) {
                const p = params[i];
                if (!isDoublePtrType(p.type?.qualType || '')) continue;
                if (p.name && functionWritesViaParam(node, p.name)) {
                    newIndices.push(i);
                }
            }
            if (newIndices.length) {
                // Merge with any existing entry from collectScalarPtrParams.
                const existing = out.get(node.name) || [];
                const merged = Array.from(new Set([...existing, ...newIndices])).sort((a, b) => a - b);
                out.set(node.name, merged);
            }
        }
        return;
    }
    for (const child of node.inner || []) collectDoublePtrOutParams(child, out);
}

// True for `struct T *` (single pointer to a struct).  Excludes `**`,
// function pointers, and the scalar types in isScalarPtrType.
function isStructPtrType(t) {
    if (!t) return false;
    let s = t.replace(/^(const|volatile|restrict|_Atomic)\s+/, '').trim();
    if (!/\*\s*$/.test(s)) return false;       // must end in single *
    if (/\*\s*\*\s*$/.test(s)) return false;   // exclude **
    if (s.includes('(')) return false;         // exclude function pointers
    s = s.replace(/\*\s*$/, '').trim();
    s = s.replace(/^(const|volatile|restrict|_Atomic)\s+/, '').trim();
    return /^struct\s+\w+$/.test(s);
}

function isScalarPtrType(t) {
    if (!t) return false;
    let s = t.replace(/^(const|volatile|restrict|_Atomic)\s+/, '').trim();
    if (!/\*\s*$/.test(s)) return false;
    s = s.replace(/\*\s*$/, '').trim();
    s = s.replace(/^(const|volatile|restrict|_Atomic)\s+/, '').trim();
    s = s.replace(/^(signed|unsigned)\s+/, '').trim();
    return [
        'char', 'short', 'short int', 'int', 'long', 'long int',
        'long long', 'long long int',
        'int8_t', 'int16_t', 'int32_t', 'int64_t',
        'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
        'size_t', 'ssize_t', 'ptrdiff_t', 'boolean',
        // NetHack typedefs (from include/coord.h, integer.h, &c.)
        'schar', 'uchar', 'xint8', 'xint16', 'xint32',
        'coordxy', 'xchar', 'aligntyp',
        // d_level is INTENTIONALLY excluded — it's a struct (dnum +
        // dlevel), not a scalar.  Callees of `d_level *lev` access
        // `lev.dnum` / `lev.dlevel` directly, so the caller must pass
        // the struct itself (or its field reference), not a `.value`
        // wrapper.  Wrapping `&u.uz` as `{get value(){return game.u.uz}}`
        // causes `lev.dnum` to read `undefined` and crash downstream
        // (init_dungeons → depth() → game.dungeons[undefined].depth_start).
        // Lua C-API typedefs
        'lua_Integer', 'lua_Unsigned', 'lua_Number',
    ].includes(s);
}

// Walk every node in the TU (including header-inherited decls that
// p.decls filters out) and collect EnumConstantDecls into the given
// `out` Map<name, intValue>.  First-seen value wins so the same enum
// included via multiple headers stays consistent.
//
// Within a single EnumDecl we keep a per-enum scope of already-evaluated
// names so an enumerator like `FIRST_OBJECT = LAST_GENERIC + 1` can be
// resolved.  We also seed the scope from `out` so cross-enum
// references (rare but possible) work too.
function collectAllEnumConstants(node, out) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'EnumDecl') {
        const scope = new Map(out);
        let next = 0;
        for (const c of node.inner || []) {
            if (c.kind !== 'EnumConstantDecl') continue;
            let value = next;
            const ce = (c.inner || []).find((n) => n.kind === 'ConstantExpr');
            if (ce) {
                const evaled = evalConstExpr(ce, scope);
                if (typeof evaled === 'number' && Number.isFinite(evaled)) {
                    value = evaled;
                }
            }
            if (c.name) {
                scope.set(c.name, value);
                if (!out.has(c.name)) out.set(c.name, value);
            }
            next = value + 1;
        }
        return; // don't descend into EnumDecl's children twice
    }
    for (const child of node.inner || []) collectAllEnumConstants(child, out);
}

// Names DEFINED at the top level of a TU (not just forward-declared).
// Forward decls in one TU don't make that TU the home of the symbol;
// only definitions do.  This matches translate.mjs's
// collectLocalDeclNames distinction.
function getDeclaredNames(decl) {
    if (!decl?.name) return [];
    switch (decl.kind) {
        case 'FunctionDecl': {
            const hasBody = (decl.inner || []).some((n) => n.kind === 'CompoundStmt');
            return hasBody ? [decl.name] : [];
        }
        case 'VarDecl':
            // `extern` declarations don't define the symbol — skip them.
            // `static` at file scope means internal linkage (file-local
            // in C) — these are NOT cross-TU symbols, so we must NOT
            // add them to the cross-TU resolver's symbolTable.  Without
            // this guard, references to a same-named local elsewhere
            // (e.g., mondata.c's local-static `names` array inside
            // m_monnam) would mis-resolve to invent.c's file-static
            // `names`, producing an incorrect cross-TU import that
            // throws at module-load (the importer demands an export
            // the source doesn't expose, since file-statics aren't
            // exported either).
            if (decl.storageClass === 'extern') return [];
            if (decl.storageClass === 'static') return [];
            return [decl.name];
        case 'TypedefDecl':
        case 'EnumDecl':
            return [decl.name];
        case 'RecordDecl':
            // Struct/union tags (e.g., `struct propname { ... }`)
            // live in C's tag namespace and aren't exported as
            // JS values.  Including them in symbolTable causes
            // false matches when another TU happens to use the
            // same identifier as a LOCAL variable name (e.g.,
            // wizcmds.c's `const char *propname;` local mis-
            // resolved to timeout.c's `static const struct
            // propname { ... } propertynames[]` tag).
            // Translator collects struct definitions separately
            // via collectAllStructs into ctx.structs.
            return [];
        default:
            return [];
    }
}

// Identify VarDecls that translate as `game.X = init` (mutable, non-
// extern, non-const).  Returns true if `decl` is a global mutable
// definition that translate.mjs would hoist onto `game`.  Bucket
// names (ga/gb/..) are also game-hoisted but get the Object.assign
// treatment instead — we include them in the same set so cross-TU
// references collapse to `game` regardless of which form was emitted.
function isGameHoisted(decl) {
    if (decl?.kind !== 'VarDecl') return false;
    if (decl.storageClass === 'extern') return false;
    const t = decl.type?.qualType || '';
    if (/\bconst\b/.test(t)) return false;
    return true;
}

export function buildTree({ sources, outputDir, parserOpts = {} }) {
    if (!sources?.length) throw new Error('buildTree: sources required');
    mkdirSync(outputDir, { recursive: true });

    // Phase 1: parse all sources, build the cross-TU symbol table
    // (name → output JS path) AND the tree-wide game-hoisted-names
    // set (names of mutable globals that translate.mjs places on
    // `game`).  Both are passed to every translateUnit call so
    // declRefExpr can resolve any name correctly.
    const parsed = new Map();
    const symbolTable = new Map();
    const gameHoistedNames = new Set();
    // Header-defined enum constants (e.g., WEAPON_CLASS, S_DOOR).  We
    // pull these from the FULL TU AST of each parsed file (not just
    // file-local decls) so they're available to any TU that
    // references them, then emit a shared `nh-constants.js` module.
    const headerEnumConstants = new Map();
    const headerConstantsPath = join(outputDir, 'nh-constants.js');
    // Header-defined structs (e.g., `struct you`).  Collected the same
    // way so any TU's globalVarDecl can zero-init a struct global
    // whose definition lives in a header.
    const headerStructs = new Map();
    const headerTypedefAliases = new Map();
    // For each function (defined or forward-declared anywhere in the
    // tree), the indices of parameters whose declared type is a
    // pointer to a scalar — `int *`, `short *`, `unsigned long *`, &c.
    // These are the canonical NetHack out-parameter idiom (e.g.,
    // `obj_shuffle_range(int otyp, int *lo_p, int *hi_p)`).  At call
    // sites the translator wraps `&local` args as ref objects; inside
    // the body it rewrites `*param = X` to `param.value = X`.
    const functionScalarPtrParams = new Map();
    // Same shape, but for `struct T *` parameters.  Distinct from
    // scalar because emission rule and callsite handling differ:
    // function-side `*p = X` becomes `Object.assign(p, X)`, and
    // callsites need no `{value}` boxing (JS objects already pass
    // by reference).  See translate.mjs binaryOp().
    const functionStructPtrParams = new Map();
    for (const cFile of sources) {
        const p = parseCFile(cFile, parserOpts);
        parsed.set(cFile, p);
        const outPath = join(outputDir, basename(cFile, '.c') + '.js');
        // Phase 1a: header enum constants and structs from the full TU.
        collectAllEnumConstants(p.tu, headerEnumConstants);
        collectAllStructs(p.tu, headerStructs, headerTypedefAliases);
        // Phase 1b: function signatures (parameter types) — we want
        // every FunctionDecl (defined or just-declared) to record
        // which parameter positions are scalar-pointer outparams,
        // and which are struct-pointer outparams.
        collectScalarPtrParams(p.tu, functionScalarPtrParams);
        collectStructPtrParams(p.tu, functionStructPtrParams);
        // Double-pointer out-params (T **) — body-scan filtered to
        // exclude `T **` used for read-only array access.  Merged into
        // functionScalarPtrParams below since both use the same `.value`
        // boxing mechanism downstream.
        collectDoublePtrOutParams(p.tu, functionScalarPtrParams);
        // Casted-alias of void-pointer (genericptr_t) — when a function
        // body locally casts a `void *` parameter to a scalar pointer
        // and writes through it, the parameter is functionally a scalar
        // out-param.  Widen its classification so callers box `&local`.
        collectCastedAliasParams(p.tu, functionScalarPtrParams);
        for (const decl of p.decls) {
            for (const name of getDeclaredNames(decl)) {
                // First definition wins.  In ill-formed C this would
                // be a redeclaration; here we just take the earlier
                // file's claim and keep going.
                if (!symbolTable.has(name)) symbolTable.set(name, outPath);
            }
            if (isGameHoisted(decl) && decl.name) {
                gameHoistedNames.add(decl.name);
                // game-hoisted names don't need a JS module import
                // (they're accessed via `game.X`).  Remove from
                // symbolTable so we don't accidentally also emit an
                // import for them.
                symbolTable.delete(decl.name);
            }
        }
        // EnumConstantDecls live nested inside EnumDecls; pull them up
        // so they're discoverable cross-TU like global enum constants
        // typically are.
        for (const decl of p.decls) {
            if (decl.kind !== 'EnumDecl') continue;
            for (const c of decl.inner || []) {
                if (c.kind === 'EnumConstantDecl' && c.name && !symbolTable.has(c.name)) {
                    symbolTable.set(c.name, outPath);
                }
            }
        }
    }

    // Phase 1c: async-function closure.  Walk every TU's AST and
    // compute the set of function names that transitively reach the
    // async seed (`(game.windowprocs.win_nhgetch)()`).  Translator
    // consumes this via `opts.crossTuAsync` to decide which
    // FunctionDecls become `async function` and which CallExprs need
    // `await`.  See tools/c2js/async-closure.mjs.
    const trace = !!(process.env.NH_DUMP_ASYNC || process.env.NH_TRACE_ASYNC);
    const asyncFunctions = computeAsyncClosure(parsed, { trace });
    if (process.env.NH_DUMP_ASYNC) {
        const list = [...asyncFunctions].sort();
        process.stderr.write(`async-closure: ${list.length} functions\n`);
        for (const n of list) process.stderr.write(`  ${n}\n`);
    }
    if (process.env.NH_TRACE_ASYNC) {
        const names = process.env.NH_TRACE_ASYNC.split(',').map((s) => s.trim());
        for (const n of names) {
            if (!asyncFunctions.has(n)) {
                process.stderr.write(`async-trace ${n}: NOT in closure\n`);
                continue;
            }
            const path = tracePath(asyncFunctions, n);
            process.stderr.write(`async-trace ${n}: ${path.join(' → ')}\n`);
        }
    }

    // Emit the shared header-constants module.  Any enum constant
    // already claimed by a translator-owned file (i.e., already in
    // symbolTable from p.decls) keeps that file as its home; only
    // names not yet in symbolTable point to nh-constants.js.
    {
        const lines = ['// Header-defined enum constants extracted from C headers.'];
        const namesForModule = [];
        for (const [name, value] of headerEnumConstants) {
            if (!symbolTable.has(name) && !gameHoistedNames.has(name)) {
                namesForModule.push(name);
                lines.push(`export const ${name} = ${value};`);
                symbolTable.set(name, headerConstantsPath);
            }
        }
        writeFileSync(headerConstantsPath, lines.join('\n') + '\n');
    }

    // Phase 2: translate each file with the cross-TU info threaded.
    const outputs = [];
    // Accumulator for inside-body comments deferred to post-patch
    // injection (§23.122).  Each translateUnit call drains its
    // collected list here; written to a sidecar at the end of phase 2.
    const allPendingComments = [];
    for (const [cFile, p] of parsed) {
        const outPath = join(outputDir, basename(cFile, '.c') + '.js');
        const opts = {
            outputPath: outPath,
            crossTu: symbolTable,
            crossTuGameHoisted: gameHoistedNames,
            // Tree-wide struct definitions and typedef aliases pulled
            // from every TU's full AST.  translate.mjs's Ctx merges
            // these into ctx.structs as a fallback so zero-init for
            // struct globals defined elsewhere still emits an object
            // literal instead of `0`.
            crossTuStructs: headerStructs,
            crossTuTypedefAliases: headerTypedefAliases,
            // For each function, the parameter indices that are
            // scalar pointers (int *, short *, etc.).  At call sites
            // the translator wraps `&local` args as ref objects so
            // C's `*p = X` outparam idiom works in JS.
            crossTuScalarPtrParams: functionScalarPtrParams,
            // Same shape, for `struct T *` params.  Function-side
            // emits `Object.assign(p, X)` for `*p = X`; callsite
            // passes the struct value directly (no boxing — JS
            // objects already pass by reference).
            crossTuStructPtrParams: functionStructPtrParams,
            // Set of function names that transitively reach the
            // async seed (`win_nhgetch`).  See phase 1c above.
            // The translator does NOT emit `async`/`await` itself;
            // those keywords are injected by a post-process step in
            // build-engine.mjs that consumes this same set.  Keeping
            // the data threaded here so future translator-side uses
            // (e.g., async-aware optimizations) can read it.
            crossTuAsync: asyncFunctions,
        };
        const js = translateUnit({ ...p, opts });
        writeFileSync(outPath, js);
        outputs.push(outPath);
        // Drain inside-body comment captures into the shared list
        // (§23.122 post-patch injection).  Per-file entries get the
        // basename as their grouping key so build-engine.mjs can scan
        // each translated/*.js once.
        const pending = opts.collected?.pendingInsideComments || [];
        for (const e of pending) {
            allPendingComments.push({
                file: basename(e.outputPath ?? outPath),
                anchor: e.anchor,
                content: e.content,
            });
        }
    }
    // Write the async-closure manifest alongside the translated files
    // so the build-engine post-process injector (and any downstream
    // tool) can consume it without re-running the closure pass.  JSON
    // for easy inspection and language-agnostic reading.
    const asyncManifestPath = join(outputDir, '__async_closure.json');
    writeFileSync(
        asyncManifestPath,
        JSON.stringify([...asyncFunctions].sort(), null, 2) + '\n'
    );
    // Write the pending-inside-body-comments sidecar (§23.122).
    // build-engine.mjs reads this AFTER running all patches and
    // injects each comment immediately before its anchor line.
    // Format: array of { file, anchor, content } entries, sorted by
    // file then by order-emitted so a future deterministic-order
    // requirement is already satisfied.
    const commentsManifestPath = join(outputDir, '__pending_inside_comments.json');
    writeFileSync(
        commentsManifestPath,
        JSON.stringify(allPendingComments, null, 2) + '\n'
    );
    return outputs;
}
