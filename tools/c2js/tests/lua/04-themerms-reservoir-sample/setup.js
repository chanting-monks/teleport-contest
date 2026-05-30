// Mirror setup.lua for the transpiled JS side: define `themerooms`
// (3 entries) and `is_eligible` (always true) on globalThis so the
// module's `globalThis.X` references resolve.
globalThis.themerooms = [{}, {}, {}];
globalThis.is_eligible = () => true;
