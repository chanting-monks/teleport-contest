/* NetHack 5.0	glyphs.c	TODO: add NHDT branch/date/revision tags */
/* Copyright (c) Michael Allison, 2021. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { panic } from '../c2js-runtime/panic.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { fprintf, nh_snprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, strcat, strcmp, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { rgbstr_to_int32, set_map_customcolor } from './coloratt.js';
import { unicodeval_to_utf8str } from './hacklib.js';
import { CORPSE, FIRST_OBJECT, GLYPH_ALTAR_OFF, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_EXPLODE_FROSTY_OFF, GLYPH_EXPLODE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_NOTHING_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_SWALLOW_OFF, GLYPH_UNEXPLORED_OFF, GLYPH_WARNING_OFF, GLYPH_ZAP_OFF, GOLD_PIECE, H_UTF8, LAND_MINE, MAXPCHARS, MAX_GLYPH, NUMMONS, NUM_GRAPHICS, NUM_OBJECTS, POT_GAIN_ABILITY, POT_WATER, RIN_ADORNMENT, RIN_PROTECTION_FROM_SHAPE_CHAN, SCR_BLANK_PAPER, SCR_ENCHANT_ARMOR, SCR_MAIL, SCR_STINKING_CLOUD, SLIME_MOLD, SPE_BLANK_PAPER, SPE_DIG, STATUE, SYM_MON, SYM_OC, SYM_PCHAR, S_altar, S_arrow_trap, S_brdnladder, S_digbeam, S_expl_br, S_expl_tl, S_goodpos, S_grave, S_ndoor, S_stone, S_sw_br, S_sw_tl, S_trwall, S_vbeam, S_vwall, TRAPNUM, WAN_LIGHT, WAN_LIGHTNING, altar_other, custom_count, custom_nhcolor, custom_none, custom_symbols, custom_ureps, do_custom_colors, do_custom_symbols } from './nh-constants.js';
import { loadsyms } from './symbols.js';
import { add_custom_urep_entry, set_map_u, unicode_val } from './utf8map.js';
import { wizcustom_callback } from './wizcmds.js';

export const res_nothing = 0;
export const res_dump_glyphids = 1;
export const res_fill_cache = 2;
export const find_nothing = 0;
export const find_pm = 1;
export const find_oc = 2;
export const find_cmap = 3;
export const find_glyph = 4;
// struct find_struct: { findtype, val, loadsyms_offset, loadsyms_count, extraval, color, unicode_val, callback, restype, reserved }
/* U+NNNN format */
const zero_find = { findtype: 0, val: 0, loadsyms_offset: 0, loadsyms_count: 0, extraval: null, color: 0, unicode_val: null, callback: null, restype: 0, reserved: 0 };
// struct glyphid_cache_t: { glyphnum, id }
game.glyphid_cache = null;
game.glyphid_cache_lsize = 0;
game.glyphid_cache_size = 0;
game.glyphcache_find = { findtype: 0, val: 0, loadsyms_offset: 0, loadsyms_count: 0, extraval: null, color: 0, unicode_val: null, callback: null, restype: 0, reserved: 0 };
game.to_custom_symbol_find = { findtype: 0, val: 0, loadsyms_offset: 0, loadsyms_count: 0, extraval: null, color: 0, unicode_val: null, callback: null, restype: 0, reserved: 0 };
const nonzero_black = 0 | 16777216;
/* staticfn void purge_custom_entries(enum graphics_sets which_set); */
let __to_custom_symset_entry_callback_glyphnag = 0;
__nh_register_static(() => { __to_custom_symset_entry_callback_glyphnag = 0; });
let __to_custom_symset_entry_callback_colornag = 0;
__nh_register_static(() => { __to_custom_symset_entry_callback_colornag = 0; });
export function to_custom_symset_entry_callback(glyph, findwhat) {
    let idx = game.symset_which_set;
    let utf8str = [0, 0, 0, 0, 0, 0];
    let uval = 0;
    if (findwhat.extraval) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = glyph) */;
    }
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    if (findwhat.unicode_val) {
        uval = unicode_val(findwhat.unicode_val);
    }
    if (uval && unicodeval_to_utf8str(uval, utf8str, 6 /* sizeof(uint8 [6]) */)) {
        if (game.symset[idx].name) {
            /* presently the customizations are affiliated with a particular
         * symset but if we don't have any symset context, ignore it for now
         * in order to avoid a segfault.
         * FIXME:
         * One future idea might be to store the U+ entries under "UTF8"
         * and apply those customizations to any current symset if it has
         * a UTF8 handler. Similar approach for unaffiliated glyph/symbols
         * non-UTF color customizations
         */
            add_custom_urep_entry(game.symset[idx].name, glyph, uval, utf8str, game.symset_which_set);
        } else {
            if (!__to_custom_symset_entry_callback_glyphnag++) {
                config_error_add("Unimplemented customization feature, ignoring for now");
            }
        }
    }
    if (findwhat.color) {
        if (game.symset[idx].name) {
            add_custom_nhcolor_entry(game.symset[idx].name, glyph, findwhat.color, game.symset_which_set);
        } else {
            if (!__to_custom_symset_entry_callback_colornag++) {
                config_error_add("Unimplemented customization feature, ignoring for now");
            }
        }
    }
}
/*
 * Return value:
 *               1 = success
 *               0 = failure
 */
export async function glyphrep_to_custom_map_entries(op, glyphptr) {
    Object.assign(game.to_custom_symbol_find, zero_find);
    let buf = '';
    let c_glyphid = null;
    let c_unicode = null;
    let c_colorval = null;
    let cp = null;
    let reslt = 0;
    let rgb = 0;
    let slash = (0);
    let colon = (0);
    if (!game.glyphid_cache) {
        reslt = 1;
    }
    ((reslt));
    buf = nh_snprintf("glyphrep_to_custom_map_entries", 126, buf, 256 /* sizeof(char [256]) */, "%s", op);
    /* for debugger use only; no cache available */
    c_unicode = c_colorval = null;
    c_glyphid = cp = buf;
    while (__nh_char_at0(cp)) {
        if (__nh_char_at0(cp) == 58 || __nh_char_at0(cp) == 47) {
            if (__nh_char_at0(cp) == 58) {
                colon = (1);
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            }
            if (__nh_char_at0(cp) == 47) {
                slash = (1);
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            }
        }
        (cp = __nh_advance_str(cp, 1));
        if (colon) {
            c_unicode = cp;
            colon = (0);
        }
        if (slash) {
            c_colorval = cp;
            slash = (0);
        }
    }
    if (c_glyphid && __nh_char_at0(c_glyphid) == 32) {
        (c_glyphid = __nh_advance_str(c_glyphid, 1));
    }
    if (c_colorval && __nh_char_at0(c_colorval) == 32) {
        (c_colorval = __nh_advance_str(c_colorval, 1));
    }
    if (c_unicode && __nh_char_at0(c_unicode) == 32) {
        while (__nh_char_at0(c_unicode) == 32) {
            (c_unicode = __nh_advance_str(c_unicode, 1));
        }
    }
    if (c_unicode && !__nh_char_at0(c_unicode)) {
        c_unicode = null;
    }
    if ((c_colorval && (rgb = rgbstr_to_int32(c_colorval)) != -1) || !c_colorval) {
        /* if the color 0 is an actual color, as opposed to just "not set"
           we set a marker bit outside the 24-bit range to indicate a
           valid color value 0. That allows valid color 0, but allows a
           simple checking for 0 to detect "not set". The window port that
           implements the color switch, needs to either check that bit
           or appropriately mask colors with 0xFFFFFF. */
        game.to_custom_symbol_find.color = (rgb == -1 || !c_colorval) ? 0 : (rgb == 0) ? nonzero_black : rgb;
    }
    if (c_unicode) {
        game.to_custom_symbol_find.unicode_val = c_unicode;
    }
    game.to_custom_symbol_find.extraval = glyphptr;
    game.to_custom_symbol_find.callback = to_custom_symset_entry_callback;
    reslt = await glyph_find_core(c_glyphid, game.to_custom_symbol_find);
    return reslt;
}
export function fix_glyphname(str) {
    let __nh_c_idx = 0;
    for (__nh_c_idx = 0; __nh_char_at0(__nh_advance_str(str, __nh_c_idx)); __nh_c_idx++) {
        if (__nh_char_at0(__nh_advance_str(str, __nh_c_idx)) >= 65 && __nh_char_at0(__nh_advance_str(str, __nh_c_idx)) <= 90) {
            __nh_char_at0(__nh_advance_str(str, __nh_c_idx)) += (97 - 65);
        } else if (__nh_char_at0(__nh_advance_str(str, __nh_c_idx)) >= 48 && __nh_char_at0(__nh_advance_str(str, __nh_c_idx)) <= 57) {
            ;
        } else if (__nh_char_at0(__nh_advance_str(str, __nh_c_idx)) < 97 || __nh_char_at0(__nh_advance_str(str, __nh_c_idx)) > 122) {
            str = str.slice(0, __nh_c_idx) + String.fromCharCode(95);
        }
    }
    return str;
}
export function glyph_to_cmap(glyph) {
    if (glyph == GLYPH_CMAP_STONE_OFF) {
        return S_stone;
    } else if (((glyph) >= GLYPH_CMAP_MAIN_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_MAIN_OFF))) {
        return (glyph - GLYPH_CMAP_MAIN_OFF) + S_vwall;
    } else if (((glyph) >= GLYPH_CMAP_MINES_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_MINES_OFF))) {
        return (glyph - GLYPH_CMAP_MINES_OFF) + S_vwall;
    } else if (((glyph) >= GLYPH_CMAP_GEH_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_GEH_OFF))) {
        return (glyph - GLYPH_CMAP_GEH_OFF) + S_vwall;
    } else if (((glyph) >= GLYPH_CMAP_KNOX_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_KNOX_OFF))) {
        return (glyph - GLYPH_CMAP_KNOX_OFF) + S_vwall;
    } else if (((glyph) >= GLYPH_CMAP_SOKO_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_SOKO_OFF))) {
        return (glyph - GLYPH_CMAP_SOKO_OFF) + S_vwall;
    } else if (((glyph) >= GLYPH_CMAP_A_OFF && (glyph) < (((S_brdnladder - S_ndoor) + 1) + GLYPH_CMAP_A_OFF))) {
        return (glyph - GLYPH_CMAP_A_OFF) + S_ndoor;
    } else if (((glyph) >= GLYPH_ALTAR_OFF && (glyph) < (5 + GLYPH_ALTAR_OFF))) {
        return S_altar;
    } else if (((glyph) >= GLYPH_CMAP_B_OFF && ((glyph) < ((S_arrow_trap + (TRAPNUM - 1) - S_grave) + GLYPH_CMAP_B_OFF)))) {
        return (glyph - GLYPH_CMAP_B_OFF) + S_grave;
    } else if (((glyph) >= GLYPH_CMAP_C_OFF && (glyph) < (((S_goodpos - S_digbeam) + 1) + GLYPH_CMAP_C_OFF))) {
        return (glyph - GLYPH_CMAP_C_OFF) + S_digbeam;
    } else if (((glyph) >= GLYPH_ZAP_OFF && (glyph) < ((8 << 2) + GLYPH_ZAP_OFF))) {
        return ((glyph - GLYPH_ZAP_OFF) % 4) + S_vbeam;
    } else if (((glyph) >= GLYPH_SWALLOW_OFF && (glyph) < (((NUMMONS << 3) + GLYPH_SWALLOW_OFF)))) {
        return (((glyph) >= GLYPH_SWALLOW_OFF && (glyph) < (((NUMMONS << 3) + GLYPH_SWALLOW_OFF))) ? (((glyph) - GLYPH_SWALLOW_OFF) & 7) : 0) + S_sw_tl;
    } else if (((glyph) >= GLYPH_EXPLODE_OFF && (glyph) < (9 + GLYPH_EXPLODE_FROSTY_OFF))) {
        return (((glyph) >= GLYPH_EXPLODE_OFF && (glyph) < (9 + GLYPH_EXPLODE_FROSTY_OFF)) ? (((glyph) - GLYPH_EXPLODE_OFF) % (S_expl_br - S_expl_tl + 1)) : 0) + S_expl_tl;
    /* MAXPCHARS is legal array index because
                              * of trailing fencepost entry */
    } else {
        return MAXPCHARS;
    }
}
export async function glyph_find_core(id, findwhat) {
    let glyph = 0;
    let do_callback = 0;
    let end_find = (0);
    if (await parse_id(id, findwhat)) {
        if (findwhat.findtype == find_glyph) {
            (findwhat.callback)(findwhat.val, findwhat);
        } else {
            for (glyph = 0; glyph < MAX_GLYPH; ++glyph) {
                do_callback = (0);
                switch (findwhat.findtype) {
                    case find_cmap:
                        if (glyph_to_cmap(glyph) == findwhat.val) {
                            do_callback = (1);
                        }
                        break;
                    case find_pm:
                        if (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) && game.mons[(((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_FEM_OFF) : ((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_MALE_OFF) : ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_FEM_OFF) : ((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_MALE_OFF) : ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_FEM_OFF) : ((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_MALE_OFF) : ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_FEM_OFF) : ((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_MALE_OFF) : NUMMONS)].mlet == findwhat.val) {
                            do_callback = (1);
                        }
                        break;
                    case find_oc:
                        if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))))) && (((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))) ? CORPSE : (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) ? STATUE : (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) ? ((glyph) - (((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : ((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) ? ((glyph) - (((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS))) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : NUM_OBJECTS) == findwhat.val) {
                            do_callback = (1);
                        }
                        break;
                    case find_glyph:
                        if (glyph == findwhat.val) {
                            do_callback = (1);
                            end_find = (1);
                        }
                        break;
                    case find_nothing:
                    default:
                        end_find = (1);
                        break;
                }
                if (do_callback) {
                    (findwhat.callback)(glyph, findwhat);
                }
                if (end_find) {
                    break;
                }
            }
        }
        return 1;
    }
    return 0;
}
/*
 When we start to process a config file or a symbol file,
 that might have G_ entries, generating all 9000+ glyphid
 for comparison repeatedly each time we encounter a G_
 entry to decipher, then comparing against them, is obviously
 extremely performance-poor.

 Setting aside the "comparison" part for now (that has to be
 done in some manner), we can likely do something about the
 repeated "generation" of the names for parsing prior to the
 actual comparison part by generating them once, ahead of the
 bulk of the potential parsings. We can later free up
 all the memory those names consumed once the bulk parsing is
 over with.
*/
export async function fill_glyphid_cache() {
    let reslt = 0;
    if (!game.glyphid_cache) {
        init_glyph_cache();
    }
    if (game.glyphid_cache) {
        Object.assign(game.glyphcache_find, zero_find);
        game.glyphcache_find.findtype = find_nothing;
        game.glyphcache_find.reserved = game.glyphid_cache;
        game.glyphcache_find.restype = res_fill_cache;
        reslt = await parse_id(null, game.glyphcache_find);
        if (!reslt) {
            free_glyphid_cache();
            game.glyphid_cache = null;
        }
    }
}
/*
 * The glyph ID cache is a simple double-hash table.
 * The cache size is a power of two, and two hashes are derived from the
 * cache ID. The first is a location in the table, and the second is an
 * offset. On any collision, the second hash is added to the first until
 * a match or an empty bucket is found.
 * The second hash is an odd number, which is necessary and sufficient
 * to traverse the entire table.
 */
export function init_glyph_cache() {
    let glyph = 0;
    /* Cache size of power of 2 not less than 2*MAX_GLYPH */
    game.glyphid_cache_lsize = 0;
    game.glyphid_cache_size = 1;
    while (game.glyphid_cache_size < 2 * MAX_GLYPH) {
        ++game.glyphid_cache_lsize;
        game.glyphid_cache_size <<= 1;
    }
    game.glyphid_cache = alloc(game.glyphid_cache_size * 1 /* sizeof(struct glyphid_cache_t) */);
    for (glyph = 0; glyph < game.glyphid_cache_size; ++glyph) {
        game.glyphid_cache[glyph].glyphnum = 0;
        game.glyphid_cache[glyph].id = null;
    }
}
export function free_glyphid_cache() {
    let idx = 0;
    if (!game.glyphid_cache) {
        return;
    }
    for (idx = 0; idx < game.glyphid_cache_size; ++idx) {
        if (game.glyphid_cache[idx].id) {
            free(game.glyphid_cache[idx].id);
            game.glyphid_cache[idx].id = null;
        }
    }
    free(game.glyphid_cache);
    game.glyphid_cache = null;
}
export async function add_glyph_to_cache(glyphnum, id) {
    let hash = glyph_hash(id);
    let hash1 = (hash & (game.glyphid_cache_size - 1));
    let hash2 = (((hash >> game.glyphid_cache_lsize) & (game.glyphid_cache_size - 1)) | 1);
    let i = hash1;
    do {
        if (game.glyphid_cache[i].id == (null)) {
            game.glyphid_cache[i].id = dupstr(id);
            game.glyphid_cache[i].glyphnum = glyphnum;
            return;
        }
        /* For speed, assume that no ID occurs twice */
        i = (i + hash2) & (game.glyphid_cache_size - 1);
    } while (i != hash1);
    await panic("glyphid_cache full");
}
export function find_glyph_in_cache(id) {
    let hash = glyph_hash(id);
    let hash1 = (hash & (game.glyphid_cache_size - 1));
    let hash2 = (((hash >> game.glyphid_cache_lsize) & (game.glyphid_cache_size - 1)) | 1);
    let i = hash1;
    do {
        if (game.glyphid_cache[i].id == (null)) {
            return -1;
        }
        if (strncmpi((id), (game.glyphid_cache[i].id), -1) == 0) {
            return game.glyphid_cache[i].glyphnum;
        }
        i = (i + hash2) & (game.glyphid_cache_size - 1);
    } while (i != hash1);
    return -1;
}
export function find_glyphid_in_cache_by_glyphnum(glyphnum) {
    let idx = 0;
    if (!game.glyphid_cache) {
        return null;
    }
    for (idx = 0; idx < game.glyphid_cache_size; ++idx) {
        if (game.glyphid_cache[idx].glyphnum == glyphnum && game.glyphid_cache[idx].id != null) {
            return game.glyphid_cache[idx].id;
        }
    }
    return null;
}
export function glyph_hash(id) {
    let hash = 0;
    let i = 0;
    for (i = 0; __nh_char_at0(__nh_advance_str(id, i)) != 0; ++i) {
        let ch = __nh_char_at0(__nh_advance_str(id, i));
        if (65 <= ch && ch <= 90) {
            ch += 97 - 65;
        }
        hash = (hash << 1) | (hash >> 31);
        hash ^= ch;
    }
    return hash;
}
export function glyphid_cache_status() {
    return (game.glyphid_cache != null);
}
export async function match_glyph(buf) {
    let workbuf = '';
    workbuf = nh_snprintf("match_glyph", 465, workbuf, 256 /* sizeof(char [256]) */, "%s", buf);
    return await glyphrep(workbuf);
}
export async function glyphrep(op) {
    let reslt = 0;
    let glyph = MAX_GLYPH;
    if (!game.glyphid_cache) {
        reslt = 1;
    }
    ((reslt));
    reslt = await glyphrep_to_custom_map_entries(op, { get value() { return glyph; }, set value(_v) { glyph = _v; } });
    if (reslt) {
        return 1;
    }
    return 0;
}
export function add_custom_nhcolor_entry(customization_name, glyphidx, nhcolor, which_set) {
    let gdc = game.sym_customizations[which_set][custom_nhcolor];
    let details = null;
    let newdetails = null;
    if (!gdc.details) {
        gdc.customization_name = dupstr(customization_name);
        gdc.custtype = custom_nhcolor;
        gdc.details = null;
        gdc.details_end = null;
    }
    details = find_matching_customization(customization_name, custom_nhcolor, which_set);
    if (details) {
        while (details) {
            if (details.content.ccolor.glyphidx == glyphidx) {
                details.content.ccolor.nhcolor = nhcolor;
                return 1;
            }
            details = details.next;
        }
    }
    /* create new details entry */
    newdetails = alloc(1 /* sizeof(struct customization_detail) */);
    newdetails.content.urep.glyphidx = glyphidx;
    newdetails.content.ccolor.nhcolor = nhcolor;
    newdetails.next = null;
    if (gdc.details == (null)) {
        gdc.details = newdetails;
    } else {
        gdc.details_end.next = newdetails;
    }
    gdc.details_end = newdetails;
    gdc.count++;
    return 1;
}
export function apply_customizations(which_set, docustomize) {
    let gmap = null;
    let details = null;
    let sc = null;
    let at_least_one = (0);
    let do_colors = ((docustomize & do_custom_colors) != 0);
    let do_symbols = ((docustomize & do_custom_symbols) != 0);
    let custs = 0;
    for (custs = 0; custs < custom_count; ++custs) {
        sc = game.sym_customizations[which_set][custs];
        if (sc.count && sc.details) {
            at_least_one = (1);
            /* These glyph customizations get applied to the glyphmap array,
               not to symset entries */
            details = sc.details;
            while (details) {
                if (game.iflags.customsymbols && do_symbols) {
                    if (sc.custtype == custom_ureps) {
                        gmap = game.glyphmap[details.content.urep.glyphidx];
                        if (game.symset[which_set].handling == H_UTF8) {
                            set_map_u(gmap, details.content.urep.u.utf32ch, details.content.urep.u.utf8str);
                        }
                    }
                }
                if (game.iflags.customcolors && do_colors) {
                    if (sc.custtype == custom_nhcolor) {
                        gmap = game.glyphmap[details.content.ccolor.glyphidx];
                        set_map_customcolor(gmap, details.content.ccolor.nhcolor);
                    }
                }
                details = details.next;
            }
        }
    }
    game.iflags.pending_customizations = at_least_one;
}
/* Shuffle the customizations to match shuffled object descriptions,
 * so a red potion isn't displayed with a blue customization, and so on.
 */
export function maybe_shuffle_customizations() {
    if (game.iflags.pending_customizations) {
        shuffle_customizations();
        game.iflags.pending_customizations = 0;
    }
}
/*
             * Shuffling gem appearances can cause the same oc_descr_idx to
             * appear more than once. Detect this condition and ensure that
             * each pointer points to a unique allocation.
             */
/* Current structure already appears in tmp_u */
/* Some glyphmaps may not have been transferred */
const __shuffle_customizations_offsets = [GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF];
export function shuffle_customizations() {
    let j = 0;
    for (j = 0; j < (Math.trunc(8 /* sizeof(const int [2]) */ / 4 /* sizeof(const int) */)); j++) {
        let obj_glyphs = game.glyphmap + __shuffle_customizations_offsets[j];
        let i = 0;
        let tmp_u = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
        let tmp_customcolor = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let tmp_color256idx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let duplicate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < NUM_OBJECTS; i++) {
            duplicate[i] = -1;
            tmp_u[i] = null;
            tmp_customcolor[i] = 0;
            tmp_color256idx[i] = 0;
        }
        for (i = 0; i < NUM_OBJECTS; i++) {
            let idx = game.objects[i].oc_descr_idx;
            if (duplicate[idx] >= 0) {
                let other = tmp_u[duplicate[idx]];
                let other_customcolor = tmp_customcolor[duplicate[idx]];
                let other_color256idx = tmp_color256idx[duplicate[idx]];
                tmp_customcolor[i] = other_customcolor;
                tmp_color256idx[i] = other_color256idx;
                if (other) {
                    tmp_u[i] = alloc(1 /* sizeof(struct unicode_representation) */);
                    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = other) */;
                    if (other.utf8str != (null)) {
                        tmp_u[i].utf8str = dupstr(other.utf8str);
                    }
                }
            } else {
                tmp_customcolor[i] = obj_glyphs[idx].customcolor;
                tmp_color256idx[i] = obj_glyphs[idx].color256idx;
                tmp_u[i] = obj_glyphs[idx].u;
                if (obj_glyphs[idx].u != (null) || obj_glyphs[idx].customcolor != 0) {
                    duplicate[idx] = i;
                    obj_glyphs[idx].u = null;
                    obj_glyphs[idx].customcolor = 0;
                    obj_glyphs[idx].color256idx = 0;
                }
            }
        }
        for (i = 0; i < NUM_OBJECTS; i++) {
            if (obj_glyphs[i].u != (null)) {
                free(obj_glyphs[i].u.utf8str);
                free(obj_glyphs[i].u);
            }
            obj_glyphs[i].u = tmp_u[i];
            obj_glyphs[i].customcolor = tmp_customcolor[i];
            obj_glyphs[i].color256idx = tmp_color256idx[i];
        }
    }
}
export function find_matching_customization(customization_name, custtype, which_set) {
    let gdc = game.sym_customizations[which_set][custtype];
    if ((gdc.custtype == custtype) && gdc.customization_name && (strcmp(customization_name, gdc.customization_name) == 0)) {
        return gdc.details;
    }
    return null;
}
export function purge_all_custom_entries() {
    let i = 0;
    for (i = 0; i < NUM_GRAPHICS + 1; ++i) {
        purge_custom_entries(i);
    }
}
export function purge_custom_entries(which_set) {
    let custtype = 0;
    let gdc = null;
    let details = null;
    let next = null;
    for (custtype = custom_none; custtype < custom_count; ++custtype) {
        gdc = game.sym_customizations[which_set][custtype];
        details = gdc.details;
        while (details) {
            next = details.next;
            if (gdc.custtype == custom_ureps) {
                if (details.content.urep.u.utf8str) {
                    free(details.content.urep.u.utf8str);
                }
                details.content.urep.u.utf8str = null;
            } else if (gdc.custtype == custom_symbols) {
                details.content.sym.symparse = null;
                details.content.sym.val = 0;
            } else if (gdc.custtype == custom_nhcolor) {
                details.content.ccolor.nhcolor = 0;
                details.content.ccolor.glyphidx = 0;
            }
            free(details);
            details = next;
        }
        gdc.details = null;
        gdc.details_end = null;
        if (gdc.customization_name) {
            free(gdc.customization_name);
            gdc.customization_name = null;
        }
        gdc.count = 0;
    }
}
export async function dump_all_glyphids(fp) {
    let dump_glyphid_find = zero_find;
    dump_glyphid_find.findtype = find_nothing;
    dump_glyphid_find.reserved = fp;
    dump_glyphid_find.restype = res_dump_glyphids;
    await parse_id(null, dump_glyphid_find);
}
export async function wizcustom_glyphids(win) {
    let glyphnum = 0;
    let id = null;
    if (!game.glyphid_cache) {
        return;
    }
    for (glyphnum = 0; glyphnum < MAX_GLYPH; ++glyphnum) {
        id = find_glyphid_in_cache_by_glyphnum(glyphnum);
        if (id) {
            await wizcustom_callback(win, glyphnum, id);
        }
    }
}
const __parse_id_altar_text = ["unaligned", "chaotic", "neutral", "lawful", "other"];
const __parse_id_zap_texts = ["missile", "fire", "frost", "sleep", "death", "lightning", "poison gas", "acid"];
const __parse_id_swallow_texts = ["top left", "top center", "top right", "middle left", "middle right", "bottom left", "bottom center", "bottom right"];
const __parse_id_expl_type_texts = ["dark", "noxious", "muddy", "wet", "magical", "fiery", "frosty"];
const __parse_id_expl_texts = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
export async function parse_id(id, findwhat) {
    let fp = null;
    let i = 0;
    let j = 0;
    let mnum = 0;
    let glyph = 0;
    let pm_offset = 0;
    let oc_offset = 0;
    let cmap_offset = 0;
    let pm_count = 0;
    let oc_count = 0;
    let cmap_count = 0;
    let skip_base = (0);
    let skip_this_one = (0);
    let dump_ids = (0);
    let filling_cache = (0);
    let is_S = (0);
    let is_G = (0);
    let buf = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
    if (findwhat.findtype == find_nothing && findwhat.restype) {
        if (findwhat.restype == res_dump_glyphids) {
            if (findwhat.reserved) {
                fp = findwhat.reserved;
                dump_ids = (1);
            } else {
                return 0;
            }
        }
        if (findwhat.restype == res_fill_cache) {
            if (findwhat.reserved && findwhat.reserved == game.glyphid_cache) {
                filling_cache = (1);
            } else {
                return 0;
            }
        }
    }
    is_G = (id && __nh_char_at0(id) == 71 && __nh_char_at0(__nh_advance_str(id, 1)) == 95);
    is_S = (id && __nh_char_at0(id) == 83 && __nh_char_at0(__nh_advance_str(id, 1)) == 95);
    if ((is_G && !game.glyphid_cache) || filling_cache || dump_ids || is_S) {
        while (loadsyms[i].range) {
            if (!pm_offset && loadsyms[i].range == SYM_MON) {
                pm_offset = i;
            }
            if (!pm_count && pm_offset && loadsyms[i].range != SYM_MON) {
                pm_count = i - pm_offset;
            }
            if (!oc_offset && loadsyms[i].range == SYM_OC) {
                oc_offset = i;
            }
            if (!oc_count && oc_offset && loadsyms[i].range != SYM_OC) {
                oc_count = i - oc_offset;
            }
            if (!cmap_offset && loadsyms[i].range == SYM_PCHAR) {
                cmap_offset = i;
            }
            if (!cmap_count && cmap_offset && loadsyms[i].range != SYM_PCHAR) {
                cmap_count = i - cmap_offset;
            }
            i++;
        }
    }
    if (is_G || filling_cache || dump_ids) {
        if (!filling_cache && id && game.glyphid_cache) {
            let val = find_glyph_in_cache(id);
            if (val >= 0) {
                findwhat.findtype = find_glyph;
                findwhat.val = val;
                findwhat.loadsyms_offset = 0;
                return 1;
            } else {
                return 0;
            }
        } else {
            let buf2 = null;
            let buf3 = null;
            let buf4 = null;
            for (glyph = 0; glyph < MAX_GLYPH; ++glyph) {
                /* individual matching glyph entries */
                skip_base = (0);
                skip_this_one = (0);
                (((buf[3][0] = 0, buf[2][0] = 0), buf[1][0] = 0), buf[0][0] = 0);
                if (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
                    /* buf2 will hold the distinguishing prefix */
                    /* buf3 will hold the base name */
                    /* buf4 will hold the distinguishing suffix */
                    buf2 = "";
                    buf3 = monsdump[(((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_FEM_OFF) : ((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_MALE_OFF) : ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_FEM_OFF) : ((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_MALE_OFF) : ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_FEM_OFF) : ((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_MALE_OFF) : ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_FEM_OFF) : ((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_MALE_OFF) : NUMMONS)].nm;
                    if (((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS))) {
                        buf2 = "male_";
                    } else if (((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) {
                        buf2 = "female_";
                    } else if (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS))) {
                        buf2 = "ridden_male_";
                    } else if (((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) {
                        buf2 = "ridden_female_";
                    } else if (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS))) {
                        buf2 = "detected_male_";
                    } else if (((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))) {
                        buf2 = "detected_female_";
                    } else if (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS))) {
                        buf2 = "pet_male_";
                    } else if (((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) {
                        buf2 = "pet_female_";
                    }
                    buf[0] = strcpy(buf[0], "G_");
                    buf[0] = strcat(buf[0], buf2);
                    buf[0] = strcat(buf[0], buf3);
                } else if (((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))))) {
                    buf2 = (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))) ? "piletop_body_" : "body_";
                    buf3 = monsdump[((((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))) ? ((glyph) - GLYPH_BODY_PILETOP_OFF) : ((glyph) - GLYPH_BODY_OFF))].nm;
                    buf[0] = strcpy(buf[0], "G_");
                    buf[0] = strcat(buf[0], buf2);
                    buf[0] = strcat(buf[0], buf3);
                } else if ((((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS)))))) {
                    buf2 = (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))) ? "piletop_statue_of_female_" : ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS)))) ? "statue_of_female_" : (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS))) ? "piletop_statue_of_male_" : ((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) ? "statue_of_male_" : "";
                    buf3 = monsdump[((((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))) ? ((glyph) - GLYPH_STATUE_FEM_PILETOP_OFF) : (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS))) ? ((glyph) - GLYPH_STATUE_MALE_PILETOP_OFF) : ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS)))) ? ((glyph) - GLYPH_STATUE_FEM_OFF) : ((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) ? ((glyph) - GLYPH_STATUE_MALE_OFF) : MAX_GLYPH)].nm;
                    buf[0] = strcpy(buf[0], "G_");
                    buf[0] = strcat(buf[0], buf2);
                    buf[0] = strcat(buf[0], buf3);
                } else if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
                    i = (((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))) ? CORPSE : (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) ? STATUE : (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) ? ((glyph) - (((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : ((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) ? ((glyph) - (((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS))) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : NUM_OBJECTS);
                    if (((i > SCR_STINKING_CLOUD) && (i < SCR_MAIL)) || ((i > WAN_LIGHTNING) && (i < GOLD_PIECE))) {
                        skip_this_one = (1);
                    }
                    if (!skip_this_one) {
                        if ((i >= WAN_LIGHT) && (i <= WAN_LIGHTNING)) {
                            buf2 = "wand of ";
                        } else if ((i >= SPE_DIG) && (i < SPE_BLANK_PAPER)) {
                            buf2 = "spellbook of ";
                        } else if ((i >= SCR_ENCHANT_ARMOR) && (i <= SCR_STINKING_CLOUD)) {
                            buf2 = "scroll of ";
                        } else if ((i >= POT_GAIN_ABILITY) && (i <= POT_WATER)) {
                            buf2 = (i == POT_WATER) ? "flask of n" : "potion of ";
                        } else if ((i >= RIN_ADORNMENT) && (i <= RIN_PROTECTION_FROM_SHAPE_CHAN)) {
                            buf2 = "ring of ";
                        } else if (i == LAND_MINE) {
                            buf2 = "unset ";
                        } else {
                            buf2 = "";
                        }
                        buf3 = (i == SCR_BLANK_PAPER) ? "blank scroll" : (i == SPE_BLANK_PAPER) ? "blank spellbook" : (i == SLIME_MOLD) ? "slime mold" : game.obj_descr[i].oc_name ? game.obj_descr[i].oc_name : game.obj_descr[i].oc_descr;
                        buf[0] = strcpy(buf[0], "G_");
                        if (((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) {
                            buf[0] = strcat(buf[0], "piletop_");
                        }
                        buf[0] = strcat(buf[0], buf2);
                        buf[0] = strcat(buf[0], buf3);
                    }
                } else if (((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) || ((glyph) >= GLYPH_ZAP_OFF && (glyph) < ((8 << 2) + GLYPH_ZAP_OFF)) || ((glyph) >= GLYPH_SWALLOW_OFF && (glyph) < (((NUMMONS << 3) + GLYPH_SWALLOW_OFF))) || ((glyph) >= GLYPH_EXPLODE_OFF && (glyph) < (9 + GLYPH_EXPLODE_FROSTY_OFF))) {
                    let cmap = -1;
                    buf2 = "";
                    buf3 = "";
                    buf4 = "";
                    if (glyph == GLYPH_CMAP_OFF) {
                        cmap = S_stone;
                        buf3 = "stone substrate";
                        skip_base = (1);
                    } else if (((glyph) >= GLYPH_CMAP_GEH_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_GEH_OFF))) {
                        cmap = (glyph - GLYPH_CMAP_GEH_OFF) + S_vwall;
                        buf4 = "_gehennom";
                    } else if (((glyph) >= GLYPH_CMAP_KNOX_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_KNOX_OFF))) {
                        cmap = (glyph - GLYPH_CMAP_KNOX_OFF) + S_vwall;
                        buf4 = "_knox";
                    } else if (((glyph) >= GLYPH_CMAP_MAIN_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_MAIN_OFF))) {
                        cmap = (glyph - GLYPH_CMAP_MAIN_OFF) + S_vwall;
                        buf4 = "_main";
                    } else if (((glyph) >= GLYPH_CMAP_MINES_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_MINES_OFF))) {
                        cmap = (glyph - GLYPH_CMAP_MINES_OFF) + S_vwall;
                        buf4 = "_mines";
                    } else if (((glyph) >= GLYPH_CMAP_SOKO_OFF && (glyph) < (((S_trwall - S_vwall) + 1) + GLYPH_CMAP_SOKO_OFF))) {
                        cmap = (glyph - GLYPH_CMAP_SOKO_OFF) + S_vwall;
                        buf4 = "_sokoban";
                    } else if (((glyph) >= GLYPH_CMAP_A_OFF && (glyph) < (((S_brdnladder - S_ndoor) + 1) + GLYPH_CMAP_A_OFF))) {
                        cmap = (glyph - GLYPH_CMAP_A_OFF) + S_ndoor;
                    } else if (((glyph) >= GLYPH_ALTAR_OFF && (glyph) < (5 + GLYPH_ALTAR_OFF))) {
                        j = (glyph - GLYPH_ALTAR_OFF);
                        cmap = S_altar;
                        if (j != altar_other) {
                            buf[2] = nh_snprintf("parse_id", 1025, buf[2], 128 /* sizeof(char [128]) */, "%s_", __parse_id_altar_text[j]);
                            buf2 = buf[2];
                        } else {
                            buf3 = "altar other";
                            skip_base = (1);
                        }
                    } else if (((glyph) >= GLYPH_CMAP_B_OFF && ((glyph) < ((S_arrow_trap + (TRAPNUM - 1) - S_grave) + GLYPH_CMAP_B_OFF)))) {
                        cmap = (glyph - GLYPH_CMAP_B_OFF) + S_grave;
                    } else if (((glyph) >= GLYPH_ZAP_OFF && (glyph) < ((8 << 2) + GLYPH_ZAP_OFF))) {
                        j = (glyph - GLYPH_ZAP_OFF);
                        cmap = (j % 4) + S_vbeam;
                        buf[2] = nh_snprintf("parse_id", 1042, buf[2], 128 /* sizeof(char [128]) */, "%s", loadsyms[cmap + cmap_offset].name + 2);
                        buf[3] = nh_snprintf("parse_id", 1044, buf[3], 128 /* sizeof(char [128]) */, "%s zap %s", __parse_id_zap_texts[Math.trunc(j / 4)], fix_glyphname(buf[2]));
                        buf3 = buf[3];
                        buf2 = "";
                        skip_base = (1);
                    } else if (((glyph) >= GLYPH_CMAP_C_OFF && (glyph) < (((S_goodpos - S_digbeam) + 1) + GLYPH_CMAP_C_OFF))) {
                        cmap = (glyph - GLYPH_CMAP_C_OFF) + S_digbeam;
                    } else if (((glyph) >= GLYPH_SWALLOW_OFF && (glyph) < (((NUMMONS << 3) + GLYPH_SWALLOW_OFF)))) {
                        j = glyph - GLYPH_SWALLOW_OFF;
                        cmap = (((glyph) >= GLYPH_SWALLOW_OFF && (glyph) < (((NUMMONS << 3) + GLYPH_SWALLOW_OFF))) ? (((glyph) - GLYPH_SWALLOW_OFF) & 7) : 0);
                        mnum = Math.trunc(j / ((S_sw_br - S_sw_tl) + 1));
                        buf[3] = strcpy(buf[3], "swallow ");
                        buf[3] = strcat(buf[3], monsdump[mnum].nm);
                        buf[3] = strcat(buf[3], " ");
                        buf[3] = strcat(buf[3], __parse_id_swallow_texts[cmap]);
                        buf3 = buf[3];
                        skip_base = (1);
                    } else if (((glyph) >= GLYPH_EXPLODE_OFF && (glyph) < (9 + GLYPH_EXPLODE_FROSTY_OFF))) {
                        let expl = 0;
                        j = glyph - GLYPH_EXPLODE_OFF;
                        expl = Math.trunc(j / ((S_expl_br - S_expl_tl) + 1));
                        cmap = (((glyph) >= GLYPH_EXPLODE_OFF && (glyph) < (9 + GLYPH_EXPLODE_FROSTY_OFF)) ? (((glyph) - GLYPH_EXPLODE_OFF) % (S_expl_br - S_expl_tl + 1)) : 0) + S_expl_tl;
                        i = cmap - S_expl_tl;
                        buf[2] = nh_snprintf("parse_id", 1082, buf[2], 128 /* sizeof(char [128]) */, "%s ", __parse_id_expl_type_texts[expl]);
                        buf2 = buf[2];
                        buf[3] = nh_snprintf("parse_id", 1085, buf[3], 128 /* sizeof(char [128]) */, "%s%s", "expl_", __parse_id_expl_texts[i]);
                        buf3 = buf[3];
                        skip_base = (1);
                    }
                    if (!skip_base) {
                        if (cmap >= 0 && cmap < MAXPCHARS) {
                            buf3 = loadsyms[cmap + cmap_offset].name + 2;
                        }
                    }
                    buf[0] = strcpy(buf[0], "G_");
                    buf[0] = strcat(buf[0], buf2);
                    buf[0] = strcat(buf[0], buf3);
                    buf[0] = strcat(buf[0], buf4);
                } else if (((glyph) == GLYPH_INVIS_OFF)) {
                    buf[0] = strcpy(buf[0], "G_invisible");
                } else if (((glyph) == GLYPH_NOTHING_OFF)) {
                    buf[0] = strcpy(buf[0], "G_nothing");
                } else if (((glyph) == GLYPH_UNEXPLORED_OFF)) {
                    buf[0] = strcpy(buf[0], "G_unexplored");
                } else if (((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6))) {
                    j = glyph - GLYPH_WARNING_OFF;
                    buf[0] = nh_snprintf("parse_id", 1106, buf[0], 128 /* sizeof(char [128]) */, "G_%s%d", "warning", j);
                }
                if (memchr(buf[0], 0, 128 /* sizeof(char [128]) */) == (null)) {
                    await panic("parse_id: buf[0] overflowed");
                }
                if (!skip_this_one) {
                    fix_glyphname(buf[0] + 2);
                    if (dump_ids) {
                        fprintf(fp, "(%04d) %s\n", glyph, buf[0]);
                    } else if (filling_cache) {
                        await add_glyph_to_cache(glyph, buf[0]);
                    } else if (id) {
                        if (!strncmpi((id), (buf[0]), -1)) {
                            findwhat.findtype = find_glyph;
                            findwhat.val = glyph;
                            findwhat.loadsyms_offset = 0;
                            return 1;
                        }
                    }
                }
            }
        }
    } else if (is_S) {
        for (i = 0; i < cmap_count; ++i) {
            if (!strncmpi((loadsyms[i + cmap_offset].name + 2), (__nh_advance_str(id, 2)), -1)) {
                findwhat.findtype = find_cmap;
                findwhat.val = i;
                findwhat.loadsyms_offset = i + cmap_offset;
                return 1;
            }
        }
        for (i = 0; i < oc_count; ++i) {
            if (!strncmpi((loadsyms[i + oc_offset].name + 2), (__nh_advance_str(id, 2)), -1)) {
                findwhat.findtype = find_oc;
                findwhat.val = i;
                findwhat.loadsyms_offset = i + oc_offset;
                return 1;
            }
        }
        for (i = 0; i <= pm_count; ++i) {
            if (!strncmpi((loadsyms[i + pm_offset].name + 2), (__nh_advance_str(id, 2)), -1)) {
                findwhat.findtype = find_pm;
                findwhat.val = i + 1;
                findwhat.loadsyms_offset = i + pm_offset;
                return 1;
            }
        }
    }
    if (dump_ids || filling_cache) {
        return 1;
    }
    findwhat.findtype = find_nothing;
    findwhat.val = 0;
    findwhat.loadsyms_offset = 0;
    return 0;
}
/* extern glyph_map glyphmap[MAX_GLYPH]; */
export function clear_all_glyphmap_colors() {
    let glyph = 0;
    for (glyph = 0; glyph < MAX_GLYPH; ++glyph) {
        if (game.glyphmap[glyph].customcolor) {
            game.glyphmap[glyph].customcolor = 0;
        }
        game.glyphmap[glyph].color256idx = 0;
    }
}
export function reset_customcolors() {
    clear_all_glyphmap_colors();
    apply_customizations(game.currentgraphics, do_custom_colors);
}
/* not used yet */
/* 0 not used yet */
/* if the color 0 is an actual color, as opposed to just "not set"
       we set a marker bit outside the 24-bit range to indicate a
       valid color value 0. That allows valid color 0, but allows a
       simple checking for 0 to detect "not set". The window port that
       implements the color switch, needs to either check that bit
       or appropriately mask colors with 0xFFFFFF. */
/* SOME TEST STUFF */
/* glyphs.c */
/* This should never happen */
/* buf contains a G_ glyph reference, not an S_ symbol.
        There could be an R-G-B color attached too.
        Let's get a copy to work with. */
