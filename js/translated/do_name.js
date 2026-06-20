/* NetHack 5.0	do_name.c	$NHDT-Date: 1737013431 2025/01/15 23:43:51 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.326 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Pasi Kallinen, 2018. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, pline, verbalize } from '../c2js-runtime/pline.js';
import { get_rnd_text } from '../c2js-runtime/rumors.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcmp, strcpy, strlen, strncmp, strncmpi, strncpy, strstri } from '../c2js-runtime/string.js';
import { beautiful } from './apply.js';
import { artifact_exists, artifact_name, exist_artifact, restrict_name, set_artifact_intrinsic, undiscovered_artifact } from './artifact.js';
import { rank_of } from './botl.js';
import { cmdq_clear, cmdq_pop, isok } from './cmd.js';
import { c_obj_colors, cg } from './decl.js';
import { canseemon, flush_screen, glyph_at, nul_glyphinfo, see_with_infrared, sensemon } from './display.js';
import { donamelevel, on_level } from './dungeon.js';
import { wipeout_text } from './engrave.js';
import { getpos } from './getpos.js';
import { dist2, fuzzymatch, highc, lcase, mungspaces, s_suffix, upstart } from './hacklib.js';
import { carrying, getobj, update_inventory } from './invent.js';
import { newmextra } from './makemon.js';
import { dealloc_obj, newoextra } from './mkobj.js';
import { pronoun_gender } from './mondata.js';
import { AMULET_CLASS, AMULET_OF_YENDOR, ARMOR_CLASS, ART_EYES_OF_THE_OVERWORLD, BLINDED, CMDQ_KEY, COIN_CLASS, CORPSE, CQ_CANNED, DEAF, FAKE_AMULET_OF_YENDOR, FEMALE, FIGURINE, FIRST_OBJECT, FOOD_CLASS, GEM_CLASS, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_SUGGEST, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_SWALLOW_OFF, HALLUC, HALLUC_RES, HAND, HEAVY_IRON_BALL, LOW_PM, MALE, MS_ANIMAL, M_AP_FURNITURE, M_AP_MONSTER, M_AP_OBJECT, NEUTRAL, NON_PM, NUMMONS, NUM_MGENDERS, NUM_OBJECTS, PM_ALIGNED_CLERIC, PM_ARCHEOLOGIST, PM_CLERIC, PM_DEATH, PM_FAMINE, PM_GHOST, PM_HIGH_CLERIC, PM_JUIBLEX, PM_LONG_WORM, PM_LONG_WORM_TAIL, PM_PESTILENCE, PM_SHOPKEEPER, PM_WIZARD, PM_WIZARD_OF_YENDOR, POTION_CLASS, RING_CLASS, SCROLL_CLASS, SEE_INVIS, SPBOOK_CLASS, SPECIAL_PM, SPE_NOVEL, STATUE, STRANGE_OBJECT, TIN, TOOL_CLASS, TOWEL, VENOM_CLASS, WAND_CLASS, WEAPON_CLASS } from './nh-constants.js';
import { discover_object, rename_disco, undiscover_object } from './o_init.js';
import { The, Ysimple_name2, an, ansimpleoname, bare_artifactname, just_an, makeplural, safe_qbuf, simpleonames, vtense, xname } from './objnam.js';
import { nh_getenv } from './options.js';
import { object_from_map } from './pager.js';
import { There, livelog_printf } from './pline.js';
import { body_part } from './polyself.js';
import { priestname } from './priest.js';
import { rn2, rn2_on_display_rng, rnd_on_display_rng } from './rnd.js';
import { genders } from './role.js';
import { alter_cost } from './shk.js';
import { shkname } from './shknam.js';
import { untwoweapon } from './wield.js';
import { add_menu, getlin, select_menu } from './windows.js';

/* manage a pool of BUFSZ buffers, so callers don't have to */
let __nextmbuf_bufs = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
__nh_register_static(() => { __nextmbuf_bufs = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]; });
let __nextmbuf_bufidx = 0;
__nh_register_static(() => { __nextmbuf_bufidx = 0; });
export function nextmbuf() {
    __nextmbuf_bufidx = (__nextmbuf_bufidx + 1) % 5;
    return __nextmbuf_bufs[__nextmbuf_bufidx];
}
/* allocate space for a monster's name; removes old name if there is one */
/* desired length (caller handles adding 1 for terminator) */
export function new_mgivenname(mon, lth) {
    if (lth) {
        if (!mon.mextra) {
            mon.mextra = newmextra();
        /* allocate mextra if necessary; otherwise get rid of old name */
        /* has mextra, might also have name */
        } else {
            free_mgivenname(mon);
        }
        ((mon).mextra.mgivenname) = alloc(lth);
    } else {
        /* zero length: the new name is empty; get rid of the old name */
        if (((mon).mextra && ((mon).mextra.mgivenname))) {
            free_mgivenname(mon);
        }
    }
}
/* release a monster's name; retains mextra even if all fields are now null */
export function free_mgivenname(mon) {
    if (((mon).mextra && ((mon).mextra.mgivenname))) {
        free(((mon).mextra.mgivenname));
        ((mon).mextra.mgivenname) = null;
    }
}
/* allocate space for an object's name; removes old name if there is one */
/* desired length (caller handles adding 1 for terminator) */
export function new_oname(obj, lth) {
    if (lth) {
        if (!obj.oextra) {
            obj.oextra = newoextra();
        /* allocate oextra if necessary; otherwise get rid of old name */
        /* already has oextra, might also have name */
        } else {
            free_oname(obj);
        }
        ((obj).oextra.oname) = alloc(lth);
    } else {
        if (((obj).oextra && ((obj).oextra.oname))) {
            free_oname(obj);
        }
    }
}
/* release an object's name; retains oextra even if all fields are now null */
export function free_oname(obj) {
    if (((obj).oextra && ((obj).oextra.oname))) {
        free(((obj).oextra.oname));
        ((obj).oextra.oname) = null;
    }
}
/*  safe_oname() always returns a valid pointer to
 *  a string, either the pointer to an object's name
 *  if it has one, or a pointer to an empty string
 *  if it doesn't.
 */
export function safe_oname(obj) {
    if (((obj).oextra && ((obj).oextra.oname))) {
        return ((obj).oextra.oname);
    }
    return "";
}
/* get a name for a monster or an object from player;
   truncate if longer than PL_PSIZ, then return it */
/* output buffer, assumed to be at least BUFSZ long;
                         * anything longer than PL_PSIZ will be truncated */
/* only used if EDIT_GETLIN is enabled; only useful
                         * if windowport xxx's xxx_getlin() supports that */
export async function name_from_player(outbuf, prompt, defres) {
    outbuf = __nh_char_write(outbuf, 0, 0);
    ((defres));
    outbuf = await getlin(prompt, outbuf);
    if (!__nh_char_at0(outbuf) || __nh_char_at0(outbuf) == 27) {
        return null;
    }
    /* strip leading and trailing spaces, condense internal sequences */
    outbuf = mungspaces(outbuf);
    if (strlen(outbuf) >= 63) {
        outbuf = __nh_char_write(outbuf, 63 - 1, 0);
    }
    return outbuf;
}
/* historical note: this returns a monster pointer because it used to
   allocate a new bigger block of memory to hold the monster and its name */
export function christen_monst(mtmp, name) {
    let lth = 0;
    let buf = '';
    /* dogname & catname are PL_PSIZ arrays; object names have same limit */
    lth = (name && __nh_char_at0(name)) ? (strlen(name) + 1) : 0;
    if (lth > 63) {
        lth = 63;
        name = strncpy(buf, name, 63 - 1);
        buf = __nh_char_write(buf, 63 - 1, 0);
    }
    /* removes old name if one is present */
    new_mgivenname(mtmp, lth);
    if (lth) {
        (mtmp).mextra.mgivenname = strcpy(((mtmp).mextra.mgivenname), name);
    }
    /* if 'mtmp' is leashed, persistent inventory window needs updating */
    if (mtmp.mleashed) {
        update_inventory();
    }
    /* x - leash (attached to Fido) */
    return mtmp;
}
/* check whether user-supplied name matches or nearly matches an unnameable
   monster's name, or is an attempt to delete the monster's name; if so, give
   alternate reject message for do_mgivenname() */
export async function alreadynamed(mtmp, monnambuf, usrbuf) {
    let pronounbuf = '';
    let p = null;
    if (!__nh_char_at0(usrbuf)) {
        /* attempt to erase existing name */
        let name_not_title = (((mtmp).mextra && ((mtmp).mextra.mgivenname)) || (((mtmp.data).mflags2 & 524288) != 0) || mtmp.isshk);
        await pline("%s would rather keep %s existing %s.", upstart(monnambuf), ((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE]) ? "its" : (genders[pronoun_gender(mtmp, 2)].his), name_not_title ? "name" : "title");
        return (1);
    } else if (fuzzymatch(usrbuf, monnambuf, " -_", (1)) || (!strncmpi(monnambuf, "the ", 4) && fuzzymatch(usrbuf, __nh_advance_str(monnambuf, 4), " -_", (1))) || ((p = strstri(monnambuf, "invisible ")) != null && fuzzymatch(usrbuf, __nh_advance_str(p, 10), " -_", (1))) || ((p = strstri(monnambuf, " of ")) != null && fuzzymatch(usrbuf, __nh_advance_str(p, 4), " -_", (1)))) {
        if (((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE])) {
            await pline("%s is already called that.", upstart(monnambuf));
        } else {
            await pline("%s is already called %s.", upstart(strcpy(pronounbuf, (genders[pronoun_gender(mtmp, 2)].he))), monnambuf);
        }
        return (1);
    } else if (mtmp.data == game.mons[PM_JUIBLEX] && strstri(monnambuf, "Juiblex") && !strncmpi((usrbuf), ("Jubilex"), -1)) {
        await pline("%s doesn't like being called %s.", upstart(monnambuf), usrbuf);
        return (1);
    }
    return (0);
}
/* allow player to assign a name to some chosen monster */
export async function do_mgivenname() {
    let buf = '';
    let monnambuf = '';
    let qbuf = '';
    let cc = { x: 0, y: 0 };
    let cx = 0;
    let cy = 0;
    let mtmp = null;
    let do_swallow = (0);
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        await You("would never recognize it anyway.");
        return;
    }
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    if (await getpos(cc, (0), "the monster you want to name") < 0 || !isok(cc.x, cc.y)) {
        return;
    }
    cx = cc.x , cy = cc.y;
    if (((cx) == game.u.ux && (cy) == game.u.uy)) {
        if (game.u.usteed && (canseemon(game.u.usteed) || sensemon(game.u.usteed))) {
            mtmp = game.u.usteed;
        } else {
            await pline("This %s creature is called %s and cannot be renamed.", beautiful(), game.plname);
            return;
        }
    } else {
        mtmp = (game.level.monsters[cx][cy]);
    }
    if (!mtmp && game.u.uswallow) {
        /* Allow you to name the monster that has swallowed you */
        let glyph = glyph_at(cx, cy);
        if (((glyph) >= GLYPH_SWALLOW_OFF && (glyph) < (((NUMMONS << 3) + GLYPH_SWALLOW_OFF)))) {
            mtmp = game.u.ustuck;
            do_swallow = (1);
        }
    }
    if (!do_swallow && (!mtmp || (!sensemon(mtmp) && (!(((game.viz_array[cy][cx] & 2) != 0) || see_with_infrared(mtmp)) || mtmp.mundetected || ((mtmp).m_ap_type & 7) == M_AP_FURNITURE || ((mtmp).m_ap_type & 7) == M_AP_OBJECT || (mtmp.minvis && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)))))) {
        await pline("I see no monster there.");
        return;
    }
    qbuf = sprintf(qbuf, "What do you want to call %s?", await distant_monnam(mtmp, 1, monnambuf));
    if (!await name_from_player(buf, qbuf, ((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? ((mtmp).mextra.mgivenname) : null)) {
        return;
    }
    if ((mtmp.data.geno & 4096) && !mtmp.ispriest) {
        if (!await alreadynamed(mtmp, monnambuf, buf)) {
            await pline("%s doesn't like being called names!", upstart(monnambuf));
        }
    } else if (mtmp.isshk && !((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) || ((mtmp).msleeping || !(mtmp).mcanmove) || mtmp.data.msound <= MS_ANIMAL)) {
        if (!await alreadynamed(mtmp, monnambuf, buf)) {
            ;
            await verbalize("I'm %s, not %s.", await shkname(mtmp), buf);
        }
    } else if (mtmp.ispriest || mtmp.isminion || mtmp.isshk || mtmp.data == game.mons[PM_GHOST] || ((mtmp).mextra && ((mtmp).mextra.ebones))) {
        if (!await alreadynamed(mtmp, monnambuf, buf)) {
            await pline("%s will not accept the name %s.", upstart(monnambuf), buf);
        }
    } else {
        christen_monst(mtmp, buf);
    }
}
/*
 * This routine used to change the address of 'obj' so be unsafe if not
 * used with extreme care.  Applying a name to an object no longer
 * allocates a replacement object, so that old risk is gone.
 */
export async function do_oname(obj) {
    let bufp = null;
    let buf = '';
    let bufcpy = '';
    let qbuf = '';
    let aname = null;
    let objtyp = STRANGE_OBJECT;
    if (obj.otyp == SPE_NOVEL) {
        await pline("%s already has a published name.", await Ysimple_name2(obj));
        return;
    }
    qbuf = sprintf(qbuf, "What do you want to name %s ", ((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "these" : "this");
    await safe_qbuf(qbuf, qbuf, "?", obj, xname, simpleonames, "item");
    if (!await name_from_player(buf, qbuf, safe_oname(obj))) {
        return;
    }
    if (obj.oartifact) {
        await pline("%s resists the attempt.", ((obj).oextra && ((obj).oextra.oname)) ? ((obj).oextra.oname) : "The artifact");
        return;
    }
    if ((aname = artifact_name(buf, { get value() { return objtyp; }, set value(_v) { objtyp = _v; } }, (1))) != null && (restrict_name(obj, aname) || exist_artifact(obj.otyp, aname))) {
        buf = strcpy(buf, aname);
        bufcpy = strcpy(bufcpy, buf);
        /* any artifact should always pass the has_oname() test
                 but be careful just in case */
        /* relax restrictions over proper capitalization for artifacts */
        /* substitute canonical spelling before slippage */
        /* this used to change one letter, substituting a value
           of 'a' through 'y' (due to an off by one error, 'z'
           would never be selected) and then force that to
           upper case if such was the case of the input;
           now, the hand slip scuffs one or two letters as if
           the text had been trodden upon, sometimes picking
           punctuation instead of an arbitrary letter;
           unfortunately, we have to cover the possibility of
           it targeting spaces so failing to make any change
           (we know that it must eventually target a nonspace
           because buf[] matches a valid artifact name) */
        /* for "the Foo of Bar", only scuff "Foo of Bar" part */
        bufp = !strncmpi(buf, "the ", 4) ? (buf + 4) : buf;
        do {
            wipeout_text(bufp, rnd_on_display_rng(2), 0);
        } while (!strcmp(buf, bufcpy));
        await pline("While engraving, your %s slips.", await body_part(HAND));
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        await You("engrave: \"%s\".", buf);
        /* violate illiteracy conduct since hero attempted to write
           a valid artifact name */
        game.u.uconduct.literate++;
    } else if (obj.otyp == objtyp) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        buf = strcpy(buf, aname);
    }
    obj = await oname(obj, buf, 2 | 256);
    ((obj));
}
/* item to assign name to */
/* name to assign */
/* flags, mostly for artifact creation */
export async function oname(obj, name, oflgs) {
    let lth = 0;
    let buf = '';
    let via_naming = (oflgs & 2) != 0;
    let skip_inv_update = (oflgs & 512) != 0;
    lth = __nh_char_at0(name) ? (strlen(name) + 1) : 0;
    if (lth > 63) {
        lth = 63;
        name = strncpy(buf, name, 63 - 1);
        buf = __nh_char_write(buf, 63 - 1, 0);
    }
    /* If named artifact exists in the game, do not create another.
       Also trying to create an artifact shouldn't de-artifact
       it (e.g. Excalibur from prayer). In this case the object
       will retain its current name. */
    if (obj.oartifact || (lth && exist_artifact(obj.otyp, name))) {
        return obj;
    }
    new_oname(obj, lth);
    if (lth) {
        (obj).oextra.oname = strcpy(((obj).oextra.oname), name);
    }
    if (lth) {
        await artifact_exists(obj, name, (1), oflgs);
    }
    if (obj.oartifact) {
        if (obj == game.uswapwep) {
            await untwoweapon();
        }
        if (obj == game.uwep) {
            await set_artifact_intrinsic(obj, (1), 256);
        }
        if (obj.unpaid) {
            await alter_cost(obj, 0);
        }
        if (via_naming) {
            if (!game.u.uconduct.literate++) {
                livelog_printf(32 | 64, "became literate by naming %s", await bare_artifactname(obj));
            } else {
                livelog_printf(64, "chose %s to be named \"%s\"", await ansimpleoname(obj), await bare_artifactname(obj));
            }
        }
    }
    if (((obj).where == 3) && !skip_inv_update) {
        update_inventory();
    }
    return obj;
}
export function objtyp_is_callable(i) {
    if (game.objects[i].oc_uname) {
        return (1);
    }
    switch (game.objects[i].oc_class) {
        case AMULET_CLASS:
            if (i == AMULET_OF_YENDOR || i == FAKE_AMULET_OF_YENDOR) {
                /* copy "a " or "an " into buf2[] */
                break;
            }
            ;
        case SCROLL_CLASS:
        case POTION_CLASS:
        case WAND_CLASS:
        case RING_CLASS:
        case GEM_CLASS:
        case SPBOOK_CLASS:
        case ARMOR_CLASS:
        case TOOL_CLASS:
        case VENOM_CLASS:
            if ((game.obj_descr[(game.objects[i]).oc_descr_idx].oc_descr)) {
                return (1);
            }
            break;
        default:
            break;
    }
    return (0);
}
/* getobj callback for object to name (specific item) - anything but gold */
export function name_ok(obj) {
    if (!obj || obj.oclass == COIN_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    if (!obj.dknown || obj.oartifact || obj.otyp == SPE_NOVEL) {
        return GETOBJ_DOWNPLAY;
    }
    return GETOBJ_SUGGEST;
}
/* getobj callback for object to call (name its type) */
export function call_ok(obj) {
    if (!obj || !objtyp_is_callable(obj.otyp)) {
        return GETOBJ_EXCLUDE;
    }
    /* not a likely candidate if not seen yet since naming will fail,
       or if it has been discovered and doesn't already have a name;
       when something has been named and then becomes discovered, it
       remains a likely candidate until player renames it to <space>
       to remove that no longer needed name */
    if (!obj.dknown || (game.objects[obj.otyp].oc_name_known && !game.objects[obj.otyp].oc_uname)) {
        return GETOBJ_DOWNPLAY;
    }
    return GETOBJ_SUGGEST;
}
/* #call / #name command - player can name monster or object or type of obj */
export async function docallcmd() {
    let obj = null;
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let pick_list = null;
    let cq = { typ: 0, key: 0, dirx: 0, diry: 0, dirz: 0, intval: 0, ec_entry: null, next: null };
    let cmdq = null;
    let ch = 0;
    let abc = 0;
    let clr = 0;
    docallcmd: {
        pick_list = null;
        ch = 0;
        /* if player wants a,b,c instead of i,o when looting, do that here too */
        abc = game.flags.lootabc;
        clr = 8;
        if ((cmdq = cmdq_pop()) != null) {
            Object.assign(cq, cmdq);
            free(cmdq);
            if (cq.typ == CMDQ_KEY) {
                ch = cq.key;
            } else {
                cmdq_clear(CQ_CANNED);
            }
            break docallcmd;
        }
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        Object.assign(any, cg.zeroany);
        any.a_char = 109;
        await add_menu(win, nul_glyphinfo, any, abc ? 0 : any.a_char, 67, 0, clr, "a monster", 0);
        if (game.invent) {
            /* we use y and n as accelerators so that we can accept user's
           response keyed to old "name an individual object?" prompt */
            any.a_char = 105;
            await add_menu(win, nul_glyphinfo, any, abc ? 0 : any.a_char, 121, 0, clr, "a particular object in inventory", 0);
            any.a_char = 111;
            await add_menu(win, nul_glyphinfo, any, abc ? 0 : any.a_char, 110, 0, clr, "the type of an object in inventory", 0);
        }
        /* group accelerator ',' (or ':' instead?) */
        any.a_char = 102;
        await add_menu(win, nul_glyphinfo, any, abc ? 0 : any.a_char, 44, 0, clr, "the type of an object upon the floor", 0);
        any.a_char = 100;
        await add_menu(win, nul_glyphinfo, any, abc ? 0 : any.a_char, 92, 0, clr, "the type of an object on discoveries list", 0);
        any.a_char = 97;
        await add_menu(win, nul_glyphinfo, any, abc ? 0 : any.a_char, 108, 0, clr, "record an annotation for the current level", 0);
        (game.windowprocs.win_end_menu)(win, "What do you want to name?");
        let __dn_n; { const __selbox = { value: null }; __dn_n = await select_menu(win, 1, __selbox); pick_list = __selbox.value; }
        if (__dn_n > 0) {
            ch = pick_list[0].item.a_char;
            free(pick_list);
        } else {
            ch = 113;
        }
        (game.windowprocs.win_destroy_nhwindow)(win);
    }
    switch (ch) {
        default:
        case 113:
            break;
        case 109:
            await do_mgivenname();
            break;
        /* name an individual object in inventory */
        case 105:
            obj = await getobj("name", name_ok, 2);
            if (obj) {
                await do_oname(obj);
            }
            break;
        /* name a type of object in inventory */
        case 111:
            obj = await getobj("call", call_ok, 0);
            if (obj) {
                await xname(obj);
                if (!obj.dknown) {
                    await You("would never recognize another one.");
                } else {
                    await docall(obj);
                }
            }
            break;
        /* name a type of object visible on the floor */
        case 102:
            await namefloorobj();
            break;
        /* name a type of object on the discoveries list */
        case 100:
            await rename_disco();
            break;
        case 97:
            await donamelevel();
            break;
    }
    return 0;
}
/* for use by safe_qbuf() */
export async function docall_xname(obj) {
    let otemp = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    Object.assign(otemp, obj);
    otemp.oextra = null;
    otemp.quan = 1;
    /* in case water is already known, convert "[un]holy water" to "water" */
    otemp.blessed = otemp.cursed = 0;
    /* remove attributes that are doname() caliber but get formatted
       by xname(); most of these fixups aren't really needed because the
       relevant type of object isn't callable so won't reach this far */
    if (otemp.oclass == WEAPON_CLASS) {
        otemp.otrapped = 0;
    } else if (otemp.oclass == POTION_CLASS) {
        otemp.oeroded = 0;
    } else if (otemp.otyp == TOWEL || otemp.otyp == STATUE) {
        otemp.spe = 0;
    } else if (otemp.otyp == TIN) {
        otemp.known = 0;
    } else if (otemp.otyp == FIGURINE) {
        otemp.corpsenm = NON_PM;
    } else if (otemp.otyp == HEAVY_IRON_BALL) {
        otemp.owt = game.objects[HEAVY_IRON_BALL].oc_weight;
    } else if (otemp.oclass == FOOD_CLASS && otemp.globby) {
        otemp.owt = 120;
    }
    return await an(await xname(otemp));
}
export async function docall(obj) {
    let buf = '';
    let qbuf = '';
    let uname_p = null;
    let had_name = (0);
    if (!obj.dknown) {
        return;
    }
    await flush_screen(1);
    if (obj.oclass == POTION_CLASS && obj.corpsenm) {
        qbuf = sprintf(qbuf, "Call a stream of %s fluid:", (game.obj_descr[(game.objects[obj.otyp]).oc_descr_idx].oc_descr));
    } else {
        await safe_qbuf(qbuf, "Call ", ":", obj, docall_xname, simpleonames, "thing");
    }
    uname_p = (game.objects[obj.otyp].oc_uname);
    if (!await name_from_player(buf, qbuf, uname_p)) {
        return;
    }
    if (uname_p) {
        /* fromsink: kludge, meaning it's sink water */
        had_name = (1);
        free(uname_p); /* §23.232u oc_uname — null-clear via direct slot */
        game.objects[obj.otyp].oc_uname = null;
    }
    /* strip leading and trailing spaces; uncalls item if all spaces */
    buf = mungspaces(buf);
    if (!buf) {
        if (had_name) {
            await undiscover_object(obj.otyp);
        }
    } else {
        /* §23.232u oc_uname — set via direct slot from buf */
        const __bufStr = (typeof buf === 'string') ? buf
            : (Array.isArray(buf) ? ((() => { let r=''; for (let i=0; i<buf.length && buf[i]; i++) r += String.fromCharCode(buf[i]); return r; })()) : String(buf));
        game.objects[obj.otyp].oc_uname = __bufStr;
        await discover_object(obj.otyp, (0), (1), (1));
    }
    if (obj.where == 3 || carrying(obj.otyp)) {
        update_inventory();
    }
}
export async function namefloorobj() {
    let cc = { x: 0, y: 0 };
    let glyph = 0;
    let buf = '';
    let obj = null;
    let fakeobj = (0);
    let use_plural = 0;
    cc.x = game.u.ux , cc.y = game.u.uy;
    buf = sprintf(buf, "object on map (or '.' for one %s you)", (game.u.uundetected && (((game.youmonst.data).mflags1 & 128) != 0)) ? "over" : "under");
    if (await getpos(cc, (0), buf) < 0 || cc.x <= 0) {
        return;
    }
    if (((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
        /* "dot for under/over you" only makes sense when the cursor hasn't
       been moved off the hero's '@' yet, but there's no way to adjust
       the help text once getpos() has started */
        obj = (game.level.objects[game.u.ux][game.u.uy]);
    } else {
        glyph = glyph_at(cc.x, cc.y);
        if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
            fakeobj = await object_from_map(glyph, cc.x, cc.y, { get value() { return obj; }, set value(_v) { obj = _v; } });
        }
    }
    if (!obj) {
        await There("doesn't seem to be any object %s.", ((cc.x) == game.u.ux && (cc.y) == game.u.uy) ? "under you" : "there");
        return;
    }
    buf = strcpy(buf, (obj.otyp != STRANGE_OBJECT) ? await simpleonames(obj) : game.obj_descr[STRANGE_OBJECT].oc_name);
    use_plural = (obj.quan > 1);
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        /* note well: 'obj' might be an instance of STRANGE_OBJECT if target
       is a mimic; passing that to xname (directly or via simpleonames)
       would yield "glorkum" so we need to handle it explicitly; it will
       always fail the Hallucination test and pass the !callable test,
       resulting in the "can't be assigned a type name" message */
        let unames = [null, null, null, null, null, null];
        let tmpbuf = '';
        unames[0] = (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) && game.urole.name.f) ? game.urole.name.f : game.urole.name.m;
        /* random rank title for hero's role

           note: the 30 is hardcoded in xlev_to_rank, so should be
           hardcoded here too */
        unames[1] = rank_of(rn2_on_display_rng(30) + 1, (game.urole.mnum), game.flags.female);
        unames[2] = await bogusmon(tmpbuf, null);
        /* increased chance for fake monster */
        unames[3] = unames[2];
        unames[4] = roguename();
        unames[5] = "Wibbly Wobbly";
        await pline("%s %s to call you \"%s.\"", await The(buf), use_plural ? "decide" : "decides", unames[rn2_on_display_rng((Math.trunc(48 /* sizeof(const char *[6]) */ / 8 /* sizeof(const char *) */)))]);
    } else if (call_ok(obj) == GETOBJ_EXCLUDE) {
        await pline("%s %s can't be assigned a type name.", use_plural ? "Those" : "That", buf);
    } else if (!obj.dknown) {
        await You("don't know %s %s well enough to name %s.", use_plural ? "those" : "that", buf, use_plural ? "them" : "it");
    } else {
        await docall(obj);
    }
    if (fakeobj) {
        /* object_from_map() sets it to OBJ_FLOOR */
        obj.where = 0;
        await dealloc_obj(obj);
    }
}
const ghostnames = ["Adri", "Andries", "Andreas", "Bert", "David", "Dirk", "Emile", "Frans", "Fred", "Greg", "Hether", "Jay", "John", "Jon", "Karnov", "Kay", "Kenny", "Kevin", "Maud", "Michiel", "Mike", "Peter", "Robert", "Ron", "Tom", "Wilmar", "Nick Danger", "Phoenix", "Jiro", "Mizue", "Stephan", "Lance Braccus", "Shadowhawk", "Murphy"];
/* these names should have length < PL_NSIZ */
/* Capitalize the names for aesthetics -dgk */
/* ghost names formerly set by x_monnam(), now by makemon() instead */
export function rndghostname() {
    return rn2(7) ? ghostnames[rn2((Math.trunc(34 /* sizeof(const char *const [34]) */ / 1 /* sizeof(const char *const) */)))] : game.plname;
}
/*
 * Monster naming functions:
 * x_monnam is the generic monster-naming function.
 *                seen        unseen       detected               named
 * mon_nam:     the newt        it      the invisible orc       Fido
 * noit_mon_nam:your newt (as if detected) your invisible orc   Fido
 * some_mon_nam:the newt    someone     the invisible orc       Fido
 *          or              something
 * l_monnam:    newt            it      invisible orc           dog called Fido
 * Monnam:      The newt        It      The invisible orc       Fido
 * noit_Monnam: Your newt (as if detected) Your invisible orc   Fido
 * Some_Monnam: The newt    Someone     The invisible orc       Fido
 *          or              Something
 * Adjmonnam:   The poor newt   It      The poor invisible orc  The poor Fido
 * Amonnam:     A newt          It      An invisible orc        Fido
 * a_monnam:    a newt          it      an invisible orc        Fido
 * m_monnam:    newt            xan     orc                     Fido
 * y_monnam:    your newt     your xan  your invisible orc      Fido
 * YMonnam:     Your newt     Your xan  Your invisible orc      Fido
 * noname_monnam(mon,article):
 *              article newt    art xan art invisible orc       art dog
 */
/*
 * article
 *
 * ARTICLE_NONE, ARTICLE_THE, ARTICLE_A: obvious
 * ARTICLE_YOUR: "your" on pets, "the" on everything else
 *
 * If the monster would be referred to as "it" or if the monster has a name
 * _and_ there is no adjective, "invisible", "saddled", etc., override this
 * and always use no article.
 *
 * suppress
 *
 * SUPPRESS_IT, SUPPRESS_INVISIBLE, SUPPRESS_HALLUCINATION, SUPPRESS_SADDLE.
 * SUPPRESS_MAPPEARANCE: if monster is mimicking another monster (cloned
 *              Wizard or quickmimic pet), describe the real monster rather
 *              than its current form;
 * EXACT_NAME: combination of all the above
 * SUPPRESS_NAME: omit monster's assigned name (unless uniq w/ pname).
 * AUGMENT_IT: not suppression but shares suppression bitmask; if result
 *              would have been "it", return "someone" if humanoid or
 *              "something" otherwise.
 *
 * Bug: if the monster is a priest or shopkeeper, not every one of these
 * options works, since those are special cases.
 */
export async function x_monnam(mtmp, article, adjective, suppress, called) {
    let buf = nextmbuf();
    let mdat = mtmp.data;
    let pm_name = null;
    let do_hallu = 0;
    let do_invis = 0;
    let do_it = 0;
    let do_saddle = 0;
    let do_mappear = 0;
    let do_exact = 0;
    let do_name = 0;
    let augment_it = 0;
    let name_at_start = 0;
    let has_adjectives = 0;
    let insertbuf2 = 0;
    let mappear_as_mon = (((mtmp).m_ap_type & 7) == M_AP_MONSTER);
    let bp = null;
    let buf2 = '';
    if (mtmp == game.youmonst) {
        return strcpy(buf, "you");
    }
    /* ignore article, "invisible", &c */
    if (game.program_state.gameover) {
        suppress |= 4;
    }
    if (article == 3 && !mtmp.mtame) {
        /*
         * This monster has become important, for the moment anyway.
         * As the hero's consumer, it is worthy of ARTICLE_THE.
         * Also, suppress invisible as that particular characteristic
         * is unimportant now and you can see its interior anyway.
         */
        article = 1;
    }
    if (game.u.uswallow && mtmp == game.u.ustuck) {
        article = 1;
        suppress |= 2;
    }
    do_hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !(suppress & 4);
    do_invis = mtmp.minvis && !(suppress & 2);
    do_it = !(canseemon(mtmp) || sensemon(mtmp)) && article != 3 && !game.program_state.gameover && mtmp != game.u.usteed && !(game.u.uswallow && (game.u.ustuck == (mtmp))) && !(suppress & 1);
    do_saddle = !(suppress & 8);
    do_mappear = mappear_as_mon && !(suppress & 16);
    do_exact = (suppress & 31) == 31;
    do_name = !(suppress & 32) || (((mdat).mflags2 & 524288) != 0);
    augment_it = (suppress & 64) != 0;
    buf = __nh_char_write(buf, 0, 0);
    if (do_it) {
        /* unseen monsters, etc.; usually "it" but sometimes more specific;
       when hallucinating, the more specific values might be inverted */
        /* !is_animal excludes all Y; !mindless excludes Z, M, \' */
        let s_one = (((mdat).mflags1 & 131072) != 0) && !(((mdat).mflags1 & 262144) != 0) && !(((mdat).mflags1 & 65536) != 0);
        buf = strcpy(buf, !augment_it ? "it" : (!do_hallu ? s_one : !rn2(2)) ? "someone" : "something");
        return buf;
    }
    if ((mtmp.ispriest || mtmp.isminion) && !do_mappear) {
        /* priests and minions: don't even use this function */
        let name = null;
        let save_prop = game.u.uprops[HALLUC_RES].extrinsic;
        let save_invis = mtmp.minvis;
        /* when true name is wanted, explicitly block Hallucination */
        if (!do_hallu) {
            game.u.uprops[HALLUC_RES].extrinsic = 1;
        }
        if (!do_invis) {
            mtmp.minvis = 0;
        }
        name = await priestname(mtmp, article, do_exact, buf2);
        game.u.uprops[HALLUC_RES].extrinsic = save_prop;
        mtmp.minvis = save_invis;
        if (article == 0 && !strncmp(name, "the ", 4)) {
            name = __nh_advance_str(name, 4);
        }
        return strcpy(buf, name);
    }
    if (do_mappear) {
        /* 'pm_name' is the base part of most names */
        /*assert(ismnum(mtmp->mappearance));*/
        pm_name = pmname(game.mons[mtmp.mappearance], Mgender(mtmp));
    } else {
        pm_name = mon_pmname(mtmp);
    }
    if (mtmp.isshk && !do_hallu && !do_mappear) {
        if (adjective && article == 1) {
            buf = strcpy(buf, "the ");
            strcat(strcat(buf, adjective), " ");
            buf = strcat(buf, await shkname(mtmp));
        } else {
            buf = strcat(buf, await shkname(mtmp));
            if (mdat != game.mons[PM_SHOPKEEPER] || do_invis) {
                buf = strcat(buf, " the ");
                /* Shopkeepers: use shopkeeper name.  For normal shopkeepers, just
     * "Asidonhopo"; for unusual ones, "Asidonhopo the invisible
     * shopkeeper" or "Asidonhopo the blue dragon".  If hallucinating,
     * none of this applies.
     */
                /* pathological case: "the angry Asidonhopo the blue dragon"
               sounds silly */
                if (do_invis) {
                    buf = strcat(buf, "invisible ");
                }
                buf = strcat(buf, pm_name);
            }
        }
        return buf;
    }
    /* Put the adjectives in the buffer */
    if (adjective) {
        strcat(strcat(buf, adjective), " ");
    }
    if (do_invis) {
        buf = strcat(buf, "invisible ");
    }
    if (do_saddle && (mtmp.misc_worn_check & 1048576) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        buf = strcat(buf, "saddled ");
    }
    has_adjectives = (__nh_char_at0(buf) != 0);
    if (do_hallu) {
        /* Put the actual monster name or type into the buffer now.
       Remember whether the buffer starts with a personal name. */
        let rnamecode = 0;
        let rname = await rndmonnam({ get value() { return rnamecode; }, set value(_v) { rnamecode = _v; } });
        buf = strcat(buf, rname);
        name_at_start = bogon_is_pname(rnamecode);
    } else if (do_name && ((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
        let name = ((mtmp).mextra.mgivenname);
        if (mdat == game.mons[PM_GHOST]) {
            buf = __nh_buf_append(buf, sprintf('', "%s ghost", s_suffix(name)));
            name_at_start = (1);
        } else if (called) {
            buf = __nh_buf_append(buf, sprintf('', "%s called %s", pm_name, name));
            name_at_start = (((mdat).mflags2 & 524288) != 0);
        } else if ((((mdat).pmidx >= PM_ARCHEOLOGIST) && ((mdat).pmidx <= PM_WIZARD)) && (bp = strstri(name, " the ")) != null) {
            /* <name> the <adjective> <invisible> <saddled> <rank> */
            let pbuf = '';
            pbuf = strcpy(pbuf, name);
            /* adjectives right after " the " */
            pbuf = __nh_char_write(pbuf, (name.length - bp.length) + 5, 0);
            if (has_adjectives) {
                pbuf = strcat(pbuf, buf);
            }
            pbuf = strcat(pbuf, __nh_advance_str(bp, 5));
            buf = strcpy(buf, pbuf);
            /* append the rest of the name */
            article = 0;
            name_at_start = (1);
        } else {
            buf = strcat(buf, name);
            name_at_start = (1);
        }
    } else if ((((mdat).pmidx >= PM_ARCHEOLOGIST) && ((mdat).pmidx <= PM_WIZARD)) && !((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        let pbuf = '';
        pbuf = strcpy(pbuf, rank_of(mtmp.m_lev, ((mdat).pmidx), mtmp.female));
        buf = strcat(buf, lcase(pbuf));
        name_at_start = (0);
    } else {
        buf = strcat(buf, pm_name);
        name_at_start = (((mdat).mflags2 & 524288) != 0);
    }
    if (name_at_start && (article == 3 || !has_adjectives)) {
        if (mdat == game.mons[PM_WIZARD_OF_YENDOR]) {
            article = 1;
        } else {
            article = 0;
        }
    } else if ((mdat.geno & 4096) != 0 && article == 2) {
        article = 1;
    }
    insertbuf2 = (1);
    buf2 = '';
    switch (article) {
        case 3:
            buf2 = strcpy(buf2, "your ");
            break;
        case 1:
            buf2 = strcpy(buf2, "the ");
            break;
        case 2:
            just_an(buf2, buf);
            break;
        case 0:
        default:
            insertbuf2 = (0);
            break;
    }
    if (insertbuf2) {
        buf2 = strcat(buf2, buf);
        buf = strcpy(buf, buf2);
    }
    return buf;
}
export async function l_monnam(mtmp) {
    return await x_monnam(mtmp, 0, null, (((mtmp).mextra && ((mtmp).mextra.mgivenname))) ? 8 : 0, (1));
}
export async function mon_nam(mtmp) {
    return await x_monnam(mtmp, 1, null, (((mtmp).mextra && ((mtmp).mextra.mgivenname))) ? 8 : 0, (0));
}
/* print the name as if mon_nam() (y_monnam() if tame) was called, but
   assume that the player can always see the monster--used for probing and
   for monsters aggravating the player with a cursed potion of invisibility;
   also used for pet moving "reluctantly" onto cursed object when that pet
   can be seen either before or after it moves */
export async function noit_mon_nam(mtmp) {
    return await x_monnam(mtmp, 3, null, (((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? (8 | 1) : 1), (0));
}
/* in between noit_mon_nam() and mon_nam(); if the latter would pick "it",
   use "someone" (for humanoids) or "something" (for others) instead */
export async function some_mon_nam(mtmp) {
    return await x_monnam(mtmp, 1, null, (((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? (8 | 64) : 64), (0));
}
export async function Monnam(mtmp) {
    let bp = await mon_nam(mtmp);
    bp = (() => { const __s = bp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return bp;
}
export async function noit_Monnam(mtmp) {
    let bp = await noit_mon_nam(mtmp);
    bp = (() => { const __s = bp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return bp;
}
export async function Some_Monnam(mtmp) {
    let bp = await some_mon_nam(mtmp);
    bp = (() => { const __s = bp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return bp;
}
/* return "a dog" rather than "Fido", honoring hallucination and visibility */
export async function noname_monnam(mtmp, article) {
    return await x_monnam(mtmp, article, null, 32, (0));
}
/* monster's own name -- overrides hallucination and [in]visibility
   so shouldn't be used in ordinary messages (mainly for disclosure) */
export async function m_monnam(mtmp) {
    return await x_monnam(mtmp, 0, null, 31, (0));
}
/* pet name: "your little dog" */
export async function y_monnam(mtmp) {
    let prefix = 0;
    let suppression_flag = 0;
    prefix = mtmp.mtame ? 3 : 1;
    suppression_flag = (((mtmp).mextra && ((mtmp).mextra.mgivenname)) || mtmp == game.u.usteed) ? 8 : 0;
    return await x_monnam(mtmp, prefix, null, suppression_flag, (0));
}
/* y_monnam() for start of sentence */
export async function YMonnam(mtmp) {
    let bp = await y_monnam(mtmp);
    bp = (() => { const __s = bp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return bp;
}
export async function Adjmonnam(mtmp, adj) {
    let bp = await x_monnam(mtmp, 1, adj, ((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? 8 : 0, (0));
    bp = (() => { const __s = bp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return bp;
}
export async function a_monnam(mtmp) {
    return await x_monnam(mtmp, 2, null, ((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? 8 : 0, (0));
}
export async function Amonnam(mtmp) {
    let bp = await a_monnam(mtmp);
    bp = (() => { const __s = bp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return bp;
}
/* used for monster ID by the '/', ';', and 'C' commands to block remote
   identification of the endgame altars via their attending priests */
/* only ARTICLE_NONE and ARTICLE_THE are handled here */
export async function distant_monnam(mon, article, outbuf) {
    /* high priest(ess)'s identity is concealed on the Astral Plane,
       unless you're adjacent (overridden for hallucination which does
       its own obfuscation) */
    if (mon.data == game.mons[PM_HIGH_CLERIC] && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) && !(dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 2)) {
        outbuf = strcpy(outbuf, article == 1 ? "the " : "");
        outbuf = strcat(outbuf, mon.female ? "high priestess" : "high priest");
    } else {
        outbuf = strcpy(outbuf, await x_monnam(mon, article, null, 0, (1)));
    }
    return outbuf;
}
/* returns mon_nam(mon) relative to other_mon; normal name unless they're
   the same, in which case the reference is to {him|her|it} self */
export async function mon_nam_too(mon, other_mon) {
    let outbuf = null;
    if (mon != other_mon) {
        outbuf = await mon_nam(mon);
    } else {
        outbuf = nextmbuf();
        switch (pronoun_gender(mon, 2)) {
            case 0:
                outbuf = strcpy(outbuf, "himself");
                break;
            case 1:
                outbuf = strcpy(outbuf, "herself");
                break;
            default:
            case 2:
                outbuf = strcpy(outbuf, "itself");
                break;
            /* could happen when hallucinating */
            case 3:
                outbuf = strcpy(outbuf, "themselves");
                break;
        }
    }
    return outbuf;
}
/* construct "<monnamtext> <verb> <othertext> {him|her|it}self" which might
   be distorted by Hallu; if that's plural, adjust monnamtext and verb */
/* modifiable 'mbuf' with adequate room at end */
export async function monverbself(mon, monnamtext, verb, othertext) {
    /* sizeof "themselves" suffices */
    let verbs = null;
    let selfbuf = '';
    selfbuf = strcpy(selfbuf, await mon_nam_too(mon, mon));
    verbs = await vtense(selfbuf, verb);
    if (!strcmp(verb, verbs)) {
        monnamtext = await makeplural(monnamtext);
        if (!strncmpi((monnamtext), (genders[3].he), -1)) {
            /* for "it", makeplural() produces "them" but we want "they" */
            let capitaliz = (__nh_char_at0(monnamtext) == highc(__nh_char_at0(monnamtext)));
            monnamtext = strcpy(monnamtext, genders[3].him);
            if (capitaliz) {
                monnamtext = (() => { const __s = monnamtext; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
            }
        }
    }
    strcat(strcat(monnamtext, " "), verbs);
    if (othertext && __nh_char_at0(othertext)) {
        strcat(strcat(monnamtext, " "), othertext);
    }
    strcat(strcat(monnamtext, " "), selfbuf);
    return monnamtext;
}
/* for debugging messages, where data might be suspect and we aren't
   taking what the hero does or doesn't know into consideration */
export function minimal_monnam(mon, ckloc) {
    let ptr = null;
    let outbuf = nextmbuf();
    if (!mon) {
        outbuf = strcpy(outbuf, "[Null monster]");
    } else if ((ptr = mon.data) == null) {
        outbuf = strcpy(outbuf, "[Null mon->data]");
    } else if (ptr.pmidx < 0) {
        outbuf = sprintf(outbuf, "[Invalid mon->data %s < %s]", fmt_ptr(mon.data), fmt_ptr(game.mons[0]));
    } else if (ptr.pmidx >= NUMMONS) {
        outbuf = sprintf(outbuf, "[Invalid mon->data %s >= %s]", fmt_ptr(mon.data), fmt_ptr(game.mons[NUMMONS]));
    } else if (ckloc && ptr == game.mons[PM_LONG_WORM] && mon.mx && game.level.monsters[mon.mx][mon.my] != mon) {
        outbuf = sprintf(outbuf, "%s <%d,%d>", pmname(game.mons[PM_LONG_WORM_TAIL], Mgender(mon)), mon.mx, mon.my);
    } else {
        outbuf = sprintf(outbuf, "%s%s <%d,%d>", mon.mtame ? "tame " : mon.mpeaceful ? "peaceful " : "", mon_pmname(mon), mon.mx, mon.my);
        if (mon.cham != NON_PM) {
            outbuf = __nh_buf_append(outbuf, sprintf('', "{%s}", pmname(game.mons[mon.cham], Mgender(mon))));
        }
    }
    return outbuf;
}
export function Mgender(mtmp) {
    let mgender = MALE;
    if (mtmp == game.youmonst) {
        if ((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) {
            mgender = FEMALE;
        }
    } else if (mtmp.female) {
        mgender = FEMALE;
    }
    return mgender;
}
export function pmname(pm, mgender) {
    if (mgender < MALE || mgender >= NUM_MGENDERS || !pm.pmnames[mgender]) {
        mgender = NEUTRAL;
    }
    return pm.pmnames[mgender];
}
/* PMNAME_MACROS */
/* mons[]->pmname for a monster */
export function mon_pmname(mon) {
    /* for neuter, mon->data->pmnames[MALE] will be Null and use [NEUTRAL] */
    return pmname(mon.data, Mgender(mon));
}
/* mons[]->pmname for a corpse or statue or figurine */
export async function obj_pmname(obj) {
    if ((obj.otyp == CORPSE || obj.otyp == STATUE || obj.otyp == FIGURINE) && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS)) {
        /* ignore saved montraits even when they're available; they determine
         * what a corpse would revive as if resurrected (human corpse from
         * slain vampire revives as vampire rather than as human, for example)
         * and don't necessarily reflect the state of the corpse itself */
        /* obj->oextra->omonst->data is Null but ...->mnum is set */
        let cgend = (obj.spe & 3);
        let mgend = ((cgend == 2) ? MALE : (cgend == 1) ? FEMALE : NEUTRAL);
        let mndx = obj.corpsenm;
        /* mons[].pmnames[] for monster cleric uses "priest" or "priestess"
           or "aligned cleric"; we want to avoid "aligned cleric [corpse]"
           unless it has been explicitly flagged as neuter rather than
           defaulting to random (which fails male or female check above);
           role monster cleric uses "priest" or "priestess" or "cleric"
           without "aligned" prefix so we switch to that; [can't force
           random gender to be chosen here because splitting a stack of
           corpses could cause the split-off portion to change gender, so
           settle for avoiding "aligned"] */
        if (mndx == PM_ALIGNED_CLERIC && cgend == 0) {
            mndx = PM_CLERIC;
        }
        return pmname(game.mons[mndx], mgend);
    }
    await impossible("obj_pmname otyp:%i,corpsenm:%i", obj.otyp, obj.corpsenm);
    return "two-legged glorkum-seeker";
}
/* used by bogusmon(next) and also by init_CapMons(rumors.c);
   bogon_is_pname(below) checks a hard-coded subset of these rather than
   use this list.
   Also used in rumors.c */
export const bogon_codes = "-_+|=";
/* see dat/bonusmon.txt */
/* fake monsters used to be in a hard-coded array, now in a data file */
export async function bogusmon(buf, code) {
    let mnam = buf;
    if (code) {
        code.value = 0;
    }
    await get_rnd_text("bogusmon", buf, rn2_on_display_rng, 20);
    if (!mnam.value) {
        buf = strcpy(buf, "bogon");
    } else if (strchr(bogon_codes, mnam.value)) {
        if (code) {
            code.value = mnam.value;
        }
        (mnam = __nh_advance_str(mnam, 1));
    }
    return mnam;
}
/* return a random monster name, for hallucination */
let __rndmonnam_buf = '';
__nh_register_static(() => { __rndmonnam_buf = ''; });
export async function rndmonnam(code) {
    let mnam = null;
    let name = 0;
    if (code) {
        code.value = 0;
    }
    do {
        name = rn2_on_display_rng(SPECIAL_PM + 100 - LOW_PM) + LOW_PM;
    } while (name < SPECIAL_PM && ((((game.mons[name]).mflags2 & 524288) != 0) || (game.mons[name].geno & 512)));
    if (name >= SPECIAL_PM) {
        mnam = await bogusmon(__rndmonnam_buf, code);
    } else {
        mnam = strcpy(__rndmonnam_buf, pmname(game.mons[name], rn2_on_display_rng(2)));
    }
    return mnam;
}
/* check bogusmon prefix to decide whether it's a personal name */
export function bogon_is_pname(code) {
    if (!code) {
        return (0);
    }
    return strchr("-+=", code) ? (1) : (0);
}
/* name of a Rogue player */
export function roguename() {
    let i = null;
    let opts = null;
    if ((opts = nh_getenv("ROGUEOPTS")) != null) {
        for (i = opts; __nh_char_at0(i); (i = __nh_advance_str(i, 1))) {
            if (!strncmp("name=", i, 5)) {
                let j = null;
                if ((j = strchr(__nh_advance_str(i, 5), 44)) != null) {
                    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
                }
                return __nh_advance_str(i, 5);
            }
        }
    }
    return rn2(3) ? (rn2(2) ? "Michael Toy" : "Kenneth Arnold") : "Glenn Wichman";
}
const hcolors = ["ultraviolet", "infrared", "bluish-orange", "reddish-green", "dark white", "light black", "sky blue-pink", "pinkish-cyan", "indigo-chartreuse", "salty", "sweet", "sour", "bitter", "umami", "striped", "spiral", "swirly", "plaid", "checkered", "argyle", "paisley", "blotchy", "guernsey-spotted", "polka-dotted", "square", "round", "triangular", "cabernet", "sangria", "fuchsia", "wisteria", "lemon-lime", "strawberry-banana", "peppermint", "romantic", "incandescent", "octarine", "excitingly dull", "mauve", "electric", "neon", "fluorescent", "phosphorescent", "translucent", "opaque", "psychedelic", "iridescent", "rainbow-colored", "polychromatic", "colorless", "colorless green", "dancing", "singing", "loving", "loudy", "noisy", "clattery", "silent", "apocyan", "infra-pink", "opalescent", "violant", "tuneless", "viridian", "aureolin", "cinnabar", "purpurin", "gamboge", "madder", "bistre", "ecru", "fulvous", "tekhelet", "selective yellow"];
/* basic tastes */
/* Discworld: the Colour of Magic */
export function hcolor(colorpref) {
    return ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || !colorpref) ? hcolors[rn2_on_display_rng((Math.trunc(74 /* sizeof(const char *const [74]) */ / 1 /* sizeof(const char *const) */)))] : colorpref;
}
/* return a random real color unless hallucinating */
export function rndcolor() {
    let k = rn2(16);
    return (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? hcolor(null) : (k == 8) ? "colorless" : c_obj_colors[k];
}
const hliquids = ["yoghurt", "oobleck", "clotted blood", "diluted water", "purified water", "instant coffee", "tea", "herbal infusion", "liquid rainbow", "creamy foam", "mulled wine", "bouillon", "nectar", "grog", "flubber", "ketchup", "slow light", "oil", "vinaigrette", "liquid crystal", "honey", "caramel sauce", "ink", "aqueous humour", "milk substitute", "fruit juice", "glowing lava", "gastric acid", "mineral water", "cough syrup", "quicksilver", "sweet vitriol", "grey goo", "pink slime", "cosmic latte", "bone oil", "custard", "lard", "vinegar", "creosote"];
/* "new coke (tm)", --better not */
/* if hallucinating, return a random liquid instead of 'liquidpref' */
/* use as-is when not hallucintg (unless empty) */
export function hliquid(liquidpref) {
    let hallucinate = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !game.program_state.gameover;
    if (hallucinate || !liquidpref || !__nh_char_at0(liquidpref)) {
        let indx = 0;
        let count = (Math.trunc(40 /* sizeof(const char *const [40]) */ / 1 /* sizeof(const char *const) */));
        /* if we have a non-hallucinatory default value, include it
           among the choices */
        if (liquidpref && __nh_char_at0(liquidpref)) {
            ++count;
        }
        indx = rn2_on_display_rng(count);
        if (((indx) >= 0 && (indx) < (Math.trunc(40 /* sizeof(const char *const [40]) */ / 1 /* sizeof(const char *const) */)))) {
            return hliquids[indx];
        }
    }
    return liquidpref;
}
/* Aliases for road-runner nemesis
 */
const coynames = ["Carnivorous Vulgaris", "Road-Runnerus Digestus", "Eatibus Anythingus", "Famishus-Famishus", "Eatibus Almost Anythingus", "Eatius Birdius", "Famishius Fantasticus", "Eternalii Famishiis", "Famishus Vulgarus", "Famishius Vulgaris Ingeniusi", "Eatius-Slobbius", "Hardheadipus Oedipus", "Carnivorous Slobbius", "Hard-Headipus Ravenus", "Evereadii Eatibus", "Apetitius Giganticus", "Hungrii Flea-Bagius", "Overconfidentii Vulgaris", "Caninus Nervous Rex", "Grotesques Appetitus", "Nemesis Ridiculii", "Canis latrans"];
export async function coyotename(mtmp, buf) {
    if (mtmp && buf) {
        buf = sprintf(buf, "%s - %s", await x_monnam(mtmp, 0, null, 0, (1)), mtmp.mcan ? coynames[(Math.trunc(22 /* sizeof(const char *const [22]) */ / 1 /* sizeof(const char *const) */)) - 1] : coynames[mtmp.m_id % ((Math.trunc(22 /* sizeof(const char *const [22]) */ / 1 /* sizeof(const char *const) */)) - 1)]);
    }
    return buf;
}
const __rndorcname_v = ["a", "ai", "og", "u"];
const __rndorcname_snd = ["gor", "gris", "un", "bane", "ruk", "oth", "ul", "z", "thos", "akh", "hai"];
export function rndorcname(s) {
    let i = 0;
    let iend = (rn2(2) + (3));
    let vstart = rn2(2);
    if (s) {
        s.value = 0;
        for (i = 0; i < iend; ++i) {
            vstart = 1 - vstart;
            s = __nh_buf_append(s, sprintf('', "%s%s", (i > 0 && !rn2(30)) ? "-" : "", vstart ? __rndorcname_v[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))] : __rndorcname_snd[rn2((Math.trunc(11 /* sizeof(const char *const [11]) */ / 1 /* sizeof(const char *const) */)))]));
        }
    }
    return s;
}
export function christen_orc(mtmp, gang, other) {
    let sz = 0;
    let buf = '';
    let buf2 = '';
    let orcname = null;
    orcname = rndorcname(buf2);
    /* rndorcname() won't return NULL */
    sz = strlen(orcname);
    if (gang) {
        sz += (strlen(gang) + 5 /* sizeof(char [5]) */ - 1 /* sizeof(char [1]) */);
    } else if (other) {
        sz += strlen(other);
    }
    if (sz < 256) {
        let gbuf = '';
        let nameit = (0);
        if (gang) {
            buf = sprintf(buf, "%s of %s", upstart(orcname), upstart(strcpy(gbuf, gang)));
            nameit = (1);
        } else if (other) {
            buf = sprintf(buf, "%s%s", upstart(orcname), other);
            nameit = (1);
        }
        if (nameit) {
            mtmp = christen_monst(mtmp, buf);
        }
    }
    return mtmp;
}
/* Discworld novel titles, in the order that they were published; a subset
   of them have index macros used for variant spellings; if the titles are
   reordered for some reason, make sure that those get renumbered to match */
const sir_Terry_novels = ["The Colour of Magic", "The Light Fantastic", "Equal Rites", "Mort", "Sourcery", "Wyrd Sisters", "Pyramids", "Guards! Guards!", "Eric", "Moving Pictures", "Reaper Man", "Witches Abroad", "Small Gods", "Lords and Ladies", "Men at Arms", "Soul Music", "Interesting Times", "Maskerade", "Feet of Clay", "Hogfather", "Jingo", "The Last Continent", "Carpe Jugulum", "The Fifth Elephant", "The Truth", "Thief of Time", "The Last Hero", "The Amazing Maurice and His Educated Rodents", "Night Watch", "The Wee Free Men", "Monstrous Regiment", "A Hat Full of Sky", "Going Postal", "Thud!", "Wintersmith", "Making Money", "Unseen Academicals", "I Shall Wear Midnight", "Snuff", "Raising Steam", "The Shepherd's Crown"];
export function noveltitle(novidx) {
    let j = 0;
    let k = (Math.trunc(41 /* sizeof(const char *const [41]) */ / 1 /* sizeof(const char *const) */));
    j = rn2(k);
    if (novidx) {
        if (novidx.value == -1) {
            novidx.value = j;
        } else if (novidx.value >= 0 && novidx.value < k) {
            j = novidx.value;
        }
    }
    return sir_Terry_novels[j];
}
/* figure out canonical novel title from player-specified one */
export async function lookup_novel(lookname, idx) {
    let k = 0;
    if (!strncmpi((await The(lookname)), ("The Color of Magic"), -1)) {
        lookname = sir_Terry_novels[0];
    } else if (!strncmpi((lookname), ("Sorcery"), -1)) {
        lookname = sir_Terry_novels[4];
    } else if (!strncmpi((lookname), ("Masquerade"), -1)) {
        lookname = sir_Terry_novels[17];
    } else if (!strncmpi((await The(lookname)), ("The Amazing Maurice"), -1)) {
        lookname = sir_Terry_novels[27];
    } else if (!strncmpi((lookname), ("Thud"), -1)) {
        lookname = sir_Terry_novels[33];
    }
    for (k = 0; k < (Math.trunc(41 /* sizeof(const char *const [41]) */ / 1 /* sizeof(const char *const) */)); ++k) {
        if (!strncmpi((lookname), (sir_Terry_novels[k]), -1) || !strncmpi((await The(lookname)), (sir_Terry_novels[k]), -1)) {
            if (idx) {
                idx.value = k;
            }
            return sir_Terry_novels[k];
        }
    }
    /* name not found; if novelidx is already set, override the name */
    if (idx && ((idx.value) >= 0 && (idx.value) < (Math.trunc(41 /* sizeof(const char *const [41]) */ / 1 /* sizeof(const char *const) */)))) {
        return sir_Terry_novels[idx.value];
    }
    return null;
}
/*do_name.c*/
/* default response from getlin() */
/* catch trying to name "the Oracle" as "Oracle" */
/* catch trying to name "invisible Orcus" as "Orcus" */
/* catch trying to name "the priest of Crom" as "Crom" */
/* avoid gendered pronoun for riders */
/* use getlin() to get a name string from the player */
/* special case similar to the one in lookat() */
/* Unique monsters have their own specific names or titles.
     * Shopkeepers, temple priests and other minions use alternate
     * name formatting routines which ignore any user-supplied name.
     *
     * Don't say a new name is being rejected if it happens to match
     * the existing name, or if the player is trying to remove the
     * monster's existing name without assigning a new one.
     */
/* Do this now because there's no point in even asking for a name */
/*
     * We don't violate illiteracy conduct here, although it is
     * arguable that we should for anything other than "X".  Doing so
     * would make attaching player's notes to hero's inventory have an
     * in-game effect, which may or may not be the correct thing to do.
     *
     * We do violate illiteracy in oname() if player creates Sting or
     * Orcrist, clearly being literate (no pun intended...).
     */
/* this used to give "The artifact seems to resist the attempt."
           but resisting is definite, no "seems to" about it */
/* artifact_name() always returns non-Null when it sets objtyp */
/* artifact_name() found a match and restrict_name() didn't reject
           it; since 'obj' is the right type, naming will change it into an
           artifact so use canonical capitalization (Sting or Orcrist) */
/* can't dual-wield with artifact as secondary weapon */
/* activate warning if you've just named your weapon "Sting" */
/* if obj is owned by a shop, increase your bill */
/* violate illiteracy conduct since successfully wrote arti-name */
/* 5.0: calling these used to be allowed but that enabled the
           player to tell whether two unID'd amulets of yendor were both
           fake or one was real by calling them distinct names and then
           checking discoveries to see whether first name was replaced
           by second or both names stuck; with more than two available
           to work with, if they weren't all fake it was possible to
           determine which one was the real one */
/* behave as if examining it in inventory;
               this might set dknown if it was picked up
               while blind and the hero can now see */
/* 6*20, neither a small glob nor a large one */
/* suppress tin type (homemade, &c) and mon type */
/* probably blind; Blind || Hallucination for 'fromsink' */
/* buffered updates might matter to player's response */
/* possibly remove from disco[]; old *uname_p is gone */
/* "under you" is safe here since there's no object to hide under */
/* EXACT_NAME will force "of <deity>" on the Astral Plane */
/* buf2[] isn't viable to return,  */
/* so transfer the result to buf[] */
/* "saddled" is redundant when mounted */
/* "himself"/"herself"/"itself", maybe "themselves" if hallucinating */
/* verb starts plural; this will yield singular except for "themselves" */
/* a match indicates that it stayed plural */
/* might fail (return empty buf[]) if the file isn't available */
/*
     * Accept variant spellings:
     * _The_Colour_of_Magic_ uses British spelling, and American
     * editions keep that, but we also recognize American spelling;
     * _Sourcery_ is a joke rather than British spelling of "sorcery".
     */
