/* NetHack 5.0	sfbase.c.template $NHDT-Date$  $NHDT-Branch$:$NHDT-Revision$ */
/* Copyright (c) Michael Allison, 2025. */
/* NetHack may be freely redistributed.  See license for details. */
//#include "sfproto.h"
/* #define DO_DEBUG */
//#define TURN_OFF_LOGGING 0x20
import { game } from '../gstate.js';
import { fprintf, nh_snprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0 } from '../c2js-runtime/string.js';
import { exportascii, historical, invalid } from './nh-constants.js';

game.sfoprocs = [{ ext: null, fn: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }, { ext: null, fn: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }, { ext: null, fn: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }];
game.sfiprocs = [{ ext: null, fn: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }, { ext: null, fn: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }, { ext: null, fn: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }];
game.zerosfoprocs = { ext: null, fn: 0 };
game.zerosfiprocs = { ext: null, fn: 0 };
game.sfoflprocs = [{ ext: null, fn_x: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }, { ext: null, fn_x: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }, { ext: null, fn_x: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }];
game.sfiflprocs = [{ ext: null, fn_x: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }, { ext: null, fn_x: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }, { ext: null, fn_x: { sf_arti_info: null, sf_nhrect: null, sf_branch: null, sf_bubble: null, sf_cemetery: null, sf_context_info: null, sf_nhcoord: null, sf_damage: null, sf_dest_area: null, sf_dgn_topology: null, sf_dungeon: null, sf_d_level: null, sf_ebones: null, sf_edog: null, sf_egd: null, sf_emin: null, sf_engr: null, sf_epri: null, sf_eshk: null, sf_fe: null, sf_flag: null, sf_fruit: null, sf_gamelog_line: null, sf_kinfo: null, sf_levelflags: null, sf_ls_t: null, sf_linfo: null, sf_mapseen_feat: null, sf_mapseen_flags: null, sf_mapseen_rooms: null, sf_mkroom: null, sf_monst: null, sf_mvitals: null, sf_obj: null, sf_objclass: null, sf_q_score: null, sf_rm: null, sf_spell: null, sf_stairway: null, sf_s_level: null, sf_trap: null, sf_version_info: null, sf_you: null, sf_any: null, sf_aligntyp: null, sf_boolean: null, sf_coordxy: null, sf_genericptr: null, sf_int: null, sf_int16: null, sf_int32: null, sf_int64: null, sf_long: null, sf_schar: null, sf_short: null, sf_size_t: null, sf_time_t: null, sf_uchar: null, sf_uint16: null, sf_uint32: null, sf_uint64: null, sf_ulong: null, sf_unsigned: null, sf_ushort: null, sf_xint16: null, sf_xint8: null, sf_char: null, sf_bitfield: null } }];
game.zerosfoflprocs = { ext: null, fn_x: 0 };
game.zerosfiflprocs = { ext: null, fn_x: 0 };
export function sfo_arti_info(nhfp, d_arti_info, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct arti_info) */, 1, complex_dump(d_arti_info));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_arti_info)(nhfp, d_arti_info, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_arti_info)(nhfp, d_arti_info, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_arti_info(nhfp, d_arti_info, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_arti_info)(nhfp, d_arti_info, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_arti_info)(nhfp, d_arti_info, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_arti_info(nhfp.nhfpconvert, d_arti_info, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct arti_info) */, 1, complex_dump(d_arti_info));
        }
    }
}
export function sfo_nhrect(nhfp, d_nhrect, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct nhrect) */, 1, complex_dump(d_nhrect));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_nhrect)(nhfp, d_nhrect, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_nhrect)(nhfp, d_nhrect, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_nhrect(nhfp, d_nhrect, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_nhrect)(nhfp, d_nhrect, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_nhrect)(nhfp, d_nhrect, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_nhrect(nhfp.nhfpconvert, d_nhrect, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct nhrect) */, 1, complex_dump(d_nhrect));
        }
    }
}
export function sfo_branch(nhfp, d_branch, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct branch) */, 1, complex_dump(d_branch));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_branch)(nhfp, d_branch, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_branch)(nhfp, d_branch, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_branch(nhfp, d_branch, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_branch)(nhfp, d_branch, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_branch)(nhfp, d_branch, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_branch(nhfp.nhfpconvert, d_branch, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct branch) */, 1, complex_dump(d_branch));
        }
    }
}
export function sfo_bubble(nhfp, d_bubble, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct bubble) */, 1, complex_dump(d_bubble));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_bubble)(nhfp, d_bubble, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_bubble)(nhfp, d_bubble, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_bubble(nhfp, d_bubble, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_bubble)(nhfp, d_bubble, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_bubble)(nhfp, d_bubble, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_bubble(nhfp.nhfpconvert, d_bubble, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct bubble) */, 1, complex_dump(d_bubble));
        }
    }
}
export function sfo_cemetery(nhfp, d_cemetery, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct cemetery) */, 1, complex_dump(d_cemetery));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_cemetery)(nhfp, d_cemetery, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_cemetery)(nhfp, d_cemetery, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_cemetery(nhfp, d_cemetery, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_cemetery)(nhfp, d_cemetery, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_cemetery)(nhfp, d_cemetery, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_cemetery(nhfp.nhfpconvert, d_cemetery, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct cemetery) */, 1, complex_dump(d_cemetery));
        }
    }
}
export function sfo_context_info(nhfp, d_context_info, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct context_info) */, 1, complex_dump(d_context_info));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_context_info)(nhfp, d_context_info, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_context_info)(nhfp, d_context_info, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_context_info(nhfp, d_context_info, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_context_info)(nhfp, d_context_info, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_context_info)(nhfp, d_context_info, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_context_info(nhfp.nhfpconvert, d_context_info, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct context_info) */, 1, complex_dump(d_context_info));
        }
    }
}
export function sfo_nhcoord(nhfp, d_nhcoord, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct nhcoord) */, 1, complex_dump(d_nhcoord));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_nhcoord)(nhfp, d_nhcoord, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_nhcoord)(nhfp, d_nhcoord, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_nhcoord(nhfp, d_nhcoord, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_nhcoord)(nhfp, d_nhcoord, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_nhcoord)(nhfp, d_nhcoord, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_nhcoord(nhfp.nhfpconvert, d_nhcoord, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct nhcoord) */, 1, complex_dump(d_nhcoord));
        }
    }
}
export function sfo_damage(nhfp, d_damage, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct damage) */, 1, complex_dump(d_damage));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_damage)(nhfp, d_damage, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_damage)(nhfp, d_damage, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_damage(nhfp, d_damage, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_damage)(nhfp, d_damage, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_damage)(nhfp, d_damage, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_damage(nhfp.nhfpconvert, d_damage, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct damage) */, 1, complex_dump(d_damage));
        }
    }
}
export function sfo_dest_area(nhfp, d_dest_area, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct dest_area) */, 1, complex_dump(d_dest_area));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_dest_area)(nhfp, d_dest_area, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_dest_area)(nhfp, d_dest_area, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_dest_area(nhfp, d_dest_area, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_dest_area)(nhfp, d_dest_area, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_dest_area)(nhfp, d_dest_area, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_dest_area(nhfp.nhfpconvert, d_dest_area, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct dest_area) */, 1, complex_dump(d_dest_area));
        }
    }
}
export function sfo_dgn_topology(nhfp, d_dgn_topology, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct dgn_topology) */, 1, complex_dump(d_dgn_topology));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_dgn_topology)(nhfp, d_dgn_topology, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_dgn_topology)(nhfp, d_dgn_topology, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_dgn_topology(nhfp, d_dgn_topology, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_dgn_topology)(nhfp, d_dgn_topology, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_dgn_topology)(nhfp, d_dgn_topology, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_dgn_topology(nhfp.nhfpconvert, d_dgn_topology, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct dgn_topology) */, 1, complex_dump(d_dgn_topology));
        }
    }
}
export function sfo_dungeon(nhfp, d_dungeon, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct dungeon) */, 1, complex_dump(d_dungeon));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_dungeon)(nhfp, d_dungeon, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_dungeon)(nhfp, d_dungeon, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_dungeon(nhfp, d_dungeon, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_dungeon)(nhfp, d_dungeon, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_dungeon)(nhfp, d_dungeon, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_dungeon(nhfp.nhfpconvert, d_dungeon, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct dungeon) */, 1, complex_dump(d_dungeon));
        }
    }
}
export function sfo_d_level(nhfp, d_d_level, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct d_level) */, 1, complex_dump(d_d_level));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_d_level)(nhfp, d_d_level, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_d_level)(nhfp, d_d_level, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_d_level(nhfp, d_d_level, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_d_level)(nhfp, d_d_level, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_d_level)(nhfp, d_d_level, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_d_level(nhfp.nhfpconvert, d_d_level, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct d_level) */, 1, complex_dump(d_d_level));
        }
    }
}
export function sfo_ebones(nhfp, d_ebones, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct ebones) */, 1, complex_dump(d_ebones));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_ebones)(nhfp, d_ebones, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_ebones)(nhfp, d_ebones, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_ebones(nhfp, d_ebones, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_ebones)(nhfp, d_ebones, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_ebones)(nhfp, d_ebones, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_ebones(nhfp.nhfpconvert, d_ebones, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct ebones) */, 1, complex_dump(d_ebones));
        }
    }
}
export function sfo_edog(nhfp, d_edog, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct edog) */, 1, complex_dump(d_edog));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_edog)(nhfp, d_edog, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_edog)(nhfp, d_edog, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_edog(nhfp, d_edog, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_edog)(nhfp, d_edog, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_edog)(nhfp, d_edog, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_edog(nhfp.nhfpconvert, d_edog, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct edog) */, 1, complex_dump(d_edog));
        }
    }
}
export function sfo_egd(nhfp, d_egd, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct egd) */, 1, complex_dump(d_egd));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_egd)(nhfp, d_egd, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_egd)(nhfp, d_egd, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_egd(nhfp, d_egd, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_egd)(nhfp, d_egd, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_egd)(nhfp, d_egd, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_egd(nhfp.nhfpconvert, d_egd, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct egd) */, 1, complex_dump(d_egd));
        }
    }
}
export function sfo_emin(nhfp, d_emin, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct emin) */, 1, complex_dump(d_emin));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_emin)(nhfp, d_emin, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_emin)(nhfp, d_emin, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_emin(nhfp, d_emin, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_emin)(nhfp, d_emin, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_emin)(nhfp, d_emin, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_emin(nhfp.nhfpconvert, d_emin, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct emin) */, 1, complex_dump(d_emin));
        }
    }
}
export function sfo_engr(nhfp, d_engr, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct engr) */, 1, complex_dump(d_engr));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_engr)(nhfp, d_engr, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_engr)(nhfp, d_engr, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_engr(nhfp, d_engr, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_engr)(nhfp, d_engr, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_engr)(nhfp, d_engr, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_engr(nhfp.nhfpconvert, d_engr, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct engr) */, 1, complex_dump(d_engr));
        }
    }
}
export function sfo_epri(nhfp, d_epri, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct epri) */, 1, complex_dump(d_epri));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_epri)(nhfp, d_epri, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_epri)(nhfp, d_epri, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_epri(nhfp, d_epri, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_epri)(nhfp, d_epri, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_epri)(nhfp, d_epri, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_epri(nhfp.nhfpconvert, d_epri, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct epri) */, 1, complex_dump(d_epri));
        }
    }
}
export function sfo_eshk(nhfp, d_eshk, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct eshk) */, 1, complex_dump(d_eshk));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_eshk)(nhfp, d_eshk, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_eshk)(nhfp, d_eshk, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_eshk(nhfp, d_eshk, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_eshk)(nhfp, d_eshk, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_eshk)(nhfp, d_eshk, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_eshk(nhfp.nhfpconvert, d_eshk, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct eshk) */, 1, complex_dump(d_eshk));
        }
    }
}
export function sfo_fe(nhfp, d_fe, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct fe) */, 1, complex_dump(d_fe));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_fe)(nhfp, d_fe, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_fe)(nhfp, d_fe, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_fe(nhfp, d_fe, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_fe)(nhfp, d_fe, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_fe)(nhfp, d_fe, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_fe(nhfp.nhfpconvert, d_fe, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct fe) */, 1, complex_dump(d_fe));
        }
    }
}
export function sfo_flag(nhfp, d_flag, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct flag) */, 1, complex_dump(d_flag));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_flag)(nhfp, d_flag, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_flag)(nhfp, d_flag, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_flag(nhfp, d_flag, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_flag)(nhfp, d_flag, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_flag)(nhfp, d_flag, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_flag(nhfp.nhfpconvert, d_flag, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct flag) */, 1, complex_dump(d_flag));
        }
    }
}
export function sfo_fruit(nhfp, d_fruit, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct fruit) */, 1, complex_dump(d_fruit));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_fruit)(nhfp, d_fruit, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_fruit)(nhfp, d_fruit, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_fruit(nhfp, d_fruit, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_fruit)(nhfp, d_fruit, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_fruit)(nhfp, d_fruit, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_fruit(nhfp.nhfpconvert, d_fruit, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct fruit) */, 1, complex_dump(d_fruit));
        }
    }
}
export function sfo_gamelog_line(nhfp, d_gamelog_line, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct gamelog_line) */, 1, complex_dump(d_gamelog_line));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_gamelog_line)(nhfp, d_gamelog_line, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_gamelog_line)(nhfp, d_gamelog_line, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_gamelog_line(nhfp, d_gamelog_line, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_gamelog_line)(nhfp, d_gamelog_line, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_gamelog_line)(nhfp, d_gamelog_line, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_gamelog_line(nhfp.nhfpconvert, d_gamelog_line, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct gamelog_line) */, 1, complex_dump(d_gamelog_line));
        }
    }
}
export function sfo_kinfo(nhfp, d_kinfo, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct kinfo) */, 1, complex_dump(d_kinfo));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_kinfo)(nhfp, d_kinfo, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_kinfo)(nhfp, d_kinfo, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_kinfo(nhfp, d_kinfo, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_kinfo)(nhfp, d_kinfo, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_kinfo)(nhfp, d_kinfo, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_kinfo(nhfp.nhfpconvert, d_kinfo, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct kinfo) */, 1, complex_dump(d_kinfo));
        }
    }
}
export function sfo_levelflags(nhfp, d_levelflags, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct levelflags) */, 1, complex_dump(d_levelflags));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_levelflags)(nhfp, d_levelflags, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_levelflags)(nhfp, d_levelflags, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_levelflags(nhfp, d_levelflags, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_levelflags)(nhfp, d_levelflags, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_levelflags)(nhfp, d_levelflags, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_levelflags(nhfp.nhfpconvert, d_levelflags, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct levelflags) */, 1, complex_dump(d_levelflags));
        }
    }
}
export function sfo_ls_t(nhfp, d_ls_t, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct ls_t) */, 1, complex_dump(d_ls_t));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_ls_t)(nhfp, d_ls_t, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_ls_t)(nhfp, d_ls_t, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_ls_t(nhfp, d_ls_t, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_ls_t)(nhfp, d_ls_t, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_ls_t)(nhfp, d_ls_t, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_ls_t(nhfp.nhfpconvert, d_ls_t, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct ls_t) */, 1, complex_dump(d_ls_t));
        }
    }
}
export function sfo_linfo(nhfp, d_linfo, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct linfo) */, 1, complex_dump(d_linfo));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_linfo)(nhfp, d_linfo, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_linfo)(nhfp, d_linfo, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_linfo(nhfp, d_linfo, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_linfo)(nhfp, d_linfo, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_linfo)(nhfp, d_linfo, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_linfo(nhfp.nhfpconvert, d_linfo, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct linfo) */, 1, complex_dump(d_linfo));
        }
    }
}
export function sfo_mapseen_feat(nhfp, d_mapseen_feat, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct mapseen_feat) */, 1, complex_dump(d_mapseen_feat));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_mapseen_feat)(nhfp, d_mapseen_feat, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_mapseen_feat)(nhfp, d_mapseen_feat, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_mapseen_feat(nhfp, d_mapseen_feat, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_mapseen_feat)(nhfp, d_mapseen_feat, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_mapseen_feat)(nhfp, d_mapseen_feat, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_mapseen_feat(nhfp.nhfpconvert, d_mapseen_feat, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct mapseen_feat) */, 1, complex_dump(d_mapseen_feat));
        }
    }
}
export function sfo_mapseen_flags(nhfp, d_mapseen_flags, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct mapseen_flags) */, 1, complex_dump(d_mapseen_flags));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_mapseen_flags)(nhfp, d_mapseen_flags, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_mapseen_flags)(nhfp, d_mapseen_flags, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_mapseen_flags(nhfp, d_mapseen_flags, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_mapseen_flags)(nhfp, d_mapseen_flags, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_mapseen_flags)(nhfp, d_mapseen_flags, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_mapseen_flags(nhfp.nhfpconvert, d_mapseen_flags, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct mapseen_flags) */, 1, complex_dump(d_mapseen_flags));
        }
    }
}
export function sfo_mapseen_rooms(nhfp, d_mapseen_rooms, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct mapseen_rooms) */, 1, complex_dump(d_mapseen_rooms));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_mapseen_rooms)(nhfp, d_mapseen_rooms, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_mapseen_rooms)(nhfp, d_mapseen_rooms, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_mapseen_rooms(nhfp, d_mapseen_rooms, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_mapseen_rooms)(nhfp, d_mapseen_rooms, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_mapseen_rooms)(nhfp, d_mapseen_rooms, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_mapseen_rooms(nhfp.nhfpconvert, d_mapseen_rooms, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct mapseen_rooms) */, 1, complex_dump(d_mapseen_rooms));
        }
    }
}
export function sfo_mkroom(nhfp, d_mkroom, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct mkroom) */, 1, complex_dump(d_mkroom));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_mkroom)(nhfp, d_mkroom, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_mkroom)(nhfp, d_mkroom, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_mkroom(nhfp, d_mkroom, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_mkroom)(nhfp, d_mkroom, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_mkroom)(nhfp, d_mkroom, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_mkroom(nhfp.nhfpconvert, d_mkroom, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct mkroom) */, 1, complex_dump(d_mkroom));
        }
    }
}
export function sfo_monst(nhfp, d_monst, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct monst) */, 1, complex_dump(d_monst));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_monst)(nhfp, d_monst, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_monst)(nhfp, d_monst, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_monst(nhfp, d_monst, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_monst)(nhfp, d_monst, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_monst)(nhfp, d_monst, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_monst(nhfp.nhfpconvert, d_monst, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct monst) */, 1, complex_dump(d_monst));
        }
    }
}
export function sfo_mvitals(nhfp, d_mvitals, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct mvitals) */, 1, complex_dump(d_mvitals));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_mvitals)(nhfp, d_mvitals, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_mvitals)(nhfp, d_mvitals, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_mvitals(nhfp, d_mvitals, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_mvitals)(nhfp, d_mvitals, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_mvitals)(nhfp, d_mvitals, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_mvitals(nhfp.nhfpconvert, d_mvitals, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct mvitals) */, 1, complex_dump(d_mvitals));
        }
    }
}
export function sfo_obj(nhfp, d_obj, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct obj) */, 1, complex_dump(d_obj));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_obj)(nhfp, d_obj, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_obj)(nhfp, d_obj, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_obj(nhfp, d_obj, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_obj)(nhfp, d_obj, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_obj)(nhfp, d_obj, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_obj(nhfp.nhfpconvert, d_obj, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct obj) */, 1, complex_dump(d_obj));
        }
    }
}
export function sfo_objclass(nhfp, d_objclass, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct objclass) */, 1, complex_dump(d_objclass));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_objclass)(nhfp, d_objclass, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_objclass)(nhfp, d_objclass, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_objclass(nhfp, d_objclass, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_objclass)(nhfp, d_objclass, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_objclass)(nhfp, d_objclass, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_objclass(nhfp.nhfpconvert, d_objclass, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct objclass) */, 1, complex_dump(d_objclass));
        }
    }
}
export function sfo_q_score(nhfp, d_q_score, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct q_score) */, 1, complex_dump(d_q_score));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_q_score)(nhfp, d_q_score, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_q_score)(nhfp, d_q_score, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_q_score(nhfp, d_q_score, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_q_score)(nhfp, d_q_score, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_q_score)(nhfp, d_q_score, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_q_score(nhfp.nhfpconvert, d_q_score, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct q_score) */, 1, complex_dump(d_q_score));
        }
    }
}
export function sfo_rm(nhfp, d_rm, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct rm) */, 1, complex_dump(d_rm));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_rm)(nhfp, d_rm, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_rm)(nhfp, d_rm, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_rm(nhfp, d_rm, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_rm)(nhfp, d_rm, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_rm)(nhfp, d_rm, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_rm(nhfp.nhfpconvert, d_rm, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct rm) */, 1, complex_dump(d_rm));
        }
    }
}
export function sfo_spell(nhfp, d_spell, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct spell) */, 1, complex_dump(d_spell));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_spell)(nhfp, d_spell, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_spell)(nhfp, d_spell, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_spell(nhfp, d_spell, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_spell)(nhfp, d_spell, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_spell)(nhfp, d_spell, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_spell(nhfp.nhfpconvert, d_spell, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct spell) */, 1, complex_dump(d_spell));
        }
    }
}
export function sfo_stairway(nhfp, d_stairway, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct stairway) */, 1, complex_dump(d_stairway));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_stairway)(nhfp, d_stairway, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_stairway)(nhfp, d_stairway, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_stairway(nhfp, d_stairway, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_stairway)(nhfp, d_stairway, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_stairway)(nhfp, d_stairway, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_stairway(nhfp.nhfpconvert, d_stairway, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct stairway) */, 1, complex_dump(d_stairway));
        }
    }
}
export function sfo_s_level(nhfp, d_s_level, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct s_level) */, 1, complex_dump(d_s_level));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_s_level)(nhfp, d_s_level, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_s_level)(nhfp, d_s_level, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_s_level(nhfp, d_s_level, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_s_level)(nhfp, d_s_level, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_s_level)(nhfp, d_s_level, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_s_level(nhfp.nhfpconvert, d_s_level, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct s_level) */, 1, complex_dump(d_s_level));
        }
    }
}
export function sfo_trap(nhfp, d_trap, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct trap) */, 1, complex_dump(d_trap));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_trap)(nhfp, d_trap, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_trap)(nhfp, d_trap, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_trap(nhfp, d_trap, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_trap)(nhfp, d_trap, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_trap)(nhfp, d_trap, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_trap(nhfp.nhfpconvert, d_trap, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct trap) */, 1, complex_dump(d_trap));
        }
    }
}
export function sfo_you(nhfp, d_you, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct you) */, 1, complex_dump(d_you));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_you)(nhfp, d_you, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_you)(nhfp, d_you, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_you(nhfp, d_you, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_you)(nhfp, d_you, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_you)(nhfp, d_you, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_you(nhfp.nhfpconvert, d_you, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct you) */, 1, complex_dump(d_you));
        }
    }
}
export function sfo_any(nhfp, d_any, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(union any) */, 1, complex_dump(d_any));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_any)(nhfp, d_any, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_any)(nhfp, d_any, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_any(nhfp, d_any, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_any)(nhfp, d_any, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_any)(nhfp, d_any, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_any(nhfp.nhfpconvert, d_any, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(union any) */, 1, complex_dump(d_any));
        }
    }
}
export function sfo_aligntyp(nhfp, d_aligntyp, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(aligntyp) */, 1, sfvalue_aligntyp(d_aligntyp));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_aligntyp)(nhfp, d_aligntyp, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_aligntyp)(nhfp, d_aligntyp, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_aligntyp(nhfp, d_aligntyp, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_aligntyp)(nhfp, d_aligntyp, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_aligntyp)(nhfp, d_aligntyp, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_aligntyp(nhfp.nhfpconvert, d_aligntyp, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(aligntyp) */, 1, sfvalue_aligntyp(d_aligntyp));
        }
    }
}
export function sfo_boolean(nhfp, d_boolean, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(boolean) */, 1, sfvalue_boolean(d_boolean));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_boolean)(nhfp, d_boolean, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_boolean)(nhfp, d_boolean, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_boolean(nhfp, d_boolean, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_boolean)(nhfp, d_boolean, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_boolean)(nhfp, d_boolean, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_boolean(nhfp.nhfpconvert, d_boolean, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(boolean) */, 1, sfvalue_boolean(d_boolean));
        }
    }
}
export function sfo_coordxy(nhfp, d_coordxy, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(coordxy) */, 1, sfvalue_int16(d_coordxy));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_coordxy)(nhfp, d_coordxy, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_coordxy)(nhfp, d_coordxy, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_coordxy(nhfp, d_coordxy, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_coordxy)(nhfp, d_coordxy, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_coordxy)(nhfp, d_coordxy, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_coordxy(nhfp.nhfpconvert, d_coordxy, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(coordxy) */, 1, sfvalue_int16(d_coordxy));
        }
    }
}
export function sfo_int(nhfp, d_int, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 4 /* sizeof(int) */, 1, sfvalue_int(d_int));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_int)(nhfp, d_int, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_int)(nhfp, d_int, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_int(nhfp, d_int, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_int)(nhfp, d_int, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_int)(nhfp, d_int, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_int(nhfp.nhfpconvert, d_int, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 4 /* sizeof(int) */, 1, sfvalue_int(d_int));
        }
    }
}
export function sfo_int16(nhfp, d_int16, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(int16) */, 1, sfvalue_int16(d_int16));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_int16)(nhfp, d_int16, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_int16)(nhfp, d_int16, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_int16(nhfp, d_int16, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_int16)(nhfp, d_int16, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_int16)(nhfp, d_int16, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_int16(nhfp.nhfpconvert, d_int16, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(int16) */, 1, sfvalue_int16(d_int16));
        }
    }
}
export function sfo_int32(nhfp, d_int32, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(int32) */, 1, sfvalue_int32(d_int32));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_int32)(nhfp, d_int32, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_int32)(nhfp, d_int32, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_int32(nhfp, d_int32, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_int32)(nhfp, d_int32, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_int32)(nhfp, d_int32, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_int32(nhfp.nhfpconvert, d_int32, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(int32) */, 1, sfvalue_int32(d_int32));
        }
    }
}
export function sfo_int64(nhfp, d_int64, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(int64) */, 1, sfvalue_int64(d_int64));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_int64)(nhfp, d_int64, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_int64)(nhfp, d_int64, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_int64(nhfp, d_int64, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_int64)(nhfp, d_int64, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_int64)(nhfp, d_int64, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_int64(nhfp.nhfpconvert, d_int64, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(int64) */, 1, sfvalue_int64(d_int64));
        }
    }
}
export function sfo_long(nhfp, d_long, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 8 /* sizeof(long) */, 1, sfvalue_long(d_long));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_long)(nhfp, d_long, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_long)(nhfp, d_long, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_long(nhfp, d_long, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_long)(nhfp, d_long, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_long)(nhfp, d_long, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_long(nhfp.nhfpconvert, d_long, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 8 /* sizeof(long) */, 1, sfvalue_long(d_long));
        }
    }
}
export function sfo_schar(nhfp, d_schar, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(schar) */, 1, sfvalue_schar(d_schar));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_schar)(nhfp, d_schar, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_schar)(nhfp, d_schar, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_schar(nhfp, d_schar, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_schar)(nhfp, d_schar, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_schar)(nhfp, d_schar, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_schar(nhfp.nhfpconvert, d_schar, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(schar) */, 1, sfvalue_schar(d_schar));
        }
    }
}
export function sfo_short(nhfp, d_short, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 2 /* sizeof(short) */, 1, sfvalue_short(d_short));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_short)(nhfp, d_short, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_short)(nhfp, d_short, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_short(nhfp, d_short, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_short)(nhfp, d_short, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_short)(nhfp, d_short, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_short(nhfp.nhfpconvert, d_short, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 2 /* sizeof(short) */, 1, sfvalue_short(d_short));
        }
    }
}
export function sfo_size_t(nhfp, d_size_t, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 8 /* sizeof(size_t) */, 1, sfvalue_size_t(d_size_t));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_size_t)(nhfp, d_size_t, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_size_t)(nhfp, d_size_t, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_size_t(nhfp, d_size_t, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_size_t)(nhfp, d_size_t, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_size_t)(nhfp, d_size_t, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_size_t(nhfp.nhfpconvert, d_size_t, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 8 /* sizeof(size_t) */, 1, sfvalue_size_t(d_size_t));
        }
    }
}
export function sfo_time_t(nhfp, d_time_t, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(time_t) */, 1, sfvalue_time_t(d_time_t));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_time_t)(nhfp, d_time_t, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_time_t)(nhfp, d_time_t, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_time_t(nhfp, d_time_t, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_time_t)(nhfp, d_time_t, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_time_t)(nhfp, d_time_t, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_time_t(nhfp.nhfpconvert, d_time_t, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(time_t) */, 1, sfvalue_time_t(d_time_t));
        }
    }
}
export function sfo_uchar(nhfp, d_uchar, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(uchar) */, 1, sfvalue_uchar(d_uchar));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_uchar)(nhfp, d_uchar, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_uchar)(nhfp, d_uchar, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_uchar(nhfp, d_uchar, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_uchar)(nhfp, d_uchar, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_uchar)(nhfp, d_uchar, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_uchar(nhfp.nhfpconvert, d_uchar, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(uchar) */, 1, sfvalue_uchar(d_uchar));
        }
    }
}
export function sfo_uint16(nhfp, d_uint16, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(uint16) */, 1, sfvalue_uint16(d_uint16));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_uint16)(nhfp, d_uint16, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_uint16)(nhfp, d_uint16, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_uint16(nhfp, d_uint16, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_uint16)(nhfp, d_uint16, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_uint16)(nhfp, d_uint16, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_uint16(nhfp.nhfpconvert, d_uint16, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(uint16) */, 1, sfvalue_uint16(d_uint16));
        }
    }
}
export function sfo_uint32(nhfp, d_uint32, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(uint32) */, 1, sfvalue_uint32(d_uint32));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_uint32)(nhfp, d_uint32, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_uint32)(nhfp, d_uint32, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_uint32(nhfp, d_uint32, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_uint32)(nhfp, d_uint32, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_uint32)(nhfp, d_uint32, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_uint32(nhfp.nhfpconvert, d_uint32, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(uint32) */, 1, sfvalue_uint32(d_uint32));
        }
    }
}
export function sfo_uint64(nhfp, d_uint64, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(uint64) */, 1, sfvalue_uint64(d_uint64));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_uint64)(nhfp, d_uint64, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_uint64)(nhfp, d_uint64, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_uint64(nhfp, d_uint64, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_uint64)(nhfp, d_uint64, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_uint64)(nhfp, d_uint64, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_uint64(nhfp.nhfpconvert, d_uint64, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(uint64) */, 1, sfvalue_uint64(d_uint64));
        }
    }
}
export function sfo_ulong(nhfp, d_ulong, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(ulong) */, 1, sfvalue_ulong(d_ulong));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_ulong)(nhfp, d_ulong, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_ulong)(nhfp, d_ulong, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_ulong(nhfp, d_ulong, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_ulong)(nhfp, d_ulong, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_ulong)(nhfp, d_ulong, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_ulong(nhfp.nhfpconvert, d_ulong, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(ulong) */, 1, sfvalue_ulong(d_ulong));
        }
    }
}
export function sfo_unsigned(nhfp, d_unsigned, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 4 /* sizeof(unsigned int) */, 1, sfvalue_unsigned(d_unsigned));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_unsigned)(nhfp, d_unsigned, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_unsigned)(nhfp, d_unsigned, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_unsigned(nhfp, d_unsigned, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_unsigned)(nhfp, d_unsigned, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_unsigned)(nhfp, d_unsigned, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_unsigned(nhfp.nhfpconvert, d_unsigned, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 4 /* sizeof(unsigned int) */, 1, sfvalue_unsigned(d_unsigned));
        }
    }
}
export function sfo_ushort(nhfp, d_ushort, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(ushort) */, 1, sfvalue_ushort(d_ushort));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_ushort)(nhfp, d_ushort, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_ushort)(nhfp, d_ushort, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_ushort(nhfp, d_ushort, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_ushort)(nhfp, d_ushort, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_ushort)(nhfp, d_ushort, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_ushort(nhfp.nhfpconvert, d_ushort, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(ushort) */, 1, sfvalue_ushort(d_ushort));
        }
    }
}
export function sfo_xint16(nhfp, d_xint16, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(xint16) */, 1, sfvalue_xint16(d_xint16));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_xint16)(nhfp, d_xint16, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_xint16)(nhfp, d_xint16, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_xint16(nhfp, d_xint16, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_xint16)(nhfp, d_xint16, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_xint16)(nhfp, d_xint16, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_xint16(nhfp.nhfpconvert, d_xint16, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(xint16) */, 1, sfvalue_xint16(d_xint16));
        }
    }
}
export function sfo_xint8(nhfp, d_xint8, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(xint8) */, 1, sfvalue_xint8(d_xint8));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_xint8)(nhfp, d_xint8, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_xint8)(nhfp, d_xint8, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_xint8(nhfp, d_xint8, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_xint8)(nhfp, d_xint8, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_xint8)(nhfp, d_xint8, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_xint8(nhfp.nhfpconvert, d_xint8, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(xint8) */, 1, sfvalue_xint8(d_xint8));
        }
    }
}
export function sfo_bitfield(nhfp, d_bitfield, myname, bfsz) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(uint8_t) */, 1, sfvalue_bitfield(d_bitfield));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_bitfield)(nhfp, d_bitfield, myname, bfsz);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_bitfield)(nhfp, d_bitfield, myname, bfsz);
        nhfp.fplog = save_fplog;
    }
    if (nhfp.fplog && !nhfp.eof) {
        sf_log(nhfp, myname, 1 /* sizeof(uint8_t) */, 1, sfvalue_bitfield(d_bitfield));
    }
}
export function sfi_bitfield(nhfp, d_bitfield, myname, bfsz) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_bitfield)(nhfp, d_bitfield, myname, bfsz);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_bitfield)(nhfp, d_bitfield, myname, bfsz);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_bitfield(nhfp.nhfpconvert, d_bitfield, myname, bfsz);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(uint8_t) */, 1, bitfield_dump(d_bitfield));
        }
    }
}
/* not in _Generic */
export function sfo_char(nhfp, d_char, myname, cnt) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(char) */, cnt, sfvalue_char(d_char, cnt));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_char)(nhfp, d_char, myname, cnt);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_char)(nhfp, d_char, myname, cnt);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_char(nhfp, d_char, myname, cnt) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_char)(nhfp, d_char, myname, cnt);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_char)(nhfp, d_char, myname, cnt);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_char(nhfp.nhfpconvert, d_char, myname, cnt);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(char) */, cnt, sfvalue_char(d_char, cnt));
        }
    }
}
export function sfo_genericptr(nhfp, d_genericptr, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 8 /* sizeof(void *) */, 1, sfvalue_genericptr(d_genericptr));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_genericptr)(nhfp, d_genericptr, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_genericptr)(nhfp, d_genericptr, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_genericptr(nhfp, d_genericptr, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_genericptr)(nhfp, d_genericptr, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_genericptr)(nhfp, d_genericptr, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            sfo_genericptr(nhfp.nhfpconvert, d_genericptr, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 8 /* sizeof(void *) */, 1, sfvalue_genericptr(d_genericptr));
        }
    }
}
export function sfo_version_info(nhfp, d_version_info, myname) {
    if (nhfp.fplog) {
        sf_log(nhfp, myname, 1 /* sizeof(struct version_info) */, 1, complex_dump(d_version_info));
    }
    if (nhfp.structlevel) {
        (game.sfoprocs[nhfp.fnidx].fn.sf_version_info)(nhfp, d_version_info, myname);
    } else {
        let save_fplog = nhfp.fplog;
        nhfp.fplog = null;
        (game.sfoflprocs[nhfp.fnidx].fn_x.sf_version_info)(nhfp, d_version_info, myname);
        nhfp.fplog = save_fplog;
    }
}
export function sfi_version_info(nhfp, d_version_info, myname) {
    if (nhfp.structlevel) {
        (game.sfiprocs[nhfp.fnidx].fn.sf_version_info)(nhfp, d_version_info, myname);
    } else {
        let save_mode = nhfp.mode;
        nhfp.mode &= ~(8 | 16);
        nhfp.mode |= (16 << 1);
        (game.sfiflprocs[nhfp.fnidx].fn_x.sf_version_info)(nhfp, d_version_info, myname);
        nhfp.mode = save_mode;
    }
    if (!nhfp.eof) {
        if ((((nhfp.mode & 8) != 0) || ((nhfp.mode & 16) != 0)) && nhfp.nhfpconvert) {
            d_version_info.feature_set |= (1 << 30);
            sfo_version_info(nhfp.nhfpconvert, d_version_info, myname);
        }
        if (nhfp.fplog) {
            sf_log(nhfp, myname, 1 /* sizeof(struct version_info) */, 1, complex_dump(d_version_info));
        }
    }
}
/* ---------------------------------------------------------------*/
export function sf_log(nhfp, t1, sz, cnt, txtvalue) {
    let fp = nhfp.fplog;
    let iocount = null;
    let dolog = ((nhfp.mode & (16 << 1)) == 0);
    if (fp && dolog) {
        iocount = ((nhfp.mode & 2) == 0) ? nhfp.rcount : nhfp.wcount;
        fprintf(fp, "%08ld %s sz=%zu cnt=%d |%s|\n", iocount, t1, sz, cnt, txtvalue);
        fflush(fp);
    }
}
let __sfvalue_char_buf = '';
export function sfvalue_char(a, n) {
    let i = 0;
    let cp = null;
    cp = __sfvalue_char_buf[0];
    if (n < (120 /* sizeof(char [120]) */ - 1)) {
        __sfvalue_char_buf[n] = 0;
    } else {
        __sfvalue_char_buf[(120 /* sizeof(char [120]) */ - 1)] = 0;
    }
    for (i = 0; i < n; ++i , (cp = __nh_advance_str(cp, 1)) , (a = __nh_advance_str(a, 1))) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = __nh_char_at0(a)) */;
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    return __sfvalue_char_buf;
}
let __sfvalue_boolean_buf = '';
export function sfvalue_boolean(a) {
    __sfvalue_boolean_buf = nh_snprintf("sfvalue_boolean", 428, __sfvalue_boolean_buf, 20 /* sizeof(char [20]) */, "%s", (a.value == 0) ? "false" : "true");
    return __sfvalue_boolean_buf;
}
let __sfvalue_schar_buf = '';
export function sfvalue_schar(a) {
    __sfvalue_schar_buf = nh_snprintf("sfvalue_schar", 436, __sfvalue_schar_buf, 20 /* sizeof(char [20]) */, "%d", a.value);
    return __sfvalue_schar_buf;
}
let __sfvalue_aligntyp_buf = '';
export function sfvalue_aligntyp(a) {
    __sfvalue_aligntyp_buf = nh_snprintf("sfvalue_aligntyp", 444, __sfvalue_aligntyp_buf, 20 /* sizeof(char [20]) */, "%d", a.value);
    return __sfvalue_aligntyp_buf;
}
let __sfvalue_any_buf = '';
export function sfvalue_any(a) {
    __sfvalue_any_buf = nh_snprintf("sfvalue_any", 455, __sfvalue_any_buf, 20 /* sizeof(char [20]) */, "%ld", a.a_int64);
    return __sfvalue_any_buf;
}
let __sfvalue_genericptr_buf = '';
export function sfvalue_genericptr(a) {
    __sfvalue_genericptr_buf = nh_snprintf("sfvalue_genericptr", 465, __sfvalue_genericptr_buf, 20 /* sizeof(char [20]) */, "%s", (a == null) ? "0" : "glorkum");
    return __sfvalue_genericptr_buf;
}
let __sfvalue_int16_buf = '';
export function sfvalue_int16(a) {
    __sfvalue_int16_buf = nh_snprintf("sfvalue_int16", 473, __sfvalue_int16_buf, 20 /* sizeof(char [20]) */, "%d", a.value);
    return __sfvalue_int16_buf;
}
let __sfvalue_int32_buf = '';
export function sfvalue_int32(a) {
    __sfvalue_int32_buf = nh_snprintf("sfvalue_int32", 481, __sfvalue_int32_buf, 20 /* sizeof(char [20]) */, "%d", a.value);
    return __sfvalue_int32_buf;
}
let __sfvalue_int64_buf = '';
export function sfvalue_int64(a) {
    __sfvalue_int64_buf = nh_snprintf("sfvalue_int64", 488, __sfvalue_int64_buf, 20 /* sizeof(char [20]) */, "%ld", a.value);
    return __sfvalue_int64_buf;
}
let __sfvalue_uchar_buf = '';
export function sfvalue_uchar(a) {
    let x = 0;
    x = a.value;
    __sfvalue_uchar_buf = nh_snprintf("sfvalue_uchar", 498, __sfvalue_uchar_buf, 20 /* sizeof(char [20]) */, "%03u", x);
    return __sfvalue_uchar_buf;
}
let __sfvalue_uint16_buf = '';
export function sfvalue_uint16(a) {
    __sfvalue_uint16_buf = nh_snprintf("sfvalue_uint16", 506, __sfvalue_uint16_buf, 20 /* sizeof(char [20]) */, "%u", a.value);
    return __sfvalue_uint16_buf;
}
let __sfvalue_uint32_buf = '';
export function sfvalue_uint32(a) {
    __sfvalue_uint32_buf = nh_snprintf("sfvalue_uint32", 514, __sfvalue_uint32_buf, 20 /* sizeof(char [20]) */, "%u", a.value);
    return __sfvalue_uint32_buf;
}
let __sfvalue_uint64_buf = '';
export function sfvalue_uint64(a) {
    __sfvalue_uint64_buf = nh_snprintf("sfvalue_uint64", 522, __sfvalue_uint64_buf, 20 /* sizeof(char [20]) */, "%lu", a.value);
    return __sfvalue_uint64_buf;
}
let __sfvalue_size_t_buf = '';
export function sfvalue_size_t(a) {
    __sfvalue_size_t_buf = nh_snprintf("sfvalue_size_t", 530, __sfvalue_size_t_buf, 20 /* sizeof(char [20]) */, "%s", "");
    return __sfvalue_size_t_buf;
}
let __sfvalue_time_t_buf = '';
export function sfvalue_time_t(a) {
    __sfvalue_time_t_buf = nh_snprintf("sfvalue_time_t", 538, __sfvalue_time_t_buf, 20 /* sizeof(char [20]) */, "%s", "");
    return __sfvalue_time_t_buf;
}
let __sfvalue_short_buf = '';
export function sfvalue_short(a) {
    __sfvalue_short_buf = nh_snprintf("sfvalue_short", 546, __sfvalue_short_buf, 20 /* sizeof(char [20]) */, "%d", a.value);
    return __sfvalue_short_buf;
}
let __sfvalue_ushort_buf = '';
export function sfvalue_ushort(a) {
    __sfvalue_ushort_buf = nh_snprintf("sfvalue_ushort", 554, __sfvalue_ushort_buf, 20 /* sizeof(char [20]) */, "%u", a.value);
    return __sfvalue_ushort_buf;
}
let __sfvalue_int_buf = '';
export function sfvalue_int(a) {
    __sfvalue_int_buf = nh_snprintf("sfvalue_int", 562, __sfvalue_int_buf, 20 /* sizeof(char [20]) */, "%d", a.value);
    return __sfvalue_int_buf;
}
let __sfvalue_unsigned_buf = '';
export function sfvalue_unsigned(a) {
    __sfvalue_unsigned_buf = nh_snprintf("sfvalue_unsigned", 570, __sfvalue_unsigned_buf, 20 /* sizeof(char [20]) */, "%u", a.value);
    return __sfvalue_unsigned_buf;
}
let __sfvalue_long_buf = '';
export function sfvalue_long(a) {
    __sfvalue_long_buf = nh_snprintf("sfvalue_long", 578, __sfvalue_long_buf, 20 /* sizeof(char [20]) */, "%ld", a.value);
    return __sfvalue_long_buf;
}
let __sfvalue_ulong_buf = '';
export function sfvalue_ulong(a) {
    __sfvalue_ulong_buf = nh_snprintf("sfvalue_ulong", 586, __sfvalue_ulong_buf, 20 /* sizeof(char [20]) */, "%lu", a.value);
    return __sfvalue_ulong_buf;
}
let __sfvalue_xint8_buf = '';
export function sfvalue_xint8(a) {
    __sfvalue_xint8_buf = nh_snprintf("sfvalue_xint8", 594, __sfvalue_xint8_buf, 20 /* sizeof(char [20]) */, "%d", a.value);
    return __sfvalue_xint8_buf;
}
let __sfvalue_xint16_buf = '';
export function sfvalue_xint16(a) {
    __sfvalue_xint16_buf = nh_snprintf("sfvalue_xint16", 603, __sfvalue_xint16_buf, 20 /* sizeof(char [20]) */, "%d", a.value);
    return __sfvalue_xint16_buf;
}
let __sfvalue_bitfield_buf = '';
export function sfvalue_bitfield(a) {
    __sfvalue_bitfield_buf = nh_snprintf("sfvalue_bitfield", 612, __sfvalue_bitfield_buf, 20 /* sizeof(char [20]) */, "%u", a.value);
    return __sfvalue_bitfield_buf;
}
let __bitfield_dump_buf = '';
export function bitfield_dump(a) {
    __bitfield_dump_buf = nh_snprintf("bitfield_dump", 621, __bitfield_dump_buf, 20 /* sizeof(char [20]) */, "%u", a.value);
    return __bitfield_dump_buf;
}
let __complex_dump_buf = '';
export function complex_dump(a) {
    let i = 0;
    let uc = a;
    let x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < (Math.trunc(40 /* sizeof(unsigned int [10]) */ / 4 /* sizeof(unsigned int) */)); ++i) {
        x[i] = uc++;
    }
    __complex_dump_buf = nh_snprintf("complex_dump", 636, __complex_dump_buf, 50 /* sizeof(char [50]) */, "%03x %03x %03x %03x %03x %03x %03x %03x %03x %03x", x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], x[8], x[9]);
    __complex_dump_buf[40] = 0;
    return __complex_dump_buf;
}
/*
 *----------------------------------------------------------------------------
 * initialize the function pointers. These are called from initoptions_init().
 *----------------------------------------------------------------------------
 */
export function sf_init() {
    Object.assign(game.sfoprocs[invalid], game.zerosfoprocs);
    Object.assign(game.sfiprocs[invalid], game.zerosfiprocs);
    Object.assign(game.sfoprocs[historical], historical_sfo_procs);
    Object.assign(game.sfiprocs[historical], historical_sfi_procs);
    Object.assign(game.sfoflprocs[exportascii], game.zerosfoflprocs);
    Object.assign(game.sfiflprocs[exportascii], game.zerosfiflprocs);
}
export function sf_setprocs(idx, sfi, sfo) {
    Object.assign(game.sfoprocs[idx], sfo);
    Object.assign(game.sfiprocs[idx], sfi);
}
export function sf_setflprocs(idx, flsfi, flsfo) {
    Object.assign(game.sfoflprocs[idx], flsfo);
    Object.assign(game.sfiflprocs[idx], flsfi);
}
export function norm_ptrs_any(d_any) {}
export function norm_ptrs_align(d_align) {}
export function norm_ptrs_arti_info(d_arti_info) {}
export function norm_ptrs_attribs(d_attribs) {}
export function norm_ptrs_bill_x(d_bill_x) {}
export function norm_ptrs_branch(d_branch) {}
export function norm_ptrs_bubble(d_bubble) {}
export function norm_ptrs_cemetery(d_cemetery) {}
export function norm_ptrs_context_info(d_context_info) {}
export function norm_ptrs_achievement_tracking(d_achievement_tracking) {}
export function norm_ptrs_book_info(d_book_info) {}
export function norm_ptrs_dig_info(d_dig_info) {}
export function norm_ptrs_engrave_info(d_engrave_info) {}
export function norm_ptrs_obj_split(d_obj_split) {}
export function norm_ptrs_polearm_info(d_polearm_info) {}
export function norm_ptrs_takeoff_info(d_takeoff_info) {}
export function norm_ptrs_tin_info(d_tin_info) {}
export function norm_ptrs_tribute_info(d_tribute_info) {}
export function norm_ptrs_victual_info(d_victual_info) {}
export function norm_ptrs_warntype_info(d_warntype_info) {}
export function norm_ptrs_d_flags(d_d_flags) {}
export function norm_ptrs_d_level(d_d_level) {}
export function norm_ptrs_damage(d_damage) {}
export function norm_ptrs_dest_area(d_dest_area) {}
export function norm_ptrs_dgn_topology(d_dgn_topology) {}
export function norm_ptrs_dungeon(d_dungeon) {}
export function norm_ptrs_ebones(d_ebones) {}
export function norm_ptrs_edog(d_edog) {}
export function norm_ptrs_egd(d_egd) {}
export function norm_ptrs_emin(d_emin) {}
export function norm_ptrs_engr(d_engr) {}
export function norm_ptrs_epri(d_epri) {}
export function norm_ptrs_eshk(d_eshk) {}
export function norm_ptrs_fakecorridor(d_fakecorridor) {}
export function norm_ptrs_fe(d_fe) {}
export function norm_ptrs_flag(d_flag) {}
export function norm_ptrs_fruit(d_fruit) {}
export function norm_ptrs_gamelog_line(d_gamelog_line) {}
export function norm_ptrs_kinfo(d_kinfo) {}
export function norm_ptrs_levelflags(d_levelflags) {}
export function norm_ptrs_linfo(d_linfo) {}
export function norm_ptrs_ls_t(d_ls_t) {}
export function norm_ptrs_mapseen_feat(d_mapseen_feat) {}
export function norm_ptrs_mapseen_flags(d_mapseen_flags) {}
export function norm_ptrs_mapseen_rooms(d_mapseen_rooms) {}
export function norm_ptrs_mapseen(d_mapseen) {}
export function norm_ptrs_mextra(d_mextra) {}
export function norm_ptrs_mkroom(d_mkroom) {}
export function norm_ptrs_monst(d_monst) {}
export function norm_ptrs_mvitals(d_mvitals) {}
export function norm_ptrs_nhcoord(d_nhcoord) {}
export function norm_ptrs_nhrect(d_nhrect) {}
export function norm_ptrs_novel_tracking(d_novel_tracking) {}
export function norm_ptrs_obj(d_obj) {}
export function norm_ptrs_objclass(d_objclass) {}
export function norm_ptrs_oextra(d_oextra) {}
export function norm_ptrs_prop(d_prop) {}
export function norm_ptrs_q_score(d_q_score) {}
export function norm_ptrs_rm(d_rm) {}
export function norm_ptrs_s_level(d_s_level) {}
export function norm_ptrs_skills(d_skills) {}
export function norm_ptrs_spell(d_spell) {}
export function norm_ptrs_stairway(d_stairway) {}
export function norm_ptrs_trap(d_trap) {}
export function norm_ptrs_u_conduct(d_u_conduct) {}
export function norm_ptrs_u_event(d_u_event) {}
export function norm_ptrs_u_have(d_u_have) {}
export function norm_ptrs_u_realtime(d_u_realtime) {}
export function norm_ptrs_u_roleplay(d_u_roleplay) {}
export function norm_ptrs_version_info(d_version_info) {}
export function norm_ptrs_vlaunchinfo(d_vlaunchinfo) {}
export function norm_ptrs_vptrs(d_vptrs) {}
export function norm_ptrs_you(d_you) {}
/* SFCTOOL */
/* end of sfbase.c */
