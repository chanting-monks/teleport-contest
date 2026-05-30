#!/usr/bin/env node
// compare-traces.mjs — diff C-side and JS-side interleaved PRNG + trace logs
// captured per docs/INSTRUMENTATION.md.
//
// Both inputs are JSON arrays of strings (or session.json files whose
// segments[*].steps[*].rng get flattened).  Each entry is either a
// PRNG call ("rn2(N)=R @ caller(file:line)") or a trace marker
// (">funcname @ file:line" / "<funcname …" / "^name k=v" / "=name k=v"
// / "?tag …" / "!impossible …").
//
// Comparison mode:
//   Default — strict PRNG diff (the contest scorer's lens), with
//             trace markers shown as context around the divergence.
//   --traces — diff the FULL stream including trace markers (helpful
//             when C and JS have matching working-set instrumentation).
//
// Usage:
//   node tools/c2js/compare-traces.mjs <c-trace> <js-trace> [--traces] [--context=N]
//
// Output: first divergence with context, or summary if all match.

import { readFileSync, existsSync } from 'node:fs';

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = { traces: false, context: 15 };
    const positional = [];
    for (const a of args) {
        if (a === '--traces') opts.traces = true;
        else if (a.startsWith('--context=')) opts.context = parseInt(a.slice(10));
        else if (a.startsWith('--')) { console.error('unknown flag:', a); process.exit(1); }
        else positional.push(a);
    }
    if (positional.length !== 2) {
        console.error('usage: compare-traces.mjs <c-trace> <js-trace> [--traces] [--context=N]');
        process.exit(1);
    }
    return { c: positional[0], js: positional[1], opts };
}

const PRNG_RE = /^(?:rn2|rnd|rn1|rnl|rne|rnz|d)\(/;

function loadAsArray(path) {
    if (!existsSync(path)) { console.error('not found:', path); process.exit(1); }
    const text = readFileSync(path, 'utf8');
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data.segments) {
        const out = [];
        for (const seg of data.segments) {
            for (const step of (seg.steps || [])) {
                for (const r of (step.rng || [])) out.push(r);
            }
        }
        return out;
    }
    console.error('unrecognized trace shape in', path);
    process.exit(1);
}

// Normalize for comparison:
//   - strip @ file:line annotations (translator emits its own lines)
//   - keep the rn2(N) / ">funcname" identity
function normalize(entry) {
    return entry
        .replace(/\s*@\s.*$/, '')   // strip caller annotation tail
        .replace(/=\s*0x[0-9a-f]+\s*$/i, '');  // pointer-return values vary
}

function isPrng(entry) { return PRNG_RE.test(entry); }
function isTrace(entry) { return !isPrng(entry); }

function findFirstPrngDiv(cAll, jsAll) {
    // Strip trace markers and compare PRNG arrays positionally
    // (matching the contest scorer's lens).  Return the indexes in
    // the FULL arrays where the diverging PRNG entry lives.
    const cIdx = [];
    const jsIdx = [];
    for (let i = 0; i < cAll.length; i++) if (isPrng(cAll[i])) cIdx.push(i);
    for (let i = 0; i < jsAll.length; i++) if (isPrng(jsAll[i])) jsIdx.push(i);
    const limit = Math.min(cIdx.length, jsIdx.length);
    for (let i = 0; i < limit; i++) {
        const cv = normalize(cAll[cIdx[i]]);
        const jv = normalize(jsAll[jsIdx[i]]);
        if (cv !== jv) {
            return { prngIdx: i, cIdx: cIdx[i], jsIdx: jsIdx[i] };
        }
    }
    return null;
}

function showContext(arr, idx, ctx, label) {
    const lo = Math.max(0, idx - ctx);
    const hi = Math.min(arr.length, idx + ctx + 1);
    console.log(`\n${label} context [${lo}..${hi - 1}]:`);
    for (let i = lo; i < hi; i++) {
        const mark = (i === idx) ? '* ' : '  ';
        console.log(`${mark}[${i}] ${normalize(arr[i] || '')}`);
    }
}

function main() {
    const { c, js, opts } = parseArgs();
    const cAll = loadAsArray(c);
    const jsAll = loadAsArray(js);

    const cPrng = cAll.filter(isPrng).length;
    const jsPrng = jsAll.filter(isPrng).length;
    const cTrace = cAll.length - cPrng;
    const jsTrace = jsAll.length - jsPrng;
    console.log(`C  log: ${cAll.length} lines (PRNG ${cPrng}, Trace ${cTrace})`);
    console.log(`JS log: ${jsAll.length} lines (PRNG ${jsPrng}, Trace ${jsTrace})`);

    if (opts.traces) {
        // Strict full-stream diff including trace markers.
        const limit = Math.min(cAll.length, jsAll.length);
        let firstDiv = -1;
        for (let i = 0; i < limit; i++) {
            if (normalize(cAll[i]) !== normalize(jsAll[i])) { firstDiv = i; break; }
        }
        if (firstDiv < 0 && cAll.length === jsAll.length) {
            console.log('\nFULL MATCH (including trace markers)');
            return;
        }
        if (firstDiv < 0) {
            console.log(`\nShared prefix matches; one side has ${Math.abs(cAll.length - jsAll.length)} extra trailing lines.`);
            return;
        }
        console.log(`\nFirst full-stream divergence at index ${firstDiv}:`);
        const lo = Math.max(0, firstDiv - opts.context);
        const hi = Math.min(limit, firstDiv + opts.context + 1);
        for (let i = lo; i < hi; i++) {
            const cv = normalize(cAll[i] || '');
            const jv = normalize(jsAll[i] || '');
            const mark = (cv === jv) ? '  ' : (i === firstDiv ? '* ' : 'x ');
            console.log(`${mark}[${i}] C: ${cv.padEnd(58)} | JS: ${jv}`);
        }
        return;
    }

    // PRNG-only diff (default), with trace context around the divergence.
    const div = findFirstPrngDiv(cAll, jsAll);
    if (!div) {
        console.log(`\nPRNG MATCH (${Math.min(cPrng, jsPrng)} positions agree)`);
        if (cPrng !== jsPrng) console.log(`  but JS log is ${jsPrng < cPrng ? 'shorter' : 'longer'} by ${Math.abs(cPrng - jsPrng)} PRNG calls`);
        return;
    }
    console.log(`\nFirst PRNG divergence at PRNG-index ${div.prngIdx}:`);
    console.log(`  C  PRNG: ${normalize(cAll[div.cIdx])}`);
    console.log(`  JS PRNG: ${normalize(jsAll[div.jsIdx])}`);
    showContext(cAll, div.cIdx, opts.context, 'C');
    showContext(jsAll, div.jsIdx, opts.context, 'JS');
}

main();
