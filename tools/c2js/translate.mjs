// translate.mjs — AST walker → JS emitter.
//
// Phase 1 scope: integer arithmetic + control flow + function defs +
// calls + static globals + printf.  Just enough to round-trip the
// 01-arith synthetic test.  Each new test that introduces a new C
// construct requires adding its handler here.
//
// The walker is dispatched on AST node `kind`.  Each handler returns a
// JS string fragment.  Statements end in `\n`; expressions don't.  The
// result is then run through a tiny pretty-printer that fixes
// indentation.
//
// Tier classification, manifest updates, and conformance hookup live
// in build.mjs (the caller); this file only emits JS source.

import { commentsBefore } from './parser.mjs';
import {
    JS_RESERVED_RENAMES, BANNED_CALLS, runtimeDir, jsDir, projectRoot,
    GLOBAL_BUCKETS, EXTERNAL_SYMBOLS, HAND_PORTED_FUNCTIONS,
    STRING_MODE_FILES,
} from './c2js.config.mjs';
import { relative as pathRelative, dirname as pathDirname, resolve as pathResolve, basename as pathBasename } from 'node:path';
import { readFileSync as nodeReadFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GLOBAL_BUCKETS_SET = new Set(GLOBAL_BUCKETS);

/* §23.227 — Phase 1/2 string-mode dispatch.
   - Env var NH_STRING_MODE forces string-mode for the whole TU set
     (used by selective regen during Phase 2 batch trials).
   - Per-file STRING_MODE_FILES (c2js.config.mjs) marks TUs that have
     already migrated; future builds preserve their string-mode emit
     without needing the env var set.
   Call inStringMode(ctx) from any emit recognizer that needs the gate.
   See docs/STRING_MIGRATION.md for the full plan and phase ordering. */
const STRING_MODE_ENV = !!(typeof process !== 'undefined' && process.env && process.env.NH_STRING_MODE);
function inStringMode(ctx) {
    if (STRING_MODE_ENV) return true;
    if (ctx && ctx.cFile && STRING_MODE_FILES.has(ctx.cFile)) return true;
    return false;
}

// Per-site recognizer allowlist.  Loaded once at module init from
// `recognizer-allowlist.json`.  Categories map to Sets of "file:fn"
// keys.  See the JSON file for category definitions.  Used by
// recognizers that have a global safety check too strict for a few
// known-safe sites — adding a (file, function) to the relevant
// category enables the relaxation only for that site, avoiding the
// global-relaxation dead end documented in LEARNINGS §23.126c.
const RECOGNIZER_ALLOWLIST = (() => {
    const here = pathDirname(fileURLToPath(import.meta.url));
    const path = pathResolve(here, 'recognizer-allowlist.json');
    let json;
    try {
        json = JSON.parse(nodeReadFileSync(path, 'utf8'));
    } catch {
        return new Map();
    }
    const out = new Map();
    for (const [category, body] of Object.entries(json)) {
        if (category.startsWith('_')) continue;
        const set = new Set();
        for (const site of body?.sites || []) {
            if (site?.file && site?.function) {
                set.add(`${site.file}:${site.function}`);
            }
        }
        out.set(category, set);
    }
    return out;
})();

// True iff (cFile basename, fnName) is enabled for the named
// recognizer-relaxation category.  Returns false for any unknown
// category, missing file, or unlisted function.
function isInRecognizerAllowlist(category, cFile, fnName) {
    if (!cFile || !fnName) return false;
    const set = RECOGNIZER_ALLOWLIST.get(category);
    if (!set) return false;
    return set.has(`${cFile}:${fnName}`);
}

// ── Walker context ──────────────────────────────────────────────

class Ctx {
    constructor({ source, comments, importNeeds = new Set(), opts = {} } = {}) {
        this.source = source;
        this.comments = comments;
        this.importNeeds = importNeeds;     // set of strings like 'printf'
        this.opts = opts;
        this.indent = 0;
        this.emittedComments = new Set();   // by start offset
        // struct name → array of field names (in declaration order),
        // populated by RecordDecl handlers.  Used to zero-init local
        // variables of struct type.  Spec §3 says the three entity
        // structs (monst/obj/rm) get class emission; for now (Phase 1)
        // every struct goes the plain-object path.  Phase 4 adds the
        // entity-class branch.
        this.structs = new Map();
        // label declId → label name.  Built per-function by
        // collectLabels() so GotoStmt can resolve targetLabelDeclId
        // back to a JS-emittable identifier.
        this.labelById = new Map();
        // Set of names declared at the top level of THIS translation
        // unit (functions, globals, enum constants, struct/typedef
        // names).  Built before walking decls.  Any DeclRefExpr to a
        // name NOT in this set is "external" — we look it up in
        // EXTERNAL_SYMBOLS to emit an import, or leave it bare and
        // let the conformance pass / runtime error surface the gap.
        this.localNames = new Set();
        // External-symbol references actually seen during translation,
        // keyed by name → registry-path-string.  Drained into the
        // import header after the walk.
        this.externalRefs = new Map();
        // Cross-TU references (declared in another file we're
        // translating in the same build-tree pass).  keyed by name →
        // absolute output JS path.  Resolved to a relative import in
        // buildImportHeader.
        this.crossTuRefs = new Map();
        // File-static or global mutable names hoisted onto `game` per
        // spec §2.  Subsequent DeclRefExpr references to these names
        // emit `game.X` instead of the bare identifier.  Populated by
        // globalVarDecl.
        this.gameHoistedNames = new Set();
        // Labels that ARE wrapped in a labeled block (so `break LABEL`
        // is bindable from inside).  Added by compoundStmt's
        // segment-with-labels logic; consulted by gotoStmt.
        this.reachableLabels = new Set();
        // Labels that wrap a `LABEL: while (true) { ... }` back-jump
        // loop.  A goto to one of these names emits `continue LABEL`
        // (re-enter the loop) instead of `break LABEL` (exit a labeled
        // block).  Populated by compoundStmt's pure-back-jump path.
        this.backJumpLabels = new Set();
        // Labels that are rewritten as forward-goto flags.  Map from
        // jsName → flag variable name (e.g. `skip` → `__goto_skip`).
        // A goto to one of these names emits `<flag> = (1);` instead
        // of `break LABEL` or TODO.  Populated by compoundStmt's
        // forward-into-if path (A4 recognizer).
        this.forwardGotoFlags = new Map();
        // Stack of enclosing breakable constructs, innermost last.
        // Frames: { kind: 'loop'|'switch'|'synthetic', labelable,
        // label, outerLabel }.  Loop/switch emitters push real
        // frames; the back-jump label hoist (emitPureBackJump)
        // pushes 'synthetic' frames so bare continue/break that
        // bound to the ENCLOSING C loop can be re-pointed at it.
        // C labels are transparent to break/continue; the synthetic
        // `LABEL: while (true)` wrappers are NOT — invent.c getobj's
        // redo_menu region spun forever on "You don't have that
        // object." because its `continue` re-entered the synthetic
        // loop instead of re-reading the prompt (seed0101 OOM).
        this.breakFrames = [];
        // Function-scope `char *p = buf;` walks where every use of p
        // is `*p = X` or `*p++ = X`.  Map from p's name → {bufRef,
        // idxName}.  Replaces p with an index variable + indexed
        // access on buf.  Populated by analyzeCharBufferCandidates()
        // at functionDecl entry; consulted by declStmt (to emit
        // `let __nh_p_idx = 0;` instead of `let p = buf;`) and
        // binaryOp (to emit `buf[idx] = X` / `buf[idx++] = X`).
        this.charBufferRewrites = new Map();
        // `*p = '\0'` BinaryOp AST nodes whose enclosing `if ((p =
        // strchr_family(buf, X)) != NULL)` cond has been verified
        // safe at function-level: p has no position-dependent uses
        // (no p++, no *p reads, no func(p) calls, etc.) elsewhere.
        // The rewrite happens at the WRITE stmt (not at the IfStmt
        // level) so multi-stmt then-bodies with other code alongside
        // the truncate are absorbed too.
        // Map<BinaryOp(=) node ref → {bufNode, charNode, kind}>.
        this.strchrTruncates = new Map();
        // Function-local `static` VarDecls in the currently-emitting
        // function.  C semantics: a function-local `static T x = init;`
        // is initialized once at module load and persists across calls.
        // The translator hoists each such decl to a module-scope
        // `let __<fn>_<name> = init;` declaration emitted just before
        // the function, and rewrites every reference to `x` inside the
        // body to the hoisted name.  Set per-function by functionDecl;
        // consulted by declStmt (to suppress local emission) and
        // declRefExpr (to substitute the hoisted name).
        // Map<varName, hoistedName>.
        this.localStatics = new Map();
        // Set of names declared as function-local variables (auto AND
        // static, plus parameters) inside the currently-emitting
        // function.  Used by declRefExpr to short-circuit the cross-TU
        // `game.X` rewrite when a local shadows a file-static name from
        // another TU (e.g. hack.c's `in_rooms` has `int step` while
        // vision.c has `static int step` — without this set, refs to
        // the local would emit `game.step`).
        this.functionLocals = new Set();
        // Inside-function-body comments that the translator can't emit
        // inline without perturbing ~12+ verbatim patchFile patterns
        // (LEARNINGS §23.120).  Collected by compoundStmt's no-label
        // path: for each child stmt, the comments that fall in the
        // gap between the previous stmt's end and THIS stmt's begin
        // are pushed here with the stmt's first-line JS as the
        // injection anchor.  Drained by translateUnit's caller, then
        // written to a sidecar manifest that build-engine.mjs reads
        // AFTER all patches are applied (post-patch comment injection
        // — see also the async-emit refactor §23.117).
        this.pendingInsideComments = [];
        // Basename of the C file being translated (e.g. "coloratt.c").
        // Set by translateUnit from opts.outputPath.  Consulted by
        // isInRecognizerAllowlist along with currentFnName for per-
        // site recognizer relaxations.
        this.cFile = null;
        // Name of the C function currently being emitted.  Set by
        // functionDecl on entry, restored on exit.  Consulted with
        // ctx.cFile for per-site allowlist lookups.
        this.currentFnName = null;
        // Set of pPath strings (e.g. "amp", "d.p") that are bound to
        // a strchr-family return value inside the currently-emitting
        // function AND whose enclosing function is in the
        // strchr_truncate_p_incr allowlist.  Consulted by
        // unaryOperator emit to rewrite `p++` / `p--` as the
        // string-slice equivalent (JS-string-semantics safe per the
        // allowlist's safety claim).  Populated per-function by
        // analyzeStrchrTruncates when isInRecognizerAllowlist returns
        // true for the current function.
        this.strchrBoundPaths = new Set();
        // Local-variable alias classifier output, populated per-
        // function by analyzeLocalAliases.  Maps a char-pointer local
        // var name → {init, classification, hasIncr, hasRebind,
        // hasEscape, refCount}.  Classification is one of:
        //   'unmoved' — p is never modified post-decl (no p++,
        //               no p = ..., no func(p)); read-only uses
        //               like *p, p == NULL, p[i], comparison
        //   'walker'  — p uses ++ or -- somewhere (could also have
        //               reads); used by the eos-walker recognizer
        //   'rebound' — p is reassigned (= rhs) at least once
        //               post-decl (could also have walker uses)
        //   'escape'  — p is passed to a function as an arg (the
        //               function might mutate p indirectly via
        //               returned pointer arithmetic or similar)
        // Consumers (eos-walker, linked-list iterator, etc.) read
        // this map to decide what emit rule applies.  This pass
        // does NOT alter emit on its own; it's pure classification.
        this.localAliases = new Map();
        // Eos-walker recognizer output: locals matching
        // `char *bp = eos(buf);` where bp's classification is 'walker'
        // (no rebind, no escape).  Map<name, {bufExpr, declNode}>.
        // Populated by analyzeEosWalkers after analyzeLocalAliases.
        // Consumed by declStmt (to drop bp's let-decl), compoundStmt
        // (to drop statement-form bp++ / *bp = NUL), and binaryOp
        // (to rewrite `*bp = X` → `bufJs += String.fromCharCode(X)`
        // for non-NUL X).
        this.eosWalkers = new Map();
        // Linked-list iterator locals: `struct T **var;` whose body
        // uses match the strict C "list walk via pointer-to-pointer"
        // pattern.  In JS we model var as a pair of variables
        // (<name>__parent, <name>__field) that track "var is the
        // address of <parent>.<field>".  Map<name, {declNode}>.
        // Populated by analyzeLinkedListIterators after
        // analyzeLocalAliases (using its rebound/escape info to
        // sanity-check) and read by declStmt (emit pair-of-lets),
        // binaryOp (rewrite var = &Expr.field, *var = X, and
        // var = &(*var)->field), and unaryOp (rewrite *var as
        // <name>__parent[<name>__field]).  See verifyLLIterPattern
        // for the strict use-set requirement.
        this.linkedListIterators = new Map();
    }
    pad() { return '    '.repeat(this.indent); }
}

// Pre-pass: walk a function's body collecting LabelStmt declIds → names.
// GotoStmt's `targetLabelDeclId` is an opaque pointer-string; we map it
// back to the source name.
function collectLabels(node, ctx) {
    if (!node) return;
    if (node.kind === 'LabelStmt' && node.declId && node.name) {
        ctx.labelById.set(node.declId, node.name);
    }
    for (const c of node.inner || []) collectLabels(c, ctx);
}

// Pre-pass: walk a function body collecting names of every function-local
// VarDecl (auto AND static).  Used by declRefExpr to short-circuit the
// cross-TU `game.X` rewrite when a local declaration shadows a file-static
// name from another TU — e.g. hack.c's `in_rooms` has a local `int step`
// while vision.c has a file-static `static int step`; without this check,
// references to the local would falsely emit `game.step`.
function collectLocalVarNames(node, into) {
    if (!node) return;
    if (node.kind === 'FunctionDecl') return;
    if ((node.kind === 'VarDecl' || node.kind === 'ParmVarDecl') && node.name) {
        into.add(node.name);
    }
    for (const c of node.inner || []) collectLocalVarNames(c, into);
}

// Pre-pass: walk a function body collecting every function-local `static`
// VarDecl.  Each one needs hoisting to module scope so cross-call
// persistence works in JS (a per-call `let x = init;` resets every call).
// Pushed entries are { node, hoistedName } where `node` is the original
// VarDecl.  `nestedFnSeen` prevents descending into nested function defs
// (a gcc extension; unused by NetHack but cheap to guard).
function collectLocalStatics(node, into, fnName) {
    if (!node) return;
    if (node.kind === 'FunctionDecl') return;
    if (node.kind === 'VarDecl' && node.storageClass === 'static' && node.name) {
        into.push({ node, hoistedName: `__${fnName}_${node.name}` });
        // Don't recurse into the initializer's children — they're
        // constant expressions and will be emitted at hoist time.
        return;
    }
    for (const c of node.inner || []) collectLocalStatics(c, into, fnName);
}

// Pre-pass: collect every top-level declaration name DEFINED in the
// TU.  Forward declarations (extern functions and `extern T x;`
// variables) are NOT in localNames — they're cross-TU references and
// must resolve to an import or registry entry.
//
// Without this distinction, `extern int add(int, int);` in main.c
// would shadow the cross-TU symbol-table entry for `add` (defined in
// helpers.c) and main.c would emit a bare `add(...)` call rather than
// importing.
function collectLocalDeclNames(node, set) {
    if (!node || !node.name) return;
    switch (node.kind) {
        case 'FunctionDecl': {
            // Only count function definitions, not forward decls.
            // Definitions have a CompoundStmt child; forward decls
            // do not.
            const hasBody = (node.inner || []).some((n) => n.kind === 'CompoundStmt');
            if (hasBody) set.add(node.name);
            break;
        }
        case 'VarDecl': {
            // `extern T x;` (no `static`, no initializer) is a forward
            // declaration — do not treat as local.
            if (node.storageClass !== 'extern') set.add(node.name);
            break;
        }
        case 'TypedefDecl':
        case 'RecordDecl':
        case 'EnumDecl':
            set.add(node.name);
            break;
        case 'EnumConstantDecl':
            set.add(node.name);
            break;
    }
    // Pull EnumConstantDecls up so their names are queryable
    // alongside top-level identifiers.
    for (const c of node.inner || []) {
        if (c && c.kind === 'EnumConstantDecl' && c.name) set.add(c.name);
    }
}

// Render a top-level comment verbatim (block or line).  Spec §11
// requires byte-identical comment migration: we emit the raw C comment
// text (including its `/* */` or `//` markers) into the JS, since
// JS accepts the exact same comment syntax.
function translateLeadingComment(c) {
    return c.text;
}

// ── Inside-body comment capture helper (§23.122) ────────────────
//
// Used by all compoundStmt walk paths (no-label, pure-back-jump,
// forward-into-if, mixed-two-label) to record inside-body comments
// to `ctx.pendingInsideComments` keyed by an anchor — the first 1-2
// non-blank lines of the stmt the comment was leading.  The
// build-engine post-patch injector consumes the sidecar manifest
// and re-injects each comment before its anchor line.
//
// The MAX_GAP=32 defends against macro-expanded compound bodies
// whose clang range.end.line is hundred(s) of lines wrong
// (NetHack's `nh_snprintf` / `Concat*()` do-while macros).
const INSIDE_COMMENT_MAX_GAP = 32;

function insideCommentAnchorOf(js) {
    if (!js) return null;
    const nonblank = js.split('\n').filter((ln) => ln.trim().length > 0);
    if (nonblank.length === 0) return null;
    const first = nonblank[0];
    // Long first lines almost never collide; otherwise stitch the
    // second non-blank line for disambiguation.
    if (first.trim().length >= 40 || nonblank.length === 1) return first;
    return first + '\n' + nonblank[1];
}

// Returns the new prevEndLine after recording any captures.
// Callers use the returned value as the start of the next gap.
//
// When `anchorJs` is empty / too short (e.g. the stmt produced no
// JS output — function-local statics get hoisted to module scope,
// leaving no in-body emit), prevEndLine is returned UNCHANGED so
// the next non-empty stmt's anchor picks up the deferred comments.
//
// `prevEndLine` may be `null` to mean "no prior stmt seen yet" —
// happens at the start of a compound when the compound's
// `range.begin.line` is undefined (clang sometimes omits range
// info on nested CompoundStmts).  In that case we look back up to
// INSIDE_COMMENT_MAX_GAP lines before this stmt to catch leading
// comments at the top of the compound body.
function captureInsideComments(ctx, prevEndLine, child, anchorJs) {
    if (!child) return prevEndLine;
    const childStartLine = child.range?.begin?.line ?? child.loc?.line ?? null;
    const childEndLine = child.range?.end?.line ?? childStartLine ?? prevEndLine;
    if (childStartLine == null) return childEndLine;
    const anchor = insideCommentAnchorOf(anchorJs);
    // No usable anchor — defer comments to the next non-empty stmt.
    if (!anchor || anchor.trim().length < 6) return prevEndLine;
    // Effective lower bound: if no prior stmt was tracked, look back
    // up to MAX_GAP lines before this stmt.  This catches leading
    // comments at the top of a compound body whose CompoundStmt
    // range.begin.line clang reported as undefined.
    const lowerBound = prevEndLine == null || prevEndLine < 0
        ? childStartLine - INSIDE_COMMENT_MAX_GAP
        : prevEndLine;
    for (const c of ctx.comments || []) {
        // Include `c.line == prevEndLine` so end-of-line trailing
        // comments on the previous stmt (e.g.
        //   foo(); /* note */
        //   bar();
        // ) get captured.  They're conceptually "after foo" but we
        // anchor them on `bar` for injection — spec §11 only checks
        // presence, not position.  emittedComments dedup prevents
        // a comment from being captured twice across iterations.
        //
        // Include `c.line == childStartLine` so trailing comments on
        // the stmt's own opening line (e.g.
        //   if (cond) /* note */ { body }
        // ) get captured.  They're conceptually "part of this stmt"
        // and anchor on the stmt itself — same presence-not-position
        // rationale as above.
        if (c.line < lowerBound) continue;
        if (c.line > childStartLine) break;
        if (ctx.emittedComments.has(c.start)) continue;
        // Spec §11 only checks comments > 30 chars; shorter ones
        // can drift without causing a conformance failure.
        if (c.text.length < 30) continue;
        // Per-comment MAX_GAP defense: skip comments more than
        // MAX_GAP lines before the anchor stmt.  Bounds against
        // macro-expansion outliers without losing the leading-comment
        // window at the start of a compound.
        if (childStartLine - c.line > INSIDE_COMMENT_MAX_GAP) continue;
        ctx.pendingInsideComments.push({
            outputPath: ctx.opts?.outputPath,
            anchor,
            content: c.text,
        });
        ctx.emittedComments.add(c.start);
    }
    return childEndLine;
}

// ── Top-level entry ─────────────────────────────────────────────

export function translateUnit({ decls, comments, source, opts = {}, ...rest }) {
    // ignore stray properties from parseCFile (tu, path)
    void rest;
    const ctx = new Ctx({ source, comments, opts });
    // Derive C basename from outputPath ("js/translated/coloratt.js" →
    // "coloratt.c").  Used by isInRecognizerAllowlist; no fallback
    // needed since translateUnit always runs with an outputPath in
    // production (the test harness paths still produce valid basenames).
    if (opts.outputPath) {
        const base = pathBasename(opts.outputPath, '.js');
        ctx.cFile = `${base}.c`;
    }

    // Seed the struct registry with tree-wide definitions pulled from
    // every TU's full AST (build-tree.mjs's collectAllStructs).
    // File-local RecordDecls walked below will overwrite these — but
    // only if the name matches and the TU re-defines the struct.
    if (opts.crossTuStructs) {
        for (const [name, fields] of opts.crossTuStructs) {
            if (!ctx.structs.has(name)) ctx.structs.set(name, fields);
        }
    }
    if (opts.crossTuTypedefAliases) {
        for (const [alias, structName] of opts.crossTuTypedefAliases) {
            if (!ctx.structs.has(alias) && ctx.structs.has(structName)) {
                ctx.structs.set(alias, ctx.structs.get(structName));
            }
        }
    }

    // Pre-pass: collect names declared in this TU.  Any DeclRefExpr
    // whose referenced name isn't in this set is external (declared in
    // a header / another TU).
    for (const decl of decls) {
        collectLocalDeclNames(decl, ctx.localNames);
    }

    const lines = [];

    // File-header comments: any comments BEFORE the first declaration's
    // line.  `commentsBefore`'s default `gap=1` doesn't catch these
    // because there are usually many blank lines (or other comments)
    // between the file header and the first decl.  Spec §11 requires
    // them preserved.  Collected separately from `lines` because the
    // import header gets PREPENDED to `lines` below; file-header
    // comments need to come BEFORE the imports in the final output.
    const headerComments = [];
    if (comments && comments.length > 0 && decls.length > 0) {
        const firstDeclLine = decls[0].loc?.line ?? Infinity;
        for (const c of comments) {
            if (c.line >= firstDeclLine) break;
            if (!ctx.emittedComments.has(c.start)) {
                headerComments.push(translateLeadingComment(c));
                ctx.emittedComments.add(c.start);
            }
        }
    }

    // Walk decls; emit globals as `let`/`const`, functions as
    // `function`/`async function` (Phase 1: no async yet).
    //
    // For each decl, attach:
    //   1. Comments immediately above (the existing gap=1 behavior).
    //   2. Inter-decl comments — between this decl and the previous
    //      one, that are OUTSIDE any function body.  Comments inside
    //      function bodies stay there; lifting them disrupts the
    //      goto-loop recognizers (see commit ab2fba8).  But comments
    //      in the gap between two top-level decls (typical
    //      function-doc shape: blank line, comment, blank line, next
    //      function) are safe to lift.
    //
    // The body-range set is computed once: for every defined
    // function (FunctionDecl with a CompoundStmt body), the line
    // range covered by that body.  A comment is "inter-decl-safe"
    // iff its line is outside every body range.
    const bodyRanges = [];
    for (const d of decls) {
        if (d.kind !== 'FunctionDecl') continue;
        const body = (d.inner || []).find((n) => n?.kind === 'CompoundStmt');
        if (!body) continue;
        const startLine = body.range?.begin?.line;
        const endLine = body.range?.end?.line;
        if (typeof startLine === 'number' && typeof endLine === 'number') {
            bodyRanges.push([startLine, endLine]);
        }
    }
    const isInsideAnyBody = (line) => {
        for (const [s, e] of bodyRanges) {
            if (line >= s && line <= e) return true;
        }
        return false;
    };

    let prevDeclEndLine = 0;
    for (const decl of decls) {
        const declStartLine = decl.loc?.line ?? 1;
        // The decl's "body opens" line.  For function definitions this
        // is `{` (typically declStartLine+1 or +2 for signatures
        // spanning lines).  Comments between declStartLine and
        // bodyOpenLine catch parameter-position annotations like
        //   void welcome(boolean new_game) /* false => restoring */
        // which are technically after the decl name but before the
        // function body opens.  For non-function decls (globals,
        // typedefs), use declStartLine itself (no gap to consider).
        const body = (decl.inner || []).find((n) => n?.kind === 'CompoundStmt');
        const bodyOpenLine = body?.range?.begin?.line ?? declStartLine;
        // Inter-decl comments: between prevDeclEndLine and bodyOpenLine,
        // outside any function body.  Catches both:
        //   1. Comments before the decl (typical doc comments)
        //   2. Comments between decl-name and body-open (param-position
        //      annotations) — these are not inside any other body
        //      range so isInsideAnyBody returns false.
        for (const c of comments || []) {
            if (c.line <= prevDeclEndLine) continue;
            if (c.line >= bodyOpenLine) break;
            if (isInsideAnyBody(c.line)) continue;
            if (ctx.emittedComments.has(c.start)) continue;
            lines.push(translateLeadingComment(c));
            ctx.emittedComments.add(c.start);
        }
        // Original gap=1 leading-comment pass (covers immediate
        // function-doc comments).
        const before = commentsBefore(comments, declStartLine);
        for (const c of before) {
            if (!ctx.emittedComments.has(c.start)) {
                lines.push(translateLeadingComment(c));
                ctx.emittedComments.add(c.start);
            }
        }
        const out = topLevelDecl(decl, ctx);
        if (out) lines.push(out);
        const declEndLine = body?.range?.end?.line ?? decl.range?.end?.line ?? declStartLine;
        // Pass A: trailing comment on same line as decl's `;`
        // (e.g. `void f(void); /* in hack.h ... */`).
        // Pass B: for non-function decls whose body / initializer spans
        // multiple lines, comments inside the decl's range — typically
        // per-field annotations inside a struct definition, or
        // between-element annotations inside a static array/struct
        // literal.  Emit them as free-standing block comments AFTER
        // the decl, since the JS object/array literal is single-line
        // and can't carry per-field comments inline.  Spec §11 only
        // requires verbatim presence somewhere in the JS, not
        // positional equivalence.  FunctionDecls are excluded —
        // comments inside their CompoundStmt body need recognizer-
        // aware emit (gated on the post-patch injection refactor
        // documented in §23.120).
        const isMultilineNonFn = decl.kind !== 'FunctionDecl'
            && declEndLine > declStartLine;
        for (const c of comments || []) {
            if (isInsideAnyBody(c.line)) continue;
            if (ctx.emittedComments.has(c.start)) continue;
            const isTrailing = c.line === declEndLine;
            // For inside-init we also include `c.line === declStartLine`
            // — trailing comments on the OPENING line of a multi-line
            // decl (e.g. `static T arr[] = { /* [4] first */ ... }`).
            // The pre-decl walk uses `c.line < bodyOpenLine` which for
            // non-fn decls equals declStartLine, so it excludes equal;
            // include it here to avoid dropping the start-line case.
            const isInInit = isMultilineNonFn
                && c.line >= declStartLine && c.line < declEndLine;
            if (!isTrailing && !isInInit) continue;
            lines.push(translateLeadingComment(c));
            ctx.emittedComments.add(c.start);
        }
        // Track this decl's end line for the next iteration's
        // inter-decl gap.  For FunctionDecls with bodies, use the
        // body's end line; otherwise fall back to the decl's loc
        // line (single-line decls like globals).  `body` was bound
        // above for the bodyOpenLine computation; reuse it here.
        prevDeclEndLine = declEndLine;
    }

    // Tail comments: anything after the last decl's end line that's
    // not inside any function body.  Catches end-of-file
    // documentation like monst.c's `/* for 'onefile' processing
    // where end of this file isn't necessarily the end of the source
    // code seen by the compiler */` block.
    for (const c of comments || []) {
        if (c.line <= prevDeclEndLine) continue;
        if (isInsideAnyBody(c.line)) continue;
        if (ctx.emittedComments.has(c.start)) continue;
        lines.push(translateLeadingComment(c));
        ctx.emittedComments.add(c.start);
    }

    // If a `main` function was defined, append an invocation so the
    // module runs as a program when imported / executed directly.
    const hasMain = decls.some((d) =>
        d.kind === 'FunctionDecl' && d.name === 'main'
        && (d.inner || []).some((n) => n.kind === 'CompoundStmt'));
    if (hasMain) lines.push('main();');

    // Prepend imports inferred from importNeeds, and file-header
    // comments above the imports (spec §11 requires verbatim header
    // preservation; ESM imports must precede statements but can come
    // after free-standing comments).
    const header = buildImportHeader(ctx);
    const headerText = headerComments.length
        ? headerComments.join('\n') + '\n'
        : '';
    // Uncaptured-sweep (§23.125 closure): scan EVERY comment one last
    // time and ensure each one > 30 chars is covered.  Comments that
    // live inside expression-internal positions (multi-line boolean
    // chains, ternary arms, function-call arguments, macro arg lists)
    // aren't reached by per-stmt or compound-residual walks because
    // the translator doesn't recurse into expressions.  Push them to
    // the sidecar with empty anchor so the injector's tail-fallback
    // appends them at EOF — spec §11 only requires presence
    // anywhere in the file, not positional equivalence.
    //
    // This is the guaranteed-coverage closure of the §23.122
    // architecture: any comment > 30 chars that ANY other path
    // didn't catch ends up here.
    for (const c of comments || []) {
        if (ctx.emittedComments.has(c.start)) continue;
        if (c.text.length < 30) continue;
        ctx.pendingInsideComments.push({
            outputPath: ctx.opts?.outputPath,
            anchor: '',
            content: c.text,
        });
        ctx.emittedComments.add(c.start);
    }
    // Expose inside-body comment captures to the caller via a
    // side-channel on opts.  build-tree.mjs collects these across
    // all TUs into a single sidecar manifest that build-engine.mjs
    // reads after running all patches (§23.122 post-patch injection).
    if (opts) {
        opts.collected = opts.collected || {};
        opts.collected.pendingInsideComments = ctx.pendingInsideComments;
    }
    return headerText + header + lines.join('\n') + (lines.length ? '\n' : '');
}

// ── Imports ─────────────────────────────────────────────────────

// Map of runtime symbols to their module basename (resolved against
// runtimeDir at translate time so the import path is correct relative
// to the output file's directory).
const RUNTIME_IMPORT_MAP = {
    printf:        { file: 'stdio.js' },
    fprintf:       { file: 'stdio.js' },
    puts:          { file: 'stdio.js' },
    putchar:       { file: 'stdio.js' },
};

// Spec §2: the `game` root object lives in js/gstate.js (not under
// c2js-runtime).  Listed here so buildImportHeader can resolve the
// relative path the same way it does for runtime modules.
const GAME_IMPORT = { module: jsDir + '/gstate.js', name: 'game' };

function relImport(outputPath, runtimeFile) {
    const target = `${runtimeDir}/${runtimeFile}`;
    let rel = pathRelative(pathDirname(outputPath), target);
    if (!rel.startsWith('.')) rel = './' + rel;
    return rel;
}

function relImportPath(outputPath, targetAbs) {
    let rel = pathRelative(pathDirname(outputPath), targetAbs);
    if (!rel.startsWith('.')) rel = './' + rel;
    return rel;
}

function buildImportHeader(ctx) {
    const lines = [];
    const anyImports = ctx.importNeeds.size
        || ctx.gameImportNeeded
        || ctx.externalRefs.size
        || ctx.crossTuRefs.size;
    if (!ctx.opts.outputPath && anyImports) {
        throw new Error('translateUnit: opts.outputPath required when imports are emitted');
    }

    // game import goes first per spec §2 — it's the root state.
    if (ctx.gameImportNeeded) {
        const path = relImportPath(ctx.opts.outputPath, GAME_IMPORT.module);
        lines.push(`import { ${GAME_IMPORT.name} } from '${path}';`);
    }

    // Group all imports by resolved import path so duplicates merge.
    const byMod = new Map();
    const addImport = (path, name) => {
        if (!byMod.has(path)) byMod.set(path, new Set());
        byMod.get(path).add(name);
    };

    // Runtime stdio etc.
    for (const need of ctx.importNeeds) {
        const m = RUNTIME_IMPORT_MAP[need];
        if (!m) continue;
        addImport(relImport(ctx.opts.outputPath, m.file), need);
    }
    // External symbols (hand-curated registry).
    for (const [name, modPath] of ctx.externalRefs) {
        const abs = pathResolve(projectRoot, modPath);
        addImport(relImportPath(ctx.opts.outputPath, abs), name);
    }
    // Cross-TU references (other files in this build-tree pass).
    for (const [name, targetPath] of ctx.crossTuRefs) {
        addImport(relImportPath(ctx.opts.outputPath, targetPath), name);
    }

    for (const [path, names] of [...byMod.entries()].sort()) {
        const sorted = [...names].sort().join(', ');
        lines.push(`import { ${sorted} } from '${path}';`);
    }

    return lines.join('\n') + (lines.length ? '\n\n' : '');
}

// ── Top-level decl dispatch ─────────────────────────────────────

function topLevelDecl(node, ctx) {
    switch (node.kind) {
        case 'FunctionDecl':         return functionDecl(node, ctx);
        case 'VarDecl':              return globalVarDecl(node, ctx);
        case 'TypedefDecl':          return typedefDecl(node, ctx);
        case 'RecordDecl':           return recordDecl(node, ctx);
        case 'EnumDecl':             return enumDecl(node, ctx);
        default:
            return `// TODO unhandled top-level ${node.kind}: ${node.name || ''}\n`;
    }
}

// Enum: each EnumConstantDecl becomes `export const NAME = N;` at
// module scope.  Tier A material per spec §1 (immutable integer
// constants).  C's auto-numbering (next = prev + 1) is preserved by
// reading the ConstantExpr's integer value when present, falling back
// to prev+1 when not.  clang has already evaluated any constant
// expression in the C source, so the IntegerLiteral.value field holds
// the final integer for both `RED = 1` and `GREEN` (auto-incremented).
function enumDecl(node, ctx) {
    const lines = [];
    let nextValue = 0;
    // Per-enum scope of already-emitted names so an enumerator like
    // `FIRST_OBJECT = LAST_GENERIC + 1` can be resolved.  Seeded from
    // any cross-TU constants we've already collected.
    const scope = new Map();
    if (ctx.opts?.crossTuStructs) {
        // crossTuStructs is the wrong map; we want crossTuEnumConstants
        // (added below).  Defensive in case future opts shape evolves.
    }
    for (const c of node.inner || []) {
        if (c.kind !== 'EnumConstantDecl') continue;
        const constExpr = (c.inner || []).find((n) => n.kind === 'ConstantExpr');
        let value;
        if (constExpr) {
            const evaled = evalConstExprInline(constExpr, scope);
            value = (typeof evaled === 'number' && Number.isFinite(evaled))
                ? evaled : nextValue;
        } else {
            value = nextValue;
        }
        if (c.name) scope.set(c.name, value);
        lines.push(`export const ${renameIfReserved(c.name)} = ${value};`);
        nextValue = value + 1;
    }
    return lines.join('\n');
}

// Tiny constant-expression evaluator for enum bodies and other Tier A
// integer expressions.  Mirrors the one in build-tree.mjs.  Returns
// undefined if it can't resolve, letting callers fall back.
function evalConstExprInline(node, scope) {
    if (!node || typeof node !== 'object') return undefined;
    switch (node.kind) {
        case 'ConstantExpr':
            if (typeof node.value === 'string') return parseInt(node.value, 10);
            return evalConstExprInline(node.inner?.[0], scope);
        case 'ParenExpr':
        case 'ImplicitCastExpr':
        case 'CStyleCastExpr':
            return evalConstExprInline(node.inner?.[0], scope);
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
            const a = evalConstExprInline(node.inner?.[0], scope);
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
            const a = evalConstExprInline(node.inner?.[0], scope);
            const b = evalConstExprInline(node.inner?.[1], scope);
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
                default: return undefined;
            }
        }
        default:
            return undefined;
    }
}

// Typedef: `typedef struct nhrect NhRect;` (or its inline form
// `typedef struct nhrect { ... } NhRect;`).  Register the typedef
// name as an alias for the underlying struct so subsequent VarDecls
// of type `NhRect [8]` can find the field list.  No JS output.
function typedefDecl(node, ctx) {
    if (!node.name) return '';
    const t = stripQuals(node.type?.qualType || '');
    const m = t.match(/^(?:struct|union)\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if (m && ctx.structs.has(m[1])) {
        ctx.structs.set(node.name, ctx.structs.get(m[1]));
    } else {
        // typedef of an ANONYMOUS struct: clang names the record
        // after the typedef in qualType ("struct terrain") but the
        // RecordDecl itself is nameless.  Pair via the
        // ElaboratedType's ownedTagDecl id (exact, unlike adjacency).
        const owned = (node.inner || []).find(
            (c) => c.ownedTagDecl?.id)?.ownedTagDecl?.id;
        const synKey = owned && `__anon_syn:${owned}`;
        if (synKey && ctx.structs.has(synKey)) {
            ctx.structs.set(node.name, ctx.structs.get(synKey));
            if (m) ctx.structs.set(m[1], ctx.structs.get(synKey));
        }
    }
    // For `typedef int boolean` and similar scalar typedefs there's
    // nothing to register; clang's qualType in user code already
    // resolves them via desugaredQualType.
    return '';
}

// Capture a struct definition into the Ctx's struct registry so later
// VarDecls of the struct type can be zero-init'd, and emit a brief
// JSDoc-style comment.  No JS class is generated here (Phase 1 path);
// the struct's data lives as a plain object literal.
// Collect a record's fields, synthesizing registry entries for
// NESTED anonymous member structs (hack.h lev_region's inarea /
// delarea).  Within one record's children, an anonymous RecordDecl
// is immediately followed by the FieldDecl that uses it (C grammar
// guarantees adjacency HERE, unlike top-level typedef sequences) —
// register the nested fields under a synthetic per-id key and point
// the field's type at it so zeroInitForStruct resolves the shape.
function collectRecordFields(node, ctx) {
    const fields = [];
    let lastAnonKey = null;
    for (const c of node.inner || []) {
        if (c.kind === 'RecordDecl' && c.completeDefinition && !c.name) {
            const subFields = collectRecordFields(c, ctx);
            lastAnonKey = `__anon_syn:${c.id}`;
            ctx.structs.set(lastAnonKey, subFields);
        } else if (c.kind === 'FieldDecl' && c.name) {
            let ftype = c.type?.qualType || '';
            if (lastAnonKey && /\((?:anonymous|unnamed)/.test(ftype)
                && !/[*\[]/.test(ftype)) {
                ftype = lastAnonKey;
                lastAnonKey = null;
            }
            fields.push({ name: renameIfReserved(c.name), type: ftype });
        }
    }
    return fields;
}

function recordDecl(node, ctx) {
    if (!node.name) {
        // Anonymous top-level struct (`typedef struct { ... } terrain;`):
        // register by clang node id; typedefDecl pairs via the
        // ElaboratedType's ownedTagDecl id (Q9 iteration 19 — the
        // adjacency-stash version mis-paired when nested anonymous
        // records intervened, garbling lev_region/bughack's shape).
        ctx.structs.set(`__anon_syn:${node.id}`, collectRecordFields(node, ctx));
        return '';
    }
    const fields = collectRecordFields(node, ctx);
    ctx.structs.set(node.name, fields);
    if (fields.length === 0) return '';
    const fieldList = fields.map((f) => `${f.name}`).join(', ');
    return `// struct ${node.name}: { ${fieldList} }`;
}

// Strip leading C type qualifiers (const, volatile, restrict) from a
// qualType string.  Used by every type-shape detector below so that
// `const struct foo` matches the same paths as `struct foo`.
function stripQuals(typeStr) {
    if (!typeStr) return typeStr;
    let s = typeStr.trim();
    while (true) {
        const m = s.match(/^(const|volatile|restrict|_Atomic)\s+(.*)$/);
        if (!m) break;
        s = m[2];
    }
    return s;
}

// Resolve a type string to the struct registry key, if any.  Accepts
// either form: `struct nhrect` (registered under "nhrect") or `NhRect`
// (registered as a typedef alias).
function structRegistryKey(typeStr, ctx) {
    if (!typeStr) return null;
    const t = stripQuals(typeStr);
    const taggedMatch = t.match(/^(?:struct|union)\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if (taggedMatch && ctx.structs.has(taggedMatch[1])) return taggedMatch[1];
    // Anonymous struct: `struct (anonymous struct at PATH:LINE:COL)` or
    // `struct (anonymous at PATH:LINE:COL)` (desugaredQualType form).
    // Registered by collectAllStructs under key `__anon:PATH:LINE:COL`.
    const anonMatch = t.match(/^(?:struct|union)\s*\((?:anonymous|unnamed)(?:\s+(?:struct|union))?\s+at\s+(.+?):(\d+):(\d+)\)\s*$/);
    if (anonMatch) {
        const key = `__anon:${anonMatch[1]}:${anonMatch[2]}:${anonMatch[3]}`;
        if (ctx.structs.has(key)) return key;
    }
    if (ctx.structs.has(t)) return t; // typedef name
    return null;
}

// Generate the zero-init object literal for a variable of struct type.
// Returns null if the type isn't a known struct.
function zeroInitForStruct(typeStr, ctx, seen = new Set()) {
    const key = structRegistryKey(typeStr, ctx);
    if (!key) return null;
    if (seen.has(key)) return '{}'; // cycle guard for self-referential structs
    const nextSeen = new Set(seen);
    nextSeen.add(key);
    const fields = ctx.structs.get(key);
    const parts = fields.map((f) => {
        const subStruct = zeroInitForStruct(f.type, ctx, nextSeen);
        if (subStruct) return `${f.name}: ${subStruct}`;
        const subArray = zeroInitForArray(f.type, ctx, nextSeen);
        if (subArray) return `${f.name}: ${subArray}`;
        return `${f.name}: ${zeroForType({ qualType: f.type })}`;
    });
    return `{ ${parts.join(', ')} }`;
}

// Parse `<element-type> [<outer-size>]<rest>` from a clang qualType.
// For multi-dimensional arrays `T [A][B]` (which in C means an array
// of A elements where each is `T [B]`), this returns the OUTER
// dimension A and the inner type `T [B]` as the element.  Recursion
// over the element handles deeper nesting.  Returns null if not an
// array type.
function parseArrayType(typeStr) {
    if (!typeStr) return null;
    const t = stripQuals(typeStr).trim();
    // Greedy first-bracket capture so the OUTER dimension wins.  The
    // remainder (after the first `[N]`) reattaches to the prefix to
    // form the element type.  E.g. `struct cell [3][2]` →
    //   prefix = "struct cell"
    //   size   = 3
    //   rest   = "[2]"
    //   element = "struct cell [2]"
    const m = t.match(/^([^\[]+?)\s*\[(\d+)\](.*)$/);
    if (!m) return null;
    const prefix = m[1].trim();
    const size = parseInt(m[2], 10);
    const rest = m[3].trim();
    const element = rest ? `${prefix} ${rest}` : prefix;
    return { element, size };
}

// Generate the zero-init array literal for a variable of array type.
// Returns null if the type isn't a fixed-size array.
// String-mode applies only at top-level (zeroInitFor) — nested calls
// from zeroInitForStruct (field init) keep array form so global struct
// fields stay indexable.  See zeroInitFor for the gate.
function zeroInitForArray(typeStr, ctx, seen = new Set()) {
    const arr = parseArrayType(typeStr);
    if (!arr) return null;
    const elemZero =
        zeroInitForStruct(arr.element, ctx, seen) ??
        zeroInitForArray(arr.element, ctx, seen) ??       // arrays of arrays
        zeroForType({ qualType: arr.element });
    // Emit `[elemZero, elemZero, ..., elemZero]`.  For very long
    // arrays this could be inefficient at parse time, but NetHack's
    // largest static array is the dungeon levl[80][21] = 1680 entries
    // — manageable as a literal.  Phase X may switch to
    // `Array.from({length: N}, () => zero)` for huge tables.
    const parts = new Array(arr.size).fill(elemZero);
    return `[${parts.join(', ')}]`;
}

// Combined initializer-or-zero helper used by both global and local
// VarDecl.  Tries struct, then array, then scalar default.
// §23.227 Phase 1 string-mode: function-local 1D char arrays become ''.
// Multi-dim char arrays (e.g. `char rip[16][80]`), struct-nested fields,
// and module-scope globals (`game.foo`) keep array form so cross-TU
// indexed writes still work.  Gate: ctx.currentFnName must be set.
function zeroInitFor(typeStr, ctx) {
    if (inStringMode(ctx) && ctx && ctx.currentFnName) {
        const arr = parseArrayType(typeStr);
        if (arr && /^(unsigned\s+|signed\s+)?char$/.test(arr.element.trim())) {
            return `''`;
        }
    }
    return zeroInitForStruct(typeStr, ctx)
        ?? zeroInitForArray(typeStr, ctx)
        ?? zeroForType({ qualType: typeStr });
}

function functionDecl(node, ctx) {
    if (!node.inner) return ''; // forward decl, skip
    const paramNodes = (node.inner || []).filter((n) => n.kind === 'ParmVarDecl');
    const params = paramNodes.map((n) => renameIfReserved(n.name));
    const body = (node.inner || []).find((n) => n.kind === 'CompoundStmt');
    if (!body) return ''; // forward decl
    const name = renameIfReserved(node.name);

    // Hand-port stub-anchor recognizer.  When `(cFile, C name)` matches
    // a HAND_PORTED_FUNCTIONS entry in c2js.config.mjs, emit a thin
    // stub that delegates to the runtime hand-port file instead of
    // translating the body.  See c2js.config.mjs's
    // HAND_PORTED_FUNCTIONS comment for rationale.
    //
    // The stub preserves:
    //   - export class (static stays unexported)
    //   - function name + signature (params named identically)
    //   - C-source comment block above the function (via the same
    //     mechanism functionDecl uses for the normal path — the
    //     comment is injected post-emit by build-engine, anchored to
    //     the export-line text).
    //
    // Adds an import line via ctx.externalRefs so the build pipeline
    // wires up the runtime helper module path.
    const handPortEntry = HAND_PORTED_FUNCTIONS[ctx.cFile];
    if (handPortEntry && handPortEntry.functions.includes(node.name)) {
        const isStatic = node.storageClass === 'static';
        const isMain = name === 'main';
        const exportPrefix = (isStatic || isMain) ? '' : 'export ';
        const importAlias = `__nh_hp_${name}`;
        ctx.externalRefs?.set?.(importAlias,
            `js/c2js-runtime/${handPortEntry.runtime}`);
        const argList = params.join(', ');
        return `${exportPrefix}function ${name}(${argList}) {\n`
            + `    return ${importAlias}(${argList});\n`
            + `}`;
    }

    // Per-function: rebuild the labelById map so GotoStmt resolution
    // is local to this function (label names can repeat across
    // functions in the same C file).
    ctx.labelById = new Map();
    ctx.reachableLabels = new Set();
    ctx.backJumpLabels = new Set();
    ctx.forwardGotoFlags = new Map();
    // Save & set current function name for per-site allowlist lookups.
    // Cleared on function exit so nested translation passes (e.g.
    // static-init expressions) see no spurious function context.
    const prevFnName = ctx.currentFnName;
    ctx.currentFnName = node.name;
    const prevStrchrBoundPaths = ctx.strchrBoundPaths;
    ctx.strchrBoundPaths = new Set();
    collectLabels(body, ctx);
    // Set of parameter names that are scalar-pointer outparams (e.g.
    // `int *lo_p`).  Inside the body, `*lo_p` reads / `*lo_p = X`
    // writes get rewritten to `lo_p.value`.  Per-function so we
    // restore on exit.
    const prevScalarPtrParams = ctx.scalarPtrParamNames;
    const prevStructPtrParams = ctx.structPtrParamNames;
    const indices = ctx.opts?.crossTuScalarPtrParams?.get?.(node.name) || [];
    const refSet = new Set();
    for (const i of indices) {
        const pn = paramNodes[i];
        if (pn?.name) refSet.add(renameIfReserved(pn.name));
    }
    // Casted-alias local vars: when the body has `T *p = (T *) param`
    // where param is in the scalar-ptr-param set, treat `p` as another
    // scalar-ptr ref so `*p = X` rewrites to `p.value = X` (matching
    // what the param's `.value` boxing makes available — they share
    // the same JS box reference once `p = param` runs).
    collectCastedAliasLocals(body, refSet);
    ctx.scalarPtrParamNames = refSet;
    // Parallel set for struct-ptr out-params: `*p = struct_value`
    // becomes `Object.assign(p, struct_value)`.  No callsite boxing.
    const structIndices = ctx.opts?.crossTuStructPtrParams?.get?.(node.name) || [];
    const structRefSet = new Set();
    for (const i of structIndices) {
        const pn = paramNodes[i];
        if (pn?.name) structRefSet.add(renameIfReserved(pn.name));
    }
    // Local struct-ptr variables share the same emission rule (the
    // local IS the caller's reference, write-through copies fields).
    // Walk the body to collect them in the same set.
    collectStructPtrLocals(body, structRefSet, ctx.opts?.crossTuTypedefAliases);
    ctx.structPtrParamNames = structRefSet;
    // Export rules: `static` C functions are file-local → no export.
    // `main` is a program entry, not an importable symbol → no export
    // (and the caller appends a `main();` invocation at end of file).
    // Everything else: export, since cross-module references need it.
    const isStatic = node.storageClass === 'static';
    const isMain = name === 'main';
    const exportPrefix = (isStatic || isMain) ? '' : 'export ';
    const head = `${exportPrefix}function ${name}(${params.join(', ')}) `;
    // Idiom-recognition: certain C string-mutation functions translate
    // to a single JS String.prototype call.  C does in-place mutation
    // and returns the same pointer; JS strings are immutable, so we
    // return a NEW string — callers that ignore the return get the
    // pre-mutation value.  Acceptable trade-off because: (a) the
    // current per-AST translation is BROKEN (`p++` on a string is
    // NaN, the loop is infinite); (b) the recognized form reads as
    // proper JS, helping Phase 2 diff stability; (c) callsites can
    // be migrated to assign the return as a separate later step.
    const idiomBody = recognizeStringTransformFn(node, params);
    if (idiomBody !== null) {
        ctx.scalarPtrParamNames = prevScalarPtrParams;
        ctx.structPtrParamNames = prevStructPtrParams;
        ctx.currentFnName = prevFnName;
        ctx.strchrBoundPaths = prevStrchrBoundPaths;
        return head + idiomBody;
    }
    // For functions in RETURNS_FIRST_ARG: synthesize `return PARAM;`
    // at the end of body so the function returns its (mutated) first
    // arg.  Pairs with MUTATING_STR_CALLS to make statement-level
    // calls correctly assign back into the caller's variable.
    if (RETURNS_FIRST_ARG.has(node.name) && params.length >= 1
        && body && Array.isArray(body.inner)) {
        const lastChild = body.inner[body.inner.length - 1];
        const hasTrailingReturn = lastChild?.kind === 'ReturnStmt';
        if (!hasTrailingReturn) {
            body.inner = [...body.inner, {
                kind: 'SyntheticText',
                text: `return ${params[0]};`,
            }];
        }
    }
    // §23.239 void-char*-out-param convention, callee side: the
    // function returns its out-param buffer at EVERY exit.  Mid-body
    // bare `return;` statements emit `return <param>;` (returnStmt
    // consults ctx.voidOutParamReturnName), and a trailing return is
    // appended when the body doesn't already end with one.
    const prevVoidOutParamReturnName = ctx.voidOutParamReturnName;
    if (VOID_CHAR_OUT_PARAM_RETURNS.has(node.name)
        && body && Array.isArray(body.inner)) {
        const outIdx = VOID_CHAR_OUT_PARAM_RETURNS.get(node.name);
        const outName = params[outIdx];
        if (outName) {
            ctx.voidOutParamReturnName = outName;
            const lastChild = body.inner[body.inner.length - 1];
            if (lastChild?.kind !== 'ReturnStmt') {
                body.inner = [...body.inner, {
                    kind: 'SyntheticText',
                    text: `return ${outName};`,
                }];
            }
        }
    }
    // Function-local variable name set.  Used by declRefExpr to
    // bypass the cross-TU `game.X` rewrite when a local shadows a
    // file-static name from another TU.  Includes parameters and
    // both auto + static VarDecls.
    const prevFunctionLocals = ctx.functionLocals;
    const funcLocals = new Set();
    for (const p of paramNodes) if (p?.name) funcLocals.add(p.name);
    collectLocalVarNames(body, funcLocals);
    ctx.functionLocals = funcLocals;

    // Function-local `static` hoisting.  Collect every `static`
    // VarDecl reachable in the body, register each in a refMap
    // FIRST (so cross-references between statics resolve to the
    // hoisted names), then evaluate initializers and emit module-
    // scope `let|const __<fn>_<name> = <init>;`.  References to
    // these names inside the function body are rewritten to the
    // hoisted name by declRefExpr.
    //
    // Hoisted-static names use a double-underscore prefix
    // (`__<fn>_<name>`) which is exempted from the conformance
    // "no top-level let" rule — the rule guards against ad-hoc
    // module-level mutable state, but C-static persistence is a
    // bounded, justified case.
    const collected = [];
    collectLocalStatics(body, collected, node.name);
    let hoistPrefix = '';
    const prevLocalStatics = ctx.localStatics;
    if (collected.length > 0) {
        // Build the rename map BEFORE evaluating any initializers, so
        // cross-references between statics in the same function (the
        // `static *p = a;` shape, where `a` is another local static)
        // resolve to the hoisted name.
        const refMap = new Map();
        for (const { node: vd } of collected) {
            refMap.set(vd.name, `__${node.name}_${vd.name}`);
        }
        ctx.localStatics = refMap;
        const hoistLines = [];
        for (const { node: vd, hoistedName } of collected) {
            const init = (vd.inner || []).find(isExpr);
            const typeStr = vd.type?.qualType;
            let initJs;
            if (init) {
                initJs = expr(init, ctx, { contextType: typeStr });
            } else {
                initJs = zeroInitFor(typeStr, ctx);
            }
            registerCharArrayEmittedAsArray(ctx, vd.name, typeStr, initJs);
            const isConst = /\bconst\b/.test(typeStr || '');
            const hoistLine = `${isConst ? 'const' : 'let'} ${hoistedName} = ${initJs};`;
            hoistLines.push(hoistLine);
            // Q9.5(b) single-process harness convergence: mutable
            // hoisted statics persist for the process lifetime, so
            // back-to-back sessions in one process leak C-static
            // state (§23.143).  Register a reset closure that
            // re-evaluates the initializer — exactly what a fresh
            // process computes at module load — so the session
            // driver's __nh_reset_statics() restores fresh-process
            // semantics per session.
            if (!isConst) {
                ctx.externalRefs?.set?.('__nh_register_static',
                    EXTERNAL_SYMBOLS['__nh_register_static']);
                hoistLines.push(
                    `__nh_register_static(() => { ${hoistedName} = ${initJs}; });`);
            }
            // Inside-VarDecl-range capture for function-local statics
            // (§23.124).  When the static is a multi-line array/struct
            // initializer (e.g. `static const struct alt_spl names[] = {
            //     { "x", ... },
            //     /* note */
            //     { "y", ... },
            // };`), comments between the elements live inside the
            // VarDecl's range but the JS array literal is single-line.
            // Capture them with `position: 'after'` on the hoist line
            // so they land right after the hoisted decl.
            const vdStart = vd.range?.begin?.line ?? vd.loc?.line;
            const vdEnd = vd.range?.end?.line;
            if (vdStart != null && vdEnd != null && vdEnd > vdStart) {
                const anchor = hoistLine;
                if (anchor.length >= 6) {
                    for (const c of ctx.comments || []) {
                        if (c.line <= vdStart) continue;
                        if (c.line >= vdEnd) break;
                        if (ctx.emittedComments.has(c.start)) continue;
                        if (c.text.length < 30) continue;
                        ctx.pendingInsideComments.push({
                            outputPath: ctx.opts?.outputPath,
                            anchor,
                            content: c.text,
                            position: 'after',
                        });
                        ctx.emittedComments.add(c.start);
                    }
                }
            }
        }
        hoistPrefix = hoistLines.join('\n') + '\n';
    } else {
        ctx.localStatics = new Map();
    }
    // Char-buffer recognizer pre-pass: find `char *p = buf;` walks
    // whose every use is `*p = X` or `*p++ = X`.  Rewrites p to an
    // index variable + indexed access on buf during body emit.  Runs
    // AFTER ctx.localStatics is set so the buf's hoisted name (for
    // function-local statics) resolves correctly when rendering.
    const prevCBR = ctx.charBufferRewrites;
    ctx.charBufferRewrites = analyzeCharBufferCandidates(body, ctx);
    // Char-buffer parameter walker recognizer: handle `void f(char
    // *bufp)` where bufp's body uses match the walker safe-set.
    // Pre-existing recognizer only looks at local VarDecls; this
    // companion extends to function parameters so getlin / putstr-
    // style callers don't fall into the generic pointer-mutation
    // TODO.  Same matchCharBufferWrite consumer path.
    addParmCharBufferCandidates(paramNodes, body, ctx.charBufferRewrites, ctx);
    // Assignment-init char-buffer recognizer: handle `char *p;  ...
    // p = bufRef;` (split decl + later assignment), analogous to the
    // decl-init form but for the common NetHack pattern where multiple
    // char-pointer locals get bulk-initialized in a for-init's comma
    // expression.  Runs AFTER the decl-init and parm passes so it
    // can't double-claim names those already own.
    addAssignmentInitCharBufferCandidates(body, ctx.charBufferRewrites, ctx);
    // strchr-truncate pre-pass: find `if ((p = strchr_family(buf, X))
    // != NULL) *p = '\0';` sites and verify p has no position-
    // dependent uses elsewhere in the body.  Safe sites are tracked
    // in ctx.strchrTruncates; the ifStmt emit consults this map.
    const prevStrTrunc = ctx.strchrTruncates;
    ctx.strchrTruncates = new Map();
    analyzeStrchrTruncates(body, ctx);
    // Local-variable alias-tracking pre-pass: classify each char-
    // pointer VarDecl in the function-scope by usage (unmoved /
    // walker / rebound / escape).  Pure classification — does NOT
    // change emit on its own.  Consumers read ctx.localAliases.
    const prevLocalAliases = ctx.localAliases;
    analyzeLocalAliases(body, ctx);
    // Eos-walker recognizer pre-pass: identifies `char *bp = eos(buf);`
    // walkers whose body uses are `*bp = X; bp++;` (and possibly a
    // final `*bp = '\0';`).  Reads ctx.localAliases (must be populated
    // first).  Populates ctx.eosWalkers; emit hooks drop the VarDecl,
    // drop bp++ stmts, drop *bp = NUL, and rewrite *bp = X → buf += X.
    const prevEosWalkers = ctx.eosWalkers;
    analyzeEosWalkers(body, ctx);
    // Linked-list iterator pre-pass: detects `struct T **var;` locals
    // whose body uses match the C "list walk via pointer-to-pointer"
    // idiom.  Translates each var to a pair (<name>__parent,
    // <name>__field) of variables that track "var is the address of
    // <parent>.<field>".  The pattern covers: `var = &container->head;`,
    // `*var` reads, `*var = X` writes, `var = &(*var)->next;` advance.
    // Critical for object-list unlink (delta_cwt) and inventory mutation
    // (snuff_lit_obj_chain).  See verifyLLIterPattern for safety check.
    const prevLLI = ctx.linkedListIterators;
    analyzeLinkedListIterators(body, ctx);
    // Body opens at the function head's indent (0 at top level).
    let bodyJs = compoundStmt(body, ctx);
    // Inject `let __nh_<name>_idx = 0;` for each char-buffer
    // PARAMETER walker (the local-decl walker case had its
    // injection happen via declStmt rewriting the VarDecl in-place;
    // for params there's no VarDecl to rewrite — the params land
    // in the function head's arg list).  Splice the decls at the
    // top of the body's opening brace.
    const paramWalkerIdxDecls = [];
    for (const p of paramNodes) {
        const r = ctx.charBufferRewrites.get(p.name);
        if (r?.isParam) {
            paramWalkerIdxDecls.push(`    let ${r.idxName} = 0;`);
        }
    }
    if (paramWalkerIdxDecls.length > 0 && bodyJs.startsWith('{\n')) {
        bodyJs = '{\n' + paramWalkerIdxDecls.join('\n') + '\n' + bodyJs.slice(2);
    }
    ctx.charBufferRewrites = prevCBR;
    ctx.strchrTruncates = prevStrTrunc;
    ctx.scalarPtrParamNames = prevScalarPtrParams;
    ctx.structPtrParamNames = prevStructPtrParams;
    ctx.localStatics = prevLocalStatics;
    ctx.functionLocals = prevFunctionLocals;
    ctx.currentFnName = prevFnName;
    ctx.strchrBoundPaths = prevStrchrBoundPaths;
    ctx.localAliases = prevLocalAliases;
    ctx.eosWalkers = prevEosWalkers;
    ctx.linkedListIterators = prevLLI;
    ctx.voidOutParamReturnName = prevVoidOutParamReturnName;
    return hoistPrefix + head + bodyJs;
}

// NetHack-specific function recognizers that have a custom signature
// (not the single `char *` shape of the string-transform family
// below).  Each entry declares (sig, body) where sig validates the
// declared C parameters and body returns the JS replacement.
const SPECIAL_FUNCTION_RECOGNIZERS = {
    // Strlen_ — NetHack's bounded strlen.  The C body uses a
    // pointer-walk that JS can't model (`p++` on a string is NaN).
    // Replace with a length-based implementation that matches C
    // semantics: panic on null, panic if length >= 32767.  Previously
    // this lived as a build-engine.mjs post-process patch; moving it
    // here makes the translator self-contained for this function and
    // saves a regex line that would diff against future upstream
    // versions (Phase 2 diff stability).
    'Strlen_': {
        sig: (paramNodes) =>
            paramNodes.length === 3
            && /char\s*\*/.test(paramNodes[0]?.type?.qualType || '')
            && /char\s*\*/.test(paramNodes[1]?.type?.qualType || '')
            && /int|long/.test(paramNodes[2]?.type?.qualType || ''),
        body: (params) => `{\n`
            + `    if (${params[0]} == null) panic("Strlen_:%s null str at %d", ${params[1]}, ${params[2]});\n`
            + `    const _s = (typeof ${params[0]} === "string") ? ${params[0]}\n`
            + `            : (Array.isArray(${params[0]}) ? ${params[0]}.findIndex(b => b === 0) : String(${params[0]}));\n`
            + `    const len = (typeof _s === "string") ? _s.length : (_s < 0 ? ${params[0]}.length : _s);\n`
            + `    if (len >= 32767) panic("%s:%d string too long", ${params[1]}, ${params[2]});\n`
            + `    return len;\n`
            + `}`,
    },
    // strkitten — append a single char to a string.
    // C: `char *strkitten(char *s, char c) { ... appends c to s ... return s; }`
    // The C version mutates s in place.  JS strings are immutable, so
    // we return a new string with c appended; callers that ignore the
    // return get the unchanged value.
    'strkitten': {
        sig: (paramNodes) =>
            paramNodes.length === 2
            && /char\s*\*/.test(paramNodes[0]?.type?.qualType || '')
            && /char\b/.test(paramNodes[1]?.type?.qualType || ''),
        // Coerce array bufs to their proper string form before
        // concatenating.  Without this, `array + String.fromCharCode(c)`
        // does `array.toString()` which produces "65,67,71,0,..."
        // instead of the chars-up-to-null string.  Slice A absorption
        // of `*p++ = X` patterns now writes into the caller's buf
        // array, so callers like botl.c armor_status pass an array
        // here rather than the previously-strcpy'd string.
        body: (params) =>
            `{\n    return __nh_toJsStr(${params[0]}) + String.fromCharCode(${params[1]});\n}`,
    },
    // onlyspace — returns boolean (true if all chars are whitespace).
    // ASCII whitespace matches what NetHack's C `isspace` covers for
    // relevant inputs.
    'onlyspace': {
        sig: (paramNodes) =>
            paramNodes.length === 1
            && /char\s*\*/.test(paramNodes[0]?.type?.qualType || ''),
        body: (params) =>
            `{\n    return ${params[0]} == null || /^\\s*$/.test(${params[0]} + '');\n}`,
    },
    // strsubst — replace first occurrence of `orig` substring in bp
    // with `replacement`.  JS String.prototype.replace with a literal
    // string replaces first occurrence — matches C semantics.
    'strsubst': {
        sig: (paramNodes) =>
            paramNodes.length === 3
            && /char\s*\*/.test(paramNodes[0]?.type?.qualType || '')
            && /char\s*\*/.test(paramNodes[1]?.type?.qualType || '')
            && /char\s*\*/.test(paramNodes[2]?.type?.qualType || ''),
        body: (params) =>
            `{\n    if (${params[0]} == null || ${params[1]} == null || ${params[2]} == null) return ${params[0]};\n`
            + `    return (${params[0]} + '').replace(${params[1]}, ${params[2]});\n}`,
    },
    // stripchars — copy `orig` into `bp` skipping any chars that
    // appear in `stuff_to_strip`.  JS form: filter chars.
    'stripchars': {
        sig: (paramNodes) =>
            paramNodes.length === 3
            && /char\s*\*/.test(paramNodes[0]?.type?.qualType || '')
            && /char\s*\*/.test(paramNodes[1]?.type?.qualType || '')
            && /char\s*\*/.test(paramNodes[2]?.type?.qualType || ''),
        body: (params) =>
            `{\n    if (${params[2]} == null) return ${params[0]};\n`
            + `    const _strip = ${params[1]} == null ? '' : (${params[1]} + '');\n`
            + `    return [...(${params[2]} + '')].filter(c => !_strip.includes(c)).join('').slice(0, 255);\n}`,
    },
    // strcasecpy — copy src to dst preserving dst's case where dst
    // has chars available, raw copy beyond.  Uses the same chrcasecpy
    // helper the original function calls.  Returns the result string;
    // callers that ignore the return get the unchanged dst.
    // sgn — sign function returning -1, 0, or +1.  C: returns int.
    // Per-AST translation produces `(n < 0) ? -1 : (n != 0)` which
    // returns a BOOLEAN for the n != 0 branch — `true` instead of 1,
    // `false` instead of 0.  Arithmetic-coerce works (true * 2 == 2)
    // but strict-equality fails (sgn(5) === 1 is false).  Use Math.sign
    // to return clean numeric values.
    'sgn': {
        sig: (paramNodes) =>
            paramNodes.length === 1
            && /int|long|short/.test(paramNodes[0]?.type?.qualType || ''),
        body: (params) => `{\n    return Math.sign(${params[0]}) | 0;\n}`,
    },
    // visctrl — return display representation of a char.  Control
    // chars (< 0x20) become "^X", DEL becomes "^?", high-bit chars
    // get an "M-" prefix.  C uses a static rotating buffer; JS just
    // returns a new string per call.
    'visctrl': {
        sig: (paramNodes) =>
            paramNodes.length === 1
            && /\bchar\b/.test(paramNodes[0]?.type?.qualType || '')
            && !/\*/.test(paramNodes[0]?.type?.qualType || ''),
        body: (params) =>
            `{\n    let _c = ${params[0]} | 0;\n`
            + `    let _pre = '';\n`
            + `    if (_c & 0x80) { _pre = 'M-'; _c &= 0x7F; }\n`
            + `    if (_c < 0x20) return _pre + '^' + String.fromCharCode(_c | 0x40);\n`
            + `    if (_c === 0x7F) return _pre + '^?';\n`
            + `    return _pre + String.fromCharCode(_c);\n}`,
    },
    // copynchars — copy up to n chars from src to dst, stopping at
    // NUL or newline.  C signature is void; JS form returns the
    // copied substring.  Caller-side migration: add `copynchars` to
    // MUTATING_STR_CALLS so statement calls become `dst = copynchars(...)`.
    'copynchars': {
        sig: (paramNodes) =>
            paramNodes.length === 3
            && /char\s*\*/.test(paramNodes[0]?.type?.qualType || '')
            && /char\s*\*/.test(paramNodes[1]?.type?.qualType || '')
            && /int|long/.test(paramNodes[2]?.type?.qualType || ''),
        body: (params) =>
            `{\n    if (${params[1]} == null) return ${params[0]};\n`
            + `    const _src = ${params[1]} + '';\n`
            + `    let _i = 0;\n`
            + `    const _max = Math.min(${params[2]}, _src.length);\n`
            + `    while (_i < _max) {\n`
            + `        const _c = _src.charCodeAt(_i);\n`
            + `        if (_c === 0 || _c === 10) break;\n`
            + `        _i++;\n`
            + `    }\n`
            + `    return _src.slice(0, _i);\n}`,
    },
    'strcasecpy': {
        sig: (paramNodes) =>
            paramNodes.length === 2
            && /char\s*\*/.test(paramNodes[0]?.type?.qualType || '')
            && /char\s*\*/.test(paramNodes[1]?.type?.qualType || ''),
        body: (params) =>
            `{\n    if (${params[1]} == null) return ${params[0]};\n`
            + `    const _src = ${params[1]} + '';\n`
            + `    const _dst = ${params[0]} == null ? '' : (${params[0]} + '');\n`
            + `    let _r = '';\n`
            + `    for (let _i = 0; _i < _src.length; _i++) {\n`
            + `        const _ic = _src.charCodeAt(_i);\n`
            + `        const _oc = _i < _dst.length ? _dst.charCodeAt(_i) : 0;\n`
            + `        _r += String.fromCharCode(chrcasecpy(_oc, _ic));\n`
            + `    }\n`
            + `    return _r;\n}`,
    },
};

// Map of recognized C string-transform function names → JS body
// generator.  Each entry's predicate validates the C signature; if
// matched, the body is replaced with a single-call equivalent.
//
// The recognized functions all have the same shape: single `char *`
// parameter, walk the buffer character-by-character with a transform,
// return the buffer.  In JS we map each to a String.prototype call.
//
// Dictionary chosen for unambiguous semantic equivalence — when the
// C function's behavior matches a JS string method exactly across all
// inputs (ASCII range used by NetHack).  Functions with edge-case
// divergence (whitespace handling, locale-dependent transforms) are
// NOT in this list; they need targeted predicates.
const STRING_TRANSFORM_RECOGNIZERS = {
    // C: `for (p = s; *p; p++) if ('A' <= *p && *p <= 'Z') *p |= 040;`
    'lcase':  (s) => `{\n    return ${s} == null ? ${s} : (${s} + '').toLowerCase();\n}`,
    // C: `for (p = s; *p; p++) if ('a' <= *p && *p <= 'z') *p &= ~040;`
    'ucase':  (s) => `{\n    return ${s} == null ? ${s} : (${s} + '').toUpperCase();\n}`,
    // C: `if (s) *s = highc(*s); return s;`
    // Char-array safe (§23.43): same shape as the `*X = highc(*X)`
    // inline emission below — pre-coerce char-array args to a JS
    // string before the first-char case transform.
    'upstart': (s) =>
        `{\n`
        + `    if (!${s}) return ${s};\n`
        + `    const __t = Array.isArray(${s})\n`
        + `      ? (() => { let r=''; for (let i=0;i<${s}.length&&${s}[i];i++) r+=String.fromCharCode(${s}[i]); return r; })()\n`
        + `      : (${s} + '');\n`
        + `    return __t.length ? __t[0].toUpperCase() + __t.slice(1) : ${s};\n`
        + `}`,
    // C: walk + replace tabs with space, collapse runs of space, strip
    // trailing space, truncate at first newline.
    'mungspaces': (s) =>
        `{\n    if (${s} == null) return ${s};\n`
        + `    return (${s} + '').replace(/\\t/g, ' ').split('\\n')[0].replace(/ +/g, ' ').replace(/ +$/, '');\n}`,
    // C: strip leading/trailing whitespace.  NetHack's trimspaces
    // strips trailing only.  See hacklib.c: only walks back from end.
    'trimspaces': (s) =>
        `{\n    return ${s} == null ? ${s} : (${s} + '').replace(/[ \\t]+$/, '');\n}`,
    // C: strip a trailing newline if present.
    'strip_newline': (s) =>
        `{\n    return ${s} == null ? ${s} : (${s} + '').replace(/\\n$/, '');\n}`,
    // C: strip all digits in-place.
    'stripdigits': (s) =>
        `{\n    return ${s} == null ? ${s} : (${s} + '').replace(/[0-9]/g, '');\n}`,
    // C: construct a gerund — append "ing" with NetHack rules.
    // Handles trailing " on"/" off"/" with" as detachable suffix,
    // "er" no-op, consonant-vowel-consonant doubling, "ie"->"y",
    // trailing "e" elision.  Case-insensitive matching matches the
    // C strcmpi semantics for ASCII inputs.
    'ing_suffix': (s) =>
        `{\n    if (${s} == null) return ${s};\n`
        + `    let _b = ${s} + '';\n`
        + `    let _onoff = '';\n`
        + `    const _vowel = 'aeiouwy';\n`
        + `    const _lc = _b.toLowerCase();\n`
        + `    if (_lc.endsWith(' on') || _lc.endsWith(' off') || _lc.endsWith(' with')) {\n`
        + `        const _i = _b.lastIndexOf(' ');\n`
        + `        if (_i >= 0) { _onoff = _b.slice(_i); _b = _b.slice(0, _i); }\n`
        + `    }\n`
        + `    const _bl = _b.toLowerCase();\n`
        + `    if (_bl.endsWith('er')) {\n`
        + `        /* nothing */\n`
        + `    } else if (_b.length >= 3\n`
        + `               && !_vowel.includes(_bl[_bl.length - 1])\n`
        + `               && _vowel.includes(_bl[_bl.length - 2])\n`
        + `               && !_vowel.includes(_bl[_bl.length - 3])) {\n`
        + `        _b = _b + _b[_b.length - 1];\n`
        + `    } else if (_bl.endsWith('ie')) {\n`
        + `        _b = _b.slice(0, -2) + 'y';\n`
        + `    } else if (_bl.endsWith('e')) {\n`
        + `        _b = _b.slice(0, -1);\n`
        + `    }\n`
        + `    return _b + 'ing' + _onoff;\n}`,
    // C: expand tabs to spaces with 8-column alignment (counted
    // from start of buffer, not from start of line — matches C
    // exactly).  Truncates at BUFSZ.
    'tabexpand': (s) =>
        `{\n    if (${s} == null) return ${s};\n`
        + `    const _str = ${s} + '';\n`
        + `    if (_str.length === 0) return _str;\n`
        + `    let _r = '', _idx = 0;\n`
        + `    for (let _i = 0; _i < _str.length; _i++) {\n`
        + `        const _c = _str[_i];\n`
        + `        if (_c === '\\t') {\n`
        + `            do { _r += ' '; _idx++; } while (_idx % 8);\n`
        + `        } else {\n`
        + `            _r += _c; _idx++;\n`
        + `        }\n`
        + `        if (_idx >= 256) break;\n`
        + `    }\n`
        + `    return _r;\n}`,
    // C: convert name to possessive.  "it" -> "its", "you" -> "your",
    // names ending in s -> X', otherwise X's.
    's_suffix': (s) =>
        `{\n`
        + `    const _s = ${s} == null ? '' : (${s} + '');\n`
        + `    if (_s.toLowerCase() === 'it') return _s + 's';\n`
        + `    if (_s.toLowerCase() === 'you') return _s + 'r';\n`
        + `    if (_s.endsWith('s')) return _s + "'";\n`
        + `    return _s + "'s";\n`
        + `}`,
};

function recognizeStringTransformFn(node, jsParams) {
    const cName = node.name;
    if (!cName) return null;
    // Special recognizer (custom signatures) — checked first.
    const special = SPECIAL_FUNCTION_RECOGNIZERS[cName];
    if (special) {
        const paramNodes = (node.inner || []).filter((n) => n.kind === 'ParmVarDecl');
        if (special.sig(paramNodes)) {
            return special.body(jsParams);
        }
        return null;
    }
    if (!STRING_TRANSFORM_RECOGNIZERS[cName]) return null;
    // Verify signature: exactly one parameter, declared `char *`.
    const paramNodes = (node.inner || []).filter((n) => n.kind === 'ParmVarDecl');
    if (paramNodes.length !== 1) return null;
    const pType = (paramNodes[0].type?.qualType || '').replace(/^const\s+/, '').trim();
    if (!/^char\s*\*\s*$/.test(pType)) return null;
    // Verify return type is char* (the single-arg-and-return idiom).
    const looksReturning = /^char\s*\*/.test(node.type?.qualType || '');
    if (!looksReturning) return null;
    return STRING_TRANSFORM_RECOGNIZERS[cName](jsParams[0]);
}

function globalVarDecl(node, ctx) {
    const rawName = node.name;
    const name = renameIfReserved(rawName);
    // Skip `extern` declarations — JS module imports cover them.
    if (node.storageClass === 'extern') return '';
    const init = (node.inner || []).find(isExpr);
    const typeStr = node.type?.qualType;
    let initJs;
    if (init) {
        // Pass the type along so InitListExpr can choose between
        // {…} (struct) and […] (array).
        initJs = expr(init, ctx, { contextType: typeStr });
    } else {
        initJs = zeroInitFor(typeStr, ctx);
    }
    registerCharArrayEmittedAsArray(ctx, rawName, typeStr, initJs);

    // Spec §2: NetHack's `ga`..`gz` global structs flatten onto a
    // single `game` root.  Definition `struct ... ga = {a, b};` →
    // `Object.assign(game, {field1: a, field2: b});` — the bucket
    // prefix disappears and the field set merges into game.  Definitions
    // without an initializer emit nothing (the fields default to
    // undefined on game until first written).
    if (GLOBAL_BUCKETS_SET.has(rawName)) {
        ctx.gameImportNeeded = true;
        if (!init) return '';
        return `Object.assign(game, ${initJs});`;
    }

    // C `const` (or `static const`) data is read-only at the binding
    // level → JS `const`.  Tier A material (spec §1) — read-only
    // tables stay at module scope, immutable.
    const isConst = /\bconst\b/.test(typeStr || '');
    if (isConst) {
        const exportPrefix = node.storageClass === 'static' ? '' : 'export ';
        return `${exportPrefix}const ${name} = ${initJs};`;
    }

    // Mutable global → spec §2 says hoist onto `game`.  Per-TU within-
    // file references rewrite via ctx.gameHoistedNames in declRefExpr.
    // Cross-TU game references will require a tree-wide pre-pass to
    // share the hoisted-names set; for now, single-file flatten.
    ctx.gameImportNeeded = true;
    ctx.gameHoistedNames.add(rawName);
    return `game.${name} = ${initJs};`;
}

// ── Statements ──────────────────────────────────────────────────

function stmt(node, ctx) {
    switch (node.kind) {
        case 'CompoundStmt':         return compoundStmt(node, ctx);
        case 'DeclStmt':             return declStmt(node, ctx);
        case 'ReturnStmt':           return returnStmt(node, ctx);
        case 'IfStmt':               return ifStmt(node, ctx);
        case 'WhileStmt':            return whileStmt(node, ctx);
        case 'ForStmt':              return forStmt(node, ctx);
        case 'DoStmt':               return doStmt(node, ctx);
        case 'SwitchStmt':           return switchStmt(node, ctx);
        case 'NullStmt':             return ctx.pad() + ';';
        case 'BreakStmt':            return ctx.pad() + bareBreakJs(ctx);
        case 'ContinueStmt':         return ctx.pad() + bareContinueJs(ctx);
        case 'GotoStmt':             return gotoStmt(node, ctx);
        case 'LabelStmt':            return labelStmtFreestanding(node, ctx);
        case 'SyntheticText':        return ctx.pad() + node.text;
        case 'AttributedStmt':       return attributedStmt(node, ctx);
        // CaseStmt and DefaultStmt only appear inside a switch body —
        // handled there directly.  If we get one here, it's a bug or a
        // weird case-not-immediately-in-switch (gcc extension); emit a
        // labelled section.
        case 'CaseStmt':             return caseStmtFreestanding(node, ctx);
        case 'DefaultStmt':          return defaultStmtFreestanding(node, ctx);
        // Expressions used as statements
        default:
            if (isExpr(node)) return ctx.pad() + exprStmt(node, ctx) + ';';
            return ctx.pad() + `// TODO unhandled stmt ${node.kind}\n`;
    }
}

// Bare `break;` emission, frame-aware.  In C a bare break binds to
// the innermost loop OR switch; in JS likewise — EXCEPT when the
// innermost JS construct is a synthetic back-jump `LABEL: while
// (true)` wrapper that doesn't exist in C.  There the break must be
// re-pointed at the enclosing real loop's generated label.
function bareBreakJs(ctx) {
    const frames = ctx.breakFrames;
    const top = frames[frames.length - 1];
    if (top && top.kind === 'synthetic' && top.outerLabel) {
        return `break ${top.outerLabel};`;
    }
    return 'break;';
}

// Bare `continue;` emission, frame-aware.  Continue is transparent
// to switch in both languages, so walk down past switch frames; if
// the first loop-like frame reached is a synthetic back-jump
// wrapper, re-point at the enclosing real loop's label.
function bareContinueJs(ctx) {
    const frames = ctx.breakFrames;
    for (let i = frames.length - 1; i >= 0; i--) {
        const f = frames[i];
        if (f.kind === 'switch') continue;
        if (f.kind === 'synthetic' && f.outerLabel) {
            return `continue ${f.outerLabel};`;
        }
        break;
    }
    return 'continue;';
}

// Names of libc / NetHack functions that look like
// `result-into-first-arg` mutators in C but return the value in our
// JS shims.  When such a call appears at statement level, rewrite
// `f(LHS, ...)` → `LHS = f(LHS, ...)` so the destination buffer
// actually receives the result.  Avoids surprising JS-string
// immutability when the C side relied on in-place mutation.
const MUTATING_STR_CALLS = new Set([
    'strcpy', 'strncpy', 'strcat', 'strncat',
    'Strcpy', 'Strcat',  // NetHack macros (post-cpp same names)
    'sprintf', 'snprintf',
    'nh_snprintf',
    // NetHack utility functions whose recognized form (in
    // SPECIAL_FUNCTION_RECOGNIZERS / STRING_TRANSFORM_RECOGNIZERS)
    // returns a new string; statement-level callsites need the
    // assign treatment so the caller's variable receives the
    // mutated value.  Without this, `mungspaces(buf);` is a no-op.
    'copynchars',
    'mungspaces', 'lcase', 'ucase', 'upstart',
    'trimspaces', 'strip_newline', 'stripdigits',
    's_suffix', 'ing_suffix', 'tabexpand',
    'strcasecpy', 'strkitten',
    'stripchars', 'strsubst',
    'xcrypt',
    // Void-returning C functions that mutate their first char* arg
    // and are paired with RETURNS_FIRST_ARG below to convert them
    // into return-the-buffer JS form.
    'disco_append_typename',
]);

// C functions declared with non-meaningful return value (often `void`
// or a return type that's just the input buffer for chaining) which
// mutate their first parameter via Strcat/etc.  After translation,
// the body's mutations through MUTATING_STR_CALLS rewriting become
// reassignments to the parameter local — but the function lacks an
// explicit `return` statement, so callers see undefined.  Injecting
// `return PARAM;` at the body's end makes the function pair correctly
// with MUTATING_STR_CALLS-aware callsites.
const RETURNS_FIRST_ARG = new Set([
    'disco_append_typename',
]);

// §23.239 — void-char*-out-param convention.  C functions whose
// OUT-PARAM is a `char *` the caller reads back after the call
// (`getlin(qbuf, buf); if (!strcmp(buf, "\\033")) ...`).  JS strings
// pass by value, so NO implementation can write back through the
// param — the callee must RETURN the buffer and call sites must
// rebind.  Maps fn name → out-param index.  Effects:
//   1. callee: every bare `return;` emits `return <param>;` and a
//      trailing `return <param>;` is appended (mid-body returns
//      covered, unlike RETURNS_FIRST_ARG's end-only injection);
//   2. call sites: statement-level `f(q, buf)` rewrites to
//      `buf = f(q, buf)` via the MUTATING_STR_CALLS machinery
//      (dst index from MUTATING_STR_CALL_DST_IDX below).
// `fillbuf` exists only in self-test 55 (no NetHack collision).
const VOID_CHAR_OUT_PARAM_RETURNS = new Map([
    ['getlin', 1],
    ['fillbuf', 1],
]);

function exprStmt(node, ctx) {
    // Statement-level CallExpr to a mutating-string helper:
    // the C call mutates its first arg, but our JS shim returns
    // the result.  Promote `f(LHS, ...)` to `LHS = f(LHS, ...)`.
    // Strip any wrapper a NetHack macro might leave: `(void)` cast,
    // implicit conversions, parens.
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr'
            || n.kind === 'CStyleCastExpr')) {
        n = n.inner?.[0];
    }
    if (n?.kind === 'CallExpr') {
        const baseName = calleeBase(n.inner?.[0]);
        if ((MUTATING_STR_CALLS.has(baseName)
                || VOID_CHAR_OUT_PARAM_RETURNS.has(baseName))
            && n.inner?.length >= 2) {
            // Most callees in MUTATING_STR_CALLS take the destination
            // buffer as the first arg (n.inner[1]).  The nh_snprintf
            // family is special — args are (label, line, dst, size,
            // fmt, ...) — so the dst lives at n.inner[3].  Without
            // this offset the captured LHS would be the StringLiteral
            // "label" or the integer line number, which fails the
            // lvalue check below and silently skips capture.
            // VOID_CHAR_OUT_PARAM_RETURNS callees carry their own
            // out-param index (n.inner[idx+1]: inner[0] is the callee).
            const dstArgIdx = (baseName === 'nh_snprintf') ? 3
                : VOID_CHAR_OUT_PARAM_RETURNS.has(baseName)
                    ? VOID_CHAR_OUT_PARAM_RETURNS.get(baseName) + 1 : 1;
            if (n.inner.length <= dstArgIdx) return expr(node, ctx);
            const lhsArg = n.inner[dstArgIdx];
            // The first arg might be wrapped in ImplicitCastExpr
            // (array-decay).  Render it directly so we get the bare
            // identifier / member-expression for both lhs assignment
            // and call-arg form.
            let target = lhsArg;
            while (target && (target.kind === 'ParenExpr' || target.kind === 'ImplicitCastExpr')) {
                target = target.inner?.[0];
            }
            // Only rewrite when the target is a simple lvalue we can
            // assign to — DeclRef, MemberExpr, or ArraySubscript.
            const lvalueLike = ['DeclRefExpr', 'MemberExpr', 'ArraySubscriptExpr'];
            if (lvalueLike.includes(target.kind)) {
                const lhs = expr(target, ctx);
                const callJs = expr(node, ctx);
                return `${lhs} = ${callJs}`;
            }
        }
    }
    return expr(node, ctx);
}

// Detect the C string-copy idiom over a 3-statement sequence:
//   p = dest_arr;                            // dest_arr is char[N]
//   for (k = 0; k < N; ++k) *p++ = *src++;
//   *p = '\0';
// Returns `{ length, js }` or null.  When matched, emit the JS form:
//   dest_arr = src.slice(0, N);
//   src = src.slice(N);
// The source pointer advances naturally so cascading copies (e.g.
// time_from_yyyymmddhhmmss's six successive triples) work correctly.
function detectStringCopyIdiom(stmts, idx, ctx) {
    if (idx + 2 >= stmts.length) return null;
    const s0 = stmts[idx], s1 = stmts[idx + 1], s2 = stmts[idx + 2];
    // s0: BinaryOperator(=) with both sides plain DeclRef.
    if (s0?.kind !== 'BinaryOperator' || s0.opcode !== '=') return null;
    const s0Lhs = stripCasts(s0.inner?.[0]);
    const s0Rhs = stripCasts(s0.inner?.[1]);
    if (s0Lhs?.kind !== 'DeclRefExpr' || s0Rhs?.kind !== 'DeclRefExpr') return null;
    const pName = s0Lhs.referencedDecl?.name || s0Lhs.name;
    const destName = s0Rhs.referencedDecl?.name || s0Rhs.name;
    if (!pName || !destName) return null;
    // Destination must be a char[N] array.  After array-to-pointer
    // decay clang's outer ImplicitCastExpr type is `char *`, but the
    // inner DeclRefExpr keeps the original `char [N]` type.  Try both.
    const t1 = (s0.inner?.[1]?.type?.qualType || '').replace(/^const\s+/, '').trim();
    const t2 = (s0Rhs.type?.qualType || '').replace(/^const\s+/, '').trim();
    if (!/^char\s*\[\s*\d+\s*\]$/.test(t1) && !/^char\s*\[\s*\d+\s*\]$/.test(t2)) return null;

    // s1: ForStmt with the right shape.
    if (s1?.kind !== 'ForStmt') return null;
    const loopParts = extractCountedLoop(s1);
    if (!loopParts) return null;
    const { counterName, bound, body } = loopParts;
    const copyParts = extractStarPostIncCopy(body, pName);
    if (!copyParts) return null;
    const srcName = copyParts.srcName;

    // s2: BinaryOperator(=) with LHS `*p` (our pName) and RHS NUL.
    if (s2?.kind !== 'BinaryOperator' || s2.opcode !== '=') return null;
    const s2Lhs = s2.inner?.[0];
    if (s2Lhs?.kind !== 'UnaryOperator' || s2Lhs.opcode !== '*') return null;
    const s2LhsRef = stripCasts(s2Lhs.inner?.[0]);
    if (s2LhsRef?.kind !== 'DeclRefExpr') return null;
    const s2LhsName = s2LhsRef.referencedDecl?.name || s2LhsRef.name;
    if (s2LhsName !== pName) return null;
    if (!isNulCharLiteral(s2.inner?.[1])) return null;

    // Emit JS form.  Both `destName` and `srcName` should already be
    // string-typed in the function (dest is the local char[N], src is
    // a function parameter or earlier-assigned char*).
    const dest = renameIfReserved(destName);
    const src = renameIfReserved(srcName);
    const js = `${ctx.pad()}${dest} = ${src}.slice(0, ${bound});\n`
        + `${ctx.pad()}${src} = ${src}.slice(${bound});`;
    return { length: 3, js };
}

// Extract counter name and constant bound from a counted ForStmt
// matching `for (k = 0; k < N; ++k)` or similar, plus its body.
// Returns `{ counterName, bound, body }` or null.
function extractCountedLoop(forNode) {
    // clang's ForStmt inner is typically [init, condVar?, cond, inc, body]
    // We accept either 4 or 5 children depending on whether condVar is
    // present (it's null when there's no `int k = 0` declaration).
    const inner = forNode.inner || [];
    if (inner.length < 4) return null;
    let init, cond, inc, body;
    if (inner.length === 5) {
        [init, , cond, inc, body] = inner;
    } else {
        [init, cond, inc, body] = inner;
    }
    // init: BinaryOperator(=) with RHS IntegerLiteral 0 — k = 0.
    const initStrip = stripCasts(init);
    if (initStrip?.kind !== 'BinaryOperator' || initStrip.opcode !== '=') return null;
    const initLhs = stripCasts(initStrip.inner?.[0]);
    const initRhs = stripCasts(initStrip.inner?.[1]);
    if (initLhs?.kind !== 'DeclRefExpr') return null;
    if (initRhs?.kind !== 'IntegerLiteral' || initRhs.value !== '0') return null;
    const counterName = initLhs.referencedDecl?.name || initLhs.name;
    // cond: BinaryOperator(<) with LHS DeclRef(counter) and RHS IntegerLiteral.
    const condStrip = stripCasts(cond);
    if (condStrip?.kind !== 'BinaryOperator' || condStrip.opcode !== '<') return null;
    const condLhs = stripCasts(condStrip.inner?.[0]);
    const condRhs = stripCasts(condStrip.inner?.[1]);
    if (condLhs?.kind !== 'DeclRefExpr') return null;
    if ((condLhs.referencedDecl?.name || condLhs.name) !== counterName) return null;
    if (condRhs?.kind !== 'IntegerLiteral') return null;
    const bound = condRhs.value;
    // inc: UnaryOperator '++' on the same counter.
    const incStrip = stripCasts(inc);
    if (incStrip?.kind !== 'UnaryOperator' || incStrip.opcode !== '++') return null;
    const incRef = stripCasts(incStrip.inner?.[0]);
    if (incRef?.kind !== 'DeclRefExpr') return null;
    if ((incRef.referencedDecl?.name || incRef.name) !== counterName) return null;
    return { counterName, bound, body };
}

// Detect a body of `*p++ = *src++;` (possibly wrapped in a CompoundStmt
// of one statement).  pName is the expected dest pointer name.
// Returns `{ srcName }` or null.
function extractStarPostIncCopy(body, pName) {
    let stmt = body;
    if (stmt?.kind === 'CompoundStmt') {
        if ((stmt.inner || []).length !== 1) return null;
        stmt = stmt.inner[0];
    }
    if (!stmt || stmt.kind !== 'BinaryOperator' || stmt.opcode !== '=') return null;
    // LHS: UnaryOp(*) → UnaryOp(p++ postfix) → DeclRef(p).
    const lhs = stripCasts(stmt.inner?.[0]);
    if (lhs?.kind !== 'UnaryOperator' || lhs.opcode !== '*') return null;
    const lhsInc = stripCasts(lhs.inner?.[0]);
    if (lhsInc?.kind !== 'UnaryOperator' || lhsInc.opcode !== '++' || !lhsInc.isPostfix) return null;
    const lhsRef = stripCasts(lhsInc.inner?.[0]);
    if (lhsRef?.kind !== 'DeclRefExpr') return null;
    if ((lhsRef.referencedDecl?.name || lhsRef.name) !== pName) return null;
    // RHS: (LValueToRValue?) UnaryOp(*) → UnaryOp(src++ postfix) →
    // DeclRef(src).  The outer LValueToRValue cast is what `expr` reads.
    const rhs = stripCasts(stmt.inner?.[1]);
    if (rhs?.kind !== 'UnaryOperator' || rhs.opcode !== '*') return null;
    const rhsInc = stripCasts(rhs.inner?.[0]);
    if (rhsInc?.kind !== 'UnaryOperator' || rhsInc.opcode !== '++' || !rhsInc.isPostfix) return null;
    const rhsRef = stripCasts(rhsInc.inner?.[0]);
    if (rhsRef?.kind !== 'DeclRefExpr') return null;
    const srcName = rhsRef.referencedDecl?.name || rhsRef.name;
    if (!srcName) return null;
    return { srcName };
}

// Detect the C "struct-array pointer walk via comma-inc" idiom:
//   p = ARR_EXPR;        // pre-loop: p set to start of array
//   for (j = 0; j < N; p++, j++) { use p->field }
// or with prefix variants of the increment.  Translator emits
// `(p = __nh_blackhole), j++` for the inc, breaking the loop.
// Returns { length, js } or null.  When matched, emits indexed
// iteration where p is re-derived from the captured array each
// iteration.
// Detect the C "struct-ptr sentinel walk via while loop" idiom:
//   const struct X *p = arr_or_anything_that_yields_an_array;
//   ...intervening stmts not assigning to p...
//   while (p->field) {
//       body...
//       p++;
//   }
// Translator emits `(p = __nh_blackhole)` for the `p++`, so the
// while-loop body runs once then exits.  Rewrite the WhileStmt to
// a for-loop that captures the current value of `p` (which IS the
// array reference, since p was set by `p = arr`) into a temp and
// indexes into it.  The original init statement is left intact —
// only the WhileStmt is replaced.
//
// Pattern requirements:
//   stmts[idx]: WhileStmt with body=CompoundStmt whose LAST
//               child is UnaryOp(++/--, p), where p is a struct-
//               pointer local.  No assignment to p anywhere in
//               the body other than the final p++ (so mid-body
//               re-targets like adjabil's `abil = rabil` chained
//               walk are rejected — those aren't simple sentinel
//               walks).
//
// Look-backward (within the enclosing CompoundStmt):
//   We do NOT require the init statement to be immediately before
//   the WhileStmt.  Other intervening assignments are allowed,
//   provided none of them re-target `p`.  We optionally find the
//   init to extract a start-offset (so `p = arr + N` walks from
//   N); if not found, default to start=0.
//
// The temp-capture form makes the rewrite safe regardless of init
// shape: even if `p = some_function_call()`, the function isn't
// re-invoked per iteration.
function detectWhilePtrWalk(stmts, idx, ctx) {
    const s_while = stmts[idx];
    if (s_while?.kind !== 'WhileStmt') return null;

    // WhileStmt: extract cond and body CompoundStmt.
    const [w_cond, w_body] = s_while.inner || [];
    if (!w_body || w_body.kind !== 'CompoundStmt') return null;
    const body_children = w_body.inner || [];
    if (!body_children.length) return null;

    // Last body stmt must be `p++` or `p--` on a struct-pointer local.
    const last = body_children[body_children.length - 1];
    const lastStrip = stripCasts(last);
    if (lastStrip?.kind !== 'UnaryOperator') return null;
    if (lastStrip.opcode !== '++' && lastStrip.opcode !== '--') return null;
    const incRef = stripCasts(lastStrip.inner?.[0]);
    if (incRef?.kind !== 'DeclRefExpr') return null;
    if (!isStructPtrLocal(incRef, ctx)) return null;
    const ptrVar = incRef.referencedDecl?.name || incRef.name;
    if (!ptrVar) return null;

    // Reject if p is reassigned anywhere in the body other than the
    // trailing p++.  Walks the body[0..n-2] (skip the last) and any
    // sub-expressions looking for `p = ...` assignments.  Catches
    // patterns like adjabil's `abil = rabil` chained-list walk.
    const bodyExceptLast = body_children.slice(0, -1);
    if (bodyContainsAssignmentTo(bodyExceptLast, ptrVar)) return null;

    // Look backward through the enclosing CompoundStmt to find the
    // init of p.  This is optional — used only to extract a start-
    // offset.  We scan back to stmts[0]; if any intervening stmt
    // assigns to p (other than the init we want), we give up
    // (because tracking the array reference becomes ambiguous).
    let startNode = null;
    for (let j = idx - 1; j >= 0; j--) {
        const s = stmts[j];
        // DeclStmt VarDecl(p, init=...)
        if (s?.kind === 'DeclStmt') {
            const decls = (s.inner || []).filter((n) => n.kind === 'VarDecl' && n.name === ptrVar);
            if (decls.length === 1) {
                const vd = decls[0];
                const init = (vd.inner || []).find(isExpr);
                if (init) {
                    const synthLhs = {
                        kind: 'DeclRefExpr',
                        type: { qualType: vd.type?.qualType || '' },
                        referencedDecl: { name: vd.name },
                    };
                    const synth = {
                        kind: 'BinaryOperator', opcode: '=',
                        inner: [synthLhs, init],
                    };
                    const parsed = parsePtrInitAssignment(synth, ctx);
                    if (parsed) startNode = parsed.startNode;
                }
                break;
            }
        }
        // BinaryOp(=, p, ...)
        const ss = stripCasts(s);
        if (ss?.kind === 'BinaryOperator' && ss.opcode === '=') {
            const lhs = stripCasts(ss.inner?.[0]);
            if (lhs?.kind === 'DeclRefExpr'
                && (lhs.referencedDecl?.name || lhs.name) === ptrVar) {
                const parsed = parsePtrInitAssignment(ss, ctx);
                if (parsed) startNode = parsed.startNode;
                break;
            }
        }
    }

    // Emit:
    //   const __nhi_<p>_arr = <p>;   // capture array reference
    //   for (let __nhi_<p> = START; (<p> = __nhi_<p>_arr[__nhi_<p>]) && (cond); __nhi_<p>++) {
    //       body[0..n-1]   // body with last p++ stripped
    //   }
    const ptrJs = renameIfReserved(ptrVar);
    const idxVar = `__nhi_${ptrVar}`;
    const arrTmp = `__nhi_${ptrVar}_arr`;
    const startJs = startNode && isExpr(startNode) ? expr(startNode, ctx) : '0';
    const condJs = w_cond && isExpr(w_cond) ? expr(w_cond, ctx) : '';
    const headExpr = condJs
        ? `(${ptrJs} = ${arrTmp}[${idxVar}]) && (${condJs})`
        : `(${ptrJs} = ${arrTmp}[${idxVar}])`;
    const trimmedBody = {
        kind: 'CompoundStmt',
        inner: bodyExceptLast,
    };
    const captureJs = `${ctx.pad()}const ${arrTmp} = ${ptrJs};`;
    const forJs = `${captureJs}\n${ctx.pad()}for (let ${idxVar} = ${startJs}; ${headExpr}; ${idxVar}++) ${compoundStmt(trimmedBody, ctx)}`;
    return { length: 1, js: forJs };
}

// True if `stmts` (or sub-expressions within) contains an assignment
// to `name` (`name = X`, `++name`, `--name`, or compound assignment).
// Used to gate detectWhilePtrWalk: if the pointer is re-targeted
// inside the body, the walk isn't a simple sentinel walk and the
// rewrite would change semantics.
function bodyContainsAssignmentTo(stmts, name) {
    const visit = (n) => {
        if (!n || typeof n !== 'object') return false;
        if (n.kind === 'BinaryOperator' && isAssignmentOp(n.opcode)) {
            const lhs = stripCasts(n.inner?.[0]);
            if (lhs?.kind === 'DeclRefExpr'
                && (lhs.referencedDecl?.name || lhs.name) === name) {
                return true;
            }
        }
        if (n.kind === 'UnaryOperator'
            && (n.opcode === '++' || n.opcode === '--')) {
            const tgt = stripCasts(n.inner?.[0]);
            if (tgt?.kind === 'DeclRefExpr'
                && (tgt.referencedDecl?.name || tgt.name) === name) {
                return true;
            }
        }
        for (const child of n.inner || []) {
            if (visit(child)) return true;
        }
        return false;
    };
    for (const s of stmts) {
        if (visit(s)) return true;
    }
    return false;
}

function detectStructPtrCounterLoop(stmts, idx, ctx) {
    if (idx + 1 >= stmts.length) return null;
    const s_prev = stmts[idx];
    const s_for = stmts[idx + 1];

    // s_prev: `p = ARR[N]` or `p = ARR` where p is struct-ptr local.
    if (s_prev?.kind !== 'BinaryOperator' || s_prev.opcode !== '=') return null;
    const prevLhs = stripCasts(s_prev.inner?.[0]);
    if (prevLhs?.kind !== 'DeclRefExpr') return null;
    if (!isStructPtrLocal(prevLhs, ctx)) return null;
    const ptrName = prevLhs.referencedDecl?.name || prevLhs.name;
    if (!ptrName) return null;

    // s_for: ForStmt with init `j = 0` (counter), inc comma-expr with
    // both `p++` and `j++`.
    if (s_for?.kind !== 'ForStmt') return null;
    const inner = s_for.inner || [];
    let f_init, f_cond, f_inc, f_body;
    if (inner.length === 5) [f_init, , f_cond, f_inc, f_body] = inner;
    else if (inner.length === 4) [f_init, f_cond, f_inc, f_body] = inner;
    else return null;

    // init: simple counter `j = 0`.
    const initStrip = stripCasts(f_init);
    if (initStrip?.kind !== 'BinaryOperator' || initStrip.opcode !== '=') return null;
    const initLhs = stripCasts(initStrip.inner?.[0]);
    const initRhs = stripCasts(initStrip.inner?.[1]);
    if (initLhs?.kind !== 'DeclRefExpr') return null;
    if (initRhs?.kind !== 'IntegerLiteral' || initRhs.value !== '0') return null;
    const counterName = initLhs.referencedDecl?.name || initLhs.name;
    if (!counterName || counterName === ptrName) return null;

    // inc: BinaryOp `,` with two operands — one is `p++` on struct-ptr,
    // other is `j++/++j` on counter.
    const incStrip = stripCasts(f_inc);
    if (incStrip?.kind !== 'BinaryOperator' || incStrip.opcode !== ',') return null;
    const incOps = flattenCommas(incStrip);
    let foundPtrInc = false, foundCounterInc = false;
    for (const op of incOps) {
        const o = stripCasts(op);
        if (o?.kind !== 'UnaryOperator') continue;
        if (o.opcode !== '++' && o.opcode !== '--') continue;
        const ref = stripCasts(o.inner?.[0]);
        if (ref?.kind !== 'DeclRefExpr') continue;
        const name = ref.referencedDecl?.name || ref.name;
        if (name === ptrName && isStructPtrLocal(ref, ctx)) foundPtrInc = true;
        else if (name === counterName) foundCounterInc = true;
    }
    if (!foundPtrInc || !foundCounterInc) return null;

    // Now emit:
    //   <s_prev as-is>
    //   for (let __i_p = 0; <cond using counter as-is>; __i_p++) {
    //     <p> = ARR_BASE[ARR_START + __i_p];
    //     <body>
    //   }
    // To capture ARR_BASE and ARR_START from `p = ARR[N]`:
    //   - if RHS is ArraySubscriptExpr, extract base and start index
    //   - else (e.g. `p = arr` where arr is decayed array), use the
    //     RHS as the base with 0 start index
    const prevRhs = stripCasts(s_prev.inner?.[1]);
    let arrBase, startIdx;
    if (prevRhs?.kind === 'ArraySubscriptExpr') {
        arrBase = expr(prevRhs.inner?.[0], ctx);
        const startNode = stripCasts(prevRhs.inner?.[1]);
        if (startNode?.kind === 'IntegerLiteral' && startNode.value === '0') {
            startIdx = null;
        } else {
            startIdx = expr(prevRhs.inner?.[1], ctx);
        }
    } else {
        // RHS is a plain DeclRef or member expr — treat as the array.
        // Strip a trailing `[0]` if clang's array-decay added it.
        let raw = expr(s_prev.inner?.[1], ctx);
        raw = raw.replace(/\[0\]$/, '');
        arrBase = raw;
        startIdx = null;
    }

    const counterJs = renameIfReserved(counterName);
    const ptrJs = renameIfReserved(ptrName);
    const condJs = f_cond && isExpr(f_cond) ? expr(f_cond, ctx) : '';
    // Use the existing counter as the iteration variable (the cond
    // already references it).  Increment counter only; drop the
    // pointer-postinc.  Inside body, re-derive p from ARR.
    const idxExpr = startIdx ? `${startIdx} + ${counterJs}` : counterJs;
    const initJs = `${counterJs} = 0`;
    const innerPad = ctx.pad() + '    ';
    const bodyJs = stmtBlockOrBraced(f_body, ctx).replace(
        /^\{/,
        `{\n${innerPad}${ptrJs} = ${arrBase}[${idxExpr}];`,
    );
    const incJs = `${counterJs}++`;
    const forJs = `${ctx.pad()}${expr(s_prev, ctx)};\n${ctx.pad()}for (${initJs}; ${condJs}; ${incJs}) ${bodyJs}`;
    return { length: 2, js: forJs };
}

// Walk a subtree collecting the set of declIds referenced by GotoStmt
// nodes inside it.  Used by classifyAllBackward to decide whether a
// label is forward-only, backward-only, or mixed.
function collectGotoTargets(node, into) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'GotoStmt' && node.targetLabelDeclId) {
        into.add(node.targetLabelDeclId);
    }
    for (const c of node.inner || []) collectGotoTargets(c, into);
}

// Returns true iff every top-level LabelStmt in `stmts` (at positions
// in labelIndices) is backward-only: every GotoStmt referencing the
// label is in a stmt at a position >= labelIdx.  Used to gate the
// pure-back-jump emit path in compoundStmt.
function classifyAllBackward(stmts, labelIndices, ctx) {
    for (const labelIdx of labelIndices) {
        const labelStmt = stmts[labelIdx];
        const declId = labelStmt.declId;
        if (!declId) return false;
        // Scan pre-label stmts: if any goto in their subtree targets
        // this label, it's a forward goto → not pure back-jump.
        for (let j = 0; j < labelIdx; j++) {
            const targets = new Set();
            collectGotoTargets(stmts[j], targets);
            if (targets.has(declId)) return false;
        }
        // Require at least one back-goto so we know the rewrite is
        // worth doing.  A label with NO gotos at all is dead code and
        // the existing forward-goto wrapper handles it idempotently.
        let sawBackGoto = false;
        for (let j = labelIdx; j < stmts.length; j++) {
            const targets = new Set();
            collectGotoTargets(stmts[j], targets);
            if (targets.has(declId)) sawBackGoto = true;
        }
        if (!sawBackGoto) return false;
    }
    return true;
}

// Pure-back-jump emit path.  Pre-label stmts emit as-is; the post-
// label segment is wrapped in `LABEL: while (true) { ...; break; }`.
// For multi-label backward-only compounds (every label is back-jump
// only), the labels are nested in source order — each later label
// opens a fresh while-true loop INSIDE the previous one.  Gotos to
// LABEL emit as `continue LABEL` (handled by gotoStmt via
// ctx.backJumpLabels); JS labeled-continue can target any enclosing
// labeled loop, so deeply-nested gotos resolve correctly.
//
// Example for two backward-only labels (L1 at idx 0, L2 at idx 5):
//   {
//       L1: while (true) {
//           ...L1-inner + stmts 1..4...
//           L2: while (true) {
//               ...L2-inner + stmts 6..end...
//               break;     // fall-through exit for L2
//           }
//           break;         // fall-through exit for L1 (only reached
//                          // after L2 breaks naturally)
//       }
//   }
function emitPureBackJump(stmts, labelIndices, ctx, lines) {
    // C labels are transparent to break/continue: bare continue/
    // break in the post-label segment bind to the ENCLOSING loop.
    // The synthetic `LABEL: while (true)` wrapper below would
    // capture them (invent.c getobj redo_menu: the "You don't have
    // that object." `continue` must re-read the prompt via the
    // outer for(;;), not respin the wrapper).  If the innermost
    // enclosing breakable frame is a labelable plain loop, give it
    // a generated label and re-point bare continue/break at it via
    // synthetic frames (see bareBreakJs/bareContinueJs).  When the
    // enclosing frame is a switch or a restructured recognizer
    // loop, fall back to today's emit (outerLabel stays null).
    let outerLabel = null;
    const enclFrame = ctx.breakFrames[ctx.breakFrames.length - 1];
    if (enclFrame && enclFrame.kind === 'loop' && enclFrame.labelable) {
        if (!enclFrame.label) {
            enclFrame.label =
                `__outer_${renameIfReserved(stmts[labelIndices[0]].name)}`;
        }
        outerLabel = enclFrame.label;
    }
    // Pre-(first-label) segment: emit unchanged.
    const firstLabelIdx = labelIndices[0];
    // Track prevEndLine for inside-body comment capture (§23.122).
    // Seed with the FIRST child's start line so leading comments
    // are emitted via the outer translateUnit pass, not duplicated
    // here.  -1 disables capture until the first stmt has been emit.
    let prevEndLine = null;
    for (const child of stmts.slice(0, firstLabelIdx)) {
        const s = stmt(child, ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, child, s);
        if (s) lines.push(s);
    }
    // Open all labeled loops, recursing through the label indices to
    // emit each label's inner segment in nested order.
    const openLabel = (i) => {
        const labelIdx = labelIndices[i];
        const labelStmt = stmts[labelIdx];
        const labelName = renameIfReserved(labelStmt.name);
        const hadBack = ctx.backJumpLabels.has(labelName);
        const hadReach = ctx.reachableLabels.has(labelName);
        ctx.backJumpLabels.add(labelName);
        ctx.reachableLabels.add(labelName);
        lines.push(`${ctx.pad()}${labelName}: while (true) {`);
        ctx.indent++;
        // Synthetic frame: bare continue/break emitted inside this
        // wrapper re-point at the enclosing real loop's label (no-op
        // when outerLabel is null).  Nested labels push their own.
        ctx.breakFrames.push({ kind: 'synthetic', outerLabel });
        // Emit the LabelStmt's inner (the C source's stmt immediately
        // following the label declaration).
        const inner = labelStmt.inner?.[0];
        if (inner && inner.kind !== 'NullStmt') {
            const s = stmt(inner, ctx);
            prevEndLine = captureInsideComments(ctx, prevEndLine, inner, s);
            if (s) lines.push(s);
        }
        // Trailing siblings between this label and the next (or end).
        const nextLabelIdx = labelIndices[i + 1] ?? stmts.length;
        for (const child of stmts.slice(labelIdx + 1, nextLabelIdx)) {
            const s = stmt(child, ctx);
            prevEndLine = captureInsideComments(ctx, prevEndLine, child, s);
            if (s) lines.push(s);
        }
        // If there's another label after this one, open it inside the
        // current loop.  Its `break;` will fall through to this loop's
        // `break;` (correct C-fall-through semantics).
        if (i + 1 < labelIndices.length) {
            openLabel(i + 1);
        }
        ctx.breakFrames.pop();
        lines.push(`${ctx.pad()}break;`);
        if (!hadBack) ctx.backJumpLabels.delete(labelName);
        if (!hadReach) ctx.reachableLabels.delete(labelName);
        ctx.indent--;
        lines.push(`${ctx.pad()}}`);
    };
    openLabel(0);
}

// A4 recognizer — forward goto into a nested IfStmt body.
//
// Detects the pattern:
//     [pre-stmts]
//     if (condA) goto LABEL;       // possibly multiple goto sites
//     [intervening stmts]
//     if (condB) {
//         LABEL:
//         [body]                   // post-label stmts inside the if
//     }
//     [post-stmts]
//
// And rewrites as:
//     [pre-stmts]
//     let __goto_LABEL = (0);
//     if (condA) __goto_LABEL = (1);
//     if (!__goto_LABEL) { [intervening stmts] }
//     if (__goto_LABEL || condB) {
//         [labelInner + post-label stmts]
//     }
//     [post-stmts]
//
// Each `goto LABEL` becomes `__goto_LABEL = (1);` (gotoStmt picks
// this up via ctx.forwardGotoFlags), and the intervening stmts are
// gated on `!__goto_LABEL` so they skip when the goto fires.

// Returns { declId, name, ifCond, labelStmt, postLabelStmts } if
// `s` is an IfStmt whose THEN-body is a CompoundStmt whose first
// child is a LabelStmt — i.e., a candidate target for A4 rewrite.
// Rejects if-else (the rewrite would need to preserve else-branch
// semantics, deferred to a later slice).
function detectForwardIntoIfTarget(s) {
    if (!s || s.kind !== 'IfStmt') return null;
    const inner = s.inner || [];
    if (inner.length < 2) return null;
    if (inner.length >= 3 && inner[2]) return null; // if-else not yet supported
    const body = inner[1];
    if (!body || body.kind !== 'CompoundStmt') return null;
    const bodyChildren = body.inner || [];
    if (bodyChildren.length === 0) return null;
    const first = bodyChildren[0];
    if (first.kind !== 'LabelStmt' || !first.declId) return null;
    return {
        declId: first.declId,
        name: first.name,
        ifCond: inner[0],
        labelStmt: first,
        postLabelStmts: bodyChildren.slice(1),
    };
}

// True iff `s` is a "simple-goto-only" IfStmt: `if (cond) goto LABEL;`
// or `if (cond) { goto LABEL; }` (single goto in the then-body, no
// else, no other stmts).  Narrow slice rejects nested-goto sites
// (e.g. goto inside a for-loop body) because the rewrite to a flag-
// set wouldn't break out of the enclosing loop.
function isSimpleGotoOnlyIf(s, declId) {
    if (!s || s.kind !== 'IfStmt') return false;
    const inner = s.inner || [];
    if (inner.length < 2) return false;
    if (inner.length >= 3 && inner[2]) return false;
    const then = inner[1];
    if (then.kind === 'GotoStmt') {
        return then.targetLabelDeclId === declId;
    }
    if (then.kind === 'CompoundStmt') {
        const children = then.inner || [];
        if (children.length !== 1) return false;
        const c = children[0];
        return c.kind === 'GotoStmt' && c.targetLabelDeclId === declId;
    }
    return false;
}

// Search a CompoundStmt's children for an A4 match.  Returns
// { gotoIdxs, targetIdx, declId, name, ifCond, labelStmt,
//   postLabelStmts } if a match is found, else null.
function detectForwardIntoIf(stmts, ctx) {
    for (let k = 0; k < stmts.length; k++) {
        const candidate = detectForwardIntoIfTarget(stmts[k]);
        if (!candidate) continue;
        const declId = candidate.declId;
        // The target IfStmt itself must not contain a self-goto.
        const insideTarget = new Set();
        collectGotoTargets(stmts[k], insideTarget);
        if (insideTarget.has(declId)) continue;
        // Find all goto sites in sibling stmts.  Require every goto
        // to this label to be at index < k (forward only) AND for
        // each goto site to be a simple `if (cond) goto LABEL;` so
        // the flag-rewrite is single-stmt safe.
        const gotoIdxs = [];
        let bad = false;
        for (let i = 0; i < stmts.length; i++) {
            if (i === k) continue;
            const targets = new Set();
            collectGotoTargets(stmts[i], targets);
            if (!targets.has(declId)) continue;
            if (i > k) { bad = true; break; } // forward-only
            if (!isSimpleGotoOnlyIf(stmts[i], declId)) { bad = true; break; }
            gotoIdxs.push(i);
        }
        if (bad || gotoIdxs.length === 0) continue;
        return { gotoIdxs, targetIdx: k, ...candidate };
    }
    return null;
}

// A4 emit path.  See block comment above detectForwardIntoIfTarget
// for the input/output shape.
function emitForwardIntoIf(stmts, info, ctx, lines) {
    const labelKey = renameIfReserved(info.name);
    const flagName = `__goto_${labelKey}`;
    const firstGotoIdx = Math.min(...info.gotoIdxs);
    // Track prevEndLine for inside-body comment capture (§23.122).
    let prevEndLine = null;
    // Pre-(first-goto) stmts emit unchanged.
    for (let i = 0; i < firstGotoIdx; i++) {
        const s = stmt(stmts[i], ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[i], s);
        if (s) lines.push(s);
    }
    // Declare flag immediately before the first goto site.
    lines.push(`${ctx.pad()}let ${flagName} = (0);`);
    // Mark label for gotoStmt's flag-rewrite (save/restore so a
    // re-entrant compound with the same label name from another
    // function doesn't leak).
    const hadFlag = ctx.forwardGotoFlags.has(labelKey);
    const oldFlag = ctx.forwardGotoFlags.get(labelKey);
    ctx.forwardGotoFlags.set(labelKey, flagName);
    // Emit stmts[firstGotoIdx..targetIdx-1].  Gotos emit unchanged
    // (gotoStmt picks up the flag-rewrite via ctx).  Non-goto
    // intervening stmts are grouped into a single
    // `if (!flag) { ... }` block so they skip when the goto fires.
    const gotoSet = new Set(info.gotoIdxs);
    let i = firstGotoIdx;
    while (i < info.targetIdx) {
        if (gotoSet.has(i)) {
            const s = stmt(stmts[i], ctx);
            prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[i], s);
            if (s) lines.push(s);
            i++;
            continue;
        }
        const groupStart = i;
        while (i < info.targetIdx && !gotoSet.has(i)) i++;
        lines.push(`${ctx.pad()}if (!${flagName}) {`);
        ctx.indent++;
        for (let j = groupStart; j < i; j++) {
            const s = stmt(stmts[j], ctx);
            prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[j], s);
            if (s) lines.push(s);
        }
        ctx.indent--;
        lines.push(`${ctx.pad()}}`);
    }
    // Target IfStmt: merge cond with flag, inline label-inner +
    // post-label stmts directly (bypassing the inner compound's
    // forward-goto wrap that would otherwise emit `LABEL: { }`).
    const targetCondJs = expr(info.ifCond, ctx);
    lines.push(`${ctx.pad()}if (${flagName} || (${targetCondJs})) {`);
    ctx.indent++;
    const inner = info.labelStmt.inner?.[0];
    if (inner && inner.kind !== 'NullStmt') {
        const s = stmt(inner, ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, inner, s);
        if (s) lines.push(s);
    }
    for (const child of info.postLabelStmts) {
        const s = stmt(child, ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, child, s);
        if (s) lines.push(s);
    }
    ctx.indent--;
    lines.push(`${ctx.pad()}}`);
    // Restore ctx flag.
    if (!hadFlag) ctx.forwardGotoFlags.delete(labelKey);
    else ctx.forwardGotoFlags.set(labelKey, oldFlag);
    // Post-target stmts emit unchanged.
    for (let j = info.targetIdx + 1; j < stmts.length; j++) {
        const s = stmt(stmts[j], ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[j], s);
        if (s) lines.push(s);
    }
}

// A4 mixed-two-label recognizer.
//
// When a CompoundStmt has exactly TWO top-level labels where the
// first (in source order) is back-jump-only and the second is
// forward-only, neither A3 (pure-back-jump) nor the narrow A4
// (label-as-first-child-of-IfStmt-body) fires.  This recognizer
// handles that combined shape — the pickup.js doloot lootcont/
// lootmon canonical example.
//
// Mechanical rewrite:
//
//   [pre-L_back stmts containing goto-L_FWD sites]
//   let __goto_L_FWD = (0);
//   L_BACK: while (true) {
//       if (!__goto_L_FWD) {
//           [L_back.inner + stmts between L_back and L_fwd]
//       }
//       __goto_L_FWD = (0);   // reset so back-jump re-entries run L_back
//       [L_fwd.inner + post-L_fwd stmts]
//       break;                // fall-through exit
//   }
//
// `goto L_FWD` becomes `__goto_L_FWD = (1);` (via
// ctx.forwardGotoFlags); `goto L_BACK` becomes `continue L_BACK`
// (via ctx.backJumpLabels).  The flag-reset after the gated region
// ensures the goto-fwd's effect only suppresses L_back on the FIRST
// iteration; subsequent re-entries via continue run L_back normally.

// Returns { idx, declId, name, kind } where kind is one of
// 'backward', 'forward', 'mixed', 'dead'.
function classifyTopLevelLabel(stmts, labelIdx) {
    const labelStmt = stmts[labelIdx];
    const declId = labelStmt.declId;
    if (!declId) return null;
    let hasForward = false, hasBackward = false;
    for (let i = 0; i < stmts.length; i++) {
        if (i === labelIdx) continue;
        const targets = new Set();
        collectGotoTargets(stmts[i], targets);
        if (!targets.has(declId)) continue;
        if (i < labelIdx) hasForward = true;
        else hasBackward = true;
    }
    let kind;
    if (hasForward && hasBackward) kind = 'mixed';
    else if (hasForward) kind = 'forward';
    else if (hasBackward) kind = 'backward';
    else kind = 'dead';
    return { idx: labelIdx, declId, name: labelStmt.name, kind };
}

function detectMixedTwoLabel(stmts, labelIndices, ctx) {
    if (labelIndices.length !== 2) return null;
    const back = classifyTopLevelLabel(stmts, labelIndices[0]);
    const fwd = classifyTopLevelLabel(stmts, labelIndices[1]);
    if (!back || !fwd) return null;
    if (back.kind !== 'backward') return null;
    if (fwd.kind !== 'forward') return null;
    // Every forward goto site must be a simple-goto-only-if so the
    // flag-rewrite doesn't disturb loop / switch semantics.
    for (let i = 0; i < fwd.idx; i++) {
        if (i === back.idx) continue;
        const targets = new Set();
        collectGotoTargets(stmts[i], targets);
        if (!targets.has(fwd.declId)) continue;
        if (!isSimpleGotoOnlyIf(stmts[i], fwd.declId)) return null;
    }
    // Narrow slice: reject if there are top-level DeclStmts at
    // index >= back.idx (they'd need hoisting because the new emit
    // puts those stmts inside the while-true loop or its inner
    // `if (!flag)` block).  Pre-L_back DeclStmts are fine (emitted
    // outside the loop in the enclosing function scope).
    for (let i = back.idx; i < stmts.length; i++) {
        if (stmts[i].kind === 'DeclStmt') return null;
    }
    return { back, fwd };
}

function emitMixedTwoLabel(stmts, info, ctx, lines) {
    const backName = renameIfReserved(info.back.name);
    const fwdName = renameIfReserved(info.fwd.name);
    const flagName = `__goto_${fwdName}`;
    // Track prevEndLine for inside-body comment capture (§23.122).
    let prevEndLine = null;
    // Flag declaration goes at the top of the compound, BEFORE the
    // pre-L_back stmts (so the flag-set goto sites have access).
    lines.push(`${ctx.pad()}let ${flagName} = (0);`);
    // Mark forward label in ctx so gotos emit as flag-sets.
    const hadFwd = ctx.forwardGotoFlags.has(fwdName);
    const oldFwd = ctx.forwardGotoFlags.get(fwdName);
    ctx.forwardGotoFlags.set(fwdName, flagName);
    // Pre-L_back stmts: collect forward goto site indices to gate
    // any intervening non-goto stmts that come AFTER the first goto
    // (those would otherwise execute after the goto fired, which
    // violates C semantics — `goto LABEL` jumps OUT of the section,
    // skipping subsequent stmts).  Stmts BEFORE the first goto run
    // unconditionally and are emitted as-is.
    const fwdGotoIdxs = [];
    for (let i = 0; i < info.back.idx; i++) {
        const targets = new Set();
        collectGotoTargets(stmts[i], targets);
        if (targets.has(info.fwd.declId)) fwdGotoIdxs.push(i);
    }
    if (fwdGotoIdxs.length === 0) {
        // No goto sites in pre-L_back (the goto could still be inside
        // the L_back region or L_fwd region — those are gated below).
        for (let i = 0; i < info.back.idx; i++) {
            const s = stmt(stmts[i], ctx);
            prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[i], s);
            if (s) lines.push(s);
        }
    } else {
        const firstGotoIdx = fwdGotoIdxs[0];
        for (let i = 0; i < firstGotoIdx; i++) {
            const s = stmt(stmts[i], ctx);
            prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[i], s);
            if (s) lines.push(s);
        }
        const gotoSet = new Set(fwdGotoIdxs);
        let i = firstGotoIdx;
        while (i < info.back.idx) {
            if (gotoSet.has(i)) {
                const s = stmt(stmts[i], ctx);
                prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[i], s);
                if (s) lines.push(s);
                i++;
                continue;
            }
            const groupStart = i;
            while (i < info.back.idx && !gotoSet.has(i)) i++;
            lines.push(`${ctx.pad()}if (!${flagName}) {`);
            ctx.indent++;
            for (let j = groupStart; j < i; j++) {
                const s = stmt(stmts[j], ctx);
                prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[j], s);
                if (s) lines.push(s);
            }
            ctx.indent--;
            lines.push(`${ctx.pad()}}`);
        }
    }
    // Mark back-jump label.
    const hadBack = ctx.backJumpLabels.has(backName);
    const hadReach = ctx.reachableLabels.has(backName);
    ctx.backJumpLabels.add(backName);
    ctx.reachableLabels.add(backName);
    // Open the back-jump while-true loop.
    lines.push(`${ctx.pad()}${backName}: while (true) {`);
    ctx.indent++;
    // L_back region: gated on `!flag` so it skips when the forward
    // goto fired.  Back-jumps to L_BACK from inside L_fwd re-enter
    // here via `continue`; the flag-reset below ensures L_back runs
    // on re-entry.
    lines.push(`${ctx.pad()}if (!${flagName}) {`);
    ctx.indent++;
    const backLabelStmt = stmts[info.back.idx];
    const backInner = backLabelStmt.inner?.[0];
    if (backInner && backInner.kind !== 'NullStmt') {
        const s = stmt(backInner, ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, backInner, s);
        if (s) lines.push(s);
    }
    for (let i = info.back.idx + 1; i < info.fwd.idx; i++) {
        const s = stmt(stmts[i], ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[i], s);
        if (s) lines.push(s);
    }
    ctx.indent--;
    lines.push(`${ctx.pad()}}`);
    // Reset flag for subsequent iterations.
    lines.push(`${ctx.pad()}${flagName} = (0);`);
    // L_fwd region: always runs each iteration.  Back-jumps to L_BACK
    // from inside here re-enter the loop via `continue`.
    const fwdLabelStmt = stmts[info.fwd.idx];
    const fwdInner = fwdLabelStmt.inner?.[0];
    if (fwdInner && fwdInner.kind !== 'NullStmt') {
        const s = stmt(fwdInner, ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, fwdInner, s);
        if (s) lines.push(s);
    }
    for (let i = info.fwd.idx + 1; i < stmts.length; i++) {
        const s = stmt(stmts[i], ctx);
        prevEndLine = captureInsideComments(ctx, prevEndLine, stmts[i], s);
        if (s) lines.push(s);
    }
    // Fall-through exit.
    lines.push(`${ctx.pad()}break;`);
    // Restore ctx.
    if (!hadBack) ctx.backJumpLabels.delete(backName);
    if (!hadReach) ctx.reachableLabels.delete(backName);
    ctx.indent--;
    lines.push(`${ctx.pad()}}`);
    if (!hadFwd) ctx.forwardGotoFlags.delete(fwdName);
    else ctx.forwardGotoFlags.set(fwdName, oldFwd);
}

// Char-buffer pointer-walk recognizer (slice 1: write-only).
//
// C source pattern (canonical example: cmd.c doc_extcmd_flagstr):
//
//   char *p = Abuf;
//   if (cond1) {
//       *p++ = '[';
//       if (cond2) *p++ = 'm';
//       *p++ = ']';
//   }
//   *p = '\0';
//   return Abuf;
//
// Translator emits (pre-recognizer):
//
//   let p = Abuf;
//   if (cond1) {
//       void 0 /* TODO ... *p = 91 */;        ← write side, drops post-inc
//       if (cond2) { void 0 /* ... *p = 109 */; }
//       void 0 /* ... *p = 93 */;
//   }
//   void 0 /* ... *p = 0 */;
//   return Abuf;
//
// Translator emits (post-recognizer):
//
//   let __nh_p_idx = 0;
//   if (cond1) {
//       Abuf[__nh_p_idx++] = 91;
//       if (cond2) { Abuf[__nh_p_idx++] = 109; }
//       Abuf[__nh_p_idx++] = 93;
//   }
//   Abuf[__nh_p_idx] = 0;
//   return Abuf;
//
// Slice 1 narrowing — accept p iff every use of p in the function
// body is exactly one of:
//   - `*p = X`     (write, no inc)
//   - `*p++ = X`   (write + post-inc)
// Reject bare p (e.g. `return p;`, `p++` standalone, `*p` reads,
// `p = X` reassignment, `p + N` arithmetic, etc.).  Broader access
// shapes are deferred to follow-up slices.

// Returns Map<pName, {bufRef, idxName}> for each accepted candidate
// in `body`.  Empty Map if no candidates accepted.  The VarDecl
// can be at any nesting depth within the body (NetHack pattern: p
// is often declared inside an `if` block that uses it).
function analyzeCharBufferCandidates(body, ctx) {
    const candidates = new Map();
    if (!body) return candidates;
    const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.kind === 'VarDecl' && node.storageClass !== 'static') {
            tryAddCandidate(node, body, candidates, ctx);
        }
        for (const child of node.inner || []) visit(child);
    };
    visit(body);
    return candidates;
}

// Companion to analyzeCharBufferCandidates that scans function
// parameters declared `char *NAME` (or `const char *NAME`) and
// registers them as walker candidates when the body's uses match
// the strict walker safe-set (the same predicate
// verifyCharBufferSliceOne uses for the local-decl case).
//
// Why: getlin(prompt, char *bufp) and similar callers write into a
// caller-allocated buffer via `*bufp++ = c;` then `*bufp = '\0';`.
// Without a recognizer the translator falls into the generic
// pointer-mutation TODO and emits `bufp.value = c; bufp = bufp + 1;`
// which is broken (`.value` is a property nobody reads; the bufp++
// NaN trick orphans the array).  Treating the parameter itself as
// the buf (bufRef = the param) and emitting `bufp[__nh_bufp_idx++]
// = c` mutates the caller's array — observationally equivalent to
// C's pointer-walk.
//
// The resulting candidates flow through the SAME matchCharBufferWrite
// path that the local-decl candidates use, so reads (`*bufp` →
// `bufp[idx]`), writes (`*bufp = X`), and combined-form
// (`*bufp++ = X` → `bufp[idx++] = X`) all work without changing
// the existing emit hooks.  Statement-form bare `bufp++` (no `*`
// deref) is NOT supported in v1 — the verifier rejects functions
// that have one, deferring such cases until we handle the alias
// pattern (`char *obufp = bufp;` save-original).
function addParmCharBufferCandidates(paramNodes, body, candidates, ctx) {
    if (!paramNodes || !body) return;
    for (const p of paramNodes) {
        if (p.kind !== 'ParmVarDecl' || !p.name) continue;
        const typeStr = p.type?.qualType || '';
        // Same extended type pattern as tryAddCandidate — accept char*
        // typedefs (uint8/int8/unsigned char/signed char) so functions
        // like unicodeval_to_utf8str(uint8 *buffer, ...) qualify.
        if (!/^(const\s+)?(char|uint8|int8|unsigned\s+char|signed\s+char)\s*\*/.test(typeStr)) continue;
        // Skip if already a local-decl candidate (shouldn't happen
        // since locals shadow params in a function scope, but be safe).
        if (candidates.has(p.name)) continue;
        // Require at least one walker-mutation in the body before
        // registering — otherwise the parm is a pure pass-through
        // (e.g., `const char *orig` only passed to strlen/strncmp).
        // Without the gate, every read-only string parm would gain a
        // dead `__nh_p_idx = 0` decl + redundant `.slice(0)` arg
        // wrapping.  Functional but noise.  Added 2026-05-30 with
        // the function-arg bare-pointer emit.
        if (!hasCharBufferWalkerActivity(body, p.name)) continue;
        // Require at least one CONCRETE write `*p = X` or `*p++ = X`
        // before claiming a parameter walker.  Read-only walkers
        // (decode_glyph's `for (; *str && ...; ++str)` reading hex
        // chars) would be observationally correct when rewritten to
        // index form, but enabling the rewrite changes the emit shape
        // (`str.value` undefined → `str[idx]` defined) which has
        // surfaced as a runtime behavior shift in caller-side conventions
        // — the broken `str.value` no-op was masking upstream callers
        // passing inputs the decode path wasn't ready for.  Land the
        // standalone-increment recognition for WRITE walkers like
        // windows.c::getlin's `*bufp = X; bufp++;` while leaving
        // read-only walkers on the prior emit path.  Added 2026-05-31.
        if (!hasCharBufferTrueWrite(body, p.name)) continue;
        // Same write-only / walker-only check the local-decl path
        // uses — rejects any read of *p in a comparison, indexed
        // access bufp[k], pointer arithmetic, escape via function
        // call, etc.
        // For parameters, the parameter IS the buffer (no separate
        // bufRef); pass p.name as both pName and bufName so the
        // verifier accepts `p == &p[N]` comparisons.
        if (!verifyCharBufferSliceOne(body, p.name, p.name)) continue;
        // bufRef synthesised to look like a DeclRefExpr to the
        // parameter so expr() emits the parameter's name in the
        // rewritten body.  The param is its own buffer in JS —
        // mutating param[idx] writes through to the caller's array.
        const bufRef = {
            kind: 'DeclRefExpr',
            referencedDecl: { name: p.name, kind: 'ParmVarDecl' },
        };
        candidates.set(p.name, {
            bufRef,
            idxName: `__nh_${renameIfReserved(p.name)}_idx`,
            isParam: true, // flag for the function-body idx-decl injection
        });
    }
}

function tryAddCandidate(d, body, candidates, ctx) {
    const typeStr = d.type?.qualType || '';
    // Match char-pointer types including NetHack typedefs.  uint8 is
    // an unsigned-char typedef, int8 is a signed-char typedef.  Also
    // accept explicit unsigned/signed char.  Per user direction
    // 2026-05-30 to extend the *p++ = X recognizer beyond plain char *.
    if (!/^(const\s+)?(char|uint8|int8|unsigned\s+char|signed\s+char)\s*\*/.test(typeStr)) return;
    const init = (d.inner || []).find(isExpr);
    if (!init) return;
    let bufRef = init;
    while (bufRef && (bufRef.kind === 'ImplicitCastExpr'
        || bufRef.kind === 'CStyleCastExpr')) {
        bufRef = (bufRef.inner || [])[0];
    }
    if (!bufRef || bufRef.kind !== 'DeclRefExpr') return;
    // Accept char* parameter as buf in addition to char[N] local
    // array.  In JS, both are the same — mutation via param[idx]=X
    // writes through the parameter's underlying array reference.
    //
    // Safety check `verifyCharBufferSliceOne` ensures p has no
    // escape path (no `return p`, no `p` as function arg, no `p+N`
    // arithmetic) — so the index-based rewrite is observationally
    // equivalent to C's pointer-walk.
    // Pass bufRef's name so the verifier can accept comparisons of p
    // against &bufRef[N] (the "have we filled the buffer" sentinel
    // check common in NetHack getobj/altlets patterns).
    const bufName = bufRef.referencedDecl?.name || null;
    if (!verifyCharBufferSliceOne(body, d.name, bufName)) return;
    // Coexistence with value-box outparams (`ctx.scalarPtrParamNames`):
    // a local `char *p = buf` where buf is a known scalar-ptr outparam
    // gets registered as a casted-alias.  The translator's
    // `isScalarPtrParamRef` check then emits `*p = X` as `p.value = X`.
    //
    // Two cases:
    //
    // - p is a TRUE outparam (no `*p++`, no `p++`): the value-box
    //   emit `p.value = X` is correct.  Slice A would emit `buf[0]
    //   = X` which is wrong (buf is the value-box wrapper, not an
    //   array — assignment to `[0]` doesn't propagate to caller).
    //   Skip this candidate; let value-box handle it.
    //
    // - p is a WALKER (has `*p++` or bare `p++`): the value-box
    //   emit is wrong (each `*p = X` and `*p++ = X` should write at
    //   a DIFFERENT position, not the same `.value` slot).  Slice A
    //   is correct.  Remove p from scalarPtrParamNames so the value-
    //   box path doesn't fire, then accept as a slice A candidate.
    const pInValueBox = ctx?.scalarPtrParamNames?.has(renameIfReserved(d.name));
    if (pInValueBox) {
        if (!hasPointerIncrement(body, d.name)) return; // pure outparam
        // walker — claim p from the value-box system
        ctx.scalarPtrParamNames.delete(renameIfReserved(d.name));
    }
    candidates.set(d.name, {
        bufRef,
        idxName: `__nh_${renameIfReserved(d.name)}_idx`,
    });
}

// True iff `body` has at least one walker-mutation use of `pName`:
//   - p++, ++p, p--, --p           (pointer increment)
//   - *p = X                       (write through pointer)
//   - *p++ = X (= UnaryOp(*) over UnaryOp(++p)) (walker write)
//   - p += N, p -= N               (pointer advance)
// Used to gate parm-registration: a parm that's only read (passed
// to strlen/strncmp etc.) shouldn't get an idx decl + slice emit
// because the idx never advances and the slice is from position 0
// (equivalent to passing the parm directly).
// Added 2026-05-30 with the function-arg bare-pointer emit, which
// surfaced previously-rejected pure-pass-through parms as candidates.
function hasCharBufferWalkerActivity(body, pName) {
    let found = false;
    const visit = (node, parents) => {
        if (found || !node || typeof node !== 'object') return;
        if (node.kind === 'DeclRefExpr'
            && node.referencedDecl?.name === pName) {
            // Walk up parents past casts to identify the role.
            let i = parents.length - 1;
            while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
                || parents[i].kind === 'CStyleCastExpr'
                || parents[i].kind === 'ParenExpr')) {
                i--;
            }
            const direct = i >= 0 ? parents[i] : null;
            // p++ / ++p / p-- / --p
            if (direct?.kind === 'UnaryOperator'
                && (direct.opcode === '++' || direct.opcode === '--')) {
                found = true;
                return;
            }
            // p += N / p -= N
            if (direct?.kind === 'BinaryOperator'
                && (direct.opcode === '+=' || direct.opcode === '-=')) {
                const lhs = stripCasts(direct.inner?.[0]);
                if (lhs?.kind === 'DeclRefExpr'
                    && lhs.referencedDecl?.name === pName) {
                    found = true;
                    return;
                }
            }
            // *p (write check needs grandparent inspection)
            if (direct?.kind === 'UnaryOperator' && direct.opcode === '*') {
                let j = i - 1;
                while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
                    || parents[j].kind === 'CStyleCastExpr'
                    || parents[j].kind === 'ParenExpr')) {
                    j--;
                }
                const grand = j >= 0 ? parents[j] : null;
                if (grand?.kind === 'BinaryOperator' && grand.opcode === '='
                    && grand.inner?.[0] === direct) {
                    found = true;
                    return;
                }
            }
        }
        for (const child of node.inner || []) {
            visit(child, [...parents, node]);
        }
    };
    visit(body, []);
    return found;
}

// True iff `body` contains a `p++` / `++p` / `p--` / `--p`
// operation on the variable named `pName` (anywhere, at any nesting
// depth).  Used to distinguish walked pointers (where slice A's
// index-based rewrite is correct) from pure outparam writes (where
// the value-box `*p = X → p.value = X` emit is correct).
function hasPointerIncrement(body, pName) {
    let found = false;
    const visit = (node) => {
        if (found || !node || typeof node !== 'object') return;
        if (node.kind === 'UnaryOperator'
            && (node.opcode === '++' || node.opcode === '--')) {
            const inner = stripCasts(node.inner?.[0]);
            if (inner?.kind === 'DeclRefExpr'
                && inner.referencedDecl?.name === pName) {
                found = true;
                return;
            }
        }
        // Also accept compound advances `p += N` / `p -= N`
        // (CompoundAssignOperator) — semantically equivalent to
        // multi-step ++ for the purpose of identifying walker-style
        // behavior.  Added 2026-05-31 to unlock the
        // `char *p = src_param; p += 1; ...` pattern in test 39's
        // followup work — without it the value-box outparam path
        // rejects such aliases for not having ++ even though `+= N`
        // is the same intent.
        if ((node.kind === 'CompoundAssignOperator'
             || node.kind === 'BinaryOperator')
            && (node.opcode === '+=' || node.opcode === '-=')) {
            const lhs = stripCasts(node.inner?.[0]);
            if (lhs?.kind === 'DeclRefExpr'
                && lhs.referencedDecl?.name === pName) {
                found = true;
                return;
            }
        }
        for (const child of node.inner || []) visit(child);
    };
    visit(body);
    return found;
}

// True iff the body contains at least one TRUE WRITE through pName:
// `*p = X` or `*p++ = X` where pName is on the LHS of an assignment.
// Used to gate walker recognition for parameters: read-only walkers
// like `for (; *str && ...; ++str)` would be observationally CORRECT
// when rewritten to index form, but enabling the rewrite changes the
// runtime emit shape (`str.value` → `str[idx]`) which may interact
// with caller-side conventions (e.g., decode_glyph's callers expect
// the function to be a no-op for non-encoded strings; the broken
// `str.value` emit produces that no-op by accident).  Requiring a
// concrete write ensures only walkers that ACTIVELY mutate the buffer
// get the rewrite — read-only walkers fall through to the existing
// scalar/ptr emit path.  Added 2026-05-31 alongside the standalone-
// increment safe-set extension.
function hasCharBufferTrueWrite(body, pName) {
    let found = false;
    const visit = (node, parents) => {
        if (found || !node || typeof node !== 'object') return;
        if (node.kind === 'DeclRefExpr' && node.referencedDecl?.name === pName) {
            let i = parents.length - 1;
            while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
                || parents[i].kind === 'CStyleCastExpr'
                || parents[i].kind === 'ParenExpr')) {
                i--;
            }
            const direct = i >= 0 ? parents[i] : null;
            if (direct?.kind === 'UnaryOperator' && direct.opcode === '*') {
                // *p: check if grandparent is `=` assignment with this
                // UnaryOp as the LHS.
                let j = i - 1;
                while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
                    || parents[j].kind === 'CStyleCastExpr'
                    || parents[j].kind === 'ParenExpr')) {
                    j--;
                }
                const grand = j >= 0 ? parents[j] : null;
                if (grand?.kind === 'BinaryOperator' && grand.opcode === '='
                    && grand.inner?.[0] === direct) {
                    found = true;
                    return;
                }
            } else if (direct?.kind === 'UnaryOperator'
                && (direct.opcode === '++' || direct.opcode === '--')) {
                // p++ inside *p++: walk up past the UnaryOp(++) to find
                // a UnaryOp(*) above, then up again to find `=` with
                // the * as LHS.
                let j = i - 1;
                while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
                    || parents[j].kind === 'CStyleCastExpr'
                    || parents[j].kind === 'ParenExpr')) {
                    j--;
                }
                const above = j >= 0 ? parents[j] : null;
                if (above?.kind === 'UnaryOperator' && above.opcode === '*') {
                    let k = j - 1;
                    while (k >= 0 && (parents[k].kind === 'ImplicitCastExpr'
                        || parents[k].kind === 'CStyleCastExpr'
                        || parents[k].kind === 'ParenExpr')) {
                        k--;
                    }
                    const top = k >= 0 ? parents[k] : null;
                    if (top?.kind === 'BinaryOperator' && top.opcode === '='
                        && top.inner?.[0] === above) {
                        found = true;
                        return;
                    }
                }
            }
        }
        for (const child of node.inner || []) visit(child, [...parents, node]);
    };
    visit(body, []);
    return found;
}

// True iff parent chain wraps the DeclRefExpr in a STANDALONE
// `p++` / `++p` / `p--` / `--p` (NOT inside `*` deref).  A walker
// advance that mirrors C's pointer-walk via index-tracker mutation.
// Pairs with isCharBufferWriteUsage's `*p++ = X` (combined form);
// some C code writes the two statements separately:
//   *bufp = key;
//   bufp++;
// (windows.c::getlin and similar input readers).  Added 2026-05-31.
function isCharBufferStandaloneIncrement(parents) {
    let i = parents.length - 1;
    while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
        || parents[i].kind === 'CStyleCastExpr'
        || parents[i].kind === 'ParenExpr')) {
        i--;
    }
    if (i < 0) return false;
    const p1 = parents[i];
    if (p1.kind !== 'UnaryOperator') return false;
    if (p1.opcode !== '++' && p1.opcode !== '--') return false;
    // Standalone: parent of the UnaryOp must NOT be another UnaryOp(*).
    let j = i - 1;
    while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
        || parents[j].kind === 'CStyleCastExpr'
        || parents[j].kind === 'ParenExpr')) {
        j--;
    }
    if (j >= 0) {
        const p2 = parents[j];
        if (p2.kind === 'UnaryOperator' && p2.opcode === '*') return false;
    }
    return true;
}

// addAssignmentInitCharBufferCandidates: extend charBufferRewrites to
// cover `char *NAME;  ...; NAME = BUFREF;  *NAME++ = X; ...` —
// patterns where the char-pointer local is DECLARED without init and
// gets its first concrete value from a body-level assignment whose
// RHS is a char-array local or char-pointer parameter.  Added 2026-
// 05-30 to handle hacklib.c::strNsubst's `char *bp, *op, workbuf[BUFSZ];`
// where `op = workbuf` happens in the for-init.  Analogous to the
// existing decl-init form covered by tryAddCandidate but split
// across statements.
//
// Verification reuses verifyCharBufferSliceOne with the
// assignmentInitNode parameter so the LHS DeclRefExpr of the init
// assignment is treated as a binding-site ref (not a body use).
function addAssignmentInitCharBufferCandidates(body, candidates, ctx) {
    if (!body) return;
    // 1. Collect VarDecls of char-pointer locals that lack a
    //    meaningful init AND aren't already candidates.  NULL/0
    //    inits count as "no init" because the assignment-init resets
    //    name to a real bufRef anyway.
    const decls = [];
    const visitDecl = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.kind === 'VarDecl' && node.storageClass !== 'static'
            && !candidates.has(node.name)) {
            const typeStr = node.type?.qualType || '';
            if (/^(const\s+)?(char|uint8|int8|unsigned\s+char|signed\s+char)\s*\*/.test(typeStr)) {
                const init = (node.inner || []).find(isExpr);
                if (!init || isLikelyNull(init)) {
                    decls.push(node);
                }
            }
        }
        for (const child of node.inner || []) visitDecl(child);
    };
    visitDecl(body);
    for (const declNode of decls) {
        const name = declNode.name;
        const found = findCharBufferAssignmentInit(body, name);
        if (!found) continue;
        const bufExpr = found.bufExpr;
        const bufName = bufExpr.referencedDecl?.name;
        if (!bufName) continue;
        // Avoid double-claim if bufName is already a candidate
        // (a different recognizer owns the buf).
        if (candidates.has(bufName)) continue;
        if (!verifyCharBufferSliceOne(body, name, bufName, found.nodes)) continue;
        candidates.set(name, {
            bufRef: bufExpr,
            idxName: `__nh_${renameIfReserved(name)}_idx`,
            isAssignmentInit: true,
            assignmentInitNodes: found.nodes,
        });
    }
}

// findCharBufferAssignmentInit: scan body for `name = bufRef` BinaryOp(=)
// assignments where bufRef is a DeclRefExpr to a char-array local OR
// a char-pointer parameter.  Returns { bufExpr, nodes: [...] } where
// nodes contains every matching assignment.  Multiple assignments are
// accepted IF they all reference the SAME bufRef (e.g., strNsubst's
// two `rp = replacement` resets inside two separate for-init blocks);
// such patterns are semantically `__nh_p_idx = 0` resets, all valid.
// Returns null if no match OR if different bufRefs are seen.
function findCharBufferAssignmentInit(body, name) {
    let bufExpr = null;
    let bufName = null;
    let multi = false;
    const nodes = [];
    const visit = (node) => {
        if (multi || !node || typeof node !== 'object') return;
        if (node.kind === 'BinaryOperator' && node.opcode === '=') {
            const lhs = stripCasts(node.inner?.[0]);
            if (lhs?.kind === 'DeclRefExpr'
                && lhs.referencedDecl?.name === name) {
                const rhs = stripCasts(node.inner?.[1]);
                if (rhs?.kind === 'DeclRefExpr') {
                    const decl = rhs.referencedDecl;
                    const qt = (decl?.qualType || decl?.type?.qualType || '');
                    // `char foo[N]` array-of-char OR `char *foo` pointer.
                    if (/^(const\s+)?(char|uint8|int8|unsigned\s+char|signed\s+char)\s*[\[\*]/.test(qt)) {
                        const rhsName = decl?.name;
                        if (bufExpr === null) {
                            bufExpr = rhs;
                            bufName = rhsName;
                            nodes.push(node);
                        } else if (rhsName === bufName) {
                            // Same bufRef — accept as another reset of
                            // the position tracker (`__nh_p_idx = 0`).
                            nodes.push(node);
                        } else {
                            // Different bufRef — ambiguous; reject.
                            multi = true;
                            return;
                        }
                    }
                }
            }
        }
        for (const child of node.inner || []) visit(child);
    };
    visit(body);
    if (multi || bufExpr === null) return null;
    return { bufExpr, nodes };
}

// Walks `body` looking for DeclRefExpr referencing `pName`.  Each
// reference must be wrapped in `*p` or `*(p++)` on the LHS of an
// assignment.  Returns false if any reference fails this check.
// Excludes the `p = buf` VarDecl init itself (which references
// `buf`, not `p`).
//
// One exception: a `char *ALIAS = pName;` save-original alias decl
// is permitted IFF it's the only such decl AND ALIAS's body uses
// are read-only (no `*ALIAS = X`, no `ALIAS++`, no `ALIAS = other`
// rebind).  Covers the getlin pattern where the parameter is
// walked through but the caller-passed buffer reference is also
// passed to pline / printf as `%s`.
function verifyCharBufferSliceOne(body, pName, bufName = null, assignmentInitNodes = null) {
    // Find at most ONE alias-init: a `char *ALIAS = pName;` VarDecl
    // whose RHS DeclRefExpr resolves to pName.  Stripping
    // ImplicitCast/ParenExpr nodes between VarDecl and the
    // DeclRefExpr captures the const-cast variant the C parser
    // emits.
    const aliasInfo = findCharPointerAlias(body, pName);
    // For assignment-init form (`char *p; ...; p = bufRef;`), each LHS
    // DeclRefExpr is a binding-site reference — skip them like the
    // decl-init's bufRef ref is skipped (the assignment IS the init,
    // not a body use).  Multiple resets to the same bufRef are
    // permitted (e.g., two for-init `rp = replacement` blocks in
    // strNsubst); bindingSiteRefs collects each LHS DeclRefExpr node.
    // Accept legacy single-node form for backwards compat.
    const bindingSiteRefs = new Set();
    const initNodes = Array.isArray(assignmentInitNodes)
        ? assignmentInitNodes
        : (assignmentInitNodes ? [assignmentInitNodes] : []);
    for (const initNode of initNodes) {
        let lhs = initNode.inner?.[0];
        while (lhs && (lhs.kind === 'ImplicitCastExpr'
            || lhs.kind === 'CStyleCastExpr' || lhs.kind === 'ParenExpr')) {
            lhs = lhs.inner?.[0];
        }
        if (lhs?.kind === 'DeclRefExpr') bindingSiteRefs.add(lhs);
    }
    let safe = true;
    let rejectReason = null;
    const visit = (node, parents) => {
        if (!safe || !node || typeof node !== 'object') return;
        if (node.kind === 'DeclRefExpr' && node.referencedDecl?.name === pName) {
            // Skip the alias-init reference — the same DeclRefExpr
            // is consumed by aliasInfo's safety check below.
            if (aliasInfo && aliasInfo.refNode === node) {
                // Continue without failure; the walker safety check
                // doesn't apply to the alias init.
            } else if (bindingSiteRefs.has(node)) {
                // assignment-init binding-site — analogous to alias-
                // init; the assignment is treated as the candidate
                // init, not a body use.
            } else if (!isCharBufferWriteUsage(parents)
                       && !(bufName && matchCharBufferAddrCompare(parents, bufName))
                       && !isCharBufferReadOnlyArgUsage(parents)
                       && !isCharBufferAdvanceUsage(parents, pName)
                       && !isCharBufferStandaloneIncrement(parents)) {
                safe = false;
                return;
            }
        }
        for (const child of node.inner || []) {
            visit(child, [...parents, node]);
        }
    };
    visit(body, []);
    if (!safe) return false;
    // If an alias was tentatively accepted, verify its uses are
    // walker-incompatible (i.e., no writes or advances) so the
    // emit (which leaves the alias as a plain `let ALIAS = pName;`
    // referencing the same JS array) stays semantically aligned
    // with C's "saved-original-position" semantics.
    if (aliasInfo && !verifyAliasReadOnly(body, aliasInfo.aliasName)) {
        return false;
    }
    return true;
}

// Scan body for the first `char *ALIAS = pName;` VarDecl shape.
// Returns { aliasName, refNode } where refNode is the exact
// DeclRefExpr node inside the alias's init expression, or null.
// If multiple alias candidates exist, returns the first AND sets
// `multi: true` so the caller can reject (avoiding ambiguity).
function findCharPointerAlias(body, pName) {
    let found = null;
    const visit = (node) => {
        if (found || !node || typeof node !== 'object') return;
        if (node.kind === 'VarDecl') {
            const typeStr = node.type?.qualType || '';
            // Extended to char-pointer typedefs (uint8/int8/unsigned char/
            // signed char) for the same reason as tryAddCandidate.  An
            // alias of a uint8 parameter is still semantically a stable
            // reference to the same JS array, so it's safe to detect.
            if (/^(const\s+)?(char|uint8|int8|unsigned\s+char|signed\s+char)\s*\*/.test(typeStr)) {
                let init = (node.inner || []).find(isExpr);
                while (init && (init.kind === 'ImplicitCastExpr'
                    || init.kind === 'CStyleCastExpr'
                    || init.kind === 'ParenExpr')) {
                    init = (init.inner || [])[0];
                }
                if (init && init.kind === 'DeclRefExpr'
                    && init.referencedDecl?.name === pName) {
                    found = { aliasName: node.name, refNode: init };
                    return;
                }
            }
        }
        for (const child of node.inner || []) visit(child);
    };
    visit(body);
    return found;
}

// True iff every reference to aliasName in body is a non-walker
// safe-read: no `*alias = X`, no `alias++ / alias--`, no
// `alias = X` rebind.  Reads (`*alias`, `alias[k]`, function-arg
// uses like `printf("%s", alias)`) are accepted; the alias is a
// stable JS reference to the same array as the parameter.
function verifyAliasReadOnly(body, aliasName) {
    let safe = true;
    const visit = (node, parents) => {
        if (!safe || !node || typeof node !== 'object') return;
        if (node.kind === 'DeclRefExpr'
            && node.referencedDecl?.name === aliasName) {
            // Walk parents to identify the immediate role.  Reject
            // any role that mutates alias or the buffer-through-alias.
            let i = parents.length - 1;
            while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
                || parents[i].kind === 'CStyleCastExpr'
                || parents[i].kind === 'ParenExpr')) {
                i--;
            }
            const direct = i >= 0 ? parents[i] : null;
            // alias++ / alias-- — rejected
            if (direct?.kind === 'UnaryOperator'
                && (direct.opcode === '++' || direct.opcode === '--')) {
                safe = false;
                return;
            }
            // alias = X (rebind) — rejected.  C semantics would
            // make alias point at a different buffer; JS emit
            // would reassign the alias to the new value but the
            // walker-param's idx is unaffected, producing a
            // subtle bug.
            if (direct?.kind === 'BinaryOperator' && direct.opcode === '='
                && direct.inner?.[0] === node) {
                safe = false;
                return;
            }
            // *alias = X — must inspect grandparent to detect the
            // write form.  *alias on the RHS of an assignment or
            // standalone (read) is fine.
            if (direct?.kind === 'UnaryOperator' && direct.opcode === '*') {
                let j = i - 1;
                while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
                    || parents[j].kind === 'CStyleCastExpr'
                    || parents[j].kind === 'ParenExpr')) {
                    j--;
                }
                const grand = j >= 0 ? parents[j] : null;
                if (grand?.kind === 'BinaryOperator' && grand.opcode === '='
                    && grand.inner?.[0] === direct) {
                    safe = false;
                    return;
                }
            }
        }
        for (const child of node.inner || []) {
            visit(child, [...parents, node]);
        }
    };
    visit(body, []);
    return safe;
}

// True iff the parent chain wraps the DeclRefExpr into one of the
// supported usage shapes:
//   - `*p`     (read OR write — UnaryOp(*, p))
//   - `*p++`   (read OR write — UnaryOp(*, UnaryOp(++ postfix, p)))
// The outer context (assignment LHS or not) doesn't matter — both
// read and write forms are absorbable by the recognizer.
// ImplicitCastExpr / CStyleCastExpr wrappers are transparent.
function isCharBufferWriteUsage(parents) {
    let i = parents.length - 1;
    while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
        || parents[i].kind === 'CStyleCastExpr')) {
        i--;
    }
    if (i < 0) return false;
    const p1 = parents[i];
    if (p1.kind !== 'UnaryOperator') return false;
    if (p1.opcode === '*') return true;
    if (p1.opcode === '++' && p1.isPostfix) {
        // Must be wrapped in a `*` deref above.
        let j = i - 1;
        while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
            || parents[j].kind === 'CStyleCastExpr')) {
            j--;
        }
        if (j < 0) return false;
        const p2 = parents[j];
        return p2.kind === 'UnaryOperator' && p2.opcode === '*';
    }
    return false;
}

// True iff the parent chain wraps the DeclRefExpr `pName` into a
// compound pointer advance: `p += N` or `p -= N` where the DeclRefExpr
// is the LHS.  These map cleanly to `__nh_p_idx += N` /
// `__nh_p_idx -= N` in the charBufferRewrites emit, so the walker
// stays observationally equivalent to C's pointer-walk.  RHS-position
// uses (e.g., `q += p`) are rejected since the idx tracker would be
// corrupted.  Added 2026-05-30 to handle hacklib.c strNsubst's
// `bp += len;` advance — landed alongside the function-arg bare-
// pointer emit because the two unlock bp together.
function isCharBufferAdvanceUsage(parents, pName) {
    let i = parents.length - 1;
    while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
        || parents[i].kind === 'CStyleCastExpr'
        || parents[i].kind === 'ParenExpr')) {
        i--;
    }
    if (i < 0) return false;
    const direct = parents[i];
    // Clang emits compound assignments (+= / -=) as a distinct node
    // kind CompoundAssignOperator, NOT as BinaryOperator with the
    // compound opcode.  Accept both for forward-compat.
    if (direct.kind !== 'BinaryOperator'
        && direct.kind !== 'CompoundAssignOperator') return false;
    if (direct.opcode !== '+=' && direct.opcode !== '-=') return false;
    // The DeclRefExpr must be the LHS.
    const lhs = stripCasts(direct.inner?.[0]);
    return lhs?.kind === 'DeclRefExpr'
        && lhs.referencedDecl?.name === pName;
}

// Allowlist of C functions whose ALL arguments are read-only — passing
// a slice/substring of the source buffer is semantically equivalent to
// passing a C pointer-into-buffer.  Added 2026-05-30 per user
// authorization to handle the bp pattern in hacklib.c strNsubst
// (`strncmp(bp, orig, len)`).
//
// The risk in mis-classifying: if a callee writes through its arg,
// passing a slice silently drops the writes (the original buffer
// doesn't see them).  Conservative: only well-known read-only C
// string functions.  Each addition should be verified by manual
// inspection of the callee's contract.
//
// Format-string callees (printf family) are NOT included here even
// though %s args are read-only — variadic args complicate per-arg
// classification.  Add later if needed.
//
// Map shape: callee-name → safe-arg-indexes, where:
//   - `null` (sentinel) means ALL args are read-only (the original
//     fully-safe set)
//   - `Set<number>` means ONLY those positions are read-only — used
//     for strcpy-family where the destination (arg 0) is a write
//     target but later args are source (read-only).
//
// Extending the allowlist requires:
//   1. Verification of the callee's contract: which arg positions
//      does it READ FROM (safe), which does it WRITE THROUGH (unsafe)?
//   2. For walker p passed as a write-through arg, the slice emit
//      would silently drop the writes — that's the bug we avoid by
//      keeping unsafe positions out of the per-callee Set.
const READ_ONLY_STRING_CALLEES = new Map([
    // Fully-safe (all args read-only): scan / search / measure /
    // compare functions.  No writes through any arg.
    ['strlen', null],
    ['strchr', null], ['strrchr', null], ['strstr', null], ['strstri', null],
    ['index', null], ['rindex', null],
    ['strcmp', null], ['strncmp', null], ['strcmpi', null], ['strncmpi', null],
    ['strcasecmp', null], ['strncasecmp', null],
    ['fuzzymatch', null],
    // NetHack-internal pure string transforms: read input, return a
    // NEW string (typically via nextobuf() or a static buffer).
    // Input is read-only.  Each verified by reading the C source:
    //   - s_suffix(str): hacklib.c:345 — Strcpy(buf, s), append "'s"
    //   - ing_suffix(str): hacklib.c:363 — Strcpy(buf, s), append "ing"
    //   - an(str): objnam.c:2145 — nextobuf, just_an, strncat
    //   - An(str): objnam.c:2158 — wraps an() then uppercases first char
    //   - the(str): objnam.c:2171 — nextobuf, conditionally prepends
    //   - The(str): objnam.c:2234 — wraps the() then uppercases first char
    // (Earlier `plur_suffix` entry was a phantom — no such function
    // exists in NetHack; removed.)
    ['s_suffix', null],
    ['ing_suffix', null],
    ['an', null],
    ['An', null],
    ['the', null],
    ['The', null],
    // Per-arg classification: strcpy(dst, src), strcat(dst, src),
    // strncpy(dst, src, n), strncat(dst, src, n).  Arg 0 (dst) is
    // a WRITE-through target — passing a walker slice there would
    // silently drop writes to the original buffer.  Arg 1 (src) is
    // a READ-only source — safe to slice.  The capitalized forms
    // (Strcpy, Strcat) are NetHack's BUFSZ-bounded wrappers around
    // strncpy/strncat with the same arg shape.
    ['strcpy', new Set([1])],
    ['Strcpy', new Set([1])],
    ['strncpy', new Set([1])],
    ['strcat', new Set([1])],
    ['Strcat', new Set([1])],
    ['strncat', new Set([1])],
]);

// True iff the parent chain wraps the DeclRefExpr `p` into a
// CallExpr's argument position AND the callee+argIdx is in the
// READ_ONLY_STRING_CALLEES allowlist.  When this fires, the emit
// translates `f(..., p, ...)` to `f(..., bufRef.slice(__nh_p_idx), ...)`
// (substring works equivalently for JS strings).
//
// `parents[i+1]` walks the path from CallExpr down — that's the
// direct child of CallExpr in our traversal, which gives us the
// arg index via `callNode.inner.indexOf`.  Reject if idx === 0
// (the callee position) or if not in inner.
function isCharBufferReadOnlyArgUsage(parents) {
    let i = parents.length - 1;
    while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
        || parents[i].kind === 'CStyleCastExpr'
        || parents[i].kind === 'ParenExpr')) {
        i--;
    }
    if (i < 0) return false;
    const callNode = parents[i];
    if (callNode.kind !== 'CallExpr') return false;
    // Confirm the DeclRefExpr is an argument, not the callee.
    if (i + 1 >= parents.length) return false;
    const childOfCall = parents[i + 1];
    const argIdx = (callNode.inner || []).indexOf(childOfCall);
    if (argIdx <= 0) return false;
    // Identify the callee — must be a recognized read-only C string
    // function from the allowlist.
    const callee = stripCasts(callNode.inner?.[0]);
    if (!callee || callee.kind !== 'DeclRefExpr') return false;
    const calleeName = callee.referencedDecl?.name;
    if (!calleeName) return false;
    if (!READ_ONLY_STRING_CALLEES.has(calleeName)) return false;
    const safeArgs = READ_ONLY_STRING_CALLEES.get(calleeName);
    // null sentinel means all args are read-only; Set means
    // exactly those argIdx values are safe.  CallExpr's inner is
    // [calleeRef, arg0, arg1, ...], so argIdx is +1 relative to
    // user-perceived arg position.  Adjust by subtracting 1 when
    // testing against the Set.
    if (safeArgs === null) return true;
    return safeArgs.has(argIdx - 1);
}

// Detect a usage of pName inside `pName OP &arr[N]` (or arr[N] which
// decays the same way) where OP is a comparison (==, !=, <, <=, >,
// >=) and arr matches `bufName` (the same buffer p walks).  Returns
// the index AST node (for the EMIT to translate to an index-based
// comparison) or null if not a match.
//
// Common NetHack idiom: `if (p == &buf[sizeof buf - 1]) ...` to
// detect "have we filled the buffer".  In JS, this needs to emit as
// `p_idx == (sizeof buf - 1)` because the JS p_idx is the position.
// Added 2026-05-30 per user direction to handle address-comparison
// rejections in invent.c getobj's altlets walker.
function matchCharBufferAddrCompare(parents, bufName) {
    let i = parents.length - 1;
    while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
        || parents[i].kind === 'CStyleCastExpr'
        || parents[i].kind === 'ParenExpr')) {
        i--;
    }
    if (i < 0) return null;
    const direct = parents[i];
    if (direct.kind !== 'BinaryOperator') return null;
    const COMPARE_OPS = new Set(['==', '!=', '<', '<=', '>', '>=']);
    if (!COMPARE_OPS.has(direct.opcode)) return null;
    // The other side of the comparison must be the address (or
    // decayed array element) into bufName.
    const [a, b] = direct.inner || [];
    // Identify which side is the variable and which is the
    // comparison target.
    const aStrip = stripCasts(a);
    const bStrip = stripCasts(b);
    const aIsP = aStrip?.kind === 'DeclRefExpr';
    const otherSide = aIsP ? b : a;
    const otherStrip = stripCasts(otherSide);
    if (!otherStrip) return null;
    // Match `&arr[N]` or implicit-cast-decayed `arr[N]` or
    // `arr + N` forms.
    let arrNode = null;
    let idxNode = null;
    if (otherStrip.kind === 'UnaryOperator' && otherStrip.opcode === '&') {
        const sub = stripCasts(otherStrip.inner?.[0]);
        if (sub?.kind === 'ArraySubscriptExpr' && sub.inner?.length === 2) {
            arrNode = stripCasts(sub.inner[0]);
            idxNode = sub.inner[1];
        }
    }
    if (!arrNode && otherStrip.kind === 'BinaryOperator'
        && otherStrip.opcode === '+') {
        // arr + N — pointer arithmetic into arr.
        const [lhs, rhs] = otherStrip.inner || [];
        const lStrip = stripCasts(lhs);
        const rStrip = stripCasts(rhs);
        if (lStrip?.kind === 'DeclRefExpr') {
            arrNode = lStrip;
            idxNode = rStrip;
        } else if (rStrip?.kind === 'DeclRefExpr') {
            arrNode = rStrip;
            idxNode = lStrip;
        }
    }
    if (!arrNode || arrNode.kind !== 'DeclRefExpr') return null;
    const arrName = arrNode.referencedDecl?.name;
    if (!arrName || arrName !== bufName) return null;
    return { idxNode, side: aIsP ? 'left' : 'right' };
}

// Used by binaryOp: when emitting `BinaryOp(=, UnaryOp(*, X), Y)`,
// check if X references a char-buffer-rewrite p.  Returns
// `{bufJs, idxAccess}` if rewrite applies, else null.
function matchCharBufferWrite(l, ctx) {
    if (!ctx.charBufferRewrites || ctx.charBufferRewrites.size === 0) return null;
    if (l.kind !== 'UnaryOperator' || l.opcode !== '*') return null;
    let core = (l.inner || [])[0];
    while (core && (core.kind === 'ImplicitCastExpr'
        || core.kind === 'CStyleCastExpr')) {
        core = (core.inner || [])[0];
    }
    if (!core) return null;
    let pName = null;
    let postInc = false;
    if (core.kind === 'DeclRefExpr') {
        pName = core.referencedDecl?.name;
    } else if (core.kind === 'UnaryOperator' && core.opcode === '++' && core.isPostfix) {
        let dr = (core.inner || [])[0];
        while (dr && (dr.kind === 'ImplicitCastExpr'
            || dr.kind === 'CStyleCastExpr')) {
            dr = (dr.inner || [])[0];
        }
        if (dr?.kind === 'DeclRefExpr') {
            pName = dr.referencedDecl?.name;
            postInc = true;
        }
    }
    if (!pName) return null;
    const rewrite = ctx.charBufferRewrites.get(pName);
    if (!rewrite) return null;
    return {
        bufJs: expr(rewrite.bufRef, ctx),
        idxAccess: postInc ? `${rewrite.idxName}++` : rewrite.idxName,
    };
}

function compoundStmt(node, ctx) {
    if (!node.inner || node.inner.length === 0) {
        // Empty body — but the C source may have a comment inside
        // the braces (e.g. `if (cond) { /* TODO: ... */ }`).  Emit
        // the comment inline as the body's only content so spec
        // §11 verbatim presence is preserved.  Block is empty so
        // there's no patch-target text to perturb.
        const begin = node.range?.begin?.line;
        const end = node.range?.end?.line;
        if (begin != null && end != null && ctx.comments) {
            const inside = [];
            for (const c of ctx.comments) {
                if (c.line < begin) continue;
                if (c.line > end) break;
                if (ctx.emittedComments.has(c.start)) continue;
                if (c.text.length < 30) continue;
                ctx.emittedComments.add(c.start);
                inside.push(c.text);
            }
            if (inside.length > 0) {
                return '{ ' + inside.join(' ') + ' }';
            }
        }
        return '{}';
    }

    // If any child is a LabelStmt, segment the body so each label-
    // reachable region is a JS labeled block.  This is the
    // forward-goto rewrite: `if (cond) goto L; ...stmts...; L: tail;`
    // becomes `L_block: { if (cond) break L_block; ...stmts... }
    // tail;`.
    //
    // Backward-only labels (every goto is in a stmt at a position
    // AFTER the label) are handled by the pure-back-jump path below:
    // the post-label segment becomes `LABEL: while (true) { ...;
    // break; }` and each goto becomes `continue LABEL`.
    const labelIndices = [];
    for (let i = 0; i < node.inner.length; i++) {
        if (node.inner[i].kind === 'LabelStmt') labelIndices.push(i);
    }

    // Classify each top-level label as forward / backward / mixed.
    // The pure-back-jump path requires every label in this compound
    // to be backward-only with no forward gotos and at least one
    // back-goto per label.  Multi-label compounds are emitted as
    // nested labeled while-true loops (see emitPureBackJump comment).
    // Mixed compounds (any forward goto to any of these labels) fall
    // through to the existing forward-goto wrapper.
    const isPureBackJump = labelIndices.length >= 1
        && classifyAllBackward(node.inner, labelIndices, ctx);

    // A4 narrow recognizer: forward goto into a nested IfStmt body
    // whose first child is a LabelStmt.  Only triggers when this
    // compound has NO top-level labels (otherwise the existing
    // forward-goto wrapper or pure-back-jump path takes precedence —
    // both are older and more battle-tested).
    const a4Match = (labelIndices.length === 0)
        ? detectForwardIntoIf(node.inner, ctx) : null;

    // A4 mixed-two-label recognizer: exactly two top-level labels,
    // first back-jump-only + second forward-only.  Covers the
    // pickup.js doloot lootcont/lootmon shape and similar patterns.
    const mixedMatch = (!isPureBackJump && labelIndices.length === 2)
        ? detectMixedTwoLabel(node.inner, labelIndices, ctx) : null;

    const lines = ['{'];
    ctx.indent++;

    if (isPureBackJump) {
        emitPureBackJump(node.inner, labelIndices, ctx, lines);
    } else if (mixedMatch) {
        emitMixedTwoLabel(node.inner, mixedMatch, ctx, lines);
    } else if (a4Match) {
        emitForwardIntoIf(node.inner, a4Match, ctx, lines);
    } else if (labelIndices.length === 0) {
        const children = node.inner;
        let prevEndLine = node.range?.begin?.line ?? null;
        for (let i = 0; i < children.length; i++) {
            // Lookahead for the C "string-copy via pointer walk" idiom:
            //   p = dest_arr;
            //   for (k = 0; k < N; ++k) *p++ = *src++;
            //   *p = '\0';
            // Replaces the 3-statement sequence with `dest_arr =
            // src.slice(0, N); src = src.slice(N);` — the source pointer
            // advances naturally for downstream copies in the same scope.
            const idiom = detectStringCopyIdiom(children, i, ctx);
            if (idiom) {
                captureInsideComments(ctx, prevEndLine, children[i], idiom.js);
                lines.push(idiom.js);
                const last = children[i + idiom.length - 1];
                prevEndLine = last?.range?.end?.line ?? prevEndLine;
                i += idiom.length - 1;
                continue;
            }
            // Lookahead for the C "struct-array pointer walk via comma
            // inc" idiom (e.g. m_move's mtrack-loop):
            //   mtrk = mtmp->mtrack;        (or mtmp->mtrack[0])
            //   for (j = 0; j < N; mtrk++, j++) BODY-with-mtrk->fields
            // Translator emits the inc as `(mtrk = __nh_blackhole), j++`
            // which makes the loop run only once with mtrk pinned.
            // Rewrite to indexed iteration that re-derives mtrk each
            // iteration from the captured array.
            const ptrCounter = detectStructPtrCounterLoop(children, i, ctx);
            if (ptrCounter) {
                captureInsideComments(ctx, prevEndLine, children[i], ptrCounter.js);
                lines.push(ptrCounter.js);
                const last = children[i + ptrCounter.length - 1];
                prevEndLine = last?.range?.end?.line ?? prevEndLine;
                i += ptrCounter.length - 1;
                continue;
            }
            // Detect the C "struct-ptr sentinel walk via while loop"
            // idiom (e.g. `as = spellings; while (as->sp) { ...;
            // as++; }`).  Rewrites the WhileStmt to a for-loop that
            // captures `p` (the current array reference) and walks
            // by index.  Looks back through prior stmts to find p's
            // init for a start-offset hint, but doesn't require a
            // specific shape for the init — works even when the
            // init is a CallExpr like `skills_for_role()`.
            const whilePtr = detectWhilePtrWalk(children, i, ctx);
            if (whilePtr) {
                captureInsideComments(ctx, prevEndLine, children[i], whilePtr.js);
                lines.push(whilePtr.js);
                const last = children[i + whilePtr.length - 1];
                prevEndLine = last?.range?.end?.line ?? prevEndLine;
                i += whilePtr.length - 1;
                continue;
            }
            // Eos-walker statement-level drops: bp++; or *bp = NUL;
            // standalone in the compound.  Recognized via
            // isEosWalkerDropStmt; the comments anchor on the
            // previous emit so spec §11 isn't affected.
            if (isEosWalkerDropStmt(children[i], ctx)) {
                prevEndLine = children[i]?.range?.end?.line ?? prevEndLine;
                continue;
            }
            const s = stmt(children[i], ctx);
            prevEndLine = captureInsideComments(ctx, prevEndLine, children[i], s);
            if (s) lines.push(s);
        }
        // Tail-of-compound: comments between last stmt's end-line and
        // the compound's closing `}`.  Anchor on the LAST child's JS
        // with `after: true` so the injector places the comment AFTER
        // the anchor line (just before the `}`).
        const compoundEnd = node.range?.end?.line;
        const lastChild = children[children.length - 1];
        const lastEndLine = lastChild?.range?.end?.line ?? prevEndLine;
        if (compoundEnd != null && lastChild && prevEndLine != null && prevEndLine >= 0) {
            const lastEmit = lines[lines.length - 1];
            if (lastEmit) {
                for (const c of ctx.comments || []) {
                    if (c.line <= lastEndLine) continue;
                    if (c.line >= compoundEnd) break;
                    if (ctx.emittedComments.has(c.start)) continue;
                    if (c.text.length < 30) continue;
                    if (compoundEnd - c.line > INSIDE_COMMENT_MAX_GAP) continue;
                    const anchor = insideCommentAnchorOf(lastEmit);
                    if (!anchor || anchor.trim().length < 6) break;
                    ctx.pendingInsideComments.push({
                        outputPath: ctx.opts?.outputPath,
                        anchor,
                        content: c.text,
                        position: 'after',
                    });
                    ctx.emittedComments.add(c.start);
                }
            }
        }
        // Compound-residual: comments anywhere in (compoundBegin,
        // compoundEnd) that weren't captured by per-child or tail-of-
        // compound passes.  These typically come from preprocessed-out
        // regions (e.g., `#ifdef DUMPLOG ... #endif` with DUMPLOG
        // undefined) — clang's preprocessor strips the AST nodes but
        // extractComments reads raw source so the comments remain in
        // the conformance check.  Push with anchor=null so the
        // injector's no-anchor branch tail-appends them at EOF, which
        // satisfies spec §11's presence-anywhere requirement.
        const compoundBegin = node.range?.begin?.line;
        if (compoundBegin != null && compoundEnd != null) {
            for (const c of ctx.comments || []) {
                if (c.line <= compoundBegin) continue;
                if (c.line >= compoundEnd) break;
                if (ctx.emittedComments.has(c.start)) continue;
                if (c.text.length < 30) continue;
                ctx.pendingInsideComments.push({
                    outputPath: ctx.opts?.outputPath,
                    anchor: '',  // empty — forces tail-fallback in injector
                    content: c.text,
                });
                ctx.emittedComments.add(c.start);
            }
        }
    } else {
        // Variables declared inside a to-be-wrapped segment must be
        // hoisted to this enclosing scope so post-label code can see
        // them.  C's local-var scope is the enclosing block; JS `let`
        // is block-scoped, so wrapping in `LABEL: { let X = ...; }`
        // would hide X from the post-label tail.  We hoist all
        // VarDecls within ANY wrapped segment to top-of-block.
        const hoisted = [];
        for (const labelIdx of labelIndices) {
            const segStart = hoisted.lastSegStart ?? 0;
            // (computed below; collect across all segments below)
        }
        // Actually collect across every segment (pre-label and trailing)
        // so the hoisting matches the C function's flat var scope.
        const allHoisted = [];
        const seenNames = new Set();
        for (const child of node.inner) {
            if (child.kind === 'DeclStmt') {
                for (const d of child.inner || []) {
                    if (d.kind === 'VarDecl' && !seenNames.has(d.name)
                        && d.storageClass !== 'static'
                        && d.storageClass !== 'extern') {
                        allHoisted.push(d);
                        seenNames.add(d.name);
                    }
                }
            }
        }
        // Emit hoisted declarations with appropriate zero-init.
        for (const d of allHoisted) {
            // Char-buffer walker candidate: the body's uses are
            // rewritten to bufRef[__nh_<name>_idx] form, so hoist the
            // INDEX, not a pointer let.  Previously this path emitted
            // a plain pointer decl while the body used the index —
            // ReferenceError __nh_ap_idx in goto-hoisted getobj
            // (invent.c's `char *bp = buf, *ap = altlets;`).  Kept
            // deliberately narrow: only the decl/assign emission is
            // touched, not the label-selector structure (the broad
            // version of this change broke need_more_cq label scope —
            // see feedback_hoist_charbuffer_interaction).
            if (ctx.charBufferRewrites?.has(d.name)) {
                lines.push(`${ctx.pad()}let ${ctx.charBufferRewrites.get(d.name).idxName} = 0;`);
                continue;
            }
            const name = renameIfReserved(d.name);
            const initJs = zeroInitFor(d.type?.qualType, ctx);
            lines.push(`${ctx.pad()}let ${name} = ${initJs};`);
        }
        // Emit segments.  DeclStmt inside a segment becomes assignment.
        const emitChildAsAssignment = (child) => {
            if (child.kind !== 'DeclStmt') {
                return stmt(child, ctx);
            }
            const parts = [];
            for (const d of child.inner || []) {
                if (d.kind !== 'VarDecl') continue;
                if (d.storageClass === 'static') continue;
                // Walker candidate's decl-init re-emitted as an
                // assignment: the pointer binding doesn't exist (the
                // hoist above emitted the index), so `ap = altlets`
                // becomes a walk-index reset — mirroring the
                // assignment-init rewrite in binaryOp (idxName = 0).
                if (ctx.charBufferRewrites?.has(d.name)) {
                    parts.push(`${ctx.pad()}${ctx.charBufferRewrites.get(d.name).idxName} = 0;`);
                    continue;
                }
                const name = renameIfReserved(d.name);
                const init = (d.inner || []).find(isExpr);
                if (init) {
                    const initJs = expr(init, ctx, { contextType: d.type?.qualType });
                    parts.push(`${ctx.pad()}${name} = ${initJs};`);
                }
                // No init: hoisted zero-init is already in scope; skip.
            }
            return parts.join('\n');
        };
        // Inside-body comment capture (§23.122) across the wrapped
        // segments.  prevEndLine threads through all stmt emits so
        // comments between adjacent children are recorded regardless
        // of segment boundary.
        let prevEndLine = null;
        let segStart = 0;
        for (const labelIdx of labelIndices) {
            const labelStmt = node.inner[labelIdx];
            const labelName = renameIfReserved(labelStmt.name);
            // Add to reachable set BEFORE walking the segment so any
            // `goto LABEL` within emits `break LABEL`.  Remove
            // afterwards so labels with the same name in another
            // function don't leak.
            ctx.reachableLabels.add(labelName);
            lines.push(`${ctx.pad()}${labelName}: {`);
            ctx.indent++;
            for (const child of node.inner.slice(segStart, labelIdx)) {
                const s = emitChildAsAssignment(child);
                prevEndLine = captureInsideComments(ctx, prevEndLine, child, s);
                if (s) lines.push(s);
            }
            ctx.indent--;
            lines.push(`${ctx.pad()}}`);
            // Once the labeled block closes, any remaining
            // `goto LABEL` from a sibling subtree can no longer bind
            // — drop it from the reachable set so gotoStmt falls back
            // to a TODO comment instead of emitting an unbindable
            // `break LABEL`.
            ctx.reachableLabels.delete(labelName);
            const inner = labelStmt.inner?.[0];
            if (inner && inner.kind !== 'NullStmt') {
                const s = emitChildAsAssignment(inner);
                prevEndLine = captureInsideComments(ctx, prevEndLine, inner, s);
                if (s) lines.push(s);
            }
            segStart = labelIdx + 1;
        }
        for (const child of node.inner.slice(segStart)) {
            const s = emitChildAsAssignment(child);
            prevEndLine = captureInsideComments(ctx, prevEndLine, child, s);
            if (s) lines.push(s);
        }
    }

    ctx.indent--;
    lines.push(ctx.pad() + '}');
    return lines.join('\n');
}

function declStmt(node, ctx) {
    // A C local declaration like `int a = 1, b = 2;` becomes one or
    // more JS `let` lines.  Function-local `static` decls were already
    // hoisted to module scope by functionDecl; skip them here so the
    // body doesn't re-declare-and-reset on every call.
    const lines = [];
    for (const child of node.inner || []) {
        if (child.kind !== 'VarDecl') continue;
        if (child.storageClass === 'static') continue;
        // `extern const T arr[]; /* defined elsewhere */` declared inside
        // a function body — declares storage exists in another TU, not
        // here.  Skip emitting `let arr = ...` so the JS import (which
        // resolves to the actual translated array/function) isn't
        // shadowed by a local null.  C example (insight.c::one_characteristic):
        //   extern const char *const attrname[]; /* attrib.c */
        // The translator was previously emitting `let attrname = null`,
        // breaking the import shadow.
        if (child.storageClass === 'extern') continue;
        // Char-buffer rewrite: `char *p = buf;` becomes
        // `let __nh_p_idx = 0;` (the buf reference is captured for
        // use by *p / *p++ writes elsewhere in the body).
        if (ctx.charBufferRewrites?.has(child.name)) {
            const rewrite = ctx.charBufferRewrites.get(child.name);
            lines.push(ctx.pad() + `let ${rewrite.idxName} = 0;`);
            continue;
        }
        // Eos-walker: `char *bp = eos(buf);` — drop the local
        // entirely.  The body's `*bp = X` writes are rewritten by
        // binaryOp to `bufJs += X`, and `bp++` stmts are dropped at
        // the compoundStmt level.  No JS binding is needed.
        if (ctx.eosWalkers?.has(child.name)) continue;
        // Linked-list iterator: `struct T **var` — emit a pair of
        // tracking variables (<name>__parent, <name>__field).  The
        // init expression, if present, is rewritten by emitLLIterInit
        // to populate both fields atomically.  Subsequent emits of
        // `*var`, `*var = X`, and `var = &Expr.field` are rewritten
        // by unaryOp / binaryOp using the pair-of-lets convention.
        if (ctx.linkedListIterators?.has(child.name)) {
            const name = renameIfReserved(child.name);
            const init = (child.inner || []).find(isExpr);
            const initStr = init ? emitLLIterInit(init, name, ctx) : null;
            if (initStr) {
                lines.push(ctx.pad() + initStr);
            } else {
                lines.push(ctx.pad() + `let ${name}__parent = null;`);
                lines.push(ctx.pad() + `let ${name}__field = null;`);
            }
            continue;
        }
        const name = renameIfReserved(child.name);
        const init = (child.inner || []).find(isExpr);
        const typeStr = child.type?.qualType;
        let initJs;
        if (init) {
            initJs = expr(init, ctx, { contextType: typeStr });
        } else {
            initJs = zeroInitFor(typeStr, ctx);
        }
        registerCharArrayEmittedAsArray(ctx, child.name, typeStr, initJs);
        lines.push(ctx.pad() + `let ${name} = ${initJs};`);
    }
    return lines.join('\n');
}

function returnStmt(node, ctx) {
    const arg = (node.inner || []).find(isExpr);
    if (!arg) {
        // §23.239 — inside a void-char*-out-param callee, every exit
        // returns the out-param buffer so rebinding call sites see
        // the mutations (JS strings can't write back through params).
        if (ctx.voidOutParamReturnName) {
            return ctx.pad() + `return ${ctx.voidOutParamReturnName};`;
        }
        return ctx.pad() + 'return;';
    }
    return ctx.pad() + `return ${expr(arg, ctx)};`;
}

// Detects the strchr-truncate idiom:
//
//   if ((p = strchr(buf, X)) != NULL)
//       *p = '\0';
//
// Both `strchr` and `strrchr` are supported (mapped to JS
// indexOf/lastIndexOf).  Returns {bufNode, charNode, method} if the
// IfStmt matches, else null.  The cond and the p variable are left
// alone — only the body's `*p = 0` is rewritten to truncate the buf
// at the matching position.  p stays bound to strchr's return for
// any later code that uses it.
// Returns the {bufNode, charNode, kind, pName, writeNode} info if
// `node` is `if ((p = strchr_family(buf, X)) != NULL)` (possibly
// inside an `&&` compound cond) with a `*p = 0` write somewhere in
// the then-body.  `writeNode` is the actual BinaryOp(=) node that
// gets rewritten by binaryOp's hook.
function detectStrchrTruncateIf(node) {
    if (!node || node.kind !== 'IfStmt') return null;
    const inner = node.inner || [];
    if (inner.length < 2) return null;
    // 2026-05-30: removed the "no else" restriction.  The recognizer
    // only substitutes the *p = 0 write with the truncate call; the
    // if-stmt itself emits normally.  An else branch's body uses are
    // verified through the regular verifyStrchrTruncateSafe walk
    // (which respects the bufIsArray rebind relaxation).  Per user
    // direction to handle rebind cases.
    const cond = inner[0];
    const thenS = inner[1];
    // Find the `(p = strchr_family(buf, X)) != NULL` subterm.  See
    // findStrchrAssignInCond for the && traversal.
    const pAssign = findStrchrAssignInCond(cond);
    if (!pAssign) return null;
    const pRef = stripCasts(pAssign.inner?.[0]);
    const call = stripCasts(pAssign.inner?.[1]);
    // The LHS of the strchr binding can be either a plain
    // DeclRefExpr (`p = strchr(...)`) or a MemberExpr (`d.p =
    // strchr(...)`) — common in NetHack helper functions that pass
    // a "scratchpad" struct around.  buildExprPath returns a
    // dotted path string for both (e.g., "p" or "d.p") which we
    // use as the safety-check key.
    const pPath = buildExprPath(pRef);
    if (!pPath) return null;
    if (!call || call.kind !== 'CallExpr') return null;
    const callee = stripCasts(call.inner?.[0]);
    const calleeName = callee?.referencedDecl?.name;
    const FAMILY = {
        strchr: 'chr',
        strrchr: 'rchr',
        strstr: 'str',
        strstri: 'stri',
        index: 'chr',
        rindex: 'rchr',
    };
    const kind = FAMILY[calleeName];
    if (!kind) return null;
    const callArgs = (call.inner || []).slice(1);
    if (callArgs.length !== 2) return null;
    const [bufNode, charNode] = callArgs;
    // Emit is `bufJs = nh_strchr_truncate(bufJs, ...)`.  The bufJs
    // must be a valid JS lvalue (rebind target) since string buf
    // returns a new sliced suffix that must be re-stored.  Reject
    // bufs that don't translate to a simple lvalue — otherwise the
    // emit would produce `expr = ...` for a non-assignable expr
    // (e.g. `i + 5 = nh_strchr_truncate(...)` is a parse error).
    if (!isStrchrBufAssignable(bufNode)) return null;
    // Search the then-body for a `*p = 0` write.  Accept any
    // position within the body — multi-stmt bodies are absorbed by
    // rewriting JUST the truncate write at the binaryOp emit, with
    // other stmts emitted normally.
    const writeNode = findFirstTruncateWrite(thenS, pPath);
    if (!writeNode) return null;
    // 2026-05-30: detect "buf is a char-array local" — enables
    // additional post-truncate relaxations in verifyStrchrTruncateSafe
    // (pointer-arith on bp, rebind to the same buf, function-arg
    // pass-through).  bufPath is the same buf's path for cross-
    // referencing in the rebind safety check (`bp = buf` rebind).
    const bufIsArray = isCharArrayLocalDecl(bufNode);
    const bufPath = bufIsArray ? buildExprPath(stripCasts(bufNode)) : null;
    return { bufNode, charNode, kind, pPath, writeNode, bufIsArray, bufPath };
}

// True iff bufNode references a `char buf[N]` (or uint8/int8 typedef
// variant) char-array local declaration.  For these cases the
// strchr-family return at runtime is still a string (the c2js-
// runtime coerces array bufs through coerceCStr), but the array
// itself remains addressable — so rebinds `bp = buf` are safe
// because subsequent ops on bp use coerceCStr at runtime.
function isCharArrayLocalDecl(bufNode) {
    const n = stripCasts(bufNode);
    if (!n) return false;
    if (n.kind !== 'DeclRefExpr') return false;
    const decl = n.referencedDecl;
    if (!decl) return false;
    const qt = (decl.qualType || decl.type?.qualType || '')
        .replace(/^(const|volatile|restrict)\s+/, '').trim();
    return /^(char|uint8|int8|unsigned\s+char|signed\s+char)\s*\[/.test(qt);
}

// True iff `bufNode` (the first arg of a strchr-family call inside
// a recognized truncate candidate) translates to a JS expression
// that's a valid assignment LHS.  Required because the emit form is
// `bufJs = nh_strchr_truncate(bufJs, ...)` — for array bufs the
// helper mutates in-place and the assignment is a self-rebind no-op,
// but for string bufs it returns a new sliced suffix and the
// assignment performs the rebind.  Either way, bufJs must be
// assignable.
//
// Accepted shapes:
//   - DeclRefExpr           → `name = ...`
//   - MemberExpr            → `obj.field = ...`
//   - ArraySubscriptExpr    → `arr[i] = ...`
//   - UnaryOp(&, ArraySub)  → handled by emit's offset-split path
//                              (rebinds the inner array base)
//
// Rejected shapes (NOT a single-token lvalue):
//   - BinaryOp(+, ptr, N)   → `ptr + N = ...` is a parse error.
//                              Would need an offset-split rewrite;
//                              not currently implemented.
//   - CallExpr              → `f() = ...` is invalid.
//   - other complex exprs.
function isStrchrBufAssignable(bufNode) {
    let n = stripCasts(bufNode);
    if (!n) return false;
    if (n.kind === 'DeclRefExpr') return true;
    if (n.kind === 'MemberExpr') return true;
    if (n.kind === 'ArraySubscriptExpr') return true;
    if (n.kind === 'UnaryOperator' && n.opcode === '&') {
        const sub = stripCasts(n.inner?.[0]);
        return sub?.kind === 'ArraySubscriptExpr';
    }
    return false;
}

// Builds a dotted-path string for a DeclRefExpr or MemberExpr chain
// (e.g., "p", "d.p", "d.foo.bar.p").  Returns null if the path
// contains anything other than DeclRefExpr / MemberExpr (no calls,
// no subscripts).  Used as the safety-check key for the strchr-
// truncate recognizer to handle both plain variable bindings and
// struct-member bindings (`d.p = strstri(d.bp, " named ")`).
function buildExprPath(node) {
    const parts = [];
    let n = stripCasts(node);
    while (n) {
        if (n.kind === 'DeclRefExpr') {
            parts.unshift(n.referencedDecl?.name);
            return parts.join('.');
        }
        if (n.kind === 'MemberExpr' && n.name) {
            parts.unshift(n.name);
            n = stripCasts(n.inner?.[0]);
            continue;
        }
        return null;
    }
    return null;
}

// Walks `node` recursively for the FIRST `*p = 0` BinaryOp(=) where
// the LHS references the variable / member at `pPath` (e.g., "p" or
// "d.p").  Returns the BinaryOp node or null.
function findFirstTruncateWrite(node, pPath) {
    if (!node || typeof node !== 'object') return null;
    if (node.kind === 'BinaryOperator' && node.opcode === '=') {
        const lhs = stripCasts(node.inner?.[0]);
        // RHS may have a C-style cast (`*p = (char) 0` is common).
        // stripCasts only peels ImplicitCastExpr/ParenExpr; peel any
        // CStyleCastExpr layers explicitly so the literal check below
        // matches `(char) 0` the same as bare `0`.
        let rhs = stripCasts(node.inner?.[1]);
        while (rhs?.kind === 'CStyleCastExpr') {
            rhs = stripCasts(rhs.inner?.[0]);
        }
        if (lhs?.kind === 'UnaryOperator' && lhs.opcode === '*') {
            const lhsInner = stripCasts(lhs.inner?.[0]);
            const innerPath = buildExprPath(lhsInner);
            if (innerPath === pPath
                && ((rhs?.kind === 'IntegerLiteral' && rhs.value === '0')
                    || (rhs?.kind === 'CharacterLiteral'
                        && (rhs.value === 0 || rhs.value === '0')))) {
                return node;
            }
        }
    }
    for (const child of node.inner || []) {
        const hit = findFirstTruncateWrite(child, pPath);
        if (hit) return hit;
    }
    return null;
}

// Walks `body` looking for references to the path `pPath` (e.g.,
// "p" or "d.p") outside ANY strchr-truncate candidate's cond/body.
// Each external reference must be a SAFE usage (null-check or
// strchr-family reassignment), else returns false.
//
// Safe usages:
//   - Bare reference in an IfStmt/WhileStmt cond position (truthy)
//   - LHS or RHS of BinaryOp(==/!=) where the other side is NULL/0
//   - LHS of BinaryOp(=) where the RHS is a CallExpr to strchr family
//     (re-binding p to a fresh strchr-truncate site)
//   - Wrapped in ParenExpr / casts (transparent)
//
// `excluded` is a Set of AST nodes (cond + body of all known
// strchr-truncate candidates).  The walk skips recursing into these
// — refs inside are part of the recognized pattern and don't
// represent "outside" uses.
//
// Unsafe usages (any of these in the body invalidates the candidate):
//   - p++ / ++p / p-- / --p (position arithmetic)
//   - *p (read or write to non-zero RHS — only `*p = 0` is safe)
//   - p + N / p - N (pointer arithmetic)
//   - p[N] (indexed access)
//   - func(p, ...) (pass p as arg)
//   - p as RHS of a non-comparison BinaryOp
function verifyStrchrTruncateSafe(body, pPath, excluded, allowIncr = false,
                                  bufPath = null) {
    let safe = true;
    const visit = (node, parents) => {
        if (!safe || !node || typeof node !== 'object') return;
        if (excluded.has(node)) return;
        // Check if this node is a reference to `pPath` (either a
        // bare DeclRefExpr or a MemberExpr chain).  For MemberExpr,
        // only the OUTERMOST node represents the full path — we
        // skip checking the inner DeclRefExpr/MemberExpr parts to
        // avoid double-counting (and to allow `d` itself to have
        // unrelated other uses).
        const isLeaf = (node.kind === 'DeclRefExpr')
            || (node.kind === 'MemberExpr'
                && parents.length > 0
                && parents[parents.length - 1].kind !== 'MemberExpr');
        if (isLeaf) {
            const path = buildExprPath(node);
            if (path === pPath) {
                if (!isSafePUsage(parents, pPath, allowIncr, bufPath)) {
                    safe = false;
                    return;
                }
                // Don't recurse into a MemberExpr leaf — its inner
                // DeclRefExpr (the struct itself) is just part of
                // the path and may have other independent uses.
                if (node.kind === 'MemberExpr') return;
            }
        }
        for (const child of node.inner || []) visit(child, [...parents, node]);
    };
    visit(body, []);
    return safe;
}

// True iff `node` is a safe RHS for a `bp = X` rebind when buf is
// a char-array.  Accepts:
//   - bufPath rebind (`bp = buf` — bp becomes the same array)
//   - BinaryOp(+, p_or_buf, IntLit) — pointer arith into the array
//   - ConditionalOperator with safe branches (recursive)
//   - null/0 literal
//   - strchr-family CallExpr return
// Rejects everything else.  Caller is verifyStrchrTruncateSafe's
// BinaryOp(=) case — already checked LHS is pPath.
function isSafeArrayBufRebindRhs(rhs, pPath, bufPath) {
    if (!rhs) return false;
    const n = stripCasts(rhs);
    if (!n) return false;
    if (isLikelyNull(n)) return true;
    // bp = bufPath (the strchr's buf) — bp becomes the array.
    if (n.kind === 'DeclRefExpr' || n.kind === 'MemberExpr') {
        const path = buildExprPath(n);
        if (path === bufPath || path === pPath) return true;
    }
    // bp = strchr_family(...) — re-bind to fresh truncate site.
    if (n.kind === 'CallExpr') {
        const callee = stripCasts(n.inner?.[0]);
        const calleeName = callee?.referencedDecl?.name;
        return (calleeName === 'strchr' || calleeName === 'strrchr'
            || calleeName === 'strstr' || calleeName === 'strstri'
            || calleeName === 'index' || calleeName === 'rindex');
    }
    // bp = p + N or buf + N — pointer arith into the array.
    if (n.kind === 'BinaryOperator' && n.opcode === '+') {
        const a = stripCasts(n.inner?.[0]);
        const b = stripCasts(n.inner?.[1]);
        const intLitSide = (a?.kind === 'IntegerLiteral') ? a
                         : (b?.kind === 'IntegerLiteral') ? b : null;
        const refSide = intLitSide === a ? b : a;
        if (!intLitSide || !refSide) return false;
        const refPath = buildExprPath(refSide);
        return refPath === bufPath || refPath === pPath;
    }
    // bp = (cond ? safe : safe) — recursive on branches.
    if (n.kind === 'ConditionalOperator') {
        const [_cond, lhs, rhs2] = (n.inner || []);
        return isSafeArrayBufRebindRhs(lhs, pPath, bufPath)
            && isSafeArrayBufRebindRhs(rhs2, pPath, bufPath);
    }
    return false;
}

// True iff the node at the inner end of `parents` is a SAFE usage
// of the path `pPath`.  The node itself may be a DeclRefExpr (plain
// variable) or a MemberExpr leaf (struct member).  See
// verifyStrchrTruncateSafe for the rule set.
//
// `allowIncr` is set when the enclosing function is in the
// strchr_truncate_p_incr per-site allowlist (and the candidate's
// strchr kind is single-char).  Under that flag, UnaryOp(++/--)
// on `p` post-truncate is accepted as safe; the corresponding
// unaryOperator emit rewrites `p++` to `p = p.substring(1)`.
function isSafePUsage(parents, pPath, allowIncr = false, bufPath = null) {
    // Strip ParenExpr/ImplicitCastExpr/CStyleCastExpr from the
    // innermost-out chain since they're semantically transparent.
    let i = parents.length - 1;
    while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
        || parents[i].kind === 'CStyleCastExpr'
        || parents[i].kind === 'ParenExpr')) {
        i--;
    }
    if (i < 0) return false;
    const direct = parents[i];
    // Case: bare reference in an IfStmt/WhileStmt/ForStmt/DoStmt
    //       cond — truthy null-check.
    if (direct.kind === 'IfStmt' || direct.kind === 'WhileStmt'
        || direct.kind === 'DoStmt') {
        return true;
    }
    // Case: BinaryOp(==/!=, this, null/0).
    if (direct.kind === 'BinaryOperator'
        && (direct.opcode === '==' || direct.opcode === '!=')) {
        const [lhs, rhs] = direct.inner || [];
        const lhsPath = buildExprPath(stripCasts(lhs));
        const other = (lhsPath === pPath) ? rhs : lhs;
        const otherStripped = stripCasts(other);
        if (isLikelyNull(otherStripped)) return true;
        // Comparison of p with another pointer is position-dependent.
        return false;
    }
    // Case: BinaryOp(=, this, RHS) — reassignment overwrites the
    // old p value, so it's safe IF the RHS doesn't depend on p:
    //   - CallExpr to strchr family (re-bind to fresh truncate site)
    //   - NULL / 0 literal (reset)
    if (direct.kind === 'BinaryOperator' && direct.opcode === '=') {
        const lhs = stripCasts(direct.inner?.[0]);
        // Peel chained assignment: `bp = pfx = sfx = X` produces a
        // BinaryOp(=) RHS chain.  The ultimate value bp receives is
        // the rightmost RHS.  Walk down the chain.
        let rhs = stripCasts(direct.inner?.[1]);
        while (rhs?.kind === 'BinaryOperator' && rhs.opcode === '=') {
            rhs = stripCasts(rhs.inner?.[1]);
        }
        if (buildExprPath(lhs) !== pPath) return false;
        if (!rhs) return false;
        // Reset via null/0 literal — safe.
        if (isLikelyNull(rhs)) return true;
        // Re-bind to strchr-family return — safe.
        if (rhs.kind === 'CallExpr') {
            const callee = stripCasts(rhs.inner?.[0]);
            const calleeName = callee?.referencedDecl?.name;
            if (calleeName === 'strchr' || calleeName === 'strrchr'
                || calleeName === 'strstr' || calleeName === 'strstri'
                || calleeName === 'index' || calleeName === 'rindex') {
                return true;
            }
        }
        // Array-buf relaxation: `bp = bufRef` or `bp = bufRef + N`
        // or `bp = (cond ? safe : safe)` — all safe when buf is a
        // char-array local because the runtime helpers coerce
        // arrays through coerceCStr on demand.
        if (bufPath && isSafeArrayBufRebindRhs(rhs, pPath, bufPath)) {
            return true;
        }
        return false;
    }
    // Case: logical operator (&&, ||) — bare-truthy inside a
    // condition; accept as safe (matches `if (p && cond)` style).
    if (direct.kind === 'BinaryOperator'
        && (direct.opcode === '&&' || direct.opcode === '||')) {
        return true;
    }
    // Case: UnaryOp(++/--) — `p++` / `++p` / `p--` / `--p`.
    // Only accepted when the enclosing function is in the
    // strchr_truncate_p_incr allowlist (see analyzeStrchrTruncates).
    // The unaryOperator emit rewrites the UnaryOp to a JS-string
    // slice (`p = p.substring(1)` for ++, `p = p.substring(0,
    // p.length - 1)` for --) so the post-truncate p value is
    // observationally equivalent to C's "advance past the NUL we
    // just wrote".  Restricted to single-char needle families
    // (chr/rchr) at the analyze step.
    if (allowIncr && direct.kind === 'UnaryOperator'
        && (direct.opcode === '++' || direct.opcode === '--')) {
        return true;
    }
    // Case: passing `p` as a function-call argument.  In JS-string
    // semantics p captures the suffix string at the strchr site;
    // passing that string to a function is observationally
    // equivalent to passing a C `char *` substring that ends at the
    // original NUL (or the truncate NUL we just wrote — same
    // boundary).  Only accepted under the same allowlist gate as
    // p++/p--, since these post-truncate patterns are usually paired
    // (`p++; f(p);`).  A char pointer is never used as a callee in
    // NetHack source, so any CallExpr-containing-p means p is an arg.
    if (allowIncr && direct.kind === 'CallExpr') {
        return true;
    }
    // Case: `p + N` / `N + p` where N is an IntegerLiteral.  In C
    // this advances the pointer by N bytes; in JS-string semantics
    // it's a substring slice.  The binaryOp emit rewrites the
    // BinaryOp(+) to `p.substring(N)`.  Restricted to literal N so
    // the rewrite is unambiguous (a variable offset could be
    // negative or out of range, and JS substring's bounds behavior
    // differs from C pointer arithmetic).
    if (allowIncr && direct.kind === 'BinaryOperator'
        && direct.opcode === '+') {
        const a = stripCasts(direct.inner?.[0]);
        const b = stripCasts(direct.inner?.[1]);
        if (a?.kind === 'IntegerLiteral' || b?.kind === 'IntegerLiteral') {
            return true;
        }
    }
    // Anything else: unsafe (position arithmetic, indexed access,
    // function call arg outside allowlist, etc.).
    return false;
}

// Walks the function body to populate ctx.strchrTruncates with safe
// strchr-truncate candidates.  Called by functionDecl before the
// body emit.  Two-pass:
//   1. Identify all candidate IfStmts (shape match).  Two shapes:
//      A) inline-cond: `if ((p = strchr(...)) != NULL) *p = 0;`
//      B) separated:   `p = strchr(...); ...; if (p) *p = 0;`
//         The binding (assignment or VarDecl init) precedes the if
//         in the SAME enclosing compound, with no intervening
//         reassignment of p.
//   2. For each, verify safety with ALL candidates' cond+body+
//      binding nodes excluded from the walk (so references inside
//      other candidates aren't flagged as unsafe).
function analyzeStrchrTruncates(body, ctx) {
    if (!body) return;
    const candidates = []; // {node, info, bindingNode?}
    const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.kind === 'IfStmt') {
            const info = detectStrchrTruncateIf(node);
            if (info) candidates.push({ node, info });
        }
        // Look for separated-assignment pairs in CompoundStmt
        // children.  See detectSeparatedStrchrTruncate.
        if (node.kind === 'CompoundStmt') {
            const children = node.inner || [];
            for (let i = 0; i + 1 < children.length; i++) {
                const sep = detectSeparatedStrchrTruncate(children, i);
                if (sep) candidates.push(sep);
            }
        }
        for (const child of node.inner || []) visit(child);
    };
    visit(body);
    // Build the exclusion set: every candidate's cond, body, and
    // binding nodes (refs inside are part of the recognized
    // pattern).  PLUS every if-stmt whose cond re-binds the same
    // pPath via a strchr-family call — even if its body doesn't
    // contain a `*p = 0` truncate, so it's not itself a candidate.
    //
    // Without this expansion, the safety walk would visit those
    // if-stmt bodies and reject every candidate with the same pPath
    // if ANY position-dependent use of p appears there (e.g.,
    // `if ((d.p = strstri(d.bp, "armour")) != NULL) { d.p += 4; }`).
    // Inside that body, d.p has its own fresh binding from THIS
    // if-stmt's cond, independent of other candidates' bindings;
    // the position-dependent use is safe relative to them.
    const excluded = new Set();
    const pPathsInPlay = new Set();
    for (const c of candidates) pPathsInPlay.add(c.info.pPath);
    const collectReBindIfs = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.kind === 'IfStmt') {
            const reBindAssign = findStrchrAssignInCond(node.inner?.[0]);
            if (reBindAssign) {
                const lhsPath = buildExprPath(stripCasts(reBindAssign.inner?.[0]));
                if (lhsPath && pPathsInPlay.has(lhsPath)) {
                    if (node.inner?.[0]) excluded.add(node.inner[0]);
                    if (node.inner?.[1]) excluded.add(node.inner[1]);
                }
            }
        }
        for (const child of node.inner || []) collectReBindIfs(child);
    };
    collectReBindIfs(body);
    for (const c of candidates) {
        if (c.node) {
            excluded.add(c.node.inner[0]);
            excluded.add(c.node.inner[1]);
        }
        if (c.bindingNode) excluded.add(c.bindingNode);
    }
    // Per-site allowlist gate: if the current function is in
    // strchr_truncate_p_incr, we relax `isSafePUsage` to accept
    // UnaryOp(++/--) on p as a safe post-truncate use AND populate
    // ctx.strchrBoundPaths so unaryOperator emit rewrites those `p++`
    // sites to `p = p.substring(1)`.  The allowlist guarantees:
    // (a) needle is a single char (kind='chr'/'rchr'), (b) no
    // post-truncate buf[i] reads past the truncation point.
    const allowIncr = isInRecognizerAllowlist(
        'strchr_truncate_p_incr', ctx.cFile, ctx.currentFnName,
    );
    for (const { info } of candidates) {
        // The allowlist only covers single-char needle families.
        // bufIsArray: pass through to verifier so it also accepts
        // rebinds to the same buf (`bp = buf`) and conditional-
        // expression RHS where each branch is safe.  Justified
        // because for char-array bufs the runtime helpers coerce
        // arrays to strings on demand (coerceCStr), so a rebind to
        // the same buf is observationally equivalent to capturing
        // the strchr's buf parameter.
        const incrForThis = (allowIncr && (info.kind === 'chr' || info.kind === 'rchr'))
            || info.bufIsArray;
        if (verifyStrchrTruncateSafe(body, info.pPath, excluded,
                                     incrForThis, info.bufPath)) {
            // Key by the *p = 0 write node so binaryOp() can look it
            // up.  Multiple candidates can share a pPath but their
            // writeNodes are distinct.
            ctx.strchrTruncates.set(info.writeNode, info);
            if (incrForThis) ctx.strchrBoundPaths.add(info.pPath);
        }
    }
}

// Local-variable alias-tracking pre-pass.
//
// Walks a function body and classifies each char-pointer VarDecl by
// how the local `p` is USED across the body.  The classification is
// stashed in `ctx.localAliases` keyed by the variable name; consumers
// (the eos-walker recognizer in step 3, the linked-list iterator
// recognizer later) read it to decide what emit rule applies.
//
// This pass is PURE CLASSIFICATION — it does not change emit on its
// own.  Landing it independently is safe and verifiable: self-tests
// stay 32/32, conformance stays 9/9, divergence-table stays byte-
// identical (the new ctx.localAliases map is built but never read by
// existing emit code).
//
// Categories (most-permissive wins when multiple usages exist):
//   'unmoved' — only read uses (deref *p, comparison p == NULL,
//               indexed read p[i], passed to declRefExpr in
//               truthy context, etc.).  Never reassigned, never
//               incremented, never escapes.
//   'walker'  — at least one UnaryOp(++/--) or BinaryOp(+=/-=) on p,
//               but never reassigned and never escapes.  Used by
//               the eos-walker recognizer.
//   'rebound' — at least one BinaryOp(=, p, RHS) post-decl (a fresh
//               binding to a new pointer value).  May also have
//               walker uses.
//   'escape'  — at least one CallExpr where p is passed as an arg.
//               The called function may store p internally or do
//               position arithmetic on its parameter — we can't
//               reason about that, so recognizers that need p's
//               value to be stable should skip escaped locals.
//
// `escape` and `rebound` are conservative — they reflect possible
// non-locality but most NetHack functions don't actually mutate
// a passed `char *` arg.  The classifier doesn't try to be precise
// here; downstream consumers can apply their own predicates.
//
// Scans nested scopes too — `bp` declared inside a guarded block
// (`if (cond) { char *bp = eos(buf); ...}`) is recognized.  Keyed by
// name; collisions across nested scopes are rare in NetHack but
// possible — consumers should validate uniqueness if their rewrite
// depends on it.
function analyzeLocalAliases(body, ctx) {
    ctx.localAliases = new Map();
    if (!body || body.kind !== 'CompoundStmt') return;
    // Step 1: find char-pointer VarDecls ANYWHERE in the function
    // body (including nested compound stmts, for-init clauses,
    // etc.).  Multiple decls with the same name (shadowing) overwrite
    // — last one wins; consumer code should treat shadowed names
    // conservatively if the classification matters.
    const decls = new Map(); // name → {declNode, init}
    const collectDecls = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.kind === 'VarDecl' && node.name) {
            const qt = (node.type?.qualType ?? '')
                .replace(/^(const|volatile|restrict)\s+/, '').trim();
            // Extended to char-pointer typedefs (uint8/int8/unsigned char/
            // signed char) consistent with tryAddCandidate /
            // addParmCharBufferCandidates / findCharPointerAlias (commits
            // 6e79ab7 + 7abd411).
            if (/^(char|uint8|int8|unsigned\s+char|signed\s+char)\s*\*\s*$/.test(qt)) {
                const init = (node.inner || [])[0] ?? null;
                decls.set(node.name, { declNode: node, init });
            }
        }
        // Don't recurse into nested FunctionDecls (shouldn't appear
        // in C99 in body, but defensive).
        if (node.kind === 'FunctionDecl') return;
        for (const child of node.inner || []) collectDecls(child);
    };
    collectDecls(body);
    if (decls.size === 0) return;
    // Step 2: walk the body and classify each name's references.
    // Per-name counters; promoted-most-permissive at end.
    const stats = new Map();
    for (const name of decls.keys()) {
        stats.set(name, {
            refCount: 0, hasIncr: false, hasRebind: false, hasEscape: false,
        });
    }
    const visit = (node, parents) => {
        if (!node || typeof node !== 'object') return;
        if (node.kind === 'DeclRefExpr' && node.referencedDecl?.name
            && stats.has(node.referencedDecl.name)) {
            const name = node.referencedDecl.name;
            const s = stats.get(name);
            s.refCount++;
            // Strip casts/parens going up to find the direct parent.
            let i = parents.length - 1;
            while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
                || parents[i].kind === 'CStyleCastExpr'
                || parents[i].kind === 'ParenExpr')) {
                i--;
            }
            const direct = i >= 0 ? parents[i] : null;
            if (direct?.kind === 'UnaryOperator'
                && (direct.opcode === '++' || direct.opcode === '--')) {
                s.hasIncr = true;
            } else if (direct?.kind === 'BinaryOperator'
                && direct.opcode === '=') {
                // LHS = RHS — only counts as rebind if WE are the LHS.
                // (RHS-of-= reads are normal uses, not rebinds.)
                const lhs = stripCasts(direct.inner?.[0]);
                if (lhs?.kind === 'DeclRefExpr'
                    && lhs.referencedDecl?.name === name) {
                    s.hasRebind = true;
                }
            } else if (direct?.kind === 'BinaryOperator'
                && (direct.opcode === '+=' || direct.opcode === '-=')) {
                // Compound assignment: p += N — also a walker (jump).
                const lhs = stripCasts(direct.inner?.[0]);
                if (lhs?.kind === 'DeclRefExpr'
                    && lhs.referencedDecl?.name === name) {
                    s.hasIncr = true;
                }
            } else if (direct?.kind === 'CallExpr') {
                // Treat as escape if leaf is in the args (any inner
                // position past the callee).  A char-pointer local is
                // never the callee, so position-in-inner is enough.
                const innerList = direct.inner || [];
                const nextDown = (i + 1 < parents.length) ? parents[i + 1] : node;
                if (innerList.length > 0 && innerList[0] !== nextDown) {
                    s.hasEscape = true;
                }
            }
        }
        for (const child of node.inner || []) {
            visit(child, [...parents, node]);
        }
    };
    visit(body, []);
    // Step 3: synthesize the classification per name.
    for (const [name, info] of decls) {
        const s = stats.get(name);
        let classification;
        if (s.hasRebind) classification = 'rebound';
        else if (s.hasEscape) classification = 'escape';
        else if (s.hasIncr) classification = 'walker';
        else classification = 'unmoved';
        ctx.localAliases.set(name, {
            init: info.init,
            declNode: info.declNode,
            classification,
            hasIncr: s.hasIncr,
            hasRebind: s.hasRebind,
            hasEscape: s.hasEscape,
            refCount: s.refCount,
        });
    }
    // Opt-in debug: print classifications for sanity checking the
    // classifier output.  Gated on NH_DEBUG_LOCAL_ALIASES env var; off
    // by default so production builds emit nothing extra.  Useful when
    // verifying coverage for a new consumer (eos-walker recognizer,
    // etc.) without re-deriving the count by hand.
    if (typeof process !== 'undefined'
        && process.env?.NH_DEBUG_LOCAL_ALIASES === '1'
        && ctx.localAliases.size > 0) {
        const tag = `${ctx.cFile ?? '?'}:${ctx.currentFnName ?? '?'}`;
        const summary = [...ctx.localAliases.entries()]
            .map(([n, v]) => `${n}=${v.classification}(refs=${v.refCount})`)
            .join(', ');
        process.stderr.write(`[localAliases] ${tag}  ${summary}\n`);
    }
}

// Eos-walker recognizer pre-pass.
//
// Identifies char-pointer locals matching the C "buffer builder"
// idiom:
//
//   char *bp = eos(buf);              // bp = buf + strlen(buf)
//   while (cond) {
//       *bp = ' ';                    // write at current position
//       bp++;                         // advance
//   }
//   *bp = '\0';                       // final terminator (optional)
//
// In NetHack source this appears in let_to_name (invent.c), topten
// (center/topten_print padding), the_unique_obj (objnam.c), and a
// handful of other places where a fixed-width "label + padding"
// string is constructed by walking past the existing NUL.
//
// JS rewrite (consumers): drop the bp VarDecl, drop bp++ stmts,
// drop *bp = NUL writes, rewrite each `*bp = X` as
// `bufJs += String.fromCharCode(X)` (or `bufJs += '<char>'` for a
// character literal).  Net effect: the JS reads as an append-loop
// instead of a pointer walk.
//
// Reads ctx.localAliases (populated by analyzeLocalAliases) and
// looks for names whose classification is 'walker' AND whose init
// is `eos(bufExpr)`.  Stashes {bufExpr, declNode} per name.
//
// Safety predicates:
//   - bufExpr must be a pure-read AST node (DeclRefExpr or
//     MemberExpr) so the JS emit can repeat the access on every
//     write without side-effects.  CallExpr / BinaryOp bufs are
//     rejected (the eos call would have to be evaluated again or
//     the result stashed; not implemented).
//   - bufExpr must NOT be a charBufferRewrites target; that
//     recognizer handles its own pattern with indexed writes, and
//     mixing the two models corrupts the buffer.
//   - The classifier already verified bp has no rebind / no escape;
//     so all bp refs are reads, *bp writes, or bp++/bp-- walkers.
//     Any non-walker classification skips the name.
function analyzeEosWalkers(body, ctx) {
    ctx.eosWalkers = new Map();
    if (!ctx.localAliases || ctx.localAliases.size === 0) return;
    for (const [name, info] of ctx.localAliases) {
        // Accept 'walker' (decl-init eos) and 'rebound' (assignment-init
        // eos).  For 'rebound' classification, find the single eos()
        // assignment in the body and treat it as the effective init
        // (per user direction 2026-05-30 to handle the
        // `extra_types = eos(types)` pattern in invent.js getobj).
        if (info.classification !== 'walker'
            && info.classification !== 'rebound') continue;
        let init = info.init;
        // Decl-init eos case: init is the VarDecl's eos(BUF) call.
        // Assignment-init case: init is null OR not an eos() call;
        // look for `name = eos(BUF)` assignment in the body.
        let isAssignmentInit = false;
        if (!init || init.kind !== 'CallExpr'
            || stripCasts(init.inner?.[0])?.referencedDecl?.name !== 'eos') {
            const found = findEosAssignment(body, name);
            if (!found) continue;
            init = found;
            isAssignmentInit = true;
        }
        const callee = stripCasts(init.inner?.[0]);
        const calleeName = callee?.referencedDecl?.name;
        if (calleeName !== 'eos') continue;
        const bufExpr = stripCasts(init.inner?.[1]);
        if (!bufExpr) continue;
        if (bufExpr.kind !== 'DeclRefExpr' && bufExpr.kind !== 'MemberExpr') continue;
        // charBufferRewrites already owns its source bufs — skip
        // overlapping names so a buf isn't rewritten by two
        // recognizers in one function.
        const bufName = bufExpr.kind === 'DeclRefExpr'
            ? bufExpr.referencedDecl?.name
            : null;
        if (bufName && ctx.charBufferRewrites?.has(bufName)) continue;
        // Strict-pattern check: the classifier's 'walker' tag only
        // proves "has ++ or --, no rebind, no escape" — it doesn't
        // rule out other reads (comparisons p > buf, indexed reads
        // p[-1], pointer arithmetic p - buf, etc.) that the eos-
        // walker rewrite CANNOT preserve in JS-string semantics
        // (the JS emit drops bp entirely; any read that depends on
        // bp's position becomes a reference error).  Verify the
        // body refs are exactly the walker subset: bp++/bp--, or
        // *bp = X writes (LHS of assignment), or the combined
        // *bp++ = X.  Reject everything else.
        if (!verifyEosWalkerPattern(body, name)) continue;
        ctx.eosWalkers.set(name, { bufExpr, declNode: info.declNode });
    }
}

// Walks the function body and verifies every reference to `name` is
// a member of the strict eos-walker safe set:
//   - UnaryOp(++/--) on bp (statement or expression form)
//   - UnaryOp(*) on bp that's the LHS of a BinaryOp(=) write
//   - UnaryOp(*) on UnaryOp(++/--) on bp (the *bp++ combined form)
//     that's the LHS of a BinaryOp(=) write
// The decl-init reference (eos(buf)) is excluded by skipping
// references inside the declNode's init expression — that's the
// binding site, not a body use.
//
// Any other context — including `bp > buf`, `bp[i]`, `bp - buf`,
// `*bp` as a read, `bp == NULL`, etc. — fails the check and the
// eos-walker rewrite is rejected (the local stays as a normal
// `let bp = eos(buf);` decl with TODO markers for the writes).
// findEosAssignment: scan body for a single `name = eos(BUF)`
// BinaryOperator(=) assignment.  Returns the CallExpr eos node if
// EXACTLY ONE such assignment exists, otherwise null.  Multiple
// rebinds (each potentially with a different buf) make the walker
// ambiguous — rejected.  Used by analyzeEosWalkers for the
// assignment-init pattern (`char *p; ...; p = eos(buf);
// *p++ = X;`) common in NetHack invent.c getobj-style prompt
// building.
function findEosAssignment(body, name) {
    let found = null;
    let multi = false;
    const visit = (node) => {
        if (multi || !node || typeof node !== 'object') return;
        if (node.kind === 'BinaryOperator' && node.opcode === '=') {
            const lhs = stripCasts(node.inner?.[0]);
            if (lhs?.kind === 'DeclRefExpr'
                && lhs.referencedDecl?.name === name) {
                const rhs = stripCasts(node.inner?.[1]);
                if (rhs?.kind === 'CallExpr') {
                    const callee = stripCasts(rhs.inner?.[0]);
                    if (callee?.referencedDecl?.name === 'eos') {
                        if (found) {
                            multi = true;
                            return;
                        }
                        found = rhs;
                    }
                }
            }
        }
        for (const child of node.inner || []) visit(child);
    };
    visit(body);
    return multi ? null : found;
}

function verifyEosWalkerPattern(body, name) {
    let ok = true;
    const visit = (node, parents) => {
        if (!ok || !node || typeof node !== 'object') return;
        if (node.kind === 'DeclRefExpr'
            && node.referencedDecl?.name === name) {
            // Strip casts/parens going up to find the direct parent.
            let i = parents.length - 1;
            while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
                || parents[i].kind === 'CStyleCastExpr'
                || parents[i].kind === 'ParenExpr')) {
                i--;
            }
            const direct = i >= 0 ? parents[i] : null;
            // Case A: UnaryOp(++/--) on bp — walker.  Accepted as
            // a statement OR as the inner of a combined `*bp++ = X`
            // write (where the UnaryOp's parent chain is
            // UnaryOp(*) → BinaryOp(=) with the * on the LHS).  For
            // the combined form, ALSO require the RHS X to be a
            // simple-read expr (same predicate as Case B) so the
            // emit `buf += String.fromCharCode(X)` is faithful.
            if (direct?.kind === 'UnaryOperator'
                && (direct.opcode === '++' || direct.opcode === '--')) {
                // Inspect parents above direct to detect the
                // `*bp++ = X` combined form.
                let j = i - 1;
                while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
                    || parents[j].kind === 'CStyleCastExpr'
                    || parents[j].kind === 'ParenExpr')) {
                    j--;
                }
                const star = j >= 0 ? parents[j] : null;
                if (star?.kind === 'UnaryOperator' && star.opcode === '*') {
                    let k = j - 1;
                    while (k >= 0 && (parents[k].kind === 'ImplicitCastExpr'
                        || parents[k].kind === 'CStyleCastExpr'
                        || parents[k].kind === 'ParenExpr')) {
                        k--;
                    }
                    const grand = k >= 0 ? parents[k] : null;
                    if (grand?.kind === 'BinaryOperator'
                        && grand.opcode === '='
                        && grand.inner?.[0] === star) {
                        if (isSimpleEosWalkerRhs(grand.inner?.[1])) return;
                        ok = false;
                        return;
                    }
                }
                // Statement-form `bp++;` or `++bp;` — always safe;
                // the JS emit just drops the stmt.
                return;
            }
            // Case B: UnaryOp(*, bp) (or UnaryOp(*, UnaryOp(++/--,
            // bp)) for the combined `*bp++ = X` form) — must be LHS
            // of BinaryOp(=), AND the RHS must be a simple-read
            // expression (no side effects, no pointer arithmetic).
            //
            // Without the RHS check the recognizer fires on patterns
            // like `*pp++ = *++d->p` (do-while-loop body in objnam.c
            // readobjnam_parse_charges) — the JS rewrite would lose
            // the loop's actual semantics because the RHS contains
            // its own pointer arithmetic that the eos-walker emit
            // doesn't preserve.
            if (direct?.kind === 'UnaryOperator' && direct.opcode === '*') {
                let j = i - 1;
                while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
                    || parents[j].kind === 'CStyleCastExpr'
                    || parents[j].kind === 'ParenExpr')) {
                    j--;
                }
                const grand = j >= 0 ? parents[j] : null;
                if (grand?.kind === 'BinaryOperator' && grand.opcode === '='
                    && grand.inner?.[0] === direct
                    && isSimpleEosWalkerRhs(grand.inner?.[1])) {
                    return;
                }
                ok = false;
                return;
            }
            // Case C (added 2026-05-30): the assignment-init pattern
            // `name = eos(BUF);` — accept ONCE as the effective init.
            // analyzeEosWalkers's findEosAssignment helper already
            // enforced uniqueness (multi=null returned), so any
            // matching BinaryOp(=, name, eos-call) here is the one
            // accepted by the recognizer.
            if (direct?.kind === 'BinaryOperator' && direct.opcode === '='
                && direct.inner?.[0]
                && stripCasts(direct.inner[0])?.referencedDecl?.name === name) {
                const rhs = stripCasts(direct.inner[1]);
                if (rhs?.kind === 'CallExpr') {
                    const callee = stripCasts(rhs.inner?.[0]);
                    if (callee?.referencedDecl?.name === 'eos') {
                        return; // accepted
                    }
                }
            }
            // Anything else — comparison, indexed access, function
            // call arg (already classified as 'escape' but defensive),
            // pointer arithmetic, etc. — reject.
            ok = false;
        }
        for (const child of node.inner || []) {
            visit(child, [...parents, node]);
        }
    };
    visit(body, []);
    return ok;
}

// True iff `node` is a simple-read RHS for an eos-walker `*bp = X`
// write — safe to evaluate in the `buf += String.fromCharCode(X)`
// emit without side effects or pointer-arithmetic dependence on bp.
// Accepts: literals, plain DeclRefExpr, MemberExpr (struct field
// read), and CallExpr to whitelisted pure functions (highc, lowc).
// Rejects anything containing UnaryOp(++/--/*), BinaryOp, etc. —
// those usually indicate the walker is part of a more complex
// idiom (a string-copy loop, not just a fixed-fill).
function isSimpleEosWalkerRhs(node) {
    if (!node) return false;
    const n = stripCasts(node);
    if (!n) return false;
    if (n.kind === 'CharacterLiteral') return true;
    if (n.kind === 'IntegerLiteral') return true;
    if (n.kind === 'DeclRefExpr') return true;
    if (n.kind === 'MemberExpr') return true;
    return false;
}

// Linked-list iterator recognizer pre-pass.
//
// Detects locals declared as `struct T **var;` (pointer-to-pointer)
// whose body uses match the strict C "list walk via pointer-to-
// pointer" idiom:
//
//   struct obj **prev;
//   for (prev = &container->cobj; *prev; prev = &(*prev)->nobj)
//       if (*prev == obj) break;
//   if (!*prev) panic(...);
//   *prev = obj->nobj;       // unlink
//   ...
//   *prev = obj;             // relink
//
// In JS we model var as a PAIR of variables:
//   <name>__parent = <some-object>
//   <name>__field  = '<field-name-string>'
// So that:
//   *var        →  <name>__parent[<name>__field]
//   *var = X    →  <name>__parent[<name>__field] = X
//   var = &Expr.field      →  (<name>__parent = Expr,
//                              <name>__field = 'field')
//   var = &(*var)->field   →  (<name>__parent = <name>__parent[<name>__field],
//                              <name>__field = 'field')
//
// Strict-pattern verifier (verifyLLIterPattern): every reference to
// `var` must be one of the four forms above.  Comparisons (`var ==
// other`), passing var as a function arg, or pointer arithmetic
// reject the recognition entirely so the local emits as a normal
// (broken) translation with TODO markers — never silently wrong.
//
// Stores per-name {declNode} in ctx.linkedListIterators.
function analyzeLinkedListIterators(body, ctx) {
    ctx.linkedListIterators = new Map();
    if (!body || body.kind !== 'CompoundStmt') return;
    // Step 1: collect struct-pointer-to-pointer VarDecls.  Match by
    // qualType regex; clang emits "struct T **" (with optional
    // const/volatile prefix).  Skip array decls, function decls,
    // etc.  Nested-scope decls are scanned too — the verifier walks
    // the entire function body so a nested-scope var with the same
    // name as an outer would shadow incorrectly, but in NetHack
    // source this collision doesn't occur.
    const decls = new Map();
    const collectDecls = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.kind === 'VarDecl' && node.name) {
            const qt = (node.type?.qualType ?? '')
                .replace(/^(const|volatile|restrict)\s+/, '').trim();
            // Match "struct T **" where T is any identifier.
            if (/^struct\s+\w+\s*\*\*\s*$/.test(qt)) {
                decls.set(node.name, { declNode: node });
            }
        }
        if (node.kind === 'FunctionDecl') return;
        for (const child of node.inner || []) collectDecls(child);
    };
    collectDecls(body);
    if (decls.size === 0) return;
    // Step 2: strict-pattern verifier per name.  Reject if any ref
    // doesn't match the four allowed forms.
    for (const [name, info] of decls) {
        if (verifyLLIterPattern(body, name)) {
            ctx.linkedListIterators.set(name, info);
        }
    }
}

// Walks the function body verifying every reference to `name` is a
// permitted linked-list-iterator pattern.  Returns true iff ALL refs
// match.  See analyzeLinkedListIterators for the four forms.
//
// Note on the init-side reference: the VarDecl's init expression
// may itself be a usage (e.g., `struct obj **objchn = u_carry
// ? &gi.invent : &mon->minvent;`).  We treat the init like any
// other ref of the OWN VarDecl's name?  No — the init has no `name`
// references (since `name` is being defined).  So we don't need to
// special-case it.  References elsewhere in the body match the
// usage forms below.
function verifyLLIterPattern(body, name) {
    let ok = true;
    const visit = (node, parents) => {
        if (!ok || !node || typeof node !== 'object') return;
        if (node.kind === 'DeclRefExpr'
            && node.referencedDecl?.name === name) {
            // Find the direct parent (strip casts/parens).
            let i = parents.length - 1;
            while (i >= 0 && (parents[i].kind === 'ImplicitCastExpr'
                || parents[i].kind === 'CStyleCastExpr'
                || parents[i].kind === 'ParenExpr')) {
                i--;
            }
            const direct = i >= 0 ? parents[i] : null;
            // Form 1: UnaryOp(*, var) — `*var` deref.  Acceptable
            // anywhere (read or write LHS).  The unaryOp emit
            // rewrites this to `<name>__parent[<name>__field]`.
            // BUT reject if the surrounding context is ALSO a deref
            // (i.e., `**var`) — the LLI emit only handles single-
            // level deref; `**var = X` is a struct-copy through two
            // levels of indirection (the canonical bones-info clone
            // pattern in dungeon.c) which needs a different emit
            // strategy.  Rejecting here keeps the existing hand-
            // patch (if any) intact rather than producing a partial
            // LLI rewrite that leaves TODO markers.
            if (direct?.kind === 'UnaryOperator' && direct.opcode === '*') {
                let j = i - 1;
                while (j >= 0 && (parents[j].kind === 'ImplicitCastExpr'
                    || parents[j].kind === 'CStyleCastExpr'
                    || parents[j].kind === 'ParenExpr')) {
                    j--;
                }
                const above = j >= 0 ? parents[j] : null;
                if (above?.kind === 'UnaryOperator' && above.opcode === '*') {
                    ok = false;
                    return;
                }
                return;
            }
            // Form 2: BinaryOp(=, var, RHS).  The RHS must be either:
            //   - UnaryOp(&, MemberExpr) — `var = &expr.field`
            //   - UnaryOp(&, MemberExpr containing UnaryOp(*, var))
            //     — `var = &(*var)->field` advance
            //   - ConditionalOperator over two such patterns — the
            //     ternary init like `var = cond ? &a.x : &b.y`
            //
            // Anywhere else as LHS of = rejects.
            if (direct?.kind === 'BinaryOperator' && direct.opcode === '='
                && direct.inner?.[0]
                && stripCasts(direct.inner[0]).referencedDecl?.name === name) {
                const rhs = stripCasts(direct.inner?.[1]);
                if (isLLIterRhs(rhs, name)) return;
                ok = false;
                return;
            }
            // Anything else — `var` as a function arg, `var ==
            // other`, etc. — reject.
            ok = false;
        }
        for (const child of node.inner || []) {
            visit(child, [...parents, node]);
        }
    };
    visit(body, []);
    return ok;
}

// True iff the RHS expression of `var = RHS` is a permitted linked-
// list-iterator initializer/advance.  Acceptable shapes:
//   - UnaryOp(&, MemberExpr)
//   - ConditionalOperator(cond, X, Y) where X and Y both match
function isLLIterRhs(rhs, name) {
    if (!rhs) return false;
    if (rhs.kind === 'ConditionalOperator') {
        const inner = rhs.inner || [];
        // clang ternary: inner = [cond, true-branch, false-branch].
        // The OpaqueValueExpr middle slot is absent in c2js's
        // representation (parser normalizes to a 3-element form).
        const t = inner.length === 3 ? stripCasts(inner[1]) : null;
        const f = inner.length === 3 ? stripCasts(inner[2]) : null;
        return isLLIterRhs(t, name) && isLLIterRhs(f, name);
    }
    if (rhs.kind === 'UnaryOperator' && rhs.opcode === '&') {
        const inner = stripCasts(rhs.inner?.[0]);
        // Address-of a MemberExpr: `&expr.field` — accept any depth
        // of MemberExpr chain.  The base may itself contain a deref
        // of `var` (for the advance form `&(*var)->next`).
        if (inner?.kind === 'MemberExpr') return true;
        // Address-of an ArraySubscript: also accept (e.g.,
        // `&arr[i]`) as a base.  Rare in linked-list code but
        // semantically equivalent to MemberExpr.
        if (inner?.kind === 'ArraySubscriptExpr') return true;
    }
    return false;
}

// Emit the linked-list-iterator init: `struct T **var = INIT;`
// becomes `let <name>__parent = ...; let <name>__field = ...;`
// (two let-bindings).  Handles UnaryOp(&, MemberExpr) and
// ConditionalOperator(cond, &Expr.field, &Expr.field).
// Returns the JS string OR null if INIT isn't a recognized shape
// (caller falls back to a null-pair binding).
function emitLLIterInit(initNode, name, ctx) {
    const stripped = stripCasts(initNode);
    if (!stripped) return null;
    // Pure `&MemberExpr` case.
    if (stripped.kind === 'UnaryOperator' && stripped.opcode === '&') {
        const member = stripCasts(stripped.inner?.[0]);
        const pair = llIterMemberPair(member, ctx);
        if (pair) {
            return `let ${name}__parent = ${pair.parent}; let ${name}__field = ${pair.field};`;
        }
    }
    // Ternary: cond ? &A.x : &B.y — each branch independently
    // resolves to (parent, field).  In JS we emit the ternary in
    // both bindings: parent = cond ? Aparent : Bparent, etc.
    if (stripped.kind === 'ConditionalOperator') {
        const inner = stripped.inner || [];
        if (inner.length === 3) {
            const cond = expr(inner[0], ctx);
            const t = stripCasts(inner[1]);
            const f = stripCasts(inner[2]);
            const tPair = (t?.kind === 'UnaryOperator' && t.opcode === '&')
                ? llIterMemberPair(stripCasts(t.inner?.[0]), ctx) : null;
            const fPair = (f?.kind === 'UnaryOperator' && f.opcode === '&')
                ? llIterMemberPair(stripCasts(f.inner?.[0]), ctx) : null;
            if (tPair && fPair) {
                return `let ${name}__parent = (${cond}) ? ${tPair.parent} : ${fPair.parent}; `
                    + `let ${name}__field = (${cond}) ? ${tPair.field} : ${fPair.field};`;
            }
        }
    }
    return null;
}

// Emit the assignment form `var = &Expr.field` (or ternary).
// Returns a comma expression `(<name>__parent = ..., <name>__field
// = ...)` so it works in any expression context (statement, for-
// loop init, for-loop step).  Returns null if RHS isn't a
// recognized init shape (caller falls through to default emit).
function emitLLIterAssign(rhs, name, ctx) {
    if (!rhs) return null;
    if (rhs.kind === 'UnaryOperator' && rhs.opcode === '&') {
        const member = stripCasts(rhs.inner?.[0]);
        const pair = llIterMemberPair(member, ctx);
        if (pair) {
            return `(${name}__parent = ${pair.parent}, ${name}__field = ${pair.field})`;
        }
    }
    if (rhs.kind === 'ConditionalOperator') {
        const inner = rhs.inner || [];
        if (inner.length === 3) {
            const cond = expr(inner[0], ctx);
            const t = stripCasts(inner[1]);
            const f = stripCasts(inner[2]);
            const tPair = (t?.kind === 'UnaryOperator' && t.opcode === '&')
                ? llIterMemberPair(stripCasts(t.inner?.[0]), ctx) : null;
            const fPair = (f?.kind === 'UnaryOperator' && f.opcode === '&')
                ? llIterMemberPair(stripCasts(f.inner?.[0]), ctx) : null;
            if (tPair && fPair) {
                return `(${name}__parent = (${cond}) ? ${tPair.parent} : ${fPair.parent}, `
                    + `${name}__field = (${cond}) ? ${tPair.field} : ${fPair.field})`;
            }
        }
    }
    return null;
}

// For a MemberExpr `expr.field` (or `expr->field`), return
// {parent: <js-expr-for-expr>, field: <quoted-string-for-field>}.
// Returns null if the node isn't a simple MemberExpr (e.g.,
// ArraySubscriptExpr, deeper compound).
function llIterMemberPair(member, ctx) {
    if (!member || member.kind !== 'MemberExpr') return null;
    const base = member.inner?.[0];
    if (!base) return null;
    const fieldName = member.name;
    if (!fieldName) return null;
    const parentJs = expr(base, ctx);
    return { parent: parentJs, field: JSON.stringify(fieldName) };
}

// Helper for compoundStmt and binaryOp: is this stmt-level node a
// "drop this entirely" eos-walker artifact?  Returns true for:
//   - UnaryOp(++/--) on an eos-walker name (statement form)
//   - BinaryOp(=, *bp, NUL) where bp is an eos-walker (terminator
//     drop)
function isEosWalkerDropStmt(node, ctx) {
    if (!ctx.eosWalkers || ctx.eosWalkers.size === 0) return false;
    if (!node) return false;
    // Unwrap ImplicitCastExpr / ParenExpr (an expression at stmt
    // level retains its outer casts).
    let n = node;
    while (n && (n.kind === 'ImplicitCastExpr'
        || n.kind === 'CStyleCastExpr'
        || n.kind === 'ParenExpr')) n = n.inner?.[0];
    if (!n) return false;
    if (n.kind === 'UnaryOperator'
        && (n.opcode === '++' || n.opcode === '--')) {
        const innerRef = stripCasts(n.inner?.[0]);
        if (innerRef?.kind === 'DeclRefExpr'
            && ctx.eosWalkers.has(innerRef.referencedDecl?.name)) {
            return true;
        }
    }
    if (n.kind === 'BinaryOperator' && n.opcode === '=') {
        const lhs = stripCasts(n.inner?.[0]);
        const rhs = stripCasts(n.inner?.[1]);
        if (lhs?.kind === 'UnaryOperator' && lhs.opcode === '*') {
            const inner = stripCasts(lhs.inner?.[0]);
            if (inner?.kind === 'DeclRefExpr'
                && ctx.eosWalkers.has(inner.referencedDecl?.name)
                && isNulCharLiteral(rhs)) {
                return true;
            }
        }
    }
    return false;
}

// Detects the separated-assignment pattern at compound-stmt level:
//
//   stmt[i]:   p = strchr_family(buf, X);   (or VarDecl with init)
//   stmt[i+1]: if (p) *p = 0;               (or if (p != null) ...)
//
// Returns {node: IfStmt, info: {bufNode, charNode, kind, pName,
//   writeNode}, bindingNode: stmt[i]} if matched, else null.
function detectSeparatedStrchrTruncate(children, i) {
    const bindStmt = children[i];
    const ifStmtNode = children[i + 1];
    if (!ifStmtNode || ifStmtNode.kind !== 'IfStmt') return null;
    // Extract the strchr-family binding from stmt[i].  Can be
    // either a standalone BinaryOp(=, DeclRefExpr(p), CallExpr) or
    // a DeclStmt with VarDecl(p, init=CallExpr).
    const binding = extractStrchrBinding(bindStmt);
    if (!binding) return null;
    const { pPath, call, kind } = binding;
    // The IfStmt's cond must be a bare null-check on the SAME p.
    const cond = ifStmtNode.inner?.[0];
    if (!matchesPNullCheck(cond, pPath)) return null;
    // The then-body must contain a `*p = 0` write somewhere.
    const thenS = ifStmtNode.inner?.[1];
    if (!thenS) return null;
    const writeNode = findFirstTruncateWrite(thenS, pPath);
    if (!writeNode) return null;
    // Extract buf and char args from the strchr call.
    const callArgs = (call.inner || []).slice(1);
    if (callArgs.length !== 2) return null;
    const [bufNode, charNode] = callArgs;
    // Same lvalue guard as detectStrchrTruncateIf — the emit form
    // requires bufJs to be a valid JS assignment LHS.
    if (!isStrchrBufAssignable(bufNode)) return null;
    return {
        node: ifStmtNode,
        info: {
            bufNode, charNode, kind,
            pPath,
            writeNode,
        },
        bindingNode: bindStmt,
    };
}

// Tests if `cond` is a bare reference to the path `pPath` (plain
// var or struct member chain) or BinaryOp(==/!=) with the path on
// one side and null on the other.  Used by separated-assignment
// detection — the IfStmt cond is just a null-check (no strchr in
// the cond itself).
function matchesPNullCheck(cond, pPath) {
    if (!cond) return false;
    const stripped = stripCasts(cond);
    if (!stripped) return false;
    if (buildExprPath(stripped) === pPath) return true;
    if (stripped.kind === 'BinaryOperator'
        && (stripped.opcode === '==' || stripped.opcode === '!=')) {
        const [lhs, rhs] = stripped.inner || [];
        // We only accept `!= null`, not `== null` — the latter
        // would mean the if-body fires when p is NULL, where
        // `*p = 0` is undefined behavior.
        if (stripped.opcode !== '!=') return false;
        const sl = stripCasts(lhs);
        const sr = stripCasts(rhs);
        if (buildExprPath(sl) === pPath && isLikelyNull(sr)) return true;
        if (buildExprPath(sr) === pPath && isLikelyNull(sl)) return true;
    }
    return false;
}

// Extracts a `p = strchr_family(buf, X)` binding from a stmt.  The
// stmt can be a standalone ExprStmt(BinaryOp(=, p, CallExpr)) — p
// can be a plain DeclRefExpr or a MemberExpr chain — OR a DeclStmt
// with a VarDecl(p) initialized to CallExpr.  Returns
// {pPath, call, kind} or null.
function extractStrchrBinding(stmt) {
    if (!stmt) return null;
    const FAMILY = {
        strchr: 'chr',
        strrchr: 'rchr',
        strstr: 'str',
        strstri: 'stri',
        index: 'chr',
        rindex: 'rchr',
    };
    const checkCall = (callNode) => {
        const c = stripCasts(callNode);
        if (!c || c.kind !== 'CallExpr') return null;
        const callee = stripCasts(c.inner?.[0]);
        const kind = FAMILY[callee?.referencedDecl?.name];
        return kind ? { call: c, kind } : null;
    };
    // Standalone assignment: BinaryOp(=, <p-ref-or-member>, CallExpr).
    let assign = stripCasts(stmt);
    if (assign?.kind === 'BinaryOperator' && assign.opcode === '=') {
        const pRef = stripCasts(assign.inner?.[0]);
        const pPath = buildExprPath(pRef);
        if (!pPath) return null;
        const callMatch = checkCall(assign.inner?.[1]);
        if (!callMatch) return null;
        return { pPath, call: callMatch.call, kind: callMatch.kind };
    }
    // DeclStmt with VarDecl having a strchr-family CallExpr init.
    if (stmt.kind === 'DeclStmt') {
        const decls = (stmt.inner || []).filter((n) => n.kind === 'VarDecl');
        if (decls.length !== 1) return null;
        const d = decls[0];
        if (d.storageClass === 'static') return null;
        const typeStr = d.type?.qualType || '';
        if (!/^(const\s+)?char\s*\*/.test(typeStr)) return null;
        const init = (d.inner || []).find(isExpr);
        const callMatch = checkCall(init);
        if (!callMatch) return null;
        return { pPath: d.name, call: callMatch.call, kind: callMatch.kind };
    }
    return null;
}

function isLikelyNull(node) {
    if (!node) return false;
    // Peel off any wrapping casts.  The C macro `NULL` typically
    // expands to `((void *)0)`, which clang represents as a
    // CStyleCastExpr wrapping an IntegerLiteral 0.  ImplicitCastExpr
    // and ParenExpr can also wrap the literal in various contexts.
    let n = node;
    while (n && (n.kind === 'ImplicitCastExpr'
        || n.kind === 'CStyleCastExpr'
        || n.kind === 'ParenExpr')) {
        n = n.inner?.[0];
    }
    if (!n) return false;
    if (n.kind === 'IntegerLiteral' && n.value === '0') return true;
    if (n.kind === 'CharacterLiteral' && n.value === 0) return true;
    if (n.kind === 'CXXNullPtrLiteralExpr') return true;
    if (n.kind === 'GNUNullExpr') return true;
    return false;
}

// Walks an IfStmt cond's `&&` chain looking for a subterm of the
// shape `(p = strchr_family(...)) != NULL` or bare `p = strchr_family
// (...)` (without the `!=` check).  Returns the BinaryOp(=) node
// when found, else null.
function findStrchrAssignInCond(cond) {
    const node = stripCasts(cond);
    if (!node) return null;
    if (node.kind === 'BinaryOperator' && node.opcode === '&&') {
        return findStrchrAssignInCond(node.inner?.[0])
            || findStrchrAssignInCond(node.inner?.[1]);
    }
    // Peel off the optional `!= NULL` outer check.
    let check = node;
    if (check.kind === 'BinaryOperator' && check.opcode === '!=') {
        const [neLhs, neRhs] = check.inner || [];
        if (!isLikelyNull(stripCasts(neRhs))) return null;
        check = stripCasts(neLhs);
    }
    if (!check || check.kind !== 'BinaryOperator' || check.opcode !== '=') return null;
    return check;
}

function ifStmt(node, ctx) {
    const [cond, thenS, elseS] = (node.inner || []);
    // Note: the strchr-truncate rewrite no longer lives here.  The
    // ctx.strchrTruncates map is now keyed by the inner `*p = 0`
    // BinaryOp write node, and the rewrite happens at binaryOp's
    // emit.  This lets multi-stmt then-bodies be absorbed too —
    // other stmts in the body emit normally while just the truncate
    // write is rewritten.
    const condJs = expr(cond, ctx);
    let head = ctx.pad() + `if (${condJs}) `;
    let body = stmtBlockOrBraced(thenS, ctx);
    let result = head + body;
    if (elseS) {
        result += ' else ';
        if (elseS.kind === 'IfStmt') {
            // chain into else-if without nested braces
            // emit inline, peeling the leading indent
            const inner = ifStmt(elseS, ctx);
            result += inner.replace(/^\s+/, '');
        } else {
            // Capture comments between thenS end and elseS begin —
            // catches trailing-on-else like
            //   else /* simplify ... */
            //       body;
            // We use captureInsideComments with the elseS as the
            // "next stmt" and the body's JS as the anchor.
            const thenEnd = thenS?.range?.end?.line ?? null;
            // We need elseS's JS to use as anchor — generate it now,
            // record comments, then append.  stmtBlockOrBraced is
            // idempotent for our purposes; we re-call it AFTER
            // recording so the body emit is the one used in output.
            const elseBodyJs = stmtBlockOrBraced(elseS, ctx);
            captureInsideComments(ctx, thenEnd, elseS, elseBodyJs);
            result += elseBodyJs;
        }
    }
    return result;
}

function whileStmt(node, ctx) {
    const [cond, body] = (node.inner || []);
    const condJs = expr(cond, ctx);
    const frame = { kind: 'loop', labelable: true, label: null };
    ctx.breakFrames.push(frame);
    const bodyJs = stmtBlockOrBraced(body, ctx);
    ctx.breakFrames.pop();
    const lbl = frame.label ? `${frame.label}: ` : '';
    return ctx.pad() + lbl + `while (${condJs}) ${bodyJs}`;
}

function doStmt(node, ctx) {
    const [body, cond] = (node.inner || []);
    const frame = { kind: 'loop', labelable: true, label: null };
    ctx.breakFrames.push(frame);
    const bodyJs = stmtBlockOrBraced(body, ctx);
    ctx.breakFrames.pop();
    const lbl = frame.label ? `${frame.label}: ` : '';
    return ctx.pad() + lbl + `do ${bodyJs} while (${expr(cond, ctx)});`;
}

// SwitchStmt: clang gives us [cond, CompoundStmt-body].  Inside the
// body, CaseStmt and DefaultStmt are at the same level as their
// trailing statements; we walk the body's children and emit a JS
// switch with C-faithful fall-through.
function switchStmt(node, ctx) {
    const [cond, body] = (node.inner || []);
    const condJs = expr(cond, ctx);
    if (!body || body.kind !== 'CompoundStmt') {
        return ctx.pad() + `// TODO SwitchStmt with non-compound body\n`;
    }
    const lines = [`${ctx.pad()}switch (${condJs}) {`];
    ctx.indent++;
    // Inside-body comment capture for switch (§23.122).  Each case/
    // default plus the regular stmts that follow it are direct
    // children of the switch's body compound.  Comments between
    // adjacent children need to be captured the same way we do in
    // compoundStmt's no-label path.  prevEndLine threads through
    // emitSwitchChild's recursion.
    let prevEndLine = body.range?.begin?.line ?? null;
    ctx.breakFrames.push({ kind: 'switch', labelable: false, label: null });
    for (const child of body.inner || []) {
        const beforeLineCount = lines.length;
        emitSwitchChild(child, ctx, lines);
        // Use the last pushed line as anchor for any captured
        // comments that fall in the (prevEndLine, child.start) gap.
        const anchorLine = lines[beforeLineCount] || lines[lines.length - 1];
        prevEndLine = captureInsideComments(ctx, prevEndLine, child, anchorLine);
    }
    ctx.breakFrames.pop();
    ctx.indent--;
    lines.push(`${ctx.pad()}}`);
    // Compound-residual capture for switch bodies (mirrors the
    // no-label compoundStmt fallback).  Catches comments between a
    // `case` label and its body, between cases inside #ifdef'd
    // regions, etc. — anywhere in (body.begin, body.end) that
    // wasn't already captured.  Routes through tail-fallback.
    //
    // The switch body's `range.begin.line` is often undefined
    // (clang's JSON omits `line` when the body's `{` is on the
    // same line as `switch (cond)`).  Fall back to the switch
    // node's own begin.line.
    const bodyBegin = body.range?.begin?.line ?? node.range?.begin?.line;
    const bodyEnd = body.range?.end?.line ?? node.range?.end?.line;
    if (bodyBegin != null && bodyEnd != null) {
        for (const c of ctx.comments || []) {
            if (c.line <= bodyBegin) continue;
            if (c.line >= bodyEnd) break;
            if (ctx.emittedComments.has(c.start)) continue;
            if (c.text.length < 30) continue;
            ctx.pendingInsideComments.push({
                outputPath: ctx.opts?.outputPath,
                anchor: '',
                content: c.text,
            });
            ctx.emittedComments.add(c.start);
        }
    }
    return lines.join('\n');
}

// Emit one direct child of a switch's body.  Handles the C idiom of
// stacked-case fall-through: `case 'a': case 'e': stmt;` arrives as
// CaseStmt('a', CaseStmt('e', stmt)) — we walk the chain emitting
// `case 'a':` `case 'e':` as siblings, then translate the final
// non-case stmt.
function emitSwitchChild(child, ctx, lines) {
    if (child.kind === 'CaseStmt') {
        const [valExpr, inner] = child.inner || [];
        const v = caseValue(valExpr, ctx);
        lines.push(`${ctx.pad()}case ${v}:`);
        if (inner) emitSwitchChild(inner, ctx, lines);
    } else if (child.kind === 'DefaultStmt') {
        const [inner] = child.inner || [];
        lines.push(`${ctx.pad()}default:`);
        if (inner) emitSwitchChild(inner, ctx, lines);
    } else {
        // A regular statement under a case label — emit at one extra
        // indent so it nests visually under the case.
        ctx.indent++;
        lines.push(stmt(child, ctx));
        ctx.indent--;
    }
}

function caseValue(node, ctx) {
    // Strip ConstantExpr wrappers clang adds in C99+ mode.
    if (node.kind === 'ConstantExpr') {
        // Prefer the literal value field if present (clang sometimes
        // computes the integer value and stores it directly).
        if (typeof node.value === 'string') return node.value;
        return expr(node.inner?.[0] ?? node, ctx);
    }
    return expr(node, ctx);
}

// Defensive: case/default outside switch (shouldn't happen in normal C).
function caseStmtFreestanding(node, ctx) {
    return ctx.pad() + `// TODO bare CaseStmt outside switch\n`;
}
function defaultStmtFreestanding(node, ctx) {
    return ctx.pad() + `// TODO bare DefaultStmt outside switch\n`;
}

function gotoStmt(node, ctx) {
    const name = ctx.labelById.get(node.targetLabelDeclId);
    if (!name) {
        return ctx.pad() + `// TODO goto with unresolved targetLabelDeclId ${node.targetLabelDeclId}\n`;
    }
    const jsName = renameIfReserved(name);
    // Pure-back-jump label: goto re-enters the labeled while-true loop.
    // Checked BEFORE reachableLabels because back-jump labels are
    // added to BOTH sets — backJumpLabels takes precedence so the
    // emit is `continue LABEL` (loop re-entry), not `break LABEL`
    // (loop exit).
    if (ctx.backJumpLabels?.has(name)) {
        return ctx.pad() + `continue ${jsName};`;
    }
    // Forward-into-if label (A4 recognizer): rewrite as flag-set.
    // The surrounding compoundStmt emitted `let __goto_LABEL = (0);`
    // and the target IfStmt's condition was OR'd with this flag, so
    // the body fires whether the goto fired or the original condition
    // did.
    if (ctx.forwardGotoFlags?.has(jsName)) {
        const flag = ctx.forwardGotoFlags.get(jsName);
        return ctx.pad() + `${flag} = (1);`;
    }
    // Only emit `break LABEL;` if the label is REACHABLE from this
    // point — i.e., the label appears later in some enclosing
    // CompoundStmt that wrapped the segmenting logic.  If it's
    // outside our scope (e.g. nested inside a switch case body's
    // sequence), the `break LABEL` would be an unbindable label
    // and the file wouldn't parse.  Fall back to a TODO comment.
    if (!ctx.reachableLabels?.has(name)) {
        return ctx.pad() + `/* TODO Phase 5+: goto ${name} (label not in scope of break) */`;
    }
    return ctx.pad() + `break ${jsName};`;
}

// Reached only if a LabelStmt isn't a direct child of a CompoundStmt
// (the segmenting pass intercepts those).  In practice, clang places
// labels at the compound-stmt level for typical NetHack code; if a
// future translator hits a deeper one (e.g. label inside a loop body
// nested inside an if), it gets a TODO marker so we can address.
function labelStmtFreestanding(node, ctx) {
    return ctx.pad() + `// TODO LabelStmt ${node.name} not at compound-stmt level`;
}

// `AttributedStmt` wraps a statement with one or more compiler
// attributes — `[[fallthrough]]`, `__attribute__((fallthrough))`,
// `[[likely]]`, etc.  These are hints to the C compiler / static
// analyzer; they don't affect runtime semantics.  Just emit the
// inner statement.  clang places the inner stmt as the LAST child of
// the AttributedStmt; earlier children are the AttrType nodes.
function attributedStmt(node, ctx) {
    const inner = (node.inner || []).filter((n) => n && n.kind && !n.kind.endsWith('Attr')).pop();
    if (inner) return stmt(inner, ctx);
    return '';
}

// Frame-managing wrapper: every ForStmt pushes a loop frame so the
// back-jump label hoist can see its enclosing-loop nesting.  Only
// the plain fallback emit path marks the frame labelable (the
// pointer-walk recognizer paths restructure the loop and haven't
// been audited for label placement); a non-labelable frame simply
// means bare continue/break keep today's emit.
function forStmt(node, ctx) {
    const frame = { kind: 'loop', labelable: false, label: null };
    ctx.breakFrames.push(frame);
    let out;
    try {
        out = forStmtInner(node, ctx, frame);
    } finally {
        ctx.breakFrames.pop();
    }
    if (frame.label) {
        out = out.replace(/^(\s*)/, `$1${frame.label}: `);
    }
    return out;
}

function forStmtInner(node, ctx, __loopFrame) {
    // ForStmt children, per clang: [init, ?, cond, inc, body]
    // The ? slot can be missing (some clangs emit a NullStmt placeholder)
    const inner = node.inner || [];
    let init, cond, inc, body;
    if (inner.length === 5) {
        [init, /*condvar*/, cond, inc, body] = inner;
    } else if (inner.length === 4) {
        [init, cond, inc, body] = inner;
    } else {
        return ctx.pad() + `// TODO ForStmt with ${inner.length} children\n`;
    }

    // ============================================================
    // Recognizer dispatch for pointer-iteration shapes.
    //
    // The translator has multiple pointer-walk recognizers; each
    // handles a specific AST shape.  They MUST be tried in
    // most-specific-first order, because some specific shapes
    // would otherwise be (mis-)caught by a more general recognizer
    // that follows.  Tests under tools/c2js/tests/ exercise each
    // recognizer end-to-end:
    //
    //   - detectPointerIteration:
    //       `for (i = N, p = &arr[K]; ...; i++, p++)` (counter + ptr).
    //       Test: 10-ptr-iter.
    //       (Tightened in commit e0eec6d: counter must NOT be a
    //       struct-ptr local; that case is handled by
    //       detectStructPtrForLoop.)
    //
    //   - detectBoundedStructPtrForLoop:
    //       `for (P = arr, END = &arr[N]; P < END; P++)`.
    //       Boundary pointer + literal `P < END` cond shape.
    //       Test: 19-bounded-ptr-walk.
    //
    //   - detectStructPtrForLoop:
    //       `for (P = arr; cond; P++)` (single struct-ptr walk)
    //       OR `for (P1 = arr1, P2 = arr2; cond; P1++, P2++)`
    //       (paired walks).  Accepts init RHS shapes: `arr`,
    //       `arr + N`, `&arr[N]`.
    //       Tests: 21-ptr-offset-init, 23-comma-init-paired.
    //
    //   - Empty-init branch (inline below):
    //       `for (; cond; P++) body` where P is a parameter or
    //       prior-stmt assignment.  Uses temp-capture form like
    //       detectWhilePtrWalk.
    //       Test: 22-empty-init-for.
    //
    // See docs/TRANSLATOR_ROADMAP.md "Design principles" for the
    // discipline behind these recognizers (narrow-by-default,
    // score-gate verification, body-assignment guards, etc.).
    // ============================================================

    // Detect the C pointer-iteration idiom:
    //   for (i = 0, p = &arr[N]; ...; i++, p++) body
    // — used heavily in NetHack to walk struct arrays.  JS objects are
    // references, not byte-addressable memory, so `p++` on an object
    // yields NaN and the loop body misreads.  We rewrite as:
    //   for (i = 0; ...; i++) { p = arr[i + N]; body }
    // — moving the pointer assignment into the body prefix, dropping
    // the pointer parts from init and inc.
    const ptr = detectPointerIteration(init, inc, ctx);
    if (ptr) {
        return forStmtWithPointerRewrite(ptr, init, cond, inc, body, ctx);
    }

    // Detect the C "bounded pointer walk" idiom:
    //   for (p = arr, end_p = &arr[N]; p < end_p; p++) body
    // — common in NetHack for shop bills (`bp = bill_p, end_bp =
    // &bill_p[billct]; bp < end_bp`).  Init has two struct-pointer
    // assigns; inc has only `p++`; cond is the literal pointer
    // comparison `p < end_p`.  In JS, both `bp < end_bp` and
    // `(bp = __nh_blackhole)` are broken.  Rewrite as:
    //   for (let __nhi_p = 0; __nhi_p < N && (p = arr[__nhi_p]); __nhi_p++) body
    const bp = detectBoundedStructPtrForLoop(init, cond, inc, ctx);
    if (bp) {
        return forStmtWithBoundedRewrite(bp, body, ctx);
    }

    // Simpler variant: `for (p = arr; cond; p++) body` where p is
    // SPECIFICALLY a struct-pointer local (matches the same predicate
    // the unaryOp emitter uses to decide when `p++` becomes the
    // `__nh_blackhole` sentinel).  Without this, the loop runs once,
    // the inc reassigns p to the sentinel, and cond fails — the loop
    // exits prematurely.  Rewrite to indexed iteration.
    //
    // Limited to STRUCT pointers (not char *, int *, etc.) because:
    //  1. Only struct-pointer ++ produces __nh_blackhole anyway, so
    //     the rewrite is necessary only here.
    //  2. char-pointer iteration via `++` is the C string-walk idiom
    //     handled separately in the multi-statement detector and
    //     SPECIAL_FUNCTION_RECOGNIZERS.
    //  3. A previous attempt that fired on any pointer type regressed
    //     seed8000 from 23/23 to 22/23 — caught and reverted.  The
    //     struct-only gate is the safe scope.
    const sp = detectStructPtrForLoop(init, inc, ctx);
    if (sp) {
        return forStmtWithStructPtrRewrite(sp, init, cond, inc, body, ctx);
    }

    // Variant: empty init `for (; cond; p++) body` — same struct-ptr
    // walk but p was set before the loop (e.g. function parameter).
    // Use the same temp-capture trick as detectWhilePtrWalk: capture
    // p's current value once before the loop, then index into it.
    // Clang represents the empty init slot as a node with no `kind`
    // field (vs `NullStmt` for an explicit `;`); accept either.
    //
    // Earlier attempt to generalize to "any init that doesn't assign
    // p" caught the mkobj iprobs walk (`for (tprob = rnd(100); cond;
    // iprobs++)`) but also fired on legitimate scalar-pointer
    // walks where `p++` advances through a single struct's fields,
    // mis-rewriting them.  Regressed seed8000 PASS→FAIL and aggregate
    // P 107122→50493 — caught by score gate and reverted.
    // Tightening to ONLY empty-init for safety; mkobj iprobs needs
    // a different approach (e.g., CompoundStmt-level recognizer that
    // looks at the prior init statement explicitly).
    if ((!init || !init.kind || init.kind === 'NullStmt') && inc && body) {
        const incStrip = stripCasts(inc);
        if (incStrip?.kind === 'UnaryOperator'
            && (incStrip.opcode === '++' || incStrip.opcode === '--')) {
            const incRef = stripCasts(incStrip.inner?.[0]);
            if (incRef?.kind === 'DeclRefExpr'
                && isStructPtrLocal(incRef, ctx)) {
                const ptrVar = incRef.referencedDecl?.name || incRef.name;
                if (ptrVar) {
                    const ptrJs = renameIfReserved(ptrVar);
                    const idxVar = `__nhi_${ptrVar}`;
                    const arrTmp = `__nhi_${ptrVar}_arr`;
                    const condJs = cond && isExpr(cond) ? expr(cond, ctx) : '';
                    const headExpr = condJs
                        ? `(${ptrJs} = ${arrTmp}[${idxVar}]) && (${condJs})`
                        : `(${ptrJs} = ${arrTmp}[${idxVar}])`;
                    const captureJs = `${ctx.pad()}const ${arrTmp} = ${ptrJs};`;
                    return `${captureJs}\n${ctx.pad()}for (let ${idxVar} = 0; ${headExpr}; ${idxVar}++) ${stmtBlockOrBraced(body, ctx)}`;
                }
            }
        }
    }

    const initJs = init && init.kind !== 'NullStmt'
        ? forInit(init, ctx)
        : '';
    const condJs = cond && isExpr(cond) ? expr(cond, ctx) : '';
    const incJs = inc && isExpr(inc) ? expr(inc, ctx) : '';
    // Plain emit preserves the C loop structure 1:1, so a label on
    // the JS `for` binds exactly where the C loop bound.
    __loopFrame.labelable = true;
    return ctx.pad() + `for (${initJs}; ${condJs}; ${incJs}) ${stmtBlockOrBraced(body, ctx)}`;
}

// Walk a comma-operator chain, returning the leaf expressions in
// left-to-right evaluation order.  `(a, b, c)` → [a, b, c].
function flattenCommas(node) {
    if (!node || node.kind !== 'BinaryOperator' || node.opcode !== ',') {
        return [node].filter(Boolean);
    }
    return [...flattenCommas(node.inner[0]), ...flattenCommas(node.inner[1])];
}

// Strip ImplicitCastExpr / ParenExpr wrappers to reveal the underlying
// expression.  Used during pattern-matching where the wrappers are
// type-conversion noise we can ignore.
function stripCasts(node) {
    let n = node;
    while (n && (n.kind === 'ImplicitCastExpr' || n.kind === 'ParenExpr')) {
        n = n.inner?.[0];
    }
    return n;
}

// detectPointerIteration: look at a ForStmt's init and inc.  If they
// fit the `i = 0, p = &arr[N]; ...; i++, p++` shape, return
// {ptrVar, ptrInit, ptrInc, arrayJs, offsetExpr, counterVar}.
// Otherwise return null and the caller falls back to the literal
// translation.
function detectPointerIteration(init, inc, ctx) {
    if (!init || !inc) return null;
    if (inc.kind !== 'BinaryOperator' || inc.opcode !== ',') return null;
    // Find a postfix `p++` (or `--`) on a pointer-typed variable in inc.
    const incOps = flattenCommas(inc);
    let ptrInc = null;
    for (const op of incOps) {
        if (op?.kind !== 'UnaryOperator') continue;
        if (op.opcode !== '++' && op.opcode !== '--') continue;
        const targetType = op.inner?.[0]?.type?.qualType || '';
        if (!/\*\s*$/.test(targetType)) continue;
        const target = stripCasts(op.inner?.[0]);
        if (!target || target.kind !== 'DeclRefExpr') continue;
        ptrInc = op;
        break;
    }
    if (!ptrInc) return null;

    const ptrVar = stripCasts(ptrInc.inner[0])?.referencedDecl?.name;
    if (!ptrVar) return null;

    // Find init's `ptrVar = expr` assignment.  Init may itself be a
    // single assignment, or a comma-chain of them.
    const initOps = init.kind === 'BinaryOperator' && init.opcode === ','
        ? flattenCommas(init)
        : [init];
    let ptrInit = null;
    for (const op of initOps) {
        if (op?.kind !== 'BinaryOperator') continue;
        if (op.opcode !== '=') continue;
        const lhs = stripCasts(op.inner?.[0]);
        if (lhs?.kind !== 'DeclRefExpr') continue;
        if (lhs.referencedDecl?.name !== ptrVar) continue;
        ptrInit = op;
        break;
    }
    if (!ptrInit) return null;

    // Extract the array reference from the init RHS.  Common shapes:
    //   `&arr[N]`     → UnaryOp& over ArraySubscriptExpr(arr, N)
    //   `arr`         → DeclRefExpr to an array (with implicit decay)
    //   `arr + N`     → BinaryOp+ on (arr, N)  (less common)
    //   `*pp`         → UnaryOp* over a ptr-to-ptr (e.g.
    //                   `mi = *pick_list` where pick_list is
    //                   `menu_item **`).  In JS the inner deref
    //                   translates to a value-wrapper access; we
    //                   keep the whole UnaryOp node so expr() emits
    //                   the correct `pick_list.value` form.
    // After stripping casts and a UnaryOp `&`, we hope to land on
    // either an ArraySubscriptExpr or a DeclRefExpr.
    let rhs = stripCasts(ptrInit.inner[1]);
    if (rhs?.kind === 'UnaryOperator' && rhs.opcode === '&') rhs = stripCasts(rhs.inner[0]);
    let arrayNode, offsetNode;
    if (rhs?.kind === 'ArraySubscriptExpr') {
        arrayNode = rhs.inner[0];
        offsetNode = rhs.inner[1];
    } else if (rhs?.kind === 'DeclRefExpr' || rhs?.kind === 'MemberExpr') {
        // MemberExpr handles struct-bucket fields like `svd.dungeons`
        // (which translates to `game.dungeons` after bucket-flatten).
        arrayNode = rhs;
        offsetNode = null;
    } else if (rhs?.kind === 'UnaryOperator' && rhs.opcode === '*') {
        // `*pp` deref of a pointer-to-pointer — keep the whole node
        // so expr() renders it via the established outparam-wrapper
        // convention (e.g. `pick_list.value`).
        arrayNode = rhs;
        offsetNode = null;
    } else {
        return null;
    }

    // Find the counter — an integer assignment in the same init
    // (the OTHER operand of the comma, typically).  REJECT if the
    // candidate's variable is itself a struct-pointer local; that
    // case is a paired-pointer walk, which `detectStructPtrForLoop`
    // (slice 2) handles correctly with a comma-form head.  Treating
    // a struct-ptr as a counter produces broken
    // `for (b = arr; cond; b++) { a = arr2[b]; ... }` output where
    // `b` is indexed-by-object — the test case 23-comma-init-paired
    // catches this regression.
    let counterVar = null;
    for (const op of initOps) {
        if (op === ptrInit) continue;
        if (op?.kind !== 'BinaryOperator' || op.opcode !== '=') continue;
        const lhs = stripCasts(op.inner?.[0]);
        if (lhs?.kind !== 'DeclRefExpr') continue;
        if (isStructPtrLocal(lhs, ctx)) continue;  // skip struct-ptr "counters"
        counterVar = lhs.referencedDecl?.name;
        if (counterVar) break;
    }
    if (!counterVar) return null;

    // Reject CallExpr/StmtExpr arrayNode: forStmtWithPointerRewrite
    // embeds `arr[counter]` in the body prefix which re-renders
    // arr each iteration.  Same defensive narrowing as
    // detectStructPtrForLoop (commit 6136551).  Production sites
    // use stable refs; this guard surfaces synthetic regressions
    // as broken-marker test failures rather than silent
    // mis-evaluation.
    const arrStrip = stripCasts(arrayNode);
    if (arrStrip?.kind === 'CallExpr' || arrStrip?.kind === 'StmtExpr') {
        return null;
    }

    return { ptrVar, ptrInit, ptrInc, arrayNode, offsetNode, counterVar };
}

// Emit the rewritten for-loop with the pointer iteration moved into
// the body.
// Detect `for (p = ARR; COND; p++) body` where p is a struct-pointer
// local — or the comma-init paired form
// `for (p1 = ARR1, p2 = ARR2; COND; p1++, p2++) body`.
// Reuses isStructPtrLocal() — the same predicate that gates
// the __nh_blackhole emission in unaryOp.  Returns
//   { ptrs: [{ptrVar, arrayNode, startNode}, ...] }
// for any matching shape (single-pointer arrays are length 1).
// Returns null if the loop doesn't fit the struct-ptr walk shape.
function detectStructPtrForLoop(init, inc, ctx) {
    if (!init || !inc) return null;
    // Collect init operations (either a single assignment or a comma chain
    // of assignments) into a parallel list of {ptrVar, arrayNode, startNode}.
    const initOps = init.kind === 'BinaryOperator' && init.opcode === ','
        ? flattenCommas(init) : [init];
    const ptrs = [];
    const ptrNames = new Set();
    for (const op of initOps) {
        const parsed = parsePtrInitAssignment(op, ctx);
        if (!parsed) return null;
        if (ptrNames.has(parsed.ptrVar)) return null;  // duplicate name
        ptrNames.add(parsed.ptrVar);
        // Reject CallExpr (or impure StmtExpr) array references: the
        // emitter embeds arrayJs inline in the cond, which would
        // re-invoke the call each iteration.  detectWhilePtrWalk
        // (slice 3b) handles CallExpr correctly via temp-capture
        // but the for-loop emitters don't yet (test 29 documented
        // the limitation; fix needs translator-emit-context
        // machinery).  By rejecting here, the loop falls through
        // to literal translation which emits `(p = __nh_blackhole)`
        // — caught loudly by the broken-marker self-test assertion.
        const arrStrip = stripCasts(parsed.arrayNode);
        if (arrStrip?.kind === 'CallExpr' || arrStrip?.kind === 'StmtExpr') {
            return null;
        }
        ptrs.push(parsed);
    }
    if (!ptrs.length) return null;
    // Verify the inc walks all of the same pointers with `++` or `--`.
    const incOps = inc.kind === 'BinaryOperator' && inc.opcode === ','
        ? flattenCommas(inc) : [inc];
    if (incOps.length !== ptrs.length) return null;
    const incNames = new Set();
    for (const op of incOps) {
        const incStrip = stripCasts(op);
        if (incStrip?.kind !== 'UnaryOperator') return null;
        if (incStrip.opcode !== '++' && incStrip.opcode !== '--') return null;
        const incRef = stripCasts(incStrip.inner?.[0]);
        if (incRef?.kind !== 'DeclRefExpr') return null;
        if (!isStructPtrLocal(incRef, ctx)) return null;
        incNames.add(incRef.referencedDecl?.name || incRef.name);
    }
    for (const p of ptrs) if (!incNames.has(p.ptrVar)) return null;
    return { ptrs };
}

// Parse a single `p = expr` init assignment from a struct-ptr for-loop.
// Returns {ptrVar, arrayNode, startNode} or null if the shape doesn't
// fit a struct-pointer-walk init.  The RHS is decomposed into
// {arrayNode, startNode} where startNode is the integer offset into
// the array:
//   `arr`     → startNode=null (start at 0)
//   `arr + N` → startNode=N
//   `&arr[N]` → startNode=N
// Anything else: arrayNode=raw RHS, startNode=null (fall back to legacy
// `[0]$` strip in the emitter).
function parsePtrInitAssignment(node, ctx) {
    const initStrip = stripCasts(node);
    if (initStrip?.kind !== 'BinaryOperator' || initStrip.opcode !== '=') return null;
    const initLhs = stripCasts(initStrip.inner?.[0]);
    if (initLhs?.kind !== 'DeclRefExpr') return null;
    if (!isStructPtrLocal(initLhs, ctx)) return null;
    const ptrVar = initLhs.referencedDecl?.name || initLhs.name;
    if (!ptrVar) return null;
    const rhsRaw = initStrip.inner?.[1];
    const rhs = stripCasts(rhsRaw);
    let arrayNode = rhsRaw, startNode = null;
    if (rhs?.kind === 'BinaryOperator' && rhs.opcode === '+') {
        // Clang puts the pointer-decayed operand on the left for ptr+int.
        const lhs = stripCasts(rhs.inner?.[0]);
        if (lhs?.kind === 'DeclRefExpr' || lhs?.kind === 'MemberExpr') {
            arrayNode = rhs.inner?.[0];
            startNode = rhs.inner?.[1];
        }
    } else if (rhs?.kind === 'UnaryOperator' && rhs.opcode === '&') {
        const inner = stripCasts(rhs.inner?.[0]);
        if (inner?.kind === 'ArraySubscriptExpr') {
            arrayNode = inner.inner?.[0];
            startNode = inner.inner?.[1];
        }
    }
    return { ptrVar, arrayNode, startNode };
}

// Detect the "bounded pointer walk" idiom:
//   for (P = arr, END = &arr[N]; P < END; P++) body
// where P and END are both struct-pointer locals, the init is a
// comma chain of exactly two assignments, the inc is just P++, and
// the cond is exactly `P < END` (BinaryOp(<) on the two pointers).
// END's init must be `&arr[N]` or `arr + N` with the SAME `arr` as
// P's init (otherwise the boundary doesn't correspond to a slice
// of the same array, and the rewrite would change semantics).
// Returns {ptrVar, arrayNode, countNode} or null.
function detectBoundedStructPtrForLoop(init, cond, inc, ctx) {
    if (!init || !cond || !inc) return null;
    if (init.kind !== 'BinaryOperator' || init.opcode !== ',') return null;
    const initOps = flattenCommas(init);
    if (initOps.length !== 2) return null;

    // Parse both init assignments via the existing helper.
    const p0 = parsePtrInitAssignment(initOps[0], ctx);
    const p1 = parsePtrInitAssignment(initOps[1], ctx);
    if (!p0 || !p1) return null;

    // Inc must be a single ptr++/ptr-- on one of the two pointers.
    const incStrip = stripCasts(inc);
    if (incStrip?.kind !== 'UnaryOperator') return null;
    if (incStrip.opcode !== '++' && incStrip.opcode !== '--') return null;
    const incRef = stripCasts(incStrip.inner?.[0]);
    if (incRef?.kind !== 'DeclRefExpr') return null;
    if (!isStructPtrLocal(incRef, ctx)) return null;
    const iterName = incRef.referencedDecl?.name || incRef.name;

    // The other pointer is the boundary.  Identify which is which.
    const iter = p0.ptrVar === iterName ? p0 : (p1.ptrVar === iterName ? p1 : null);
    const boundary = p0.ptrVar === iterName ? p1 : (p1.ptrVar === iterName ? p0 : null);
    if (!iter || !boundary) return null;

    // Boundary must have a startNode (from `&arr[N]` or `arr + N`).
    // Without it we don't have a count to bound by.
    if (!boundary.startNode) return null;

    // Verify boundary's array matches iter's array (same DeclRef or
    // same MemberExpr).  Compare by rendered JS for simplicity.
    const iterArrJs = expr(iter.arrayNode, ctx).replace(/\[0\]$/, '');
    const boundArrJs = expr(boundary.arrayNode, ctx).replace(/\[0\]$/, '');
    if (iterArrJs !== boundArrJs) return null;

    // Cond must be exactly `iter < boundary` (or `<= boundary - 1`,
    // etc., but we only handle the exact `<` form for safety).
    const condStrip = stripCasts(cond);
    if (condStrip?.kind !== 'BinaryOperator' || condStrip.opcode !== '<') return null;
    const cLhs = stripCasts(condStrip.inner?.[0]);
    const cRhs = stripCasts(condStrip.inner?.[1]);
    const lhsName = cLhs?.kind === 'DeclRefExpr' ? (cLhs.referencedDecl?.name || cLhs.name) : null;
    const rhsName = cRhs?.kind === 'DeclRefExpr' ? (cRhs.referencedDecl?.name || cRhs.name) : null;
    if (lhsName !== iter.ptrVar) return null;
    if (rhsName !== boundary.ptrVar) return null;

    // Reject CallExpr/StmtExpr arrayNode or countNode: the emitter
    // embeds both inline in the for-loop's cond, which would re-
    // evaluate each iteration.  Same defensive narrowing as
    // detectStructPtrForLoop (commit 6136551).  Production sites
    // use stable refs; this guard surfaces synthetic regressions
    // as broken-marker test failures rather than silent
    // mis-evaluation.
    const arrStrip = stripCasts(iter.arrayNode);
    if (arrStrip?.kind === 'CallExpr' || arrStrip?.kind === 'StmtExpr') {
        return null;
    }
    const countStrip = stripCasts(boundary.startNode);
    if (countStrip?.kind === 'CallExpr' || countStrip?.kind === 'StmtExpr') {
        return null;
    }

    // Iter's startNode is optional (defaults to 0); boundary's
    // is required.
    return {
        ptrVar: iter.ptrVar,
        arrayNode: iter.arrayNode,
        startNode: iter.startNode,
        countNode: boundary.startNode,
    };
}

function forStmtWithBoundedRewrite(bp, body, ctx) {
    let arrayJs = expr(bp.arrayNode, ctx);
    arrayJs = arrayJs.replace(/\[0\]$/, '');
    const ptrJs = renameIfReserved(bp.ptrVar);
    const idxVar = `__nhi_${bp.ptrVar}`;
    const startJs = bp.startNode && isExpr(bp.startNode) ? expr(bp.startNode, ctx) : '0';
    const countJs = expr(bp.countNode, ctx);
    // for (let idx = START; idx < COUNT && (p = arr[idx]); idx++) body
    const headExpr = `${idxVar} < ${countJs} && (${ptrJs} = ${arrayJs}[${idxVar}])`;
    return `${ctx.pad()}for (let ${idxVar} = ${startJs}; ${headExpr}; ${idxVar}++) ${stmtBlockOrBraced(body, ctx)}`;
}

function forStmtWithStructPtrRewrite(sp, init, cond, inc, body, ctx) {
    // Render: for (let __i = START; (p = arr[__i]) && COND; __i++) body
    // or, for paired walks, the comma-chain head form:
    //   for (let __i = START; (p1 = arr1[__i], ..., pK = arrK[__i]) && COND; __i++) body
    // — chosen so pK (the LAST assigned, which is the comma's value)
    // is the pointer whose truthiness terminates the loop.  We put the
    // "primary" pointer last (the one referenced in COND, falling
    // back to the first one parsed if no match found).
    // C array-decay (e.g. `svr.rooms` => `game.rooms[0]`) means the
    // init RHS may already have a trailing `[0]` — strip it so we
    // index into the actual array.  startNode (from `arr + N` or
    // `&arr[N]`) becomes the loop's index initializer.
    const ptrs = sp.ptrs;
    const condJs = cond && isExpr(cond) ? expr(cond, ctx) : '';
    // Find the primary pointer: the one whose name appears in cond.
    // Used to choose the comma-form trailing entry so the comma's value
    // (the last expression) is the iteration-terminating pointer.
    let primaryIdx = 0;
    if (condJs) {
        for (let i = 0; i < ptrs.length; i++) {
            const re = new RegExp(`\\b${ptrs[i].ptrVar}\\b`);
            if (re.test(condJs)) { primaryIdx = i; break; }
        }
    }
    // All struct-pointer walks share a single index variable.
    const idxVar = `__nhi_${ptrs[primaryIdx].ptrVar}`;
    // The starting offset must agree across all parallel pointers
    // (otherwise the walks would diverge — the recognizer requires
    // matching shape, so this is just a sanity check).  Take the
    // primary's start as the loop's initializer.
    const primary = ptrs[primaryIdx];
    const startJs = primary.startNode && isExpr(primary.startNode)
        ? expr(primary.startNode, ctx) : '0';
    const initJs = `let ${idxVar} = ${startJs}`;
    // Render each ptr-assign clause, putting primary last.
    // KNOWN LIMITATION: arrayJs is re-evaluated each iteration
    // inside the cond.  For stable refs (DeclRef/MemberExpr to
    // globals) — every current NetHack production site — this
    // is free.  For non-pure RHS like CallExpr (`for (p =
    // pick(); ...; p++)`), each iteration re-invokes the call.
    // Test 29-for-callexpr-init exposes this.  Two fix attempts
    // (temp-capture before loop, temp-capture inside block-wrap)
    // both REGRESSED the engine catastrophically (P=0/0) because
    // the multi-stmt emit conflicts with contexts that expect a
    // single statement from forStmt(); reverted both.  Proper
    // fix needs CompoundStmt-level synthesis or restructured
    // emit-context machinery — deferred to a future session.
    const renderAssign = (p) => {
        let arrayJs = expr(p.arrayNode, ctx);
        arrayJs = arrayJs.replace(/\[0\]$/, '');
        const ptrJs = renameIfReserved(p.ptrVar);
        return `${ptrJs} = ${arrayJs}[${idxVar}]`;
    };
    const others = ptrs.filter((_, i) => i !== primaryIdx).map(renderAssign);
    const primaryAssign = renderAssign(primary);
    const assignChain = others.length
        ? `(${[...others, primaryAssign].join(', ')})`
        : `(${primaryAssign})`;
    const headExpr = condJs ? `${assignChain} && (${condJs})` : assignChain;
    const incJs = `${idxVar}++`;
    return ctx.pad() + `for (${initJs}; ${headExpr}; ${incJs}) ${stmtBlockOrBraced(body, ctx)}`;
}

function forStmtWithPointerRewrite(ptr, init, cond, inc, body, ctx) {
    // Strip ptrInit from init.  If init was a single comma op with
    // exactly two operands, take the OTHER operand directly.
    const initOps = init.kind === 'BinaryOperator' && init.opcode === ','
        ? flattenCommas(init).filter((o) => o !== ptr.ptrInit)
        : [init].filter((o) => o !== ptr.ptrInit);
    // Strip ptrInc from inc similarly.
    const incOps = flattenCommas(inc).filter((o) => o !== ptr.ptrInc);

    // Render the surviving init / cond / inc.
    const initJs = initOps.length
        ? initOps.map((o) => isExpr(o) ? expr(o, ctx) : forInit(o, ctx)).join(', ')
        : '';
    const condJs = cond && isExpr(cond) ? expr(cond, ctx) : '';
    const incJs = incOps.length ? incOps.map((o) => expr(o, ctx)).join(', ') : '';

    // Compose the body-prefix assignment: `p = arr[counter + offset];`
    const arrayJs = expr(ptr.arrayNode, ctx);
    const counterJs = renameIfReserved(ptr.counterVar);
    const ptrJs = renameIfReserved(ptr.ptrVar);
    let indexJs = counterJs;
    if (ptr.offsetNode) {
        const offJs = expr(ptr.offsetNode, ctx);
        if (offJs !== '0') indexJs = `${counterJs} + ${offJs}`;
    }
    const prefix = `${ptrJs} = ${arrayJs}[${indexJs}];`;

    // Wrap body with the prefix.  Synthesize a CompoundStmt with the
    // prefix as a synthetic-text first child, then the original body's
    // children.  If body is itself a CompoundStmt we extend it; if
    // it's a single statement we wrap.
    const synthPrefix = { kind: 'SyntheticText', text: prefix };
    const wrappedInner = body?.kind === 'CompoundStmt'
        ? [synthPrefix, ...(body.inner || [])]
        : [synthPrefix, body].filter(Boolean);
    const wrappedBody = { kind: 'CompoundStmt', inner: wrappedInner };

    return ctx.pad() + `for (${initJs}; ${condJs}; ${incJs}) ${compoundStmt(wrappedBody, ctx)}`;
}

function forInit(node, ctx) {
    if (node.kind === 'DeclStmt') {
        // Inline single-var declaration into a `let` clause.
        const decls = (node.inner || []).filter((n) => n.kind === 'VarDecl');
        if (decls.length === 1) {
            const d = decls[0];
            const name = renameIfReserved(d.name);
            const init = (d.inner || []).find(isExpr);
            const initJs = init ? expr(init, ctx) : zeroForType(d.type);
            return `let ${name} = ${initJs}`;
        }
        // multi-var declarations are uncommon in C for-init; fall back
        const parts = decls.map((d) => {
            const name = renameIfReserved(d.name);
            const init = (d.inner || []).find(isExpr);
            const initJs = init ? expr(init, ctx) : zeroForType(d.type);
            return `${name} = ${initJs}`;
        });
        return `let ${parts.join(', ')}`;
    }
    if (isExpr(node)) return expr(node, ctx);
    return '';
}

function stmtBlockOrBraced(node, ctx) {
    if (node.kind === 'CompoundStmt') return compoundStmt(node, ctx);
    // Wrap single-stmt body in braces for safety/readability.
    ctx.indent++;
    const inner = stmt(node, ctx);
    ctx.indent--;
    return `{\n${inner}\n${ctx.pad()}}`;
}

// ── Expressions ─────────────────────────────────────────────────

const EXPR_KINDS = new Set([
    'IntegerLiteral', 'FloatingLiteral', 'CharacterLiteral', 'StringLiteral',
    'DeclRefExpr', 'BinaryOperator', 'UnaryOperator', 'CompoundAssignOperator',
    'CallExpr', 'ParenExpr', 'ImplicitCastExpr', 'CStyleCastExpr',
    'ConditionalOperator', 'ArraySubscriptExpr', 'MemberExpr',
    'CompoundLiteralExpr', 'InitListExpr', 'UnaryExprOrTypeTraitExpr',
    'StmtExpr', 'PredefinedExpr', 'ConstantExpr',
]);
function isExpr(node) { return node && EXPR_KINDS.has(node.kind); }

function expr(node, ctx, opts = {}) {
    switch (node.kind) {
        case 'IntegerLiteral':       return node.value;
        case 'FloatingLiteral':      return node.value;
        case 'CharacterLiteral':     return String(node.value);
        case 'StringLiteral':        return jsString(node.value);
        case 'DeclRefExpr':          return declRefExpr(node, ctx);
        case 'ParenExpr':            return `(${expr(node.inner[0], ctx)})`;
        case 'ImplicitCastExpr':     return implicitCast(node, ctx);
        case 'CStyleCastExpr':       return cStyleCast(node, ctx);
        case 'BinaryOperator':       return binaryOp(node, ctx);
        case 'UnaryOperator':        return unaryOp(node, ctx);
        case 'CompoundAssignOperator': return compoundAssign(node, ctx);
        case 'CallExpr':             return callExpr(node, ctx);
        case 'ConditionalOperator':  return conditionalExpr(node, ctx);
        case 'ArraySubscriptExpr':   return arraySubscriptExpr(node, ctx);
        case 'MemberExpr':           return memberExpr(node, ctx);
        case 'InitListExpr':         return initListExpr(node, ctx, opts);
        case 'UnaryExprOrTypeTraitExpr': return unaryExprOrTypeTrait(node, ctx);
        case 'StmtExpr':                 return stmtExpr(node, ctx);
        case 'PredefinedExpr':           return predefinedExpr(node, ctx);
        case 'ConstantExpr': {
            // Transparent wrapper.  C99+ wraps every compile-time-
            // constant expression (case labels, array sizes, ...) in
            // ConstantExpr.  If clang already evaluated it to a
            // literal value, prefer that; otherwise unwrap to the
            // inner expression.
            if (typeof node.value === 'string') return node.value;
            return node.inner?.[0] ? expr(node.inner[0], ctx, opts) : '0';
        }
        default:
            return `/* unhandled expr ${node.kind} */ 0`;
    }
}

// `({ stmt1; stmt2; expr; })` — GCC statement expression.  Used in
// NetHack mainly via the `assert(cond)` macro expansion which compiles
// to something like `((void)((cond) || nhassert_fail(...)))`.  These
// are runtime sanity checks; for parity / readability we collapse to
// a no-op `void 0`.  If a future TU uses StmtExpr for real value
// computation, we'd revisit.
function stmtExpr(node, ctx) {
    void node; void ctx;
    return 'void 0 /* StmtExpr */';
}

// `__FUNCTION__`, `__FILE__`, `__PRETTY_FUNCTION__`, etc.  clang gives
// us node.name for the keyword; the actual string value is in node's
// inner StringLiteral when computed.  Emit the inner literal when
// available, else a marker string so error messages remain readable.
function predefinedExpr(node, ctx) {
    const inner = (node.inner || []).find((n) => n.kind === 'StringLiteral');
    if (inner) return jsString(inner.value);
    return jsString(`<${node.name || '__predefined__'}>`);
}

// `sizeof(T)`, `sizeof(expr)`, `_Alignof(T)`, etc.  C uses sizeof
// primarily for two purposes: memory allocation (`alloc(sizeof(T) * n)`)
// and array-length computation (`sizeof(arr) / sizeof(arr[0])`).
//
// For an array type `T[N]`, emit `N` so the `sizeof(arr) / sizeof(arr[0])`
// idiom (NetHack's standard array-length macro `SIZE`) collapses to N
// — i.e. `N / 1` = N.  For non-array types, emit `1` as a placeholder;
// real byte sizes don't have a JS analog, and the runtime allocator
// (Phase 4+) will count by elements rather than bytes anyway.
function unaryExprOrTypeTrait(node, ctx) {
    if (node.name === 'sizeof') {
        // Two C forms:
        //   sizeof(TYPE)  → clang puts the type in node.argType.qualType
        //   sizeof(EXPR)  → no argType; the expression is in inner[0]
        //                   and we read its type instead
        let t = node.argType?.qualType;
        if (!t && node.inner?.[0]) {
            let inner = node.inner[0];
            while (inner && (inner.kind === 'ParenExpr' || inner.kind === 'ImplicitCastExpr')) {
                inner = inner.inner?.[0];
            }
            t = inner?.type?.qualType;
        }
        if (!t) t = '?';
        const arr = parseArrayType(t);
        if (arr) {
            // sizeof(T[N]) = N * sizeof(T).  Compute element size
            // recursively (multi-dimensional arrays nest); fall back
            // to 1 for unknown element types so the SIZE() idiom
            // (sizeof(arr)/sizeof(arr[0])) still yields N.
            const totalBytes = sizeofType(t);
            if (totalBytes !== null) return `${totalBytes} /* sizeof(${t}) */`;
            return `${arr.size} /* sizeof(${t}) */`;
        }
        // Scalar type byte sizes — matches the LP64 ABI used by the
        // contest's C build (Linux x86_64).  Mismatching these breaks
        // PRNG seeding and any size-driven loop (e.g. rnd.c:52
        // `for (i = 0; i < sizeof seed; i++)`).
        const scalarSize = scalarByteSize(t);
        if (scalarSize !== null) return `${scalarSize} /* sizeof(${t}) */`;
        return `1 /* sizeof(${t}) */`;
    }
    return `/* unhandled ${node.name} */ 0`;
}

// Recursive byte-size for any type our translator can model.  Returns
// null when the size can't be determined (e.g., an opaque struct
// without a recorded definition).
function sizeofType(typeStr) {
    const arr = parseArrayType(typeStr);
    if (arr) {
        const elem = sizeofType(arr.element);
        if (elem === null) return null;
        return arr.size * elem;
    }
    const scalar = scalarByteSize(typeStr);
    if (scalar !== null) return scalar;
    // Pointer types are 8 bytes on LP64.
    if (/\*\s*$/.test(stripQuals(typeStr))) return 8;
    return null;
}

// LP64 byte sizes for C scalar types.  Returns null when the type
// isn't a recognized scalar (struct, union, void, etc.).
function scalarByteSize(typeStr) {
    if (!typeStr) return null;
    let t = stripQuals(typeStr).trim();
    // Pointer types are 8 bytes on LP64.
    if (/\*\s*$/.test(t)) return 8;
    // Drop signed/unsigned modifiers — they don't change size.
    t = t.replace(/^(signed|unsigned)\s+/, '').trim();
    switch (t) {
        case 'char':
        case '_Bool':
        case 'bool':
            return 1;
        case 'short':
        case 'short int':
            return 2;
        case 'int':
            return 4;
        case 'long':
        case 'long int':
            return 8;
        case 'long long':
        case 'long long int':
            return 8;
        case 'float':
            return 4;
        case 'double':
            return 8;
        case 'long double':
            return 16;
        case 'size_t':
        case 'ssize_t':
        case 'ptrdiff_t':
        case 'intptr_t':
        case 'uintptr_t':
            return 8;
        case 'int8_t':
        case 'uint8_t':
            return 1;
        case 'int16_t':
        case 'uint16_t':
            return 2;
        case 'int32_t':
        case 'uint32_t':
            return 4;
        case 'int64_t':
        case 'uint64_t':
            return 8;
        default:
            return null;
    }
}

// `InitListExpr` is C's `{ a, b, c }` aggregate initializer.  The
// shape depends on what's being initialized:
//   - struct type     → `{ field1: a, field2: b, field3: c }` using
//                        the struct registry for field names
//   - array type      → `[a, b, c]`
//   - nested forms recurse with the appropriate child type
//
// clang gives us the type of the InitListExpr in `node.type.qualType`.
function initListExpr(node, ctx, opts = {}) {
    const typeStr = opts.contextType ?? node.type?.qualType ?? '';
    const elements = (node.inner || []).filter(isExpr);

    // Array type? — emit a JS array literal.
    const arr = parseArrayType(typeStr);
    if (arr) {
        const parts = elements.map((e) => expr(e, ctx, { contextType: arr.element }));
        // C lets you initialize fewer elements than the size; the rest
        // zero-init.  Fill in trailing zeros to match the declared size.
        while (parts.length < arr.size) {
            parts.push(zeroInitFor(arr.element, ctx));
        }
        return `[${parts.join(', ')}]`;
    }

    // Struct type? — emit an object literal using the registered field
    // names.  C's positional `{ 1, 2 }` matches positional fields in
    // declaration order.  Accepts both `struct foo` and typedef-alias
    // forms.
    const structKey = structRegistryKey(typeStr, ctx);
    if (structKey) {
        const fields = ctx.structs.get(structKey);
        const parts = fields.map((f, i) => {
            let v;
            if (i < elements.length) {
                // Narrow case: only allopt_t's `addr` field gets the
                // value-box wrapper.  Other pointer-field struct
                // inits leave the bare value (matches prior behavior
                // and avoids cascading regressions in code that
                // reads `addr` as truthy/falsy or as a value).
                const fieldType = (f.type || '').trim();
                const isPtrToScalar = /\*\s*$/.test(fieldType)
                    && !/struct\s+/.test(fieldType)
                    && !/\(\*\)/.test(fieldType);
                let addrTarget = elements[i];
                while (addrTarget && (addrTarget.kind === 'ParenExpr' || addrTarget.kind === 'ImplicitCastExpr')) {
                    addrTarget = addrTarget.inner?.[0];
                }
                const isAddrOfMember = addrTarget?.kind === 'UnaryOperator'
                    && addrTarget.opcode === '&'
                    && addrTarget.inner?.[0]?.kind === 'MemberExpr';
                const isAllOpt = (structKey === 'allopt_t' || structKey === 'struct allopt_t')
                    && f.name === 'addr';
                if (isAllOpt && isPtrToScalar && isAddrOfMember) {
                    // allopt_t.addr needs a value-box wrapper so the
                    // `*p = initval` writes in initoptions_init
                    // propagate back to the underlying flags.X
                    // slot.  Include valueOf() so existing JS
                    // sites that read `bool_p == game.flags.female`
                    // and `bool_p != initval` keep working via
                    // ToPrimitive coercion.  (Truthy/falsy contexts
                    // — `if (bool_p)`, `bool_p ? a : b`, `!bool_p`
                    // — still see the object as truthy regardless of
                    // valueOf and are patched per-site downstream.)
                    let n = elements[i];
                    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) n = n.inner?.[0];
                    const targetJs = expr(n.inner?.[0], ctx);
                    v = `{ get value() { return ${targetJs}; }, set value(_v) { ${targetJs} = _v; }, valueOf() { return ${targetJs}; } }`;
                } else {
                    v = expr(elements[i], ctx, { contextType: f.type });
                }
            } else {
                v = zeroForType({ qualType: f.type });
            }
            return `${f.name}: ${v}`;
        });
        return `{ ${parts.join(', ')} }`;
    }

    // Fall back: emit as a JS array (positional).  Fine for unknown
    // anonymous-struct or designated-initializer cases until we hit
    // them.
    const parts = elements.map((e) => expr(e, ctx));
    return `[${parts.join(', ')}]`;
}

// Emit a JS identifier for a clang DeclRefExpr.  Spec §2 flattening
// happens here: any reference to a name in GLOBAL_BUCKETS (`ga`,
// `gb`, ...) emits `game` instead of the bucket name.  Mutable
// globals hoisted onto `game` (set by globalVarDecl) emit `game.X`
// at every reference site.
function declRefExpr(node, ctx) {
    const refName = node.referencedDecl?.name;
    if (!refName) return '???';
    if (GLOBAL_BUCKETS_SET.has(refName)) {
        ctx.gameImportNeeded = true;
        return 'game';
    }
    // Function-local shadow check: if the current function declares a
    // variable (auto / static / parameter) with this name, any reference
    // resolves to the local — NOT to a cross-TU file-static with the
    // same name.  Without this, e.g. hack.c's `in_rooms` local `int
    // step` was incorrectly emitting `game.step` because vision.c has
    // file-static `static int step` registered in crossTuGameHoisted.
    if (ctx.functionLocals?.has(refName)) {
        // Fall through to localStatics rewrite below, or just emit the
        // bare name for auto locals.
        if (ctx.localStatics?.has(refName)) {
            return ctx.localStatics.get(refName);
        }
        return renameIfReserved(refName);
    }
    // Within-TU and cross-TU game-hoisted name rewrite.  The cross-TU
    // set arrives via opts.crossTuGameHoisted from build-tree.
    if (ctx.gameHoistedNames.has(refName) || ctx.opts?.crossTuGameHoisted?.has?.(refName)) {
        ctx.gameImportNeeded = true;
        return `game.${renameIfReserved(refName)}`;
    }
    // External-symbol detection: name not declared in this TU.
    //   1. Hand-curated runtime registry (math.js, panic.js, ...).
    //   2. Cross-TU symbol table (other .c files in the same build
    //      tree pass).
    //   3. Otherwise: bare reference; will fail at module load,
    //      conformance pass surfaces it.
    // Function parameters and function-local VarDecls reach declRefExpr
    // with a referencedDecl whose kind tells us they're scoped to the
    // current function — a TU-wide name lookup would falsely promote a
    // local `magical` parameter into a cross-TU import.  Bail early.
    const refKind = node.referencedDecl?.kind;
    if (refKind === 'ParmVarDecl') {
        return renameIfReserved(refName);
    }
    // Function-local `static` rewrite: the original `static T x` was
    // hoisted by functionDecl to a module-scope `__<fn>_x` binding so
    // it persists across calls.  Every reference inside the current
    // function body resolves to the hoisted name.
    if (refKind === 'VarDecl' && ctx.localStatics?.has(refName)) {
        return ctx.localStatics.get(refName);
    }
    if (refName && !ctx.localNames.has(refName)
        && !RUNTIME_IMPORT_MAP[refName]) {
        if (EXTERNAL_SYMBOLS[refName]) {
            ctx.externalRefs.set(refName, EXTERNAL_SYMBOLS[refName]);
        } else if (ctx.opts?.crossTu?.has?.(refName)) {
            const targetPath = ctx.opts.crossTu.get(refName);
            // Self-references don't need an import (target is this file).
            if (targetPath !== ctx.opts.outputPath) {
                ctx.crossTuRefs.set(refName, targetPath);
            }
        }
    }
    return renameIfReserved(refName);
}

function implicitCast(node, ctx) {
    // `NullToPointer`: C's `(T *)0` — clang inserts this when an
    // integer 0 (or NULL after macro expansion) is used in a pointer
    // context.  Emit JS `null` rather than the literal 0.
    if (node.castKind === 'NullToPointer') return 'null';
    // `LValueToRValue` is invisible in JS.  Integer promotions
    // (`IntegralCast`) may need `| 0` truncation later; skip for
    // now since test cases stay inside int range.
    return expr(node.inner[0], ctx);
}

function cStyleCast(node, ctx) {
    if (node.castKind === 'NullToPointer') return 'null';
    // `(int) x` — for now, just pass through.  A future phase adds
    // `| 0` for narrowing casts.
    return expr(node.inner[0], ctx);
}

function binaryOp(node, ctx) {
    const op = node.opcode;
    const [l, r] = node.inner;
    // Assignment-init charBufferRewrites: `p = bufRef` where p is
    // tagged isAssignmentInit AND this BinaryOp IS one of the recorded
    // assignmentInitNodes.  Emit `__nh_p_idx = 0` (reset position).
    // Must run BEFORE any generic LHS-DeclRefExpr emit because `p`
    // itself no longer exists as a JS binding (it's replaced by
    // `__nh_p_idx`).  Multiple resets are permitted (e.g., the two
    // for-init `rp = replacement` blocks in hacklib.c strNsubst).
    // See addAssignmentInitCharBufferCandidates.
    if (op === '=' && ctx.charBufferRewrites && l?.kind === 'DeclRefExpr') {
        const lName = l.referencedDecl?.name;
        if (lName && ctx.charBufferRewrites.has(lName)) {
            const rewrite = ctx.charBufferRewrites.get(lName);
            if (rewrite.isAssignmentInit
                && Array.isArray(rewrite.assignmentInitNodes)
                && rewrite.assignmentInitNodes.includes(node)) {
                return `${rewrite.idxName} = 0`;
            }
        }
    }
    // Pointer-advance for charBufferRewrites: `p += N` / `p -= N`
    // where p is a recognized walker.  Emit `__nh_p_idx += N`
    // (matches C's pointer-arith semantics in the index-based model).
    // The verifier accepts these via isCharBufferAdvanceUsage; the
    // emit dispatches here.  Added 2026-05-30 for hacklib.c
    // strNsubst's `bp += len;` advance.
    // Linked-list iterator hooks — must come BEFORE any generic
    // `*p = X` recognizer to override the deref-write emit.
    //
    // (1) `*var = X` where var is a tracked LL iterator.  Emit
    //     `<name>__parent[<name>__field] = X`.
    // (2) `var = RHS` where var is a tracked LL iterator and RHS is
    //     `&MemberExpr` or `cond ? &MemberExpr : &MemberExpr`.
    //     Emit a comma expression that updates both __parent and
    //     __field atomically (so this works in for-loop init/step
    //     positions).
    if (ctx.linkedListIterators && ctx.linkedListIterators.size > 0
        && op === '=') {
        // Form (1): *var = X
        const lStripped = stripCasts(l);
        if (lStripped?.kind === 'UnaryOperator' && lStripped.opcode === '*') {
            const inner = stripCasts(lStripped.inner?.[0]);
            if (inner?.kind === 'DeclRefExpr'
                && ctx.linkedListIterators.has(inner.referencedDecl?.name)) {
                const name = renameIfReserved(inner.referencedDecl.name);
                const rJs = expr(r, ctx);
                return `${name}__parent[${name}__field] = ${rJs}`;
            }
        }
        // Form (2): var = &MemberExpr  OR  var = cond ? &A.x : &B.y
        if (lStripped?.kind === 'DeclRefExpr'
            && ctx.linkedListIterators.has(lStripped.referencedDecl?.name)) {
            const name = renameIfReserved(lStripped.referencedDecl.name);
            const assign = emitLLIterAssign(stripCasts(r), name, ctx);
            if (assign) return assign;
            // RHS didn't match — fall through (verifier should have
            // rejected; defensive return of generic emit avoids a
            // silent broken rewrite).
        }
    }
    // Pointer-mutation lvalues that JS can't model without a wrapper
    // class (CharBuffer / typed allocator).  Detect and emit a parseable
    // TODO comment so the surrounding module imports cleanly; the gap
    // is documented for Phase 4+ to fix.  Three sub-patterns:
    //   *p = X            assign through pointer
    //   *p++ = X          assign-then-advance
    //   p++->field = X    advance-then-member-set on struct pointer
    // Outparam write: `*p = X` where p is a known scalar-ptr param
    // becomes `p.value = X`.  Recognized BEFORE the generic
    // pointer-mutation TODO so it's handled correctly.
    if (isAssignmentOp(op) && l?.kind === 'UnaryOperator' && l.opcode === '*'
        && isScalarPtrParamRef(l.inner?.[0], ctx)) {
        const refName = paramRefName(l.inner?.[0]);
        const rJs = expr(r, ctx);
        return `${refName}.value ${op} ${rJs}`;
    }
    // `*p = struct_value` where p is a `struct T *` parameter.
    // JS objects pass by reference, so to reset the caller's struct
    // we copy fields with Object.assign (NOT replace the binding).
    // The earlier concern about Proxy auto-create masking field
    // defaults is mitigated because zero-struct constants like
    // `zeromextra` are emitted with all fields explicit, so
    // Object.assign sets them all.  Limited to op === '=' to avoid
    // intercepting compound ops (+=, etc.) on the rare struct.
    if (op === '=' && l?.kind === 'UnaryOperator' && l.opcode === '*'
        && isStructPtrParamRef(l.inner?.[0], ctx)) {
        const refName = paramRefName(l.inner?.[0]);
        const rJs = expr(r, ctx);
        return `Object.assign(${refName}, ${rJs})`;
    }
    // `*buf = '\0'` (or `*buf = 0`) where buf is a `char [N]` local
    // array — the C "reset buffer to empty string" idiom.  In JS
    // we treat the buffer as a string, so reset with `buf = ''`.
    // Limited to NUL on the RHS to avoid misclassifying actual
    // mid-string writes (which would need offset tracking).
    if (op === '=' && l?.kind === 'UnaryOperator' && l.opcode === '*'
        && isCharArrayDeclRef(l.inner?.[0], ctx)
        && isNulCharLiteral(r)) {
        const rawRefName = paramRefName(l.inner?.[0]);
        // Consult localStatics map for hoisted-static rename (e.g.
        // `static char buf[BUFSZ]` → `__<fn>_buf`).  See companion
        // logic in the ArraySubscriptExpr buf[0]=0 recognizer below.
        const refName = ctx?.localStatics?.get?.(rawRefName)
            || rawRefName;
        /* §23.227 Phase 1 string-mode: when STRING_MODE is set, the
           buffer was emitted as `let buf = ''` instead of an array,
           so the byte-write `buf[0] = 0` is wrong (it writes a
           character property on a string, no-op).  Emit the
           array-form rebind `buf = ''` which works for string buffers.
           Default off — current production keeps the array-form
           byte write for §23.222cz reasons. */
        if (inStringMode(ctx) && ctx && ctx.currentFnName) {
            return `${refName} = ''`;
        }
        // §23.222cz — emit byte-write at index 0 rather than rebinding to ''.
        // The prior emit `buf = ''` rebinds buf to an empty string, which
        // breaks subsequent nh_snprintf(buf, ...) / Sprintf(buf, ...) calls
        // since those check Array.isArray(buf) to decide whether to mutate.
        // After the rebind, those calls become no-ops on the array, and any
        // downstream `enlght_line(..., buf, ...)` sees an empty string.
        // (Surface: insight.c background_enlightenment line 600 `*buf =
        // *tmpbuf = '\0'` followed by `Snprintf(buf, ..., "in %s, on %s",
        // dgnbuf, tmpbuf)` produces empty-buf "You are ." output.)
        // `buf[0] = 0` correctly truncates the C string while preserving
        // the array binding so subsequent sprintf calls mutate.
        return `${refName}[0] = 0`;
    }
    // §23.227 Phase 1 string-mode: `buf[0] = '\0'` (ArraySubscriptExpr
    // form with constant index 0) on a char-array local.  This is the
    // explicit-subscript variant of the `*buf = 0` idiom handled above.
    // In string-mode the buffer is a JS string, so the indexed write
    // is a silent no-op; rebind to '' instead.  Default off keeps the
    // bare array-byte-write emit unchanged for non-string-mode TUs.
    if (op === '=' && l?.kind === 'ArraySubscriptExpr'
        && inStringMode(ctx) && ctx && ctx.currentFnName
        && isNulCharLiteral(r)) {
        const base = stripCasts(l.inner?.[0]);
        const idx = stripCasts(l.inner?.[1]);
        if (base?.kind === 'DeclRefExpr'
            && isCharArrayDeclRef(base, ctx)
            && idx?.kind === 'IntegerLiteral'
            && String(idx.value) === '0') {
            const rawName = base.referencedDecl?.name || base.name;
            // Consult localStatics map so a hoisted static-local (e.g.
            // `static char buf[BUFSZ]` → `__<fn>_buf`) gets rebound to
            // its hoisted name, not the raw C name.  Without this,
            // `buf[0] = 0` in attrib.c's from_what emits `buf = ''`
            // which shadows the module-scope __from_what_buf — the
            // rest of the function still uses the hoisted name, so
            // the function body would see a stale local-shadow ''
            // rather than re-binding the module-scope buffer.
            const hoistedName = ctx?.localStatics?.get?.(rawName);
            const refName = renameIfReserved(hoistedName || rawName);
            return `${refName} = ''`;
        }
        // MemberExpr base: `gk.killer.name[0] = '\0'` (level_tele's
        // clear-the-killer-buffer idiom) — a char[N] STRUCT FIELD.
        // The field holds a JS string (or null at init), so the
        // indexed write was a silent no-op on strings and a strict
        // TypeError on null — swallowed by the ^V dispatch catch, it
        // silently aborted every wizard level-teleport (the getbones
        // x7 cluster's final blocker, Q9 iteration 25).  Same rebind
        // semantics as the DeclRef branch.
        if (base?.kind === 'MemberExpr'
            && isCharArrayFieldType(base)
            && idx?.kind === 'IntegerLiteral'
            && String(idx.value) === '0') {
            const lhsJs = expr(base, ctx);
            return `${lhsJs} = ''`;
        }
    }
    // `*obj.field = '\0'` / `*arr[i].field = '\0'` where the field
    // is `char *` — the same "reset to empty string" idiom on a
    // struct field rather than a local array.  In JS, the field IS
    // the string value (the translator's char-pointer model), so
    // `obj.field = ''` correctly truncates.  See isCharPointerFieldExpr
    // for why this is restricted to MemberExpr/ArraySubscriptExpr
    // and not bare DeclRef.
    if (op === '=' && l?.kind === 'UnaryOperator' && l.opcode === '*'
        && isCharPointerFieldExpr(l.inner?.[0])
        && isNulCharLiteral(r)) {
        const lhsJs = expr(l.inner?.[0], ctx);
        return `${lhsJs} = ''`;
    }
    // `*X = highc(*X)` / `*X = lowc(*X)` — the C "uppercase / lowercase
    // first character" idiom (e.g. Monnam family: `*bp = highc(*bp);`).
    // In JS, since `*bp` for a non-outparam pointer renders as just
    // `bp`, the captured RHS is `highc(bp)` (or `lowc(bp)`).  Replace
    // the whole assignment with the JS first-character transform.
    //
    // §23.228 — Extended to also match `X[0] = highc(X[0])` /
    // `X[0] = lowc(X[0])` (ArraySubscriptExpr LHS form), the
    // shknam.c / shk.c / et al. variant.  Same dual-mode IIFE emit.
    // Must fire BEFORE the generic ArraySubscriptExpr-LHS char-ptr
    // write recognizer below — the IIFE handles the empty-string
    // short-circuit (`if (!__s) return __s`) that __nh_char_write
    // doesn't (it would write a NUL byte at index 0 of an empty
    // string, producing "\0" — non-empty 1-char — instead of "").
    {
        const lhsIsDeref = l?.kind === 'UnaryOperator' && l.opcode === '*';
        const lhsIsIdx0 = l?.kind === 'ArraySubscriptExpr'
            && (() => {
                const i = stripCasts(l.inner?.[1]);
                return i?.kind === 'IntegerLiteral' && String(i.value) === '0';
            })();
        if (op === '=' && (lhsIsDeref || lhsIsIdx0)) {
            const lhsRef = stripCasts(l.inner?.[0]);
            const isHighcLowc = r?.kind === 'CallExpr'
                && (() => {
                    const callee = stripCasts(r.inner?.[0]);
                    const name = callee?.referencedDecl?.name || callee?.name;
                    return name === 'highc' || name === 'lowc';
                })();
            if (isHighcLowc && lhsRef?.kind === 'DeclRefExpr') {
                const callee = stripCasts(r.inner?.[0]);
                const calleeName = callee?.referencedDecl?.name || callee?.name;
                const method = calleeName === 'highc' ? 'toUpperCase' : 'toLowerCase';
                const refName = paramRefName(l.inner?.[0]);
                // Char-array safe (§23.43): if refName is a `char buf[]`
                // array, `arr[0]` is a NUMBER (not a string char), and
                // `arr.slice(1)` returns an array.  Pre-coerce to JS
                // string via inline NUL-terminator walk before applying
                // first-char case transform.  String inputs short-circuit.
                return `${refName} = (() => {`
                    + ` const __s = ${refName};`
                    + ` if (!__s) return __s;`
                    + ` const __t = Array.isArray(__s)`
                    + `   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()`
                    + `   : (__s + '');`
                    + ` return __t.length ? __t[0].${method}() + __t.slice(1) : __s;`
                    + ` })()`;
            }
        }
    }
    // §23.228 — `p[idx] = X` write where p is a `char *` pointer.
    // Pairs with the ArraySubscriptExpr read recognizer in
    // arraySubscriptExpr(): without intercepting this BEFORE the
    // generic emit, expr(LHS) would render the LHS as the function
    // call `__nh_char_at0(__nh_advance_str(p, idx))` (the read form),
    // which is invalid on the left of `=`.  Route through the
    // __nh_char_write runtime helper which mutates an array in place
    // (assignment to local is no-op rebind), creates a new string
    // when p is string (rebind is meaningful), or sets `.value` on a
    // scalar-ptr wrapper when idx===0.
    //
    // Restricted to char-pointer base (DeclRefExpr / MemberExpr with
    // `char *` type); plain `char [N]` array bases keep their bare
    // `arr[N] = X` emit since the dual-mode runtime preserves the
    // array form for those.  See arraySubscriptExpr() for the
    // matching type test.
    // Skip when RHS is itself a chained assignment — let the chain
    // handler below decompose into a comma expression first, so each
    // arr[N] = X in the chain becomes a proper __nh_char_write call
    // independently rather than nesting them as
    // `outer[0] = __nh_char_write(outer, 0, inner[0] = __nh_char_write(...))`.
    if (op === '=' && l?.kind === 'ArraySubscriptExpr'
        && !(r?.kind === 'BinaryOperator' && isAssignmentOp(r.opcode))) {
        const base = stripCasts(l.inner?.[0]);
        const isCharPtrBase = (n) => {
            if (!n) return false;
            if (n.kind !== 'DeclRefExpr' && n.kind !== 'MemberExpr') return false;
            const t = (n.type?.qualType || '').trim();
            return /^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(t);
        };
        // §23.231 — Also handle char-array LHS in string-mode TUs.
        // For local `char buf[N]` declarations, string-mode rebinds
        // `buf = ''`.  Subsequent `buf[i] = X` writes silently no-op
        // on the string.  Route through __nh_char_write so the rebind
        // happens correctly.  In non-string-mode, the bare `buf[i] = X`
        // still works on the array form.
        const isCharArrayLocalInStringMode = (n) => {
            if (!inStringMode(ctx) || !ctx?.currentFnName) return false;
            if (!n) return false;
            if (n.kind !== 'DeclRefExpr' && n.kind !== 'MemberExpr') return false;
            return isCharArrayDeclRef(n, ctx);
        };
        if (isCharPtrBase(base) || isCharArrayLocalInStringMode(base)) {
            ctx.externalRefs?.set?.('__nh_char_write',
                EXTERNAL_SYMBOLS['__nh_char_write']);
            const rawName = (base.referencedDecl?.name || base.name);
            const hoistedName = ctx?.localStatics?.get?.(rawName);
            const baseJs = hoistedName
                ? renameIfReserved(hoistedName)
                : expr(l.inner?.[0], ctx);
            const idxJs = expr(l.inner?.[1], ctx);
            const rJs = expr(r, ctx);
            // Rebind base to the (possibly new) buffer returned by
            // __nh_char_write.  For array p, this is a no-op rebind
            // (helper returns the same array after mutating); for
            // string p, the new string is bound to the local variable.
            return `${baseJs} = __nh_char_write(${baseJs}, ${idxJs}, ${rJs})`;
        }
    }
    // Chained assignment over a pointer-mutation outer: C `*p = obj = X`
    // or `*p = *q = X` (see e.g. artifact.c retouch_object,
    // insight.c::background_enlightenment `*buf = *tmpbuf = '\0'`).
    // AST is a nested BinaryOperator(=).  Emit a comma-expression:
    // (<inner JS>, <outer with inner_rhs as its RHS>).  Recurse on
    // a synthesized outer node so the existing scalar/struct-ptr/
    // marker dispatch still applies.  Inner is translated via expr(),
    // which handles its own pointer-mutation LHS through the existing
    // recognizers (char-array reset, etc.).
    //
    // Pure-RHS gate: substituting the inner RHS into the outer would
    // re-evaluate it.  Pure literals/DeclRefs are safe to evaluate
    // twice; complex expressions (function calls, etc.) are not.
    //
    // §23.228 — LHS check extended to also include ArraySubscriptExpr
    // (for chains like `pfx[0] = sfx[0] = buf[0] = '\0'` in
    // insight.c::background_enlightenment).  Without the extension,
    // the chain handler only fired for UnaryOp `*` LHS; the indexed
    // form fell through to the generic emit which produced
    // `pfx[0] = sfx[0] = buf[0] = 0` — fine in dual-mode arrays, but
    // string-mode TUs where `buf[0] = 0` rebinds `buf = ''` would
    // only rebind the rightmost variable; pfx and sfx would still
    // hold their pre-truncation strings.
    //
    // For multi-level chains (3+), walk through nested assignments to
    // find the innermost pure value.  Then synthesize the outer with
    // that innermost as RHS.  Without this walk the chain handler
    // only fires after the inner chain has decomposed, producing
    // partial output like `pfx[0] = (buf[0] = 0, sfx[0] = 0)`.
    const isChainLhs = lvalueNeedsPointerWrapper(l)
        || l?.kind === 'ArraySubscriptExpr';
    if (op === '=' && isChainLhs
        && r?.kind === 'BinaryOperator' && isAssignmentOp(r.opcode)) {
        // Walk the chain to find the innermost RHS value.  Stop when
        // we hit a non-assignment expression (the actual stored value).
        let innermost = r;
        while (innermost?.kind === 'BinaryOperator'
            && isAssignmentOp(innermost.opcode)
            && innermost.inner?.[1]?.kind === 'BinaryOperator'
            && isAssignmentOp(innermost.inner[1].opcode)) {
            innermost = innermost.inner[1];
        }
        // innermost is now a BinaryOp(=) whose RHS is the literal/pure
        // expression.  Require pure RHS so substituting it into the
        // outer (which re-evaluates) is safe.
        if (innermost?.kind === 'BinaryOperator'
            && isAssignmentOp(innermost.opcode)
            && isPureExprNode(innermost.inner?.[1])) {
            const innerJs = expr(r, ctx);
            const outerSynth = { ...node, inner: [l, innermost.inner[1]] };
            const outerJs = binaryOp(outerSynth, ctx);
            return `(${innerJs}, ${outerJs})`;
        }
    }
    if (isAssignmentOp(op) && lvalueNeedsPointerWrapper(l)) {
        // Char-buffer write recognizer (slice 1): `*p = X` and
        // `*p++ = X` rewrite to indexed access on the captured buf.
        // Only fires when functionDecl's pre-pass certified p as
        // safe (write-only, no escape).
        const cbr = (op === '=') ? matchCharBufferWrite(l, ctx) : null;
        if (cbr) {
            const rJs = expr(r, ctx);
            // String-mode TU: the buf is a JS string — indexed stores
            // are silent no-ops ("Cannot create property '0' on
            // string" in strict contexts).  Emit slice-and-append:
            // `buf.slice(0, idx++)` reads the pre-increment index, so
            // the *p++ = X form composes directly.  A NUL write is
            // C's terminator — truncate instead of appending '\0'
            // (mirrors the eos-walker NUL-drop convention).
            // (Q9 iteration 4c: getobj's altlets walker hit this on
            // the first string-mode walker WRITE — hacklib's walkers
            // only ever read.)
            if (inStringMode(ctx)) {
                const isNul = /^\(?0\)?$/.test(rJs.trim());
                return isNul
                    ? `${cbr.bufJs} = ${cbr.bufJs}.slice(0, ${cbr.idxAccess})`
                    : `${cbr.bufJs} = ${cbr.bufJs}.slice(0, ${cbr.idxAccess}) + String.fromCharCode(${rJs})`;
            }
            return `${cbr.bufJs}[${cbr.idxAccess}] = ${rJs}`;
        }
        // Eos-walker write: `*bp = X`, `*bp++ = X`, `*++bp = X`,
        // `*bp-- = X` where bp is in ctx.eosWalkers.  Drops the
        // pointer-mutation TODO and emits `bufJs +=
        // String.fromCharCode(X)` for all forms — in JS-string-
        // append semantics the position advance is implicit.  NUL
        // writes at stmt-level are dropped by compoundStmt's
        // isEosWalkerDropStmt check before reaching binaryOp;
        // embedded NUL writes (rare) fall through to the generic
        // TODO marker below.  Restricted to op === '=' (compound
        // writes like `*bp += X` aren't part of the walker idiom).
        if (op === '=' && ctx.eosWalkers
            && ctx.eosWalkers.size > 0
            && l?.kind === 'UnaryOperator' && l.opcode === '*') {
            // Unwrap an optional UnaryOp(++/--) between * and the
            // DeclRefExpr — handles the combined `*bp++ = X` form
            // alongside the simple `*bp = X` form.
            let inner = stripCasts(l.inner?.[0]);
            if (inner?.kind === 'UnaryOperator'
                && (inner.opcode === '++' || inner.opcode === '--')) {
                inner = stripCasts(inner.inner?.[0]);
            }
            const name = inner?.kind === 'DeclRefExpr'
                ? inner.referencedDecl?.name : null;
            if (name && ctx.eosWalkers.has(name) && !isNulCharLiteral(r)) {
                const { bufExpr } = ctx.eosWalkers.get(name);
                const bufJs = expr(bufExpr, ctx);
                const rJs = expr(r, ctx);
                return `${bufJs} += String.fromCharCode(${rJs})`;
            }
        }
        // strchr-truncate write recognizer: this `*p = 0` is inside
        // an `if ((p = strchr_family(buf, X)) != NULL)` whose safety
        // was verified by functionDecl's pre-pass.  Replace the
        // no-op TODO with a buf-rebinding truncate that handles
        // BOTH mutable `char[BUFSZ]` arrays (mutates in place) AND
        // immutable string suffixes returned by strchr (returns a
        // new sliced string, the assignment rebinds the local so
        // subsequent reads see the truncated value).
        const strTrunc = (op === '=') ? ctx.strchrTruncates?.get(node) : null;
        if (strTrunc) {
            if (EXTERNAL_SYMBOLS['nh_strchr_truncate']) {
                ctx.externalRefs.set('nh_strchr_truncate', EXTERNAL_SYMBOLS['nh_strchr_truncate']);
            }
            // Detect `&buf[k]` form for bufNode and split into the
            // base array + start offset.  C `strchr(&fnamebuf[k],
            // ' ')` is common in offset-into-buffer searches.
            let baseBufNode = strTrunc.bufNode;
            let offsetExpr = null;
            const stripped = stripCasts(strTrunc.bufNode);
            if (stripped?.kind === 'UnaryOperator' && stripped.opcode === '&') {
                const sub = stripCasts(stripped.inner?.[0]);
                if (sub?.kind === 'ArraySubscriptExpr' && (sub.inner || []).length === 2) {
                    baseBufNode = sub.inner[0];
                    offsetExpr = expr(sub.inner[1], ctx);
                }
            }
            const bufJs = expr(baseBufNode, ctx);
            const charJs = expr(strTrunc.charNode, ctx);
            const startArg = offsetExpr ? `, ${offsetExpr}` : '';
            // Emit `bufJs = nh_strchr_truncate(bufJs, X, kind[, k])`.
            // For arrays the helper mutates in place and returns the
            // same array — the assignment is a self-rebind, no-op.
            // For strings the helper returns a new sliced string —
            // the assignment performs the rebind so the local sees
            // the truncated value.
            return `${bufJs} = nh_strchr_truncate(${bufJs}, ${charJs}, '${strTrunc.kind}'${startArg})`;
        }
        const rJs = expr(r, ctx);
        // Chained pointer-mutation (C: `*p = *(p+1) = '\0'`).  The RHS
        // is itself a marker; nesting one inside the other's (C: ...)
        // capture produces a confusing recursive comment.  Collapse to
        // a single chained-form marker so a reader sees the structure.
        if (/^void 0 \/\* TODO Phase 5\+: (pointer-mutation|chained pointer-mutation)/.test(rJs)) {
            return `void 0 /* TODO Phase 5+: chained pointer-mutation lvalue */`;
        }
        // Escape any embedded comment-close in the captured RHS slice
        // so the TODO marker itself parses cleanly as a JS comment.
        const rSafe = rJs.slice(0, 40).replace(/\*\//g, '*\\/');
        return `void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = ${rSafe}) */`;
    }
    // C `ptr - mons` where both operands have pointer type (i.e., RHS
    // is the `mons` array decayed to a pointer) yields a ptrdiff_t —
    // the integer index of ptr within mons[].  In JS both operands
    // are object references and subtraction yields NaN, silently
    // breaking idioms like `NODIAG(mdat - mons)` or
    // `Dragon_scales_to_pm(o) - mons`.  Rewrite to `(lhs).pmidx` since
    // every permonst struct pre-initializes pmidx to its own array
    // index — O(1) lookup and bypasses the array search entirely.
    // AST signature: BinaryOperator op='-' with l carrying pointer type
    // and r-after-stripCasts being a DeclRefExpr to `mons` (with array
    // type).  Subsumes prior build-engine.mjs site-specific patches.
    //
    // Allowlist of arrays for which `ptr - arr` is safe to rewrite.
    // - `mons`: every permonst struct carries `pmidx` (its own index),
    //   so `(p).pmidx` is the O(1) form.
    // - `artilist`: static struct array; entries are never aliased
    //   outside the table, so `artilist.indexOf(p)` is reliable and
    //   matches C semantics exactly.  No self-index field, so use
    //   indexOf (O(n) but artilist has ~34 entries — cheap).
    //
    // A blanket `.indexOf` fallback for ANY pointer-into-array was
    // tried earlier and fired on rooms/punctclasses/buf/etc., where
    // the corresponding JS containers don't carry a 1:1 identity
    // relationship and the rewrite regressed S=49→38.  Tightened to
    // an explicit allowlist; expand as each table is verified safe.
    const PTRDIFF_TABLES = {
        // lJs is already parenthesized when it's a MemberExpr / ParenExpr
        // (the typical case for `mtmp->data` and similar).  Wrapping
        // again produces `((mtmp.data)).pmidx` which costs a bytewise-
        // clean diff vs production's `(mtmp.data).pmidx`.  Bare-ident
        // and call-expr forms don't need the wrap (`mtmp.pmidx`,
        // `Dragon_scales_to_pm(o).pmidx` both parse correctly).
        mons: (lJs, _rJs) => `${lJs}.pmidx`,
        // For artilist, use `expr()` to render the array reference
        // — it may be a bucket-flattened `game.artilist` or a
        // top-level const `artilist` depending on the surrounding
        // TU's scope rules.  Both are valid; using `expr()` keeps
        // the emit in sync with how the array is actually declared.
        artilist: (lJs, rJs) => `${rJs}.indexOf(${lJs})`,
        // `rooms` is accessed as `svr.rooms` in C (MemberExpr on the
        // `svr` global bucket), hoisted to `game.rooms` in JS.  The
        // ptr-into-array uses (`croom - svr.rooms` in selvar.c and
        // mklev.c, see grep "- svr.rooms" in nethack-c/upstream/src)
        // all pass mkroom* references that originate from
        // `game.rooms[i]` reads — no struct-copy variants in the
        // search.  indexOf is reference-equality reliable here.
        //
        // The "blanket .indexOf for ANY pointer-into-array" attempt
        // referenced in earlier comments above was a CROSS-TABLE
        // generalisation that fired on buf/punctclasses/etc.  This
        // entry is per-array and explicit; same shape as artilist.
        rooms: (lJs, rJs) => `${rJs}.indexOf(${lJs})`,
    };
    // Returns the canonical name of the array-side operand if it
    // matches a PTRDIFF_TABLES entry.  Accepts:
    //   - DeclRefExpr to a global array (legacy `mons`/`artilist`)
    //   - MemberExpr where the base is a global bucket (`svr.rooms`,
    //     `gc.foo`, etc.) and the member name is in the table
    function matchPtrdiffArrayRef(node) {
        const s = stripCasts(node);
        if (!s) return null;
        if (s.kind === 'DeclRefExpr') {
            const n = s.referencedDecl?.name || s.name;
            if (n && n in PTRDIFF_TABLES) return n;
            return null;
        }
        if (s.kind === 'MemberExpr') {
            const m = s.name;
            if (!m || !(m in PTRDIFF_TABLES)) return null;
            const base = stripCasts(s.inner?.[0]);
            if (base?.kind === 'DeclRefExpr') {
                const baseName = base.referencedDecl?.name || base.name;
                if (baseName && GLOBAL_BUCKETS_SET.has(baseName)) {
                    return m;
                }
            }
        }
        return null;
    }
    if (op === '-') {
        const lType = l?.type?.qualType || '';
        const rArrName = matchPtrdiffArrayRef(r);
        if (rArrName && /\*\s*$/.test(lType)) {
            const lJs = expr(l, ctx);
            const rJs = expr(stripCasts(r), ctx);
            return PTRDIFF_TABLES[rArrName](lJs, rJs);
        }
    }
    // Pointer-arithmetic no-op: `ptr - 0` / `ptr + 0` where LHS is
    // pointer-typed.  C macros like Concat (objnam.c:75) expand to
    // `Strncat(buf_eos - delta, text, bufspaceleft + delta)` and the
    // common call site `Concat(buf, 0, text)` instantiates delta=0
    // so the subtraction is a no-op offset.  In C the result is the
    // same pointer; in JS the array → NaN coercion (Array - 0) makes
    // `buf_eos - 0` evaluate to NaN, breaking downstream strncat /
    // Strcpy / etc.  Peephole: when RHS is integer-literal 0 (and
    // LHS is pointer-typed), drop the op entirely.  Added 2026-05-31
    // for seed1800's eat-fortune-cookie xname path (singular emit).
    if ((op === '-' || op === '+')
        && /\*\s*$/.test(l?.type?.qualType || '')) {
        const rStripped = stripCasts(r);
        if (rStripped?.kind === 'IntegerLiteral' && rStripped.value === '0') {
            return expr(l, ctx);
        }
    }
    // C `ptr OP &mons[X]` (range comparison) where OP is one of
    // `<`, `<=`, `>`, `>=` — used by macros like
    // `is_mplayer(ptr) = (ptr >= &mons[PM_ARCHEOLOGIST])
    //                 && (ptr <= &mons[PM_WIZARD])`
    // and `is_in_role_class(ptr) = ptr < &mons[PM_X]`.  In JS the
    // raw pointer comparison becomes object-reference comparison
    // which JS handles by ToPrimitive → NaN → always false.
    // Production js/translated/mthrowu.js works around this with
    // `(ptr).pmidx OP X`; bake that into the translator using the
    // same PTRDIFF_TABLES['mons'] entry that powers the
    // `ptr - mons` recognizer above.  Safe ONLY for the `mons`
    // table because pmidx is the array-self-index field.
    // Equality (`==`/`!=`) is NOT included here — production
    // emits the raw `ptr == game.mons[X]` form, which works
    // because JS object-reference equality matches the C
    // pointer-equality semantic.  Only ordered comparisons need
    // the rewrite.
    if (op === '<' || op === '<=' || op === '>' || op === '>=') {
        const rStrip = stripCasts(r);
        const lType = l?.type?.qualType || '';
        if (/\*\s*$/.test(lType)
            && rStrip?.kind === 'UnaryOperator' && rStrip.opcode === '&') {
            const sub = stripCasts(rStrip.inner?.[0]);
            if (sub?.kind === 'ArraySubscriptExpr' && sub.inner?.length === 2) {
                const arr = stripCasts(sub.inner[0]);
                const arrName = arr?.referencedDecl?.name || arr?.name;
                if (arr?.kind === 'DeclRefExpr' && arrName === 'mons') {
                    const lJs = expr(l, ctx);
                    const idxJs = expr(sub.inner[1], ctx);
                    // Same parens-economy rationale as PTRDIFF_TABLES.mons:
                    // expr() already parenthesises MemberExpr/ParenExpr
                    // operands, so re-wrapping costs a clean-diff.
                    return `${lJs}.pmidx ${op} ${idxJs}`;
                }
            }
        }
    }
    // §23.228 — `dop - disclosure_options` where both are `char *`
    // typed locals/params/fields (typical pattern: dop assigned from
    // strchr(disclosure_options, c) earlier, then offset extracted
    // for table indexing).  Generalises the existing strchr-direct
    // recognizer below: covers the case where the strchr result was
    // stored to a local before the subtraction.
    //
    // In JS, both are strings or arrays.  Subtraction gives NaN.
    // The correct offset is `disclosure_options.length - dop.length`
    // assuming dop is a suffix (which it is when produced by
    // strchr / nh_strchr / strrchr / strstr / nh_strsearch).  This
    // matches the formula the existing strchr recognizer effectively
    // computes via .indexOf.
    //
    // Restricted to `char *` / `const char *` on BOTH sides; comparing
    // pointer types would fire here too but those are caught by the
    // `<`/`>` recognizer below.
    if (op === '-') {
        // Accept both `char *` (typical strchr-result locals) and
        // `char [N]` (the array form of static const tables like
        // `disclosure_options[]`).  C arrays decay to pointers in
        // expression context but the AST preserves the array type.
        const isCharPtrOrArr = (n) => {
            if (!n) return false;
            const s = stripCasts(n);
            if (!s) return false;
            if (s.kind !== 'DeclRefExpr' && s.kind !== 'MemberExpr') return false;
            const t = (s.type?.qualType || '').trim();
            if (/^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(t)) return true;
            if (/^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\[\s*\d*\s*\]\s*$/.test(t)) return true;
            return false;
        };
        if (isCharPtrOrArr(l) && isCharPtrOrArr(r)) {
            const lJs = expr(l, ctx);
            const rJs = expr(r, ctx);
            // Format: `(r.length - l.length)`.  Parenthesized so the
            // result fits into expressions like `idx = (X - Y)` or
            // `if (X - Y > 0)` without precedence surprises.
            return `(${rJs}.length - ${lJs}.length)`;
        }
    }
    // `strchr(X, c) - X` — the C idiom for "find the index of c in X".
    // C pointer subtraction yields a numeric index; JS strchr returns
    // a suffix string, and `string - string` = NaN.  Rewrite to
    // `X.indexOf(String.fromCharCode(c))` so the result is the index
    // (or -1 for not-found, which a caller may need to special-case
    // — same as C `strchr` returning NULL).
    // Previously a build-engine.mjs site-specific patch.
    if (op === '-' && l?.kind === 'CallExpr'
        && calleeBase(l.inner?.[0]) === 'strchr' && l.inner?.length >= 3) {
        const haystackArg = stripCasts(l.inner[1]);
        const rStrip = stripCasts(r);
        if (haystackArg?.kind === 'DeclRefExpr' && rStrip?.kind === 'DeclRefExpr') {
            const hName = haystackArg.referencedDecl?.name || haystackArg.name;
            const rName = rStrip.referencedDecl?.name || rStrip.name;
            if (hName && hName === rName) {
                const haystackJs = expr(l.inner[1], ctx);
                const needleJs = expr(l.inner[2], ctx);
                return `${haystackJs}.indexOf(String.fromCharCode(${needleJs}))`;
            }
        }
    }
    // C `bucket = struct_literal_var;` (e.g. `svd = init_svd;`)
    // would translate to `game = init_svd;` after bucket-flatten —
    // wiping the entire game state.  The bucket-flatten convention
    // says "the bucket's fields ARE part of game", so the right
    // semantics is `Object.assign(game, init_svd);`.
    if (op === '=' && isBucketDeclRef(l)) {
        const rJs = expr(r, ctx);
        ctx.gameImportNeeded = true;
        return `Object.assign(game, ${rJs})`;
    }
    // C `s = t` where s and t are struct-typed values does a
    // member-wise copy.  In JS the same syntax aliases the
    // reference, so subsequent `s.field = X` mutates t too —
    // breaking patterns like rect.c's split_rects:
    //     `r = old_r; r.hy = ...; add_rect(&r);`
    // Detect struct-typed assignment via the LHS's qualType
    // (non-pointer, non-array, registered struct or typedef alias)
    // and emit Object.assign so the member copy is faithful.
    if (op === '=' && isStructValueLvalue(l, ctx)) {
        const lJs = expr(l, ctx);
        const rJs = expr(r, ctx);
        return `Object.assign(${lJs}, ${rJs})`;
    }
    // strchr-bound pointer offset: `p + N` where p is in
    // ctx.strchrBoundPaths becomes `p.substring(N)` — the JS-string
    // semantic of advancing past the first N chars of the suffix
    // string captured at the strchr call.  Mirrors the `p++` rewrite
    // in unaryOp.  Restricted to integer-literal N at the safety-
    // check level so the substring slice is always valid (a variable
    // could be negative or out of bounds; JS substring's clamping
    // differs from C pointer arithmetic).  Both operand orders
    // accepted (`p + N` and `N + p`).
    if (op === '+' && ctx.strchrBoundPaths
        && ctx.strchrBoundPaths.size > 0) {
        const lStripped = stripCasts(l);
        const rStripped = stripCasts(r);
        const lPath = (lStripped?.kind === 'DeclRefExpr'
            || lStripped?.kind === 'MemberExpr')
            ? buildExprPath(lStripped) : null;
        const rPath = (rStripped?.kind === 'DeclRefExpr'
            || rStripped?.kind === 'MemberExpr')
            ? buildExprPath(rStripped) : null;
        if (lPath && ctx.strchrBoundPaths.has(lPath)
            && rStripped?.kind === 'IntegerLiteral') {
            const lJs = expr(l, ctx);
            const rJs = expr(r, ctx);
            return `${lJs}.substring(${rJs})`;
        }
        if (rPath && ctx.strchrBoundPaths.has(rPath)
            && lStripped?.kind === 'IntegerLiteral') {
            const lJs = expr(l, ctx);
            const rJs = expr(r, ctx);
            return `${rJs}.substring(${lJs})`;
        }
    }
    const lJs = expr(l, ctx);
    const rJs = expr(r, ctx);
    // C integer division truncates toward zero; JS `/` is float
    // division.  When both operands have integer types, wrap with
    // Math.trunc so `40 / 6` yields 6 (C) instead of 6.666... (JS).
    //
    // Precedence safety: if the RHS is a ConditionalOperator, wrap it
    // in extra parens.  Without them, `cnt / cond ? a : b` parses as
    // `(cnt / cond) ? a : b` (since `/` binds tighter than `?:`) — the
    // ternary is captured around the division instead of being the
    // divisor.  See makemon.js::m_initgrp pre-regen hand-port comment
    // documenting this exact bug.  Added 2026-05-31.
    if (op === '/' && isIntegerTyped(l) && isIntegerTyped(r)) {
        // Precedence safety: if RHS is a ConditionalOperator (possibly
        // wrapped in ParenExpr/ImplicitCastExpr by clang), wrap in
        // extra parens.  Without them, `cnt / cond ? a : b` parses as
        // `(cnt / cond) ? a : b` (`/` binds tighter than `?:`) — the
        // ternary captures the division instead of being the divisor.
        // See makemon.js::m_initgrp pre-regen hand-port for the bug
        // documentation.  Added 2026-05-31.
        const rStripped2 = stripCasts(r);
        const rWrap = (rStripped2?.kind === 'ConditionalOperator')
            ? `(${rJs})` : rJs;
        return `Math.trunc(${lJs} / ${rWrap})`;
    }
    // Frozen isaac64_next_uint64() returns a BigInt (matching the
    // 64-bit C uint64_t).  When translated C code mods that result by
    // a JS Number (e.g. `isaac64_next_uint64(...) % x`), JS throws
    // TypeError because BigInt and Number can't mix.  Wrap the
    // operation: `Number(<lhs> % BigInt(<rhs>))`.  We restrict to the
    // arithmetic ops that actually appear in NetHack's RND (mod) and
    // shift family — anything else stays untouched and surfaces as a
    // clear error if hit.
    const BIGINT_ARITH = new Set(['%', '&', '|', '^', '>>', '<<']);
    if (BIGINT_ARITH.has(op) && returnsBigInt(l)) {
        return `Number((${lJs}) ${op} BigInt(${rJs}))`;
    }
    // charBufferRewrites comparison: `p OP &buf[N]` (or `p OP buf+N`)
    // where p is in charBufferRewrites and buf matches p's bufRef.
    // Emit as `p_idx OP N` so the comparison stays semantically
    // equivalent in JS (where p is an index into buf, not a pointer).
    // Common NetHack idiom: `if (p == &buf[sizeof buf - 1])` —
    // checking if the walker has reached the end.  Added 2026-05-30
    // per user direction to handle invent.c getobj's altlets walker.
    const CMP_OPS = new Set(['==', '!=', '<', '<=', '>', '>=']);
    if (CMP_OPS.has(op) && ctx.charBufferRewrites
        && ctx.charBufferRewrites.size > 0) {
        const cbrSide = _matchCbrCompareSide(l, r, ctx);
        if (cbrSide) {
            // cbrSide.idxJs is already the index expression's JS form;
            // cbrSide.pIdx is the rewrite's idxName.
            if (cbrSide.side === 'left') {
                return `${cbrSide.pIdx} ${op} ${cbrSide.idxJs}`;
            }
            return `${cbrSide.idxJs} ${op} ${cbrSide.pIdx}`;
        }
    }
    // Both-sides address compare: `&A[i] OP &B[j]` on char pointers/
    // buffers in string mode.  JS strings have no addresses to
    // compare.  The only occurrence of this shape in NetHack's C
    // (invent.c getobj: `&bp[suggested] == &buf[sizeof buf - 1]`) is
    // a capacity guard where bp aliases buf at a small constant
    // offset and the cap is unreachable in any real game state.
    // Emit the index comparison `(i) OP (j)` (alias-offset-0
    // assumption): matches the C truth value for every reachable
    // state, and replaces the previous fallback emit — a string
    // compared against a char code, where `'' == 0` coerces true and
    // fired getobj's "inventory overflow" impossible spuriously on
    // the first inventory item.
    if (CMP_OPS.has(op) && inStringMode(ctx)) {
        const lAddr = _matchAddrOfCharSubscript(l);
        const rAddr = _matchAddrOfCharSubscript(r);
        if (lAddr && rAddr) {
            return `(${expr(lAddr.idxNode, ctx)}) ${op} (${expr(rAddr.idxNode, ctx)})`;
        }
    }
    // Phase A3: expression-form `p + N` on a `(const)? char *` target
    // (DeclRefExpr local / MemberExpr struct field) where p was not
    // claimed by charBufferRewrites / strchrBoundPaths.  The generic
    // emit `p + N` is a JS string concat (`"foo" + 5 → "foo5"`) that
    // breaks every downstream string compare / slice.  Route through
    // __nh_advance_str so the result is the proper suffix.  Applies
    // at expression level so it composes inside function-call args,
    // assignment RHS, etc.
    //
    // Coverage: `p + INTEGER` and `INTEGER + p` (additive identity).
    // Order doesn't matter for the helper.  Restricted to integer-
    // valued RHS — `p + q` (pointer + pointer) is not a valid C
    // operation anyway, and `p + non_integer_typed_expr` is too
    // surprising to silently rewrite.
    if (op === '+') {
        const lStripped = stripCasts(l);
        const rStripped = stripCasts(r);
        const isCharPtr = (n) => {
            if (!n) return false;
            if (n.kind !== 'DeclRefExpr' && n.kind !== 'MemberExpr') {
                return false;
            }
            const t = (n.type?.qualType || '').trim();
            return /^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(t);
        };
        if (isCharPtr(lStripped) && isIntegerTyped(r)) {
            ctx.externalRefs?.set?.('__nh_advance_str',
                EXTERNAL_SYMBOLS['__nh_advance_str']);
            return `__nh_advance_str(${lJs}, ${rJs})`;
        }
        if (isCharPtr(rStripped) && isIntegerTyped(l)) {
            ctx.externalRefs?.set?.('__nh_advance_str',
                EXTERNAL_SYMBOLS['__nh_advance_str']);
            return `__nh_advance_str(${rJs}, ${lJs})`;
        }
    }
    return `${lJs} ${op} ${rJs}`;
}

// Matcher for binaryOp's both-sides address compare: `&arr[i]` where
// arr is a char pointer or char array lvalue (DeclRefExpr or
// MemberExpr).  Returns { idxNode } or null.
function _matchAddrOfCharSubscript(node) {
    const s = stripCasts(node);
    if (s?.kind !== 'UnaryOperator' || s.opcode !== '&') return null;
    const sub = stripCasts(s.inner?.[0]);
    if (sub?.kind !== 'ArraySubscriptExpr' || sub.inner?.length !== 2) {
        return null;
    }
    const base = stripCasts(sub.inner[0]);
    if (!base
        || (base.kind !== 'DeclRefExpr' && base.kind !== 'MemberExpr')) {
        return null;
    }
    const t = (base.type?.qualType || '').trim();
    if (!/^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*(?:\*|\[)/.test(t)) {
        return null;
    }
    return { idxNode: sub.inner[1] };
}

// Helper for binaryOp's charBufferRewrites comparison emit.  Detects
// whether a comparison `l OP r` is between a charBufferRewrites
// walker p and an address-into-its-buf expression (`&buf[N]` /
// `buf + N`).  Returns { pIdx, idxJs, side } where side indicates
// which operand was p.
function _matchCbrCompareSide(l, r, ctx) {
    const try1 = _matchCbrCompareOneWay(l, r, ctx, 'left');
    if (try1) return try1;
    return _matchCbrCompareOneWay(r, l, ctx, 'right');
}

function _matchCbrCompareOneWay(pSide, addrSide, ctx, sideTag) {
    const pStripped = stripCasts(pSide);
    if (pStripped?.kind !== 'DeclRefExpr') return null;
    const pName = pStripped.referencedDecl?.name;
    if (!pName) return null;
    const rewrite = ctx.charBufferRewrites.get(pName);
    if (!rewrite) return null;
    // Resolve buf's name for the comparison-target check.
    const bufRefStripped = stripCasts(rewrite.bufRef);
    const bufName = bufRefStripped?.referencedDecl?.name
        || bufRefStripped?.name || null;
    if (!bufName) return null;
    // addrSide is `&arr[N]` or `arr[N]` (array-decayed) or `arr + N`.
    let arrNode = null;
    let idxNode = null;
    const aStrip = stripCasts(addrSide);
    if (aStrip?.kind === 'UnaryOperator' && aStrip.opcode === '&') {
        const sub = stripCasts(aStrip.inner?.[0]);
        if (sub?.kind === 'ArraySubscriptExpr' && sub.inner?.length === 2) {
            arrNode = stripCasts(sub.inner[0]);
            idxNode = sub.inner[1];
        }
    }
    if (!arrNode && aStrip?.kind === 'BinaryOperator' && aStrip.opcode === '+') {
        const [lhs, rhs] = aStrip.inner || [];
        const lS = stripCasts(lhs);
        const rS = stripCasts(rhs);
        if (lS?.kind === 'DeclRefExpr') { arrNode = lS; idxNode = rS; }
        else if (rS?.kind === 'DeclRefExpr') { arrNode = rS; idxNode = lS; }
    }
    if (!arrNode || arrNode.kind !== 'DeclRefExpr') return null;
    const arrName = arrNode.referencedDecl?.name;
    if (!arrName || arrName !== bufName) return null;
    const idxJs = expr(idxNode, ctx);
    return { pIdx: rewrite.idxName, idxJs, side: sideTag };
}

// Names of frozen runtime functions whose JS implementation returns a
// BigInt (mirroring 64-bit C return types).  Used by binaryOp so a C
// expression like `<call> % x` translates to a Number-typed result.
const BIGINT_RETURNING_CALLS = new Set([
    'isaac64_next_uint64',
    'isaac64_peek_uint64',
]);

function returnsBigInt(node) {
    if (!node) return false;
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr' || n.kind === 'CStyleCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'CallExpr') return false;
    // CallExpr.inner[0] is the callee; for a direct call it's a
    // DeclRefExpr (possibly wrapped in ImplicitCastExpr).
    let callee = n.inner?.[0];
    while (callee && (callee.kind === 'ParenExpr' || callee.kind === 'ImplicitCastExpr')) {
        callee = callee.inner?.[0];
    }
    const refName = callee?.referencedDecl?.name || callee?.name;
    return refName && BIGINT_RETURNING_CALLS.has(refName);
}

// True when assigning to `node` is a struct-value copy in C
// semantics (vs. a pointer/scalar).  Used to wrap `s = t` in
// Object.assign so JS doesn't alias.  Recognizes the LHS's
// qualType: must be a registered struct OR typedef alias to one,
// and not a pointer/array.  Accepts simple lvalues — DeclRefExpr,
// MemberExpr, ArraySubscriptExpr — that resolve to a struct
// value (the C `s = t` / `s.field = t` / `arr[i] = t` patterns).
function isStructValueLvalue(node, ctx) {
    if (!node) return false;
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n) return false;
    // DeclRefExpr (a bare local), ArraySubscriptExpr (e.g. add_rect's
    // `rect[rect_cnt] = *r`), and MemberExpr whose member TYPE is a
    // registered struct.  MemberExpr was excluded as "usually a
    // primitive write", but the structRegistryKey type check below
    // already separates `s.field = X` primitive writes (primitive
    // qualType → no registry match) from struct-member copies.  The
    // exclusion made `gu.urole = roles[flags.initrole]` (role.c
    // role_init; gu flattens to game) emit a REFERENCE alias — C
    // struct assignment is a COPY — so the priest pantheon-god write
    // `urole.lgod = ...` mutated the shared module-level roles[]
    // table and the NEXT priest session in the same process skipped
    // its randrole rn2(13) (Q9.5(b) cross-session leak, div=199 on
    // seeds 0106/0367/0501).
    if (!['DeclRefExpr', 'ArraySubscriptExpr', 'MemberExpr']
        .includes(n.kind)) {
        return false;
    }
    const t = n.type?.qualType || '';
    if (/[*\[]/.test(t)) return false; // pointer or array
    return structRegistryKey(t, ctx) !== null;
}

// True when `node` is a DeclRefExpr to a local of struct-pointer
// type — used by unaryOp to short-circuit `ptr++` / `ptr--` patterns
// that would NaN-out a JS object reference.
// True when `node` evaluates to a C integer value (vs. a float /
// pointer / struct).  Used by binaryOp to know when `/` must
// truncate toward zero (C semantics) instead of returning a JS
// float.  Walks past parens / implicit casts.  Conservative:
// returns true only for known integer types.
function isIntegerTyped(node) {
    if (!node) return false;
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr'
            || n.kind === 'CStyleCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n) return false;
    const t = (n.type?.qualType || '').replace(/^(const|volatile)\s+/, '').trim();
    if (/[*\[]/.test(t)) return false;
    const base = t.replace(/^(signed|unsigned)\s+/, '').trim();
    return [
        'char', 'short', 'short int', 'int', 'long', 'long int',
        'long long', 'long long int', '_Bool', 'bool', 'boolean',
        'int8_t', 'int16_t', 'int32_t', 'int64_t',
        'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
        'size_t', 'ssize_t', 'ptrdiff_t',
        'schar', 'uchar', 'xint8', 'xint16', 'xint32',
        'coordxy', 'xchar', 'aligntyp', 'lua_Integer', 'lua_Unsigned',
    ].includes(base);
}

// Helper invoked when `alloc(sizeof(struct foo))` is encountered.
// Looks up `struct foo` in ctx.structs (populated cross-TU via
// build-tree.mjs's collectAllStructs) and returns the matching
// `zeroInitForStruct` literal — which recursively zero-inits
// every field, including nested struct/union fields.
// Restricted typed-alloc detector: only fires for `alloc(sizeof(
// struct obj))`.  Returns Object.assign(alloc(1), {scalars: 0})
// — keeps the alloc-Proxy auto-create behavior for chained
// reads through pointer fields (cobj, oextra, v.v_nexthere)
// while explicitly zeroing the boolean/scalar guard fields
// blessorcurse and friends consult.  This is the specific fix
// for the call-1388 divergence.
function tryAllocStructInitForObj(arg, ctx) {
    let n = arg;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr'
            || n.kind === 'CStyleCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'UnaryExprOrTypeTraitExpr' || n.name !== 'sizeof') return null;
    let t = n.argType?.qualType;
    if (!t && n.inner?.[0]) {
        let inner = n.inner[0];
        while (inner && (inner.kind === 'ParenExpr' || inner.kind === 'ImplicitCastExpr')) {
            inner = inner.inner?.[0];
        }
        t = inner?.type?.qualType;
    }
    if (!t) return null;
    // Match only `struct obj`.
    const stripped = stripQuals(t);
    if (stripped !== 'struct obj') return null;
    const fields = ctx.structs.get('obj');
    if (!fields) return null;
    // Zero-init scalars to 0 AND pointer fields to null.  C's mksobj
    // does `memset(otmp, 0, sizeof *otmp)` to fully zero the struct,
    // so all linked-list / payload pointers (nobj, nexthere, cobj,
    // oextra, etc.) are NULL on a fresh object.  Without explicit
    // null, the alloc-Proxy auto-creates a sub-Proxy on read, which:
    //   - makes pointer-truthy guards fire (e.g. `if (obj.cobj)`
    //     spuriously enters the not-empty branch)
    //   - causes linked-list walks `for (p = head; p; p = p->next)`
    //     to loop forever, allocating a new sub-Proxy for `next` at
    //     each step (the actual root cause of the OOM the harness
    //     hit when fix_iprobs unblocked add_to_container).
    // Struct/union/array fields stay out — those are best handled
    // by the auto-create Proxy because they recurse, and translated
    // C code pre-initializes nested fields explicitly when needed.
    const parts = [];
    for (const f of fields) {
        const ft = stripQuals(f.type || '');
        const isPtr = /\*\s*$/.test(ft);
        const isArr = /\[/.test(ft);
        // For STRUCT-VALUE fields (no `*`), skip — auto-create Proxy
        // recurses for nested struct fields.  But STRUCT-POINTER fields
        // (`struct foo *`) need explicit null so linked-list walks
        // (e.g. `for (p = head; p; p = p->next)`) terminate.
        const isStructOrUnionValue = /^(struct|union)\b/.test(ft) && !isPtr;
        const isTypedefStructValue = ctx.structs.has(ft) && !isPtr;
        if (isArr || isStructOrUnionValue || isTypedefStructValue) continue;
        parts.push(`${f.name}: ${isPtr ? 'null' : '0'}`);
    }
    return `Object.assign(alloc(1), { ${parts.join(', ')} })`;
}

// (Used to be commented-out broken variant — keep helper named for
//  future expansion.)

function tryAllocStructInit(arg, ctx) {
    let n = arg;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr'
            || n.kind === 'CStyleCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'UnaryExprOrTypeTraitExpr' || n.name !== 'sizeof') {
        return null;
    }
    let t = n.argType?.qualType;
    if (!t && n.inner?.[0]) {
        let inner = n.inner[0];
        while (inner && (inner.kind === 'ParenExpr' || inner.kind === 'ImplicitCastExpr')) {
            inner = inner.inner?.[0];
        }
        t = inner?.type?.qualType;
    }
    if (!t) return null;
    return zeroInitForStruct(t, ctx);
}

// True when `node` is a `*ptr` UnaryOperator whose dereferenced
// type is a registered struct (vs. a scalar like int/coordxy).
// Used to decide whether `*ptr = X` is a struct-value copy
// (Object.assign) or a scalar-pointer outparam write (.value).
function isStructTypedDeref(node, ctx) {
    if (!node || node.kind !== 'UnaryOperator' || node.opcode !== '*') return false;
    const t = node.type?.qualType || '';
    if (/[*\[]/.test(t)) return false;
    // Resolve typedef aliases via the struct registry.
    return structRegistryKey(t, ctx) !== null;
}

function isStructPtrLocal(node, ctx) {
    if (!node) return false;
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'DeclRefExpr') return false;
    const t = n.type?.qualType || '';
    if (!/\*\s*$/.test(t)) return false;
    const base = t.replace(/\*\s*$/, '').trim().replace(/^(const|volatile)\s+/, '').trim();
    return /^struct\s/.test(base) || (ctx.structs && ctx.structs.has(base));
}

function isBucketDeclRef(node) {
    if (!node) return false;
    const n = (node.kind === 'ParenExpr' || node.kind === 'ImplicitCastExpr')
        ? node.inner?.[0] : node;
    if (!n || n.kind !== 'DeclRefExpr') return false;
    const refName = n.referencedDecl?.name || n.name;
    return refName && GLOBAL_BUCKETS_SET.has(refName);
}

// True when `node` is a DeclRefExpr to a parameter that the caller
// passes by-pointer (scalar-ptr outparam).  Strips paren / implicit-
// cast wrappers.
function isScalarPtrParamRef(node, ctx) {
    if (!node || !ctx?.scalarPtrParamNames?.size) return false;
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'DeclRefExpr') return false;
    const refName = n.referencedDecl?.name || n.name;
    return refName && ctx.scalarPtrParamNames.has(renameIfReserved(refName));
}

// True when `node` is a DeclRefExpr to a name registered as a
// struct-pointer reference — either a `struct T *` parameter, or a
// local variable of the same type added by collectStructPtrLocals.
// Used to emit `Object.assign(p, X)` for the C `*p = struct_value`
// write idiom.
function isStructPtrParamRef(node, ctx) {
    if (!node || !ctx?.structPtrParamNames?.size) return false;
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'DeclRefExpr') return false;
    const refName = n.referencedDecl?.name || n.name;
    return refName && ctx.structPtrParamNames.has(renameIfReserved(refName));
}

// True for C type strings of the form `struct T *` (single pointer
// to a struct), OR `Alias *` where Alias is a typedef'd struct in
// the provided struct-typedef-alias map.  Used to identify local
// struct-ptr variables whose `*p = X` writes need
// `Object.assign(p, X)` translation.
//
// The aliasMap is `crossTuTypedefAliases` from buildTree, which
// stores `aliasName → underlyingStructName` for each
// `typedef struct X Alias` form.  Without the map, the function
// only accepts bare `struct X *`, missing typedef'd cases like
// `light_source *new_ls` where `light_source` is
// `typedef struct ls_t light_source`.  With the map,
// `light_source` resolves to `ls_t` (a struct), so `light_source *`
// is accepted.
function isStructPtrTypeStr(t, structTypedefAliases = null) {
    if (!t) return false;
    let s = t.replace(/^(const|volatile|restrict|_Atomic)\s+/, '').trim();
    if (!/\*\s*$/.test(s)) return false;       // must end in *
    if (/\*\s*\*\s*$/.test(s)) return false;   // exclude **
    if (s.includes('(')) return false;         // exclude function pointers
    s = s.replace(/\*\s*$/, '').trim();
    s = s.replace(/^(const|volatile|restrict|_Atomic)\s+/, '').trim();
    if (/^struct\s+\w+$/.test(s)) return true;
    // Typedef-following: if the bare name resolves to a struct via
    // the alias map, treat it as a struct pointer.  Walk the alias
    // chain up to depth 10 with cycle detection (mirror of the
    // integer-typedef chase in isScalarPtrType, build-tree.mjs).
    if (structTypedefAliases && /^\w+$/.test(s)) {
        const seen = new Set();
        let cur = s;
        for (let depth = 0; depth < 10 && !seen.has(cur); depth++) {
            seen.add(cur);
            const next = structTypedefAliases.get(cur);
            if (!next) return false;
            // crossTuTypedefAliases stores only the underlying struct
            // tag (the regex match captured `struct Xxx`), so any
            // hit is a struct typedef by construction.
            return true;
        }
    }
    return false;
}

// True if `node` is the C NUL character literal — `'\0'` (a
// CharacterLiteral with value 0) or the integer 0 in a context where
// 0-can-be-a-char.  Used to recognize the `*buf = '\0'` idiom.
function isNulCharLiteral(node) {
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr'
                 || n.kind === 'CStyleCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n) return false;
    if (n.kind === 'CharacterLiteral' && n.value === 0) return true;
    if (n.kind === 'IntegerLiteral' && n.value === '0') return true;
    return false;
}

// True if `node` resolves (after stripping casts) to a DeclRefExpr
// whose original C type is a `char [N]` fixed-size array.  Used to
// detect the C `*buf = '\0'` "reset to empty string" idiom which we
// translate to `buf = ''` rather than a pointer-mutation marker.
// §23.238 — decl/read consistency for char arrays with brace-list
// initializers.  `static const char syms[] = { MAXOCLASSES, ... }`
// emits as a JS ARRAY literal (initListExpr's array branch), but the
// string-mode read path (arraySubscriptExpr → __nh_char_at0/
// __nh_advance_str) assumed every `char [N]` decl is a JS string —
// emitting string helpers against an array (makemon.js
// set_mimic_sym's `syms` table; would TypeError when a mimic
// spawns, and the drifted text noop'd the m_initappear patch).
// Decl-emit sites (globalVarDecl, static hoist, declStmt) call this
// after computing initJs; when a char-array decl actually emitted an
// array literal, the name is excluded from isCharArrayDeclRef so
// reads stay `arr[i]`.
function registerCharArrayEmittedAsArray(ctx, name, typeStr, initJs) {
    if (!ctx || !name || !initJs) return;
    const t = (typeStr || '')
        .replace(/^(const|volatile|restrict)\s+/, '')
        .replace(/^(signed|unsigned)\s+/, '')
        .trim();
    if (!/^char\s*\[\s*\d+\s*\]$/.test(t)) return;
    if (!initJs.trimStart().startsWith('[')) return;
    if (!ctx.charArraysEmittedAsArray) {
        ctx.charArraysEmittedAsArray = new Set();
    }
    ctx.charArraysEmittedAsArray.add(name);
}

// MemberExpr whose member type is a fixed-size char array
// (`char name[BUFSZ]` struct field).  Companion to isCharArrayDeclRef
// for the buf[0]='\0' clear idiom on struct fields.
function isCharArrayFieldType(node) {
    if (!node || node.kind !== 'MemberExpr') return false;
    const t = (node.type?.qualType || '')
        .replace(/^(const|volatile|restrict)\s+/, '')
        .replace(/^(signed|unsigned)\s+/, '')
        .trim();
    return /^char\s*\[\s*\d+\s*\]$/.test(t);
}

function isCharArrayDeclRef(node, ctx) {
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'DeclRefExpr') return false;
    // Brace-list-initialized char arrays emit as JS arrays, not
    // strings — reads must stay array-indexed (§23.238 above).
    const declName = n.referencedDecl?.name ?? n.name;
    if (ctx?.charArraysEmittedAsArray?.has(declName)) return false;
    // The DeclRefExpr's referencedDecl carries the declared variable's
    // type; check for `char [N]`.  Strip leading qualifiers and
    // signed/unsigned modifiers.
    const t = (n.referencedDecl?.type?.qualType
               ?? n.type?.qualType ?? '')
              .replace(/^(const|volatile|restrict)\s+/, '')
              .replace(/^(signed|unsigned)\s+/, '')
              .trim();
    return /^char\s*\[\s*\d+\s*\]$/.test(t);
}

// True if `node` resolves (after stripping casts) to a struct/array
// access expression (MemberExpr or ArraySubscriptExpr) whose result
// type is `char *`.  Used to detect the C `*obj.field = '\0'` /
// `*arr[i].field = '\0'` "reset field-string to empty" idiom which
// we translate to `obj.field = ''` rather than a pointer-mutation
// marker.
//
// Restricted to MemberExpr/ArraySubscriptExpr (NOT bare DeclRef) on
// purpose: a local `char *p = buf;` aliases an external buffer, so
// reassigning the local doesn't truncate the buffer in JS-string
// terms.  But a struct FIELD of type `char *` IS the storage in our
// JS model — fields hold values, not pointer aliases — so emitting
// `obj.field = ''` correctly truncates the field's value.
function isCharPointerFieldExpr(node) {
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n) return false;
    if (n.kind !== 'MemberExpr' && n.kind !== 'ArraySubscriptExpr') return false;
    const t = (n.type?.qualType ?? '').replace(/^(const|volatile|restrict)\s+/, '').trim();
    return /^char\s*\*\s*$/.test(t);
}

// Walk a function body and add the names of all `T *p = (T *) param`
// alias VarDecls to `out` (when `param` is already in `out`, i.e. a
// scalar-ptr out-param).  Used so the body's `*p = X` rewrites to
// `p.value = X` — the local `p` IS the same JS box as the param's
// `.value` (since `let p = param` binds to the box reference).
function collectCastedAliasLocals(node, out) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'FunctionDecl') return;
    if (node.kind === 'VarDecl' && node.name) {
        const init = (node.inner || [])[0];
        let cur = init;
        while (cur && (cur.kind === 'CStyleCastExpr'
            || cur.kind === 'ImplicitCastExpr'
            || cur.kind === 'ParenExpr')) {
            cur = cur.inner?.[0];
        }
        if (cur?.kind === 'DeclRefExpr') {
            const refName = renameIfReserved(cur.referencedDecl?.name || cur.name || '');
            if (refName && out.has(refName)) {
                out.add(renameIfReserved(node.name));
            }
        }
    }
    for (const child of node.inner || []) collectCastedAliasLocals(child, out);
}

// Walk a function body and add the names of all struct-ptr local
// VarDecls to `out`.  Same role as struct-ptr parameters: `*p = X`
// writes through them become `Object.assign(p, X)`.
function collectStructPtrLocals(node, out, structTypedefAliases = null) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'FunctionDecl') return;  // don't cross fn boundary
    if (node.kind === 'VarDecl' && node.name
        && isStructPtrTypeStr(node.type?.qualType || '', structTypedefAliases)) {
        out.add(renameIfReserved(node.name));
    }
    for (const child of node.inner || []) {
        collectStructPtrLocals(child, out, structTypedefAliases);
    }
}

function paramRefName(node) {
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    return renameIfReserved(n?.referencedDecl?.name || n?.name || '');
}

function isAssignmentOp(op) {
    return op === '=' || op === '+=' || op === '-=' || op === '*='
        || op === '/=' || op === '%=' || op === '&=' || op === '|='
        || op === '^=' || op === '<<=' || op === '>>=';
}

// True for AST nodes that are safe to evaluate twice — used by the
// chained-assign splitter, which substitutes the inner RHS as the
// outer RHS and would otherwise call side effects twice.  Conservative:
// literals, DeclRefExpr, and simple casts/parens around them.
function isPureExprNode(node) {
    if (!node) return false;
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr'
                 || n.kind === 'CStyleCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n) return false;
    return n.kind === 'IntegerLiteral'
        || n.kind === 'FloatingLiteral'
        || n.kind === 'CharacterLiteral'
        || n.kind === 'StringLiteral'
        || n.kind === 'CXXNullPtrLiteralExpr'
        || n.kind === 'GNUNullExpr'
        || n.kind === 'DeclRefExpr';
}

// Look for the C lvalue forms that JS can't model:
//   - top-level `*p` (assigning through a pointer)
//   - any postfix `++` or `--` on pointer-type subexpression
//     (assigning at advance position, e.g. `*p++ = X` or
//     `p++->field = X`)
function lvalueNeedsPointerWrapper(node) {
    if (!node) return false;
    const n = (node.kind === 'ParenExpr') ? node.inner?.[0] : node;
    if (!n) return false;
    if (n.kind === 'UnaryOperator' && n.opcode === '*') return true;
    return containsPostfixPtrInc(n);
}

function containsPostfixPtrInc(node) {
    if (!node) return false;
    if (node.kind === 'UnaryOperator'
        && node.isPostfix
        && (node.opcode === '++' || node.opcode === '--')) {
        const t = node.inner?.[0]?.type?.qualType || '';
        if (/\*\s*$/.test(t)) return true;
    }
    for (const c of node.inner || []) {
        if (containsPostfixPtrInc(c)) return true;
    }
    return false;
}

function unaryOp(node, ctx) {
    const op = node.opcode;
    const innerNode = node.inner[0];
    // Char-buffer read: `*p` or `*p++` where p is a tracked char-
    // buffer rewrite candidate.  Emits `buf[idx]` / `buf[idx++]`.
    // This handles the READ form (the inner expr value); the WRITE
    // form is handled by binaryOp before it reaches here.
    if (op === '*') {
        const cbr = matchCharBufferWrite(node, ctx);
        if (cbr) {
            // String-mode TU: buf is a JS string — `buf[idx]` yields a
            // one-char STRING, or undefined past the end, where
            // `undefined != 0` is TRUE: ggetobj's `(sym = *ip++)`
            // terminator test never fired and the loop allocated until
            // OOM (Q9 iteration 13, seed5002).  Route through the char
            // helpers so reads are byte numbers with 0 at
            // end-of-string, mirroring the string-mode WRITE form in
            // binaryOp (iteration 4c).
            if (inStringMode(ctx)) {
                ctx.externalRefs?.set?.('__nh_char_at0',
                    EXTERNAL_SYMBOLS['__nh_char_at0']);
                ctx.externalRefs?.set?.('__nh_advance_str',
                    EXTERNAL_SYMBOLS['__nh_advance_str']);
                return `__nh_char_at0(__nh_advance_str(${cbr.bufJs}, ${cbr.idxAccess}))`;
            }
            return `${cbr.bufJs}[${cbr.idxAccess}]`;
        }
    }
    // Linked-list iterator deref: `*var` where var is in
    // ctx.linkedListIterators emits as `<name>__parent[<name>__field]`.
    // Catches the READ form (in if-conditions, as RHS of =, etc.);
    // the WRITE form `*var = X` is handled by binaryOp ahead of
    // generic deref.
    if (op === '*' && ctx.linkedListIterators
        && ctx.linkedListIterators.size > 0) {
        const inner = stripCasts(innerNode);
        if (inner?.kind === 'DeclRefExpr'
            && ctx.linkedListIterators.has(inner.referencedDecl?.name)) {
            const name = renameIfReserved(inner.referencedDecl.name);
            return `${name}__parent[${name}__field]`;
        }
    }
    // Outparam-aware deref: `*p` where p is a known scalar-ptr
    // parameter becomes `p.value`.  Caller-side wrapping is in
    // callExpr.
    if (op === '*' && isScalarPtrParamRef(innerNode, ctx)) {
        const refName = paramRefName(innerNode);
        return `${refName}.value`;
    }
    // §23.228 — `&p[N]` where p is `char *` — the C "address-of-element"
    // idiom that translates to pointer-add.  C semantics:
    // `&p[N] === p + N` (advance pointer N bytes).  Without this branch
    // the `&` op was dropped (see `if (op === '&') return arg` below),
    // and arraySubscriptExpr emits the read form __nh_char_at0(...).
    // That returns a BYTE, not a pointer — assignment like
    // `p = &p[N]` then rebinds p to a number instead of advancing it.
    // Pre-existing rip.c::genl_outrip bug surfaced by the new
    // arraySubscriptExpr recognizer; the fix routes to __nh_advance_str
    // which is the pointer-add we want.
    if (op === '&') {
        const inner = stripCasts(innerNode);
        if (inner?.kind === 'ArraySubscriptExpr') {
            const base = stripCasts(inner.inner?.[0]);
            const isCharPtrBase = (n) => {
                if (!n) return false;
                if (n.kind !== 'DeclRefExpr' && n.kind !== 'MemberExpr') return false;
                const t = (n.type?.qualType || '').trim();
                return /^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(t);
            };
            if (isCharPtrBase(base)) {
                ctx.externalRefs?.set?.('__nh_advance_str',
                    EXTERNAL_SYMBOLS['__nh_advance_str']);
                const baseJs = expr(inner.inner[0], ctx);
                const idxJs = expr(inner.inner[1], ctx);
                return `__nh_advance_str(${baseJs}, ${idxJs})`;
            }
        }
    }
    const arg = expr(innerNode, ctx);
    // C's address-of (&x) is a no-op in JS: objects already pass by
    // reference, so `&a` and `a` evaluate identically when the target
    // is a struct.  For scalars, taking the address is rare in C and
    // would be expressed via a wrapper class in JS; defer to whatever
    // phase first hits a scalar address-of.
    if (op === '&') return arg;
    // Char-typed local pointer deref: `*p` where p is a local
    // `const char *` / `char *` (NOT a scalar-ptr-param, NOT a
    // charBufferRewrites walker, NOT a linkedListIterator — those
    // are caught by earlier branches).  Emit `__nh_char_at0(p)` so
    // the runtime helper handles all three concrete JS shapes the
    // pointer may carry at runtime: a plain JS string (typical for
    // pointer-to-string-literal locals like `gnam = gu.urole.lgod`),
    // a char-array (`char buf[N]`), or a `{value: N}` scalar-ptr
    // wrapper.
    //
    // Without this branch the previous fallthrough emit (`*p` →
    // `p` no-op deref) produced silently-wrong comparisons like
    // `if (gnam == 95)` for C's `if (*gnam == '_')` (always false
    // since "Amaterasu Omikami" !== 95), causing
    // `pray.c::align_gname` to never strip its leading-underscore
    // proper-noun marker.  See e358388 for the prior per-site
    // hand patch; this recognizer generalizes it.  Added 2026-05-31
    // as Phase A1 of the translator-capability plan.
    if (op === '*') {
        const innerStripped = stripCasts(innerNode);
        // Match `const char *`, `char *`, or
        // `const? unsigned/signed? char *` (no further qualifier
        // tail — uchar/int8/uint8 typedefs go through the
        // scalar-ptr-param path when used as outparams; locals
        // that happen to be uchar* are vanishingly rare and not
        // exercised by current sessions).
        // Accepts DeclRefExpr (local / param) OR MemberExpr (struct
        // field like `d->bp`); the MemberExpr extension covers
        // objnam.c's wish-parsing reads (`if (*d->bp == ...)`).
        if (innerStripped
            && (innerStripped.kind === 'DeclRefExpr'
                || innerStripped.kind === 'MemberExpr')) {
            const innerType = (innerStripped.type?.qualType || '').trim();
            if (/^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(innerType)) {
                ctx.externalRefs?.set?.('__nh_char_at0',
                    EXTERNAL_SYMBOLS['__nh_char_at0']);
                return `__nh_char_at0(${arg})`;
            }
        }
        // Phase A1 extension (§23.222cx): `*(p + N)` where p+N has
        // `char *` type (after A3's pointer-arithmetic recognition).
        // Without this, the inner BinaryOperator emits via A3 as
        // `__nh_advance_str(p, N)` — a string SUFFIX, not a byte.
        // The outer `*` deref must read the first byte of that
        // suffix; emit `__nh_char_at0(...)` wrapping the A3 result.
        //
        // Covers C idioms like questpgr.c `*(c + 1)`, windows.c
        // `*(str + 1) == 'G'`, vision.c `*limits >= *(limits + 1)`,
        // hacklib.c `*(p - 1)`, mdlib.c `*(word + 1) == '('`, etc.
        // Without this, those reads return string suffixes that
        // silently compare-false against character literals.
        if (innerStripped
            && innerStripped.kind === 'BinaryOperator'
            && (innerStripped.opcode === '+' || innerStripped.opcode === '-')) {
            const exprType = (innerStripped.type?.qualType || '').trim();
            if (/^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(exprType)) {
                ctx.externalRefs?.set?.('__nh_char_at0',
                    EXTERNAL_SYMBOLS['__nh_char_at0']);
                return `__nh_char_at0(${arg})`;
            }
        }
        // `*++p` / `*--p` as a VALUE on a char* — C reads the BYTE at
        // the advanced position; the inner prefix-inc renders as
        // `(p = __nh_advance_str(p, ±1))` whose value is the advanced
        // SUFFIX (string or array slice) — truthy even when empty for
        // arrays ([] is truthy!), so display_pickinv's
        // `if (*++invlet) goto nextclass` over flags.inv_order spun
        // forever once the menu flows made it live (Q9 iteration 31,
        // the seed4500 census hang).  Wrap with the byte read; the
        // assignment side effect is preserved inside.  (Postfix
        // `*p++`-as-value reads the OLD byte and is handled by the
        // charBufferRewrites walker path, not here.)
        if (innerStripped
            && innerStripped.kind === 'UnaryOperator'
            && !innerStripped.isPostfix
            && (innerStripped.opcode === '++' || innerStripped.opcode === '--')) {
            const operand = stripCasts(innerStripped.inner?.[0]);
            const opType = (operand?.type?.qualType || '').trim();
            if (/^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(opType)) {
                ctx.externalRefs?.set?.('__nh_char_at0',
                    EXTERNAL_SYMBOLS['__nh_char_at0']);
                return `__nh_char_at0(${arg})`;
            }
        }
        return arg;
    }
    // `__extension__` is GCC's "this is a non-portable extension,
    // suppress warnings" prefix.  Clang represents it as a UnaryOp
    // wrapping the real expression.  Emit the inner directly.
    if (op === '__extension__') return arg;
    // charBufferRewrites standalone walker increment: `p++` / `p--`
    // / `++p` / `--p` (NOT wrapped in `*`) where p is a recognized
    // walker.  Emit `__nh_p_idx++` (etc) so the increment advances
    // the idx tracker rather than the (now-undefined) `p` identifier.
    // Pairs with the standalone-increment safe-set check + the
    // hasCharBufferTrueWrite recognizer gate.  Without this, the
    // increment falls through to `${arg}${op}` and emits the bare
    // walker name, breaking the rewrite.  Added 2026-05-31 for
    // windows.c::getlin's `*bufp = key; bufp++;` two-statement
    // walker pattern.
    if ((op === '++' || op === '--') && ctx.charBufferRewrites
        && ctx.charBufferRewrites.size > 0) {
        const inner = stripCasts(innerNode);
        if (inner?.kind === 'DeclRefExpr') {
            const name = inner.referencedDecl?.name;
            if (name && ctx.charBufferRewrites.has(name)) {
                const rewrite = ctx.charBufferRewrites.get(name);
                if (node.isPostfix) return `${rewrite.idxName}${op}`;
                return `${op}${rewrite.idxName}`;
            }
        }
    }
    // strchr-bound walker increment: `p++` / `p--` post-truncate
    // where p was bound via `p = strchr(buf, X)` and the enclosing
    // function is in the strchr_truncate_p_incr allowlist.  In JS-
    // string semantics, p holds the captured suffix string at the
    // strchr call; `p++` advances past one char.  Emit as a JS
    // slice rebind.  Wrapped in parens so the operator-form is
    // valid in any context (statement OR expression), though our
    // safety check restricts the allowlist to function-locals
    // where the typical use is statement-form.
    if ((op === '++' || op === '--') && ctx.strchrBoundPaths
        && ctx.strchrBoundPaths.size > 0) {
        const path = buildExprPath(innerNode);
        if (path && ctx.strchrBoundPaths.has(path)) {
            const arg = expr(innerNode, ctx);
            if (op === '++') {
                return `(${arg} = ${arg}.substring(1))`;
            }
            return `(${arg} = ${arg}.substring(0, ${arg}.length - 1))`;
        }
    }
    // Phase A2: `++p` / `p++` / `--p` / `p--` on a local `char *` /
    // `const char *` whose runtime binding is a JS string (or a char-
    // array) where no charBufferRewrites walker / strchrBoundPaths
    // claimed it.  The generic emit (`++p`) is a NaN-write no-op on
    // strings; route through __nh_advance_str so the assignment
    // re-binds to the suffix slice.  Statement form is canonical; in
    // expression form, the assignment-expression value is the NEW p
    // (matches prefix semantic; postfix-as-r-value is rare on string
    // pointers and accepted as a small intentional gap).  Pairs with
    // Phase A1's __nh_char_at0 deref recognizer so the typical pattern
    // `if (*p == 'X') ++p;` (e.g. pray.c::align_gname's underscore
    // strip) translates correctly without per-site hand-port.
    if ((op === '++' || op === '--')) {
        const innerStripped = stripCasts(innerNode);
        const isCharPtrTarget = (n) => {
            if (!n) return false;
            // DeclRefExpr to a char-typed local / param.
            // MemberExpr to a char-typed struct field (e.g. d.bp,
            // d->p in C → emitted as `d.p` / `d.bp` in JS after
            // arrow→dot normalization).  We require the OUTER
            // expression's type to be char*; struct-relative cases
            // mirror local-pointer semantics through __nh_advance_str
            // (string slice or array slice rebind).
            if (n.kind !== 'DeclRefExpr' && n.kind !== 'MemberExpr') {
                return false;
            }
            const t = (n.type?.qualType || '').trim();
            return /^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(t);
        };
        if (isCharPtrTarget(innerStripped)) {
            ctx.externalRefs?.set?.('__nh_advance_str',
                EXTERNAL_SYMBOLS['__nh_advance_str']);
            const delta = (op === '++') ? '1' : '-1';
            return `(${arg} = __nh_advance_str(${arg}, ${delta}))`;
        }
    }
    // C `ptr++` / `ptr--` on a struct-pointer-typed local advances
    // the pointer to the next array slot.  In JS the `ptr` variable
    // holds the struct OBJECT (not an integer offset), so `ptr++`
    // would compute `Number(obj) → NaN`, assign NaN back, and then
    // `ptr.field` would throw.  Emit a no-op for these — the
    // typical caller pattern (`ptr++; ptr->hx = -1;`) ends up
    // re-assigning to the SAME object, which is harmlessly wrong
    // for a sentinel-init line and prevents the NaN throw from
    // aborting the surrounding state-mutation.
    if ((op === '++' || op === '--') && isStructPtrLocal(innerNode, ctx)) {
        // The C-side `ptr++` advances into the next array slot; the
        // typical follow-up is `ptr->field = X` to init that slot.
        // In JS we can't represent the "next slot" without
        // tracking the source array, so re-bind the local to a
        // black-hole sentinel object whose property writes are
        // silently dropped.  Any subsequent `<local>.<field> = X`
        // is then a no-op rather than clobbering the just-
        // initialized slot at the original index.
        const argLocal = expr(innerNode, ctx);
        return `(${argLocal} = __nh_blackhole)`;
    }
    if (node.isPostfix) return `${arg}${op}`;
    // Insert a space when the operator letter would run into an
    // alphanumeric inner expression (e.g. `!foo` is fine, but
    // `notfoo` would be misread).
    const sep = /[A-Za-z_]/.test(op[0]) ? ' ' : '';
    return `${op}${sep}${arg}`;
}

function compoundAssign(node, ctx) {
    const op = node.opcode;
    const [l, r] = node.inner;
    // Pointer-advance for charBufferRewrites: `p += N` / `p -= N`
    // where p is a recognized walker.  Emit `__nh_p_idx += N`
    // (matches C's pointer-arith semantics in the index-based model).
    // Verifier accepts via isCharBufferAdvanceUsage; emit dispatches
    // here.  Clang routes compound assigns through CompoundAssignOperator
    // (not BinaryOperator), so this hook is parallel to the same
    // check in binaryOp.  Added 2026-05-30 for hacklib.c strNsubst's
    // `bp += len;` advance.
    if ((op === '+=' || op === '-=') && ctx.charBufferRewrites
        && l?.kind === 'DeclRefExpr') {
        const lName = l.referencedDecl?.name;
        if (lName && ctx.charBufferRewrites.has(lName)) {
            const rewrite = ctx.charBufferRewrites.get(lName);
            const rJs = expr(r, ctx);
            return `${rewrite.idxName} ${op} ${rJs}`;
        }
    }
    // Phase A2: `p += N` / `p -= N` on a `char *` / `const char *`
    // target (DeclRefExpr local OR MemberExpr struct field) not
    // claimed by charBufferRewrites.  Route through __nh_advance_str
    // so the rebind respects JS-string / char-array suffix semantics.
    // See unaryOp's Phase A2 block for the rationale.
    if ((op === '+=' || op === '-=')
        && (l?.kind === 'DeclRefExpr' || l?.kind === 'MemberExpr')) {
        const innerType = (l.type?.qualType || '').trim();
        if (/^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(innerType)) {
            const lName = expr(l, ctx);
            const rJs = expr(r, ctx);
            ctx.externalRefs?.set?.('__nh_advance_str',
                EXTERNAL_SYMBOLS['__nh_advance_str']);
            const delta = (op === '+=') ? rJs : `-(${rJs})`;
            return `${lName} = __nh_advance_str(${lName}, ${delta})`;
        }
    }
    const lJs = expr(l, ctx);
    const rJs = expr(r, ctx);
    // Integer types in C: `x /= y` truncates toward zero.  JS `/=` is
    // floating-point.  Detect integer-typed operands and emit a Math.trunc
    // form so e.g. `int x = 25; x /= 1000;` yields 0 in JS, matching C.
    // Heuristic: the LHS clang-typed qualType is one of the integer
    // primitives (int, short, long, char) — if so, wrap the division.
    if (op === '/=' && isIntegerType(l?.type?.qualType)) {
        // Precedence safety: same fix as binaryOp's `/` site.  If RHS
        // is a ConditionalOperator, wrap it in parens so the ternary
        // doesn't get captured around the division.  Added 2026-05-31.
        const rStripped = stripCasts(r);
        const rWrap = (rStripped?.kind === 'ConditionalOperator')
            ? `(${rJs})` : rJs;
        return `${lJs} = Math.trunc(${lJs} / ${rWrap})`;
    }
    return `${lJs} ${op} ${rJs}`;
}

function isIntegerType(qualType) {
    if (!qualType) return false;
    const t = stripQuals(qualType).trim();
    // Match C integer primitives & typedefs we know carry int payloads.
    return /^(int|long|short|char|signed\b|unsigned\b|long\s+long|unsigned\s+(int|long|short|char|long\s+long)|signed\s+(int|long|short|char|long\s+long)|coordxy|schar|xint16|xint32|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|ssize_t|ptrdiff_t|lua_Integer|boolean)$/.test(t);
}

function callExpr(node, ctx) {
    // First child is the callee.  For a direct call `printf(...)` it's
    // an ImplicitCastExpr around a DeclRefExpr; for an indirect call
    // through a struct field `dispatchers[0].op(...)` it's an
    // ImplicitCastExpr around a MemberExpr around an ArraySubscript.
    // Either way, the callee's JS form is whatever expr() emits.
    const [callee, ...args] = node.inner;
    const calleeJs = expr(callee, ctx);

    // Track imports / banned-call warnings by looking at the deepest
    // DeclRefExpr name (only meaningful for direct calls; indirect
    // calls through pointers don't trip the import path).
    const baseName = calleeBase(callee);
    if (RUNTIME_IMPORT_MAP[baseName]) {
        ctx.importNeeds.add(baseName);
    }
    if (BANNED_CALLS.includes(baseName)) {
        throw new Error(`translator emitted banned call ${baseName}`);
    }
    // Typed alloc for `struct obj`: emit `Object.assign(alloc(1),
    // {blessed: 0, cursed: 0})` so blessorcurse's guard sees
    // both flags as falsy and proceeds.  The
    // level_finalize_topology infinite-loop this previously
    // exposed (croom-blackhole-vs-end comparison) is fixed by
    // a harness-side rewrite.
    if (baseName === 'alloc' && args.length === 1) {
        const init = tryAllocStructInitForObj(args[0], ctx);
        if (init) return init;
    }

    // sprintf(eos(BUF), FMT, ARGS) — the C "append-to-buffer" idiom.
    // C semantics: append formatted text starting at the buffer's
    // current end (computed by eos).  In JS we treat the buffer as a
    // string and concatenate.  Previously this was a regex post-process
    // patched only into objnam.js; lifting to the translator means it
    // applies uniformly to every TU and is one fewer fork-specific
    // line for Phase 2 diff scoring.
    if ((baseName === 'sprintf' || baseName === 'Sprintf')
        && args.length >= 2) {
        const firstArg = stripCasts(args[0]);
        if (firstArg?.kind === 'CallExpr' && calleeBase(firstArg.inner?.[0]) === 'eos') {
            const eosArg = stripCasts(firstArg.inner?.[1]);
            if (eosArg?.kind === 'DeclRefExpr') {
                // §23.232 — Consult localStatics so hoisted-static
                // locals (e.g. `static char dloc[]` → `__do_statusline2_dloc`)
                // use the hoisted name on both sides of the assignment.
                // Without this, botl.c emitted `dloc = __nh_buf_append(dloc, ...)`
                // referencing an undefined local — ReferenceError at runtime.
                const rawName = eosArg.referencedDecl?.name || eosArg.name;
                const hoistedName = ctx?.localStatics?.get?.(rawName);
                const bufName = renameIfReserved(hoistedName || rawName);
                const restArgs = args.slice(1).map((a) => expr(a, ctx)).join(', ');
                // §23.222da — use __nh_buf_append helper which preserves
                // char-array binding (mutates in place + returns buf) so
                // subsequent nh_snprintf(buf, ...) on the same buf still
                // mutates.  Strings concatenate as before.  Replaces the
                // prior `buf = ((typeof buf === 'string') ? buf : '') +
                // sprintf('', ...)` rebind-to-string emit which broke
                // mixed concat-then-nh_snprintf usage in insight.c's
                // background_enlightenment and similar paths.
                ctx.externalRefs?.set?.('__nh_buf_append',
                    EXTERNAL_SYMBOLS['__nh_buf_append']);
                return `${bufName} = __nh_buf_append(${bufName}, sprintf('', ${restArgs}))`;
            }
        }
    }

    // strcat(eos(BUF), STR) — the C "append a literal string at the
    // buffer's current end" idiom.  Same auto-capture treatment as the
    // sprintf(eos(...)) recognizer above: rebind buf to __nh_buf_append(buf, STR).
    // Without this, a string-mode buf stays unchanged because the
    // intermediate eos(buf) returns '' (or a slice) and strcat operates
    // on that throwaway — the caller's buf binding is never updated.
    if ((baseName === 'strcat' || baseName === 'Strcat')
        && args.length >= 2) {
        const firstArg = stripCasts(args[0]);
        if (firstArg?.kind === 'CallExpr' && calleeBase(firstArg.inner?.[0]) === 'eos') {
            const eosArg = stripCasts(firstArg.inner?.[1]);
            if (eosArg?.kind === 'DeclRefExpr') {
                // §23.232 — Hoisted-static name lookup (same fix as
                // sprintf-eos recognizer above).
                const rawName = eosArg.referencedDecl?.name || eosArg.name;
                const hoistedName = ctx?.localStatics?.get?.(rawName);
                const bufName = renameIfReserved(hoistedName || rawName);
                const restJs = expr(args[1], ctx);
                ctx.externalRefs?.set?.('__nh_buf_append',
                    EXTERNAL_SYMBOLS['__nh_buf_append']);
                return `${bufName} = __nh_buf_append(${bufName}, ${restJs})`;
            }
        }
    }

    // For functions known to take scalar-pointer outparams, wrap any
    // `&local` argument (UnaryOperator '&' on a DeclRefExpr) with a
    // getter/setter ref-cell.  The closure captures the local var
    // by reference (JS's let-capture semantics), so writes through
    // `.value` propagate back to the caller's scope when the function
    // returns.  Non-`&` args at outparam positions pass through —
    // either the caller is itself passing a ref (function chains a
    // ref through) or it's a real pointer to memory we don't model.
    const ptrParamIdxs =
        ctx.opts?.crossTuScalarPtrParams?.get?.(baseName) || [];
    const ptrIdxSet = new Set(ptrParamIdxs);
    const argJs = args.map((a, i) => {
        if (ptrIdxSet.has(i) && isAddrOfLocal(a, ctx)) {
            return refWrapForAddrOf(a, ctx);
        }
        // charBufferRewrites bare-pointer arg: a candidate walker
        // passed bare (no `*p` or `*p++` wrapper) to a known read-
        // only string function (READ_ONLY_STRING_CALLEES allowlist).
        // In C the callee receives a pointer-into-buffer; the JS
        // equivalent is a slice/substring from the walker's current
        // idx onward.  See isCharBufferReadOnlyArgUsage for the
        // verifier side — only candidates whose uses match the
        // allowlist get registered, so this emit only fires for
        // safe sites.
        const cbrSliceJs = tryCharBufferBareArgEmit(a, baseName, i, ctx);
        if (cbrSliceJs !== null) return cbrSliceJs;
        return expr(a, ctx);
    }).join(', ');
    return `${calleeJs}(${argJs})`;
}

// True iff the AST node, after stripping ImplicitCastExpr / ParenExpr,
// is a DeclRefExpr to a charBufferRewrites candidate name AND the
// callee+argIdx is in the READ_ONLY_STRING_CALLEES allowlist.
// Returns the JS emit `${bufRef}.slice(${idxName})` or null.
//
// argIdx is user-perceived (0-based among args, NOT inner) — matches
// the iteration index in callExpr's args.map.
function tryCharBufferBareArgEmit(argNode, calleeBaseName, argIdx, ctx) {
    if (!ctx.charBufferRewrites || ctx.charBufferRewrites.size === 0) return null;
    if (!READ_ONLY_STRING_CALLEES.has(calleeBaseName)) return null;
    const safeArgs = READ_ONLY_STRING_CALLEES.get(calleeBaseName);
    if (safeArgs !== null && !safeArgs.has(argIdx)) return null;
    let n = argNode;
    while (n && (n.kind === 'ImplicitCastExpr'
        || n.kind === 'CStyleCastExpr' || n.kind === 'ParenExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'DeclRefExpr') return null;
    const name = n.referencedDecl?.name;
    if (!name || !ctx.charBufferRewrites.has(name)) return null;
    const rewrite = ctx.charBufferRewrites.get(name);
    const bufJs = expr(rewrite.bufRef, ctx);
    return `${bufJs}.slice(${rewrite.idxName})`;
}

// True when the AST node is `&LVALUE` where LVALUE is something we
// can wrap via a getter/setter pair: a plain identifier
// (DeclRefExpr) OR a struct-field reference (MemberExpr, including
// chained `obj.a.b` or `ptr->a.b`).  Strips ParenExpr /
// ImplicitCastExpr along the way.  Without the MemberExpr arm, a C
// call like `check_room(&gv.vault_x, &w, ...)` would emit the bare
// `game.vault_x` for the first arg, which lacks the `.value`
// property the callee reads — and the callee's reads return
// `undefined`, poisoning downstream arithmetic with NaN.
function isAddrOfLocal(node, ctx) {
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    if (!n || n.kind !== 'UnaryOperator' || n.opcode !== '&') return false;
    let target = n.inner?.[0];
    while (target && (target.kind === 'ParenExpr' || target.kind === 'ImplicitCastExpr')) {
        target = target.inner?.[0];
    }
    // ArraySubscriptExpr added so `&arr[i]` outparams (e.g.
    // `Sfo_long(nhfp, &wgrowtime[i], "...")`) get boxed.  In C the
    // address is computed point-in-time; in JS the closure-captured
    // getter/setter re-reads `arr[i]` on each access.  Equivalent
    // when `i` doesn't mutate during the callee's read/write, which
    // is the case for all save-file outparam sites in NetHack
    // (loop counter, stable through one sf-call).
    return target?.kind === 'DeclRefExpr'
        || target?.kind === 'MemberExpr'
        || target?.kind === 'ArraySubscriptExpr';
}

// Build a `{get value(){return X;}, set value(v){X=v;}}` wrapper for
// a `&LOCAL` argument so the callee's `*param = X` writes propagate
// back to the caller's binding.
function refWrapForAddrOf(node, ctx) {
    let n = node;
    while (n && (n.kind === 'ParenExpr' || n.kind === 'ImplicitCastExpr')) {
        n = n.inner?.[0];
    }
    // n is UnaryOperator '&'.  Render its target via expr() so any
    // game-hoisting / bucket-flatten still applies.
    const targetJs = expr(n.inner?.[0], ctx);
    return `{ get value() { return ${targetJs}; }, set value(_v) { ${targetJs} = _v; } }`;
}

function calleeBase(node) {
    if (!node) return '???';
    if (node.kind === 'DeclRefExpr') return renameIfReserved(node.referencedDecl?.name || '???');
    if (node.inner) return calleeBase(node.inner[0]);
    return '???';
}

function conditionalExpr(node, ctx) {
    const [cond, then_, else_] = node.inner;
    return `${expr(cond, ctx)} ? ${expr(then_, ctx)} : ${expr(else_, ctx)}`;
}

// §23.228 — ArraySubscriptExpr emit.
// Default: bare `base[idx]` — correct for non-char arrays and for
// LHS contexts (the binaryOp recognizers intercept write patterns
// before they reach generic LHS emit).
// Special case: when base is a `char *` / `const char *` pointer
// (DeclRefExpr to a parameter or local), emit
// `__nh_char_at0(__nh_advance_str(base, idx))` so the read works
// uniformly whether base is at runtime a JS string, char-array, or
// `{value: ...}` scalar-ptr wrapper.  Without this, `line[0] == 37`
// on a string-typed `line` is `"%" == 37` which is silently false
// (the original pline.c bug, §23.227 deferred-TU list entry).
//
// Restricted to char-pointer type (not `char [N]` array) on the
// base.  Array-typed bases keep bare emit; in dual-mode those are
// always JS arrays and byte indexing works.  String-mode TUs with
// `char buf[N]` declarations rebind to string but their writes are
// handled by the `buf[0]=0` recognizer + the highc/lowc recognizer
// (added below); reads of `arr[N]` on a string-typed local fall
// through to bare `arr[N]` which returns a single-char string —
// the existing dual-mode runtime helpers handle either form for
// downstream operations.  Tightening to also catch char[N]-in-
// string-mode would require parent-context flow; deferred.
function arraySubscriptExpr(node, ctx) {
    const base = stripCasts(node.inner[0]);
    const idx = node.inner[1];
    // Recognize char-pointer base.  Both DeclRefExpr (parameter or
    // local) and MemberExpr (struct field) are candidates.  Type
    // check: pointee is `(const? signed?/unsigned?) char` and
    // outer is `*` (pointer, not array).
    const isCharPtr = (n) => {
        if (!n) return false;
        if (n.kind !== 'DeclRefExpr' && n.kind !== 'MemberExpr') return false;
        const t = (n.type?.qualType || '').trim();
        // `char *`, `const char *`, `signed char *`, `unsigned char *`.
        // Exclude `char [N]` array (no trailing `*`) and `char *[N]`
        // (array of pointers, with `[` after `*`).
        return /^(?:const\s+)?(?:signed\s+|unsigned\s+)?char\s*\*\s*$/.test(t);
    };
    // §23.231 — In a string-mode TU, `char buf[N]` becomes `let buf = ''`.
    // Subsequent `buf[i]` reads on a string return a single-character
    // string, not a byte number, so comparisons like `buf[i] == 65`
    // silently fail.  Route through __nh_char_at0/__nh_advance_str for
    // dual-mode safety.
    const isCharArrayLocalInStringMode = (n) => {
        if (!inStringMode(ctx) || !ctx?.currentFnName) return false;
        if (!n) return false;
        if (n.kind !== 'DeclRefExpr' && n.kind !== 'MemberExpr') return false;
        return isCharArrayDeclRef(n, ctx);
    };
    if (isCharPtr(base) || isCharArrayLocalInStringMode(base)) {
        ctx.externalRefs?.set?.('__nh_char_at0',
            EXTERNAL_SYMBOLS['__nh_char_at0']);
        const baseJs = expr(node.inner[0], ctx);
        // Optimize the common case of idx == 0: drop __nh_advance_str
        // and just call __nh_char_at0(base) directly.  Functionally
        // identical to `__nh_char_at0(__nh_advance_str(base, 0))`.
        const idxStripped = stripCasts(idx);
        if (idxStripped?.kind === 'IntegerLiteral'
            && String(idxStripped.value) === '0') {
            return `__nh_char_at0(${baseJs})`;
        }
        ctx.externalRefs?.set?.('__nh_advance_str',
            EXTERNAL_SYMBOLS['__nh_advance_str']);
        const idxJs = expr(idx, ctx);
        return `__nh_char_at0(__nh_advance_str(${baseJs}, ${idxJs}))`;
    }
    return `${expr(node.inner[0], ctx)}[${expr(node.inner[1], ctx)}]`;
}

function memberExpr(node, ctx) {
    // C's `obj.field` and `ptr->field` both map to JS `obj.field` —
    // pointers are already object references in JS, so the arrow vs
    // dot distinction collapses.
    const [base] = node.inner;
    // Pattern `lev++.typ` is a pointer post-increment used as a
    // member-access base.  The C semantics are "advance the pointer,
    // then read the OLD pointee's field" — non-trivial without a
    // CharBuffer/RecordIter wrapper.  Until Phase 5+, emit a TODO
    // sentinel that parses cleanly so downstream syntax checks pass.
    if (containsPostfixPtrInc(base)) {
        return `(0 /* TODO Phase 5+: pointer-mutation member-access (${node.name}) */)`;
    }
    return `${expr(base, ctx)}.${node.name}`;
}

// ── Helpers ─────────────────────────────────────────────────────

function jsString(s) {
    // Convert a C string literal (already unquoted by clang) to a JS
    // string literal.  clang gives us the source-text-form including
    // escapes (\n, \", etc.); strip outer quotes if present and
    // re-quote.  Empirically clang's `value` field on StringLiteral is
    // the source text WITH outer quotes.
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
    // C octal escapes (\NNN) aren't valid in JS strict-mode strings.
    // Rewrite each `\d{1,3}` escape to the equivalent `\xHH` form.
    // Skip the `\0` form when not followed by another digit, since JS
    // accepts that as the null character.
    s = s.replace(/\\([0-7]{1,3})/g, (m, oct) => {
        if (oct === '0') return '\\0';
        const code = parseInt(oct, 8);
        return '\\x' + code.toString(16).padStart(2, '0');
    });
    // The remaining escape sequences (\n, \\, \", \t etc.) are valid
    // JS escapes too, so we pass them through.  Re-quote.
    return `"${s}"`;
}

function zeroForType(type) {
    const q = type?.qualType || '';
    if (q.includes('*') || q.includes('[')) return 'null';
    if (q === 'char' || q.startsWith('char ') || q === 'signed char') return '0';
    if (q.includes('float') || q.includes('double')) return '0.0';
    return '0';
}

function renameIfReserved(name) {
    if (!name) return name;
    if (JS_RESERVED_RENAMES.includes(name)) return name + '_';
    return name;
}
