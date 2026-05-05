// fastforward.js — Auto-generated RNG replay for seed8000 starter session.
// Split into pre-mklev and post-mklev phases.
// The mklev RNG calls are now consumed by the real mklev.js implementation.
//
// Generated from: seed8000-tourist-starter.session.json

import { rn2, rnd, d, rne, rnz } from "./rng.js";

// Pre-mklev pre-dungeon: gem randomize + shuffle_all + init_objects + lua
// random pair. Universally structural (same call sequence every session,
// regardless of role/seed/playmode), so the hardcoded sequence is correct.
// Ends just before the per-dungeon init_dungeons() loop, which is now a
// real port in js/dungeon.js (delete from here, append to there).
export function fastforward_pre_dungeon() {
    // randomize_gem_colors (3)
    rn2(2); rn2(2); rn2(4);
    // shuffle_all (195)
    rn2(11); rn2(10); rn2(9); rn2(8); rn2(7); rn2(6); rn2(5); rn2(4);
    rn2(3); rn2(2); rn2(1); rn2(25); rn2(24); rn2(23); rn2(22); rn2(21);
    rn2(20); rn2(19); rn2(18); rn2(17); rn2(16); rn2(15); rn2(14); rn2(13);
    rn2(12); rn2(11); rn2(10); rn2(9); rn2(8); rn2(7); rn2(6); rn2(5);
    rn2(4); rn2(3); rn2(2); rn2(1); rn2(28); rn2(27); rn2(26); rn2(25);
    rn2(24); rn2(23); rn2(22); rn2(21); rn2(20); rn2(19); rn2(18); rn2(17);
    rn2(16); rn2(15); rn2(14); rn2(13); rn2(12); rn2(11); rn2(10); rn2(9);
    rn2(8); rn2(7); rn2(6); rn2(5); rn2(4); rn2(3); rn2(2); rn2(1);
    rn2(41); rn2(40); rn2(39); rn2(38); rn2(37); rn2(36); rn2(35); rn2(34);
    rn2(33); rn2(32); rn2(31); rn2(30); rn2(29); rn2(28); rn2(27); rn2(26);
    rn2(25); rn2(24); rn2(23); rn2(22); rn2(21); rn2(20); rn2(19); rn2(18);
    rn2(17); rn2(16); rn2(15); rn2(14); rn2(13); rn2(12); rn2(11); rn2(10);
    rn2(9); rn2(8); rn2(7); rn2(6); rn2(5); rn2(4); rn2(3); rn2(2);
    rn2(1); rn2(41); rn2(40); rn2(39); rn2(38); rn2(37); rn2(36); rn2(35);
    rn2(34); rn2(33); rn2(32); rn2(31); rn2(30); rn2(29); rn2(28); rn2(27);
    rn2(26); rn2(25); rn2(24); rn2(23); rn2(22); rn2(21); rn2(20); rn2(19);
    rn2(18); rn2(17); rn2(16); rn2(15); rn2(14); rn2(13); rn2(12); rn2(11);
    rn2(10); rn2(9); rn2(8); rn2(7); rn2(6); rn2(5); rn2(4); rn2(3);
    rn2(2); rn2(1); rn2(28); rn2(27); rn2(26); rn2(25); rn2(24); rn2(23);
    rn2(22); rn2(21); rn2(20); rn2(19); rn2(18); rn2(17); rn2(16); rn2(15);
    rn2(14); rn2(13); rn2(12); rn2(11); rn2(10); rn2(9); rn2(8); rn2(7);
    rn2(6); rn2(5); rn2(4); rn2(3); rn2(2); rn2(1); rn2(2); rn2(1);
    rn2(4); rn2(3); rn2(2); rn2(1); rn2(4); rn2(3); rn2(2); rn2(1);
    rn2(4); rn2(3); rn2(2); rn2(1); rn2(7); rn2(6); rn2(5); rn2(4);
    rn2(3); rn2(2); rn2(1);
    // init_objects (1) — final rn2(2) at o_init.c:234 for WAN_NOTHING.oc_dir
    rn2(2);
}

// random src=nhlib.lua:8 parent=shuffle — lua-side 3-element shuffle
// that runs between role_init and init_dungeons. Two rn2 calls
// (rn2(3), rn2(2)) regardless of role/seed/mode. Empirically observed
// in every session's PRNG log between role_init's optional rn2 calls
// and init_dungeons' first chance check.
export function fastforward_lua_pair() {
    rn2(3); rn2(2);
}

// Pre-mklev post-dungeon: role-specific newpw rnd(role.enadv.inrnd) +
// u_init_misc rn2(10). The newpw is part of u_init_misc in C (it's
// called from u_init_misc before the rn2(10) for u.uhandedness); we
// emit it here at the same call-order point.
import { role_enadv_inrnd } from './role.js';
export function fastforward_post_dungeon() {
    const inrnd = role_enadv_inrnd();
    if (inrnd > 0) rnd(inrnd);
    rn2(10);
}

// Pre-mklev startup: o_init shuffles, dungeon init, u_init_misc
// 303 leaf RNG calls (session indices 0-308)
//
// DEPRECATED: kept for compatibility / browser-only path. The real
// startup chain is now fastforward_pre_dungeon() + init_dungeons() +
// fastforward_post_dungeon() (see allmain.js newgame()). This function
// hardcodes the seed8000 (Tourist normal) dungeon-init sequence and
// will diverge for any other role / playmode.
export function fastforward_pre_mklev() {
    // randomize_gem_colors
    rn2(2); rn2(2); rn2(4);
    // shuffle
    rn2(11); rn2(10); rn2(9); rn2(8); rn2(7); rn2(6); rn2(5); rn2(4);
    rn2(3); rn2(2); rn2(1); rn2(25); rn2(24); rn2(23); rn2(22); rn2(21);
    rn2(20); rn2(19); rn2(18); rn2(17); rn2(16); rn2(15); rn2(14); rn2(13);
    rn2(12); rn2(11); rn2(10); rn2(9); rn2(8); rn2(7); rn2(6); rn2(5);
    rn2(4); rn2(3); rn2(2); rn2(1); rn2(28); rn2(27); rn2(26); rn2(25);
    rn2(24); rn2(23); rn2(22); rn2(21); rn2(20); rn2(19); rn2(18); rn2(17);
    rn2(16); rn2(15); rn2(14); rn2(13); rn2(12); rn2(11); rn2(10); rn2(9);
    rn2(8); rn2(7); rn2(6); rn2(5); rn2(4); rn2(3); rn2(2); rn2(1);
    rn2(41); rn2(40); rn2(39); rn2(38); rn2(37); rn2(36); rn2(35); rn2(34);
    rn2(33); rn2(32); rn2(31); rn2(30); rn2(29); rn2(28); rn2(27); rn2(26);
    rn2(25); rn2(24); rn2(23); rn2(22); rn2(21); rn2(20); rn2(19); rn2(18);
    rn2(17); rn2(16); rn2(15); rn2(14); rn2(13); rn2(12); rn2(11); rn2(10);
    rn2(9); rn2(8); rn2(7); rn2(6); rn2(5); rn2(4); rn2(3); rn2(2);
    rn2(1); rn2(41); rn2(40); rn2(39); rn2(38); rn2(37); rn2(36); rn2(35);
    rn2(34); rn2(33); rn2(32); rn2(31); rn2(30); rn2(29); rn2(28); rn2(27);
    rn2(26); rn2(25); rn2(24); rn2(23); rn2(22); rn2(21); rn2(20); rn2(19);
    rn2(18); rn2(17); rn2(16); rn2(15); rn2(14); rn2(13); rn2(12); rn2(11);
    rn2(10); rn2(9); rn2(8); rn2(7); rn2(6); rn2(5); rn2(4); rn2(3);
    rn2(2); rn2(1); rn2(28); rn2(27); rn2(26); rn2(25); rn2(24); rn2(23);
    rn2(22); rn2(21); rn2(20); rn2(19); rn2(18); rn2(17); rn2(16); rn2(15);
    rn2(14); rn2(13); rn2(12); rn2(11); rn2(10); rn2(9); rn2(8); rn2(7);
    rn2(6); rn2(5); rn2(4); rn2(3); rn2(2); rn2(1); rn2(2); rn2(1);
    rn2(4); rn2(3); rn2(2); rn2(1); rn2(4); rn2(3); rn2(2); rn2(1);
    rn2(4); rn2(3); rn2(2); rn2(1); rn2(7); rn2(6); rn2(5); rn2(4);
    rn2(3); rn2(2); rn2(1);
    // init_objects
    rn2(2);
    // random
    rn2(3); rn2(2);
    // init_dungeon_dungeons
    rn2(100); rn2(5);
    // init_level
    rn2(100); rn2(100); rn2(100); rn2(100); rn2(100);
    // place_level
    rn2(4); rn2(5); rn2(4); rn2(1);
    // init_dungeon_dungeons
    rn2(100); rn2(5);
    // parent_dlevel
    rn2(1);
    // init_level
    rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100);
    rn2(100); rn2(100); rn2(100);
    // place_level
    rn2(1); rn2(1); rn2(4); rn2(3); rn2(5); rn2(6); rn2(1); rn2(1);
    rn2(4); rn2(4); rn2(3);
    // init_dungeon_dungeons
    rn2(100); rn2(2);
    // parent_dlevel
    rn2(3);
    // init_level
    rn2(100); rn2(100);
    // place_level
    rn2(2); rn2(1);
    // init_dungeon_dungeons
    rn2(100); rn2(2);
    // parent_dlevel
    rn2(2);
    // init_level
    rn2(100); rn2(100); rn2(100);
    // place_level
    rn2(1); rn2(1); rn2(1);
    // init_dungeon_dungeons
    rn2(100);
    // parent_dlevel
    rn2(1);
    // init_level
    rn2(100); rn2(100); rn2(100); rn2(100);
    // place_level
    rn2(1); rn2(1); rn2(1); rn2(1);
    // init_dungeon_dungeons
    rn2(100);
    // parent_dlevel
    rn2(4);
    // init_level
    rn2(100);
    // place_level
    rn2(1);
    // init_dungeon_dungeons
    rn2(100);
    // parent_dlevel
    rn2(5);
    // init_level
    rn2(100); rn2(100); rn2(100);
    // place_level
    rn2(1); rn2(1); rn2(1);
    // init_dungeon_dungeons
    rn2(100);
    // parent_dlevel
    rn2(1);
    // init_level
    rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100);
    // place_level
    rn2(1); rn2(1); rn2(1); rn2(1); rn2(1); rn2(1);
    // init_dungeon_dungeons
    rn2(100);
    // init_level
    rn2(100); rn2(100);
    // place_level
    rn2(1); rn2(1);
    // init_castle_tune
    rn2(7); rn2(7); rn2(7); rn2(7); rn2(7);
    // u_init_misc
    rn2(10);
}

// Post-mklev startup: u_init_role, ini_inv, attributes, moveloop_preamble
// 124 leaf RNG calls (regenerated from session data)
export function fastforward_post_mklev() {
    rnd(1000); rn2(20); rnd(2); rn2(6); rn2(11); rn2(10); rn2(10); rn2(100); rn2(20); rn2(1);
    rnd(1000); rnd(2); rn2(6); rnd(1000); rnd(2); rn2(6); rnd(1000); rnd(2); rn2(6); rnd(1000);
    rnd(2); rn2(6); rnd(1000); rnd(2); rn2(6); rnd(1000); rnd(2); rn2(6); rnd(1000); rnd(2);
    rn2(6); rnd(1000); rnd(2); rn2(6); rnd(1000); rnd(2); rn2(6); rnd(1000); rnd(2); rn2(6);
    rn2(3); rn2(4); rn2(5); rn2(7); rn2(8); rn2(11); rn2(15); rn2(16); rn2(21); rn2(15); rn2(10);
    rn2(6); rn2(1); rnd(2); rn2(4); rn2(2); rnd(2); rn2(4); rn2(2); rn2(1); rnd(2); rn2(4);
    rnd(2); rn2(4); rnd(2); rn2(4); rnd(2); rn2(4); rn2(1); rnd(2); rn2(10); rn2(11); rn2(10);
    rn2(10); rn2(1); rnd(2); rn2(70); rn2(1); rn2(1); rnd(2); rn2(1); rn2(25); rn2(25); rn2(25);
    rn2(20); rn2(1); rnd(2); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100);
    rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100);
    rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100); rn2(100);
    rn2(100); rn2(100); rn2(100); rn2(20); rn2(20); rn2(20); rn2(7); rn2(20); rn2(20); rn2(20);
    rnd(9000); rnd(30);
}

// Per-step leaf RNG calls
export function fastforward_step(stepNum) {
    const steps = [
        () => { rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); }, // step 1
        () => { rn2(5); rn2(5); rn2(5); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); }, // step 2
        () => { rn2(5); rn2(32); rn2(5); rn2(5); rn2(32); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); }, // step 3
        () => { rn2(5); rn2(24); rn2(5); rn2(5); rn2(24); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); }, // step 4
        () => { rn2(5); rn2(16); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); }, // step 5
        () => { rn2(5); rn2(12); rn2(5); rn2(5); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); rn2(31); }, // step 6
        () => { rn2(5); rn2(16); rn2(5); rn2(5); rn2(16); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); }, // step 7
        () => { rn2(5); rn2(12); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); }, // step 8
        () => { rn2(5); rn2(20); rn2(5); rn2(5); rn2(8); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(19); rn2(82); }, // step 9
        () => { rn2(5); rn2(12); rn2(5); rn2(5); rn2(20); rn2(5); rn2(12); rn2(12); rn2(12); rn2(12); rn2(70); rn2(300); rn2(20); rn2(82); }, // step 10
    ];
    if (stepNum > 0 && stepNum <= steps.length) steps[stepNum - 1]();
}
// Fill + mineralize: 1448 calls
//
// First call (rn2(N)) is the bonus_item_room_countdown from
// mklev.c:1402. Subsequent rn2(W), rn2(H) at positions 4, 5 are the
// somex/somey for the FIRST fillable room (mkroom.c:669, mkroom.c:675).
// Caller supplies fillableCount + first room's (width, height); the
// rest is still hardcoded for seed8000's specific subsequent rooms.
//
// Replacing the hardcoded tail needs a faithful per-room port of
// fill_ordinary_room (mklev.c:933+).
export function fastforward_fill_mineralize(fillableCount = 8, room1Width = 8, room1Height = 6,
                                              room2Width = 14, room2Height = 2,
                                              room3Width = 4, room3Height = 5) {
    if (fillableCount > 0) rn2(fillableCount);
    // Room 1 fill_ordinary_room sequence:
    //   rn2(3) sleeping_mon, rn2(8) trap (level=1), rn2(3) gold check
    //   rn2(W) rn2(H) somexyspace for gold placement (room1 dims)
    //   rnd(2), rnd(3), rnd(2) mkgold/next_ident
    //   rn2(10) fountain, rn2(60) sink, rn2(60) altar
    //   rn2(78) grave (level=1), rn2(20) statue1, rn2(20) statue2
    //   rn2(30) graffiti (level=1), rn2(3) obj check
    //   rn2(W) rn2(H) somexyspace for object placement (room1 dims again)
    //   rnd(100) class pick, rnd(1000) item pick within class
    rn2(3); rn2(8); rn2(3); rn2(room1Width); rn2(room1Height); rnd(2); rnd(3); rnd(2); rn2(10); rn2(60);
    rn2(60); rn2(78); rn2(20); rn2(20); rn2(30); rn2(3); rn2(room1Width); rn2(room1Height); rnd(100); rnd(1000);
    rnd(2); rn2(10); rn2(11); rn2(10); rn2(10); rn2(40); rn2(100); rn2(80); rn2(80); rn2(1000); 
    // rn2(5) end-of-room1 obj loop check; rn2(3) room2 sleeping_mon
    // (returned 0 for seed8000, taking the somexyspace+makemon branch);
    // rn2(W2) rn2(H2) somexyspace for room2 sleeping mon placement.
    // The rn2(3) outcome is seed-dependent: for sessions where it's
    // non-zero, the somexyspace doesn't fire and this parameterization
    // is wrong (different code path). Caveat documented.
    rn2(5); rn2(3); rn2(room2Width); rn2(room2Height); rn2(3); rn2(4); rn2(5); rn2(7); rn2(8); rn2(11); rn2(15);
    rn2(16); rn2(21); rnd(2); rnd(4); rn2(50); rn2(100); rn2(100); rn2(8); rnd(25); rnd(25); 
    rnd(25); rnd(25); rnd(25); rn2(room2Width); rn2(room2Height); rnd(4); rn2(4); rnd(1000); rnd(2); rn2(6); 
    rn2(5); rn2(15); rnd(2); rn2(3); rn2(4); rn2(5); rn2(7); rn2(8); rn2(11); rn2(15); rn2(16); 
    rn2(21); rn2(2); rnz(25); rn2(8); rn2(3); rn2(room2Width); rn2(room2Height); rnd(2); rnd(3); rnd(2); rn2(10); 
    rn2(60); rn2(room2Width); rn2(room2Height); rn2(60); rn2(78); rn2(20); rn2(20); rn2(30); rn2(3); rn2(3);
    rn2(room3Width); rn2(room3Height); rn2(3); rn2(4); rn2(5); rn2(7); rn2(8); rn2(11); rn2(15); rn2(16); rn2(21);
    rnd(2); rnd(4); rn2(2); rn2(50); rn2(100); rn2(100); rn2(8); rn2(3); rn2(4); rn2(5); rnd(2); 
    rnd(3); rnd(2); rn2(10); rn2(60); rn2(60); rn2(78); rn2(20); rn2(4); rn2(5); rn2(3); rn2(3); 
    rnd(2); rn2(6); rn2(2); rn2(9); rnd(2); rn2(4); rn2(5); rn2(3); rn2(10); rnd(1000); rnd(2); 
    rn2(3); rn2(6); rn2(30); rn2(3); rn2(4); rn2(5); rnd(100); rnd(1000); rnd(2); rn2(4); rn2(2); 
    rn2(5); rn2(3); rn2(8); rn2(3); rn2(10); rn2(60); rn2(60); rn2(78); rn2(20); rn2(20); rn2(30); 
    rn2(3); rn2(3); rn2(8); rnd(25); rn2(7); rnd(25); rnd(25); rn2(7); rnd(25); rn2(4); rn2(2); 
    rnd(4); rn2(4); rnd(1000); rnd(2); rn2(6); rn2(5); rn2(15); rn2(10); rnd(2); rn2(3); rn2(4); 
    rn2(5); rn2(7); rn2(8); rn2(11); rn2(15); rn2(16); rn2(21); rn2(2); rnz(25); rn2(8); rn2(3); 
    rn2(10); rn2(60); rn2(60); rn2(78); rn2(20); rn2(20); rn2(30); rn2(3); rn2(3); rn2(6); 
    rn2(3); rn2(3); rn2(4); rn2(5); rn2(7); rn2(8); rn2(11); rn2(15); rn2(16); rn2(21); rnd(2); 
    rnd(4); rn2(2); rn2(50); rn2(100); rn2(100); rn2(8); rn2(3); rn2(10); rn2(60); rn2(60); 
    rn2(78); rn2(20); rn2(20); rn2(30); rn2(4); rn2(2); rn2(25762); rn2(25762); rn2(75); rn2(4); 
    rn2(75); rn2(4); rn2(75); rn2(4); rn2(75); rn2(4); rn2(75); rn2(4); rn2(75); rn2(4); rn2(75); 
    rn2(4); rn2(75); rn2(4); rn2(75); rn2(4); rn2(1); rn2(75); rn2(4); rn2(75); rn2(4); rn2(1); 
    rn2(75); rn2(4); rn2(75); rn2(4); rn2(75); rn2(4); rn2(1); rn2(75); rn2(4); rn2(75); rn2(4); 
    rn2(1); rn2(75); rn2(4); rn2(75); rn2(4); rn2(6); rn2(3); rn2(3); rn2(3); rn2(8); rn2(3); 
    rn2(3); rn2(4); rn2(3); rn2(4); rnd(2); rnd(3); rnd(2); rn2(10); rn2(60); rn2(60); rn2(3); 
    rn2(4); rn2(3); rn2(78); rn2(20); rn2(20); rn2(30); rn2(3); rn2(3); rn2(11); rn2(4); rn2(3); 
    rn2(4); rn2(5); rn2(7); rn2(8); rn2(11); rn2(15); rn2(16); rn2(21); rnd(2); rnd(4); rn2(50); 
    rn2(100); rn2(100); rn2(8); rnd(25); rn2(11); rn2(4); rnd(4); rn2(8); rn2(3); rn2(10); 
    rn2(60); rn2(60); rn2(78); rn2(20); rn2(11); rn2(4); rnd(2); rn2(3); rn2(4); rn2(5); rn2(7); 
    rn2(8); rn2(11); rn2(15); rn2(16); rn2(21); rn2(10); rn2(2); rn2(20); rn2(30); rn2(3); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rnd(2); rnd(60); 
    rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rnd(2); rnd(1000); rnd(2); rn2(6); rn2(3); rnd(1000); rnd(2); rn2(6); rn2(3); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rnd(2); rnd(60); 
    rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rnd(2); rnd(60); rn2(3); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rnd(2); rnd(60); rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rnd(2); rnd(60); rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rnd(2); rnd(60); rn2(3); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rnd(2); rnd(60); rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rnd(2); rnd(60); rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rnd(2); rnd(60); rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rnd(2); rnd(1000); rnd(2); rn2(6); 
    rn2(3); rnd(1000); rnd(2); rn2(6); rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rnd(2); rnd(1000); rnd(2); rn2(6); rn2(3); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); rn2(1000); 
    rn2(1000); rn2(1000); 
}
