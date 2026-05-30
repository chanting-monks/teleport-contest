// roles.js — Engine-facing adapters over translator-output role data.
//
// C ref: role.c — roles[], races[], aligns[], genders[].
//
// The full role/race/align/gender tables are produced by the
// transpiler at js/translated/role.js (committed in step 126).
// This module re-exports them with two small adaptations for the
// engine's display path:
//   1. roles[].rank in C is an array of nine rank entries (one per
//      level threshold).  The engine's status line and ^X attributes
//      screen show only the level-1 rank, so we surface
//      `roles[i].rank` as the level-1 entry directly.  When the
//      moveloop+xp wiring lands, callers should switch to the full
//      array and pick by g.u.ulevel.
//   2. findRole/findRace/findAlign — small lookup helpers against
//      rc-options strings (case-insensitive, matching against the
//      table's name/adj/noun fields).
//
// Hand-rolled data was REMOVED in this step in favor of the
// translator output, per the project's "no hand-coded parallel
// data tables" rule.
import { roles as _roles, races as _races, aligns as _aligns, genders as _genders } from './translated/role.js';

// Re-export translator's roles[] verbatim — rank stays as the
// full per-level array (translator emits 9 rank entries per role).
// Engine display code that wants a single rank should index via
// `rank[level-1]` — that matches what translated max_rank_sz /
// rank_of() do and avoids reshaping the data twice.
export const roles = _roles;

export const races = _races;
export const aligns = _aligns;
export const genders = _genders;

// Find role by user-supplied name (case-insensitive, matching male
// or female form).  Used by allmain.js to set g.urole from rc options.
export function findRole(name) {
    if (!name) return null;
    const lc = String(name).toLowerCase();
    return roles.find(r =>
        (r.name?.m && r.name.m.toLowerCase() === lc) ||
        (r.name?.f && r.name.f.toLowerCase() === lc)
    ) || null;
}

export function findRace(name) {
    if (!name) return null;
    const lc = String(name).toLowerCase();
    return races.find(r =>
        (r.noun && r.noun.toLowerCase() === lc) ||
        (r.adj && r.adj.toLowerCase() === lc)
    ) || null;
}

export function findAlign(name) {
    if (!name) return null;
    const lc = String(name).toLowerCase();
    return aligns.find(a =>
        (a.adj && a.adj.toLowerCase() === lc) ||
        (a.noun && a.noun.toLowerCase() === lc)
    ) || null;
}
