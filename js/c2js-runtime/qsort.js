import { assertNotThenable, tripwireEnabled } from './tripwire.js';
// qsort.js — deterministic stable sort matching NetHack's contest-
// patched qsort.
//
// C ref: src/random.c (NetHack ports a deterministic qsort
// implementation as part of the deterministic-build patch set —
// see nethack-c/patches/002-deterministic-qsort.patch).
//
// Standard library qsort isn't required to be stable, and on different
// platforms the result of an "unstable" sort can differ even given
// the same input + comparator.  The contest's deterministic-qsort
// patch swaps in a known stable sort so every contestant's PRNG-
// driven post-sort iteration order matches.
//
// We provide a pure JS equivalent here: a merge sort, which is stable
// by construction.
//
// API.  C's `qsort(base, nmemb, size, compar)` mutates `base[0..nmemb)`
// in place.  In JS, `base` is just an array (size is irrelevant);
// `compar(a, b)` returns -/0/+ as in C.  We sort the array in place
// and return it.

export function qsort(base, nmemb, size, compar) {
    // Tripwire (UNWEDGE_PLAN Q4): a comparator can never await; an
    // async comparator's Promise coerces to NaN and silently corrupts
    // the sort order.  Wrap only when tripwires are enabled.
    if (tripwireEnabled) {
        const inner = compar;
        compar = (a, b) => assertNotThenable(inner(a, b),
            `qsort comparator ${inner.name || '(anon)'}`);
    }
    // size is byte-size in C; we ignore it (objects are first-class).
    void size;
    if (!Array.isArray(base)) return base;
    const len = (nmemb | 0) >= 0 ? Math.min(nmemb | 0, base.length) : base.length;
    if (len <= 1) return base;

    // Stable merge sort over base[0..len).  Slice out the prefix,
    // sort it, splice back.
    const prefix = base.slice(0, len);
    const sorted = mergeSort(prefix, compar);
    for (let i = 0; i < len; i++) base[i] = sorted[i];
    return base;
}

function mergeSort(arr, compar) {
    if (arr.length <= 1) return arr;
    const mid = arr.length >> 1;
    const left = mergeSort(arr.slice(0, mid), compar);
    const right = mergeSort(arr.slice(mid), compar);
    return merge(left, right, compar);
}

function merge(left, right, compar) {
    const out = new Array(left.length + right.length);
    let i = 0, j = 0, k = 0;
    while (i < left.length && j < right.length) {
        // <=0 keeps left first → stable
        out[k++] = (compar(left[i], right[j]) | 0) <= 0 ? left[i++] : right[j++];
    }
    while (i < left.length) out[k++] = left[i++];
    while (j < right.length) out[k++] = right[j++];
    return out;
}

// ── async twin (UNWEDGE_PLAN Q9 iteration 3) ────────────────────────
// In the all-async build, comparators that format object names sit in
// the pline closure cone and become async (sortloot's comparator was
// the first one the Q4 tripwire caught).  A comparator cannot await
// inside a sync sort — so the SORT awaits instead.  Identical
// algorithm and stability to qsort() above; each comparison result is
// awaited (await of a plain number is order-harmless, so a sync
// comparator through this path sorts identically).  The NH_EMIT_ASYNC
// pass rewrites translated `qsort(` call sites to `await qsort_async(`.
export async function qsort_async(base, nmemb, size, compar) {
    void size;
    if (!Array.isArray(base)) return base;
    const len = (nmemb | 0) >= 0 ? Math.min(nmemb | 0, base.length) : base.length;
    if (len <= 1) return base;
    const prefix = base.slice(0, len);
    const sorted = await mergeSortAsync(prefix, compar);
    for (let i = 0; i < len; i++) base[i] = sorted[i];
    return base;
}

async function mergeSortAsync(arr, compar) {
    if (arr.length <= 1) return arr;
    const mid = arr.length >> 1;
    const left = await mergeSortAsync(arr.slice(0, mid), compar);
    const right = await mergeSortAsync(arr.slice(mid), compar);
    const out = new Array(left.length + right.length);
    let i = 0, j = 0, k = 0;
    while (i < left.length && j < right.length) {
        // <=0 keeps left first → stable, matching merge() exactly
        out[k++] = ((await compar(left[i], right[j])) | 0) <= 0 ? left[i++] : right[j++];
    }
    while (i < left.length) out[k++] = left[i++];
    while (j < right.length) out[k++] = right[j++];
    return out;
}
