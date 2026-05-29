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
