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

const SEED_INDIRECT_MEMBERS = new Set([
    'win_nhgetch',
]);

export function computeAsyncClosure(parsed, opts = {}) {
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
            scanCalls(body, info);
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

function scanCalls(node, info) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'CallExpr') {
        const callee = stripCasts(node.inner?.[0]);
        if (callee?.kind === 'DeclRefExpr') {
            const name = callee.referencedDecl?.name;
            if (name) info.directCallees.add(name);
        } else if (callee?.kind === 'MemberExpr'
            && SEED_INDIRECT_MEMBERS.has(callee.name)) {
            info.hitsSeed = true;
        }
        // fall through — args may contain nested CallExprs
    }
    for (const c of node.inner || []) scanCalls(c, info);
}
