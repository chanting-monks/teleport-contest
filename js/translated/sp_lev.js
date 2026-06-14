/* NetHack 5.0	sp_lev.c	$NHDT-Date: 1737610109 2025/01/22 21:28:29 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.373 $ */
/*      Copyright (c) 1989 by Jean-Christophe Collet */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * This file contains the various functions that are related to the special
 * levels.
 *
 * It contains also the special level loader.
 */
import { game } from '../gstate.js';
import { check_mapchr, get_table_boolean_opt, get_table_int, get_table_int_opt, get_table_option, get_table_str, get_table_str_opt, lcheck_param_table, load_lua, luaL_checkinteger, luaL_checkoption, luaL_checkstring, luaL_checktype, luaL_optinteger, luaL_setfuncs, luaL_typename, lua_getfield, lua_gettable, lua_gettop, lua_isnil, lua_isnumber, lua_len, lua_newtable, lua_pop, lua_pushinteger, lua_remove, lua_setglobal, lua_tointeger, lua_tostring, lua_type, nhl_error, nhl_pcall_handle, splev_chr2typ } from '../c2js-runtime/lua.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free, memcpy, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcmp, strlen, strncmp, strncmpi, strstri } from '../c2js-runtime/string.js';
import { artifact_exists } from './artifact.js';
import { placebc, unplacebc } from './ball.js';
import { describe_level } from './botl.js';
import { isok, makemap_prepost } from './cmd.js';
import { create_drawbridge, is_lava, is_pool } from './dbridge.js';
import { cg } from './decl.js';
import { premap_detect } from './detect.js';
import { bury_an_obj } from './dig.js';
import { back_to_glyph, set_wall_state } from './display.js';
import { christen_monst, lookup_novel, oname, safe_oname } from './do_name.js';
import { def_char_to_monclass, def_char_to_objclass, def_monsyms, defsyms } from './drawing.js';
import { Can_dig_down, Can_fall_thru, In_W_tower, In_hell, In_mines, depth, induced_align, on_level } from './dungeon.js';
import { del_engr, del_engr_at, engr_at, make_engr_at, make_grave } from './engrave.js';
import { makeroguerooms } from './extralev.js';
import { in_rooms, monst_to_any } from './hack.js';
import { str_lines_maxlen, stripdigits, swapbits } from './hacklib.js';
import { sobj_at, stackobj } from './invent.js';
import { del_light_source, new_light_source } from './light.js';
import { makemon, mkclass, propagate, set_malign, set_mimic_sym } from './makemon.js';
import { add_door, add_room, add_subroom, clear_level_structures, count_level_features, level_finalize_topology, makecorridors, maybe_sdoor, mineralize, mkstairs, mktrap, okdoor, topologize } from './mklev.js';
import { flood_fill_rm, litstate_rnd, mkmap } from './mkmap.js';
import { create_maze, fix_wall_spines, fixup_special, get_level_extends, pick_vibrasquare_location, set_levltyp, set_levltyp_lit, walkfrom, wallification } from './mkmaze.js';
import { add_to_container, bless, blessorcurse, curse, discard_minvent, mkgold, mkobj_at, mksobj_at, obj_extract_self, remove_object, rndmonnum, set_corpsenm, unbless, uncurse, weight } from './mkobj.js';
import { fill_zoo, inside_room, somex, somexy, somey } from './mkroom.js';
import { mgender_from_permonst, mongone, newcham, select_newcham_form, validvamp } from './mon.js';
import { Resists_Elem, name_to_mon, name_to_monplus, poly_when_stoned, set_mon_data } from './mondata.js';
import { mk_mplayer } from './mplayer.js';
import { ALTAR, ANTHOLE, ANTI_MAGIC, ARMORSHOP, ARROW_TRAP, BARRACKS, BEAR_TRAP, BEEHIVE, BOOKSHOP, BOULDER, CANDLESHOP, CLOUD, COCKNEST, COIN_CLASS, CORPSE, CORR, COURT, CROSSWALL, DART_TRAP, DBWALL, DELPHI, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, DWARVISH_MATTOCK, EGG, FEMALE, FIGURINE, FIRE_TRAP, FODDERSHOP, FOODSHOP, FOUNTAIN, GEM_CLASS, GLYPH_CMAP_C_OFF, GLYPH_CMAP_STONE_OFF, GRAVE, HOLE, HWALL, ICE, INVALID_TYPE, IRONBARS, LADDER, LANDMINE, LAVAPOOL, LAVAWALL, LEPREHALL, LEVEL_TELEP, LOW_PM, LR_BRANCH, LR_DOWNSTAIR, LR_DOWNTELE, LR_MONGEN, LR_PORTAL, LR_TELE, LR_UPSTAIR, LR_UPTELE, LS_MONSTER, LVLINIT_MAZE, LVLINIT_MAZEGRID, LVLINIT_MINES, LVLINIT_NONE, LVLINIT_ROGUE, LVLINIT_SOLIDFILL, LVLINIT_SWAMP, MAGIC_PORTAL, MAGIC_TRAP, MALE, MATCH_WALL, MAXMCLASSES, MAXOCLASSES, MAXPCHARS, MAX_TYPE, MELT_ICE_AWAY, MOAT, MORGUE, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, NEUTRAL, NHLpa_panic, NON_PM, NO_TRAP, NUMMONS, NUM_OBJECTS, OROOM, PICK_AXE, PIT, PM_ARCHEOLOGIST, PM_BABY_GOLD_DRAGON, PM_BLACK_LIGHT, PM_DWARF, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_GNOME, PM_GOLD_DRAGON, PM_MINOTAUR, PM_SALAMANDER, PM_SHOCKING_SPHERE, PM_STALKER, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WIZARD, PM_WIZARD_OF_YENDOR, POLY_TRAP, POOL, POTIONSHOP, POTION_CLASS, PROT_FROM_SHAPE_CHANGERS, RANDOM_CLASS, RINGSHOP, RING_CLASS, RIN_TELEPORTATION, ROCKTRAP, ROLLING_BOULDER_TRAP, ROOM, RUST_TRAP, SADDLE, SCORR, SCROLLSHOP, SCROLL_CLASS, SCR_TELEPORTATION, SDOOR, SHOPBASE, SINK, SLP_GAS_TRAP, SPBOOK_CLASS, SPE_NOVEL, SPIKED_PIT, SQKY_BOARD, STAIRS, STATUE, STATUE_TRAP, STONE, STONE_RES, STRANGE_OBJECT, SWAMP, S_EEL, S_EYE, S_GHOST, S_HUMAN, S_LIGHT, S_MIMIC, S_VAMPIRE, S_digbeam, S_goodpos, TELEP_TRAP, TEMPLE, THEMEROOM, THRONE, TIN, TOOLSHOP, TRAPDOOR, TRAPNUM, TREE, VAULT, VIBRATING_SQUARE, VWALL, WANDSHOP, WAND_CLASS, WAN_DIGGING, WAN_TELEPORTATION, WEAPONSHOP, WEB, ZOO } from './nh-constants.js';
import { oinit } from './o_init.js';
import { simpleonames } from './objnam.js';
import { mk_roamer, priestini } from './priest.js';
import { get_rect, rnd_rect, split_rects } from './rect.js';
import { create_gas_cloud, create_gas_cloud_selection } from './region.js';
import { rn2, rnd } from './rnd.js';
import { selection_clear, selection_clone, selection_do_grow, selection_floodfill, selection_free, selection_getbounds, selection_getpoint, selection_iterate, selection_new, selection_rndcoord, selection_setpoint, set_selection_floodfillchk } from './selvar.js';
import { delete_contents, obfree } from './shk.js';
import { stock_room } from './shknam.js';
import { stairway_add } from './stairs.js';
import { mdrop_special_objs, mpickobj } from './steal.js';
import { can_saddle, place_monster, put_saddle_on_mon } from './steed.js';
import { Strlen_ } from './strutil.js';
import { enexto } from './teleport.js';
import { begin_burn } from './timeout.js';
import { deltrap, maketrap, t_at } from './trap.js';
import { block_point, does_block, vision_reset } from './vision.js';
import { flip_worm_segs_horizontal, flip_worm_segs_vertical } from './worm.js';
import { m_dowear } from './worn.js';

/* macosx complains that these are unused */
/* lua_CFunction prototypes */
/*
     * No need for 'struct instance_globals g' to contain these.
     * sp_level_coder_init() always re-initializes them prior to use.
     */
game.splev_init_present = 0;
game.icedpools = 0;
/* positions touched by level elements explicitly defined in the level */
game.SpLev_Map = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
game.container_idx = 0;
/* next slot in container_obj[] to use */
game.container_obj = [null, null, null, null, null, null, null, null, null, null];
game.invent_carrying_monster = null;
/*
     * end of no 'g.'
     */
export function reset_xystart_size() {
    /* column [0] is off limits */
    game.xstart = 1;
    game.ystart = 0;
    game.xsize = 80 - 1;
    game.ysize = 21;
}
/* Does typ match with levl[][].typ, considering special types
   MATCH_WALL and MAX_TYPE (aka transparency)? */
export function match_maptyps(typ, levltyp) {
    if ((typ == MATCH_WALL) && !((levltyp) <= DBWALL)) {
        /* creation of room failed ? */
        return (0);
    }
    if ((typ < MAX_TYPE) && (typ != levltyp)) {
        return (0);
    }
    return (1);
}
export function mapfrag_fromstr(str) {
    let mf = alloc(1 /* sizeof(struct mapfragment) */);
    let tmps = null;
    mf.data = dupstr(str);
    mf.data = stripdigits(mf.data);
    mf.wid = str_lines_maxlen(mf.data);
    mf.hei = 0;
    tmps = mf.data;
    while (tmps && __nh_char_at0(tmps)) {
        let s1 = strchr(tmps, 10);
        if (mf.hei > 21) {
            free(mf.data);
            free(mf);
            return null;
        }
        if (s1) {
            (s1 = __nh_advance_str(s1, 1));
        }
        tmps = s1;
        mf.hei++;
    }
    return mf;
}
export function mapfrag_free(mf) {
    if (mf && mf.value) {
        free((mf.value).data);
        free(mf.value);
        mf.value = null;
    }
}
export async function mapfrag_get(mf, x, y) {
    if (y < 0 || x < 0 || y > mf.hei - 1 || x > mf.wid - 1) {
        await panic("outside mapfrag (%i,%i), wanted (%i,%i)", mf.wid, mf.hei, x, y);
    }
    return splev_chr2typ(__nh_char_at0(__nh_advance_str(mf.data, y * (mf.wid + 1) + x)));
}
export function mapfrag_canmatch(mf) {
    return ((mf.wid % 2) && (mf.hei % 2));
}
export async function mapfrag_error(mf) {
    let res = null;
    if (!mf) {
        res = "mapfragment error";
    } else if (!mapfrag_canmatch(mf)) {
        mapfrag_free({ get value() { return mf; }, set value(_v) { mf = _v; } });
        res = "mapfragment needs to have odd height and width";
    } else if (((await mapfrag_get(mf, Math.trunc(mf.wid / 2), Math.trunc(mf.hei / 2))) == MAX_TYPE || (await mapfrag_get(mf, Math.trunc(mf.wid / 2), Math.trunc(mf.hei / 2))) == INVALID_TYPE)) {
        mapfrag_free({ get value() { return mf; }, set value(_v) { mf = _v; } });
        res = "mapfragment center must be valid terrain";
    }
    return res;
}
export async function mapfrag_match(mf, x, y) {
    let rx = 0;
    let ry = 0;
    for (rx = -(Math.trunc(mf.wid / 2)); rx <= (Math.trunc(mf.wid / 2)); rx++) {
        for (ry = -(Math.trunc(mf.hei / 2)); ry <= (Math.trunc(mf.hei / 2)); ry++) {
            let mapc = await mapfrag_get(mf, rx + (Math.trunc(mf.wid / 2)), ry + (Math.trunc(mf.hei / 2)));
            let levc = isok(x + rx, y + ry) ? game.level.locations[x + rx][y + ry].typ : STONE;
            if (!match_maptyps(mapc, levc)) {
                /* No more free rectangles ! */
                return (0);
            }
        }
    }
    return (1);
}
export function solidify_map() {
    /*
     * If any CROSSWALLs are found, must change to ROOM after REGION's
     * are laid out.  CROSSWALLS are used to specify "invisible"
     * boundaries where DOOR syms look bad or aren't desirable.
     */
    let x = 0;
    let y = 0;
    for (x = 0; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            if (((game.level.locations[x][y].typ) <= DBWALL) && !game.SpLev_Map[x][y]) {
                game.level.locations[x][y].flags |= (8 | 16);
            }
        }
    }
}
/* do a post-level-creation cleanup of map, such as
   removing boulders and traps from lava */
export async function map_cleanup() {
    let otmp = null;
    let ttmp = null;
    let etmp = null;
    let x = 0;
    let y = 0;
    for (x = 0; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            let typ = game.level.locations[x][y].typ;
            if (((typ) == LAVAPOOL || (typ) == LAVAWALL) || ((typ) >= POOL && (typ) <= DRAWBRIDGE_UP)) {
                while ((otmp = sobj_at(BOULDER, x, y)) != null) {
                    await obj_extract_self(otmp);
                    await obfree(otmp, null);
                }
                if (((ttmp = t_at(x, y)) != null) && !((ttmp.ttyp) == MAGIC_PORTAL || (ttmp.ttyp) == VIBRATING_SQUARE)) {
                    await deltrap(ttmp);
                }
                if ((etmp = engr_at(x, y)) != null) {
                    await del_engr(etmp);
                }
            }
        }
    }
}
export function lvlfill_maze_grid(x1, y1, x2, y2, filling) {
    let x = 0;
    let y = 0;
    for (x = x1; x <= x2; x++) {
        for (y = y1; y <= y2; y++) {
            if (game.level.flags.corrmaze) {
                game.level.locations[x][y].typ = STONE;
            } else {
                game.level.locations[x][y].typ = (y < 2 || ((x % 2) && (y % 2))) ? STONE : filling;
            }
        }
    }
}
export async function lvlfill_solid(filling, lit) {
    let x = 0;
    let y = 0;
    for (x = 2; x <= game.x_maze_max; x++) {
        for (y = 0; y <= game.y_maze_max; y++) {
            if (!await set_levltyp_lit(x, y, filling, lit)) {
                continue;
            }
            /* no need for IS_DOOR check; out of map bounds */
            game.level.locations[x][y].flags = 0;
            game.level.locations[x][y].horizontal = 0;
            game.level.locations[x][y].roomno = 0;
            /* TODO: consolidate this w lspo_map ? */
            game.level.locations[x][y].edge = 0;
        }
    }
}
export async function lvlfill_swamp(fg, bg, lit) {
    let x = 0;
    let y = 0;
    await lvlfill_solid(bg, lit);
    for (x = 2; x <= ((game.x_maze_max) < (80 - 2) ? (game.x_maze_max) : (80 - 2)); x += 2) {
        for (y = 0; y <= ((game.y_maze_max) < (21 - 2) ? (game.y_maze_max) : (21 - 2)); y += 2) {
            /* "relaxed blockwise maze" algorithm, Jamis Buck */
            let c = 0;
            await set_levltyp_lit(x, y, fg, lit);
            if (game.level.locations[x + 1][y].typ == bg) {
                ++c;
            }
            if (game.level.locations[x][y + 1].typ == bg) {
                ++c;
            }
            if (game.level.locations[x + 1][y + 1].typ == bg) {
                ++c;
            }
            if (c == 3) {
                switch (rn2(3)) {
                    /* Convert wall and pos into an absolute coordinate! */
                    case 0:
                        await set_levltyp_lit(x + 1, y, fg, lit);
                        break;
                    /* don't use move() - it doesn't use W_NORTH, etc. */
                    /* place map starting at halign,valign */
                    case 1:
                        await set_levltyp_lit(x, y + 1, fg, lit);
                        break;
                    case 2:
                        await set_levltyp_lit(x + 1, y + 1, fg, lit);
                        break;
                    default:
                        break;
                }
            }
        }
    }
}
export function flip_dbridge_horizontal(lev) {
    if (((lev.typ) == DRAWBRIDGE_UP || (lev.typ) == DRAWBRIDGE_DOWN)) {
        if ((lev.flags & 3) == 3) {
            lev.flags &= ~3;
            lev.flags |= 2;
        } else if ((lev.flags & 3) == 2) {
            lev.flags &= ~2;
            lev.flags |= 3;
        }
    }
}
export function flip_dbridge_vertical(lev) {
    if (((lev.typ) == DRAWBRIDGE_UP || (lev.typ) == DRAWBRIDGE_DOWN)) {
        if ((lev.flags & 3) == 0) {
            lev.flags &= ~0;
            lev.flags |= 1;
        } else if ((lev.flags & 3) == 1) {
            lev.flags &= ~1;
            lev.flags |= 0;
        }
    }
}
/* for #wizfliplevel; not needed when flipping during level creation;
   update seen vector for whole flip area and glyph for known walls */
export async function flip_visuals(flp, minx, miny, maxx, maxy) {
    let lev = null;
    let x = 0;
    let y = 0;
    let seenv = 0;
    for (y = miny; y <= maxy; ++y) {
        for (x = minx; x <= maxx; ++x) {
            lev = game.level.locations[x][y];
            seenv = lev.seenv & 255;
            /* locations which haven't been seen can be skipped */
            if (seenv == 0) {
                continue;
            }
            if (seenv != (255)) {
                if (flp & 1) {
                    /* flip <x,y>'s seen vector; not necessary for locations seen
               from all directions (the whole level after magic mapping) */
                    /* SV2 SV1 SV0 *
                 * SV3 -+- SV7 *
                 * SV4 SV5 SV6 */
                    seenv = swapbits(seenv, 2, 4);
                    seenv = swapbits(seenv, 1, 5);
                    seenv = swapbits(seenv, 0, 6);
                }
                if (flp & 2) {
                    seenv = swapbits(seenv, 2, 0);
                    seenv = swapbits(seenv, 3, 7);
                    seenv = swapbits(seenv, 4, 6);
                }
                lev.seenv = seenv;
            }
            /* if <x,y> is displayed as a wall, reset its display glyph so
               that remembered, out of view T's and corners get flipped */
            if ((((lev.typ) && (lev.typ) <= DBWALL) || lev.typ == SDOOR) && ((lev.glyph) >= GLYPH_CMAP_STONE_OFF && (lev.glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1)))) {
                lev.glyph = await back_to_glyph(x, y);
            }
        }
    }
}
/* transpose an encoded direction */
export function flip_encoded_dir_bits(flp, val) {
    if (flp & 1) {
        /* these depend on xdir[] and ydir[] order */
        val = swapbits(val, 1, 7);
        val = swapbits(val, 2, 6);
        val = swapbits(val, 3, 5);
    }
    if (flp & 2) {
        val = swapbits(val, 1, 3);
        val = swapbits(val, 0, 4);
        val = swapbits(val, 7, 5);
    }
    return val;
}
/* transpose top with bottom or left with right or both; sometimes called
   for new special levels, or for any level via the #wizfliplevel command */
/* mask for orientation(s) to transpose */
/* False: level creation; True: #wizfliplevel is
                     * altering an active level so more needs to be done */
export async function flip_level(flp, extras) {
    let x = 0;
    let y = 0;
    let i = 0;
    let itmp = 0;
    let minx = 0;
    let miny = 0;
    let maxx = 0;
    let maxy = 0;
    let trm = { glyph: 0, typ: 0, seenv: 0, flags: 0, horizontal: 0, lit: 0, waslit: 0, roomno: 0, edge: 0, candig: 0 };
    let ttmp = null;
    let otmp = null;
    let mtmp = null;
    let etmp = null;
    let sroom = null;
    let timer = null;
    let ball_active = (0);
    let ball_fliparea = (0);
    let stway = null;
    let ez = null;
    /* nothing to do unless (flp & 1) or (flp & 2) or both */
    if ((flp & 3) == 0) {
        return;
    }
    get_level_extends({ get value() { return minx; }, set value(_v) { minx = _v; } }, { get value() { return miny; }, set value(_v) { miny = _v; } }, { get value() { return maxx; }, set value(_v) { maxx = _v; } }, { get value() { return maxy; }, set value(_v) { maxy = _v; } });
    /* get_level_extends() returns -1,-1 to COLNO,ROWNO at max */
    if (miny < 0) {
        miny = 0;
    }
    if (minx < 1) {
        minx = 1;
    }
    if (maxx >= 80) {
        maxx = (80 - 1);
    }
    if (maxy >= 21) {
        maxy = (21 - 1);
    }
    if (extras) {
        if ((game.uball != null) && game.uball.where != 0) {
            ball_active = (1);
            /* if hero and ball and chain are all inside flip area,
               flip b&c coordinates along with other objects; if they
               are all outside, leave them to be rejected when flipping
               so that they stay as is; if some are inside and some are
               outside, un-place here and subsequently re-place them on
               hero's [possibly new] spot below */
            if (((game.uball).where == 3)) {
                game.uball.ox = game.u.ux , game.uball.oy = game.u.uy;
            }
            ball_fliparea = ((((game.uball.ox) >= minx && (game.uball.ox) <= maxx && (game.uball.oy) >= miny && (game.uball.oy) <= maxy) == ((game.uchain.ox) >= minx && (game.uchain.ox) <= maxx && (game.uchain.oy) >= miny && (game.uchain.oy) <= maxy)) && (((game.uball.ox) >= minx && (game.uball.ox) <= maxx && (game.uball.oy) >= miny && (game.uball.oy) <= maxy) == ((game.u.ux) >= minx && (game.u.ux) <= maxx && (game.u.uy) >= miny && (game.u.uy) <= maxy)));
            if (!ball_fliparea) {
                await unplacebc();
            }
        }
    }
    for (stway = game.stairs; stway; stway = stway.next) {
        if (flp & 1) {
            stway.sy = ((maxy - (stway.sy)) + miny);
        }
        if (flp & 2) {
            stway.sx = ((maxx - (stway.sx)) + minx);
        }
    }
    for (ttmp = game.ftrap; ttmp; ttmp = ttmp.ntrap) {
        if (!((ttmp.tx) >= minx && (ttmp.tx) <= maxx && (ttmp.ty) >= miny && (ttmp.ty) <= maxy)) {
            continue;
        }
        if (flp & 1) {
            ttmp.ty = ((maxy - (ttmp.ty)) + miny);
            if (ttmp.ttyp == ROLLING_BOULDER_TRAP) {
                ttmp.launch.y = ((maxy - (ttmp.launch.y)) + miny);
                ttmp.vl.v_launch2.y = ((maxy - (ttmp.vl.v_launch2.y)) + miny);
            } else if (((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT) && ttmp.vl.v_conjoined) {
                ttmp.vl.v_conjoined = flip_encoded_dir_bits(flp, ttmp.vl.v_conjoined);
            }
        }
        if (flp & 2) {
            ttmp.tx = ((maxx - (ttmp.tx)) + minx);
            if (ttmp.ttyp == ROLLING_BOULDER_TRAP) {
                ttmp.launch.x = ((maxx - (ttmp.launch.x)) + minx);
                ttmp.vl.v_launch2.x = ((maxx - (ttmp.vl.v_launch2.x)) + minx);
            } else if (((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT) && ttmp.vl.v_conjoined) {
                ttmp.vl.v_conjoined = flip_encoded_dir_bits(flp, ttmp.vl.v_conjoined);
            }
        }
    }
    for (otmp = game.level.objlist; otmp; otmp = otmp.nobj) {
        if (!((otmp.ox) >= minx && (otmp.ox) <= maxx && (otmp.oy) >= miny && (otmp.oy) <= maxy)) {
            continue;
        }
        if (flp & 1) {
            otmp.oy = ((maxy - (otmp.oy)) + miny);
        }
        if (flp & 2) {
            otmp.ox = ((maxx - (otmp.ox)) + minx);
        }
    }
    for (otmp = game.level.buriedobjlist; otmp; otmp = otmp.nobj) {
        if (!((otmp.ox) >= minx && (otmp.ox) <= maxx && (otmp.oy) >= miny && (otmp.oy) <= maxy)) {
            continue;
        }
        if (flp & 1) {
            otmp.oy = ((maxy - (otmp.oy)) + miny);
        }
        if (flp & 2) {
            otmp.ox = ((maxx - (otmp.ox)) + minx);
        }
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (mtmp.isgd) {
            if (extras) {
                /* #wizfliplevel rather than level creation */
                flip_vault_guard(flp, mtmp, minx, miny, maxx, maxy);
            }
            /* not on map so don't flip guard->mx,my */
            if (mtmp.mx == 0) {
                continue;
            }
        }
        /* skip the occasional earth elemental outside the flip area */
        if (!((mtmp.mx) >= minx && (mtmp.mx) <= maxx && (mtmp.my) >= miny && (mtmp.my) <= maxy)) {
            continue;
        }
        if (flp & 1) {
            mtmp.my = ((maxy - (mtmp.my)) + miny);
        }
        if (flp & 2) {
            mtmp.mx = ((maxx - (mtmp.mx)) + minx);
        }
        do {
            if ((mtmp.mgoal).x && (((mtmp.mgoal).x) >= minx && ((mtmp.mgoal).x) <= maxx && ((mtmp.mgoal).y) >= miny && ((mtmp.mgoal).y) <= maxy)) {
                if (flp & 1) {
                    (mtmp.mgoal).y = ((maxy - ((mtmp.mgoal).y)) + miny);
                }
                if (flp & 2) {
                    (mtmp.mgoal).x = ((maxx - ((mtmp.mgoal).x)) + minx);
                }
            }
        } while (0);
        /* not useful unless tracking also gets flipped */
        if (mtmp.ispriest) {
            do {
                if ((((mtmp).mextra.epri).shrpos).x && (((((mtmp).mextra.epri).shrpos).x) >= minx && ((((mtmp).mextra.epri).shrpos).x) <= maxx && ((((mtmp).mextra.epri).shrpos).y) >= miny && ((((mtmp).mextra.epri).shrpos).y) <= maxy)) {
                    if (flp & 1) {
                        (((mtmp).mextra.epri).shrpos).y = ((maxy - ((((mtmp).mextra.epri).shrpos).y)) + miny);
                    }
                    if (flp & 2) {
                        (((mtmp).mextra.epri).shrpos).x = ((maxx - ((((mtmp).mextra.epri).shrpos).x)) + minx);
                    }
                }
            } while (0);
        } else if (mtmp.isshk) {
            do {
                if ((((mtmp).mextra.eshk).shk).x && (((((mtmp).mextra.eshk).shk).x) >= minx && ((((mtmp).mextra.eshk).shk).x) <= maxx && ((((mtmp).mextra.eshk).shk).y) >= miny && ((((mtmp).mextra.eshk).shk).y) <= maxy)) {
                    if (flp & 1) {
                        (((mtmp).mextra.eshk).shk).y = ((maxy - ((((mtmp).mextra.eshk).shk).y)) + miny);
                    }
                    if (flp & 2) {
                        (((mtmp).mextra.eshk).shk).x = ((maxx - ((((mtmp).mextra.eshk).shk).x)) + minx);
                    }
                }
            } while (0);
            do {
                if ((((mtmp).mextra.eshk).shd).x && (((((mtmp).mextra.eshk).shd).x) >= minx && ((((mtmp).mextra.eshk).shd).x) <= maxx && ((((mtmp).mextra.eshk).shd).y) >= miny && ((((mtmp).mextra.eshk).shd).y) <= maxy)) {
                    if (flp & 1) {
                        (((mtmp).mextra.eshk).shd).y = ((maxy - ((((mtmp).mextra.eshk).shd).y)) + miny);
                    }
                    if (flp & 2) {
                        (((mtmp).mextra.eshk).shd).x = ((maxx - ((((mtmp).mextra.eshk).shd).x)) + minx);
                    }
                }
            } while (0);
        } else if (mtmp.wormno) {
            if (flp & 1) {
                flip_worm_segs_vertical(mtmp, miny, maxy);
            }
            if (flp & 2) {
                flip_worm_segs_horizontal(mtmp, minx, maxx);
            }
        }
    }
    if (extras) {
        for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
            if (mtmp.isgd && on_level(game.u.uz, ((mtmp).mextra.egd).gdlevel)) {
                flip_vault_guard(flp, mtmp, minx, miny, maxx, maxy);
            } else if (mtmp.ispriest && on_level(game.u.uz, ((mtmp).mextra.epri).shrlevel)) {
                do {
                    if ((((mtmp).mextra.epri).shrpos).x && (((((mtmp).mextra.epri).shrpos).x) >= minx && ((((mtmp).mextra.epri).shrpos).x) <= maxx && ((((mtmp).mextra.epri).shrpos).y) >= miny && ((((mtmp).mextra.epri).shrpos).y) <= maxy)) {
                        if (flp & 1) {
                            (((mtmp).mextra.epri).shrpos).y = ((maxy - ((((mtmp).mextra.epri).shrpos).y)) + miny);
                        }
                        if (flp & 2) {
                            (((mtmp).mextra.epri).shrpos).x = ((maxx - ((((mtmp).mextra.epri).shrpos).x)) + minx);
                        }
                    }
                } while (0);
            } else if (mtmp.isshk && on_level(game.u.uz, ((mtmp).mextra.eshk).shoplevel)) {
                do {
                    if ((((mtmp).mextra.eshk).shk).x && (((((mtmp).mextra.eshk).shk).x) >= minx && ((((mtmp).mextra.eshk).shk).x) <= maxx && ((((mtmp).mextra.eshk).shk).y) >= miny && ((((mtmp).mextra.eshk).shk).y) <= maxy)) {
                        if (flp & 1) {
                            (((mtmp).mextra.eshk).shk).y = ((maxy - ((((mtmp).mextra.eshk).shk).y)) + miny);
                        }
                        if (flp & 2) {
                            (((mtmp).mextra.eshk).shk).x = ((maxx - ((((mtmp).mextra.eshk).shk).x)) + minx);
                        }
                    }
                } while (0);
                do {
                    if ((((mtmp).mextra.eshk).shd).x && (((((mtmp).mextra.eshk).shd).x) >= minx && ((((mtmp).mextra.eshk).shd).x) <= maxx && ((((mtmp).mextra.eshk).shd).y) >= miny && ((((mtmp).mextra.eshk).shd).y) <= maxy)) {
                        if (flp & 1) {
                            (((mtmp).mextra.eshk).shd).y = ((maxy - ((((mtmp).mextra.eshk).shd).y)) + miny);
                        }
                        if (flp & 2) {
                            (((mtmp).mextra.eshk).shd).x = ((maxx - ((((mtmp).mextra.eshk).shd).x)) + minx);
                        }
                    }
                } while (0);
            }
        }
    }
    for (etmp = game.head_engr; etmp; etmp = etmp.nxt_engr) {
        if (flp & 1) {
            etmp.engr_y = ((maxy - (etmp.engr_y)) + miny);
        }
        if (flp & 2) {
            etmp.engr_x = ((maxx - (etmp.engr_x)) + minx);
        }
    }
    for (i = 0; i < game.num_lregions; i++) {
        if (flp & 1) {
            /* level (teleport) regions */
            game.lregions[i].inarea.y1 = ((maxy - (game.lregions[i].inarea.y1)) + miny);
            game.lregions[i].inarea.y2 = ((maxy - (game.lregions[i].inarea.y2)) + miny);
            if (game.lregions[i].inarea.y1 > game.lregions[i].inarea.y2) {
                itmp = game.lregions[i].inarea.y1;
                game.lregions[i].inarea.y1 = game.lregions[i].inarea.y2;
                game.lregions[i].inarea.y2 = itmp;
            }
            game.lregions[i].delarea.y1 = ((maxy - (game.lregions[i].delarea.y1)) + miny);
            game.lregions[i].delarea.y2 = ((maxy - (game.lregions[i].delarea.y2)) + miny);
            if (game.lregions[i].delarea.y1 > game.lregions[i].delarea.y2) {
                itmp = game.lregions[i].delarea.y1;
                game.lregions[i].delarea.y1 = game.lregions[i].delarea.y2;
                game.lregions[i].delarea.y2 = itmp;
            }
        }
        if (flp & 2) {
            game.lregions[i].inarea.x1 = ((maxx - (game.lregions[i].inarea.x1)) + minx);
            game.lregions[i].inarea.x2 = ((maxx - (game.lregions[i].inarea.x2)) + minx);
            if (game.lregions[i].inarea.x1 > game.lregions[i].inarea.x2) {
                itmp = game.lregions[i].inarea.x1;
                game.lregions[i].inarea.x1 = game.lregions[i].inarea.x2;
                game.lregions[i].inarea.x2 = itmp;
            }
            game.lregions[i].delarea.x1 = ((maxx - (game.lregions[i].delarea.x1)) + minx);
            game.lregions[i].delarea.x2 = ((maxx - (game.lregions[i].delarea.x2)) + minx);
            if (game.lregions[i].delarea.x1 > game.lregions[i].delarea.x2) {
                itmp = game.lregions[i].delarea.x1;
                game.lregions[i].delarea.x1 = game.lregions[i].delarea.x2;
                game.lregions[i].delarea.x2 = itmp;
            }
        }
    }
    for (i = 0; i < game.n_regions; i++) {
        /* regions (poison clouds, etc) */
        let j = 0;
        let tmp1 = 0;
        let tmp2 = 0;
        if (flp & 1) {
            tmp1 = ((maxy - (game.regions[i].bounding_box.ly)) + miny);
            tmp2 = ((maxy - (game.regions[i].bounding_box.hy)) + miny);
            game.regions[i].bounding_box.ly = ((tmp1) < (tmp2) ? (tmp1) : (tmp2));
            game.regions[i].bounding_box.hy = ((tmp1) > (tmp2) ? (tmp1) : (tmp2));
            for (j = 0; j < game.regions[i].nrects; j++) {
                tmp1 = ((maxy - (game.regions[i].rects[j].ly)) + miny);
                tmp2 = ((maxy - (game.regions[i].rects[j].hy)) + miny);
                game.regions[i].rects[j].ly = ((tmp1) < (tmp2) ? (tmp1) : (tmp2));
                game.regions[i].rects[j].hy = ((tmp1) > (tmp2) ? (tmp1) : (tmp2));
            }
        }
        if (flp & 2) {
            tmp1 = ((maxx - (game.regions[i].bounding_box.lx)) + minx);
            tmp2 = ((maxx - (game.regions[i].bounding_box.hx)) + minx);
            game.regions[i].bounding_box.lx = ((tmp1) < (tmp2) ? (tmp1) : (tmp2));
            game.regions[i].bounding_box.hx = ((tmp1) > (tmp2) ? (tmp1) : (tmp2));
            for (j = 0; j < game.regions[i].nrects; j++) {
                tmp1 = ((maxx - (game.regions[i].rects[j].lx)) + minx);
                tmp2 = ((maxx - (game.regions[i].rects[j].hx)) + minx);
                game.regions[i].rects[j].lx = ((tmp1) < (tmp2) ? (tmp1) : (tmp2));
                game.regions[i].rects[j].hx = ((tmp1) > (tmp2) ? (tmp1) : (tmp2));
            }
        }
    }
    for (let __nhi_sroom = 0; (sroom = game.rooms[__nhi_sroom]); __nhi_sroom++) {
        if (sroom.hx < 0) {
            break;
        }
        if (flp & 1) {
            sroom.ly = ((maxy - (sroom.ly)) + miny);
            sroom.hy = ((maxy - (sroom.hy)) + miny);
            if (sroom.ly > sroom.hy) {
                itmp = sroom.ly;
                sroom.ly = sroom.hy;
                sroom.hy = itmp;
            }
        }
        if (flp & 2) {
            sroom.lx = ((maxx - (sroom.lx)) + minx);
            sroom.hx = ((maxx - (sroom.hx)) + minx);
            if (sroom.lx > sroom.hx) {
                itmp = sroom.lx;
                sroom.lx = sroom.hx;
                sroom.hx = itmp;
            }
        }
        if (sroom.nsubrooms) {
            for (i = 0; i < sroom.nsubrooms; i++) {
                let rroom = sroom.sbrooms[i];
                if (flp & 1) {
                    rroom.ly = ((maxy - (rroom.ly)) + miny);
                    rroom.hy = ((maxy - (rroom.hy)) + miny);
                    if (rroom.ly > rroom.hy) {
                        itmp = rroom.ly;
                        rroom.ly = rroom.hy;
                        rroom.hy = itmp;
                    }
                }
                if (flp & 2) {
                    rroom.lx = ((maxx - (rroom.lx)) + minx);
                    rroom.hx = ((maxx - (rroom.hx)) + minx);
                    if (rroom.lx > rroom.hx) {
                        itmp = rroom.lx;
                        rroom.lx = rroom.hx;
                        rroom.hx = itmp;
                    }
                }
            }
        }
    }
    for (i = 0; i < game.doorindex; i++) {
        do {
            if ((game.doors[i]).x && (((game.doors[i]).x) >= minx && ((game.doors[i]).x) <= maxx && ((game.doors[i]).y) >= miny && ((game.doors[i]).y) <= maxy)) {
                if (flp & 1) {
                    (game.doors[i]).y = ((maxy - ((game.doors[i]).y)) + miny);
                }
                if (flp & 2) {
                    (game.doors[i]).x = ((maxx - ((game.doors[i]).x)) + minx);
                }
            }
        } while (0);
    }
    if (flp & 1) {
        for (x = minx; x <= maxx; x++) {
            for (y = miny; y < (miny + (Math.trunc((maxy - miny + 1) / 2))); y++) {
                let ny = ((maxy - (y)) + miny);
                flip_dbridge_vertical(game.level.locations[x][y]);
                flip_dbridge_vertical(game.level.locations[x][ny]);
                Object.assign(trm, game.level.locations[x][y]);
                Object.assign(game.level.locations[x][y], game.level.locations[x][ny]);
                Object.assign(game.level.locations[x][ny], trm);
                otmp = game.level.objects[x][y];
                game.level.objects[x][y] = game.level.objects[x][ny];
                game.level.objects[x][ny] = otmp;
                mtmp = game.level.monsters[x][y];
                game.level.monsters[x][y] = game.level.monsters[x][ny];
                game.level.monsters[x][ny] = mtmp;
            }
        }
    }
    if (flp & 2) {
        for (x = minx; x < (minx + (Math.trunc((maxx - minx + 1) / 2))); x++) {
            for (y = miny; y <= maxy; y++) {
                let nx = ((maxx - (x)) + minx);
                flip_dbridge_horizontal(game.level.locations[x][y]);
                flip_dbridge_horizontal(game.level.locations[nx][y]);
                Object.assign(trm, game.level.locations[x][y]);
                Object.assign(game.level.locations[x][y], game.level.locations[nx][y]);
                Object.assign(game.level.locations[nx][y], trm);
                otmp = game.level.objects[x][y];
                game.level.objects[x][y] = game.level.objects[nx][y];
                game.level.objects[nx][y] = otmp;
                mtmp = game.level.monsters[x][y];
                game.level.monsters[x][y] = game.level.monsters[nx][y];
                game.level.monsters[nx][y] = mtmp;
            }
        }
    }
    for (timer = game.timer_base; timer; timer = timer.next) {
        if (timer.func_index == MELT_ICE_AWAY) {
            let ty = timer.arg.a_long & 65535;
            let tx = (timer.arg.a_long >> 16) & 65535;
            if (flp & 1) {
                ty = ((maxy - (ty)) + miny);
            }
            if (flp & 2) {
                tx = ((maxx - (tx)) + minx);
            }
            timer.arg.a_long = ((tx << 16) | ty);
        }
    }
    for (ez = game.exclusion_zones; ez; ez = ez.next) {
        if (flp & 1) {
            ez.ly = ((maxy - (ez.ly)) + miny);
            ez.hy = ((maxy - (ez.hy)) + miny);
            if (ez.ly > ez.hy) {
                itmp = ez.ly;
                ez.ly = ez.hy;
                ez.hy = itmp;
            }
        }
        if (flp & 2) {
            ez.lx = ((maxx - (ez.lx)) + minx);
            ez.hx = ((maxx - (ez.hx)) + minx);
            if (ez.lx > ez.hx) {
                itmp = ez.lx;
                ez.lx = ez.hx;
                ez.hx = itmp;
            }
        }
    }
    if (extras) {
        if (((game.u.ux) >= minx && (game.u.ux) <= maxx && (game.u.uy) >= miny && (game.u.uy) <= maxy)) {
            /* for #wizfliplevel rather than during level creation */
            /* flip hero location only if inside the flippable area */
            if (flp & 1) {
                game.u.uy = ((maxy - (game.u.uy)) + miny);
            }
            if (flp & 2) {
                game.u.ux = ((maxx - (game.u.ux)) + minx);
            }
            /* we could flip <ux0,uy0> too if it's inside the flip area,
               but have to resort to this if outside, so just do this */
            game.u.ux0 = game.u.ux , game.u.uy0 = game.u.uy;
        }
        if (ball_active && !ball_fliparea) {
            await placebc();
        }
        do {
            if ((game.iflags.travelcc).x && (((game.iflags.travelcc).x) >= minx && ((game.iflags.travelcc).x) <= maxx && ((game.iflags.travelcc).y) >= miny && ((game.iflags.travelcc).y) <= maxy)) {
                if (flp & 1) {
                    (game.iflags.travelcc).y = ((maxy - ((game.iflags.travelcc).y)) + miny);
                }
                if (flp & 2) {
                    (game.iflags.travelcc).x = ((maxx - ((game.iflags.travelcc).x)) + minx);
                }
            }
        } while (0);
        do {
            if ((game.context.digging.pos).x && (((game.context.digging.pos).x) >= minx && ((game.context.digging.pos).x) <= maxx && ((game.context.digging.pos).y) >= miny && ((game.context.digging.pos).y) <= maxy)) {
                if (flp & 1) {
                    (game.context.digging.pos).y = ((maxy - ((game.context.digging.pos).y)) + miny);
                }
                if (flp & 2) {
                    (game.context.digging.pos).x = ((maxx - ((game.context.digging.pos).x)) + minx);
                }
            }
        } while (0);
    }
    await fix_wall_spines(1, 0, 80 - 1, 21 - 1);
    if (extras && flp) {
        set_wall_state();
        await flip_visuals(flp, minx, miny, maxx, maxy);
    }
    vision_reset();
}
/* for #wizfliplevel, flip guard's egd data; not needed for level creation */
/* 1: transpose vertically, 2: transpose horizontally, 3: both */
/* the vault guard, has monst->mextra->egd data */
/* needed by FlipX(), FlipY(), */
/* and inFlipArea() macros     */
export function flip_vault_guard(flp, grd, minx, miny, maxx, maxy) {
    let i = 0;
    let egd = ((grd).mextra.egd);
    if (((egd.gdx) >= minx && (egd.gdx) <= maxx && (egd.gdy) >= miny && (egd.gdy) <= maxy)) {
        if (flp & 1) {
            egd.gdy = ((maxy - (egd.gdy)) + miny);
        }
        if (flp & 2) {
            egd.gdx = ((maxx - (egd.gdx)) + minx);
        }
    }
    if (((egd.ogx) >= minx && (egd.ogx) <= maxx && (egd.ogy) >= miny && (egd.ogy) <= maxy)) {
        if (flp & 1) {
            egd.ogy = ((maxy - (egd.ogy)) + miny);
        }
        if (flp & 2) {
            egd.ogx = ((maxx - (egd.ogx)) + minx);
        }
    }
    for (i = egd.fcbeg; i < egd.fcend; ++i) {
        let fx = egd.fakecorr[i].fx;
        let fy = egd.fakecorr[i].fy;
        if (((fx) >= minx && (fx) <= maxx && (fy) >= miny && (fy) <= maxy)) {
            if (flp & 1) {
                egd.fakecorr[i].fy = ((maxy - (fy)) + miny);
            }
            if (flp & 2) {
                egd.fakecorr[i].fx = ((maxx - (fx)) + minx);
            }
        }
    }
    return;
}
/* randomly transpose top with bottom or left with right or both;
   caller controls which transpositions are allowed */
export async function flip_level_rnd(flp, extras) {
    let c = 0;
    /* TODO?
     *  Might change rn2(2) to !rn2(3) or (rn2(5) < 2) in order to bias
     *  the outcome towards the traditional orientation.
     */
    if ((flp & 1) && rn2(2)) {
        c |= 1;
    }
    if ((flp & 2) && rn2(2)) {
        c |= 2;
    }
    if (c) {
        await flip_level(c, extras);
    }
}
export function sel_set_wall_property(x, y, arg) {
    let prop = arg;
    if (((game.level.locations[x][y].typ) <= DBWALL) || ((game.level.locations[x][y].typ) == TREE || (game.level.flags.arboreal && (game.level.locations[x][y].typ) == STONE)) || game.level.locations[x][y].typ == IRONBARS) {
        game.level.locations[x][y].flags |= prop;
    }
}
/*
 * Make walls of the area (x1, y1, x2, y2) non diggable/non passwall-able
 */
export function set_wall_property(x1, y1, x2, y2, prop) {
    let x = 0;
    let y = 0;
    x1 = ((x1) > (1) ? (x1) : (1));
    x2 = ((x2) < (80 - 1) ? (x2) : (80 - 1));
    y1 = ((y1) > (0) ? (y1) : (0));
    y2 = ((y2) < (21 - 1) ? (y2) : (21 - 1));
    for (y = y1; y <= y2; y++) {
        for (x = x1; x <= x2; x++) {
            sel_set_wall_property(x, y, prop);
        }
    }
}
export function remove_boundary_syms() {
    let x = 0;
    let y = 0;
    let has_bounds = (0);
    for (x = 0; x < 80 - 1; x++) {
        for (y = 0; y < 21 - 1; y++) {
            if (game.level.locations[x][y].typ == CROSSWALL) {
                has_bounds = (1);
                break;
            }
        }
    }
    if (has_bounds) {
        for (x = 0; x < game.x_maze_max; x++) {
            for (y = 0; y < game.y_maze_max; y++) {
                if ((game.level.locations[x][y].typ == CROSSWALL) && game.SpLev_Map[x][y]) {
                    game.level.locations[x][y].typ = ROOM;
                }
            }
        }
    }
}
/* used by sel_set_door() and link_doors_rooms() */
export function set_door_orientation(x, y) {
    let wleft = 0;
    let wright = 0;
    let wup = 0;
    let wdown = 0;
    /* If there's a wall or door on either the left side or right
     * side (or both) of this secret door, make it be horizontal.
     *
     * It is feasible to put SDOOR in a corner, tee, or crosswall
     * position, although once the door is found and opened it won't
     * make a lot sense (diagonal access required).  Still, we try to
     * handle that as best as possible.  For top or bottom tee, using
     * horizontal is the best we can do.  For corner or crosswall,
     * either horizontal or vertical are just as good as each other;
     * we produce horizontal for corners and vertical for crosswalls.
     * For left or right tee, using vertical is best.
     *
     * A secret door with no adjacent walls is also feasible and makes
     * even less sense.  It will be displayed as a vertical wall while
     * hidden and become a vertical door when found.  Before resorting
     * to that, we check for solid rock which hasn't been wallified
     * yet (cf lower leftside of leader's room in Cav quest).
     */
    wleft = (isok(x - 1, y) && (((game.level.locations[x - 1][y].typ) && (game.level.locations[x - 1][y].typ) <= DBWALL) || ((game.level.locations[x - 1][y].typ) == DOOR) || game.level.locations[x - 1][y].typ == SDOOR));
    wright = (isok(x + 1, y) && (((game.level.locations[x + 1][y].typ) && (game.level.locations[x + 1][y].typ) <= DBWALL) || ((game.level.locations[x + 1][y].typ) == DOOR) || game.level.locations[x + 1][y].typ == SDOOR));
    wup = (isok(x, y - 1) && (((game.level.locations[x][y - 1].typ) && (game.level.locations[x][y - 1].typ) <= DBWALL) || ((game.level.locations[x][y - 1].typ) == DOOR) || game.level.locations[x][y - 1].typ == SDOOR));
    wdown = (isok(x, y + 1) && (((game.level.locations[x][y + 1].typ) && (game.level.locations[x][y + 1].typ) <= DBWALL) || ((game.level.locations[x][y + 1].typ) == DOOR) || game.level.locations[x][y + 1].typ == SDOOR));
    if (!wleft && !wright && !wup && !wdown) {
        /* out of bounds is treated as implicit wall; should be academic
           because we don't expect to have doors so near the level's edge */
        wleft = (!isok(x - 1, y) || (((game.level.locations[x - 1][y].typ) < POOL) || (game.level.locations[x - 1][y].typ) == IRONBARS));
        wright = (!isok(x + 1, y) || (((game.level.locations[x + 1][y].typ) < POOL) || (game.level.locations[x + 1][y].typ) == IRONBARS));
        wup = (!isok(x, y - 1) || (((game.level.locations[x][y - 1].typ) < POOL) || (game.level.locations[x][y - 1].typ) == IRONBARS));
        wdown = (!isok(x, y + 1) || (((game.level.locations[x][y + 1].typ) < POOL) || (game.level.locations[x][y + 1].typ) == IRONBARS));
    }
    game.level.locations[x][y].horizontal = ((wleft || wright) && !(wup && wdown)) ? 1 : 0;
}
/* is x,y right next to room droom? */
export function shared_with_room(x, y, droom) {
    let rmno = (game.rooms.indexOf(droom)) + 3;
    if (!isok(x, y)) {
        return (0);
    }
    if (game.level.locations[x][y].roomno == rmno && !game.level.locations[x][y].edge) {
        return (0);
    }
    if (isok(x - 1, y) && game.level.locations[x - 1][y].roomno == rmno && x - 1 <= droom.hx) {
        return (1);
    }
    if (isok(x + 1, y) && game.level.locations[x + 1][y].roomno == rmno && x + 1 >= droom.lx) {
        return (1);
    }
    if (isok(x, y - 1) && game.level.locations[x][y - 1].roomno == rmno && y - 1 <= droom.hy) {
        return (1);
    }
    if (isok(x, y + 1) && game.level.locations[x][y + 1].roomno == rmno && y + 1 >= droom.ly) {
        return (1);
    }
    return (0);
}
/* maybe add door at x,y to room droom */
export function maybe_add_door(x, y, droom) {
    if (droom.hx >= 0 && ((!droom.irregular && inside_room(droom, x, y)) || game.level.locations[x][y].roomno == (game.rooms.indexOf(droom)) + 3 || shared_with_room(x, y, droom))) {
        add_door(x, y, droom);
    }
}
/* link all doors in the map to their corresponding rooms */
export function link_doors_rooms() {
    let x = 0;
    let y = 0;
    let tmpi = 0;
    let m = 0;
    for (y = 0; y < 21; y++) {
        for (x = 0; x < 80; x++) {
            if (((game.level.locations[x][y].typ) == DOOR) || game.level.locations[x][y].typ == SDOOR) {
                /* in case this door was a '+' or 'S' from the
                   MAP...ENDMAP section without an explicit DOOR
                   directive, set/clear levl[][].horizontal for it */
                /* set/clear levl[x][y].horizontal */
                set_door_orientation(x, y);
                for (tmpi = 0; tmpi < game.nroom; tmpi++) {
                    maybe_add_door(x, y, game.rooms[tmpi]);
                    for (m = 0; m < game.rooms[tmpi].nsubrooms; m++) {
                        maybe_add_door(x, y, game.rooms[tmpi].sbrooms[m]);
                    }
                }
            }
        }
    }
}
/*
 * Choose randomly the state (nodoor, open, closed or locked) for a door
 */
let __rnddoor_state = [0, 1, 2, 4, 8];
__nh_register_static(() => { __rnddoor_state = [0, 1, 2, 4, 8]; });
export function rnddoor() {
    return __rnddoor_state[rn2((Math.trunc(20 /* sizeof(int [5]) */ / 4 /* sizeof(int) */)))];
}
/*
 * Select a random trap
 */
export function rndtrap() {
    let rtrap = 0;
    do {
        rtrap = rnd(TRAPNUM - 1);
        switch (rtrap) {
            /* no random holes on special levels */
            case HOLE:
            case VIBRATING_SQUARE:
            case MAGIC_PORTAL:
                rtrap = NO_TRAP;
                break;
            case TRAPDOOR:
                if (!Can_dig_down(game.u.uz)) {
                    rtrap = NO_TRAP;
                }
                break;
            case LEVEL_TELEP:
            case TELEP_TRAP:
                if (game.level.flags.noteleport) {
                    rtrap = NO_TRAP;
                }
                break;
            case ROLLING_BOULDER_TRAP:
            case ROCKTRAP:
                if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
                    rtrap = NO_TRAP;
                }
                break;
        }
    } while (rtrap == NO_TRAP);
    return rtrap;
}
/*
 * Translate a given coordinate from a special level definition into an actual
 * location on the map.
 *
 * If x or y is negative, we generate a random coordinate within the area. If
 * not negative, they are interpreted as relative to the last defined map or
 * room, and are output as absolute svl.level.locations coordinates.
 *
 * The "humidity" flag is used to ensure that engravings aren't created
 * underwater, or eels on dry land.
 */
export async function get_location(x, y, humidity, croom) {
    let cpt = 0;
    let mx = 0;
    let my = 0;
    let sx = 0;
    let sy = 0;
    found_it: {
        cpt = 0;
        if (croom) {
            mx = croom.lx;
            my = croom.ly;
            sx = croom.hx - mx + 1;
            sy = croom.hy - my + 1;
        } else {
            mx = game.xstart;
            my = game.ystart;
            sx = game.xsize;
            sy = game.ysize;
        }
        if (x.value >= 0) {
            x.value += mx;
            y.value += my;
        } else {
            do {
                if (croom) {
                    let tmpc = { x: 0, y: 0 };
                    somexy(croom, tmpc);
                    x.value = tmpc.x;
                    y.value = tmpc.y;
                } else {
                    x.value = mx + rn2(sx);
                    y.value = my + rn2(sy);
                }
                if (is_ok_location(x.value, y.value, humidity)) {
                    break;
                }
            } while (++cpt < 100);
            if (cpt >= 100) {
                let xx = 0;
                let yy = 0;
                for (xx = 0; xx < sx; xx++) {
                    for (yy = 0; yy < sy; yy++) {
                        x.value = mx + xx;
                        y.value = my + yy;
                        if (is_ok_location(x.value, y.value, humidity)) {
                            break found_it;
                        }
                    }
                }
                if (!(humidity & 32)) {
                    await impossible("get_location:  can't find a place!");
                } else {
                    x.value = y.value = -1;
                }
            }
        }
    }
    if (!(humidity & 16) && !isok(x.value, y.value)) {
        if (!(humidity & 32)) {
            /*warning("get_location:  (%d,%d) out of bounds", *x, *y);*/
            x.value = game.x_maze_max;
            y.value = game.y_maze_max;
        } else {
            x.value = y.value = -1;
        }
    }
}
game.is_ok_location_func = null;
export function set_ok_location_func(func) {
    game.is_ok_location_func = func;
}
export function is_ok_location(x, y, humidity) {
    let typ = game.level.locations[x][y].typ;
    if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        return (1);
    }
    if (game.is_ok_location_func) {
        return game.is_ok_location_func(x, y);
    }
    /* TODO: Should perhaps check if wall is diggable/passwall? */
    if (humidity & 16) {
        return (1);
    }
    if ((humidity & 8) && ((typ) < POOL)) {
        return (1);
    }
    if ((humidity & (1 | 64)) && ((typ) > DOOR)) {
        let bould = (sobj_at(BOULDER, x, y) != (null));
        if (!bould || (bould && (humidity & 8))) {
            return (1);
        }
    }
    if ((humidity & 2) && is_pool(x, y)) {
        return (1);
    }
    if ((humidity & 4) && is_lava(x, y)) {
        return (1);
    }
    return (0);
}
export function pm_good_location(x, y, pm) {
    return is_ok_location(x, y, pm_to_humidity(pm));
}
let __get_unpacked_coord_c = { is_random: 0, getloc_flags: 0, x: 0, y: 0 };
__nh_register_static(() => { __get_unpacked_coord_c = { is_random: 0, getloc_flags: 0, x: 0, y: 0 }; });
export function get_unpacked_coord(loc, defhumidity) {
    if (loc & 16777216) {
        __get_unpacked_coord_c.x = __get_unpacked_coord_c.y = -1;
        __get_unpacked_coord_c.is_random = 1;
        __get_unpacked_coord_c.getloc_flags = (loc & ~16777216);
        if (!__get_unpacked_coord_c.getloc_flags) {
            __get_unpacked_coord_c.getloc_flags = defhumidity;
        }
    } else {
        __get_unpacked_coord_c.is_random = 0;
        __get_unpacked_coord_c.getloc_flags = defhumidity;
        __get_unpacked_coord_c.x = (loc & 255);
        __get_unpacked_coord_c.y = ((loc >> 16) & 255);
    }
    return __get_unpacked_coord_c;
}
export async function get_location_coord(x, y, humidity, croom, crd) {
    let c = { is_random: 0, getloc_flags: 0, x: 0, y: 0 };
    Object.assign(c, get_unpacked_coord(crd, humidity));
    x.value = c.x;
    y.value = c.y;
    await get_location(x, y, c.getloc_flags | (c.is_random ? 32 : 0), croom);
    if (x.value == -1 && y.value == -1 && c.is_random) {
        await get_location(x, y, humidity, croom);
    }
}
/*
 * Get a relative position inside a room.
 * negative values for x or y means RANDOM!
 */
export async function get_room_loc(x, y, croom) {
    let c = { x: 0, y: 0 };
    if (x.value < 0 && y.value < 0) {
        if (somexy(croom, c)) {
            x.value = c.x;
            y.value = c.y;
        } else {
            await panic("get_room_loc : can't find a place!");
        }
    } else {
        if (x.value < 0) {
            x.value = rn2(croom.hx - croom.lx + 1);
        }
        if (y.value < 0) {
            y.value = rn2(croom.hy - croom.ly + 1);
        }
        x.value += croom.lx;
        y.value += croom.ly;
    }
}
/*
 * Get a relative position inside a room.
 * negative values for x or y means RANDOM!
 */
export async function get_free_room_loc(x, y, croom, pos) {
    let try_x = 0;
    let try_y = 0;
    let trycnt = 0;
    await get_location_coord({ get value() { return try_x; }, set value(_v) { try_x = _v; } }, { get value() { return try_y; }, set value(_v) { try_y = _v; } }, 1, croom, pos);
    if (game.level.locations[try_x][try_y].typ != ROOM) {
        do {
            try_x = x.value , try_y = y.value;
            await get_room_loc({ get value() { return try_x; }, set value(_v) { try_x = _v; } }, { get value() { return try_y; }, set value(_v) { try_y = _v; } }, croom);
        } while (game.level.locations[try_x][try_y].typ != ROOM && ++trycnt <= 100);
        if (trycnt > 100) {
            await panic("get_free_room_loc:  can't find a place!");
        }
    }
    x.value = try_x , y.value = try_y;
}
export async function check_room(lowx, ddx, lowy, ddy, vault) {
    let x = 0;
    let y = 0;
    let hix = 0;
    let hiy = 0;
    let lev = null;
    let xlim = 0;
    let ylim = 0;
    let ymax = 0;
    let s_lowx = 0;
    let s_ddx = 0;
    let s_lowy = 0;
    let s_ddy = 0;
    hix = lowx.value + ddx.value;
    hiy = lowy.value + ddy.value;
    s_lowx = lowx.value;
    s_ddx = ddx.value;
    s_lowy = lowy.value;
    s_ddy = ddy.value;
    xlim = 4 + (vault ? 1 : 0);
    ylim = 3 + (vault ? 1 : 0);
    if (lowx.value < 3) {
        lowx.value = 3;
    }
    if (lowy.value < 2) {
        lowy.value = 2;
    }
    if (hix > 80 - 3) {
        hix = 80 - 3;
    }
    if (hiy > 21 - 3) {
        hiy = 21 - 3;
    }
    chk_loop: while (true) {
        if (hix <= lowx.value || hiy <= lowy.value) {
            return (0);
        }
        if (game.in_mk_themerooms && (s_lowx != lowx.value) && (s_ddx != ddx.value) && (s_lowy != lowy.value) && (s_ddy != ddy.value)) {
            return (0);
        }
        let __restart = false;
        outer_for: for (x = lowx.value - xlim; x <= hix + xlim; x++) {
            /* check area around room (and make room smaller if necessary) */
            if (x <= 0 || x >= 80) {
                continue;
            }
            y = lowy.value - ylim;
            ymax = hiy + ylim;
            if (y < 0) {
                y = 0;
            }
            if (ymax >= 21) {
                ymax = (21 - 1);
            }
            for (; y <= ymax; y++) {
                lev = game.level.locations[x][y];
                if (lev.typ != STONE) {
                    if (!vault) {
                        do {
                            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/sp_lev.c", (1))) {
                                let save_plnmsg = game.iflags.last_msg;
                                await pline("strange area [%d,%d] in check_room.", x, y);
                                game.iflags.last_msg = save_plnmsg;
                            }
                        } while (0);
                    }
                    if (!rn2(3)) {
                        return (0);
                    }
                    if (game.in_mk_themerooms) {
                        return (0);
                    }
                    if (x < lowx.value) {
                        lowx.value = x + xlim + 1;
                    } else {
                        hix = x - xlim - 1;
                    }
                    if (y < lowy.value) {
                        lowy.value = y + ylim + 1;
                    } else {
                        hiy = y - ylim - 1;
                    }
                    __restart = true;
                    break outer_for;
                }
            }
        }
        if (__restart) continue chk_loop;
        break chk_loop;
    }
    ddx.value = hix - lowx.value;
    ddy.value = hiy - lowy.value;
    if (game.in_mk_themerooms && (s_lowx != lowx.value) && (s_ddx != ddx.value) && (s_lowy != lowy.value) && (s_ddy != ddy.value)) {
        return (0);
    }
    return (1);
}
/*
 * Create a new room.
 * This is still very incomplete...
 */
export async function create_room(x, y, w, h, xal, yal, rtype, rlit) {
    let xabs = 0;
    let yabs = 0;
    let wtmp = 0;
    let htmp = 0;
    let xaltmp = 0;
    let yaltmp = 0;
    let xtmp = 0;
    let ytmp = 0;
    let r1 = null;
    let r2 = { lx: 0, ly: 0, hx: 0, hy: 0 };
    let trycnt = 0;
    let vault = (0);
    let xlim = 4;
    let ylim = 3;
    if (rtype == -1) {
        rtype = OROOM;
    }
    if (rtype == VAULT) {
        vault = (1);
        xlim++;
        ylim++;
    }
    /* on low levels the room is lit (usually) */
    /* some other rooms may require lighting */
    rlit = litstate_rnd(rlit);
    do {
        let xborder = 0;
        let yborder = 0;
        wtmp = w;
        htmp = h;
        xtmp = x;
        ytmp = y;
        xaltmp = xal;
        yaltmp = yal;
        if ((xtmp < 0 && ytmp < 0 && wtmp < 0 && xaltmp < 0 && yaltmp < 0) || vault) {
            /*
     * Here we will try to create a room. If some parameters are
     * random we are willing to make several try before we give
     * it up.
     */
            /* First case : a totally random room */
            let hx = 0;
            let hy = 0;
            let lx = 0;
            let ly = 0;
            let dx = 0;
            let dy = 0;
            r1 = rnd_rect();
            if (!r1) {
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/sp_lev.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        await pline("No more rects...");
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                return (0);
            }
            hx = r1.hx;
            hy = r1.hy;
            lx = r1.lx;
            ly = r1.ly;
            if (vault) {
                dx = dy = 1;
            } else {
                dx = 2 + rn2((hx - lx > 28) ? 12 : 8);
                dy = 2 + rn2(4);
                if (dx * dy > 50) {
                    dy = Math.trunc(50 / dx);
                }
            }
            xborder = (lx > 0 && hx < 80 - 1) ? 2 * xlim : xlim + 1;
            yborder = (ly > 0 && hy < 21 - 1) ? 2 * ylim : ylim + 1;
            if (hx - lx < dx + 3 + xborder || hy - ly < dy + 3 + yborder) {
                r1 = null;
                continue;
            }
            xabs = lx + (lx > 0 ? xlim : 3) + rn2(hx - (lx > 0 ? lx : 3) - dx - xborder + 1);
            yabs = ly + (ly > 0 ? ylim : 2) + rn2(hy - (ly > 0 ? ly : 2) - dy - yborder + 1);
            if (ly == 0 && hy >= 21 - 1 && (!game.nroom || !rn2(game.nroom)) && (yabs + dy > Math.trunc(21 / 2))) {
                yabs = (rn2(3) + (2));
                if (game.nroom < 4 && dy > 1) {
                    dy--;
                }
            }
            if (!await check_room({ get value() { return xabs; }, set value(_v) { xabs = _v; } }, { get value() { return dx; }, set value(_v) { dx = _v; } }, { get value() { return yabs; }, set value(_v) { yabs = _v; } }, { get value() { return dy; }, set value(_v) { dy = _v; } }, vault)) {
                r1 = null;
                continue;
            }
            wtmp = dx + 1;
            htmp = dy + 1;
            /* Try to find a rectangle that fit our room ! */
            r2.lx = xabs - 1;
            r2.ly = yabs - 1;
            r2.hx = xabs + wtmp;
            r2.hy = yabs + htmp;
        } else {
            /* Only some parameters are random */
            let rndpos = 0;
            let dx = 0;
            let dy = 0;
            if (xtmp < 0 && ytmp < 0) {
                xtmp = rnd(5);
                ytmp = rnd(5);
                rndpos = 1;
            }
            if (wtmp < 0 || htmp < 0) {
                wtmp = (rn2(15) + (3));
                htmp = (rn2(8) + (2));
            }
            /* Horizontal alignment is RANDOM */
            if (xaltmp == -1) {
                xaltmp = rnd(3);
            }
            /* Vertical alignment is RANDOM */
            if (yaltmp == -1) {
                yaltmp = rnd(3);
            }
            /* Try to generate real (absolute) coordinates here! */
            xabs = (Math.trunc(((xtmp - 1) * 80) / 5)) + 1;
            yabs = (Math.trunc(((ytmp - 1) * 21) / 5)) + 1;
            switch (xaltmp) {
                case 1:
                    break;
                case 5:
                    xabs += (Math.trunc(80 / 5)) - wtmp;
                    break;
                case 3:
                    xabs += Math.trunc(((Math.trunc(80 / 5)) - wtmp) / 2);
                    break;
            }
            switch (yaltmp) {
                case 1:
                    break;
                case 5:
                    yabs += (Math.trunc(21 / 5)) - htmp;
                    break;
                case 3:
                    yabs += Math.trunc(((Math.trunc(21 / 5)) - htmp) / 2);
                    break;
            }
            if (xabs + wtmp - 1 > 80 - 2) {
                xabs = 80 - wtmp - 3;
            }
            if (xabs < 2) {
                xabs = 2;
            }
            if (yabs + htmp - 1 > 21 - 2) {
                yabs = 21 - htmp - 3;
            }
            if (yabs < 2) {
                yabs = 2;
            }
            r2.lx = xabs - 1;
            r2.ly = yabs - 1;
            r2.hx = xabs + wtmp + rndpos;
            r2.hy = yabs + htmp + rndpos;
            r1 = get_rect(r2);
            dx = wtmp;
            dy = htmp;
            if (r1 && !await check_room({ get value() { return xabs; }, set value(_v) { xabs = _v; } }, { get value() { return dx; }, set value(_v) { dx = _v; } }, { get value() { return yabs; }, set value(_v) { yabs = _v; } }, { get value() { return dy; }, set value(_v) { dy = _v; } }, vault)) {
                r1 = null;
            }
        }
    } while (++trycnt <= 100 && !r1);
    if (!r1) {
        return (0);
    }
    await split_rects(r1, r2);
    if (!vault) {
        game.smeq[game.nroom] = game.nroom;
        await add_room(xabs, yabs, xabs + wtmp - 1, yabs + htmp - 1, rlit, rtype, (0));
    } else {
        game.rooms[game.nroom].lx = xabs;
        game.rooms[game.nroom].ly = yabs;
    }
    return (1);
}
/*
 * Create a subroom in room proom at pos x,y with width w & height h.
 * x & y are relative to the parent room.
 */
export async function create_subroom(proom, x, y, w, h, rtype, rlit) {
    let width = 0;
    let height = 0;
    width = proom.hx - proom.lx + 1;
    height = proom.hy - proom.ly + 1;
    /* There is a minimum size for the parent room */
    if (width < 4 || height < 4) {
        return (0);
    }
    /* Check for random position, size, etc... */
    if (w == -1) {
        w = rnd(width - 3);
    }
    if (h == -1) {
        h = rnd(height - 3);
    }
    if (x == -1) {
        x = rnd(width - w);
    }
    if (y == -1) {
        y = rnd(height - h);
    }
    if (x == 1) {
        x = 0;
    }
    if (y == 1) {
        y = 0;
    }
    if ((x + w + 1) == width) {
        x++;
    }
    if ((y + h + 1) == height) {
        y++;
    }
    if (rtype == -1) {
        rtype = OROOM;
    }
    rlit = litstate_rnd(rlit);
    await add_subroom(proom, proom.lx + x, proom.ly + y, proom.lx + x + w - 1, proom.ly + y + h - 1, rlit, rtype, (0));
    return (1);
}
/*
 * Create a new door in a room.
 * It's placed on a wall (north, south, east or west).
 */
export async function create_door(dd, broom) {
    let x = 0;
    let y = 0;
    let trycnt = 0;
    if (dd.secret == -1) {
        dd.secret = rn2(2);
    }
    if (dd.wall == -1) {
        dd.wall = (1 | 2 | 4 | 8);
    }
    if (dd.mask == -1) {
        if (!dd.secret) {
            if (!rn2(3)) {
                if (!rn2(5)) {
                    dd.mask = 2;
                } else if (!rn2(6)) {
                    dd.mask = 8;
                /* speeds things up in the below loop */
                /* is it a locked door, closed, or a doorway? */
                } else {
                    dd.mask = 4;
                }
                if (dd.mask != 2 && !rn2(25)) {
                    dd.mask |= 16;
                }
            } else {
                dd.mask = 0;
            }
        } else {
            if (!rn2(5)) {
                dd.mask = 8;
            } else {
                dd.mask = 4;
            }
            if (!rn2(20)) {
                dd.mask |= 16;
            }
        }
    }
    for (trycnt = 0; trycnt < 100; ++trycnt) {
        let dwall = dd.wall;
        let dpos = dd.pos;
        switch (rn2(4)) {
            case 0:
                if (!(dwall & 1)) {
                    continue;
                }
                y = broom.ly - 1;
                x = broom.lx + ((dpos == -1) ? rn2(1 + broom.hx - broom.lx) : dpos);
                if (!isok(x, y - 1) || ((game.level.locations[x][y - 1].typ) < POOL)) {
                    continue;
                }
                break;
            case 1:
                if (!(dwall & 2)) {
                    continue;
                }
                y = broom.hy + 1;
                x = broom.lx + ((dpos == -1) ? rn2(1 + broom.hx - broom.lx) : dpos);
                if (!isok(x, y + 1) || ((game.level.locations[x][y + 1].typ) < POOL)) {
                    continue;
                }
                break;
            case 2:
                if (!(dwall & 8)) {
                    continue;
                }
                x = broom.lx - 1;
                y = broom.ly + ((dpos == -1) ? rn2(1 + broom.hy - broom.ly) : dpos);
                if (!isok(x - 1, y) || ((game.level.locations[x - 1][y].typ) < POOL)) {
                    continue;
                }
                break;
            case 3:
                if (!(dwall & 4)) {
                    continue;
                }
                x = broom.hx + 1;
                y = broom.ly + ((dpos == -1) ? rn2(1 + broom.hy - broom.ly) : dpos);
                if (!isok(x + 1, y) || ((game.level.locations[x + 1][y].typ) < POOL)) {
                    continue;
                }
                break;
            default:
                break;
        }
        if (okdoor(x, y)) {
            break;
        }
    }
    if (trycnt >= 100) {
        await impossible("create_door: Can't find a proper place!");
        return;
    }
    if (!await set_levltyp(x, y, (dd.secret ? SDOOR : DOOR))) {
        return;
    }
    game.level.locations[x][y].flags = dd.mask;
}
/*
 * Create a trap in a room.
 */
export async function create_trap(t, croom) {
    let x = -1;
    let y = -1;
    let tm = { x: 0, y: 0 };
    let mktrap_flags = 2;
    if (t.type == VIBRATING_SQUARE) {
        await pick_vibrasquare_location();
        await maketrap(game.inv_pos.x, game.inv_pos.y, VIBRATING_SQUARE);
        return;
    } else if (croom) {
        await get_free_room_loc({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, croom, t.coord);
    } else {
        let trycnt = 0;
        do {
            await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, croom, t.coord);
        } while ((game.level.locations[x][y].typ == STAIRS || game.level.locations[x][y].typ == LADDER) && ++trycnt <= 100);
        if (trycnt > 100) {
            return;
        }
    }
    if (!t.spider_on_web) {
        mktrap_flags |= 4;
    }
    if (t.seen) {
        mktrap_flags |= 1;
    }
    if (t.novictim) {
        mktrap_flags |= 8;
    }
    tm.x = x;
    tm.y = y;
    await mktrap(t.type, mktrap_flags, null, tm);
}
/*
 * Create a monster in a room.
 */
export function noncoalignment(alignment) {
    let k = 0;
    k = rn2(2);
    if (!alignment) {
        return (k ? -1 : 1);
    }
    return (k ? -alignment : 0);
}
/* attempt to screen out locations where a mimic-as-boulder shouldn't occur */
export function m_bad_boulder_spot(x, y) {
    let lev = null;
    if (t_at(x, y)) {
        return (1);
    }
    /* try to avoid locations which already have a boulder (this won't
       actually work; we get called before objects have been placed...) */
    if (sobj_at(BOULDER, x, y)) {
        return (1);
    }
    lev = game.level.locations[x][y];
    if (((lev.typ) == DOOR) && (lev.flags & (4 | 8)) != 0) {
        return (1);
    }
    return (0);
}
export function pm_to_humidity(pm) {
    let loc = 1;
    if (!pm) {
        return loc;
    }
    if (pm.mlet == S_EEL || (((pm).mflags1 & 512) != 0) || (((pm).mflags1 & 2) != 0)) {
        loc = 2;
    }
    if ((((pm).mflags1 & 1) != 0) || ((pm).mlet == S_EYE || (pm).mlet == S_LIGHT)) {
        loc |= (4 | 2);
    }
    if ((((pm).mflags1 & 8) != 0) || ((pm).mlet == S_GHOST)) {
        loc |= 8;
    }
    if (((pm) == game.mons[PM_FIRE_VORTEX] || (pm) == game.mons[PM_FLAMING_SPHERE] || (pm == game.mons[PM_FIRE_ELEMENTAL] || pm == game.mons[PM_SALAMANDER]))) {
        loc |= 4;
    }
    return loc;
}
/*
 * Convert a special level alignment mask (an alignment mask with possible
 * extra values/flags) to a "normal" alignment mask (no extra flags).
 *
 * When random: there is an 80% chance that the altar will be co-aligned.
 */
export function sp_amask_to_amask(sp_amask) {
    let amask = 0;
    if (sp_amask == 32) {
        amask = ((((game.u.ualignbase[1]) == (-128)) ? 0 : ((game.u.ualignbase[1]) == 1) ? 4 : ((game.u.ualignbase[1]) + 2)));
    } else if (sp_amask == 64) {
        amask = ((((noncoalignment(game.u.ualignbase[1])) == (-128)) ? 0 : ((noncoalignment(game.u.ualignbase[1])) == 1) ? 4 : ((noncoalignment(game.u.ualignbase[1])) + 2)));
    } else if (sp_amask == 128) {
        amask = induced_align(80);
    } else {
        amask = sp_amask & 7;
    }
    return amask;
}
export async function create_monster(m, croom) {
    let mtmp = null;
    let x = 0;
    let y = 0;
    let class_ = 0;
    let amask = 0;
    let cc = { x: 0, y: 0 };
    let pm = null;
    let g_mvflags = 0;
    if (m.class >= 0) {
        class_ = def_char_to_monclass(m.class);
    } else {
        class_ = 0;
    }
    if (class_ == MAXMCLASSES) {
        await panic("create_monster: unknown monster class '%c'", m.class);
    }
    amask = sp_amask_to_amask(m.sp_amask);
    if (!class_) {
        pm = null;
    } else if (m.id != NON_PM) {
        pm = game.mons[m.id];
        g_mvflags = game.mvitals[((pm).pmidx)].mvflags;
        if ((pm.geno & 4096) && (g_mvflags & 1)) {
            return;
        }
        if (g_mvflags & (2 | 1)) {
            pm = null;
        }
    } else {
        pm = await mkclass(class_, 512);
    }
    if (In_mines(game.u.uz) && pm && (((pm).mflags2 & game.urace.selfmask) != 0) && ((game.urace.mnum == (PM_DWARF)) || (game.urace.mnum == (PM_GNOME))) && rn2(3)) {
        pm = null;
    }
    if (pm) {
        let loc = pm_to_humidity(pm);
        await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, loc | 32, croom, m.coord);
        if (x == -1 && y == -1) {
            loc |= 1;
            await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, loc, croom, m.coord);
        }
    } else {
        await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, croom, m.coord);
    }
    if ((game.level.monsters[x][y] != null) && await enexto(cc, x, y, pm)) {
        x = cc.x , y = cc.y;
    }
    if (croom && !inside_room(croom, x, y)) {
        return;
    }
    if (m.sp_amask != 128) {
        mtmp = await mk_roamer(pm, (((((amask) & 7) == 0) ? (-128) : (((amask) & 7) == 4) ? 1 : (((amask) & 7)) - 2)), x, y, m.peaceful);
    } else if (PM_ARCHEOLOGIST <= m.id && m.id <= PM_WIZARD) {
        mtmp = await mk_mplayer(pm, x, y, (0));
    } else {
        mtmp = await makemon(pm, x, y, m.mm_flags);
    }
    if (mtmp) {
        x = mtmp.mx , y = mtmp.my;
        m.x = x , m.y = y;
        /* handle specific attributes for some special monsters */
        if (m.name.str) {
            mtmp = christen_monst(mtmp, m.name.str);
        }
        if (m.appear_as.str && ((mtmp.data.mlet == S_MIMIC) || (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS) && m.appear == M_AP_MONSTER)) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
            /*
         * This doesn't complain if an attempt is made to give a
         * non-mimic/non-shapechanger an appearance or to give a
         * shapechanger a non-monster shape, it just refuses to comply.
         */
            /* shapechanger (chameleons, et al, and vampires) */
            /* prevent endless loop in case makemon always fails */
            let i = 0;
            switch (m.appear) {
                case M_AP_NOTHING:
                    await impossible("create_monster: mon has an appearance, \"%s\", but no type", m.appear_as.str);
                    break;
                case M_AP_FURNITURE:
                    for (i = 0; i < MAXPCHARS; i++) {
                        if (!strcmp(defsyms[i].explanation, m.appear_as.str)) {
                            break;
                        }
                    }
                    if (i == MAXPCHARS) {
                        await impossible("create_monster: can't find feature \"%s\"", m.appear_as.str);
                    } else {
                        mtmp.m_ap_type = M_AP_FURNITURE;
                        mtmp.mappearance = i;
                    }
                    break;
                case M_AP_OBJECT:
                    for (i = 0; i < NUM_OBJECTS; i++) {
                        if ((game.obj_descr[(game.objects[i]).oc_name_idx].oc_name) && !strcmp((game.obj_descr[(game.objects[i]).oc_name_idx].oc_name), m.appear_as.str)) {
                            break;
                        }
                    }
                    if (i == NUM_OBJECTS) {
                        await impossible("create_monster: can't find object \"%s\"", m.appear_as.str);
                    } else {
                        mtmp.m_ap_type = M_AP_OBJECT;
                        mtmp.mappearance = i;
                        if (i == BOULDER && m.x < 0 && m_bad_boulder_spot(x, y)) {
                            /* try to avoid placing mimic boulder on a trap */
                            let retrylimit = 10;
                            game.level.monsters[x][y] = null;
                            do {
                                x = m.x;
                                y = m.y;
                                await get_location({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, croom);
                                if ((game.level.monsters[x][y] != null) && await enexto(cc, x, y, pm)) {
                                    x = cc.x , y = cc.y;
                                }
                            } while (m_bad_boulder_spot(x, y) && --retrylimit > 0);
                            await place_monster(mtmp, x, y);
                            if (!retrylimit) {
                                await set_mimic_sym(mtmp);
                            }
                        }
                    }
                    break;
                case M_AP_MONSTER:
{
                        let mndx = 0;
                        let gender_name_var = NEUTRAL;
                        if (!strncmpi((m.appear_as.str), ("random"), -1)) {
                            mndx = await select_newcham_form(mtmp);
                        } else {
                            mndx = await name_to_mon(m.appear_as.str, { get value() { return gender_name_var; }, set value(_v) { gender_name_var = _v; } });
                        }
                        if (mndx == NON_PM || (((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) && !validvamp(mtmp, { get value() { return mndx; }, set value(_v) { mndx = _v; } }, S_HUMAN))) {
                            await impossible("create_monster: invalid %s (\"%s\")", (mtmp.data.mlet == S_MIMIC) ? "mimic appearance" : (mtmp.data == game.mons[PM_WIZARD_OF_YENDOR]) ? "Wizard appearance" : ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) ? "vampire shape" : "chameleon shape", m.appear_as.str);
                        } else if (game.mons[mndx] == mtmp.data) {
                            /* explicitly forcing a mimic to appear as itself */
                            mtmp.m_ap_type = M_AP_NOTHING;
                            mtmp.mappearance = 0;
                        } else if (mtmp.data.mlet == S_MIMIC || mtmp.data == game.mons[PM_WIZARD_OF_YENDOR]) {
                            /* this is ordinarily only used for Wizard clones
                       and hasn't been exhaustively tested for mimics */
                            mtmp.m_ap_type = M_AP_MONSTER;
                            mtmp.mappearance = mndx;
                        } else {
                            let mdat = game.mons[mndx];
                            let olddata = mtmp.data;
                            mgender_from_permonst(mtmp, mdat);
                            if (gender_name_var != NEUTRAL) {
                                mtmp.female = gender_name_var;
                            }
                            set_mon_data(mtmp, mdat);
                            if ((((olddata).mlet == S_LIGHT || (olddata) == game.mons[PM_FLAMING_SPHERE] || (olddata) == game.mons[PM_SHOCKING_SPHERE] || (olddata) == game.mons[PM_BABY_GOLD_DRAGON] || (olddata) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((olddata) == game.mons[PM_FIRE_ELEMENTAL] || (olddata) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0) != (((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
                                /* used to give light, now doesn't, or vice versa,
                           or light's range has changed */
                                if ((((olddata).mlet == S_LIGHT || (olddata) == game.mons[PM_FLAMING_SPHERE] || (olddata) == game.mons[PM_SHOCKING_SPHERE] || (olddata) == game.mons[PM_BABY_GOLD_DRAGON] || (olddata) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((olddata) == game.mons[PM_FIRE_ELEMENTAL] || (olddata) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
                                    await del_light_source(LS_MONSTER, monst_to_any(mtmp));
                                }
                                if ((((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
                                    await new_light_source(mtmp.mx, mtmp.my, (((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0), LS_MONSTER, monst_to_any(mtmp));
                                }
                            }
                            if (!mtmp.perminvis || ((olddata) == game.mons[PM_STALKER] || (olddata) == game.mons[PM_BLACK_LIGHT])) {
                                mtmp.perminvis = ((mdat) == game.mons[PM_STALKER] || (mdat) == game.mons[PM_BLACK_LIGHT]);
                            }
                        }
                        break;
                    }
                default:
                    await impossible("create_monster: unimplemented mon appear type [%d,\"%s\"]", m.appear, m.appear_as.str);
                    break;
            }
            if (does_block(x, y, game.level.locations[x][y])) {
                block_point(x, y);
            }
        }
        mtmp.female = m.female;
        if (m.peaceful > (-1)) {
            mtmp.mpeaceful = m.peaceful;
            /* changed mpeaceful again; have to reset malign */
            set_malign(mtmp);
        }
        if (m.asleep > (-1)) {
            mtmp.msleeping = m.asleep;
        }
        if (m.seentraps) {
            mtmp.mtrapseen = m.seentraps;
        }
        if (m.cancelled) {
            mtmp.mcan = 1;
        }
        if (m.revived) {
            mtmp.mrevived = 1;
        }
        if (m.avenge) {
            mtmp.mavenge = 1;
        }
        if (m.stunned) {
            mtmp.mstun = 1;
        }
        if (m.confused) {
            mtmp.mconf = 1;
        }
        if (m.invis) {
            mtmp.minvis = mtmp.perminvis = 1;
        }
        if (m.blinded) {
            mtmp.mcansee = 0;
            mtmp.mblinded = (m.blinded % 127);
        }
        if (m.paralyzed) {
            mtmp.mcanmove = 0;
            mtmp.mfrozen = (m.paralyzed % 127);
        }
        if (m.fleeing) {
            mtmp.mflee = 1;
            mtmp.mfleetim = (m.fleeing % 127);
        }
        if (m.waiting) {
            mtmp.mstrategy |= 536870912;
            /* if this is a vampire that got created already shifted into
               bat/fog/wolf form and the special level or theme room didn't
               explicitly request that, shift back to vampire */
            if (((((mtmp)).cham == PM_VAMPIRE || ((mtmp)).cham == PM_VAMPIRE_LEADER || ((mtmp)).cham == PM_VLAD_THE_IMPALER) && !(((mtmp).data).mlet == S_VAMPIRE)) && m.appear != M_AP_MONSTER) {
                await newcham(mtmp, game.mons[mtmp.cham], 0);
            }
        }
        if (m.m_lev_adj) {
            if (mtmp.m_lev + m.m_lev_adj > 49) {
                mtmp.m_lev = 49;
            } else if (mtmp.m_lev + m.m_lev_adj < 0) {
                mtmp.m_lev = 0;
            } else {
                mtmp.m_lev += m.m_lev_adj;
            }
        }
        if (!(m.has_invent & 2)) {
            await mdrop_special_objs(mtmp);
            await discard_minvent(mtmp, (1));
        }
        if (m.has_invent & 1) {
            game.invent_carrying_monster = mtmp;
        }
    }
}
/*
 * Create an object in a room.
 */
const __create_object_prize_warning = "multiple prizes on %s level";
export async function create_object(o, croom) {
    let otmp = null;
    let x = 0;
    let y = 0;
    let c = 0;
    /* has a name been supplied in level description? */
    let named = 0;
    named = o.name.str ? (1) : (0);
    await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, croom, o.coord);
    if (o.class >= 0) {
        c = o.class;
    } else {
        c = 0;
    }
    if (!c) {
        otmp = await mkobj_at(RANDOM_CLASS, x, y, !named);
    } else if (o.id != -1) {
        otmp = await mksobj_at(o.id, x, y, (1), !named);
    } else {
        /*
         * The special levels are compiled with the default "text" object
         * class characters.  We must convert them to the internal format.
         */
        let oclass = def_char_to_objclass(c);
        if (oclass == MAXOCLASSES) {
            await panic("create_object:  unexpected object class '%c'", c);
        }
        if (oclass == COIN_CLASS) {
            otmp = await mkgold(0, x, y);
        } else {
            otmp = await mkobj_at(oclass, x, y, !named);
        }
    }
    if (o.spe != -127) {
        otmp.spe = o.spe;
    }
    switch (o.curse_state) {
        case 1:
            await bless(otmp);
            break;
        case 2:
            await unbless(otmp);
            await uncurse(otmp);
            break;
        case 3:
            await curse(otmp);
            break;
        case 4:
            await uncurse(otmp);
            break;
        case 5:
            await blessorcurse(otmp, 1);
            break;
        case 6:
            await unbless(otmp);
            break;
        default:
            break;
    }
    if (o.corpsenm != NON_PM) {
        if (o.corpsenm == NON_PM - 1) {
            await set_corpsenm(otmp, await rndmonnum());
        } else {
            await set_corpsenm(otmp, o.corpsenm);
        }
    }
    if (named) {
        otmp = await oname(otmp, o.name.str, 32);
        if (otmp.otyp == SPE_NOVEL) {
            await lookup_novel(o.name.str, { get value() { return otmp.corpsenm; }, set value(_v) { otmp.corpsenm = _v; } });
        }
    }
    if (o.eroded) {
        if (o.eroded < 0) {
            otmp.oerodeproof = 1;
        } else {
            otmp.oeroded = (o.eroded % 4);
            otmp.oeroded2 = ((o.eroded >> 2) % 4);
        }
    } else {
        otmp.oeroded = otmp.oeroded2 = 0;
        otmp.oerodeproof = 0;
    }
    if (o.recharged) {
        otmp.recharged = (o.recharged % 8);
    }
    if (o.locked == 0 || o.locked == 1) {
        otmp.olocked = o.locked;
    } else if (o.broken) {
        otmp.obroken = 1;
        otmp.olocked = 0;
    }
    if (o.trapped == 0 || o.trapped == 1) {
        otmp.otrapped = o.trapped;
    }
    if (o.trapped && (o.tknown == 0 || o.tknown == 1)) {
        otmp.tknown = o.tknown;
    }
    otmp.greased = o.greased ? 1 : 0;
    if (o.quan > 0 && game.objects[otmp.otyp].oc_merge) {
        otmp.quan = o.quan;
        otmp.owt = await weight(otmp);
    }
    if (o.containment & 1 || game.invent_carrying_monster) {
        if (!game.container_idx) {
            if (!game.invent_carrying_monster) {
                ;
            } else {
                await remove_object(otmp);
                if (otmp.otyp == SADDLE && can_saddle(game.invent_carrying_monster)) {
                    await put_saddle_on_mon(otmp, game.invent_carrying_monster);
                } else {
                    await mpickobj(game.invent_carrying_monster, otmp);
                }
            }
        } else {
            let cobj = game.container_obj[game.container_idx - 1];
            await remove_object(otmp);
            if (cobj) {
                otmp = await add_to_container(cobj, otmp);
                cobj.owt = await weight(cobj);
            } else {
                await obj_extract_self(otmp);
                if (otmp.oartifact) {
                    await artifact_exists(otmp, safe_oname(otmp), (0), 0);
                }
                await obfree(otmp, null);
                return null;
            }
        }
    }
    if (o.containment & 2) {
        await delete_contents(otmp);
        if (game.container_idx < 10) {
            game.container_obj[game.container_idx] = otmp;
            game.container_idx++;
        } else {
            await impossible("create_object: too deeply nested containers.");
        }
    }
    if (o.id == STATUE && (((((game.dungeon_topology.d_medusa_level)).dlevel || ((game.dungeon_topology.d_medusa_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_medusa_level)))) && o.corpsenm == NON_PM) {
        /* Medusa level special case: statues are petrified monsters, so they
     * are not stone-resistant and have monster inventory.  They also lack
     * other contents, but that can be specified as an empty container.
     */
        let was = null;
        let obj = null;
        let wastyp = 0;
        let i = 0;
        for (wastyp = otmp.corpsenm; i < 1000; i++ , wastyp = await rndmonnum()) {
            was = await makemon(game.mons[wastyp], 0, 0, 4 | 131072);
            if (was) {
                if (!await Resists_Elem(was, STONE_RES) && !poly_when_stoned(game.mons[wastyp])) {
                    await propagate(wastyp, (1), (0));
                    break;
                }
                await mongone(was);
                was = null;
            }
        }
        if (was) {
            await set_corpsenm(otmp, wastyp);
            while (was.minvent) {
                obj = was.minvent;
                obj.owornmask = 0;
                await obj_extract_self(obj);
                await add_to_container(otmp, obj);
            }
            otmp.owt = await weight(otmp);
            await mongone(was);
        }
    }
    if (o.achievement) {
        if ((((((game.dungeon_topology.d_mineend_level)).dlevel || ((game.dungeon_topology.d_mineend_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_mineend_level))))) {
            if (!game.context.achieveo.mines_prize_oid) {
                game.context.achieveo.mines_prize_oid = otmp.o_id;
                game.context.achieveo.mines_prize_otyp = otmp.otyp;
                /* prevent stacking; cleared when achievement is recorded;
                   will be reset in addinv_core1() */
                /* redundant; Sokoban prizes don't stack;
                                    * will be reset in addinv_core1() */
                otmp.nomerge = 1;
            } else {
                await impossible(__create_object_prize_warning, "mines end");
            }
        } else if ((((((game.dungeon_topology.d_sokoend_level)).dlevel || ((game.dungeon_topology.d_sokoend_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sokoend_level))))) {
            if (!game.context.achieveo.soko_prize_oid) {
                game.context.achieveo.soko_prize_oid = otmp.o_id;
                game.context.achieveo.soko_prize_otyp = otmp.otyp;
                otmp.nomerge = 1;
            } else {
                await impossible(__create_object_prize_warning, "sokoban end");
            }
        } else if (!game.iflags.lua_testing) {
            let lbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            describe_level(lbuf, 1 | 2);
            await impossible("create_object: unknown achievement (%s\"%s\")", lbuf, await simpleonames(otmp));
        }
    }
    if (!(o.containment & 1)) {
        await stackobj(otmp);
        if (o.lit) {
            await begin_burn(otmp, (0));
        }
        if (o.buried) {
            let dealloced = 0;
            await bury_an_obj(otmp, { get value() { return dealloced; }, set value(_v) { dealloced = _v; } });
            if (dealloced) {
                if (game.container_idx) {
                    game.container_obj[game.container_idx - 1] = null;
                }
                otmp = null;
            }
        }
    }
    return otmp;
}
/*
 * Create an altar in a room.
 */
export async function create_altar(a, croom) {
    let sproom = 0;
    let x = -1;
    let y = -1;
    let amask = 0;
    let croom_is_temple = (1);
    if (croom) {
        await get_free_room_loc({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, croom, a.coord);
        if (croom.rtype != TEMPLE) {
            croom_is_temple = (0);
        }
    } else {
        await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, croom, a.coord);
        if ((sproom = in_rooms(x, y, TEMPLE)) != 0) {
            croom = game.rooms[sproom - 3];
        } else {
            croom_is_temple = (0);
        }
    }
    if (!await set_levltyp(x, y, ALTAR)) {
        return;
    }
    amask = sp_amask_to_amask(a.sp_amask);
    game.level.locations[x][y].flags = amask;
    if (a.shrine < 0) {
        a.shrine = rn2(2);
    }
    if (!croom_is_temple || !a.shrine) {
        return;
    }
    if (a.shrine) {
        await priestini(game.u.uz, croom, x, y, (a.shrine > 1));
        game.level.locations[x][y].flags |= 8;
        if (a.shrine == 2) {
            game.level.locations[x][y].flags |= 16;
        }
        game.level.flags.has_temple = (1);
    }
}
/*
 * Search for a door in a room on a specified wall.
 */
export async function search_door(croom, x, y, wall, cnt) {
    let dx = 0;
    let dy = 0;
    let xx = 0;
    let yy = 0;
    switch (wall) {
        case 2:
            dy = 0;
            dx = 1;
            xx = croom.lx;
            yy = croom.hy + 1;
            break;
        case 1:
            dy = 0;
            dx = 1;
            xx = croom.lx;
            yy = croom.ly - 1;
            break;
        case 4:
            dy = 1;
            /* no, what must we do now?? */
            dx = 0;
            xx = croom.hx + 1;
            yy = croom.ly;
            break;
        case 8:
            dy = 1;
            dx = 0;
            xx = croom.lx - 1;
            yy = croom.ly;
            break;
        default:
            await panic("search_door: Bad wall!");
    }
    while (xx <= croom.hx + 1 && yy <= croom.hy + 1) {
        if (((game.level.locations[xx][yy].typ) == DOOR) || game.level.locations[xx][yy].typ == SDOOR) {
            x.value = xx;
            y.value = yy;
            if (cnt-- <= 0) {
                return (1);
            }
        }
        xx += dx;
        yy += dy;
    }
    return (0);
}
/*
 * Dig a corridor between two points, using terrain ftyp.
 * if nxcor is TRUE, he corridor may be blocked by a boulder,
 * or just end without reaching the destination.
 * if not null, npoints has the number of map locations used
 */
export async function dig_corridor(org, dest, npoints, nxcor, ftyp, btyp) {
    let dx = 0;
    let dy = 0;
    let dix = 0;
    let diy = 0;
    let cct = 0;
    let crm = null;
    let tx = 0;
    let ty = 0;
    let xx = 0;
    let yy = 0;
    if (npoints) {
        npoints.value = 0;
    }
    xx = org.x;
    yy = org.y;
    tx = dest.x;
    ty = dest.y;
    if (xx <= 0 || yy <= 0 || tx <= 0 || ty <= 0 || xx > 80 - 1 || tx > 80 - 1 || yy > 21 - 1 || ty > 21 - 1) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/sp_lev.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                await pline("dig_corridor: bad coords <%d,%d> <%d,%d>.", xx, yy, tx, ty);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        return (0);
    }
    if (tx > xx) {
        dx = 1;
    } else if (ty > yy) {
        dy = 1;
    } else if (tx < xx) {
        dx = -1;
    } else {
        dy = -1;
    }
    xx -= dx;
    yy -= dy;
    cct = 0;
    while (xx != tx || yy != ty) {
        /* loop: dig corridor at [xx,yy] and find new [xx,yy] */
        if (cct++ > 500 || (nxcor && !rn2(35))) {
            return (0);
        }
        xx += dx;
        yy += dy;
        if (xx >= 80 - 1 || xx <= 0 || yy <= 0 || yy >= 21 - 1) {
            return (0);
        }
        crm = game.level.locations[xx][yy];
        if (crm.typ == btyp) {
            if (ftyp == CORR && maybe_sdoor(100)) {
                if (npoints) {
                    (npoints.value)++;
                }
                crm.typ = SCORR;
            } else {
                if (npoints) {
                    (npoints.value)++;
                }
                crm.typ = ftyp;
                if (nxcor && !rn2(50)) {
                    await mksobj_at(BOULDER, xx, yy, (1), (0));
                }
            }
        } else if (crm.typ != ftyp && crm.typ != SCORR) {
            return (0);
        }
        /* find next corridor position */
        dix = abs(xx - tx);
        diy = abs(yy - ty);
        if ((dix > diy) && diy && !rn2(dix - diy + 1)) {
            dix = 0;
        } else if ((diy > dix) && dix && !rn2(diy - dix + 1)) {
            diy = 0;
        }
        if (dy && dix > diy) {
            /* do we have to change direction ? */
            let ddx = (xx > tx) ? -1 : 1;
            crm = game.level.locations[xx + ddx][yy];
            if (crm.typ == btyp || crm.typ == ftyp || crm.typ == SCORR) {
                dx = ddx;
                dy = 0;
                continue;
            }
        } else if (dx && diy > dix) {
            let ddy = (yy > ty) ? -1 : 1;
            crm = game.level.locations[xx][yy + ddy];
            if (crm.typ == btyp || crm.typ == ftyp || crm.typ == SCORR) {
                dy = ddy;
                dx = 0;
                continue;
            }
        }
        crm = game.level.locations[xx + dx][yy + dy];
        if (crm.typ == btyp || crm.typ == ftyp || crm.typ == SCORR) {
            continue;
        }
        if (dx) {
            dx = 0;
            dy = (ty < yy) ? -1 : 1;
        } else {
            dy = 0;
            dx = (tx < xx) ? -1 : 1;
        }
        crm = game.level.locations[xx + dx][yy + dy];
        if (crm.typ == btyp || crm.typ == ftyp || crm.typ == SCORR) {
            continue;
        }
        dy = -dy;
        dx = -dx;
    }
    return (1);
}
/*
 * Corridors always start from a door. But it can end anywhere...
 * Basically we search for door coordinates or for endpoints coordinates
 * (from a distance).
 */
export async function create_corridor(c) {
    let org = { x: 0, y: 0 };
    let dest = { x: 0, y: 0 };
    if (c.src.room == -1) {
        await makecorridors();
        return;
    }
    if (c.src.wall == (1 | 2 | 4 | 8) || c.src.wall == -1 || c.dest.wall == (1 | 2 | 4 | 8) || c.dest.wall == -1) {
        await impossible("create_corridor to/from a random wall");
        return;
    }
    if (!await search_door(game.rooms[c.src.room], { get value() { return org.x; }, set value(_v) { org.x = _v; } }, { get value() { return org.y; }, set value(_v) { org.y = _v; } }, c.src.wall, c.src.door)) {
        return;
    }
    if (c.dest.room != -1) {
        if (!await search_door(game.rooms[c.dest.room], { get value() { return dest.x; }, set value(_v) { dest.x = _v; } }, { get value() { return dest.y; }, set value(_v) { dest.y = _v; } }, c.dest.wall, c.dest.door)) {
            return;
        }
        switch (c.src.wall) {
            case 1:
                org.y--;
                break;
            case 2:
                org.y++;
                break;
            case 8:
                org.x--;
                break;
            case 4:
                org.x++;
                break;
        }
        switch (c.dest.wall) {
            case 1:
                dest.y--;
                break;
            case 2:
                dest.y++;
                break;
            case 8:
                dest.x--;
                break;
            case 4:
                dest.x++;
                break;
        }
        await dig_corridor(org, dest, null, (0), CORR, STONE);
    }
}
/*
 * Fill a room (shop, zoo, etc...) with appropriate stuff.
 */
export async function fill_special_room(croom) {
    let i = 0;
    if (!croom) {
        return;
    }
    for (i = 0; i < croom.nsubrooms; ++i) {
        await fill_special_room(croom.sbrooms[i]);
    }
    if (croom.rtype == OROOM || croom.rtype == THEMEROOM || croom.needfill == 0) {
        return;
    }
    if (croom.needfill == 1) {
        let x = 0;
        let y = 0;
        if (croom.rtype >= SHOPBASE) {
            await stock_room(croom.rtype - SHOPBASE, croom);
            game.level.flags.has_shop = (1);
            return;
        }
        switch (croom.rtype) {
            case VAULT:
                for (x = croom.lx; x <= croom.hx; x++) {
                    for (y = croom.ly; y <= croom.hy; y++) {
                        await mkgold((rn2(abs(depth(game.u.uz)) * 100) + (51)), x, y);
                    }
                }
                break;
            case COURT:
            case ZOO:
            case BEEHIVE:
            case ANTHOLE:
            case COCKNEST:
            case LEPREHALL:
            case MORGUE:
            case BARRACKS:
                await fill_zoo(croom);
                break;
        }
    }
    switch (croom.rtype) {
        case VAULT:
            game.level.flags.has_vault = (1);
            break;
        case ZOO:
            game.level.flags.has_zoo = (1);
            break;
        case COURT:
            game.level.flags.has_court = (1);
            break;
        case MORGUE:
            game.level.flags.has_morgue = (1);
            break;
        case BEEHIVE:
            game.level.flags.has_beehive = (1);
            break;
        case BARRACKS:
            game.level.flags.has_barracks = (1);
            break;
        case TEMPLE:
            game.level.flags.has_temple = (1);
            break;
        case SWAMP:
            game.level.flags.has_swamp = (1);
            break;
    }
}
export async function build_room(r, mkr) {
    let okroom = 0;
    let aroom = null;
    let rtype = (!r.chance || rn2(100) < r.chance) ? r.rtype : OROOM;
    if (mkr) {
        aroom = game.subrooms[game.nsubroom];
        okroom = await create_subroom(mkr, r.x, r.y, r.w, r.h, rtype, r.rlit);
    } else {
        aroom = game.rooms[game.nroom];
        okroom = await create_room(r.x, r.y, r.w, r.h, r.xalign, r.yalign, rtype, r.rlit);
    }
    if (okroom) {
        topologize(aroom);
        aroom.needfill = r.needfill;
        aroom.needjoining = r.joined;
        return aroom;
    }
    return null;
}
/*
 * set lighting in a region that will not become a room.
 */
export function light_region(tmpregion) {
    let litstate = tmpregion.rlit ? 1 : 0;
    let hiy = tmpregion.y2;
    let x = 0;
    let y = 0;
    let lev = null;
    let lowy = tmpregion.y1;
    let lowx = tmpregion.x1;
    let hix = tmpregion.x2;
    if (litstate) {
        /* adjust region size for walls, but only if lighted */
        lowx = ((lowx - 1) > (1) ? (lowx - 1) : (1));
        hix = ((hix + 1) < (80 - 1) ? (hix + 1) : (80 - 1));
        lowy = ((lowy - 1) > (0) ? (lowy - 1) : (0));
        hiy = ((hiy + 1) < (21 - 1) ? (hiy + 1) : (21 - 1));
    }
    for (x = lowx; x <= hix; x++) {
        for (y = lowy; y <= hiy; y++) {
            lev = game.level.locations[x][y];
            lev.lit = ((lev.typ) == LAVAPOOL || (lev.typ) == LAVAWALL) ? 1 : litstate;
        }
    }
}
export function wallify_map(x1, y1, x2, y2) {
    let x = 0;
    let y = 0;
    let xx = 0;
    let yy = 0;
    let lo_xx = 0;
    let lo_yy = 0;
    let hi_xx = 0;
    let hi_yy = 0;
    y1 = ((y1) > (0) ? (y1) : (0));
    x1 = ((x1) > (1) ? (x1) : (1));
    y2 = ((y2) < (21 - 1) ? (y2) : (21 - 1));
    x2 = ((x2) < (80 - 1) ? (x2) : (80 - 1));
    for (y = y1; y <= y2; y++) {
        lo_yy = (y > 0) ? y - 1 : 0;
        hi_yy = (y < y2) ? y + 1 : y2;
        for (x = x1; x <= x2; x++) {
            if (game.level.locations[x][y].typ != STONE) {
                continue;
            }
            lo_xx = (x > 1) ? x - 1 : 1;
            hi_xx = (x < x2) ? x + 1 : x2;
            for (yy = lo_yy; yy <= hi_yy; yy++) {
                for (xx = lo_xx; xx <= hi_xx; xx++) {
                    if (((game.level.locations[xx][yy].typ) >= ROOM) || game.level.locations[xx][yy].typ == CROSSWALL) {
                        game.level.locations[x][y].typ = (yy != y) ? HWALL : VWALL;
                        yy = hi_yy;
                        break;
                    }
                }
            }
        }
    }
}
/*
 * Select a random coordinate in the maze.
 *
 * We want a place not 'touched' by the loader.  That is, a place in
 * the maze outside every part of the special level.
 */
export function maze1xy(m, humidity) {
    let x = 0;
    let y = 0;
    let tryct = 2000;
    /* tryct:  normally it won't take more than ten or so tries due
       to the circumstances under which we'll be called, but the
       `humidity' screening might drastically change the chances */
    do {
        x = (rn2(game.x_maze_max - 3) + (3));
        y = (rn2(game.y_maze_max - 3) + (3));
        if (--tryct < 0) {
            break;
        }
    } while (!(x % 2) || !(y % 2) || game.SpLev_Map[x][y] || !is_ok_location(x, y, humidity));
    m.x = x , m.y = y;
}
/*
 * If there's a significant portion of maze unused by the special level,
 * we don't want it empty.
 *
 * Makes the number of traps, monsters, etc. proportional
 * to the size of the maze.
 */
export async function fill_empty_maze() {
    let mapcountmax = 0;
    let mapcount = 0;
    let mapfact = 0;
    let x = 0;
    let y = 0;
    let mm = { x: 0, y: 0 };
    mapcountmax = mapcount = (game.x_maze_max - 2) * (game.y_maze_max - 2);
    mapcountmax = Math.trunc(mapcountmax / 2);
    for (x = 2; x < game.x_maze_max; x++) {
        for (y = 0; y < game.y_maze_max; y++) {
            if (game.SpLev_Map[x][y]) {
                mapcount--;
            }
        }
    }
    if ((mapcount > (Math.trunc(mapcountmax / 10)))) {
        mapfact = (Math.trunc((mapcount * 100) / mapcountmax));
        for (x = rnd(Math.trunc((20 * mapfact) / 100)); x; x--) {
            maze1xy(mm, 1);
            await mkobj_at(rn2(2) ? GEM_CLASS : RANDOM_CLASS, mm.x, mm.y, (1));
        }
        for (x = rnd(Math.trunc((12 * mapfact) / 100)); x; x--) {
            let ttmp = null;
            maze1xy(mm, 1);
            if ((ttmp = t_at(mm.x, mm.y)) != null && (((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT) || ((ttmp.ttyp) == HOLE || (ttmp.ttyp) == TRAPDOOR))) {
                continue;
            }
            await mksobj_at(BOULDER, mm.x, mm.y, (1), (0));
        }
        for (x = rn2(2); x; x--) {
            maze1xy(mm, 1);
            await makemon(game.mons[PM_MINOTAUR], mm.x, mm.y, 0);
        }
        for (x = rnd(Math.trunc((12 * mapfact) / 100)); x; x--) {
            maze1xy(mm, 1);
            await makemon(null, mm.x, mm.y, 0);
        }
        for (x = rn2(Math.trunc((15 * mapfact) / 100)); x; x--) {
            maze1xy(mm, 1);
            await mkgold(0, mm.x, mm.y);
        }
        for (x = rn2(Math.trunc((15 * mapfact) / 100)); x; x--) {
            let trytrap = 0;
            maze1xy(mm, 1);
            trytrap = rndtrap();
            if (sobj_at(BOULDER, mm.x, mm.y)) {
                while (((trytrap) == PIT || (trytrap) == SPIKED_PIT) || ((trytrap) == HOLE || (trytrap) == TRAPDOOR)) {
                    trytrap = rndtrap();
                }
            }
            await maketrap(mm.x, mm.y, trytrap);
        }
    }
}
export async function splev_initlev(linit) {
    switch (linit.init_style) {
        default:
            await impossible("Unrecognized level init style.");
            break;
        case LVLINIT_NONE:
            break;
        case LVLINIT_SOLIDFILL:
            if (linit.lit == (-1)) {
                linit.lit = rn2(2);
            }
            await lvlfill_solid(linit.filling, linit.lit);
            break;
        case LVLINIT_MAZEGRID:
            lvlfill_maze_grid(2, 0, game.x_maze_max, game.y_maze_max, linit.bg);
            break;
        case LVLINIT_MAZE:
            await create_maze(linit.corrwid, linit.wallthick, linit.rm_deadends);
            break;
        case LVLINIT_ROGUE:
            await makeroguerooms();
            break;
        case LVLINIT_MINES:
            if (linit.lit == (-1)) {
                linit.lit = rn2(2);
            }
            if (linit.filling > -1) {
                await lvlfill_solid(linit.filling, 0);
            }
            linit.icedpools = game.icedpools;
            await mkmap(linit);
            break;
        case LVLINIT_SWAMP:
            if (linit.lit == (-1)) {
                linit.lit = rn2(2);
            }
            await lvlfill_swamp(linit.fg, linit.bg, linit.lit);
            break;
    }
}
/*ARGUSED*/
export async function spo_end_moninvent() {
    if (game.invent_carrying_monster) {
        await m_dowear(game.invent_carrying_monster, (1));
    }
    game.invent_carrying_monster = null;
}
/*ARGUSED*/
export function spo_pop_container() {
    if (game.container_idx > 0) {
        game.container_idx--;
        game.container_obj[game.container_idx] = null;
    }
}
/* push a table on lua stack: {width=wid, height=hei} */
export function l_push_wid_hei_table(L, wid, hei) {
    /* register des -table, and functions for it */
    lua_newtable(L);
    nhl_add_table_entry_int(L, "width", wid);
    nhl_add_table_entry_int(L, "height", hei);
}
/* push a table on lua stack containing room data */
export async function l_push_mkroom_table(L, tmpr) {
    lua_newtable(L);
    nhl_add_table_entry_int(L, "width", 1 + (tmpr.hx - tmpr.lx));
    nhl_add_table_entry_int(L, "height", 1 + (tmpr.hy - tmpr.ly));
    nhl_add_table_entry_region(L, "region", tmpr.lx, tmpr.ly, tmpr.hx, tmpr.hy);
    nhl_add_table_entry_bool(L, "lit", tmpr.rlit);
    nhl_add_table_entry_bool(L, "irregular", tmpr.irregular);
    nhl_add_table_entry_bool(L, "needjoining", tmpr.needjoining);
    nhl_add_table_entry_str(L, "type", await get_mkroom_name(tmpr.rtype));
}
/* message("What a strange feeling!"); */
export async function lspo_message(L) {
    let levmsg = null;
    let old_n = 0;
    let n = 0;
    let msg = null;
    let argc = lua_gettop(L);
    if (argc < 1) {
        nhl_error(L, "Wrong parameters");
        /* TODO: skip the rest of this function? */
        return 0;
    }
    /* TODO: clamp coord values */
    /* TODO: maybe allow wallify({x1,y1}, {x2,y2}) */
    /* TODO: is_table_coord(), is_table_area(),
             get_table_coord(), get_table_area() */
    create_des_coder();
    msg = luaL_checkstring(L, 1);
    old_n = game.lev_message ? (await Strlen_(game.lev_message, "lspo_message", 3094) + 1) : 0;
    n = await Strlen_(msg, "lspo_message", 3095);
    levmsg = alloc(old_n + n + 1);
    if (old_n) {
        levmsg = __nh_char_write(levmsg, old_n - 1, 10);
    }
    if (game.lev_message) {
        memcpy(levmsg, game.lev_message, old_n - 1);
    }
    memcpy(__nh_advance_str(levmsg, old_n), msg, n);
    levmsg = __nh_char_write(levmsg, old_n + n, 0);
    do {
        if (game.lev_message) {
            free((game.lev_message));
        }
    } while (0);
    game.lev_message = levmsg;
    return 0;
}
const __get_table_align_gtaligns = ["noalign", "law", "neutral", "chaos", "coaligned", "noncoaligned", "random", null];
const __get_table_align_aligns2i = [0, 4, 2, 1, 32, 64, 128, 0];
export function get_table_align(L) {
    let a = __get_table_align_aligns2i[get_table_option(L, "align", "random", __get_table_align_gtaligns)];
    return a;
}
export function get_table_monclass(L) {
    let s = get_table_str_opt(L, "class", null);
    let ret = -1;
    if (s && strlen(s) == 1) {
        ret = __nh_char_at0(s);
    }
    do {
        if (s) {
            free((s));
        }
    } while (0);
    return ret;
}
export async function find_montype(L, s, mgender) {
    let i = 0;
    let mgend = NEUTRAL;
    i = await name_to_monplus(s, null, { get value() { return mgend; }, set value(_v) { mgend = _v; } });
    if (i >= LOW_PM && i < NUMMONS) {
        if ((((game.mons[i]).mflags2 & 65536) != 0) || (((game.mons[i]).mflags2 & 131072) != 0)) {
            mgend = (((game.mons[i]).mflags2 & 131072) != 0) ? FEMALE : MALE;
        } else {
            mgend = (mgend == FEMALE) ? FEMALE : (mgend == MALE) ? MALE : rn2(2);
        }
        if (mgender) {
            mgender.value = mgend;
        }
        return i;
    }
    if (mgender) {
        mgender.value = NEUTRAL;
    }
    return NON_PM;
}
export async function get_table_montype(L, mgender) {
    let s = get_table_str_opt(L, "id", null);
    let ret = NON_PM;
    if (s) {
        ret = await find_montype(L, s, mgender);
        do {
            if (s) {
                free((s));
            }
        } while (0);
        if (ret == NON_PM) {
            nhl_error(L, "Unknown monster id");
        }
    }
    return ret;
}
/* Get x and y values from a table (which the caller has already checked for
 * the existence of), handling both a table with x= and y= specified and a
 * table with coord= specified.
 * Returns absolute rather than map-relative coordinates; the caller of this
 * function must decide if it wants to interpret the coordinates as
 * map-relative and adjust accordingly. */
export function get_table_xy_or_coord(L, x, y) {
    let mx = get_table_int_opt(L, "x", -1);
    let my = get_table_int_opt(L, "y", -1);
    if (mx == -1 && my == -1) {
        lua_getfield(L, 1, "coord");
        get_coord(L, -1, { get value() { return mx; }, set value(_v) { mx = _v; } }, { get value() { return my; }, set value(_v) { my = _v; } });
        lua_pop(L, 1);
    }
    x.value = mx;
    y.value = my;
}
/* monster(); */
/* monster("wood nymph"); */
/* monster("D"); */
/* monster("giant eel",11,06); */
/* monster("hill giant", {08,06}); */
/* monster({ id = "giant mimic", appear_as = "obj:boulder" }); */
/* monster({ class = "H", peaceful = 0 }); */
export async function lspo_monster(L) {
    let argc = lua_gettop(L);
    let tmpmons = { name: { str: null, len: 0 }, appear_as: { str: null, len: 0 }, id: 0, sp_amask: 0, coord: 0, x: 0, y: 0, class: 0, appear: 0, peaceful: 0, asleep: 0, female: 0, invis: 0, cancelled: 0, revived: 0, avenge: 0, fleeing: 0, blinded: 0, paralyzed: 0, stunned: 0, confused: 0, waiting: 0, m_lev_adj: 0, seentraps: 0, has_invent: 0, mm_flags: 0 };
    let mx = -1;
    let my = -1;
    let mgend = NEUTRAL;
    let mappear = null;
    create_des_coder();
    tmpmons.peaceful = -1;
    tmpmons.asleep = -1;
    tmpmons.name.str = null;
    tmpmons.appear = 0;
    tmpmons.appear_as.str = null;
    tmpmons.sp_amask = 128;
    tmpmons.female = 0;
    tmpmons.invis = 0;
    tmpmons.cancelled = 0;
    tmpmons.revived = 0;
    tmpmons.avenge = 0;
    tmpmons.fleeing = 0;
    tmpmons.blinded = 0;
    tmpmons.paralyzed = 0;
    tmpmons.stunned = 0;
    tmpmons.confused = 0;
    tmpmons.seentraps = 0;
    tmpmons.has_invent = 2;
    tmpmons.waiting = 0;
    tmpmons.mm_flags = 0;
    tmpmons.m_lev_adj = 0;
    if (argc == 1 && lua_type(L, 1) == 4) {
        let paramstr = luaL_checkstring(L, 1);
        if (strlen(paramstr) == 1) {
            tmpmons.class = __nh_char_at0(paramstr);
            tmpmons.id = NON_PM;
        } else {
            tmpmons.class = -1;
            tmpmons.id = await find_montype(L, paramstr, { get value() { return mgend; }, set value(_v) { mgend = _v; } });
            tmpmons.female = (mgend == FEMALE) ? FEMALE : (mgend == MALE) ? MALE : rn2(2);
        }
    } else if (argc == 2 && lua_type(L, 1) == 4 && lua_type(L, 2) == 5) {
        let paramstr = luaL_checkstring(L, 1);
        get_coord(L, 2, { get value() { return mx; }, set value(_v) { mx = _v; } }, { get value() { return my; }, set value(_v) { my = _v; } });
        if (strlen(paramstr) == 1) {
            tmpmons.class = __nh_char_at0(paramstr);
            tmpmons.id = NON_PM;
        } else {
            tmpmons.class = -1;
            tmpmons.id = await find_montype(L, paramstr, { get value() { return mgend; }, set value(_v) { mgend = _v; } });
            tmpmons.female = (mgend == FEMALE) ? FEMALE : (mgend == MALE) ? MALE : rn2(2);
        }
    } else if (argc == 3) {
        let paramstr = luaL_checkstring(L, 1);
        mx = luaL_checkinteger(L, 2);
        my = luaL_checkinteger(L, 3);
        if (strlen(paramstr) == 1) {
            tmpmons.class = __nh_char_at0(paramstr);
            tmpmons.id = NON_PM;
        } else {
            tmpmons.class = -1;
            tmpmons.id = await find_montype(L, paramstr, { get value() { return mgend; }, set value(_v) { mgend = _v; } });
            tmpmons.female = (mgend == FEMALE) ? FEMALE : (mgend == MALE) ? MALE : rn2(2);
        }
    } else {
        let keep_default_invent = -1;
        lcheck_param_table(L);
        tmpmons.peaceful = get_table_boolean_opt(L, "peaceful", (-1));
        tmpmons.asleep = get_table_boolean_opt(L, "asleep", (-1));
        tmpmons.name.str = get_table_str_opt(L, "name", null);
        tmpmons.appear = 0;
        tmpmons.appear_as.str = null;
        tmpmons.sp_amask = get_table_align(L);
        tmpmons.female = get_table_boolean_opt(L, "female", (-1));
        tmpmons.invis = get_table_boolean_opt(L, "invisible", (0));
        tmpmons.cancelled = get_table_boolean_opt(L, "cancelled", (0));
        tmpmons.revived = get_table_boolean_opt(L, "revived", (0));
        tmpmons.avenge = get_table_boolean_opt(L, "avenge", (0));
        tmpmons.fleeing = get_table_int_opt(L, "fleeing", 0);
        tmpmons.blinded = get_table_int_opt(L, "blinded", 0);
        tmpmons.paralyzed = get_table_int_opt(L, "paralyzed", 0);
        tmpmons.stunned = get_table_boolean_opt(L, "stunned", (0));
        tmpmons.confused = get_table_boolean_opt(L, "confused", (0));
        tmpmons.waiting = get_table_boolean_opt(L, "waiting", (0));
        tmpmons.m_lev_adj = get_table_int_opt(L, "m_lev_adj", 0);
        /* TODO: list of trap names to bitfield */
        tmpmons.seentraps = 0;
        keep_default_invent = get_table_boolean_opt(L, "keep_default_invent", -1);
        if (!get_table_boolean_opt(L, "tail", (1))) {
            tmpmons.mm_flags |= 16384;
        }
        if (!get_table_boolean_opt(L, "group", (1))) {
            tmpmons.mm_flags |= 8192;
        }
        if (get_table_boolean_opt(L, "adjacentok", (0))) {
            tmpmons.mm_flags |= 16;
        }
        if (get_table_boolean_opt(L, "ignorewater", (0))) {
            tmpmons.mm_flags |= 8;
        }
        if (!get_table_boolean_opt(L, "countbirth", (1))) {
            tmpmons.mm_flags |= 4;
        }
        mappear = get_table_str_opt(L, "appear_as", null);
        if (mappear) {
            if (!strncmp("obj:", mappear, 4)) {
                tmpmons.appear = M_AP_OBJECT;
            } else if (!strncmp("mon:", mappear, 4)) {
                tmpmons.appear = M_AP_MONSTER;
            } else if (!strncmp("ter:", mappear, 4)) {
                tmpmons.appear = M_AP_FURNITURE;
            } else {
                nhl_error(L, "Unknown appear_as type");
            }
            tmpmons.appear_as.str = dupstr(__nh_advance_str(mappear, 4));
            do {
                if (mappear) {
                    free((mappear));
                }
            } while (0);
        }
        get_table_xy_or_coord(L, { get value() { return mx; }, set value(_v) { mx = _v; } }, { get value() { return my; }, set value(_v) { my = _v; } });
        tmpmons.id = await get_table_montype(L, { get value() { return mgend; }, set value(_v) { mgend = _v; } });
        /* get_table_montype will return a random gender if the species isn't
         * all-male or all-female; if the level designer specified a certain
         * gender, override that random one now, unless it *is* a one-gender
         * species, in which case don't override (don't permit creation of a
         * male nymph or female Nazgul, etc.) */
        if (mgend != NEUTRAL && (tmpmons.female == (-1) || (((game.mons[tmpmons.id]).mflags2 & 131072) != 0) || (((game.mons[tmpmons.id]).mflags2 & 65536) != 0))) {
            tmpmons.female = mgend;
        }
        /* safety net - if find_montype did not find a gender for this species
         * (should cause a lua error anyway) */
        if (tmpmons.female == (-1)) {
            tmpmons.female = 0;
        }
        tmpmons.class = get_table_monclass(L);
        lua_getfield(L, 1, "inventory");
        if (!lua_isnil(L, -1)) {
            /* overwrite DEFAULT_INVENT - most times inventory is specified,
             * the monster should not get its species' default inventory. Only
             * provide it if explicitly requested. */
            tmpmons.has_invent = 1;
            if (keep_default_invent == (1)) {
                tmpmons.has_invent |= 2;
            }
        } else {
            /* if keep_default_invent was not specified (-1), keep has_invent as
             * DEFAULT_INVENT and provide the species' default inventory.
             * But if it was explicitly set to false, provide *no* inventory. */
            if (keep_default_invent == (0)) {
                tmpmons.has_invent = 0;
            }
        }
    }
    if (mx == -1 && my == -1) {
        tmpmons.coord = (16777216 | (0));
    } else {
        tmpmons.coord = (((mx) & 255) + (((my) & 255) << 16));
    }
    if (tmpmons.id != NON_PM && tmpmons.class == -1) {
        tmpmons.class = (def_monsyms[(game.mons[tmpmons.id]).mlet].sym);
    }
    await create_monster(tmpmons, game.coder.croom);
    if ((tmpmons.has_invent & 1) && lua_type(L, -1) == 6) {
        lua_remove(L, -2);
        await nhl_pcall_handle(L, 0, 0, "lspo_monster", NHLpa_panic);
        await spo_end_moninvent();
    } else {
        lua_pop(L, 1);
    }
    do {
        if (tmpmons.name.str) {
            free((tmpmons.name.str));
        }
    } while (0);
    do {
        if (tmpmons.appear_as.str) {
            free((tmpmons.appear_as.str));
        }
    } while (0);
    return 0;
}
/* the hash key 'name' is an integer or "random",
   or if not existent, also return rndval */
export function get_table_int_or_random(L, name, rndval) {
    let ret = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    lua_getfield(L, 1, name);
    if (lua_type(L, -1) == 0) {
        lua_pop(L, 1);
        return rndval;
    }
    if (!lua_isnumber(L, -1)) {
        let tmp = lua_tostring(L, -1);
        if (tmp && !strncmpi(("random"), (tmp), -1)) {
            lua_pop(L, 1);
            return rndval;
        }
        buf = sprintf(buf, "Expected integer or \"random\" for \"%s\", got ", name);
        if (tmp) {
            buf = __nh_buf_append(buf, sprintf('', "\"%s\"", tmp));
        } else {
            buf = strcat(buf, "<Null>");
        }
        nhl_error(L, buf);
        lua_pop(L, 1);
        return 0;
    }
    ret = luaL_optinteger(L, -1, rndval);
    lua_pop(L, 1);
    return ret;
}
const __get_table_buc_bucs = ["random", "blessed", "uncursed", "cursed", "not-cursed", "not-uncursed", "not-blessed", null];
const __get_table_buc_bucs2i = [0, 1, 2, 3, 4, 5, 6, 0];
export function get_table_buc(L) {
    let curse_state = __get_table_buc_bucs2i[get_table_option(L, "buc", "random", __get_table_buc_bucs)];
    return curse_state;
}
export function get_table_objclass(L) {
    let s = get_table_str_opt(L, "class", null);
    let ret = -1;
    if (s && strlen(s) == 1) {
        ret = __nh_char_at0(s);
    }
    do {
        if (s) {
            free((s));
        }
    } while (0);
    return ret;
}
/* find object otyp by text s (optionally considering oclass) */
let __find_objtype_class_prefixes = [{ prefix: "ring of ", class: RING_CLASS }, { prefix: "potion of ", class: POTION_CLASS }, { prefix: "scroll of ", class: SCROLL_CLASS }, { prefix: "spellbook of ", class: SPBOOK_CLASS }, { prefix: "wand of ", class: WAND_CLASS }, { prefix: null, class: 0 }];
__nh_register_static(() => { __find_objtype_class_prefixes = [{ prefix: "ring of ", class: RING_CLASS }, { prefix: "potion of ", class: POTION_CLASS }, { prefix: "scroll of ", class: SCROLL_CLASS }, { prefix: "spellbook of ", class: SPBOOK_CLASS }, { prefix: "wand of ", class: WAND_CLASS }, { prefix: null, class: 0 }]; });
export function find_objtype(L, s, oclass) {
    if (s && __nh_char_at0(s)) {
        let i = 0;
        let objname = null;
        let class_ = def_char_to_objclass(oclass);
        /* In objects.h, some item classes are defined without prefixes
           (such as "scroll of ") in their names, making some names (such
           as "teleportation") ambiguous.  Get the object class if it is
           specified, and only return an object of the matching class. */
        if (class_ == MAXOCLASSES) {
            class_ = 0;
        }
        if (strstri(s, " of ")) {
            for (i = 0; __find_objtype_class_prefixes[i].prefix; i++) {
                let p = __find_objtype_class_prefixes[i].prefix;
                if (!strncmpi(s, p, strlen(p))) {
                    class_ = __find_objtype_class_prefixes[i].class;
                    s = __nh_advance_str(s, strlen(p));
                    break;
                }
            }
        }
        for (i = 0; i < NUM_OBJECTS; i++) {
            objname = (game.obj_descr[(game.objects[i]).oc_name_idx].oc_name);
            if ((!class_ || class_ == game.objects[i].oc_class) && objname && !strncmpi((s), (objname), -1)) {
                return i;
            }
        }
        for (i = 0; i < NUM_OBJECTS; i++) {
            /*
         * FIXME:
         *  If the file specifies "orange potion", the actual object
         *  description is just "orange" and won't match.  [There's a
         *  reason that wish handling is insanely complicated.]  And
         *  even if that gets fixed, if the file specifies "gray stone"
         *  it will start matching but would always pick the first one.
         *
         *  "orange potion" is an unlikely thing to have in a special
         *  level description but "gray stone" is not....
         */
            /* find by object description */
            objname = (game.obj_descr[(game.objects[i]).oc_descr_idx].oc_descr);
            if (objname && !strncmpi((s), (objname), -1)) {
                return i;
            }
        }
        nhl_error(L, "Unknown object id");
    }
    return STRANGE_OBJECT;
}
export function get_table_objtype(L) {
    let s = get_table_str_opt(L, "id", null);
    let oclass = get_table_objclass(L);
    let ret = find_objtype(L, s, oclass);
    do {
        if (s) {
            free((s));
        }
    } while (0);
    return ret;
}
/* object(); */
/* object("sack"); */
/* object("scimitar", 6,7); */
/* object("scimitar", {6,7}); */
/* object({ class = "%" }); */
/* object({ id = "boulder", x = 03, y = 12}); */
/* object({ id = "boulder", coord = {03,12} }); */
/* eroded, locked, trapped, tknown, recharged */
/* invis, greased, broken, achievement */
let __lspo_object_zeroobject = { name: { str: null, len: 0 }, corpsenm: 0, id: 0, spe: 0, coord: 0, x: 0, y: 0, class: 0, containment: 0, curse_state: 0, quan: 0, buried: 0, lit: 0, eroded: 0, locked: 0, trapped: 0, tknown: 0, recharged: 0, invis: 0, greased: 0, broken: 0, achievement: 0 };
__nh_register_static(() => { __lspo_object_zeroobject = { name: { str: null, len: 0 }, corpsenm: 0, id: 0, spe: 0, coord: 0, x: 0, y: 0, class: 0, containment: 0, curse_state: 0, quan: 0, buried: 0, lit: 0, eroded: 0, locked: 0, trapped: 0, tknown: 0, recharged: 0, invis: 0, greased: 0, broken: 0, achievement: 0 }; });
export async function lspo_object(L) {
    let quancnt = 0;
    let tmpobj = { name: { str: null, len: 0 }, corpsenm: 0, id: 0, spe: 0, coord: 0, x: 0, y: 0, class: 0, containment: 0, curse_state: 0, quan: 0, buried: 0, lit: 0, eroded: 0, locked: 0, trapped: 0, tknown: 0, recharged: 0, invis: 0, greased: 0, broken: 0, achievement: 0 };
    let ox = -1;
    let oy = -1;
    let argc = lua_gettop(L);
    let maybe_contents = 0;
    let otmp = null;
    create_des_coder();
    Object.assign(tmpobj, __lspo_object_zeroobject);
    tmpobj.name.str = null;
    tmpobj.spe = -127;
    tmpobj.quan = -1;
    tmpobj.trapped = -1;
    tmpobj.tknown = -1;
    tmpobj.locked = -1;
    tmpobj.corpsenm = NON_PM;
    if (argc == 1 && lua_type(L, 1) == 4) {
        let paramstr = luaL_checkstring(L, 1);
        if (strlen(paramstr) == 1) {
            tmpobj.class = __nh_char_at0(paramstr);
            tmpobj.id = STRANGE_OBJECT;
        } else {
            tmpobj.class = -1;
            tmpobj.id = find_objtype(L, paramstr, -1);
        }
    } else if (argc == 2 && lua_type(L, 1) == 4 && lua_type(L, 2) == 5) {
        let paramstr = luaL_checkstring(L, 1);
        get_coord(L, 2, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } });
        if (strlen(paramstr) == 1) {
            tmpobj.class = __nh_char_at0(paramstr);
            tmpobj.id = STRANGE_OBJECT;
        } else {
            tmpobj.class = -1;
            tmpobj.id = find_objtype(L, paramstr, -1);
        }
    } else if (argc == 3 && lua_type(L, 2) == 3 && lua_type(L, 3) == 3) {
        let paramstr = luaL_checkstring(L, 1);
        ox = luaL_checkinteger(L, 2);
        oy = luaL_checkinteger(L, 3);
        if (strlen(paramstr) == 1) {
            tmpobj.class = __nh_char_at0(paramstr);
            tmpobj.id = STRANGE_OBJECT;
        } else {
            tmpobj.class = -1;
            tmpobj.id = find_objtype(L, paramstr, -1);
        }
    } else {
        lcheck_param_table(L);
        tmpobj.spe = get_table_int_or_random(L, "spe", -127);
        tmpobj.curse_state = get_table_buc(L);
        tmpobj.corpsenm = NON_PM;
        tmpobj.name.str = get_table_str_opt(L, "name", null);
        tmpobj.quan = get_table_int_or_random(L, "quantity", -1);
        tmpobj.buried = get_table_boolean_opt(L, "buried", 0);
        tmpobj.lit = get_table_boolean_opt(L, "lit", 0);
        tmpobj.eroded = get_table_int_opt(L, "eroded", 0);
        tmpobj.locked = get_table_boolean_opt(L, "locked", -1);
        tmpobj.trapped = get_table_boolean_opt(L, "trapped", -1);
        tmpobj.tknown = get_table_boolean_opt(L, "trap_known", -1);
        tmpobj.recharged = get_table_int_opt(L, "recharged", 0);
        tmpobj.greased = get_table_boolean_opt(L, "greased", 0);
        tmpobj.broken = get_table_boolean_opt(L, "broken", 0);
        tmpobj.achievement = get_table_boolean_opt(L, "achievement", 0);
        get_table_xy_or_coord(L, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } });
        tmpobj.id = get_table_objtype(L);
        tmpobj.class = get_table_objclass(L);
        maybe_contents = 1;
    }
    if (ox == -1 && oy == -1) {
        tmpobj.coord = (16777216 | (0));
    } else {
        tmpobj.coord = (((ox) & 255) + (((oy) & 255) << 16));
    }
    if (tmpobj.class == -1 && tmpobj.id > STRANGE_OBJECT) {
        tmpobj.class = game.objects[tmpobj.id].oc_class;
    } else if (tmpobj.class > -1 && tmpobj.id == STRANGE_OBJECT) {
        tmpobj.id = -1;
    }
    if (tmpobj.id == STATUE || tmpobj.id == EGG || tmpobj.id == CORPSE || tmpobj.id == TIN || tmpobj.id == FIGURINE) {
        let pm = null;
        let nonpmobj = (0);
        let i = 0;
        let montype = get_table_str_opt(L, "montype", null);
        if (montype) {
            if ((tmpobj.id == TIN && (!strncmpi((montype), ("spinach"), -1) || !strncmpi((montype), ("empty"), -1))) || (tmpobj.id == EGG && !strncmpi((montype), ("empty"), -1))) {
                /* id="tin",montype="empty" produces an empty tin */
                /* id="egg",montype="empty" produces a generic, unhatchable
                   egg rather than an "empty egg" */
                tmpobj.corpsenm = NON_PM;
                tmpobj.spe = !strncmpi((montype), ("spinach"), -1) ? 1 : 0;
                nonpmobj = (1);
            } else if (strlen(montype) == 1 && def_char_to_monclass(__nh_char_at0(montype)) != MAXMCLASSES) {
                pm = await mkclass(def_char_to_monclass(__nh_char_at0(montype)), 512 | 32768);
            } else {
                for (i = LOW_PM; i < NUMMONS; i++) {
                    if (!strncmpi((game.mons[i].pmnames[NEUTRAL]), (montype), -1) || (game.mons[i].pmnames[MALE] != null && !strncmpi((game.mons[i].pmnames[MALE]), (montype), -1)) || (game.mons[i].pmnames[FEMALE] != null && !strncmpi((game.mons[i].pmnames[FEMALE]), (montype), -1))) {
                        pm = game.mons[i];
                        break;
                    }
                }
            }
            free(montype);
            if (pm) {
                tmpobj.corpsenm = ((pm).pmidx);
            } else if (!nonpmobj) {
                nhl_error(L, "Unknown montype");
            }
        }
        if (tmpobj.id == STATUE || tmpobj.id == CORPSE) {
            let lflags = 0;
            if (get_table_boolean_opt(L, "historic", 0)) {
                lflags |= 4;
            }
            if (get_table_boolean_opt(L, "male", 0)) {
                lflags |= 2;
            }
            if (get_table_boolean_opt(L, "female", 0)) {
                lflags |= 1;
            }
            tmpobj.spe = lflags;
        } else if (tmpobj.id == EGG) {
            tmpobj.spe = get_table_boolean_opt(L, "laid_by_you", 0) ? 1 : 0;
        } else if (!nonpmobj) {
            /* tmpobj.spe is already set for nonpmobj */
            tmpobj.spe = 0;
        }
    }
    quancnt = (tmpobj.id > STRANGE_OBJECT) ? tmpobj.quan : 0;
    if (game.container_idx) {
        tmpobj.containment |= 1;
    }
    if (maybe_contents) {
        lua_getfield(L, 1, "contents");
        if (!lua_isnil(L, -1)) {
            tmpobj.containment |= 2;
        }
    }
    do {
        otmp = await create_object(tmpobj, game.coder.croom);
        quancnt--;
    } while ((quancnt > 0) && ((tmpobj.id > STRANGE_OBJECT) && !game.objects[tmpobj.id].oc_merge));
    if (lua_type(L, -1) == 6) {
        lua_remove(L, -2);
        nhl_push_obj(L, otmp);
        await nhl_pcall_handle(L, 1, 0, "lspo_object", NHLpa_panic);
    } else {
        lua_pop(L, 1);
    }
    if ((tmpobj.containment & 2) != 0) {
        spo_pop_container();
    }
    do {
        if (tmpobj.name.str) {
            free((tmpobj.name.str));
        }
    } while (0);
    nhl_push_obj(L, otmp);
    return 1;
}
/* level_flags("noteleport", "mazelevel", ... ); */
export function lspo_level_flags(L) {
    let argc = lua_gettop(L);
    let i = 0;
    create_des_coder();
    if (argc < 1) {
        nhl_error(L, "expected string params");
    }
    for (i = 1; i <= argc; i++) {
        let s = luaL_checkstring(L, i);
        if (!strncmpi((s), ("noteleport"), -1)) {
            game.level.flags.noteleport = 1;
        } else if (!strncmpi((s), ("hardfloor"), -1)) {
            game.level.flags.hardfloor = 1;
        } else if (!strncmpi((s), ("nommap"), -1)) {
            game.level.flags.nommap = 1;
        } else if (!strncmpi((s), ("shortsighted"), -1)) {
            game.level.flags.shortsighted = 1;
        } else if (!strncmpi((s), ("arboreal"), -1)) {
            game.level.flags.arboreal = 1;
        } else if (!strncmpi((s), ("mazelevel"), -1)) {
            game.level.flags.is_maze_lev = 1;
        } else if (!strncmpi((s), ("shroud"), -1)) {
            game.level.flags.hero_memory = 1;
        } else if (!strncmpi((s), ("graveyard"), -1)) {
            game.level.flags.graveyard = 1;
        } else if (!strncmpi((s), ("icedpools"), -1)) {
            game.icedpools = 1;
        } else if (!strncmpi((s), ("corrmaze"), -1)) {
            game.level.flags.corrmaze = 1;
        } else if (!strncmpi((s), ("premapped"), -1)) {
            game.coder.premapped = 1;
        } else if (!strncmpi((s), ("solidify"), -1)) {
            game.coder.solidify = 1;
        } else if (!strncmpi((s), ("sokoban"), -1)) {
            game.level.flags.sokoban_rules = 1;
        } else if (!strncmpi((s), ("inaccessibles"), -1)) {
            game.coder.check_inaccessibles = 1;
        } else if (!strncmpi((s), ("noflipx"), -1)) {
            game.coder.allow_flips &= ~2;
        } else if (!strncmpi((s), ("noflipy"), -1)) {
            game.coder.allow_flips &= ~1;
        } else if (!strncmpi((s), ("noflip"), -1)) {
            game.coder.allow_flips = 0;
        } else if (!strncmpi((s), ("temperate"), -1)) {
            game.level.flags.temperature = 0;
        } else if (!strncmpi((s), ("hot"), -1)) {
            game.level.flags.temperature = 1;
        } else if (!strncmpi((s), ("cold"), -1)) {
            game.level.flags.temperature = -1;
        } else if (!strncmpi((s), ("nomongen"), -1)) {
            game.level.flags.rndmongen = 0;
        } else if (!strncmpi((s), ("nodeathdrops"), -1)) {
            game.level.flags.deathdrops = 0;
        } else if (!strncmpi((s), ("noautosearch"), -1)) {
            game.level.flags.noautosearch = 1;
        } else if (!strncmpi((s), ("fumaroles"), -1)) {
            game.level.flags.fumaroles = 1;
        } else if (!strncmpi((s), ("stormy"), -1)) {
            game.level.flags.stormy = 1;
        /* svl.level.flags.sokoban_rules */
        } else {
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            buf = sprintf(buf, "Unknown level flag %s", s);
            nhl_error(L, buf);
        }
    }
    return 0;
}
/* level_init({ style = "solidfill", fg = " " }); */
/* level_init({ style = "mines", fg = ".", bg = "}",
                smoothed=true, joined=true, lit=0 }) */
const __lspo_level_init_initstyles = ["solidfill", "mazegrid", "maze", "rogue", "mines", "swamp", null];
const __lspo_level_init_initstyles2i = [LVLINIT_SOLIDFILL, LVLINIT_MAZEGRID, LVLINIT_MAZE, LVLINIT_ROGUE, LVLINIT_MINES, LVLINIT_SWAMP, 0];
export async function lspo_level_init(L) {
    let init_lev = { init_style: 0, flags: 0, filling: 0, init_present: 0, padding: 0, fg: 0, bg: 0, smoothed: 0, joined: 0, lit: 0, walled: 0, icedpools: 0, corrwid: 0, wallthick: 0, rm_deadends: 0 };
    create_des_coder();
    lcheck_param_table(L);
    game.splev_init_present = (1);
    init_lev.init_style = __lspo_level_init_initstyles2i[get_table_option(L, "style", "solidfill", __lspo_level_init_initstyles)];
    init_lev.fg = get_table_mapchr_opt(L, "fg", ROOM);
    init_lev.bg = get_table_mapchr_opt(L, "bg", INVALID_TYPE);
    init_lev.smoothed = get_table_boolean_opt(L, "smoothed", (0));
    init_lev.joined = get_table_boolean_opt(L, "joined", (0));
    init_lev.lit = get_table_boolean_opt(L, "lit", (-1));
    init_lev.walled = get_table_boolean_opt(L, "walled", (0));
    init_lev.filling = get_table_mapchr_opt(L, "filling", init_lev.fg);
    init_lev.corrwid = get_table_int_opt(L, "corrwid", -1);
    init_lev.wallthick = get_table_int_opt(L, "wallthick", -1);
    init_lev.rm_deadends = !get_table_boolean_opt(L, "deadends", (1));
    game.coder.lvl_is_joined = init_lev.joined;
    if (init_lev.bg == INVALID_TYPE) {
        init_lev.bg = (init_lev.init_style == LVLINIT_SWAMP) ? MOAT : STONE;
    }
    await splev_initlev(init_lev);
    return 0;
}
/* engraving({ x = 1, y = 1, type="burn", text="Foo" }); */
/* engraving({ coord={1, 1}, type="burn", text="Foo" }); */
/* engraving({x,y}, "engrave", "Foo"); */
const __lspo_engraving_engrtypes = ["dust", "engrave", "burn", "mark", "blood", null];
const __lspo_engraving_engrtypes2i = [1, 2, 3, 4, 5, 0];
export async function lspo_engraving(L) {
    let etyp = 1;
    let txt = null;
    let ecoord = 0;
    let x = -1;
    let y = -1;
    let argc = lua_gettop(L);
    let guardobjs = (0);
    let wipeout = (1);
    let ep = null;
    create_des_coder();
    if (argc == 1) {
        let ex = 0;
        let ey = 0;
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return ex; }, set value(_v) { ex = _v; } }, { get value() { return ey; }, set value(_v) { ey = _v; } });
        x = ex;
        y = ey;
        etyp = __lspo_engraving_engrtypes2i[get_table_option(L, "type", "engrave", __lspo_engraving_engrtypes)];
        txt = get_table_str(L, "text");
        wipeout = get_table_boolean_opt(L, "degrade", (1));
        guardobjs = get_table_boolean_opt(L, "guardobjects", (0));
    } else if (argc == 3) {
        let ex = 0;
        let ey = 0;
        get_coord(L, 1, { get value() { return ex; }, set value(_v) { ex = _v; } }, { get value() { return ey; }, set value(_v) { ey = _v; } });
        x = ex;
        y = ey;
        etyp = __lspo_engraving_engrtypes2i[luaL_checkoption(L, 2, "engrave", __lspo_engraving_engrtypes)];
        txt = dupstr(luaL_checkstring(L, 3));
    } else {
        nhl_error(L, "Wrong parameters");
    }
    if (x == -1 && y == -1) {
        ecoord = (16777216 | (0));
    } else {
        ecoord = (((x) & 255) + (((y) & 255) << 16));
    }
    await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, game.coder.croom, ecoord);
    await make_engr_at(x, y, txt, null, 0, etyp);
    do {
        if (txt) {
            free((txt));
        }
    } while (0);
    ep = engr_at(x, y);
    if (ep) {
        ep.guardobjects = guardobjs;
        ep.nowipeout = !wipeout;
    }
    return 0;
}
export async function lspo_mineralize(L) {
    let gem_prob = 0;
    let gold_prob = 0;
    let kelp_moat = 0;
    let kelp_pool = 0;
    create_des_coder();
    lcheck_param_table(L);
    /* -1 produces default mineralize behavior */
    gem_prob = get_table_int_opt(L, "gem_prob", -1);
    gold_prob = get_table_int_opt(L, "gold_prob", -1);
    kelp_moat = get_table_int_opt(L, "kelp_moat", -1);
    kelp_pool = get_table_int_opt(L, "kelp_pool", -1);
    await mineralize(kelp_pool, kelp_moat, gold_prob, gem_prob, (1));
    return 0;
}
const room_types = [{ name: "ordinary", type: OROOM }, { name: "themed", type: THEMEROOM }, { name: "throne", type: COURT }, { name: "swamp", type: SWAMP }, { name: "vault", type: VAULT }, { name: "beehive", type: BEEHIVE }, { name: "morgue", type: MORGUE }, { name: "barracks", type: BARRACKS }, { name: "zoo", type: ZOO }, { name: "delphi", type: DELPHI }, { name: "temple", type: TEMPLE }, { name: "anthole", type: ANTHOLE }, { name: "cocknest", type: COCKNEST }, { name: "leprehall", type: LEPREHALL }, { name: "shop", type: SHOPBASE }, { name: "armor shop", type: ARMORSHOP }, { name: "scroll shop", type: SCROLLSHOP }, { name: "potion shop", type: POTIONSHOP }, { name: "weapon shop", type: WEAPONSHOP }, { name: "food shop", type: FOODSHOP }, { name: "ring shop", type: RINGSHOP }, { name: "wand shop", type: WANDSHOP }, { name: "tool shop", type: TOOLSHOP }, { name: "book shop", type: BOOKSHOP }, { name: "health food shop", type: FODDERSHOP }, { name: "candle shop", type: CANDLESHOP }, { name: null, type: 0 }];
export async function get_mkroom_name(rtype) {
    let i = 0;
    for (i = 0; room_types[i].name; i++) {
        if (room_types[i].type == rtype) {
            return room_types[i].name;
        }
    }
    await impossible("get_mkroom_name unknown rtype %d", rtype);
    return "unknown";
}
export async function get_table_roomtype_opt(L, name, defval) {
    let roomstr = get_table_str_opt(L, name, game.emptystr);
    let i = 0;
    let res = defval;
    if (roomstr && __nh_char_at0(roomstr)) {
        for (i = 0; room_types[i].name; i++) {
            if (!strncmpi((roomstr), (room_types[i].name), -1)) {
                res = room_types[i].type;
                break;
            }
        }
        if (!room_types[i].name) {
            await impossible("Unknown room type '%s'", roomstr);
        }
    }
    do {
        if (roomstr) {
            free((roomstr));
        }
    } while (0);
    return res;
}
/* room({ type="ordinary", lit=1, x=3,y=3, xalign="center",yalign="center",
 *        w=11,h=9 }); */
/* room({ lit=1, coord={3,3}, xalign="center",yalign="center", w=11,h=9 }); */
/* room({ coord={3,3}, xalign="center",yalign="center", w=11,h=9,
 *        contents=function(room) ... end }); */
const __lspo_room_left_or_right = ["left", "half-left", "center", "half-right", "right", "none", "random", null];
const __lspo_room_l_or_r2i = [1, 2, 3, 4, 5, -1, -1, -1];
const __lspo_room_top_or_bot = ["top", "center", "bottom", "none", "random", null];
const __lspo_room_t_or_b2i = [1, 3, 5, -1, -1, -1];
export async function lspo_room(L) {
    create_des_coder();
    if (game.in_mk_themerooms && game.themeroom_failed) {
        return 0;
    }
    lcheck_param_table(L);
    if (game.coder.n_subroom > 5) {
        await panic("Too deeply nested rooms?!");
    } else {
        let tmproom = { name: { str: null, len: 0 }, parent: { str: null, len: 0 }, x: 0, y: 0, w: 0, h: 0, xalign: 0, yalign: 0, rtype: 0, chance: 0, rlit: 0, needfill: 0, joined: 0 };
        let tmpcr = null;
        let rx = 0;
        let ry = 0;
        get_table_xy_or_coord(L, { get value() { return rx; }, set value(_v) { rx = _v; } }, { get value() { return ry; }, set value(_v) { ry = _v; } });
        tmproom.x = rx , tmproom.y = ry;
        if ((tmproom.x == -1 || tmproom.y == -1) && tmproom.x != tmproom.y) {
            nhl_error(L, "Room must have both x and y");
        }
        tmproom.w = get_table_int_opt(L, "w", -1);
        tmproom.h = get_table_int_opt(L, "h", -1);
        if ((tmproom.w == -1 || tmproom.h == -1) && tmproom.w != tmproom.h) {
            nhl_error(L, "Room must have both w and h");
        }
        tmproom.xalign = __lspo_room_l_or_r2i[get_table_option(L, "xalign", "random", __lspo_room_left_or_right)];
        tmproom.yalign = __lspo_room_t_or_b2i[get_table_option(L, "yalign", "random", __lspo_room_top_or_bot)];
        tmproom.rtype = await get_table_roomtype_opt(L, "type", OROOM);
        tmproom.chance = get_table_int_opt(L, "chance", 100);
        tmproom.rlit = get_table_int_opt(L, "lit", -1);
        /* theme rooms default to unfilled */
        tmproom.needfill = get_table_int_opt(L, "filled", game.in_mk_themerooms ? 0 : 1);
        tmproom.joined = get_table_boolean_opt(L, "joined", (1));
        if (!game.coder.failed_room[game.coder.n_subroom - 1]) {
            tmpcr = await build_room(tmproom, game.coder.croom);
            if (tmpcr) {
                let n = game.coder.n_subroom;
                game.coder.tmproomlist[n] = tmpcr;
                game.coder.failed_room[n] = (0);
                /* added a subroom, make parent room irregular */
                if (game.coder.tmproomlist[n - 1]) {
                    game.coder.tmproomlist[n - 1].irregular = (1);
                }
                game.coder.n_subroom++;
                update_croom();
                lua_getfield(L, 1, "contents");
                if (lua_type(L, -1) == 6) {
                    lua_remove(L, -2);
                    await l_push_mkroom_table(L, tmpcr);
                    await nhl_pcall_handle(L, 1, 0, "lspo_room", NHLpa_panic);
                } else {
                    lua_pop(L, 1);
                }
                spo_endroom(game.coder);
                add_doors_to_room(tmpcr);
                return 0;
            }
            if (game.in_mk_themerooms) {
                game.themeroom_failed = (1);
            }
        }
    }
    game.coder.tmproomlist[game.coder.n_subroom] = null;
    game.coder.failed_room[game.coder.n_subroom] = (1);
    game.coder.n_subroom++;
    update_croom();
    spo_endroom(game.coder);
    if (game.in_mk_themerooms) {
        game.themeroom_failed = (1);
    }
    return 0;
}
export function spo_endroom(coder) {
    if (game.coder.n_subroom > 1) {
        game.coder.n_subroom--;
        game.coder.tmproomlist[game.coder.n_subroom] = null;
        game.coder.failed_room[game.coder.n_subroom] = (1);
    } else {
        /* no subroom, get out of top-level room */
        /* Need to ensure xstart/ystart/xsize/ysize have something sensible,
           in case there's some stuff to be created outside the outermost
           room, and there's no MAP. */
        if (game.xsize <= 1 && game.ysize <= 1) {
            /* this mutated xstart and ystart in the process of trying to make a
         * themed room, so undo them */
            reset_xystart_size();
        }
    }
    update_croom();
}
/* callback for is_ok_location.
   stairs generated at random location shouldn't overwrite special terrain */
export function good_stair_loc(x, y) {
    let typ = game.level.locations[x][y].typ;
    return (typ == ROOM || typ == CORR || typ == ICE);
}
const __l_create_stairway_stairdirs = ["down", "up", null];
const __l_create_stairway_stairdirs2i = [0, 1];
export async function l_create_stairway(L, using_ladder) {
    let argc = lua_gettop(L);
    let x = -1;
    let y = -1;
    let badtrap = null;
    let scoord = 0;
    let up = 0;
    let ltype = lua_type(L, 1);
    create_des_coder();
    if (argc == 1 && ltype == 5) {
        let ax = -1;
        let ay = -1;
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return ax; }, set value(_v) { ax = _v; } }, { get value() { return ay; }, set value(_v) { ay = _v; } });
        up = __l_create_stairway_stairdirs2i[get_table_option(L, "dir", "down", __l_create_stairway_stairdirs)];
        x = ax;
        y = ay;
    } else {
        let ix = -1;
        let iy = -1;
        if (argc > 0 && ltype == 4) {
            up = __l_create_stairway_stairdirs2i[luaL_checkoption(L, 1, "down", __l_create_stairway_stairdirs)];
            lua_remove(L, 1);
        }
        nhl_get_xy_params(L, { get value() { return ix; }, set value(_v) { ix = _v; } }, { get value() { return iy; }, set value(_v) { iy = _v; } });
        x = ix;
        y = iy;
    }
    if (x == -1 && y == -1) {
        set_ok_location_func(good_stair_loc);
        scoord = (16777216 | (0));
    } else {
        scoord = (((x) & 255) + (((y) & 255) << 16));
    }
    await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, game.coder.croom, scoord);
    set_ok_location_func(null);
    if ((badtrap = t_at(x, y)) != null) {
        await deltrap(badtrap);
    }
    game.SpLev_Map[x][y] = 1;
    if (using_ladder) {
        game.level.locations[x][y].typ = LADDER;
        if (up) {
            let dest = { dnum: 0, dlevel: 0 };
            dest.dnum = game.u.uz.dnum;
            dest.dlevel = game.u.uz.dlevel - 1;
            stairway_add(x, y, (1), (1), dest);
            game.level.locations[x][y].flags = 1;
        } else {
            let dest = { dnum: 0, dlevel: 0 };
            dest.dnum = game.u.uz.dnum;
            dest.dlevel = game.u.uz.dlevel + 1;
            stairway_add(x, y, (0), (1), dest);
            game.level.locations[x][y].flags = 2;
        }
    } else {
        await mkstairs(x, y, up, game.coder.croom, !(scoord & 16777216));
    }
    return 0;
}
/* stair("up"); */
/* stair({ dir = "down" }); */
/* stair({ dir = "down", x = 4, y = 7 }); */
/* stair({ dir = "down", coord = {x,y} }); */
/* stair("down", 4, 7); */
/* TODO: stair(selection, "down"); */
/* TODO: stair("up", {x,y}); */
export async function lspo_stair(L) {
    return await l_create_stairway(L, (0));
}
/* ladder("down"); */
/* ladder("up", 6,10); */
/* ladder({ x=11, y=05, dir="down" }); */
export async function lspo_ladder(L) {
    return await l_create_stairway(L, (1));
}
/* grave(); */
/* grave(x,y, "text"); */
/* grave({ x = 1, y = 1 }); */
/* grave({ x = 1, y = 1, text = "Foo" }); */
/* grave({ coord = {1, 1}, text = "Foo" }); */
export async function lspo_grave(L) {
    let argc = lua_gettop(L);
    let x = 0;
    let y = 0;
    let scoord = 0;
    let ax = 0;
    let ay = 0;
    let txt = null;
    create_des_coder();
    if (argc == 3) {
        x = ax = luaL_checkinteger(L, 1);
        y = ay = luaL_checkinteger(L, 2);
        txt = dupstr(luaL_checkstring(L, 3));
    } else {
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return ax; }, set value(_v) { ax = _v; } }, { get value() { return ay; }, set value(_v) { ay = _v; } });
        x = ax , y = ay;
        txt = get_table_str_opt(L, "text", null);
    }
    if (x == -1 && y == -1) {
        scoord = (16777216 | (0));
    } else {
        scoord = (((ax) & 255) + (((ay) & 255) << 16));
    }
    await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, game.coder.croom, scoord);
    if (isok(x, y) && !t_at(x, y)) {
        game.level.locations[x][y].typ = GRAVE;
        await make_grave(x, y, txt);
    }
    do {
        if (txt) {
            free((txt));
        }
    } while (0);
    return 0;
}
/* altar({ x=NN, y=NN, align=ALIGNMENT, type=SHRINE }); */
/* des.altar({ coord = {5, 10}, align="noalign", type="altar" }); */
const __lspo_altar_shrines = ["altar", "shrine", "sanctum", null];
const __lspo_altar_shrines2i = [0, 1, 2, 0];
export async function lspo_altar(L) {
    let tmpaltar = { coord: 0, x: 0, y: 0, sp_amask: 0, shrine: 0 };
    let x = 0;
    let y = 0;
    let acoord = 0;
    let shrine = 0;
    let al = 0;
    create_des_coder();
    lcheck_param_table(L);
    get_table_xy_or_coord(L, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } });
    al = get_table_align(L);
    shrine = __lspo_altar_shrines2i[get_table_option(L, "type", "altar", __lspo_altar_shrines)];
    if (x == -1 && y == -1) {
        acoord = (16777216 | (0));
    } else {
        acoord = (((x) & 255) + (((y) & 255) << 16));
    }
    tmpaltar.coord = acoord;
    tmpaltar.sp_amask = al;
    tmpaltar.shrine = shrine;
    await create_altar(tmpaltar, game.coder.croom);
    return 0;
}
const trap_types = [{ name: "arrow", type: ARROW_TRAP }, { name: "dart", type: DART_TRAP }, { name: "falling rock", type: ROCKTRAP }, { name: "board", type: SQKY_BOARD }, { name: "bear", type: BEAR_TRAP }, { name: "land mine", type: LANDMINE }, { name: "rolling boulder", type: ROLLING_BOULDER_TRAP }, { name: "sleep gas", type: SLP_GAS_TRAP }, { name: "rust", type: RUST_TRAP }, { name: "fire", type: FIRE_TRAP }, { name: "pit", type: PIT }, { name: "spiked pit", type: SPIKED_PIT }, { name: "hole", type: HOLE }, { name: "trap door", type: TRAPDOOR }, { name: "teleport", type: TELEP_TRAP }, { name: "level teleport", type: LEVEL_TELEP }, { name: "magic portal", type: MAGIC_PORTAL }, { name: "web", type: WEB }, { name: "statue", type: STATUE_TRAP }, { name: "magic", type: MAGIC_TRAP }, { name: "anti magic", type: ANTI_MAGIC }, { name: "polymorph", type: POLY_TRAP }, { name: "vibrating square", type: VIBRATING_SQUARE }, { name: "random", type: -1 }, { name: null, type: NO_TRAP }];
export function get_table_traptype_opt(L, name, defval) {
    let trapstr = get_table_str_opt(L, name, game.emptystr);
    let i = 0;
    let res = defval;
    if (trapstr && __nh_char_at0(trapstr)) {
        for (i = 0; trap_types[i].name; i++) {
            if (!strncmpi((trapstr), (trap_types[i].name), -1)) {
                res = trap_types[i].type;
                break;
            }
        }
    }
    do {
        if (trapstr) {
            free((trapstr));
        }
    } while (0);
    return res;
}
export function get_trapname_bytype(ttyp) {
    let i = 0;
    for (i = 0; trap_types[i].name; i++) {
        if (ttyp == trap_types[i].type) {
            return trap_types[i].name;
        }
    }
    return null;
}
export function get_traptype_byname(trapname) {
    let i = 0;
    for (i = 0; trap_types[i].name; i++) {
        if (!strncmpi((trapname), (trap_types[i].name), -1)) {
            return trap_types[i].type;
        }
    }
    return NO_TRAP;
}
/* trap({ type = "hole", x = 1, y = 1 }); */
/* trap({ type = "web", spider_on_web = 0 }); */
/* trap("hole", 3, 4); */
/* trap("level teleport", {5, 8}); */
/* trap("rust") */
/* trap(); */
export async function lspo_trap(L) {
    let tmptrap = { coord: 0, x: 0, y: 0, type: 0, spider_on_web: 0, seen: 0, novictim: 0 };
    let x = 0;
    let y = 0;
    let argc = lua_gettop(L);
    create_des_coder();
    tmptrap.spider_on_web = (1);
    tmptrap.seen = (0);
    tmptrap.novictim = (0);
    if (argc == 1 && lua_type(L, 1) == 4) {
        let trapstr = luaL_checkstring(L, 1);
        tmptrap.type = get_traptype_byname(trapstr);
        x = y = -1;
    } else if (argc == 2 && lua_type(L, 1) == 4 && lua_type(L, 2) == 5) {
        let trapstr = luaL_checkstring(L, 1);
        tmptrap.type = get_traptype_byname(trapstr);
        get_coord(L, 2, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } });
    } else if (argc == 3) {
        let trapstr = luaL_checkstring(L, 1);
        tmptrap.type = get_traptype_byname(trapstr);
        x = luaL_checkinteger(L, 2);
        y = luaL_checkinteger(L, 3);
    } else {
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } });
        tmptrap.type = get_table_traptype_opt(L, "type", -1);
        tmptrap.spider_on_web = get_table_boolean_opt(L, "spider_on_web", 1);
        tmptrap.seen = get_table_boolean_opt(L, "seen", (0));
        tmptrap.novictim = !get_table_boolean_opt(L, "victim", (1));
        lua_getfield(L, -1, "launchfrom");
        if (lua_type(L, -1) == 5) {
            let lx = -1;
            let ly = -1;
            get_coord(L, -1, { get value() { return lx; }, set value(_v) { lx = _v; } }, { get value() { return ly; }, set value(_v) { ly = _v; } });
            lua_pop(L, 1);
            game.launchplace.x = lx;
            game.launchplace.y = ly;
        } else {
            lua_pop(L, 1);
        }
        lua_getfield(L, -1, "teledest");
        if (lua_type(L, -1) == 5) {
            let lx = -1;
            let ly = -1;
            get_coord(L, -1, { get value() { return lx; }, set value(_v) { lx = _v; } }, { get value() { return ly; }, set value(_v) { ly = _v; } });
            lua_pop(L, 1);
            game.launchplace.x = lx;
            game.launchplace.y = ly;
        } else {
            lua_pop(L, 1);
        }
    }
    if (tmptrap.type == NO_TRAP) {
        nhl_error(L, "Unknown trap type");
    }
    if (x == -1 && y == -1) {
        tmptrap.coord = (16777216 | (0));
    } else {
        tmptrap.coord = (((x) & 255) + (((y) & 255) << 16));
    }
    await create_trap(tmptrap, game.coder.croom);
    game.launchplace.x = game.launchplace.y = 0;
    return 0;
}
/* gold(500, 3,5); */
/* gold(500, {5, 6}); */
/* gold({ amount = 500, x = 2, y = 5 });*/
/* gold({ amount = 500, coord = {2, 5} });*/
/* gold(); */
export async function lspo_gold(L) {
    let argc = lua_gettop(L);
    let x = 0;
    let y = 0;
    let amount = 0;
    let gcoord = 0;
    let gldx = 0;
    let gldy = 0;
    create_des_coder();
    if (argc == 3) {
        amount = luaL_checkinteger(L, 1);
        x = gldx = luaL_checkinteger(L, 2);
        y = gldy = luaL_checkinteger(L, 3);
    } else if (argc == 2 && lua_type(L, 2) == 5) {
        amount = luaL_checkinteger(L, 1);
        get_coord(L, 2, { get value() { return gldx; }, set value(_v) { gldx = _v; } }, { get value() { return gldy; }, set value(_v) { gldy = _v; } });
        x = gldx;
        y = gldy;
    } else if (argc == 0 || (argc == 1 && lua_type(L, 1) == 5)) {
        lcheck_param_table(L);
        amount = get_table_int_opt(L, "amount", -1);
        get_table_xy_or_coord(L, { get value() { return gldx; }, set value(_v) { gldx = _v; } }, { get value() { return gldy; }, set value(_v) { gldy = _v; } });
        x = gldx , y = gldy;
    } else {
        nhl_error(L, "Wrong parameters");
        return 0;
    }
    if (x == -1 && y == -1) {
        gcoord = (16777216 | (0));
    } else {
        gcoord = (((gldx) & 255) + (((gldy) & 255) << 16));
    }
    await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1, game.coder.croom, gcoord);
    if (amount < 0) {
        amount = rnd(200);
    }
    await mkgold(amount, x, y);
    return 0;
}
/* corridor({ srcroom=1, srcdoor=2, srcwall="north",
 *            destroom=2, destdoor=1, destwall="west" }); */
const __lspo_corridor_walldirs = ["all", "random", "north", "west", "east", "south", null];
const __lspo_corridor_walldirs2i = [(1 | 2 | 4 | 8), -1, 1, 8, 4, 2, 0];
export async function lspo_corridor(L) {
    let tc = { src: { room: 0, wall: 0, door: 0 }, dest: { room: 0, wall: 0, door: 0 } };
    create_des_coder();
    lcheck_param_table(L);
    tc.src.room = get_table_int(L, "srcroom");
    tc.src.door = get_table_int(L, "srcdoor");
    tc.src.wall = __lspo_corridor_walldirs2i[get_table_option(L, "srcwall", "all", __lspo_corridor_walldirs)];
    tc.dest.room = get_table_int(L, "destroom");
    tc.dest.door = get_table_int(L, "destdoor");
    tc.dest.wall = __lspo_corridor_walldirs2i[get_table_option(L, "destwall", "all", __lspo_corridor_walldirs)];
    await create_corridor(tc);
    return 0;
}
/* random_corridors(); */
export async function lspo_random_corridors(L) {
    let tc = { src: { room: 0, wall: 0, door: 0 }, dest: { room: 0, wall: 0, door: 0 } };
    create_des_coder();
    tc.src.room = -1;
    tc.src.door = -1;
    tc.src.wall = -1;
    tc.dest.room = -1;
    tc.dest.door = -1;
    tc.dest.wall = -1;
    await create_corridor(tc);
    return 0;
}
/* Choose a single random W_* direction. */
const __random_wdir_wdirs = [1, 2, 4, 8];
export function random_wdir() {
    return __random_wdir_wdirs[rn2(4)];
}
game.floodfillchk_match_under_typ = 0;
export function floodfillchk_match_under(x, y) {
    return (game.floodfillchk_match_under_typ == game.level.locations[x][y].typ);
}
export function set_floodfillchk_match_under(typ) {
    game.floodfillchk_match_under_typ = typ;
    set_selection_floodfillchk(floodfillchk_match_under);
}
export function floodfillchk_match_accessible(x, y) {
    return (((game.level.locations[x][y].typ) >= DOOR) || game.level.locations[x][y].typ == SDOOR || game.level.locations[x][y].typ == SCORR);
}
/* change map location terrain type during level creation */
export async function sel_set_ter(x, y, arg) {
    let terr = { ter: 0, tlit: 0 };
    Object.assign(terr, arg);
    if (!await set_levltyp_lit(x, y, terr.ter, terr.tlit)) {
        return;
    }
    if (game.level.locations[x][y].typ == SDOOR || ((game.level.locations[x][y].typ) == DOOR)) {
        /* TODO: move this below into set_levltyp? */
        /* handle doors and secret doors */
        if (game.level.locations[x][y].typ == SDOOR) {
            game.level.locations[x][y].flags = 4;
        }
        if (x && (((game.level.locations[x - 1][y].typ) && (game.level.locations[x - 1][y].typ) <= DBWALL) || game.level.locations[x - 1][y].horizontal)) {
            game.level.locations[x][y].horizontal = 1;
        }
    } else if (game.level.locations[x][y].typ == HWALL || game.level.locations[x][y].typ == IRONBARS) {
        game.level.locations[x][y].horizontal = 1;
    } else if (game.splev_init_present && game.level.locations[x][y].typ == ICE) {
        game.level.locations[x][y].flags = game.icedpools ? 8 : 16;
    } else if (game.level.locations[x][y].typ == CLOUD) {
        await del_engr_at(x, y);
    }
}
export function sel_set_feature(x, y, arg) {
    if (!isok(x, y)) {
        return;
    }
    if (((game.level.locations[x][y].typ) >= STAIRS && (game.level.locations[x][y].typ) <= ALTAR)) {
        return;
    }
    game.level.locations[x][y].typ = (arg);
}
export function sel_set_door(dx, dy, arg) {
    let typ = arg;
    let x = dx;
    let y = dy;
    if (!((game.level.locations[x][y].typ) == DOOR) && game.level.locations[x][y].typ != SDOOR) {
        game.level.locations[x][y].typ = (typ & 32) ? SDOOR : DOOR;
    }
    if (typ & 32) {
        typ &= ~32;
        if (typ < 4) {
            typ = 4;
        }
    }
    set_door_orientation(x, y);
    game.level.locations[x][y].flags = typ;
    game.SpLev_Map[x][y] = 1;
}
/* door({ x = 1, y = 1, state = "nodoor" }); */
/* door({ coord = {1, 1}, state = "nodoor" }); */
/* door({ wall = "north", pos = 3, state="secret" }); */
/* door("nodoor", 1, 2); */
const __lspo_door_doorstates = ["random", "open", "closed", "locked", "nodoor", "broken", "secret", null];
const __lspo_door_doorstates2i = [-1, 2, 4, 8, 0, 1, 32];
const __lspo_door_walldirs = ["all", "random", "north", "west", "east", "south", null];
const __lspo_door_walldirs2i = [(1 | 2 | 4 | 8), (1 | 2 | 4 | 8), 1, 8, 4, 2, 0];
export async function lspo_door(L) {
    let msk = 0;
    let x = 0;
    let y = 0;
    let typ = 0;
    let argc = lua_gettop(L);
    create_des_coder();
    if (argc == 3) {
        msk = __lspo_door_doorstates2i[luaL_checkoption(L, 1, "random", __lspo_door_doorstates)];
        x = luaL_checkinteger(L, 2);
        y = luaL_checkinteger(L, 3);
    } else {
        let dx = 0;
        let dy = 0;
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return dx; }, set value(_v) { dx = _v; } }, { get value() { return dy; }, set value(_v) { dy = _v; } });
        x = dx , y = dy;
        msk = __lspo_door_doorstates2i[get_table_option(L, "state", "random", __lspo_door_doorstates)];
    }
    typ = (msk == -1) ? rnddoor() : msk;
    if (x == -1 && y == -1) {
        /* Note that "random" is also W_ANY, because create_door just wants a
         * mask of acceptable walls */
        let tmpd = { wall: 0, pos: 0, secret: 0, mask: 0 };
        tmpd.secret = (typ == 32) ? 1 : 0;
        tmpd.mask = msk;
        tmpd.pos = get_table_int_opt(L, "pos", -1);
        tmpd.wall = __lspo_door_walldirs2i[get_table_option(L, "wall", "all", __lspo_door_walldirs)];
        await create_door(tmpd, game.coder.croom);
    } else {
        await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 16, game.coder.croom, (((x) & 255) + (((y) & 255) << 16)));
        if (!isok(x, y)) {
            nhl_error(L, "door coord not ok");
            return 0;
        }
        sel_set_door(x, y, typ);
    }
    return 0;
}
export function l_table_getset_feature_flag(L, x, y, name, flag) {
    let val = get_table_boolean_opt(L, name, -2);
    if (val != -2) {
        if (val == -1) {
            val = rn2(2);
        }
        if (val) {
            game.level.locations[x][y].flags |= flag;
        } else {
            game.level.locations[x][y].flags &= ~flag;
        }
    }
}
/* guts of nhl_abs_coord; convert a coordinate relative to a map or room
 * into an absolute coordinate in svl.level.locations.
 *
 * If there is no enclosing map or room, the coordinates are assumed to be
 * absolute already.
 *
 * Part of the reason this is a function is to make it clearer in the calling
 * code that this conversion is what is intended.
 *
 * NOTE: if the coordinates are going to get passed to one of the get_location
 * family of functions, this should NOT be called; get_location already makes
 * an adjustment like this. (What this function supports which get_location
 * doesn't is the input coordinates being negative. get_location will treat
 * that as "level designer wants a random coordinate".) */
export function cvt_to_abscoord(x, y) {
    if (game.coder && game.coder.croom) {
        /* since commit 99715e0, xstart and ystart are only relevant in mklev when
     * maps are being used, and 0 otherwise. It is possible in the future that
     * map positions and dimensions can be saved and retrieved outside of
     * mklev which would reintroduce nonzero xstart/ystart/xsiz/ysiz, but
     * this is not currently implemented, so this function can be assumed to
     * have no effect outside of mklev.
     */
        x.value += game.coder.croom.lx;
        y.value += game.coder.croom.ly;
    } else {
        x.value += game.xstart;
        y.value += game.ystart;
    }
}
/* inverse of cvt_to_abscoord; turn an absolute svl.level.locations coordinate
 * into one relative to the current map or room. */
export function cvt_to_relcoord(x, y) {
    if (game.coder && game.coder.croom) {
        x.value -= game.coder.croom.lx;
        y.value -= game.coder.croom.ly;
    } else {
        x.value -= game.xstart;
        y.value -= game.ystart;
    }
}
/* convert map-relative coordinate to absolute.
  local ax,ay = nh.abscoord(rx, ry);
  local pt = nh.abscoord({ x = 10, y = 5 });
 */
export function nhl_abs_coord(L) {
    let argc = lua_gettop(L);
    let x = -1;
    let y = -1;
    if (argc == 2) {
        x = lua_tointeger(L, 1);
        y = lua_tointeger(L, 2);
        cvt_to_abscoord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } });
        lua_pushinteger(L, x);
        lua_pushinteger(L, y);
        return 2;
    } else if (argc == 1 && lua_type(L, 1) == 5) {
        x = get_table_int(L, "x");
        y = get_table_int(L, "y");
        cvt_to_abscoord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } });
        lua_newtable(L);
        nhl_add_table_entry_int(L, "x", x);
        nhl_add_table_entry_int(L, "y", y);
        return 1;
    } else {
        nhl_error(L, "nhl_abs_coord: Wrong args");
        return 0;
    }
}
/* feature("fountain", x, y); */
/* feature("fountain", {x,y}); */
/* feature({ type="fountain", x=NN, y=NN }); */
/* feature({ type="fountain", coord={NN, NN} }); */
/* feature({ type="tree", coord={NN, NN}, swarm=true, looted=false }); */
const __lspo_feature_features = ["fountain", "sink", "pool", "throne", "tree", null];
const __lspo_feature_features2i = [FOUNTAIN, SINK, POOL, THRONE, TREE, STONE];
export async function lspo_feature(L) {
    let x = 0;
    let y = 0;
    let typ = 0;
    let argc = lua_gettop(L);
    let can_have_flags = (0);
    let fcoord = 0;
    let humidity = 0;
    create_des_coder();
    if (argc == 1 && lua_type(L, 1) == 4) {
        typ = __lspo_feature_features2i[luaL_checkoption(L, 1, (null), __lspo_feature_features)];
        x = y = -1;
    } else if (argc == 2 && lua_type(L, 1) == 4 && lua_type(L, 2) == 5) {
        let fx = 0;
        let fy = 0;
        typ = __lspo_feature_features2i[luaL_checkoption(L, 1, (null), __lspo_feature_features)];
        get_coord(L, 2, { get value() { return fx; }, set value(_v) { fx = _v; } }, { get value() { return fy; }, set value(_v) { fy = _v; } });
        x = fx;
        y = fy;
    } else if (argc == 3) {
        typ = __lspo_feature_features2i[luaL_checkoption(L, 1, (null), __lspo_feature_features)];
        x = luaL_checkinteger(L, 2);
        y = luaL_checkinteger(L, 3);
    } else {
        let fx = 0;
        let fy = 0;
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return fx; }, set value(_v) { fx = _v; } }, { get value() { return fy; }, set value(_v) { fy = _v; } });
        x = fx , y = fy;
        typ = __lspo_feature_features2i[get_table_option(L, "type", null, __lspo_feature_features)];
        can_have_flags = (1);
    }
    if (x == -1 && y == -1) {
        fcoord = (16777216 | (0));
        /* pick a regular space, no rock or other furniture */
        humidity = 1;
    } else {
        fcoord = (((x) & 255) + (((y) & 255) << 16));
        /* assume the author knows what they're doing */
        humidity = 16;
    }
    await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, humidity, game.coder.croom, fcoord);
    if (typ == STONE) {
        await impossible("feature has unknown type param.");
    } else {
        sel_set_feature(x, y, typ);
    }
    if (game.level.locations[x][y].typ != typ || !can_have_flags) {
        return 0;
    }
    switch (typ) {
        default:
            break;
        case FOUNTAIN:
            l_table_getset_feature_flag(L, x, y, "looted", 1);
            l_table_getset_feature_flag(L, x, y, "warned", 2);
            break;
        case SINK:
            l_table_getset_feature_flag(L, x, y, "pudding", 1);
            l_table_getset_feature_flag(L, x, y, "dishwasher", 2);
            l_table_getset_feature_flag(L, x, y, "ring", 4);
            break;
        case THRONE:
            l_table_getset_feature_flag(L, x, y, "looted", 1);
            break;
        case TREE:
            l_table_getset_feature_flag(L, x, y, "looted", 1);
            l_table_getset_feature_flag(L, x, y, "swarm", 2);
            break;
    }
    return 0;
}
/* gas_cloud({ selection=SELECTION }); */
/* gas_cloud({ selection=SELECTION, damage=N }); */
/* gas_cloud({ selection=SELECTION, damage=N, ttl=N }); */
export async function lspo_gas_cloud(L) {
    let x = 0;
    let y = 0;
    let sel = null;
    let argc = lua_gettop(L);
    let damage = 0;
    let ttl = -2;
    create_des_coder();
    if (argc == 1 && lua_type(L, 1) == 5) {
        let tx = 0;
        let ty = 0;
        let reg = null;
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return tx; }, set value(_v) { tx = _v; } }, { get value() { return ty; }, set value(_v) { ty = _v; } });
        x = tx , y = ty;
        if (tx == -1 && ty == -1) {
            lua_getfield(L, 1, "selection");
            sel = l_selection_check(L, -1);
            lua_pop(L, 1);
        }
        damage = get_table_int_opt(L, "damage", 0);
        ttl = get_table_int_opt(L, "ttl", -2);
        if (!sel) {
            reg = await create_gas_cloud(x, y, 1, damage);
        } else {
            reg = await create_gas_cloud_selection(sel, damage);
        }
        if (ttl > -2) {
            reg.ttl = ttl;
        }
    } else {
        nhl_error(L, "wrong parameters");
    }
    return 0;
}
/*
 * [lit_state: 1 On, 0 Off, -1 random, -2 leave as-is]
 * terrain({ x=NN, y=NN, typ=MAPCHAR, lit=lit_state });
 * terrain({ coord={X, Y}, typ=MAPCHAR, lit=lit_state });
 * terrain({ selection=SELECTION, typ=MAPCHAR, lit=lit_state });
 * terrain( SELECTION, MAPCHAR [, lit_state ] );
 * terrain({x,y}, MAPCHAR);
 * terrain(x,y, MAPCHAR);
 */
export async function lspo_terrain(L) {
    let tmpterrain = { ter: 0, tlit: 0 };
    let x = 0;
    let y = 0;
    let sel = null;
    let argc = lua_gettop(L);
    create_des_coder();
    tmpterrain.tlit = -2;
    tmpterrain.ter = INVALID_TYPE;
    if (argc == 1) {
        let tx = 0;
        let ty = 0;
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return tx; }, set value(_v) { tx = _v; } }, { get value() { return ty; }, set value(_v) { ty = _v; } });
        x = tx , y = ty;
        if (tx == -1 && ty == -1) {
            lua_getfield(L, 1, "selection");
            sel = l_selection_check(L, -1);
            lua_pop(L, 1);
        }
        tmpterrain.ter = get_table_mapchr(L, "typ");
        tmpterrain.tlit = get_table_int_opt(L, "lit", -2);
    } else if (argc == 2 && lua_type(L, 1) == 5 && lua_type(L, 2) == 4) {
        let tx = 0;
        let ty = 0;
        tmpterrain.ter = check_mapchr(luaL_checkstring(L, 2));
        lua_pop(L, 1);
        get_coord(L, 1, { get value() { return tx; }, set value(_v) { tx = _v; } }, { get value() { return ty; }, set value(_v) { ty = _v; } });
        x = tx;
        y = ty;
    } else if (argc == 2) {
        sel = l_selection_check(L, 1);
        tmpterrain.ter = check_mapchr(luaL_checkstring(L, 2));
    } else if (argc == 3) {
        x = luaL_checkinteger(L, 1);
        y = luaL_checkinteger(L, 2);
        tmpterrain.ter = check_mapchr(luaL_checkstring(L, 3));
    } else {
        nhl_error(L, "wrong parameters");
    }
    if (tmpterrain.ter == INVALID_TYPE) {
        nhl_error(L, "Erroneous map char");
    }
    if (sel) {
        selection_iterate(sel, sel_set_ter, tmpterrain);
    } else {
        await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 16, game.coder.croom, (((x) & 255) + (((y) & 255) << 16)));
        if (!isok(x, y)) {
            nhl_error(L, "terrain coord not ok");
            return 0;
        }
        await sel_set_ter(x, y, tmpterrain);
    }
    return 0;
}
/*
 * replace_terrain({ x1=NN,y1=NN, x2=NN,y2=NN, fromterrain=MAPCHAR,
 *                   toterrain=MAPCHAR, lit=N, chance=NN });
 * replace_terrain({ region={x1,y1, x2,y2}, fromterrain=MAPCHAR,
 *                   toterrain=MAPCHAR, lit=N, chance=NN });
 * replace_terrain({ selection=selection.area(2,5, 40,10),
 *                   fromterrain=MAPCHAR, toterrain=MAPCHAR });
 * replace_terrain({ selection=SEL, mapfragment=[[...]],
 *                   toterrain=MAPCHAR });
 */
export async function lspo_replace_terrain(L) {
    let totyp = 0;
    let fromtyp = 0;
    let mf = null;
    let sel = null;
    let freesel = (0);
    let x = 0;
    let y = 0;
    let x1 = 0;
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;
    let chance = 0;
    let tolit = 0;
    let rect = cg.zeroNhRect;
    create_des_coder();
    lcheck_param_table(L);
    totyp = get_table_mapchr(L, "toterrain");
    if (totyp >= MAX_TYPE) {
        return 0;
    }
    fromtyp = get_table_mapchr_opt(L, "fromterrain", INVALID_TYPE);
    if (fromtyp == INVALID_TYPE) {
        let err = null;
        let tmpstr = get_table_str(L, "mapfragment");
        mf = mapfrag_fromstr(tmpstr);
        free(tmpstr);
        if ((err = await mapfrag_error(mf)) != (null)) {
            nhl_error(L, err);
        }
    }
    chance = get_table_int_opt(L, "chance", 100);
    tolit = get_table_int_opt(L, "lit", -2);
    x1 = get_table_int_opt(L, "x1", -1);
    y1 = get_table_int_opt(L, "y1", -1);
    x2 = get_table_int_opt(L, "x2", -1);
    y2 = get_table_int_opt(L, "y2", -1);
    if (x1 == -1 && y1 == -1 && x2 == -1 && y2 == -1) {
        get_table_region(L, "region", { get value() { return x1; }, set value(_v) { x1 = _v; } }, { get value() { return y1; }, set value(_v) { y1 = _v; } }, { get value() { return x2; }, set value(_v) { x2 = _v; } }, { get value() { return y2; }, set value(_v) { y2 = _v; } }, (1));
    }
    if (x1 == -1 && y1 == -1 && x2 == -1 && y2 == -1) {
        lua_getfield(L, 1, "selection");
        if (lua_type(L, -1) != 0) {
            sel = l_selection_check(L, -1);
        }
        lua_pop(L, 1);
    }
    if (!sel) {
        sel = selection_new();
        freesel = (1);
        if (x1 == -1 && y1 == -1 && x2 == -1 && y2 == -1) {
            selection_clear(sel, 1);
        } else {
            let rx1 = 0;
            let ry1 = 0;
            let rx2 = 0;
            let ry2 = 0;
            rx1 = x1 , ry1 = y1 , rx2 = x2 , ry2 = y2;
            await get_location({ get value() { return rx1; }, set value(_v) { rx1 = _v; } }, { get value() { return ry1; }, set value(_v) { ry1 = _v; } }, 16, game.coder.croom);
            await get_location({ get value() { return rx2; }, set value(_v) { rx2 = _v; } }, { get value() { return ry2; }, set value(_v) { ry2 = _v; } }, 16, game.coder.croom);
            for (x = ((rx1) > (0) ? (rx1) : (0)); x <= ((rx2) < (80 - 1) ? (rx2) : (80 - 1)); x++) {
                for (y = ((ry1) > (0) ? (ry1) : (0)); y <= ((ry2) < (21 - 1) ? (ry2) : (21 - 1)); y++) {
                    selection_setpoint(x, y, sel, 1);
                }
            }
        }
    }
    selection_getbounds(sel, rect);
    for (x = ((1) > (rect.lx) ? (1) : (rect.lx)); x <= rect.hx; x++) {
        for (y = rect.ly; y <= rect.hy; y++) {
            if (selection_getpoint(x, y, sel)) {
                if (mf) {
                    if (await mapfrag_match(mf, x, y) && (rn2(100)) < chance) {
                        await set_levltyp_lit(x, y, totyp, tolit);
                    }
                } else {
                    if (((fromtyp == MATCH_WALL && ((game.level.locations[x][y].typ) <= DBWALL)) || game.level.locations[x][y].typ == fromtyp) && rn2(100) < chance) {
                        await set_levltyp_lit(x, y, totyp, tolit);
                    }
                }
            }
        }
    }
    if (freesel) {
        selection_free(sel, (1));
    }
    mapfrag_free({ get value() { return mf; }, set value(_v) { mf = _v; } });
    return 0;
}
const __generate_way_out_method_escapeitems = [PICK_AXE, DWARVISH_MATTOCK, WAN_DIGGING, WAN_TELEPORTATION, SCR_TELEPORTATION, RIN_TELEPORTATION];
export async function generate_way_out_method(nx, ny, ov) {
    let ov2 = null;
    let ov3 = null;
    let x = 0;
    let y = 0;
    let res = 0;
    gotitdone: {
        ov2 = selection_new();
        res = (1);
        await selection_floodfill(ov2, nx, ny, (1));
        ov3 = selection_clone(ov2);
        while (selection_rndcoord(ov3, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, (1))) {
            if (isok(x + 1, y) && !selection_getpoint(x + 1, y, ov) && ((game.level.locations[x + 1][y].typ) && (game.level.locations[x + 1][y].typ) <= DBWALL) && isok(x + 2, y) && selection_getpoint(x + 2, y, ov) && ((game.level.locations[x + 2][y].typ) >= DOOR)) {
                game.level.locations[x + 1][y].typ = SDOOR;
                /* try to make a secret door */
                break gotitdone;
            }
            if (isok(x - 1, y) && !selection_getpoint(x - 1, y, ov) && ((game.level.locations[x - 1][y].typ) && (game.level.locations[x - 1][y].typ) <= DBWALL) && isok(x - 2, y) && selection_getpoint(x - 2, y, ov) && ((game.level.locations[x - 2][y].typ) >= DOOR)) {
                game.level.locations[x - 1][y].typ = SDOOR;
                break gotitdone;
            }
            if (isok(x, y + 1) && !selection_getpoint(x, y + 1, ov) && ((game.level.locations[x][y + 1].typ) && (game.level.locations[x][y + 1].typ) <= DBWALL) && isok(x, y + 2) && selection_getpoint(x, y + 2, ov) && ((game.level.locations[x][y + 2].typ) >= DOOR)) {
                game.level.locations[x][y + 1].typ = SDOOR;
                break gotitdone;
            }
            if (isok(x, y - 1) && !selection_getpoint(x, y - 1, ov) && ((game.level.locations[x][y - 1].typ) && (game.level.locations[x][y - 1].typ) <= DBWALL) && isok(x, y - 2) && selection_getpoint(x, y - 2, ov) && ((game.level.locations[x][y - 2].typ) >= DOOR)) {
                game.level.locations[x][y - 1].typ = SDOOR;
                break gotitdone;
            }
        }
        if (Can_fall_thru(game.u.uz)) {
            /* try to make a hole or a trapdoor */
            selection_free(ov3, (1));
            ov3 = selection_clone(ov2);
            while (selection_rndcoord(ov3, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, (1))) {
                if (await maketrap(x, y, rn2(2) ? HOLE : TRAPDOOR)) {
                    break gotitdone;
                }
            }
        }
        if (selection_rndcoord(ov2, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, (0))) {
            await mksobj_at(__generate_way_out_method_escapeitems[rn2((Math.trunc(24 /* sizeof(const int [6]) */ / 4 /* sizeof(const int) */)))], x, y, (1), (0));
            break gotitdone;
        }
        res = (0);
    }
    selection_free(ov2, (1));
    selection_free(ov3, (1));
    return res;
}
export async function ensure_way_out() {
    let ov = selection_new();
    let ttmp = game.ftrap;
    let x = 0;
    let y = 0;
    let ret = (1);
    let stway = game.stairs;
    set_selection_floodfillchk(floodfillchk_match_accessible);
    while (stway) {
        if (stway.tolev.dnum == game.u.uz.dnum) {
            await selection_floodfill(ov, stway.sx, stway.sy, (1));
        }
        stway = stway.next;
    }
    while (ttmp) {
        if ((((ttmp.ttyp) == MAGIC_PORTAL || (ttmp.ttyp) == VIBRATING_SQUARE) || ((ttmp.ttyp) == HOLE || (ttmp.ttyp) == TRAPDOOR)) && !selection_getpoint(ttmp.tx, ttmp.ty, ov)) {
            await selection_floodfill(ov, ttmp.tx, ttmp.ty, (1));
        }
        ttmp = ttmp.ntrap;
    }
    do {
        outhere: {
            ret = (1);
            for (x = 1; x < 80; x++) {
                for (y = 0; y < 21; y++) {
                    if (((game.level.locations[x][y].typ) >= DOOR) && !selection_getpoint(x, y, ov)) {
                        if (await generate_way_out_method(x, y, ov)) {
                            await selection_floodfill(ov, x, y, (1));
                        }
                        ret = (0);
                        break outhere;
                    }
                }
            }
        }
    } while (!ret);
    selection_free(ov, (1));
}
export function get_table_intarray_entry(L, tableidx, entrynum) {
    let ret = 0;
    if (tableidx < 0) {
        tableidx--;
    }
    lua_pushinteger(L, entrynum);
    lua_gettable(L, tableidx);
    if (lua_isnumber(L, -1)) {
        ret = lua_tointeger(L, -1);
    } else {
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        buf = sprintf(buf, "Array entry #%i is %s, expected number", 1, luaL_typename(L, -1));
        nhl_error(L, buf);
    }
    lua_pop(L, 1);
    return ret;
}
export function get_table_region(L, name, x1, y1, x2, y2, optional) {
    let arrlen = 0;
    lua_getfield(L, 1, name);
    if (optional && lua_type(L, -1) == 0) {
        lua_pop(L, 1);
        return 1;
    }
    luaL_checktype(L, -1, 5);
    lua_len(L, -1);
    arrlen = lua_tointeger(L, -1);
    lua_pop(L, 1);
    if (arrlen != 4) {
        nhl_error(L, "Not a region");
        lua_pop(L, 1);
        return 0;
    }
    x1.value = get_table_intarray_entry(L, -1, 1);
    y1.value = get_table_intarray_entry(L, -1, 2);
    x2.value = get_table_intarray_entry(L, -1, 3);
    y2.value = get_table_intarray_entry(L, -1, 4);
    lua_pop(L, 1);
    return 1;
}
export function get_coord(L, i, x, y) {
    let ret = (0);
    let ltyp = lua_type(L, i);
    if (ltyp == 5) {
        let arrlen = 0;
        let gotx = (0);
        lua_getfield(L, i, "x");
        if (!lua_isnil(L, -1)) {
            x.value = luaL_checkinteger(L, -1);
            gotx = (1);
        }
        lua_pop(L, 1);
        if (gotx) {
            lua_getfield(L, i, "y");
            if (!lua_isnil(L, -1)) {
                y.value = luaL_checkinteger(L, -1);
                lua_pop(L, 1);
                ret = (1);
            } else {
                nhl_error(L, "Not a coordinate");
                return (0);
            }
        } else {
            lua_len(L, i);
            arrlen = lua_tointeger(L, -1);
            lua_pop(L, 1);
            if (arrlen != 2) {
                nhl_error(L, "Not a coordinate");
                return (0);
            }
            x.value = get_table_intarray_entry(L, i, 1);
            y.value = get_table_intarray_entry(L, i, 2);
            return (1);
        }
    } else if (ltyp != 0) {
        /* non-existent coord is ok */
        nhl_error(L, "non-table coord specified");
    }
    return ret;
}
export async function levregion_add(lregion) {
    if (!lregion.in_islev) {
        await get_location({ get value() { return lregion.inarea.x1; }, set value(_v) { lregion.inarea.x1 = _v; } }, { get value() { return lregion.inarea.y1; }, set value(_v) { lregion.inarea.y1 = _v; } }, 16, null);
        await get_location({ get value() { return lregion.inarea.x2; }, set value(_v) { lregion.inarea.x2 = _v; } }, { get value() { return lregion.inarea.y2; }, set value(_v) { lregion.inarea.y2 = _v; } }, 16, null);
    }
    if (!lregion.del_islev) {
        await get_location({ get value() { return lregion.delarea.x1; }, set value(_v) { lregion.delarea.x1 = _v; } }, { get value() { return lregion.delarea.y1; }, set value(_v) { lregion.delarea.y1 = _v; } }, 16, null);
        await get_location({ get value() { return lregion.delarea.x2; }, set value(_v) { lregion.delarea.x2 = _v; } }, { get value() { return lregion.delarea.y2; }, set value(_v) { lregion.delarea.y2 = _v; } }, 16, null);
    }
    if (game.num_lregions) {
        /* realloc the lregion space to add the new one */
        let newl = alloc(1 /* sizeof(lev_region) */ * (1 + game.num_lregions));
        memcpy((newl), game.lregions, 1 /* sizeof(lev_region) */ * game.num_lregions);
        do {
            if (game.lregions) {
                free((game.lregions));
            }
        } while (0);
        game.num_lregions++;
        game.lregions = newl;
    } else {
        game.num_lregions = 1;
        game.lregions = alloc(1 /* sizeof(lev_region) */);
    }
    memcpy(game.lregions[game.num_lregions - 1], lregion, 1 /* sizeof(lev_region) */);
}
/* get params from topmost lua hash:
   - region = {x1,y1,x2,y2}
   - exclude = {x1,y1,x2,y2} (optional)
   - region_islev=true, exclude_islev=true (optional)
   - negative x and y are invalid */
export function l_get_lregion(L, tmplregion) {
    let x1 = 0;
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;
    get_table_region(L, "region", { get value() { return x1; }, set value(_v) { x1 = _v; } }, { get value() { return y1; }, set value(_v) { y1 = _v; } }, { get value() { return x2; }, set value(_v) { x2 = _v; } }, { get value() { return y2; }, set value(_v) { y2 = _v; } }, (0));
    tmplregion.inarea.x1 = x1;
    tmplregion.inarea.y1 = y1;
    tmplregion.inarea.x2 = x2;
    tmplregion.inarea.y2 = y2;
    x1 = y1 = x2 = y2 = -1;
    get_table_region(L, "exclude", { get value() { return x1; }, set value(_v) { x1 = _v; } }, { get value() { return y1; }, set value(_v) { y1 = _v; } }, { get value() { return x2; }, set value(_v) { x2 = _v; } }, { get value() { return y2; }, set value(_v) { y2 = _v; } }, (1));
    tmplregion.delarea.x1 = x1;
    tmplregion.delarea.y1 = y1;
    tmplregion.delarea.x2 = x2;
    tmplregion.delarea.y2 = y2;
    tmplregion.in_islev = get_table_boolean_opt(L, "region_islev", 0);
    tmplregion.del_islev = get_table_boolean_opt(L, "exclude_islev", 0);
    /* if x1 is still negative, exclude wasn't specified, so we should treat
     * it as if there is no exclude region at all. Force exclude_islev to
     * true so the -1,-1,-1,-1 region is safely off the map and won't
     * interfere with branch or portal placement. */
    if (x1 < 0) {
        tmplregion.del_islev = (1);
    }
}
/* teleport_region({ region = { x1,y1, x2,y2 } }); */
/* teleport_region({ region = { x1,y1, x2,y2 }, [ region_islev = 1, ]
 *   exclude = { x1,y1, x2,y2 }, [ exclude_islen = 1, ] [ dir = "up" ] }); */
/* TODO: maybe allow using selection, with a new method "getextents()"? */
const __lspo_teleport_region_teledirs = ["both", "down", "up", null];
const __lspo_teleport_region_teledirs2i = [LR_TELE, LR_DOWNTELE, LR_UPTELE, -1];
export async function lspo_teleport_region(L) {
    let tmplregion = { inarea: { x1: 0, y1: 0, x2: 0, y2: 0 }, delarea: { x1: 0, y1: 0, x2: 0, y2: 0 }, in_islev: 0, del_islev: 0, rtype: 0, padding: 0, rname: { str: null, len: 0 } };
    create_des_coder();
    lcheck_param_table(L);
    l_get_lregion(L, tmplregion);
    tmplregion.rtype = __lspo_teleport_region_teledirs2i[get_table_option(L, "dir", "both", __lspo_teleport_region_teledirs)];
    tmplregion.padding = 0;
    tmplregion.rname.str = null;
    await levregion_add(tmplregion);
    return 0;
}
/* TODO: FIXME
   from lev_comp SPO_LEVREGION was called as:
   - STAIR:(x1,y1,x2,y2),(x1,y1,x2,y2),dir
   - PORTAL:(x1,y1,x2,y2),(x1,y1,x2,y2),string
   - BRANCH:(x1,y1,x2,y2),(x1,y1,x2,y2),dir
*/
/* levregion({ region = { x1,y1, x2,y2 }, exclude = { x1,y1, x2,y2 },
 *             type = "portal", name="air" }); */
/* TODO: allow region to be optional, defaulting to whole level */
const __lspo_levregion_regiontypes = ["stair-down", "stair-up", "portal", "branch", "teleport", "teleport-up", "teleport-down", null];
const __lspo_levregion_regiontypes2i = [LR_DOWNSTAIR, LR_UPSTAIR, LR_PORTAL, LR_BRANCH, LR_TELE, LR_UPTELE, LR_DOWNTELE, 0];
export async function lspo_levregion(L) {
    let tmplregion = { inarea: { x1: 0, y1: 0, x2: 0, y2: 0 }, delarea: { x1: 0, y1: 0, x2: 0, y2: 0 }, in_islev: 0, del_islev: 0, rtype: 0, padding: 0, rname: { str: null, len: 0 } };
    create_des_coder();
    lcheck_param_table(L);
    l_get_lregion(L, tmplregion);
    tmplregion.rtype = __lspo_levregion_regiontypes2i[get_table_option(L, "type", "stair-down", __lspo_levregion_regiontypes)];
    tmplregion.padding = get_table_int_opt(L, "padding", 0);
    tmplregion.rname.str = get_table_str_opt(L, "name", null);
    await levregion_add(tmplregion);
    return 0;
}
/* exclusion({ type = "teleport", region = { x1,y1, x2,y2 } }); */
const __lspo_exclusion_ez_types = ["teleport", "teleport-up", "teleport-down", "monster-generation", null];
const __lspo_exclusion_ez_types2i = [LR_TELE, LR_UPTELE, LR_DOWNTELE, LR_MONGEN, 0];
export async function lspo_exclusion(L) {
    let ez = alloc(1 /* sizeof(struct exclusion_zone) */);
    let x1 = 0;
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;
    let a1 = 0;
    let b1 = 0;
    let a2 = 0;
    let b2 = 0;
    create_des_coder();
    lcheck_param_table(L);
    ez.zonetype = __lspo_exclusion_ez_types2i[get_table_option(L, "type", "teleport", __lspo_exclusion_ez_types)];
    get_table_region(L, "region", { get value() { return x1; }, set value(_v) { x1 = _v; } }, { get value() { return y1; }, set value(_v) { y1 = _v; } }, { get value() { return x2; }, set value(_v) { x2 = _v; } }, { get value() { return y2; }, set value(_v) { y2 = _v; } }, (0));
    a1 = x1 , b1 = y1;
    a2 = x2 , b2 = y2;
    await get_location_coord({ get value() { return a1; }, set value(_v) { a1 = _v; } }, { get value() { return b1; }, set value(_v) { b1 = _v; } }, 16 | 32, game.coder.croom, (((a1) & 255) + (((b1) & 255) << 16)));
    await get_location_coord({ get value() { return a2; }, set value(_v) { a2 = _v; } }, { get value() { return b2; }, set value(_v) { b2 = _v; } }, 16 | 32, game.coder.croom, (((a2) & 255) + (((b2) & 255) << 16)));
    ez.lx = a1;
    ez.ly = b1;
    ez.hx = a2;
    ez.hy = b2;
    ez.next = game.exclusion_zones;
    game.exclusion_zones = ez;
    return 0;
}
export function sel_set_lit(x, y, arg) {
    let lit = arg;
    game.level.locations[x][y].lit = (((game.level.locations[x][y].typ) == LAVAPOOL || (game.level.locations[x][y].typ) == LAVAWALL) || lit) ? 1 : 0;
}
/* Add to the room any doors within/bordering it */
export function add_doors_to_room(croom) {
    let x = 0;
    let y = 0;
    let i = 0;
    for (x = croom.lx - 1; x <= croom.hx + 1; x++) {
        for (y = croom.ly - 1; y <= croom.hy + 1; y++) {
            if (((game.level.locations[x][y].typ) == DOOR) || game.level.locations[x][y].typ == SDOOR) {
                maybe_add_door(x, y, croom);
            }
        }
    }
    for (i = 0; i < croom.nsubrooms; i++) {
        add_doors_to_room(croom.sbrooms[i]);
    }
}
/* inside a lua table, get fields x1,y1,x2,y2 or region table */
export function get_table_coords_or_region(L, dx1, dy1, dx2, dy2) {
    dx1.value = get_table_int_opt(L, "x1", -1);
    dy1.value = get_table_int_opt(L, "y1", -1);
    dx2.value = get_table_int_opt(L, "x2", -1);
    dy2.value = get_table_int_opt(L, "y2", -1);
    if (dx1.value == -1 && dy1.value == -1 && dx2.value == -1 && dy2.value == -1) {
        let rx1 = 0;
        let ry1 = 0;
        let rx2 = 0;
        let ry2 = 0;
        get_table_region(L, "region", { get value() { return rx1; }, set value(_v) { rx1 = _v; } }, { get value() { return ry1; }, set value(_v) { ry1 = _v; } }, { get value() { return rx2; }, set value(_v) { rx2 = _v; } }, { get value() { return ry2; }, set value(_v) { ry2 = _v; } }, (0));
        dx1.value = rx1;
        dy1.value = ry1;
        dx2.value = rx2;
        dy2.value = ry2;
    }
}
/* region(selection, lit); */
/* region({ x1=NN, y1=NN, x2=NN, y2=NN, lit=BOOL, type=ROOMTYPE, joined=BOOL,
 *          irregular=BOOL, filled=NN [ , contents = FUNCTION ] }); */
/* region({ region={x1,y1, x2,y2}, type="ordinary" }); */
const __lspo_region_lits = ["unlit", "lit", null];
export async function lspo_region(L) {
    let dx1 = 0;
    let dy1 = 0;
    let dx2 = 0;
    let dy2 = 0;
    let troom = null;
    let do_arrival_room = (0);
    let room_not_needed = 0;
    let irregular = (0);
    let joined = (1);
    let rtype = OROOM;
    let rlit = 1;
    let needfill = 0;
    let argc = lua_gettop(L);
    create_des_coder();
    if (argc <= 1) {
        lcheck_param_table(L);
        /* TODO: "unfilled" => filled=0, "filled" => filled=1, and
         * "lvflags_only" => filled=2, probably in a get_table_needfill_opt */
        needfill = get_table_int_opt(L, "filled", 0);
        irregular = get_table_boolean_opt(L, "irregular", 0);
        joined = get_table_boolean_opt(L, "joined", (1));
        do_arrival_room = get_table_boolean_opt(L, "arrival_room", 0);
        rtype = await get_table_roomtype_opt(L, "type", OROOM);
        rlit = get_table_int_opt(L, "lit", -1);
        get_table_coords_or_region(L, { get value() { return dx1; }, set value(_v) { dx1 = _v; } }, { get value() { return dy1; }, set value(_v) { dy1 = _v; } }, { get value() { return dx2; }, set value(_v) { dx2 = _v; } }, { get value() { return dy2; }, set value(_v) { dy2 = _v; } });
        if (dx1 == -1 && dy1 == -1 && dx2 == -1 && dy2 == -1) {
            nhl_error(L, "region needs region");
        }
    } else if (argc == 2) {
        /* region(selection, "lit"); */
        let orig = l_selection_check(L, 1);
        let sel = selection_clone(orig);
        rlit = luaL_checkoption(L, 2, "lit", __lspo_region_lits);
        /*
    TODO: lit=random
        */
        if (rlit) {
            selection_do_grow(sel, (1 | 2 | 4 | 8));
        }
        selection_iterate(sel, sel_set_lit, rlit);
        selection_free(sel, (1));
        return 0;
    } else {
        nhl_error(L, "Wrong parameters");
        return 0;
    }
    rlit = litstate_rnd(rlit);
    await get_location({ get value() { return dx1; }, set value(_v) { dx1 = _v; } }, { get value() { return dy1; }, set value(_v) { dy1 = _v; } }, 16, null);
    await get_location({ get value() { return dx2; }, set value(_v) { dx2 = _v; } }, { get value() { return dy2; }, set value(_v) { dy2 = _v; } }, 16, null);
    /* Many regions are simple, rectangular areas that just need to set
     * lighting in an area. In that case, we don't need to do anything
     * complicated by creating a room. The exceptions are:
     *  - Special rooms (which usually need to be filled).
     *  - Irregular regions (more convenient to use the room-making code).
     *  - Themed room regions (which often have contents).
     *  - When a room is desired to constrain the arrival of migrating
     *    monsters (see the mon_arrive function for details).
     */
    room_not_needed = (rtype == OROOM && !irregular && !do_arrival_room && !game.in_mk_themerooms);
    if (room_not_needed || game.nroom >= 40) {
        let tmpregion = { x1: 0, y1: 0, x2: 0, y2: 0, rtype: 0, rlit: 0, rirreg: 0 };
        if (!room_not_needed) {
            await impossible("Too many rooms on new level!");
        }
        tmpregion.rlit = rlit;
        tmpregion.x1 = dx1;
        tmpregion.y1 = dy1;
        tmpregion.x2 = dx2;
        tmpregion.y2 = dy2;
        light_region(tmpregion);
        return 0;
    }
    troom = game.rooms[game.nroom];
    /* mark rooms that must be filled, but do it later */
    troom.needfill = needfill;
    troom.needjoining = joined;
    if (irregular) {
        game.min_rx = game.max_rx = dx1;
        game.min_ry = game.max_ry = dy1;
        game.smeq[game.nroom] = game.nroom;
        flood_fill_rm(dx1, dy1, game.nroom + 3, rlit, (1));
        await add_room(game.min_rx, game.min_ry, game.max_rx, game.max_ry, (0), rtype, (1));
        troom.rlit = rlit;
        troom.irregular = (1);
    } else {
        await add_room(dx1, dy1, dx2, dy2, rlit, rtype, (1));
        topologize(troom);
    }
    if (!room_not_needed) {
        if (game.coder.n_subroom > 1) {
            await impossible("region as subroom");
        } else {
            game.coder.tmproomlist[game.coder.n_subroom] = troom;
            game.coder.failed_room[game.coder.n_subroom] = (0);
            game.coder.n_subroom++;
            update_croom();
            lua_getfield(L, 1, "contents");
            if (lua_type(L, -1) == 6) {
                lua_remove(L, -2);
                await l_push_mkroom_table(L, troom);
                await nhl_pcall_handle(L, 1, 0, "lspo_region", NHLpa_panic);
            } else {
                lua_pop(L, 1);
            }
            spo_endroom(game.coder);
            add_doors_to_room(troom);
        }
    }
    return 0;
}
/* drawbridge({ dir="east", state="closed", x=05,y=08 }); */
/* drawbridge({ dir="east", state="closed", coord={05,08} }); */
const __lspo_drawbridge_mwdirs = ["north", "south", "west", "east", "random", null];
const __lspo_drawbridge_mwdirs2i = [0, 1, 3, 2, -1, -2];
const __lspo_drawbridge_dbopens = ["open", "closed", "random", null];
const __lspo_drawbridge_dbopens2i = [1, 0, -1, -2];
export async function lspo_drawbridge(L) {
    let x = 0;
    let y = 0;
    let mx = 0;
    let my = 0;
    let dir = 0;
    let db_open = 0;
    let dcoord = 0;
    create_des_coder();
    lcheck_param_table(L);
    get_table_xy_or_coord(L, { get value() { return mx; }, set value(_v) { mx = _v; } }, { get value() { return my; }, set value(_v) { my = _v; } });
    dir = __lspo_drawbridge_mwdirs2i[get_table_option(L, "dir", "random", __lspo_drawbridge_mwdirs)];
    dcoord = (((mx) & 255) + (((my) & 255) << 16));
    db_open = __lspo_drawbridge_dbopens2i[get_table_option(L, "state", "random", __lspo_drawbridge_dbopens)];
    x = mx;
    y = my;
    await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 1 | 2 | 4, game.coder.croom, dcoord);
    if (!isok(mx, my)) {
        nhl_error(L, "drawbridge coord not ok");
        return 0;
    }
    if (db_open == -1) {
        db_open = !rn2(2);
    }
    if (!await create_drawbridge(x, y, dir, db_open ? (1) : (0))) {
        await impossible("Cannot create drawbridge.");
    }
    game.SpLev_Map[x][y] = 1;
    return 0;
}
/* mazewalk({ x = NN, y = NN, typ = ".", dir = "north", stocked = 0 }); */
/* mazewalk({ coord = {XX, YY}, typ = ".", dir = "north", stocked = 0 }); */
/* mazewalk(x,y,dir); */
const __lspo_mazewalk_mwdirs = ["north", "south", "east", "west", "random", null];
const __lspo_mazewalk_mwdirs2i = [1, 2, 4, 8, -1, -2];
export async function lspo_mazewalk(L) {
    let x = 0;
    let y = 0;
    let mx = 0;
    let my = 0;
    let ftyp = ROOM;
    let fstocked = 1;
    let dir = -1;
    let mcoord = 0;
    let argc = lua_gettop(L);
    create_des_coder();
    if (argc == 3) {
        mx = luaL_checkinteger(L, 1);
        my = luaL_checkinteger(L, 2);
        dir = __lspo_mazewalk_mwdirs2i[luaL_checkoption(L, 3, "random", __lspo_mazewalk_mwdirs)];
    } else {
        lcheck_param_table(L);
        get_table_xy_or_coord(L, { get value() { return mx; }, set value(_v) { mx = _v; } }, { get value() { return my; }, set value(_v) { my = _v; } });
        ftyp = get_table_mapchr_opt(L, "typ", ROOM);
        fstocked = get_table_boolean_opt(L, "stocked", 1);
        dir = __lspo_mazewalk_mwdirs2i[get_table_option(L, "dir", "random", __lspo_mazewalk_mwdirs)];
    }
    mcoord = (((mx) & 255) + (((my) & 255) << 16));
    x = mx;
    y = my;
    await get_location_coord({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 16, game.coder.croom, mcoord);
    if (!isok(x, y)) {
        nhl_error(L, "mazewalk coord not ok");
        return 0;
    }
    if (ftyp < 1) {
        ftyp = game.level.flags.corrmaze ? CORR : ROOM;
    }
    if (dir == -1) {
        dir = random_wdir();
    }
    switch (dir) {
        case 1:
            --y;
            break;
        case 2:
            y++;
            break;
        case 4:
            x++;
            break;
        case 8:
            --x;
            break;
        default:
            await impossible("mazewalk: Bad direction");
    }
    if (!((game.level.locations[x][y].typ) == DOOR)) {
        game.level.locations[x][y].typ = ftyp;
        game.level.locations[x][y].flags = 0;
    }
    if (!(x % 2)) {
        if (dir == 4) {
            x++;
        /*
     * We must be sure that the parity of the coordinates for
     * walkfrom() is odd.  But we must also take into account
     * what direction was chosen.
     */
        } else {
            x--;
        }
        game.level.locations[x][y].typ = ftyp;
        game.level.locations[x][y].flags = 0;
    }
    if (!(y % 2)) {
        if (dir == 2) {
            y++;
        } else {
            y--;
        }
    }
    await walkfrom(x, y, ftyp);
    if (fstocked) {
        await fill_empty_maze();
    }
    return 0;
}
/* wall_property({ x1=0, y1=0, x2=78, y2=20, property="nondiggable" }); */
/* wall_property({ region = {1,0, 78,20}, property="nonpasswall" }); */
const __lspo_wall_property_wprops = ["nondiggable", "nonpasswall", null];
const __lspo_wall_property_wprop2i = [8, 16, -1];
export async function lspo_wall_property(L) {
    let dx1 = -1;
    let dy1 = -1;
    let dx2 = -1;
    let dy2 = -1;
    let wprop = 0;
    create_des_coder();
    lcheck_param_table(L);
    get_table_coords_or_region(L, { get value() { return dx1; }, set value(_v) { dx1 = _v; } }, { get value() { return dy1; }, set value(_v) { dy1 = _v; } }, { get value() { return dx2; }, set value(_v) { dx2 = _v; } }, { get value() { return dy2; }, set value(_v) { dy2 = _v; } });
    wprop = __lspo_wall_property_wprop2i[get_table_option(L, "property", "nondiggable", __lspo_wall_property_wprops)];
    if (dx1 == -1) {
        dx1 = game.xstart - 1;
    }
    if (dy1 == -1) {
        dy1 = game.ystart - 1;
    }
    if (dx2 == -1) {
        dx2 = game.xstart + game.xsize + 1;
    }
    if (dy2 == -1) {
        dy2 = game.ystart + game.ysize + 1;
    }
    await get_location({ get value() { return dx1; }, set value(_v) { dx1 = _v; } }, { get value() { return dy1; }, set value(_v) { dy1 = _v; } }, 16, null);
    await get_location({ get value() { return dx2; }, set value(_v) { dx2 = _v; } }, { get value() { return dy2; }, set value(_v) { dy2 = _v; } }, 16, null);
    set_wall_property(dx1, dy1, dx2, dy2, wprop);
    return 0;
}
export function set_wallprop_in_selection(L, prop) {
    let argc = lua_gettop(L);
    let freesel = (0);
    let sel = null;
    create_des_coder();
    if (argc == 1) {
        sel = l_selection_check(L, -1);
    } else if (argc == 0) {
        freesel = (1);
        sel = selection_new();
        selection_clear(sel, 1);
    }
    if (sel) {
        selection_iterate(sel, sel_set_wall_property, prop);
        if (freesel) {
            selection_free(sel, (1));
        }
    }
}
/* non_diggable(selection); */
/* non_diggable(); */
export function lspo_non_diggable(L) {
    set_wallprop_in_selection(L, 8);
    return 0;
}
/* non_passwall(selection); */
/* non_passwall(); */
export function lspo_non_passwall(L) {
    set_wallprop_in_selection(L, 16);
    return 0;
}
/*ARGSUSED*/
/* TODO: wallify(selection) */
/* wallify({ x1=NN,y1=NN, x2=NN,y2=NN }); */
/* wallify(); */
export function lspo_wallify(L) {
    let dx1 = -1;
    let dy1 = -1;
    let dx2 = -1;
    let dy2 = -1;
    create_des_coder();
    if (lua_gettop(L) == 1) {
        dx1 = get_table_int(L, "x1");
        dy1 = get_table_int(L, "y1");
        dx2 = get_table_int(L, "x2");
        dy2 = get_table_int(L, "y2");
    }
    wallify_map(dx1 < 0 ? (game.xstart - 1) : dx1, dy1 < 0 ? (game.ystart - 1) : dy1, dx2 < 0 ? (game.xstart + game.xsize + 1) : dx2, dy2 < 0 ? (game.ystart + game.ysize + 1) : dy2);
    return 0;
}
/* reset_level is only needed for testing purposes */
export async function lspo_reset_level(L) {
    let wtower = await In_W_tower(game.u.ux, game.u.uy, game.u.uz);
    game.iflags.lua_testing = (1);
    if (L) {
        if (game.coder) {
            do {
                if (game.coder) {
                    free((game.coder));
                }
            } while (0);
            game.coder = null;
        }
        create_des_coder();
    }
    await makemap_prepost((1), wtower);
    game.in_mklev = (1);
    await oinit();
    await clear_level_structures();
    return 0;
}
/* finalize_level is only needed for testing purposes */
export async function lspo_finalize_level(L) {
    let wtower = await In_W_tower(game.u.ux, game.u.uy, game.u.uz);
    let i = 0;
    if (L) {
        create_des_coder();
    }
    link_doors_rooms();
    remove_boundary_syms();
    /* TODO: ensure_way_out() needs rewrite */
    if (L && game.coder.check_inaccessibles) {
        await ensure_way_out();
    }
    await map_cleanup();
    if (!game.level.flags.corrmaze) {
        await wallification(1, 0, 80 - 1, 21 - 1);
    }
    if (L) {
        await flip_level_rnd(game.coder.allow_flips, (0));
    }
    count_level_features();
    if (L && game.coder.solidify) {
        solidify_map();
    }
    await fixup_special();
    if (L && game.coder.premapped) {
        await premap_detect();
    }
    await level_finalize_topology();
    for (i = 0; i < game.nroom; ++i) {
        await fill_special_room(game.rooms[i]);
    }
    await makemap_prepost((0), wtower);
    game.iflags.lua_testing = (0);
    return 0;
}
/* map({ x = 10, y = 10, map = [[...]] }); */
/* map({ coord = {10, 10}, map = [[...]] }); */
/* map({ halign = "center", valign = "center", map = [[...]] }); */
/* map({ map = [[...]], contents = function(map) ... end }); */
/* map([[...]]) */
/* local selection = map( ... ); */
const __lspo_map_left_or_right = ["left", "half-left", "center", "half-right", "right", "none", null];
const __lspo_map_l_or_r2i = [1, 2, 3, 4, 5, -1, -1];
const __lspo_map_top_or_bot = ["top", "center", "bottom", "none", null];
const __lspo_map_t_or_b2i = [1, 3, 5, -1, -1];
export async function lspo_map(L) {
    let lr = 0;
    let tb = 0;
    let x = 0;
    let y = 0;
    let mf = null;
    let tmpstr = null;
    let argc = 0;
    let has_contents = 0;
    let tryct = 0;
    let ox = 0;
    let oy = 0;
    let lit = 0;
    let sel = null;
    redo_maploc: {
        /*
TODO: allow passing an array of strings as map data
TODO: handle if map lines aren't same length
TODO: gc.coder->croom needs to be updated
     */
        x = -1;
        y = -1;
        argc = lua_gettop(L);
        has_contents = (0);
        tryct = 0;
        lit = (0);
        create_des_coder();
        if (game.in_mk_themerooms && game.themeroom_failed) {
            return 0;
        }
        if (argc == 1 && lua_type(L, 1) == 4) {
            tmpstr = dupstr(luaL_checkstring(L, 1));
            lr = tb = 3;
            mf = mapfrag_fromstr(tmpstr);
            free(tmpstr);
        } else {
            lcheck_param_table(L);
            lr = __lspo_map_l_or_r2i[get_table_option(L, "halign", "none", __lspo_map_left_or_right)];
            tb = __lspo_map_t_or_b2i[get_table_option(L, "valign", "none", __lspo_map_top_or_bot)];
            get_table_xy_or_coord(L, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } });
            tmpstr = get_table_str(L, "map");
            lit = get_table_boolean_opt(L, "lit", (0));
            lua_getfield(L, 1, "contents");
            if (lua_type(L, -1) == 6) {
                lua_remove(L, -2);
                has_contents = (1);
            } else {
                lua_pop(L, 1);
            }
            mf = mapfrag_fromstr(tmpstr);
            free(tmpstr);
        }
        if (!mf) {
            nhl_error(L, "Map data error");
            return 0;
        }
        sel = selection_new();
        ox = x;
        oy = y;
    }
    __redo_maploc: for (;;) {
    game.xsize = mf.wid;
    skipmap: {
        game.ysize = mf.hei;
        if (lr == -1 && tb == -1) {
            if (game.in_mk_themerooms && (ox == -1 || oy == -1)) {
                if (ox == -1) {
                    if (game.coder.croom) {
                        x = somex(game.coder.croom) - mf.wid;
                        if (x < 1) {
                            x = 1;
                        }
                    } else {
                        x = 1 + rn2(80 - 1 - mf.wid);
                    }
                }
                if (oy == -1) {
                    if (game.coder.croom) {
                        y = somey(game.coder.croom) - mf.hei;
                        if (y < 1) {
                            y = 1;
                        }
                    } else {
                        y = rn2(21 - mf.hei);
                    }
                }
            }
            if (isok(x, y)) {
                if (game.coder.croom) {
                    /* x,y is given, place map starting at x,y */
                    /* in a room? adjust to room relative coords */
                    game.xstart = x + game.coder.croom.lx;
                    game.ystart = y + game.coder.croom.ly;
                    game.xsize = ((mf.wid) < ((game.coder.croom.hx - game.coder.croom.lx)) ? (mf.wid) : ((game.coder.croom.hx - game.coder.croom.lx)));
                    game.ysize = ((mf.hei) < ((game.coder.croom.hy - game.coder.croom.ly)) ? (mf.hei) : ((game.coder.croom.hy - game.coder.croom.ly)));
                } else {
                    game.xsize = mf.wid;
                    game.ysize = mf.hei;
                    game.xstart = x;
                    game.ystart = y;
                }
            } else {
                mapfrag_free({ get value() { return mf; }, set value(_v) { mf = _v; } });
                nhl_error(L, "Map requires either x,y or halign,valign params");
                selection_free(sel, (1));
                return 0;
            }
        } else {
            switch (lr) {
                case 1:
                    game.xstart = game.splev_init_present ? 1 : 3;
                    break;
                case 2:
                    game.xstart = 2 + (Math.trunc((game.x_maze_max - 2 - game.xsize) / 4));
                    break;
                case 3:
                    game.xstart = 2 + (Math.trunc((game.x_maze_max - 2 - game.xsize) / 2));
                    break;
                case 4:
                    game.xstart = 2 + (Math.trunc((game.x_maze_max - 2 - game.xsize) * 3 / 4));
                    break;
                case 5:
                    game.xstart = game.x_maze_max - game.xsize - 1;
                    break;
            }
            switch (tb) {
                case 1:
                    game.ystart = 3;
                    break;
                case 3:
                    game.ystart = 2 + (Math.trunc((game.y_maze_max - 2 - game.ysize) / 2));
                    break;
                case 5:
                    game.ystart = game.y_maze_max - game.ysize - 1;
                    break;
            }
            if (!(game.xstart % 2)) {
                game.xstart++;
            }
            if (!(game.ystart % 2)) {
                game.ystart++;
            }
        }
        if (game.ystart < 0 || game.ystart + game.ysize > 21) {
            if (game.in_mk_themerooms) {
                game.themeroom_failed = (1);
                break skipmap;
            }
            /* try to move the start a bit */
            game.ystart += (game.ystart > 0) ? -2 : 2;
            if (game.ysize == 21) {
                game.ystart = 0;
            }
            if (game.ystart < 0 || game.ystart + game.ysize > 21) {
                game.ystart = 0;
            }
        }
        if (game.xsize <= 1 && game.ysize <= 1) {
            reset_xystart_size();
        } else {
            let mptyp = 0;
            let terr = { ter: 0, tlit: 0 };
            if (game.in_mk_themerooms) {
                /* Themed rooms should never overwrite anything */
                let isokp = (1);
                for (y = game.ystart - 1; y < ((21) < (game.ystart + game.ysize) ? (21) : (game.ystart + game.ysize)) + 1; y++) {
                    for (x = game.xstart - 1; x < ((80) < (game.xstart + game.xsize) ? (80) : (game.xstart + game.xsize)) + 1; x++) {
                        if (!isok(x, y)) {
                            isokp = (0);
                        } else if (y < game.ystart || y >= (game.ystart + game.ysize) || x < game.xstart || x >= (game.xstart + game.xsize)) {
                            if (game.level.locations[x][y].typ != STONE || game.level.locations[x][y].roomno != 0) {
                                isokp = (0);
                            }
                        } else {
                            mptyp = await mapfrag_get(mf, x - game.xstart, y - game.ystart);
                            if (mptyp >= MAX_TYPE) {
                                /* TODO: warn about illegal map char */
                                continue;
                            }
                            if ((game.level.locations[x][y].typ != STONE && game.level.locations[x][y].typ != mptyp) || game.level.locations[x][y].roomno != 0) {
                                isokp = (0);
                            }
                        }
                        if (!isokp) {
                            if (tryct++ < 100 && (lr == -1 || tb == -1)) {
                                continue __redo_maploc;
                            }
                            game.themeroom_failed = (1);
                            break skipmap;
                        }
                    }
                }
            }
            for (y = game.ystart; y < ((21) < (game.ystart + game.ysize) ? (21) : (game.ystart + game.ysize)); y++) {
                for (x = game.xstart; x < ((80) < (game.xstart + game.xsize) ? (80) : (game.xstart + game.xsize)); x++) {
                    mptyp = await mapfrag_get(mf, (x - game.xstart), (y - game.ystart));
                    if (mptyp == INVALID_TYPE) {
                        continue;
                    }
                    if (mptyp >= MAX_TYPE) {
                        continue;
                    }
                    game.level.locations[x][y].flags = 0;
                    game.level.locations[x][y].horizontal = 0;
                    game.level.locations[x][y].roomno = 0;
                    game.level.locations[x][y].edge = 0;
                    /* clear out levl: load_common_data may set them */
                    game.SpLev_Map[x][y] = 1;
                    selection_setpoint(x, y, sel, 1);
                    terr.ter = mptyp;
                    terr.tlit = lit;
                    await sel_set_ter(x, y, terr);
                }
            }
        }
    }
    break;
    } /* __redo_maploc */
    mapfrag_free({ get value() { return mf; }, set value(_v) { mf = _v; } });
    if (game.in_mk_themerooms && game.themeroom_failed) {
        reset_xystart_size();
    } else if (has_contents) {
        l_push_wid_hei_table(L, game.xsize, game.ysize);
        await nhl_pcall_handle(L, 1, 0, "lspo_map", NHLpa_panic);
        reset_xystart_size();
    }
    /* return selection where map locations were put */
    l_selection_push_copy(L, sel);
    selection_free(sel, (1));
    return 1;
}
export function update_croom() {
    if (!game.coder) {
        return;
    }
    if (game.coder.n_subroom) {
        game.coder.croom = game.coder.tmproomlist[game.coder.n_subroom - 1];
    } else {
        game.coder.croom = null;
    }
}
export function sp_level_coder_init() {
    let tmpi = 0;
    let coder = alloc(1 /* sizeof(struct sp_coder) */);
    coder.premapped = (0);
    coder.solidify = (0);
    coder.check_inaccessibles = (0);
    /* allow flipping level horiz/vert */
    coder.allow_flips = 3;
    coder.croom = null;
    coder.n_subroom = 1;
    coder.lvl_is_joined = (0);
    coder.room_stack = 0;
    game.splev_init_present = (0);
    game.icedpools = (0);
    for (tmpi = 0; tmpi <= 5; tmpi++) {
        coder.tmproomlist[tmpi] = null;
        coder.failed_room[tmpi] = (0);
    }
    update_croom();
    for (tmpi = 0; tmpi < 10; tmpi++) {
        game.container_obj[tmpi] = null;
    }
    game.container_idx = 0;
    game.invent_carrying_monster = null;
    memset(game.SpLev_Map, 0, 1680 /* sizeof(char [80][21]) */);
    game.level.flags.is_maze_lev = 0;
    game.level.flags.temperature = In_hell(game.u.uz) ? 1 : 0;
    game.level.flags.rndmongen = 1;
    game.level.flags.deathdrops = 1;
    reset_xystart_size();
    return coder;
}
const nhl_functions = [{ name: "message", func: lspo_message }, { name: "monster", func: lspo_monster }, { name: "object", func: lspo_object }, { name: "level_flags", func: lspo_level_flags }, { name: "level_init", func: lspo_level_init }, { name: "engraving", func: lspo_engraving }, { name: "mineralize", func: lspo_mineralize }, { name: "door", func: lspo_door }, { name: "stair", func: lspo_stair }, { name: "ladder", func: lspo_ladder }, { name: "grave", func: lspo_grave }, { name: "altar", func: lspo_altar }, { name: "map", func: lspo_map }, { name: "feature", func: lspo_feature }, { name: "terrain", func: lspo_terrain }, { name: "replace_terrain", func: lspo_replace_terrain }, { name: "room", func: lspo_room }, { name: "corridor", func: lspo_corridor }, { name: "random_corridors", func: lspo_random_corridors }, { name: "gold", func: lspo_gold }, { name: "trap", func: lspo_trap }, { name: "mazewalk", func: lspo_mazewalk }, { name: "drawbridge", func: lspo_drawbridge }, { name: "region", func: lspo_region }, { name: "levregion", func: lspo_levregion }, { name: "exclusion", func: lspo_exclusion }, { name: "wallify", func: lspo_wallify }, { name: "wall_property", func: lspo_wall_property }, { name: "non_diggable", func: lspo_non_diggable }, { name: "non_passwall", func: lspo_non_passwall }, { name: "teleport_region", func: lspo_teleport_region }, { name: "reset_level", func: lspo_reset_level }, { name: "finalize_level", func: lspo_finalize_level }, { name: "gas_cloud", func: lspo_gas_cloud }, { name: null, func: null }];
/* TODO: { "branch", lspo_branch }, */
/* TODO: { "portal", lspo_portal }, */
/* TODO:

 - if des-file used MAZE_ID to start a level, the level needs
   des.level_flags("mazelevel")
 - expose gc.coder->croom or gx.xstart gy.ystart and gx.xsize gy.ysize to lua.
 - detect a "subroom" automatically.
 - new function get_mapchar(x,y) to return the mapchar on map
 - many params should accept their normal type (eg, int or bool), AND "random"
 - automatically add shuffle(array)
 - automatically add align = { "law", "neutral", "chaos" } and shuffle it.
   (remove from lua files)
 - grab the header comments from des-files and add them to the lua files

*/
export function l_register_des(L) {
    lua_newtable(L);
    luaL_setfuncs(L, nhl_functions, 0);
    lua_setglobal(L, "des");
}
export function create_des_coder() {
    if (!game.coder) {
        game.coder = sp_level_coder_init();
    }
}
/*
 * General loader
 */
export async function load_special(name) {
    let result = 0;
    let sbi = { flags: 0, memlimit: 0, steps: 0, perpcall: 0 };
    give_up: {
        result = (0);
        sbi = { flags: 2147483648, memlimit: 1 * 1024 * 1024, steps: 0, perpcall: 1 * 1024 * 1024 };
        create_des_coder();
        if (!await load_lua(name, sbi)) {
            break give_up;
        }
        link_doors_rooms();
        remove_boundary_syms();
        if (game.coder.check_inaccessibles) {
            await ensure_way_out();
        }
        await map_cleanup();
        if (!game.level.flags.corrmaze) {
            await wallification(1, 0, 80 - 1, 21 - 1);
        }
        await flip_level_rnd(game.coder.allow_flips, (0));
        count_level_features();
        if (game.coder.solidify) {
            solidify_map();
        }
        await fixup_special();
        if (game.coder.premapped) {
            await premap_detect();
        }
        result = (1);
    }
    do {
        if (game.coder) {
            free((game.coder));
        }
    } while (0);
    game.coder = null;
    return result;
}
/*sp_lev.c*/
/* in case any boulders are on liquid, delete them */
/* after wall_spines; flips seenv and wall joins */
/* 3.6.2: made iron bars eligible to be flagged nondiggable
           (checked by chewing(hack.c) and zap_over_floor(zap.c)) */
/* if we can't get a specific monster type (pm == 0) then the
           class has been genocided, so settle for a random monster */
/* If water-liking monster, first try is without DRY */
/* try to find a close place if someone else is already there */
/* if we didn't find a good spot
                           then mimic something else */
/* guard against someone accidentally specifying e.g. quest nemesis
             * with custom inventory that lacks Bell or quest artifact but
             * forgetting to flag them as receiving their default inventory */
/* KMH -- Create piles of gold properly */
/* corpsenm is "empty" if -1, random if -2, otherwise specific */
/* set_corpsenm() took care of egg hatch and corpse timers */
/* needs to be an existing title */
/* contents (of a container or monster's inventory) */
/*impossible("create_object: no container");*/
/* don't complain, the monster may be gone legally
                   (eg. unique demon already generated)
                   TODO: In the case of unique demon lords, they should
                   get their inventories even when they get generated
                   outside the des-file.  Maybe another data file that
                   determines what inventories monsters get by default?
                 */
/* ['otmp' remains on floor] */
/* uncreate a random artifact created in a container */
/* FIXME: it could be intentional rather than random */
/* Named random statues are of player types, and aren't stone-
         * resistant (if they were, we'd have to reset the name as well as
         * setting corpsenm).
         */
/* makemon without rndmonst() might create a group */
/* check for existing features */
/* Is it a shrine  or sanctum? */
/*makecorridors(c->src.door);*/
/* Safety railings - if there's ever a case where des.corridor() needs
     * to be called with src/destwall="random", that logic first needs to be
     * implemented in search_door. */
/* First recurse into subrooms. We don't want to block an ordinary room
     * with a special subroom from having the subroom filled, or an unfilled
     * outer room preventing a special subroom from being filled. */
/* failed to create parent room, so fail this too */
/* note: 'txt' might be Null */
/* clouds cannot have engravings */
/*selection_iterate(sel, sel_set_door, (genericptr_t) &typ);*/
/* generate one of the escape items */
/* assign level dependent obj probabilities */
/* FIXME: Ideally, we want this call to only cover areas of the map
     * which were not inserted directly by the special level file (see
     * the insect legs on Baalzebub's level, for instance). Since that
     * is currently not possible, we overload the corrmaze flag for this
     * purpose.
     */
/* This must be done before premap_detect(),
     * otherwise branch stairs won't be premapped. */
