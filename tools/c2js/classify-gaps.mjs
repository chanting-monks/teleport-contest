// classify-gaps.mjs — survey pointer-mutation TODO markers in js/translated/.
//
// Reads every translated file, finds each `void 0 /* TODO Phase 5+:
// pointer-mutation lvalue (C: <expr>) */` marker, looks at the surrounding
// JS context, and bins each site by detected idiom.  The taxonomy doubles
// as the **Phase 5 work plan**: each bucket below has a `cPattern`,
// `jsForm`, `fix`, and `status` field describing what the C looks like,
// what the JS should look like, where the fix lives, and whether it's
// done.
//
// Output: histogram + per-bucket samples, plus a CSV listing of every
// site with file/line/function/loop-shape/C-expr.
//
// ## Phase 5 sequencing (cheapest-first within each tier)
//
// Sequence reordered after investigation revealed that
// `free-and-null` is NOT a standalone fix — every site in that
// bucket is a write-through-pointer (`**` out-param,
// global `char **`, or local pointer-to-pointer alias).  Eliding
// would lose the caller-visible null-write semantics.
// `free-and-null` becomes automatic once out-param boxing (#7) is
// in place; it is no longer a standalone POC.
//
// Tier 1 — translator predicates (no callsite changes, no idiom library):
//   1.  recursive-marker            — DONE     (50a0f57)
//   2.  single-ptr struct out-param — ON-DECK  (extends existing scalar
//                                     `.value` boxing to struct-pointer
//                                     types — function-side only, no
//                                     callsite change required)
//   3.  chained-assign split        — PLANNED  (split `*p = q = X` into
//                                     two statements before the marker
//                                     fires)
//   4.  pointer-var alias detect    — PLANNED  (recognize `T *p =
//                                     (T *)param` aliasing; emit
//                                     `param.value = X`)
//
// Tier 2 — bigger out-param + buffer-rep work:
//   5.  double-ptr out-param        — PLANNED  (biggest single payoff;
//                                     requires both function-side
//                                     `optr.value = X` AND callsite-side
//                                     `{value: var}` wrapping.  Once
//                                     in place, free-and-null is auto)
//   6.  null-terminator handling    — PLANNED  (NOT a no-op when buffer
//                                     is later read for length; needs
//                                     {buf, offset} representation
//                                     for `char *` pointer-into-buffer)
//   7.  post-increment-write        — PLANNED  (depends on #6 buffer rep)
//
// Tier 3 — idiom recognition (the new framework):
//   8.  string-walk transform       — PLANNED  (whole-loop replacement
//                                     with String.prototype methods;
//                                     toLowerCase, replace, etc.)
//   9.  filter-copy walk            — PLANNED  (two-pointer compaction
//                                     → split/filter/join)
//
// Tier 4 — long tail:
//   10. unrecovered / one-off       — leave as TODO until hot path.
//
// Note: `free-and-null` no longer has its own slot.  Its 8 markers
// resolve naturally as a side effect of #5 (when LHS is a `**` param)
// or #4 (when LHS is an aliased local).  Same for the global
// `char **` array case, which #5's mechanism handles.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const transDir = join(root, 'js/translated');
const cSrcDir = join(root, 'nethack-c/upstream/src');

const MARKER = /void 0 \/\* TODO Phase 5\+: pointer-mutation lvalue \(C: (.*?)\) \*\//;

// For each C source file, parse a name → {paramList, body} map so we can
// answer questions like "does this function take a T** parameter?" and
// "what was the actual lvalue name in *p = X?".  Fast-and-loose parser:
// finds top-level function definitions by signature regex.
function parseCFunctions(srcText) {
    // NetHack's house style puts the return type on its own line:
    //   staticfn void
    //   use_candle(struct obj **optr)
    //   {
    // So match `name(params)\n{` at column 0 — paren list may span
    // multiple lines.
    const fns = new Map();
    const sigRe = /^([a-zA-Z_]\w*)\s*\(([^)]*(?:\([^)]*\)[^)]*)*)\)\s*\n\s*\{/gm;
    let m;
    while ((m = sigRe.exec(srcText))) {
        const name = m[1];
        const params = m[2].replace(/\s+/g, ' ').trim();
        // Skip C keywords that look like calls.
        if (/^(if|for|while|switch|return|sizeof)$/.test(name)) continue;
        const bodyStart = srcText.indexOf('{', sigRe.lastIndex - 1);
        let depth = 1, i = bodyStart + 1;
        while (i < srcText.length && depth > 0) {
            if (srcText[i] === '{') depth++;
            else if (srcText[i] === '}') depth--;
            i++;
        }
        const body = srcText.slice(bodyStart, i);
        fns.set(name, { params, body });
    }
    return fns;
}

const cFns = new Map(); // file (.js basename) → fn name → { params, body }
for (const f of readdirSync(cSrcDir).filter((x) => x.endsWith('.c'))) {
    try {
        const text = readFileSync(join(cSrcDir, f), 'utf8');
        cFns.set(f.replace(/\.c$/, '.js'), parseCFunctions(text));
    } catch { /* skip */ }
}

function paramHasDoublePointer(paramList) {
    return /\*\s*\*/.test(paramList);
}

function doublePointerParamNames(paramList) {
    // Best-effort: extract names of `T ** name` style params.
    const names = [];
    for (const part of paramList.split(',')) {
        const m = part.match(/\*\s*\*\s*([a-zA-Z_]\w*)/);
        if (m) names.push(m[1]);
    }
    return names;
}

function findCLvalue(cBody, rhsHint) {
    // Look in the C body for a line `*VARNAME = RHS;` whose RHS roughly
    // matches the hint.  Returns the most likely VARNAME or null.
    if (!cBody) return null;
    const safeRhs = rhsHint.replace(/\bnull\b/g, '0');
    const lines = cBody.split('\n');
    for (const line of lines) {
        const m = line.match(/\*\s*([a-zA-Z_]\w*)\s*=\s*(.+?);/);
        if (!m) continue;
        const lhs = m[1], rhs = m[2].trim();
        // Loose match: hint is a prefix or contains key tokens.
        if (rhs === '0' && (safeRhs === '0' || safeRhs === 'null')) return lhs;
        if (rhs.startsWith('(struct') && /\)\s*0$/.test(rhs) && safeRhs === '0') return lhs;
        if (safeRhs.length >= 3 && rhs.includes(safeRhs.slice(0, 8))) return lhs;
    }
    return null;
}

// Idiom buckets — ordered by classifier priority (most-specific first).
// Each entry has both a `match` predicate AND plan fields (`sequence`,
// `status`, `cPattern`, `jsForm`, `fix`) so this taxonomy doubles as
// the durable Phase 5 work plan.
const BUCKETS = [
    {
        name: 'recursive-marker',
        sequence: 1,
        status: 'DONE (50a0f57)',
        cPattern: 'onoff[0] = *p = *(p+1) = "\\0"  — chained assignment '
            + 'where the RHS is itself a marker.',
        jsForm: 'Single `chained pointer-mutation lvalue` marker; do '
            + 'not nest captured RHS inside outer marker text.',
        fix: 'translate.mjs binaryOp(): if rJs starts with '
            + '`void 0 /* TODO Phase 5+: (chained )?pointer-mutation`, '
            + 'collapse to a single chained-form marker.',
        match: (s) => /TODO Phase 5/.test(s.cExpr),
    },
    {
        name: 'double-ptr-out-param',
        sequence: 5,
        status: 'DONE  (47 markers eliminated; body-scan filtered out read-only T**)',
        cPattern: 'Function signature f(struct T **optr); body has '
            + '*optr = X to write through the caller\'s reference.',
        jsForm: 'Function: `optr.value = X`.  Callsite: wrap argument '
            + 'as `{value: var}` (or get/set proxy) and re-extract '
            + 'after the call.',
        fix: 'translate.mjs: extend `isScalarPtrParamRef` to recognize '
            + '`T **` parameters; emit `.value` access in unaryOp/binaryOp; '
            + 'in callExpr wrap matching `&var` arguments at the callsite. '
            + 'Requires both function-side AND callsite-side changes — '
            + 'multi-day investment.',
        match: (s) => s.cLvalue && s.fnDoubleParams.includes(s.cLvalue),
    },
    {
        name: 'string-walk-transform',
        sequence: 8,
        status: 'PARTIAL — 17 hacklib fns recognized + in-loop highc/lowc; 19 residual',
        cPattern: 'for (p = s; *p; p++) { ... *p = transform(*p) ... } '
            + '— single-pointer walk over a char buffer applying a '
            + 'character-wise transform.  Common transforms: highc, '
            + 'lowc, ASCII space (32) for normalization.',
        jsForm: 'Whole loop replaced with a String method: '
            + 's.toLowerCase(), s.toUpperCase(), '
            + 's.replace(/.../g, c => transform(c)).',
        fix: 'New idiom-recognition pass running BEFORE per-statement '
            + 'emission.  Pattern-match the whole for-loop AST against '
            + 'a small library (~5 patterns).  Each pattern needs a '
            + 'test corpus proving equivalence with the C loop on all '
            + 'relevant inputs.  Proposed dir: tools/c2js/idioms/.',
        match: (s) =>
            (s.enclosingLoop &&
             /\bfor\b/.test(s.enclosingLoop) &&
             /\b(\w+)\s*=\s*(\w+)\s*;\s*[*(]?\1[*)]?\s*;\s*\1\+\+/.test(s.enclosingLoop)) ||
            /\b(highc|lowc|tolower|toupper)\s*\(/.test(s.cExpr) ||
            /^\*\w+ ?= ?32$/.test(s.cExpr),  // assigning ' ' (whitespace normalize)
    },
    {
        name: 'chained-assign',
        sequence: 3,
        status: 'DONE  (comma-expr split; 5 residual classify into other buckets)',
        cPattern: '*p = obj = NULL  — chain that mutates two distinct '
            + 'lvalues in one expression.  Distinct from recursive-marker '
            + 'because the inner LHS is NOT a pointer-mutation, just a '
            + 'plain reassignment.',
        jsForm: 'Split into two statements: `obj = null; <write-through-p>;`',
        fix: 'translate.mjs binaryOp(): when LHS is pointer-mutation '
            + 'AND RHS is itself an assignment, split — emit the inner '
            + 'assignment first as its own statement, then handle the '
            + 'outer separately.  Statement-level rewrite (current '
            + 'walker emits expressions only).',
        match: (s) => /=.*=/.test(s.cExpr),
    },
    {
        name: 'filter-copy',
        sequence: 9,
        status: 'PLANNED — second idiom-recognition pattern',
        cPattern: 'for (p2 = p1 = s; *p1; p1++) if (cond) *p2++ = *p1; '
            + '— two-pointer compaction.  p2 lags as the write head, '
            + 'skipping characters that don\'t match cond.',
        jsForm: 's.split("").filter(c => cond(c)).join("")  or  '
            + 's.replace(/<chars-to-strip>/g, "")  if cond is '
            + 'expressible as a regex.',
        fix: 'Second pattern in the idiom-recognition library '
            + '(sequence 8).  Match for-loop with double-pointer init '
            + 'p2 = p1 = X, body with *p2++ = *p1 conditional write.',
        match: (s) =>
            s.enclosingLoop &&
            /\b(\w+)\s*=\s*(\w+)\s*=\s*\w+/.test(s.enclosingLoop),
    },
    {
        name: 'free-and-null',
        sequence: null,
        status: 'AUTO  (mostly resolved by #5; 3 residual non-`**` cases)',
        cPattern: '*p = NULL immediately after free(p) or NetHack '
            + 'equivalent (useup, dealloc_obj, obfree, obj_extract_self). '
            + 'Investigation: every site in this bucket is a real '
            + 'write-through-pointer — either a `**` out-param '
            + '(`use_bell`, `unsortloot`, `mapfrag_free`), a global '
            + '`char **` array element (`*game.fgp[j]`), or a local '
            + 'pointer-to-pointer alias.  Eliding standalone would '
            + 'lose the caller-visible null-write.',
        jsForm: 'Once out-param boxing (#5) is in place: '
            + '`optr.value = null` works automatically — both for '
            + '`**` params and for global-array `**` patterns via the '
            + 'same `.value` mechanism.',
        fix: 'No standalone fix.  This bucket exists in the classifier '
            + 'to confirm zero remaining sites once #5 lands; if any '
            + 'remain, investigate per-site.',
        match: (s) =>
            /\b(null|0)\b/.test(s.cExpr) &&
            /\b(free|useup|dealloc_obj|obfree|obj_extract_self)\s*\(/.test(s.prevLine + s.surroundingText),
    },
    {
        name: 'null-terminator',
        sequence: 6,
        status: 'PARTIAL — char[N] reset + 3-stmt string-copy DONE; ~110 residual',
        cPattern: '*p = 0 after a forward loop.  Could be (a) C-string '
            + 'NUL terminator, no-op in JS; OR (b) string truncation '
            + 'where p points mid-buffer (e.g. attrib.js:675 *p = 0 to '
            + 'truncate buf at " of strangulation").',
        jsForm: 'Case (a): elide.  Case (b): buf = buf.slice(0, '
            + 'p_offset) — requires tracking p as {buf, offset} '
            + 'instead of a raw string slice.',
        fix: 'translate.mjs needs `char *` pointer-into-buffer '
            + 'representation: instead of treating strstri(buf, ...) '
            + 'as returning a substring, return {buf, offset} so '
            + 'pointer arithmetic and write-through are well-defined. '
            + 'This is the buffer-management refactor we deferred at '
            + 'step 144 (buildInventoryFromState).',
        match: (s) =>
            /^\*\w+ ?= ?(0|'\\0')$/.test(s.cExpr) &&
            !s.enclosingLoop,
    },
    {
        name: 'post-increment-write',
        sequence: 7,
        status: 'PLANNED — depends on null-terminator buffer rep',
        cPattern: '*p++ = X — write head advancing through a buffer. '
            + 'Common in sprintf-like code, copy loops.',
        jsForm: 'With buffer rep (sequence 3): p.buf[p.offset++] = X. '
            + 'For string-build patterns: convert whole loop to '
            + '`buf += chunk` accumulation.',
        fix: 'Same buffer-management representation as null-terminator. '
            + 'Emit index-based write through the buffer object.',
        match: (s) => /\*\w+\+\+ ?=/.test(s.cExpr),
    },
    {
        name: 'pointer-var-reassign',
        sequence: 4,
        status: 'PARTIAL — struct-ptr local subset DONE; 16 residual mixed patterns',
        cPattern: 'Several distinct sub-patterns: (a) struct-ptr local '
            + 'variables (`struct T *new = alloc(...); *new = *src;`) '
            + '— DONE via collectStructPtrLocals.  (b) char-** writes '
            + '(`*p = dupstr(...)`) — needs char-** boxing.  (c) '
            + 'casted-alias of scalar param (wantdoor: '
            + '`int *p = (int *) genericptr;`) — needs cross-TU body '
            + 'scan.  (d) pointer arithmetic (`*p = (p+1)`, `*p = p++`) '
            + '— overlaps with string-walk idiom rec.',
        jsForm: '(a) Object.assign(p, X)  (DONE).  (b) p.value = X '
            + 'after extending boxing to `char **`.  (c) widen scalar-ptr '
            + 'param set via body scan, alias detection.  (d) handled '
            + 'by string-walk idiom recognition (#8).',
        fix: 'Sub-pattern (a) DONE: collectStructPtrLocals walks body, '
            + 'adds `struct T *` locals to structPtrParamNames; existing '
            + '#2 mechanism emits Object.assign.  Remaining sub-patterns '
            + 'each need targeted work.',
        match: (s) =>
            s.cLvalue &&
            !s.fnDoubleParams.includes(s.cLvalue) &&
            !s.fnSingleParams.includes(s.cLvalue),
    },
    {
        name: 'single-ptr-out-param',
        sequence: 2,
        status: 'DONE  (struct-pointer cases handled; 2 residual; pending commit)',
        cPattern: '*p = X where p is a `T *` parameter.  Translator '
            + 'already handles scalar `T` via isScalarPtrParamRef. '
            + 'This bucket is the struct-typed cases not yet covered.',
        jsForm: 'p.value = X (function-side); callsite wrapping as in '
            + 'double-ptr.',
        fix: 'translate.mjs: extend isScalarPtrParamRef to also accept '
            + 'struct-typed pointers (`struct T *`).  Reuses the '
            + 'existing .value mechanism — function-side only, no '
            + 'callsite changes required since callsites already pass '
            + 'address-of struct values.',
        match: (s) =>
            s.cLvalue && s.fnSingleParams.includes(s.cLvalue),
    },
    {
        name: 'unrecovered-lvalue',
        sequence: 11,
        status: 'LONG-TAIL — manual triage when sites hit hot paths',
        cPattern: 'Various: linked-list head reassignment '
            + '(*p = (*p)->next), 2D array writes, swap idioms, '
            + 'one-off function-specific patterns.',
        jsForm: 'Per-site, depending on idiom recovered.',
        fix: 'No general fix.  Improve findCLvalue recovery in this '
            + 'classifier to push more sites into the structured '
            + 'buckets above; what remains is genuinely one-off.',
        match: () => true,
    },
];

function findEnclosingLoop(lines, idx) {
    // Walk backward up to 80 lines for a `for (...)` or `while (...)`
    // whose body brace contains idx.  Cheap heuristic: scan back for the
    // most recent `for (` or `while (` at a brace depth that bounds idx.
    let depth = 0;
    for (let i = idx - 1; i >= Math.max(0, idx - 80); i--) {
        const line = lines[i];
        // Track braces from the marker site backward.
        depth += (line.match(/\}/g) || []).length;
        depth -= (line.match(/\{/g) || []).length;
        if (depth < 0) {
            // The opening brace at line i contains our site.
            const m = line.match(/^\s*(for|while)\s*\([^)]*\)/);
            if (m) return m[0];
            depth = 0;
        }
    }
    return null;
}

function findEnclosingFunction(lines, idx) {
    for (let i = idx - 1; i >= 0; i--) {
        const m = lines[i].match(/^export function (\w+)\s*\(([^)]*)\)/);
        if (m) return { name: m[1], params: m[2].split(',').map((p) => p.trim()).filter(Boolean) };
    }
    return { name: '<top>', params: [] };
}

function classify(file, lines, idx) {
    const line = lines[idx];
    const m = line.match(MARKER);
    if (!m) return null;
    const cExpr = m[1];
    const prevLine = lines[idx - 1] || '';
    const nextLine = lines[idx + 1] || '';
    const enclosingLoop = findEnclosingLoop(lines, idx);
    const fn = findEnclosingFunction(lines, idx);
    const surroundingText = lines.slice(Math.max(0, idx - 5), idx + 3).join('\n');
    // Recover C lvalue + param info via cross-reference.
    const cFile = cFns.get(file);
    const cFn = cFile?.get(fn.name);
    let cLvalue = null;
    let fnDoubleParams = [];
    let fnSingleParams = [];
    if (cFn) {
        // cExpr looks like "*p = RHS"; pass just RHS to the recovery.
        const rhsHint = cExpr.replace(/^\*\w*\s*=\s*/, '').trim();
        cLvalue = findCLvalue(cFn.body, rhsHint);
        fnDoubleParams = doublePointerParamNames(cFn.params);
        // Single-* param names: "T * name" or "T *name".
        for (const part of cFn.params.split(',')) {
            const m2 = part.match(/(?<!\*)\*\s*([a-zA-Z_]\w*)/);
            if (m2 && !/\*\s*\*/.test(part)) fnSingleParams.push(m2[1]);
        }
    }
    const ctx = {
        cExpr, prevLine, nextLine, enclosingLoop,
        surroundingText,
        cLvalue, fnDoubleParams, fnSingleParams,
    };
    for (const b of BUCKETS) {
        if (b.match(ctx)) {
            return {
                file, line: idx + 1, fn: fn.name, bucket: b.name,
                cExpr, cLvalue, enclosingLoop,
            };
        }
    }
    return null;
}

const files = readdirSync(transDir).filter((f) => f.endsWith('.js')).sort();
const sites = [];
for (const f of files) {
    const text = readFileSync(join(transDir, f), 'utf8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (!MARKER.test(lines[i])) continue;
        const c = classify(f, lines, i);
        if (c) sites.push(c);
    }
}

// Histogram
const hist = {};
for (const s of sites) hist[s.bucket] = (hist[s.bucket] || 0) + 1;
const total = sites.length;

const bucketByName = Object.fromEntries(BUCKETS.map((b) => [b.name, b]));

console.log(`\n## Pointer-mutation lvalue TODO markers: ${total} total\n`);
const sorted = Object.entries(hist).sort((a, b) => b[1] - a[1]);
const maxNameLen = Math.max(...sorted.map(([n]) => n.length));
for (const [name, n] of sorted) {
    const pct = ((n / total) * 100).toFixed(1).padStart(5);
    const bar = '█'.repeat(Math.round((n / total) * 40));
    const b = bucketByName[name];
    const seq = b?.sequence != null ? `[#${String(b.sequence).padStart(2)}]` : '     ';
    const stat = b?.status ? ` ${b.status}` : '';
    console.log(`  ${seq} ${name.padEnd(maxNameLen)}  ${String(n).padStart(4)}  ${pct}%  ${bar}${stat}`);
}

// Plan view: list buckets in sequence order, with the per-bucket plan
// fields.  Run with no flag = brief (just status); --plan = full detail.
const wantsPlan = process.argv.includes('--plan');
console.log('\n## Phase 5 work plan (sequence order)\n');
const planOrder = [...BUCKETS].sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99));
for (const b of planOrder) {
    const n = hist[b.name] || 0;
    const tag = b.sequence != null ? `#${b.sequence}` : 'auto';
    console.log(`${tag}  ${b.name}  (${n} markers)  ${b.status}`);
    if (wantsPlan) {
        console.log(`     C:   ${b.cPattern || '(none)'}`);
        console.log(`     JS:  ${b.jsForm || '(none)'}`);
        console.log(`     fix: ${b.fix || '(none)'}`);
        console.log();
    }
}
if (!wantsPlan) console.log('\n  (run with --plan for cPattern/jsForm/fix per bucket)');

console.log('\n## Samples (3 per bucket)\n');
for (const [name] of sorted) {
    const samples = sites.filter((s) => s.bucket === name).slice(0, 3);
    console.log(`### ${name} (${hist[name]})`);
    for (const s of samples) {
        const loop = s.enclosingLoop ? ` in ${s.enclosingLoop.trim()}` : ' (no loop)';
        console.log(`  ${s.file}:${s.line}  ${s.fn}()${loop}`);
        console.log(`    C: ${s.cExpr}`);
    }
    console.log();
}

// Per-file totals (top 10 most-affected files)
const fileHist = {};
for (const s of sites) fileHist[s.file] = (fileHist[s.file] || 0) + 1;
const topFiles = Object.entries(fileHist).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log('## Top-10 affected files\n');
for (const [f, n] of topFiles) console.log(`  ${String(n).padStart(4)}  ${f}`);
console.log();

// CSV dump for downstream analysis
const csvPath = join(root, '.cache/c2js/gap-classification.csv');
const csv = ['file,line,function,bucket,c_expr,enclosing_loop'];
for (const s of sites) {
    const safe = (x) => '"' + String(x ?? '').replace(/"/g, '""') + '"';
    csv.push([s.file, s.line, s.fn, s.bucket, safe(s.cExpr), safe(s.enclosingLoop || '')].join(','));
}
try {
    writeFileSync(csvPath, csv.join('\n') + '\n');
    console.log(`CSV: ${csvPath}`);
} catch (e) {
    console.log(`(skipping CSV: ${e.message})`);
}
