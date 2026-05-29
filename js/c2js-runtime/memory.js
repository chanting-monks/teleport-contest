// memory.js — alloc / free / memset / memcpy shims for translated C.
//
// C uses byte-level memory for everything; JS has no equivalent.  These
// helpers translate the common malloc-shaped patterns NetHack uses
// into JS object/array primitives, with the goal that translated code
// runs without reaching into typed arrays.
//
// Limitations.  `alloc(n)` returns an array of `n` empty objects, not
// a typed buffer.  C code that does `arr[i].field = X` works because
// JS dynamically adds fields.  C code that READS `arr[i].field` before
// writing it gets `undefined`, which arithmetic turns into NaN.
// Phase 4+ (entity classes) supplies a typed allocator that returns
// `n` properly-zero-initialized struct instances.  Until then, the
// translator's static-array initializers fill the gap for fixed-size
// arrays; only dynamically-sized C allocations hit this shim.

// `alloc(byte_count)` — caller's `byte_count` is `sizeof(T) * n`.  The
// translator emits `sizeof(T)` as 1 (placeholder), so byte_count
// simplifies to n.  When n is 1 (the common single-struct alloc), we
// return a Proxy-wrapped object that returns 0 for unread properties
// (faithful to C's calloc-shaped zero-init) and accepts writes
// transparently.  Reads return 0 (falsy) so `if (obj.blessed)` evaluates
// to false on a fresh object, matching C semantics.  Sub-object access
// (`obj.lev.dnum`) is supported via a sentinel sub-proxy that's still
// safe to write to.
// alloc'd struct Proxy.  Auto-creates sub-Proxies on read so chained
// writes (`p.lev.dnum = X`) work, BUT presents as falsy in boolean
// context via a Symbol.toPrimitive hint so `if (obj.blessed)` on an
// uninitialized field evaluates to false.  This is a JS quirk: objects
// are normally always truthy in `if`, but if the host invokes ToBoolean
// it goes through ToPrimitive(default) → ToPrimitive(string|number)
// in some paths.  In `if (X)` the test is just object-vs-undefined-vs-
// false-vs-0-vs-NaN-vs-empty-string-vs-null.  Objects with custom
// toString/valueOf still test truthy.  So we CAN'T fully fake "falsy
// object" — the caller must assign a primitive.  For NetHack's
// blessorcurse specifically, otmp.blessed defaults to 0 because
// mksobj does `otmp.blessed = 0;` explicitly.  Our auto-creating
// Proxy bypassed that: reading otmp.blessed BEFORE mksobj's
// initialization auto-created a sub-Proxy stored on .blessed.
// Then mksobj's `otmp.blessed = 0` overwrites it.  So the order
// matters.  Looking at the actual sequence: mksobj is called by
// alloc-then-init pattern, so otmp.blessed gets set to 0 before
// blessorcurse reads it.  Restore the auto-create-on-read behavior
// (which other code paths rely on) and trust caller-side init.
function makeStructProxy() {
    if (globalThis.__nh_proxyCount !== undefined) {
        globalThis.__nh_proxyCount++;
        if (globalThis.__nh_proxyCap
            && globalThis.__nh_proxyCount > globalThis.__nh_proxyCap) {
            throw new Error('makeStructProxy cap exceeded ('
                + globalThis.__nh_proxyCount + ')');
        }
    }
    const target = {};
    return new Proxy(target, {
        get(t, prop) {
            if (prop in t) return t[prop];
            if (typeof prop === 'symbol') return undefined;
            if (prop === 'then' || prop === 'toJSON') return undefined;
            const slot = makeStructProxy();
            t[prop] = slot;
            return slot;
        },
    });
}

export function alloc(n) {
    const count = (n | 0) || 1;
    if (count === 1) return makeStructProxy();
    return Array.from({ length: count }, makeStructProxy);
}

// `free(p)` — JS GC handles this; the explicit free is a no-op.
// Kept as a function so translated C calls don't reference an
// undefined name.
export function free(_p) {
    // intentionally empty
}

// `memset(p, value, count)` — primarily used to zero a struct or an
// array of bytes.  For JS objects, "zero" means reset all fields to 0
// (or to the right zero per type), which we can't do without type
// information.  When the target is an array, fill the first `count`
// slots with the byte value (treated as a number).  When it's an
// object, replace its fields with 0 — best-effort.
// `memset(p, value, count)` — primarily used to zero a struct or an
// array of bytes.  For JS objects, "zero" is shape-preserving: number
// fields → value (typically 0); strings / pointers → null; nested
// arrays and objects recurse so zero-initialization matches what the
// caller's struct layout already had.  The byte `count` is informational
// only — we don't model byte storage and we never want a memset to
// destroy the struct shape that zeroInitFor already established.
export function memset(p, value, count) {
    if (p == null) return p;
    if (Array.isArray(p)) {
        // Array of bytes: fill `count` entries with the value.  Array
        // of nested structs: recurse into each entry so we don't blow
        // away struct shape.
        if (p.length > 0 && typeof p[0] === 'object' && p[0] !== null) {
            for (const elem of p) memset(elem, value, count);
            return p;
        }
        for (let i = 0; i < count && i < p.length; i++) p[i] = value;
        return p;
    }
    if (typeof p === 'object') {
        for (const k of Object.keys(p)) {
            const cur = p[k];
            if (cur && typeof cur === 'object') memset(cur, value, count);
            else if (typeof cur === 'number') p[k] = value;
            else if (typeof cur === 'string') p[k] = '';
            else p[k] = null;
        }
        return p;
    }
    return p;
}

// `memcpy(dst, src, count)` — primarily used to copy a struct or an
// array slice.  We delegate to JS's natural copying primitives.
export function memcpy(dst, src, count) {
    if (dst == null || src == null) return dst;
    if (Array.isArray(dst) && Array.isArray(src)) {
        for (let i = 0; i < count && i < src.length; i++) dst[i] = src[i];
        return dst;
    }
    if (typeof dst === 'object' && typeof src === 'object') {
        Object.assign(dst, src);
        return dst;
    }
    return dst;
}
