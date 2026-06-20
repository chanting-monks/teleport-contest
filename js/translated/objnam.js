/* NetHack 5.0	objnam.c	$NHDT-Date: 1745114235 2025/04/19 17:57:15 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.453 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
/* "an uncursed greased partly eaten guardian naga hatchling [corpse]" */
/* (56) */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { memcpy, memset } from '../c2js-runtime/memory.js';
import { __nh_hp_makeplural, __nh_hp_vtense } from '../c2js-runtime/objnam-handports.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { coerceCStr, __nh_advance_str, __nh_buf_view, __nh_char_at0, __nh_char_write, atoi, nh_strchr_truncate, strcat, strchr, strcmp, strcpy, strlen, strncat, strncmp, strncmpi, strncpy, strrchr, strstr, strstri } from '../c2js-runtime/string.js';
import { artifact_exists, artifact_light, artifact_name, artiname, find_artifact, glow_color, glow_verb, nartifact_exist, permapoisoned, undiscovered_artifact } from './artifact.js';
import { isok, yn_function } from './cmd.js';
import { is_ice, is_lava, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_common_strings, cg, vowels, ynchars } from './decl.js';
import { docrt, feel_newsym } from './display.js';
import { lookup_novel, mon_pmname, noit_mon_nam, obj_pmname, oname, safe_oname } from './do_name.js';
import { doffing, donning, hard_helmet } from './do_wear.js';
import { def_char_to_objclass } from './drawing.js';
import { Can_fall_thru, on_level } from './dungeon.js';
import { consume_oeaten, obj_nutrition, set_tin_variety, tin_details, tin_variety_txt } from './eat.js';
import { del_engr_at, make_grave } from './engrave.js';
import { obj_to_any, pooleffects, set_uinwater, switch_terrain } from './hack.js';
import { copynchars, digit, dist2, eos, fuzzymatch, highc, lowc, mungspaces, ordin, s_suffix, str_start_is, strcasecpy, strsubst, upstart } from './hacklib.js';
import { align_str } from './insight.js';
import { count_contents, currency } from './invent.js';
import { arti_light_description, find_mid } from './light.js';
import { count_level_features } from './mklev.js';
import { fix_wall_spines } from './mkmaze.js';
import { curse, is_flammable, is_rottable, mkobj, mksobj, obj_extract_self, place_object, set_corpsenm, weight } from './mkobj.js';
import { can_be_hatched, dead_species, genus, zombie_form } from './mon.js';
import { name_to_mon, name_to_monplus } from './mondata.js';
import { ACID_VENOM, AKLYS, ALCHEMY_SMOCK, ALTAR, AMULET_CLASS, AMULET_OF_ESP, AMULET_OF_GUARDING, AMULET_OF_YENDOR, AMULET_VERSUS_POISON, ARMOR_CLASS, ARM_BOOTS, ARM_CLOAK, ARM_GLOVES, ARM_HELM, ARM_SHIELD, ARM_SHIRT, ARM_SUIT, ART_EYES_OF_THE_OVERWORLD, ART_ORB_OF_DETECTION, BAG_OF_TRICKS, BALL_CLASS, BEARTRAP, BEAR_TRAP, BELL, BELL_OF_OPENING, BLACK_OPAL, BLINDED, BLINDING_VENOM, BOULDER, BRASS_LANTERN, BROADSWORD, BULLWHIP, BURN_OBJECT, CANDELABRUM_OF_INVOCATION, CANDY_BAR, CHAIN_CLASS, CHEST, CLOAK_OF_DISPLACEMENT, CLOUD, COIN_CLASS, COPPER, CORPSE, CORR, COST_CONTENTS, CREAM_PIE, CRYSKNIFE, CRYSTAL_BALL, DBWALL, DIAMOND, DILITHIUM_CRYSTAL, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, DUNCE_CAP, DWARVISH_MATTOCK, EGG, ELVEN_LEATHER_HELM, ELVEN_MITHRIL_COAT, ELVEN_SHIELD, EMERALD, ENORMOUS_MEATBALL, EUCALYPTUS_LEAF, EXPENSIVE_CAMERA, FAKE_AMULET_OF_YENDOR, FEDORA, FEMALE, FIGURINE, FIRST_GLASS_GEM, FLAIL, FLINT, FLYING, FOOD_CLASS, FOOD_RATION, FORTUNE_COOKIE, FOUNTAIN, GAUNTLETS_OF_DEXTERITY, GAUNTLETS_OF_POWER, GEMSTONE, GEM_CLASS, GLAIVE, GLASS, GLIB, GLOB_OF_BLACK_PUDDING, GLOB_OF_GRAY_OOZE, GOLD_PIECE, GOLD_SYM, GRAPPLING_HOOK, GRAVE, GRAY_DRAGON_SCALES, GRAY_DRAGON_SCALE_MAIL, HALLUC_RES, HAND, HAWAIIAN_SHIRT, HEAVY_IRON_BALL, HELMET, HELM_OF_TELEPATHY, HOLE, HORN_OF_PLENTY, HWALL, ICE, ILLOBJ_CLASS, IRON, IRONBARS, IRON_CHAIN, IRON_SHOES, KATANA, KELP_FROND, KNIFE, LADDER, LANDMINE, LAND_MINE, LARGE_BOX, LAST_REAL_GEM, LAVAPOOL, LAVAWALL, LEASH, LEATHER_GLOVES, LEMBAS_WAFER, LENSES, LEVITATION, LEVITATION_BOOTS, LOADSTONE, LOCK_PICK, LOW_BOOTS, LOW_PM, LUCKSTONE, MAGIC_HARP, MAGIC_LAMP, MAGIC_MARKER, MAGIC_PORTAL, MALE, MAXOCLASSES, MEAT_RING, MELT_ICE_AWAY, MINERAL, MOAT, MS_GUARDIAN, MUMMY_WRAPPING, M_AP_OBJECT, NEUTRAL, NON_PM, NO_TRAP, NUMMONS, NUM_GLASS_GEMS, NUM_OBJECTS, OIL_LAMP, OPAL, ORANGE, ORCISH_SHIELD, PICK_AXE, PLATE_MAIL, PM_ARCHEOLOGIST, PM_BLACK_PUDDING, PM_CLERIC, PM_GRAY_DRAGON, PM_GRAY_OOZE, PM_HIGH_CLERIC, PM_LONG_WORM, PM_LONG_WORM_TAIL, PM_MAIL_DAEMON, PM_SAMURAI, PM_WIZARD_OF_YENDOR, PM_YELLOW_DRAGON, POOL, POTION_CLASS, POT_BOOZE, POT_OIL, POT_SLEEPING, POT_WATER, P_BOOMERANG, P_BOW, P_CROSSBOW, P_DART, P_HAMMER, P_NONE, P_POLEARMS, P_SHURIKEN, RING_CLASS, RIN_INCREASE_ACCURACY, RIN_PROTECTION_FROM_SHAPE_CHAN, ROBE, ROCK, ROCKTRAP, ROCK_CLASS, ROOM, RUBY, SACK, SAPPHIRE, SCALE_MAIL, SCORR, SCROLL_CLASS, SCR_BLANK_PAPER, SCR_CHARGING, SCR_MAIL, SDOOR, SHIELD_OF_REFLECTION, SHORT_SWORD, SILVER_SABER, SINK, SKELETON_KEY, SLIME_MOLD, SMALL_SHIELD, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_NOVEL, STAIRS, STATUE, STRANGE_OBJECT, S_PUDDING, TALLOW_CANDLE, THRONE, TIMER_OBJECT, TIN, TIN_OPENER, TOOLED_HORN, TOOL_CLASS, TOUCHSTONE, TOWEL, TRAPDOOR, TRAPNUM, TREE, TRIPE_RATION, TT_LAVA, T_SHIRT, VENOM_CLASS, VWALL, WAND_CLASS, WAN_WISHING, WARN_OF_MON, WATER, WAX_CANDLE, WEAPON_CLASS, WOODEN_HARP, WT_IRON_BALL_INCR, YELLOW_DRAGON_SCALES, YELLOW_DRAGON_SCALE_MAIL, ZOMBIFY_MON } from './nh-constants.js';
import { observe_object } from './o_init.js';
import { ice_descr, waterbody_name } from './pager.js';
import { body_part } from './polyself.js';
import { is_quest_artifact } from './questpgr.js';
import { apron_text, candy_wrapper_text, hawaiian_motif, tshirt_text } from './read.js';
import { rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { CapitalMon } from './rumors.js';
import { append_price_quote, delete_contents, get_cost_of_shop_item, is_unpaid, obfree, record_price_quote, shk_your, unpaid_cost } from './shk.js';
import { Strlen_ } from './strutil.js';
import { begin_burn, peek_timer, spot_stop_timers, start_timer } from './timeout.js';
import { deltrap, fire_damage_chain, maketrap, reset_utrap, t_at, trapname, water_damage_chain } from './trap.js';
import { recalc_block_point } from './vision.js';
import { counter_were } from './were.js';
import { get_obj_location, start_melt_ice_timeout } from './zap.js';

// struct _readobjnam_data: { otmp, bp, origbp, oclass, un, dn, actualn, name, p, cnt, spe, spesgn, typ, very, rechrg, blessed, uncursed, iscursed, ispoisoned, isgreased, eroded, eroded2, erodeproof, locked, unlocked, broken, real, fake, halfeaten, mntmp, contents, islit, unlabeled, ishistoric, isdiluted, trapped, doorless, open, closed, flags, tmp, tinv, tvariety, mgend, wetness, gsize, ftype, zombify, globbuf, fruitbuf }
// struct Jitem: { item, name }
/* Concat(): append text to base, adjusted by delta, with bounds checking
   via a pair of behind-the-scenes variables; delta is either 0 for normal
   concatenation or 1 to replace the final character with something */
/* convert signed ptrdiff_t to unsigned size_t */
/* true for gems/rocks that should have " stone" appended to their names */
const Japanese_items = [{ item: SHORT_SWORD, name: "wakizashi" }, { item: BROADSWORD, name: "ninja-to" }, { item: FLAIL, name: "nunchaku" }, { item: GLAIVE, name: "naginata" }, { item: LOCK_PICK, name: "osaku" }, { item: WOODEN_HARP, name: "koto" }, { item: MAGIC_HARP, name: "magic koto" }, { item: KNIFE, name: "shito" }, { item: PLATE_MAIL, name: "tanko" }, { item: HELMET, name: "kabuto" }, { item: LEATHER_GLOVES, name: "yugake" }, { item: FOOD_RATION, name: "gunyoki" }, { item: POT_BOOZE, name: "sake" }, { item: 0, name: "" }];
export async function strprepend(s, pref) {
    /* patched: pointer-arithmetic body replaced by string-concat.
       The C original rewinds the pointer by strlen(pref) and writes
       pref into the freed PREFIX area of an 80-byte buffer; here
       we just concatenate.  The C 80-byte cap is meaningless in JS
       (string concat has no overflow) and bailing out without the
       prepend silently corrupts the name we hand back — drop the
       cap and warning. */
    const sStr = (typeof s === 'string') ? s
        : (Array.isArray(s) ? ((() => { let __r=''; for (let __i=0; __i<s.length && s[__i]; __i++) __r += String.fromCharCode(s[__i]); return __r; })()) : String(s ?? ''));
    const prefStr = (typeof pref === 'string') ? pref
        : (Array.isArray(pref) ? ((() => { let __r=''; for (let __i=0; __i<pref.length && pref[__i]; __i++) __r += String.fromCharCode(pref[__i]); return __r; })()) : String(pref ?? ''));
    return prefStr + sStr;
}
/* manage a pool of BUFSZ buffers, so callers don't have to */
game.obufs = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
game.obufidx = 0;
export function nextobuf() {
    game.obufidx = (game.obufidx + 1) % 12;
    return game.obufs[game.obufidx];
}
/* put the most recently allocated buffer back if possible */
export function releaseobuf(bufp) {
    /* caller may not know whether bufp is the most recently allocated
       buffer; if it isn't, do nothing; note that because of the somewhat
       obscure PREFIX handling for object name formatting by xname(),
       the pointer our caller has and is passing to us might be into the
       middle of an obuf rather than the address returned by nextobuf() */
    if (bufp >= game.obufs[game.obufidx] && bufp < game.obufs[game.obufidx] + 256 /* sizeof(char [256]) */) {
        game.obufidx = (game.obufidx - 1 + 12) % 12;
    }
}
/* used by display_pickinv (invent.c, main whole-inventory routine) to
   release each successive doname() result in order to try to avoid
   clobbering all the obufs when 'perm_invent' is enabled and updated
   while one or more obufs have been allocated but not released yet */
export function maybereleaseobuf(obuffer) {
    /*
     * An example from 3.6.x where all obufs got clobbered was when a
     * monster used a bullwhip to disarm the hero of a two-handed weapon:
     * "The ogre lord yanks Cleaver from your corpses!"
     |
     | hand = body_part(HAND);
     | if (use_plural)      // switches 'hand' from static buffer to an obuf
     |   hand = makeplural(hand);
      ...
     | release_worn_item(); // triggers full inventory update for perm_invent
      ...
     | pline(..., hand);    // the obuf[] for "hands" was clobbered with the
     |                      //+ partial formatting of an item from invent
     *
     * Another example was from writing a scroll without room in invent to
     * hold it after being split from a stack of blank scrolls:
     * "Oops!  food rations out of your grasp!"
     * hold_another_object() was passed 'the(aobjnam(newscroll, "slip"))'
     * as an argument and that should have yielded
     * "Oops!  The scroll of <foo> slips out of your grasp!"
     * but attempting to add the item to inventory triggered update for
     * perm_invent and the result from 'the(...)' was clobbered by partial
     * formatting of some inventory item.  [It happened in a shop and the
     * shk claimed ownership of the new scroll, but that wasn't relevant.]
     * That got fixed earlier, by delaying update_inventory() during
     * hold_another_object() rather than by avoiding using all the obufs.
     */
    releaseobuf(obuffer);
}
export async function obj_typename(otyp) {
    let buf = nextobuf();
    let ocl = game.objects[otyp];
    let actualn = (game.obj_descr[(ocl).oc_name_idx].oc_name);
    let dn = (game.obj_descr[(ocl).oc_descr_idx].oc_descr);
    let un = ocl.oc_uname;
    let nn = ocl.oc_name_known;
    if ((game.urole.mnum == (PM_SAMURAI))) {
        actualn = Japanese_item_name(otyp, actualn);
        if (otyp == WOODEN_HARP || otyp == MAGIC_HARP) {
            dn = "koto";
        }
    }
    /* generic items don't have an actual-name; we shouldn't ever be called
       for those; pacify static analyzer without resorting to impossible() */
    if (!actualn) {
        actualn = (otyp > 0 && otyp < MAXOCLASSES) ? "generic" : "object?";
    }
    buf = __nh_char_write(buf, 0, 0);
    switch (ocl.oc_class) {
        case COIN_CLASS:
            return strcpy(buf, actualn);
        case POTION_CLASS:
            buf = strcpy(buf, "potion");
            break;
        case SCROLL_CLASS:
            buf = strcpy(buf, "scroll");
            break;
        case WAND_CLASS:
            buf = strcpy(buf, "wand");
            break;
        case SPBOOK_CLASS:
            if (otyp != SPE_NOVEL) {
                buf = strcpy(buf, "spellbook");
            } else {
                buf = strcpy(buf, !nn ? "book" : "novel");
                nn = 0;
            }
            break;
        case RING_CLASS:
            buf = strcpy(buf, "ring");
            break;
        /* Some classes use strcpy(buf, something)+strcat(buf, otherthing).
       In those cases, ConcUpdate() is needed in between if Concat()
       will be used for the strcat() part.  Other classes just use
       strcpy(buf, something) and the ConcUpdate() can be deferred
       until after the switch. */
        case AMULET_CLASS:
            if (nn) {
                buf = strcpy(buf, actualn);
            } else {
                buf = strcpy(buf, "amulet");
            }
            if (un) {
                await xcalled(buf, 256 - (dn ? strlen(dn) + 3 : 0), "", un);
            }
            if (dn) {
                buf = __nh_buf_append(buf, sprintf('', " (%s)", dn));
            }
            return buf;
        case ARMOR_CLASS:
            if (game.objects[otyp].oc_subtyp == ARM_GLOVES || game.objects[otyp].oc_subtyp == ARM_BOOTS) {
                buf = strcpy(buf, "pair of ");
            } else if (otyp >= GRAY_DRAGON_SCALES && otyp <= YELLOW_DRAGON_SCALES) {
                buf = strcpy(buf, "set of ");
            }
            ;
        default:
            if (nn) {
                buf = strcat(buf, actualn);
                if ((otyp == FLINT || (game.objects[otyp].oc_material == GEMSTONE && (otyp != DILITHIUM_CRYSTAL && otyp != RUBY && otyp != DIAMOND && otyp != SAPPHIRE && otyp != BLACK_OPAL && otyp != EMERALD && otyp != OPAL)))) {
                    buf = strcat(buf, " stone");
                }
                if (un) {
                    await xcalled(buf, 256 - (dn ? strlen(dn) + 3 : 0), "", un);
                }
                if (dn) {
                    buf = __nh_buf_append(buf, sprintf('', " (%s)", dn));
                }
            } else {
                buf = strcat(buf, dn ? dn : actualn);
                if (ocl.oc_class == GEM_CLASS) {
                    buf = strcat(buf, (ocl.oc_material == MINERAL) ? " stone" : " gem");
                }
                if (un) {
                    await xcalled(buf, 256, "", un);
                }
            }
            return buf;
    }
    if (nn) {
        /* here for ring/scroll/potion/wand */
        if (ocl.oc_unique) {
            buf = strcpy(buf, actualn);
        } else {
            buf = __nh_buf_append(buf, sprintf('', " of %s", actualn));
        }
    }
    if (un) {
        await xcalled(buf, 256 - (dn ? strlen(dn) + 3 : 0), "", un);
    }
    if (dn) {
        buf = __nh_buf_append(buf, sprintf('', " (%s)", dn));
    }
    return buf;
}
/* less verbose result than obj_typename(); either the actual name
   or the description (but not both); user-assigned name is ignored */
export async function simple_typename(otyp) {
    let bufp = null;
    let pp = null;
    let save_uname = game.objects[otyp].oc_uname;
    /* suppress any name given by user */
    game.objects[otyp].oc_uname = null;
    bufp = await obj_typename(otyp);
    game.objects[otyp].oc_uname = save_uname;
    if ((pp = strstri(bufp, " (")) != null) {
        bufp = nh_strchr_truncate(bufp, " (", 'stri');
    }
    /* strip the appended description */
    return bufp;
}
/* typename for debugging feedback where data involved might be suspect */
export async function safe_typename(otyp) {
    let save_nameknown = 0;
    let res = null;
    if (otyp < STRANGE_OBJECT || otyp >= NUM_OBJECTS || !(game.obj_descr[(game.objects[otyp]).oc_name_idx].oc_name)) {
        res = nextobuf();
        res = sprintf(res, "glorkum[%d]", otyp);
        await impossible("safe_typename: %s", res);
    } else {
        /* force it to be treated as fully discovered */
        save_nameknown = game.objects[otyp].oc_name_known;
        game.objects[otyp].oc_name_known = 1;
        res = await simple_typename(otyp);
        game.objects[otyp].oc_name_known = save_nameknown;
    }
    return res;
}
export function obj_is_pname(obj) {
    if (!obj.oartifact || !((obj).oextra && ((obj).oextra.oname))) {
        return (0);
    }
    if (!game.program_state.gameover && !game.iflags.override_ID) {
        if (not_fully_identified(obj)) {
            return (0);
        }
    }
    return (1);
}
/* Give the name of an object seen at a distance.  Unlike xname/doname,
   we usually don't want to set dknown if it's not set already. */
/* object to be formatted */
/* formatting routine (usually xname or doname) */
export async function distant_name(obj, func) {
    let str = null;
    let save_oid = 0;
    let ox = 0;
    let oy = 0;
    /*
         * (r * r): square of the x or y distance;
         * (r * r) * 2: sum of squares of both x and y distances
         * (r * r) * 2 - r: instead of a square extending from the hero,
         * round the corners (so shorter distance imposed for diagonal).
         *
         * distu() matrix covering a range of 3+ for one quadrant:
         *  16 17  -  -  -
         *   9 10 13 18  -
         *   4  5  8 13  -
         *   1  2  5 10 17
         *   @  1  4  9 16
         * Theoretical r==1 would yield 1.
         * r==2 yields 6, functionally equivalent to 5, a knight's jump,
         * r==3, the xray range of the Eyes of the Overworld, yields 15.
         */
    let r = (game.u.xray_range > 2) ? game.u.xray_range : 2;
    let neardist = (r * r) * 2 - r;
    /* setting o_id to 0 prevents xname() from adding T-shirt or apron
      slogan, Hawaiian shirt motif, or candy wrapper label when called
      with 'program_state.gameover' set; we want this suppression for
      html-dump (not implemented in nethack) to prevent object-on-map
      tooltips from including that extra text; also guards against a
      potential change to minimal_xname() [indirectly used by attribute
      disclosure] that propagates o_id rather than leave it 0, and
      against a potential extra chance to browse the map with getpos()
      during final disclosure (not currently implemented, nor planned) */
    save_oid = obj.o_id;
    if (game.program_state.gameover) {
        obj.o_id = 0;
    }
    if (get_obj_location(obj, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0) && ((game.viz_array[oy][ox] & 2) != 0) && (obj.oartifact || dist2((ox), (oy), game.u.ux, game.u.uy) <= neardist)) {
        str = await (func)(obj);
    } else {
        /* prior to 3.6.1, this used to save current blindness state,
           explicitly set state to hero-is-blind, make the call (which
           won't set obj->dknown when blind), then restore the saved
           value; but the Eyes of the Overworld override blindness and
           would let characters wearing them get obj->dknown set for
           distant items, so the external flag was added */
        ++game.distantname;
        str = await (func)(obj);
        --game.distantname;
    }
    obj.o_id = save_oid;
    return str;
}
/* convert player specified fruit name into corresponding fruit juice name
   ("slice of pizza" -> "pizza juice" rather than "slice of pizza juice") */
/* whether or not to append " juice" to the name */
export async function fruitname(juice) {
    let buf = nextobuf();
    let fruit_nam = strstri(game.pl_fruit, " of ");
    if (fruit_nam) {
        fruit_nam = __nh_advance_str(fruit_nam, 4);
    } else {
        fruit_nam = game.pl_fruit;
    }
    buf = sprintf(buf, "%s%s", await makesingular(fruit_nam), juice ? " juice" : "");
    return buf;
}
/* look up a named fruit by index (1..127) */
export function fruit_from_indx(indx) {
    let f = null;
    for (f = game.ffruit; f; f = f.nextf) {
        if (f.fid == indx) {
            break;
        }
    }
    return f;
}
/* look up a named fruit by name */
/* False: prefix or exact match, True: exact match only */
/* optional output; only valid if 'fname' isn't found */
export async function fruit_from_name(fname, exact, highest_fid) {
    let f = null;
    let tentativef = null;
    let altfname = null;
    let k = 0;
    /*
     * note: named fruits are case-sensitive...
     */
    if (highest_fid) {
        highest_fid.value = 0;
    }
    /* first try for an exact match */
    for (f = game.ffruit; f; f = f.nextf) {
        if (!strcmp(f.fname, fname)) {
            return f;
        } else if (highest_fid && f.fid > highest_fid.value) {
            highest_fid.value = f.fid;
        }
    }
    if (!exact) {
        /* didn't match as-is; if caller is willing to accept a prefix
       match, try to find one; we want to find the longest prefix that
       matches, not the first */
        tentativef = null;
        for (f = game.ffruit; f; f = f.nextf) {
            k = await Strlen_(f.fname, "fruit_from_name", 470);
            if (!strncmp(f.fname, fname, k) && (!__nh_char_at0(__nh_advance_str(fname, k)) || __nh_char_at0(__nh_advance_str(fname, k)) == 32) && (!tentativef || k > strlen(tentativef.fname))) {
                tentativef = f;
            }
        }
        f = tentativef;
    }
    if (!f) {
        altfname = await makesingular(fname);
        for (f = game.ffruit; f; f = f.nextf) {
            if (!strcmp(f.fname, altfname)) {
                /* depends on order of the dragon scales objects */
                /* normally "partly eaten" is supplied by doname() when
               appropriate and omitted by xname(); shrink_glob() wants
               it but uses Yname2() -> yname() -> xname() rather than
               doname() so we've added an external flag to request it */
                /* 5.0 added "medium" to replace no-prefix */
                /* ammo for a bow: "in quiver" */
                /* small, non-bow: "in quiver pouch" */
                break;
            }
        }
        releaseobuf(altfname);
    }
    if (!f && !exact) {
        let fnamebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let p = null;
        let fname_k = await Strlen_(fname, "fruit_from_name", 490);
        tentativef = null;
        for (f = game.ffruit; f; f = f.nextf) {
            k = await Strlen_(f.fname, "fruit_from_name", 494);
            fnamebuf = strcpy(fnamebuf, fname);
            if (fname_k >= k && (p = strchr(fnamebuf[k], 32)) != null) {
                /* reload fnamebuf[] each iteration in case it gets modified;
               there's no need to recalculate fname_k */
                /* bug? if singular of fname is longer than plural,
               failing the 'fname_k > k' test could skip a viable
               candidate; unfortunately, we can't singularize until
               after stripping off trailing stuff and we can't get
               accurate fname_k until fname has been singularized;
               compromise and use 'fname_k >= k' instead of '>',
               accepting 1 char length discrepancy without risking
               false match (I hope...) */
                /* truncate at 1st space past length of f->fname */
                fnamebuf = nh_strchr_truncate(fnamebuf, 32, 'chr', k);
                altfname = await makesingular(fnamebuf);
                k = await Strlen_(altfname, "fruit_from_name", 509);
                if (!strcmp(f.fname, altfname) && (!tentativef || k > strlen(tentativef.fname))) {
                    tentativef = f;
                }
                /* avoid churning through all obufs */
                releaseobuf(altfname);
            }
        }
        f = tentativef;
    }
    return f;
}
/* sort the named-fruit linked list by fruit index number */
export async function reorder_fruit(forward) {
    let f = null;
    let allfr = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    let i = 0;
    let j = 0;
    let k = (Math.trunc(1024 /* sizeof(struct fruit *[128]) */ / 8 /* sizeof(struct fruit *) */));
    for (i = 0; i < k; ++i) {
        allfr[i] = null;
    }
    for (f = game.ffruit; f; f = f.nextf) {
        /* without sanity checking, this would reduce to 'allfr[f->fid]=f' */
        j = f.fid;
        if (j < 1 || j >= k) {
            await impossible("reorder_fruit: fruit index (%d) out of range", j);
            /* don't sort after all; should never happen... */
            return;
        } else if (allfr[j]) {
            await impossible("reorder_fruit: duplicate fruit index (%d)", j);
            return;
        }
        allfr[j] = f;
    }
    /* reset linked list; we're rebuilding it from scratch */
    game.ffruit = null;
    for (i = 1; i < k; ++i) {
        /* slot [0] will always be empty; must start 'i' at 1 to avoid
       [k - i] being out of bounds during first iteration */
        /* for forward ordering, go through indices from high to low;
           for backward ordering, go from low to high */
        j = forward ? (k - i) : i;
        if (allfr[j]) {
            allfr[j].nextf = game.ffruit;
            game.ffruit = allfr[j];
        }
    }
}
/* add "<pfx> called <sfx>" to end of buf, truncating if necessary */
/* eos(obuf) or eos(&obuf[PREFIX]) */
/* BUFSZ or BUFSZ-PREFIX */
/* usually class string, sometimes more specific */
/* user assigned type name */
export async function xcalled(buf, siz, pfx, sfx) {
    let bufsiz = siz - 1 - strlen(buf);
    let pfxlen = (strlen(pfx) + 9 /* sizeof(char [9]) */ - 1 /* sizeof(char [1]) */);
    if (pfxlen > bufsiz) {
        await panic("xcalled: not enough room for prefix (%d > %d)", pfxlen, bufsiz);
    }
    buf = __nh_buf_append(buf, sprintf('', "%s called %.*s", pfx, bufsiz - pfxlen, sfx));
}
export async function xname(obj) {
    return await xname_flags(obj, 0);
}
/* bitmask of CXN_xxx values */
let __xname_flags_xname_full = 0;
__nh_register_static(() => { __xname_flags_xname_full = 0; });
export async function xname_flags(obj, cxn_flags) {
    let buf = null;
    let obufp = null;
    let buf_end = null;
    let buf_eos = null;
    let bufspaceleft = 0;
    let typ = obj.otyp;
    let ocl = game.objects[typ];
    let nn = ocl.oc_name_known;
    let omndx = obj.corpsenm;
    let actualn = (game.obj_descr[(ocl).oc_name_idx].oc_name);
    let dn = (game.obj_descr[(ocl).oc_descr_idx].oc_descr);
    let un = ocl.oc_uname;
    let pluralize = (obj.quan != 1) && !(cxn_flags & 1);
    let known = 0;
    let dknown = 0;
    let bknown = 0;
    /* some callers [aobjnam()] rely on prefix area that xname() sets aside */
    game.xnamep = nextobuf();
    buf = new Array(176).fill(0);
    buf_end = 175;
    /* patched: fixed-capacity char array instead of broken pointer
       arithmetic; xnamep+80 was string-concat, throwing on buf[0]=0 */
    void 0;
    buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
    if ((game.urole.mnum == (PM_SAMURAI))) {
        /* set buf_eos and bufspaceleft */
        actualn = Japanese_item_name(typ, actualn);
        if (typ == WOODEN_HARP || typ == MAGIC_HARP) {
            dn = "koto";
        }
    }
    if (!actualn) {
        actualn = (typ > 0 && typ < MAXOCLASSES) ? "generic" : "object?";
    }
    /* 3.6.2: this used to be part of 'dn's initialization, but it
       needs to come after possibly overriding 'actualn' */
    if (!dn) {
        dn = actualn;
    }
    /*
     * clean up known when it's tied to oc_name_known, eg after AD_DRIN
     * This is only required for unique objects since the article
     * printed for the object is tied to the combination of the two
     * and printing the wrong article gives away information.
     */
    if (!nn && ocl.oc_uses_known && ocl.oc_unique) {
        obj.known = 0;
    }
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !game.distantname) {
        await observe_object(obj);
    }
    /* if character is a priest[ess], bknown will get toggled back on */
    /* describe holy/unholy water as such */
    if ((game.urole.mnum == (PM_CLERIC))) {
        obj.bknown = 1;
    }
    if (game.iflags.override_ID) {
        /* avoid set_bknown() to bypass update_inventory() */
        known = dknown = bknown = (1);
        nn = 1;
    } else {
        known = obj.known;
        dknown = obj.dknown;
        bknown = obj.bknown;
    }
    if (obj.oartifact && obj.dknown) {
        await find_artifact(obj);
    }
    let __is_pname = obj_is_pname(obj);
    if (!__is_pname) {
    switch (obj.oclass) {
        case AMULET_CLASS:
            if (!dknown) {
                buf = strcpy(buf, "amulet");
            } else if (typ == AMULET_OF_YENDOR || typ == FAKE_AMULET_OF_YENDOR) {
                buf = strcpy(buf, known ? actualn : dn);
            } else if (nn) {
                buf = strcpy(buf, actualn);
            } else if (un) {
                await xcalled(buf, 256 - 80, "amulet", un);
            } else {
                buf = sprintf(buf, "%s amulet", dn);
            }
            break;
        /* it's possible for a rusty weptool to be polymorphed into some
           non-weptool iron tool, in which case the rust implicitly goes
           away, but it's also possible for it to be polymorphed into a
           non-iron tool, in which case rust also implicitly goes away,
           so there's no particular reason to try to handle the first
           instance differently [this comment belongs in poly_obj()...] */
        case WEAPON_CLASS:
            if (((obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || permapoisoned(obj)) && obj.otrapped) {
                buf = strcpy(buf, "poisoned ");
            }
            ;
        case VENOM_CLASS:
        case TOOL_CLASS:
            if (typ == LENSES) {
                buf = strcpy(buf, "pair of ");
            } else if (((obj).otyp == TOWEL && (obj).spe > 0)) {
                buf = strcpy(buf, (obj.spe < 3) ? "moist " : "wet ");
            }
            if (!dknown) {
                buf = strcat(buf, dn);
            } else if (nn) {
                buf = strcat(buf, actualn);
            } else if (un) {
                await xcalled(buf, 256 - 80, dn, un);
            } else {
                buf = strcat(buf, dn);
            }
            buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
            if (typ == FIGURINE && omndx != NON_PM) {
                /* note: lenses or towel prefix would overwrite poisoned weapon
           prefix if both were simultaneously possible, but they aren't */
                /* [4] would be enough: 'a','n',' ','\0' */
                let anbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let pm_name = await obj_pmname(obj);
                do {
                    buf = coerceCStr(buf) + nh_snprintf("xname_flags", 713, '', bufspaceleft + 0, " of %s%s", just_an(anbuf, pm_name), pm_name);
                    buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                } while (0);
            } else if (((obj).otyp == TOWEL && (obj).spe > 0)) {
                if (game.flags.debug) {
                    do {
                        buf = coerceCStr(buf) + nh_snprintf("xname_flags", 716, '', bufspaceleft + 0, " (%d)", obj.spe);
                        buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                    } while (0);
                }
            }
            break;
        case ARMOR_CLASS:
            if (typ >= GRAY_DRAGON_SCALES && typ <= YELLOW_DRAGON_SCALES) {
                buf = sprintf(buf, "set of %s", actualn);
                break;
            } else if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_BOOTS) || (obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_GLOVES)) {
                buf = strcpy(buf, "pair of ");
            } else if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SHIELD) && !dknown) {
                if (obj.otyp >= ELVEN_SHIELD && obj.otyp <= ORCISH_SHIELD) {
                    buf = strcpy(buf, "shield");
                    break;
                } else if (obj.otyp == SHIELD_OF_REFLECTION) {
                    buf = strcpy(buf, "smooth shield");
                    break;
                }
            }
            buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
            if (nn) {
                do {
                    buf = strncat(coerceCStr(buf), actualn, bufspaceleft + 0);
                    buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                } while (0);
            } else if (un) {
                await xcalled(buf, 256 - 80, await armor_simple_name(obj), un);
            } else {
                do {
                    buf = strncat(coerceCStr(buf), dn, bufspaceleft + 0);
                    buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                } while (0);
            }
            break;
        case FOOD_CLASS:
            if (typ == SLIME_MOLD) {
                /* we could include partly-eaten-hack on fruit but don't need to */
                let f = fruit_from_indx(obj.spe);
                if (!f) {
                    await impossible("Bad fruit #%d?", obj.spe);
                    buf = strcpy(buf, "fruit");
                } else {
                    buf = strcpy(buf, f.fname);
                    if (pluralize) {
                        buf = strcpy(buf, obufp = await makesingular(buf));
                        /* fruit name is limited in length to PL_FSIZ; converting
                   to/from singular/plural might increase the length a
                   little but not enough to pose a risk of overflowing buf */
                        /* ick: already pluralized fruit names are allowed--we
                       want to try to avoid adding a redundant plural suffix;
                       double ick: makesingular() and makeplural() each use
                       and return an obuf but we don't want any particular
                       xname() call to consume more than one of those
                       [note: makeXXX() will be fully evaluated and done with
                       'buf' before strcpy() touches its output buffer] */
                        /* reset buf_eos and bufspaceleft */
                        /* 'simpleoname' points to an obuf; makeplural() will allocate
           another one and only that one can be explicitly released for
           re-use, so this is slightly convoluted to cope with that;
           makeplural() will be fully evaluated and done with its input
           argument before strcpy() touches its output argument */
                        releaseobuf(obufp);
                        buf = strcpy(buf, obufp = await makeplural(buf));
                        releaseobuf(obufp);
                        pluralize = (0);
                    }
                }
                break;
            }
            if (game.iflags.partly_eaten_hack && obj.oeaten) {
                do {
                    buf = strncat(coerceCStr(buf), "partly eaten ", bufspaceleft + 0);
                    buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                } while (0);
            }
            if (obj.globby) {
                do {
                    buf = coerceCStr(buf) + nh_snprintf("xname_flags", 788, '', bufspaceleft + 0, "%s %s", (obj.owt <= 100) ? "small" : (obj.owt <= 300) ? "medium" : (obj.owt <= 500) ? "large" : "very large", actualn);
                    buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                } while (0);
                break;
            }
            do {
                buf = strncat(coerceCStr(buf), actualn, bufspaceleft + 0);
                buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
            } while (0);
            if (typ == TIN && known) {
                buf = tin_details(obj, omndx, buf);
            }
            break;
        case COIN_CLASS:
        case CHAIN_CLASS:
            buf = strcpy(buf, actualn);
            break;
        case ROCK_CLASS:
            if (typ == STATUE && omndx != NON_PM) {
                let anbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let statue_pmname = await obj_pmname(obj);
                buf = nh_snprintf("xname_flags", 813, buf, bufspaceleft, "%s%s of %s%s", ((game.urole.mnum == (PM_ARCHEOLOGIST)) && (obj.spe & 4) != 0) ? "historic " : "", actualn, (((game.mons[omndx]).mflags2 & 524288) != 0) ? "" : the_unique_pm(game.mons[omndx]) ? "the " : just_an(anbuf, statue_pmname), statue_pmname);
            } else if (typ == BOULDER && obj.corpsenm == 1) {
                strcat(strcpy(buf, "next "), actualn);
                /* sometimes caller wants "next boulder" rather than just
               "boulder" (when pushing against a pile of more than one);
               originally we just tested for non-0 but checking for 1 is
               more robust because the default value for that overloaded
               field (obj->corpsenm) is NON_PM (-1) rather than 0 */
                /* once "next boulder" occurs, subsequent messages should just
               use ordinary "boulder" */
                obj.corpsenm = 0;
            } else {
                buf = strcpy(buf, actualn);
            }
            break;
        case BALL_CLASS:
            buf = sprintf(buf, "%sheavy iron ball", (obj.owt > ocl.oc_weight) ? "very " : "");
            break;
        case POTION_CLASS:
            if (dknown && obj.oeroded) {
                buf = strcpy(buf, "diluted ");
            }
            if (nn || un || !dknown) {
                buf = strcat(buf, "potion");
                if (!dknown) {
                    break;
                }
                if (nn) {
                    buf = strcat(buf, " of ");
                    if (typ == POT_WATER && bknown && (obj.blessed || obj.cursed)) {
                        buf = strcat(buf, obj.blessed ? "holy " : "unholy ");
                    }
                    buf = strcat(buf, actualn);
                } else {
                    await xcalled(buf, 256 - 80, "", un);
                }
            } else {
                buf = strcat(buf, dn);
                buf = strcat(buf, " potion");
            }
            break;
        case SCROLL_CLASS:
            buf = strcpy(buf, "scroll");
            if (!dknown) {
                break;
            }
            if (nn) {
                buf = strcat(buf, " of ");
                buf = strcat(buf, actualn);
            } else if (un) {
                await xcalled(buf, 256 - 80, "", un);
            } else if (ocl.oc_magic) {
                buf = strcat(buf, " labeled ");
                buf = strcat(buf, dn);
            } else {
                buf = strcpy(buf, dn);
                buf = strcat(buf, " scroll");
            }
            break;
        case WAND_CLASS:
            if (!dknown) {
                buf = strcpy(buf, "wand");
            } else if (nn) {
                buf = sprintf(buf, "wand of %s", actualn);
            } else if (un) {
                await xcalled(buf, 256 - 80, "wand", un);
            } else {
                buf = sprintf(buf, "%s wand", dn);
            }
            break;
        case SPBOOK_CLASS:
            if (typ == SPE_NOVEL) {
                if (!dknown) {
                    buf = strcpy(buf, "book");
                } else if (nn) {
                    buf = strcpy(buf, actualn);
                } else if (un) {
                    await xcalled(buf, 256 - 80, "novel", un);
                } else {
                    buf = sprintf(buf, "%s book", dn);
                }
                break;
            } else if (!dknown) {
                buf = strcpy(buf, "spellbook");
            } else if (nn) {
                if (typ != SPE_BOOK_OF_THE_DEAD) {
                    buf = strcpy(buf, "spellbook of ");
                }
                buf = strcat(buf, actualn);
            } else if (un) {
                await xcalled(buf, 256 - 80, "spellbook", un);
            } else {
                buf = sprintf(buf, "%s spellbook", dn);
            }
            break;
        case RING_CLASS:
            if (!dknown) {
                buf = strcpy(buf, "ring");
            } else if (nn) {
                buf = sprintf(buf, "ring of %s", actualn);
            } else if (un) {
                await xcalled(buf, 256 - 80, "ring", un);
            } else {
                buf = sprintf(buf, "%s ring", dn);
            }
            break;
        case GEM_CLASS:
{
                let rock = (ocl.oc_material == MINERAL) ? "stone" : "gem";
                if (!dknown) {
                    buf = strcpy(buf, rock);
                } else if (!nn) {
                    if (un) {
                        await xcalled(buf, 256 - 80, rock, un);
                    } else {
                        buf = sprintf(buf, "%s %s", dn, rock);
                    }
                } else {
                    buf = strcpy(buf, actualn);
                    if ((typ == FLINT || (game.objects[typ].oc_material == GEMSTONE && (typ != DILITHIUM_CRYSTAL && typ != RUBY && typ != DIAMOND && typ != SAPPHIRE && typ != BLACK_OPAL && typ != EMERALD && typ != OPAL)))) {
                        buf = strcat(buf, " stone");
                    }
                }
                break;
            }
        default:
            buf = sprintf(buf, "glorkum %d %d %d", obj.oclass, typ, obj.spe);
            await impossible("xname_flags: %s", buf);
            break;
    }
    /* check whether we've already gone out of bounds of the obuf[], prior
       to pluralization and end-of-game shirt and apron text */
    /* pointer to '\0' terminator somewhere in obuf[] */
    buf_eos = eos(buf);
    if (buf_eos > buf_end) {
        /* PREFIX is bigger than 6 so there will always be room within the
           obuf[] in front of buf to insert "buf[]="; strncpy(,,N) doesn't
           add '\0' terminator unless fewer than N chars are copied, which
           is what we want, but gcc complains about that so use memcpy() */
        paniclog("xname", memcpy(buf - 6, "buf[]=", 6));
        await panic("xname: buffer overflow before appending name.");
    }
    bufspaceleft = 256 - 1 - strlen(buf);
    if (pluralize) {
        obufp = await makeplural(buf);
        /* replace the whole string */
        buf = __nh_char_write(buf, 0, 0);
        buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
        do {
            buf = strncat(coerceCStr(buf), obufp, bufspaceleft + 0);
            buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
        } while (0);
        releaseobuf(obufp);
    }
    if (game.program_state.gameover && obj.o_id && bufspaceleft > 0) {
        /* give some extra information when game is over; for end-of-game
       attribute disclosure in wizard mode, ysimple_name() calls
       minimal_xname() which passes us a dummy object with o_id==0;
       tshirt_text(), apron_text(), and so forth base their result on
       o_id and would give inconsistent information compared to what
       just got shown for inventory disclosure; fortunately, we want to
       avoid the 'with text' part of
           "You were acid resistant because of your alchemy smock \
           with text \"Kiss the cook\"."
       when disclosing attributes anyway */
        let lbl = null;
        let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        switch (obj.otyp) {
            /* disclose without breaking illiterate conduct, but mainly tip off
           players who aren't aware that something readable is present */
            case T_SHIRT:
            case ALCHEMY_SMOCK:
                do {
                    buf = coerceCStr(buf) + nh_snprintf("xname_flags", 982, '', bufspaceleft + 0, " with text \"%s\"", (obj.otyp == T_SHIRT) ? tshirt_text(obj, tmpbuf) : apron_text(obj, tmpbuf));
                    buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                } while (0);
                break;
            case CANDY_BAR:
                lbl = candy_wrapper_text(obj);
                if (__nh_char_at0(lbl)) {
                    do {
                        buf = coerceCStr(buf) + nh_snprintf("xname_flags", 987, '', bufspaceleft + 0, " labeled \"%s\"", lbl);
                        buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                    } while (0);
                }
                break;
            case HAWAIIAN_SHIRT:
                do {
                    buf = coerceCStr(buf) + nh_snprintf("xname_flags", 991, '', bufspaceleft + 0, " with %s motif", await an(hawaiian_motif(obj, tmpbuf)));
                    buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
                } while (0);
                break;
            default:
                break;
        }
    }
    }
    if (__is_pname || (((obj).oextra && ((obj).oextra.oname)) && dknown)) {
        if (!__is_pname) {
            do {
                buf = strncat(coerceCStr(buf), " named ", bufspaceleft + 0);
                buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
            } while (0);
        }
        obufp = eos(buf);
        do {
            buf = strncat(coerceCStr(buf), ((obj).oextra.oname), bufspaceleft + 0);
            buf_eos = eos(buf) , bufspaceleft = 256 - 1 - strlen(buf);
        } while (0);
        /* jump directly here if obj passes the has-personal-name test */
        /* remember where the name will start */
        /* downcase "The" in "<quest-artifact-item> named The ..." */
        if (obj.oartifact && !strncmp(obufp, "The ", 4)) {
            obufp = (() => { const __s = obufp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toLowerCase() + __t.slice(1) : __s; })();
        }
    }
    if (!strncmpi(buf, "the ", 4)) {
        buf = __nh_advance_str(buf, 4);
    }
    buf_eos = eos(buf);
    if (buf_eos >= buf_end) {
        if (!__xname_flags_xname_full++) {
            /* change 'T' in "The " to 't' */
            /* ('>' shouldn't be possible) */
            /* we want a record of something needing more buffer space than
           anticipated; since we aren't panicking here, this could happen
           repeatedly and we don't want to spam the paniclog file */
            paniclog("xname", memcpy(buf - 6, "buf[]=", 6));
            /* 'PREFIX' ought to be 'PREFIX+4' if we stripped leading "the" */
            paniclog("xname", "used up entire obuf[PREFIX..BUFSX-1]");
        }
    }
    return buf;
}
/* similar to simple_typename but minimal_xname operates on a particular
   object rather than its general type; it formats the most basic info:
     potion                     -- if description not known
     brown potion               -- if oc_name_known not set
     potion of object detection -- if discovered
 */
export async function minimal_xname(obj) {
    let bufp = null;
    let bareobj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let saveobcls = { oc_name_idx: 0, oc_descr_idx: 0, oc_uname: null, oc_name_known: 0, oc_merge: 0, oc_uses_known: 0, oc_encountered: 0, oc_magic: 0, oc_charged: 0, oc_unique: 0, oc_nowish: 0, oc_big: 0, oc_tough: 0, oc_spare1: 0, oc_dir: 0, oc_material: 0, oc_subtyp: 0, oc_oprop: 0, oc_class: 0, oc_delay: 0, oc_color: 0, oc_prob: 0, oc_weight: 0, oc_cost: 0, oc_wsdam: 0, oc_wldam: 0, oc_oc1: 0, oc_oc2: 0, oc_nutrition: 0, oc_sell_minseen: 0, oc_sell_maxseen: 0, oc_buy_minseen: 0, oc_buy_maxseen: 0 };
    let otyp = obj.otyp;
    /* suppress user-supplied name */
    saveobcls.oc_uname = game.objects[otyp].oc_uname;
    game.objects[otyp].oc_uname = null;
    /* suppress actual name if object's description is unknown */
    saveobcls.oc_name_known = game.objects[otyp].oc_name_known;
    if (game.iflags.override_ID) {
        game.objects[otyp].oc_name_known = 1;
    } else if (!obj.dknown) {
        game.objects[otyp].oc_name_known = 0;
    }
    /* caveat: this makes a lot of assumptions about which fields
       are required in order for xname() to yield a sensible result */
    Object.assign(bareobj, cg.zeroobj);
    bareobj.otyp = otyp;
    bareobj.oclass = obj.oclass;
    /* not observe_object, either the hero observed the object already or this
       is overriding ID and shouldn't discover the object */
    bareobj.dknown = (obj.dknown || game.iflags.override_ID) ? 1 : 0;
    /* suppress known except for amulets (needed for fakes and real A-of-Y) */
    bareobj.known = (obj.oclass == AMULET_CLASS) ? obj.known : !game.objects[otyp].oc_uses_known;
    bareobj.quan = 1;
    /* for a boulder, leave corpsenm as 0; non-zero produces "next boulder" */
    if (otyp != BOULDER) {
        bareobj.corpsenm = NON_PM;
    }
    /* suppress statue and figurine details */
    /* but suppressing fruit details leads to "bad fruit #0"
       [perhaps we should force "slime mold" rather than use xname?] */
    if (obj.otyp == SLIME_MOLD) {
        bareobj.spe = obj.spe;
    }
    bufp = await distant_name(bareobj, xname);
    /* undo forced setting of bareobj.blessed for cleric (priest[ess]);
       bufp is an obuf[] so a pointer into the middle of that is viable */
    if (!strncmp(bufp, "uncursed ", 9)) {
        bufp = __nh_advance_str(bufp, 9);
    }
    game.objects[otyp].oc_uname = saveobcls.oc_uname;
    game.objects[otyp].oc_name_known = saveobcls.oc_name_known;
    return bufp;
}
/* xname() output augmented for multishot missile feedback */
export async function mshot_xname(obj) {
    let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let onm = await xname(obj);
    if (game.m_shot.n > 1 && game.m_shot.o == obj.otyp) {
        tmpbuf = sprintf(tmpbuf, "the %d%s ", game.m_shot.i, ordin(game.m_shot.i));
        onm = await strprepend(onm, tmpbuf);
    }
    return onm;
}
/* used for naming "the unique_item" instead of "a unique_item" */
export function the_unique_obj(obj) {
    let known = (obj.known || game.iflags.override_ID);
    if (!obj.dknown && !game.iflags.override_ID) {
        return (0);
    } else if (obj.otyp == FAKE_AMULET_OF_YENDOR && !known) {
        /* skip "ox" -> "oxen" entry when pluralizing "<something>ox"
       unless it is muskox */
        return (1);
    } else {
        return (game.objects[obj.otyp].oc_unique && (known || obj.otyp == AMULET_OF_YENDOR));
    }
}
/* should monster type be prefixed with "the"? (mostly used for corpses) */
export function the_unique_pm(ptr) {
    let uniq = 0;
    /* even though monsters with personal names are unique, we want to
       describe them as "Name" rather than "the Name" */
    if ((((ptr).mflags2 & 524288) != 0)) {
        return (0);
    }
    uniq = (ptr.geno & 4096) ? (1) : (0);
    /* high priest is unique if it includes "of <deity>", otherwise not
       (caller needs to handle the 1st possibility; we assume the 2nd);
       worm tail should be irrelevant but is included for completeness */
    if (ptr == game.mons[PM_HIGH_CLERIC] || ptr == game.mons[PM_LONG_WORM_TAIL]) {
        uniq = (0);
    }
    /* Wizard no longer needs this; he's flagged as unique these days */
    if (ptr == game.mons[PM_WIZARD_OF_YENDOR]) {
        uniq = (1);
    }
    return uniq;
}
export function add_erosion_words(obj, prefix) {
    let iscrys = (obj.otyp == CRYSKNIFE);
    let rknown = 0;
    rknown = (game.iflags.override_ID == 0) ? obj.rknown : (1);
    if (!((game.objects[obj.otyp].oc_material == IRON) || is_flammable(obj) || is_rottable(obj) || (game.objects[obj.otyp].oc_material == COPPER || game.objects[obj.otyp].oc_material == IRON) || (game.objects[(obj).otyp].oc_material == GLASS && (obj).oclass == ARMOR_CLASS)) && !iscrys) {
        return;
    }
    if (obj.oeroded && !iscrys) {
        switch (obj.oeroded) {
            /* The only cases where any of these bits do double duty are for
     * rotted food and diluted potions, which are all not is_damageable().
     */
            case 2:
                prefix = strcat(prefix, "very ");
                break;
            case 3:
                prefix = strcat(prefix, "thoroughly ");
                break;
        }
        prefix = strcat(prefix, (game.objects[obj.otyp].oc_material == IRON) ? "rusty " : (game.objects[(obj).otyp].oc_material == GLASS && (obj).oclass == ARMOR_CLASS) ? "cracked " : "burnt ");
    }
    if (obj.oeroded2 && !iscrys) {
        switch (obj.oeroded2) {
            case 2:
                prefix = strcat(prefix, "very ");
                break;
            case 3:
                prefix = strcat(prefix, "thoroughly ");
                break;
        }
        prefix = strcat(prefix, (game.objects[obj.otyp].oc_material == COPPER || game.objects[obj.otyp].oc_material == IRON) ? "corroded " : "rotted ");
    }
    /* note: it is possible for an item to be both eroded and erodeproof
       (cursed scroll of destroy armor read while confused erodeproofs an
       item of armor without repairing existing erosion) */
    if (rknown && obj.oerodeproof) {
        prefix = strcat(prefix, iscrys ? "fixed " : (game.objects[obj.otyp].oc_material == IRON) ? "rustproof " : (game.objects[obj.otyp].oc_material == COPPER || game.objects[obj.otyp].oc_material == IRON) ? "corrodeproof " : is_flammable(obj) ? "fireproof " : (game.objects[(obj).otyp].oc_material == GLASS && (obj).oclass == ARMOR_CLASS) ? "tempered " : is_rottable(obj) ? "rotproof " : "");
    }
}
/* used to prevent rust on items where rust makes no difference */
export function erosion_matters(obj) {
    switch (obj.oclass) {
        case TOOL_CLASS:
            return ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) ? (1) : (0);
        case WEAPON_CLASS:
        case ARMOR_CLASS:
        case BALL_CLASS:
        case CHAIN_CLASS:
            /* one_off[] transformation */
            return (1);
        default:
            break;
    }
    return (0);
}
/* [not used anywhere yet] */
/* core of doname() */
/* object to format */
/* special case requests */
let __doname_base_doname_full = 0;
__nh_register_static(() => { __doname_base_doname_full = 0; });
export async function doname_base(obj, doname_flags) {
    let ispoisoned = (0);
    let with_price = (doname_flags & 1) != 0;
    let vague_quan = (doname_flags & 2) != 0;
    let for_menu = (doname_flags & 4) != 0;
    let known = 0;
    let dknown = 0;
    let cknown = 0;
    let bknown = 0;
    let lknown = 0;
    let fake_arti = 0;
    let force_the = 0;
    let prefix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* for when we have to add something at
                              * the start of prefix instead of the
                              * end (Strcat is used on the end) */
    let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let aname = null;
    let omndx = obj.corpsenm;
    let bp = null;
    let bp_eos = null;
    let bp_end = null;
    let bpspaceleft = 0;
    bp = await xname(obj);
    bp_end = __nh_advance_str(game.xnamep, 256) - 1;
    bp_eos = eos(bp);
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    bpspaceleft = 256 - 1 - strlen(bp);
    if (game.iflags.override_ID) {
        known = dknown = cknown = bknown = lknown = (1);
    } else {
        known = obj.known;
        dknown = obj.dknown;
        cknown = obj.cknown;
        bknown = obj.bknown;
        lknown = obj.lknown;
    }
    if (!strncmp(bp, "poisoned ", 9) && obj.otrapped) {
        /* When using xname, we want "poisoned arrow", and when using
     * doname, we want "poisoned +0 arrow".  This kludge is about the only
     * way to do it, at least until someone overhauls xname() and doname(),
     * combining both into one function taking a parameter.
     */
        /* must check opoisoned--someone can have a weirdly-named fruit */
        /* doesn't affect bp_eos or bpspaceleft */
        bp = __nh_advance_str(bp, 9);
        ispoisoned = (1);
    }
    /* fruits are allowed to be given artifact names; when that happens,
       format the name like the corresponding artifact, which may or may not
       want "the" prefix and when it doesn't, avoid "a"/"an" prefix too */
    fake_arti = (obj.otyp == SLIME_MOLD && (aname = artifact_name(bp, null, (0))) != null);
    force_the = (fake_arti && !strncmpi(aname, "the ", 4));
    prefix[0] = 0;
    if (obj.quan != 1) {
        if (dknown || !vague_quan) {
            prefix = sprintf(prefix, "%ld ", obj.quan);
        } else {
            prefix = strcpy(prefix, "some ");
        }
    } else if (obj.otyp == CORPSE) {
        ;
    } else if (force_the || obj_is_pname(obj) || the_unique_obj(obj)) {
        /* skip article prefix for corpses [else corpse_xname()
           would have to be taught how to strip it off again] */
        if (!strncmpi(bp, "the ", 4)) {
            bp = __nh_advance_str(bp, 4);
        }
        prefix = strcpy(prefix, "the ");
    } else if (!fake_arti) {
        prefix = strcpy(prefix, "a ");
    }
    /* "empty" goes at the beginning, but item count goes at the end */
    if (cknown && ((obj.otyp == BAG_OF_TRICKS || obj.otyp == HORN_OF_PLENTY) ? (obj.spe == 0 && !known) : ((((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) || obj.otyp == STATUE) && !((obj).cobj != null)))) {
        prefix = strcat(prefix, "empty ");
    }
    if (bknown && obj.oclass != COIN_CLASS && (obj.otyp != POT_WATER || !game.objects[POT_WATER].oc_name_known || (!obj.cursed && !obj.blessed))) {
        /* bag of tricks: include "empty" prefix if it's known to
           be empty but its precise number of charges isn't known
           (when that is known, suffix of "(n:0)" will be appended,
           making the prefix be redundant; note that 'known' flag
           isn't set when emptiness gets discovered because then
           charging magic would yield known number of new charges);
           horn of plenty isn't a container but is close enough */
        /* not a bag of tricks or horn of plenty: it's empty if
                it is a container that has no contents */
        /* allow 'blessed clear potion' if we don't know it's holy water;
         * always allow "uncursed potion of water"
         */
        if (obj.cursed) {
            prefix = strcat(prefix, "cursed ");
        } else if (obj.blessed) {
            prefix = strcat(prefix, "blessed ");
        } else if (!game.flags.implicit_uncursed || ((!known || !game.objects[obj.otyp].oc_charged || obj.oclass == ARMOR_CLASS || obj.oclass == RING_CLASS) && obj.otyp != SCR_MAIL && obj.otyp != FAKE_AMULET_OF_YENDOR && obj.otyp != AMULET_OF_YENDOR && !(game.urole.mnum == (PM_CLERIC)))) {
            prefix = strcat(prefix, "uncursed ");
        }
    }
    /* "a large trapped box" would perhaps be more correct; [no!]
       what about ``(obj->tknown && !obj->otrapped)''? shouldn't that
       yield "a non-trapped large box"? (not "an untrapped large box");
       TODO: this should be ``(Is_box(obj) || obj->otyp == TIN) && ...''
       but at present there's no way to set obj->tknown for tins */
    if (((obj).otyp == LARGE_BOX || (obj).otyp == CHEST) && obj.otrapped && obj.tknown && obj.dknown) {
        prefix = strcat(prefix, "trapped ");
    }
    if (lknown && ((obj).otyp == LARGE_BOX || (obj).otyp == CHEST)) {
        /* For most items with charges or +/-, if you know how many
             * charges are left or what the +/- is, then you must have
             * totally identified the item, so "uncursed" is unnecessary,
             * because an identified object not described as "blessed" or
             * "cursed" must be uncursed.
             *
             * If the charges or +/- is not known, "uncursed" must be
             * printed to avoid ambiguity between an item whose curse
             * status is unknown, and an item known to be uncursed.
             */
        if (obj.obroken) {
            prefix = strcat(prefix, "broken ");
        } else if (obj.olocked) {
            prefix = strcat(prefix, "locked ");
        } else {
            prefix = strcat(prefix, "unlocked ");
        }
    }
    if (obj.greased) {
        prefix = strcat(prefix, "greased ");
    }
    if (cknown && ((obj).cobj != null) && bpspaceleft > 0) {
        let itemcount = await count_contents(obj, (0), (0), (1), (0));
        do {
            bp = coerceCStr(bp) + nh_snprintf("doname_base", 1379, '', bpspaceleft + 0, " containing %ld item%s", itemcount, (((itemcount) == 1) ? "" : "s"));
            bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
        } while (0);
    }
    switch (((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) ? WEAPON_CLASS : obj.oclass) {
        case AMULET_CLASS:
            if (obj.owornmask & 65536) {
                do {
                    bp = strncat(coerceCStr(bp), " (being worn)", bpspaceleft + 0);
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
            }
            break;
        case ARMOR_CLASS:
            if (obj.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) {
                do {
                    bp = strncat(coerceCStr(bp), (obj == game.uskin) ? " (embedded in your skin)" : doffing(obj) ? " (being doffed)" : donning(obj) ? " (being donned)" : " (being worn)", bpspaceleft + 0);
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
                if (__nh_char_at0(__nh_advance_str(bp_eos, -1)) == 41) {
                    /* in case of perm_invent update while Wear/Takeoff
                      is in progress; check doffing() before donning()
                      because donning() returns True for both cases */
                    /* we just added a parenthesized phrase, but the right paren
               might be absent if the appended string got truncated */
                    /* slippery fingers is an intrinsic condition of the hero
                   rather than extrinsic condition of objects, but gloves
                   are described as slippery when hero has slippery fingers */
                    /* just appended "(something)",
                                           * replace paren, changing that
                                           * to be "(something; slippery)" */
                    if (obj == game.uarmg && game.u.uprops[GLIB].intrinsic) {
                        do {
                            bp = strncat(coerceCStr(bp).slice(0, -1), "; slippery)", bpspaceleft + 1);
                            bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                        } while (0);
                    }
                }
                if (__nh_char_at0(__nh_advance_str(bp_eos, -1)) == 41) {
                    /* there could be light-emitting artifact gloves someday,
                   so add 'lit' separately from 'slippery' rather than via
                   'else if' after uarmg+Glib */
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && obj.lamplit && artifact_light(obj)) {
                        do {
                            bp = coerceCStr(bp).slice(0, -1) + nh_snprintf("doname_base", 1413, '', bpspaceleft + 1, ", %s lit)", arti_light_description(obj));
                            bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                        } while (0);
                    }
                }
            }
            ;
        case WEAPON_CLASS:
            if (ispoisoned) {
                prefix = strcat(prefix, "poisoned ");
            }
            add_erosion_words(obj, prefix);
            if (known) {
                prefix = __nh_buf_append(prefix, sprintf('', "%+d ", obj.spe));
            }
            break;
        case TOOL_CLASS:
            if (obj.owornmask & (524288 | 1048576)) {
                do {
                    bp = strncat(coerceCStr(bp), " (being worn)", bpspaceleft + 0);
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
                break;
            }
            if (obj.otyp == LEASH && obj.corpsenm != 0) {
                let mlsh = find_mid(obj.corpsenm, 1);
                if (mlsh && !((mlsh).mhp < 1)) {
                    do {
                        bp = coerceCStr(bp) + nh_snprintf("doname_base", 1435, '', bpspaceleft + 0, " (attached to %s)", await noit_mon_nam(mlsh));
                        bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                    } while (0);
                } else {
                    if (mlsh) {
                        await impossible("leashed %s #%u is dead", mon_pmname(mlsh), obj.corpsenm);
                    } else {
                        await impossible("leashed monster #%u not found", obj.corpsenm);
                    }
                    obj.corpsenm = 0;
                }
                break;
            }
            if (obj.otyp == CANDELABRUM_OF_INVOCATION) {
                /* longest value is "s attached" */
                let suffix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                suffix = sprintf(suffix, "%s%s", (((obj.spe) == 1) ? "" : "s"), !obj.lamplit ? " attached" : ", lit");
                do {
                    bp = coerceCStr(bp) + nh_snprintf("doname_base", 1453, '', bpspaceleft + 0, " (%d of 7 candle%s)", obj.spe, suffix);
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
                break;
            } else if (obj.otyp == OIL_LAMP || obj.otyp == MAGIC_LAMP || obj.otyp == BRASS_LANTERN || (obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE)) {
                if ((obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE)) {
                    /* separately formatted suffix avoids need for ConcatF3() */
                    let timer = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
                    let full_burn_time = 20 * game.objects[obj.otyp].oc_cost;
                    let turns_left = obj.age;
                    if (obj.lamplit) {
                        Object.assign(timer, cg.zeroany);
                        timer.a_obj = obj;
                        /* without this, wishing for "lit candle" yields
                       "partly used candle (lit)" because the time it can
                       burn gets adjusted when it becomes lit; matters for
                       the message as it gets added to invent and also if it
                       gets snuffed out immediately (where it will end up as
                       not partly used after all) */
                        turns_left += peek_timer(BURN_OBJECT, timer) - game.moves;
                    }
                    if (turns_left < full_burn_time) {
                        prefix = strcat(prefix, "partly used ");
                    }
                }
                if (obj.lamplit) {
                    do {
                        bp = strncat(coerceCStr(bp), " (lit)", bpspaceleft + 0);
                        bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                    } while (0);
                }
                break;
            }
            if (game.objects[obj.otyp].oc_charged) {
                if (known) {
                    do {
                        bp = coerceCStr(bp) + nh_snprintf("doname_base", 1486, '', bpspaceleft + 0, " (%d:%d)", obj.recharged, obj.spe);
                        bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                    } while (0);
                }
            }
            break;
        case WAND_CLASS:
            if (known) {
                do {
                    bp = coerceCStr(bp) + nh_snprintf("doname_base", 1486, '', bpspaceleft + 0, " (%d:%d)", obj.recharged, obj.spe);
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
            }
            break;
        case POTION_CLASS:
            if (obj.otyp == POT_OIL && obj.lamplit) {
                do {
                    bp = strncat(coerceCStr(bp), " (lit)", bpspaceleft + 0);
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
            }
            break;
        case RING_CLASS:
            if (obj.owornmask & 262144) {
                do {
                    bp = strncat(coerceCStr(bp), " (on right ", bpspaceleft + 0);
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
            }
            /* normal rings reach here 'naturally'; meat ring jumps here */
            if (obj.owornmask & 131072) {
                do {
                    bp = strncat(coerceCStr(bp), " (on left ", bpspaceleft + 0);
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
            }
            if (obj.owornmask & (131072 | 262144)) {
                do {
                    bp = coerceCStr(bp) + nh_snprintf("doname_base", 1499, '', bpspaceleft + 0, "%s)", await body_part(HAND));
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
            }
            if (known && game.objects[obj.otyp].oc_charged) {
                prefix = __nh_buf_append(prefix, sprintf('', "%+d ", obj.spe));
            }
            break;
        case FOOD_CLASS:
            if (obj.oeaten) {
                prefix = strcat(prefix, "partly eaten ");
            }
            if (obj.otyp == CORPSE) {
                /* (quan == 1) => want corpse_xname() to supply article,
               (quan != 1) => already have count or "some" as prefix;
               "corpse" is already in the buffer returned by xname() */
                let cxarg = (((obj.quan != 1) ? 0 : 8) | 16);
                let cxstr = null;
                let save_xnamep = null;
                /* corpse_xname() sets xnamep; callers other than doname_base()
               itself shouldn't care about xnamep (pointer to start of
               current obuf[]) but keep it accurate anyway */
                save_xnamep = game.xnamep;
                cxstr = await corpse_xname(obj, prefix, cxarg);
                prefix = sprintf(prefix, "%s ", cxstr);
                /* avoid having doname(corpse) consume an extra obuf */
                releaseobuf(cxstr);
                game.xnamep = save_xnamep;
            } else if (obj.otyp == EGG) {
                if (((omndx) >= LOW_PM && (omndx) < NUMMONS) && (known || (game.mvitals[omndx].mvflags & 8))) {
                    prefix = strcat(prefix, game.mons[omndx].pmnames[NEUTRAL]);
                    prefix = strcat(prefix, " ");
                    /* corpses don't tell if they're stale either */
                    if (obj.spe == 1) {
                        do {
                            bp = strncat(coerceCStr(bp), " (laid by you)", bpspaceleft + 0);
                            bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                        } while (0);
                    }
                }
            } else if (obj.otyp == MEAT_RING) {
                if (obj.owornmask & 262144) {
                    do {
                        bp = strncat(coerceCStr(bp), " (on right ", bpspaceleft + 0);
                        bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                    } while (0);
                }
                if (obj.owornmask & 131072) {
                    do {
                        bp = strncat(coerceCStr(bp), " (on left ", bpspaceleft + 0);
                        bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                    } while (0);
                }
                if (obj.owornmask & (131072 | 262144)) {
                    do {
                        bp = coerceCStr(bp) + nh_snprintf("doname_base", 1499, '', bpspaceleft + 0, "%s)", await body_part(HAND));
                        bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                    } while (0);
                }
                if (known && game.objects[obj.otyp].oc_charged) {
                    prefix = (prefix || '') + sprintf('', "%+d ", obj.spe);
                }
            }
            break;
        case BALL_CLASS:
        case CHAIN_CLASS:
            add_erosion_words(obj, prefix);
            if (obj.owornmask & (2097152 | 4194304)) {
                do {
                    bp = coerceCStr(bp) + nh_snprintf("doname_base", 1545, '', bpspaceleft + 0, " (%s to you)", (obj.owornmask & 2097152) ? "chained" : "attached");
                    bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                } while (0);
            }
            break;
    }
    if ((obj.otyp == STATUE || obj.otyp == CORPSE || obj.otyp == FIGURINE) && game.flags.debug && game.iflags.wizmgender) {
        let cgend = (obj.spe & 3);
        let mgend = ((cgend == 2) ? MALE : (cgend == 1) ? FEMALE : NEUTRAL);
        do {
            bp = coerceCStr(bp) + nh_snprintf("doname_base", 1558, '', bpspaceleft + 0, " (%s)", (cgend != 0) ? genders[mgend].adj : "unspecified gender");
            bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
        } while (0);
    }
    if ((obj.owornmask & 256) && !game.mrg_to_wielded) {
        let twoweap_primary = (obj == game.uwep && game.u.twoweap);
        let tethered = (obj.otyp == AKLYS);
        if ((obj.quan != 1 || ((obj.oclass == WEAPON_CLASS) ? (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART)) : !((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE))) && !twoweap_primary) {
            do {
                bp = strncat(coerceCStr(bp), " (wielded)", bpspaceleft + 0);
                bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
            } while (0);
        } else {
            let hand_s = await body_part(HAND);
            /* it's safe to overwrite our nambuf[] after an() has copied its
       old value into another buffer; and once _that_ has been copied,
       the obuf[] returned by an() can be made available for re-use */
            let obufp = null;
            let handsbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big)) {
                hand_s = strcpy(handsbuf, obufp = await makeplural(hand_s));
                releaseobuf(obufp);
            /* "right hand" or "left hand" */
            } else {
                handsbuf = sprintf(handsbuf, "%s %s", (game.u.uhandedness == 0) ? "right" : "left", hand_s);
                hand_s = handsbuf;
            }
            do {
                bp = coerceCStr(bp) + nh_snprintf("doname_base", 1595, '', bpspaceleft + 0, " (%s %s)", tethered ? "tethered to" : twoweap_primary ? "wielded in" : "weapon in", hand_s);
                bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
            } while (0);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && bpspaceleft && __nh_char_at0(__nh_advance_str(bp_eos, -1)) == 41) {
                /* note: Sting's glow message, if added, will insert text
               in front of "(weapon in hand)"'s closing paren */
                /* we know bp[] ends with ')'; overwrite that */
                /* as above, overwrite known closing paren */
                if (game.warn_obj_cnt && obj == game.uwep && (game.u.uprops[WARN_OF_MON].extrinsic & 256) != 0) {
                    do {
                        bp = coerceCStr(bp).slice(0, -1) + nh_snprintf("doname_base", 1605, '', bpspaceleft + 1, ", %s %s)", glow_verb(game.warn_obj_cnt, (1)), glow_color(obj.oartifact));
                        bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                    } while (0);
                } else if (obj.lamplit && artifact_light(obj)) {
                    do {
                        bp = coerceCStr(bp).slice(0, -1) + nh_snprintf("doname_base", 1609, '', bpspaceleft + 1, ", %s lit)", arti_light_description(obj));
                        bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
                    } while (0);
                }
            }
        }
    }
    if (obj.owornmask & 1024) {
        /* TODO: rephrase this when obj isn't a weapon or weptool */
        if (game.u.twoweap) {
            do {
                bp = coerceCStr(bp) + nh_snprintf("doname_base", 1616, '', bpspaceleft + 0, " (wielded in %s %s)", (game.u.uhandedness == 0) ? "left" : "right", await body_part(HAND));
                bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
            } while (0);
        } else {
            do {
                bp = coerceCStr(bp) + nh_snprintf("doname_base", 1620, '', bpspaceleft + 0, " (alternate weapon%s; not wielded)", (((obj.quan) == 1) ? "" : "s"));
                bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
            } while (0);
        }
    }
    if (obj.owornmask & 512) {
        let Qtyp = 0;
        switch (obj.oclass) {
            case WEAPON_CLASS:
                Qtyp = !((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) ? 3 : (game.objects[obj.otyp].oc_subtyp != -P_BOW) ? 2 : 1;
                break;
            case RING_CLASS:
            case AMULET_CLASS:
            case WAND_CLASS:
            case COIN_CLASS:
            case GEM_CLASS:
                Qtyp = 2;
                break;
            default:
                Qtyp = 3;
                break;
        }
        do {
            bp = coerceCStr(bp) + nh_snprintf("doname_base", 1645, '', bpspaceleft + 0, " (%s)", (Qtyp == 1) ? "in quiver" : (Qtyp == 2) ? "in quiver pouch" : "at the ready");
            bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
        } while (0);
    }
    if (game.iflags.suppress_price || game.program_state.restoring) {
        ;
    } else if (is_unpaid(obj)) {
        /* treat 'restoring' like suppress_price because shopkeeper and
       bill might not be available yet while restore is in progress
       (objects won't normally be formatted during that time, but if
       'perm_invent' is enabled then they might be [not any more...]) */
        /* don't attempt to obtain any shop pricing, even if 'with_price' */
        /* in inventory or in container in invent */
        let pricebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let quotedprice = await unpaid_cost(obj, COST_CONTENTS);
        pricebuf = sprintf(pricebuf, "%ld %s", quotedprice, await currency(quotedprice));
        do {
            bp = coerceCStr(bp) + nh_snprintf("doname_base", 1661, '', bpspaceleft + 0, " (%s, %s)", obj.unpaid ? "unpaid" : "contents", pricebuf);
            bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
        } while (0);
        record_price_quote(obj.otyp, Math.trunc(quotedprice / obj.quan), (1));
    } else if (with_price) {
        /* on floor or in container on floor */
        let nochrg = 0;
        let price = await get_cost_of_shop_item(obj, { get value() { return nochrg; }, set value(_v) { nochrg = _v; } });
        if (price > 0) {
            let pricebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            pricebuf = sprintf(pricebuf, "%ld %s", price, await currency(price));
            do {
                bp = coerceCStr(bp) + nh_snprintf("doname_base", 1673, '', bpspaceleft + 0, " (%s, %s)", nochrg ? "contents" : "for sale", pricebuf);
                bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
            } while (0);
        } else if (nochrg > 0) {
            do {
                bp = strncat(coerceCStr(bp), " (no charge)", bpspaceleft + 0);
                bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
            } while (0);
        } else if (game.iflags.pricequotes && !game.objects[obj.otyp].oc_name_known) {
            append_price_quote(bp, bp_eos, obj.otyp);
        }
        if (price > 0) {
            record_price_quote(obj.otyp, Math.trunc(price / obj.quan), (1));
        }
    } else if (game.iflags.pricequotes && !game.objects[obj.otyp].oc_name_known) {
        append_price_quote(bp, bp_eos, obj.otyp);
    }
    if (!strncmp(prefix, "a ", 2)) {
        tmpbuf = strcpy(tmpbuf, __nh_advance_str(prefix, 2));
        prefix = just_an(prefix, __nh_char_at0(tmpbuf) ? tmpbuf : bp);
        /* append remainder of original prefix */
        prefix = strcat(prefix, tmpbuf);
    }
    if (game.flags.debug && game.iflags.wizweight) {
        /* show weight for items (debug tourist info);
       "aum" is stolen from Crawl's "Arbitrary Unit of Measure" */
        /* wizard mode user has asked to see object weights */
        if (with_price && __nh_char_at0(__nh_advance_str(bp_eos, -1)) == 41) {
            do {
                bp = coerceCStr(bp).slice(0, -1) + nh_snprintf("doname_base", 1700, '', bpspaceleft + 1, ", %u aum)", obj.owt);
                bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
            } while (0);
        } else {
            do {
                bp = coerceCStr(bp) + nh_snprintf("doname_base", 1702, '', bpspaceleft + 0, " (%u aum)", obj.owt);
                bp_eos = eos(bp) , bpspaceleft = 256 - 1 - strlen(bp);
            } while (0);
        }
        ((bp_eos));
        /* ConcatF1(bp) updates bp_eos and bpspaceleft but we're done
           with them now; add a fake use so compiler won't complain
           about a variable assignment that won't be subsequently used */
        ((bpspaceleft));
    }
    bp = await strprepend(bp, prefix);
    if (strlen(bp) > 256 - 1) {
        /*
     * Last gasp bounds check.
     *
     * If caller intends this to be for a menu entry, make sure that
     * there is some room to combine with menu selector prefix without
     * exceeding BUFSZ-1.
     *
     * offsetbp=4: width of menu entry selector text: "c - " for tty.
     * For curses, that wastes a char since it only needs 3: "c) ".
     *
     * Reaching full BUFSZ-1 length can't happen unless both doname
     * (BUFSZ-PREFIX) and strprepend (PREFIX) use up all available
     * space or one of them overflows without being detected.
     */
        paniclog("doname", bp);
        await panic("doname: long object description overflow.");
    } else {
        let offsetbp = for_menu ? 4 : 0;
        if (strlen(bp) + offsetbp >= 256 - 1) {
            if (!__doname_base_doname_full++) {
                /* for !offsetbp, we'll only get here if strlen(bp)==BUFSZ-1 */
                paniclog("doname", bp);
                tmpbuf = sprintf(tmpbuf, "long object description%s.", offsetbp ? " truncated for menu use" : "");
                paniclog("doname", tmpbuf);
            }
            bp = __nh_char_write(bp, 256 - 1 - offsetbp, 0);
        }
    }
    return bp;
}
export async function doname(obj) {
    return await doname_base(obj, 0);
}
/* Name of object including price. */
export async function doname_with_price(obj) {
    return await doname_base(obj, 1);
}
/* "some" instead of precise quantity if obj->dknown not set */
export async function doname_vague_quan(obj) {
    return await doname_base(obj, 2);
}
/* used from invent.c */
export function not_fully_identified(otmp) {
    /* gold doesn't have any interesting attributes [yet?] */
    if (otmp.oclass == COIN_CLASS) {
        return (0);
    }
    /* check fundamental ID hallmarks first */
    if (!otmp.known || !otmp.dknown || (!otmp.bknown && otmp.otyp != SCR_MAIL) || !game.objects[otmp.otyp].oc_name_known) {
        return (1);
    }
    if ((!otmp.cknown && (((otmp).otyp >= LARGE_BOX && (otmp).otyp <= BAG_OF_TRICKS) || otmp.otyp == STATUE)) || (!otmp.lknown && ((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST))) {
        return (1);
    }
    if (otmp.oartifact && undiscovered_artifact(otmp.oartifact)) {
        return (1);
    }
    if (otmp.rknown || (otmp.oclass != ARMOR_CLASS && otmp.oclass != WEAPON_CLASS && !((otmp).oclass == TOOL_CLASS && game.objects[(otmp).otyp].oc_subtyp != P_NONE) && otmp.oclass != BALL_CLASS)) {
        return (0);
    /* otmp->rknown is the only item of interest if we reach here */
    /*
     *  Note:  if a revision ever allows scrolls to become fireproof or
     *  rings to become shockproof, this checking will need to be revised.
     *  `rknown' ID only matters if xname() will provide the info about it.
     */
    /* lack of `rknown' only matters for vulnerable objects */
    } else {
        return ((game.objects[otmp.otyp].oc_material == IRON) || is_flammable(otmp) || is_rottable(otmp) || (game.objects[otmp.otyp].oc_material == COPPER || game.objects[otmp.otyp].oc_material == IRON) || (game.objects[(otmp).otyp].oc_material == GLASS && (otmp).oclass == ARMOR_CLASS));
    }
}
/* format a corpse name (xname() omits monster type; doname() calls us);
   eatcorpse() also uses us for death reason when eating tainted glob */
/* bitmask of CXN_xxx values */
export async function corpse_xname(otmp, adjective, cxn_flags) {
    let nambuf = null;
    let omndx = otmp.corpsenm;
    let ignore_quan = (cxn_flags & 1) != 0;
    let no_prefix = (cxn_flags & 2) != 0;
    let the_prefix = (cxn_flags & 4) != 0;
    let any_prefix = (cxn_flags & 8) != 0;
    let omit_corpse = (cxn_flags & 16) != 0;
    let possessive = (0);
    let glob = (otmp.otyp != CORPSE && otmp.globby);
    let mnam = null;
    game.xnamep = nextobuf();
    nambuf = __nh_buf_view(game.xnamep, 80);
    if (glob) {
        /* suppress "the" from "the unique monster corpse" */
        /* include "the" for "the woodchuck corpse */
        /* include "an" for "an ogre corpse */
        /* leave off suffix (do_name() appends "corpse" itself) */
        mnam = (game.obj_descr[(game.objects[otmp.otyp]).oc_name_idx].oc_name);
    } else if (omndx == NON_PM) {
        mnam = "thing";
    } else {
        mnam = await obj_pmname(otmp);
        if (the_unique_pm(game.mons[omndx]) || (((game.mons[omndx]).mflags2 & 524288) != 0)) {
            mnam = s_suffix(mnam);
            possessive = (1);
            /* don't precede personal name like "Medusa" with an article */
            /* always precede non-personal unique monster name like
               "Oracle" with "the" unless explicitly overridden */
            if ((((game.mons[omndx]).mflags2 & 524288) != 0)) {
                no_prefix = (1);
            } else if (the_unique_pm(game.mons[omndx]) && !no_prefix) {
                the_prefix = (1);
            }
        }
    }
    if (no_prefix) {
        the_prefix = any_prefix = (0);
    } else if (the_prefix) {
        any_prefix = (0);
    }
    nambuf = __nh_char_write(nambuf, 0, 0); /* C: *nambuf = '\0' */
    /* can't use the() the way we use an() below because any capitalized
       Name causes it to assume a personal name and return Name as-is;
       that's usually the behavior wanted, but here we need to force "the"
       to precede capitalized unique monsters (pnames are handled above) */
    if (the_prefix) {
        nambuf = strcat(nambuf, "the ");
    }
    /* note: over time, various instances of the(mon_name()) have crept
       into the code, so the() has been modified to deal with capitalized
       monster names; we could switch to using it below like an() */
    if (!adjective || !__nh_char_at0(adjective)) {
        nambuf = strcat(nambuf, mnam);
    } else {
        /* adjective positioning depends upon format of monster name */
        /* Medusa's cursed partly eaten corpse */
        if (possessive) {
            nambuf = __nh_buf_append(nambuf, sprintf('', "%s %s", mnam, adjective));
        } else {
            nambuf = __nh_buf_append(nambuf, sprintf('', "%s %s", adjective, mnam));
        }
        /* in case adjective has a trailing space, squeeze it out */
        nambuf = mungspaces(nambuf);
        /* doname() might include a count in the adjective argument;
           if so, don't prepend an article */
        if (digit(__nh_char_at0(adjective))) {
            /* normal case:  newt corpse */
            /* omit_corpse doesn't apply; quantity is always 1 */
            /* makeplural(nambuf) => append "s" to "corpse" */
            any_prefix = (0);
        }
    }
    if (glob) {
        ;
    } else if (!omit_corpse) {
        nambuf = strcat(nambuf, " corpse");
        if (otmp.quan > 1 && !ignore_quan) {
            nambuf = strcat(nambuf, "s");
            any_prefix = (0);
        }
    }
    if (any_prefix) {
        let obufp = null;
        nambuf = strcpy(nambuf, obufp = await an(nambuf));
        releaseobuf(obufp);
    }
    return nambuf;
}
/* xname doesn't include monster type for "corpse"; cxname does */
export async function cxname(obj) {
    if (obj.otyp == CORPSE) {
        return await corpse_xname(obj, null, 0);
    }
    return await xname(obj);
}
/* like cxname, but ignores quantity */
export async function cxname_singular(obj) {
    if (obj.otyp == CORPSE) {
        return await corpse_xname(obj, null, 1);
    }
    return await xname_flags(obj, 1);
}
/* treat an object as fully ID'd when it might be used as reason for death */
export async function killer_xname(obj) {
    let save_obj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let save_ocknown = 0;
    let buf = null;
    let save_ocuname = null;
    let save_oname = null;
    if (obj.oartifact) {
        return await bare_artifactname(obj);
    }
    /* remember original settings for core of the object;
       oextra structs other than oname don't matter here--since they
       aren't modified they don't need to be saved and restored */
    /* still long; strip several name-lengthening attributes;
       called and named strings are still in truncated form */
    Object.assign(save_obj, obj);
    if (((obj).oextra && ((obj).oextra.oname))) {
        save_oname = ((obj).oextra.oname);
    }
    /* killer name should be more specific than general xname; however, exact
       info like blessed/cursed and rustproof makes things be too verbose; set
       dknown (not observe_object) because dead characters don't observe */
    obj.known = obj.dknown = 1;
    obj.bknown = obj.rknown = obj.greased = 0;
    if (obj.otyp != POT_WATER) {
        obj.blessed = obj.cursed = 0;
    } else {
        obj.bknown = 1;
    }
    /* "killed by poisoned <obj>" would be misleading when poison is
       not the cause of death and "poisoned by poisoned <obj>" would
       be redundant when it is, so suppress "poisoned" prefix */
    obj.otrapped = 0;
    /* strip user-supplied name; artifacts keep theirs */
    if (!obj.oartifact && save_oname) {
        ((obj).oextra.oname) = null;
    }
    /* temporarily identify the type of object */
    save_ocknown = game.objects[obj.otyp].oc_name_known;
    game.objects[obj.otyp].oc_name_known = 1;
    save_ocuname = game.objects[obj.otyp].oc_uname;
    game.objects[obj.otyp].oc_uname = null;
    if (obj.otyp == CORPSE) {
        buf = await corpse_xname(obj, null, 0);
    } else if (obj.otyp == SLIME_MOLD) {
        /* concession to "most unique deaths competition" in the annual
           devnull tournament, suppress player supplied fruit names because
           those can be used to fake other objects and dungeon features */
        buf = nextobuf();
        buf = sprintf(buf, "deadly slime mold%s", (((obj.quan) == 1) ? "" : "s"));
    } else {
        buf = await xname(obj);
    }
    /* apply an article if appropriate; caller should always use KILLED_BY */
    if (obj.quan == 1 && !strstri(buf, "'s ") && !strstri(buf, "s' ")) {
        buf = (obj_is_pname(obj) || the_unique_obj(obj)) ? await the(buf) : await an(buf);
    }
    game.objects[obj.otyp].oc_name_known = save_ocknown;
    game.objects[obj.otyp].oc_uname = save_ocuname;
    /* restore object's core settings */
    Object.assign(obj, save_obj);
    if (!obj.oartifact && save_oname) {
        ((obj).oextra.oname) = save_oname;
    }
    return buf;
}
/* xname,doname,&c with long results reformatted to omit some stuff */
/* main formatting routine */
/* alternate for shortest result */
export function short_oname(obj, func, altfunc, lenlimit) {
    let save_obj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let unamebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let onamebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let save_oname = null;
    let save_uname = null;
    let outbuf = null;
    outbuf = (func)(obj);
    if (strlen(outbuf) <= lenlimit) {
        /* use whatever we've got, whether it's too long or not */
        return outbuf;
    }
    /* shorten called string to fairly small amount */
    save_uname = game.objects[obj.otyp].oc_uname;
    if (save_uname && strlen(save_uname) >= 12 /* sizeof(char [12]) */) {
        unamebuf = strncpy(unamebuf, save_uname, 12 /* sizeof(char [12]) */ - 4);
        strcpy(unamebuf + 12 /* sizeof(char [12]) */ - 4, "...");
        /* shorten both called and named strings;
       unamebuf and onamebuf have both already been populated */
        game.objects[obj.otyp].oc_uname = unamebuf;
        /* still long; use the alternate function (usually one of
           the jackets around minimal_xname()) */
        releaseobuf(outbuf);
        outbuf = (func)(obj);
        game.objects[obj.otyp].oc_uname = save_uname;
        if (strlen(outbuf) <= lenlimit) {
            return outbuf;
        }
    }
    /* shorten named string to fairly small amount */
    save_oname = ((obj).oextra && ((obj).oextra.oname)) ? ((obj).oextra.oname) : null;
    if (save_oname && strlen(save_oname) >= 12 /* sizeof(char [12]) */) {
        onamebuf = strncpy(onamebuf, save_oname, 12 /* sizeof(char [12]) */ - 4);
        strcpy(onamebuf + 12 /* sizeof(char [12]) */ - 4, "...");
        ((obj).oextra.oname) = onamebuf;
        releaseobuf(outbuf);
        outbuf = (func)(obj);
        ((obj).oextra.oname) = save_oname;
        if (strlen(outbuf) <= lenlimit) {
            return outbuf;
        }
    }
    if (save_uname && strlen(save_uname) >= 12 /* sizeof(char [12]) */ && save_oname && strlen(save_oname) >= 12 /* sizeof(char [12]) */) {
        game.objects[obj.otyp].oc_uname = unamebuf;
        ((obj).oextra.oname) = onamebuf;
        releaseobuf(outbuf);
        outbuf = (func)(obj);
        if (strlen(outbuf) <= lenlimit) {
            game.objects[obj.otyp].oc_uname = save_uname;
            ((obj).oextra.oname) = save_oname;
            return outbuf;
        }
    }
    Object.assign(save_obj, obj);
    obj.bknown = obj.rknown = obj.greased = 0;
    obj.oeroded = obj.oeroded2 = 0;
    releaseobuf(outbuf);
    outbuf = (func)(obj);
    if (altfunc && strlen(outbuf) > lenlimit) {
        releaseobuf(outbuf);
        outbuf = (altfunc)(obj);
    }
    Object.assign(obj, save_obj);
    if (save_oname) {
        ((obj).oextra.oname) = save_oname;
    }
    if (save_uname) {
        game.objects[obj.otyp].oc_uname = save_uname;
    }
    return outbuf;
}
/*
 * Used if only one of a collection of objects is named (e.g. in eat.c).
 */
export async function singular(otmp, func) {
    let savequan = 0;
    let nam = null;
    /* using xname for corpses does not give the monster type */
    if (otmp.otyp == CORPSE && func == xname) {
        func = cxname;
    }
    savequan = otmp.quan;
    otmp.quan = 1;
    nam = await (func)(otmp);
    otmp.quan = savequan;
    return nam;
}
/* pick "", "a ", or "an " as article for 'str'; used by an() and doname() */
export function just_an(outbuf, str) {
    let c0 = 0;
    if (Array.isArray(outbuf) && outbuf.length > 0) outbuf[0] = 0;
    else if (typeof outbuf === 'string') outbuf = ''; /* C: outbuf[0] = nul; string outbufs rebind (§23.244) */
    c0 = lowc(__nh_char_at0(str));
    if (!__nh_char_at0(__nh_advance_str(str, 1)) || __nh_char_at0(__nh_advance_str(str, 1)) == 32) {
        outbuf = strcpy(outbuf, strchr("aefhilmnosx", c0) ? "an " : "a ");
    } else if (!strncmpi(str, "the ", 4) || !strncmpi((str), ("molten lava"), -1) || !strncmpi((str), ("iron bars"), -1) || !strncmpi((str), ("ice"), -1)) {
        ;
    } else {
        /* normal case is "an <vowel>" or "a <consonant>" */
        /* some exceptions warranting "a <vowel>" */
        if ((strchr(vowels, c0) && (strncmpi(str, "one", 3) || (__nh_char_at0(__nh_advance_str(str, 3)) && !strchr("-_ ", __nh_char_at0(__nh_advance_str(str, 3))))) && strncmpi(str, "eu", 2) && strncmpi(str, "uke", 3) && strncmpi(str, "ukulele", 7) && strncmpi(str, "unicorn", 7) && strncmpi(str, "uranium", 7) && strncmpi(str, "useful", 6)) || (c0 == 120 && !strchr(vowels, lowc(__nh_char_at0(__nh_advance_str(str, 1)))))) {
            outbuf = strcpy(outbuf, "an ");
        } else {
            outbuf = strcpy(outbuf, "a ");
        }
    }
    return outbuf;
}
export async function an(str) {
    let buf = nextobuf();
    if (!str || !__nh_char_at0(str)) {
        await impossible("Alphabet soup: 'an(%s)'.", str ? "\"\"" : "<null>");
        return strcpy(buf, "an []");
    }
    just_an(buf, str);
    return strncat(buf, str, 256 - 1 - await Strlen_(buf, "an", 2154));
}
export async function An(str) {
    let tmp = await an(str);
    tmp = (() => { const __s = tmp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return tmp;
}
/*
 * Prepend "the" if necessary; assumes str is a subject derived from xname.
 * Use type_is_pname() for monster names, not the().  the() is idempotent.
 */
export async function the(str) {
    let aname = null;
    let buf = nextobuf();
    let insert_the = (0);
    if (!str || !__nh_char_at0(str)) {
        await impossible("Alphabet soup: 'the(%s)'.", str ? "\"\"" : "<null>");
        return strcpy(buf, "the []");
    }
    if (!strncmpi(str, "the ", 4)) {
        /* C: buf[0] = lowc(*str); Strcpy(&buf[1], str + 1); — i.e. copy str
           with its first char lowercased.  The translator mistranslated the
           `&buf[1]` strcpy dest into a scalar getter/setter wrapper, so buf
           stayed the empty nextobuf() and every "the …" name (corpse_xname /
           food_xname double-"the") rendered blank (#104). */
        const __s = coerceCStr(str);
        buf = strcpy(buf, __s.length ? (__s.charAt(0).toLowerCase() + __s.slice(1)) : __s);
        return buf;
    } else if (__nh_char_at0(str) < 65 || __nh_char_at0(str) > 90 || await CapitalMon(str) || (await fruit_from_name(str, (1), null) && ((aname = artifact_name(str, null, (0))) == null || strncmpi(aname, "the ", 4) == 0))) {
        /* some capitalized monster names want "the", others don't */
        /* treat named fruit as not a proper name, even if player
                  has assigned a capitalized proper name as his/her fruit,
                  unless it matches an artifact name */
        /* not a proper name, needs an article */
        insert_the = (1);
    } else {
        /* Probably a proper name, might not need an article */
        let named = null;
        let called = null;
        let tmp = null;
        let l = 0;
        if (((tmp = strrchr(str, 32)) != null || (tmp = strrchr(str, 45)) != null) && (__nh_char_at0(__nh_advance_str(tmp, 1)) < 65 || __nh_char_at0(__nh_advance_str(tmp, 1)) > 90)) {
            /* some objects have capitalized adjectives in their names */
            /* insert "the" unless we have an apostrophe (where we assume
               we're dealing with "Unique's corpse" when "Unique" wasn't
               caught by CapitalMon() above) */
            insert_the = !strchr(str, 39);
        } else if (tmp && strchr(str, 32) < tmp) {
            /* it needs an article if the name contains "of" */
            tmp = strstri(str, " of ");
            named = strstri(str, " named ");
            called = strstri(str, " called ");
            if (called && (!named || called < named)) {
                named = called;
            }
            /* stupid special case: lacks "of" but needs "the" */
            if (tmp && (!named || tmp < named)) {
                insert_the = (1);
            } else if (!named && (l = await Strlen_(str, "the", 2220)) >= 31 && !strcmp(__nh_advance_str(str, l - 31), "Platinum Yendorian Express Card")) {
                insert_the = (1);
            }
        }
    }
    if (insert_the) {
        buf = strcpy(buf, "the ");
    } else {
        buf = __nh_char_write(buf, 0, 0);
    }
    return strncat(buf, str, 256 - 1 - await Strlen_(buf, "the", 2230));
}
export async function The(str) {
    let tmp = await the(str);
    tmp = (() => { const __s = tmp; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return tmp;
}
/* returns "count cxname(otmp)" or just cxname(otmp) if count == 1 */
export async function aobjnam(otmp, verb) {
    let prefix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let bp = await cxname(otmp);
    if (otmp.quan != 1) {
        prefix = sprintf(prefix, "%ld ", otmp.quan);
        bp = await strprepend(bp, prefix);
    }
    if (verb) {
        bp = strcat(bp, " ");
        bp = strcat(bp, await otense(otmp, verb));
    }
    return bp;
}
/* combine yname and aobjnam eg "your count cxname(otmp)" */
export async function yobjnam(obj, verb) {
    let s = await aobjnam(obj, verb);
    if (!((obj).where == 3) || !obj_is_pname(obj) || obj.oartifact >= ART_ORB_OF_DETECTION) {
        let outbuf = await shk_your(nextobuf(), obj);
        let space_left = 256 - 1 - await Strlen_(outbuf, "yobjnam", 2271);
        s = strncat(outbuf, s, space_left);
    }
    return s;
}
/* combine Yname2 and aobjnam eg "Your count cxname(otmp)" */
export async function Yobjnam2(obj, verb) {
    let s = await yobjnam(obj, verb);
    s = (() => { const __s = s; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return s;
}
/* like aobjnam, but prepend "The", not count, and use xname */
export async function Tobjnam(otmp, verb) {
    let bp = await The(await xname(otmp));
    if (verb) {
        bp = strcat(bp, " ");
        bp = strcat(bp, await otense(otmp, verb));
    }
    return bp;
}
/* capitalized variant of doname() */
export async function Doname2(obj) {
    let s = await doname(obj);
    s = (() => { const __s = s; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return s;
}
/* doname() for itemized buying of 'obj' from a shop */
const __paydoname_and_contents = " and its contents";
export async function paydoname(obj) {
    let p = null;
    let save_cknown = obj.cknown;
    let save_wizweight = game.iflags.wizweight;
    if (((obj).cobj != null)) {
        obj.cknown = 0;
    }
    /* avoid showing item weights to unclutter billing's pay-menu a bit */
    game.iflags.wizweight = (0);
    /* suppress invent-style price; caller will add billing-style price */
    game.iflags.suppress_price++;
    p = await doname_base(obj, 0);
    game.iflags.suppress_price--;
    game.iflags.wizweight = save_wizweight;
    if (((obj).cobj != null)) {
        if (!obj.no_charge) {
            /* buy_container() sets no_charge for a container that has just
           been purchased so that when paydoname() is called by
           shk_names_obj(), we'll provide "a/an <container>" instead of
           "your <container>" */
            if (!strncmp(p, "a ", 2)) {
                p = __nh_advance_str(p, 2);
            } else if (!strncmp(p, "an ", 3)) {
                p = __nh_advance_str(p, 3);
            }
            p = await strprepend(p, obj.unpaid ? "an unpaid " : "your ");
        }
        if (!obj.cknown) {
            if (obj.unpaid) {
                if (strlen(p) + 18 /* sizeof(const char [18]) */ - 1 < 256 - 80) {
                    p = strcat(p, __paydoname_and_contents);
                }
            } else {
                p = await strprepend(p, "the contents of ");
            }
        }
    }
    obj.cknown = save_cknown;
    return p;
}
/* returns "[your ]xname(obj)" or "Foobar's xname(obj)" or "the xname(obj)" */
export async function yname(obj) {
    let s = await cxname(obj);
    if (!((obj).where == 3) || !obj_is_pname(obj) || obj.oartifact >= ART_ORB_OF_DETECTION) {
        let outbuf = await shk_your(nextobuf(), obj);
        let space_left = 256 - 1 - await Strlen_(outbuf, "yname", 2368);
        s = strncat(outbuf, s, space_left);
    }
    return s;
}
/* capitalized variant of yname() */
export async function Yname2(obj) {
    let s = await yname(obj);
    s = (() => { const __s = s; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return s;
}
/* returns "your minimal_xname(obj)"
 * or "Foobar's minimal_xname(obj)"
 * or "the minimal_xname(obj)"
 */
export async function ysimple_name(obj) {
    let outbuf = nextobuf();
    let s = await shk_your(outbuf, obj);
    let space_left = 256 - 1 - await Strlen_(s, "ysimple_name", 2395);
    return strncat(s, await minimal_xname(obj), space_left);
}
/* capitalized variant of ysimple_name() */
export async function Ysimple_name2(obj) {
    let s = await ysimple_name(obj);
    s = (() => { const __s = s; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    return s;
}
/*
     * FIXME:
     *  simpleonames(), ansimpleoname(), and thesimpleoname() need to
     *  know the beginning of the obuf[] they use so that they can
     *  guard against buffer overflow when pluralizing (is that an
     *  actual word?) or inserting "an" or "the".
     *
     *  minimal_xname() returns a call to xname() which writes into
     *  the middle of its obuf[] then backs up to accomodate a prefix,
     *  so BUFSZ is not a reliable limit for the length of the result.
     *
     *  [Overflow likely moot.  Since the formatted object name has
     *  user-supplied name suppressed, the length is sure to be short
     *  enough to added plural suffix or "an" or "the" prefix.]
     */
/* "scroll" or "scrolls" */
export async function simpleonames(obj) {
    let obufp = null;
    let simpleoname = await minimal_xname(obj);
    if (obj.quan != 1) {
        simpleoname = strcpy(simpleoname, obufp = await makeplural(simpleoname));
        releaseobuf(obufp);
    }
    return simpleoname;
}
/* "a scroll" or "scrolls"; "a silver bell" or "the Bell of Opening" */
export async function ansimpleoname(obj) {
    let obufp = null;
    let simpleoname = await simpleonames(obj);
    let otyp = obj.otyp;
    /* prefix with "the" if a unique item, or a fake one imitating same,
       has been formatted with its actual name (we let minimal_xname() handle
       any `known' and `dknown' checking necessary) */
    if (otyp == FAKE_AMULET_OF_YENDOR) {
        otyp = AMULET_OF_YENDOR;
    }
    if (game.objects[otyp].oc_unique && (game.obj_descr[(game.objects[otyp]).oc_name_idx].oc_name) && !strcmp(simpleoname, (game.obj_descr[(game.objects[otyp]).oc_name_idx].oc_name))) {
        obufp = await the(simpleoname);
        simpleoname = strcpy(simpleoname, obufp);
        releaseobuf(obufp);
    } else if (obj.quan == 1) {
        obufp = await an(simpleoname);
        simpleoname = strcpy(simpleoname, obufp);
        releaseobuf(obufp);
    }
    return simpleoname;
}
/* "the scroll" or "the scrolls" */
export async function thesimpleoname(obj) {
    let obufp = null;
    let simpleoname = await simpleonames(obj);
    obufp = await the(simpleoname);
    simpleoname = strcpy(simpleoname, obufp);
    releaseobuf(obufp);
    return simpleoname;
}
/* basic name of obj, as if it has been discovered; for some types of
   items, we can't just use OBJ_NAME() because it doesn't always include
   the class (for instance "light" when we want "spellbook of light");
   minimal_xname() uses xname() to get that */
export async function actualoname(obj) {
    let res = null;
    game.iflags.override_ID = (1);
    res = await minimal_xname(obj);
    game.iflags.override_ID = (0);
    return res;
}
/* artifact's name without any object type or known/dknown/&c feedback */
export async function bare_artifactname(obj) {
    let outbuf = null;
    if (obj.oartifact) {
        outbuf = nextobuf();
        outbuf = strcpy(outbuf, artiname(obj.oartifact));
        if (!strncmp(outbuf, "The ", 4)) {
            outbuf = (() => { const __s = outbuf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toLowerCase() + __t.slice(1) : __s; })();
        }
    } else {
        outbuf = await xname(obj);
    }
    return outbuf;
}
const wrp = ["wand", "ring", "potion", "scroll", "gem", "amulet", "spellbook", "spell book", "weapon", "armor", "tool", "food", "comestible"];
/* for non-specific wishes */
const wrpsym = [WAND_CLASS, RING_CLASS, POTION_CLASS, SCROLL_CLASS, GEM_CLASS, AMULET_CLASS, SPBOOK_CLASS, SPBOOK_CLASS, WEAPON_CLASS, ARMOR_CLASS, TOOL_CLASS, FOOD_CLASS, FOOD_CLASS];
/* return form of the verb (input plural) if xname(otmp) were the subject */
export async function otense(otmp, verb) {
    let buf = null;
    /*
     * verb is given in plural (without trailing s).  Return as input
     * if the result of xname(otmp) would be plural.  Don't bother
     * recomputing xname(otmp) at this time.
     */
    if (!((otmp).quan != 1 || ((otmp).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD)))) {
        return await vtense(null, verb);
    }
    buf = nextobuf();
    buf = strcpy(buf, verb);
    return buf;
}
/* various singular words that vtense would otherwise categorize as plural;
   also used by makesingular() to catch some special cases */
const special_subjs = ["erinys", "manes", "Cyclops", "Hippocrates", "Pelias", "aklys", "amnesia", "detect monsters", "paralysis", "shape changers", "nemesis", null];
/* this one is ambiguous */
/* note: "detect monsters" and "shape changers" are normally
       caught via "<something>(s) of <whatever>", but they can be
       wished for using the shorter form, so we include them here
       to accommodate usage by makesingular during wishing */
/* return form of the verb (input plural) for present tense 3rd person subj */
export async function vtense(subj, verb) {
    return __nh_hp_vtense(subj, verb);
}
// struct sing_plur: { sing, plur }
/* word pairs that don't fit into formula-based transformations;
   also some suffices which have very few--often one--matches or
   which aren't systematically reversible (knives, staves) */
const one_off = [{ sing: "child", plur: "children" }, { sing: "cubus", plur: "cubi" }, { sing: "culus", plur: "culi" }, { sing: "Cyclops", plur: "Cyclopes" }, { sing: "djinni", plur: "djinn" }, { sing: "erinys", plur: "erinyes" }, { sing: "foot", plur: "feet" }, { sing: "fungus", plur: "fungi" }, { sing: "goose", plur: "geese" }, { sing: "knife", plur: "knives" }, { sing: "labrum", plur: "labra" }, { sing: "louse", plur: "lice" }, { sing: "mouse", plur: "mice" }, { sing: "mumak", plur: "mumakil" }, { sing: "nemesis", plur: "nemeses" }, { sing: "ovum", plur: "ova" }, { sing: "ox", plur: "oxen" }, { sing: "passerby", plur: "passersby" }, { sing: "rtex", plur: "rtices" }, { sing: "serum", plur: "sera" }, { sing: "staff", plur: "staves" }, { sing: "tooth", plur: "teeth" }, { sing: null, plur: null }];
/* (for wise guys who give their food funny names) */
/* in-/suc-cubus */
/* homunculus */
/* candelabrum */
/* vortex */
const as_is = ["boots", "shoes", "gloves", "lenses", "scales", "eyes", "gauntlets", "iron bars", "bison", "deer", "elk", "fish", "fowl", "tuna", "yaki", "-hai", "krill", "manes", "moose", "ninja", "sheep", "ronin", "roshi", "shito", "tengu", "ki-rin", "Nazgul", "gunyoki", "piranha", "samurai", "shuriken", "haggis", "Bordeaux", null];
/* makesingular() leaves these plural due to how they're used */
/* both singular and plural are spelled the same */
/* Note:  "fish" and "piranha" are collective plurals, suitable
       for "wiped out all <foo>".  For "3 <foo>", they should be
       "fishes" and "piranhas" instead.  We settle for collective
       variant instead of attempting to support both. */
/* singularize/pluralize decisions common to both makesingular & makeplural */
/* base string, pointer to eos(string) */
/* true => makeplural, false => makesingular */
/* another set like as_is[] */
export async function singplur_lookup(basestr, endstring, to_plural, alt_as_is) {
    let sp = null;
    let same = null;
    let other = null;
    let as = null;
    let al = 0;
    let baselen = await Strlen_(basestr, "singplur_lookup", 2716);
    {
        /* string-mode as_is suffix matching (C: case-insensitive
           endswith against the working segment [basestr, endstring)) */
        const __base = (typeof basestr === 'string') ? basestr : '';
        const __lower = __base.toLowerCase();
        for (const __w of as_is) {
            if (__w && __lower.endsWith(__w.toLowerCase())) return (1);
        }
        if (alt_as_is) {
            for (const __w of alt_as_is) {
                if (__w && __lower.endsWith(__w.toLowerCase())) return (1);
            }
        }
    }
    /* Leave "craft" as a suffix as-is (aircraft, hovercraft);
      "craft" itself is (arguably) not included in our likely context */
    if ((baselen > 5) && (!((endstring - 5) < basestr || strncmpi(((endstring - 5)), ("craft"), -1)))) {
        return (1);
    }
    if (!strncmpi((basestr), ("slice"), -1) || !strncmpi((basestr), ("mongoose"), -1)) {
        /* avoid false hit on one_off[].plur == "lice" or .sing == "goose";
       if more of these turn up, one_off[] entries will need to flagged
       as to which are whole words and which are matchable as suffices
       then matching in the loop below will end up becoming more complex */
        if (to_plural) {
            endstring = strcasecpy(endstring, "s");
        }
        return (1);
    }
    if (to_plural && baselen > 2 && !strncmpi((endstring - 2), ("ox"), -1) && !(baselen > 5 && !strncmpi((endstring - 6), ("muskox"), -1))) {
        endstring = strcasecpy(endstring, "es");
        return (1);
    }
    if (to_plural) {
        if (baselen > 2 && !strncmpi((endstring - 3), ("man"), -1) && badman(basestr, to_plural)) {
            endstring = strcasecpy(endstring, "s");
            return (1);
        }
    } else {
        if (baselen > 2 && !strncmpi((endstring - 3), ("men"), -1) && badman(basestr, to_plural)) {
            return (1);
        }
    }
    for (let __nhi_sp = 0; (sp = one_off[__nhi_sp]) && (sp.sing); __nhi_sp++) {
        /* check whether endstring already matches */
        same = to_plural ? sp.plur : sp.sing;
        al = strlen(same);
        if (!((endstring - al) < basestr || strncmpi(((endstring - al)), (same), -1))) {
            return (1);
        }
        /* check whether it matches the inverse; if so, transform it */
        other = to_plural ? sp.sing : sp.plur;
        al = strlen(other);
        if (!((endstring - al) < basestr || strncmpi(((endstring - al)), (other), -1))) {
            strcasecpy(endstring - al, same);
            return (1);
        }
    }
    return (0);
}
/* searches for common compounds, ex. lump of royal jelly */
const __singplur_compound_compounds = [" of ", " labeled ", " called ", " named ", " above", " versus ", " from ", " in ", " on ", " a la ", " with", " de ", " d'", " du ", " au ", "-in-", "-at-", null];
/* list of first characters for all compounds[] entries */
const __singplur_compound_compound_start = " -";
export function singplur_compound(str) {
    /* if new entries are added, be sure to keep compound_start[] in sync */
    let __nh_cmpd_idx = 0;
    let p = null;
    for (p = str; __nh_char_at0(p); (p = __nh_advance_str(p, 1))) {
        /* substring starting at p can only match if *p is found
           within compound_start[] */
        if (!strchr(__singplur_compound_compound_start, __nh_char_at0(p))) {
            continue;
        }
        /* check current substring against all words in the compound[] list */
        for (__nh_cmpd_idx = 0; __singplur_compound_compounds[__nh_cmpd_idx]; ++__nh_cmpd_idx) {
            if (!strncmpi(p, __singplur_compound_compounds[__nh_cmpd_idx], strlen(__singplur_compound_compounds[__nh_cmpd_idx]))) {
                return p;
            }
        }
    }
    /* wasn't recognized as a compound phrase */
    return null;
}
/* Plural routine; once upon a time it may have been chiefly used for
 * user-defined fruits, but it is now used extensively throughout the
 * program.
 *
 * For fruit, we have to try to account for everything reasonable the
 * player has; something unreasonable can still break the code.
 * However, it's still a lot more accurate than "just add an 's' at the
 * end", which Rogue uses...
 *
 * Also used for plural monster names ("Wiped out all homunculi." or the
 * vanquished monsters list) and body parts.  A lot of unique monsters have
 * names which get mangled by makeplural and/or makesingular.  They're not
 * genocidable, and vanquished-mon handling does its own special casing
 * (for uniques who've been revived and re-killed), so we don't bother
 * trying to get those right here.
 *
 * Also misused by muse.c to convert 1st person present verbs to 2nd person.
 * 3.6.0: made case-insensitive.
 */
export async function makeplural(oldstr) {
    return __nh_hp_makeplural(oldstr);
}
/*
 * Singularize a string the user typed in; this helps reduce the complexity
 * of readobjnam, and is also used in pager.c to singularize the string
 * for which help is sought.
 *
 * "Manes" is ambiguous: monster type (keep s), or horse body part (drop s)?
 * Its inclusion in as_is[]/special_subj[] makes it get treated as the former.
 *
 * A lot of unique monsters have names ending in s; plural, or singular
 * from plural, doesn't make much sense for them so we don't bother trying.
 * 3.6.0: made case-insensitive.
 */
export async function makesingular(oldstr) {
    let p = null;
    let bp = null;
    let excess = null;
    let str = null;
    bottom: {
        /* Ends in y preceded by consonant (note: also "qu") change to "ies" */
        excess = null;
        str = nextobuf();
        if (oldstr) {
            while (__nh_char_at0(oldstr) == 32) {
                (oldstr = __nh_advance_str(oldstr, 1));
            }
        }
        if (!oldstr || !__nh_char_at0(oldstr)) {
            await impossible("singular of null?");
            str = __nh_char_write(str, 0, 0);
            return str;
        }
        str = __nh_char_write(str, 0, 0); /* C: *str = '\0' — clear the rotating obuf (stale-leak fix) */
        if (!strncmpi((genders[3].he), (oldstr), -1)) {
            str = strcpy(str, genders[2].he);
        } else if (!strncmpi((genders[3].him), (oldstr), -1)) {
            str = strcpy(str, genders[2].him);
        } else if (!strncmpi((genders[3].his), (oldstr), -1)) {
            str = strcpy(str, genders[2].his);
        }
        if (__nh_char_at0(str)) {
            if (__nh_char_at0(oldstr) == highc(__nh_char_at0(oldstr))) {
                str = (() => { const __s = str; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
            }
            return str;
        }
        bp = strcpy(str, oldstr);
        if ((p = singplur_compound(bp)) != null) {
            /* check for "foo of bar" so that we can focus on "foo" */
            excess = __nh_advance_str(oldstr, ((bp.length - p.length)));
            /* C: *p = '\0' — truncate bp at the compound boundary
               (patched; the emitted void-0 left bp whole and the
               bottom strcat doubled the suffix). */
            bp = (typeof bp === 'string') ? bp.slice(0, bp.length - p.length) : bp;
            p = __nh_advance_str(bp, strlen(bp));
        } else {
            p = eos(bp);
        }
        if (await singplur_lookup(bp, p, (0), special_subjs)) {
            break bottom;
        }
        /* String-mode singularization tail (C objnam.c:3066-3151);
           the emitted tail below is a no-op on JS suffix-strings. */
        if (typeof bp === 'string' && bp.length >= 1) {
            const __L = bp.toLowerCase();
            const __ends = (suf) => __L.endsWith(suf);
            const __wordStart = (n) => (bp.length === n || bp[bp.length - n - 1] === ' ');
            const __caseRepl = (str0, at, repl) => {
                let out = str0.slice(0, at);
                for (let i = 0; i < repl.length; i++) {
                    const oc = str0.charCodeAt(at + i);
                    let nc = repl.charCodeAt(i);
                    if (oc >= 65 && oc <= 90 && nc >= 97 && nc <= 122) nc -= 32;
                    else if (oc >= 97 && oc <= 122 && nc >= 65 && nc <= 90) nc += 32;
                    out += String.fromCharCode(nc);
                }
                return out + str0.slice(at + repl.length);
            };
            let __done = false;
            if (__ends('s')) {
                if (__ends('es')) {
                    if (__ends('ies')) {
                        if (!(__ends('cookies') || (__ends('pies') && __wordStart(4))
                              || (__ends('genies') && __wordStart(6))
                              || __ends('mbies') || __ends('yries'))) {
                            bp = __caseRepl(bp, bp.length - 3, 'y').slice(0, bp.length - 2);
                            __done = true;
                        }
                    } else if (bp.length >= 4 && __ends('ves')
                               && ('lr'.includes(__L[bp.length - 4]) || 'aeiou'.includes(__L[bp.length - 4]))) {
                        if (!(__ends('cloves') || __ends('nerves'))) {
                            bp = __caseRepl(bp, bp.length - 3, 'f').slice(0, bp.length - 2);
                            __done = true;
                        }
                    } else if (__ends('eses') || __ends('oxes') || __ends('nxes')
                               || __ends('ches') || __ends('uses') || __ends('shes')
                               || __ends('sses') || __ends('atoes') || __ends('dingoes')
                               || __ends('aleaxes')) {
                        bp = bp.slice(0, -2);
                        __done = true;
                    }
                } else if (__ends('us')) {
                    if (!(__ends('tengus') || __ends('hezrous'))) __done = true;
                } else if (__ends('ss') || __ends(' lens') || __L === 'lens') {
                    __done = true;
                }
                if (!__done) bp = bp.slice(0, -1);
            } else {
                if (__ends('men') && !badman(bp, (0))) {
                    bp = __caseRepl(bp, bp.length - 2, 'an');
                } else if (__ends('matzot') || __ends('ae') || __ends('eaux')) {
                    bp = bp.slice(0, -1);
                } else if (bp.length >= 4 && __ends('ia')
                           && 'lr'.includes(__L[bp.length - 3]) && __L[bp.length - 4] === 'e') {
                    bp = __caseRepl(bp, bp.length - 1, 'um');
                }
            }
            break bottom;
        }
        if (p >= __nh_advance_str(bp, 1) && lowc(__nh_char_at0(__nh_advance_str(p, -1))) == 115) {
            mins: {
                if (p >= __nh_advance_str(bp, 2) && lowc(__nh_char_at0(__nh_advance_str(p, -2))) == 101) {
                    if (p >= __nh_advance_str(bp, 3) && lowc(__nh_char_at0(__nh_advance_str(p, -3))) == 105) {
                        /* remove -s or -es (boxes) or -ies (rubies) */
                        if (!((p - 7) < bp || strncmpi(((p - 7)), ("cookies"), -1)) || (!((p - 4) < bp || strncmpi(((p - 4)), ("pies"), -1)) && (p - 4 == bp || __nh_char_at0(__nh_advance_str(p, -5)) == 32)) || (!((p - 6) < bp || strncmpi(((p - 6)), ("genies"), -1)) && (p - 6 == bp || __nh_char_at0(__nh_advance_str(p, -7)) == 32)) || !((p - 5) < bp || strncmpi(((p - 5)), ("mbies"), -1)) || !((p - 5) < bp || strncmpi(((p - 5)), ("yries"), -1))) {
                            break mins;
                        }
                        strcasecpy(p - 3, "y");
                        /* input doesn't end in 's' */
                        break bottom;
                    }
                    if (p - 4 >= bp && (strchr("lr", lowc(__nh_char_at0((p - 4)))) || strchr(vowels, lowc(__nh_char_at0((p - 4))))) && !((p - 3) < bp || strncmpi(((p - 3)), ("ves"), -1))) {
                        /* avoid false match for "harpies" */
                        /* alternate djinni/djinn spelling; not really needed */
                        /* avoid false match for "progenies" */
                        /* wolves, but f to ves isn't fully reversible */
                        if (!((p - 6) < bp || strncmpi(((p - 6)), ("cloves"), -1)) || !((p - 6) < bp || strncmpi(((p - 6)), ("nerves"), -1))) {
                            break mins;
                        }
                        strcasecpy(p - 3, "f");
                        break bottom;
                    }
                    /* ends in 's' but not 'es' */
                    if (!((p - 4) < bp || strncmpi(((p - 4)), ("eses"), -1)) || !((p - 4) < bp || strncmpi(((p - 4)), ("oxes"), -1)) || !((p - 4) < bp || strncmpi(((p - 4)), ("nxes"), -1)) || !((p - 4) < bp || strncmpi(((p - 4)), ("ches"), -1)) || !((p - 4) < bp || strncmpi(((p - 4)), ("uses"), -1)) || !((p - 4) < bp || strncmpi(((p - 4)), ("shes"), -1)) || !((p - 4) < bp || strncmpi(((p - 4)), ("sses"), -1)) || !((p - 5) < bp || strncmpi(((p - 5)), ("atoes"), -1)) || !((p - 7) < bp || strncmpi(((p - 7)), ("dingoes"), -1)) || !((p - 7) < bp || strncmpi(((p - 7)), ("Aleaxes"), -1))) {
                        /* makeplural() of pronouns isn't reversible but at least we can
       force a singular value */
                        /* note: nurses, axes but boxes, wumpuses */
                        /* matzot -> matzo, algae -> alga */
                        /* check for "detect <foo>" vs "<foo> detection" */
                        /* convert "<foo> detection" into "detect <foo>" */
                        /* the output buffer might be the same as the prefix if caller
       has already partially filled it */
                        /* prefix is already in the buffer */
                        /* len = (unsigned) strlen(qbuf); */
                        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
                        break bottom;
                    }
                } else if (!((p - 2) < bp || strncmpi(((p - 2)), ("us"), -1))) {
                    /* else fall through to mins */
                    if (((p - 6) < bp || strncmpi(((p - 6)), ("tengus"), -1)) && ((p - 7) < bp || strncmpi(((p - 7)), ("hezrous"), -1))) {
                        break bottom;
                    }
                } else if (!((p - 2) < bp || strncmpi(((p - 2)), ("ss"), -1)) || !((p - 5) < bp || strncmpi(((p - 5)), (" lens"), -1)) || (p - 4 == bp && !strncmpi((p - 4), ("lens"), -1))) {
                    break bottom;
                }
            }
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        } else {
            if (!((p - 3) < bp || strncmpi(((p - 3)), ("men"), -1)) && !badman(bp, (0))) {
                strcasecpy(p - 2, "an");
                break bottom;
            }
            if (!((p - 6) < bp || strncmpi(((p - 6)), ("matzot"), -1)) || !((p - 2) < bp || strncmpi(((p - 2)), ("ae"), -1)) || !((p - 4) < bp || strncmpi(((p - 4)), ("eaux"), -1))) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
                break bottom;
            }
            /* balactheria -> balactherium */
            /* here we cannot find the plural suffix */
            if (p - 4 >= bp && !strncmpi((p - 2), ("ia"), -1) && strchr("lr", lowc(__nh_char_at0((p - 3)))) && lowc(__nh_char_at0((p - 4))) == 101) {
                strcasecpy(p - 1, "um");
            }
        }
    }
    /* if we stripped off a suffix (" of bar" from "foo of bar"),
       put it back now [strcat() isn't actually 100% safe here...] */
    if (excess) {
        bp = strcat(bp, excess);
    }
    return bp;
}
const __ch_ksound_ch_k = ["monarch", "poch", "tech", "mech", "stomach", "psych", "amphibrach", "anarch", "atriarch", "azedarach", "broch", "gastrotrich", "isopach", "loch", "oligarch", "peritrich", "sandarach", "sumach", "symposiarch"];
export function ch_ksound(basestr) {
    /* these are some *ch words/suffixes that make a k-sound. They pluralize by
       adding 's' rather than 'es' */
    /* these are all the prefixes for *man that don't have a *men plural */
    /* these are all the prefixes for *men that don't have a *man singular */
    let i = 0;
    let al = 0;
    let endstr = null;
    if (!basestr || strlen(basestr) < 4) {
        return (0);
    }
    endstr = eos(basestr);
    for (i = 0; i < (Math.trunc(19 /* sizeof(const char *const [19]) */ / 1 /* sizeof(const char *const) */)); i++) {
        al = strlen(__ch_ksound_ch_k[i]);
        if (!((endstr - al) < basestr || strncmpi(((endstr - al)), (__ch_ksound_ch_k[i]), -1))) {
            return (1);
        }
    }
    return (0);
}
/* True: makeplural, False: makesingular */
const __badman_no_men = ["albu", "antihu", "anti", "ata", "auto", "bildungsro", "cai", "cay", "ceru", "corner", "decu", "des", "dura", "fir", "hanu", "het", "infrahu", "inhu", "nonhu", "otto", "out", "prehu", "protohu", "subhu", "superhu", "talis", "unhu", "sha", "hu", "un", "le", "re", "so", "to", "at", "a"];
const __badman_no_man = ["abdo", "acu", "agno", "ceru", "cogno", "cycla", "fleh", "grava", "hegu", "preno", "sonar", "speci", "dai", "exa", "fla", "sta", "teg", "tegu", "vela", "da", "hy", "lu", "no", "nu", "ra", "ru", "se", "vi", "ya", "o", "a"];
export function badman(basestr, to_plural) {
    let i = 0;
    let al = 0;
    let endstr = null;
    let spot = null;
    if (!basestr || strlen(basestr) < 4) {
        return (0);
    }
    endstr = eos(basestr);
    if (to_plural) {
        for (i = 0; i < (Math.trunc(36 /* sizeof(const char *const [36]) */ / 1 /* sizeof(const char *const) */)); i++) {
            al = strlen(__badman_no_men[i]);
            spot = endstr - (al + 3);
            if (!((spot) < basestr || strncmpi((spot), __badman_no_men[i], al)) && (spot == basestr || __nh_char_at0((spot - 1)) == 32)) {
                return (1);
            }
        }
    } else {
        for (i = 0; i < (Math.trunc(31 /* sizeof(const char *const [31]) */ / 1 /* sizeof(const char *const) */)); i++) {
            al = strlen(__badman_no_man[i]);
            spot = endstr - (al + 3);
            if (!((spot) < basestr || strncmpi((spot), __badman_no_man[i], al)) && (spot == basestr || __nh_char_at0((spot - 1)) == 32)) {
                return (1);
            }
        }
    }
    return (0);
}
/* compare user string against object name string using fuzzy matching */
/* from user, so might be variant spelling */
/* from objects[], so is in canonical form */
/* optional extra "of" handling */
const __wishymatch_detect_SP = "detect ";
const __wishymatch_SP_detection = " detection";
export async function wishymatch(u_str, o_str, retry_inverted) {
    let p = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* ignore spaces & hyphens and upper/lower case when comparing */
    if (fuzzymatch(u_str, o_str, " -", (1))) {
        return (1);
    }
    if (retry_inverted) {
        let u_of = null;
        let o_of = null;
        /* when just one of the strings is in the form "foo of bar",
           convert it into "bar foo" and perform another comparison */
        u_of = strstri(u_str, " of ");
        o_of = strstri(o_str, " of ");
        if (u_of && !o_of) {
            const __wbuf = __nh_advance_str(u_of, 4) + " " + u_str.slice(0, u_str.length - u_of.length);
            if (fuzzymatch(__wbuf, o_str, " -", (1))) {
                return (1);
            }
        } else if (o_of && !u_of) {
            const __wbuf = __nh_advance_str(o_of, 4) + " " + o_str.slice(0, o_str.length - o_of.length);
            if (fuzzymatch(u_str, __wbuf, " -", (1))) {
                return (1);
            }
        }
    }
    if (!strncmp(o_str, "dwarvish ", 9)) {
        /* [note: if something like "elven speed boots" ever gets added, these
       special cases should be changed to call wishymatch() recursively in
       order to get the "of" inversion handling] */
        if (!strncmpi(u_str, "dwarven ", 8)) {
            return fuzzymatch(__nh_advance_str(u_str, 8), __nh_advance_str(o_str, 9), " -", (1));
        }
    } else if (!strncmp(o_str, "elven ", 6)) {
        if (!strncmpi(u_str, "elvish ", 7)) {
            return fuzzymatch(__nh_advance_str(u_str, 7), __nh_advance_str(o_str, 6), " -", (1));
        } else if (!strncmpi(u_str, "elfin ", 6)) {
            return fuzzymatch(__nh_advance_str(u_str, 6), __nh_advance_str(o_str, 6), " -", (1));
        }
    } else if (strstri(o_str, "helm") && strstri(u_str, "helmet")) {
        buf = copynchars(buf, u_str, 256 /* sizeof(char [256]) */ - 1);
        buf = strsubst(buf, "helmet", "helm");
        return await wishymatch(buf, o_str, (1));
    } else if (strstri(o_str, "gauntlets") && strstri(u_str, "gloves")) {
        /* -3: room to replace shorter "gloves" with longer "gauntlets" */
        buf = copynchars(buf, u_str, 256 /* sizeof(char [256]) */ - 1 - 3);
        buf = strsubst(buf, "gloves", "gauntlets");
        return await wishymatch(buf, o_str, (1));
    } else if (!strncmp(o_str, __wishymatch_detect_SP, 8 /* sizeof(const char [8]) */ - 1)) {
        if ((p = strstri(u_str, __wishymatch_SP_detection)) != null && !__nh_char_at0((__nh_advance_str(p, 11 /* sizeof(const char [11]) */) - 1))) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            strcat(strcpy(buf, __wishymatch_detect_SP), u_str);
            /* "detect monster" -> "detect monsters" */
            if (!strncmpi((u_str), ("monster"), -1)) {
                buf = strcat(buf, "s");
            }
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
            return fuzzymatch(buf, o_str, " -", (1));
        }
    } else if (strstri(o_str, __wishymatch_SP_detection)) {
        if (!strncmpi(u_str, __wishymatch_detect_SP, 8 /* sizeof(const char [8]) */ - 1)) {
            p = await makesingular(__nh_advance_str(u_str, 8 /* sizeof(const char [8]) */) - 1);
            strcat(strcpy(buf, p), __wishymatch_SP_detection);
            /* caller may be looping through objects[], so avoid
               churning through all the obufs */
            releaseobuf(p);
            return fuzzymatch(buf, o_str, " -", (1));
        }
    } else if (strstri(o_str, "ability")) {
        if ((p = strstri(u_str, "abilities")) != null && !__nh_char_at0((__nh_advance_str(p, 10 /* sizeof(char [10]) */) - 1))) {
            /* when presented with "foo of bar", makesingular() used to
           singularize both foo & bar, but now only does so for foo */
            /* catch "{potion(s),ring} of {gain,restore,sustain} abilities" */
            buf = strncpy(buf, u_str, ((u_str.length - p.length)));
            strcpy(buf + ((u_str.length - p.length)), "ability");
            return fuzzymatch(buf, o_str, " -", (1));
        }
    } else if (!strcmp(o_str, "aluminum")) {
        /* this special case doesn't really fit anywhere else... */
        /* (note that " wand" will have been stripped off by now) */
        if (!strncmpi((u_str), ("aluminium"), -1)) {
            return fuzzymatch(__nh_advance_str(u_str, 9), __nh_advance_str(o_str, 8), " -", (1));
        }
    }
    return (0);
}
// struct o_range: { name, oclass, f_o_range, l_o_range }
/* wishable subranges of objects */
const o_ranges = [{ name: "bag", oclass: TOOL_CLASS, f_o_range: SACK, l_o_range: BAG_OF_TRICKS }, { name: "lamp", oclass: TOOL_CLASS, f_o_range: OIL_LAMP, l_o_range: MAGIC_LAMP }, { name: "candle", oclass: TOOL_CLASS, f_o_range: TALLOW_CANDLE, l_o_range: WAX_CANDLE }, { name: "horn", oclass: TOOL_CLASS, f_o_range: TOOLED_HORN, l_o_range: HORN_OF_PLENTY }, { name: "shield", oclass: ARMOR_CLASS, f_o_range: SMALL_SHIELD, l_o_range: SHIELD_OF_REFLECTION }, { name: "hat", oclass: ARMOR_CLASS, f_o_range: FEDORA, l_o_range: DUNCE_CAP }, { name: "helm", oclass: ARMOR_CLASS, f_o_range: ELVEN_LEATHER_HELM, l_o_range: HELM_OF_TELEPATHY }, { name: "gloves", oclass: ARMOR_CLASS, f_o_range: LEATHER_GLOVES, l_o_range: GAUNTLETS_OF_DEXTERITY }, { name: "gauntlets", oclass: ARMOR_CLASS, f_o_range: LEATHER_GLOVES, l_o_range: GAUNTLETS_OF_DEXTERITY }, { name: "boots", oclass: ARMOR_CLASS, f_o_range: LOW_BOOTS, l_o_range: LEVITATION_BOOTS }, { name: "shoes", oclass: ARMOR_CLASS, f_o_range: LOW_BOOTS, l_o_range: IRON_SHOES }, { name: "cloak", oclass: ARMOR_CLASS, f_o_range: MUMMY_WRAPPING, l_o_range: CLOAK_OF_DISPLACEMENT }, { name: "shirt", oclass: ARMOR_CLASS, f_o_range: HAWAIIAN_SHIRT, l_o_range: T_SHIRT }, { name: "dragon scales", oclass: ARMOR_CLASS, f_o_range: GRAY_DRAGON_SCALES, l_o_range: YELLOW_DRAGON_SCALES }, { name: "dragon scale mail", oclass: ARMOR_CLASS, f_o_range: GRAY_DRAGON_SCALE_MAIL, l_o_range: YELLOW_DRAGON_SCALE_MAIL }, { name: "sword", oclass: WEAPON_CLASS, f_o_range: SHORT_SWORD, l_o_range: KATANA }, { name: "venom", oclass: VENOM_CLASS, f_o_range: BLINDING_VENOM, l_o_range: ACID_VENOM }, { name: "gray stone", oclass: GEM_CLASS, f_o_range: LUCKSTONE, l_o_range: FLINT }, { name: "grey stone", oclass: GEM_CLASS, f_o_range: LUCKSTONE, l_o_range: FLINT }];
/* alternate spellings; if the difference is only the presence or
   absence of spaces and/or hyphens (such as "pickaxe" vs "pick axe"
   vs "pick-axe") then there is no need for inclusion in this list;
   likewise for ``"of" inversions'' ("boots of speed" vs "speed boots") */
// struct alt_spellings: { sp, ob }
const spellings = [{ sp: "pickax", ob: PICK_AXE }, { sp: "whip", ob: BULLWHIP }, { sp: "saber", ob: SILVER_SABER }, { sp: "silver sabre", ob: SILVER_SABER }, { sp: "smooth shield", ob: SHIELD_OF_REFLECTION }, { sp: "grey dragon scale mail", ob: GRAY_DRAGON_SCALE_MAIL }, { sp: "grey dragon scales", ob: GRAY_DRAGON_SCALES }, { sp: "iron ball", ob: HEAVY_IRON_BALL }, { sp: "lantern", ob: BRASS_LANTERN }, { sp: "mattock", ob: DWARVISH_MATTOCK }, { sp: "amulet of poison resistance", ob: AMULET_VERSUS_POISON }, { sp: "amulet of protection", ob: AMULET_OF_GUARDING }, { sp: "amulet of telepathy", ob: AMULET_OF_ESP }, { sp: "helm of esp", ob: HELM_OF_TELEPATHY }, { sp: "gauntlets of ogre power", ob: GAUNTLETS_OF_POWER }, { sp: "gauntlets of giant strength", ob: GAUNTLETS_OF_POWER }, { sp: "elven chain mail", ob: ELVEN_MITHRIL_COAT }, { sp: "silver shield", ob: SHIELD_OF_REFLECTION }, { sp: "potion of sleep", ob: POT_SLEEPING }, { sp: "scroll of recharging", ob: SCR_CHARGING }, { sp: "recharging", ob: SCR_CHARGING }, { sp: "stone", ob: ROCK }, { sp: "camera", ob: EXPENSIVE_CAMERA }, { sp: "tee shirt", ob: T_SHIRT }, { sp: "can", ob: TIN }, { sp: "can opener", ob: TIN_OPENER }, { sp: "kelp", ob: KELP_FROND }, { sp: "eucalyptus", ob: EUCALYPTUS_LEAF }, { sp: "lembas", ob: LEMBAS_WAFER }, { sp: "tripe", ob: TRIPE_RATION }, { sp: "cookie", ob: FORTUNE_COOKIE }, { sp: "pie", ob: CREAM_PIE }, { sp: "huge meatball", ob: ENORMOUS_MEATBALL }, { sp: "huge chunk of meat", ob: ENORMOUS_MEATBALL }, { sp: "marker", ob: MAGIC_MARKER }, { sp: "hook", ob: GRAPPLING_HOOK }, { sp: "grappling iron", ob: GRAPPLING_HOOK }, { sp: "grapnel", ob: GRAPPLING_HOOK }, { sp: "grapple", ob: GRAPPLING_HOOK }, { sp: "protection from shape shifters", ob: RIN_PROTECTION_FROM_SHAPE_CHAN }, { sp: "accuracy", ob: RIN_INCREASE_ACCURACY }, { sp: "box", ob: LARGE_BOX }, { sp: "luck stone", ob: LUCKSTONE }, { sp: "load stone", ob: LOADSTONE }, { sp: "touch stone", ob: TOUCHSTONE }, { sp: "flintstone", ob: FLINT }, { sp: null, ob: 0 }];
/* likely conflated name */
/* original name */
/* if we ever add other sizes, move this to o_ranges[] with "bag" */
/* normally we wouldn't have to worry about unnecessary <space>, but
       " stone" will get stripped off, preventing a wishymatch; that actually
       lets "flint stone" be a match, so we also accept bogus "flintstone" */
export function rnd_otyp_by_wpnskill(skill) {
    let i = 0;
    let n = 0;
    let otyp = STRANGE_OBJECT;
    for (i = game.bases[WEAPON_CLASS]; i < NUM_OBJECTS && game.objects[i].oc_class == WEAPON_CLASS; i++) {
        if (game.objects[i].oc_subtyp == skill) {
            n++;
            otyp = i;
        }
    }
    if (n > 0) {
        n = rn2(n);
        for (i = game.bases[WEAPON_CLASS]; i < NUM_OBJECTS && game.objects[i].oc_class == WEAPON_CLASS; i++) {
            if (game.objects[i].oc_subtyp == skill) {
                if (--n < 0) {
                    return i;
                }
            }
        }
    }
    return otyp;
}
/* add to item's chance of being chosen; non-zero causes
                    * 0% random generation items to also be considered */
export async function rnd_otyp_by_namedesc(name, oclass, xtra_prob) {
    let i = 0;
    let n = 0;
    let validobjs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let zn = null;
    let of = null;
    let check_of = 0;
    let lo = 0;
    let hi = 0;
    let minglob = 0;
    let maxglob = 0;
    let prob = 0;
    let maxprob = 0;
    if (!name || !__nh_char_at0(name)) {
        return STRANGE_OBJECT;
    }
    /* only skip "foo of" for "foo of bar" if target doesn't contain " of " */
    check_of = (strstri(name, " of ") == null);
    minglob = GLOB_OF_GRAY_OOZE;
    maxglob = GLOB_OF_BLACK_PUDDING;
    memset(validobjs, 0, 962 /* sizeof(short [481]) */);
    if (oclass) {
        lo = game.bases[oclass];
        hi = game.bases[oclass + 1] - 1;
    } else {
        lo = MAXOCLASSES;
        hi = NUM_OBJECTS - 1;
    }
    for (i = lo; i <= hi; ++i) {
        /* FIXME:
     * When this spans classes (the !oclass case), the item
     * probabilities are not very useful because they don't take
     * the class generation probability into account.  [If 10%
     * of spellbooks were blank and 1% of scrolls were blank,
     * "blank" would have 10/11 chance to yield a book even though
     * scrolls are supposed to be much more common than books.]
     */
        /* don't match extra descriptions (w/o real name) */
        if ((zn = (game.obj_descr[(game.objects[i]).oc_name_idx].oc_name)) == null) {
            continue;
        }
        if (await wishymatch(name, zn, (1)) || (check_of && i != BELL_OF_OPENING && (i < minglob || i > maxglob) && (of = strstri(zn, " of ")) != null && await wishymatch(name, __nh_advance_str(of, 4), (0))) || ((zn = (game.obj_descr[(game.objects[i]).oc_descr_idx].oc_descr)) != null && await wishymatch(name, zn, (0))) || (zn && check_of && (of = strstri(zn, " of ")) != null && await wishymatch(name, __nh_advance_str(of, 4), (0))) || ((zn = game.objects[i].oc_uname) != null && await wishymatch(name, zn, (0)))) {
            validobjs[n++] = i;
            maxprob += (game.objects[i].oc_prob + xtra_prob);
        }
    }
    if (n > 0 && maxprob) {
        /* let "<bar>" match "<foo> of <bar>" (already does if foo is
               an object class, but this is for lump of royal jelly,
               clove of garlic, bag of tricks, &c) with a few exceptions:
               for "opening", don't match "bell of opening"; for monster
               type ooze/pudding/slime don't match glob of same since that
               ought to match "corpse/egg/figurine of type" too but won't */
        /* "cloth" should match "piece of cloth"; there's only one
               description containing " of " so no special case handling */
        prob = rn2(maxprob);
        for (i = 0; i < n - 1; i++) {
            if ((prob -= (game.objects[validobjs[i]].oc_prob + xtra_prob)) < 0) {
                break;
            }
        }
        return validobjs[i];
    }
    return STRANGE_OBJECT;
}
export async function shiny_obj(oclass) {
    return await rnd_otyp_by_namedesc("shiny", oclass, 0);
}
/* set wall under hero undiggable/unphaseable from string */
export function set_wallprop_from_str(bp) {
    let wall_prop = 0;
    if (strstr(bp, "undiggable ") || strstr(bp, "nondiggable ")) {
        wall_prop |= 8;
    }
    if (strstr(bp, "unphaseable ") || strstr(bp, "nonpasswall ")) {
        wall_prop |= 16;
    }
    /* |= because wall_info (aka flags) is overloaded with other stuff */
    if (wall_prop) {
        game.level.locations[game.u.ux][game.u.uy].flags |= wall_prop;
    }
}
/* in wizard mode, readobjnam() can accept wishes for traps and terrain */
export async function wizterrainwish(d) {
    let lev = null;
    let madeterrain = (0);
    let badterrain = (0);
    let is_dbridge = 0;
    let trap = 0;
    let oldtyp = 0;
    let ltyp = 0;
    let x = game.u.ux;
    let y = game.u.uy;
    let bp = d.bp;
    let p = null;
    for (trap = NO_TRAP + 1; trap < TRAPNUM; trap++) {
        let t = null;
        let tname = null;
        tname = trapname(trap, (1));
        if (!str_start_is(bp, tname, (1))) {
            continue;
        }
        /* found it; avoid stupid mistakes */
        if (((trap) == HOLE || (trap) == TRAPDOOR) && !Can_fall_thru(game.u.uz)) {
            trap = ROCKTRAP;
        }
        if ((t = await maketrap(x, y, trap)) != null) {
            trap = t.ttyp;
            tname = trapname(trap, (1));
            await pline("%s%s.", await An(tname), (trap != MAGIC_PORTAL) ? "" : " to nowhere");
        } else {
            await pline("Creation of %s failed.", await an(tname));
        }
        return game.hands_obj;
    }
    /* furniture and terrain (use at your own risk; can clobber stairs
       or place furniture on existing traps which shouldn't be allowed) */
    lev = game.level.locations[x][y];
    oldtyp = lev.typ;
    is_dbridge = (oldtyp == DRAWBRIDGE_DOWN || oldtyp == DRAWBRIDGE_UP);
    p = eos(bp);
    if (!((p - 8) < bp || strncmpi(((p - 8)), ("fountain"), -1))) {
        lev.typ = FOUNTAIN;
        if (oldtyp != FOUNTAIN) {
            game.level.flags.nfountains++;
        }
        lev.flags = d.flags ? 1 : 0;
        lev.horizontal = d.blessed || !strncmpi(bp, "magic ", 6);
        await pline("A %sfountain.", lev.horizontal ? "magic " : "");
        /* ("water" matches "potion of water" rather than terrain) */
        /* also matches "molten lava" */
        madeterrain = (1);
    } else if (!((p - 6) < bp || strncmpi(((p - 6)), ("throne"), -1))) {
        lev.typ = THRONE;
        lev.flags = d.flags ? 1 : 0;
        await pline("A throne.");
        madeterrain = (1);
    } else if (!((p - 4) < bp || strncmpi(((p - 4)), ("sink"), -1))) {
        lev.typ = SINK;
        if (oldtyp != SINK) {
            game.level.flags.nsinks++;
        }
        lev.flags = d.flags ? (1 | 2 | 4) : 0;
        await pline("A sink.");
        madeterrain = (1);
    } else if (!((p - 4) < bp || strncmpi(((p - 4)), ("pool"), -1)) || !((p - 4) < bp || strncmpi(((p - 4)), ("moat"), -1)) || !((p - 13) < bp || strncmpi(((p - 13)), ("wall of water"), -1))) {
        let save_prop = 0;
        let new_water = null;
        ltyp = !((p - 4) < bp || strncmpi(((p - 4)), ("pool"), -1)) ? POOL : !((p - 4) < bp || strncmpi(((p - 4)), ("moat"), -1)) ? MOAT : WATER;
        if (!is_dbridge) {
            lev.typ = ltyp;
            lev.flags = 0;
        } else {
            /* drawbridgemask overloads flags */
            lev.flags &= ~28;
            lev.flags |= 0;
        }
        await del_engr_at(x, y);
        if (!is_dbridge) {
            save_prop = game.u.uprops[HALLUC_RES].extrinsic;
            game.u.uprops[HALLUC_RES].extrinsic = 1;
            new_water = waterbody_name(x, y);
            game.u.uprops[HALLUC_RES].extrinsic = save_prop;
            await pline("%s.", await An(new_water));
        } else {
            await dbterrainmesg("Moat", x, y);
        }
        await water_damage_chain(game.level.objects[x][y], (1));
        madeterrain = (1);
    } else if (!((p - 4) < bp || strncmpi(((p - 4)), ("lava"), -1)) || !((p - 12) < bp || strncmpi(((p - 12)), ("wall of lava"), -1))) {
        ltyp = !((p - 12) < bp || strncmpi(((p - 12)), ("wall of lava"), -1)) ? LAVAWALL : LAVAPOOL;
        if (!is_dbridge) {
            lev.typ = ltyp;
            lev.flags = 0;
        } else {
            lev.flags &= ~28;
            lev.flags |= 4;
        }
        await del_engr_at(x, y);
        if (!is_dbridge) {
            await pline("A %s of molten lava.", (lev.typ == LAVAPOOL) ? "pool" : "wall");
            if (!(((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) || lev.typ == LAVAWALL) {
                await pooleffects((0));
            }
        } else {
            await dbterrainmesg("Lava", x, y);
        }
        await fire_damage_chain(game.level.objects[x][y], (1), (1), x, y);
        madeterrain = (1);
    } else if (!((p - 3) < bp || strncmpi(((p - 3)), ("ice"), -1))) {
        if (!is_dbridge) {
            lev.typ = ICE;
            /* icedpool overloads flags; specifies what ice will melt into */
            lev.flags = (oldtyp == ROOM) ? 8 : 16;
        } else {
            lev.flags &= ~28;
            lev.flags |= 8;
        }
        await del_engr_at(x, y);
        if (!strncmpi(bp, "melting ", 8)) {
            await start_melt_ice_timeout(x, y, 0);
        }
        if (!is_dbridge) {
            let icebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            await pline("%s.", upstart(ice_descr(x, y, icebuf)));
        } else {
            await dbterrainmesg("Ice", x, y);
        }
        madeterrain = (1);
    } else if (!((p - 5) < bp || strncmpi(((p - 5)), ("altar"), -1))) {
        let al = 0;
        lev.typ = ALTAR;
        if (!strncmpi(bp, "chaotic ", 8)) {
            al = (-1);
        } else if (!strncmpi(bp, "neutral ", 8)) {
            al = 0;
        } else if (!strncmpi(bp, "lawful ", 7)) {
            al = 1;
        } else if (!strncmpi(bp, "unaligned ", 10)) {
            al = (-128);
        /* -1 - A_CHAOTIC, 0 - A_NEUTRAL, 1 - A_LAWFUL */
        } else {
            al = !rn2(6) ? (-128) : (rn2(1 + 2) - 1);
        }
        lev.flags = ((((al) == (-128)) ? 0 : ((al) == 1) ? 4 : ((al) + 2)));
        await pline("%s altar.", await An(align_str(al)));
        madeterrain = (1);
    } else if (!((p - 5) < bp || strncmpi(((p - 5)), ("grave"), -1)) || !((p - 9) < bp || strncmpi(((p - 9)), ("headstone"), -1))) {
        await make_grave(x, y, null);
        if (((lev.typ) == GRAVE)) {
            lev.flags = 0;
            lev.horizontal = d.flags ? 1 : 0;
            await pline("A %sgrave.", lev.horizontal ? "disturbed " : "");
            madeterrain = (1);
        } else {
            await pline("Can't place a grave here.");
            badterrain = (1);
        }
    } else if (!((p - 4) < bp || strncmpi(((p - 4)), ("tree"), -1))) {
        lev.typ = TREE;
        lev.flags = d.flags ? (1 | 2) : 0;
        set_wallprop_from_str(bp);
        await pline("A tree.");
        madeterrain = (1);
    } else if (!((p - 4) < bp || strncmpi(((p - 4)), ("bars"), -1))) {
        lev.typ = IRONBARS;
        lev.flags = 0;
        set_wallprop_from_str(bp);
        await pline("Iron bars.");
        madeterrain = (1);
    } else if (!((p - 5) < bp || strncmpi(((p - 5)), ("cloud"), -1))) {
        lev.typ = CLOUD;
        lev.flags = 0;
        await pline("A cloud.");
        await del_engr_at(x, y);
        madeterrain = (1);
    } else if (!((p - 4) < bp || strncmpi(((p - 4)), ("door"), -1)) || (d.doorless && !((p - 7) < bp || strncmpi(((p - 7)), ("doorway"), -1)))) {
        let dbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let old_wall_info = 0;
        let secret = !((p - 11) < bp || strncmpi(((p - 11)), ("secret door"), -1));
        if (lev.typ == DOOR || lev.typ == SDOOR || (((lev.typ) && (lev.typ) <= DBWALL) && lev.typ != DBWALL) || lev.typ == IRONBARS) {
            /* require door or wall so that the 'horizontal' flag will
           already have the correct value; player might choose to put
           DOOR on top of existing DOOR or SDOOR on top of existing SDOOR
           to control its trapped state; iron bars are surrogate walls;
           a previously dug wall looks like corridor but is actually a
           doorless doorway so will be acceptable here */
            /* remember previous wall info [is this right for iron bars?] */
            old_wall_info = (lev.typ != DOOR) ? lev.flags : 0;
            /* set the new terrain type */
            lev.typ = secret ? SDOOR : DOOR;
            lev.flags = 0;
            if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                /* lev->horizontal stays as-is */
                /* all doors on the rogue level are doorless; locking magic
                   there converts them into walls rather than closed doors */
                d.doorless = 1;
                d.locked = d.closed = d.open = d.broken = 0;
            }
            /* if not locked, secret doors are implicitly closed but
               mustn't be set that way explicitly because they use both
               doormask and wall_info which both overload rm[x][y].flags
               (CLOSED overlaps wall_info bits, LOCKED and TRAPPED don't);
               conversion from SDOOR to DOOR changes NODOOR to CLOSED */
            lev.flags = d.locked ? 8 : (d.doorless || secret) ? 0 : d.open ? 2 : d.broken ? 1 : 4;
            /* SDOOR uses wall_info, restore relevant bits.
             * FIXME? if we're changing a regular door into a secret door,
             * old_wall_info bits will be 0 instead of being set properly.
             * Probably only matters if player uses Passes_walls and a wish
             * to turn a T- or cross-wall into a door, losing wall info,
             * and then another wish to turn that door into a secret door. */
            if (secret) {
                lev.flags |= (old_wall_info & 7);
            }
            /* set up trapped flag; open door states aren't eligible */
            /* 2: wish includes explicit "untrapped" */
            if (d.trapped == 2 || ((lev.flags & (8 | 4)) == 0 && !secret)) {
                /* undo any previous "untrapped" */
                d.trapped = 0;
            }
            if (d.trapped) {
                lev.flags |= 16;
            }
            dbuf[0] = 0;
            if (lev.flags & 16) {
                dbuf = strcat(dbuf, "trapped ");
            }
            if (lev.flags & 8) {
                dbuf = strcat(dbuf, "locked ");
            }
            if (lev.typ == SDOOR) {
                dbuf = strcat(dbuf, "secret door");
            } else {
                /* these should be mutually exclusive but we describe them
                   as if they're independent to maybe catch future bugs... */
                if (lev.flags & 4) {
                    dbuf = strcat(dbuf, "closed ");
                }
                if (lev.flags & 2) {
                    dbuf = strcat(dbuf, "open ");
                }
                if (lev.flags & 1) {
                    dbuf = strcat(dbuf, "broken ");
                }
                if ((lev.flags & ~16) == 0) {
                    dbuf = strcat(dbuf, "doorless doorway");
                } else {
                    dbuf = strcat(dbuf, "door");
                }
            }
            await pline("%s.", upstart(await an(dbuf)));
            madeterrain = (1);
        } else {
            dbuf = strcpy(dbuf, secret ? "secret door" : "door");
            await pline("%s requires door or wall location.", upstart(dbuf));
            badterrain = (1);
        }
    } else if (!((p - 4) < bp || strncmpi(((p - 4)), ("wall"), -1)) && (bp == p - 4 || __nh_char_at0(__nh_advance_str(p, -5)) == 32)) {
        let wall = HWALL;
        if ((isok(game.u.ux, game.u.uy - 1) && ((game.level.locations[game.u.ux][game.u.uy - 1].typ) && (game.level.locations[game.u.ux][game.u.uy - 1].typ) <= DBWALL)) || (isok(game.u.ux, game.u.uy + 1) && ((game.level.locations[game.u.ux][game.u.uy + 1].typ) && (game.level.locations[game.u.ux][game.u.uy + 1].typ) <= DBWALL))) {
            wall = VWALL;
        }
        madeterrain = (1);
        lev.typ = wall;
        lev.flags = 0;
        set_wallprop_from_str(bp);
        await fix_wall_spines(((0) > (game.u.ux - 1) ? (0) : (game.u.ux - 1)), ((0) > (game.u.uy - 1) ? (0) : (game.u.uy - 1)), ((80) < (game.u.ux + 1) ? (80) : (game.u.ux + 1)), ((21) < (game.u.uy + 1) ? (21) : (game.u.uy + 1)));
        await pline("A wall.");
    } else if (!((p - 15) < bp || strncmpi(((p - 15)), ("secret corridor"), -1))) {
        if (lev.typ == CORR) {
            lev.typ = SCORR;
            await pline("Secret corridor.");
            madeterrain = (1);
        } else {
            await pline("Secret corridor requires corridor location.");
            badterrain = (1);
        }
    } else if (!((p - 4) < bp || strncmpi(((p - 4)), ("room"), -1)) || !((p - 5) < bp || strncmpi(((p - 5)), ("floor"), -1)) || !((p - 6) < bp || strncmpi(((p - 6)), ("ground"), -1))) {
        if (oldtyp == ROOM || (((oldtyp) >= STAIRS && (oldtyp) <= ALTAR) && (game.iflags.debug_overwrite_stairs || !((oldtyp) == LADDER || (oldtyp) == STAIRS))) || oldtyp == ICE || is_pool_or_lava(x, y)) {
            let t = null;
            lev.typ = ROOM;
            await pline("Room floor.");
            if (((oldtyp) >= STAIRS && (oldtyp) <= ALTAR)) {
                count_level_features();
            }
            if ((t = t_at(x, y)) != null && t.ttyp != MAGIC_PORTAL) {
                await deltrap(t);
            }
            madeterrain = (1);
        } else if (is_dbridge) {
            lev.flags &= ~28;
            lev.flags |= 16;
            await dbterrainmesg("Floor", x, y);
            madeterrain = (1);
        } else {
            await pline("Room|floor|ground not allowed here.");
            badterrain = (1);
        }
    }
    if (madeterrain) {
        await feel_newsym(x, y);
        if (game.u.uinwater && !is_pool(game.u.ux, game.u.uy)) {
            await set_uinwater(0);
            await docrt();
        } else {
            if (game.u.utrap && game.u.utraptype == TT_LAVA && !is_lava(game.u.ux, game.u.uy)) {
                await reset_utrap((0));
            }
            recalc_block_point(x, y);
        }
        /* fixups for replaced terrain that aren't handled above */
        if (((oldtyp) == FOUNTAIN) || ((oldtyp) == SINK)) {
            count_level_features();
        }
        /* update level.flags.nfountains,nsinks */
        if (!is_ice(x, y)) {
            spot_stop_timers(x, y, MELT_ICE_AWAY);
        }
        if (((oldtyp) == FOUNTAIN) || ((oldtyp) == GRAVE) || ((oldtyp) && (oldtyp) <= DBWALL) || oldtyp == IRONBARS || ((oldtyp) == DOOR) || oldtyp == SDOOR) {
            /* horizontal is overlaid by fountain->blessedftn, grave->disturbed */
            /* when new terrain is a fountain, 'blessedftn' was explicitly
               set above; likewise for grave and 'disturbed'; when it's a
               door, the old type was a wall or a door and we retain the
               'horizontal' value from those */
            if (!((lev.typ) == FOUNTAIN) && !((lev.typ) == GRAVE) && !((lev.typ) == DOOR) && lev.typ != SDOOR) {
                lev.horizontal = 0;
            }
        }
        await switch_terrain();
    }
    if (madeterrain || badterrain) {
        return game.hands_obj;
    }
    return null;
}
/* message common to several wizterrainwish() results */
export async function dbterrainmesg(newtype, x, y) {
    await pline("%s %s the drawbridge.", newtype, (game.level.locations[x][y].typ == DRAWBRIDGE_UP) ? "in front of" : "under");
}
export function readobjnam_init(bp, d) {
    d.otmp = null;
    d.cnt = d.spe = d.spesgn = d.typ = 0;
    d.very = d.rechrg = d.blessed = d.uncursed = d.iscursed = d.ispoisoned = d.isgreased = d.eroded = d.eroded2 = d.erodeproof = d.halfeaten = d.islit = d.unlabeled = d.ishistoric = d.isdiluted = d.trapped = d.locked = d.unlocked = d.broken = d.open = d.closed = d.doorless = d.flags = d.real = d.fake = 0;
    d.tvariety = (-2);
    /* not specified, aka random */
    d.mgend = -1;
    d.mntmp = NON_PM;
    d.contents = 0;
    d.oclass = 0;
    d.actualn = d.dn = d.un = null;
    d.wetness = 0;
    d.gsize = 0;
    d.zombify = (0);
    d.bp = d.origbp = bp;
    d.p = null;
    d.name = null;
    d.ftype = game.context.current_fruit;
    memset(d.globbuf, 0, 256 /* sizeof(char [256]) */);
    memset(d.fruitbuf, 0, 256 /* sizeof(char [256]) */);
}
/* return 1 if d->bp is empty or contains only various qualifiers like
   "blessed", "rustproof", and so on, or 0 if anything else is present */
export function readobjnam_preparse(d) {
    let save_bp = null;
    let more_l = 0;
    let res = 1;
    for (; ; ) {
        let l = 0;
        if (!d.bp || !__nh_char_at0(d.bp)) {
            break;
        }
        res = 0;
        if (!strncmpi(d.bp, "an ", l = 3) || !strncmpi(d.bp, "a ", l = 2)) {
            d.cnt = 1;
        } else if (!strncmpi(d.bp, "the ", l = 4)) {
            ;
        } else if (!d.cnt && digit(__nh_char_at0(d.bp)) && strcmp(d.bp, "0")) {
            /* just increment `bp' by `l' below */
            d.cnt = atoi(d.bp);
            while (digit(__nh_char_at0(d.bp))) {
                (d.bp = __nh_advance_str(d.bp, 1));
            }
            while (__nh_char_at0(d.bp) == 32) {
                (d.bp = __nh_advance_str(d.bp, 1));
            }
            l = 0;
        } else if (__nh_char_at0(d.bp) == 43 || __nh_char_at0(d.bp) == 45) {
            d.spesgn = ((d.bp = __nh_advance_str(d.bp, 1)) == 43) ? 1 : -1;
            d.spe = atoi(d.bp);
            while (digit(__nh_char_at0(d.bp))) {
                (d.bp = __nh_advance_str(d.bp, 1));
            }
            while (__nh_char_at0(d.bp) == 32) {
                (d.bp = __nh_advance_str(d.bp, 1));
            }
            l = 0;
        } else if (!strncmpi(d.bp, "blessed ", l = 8) || !strncmpi(d.bp, "holy ", l = 5)) {
            d.blessed = 1 , d.uncursed = d.iscursed = 0;
        } else if (!strncmpi(d.bp, "cursed ", l = 7) || !strncmpi(d.bp, "unholy ", l = 7)) {
            d.iscursed = 1 , d.blessed = d.uncursed = 0;
        } else if (!strncmpi(d.bp, "uncursed ", l = 9)) {
            d.uncursed = 1 , d.blessed = d.iscursed = 0;
        } else if (!strncmpi(d.bp, "rustproof ", l = 10) || !strncmpi(d.bp, "erodeproof ", l = 11) || !strncmpi(d.bp, "corrodeproof ", l = 13) || !strncmpi(d.bp, "fixed ", l = 6) || !strncmpi(d.bp, "fireproof ", l = 10) || !strncmpi(d.bp, "rotproof ", l = 9) || !strncmpi(d.bp, "tempered ", l = 9) || !strncmpi(d.bp, "crackproof ", l = 11)) {
            d.erodeproof = 1;
        } else if (!strncmpi(d.bp, "lit ", l = 4) || !strncmpi(d.bp, "burning ", l = 8)) {
            d.islit = 1;
        } else if (!strncmpi(d.bp, "unlit ", l = 6) || !strncmpi(d.bp, "extinguished ", l = 13)) {
            /* "wet" and "moist" are only applicable for towels */
            d.islit = 0;
        } else if (!strncmpi(d.bp, "moist ", l = 6) || !strncmpi(d.bp, "wet ", l = 4)) {
            /* "unlabeled" and "blank" are synonymous */
            if (!strncmpi(d.bp, "wet ", 4)) {
                d.wetness = 3 + rn2(3);
            } else {
                d.wetness = rnd(2);
            }
        } else if (!strncmpi(d.bp, "unlabeled ", l = 10) || !strncmpi(d.bp, "unlabelled ", l = 11) || !strncmpi(d.bp, "blank ", l = 6)) {
            d.unlabeled = 1;
        } else if (!strncmpi(d.bp, "poisoned ", l = 9)) {
            /* "trapped" recognized but not honored outside wizard mode */
            d.ispoisoned = 1;
        } else if (!strncmpi(d.bp, "trapped ", l = 8)) {
            d.trapped = 0;
            if (game.flags.debug) {
                d.trapped = 1;
            }
        } else if (!strncmpi(d.bp, "untrapped ", l = 10)) {
            /* locked, unlocked, broken: box/chest lock states, also door states;
           open, closed, doorless: additional door states */
            d.trapped = 2;
        } else if (!strncmpi(d.bp, "locked ", l = 7)) {
            d.locked = d.closed = 1 , d.unlocked = d.broken = d.open = d.doorless = 0;
        } else if (!strncmpi(d.bp, "unlocked ", l = 9)) {
            d.unlocked = d.closed = 1 , d.locked = d.broken = d.open = d.doorless = 0;
        } else if (!strncmpi(d.bp, "broken ", l = 7)) {
            d.broken = 1 , d.locked = d.unlocked = d.open = d.closed = d.doorless = 0;
        } else if (!strncmpi(d.bp, "open ", l = 5)) {
            d.open = 1 , d.closed = d.locked = d.broken = d.doorless = 0;
        } else if (!strncmpi(d.bp, "closed ", l = 7)) {
            d.closed = 1 , d.open = d.locked = d.broken = d.doorless = 0;
        } else if (!strncmpi(d.bp, "doorless ", l = 9)) {
            /* looted: fountain/sink/throne/tree; disturbed: grave */
            d.doorless = 1 , d.open = d.closed = d.locked = d.unlocked = d.broken = 0;
        } else if (!strncmpi(d.bp, "looted ", l = 7) || !strncmpi(d.bp, "disturbed ", l = 10)) {
            /* overload disturbed grave with looted fountain here
                      even though they're separate in struct rm */
            d.flags = 1;
        } else if (!strncmpi(d.bp, "greased ", l = 8)) {
            d.isgreased = 1;
        } else if (!strncmpi(d.bp, "zombifying ", l = 11)) {
            d.zombify = (1);
        } else if (!strncmpi(d.bp, "very ", l = 5)) {
            /* very rusted very heavy iron ball */
            d.very = 1;
        } else if (!strncmpi(d.bp, "thoroughly ", l = 11)) {
            d.very = 2;
        } else if (!strncmpi(d.bp, "rusty ", l = 6) || !strncmpi(d.bp, "rusted ", l = 7) || !strncmpi(d.bp, "burnt ", l = 6) || !strncmpi(d.bp, "burned ", l = 7) || !strncmpi(d.bp, "cracked ", l = 8)) {
            d.eroded = 1 + d.very;
            d.very = 0;
        } else if (!strncmpi(d.bp, "corroded ", l = 9) || !strncmpi(d.bp, "rotted ", l = 7)) {
            d.eroded2 = 1 + d.very;
            d.very = 0;
        } else if (!strncmpi(d.bp, "partly eaten ", l = 13) || !strncmpi(d.bp, "partially eaten ", l = 16)) {
            d.halfeaten = 1;
        } else if (!strncmpi(d.bp, "historic ", l = 9)) {
            d.ishistoric = 1;
        } else if (!strncmpi(d.bp, "diluted ", l = 8)) {
            d.isdiluted = 1;
        } else if (!strncmpi(d.bp, "empty ", l = 6)) {
            d.contents = 1;
        } else if (!strncmpi(d.bp, "small ", l = 6)) {
            /* "small" might be part of monster name (mimic, if wishing
               for its corpse) rather than prefix for glob size; when
               used for globs, it might be either "small glob of <foo>" or
               "small <foo> glob" and user might add 's' even though plural
               doesn't accomplish anything because globs don't stack */
            /* "large" might be part of monster name (dog, cat, kobold,
               mimic) or object name (box, round shield) rather than
               prefix for glob size */
            if (strncmpi(__nh_advance_str(d.bp, l), "glob", 4) && !strstri(__nh_advance_str(d.bp, l), " glob")) {
                break;
            }
            d.gsize = 1;
        } else if (!strncmpi(d.bp, "medium ", l = 7)) {
            /* 5.0: in 3.6, "medium" was only used during wishing and the
               mid-size glob had no adjective when formatted, but as of
               5.0, "medium" has become an explicit part of the name for
               combined globs of at least 5 individual ones (owt >= 100)
               and less than 15 (owt < 300) */
            d.gsize = 2;
        } else if (!strncmpi(d.bp, "large ", l = 6)) {
            if (strncmpi(__nh_advance_str(d.bp, l), "glob", 4) && !strstri(__nh_advance_str(d.bp, l), " glob")) {
                break;
            }
            /* "very large " had "very " peeled off on previous iteration */
            d.gsize = (d.very != 1) ? 3 : 4;
        } else if (!strncmpi(d.bp, "real ", l = 5)) {
            /* accept "real Amulet of Yendor" with "blessed" or "cursed"
               or useless "erodeproof" before or after "real" ... */
            /* don't negate 'fake' here; "real fake amulet" and
                       * "fake real amulet" will both yield fake amulet
                       * (so will "real amulet" outside of wizard mode) */
            d.real = 1;
        } else if (!strncmpi(d.bp, "fake ", l = 5)) {
            /* ... and "fake Amulet of Yendor" likewise */
            /* ['real' isn't actually needed (unless we someday add
               "real gem" for random non-glass, non-stone)] */
            d.fake = 1 , d.real = 0;
        } else if (!strncmpi(d.bp, "female ", l = 7)) {
            d.mgend = FEMALE;
            /* if after "corpse/statue/figurine of", remove from string */
            if (save_bp) {
                strsubst(d.bp, "female ", "") , l = 0;
            }
        } else if (!strncmpi(d.bp, "male ", l = 5)) {
            d.mgend = MALE;
            if (save_bp) {
                strsubst(d.bp, "male ", "") , l = 0;
            }
        } else if (!strncmpi(d.bp, "neuter ", l = 7)) {
            d.mgend = NEUTRAL;
            /*
         * Corpse/statue/figurine gender hack:  in order to accept
         * "statue of a female gnome ruler" for gnome queen we need
         * to recognize and skip over "statue of [a ]".  Otherwise
         * we would only accept "female gnome ruler statue" and the
         * viable but silly "female statue of a gnome ruler".
         */
            if (save_bp) {
                strsubst(d.bp, "neuter ", "") , l = 0;
            }
        } else if ((!strncmpi(d.bp, "corpse ", l = 7) || !strncmpi(d.bp, "statue ", l = 7) || !strncmpi(d.bp, "figurine ", l = 9)) && !strncmpi(__nh_advance_str(d.bp, l), "of ", more_l = 3)) {
            /* we'll backtrack to here later */
            save_bp = d.bp;
            l += more_l , more_l = 0;
            if (!strncmpi(__nh_advance_str(d.bp, l), "a ", more_l = 2) || !strncmpi(__nh_advance_str(d.bp, l), "an ", more_l = 3) || !strncmpi(__nh_advance_str(d.bp, l), "the ", more_l = 4)) {
                l += more_l;
            }
        } else {
            break;
        }
        d.bp = __nh_advance_str(d.bp, l);
    }
    if (save_bp) {
        d.bp = save_bp;
    }
    return res;
}
export function readobjnam_parse_charges(d) {
    if (strlen(d.bp) > 1 && strrchr(d.bp, 40) != null) {
        /* C walks d->bp via a char* (d->p) and truncates in place with
           *p='\0'.  d->bp is a JS string here, so the in-place writes
           (__nh_char_write on the decoupled strrchr suffix) never landed
           — the trailing "(N:M)"/"(lit)" charge spec stayed attached to
           d->bp and broke the otyp name match (e.g. "wand of polymorph
           (0:30)" left actualn="polymorph (0:30)", which rnd_otyp_by_-
           namedesc can't match → random wand instead of WAN_POLYMORPH;
           seed0398/0399 #103).  Mirror C's net effect on the string:
           strip the "(...)" (and a single space before it), parse the
           charges from inside, then stitch any post-')' text back. */
        let keeptrailingchars = (1);
        const __s = coerceCStr(d.bp);
        const __lp = __s.lastIndexOf('(');
        /* C: if char before '(' is a space, terminate there (drops it) */
        const __tp = (__lp > 0 && __s.charAt(__lp - 1) === ' ') ? (__lp - 1) : __lp;
        const __prefix = __s.slice(0, __tp);
        const __q = __s.slice(__lp + 1); /* contents after '(' (mirrors ++p) */
        let __i = 0;
        let __tail = '';
        if (__q.slice(0, 4).toLowerCase() === 'lit)') {
            d.islit = 1;
            __tail = __q.slice(4); /* C: p += 3 → ')'; trailing = after ')' */
        } else {
            d.spe = atoi(__q);
            while (__i < __q.length && digit(__q.charCodeAt(__i))) __i++;
            if (__q.charAt(__i) === ':') {
                __i++;
                d.rechrg = d.spe;
                d.spe = atoi(__q.slice(__i));
                while (__i < __q.length && digit(__q.charCodeAt(__i))) __i++;
            }
            if (__q.charAt(__i) !== ')') {
                d.spe = d.rechrg = 0;
                /* mis-matched parentheses; rest of string will be ignored
                 * [probably we should restore everything back to '('
                 * instead since it might be part of "named ..."]
                 */
                keeptrailingchars = (0);
            } else {
                d.spesgn = 1;
                __tail = __q.slice(__i + 1); /* text after ')' */
            }
        }
        /* C: keeptrailingchars copies the post-')' text back onto bp at
           the '(' truncation point; otherwise the rest is dropped. */
        /* 'pp' points at 'pb's terminating '\0',
               'p' points at ')' and will be incremented past it */
        const __truncBp = keeptrailingchars ? (__prefix + __tail) : __prefix;
        /* In C, bp and origbp index the SAME buffer, so the truncation
           shows in both — but bp may already be advanced past qualifiers
           (preparse), so origbp keeps any leading prefix (e.g. "blessed ").
           bp is a suffix of origbp; rebuild origbp = its prefix + truncBp. */
        const __origFull = coerceCStr(d.origbp);
        d.bp = __truncBp;
        d.origbp = __origFull.slice(0, Math.max(0, __origFull.length - __s.length)) + __truncBp;
    }
    if (d.spe < 0) {
        /*
     * otmp->spe is type schar, so we don't want spe to be any bigger or
     * smaller.  Also, spe should always be positive --some cheaters may
     * try to confuse atoi().
     */
        /* cheaters get what they deserve */
        d.spesgn = -1;
        d.spe = abs(d.spe);
    }
    /* cap on obj->spe is independent of (and less than) SCHAR_LIM */
    if (d.spe > 99) {
        d.spe = 99;
    }
    /* slime mold uses d.ftype, so not affected */
    if (d.rechrg < 0 || d.rechrg > 7) {
        d.rechrg = 7;
    }
}
export async function readobjnam_postparse1(d) {
    let i = 0;
    if ((d.p = strstri(d.bp, " named ")) != null) {
        /* now we have the actual name, as delivered by xname, say
     *  green potions called whisky
     *  scrolls labeled "QWERTY"
     *  egg
     *  fortune cookies
     *  very heavy iron ball named hoei
     *  wand of wishing
     *  elven cloak
     */
        d.p = '';
        /* note: if 'name' is too long, oname() will truncate it */
        d.name = __nh_advance_str(d.p, 7);
    }
    if ((d.p = strstri(d.bp, " called ")) != null) {
        d.p = '';
        /* note: if 'un' is too long, obj lookup just won't match anything */
        d.un = __nh_advance_str(d.p, 8);
        for (i = 0; i < (Math.trunc(19 /* sizeof(const struct o_range [19]) */ / 1 /* sizeof(const struct o_range) */)); i++) {
            if (!strncmpi((d.bp), (o_ranges[i].name), -1)) {
                /* "helmet called telepathy" is not "helmet" (a specific type)
         * "shield called reflection" is not "shield" (a general type)
         */
                d.oclass = o_ranges[i].oclass;
                return 1;
            }
        }
    }
    if ((d.p = strstri(d.bp, " labeled ")) != null) {
        d.p = '';
        d.dn = __nh_advance_str(d.p, 9);
    } else if ((d.p = strstri(d.bp, " labelled ")) != null) {
        d.p = '';
        d.dn = __nh_advance_str(d.p, 10);
    }
    if ((d.p = strstri(d.bp, " of spinach")) != null) {
        d.p = '';
        d.contents = 2;
    }
    if ((d.p = strstri(d.bp, (game.obj_descr[(game.objects[AMULET_OF_YENDOR]).oc_descr_idx].oc_descr))) != null && (d.p == d.bp || __nh_char_at0(__nh_advance_str(d.p, -1)) == 32)) {
        /* real vs fake is only useful for wizard mode but we'll accept its
       parsing in normal play (result is never real Amulet for that case) */
        /* avoid false hit on "* glass" */
        let s = d.bp;
        /* "Amulet of Yendor" matches two items, name of real Amulet
           and description of fake one; player can explicitly specify
           "real" to disambiguate, but not specifying "fake" achieves
           the same thing; "real" and "fake" are parsed above with other
           prefixes so that combinations like "blessed real" and "real
           blessed" work as expected; also accept partial specification
           of the full name of the fake; unlike the prefix recognition
           loop above, these have to be in the right order when more
           than one is present (similar to worthless glass gems below) */
        if (!strncmpi(s, "cheap ", 6)) {
            d.fake = 1 , s = __nh_advance_str(s, 6);
        }
        if (!strncmpi(s, "plastic ", 8)) {
            d.fake = 1 , s = __nh_advance_str(s, 8);
        }
        if (!strncmpi(s, "imitation ", 10)) {
            d.fake = 1 , s = __nh_advance_str(s, 10);
        }
        ((s));
        /* suppress potential assigned-but-not-used complaint */
        /* when 'fake' is True, it overrides 'real' if both were given;
           when it is False, force 'real' whether that was specified or not */
        d.real = !d.fake;
        d.typ = d.real ? AMULET_OF_YENDOR : FAKE_AMULET_OF_YENDOR;
        return 2;
    }
    if (!strncmpi(d.bp, "pair of ", 8)) {
        /*
     * Skip over "pair of ", "pairs of", "set of" and "sets of".
     *
     * Accept "3 pair of boots" as well as "3 pairs of boots".  It is
     * valid English either way.  See makeplural() for more on pair/pairs.
     *
     * We should only double count if the object in question is not
     * referred to as a "pair of".  E.g. We should double if the player
     * types "pair of spears", but not if the player types "pair of
     * lenses".  Luckily (?) all objects that are referred to as pairs
     * -- boots, gloves, and lenses -- are also not mergeable, so cnt is
     * ignored anyway.
     */
        d.bp = __nh_advance_str(d.bp, 8);
        d.cnt *= 2;
    } else if (!strncmpi(d.bp, "pairs of ", 9)) {
        d.bp = __nh_advance_str(d.bp, 9);
        if (d.cnt > 1) {
            d.cnt *= 2;
        }
    } else if (!strncmpi(d.bp, "set of ", 7)) {
        d.bp = __nh_advance_str(d.bp, 7);
    } else if (!strncmpi(d.bp, "sets of ", 8)) {
        d.bp = __nh_advance_str(d.bp, 8);
    }
    /* Intercept pudding globs here; they're a valid wish target,
     * but we need them to not get treated like a corpse.
     * If a count is specified, it will be used to magnify weight
     * rather than to specify quantity (which is always 1 for globs).
     */
    i = strlen(d.bp);
    d.p = null;
    if (!strncmpi((d.bp), ("glob"), -1) || !((__nh_advance_str(d.bp, i) - 5) < d.bp || strncmpi(((__nh_advance_str(d.bp, i) - 5)), (" glob"), -1)) || !strncmpi((d.bp), ("globs"), -1) || !((__nh_advance_str(d.bp, i) - 6) < d.bp || strncmpi(((__nh_advance_str(d.bp, i) - 6)), (" globs"), -1)) || (d.p = strstri(d.bp, "glob of ")) != null || (d.p = strstri(d.bp, "globs of ")) != null) {
        d.mntmp = await name_to_mon(!d.p ? d.bp : (strstri(d.p, " of ") + 4), null);
        /* if we didn't recognize monster type, pick a valid one at random */
        if (d.mntmp == NON_PM) {
            d.mntmp = (rn2(PM_BLACK_PUDDING - PM_GRAY_OOZE) + (PM_GRAY_OOZE));
        }
        /* normally this would be done when makesingular() changes the value
           but canonical form here is already singular so that won't happen */
        if (d.cnt < 2 && strstri(d.bp, "globs")) {
            d.cnt = 2;
        }
        d.globbuf = sprintf(d.globbuf, "glob of %s", game.mons[d.mntmp].pmnames[NEUTRAL]);
        /* affects otmp->owt but not otmp->quan for globs */
        /* construct canonical spelling in case name_to_mon() recognized a
           variant (grey ooze) or player used inverted syntax (<foo> glob);
           if player has given a valid monster type but not valid glob type,
           object name lookup won't find it and wish attempt will fail */
        d.bp = d.globbuf;
        /* not useful for "glob of <foo>" object lookup */
        d.mntmp = NON_PM;
        d.oclass = FOOD_CLASS;
        d.actualn = d.bp , d.dn = null;
        return 1;
    } else {
        if (!strstri(d.bp, "wand ") && !strstri(d.bp, "spellbook ") && !strstri(d.bp, "gauntlets ") && !strstri(d.bp, "gloves ") && !strstri(d.bp, "finger ")) {
            if ((d.p = strstri(d.bp, "tin of ")) != null) {
                if (!strncmpi((__nh_advance_str(d.p, 7)), ("spinach"), -1)) {
                    /*
         * Find corpse type using "of" (figurine of an orc, tin of orc meat)
         * Don't check if it's a wand or spellbook.
         * (avoid "wand/finger of death" confusion).
         * Don't match "ogre" or "giant" monster name inside alternate item
         * names "gauntlets of ogre power" and "gauntlets of giant strength"
         * (or the alternate spelling of those, "gloves of ...").
         */
                    d.contents = 2;
                    d.mntmp = NON_PM;
                } else {
                    d.tmp = tin_variety_txt(__nh_advance_str(d.p, 7), { get value() { return d.tinv; }, set value(_v) { d.tinv = _v; } });
                    d.tvariety = d.tinv;
                    d.mntmp = await name_to_mon(__nh_advance_str(d.p, 7) + d.tmp, { get value() { return d.mgend; }, set value(_v) { d.mgend = _v; } });
                }
                /* "tin of foo" would be caught above, but plain "tin" has
           a random chance of yielding "tin wand" unless we do this */
                d.typ = TIN;
                return 2;
            } else if ((d.p = strstri(d.bp, " of ")) != null && ((d.mntmp = await name_to_mon(__nh_advance_str(d.p, 4), { get value() { return d.mgend; }, set value(_v) { d.mgend = _v; } })) >= LOW_PM)) {
                d.p = '';
            }
        }
    }
    if (strncmpi(d.bp, "samurai sword", 13) && strncmpi(d.bp, "wizard lock", 11) && strncmpi(d.bp, "death wand", 10) && strncmpi(d.bp, "master key", 10) && strncmpi(d.bp, "ninja-to", 8) && strncmpi(d.bp, "magenta", 7)) {
        /* Find corpse type w/o "of" (red dragon scale mail, yeti corpse) */
        /* not the "samurai" monster! */
        /* not the "wizard" monster! */
        /* 'of inversion', not Rider */
        let rest = null;
        if (d.mntmp < LOW_PM && strlen(d.bp) > 2 && ((d.mntmp = await name_to_monplus(d.bp, { get value() { return rest; }, set value(_v) { rest = _v; } }, { get value() { return d.mgend; }, set value(_v) { d.mgend = _v; } })) >= LOW_PM)) {
            let obp = d.bp;
            /* 'rest' is a pointer past the matching portion; if that was
               an alternate name or a rank title rather than the canonical
               monster name we wouldn't otherwise know how much to skip */
            d.bp = rest;
            if (__nh_char_at0(d.bp) == 32) {
                (d.bp = __nh_advance_str(d.bp, 1));
            } else if (!strncmpi(d.bp, "s ", 2) || (d.bp > d.origbp && !strncmpi(d.bp - 1, "s' ", 3))) {
                d.bp = __nh_advance_str(d.bp, 2);
            } else if (!strncmpi(d.bp, "es ", 3) || !strncmpi(d.bp, "'s ", 3)) {
                d.bp = __nh_advance_str(d.bp, 3);
            } else if (!__nh_char_at0(d.bp) && !d.actualn && !d.dn && !d.un && !d.oclass) {
                /* no referent; they don't really mean a monster type */
                d.bp = obp;
                d.mntmp = NON_PM;
            }
        }
    }
    if (__nh_char_at0(d.bp) && strncmpi((d.bp), ("tricks"), -1) && strncmpi((d.bp), ("clothes"), -1)) {
        let sng = await makesingular(d.bp);
        if (strcmp(d.bp, sng)) {
            /* first change to singular if necessary */
            /* we want "tricks" to match "bag of tricks" [rnd_otyp_by_namedesc()]
           but that wouldn't work if it gets singularized to "trick"
           ["tricks bag" matches whether or not this exception is present
           because singularize operates on "bag" and wishymatch()'s
           'of inversion' finds a match] */
            /* an odd potential wish; fail rather than get a false match with
           "cloth" because it might yield a "cloth spellbook" rather than
           a "piece of cloth" cloak [maybe we should give random armor?] */
            if (d.cnt == 1) {
                d.cnt = 2;
            }
            d.bp = strcpy(d.bp, sng);
        }
    }
{
        /* got a class, but not specific type;
       check alternate spellings of items with matching classes */
        let as = spellings;
        const __nhi_as_arr = as;
        for (let __nhi_as = 0; (as = __nhi_as_arr[__nhi_as]) && (as.sp); __nhi_as++) {
            if (await wishymatch(d.bp, as.sp, (1))) {
                /* Alternate spellings (pick-ax, silver sabre, &c) */
                d.typ = as.ob;
                return 2;
            }
        }
        /* can't use spellings list for this one due to shuffling */
        if (!strncmpi(d.bp, "grey spell", 10)) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 97) */;
        }
        if ((d.p = strstri(d.bp, "armour")) != null) {
            /* skip past "armo", then copy remainder beyond "u" */
            d.p = __nh_advance_str(d.p, 4);
            while ((void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = __nh_char_at0((__nh_advance_str(d.p, 1))) */) != 0) {
                (d.p = __nh_advance_str(d.p, 1));
            }
        }
    }
    if (!strncmpi((d.bp), ("scales"), -1) && d.mntmp >= PM_GRAY_DRAGON && d.mntmp <= PM_YELLOW_DRAGON) {
        /* dragon scales - assumes order of dragons */
        d.typ = GRAY_DRAGON_SCALES + d.mntmp - PM_GRAY_DRAGON;
        d.mntmp = NON_PM;
        return 2;
    }
    d.p = eos(d.bp);
    if (!((d.p - 10) < d.bp || strncmpi(((d.p - 10)), ("holy water"), -1))) {
        if (!((d.p - 10 - 2) < d.bp || strncmpi((d.p - 10 - 2), "un", 2))) {
            d.iscursed = 1 , d.blessed = d.uncursed = 0;
        /* this isn't needed for "[un]holy water" because adjective parsing
           handles holy==blessed and unholy==cursed and leaves "water" for
           the object type, but it is needed for "potion of [un]holy water"
           since that parsing stops when it reaches "potion"; also, neither
           "holy water" nor "unholy water" is an actual type of potion */
        } else {
            d.blessed = 1 , d.iscursed = d.uncursed = 0;
        }
        d.typ = POT_WATER;
        return 2;
    }
    if (!strncmpi(d.bp, "paperback", 9)) {
        /* accept "paperback" or "paperback book", reject "paperback spellbook" */
        let dbp = __nh_advance_str(d.bp, 9);
        if (!__nh_char_at0(dbp) || !strncmpi(dbp, " book", 5)) {
            d.typ = SPE_NOVEL;
            return 2;
        } else {
            /* treat "broken glass" as a non-existent item; since "broken" is
           also a chest/box prefix it might have been stripped off above */
            d.otmp = null;
            return 3;
        }
    }
    if (d.unlabeled && !((d.p - 6) < d.bp || strncmpi(((d.p - 6)), ("scroll"), -1))) {
        d.typ = SCR_BLANK_PAPER;
        return 2;
    }
    if (d.unlabeled && !((d.p - 9) < d.bp || strncmpi(((d.p - 9)), ("spellbook"), -1))) {
        d.typ = SPE_BLANK_PAPER;
        return 2;
    }
    if (!((d.p - 6) < d.bp || strncmpi(((d.p - 6)), ("orange"), -1)) && d.mntmp == NON_PM) {
        /* specific food rather than color of gem/potion/spellbook[/scales] */
        d.typ = ORANGE;
        return 2;
    }
    if (String(d.bp).toLowerCase().endsWith("gold piece") || String(d.bp).toLowerCase().endsWith("zorkmid") || !strncmpi((d.bp), ("gold"), -1) || !strncmpi((d.bp), ("money"), -1) || !strncmpi((d.bp), ("coin"), -1) || __nh_char_at0(d.bp) == GOLD_SYM) {
        /*
     * NOTE: Gold pieces are handled as objects nowadays, and therefore
     * this section should probably be reconsidered as well as the entire
     * gold/money concept.  Maybe we want to add other monetary units as
     * well in the future. (TH)
     */
        if (d.cnt > 5000 && !game.flags.debug) {
            d.cnt = 5000;
        } else if (d.cnt < 1) {
            d.cnt = 1;
        }
        d.otmp = await mksobj(GOLD_PIECE, (0), (0));
        d.otmp.quan = d.cnt;
        d.otmp.owt = await weight(d.otmp);
        game.disp.botl = (1);
        return 3;
    }
    if (strlen(d.bp) == 1 && (i = def_char_to_objclass(__nh_char_at0(d.bp))) < MAXOCLASSES && i > ILLOBJ_CLASS && (i != VENOM_CLASS || game.flags.debug)) {
        /* check for single character object class code ("/" for wand, &c) */
        d.oclass = i;
        return 4;
    }
    if (strncmpi(d.bp, "enchant ", 8) && strncmpi(d.bp, "destroy ", 8) && strncmpi(d.bp, "detect food", 11) && strncmpi(d.bp, "food detection", 14) && strncmpi(d.bp, "ring mail", 9) && strncmpi(d.bp, "studded leather armor", 21) && strncmpi(d.bp, "leather armor", 13) && strncmpi(d.bp, "tooled horn", 11) && strncmpi(d.bp, "food ration", 11) && strncmpi(d.bp, "meat ring", 9)) {
        for (i = 0; i < (13 /* sizeof(const char [13]) */); i++) {
            let j = await Strlen_(wrp[i], "readobjnam_postparse1", 4568);
            if (!strncmpi(d.bp, wrp[i], j)) {
                /* check for "<class> [ of ] something" */
                /* check for "something <class>" */
                d.oclass = wrpsym[i];
                if (d.oclass != AMULET_CLASS) {
                    d.bp = __nh_advance_str(d.bp, j);
                    if (!strncmpi(d.bp, " of ", 4)) {
                        d.actualn = __nh_advance_str(d.bp, 4);
                    }
                } else {
                    d.actualn = d.bp;
                }
                return 1;
            }
            if (!((d.p - j) < d.bp || strncmpi(((d.p - j)), (wrp[i]), -1))) {
                d.oclass = wrpsym[i];
                if (d.oclass != AMULET_CLASS) {
                    /* for "foo amulet", leave the class name so that
                   wishymatch() can do "of inversion" to try matching
                   "amulet of foo"; other classes don't include their
                   class name in their full object names (where
                   "potion of healing" is just "healing", for instance) */
                    d.p = __nh_advance_str(d.p, -(j));
                    d.p = '';
                    if (d.p > d.bp && __nh_char_at0(__nh_advance_str(d.p, -1)) == 32) {
                        d.p = __nh_char_write(d.p, -1, 0);
                    }
                } else {
                    let k = 0;
                    let l = 0;
                    let amubuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    if (!strncmpi(d.bp, "versus poison ", 14)) {
                        /* amulet without "of"; convoluted wording but better a
                       special case that's handled than one that's missing */
                        d.typ = AMULET_VERSUS_POISON;
                        return 2;
                    }
                    /* check for "<shape> amulet"; strip off trailing
                       " amulet" for that w/o changing contents of d->bp */
                    l = strlen(d.bp) - j;
                    if (l > 0 && __nh_char_at0(__nh_advance_str(d.bp, l - 1)) == 32) {
                        l -= 1;
                    }
                    amubuf = copynchars(amubuf, d.bp, ((l) < (256 /* sizeof(char [256]) */ - 1) ? (l) : (256 /* sizeof(char [256]) */ - 1)));
                    k = await rnd_otyp_by_namedesc(amubuf, AMULET_CLASS, 0);
                    if (k != STRANGE_OBJECT) {
                        d.typ = k;
                        return 2;
                    }
                }
                d.actualn = d.dn = d.bp;
                return 1;
            }
        }
    }
    if (game.flags.debug && (!strncmpi(d.bp, "bear", 4) || !strncmpi(d.bp, "land", 4))) {
        /* Wishing in wizard mode can create traps and furniture.
     * Part I:  distinguish between trap and object for the two
     * types of traps which have corresponding objects:  bear trap
     * and land mine.  "beartrap" (object) and "bear trap" (trap)
     * have a difference in spelling which we used to exploit by
     * adding a special case in wishymatch(), but "land mine" is
     * spelled the same either way so needs different handing.
     * Since we need something else for land mine, we've dropped
     * the bear trap hack so that both are handled exactly the
     * same.  To get an armed trap instead of a disarmed object,
     * the player can prefix either the object name or the trap
     * name with "trapped " (which ordinarily applies to chests
     * and tins), or append something--anything at all except for
     * " object", but " trap" is suggested--to either the trap
     * name or the object name.
     */
        let beartrap = (lowc(__nh_char_at0(d.bp)) == 98);
        let zp = __nh_advance_str(d.bp, 4);
        if (__nh_char_at0(zp) == 32) {
            (zp = __nh_advance_str(zp, 1));
        }
        if (!strncmpi(zp, beartrap ? "trap" : "mine", 4)) {
            /* embedded space is optional */
            zp = __nh_advance_str(zp, 4);
            /* [no prefix or suffix; we're going to end up matching
               the object name and getting a disarmed trap object] */
            if (d.trapped == 2 || !strncmpi((zp), (" object"), -1)) {
                /* "untrapped <foo>" or "<foo> object" */
                d.typ = beartrap ? BEARTRAP : LAND_MINE;
                return 2;
            } else if (d.trapped == 1 || __nh_char_at0(zp) != 0) {
                d.bp = strcpy(d.bp, trapname(beartrap ? BEAR_TRAP : LANDMINE, (1)));
                /* "trapped <foo>" or "<foo> trap" (actually "<foo>*") */
                /* use canonical trap spelling, skip object matching */
                return 5;
            }
        }
    }
    return 0;
}
export function readobjnam_postparse2(d) {
    let i = 0;
    for (i = 0; i < (Math.trunc(19 /* sizeof(const struct o_range [19]) */ / 1 /* sizeof(const struct o_range) */)); i++) {
        if (!strncmpi((d.bp), (o_ranges[i].name), -1)) {
            /* "grey stone" check must be before general "stone" */
            d.typ = rnd_class(o_ranges[i].f_o_range, o_ranges[i].l_o_range);
            return 2;
        }
    }
    if (!((d.p - 6) < d.bp || strncmpi(((d.p - 6)), (" stone"), -1)) || !((d.p - 4) < d.bp || strncmpi(((d.p - 4)), (" gem"), -1))) {
        d.p = __nh_char_write(d.p, !strncmpi((d.p - 4), (" gem"), -1) ? -4 : -6, 0);
        d.oclass = GEM_CLASS;
        d.dn = d.actualn = d.bp;
        return 1;
    } else if (!strncmpi((d.bp), ("looking glass"), -1)) {
        ;
    } else if (!((d.p - 6) < d.bp || strncmpi(((d.p - 6)), (" glass"), -1)) || !strncmpi((d.bp), ("glass"), -1)) {
        let s = d.bp;
        if (d.broken || strstri(s, "broken")) {
            d.otmp = null;
            return 3;
        }
        if (!strncmpi(s, "worthless ", 10)) {
            s = __nh_advance_str(s, 10);
        }
        if (!strncmpi(s, "piece of ", 9)) {
            s = __nh_advance_str(s, 9);
        }
        if (!strncmpi(s, "colored ", 8)) {
            s = __nh_advance_str(s, 8);
        } else if (!strncmpi(s, "coloured ", 9)) {
            s = __nh_advance_str(s, 9);
        }
        if (!strncmpi((s), ("glass"), -1)) {
            d.typ = FIRST_GLASS_GEM + rn2(NUM_GLASS_GEMS);
            if (game.objects[d.typ].oc_class == GEM_CLASS) {
                return 2;
            /* somebody changed objects[]? punt */
            } else {
                d.typ = 0;
            }
        } else {
            /* try to construct canonical form */
            let tbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            tbuf = strcpy(tbuf, "worthless piece of ");
            tbuf = strcat(tbuf, s);
            /* assume it starts with the color */
            d.bp = strcpy(d.bp, tbuf);
        }
    }
    d.actualn = d.bp;
    if (!d.dn) {
        d.dn = d.actualn;
    }
    return 0;
}
export async function readobjnam_postparse3(d) {
    let i = 0;
    if (!d.oclass && d.actualn) {
        for (i = game.bases[GEM_CLASS]; i <= LAST_REAL_GEM; i++) {
            /* check real names of gems first */
            let zn = null;
            if ((zn = (game.obj_descr[(game.objects[i]).oc_name_idx].oc_name)) != null && !strncmpi((d.actualn), (zn), -1)) {
                d.typ = i;
                return 2;
            }
        }
        if (!strncmpi((d.actualn), ("tin"), -1)) {
            d.typ = TIN;
            return 2;
        }
    }
    if (((d.typ = await rnd_otyp_by_namedesc(d.actualn, d.oclass, 1)) != STRANGE_OBJECT) || (d.dn != d.actualn && ((d.typ = await rnd_otyp_by_namedesc(d.dn, d.oclass, 1)) != STRANGE_OBJECT)) || ((d.typ = await rnd_otyp_by_namedesc(d.un, d.oclass, 1)) != STRANGE_OBJECT) || (d.origbp != d.actualn && ((d.typ = await rnd_otyp_by_namedesc(d.origbp, d.oclass, 1)) != STRANGE_OBJECT))) {
        return 2;
    }
    d.typ = 0;
    if (d.actualn) {
        let j = Japanese_items;
        const __nhi_j_arr = j;
        for (let __nhi_j = 0; (j = __nhi_j_arr[__nhi_j]) && (j.item); __nhi_j++) {
            if (!strncmpi((d.actualn), (j.name), -1)) {
                d.typ = j.item;
                return 2;
            }
        }
    }
    if (d.oclass == ARMOR_CLASS && !strstri(d.bp, "mail")) {
        d.bp = strcat(d.bp, " mail");
        /* if we've stripped off "armor" and failed to match anything
       in objects[], append "mail" and try again to catch misnamed
       requests like "plate armor" and "yellow dragon scale armor" */
        /* modifying bp's string is ok; we're about to resort
           to random armor if this also fails to match anything */
        return 6;
    }
    if (!strncmpi((d.bp), ("spinach"), -1)) {
        d.contents = 2;
        d.typ = TIN;
        return 2;
    }
{
        let fp = null;
        let l = 0;
        let cntf = 0;
        let blessedf = 0;
        let iscursedf = 0;
        let uncursedf = 0;
        let halfeatenf = 0;
        let f = null;
        blessedf = iscursedf = uncursedf = halfeatenf = 0;
        cntf = 0;
        fp = d.fruitbuf;
        for (; ; ) {
            if (!fp || !__nh_char_at0(fp)) {
                break;
            }
            if (!strncmpi(fp, "an ", l = 3) || !strncmpi(fp, "a ", l = 2)) {
                /* Fruits must not mess up the ability to wish for real objects (since
     * you can leave a fruit in a bones file and it will be added to
     * another person's game), so they must be checked for last, after
     * stripping all the possible prefixes and seeing if there's a real
     * name in there.  So we have to save the full original name.  However,
     * it's still possible to do things like "uncursed burnt Alaska",
     * or worse yet, "2 burned 5 course meals", so we need to loop to
     * strip off the prefixes again, this time stripping only the ones
     * possible on food.
     * We could get even more detailed so as to allow food names with
     * prefixes that _are_ possible on food, so you could wish for
     * "2 3 alarm chilis".  Currently this isn't allowed; options.c
     * automatically sticks 'candied' in front of such names.
     */
                /* Note: not strcmpi.  2 fruits, one capital, one not, are possible.
       Also not strncmp.  We used to ignore trailing text with it, but
       that resulted in "grapefruit" matching "grape" if the latter came
       earlier than the former in the fruit list. */
                cntf = 1;
            } else if (!cntf && digit(__nh_char_at0(fp))) {
                cntf = atoi(fp);
                while (digit(__nh_char_at0(fp))) {
                    (fp = __nh_advance_str(fp, 1));
                }
                while (__nh_char_at0(fp) == 32) {
                    (fp = __nh_advance_str(fp, 1));
                }
                l = 0;
            } else if (!strncmpi(fp, "blessed ", l = 8)) {
                blessedf = 1;
            } else if (!strncmpi(fp, "cursed ", l = 7)) {
                iscursedf = 1;
            } else if (!strncmpi(fp, "uncursed ", l = 9)) {
                uncursedf = 1;
            } else if (!strncmpi(fp, "partly eaten ", l = 13) || !strncmpi(fp, "partially eaten ", l = 16)) {
                halfeatenf = 1;
            } else {
                break;
            }
            fp = __nh_advance_str(fp, l);
        }
        for (f = game.ffruit; f; f = f.nextf) {
            /* match type: 0=none, 1=exact, 2=singular, 3=plural */
            let ftyp = 0;
            if (!strcmp(fp, f.fname)) {
                ftyp = 1;
            } else if (!strcmp(fp, await makesingular(f.fname))) {
                ftyp = 2;
            } else if (!strcmp(fp, await makeplural(f.fname))) {
                ftyp = 3;
            }
            if (ftyp) {
                d.typ = SLIME_MOLD;
                d.blessed = blessedf;
                d.iscursed = iscursedf;
                d.uncursed = uncursedf;
                d.halfeaten = halfeatenf;
                /* adjust count if user explicitly asked for
                   singular amount (can't happen unless fruit
                   has been given an already pluralized name)
                   or for plural amount */
                if (ftyp == 2 && !cntf) {
                    cntf = 1;
                } else if (ftyp == 3 && !cntf) {
                    cntf = 2;
                }
                d.cnt = cntf;
                d.ftype = f.fid;
                return 2;
            }
        }
    }
    if (!d.oclass && d.actualn) {
        let objtyp = 0;
        /* Perhaps it's an artifact specified by name, not type */
        d.name = artifact_name(d.actualn, { get value() { return objtyp; }, set value(_v) { objtyp = _v; } }, (1));
        if (d.name) {
            d.typ = objtyp;
            return 2;
        }
    }
    if (d.oclass && !d.typ) {
        let as = spellings;
        const __nhi_as_arr = as;
        for (let __nhi_as = 0; (as = __nhi_as_arr[__nhi_as]) && (as.sp); __nhi_as++) {
            if (game.objects[as.ob].oc_class == d.oclass && await wishymatch(d.bp, as.sp, (1))) {
                d.typ = as.ob;
                return 2;
            }
        }
    }
    return 0;
}
/*
 * Return something wished for.  Specifying a null pointer for
 * the user request string results in a random object.  Otherwise,
 * if asking explicitly for "nothing" (or "nil") return no_wish;
 * if not an object return &hands_obj; if an error (no matching object),
 * return null.
 */
export async function readobjnam(bp, no_wish) {
    let d = { otmp: null, bp: null, origbp: null, oclass: 0, un: null, dn: null, actualn: null, name: null, p: null, cnt: 0, spe: 0, spesgn: 0, typ: 0, very: 0, rechrg: 0, blessed: 0, uncursed: 0, iscursed: 0, ispoisoned: 0, isgreased: 0, eroded: 0, eroded2: 0, erodeproof: 0, locked: 0, unlocked: 0, broken: 0, real: 0, fake: 0, halfeaten: 0, mntmp: 0, contents: 0, islit: 0, unlabeled: 0, ishistoric: 0, isdiluted: 0, trapped: 0, doorless: 0, open: 0, closed: 0, flags: 0, tmp: 0, tinv: 0, tvariety: 0, mgend: 0, wetness: 0, gsize: 0, ftype: 0, zombify: 0, globbuf: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], fruitbuf: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    /* C uses goto srch/typfnd/any/wiztrap/retry from postparse1/2/3
       switch cases.  The translator left these as TODO no-ops which
       silently fell through to the next case (often `return d.otmp`
       where d.otmp is null) — so any wish reaching postparse3's case
       2 returned null instead of building the object via typfnd.
       Implement the gotos via flag variables: each case sets the
       appropriate flag and the block guards skip downstream sections
       accordingly. */
    let __goto_srch = false;
    let __goto_typfnd = false;
    let __goto_any = false;
    let __goto_wiztrap = false;
    let __goto_retry = false;
    let __retry_count = 0;
    retry: while (true) {
        if (++__retry_count > 4) break;
        __goto_srch = __goto_typfnd = __goto_any = __goto_wiztrap = __goto_retry = false;
        readobjnam_init(bp, d);
        if (!bp) { __goto_any = true; break; }
        /* first, remove extra whitespace they may have typed */
        bp = mungspaces(bp);
        /* allow wishing for "nothing" to preserve wishless conduct...
       [now requires "wand of nothing" if that's what was really wanted] */
        if (!strncmpi((bp), ("nothing"), -1) || !strncmpi((bp), ("nil"), -1) || !strncmpi((bp), ("none"), -1)) {
            return no_wish;
        }
        /* save the [nearly] unmodified choice string */
        d.fruitbuf = strcpy(d.fruitbuf, bp);
        if (readobjnam_preparse(d)) { __goto_any = true; break; }
        if (!d.cnt) {
            d.cnt = 1; /* will be changed to 2 if makesingular() changes string */
        }
        readobjnam_parse_charges(d);
        const __pp1 = await readobjnam_postparse1(d);
        if (__pp1 === 1) { __goto_srch = true; break; }
        if (__pp1 === 2) { __goto_typfnd = true; break; }
        if (__pp1 === 3) return d.otmp;
        if (__pp1 === 4) { __goto_any = true; break; }
        if (__pp1 === 5) { __goto_wiztrap = true; break; }
        const __pp2 = readobjnam_postparse2(d);
        if (__pp2 === 1) { __goto_srch = true; break; }
        if (__pp2 === 2) { __goto_typfnd = true; break; }
        if (__pp2 === 3) return d.otmp;
        if (__pp2 === 4) { __goto_any = true; break; }
        if (__pp2 === 5) { __goto_wiztrap = true; break; }
        /* fall through to srch block */
        __goto_srch = true;
        break;
    }
    /* srch: postparse3 dispatch.  C's `case 1: goto srch;` re-runs
       postparse3 — loop while case 1 keeps firing.  Other cases set
       their respective flags. */
    if (__goto_srch && !__goto_typfnd && !__goto_any && !__goto_wiztrap && !__goto_retry) {
        let __srch_iter = 0;
        srch_loop: while (++__srch_iter < 10) {
            const __pp3 = await readobjnam_postparse3(d);
            if (__pp3 === 0) break;
            if (__pp3 === 1) continue;  /* goto srch */
            if (__pp3 === 2) { __goto_typfnd = true; break; }
            if (__pp3 === 3) return d.otmp;
            if (__pp3 === 4) { __goto_any = true; break; }
            if (__pp3 === 5) { __goto_wiztrap = true; break; }
            if (__pp3 === 6) { __goto_retry = true; break; }
            break;
        }
    }
    if (__goto_retry) {
        /* C `goto retry` from postparse3 — needs full retry-loop
           restart.  Implemented via outer loop above (max 4 iters
           to bound any pathological retry chain).  For now, fall
           through to any/typfnd. */
    }
    if (!__goto_typfnd && !__goto_any) {
        /*
     * Let wizards wish for traps and furniture.
     * Must come after objects check so wizards can still wish for
     * trap objects like beartraps.
     * Disallow such topology tweaks for WIZKIT startup wishes.
     */
        /* wiztrap block — runs when reached via fall-through or
           __goto_wiztrap; either way, the debug-mode wizterrainwish
           check is gated on `flags.debug && !d.oclass`. */
        if (game.flags.debug && !game.program_state.wizkit_wishing && !d.oclass) {
            /* [inline code moved to separate routine to unclutter readobjnam] */
            if ((d.otmp = await wizterrainwish(d)) != null) {
                return d.otmp;
            }
        }
    }
    if (!__goto_typfnd) {
        /* any: block — handle unmatched/empty wishes, or polearm/
           hammer-by-skill.  C's `goto typfnd` from this block lets
           a successful polearm/hammer typ jump to object creation. */
        if (!d.oclass && !d.typ) {
            if (!strncmpi(d.bp, "polearm", 7)) {
                d.typ = rnd_otyp_by_wpnskill(P_POLEARMS);
                __goto_typfnd = true;
            } else if (!strncmpi(d.bp, "hammer", 6)) {
                d.typ = rnd_otyp_by_wpnskill(P_HAMMER);
                __goto_typfnd = true;
            }
        }
        if (!__goto_typfnd) {
            if (!d.oclass) {
                return (null);
            }
            if (!d.oclass) {
                d.oclass = wrpsym[rn2(13 /* sizeof(const char [13]) */)];
            }
        }
    }
    /* typfnd: object-creation block follows below (d.typ → mksobj). */
    if (d.typ) {
        d.oclass = game.objects[d.typ].oc_class;
    }
    if (d.typ && !game.flags.debug) {
        switch (d.typ) {
            /* handle some objects that are only allowed in wizard mode */
            case AMULET_OF_YENDOR:
                d.typ = FAKE_AMULET_OF_YENDOR;
                break;
            case CANDELABRUM_OF_INVOCATION:
                d.typ = rnd_class(TALLOW_CANDLE, WAX_CANDLE);
                break;
            case BELL_OF_OPENING:
                d.typ = BELL;
                break;
            case SPE_BOOK_OF_THE_DEAD:
                d.typ = SPE_BLANK_PAPER;
                break;
            case MAGIC_LAMP:
                d.typ = OIL_LAMP;
                break;
            default:
                if (game.objects[d.typ].oc_nowish) {
                    return null;
                }
                break;
        }
    }
    if (d.typ == CORPSE && d.mntmp >= LOW_PM && game.mons[d.mntmp].mlet == S_PUDDING) {
        /* if asking for corpse of a monster which leaves behind a glob, give
       glob instead of rejecting the monster type to create random corpse */
        d.typ = GLOB_OF_GRAY_OOZE + (d.mntmp - PM_GRAY_OOZE);
        d.mntmp = NON_PM;
    }
    /*
     * Create the object, then fine-tune it.
     */
    d.otmp = d.typ ? await mksobj(d.typ, (1), (0)) : await mkobj(d.oclass, (0));
    d.typ = d.otmp.otyp , d.oclass = d.otmp.oclass;
    if (d.otmp.globby) {
        /* if player specified a reasonable count, maybe honor it;
       quantity for gold is handled elsewhere and d.cnt is 0 for it here */
        /* for globs, calculate weight based on gsize, then multiply by cnt;
           asking for 2 globs or for 2 small globs produces 1 small glob
           weighing 40au instead of normal 20au; asking for 5 medium globs
           might produce 1 very large glob weighing 600au */
        d.otmp.quan = 1;
        d.otmp.owt = await weight(d.otmp);
        /* gsize 0: unspecified => small;
           1: small (1..5) => keep default owt for 1, yielding 20;
           2: medium (6..15) => use weight for 6, yielding 120;
           3: large (16..25) => 320; 4: very large (26+) => 520 */
        if (d.gsize > 1) {
            d.otmp.owt += ((5 + (d.gsize - 2) * 10) * d.otmp.owt);
        }
        if (d.cnt > 1) {
            /* limit overall weight which limits shrink-away time which in turn
           affects how long some of it will remain available to be eaten */
            let rn1cnt = (rn2(5) + (2));
            if (rn1cnt > 6 - d.gsize) {
                rn1cnt = 6 - d.gsize;
            }
            if (d.cnt > rn1cnt && (!game.flags.debug || game.program_state.wizkit_wishing || await yn_function("Override glob weight limit?", ynchars, 110, (1)) != 121)) {
                d.cnt = rn1cnt;
            }
            d.otmp.owt *= d.cnt;
        }
        /* note: the owt assignment below will not change glob's weight */
        d.cnt = 0;
    } else if (d.cnt > 0) {
        if (game.objects[d.typ].oc_merge && (game.flags.debug || d.cnt < rnd(6) || (d.cnt <= 7 && (d.otmp.otyp == TALLOW_CANDLE || d.otmp.otyp == WAX_CANDLE)) || (d.cnt <= 20 && (d.typ == ROCK || d.typ == FLINT || ((d.otmp.oclass == WEAPON_CLASS || d.otmp.oclass == TOOL_CLASS) && game.objects[d.otmp.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[d.otmp.otyp].oc_subtyp <= -P_DART) || (d.oclass == WEAPON_CLASS && ((d.otmp.oclass == WEAPON_CLASS || d.otmp.oclass == GEM_CLASS) && game.objects[d.otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[d.otmp.otyp].oc_subtyp <= -P_BOW)))))) {
            d.otmp.quan = d.cnt;
        }
    }
    if (d.islit && (d.typ == OIL_LAMP || d.typ == MAGIC_LAMP || d.typ == BRASS_LANTERN || (d.otmp.otyp == TALLOW_CANDLE || d.otmp.otyp == WAX_CANDLE) || d.typ == POT_OIL)) {
        /* quantity isn't restricted when debugging */
        /* note: in normal play, explicitly asking for 1 might
                   fail the 'cnt < rnd(6)' test and could produce more
                   than 1 if mksobj() creates the item that way */
        /* WEAPON_CLASS test excludes gems, gray stones */
        /* make it viable light source */
        await place_object(d.otmp, game.u.ux, game.u.uy);
        await begin_burn(d.otmp, (0));
        /* now release it for caller's use */
        await obj_extract_self(d.otmp);
    }
    if (d.spesgn == 0) {
        /* spe not specified; retain the randomly assigned value */
        d.spe = d.otmp.spe;
    } else if (game.flags.debug) {
        ;
    } else if (d.oclass == ARMOR_CLASS || d.oclass == WEAPON_CLASS || ((d.otmp).oclass == TOOL_CLASS && game.objects[(d.otmp).otyp].oc_subtyp != P_NONE) || (d.oclass == RING_CLASS && game.objects[d.typ].oc_charged)) {
        /* no restrictions except SPE_LIM */
        if (d.spe > rnd(5) && d.spe > d.otmp.spe) {
            d.spe = 0;
        }
        if (d.spe > 2 && (game.u.uluck + game.u.moreluck) < 0) {
            d.spesgn = -1;
        }
    } else {
        if (d.oclass == WAND_CLASS || d.typ == CRYSTAL_BALL) {
            /* crystal ball cancels like a wand, to (n:-1) */
            if (d.spe > 1 && d.spesgn == -1) {
                d.spe = 1;
            }
        } else {
            if (d.spe > 0 && d.spesgn == -1) {
                d.spe = 0;
            }
        }
        if (d.spe > d.otmp.spe) {
            d.spe = d.otmp.spe;
        }
    }
    if (d.spesgn == -1) {
        d.spe = -d.spe;
    }
    switch (d.typ) {
        /* set otmp->spe.  This may, or may not, use d.spe... */
        case TIN:
            d.otmp.spe = 0;
            if (d.contents == 1) {
                d.otmp.corpsenm = NON_PM;
            } else if (d.contents == 2) {
                d.otmp.corpsenm = NON_PM;
                d.otmp.spe = 1;
            }
            break;
        case TOWEL:
            if (d.wetness) {
                d.otmp.spe = d.wetness;
            }
            break;
        case SLIME_MOLD:
            d.otmp.spe = d.ftype;
            ;
        case SKELETON_KEY:
        case CHEST:
        case LARGE_BOX:
        case HEAVY_IRON_BALL:
        case IRON_CHAIN:
            break;
        case STATUE:
        case FIGURINE:
        case CORPSE:
{
                /* otmp->cobj already done in mksobj() */
                let P = (((d.mntmp) >= LOW_PM && (d.mntmp) < NUMMONS)) ? game.mons[d.mntmp] : null;
                d.otmp.spe = !P ? 0 : (((P).mflags2 & 262144) != 0) ? 3 : (d.mgend == FEMALE && !(((P).mflags2 & 65536) != 0)) ? 1 : (d.mgend == MALE && !(((P).mflags2 & 131072) != 0)) ? 2 : 0;
                /* if neuter, force neuter regardless of wish request */
                /* not neuter, honor wish unless it conflicts */
                /* unspecified or wish conflicts */
                if (P && d.otmp.spe == 0) {
                    d.otmp.spe = (((P).mflags2 & 65536) != 0) ? 2 : (((P).mflags2 & 131072) != 0) ? 1 : rn2(2) ? 2 : 1;
                }
                if (d.ishistoric && d.typ == STATUE) {
                    d.otmp.spe |= 4;
                }
                break;
            }
            ;
        /* scroll of mail:  0: delivered in-game via external event (or randomly
       for fake mail); 1: from bones or wishing; 2: written with marker */
        case SCR_MAIL:
            d.otmp.spe = 1;
            break;
        /* splash of venom:  0: normal, and transitory; 1: wishing */
        case ACID_VENOM:
        case BLINDING_VENOM:
            d.otmp.spe = 1;
            break;
        case WAN_WISHING:
            if (!game.flags.debug) {
                d.otmp.spe = (rn2(10) ? -1 : 0);
                break;
            }
            ;
        default:
            d.otmp.spe = d.spe;
    }
    if (((d.mntmp) >= LOW_PM && (d.mntmp) < NUMMONS)) {
        /* set otmp->corpsenm or dragon scale [mail] */
        let humanwere = 0;
        if (d.mntmp == PM_LONG_WORM_TAIL) {
            d.mntmp = PM_LONG_WORM;
        }
        /* werecreatures in beast form are all flagged no-corpse so for
           corpses and tins, switch to their corresponding human form;
           for figurines, override the can't-be-human restriction instead */
        if (d.typ != FIGURINE && (((game.mons[d.mntmp]).mflags2 & 4) != 0) && (game.mvitals[d.mntmp].mvflags & 16) != 0 && (humanwere = counter_were(d.mntmp)) != NON_PM) {
            d.mntmp = humanwere;
        }
        switch (d.typ) {
            case TIN:
                if (dead_species(d.mntmp, (0))) {
                    d.otmp.corpsenm = NON_PM;
                } else if ((!(game.mons[d.mntmp].geno & 4096) || game.flags.debug) && !(game.mvitals[d.mntmp].mvflags & 16) && game.mons[d.mntmp].cnutrit != 0) {
                    d.otmp.corpsenm = d.mntmp;
                }
                break;
            case CORPSE:
                if ((!(game.mons[d.mntmp].geno & 4096) || game.flags.debug) && !(game.mvitals[d.mntmp].mvflags & 16)) {
                    if (game.mons[d.mntmp].msound == MS_GUARDIAN) {
                        d.mntmp = genus(d.mntmp, 1);
                    }
                    /* this also sets hatch timer if appropriate */
                    await set_corpsenm(d.otmp, d.mntmp);
                }
                if (d.zombify && zombie_form(game.mons[d.mntmp])) {
                    await start_timer((rn2(5) + (10)), TIMER_OBJECT, ZOMBIFY_MON, obj_to_any(d.otmp));
                }
                break;
            case EGG:
                d.mntmp = can_be_hatched(d.mntmp);
                await set_corpsenm(d.otmp, d.mntmp);
                break;
            case FIGURINE:
                if (!(game.mons[d.mntmp].geno & 4096) && (!(((game.mons[d.mntmp]).mflags2 & 8) != 0) || (((game.mons[d.mntmp]).mflags2 & 4) != 0)) && d.mntmp != PM_MAIL_DAEMON) {
                    d.otmp.corpsenm = d.mntmp;
                }
                break;
            case STATUE:
                d.otmp.corpsenm = d.mntmp;
                if (((d.otmp).cobj != null) && ((game.mons[d.mntmp]).msize < 1)) {
                    /* this assumes that artifacts can't be randomly generated
               inside containers */
                    await delete_contents(d.otmp);
                }
                break;
            case SCALE_MAIL:
                if (d.mntmp >= PM_GRAY_DRAGON && d.mntmp <= PM_YELLOW_DRAGON) {
                    d.otmp.otyp = GRAY_DRAGON_SCALE_MAIL + d.mntmp - PM_GRAY_DRAGON;
                }
                break;
        }
    }
    if (d.iscursed) {
        /* set blessed/cursed -- setting the fields directly is safe
     * since weight() is called below and addinv() will take care
     * of luck */
        await curse(d.otmp);
    } else if (d.uncursed) {
        d.otmp.blessed = 0;
        d.otmp.cursed = ((game.u.uluck + game.u.moreluck) < 0 && !game.flags.debug);
    } else if (d.blessed) {
        d.otmp.blessed = ((game.u.uluck + game.u.moreluck) >= 0 || game.flags.debug);
        d.otmp.cursed = ((game.u.uluck + game.u.moreluck) < 0 && !game.flags.debug);
    } else if (d.spesgn < 0) {
        await curse(d.otmp);
    }
    if (erosion_matters(d.otmp)) {
        /* set eroded and erodeproof */
        /* wished-for item shouldn't be eroded unless specified */
        d.otmp.oeroded = d.otmp.oeroded2 = 0;
        if (d.eroded && (is_flammable(d.otmp) || (game.objects[d.otmp.otyp].oc_material == IRON) || (game.objects[(d.otmp).otyp].oc_material == GLASS && (d.otmp).oclass == ARMOR_CLASS))) {
            d.otmp.oeroded = d.eroded;
        }
        if (d.eroded2 && ((game.objects[d.otmp.otyp].oc_material == COPPER || game.objects[d.otmp.otyp].oc_material == IRON) || is_rottable(d.otmp))) {
            d.otmp.oeroded2 = d.eroded2;
        }
        /*
         * 3.6.1: earlier versions included `&& !eroded && !eroded2' here,
         * but damageproof combined with damaged is feasible (eroded
         * armor modified by confused reading of cursed destroy armor)
         * so don't prevent player from wishing for such a combination.
         */
        if (d.erodeproof && (((game.objects[d.otmp.otyp].oc_material == IRON) || is_flammable(d.otmp) || is_rottable(d.otmp) || (game.objects[d.otmp.otyp].oc_material == COPPER || game.objects[d.otmp.otyp].oc_material == IRON) || (game.objects[(d.otmp).otyp].oc_material == GLASS && (d.otmp).oclass == ARMOR_CLASS)) || d.otmp.otyp == CRYSKNIFE)) {
            d.otmp.oerodeproof = ((game.u.uluck + game.u.moreluck) >= 0 || game.flags.debug);
        }
    }
    if (d.oclass == WAND_CLASS) {
        if (d.otmp.otyp == WAN_WISHING && !game.flags.debug) {
            d.rechrg = 1;
        }
        d.otmp.recharged = d.rechrg;
    }
    if (d.ispoisoned) {
        if (((d.otmp.oclass == WEAPON_CLASS && game.objects[d.otmp.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[d.otmp.otyp].oc_subtyp <= -P_BOW) || permapoisoned(d.otmp))) {
            d.otmp.otrapped = ((game.u.uluck + game.u.moreluck) >= 0);
        } else if (d.oclass == FOOD_CLASS) {
            d.otmp.age = 1;
        }
    }
    if (d.trapped) {
        /* try to taint by making it as old as possible */
        if (((d.otmp).otyp == LARGE_BOX || (d.otmp).otyp == CHEST) || d.typ == TIN) {
            d.otmp.otrapped = (d.trapped == 1);
        }
    }
    if (d.contents == 1) {
        if (d.otmp.otyp == BAG_OF_TRICKS || d.otmp.otyp == HORN_OF_PLENTY) {
            /* empty for containers rather than for tins */
            if (d.otmp.spe > 0) {
                d.otmp.spe = 0;
            }
        } else if (((d.otmp).cobj != null)) {
            await delete_contents(d.otmp);
            d.otmp.owt = await weight(d.otmp);
        }
    }
    if (((d.otmp).otyp == LARGE_BOX || (d.otmp).otyp == CHEST)) {
        if (d.locked) {
            /* set locked/unlocked/broken */
            d.otmp.olocked = 1 , d.otmp.obroken = 0;
        } else if (d.unlocked) {
            d.otmp.olocked = 0 , d.otmp.obroken = 0;
        } else if (d.broken) {
            d.otmp.olocked = 0 , d.otmp.obroken = 1;
        }
        if (d.otmp.obroken) {
            d.otmp.otrapped = 0;
        }
    }
    if (d.isgreased) {
        d.otmp.greased = 1;
    }
    if (d.isdiluted && d.otmp.oclass == POTION_CLASS) {
        d.otmp.oeroded = (d.otmp.otyp != POT_WATER);
    }
    if (d.otmp.otyp == TIN && d.tvariety >= 0 && (rn2(4) || game.flags.debug)) {
        set_tin_variety(d.otmp, d.tvariety);
    }
    if (d.name) {
        let aname = null;
        let novelname = null;
        let objtyp = 0;
        /* an artifact name might need capitalization fixing */
        aname = artifact_name(d.name, { get value() { return objtyp; }, set value(_v) { objtyp = _v; } }, (1));
        if (aname && objtyp == d.otmp.otyp) {
            d.name = aname;
        }
        /* 3.6 tribute - fix up novel */
        if (d.otmp.otyp == SPE_NOVEL && (novelname = await lookup_novel(d.name, { get value() { return d.otmp.corpsenm; }, set value(_v) { d.otmp.corpsenm = _v; } })) != null) {
            d.name = novelname;
        }
        d.otmp = await oname(d.otmp, d.name, 4);
        if (d.otmp.oartifact || d.name == aname) {
            /* name==aname => wished for artifact (otmp->oartifact => got it) */
            d.otmp.quan = 1;
            game.u.uconduct.wisharti++;
        }
    }
    if (permapoisoned(d.otmp)) {
        d.otmp.otrapped = 1;
    }
    if ((is_quest_artifact(d.otmp) || (d.otmp.oartifact && rn2(nartifact_exist()) > 1)) && !game.flags.debug) {
        /* more wishing abuse: don't allow wishing for certain artifacts */
        /* and make them pay; charge them for the wish anyway! */
        await artifact_exists(d.otmp, safe_oname(d.otmp), (0), 0);
        await obfree(d.otmp, null);
        d.otmp = game.hands_obj;
        await pline("For a moment, you feel %s in your %s, but it disappears!", c_common_strings.c_something, await makeplural(await body_part(HAND)));
        return d.otmp;
    }
    if (d.halfeaten && d.otmp.oclass == FOOD_CLASS) {
        let nut = obj_nutrition(d.otmp);
        if (nut > 1) {
            /* do this adjustment before setting up object's weight; skip
           "partly eaten" for food with 0 nutrition (wraith corpse) or for
           anything that couldn't take more than one bite (1 nutrition;
           ought to check for one-bite instead but that's complicated) */
            d.otmp.oeaten = nut;
            await consume_oeaten(d.otmp, 1);
        }
    }
    d.otmp.owt = await weight(d.otmp);
    if (d.very && d.otmp.otyp == HEAVY_IRON_BALL) {
        d.otmp.owt += WT_IRON_BALL_INCR;
    }
    return d.otmp;
}
export function rnd_class(first, last) {
    let i = 0;
    let x = 0;
    let sum = 0;
    if (last > first) {
        for (i = first; i <= last; i++) {
            sum += game.objects[i].oc_prob;
        }
        /* all zero, so equal probability */
        if (!sum) {
            return (rn2(last - first + 1) + (first));
        }
        x = rnd(sum);
        for (i = first; i <= last; i++) {
            if ((x -= game.objects[i].oc_prob) <= 0) {
                return i;
            }
        }
    }
    return (first == last) ? first : STRANGE_OBJECT;
}
export function Japanese_item_name(i, ordinaryname) {
    let j = Japanese_items;
    const __nhi_j_arr = j;
    for (let __nhi_j = 0; (j = __nhi_j_arr[__nhi_j]) && (j.item); __nhi_j++) {
        if (i == j.item) {
            return j.name;
        }
    }
    return ordinaryname;
}
export async function armor_simple_name(armor) {
    let result = null;
    let armcat = game.objects[armor.otyp].oc_subtyp;
    switch (armcat) {
        case ARM_SUIT:
            result = suit_simple_name(armor);
            break;
        case ARM_CLOAK:
            result = cloak_simple_name(armor);
            break;
        case ARM_HELM:
            result = helm_simple_name(armor);
            break;
        case ARM_GLOVES:
            result = gloves_simple_name(armor);
            break;
        case ARM_BOOTS:
            result = boots_simple_name(armor);
            break;
        case ARM_SHIELD:
            result = shield_simple_name(armor);
            break;
        case ARM_SHIRT:
            result = shirt_simple_name(armor);
            break;
        default:
            result = await simpleonames(armor);
            await impossible("unknown armor category (%s => %u)", result, armcat);
            break;
    }
    return result;
}
export function suit_simple_name(suit) {
    let suitnm = null;
    let esuitp = null;
    if (suit) {
        if (((suit).otyp >= GRAY_DRAGON_SCALE_MAIL && (suit).otyp <= YELLOW_DRAGON_SCALE_MAIL)) {
            return "dragon mail";
        } else if (((suit).otyp >= GRAY_DRAGON_SCALES && (suit).otyp <= YELLOW_DRAGON_SCALES)) {
            return "dragon scales";
        }
        suitnm = (game.obj_descr[(game.objects[suit.otyp]).oc_name_idx].oc_name);
        esuitp = eos(suitnm);
        if (strlen(suitnm) > 5 && !strcmp(esuitp - 5, " mail")) {
            return "mail";
        } else if (strlen(suitnm) > 7 && !strcmp(esuitp - 7, " jacket")) {
            return "jacket";
        }
    }
    /* "suit" is lame but "armor" is ambiguous and "body armor" is absurd */
    return "suit";
}
export function cloak_simple_name(cloak) {
    if (cloak) {
        switch (cloak.otyp) {
            case ROBE:
                return "robe";
            case MUMMY_WRAPPING:
                return "wrapping";
            case ALCHEMY_SMOCK:
                return (game.objects[cloak.otyp].oc_name_known && cloak.dknown) ? "smock" : "apron";
            default:
                break;
        }
    }
    return "cloak";
}
/* helm vs hat for messages */
export function helm_simple_name(helmet) {
    /*
     *  There is some wiggle room here; the result has been chosen
     *  for consistency with the "protected by hard helmet" messages
     *  given for various bonks on the head:  headgear that provides
     *  such protection is a "helm", that which doesn't is a "hat".
     *
     *      elven leather helm / leather hat    -> hat
     *      dwarvish iron helm / hard hat       -> helm
     *  The rest are completely straightforward:
     *      fedora, cornuthaum, dunce cap       -> hat
     *      all other types of helmets          -> helm
     */
    return !hard_helmet(helmet) ? "hat" : "helm";
}
/* gloves vs gauntlets; depends upon discovery state */
const __gloves_simple_name_gauntlets = "gauntlets";
export function gloves_simple_name(gloves) {
    if (gloves && gloves.dknown) {
        let otyp = gloves.otyp;
        let ocl = game.objects[otyp];
        let actualn = (game.obj_descr[(ocl).oc_name_idx].oc_name);
        let descrpn = (game.obj_descr[(ocl).oc_descr_idx].oc_descr);
        if (strstri(game.objects[otyp].oc_name_known ? actualn : descrpn, __gloves_simple_name_gauntlets)) {
            return __gloves_simple_name_gauntlets;
        }
    }
    return "gloves";
}
/* boots vs shoes; depends upon discovery state */
const __boots_simple_name_shoes = "shoes";
export function boots_simple_name(boots) {
    if (boots && boots.dknown) {
        let otyp = boots.otyp;
        let ocl = game.objects[otyp];
        let actualn = (game.obj_descr[(ocl).oc_name_idx].oc_name);
        let descrpn = (game.obj_descr[(ocl).oc_descr_idx].oc_descr);
        if (strstri(descrpn, __boots_simple_name_shoes) || (game.objects[otyp].oc_name_known && strstri(actualn, __boots_simple_name_shoes))) {
            return __boots_simple_name_shoes;
        }
    }
    return "boots";
}
/* simplified shield for messages */
export function shield_simple_name(shield) {
    if (shield) {
        /* xname() describes unknown (unseen) reflection as smooth */
        /*
         * We might distinguish between wooden vs metallic or
         * light vs heavy to give small benefit to spell casters.
         * Fighter types probably care more about the former for
         * vulnerability to fire or rust.
         *
         * We could do that both ways: light wooden shield, light
         * metallic shield (there aren't any), heavy wooden shield,
         * and heavy metallic shield but that's getting away from
         * "simple name" which is intended to be shorter as well
         * as less detailed than xname().
         */
        /* spellcasting uses a division like this */
        if (shield.otyp == SHIELD_OF_REFLECTION) {
            return shield.dknown ? "silver shield" : "smooth shield";
        }
    }
    return "shield";
}
/* for completeness */
export function shirt_simple_name(shirt) {
    return "shirt";
}
export async function mimic_obj_name(mtmp) {
    if (((mtmp).m_ap_type & 7) == M_AP_OBJECT) {
        if (mtmp.mappearance == GOLD_PIECE) {
            return "gold";
        }
        if (mtmp.mappearance != STRANGE_OBJECT) {
            return await simple_typename(mtmp.mappearance);
        }
    }
    return "whatcha-may-callit";
}
/*
 * Construct a query prompt string, based around an object name, which is
 * guaranteed to fit within [QBUFSZ].  Takes an optional prefix, three
 * choices for filling in the middle (two object formatting functions and a
 * last resort literal which should be very short), and an optional suffix.
 */
/* output buffer */
export async function safe_qbuf(qbuf, qprefix, qsuffix, obj, func, altfunc, lastR) {
    let bufp = null;
    let endp = null;
    /* convert size_t (or int for ancient systems) to ordinary unsigned */
    let len = 0;
    let lenlimit = 0;
    let len_qpfx = (qprefix ? strlen(qprefix) : 0);
    let len_qsfx = (qsuffix ? strlen(qsuffix) : 0);
    let len_lastR = strlen(lastR);
    lenlimit = 128 - 1;
    endp = __nh_advance_str(qbuf, lenlimit);
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    if (len_qpfx > lenlimit) {
        await impossible("safe_qbuf: prefix too long (%u characters).", len_qpfx);
    } else if (len_qpfx + len_qsfx > lenlimit) {
        await impossible("safe_qbuf: suffix too long (%u + %u characters).", len_qpfx, len_qsfx);
    } else if (len_qpfx + len_lastR + len_qsfx > lenlimit) {
        await impossible("safe_qbuf: filler too long (%u + %u + %u characters).", len_qpfx, len_lastR, len_qsfx);
    }
    if (qbuf == qprefix) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    } else if (qprefix) {
        /* put prefix into the buffer */
        qbuf = strncpy(qbuf, qprefix, lenlimit);
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    } else {
        /* no prefix; output buffer starts out empty */
        qbuf = __nh_char_write(qbuf, 0, 0);
    }
    len = strlen(qbuf);
    if (len + len_lastR + len_qsfx > lenlimit) {
        if (len < lenlimit) {
            /* too long; skip formatting, last resort output is truncated */
            strncpy({ get value() { return __nh_char_at0(__nh_advance_str(qbuf, len)); }, set value(_v) { __nh_char_at0(__nh_advance_str(qbuf, len)) = _v; } }, lastR, lenlimit - len);
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            len = strlen(qbuf);
            if (qsuffix && len < lenlimit) {
                strncpy({ get value() { return __nh_char_at0(__nh_advance_str(qbuf, len)); }, set value(_v) { __nh_char_at0(__nh_advance_str(qbuf, len)) = _v; } }, qsuffix, lenlimit - len);
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            }
        }
    } else {
        /* suffix and last resort are guaranteed to fit */
        /* include the pending suffix */
        len += len_qsfx;
        bufp = short_oname(obj, func, altfunc, lenlimit - len);
        if (len + strlen(bufp) <= lenlimit) {
            qbuf = strcat(qbuf, bufp);
        } else {
            qbuf = strcat(qbuf, lastR);
        }
        releaseobuf(bufp);
        if (qsuffix) {
            qbuf = strcat(qbuf, qsuffix);
        }
    }
    /* assert( strlen(qbuf) < QBUFSZ ); */
    return qbuf;
}
/*objnam.c*/
/* 3: length of " (" + ")" which will enclose 'dn' */
/* avoid spellbook of Book of the Dead */
/* this maybe-nearby part used to be replicated in multiple callers */
/* side-effects:  treat as having been seen up close;
           cansee() is True hence hero isn't Blind so if 'func' is
           the usual doname or xname, obj->dknown will become set
           and then for an artifact, find_artifact() will be called */
/* if we still don't have a match, try singularizing the target;
       for exact match, that's trivial, but for prefix, it's hard */
/* length of assumed plural fname */
/* actually revised 'fname_k' */
/* set up primary work buffer; the first 'PREFIX' bytes are set
       aside for use by doname() */
/* last byte within the obuf[] */
/*
     * Maybe find a previously unseen artifact.
     *
     * Assumption 1: if an artifact object is being formatted, it is
     *  being shown to the hero (on floor, or looking into container,
     *  or probing a monster, or seeing a monster wield it).
     * Assumption 2: if in a pile that has been stepped on, the
     *  artifact won't be noticed for cases where the pile to too deep
     *  to be auto-shown, unless the player explicitly looks at that
     *  spot (via ':').  Might need to make an exception somehow (at
     *  the point where the decision whether to auto-show gets made?)
     *  when an artifact is on the top of the pile.
     * Assumption 3: since this is used for livelog events, not being
     *  100% correct won't negatively affect the player's current game.
     *
     * We use the real obj->dknown rather than the override_ID variant
     * so that wizard-mode ^I doesn't cause a not-yet-seen artifact in
     * inventory (picked up while blind, still blind) to become found.
     */
/* each must be identified individually */
/* if the name should be plural, do that now, after overflow check;
       it could make buf[] become shorter */
/* default is "on" for types which don't use it */
/* "the Nth arrow"; value will eventually be passed to an() or
           The(), both of which correctly handle this "the " prefix */
/* 'bp' will be within an obuf[] rather than at the start of one,
       usually (but not always) pointing at &obuf[PREFIX];
       gx.xnamep always points to the start of that buffer;
       'bp_eos' and 'bpspaceleft' are used and updated by Concat*() macros */
/* ok provided xname() bounds checking works */
/* size_t cast: convert signed ptrdiff_t to unsigned size_t */
/* 3.6.0 used "unlockable" here but that could be misunderstood
               to mean "capable of being unlocked" rather than the intended
               "not capable of being locked" */
/* we count the number of separate stacks, which corresponds
           to the number of inventory slots needed to be able to take
           everything out if no merges occur */
/* use alternate phrasing for non-weapons and for wielded ammo
           (arrows, bolts), or missiles (darts, shuriken, boomerangs)
           except when those are being actively dual-wielded where the
           regular phrasing will list them as "in right hand" to
           contrast with secondary weapon's "in left hand" */
/* not ammo: "at the ready" */
/* save current prefix, without "a "; might be empty */
/* set prefix[] to "", "a ", or "an " */
/* ideally this will never happen; if xnamep is any obuf[]
           other than the last, overflow here would be relatively
           benign and we could probably keep going */
/* Used by farlook.
     * If it hasn't been seen up close and quantity is more than one,
     * use "some" instead of the quantity: "some gold pieces" rather
     * than "25 gold pieces".  This is suboptimal, to put it mildly,
     * because lookhere and pickup report the precise amount.
     * Picking the item up while blind also shows the precise amount
     * for inventory display, then dropping it while still blind leaves
     * obj->dknown unset so the count reverts to "some" for farlook.
     *
     * TODO: add obj->qknown flag for 'quantity known' on stackable
     * items; it could overlay obj->cknown since no containers stack.
     */
/* cursed partly eaten troll corpse */
/* bypass object twiddling for artifacts */
/* single letter; might be used for named fruit or a musical note */
/* these probably shouldn't be handled here because doing so
                  impacts inventory when using them for named fruit */
/* leave off "your" for most of your artifacts, but prepend
     * "your" for unique objects and "foo of bar" quest artifacts */
/* the() will allocate another obuf[]; we want to avoid using two */
/* simpleoname[] is singular if quan==1, plural otherwise;
           an() will allocate another obuf[]; we want to avoid using two */
/* dispense with some words which don't need singularization */
/* and the inverse, "<foo> detection" vs "detect <foo>" */
/* convert "detect <foo>s" into "<foo> detection" */
/* Must manually make kelp! */
/* [FIXME: if this isn't a wall or door location where 'horizontal'
            is already set up, that should be calculated for this spot.
            Unfortunately, it can be tricky; placing one in open space
            and then another adjacent might need to recalculate first one.] */
/* neither CORR nor SCORR uses 'flags' or 'horizontal' */
/* map the spot where the wish occurred */
/* hero started at <x,y> but might not be there anymore (create
           lava, decline to die, and get teleported away to safety) */
/* u.uinwater = 0; leave the water */
/* [block/unblock_point handled by docrt -> vision_recalc] */
/* note: lev->lit and lev->nondiggable retain their values even
           though those might not make sense with the new terrain */
/* might have changed terrain from something that blocked
           levitation and flying to something that doesn't (levitating
           while in xorn form and replacing solid stone with furniture) */
/* D_CLOSED is implicit for secret doors */
/* also clears blessedftn, disturbed */
/* box/chest and wizard mode door */
/* wizard mode fountain/sink/throne/tree and grave */
/* check for "glob", "<foo> glob", and "glob of <foo>" */
/* Search for class names: XXXXX potion, scroll of XXXXX.
       Avoid false hits on, e.g., rings for "ring mail". */
/* catch any other non-wishable objects (venom) */
/* Dragon mail - depends on the order of objects & dragons. */
/* <color> dragon scale mail */
/* most suits fall into this category */
/* workaround for static analyzer issue */
/* sanity check, aimed mainly at paniclog (it's conceivable for
       the result of short_oname() to be shorter than the length of
       the last resort string, but we ignore that possibility here) */
/*
     * verb is given in plural (without trailing s).  Return as input
     * if subj appears to be plural.  Add special cases as necessary.
     * Many hard cases can already be handled by using otense() instead.
     * If this gets much bigger, consider decomposing makeplural.
     * Note: monster names are not expected here (except before corpse).
     *
     * Special case: allow null sobj to get the singular 3rd person
     * present tense form so we don't duplicate this code elsewhere.
     */
/*
         * plural: anything that ends in 's', but not '*us' or '*ss'.
         * Guess at a few other special cases that makeplural creates.
         */
/* check for special cases to avoid false matches */
/* also check for <prefix><space><special_subj>
                   to catch things like "the invisible erinys" */
/*
         * 3rd person plural doesn't end in telltale 's';
         * 2nd person singular behaves as if plural.
         */
/* Ends in z, x, s, ch, sh; add an "es" */
/* like "y" case in makeplural */
/* makeplural() is sometimes used on monsters rather than objects
       and sometimes pronouns are used for monsters, so check those;
       unfortunately, "her" (which matches genders[1].him and [1].his)
       and "it" (which matches genders[2].he and [2].him) are ambiguous;
       we'll live with that; caller can fix things up if necessary */
/*
     * Skip changing "pair of" to "pairs of".  According to Webster, usual
     * English usage is use pairs for humans, e.g. 3 pairs of dancers,
     * and pair for objects and non-humans, e.g. 3 pair of boots.  We don't
     * refer to pairs of humans in this game so just skip to the bottom.
     */
/* look for "foo of bar" so that we can focus on "foo" */
/* Now spot is the last character of the string */
/* dispense with some words which don't need pluralization */
/* spot+1: synch up with makesingular's usage */
/* more of same, but not suitable for blanket loop checking */
/* man/men ("Wiped out all cavemen.") */
/* exclude shamans and humans etc */
/* (staff handled via one_off[]) */
/* avoid "nerf" -> "nerves", "serf" -> "serves" */
/* fall through to default (append 's') */
/* [aeioulr]f to [aeioulr]ves */
/* ium/ia (mycelia, baluchitheria) */
/* algae, larvae, hyphae (another fungus part) */
/* fungus/fungi, homunculus/homunculi, but buses, lotuses, wumpuses */
/* -eau/-eaux (gateau, chapeau...) */
/* 'bureaus' is the more common plural of 'bureau' */
/* matzoh/matzot, possible food name */
/* note: ox/oxen, VAX/VAXen, goose/geese */
/* codex/spadix/neocortex and the like */
/* indices would have been ok too, but stick with indexes */
/* Kludge to get "tomatoes" and "potatoes" right */
