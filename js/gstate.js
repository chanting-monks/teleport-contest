// gstate.js — Global game state reference.
// All game modules import `game` from here.
//
// During the Phase 4 transport build, decl.c's bucket-flatten hasn't
// been wired up yet, so sub-structs like `game.dungeon_topology` are
// still uninitialized when other modules' file-level initializers run
// (e.g., dungeon.js's `level_map` table reads
// `game.dungeon_topology.d_air_level`).  Make `game` a Proxy that
// lazily creates missing sub-object slots on read so module-load
// succeeds; the slots stay live and writable, matching C's
// default-zeroed static storage.  When decl.c is fully translated and
// initializes these fields explicitly, the auto-creation becomes a
// no-op (the slot already exists).

function makeGameProxy() {
    const target = {};
    return new Proxy(target, {
        get(t, prop) {
            if (prop in t) return t[prop];
            // Bail for symbols / JS-internal hooks so we don't
            // accidentally auto-create things like Symbol.iterator or
            // the `then` slot import-resolution probes.
            if (typeof prop === 'symbol') return undefined;
            if (prop === 'then' || prop === 'toJSON') return undefined;
            // Lazily create a sub-object so chained reads
            // (game.dungeon_topology.d_air_level) don't throw.
            const slot = {};
            t[prop] = slot;
            return slot;
        },
    });
}

export let game = makeGameProxy();

// resetGame() snapshot: captured on first call, restored on every
// subsequent call.  ES modules' top-level code (e.g. translated
// decl.js's `game.u = { ... full struct ... }`, objects.js's
// `game.obj_descr_init = [...]`, monst.js's `game.mons_init = [...]`)
// runs exactly once when those modules are imported — replacing the
// game Proxy or naively wiping its keys loses that initialization
// permanently.  Snapshotting captures the full module-load state
// (data tables + initial struct shapes for u, flags, iflags,
// context, etc.) so each segment starts from the same well-defined
// post-import state, mirroring C's "static structs reset by
// memset" semantics across game starts.
let _initialSnapshot = null;

// Deep-clone a Proxy-readable value into plain JS.  Goes through
// own-enumerable keys (matching JSON.stringify) so we don't trigger
// the auto-create branch for keys that haven't been written.
//
// **Identity-preserving**: a memo Map tracks objects already cloned;
// re-encountering the same object returns the same clone.  This is
// essential because the translator emits cross-referenced structures
// (e.g. dungeon.js's `level_map[i].lev_spec` and
// `game.dungeon_topology.d_X_level` are the SAME object reference
// at module-load time).  A naive clone would create two separate
// objects, silently breaking `fixup_level_locations`'s
// `assign_level(lev_map->lev_spec, &x->dlevel)` writes — they would
// land on the level_map clone, not the live dungeon_topology slot.
function deepClone(v, memo) {
    if (v === null || typeof v !== 'object') return v;
    if (memo.has(v)) return memo.get(v);
    let out;
    if (Array.isArray(v)) {
        out = [];
        memo.set(v, out);
        for (let i = 0; i < v.length; i++) out[i] = deepClone(v[i], memo);
        return out;
    }
    out = {};
    memo.set(v, out);
    // Preserve accessor properties (getter/setter) so e.g. translated
    // `dungeon.js`'s `level_map[i].lev_spec` getter — which resolves
    // to game.dungeon_topology.d_X_level at read time — keeps its
    // dynamic binding through the snapshot/restore cycle.  Triggering
    // the getter at clone time would freeze the value to whatever
    // `game.dungeon_topology` happens to be at snapshot capture (the
    // module-load auto-Proxy ghost), making the post-restore getter
    // resolve to garbage.
    const descriptors = Object.getOwnPropertyDescriptors(v);
    for (const k of Object.keys(descriptors)) {
        const d = descriptors[k];
        if (d.get || d.set) {
            // Re-install the accessor on the clone (don't deepClone
            // — the getter function closes over `game` which is the
            // live module-level reference; cloning it would break
            // that binding).
            Object.defineProperty(out, k, d);
        } else {
            out[k] = deepClone(d.value, memo);
        }
    }
    return out;
}

export function resetGame() {
    if (_initialSnapshot === null) {
        // First reset: capture the post-module-load state.
        _initialSnapshot = deepClone(game, new Map());
    }
    for (const key of Object.keys(game)) delete game[key];
    Object.assign(game, deepClone(_initialSnapshot, new Map()));
    return game;
}

// `__nh_blackhole` — a single shared object that absorbs property
// reads and writes silently.  The translator re-binds a struct-
// pointer-typed local to this object after a C `ptr++`/`ptr--`
// expression so the customary follow-up `ptr->field = X` becomes
// a no-op rather than a NaN throw or a clobber of the just-
// initialized slot at the original index.
const _bh = {};
export const __nh_blackhole = new Proxy(_bh, {
    get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => 0;
        if (prop === 'valueOf') return () => 0;
        return __nh_blackhole;
    },
    set() { return true; },
});
// Also expose on globalThis so translated modules' free
// references resolve to it.
globalThis.__nh_blackhole = __nh_blackhole;
