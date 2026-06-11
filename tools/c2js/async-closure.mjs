// async-closure.mjs — compute the set of translated functions that
// transitively reach the async seed `(game.windowprocs.win_nhgetch)()`.
//
// Why: the engine drives user input through a single low-level
// primitive — `nhgetch` — and translated code reaches it via the
// indirect call `(game.windowprocs.win_nhgetch)()`.  For real
// keyboard input (not pre-buffered replay), every function that
// transitively performs such a call must become `async` so it can
// `await` the keypress.  This pass computes that set once, at build
// time, by walking every TU's AST and doing a transitive-closure
// fixed-point over the call graph.
//
// Returns a Set<string> of function names.  Consumed by translate.mjs
// via `opts.crossTuAsync`:
//   - functionDecl emits `async function` if the name is in the set
//   - callExpr emits `await ...` if the callee resolves to a name in
//     the set OR if the callee is the seed pattern (the indirect
//     `.win_nhgetch` member call)
//
// Seed scope (per design 2026-05-21): just `win_nhgetch`.  Other
// input-blocking windowprocs (`win_yn_function`, `win_getlin`, etc.)
// reach `win_nhgetch` transitively in their real implementations, so
// the closure picks them up once those impls are wired up.  Adding
// more seeds later only needs an additional entry in
// SEED_INDIRECT_MEMBERS.

import { INDIRECT_ASYNC_MEMBERS, INDIRECT_ASYNC_GLOBALS } from './c2js.config.mjs';

// (UNWEDGE_PLAN Q8) The seed set covers every indirect dispatch shape
// whose targets can be async: input windowprocs + fn-pointer table
// members (timeout_funcs[i].f, ef_funct) — see c2js.config.mjs.  The
// C call-graph walker has no edges through pointers, so functions
// containing such calls join the closure via hitsSeed instead.
const SEED_INDIRECT_MEMBERS = new Set(INDIRECT_ASYNC_MEMBERS);

// Function-pointer GLOBALS called as (*name)(): the deref is peeled
// by stripCasts, leaving a DeclRefExpr whose name is a variable, not
// a function — no call-graph edge.  Treat as seeds too.
const SEED_INDIRECT_GLOBALS = new Set(INDIRECT_ASYNC_GLOBALS);

// opts.extraSeedMembers (Set<string>, default empty): additional
// input-reading windowprocs members to treat as seeds.  Needed when
// pruning the pline family (§23.235): C `yn_function`/`getlin` reach
// `win_nhgetch` in the AST only THROUGH pline-family paths (their own
// input read is the indirect `win_yn_function`/`win_getlin` call,
// whose JS implementation awaits — invisible to the C AST walk).
// Without extra seeds, pruning pline would wrongly demote them to
// sync.  Production default behavior is unchanged when empty.

// opts.pruneNames (Set<string>, default empty): functions whose JS
// runtime implementation is known-synchronous even though their C
// body reaches the input seed.  A pruned name never joins the closure
// and therefore never propagates async-ness to its callers.
//
// Rationale (§23.235): C `pline` reaches `win_nhgetch` via
// `more()`/`readchar`, but the JS port's pline is a synchronous
// message-queue write — the --More-- input wait lives in `nhgetch`
// itself.  Without pruning, pline drags ~2,700 functions into the
// closure to guard an await that the JS implementation never takes.
export function computeAsyncClosure(parsed, opts = {}) {
    const pruneNames = opts.pruneNames || new Set();
    const seedMembers = opts.extraSeedMembers
        ? new Set([...SEED_INDIRECT_MEMBERS, ...opts.extraSeedMembers])
        : SEED_INDIRECT_MEMBERS;
    // Step 1: for each FunctionDecl with a body across all TUs, scan
    // the body for callees.  Record direct callees by name and a
    // single hitsSeed bit for any indirect call matching the seed
    // pattern.  Multiple TUs may declare the same name; the body-
    // bearing decl wins (the others are forward decls).
    const fnInfo = new Map(); // fnName → { directCallees, hitsSeed }
    for (const [, p] of parsed) {
        for (const decl of p.decls) {
            if (decl.kind !== 'FunctionDecl' || !decl.name) continue;
            const body = (decl.inner || []).find((n) => n?.kind === 'CompoundStmt');
            if (!body) continue;
            const info = { directCallees: new Set(), hitsSeed: false };
            scanCalls(body, info, seedMembers);
            fnInfo.set(decl.name, info);
        }
    }
    // Step 2: BFS fixed-point.  Add fnName to asyncSet if it hitsSeed
    // OR if any of its direct callees is already in asyncSet.  Iterate
    // until no new function joins (call graph closure).
    //
    // If opts.trace is set, also record the "first reason" each
    // function joined the closure as a `via` Map<name, ancestorName |
    // SEED_SENTINEL>, which lets a caller print the path back to the
    // seed for any name in the set.
    const asyncSet = new Set();
    const via = opts.trace ? new Map() : null;
    let changed = true;
    while (changed) {
        changed = false;
        for (const [name, info] of fnInfo) {
            if (asyncSet.has(name)) continue;
            if (pruneNames.has(name)) continue;
            if (info.hitsSeed) {
                asyncSet.add(name);
                if (via) via.set(name, SEED_SENTINEL);
                changed = true;
                continue;
            }
            for (const callee of info.directCallees) {
                if (asyncSet.has(callee)) {
                    asyncSet.add(name);
                    if (via) via.set(name, callee);
                    changed = true;
                    break;
                }
            }
        }
    }
    if (via) asyncSet.via = via;
    return asyncSet;
}

export const SEED_SENTINEL = '<seed:win_nhgetch>';

// For a name in the closure, return the shortest path back to the
// seed (as an array of names ending in SEED_SENTINEL).  Requires
// asyncSet to have been built with opts.trace=true.
export function tracePath(asyncSet, name) {
    if (!asyncSet.via) throw new Error('asyncSet was not built with trace=true');
    const path = [name];
    let cur = name;
    while (cur && cur !== SEED_SENTINEL) {
        const next = asyncSet.via.get(cur);
        if (next === undefined) break;
        path.push(next);
        cur = next;
    }
    return path;
}

function stripCasts(n) {
    // Also peel UnaryOperator(*) so the macro form
    // `(*windowprocs.win_nhgetch)()` (NetHack's `nhgetch` macro
    // expansion) and the bare `windowprocs.win_nhgetch()` form
    // both resolve to the same MemberExpr.
    while (n && (n.kind === 'ImplicitCastExpr' || n.kind === 'ParenExpr'
        || n.kind === 'CStyleCastExpr'
        || (n.kind === 'UnaryOperator' && n.opcode === '*'))) {
        n = n.inner?.[0];
    }
    return n;
}

function scanCalls(node, info, seedMembers = SEED_INDIRECT_MEMBERS) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'CallExpr') {
        const callee = stripCasts(node.inner?.[0]);
        if (callee?.kind === 'DeclRefExpr') {
            const name = callee.referencedDecl?.name;
            if (name) {
                info.directCallees.add(name);
                if (SEED_INDIRECT_GLOBALS.has(name)) info.hitsSeed = true;
            }
        } else if (callee?.kind === 'MemberExpr'
            && seedMembers.has(callee.name)) {
            info.hitsSeed = true;
        }
        // fall through — args may contain nested CallExprs
    }
    for (const c of node.inner || []) scanCalls(c, info, seedMembers);
}
