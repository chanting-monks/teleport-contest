// nhcore-js.mjs — JS hand-port of dat/nhcore.lua.
//
// nhcore.lua is loaded once at game start.  It fires no PRNG —
// strictly data definitions + helper functions + callback table.
// Hand-porting it removes one of the four "complex" Lua files
// blocking fengari removal per project_nh_emit_async.md.
//
// Surface:
// - `nh_lua_variables` — save/restore table (preserved across save)
// - `get_variables_string()` — serialize nh_lua_variables to Lua string
// - `nh_callback_set/rm/run(cb, fn)` — generic callback registry
//   (currently no sessions exercise these; faithful no-op stub
//   is sufficient for parity)
// - `mk_dgl_extrainfo()` — dgamelaunch server log-file generator
//   (NEVER fires in headless contest runs; kept as no-op for parity)
// - `show_getpos_tip()` — text shown first time farlook is used
//   (cold path; faithful nh.text wrapper)
// - `nhcore` table — callback dispatch hooks the engine reads
//
// What's NOT mirrored:
// - The `_G[k](table.unpack{...})` dynamic-dispatch in
//   nh_callback_run.  No session reaches this path; faithful no-op.

import { tableStringify } from './nhlib-js.mjs';

// nh_lua_variables — saved/restored Lua-side table.  Headless
// contest sessions don't save, so this stays a JS-side object.
export const nh_lua_variables = {};

// C ref nhcore.lua:14-16.
export function get_variables_string() {
    return `nh_lua_variables=${tableStringify(nh_lua_variables)};`;
}

// C ref nhcore.lua:18-26.  Mirror Lua semantics — a value of `true`
// added under key `fn`.  Lua's `{[fn] = true}` translates to JS
// `obj[fn] = true`.  `fn` is a function-name string.
export function nh_callback_set(cb, fn) {
    const cbname = '_CB_' + cb;
    let bucket = nh_lua_variables[cbname];
    if (typeof bucket !== 'object' || bucket === null) {
        bucket = nh_lua_variables[cbname] = {};
    }
    bucket[fn] = true;
}

// C ref nhcore.lua:28-36.
export function nh_callback_rm(cb, fn) {
    const cbname = '_CB_' + cb;
    let bucket = nh_lua_variables[cbname];
    if (typeof bucket !== 'object' || bucket === null) {
        bucket = nh_lua_variables[cbname] = {};
    }
    delete bucket[fn];
}

// C ref nhcore.lua:38-53.  Iterate registered callbacks for `cb`
// and call each.  Returns false on the first one that returns
// falsy, else true.  No current session reaches this path —
// faithful no-op so saved games round-trip correctly.
export function nh_callback_run(cb, ...args) {
    const cbname = '_CB_' + cb;
    const bucket = nh_lua_variables[cbname];
    if (typeof bucket !== 'object' || bucket === null) {
        nh_lua_variables[cbname] = {};
        return true;
    }
    for (const fn of Object.keys(bucket)) {
        // Lua does `_G[k](table.unpack{...})` — dispatch by function
        // name.  Mirror via a JS-side dispatch table; for now no
        // callbacks are registered so this never fires.
        const dispatcher = globalThis.__nh_callback_dispatch?.[fn];
        if (typeof dispatcher === 'function' && !dispatcher(...args)) {
            return false;
        }
    }
    return true;
}

// mk_dgl_extrainfo — server log writer.  No-op in contest runs.
let prev_dgl_extrainfo = 0;
export function mk_dgl_extrainfo() {
    // C ref nhcore.lua:58-102.  Writes a status string to
    // /tmp/nethack.<name>.<dlvl>.log for dgamelaunch.  In headless
    // contest runs this would either fail to open (no filesystem
    // access via the contest harness) or write garbage; either way
    // it's purely a side-effect for public servers.  Kept as a
    // no-op for parity — sessions don't exercise this path.
    void prev_dgl_extrainfo;  // satisfy the linter for an unused var
}

// show_getpos_tip — text shown the first time getpos() is called.
// C ref nhcore.lua:105-115.
export function show_getpos_tip() {
    if (typeof globalThis.nh_text === 'function') {
        globalThis.nh_text(
            'Tip: Farlooking or selecting a map location\n\n' +
            'You are now in a "farlook" mode - the movement keys move the cursor,\n' +
            'not your character.  Game time does not advance.  This mode is used\n' +
            'to look around the map, or to select a location on it.\n\n' +
            'When in this mode, you can press ESC to return to normal game mode,\n' +
            'and pressing ? will show the key help.\n'
        );
    }
}

// nhcore callback table — the engine reads these by name on
// specific lifecycle events.  Resolved by name rather than direct
// reference so the lazy-defined tutorial helpers (declared in
// nhlib.lua but loaded later in the bootstrap order) wire up
// correctly without an import cycle.
//
// C ref nhcore.lua:122-143.  Only three fields are non-commented
// in the upstream source: getpos_tip, enter_tutorial, leave_tutorial.
export const nhcore = {
    getpos_tip: show_getpos_tip,
    // enter_tutorial / leave_tutorial reference functions defined
    // in nhlib.lua's tutorial section — those aren't yet
    // hand-ported.  Use a thin lookup so when they land on
    // globalThis they get picked up at call time.
    get enter_tutorial() { return globalThis.tutorial_enter; },
    get leave_tutorial() { return globalThis.tutorial_leave; },
};
