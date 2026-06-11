/* NetHack 5.0	invent.c	$NHDT-Date: 1762680996 2025/11/09 01:36:36 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.543 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Derek S. Ray, 2015. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { qsort } from '../c2js-runtime/qsort.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, nh_strchr_truncate, strcat, strchr, strcmp, strcpy, strlen, strncmp, strncmpi, strstr, strstri } from '../c2js-runtime/string.js';
import { confers_luck, discover_artifact, is_art, set_artifact_intrinsic, touch_artifact, undiscovered_artifact } from './artifact.js';
import { acurr, set_moreluck } from './attrib.js';
import { get_strength_str } from './botl.js';
import { cmdq_add_int, cmdq_add_key, cmdq_clear, cmdq_pop, get_count, readchar, yn_function } from './cmd.js';
import { db_under_typ, is_drawbridge_wall, is_ice, is_lava, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_common_strings, cg, quitchars, ynNaqchars, ynaqchars, ynchars } from './decl.js';
import { docrt, map_glyphinfo, newsym, nul_glyphinfo, suppress_map_output } from './display.js';
import { dropx, dropy } from './do.js';
import { hliquid, mon_nam, noit_Monnam, oname, safe_oname } from './do_name.js';
import { fingers_or_gloves } from './do_wear.js';
import { hitfloor, throwing_weapon } from './dothrow.js';
import { def_char_to_objclass, def_oc_syms, defsyms } from './drawing.js';
import { on_level, surface } from './dungeon.js';
import { can_reach_floor, read_engr_at } from './engrave.js';
import { in_rooms, inv_cnt, money_cnt, near_capacity, obj_to_any } from './hack.js';
import { digit, eos, ing_suffix, letter, mungspaces, s_suffix, strkitten, strsubst, visctrl } from './hacklib.js';
import { itemactions } from './iactions.js';
import { align_str, record_achievement } from './insight.js';
import { obj_merge_light_sources } from './light.js';
import { clear_splitobjs, curse, extract_nobj, obj_absorb, obj_extract_self, place_object, pudding_merge_message, splitobj, unknwn_contnr_contents, unsplitobj, weight } from './mkobj.js';
import { dead_species, hideunder, maybe_unhide_at } from './mon.js';
import { poly_when_stoned } from './mondata.js';
import { ACH_AMUL, ACH_BELL, ACH_BOOK, ACH_CNDL, ACH_MINE_PRIZE, ACH_SOKO_PRIZE, AKLYS, ALTAR, AMULET_CLASS, AMULET_OF_YENDOR, ARMOR_CLASS, ARM_BOOTS, ARM_CLOAK, ARM_GLOVES, ARM_HELM, ARM_SHIELD, ARM_SHIRT, ARM_SUIT, ART_EYES_OF_THE_OVERWORLD, ART_MJOLLNIR, ART_SNICKERSNEE, A_CHA, A_CON, A_DEX, A_INT, A_WIS, BAG_OF_TRICKS, BELL_OF_OPENING, BLINDED, BOULDER, BUGLE, CANDELABRUM_OF_INVOCATION, CMDQ_INT, CMDQ_KEY, CMDQ_USER_INPUT, COIN_CLASS, CORPSE, COST_NOCONTENTS, CQ_CANNED, CQ_REPEAT, CRYSKNIFE, DBWALL, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, DRUM_OF_EARTHQUAKE, EGG, FAKE_AMULET_OF_YENDOR, FIGURINE, FIG_TRANSFORM, FINGERTIP, FIRE_HORN, FIRST_OBJECT, FIRST_REAL_GEM, FIRST_SPELL, FOOD_CLASS, FOUNTAIN, FROST_HORN, FUMBLING, GEMSTONE, GEM_CLASS, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_EXCLUDE_INACCESS, GETOBJ_EXCLUDE_NONINVENT, GETOBJ_EXCLUDE_SELECTABLE, GETOBJ_SUGGEST, GLASS, GLOB_OF_BLACK_PUDDING, GLOB_OF_BROWN_PUDDING, GLOB_OF_GRAY_OOZE, GLOB_OF_GREEN_SLIME, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GOLD_PIECE, GOLD_SYM, GRAVE, HALLUC, HALLUC_RES, HAND, HORN_OF_PLENTY, ICE, ILLOBJ_CLASS, IRONBARS, InvInUse, InvOptNone, InvOptOn, InvShowGold, LARGE_BOX, LAST_GLASS_GEM, LAST_SPELL, LEASH, LEATHER_DRUM, LENSES, LOADSTONE, LOW_PM, MAGIC_FLUTE, MAGIC_HARP, MAXOCLASSES, NON_PM, NUMMONS, NUM_OBJECTS, PIT, PLNMSG_ONE_ITEM_HERE, PM_ARCHEOLOGIST, PM_CHICKATRICE, PM_CLERIC, PM_COCKATRICE, PM_DEATH, PM_FAMINE, PM_PESTILENCE, POTION_CLASS, POT_OIL, POT_WATER, P_BOOMERANG, P_BOW, P_CROSSBOW, P_DAGGER, P_DART, P_KNIFE, P_LANCE, P_POLEARMS, P_SPEAR, RING_CLASS, ROCK, SCROLL_CLASS, SCR_BLANK_PAPER, SCR_MAIL, SCR_SCARE_MONSTER, SINK, SLIME_MOLD, SPE_BOOK_OF_THE_DEAD, SPE_NOVEL, SPIKED_PIT, STATUE, STOMACH, STONE_RES, S_TROLL, S_fountain, S_grave, S_lava, S_ndoor, S_sink, S_throne, S_tree, S_vcdbridge, S_vcdoor, S_vodbridge, S_vodoor, TALLOW_CANDLE, THRONE, TIN, TOOLED_HORN, TOOL_CLASS, TOWEL, TREE, VENOM_CLASS, WAX_CANDLE, WEAPON_CLASS, WOODEN_FLUTE, WOODEN_HARP, invlet_basic, prohibited, request_settings, set_gameview, set_mode, st_all, toggling_not, toggling_off, toggling_on, too_early, too_small, wp_tty } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { an, ansimpleoname, corpse_xname, cxname_singular, distant_name, doname, doname_with_price, erosion_matters, killer_xname, makeplural, maybereleaseobuf, not_fully_identified, safe_qbuf, simpleonames, vtense, xname, yname } from './objnam.js';
import { hide_unhide_msgtypes, set_option_mod_status } from './options.js';
import { ice_descr } from './pager.js';
import { add_valid_menu_class, allow_all, allow_category, collect_obj_classes, container_gone, count_justpicked, encumber_msg, force_decor, menu_class_present, query_category, query_objlist, reset_justpicked, u_safe_from_fatal_corpse } from './pickup.js';
import { There, livelog_printf } from './pline.js';
import { body_part, mbodypart } from './polyself.js';
import { a_gname } from './pray.js';
import { artitouch } from './quest.js';
import { is_quest_artifact } from './questpgr.js';
import { unpunish } from './read.js';
import { reg_damg, visible_region_at } from './region.js';
import { rn2, rn2_on_display_rng } from './rnd.js';
import { addtobill, check_unpaid, costly_spot, doinvbill, inhishop, inside_shop, obfree, picked_container, same_price, shop_keeper, shopper_financial_report, stolen_value, unpaid_cost } from './shk.js';
import { stairs_description, stairway_at } from './stairs.js';
import { Strlen_ } from './strutil.js';
import { attach_fig_transform_timeout, learn_egg_type, obj_stop_timers, stop_timer } from './timeout.js';
import { instapetrify, t_at, trapname } from './trap.js';
import { hidden_gold } from './vault.js';
import { empty_handed, setuqwep, welded } from './wield.js';
import { add_menu, add_menu_heading, add_menu_str, getlin, select_menu } from './windows.js';
import { bypass_objlist, clear_bypasses, nxt_unbypassed_loot, setnotworn, setworn } from './worn.js';
import { get_obj_location, obj_resists } from './zap.js';

/* enum and structs are defined in wintype.h */
game.wri_info = { tocore: { tocore_flags: 0, active: 0, use_update_inventory: 0, maxslot: 0, needrows: 0, needcols: 0, haverows: 0, havecols: 0 }, fromcore: { core_request: 0, invmode: 0, menu_promptstyle: { color: 0, attr: 0 } } };
game.perminv_flags = InvOptNone;
game.in_perm_invent_toggled = 0;
/* wizards can wish for venom, which will become an invisible inventory
 * item without this.  putting it in inv_order would mean venom would
 * suddenly become a choice for all the inventory-class commands, which
 * would probably cause mass confusion.  the test for inventory venom
 * is only WIZARD and not wizard because the wizard can leave venom lying
 * around on a bones level for normal players to find.  [Note to the
 * confused:  'WIZARD' used to be a compile-time conditional so this was
 * guarded by #ifdef WIZARD/.../#endif.]
 */
const venom_inv = [VENOM_CLASS, 0];
/* (constant) */
/* menu heading lines used instead of object classes when sorting by in-use;
   pointers aren't const because dispinv_with_action() might temporarily
   change "Accessories" to "Rings" or "Amulet", then back again */
const inuse_headers = ["", "Miscellaneous", "Worn Armor", "Wielded/Readied Weapons", "Accessories"];
/* [4] shown first, [1] last */
/* sortloot() classification for in-use sort;
   called at most once [per sort] for each object */
export function inuse_classify(sort_item, obj) {
    let w_mask = 0;
    let rating = 0;
    let altclass = 0;
    assign_rating: {
        w_mask = (obj.owornmask & (((131072 | 262144) | 65536 | 524288) | (256 | 1024 | 512) | (1 | 2 | 4 | 8 | 16 | 32 | 64)));
        /* if we get here, the USE_RATING() checks failed to find a match */
        rating = 0;
        altclass = 0;
        /* 'rating' advances for each USE_RATING() call */
        /*
     * In order of importance, least to most, somewhat arbitrarily.
     *
     * For instance, all accessories are grouped together even
     * though they're usually less important than other stuff, so
     * that they appear earlier within displayed list of used items.
     * Amulet is rated as most important primarily because the
     * default 'packorder' puts amulets first (possibly because one
     * might be The Amulet).  Non-wielded alternate weapon and
     * quiver are grouped with primary weapon.  Weapons are rated
     * above armor because of default 'packorder'.
     *
     * These ratings don't match either subclasses or 'packorder'.
     *
     * USE_RATING() sets up 'rating' then jumps to 'assign_rating'
     * if 'obj' warrants that.
     */
        /* lamp and leash might be used doubly, as a tool and also wielded
       or readied-in-quiver; these tests for used-as-tool only pass
       when owornmask is 0 so that used-as-weapon takes precedence */
        /* could get more complicated:  if uswapwep is just alternate weapon
       rather than wielded secondary, swap order with quiver (unless
       quiver is ammo for uswapwep without also being ammo for uwep) */
        ++altclass;
        do {
            ++rating;
            if ((!w_mask && obj.otyp == LEASH && obj.corpsenm) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((!w_mask && obj.oclass == TOOL_CLASS && obj.lamplit) != 0) {
                break assign_rating;
            }
        } while (0);
        ++altclass;
        do {
            ++rating;
            if ((w_mask & 64) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 32) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 16) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 4) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 8) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 2) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 1) != 0) {
                break assign_rating;
            }
        } while (0);
        ++altclass;
        do {
            ++rating;
            if ((w_mask & 512) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 1024) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 256) != 0) {
                break assign_rating;
            }
        } while (0);
        ++altclass;
        do {
            ++rating;
            if ((w_mask & 524288) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & ((game.u.uhandedness == 1) ? 262144 : 131072)) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & ((game.u.uhandedness == 0) ? 262144 : 131072)) != 0) {
                break assign_rating;
            }
        } while (0);
        do {
            ++rating;
            if ((w_mask & 65536) != 0) {
                break assign_rating;
            }
        } while (0);
        rating = 0;
        /* 'orderclass' must end up non-zero */
        altclass = -1;
    }
    sort_item.inuse = rating;
    /* used for alternate headings */
    sort_item.orderclass = altclass;
    /* not applicable for in-use */
    sort_item.subclass = 0;
    sort_item.disco = 0;
}
/* sortloot() classification; called at most once [per sort] for each object;
   also called by '\' command if discoveries use sortloot order */
let __loot_classify_def_srt_order = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
__nh_register_static(() => { __loot_classify_def_srt_order = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; });
let __loot_classify_armcat = '';
__nh_register_static(() => { __loot_classify_armcat = ''; });
export function loot_classify(sort_item, obj) {
    /* we may eventually make this a settable option to always use
       with sortloot instead of only when the 'sortpack' option isn't
       set; it is similar to sortpack's inv_order but items most
       likely to be picked up are moved to the front */
    let classorder = null;
    let p = null;
    let k = 0;
    let otyp = obj.otyp;
    let oclass = obj.oclass;
    let seen = 0;
    let discovered = game.objects[otyp].oc_name_known ? (1) : (0);
    /*
     * For the value types assigned by this classification, sortloot()
     * will put lower valued ones before higher valued ones.
     */
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        /* Archeologists can decipher the writing on a scroll label to work out
       what they are (exception: unlabeled scrolls don't have a label to
       decipher) */
        observe_object(obj);
    }
    /* xname(obj) does this; we want it sooner */
    seen = obj.dknown ? (1) : (0) , classorder = game.flags.sortpack ? game.flags.inv_order : __loot_classify_def_srt_order;
    p = strchr(classorder, oclass);
    if (p) {
        k = 1 + ((classorder.length - p.length));
    } else {
        k = 1 + strlen(classorder) + (oclass != VENOM_CLASS);
    }
    sort_item.orderclass = k;
    switch (oclass) {
        case ARMOR_CLASS:
            if (!__nh_char_at0(__nh_advance_str(__loot_classify_armcat, 7))) {
                /* subclass designation; only a few classes have subclasses
       and the non-armor ones we use are fairly arbitrary */
                /* one-time init; we use a different order than the subclass
               values defined by objclass.h */
                __loot_classify_armcat = __nh_char_write(__loot_classify_armcat, ARM_HELM, 1);
                __loot_classify_armcat = __nh_char_write(__loot_classify_armcat, ARM_GLOVES, 2);
                __loot_classify_armcat = __nh_char_write(__loot_classify_armcat, ARM_BOOTS, 3);
                __loot_classify_armcat = __nh_char_write(__loot_classify_armcat, ARM_SHIELD, 4);
                __loot_classify_armcat = __nh_char_write(__loot_classify_armcat, ARM_CLOAK, 5);
                __loot_classify_armcat = __nh_char_write(__loot_classify_armcat, ARM_SHIRT, 6);
                __loot_classify_armcat = __nh_char_write(__loot_classify_armcat, ARM_SUIT, 7);
                __loot_classify_armcat = __nh_char_write(__loot_classify_armcat, 7, 8);
            }
            k = game.objects[otyp].oc_subtyp;
            /* oc_armcat overloads oc_subtyp which is an 'schar' so guard
           against somebody assigning something unexpected to it */
            if (k < 0 || k >= 7) {
                k = 7;
            }
            k = __nh_char_at0(__nh_advance_str(__loot_classify_armcat, k));
            /* player used ESC to quit menu */
            /* no longer need to collect letters; sortloot() takes care of it, but
       still want to count far enough to know whether anything is in use */
            /* not collecting and found 'to' slot */
            break;
        case WEAPON_CLASS:
            k = game.objects[otyp].oc_subtyp;
            /* for weapons, group by ammo (arrows, bolts), launcher (bows),
           missile (darts, boomerangs), stackable (daggers, knives, spears),
           'other' (swords, axes, &c), polearms */
            k = (k < 0) ? ((k >= -P_CROSSBOW && k <= -P_BOW) ? 1 : 3) : ((k >= P_BOW && k <= P_CROSSBOW) ? 2 : (k == P_SPEAR || k == P_DAGGER || k == P_KNIFE) ? 4 : !((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && (game.objects[obj.otyp].oc_subtyp == P_POLEARMS || game.objects[obj.otyp].oc_subtyp == P_LANCE || is_art(obj, ART_SNICKERSNEE))) ? 5 : 6);
            break;
        case TOOL_CLASS:
            if (seen && discovered && (otyp == BAG_OF_TRICKS || otyp == HORN_OF_PLENTY)) {
                k = 2;
            } else if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS)) {
                k = 1;
            } else {
                switch (otyp) {
                    /* regular container or unknown bag of tricks */
                    case WOODEN_FLUTE:
                    case MAGIC_FLUTE:
                    case TOOLED_HORN:
                    case FROST_HORN:
                    case FIRE_HORN:
                    case WOODEN_HARP:
                    case MAGIC_HARP:
                    case BUGLE:
                    case LEATHER_DRUM:
                    case DRUM_OF_EARTHQUAKE:
                    case HORN_OF_PLENTY:
                        k = 3;
                        /* instrument or unknown horn of plenty */
                        /* better phrasing is desirable */
                        /* otmp has been updated and we're done merging */
                        break;
                    default:
                        k = 4;
                        break;
                }
            }
            break;
        case FOOD_CLASS:
            switch (otyp) {
                /* [what about separating "partly eaten" within each group?] */
                case SLIME_MOLD:
                    k = 1;
                    break;
                default:
                    k = obj.globby ? 6 : 2;
                    break;
                case TIN:
                    k = 3;
                    break;
                case EGG:
                    k = 4;
                    break;
                case CORPSE:
                    k = 5;
                    break;
            }
            break;
        case GEM_CLASS:
            switch (game.objects[obj.otyp].oc_material) {
                /*
         * Normally subclass takes priority over discovery status, but
         * that would give away information for gems (assuming we'll
         * group them as valuable gems, next glass, then gray stones,
         * and finally rocks once they're all fully identified).
         *
         * Order:
         *  1) unseen gems and glass ("gem")
         *  2) seen but undiscovered gems and glass ("blue gem"),
         *  3) discovered gems ("sapphire"),
         *  4) discovered glass ("worthless pieced of blue glass"),
         *  5) unseen gray stones and rocks ("stone"),
         *  6) seen but undiscovered gray stones ("gray stone"),
         *  7) discovered gray stones ("touchstone"),
         *  8) seen rocks ("rock").
         */
                case GEMSTONE:
                    k = !seen ? 1 : !discovered ? 2 : 3;
                    break;
                case GLASS:
                    k = !seen ? 1 : !discovered ? 2 : 4;
                    break;
                default:
                    k = !seen ? 5 : (obj.otyp != ROCK) ? (!discovered ? 6 : 7) : 8;
                    break;
            }
            break;
        default:
            k = 1;
            break;
    }
    sort_item.subclass = k;
    k = !seen ? 1 : (discovered || !(game.obj_descr[(game.objects[otyp]).oc_descr_idx].oc_descr)) ? 4 : (game.objects[otyp].oc_uname) ? 3 : 2;
    sort_item.disco = k;
    sort_item.inuse = 0;
}
/* sortloot() formatting routine; for alphabetizing, not shown to user */
export function loot_xname(obj) {
    let saveo = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let save_debug = 0;
    let res = null;
    let save_oname = null;
    /*
     * Deal with things that xname() includes as a prefix.  We don't
     * want such because they change alphabetical ordering.  First,
     * remember 'obj's current settings.
     */
    saveo.oeroded = obj.oeroded;
    saveo.blessed = obj.blessed , saveo.cursed = obj.cursed;
    saveo.spe = obj.spe;
    saveo.owt = obj.owt;
    save_oname = ((obj).oextra && ((obj).oextra.oname)) ? ((obj).oextra.oname) : null;
    save_debug = game.flags.debug;
    if (obj.oclass == POTION_CLASS) {
        /* suppress "diluted" for potions and "holy/unholy" for water;
       sortloot() will deal with them using other criteria than name */
        obj.oeroded = 0;
        if (obj.otyp == POT_WATER) {
            obj.blessed = 0 , obj.cursed = 0;
        }
    }
    /* make "wet towel" and "moist towel" format as "towel" so that all
       three group together */
    if (obj.otyp == TOWEL) {
        obj.spe = 0;
    }
    /* group globs by monster type rather than by size:  force all to
       have the same size adjective hence same "small glob of " prefix */
    if (obj.globby) {
        obj.owt = 20;
    }
    /* weight of a fresh glob (one pudding's worth) */
    /* suppress user-assigned name */
    if (save_oname && !obj.oartifact) {
        ((obj).oextra.oname) = null;
    }
    if (game.flags.debug) {
        /* avoid wizard mode formatting variations */
        /* paranoia:  before toggling off wizard mode, guard against a
           panic in xname() producing a normal mode panic save file */
        game.program_state.something_worth_saving = 0;
        game.flags.debug = (0);
    }
    res = cxname_singular(obj);
    if (save_debug) {
        game.flags.debug = (1);
        game.program_state.something_worth_saving = 1;
    }
    if (obj.oclass == POTION_CLASS) {
        obj.oeroded = saveo.oeroded;
        if (obj.otyp == POT_WATER) {
            obj.blessed = saveo.blessed , obj.cursed = saveo.cursed;
        }
    }
    if (obj.otyp == TOWEL) {
        obj.spe = saveo.spe;
        /* give "towel" a suffix that will force wet ones to come first,
           moist ones next, and dry ones last regardless of whether
           they've been flagged as having spe known */
        res = strcat(res, ((obj).otyp == TOWEL && (obj).spe > 0) ? ((obj.spe >= 3) ? "x" : "y") : "z");
    }
    if (obj.globby) {
        obj.owt = saveo.owt;
        res = strcat(res, (obj.owt <= 100) ? "a" : (obj.owt <= 300) ? "b" : (obj.owt <= 500) ? "c" : "d");
    }
    if (save_oname && !obj.oartifact) {
        ((obj).oextra.oname) = save_oname;
    }
    return res;
}
/* '$'==1, 'a'-'z'==2..27, 'A'-'Z'==28..53, '#'==54, catchall 55 */
export function invletter_value(c) {
    return (97 <= c && c <= 122) ? (c - 97 + 2) : (65 <= c && c <= 90) ? (c - 65 + 2 + 26) : (c == 36) ? 1 : (c == 35) ? 1 + invlet_basic + 1 : 1 + invlet_basic + 1 + 1;
}
/* qsort comparison routine for sortloot() */
export function sortloot_cmp(vptr1, vptr2) {
    let sli1 = null;
    let sli2 = null;
    let obj1 = null;
    let obj2 = null;
    let nam1 = null;
    let nam2 = null;
    let tmpstr = null;
    let val1 = 0;
    let val2 = 0;
    let namcmp = 0;
    tiebreak: {
        sli1 = vptr1;
        sli2 = vptr2;
        obj1 = sli1.obj;
        obj2 = sli2.obj;
        if ((game.sortlootmode & 8) != 0) {
            /* in-use takes precedence over all others */
            /* Classify each object at most once no matter how many
           comparisons it is involved in. */
            if (!sli1.orderclass) {
                inuse_classify(sli1, obj1);
            }
            if (!sli2.orderclass) {
                inuse_classify(sli2, obj2);
            }
            val1 = sli1.inuse;
            val2 = sli2.inuse;
            if (val1 != val2) {
                return val2 - val1;
            }
            /* bigger value comes before smaller */
            /* neither item in use (or both are lit lamps/candles or both are
           attached leashes; items using owornmask don't produce ties) */
            break tiebreak;
        }
        if ((game.sortlootmode & (1 | 2)) != 2) {
            /* order by object class unless we're doing by-invlet without sortpack */
            if (!sli1.orderclass) {
                loot_classify(sli1, obj1);
            }
            if (!sli2.orderclass) {
                loot_classify(sli2, obj2);
            }
            val1 = sli1.orderclass;
            val2 = sli2.orderclass;
            if (val1 != val2) {
                return val1 - val2;
            }
            if ((game.sortlootmode & 2) == 0) {
                /* skip sub-classes when ordering by sortpack+invlet */
                /* Class matches; sort by subclass. */
                val1 = sli1.subclass;
                val2 = sli2.subclass;
                if (val1 != val2) {
                    return val1 - val2;
                }
                /* Class and subclass match; sort by discovery status:
             * first unseen, then seen but not named or discovered,
             * then named, lastly discovered.
             * 1) potion
             * 2) pink potion
             * 3) dark green potion called confusion
             * 4) potion of healing
             * Multiple entries within each group will be put into
             * alphabetical order below.
             */
                val1 = sli1.disco;
                val2 = sli2.disco;
                if (val1 != val2) {
                    return val1 - val2;
                }
            }
        }
        if ((game.sortlootmode & 2) != 0) {
            /* order by assigned inventory letter */
            val1 = invletter_value(obj1.invlet);
            val2 = invletter_value(obj2.invlet);
            if (val1 != val2) {
                return val1 - val2;
            }
        }
        if ((game.sortlootmode & 4) == 0) {
            break tiebreak;
        }
        /*
     * Sort object names in lexicographical order, ignoring quantity.
     *
     * Each obj gets formatted at most once (per sort) no matter how many
     * comparisons it gets subjected to.
     */
        nam1 = sli1.str;
        if (!nam1) {
            tmpstr = loot_xname(obj1);
            nam1 = sli1.str = dupstr(tmpstr);
            maybereleaseobuf(tmpstr);
        }
        nam2 = sli2.str;
        if (!nam2) {
            tmpstr = loot_xname(obj2);
            nam2 = sli2.str = dupstr(tmpstr);
            maybereleaseobuf(tmpstr);
        }
        if ((namcmp = strncmpi((nam1), (nam2), -1)) != 0) {
            return namcmp;
        }
        val1 = obj1.bknown ? (obj1.blessed ? 3 : !obj1.cursed ? 2 : 1) : 0;
        val2 = obj2.bknown ? (obj2.blessed ? 3 : !obj2.cursed ? 2 : 1) : 0;
        if (val1 != val2) {
            return val2 - val1;
        }
        /* Sort by greasing.  This will put the objects in degreasing order. */
        val1 = obj1.greased;
        val2 = obj2.greased;
        if (val1 != val2) {
            return val2 - val1;
        }
        /* Sort by erosion.  The effective amount is what matters. */
        val1 = ((obj1).oeroded > (obj1).oeroded2 ? (obj1).oeroded : (obj1).oeroded2);
        val2 = ((obj2).oeroded > (obj2).oeroded2 ? (obj2).oeroded : (obj2).oeroded2);
        if (val1 != val2) {
            return val1 - val2;
        }
        /* Sort by erodeproofing.  Map known-invulnerable to 1, and both
       known-vulnerable and unknown-vulnerability to 0, because that's
       how they're displayed. */
        val1 = obj1.rknown && obj1.oerodeproof;
        val2 = obj2.rknown && obj2.oerodeproof;
        if (val1 != val2) {
            return val2 - val1;
        }
        if (game.objects[obj1.otyp].oc_uses_known && obj1.oclass != FOOD_CLASS) {
            /* Sort by enchantment.  Map unknown to -1000, which is comfortably
       below the range of obj->spe.  oc_uses_known means that obj->known
       matters, which usually indirectly means that obj->spe is relevant.
       Lots of objects use obj->spe for some other purpose (see obj.h). */
            /* exclude eggs (laid by you) and tins (homemade, pureed, &c) */
            val1 = obj1.known ? obj1.spe : -1000;
            val2 = obj2.known ? obj2.spe : -1000;
            if (val1 != val2) {
                return val2 - val1;
            }
        }
    }
    return (sli1.indx - sli2.indx);
}
/*
 * sortloot() - the story so far...
 *
 *      The original implementation constructed and returned an array
 *      of pointers to objects in the requested order.  Callers had to
 *      count the number of objects, allocate the array, pass one
 *      object at a time to the routine which populates it, traverse
 *      the objects via stepping through the array, then free the
 *      array.  The ordering process used a basic insertion sort which
 *      is fine for short lists but inefficient for long ones.
 *
 *      3.6.0 (and continuing with 3.6.1) changed all that so that
 *      sortloot was self-contained as far as callers were concerned.
 *      It reordered the linked list into the requested order and then
 *      normal list traversal was used to process it.  It also switched
 *      to qsort() on the assumption that the C library implementation
 *      put some effort into sorting efficiently.  It also checked
 *      whether the list was already sorted as it got ready to do the
 *      sorting, so re-examining inventory or a pile of objects without
 *      having changed anything would gobble up less CPU than a full
 *      sort.  But it had at least two problems (aside from the ordinary
 *      complement of bugs):
 *      1) some players wanted to get the original order back when they
 *      changed the 'sortloot' option back to 'none', but the list
 *      reordering made that infeasible;
 *      2) object identification giving the 'ID whole pack' result
 *      would call makeknown() on each newly ID'd object, that would
 *      call update_inventory() to update the persistent inventory
 *      window if one existed, the interface would call the inventory
 *      display routine which would call sortloot() which might change
 *      the order of the list being traversed by the identify code,
 *      possibly skipping the ID of some objects.  That could have been
 *      avoided by suppressing 'perm_invent' during identification
 *      (fragile) or by avoiding sortloot() during inventory display
 *      (more robust).
 *
 *      As of 3.6.2: revert to the temporary array of ordered obj pointers
 *      but have sortloot() do the counting and allocation.  Callers
 *      need to use array traversal instead of linked list traversal
 *      and need to free the temporary array when done.  And the
 *      array contains 'struct sortloot_item' (aka 'Loot') entries
 *      instead of simple 'struct obj *' entries.
 */
/* old version might have changed *olist, we don't */
/* flags for sortloot_cmp() */
/* T: traverse via obj->nexthere, F: via obj->nobj */
/* optional filter */
let __sortloot_zerosli = { obj: null, str: null, indx: 0, orderclass: 0, subclass: 0, disco: 0, inuse: 0 };
__nh_register_static(() => { __sortloot_zerosli = { obj: null, str: null, indx: 0, orderclass: 0, subclass: 0, disco: 0, inuse: 0 }; });
export function sortloot(olist, mode, by_nexthere, filterfunc) {
    let sliarray = null;
    let o = null;
    let n = 0;
    let i = 0;
    let augment_filter = 0;
    for (n = 0 , o = olist; o; o = by_nexthere ? o.v.v_nexthere : o.nobj) {
        ++n;
    }
    /* note: if there is a filter function, this might overallocate */
    sliarray = alloc((n + 1) * 1 /* sizeof(Loot) */);
    /* the 'keep cockatrice corpses' flag is overloaded with sort mode */
    augment_filter = (mode & 32) ? (1) : (0);
    /* remove flag, leaving mode */
    mode &= ~32;
    for (i = 0 , o = olist; o; o = by_nexthere ? o.v.v_nexthere : o.nobj) {
        /* populate aliarray[0..n-1] */
        if (filterfunc && !(filterfunc)(o) && (!augment_filter || o.otyp != CORPSE || !((game.mons[o.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[o.corpsenm]) == game.mons[PM_CHICKATRICE]))) {
            continue;
        }
        Object.assign(sliarray[i], __sortloot_zerosli);
        sliarray[i].obj = o , sliarray[i].indx = i;
        ++i;
    }
    n = i;
    /* add a terminator so that we don't have to pass 'n' back to caller */
    Object.assign(sliarray[n], __sortloot_zerosli);
    sliarray[n].indx = -1;
    if (mode && n > 1) {
        /* caller may be asking us to override filterfunc (in order
               to do a cockatrice corpse touch check during pickup even
               if/when the filter rejects food class) */
        /* do the sort; if no sorting is requested, we'll just return
       a sortloot_item array reflecting the current ordering */
        game.sortlootmode = mode;
        qsort(sliarray, n, 1 /* sizeof(Loot) */, sortloot_cmp);
        game.sortlootmode = 0;
        /* if sortloot_cmp formatted any objects, discard their strings now */
        for (i = 0; i < n; ++i) {
            if (sliarray[i].str) {
                free(sliarray[i].str) , sliarray[i].str = null;
            }
        }
    }
    return sliarray;
}
/* sortloot() callers should use this to free up memory it allocates */
export function unsortloot(loot_array_p) {
    if (loot_array_p.value) {
        free(loot_array_p.value) , loot_array_p.value = null;
    }
}
/* 3.6.0 'revamp' -- simpler than current, but ultimately too simple */
/* flags for sortloot_cmp() */
/* T: traverse via obj->nexthere, F: via obj->nobj */
/* extra input for sortloot_cmp() */
/*0*/
export function assigninvlet(otmp) {
    let inuse = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let obj = null;
    if (otmp.oclass == COIN_CLASS) {
        /* there should be at most one of these in inventory... */
        otmp.invlet = GOLD_SYM;
        /* TODO? cknown might be extended to candy bar, where it would mean that
       wrapper's text was known which in turn indicates candy bar's content */
        return;
    }
    for (i = 0; i < invlet_basic; i++) {
        inuse[i] = (0);
    }
    for (obj = game.invent; obj; obj = obj.nobj) {
        if (obj != otmp) {
            i = obj.invlet;
            if (97 <= i && i <= 122) {
                inuse[i - 97] = (1);
            } else if (65 <= i && i <= 90) {
                inuse[i - 65 + 26] = (1);
            }
            if (i == otmp.invlet) {
                otmp.invlet = 0;
            }
        }
    }
    if ((i = otmp.invlet) && ((97 <= i && i <= 122) || (65 <= i && i <= 90))) {
        return;
    }
    for (i = game.lastinvnr + 1; i != game.lastinvnr; i++) {
        if (i == invlet_basic) {
            i = -1;
            continue;
        }
        if (!inuse[i]) {
            break;
        }
    }
    otmp.invlet = (inuse[i] ? 35 : (i < 26) ? (97 + i) : (65 + i - 26));
    game.lastinvnr = i;
}
/* note: assumes ASCII; toggling a bit puts lowercase in front of uppercase */
/* sort the inventory; used by addinv() and doorganize() */
export function reorder_invent() {
    let otmp = null;
    let prev = null;
    let next = null;
    let need_more_sorting = 0;
    do {
        /*
         * We expect at most one item to be out of order, so this
         * isn't nearly as inefficient as it may first appear.
         */
        need_more_sorting = (0);
        for (otmp = game.invent , prev = null; otmp; ) {
            next = otmp.nobj;
            if (next && ((next).invlet ^ 32) < ((otmp).invlet ^ 32)) {
                need_more_sorting = (1);
                if (prev) {
                    prev.nobj = next;
                } else {
                    game.invent = next;
                }
                otmp.nobj = next.nobj;
                next.nobj = otmp;
                prev = next;
            } else {
                prev = otmp;
                otmp = next;
            }
        }
    } while (need_more_sorting);
}
/* scan a list of objects to see whether another object will merge with
   one of them; used in pickup.c when all 52 inventory slots are in use,
   to figure out whether another object could still be picked up */
export function merge_choice(objlist, obj) {
    let shkp = null;
    let save_nocharge = 0;
    /* might be checking 'obj' against empty inventory */
    if (!objlist) {
        return null;
    }
    if (obj.otyp == SCR_SCARE_MONSTER) {
        return null;
    }
    /* if this is an item on the shop floor, the attributes it will
       have when carried are different from what they are now; prevent
       that from eliciting an incorrect result from mergable() */
    save_nocharge = obj.no_charge;
    if (objlist == game.invent && obj.where == 1 && (shkp = shop_keeper(inside_shop(obj.ox, obj.oy))) != null) {
        if (obj.no_charge) {
            /* normally addtobill() clears no_charge when items in a shop are
       picked up, but won't do so if the shop has become untended */
            /* should not be set in hero's invent */
            obj.no_charge = 0;
        } else if (inhishop(shkp)) {
            return null;
        }
    }
    do {
        if (mergable(objlist, obj)) {
            break;
        }
        objlist = objlist.nobj;
    } while (objlist);
    obj.no_charge = save_nocharge;
    return objlist;
}
/* merge obj with otmp and delete obj if types agree */
export function merged(potmp, pobj) {
    let otmp = potmp.value;
    let obj = pobj;
    let discovered = (0);
    if (mergable(otmp, obj)) {
        /* Approximate age: we do it this way because if we were to
         * do it "accurately" (merge only when ages are identical)
         * we'd wind up never merging any corpses.
         * otmp->age = otmp->age*(1-proportion) + obj->age*proportion;
         *
         * Don't do the age manipulation if lit.  We would need
         * to stop the burn on both items, then merge the age,
         * then restart the burn.  Glob ages are averaged in the
         * absorb routine, which uses weight rather than quantity
         * to adjust for proportion (glob quantity is always 1).
         */
        if (!obj.lamplit && !obj.globby) {
            otmp.age = Math.trunc(((otmp.age * otmp.quan) + (obj.age * obj.quan)) / (otmp.quan + obj.quan));
        }
        if (!otmp.globby) {
            otmp.quan += obj.quan;
        }
        /* temporary special case for gold objects!!!! */
        if (otmp.oclass == COIN_CLASS) {
            otmp.owt = weight(otmp) , otmp.bknown = 0;
        } else if (!(otmp.otyp == GLOB_OF_GRAY_OOZE || otmp.otyp == GLOB_OF_BROWN_PUDDING || otmp.otyp == GLOB_OF_GREEN_SLIME || otmp.otyp == GLOB_OF_BLACK_PUDDING)) {
            otmp.owt = weight(otmp);
        }
        if (!((otmp).oextra && ((otmp).oextra.oname)) && ((obj).oextra && ((obj).oextra.oname))) {
            otmp = potmp.value = oname(otmp, ((obj).oextra.oname), 512);
        }
        obj_extract_self(obj);
        if (obj.pickup_prev && otmp.where == 3) {
            otmp.pickup_prev = 1;
        }
        /* really should merge the timeouts */
        if (obj.lamplit) {
            obj_merge_light_sources(obj, otmp);
        }
        if (obj.timed) {
            obj_stop_timers(obj);
        }
        if (obj.known != otmp.known) {
            /* objects can be identified by comparing them (unless Blind,
           but that is handled in mergable()); the object becomes
           identified in a particular dimension if either object was
           previously identified in that dimension, and if the
           identification states don't match, one of them must have
           previously been identified */
            otmp.known = 1;
            discovered = (1);
        }
        if (obj.rknown != otmp.rknown) {
            otmp.rknown = 1;
            if (otmp.oerodeproof) {
                discovered = (1);
            }
        }
        if (obj.bknown != otmp.bknown) {
            otmp.bknown = 1;
            if (!(game.urole.mnum == (PM_CLERIC))) {
                discovered = (1);
            }
        }
        if (obj.owornmask && ((otmp).where == 3)) {
            /* fixup for `#adjust' merging wielded darts, daggers, &c */
            let wmask = otmp.owornmask | obj.owornmask;
            if ((wmask & 256) != 0) {
                /* Both the items might be worn in competing slots;
               merger preference (regardless of which is which):
             primary weapon + alternate weapon -> primary weapon;
             primary weapon + quiver -> primary weapon;
             alternate weapon + quiver -> alternate weapon.
               (Prior to 3.3.0, it was not possible for the two
               stacks to be worn in different slots and `obj'
               didn't need to be unworn when merging.) */
                wmask = 256;
            } else if ((wmask & 1024) != 0) {
                wmask = 1024;
            } else if ((wmask & 512) != 0) {
                wmask = 512;
            } else {
                impossible("merging strangely worn items (%lx)", wmask);
                wmask = otmp.owornmask;
            }
            if ((otmp.owornmask & ~wmask) != 0) {
                setnotworn(otmp);
            }
            setworn(otmp, wmask);
            /* (this should not be necessary, since items
            already in a monster's inventory don't ever get
            merged into other objects [only vice versa]) */
            setnotworn(obj);
        }
        /* mergable() no longer requires 'bypass' to match; if 'obj' has
           the bypass bit set, force the combined stack to have that too;
           primarily in case this merge is occurring because stackobj()
           is operating on an object just dropped by a monster that was
           zapped with polymorph, we want bypass set in order to inhibit
           the same zap from affecting the new combined stack when it hits
           objects at the monster's spot (but also in case we're called by
           code that's using obj->bypass to track 'already processed') */
        if (obj.bypass) {
            otmp.bypass = 1;
        }
        if (obj.globby) {
            /* handle puddings a bit differently; absorption will free the
           other object automatically so we can just return out from here */
            pudding_merge_message(otmp, obj);
            obj_absorb(potmp, pobj);
            return 1;
        }
        if (discovered && otmp.where == 3 && obj.how_lost != 1 && otmp.how_lost != 1) {
            /* Print a message if item comparison discovers more
           information about the items (with the exception of thrown
           items, where this would be too spammy as such items get
           unidentified by monsters very frequently). */
            pline("You learn more about your items by comparing them.");
        }
        obfree(obj, otmp);
        return 1;
    }
    return 0;
}
/*
 * Adjust hero intrinsics as if this object was being added to the hero's
 * inventory.  Called _before_ the object has been added to the hero's
 * inventory.
 *
 * This is called when adding objects to the hero's inventory normally (via
 * addinv) or when an object in the hero's inventory has been polymorphed
 * in-place.
 */
export function addinv_core1(obj) {
    if (obj.oclass == COIN_CLASS) {
        game.disp.botl = (1);
    } else if (obj.otyp == AMULET_OF_YENDOR) {
        if (game.u.uhave.amulet) {
            impossible("already have amulet?");
        }
        game.u.uhave.amulet = 1;
        record_achievement(ACH_AMUL);
    } else if (obj.otyp == CANDELABRUM_OF_INVOCATION) {
        if (game.u.uhave.menorah) {
            impossible("already have candelabrum?");
        }
        game.u.uhave.menorah = 1;
        record_achievement(ACH_CNDL);
    } else if (obj.otyp == BELL_OF_OPENING) {
        if (game.u.uhave.bell) {
            impossible("already have silver bell?");
        }
        game.u.uhave.bell = 1;
        record_achievement(ACH_BELL);
    } else if (obj.otyp == SPE_BOOK_OF_THE_DEAD) {
        if (game.u.uhave.book) {
            impossible("already have the book?");
        }
        game.u.uhave.book = 1;
        record_achievement(ACH_BOOK);
    } else if (obj.oartifact) {
        if (is_quest_artifact(obj)) {
            if (game.u.uhave.questart) {
                impossible("already have quest artifact?");
            }
            game.u.uhave.questart = 1;
            artitouch(obj);
        }
        set_artifact_intrinsic(obj, 1, 4096);
    }
    if (((obj).o_id == game.context.achieveo.mines_prize_oid)) {
        /* "special achievements"; revealed in end of game disclosure and
       dumplog, originally just recorded in XLOGFILE */
        record_achievement(ACH_MINE_PRIZE);
        game.context.achieveo.mines_prize_oid = 0;
        /* was set in create_object(sp_lev.c) */
        obj.nomerge = 0;
    } else if (((obj).o_id == game.context.achieveo.soko_prize_oid)) {
        record_achievement(ACH_SOKO_PRIZE);
        game.context.achieveo.soko_prize_oid = 0;
        obj.nomerge = 0;
    }
}
/*
 * Adjust hero intrinsics (and perform other side effects) as if this
 * object was being added to the hero's inventory.  Called _after_ the
 * object has been added to the hero's inventory.
 *
 * This can be used either for updating intrinsics, or to allow the hero to
 * react to objects that are now in inventory.
 *
 * This is called when adding objects to the hero's inventory normally (via
 * addinv), when an object in the hero's inventory has been polymorphed
 * in-place, or when the hero re-examines objects that they picked up while
 * blind.
 *
 * This may occasionally be called on an item that was already in inventory,
 * so it should be written to work even if called multiple times in a row
 * (e.g. do not assume that the object was not in inventory already).
 */
export function addinv_core2(obj) {
    if (confers_luck(obj)) {
        /* new luckstone must be in inventory by this point
           for correct calculation */
        set_moreluck();
    }
    if ((game.urole.mnum == (PM_ARCHEOLOGIST)) && obj.oclass == SCROLL_CLASS && obj.otyp != SCR_BLANK_PAPER && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !game.objects[obj.otyp].oc_name_known) {
        observe_object(obj);
        pline("You decipher the label on %s.", yname(obj));
        discover_object((obj.otyp), (1), (1), (1));
        /* conduct: this is avoidable via not picking up / wishing for
           scrolls */
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by deciphering a scroll label");
        }
    }
}
/*
 * Add obj to the hero's inventory.  Make sure the object is "free".
 * Adjust hero attributes as necessary.
 */
export function addinv_core0(obj, other_obj, update_perm_invent) {
    let otmp = null;
    let prev = null;
    let saved_otyp = 0;
    let obj_was_thrown = 0;
    added: {
        saved_otyp = obj.otyp;
        if (obj.where != 0) {
            panic("addinv: obj not free");
        }
        if (obj.how_lost == 4) {
            return (null);
        }
        obj.no_charge = 0;
        if (((obj).cobj != null)) {
            picked_container(obj);
        }
        obj_was_thrown = (obj.how_lost == 1);
        obj.how_lost = 0;
        if (game.loot_reset_justpicked) {
            game.loot_reset_justpicked = (0);
            reset_justpicked(game.invent);
        }
        /* handle most side effects of carrying obj */
        addinv_core1(obj);
        if (other_obj) {
            /* this could be replaced by 'return m_carrying(&gy.youmonst, type);' */
            for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                if (otmp.nobj == other_obj) {
                    /* for addinv_before(); if something has been removed and is now being
       reinserted, try to put it in the same place instead of merging or
       placing at end; for thrown-and-return weapon with !fixinv setting */
                    obj.nobj = other_obj;
                    otmp.nobj = obj;
                    obj.where = 3;
                    break added;
                }
            }
        }
        if (game.uquiver && merged({ get value() { return game.uquiver; }, set value(_v) { game.uquiver = _v; } }, obj)) {
            /* merge with quiver in preference to any other inventory slot
       in case quiver and wielded weapon are both eligible; adding
       extra to quivered stack is more useful than to wielded one */
            obj = game.uquiver;
            if (!obj) {
                panic("addinv: null obj after quiver merge otyp=%d", saved_otyp);
            }
            break added;
        }
        for (prev = null , otmp = game.invent; otmp; prev = otmp , otmp = otmp.nobj) {
            if (merged({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, obj)) {
                /* merge if possible; find end of chain in the process */
                /* Collecting: #adjust an inventory stack into its same slot;
               keep it there and merge other compatible stacks into it.
               Traditional inventory behavior is to merge unnamed stacks
               with compatible named ones; we only want that if it is
               the 'from' stack (obj) with a name and candidate (otmp)
               without one, not unnamed 'from' with named candidate. */
                /*adj_type = "Collecting:"; //already set to this*/
                obj = otmp;
                if (!obj) {
                    panic("addinv: null obj after merge otyp=%d", saved_otyp);
                }
                break added;
            }
        }
        /* didn't merge, so insert into chain */
        assigninvlet(obj);
        if (game.flags.invlet_constant || !prev) {
            obj.nobj = game.invent;
            game.invent = obj;
            if (game.flags.invlet_constant) {
                reorder_invent();
            }
        } else {
            prev.nobj = obj;
            obj.nobj = null;
        }
        obj.where = 3;
        /* fill empty quiver if obj was thrown */
        if (obj_was_thrown && game.flags.pickup_thrown && !game.uquiver && obj.oartifact != ART_MJOLLNIR && obj.otyp != AKLYS && (throwing_weapon(obj) || ((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW))) {
            setuqwep(obj);
        }
    }
    obj.pickup_prev = 1;
    /* handle extrinsics conferred by carrying obj */
    addinv_core2(obj);
    /* carrying affects the obj */
    carry_obj_effects(obj);
    if (update_perm_invent) {
        update_inventory();
    }
    return obj;
}
/* add obj to the hero's inventory in the default fashion */
export function addinv(obj) {
    return addinv_core0(obj, null, (1));
}
/* add obj to the hero's inventory by inserting in front of a specific item;
   used for throw-and-return in case '!fixinv' is in effect */
export function addinv_before(obj, other_obj) {
    /* if 'other_obj' is present this will implicitly be 'nomerge' */
    return addinv_core0(obj, other_obj, (1));
}
/* return value will always be 'obj' */
export function addinv_nomerge(obj) {
    let result = null;
    let save_nomerge = obj.nomerge;
    obj.nomerge = 1;
    result = addinv(obj);
    obj.nomerge = save_nomerge;
    return result;
}
/*
 * Some objects are affected by being carried.
 * Make those adjustments here. Called _after_ the object
 * has been added to the hero's or monster's inventory,
 * and after hero's intrinsics have been updated.
 */
export function carry_obj_effects(obj) {
    if (obj.otyp == FIGURINE) {
        if (obj.cursed && obj.corpsenm != NON_PM && !dead_species(obj.corpsenm, (1))) {
            /* Cursed figurines can spontaneously transform when carried. */
            attach_fig_transform_timeout(obj);
        }
    }
}
/* Add an item to the inventory unless we're fumbling or it refuses to be
 * held (via touch_artifact), and give a message.
 * If there aren't any free inventory slots, we'll drop it instead.
 * If both success and failure messages are NULL, then we're just doing the
 * fumbling/slot-limit checking for a silent grab.  In any case,
 * touch_artifact will print its own messages if they are warranted.
 */
/* object to be held */
/* format string for message if it can't be held */
/* argument to use when formatting message */
/* message to display if successfully held */
export function hold_another_object(obj, drop_fmt, drop_arg, hold_msg) {
    let buf = '';
    drop_it: {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            observe_object(obj);
        }
        if (obj.oartifact) {
            /* place_object may change these */
            let crysknife = (obj.otyp == CRYSKNIFE);
            let oerode = obj.oerodeproof;
            let wasUpolyd = (game.u.umonnum != game.u.umonster);
            /* in case touching this object turns out to be fatal */
            place_object(obj, game.u.ux, game.u.uy);
            if (!touch_artifact(obj, game.youmonst)) {
                /* remove it from the floor */
                obj_extract_self(obj);
                /* now put it back again :-) */
                dropy(obj);
                return obj;
            } else if (wasUpolyd && !(game.u.umonnum != game.u.umonster)) {
                /* lose your grip if you revert your form */
                if (drop_fmt) {
                    pline(drop_fmt, drop_arg);
                }
                obj_extract_self(obj);
                dropy(obj);
                return obj;
            }
            obj_extract_self(obj);
            if (crysknife) {
                obj.otyp = CRYSKNIFE;
                obj.oerodeproof = oerode;
            }
        }
        if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
            obj.nomerge = 1;
            /* dropping expects obj to be in invent; since it's going to be
           dropped, avoid perminv update when temporarily adding it */
            obj = addinv_core0(obj, null, (0));
            break drop_it;
        } else if (obj.otyp == CORPSE && !u_safe_from_fatal_corpse(obj, st_all) && obj.usecount) {
            obj.usecount = 0;
            obj = addinv_core0(obj, null, (0));
            break drop_it;
        } else {
            let oquan = obj.quan;
            let prev_encumbr = near_capacity();
            /* encumbrance limit is max( current_state, pickup_burden );
           this used to use hardcoded MOD_ENCUMBER (stressed) instead
           of the 'pickup_burden' option (which defaults to stressed) */
            if (prev_encumbr < game.flags.pickup_burden) {
                prev_encumbr = game.flags.pickup_burden;
            }
            /* addinv() may redraw the entire inventory, overwriting
           drop_arg when it is kept in an 'obuf' from doname();
           [should no longer be necessary now that perm_invent update is
           suppressed, but it's cheap to keep as a paranoid precaution] */
            if (drop_arg) {
                drop_arg = strcpy(buf, drop_arg);
            }
            obj = addinv_core0(obj, null, (0));
            if (inv_cnt((0)) > invlet_basic || ((obj.otyp != LOADSTONE || !obj.cursed) && near_capacity() > prev_encumbr)) {
                /* undo any merge which took place */
                if (obj.quan > oquan) {
                    obj = splitobj(obj, oquan);
                }
                break drop_it;
            } else {
                if (game.flags.autoquiver && !game.uquiver && !obj.owornmask && (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART) || (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp)) || (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uswapwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uswapwep).otyp].oc_subtyp)))) {
                    setuqwep(obj);
                }
                if (hold_msg || drop_fmt) {
                    prinv(hold_msg, obj, oquan);
                }
                /* obj made it into inventory and is staying there */
                update_inventory();
                encumber_msg();
            }
        }
        return obj;
    }
    if (drop_fmt) {
        pline(drop_fmt, drop_arg);
    }
    obj.nomerge = 0;
    if (can_reach_floor((1)) || game.u.uswallow) {
        dropx(obj);
    } else {
        freeinv(obj);
        hitfloor(obj, (0));
    }
    return null;
}
/* useup() all of an item regardless of its quantity */
export function useupall(obj) {
    setnotworn(obj);
    freeinv(obj);
    obfree(obj, null);
}
/* an item in inventory is going away after being used */
export function useup(obj) {
    if (obj.quan > 1) {
        /* Note:  This works correctly for containers because they (containers)
       don't merge. */
        obj.in_use = (0);
        obj.quan--;
        obj.owt = weight(obj);
        update_inventory();
    } else {
        useupall(obj);
    }
}
/* use one charge from an item and possibly incur shop debt for it */
/* false if caller handles shop billing */
export function consume_obj_charge(obj, maybe_unpaid) {
    if (maybe_unpaid) {
        check_unpaid(obj);
    }
    obj.spe -= 1;
    if (obj.known) {
        update_inventory();
    }
}
/*
 * Adjust hero's attributes as if this object was being removed from the
 * hero's inventory.  This should only be called from freeinv() and
 * where we are polymorphing an object already in the hero's inventory.
 *
 * Should think of a better name...
 */
export function freeinv_core(obj) {
    if (obj.oclass == COIN_CLASS) {
        game.disp.botl = (1);
        return;
    } else if (obj.otyp == AMULET_OF_YENDOR) {
        if (!game.u.uhave.amulet) {
            impossible("don't have amulet?");
        }
        game.u.uhave.amulet = 0;
    } else if (obj.otyp == CANDELABRUM_OF_INVOCATION) {
        if (!game.u.uhave.menorah) {
            impossible("don't have candelabrum?");
        }
        game.u.uhave.menorah = 0;
    } else if (obj.otyp == BELL_OF_OPENING) {
        if (!game.u.uhave.bell) {
            impossible("don't have silver bell?");
        }
        game.u.uhave.bell = 0;
    } else if (obj.otyp == SPE_BOOK_OF_THE_DEAD) {
        if (!game.u.uhave.book) {
            impossible("don't have the book?");
        }
        game.u.uhave.book = 0;
    } else if (obj.oartifact) {
        if (is_quest_artifact(obj)) {
            if (!game.u.uhave.questart) {
                impossible("don't have quest artifact?");
            }
            game.u.uhave.questart = 0;
        }
        set_artifact_intrinsic(obj, 0, 4096);
    }
    if (obj.otyp == LOADSTONE) {
        curse(obj);
    } else if (confers_luck(obj)) {
        set_moreluck();
        game.disp.botl = (1);
    } else if (obj.otyp == FIGURINE && obj.timed) {
        stop_timer(FIG_TRANSFORM, obj_to_any(obj));
    }
    if (obj == game.context.tin.tin) {
        game.context.tin.tin = null;
        game.context.tin.o_id = 0;
    }
}
/* remove an object from the hero's inventory */
export function freeinv(obj) {
    /*
     * don't use freeinv/addinv to avoid double-touching artifacts,
     * dousing lamps, losing luck, cursing loadstone, etc.
     */
    extract_nobj(obj, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } });
    obj.pickup_prev = 0;
    freeinv_core(obj);
    update_inventory();
}
/* drawbridge is destroying all objects at <x,y> */
export function delallobj(x, y) {
    let otmp = null;
    let otmp2 = null;
    for (otmp = game.level.objects[x][y]; otmp; otmp = otmp2) {
        if (otmp == game.uball) {
            unpunish();
        }
        /* after unpunish(), or might get deallocated chain */
        otmp2 = otmp.v.v_nexthere;
        if (otmp == game.uchain) {
            continue;
        }
        delobj(otmp);
    }
}
/* normal object deletion (if unpaid, it remains on the bill) */
export function delobj(obj) {
    delobj_core(obj, (0));
}
/* destroy object; caller has control over whether to destroy something
   that ordinarily shouldn't be destroyed */
/* 'force==TRUE' used when reviving Rider corpses */
export function delobj_core(obj, force) {
    let update_map = 0;
    if (!force && obj_resists(obj, 0, 0)) {
        /* obj_resists(obj,0,0) protects the Amulet, the invocation tools,
       and Rider corpses */
        /* player might be doing something stupid, but we
         * can't guarantee that.  assume special artifacts
         * are indestructible via drawbridges, and exploding
         * chests, and golem creation, and ...
         */
        /* in case caller has set this to 1 */
        obj.in_use = 0;
        return;
    }
    update_map = (obj.where == 1);
    obj_extract_self(obj);
    if (update_map) {
        /* floor object's coordinates are always up to date */
        maybe_unhide_at(obj.ox, obj.oy);
        newsym(obj.ox, obj.oy);
    }
    obfree(obj, null);
}
/* try to find a particular type of object at designated map location */
export function sobj_at(otyp, x, y) {
    let otmp = null;
    for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.otyp == otyp) {
            break;
        }
    }
    return otmp;
}
/* sobj_at(&c) traversal -- find next object of specified type */
export function nxtobj(obj, type, by_nexthere) {
    let otmp = null;
    /* start with the object after this one */
    otmp = obj;
    do {
        otmp = !by_nexthere ? otmp.nobj : otmp.v.v_nexthere;
        if (!otmp) {
            break;
        }
    } while (otmp.otyp != type);
    return otmp;
}
/* return inventory object of type 'type' if hero has one, otherwise Null */
export function carrying(type) {
    let otmp = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == type) {
            break;
        }
    }
    return otmp;
}
/* return inventory object of type that will petrify on touch */
export function carrying_stoning_corpse() {
    let otmp = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE])) {
            break;
        }
    }
    return otmp;
}
/* Fictional and not-so-fictional currencies.
 * http://concord.wikia.com/wiki/List_of_Fictional_Currencies
 */
const currencies = ["Altarian Dollar", "Ankh-Morpork Dollar", "auric", "buckazoid", "cirbozoid", "credit chit", "cubit", "Flanian Pobble Bead", "fretzer", "imperial credit", "Hong Kong Luna Dollar", "kongbuck", "nanite", "quatloo", "simoleon", "solari", "spacebuck", "sporebuck", "Triganic Pu", "woolong", "zorkmid"];
/* The Hitchhiker's Guide to the Galaxy */
/* Discworld */
/* The Domination of Draka */
/* Space Quest */
/* Starslip */
/* Deus Ex */
/* Battlestar Galactica */
/* The Hitchhiker's Guide to the Galaxy */
/* Jules Verne */
/* Star Wars */
/* The Moon is a Harsh Mistress */
/* Snow Crash */
/* System Shock 2 */
/* Star Trek, Sim City */
/* Sim City */
/* Spaceballs */
/* Spaceballs */
/* Spore */
/* The Hitchhiker's Guide to the Galaxy */
/* Cowboy Bebop */
/* Zork, NetHack */
export function currency(amount) {
    let res = null;
    res = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? currencies[rn2((Math.trunc(21 /* sizeof(const char *const [21]) */ / 1 /* sizeof(const char *const) */)))] : "zorkmid";
    if (amount != 1) {
        res = makeplural(res);
    }
    return res;
}
export function u_carried_gloves() {
    let otmp = null;
    let gloves = null;
    if (game.uarmg) {
        gloves = game.uarmg;
    } else {
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_GLOVES)) {
                gloves = otmp;
                break;
            }
        }
    }
    return gloves;
}
/* 3.6 tribute */
export function u_have_novel() {
    let otmp = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == SPE_NOVEL) {
            return otmp;
        }
    }
    return null;
}
export function o_on(id, objchn) {
    let temp = null;
    while (objchn) {
        if (objchn.o_id == id) {
            return objchn;
        }
        if (((objchn).cobj != null) && (temp = o_on(id, objchn.cobj))) {
            return temp;
        }
        objchn = objchn.nobj;
    }
    return null;
}
export function obj_here(obj, x, y) {
    let otmp = null;
    for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
        if (obj == otmp) {
            return (1);
        }
    }
    return (0);
}
export function g_at(x, y) {
    let obj = game.level.objects[x][y];
    while (obj) {
        if (obj.oclass == COIN_CLASS) {
            return obj;
        }
        obj = obj.v.v_nexthere;
    }
    return null;
}
/* compact a string of inventory letters by dashing runs of letters */
export function compactify(buf) {
    let i1 = 1;
    let i2 = 1;
    let ilet = 0;
    let ilet1 = 0;
    let ilet2 = 0;
    ilet2 = __nh_char_at0(buf);
    ilet1 = __nh_char_at0(__nh_advance_str(buf, 1));
    buf = __nh_char_write(buf, ++i2, __nh_char_at0(__nh_advance_str(buf, ++i1)));
    ilet = __nh_char_at0(__nh_advance_str(buf, i1));
    while (ilet) {
        if (ilet == ilet1 + 1) {
            if (ilet1 == ilet2 + 1) {
                (ilet1 = 45, buf = __nh_char_write(buf, i2 - 1, 45));
            } else if (ilet2 == 45) {
                buf = __nh_char_write(buf, i2 - 1, ++ilet1);
                buf = __nh_char_write(buf, i2, __nh_char_at0(__nh_advance_str(buf, ++i1)));
                ilet = __nh_char_at0(__nh_advance_str(buf, i1));
                /* otmp has already been updated */
                continue;
            }
        } else if (ilet == 35) {
            /* compact three or more consecutive '#'
               characters into "#-#" */
            if (i2 >= 2 && __nh_char_at0(__nh_advance_str(buf, i2 - 2)) == 35 && __nh_char_at0(__nh_advance_str(buf, i2 - 1)) == 35) {
                buf = __nh_char_write(buf, i2 - 1, 45);
            } else if (i2 >= 3 && __nh_char_at0(__nh_advance_str(buf, i2 - 3)) == 35 && __nh_char_at0(__nh_advance_str(buf, i2 - 2)) == 45 && __nh_char_at0(__nh_advance_str(buf, i2 - 1)) == 35) {
                --i2;
            }
        }
        ilet2 = ilet1;
        ilet1 = ilet;
        buf = __nh_char_write(buf, ++i2, __nh_char_at0(__nh_advance_str(buf, ++i1)));
        ilet = __nh_char_at0(__nh_advance_str(buf, i1));
    }
}
/* some objects shouldn't be split when count given to getobj or askchain */
export function splittable(obj) {
    return !((obj.otyp == LOADSTONE && obj.cursed) || (obj == game.uwep && welded(game.uwep)));
}
/* match the prompt for either 'T' or 'R' command */
export function taking_off(action) {
    return !strcmp(action, "take off") || !strcmp(action, "remove");
}
export function mime_action(word) {
    let buf = '';
    let bp = null;
    let pfx = null;
    let sfx = null;
    buf = strcpy(buf, word);
    bp = pfx = sfx = null;
    if ((bp = strstr(buf, " on the ")) != null) {
        buf = nh_strchr_truncate(buf, " on the ", 'str');
        sfx = (bp.substring(1));
    }
    if ((!strncmp(buf, "rub the ", 8) && strstr(buf + 8, " on")) || (!strncmp(buf, "dip ", 4) && strstr(buf + 4, " into"))) {
        /* "rub the royal jelly on" -> "rubbing the royal jelly on", or
           "dip <foo> into" => "dipping <foo> into" */
        buf = __nh_char_write(buf, 3, 0);
        pfx = __nh_char_at0(__nh_advance_str(buf, 3 + 1));
    }
    if ((bp = strstr(buf, " or ")) != null) {
        buf = nh_strchr_truncate(buf, " or ", 'str');
        bp = (rn2(2) ? buf : (bp.substring(4)));
    } else {
        bp = buf;
    }
    You("mime %s%s%s something%s%s.", ing_suffix(bp), pfx ? " " : "", pfx ? pfx : "", sfx ? " " : "", sfx ? sfx : "");
}
/* getobj callback that allows any object - but not hands. */
export function any_obj_ok(obj) {
    if (obj) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE;
}
/* return string describing your hands based on action. */
export function getobj_hands_txt(action, qbuf) {
    if (!strcmp(action, "grease")) {
        qbuf = sprintf(qbuf, "your %s", fingers_or_gloves((0)));
    } else if (!strcmp(action, "write with")) {
        qbuf = sprintf(qbuf, "your %s", body_part(FINGERTIP));
    } else if (!strcmp(action, "wield")) {
        qbuf = sprintf(qbuf, "your %s %s%s", game.uarmg ? "gloved" : "bare", makeplural(body_part(HAND)), !game.uwep ? " (wielded)" : "");
    } else if (!strcmp(action, "ready")) {
        qbuf = sprintf(qbuf, "empty quiver%s", !game.uquiver ? " (nothing readied)" : "");
    } else {
        qbuf = sprintf(qbuf, "your %s", makeplural(body_part(HAND)));
    }
    return qbuf;
}
/*
 * getobj returns:
 *      struct obj *xxx:        object to do something with.
 *      (struct obj *) 0        error return: no object.
 *      &hands_obj              explicitly no object (as in w-).
 * The obj_ok callback should not have side effects (apart from
 * abnormal-behavior things like impossible calls); it can be called multiple
 * times on the same object during the execution of this function.
 * Callbacks' argument is either a valid object pointer or a null pointer,
 * which represents the validity of doing that action on HANDS_SYM. getobj
 * won't call it with &hands_obj, so its behavior can be undefined in that
 * case.
 */
/* usually a direct verb such as "drop" */
/* callback to classify an object's suitability */
/* some control to fine-tune the behavior */
const __getobj_only_one = "can only throw one at a time";
export function getobj(word, obj_ok, ctrlflags) {
    let otmp = null;
    let ilet = 0;
    let buf = '';
    let qbuf = '';
    let lets = '';
    let altlets = '';
    let suggested = 0;
    let bp = null;
    let __nh_ap_idx = 0;
    let allowcnt = 0;
    let forceprompt = 0;
    let allownone = 0;
    let inaccess = 0;
    let cnt = 0;
    let cntgiven = 0;
    let msggiven = 0;
    let oneloop = 0;
    let sortedinvent = null;
    let srtinv = null;
    let cq = { typ: 0, key: 0, dirx: 0, diry: 0, dirz: 0, intval: 0, ec_entry: null, next: null };
    let cmdq = null;
    let need_more_cq = 0;
    ilet = 0;
    suggested = 0;
    bp = buf;
    __nh_ap_idx = 0;
    allowcnt = (ctrlflags & 1);
    forceprompt = (ctrlflags & 2);
    allownone = (0);
    inaccess = 0;
    cnt = 0;
    cntgiven = (0);
    msggiven = (0);
    oneloop = (0);
    need_more_cq = (0);
    need_more_cq: while (true) {
    if ((cmdq = cmdq_pop()) != null) {
        Object.assign(cq, cmdq);
        /* cmdq not a key, or did not find the object, abort */
        free(cmdq);
        if (cq.typ != CMDQ_USER_INPUT) {
            /* user-input means pick something interactively now, with more
           in the command queue for after that; if not user-input, it
           has to be a key here */
            /* in case of non-key or lookup failure */
            otmp = null;
            if (cq.typ == CMDQ_KEY) {
                let v = 0;
                if (cq.key == 45) {
                    /* check whether the hands/self choice is suitable */
                    v = (obj_ok)(null);
                    if (v == GETOBJ_SUGGEST || v == GETOBJ_DOWNPLAY) {
                        otmp = game.hands_obj;
                    }
                } else {
                    /* find the item which was picked */
                    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                        if (otmp.invlet == cq.key) {
                            /* there could be more than one match if key is '#';
                       take first one which passes the obj_ok callback */
                            v = (obj_ok)(otmp);
                            if (v == GETOBJ_SUGGEST || v == GETOBJ_DOWNPLAY) {
                                break;
                            }
                        }
                    }
                }
            } else if (cq.typ == CMDQ_INT) {
                if (!cntgiven && allowcnt) {
                    cnt = cq.intval;
                    cntgiven = (1);
                    need_more_cq = (1);
                    continue need_more_cq;
                } else {
                    /* didn't find what we were looking for, */
                    /* so discard any other queued cmnds */
                    cmdq_clear(CQ_CANNED);
                    /* should maybe clear the CQ_REPEAT too? */
                    return null;
                }
            }
            if (!otmp) {
                cmdq_clear(CQ_CANNED);
            } else if (cntgiven) {
                /* if stack is smaller than count, drop the whole stack */
                if (cnt < 1 || otmp.quan <= cnt) {
                    cntgiven = (0);
                }
                break need_more_cq;
            }
            return otmp;
        }
    } else if (need_more_cq) {
        return null;
    }
    break;
    }
    split_otmp: {
        switch ((obj_ok)(null)) {
            /* is "hands"/"self" a valid thing to do this action on? */
            /* treat as likely candidate */
            case GETOBJ_SUGGEST:
                allownone = (1);
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 45) */;
                /* put a space after the '-' in the prompt */
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
                break;
            /* acceptable but not shown as likely choice */
            case GETOBJ_DOWNPLAY:
            case GETOBJ_EXCLUDE_INACCESS:
            case GETOBJ_EXCLUDE_SELECTABLE:
                allownone = (1);
                /* nothing currently gives this for '-'
                                     * but theoretically could if wearing
                                     * gloves */
                altlets = altlets.slice(0, __nh_ap_idx++) + String.fromCharCode(45);
                break;
            /* player skipped some alternative that's
                                    * not in inventory, now the hands/self
                                    * possibility is telling us so */
            case GETOBJ_EXCLUDE_NONINVENT:
                forceprompt = (0);
                inaccess++;
                break;
            default:
                break;
        }
        if (!game.flags.invlet_constant) {
            reassign();
        }
        /* force invent to be in invlet order before collecting candidate
       inventory letters */
        sortedinvent = sortloot(game.invent, 2, (0), null);
        for (let __nhi_srtinv = 0; (srtinv = sortedinvent[__nhi_srtinv]) && ((otmp = srtinv.obj) != null); __nhi_srtinv++) {
            if ((suggested) == (256 /* sizeof(char [256]) */ - 1) || __nh_ap_idx == 256 /* sizeof(char [256]) */ - 1) {
                /* we must have a huge number of noinvsym items somehow */
                impossible("getobj: inventory overflow");
                break;
            }
            bp = __nh_char_write(bp, suggested++, otmp.invlet);
            switch ((obj_ok)(otmp)) {
                case GETOBJ_EXCLUDE_INACCESS:
                    suggested--;
                    inaccess++;
                    break;
                case GETOBJ_EXCLUDE:
                case GETOBJ_EXCLUDE_SELECTABLE:
                    suggested--;
                    break;
                case GETOBJ_DOWNPLAY:
                    suggested--;
                    forceprompt = (1);
                    altlets = altlets.slice(0, __nh_ap_idx++) + String.fromCharCode(otmp.invlet);
                    break;
                case GETOBJ_SUGGEST:
                    break;
                /* adding otmp->invlet is all that's needed */
                /* not applicable for invent items */
                case GETOBJ_EXCLUDE_NONINVENT:
                default:
                    impossible("bad return from getobj callback");
            }
        }
        unsortloot({ get value() { return sortedinvent; }, set value(_v) { sortedinvent = _v; } });
        bp = __nh_char_write(bp, suggested, 0);
        /* If no objects were suggested but we added '- ' at the beginning for
     * hands, destroy the trailing space */
        if (suggested == 0 && bp > buf && __nh_char_at0(__nh_advance_str(bp, -1)) == 32) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        }
        lets = strcpy(lets, bp);
        /* necessary since we destroy buf */
        if (suggested > 5) {
            compactify(bp);
        }
        altlets = altlets.slice(0, __nh_ap_idx);
        if (suggested == 0 && !forceprompt && !allownone) {
            You("don't have anything %sto %s.", inaccess ? "else " : "", word);
            return null;
        }
        __outer_redo_menu: for (; ; ) {
            cnt = 0;
            cntgiven = (0);
            qbuf = sprintf(qbuf, "What do you want to %s?", word);
            if (game.in_doagain) {
                ilet = readchar();
            } else if (game.iflags.force_invmenu) {
                /* don't overwrite a possible quitchars */
                if (!oneloop) {
                    ilet = (lets || altlets) ? 63 : 42;
                }
                if (!msggiven) {
                    (game.windowprocs.win_putmsghistory)(qbuf, (0));
                }
                msggiven = (1);
                oneloop = (1);
            } else {
                if (!__nh_char_at0(buf)) {
                    qbuf = strcat(qbuf, " [*]");
                } else {
                    qbuf = __nh_buf_append(qbuf, sprintf('', " [%s or ?*]", buf));
                }
                ilet = yn_function(qbuf, null, 0, (0));
            }
            if (digit(ilet)) {
                let tmpcnt = 0;
                if (!allowcnt) {
                    pline("No count allowed with this command.");
                    continue;
                }
                ilet = get_count(null, ilet, 32767, { get value() { return tmpcnt; }, set value(_v) { tmpcnt = _v; } }, 1);
                if (tmpcnt) {
                    cnt = tmpcnt;
                    cntgiven = (1);
                }
            }
            if (strchr(quitchars, ilet)) {
                if (game.flags.verbose) {
                    pline("%s", c_common_strings.c_Never_mind);
                }
                return null;
            }
            if (ilet == 45) {
                if (!allownone) {
                    mime_action(word);
                }
                return (allownone ? game.hands_obj : null);
            }
            redo_menu: while (true) {
                if (ilet == 63 || ilet == 42) {
                    /* since gold is now kept in inventory, we need to do processing for
           select-from-invent before checking whether gold has been picked */
                    let allowed_choices = (ilet == 63) ? lets : null;
                    let ctmp = 0;
                    let menuquery = '';
                    let handsbuf = null;
                    if (ilet == 63 && !lets && altlets) {
                        allowed_choices = altlets;
                    }
                    (qbuf = '', menuquery = '');
                    if (game.iflags.force_invmenu) {
                        menuquery = nh_snprintf("getobj", 1975, menuquery, 128 /* sizeof(char [128]) */, "What do you want to %s?", word);
                    }
                    if (!allowed_choices || __nh_char_at0(allowed_choices) == 45 || buf == 45) {
                        handsbuf = getobj_hands_txt(word, qbuf);
                    }
                    ilet = display_pickinv(allowed_choices, handsbuf, menuquery, allownone, (1), allowcnt ? ctmp : null);
                    if (!ilet) {
                        if (oneloop) {
                            return null;
                        }
                        continue __outer_redo_menu;
                    }
                    if (ilet == 45) {
                        return game.hands_obj;
                    }
                    if (ilet == 27) {
                        if (game.flags.verbose) {
                            pline("%s", c_common_strings.c_Never_mind);
                        }
                        return null;
                    }
                    if (ilet == 42 || ilet == 63) {
                        continue redo_menu;
                    }
                    /* they typed a letter (not a space) at the prompt */
                    if (allowcnt && ctmp >= 0) {
                        cnt = ctmp;
                        cntgiven = (1);
                    }
                }
                for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                    if (otmp.invlet == ilet) {
                        break;
                    }
                }
                if (ilet == GOLD_SYM || (otmp && otmp.oclass == COIN_CLASS)) {
                    if (otmp && obj_ok(otmp) <= GETOBJ_EXCLUDE) {
                        /* some items have restrictions */
                        /* guard against the [hypothetical] chance of having more
               than one invent slot of gold and picking the non-'$' one */
                        You("cannot %s gold.", word);
                        return null;
                    }
                    if (cntgiven && cnt <= 0) {
                        /*
             * Historical note: early Nethack had a bug which was
             * first reported for Larn, where trying to drop 2^32-n
             * gold pieces was allowed, and did interesting things to
             * your money supply.  The LRS is the tax bureau from Larn.
             */
                        if (cnt < 0) {
                            pline_The("LRS would be very interested to know you have that much.");
                        }
                        return null;
                    }
                }
                if (cntgiven && !strcmp(word, "throw")) {
                    let coins = 0;
                    /* permit counts for throwing gold, but don't accept counts
               for other things since the throw code will split off a
               single item anyway; if populating quiver, 'word' will be
               "ready" or "fire" and this restriction doesn't apply */
                    if (cnt == 0 || !otmp) {
                        return null;
                    }
                    coins = (otmp.oclass == COIN_CLASS);
                    if (cnt > 1 && (!coins || cnt > otmp.quan)) {
                        if (cnt > otmp.quan) {
                            You("only have %ld%s%s.", otmp.quan, (!coins && otmp.quan > 1) ? " and " : "", (!coins && otmp.quan > 1) ? __getobj_only_one : "");
                        } else {
                            You("%s.", __getobj_only_one);
                        }
                        continue __outer_redo_menu;
                    }
                }
                /* May have changed the amount of money */
                game.disp.botl = (1);
                if (otmp && !game.in_doagain) {
                    if (cntgiven && cnt > 0) {
                        cmdq_add_int(CQ_REPEAT, cnt);
                    }
                    cmdq_add_key(CQ_REPEAT, ilet);
                }
                if (!otmp) {
                    /* [we used to set otmp (by finding ilet in invent) here, but
           that's been moved above so that otmp can be checked earlier] */
                    /* verify the chosen object */
                    You("don't have that object.");
                    if (game.in_doagain) {
                        return null;
                    }
                    continue __outer_redo_menu;
                } else if (cnt < 0 || otmp.quan < cnt) {
                    You("don't have that many!  You have only %ld.", otmp.quan);
                    if (game.in_doagain) {
                        return null;
                    }
                    continue __outer_redo_menu;
                }
                break __outer_redo_menu;
                break;
            }
        }
        if (obj_ok(otmp) == GETOBJ_EXCLUDE) {
            silly_thing(word, otmp);
            return null;
        }
    }
    if (cntgiven) {
        if (cnt == 0) {
            return null;
        }
        if (cnt != otmp.quan) {
            /* don't split a stack of cursed loadstones */
            if (splittable(otmp)) {
                otmp = splitobj(otmp, cnt);
            } else if (otmp.otyp == LOADSTONE && otmp.cursed) {
                otmp.corpsenm = cnt;
            }
        }
    }
    return otmp;
}
export function silly_thing(word, otmp) {
    if (!strcmp(word, "call") && (otmp.otyp == AMULET_OF_YENDOR || (otmp.otyp == FAKE_AMULET_OF_YENDOR && !otmp.known))) {
        pline_The("Amulet doesn't like being called names.");
    /* 'P','R' vs 'W','T' handling is obsolete */
    /* check for attempted use of accessory commands ('P','R') on armor
       and for corresponding armor commands ('W','T') on accessories */
    /* see comment about Amulet of Yendor in objtyp_is_callable(do_name.c);
       known fakes yield the silly thing feedback */
    } else {
        pline(c_common_strings.c_silly_thing_to, word);
    }
}
export function ckvalidcat(otmp) {
    /* use allow_category() from pickup.c */
    return allow_category(otmp);
}
export function ckunpaid(otmp) {
    return (otmp.unpaid || (((otmp).cobj != null) && count_unpaid(otmp.cobj)));
}
export function wearing_armor() {
    return (game.uarm || game.uarmc || game.uarmf || game.uarmg || game.uarmh || game.uarms || game.uarmu);
}
export function is_worn(otmp) {
    return (otmp.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288) | 1048576 | (256 | 1024 | 512))) ? (1) : (0);
}
/* is 'obj' being used by the hero?  worn, wielded, active lamp or leash;
   not to be confused with obj->in_use, which finishes using up an item
   (destroys it) if restoring a save file finds that bit set */
export function is_inuse(obj) {
    return (((obj).where == 3) && (is_worn(obj) || tool_being_used(obj)));
}
/* extra xprname() input that askchain() can't pass through safe_qbuf() */
// struct xprnctx: { let_, dot }
game.safeq_xprn_ctx = { let_: 0, dot: 0 };
/* safe_qbuf() -> short_oname() callback */
export function safeq_xprname(obj) {
    return xprname(obj, null, game.safeq_xprn_ctx.let, game.safeq_xprn_ctx.dot, 0, 0);
}
/* alternate safe_qbuf() -> short_oname() callback */
export function safeq_shortxprname(obj) {
    return xprname(obj, ansimpleoname(obj), game.safeq_xprn_ctx.let, game.safeq_xprn_ctx.dot, 0, 0);
}
const removeables = [ARMOR_CLASS, WEAPON_CLASS, RING_CLASS, AMULET_CLASS, TOOL_CLASS, 0];
/* Interactive version of getobj - used for Drop, Identify, and Takeoff (A).
   Return the number of times fn was called successfully.
   If combo is TRUE, we just use this to get a category list. */
/* combination menu flag */
export function ggetobj(word, fn, mx, combo, resultflags) {
    let ckfn = null;
    let ofilter = null;
    let takeoff = 0;
    let ident = 0;
    let allflag = 0;
    let m_seen = 0;
    let itemcount = 0;
    let oletct = 0;
    let iletct = 0;
    let unpaid = 0;
    let oc_of_sym = 0;
    let sym = 0;
    let __nh_ip_idx = 0;
    let olets = '';
    let ilets = '';
    let extra_removeables = '';
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let qbuf = '';
    if (!game.invent) {
        You("have nothing to %s.", word);
        if (resultflags) {
            resultflags.value = 1;
        }
        return 0;
    }
    if (resultflags) {
        resultflags.value = 0;
    }
    takeoff = ident = allflag = m_seen = (0);
    add_valid_menu_class(0);
    if (taking_off(word)) {
        takeoff = (1);
        ofilter = is_worn;
    } else if (!strcmp(word, "identify")) {
        ident = (1);
        ofilter = not_fully_identified;
    }
    iletct = collect_obj_classes(ilets, game.invent, (0), ofilter, { get value() { return itemcount; }, set value(_v) { itemcount = _v; } });
    unpaid = count_unpaid(game.invent);
    if (ident && !iletct) {
        /* no further identifications */
        return -1;
    } else if (game.invent) {
        ilets = __nh_char_write(ilets, iletct++, 32);
        if (unpaid) {
            ilets = __nh_char_write(ilets, iletct++, 117);
        }
        if (count_buc(game.invent, 256, ofilter)) {
            ilets = __nh_char_write(ilets, iletct++, 66);
        }
        if (count_buc(game.invent, 1024, ofilter)) {
            ilets = __nh_char_write(ilets, iletct++, 85);
        }
        if (count_buc(game.invent, 512, ofilter)) {
            ilets = __nh_char_write(ilets, iletct++, 67);
        }
        if (count_buc(game.invent, 2048, ofilter)) {
            ilets = __nh_char_write(ilets, iletct++, 88);
        }
        if (count_justpicked(game.invent)) {
            ilets = __nh_char_write(ilets, iletct++, 80);
        }
        ilets = __nh_char_write(ilets, iletct++, 97);
    }
    ilets = __nh_char_write(ilets, iletct++, 105);
    if (!combo) {
        ilets = __nh_char_write(ilets, iletct++, 109);
    }
    /* allow menu presentation on request */
    ilets = __nh_char_write(ilets, iletct, 0);
    for (; ; ) {
        qbuf = sprintf(qbuf, "What kinds of thing do you want to %s? [%s]", word, ilets);
        buf = getlin(qbuf, buf);
        if (buf[0] == 27) {
            return 0;
        }
        if (strchr(buf, 105)) {
            /* $ + a-z + A-Z + # + slop + \0 */
            let ailets = '';
            let otmp = null;
            let nextobj = null;
            /* applicable inventory letters; if empty, show entire invent */
            ailets = '';
            if (ofilter) {
                for (otmp = game.invent; otmp; otmp = nextobj) {
                    nextobj = otmp.nobj;
                    /* strchr() check: limit overflow items to one '#' */
                    if ((ofilter)(otmp) && !strchr(ailets, otmp.invlet)) {
                        ailets = strkitten(ailets, otmp.invlet);
                    }
                }
            }
            if (display_inventory(ailets, (1)) == 27) {
                return 0;
            }
        } else {
            break;
        }
    }
    extra_removeables = '';
    if (takeoff) {
        /* arbitrary types of items can be placed in the weapon slots
           [any duplicate entries in extra_removeables[] won't matter] */
        if (game.uwep) {
            extra_removeables = strkitten(extra_removeables, game.uwep.oclass);
        }
        if (game.uswapwep) {
            extra_removeables = strkitten(extra_removeables, game.uswapwep.oclass);
        }
        if (game.uquiver) {
            extra_removeables = strkitten(extra_removeables, game.uquiver.oclass);
        }
    }
    __nh_ip_idx = 0;
    olets = __nh_char_write(olets, oletct = 0, 0);
    while ((sym = __nh_char_at0(__nh_advance_str(buf, __nh_ip_idx++))) != 0) {
        if (sym == 32) {
            continue;
        }
        oc_of_sym = def_char_to_objclass(sym);
        if (takeoff && oc_of_sym != MAXOCLASSES) {
            if (strchr(extra_removeables, oc_of_sym)) {
                ;
            } else if (!strchr(removeables, oc_of_sym)) {
                /* skip rest of takeoff checks */
                pline("Not applicable.");
                return 0;
            } else if (oc_of_sym == ARMOR_CLASS && !wearing_armor()) {
                noarmor((0));
                return 0;
            } else if (oc_of_sym == WEAPON_CLASS && !game.uwep && !game.uswapwep && !game.uquiver) {
                You("are not wielding anything.");
                return 0;
            } else if (oc_of_sym == RING_CLASS && !game.uright && !game.uleft) {
                You("are not wearing rings.");
                return 0;
            } else if (oc_of_sym == AMULET_CLASS && !game.uamul) {
                You("are not wearing an amulet.");
                return 0;
            } else if (oc_of_sym == TOOL_CLASS && !game.ublindf) {
                You("are not wearing a blindfold.");
                return 0;
            }
        }
        if (sym == 97) {
            allflag = (1);
        } else if (sym == 65) {
            ;
        } else if (sym == 117) {
            add_valid_menu_class(117);
            ckfn = ckunpaid;
        } else if (strchr("BUCXP", sym)) {
            add_valid_menu_class(sym);
            ckfn = ckvalidcat;
        } else if (sym == 109) {
            m_seen = (1);
        } else if (oc_of_sym == MAXOCLASSES) {
            You("don't have any %c's.", sym);
        } else {
            if (!strchr(olets, oc_of_sym)) {
                add_valid_menu_class(oc_of_sym);
                olets = __nh_char_write(olets, oletct++, oc_of_sym);
                olets = __nh_char_write(olets, oletct, 0);
            }
        }
    }
    if (m_seen) {
        return (allflag || (!oletct && ckfn != ckunpaid && ckfn != ckvalidcat)) ? -2 : -3;
    } else if (game.flags.menu_style != 0 && combo && !allflag) {
        return 0;
    } else {
        let cnt = askchain(game.invent, olets, allflag, fn, ckfn, mx, word);
        /*
         * askchain() has already finished the job in this case
         * so set a special flag to convey that back to the caller
         * so that it won't continue processing.
         * Fix for bug C331-1 reported by Irina Rempt-Drijfhout.
         */
        if (combo && allflag && resultflags) {
            resultflags.value |= 1;
        }
        return cnt;
    }
}
/*
 * Walk through the chain starting at objchn and ask for all objects
 * with olet in olets (if nonNULL) and satisfying ckfn (if nonnull)
 * whether the action in question (i.e., fn) has to be performed.
 */
/* *objchn might change */
/* olets is an Obj Class char array */
/* bypass prompting about individual items */
/* action to perform on selected items */
/* callback to decided if an item is selectable */
/* if non-0, maximum number of objects to process */
/* name of the action */
export function askchain(objchn, olets, allflag, fn, ckfn, mx, word) {
    let otmp = null;
    let otmpo = null;
    let sym = 0;
    let ilet = 0;
    let cnt = 0;
    let dud = 0;
    let tmp = 0;
    let takeoff = 0;
    let nodot = 0;
    let ident = 0;
    let take_out = 0;
    let put_in = 0;
    let first = 0;
    let ininv = 0;
    let bycat = 0;
    let qbuf = '';
    let qpfx = '';
    let sortedchn = null;
    cnt = 0;
    dud = 0;
    sortedchn = null;
    takeoff = taking_off(word);
    ident = !strcmp(word, "identify");
    take_out = !strcmp(word, "take out");
    put_in = !strcmp(word, "put in");
    nodot = (!strcmp(word, "nodot") || !strcmp(word, "drop") || ident || takeoff || take_out || put_in);
    ininv = (objchn == game.invent);
    bycat = (menu_class_present(117) || menu_class_present(66) || menu_class_present(85) || menu_class_present(67) || menu_class_present(88) || menu_class_present(80));
    sortedchn = sortloot(objchn, 2, (0), null);
    first = (1);
    nextclass: while (true) {
    ilet = 97 - 1;
    ret: {
        /*
     * Interrogate in the object class order specified.
     * For example, if a person specifies =/ then first all rings
     * will be asked about followed by all wands.  -dgk
     */
        if (objchn && (objchn).oclass == COIN_CLASS) {
            ilet--;
        }
        /*
     * Multiple Drop can change the gi.invent chain while it operates
     * (dropping a burning potion of oil while levitating creates
     * an explosion which can destroy inventory items), so simple
     * list traversal
     *  for (otmp = *objchn; otmp; otmp = otmp2) {
     *      otmp2 = otmp->nobj;
     *      ...
     *  }
     * is inadequate here.  Use each object's bypass bit to keep
     * track of which list elements have already been processed.
     */
        /* clear chain's bypass bits */
        bypass_objlist(objchn, (0));
        while ((otmp = nxt_unbypassed_loot(sortedchn, objchn)) != null) {
            if (ilet == 122) {
                ilet = 65;
            } else if (ilet == 90) {
                ilet = 35;
            } else {
                ilet++;
            }
            if (olets && __nh_char_at0(olets) && otmp.oclass != __nh_char_at0(olets)) {
                continue;
            }
            if (takeoff && !is_worn(otmp)) {
                continue;
            }
            if (ident && !not_fully_identified(otmp)) {
                continue;
            }
            if (ckfn && !(ckfn)(otmp)) {
                continue;
            }
            if (bycat && !ckvalidcat(otmp)) {
                continue;
            }
            if (!allflag) {
                game.safeq_xprn_ctx.let = ilet;
                game.safeq_xprn_ctx.dot = !nodot;
                qpfx = '';
                if (first) {
                    /* traditional_loot() skips prompting when only one
                   class of objects is involved, so prefix the first
                   object being queried here with an explanation why */
                    if (take_out || put_in) {
                        sprintf(qpfx, "%s: ", word) , qpfx = (() => { const __s = qpfx; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
                    }
                    first = (0);
                }
                safe_qbuf(qbuf, qpfx, "?", otmp, ininv ? safeq_xprname : doname, ininv ? safeq_shortxprname : ansimpleoname, "item");
                /* nyaq(qbuf) or nyNaq(qbuf), bypassing canned input for ^A */
                sym = yn_function(qbuf, (takeoff || ident || otmp.quan < 2) ? ynaqchars : ynNaqchars, 110, (0));
            } else {
                sym = 121;
            }
            otmpo = otmp;
            if (sym == 35) {
                if (!game.yn_number) {
                    /* Number was entered; split the object unless it corresponds
               to 'none' or 'all'.  2 special cases: cursed loadstones and
               welded weapons (eg, multiple daggers) will remain as merged
               unit; done to avoid splitting an object that won't be
               droppable (even if we're picking up rather than dropping). */
                    sym = 110;
                } else {
                    sym = 121;
                    if (game.yn_number < otmp.quan && splittable(otmp)) {
                        otmp = splitobj(otmp, game.yn_number);
                    }
                }
            }
            switch (sym) {
                case 97:
                    allflag = 1;
                    ;
                case 121:
                    tmp = (fn)(otmp);
                    if (tmp <= 0) {
                        if (container_gone(fn)) {
                            /* otmp caused magic bag to explode;
                       both are now gone */
                            otmp = null;
                        } else if (otmp && otmp != otmpo) {
                            /* split occurred, merge again */
                            unsplitobj(otmp);
                        }
                        if (tmp < 0) {
                            break ret;
                        }
                    }
                    cnt += tmp;
                    if (--mx == 0) {
                        break ret;
                    }
                    ;
                case 110:
                    if (nodot) {
                        dud++;
                    }
                    ;
                default:
                    break;
                case 113:
                    if (ident) {
                        cnt = -1;
                    }
                    break ret;
            }
        }
        if (olets && __nh_char_at0(olets) && __nh_char_at0((olets = __nh_advance_str(olets, 1)))) {
            continue nextclass;
        }
        if (!takeoff && (dud || cnt)) {
            pline("That was all.");
        } else if (!dud && !cnt) {
            pline("No applicable objects.");
        }
    }
    break nextclass;
    }
    unsortloot({ get value() { return sortedchn; }, set value(_v) { sortedchn = _v; } });
    /* can't just clear bypass bit of items in objchn because the action
       applied to selected ones might move them to a different chain */
    /*bypass_objlist(*objchn, FALSE);*/
    clear_bypasses();
    return cnt;
}
/* The menu for rerolling attributes and inventory.

   This is similar to the other inventory menus, but simpler to help it fit on
   the screen (there's more text around it and rerolling is difficult if you
   can't see the whole list at once).

   Returns TRUE (and increases numrerolls) if a reroll was requested. */
export function reroll_menu() {
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let pick_list = null;
    let otmp = null;
    let tmpglyph = 0;
    let tmpglyphinfo = { glyph: 0, ttychar: 0, framecolor: 0, gm: { glyphflags: 0, sym: { color: 0, symidx: 0 }, customcolor: 0, color256idx: 0, tileidx: 0, u: null } };
    let option = 0;
    let buf = '';
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    Object.assign(any, cg.zeroany);
    any.a_char = 110;
    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : 112, 0, 0, 8, "start the game with this character", 0);
    any.a_char = 121;
    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : 114, 0, 0, 8, "reroll another character", 0);
    any.a_char = 0;
    add_menu(win, nul_glyphinfo, any, 0, 0, 0, 8, "", 0);
    /* avoid adding items to discoveries */
    ++game.distantname;
    ++game.iflags.override_ID;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        tmpglyph = (((otmp).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((otmp).corpsenm + ((((otmp).spe & 3) == 1) ? (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((otmp).otyp == CORPSE) ? (((otmp).corpsenm + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(otmp).dknown && ((otmp).oclass == POTION_CLASS || ((otmp).otyp >= FIRST_REAL_GEM && ((otmp).otyp <= LAST_GLASS_GEM)) || ((otmp).otyp >= FIRST_SPELL && ((otmp).otyp <= LAST_SPELL)))) ? (((otmp).oclass + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((otmp).otyp + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))));
        map_glyphinfo(0, 0, tmpglyph, 0, tmpglyphinfo);
        add_menu(win, tmpglyphinfo, any, 0, 0, 0, 8, doname(otmp), 0);
    }
    --game.iflags.override_ID;
    --game.distantname;
    add_menu(win, nul_glyphinfo, any, 0, 0, 0, 8, "", 0);
    buf = sprintf(buf, "St:%s Dx:%-1d Co:%-1d In:%-1d Wi:%-1d Ch:%-1d", get_strength_str(), (acurr(A_DEX)), (acurr(A_CON)), (acurr(A_INT)), (acurr(A_WIS)), (acurr(A_CHA)));
    add_menu(win, nul_glyphinfo, any, 0, 0, 0, 8, buf, 0);
    (game.windowprocs.win_end_menu)(win, "Reroll this character?");
    if (select_menu(win, 1, pick_list) > 0) {
        option = pick_list[0].item.a_char;
        free(pick_list);
    } else {
        /* user closed the menu without selecting; unclear what their choice
           is here so ask again; but (e.g. for hangup handling) stop asking if
           the user cancels out again */
        option = yn_function("Reroll this character?", ynchars, 110, (1));
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (option == 121) {
        ++game.u.uroleplay.numrerolls;
        return (1);
    }
    return (0);
}
/*
 *      Object identification routines:
 */
/* set the cknown and lknown flags on an object if they're applicable */
export function set_cknown_lknown(obj) {
    if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) || obj.otyp == STATUE) {
        obj.cknown = obj.lknown = 1;
    } else if (obj.otyp == TIN) {
        obj.cknown = 1;
    }
    return;
}
/* make an object actually be identified; no display updating */
export function fully_identify_obj(otmp) {
    discover_object((otmp.otyp), (1), (1), (1));
    if (otmp.oartifact) {
        discover_artifact(otmp.oartifact);
    }
    observe_object(otmp);
    otmp.known = otmp.bknown = otmp.rknown = 1;
    /* set otmp->{cknown,lknown} if applicable */
    set_cknown_lknown(otmp);
    if (otmp.otyp == EGG && otmp.corpsenm != NON_PM) {
        learn_egg_type(otmp.corpsenm);
    }
}
/* ggetobj callback routine; identify an object and give immediate feedback */
export function identify(otmp) {
    fully_identify_obj(otmp);
    prinv(null, otmp, 0);
    return 1;
}
/* menu of unidentified objects; select and identify up to id_limit of them */
export function menu_identify(id_limit) {
    let pick_list = null;
    let n = 0;
    let i = 0;
    let first = 1;
    let tryct = 5;
    let buf = '';
    while (id_limit) {
        buf = sprintf(buf, "What would you like to identify %s?", first ? "first" : "next");
        n = query_objlist(buf, game.invent, (32 | 64 | 8 | 16), { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2, not_fully_identified);
        if (n > 0) {
            /* assumptions:  id_limit > 0 and at least one unID'd item is present */
            if (n > id_limit) {
                n = id_limit;
            }
            for (i = 0; i < n; i++ , id_limit--) {
                identify(pick_list[i].item.a_obj);
            }
            free(pick_list);
            if (id_limit) {
                (game.windowprocs.win_wait_synch)();
            }
            /* Before we loop to pop open another menu */
            first = 0;
        } else if (n == -2) {
            break;
        } else if (n == -1) {
            pline("That was all.");
            break;
        } else if (!--tryct) {
            pline("%s", c_common_strings.c_thats_enough_tries);
            break;
        } else {
            pline("Choose an item; use ESC to decline.");
        }
    }
}
/* count the unidentified items */
export function count_unidentified(objchn) {
    let unid_cnt = 0;
    let obj = null;
    for (obj = objchn; obj; obj = obj.nobj) {
        if (not_fully_identified(obj)) {
            ++unid_cnt;
        }
    }
    return unid_cnt;
}
/* dialog with user to identify a given number of items; 0 means all */
/* T: just read unknown identify scroll */
export function identify_pack(id_limit, learning_id) {
    let obj = null;
    let n = 0;
    let unid_cnt = count_unidentified(game.invent);
    if (!unid_cnt) {
        You("have already identified %s of your possessions.", !learning_id ? "all" : "the rest");
    } else if (!id_limit || id_limit >= unid_cnt) {
        for (obj = game.invent; obj; obj = obj.nobj) {
            if (not_fully_identified(obj)) {
                /* TODO:  use fully_identify_obj and cornline/menu/whatever here */
                identify(obj);
                if (--unid_cnt < 1) {
                    break;
                }
            }
        }
    } else {
        /* identify up to `id_limit' items */
        n = 0;
        if (game.flags.menu_style == 0) {
            do {
                n = ggetobj("identify", identify, id_limit, (0), null);
                if (n < 0) {
                    break;
                }
            } while ((id_limit -= n) > 0);
        }
        if (n == 0 || n < -1) {
            menu_identify(id_limit);
        }
    }
    update_inventory();
}
/* called when regaining sight; mark inventory objects which were picked
   up while blind as now having been seen */
export function learn_unseen_invent() {
    let otmp = null;
    let invupdated = (0);
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        return;
    }
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.dknown && (otmp.bknown || !(game.urole.mnum == (PM_CLERIC))) && (otmp.oclass != SCROLL_CLASS || !(game.urole.mnum == (PM_ARCHEOLOGIST)))) {
            continue;
        }
        invupdated = (1);
        /* xname() will set dknown, perhaps bknown (for priest[ess]);
           result from xname() is immediately released for re-use */
        maybereleaseobuf(xname(otmp));
        /* you react to seeing the object */
        /*
         * If object->eknown gets implemented (see learnwand(zap.c)),
         * handle deferred discovery here.
         */
        addinv_core2(otmp);
    }
    if (invupdated) {
        update_inventory();
    }
}
/* persistent inventory window is maintained by interface code;
   'update_inventory' used to be a macro for
   (*windowprocs.win_update_inventory) but the restore hackery to suppress
   screen updates was getting out of hand; this is now a central call point */
export function update_inventory() {
    let save_suppress_price = 0;
    /* not covered by suppress_map_output */
    if (!game.program_state.in_moveloop) {
        return;
    }
    /* despite name, used for perm_invent too */
    if (suppress_map_output()) {
        return;
    }
    /*
     * Ought to check (windowprocs.wincap & WC_PERM_INVENT) here....
     *
     * We currently don't skip this call when iflags.perm_invent is False
     * because curses uses that to disable a previous perm_invent window
     * (after toggle via 'O'; perhaps the options code should handle that).
     *
     * perm_invent might get updated while some code is avoiding price
     * feedback during obj name formatting for messages.  Temporarily
     * force 'normal' formatting during the perm_invent update.  (Cited
     * example was an update triggered by change in invent gold when
     * transferring some to shk during itemized billing.  A previous fix
     * attempt in the shop code handled it for unpaid items but not for
     * paying for used-up shop items; that follows a different code path.)
     */
    save_suppress_price = game.iflags.suppress_price;
    game.iflags.suppress_price = 0;
    if (typeof game.windowprocs.win_update_inventory === "function") (game.windowprocs.win_update_inventory)(0);
    game.iflags.suppress_price = save_suppress_price;
}
/* the #perminv command - call interface's persistent inventory routine */
export function doperminv() {
    if ((game.windowprocs.wincap & 134217728) == 0) {
        /*
     * If persistent inventory window is enabled, interact with it.
     *
     * Depending on interface, might accept and execute one scrolling
     * request (MENU_{FIRST,NEXT,PREVIOUS,LAST}_PAGE) then return,
     * or might stay and handle multiple requests until user finishes
     * (typically by typing <return> or <esc> but that's up to interface).
     */
        /* [currently this would redraw the persistent inventory window
       whether that's needed or not, so also reset any previous
       scrolling; we don't want that if the interface only accepts
       one scroll command at a time] */
        /* make sure that it's up to date */
        /* [TODO? perhaps omit "by <interface>" if all the window ports
           compiled into this binary lack support for perm_invent...] */
        pline("Persistent inventory display is not supported by '%s'.", game.windowprocs.name);
    } else if (!game.iflags.perm_invent) {
        pline("Persistent inventory ('perm_invent' option) is not presently enabled.");
    } else if (!game.invent) {
        /* [should this be left for the interface to decide?] */
        pline("Persistent inventory display is empty.");
    } else {
        /* note: we used to request a scrolling key here and pass that to
           (*win_update_inventory)(key), but that limited the functionality
           and also cluttered message history with prompt and response so
           just send non-zero and have the interface be responsible for it */
        (game.windowprocs.win_update_inventory)(1);
    }
    return 0;
}
/* should of course only be called for things in invent */
export function obj_to_let(obj) {
    if (!game.flags.invlet_constant) {
        obj.invlet = 35;
        reassign();
    }
    return obj.invlet;
}
/*
 * Print the indicated quantity of the given object.  If quan == 0L then use
 * the current quantity.
 */
export function prinv(prefix, obj, quan) {
    let total_of = (quan && (quan < obj.quan));
    let totalbuf = '';
    if (!prefix) {
        prefix = "";
    }
    totalbuf = '';
    if (total_of) {
        totalbuf = nh_snprintf("prinv", 2886, totalbuf, 128 /* sizeof(char [128]) */, " (%ld in total).", obj.quan);
    }
    pline("%s%s%s%s", prefix, __nh_char_at0(prefix) ? " " : "", xprname(obj, null, obj_to_let(obj), !total_of, 0, quan), game.flags.verbose ? totalbuf : "");
}
/* text to print instead of obj */
/* inventory letter */
/* append period; (dot && cost => Iu) */
/* cost (for inventory of unpaid or expended items) */
/* if non-0, print this quantity, not obj->quan */
let __xprname_li = '';
__nh_register_static(() => { __xprname_li = ''; });
export function xprname(obj, txt, let_, dot, cost, quan) {
    /* plenty of room for count and hallucinatory currency */
    let suffix = '';
    /* signed int for %*s formatting */
    let sfxlen = 0;
    let txtlen = 0;
    let fmt = null;
    let use_invlet = (game.flags.invlet_constant && obj != (null) && let_ != 62 && let_ != 45);
    let savequan = 0;
    if (quan && obj) {
        savequan = obj.quan;
        obj.quan = quan;
    }
    /*
     * If let is:
     *  -  Then obj == null and 'txt' refers to hands or fingers.
     *  *  Then obj == null and we are printing a total amount.
     *  >  Then the object is contained and doesn't have an inventory letter.
     */
    fmt = "%c - %.*s%s";
    if (!txt) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        txt = doname(obj);
    }
    txtlen = strlen(txt);
    if (cost != 0 || let_ == 42) {
        /* if dot is true, we're doing Iu, otherwise Ix */
        if (dot && use_invlet) {
            let_ = obj.invlet;
        }
        suffix = sprintf(suffix, "%c%6ld %.50s", game.iflags.menu_tab_sep ? 9 : 32, cost, currency(cost));
        if (!game.iflags.menu_tab_sep) {
            fmt = "%c - %-45.*s%s";
            if (txtlen < 45) {
                txtlen = 45;
            }
        }
    } else {
        /* ordinary inventory display or pickup message */
        if (use_invlet) {
            let_ = obj.invlet;
        }
        suffix = strcpy(suffix, dot ? "." : "");
    }
    sfxlen = strlen(suffix);
    if (txtlen > 256 - 1 - (4 + sfxlen)) {
        txtlen = 256 - 1 - (4 + sfxlen);
    }
    __xprname_li = sprintf(__xprname_li, fmt, let_, txtlen, txt, suffix);
    if (savequan) {
        obj.quan = savequan;
    }
    return __xprname_li;
}
/* show some or all of inventory while allowing the picking of an item in
   order to preform context-sensitive item action on it; always returns 'ok';
   invent subsets specified by the ')', '[', '(', '=', '"', or '*' commands
   when they're invoked with the 'm' prefix (or without it for '*') */
/* list of invlet values to include */
/* affects sortloot() and header labels */
/* alternate value for in-use "Accessories" */
export function dispinv_with_action(lets, use_inuse_ordering, alt_label) {
    let otmp = null;
    let nextobj = null;
    let save_accessories = null;
    let c = 0;
    let save_sortloot = 0;
    let len = lets ? strlen(lets) : 0;
    let menumode = (len != 1 || game.iflags.menu_requested) ? (1) : (0);
    let save_force_invmenu = game.iflags.force_invmenu;
    if (use_inuse_ordering) {
        save_accessories = inuse_headers[4];
        save_sortloot = game.flags.sortloot;
        /* checked by display_pickinv() */
        game.flags.sortloot = 105;
        if (alt_label) {
            inuse_headers[4] = alt_label;
        }
    }
    game.iflags.force_invmenu = (0);
    c = display_inventory(lets, menumode);
    if (use_inuse_ordering) {
        game.flags.sortloot = save_sortloot;
        inuse_headers[4] = save_accessories;
    }
    game.iflags.force_invmenu = save_force_invmenu;
    if (c && c != 27) {
        for (otmp = game.invent; otmp; otmp = nextobj) {
            nextobj = otmp.nobj;
            if (otmp.invlet == c) {
                return itemactions(otmp);
            }
        }
    }
    return 0;
}
/* the #inventory command (not much left...) */
export function ddoinv() {
    return dispinv_with_action(null, (0), null);
}
/*
 * find_unpaid()
 *
 * Scan the given list of objects.  If last_found is NULL, return the first
 * unpaid object found.  If last_found is not NULL, then skip over unpaid
 * objects until last_found is reached, then set last_found to NULL so the
 * next unpaid object is returned.  This routine recursively follows
 * containers.
 */
export function find_unpaid(list, last_found) {
    let obj = null;
    while (list) {
        if (list.unpaid) {
            if (last_found.value) {
                /* still looking for previous unpaid object */
                if (list == last_found.value) {
                    last_found.value = null;
                }
            } else {
                return ((last_found.value = list));
            }
        }
        if (((list).cobj != null)) {
            if ((obj = find_unpaid(list.cobj, last_found)) != null) {
                return obj;
            }
        }
        list = list.nobj;
    }
    return null;
}
export function free_pickinv_cache() {
    if (game.cached_pickinv_win != (-1)) {
        (game.windowprocs.win_destroy_nhwindow)(game.cached_pickinv_win);
        game.cached_pickinv_win = (-1);
    }
}
/*
 * Internal function used by display_inventory and getobj that can display
 * inventory and return a count as well as a letter.
 */
/* non-compacted list of invlet values */
/* non-object "bare hands" or "fingers" */
/* optional; prompt string for menu */
/* hands are allowed (maybe alternate) choice */
/* True: select an item, False: just display */
/* optional; count player entered when selecting an item */
const __display_pickinv_not_carrying_anything = "Not carrying anything";
const __display_pickinv_not_using_anything = "Not using any items";
const __display_pickinv_only_carrying_gold = "Only carrying gold";
export function display_pickinv(lets, xtra_choice, query, allowxtra, want_reply, out_cnt) {
    /* potential entries for perm_invent window */
    let otmp = null;
    let wizid_fakeobj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let inuse_fakeobj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let ilet = 0;
    let ret = 0;
    let formattedobj = null;
    let invlet = game.flags.inv_order;
    let n = 0;
    let classcount = 0;
    let inusecount = 0;
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let selected = null;
    let sortflags = 0;
    let sortedinvent = null;
    let srtinv = null;
    let prevorderclass = 0;
    let filter = null;
    let wizid = (game.flags.debug && game.iflags.override_ID);
    let gotsomething = (0);
    let clr = 8;
    let menu_behavior = 0;
    let show_gold = (1);
    let inuse_only = (0);
    let skipped_gold = (0);
    let doing_perm_invent = (0);
    let save_flags_sortpack = 0;
    let usextra = (xtra_choice && allowxtra);
    if (lets && !__nh_char_at0(lets)) {
        lets = null;
    }
    if (lets || usextra || wizid || want_reply || game.WIN_INVEN == (-1)) {
        /* simplify tests: (lets) instead of (lets && *lets) */
        /* passed to dump_putstr() which ignores it... */
        /* partial inventory in perm_invent setting; don't operate on
           full inventory window, use an alternate one instead; create
           the first time needed and keep it for re-use as needed later */
        if (game.cached_pickinv_win == (-1)) {
            game.cached_pickinv_win = (game.windowprocs.win_create_nhwindow)(4);
        }
        win = game.cached_pickinv_win;
        if (game.flags.sortloot == 105) {
            inuse_only = (1);
        }
    } else {
        win = game.WIN_INVEN;
        menu_behavior = 1;
        prepare_perminvent(win);
        show_gold = ((game.wri_info.fromcore.invmode & InvShowGold) != 0);
        inuse_only = ((game.wri_info.fromcore.invmode & InvInUse) != 0);
        doing_perm_invent = (1);
    }
    /*
     * Exit early if no inventory -- but keep going if we are doing
     * a permanent inventory update.  We need to keep going so the
     * permanent inventory window updates itself to remove the last
     * item(s) dropped.  One down side:  the addition of the exception
     * for permanent inventory window updates _can_ pop the window
     * up when it's not displayed -- even if it's empty -- because we
     * don't know at this level if its up or not.  This may not be
     * an issue if empty checks are done before hand and the call
     * to here is short circuited away.
     *
     * 2: our count here is only to distinguish between 0 or 1 or
     * more than 1; for the last case, we don't need a precise number.
     * For perm_invent update we force 'more than 1'.
     */
    n = (doing_perm_invent && !lets && !want_reply) ? 2 : lets ? strlen(lets) : !game.invent ? 0 : !game.invent.nobj ? 1 : 2;
    /* for xtra_choice, there's another 'item' not included in initial 'n';
       for !lets (full invent or inuse_only) and for override_ID (wizard
       mode identify), skip message_menu handling of single item even if
       item count was 1 */
    if (usextra || (n == 1 && (!lets || wizid))) {
        ++n;
    }
    if (n == 0) {
        pline("%s.", __display_pickinv_not_carrying_anything);
        return 0;
    }
    /* oxymoron? temporarily assign permanent inventory letters */
    if (!game.flags.invlet_constant) {
        reassign();
    }
    if (n == 1 && !game.iflags.force_invmenu && !game.iflags.menu_requested) {
        /* when only one item of interest, use pline instead of menus;
           we actually use a fake message-line menu in order to allow
           the user to perform selection at the --More-- prompt for tty */
        ret = 0;
        if (usextra) {
            /* xtra_choice is "bare hands" (wield), "fingertip" (Engrave),
               "nothing" (prepare Quiver), "fingers" (apply grease), or
               "hands" (default) */
            ret = (game.windowprocs.win_message_menu)(45, 1, xprname(null, xtra_choice, 45, (1), 0, 0));
        } else {
            for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                if (!lets || otmp.invlet == __nh_char_at0(lets)) {
                    break;
                }
            }
            if (otmp) {
                ret = (game.windowprocs.win_message_menu)(otmp.invlet, want_reply ? 1 : 0, xprname(otmp, null, __nh_char_at0(lets), (1), 0, 0));
            }
        }
        if (out_cnt) {
            out_cnt.value = -1;
        }
        return ret;
    }
    sortflags = (game.flags.sortloot == 102) ? 4 : 2;
    if (game.flags.sortpack) {
        sortflags |= 1;
    }
    save_flags_sortpack = game.flags.sortpack;
    if (inuse_only) {
        game.flags.sortpack = (0);
        sortflags = 8;
        filter = is_inuse;
        if (!game.uwep) {
            /*
             * inuse_only and not wielding anything: insert "bare hands"
             * into primary weapon slot.  Unlike adding an extra menu
             * entry for 'xtra_choice' at top of menu, we need an object
             * in invent for it to be sorted into desired position.
             * It will need custom formatting below.
             */
            /* STRANGE_OBJECT, ILLOBJ_CLASS */
            Object.assign(inuse_fakeobj, cg.zeroobj);
            inuse_fakeobj.invlet = 45;
            /* inuse_classify needs this */
            inuse_fakeobj.owornmask = 256;
            /* is_inuse filter needs this */
            inuse_fakeobj.where = 3;
            inuse_fakeobj.nobj = game.invent;
            game.invent = inuse_fakeobj;
        }
    }
    sortedinvent = sortloot(game.invent, sortflags, (0), filter);
    if (game.invent == inuse_fakeobj) {
        /* inuse_only: if we inserted bare hands as a fake weapon, remove them;
       although the fake object will no longer be in invent, sortedinvent
       will still contain a pointer to it */
        game.invent = inuse_fakeobj.nobj;
        inuse_fakeobj.nobj = null;
        /* if inuse_fakeobj is the only thing present in sortedinvent, get
           rid of it in order to produce "not using any items" */
        if (sortedinvent[0].obj == inuse_fakeobj && !sortedinvent[1].obj) {
            sortedinvent[0].obj = null;
        }
    }
    (game.windowprocs.win_start_menu)(win, menu_behavior);
    Object.assign(any, cg.zeroany);
    if (wizid) {
        let unid_cnt = 0;
        let prompt = '';
        unid_cnt = count_unidentified(game.invent);
        prompt = sprintf(prompt, "Debug Identify");
        /* 'title' rather than 'prompt' */
        if (unid_cnt) {
            prompt = __nh_buf_append(prompt, sprintf('', " -- unidentified or partially identified item%s", (((unid_cnt) == 1) ? "" : "s")));
        }
        add_menu_str(win, prompt);
        if (!unid_cnt) {
            add_menu_str(win, "(all items are permanently identified already)");
            gotsomething = (1);
        } else {
            any.a_obj = wizid_fakeobj;
            prompt = sprintf(prompt, "select %s to permanently identify", (unid_cnt == 1) ? "it" : "any or all of them");
            /* wiz_identify stuffed the wiz_identify command character (^I)
               into iflags.override_ID for our use as an accelerator;
               it could be ambiguous if player has assigned a letter to
               the #wizidentify command, so include it as a group accelerator
               but use '_' as the primary selector */
            if (unid_cnt > 1) {
                prompt = __nh_buf_append(prompt, sprintf('', " (%s for all)", visctrl(game.iflags.override_ID)));
            }
            add_menu(win, nul_glyphinfo, any, 95, game.iflags.override_ID, 0, clr, prompt, 2);
            gotsomething = (1);
        }
    } else if (usextra) {
        /* wizard override ID and xtra_choice are mutually exclusive */
        if (game.flags.sortpack) {
            add_menu_heading(win, "Miscellaneous");
        }
        any.a_char = 45;
        add_menu(win, nul_glyphinfo, any, 45, 0, 0, clr, xtra_choice, 0);
        gotsomething = (1);
    }
    let __venom_done = false;
    nextclass: while (true) {
        classcount = 0;
        prevorderclass = 0;
        for (let __nhi_srtinv = 0; (srtinv = sortedinvent[__nhi_srtinv]) && ((otmp = srtinv.obj) != null); __nhi_srtinv++) {
            let tmpglyph = 0;
            let tmpglyphinfo = nul_glyphinfo;
            /* for showing a set of specific letters, skip ones not in the set */
            if (lets && !strchr(lets, otmp.invlet)) {
                continue;
            }
            if (!game.flags.sortpack || otmp.oclass == __nh_char_at0(invlet)) {
                if (wizid && !not_fully_identified(otmp)) {
                    continue;
                }
                if (inuse_only) {
                    /* for inuse-only, start with an extra header */
                    if (!inusecount++) {
                        add_menu_heading(win, doing_perm_invent ? "In use" : "Inventory in use");
                    }
                } else if (doing_perm_invent && !show_gold) {
                    if (otmp.invlet == GOLD_SYM && !otmp.owornmask) {
                        /* don't skip gold if it is quivered, even for !show_gold */
                        skipped_gold = (1);
                        continue;
                    }
                }
                if (inuse_only ? (srtinv.orderclass != prevorderclass) : (game.flags.sortpack && !classcount)) {
                    /* maybe insert a class header */
                    let withsym = (want_reply && game.iflags.menu_head_objsym);
                    let class_header = inuse_only ? inuse_headers[srtinv.orderclass] : let_to_name(__nh_char_at0(invlet), (0), withsym);
                    add_menu_heading(win, class_header);
                    classcount++;
                    prevorderclass = srtinv.orderclass;
                }
                ilet = otmp.invlet;
                Object.assign(any, cg.zeroany);
                if (wizid) {
                    any.a_obj = otmp;
                } else {
                    any.a_char = ilet;
                }
                if (otmp == inuse_fakeobj) {
                    /* fake item to format as "bare|gloved hands" */
                    let barehands = '';
                    /* like doname() below, makeplural() returns an obuf[] */
                    formattedobj = makeplural(body_part(HAND));
                    barehands = sprintf(barehands, "%s %s (no weapon)", game.uarmg ? "gloved" : "bare", formattedobj);
                    add_menu(win, nul_glyphinfo, any, ilet, 0, 0, clr, barehands, 0);
                } else {
                    tmpglyph = (((otmp).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((otmp).corpsenm + ((((otmp).spe & 3) == 1) ? (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((otmp).otyp == CORPSE) ? (((otmp).corpsenm + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(otmp).dknown && ((otmp).oclass == POTION_CLASS || ((otmp).otyp >= FIRST_REAL_GEM && ((otmp).otyp <= LAST_GLASS_GEM)) || ((otmp).otyp >= FIRST_SPELL && ((otmp).otyp <= LAST_SPELL)))) ? (((otmp).oclass + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((otmp).otyp + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))));
                    map_glyphinfo(0, 0, tmpglyph, 0, tmpglyphinfo);
                    formattedobj = doname(otmp);
                    add_menu(win, tmpglyphinfo, any, ilet, wizid ? def_oc_syms[otmp.oclass].sym : 0, 0, clr, formattedobj, 0);
                }
                /* doname() uses a static pool of obuf[] output buffers and
               we don't want inventory display to overwrite all of them,
               so when we've used one we release it for re-use */
                maybereleaseobuf(formattedobj);
                gotsomething = (1);
            }
        }
        if (game.flags.sortpack) {
            if (__nh_char_at0((invlet = __nh_advance_str(invlet, 1)))) {
                continue nextclass;
            }
            if (!__venom_done) {
                __venom_done = true;
                invlet = venom_inv;
                continue nextclass;
            }
        }
        if (save_flags_sortpack != game.flags.sortpack) {
            game.flags.sortpack = save_flags_sortpack;
        }
        if (game.iflags.force_invmenu && want_reply) {
            /* default for force_invmenu is a menu listing likely candidates;
       add '*' for 'list all' as an extra choice unless the menu already
       includes everything; when reissuing the menu after player has
       picked '*', add '?' for 'list likely candidates' to reverse that */
            let menutext = null;
            Object.assign(any, cg.zeroany);
            if ((allowxtra && !usextra) || (lets && strlen(lets) < inv_cnt((1)))) {
                any.a_char = 42;
                menutext = "(list everything)";
            } else if (!lets) {
                any.a_char = 63;
                menutext = "(list likely candidates)";
            }
            if (menutext) {
                add_menu_heading(win, "Special");
                add_menu(win, nul_glyphinfo, any, any.a_char, 0, 0, clr, menutext, 0);
                gotsomething = (1);
            }
        }
        unsortloot({ get value() { return sortedinvent; }, set value(_v) { sortedinvent = _v; } });
        if (doing_perm_invent && !lets && !gotsomething) {
            /* for permanent inventory where nothing has been listed (because
       there isn't anything applicable to list; the n==0 case above
       gets skipped for perm_invent), put something into the menu */
            add_menu_str(win, inuse_only ? __display_pickinv_not_using_anything : (!show_gold && skipped_gold) ? __display_pickinv_only_carrying_gold : __display_pickinv_not_carrying_anything);
            want_reply = (0);
        }
        (game.windowprocs.win_end_menu)(win, (query && __nh_char_at0(query)) ? query : null);
        n = select_menu(win, wizid ? 2 : want_reply ? 1 : 0, selected);
        if (n > 0) {
            if (wizid) {
                let all_id = (0);
                let i = 0;
                /* identifying items will update perm_invent, calling this
               routine recursively, and we don't want the nested call
               to filter on unID'd items */
                game.iflags.override_ID = 0;
                ret = 0;
                for (i = 0; i < n; ++i) {
                    otmp = selected[i].item.a_obj;
                    if (otmp == wizid_fakeobj) {
                        identify_pack(0, (0));
                        /* identify_pack() performs update_inventory() */
                        all_id = (1);
                        break;
                    } else {
                        /* identify() does not perform update_inventory() */
                        if (not_fully_identified(otmp)) {
                            identify(otmp);
                        }
                    }
                }
                if (!all_id) {
                    update_inventory();
                }
            } else {
                ret = selected[0].item.a_char;
                if (out_cnt) {
                    out_cnt.value = selected[0].count;
                }
            }
            free(selected);
        } else {
            ret = !n ? 0 : 27;
        }
        return ret;
        break;
    }
}
/*
 * If lets == NULL or "", list all objects in the inventory.  Otherwise,
 * list all objects with object classes that match the order in lets.
 *
 * Returns the letter identifier of a selected item, or 0 if nothing
 * was selected.
 */
export function display_inventory(lets, want_reply) {
    let cmdq = cmdq_pop();
    if (cmdq) {
        if (cmdq.typ == CMDQ_KEY) {
            let otmp = null;
            for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                if (otmp.invlet == cmdq.key && (!lets || !__nh_char_at0(lets) || strchr(lets, def_oc_syms[otmp.oclass].sym))) {
                    free(cmdq);
                    return otmp.invlet;
                }
            }
        }
        free(cmdq);
        cmdq_clear(CQ_CANNED);
        return 0;
    }
    return display_pickinv(lets, null, null, (0), want_reply, null);
}
export function repopulate_perminvent() {
    display_pickinv(null, null, null, (0), (0), null);
}
/*
 * Show what is current using inventory letters.
 *
 */
export function display_used_invlets(avoidlet) {
    let otmp = null;
    let ilet = 0;
    let ret = 0;
    let invlet = game.flags.inv_order;
    let n = 0;
    let classcount = 0;
    let invdone = 0;
    let tmpglyph = 0;
    let tmpglyphinfo = nul_glyphinfo;
    let win = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let selected = null;
    let clr = 8;
    if (game.invent) {
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        while (!invdone) {
            Object.assign(any, cg.zeroany);
            classcount = 0;
            for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                ilet = otmp.invlet;
                if (ilet == avoidlet) {
                    continue;
                }
                if (!game.flags.sortpack || otmp.oclass == __nh_char_at0(invlet)) {
                    if (game.flags.sortpack && !classcount) {
                        Object.assign(any, cg.zeroany);
                        add_menu_heading(win, let_to_name(__nh_char_at0(invlet), (0), (0)));
                        classcount++;
                    }
                    any.a_char = ilet;
                    tmpglyph = (((otmp).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((otmp).corpsenm + ((((otmp).spe & 3) == 1) ? (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((otmp).otyp == CORPSE) ? (((otmp).corpsenm + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(otmp).dknown && ((otmp).oclass == POTION_CLASS || ((otmp).otyp >= FIRST_REAL_GEM && ((otmp).otyp <= LAST_GLASS_GEM)) || ((otmp).otyp >= FIRST_SPELL && ((otmp).otyp <= LAST_SPELL)))) ? (((otmp).oclass + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((otmp).otyp + (((otmp).where == 1 && ((game.otg_otmp = game.level.objects[(otmp).ox][(otmp).oy].v.v_nexthere) != null) && ((otmp).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))));
                    map_glyphinfo(0, 0, tmpglyph, 0, tmpglyphinfo);
                    add_menu(win, tmpglyphinfo, any, ilet, 0, 0, clr, doname(otmp), 0);
                }
            }
            if (game.flags.sortpack && __nh_char_at0((invlet = __nh_advance_str(invlet, 1)))) {
                continue;
            }
            invdone = 1;
        }
        (game.windowprocs.win_end_menu)(win, "Inventory letters used:");
        n = select_menu(win, 1, selected);
        if (n > 0) {
            ret = selected[0].item.a_char;
            free(selected);
        } else {
            ret = !n ? 0 : 27;
        }
        (game.windowprocs.win_destroy_nhwindow)(win);
    }
    return ret;
}
/*
 * Returns the number of unpaid items within the given list.  This includes
 * contained objects.
 */
export function count_unpaid(list) {
    let count = 0;
    while (list) {
        if (list.unpaid) {
            count++;
        }
        if (((list).cobj != null)) {
            count += count_unpaid(list.cobj);
        }
        list = list.nobj;
    }
    return count;
}
/*
 * Returns the number of items with b/u/c/unknown within the given list.
 * This does NOT include contained objects.
 *
 * Assumes that the hero sees or touches or otherwise senses the objects
 * at some point:  bknown is forced for priest[ess], like in xname().
 */
export function count_buc(list, type, filterfunc) {
    let count = 0;
    for (; list; list = list.nobj) {
        /* priests always know bless/curse state */
        if ((game.urole.mnum == (PM_CLERIC))) {
            list.bknown = (list.oclass != COIN_CLASS);
        }
        /* some actions exclude some or most items */
        if (filterfunc && !(filterfunc)(list)) {
            continue;
        }
        if (list.oclass == COIN_CLASS) {
            /* coins are either uncursed or unknown based upon option setting */
            if (type == (game.flags.goldX ? 2048 : 1024)) {
                ++count;
            }
            continue;
        }
        /* check whether this object matches the requested type */
        if (!list.bknown ? (type == 2048) : list.blessed ? (type == 256) : list.cursed ? (type == 512) : (type == 1024)) {
            ++count;
        }
    }
    return count;
}
/* similar to count_buc(), but tallies all states at once
   rather than looking for a specific type */
export function tally_BUCX(list, by_nexthere, bcp, ucp, ccp, xcp, ocp, jcp) {
    /* Future extensions:
     *  Skip current_container when list is invent, uchain when
     *  first object of list is located on the floor.  'ocp' will then
     *  have a function again (it was a counter for having skipped gold,
     *  but that's not skipped anymore).
     */
    bcp.value = ucp.value = ccp.value = xcp.value = ocp.value = jcp.value = 0;
    for (; list; list = (by_nexthere ? list.v.v_nexthere : list.nobj)) {
        if ((game.urole.mnum == (PM_CLERIC))) {
            list.bknown = (list.oclass != COIN_CLASS);
        }
        if (list.pickup_prev) {
            ++(jcp.value);
        }
        if (list.oclass == COIN_CLASS) {
            if (game.flags.goldX) {
                ++(xcp.value);
            } else {
                ++(ucp.value);
            }
            continue;
        }
        if (!list.bknown) {
            ++(xcp.value);
        } else if (list.blessed) {
            ++(bcp.value);
        } else if (list.cursed) {
            ++(ccp.value);
        /* neither blessed nor cursed => uncursed */
        } else {
            ++(ucp.value);
        }
    }
}
/* count everything inside a container, or just shop-owned items inside */
/* include contents of any nested containers */
/* count all vs count separate stacks        */
/* all objects vs only unpaid objects        */
/* on floor, but hero-owned items haven't
                         * been marked no_charge yet and shop-owned
                         * items are still marked unpaid -- used
                         * when asking the player whether to sell    */
export function count_contents(container, nested, quantity, everything, newdrop) {
    let otmp = null;
    let topc = null;
    let shoppy = (0);
    let count = 0;
    if (!everything && !newdrop) {
        let x = 0;
        let y = 0;
        for (topc = container; topc.where == 2; topc = topc.v.v_ocontainer) {
            continue;
        }
        if (topc.where == 1 && get_obj_location(topc, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0)) {
            shoppy = costly_spot(x, y);
        }
    }
    for (otmp = container.cobj; otmp; otmp = otmp.nobj) {
        if (nested && ((otmp).cobj != null)) {
            count += count_contents(otmp, nested, quantity, everything, newdrop);
        }
        if (everything || otmp.unpaid || (shoppy && !otmp.no_charge)) {
            count += quantity ? otmp.quan : 1;
        }
    }
    return count;
}
/* unpaid items in inventory */
/* unpaid items on floor (rare) */
/* unpaid items under the floor (extremely rare) */
export function dounpaid(count, floorcount, buriedcount) {
    let win = 0;
    let otmp = null;
    let marker = null;
    let contnr = null;
    let ilet = 0;
    let invlet = game.flags.inv_order;
    let classcount = 0;
    let num_so_far = 0;
    let xtracount = 0;
    let cost = 0;
    let totcost = 0;
    otmp = marker = contnr = null;
    xtracount = floorcount + buriedcount;
    if (count == 1 && !xtracount) {
        otmp = find_unpaid(game.invent, { get value() { return marker; }, set value(_v) { marker = _v; } });
        contnr = unknwn_contnr_contents(otmp);
    }
    if (otmp && !contnr) {
        /* 1 item; use pline instead of popup menu */
        cost = unpaid_cost(otmp, COST_NOCONTENTS);
        /* suppress "(unpaid)" suffix */
        /* in case inside a shop, don't append "for sale" prices */
        game.iflags.suppress_price++;
        pline("%s", xprname(otmp, distant_name(otmp, doname), ((otmp).where == 3) ? otmp.invlet : 62, (1), cost, 0));
        game.iflags.suppress_price--;
        return;
    }
    win = (game.windowprocs.win_create_nhwindow)(4);
    totcost = 0;
    /* count of # printed so far */
    num_so_far = 0;
    if (!game.flags.invlet_constant) {
        reassign();
    }
    do {
        classcount = 0;
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            ilet = otmp.invlet;
            if (otmp.unpaid) {
                if (!game.flags.sortpack || otmp.oclass == __nh_char_at0(invlet)) {
                    if (game.flags.sortpack && !classcount) {
                        (game.windowprocs.win_putstr)(win, 0, let_to_name(__nh_char_at0(invlet), (1), (0)));
                        classcount++;
                    }
                    totcost += cost = unpaid_cost(otmp, COST_NOCONTENTS);
                    game.iflags.suppress_price++;
                    (game.windowprocs.win_putstr)(win, 0, xprname(otmp, distant_name(otmp, doname), ilet, (1), cost, 0));
                    game.iflags.suppress_price--;
                    num_so_far++;
                }
            }
        }
    } while (game.flags.sortpack && (__nh_char_at0((invlet = __nh_advance_str(invlet, 1)))));
    if (count > num_so_far) {
        /* something unpaid is contained */
        if (game.flags.sortpack) {
            (game.windowprocs.win_putstr)(win, 0, let_to_name(62, (1), (0)));
        }
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if (((otmp).cobj != null)) {
                /*
         * Search through the container objects in the inventory for
         * unpaid items.  The top level inventory items have already
         * been listed.
         */
                let contcost = 0;
                marker = null;
                while (find_unpaid(otmp.cobj, { get value() { return marker; }, set value(_v) { marker = _v; } })) {
                    totcost += cost = unpaid_cost(marker, COST_NOCONTENTS);
                    contcost += cost;
                    if (otmp.cknown) {
                        game.iflags.suppress_price++;
                        (game.windowprocs.win_putstr)(win, 0, xprname(marker, distant_name(marker, doname), 62, (1), cost, 0));
                        game.iflags.suppress_price--;
                    }
                }
                if (!otmp.cknown) {
                    let contbuf = '';
                    contbuf = sprintf(contbuf, "%s contents", s_suffix(xname(otmp)));
                    (game.windowprocs.win_putstr)(win, 0, xprname(null, contbuf, 62, (1), contcost, 0));
                }
            }
        }
    }
    if (count > 0) {
        (game.windowprocs.win_putstr)(win, 0, "");
        (game.windowprocs.win_putstr)(win, 0, xprname(null, "Total:", 42, (0), totcost, 0));
    }
    if (xtracount > 0) {
        /* Shopkeeper knows what to charge for contents */
        /* an unpaid item can be on the floor if dropped on the shop boundary
       (then possibly moved all the way into the shop during wall repair);
       one can be buried if it started that way and a pit was dug at its
       spot then filled by a boulder (or perhaps a theme room with a pool
       and an unpaid item moved into that by wall repair, then freezing) */
        /* floorcount + buriedcount > 0 */
        let buf = '';
        let floorverb = (xtracount > 1) ? "are" : "is";
        let where = (buriedcount == 0) ? "on the floor" : (floorcount == 0) ? "under the floor" : "on or under the floor";
        if (!count) {
            /* "under the floor" might actually be "under the floor
               beneath a wall" when shop repair is involved but that seems
               too nit-picky to bother trying to handle here (even more
               extreme description-wise:  "under the floor beneath the
               door/doorway") */
            You("aren't carrying any unpaid items but there %s %d %s.", floorverb, xtracount, where);
        } else {
            (game.windowprocs.win_putstr)(win, 0, "");
            buf = sprintf(buf, "(There %s %d more unpaid object%s %s.)", floorverb, xtracount, (((xtracount) == 1) ? "" : "s"), where);
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
    }
    if (count > 0) {
        (game.windowprocs.win_display_nhwindow)(win, (0));
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
    return;
}
export function this_type_only(obj) {
    let res = (obj.oclass == game.this_type);
    if (game.this_type == 80) {
        res = obj.pickup_prev;
    } else if (obj.oclass == COIN_CLASS) {
        /* if filtering by bless/curse state, gold is classified as
           either unknown or uncursed based on user option setting */
        if (game.this_type && strchr("BUCX", game.this_type)) {
            res = (game.this_type == (game.flags.goldX ? 88 : 85));
        }
    } else {
        switch (game.this_type) {
            /* this used to be done for the 'if traditional' case but not for the
       menu case; also unlike '$', 'I$' explicitly asks about inventory,
       so we no longer handle coin class differently from other classes */
            /* these are used for traditional when not applicable and also for
       constructing a title to be used by query_objlist() */
            case 66:
                res = (obj.bknown && obj.blessed);
                break;
            case 85:
                res = (obj.bknown && !(obj.blessed || obj.cursed));
                break;
            case 67:
                res = (obj.bknown && obj.cursed);
                break;
            case 88:
                res = !obj.bknown;
                break;
            default:
                break;
        }
    }
    return res;
}
/* the #inventtype command */
const __dotypeinv_prompt = "What type of object do you want an inventory of?";
export function dotypeinv() {
    let c = 0;
    let n = 0;
    let i = 0;
    let extra_types = null;
    let types = '';
    let title = '';
    let before = null;
    let after = null;
    let class_count = 0;
    let oclass = 0;
    let itemcount = 0;
    let any_unpaid = 0;
    let u_carried = 0;
    let u_floor = 0;
    let u_buried = 0;
    let bcnt = 0;
    let ccnt = 0;
    let ucnt = 0;
    let xcnt = 0;
    let ocnt = 0;
    let jcnt = 0;
    let billx = 0;
    let pick_list = null;
    let traditional = 0;
    doI_done: {
        c = 0;
        i = 0;
        before = "";
        after = "";
        billx = game.u.ushops && doinvbill(0);
        traditional = (1);
        game.this_type = 0;
        game.this_title = null;
        if (!game.invent && !billx) {
            You("aren't carrying anything.");
            break doI_done;
        }
        title = '';
        u_carried = count_unpaid(game.invent);
        u_floor = count_unpaid(game.level.objlist);
        u_buried = count_unpaid(game.level.buriedobjlist);
        any_unpaid = u_carried + u_floor + u_buried;
        tally_BUCX(game.invent, (0), { get value() { return bcnt; }, set value(_v) { bcnt = _v; } }, { get value() { return ucnt; }, set value(_v) { ucnt = _v; } }, { get value() { return ccnt; }, set value(_v) { ccnt = _v; } }, { get value() { return xcnt; }, set value(_v) { xcnt = _v; } }, { get value() { return ocnt; }, set value(_v) { ocnt = _v; } }, { get value() { return jcnt; }, set value(_v) { jcnt = _v; } });
        if (game.flags.menu_style != 0) {
            if (game.flags.menu_style == 2 || game.flags.menu_style == 3) {
                traditional = (0);
                i = 4;
                if (billx) {
                    i |= 64;
                }
                if (bcnt) {
                    i |= 256;
                }
                if (ucnt) {
                    i |= 1024;
                }
                if (ccnt) {
                    i |= 512;
                }
                if (xcnt) {
                    i |= 2048;
                }
                if (jcnt) {
                    i |= 4096;
                }
                i |= 2;
                n = query_category(__dotypeinv_prompt, game.invent, i, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 1);
                if (!n) {
                    break doI_done;
                }
                game.this_type = c = pick_list[0].item.a_int;
                free(pick_list);
            }
        }
        if (traditional) {
            /* collect list of classes of objects carried, for use as a prompt */
            types = '';
            class_count = collect_obj_classes(types, game.invent, (0), null, { get value() { return itemcount; }, set value(_v) { itemcount = _v; } });
            if (any_unpaid || billx || (bcnt + ccnt + ucnt + xcnt) != 0 || jcnt) {
                types = __nh_char_write(types, class_count++, 32);
            }
            if (any_unpaid) {
                types = __nh_char_write(types, class_count++, 117);
            }
            if (billx) {
                types = __nh_char_write(types, class_count++, 120);
            }
            if (bcnt) {
                types = __nh_char_write(types, class_count++, 66);
            }
            if (ucnt) {
                types = __nh_char_write(types, class_count++, 85);
            }
            if (ccnt) {
                types = __nh_char_write(types, class_count++, 67);
            }
            if (xcnt) {
                types = __nh_char_write(types, class_count++, 88);
            }
            if (jcnt) {
                types = __nh_char_write(types, class_count++, 80);
            }
            types = __nh_char_write(types, class_count, 0);
            /* add everything not already included; user won't see these */
            extra_types = eos(types);
            types += String.fromCharCode(27);
            if (!any_unpaid) {
                types += String.fromCharCode(117);
            }
            if (!billx) {
                types += String.fromCharCode(120);
            }
            if (!bcnt) {
                types += String.fromCharCode(66);
            }
            if (!ucnt) {
                types += String.fromCharCode(85);
            }
            if (!ccnt) {
                types += String.fromCharCode(67);
            }
            if (!xcnt) {
                types += String.fromCharCode(88);
            }
            if (!jcnt) {
                types += String.fromCharCode(80);
            }
            for (i = 0; i < MAXOCLASSES; i++) {
                if (!strchr(types, def_oc_syms[i].sym)) {
                    types += String.fromCharCode(def_oc_syms[i].sym);
                }
            }
            if (class_count > 1) {
                c = yn_function(__dotypeinv_prompt, types, 0, (1));
                if (c == 0) {
                    (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
                    break doI_done;
                }
            } else {
                if (any_unpaid) {
                    c = 117;
                } else if (billx) {
                    c = 120;
                /* only one thing to itemize */
                } else {
                    c = __nh_char_at0(types);
                }
            }
        }
        if (c == 120 || (c == 88 && billx && !xcnt)) {
            if (billx) {
                doinvbill(1);
            } else {
                pline("No used-up objects%s.", any_unpaid ? " on your shopping bill" : "");
            }
            break doI_done;
        }
        if (c == 117 || (c == 85 && any_unpaid && !ucnt)) {
            if (any_unpaid) {
                dounpaid(u_carried, u_floor, u_buried);
            } else {
                You("are not carrying any unpaid objects.");
            }
            break doI_done;
        }
        if (strchr("BUCXP", c)) {
            oclass = c;
        /* not a class but understood by this_type_only() */
        } else {
            oclass = def_char_to_objclass(c);
        }
        switch (c) {
            case 66:
                before = "known to be blessed ";
                break;
            case 85:
                before = "known to be uncursed ";
                break;
            case 67:
                before = "known to be cursed ";
                break;
            case 88:
                after = " whose blessed/uncursed/cursed status is unknown";
                break;
            case 80:
                after = " that were just picked up";
                break;
            default:
                before = "such ";
                break;
        }
        if (traditional) {
            if (strchr(types, c) > strchr(types, 27)) {
                You("have no %sobjects%s.", before, after);
                break doI_done;
            }
            /* extra input for this_type_only() */
            game.this_type = oclass;
        }
        if (strchr("BUCXP", c)) {
            title = sprintf(title, "Items %s", (before && __nh_char_at0(before)) ? before : after);
            /* the before and after phrases for "you have no..." can both be
           treated as mutually-exclusive suffices when creating a title */
            /* get rid of trailing space from 'before' and double-space from
           'after's leading space */
            title = mungspaces(title);
            title = strcat(title, ":");
            /* after removing unwanted trailing space */
            game.this_title = title;
        }
        if (query_objlist(null, game.invent, ((game.flags.invlet_constant ? 8 : 0) | 16 | 2), { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 1, this_type_only) > 0) {
            let otmp = pick_list[0].item.a_obj;
            free(pick_list);
            itemactions(otmp);
        }
    }
    game.this_type = 0;
    game.this_title = null;
    return 0;
}
/* return a string describing the dungeon feature at <x,y> if there
   is one worth mentioning at that location; otherwise null */
let __dfeature_at_altbuf = '';
__nh_register_static(() => { __dfeature_at_altbuf = ''; });
export function dfeature_at(x, y, buf) {
    let lev = game.level.locations[x][y];
    let ltyp = lev.typ;
    let cmap = -1;
    let dfeature = null;
    let stway = stairway_at(x, y);
    if (((ltyp) == DOOR)) {
        switch (lev.flags) {
            case 0:
                cmap = S_ndoor;
                break;
            case 2:
                cmap = S_vodoor;
                break;
            case 1:
                dfeature = "broken door";
                break;
            default:
                cmap = S_vcdoor;
                break;
        }
        /* override door description for open drawbridge */
        if (is_drawbridge_wall(x, y) >= 0) {
            dfeature = "open drawbridge portcullis" , cmap = -1;
        }
    } else if (((ltyp) == FOUNTAIN)) {
        cmap = S_fountain;
    } else if (((ltyp) == THRONE)) {
        cmap = S_throne;
    } else if (is_lava(x, y)) {
        cmap = S_lava;
    } else if (is_ice(x, y)) {
        dfeature = ice_descr(x, y, __dfeature_at_altbuf) , cmap = -1;
    } else if (is_pool(x, y)) {
        dfeature = "pool of water";
    } else if (((ltyp) == SINK)) {
        cmap = S_sink;
    } else if (((ltyp) == ALTAR)) {
        __dfeature_at_altbuf = sprintf(__dfeature_at_altbuf, "%saltar to %s (%s)", (lev.flags & 16) ? "high " : "", a_gname(), align_str((((((lev.flags & ~8) & 7) == 0) ? (-128) : (((lev.flags & ~8) & 7) == 4) ? 1 : (((lev.flags & ~8) & 7)) - 2))));
        dfeature = __dfeature_at_altbuf;
    } else if (stway) {
        dfeature = stairs_description(stway, __dfeature_at_altbuf, (1));
    } else if (ltyp == DRAWBRIDGE_DOWN) {
        cmap = S_vodbridge;
    } else if (ltyp == DBWALL) {
        cmap = S_vcdbridge;
    } else if (((ltyp) == GRAVE)) {
        cmap = S_grave;
    } else if (ltyp == TREE) {
        cmap = S_tree;
    } else if (ltyp == IRONBARS) {
        dfeature = "set of iron bars";
    }
    if (cmap >= 0) {
        dfeature = defsyms[cmap].explanation;
    }
    if (dfeature) {
        buf = strcpy(buf, dfeature);
    }
    return dfeature;
}
/* look at what is here; if there are many objects (pile_limit or more),
   don't show them unless obj_cnt is 0 */
/* obj_cnt > 0 implies that autopickup is in progress */
export function look_here(obj_cnt, lookhere_flags) {
    let otmp = null;
    let trap = null;
    let verb = ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see";
    let dfeature = null;
    let fbuf = '';
    let fbuf2 = '';
    let tmpwin = 0;
    let skip_objects = 0;
    let felt_cockatrice = (0);
    let picked_some = (lookhere_flags & 1) != 0;
    let skip_dfeature = (lookhere_flags & 2) != 0;
    /* default pile_limit is 5; a value of 0 means "never skip"
       (and 1 effectively forces "always skip") */
    skip_objects = (game.flags.pile_limit > 0 && obj_cnt >= game.flags.pile_limit);
    if (game.u.uswallow) {
        /* skip 'dfeature' if caller used describe_decor() to show it */
        let mtmp = game.u.ustuck;
        fbuf = sprintf(fbuf, "Contents of %s %s", s_suffix(mon_nam(mtmp)), mbodypart(mtmp, STOMACH));
        /* Skip "Contents of " by using fbuf index 12 */
        You("%s to %s what is lying in %s.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "try" : "look around", verb, __nh_char_at0(__nh_advance_str(fbuf, 12)));
        otmp = mtmp.minvent;
        if (otmp) {
            for (; otmp; otmp = otmp.nobj) {
                /*
         * FIXME?
         *  Engulfer's inventory can include worn items (specific case is
         *  Juiblex being created with an amulet as random defensive item)
         *  which will be flagged as "(being worn)".  This code includes
         *  such a worn item under the header "Contents of <mon>'s stomach",
         *  a nifty trick for how/where to wear stuff.  The situation is
         *  rare enough to turn a blind eye.
         *
         *  3.6.3:  Pickup has been changed to decline to pick up a worn
         *  item from inside an engulfer, but if player tries, it just
         *  says "you can't" without giving a reason why (which would be
         *  something along the lines of "because it's worn on the outside
         *  so is unreachable from in here...").
         */
                /* If swallower is an animal, it should have become stone
                 * but... */
                if (otmp.otyp == CORPSE) {
                    feel_cockatrice(otmp, (0));
                }
            }
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                fbuf = strcpy(fbuf, "You feel");
            }
            fbuf = strcat(fbuf, ":");
            display_minventory(mtmp, 8 | 0, fbuf);
        } else {
            You("%s no objects here.", verb);
        }
        return (!!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? 1 : 0);
    }
    if (!skip_objects) {
        let reg = null;
        let regbuf = '';
        regbuf = '';
        if ((reg = visible_region_at(game.u.ux, game.u.uy)) != null) {
            regbuf = sprintf(regbuf, "a %s cloud", reg_damg(reg) ? "poison gas" : "vapor");
        }
        if ((trap = t_at(game.u.ux, game.u.uy)) != null && !trap.tseen) {
            trap = (null);
        }
        if (reg || trap) {
            There("is %s%s%s here.", reg ? regbuf : "", (reg && trap) ? " and " : "", trap ? an(trapname(trap.ttyp, (0))) : "");
        }
    }
    otmp = game.level.objects[game.u.ux][game.u.uy];
    dfeature = dfeature_at(game.u.ux, game.u.uy, fbuf2);
    if (dfeature && !strcmp(dfeature, "pool of water") && (game.u.uinwater)) {
        dfeature = null;
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        let drift = (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))));
        if (dfeature && !strncmp(dfeature, "altar ", 6)) {
            /* don't say "altar" twice, dfeature has more info */
            You("try to feel what is here.");
        } else if (((game.level.locations[game.u.ux][game.u.uy].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[game.u.ux][game.u.uy].flags) : game.level.locations[game.u.ux][game.u.uy].typ) == ICE) {
            /* using describe_decor() to handle ice is simpler than
               replicating it in the conditional message construction */
            if (!game.flags.mention_decor || game.iflags.prev_decor == ICE) {
                force_decor((0));
            }
            /* plain "ice" if blind and levitating, otherwise "solid ice" &c;
              "There is [thin ]ice here.  You try to feel what is on it." */
            You("try to feel what is on it.");
            skip_dfeature = (1);
        } else {
            let cant_reach = !can_reach_floor((1));
            let surf = surface(game.u.ux, game.u.uy);
            let where = cant_reach ? "lying beneath you" : "lying here on the ";
            let onwhat = cant_reach ? "" : surf;
            You("try to feel what is %s%s.", drift ? "floating here" : where, drift ? "" : onwhat);
            /* terrain feature already identified */
            if (dfeature && !drift && !strcmp(dfeature, surf)) {
                skip_dfeature = (1);
            }
        }
        trap = t_at(game.u.ux, game.u.uy);
        if (!can_reach_floor(trap && ((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT))) {
            pline("But you can't reach it!");
            return 0;
        }
    }
    if (dfeature && !skip_dfeature) {
        let p = null;
        /* 0 => none, 1 => a/an, 2 => the (not used here) */
        let article = 1;
        /* "molten lava", "iron bars", and plain "ice" are handled as special
           cases in an() but probably shouldn't be; don't rely on that */
        if (!strcmp(dfeature, "molten lava") || !strcmp(dfeature, "iron bars") || !strcmp(dfeature, "ice") || !strncmp(dfeature, "frozen ", 7) || ((p = strchr(dfeature, 32)) != null && !strncmpi((p), (" ice"), -1))) {
            article = 0;
        }
        if (article == 1) {
            dfeature = an(dfeature);
        }
        /* hardcoded "is" worked here because "iron bars" is actually
           "set of iron bars"; use vtense() instead of relying on that */
        fbuf = sprintf(fbuf, "There %s %s here.", vtense(dfeature, "are"), dfeature);
    }
    if (!otmp || is_lava(game.u.ux, game.u.uy) || (is_pool(game.u.ux, game.u.uy) && !(game.u.uinwater))) {
        /* thawing ice ("solid ice", "thin ice", &c) */
        /* we know there is something here */
        if (dfeature && !skip_dfeature) {
            pline("%s", fbuf);
        }
        read_engr_at(game.u.ux, game.u.uy);
        if (!skip_objects && (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || !dfeature)) {
            You("%s no objects here.", verb);
        }
        return (!!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? 1 : 0);
    }
    if (skip_objects) {
        if (dfeature && !skip_dfeature) {
            pline("%s", fbuf);
        }
        read_engr_at(game.u.ux, game.u.uy);
        if (obj_cnt == 1 && otmp.quan == 1) {
            There("is %s object here.", picked_some ? "another" : "an");
        } else {
            There("are %s%s objects here.", (obj_cnt == 2) ? "two" : (obj_cnt < 5) ? "a few" : (obj_cnt < 10) ? "several" : "many", picked_some ? " more" : "");
        }
        for (; otmp; otmp = otmp.v.v_nexthere) {
            if (otmp.otyp == CORPSE && will_feel_cockatrice(otmp, (0))) {
                pline("%s %s%s.", (obj_cnt > 1) ? "Including" : (otmp.quan > 1) ? "They're" : "It's", corpse_xname(otmp, null, 8), poly_when_stoned(game.youmonst.data) ? "" : ", unfortunately");
                feel_cockatrice(otmp, (0));
                break;
            }
        }
    } else if (!otmp.v.v_nexthere) {
        if (dfeature && !skip_dfeature) {
            pline("%s", fbuf);
        }
        read_engr_at(game.u.ux, game.u.uy);
        You("%s here %s.", verb, doname_with_price(otmp));
        game.iflags.last_msg = PLNMSG_ONE_ITEM_HERE;
        if (otmp.otyp == CORPSE) {
            feel_cockatrice(otmp, (0));
        }
    } else {
        let buf = '';
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        if (dfeature && !skip_dfeature) {
            (game.windowprocs.win_putstr)(tmpwin, 0, fbuf);
            (game.windowprocs.win_putstr)(tmpwin, 0, "");
        }
        buf = sprintf(buf, "%s that %s here:", picked_some ? "Other things" : "Things", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "you feel" : "are");
        (game.windowprocs.win_putstr)(tmpwin, 0, buf);
        for (; otmp; otmp = otmp.v.v_nexthere) {
            if (otmp.otyp == CORPSE && will_feel_cockatrice(otmp, (0))) {
                felt_cockatrice = (1);
                buf = sprintf(buf, "%s...", doname(otmp));
                (game.windowprocs.win_putstr)(tmpwin, 0, buf);
                break;
            }
            (game.windowprocs.win_putstr)(tmpwin, 0, doname_with_price(otmp));
        }
        (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        if (felt_cockatrice) {
            feel_cockatrice(otmp, (0));
        }
        read_engr_at(game.u.ux, game.u.uy);
    }
    return (!!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? 1 : 0);
}
/* #look command - explicitly look at what is here, including all objects */
export function dolook() {
    let res = 0;
    /* don't let
       MSGTYPE={norep,noshow} "You see here"
       interfere with feedback from the look-here command */
    hide_unhide_msgtypes((1), ((1 << 1) | (1 << 2)));
    res = look_here(0, 0);
    /* restore normal msgtype handling */
    hide_unhide_msgtypes((0), ((1 << 1) | (1 << 2)));
    return res;
}
export function will_feel_cockatrice(otmp, force_touch) {
    if ((((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || force_touch) && !game.uarmg && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && (otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]))) {
        return (1);
    }
    return (0);
}
export function feel_cockatrice(otmp, force_touch) {
    let kbuf = '';
    if (will_feel_cockatrice(otmp, force_touch)) {
        kbuf = strcpy(kbuf, corpse_xname(otmp, null, 4));
        /* "the <cockatrice> corpse" */
        if (poly_when_stoned(game.youmonst.data)) {
            You("touched %s with your bare %s.", kbuf, makeplural(body_part(HAND)));
        } else {
            pline("Touching %s is a fatal mistake...", kbuf);
        }
        kbuf = sprintf(kbuf, "touching %s bare-handed", killer_xname(otmp));
        /* normalize body shape here; hand, not body_part(HAND) */
        /* will call polymon() for the poly_when_stoned() case */
        instapetrify(kbuf);
    }
}
/* 'obj' is being placed on the floor; if it can merge with something that
   is already there, combine them and discard obj as a separate object */
export function stackobj(obj) {
    let otmp = null;
    for (otmp = game.level.objects[obj.ox][obj.oy]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp != obj && merged({ get value() { return obj; }, set value(_v) { obj = _v; } }, otmp)) {
            break;
        }
    }
    return;
}
/* returns TRUE if obj & otmp can be merged; used in invent.c and mkobj.c */
/* potential 'into' stack */
/* 'combine' stack */
export function mergable(otmp, obj) {
    let objnamelth = 0;
    let otmpnamelth = 0;
    /* fail if already the same object, if different types, if either is
       explicitly marked to prevent merge, or if not mergable in general */
    if (obj == otmp || obj.otyp != otmp.otyp || obj.nomerge || otmp.nomerge || !game.objects[obj.otyp].oc_merge) {
        return (0);
    }
    /* coins of the same kind will always merge */
    if (obj.oclass == COIN_CLASS) {
        return (1);
    }
    if (obj.cursed != otmp.cursed || obj.blessed != otmp.blessed) {
        return (0);
    }
    if (obj.how_lost == 4 || otmp.how_lost == 4) {
        return (0);
    }
    if (otmp.how_lost != 0 && (obj.how_lost != otmp.how_lost)) {
        return (0);
    }
    /* don't require 'bypass' to match; that results in items dropped
         * via 'D' not stacking with compatible items already on the floor;
         * caller who wants that behavior should use 'nomerge' instead */
    if (obj.globby) {
        return (1);
    }
    /* Checks beyond this point either aren't applicable to globs
     * or don't inhibit their merger.
     */
    if (obj.unpaid != otmp.unpaid || obj.spe != otmp.spe || obj.no_charge != otmp.no_charge || obj.obroken != otmp.obroken || obj.otrapped != otmp.otrapped || obj.lamplit != otmp.lamplit) {
        return (0);
    }
    if (obj.oclass == FOOD_CLASS && (obj.oeaten != otmp.oeaten || obj.oeroded != otmp.oeroded)) {
        return (0);
    }
    if (obj.dknown != otmp.dknown || (obj.bknown != otmp.bknown && !(game.urole.mnum == (PM_CLERIC)) && (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) || obj.oeroded != otmp.oeroded || obj.oeroded2 != otmp.oeroded2 || obj.greased != otmp.greased) {
        return (0);
    }
    if ((erosion_matters(obj)) && (obj.oerodeproof != otmp.oerodeproof || (obj.rknown != otmp.rknown && (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))))) {
        return (0);
    }
    if (obj.otyp == CORPSE || obj.otyp == EGG || obj.otyp == TIN) {
        if (obj.corpsenm != otmp.corpsenm) {
            return (0);
        }
    }
    /* hatching eggs don't merge; ditto for revivable corpses */
    if ((obj.otyp == EGG && (obj.timed || otmp.timed)) || (obj.otyp == CORPSE && otmp.corpsenm >= LOW_PM && (((game.mons[otmp.corpsenm]) == game.mons[PM_DEATH] || (game.mons[otmp.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[otmp.corpsenm]) == game.mons[PM_PESTILENCE]) || (game.mons[otmp.corpsenm]).mlet == S_TROLL))) {
        return (0);
    }
    /* allow candle merging only if their ages are close */
    /* see begin_burn() for a reference for the magic "25" */
    if ((obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE) && Math.trunc(obj.age / 25) != Math.trunc(otmp.age / 25)) {
        return (0);
    }
    /* burning potions of oil never merge */
    if (obj.otyp == POT_OIL && obj.lamplit) {
        return (0);
    }
    /* don't merge surcharged item with base-cost item */
    if (obj.unpaid && !same_price(obj, otmp)) {
        return (0);
    }
    /* some additional information is always incompatible */
    if (((obj).oextra && ((obj).oextra.omonst)) || ((obj).oextra && ((obj).oextra.omid)) || ((otmp).oextra && ((otmp).oextra.omonst)) || ((otmp).oextra && ((otmp).oextra.omid))) {
        return (0);
    }
    /* if they have names, make sure they're the same */
    objnamelth = strlen(safe_oname(obj));
    otmpnamelth = strlen(safe_oname(otmp));
    if ((objnamelth != otmpnamelth && ((objnamelth && otmpnamelth) || obj.otyp == CORPSE)) || (objnamelth && otmpnamelth && ((obj).oextra && ((obj).oextra.oname)) && ((otmp).oextra && ((otmp).oextra.oname)) && strncmp(((obj).oextra.oname), ((otmp).oextra.oname), objnamelth))) {
        return (0);
    }
    /* verify pointers before deref for static analyzer */
    /* if one has an attached mail command, other must have same command */
    if (!((obj).oextra && ((obj).oextra.omailcmd)) ? ((otmp).oextra && ((otmp).oextra.omailcmd)) : (!((otmp).oextra && ((otmp).oextra.omailcmd)) || strcmp(((obj).oextra.omailcmd), ((otmp).oextra.omailcmd)) != 0)) {
        return (0);
    }
    if (obj.otyp == SCR_MAIL && obj.spe > 0 && (obj.o_id % 2) != (otmp.o_id % 2)) {
        return (0);
    }
    /* wished or bones mail and hand written stamped scrolls
           each have two flavors; spe keeps them separate from each
           other but we want to keep their flavors separate too */
    /* should be moot since matching artifacts wouldn't be unique */
    if (obj.oartifact != otmp.oartifact) {
        return (0);
    }
    if (obj.known != otmp.known && (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) {
        return (0);
    }
    return (1);
}
/* the #showgold command */
export function doprgold() {
    /* Command takes containers into account. */
    let umoney = money_cnt(game.invent);
    /* Only list the money you know about.  Guards and shopkeepers
       can somehow tell if there is any gold anywhere on your
       person, but you have no such preternatural gold-sense. */
    let hmoney = hidden_gold((0));
    if (game.flags.verbose) {
        let buf = '';
        if (!umoney) {
            buf = strcpy(buf, "Your wallet is empty");
        } else {
            buf = sprintf(buf, "Your wallet contains %ld %s", umoney, currency(umoney));
        }
        if (hmoney) {
            buf = __nh_buf_append(buf, sprintf('', ", %s you have %ld %s stashed away in your pack", umoney ? "and" : "but", hmoney, umoney ? "more" : currency(hmoney)));
        }
        pline("%s.", buf);
    } else {
        let total = umoney + hmoney;
        if (total) {
            You("are carrying a total of %ld %s.", total, currency(total));
        } else {
            You("have no money.");
        }
    }
    shopper_financial_report();
    if (umoney && game.iflags.menu_requested) {
        let dollarsign = "$";
        /* mustn't use TRUE or gold wouldn't show up unless it was quivered */
        dispinv_with_action(dollarsign, (0), null);
    }
    return 0;
}
/* the #seeweapon command */
export function doprwep() {
    if (!game.uwep) {
        You("are %s.", empty_handed());
    } else if (!game.iflags.menu_requested) {
        prinv(null, game.uwep, 0);
        if (game.u.twoweap) {
            prinv(null, game.uswapwep, 0);
        }
    } else {
        /* 4: uwep, uswapwep, uquiver, terminator */
        /* 8: up to 7 pieces of armor plus terminator */
        /* 3: uright, uleft, terminator */
        let lets = '';
        let ct = 0;
        /* obj_to_let() will assign letters to all of invent if necessary
           (for '!fixinv') so doesn't need to be repeated once called here */
        lets = __nh_char_write(lets, ct++, obj_to_let(game.uwep));
        if (game.uswapwep) {
            lets = __nh_char_write(lets, ct++, game.uswapwep.invlet);
        }
        if (game.uquiver) {
            lets = __nh_char_write(lets, ct++, game.uquiver.invlet);
        }
        lets = __nh_char_write(lets, ct, 0);
        dispinv_with_action(lets, (1), null);
    }
    return 0;
}
/* caller is responsible for checking !wearing_armor() */
export function noarmor(report_uskin) {
    if (!game.uskin || !report_uskin) {
        You("are not wearing any armor.");
    } else {
        let p = null;
        let uskinname = null;
        let buf = '';
        uskinname = strcpy(buf, simpleonames(game.uskin));
        /* shorten "set of <color> dragon scales" to "<color> scales"
           and "<color> dragon scale mail" to "<color> scale mail" */
        if (!strncmpi(uskinname, "set of ", 7)) {
            uskinname = __nh_advance_str(uskinname, 7);
        }
        if (typeof uskinname === 'string') {
            const idx = uskinname.toLowerCase().indexOf(' dragon ');
            if (idx >= 0) {
                uskinname = uskinname.slice(0, idx) + uskinname.slice(idx + 7);
            }
        } else if ((p = strstri(uskinname, " dragon ")) != null) {
            while ((p = __nh_char_write(p, 1, __nh_char_at0(__nh_advance_str(p, 8)))) != 0) {
                (p = __nh_advance_str(p, 1));
            }
        }
        You("are not wearing armor but have %s embedded in your skin.", uskinname);
    }
}
/* the #seearmor command */
export function doprarm() {
    if (!wearing_armor()) {
        /*
     * Note:  players sometimes get here by pressing a function key which
     * transmits ''ESC [ <something>'' rather than by pressing '[';
     * there's nothing we can--or should-do about that here.
     */
        noarmor((1));
    } else {
        let lets = '';
        let ct = 0;
        /* obj_to_let() will assign letters to all of invent if necessary
           (for '!fixinv') so doesn't need to be repeated once called, but
           each armor slot doesn't know whether any that precede have made
           that call so just do it for each one; use SORTPACK_INUSE order */
        if (game.uarm) {
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uarm));
        }
        if (game.uarmc) {
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uarmc));
        }
        if (game.uarms) {
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uarms));
        }
        if (game.uarmh) {
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uarmh));
        }
        if (game.uarmg) {
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uarmg));
        }
        if (game.uarmf) {
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uarmf));
        }
        if (game.uarmu) {
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uarmu));
        }
        lets = __nh_char_write(lets, ct, 0);
        dispinv_with_action(lets, (1), null);
    }
    return 0;
}
/* the #seerings command */
export function doprring() {
    if (!game.uleft && !game.uright) {
        You("are not wearing any rings.");
    } else {
        let lets = '';
        let use_inuse_mode = (0);
        let ct = 0;
        if (game.uright) {
            /* if either ring is a meat ring, switch to use_inuse_mode in order
           to label it/them as "Rings" rather than "Comestibles" */
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uright));
            if (game.uright.oclass != RING_CLASS) {
                use_inuse_mode = (1);
            }
        }
        if (game.uleft) {
            lets = __nh_char_write(lets, ct++, obj_to_let(game.uleft));
            if (game.uleft.oclass != RING_CLASS) {
                use_inuse_mode = (1);
            }
        }
        lets = __nh_char_write(lets, ct, 0);
        /* also switch to use_inuse_mode if there are two rings or player
           used the 'm' prefix */
        if (ct > 1 || game.iflags.menu_requested) {
            use_inuse_mode = (1);
        }
        dispinv_with_action(lets, use_inuse_mode, (ct == 1) ? "Ring" : "Rings");
    }
    return 0;
}
/* the #seeamulet command */
export function dopramulet() {
    if (!game.uamul) {
        You("are not wearing an amulet.");
    } else {
        let lets = '';
        /* using display_inventory() instead of prinv() allows player
           to use 'm "' to force and menu and be able to choose amulet
           in order to perform a context-sensitive item action */
        lets = __nh_char_write(lets, 0, obj_to_let(game.uamul)) , lets = __nh_char_write(lets, 1, 0);
        dispinv_with_action(lets, (1), "Amulet");
    }
    return 0;
}
/* is 'obj' a tool that's in use?  can't simply check obj->owornmask */
export function tool_being_used(obj) {
    /*
     * [Should this also include lit potions of oil?  They're not tools
     *  but they are "in use" without being noticeable via obj->owornmask.]
     */
    if ((obj.owornmask & (524288 | 1048576)) != 0) {
        return (1);
    }
    if (obj.oclass != TOOL_CLASS) {
        return (0);
    }
    /* [don't actually need to check uwep here; caller catches it] */
    return (obj == game.uwep || obj.lamplit || (obj.otyp == LEASH && obj.corpsenm));
}
/* the #seetools command */
export function doprtool() {
    let otmp = null;
    let ct = 0;
    let lets = '';
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (tool_being_used(otmp)) {
            /* we could be carrying more than 52 items; theoretically they
               might all be lit candles so avoid potential lets[] overflow */
            if (ct >= 53 /* sizeof(char [53]) */ - 1) {
                break;
            }
            lets = __nh_char_write(lets, ct++, obj_to_let(otmp));
        }
    }
    lets = __nh_char_write(lets, ct, 0);
    if (!ct) {
        You("are not using any tools.");
    } else {
        dispinv_with_action(lets, (1), null);
    }
    return 0;
}
/* the #seeall command; combines the ')' + '[' + '=' + '"' + '(' commands;
   show inventory of all currently wielded, worn, or used objects */
export function doprinuse() {
    let otmp = null;
    let ct = 0;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (is_inuse(otmp)) {
            ++ct;
            break;
        }
    }
    if (!ct) {
        You("are not wearing or wielding anything.");
    } else {
        dispinv_with_action(null, (1), null);
    }
    return 0;
}
/*
 * uses up an object that's on the floor, charging for it as necessary
 */
export function useupf(obj, numused) {
    let otmp = null;
    let at_u = ((obj.ox) == game.u.ux && (obj.oy) == game.u.uy);
    if (obj.quan > numused) {
        otmp = splitobj(obj, numused);
    /* burn_floor_objects() keeps an object pointer that it tries to
     * useupf() multiple times, so obj must survive if plural */
    } else {
        otmp = obj;
    }
    if (!game.context.mon_moving && costly_spot(otmp.ox, otmp.oy)) {
        if (strchr(game.u.urooms, in_rooms(otmp.ox, otmp.oy, 0))) {
            addtobill(otmp, (0), (0), (0));
        } else {
            stolen_value(otmp, otmp.ox, otmp.oy, (0), (0));
        }
    }
    delobj(otmp);
    if (at_u && game.u.uundetected && (((game.youmonst.data).mflags1 & 128) != 0)) {
        hideunder(game.youmonst);
    }
}
/*
 * Conversion from a class to a string for printing.
 * This must match the object class order.
 */
const names = [null, "Illegal objects", "Weapons", "Armor", "Rings", "Amulets", "Tools", "Comestibles", "Potions", "Scrolls", "Spellbooks", "Wands", "Coins", "Gems/Stones", "Boulders/Statues", "Iron balls", "Chains", "Venoms"];
const oth_symbols = [62, 0];
const oth_names = ["Bagged/Boxed items"];
export function let_to_name(let_, unpaid, showsym) {
    let ocsymfmt = "  ('%c')";
    let invbuf_sympadding = 8;
    let class_name = null;
    let pos = null;
    let oclass = (let_ >= 1 && let_ < MAXOCLASSES) ? let_ : 0;
    let len = 0;
    if (oclass) {
        class_name = names[oclass];
    } else if ((pos = strchr(oth_symbols, let_)) != null) {
        class_name = oth_names[(oth_symbols.length - pos.length)];
    } else {
        class_name = names[ILLOBJ_CLASS];
    }
    len = Strlen_(class_name, "let_to_name", 4816) + (unpaid ? 8 /* sizeof(char [8]) */ : 1 /* sizeof(char [1]) */) + (oclass ? (Strlen_(ocsymfmt, "let_to_name", 4817) + invbuf_sympadding) : 0);
    if (len > game.invbufsiz) {
        if (game.invbuf) {
            free(game.invbuf);
        }
        /* add slop to reduce incremental realloc */
        game.invbufsiz = len + 10;
        game.invbuf = alloc(game.invbufsiz);
    }
    if (unpaid) {
        strcat(strcpy(game.invbuf, "Unpaid "), class_name);
    } else {
        game.invbuf = strcpy(game.invbuf, class_name);
    }
    if ((oclass != 0) && showsym) {
        let mlen = invbuf_sympadding - Strlen_(class_name, "let_to_name", 4830);
        while (--mlen > 0) {
            game.invbuf += String.fromCharCode(32);
        }
        sprintf(eos(game.invbuf), ocsymfmt, def_oc_syms[oclass].sym);
    }
    return game.invbuf;
}
/* release the static buffer used by let_to_name() */
export function free_invbuf() {
    if (game.invbuf) {
        free(game.invbuf) , game.invbuf = null;
    }
    game.invbufsiz = 0;
}
/* give consecutive letters to every item in inventory (for !fixinv mode);
   gold is always forced to '$' slot at head of list */
export function reassign() {
    let i = 0;
    let obj = null;
    let prevobj = null;
    let goldobj = null;
    /* first, remove [first instance of] gold from invent, if present */
    prevobj = goldobj = null;
    for (obj = game.invent; obj; prevobj = obj , obj = obj.nobj) {
        if (obj.oclass == COIN_CLASS) {
            goldobj = obj;
            if (prevobj) {
                prevobj.nobj = goldobj.nobj;
            } else {
                game.invent = goldobj.nobj;
            }
            break;
        }
    }
    /* second, re-letter the rest of the list */
    for (obj = game.invent , i = 0; obj; obj = obj.nobj , i++) {
        obj.invlet = (i < 26) ? (97 + i) : (i < 52) ? (65 + i - 26) : 35;
    }
    if (goldobj) {
        /* third, assign gold the "letter" '$' and re-insert it at head */
        goldobj.invlet = GOLD_SYM;
        goldobj.nobj = game.invent;
        game.invent = goldobj;
    }
    if (i >= 52) {
        i = 52 - 1;
    }
    game.lastinvnr = i;
}
/* invent gold sanity check; used by doorganize() to control how getobj()
   deals with gold and also by wizard mode sanity_check() */
/* 'why' == caller in case of warning */
export function check_invent_gold(why) {
    let otmp = null;
    let goldstacks = 0;
    let wrongslot = 0;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.oclass == COIN_CLASS) {
            /* there should be at most one stack of gold in invent, in slot '$' */
            ++goldstacks;
            if (otmp.invlet != GOLD_SYM) {
                ++wrongslot;
            }
        }
    }
    if (goldstacks > 1 || wrongslot > 0) {
        impossible("%s: %s%s%s", why, (wrongslot > 1) ? "gold in wrong slots" : (wrongslot > 0) ? "gold in wrong slot" : "", (wrongslot > 0 && goldstacks > 1) ? " and " : "", (goldstacks > 1) ? "multiple gold stacks" : "");
        return (1);
    }
    return (0);
}
/* normal getobj callback for item to #adjust; excludes gold */
export function adjust_ok(obj) {
    if (!obj || obj.oclass == COIN_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    return GETOBJ_SUGGEST;
}
/* getobj callback for item to #adjust if gold is wonky; allows gold */
export function adjust_gold_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    return GETOBJ_SUGGEST;
}
/* #adjust command
 *
 *      User specifies a 'from' slot for inventory stack to move,
 *      then a 'to' slot for its destination.  Open slots and those
 *      filled by compatible stacks are listed as likely candidates
 *      but user can pick any inventory letter (including 'from').
 *
 *  to == from, 'from' has a name
 *      All compatible items (same name or no name) are gathered
 *      into the 'from' stack.  No count is allowed.
 *  to == from, 'from' does not have a name
 *      All compatible items without a name are gathered into the
 *      'from' stack.  No count is allowed.  Compatible stacks with
 *      names are left as-is.
 *  to != from, no count
 *      Move 'from' to 'to'.  If 'to' is not empty, merge 'from'
 *      into it if possible, otherwise swap it with the 'from' slot.
 *  to != from, count given
 *      If the user specifies a count when choosing the 'from' slot,
 *      and that count is less than the full size of the stack,
 *      then the stack will be split.  The 'count' portion is moved
 *      to the destination, and the only candidate for merging with
 *      it is the stack already at the 'to' slot, if any.  When the
 *      destination is non-empty but won't merge, whatever is there
 *      will be moved to an open slot; if there isn't any open slot
 *      available, the adjustment attempt fails.
 *
 *      To minimize merging for 'from == to', unnamed stacks will
 *      merge with named 'from' but named ones won't merge with
 *      unnamed 'from'.  Otherwise attempting to collect all unnamed
 *      stacks would lump the first compatible named stack with them
 *      and give them its name.
 *
 *      To maximize merging for 'from != to', compatible stacks will
 *      merge when either lacks a name (or they already have the same
 *      name).  When no count is given and one stack has a name and
 *      the other doesn't, the merged result will have that name.
 *      However, when splitting results in a merger, the name of the
 *      destination overrides that of the source, even if destination
 *      is unnamed and source is named.
 *
 *      Gold is only a candidate to adjust if we've somehow managed
 *      to get multiple stacks and/or it is in a slot other than '$'.
 *      Specifying a count to split it into two stacks is not allowed.
 */
/* inventory organizer by Del Lamb */
export function doorganize() {
    let adjust_filter = null;
    let obj = null;
    if (!game.invent || (game.invent.oclass == COIN_CLASS && game.invent.invlet == GOLD_SYM && !game.invent.nobj)) {
        /* when no invent, or just gold in '$' slot, there's nothing to adjust */
        You("aren't carrying anything %s.", !game.invent ? "to adjust" : "adjustable");
        return 0;
    }
    if (!game.flags.invlet_constant) {
        reassign();
    }
    /* filter passed to getobj() depends upon gold sanity */
    adjust_filter = check_invent_gold("adjust") ? adjust_gold_ok : adjust_ok;
    /* get object the user wants to organize (the 'from' slot) */
    obj = getobj("adjust", adjust_filter, 2 | 1);
    return doorganize_core(obj);
}
/* alternate version of #adjust used by itemactions() for splitting */
const __adjust_split_Amount = "Amount to split from current stack must be";
export function adjust_split() {
    let obj = null;
    let splitamount = 0;
    let let_ = 0;
    let dig = 0;
    /* invlet should be queued so no getobj prompting is expected */
    obj = getobj("split", adjust_ok, 0);
    if (!obj || obj.quan < 2 || obj.otyp == GOLD_PIECE) {
        return 4;
    }
    if (obj.quan == 2) {
        /* caller has set things up to avoid this */
        splitamount = 1;
    } else {
        /* get first digit; doesn't wait for <return> */
        dig = yn_function("Split off how many?", null, 0, (1));
        if (!digit(dig)) {
            pline("%s", c_common_strings.c_Never_mind);
            /* yn_function() added the first digit to the
                           prompt when recording message history; have
                           get_count() display "Count: N" when waiting
                           for additional digits (ordinarily that won't be
                           shown until a second digit is entered) and also
                           add "Count: N" to message history if more than
                           one digit gets entered or the original N is
                           deleted and replaced with different digit */
            /* \033 is in quitchars[] so we need to check for it separately
           in order to treat it as cancel rather than as accept */
            return 2;
        }
        /* got first digit, get more until next non-digit (except for
           backspace/delete which will take away most recent digit and
           keep going; we expect one of ' ', '\n', or '\r') */
        let_ = get_count(null, dig, 0, { get value() { return splitamount; }, set value(_v) { splitamount = _v; } }, 4 | 2);
        if (!let_ || let_ == 27 || !strchr(quitchars, let_)) {
            pline("%s", c_common_strings.c_Never_mind);
            return 2;
        }
    }
    if (splitamount < 1 || splitamount >= obj.quan) {
        if (splitamount < 1) {
            pline("%s at least 1.", __adjust_split_Amount);
        } else {
            pline("%s less than %ld.", __adjust_split_Amount, obj.quan);
        }
        return 2;
    }
    /* normally a split would take place in getobj() if player supplies
       a count there, so doorganize_core() figures out 'splitamount'
       from the object; it will undo the split if player cancels while
       selecting the destination slot */
    obj = splitobj(obj, splitamount);
    return doorganize_core(obj);
}
export function doorganize_core(obj) {
    let otmp = null;
    let splitting = null;
    let bumped = null;
    let ix = 0;
    let cur = 0;
    let trycnt = 0;
    let let_ = 0;
    let lets = '';
    let qbuf = '';
    let objname = null;
    let otmpname = null;
    let adj_type = null;
    let ever_mind = (0);
    let collect = 0;
    let isgold = 0;
    if (!obj) {
        return 2;
    }
    /* can only be gold if check_invent_gold() found a problem:  multiple '$'
       stacks and/or gold in some other slot, otherwise (*adjust_filter)()
       won't allow gold to be picked; if player has picked any stack of gold
       as #adjust 'from' slot, we'll force the 'to' slot to be '$' below */
    isgold = (obj.oclass == COIN_CLASS);
    /* figure out whether user gave a split count to getobj() */
    splitting = bumped = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.nobj == obj) {
            /* knowledge of splitobj() operation */
            if (otmp.invlet == obj.invlet) {
                splitting = otmp;
            }
            break;
        }
    }
    /* initialize the list with all lower and upper case letters */
    lets = __nh_char_write(lets, 0, (obj.oclass == COIN_CLASS) ? GOLD_SYM : 32);
    for (ix = 1 , let_ = 97; let_ <= 122; ) {
        lets = __nh_char_write(lets, ix++, let_++);
    }
    for (let_ = 65; let_ <= 90; ) {
        lets = __nh_char_write(lets, ix++, let_++);
    }
    lets = __nh_char_write(lets, (1 + invlet_basic), 32);
    lets = __nh_char_write(lets, 55 /* sizeof(char [55]) */ - 1, 0);
    /* for floating inv letters, truncate list after the first open slot */
    if (!game.flags.invlet_constant && (ix = inv_cnt((0))) < invlet_basic) {
        lets = __nh_char_write(lets, ix + (splitting ? 1 : 2), 0);
    }
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp != obj && !mergable(otmp, obj)) {
            /* blank out all the letters currently in use in the inventory
       except those that will be merged with the selected object */
            let_ = otmp.invlet;
            /* overflow defaults to off, but it we find a stack using that
               slot, switch to on -- the opposite of normal invlet handling */
            if (let_ >= 97 && let_ <= 122) {
                lets = __nh_char_write(lets, 1 + let_ - 97, 32);
            } else if (let_ >= 65 && let_ <= 90) {
                lets = __nh_char_write(lets, 1 + let_ - 65 + 26, 32);
            } else if (let_ == 35) {
                lets = __nh_char_write(lets, (1 + invlet_basic), 35);
            }
        }
    }
    /* compact the list by removing all the blanks */
    for (ix = cur = 0; __nh_char_at0(__nh_advance_str(lets, ix)); ix++) {
        if (__nh_char_at0(__nh_advance_str(lets, ix)) != 32 && cur++ < ix) {
            lets = __nh_char_write(lets, cur - 1, __nh_char_at0(__nh_advance_str(lets, ix)));
        }
    }
    lets = __nh_char_write(lets, cur, 0);
    /* and by dashing runs of letters */
    if (cur > 5) {
        compactify(lets);
    }
    /* get 'to' slot to use as destination */
    if (!splitting) {
        qbuf = strcpy(qbuf, "Adjust letter");
    } else {
        qbuf = sprintf(qbuf, "Split %ld", obj.quan);
    }
    qbuf = __nh_buf_append(qbuf, sprintf('', " to what [%s]%s?", lets, game.invent ? " (? see used letters)" : ""));
    for (trycnt = 1; ; ++trycnt) {
        /* note: splitting->quan is the amount being left in original slot */
        let_ = !isgold ? yn_function(qbuf, null, 0, (1)) : GOLD_SYM;
        if (let_ == 63 || let_ == 42) {
            let_ = display_used_invlets(splitting ? obj.invlet : 0);
            if (!let_) {
                continue;
            }
            if (let_ == 27) {
                if (splitting) {
                    merged({ get value() { return splitting; }, set value(_v) { splitting = _v; } }, obj);
                }
                if (!ever_mind) {
                    pline("%s", c_common_strings.c_Never_mind);
                }
                return 0;
            }
        }
        if (strchr(quitchars, let_) || (splitting && let_ == obj.invlet)) {
            noadjust: {
            }
            /* adjusting to same slot is meaningful since all
               compatible stacks get collected along the way,
               but splitting to same slot is not */
            if (splitting) {
                merged({ get value() { return splitting; }, set value(_v) { splitting = _v; } }, obj);
            }
            if (!ever_mind) {
                pline("%s", c_common_strings.c_Never_mind);
            }
            return 0;
        } else if (let_ == GOLD_SYM && obj.oclass != COIN_CLASS) {
            pline("Only gold coins may be moved into the '%c' slot.", GOLD_SYM);
            ever_mind = (1);
            if (splitting) {
                merged({ get value() { return splitting; }, set value(_v) { splitting = _v; } }, obj);
            }
            if (!ever_mind) {
                pline("%s", c_common_strings.c_Never_mind);
            }
            return 0;
        }
        /* letter() classifies '@' as one; compactify() can put '-' in lets;
           the only thing of interest that strchr() might find is '$' or '#'
           since letter() catches everything else that we put into lets[] */
        if ((letter(let_) && let_ != 64) || (strchr(lets, let_) && let_ != 45)) {
            break;
        }
        if (trycnt == 5) {
            if (splitting) {
                merged({ get value() { return splitting; }, set value(_v) { splitting = _v; } }, obj);
            }
            if (!ever_mind) {
                pline("%s", c_common_strings.c_Never_mind);
            }
            return 0;
        }
        pline("Select an inventory slot letter.");
    }
    collect = (let_ == obj.invlet);
    /* change the inventory and print the resulting item */
    adj_type = collect ? "Collecting:" : !splitting ? "Moving:" : "Splitting:";
    extract_nobj(obj, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } });
    for (otmp = game.invent; otmp; ) {
        otmpname = ((otmp).oextra && ((otmp).oextra.oname)) ? ((otmp).oextra.oname) : null;
        /* it's tempting to pull this outside the loop, but merged() could
           free ONAME(obj) [via obfree()] and replace it with ONAME(otmp) */
        objname = ((obj).oextra && ((obj).oextra.oname)) ? ((obj).oextra.oname) : null;
        if (collect) {
            if ((!otmpname || (objname && !strcmp(objname, otmpname))) && merged({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, obj)) {
                obj = otmp;
                otmp = otmp.nobj;
                extract_nobj(obj, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } });
                continue;
            }
        } else if (otmp.invlet == let_) {
            if ((!otmpname || (objname && !strcmp(objname, otmpname))) && merged({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, obj)) {
                /* Merging: when from and to are compatible */
                adj_type = "Merging:";
                obj = otmp;
                otmp = otmp.nobj;
                extract_nobj(obj, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } });
                break;
            }
            if (!splitting) {
                /* Moving or splitting: don't merge extra compatible stacks.
               Found 'otmp' in destination slot; merge if compatible,
               otherwise bump whatever is there to an open slot. */
                adj_type = "Swapping:";
                otmp.invlet = obj.invlet;
            } else {
                /* strip 'from' name if it has one */
                if (objname && !obj.oartifact) {
                    ((obj).oextra.oname) = null;
                }
                if (!mergable(otmp, obj)) {
                    /* won't merge; put 'from' name back */
                    if (objname) {
                        ((obj).oextra.oname) = objname;
                    }
                } else {
                    /* will merge; discard 'from' name */
                    if (objname) {
                        free(objname) , objname = null;
                    }
                }
                if (merged({ get value() { return otmp; }, set value(_v) { otmp = _v; } }, obj)) {
                    adj_type = "Splitting and merging:";
                    obj = otmp;
                    extract_nobj(obj, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } });
                } else if (inv_cnt((0)) >= invlet_basic) {
                    merged({ get value() { return splitting; }, set value(_v) { splitting = _v; } }, obj);
                    /* "knapsack cannot accommodate any more items" */
                    Your("pack is too full.");
                    return 0;
                } else {
                    bumped = otmp;
                    extract_nobj(bumped, { get value() { return game.invent; }, set value(_v) { game.invent = _v; } });
                }
            }
            break;
        }
        otmp = otmp.nobj;
    }
    /* inline addinv; insert loose object at beginning of inventory */
    obj.invlet = let_;
    obj.nobj = game.invent;
    obj.where = 3;
    game.invent = obj;
    reorder_invent();
    if (bumped) {
        /* splitting the 'from' stack is causing an incompatible
           stack in the 'to' slot to be moved into an open one;
           we need to do another inline insertion to inventory */
        assigninvlet(bumped);
        bumped.nobj = game.invent;
        bumped.where = 3;
        game.invent = bumped;
        reorder_invent();
    }
    /* messages deferred until inventory has been fully reestablished */
    prinv(adj_type, obj, 0);
    if (bumped) {
        prinv("Moving:", bumped, 0);
    }
    if (splitting) {
        clear_splitobjs();
    }
    update_inventory();
    return 0;
}
/* common to display_minventory and display_cinventory */
export function invdisp_nothing(hdr, txt) {
    let win = 0;
    let selected = null;
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    add_menu_heading(win, hdr);
    add_menu_str(win, "");
    add_menu_str(win, txt);
    (game.windowprocs.win_end_menu)(win, null);
    if (select_menu(win, 0, selected) > 0) {
        free(selected);
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
    return;
}
/* query_objlist callback: return things that are worn or wielded */
export function worn_wield_only(obj) {
    /* check for things that *are* worn or wielded (only used for monsters,
       so we don't worry about excluding W_CHAIN, W_ARTI and the like) */
    /* this used to check for things that *might* be worn or wielded,
       but that's not particularly interesting */
    return (obj.owornmask != 0);
}
/*
 * Display a monster's inventory.
 * Returns a pointer to the object from the monster's inventory selected
 * or NULL if nothing was selected.
 *
 * By default, only worn and wielded items are displayed.  The caller
 * can pick one.  Modifier flags are:
 *
 *      PICK_NONE, PICK_ONE - standard menu control
 *      PICK_ANY            - allowed, but we only return a single object
 *      MINV_NOLET          - nothing selectable
 *      MINV_ALL            - display all inventory
 */
/* monster whose minvent we're showing */
/* control over what to display */
/* menu title */
export function display_minventory(mon, dflags, title) {
    let ret = null;
    let tmp = '';
    let n = 0;
    let selected = null;
    let do_all = (dflags & 8) != 0;
    let incl_hero = (do_all && (game.u.uswallow && (game.u.ustuck == (mon))));
    let have_inv = (mon.minvent != null);
    let have_any = (have_inv || incl_hero);
    let pickings = (dflags & 3);
    tmp = sprintf(tmp, "%s %s:", s_suffix(noit_Monnam(mon)), do_all ? "possessions" : "armament");
    if (do_all ? have_any : (mon.misc_worn_check || ((mon).mw))) {
        /* Fool the 'weapon in hand' routine into
         * displaying 'weapon in claw', etc. properly.
         */
        game.youmonst.data = mon.data;
        game.iflags.suppress_price++;
        n = query_objlist(title ? title : tmp, (mon.minvent), (16 | (incl_hero ? 256 : 0)), { get value() { return selected; }, set value(_v) { selected = _v; } }, pickings, do_all ? allow_all : worn_wield_only);
        game.iflags.suppress_price--;
        /* was 'set_uasmon();' but that potentially has side-effects */
        /* basic part of set_uasmon() */
        game.youmonst.data = game.mons[game.u.umonnum];
    } else {
        invdisp_nothing(title ? title : tmp, "(none)");
        n = 0;
    }
    if (n > 0) {
        ret = selected[0].item.a_obj;
        free(selected);
    } else {
        ret = null;
    }
    return ret;
}
/* format a container name for cinventory_display(), inserting "trapped"
   if that's appropriate */
export function cinv_doname(obj) {
    let result = doname(obj);
    if (obj.otrapped && strlen(result) + 9 /* sizeof(char [9]) */ <= 128) {
        /*
     * If obj->tknown ever gets implemented, doname() will handle this.
     * Assumes that probing reveals the trap prior to calling us.  Since
     * we lack that flag, hero forgets about it as soon as we're done....
     */
        /* 'result' is an obuf[] but might point into the middle (&buf[PREFIX])
       rather than the beginning and we don't have access to that;
       assume that there is at least QBUFSZ available when reusing it */
        /* obj->lknown has been set before calling us so either "locked" or
           "unlocked" should always be present (for a trapped container) */
        let p = strstri(result, " locked");
        let q = strstri(result, " unlocked");
        if (p && (!q || p < q)) {
            p = strsubst(p, " locked ", " trapped locked ");
        } else if (q) {
            q = strsubst(q, " unlocked ", " trapped unlocked ");
        }
        /* might need to change "an" to "a"; when no BUC is present,
           "an unlocked" yielded "an trapped unlocked" above */
        result = strsubst(result, "an trapped ", "a trapped ");
    }
    return result;
}
/* used by safe_qbuf() if the full doname() result is too long */
export function cinv_ansimpleoname(obj) {
    let result = ansimpleoname(obj);
    if (obj.otrapped) {
        if (strncmp(result, "a ", 2)) {
            result = strsubst(result, "a ", "a trapped ");
        } else if (strncmp(result, "an ", 3)) {
            result = strsubst(result, "an ", "an trapped ");
        } else if (strncmp(result, "the ", 4)) {
            result = strsubst(result, "the ", "the trapped ");
        /* result is an obuf[] so we know this will always fit */
        /* unique container? nethack doesn't have any */
        /* no leading article at all? shouldn't happen with ansimpleoname() */
        } else {
            result = strsubst(result, "", "trapped ");
        }
    }
    return result;
}
/* Display the contents of a container in inventory style.
   Used for wand of probing of non-empty containers and statues. */
export function display_cinventory(obj) {
    let ret = null;
    let qbuf = '';
    let n = 0;
    let selected = null;
    safe_qbuf(qbuf, "Contents of ", ":", obj, cinv_doname, cinv_ansimpleoname, "that");
    if (obj.cobj) {
        /* custom formatting routines to insert "trapped"
                        into the object's name when appropriate;
                        last resort "that" won't ever get used */
        n = query_objlist(qbuf, (obj.cobj), 16, { get value() { return selected; }, set value(_v) { selected = _v; } }, 0, allow_all);
    } else {
        invdisp_nothing(qbuf, "(empty)");
        n = 0;
    }
    if (n > 0) {
        ret = selected[0].item.a_obj;
        free(selected);
    } else {
        ret = null;
    }
    obj.cknown = 1;
    return ret;
}
export function only_here(obj) {
    return (obj.ox == game.only.x && obj.oy == game.only.y);
}
/*
 * Display a list of buried or underwater items in inventory style.
 * Return a non-zero value if there were items at that spot.
 *
 * Currently, this is only used with a wand of probing zapped downwards.
 */
export function display_binventory(x, y, as_if_seen) {
    let obj = null;
    let qbuf = '';
    let underwhat = "here";
    let selected = null;
    let n = 0;
    let n2 = 0;
    if (is_pool_or_lava(x, y) && !(game.u.uinwater) && (obj = game.level.objects[x][y]) != null) {
        /* if hero is levitating or flying over water or lava, list any items
       below (the map won't be showing them); if hero is underwater, player
       should use the normal look_here command instead of probing (caller
       has already used bhitpile() which will have set dknown on all items) */
        let real_liquid = is_pool(x, y) ? "water" : "lava";
        let seen_liquid = hliquid(real_liquid);
        if (!obj.v.v_nexthere) {
            let more_than_1 = ((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD)));
            There("%s %s under the %s here.", more_than_1 ? "are" : "is", doname(obj), seen_liquid);
            n2 = 1;
            /* "pair of boots" is singular but "beneath it" sounds strange */
            if (((obj).otyp == LENSES || (obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_GLOVES) || (obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_BOOTS))) {
                more_than_1 = (1);
            }
            underwhat = more_than_1 ? "under them" : "beneath it";
        } else {
            qbuf = sprintf(qbuf, "Things that are under the %s here:", seen_liquid);
            if (query_objlist(qbuf, game.level.objects[x][y], 1, { get value() { return selected; }, set value(_v) { selected = _v; } }, 0, allow_all) > 0) {
                free(selected) , selected = null;
            }
            for (n2 = 0; obj; obj = obj.v.v_nexthere) {
                ++n2;
            }
            underwhat = "beneath them";
        }
    }
    for (n = 0 , obj = game.level.buriedobjlist; obj; obj = obj.nobj) {
        if (obj.ox == x && obj.oy == y) {
            /* count # of buried objects here */
            if (as_if_seen) {
                observe_object(obj);
            }
            n++;
        }
    }
    if (n) {
        game.only.x = x;
        game.only.y = y;
        qbuf = sprintf(qbuf, "Things that are buried %s:", underwhat);
        /* "buried here", but vary if we've already shown underwater items */
        if (query_objlist(qbuf, game.level.buriedobjlist, 16, { get value() { return selected; }, set value(_v) { selected = _v; } }, 0, only_here) > 0) {
            free(selected);
        }
        game.only.x = game.only.y = 0;
    }
    return n + n2;
}
export function prepare_perminvent(window) {
    let wri = null;
    let invmode = game.iflags.perminv_mode;
    if (game.perminv_flags != invmode) {
        Object.assign(game.wri_info, game.zerowri);
        game.wri_info.fromcore.invmode = invmode;
        /*  relay the mode settings to the window port */
        wri = (game.windowprocs.win_ctrl_nhwindow)(window, set_mode, game.wri_info);
        game.perminv_flags = invmode;
        ((wri));
    }
}
let __sync_perminvent_wri = null;
__nh_register_static(() => { __sync_perminvent_wri = null; });
export function sync_perminvent() {
    let wport_id = null;
    if (game.WIN_INVEN == (-1)) {
        if ((game.core_invent_state || (game.wri_info.tocore.tocore_flags & prohibited)) && !(game.in_perm_invent_toggled && game.perm_invent_toggling_direction == toggling_on)) {
            return;
        }
    }
    prepare_perminvent(game.WIN_INVEN);
    if ((!game.iflags.perm_invent && game.core_invent_state)) {
        /* Odd - but this could be end-of-game disclosure
         * which just sets boolean iflags.perm_invent to
         * FALSE without actually doing anything else.
         */
        docrt();
        return;
    }
    if ((game.iflags.perm_invent && !game.core_invent_state) || (!game.iflags.perm_invent && (game.in_perm_invent_toggled && game.perm_invent_toggling_direction == toggling_on))) {
        if ((game.iflags.perm_invent && !game.core_invent_state) || game.in_perm_invent_toggled) {
            /*
     * The following conditions can bring us to here:
     * 1. iflags.perm_invent is on
     *      AND
     *    gc.core_invent_state is still zero.
     * OR
     * 2. iflags.perm_invent is off, but we're in the
     *    midst of toggling it on.
     * OR
     * 3. iflags.perminv_mode has been changed via 'm O'.
     */
            /* Send windowport a request to return the related settings to us */
            __sync_perminvent_wri = (game.windowprocs.win_ctrl_nhwindow)(game.WIN_INVEN, request_settings, game.wri_info);
            if (__sync_perminvent_wri != null) {
                if ((__sync_perminvent_wri.tocore.tocore_flags & (too_early)) != 0) {
                    /* don't be too noisy about this as it's really
                     * a startup timing issue. Just set a marker. */
                    game.iflags.perm_invent_pending = (1);
                    return;
                }
                if ((__sync_perminvent_wri.tocore.tocore_flags & (too_small | prohibited)) != 0) {
                    if ((__sync_perminvent_wri.tocore.tocore_flags & prohibited) != 0) {
                        /* sizes aren't good enough */
                        set_option_mod_status("perm_invent", set_gameview);
                        set_option_mod_status("perminv_mode", set_gameview);
                    }
                    game.iflags.perm_invent = (0);
                    if (game.WIN_INVEN != (-1)) {
                        (game.windowprocs.win_destroy_nhwindow)(game.WIN_INVEN) , game.WIN_INVEN = (-1);
                    }
                    wport_id = (game.windowprocs.wp_id == wp_tty) ? "tty perm_invent" : "perm_invent";
                    pline("%s could not be enabled.", wport_id);
                    pline("%s needs a terminal that is at least %dx%d, yours is %dx%d.", wport_id, __sync_perminvent_wri.tocore.needrows, __sync_perminvent_wri.tocore.needcols, __sync_perminvent_wri.tocore.haverows, __sync_perminvent_wri.tocore.havecols);
                    (game.windowprocs.win_wait_synch)();
                    return;
                }
            }
            game.core_invent_state++;
        }
    }
    if (!__sync_perminvent_wri || __sync_perminvent_wri.tocore.maxslot == 0) {
        return;
    }
    if (game.in_perm_invent_toggled && game.perm_invent_toggling_direction == toggling_on) {
        game.WIN_INVEN = (game.windowprocs.win_create_nhwindow)(4);
    }
    if (game.WIN_INVEN != (-1) && game.program_state.beyond_savefile_load) {
        game.in_sync_perminvent = 1;
        display_inventory(null, (0));
        game.in_sync_perminvent = 0;
    }
}
export function perm_invent_toggled(negated) {
    game.in_perm_invent_toggled = (1);
    if (negated) {
        game.perm_invent_toggling_direction = toggling_off;
        if (game.WIN_INVEN != (-1)) {
            (game.windowprocs.win_destroy_nhwindow)(game.WIN_INVEN) , game.WIN_INVEN = (-1);
        }
        game.core_invent_state = 0;
    } else {
        game.perm_invent_toggling_direction = toggling_on;
        if (game.iflags.perminv_mode == InvOptNone) {
            game.iflags.perminv_mode = InvOptOn;
        }
        /* all inventory except gold */
        sync_perminvent();
    }
    game.perm_invent_toggling_direction = toggling_not;
    game.in_perm_invent_toggled = (0);
}
/*invent.c*/
/* not a musical instrument */
/* [maybe separate one-bite foods from rations and such?] */
/* other classes don't have subclasses; we assign a nonzero
           value because sortloot() uses 0 to mean 'not yet classified' */
/* named (partially discovered) */
/* we've suppressed the size prefix (above); there normally won't
           be more than one of a given creature type because they coalesce,
           but globs with different bless/curse state won't merge so it is
           feasible to have multiple at the same location; add a suffix to
           get such sorted by size (small first) */
/* none of the above
                                              * (shouldn't happen) */
/* A billable object won't have its `unpaid' bit set, so would
           erroneously seem to be a candidate to merge with a similar
           ordinary object.  That's no good, because once it's really
           picked up, it won't merge after all.  It might merge with
           another unpaid object, but we can't check that here (depends
           too much upon shk's bill) and if it doesn't merge it would
           end up in the '#' overflow inventory slot, so reject it now. */
/* counts GETOBJ_EXCLUDE_INACCESS items to decide
                       * between "you don't have anything to <foo>"
                       * versus "you don't have anything _else_ to <foo>"
                       * (also used for GETOBJ_EXCLUDE_NONINVENT) */
/* remove inaccessible things */
/* remove more inappropriate things, but unlike the first it won't
               trigger an "else" in "you don't have anything else to ___" */
/* acceptable but not listed as likely candidates in the prompt
               or in the inventory subset if player responds with '?' - thus,
               don't add it to lets with bp, but add it to altlets with ap */
/* someday maybe we'll sort by 'olets' too (temporarily replace
       flags.packorder and pass SORTLOOT_PACK), but not yet... */
/* special case for seffects() */
/* quit or no eligible items */
/* 'c' is an object class, because we've already handled
           all the non-class letters which were put into 'types[]';
           could/should move object class names[] array from below
           to somewhere above so that we can access it here (via
           lcase(strcpy(classnamebuf, names[(int) c]))), but the
           game-play value of doing so is low... */
/* note; alternate label will be ignored
                                      if 'use_inuse_mode' is False */
/* They're identical, as far as we're concerned.  We want
       to force a deterministic order, and do so by producing a
       stable sort: maintain the original order of equal items. */
/* if Mjollnir is thrown and fails to return, we want to
           auto-pick it when we move to its spot, but not into quiver
           because it needs to be wielded to be re-thrown;
           aklys likewise because player using 'f' to throw it might
           not notice that it isn't wielded until it fails to return
           several times; we never auto-wield, just omit from quiver
           so that player will be prompted for what to throw and
           possibly realize that re-wielding is necessary */
/* kludge for canletgo()'s can't-drop-this message */
