/* NetHack 5.0	options.c	$NHDT-Date: 1737556914 2025/01/22 06:41:54 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.753 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Michael Allison, 2008. */
/* NetHack may be freely redistributed.  See license for details. */
/* OPTION_LISTS_ONLY: (AMIGA) external program for opt lists */
/* provide linkage */
/* provide linkage */
/* whether the 'msg_window' option is used to control ^P behavior */
/*
 *  NOTE:  If you add (or delete) an option, please review the following:
 *             doc/options.txt
 *
 *         It contains how-to info and outlines some required/suggested
 *         updates that should accompany your change.
 */
/*
 * include/optlist.h is utilized 3 successive times, for 3 different
 * objectives.
 *
 * The first time is with NHOPT_PROTO defined, to produce and include
 * the prototypes for the individual option processing functions.
 *
 * The second time is with NHOPT_ENUM defined, to produce the enum values
 * for the individual options that are used throughout options processing.
 * They are generally opt_optname, where optname is the name of the option.
 *
 * The third time is with NHOPT_PARSE defined, to produce the initializers
 * to fill out the allopt[] array of options (both boolean and compound).
 *
 */
import { game } from '../gstate.js';
import { alloc, free, memcpy, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You_cant, pline, raw_printf } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, atoi, atol, nh_strchr_truncate, strcat, strchr, strcmp, strcpy, strlen, strncat, strncmp, strncmpi, strncpy, strrchr, strstr, strstri } from '../c2js-runtime/string.js';
import { sanitize_name } from './bones.js';
import { all_options_statushilites, bot, check_gold_symbol, clear_status_hilites, cond_menu, condopt, count_status_hilites, opt_next_cond, parse_cond_option, parse_status_hl1, reset_status_hilites, status_hilite_menu, status_initialize } from './botl.js';
import { yyyymmddhhmmss } from './calendar.js';
import { all_options_autocomplete, bind_key, bind_mousebtn, bind_specialkey, cmd_from_func, cmdname_from_func, count_autocompletions, count_bind_keys, do_reqmenu, get_changed_key_binds, handler_change_autocompletions, handler_rebind_keys, reset_commands, update_rest_on_space } from './cmd.js';
import { add_menu_coloring_parsed, attr2attrname, check_enhanced_colors, clr2colorname, color_attr_parse_str, color_attr_to_str, count_menucolors, free_one_menu_coloring, match_str2attr, query_attr, query_color, query_color_attr, wc_color_name } from './coloratt.js';
import { cg, disclosure_options, hexdd } from './decl.js';
import { docrt, flush_screen, nul_glyphinfo, reglyph_darkroom, reset_glyphmap } from './display.js';
import { def_char_to_monclass, def_char_to_objclass, def_oc_syms, def_warnsyms } from './drawing.js';
import { on_level } from './dungeon.js';
import { nh_terminate } from './end.js';
import { apply_customizations, fill_glyphid_cache, free_glyphid_cache, glyphid_cache_status, glyphrep_to_custom_map_entries, reset_customcolors } from './glyphs.js';
import { classify_terrain } from './hack.js';
import { copynchars, digit, eos, fuzzymatch, highc, letter, lowc, mungspaces, strNsubst, str_end_is, str_start_is, strkitten, strsubst, trimspaces, visctrl } from './hacklib.js';
import { set_vanq_order } from './insight.js';
import { reassign, update_inventory } from './invent.js';
import { name_to_mon } from './mondata.js';
import { BOULDER, BoolOpt, COIN_CLASS, CONDITION_COUNT, CompOpt, EXT_ENCUMBER, FOOD_CLASS, GFILTER_AREA, GFILTER_NONE, GFILTER_VIEW, GOLD_SYM, HVY_ENCUMBER, InvOptInUse, InvOptNone, InvOptOn, InvSparse, LOW_PM, MAXMCLASSES, MAXOCLASSES, MAXPCHARS, MOD_ENCUMBER, NUMMONS, NUM_GRAPHICS, No, OPTCOUNT, OVERLOADED, Off, On, OptS_Advanced, OptS_Behavior, OptS_General, OptS_Map, OptS_Status, OthrOpt, PRIMARYSET, ROGUESET, RUN_CRAWL, RUN_LEAP, RUN_STEP, RUN_TPORT, SLIME_MOLD, SLT_ENCUMBER, STONE, SYM_BOULDER, S_expl_br, S_stone, S_vbeam, S_water, TRAPNUM, Term_Excluded, Term_False, Term_Off, UNENCUMBERED, VANQ_MLVL_MNDX, VENOM_SYM, WC_COUNT, Yes, _ISspace, builtin_opt, cmdline_opt, do_custom_colors, do_custom_symbols, environ_opt, gm_optionchange, num_opt_phases, num_terms, opt_BIOS, opt_DECgraphics, opt_IBMgraphics, opt_accessiblemsg, opt_acoustics, opt_align_message, opt_align_status, opt_alignment, opt_altkeyhandling, opt_altmeta, opt_armorstatus, opt_ascii_map, opt_autodescribe, opt_autodig, opt_autoopen, opt_autopickup, opt_autoquiver, opt_autounlock, opt_bgcolors, opt_blind, opt_bones, opt_boulder, opt_catname, opt_checkpoint, opt_cmdassist, opt_color, opt_confirm, opt_crash_email, opt_crash_name, opt_crash_urlmax, opt_customcolors, opt_customsymbols, opt_dark_room, opt_deaf, opt_debug_hunger, opt_debug_mongen, opt_debug_overwrite_stairs, opt_disclose, opt_dogname, opt_dropped_nopick, opt_dungeon, opt_effects, opt_eight_bit_tty, opt_extmenu, opt_female, opt_fireassist, opt_fixinv, opt_font_map, opt_font_menu, opt_font_message, opt_font_size_map, opt_font_size_menu, opt_font_size_message, opt_font_size_status, opt_font_size_text, opt_font_status, opt_font_text, opt_force_invmenu, opt_fruit, opt_fullscreen, opt_gender, opt_glyph, opt_goldX, opt_guicolor, opt_help, opt_herecmd_menu, opt_hilite_pet, opt_hilite_pile, opt_hilite_status, opt_hitpointbar, opt_horsename, opt_idlecheckpoint, opt_ignintr, opt_implicit_uncursed, opt_in, opt_legacy, opt_lit_corridor, opt_lootabc, opt_mail, opt_map_mode, opt_mention_decor, opt_mention_map, opt_mention_walls, opt_menu_deselect_all, opt_menu_deselect_page, opt_menu_first_page, opt_menu_headings, opt_menu_invert_all, opt_menu_invert_page, opt_menu_last_page, opt_menu_next_page, opt_menu_objsyms, opt_menu_overlay, opt_menu_previous_page, opt_menu_search, opt_menu_select_all, opt_menu_select_page, opt_menu_shift_left, opt_menu_shift_right, opt_menu_tab_sep, opt_menucolors, opt_menuinvertmode, opt_menustyle, opt_mon_movement, opt_monpolycontrol, opt_monsters, opt_montelecontrol, opt_mouse_support, opt_msg_window, opt_msghistory, opt_name, opt_news, opt_nudist, opt_null, opt_number_pad, opt_o_autocomplete, opt_o_autopickup_exceptions, opt_o_bind_keys, opt_o_menu_colors, opt_o_message_types, opt_o_status_cond, opt_o_status_hilites, opt_objects, opt_out, opt_packorder, opt_paranoid_confirmation, opt_pauper, opt_perm_invent, opt_perminv_mode, opt_petattr, opt_pettype, opt_pickup_burden, opt_pickup_stolen, opt_pickup_thrown, opt_pickup_types, opt_pile_limit, opt_player_selection, opt_playmode, opt_popup_dialog, opt_preload_tiles, opt_price_quotes, opt_pushweapon, opt_query_menu, opt_quick_farsight, opt_race, opt_rawio, opt_reroll, opt_rest_on_space, opt_roguesymset, opt_role, opt_runmode, opt_safe_pet, opt_safe_wait, opt_sanity_check, opt_scores, opt_scroll_amount, opt_scroll_margin, opt_selectsaved, opt_showdamage, opt_showexp, opt_showrace, opt_showscore, opt_showvers, opt_silent, opt_softkeyboard, opt_sortdiscoveries, opt_sortloot, opt_sortpack, opt_sortvanquished, opt_soundlib, opt_sounds, opt_sparkle, opt_splash_screen, opt_spot_monsters, opt_standout, opt_status_updates, opt_statushilites, opt_statuslines, opt_suppress_alert, opt_symset, opt_term_cols, opt_term_rows, opt_terrainstatus, opt_tile_file, opt_tile_height, opt_tile_width, opt_tiled_map, opt_time, opt_timed_delay, opt_tips, opt_tombstone, opt_toptenwin, opt_traps, opt_travel, opt_travel_debug, opt_tutorial, opt_use_darkgray, opt_use_inverse, opt_use_truecolor, opt_vary_msgcount, opt_verbose, opt_versinfo, opt_voices, opt_vt_sounddata, opt_vt_tiledata, opt_warnings, opt_weaponstatus, opt_whatis_coord, opt_whatis_filter, opt_whatis_menu, opt_whatis_moveskip, opt_windowborders, opt_windowcolors, opt_windowtype, opt_wizmgender, opt_wizweight, opt_wraptext, pfx_cond_, pfx_font, play_opt, set_gameview, set_hidden, set_in_config, set_in_game, set_in_sysconf, set_wiznofuz, set_wizonly, syscf_opt, wcolor_menu, wcolor_message, wcolor_status, wcolor_text, wp_curses, wp_tty } from './nh-constants.js';
import { choose_disco_sort, get_sortdisco } from './o_init.js';
import { fruit_from_name, makeplural, makesingular } from './objnam.js';
import { init_random, rn2, rn2_on_display_rng, rnd } from './rnd.js';
import { aligns, clearrolefilter, genders, races, rolefilterstring, roles, setrolefilter, str2align, str2gend, str2race, str2role } from './role.js';
import { sf_init } from './sfbase.js';
import { assign_soundlib, get_soundlib_name, soundlib_id_from_opt } from './sounds.js';
import { Strlen_, strbuf_append, strbuf_init } from './strutil.js';
import { assign_graphics, clear_symsetentry, do_symset, get_othersym, init_ov_primary_symbols, init_ov_rogue_symbols, init_rogue_symbols, init_symbols, known_handling, load_symset, parsesymbols, savedsym_strbuf, switch_symbols } from './symbols.js';
import { reset_customsymbols } from './utf8map.js';
import { get_current_feature_ver, get_feature_notice_ver, status_version } from './version.js';
import { vision_recalc } from './vision.js';
import { add_menu, add_menu_heading, add_menu_str, adjust_menu_promptstyle, choose_classes_menu, choose_windows, getlin, select_menu } from './windows.js';

game.allopt_init = [{ name: "windowtype", section: OptS_Advanced, minmatch: 0, expectedbuf: 16, idx: opt_windowtype, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_windowtype, alias: (null), descr: "windowing system to use (should be specified first)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "playmode", section: OptS_Advanced, minmatch: 0, expectedbuf: 8, idx: opt_playmode, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_playmode, alias: (null), descr: "normal play, non-scoring explore mode, or debug mode", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "name", section: OptS_Advanced, minmatch: 0, expectedbuf: 32, idx: opt_name, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_name, alias: (null), descr: "your character's name (e.g., name:Merlin-W)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "role", section: OptS_Advanced, minmatch: 0, expectedbuf: 32, idx: opt_role, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_role, alias: "character", descr: "your starting role (e.g., Barbarian, Valkyrie)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "race", section: OptS_Advanced, minmatch: 0, expectedbuf: 32, idx: opt_race, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_race, alias: (null), descr: "your starting race (e.g., Human, Elf)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "gender", section: OptS_Advanced, minmatch: 0, expectedbuf: 8, idx: opt_gender, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_gender, alias: (null), descr: "your starting gender (male or female)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "alignment", section: OptS_Advanced, minmatch: 0, expectedbuf: 8, idx: opt_alignment, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_alignment, alias: "align", descr: "your starting alignment (lawful, neutral, or chaotic)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "accessiblemsg", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_accessiblemsg, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.a11y.accessiblemsg; }, set value(_v) { game.a11y.accessiblemsg = _v; }, valueOf() { return game.a11y.accessiblemsg; } }, optfn: optfn_boolean, alias: (null), descr: "add location information to messages", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "acoustics", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_acoustics, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.acoustics; }, set value(_v) { game.flags.acoustics = _v; }, valueOf() { return game.flags.acoustics; } }, optfn: optfn_boolean, alias: (null), descr: "can your character hear anything", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "align_message", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_align_message, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_align_message, alias: (null), descr: "message window alignment", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "align_status", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_align_status, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_align_status, alias: (null), descr: "status window alignment", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "altkeyhandling", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_altkeyhandling, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_altkeyhandling, alias: "altkeyhandler", descr: "(not applicable)", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "altmeta", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_altmeta, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.altmeta; }, set value(_v) { game.iflags.altmeta = _v; }, valueOf() { return game.iflags.altmeta; } }, optfn: optfn_boolean, alias: (null), descr: "treat \"ESC c\" as M-c (Meta+c, 8th bit set)", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "armorstatus", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_armorstatus, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.armorstatus; }, set value(_v) { game.flags.armorstatus = _v; }, valueOf() { return game.flags.armorstatus; } }, optfn: optfn_boolean, alias: (null), descr: "summarize currently worn armor in a status field", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "ascii_map", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_ascii_map, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc_ascii_map; }, set value(_v) { game.iflags.wc_ascii_map = _v; }, valueOf() { return game.iflags.wc_ascii_map; } }, optfn: optfn_boolean, alias: (null), descr: "show map as text", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "autocompletions", section: OptS_Advanced, minmatch: 0, expectedbuf: 256, idx: opt_o_autocomplete, setwhere: set_in_game, opttyp: OthrOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_o_autocomplete, alias: (null), descr: "edit autocompletions", prefixgw: null, initval: On, has_handler: On, dupdetected: 0, disregarded: 0 }, { name: "autodescribe", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_autodescribe, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.autodescribe; }, set value(_v) { game.iflags.autodescribe = _v; }, valueOf() { return game.iflags.autodescribe; } }, optfn: optfn_boolean, alias: (null), descr: "describe terrain under cursor", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "autodig", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_autodig, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.autodig; }, set value(_v) { game.flags.autodig = _v; }, valueOf() { return game.flags.autodig; } }, optfn: optfn_boolean, alias: (null), descr: "dig if moving and wielding a digging tool", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "autoopen", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_autoopen, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.autoopen; }, set value(_v) { game.flags.autoopen = _v; }, valueOf() { return game.flags.autoopen; } }, optfn: optfn_boolean, alias: (null), descr: "walking into a door attempts to open it", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "autopickup", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_autopickup, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.pickup; }, set value(_v) { game.flags.pickup = _v; }, valueOf() { return game.flags.pickup; } }, optfn: optfn_boolean, alias: (null), descr: "automatically pick up objects", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "autopickup exceptions", section: OptS_Behavior, minmatch: 0, expectedbuf: 256, idx: opt_o_autopickup_exceptions, setwhere: set_in_game, opttyp: OthrOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_o_autopickup_exceptions, alias: (null), descr: "edit autopickup exceptions", prefixgw: null, initval: On, has_handler: On, dupdetected: 0, disregarded: 0 }, { name: "autoquiver", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_autoquiver, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.autoquiver; }, set value(_v) { game.flags.autoquiver = _v; }, valueOf() { return game.flags.autoquiver; } }, optfn: optfn_boolean, alias: (null), descr: "fill empty quiver automatically when firing", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "autounlock", section: OptS_Behavior, minmatch: 0, expectedbuf: 80, idx: opt_autounlock, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_out, addr: null, optfn: optfn_autounlock, alias: (null), descr: "action to take when encountering locked door or chest", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "bgcolors", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_bgcolors, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_Off, opt_in_out: opt_out, addr: { get value() { return game.iflags.bgcolors; }, set value(_v) { game.iflags.bgcolors = _v; }, valueOf() { return game.iflags.bgcolors; } }, optfn: optfn_boolean, alias: (null), descr: "use background color for some map hilighting", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "bind keys", section: OptS_Advanced, minmatch: 0, expectedbuf: 256, idx: opt_o_bind_keys, setwhere: set_in_game, opttyp: OthrOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_o_bind_keys, alias: (null), descr: "edit key binds", prefixgw: null, initval: On, has_handler: On, dupdetected: 0, disregarded: 0 }, { name: "BIOS", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_BIOS, setwhere: set_in_config, opttyp: BoolOpt, negateok: No, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: null, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "blind", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_blind, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.u.uroleplay.blind; }, set value(_v) { game.u.uroleplay.blind = _v; }, valueOf() { return game.u.uroleplay.blind; } }, optfn: optfn_boolean, alias: "permablind", descr: "your character is permanently blind", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "bones", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_bones, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.bones; }, set value(_v) { game.flags.bones = _v; }, valueOf() { return game.flags.bones; } }, optfn: optfn_boolean, alias: (null), descr: "allow loading bones files", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "boulder", section: OptS_Advanced, minmatch: 0, expectedbuf: 1, idx: opt_boulder, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_boulder, alias: (null), descr: "deprecated (use S_boulder in sym file instead)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "catname", section: OptS_Advanced, minmatch: 0, expectedbuf: 63, idx: opt_catname, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_catname, alias: (null), descr: "name of your starting pet if it is a kitten", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "checkpoint", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_checkpoint, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.ins_chkpt; }, set value(_v) { game.flags.ins_chkpt = _v; }, valueOf() { return game.flags.ins_chkpt; } }, optfn: optfn_boolean, alias: (null), descr: "save game state after each level change", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "cmdassist", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_cmdassist, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.cmdassist; }, set value(_v) { game.iflags.cmdassist = _v; }, valueOf() { return game.iflags.cmdassist; } }, optfn: optfn_boolean, alias: (null), descr: "give help for errors on direction input", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "color", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_color, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc_color; }, set value(_v) { game.iflags.wc_color = _v; }, valueOf() { return game.iflags.wc_color; } }, optfn: optfn_boolean, alias: "colour", descr: "use color in map", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "confirm", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_confirm, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.confirm; }, set value(_v) { game.flags.confirm = _v; }, valueOf() { return game.flags.confirm; } }, optfn: optfn_boolean, alias: (null), descr: "ask before hitting tame or peaceful monsters", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "crash_email", section: OptS_Advanced, minmatch: 0, expectedbuf: 32, idx: opt_crash_email, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_crash_email, alias: (null), descr: "email address for reporting", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "crash_name", section: OptS_Advanced, minmatch: 0, expectedbuf: 32, idx: opt_crash_name, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_crash_name, alias: (null), descr: "your name for reporting", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "crash_urlmax", section: OptS_Advanced, minmatch: 0, expectedbuf: 32, idx: opt_crash_urlmax, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_crash_urlmax, alias: (null), descr: "length of longest url we can generate", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "customcolors", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_customcolors, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.customcolors; }, set value(_v) { game.iflags.customcolors = _v; }, valueOf() { return game.iflags.customcolors; } }, optfn: optfn_boolean, alias: "customcolours", descr: "use custom colors in map", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "customsymbols", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_customsymbols, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.customsymbols; }, set value(_v) { game.iflags.customsymbols = _v; }, valueOf() { return game.iflags.customsymbols; } }, optfn: optfn_boolean, alias: "customsymbols", descr: "use custom utf8 symbols in map", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "dark_room", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_dark_room, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.dark_room; }, set value(_v) { game.flags.dark_room = _v; }, valueOf() { return game.flags.dark_room; } }, optfn: optfn_boolean, alias: (null), descr: "show floor outside line of sight differently", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "deaf", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_deaf, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.u.uroleplay.deaf; }, set value(_v) { game.u.uroleplay.deaf = _v; }, valueOf() { return game.u.uroleplay.deaf; } }, optfn: optfn_boolean, alias: "permadeaf", descr: "your character is permanently deaf", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "DECgraphics", section: OptS_Advanced, minmatch: 0, expectedbuf: 70, idx: opt_DECgraphics, setwhere: set_in_config, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_DECgraphics, alias: (null), descr: "load DECGraphics display symbols into symset", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "debug_hunger", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_debug_hunger, setwhere: set_wiznofuz, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.debug_hunger; }, set value(_v) { game.iflags.debug_hunger = _v; }, valueOf() { return game.iflags.debug_hunger; } }, optfn: optfn_boolean, alias: (null), descr: "no hunger", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "debug_mongen", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_debug_mongen, setwhere: set_wiznofuz, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.debug_mongen; }, set value(_v) { game.iflags.debug_mongen = _v; }, valueOf() { return game.iflags.debug_mongen; } }, optfn: optfn_boolean, alias: (null), descr: "no random monster generation", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "debug_overwrite_stairs", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_debug_overwrite_stairs, setwhere: set_wiznofuz, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.debug_overwrite_stairs; }, set value(_v) { game.iflags.debug_overwrite_stairs = _v; }, valueOf() { return game.iflags.debug_overwrite_stairs; } }, optfn: optfn_boolean, alias: (null), descr: "level generation can overwrite stairs", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "disclose", section: OptS_Advanced, minmatch: 0, expectedbuf: 7 /* sizeof(char [7]) */ * 2, idx: opt_disclose, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_disclose, alias: (null), descr: "the kinds of information to disclose at end of game", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "dogname", section: OptS_Advanced, minmatch: 0, expectedbuf: 63, idx: opt_dogname, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_dogname, alias: (null), descr: "name of your starting pet if it is a little dog", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "dropped_nopick", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_dropped_nopick, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.nopick_dropped; }, set value(_v) { game.flags.nopick_dropped = _v; }, valueOf() { return game.flags.nopick_dropped; } }, optfn: optfn_boolean, alias: (null), descr: "don't autopickup dropped items", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "dungeon", section: OptS_Advanced, minmatch: 0, expectedbuf: (S_water - S_stone + 1) + 1, idx: opt_dungeon, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_dungeon, alias: (null), descr: "list of symbols to use in drawing the dungeon map", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "effects", section: OptS_Advanced, minmatch: 0, expectedbuf: (S_expl_br - S_vbeam + 1) + 1, idx: opt_effects, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_effects, alias: (null), descr: "list of symbols to use in drawing special effects", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "eight_bit_tty", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_eight_bit_tty, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc_eight_bit_input; }, set value(_v) { game.iflags.wc_eight_bit_input = _v; }, valueOf() { return game.iflags.wc_eight_bit_input; } }, optfn: optfn_boolean, alias: (null), descr: "send 8-bit characters directly to terminal", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "extmenu", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_extmenu, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.extmenu; }, set value(_v) { game.iflags.extmenu = _v; }, valueOf() { return game.iflags.extmenu; } }, optfn: optfn_boolean, alias: (null), descr: "use menu for getting extended commands", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "female", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_female, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.female; }, set value(_v) { game.flags.female = _v; }, valueOf() { return game.flags.female; } }, optfn: optfn_boolean, alias: "male", descr: "deprecated; use gender:female", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "fireassist", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_fireassist, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.fireassist; }, set value(_v) { game.iflags.fireassist = _v; }, valueOf() { return game.iflags.fireassist; } }, optfn: optfn_boolean, alias: (null), descr: "fire-command tries to be helpful", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "fixinv", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_fixinv, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.invlet_constant; }, set value(_v) { game.flags.invlet_constant = _v; }, valueOf() { return game.flags.invlet_constant; } }, optfn: optfn_boolean, alias: (null), descr: "inventory items keep their letters", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "font_map", section: OptS_Advanced, minmatch: 0, expectedbuf: 40, idx: opt_font_map, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_map, alias: (null), descr: "font to use in the map window", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_menu", section: OptS_Advanced, minmatch: 0, expectedbuf: 40, idx: opt_font_menu, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_menu, alias: (null), descr: "font to use in menus", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_message", section: OptS_Advanced, minmatch: 0, expectedbuf: 40, idx: opt_font_message, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_message, alias: (null), descr: "font to use in the message window", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_size_map", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_font_size_map, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_size_map, alias: (null), descr: "size of the map font", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_size_menu", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_font_size_menu, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_size_menu, alias: (null), descr: "size of the menu font", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_size_message", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_font_size_message, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_size_message, alias: (null), descr: "size of the message font", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_size_status", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_font_size_status, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_size_status, alias: (null), descr: "size of the status font", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_size_text", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_font_size_text, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_size_text, alias: (null), descr: "size of the text font", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_status", section: OptS_Advanced, minmatch: 0, expectedbuf: 40, idx: opt_font_status, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_status, alias: (null), descr: "font to use in status window", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "font_text", section: OptS_Advanced, minmatch: 0, expectedbuf: 40, idx: opt_font_text, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_font_text, alias: (null), descr: "font to use in text windows", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "force_invmenu", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_force_invmenu, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.force_invmenu; }, set value(_v) { game.iflags.force_invmenu = _v; }, valueOf() { return game.iflags.force_invmenu; } }, optfn: optfn_boolean, alias: (null), descr: "commands asking for inventory item show a menu", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "fruit", section: OptS_General, minmatch: 0, expectedbuf: 32, idx: opt_fruit, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_fruit, alias: (null), descr: "name of a fruit you enjoy eating", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "fullscreen", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_fullscreen, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc2_fullscreen; }, set value(_v) { game.iflags.wc2_fullscreen = _v; }, valueOf() { return game.iflags.wc2_fullscreen; } }, optfn: optfn_boolean, alias: (null), descr: "toggle fullscreen", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "glyph", section: OptS_Advanced, minmatch: 0, expectedbuf: 40, idx: opt_glyph, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_glyph, alias: (null), descr: "set representation of a glyph to a unicode value and color", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "goldX", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_goldX, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.goldX; }, set value(_v) { game.flags.goldX = _v; }, valueOf() { return game.flags.goldX; } }, optfn: optfn_boolean, alias: (null), descr: "classify gold as unknown or uncursed", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "guicolor", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_guicolor, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.wc2_guicolor; }, set value(_v) { game.iflags.wc2_guicolor = _v; }, valueOf() { return game.iflags.wc2_guicolor; } }, optfn: optfn_boolean, alias: (null), descr: "use color for UI", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "help", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_help, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.help; }, set value(_v) { game.flags.help = _v; }, valueOf() { return game.flags.help; } }, optfn: optfn_boolean, alias: (null), descr: "show all available info when using whatis-command", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "herecmd_menu", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_herecmd_menu, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.herecmd_menu; }, set value(_v) { game.iflags.herecmd_menu = _v; }, valueOf() { return game.iflags.herecmd_menu; } }, optfn: optfn_boolean, alias: (null), descr: "show commands available in this location", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "hilite_pet", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_hilite_pet, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc_hilite_pet; }, set value(_v) { game.iflags.wc_hilite_pet = _v; }, valueOf() { return game.iflags.wc_hilite_pet; } }, optfn: optfn_boolean, alias: (null), descr: "use highlight for pets", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "hilite_pile", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_hilite_pile, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.hilite_pile; }, set value(_v) { game.iflags.hilite_pile = _v; }, valueOf() { return game.iflags.hilite_pile; } }, optfn: optfn_boolean, alias: (null), descr: "highlight piles of items", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "hilite_status", section: OptS_Advanced, minmatch: 0, expectedbuf: 13, idx: opt_hilite_status, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_out, addr: null, optfn: optfn_hilite_status, alias: (null), descr: "a status highlighting rule (can occur multiple times)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "hitpointbar", section: OptS_Status, minmatch: 0, expectedbuf: 0, idx: opt_hitpointbar, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc2_hitpointbar; }, set value(_v) { game.iflags.wc2_hitpointbar = _v; }, valueOf() { return game.iflags.wc2_hitpointbar; } }, optfn: optfn_boolean, alias: (null), descr: "show colored bar for hit points", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "horsename", section: OptS_Advanced, minmatch: 0, expectedbuf: 63, idx: opt_horsename, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_horsename, alias: (null), descr: "name of your starting pet if it is a pony", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "IBMgraphics", section: OptS_Advanced, minmatch: 0, expectedbuf: 70, idx: opt_IBMgraphics, setwhere: set_in_config, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_IBMgraphics, alias: (null), descr: "load IBMGraphics display symbols into symset", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "idlecheckpoint", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_idlecheckpoint, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_Off, opt_in_out: opt_in, addr: { get value() { return game.iflags.idlecheckpoint; }, set value(_v) { game.iflags.idlecheckpoint = _v; }, valueOf() { return game.iflags.idlecheckpoint; } }, optfn: optfn_boolean, alias: (null), descr: "update checkpoint file if input is idle for 10 seconds", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "ignintr", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_ignintr, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.ignintr; }, set value(_v) { game.flags.ignintr = _v; }, valueOf() { return game.flags.ignintr; } }, optfn: optfn_boolean, alias: (null), descr: "ignore interrupt signals", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "implicit_uncursed", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_implicit_uncursed, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.implicit_uncursed; }, set value(_v) { game.flags.implicit_uncursed = _v; }, valueOf() { return game.flags.implicit_uncursed; } }, optfn: optfn_boolean, alias: (null), descr: "omit \"uncursed\" from inventory", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "legacy", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_legacy, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.legacy; }, set value(_v) { game.flags.legacy = _v; }, valueOf() { return game.flags.legacy; } }, optfn: optfn_boolean, alias: (null), descr: "show introductory message", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "lit_corridor", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_lit_corridor, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.lit_corridor; }, set value(_v) { game.flags.lit_corridor = _v; }, valueOf() { return game.flags.lit_corridor; } }, optfn: optfn_boolean, alias: (null), descr: "show dark corridors as lit if in sight", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "lootabc", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_lootabc, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.lootabc; }, set value(_v) { game.flags.lootabc = _v; }, valueOf() { return game.flags.lootabc; } }, optfn: optfn_boolean, alias: (null), descr: "use a/b/c rather than o/i/c when looting", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "mail", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_mail, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.biff; }, set value(_v) { game.flags.biff = _v; }, valueOf() { return game.flags.biff; } }, optfn: optfn_boolean, alias: (null), descr: "enable the mail daemon", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "map_mode", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_map_mode, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_map_mode, alias: (null), descr: "map display mode under Windows", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "mention_decor", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_mention_decor, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.mention_decor; }, set value(_v) { game.flags.mention_decor = _v; }, valueOf() { return game.flags.mention_decor; } }, optfn: optfn_boolean, alias: (null), descr: "give feedback when walking over interesting features", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "mention_map", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_mention_map, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.a11y.glyph_updates; }, set value(_v) { game.a11y.glyph_updates = _v; }, valueOf() { return game.a11y.glyph_updates; } }, optfn: optfn_boolean, alias: (null), descr: "give feedback when interesting map locations change", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "mention_walls", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_mention_walls, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.mention_walls; }, set value(_v) { game.flags.mention_walls = _v; }, valueOf() { return game.flags.mention_walls; } }, optfn: optfn_boolean, alias: (null), descr: "give feedback when walking into walls", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "menu_deselect_all", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_deselect_all, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_deselect_all, alias: (null), descr: "deselect all items in a menu", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_deselect_page", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_deselect_page, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_deselect_page, alias: (null), descr: "deselect all items on this page of a menu", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_first_page", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_first_page, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_first_page, alias: (null), descr: "jump to the first page in a menu", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_headings", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_headings, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_headings, alias: (null), descr: "display style for menu headings", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "menu_invert_all", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_invert_all, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_invert_all, alias: (null), descr: "invert all items in a menu", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_invert_page", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_invert_page, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_invert_page, alias: (null), descr: "invert all items on this page of a menu", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_last_page", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_last_page, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_last_page, alias: (null), descr: "jump to the last page in a menu", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_next_page", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_next_page, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_next_page, alias: (null), descr: "go to the next menu page", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_objsyms", section: OptS_Advanced, minmatch: 0, expectedbuf: 12, idx: opt_menu_objsyms, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_objsyms, alias: "use_menu_glyphs", descr: "show object symbols in menus", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "menu_overlay", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_menu_overlay, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.menu_overlay; }, set value(_v) { game.iflags.menu_overlay = _v; }, valueOf() { return game.iflags.menu_overlay; } }, optfn: optfn_boolean, alias: (null), descr: "menus overlay and align to right", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "menu_previous_page", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_previous_page, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_previous_page, alias: (null), descr: "go to the previous menu page", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_search", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_search, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_search, alias: (null), descr: "search for a menu item", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_select_all", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_select_all, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_select_all, alias: (null), descr: "select all items in a menu", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_select_page", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_select_page, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_select_page, alias: (null), descr: "select all items on this page of a menu", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_shift_left", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_shift_left, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_shift_left, alias: (null), descr: "pan current menu page left", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_shift_right", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_menu_shift_right, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menu_shift_right, alias: (null), descr: "pan current menu page right", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menu_tab_sep", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_menu_tab_sep, setwhere: set_wizonly, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.menu_tab_sep; }, set value(_v) { game.iflags.menu_tab_sep = _v; }, valueOf() { return game.iflags.menu_tab_sep; } }, optfn: optfn_boolean, alias: (null), descr: "menu formatting", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "menucolors", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_menucolors, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.use_menu_color; }, set value(_v) { game.iflags.use_menu_color = _v; }, valueOf() { return game.iflags.use_menu_color; } }, optfn: optfn_boolean, alias: (null), descr: "use colors in menus", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "menu colors", section: OptS_Status, minmatch: 0, expectedbuf: 256, idx: opt_o_menu_colors, setwhere: set_in_game, opttyp: OthrOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_o_menu_colors, alias: (null), descr: "change colors used in menus", prefixgw: null, initval: On, has_handler: On, dupdetected: 0, disregarded: 0 }, { name: "menuinvertmode", section: OptS_Advanced, minmatch: 0, expectedbuf: 5, idx: opt_menuinvertmode, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menuinvertmode, alias: (null), descr: "experimental behavior of menu inverts", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "menustyle", section: OptS_Advanced, minmatch: 0, expectedbuf: 13 /* sizeof(char [13]) */, idx: opt_menustyle, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_menustyle, alias: (null), descr: "user interface for object selection", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "message types", section: OptS_Advanced, minmatch: 0, expectedbuf: 256, idx: opt_o_message_types, setwhere: set_in_game, opttyp: OthrOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_o_message_types, alias: (null), descr: "edit message types", prefixgw: null, initval: On, has_handler: On, dupdetected: 0, disregarded: 0 }, { name: "mon_movement", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_mon_movement, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.a11y.mon_movement; }, set value(_v) { game.a11y.mon_movement = _v; }, valueOf() { return game.a11y.mon_movement; } }, optfn: optfn_boolean, alias: (null), descr: "message when hero sees monster movement", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "monpolycontrol", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_monpolycontrol, setwhere: set_wizonly, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.mon_polycontrol; }, set value(_v) { game.iflags.mon_polycontrol = _v; }, valueOf() { return game.iflags.mon_polycontrol; } }, optfn: optfn_boolean, alias: (null), descr: "control monster polymorphs", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "montelecontrol", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_montelecontrol, setwhere: set_wizonly, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.mon_telecontrol; }, set value(_v) { game.iflags.mon_telecontrol = _v; }, valueOf() { return game.iflags.mon_telecontrol; } }, optfn: optfn_boolean, alias: (null), descr: "control monster teleport destinations", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "monsters", section: OptS_Advanced, minmatch: 0, expectedbuf: MAXMCLASSES, idx: opt_monsters, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_monsters, alias: (null), descr: "list of symbols to use for monsters", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "mouse_support", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_mouse_support, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_mouse_support, alias: (null), descr: "game receives click info from mouse", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "msg_window", section: OptS_Advanced, minmatch: 0, expectedbuf: 1, idx: opt_msg_window, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_msg_window, alias: (null), descr: "control of \"view previous message(s)\" (^P) behavior", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "msghistory", section: OptS_Advanced, minmatch: 0, expectedbuf: 5, idx: opt_msghistory, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_msghistory, alias: (null), descr: "number of top line messages to save", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "news", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_news, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.news; }, set value(_v) { game.iflags.news = _v; }, valueOf() { return game.iflags.news; } }, optfn: optfn_boolean, alias: (null), descr: "show any news at game start", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "nudist", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_nudist, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.u.uroleplay.nudist; }, set value(_v) { game.u.uroleplay.nudist = _v; }, valueOf() { return game.u.uroleplay.nudist; } }, optfn: optfn_boolean, alias: (null), descr: "start your character without armor", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "null", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_null, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.null; }, set value(_v) { game.flags.null = _v; }, valueOf() { return game.flags.null; } }, optfn: optfn_boolean, alias: (null), descr: "allow nulls to be sent to terminal", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "number_pad", section: OptS_General, minmatch: 0, expectedbuf: 1, idx: opt_number_pad, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_number_pad, alias: (null), descr: "use the number pad for movement", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "objects", section: OptS_Advanced, minmatch: 0, expectedbuf: MAXOCLASSES, idx: opt_objects, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_objects, alias: (null), descr: "list of symbols to use for objects", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "packorder", section: OptS_Advanced, minmatch: 0, expectedbuf: MAXOCLASSES, idx: opt_packorder, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_packorder, alias: (null), descr: "the inventory order of the items in your pack", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "paranoid_confirmation", section: OptS_Advanced, minmatch: 0, expectedbuf: 28, idx: opt_paranoid_confirmation, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_paranoid_confirmation, alias: "prayconfirm", descr: "extra prompting in certain situations", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "pauper", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_pauper, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.u.uroleplay.pauper; }, set value(_v) { game.u.uroleplay.pauper = _v; }, valueOf() { return game.u.uroleplay.pauper; } }, optfn: optfn_boolean, alias: (null), descr: "start your character without any items", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "perm_invent", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_perm_invent, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_Off, opt_in_out: opt_in, addr: { get value() { return game.iflags.perm_invent; }, set value(_v) { game.iflags.perm_invent = _v; }, valueOf() { return game.iflags.perm_invent; } }, optfn: optfn_boolean, alias: (null), descr: "show persistent inventory window", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "perminv_mode", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_perminv_mode, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_perminv_mode, alias: (null), descr: "what to show in persistent inventory window", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "petattr", section: OptS_Advanced, minmatch: 0, expectedbuf: 88, idx: opt_petattr, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_petattr, alias: (null), descr: "attributes for highlighting pets", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "pettype", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_pettype, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_pettype, alias: "pet", descr: "your preferred initial pet type", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "pickup_burden", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_pickup_burden, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_pickup_burden, alias: (null), descr: "maximum burden picked up before prompt", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "pickup_stolen", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_pickup_stolen, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.pickup_stolen; }, set value(_v) { game.flags.pickup_stolen = _v; }, valueOf() { return game.flags.pickup_stolen; } }, optfn: optfn_boolean, alias: (null), descr: "autopickup stolen items", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "pickup_thrown", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_pickup_thrown, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.pickup_thrown; }, set value(_v) { game.flags.pickup_thrown = _v; }, valueOf() { return game.flags.pickup_thrown; } }, optfn: optfn_boolean, alias: (null), descr: "autopickup thrown items", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "pickup_types", section: OptS_Behavior, minmatch: 0, expectedbuf: MAXOCLASSES, idx: opt_pickup_types, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_pickup_types, alias: (null), descr: "types of objects to pick up automatically", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "pile_limit", section: OptS_Advanced, minmatch: 0, expectedbuf: 24, idx: opt_pile_limit, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_pile_limit, alias: (null), descr: "threshold for \"there are many objects here\"", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "player_selection", section: OptS_Advanced, minmatch: 0, expectedbuf: 12, idx: opt_player_selection, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_player_selection, alias: (null), descr: "choose character via dialog or prompts", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "popup_dialog", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_popup_dialog, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc_popup_dialog; }, set value(_v) { game.iflags.wc_popup_dialog = _v; }, valueOf() { return game.iflags.wc_popup_dialog; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "preload_tiles", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_preload_tiles, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.wc_preload_tiles; }, set value(_v) { game.iflags.wc_preload_tiles = _v; }, valueOf() { return game.iflags.wc_preload_tiles; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "price_quotes", section: OptS_General, minmatch: 0, expectedbuf: 0, idx: opt_price_quotes, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.pricequotes; }, set value(_v) { game.iflags.pricequotes = _v; }, valueOf() { return game.iflags.pricequotes; } }, optfn: optfn_boolean, alias: (null), descr: "display prices you have seen for unidentified objects", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "pushweapon", section: OptS_Behavior, minmatch: 0, expectedbuf: 0, idx: opt_pushweapon, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.pushweapon; }, set value(_v) { game.flags.pushweapon = _v; }, valueOf() { return game.flags.pushweapon; } }, optfn: optfn_boolean, alias: (null), descr: "previous weapon goes to secondary slot", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "query_menu", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_query_menu, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.query_menu; }, set value(_v) { game.iflags.query_menu = _v; }, valueOf() { return game.iflags.query_menu; } }, optfn: optfn_boolean, alias: (null), descr: "use a menu for yes/no queries", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "quick_farsight", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_quick_farsight, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.quick_farsight; }, set value(_v) { game.flags.quick_farsight = _v; }, valueOf() { return game.flags.quick_farsight; } }, optfn: optfn_boolean, alias: (null), descr: "skip map browse when forced to looked at map", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "rawio", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_rawio, setwhere: set_in_config, opttyp: BoolOpt, negateok: No, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: null, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "reroll", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_reroll, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.u.uroleplay.reroll; }, set value(_v) { game.u.uroleplay.reroll = _v; }, valueOf() { return game.u.uroleplay.reroll; } }, optfn: optfn_boolean, alias: (null), descr: "allow rerolling of starting inventory and items", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "rest_on_space", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_rest_on_space, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.rest_on_space; }, set value(_v) { game.flags.rest_on_space = _v; }, valueOf() { return game.flags.rest_on_space; } }, optfn: optfn_boolean, alias: (null), descr: "space bar is bound to the rest-command", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "roguesymset", section: OptS_Advanced, minmatch: 0, expectedbuf: 70, idx: opt_roguesymset, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_roguesymset, alias: (null), descr: "load a set of rogue display symbols from symbols file", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "runmode", section: OptS_Advanced, minmatch: 0, expectedbuf: 9 /* sizeof(char [9]) */, idx: opt_runmode, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_runmode, alias: (null), descr: "display frequency when `running' or `travelling'", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "safe_pet", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_safe_pet, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.safe_dog; }, set value(_v) { game.flags.safe_dog = _v; }, valueOf() { return game.flags.safe_dog; } }, optfn: optfn_boolean, alias: (null), descr: "prevent you from hitting pets", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "safe_wait", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_safe_wait, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.safe_wait; }, set value(_v) { game.flags.safe_wait = _v; }, valueOf() { return game.flags.safe_wait; } }, optfn: optfn_boolean, alias: (null), descr: "prevent waiting next to hostiles", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "sanity_check", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_sanity_check, setwhere: set_wizonly, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.sanity_check; }, set value(_v) { game.iflags.sanity_check = _v; }, valueOf() { return game.iflags.sanity_check; } }, optfn: optfn_boolean, alias: (null), descr: "perform data sanity checks", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "scores", section: OptS_Advanced, minmatch: 0, expectedbuf: 32, idx: opt_scores, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_scores, alias: (null), descr: "the parts of the score list you wish to see", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "scroll_amount", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_scroll_amount, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_scroll_amount, alias: (null), descr: "amount to scroll map when scroll_margin is reached", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "scroll_margin", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_scroll_margin, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_scroll_margin, alias: (null), descr: "scroll map when this far from the edge", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "selectsaved", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_selectsaved, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.wc2_selectsaved; }, set value(_v) { game.iflags.wc2_selectsaved = _v; }, valueOf() { return game.iflags.wc2_selectsaved; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "showdamage", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_showdamage, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.showdamage; }, set value(_v) { game.iflags.showdamage = _v; }, valueOf() { return game.iflags.showdamage; } }, optfn: optfn_boolean, alias: (null), descr: "show damage hero takes in message line", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "showexp", section: OptS_Status, minmatch: 0, expectedbuf: 0, idx: opt_showexp, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.showexp; }, set value(_v) { game.flags.showexp = _v; }, valueOf() { return game.flags.showexp; } }, optfn: optfn_boolean, alias: (null), descr: "show experience points in status line", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "showrace", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_showrace, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.showrace; }, set value(_v) { game.flags.showrace = _v; }, valueOf() { return game.flags.showrace; } }, optfn: optfn_boolean, alias: (null), descr: "show your character by race rather than role", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "showscore", section: OptS_Status, minmatch: 0, expectedbuf: 0, idx: opt_showscore, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: null, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "showvers", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_showvers, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.showvers; }, set value(_v) { game.flags.showvers = _v; }, valueOf() { return game.flags.showvers; } }, optfn: optfn_boolean, alias: (null), descr: "show version info on status line", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "silent", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_silent, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.silent; }, set value(_v) { game.flags.silent = _v; }, valueOf() { return game.flags.silent; } }, optfn: optfn_boolean, alias: (null), descr: "don't use terminal bell", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "softkeyboard", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_softkeyboard, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc2_softkeyboard; }, set value(_v) { game.iflags.wc2_softkeyboard = _v; }, valueOf() { return game.iflags.wc2_softkeyboard; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "sortdiscoveries", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_sortdiscoveries, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_sortdiscoveries, alias: (null), descr: "preferred order when displaying discovered objects", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "sortloot", section: OptS_Advanced, minmatch: 0, expectedbuf: 4, idx: opt_sortloot, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_sortloot, alias: (null), descr: "sort object selection lists by description", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "sortpack", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_sortpack, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.sortpack; }, set value(_v) { game.flags.sortpack = _v; }, valueOf() { return game.flags.sortpack; } }, optfn: optfn_boolean, alias: (null), descr: "group inventory items by type", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "sortvanquished", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_sortvanquished, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_sortvanquished, alias: (null), descr: "preferred order when displaying vanquished monsters", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "soundlib", section: OptS_Advanced, minmatch: 0, expectedbuf: 16, idx: opt_soundlib, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_soundlib, alias: (null), descr: "soundlib interface to use (if any)", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "sounds", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_sounds, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_Off, opt_in_out: opt_in, addr: { get value() { return game.iflags.sounds; }, set value(_v) { game.iflags.sounds = _v; }, valueOf() { return game.iflags.sounds; } }, optfn: optfn_boolean, alias: (null), descr: "use sounds", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "sparkle", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_sparkle, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.sparkle; }, set value(_v) { game.flags.sparkle = _v; }, valueOf() { return game.flags.sparkle; } }, optfn: optfn_boolean, alias: (null), descr: "display sparkly effect when resisting magic", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "spot_monsters", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_spot_monsters, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.a11y.mon_notices; }, set value(_v) { game.a11y.mon_notices = _v; }, valueOf() { return game.a11y.mon_notices; } }, optfn: optfn_boolean, alias: (null), descr: "message when hero spots a monster", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "splash_screen", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_splash_screen, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.wc_splash_screen; }, set value(_v) { game.iflags.wc_splash_screen = _v; }, valueOf() { return game.iflags.wc_splash_screen; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "standout", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_standout, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.standout; }, set value(_v) { game.flags.standout = _v; }, valueOf() { return game.flags.standout; } }, optfn: optfn_boolean, alias: (null), descr: "use standout for --more--", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "status_updates", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_status_updates, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.status_updates; }, set value(_v) { game.iflags.status_updates = _v; }, valueOf() { return game.iflags.status_updates; } }, optfn: optfn_boolean, alias: (null), descr: "allow the status lines to update", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "status condition fields", section: OptS_Status, minmatch: 0, expectedbuf: 256, idx: opt_o_status_cond, setwhere: set_in_game, opttyp: OthrOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_o_status_cond, alias: (null), descr: "change status condition highlighting", prefixgw: null, initval: On, has_handler: On, dupdetected: 0, disregarded: 0 }, { name: "statushilites", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_statushilites, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_statushilites, alias: (null), descr: "0=no status highlighting, N=show highlights for N turns", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "status highlight rules", section: OptS_Status, minmatch: 0, expectedbuf: 256, idx: opt_o_status_hilites, setwhere: set_in_game, opttyp: OthrOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_o_status_hilites, alias: (null), descr: "change status line highlighting", prefixgw: null, initval: On, has_handler: On, dupdetected: 0, disregarded: 0 }, { name: "statuslines", section: OptS_Status, minmatch: 0, expectedbuf: 20, idx: opt_statuslines, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_statuslines, alias: (null), descr: "2 or 3 lines for status display", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "suppress_alert", section: OptS_Advanced, minmatch: 0, expectedbuf: 8, idx: opt_suppress_alert, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_suppress_alert, alias: (null), descr: "suppress alerts about version-specific features", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "symset", section: OptS_Map, minmatch: 0, expectedbuf: 70, idx: opt_symset, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_symset, alias: (null), descr: "load a set of display symbols from symbols file", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "term_cols", section: OptS_Advanced, minmatch: 0, expectedbuf: 6, idx: opt_term_cols, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_term_cols, alias: "termcolumns", descr: "number of columns", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "term_rows", section: OptS_Advanced, minmatch: 0, expectedbuf: 6, idx: opt_term_rows, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_term_rows, alias: (null), descr: "number of rows", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "terrainstatus", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_terrainstatus, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.terrainstatus; }, set value(_v) { game.flags.terrainstatus = _v; }, valueOf() { return game.flags.terrainstatus; } }, optfn: optfn_boolean, alias: (null), descr: "show hero's location as a status field", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "tile_file", section: OptS_Advanced, minmatch: 0, expectedbuf: 70, idx: opt_tile_file, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_tile_file, alias: (null), descr: "name of tile file", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "tile_height", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_tile_height, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_tile_height, alias: (null), descr: "height of tiles", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "tile_width", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_tile_width, setwhere: set_gameview, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_tile_width, alias: (null), descr: "width of tiles", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "tiled_map", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_tiled_map, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc_tiled_map; }, set value(_v) { game.iflags.wc_tiled_map = _v; }, valueOf() { return game.iflags.wc_tiled_map; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "time", section: OptS_Status, minmatch: 0, expectedbuf: 0, idx: opt_time, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.time; }, set value(_v) { game.flags.time = _v; }, valueOf() { return game.flags.time; } }, optfn: optfn_boolean, alias: (null), descr: "display game turns in status line", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "timed_delay", section: OptS_Map, minmatch: 0, expectedbuf: 0, idx: opt_timed_delay, setwhere: set_in_config, opttyp: BoolOpt, negateok: No, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: null, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "tips", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_tips, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.tips; }, set value(_v) { game.flags.tips = _v; }, valueOf() { return game.flags.tips; } }, optfn: optfn_boolean, alias: (null), descr: "show some helpful tips during gameplay", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "tombstone", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_tombstone, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.tombstone; }, set value(_v) { game.flags.tombstone = _v; }, valueOf() { return game.flags.tombstone; } }, optfn: optfn_boolean, alias: (null), descr: "show tombstone when your character dies", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "toptenwin", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_toptenwin, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.toptenwin; }, set value(_v) { game.iflags.toptenwin = _v; }, valueOf() { return game.iflags.toptenwin; } }, optfn: optfn_boolean, alias: (null), descr: "show top scores in window", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "traps", section: OptS_Advanced, minmatch: 0, expectedbuf: (TRAPNUM - 1) + 1, idx: opt_traps, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_traps, alias: (null), descr: "list of symbols to use in drawing traps", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "travel", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_travel, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.travelcmd; }, set value(_v) { game.flags.travelcmd = _v; }, valueOf() { return game.flags.travelcmd; } }, optfn: optfn_boolean, alias: (null), descr: "enable traveling via mouse click", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "travel_debug", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_travel_debug, setwhere: set_wizonly, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.trav_debug; }, set value(_v) { game.iflags.trav_debug = _v; }, valueOf() { return game.iflags.trav_debug; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "tutorial", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_tutorial, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.tutorial; }, set value(_v) { game.flags.tutorial = _v; }, valueOf() { return game.flags.tutorial; } }, optfn: optfn_boolean, alias: (null), descr: "ask if you want the tutorial", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "use_darkgray", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_use_darkgray, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.wc2_darkgray; }, set value(_v) { game.iflags.wc2_darkgray = _v; }, valueOf() { return game.iflags.wc2_darkgray; } }, optfn: optfn_boolean, alias: (null), descr: "use bold black color instead of blue", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "use_inverse", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_use_inverse, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.iflags.wc_inverse; }, set value(_v) { game.iflags.wc_inverse = _v; }, valueOf() { return game.iflags.wc_inverse; } }, optfn: optfn_boolean, alias: (null), descr: "display detected monsters in inverse", prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "use_truecolor", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_use_truecolor, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.use_truecolor; }, set value(_v) { game.iflags.use_truecolor = _v; }, valueOf() { return game.iflags.use_truecolor; } }, optfn: optfn_boolean, alias: "use_truecolour", descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "vary_msgcount", section: OptS_Advanced, minmatch: 0, expectedbuf: 20, idx: opt_vary_msgcount, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_vary_msgcount, alias: (null), descr: "show more old messages at a time", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "verbose", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_verbose, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_out, addr: { get value() { return game.flags.verbose; }, set value(_v) { game.flags.verbose = _v; }, valueOf() { return game.flags.verbose; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: On, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "versinfo", section: OptS_Advanced, minmatch: 0, expectedbuf: 80, idx: opt_versinfo, setwhere: set_in_game, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_out, addr: null, optfn: optfn_versinfo, alias: (null), descr: "extra information for 'showvers'", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "voices", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_voices, setwhere: set_gameview, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_Excluded, opt_in_out: opt_in, addr: { get value() { return game.iflags.voices; }, set value(_v) { game.iflags.voices = _v; }, valueOf() { return game.iflags.voices; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "vt_tiledata", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_vt_tiledata, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: null, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "vt_sounddata", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_vt_sounddata, setwhere: set_in_config, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: null, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "warnings", section: OptS_Advanced, minmatch: 0, expectedbuf: 10, idx: opt_warnings, setwhere: set_in_config, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_warnings, alias: (null), descr: "display characters for warnings", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "weaponstatus", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_weaponstatus, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.flags.weaponstatus; }, set value(_v) { game.flags.weaponstatus = _v; }, valueOf() { return game.flags.weaponstatus; } }, optfn: optfn_boolean, alias: (null), descr: "show currently wielded weapon in a status field", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "whatis_coord", section: OptS_Advanced, minmatch: 0, expectedbuf: 1, idx: opt_whatis_coord, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_whatis_coord, alias: (null), descr: "show coordinates when auto-describing cursor position", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "whatis_filter", section: OptS_Advanced, minmatch: 0, expectedbuf: 1, idx: opt_whatis_filter, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_whatis_filter, alias: (null), descr: "filter coordinate locations when targeting next or previous", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "whatis_menu", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_whatis_menu, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.getloc_usemenu; }, set value(_v) { game.iflags.getloc_usemenu = _v; }, valueOf() { return game.iflags.getloc_usemenu; } }, optfn: optfn_boolean, alias: (null), descr: "show menu when getting a map location", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "whatis_moveskip", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_whatis_moveskip, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.getloc_moveskip; }, set value(_v) { game.iflags.getloc_moveskip = _v; }, valueOf() { return game.iflags.getloc_moveskip; } }, optfn: optfn_boolean, alias: (null), descr: "skip same glyph when getting map location", prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "windowborders", section: OptS_Advanced, minmatch: 0, expectedbuf: 9, idx: opt_windowborders, setwhere: set_in_game, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: No, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_windowborders, alias: (null), descr: "0 (off), 1 (on), 2 (auto)", prefixgw: null, initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "windowcolors", section: OptS_Advanced, minmatch: 0, expectedbuf: 80, idx: opt_windowcolors, setwhere: set_gameview, opttyp: CompOpt, negateok: No, valok: Yes, dupeok: Yes, pfx: No, termpref: 0, opt_in_out: opt_in, addr: null, optfn: optfn_windowcolors, alias: (null), descr: "the foreground/background colors of windows", prefixgw: null, initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: "wizmgender", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_wizmgender, setwhere: set_wizonly, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wizmgender; }, set value(_v) { game.iflags.wizmgender = _v; }, valueOf() { return game.iflags.wizmgender; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "wizweight", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_wizweight, setwhere: set_wizonly, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wizweight; }, set value(_v) { game.iflags.wizweight = _v; }, valueOf() { return game.iflags.wizweight; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "wraptext", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: opt_wraptext, setwhere: set_in_game, opttyp: BoolOpt, negateok: Yes, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: opt_in, addr: { get value() { return game.iflags.wc2_wraptext; }, set value(_v) { game.iflags.wc2_wraptext = _v; }, valueOf() { return game.iflags.wc2_wraptext; } }, optfn: optfn_boolean, alias: (null), descr: null, prefixgw: null, initval: Off, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: "cond_", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: pfx_cond_, setwhere: set_hidden, opttyp: CompOpt, negateok: Yes, valok: No, dupeok: Yes, pfx: Yes, termpref: 0, opt_in_out: opt_in, addr: null, optfn: pfxfn_cond_, alias: (null), descr: "prefix for cond_ options", prefixgw: "cond_", initval: Off, has_handler: Yes, dupdetected: 0, disregarded: 0 }, { name: "font", section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: pfx_font, setwhere: set_hidden, opttyp: CompOpt, negateok: Yes, valok: Yes, dupeok: Yes, pfx: Yes, termpref: 0, opt_in_out: opt_in, addr: null, optfn: pfxfn_font, alias: (null), descr: "prefix for font options", prefixgw: "font", initval: Off, has_handler: No, dupdetected: 0, disregarded: 0 }, { name: null, section: OptS_Advanced, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: set_in_sysconf, opttyp: BoolOpt, negateok: No, valok: No, dupeok: No, pfx: No, termpref: Term_False, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: (1) }];
export const MESSAGE_OPTION = 1;
export const STATUS_OPTION = 2;
export const MAP_OPTION = 3;
export const MENU_OPTION = 4;
export const TEXT_OPTION = 5;
export const optn_silenterr = -1;
export const optn_err = 0;
export const optn_ok = 1;
export const do_nothing = 0;
export const do_init = 1;
export const do_set = 2;
export const do_handler = 3;
export const get_val = 4;
export const get_cnf_val = 5;
game.allopt = [{ name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }, { name: null, section: 0, minmatch: 0, expectedbuf: 0, idx: 0, setwhere: 0, opttyp: 0, negateok: 0, valok: 0, dupeok: 0, pfx: 0, termpref: 0, opt_in_out: 0, addr: null, optfn: null, alias: null, descr: null, prefixgw: null, initval: 0, has_handler: 0, dupdetected: 0, disregarded: 0 }];
/* use rest of file */
/* extern char configfile[]; */
/* for messages; files.c */
/* in tos.c */
/* in sys/msdos/video.c */
/* in sys/msdos/video.c */
game.empty_optstr = [0];
game.duplicate = 0;
game.using_alias = 0;
game.give_opt_msg = (1);
export const MAX_ROLEOPT = 4;
/* 4: role,race,gend,algn */
game.opt_set_in_config = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
game.roleoptvals = [[null, null, null, null, null, null, null], [null, null, null, null, null, null, null], [null, null, null, null, null, null, null], [null, null, null, null, null, null, null]];
const OptS_type = ["General", "Behavior", "Map", "Status", "Advanced"];
const def_inv_order = [12, 5, 2, 3, 7, 9, 10, 8, 4, 11, 6, 13, 14, 15, 16, 0, 0, 0]; /* COIN, AMULET, WEAPON, ARMOR, FOOD, SCROLL, SPBOOK, POTION, RING, WAND, TOOL, GEM, ROCK, BALL, CHAIN, 0, 0, 0 */
const none = "(none)";
const randomrole = "random";
const to_be_done = "(to be done)";
const defopt = "default";
const defbrief = "def";
/* paranoia[] - used by parseoptions() and handler_paranoid_confirmation() */
// struct paranoia_opts: { flagmask, argname, argMinLen, synonym, synMinLen, explain }
/* which paranoid option */
/* primary name */
/* minimum number of letters to match */
/* alternate name (optional) */
/* for interactive menu */
const paranoia = [{ flagmask: 1, argname: "Confirm", argMinLen: 1, synonym: "Paranoia", synMinLen: 2, explain: "for \"yes\" confirmations, require \"no\" to reject" }, { flagmask: 2, argname: "quit", argMinLen: 1, synonym: "explore", synMinLen: 2, explain: "yes vs y to quit or to enter explore mode" }, { flagmask: 4, argname: "die", argMinLen: 1, synonym: "death", synMinLen: 2, explain: "yes vs y to die (explore mode or debug mode)" }, { flagmask: 8, argname: "bones", argMinLen: 1, synonym: null, synMinLen: 0, explain: "yes vs y to save bones data when dying in debug mode" }, { flagmask: 16, argname: "attack", argMinLen: 1, synonym: "hit", synMinLen: 1, explain: "yes vs y to attack a peaceful monster" }, { flagmask: 128, argname: "wand-break", argMinLen: 2, synonym: "break-wand", synMinLen: 2, explain: "yes vs y to break a wand via (a)pply" }, { flagmask: 512, argname: "eat", argMinLen: 1, synonym: "continue", synMinLen: 4, explain: "yes vs y to continue eating after first bite when satiated" }, { flagmask: 256, argname: "Were-change", argMinLen: 2, synonym: null, synMinLen: 0, explain: "yes vs y to change form when lycanthropy is controllable" }, { flagmask: 32, argname: "pray", argMinLen: 1, synonym: null, synMinLen: 0, explain: "y required to pray (supersedes old \"prayconfirm\" option)" }, { flagmask: 2048, argname: "trap", argMinLen: 1, synonym: "move-trap", synMinLen: 1, explain: "y required to enter known trap unless considered harmless" }, { flagmask: 4096, argname: "Autoall", argMinLen: 2, synonym: "autoselect-all", synMinLen: 2, explain: "y required to pick filter choice 'A' for menustyle:Full" }, { flagmask: 1024, argname: "swim", argMinLen: 1, synonym: null, synMinLen: 0, explain: "'m' prefix necessary to deliberately walk into lava or water" }, { flagmask: 64, argname: "Remove", argMinLen: 1, synonym: "Takeoff", synMinLen: 1, explain: "always pick from inventory for Remove and Takeoff" }, { flagmask: 0, argname: "none", argMinLen: 4, synonym: null, synMinLen: 0, explain: null }, { flagmask: ~0, argname: "all", argMinLen: 3, synonym: null, synMinLen: 0, explain: null }];
/* there are some initial-letter conflicts: "a"ttack vs "A"utoall vs
       "a"ll, "attack" takes precedence and "all" isn't present in the
       interactive menu with "Autoall" capitalized there,
       and "d"ie vs "d"eath, synonyms for each other so doesn't matter;
       (also "p"ray vs "P"aranoia, "pray" takes precedence since "Paranoia"
       is just a synonym for "Confirm"); "b"ones vs "br"eak-wand, the
       latter requires at least two letters; "e"at vs "ex"plore,
       "cont"inue eating vs "C"onfirm; "wand"-break vs "Were"-change,
       both require at least two letters during config processing but use
       one letter with case-sensitivity for 'm O's interactive menu;
       if any entry or alias beginning with 'n' gets added, aside from "none",
       the parsing to accept "nofoo" to mean "!foo" will need fixing */
/* extra y/n questions rather than changing y/n to yes/n[o];
       they switch to yes/no if paranoid:confirm is also set */
/* not a yes/n[o] vs y/n change nor a y/n addition */
/* normally when there is only 1 candidate it's chosen automatically */
/* for config file parsing; interactive menu skips these */
/* require full word match */
/* ditto */
const menutype = [["traditional", "[prompt for object class(es), then", " ask y/n for each item in those classes]"], ["combination", "[prompt for object class(es), then", " use menu for items in those classes]"], ["full", "[use menu to choose class(es), then", " use another menu for items in those]"], ["partial", "[skip class filtering; always", " use menu of all available items]"]];
/* 'menustyle' settings */
/* tty supports all four settings, curses just final two */
const msgwind = [["single", "[show one old message at a time,", " most recent first]"], ["combination", "[for consecutive ^P requests, use", " 'single' for first two, then 'full']"], ["full", "[show all available messages,", " oldest first and most recent last]"], ["reversed", "[show all available messages,", " most recent first]"]];
/* 'msg_window' settings */
/* autounlock settings */
const unlocktypes = [["untrap", "(might fail)"], ["apply-key", ""], ["kick", "(doors only)"], ["force", "(chests/boxes only)"]];
const burdentype = ["unencumbered", "burdened", "stressed", "strained", "overtaxed", "overloaded"];
const runmodes = ["teleport", "run", "walk", "crawl"];
const sortltype = ["none", "loot", "full"];
/* second column is an alias for the first; third is brief explanation;
   entries 5 and 6 are 1|4 and 2|4 (tty only) */
const perminv_modes = [["none", "off", "no permanent inventory window"], ["all", "on", "all inventory except for gold"], ["full", "gold", "full inventory including gold"], [null, null, null], [null, null, null], [null, null, null], [null, null, null], [null, null, null], ["in-use", "inuse-only", "subset: items currently in use"]];
/*0*/
/*1*/
/*2*/
/*3*/
/*4*/
/*5*/
/*6*/
/*5*/
/*6*/
/*7*/
/*8*/
// struct objsymopt: { num, nam, descr }
/*
 * menuobjsyms:
 *   Inventory display for the various values of menuobjsyms.
 *   4' and 5' represent !sortpack which lacks headers; they
 *   produce the same result.
 *
 *   0:                         1:
 *        Weapons                    Weapons  (')')
 *        a - 15 darts               a - 15 darts
 *        Armor                      Armor    ('[')
 *        b - Hawaiian shirt         b - Hawaiian shirt
 *   2:                         3:
 *        Weapons                    Weapons  (')')
 *        a ) 15 darts               a ) 15 darts
 *        Armor                      Armor    ('[')
 *        b [ Hawaiian shirt         b [ Hawaiian shirt
 *   4:                         5:
 *        Weapons                    Weapons  (')')
 *        a - 15 darts               a - 15 darts
 *        Armor                      Armor    ('[')
 *        b - Hawaiian shirt         b - Hawaiian shirt
 *   4':                        5':
 *        a ) 15 darts               a ) 15 darts
 *        b [ Hawaiian shirt         b [ Hawaiian shirt
 */
const objsymvals = [{ num: 0, nam: "none", descr: "don't show object symbols in menus" }, { num: 1, nam: "headers", descr: "show object symbols in menu header lines" }, { num: 2, nam: "entries", descr: "show object symbols in individual menu entries" }, { num: 3, nam: "both", descr: "show object symbols in headers and menu entries" }, { num: 4, nam: "conditional", descr: "show objsyms in entries if no headers are shown" }, { num: 5, nam: "one-or-other", descr: "show objsyms in header, in entries if no header" }];
/*
 * Default menu manipulation command accelerators.  These may _not_ be:
 *
 *      + a number or '#' - reserved for counts
 *      + an upper or lower case US ASCII letter - used for accelerators
 *      + ESC - reserved for escaping the menu
 *      + NULL, CR or LF - reserved for committing the selection(s).  NULL
 *        is kind of odd, but the tty's xwaitforspace() will return it if
 *        someone hits a <ret>.
 *      + a default object class symbol - used for object class accelerators
 *
 * Standard letters (for now) are:
 *
 *              <  back 1 page
 *              >  forward 1 page
 *              ^  first page
 *              |  last page
 *              :  search
 *
 *              page            all
 *               ,    select     .
 *               \    deselect   -
 *               ~    invert     @
 *
 * The command name list is duplicated in the compopt array.
 */
const default_menu_cmd_info = [{ name: "menu_next_page", cmd: 62, desc: "Go to next page" }, { name: "menu_previous_page", cmd: 60, desc: "Go to previous page" }, { name: "menu_first_page", cmd: 94, desc: "Go to first page" }, { name: "menu_last_page", cmd: 124, desc: "Go to last page" }, { name: "menu_select_all", cmd: 46, desc: "Select all items in entire menu" }, { name: "menu_invert_all", cmd: 64, desc: "Invert selection for all items" }, { name: "menu_deselect_all", cmd: 45, desc: "Unselect all items in entire menu" }, { name: "menu_select_page", cmd: 44, desc: "Select all items on current page" }, { name: "menu_invert_page", cmd: 126, desc: "Invert current page's selections" }, { name: "menu_deselect_page", cmd: 92, desc: "Unselect all items on current page" }, { name: "menu_search", cmd: 58, desc: "Search and invert matching items" }, { name: "menu_shift_right", cmd: 125, desc: "Pan current page to right (perm_invent only)" }, { name: "menu_shift_left", cmd: 123, desc: "Pan current page to left (perm_invent only)" }, { name: null, cmd: 0, desc: null }];
const n_currently_set = "(%d currently set)";
/* next few are not allopt[] entries, so will only be called
   directly from doset, not from individual optfn's */
/* ask user if they want a tutorial, except if tutorial boolean option has
   been set in config - either on or off - in which case just obey that
   setting without asking */
export async function ask_do_tutorial() {
    let dotut = game.flags.tutorial;
    if (!game.opt_set_in_config[opt_tutorial]) {
        let win = 0;
        let sel = null;
        let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
        /* see also: add_menu_coloring() */
        let buf = '';
        let rc = null;
        let norc = 0;
        let n = 0;
        let pass = 0;
        rc = nh_basename(get_configfile(), (1));
        norc = !strcmp(get_configfile(), "/dev/null");
        buf = nh_snprintf("ask_do_tutorial", 447, buf, 256 /* sizeof(char [256]) */, "Put \"OPTIONS=!tutorial\" in %s to skip this query.", (rc && __nh_char_at0(rc) && !norc) ? rc : "your configuration file");
        do {
            win = (game.windowprocs.win_create_nhwindow)(4);
            (game.windowprocs.win_start_menu)(win, 0);
            /* we could look up whether #optionsfull has been bound to a key
           and show that, or whether #reqmenu and #options are both still
           bound to keys and show those, but if meta keys are involved
           the player might not know how to type them; keep this simple */
            /* if we offer '?' as a choice and it is the only thing chosen,
       we'll end up coming back here after showing the explanatory text */
            /* offer novices a chance to request helpful [sic] advice */
            /* help text surrounding '?' choice should have exactly one NULL */
            Object.assign(any, cg.zeroany);
            any.a_char = 121;
            await add_menu(win, nul_glyphinfo, any, any.a_char, 0, 0, 8, "Yes, do a tutorial", 0);
            any.a_char = 110;
            await add_menu(win, nul_glyphinfo, any, any.a_char, 0, 0, 8, "No, just start play", 0);
            await add_menu_str(win, "");
            await add_menu_str(win, buf);
            if (pass++) {
                await add_menu_str(win, "(Please choose 'y' or 'n'.)");
            }
            (game.windowprocs.win_end_menu)(win, "Do you want a tutorial?");
            n = await select_menu(win, 1, sel);
            (game.windowprocs.win_destroy_nhwindow)(win);
        } while (!n);
        if (n > 0) {
            dotut = (sel[0].item.a_char == 121);
            free(sel);
        } else {
            dotut = (0);
        }
    }
    return dotut;
}
/*
 **********************************
 *
 *   parseoptions
 *
 **********************************
 */
export async function parseoptions(opts, tinitial, tfrom_file) {
    let op = null;
    let negated = 0;
    let got_match = (0);
    let pfx_match = (0);
    let i = 0;
    let matchidx = -1;
    let optresult = optn_err;
    let optlen = 0;
    let optlen_wo_val = 0;
    let retval = (1);
    game.duplicate = (0);
    game.using_alias = (0);
    game.opt_initial = tinitial;
    game.opt_from_file = tfrom_file;
    if (tinitial && (op = strchr(opts, 44)) != null) {
        /*
     * Process elements of comma-separated list in right to left order.
     * When some options are set interactively--notably various compound
     * options that issue a prompt for a value--they use parseoptions()
     * to handle setting the new value.  For those, 'tinitial' is False
     * and if user tries to supply a comma-separated list, it will be
     * treated as part of the current option, probably failing to parse.
     */
        /* to get here, bind is non-Null and not equal to bindings,
           so it is greater than bindings and bind[-1] is valid; check
           whether current comma happens to be for "\,:cmd" or "',':cmd"
           (":cmd" part is assumed if the comma has expected quoting) */
        /* if a comma separator has been found, break off first binding from rest;
       parse the rest and then handle this first one when recursion returns */
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        if (!await parseoptions(op, game.opt_initial, game.opt_from_file)) {
            retval = (0);
        }
    }
    if (strlen(opts) > Math.trunc(256 / 2)) {
        config_error_add("Option too long, max length is %i characters", (Math.trunc(256 / 2)));
        /* check tty, not necessarily the active window port;
           windows early startup can still be set to safeprocs */
        return (0);
    }
    /* strip leading and trailing white space */
    while (((__ctype_b_loc())[((__nh_char_at0(opts)))] & _ISspace)) {
        (opts = __nh_advance_str(opts, 1));
    }
    op = eos(opts);
    while ((op = __nh_advance_str(op, -1)) >= opts && ((__ctype_b_loc())[((__nh_char_at0(op)))] & _ISspace)) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    }
    if (!__nh_char_at0(opts)) {
        config_error_add("Empty statement");
        return (0);
    }
    negated = (0);
    while ((__nh_char_at0(opts) == 33) || !strncmpi(opts, "no", 2)) {
        opts = __nh_advance_str(opts, (__nh_char_at0(opts) == 33) ? 1 : (__nh_char_at0(__nh_advance_str(opts, 2)) != 45) ? 2 : 3);
        negated = !negated;
    }
    optlen = strlen(opts);
    optlen_wo_val = length_without_val(opts, optlen);
    if (optlen_wo_val < optlen) {
        optlen = optlen_wo_val;
    }
    for (i = 0; i < OPTCOUNT; ++i) {
        got_match = (0);
        if (game.allopt[i].pfx) {
            if (str_start_is(opts, game.allopt[i].name, (1))) {
                matchidx = i;
                got_match = pfx_match = (1);
            }
        }
        /* this prevents "boolopt:True" &c */
        /*
         * During option initialization, the function
         *     determine_ambiguities()
         * figured out exactly how many characters are required to
         * unambiguously differentiate one option from all others, and it
         * placed that number into each option's allopt[n].minmatch.
         *
         */
        if (!got_match && game.allopt[i].name) {
            got_match = match_optname(opts, game.allopt[i].name, game.allopt[i].minmatch, (1));
        }
        if (got_match) {
            if (!game.allopt[i].pfx && optlen < game.allopt[i].minmatch) {
                config_error_add("Ambiguous option %s, %d characters are needed to differentiate", opts, game.allopt[i].minmatch);
                /* traditional: prompt for class(es) by symbol,
                     prompt for each item within class(es) one at a time */
                break;
            }
            matchidx = i;
            break;
        }
    }
    if (!got_match) {
        for (i = 0; i < OPTCOUNT; ++i) {
            /* spin through the aliases to see if there's a match in those.
           Note that if multiple delimited aliases for the same option
           becomes desirable in the future, this is where you'll need
           to split a delimited allopt[i].alias field into each
           individual alias */
            if (!game.allopt[i].alias) {
                continue;
            }
            got_match = match_optname(opts, game.allopt[i].alias, strlen(game.allopt[i].alias), (1));
            if (got_match) {
                matchidx = i;
                game.using_alias = (1);
                break;
            }
        }
    }
    /* allow optfn's to test whether they were called from parseoptions() */
    game.program_state.in_parseoptions++;
    if (got_match && (matchidx >= 0 && matchidx < OPTCOUNT) && !game.allopt[matchidx].disregarded) {
        game.duplicate = duplicate_opt_detection(matchidx);
        if (game.duplicate && !game.allopt[matchidx].dupeok) {
            complain_about_duplicate(matchidx);
        }
        if (negated && !game.allopt[matchidx].negateok) {
            /* check for bad negation, so option functions don't have to */
            bad_negation(game.allopt[matchidx].name, (1));
            /*pline("Bad status hilite(s) specified.");*/
            return optn_err;
        }
        if (game.allopt[matchidx].optfn) {
            /*
         * Now call the option's associated function via the function
         * pointer for it in the allopt[] array, specifying a 'do_set' req.
         */
            /* things to disclose at end of game */
            /*
         * The order that the end_disclose options are stored:
         *      inventory, attribs, vanquished, genocided,
         *      conduct, overview.
         * There is an array in flags:
         *      end_disclose[NUM_DISCLOSURE_OPT];
         * with option settings for the each of the following:
         * iagvc [see disclosure_options in decl.c]:
         * Allowed setting values in that array are:
         *      DISCLOSE_PROMPT_DEFAULT_YES  ask with default answer yes
         *      DISCLOSE_PROMPT_DEFAULT_NO   ask with default answer no
         *      DISCLOSE_YES_WITHOUT_PROMPT  always disclose and don't ask
         *      DISCLOSE_NO_WITHOUT_PROMPT   never disclose and don't ask
         *      DISCLOSE_PROMPT_DEFAULT_SPECIAL  for 'vanq'/'genod' only...
         *      DISCLOSE_SPECIAL_WITHOUT_PROMPT  ...to set up sort order.
         *
         * Those setting values can be used in the option
         * string as a prefix to get the desired behavior.
         *
         * For backward compatibility, no prefix is required,
         * and the presence of a i,a,g,v, or c without a prefix
         * sets the corresponding value to DISCLOSE_YES_WITHOUT_PROMPT.
         */
            /* hilite fields in status prompt */
            op = string_for_opt(opts, (1));
            optresult = (game.allopt[matchidx].optfn)(game.allopt[matchidx].idx, do_set, negated, opts, op);
            if (optresult == optn_ok) {
                game.opt_set_in_config[matchidx] = (1);
            }
        }
    }
    if (game.program_state.in_parseoptions > 0) {
        game.program_state.in_parseoptions--;
    }
    if (!got_match) {
        if (strstr(opts, "S_") == opts && await parsesymbols(opts, PRIMARYSET)) {
            /* This specialization shouldn't be needed any longer because each of
       the individual options is part of the allopts[] list, thus already
       taken care of in the for-loop above */
            switch_symbols((1));
            check_gold_symbol();
            optresult = optn_ok;
        }
    }
    if (optresult == optn_silenterr || (got_match && game.allopt[matchidx].disregarded) || (!got_match && config_unmatched_ignored())) {
        return (0);
    }
    if (pfx_match && optresult == optn_err) {
        let pfxbuf = '';
        let pfxp = null;
        pfxbuf = nh_snprintf("parseoptions", 677, pfxbuf, 256 /* sizeof(char [256]) */, "%s", opts);
        if ((pfxp = strchr(pfxbuf, 58)) != null) {
            pfxbuf = nh_strchr_truncate(pfxbuf, 58, 'chr');
        }
        config_error_add("bad option suffix variation '%s'", pfxbuf);
        return (0);
    }
    if (got_match && optresult == optn_err) {
        return (0);
    }
    if (optresult == optn_ok) {
        return retval;
    }
    config_error_add("Unknown option '%s'", opts);
    return (0);
}
export function check_misc_menu_command(opts, op) {
    let i = 0;
    let name_to_check = null;
    for (i = 0; default_menu_cmd_info[i].name; i++) {
        /* check for menu command mapping */
        name_to_check = default_menu_cmd_info[i].name;
        if (match_optname(opts, name_to_check, strlen(name_to_check), (1))) {
            return i;
        }
    }
    return -1;
}
game.roleopt2opt = [opt_role, opt_race, opt_gender, opt_alignment];
/* role => 0, race => 1, gender => 2, alignment =>3 */
export function opt2roleopt(roleopt) {
    switch (roleopt) {
        case opt_role:
            return 0;
        case opt_race:
            return 1;
        case opt_gender:
            return 2;
        case opt_alignment:
            return 3;
        default:
            break;
    }
    return 0;
}
/* fetch saved option string for a particular option phase */
export async function getoptstr(optidx, ophase) {
    let roleoptindx = opt2roleopt(optidx);
    if (ophase == num_opt_phases) {
        let phase = 0;
        for (phase = num_opt_phases - 1; phase >= 0; --phase) {
            if (game.roleoptvals[roleoptindx][phase]) {
                /* find non-Null, in order optvals[][play_opt], [cmdline_opt],
           [environ_opt], [rc_file_opt], [syscf_opt], [builtin_opt] */
                ophase = phase;
                break;
            }
        }
    }
    if ((roleoptindx >= 0 && roleoptindx < MAX_ROLEOPT && ophase >= 0 && ophase < num_opt_phases)) {
        return game.roleoptvals[roleoptindx][ophase];
    }
    await panic("bad index roleoptvals[%d][%d]", roleoptindx, ophase);
}
/* to track some unparsed option settings in case #saveoptions needs them */
export function saveoptstr(optidx, optstr) {
    let phase = game.opt_phase;
    let roleoptindx = opt2roleopt(optidx);
    let p = strchr(optstr, 58);
    let q = strchr(optstr, 61);
    /* strip away "optname:" from optname:optstr */
    if (!p || (q && q < p)) {
        p = q;
    }
    if (p) {
        optstr = __nh_advance_str(p, 1);
    }
    if (game.roleoptvals[roleoptindx][phase]) {
        free(game.roleoptvals[roleoptindx][phase]);
    }
    game.roleoptvals[roleoptindx][phase] = dupstr(optstr);
}
/* discard specific saved option string */
export function unsaveoptstr(optidx, ophase) {
    let roleoptindx = opt2roleopt(optidx);
    if (game.roleoptvals[roleoptindx][ophase]) {
        free(game.roleoptvals[roleoptindx][ophase]) , game.roleoptvals[roleoptindx][ophase] = null;
    }
}
/* discard all saved option strings */
export function freeroleoptvals() {
    let i = 0;
    /* syntax:
     *  menu white/black message green/yellow status white/blue text
     * white/black
     */
    let j = 0;
    for (i = 0; i < 4; ++i) {
        for (j = 0; j < num_opt_phases; ++j) {
            unsaveoptstr(game.roleopt2opt[i], j);
        }
    }
}
/* not needed */
/* put roleoptvals[][] into save file; will be needed if #saveoptions
   takes place after restore */
/* get roleoptvals[][] from save file */
/* len includes terminating '\0' for non-Null values */
/* 0 */
/* common to optfn_catname(), optfn_dogname(), optfn_horsename() */
export function petname_optfn(optidx, req, negated, opts, op) {
    let failsafe = '';
    let petname = (optidx == opt_catname) ? game.catname : (optidx == opt_dogname) ? game.dogname : (optidx == opt_horsename) ? game.horsename : failsafe;
    if (req == do_init) {
        ;
    } else if (req == do_set) {
        if (op == game.empty_optstr && !negated) {
            return optn_err;
        }
        if (negated || !strcmp(op, "none") || !strcmp(op, none)) {
            op = game.empty_optstr;
        }
        nmcpy(petname, op, 63);
        sanitize_name(petname);
    } else if (req == get_val || req == get_cnf_val) {
        failsafe = '';
        opts = sprintf(opts, "%s", __nh_char_at0(petname) ? petname : (req == get_cnf_val) ? "none" : none);
    }
    /* context.botlx = TRUE ought to suffice
                                    * but doesn't for X11 fancy status */
    return optn_ok;
}
/*
 **********************************
 *
 *   Per-option Functions
 *
 **********************************
 */
export async function optfn_alignment(optidx, req, negated, opts, op) {
    if (req == do_init) {
        /* If initial, then initoptions is allowed to do it instead
         * of here (initoptions always has to do it even if there's
         * no fruit option at all.  Also, we don't want people
         * setting multiple fruits in their options.)
         */
        /*
     * Player can change required response for some prompts (quit, die,
     * attack, save-bones, continue-eating, break-wand, Were-change to
     * need to be "yes<return>" instead of just 'y' keystroke to accept.
     *
     * For paranoid_confirm:Confirm, these prompts also need "no<return>"
     * instead of 'n' or <space> or <return> to reject.  (<escape> always
     * works as a way to reject.)
     *
     * Player can add an extra prompt (pray, AutoAll) that isn't
     * ordinarily there.  (They ask for 'y' keystroke unless Confirm is
     * also set, then they'll switch to "yes<return>", "no<return>".)
     *
     * Player can also change game's behavior.  paranoid_confirm:swim
     * can be used to prevent accidentally stepping into water or lava;
     * player must use the 'm' movement prefix to do that intentionally.
     * paranoid_confirm:Remove [with synonym parnoid_confirm:Takeoff]
     * changes the 'R' and 'T' commands [which have differing criteria
     * for "only one candidate item"] to prompt for inventory item to
     * remove/takeoff when there is only one candidate, so allows player
     * a chance to cancel at the pick-an-item prompt or menu.
     */
        /* old, TEMPORARY method of controlling 'perm_invent';
           note: the bits used now have been changed, hence 'n << 1' */
        return optn_ok;
    }
    if (req == do_set) {
        if (!await parse_role_opt(optidx, negated, game.allopt[optidx].name, opts, { get value() { return op; }, set value(_v) { op = _v; } })) {
            return optn_silenterr;
        }
        if (__nh_char_at0(op) != 33) {
            if ((game.flags.initalign = await str2align(op)) == (-1)) {
                config_error_add("Unknown %s '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
            saveoptstr(optidx, ((game.flags.initalign >= 0) ? aligns[game.flags.initalign].adj : (game.flags.initalign == (-2)) ? randomrole : none));
        }
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", ((game.flags.initalign >= 0) ? aligns[game.flags.initalign].adj : (game.flags.initalign == (-2)) ? randomrole : none));
        return optn_ok;
    }
    if (req == get_cnf_val) {
        op = await get_cnf_role_opt(optidx);
        opts = strcpy(opts, op ? op : "none");
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_align_message(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        /* WINCAP align_message:[left|top|right|bottom] */
        /* WINCAP align_status:[left|top|right|bottom] */
        /* WINCAP
         *
         *  map_mode:[tiles|ascii4x6|ascii6x8|ascii8x8|ascii16x8|ascii7x12
         *            |ascii8x12|ascii16x12|ascii12x16|ascii10x18|fit_to_screen
         *            |ascii_fit_to_screen|tiles_fit_to_screen]
         */
        /* pile limit: when walking over objects, number which triggers
           "there are several/many objects here" instead of listing them
         */
        /* WINCAP player_selection: dialog | prompt/prompts/prompting */
        /* WINCAP2
         * statuslines:n */
        op = string_for_opt(opts, negated);
        if ((op != game.empty_optstr) && !negated) {
            if (!strncmpi(op, "left", 5 /* sizeof(char [5]) */ - 1)) {
                game.iflags.wc_align_message = 1;
            } else if (!strncmpi(op, "top", 4 /* sizeof(char [4]) */ - 1)) {
                game.iflags.wc_align_message = 3;
            } else if (!strncmpi(op, "right", 6 /* sizeof(char [6]) */ - 1)) {
                game.iflags.wc_align_message = 2;
            } else if (!strncmpi(op, "bottom", 7 /* sizeof(char [7]) */ - 1)) {
                game.iflags.wc_align_message = 4;
            } else {
                /* didn't match anything, so arg is bad;
                   any flags already modified will stay modified */
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
        } else if (negated) {
            /* 'op != empty_optstr' to get here */
            /* reject "!perminv_mode=foo" */
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        let which = 0;
        which = game.iflags.wc_align_message;
        opts = sprintf(opts, "%s", (which == 3) ? "top" : (which == 1) ? "left" : (which == 4) ? "bottom" : (which == 2) ? "right" : defopt);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_align_misc(optidx);
    }
    return optn_ok;
}
export async function optfn_align_status(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if ((op != game.empty_optstr) && !negated) {
            if (!strncmpi(op, "left", 5 /* sizeof(char [5]) */ - 1)) {
                game.iflags.wc_align_status = 1;
            } else if (!strncmpi(op, "top", 4 /* sizeof(char [4]) */ - 1)) {
                game.iflags.wc_align_status = 3;
            } else if (!strncmpi(op, "right", 6 /* sizeof(char [6]) */ - 1)) {
                game.iflags.wc_align_status = 2;
            } else if (!strncmpi(op, "bottom", 7 /* sizeof(char [7]) */ - 1)) {
                game.iflags.wc_align_status = 4;
            } else {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        let which = 0;
        which = game.iflags.wc_align_status;
        opts = sprintf(opts, "%s", (which == 3) ? "top" : (which == 1) ? "left" : (which == 4) ? "bottom" : (which == 2) ? "right" : defopt);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_align_misc(optidx);
    }
    return optn_ok;
}
export function optfn_altkeyhandling(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        ((negated));
        ((op));
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        /* note: always leaves enough room for caller to tack on '\n' */
        /* TODO: wide 'get_val' may need to be wrapped in the menu display */
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
const __optfn_autounlock_plus = " + ";
export async function optfn_autounlock(optidx, req, negated, opts, op) {
    if (req == do_init) {
        game.flags.autounlock = 2;
        return optn_ok;
    }
    if (req == do_set) {
        /* autounlock:none or autounlock:untrap+apply-key+kick+force;
           autounlock without a value is same as autounlock:apply-key and
           !autounlock is same as autounlock:none; multiple values can be
           space separated or plus-sign separated but the same separation
           must be used for each element, not mix&match */
        let sep = 0;
        let nxt = null;
        let newflags = 0;
        /*
     * Relies on spaces to line things up in columns, so must be rendered
     * with a fixed-width font or will look dreadful.
     */
        let i = 0;
        if ((op = string_for_opt(opts, (1))) == game.empty_optstr) {
            game.flags.autounlock = negated ? 0 : 2;
            return optn_ok;
        }
        newflags = 0;
        sep = strchr(op, 43) ? 43 : 32;
        while (op) {
            let matched = (0);
            /* might have leading space */
            op = trimspaces(op);
            if ((nxt = strchr(op, sep)) != null) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
                /* might have trailing space after
                                      * plus sign removal */
                op = trimspaces(op);
            }
            if (str_start_is("none", op, (1))) {
                negated = (1) , matched = (1);
            }
            for (i = 0; i < (Math.trunc(64 /* sizeof(const char *[4][2]) */ / 16 /* sizeof(const char *[2]) */)) && !matched; ++i) {
                if (str_start_is(unlocktypes[i][0], op, (1)) || fuzzymatch(op, unlocktypes[i][0], " -_", (1))) {
                    /* fuzzymatch() doesn't match leading substrings but
                       this allows "apply_key" and "applykey" to match
                       "apply-key"; "apply key" too if part of foo+bar */
                    matched = (1);
                    switch (__nh_char_at0(op)) {
                        /* maximum burden picked up before prompt (Warren Cheung) */
                        case 117:
                            newflags |= 1;
                            break;
                        case 97:
                            newflags |= 2;
                            break;
                        case 107:
                            newflags |= 4;
                            break;
                        /* full: choose class(es) by first menu,
                     choose items within selected class(es) by second menu */
                        case 102:
                            newflags |= 8;
                            break;
                        default:
                            matched = (0);
                            break;
                    }
                }
            }
            if (!matched) {
                config_error_add("Invalid value for \"%s\": \"%s\"", game.allopt[optidx].name, op);
                return optn_silenterr;
            }
            op = nxt;
        }
        if (negated && newflags != 0) {
            config_error_add("Invalid value combination for \"%s\": 'none' with some", game.allopt[optidx].name);
            return optn_silenterr;
        }
        game.flags.autounlock = newflags;
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (!game.flags.autounlock) {
            opts = strcpy(opts, "none");
        } else {
            let p = "";
            opts.value = 0;
            if (game.flags.autounlock & 1) {
                opts = __nh_buf_append(opts, sprintf('', "%s%s", p, unlocktypes[0][0])) , p = __optfn_autounlock_plus;
            }
            if (game.flags.autounlock & 2) {
                opts = __nh_buf_append(opts, sprintf('', "%s%s", p, unlocktypes[1][0])) , p = __optfn_autounlock_plus;
            }
            if (game.flags.autounlock & 4) {
                opts = __nh_buf_append(opts, sprintf('', "%s%s", p, unlocktypes[2][0])) , p = __optfn_autounlock_plus;
            }
            if (game.flags.autounlock & 8) {
                opts = __nh_buf_append(opts, sprintf('', "%s%s", p, unlocktypes[3][0]));
            }
        }
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_autounlock(optidx);
    }
    return optn_ok;
}
export function optfn_boulder(optidx, req, negated, opts, op) {
    let clash = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        /* if ((opts = string_for_env_opt(allopt[optidx].name, opts, FALSE))
               == empty_optstr)
         */
        if ((opts = string_for_opt(opts, (0))) == game.empty_optstr) {
            return (0);
        }
        escapes(opts, opts);
        /* note: dummy monclass #0 has symbol value '\0'; we allow that--
           attempting to set bouldersym to '^@'/'\0' will reset to default */
        if (def_char_to_monclass(__nh_char_at0(opts)) != MAXMCLASSES) {
            clash = __nh_char_at0(opts) ? 1 : 0;
        } else if (__nh_char_at0(opts) >= 49 && __nh_char_at0(opts) < 6 + 48) {
            clash = 2;
        }
        if (__nh_char_at0(opts) < 32) {
            config_error_add("boulder symbol cannot be a control character");
            return optn_ok;
        } else if (clash) {
            /* symbol chosen matches a used monster or warning
               symbol which is not good - reject it */
            config_error_add("Badoption - boulder symbol '%s' would conflict with a %s symbol", visctrl(__nh_char_at0(opts)), (clash == 1) ? "monster" : "warning");
        } else {
            /*
             * Override the default boulder symbol.
             */
            game.ov_primary_syms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] = __nh_char_at0(opts);
            game.ov_rogue_syms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] = __nh_char_at0(opts);
            if (!game.opt_initial) {
                /* for 'initial', update of BOULDER symbol is done in
               initoptions_finish(), after all symset options
               have been processed */
                let sym = get_othersym(SYM_BOULDER, (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) ? ROGUESET : PRIMARYSET);
                if (sym) {
                    game.showsyms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] = sym;
                }
                /* [FIXME?  redraw seems like overkill; botl update should suffice] */
                /* FIXME: TTY_PERM_INVENT will blank WIN_INVEN when changing
               perminv_mode while perm_invent is already on; to remedy that,
               turn it off and then back on when already on */
                game.opt_need_redraw = (1);
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        opts = sprintf(opts, "%c", game.ov_primary_syms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] ? game.ov_primary_syms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] : game.showsyms[game.objects[BOULDER].oc_class + ((0) + MAXPCHARS)]);
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_catname(optidx, req, negated, opts, op) {
    return petname_optfn(optidx, req, negated, opts, op);
}
export function optfn_crash_email(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        /* scores:5t[op] 5a[round] o[wn] */
        if ((op = string_for_opt(opts, (0))) == game.empty_optstr) {
            return optn_err;
        }
        if (game.crash_email) {
            free(game.crash_email);
        }
        game.crash_email = dupstr(op);
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        /* setting status condition options goes through pfxfn_cond_() */
        /* opts[] is used as an output argument */
        if (!opts) {
            return optn_err;
        }
        if (game.crash_email) {
            opts = sprintf(opts, "%s", game.crash_email);
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_crash_name(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = string_for_opt(opts, (0))) == game.empty_optstr) {
            return optn_err;
        }
        if (game.crash_name) {
            free(game.crash_name);
        }
        game.crash_name = dupstr(op);
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (!opts) {
            return optn_err;
        }
        if (game.crash_name) {
            opts = sprintf(opts, "%s", game.crash_name);
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_crash_urlmax(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = string_for_opt(opts, (0))) != game.empty_optstr) {
            let temp = atoi(op);
            if (temp < 75) {
                config_error_add("Invalid value %d for crash_urlmax.  Minimum value is 75.", temp);
                return optn_err;
            }
            game.crash_urlmax = temp;
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (!opts) {
            return optn_err;
        }
        opts = sprintf(opts, "%d", game.crash_urlmax);
        return optn_ok;
    }
    return optn_ok;
}
/* CRASHREPORT */
/* "cursesgraphics" */
/* There is no rogue level cursesgraphics-specific set */
export function optfn_DECgraphics(optidx, req, negated, opts, op) {
    let badflag = (0);
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (!negated) {
            if (game.symset[PRIMARYSET].name) {
                /* There is no rogue level DECgraphics-specific set */
                badflag = (1);
            } else {
                game.symset[PRIMARYSET].name = dupstr(game.allopt[optidx].name);
                if (!read_sym_file(PRIMARYSET)) {
                    badflag = (1);
                    clear_symsetentry(PRIMARYSET, (1));
                } else {
                    switch_symbols((1));
                }
            }
            if (badflag) {
                config_error_add("Failure to load symbol set %s.", game.allopt[optidx].name);
                return optn_err;
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
let __optfn_disclose_valid_settings = [121, 110, 63, 43, 45, 35, 0];
__nh_register_static(() => { __optfn_disclose_valid_settings = [121, 110, 63, 43, 45, 35, 0]; });
export async function optfn_disclose(optidx, req, negated, opts, op) {
    let i = 0;
    let idx = 0;
    let prefix_val = 0;
    let num = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, (1));
        if (op != game.empty_optstr && negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        if (op == game.empty_optstr || !strncmpi((op), ("all"), -1) || !strncmpi((op), ("none"), -1)) {
            /* "disclose" without a value means "all with prompting"
           and negated means "none without prompting" */
            if (op != game.empty_optstr && !strncmpi((op), ("none"), -1)) {
                negated = (1);
            }
            for (num = 0; num < 6; num++) {
                game.flags.end_disclose[num] = negated ? 45 : 121;
            }
            return optn_ok;
        }
        num = 0;
        prefix_val = -1;
        while (__nh_char_at0(op) && num < 7 /* sizeof(char [7]) */ - 1) {
            let c = 0;
            let dop = null;
            c = lowc(__nh_char_at0(op));
            if (c == 107) {
                c = 118;
            }
            if (c == 100) {
                c = 111;
            }
            dop = strchr(disclosure_options, c);
            if (dop) {
                idx = ((disclosure_options.length - dop.length));
                if (idx < 0 || idx > 6 - 1) {
                    await impossible("bad disclosure index %d %c", idx, c);
                    /* just handled '?'; there might be more picks */
                    continue;
                }
                if (prefix_val != -1) {
                    if (__nh_char_at0(dop) != 118 && __nh_char_at0(dop) != 103) {
                        if (prefix_val == 63) {
                            prefix_val = 121;
                        }
                        if (prefix_val == 35) {
                            prefix_val = 43;
                        }
                    }
                    game.flags.end_disclose[idx] = prefix_val;
                    prefix_val = -1;
                } else {
                    game.flags.end_disclose[idx] = 43;
                }
            } else if (strchr(__optfn_disclose_valid_settings, c)) {
                prefix_val = c;
            } else if (c == 32) {
                ;
            } else {
                config_error_add("Unknown %s parameter '%c'", game.allopt[optidx].name, __nh_char_at0(op));
                return optn_err;
            }
            (op = __nh_advance_str(op, 1));
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        for (i = 0; i < 6; i++) {
            if (i) {
                opts = strkitten(opts, 32);
            }
            opts = strkitten(opts, game.flags.end_disclose[i]);
            opts = strkitten(opts, disclosure_options[i]);
        }
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_disclose();
    }
    return optn_ok;
}
export function optfn_dogname(optidx, req, negated, opts, op) {
    return petname_optfn(optidx, req, negated, opts, op);
}
export function optfn_dungeon(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", to_be_done);
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_effects(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", to_be_done);
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_font_map(optidx, req, negated, opts, op) {
    /* send them over to the prefix handling for font_ */
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_menu(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_message(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_size_map(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_size_menu(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_size_message(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_size_status(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_size_text(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_status(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export function optfn_font_text(optidx, req, negated, opts, op) {
    return pfxfn_font(optidx, req, negated, opts, op);
}
export async function optfn_fruit(optidx, req, negated, opts, op) {
    let forig = null;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        goodfruit: {
            op = string_for_opt(opts, negated || !game.opt_initial);
            if (negated) {
                if (op != game.empty_optstr) {
                    bad_negation("fruit", (1));
                    return optn_err;
                }
                op = game.empty_optstr;
                break goodfruit;
            }
            if (op == game.empty_optstr) {
                return optn_err;
            }
            /* strip leading/trailing spaces, condense internal ones (3.6.2) */
            /*
         * Multiple settings for paranoid_confirmation are allowed.
         * When a new instance is processed, the behavior depends on the
         * first character of its value:
         *
         * paranoid_confirm:foo bar
         *   clears all confirmation bits (from previous settings, including
         *   default), then sets the bits for foo and bar;
         *
         * paranoid_confirm:+foo bar
         *   existing bits are kept, plus those for foo and bar are set;
         *
         * paranoid_confirm:-foo bar
         *   existing bits are kept except those for foo and bar get cleared;
         *
         * paranoid_confirm:+foo !bar
         *   combination of paranoid_confirm:+foo,paranoid_confirm:-bar;
         *
         * paranoid_confirm:-foo !bar
         *   the negation in '!bar' is ignored, treated as if '-foo bar';
         *
         * !paranoid_confirm
         *   without a value is treated as paranoid_confirm:none and clears
         *   all bits;
         * !paranoid_confirm:anything
         *   (including +anything_else or -anything_else) is disallowed;
         *
         * paranoid_confirm:+all is the same as paranoid_confirm:all;
         * paranoid_confirm:-all is the same as paranoid_confirm:none;
         * paranoid_confirm:+none and paranoid_confirm:-none are no-ops.
         */
            op = mungspaces(op);
            if (!game.opt_initial) {
                let f = null;
                let fnum = 0;
                f = await fruit_from_name(op, (0), { get value() { return fnum; }, set value(_v) { fnum = _v; } });
                if (!f) {
                    if (!game.flags.made_fruit) {
                        forig = await fruit_from_name(game.pl_fruit, (0), null);
                    }
                    if (!forig && fnum >= 100) {
                        config_error_add("Doing that so many times isn't very fruitful.");
                        return optn_ok;
                    }
                }
            }
        }
        nmcpy(game.pl_fruit, op, 32);
        sanitize_name(game.pl_fruit);
        /* OBJ_NAME(objects[SLIME_MOLD]) won't work for this after
           initialization; it gets changed to generic "fruit" */
        if (!game.pl_fruit) {
            nmcpy(game.pl_fruit, "slime mold", 32);
        }
        if (!game.opt_initial) {
            await fruitadd(game.pl_fruit, forig);
            if (game.give_opt_msg) {
                await pline("Fruit is now \"%s\".", game.pl_fruit);
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", game.pl_fruit);
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_gender(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (!await parse_role_opt(optidx, negated, game.allopt[optidx].name, opts, { get value() { return op; }, set value(_v) { op = _v; } })) {
            return optn_silenterr;
        }
        if (__nh_char_at0(op) != 33) {
            if ((game.flags.initgend = await str2gend(op)) == (-1)) {
                config_error_add("Unknown %s '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
            game.flags.female = game.flags.initgend;
            saveoptstr(optidx, ((game.flags.initgend >= 0) ? genders[game.flags.initgend].adj : (game.flags.initgend == (-2)) ? randomrole : none));
        }
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", ((game.flags.initgend >= 0) ? genders[game.flags.initgend].adj : (game.flags.initgend == (-2)) ? randomrole : none));
        return optn_ok;
    }
    if (req == get_cnf_val) {
        op = await get_cnf_role_opt(optidx);
        opts = strcpy(opts, op ? op : "none");
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_glyph(optidx, req, negated, opts, op) {
    let glyph = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (negated) {
            if (op != game.empty_optstr) {
                /* OPTION=glyph:G_glyph/U+NNNN/r-g-b */
                bad_negation("glyph", (1));
                return optn_err;
            }
        }
        if (op == game.empty_optstr) {
            return optn_err;
        }
        op = mungspaces(op);
        if (!await glyphrep_to_custom_map_entries(op, { get value() { return glyph; }, set value(_v) { glyph = _v; } })) {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", to_be_done);
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_hilite_status(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, (1));
        if (op != game.empty_optstr && negated) {
            clear_status_hilites();
            return optn_ok;
        } else if (op == game.empty_optstr) {
            config_error_add("Value is mandatory for hilite_status");
            return optn_err;
        }
        if (!parse_status_hl1(op, game.opt_from_file)) {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        if (req == get_val) {
            opts = strcpy(opts, await count_status_hilites() ? "(see \"status highlight rules\" below)" : "(none)");
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_horsename(optidx, req, negated, opts, op) {
    return petname_optfn(optidx, req, negated, opts, op);
}
export function optfn_IBMgraphics(optidx, req, negated, opts, op) {
    let sym_name = game.allopt[optidx].name;
    let badflag = (0);
    let i = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (!negated) {
            for (i = 0; i < NUM_GRAPHICS; ++i) {
                if (game.symset[i].name) {
                    badflag = (1);
                } else {
                    if (i == ROGUESET) {
                        sym_name = "RogueIBM";
                    }
                    game.symset[i].name = dupstr(sym_name);
                    if (!read_sym_file(i)) {
                        badflag = (1);
                        clear_symsetentry(i, (1));
                        break;
                    }
                }
            }
            if (badflag) {
                config_error_add("Failure to load symbol set %s.", sym_name);
                return optn_err;
            } else {
                switch_symbols((1));
                if (!game.opt_initial && (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                    assign_graphics(ROGUESET);
                }
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_map_mode(optidx, req, negated, opts, op) {
    let i = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if (op != game.empty_optstr && !negated) {
            let save_map_mode = game.iflags.wc_map_mode;
            if (!strncmpi((op), ("tiles"), -1)) {
                game.iflags.wc_map_mode = 0;
            } else if (!strncmpi(op, "ascii4x6", 9 /* sizeof(char [9]) */ - 1)) {
                game.iflags.wc_map_mode = 1;
            } else if (!strncmpi(op, "ascii6x8", 9 /* sizeof(char [9]) */ - 1)) {
                game.iflags.wc_map_mode = 2;
            } else if (!strncmpi(op, "ascii8x8", 9 /* sizeof(char [9]) */ - 1)) {
                game.iflags.wc_map_mode = 3;
            } else if (!strncmpi(op, "ascii16x8", 10 /* sizeof(char [10]) */ - 1)) {
                game.iflags.wc_map_mode = 4;
            } else if (!strncmpi(op, "ascii7x12", 10 /* sizeof(char [10]) */ - 1)) {
                game.iflags.wc_map_mode = 5;
            } else if (!strncmpi(op, "ascii8x12", 10 /* sizeof(char [10]) */ - 1)) {
                game.iflags.wc_map_mode = 6;
            } else if (!strncmpi(op, "ascii16x12", 11 /* sizeof(char [11]) */ - 1)) {
                game.iflags.wc_map_mode = 7;
            } else if (!strncmpi(op, "ascii12x16", 11 /* sizeof(char [11]) */ - 1)) {
                game.iflags.wc_map_mode = 8;
            } else if (!strncmpi(op, "ascii10x18", 11 /* sizeof(char [11]) */ - 1)) {
                game.iflags.wc_map_mode = 9;
            } else if (!strncmpi(op, "fit_to_screen", 14 /* sizeof(char [14]) */ - 1)) {
                game.iflags.wc_map_mode = 10;
            } else if (!strncmpi(op, "ascii_fit_to_screen", 20 /* sizeof(char [20]) */ - 1)) {
                game.iflags.wc_map_mode = 10;
            } else if (!strncmpi(op, "tiles_fit_to_screen", 20 /* sizeof(char [20]) */ - 1)) {
                game.iflags.wc_map_mode = 11;
            } else {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
            if (wc_supported("map_mode")) {
                if (!game.iflags.wc_map_mode || save_map_mode != game.iflags.wc_map_mode) {
                    (game.windowprocs.win_preference_update)("map_mode");
                }
            }
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        i = game.iflags.wc_map_mode;
        opts = sprintf(opts, "%s", (i == 0) ? "tiles" : (i == 1) ? "ascii4x6" : (i == 2) ? "ascii6x8" : (i == 3) ? "ascii8x8" : (i == 4) ? "ascii16x8" : (i == 5) ? "ascii7x12" : (i == 6) ? "ascii8x12" : (i == 7) ? "ascii16x12" : (i == 8) ? "ascii12x16" : (i == 9) ? "ascii10x18" : (i == 10) ? "fit_to_screen" : defopt);
        return optn_ok;
    }
    return optn_ok;
}
/* all the key assignment options for menu_* commands are identical
   but optlist.h treats them as distinct rather than sharing one */
export async function shared_menu_optfn(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        let res = check_misc_menu_command(opts, op);
        if (res < 0) {
            return optn_err;
        }
        return await spcfn_misc_menu_cmd(res, req, negated, opts, op);
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", to_be_done);
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_menu_deselect_all(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_deselect_page(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_first_page(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_invert_all(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_invert_page(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_last_page(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_next_page(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_previous_page(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_search(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_select_all(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_select_page(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_shift_left(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
export async function optfn_menu_shift_right(optidx, req, negated, opts, op) {
    return await shared_menu_optfn(optidx, req, negated, opts, op);
}
/* end of shared key assignments for menu commands */
export async function optfn_menu_headings(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        let ca = { color: 0, attr: 0 };
        if (op == game.empty_optstr) {
            /* OPTIONS=menu_headings w/o value => no-color&inverse;
               OPTIONS=!menu_headings => no-color&none */
            game.iflags.menu_headings.attr = negated ? 0 : 7;
            game.iflags.menu_headings.color = 8;
            return optn_ok;
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_silenterr;
        }
        if (!color_attr_parse_str(ca, op)) {
            return optn_err;
        }
        Object.assign(game.iflags.menu_headings, ca);
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        let ca_buf = '';
        ca_buf = strcpy(ca_buf, color_attr_to_str(game.iflags.menu_headings));
        /* change "no color" to "no-color" or "light blue" to "light-blue" */
        strNsubst(ca_buf, " ", "-", 0);
        opts = strcpy(opts, ca_buf);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_menu_headings();
    }
    return optn_ok;
}
const __optfn_menu_objsyms_alt5 = "one-or-the-other";
export async function optfn_menu_objsyms(optidx, req, negated, opts, op) {
    if (req == do_init) {
        /* set iflags.menu_objsyms to 4, "conditional"; also sets
           iflags.menu_head_objsym to False and
           iflags.use_menu_glyphs True */
        set_menuobjsyms_flags(4);
        return optn_ok;
    }
    if (req == do_set) {
        let k = 0;
        let l = 0;
        let i = 0;
        let osyms = 0;
        if (negated) {
            /* allow '!menu_objsyms' (and '!use_menu_glyphs') as
               'menu_objsyms:none' (0) */
            osyms = 0;
        } else if (op == game.empty_optstr) {
            /* treat boolean 'menu_objsyms' as 'menu_objsyms:headers' (1)
               accept obsolete boolean 'use_menu_glyphs' as a synonym
               for 'menu_objsyms:entries' (2) */
            osyms = !strncmp(opts, "use_menu_glyphs", 15) ? 2 : 1;
        } else if (digit(__nh_char_at0(op))) {
            i = atoi(op);
            if (i >= (Math.trunc(6 /* sizeof(const struct objsymopt [6]) */ / 1 /* sizeof(const struct objsymopt) */))) {
                config_error_add("Illegal %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
            osyms = i;
        } else {
            /* stilted "one-or-other" is used to compress the menu width */
            let l5 = (17 /* sizeof(const char [17]) */ - 1 /* sizeof(char [1]) */);
            osyms = 0;
            k = strlen(op);
            for (i = 0; i < (Math.trunc(6 /* sizeof(const struct objsymopt [6]) */ / 1 /* sizeof(const struct objsymopt) */)); ++i) {
                l = strlen(objsymvals[i].nam);
                if (k >= 4) {
                    l = k;
                }
                if (!strncmpi(objsymvals[i].nam, op, l) || (i == 5 && !strncmpi(__optfn_menu_objsyms_alt5, op, l5))) {
                    osyms = i;
                    break;
                }
            }
        }
        set_menuobjsyms_flags(osyms);
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", objsymvals[game.iflags.menuobjsyms].nam);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_menu_objsyms();
    }
    return optn_ok;
}
export function optfn_menuinvertmode(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (op != game.empty_optstr) {
            /* menuinvertmode=0 or 1 or 2 (2 is experimental) */
            let mode = atoi(op);
            if (mode < 0 || mode > 2) {
                config_error_add("Illegal %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
            game.iflags.menuinvertmode = mode;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%d", game.iflags.menuinvertmode);
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_menustyle(optidx, req, negated, opts, op) {
    let tmp = 0;
    /* no initializer based on opts because this can be
                             called with init and invalid opts and op */
    let val_required = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        /* menustyle:traditional or combination or full or partial */
        val_required = (strlen(opts) > 5 && !negated);
        if ((op = string_for_opt(opts, !val_required)) == game.empty_optstr) {
            if (val_required) {
                return optn_err;
            }
            /* string_for_opt gave feedback */
            tmp = negated ? 110 : 102;
        } else {
            tmp = lowc(__nh_char_at0(op));
        }
        switch (tmp) {
            case 110:
            case 116:
                game.flags.menu_style = 0;
                break;
            /* combination: prompt for class(es) by symbol,
                     choose items within selected class(es) by menu */
            case 99:
                game.flags.menu_style = 1;
                break;
            case 102:
                /* Use IBM defaults. Can be overridden via config file */
                game.flags.menu_style = 2;
                break;
            /* partial: skip class filtering, choose items among all
                     classes by menu */
            case 112:
                game.flags.menu_style = 3;
                break;
            default:
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", menutype[game.flags.menu_style][0]);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_menustyle();
    }
    return optn_ok;
}
export function optfn_monsters(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
const __optfn_mouse_support_mousemodes = [["0=off", ""], ["1=on", ", O/S adjusted"], ["2=on", ", O/S unchanged"]];
export function optfn_mouse_support(optidx, req, negated, opts, op) {
    let compat = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        compat = (strlen(opts) <= 13);
        op = string_for_opt(opts, (compat || !game.opt_initial));
        if (op == game.empty_optstr) {
            if (compat || negated || game.opt_initial) {
                /* for backwards compatibility, "mouse_support" without a
                   value is a synonym for mouse_support:1 */
                game.iflags.wc_mouse_support = !negated;
            }
        } else {
            let mode = atoi(op);
            if (mode < 0 || mode > 2 || (mode == 0 && __nh_char_at0(op) != 48)) {
                config_error_add("Illegal %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            } else {
                game.iflags.wc_mouse_support = mode;
            }
        }
        return optn_ok;
    }
    if (req == get_val) {
        let ms = game.iflags.wc_mouse_support;
        if (ms >= 0 && ms <= 2) {
            opts = sprintf(opts, "%s%s", __optfn_mouse_support_mousemodes[ms][0], __optfn_mouse_support_mousemodes[ms][1]);
        }
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = sprintf(opts, "%i", game.iflags.wc_mouse_support);
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_msg_window(optidx, req, negated, opts, op) {
    let retval = optn_ok;
    let tmp = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (op == game.empty_optstr) {
            /* msg_window:single, combo, full or reversed */
            /* allow option to be silently ignored by non-tty ports */
            tmp = negated ? 115 : 102;
        } else {
            if (negated) {
                bad_negation(game.allopt[optidx].name, (1));
                return optn_err;
            }
            tmp = lowc(__nh_char_at0(op));
        }
        switch (tmp) {
            /* single message history cycle (default if negated) */
            case 115:
            case 99:
            case 102:
            case 114:
                game.iflags.prevmsg_window = tmp;
                break;
            default:
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                retval = optn_err;
        }
        return retval;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        tmp = game.iflags.prevmsg_window;
        if ((game.windowprocs.wp_id == wp_curses)) {
            if (tmp == 115 || tmp == 99) {
                tmp = game.iflags.prevmsg_window = 114;
            }
        }
        opts = sprintf(opts, "%s", (tmp == 115) ? "single" : (tmp == 99) ? "combination" : (tmp == 102) ? "full" : "reversed");
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_msg_window();
    }
    return optn_ok;
}
export async function optfn_msghistory(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = await string_for_env_opt(game.allopt[optidx].name, opts, negated);
        if ((negated && op == game.empty_optstr) || (!negated && op != game.empty_optstr)) {
            game.iflags.msg_history = negated ? 0 : atoi(op);
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%u", game.iflags.msg_history);
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_name(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = await string_for_env_opt(game.allopt[optidx].name, opts, (0))) != game.empty_optstr) {
            nmcpy(game.plname, op, 32);
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", game.plname);
        return optn_ok;
    }
    return optn_ok;
}
const __optfn_number_pad_numpadmodes = ["0=off", "1=on", "2=on, MSDOS compatible", "3=on, phone-style layout", "4=on, phone layout, MSDOS compatible", "-1=off, y & z swapped"];
export async function optfn_number_pad(optidx, req, negated, opts, op) {
    let compat = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        compat = (strlen(opts) <= 10);
        op = string_for_opt(opts, (compat || !game.opt_initial));
        if (op == game.empty_optstr) {
            if (compat || negated || game.opt_initial) {
                /* for backwards compatibility, "number_pad" without a
                   value is a synonym for number_pad:1 */
                game.iflags.num_pad = !negated;
                game.iflags.num_pad_mode = 0;
            }
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        } else {
            let mode = atoi(op);
            if (mode < -1 || mode > 4 || (mode == 0 && __nh_char_at0(op) != 48)) {
                config_error_add("Illegal %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            } else if (mode <= 0) {
                game.iflags.num_pad = (0);
                /* German keyboard; y and z keys swapped */
                game.iflags.num_pad_mode = (mode < 0);
            } else {
                game.iflags.num_pad = (1);
                game.iflags.num_pad_mode = 0;
                /* PC Hack / MSDOS compatibility */
                if (mode == 2 || mode == 4) {
                    game.iflags.num_pad_mode |= 1;
                }
                if (mode == 3 || mode == 4) {
                    game.iflags.num_pad_mode |= 2;
                }
            }
        }
        reset_commands((0));
        (game.windowprocs.win_number_pad)(game.iflags.num_pad ? 1 : 0);
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        let indx = game.Cmd.num_pad ? (game.Cmd.phone_layout ? (game.Cmd.pcHack_compat ? 4 : 3) : (game.Cmd.pcHack_compat ? 2 : 1)) : game.Cmd.swap_yz ? 5 : 0;
        if (req == get_val) {
            opts = strcpy(opts, __optfn_number_pad_numpadmodes[indx]);
        } else {
            opts = sprintf(opts, "%i", (indx == 5) ? -1 : indx);
        }
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_number_pad();
    }
    return optn_ok;
}
export function optfn_objects(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", to_be_done);
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_packorder(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (op == game.empty_optstr) {
            return optn_err;
        }
        if (!change_inv_order(op)) {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        let ocl = '';
        await oc_to_str(game.flags.inv_order, ocl);
        opts = sprintf(opts, "%s", ocl);
        return optn_ok;
    }
    return optn_ok;
}
/*
             *  palette (adjust an RGB color in palette (color/R-G-B)
             */
/* old MACOS9 OS9 code */
/* HARDCODED inverse number */
/* ----------- Mac OS 9 code -------------------------*/
/* Assumes ASCII... */
/* Digits in ASCII too... */
/* Add an extra so we fill f -> ff and 0 -> 00 */
/* 0 */
/* CHANGE_COLOR */
/* for "paranoid_confirmation:foo" and alias "[!]prayconfirm" */
export async function optfn_paranoid_confirmation(optidx, req, opt_negated, opts, op) {
    let fld_negated = 0;
    let i = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        let prayconfirm = '';
        let pp = null;
        let plus_or_minus = (0);
        if (!strncmpi(opts, "prayconfirm", 4)) {
            if (__nh_char_at0(op)) {
                /*
         * "prayconfirm" used to be a separate boolean option,
         * now it is a synonym for paranoid_confirm:+pray and
         * "!prayconfirm" has become one for paranoid_confirm:-pray.
         */
                /* presence of any value is treated as an error whether
                   complaining about the 'prayconfirm' deprecation or not;
                   this will erroneously reject "prayconfirm:true"; too
                   bad; back when prayconfirm was in active use, tacking on
                   an explicit value to a boolean option wasn't supported */
                config_error_add("deprecated %sprayconfirm option takes no parameters (found '%s')", opt_negated ? "!" : "", op);
                return optn_silenterr;
            }
            /* config file summary of complaints includes this in the count
               of errors; we'd prefer that it be described as a warning but
               that isn't supported [not important since this is considered
               temporary until 'prayconfirm' gets removed altogether] */
            config_error_add("%sprayconfirm option is deprecated; switching to %s:%cpray", opt_negated ? "!" : "", game.allopt[optidx].name, opt_negated ? 45 : 43);
            prayconfirm = sprintf(prayconfirm, "%cpray", opt_negated ? 45 : 43);
            /* convert prayconfirm to paranoid_confirm:+pray and
               !prayconfirm to paranoid_confirm:-pray */
            op = prayconfirm;
            /* possibly changing !prayconfirm to paranoid_confirm:-pray
               which clears a paranoia bit but isn't a negated option */
            /*
         * end of 'prayconfirm' processing
         */
            opt_negated = (0);
        } else if (opt_negated) {
            if (!__nh_char_at0(op)) {
                /* "!paranoid_confirm" w/o args is same as paranoid_confirm:none;
               "!paranoid_confirm:anything" is disallowed */
                /* new value; first clear all old bits */
                /* player didn't cancel; we reset all the paranoia options
           here even if there were no items picked, since user
           could have toggled off preselected ones to end up with 0 */
                game.flags.paranoia_bits = 0;
                return optn_ok;
            } else {
                config_error_add("!%s does not accept a value", game.allopt[optidx].name);
                return optn_silenterr;
            }
        } else if (!__nh_char_at0(op)) {
            /* "paranoid_confirm" without any arguments is disallowed */
            config_error_add("%s requires a value; use 'none' to cancel all", game.allopt[optidx].name);
            return optn_silenterr;
        }
        op = mungspaces(op);
        if (__nh_char_at0(op) != 43 && __nh_char_at0(op) != 45) {
            game.flags.paranoia_bits = 0;
        } else {
            /* augmenting existing value; keep old bits */
            /* only used for "+none" and "-none" */
            plus_or_minus = (1);
            opt_negated = (__nh_char_at0(op) == 45);
            /* skip '+' or '-', maybe whitespace */
            if (__nh_char_at0((op = __nh_advance_str(op, 1))) == 32) {
                (op = __nh_advance_str(op, 1));
            }
        }
        for (; ; ) {
            fld_negated = (__nh_char_at0(op) == 33);
            if (fld_negated) {
                /* there shouldn't be a space after '!' because then
                   "! foo bar" looks like it might be intended to mean
                   "!foo !bar" but if there is one, skip it to prevent
                   a lookup attempt for "" which will fail and result in
                   an unhelpful error message; accepting the space is
                   simpler than another special case error message */
                /* skip '!', maybe whitespace */
                if (__nh_char_at0((op = __nh_advance_str(op, 1))) == 32) {
                    (op = __nh_advance_str(op, 1));
                }
            } else {
                if (lowc(__nh_char_at0(op)) == 110 && lowc(__nh_char_at0(__nh_advance_str(op, 1))) == 111 && lowc(__nh_char_at0(__nh_advance_str(op, 2)) != 110 && lowc(__nh_char_at0(__nh_advance_str(op, 2))) != 0)) {
                    /* accept "nofoo" to be same as "!foo", unless "no" is
                   followed by a space or 'foo' begins with "n" (to avoid
                   confusion for "none" */
                    fld_negated = (1);
                    /* skip "no"; we know next char isn't space  */
                    op = __nh_advance_str(op, 2);
                }
            }
            /* We're looking to parse
               "paranoid_confirm:whichone wheretwo whothree"
               and "paranoid_confirm:" prefix has already
               been stripped off by the time we get here */
            pp = strchr(op, 32);
            if (pp) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            }
            for (i = 0; i < (Math.trunc(15 /* sizeof(const struct paranoia_opts [15]) */ / 1 /* sizeof(const struct paranoia_opts) */)); ++i) {
                if (match_optname(op, paranoia[i].argname, paranoia[i].argMinLen, (0)) || (paranoia[i].synonym && match_optname(op, paranoia[i].synonym, paranoia[i].synMinLen, (0)))) {
                    if (!paranoia[i].flagmask) {
                        /* we aren't matching option names but match_optname()
               does what we want once we've broken the space
               delimited aggregate into separate tokens */
                        /* flagmask==0 is "none", clear all bits
                           but "+none" and "-none" are no-ops */
                        if (!plus_or_minus) {
                            game.flags.paranoia_bits = 0;
                        }
                    } else if (opt_negated || fld_negated) {
                        game.flags.paranoia_bits &= ~paranoia[i].flagmask;
                    } else {
                        game.flags.paranoia_bits |= paranoia[i].flagmask;
                    }
                    break;
                }
            }
            if (i == (Math.trunc(15 /* sizeof(const struct paranoia_opts [15]) */ / 1 /* sizeof(const struct paranoia_opts) */))) {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_silenterr;
            }
            if (pp) {
                op = __nh_advance_str(pp, 1);
            } else {
                break;
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        let tmpbuf = '';
        tmpbuf = '';
        for (i = 0; paranoia[i].flagmask != 0; ++i) {
            /* hide paranoid_confirm:bones during play except for wizard
                   mode; keep it for any mode if rewriting the config file */
            if ((game.flags.paranoia_bits & paranoia[i].flagmask) != 0 && (paranoia[i].flagmask != 8 || game.flags.debug || req == get_cnf_val)) {
                nh_snprintf("optfn_paranoid_confirmation", 3032, eos(tmpbuf), 256 /* sizeof(char [256]) */ - strlen(tmpbuf), " %s", paranoia[i].argname);
            }
        }
        opts = __nh_char_write(opts, 0, 0);
        opts = strncat(opts, __nh_char_at0(tmpbuf) ? __nh_char_at0(__nh_advance_str(tmpbuf, 1)) : "none", 256 - 1);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_paranoid_confirmation();
    }
    return optn_ok;
}
export async function optfn_perminv_mode(optidx, req, negated, opts, op) {
    let old_perm_invent = game.iflags.perm_invent;
    /*
     * Assumption: only called when iflags.perm_invent is False
     * and is about to be changed to True.
     */
    let old_perminv_mode = game.iflags.perminv_mode;
    let retval = optn_ok;
    if (req == do_init) {
        return optn_ok;
    } else if (req == do_set) {
        op = string_for_opt(opts, negated);
        if (op != game.empty_optstr && negated) {
            bad_negation(game.allopt[optidx].name, (1));
            retval = optn_silenterr;
        } else if (op != game.empty_optstr) {
            let pi0 = null;
            let pi1 = null;
            let i = 0;
            let ln = strlen(op);
            for (i = 0; i < (Math.trunc(216 /* sizeof(const char *[9][3]) */ / 24 /* sizeof(const char *[3]) */)); ++i) {
                if (!(pi0 = perminv_modes[i][0])) {
                    continue;
                }
                pi1 = perminv_modes[i][1];
                if (!strncmpi(op, pi0, ln) || !strncmpi(op, pi1, ln) || __nh_char_at0(op) == i + 48) {
                    if (strstri(pi0, "+grid") && !(game.windowprocs.wp_id == wp_tty)) {
                        i &= ~InvSparse;
                        config_error_add("%s: unavailable perm_invent mode '%s', using '%s'", game.allopt[optidx].name, pi0, perminv_modes[i][0]);
                    }
                    game.iflags.perminv_mode = i;
                    game.iflags.perm_invent = (1);
                    break;
                }
            }
            if (i == (Math.trunc(216 /* sizeof(const char *[9][3]) */ / 24 /* sizeof(const char *[3]) */))) {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                game.iflags.perminv_mode = InvOptNone;
                game.iflags.perm_invent = (0);
                retval = optn_silenterr;
            }
        } else if (negated) {
            game.iflags.perminv_mode = InvOptNone;
            game.iflags.perm_invent = (0);
        }
        if (!game.opt_initial) {
            if (game.iflags.perminv_mode != old_perminv_mode || game.iflags.perm_invent != old_perm_invent) {
                game.opt_need_redraw = (1);
            }
        }
    } else if (req == do_handler) {
        retval = await handler_perminv_mode();
    } else if (req == get_val) {
        opts = sprintf(opts, "%s", perminv_modes[game.iflags.perminv_mode][2]);
        if (game.iflags.perminv_mode != InvOptNone && !game.iflags.perm_invent && op) {
            if (game.iflags.perminv_mode == InvOptInUse) {
                opts = strsubst(opts, " currently", "");
            /* value shown when examining current option settings; enclosed
           within square brackets for 'O', shown as-is when setting value */
            /* 'op' is Null when called by handler_perminv_mode() while
               setting, non-Null when 'm O' shows current option values */
            /* perminv_mode is set but isn't useful because perm_invent is
               Off; say so after squeezing out enough for it to barely fit */
            } else {
                opts = strsubst(opts, " inventory", " invent");
            }
            opts = strcat(opts, (((game.iflags.perminv_mode & InvSparse) != 0) ? " (Off)" : " ('perm_invent' is Off)"));
        }
    } else if (req == get_cnf_val) {
        opts = sprintf(opts, "%s", perminv_modes[game.iflags.perminv_mode][0]);
    }
    return retval;
}
export async function optfn_petattr(optidx, req, negated, opts, op) {
    let retval = optn_ok;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if (op != game.empty_optstr && negated) {
            bad_negation(game.allopt[optidx].name, (1));
            retval = optn_err;
        } else if (op != game.empty_optstr) {
            let itmp = match_str2attr(op, (0));
            /* WINCAP setting font options  */
            if (itmp == -1) {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, opts);
                retval = optn_err;
            } else {
                game.iflags.wc2_petattr = itmp;
            }
        } else if (negated) {
            game.iflags.wc2_petattr = 0;
        }
        if (retval != optn_err) {
            game.iflags.wc_hilite_pet = (game.iflags.wc2_petattr != 0);
            if (!game.opt_initial) {
                game.opt_need_redraw = (1);
            }
        }
        return retval;
    }
    if (req == get_val || req == get_cnf_val) {
        if ((game.windowprocs.wp_id == wp_tty) || (game.windowprocs.wp_id == wp_curses)) {
            opts = strcpy(opts, attr2attrname(game.iflags.wc2_petattr));
        } else if (game.iflags.wc2_petattr != 0) {
            opts = sprintf(opts, "0x%08x", game.iflags.wc2_petattr);
        } else if (req == get_cnf_val) {
            opts = __nh_char_write(opts, 0, 0);
        } else {
            opts = strcpy(opts, defopt);
        }
    }
    if (req == do_handler) {
        return await handler_petattr();
    }
    return optn_ok;
}
export async function optfn_pettype(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = await string_for_env_opt(game.allopt[optidx].name, opts, negated)) != game.empty_optstr) {
            switch (lowc(__nh_char_at0(op))) {
                case 100:
                    game.preferred_pet = 100;
                    break;
                case 99:
                case 102:
                    game.preferred_pet = 99;
                    break;
                case 104:
                case 113:
                    game.preferred_pet = 104;
                    break;
                /* straiNed (heavy encumbrance) */
                case 110:
                    game.preferred_pet = 110;
                    break;
                case 114:
                case 42:
                    game.preferred_pet = 0;
                    break;
                default:
                    config_error_add("Unrecognized pet type '%s'.", op);
                    return optn_err;
                    break;
            }
        } else if (negated) {
            game.preferred_pet = 110;
        }
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", (game.preferred_pet == 99) ? "cat" : (game.preferred_pet == 100) ? "dog" : (game.preferred_pet == 104) ? "horse" : (game.preferred_pet == 110) ? "none" : "random");
        return optn_ok;
    }
    if (req == get_cnf_val) {
        if (game.preferred_pet) {
            opts = sprintf(opts, "%c", game.preferred_pet);
        } else {
            opts = __nh_char_write(opts, 0, 0);
        }
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_pickup_burden(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = await string_for_env_opt(game.allopt[optidx].name, opts, (0))) != game.empty_optstr) {
            switch (lowc(__nh_char_at0(op))) {
                case 117:
                    game.flags.pickup_burden = UNENCUMBERED;
                    break;
                /* Burdened (slight encumbrance) */
                case 98:
                    game.flags.pickup_burden = SLT_ENCUMBER;
                    break;
                /* streSsed (moderate encumbrance) */
                case 115:
                    game.flags.pickup_burden = MOD_ENCUMBER;
                    break;
                case 110:
                    game.flags.pickup_burden = HVY_ENCUMBER;
                    break;
                /* OverTaxed (extreme encumbrance) */
                case 111:
                case 116:
                    game.flags.pickup_burden = EXT_ENCUMBER;
                    break;
                case 108:
                    game.flags.pickup_burden = OVERLOADED;
                    break;
                default:
                    config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                    return optn_err;
            }
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", burdentype[game.flags.pickup_burden]);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_pickup_burden();
    }
    return optn_ok;
}
export async function optfn_pickup_types(optidx, req, negated, opts, op) {
    let ocl = '';
    let tbuf = '';
    let qbuf = '';
    let abuf = '';
    let oc_sym = 0;
    let num = 0;
    let badopt = (0);
    let compat = (strlen(opts) <= 6);
    let use_menu = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        await oc_to_str(game.flags.pickup_types, tbuf);
        game.flags.pickup_types = '';
        op = string_for_opt(opts, (compat || !game.opt_initial));
        if (op == game.empty_optstr) {
            if (compat || negated || game.opt_initial) {
                /* for backwards compatibility, "pickup" without a
                   value is a synonym for autopickup of all types
                   (and during initialization, we can't prompt yet) */
                game.flags.pickup = !negated;
                return optn_ok;
            }
            await oc_to_str(game.flags.inv_order, ocl);
            use_menu = (1);
            if (game.flags.menu_style == 0 || game.flags.menu_style == 1) {
                let wasspace = 0;
                use_menu = (0);
                qbuf = sprintf(qbuf, "New %s: [%s am] (%s)", game.allopt[optidx].name, ocl, tbuf ? tbuf : "all");
                abuf = '';
                abuf = await getlin(qbuf, abuf);
                wasspace = (__nh_char_at0(abuf) == 32);
                op = mungspaces(abuf);
                /* one or more spaces will remove old value */
                /* note: abuf[0]=='a' is already handled via clearing
                   the old value (above) as a default action */
                if (wasspace && !__nh_char_at0(abuf)) {
                    ;
                } else if (!__nh_char_at0(abuf) || __nh_char_at0(abuf) == 27) {
                    op = tbuf;
                } else if (__nh_char_at0(abuf) == 109) {
                    use_menu = (1);
                }
            }
            if (use_menu) {
                if (game.flags.debug && !strchr(ocl, VENOM_SYM)) {
                    ocl = strkitten(ocl, VENOM_SYM);
                }
                await choose_classes_menu("Autopickup what?", 1, (1), ocl, tbuf);
                op = tbuf;
            }
        }
        if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        while (__nh_char_at0(op) == 32) {
            (op = __nh_advance_str(op, 1));
        }
        if (__nh_char_at0(op) != 97 && __nh_char_at0(op) != 65) {
            num = 0;
            while (__nh_char_at0(op)) {
                oc_sym = def_char_to_objclass(__nh_char_at0(op));
                if (oc_sym != MAXOCLASSES && !strchr(game.flags.pickup_types, oc_sym)) {
                    /* make sure all are valid obj symbols occurring once */
                    game.flags.pickup_types[num] = oc_sym;
                    game.flags.pickup_types[++num] = 0;
                } else {
                    badopt = (1);
                }
                (op = __nh_advance_str(op, 1));
            }
            if (badopt) {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        await oc_to_str(game.flags.pickup_types, ocl);
        opts = sprintf(opts, "%s", __nh_char_at0(ocl) ? ocl : "all");
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_pickup_types();
    }
    return optn_ok;
}
export function optfn_pile_limit(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if ((negated && op == game.empty_optstr) || (!negated && op != game.empty_optstr)) {
            game.flags.pile_limit = negated ? 0 : atoi(op);
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        } else {
            game.flags.pile_limit = 5;
        }
        if (game.flags.pile_limit < 0) {
            game.flags.pile_limit = 5;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%d", game.flags.pile_limit);
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_player_selection(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if (op != game.empty_optstr && !negated) {
            if (!strncmpi(op, "dialog", 7 /* sizeof(char [7]) */ - 1)) {
                game.iflags.wc_player_selection = 0;
            } else if (!strncmpi(op, "prompt", 7 /* sizeof(char [7]) */ - 1)) {
                game.iflags.wc_player_selection = 1;
            } else {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", game.iflags.wc_player_selection ? "prompts" : "dialog");
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_playmode(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        /* play mode: normal, explore/discovery, or debug/wizard */
        if (game.duplicate || negated) {
            return optn_err;
        }
        if (op == game.empty_optstr) {
            return optn_err;
        }
        if (!strncmpi(op, "normal", 6) || !strncmpi((op), ("play"), -1)) {
            game.flags.debug = game.flags.explore = (0);
        } else if (!strncmpi(op, "explore", 6) || !strncmpi(op, "discovery", 6)) {
            game.flags.debug = (0) , game.flags.explore = (1);
        } else if (!strncmpi(op, "debug", 5) || !strncmpi(op, "wizard", 6)) {
            game.flags.debug = (1) , game.flags.explore = (0);
        } else {
            config_error_add("Invalid value for \"%s\":%s", game.allopt[optidx].name, op);
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = strcpy(opts, game.flags.debug ? "debug" : game.flags.explore ? "explore" : "normal");
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_race(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (!await parse_role_opt(optidx, negated, game.allopt[optidx].name, opts, { get value() { return op; }, set value(_v) { op = _v; } })) {
            return optn_silenterr;
        }
        if (__nh_char_at0(op) != 33) {
            if ((game.flags.initrace = await str2race(op)) == (-1)) {
                config_error_add("Unknown %s '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
            game.pl_race = __nh_char_at0(op);
            saveoptstr(optidx, ((game.flags.initrace >= 0) ? races[game.flags.initrace].noun : (game.flags.initrace == (-2)) ? randomrole : none));
        }
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", ((game.flags.initrace >= 0) ? races[game.flags.initrace].noun : (game.flags.initrace == (-2)) ? randomrole : none));
        return optn_ok;
    }
    if (req == get_cnf_val) {
        op = await get_cnf_role_opt(optidx);
        opts = strcpy(opts, op ? op : "none");
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_roguesymset(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (op != game.empty_optstr) {
            if (game.symset[ROGUESET].name) {
                free(game.symset[ROGUESET].name) , game.symset[ROGUESET].name = null;
            }
            game.symset[ROGUESET].name = dupstr(op);
            if (!read_sym_file(ROGUESET)) {
                clear_symsetentry(ROGUESET, (1));
                config_error_add("Unable to load symbol set \"%s\" from \"%s\"", op, "symbols");
                return optn_err;
            } else {
                if (!game.opt_initial && (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                    assign_graphics(ROGUESET);
                }
                game.opt_need_redraw = game.opt_need_glyph_reset = (1);
                game.opt_symset_changed = (1);
            }
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", game.symset[ROGUESET].name ? game.symset[ROGUESET].name : "default");
        if (game.currentgraphics == ROGUESET && game.symset[ROGUESET].name) {
            opts = strcat(opts, ", active");
        }
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_symset(optidx);
    }
    return optn_ok;
}
export async function optfn_role(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (!await parse_role_opt(optidx, negated, game.allopt[optidx].name, opts, { get value() { return op; }, set value(_v) { op = _v; } })) {
            return optn_silenterr;
        }
        if (__nh_char_at0(op) != 33) {
            if ((game.flags.initrole = await str2role(op)) == (-1)) {
                config_error_add("Unknown %s '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
            nmcpy(game.pl_character, op, 32);
            saveoptstr(optidx, ((game.flags.initrole >= 0) ? roles[game.flags.initrole].name.m : (game.flags.initrole == (-2)) ? randomrole : none));
        }
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", ((game.flags.initrole >= 0) ? roles[game.flags.initrole].name.m : (game.flags.initrole == (-2)) ? randomrole : none));
        return optn_ok;
    }
    if (req == get_cnf_val) {
        op = await get_cnf_role_opt(optidx);
        opts = strcpy(opts, op ? op : "none");
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_runmode(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (negated) {
            game.flags.runmode = RUN_TPORT;
        } else if (op != game.empty_optstr) {
            if (str_start_is("teleport", op, (1))) {
                game.flags.runmode = RUN_TPORT;
            } else if (str_start_is("run", op, (1))) {
                game.flags.runmode = RUN_LEAP;
            } else if (str_start_is("walk", op, (1))) {
                game.flags.runmode = RUN_STEP;
            } else if (str_start_is("crawl", op, (1))) {
                game.flags.runmode = RUN_CRAWL;
            } else {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
        } else {
            config_error_add("Value is mandatory for %s", game.allopt[optidx].name);
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", runmodes[game.flags.runmode]);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_runmode();
    }
    return optn_ok;
}
export function optfn_scores(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = string_for_opt(opts, (0))) == game.empty_optstr) {
            return optn_err;
        }
        /* 5.0: earlier versions left old values for unspecified arguments
           if player's scores:foo option only specified some of the three;
           in particular, attempting to use 'scores:own' rather than
           'scores:0 top/0 around/own' didn't work as intended */
        game.flags.end_top = game.flags.end_around = 0 , game.flags.end_own = (0);
        if (negated) {
            op = eos(op);
        }
        while (__nh_char_at0(op)) {
            let inum = 1;
            negated = (__nh_char_at0(op) == 33) || !strncmpi(op, "no", 2);
            if (negated) {
                op = __nh_advance_str(op, (__nh_char_at0(op) == 33) ? 1 : (__nh_char_at0(__nh_advance_str(op, 2)) != 45) ? 2 : 3);
            }
            if (digit(__nh_char_at0(op))) {
                inum = atoi(op);
                while (digit(__nh_char_at0(op))) {
                    (op = __nh_advance_str(op, 1));
                }
            }
            /* t, a, and o can be separated by space(s) or slash or both */
            while (__nh_char_at0(op) == 32) {
                (op = __nh_advance_str(op, 1));
            }
            switch (lowc(__nh_char_at0(op))) {
                case 116:
                    game.flags.end_top = negated ? 0 : inum;
                    break;
                case 97:
                    game.flags.end_around = negated ? 0 : inum;
                    break;
                case 111:
                    game.flags.end_own = (negated || !inum) ? (0) : (1);
                    break;
                case 110:
                    game.flags.end_top = game.flags.end_around = 0 , game.flags.end_own = (0);
                    break;
                case 45:
                    if (digit(__nh_char_at0((__nh_advance_str(op, 1))))) {
                        config_error_add("Values for %s:top and %s:around must not be negative", game.allopt[optidx].name, game.allopt[optidx].name);
                        return optn_silenterr;
                    }
                    ;
                default:
                    config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                    return optn_silenterr;
            }
            /* "3a" is sufficient but accept "3around" (or "3abracadabra") */
            while (letter(__nh_char_at0(op))) {
                (op = __nh_advance_str(op, 1));
            }
            while (__nh_char_at0(op) == 32) {
                (op = __nh_advance_str(op, 1));
            }
            if (__nh_char_at0(op) == 47) {
                (op = __nh_advance_str(op, 1));
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts.value = 0;
        if (game.flags.end_top > 0) {
            opts = sprintf(opts, "%d top", game.flags.end_top);
        }
        if (game.flags.end_around > 0) {
            opts = __nh_buf_append(opts, sprintf('', "%s%d around", (game.flags.end_top > 0) ? "/" : "", game.flags.end_around));
        }
        if (game.flags.end_own) {
            opts = __nh_buf_append(opts, sprintf('', "%sown", (game.flags.end_top > 0 || game.flags.end_around > 0) ? "/" : ""));
        }
        if (!opts.value) {
            opts = strcpy(opts, "none");
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_scroll_amount(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if ((negated && op == game.empty_optstr) || (!negated && op != game.empty_optstr)) {
            game.iflags.wc_scroll_amount = negated ? 1 : atoi(op);
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (game.iflags.wc_scroll_amount) {
            opts = sprintf(opts, "%d", game.iflags.wc_scroll_amount);
        } else {
            opts = strcpy(opts, defopt);
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_scroll_margin(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if ((negated && op == game.empty_optstr) || (!negated && op != game.empty_optstr)) {
            game.iflags.wc_scroll_margin = negated ? 5 : atoi(op);
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (game.iflags.wc_scroll_margin) {
            opts = sprintf(opts, "%d", game.iflags.wc_scroll_margin);
        } else {
            opts = strcpy(opts, defopt);
        }
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_soundlib(optidx, req, negated, opts, op) {
    let soundlibbuf = '';
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = await string_for_env_opt(game.allopt[optidx].name, opts, (0))) != game.empty_optstr) {
            /*
         * soundlib:  option to choose the interface for binaries built
         * with support for more than the default interface (nosound).
         *
         * Option processing sets gc.chosen_soundlib. A later call
         * to activate_chosen_soundlib() actually activates it, and
         * sets gc.active_soundlib.
         */
            let option_id = 0;
            await get_soundlib_name(soundlibbuf, 16);
            option_id = soundlib_id_from_opt(op);
            game.chosen_soundlib = option_id;
            await assign_soundlib(game.chosen_soundlib);
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        await get_soundlib_name(soundlibbuf, 16);
        opts = sprintf(opts, "%s", soundlibbuf);
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_sortdiscoveries(optidx, req, negated, opts, op) {
    if (req == do_init) {
        game.flags.discosort = 111;
        return optn_ok;
    }
    if (req == do_set) {
        op = await string_for_env_opt(game.allopt[optidx].name, opts, (0));
        if (negated) {
            game.flags.discosort = 111;
        } else if (op != game.empty_optstr) {
            switch (lowc(__nh_char_at0(op))) {
                case 48:
                case 111:
                    game.flags.discosort = 111;
                    break;
                case 49:
                case 115:
                    game.flags.discosort = 115;
                    break;
                case 50:
                case 99:
                    game.flags.discosort = 99;
                    break;
                case 51:
                case 97:
                    game.flags.discosort = 97;
                    break;
                default:
                    config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                    return optn_silenterr;
            }
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        get_sortdisco(opts, (req == get_cnf_val) ? (1) : (0));
        return optn_ok;
    }
    if (req == do_handler) {
        await choose_disco_sort(0);
    }
    return optn_ok;
}
export async function optfn_sortloot(optidx, req, negated, opts, op) {
    let i = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = await string_for_env_opt(game.allopt[optidx].name, opts, (0));
        if (op != game.empty_optstr) {
            let c = lowc(__nh_char_at0(op));
            switch (c) {
                case 110:
                case 108:
                case 102:
                    game.flags.sortloot = c;
                    break;
                default:
                    config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                    return optn_err;
            }
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        for (i = 0; i < (Math.trunc(24 /* sizeof(const char *[3]) */ / 8 /* sizeof(const char *) */)); i++) {
            if (game.flags.sortloot == sortltype[i][0]) {
                opts = strcpy(opts, sortltype[i]);
                break;
            }
        }
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_sortloot();
    }
    return optn_ok;
}
const __optfn_sortvanquished_vanqmodes = "tdaACcnz";
export async function optfn_sortvanquished(optidx, req, negated, opts, op) {
    let optname = game.allopt[optidx].name;
    if (req == do_init) {
        game.flags.vanq_sortmode = VANQ_MLVL_MNDX;
        return optn_ok;
    }
    if (req == do_set) {
        op = await string_for_env_opt(game.allopt[optidx].name, opts, (0));
        if (negated) {
            game.flags.vanq_sortmode = VANQ_MLVL_MNDX;
        } else if (op != game.empty_optstr) {
            let p = null;
            let vndx = 0;
            if ((p = strchr(__optfn_sortvanquished_vanqmodes, __nh_char_at0(op))) != null) {
                vndx = ((__optfn_sortvanquished_vanqmodes.length - p.length));
            } else if (strchr("01234567", __nh_char_at0(op))) {
                vndx = __nh_char_at0(op) - 48;
            } else {
                config_error_add("Unknown %s parameter '%s'", optname, op);
                return optn_silenterr;
            }
            game.flags.vanq_sortmode = vndx;
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = strcpy(opts, vanqorders[game.flags.vanq_sortmode][0]);
        if (req == get_val) {
            opts = __nh_buf_append(opts, sprintf('', ": %s", vanqorders[game.flags.vanq_sortmode][1]));
        }
        return optn_ok;
    }
    if (req == do_handler) {
        let prev_sortmode = game.flags.vanq_sortmode;
        await set_vanq_order((1));
        await pline("'%s' %s \"%s: %s\".", optname, (game.flags.vanq_sortmode == prev_sortmode) ? "not changed, still" : "changed to", vanqorders[game.flags.vanq_sortmode][0], vanqorders[game.flags.vanq_sortmode][1]);
    }
    return optn_ok;
}
export function optfn_statushilites(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (negated) {
            /* control over whether highlights should be displayed (non-zero), and
           also for how long to show temporary ones (N turns; default 3) */
            game.iflags.hilite_delta = 0;
        } else {
            op = string_for_opt(opts, (1));
            game.iflags.hilite_delta = (op == game.empty_optstr || !__nh_char_at0(op)) ? 3 : atol(op);
            if (game.iflags.hilite_delta < 0) {
                game.iflags.hilite_delta = 1;
            }
        }
        if (!game.opt_from_file) {
            reset_status_hilites();
        }
        return optn_ok;
    }
    if (req == get_val) {
        if (!game.iflags.hilite_delta) {
            opts = strcpy(opts, "0 (off: don't highlight status fields)");
        } else {
            opts = sprintf(opts, "%ld (on: highlight status for %ld turns)", game.iflags.hilite_delta, game.iflags.hilite_delta);
        }
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = sprintf(opts, "%ld", game.iflags.hilite_delta);
    }
    return optn_ok;
}
export function optfn_statuslines(optidx, req, negated, opts, op) {
    let retval = optn_ok;
    let itmp = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            itmp = 2;
            retval = optn_err;
        } else if (op != game.empty_optstr) {
            itmp = atoi(op);
        }
        if (itmp < 2 || itmp > 3) {
            config_error_add("'%s:%s' is invalid; must be 2 or 3", game.allopt[optidx].name, op);
            retval = optn_silenterr;
        } else {
            game.iflags.wc2_statuslines = itmp;
            if (!game.opt_initial) {
                game.opt_need_redraw = (1);
            }
        }
        return retval;
    }
    if (req == get_val || req == get_cnf_val) {
        if (wc2_supported(game.allopt[optidx].name)) {
            opts = strcpy(opts, (game.iflags.wc2_statuslines < 3) ? "2" : "3");
        } else {
            opts = strcpy(opts, "unknown");
        }
        return optn_ok;
    }
    return optn_ok;
}
/* WIN32CON */
export async function optfn_suppress_alert(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (negated) {
            bad_negation(game.allopt[optidx].name, (0));
            return optn_err;
        } else if (op != game.empty_optstr) {
            await feature_alert_opts(op, game.allopt[optidx].name);
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (req == get_cnf_val && game.flags.suppress_alert == 0) {
            opts = __nh_char_write(opts, 0, 0);
        } else if (game.flags.suppress_alert == 0) {
            opts = strcpy(opts, none);
        } else {
            opts = sprintf(opts, "%lu.%lu.%lu", (game.flags.suppress_alert >> 24), (((16711680 & game.flags.suppress_alert)) >> 16), (((65280 & game.flags.suppress_alert)) >> 8));
        }
        return optn_ok;
    }
    return optn_ok;
}
/* symbols.c */
/* symbols.c */
export async function optfn_symset(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (op != game.empty_optstr) {
            if (game.symset[PRIMARYSET].name) {
                free(game.symset[PRIMARYSET].name) , game.symset[PRIMARYSET].name = null;
            }
            game.symset[PRIMARYSET].name = dupstr(op);
            if (!read_sym_file(PRIMARYSET)) {
                clear_symsetentry(PRIMARYSET, (1));
                config_error_add("Unable to load symbol set \"%s\" from \"%s\"", op, "symbols");
                return optn_err;
            } else {
                if (game.symset[PRIMARYSET].handling) {}
                switch_symbols(game.symset[PRIMARYSET].name != null);
                game.opt_need_redraw = game.opt_need_glyph_reset = (1);
                game.opt_symset_changed = (1);
            }
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", game.symset[PRIMARYSET].name ? game.symset[PRIMARYSET].name : "default");
        if (game.currentgraphics == PRIMARYSET && game.symset[PRIMARYSET].name) {
            opts = strcat(opts, ", active");
        }
        if (game.symset[PRIMARYSET].handling) {
            opts = __nh_buf_append(opts, sprintf('', ", handler=%s", known_handling[game.symset[PRIMARYSET].handling]));
        }
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = sprintf(opts, "%s", game.symset[PRIMARYSET].name ? game.symset[PRIMARYSET].name : "default");
        return optn_ok;
    }
    if (req == do_handler) {
        let reslt = 0;
        if (!glyphid_cache_status()) {
            await fill_glyphid_cache();
        }
        reslt = await handler_symset(optidx);
        if (glyphid_cache_status()) {
            free_glyphid_cache();
        }
        /* apply_customizations(gc.currentgraphics,
                        (do_custom_colors | do_custom_symbols)); */
        return reslt;
    }
    return optn_ok;
}
export function optfn_term_cols(optidx, req, negated, opts, op) {
    let retval = optn_ok;
    let ltmp = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = string_for_opt(opts, negated)) != game.empty_optstr) {
            /* WINCAP2
         * term_cols:amount */
            /* WINCAP2
         * term_rows:amount */
            ltmp = atol(op);
            if (ltmp <= 0 || ltmp >= 32767) {
                /* just checks atol() sanity, not logical window size sanity
             */
                config_error_add("Invalid %s: %ld", game.allopt[optidx].name, ltmp);
                retval = optn_err;
            } else {
                game.iflags.wc2_term_cols = ltmp;
            }
        }
        return retval;
    }
    if (req == get_val || req == get_cnf_val) {
        if (game.iflags.wc2_term_cols) {
            opts = sprintf(opts, "%d", game.iflags.wc2_term_cols);
        } else if (req == get_cnf_val) {
            opts = __nh_char_write(opts, 0, 0);
        } else {
            opts = strcpy(opts, defopt);
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_term_rows(optidx, req, negated, opts, op) {
    let retval = optn_ok;
    let ltmp = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = string_for_opt(opts, negated)) != game.empty_optstr) {
            ltmp = atol(op);
            if (ltmp <= 0 || ltmp >= 32767) {
                config_error_add("Invalid %s: %ld", game.allopt[optidx].name, ltmp);
                retval = optn_err;
            } else {
                game.iflags.wc2_term_rows = ltmp;
            }
        }
        return retval;
    }
    if (req == get_val || req == get_cnf_val) {
        if (game.iflags.wc2_term_rows) {
            opts = sprintf(opts, "%d", game.iflags.wc2_term_rows);
        } else if (req == get_cnf_val) {
            opts = __nh_char_write(opts, 0, 0);
        } else {
            opts = strcpy(opts, defopt);
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_tile_file(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (op != game.empty_optstr) {
            if (game.iflags.wc_tile_file) {
                free(game.iflags.wc_tile_file);
            }
            game.iflags.wc_tile_file = dupstr(op);
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", game.iflags.wc_tile_file ? game.iflags.wc_tile_file : defopt);
        return optn_ok;
    }
    if (req == get_cnf_val) {
        if (game.iflags.wc_tile_file) {
            opts = sprintf(opts, "%s", game.iflags.wc_tile_file);
        } else {
            opts = __nh_char_write(opts, 0, 0);
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_tile_height(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if ((negated && op == game.empty_optstr) || (!negated && op != game.empty_optstr)) {
            game.iflags.wc_tile_height = negated ? 0 : atoi(op);
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (game.iflags.wc_tile_height) {
            opts = sprintf(opts, "%d", game.iflags.wc_tile_height);
        } else if (req == get_cnf_val) {
            opts = __nh_char_write(opts, 0, 0);
        } else {
            opts = strcpy(opts, defopt);
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_tile_width(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if ((negated && op == game.empty_optstr) || (!negated && op != game.empty_optstr)) {
            game.iflags.wc_tile_width = negated ? 0 : atoi(op);
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (game.iflags.wc_tile_width) {
            opts = sprintf(opts, "%d", game.iflags.wc_tile_width);
        } else if (req == get_cnf_val) {
            opts = __nh_char_write(opts, 0, 0);
        } else {
            opts = strcpy(opts, defopt);
        }
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_traps(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        return optn_ok;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", to_be_done);
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
export function optfn_vary_msgcount(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if ((negated && op == game.empty_optstr) || (!negated && op != game.empty_optstr)) {
            game.iflags.wc_vary_msgcount = negated ? 0 : atoi(op);
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (game.iflags.wc_vary_msgcount) {
            opts = sprintf(opts, "%d", game.iflags.wc_vary_msgcount);
        } else if (req == get_cnf_val) {
            opts = __nh_char_write(opts, 0, 0);
        } else {
            opts = strcpy(opts, defopt);
        }
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_versinfo(optidx, req, negated, opts, op) {
    let optname = game.allopt[optidx].name;
    let vi = game.flags.versinfo;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        /* versinfo: what to include when 'showvers' displays version
           on status lines; bitmask with up to three bits:
           (1) x.y.z number, (2) program name, (4) git branch if available.
           If branch is requested but unavailable, status_version will
           treat 4 as 1.
         */
        let have_branch = (game.nomakedefs.git_branch && __nh_char_at0(game.nomakedefs.git_branch));
        let val = 0;
        let dflt = have_branch ? 4 : 1;
        if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_silenterr;
        }
        op = string_for_opt(opts, (0));
        if (op == game.empty_optstr) {
            config_error_add("'%s' requires a value; defaulting to %d", optname, dflt);
            return optn_silenterr;
        }
        val = atoi(op);
        if (!val || (val & ~7) != 0) {
            config_error_add("'%s' must be one of 1, 2, 4, or the sum of two or all three of those", optname);
            return optn_silenterr;
        }
        game.flags.versinfo = val;
    } else if (req == do_handler) {
        await handler_versinfo();
        await pline("'%s' %s %u.", optname, (game.flags.versinfo == vi) ? "not changed, still" : "changed to", game.flags.versinfo);
    } else if (req == get_val) {
        let vbuf = '';
        let g = (vi & 2) != 0;
        let b = (vi & 4) != 0;
        let n = (vi & 1) != 0;
        opts = sprintf(opts, "%u: %s%s%s%s%s (%.99s)", game.flags.versinfo, g ? "name" : "", (b && g) ? "+" : "", b ? "branch" : "", (n && (b || g)) ? "+" : "", n ? "number" : "", status_version(vbuf, 128 /* sizeof(char [128]) */, (0)));
    } else if (req == get_cnf_val) {
        opts = sprintf(opts, "%u", game.flags.versinfo);
    }
    if (game.flags.versinfo != vi && !game.opt_initial) {
        game.opt_need_redraw = (1);
    }
    return optn_ok;
}
/* videocolors:string */
/* videoshades:string */
/* VIDEOSHADES */
/* video:string */
/* NO_TERMS */
/* MSDOS */
export async function optfn_warnings(optidx, req, negated, opts, op) {
    let reslt = 0;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        reslt = await warning_opts(opts, game.allopt[optidx].name);
        return reslt ? optn_ok : optn_err;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
let __optfn_whatis_coord_gpcoords = [110, 99, 102, 109, 115, 0];
__nh_register_static(() => { __optfn_whatis_coord_gpcoords = [110, 99, 102, 109, 115, 0]; });
export async function optfn_whatis_coord(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (negated) {
            game.iflags.getpos_coords = 110;
            return optn_ok;
        } else if ((op = await string_for_env_opt(game.allopt[optidx].name, opts, (0))) != game.empty_optstr) {
            let c = lowc(__nh_char_at0(op));
            if (c && strchr(__optfn_whatis_coord_gpcoords, c)) {
                game.iflags.getpos_coords = c;
            } else {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", (game.iflags.getpos_coords == 109) ? "map" : (game.iflags.getpos_coords == 99) ? "compass" : (game.iflags.getpos_coords == 102) ? "full compass" : (game.iflags.getpos_coords == 115) ? "screen" : "none");
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_whatis_coord();
    }
    return optn_ok;
}
export async function optfn_whatis_filter(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (negated) {
            game.iflags.getloc_filter = GFILTER_NONE;
            return optn_ok;
        } else if ((op = await string_for_env_opt(game.allopt[optidx].name, opts, (0))) != game.empty_optstr) {
            let c = lowc(__nh_char_at0(op));
            switch (c) {
                case 110:
                    game.iflags.getloc_filter = GFILTER_NONE;
                    break;
                case 118:
                    game.iflags.getloc_filter = GFILTER_VIEW;
                    break;
                case 97:
                    game.iflags.getloc_filter = GFILTER_AREA;
                    break;
                default:
{
                        config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, op);
                        return optn_err;
                    }
            }
        } else {
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", (game.iflags.getloc_filter == GFILTER_VIEW) ? "view" : (game.iflags.getloc_filter == GFILTER_AREA) ? "area" : "none");
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_whatis_filter();
    }
    return optn_ok;
}
export async function optfn_windowborders(optidx, req, negated, opts, op) {
    let retval = optn_ok;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        op = string_for_opt(opts, negated);
        if (negated && op != game.empty_optstr) {
            bad_negation(game.allopt[optidx].name, (1));
            retval = optn_err;
        } else {
            let itmp = 0;
            if (negated) {
                itmp = 0;
            } else if (op == game.empty_optstr) {
                itmp = 1;
            /* Value supplied; expect 0 (off), 1 (on), 2 (auto)
                  * or 3 (on for most windows, off for perm_invent)
                  * or 4 (auto for most windows, off for perm_invent) */
            } else {
                itmp = atoi(op);
            }
            if (itmp < 0 || itmp > 4) {
                config_error_add("Invalid %s (should be within 0 to 4): %s", game.allopt[optidx].name, opts);
                retval = optn_silenterr;
            } else {
                game.iflags.wc2_windowborders = itmp;
            }
        }
        return retval;
    }
    if (req == get_val) {
        opts = sprintf(opts, "%s", (game.iflags.wc2_windowborders == 0) ? "0=off" : (game.iflags.wc2_windowborders == 1) ? "1=on" : (game.iflags.wc2_windowborders == 2) ? "2=auto" : (game.iflags.wc2_windowborders == 3) ? "3=on, except off for perm_invent" : (game.iflags.wc2_windowborders == 4) ? "4=auto, except off for perm_invent" : defopt);
        return optn_ok;
    }
    if (req == get_cnf_val) {
        opts = sprintf(opts, "%i", game.iflags.wc2_windowborders);
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_windowborders();
    }
    return optn_ok;
}
/* Win GUI and curses */
const wcnames = ["menu", "message", "status", "text"];
const wcshortnames = ["mnu", "msg", "sts", "txt"];
game.wcolors_opt = [0, 0, 0, 0];
export function optfn_windowcolors(optidx, req, negated, opts, op) {
    let wccount = 0;
    if (req == do_init) {
        for (wccount = 0; wccount < WC_COUNT; ++wccount) {
            game.wcolors_opt[wccount] = 0;
        }
        return optn_ok;
    }
    if (req == do_set) {
        if ((op = string_for_opt(opts, (0))) != game.empty_optstr) {
            if (!wc_set_window_colors(op)) {
                /* WINCAP
         * setting window colors
         * syntax: windowcolors=menu foregrnd/backgrnd text foregrnd/backgrnd
         */
                config_error_add("Could not set %s '%s'", game.allopt[optidx].name, op);
                return optn_err;
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        let fg = null;
        let bg = null;
        opts = __nh_char_write(opts, 0, 0);
        for (wccount = 0; wccount < WC_COUNT; ++wccount) {
            fg = game.iflags.wcolors[wccount].fg;
            bg = game.iflags.wcolors[wccount].bg;
            if (fg && (!__nh_char_at0(fg) || !strcmp(fg, defbrief))) {
                fg = null;
            }
            if (bg && (!__nh_char_at0(bg) || !strcmp(bg, defbrief))) {
                bg = null;
            }
            opts = __nh_buf_append(opts, sprintf('', "%s%s %s/%s", !wccount ? "" : " ", (fg || bg) ? wcnames[wccount] : wcshortnames[wccount], fg ? fg : defbrief, bg ? bg : defbrief));
        }
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_windowtype(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (!game.iflags.window_inited) {
            /*
         * windowtype:  option to choose the interface for binaries built
         * with support for more than one interface (tty + X11, for
         * instance).
         *
         * Ideally, 'windowtype' should be processed first, because it
         * causes the wc_ and wc2_ flags to be set up.
         * For user, making it be first in a config file is trivial, use
         * OPTIONS=windowtype:Foo
         * as the first non-comment line of the file.
         * Making it first in NETHACKOPTIONS requires it to be at the
         * _end_ because comma-separated option strings are processed from
         * right to left.
         */
            if (game.iflags.windowtype_locked) {
                return optn_ok;
            }
            if ((op = await string_for_env_opt(game.allopt[optidx].name, opts, (0))) != game.empty_optstr) {
                nmcpy(game.chosen_windowtype, op, 16);
                if (!game.iflags.windowtype_deferred) {
                    await choose_windows(game.chosen_windowtype);
                }
            } else {
                return optn_err;
            }
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = sprintf(opts, "%s", game.windowprocs.name);
        return optn_ok;
    }
    return optn_ok;
}
/*
 *    Prefix-handling functions
 */
export async function pfxfn_cond_(optidx, req, negated, opts, op) {
    if (req == do_init) {
        await condopt(0, null, 0);
        return optn_ok;
    }
    if (req == do_set) {
        let reslt = await parse_cond_option(negated, opts);
        switch (reslt) {
            case 0:
                game.opt_set_in_config[pfx_cond_] = (1);
                break;
            case 3:
                config_error_add("Ambiguous condition option %s", opts);
                break;
            case 1:
            case 2:
            default:
                config_error_add("Unknown condition option %s (%d)", opts, reslt);
                break;
        }
        if (reslt != 0) {
            return optn_err;
        }
        game.opt_need_redraw = (1);
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    if (req == do_handler) {
        await cond_menu();
        return optn_ok;
    }
    return optn_ok;
}
export function pfxfn_font(optidx, req, negated, opts, op) {
    let opttype = -1;
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (optidx == opt_font_map) {
            opttype = MAP_OPTION;
        } else if (optidx == opt_font_message) {
            opttype = MESSAGE_OPTION;
        } else if (optidx == opt_font_text) {
            opttype = TEXT_OPTION;
        } else if (optidx == opt_font_menu) {
            opttype = MENU_OPTION;
        } else if (optidx == opt_font_status) {
            opttype = STATUS_OPTION;
        } else if (optidx == opt_font_size_map || optidx == opt_font_size_message || optidx == opt_font_size_text || optidx == opt_font_size_menu || optidx == opt_font_size_status) {
            if (optidx == opt_font_size_map) {
                opttype = MAP_OPTION;
            } else if (optidx == opt_font_size_message) {
                opttype = MESSAGE_OPTION;
            } else if (optidx == opt_font_size_text) {
                opttype = TEXT_OPTION;
            } else if (optidx == opt_font_size_menu) {
                opttype = MENU_OPTION;
            } else if (optidx == opt_font_size_status) {
                opttype = STATUS_OPTION;
            } else {
                config_error_add("Unknown %s parameter '%s'", game.allopt[optidx].name, opts);
                return optn_err;
            }
            if (game.duplicate) {
                complain_about_duplicate(optidx);
            }
            if (opttype > 0 && !negated && (op = string_for_opt(opts, (0))) != game.empty_optstr) {
                switch (opttype) {
                    case MAP_OPTION:
                        game.iflags.wc_fontsiz_map = atoi(op);
                        break;
                    case MESSAGE_OPTION:
                        game.iflags.wc_fontsiz_message = atoi(op);
                        break;
                    case TEXT_OPTION:
                        game.iflags.wc_fontsiz_text = atoi(op);
                        break;
                    case MENU_OPTION:
                        game.iflags.wc_fontsiz_menu = atoi(op);
                        break;
                    case STATUS_OPTION:
                        game.iflags.wc_fontsiz_status = atoi(op);
                        break;
                }
            }
            return optn_ok;
        } else {
            config_error_add("Unknown %s parameter '%s'", "font", opts);
            return (0);
        }
        if (opttype > 0 && (op = string_for_opt(opts, (0))) != game.empty_optstr) {
            wc_set_font_name(opttype, op);
            return optn_ok;
        } else if (negated) {
            bad_negation(game.allopt[optidx].name, (1));
            return optn_err;
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        if (optidx == opt_font_map) {
            opts = sprintf(opts, "%s", game.iflags.wc_font_map ? game.iflags.wc_font_map : defopt);
        } else if (optidx == opt_font_message) {
            opts = sprintf(opts, "%s", game.iflags.wc_font_message ? game.iflags.wc_font_message : defopt);
        } else if (optidx == opt_font_status) {
            opts = sprintf(opts, "%s", game.iflags.wc_font_status ? game.iflags.wc_font_status : defopt);
        } else if (optidx == opt_font_menu) {
            opts = sprintf(opts, "%s", game.iflags.wc_font_menu ? game.iflags.wc_font_menu : defopt);
        } else if (optidx == opt_font_text) {
            opts = sprintf(opts, "%s", game.iflags.wc_font_text ? game.iflags.wc_font_text : defopt);
        } else if (optidx == opt_font_size_map) {
            if (game.iflags.wc_fontsiz_map) {
                opts = sprintf(opts, "%d", game.iflags.wc_fontsiz_map);
            } else {
                opts = strcpy(opts, defopt);
            }
        } else if (optidx == opt_font_size_message) {
            if (game.iflags.wc_fontsiz_message) {
                opts = sprintf(opts, "%d", game.iflags.wc_fontsiz_message);
            } else {
                opts = strcpy(opts, defopt);
            }
        } else if (optidx == opt_font_size_status) {
            if (game.iflags.wc_fontsiz_status) {
                opts = sprintf(opts, "%d", game.iflags.wc_fontsiz_status);
            } else {
                opts = strcpy(opts, defopt);
            }
        } else if (optidx == opt_font_size_menu) {
            if (game.iflags.wc_fontsiz_menu) {
                opts = sprintf(opts, "%d", game.iflags.wc_fontsiz_menu);
            } else {
                opts = strcpy(opts, defopt);
            }
        } else if (optidx == opt_font_size_text) {
            if (game.iflags.wc_fontsiz_text) {
                opts = sprintf(opts, "%d", game.iflags.wc_fontsiz_text);
            } else {
                opts = strcpy(opts, defopt);
            }
        }
        return optn_ok;
    }
    return optn_ok;
}
/*
 *    General boolean option handler
 *    (Use optidx to reference the specific option)
 */
export async function optfn_boolean(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        let nosexchange = (0);
        let ln = 0;
        if (!game.allopt[optidx].addr) {
            return optn_ok;
        }
        /* option that must come from config file? */
        if (!game.opt_initial && (game.allopt[optidx].setwhere == set_in_config)) {
            return optn_err;
        }
        /* options that must NOT come from config file */
        if (game.opt_initial && game.allopt[optidx].setwhere == set_wiznofuz) {
            return optn_err;
        }
        op = string_for_opt(opts, (1));
        if (op != game.empty_optstr) {
            if (negated) {
                config_error_add("Negated boolean '%s' should not have a parameter", game.allopt[optidx].name);
                return optn_silenterr;
            }
            /* length is greater than 0 or we wouldn't have gotten here */
            ln = strlen(op);
            if (!strncmpi(op, "true", ln) || !strncmpi(op, "yes", ln) || !strncmpi((op), ("on"), -1) || (digit(__nh_char_at0(op)) && atoi(op) == 1)) {
                negated = (0);
            } else if (!strncmpi(op, "false", ln) || !strncmpi(op, "no", ln) || !strncmpi((op), ("off"), -1) || (digit(__nh_char_at0(op)) && atoi(op) == 0)) {
                negated = (1);
            } else if (!game.allopt[optidx].valok) {
                config_error_add("'%s' is not valid for a boolean", opts);
                return optn_silenterr;
            }
        }
        if (game.iflags.debug_fuzzer && !game.opt_initial) {
            /* don't randomly toggle this/these */
            if ((optidx == opt_silent) || (optidx == opt_perm_invent)) {
                return optn_ok;
            }
        }
        switch (optidx) {
            case opt_female:
                if (!strncmpi(opts, "female", ((ln) > (3) ? (ln) : (3)))) {
                    if (!game.opt_initial && game.flags.female == negated) {
                        nosexchange = (1);
                    } else {
                        game.flags.initgend = game.flags.female = !negated;
                        return optn_ok;
                    }
                }
                if (!strncmpi(opts, "male", ((ln) > (3) ? (ln) : (3)))) {
                    if (!game.opt_initial && game.flags.female != negated) {
                        nosexchange = (1);
                    } else {
                        game.flags.initgend = game.flags.female = negated;
                        return optn_ok;
                    }
                }
                break;
            case opt_perm_invent:
                if (!negated && !game.opt_initial && !can_set_perm_invent()) {
                    return optn_silenterr;
                }
                break;
            default:
                break;
        }
        if (nosexchange) {
            /* this dates from when 'O' prompted for a line of options text
           rather than use a menu to control access to which options can
           be modified during play; it was possible to attempt to use
           'O' to specify female or negate male when playing as male or
           to specify male or negate female when playing as female;
           options processing rejects that for !opt_initial; not possible
           now but kept in case someone brings the old 'O' behavior back */
            /* can't arbitrarily change sex after game has started;
               magic (amulet or polymorph) is required for that */
            config_error_add("'%s' is not anatomically possible.", opts);
            return optn_silenterr;
        }
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = !negated) */;
        switch (optidx) {
            case opt_pauper:
                game.u.uroleplay.nudist = game.u.uroleplay.pauper;
                break;
            case opt_ascii_map:
                game.iflags.wc_tiled_map = negated;
                break;
            case opt_tiled_map:
                game.iflags.wc_ascii_map = negated;
                break;
            case opt_hilite_pet:
                if ((game.windowprocs.wp_id == wp_tty) || (game.windowprocs.wp_id == wp_curses)) {
                    /* if we're enabling hilite_pet and petattr isn't set,
                   set it to Inverse; if we're disabling, leave petattr
                   alone so that re-enabling will get current value back
                 */
                    if (game.iflags.wc_hilite_pet && !game.iflags.wc2_petattr) {
                        game.iflags.wc2_petattr = 7;
                    }
                }
                game.opt_need_redraw = (1);
                break;
            case opt_idlecheckpoint:
                await pline("There is no underlying support for 'idlecheckpoint' compiled in.");
                game.iflags.idlecheckpoint = (0);
                /* select and change one option at a time, then reprocess the menu
       with updated settings to offer chance for further change */
                game.give_opt_msg = (0);
                break;
            default:
                break;
        }
        /* only do processing below if setting with doset() */
        if (game.opt_initial) {
            return optn_ok;
        }
        switch (optidx) {
            case opt_terrainstatus:
                classify_terrain();
                ;
            case opt_weaponstatus:
            case opt_armorstatus:
                if (!wc2_supported(game.allopt[optidx].name)) {
                    /* bring iflags.terrain_typ up to date */
                    config_error_add("'%s' is not supported.", game.allopt[optidx].name);
                    return optn_ok;
                }
                ;
            case opt_showscore:
            case opt_showvers:
            case opt_showexp:
            case opt_time:
                if (((game.windowprocs.wincap2 & (8 | 128)) != 0)) {
                    await status_initialize((1));
                }
                game.disp.botl = (1);
                break;
            case opt_fixinv:
            case opt_price_quotes:
            case opt_sortpack:
            case opt_implicit_uncursed:
            case opt_wizweight:
                if (!game.flags.invlet_constant) {
                    reassign();
                }
                update_inventory();
                break;
            case opt_lit_corridor:
            case opt_dark_room:
                await vision_recalc(2);
                game.vision_full_recalc = 1;
                if (game.iflags.wc_color) {
                    /* Qt doesn't support HILITE_STATUS or FLUSH_STATUS so fails
                   VIA_WINDOWPORT(), but it does support WC2_HITPOINTBAR */
                    game.opt_need_redraw = (1);
                }
                break;
            case opt_wizmgender:
            case opt_showrace:
            case opt_use_inverse:
            case opt_hilite_pile:
            case opt_perm_invent:
            case opt_ascii_map:
            case opt_tiled_map:
                game.opt_need_redraw = (1);
                game.opt_need_glyph_reset = (1);
                break;
            case opt_hitpointbar:
                if (((game.windowprocs.wincap2 & (8 | 128)) != 0)) {
                    await status_initialize((1));
                    game.opt_need_redraw = (1);
                }
                break;
            case opt_color:
                game.opt_need_redraw = (1);
                game.opt_need_glyph_reset = (1);
                break;
            case opt_customcolors:
                game.opt_reset_customcolors = (1);
                break;
            case opt_customsymbols:
                game.opt_reset_customsymbols = (1);
                break;
            case opt_menucolors:
            case opt_guicolor:
                update_inventory();
                game.opt_need_promptstyle = (1);
                break;
            case opt_mention_decor:
                game.iflags.prev_decor = STONE;
                break;
            case opt_rest_on_space:
                update_rest_on_space();
                break;
            case opt_accessiblemsg:
                game.a11y.msg_loc.x = game.a11y.msg_loc.y = 0;
                break;
            default:
                break;
        }
        if (game.give_opt_msg) {
            await pline("'%s' option toggled %s.", game.allopt[optidx].name, !negated ? "on" : "off");
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
export async function spcfn_misc_menu_cmd(midx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        if (negated) {
            bad_negation(default_menu_cmd_info[midx].name, (0));
            return optn_err;
        } else if ((op = string_for_opt(opts, (0))) != game.empty_optstr) {
            let c = txt2key(op);
            if (illegal_menu_cmd_key(c)) {
                return optn_err;
            }
            await add_menu_cmd_alias(c, default_menu_cmd_info[midx].cmd);
        }
        return optn_ok;
    }
    if (req == get_val || req == get_cnf_val) {
        opts = __nh_char_write(opts, 0, 0);
        return optn_ok;
    }
    return optn_ok;
}
/*
 **********************************
 *
 *   Special per-option handlers
 *
 **********************************
 */
/* test whether 'perm_invent' can be toggled On */
export function can_set_perm_invent() {
    let old_perminv_mode = game.iflags.perminv_mode;
    if (!(game.windowprocs.wincap & 134217728)) {
        return (0);
    }
    if (game.iflags.perminv_mode == InvOptNone) {
        game.iflags.perminv_mode = InvOptOn;
    }
    ((old_perminv_mode));
    /* perm_invent_toggled()
           -> sync_perminvent()
              -> tty_create_nhwindow(NHW_PERMINVENT)
           gives feedback for failure (terminal too small) */
    return (1);
}
export async function handler_menustyle() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let chngd = 0;
    let i = 0;
    let n = 0;
    let old_menu_style = game.flags.menu_style;
    let buf = '';
    let sep = game.iflags.menu_tab_sep ? 9 : 32;
    let style_pick = null;
    let clr = 8;
    /* "in-use__" or "full+grid__" */
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(96 /* sizeof(const char *[4][3]) */ / 24 /* sizeof(const char *[3]) */)); i++) {
        buf = sprintf(buf, "%-12.12s%c%.60s", menutype[i][0], sep, menutype[i][1]);
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, buf, 0, 0, clr, buf, (i == game.flags.menu_style) ? 1 : 0);
        buf = sprintf(buf, "%4s%-12.12s%c%.60s", "", "", sep, menutype[i][2]);
        await add_menu_str(tmpwin, buf);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Select menustyle:");
    n = await select_menu(tmpwin, 1, style_pick);
    if (n > 0) {
        i = style_pick[0].item.a_int - 1;
        /* if there are two picks, use the one that wasn't pre-selected */
        if (n > 1 && i == old_menu_style) {
            i = style_pick[1].item.a_int - 1;
        }
        game.flags.menu_style = i;
        free(style_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    chngd = (game.flags.menu_style != old_menu_style);
    if (chngd || game.flags.verbose) {
        await pline("'menustyle' %s \"%s\".", chngd ? "changed to" : "is still", menutype[game.flags.menu_style][0]);
    }
    return optn_ok;
}
export async function handler_align_misc(optidx) {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let window_pick = null;
    let abuf = '';
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    any.a_int = 3;
    await add_menu(tmpwin, nul_glyphinfo, any, 116, 0, 0, clr, "top", 0);
    any.a_int = 4;
    await add_menu(tmpwin, nul_glyphinfo, any, 98, 0, 0, clr, "bottom", 0);
    any.a_int = 1;
    await add_menu(tmpwin, nul_glyphinfo, any, 108, 0, 0, clr, "left", 0);
    any.a_int = 2;
    await add_menu(tmpwin, nul_glyphinfo, any, 114, 0, 0, clr, "right", 0);
    abuf = sprintf(abuf, "Select %s window placement relative to the map:", (optidx == opt_align_message) ? "message" : "status");
    (game.windowprocs.win_end_menu)(tmpwin, abuf);
    if (await select_menu(tmpwin, 1, window_pick) > 0) {
        if (optidx == opt_align_message) {
            game.iflags.wc_align_message = window_pick.item.a_int;
        } else {
            game.iflags.wc_align_status = window_pick.item.a_int;
        }
        free(window_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_autounlock(optidx) {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let chngd = 0;
    let oldflags = game.flags.autounlock;
    let optname = game.allopt[optidx].name;
    let buf = '';
    let sep = game.iflags.menu_tab_sep ? 9 : 32;
    let window_pick = null;
    let i = 0;
    let n = 0;
    let presel = 0;
    let res = optn_ok;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(64 /* sizeof(const char *[4][2]) */ / 16 /* sizeof(const char *[2]) */)); ++i) {
        buf = sprintf(buf, "%-10.10s%c%.40s", unlocktypes[i][0], sep, unlocktypes[i][1]);
        presel = (game.flags.autounlock & (1 << i));
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, unlocktypes[i][0], 0, 0, clr, buf, (presel ? 1 : 0));
    }
    buf = sprintf(buf, "Select '%.20s' actions:", optname);
    (game.windowprocs.win_end_menu)(tmpwin, buf);
    n = await select_menu(tmpwin, 2, window_pick);
    if (n > 0) {
        let newflags = 0;
        for (i = 0; i < n; ++i) {
            newflags |= (1 << (window_pick[i].item.a_int - 1));
        }
        game.flags.autounlock = newflags;
        free(window_pick);
    } else if (n == 0) {
        /* nothing was picked but menu wasn't cancelled */
        /* something that was preselected got unselected, leaving nothing;
           treat that as picking 'none' (even though 'none' is no longer
           among the choices) */
        game.flags.autounlock = 0;
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    chngd = (game.flags.autounlock != oldflags);
    if ((chngd || game.flags.verbose) && game.give_opt_msg) {
        await optfn_autounlock(optidx, get_val, (0), buf, (null));
        await pline("'%s' %s '%s'.", optname, chngd ? "changed to" : "is still", buf);
    }
    return res;
}
const __handler_disclose_disclosure_names = ["inventory", "attributes", "vanquished", "genocides", "conduct", "overview"];
export async function handler_disclose() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let n = 0;
    let buf = '';
    /* order of disclose_names[] must correspond to
       disclosure_options in decl.c */
    let disc_cat = [0, 0, 0, 0, 0, 0];
    let pick_cnt = 0;
    let pick_idx = 0;
    let opt_idx = 0;
    let c = 0;
    let disclosure_pick = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < 6; i++) {
        buf = sprintf(buf, "%-12s[%c%c]", __handler_disclose_disclosure_names[i], game.flags.end_disclose[i], disclosure_options[i]);
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, disclosure_options[i], 0, 0, clr, buf, 0);
        disc_cat[i] = 0;
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Change which disclosure options categories:");
    pick_cnt = await select_menu(tmpwin, 2, disclosure_pick);
    if (pick_cnt > 0) {
        for (pick_idx = 0; pick_idx < pick_cnt; ++pick_idx) {
            opt_idx = disclosure_pick[pick_idx].item.a_int - 1;
            disc_cat[opt_idx] = 1;
        }
        free(disclosure_pick);
        disclosure_pick = null;
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    for (i = 0; i < 6; i++) {
        if (disc_cat[i]) {
            c = game.flags.end_disclose[i];
            buf = sprintf(buf, "Disclosure options for %s:", __handler_disclose_disclosure_names[i]);
            tmpwin = (game.windowprocs.win_create_nhwindow)(4);
            (game.windowprocs.win_start_menu)(tmpwin, 0);
            Object.assign(any, cg.zeroany);
            /* 'y','n',and '+' work as alternate selectors; '-' doesn't */
            any.a_char = 45;
            await add_menu(tmpwin, nul_glyphinfo, any, 0, any.a_char, 0, clr, "Never disclose, without prompting", (c == any.a_char) ? 1 : 0);
            any.a_char = 43;
            await add_menu(tmpwin, nul_glyphinfo, any, 0, any.a_char, 0, clr, "Always disclose, without prompting", (c == any.a_char) ? 1 : 0);
            if (__handler_disclose_disclosure_names[i] == 118 || __handler_disclose_disclosure_names[i] == 103) {
                any.a_char = 35;
                await add_menu(tmpwin, nul_glyphinfo, any, 0, any.a_char, 0, clr, "Always disclose, pick sort order from menu", (c == any.a_char) ? 1 : 0);
            }
            any.a_char = 110;
            await add_menu(tmpwin, nul_glyphinfo, any, 0, any.a_char, 0, clr, "Prompt, with default answer of \"No\"", (c == any.a_char) ? 1 : 0);
            any.a_char = 121;
            await add_menu(tmpwin, nul_glyphinfo, any, 0, any.a_char, 0, clr, "Prompt, with default answer of \"Yes\"", (c == any.a_char) ? 1 : 0);
            if (__handler_disclose_disclosure_names[i] == 118 || __handler_disclose_disclosure_names[i] == 103) {
                any.a_char = 63;
                await add_menu(tmpwin, nul_glyphinfo, any, 0, any.a_char, 0, clr, "Prompt, with default answer of \"Ask\" to request sort menu", (c == any.a_char) ? 1 : 0);
            }
            (game.windowprocs.win_end_menu)(tmpwin, buf);
            n = await select_menu(tmpwin, 1, disclosure_pick);
            if (n > 0) {
                game.flags.end_disclose[i] = disclosure_pick[0].item.a_char;
                if (n > 1 && game.flags.end_disclose[i] == c) {
                    game.flags.end_disclose[i] = disclosure_pick[1].item.a_char;
                }
                free(disclosure_pick);
            }
            (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        }
    }
    return optn_ok;
}
export async function handler_menu_headings() {
    let gotca = await query_color_attr(game.iflags.menu_headings, "How to highlight menu headings:");
    if (gotca) {
        /* header highlighting affects persistent inventory display */
        /* changing to or from 'f' affects persistent inventory display */
        if (game.iflags.perm_invent) {
            update_inventory();
        }
    }
    adjust_menu_promptstyle(game.WIN_INVEN, game.iflags.menu_headings);
    return optn_ok;
}
export async function handler_menu_objsyms() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let buf = '';
    let picklist = null;
    let sep = game.iflags.menu_tab_sep ? 9 : 32;
    let i = 0;
    let j = 0;
    let n = 0;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(6 /* sizeof(const struct objsymopt [6]) */ / 1 /* sizeof(const struct objsymopt) */)); ++i) {
        buf = nh_snprintf("handler_menu_objsyms", 5809, buf, 256 /* sizeof(char [256]) */, "%-12.12s%c%.60s", objsymvals[i].nam, sep, objsymvals[i].descr);
        any.a_int = i + 1;
        j = objsymvals[i].num;
        await add_menu(tmpwin, nul_glyphinfo, any, 48 + i, buf, 0, clr, buf, (j == game.iflags.menuobjsyms) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Set object symbols in menus to what?");
    n = await select_menu(tmpwin, 1, picklist);
    if (n > 0) {
        i = picklist[0].item.a_int - 1;
        if (n > 1 && i == game.iflags.menuobjsyms) {
            i = picklist[1].item.a_int - 1;
        }
        set_menuobjsyms_flags(i);
        free(picklist);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_msg_window() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let is_tty = (game.windowprocs.wp_id == wp_tty);
    let is_curses = (game.windowprocs.wp_id == wp_curses);
    let clr = 8;
    if (is_tty || is_curses) {
        let chngd = 0;
        let i = 0;
        let n = 0;
        let buf = '';
        let c = 0;
        let sep = game.iflags.menu_tab_sep ? 9 : 32;
        let old_prevmsg_window = game.iflags.prevmsg_window;
        let window_pick = null;
        tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(tmpwin, 0);
        Object.assign(any, cg.zeroany);
        for (i = 0; i < (Math.trunc(96 /* sizeof(const char *[4][3]) */ / 24 /* sizeof(const char *[3]) */)); i++) {
            if (i < 2 && is_curses) {
                continue;
            }
            buf = sprintf(buf, "%-12.12s%c%.60s", msgwind[i][0], sep, msgwind[i][1]);
            any.a_char = c = msgwind[i][0];
            await add_menu(tmpwin, nul_glyphinfo, any, buf, 0, 0, clr, buf, (c == game.iflags.prevmsg_window) ? 1 : 0);
            buf = sprintf(buf, "%4s%-12.12s%c%.60s", "", "", sep, msgwind[i][2]);
            await add_menu_str(tmpwin, buf);
        }
        (game.windowprocs.win_end_menu)(tmpwin, "Select message history display type:");
        n = await select_menu(tmpwin, 1, window_pick);
        if (n > 0) {
            c = window_pick[0].item.a_char;
            if (n > 1 && c == old_prevmsg_window) {
                c = window_pick[1].item.a_char;
            }
            game.iflags.prevmsg_window = c;
            free(window_pick);
        }
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        chngd = (game.iflags.prevmsg_window != old_prevmsg_window);
        if (chngd || game.flags.verbose) {
            await optfn_msg_window(opt_msg_window, get_val, (0), buf, game.empty_optstr);
            await pline("'msg_window' %.20s \"%.20s\".", chngd ? "changed to" : "is still", buf);
        }
    } else {
        await pline("'%s' option is not supported for '%s'.", game.allopt[opt_msg_window].name, game.windowprocs.name);
    }
    return optn_ok;
}
const __handler_number_pad_npchoices = [" 0 (off)", " 1 (on)", " 2 (on, MSDOS compatible)", " 3 (on, phone-style digit layout)", " 4 (on, phone-style layout, MSDOS compatible)", "-1 (off, 'z' to move upper-left, 'y' to zap wands)"];
export async function handler_number_pad() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let mode_pick = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(6 /* sizeof(const char *const [6]) */ / 1 /* sizeof(const char *const) */)); i++) {
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, 97 + i, 48 + i, 0, clr, __handler_number_pad_npchoices[i], 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Select number_pad mode:");
    if (await select_menu(tmpwin, 1, mode_pick) > 0) {
        switch (mode_pick.item.a_int - 1) {
            case 0:
                game.iflags.num_pad = (0);
                game.iflags.num_pad_mode = 0;
                break;
            case 1:
                game.iflags.num_pad = (1);
                game.iflags.num_pad_mode = 0;
                break;
            case 2:
                game.iflags.num_pad = (1);
                game.iflags.num_pad_mode = 1;
                break;
            case 3:
                game.iflags.num_pad = (1);
                game.iflags.num_pad_mode = 2;
                break;
            case 4:
                game.iflags.num_pad = (1);
                game.iflags.num_pad_mode = 3;
                break;
            /* last menu choice: number_pad == -1 */
            case 5:
                game.iflags.num_pad = (0);
                game.iflags.num_pad_mode = 1;
                break;
        }
        reset_commands((0));
        (game.windowprocs.win_number_pad)(game.iflags.num_pad ? 1 : 0);
        free(mode_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_paranoid_confirmation() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let mkey = 0;
    let mbuf = '';
    let ebuf = '';
    let cbuf = '';
    let explain = null;
    let cmdnm = null;
    let paranoia_picks = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; paranoia[i].flagmask != 0; ++i) {
        if (paranoia[i].flagmask == 8 && !game.flags.debug) {
            continue;
        }
        /* the 'swim' choice mentions the 'm' movement prefix in its
           explanation; if that's been bound to something else or been
           unbound altogether, substitute the replacement in the text */
        explain = paranoia[i].explain;
        if (strstri(explain, "'m'") && (mkey = cmd_from_func(do_reqmenu)) != 109) {
            if (mkey) {
                mbuf = sprintf(mbuf, "'%.9s'", visctrl(mkey));
            } else {
                cmdnm = await cmdname_from_func(do_reqmenu, cbuf, (1));
                if (!cmdnm) {
                    cmdnm = "reqmenu";
                }
                mbuf = sprintf(mbuf, "'%s%.31s'", (__nh_char_at0(cmdnm) != 35) ? "#" : "", cmdnm);
            }
            explain = strsubst(strcpy(ebuf, explain), "'m'", mbuf);
        }
        any.a_int = paranoia[i].flagmask;
        await add_menu(tmpwin, nul_glyphinfo, any, paranoia[i].argname, 0, 0, clr, explain, (game.flags.paranoia_bits & paranoia[i].flagmask) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Actions requiring extra confirmation:");
    i = await select_menu(tmpwin, 2, paranoia_picks);
    if (i >= 0) {
        game.flags.paranoia_bits = 0;
        if (i > 0) {
            /* at least 1 item set, either preselected or newly picked */
            while (--i >= 0) {
                game.flags.paranoia_bits |= paranoia_picks[i].item.a_int;
            }
            free(paranoia_picks);
        }
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_perminv_mode() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let let_ = 0;
    let buf = '';
    let sepbuf = '';
    let pi0 = null;
    let pi1 = null;
    let pi_pick = null;
    let old_perm_invent = game.iflags.perm_invent;
    let i = 0;
    let n = 0;
    let old_pi = game.iflags.perminv_mode;
    let new_pi = old_pi;
    let widest = !(game.windowprocs.wp_id == wp_tty) ? 8 : 11;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(216 /* sizeof(const char *[9][3]) */ / 24 /* sizeof(const char *[3]) */)); ++i) {
        if (!(pi0 = perminv_modes[i][0])) {
            continue;
        }
        pi1 = perminv_modes[i][1];
        if (!game.iflags.menu_tab_sep) {
            let numspaces = widest - strlen(pi0);
            sepbuf = sprintf(sepbuf, "%*s", ((numspaces) > (1) ? (numspaces) : (1)), " ");
        } else {
            sepbuf = strcpy(sepbuf, "\t");
        }
        buf = sprintf(buf, "%s%s%s", pi0, sepbuf, perminv_modes[i][2]);
        let_ = ((i & InvSparse) != 0) ? highc(__nh_char_at0(pi1)) : __nh_char_at0(pi0);
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, let_, 48 + i, 0, 8, buf, (i == old_pi) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Choose permanent inventory mode:");
    n = await select_menu(tmpwin, 1, pi_pick);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (n > 0) {
        new_pi = pi_pick[0].item.a_int - 1;
        if (n > 1 && new_pi == old_pi) {
            new_pi = pi_pick[1].item.a_int - 1;
        }
        free(pi_pick);
        game.iflags.perminv_mode = new_pi;
    }
    if (n >= 0) {
        /* the Mac has trouble dealing with the output of messages while
     * processing the config file.  That should get fixed one day.
     * For now just return.
     */
        buf = '';
        await optfn_perminv_mode(opt_perm_invent, get_val, (0), buf, null);
        await pline("'perminv_mode' %s '%s' (%s).", (new_pi != old_pi) ? "changed to" : "is still", perminv_modes[new_pi][0], buf);
        if (new_pi != InvOptNone && !old_perm_invent) {
            game.iflags.perm_invent = can_set_perm_invent();
        } else if (new_pi == InvOptNone && old_perm_invent) {
            game.iflags.perm_invent = (0);
        }
        if (new_pi != old_pi || game.iflags.perm_invent != old_perm_invent) {
            game.opt_need_redraw = (1);
        }
    }
    return optn_ok;
}
export async function handler_pickup_burden() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let burden_name = null;
    let burden_letters = "ubsntl";
    let burden_pick = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(48 /* sizeof(const char *[6]) */ / 8 /* sizeof(const char *) */)); i++) {
        burden_name = burdentype[i];
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, __nh_char_at0(__nh_advance_str(burden_letters, i)), 0, 0, clr, burden_name, 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Select encumbrance level:");
    if (await select_menu(tmpwin, 1, burden_pick) > 0) {
        game.flags.pickup_burden = burden_pick.item.a_int - 1;
        free(burden_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_pickup_types() {
    let buf = '';
    await parseoptions(strcpy(buf, "pickup_types"), (0), (0));
    return optn_ok;
}
export async function handler_runmode() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let mode_name = null;
    let mode_pick = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(32 /* sizeof(const char *[4]) */ / 8 /* sizeof(const char *) */)); i++) {
        mode_name = runmodes[i];
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, __nh_char_at0(mode_name), 0, 0, clr, mode_name, 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Select run/travel display mode:");
    if (await select_menu(tmpwin, 1, mode_pick) > 0) {
        game.flags.runmode = mode_pick.item.a_int - 1;
        free(mode_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_petattr() {
    let tmp = await query_attr("Select pet highlight attribute", game.iflags.wc2_petattr);
    if (tmp != -1) {
        game.iflags.wc2_petattr = tmp;
        game.iflags.wc_hilite_pet = (game.iflags.wc2_petattr != 0);
        if (!game.opt_initial) {
            game.opt_need_redraw = (1);
        }
    }
    return optn_ok;
}
export async function handler_sortloot() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let n = 0;
    let sortl_name = null;
    let sortl_pick = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(24 /* sizeof(const char *[3]) */ / 8 /* sizeof(const char *) */)); i++) {
        sortl_name = sortltype[i];
        any.a_char = __nh_char_at0(sortl_name);
        await add_menu(tmpwin, nul_glyphinfo, any, __nh_char_at0(sortl_name), 0, 0, clr, sortl_name, (game.flags.sortloot == __nh_char_at0(sortl_name)) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Select loot sorting type:");
    n = await select_menu(tmpwin, 1, sortl_pick);
    if (n > 0) {
        let c = sortl_pick[0].item.a_char;
        if (n > 1 && c == game.flags.sortloot) {
            c = sortl_pick[1].item.a_char;
        }
        game.flags.sortloot = c;
        if (game.iflags.perm_invent) {
            update_inventory();
        }
        free(sortl_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_whatis_coord() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let buf = '';
    let window_pick = null;
    let pick_cnt = 0;
    let gpc = game.iflags.getpos_coords;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    any.a_char = 99;
    await add_menu(tmpwin, nul_glyphinfo, any, 99, 0, 0, clr, "compass ('east' or '3s' or '2n,4w')", (gpc == 99) ? 1 : 0);
    any.a_char = 102;
    await add_menu(tmpwin, nul_glyphinfo, any, 102, 0, 0, clr, "full compass ('east' or '3south' or '2north,4west')", (gpc == 102) ? 1 : 0);
    any.a_char = 109;
    await add_menu(tmpwin, nul_glyphinfo, any, 109, 0, 0, clr, "map <x,y>", (gpc == 109) ? 1 : 0);
    any.a_char = 115;
    await add_menu(tmpwin, nul_glyphinfo, any, 115, 0, 0, clr, "screen [row,column]", (gpc == 115) ? 1 : 0);
    any.a_char = 110;
    await add_menu(tmpwin, nul_glyphinfo, any, 110, 0, 0, clr, "none (no coordinates displayed)", (gpc == 110) ? 1 : 0);
    await add_menu_str(tmpwin, "");
    buf = sprintf(buf, "map: upper-left: <%d,%d>, lower-right: <%d,%d>%s", 1, 0, 80 - 1, 21 - 1, game.flags.verbose ? "; column 0 unused, off left edge" : "");
    await add_menu_str(tmpwin, buf);
    if (strcmp(game.windowprocs.name, "tty")) {
        await add_menu_str(tmpwin, "screen: row is offset to accommodate tty interface's use of top line");
    }
    buf = sprintf(buf, "screen: upper-left: [%02d,%02d], lower-right: [%d,%d]%s", 0 + 2, 1, 21 - 1 + 2, 80 - 1, game.flags.verbose ? "; column 80 is not used" : "");
    await add_menu_str(tmpwin, buf);
    await add_menu_str(tmpwin, "");
    (game.windowprocs.win_end_menu)(tmpwin, "Select coordinate display when auto-describing a map position:");
    if ((pick_cnt = await select_menu(tmpwin, 1, window_pick)) > 0) {
        game.iflags.getpos_coords = window_pick[0].item.a_char;
        /* PICK_ONE doesn't unselect preselected entry when
           selecting another one */
        if (pick_cnt > 1 && game.iflags.getpos_coords == gpc) {
            game.iflags.getpos_coords = window_pick[1].item.a_char;
        }
        free(window_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_whatis_filter() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let window_pick = null;
    let pick_cnt = 0;
    let gfilt = game.iflags.getloc_filter;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    any.a_char = (GFILTER_NONE + 1);
    await add_menu(tmpwin, nul_glyphinfo, any, 110, 0, 0, clr, "no filtering", (gfilt == GFILTER_NONE) ? 1 : 0);
    any.a_char = (GFILTER_VIEW + 1);
    await add_menu(tmpwin, nul_glyphinfo, any, 118, 0, 0, clr, "in view only", (gfilt == GFILTER_VIEW) ? 1 : 0);
    any.a_char = (GFILTER_AREA + 1);
    await add_menu(tmpwin, nul_glyphinfo, any, 97, 0, 0, clr, "in same area", (gfilt == GFILTER_AREA) ? 1 : 0);
    (game.windowprocs.win_end_menu)(tmpwin, "Select location filtering when going for next/previous map position:");
    if ((pick_cnt = await select_menu(tmpwin, 1, window_pick)) > 0) {
        game.iflags.getloc_filter = (window_pick[0].item.a_char - 1);
        if (pick_cnt > 1 && game.iflags.getloc_filter == gfilt) {
            game.iflags.getloc_filter = (window_pick[1].item.a_char - 1);
        }
        free(window_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
export async function handler_symset(optidx) {
    let reslt = 0;
    reslt = await do_symset(optidx == opt_roguesymset);
    game.opt_need_redraw = (1);
    return reslt;
}
export async function handler_autopickup_exception() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let opt_idx = 0;
    let numapes = 0;
    /* so &apebuf[1] is BUFSZ long for getlin() */
    let apebuf = '';
    let ape = null;
    let clr = 8;
    ape_again: while (true) {
        numapes = count_apes();
        opt_idx = await handle_add_list_remove("autopickup exception", numapes);
        if (opt_idx == 3) {
            return (1);
        } else if (opt_idx == 0) {
            /* EDIT_GETLIN:  assume user doesn't user want previous
           exception used as default input string for this one... */
            (apebuf = __nh_char_write(apebuf, 1, 0), apebuf = '');
            await getlin("What new autopickup exception pattern?", { get value() { return __nh_char_at0(__nh_advance_str(apebuf, 1)); }, set value(_v) { __nh_char_at0(__nh_advance_str(apebuf, 1)) = _v; } });
            mungspaces(__nh_char_at0(__nh_advance_str(apebuf, 1)));
            if (__nh_char_at0(__nh_advance_str(apebuf, 1)) == 27) {
                return (1);
            }
            if (__nh_char_at0(__nh_advance_str(apebuf, 1))) {
                apebuf = __nh_char_write(apebuf, 0, 34);
                /* guarantee room for \" prefix and \"\0 suffix;
               -2 is good enough for apebuf[] but -3 makes
               sure the whole thing fits within normal BUFSZ */
                apebuf = __nh_char_write(apebuf, 258 /* sizeof(char [258]) */ - 2, 0);
                apebuf = strcat(apebuf, "\"");
                add_autopickup_exception(apebuf);
            }
            continue ape_again;
        } else {
            let pick_idx = 0;
            let pick_cnt = 0;
            let pick_list = null;
            tmpwin = (game.windowprocs.win_create_nhwindow)(4);
            (game.windowprocs.win_start_menu)(tmpwin, 0);
            if (numapes) {
                ape = game.apelist;
                Object.assign(any, cg.zeroany);
                await add_menu_heading(tmpwin, "Always pickup '<'; never pickup '>'");
                for (i = 0; i < numapes && ape; i++) {
                    any.a_void = (opt_idx == 1) ? null : ape;
                    apebuf = sprintf(apebuf, "\"%c%s\"", ape.grab ? 60 : 62, ape.pattern);
                    await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, apebuf, 0);
                    ape = ape.next;
                }
            }
            apebuf = sprintf(apebuf, "%s autopickup exceptions", (opt_idx == 1) ? "List of" : "Remove which");
            (game.windowprocs.win_end_menu)(tmpwin, apebuf);
            pick_cnt = await select_menu(tmpwin, (opt_idx == 1) ? 0 : 2, pick_list);
            if (pick_cnt > 0) {
                /* length of pattern plus quotes (plus '<'/'>') is
                   less than BUFSZ */
                for (pick_idx = 0; pick_idx < pick_cnt; ++pick_idx) {
                    remove_autopickup_exception(pick_list[pick_idx].item.a_void);
                }
                free(pick_list) , pick_list = null;
            }
            (game.windowprocs.win_destroy_nhwindow)(tmpwin);
            if (pick_cnt >= 0) {
                continue ape_again;
            }
        }
        return optn_ok;
        break;
    }
}
export async function handler_menu_colors() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let buf = '';
    let opt_idx = 0;
    let nmc = 0;
    let mcclr = 0;
    let mcattr = 0;
    let mcbuf = '';
    let clr = 8;
    menucolors_again: while (true) {
        nmc = count_menucolors();
        opt_idx = await handle_add_list_remove("menucolor", nmc);
        if (opt_idx == 3) {
            if (game.iflags.use_menu_color) {
                /* in case we've made a change which impacts current persistent
           inventory window; we don't track whether an actual changed
           occurred, so just assume there was one and that it matters;
           if we're wrong, a redundant update is cheap... */
                if (game.iflags.perm_invent) {
                    update_inventory();
                }
            }
            return optn_ok;
        } else if (opt_idx == 0) {
            mcbuf = '';
            mcbuf = await getlin("What new menucolor pattern?", mcbuf);
            if (mcbuf == 27) {
                if (game.iflags.use_menu_color) {
                    if (game.iflags.perm_invent) {
                        update_inventory();
                    }
                }
                return optn_ok;
            }
            if (mcbuf && test_regex_pattern(mcbuf, "MENUCOLORS regex") && (mcclr = await query_color(null, 8)) != -1 && (mcattr = await query_attr(null, 0)) != -1 && !add_menu_coloring_parsed(mcbuf, mcclr, mcattr)) {
                await pline("Error adding the menu color.");
                (game.windowprocs.win_wait_synch)();
            }
            continue menucolors_again;
        } else {
            let pick_idx = 0;
            let pick_cnt = 0;
            let mc_idx = 0;
            let ln = 0;
            let sattr = null;
            let sclr = null;
            let pick_list = null;
            let tmp = game.menu_colorings;
            let clrbuf = '';
            tmpwin = (game.windowprocs.win_create_nhwindow)(4);
            (game.windowprocs.win_start_menu)(tmpwin, 0);
            Object.assign(any, cg.zeroany);
            mc_idx = 0;
            while (tmp) {
                sattr = attr2attrname(tmp.attr);
                sclr = strcpy(clrbuf, clr2colorname(tmp.color));
                strNsubst(clrbuf, " ", "-", 0);
                any.a_int = ++mc_idx;
                buf = sprintf(buf, "\"\"=%s%s%s", sclr, (tmp.attr != 0) ? "&" : "", (tmp.attr != 0) ? sattr : "");
                ln = 256 /* sizeof(char [256]) */ - await Strlen_(buf, "handler_menu_colors", 6470) - 1;
                mcbuf = strcpy(mcbuf, "\"");
                if (strlen(tmp.origstr) > ln) {
                    strcat(strncat(mcbuf, tmp.origstr, ln - 3), "...");
                } else {
                    mcbuf = strcat(mcbuf, tmp.origstr);
                }
                mcbuf = strcat(mcbuf, __nh_char_at0(__nh_advance_str(buf, 1)));
                await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, mcbuf, 0);
                tmp = tmp.next;
            }
            mcbuf = sprintf(mcbuf, "%s menu colors", (opt_idx == 1) ? "List of" : "Remove which");
            (game.windowprocs.win_end_menu)(tmpwin, mcbuf);
            pick_cnt = await select_menu(tmpwin, (opt_idx == 1) ? 0 : 2, pick_list);
            if (pick_cnt > 0) {
                for (pick_idx = 0; pick_idx < pick_cnt; ++pick_idx) {
                    free_one_menu_coloring(pick_list[pick_idx].item.a_int - 1 - pick_idx);
                }
                free(pick_list) , pick_list = null;
            }
            (game.windowprocs.win_destroy_nhwindow)(tmpwin);
            if (pick_cnt >= 0) {
                continue menucolors_again;
            }
        }
        return optn_ok;
        break;
    }
}
export async function handler_msgtype() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let opt_idx = 0;
    let nmt = 0;
    let mttyp = 0;
    let mtbuf = '';
    msgtypes_again: while (true) {
        nmt = msgtype_count();
        opt_idx = await handle_add_list_remove("message type", nmt);
        if (opt_idx == 3) {
            return (1);
        } else if (opt_idx == 0) {
            mtbuf = '';
            mtbuf = await getlin("What new message pattern?", mtbuf);
            if (mtbuf == 27) {
                return (1);
            }
            if (mtbuf && test_regex_pattern(mtbuf, "MSGTYPE regex") && (mttyp = await query_msgtype()) != -1 && !msgtype_add(mttyp, mtbuf)) {
                await pline("Error adding the message type.");
                (game.windowprocs.win_wait_synch)();
            }
            continue msgtypes_again;
        } else {
            let pick_idx = 0;
            let pick_cnt = 0;
            let mt_idx = 0;
            let ln = 0;
            let mtype = null;
            let pick_list = null;
            let tmp = game.plinemsg_types;
            let clr = 8;
            tmpwin = (game.windowprocs.win_create_nhwindow)(4);
            (game.windowprocs.win_start_menu)(tmpwin, 0);
            Object.assign(any, cg.zeroany);
            mt_idx = 0;
            while (tmp) {
                mtype = msgtype2name(tmp.msgtype);
                any.a_int = ++mt_idx;
                mtbuf = sprintf(mtbuf, "%-5s \"", mtype);
                ln = 256 /* sizeof(char [256]) */ - await Strlen_(mtbuf, "handler_msgtype", 6544) - 2 /* sizeof(char [2]) */;
                if (strlen(tmp.pattern) > ln) {
                    strcat(strncat(mtbuf, tmp.pattern, ln - 3), "...\"");
                } else {
                    strcat(strcat(mtbuf, tmp.pattern), "\"");
                }
                await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, mtbuf, 0);
                tmp = tmp.next;
            }
            mtbuf = sprintf(mtbuf, "%s message types", (opt_idx == 1) ? "List of" : "Remove which");
            (game.windowprocs.win_end_menu)(tmpwin, mtbuf);
            pick_cnt = await select_menu(tmpwin, (opt_idx == 1) ? 0 : 2, pick_list);
            if (pick_cnt > 0) {
                for (pick_idx = 0; pick_idx < pick_cnt; ++pick_idx) {
                    free_one_msgtype(pick_list[pick_idx].item.a_int - 1 - pick_idx);
                }
                free(pick_list) , pick_list = null;
            }
            (game.windowprocs.win_destroy_nhwindow)(tmpwin);
            if (pick_cnt >= 0) {
                continue msgtypes_again;
            }
        }
        return optn_ok;
        break;
    }
}
export async function handler_versinfo() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let vi_pick = null;
    let have_branch = (game.nomakedefs.git_branch && __nh_char_at0(game.nomakedefs.git_branch));
    let n = 0;
    let vi = game.flags.versinfo;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    any.a_int = n = 1;
    await add_menu(tmpwin, nul_glyphinfo, any, 110, n + 48, 0, 8, "version number", (vi & n) ? 1 : 0);
    any.a_int = n = 2;
    await add_menu(tmpwin, nul_glyphinfo, any, 103, n + 48, 0, 8, "game name", (vi & n) ? 1 : 0);
    any.a_int = n = 4;
    await add_menu(tmpwin, nul_glyphinfo, any, 98, n + 48, 0, 8, (have_branch ? "development branch" : "(not applicable)"), (vi & n) ? 1 : 0);
    (game.windowprocs.win_end_menu)(tmpwin, "Select version information flags:");
    n = await select_menu(tmpwin, 2, vi_pick);
    if (n > 0) {
        let i = 0;
        let newval = 0;
        for (i = 0; i < n; ++i) {
            newval |= vi_pick[i].item.a_int;
        }
        newval &= 7;
        if (newval) {
            game.flags.versinfo = newval;
        }
        free(vi_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
const __handler_windowborders_windowborders_text = ["Off, never show borders", "On, always show borders", "Auto, on if display is at least (24+2)x(80+2)", "On, except forced off for perm_invent", "Auto, except forced off for perm_invent"];
export async function handler_windowborders() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let mode_name = null;
    let mode_pick = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)); i++) {
        mode_name = __handler_windowborders_windowborders_text[i];
        any.a_int = i + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, 97 + i, 48 + i, 0, clr, mode_name, 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Select window borders mode:");
    if (await select_menu(tmpwin, 1, mode_pick) > 0) {
        game.iflags.wc2_windowborders = mode_pick.item.a_int - 1;
        free(mode_pick);
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return optn_ok;
}
/*
 **********************************
 *
 *   Parsing Support Functions
 *
 **********************************
 */
export function string_for_opt(opts, val_optional) {
    let colon = null;
    let equals = null;
    colon = strchr(opts, 58);
    equals = strchr(opts, 61);
    if (!colon || (equals && equals < colon)) {
        colon = equals;
    }
    if (!colon || !__nh_char_at0((colon = __nh_advance_str(colon, 1)))) {
        if (!val_optional) {
            config_error_add("Missing parameter for '%s'", opts);
        }
        return game.empty_optstr;
    }
    return colon;
}
export async function string_for_env_opt(optname, opts, val_optional) {
    if (!game.opt_initial) {
        await rejectoption(optname);
        return game.empty_optstr;
    }
    return string_for_opt(opts, val_optional);
}
export function bad_negation(optname, with_parameter) {
    config_error_add("The %s option may not %sbe negated.", optname, with_parameter ? "both have a value and " : "");
}
/* go through all of the options and set the minmatch value
   based on what is needed for uniqueness of each individual
   option. Set a minimum of 3 characters. */
export async function determine_ambiguities() {
    let i = 0;
    let j = 0;
    let len = 0;
    let tmpneeded = 0;
    let needed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let p1 = null;
    let p2 = null;
    for (i = 0; i < (Math.trunc(218 /* sizeof(struct allopt_t [218]) */ / 1 /* sizeof(struct allopt_t) */)) - 1; ++i) {
        needed[i] = 0;
    }
    for (i = 0; i < (Math.trunc(218 /* sizeof(struct allopt_t [218]) */ / 1 /* sizeof(struct allopt_t) */)) - 1; ++i) {
        for (j = 0; j < (Math.trunc(218 /* sizeof(struct allopt_t [218]) */ / 1 /* sizeof(struct allopt_t) */)) - 1; ++j) {
            if (j == i) {
                continue;
            }
            p1 = game.allopt[i].name;
            p2 = game.allopt[j].name;
            tmpneeded = 1;
            while (__nh_char_at0(p1) && __nh_char_at0(p2) && lowc(__nh_char_at0(p1)) == lowc(__nh_char_at0(p2))) {
                ++tmpneeded;
                (p1 = __nh_advance_str(p1, 1));
                (p2 = __nh_advance_str(p2, 1));
            }
            if (tmpneeded > needed[i]) {
                needed[i] = tmpneeded;
            }
            if (tmpneeded > needed[j]) {
                needed[j] = tmpneeded;
            }
        }
    }
    for (i = 0; i < (Math.trunc(218 /* sizeof(struct allopt_t [218]) */ / 1 /* sizeof(struct allopt_t) */)) - 1; ++i) {
        len = await Strlen_(game.allopt[i].name, "determine_ambiguities", 6732);
        game.allopt[i].minmatch = (needed[i] < 3) ? 3 : (needed[i] <= len) ? needed[i] : len;
    }
}
export function length_without_val(user_string, len) {
    let p = strchr(user_string, 58);
    let q = strchr(user_string, 61);
    if (!p || (q && q < p)) {
        p = q;
    }
    if (p) {
        /* 'user_string' hasn't necessarily been through mungspaces()
           so might have tabs or consecutive spaces */
        while (p > user_string && ((__ctype_b_loc())[((__nh_char_at0((p - 1))))] & _ISspace)) {
            (p = __nh_advance_str(p, -1));
        }
        len = ((user_string.length - p.length));
    }
    return len;
}
/* check whether a user-supplied option string is a proper leading
   substring of a particular option name; option string might have
   a colon or equals sign and arbitrary value appended to it */
export function match_optname(user_string, optn_name, min_length, val_allowed) {
    let len = strlen(user_string);
    if (val_allowed) {
        len = length_without_val(user_string, len);
    }
    return (len >= min_length && !strncmpi(optn_name, user_string, len));
}
export function reset_duplicate_opt_detection() {
    let k = 0;
    for (k = 0; k < OPTCOUNT; ++k) {
        game.allopt[k].dupdetected = 0;
    }
}
export function duplicate_opt_detection(optidx) {
    if (game.opt_initial && game.opt_from_file) {
        return game.allopt[optidx].dupdetected++;
    }
    return (0);
}
export function complain_about_duplicate(optidx) {
    let buf = '';
    buf = '';
    if (game.using_alias) {
        buf = sprintf(buf, " (via alias: %s)", game.allopt[optidx].alias);
    }
    config_error_add("%s option specified multiple times: %s%s", (game.allopt[optidx].opttyp == CompOpt) ? "compound" : "boolean", game.allopt[optidx].name, buf);
    /*
     * TODO:
     *  briefly describe interface-specific option-like settings for
     *  the currently active interface:
     *    X11 uses X-specific "application defaults" from NetHack.ad;
     *    Qt has menu accessible "game -> Qt settings" (non-OSX) or
     *      "nethack -> Preferences" (OSX) to maintain a few options
     *      (font size, map tile size, paperdoll show/hide flag and
     *      tile size) which persist across games;
     *    Windows GUI also has some port-specific menus;
     *    tty and curses: anything?
     *  Best done via a new windowprocs function rather than plugging
     *  in details here.
     *
     * Maybe:
     *  switch from text window to pick-none menu so that user can
     *  scroll back up.  (Not necessary for Qt where text windows are
     *  already scrollable.)
     */
    return;
}
export async function rejectoption(optname) {
    await pline("%s can be set only from NETHACKOPTIONS or %s.", optname, get_configfile());
}
/*

# errors:
OPTIONS=aaaaaaaaaa[ more than 247 (255 - 8 for 'OPTIONS=') total ]aaaaaaaaaa
OPTIONS
OPTIONS=
MSGTYPE=stop"You swap places with "
MSGTYPE=st.op "You swap places with "
MSGTYPE=stop "You swap places with \"
MENUCOLOR=" blessed "green&none
MENUCOLOR=" holy " = green&reverse
MENUCOLOR=" cursed " = red&uline
MENUCOLOR=" unholy " = reed
OPTIONS=!legacy:true,fooo
OPTIONS=align:!pin
OPTIONS=gender

*/
/* most environment variables will eventually be printed in an error
 * message if they don't work, and most error message paths go through
 * BUFSZ buffers, which could be overflowed by a maliciously long
 * environment variable.  If a variable can legitimately be long, or
 * if it's put in a smaller buffer, the responsible code will have to
 * bounds-check itself.
 */
export function nh_getenv(ev) {
    let getev = getenv(ev);
    if (getev && strlen(getev) <= (Math.trunc(256 / 2))) {
        return getev;
    } else {
        return null;
    }
}
/* copy up to maxlen-1 characters; 'dest' must be able to hold maxlen;
   treat comma as alternate end of 'src' */
export function nmcpy(dest, src, maxlen) {
    let __nh_dest_idx = 0;
    let count = 0;
    for (count = 1; count < maxlen; count++) {
        if (__nh_char_at0(src) == 44 || __nh_char_at0(src) == 0) {
            break;
        }
        dest = dest.slice(0, __nh_dest_idx++) + String.fromCharCode((src = __nh_advance_str(src, 1)));
    }
    dest.value = 0;
}
/*
 * escapes(): escape expansion for showsyms.  C-style escapes understood
 * include \n, \b, \t, \r, \xnnn (hex), \onnn (octal), \nnn (decimal).
 * (Note: unlike in C, leading digit 0 is not used to indicate octal;
 * the letter o (either upper or lower case) is used for that.
 * The ^-prefix for control characters is also understood, and \[mM]
 * has the effect of 'meta'-ing the value which follows (so that the
 * alternate character set will be enabled).
 *
 * X     normal key X
 * ^X    control-X
 * \mX   meta-X
 *
 * For 3.4.3 and earlier, input ending with "\M", backslash, or caret
 * prior to terminating '\0' would pull that '\0' into the output and then
 * keep processing past it, potentially overflowing the output buffer.
 * Now, trailing \ or ^ will act like \\ or \^ and add '\\' or '^' to the
 * output and stop there; trailing \M will fall through to \<other> and
 * yield 'M', then stop.  Any \X or \O followed by something other than
 * an appropriate digit will also fall through to \<other> and yield 'X'
 * or 'O', plus stop if the non-digit is end-of-string.
 */
/* might be 'tp', updating in place */
/* result is never longer than 'cp' */
const __escapes_oct = "01234567";
const __escapes_dec = "0123456789";
export function escapes(cp, tp) {
    let __nh_tp_idx = 0;
    /* hexdd[] is defined in decl.c */
    let dp = null;
    let cval = 0;
    let meta = 0;
    let dcount = 0;
    while (__nh_char_at0(cp)) {
        /* \M has to be followed by something to do meta conversion,
           otherwise it will just be \M which ultimately yields 'M' */
        meta = (__nh_char_at0(cp) == 92 && (__nh_char_at0(__nh_advance_str(cp, 1)) == 109 || __nh_char_at0(__nh_advance_str(cp, 1)) == 77) && __nh_char_at0(__nh_advance_str(cp, 2)));
        if (meta) {
            /* move past backslash and 'O' */
            /* move past backslash and 'X' */
            cp = __nh_advance_str(cp, 2);
        }
        /* for decimal, octal, hexadecimal cases */
        cval = dcount = 0;
        if ((__nh_char_at0(cp) != 92 && __nh_char_at0(cp) != 94) || !__nh_char_at0(__nh_advance_str(cp, 1))) {
            /* simple character, or nothing left for \ or ^ to escape */
            cval = (cp = __nh_advance_str(cp, 1));
        } else if (__nh_char_at0(cp) == 94) {
            /* expand control-character syntax */
            cval = (__nh_char_at0((cp = __nh_advance_str(cp, 1))) & 31);
            /* remaining cases are all for backslash; we know cp[1] is not \0 */
            /* move past backslash to first digit */
            (cp = __nh_advance_str(cp, 1));
        } else if (strchr(__escapes_dec, __nh_char_at0(__nh_advance_str(cp, 1)))) {
            (cp = __nh_advance_str(cp, 1));
            do {
                cval = (cval * 10) + (__nh_char_at0(cp) - 48);
            } while (__nh_char_at0((cp = __nh_advance_str(cp, 1))) && strchr(__escapes_dec, __nh_char_at0(cp)) && ++dcount < 3);
        } else if ((__nh_char_at0(__nh_advance_str(cp, 1)) == 111 || __nh_char_at0(__nh_advance_str(cp, 1)) == 79) && __nh_char_at0(__nh_advance_str(cp, 2)) && strchr(__escapes_oct, __nh_char_at0(__nh_advance_str(cp, 2)))) {
            cp = __nh_advance_str(cp, 2);
            do {
                cval = (cval * 8) + (__nh_char_at0(cp) - 48);
            } while (__nh_char_at0((cp = __nh_advance_str(cp, 1))) && strchr(__escapes_oct, __nh_char_at0(cp)) && ++dcount < 3);
        } else if ((__nh_char_at0(__nh_advance_str(cp, 1)) == 120 || __nh_char_at0(__nh_advance_str(cp, 1)) == 88) && __nh_char_at0(__nh_advance_str(cp, 2)) && (dp = strchr(hexdd, __nh_char_at0(__nh_advance_str(cp, 2)))) != null) {
            cp = __nh_advance_str(cp, 2);
            do {
                cval = (cval * 16) + (Math.trunc(((hexdd.length - dp.length)) / 2));
            } while (__nh_char_at0((cp = __nh_advance_str(cp, 1))) && (dp = strchr(hexdd, __nh_char_at0(cp))) != null && ++dcount < 2);
        } else {
            switch (__nh_char_at0((cp = __nh_advance_str(cp, 1)))) {
                /* C-style character escapes */
                case 92:
                    cval = 92;
                    break;
                case 110:
                    cval = 10;
                    break;
                case 116:
                    cval = 9;
                    break;
                case 98:
                    cval = 8;
                    break;
                case 114:
                    cval = 13;
                    break;
                default:
                    cval = __nh_char_at0(cp);
            }
            (cp = __nh_advance_str(cp, 1));
        }
        if (meta) {
            cval |= 128;
        }
        tp = tp.slice(0, __nh_tp_idx++) + String.fromCharCode(cval);
    }
    tp.value = 0;
}
/* returns a one-byte character from the text; may change txt[];
   moved from cmd.c in order to get access to escapes() */
export function txt2key(txt) {
    let uc = 0;
    let makemeta = (0);
    txt = trimspaces(txt);
    if (!__nh_char_at0(txt)) {
        return 0;
    }
    if (!__nh_char_at0(__nh_advance_str(txt, 1))) {
        return __nh_char_at0(txt);
    }
    if (!strcmp(txt, "<enter>")) {
        return 10;
    }
    if (!strcmp(txt, "<space>")) {
        return 32;
    }
    if (!strcmp(txt, "<esc>")) {
        return 27;
    }
    if (__nh_char_at0(txt) == 92) {
        /* handle things like \b and \7 and \mX */
        let tbuf = '';
        if (strlen(txt) >= 128 /* sizeof(char [128]) */) {
            txt = __nh_char_write(txt, 128 /* sizeof(char [128]) */ - 1, 0);
        }
        escapes(txt, tbuf);
        return tbuf;
    }
    if (highc(__nh_char_at0(txt)) == 77) {
        /*
         * M <nothing>             return 'M'
         * M - <nothing>           return M-'-'
         * M <other><nothing>      return M-<other>
         * otherwise M is pending until after ^/C- processing.
         * Since trailing spaces are discarded, the only way to
         * specify M-' ' is via "160".
         */
        if (!__nh_char_at0(__nh_advance_str(txt, 1))) {
            return __nh_char_at0(txt);
        }
        /* skip past 'M' or 'm' and maybe '-' */
        (txt = __nh_advance_str(txt, 1));
        /* unlike M-x, lots of values of x are invalid for C-x;
           checking and rejecting them is not worthwhile; GIGO;
           we do accept "^-x" as synonym for "^x" or "C-x" */
        if (__nh_char_at0(txt) == 45 && __nh_char_at0(__nh_advance_str(txt, 1))) {
            (txt = __nh_advance_str(txt, 1));
        }
        if (!__nh_char_at0(__nh_advance_str(txt, 1))) {
            return ((__nh_char_at0(txt)) - 128);
        }
        makemeta = (1);
    }
    if (__nh_char_at0(txt) == 94 || highc(__nh_char_at0(txt)) == 67) {
        /*
         * C <nothing>             return 'C' or M-'C'
         * C - <nothing>           return '-' or M-'-'
         * C [-] <other><nothing>  return C-<other> or M-C-<other>
         * C [-] ?                 return <rubout>
         * otherwise return C-<other> or M-C-<other>
         */
        uc = __nh_char_at0(txt);
        if (!__nh_char_at0(__nh_advance_str(txt, 1))) {
            return makemeta ? ((uc) - 128) : uc;
        }
        (txt = __nh_advance_str(txt, 1));
        if (__nh_char_at0(txt) == 45 && __nh_char_at0(__nh_advance_str(txt, 1))) {
            (txt = __nh_advance_str(txt, 1));
        }
        /* and accept ^?, which gets used despite not being a control char */
        if (__nh_char_at0(txt) == 63) {
            return (makemeta ? 4294967295 : 127);
        }
        uc = (31 & (__nh_char_at0(txt)));
        return makemeta ? ((uc) - 128) : uc;
    }
    if (makemeta && __nh_char_at0(txt)) {
        return ((__nh_char_at0(txt)) - 128);
    }
    if (__nh_char_at0(txt) >= 48 && __nh_char_at0(txt) <= 57) {
        /* FIXME: should accept single-quote single-character single-quote
       and probably single-quote backslash octal-digits single-quote;
       if we do that, the M- and C- results should be pending until
       after, so that C-'X' becomes valid for ^X */
        /* ascii codes: must be three-digit decimal */
        let key = 0;
        let i = 0;
        for (i = 0; i < 3; i++) {
            if (__nh_char_at0(__nh_advance_str(txt, i)) < 48 || __nh_char_at0(__nh_advance_str(txt, i)) > 57) {
                return 0;
            }
            key = 10 * key + __nh_char_at0(__nh_advance_str(txt, i)) - 48;
        }
        return key;
    }
    return 0;
}
/*
 **********************************
 *
 *   Options Initialization
 *
 **********************************
 */
/* process options, possibly including SYSCF */
export async function initoptions() {
    if (game.opt_phase != builtin_opt) {
        await initoptions_init();
    }
    /* someday there may be other SYSCF alternatives besides text file */
    /* If SYSCF_FILE is specified, it _must_ exist... */
    assure_syscf_file();
    config_error_init((1), "sysconf", (0));
    /* ... and _must_ parse correctly. */
    game.opt_phase = syscf_opt;
    if (!read_config_file("sysconf", set_in_sysconf)) {
        if (config_error_done() && !game.iflags.initoptions_noterminate) {
            nh_terminate(1);
        }
    }
    config_error_done();
    /*
     * TODO [maybe]: parse the sysopt entries which are space-separated
     * lists of usernames into arrays with one name per element.
     */
    /* Carry out options that got deferred from early_options */
    if (game.deferred_showpaths) {
        do_deferred_showpaths(0);
    }
    await initoptions_finish();
}
/* set up default values for options where 0 or False isn't sufficient */
export async function initoptions_init() {
    let opts = null;
    let i = 0;
    let have_branch = (game.nomakedefs.git_branch && __nh_char_at0(game.nomakedefs.git_branch));
    /* Did I need to move this here? */
    game.opt_phase = builtin_opt;
    /* initialize the function pointers for saving the game */
    sf_init();
    await allopt_array_init();
    if (game.cmdline_windowsys) {
        /* if windowtype has been specified on the command line, set it up
       early so windowtype-specific options use it as their base */
        nmcpy(game.chosen_windowtype, game.cmdline_windowsys, 16);
        config_error_init((0), "command line", (0));
        await choose_windows(game.cmdline_windowsys);
        config_error_done();
        /*
         * FIXME?  This continues even if setting windowtype to player's
         * specified value fails.  It doesn't lock the windowtype in
         * that situation though, so the game will use whatever is in
         * RC/NETHACKOPTIONS or resort to DEFAULT_WINDOW_SYS.
         */
        if (game.windowprocs.name && !strncmpi((game.windowprocs.name), (game.cmdline_windowsys), -1)) {
            game.iflags.windowtype_locked = (1);
        }
        /* ignore any windowtype:foo in RC file or NETHACKOPTIONS */
        /* shouldn't need cmdline_windowsys beyond here */
        free(game.cmdline_windowsys) , game.cmdline_windowsys = null;
    }
    if (!glyphid_cache_status()) {
        await fill_glyphid_cache();
    }
    /* set up the command parsing */
    reset_commands((1));
    await init_random(rn2);
    await init_random(rn2_on_display_rng);
    game.opt_phase = builtin_opt;
    for (i = 0; game.allopt[i].name; i++) {
        if (game.allopt[i].addr) {
            game.allopt[i].addr.value = game.allopt[i].initval;
        }
    }
    game.flags.end_own = (0);
    game.flags.end_top = 3;
    game.flags.end_around = 2;
    game.flags.paranoia_bits = 32 | 1024 | 2048;
    game.flags.versinfo = have_branch ? 4 : 1;
    game.flags.pile_limit = 5;
    game.flags.runmode = RUN_LEAP;
    game.iflags.msg_history = 20;
    /* msg_window has conflicting defaults for multi-interface binary */
    game.iflags.prevmsg_window = 115;
    game.iflags.menu_headings.attr = 7;
    game.iflags.menu_headings.color = 8;
    game.iflags.getpos_coords = 110;
    /* hero's role, race, &c haven't been chosen yet */
    game.flags.initrole = game.flags.initrace = game.flags.initgend = game.flags.initalign = (-1);
    init_ov_primary_symbols();
    init_ov_rogue_symbols();
    /* Set the default monster and object class symbols. */
    init_symbols();
    for (i = 0; i < 6; i++) {
        game.warnsyms[i] = def_warnsyms[i].sym;
    }
    /* assert( sizeof flags.inv_order == sizeof def_inv_order ); */
    memcpy(game.flags.inv_order, def_inv_order, 18 /* sizeof(char [18]) */);
    game.flags.pickup_types = '';
    game.flags.pickup_burden = MOD_ENCUMBER;
    /* sort only loot by default */
    game.flags.sortloot = 108;
    for (i = 0; i < 6; i++) {
        game.flags.end_disclose[i] = 110;
    }
    switch_symbols((0));
    init_rogue_symbols();
    if ((opts = nh_getenv("TERM")) && !strncmp(opts, "AT", 2)) {
        /*
     * Set defaults for some options depending on what we can
     * detect about the environment's capabilities.
     * This has to be done after the global initialization above
     * and before reading user-specific initialization via
     * config file/environment variable below.
     */
        /* this detects the IBM-compatible console on most 386 boxes */
        /* detect whether a "vt" terminal can handle alternate charsets */
        /* [could also check "xterm" which emulates vtXXX by default] */
        if (!game.symset[PRIMARYSET].explicitly) {
            load_symset("IBMGraphics", PRIMARYSET);
        }
        if (!game.symset[ROGUESET].explicitly) {
            load_symset("RogueIBM", ROGUESET);
        }
        switch_symbols((1));
        game.iflags.wc_color = (1);
    }
    if ((opts = nh_getenv("TERM")) && !strncmpi(opts, "vt", 2) && game.tc_gbl_data.tc_AS && game.tc_gbl_data.tc_AE && strchr(game.tc_gbl_data.tc_AS, 14) && strchr(game.tc_gbl_data.tc_AE, 15)) {
        if (!game.symset[PRIMARYSET].explicitly) {
            load_symset("DECGraphics", PRIMARYSET);
        }
        switch_symbols((1));
    }
    game.flags.menu_style = 2;
    game.iflags.wc_align_message = 3;
    game.iflags.wc_align_status = 4;
    game.iflags.wc2_statuslines = 2;
    game.iflags.wc2_petattr = 7;
    game.iflags.wc2_windowborders = 2;
    /*
     * A few menus have certain items (typically operate-on-everything or
     * change-subset or sort or help entries) flagged as 'skip-invert' to
     * control how whole-page and whole-menu operations affect them.
     * 'menuinvertmode' controls how that functions:
     * 0: ignore 'skip-invert' flag on menu items (used to be the default);
     * 1: don't toggle 'skip-invert' items On for set-all/set-page/invert-
     *    all/invert-page but do toggle Off if already set (default);
     * 2: don't toggle 'skip-invert' items either On of Off for set-all/
     *    set-page/unset-all/unset-page/invert-all/invert-page.
     */
    game.iflags.menuinvertmode = 1;
    /* since this is done before init_objects(), do partial init here */
    game.objects[SLIME_MOLD].oc_name_idx = SLIME_MOLD;
    nmcpy(game.pl_fruit, (game.obj_descr[(game.objects[SLIME_MOLD]).oc_name_idx].oc_name), 32);
    assure_syscf_file();
    config_error_init((1), "sysconf", (0));
    game.opt_phase = syscf_opt;
    if (!read_config_file("sysconf", set_in_sysconf)) {
        if (config_error_done() && !game.iflags.initoptions_noterminate) {
            nh_terminate(1);
        }
    }
    config_error_done();
}
/*
 *  Process user's run-time configuration file:
 *    get value of NETHACKOPTIONS;
 *    if command line specified -nethackrc=filename, use that;
 *      if NETHACKOPTIONS is present,
 *        honor it if it has a list of options to set
 *        or ignore it if it specifies a file name;
 *    else if not specified on command line and NETHACKOPTIONS names a file,
 *      use that as the config file;
 *      no extra options (normal use of NETHACKOPTIONS) will be set;
 *    otherwise (not on command line and either no NETHACKOPTIONS or that
 *        isn't a file name),
 *      pass Null to read_config_file() so that it will read ~/.nethackrc
 *        by default,
 *      then process the value of NETHACKOPTIONS as extra options.
 */
export async function initoptions_finish() {
    let sym = 0;
    rcfile();
    await fruitadd(game.pl_fruit, null);
    /*
     * Remove "slime mold" from list of object names.  This will
     * prevent it from being wished unless it's actually present
     * as a named (or default) fruit.  Wishing for "fruit" will
     * result in the player's preferred fruit.  [Once upon a time
     * the override value used was "\033" which prevented wishing
     * for the slime mold object at all except by asking for a
     * specific named fruit.]  Note that there are multiple fruit
     * object types (apple, melon, &c) but the "fruit" object is
     * slime mold or whatever custom name player assigns to that.
     */
    game.obj_descr[SLIME_MOLD].oc_name = "fruit";
    sym = get_othersym(SYM_BOULDER, (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) ? ROGUESET : PRIMARYSET);
    if (sym) {
        game.showsyms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] = sym;
    }
    reglyph_darkroom();
    reset_glyphmap(gm_optionchange);
    if (game.iflags.hilite_delta && !wc2_supported("statushilites")) {
        await raw_printf("Status highlighting not supported for %s interface.", game.windowprocs.name);
        game.iflags.hilite_delta = 0;
    }
    update_rest_on_space();
    /* these can't rely on compile-time initialization for their defaults
       because a multi-interface binary might need different values for
       different interfaces; if neither tiled_map nor ascii_map pass the
       wc_supported() test, assume ascii_map */
    if (game.iflags.wc_tiled_map && !wc_supported("tiled_map")) {
        game.iflags.wc_tiled_map = (0) , game.iflags.wc_ascii_map = (1);
    } else if (game.iflags.wc_ascii_map && !wc_supported("ascii_map") && wc_supported("tiled_map")) {
        game.iflags.wc_ascii_map = (0) , game.iflags.wc_tiled_map = (1);
    }
    if (glyphid_cache_status()) {
        free_glyphid_cache();
    }
    apply_customizations(game.currentgraphics, do_custom_symbols | do_custom_colors);
    game.opt_initial = (0);
    return;
}
/*
     * Do these after clearing the 'opt_initial' flag.
     */
/* player's RC file might try to enable perm_invent before selecting
       current interface, so the decision then would have been based on
       default interface; re-check with the active interface now */
/* can_set_perm_invent() expects to be called when perm_invent
           is about to be toggled On, so start with it Off */
let __allopt_array_init_options_array_inited_already = (0);
__nh_register_static(() => { __allopt_array_init_options_array_inited_already = (0); });
export async function allopt_array_init() {
    let i = 0;
    if (!__allopt_array_init_options_array_inited_already) {
        memcpy(game.allopt, game.allopt_init, 218 /* sizeof(struct allopt_t [218]) */);
        await determine_ambiguities();
        for (i = 0; game.allopt[i].name; i++) {
            if (game.allopt[i].addr) {
                game.allopt[i].addr.value = game.allopt[i].initval;
            }
        }
        heed_all_options();
        for (i = 0; i < OPTCOUNT; ++i) {
            /*
         * Call each option function with an init flag and give it a chance
         * to make any preparations that it might require.  We do this
         * whether or not the option itself is ever specified; that's
         * irrelevant for the init call.  Doing this allows the prep code for
         * option settings to remain adjacent to, and in the same function as,
         * the code that processes those options.
         */
            if (game.allopt[i].optfn) {
                (game.allopt[i].optfn)(i, do_init, (0), game.empty_optstr, game.empty_optstr);
            }
        }
        __allopt_array_init_options_array_inited_already = (1);
    }
}
/*
 *******************************************
 *
 * Support Functions for Individual Options
 *
 *******************************************
 */
/* iflags.menuobjsyms also controls iflags.menu_head_objsym, and
   iflags.use_menu_glyphs; they affect execution but are no longer options */
export function set_menuobjsyms_flags(newobjsyms) {
    game.iflags.menuobjsyms = newobjsyms;
    game.iflags.menu_head_objsym = ((newobjsyms & 1) != 0) ? (1) : (0);
    game.iflags.use_menu_glyphs = ((newobjsyms & (2 | 4)) != 0) ? (1) : (0);
}
/*
 * Change the inventory order, using the given string as the new order.
 * Missing characters in the new order are filled in at the end from
 * the current inv_order, except for gold, which is forced to be first
 * if not explicitly present.
 *
 * This routine returns 1 unless there is a duplicate or bad char in
 * the string.
 *
 * Used by: optfn_packorder()
 *
 */
export function change_inv_order(op) {
    let oc_sym = 0;
    let num = 0;
    let sp = null;
    let buf = '';
    let retval = 1;
    num = 0;
    if (!strchr(op, GOLD_SYM)) {
        buf = __nh_char_write(buf, num++, COIN_CLASS);
    }
    for (sp = op; __nh_char_at0(sp); (sp = __nh_advance_str(sp, 1))) {
        let fail = (0);
        oc_sym = def_char_to_objclass(__nh_char_at0(sp));
        if (oc_sym == MAXOCLASSES) {
            /* reject bad or duplicate entries */
            /* not an object class char */
            config_error_add("Not an object class '%c'", __nh_char_at0(sp));
            retval = 0;
            fail = (1);
        } else if (!strchr(game.flags.inv_order, oc_sym)) {
            /* VENOM_CLASS, RANDOM_CLASS, and ILLOBJ_CLASS are excluded
               because they aren't in def_inv_order[] so don't make it
               into flags.inv_order, hence always fail this strchr() test */
            config_error_add("Object class '%c' not allowed", __nh_char_at0(sp));
            retval = 0;
            fail = (1);
        } else if (strchr(__nh_advance_str(sp, 1), __nh_char_at0(sp))) {
            config_error_add("Duplicate object class '%c'", __nh_char_at0(sp));
            retval = 0;
            fail = (1);
        }
        if (!fail) {
            buf = __nh_char_write(buf, num++, oc_sym);
        }
    }
    buf = __nh_char_write(buf, num, 0);
    /* fill in any omitted classes, using previous ordering */
    for (sp = game.flags.inv_order; __nh_char_at0(sp); (sp = __nh_advance_str(sp, 1))) {
        if (!strchr(buf, __nh_char_at0(sp))) {
            strkitten(__nh_char_at0(__nh_advance_str(buf, num++)), __nh_char_at0(sp));
        }
    }
    buf = __nh_char_write(buf, MAXOCLASSES - 1, 0);
    game.flags.inv_order = strcpy(game.flags.inv_order, buf);
    return retval;
}
/*
 * Support functions for "warning"
 *
 * Used by: optfn_warnings()
 *
 */
export async function warning_opts(opts, optype) {
    let translate = [0, 0, 0, 0, 0, 0];
    let length = 0;
    let i = 0;
    if ((opts = await string_for_env_opt(optype, opts, (0))) == game.empty_optstr) {
        return (0);
    }
    escapes(opts, opts);
    length = strlen(opts);
    /* match the form obtained from PC configuration files */
    for (i = 0; i < 6; i++) {
        translate[i] = (i >= length) ? 0 : __nh_char_at0(__nh_advance_str(opts, i)) ? __nh_char_at0(__nh_advance_str(opts, i)) : def_warnsyms[i].sym;
    }
    assign_warnings(translate);
    return (1);
}
export function assign_warnings(graph_chars) {
    let i = 0;
    for (i = 0; i < 6; i++) {
        if (graph_chars[i]) {
            game.warnsyms[i] = graph_chars[i];
        }
    }
}
/*
 * Support functions for "suppress_alert"
 *
 * Used by: optfn_suppress_alert()
 *
 */
export async function feature_alert_opts(op, optn) {
    let buf = '';
    let fnv = get_feature_notice_ver(op);
    if (fnv == 0) {
        return 0;
    }
    if (fnv > get_current_feature_ver()) {
        if (!game.opt_initial) {
            await You_cant("disable new feature alerts for future versions.");
        } else {
            config_error_add("%s=%s Invalid reference to a future version ignored", optn, op);
        }
        return 0;
    }
    game.flags.suppress_alert = fnv;
    if (!game.opt_initial) {
        buf = sprintf(buf, "%lu.%lu.%lu", (game.flags.suppress_alert >> 24), (((16711680 & game.flags.suppress_alert)) >> 16), (((65280 & game.flags.suppress_alert)) >> 8));
        await pline("Feature change alerts disabled for NetHack %s features and prior.", buf);
    }
    return 1;
}
/*
 * This is used by parse_config_line() in files.c
 *
 */
/* parse key:command[,key2:command2,...] after BINDINGS= prefix has been
   stripped; returns False if any problem seen, True if every binding in
   the comma-separated list is successful */
const __parsebindings_mousebtn_names = ["mouse1", "mouse2"];
export async function parsebindings(bindings) {
    let bind = null;
    let key = 0;
    let i = 0;
    let ret = (1);
    if ((bind = strchr(bindings, 44)) != null) {
        /* look for first comma, then decide whether it is the key being bound
       or a list element separator; if it's a key, find separator beyond it */
        /* at start so it represents a key */
        if (bind == bindings) {
            bind = strchr(__nh_advance_str(bind, 1), 44);
        } else if (__nh_char_at0(__nh_advance_str(bind, -1)) == 92 || (__nh_char_at0(__nh_advance_str(bind, -1)) == 39 && __nh_char_at0(__nh_advance_str(bind, 1)) == 39)) {
            bind = strchr(__nh_advance_str(bind, 2), 44);
        }
    }
    if (bind) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        if (!await parsebindings(bind)) {
            ret = (0);
        }
    }
    /* parse a single binding: first split around : */
    if (!(bind = strchr(bindings, 58))) {
        return (0);
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    bind = trimspaces(bind);
    for (i = 0; i < (Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */)); i++) {
        if (!strcmp(bindings, __parsebindings_mousebtn_names[i])) {
            if (!bind_mousebtn(i + 1, bind)) {
                config_error_add("Error binding mouse button %i", i + 1);
            } else {
                return ret;
            }
        }
    }
    /* read the key to be bound */
    key = txt2key(bindings);
    if (!key) {
        config_error_add("Unknown key binding key '%s'", bindings);
        return (0);
    }
    if (bind_specialkey(key, bind)) {
        return ret;
    }
    for (i = 0; default_menu_cmd_info[i].name; i++) {
        if (!strcmp(default_menu_cmd_info[i].name, bind)) {
            if (illegal_menu_cmd_key(key)) {
                config_error_add("Bad menu key %s:%s", visctrl(key), bind);
                return (0);
            } else {
                await add_menu_cmd_alias(key, default_menu_cmd_info[i].cmd);
            }
            return ret;
        }
    }
    if (!bind_key(key, bind, (1))) {
        config_error_add("Unknown key binding command '%s'", bind);
        return (0);
    }
    return ret;
}
const msgtype_names = [{ name: "show", msgtyp: 0, descr: "Show message normally" }, { name: "hide", msgtyp: 2, descr: "Hide message" }, { name: "noshow", msgtyp: 2, descr: null }, { name: "stop", msgtyp: 3, descr: "Prompt for more after the message" }, { name: "more", msgtyp: 3, descr: null }, { name: "norep", msgtyp: 1, descr: "Do not repeat the message" }];
export function msgtype2name(typ) {
    let i = 0;
    for (i = 0; i < (Math.trunc(6 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/options.c:7676:14) [6]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/options.c:7676:14)) */)); i++) {
        if (msgtype_names[i].descr && msgtype_names[i].msgtyp == typ) {
            return msgtype_names[i].name;
        }
    }
    return null;
}
export async function query_msgtype() {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let pick_cnt = 0;
    let picks = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(6 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/options.c:7676:14) [6]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/options.c:7676:14)) */)); i++) {
        if (msgtype_names[i].descr) {
            any.a_int = msgtype_names[i].msgtyp + 1;
            await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, msgtype_names[i].descr, 0);
        }
    }
    (game.windowprocs.win_end_menu)(tmpwin, "How to show the message");
    pick_cnt = await select_menu(tmpwin, 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (pick_cnt > 0) {
        i = picks.item.a_int - 1;
        free(picks);
        return i;
    }
    return -1;
}
const __msgtype_add_re_error = "MSGTYPE regex error";
export function msgtype_add(typ, pattern) {
    let tmp = alloc(1 /* sizeof(struct plinemsg_type) */);
    tmp.msgtype = typ;
    tmp.regex = regex_init();
    if (!regex_compile(pattern, tmp.regex)) {
        /* test_regex_pattern() has already validated this regexp but parsing
       it again could conceivably run out of memory */
        let errbuf = '';
        let re_error_desc = regex_error_desc(tmp.regex, errbuf);
        /* free first in case reason for failure was insufficient memory */
        regex_free(tmp.regex);
        free(tmp);
        config_error_add("%s: %s", __msgtype_add_re_error, re_error_desc);
        return (0);
    }
    tmp.pattern = dupstr(pattern);
    tmp.next = game.plinemsg_types;
    game.plinemsg_types = tmp;
    return (1);
}
export function msgtype_free() {
    let tmp = null;
    let tmp2 = null;
    for (tmp = game.plinemsg_types; tmp; tmp = tmp2) {
        tmp2 = tmp.next;
        free(tmp.pattern);
        regex_free(tmp.regex);
        tmp.regex = null;
        free(tmp);
    }
    game.plinemsg_types = null;
}
/* 0 .. */
export function free_one_msgtype(idx) {
    let tmp = game.plinemsg_types;
    let prev = null;
    while (tmp) {
        if (idx == 0) {
            let next = tmp.next;
            regex_free(tmp.regex);
            free(tmp.pattern);
            free(tmp);
            if (prev) {
                prev.next = next;
            } else {
                game.plinemsg_types = next;
            }
            return;
        }
        idx--;
        prev = tmp;
        tmp = tmp.next;
    }
}
/* called from Norep(via pline) */
export function msgtype_type(msg, norepeat) {
    let tmp = game.plinemsg_types;
    while (tmp) {
        /* we don't exclude entries with negative msgtype values
           because then the msg might end up matching a later pattern */
        if (regex_match(msg, tmp.regex)) {
            return tmp.msgtype;
        }
        tmp = tmp.next;
    }
    return norepeat ? 1 : 0;
}
/* negate one or more types of messages so that their type handling will
   be disabled or re-enabled; MSGTYPE_NORMAL (value 0) is not affected */
export function hide_unhide_msgtypes(hide, hide_mask) {
    let tmp = null;
    let mt = 0;
    for (tmp = game.plinemsg_types; tmp; tmp = tmp.next) {
        /* negative msgtype value won't be recognized by pline, so does nothing */
        mt = tmp.msgtype;
        if (!hide) {
            mt = -mt;
        }
        /* unhide: negate negative, yielding positive */
        if (mt > 0 && ((1 << mt) & hide_mask)) {
            tmp.msgtype = -tmp.msgtype;
        }
    }
}
export function msgtype_count() {
    let c = 0;
    let tmp = game.plinemsg_types;
    while (tmp) {
        c++;
        tmp = tmp.next;
    }
    return c;
}
export function msgtype_parse_add(str) {
    let pattern = '';
    let msgtype = '';
    if (sscanf(str, "%10s \"%255[^\"]\"", msgtype, pattern) == 2) {
        let typ = -1;
        let i = 0;
        for (i = 0; i < (Math.trunc(6 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/options.c:7676:14) [6]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/options.c:7676:14)) */)); i++) {
            if (str_start_is(msgtype_names[i].name, msgtype, (1))) {
                typ = msgtype_names[i].msgtyp;
                break;
            }
        }
        if (typ != -1) {
            return msgtype_add(typ, pattern);
        } else {
            config_error_add("Unknown message type '%s'", msgtype);
        }
    } else {
        config_error_add("Malformed MSGTYPE");
    }
    return (0);
}
/* parse 'str' as a regular expression to check whether it's valid;
   compiled regexp gets thrown away regardless of the outcome */
const __test_regex_pattern_def_errmsg = "NHregex error";
export function test_regex_pattern(str, errmsg) {
    let match = null;
    let re_error_desc = null;
    let errbuf = '';
    let retval = 0;
    if (!str) {
        return (0);
    }
    if (!errmsg) {
        errmsg = __test_regex_pattern_def_errmsg;
    }
    match = regex_init();
    if (!match) {
        config_error_add("%s", errmsg);
        return (0);
    }
    retval = regex_compile(str, match);
    /* get potential error message before freeing regexp and free regexp
       before issuing message in case the error is "ran out of memory"
       since message delivery might need to allocate some memory */
    re_error_desc = !retval ? regex_error_desc(match, errbuf) : null;
    /* discard regexp; caller will re-parse it after validating other stuff */
    regex_free(match);
    /* if returning failure, tell player */
    if (!retval) {
        config_error_add("%s: %s", errmsg, re_error_desc);
    }
    return retval;
}
/* parse 'role' or 'race' or 'gender' or 'alignment' */
let __parse_role_opt_neg_opt = "!";
__nh_register_static(() => { __parse_role_opt_neg_opt = "!"; });
export async function parse_role_opt(optidx, negated, fullname, opts, opp) {
    let __nh_opp_idx = 0;
    /* not 'const' but never modified */
    let preval = null;
    let op = null;
    let which = (optidx == opt_role) ? 1 : (optidx == opt_race) ? 2 : (optidx == opt_gender) ? 3 : (optidx == opt_alignment) ? 4 : 5;
    let ok = (0);
    if ((op = await string_for_env_opt(fullname, opts, (0))) != game.empty_optstr) {
        /*
     * Accepts multiple forms
     *  role:priest       -- play as priest
     *  race:!orc         -- any race other than orc
     *  role:!cav !mon    -- any role other than caveman/cavewoman or monk
     *  !role:tour        -- any role other than tourist
     *  !role:tou rog wiz -- any role other than tourist or rogue or wizard
     * TODO: add support for
     *  role:arc bar kni  -- only role archeologist or barbarian or knight
     * Rejected:
     *  role:sam !val     -+ invalid; need either positive or negative subset
     *  !role:!sam        +- not a mixture of the two and not dual negation.
     */
        let sp = null;
        let val_negated = 0;
        let prev_negated = (0);
        let first = (1);
        op = mungspaces(op);
        while (__nh_char_at0(op)) {
            if (__nh_char_at0(op) == 32) {
                (op = __nh_advance_str(op, 1));
            }
            val_negated = (0);
            while (__nh_char_at0(op) == 33 || !strncmpi(op, "no", 2)) {
                val_negated = !val_negated;
                op = __nh_advance_str(op, (__nh_char_at0(op) == 33) ? 1 : (__nh_char_at0(__nh_advance_str(op, 2)) != 45) ? 2 : 3);
            }
            if (!__nh_char_at0(op) || __nh_char_at0(op) == 32) {
                config_error_add("Negated nothing for '%s'", fullname);
                return (0);
            }
            if (!first) {
                if ((val_negated ^ prev_negated) || (negated && val_negated)) {
                    config_error_add("Invalid mixed negation for '%s%s'", negated ? "!" : "", fullname);
                    return (0);
                } else if (!negated && !val_negated) {
                    config_error_add("Multiple role values only allowed when list is negated");
                    return (0);
                }
            }
            first = (0);
            prev_negated = val_negated;
            /* hide rest of list, if any */
            sp = strchr(op, 32);
            if (sp) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            }
            preval = await getoptstr(optidx, game.opt_phase);
            if (val_negated || negated) {
                let negbuf = '';
                /* for negative value, clear filter if there is a prior
                   value from a different phase; for same phase, duplicates
                   are allowed and setrolefilter() merges them */
                if (!preval || __nh_char_at0(preval) != 33) {
                    clearrolefilter(which);
                }
                if (!await setrolefilter(op)) {
                    config_error_add("Invalid %s '%s'", fullname, op);
                    return (0);
                }
                saveoptstr(optidx, await rolefilterstring(negbuf, which));
                opp.value = __parse_role_opt_neg_opt;
            } else {
                if (game.duplicate) {
                    if (preval && __nh_char_at0(preval) == 33) {
                        /* for positive value, allow duplicate if prior value
                   was a negative one or came from a different phase;
                   reject if prior value was positive and from same phase */
                        complain_about_duplicate(optidx);
                        return (0);
                    }
                }
                /* save raw string value; caller will validate it and
                   if it's ok, replace it with canonical form */
                saveoptstr(optidx, op);
                /* don't return yet; value might be a list that follows
                   this with something else which might make it invalid */
                opp.value = op;
            }
            if (sp) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
                op = __nh_advance_str(sp, 1);
            } else {
                op = __nh_advance_str(op, strlen(op));
            }
        }
        /* '!ok' without config_error_add() implies a valid negation */
        ok = (1);
    }
    return ok;
}
/* fetch a saved role|race|gender|alignment value suitable for writing into
   a new run-time config file */
export async function get_cnf_role_opt(optidx) {
    let phase = 0;
    let op = null;
    for (phase = num_opt_phases - 1; phase >= 0 && !op; --phase) {
        if (phase == cmdline_opt || phase == environ_opt || phase == builtin_opt) {
            continue;
        }
        op = await getoptstr(optidx, phase);
    }
    return op;
}
/* Check if character c is illegal as a menu command key */
export function illegal_menu_cmd_key(c) {
    if (c == 0 || c == 13 || c == 10 || c == 27 || c == 32 || digit(c) || (letter(c) && c != 64)) {
        config_error_add("Reserved menu command key '%s'", visctrl(c));
        return (1);
    } else {
        /* reject default object class symbols */
        let j = 0;
        for (j = 1; j < MAXOCLASSES; j++) {
            if (c == def_oc_syms[j].sym) {
                config_error_add("Menu command key '%s' is an object class", visctrl(c));
                return (1);
            }
        }
    }
    return (0);
}
/*
 * Convert the given string of object classes to a string of default object
 * symbols.
 */
export async function oc_to_str(src, dest) {
    let __nh_dest_idx = 0;
    let i = 0;
    while ((i = (src = __nh_advance_str(src, 1))) != 0) {
        if (i < 0 || i >= MAXOCLASSES) {
            await impossible("oc_to_str:  illegal object class %d", i);
        } else {
            dest = dest.slice(0, __nh_dest_idx++) + String.fromCharCode(def_oc_syms[i].sym);
        }
    }
    dest.value = 0;
}
/*
 * Add the given mapping to the menu command map list.  Always keep the
 * maps valid C strings.
 */
export async function add_menu_cmd_alias(from_ch, to_ch) {
    if (game.n_menu_mapped >= 32) {
        await pline("out of menu map space.");
    } else {
        game.mapped_menu_cmds[game.n_menu_mapped] = from_ch;
        game.mapped_menu_op[game.n_menu_mapped] = to_ch;
        game.n_menu_mapped++;
        game.mapped_menu_cmds[game.n_menu_mapped] = 0;
        game.mapped_menu_op[game.n_menu_mapped] = 0;
    }
}
export function get_menu_cmd_key(ch) {
    let found = strchr(game.mapped_menu_op, ch);
    if (found) {
        let idx = ((game.mapped_menu_op.length - found.length));
        ch = game.mapped_menu_cmds[idx];
    }
    return ch;
}
/*
 * Map the given character to its corresponding menu command.  If it
 * doesn't match anything, just return the original.
 */
export function map_menu_cmd(ch) {
    let found = strchr(game.mapped_menu_cmds, ch);
    if (found) {
        let idx = ((game.mapped_menu_cmds.length - found.length));
        ch = game.mapped_menu_op[idx];
    }
    return ch;
}
/* get keystrokes that are used for menu scrolling operations which apply;
   printable: for use in a prompt, non-printable: for yn_function() choices */
/* at least big enough for 6 "M-^X" sequences +'\0'*/
/* 1: backwards, "^<"; 2: forwards, ">|";
                          * 4: left, "{";       8: right, "}"; */
/* False: output is string of raw characters,
                          * True: output is a string of visctrl() sequences;
                          * matters iff user has mapped any menu scrolling
                          * commands to control or meta characters */
const __collect_menu_keys_scroll_keys = [{ cmdkey: 94, maskindx: 1 }, { cmdkey: 60, maskindx: 1 }, { cmdkey: 62, maskindx: 2 }, { cmdkey: 124, maskindx: 2 }, { cmdkey: 123, maskindx: 4 }, { cmdkey: 125, maskindx: 8 }];
export function collect_menu_keys(outbuf, scrollmask, printable) {
    let i = 0;
    outbuf = __nh_char_write(outbuf, 0, 0);
    for (i = 0; i < (Math.trunc(6 /* sizeof(const struct menuscrollinfo [6]) */ / 1 /* sizeof(const struct menuscrollinfo) */)); ++i) {
        if (scrollmask & __collect_menu_keys_scroll_keys[i].maskindx) {
            let c = get_menu_cmd_key(__collect_menu_keys_scroll_keys[i].cmdkey);
            if (printable) {
                outbuf = strcat(outbuf, visctrl(c));
            } else {
                outbuf = strkitten(outbuf, c);
            }
        }
    }
    return outbuf;
}
/* Returns the fid of the fruit type; if that type already exists, it
 * returns the fid of that one; if it does not exist, it adds a new fruit
 * type to the chain and returns the new one.
 * If replace_fruit is sent in, replace the fruit in the chain rather than
 * adding a new entry--for user specified fruits only.
 */
export async function fruitadd(str, replace_fruit) {
    let i = 0;
    let f = null;
    let highest_fruit_id = 0;
    let globpfx = 0;
    let buf = '';
    let altname = '';
    let user_specified = 0;
    nonew: {
        highest_fruit_id = 0;
        user_specified = (str == game.pl_fruit);
        if (user_specified) {
            /* if not user-specified, then it's a fruit name for a fruit on
     * a bones level or from orctown raider's loot...
     */
            /* Note: every fruit has an id (kept in obj->spe) of at least 1;
     * 0 is an error.
     */
            let found = (0);
            let numeric = (0);
            nmcpy(game.pl_fruit, await makesingular(str), 32);
            /* disallow naming after other foods (since it'd be impossible
         * to tell the difference); globs might have a size prefix which
         * needs to be skipped in order to match the object type name
         */
            globpfx = (!strncmp(game.pl_fruit, "small ", 6) || !strncmp(game.pl_fruit, "large ", 6)) ? 6 : (!strncmp(game.pl_fruit, "medium ", 7)) ? 7 : (!strncmp(game.pl_fruit, "very large ", 11)) ? 11 : 0;
            for (i = game.bases[FOOD_CLASS]; game.objects[i].oc_class == FOOD_CLASS; i++) {
                if (!strcmp((game.obj_descr[(game.objects[i]).oc_name_idx].oc_name), game.pl_fruit) || (globpfx > 0 && !strcmp((game.obj_descr[(game.objects[i]).oc_name_idx].oc_name), game.pl_fruit[globpfx]))) {
                    found = (1);
                    break;
                }
            }
            if (!found) {
                let c = null;
                for (c = game.pl_fruit; __nh_char_at0(c) >= 48 && __nh_char_at0(c) <= 57; (c = __nh_advance_str(c, 1))) {
                    continue;
                }
                if (!__nh_char_at0(c) || ((__ctype_b_loc())[((__nh_char_at0(c)))] & _ISspace)) {
                    numeric = (1);
                }
            }
            if (found || numeric || !strncmp(game.pl_fruit, "cursed ", 7) || !strncmp(game.pl_fruit, "uncursed ", 9) || !strncmp(game.pl_fruit, "blessed ", 8) || !strncmp(game.pl_fruit, "partly eaten ", 13) || (!strncmp(game.pl_fruit, "tin of ", 7) && (!strcmp(game.pl_fruit + 7, "spinach") || ((await name_to_mon(game.pl_fruit + 7, null)) >= LOW_PM && (await name_to_mon(game.pl_fruit + 7, null)) < NUMMONS))) || !strcmp(game.pl_fruit, "empty tin") || (!strcmp(game.pl_fruit, "glob") || (globpfx > 0 && !strcmp("glob", game.pl_fruit[globpfx]))) || ((str_end_is(game.pl_fruit, " corpse") || str_end_is(game.pl_fruit, " egg")) && ((await name_to_mon(game.pl_fruit, null)) >= LOW_PM && (await name_to_mon(game.pl_fruit, null)) < NUMMONS))) {
                buf = strcpy(buf, game.pl_fruit);
                game.pl_fruit = strcpy(game.pl_fruit, "candied ");
                /* these checks for applying food attributes to actual items
               are case sensitive; "glob of foo" is caught by 'found'
               if 'foo' is a valid glob; when not valid, allow it as-is */
                nmcpy(game.pl_fruit + 8, buf, 32 - 8);
            }
            altname = '';
            /* This flag indicates that a fruit has been made since the
         * last time the user set the fruit.  If it hasn't, we can
         * safely overwrite the current fruit, preventing the user from
         * setting many fruits in a row and overflowing.
         * Possible expansion: check for specific fruit IDs, not for
         * any fruit.
         */
            game.flags.made_fruit = (0);
            if (replace_fruit) {
                /* replace_fruit is already part of the fruit chain;
               update it in place rather than looking it up again */
                f = replace_fruit;
                f.fname = copynchars(f.fname, game.pl_fruit, 32 - 1);
                break nonew;
            }
        } else {
            /* not user_supplied, so assumed to be from bones (or orc gang) */
            altname = copynchars(altname, str, 32 - 1);
            sanitize_name(altname);
            /* for safety.  Any fruit name added from a
                                  * bones level should exist anyway. */
            game.flags.made_fruit = (1);
        }
        f = await fruit_from_name(altname ? altname : str, (0), { get value() { return highest_fruit_id; }, set value(_v) { highest_fruit_id = _v; } });
        if (f) {
            break nonew;
        }
        /* Maximum number of named fruits is 127, even if obj->spe can
       handle bigger values.  If adding another fruit would overflow,
       use a random fruit instead... we've got a lot to choose from.
       current_fruit remains as is. */
        if (highest_fruit_id >= 127) {
            return rnd(127);
        }
        f = alloc(1 /* sizeof(struct fruit) */);
        memset(f, 0, 1 /* sizeof(struct fruit) */);
        f.fname = copynchars(f.fname, altname ? altname : str, 32 - 1);
        f.fid = ++highest_fruit_id;
        /* we used to go out of our way to add it at the end of the list,
       but the order is arbitrary so use simpler insertion at start */
        f.nextf = game.ffruit;
        game.ffruit = f;
    }
    if (user_specified) {
        game.context.current_fruit = f.fid;
    }
    return f.fid;
}
/*
 **********************************
 *
 * Option-setting, menus,
 *  displaying option values
 *
 **********************************
 */
/* RESTORE is after show_menucontrols() */
export async function optfn_o_autopickup_exceptions(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {}
    if (req == get_val || req == get_cnf_val) {
        if (!opts) {
            return optn_err;
        }
        opts = sprintf(opts, n_currently_set, count_apes());
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_autopickup_exception();
    }
    return optn_ok;
}
export async function optfn_o_bind_keys(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {}
    if (req == get_val || req == get_cnf_val) {
        if (!opts) {
            return optn_err;
        }
        opts = sprintf(opts, n_currently_set, count_bind_keys());
        return optn_ok;
    }
    if (req == do_handler) {
        await handler_rebind_keys();
    }
    return optn_ok;
}
export async function optfn_o_autocomplete(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {}
    if (req == get_val || req == get_cnf_val) {
        if (!opts) {
            return optn_err;
        }
        opts = sprintf(opts, n_currently_set, count_autocompletions());
        return optn_ok;
    }
    if (req == do_handler) {
        await handler_change_autocompletions();
    }
    return optn_ok;
}
export async function optfn_o_menu_colors(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {}
    if (req == get_val || req == get_cnf_val) {
        if (!opts) {
            return optn_err;
        }
        opts = sprintf(opts, n_currently_set, count_menucolors());
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_menu_colors();
    }
    return optn_ok;
}
export async function optfn_o_message_types(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {}
    if (req == get_val || req == get_cnf_val) {
        if (!opts) {
            return optn_err;
        }
        opts = sprintf(opts, n_currently_set, msgtype_count());
        return optn_ok;
    }
    if (req == do_handler) {
        return await handler_msgtype();
    }
    return optn_ok;
}
export async function optfn_o_status_cond(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {
        ;
    }
    if (req == get_val) {
        if (!opts) {
            return optn_err;
        }
        opts = sprintf(opts, n_currently_set, count_cond());
        return optn_ok;
    }
    if (req == get_cnf_val) {
        ;
    }
    if (req == do_handler) {
        if (await cond_menu()) {
            game.opt_set_in_config[pfx_cond_] = (1);
        }
        return optn_ok;
    }
    return optn_ok;
}
export async function optfn_o_status_hilites(optidx, req, negated, opts, op) {
    if (req == do_init) {
        return optn_ok;
    }
    if (req == do_set) {}
    if (req == get_val || req == get_cnf_val) {
        if (!opts) {
            return optn_err;
        }
        opts = sprintf(opts, n_currently_set, await count_status_hilites());
        return optn_ok;
    }
    if (req == do_handler) {
        if (!await status_hilite_menu()) {
            return optn_err;
        } else {
            if (wc2_supported("hilite_status")) {
                (game.windowprocs.win_preference_update)("hilite_status");
            }
        }
        return optn_ok;
    }
    return optn_ok;
}
/*STATUS_HILITES*/
/* Get string value of configuration option.
 * Currently handles only boolean and compound options.
 */
let __get_option_value_retbuf = '';
__nh_register_static(() => { __get_option_value_retbuf = ''; });
export function get_option_value(optname, cnfvalid) {
    let bool_p = null;
    let i = 0;
    for (i = 0; game.allopt[i].name != null; i++) {
        if (!strcmp(optname, game.allopt[i].name)) {
            if (game.allopt[i].opttyp == BoolOpt && (bool_p = game.allopt[i].addr) != null) {
                __get_option_value_retbuf = sprintf(__get_option_value_retbuf, "%s", bool_p.value ? "true" : "false");
                return __get_option_value_retbuf;
            } else if (game.allopt[i].opttyp == CompOpt && game.allopt[i].optfn) {
                let reslt = optn_err;
                reslt = (game.allopt[i].optfn)(game.allopt[i].idx, cnfvalid ? get_cnf_val : get_val, (0), __get_option_value_retbuf, game.empty_optstr);
                if (reslt == optn_ok && __nh_char_at0(__get_option_value_retbuf)) {
                    return __get_option_value_retbuf;
                }
                return null;
            }
        }
    }
    return null;
}
export async function longest_option_name(startpass, endpass) {
    /* spin through the options to find the longest name */
    let longest_name_len = 0;
    let i = 0;
    let pass = 0;
    let optflags = 0;
    let name = null;
    for (pass = 0; pass < 2; pass++) {
        for (i = 0; (name = game.allopt[i].name) != null; i++) {
            if (pass == 0 && (game.allopt[i].opttyp != BoolOpt || !game.allopt[i].addr)) {
                continue;
            }
            optflags = game.allopt[i].setwhere;
            if (optflags < startpass || optflags > endpass) {
                continue;
            }
            if ((is_wc_option(name) && !wc_supported(name)) || (is_wc2_option(name) && !wc2_supported(name))) {
                continue;
            }
            let len = await Strlen_(name, "longest_option_name", 8527);
            if (len > longest_name_len) {
                longest_name_len = len;
            }
        }
    }
    return longest_name_len;
}
/* guts of doset_simple(); called repeatedly until no choice is made */
const __doset_simple_menu_fmtstr_tab_doset_simple = "%s\t[%s]";
export async function doset_simple_menu() {
    /* unlike doset()'s fmtstr, there is no leading %s for indentation */
    let fmtstr_doset_simple = '';
    let pick_list = null;
    let bool_p = null;
    let name = null;
    let fmtstr = null;
    let buf = '';
    let buf2 = '';
    let abuf = '';
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let section = 0;
    let i = 0;
    let k = 0;
    let pick_cnt = 0;
    let reslt = 0;
    let toggled_help = (0);
    if (!game.iflags.menu_tab_sep) {
        fmtstr_doset_simple = sprintf(fmtstr_doset_simple, "%%-%us [%%s]", await longest_option_name(set_gameview, set_in_game));
    } else {
        fmtstr_doset_simple = strcpy(fmtstr_doset_simple, __doset_simple_menu_fmtstr_tab_doset_simple);
    }
    fmtstr = fmtstr_doset_simple;
    redo_opt_help: while (true) {
        tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(tmpwin, 0);
        /* when showing 'help', also describe how to run full doset() */
        if (game.simple_options_help) {
            buf = strcpy(buf, "Use command '#optionsfull' to get the complete options list.");
            await add_menu_str(tmpwin, buf);
        }
        Object.assign(any, cg.zeroany);
        any.a_int = -2 + 1;
        await add_menu(tmpwin, nul_glyphinfo, any, 63, 0, 0, 8, game.simple_options_help ? "hide help" : "show help", 0);
        for (section = OptS_General; section < OptS_Advanced; section++) {
            Object.assign(any, cg.zeroany);
            await add_menu_str(tmpwin, "");
            buf = sprintf(buf, " %-30s ", OptS_type[section]);
            await add_menu_heading(tmpwin, buf);
            for (i = 0; (name = game.allopt[i].name) != null; i++) {
                if (game.allopt[i].section != section) {
                    continue;
                }
                if ((is_wc_option(name) && !wc_supported(name)) || (is_wc2_option(name) && !wc2_supported(name))) {
                    continue;
                }
                any.a_int = i + 1;
                switch (game.allopt[i].opttyp) {
                    case BoolOpt:
                        bool_p = game.allopt[i].addr;
                        if (!bool_p) {
                            continue;
                        }
                        if (game.iflags.wc_tiled_map && game.allopt[i].idx == opt_color) {
                            continue;
                        }
                        buf = sprintf(buf, fmtstr, name, bool_p.value ? "X" : " ");
                        break;
                    case CompOpt:
                    case OthrOpt:
                        k = i;
                        if (game.allopt[i].optfn == optfn_symset && (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                            k = opt_roguesymset;
                            name = game.allopt[k].name;
                            any.a_int = k + 1;
                        }
                        /* per opt functs may not guarantee this, so do it */
                        buf2 = '';
                        reslt = optn_err;
                        if (game.allopt[k].optfn) {
                            reslt = (game.allopt[k].optfn)(game.allopt[k].idx, get_val, (0), buf2, game.empty_optstr);
                        }
                        buf = sprintf(buf, fmtstr, name, ((reslt == optn_ok && __nh_char_at0(buf2)) ? buf2 : "unknown"));
                        break;
                    default:
                        buf = sprintf(buf, "ERROR");
                        break;
                }
                /* pickup_types is separated from autopickup due to the
               spelling of their names; emphasize what it means */
                if (game.allopt[i].idx == opt_pickup_types || game.allopt[i].idx == opt_pickup_thrown || game.allopt[i].idx == opt_pickup_stolen || game.allopt[i].idx == opt_dropped_nopick) {
                    buf = strcat(buf, "  (for autopickup)");
                }
                await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, 8, buf, 0);
                if (game.simple_options_help && game.allopt[i].descr) {
                    buf = sprintf(buf, "    %s", game.allopt[i].descr);
                    await add_menu_str(tmpwin, buf);
                    await add_menu_str(tmpwin, "");
                }
            }
        }
        (game.windowprocs.win_end_menu)(tmpwin, "Options");
        game.opt_need_redraw = (0);
        game.opt_need_glyph_reset = (0);
        game.opt_reset_customcolors = (0);
        game.opt_reset_customsymbols = (0);
        game.opt_update_basic_palette = (0);
        pick_cnt = await select_menu(tmpwin, 1, pick_list);
        if (pick_cnt > 0) {
            /* note:  without the complication of a preselected entry, a PICK_ONE
       menu returning pick_cnt > 0 implies exactly 1 */
            k = pick_list[0].item.a_int - 1;
            abuf = '';
            if (k == -2) {
                game.simple_options_help = !game.simple_options_help;
                toggled_help = (1);
            } else if (game.allopt[k].opttyp == BoolOpt) {
                buf = sprintf(buf, "%s%s", game.allopt[k].addr ? "!" : "", game.allopt[k].name);
                await parseoptions(buf, (0), (0));
            } else {
                if (game.allopt[k].has_handler && game.allopt[k].optfn) {
                    reslt = (game.allopt[k].optfn)(game.allopt[k].idx, do_handler, (0), game.empty_optstr, game.empty_optstr);
                    /* if player eventually saves options, include this one */
                    if (reslt == optn_ok && game.allopt[k].idx != pfx_cond_) {
                        game.opt_set_in_config[k] = (1);
                    }
                } else {
                    buf = sprintf(buf, "Set %s to what?", game.allopt[k].name);
                    abuf = await getlin(buf, abuf);
                    /* Note: using ESC to not set a new value will still return
                   'picked 1' to caller which will loop for another choice */
                    if (__nh_char_at0(abuf) != 27) {
                        buf = sprintf(buf, "%s:", game.allopt[k].name);
                        buf = buf + String(abuf).slice(0, Math.max(0, 256 - 1 - strlen(buf)));
                        await parseoptions(buf, (0), (0));
                    }
                }
            }
            if (k >= 0 && __nh_char_at0(abuf) != 27 && (wc_supported(game.allopt[k].name) || wc2_supported(game.allopt[k].name))) {
                (game.windowprocs.win_preference_update)(game.allopt[k].name);
            }
            free(pick_list) , pick_list = null;
        }
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        if (toggled_help) {
            /* tear down this instance of the menu; if pick_cnt is 1, caller
       will immediately call us back to put up another instance */
            toggled_help = (0);
            continue redo_opt_help;
        }
        return pick_cnt;
        break;
    }
}
/* #options - the user friendly version:  get one option from a subset of
   the zillion choices, act upon it, and prompt for another */
export async function doset_simple() {
    let pickedone = 0;
    let flush = (0);
    if (game.iflags.menu_requested) {
        /* doset() checks for 'm' and calls doset_simple(); clear the
           menu-requested flag to avoid doing that recursively */
        /* doset_simple() checks for 'm' and calls doset(); clear the
           menu-requested flag to avoid doing that recursively */
        game.iflags.menu_requested = (0);
        return await doset();
    }
    game.opt_phase = play_opt;
    game.give_opt_msg = (0);
    do {
        pickedone = await doset_simple_menu();
        flush = game.opt_need_redraw;
        await reset_needed_visuals();
        if (flush) {
            await flush_screen(1);
            flush = (0);
        }
    } while (pickedone > 0);
    game.give_opt_msg = (1);
    return 0;
}
const __term_for_boolean_booleanterms = [["false", "off", "disabled", "excluded from build"], ["true", "on", "enabled", "included"]];
export function term_for_boolean(idx, b) {
    let i = 0;
    let f_t = (b.value) ? 1 : 0;
    let boolean_term = null;
    boolean_term = __term_for_boolean_booleanterms[f_t][0];
    i = game.allopt[idx].termpref;
    if (i > Term_False && i < num_terms && i < (Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */))) {
        boolean_term = __term_for_boolean_booleanterms[f_t][i];
    }
    return boolean_term;
}
/* the #optionsfull command */
/* changing options via menu by Per Liboriussen */
const __doset_fmtstr_tab_doset = "%s%s\t[%s]";
/* actual '?' menu entry gets inserted here */
const __doset_helptext = ["For a brief explanation of how this works, type '?' to select", "the next menu choice, then press <enter> or <return>.", null, ("[To suppress this menu help, toggle off the 'cmdassist' option.]"), ""];
export async function doset() {
    let fmtstr_doset = '';
    let buf = '';
    let name = null;
    let indent = null;
    let i = 0;
    let pass = 0;
    let pick_cnt = 0;
    let pick_idx = 0;
    let opt_indx = 0;
    let bool_p = null;
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let pick_list = null;
    let indexoffset = 0;
    let startpass = 0;
    let endpass = 0;
    let gavehelp = (0);
    let skiphelp = !game.iflags.cmdassist;
    let clr = 8;
    if (game.iflags.menu_requested) {
        game.iflags.menu_requested = (0);
        return await doset_simple();
    }
    game.opt_phase = play_opt;
    rerun: while (true) {
        tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(tmpwin, 0);
        if (!skiphelp) {
            Object.assign(any, cg.zeroany);
            for (i = 0; i < (Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)); ++i) {
                if (__doset_helptext[i]) {
                    buf = sprintf(buf, "%4s%.75s", "", __doset_helptext[i]);
                    await add_menu_str(tmpwin, buf);
                } else {
                    /* handling pick_list subtracts 1 */
                    any.a_int = ((Math.trunc(218 /* sizeof(struct allopt_t [218]) */ / 1 /* sizeof(struct allopt_t) */))) + 1;
                    await add_menu(tmpwin, nul_glyphinfo, any, 63, 63, 0, clr, "view help for options menu", 2);
                }
            }
        }
        /* XXX I think this is still fragile.  Fixing initial/from_file and/or
       changing the SET_* etc to bitmaps will let me make this better. */
        startpass = set_gameview;
        endpass = (game.flags.debug) ? set_wiznofuz : set_in_game;
        if (!game.iflags.menu_tab_sep) {
            fmtstr_doset = sprintf(fmtstr_doset, "%%s%%-%us [%%s]", await longest_option_name(startpass, endpass));
        } else {
            fmtstr_doset = strcpy(fmtstr_doset, __doset_fmtstr_tab_doset);
        }
        indexoffset = 1;
        Object.assign(any, cg.zeroany);
        await add_menu_heading(tmpwin, "Booleans (selecting will toggle value):");
        /* We are trying to add an option not found in allopt[].
           This is almost certainly bad, but we'll let it through anyway
           (with a zero value, so it can't be selected). */
        any.a_int = 0;
        for (pass = 0; pass <= 1; pass++) {
            for (i = 0; (name = game.allopt[i].name) != null; i++) {
                if (game.allopt[i].opttyp == BoolOpt && (bool_p = game.allopt[i].addr) != null && ((game.allopt[i].setwhere <= set_gameview && pass == 0) || (game.allopt[i].setwhere >= set_in_game && pass == 1))) {
                    /* initial "%s" is for indentation of non-selectable items */
                    /* first list any other non-modifiable booleans, then modifiable ones */
                    if (bool_p == game.flags.female) {
                        continue;
                    }
                    if (game.allopt[i].setwhere == set_wizonly && !game.flags.debug) {
                        continue;
                    }
                    if (game.allopt[i].setwhere == set_wiznofuz && (!game.flags.debug || game.iflags.debug_fuzzer)) {
                        continue;
                    }
                    if ((is_wc_option(name) && !wc_supported(name)) || (is_wc2_option(name) && !wc2_supported(name))) {
                        continue;
                    }
                    any.a_int = (pass == 0) ? 0 : i + 1 + indexoffset;
                    indent = (pass == 0 && !game.iflags.menu_tab_sep) ? "    " : "";
                    buf = sprintf(buf, fmtstr_doset, indent, name, term_for_boolean(i, bool_p));
                    if (pass == 0) {
                        enhance_menu_text(buf, 256 /* sizeof(char [256]) */, pass, bool_p, game.allopt[i]);
                    }
                    await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 2);
                }
            }
        }
        await add_menu_str(tmpwin, "");
        await add_menu_heading(tmpwin, "Compounds (selecting will prompt for new value):");
        for (pass = startpass; pass <= endpass; pass++) {
            for (i = 0; (name = game.allopt[i].name) != null; i++) {
                if (game.allopt[i].opttyp != CompOpt) {
                    continue;
                }
                if (game.allopt[i].setwhere == pass) {
                    if ((is_wc_option(name) && !wc_supported(name)) || (is_wc2_option(name) && !wc2_supported(name))) {
                        continue;
                    }
                    await doset_add_menu(tmpwin, name, fmtstr_doset, i, (pass == set_gameview) ? 0 : indexoffset);
                }
            }
        }
        await add_menu_str(tmpwin, "");
        await add_menu_heading(tmpwin, "Other settings:");
        for (pass = startpass; pass <= endpass; pass++) {
            for (i = 0; (name = game.allopt[i].name) != null; i++) {
                if (game.allopt[i].opttyp != OthrOpt) {
                    continue;
                }
                if (game.allopt[i].setwhere == pass) {
                    if ((is_wc_option(name) && !wc_supported(name)) || (is_wc2_option(name) && !wc2_supported(name))) {
                        continue;
                    }
                    await doset_add_menu(tmpwin, name, fmtstr_doset, i, (pass == set_gameview) ? 0 : indexoffset);
                }
            }
        }
        (game.windowprocs.win_end_menu)(tmpwin, "Set what options?");
        game.opt_need_redraw = (0);
        game.opt_need_glyph_reset = (0);
        if ((pick_cnt = await select_menu(tmpwin, 2, pick_list)) > 0) {
            for (pick_idx = 0; pick_idx < pick_cnt; ++pick_idx) {
                /*
         * Walk down the selection list and either invert the booleans
         * or prompt for new values. In most cases, call parseoptions()
         * to take care of options that require special attention, like
         * redraws.
         */
                opt_indx = pick_list[pick_idx].item.a_int - 1;
                if (opt_indx == ((Math.trunc(218 /* sizeof(struct allopt_t [218]) */ / 1 /* sizeof(struct allopt_t) */)))) {
                    (game.windowprocs.win_display_file)("optmenu", (0));
                    gavehelp = (1);
                    continue;
                }
                if (opt_indx < -1) {
                    opt_indx++;
                }
                /* -1 offset for select_menu() */
                opt_indx -= indexoffset;
                (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                if (game.allopt[opt_indx].opttyp == BoolOpt) {
                    buf = sprintf(buf, "%s%s", game.allopt[opt_indx].addr ? "!" : "", game.allopt[opt_indx].name);
                    await parseoptions(buf, (0), (0));
                } else {
                    let k = opt_indx;
                    let reslt = 0;
                    if (game.allopt[k].has_handler && game.allopt[k].optfn) {
                        reslt = (game.allopt[k].optfn)(game.allopt[k].idx, do_handler, (0), game.empty_optstr, game.empty_optstr);
                        if (reslt == optn_ok) {
                            game.opt_set_in_config[k] = (1);
                        }
                    } else {
                        let abuf = '';
                        buf = sprintf(buf, "Set %s to what?", game.allopt[opt_indx].name);
                        abuf = '';
                        abuf = await getlin(buf, abuf);
                        if (__nh_char_at0(abuf) == 27) {
                            continue;
                        }
                        buf = sprintf(buf, "%s:", game.allopt[opt_indx].name);
                        strncat(eos(buf), abuf, (256 /* sizeof(char [256]) */ - 1 - strlen(buf)));
                        await parseoptions(buf, (0), (0));
                    }
                }
                if (wc_supported(game.allopt[opt_indx].name) || wc2_supported(game.allopt[opt_indx].name)) {
                    (game.windowprocs.win_preference_update)(game.allopt[opt_indx].name);
                }
            }
            free(pick_list) , pick_list = null;
        }
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        if (pick_cnt == 1 && gavehelp) {
            /* when '?' is only the thing selected, go back and pick all
           over again without it as an available choice second time */
            skiphelp = (1);
            /* currently True; reset for second pass */
            gavehelp = (0);
            continue rerun;
        }
        await reset_needed_visuals();
        return 0;
        break;
    }
}
export async function reset_needed_visuals() {
    if (game.opt_need_glyph_reset) {
        reset_glyphmap(gm_optionchange);
    }
    if (game.opt_reset_customcolors || game.opt_update_basic_palette || game.opt_reset_customsymbols || game.opt_need_redraw) {
        if (game.opt_update_basic_palette) {
            game.opt_update_basic_palette = (0);
        }
        if (game.opt_reset_customcolors) {
            reset_customcolors();
        }
        if (game.opt_reset_customsymbols) {
            reset_customsymbols();
        }
        if (game.opt_need_redraw) {
            check_gold_symbol();
            reglyph_darkroom();
        }
        await docrt();
    }
    if (game.opt_need_promptstyle) {
        adjust_menu_promptstyle(game.WIN_INVEN, game.iflags.menu_headings);
    }
    if (game.disp.botl || game.disp.botlx) {
        await bot();
    }
    game.opt_need_redraw = (0);
    game.opt_need_glyph_reset = (0);
    game.opt_reset_customcolors = (0);
    game.opt_reset_customsymbols = (0);
    game.opt_update_basic_palette = (0);
}
/* doset(#optionsfull command) menu entries for compound options */
/* window to add to */
/* option name */
/* fmtstr_doset */
/* index in allopt[] */
/* value to add to index in allopt[],
                         * or zero if option cannot be changed */
export async function doset_add_menu(win, option, fmtstr, idx, indexoffset) {
    let value = "unknown";
    let indent = null;
    let buf = '';
    let buf2 = '';
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = idx;
    let reslt = optn_err;
    let clr = 8;
    buf2 = '';
    Object.assign(any, cg.zeroany);
    if (i >= 0 && i < OPTCOUNT && game.allopt[i].name && game.allopt[i].optfn) {
        any.a_int = (indexoffset == 0) ? 0 : i + 1 + indexoffset;
        if (game.allopt[i].optfn) {
            reslt = (game.allopt[i].optfn)(game.allopt[i].idx, get_val, (0), buf2, game.empty_optstr);
        }
        if (reslt == optn_ok && __nh_char_at0(buf2)) {
            value = buf2;
        }
    } else {
        any.a_int = 0;
        if (!__nh_char_at0(buf2)) {
            buf2 = strcpy(buf2, "unknown");
        }
        value = buf2;
    }
    /* "    " replaces "a - " -- assumes menus follow that style */
    indent = !any.a_int ? "    " : "";
    buf = sprintf(buf, fmtstr, indent, option, value);
    await add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, buf, 2);
}
/* display keys for menu actions; used by cmd.c '?i' and pager.c '?k' */
const __show_menu_controls_hardcoded = [{ key: "Return", desc: "Accept current choice(s) and dismiss menu" }, { key: "Enter", desc: "Same as Return" }, { key: "Space", desc: "If not on last page, advance one page;" }, { key: "     ", desc: "when on last page, treat like Return" }, { key: "Escape", desc: "Cancel menu without making any choice(s)" }, { key: null, desc: null }];
const __show_menu_controls_mc_fmt = "%8s     %-6s %s";
const __show_menu_controls_mc_altfmt = "%9s  %-6s %s";
export function show_menu_controls(win, dolist) {
    let buf = '';
    let fmt = null;
    let arg = null;
    let xcp = null;
    let has_menu_shift = wc2_supported("menu_shift");
    (game.windowprocs.win_putstr)(win, 0, "Menu control keys:");
    if (dolist) {
        let i = 0;
        let ch = 0;
        fmt = "%-7s %s";
        for (i = 0; default_menu_cmd_info[i].desc; i++) {
            ch = default_menu_cmd_info[i].cmd;
            if ((ch == 125 || ch == 123) && !has_menu_shift) {
                continue;
            }
            buf = sprintf(buf, fmt, visctrl(get_menu_cmd_key(ch)), default_menu_cmd_info[i].desc);
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
        /* no separator before hardcoded */
        /* extra specifier to absorb 'arg' */
        fmt = "%s%-7s %s";
        /* no extra prefix for 'dolist' */
        arg = "";
    /* menu controls help: '?k' */
    } else {
        (game.windowprocs.win_putstr)(win, 0, "");
        buf = sprintf(buf, __show_menu_controls_mc_altfmt, "", "Whole", "Current");
        (game.windowprocs.win_putstr)(win, 0, buf);
        buf = sprintf(buf, __show_menu_controls_mc_altfmt, "", " Menu", " Page");
        (game.windowprocs.win_putstr)(win, 0, buf);
        buf = sprintf(buf, __show_menu_controls_mc_fmt, "Select", visctrl(get_menu_cmd_key(46)), visctrl(get_menu_cmd_key(44)));
        (game.windowprocs.win_putstr)(win, 0, buf);
        buf = sprintf(buf, __show_menu_controls_mc_fmt, "Invert", visctrl(get_menu_cmd_key(64)), visctrl(get_menu_cmd_key(126)));
        (game.windowprocs.win_putstr)(win, 0, buf);
        buf = sprintf(buf, __show_menu_controls_mc_fmt, "Deselect", visctrl(get_menu_cmd_key(45)), visctrl(get_menu_cmd_key(92)));
        (game.windowprocs.win_putstr)(win, 0, buf);
        (game.windowprocs.win_putstr)(win, 0, "");
        buf = sprintf(buf, __show_menu_controls_mc_fmt, "Go to", visctrl(get_menu_cmd_key(62)), "Next page");
        (game.windowprocs.win_putstr)(win, 0, buf);
        buf = sprintf(buf, __show_menu_controls_mc_fmt, "", visctrl(get_menu_cmd_key(60)), "Previous page");
        (game.windowprocs.win_putstr)(win, 0, buf);
        buf = sprintf(buf, __show_menu_controls_mc_fmt, "", visctrl(get_menu_cmd_key(94)), "First page");
        (game.windowprocs.win_putstr)(win, 0, buf);
        buf = sprintf(buf, __show_menu_controls_mc_fmt, "", visctrl(get_menu_cmd_key(124)), "Last page");
        (game.windowprocs.win_putstr)(win, 0, buf);
        if (has_menu_shift) {
            buf = sprintf(buf, __show_menu_controls_mc_fmt, "Pan view", visctrl(get_menu_cmd_key(125)), "Right (perm_invent only)");
            (game.windowprocs.win_putstr)(win, 0, buf);
            buf = sprintf(buf, __show_menu_controls_mc_fmt, "", visctrl(get_menu_cmd_key(123)), "Left");
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
        (game.windowprocs.win_putstr)(win, 0, "");
        buf = sprintf(buf, __show_menu_controls_mc_fmt, "Search", visctrl(get_menu_cmd_key(58)), "Exter a target string and invert all matching entries");
        (game.windowprocs.win_putstr)(win, 0, buf);
        (game.windowprocs.win_putstr)(win, 0, "");
        /* separator before hardcoded */
        fmt = "%9s  %-8s %s";
        /* prefix for first hardcoded[] entry, then reset */
        arg = "Other ";
    }
    for (let __nhi_xcp = 0; (xcp = __show_menu_controls_hardcoded[__nhi_xcp]) && (xcp.key); __nhi_xcp++) {
        buf = sprintf(buf, fmt, arg, xcp.key, xcp.desc);
        (game.windowprocs.win_putstr)(win, 0, buf);
        arg = "";
    }
}
export function count_cond() {
    let i = 0;
    let cnt = 0;
    for (i = 0; i < CONDITION_COUNT; ++i) {
        if (game.condtests[i].enabled) {
            cnt++;
        }
    }
    return cnt;
}
export function count_apes() {
    let numapes = 0;
    let ape = game.apelist;
    while (ape) {
        numapes++;
        ape = ape.next;
    }
    return numapes;
}
/* common to msg-types, menu-colors, autopickup-exceptions */
const __handle_add_list_remove_action_titles = [{ letr: 97, desc: "add new %s" }, { letr: 108, desc: "list %s" }, { letr: 114, desc: "remove existing %s" }, { letr: 120, desc: "exit this menu" }];
export async function handle_add_list_remove(optname, numtotal) {
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let pick_cnt = 0;
    let opt_idx = 0;
    let pick_list = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; i < (Math.trunc(4 /* sizeof(const struct action [4]) */ / 1 /* sizeof(const struct action) */)); i++) {
        let tmpbuf = '';
        any.a_int++;
        /* omit list and remove if there aren't any yet */
        if (!numtotal && (i == 1 || i == 2)) {
            continue;
        }
        tmpbuf = sprintf(tmpbuf, __handle_add_list_remove_action_titles[i].desc, (i == 1) ? await makeplural(optname) : optname);
        await add_menu(tmpwin, nul_glyphinfo, any, __handle_add_list_remove_action_titles[i].letr, 0, 0, clr, tmpbuf, (i == 3) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Do what?");
    if ((pick_cnt = await select_menu(tmpwin, 1, pick_list)) > 0) {
        opt_idx = pick_list[0].item.a_int - 1;
        if (pick_cnt > 1 && opt_idx == 3) {
            opt_idx = pick_list[1].item.a_int - 1;
        }
        free(pick_list);
    /* none selected, exit menu */
    } else {
        opt_idx = 3;
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return opt_idx;
}
export async function dotogglepickup() {
    let buf = '';
    let ocl = '';
    game.flags.pickup = !game.flags.pickup;
    if (game.flags.pickup) {
        await oc_to_str(game.flags.pickup_types, ocl);
        buf = sprintf(buf, "ON, for %s objects%s", __nh_char_at0(ocl) ? ocl : "all", (game.apelist) ? ((count_apes() == 1) ? ", with one exception" : ", with some exceptions") : "");
    } else {
        buf = strcpy(buf, "OFF");
    }
    await pline("Autopickup: %s.", buf);
    return 0;
}
/* toggle any (settable in-game) boolean option by name */
export async function toggle_bool_option(p) {
    let i = 0;
    let ret = 4;
    for (i = 0; i < OPTCOUNT; i++) {
        if (!strncmpi(game.allopt[i].name, p, strlen(p)) && game.allopt[i].opttyp == BoolOpt && game.allopt[i].setwhere == set_in_game && game.allopt[i].addr != null) {
            let buf = '';
            buf = sprintf(buf, "%s%s", game.allopt[i].addr.value ? "!" : "", game.allopt[i].name);
            if (await parseoptions(buf, (0), (0))) {
                ret = 0;
            }
            await reset_needed_visuals();
        }
    }
    return ret;
}
const __add_autopickup_exception_APE_regex_error = "regex error in AUTOPICKUP_EXCEPTION";
const __add_autopickup_exception_APE_syntax_error = "syntax error in AUTOPICKUP_EXCEPTION";
export function add_autopickup_exception(mapping) {
    let ape = null;
    let text = '';
    let end = 0;
    let n = 0;
    let grab = (0);
    /* scan length limit used to be 255, but smaller size allows the
       quoted value to fit within BUFSZ, simplifying formatting elsewhere;
       this used to ignore the possibility of trailing junk but now checks
       for it, accepting whitespace but rejecting anything else unless it
       starts with '#" for a comment */
    end = 0;
    if ((n = sscanf(mapping, "\"<%253[^\"]\" %c", text, end)) == 1 || (n == 2 && end == 35)) {
        grab = (1);
    } else if ((n = sscanf(mapping, "\">%253[^\"]\" %c", text, end)) == 1 || (n = sscanf(mapping, "\"%253[^\"]\" %c", text, end)) == 1 || (n == 2 && end == 35)) {
        grab = (0);
    } else {
        config_error_add("%s", __add_autopickup_exception_APE_syntax_error);
        return 0;
    }
    ape = alloc(1 /* sizeof(struct autopickup_exception) */);
    ape.regex = regex_init();
    if (!regex_compile(text, ape.regex)) {
        let errbuf = '';
        let re_error_desc = regex_error_desc(ape.regex, errbuf);
        regex_free(ape.regex);
        free(ape);
        config_error_add("%s: %s", __add_autopickup_exception_APE_regex_error, re_error_desc);
        return 0;
    }
    ape.pattern = dupstr(text);
    ape.grab = grab;
    ape.next = game.apelist;
    game.apelist = ape;
    return 1;
}
export function remove_autopickup_exception(whichape) {
    let ape = null;
    let freeape = null;
    let prev = null;
    for (ape = game.apelist; ape; ) {
        if (ape == whichape) {
            freeape = ape;
            ape = ape.next;
            if (prev) {
                prev.next = ape;
            } else {
                game.apelist = ape;
            }
            regex_free(freeape.regex);
            free(freeape.pattern);
            free(freeape);
        } else {
            prev = ape;
            ape = ape.next;
        }
    }
}
export function free_autopickup_exceptions() {
    let ape = null;
    while ((ape = game.apelist) != null) {
        free(ape.pattern);
        regex_free(ape.regex);
        game.apelist = ape.next;
        free(ape);
    }
}
/* up to 4*BUFSZ-1 long; only first few
                               chars matter */
export function sym_val(strval) {
    /* to hold truncated copy of 'strval' */
    let buf = '';
    let tmp = '';
    buf = '';
    if (!__nh_char_at0(strval) || !__nh_char_at0(__nh_advance_str(strval, 1))) {
        /* empty, or single character */
        /* if single char is space or tab, leave buf[0]=='\0' */
        if (!((__ctype_b_loc())[((__nh_char_at0(strval)))] & _ISspace)) {
            buf = __nh_char_write(buf, 0, __nh_char_at0(strval));
        }
    } else if (__nh_char_at0(strval) == 39) {
        if (__nh_char_at0(__nh_advance_str(strval, 2)) == 39 && !__nh_char_at0(__nh_advance_str(strval, 3))) {
            /* simple matching single quote; we know strval[1] isn't '\0' */
            /* accepts '\' as backslash and ''' as single quote */
            /* if backslash, handle single or double quote or second backslash */
            buf = __nh_char_write(buf, 0, __nh_char_at0(__nh_advance_str(strval, 1)));
        } else if (__nh_char_at0(__nh_advance_str(strval, 1)) == 92 && __nh_char_at0(__nh_advance_str(strval, 2)) && __nh_char_at0(__nh_advance_str(strval, 3)) == 39 && strchr("'\"\\", __nh_char_at0(__nh_advance_str(strval, 2))) && !__nh_char_at0(__nh_advance_str(strval, 4))) {
            /* not simple quote or basic backslash;
           strip closing quote and let escapes() deal with it */
            buf = __nh_char_write(buf, 0, __nh_char_at0(__nh_advance_str(strval, 2)));
        } else {
            let p = null;
            /* +1: skip opening single quote */
            tmp = strncpy(tmp, __nh_advance_str(strval, 1), 128 /* sizeof(char [128]) */ - 1);
            tmp = __nh_char_write(tmp, 128 /* sizeof(char [128]) */ - 1, 0);
            if ((p = strrchr(tmp, 39)) != null) {
                tmp = nh_strchr_truncate(tmp, 39, 'rchr');
                escapes(tmp, buf);
            }
        }
    } else {
        /* not lone char nor single quote */
        tmp = strncpy(tmp, strval, 128 /* sizeof(char [128]) */ - 1);
        tmp = __nh_char_write(tmp, 128 /* sizeof(char [128]) */ - 1, 0);
        escapes(tmp, buf);
    }
    return buf;
}
/* data for option_help() */
const opt_intro = ["", "                 NetHack Options Help:", "", null, "or use `NETHACKOPTIONS=\"<options>\"' in your environment", "(<options> is a list of options separated by commas)", "or press \"O\" while playing and use the menu.", "", ("Boolean options (which can be negated by prefixing them with '!' or \"no\"):"), null];
/* fill in next value at run-time */
const opt_epilog = ["", "Some of the options can only be set before the game is started;", "those items will not be selectable in the 'O' command's menu.", "Some options are stored in a game's save file, and will keep saved", "values when restoring that game even if you have updated your config-", "uration file to change them.  Such changes will matter for new games.", "The \"other settings\" can be set with 'O', but when set within the", "configuration file they use their own directives rather than OPTIONS.", "See NetHack's \"Guidebook\" for details.", null];
export async function option_help() {
    let buf = '';
    let buf2 = '';
    let optname = null;
    let i = 0;
    let datawin = 0;
    datawin = (game.windowprocs.win_create_nhwindow)(5);
    buf = nh_snprintf("option_help", 9471, buf, 256 /* sizeof(char [256]) */, "Set options as OPTIONS=<options> in %s", get_configfile());
    opt_intro[3] = buf;
    for (i = 0; opt_intro[i]; i++) {
        (game.windowprocs.win_putstr)(datawin, 0, opt_intro[i]);
    }
    for (i = 0; game.allopt[i].name; i++) {
        if ((game.allopt[i].opttyp != BoolOpt || !game.allopt[i].addr) || (game.allopt[i].setwhere == set_wizonly && !game.flags.debug)) {
            continue;
        }
        if (game.allopt[i].setwhere == set_wiznofuz && (!game.flags.debug || game.iflags.debug_fuzzer)) {
            continue;
        }
        optname = game.allopt[i].name;
        if ((is_wc_option(optname) && !wc_supported(optname)) || (is_wc2_option(optname) && !wc2_supported(optname))) {
            continue;
        }
        await next_opt(datawin, optname);
    }
    await next_opt(datawin, "");
    (game.windowprocs.win_putstr)(datawin, 0, "Compound options:");
    for (i = 0; game.allopt[i].name; i++) {
        if (game.allopt[i].opttyp != CompOpt || (game.allopt[i].setwhere == set_wizonly && !game.flags.debug)) {
            continue;
        }
        if (game.allopt[i].setwhere == set_wiznofuz && (!game.flags.debug || game.iflags.debug_fuzzer)) {
            continue;
        }
        optname = game.allopt[i].name;
        if ((is_wc_option(optname) && !wc_supported(optname)) || (is_wc2_option(optname) && !wc2_supported(optname))) {
            continue;
        }
        buf2 = sprintf(buf2, "`%s'", optname);
        buf = nh_snprintf("option_help", 9507, buf, 256 /* sizeof(char [256]) */, "%-20s - %s%c", buf2, game.allopt[i].descr, game.allopt[i + 1].name ? 44 : 46);
        (game.windowprocs.win_putstr)(datawin, 0, buf);
    }
    (game.windowprocs.win_putstr)(datawin, 0, "");
    (game.windowprocs.win_putstr)(datawin, 0, "Other settings:");
    for (i = 0; game.allopt[i].name; i++) {
        if (game.allopt[i].opttyp != OthrOpt) {
            continue;
        }
        buf = sprintf(buf, " %s", game.allopt[i].name);
        (game.windowprocs.win_putstr)(datawin, 0, buf);
    }
    (game.windowprocs.win_putstr)(datawin, 0, "");
    for (i = 0; opt_epilog[i]; i++) {
        (game.windowprocs.win_putstr)(datawin, 0, opt_epilog[i]);
    }
    await (game.windowprocs.win_display_nhwindow)(datawin, (0));
    (game.windowprocs.win_destroy_nhwindow)(datawin);
    return;
}
/* gather all non-default cond_xyz options into one OPTIONS=cond_foo,!cond_bar
   entry spread across multiple lines with backslash+newline if needed;
   conditions with their default settings (cond_blind, !cond_glowhands, &c)
   are excluded */
export async function all_options_conds(sbuf) {
    let buf = '';
    let nextcond = '';
    let idx = 0;
    let gotone = (0);
    buf = '';
    while (opt_next_cond(idx, nextcond)) {
        if (idx == 0) {
            buf = strcpy(buf, "OPTIONS=");
        } else if (await Strlen_(buf, "all_options_conds", 9568) + 1 + await Strlen_(nextcond, "all_options_conds", 9568) >= 75) {
            buf = strcat(buf, ",\\\n");
            /* 75: room for about 5 conditions, with enough space for player
           to edit resulting file manually and insert '!' in front of them */
            /* finish off previous line */
            /* comma and backslash+newline */
            /* finish off final line; value might be empty if one or more cond_xyz
       options were changed in such a manner that they're all back to their
       default values--which will produce "OPTIONS=" with nothing after the
       equals sign; only add to the output when there is more present */
            strbuf_append(sbuf, buf);
            /* indent continuation line */
            buf = sprintf(buf, "%8s", " ");
        } else if (__nh_char_at0(nextcond) && gotone) {
            buf = strcat(buf, ",");
        }
        if (__nh_char_at0(nextcond)) {
            gotone = (1);
            buf = strcat(buf, nextcond);
        }
        ++idx;
    }
    if (strcmp(buf, "OPTIONS=")) {
        buf = strcat(buf, "\n");
        strbuf_append(sbuf, buf);
    }
}
/* append menucolor lines to strbuf */
export function all_options_menucolors(sbuf) {
    let i = 0;
    let ncolors = count_menucolors();
    let tmp = game.menu_colorings;
    let buf = '';
    let arr = null;
    if (!ncolors) {
        return;
    }
    arr = alloc(ncolors * 8 /* sizeof(struct menucoloring *) */);
    while (tmp) {
        arr[i++] = tmp;
        tmp = tmp.next;
    }
    for (i = ncolors; i > 0; i--) {
        tmp = arr[i - 1];
        let sattr = attr2attrname(tmp.attr);
        let sclr = clr2colorname(tmp.color);
        buf = sprintf(buf, "MENUCOLOR=\"%s\"=%s%s%s\n", tmp.origstr, sclr, (tmp.attr != 0) ? "&" : "", (tmp.attr != 0) ? sattr : "");
        strbuf_append(sbuf, buf);
    }
    free(arr);
}
export function all_options_msgtypes(sbuf) {
    let tmp = game.plinemsg_types;
    let buf = '';
    while (tmp) {
        let mtype = msgtype2name(tmp.msgtype);
        buf = sprintf(buf, "MSGTYPE=%s \"%s\"\n", mtype, tmp.pattern);
        strbuf_append(sbuf, buf);
        tmp = tmp.next;
    }
}
export function all_options_apes(sbuf) {
    let tmp = game.apelist;
    let buf = '';
    while (tmp) {
        buf = sprintf(buf, "autopickup_exception=\"%c%s\"\n", tmp.grab ? 60 : 62, tmp.pattern);
        strbuf_append(sbuf, buf);
        tmp = tmp.next;
    }
}
/* CHANGE_COLOR */
/* return strbuf of all options, to write to file */
export async function all_options_strbuf(sbuf) {
    let name = null;
    let tmp = '';
    let buf2 = null;
    let bool_p = null;
    let i = 0;
    strbuf_init(sbuf);
    tmp = sprintf(tmp, "# NetHack config, saved %s\n#\n", yyyymmddhhmmss(0));
    strbuf_append(sbuf, tmp);
    for (i = 0; (name = game.allopt[i].name) != null; i++) {
        if (!game.opt_set_in_config[i]) {
            continue;
        }
        switch (game.allopt[i].opttyp) {
            case BoolOpt:
                bool_p = game.allopt[i].addr;
                if (!bool_p || bool_p == game.flags.female) {
                    break;
                }
                if (bool_p != game.allopt[i].initval) {
                    tmp = sprintf(tmp, "OPTIONS=%s%s\n", bool_p.value ? "" : "!", name);
                    strbuf_append(sbuf, tmp);
                }
                break;
            case CompOpt:
                if (!(game.allopt[i].setwhere == set_in_config || game.allopt[i].setwhere == set_gameview || game.allopt[i].setwhere == set_in_game)) {
                    break;
                }
                /* FIXME: get_option_value for:
               - menu_deselect_all &c menu control keys,
               - term_cols, term_rows */
                buf2 = get_option_value(name, (1));
                if (buf2) {
                    tmp = nh_snprintf("all_options_strbuf", 9714, tmp, 256 /* sizeof(char [256]) */ - 1, "OPTIONS=%s:%s", name, buf2);
                    tmp = strcat(tmp, "\n");
                    strbuf_append(sbuf, tmp);
                }
                break;
            case OthrOpt:
                break;
        }
    }
    /* cond_xyz are closer to regular options than the other 'other opts'
       so put them next; [pfx_cond_] will be set if any cond_Foo were
       present when RC file was read in or if player made any changes via
       status conditions menu; ignore opt_set_in_config[opt_o_status_cond] */
    if (game.opt_set_in_config[pfx_cond_]) {
        await all_options_conds(sbuf);
    }
    await get_changed_key_binds(sbuf);
    savedsym_strbuf(sbuf);
    all_options_menucolors(sbuf);
    all_options_msgtypes(sbuf);
    all_options_apes(sbuf);
    all_options_autocomplete(sbuf);
    await all_options_statushilites(sbuf);
    if (game.wizkit[0]) {
        tmp = sprintf(tmp, "WIZKIT=%s\n", game.wizkit);
        strbuf_append(sbuf, tmp);
    }
}
/*
 * prints the next boolean option, on the same line if possible, on a new
 * line if not. End with next_opt("").
 */
let __next_opt_buf = null;
__nh_register_static(() => { __next_opt_buf = null; });
export async function next_opt(datawin, str) {
    let i = 0;
    let s = null;
    if (!__next_opt_buf) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    }
    if (!__nh_char_at0(str)) {
        s = eos(__next_opt_buf);
        if (s > __nh_advance_str(__next_opt_buf, 1) && __nh_char_at0(__nh_advance_str(s, -2)) == 44) {
            s = __nh_char_write(s, -2, 46) , s = __nh_char_write(s, -1, 0);
        }
        /* replace ending ", " with "." */
        /* (greater than COLNO - 2) */
        i = 80;
    } else {
        i = await Strlen_(__next_opt_buf, "next_opt", 9770) + await Strlen_(str, "next_opt", 9770) + 2;
    }
    if (i > 80 - 2) {
        (game.windowprocs.win_putstr)(datawin, 0, __next_opt_buf);
        __next_opt_buf = __nh_char_write(__next_opt_buf, 0, 0);
    }
    if (__nh_char_at0(str)) {
        __next_opt_buf = strcat(__next_opt_buf, str);
        __next_opt_buf = strcat(__next_opt_buf, ", ");
    } else {
        (game.windowprocs.win_putstr)(datawin, 0, str);
        free(__next_opt_buf) , __next_opt_buf = null;
    }
    return;
}
game.wc_options = [{ wc_name: "ascii_map", wc_bit: 4 }, { wc_name: "color", wc_bit: 1 }, { wc_name: "eight_bit_tty", wc_bit: 67108864 }, { wc_name: "hilite_pet", wc_bit: 2 }, { wc_name: "perm_invent", wc_bit: 134217728 }, { wc_name: "perminv_mode", wc_bit: 134217728 }, { wc_name: "popup_dialog", wc_bit: 16777216 }, { wc_name: "player_selection", wc_bit: 1073741824 }, { wc_name: "preload_tiles", wc_bit: 16 }, { wc_name: "tiled_map", wc_bit: 8 }, { wc_name: "tile_file", wc_bit: 128 }, { wc_name: "tile_width", wc_bit: 32 }, { wc_name: "tile_height", wc_bit: 64 }, { wc_name: "align_message", wc_bit: 512 }, { wc_name: "align_status", wc_bit: 1024 }, { wc_name: "font_map", wc_bit: 4096 }, { wc_name: "font_menu", wc_bit: 32768 }, { wc_name: "font_message", wc_bit: 8192 }, { wc_name: "font_size_map", wc_bit: 131072 }, { wc_name: "font_size_menu", wc_bit: 1048576 }, { wc_name: "font_size_message", wc_bit: 262144 }, { wc_name: "font_size_status", wc_bit: 524288 }, { wc_name: "font_size_text", wc_bit: 2097152 }, { wc_name: "font_status", wc_bit: 16384 }, { wc_name: "font_text", wc_bit: 65536 }, { wc_name: "map_mode", wc_bit: 268435456 }, { wc_name: "scroll_amount", wc_bit: 33554432 }, { wc_name: "scroll_margin", wc_bit: 4194304 }, { wc_name: "splash_screen", wc_bit: 8388608 }, { wc_name: "use_inverse", wc_bit: 256 }, { wc_name: "vary_msgcount", wc_bit: 2048 }, { wc_name: "windowcolors", wc_bit: 536870912 }, { wc_name: "mouse_support", wc_bit: 2147483648 }, { wc_name: null, wc_bit: 0 }];
/* shares WC_PERM_INVENT */
game.wc2_options = [{ wc_name: "armorstatus", wc_bit: 524288 }, { wc_name: "fullscreen", wc_bit: 1 }, { wc_name: "guicolor", wc_bit: 8192 }, { wc_name: "hilite_status", wc_bit: 8 }, { wc_name: "hitpointbar", wc_bit: 64 }, { wc_name: "menu_shift", wc_bit: 65536 }, { wc_name: "petattr", wc_bit: 4096 }, { wc_name: "softkeyboard", wc_bit: 2 }, { wc_name: "status hilite rules", wc_bit: 8 }, { wc_name: "statushilites", wc_bit: 8 }, { wc_name: "statuslines", wc_bit: 1024 }, { wc_name: "term_cols", wc_bit: 512 }, { wc_name: "term_rows", wc_bit: 512 }, { wc_name: "terrainstatus", wc_bit: 524288 }, { wc_name: "use_darkgray", wc_bit: 32 }, { wc_name: "weaponstatus", wc_bit: 524288 }, { wc_name: "windowborders", wc_bit: 2048 }, { wc_name: "wraptext", wc_bit: 4 }, { wc_name: null, wc_bit: 0 }];
/* name shown in 'O' menu is different */
/* statushilites doesn't have its own bit */
/*
 * If a port wants to change or ensure that the set_in_sysconf,
 * set_in_config, set_gameview, or set_in_game status of an option is
 * correct (for controlling its display in the option menu) call
 * set_option_mod_status()
 * with the appropriate second argument.
 */
export async function set_option_mod_status(optnam, status) {
    let k = 0;
    if (((status < set_in_sysconf) || (status > set_wiznofuz))) {
        await impossible("set_option_mod_status: status out of range %d.", status);
        return;
    }
    for (k = 0; game.allopt[k].name; k++) {
        if (str_start_is(game.allopt[k].name, optnam, (1))) {
            game.allopt[k].setwhere = status;
            return;
        }
    }
}
/*
 * You can set several wc_options in one call to
 * set_wc_option_mod_status() by setting
 * the appropriate bits for each option that you
 * are setting in the optmask argument
 * prior to calling.
 *    example: set_wc_option_mod_status(WC_COLOR|WC_SCROLL_MARGIN,
 * set_in_game);
 */
export async function set_wc_option_mod_status(optmask, status) {
    let k = 0;
    if (((status < set_in_sysconf) || (status > set_wiznofuz))) {
        await impossible("set_wc_option_mod_status: status out of range %d.", status);
        return;
    }
    while (game.wc_options[k].wc_name) {
        if (optmask & game.wc_options[k].wc_bit) {
            await set_option_mod_status(game.wc_options[k].wc_name, status);
        }
        k++;
    }
}
export function is_wc_option(optnam) {
    let k = 0;
    while (game.wc_options[k].wc_name) {
        if (strcmp(game.wc_options[k].wc_name, optnam) == 0) {
            return (1);
        }
        k++;
    }
    return (0);
}
export function wc_supported(optnam) {
    let k = 0;
    for (k = 0; game.wc_options[k].wc_name; ++k) {
        if (!strcmp(game.wc_options[k].wc_name, optnam)) {
            return (game.windowprocs.wincap & game.wc_options[k].wc_bit) ? (1) : (0);
        }
    }
    return (0);
}
/*
 * You can set several wc2_options in one call to
 * set_wc2_option_mod_status() by setting
 * the appropriate bits for each option that you
 * are setting in the optmask argument
 * prior to calling.
 *    example:
 * set_wc2_option_mod_status(WC2_FULLSCREEN|WC2_SOFTKEYBOARD|WC2_WRAPTEXT,
 * set_in_config);
 */
export async function set_wc2_option_mod_status(optmask, status) {
    let k = 0;
    if (((status < set_in_sysconf) || (status > set_wiznofuz))) {
        await impossible("set_wc2_option_mod_status: status out of range %d.", status);
        return;
    }
    while (game.wc2_options[k].wc_name) {
        if (optmask & game.wc2_options[k].wc_bit) {
            await set_option_mod_status(game.wc2_options[k].wc_name, status);
        }
        k++;
    }
}
export function is_wc2_option(optnam) {
    let k = 0;
    while (game.wc2_options[k].wc_name) {
        if (strcmp(game.wc2_options[k].wc_name, optnam) == 0) {
            return (1);
        }
        k++;
    }
    return (0);
}
export function wc2_supported(optnam) {
    let k = 0;
    for (k = 0; game.wc2_options[k].wc_name; ++k) {
        if (!strcmp(game.wc2_options[k].wc_name, optnam)) {
            return (game.windowprocs.wincap2 & game.wc2_options[k].wc_bit) ? (1) : (0);
        }
    }
    return (0);
}
export function wc_set_font_name(opttype, fontname) {
    let fn = null;
    if (!fontname) {
        return;
    }
    switch (opttype) {
        case MAP_OPTION:
            fn = game.iflags.wc_font_map;
            break;
        case MESSAGE_OPTION:
            fn = game.iflags.wc_font_message;
            break;
        case TEXT_OPTION:
            fn = game.iflags.wc_font_text;
            break;
        case MENU_OPTION:
            fn = game.iflags.wc_font_menu;
            break;
        case STATUS_OPTION:
            fn = game.iflags.wc_font_status;
            break;
        default:
            return;
    }
    if (fn) {
        if (fn) {
            free(fn);
        }
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = dupstr(fontname)) */;
    }
    return;
}
game.fgp = [game.iflags.wcolors[wcolor_menu].fg, game.iflags.wcolors[wcolor_message].fg, game.iflags.wcolors[wcolor_status].fg, game.iflags.wcolors[wcolor_text].fg];
game.bgp = [game.iflags.wcolors[wcolor_menu].bg, game.iflags.wcolors[wcolor_message].bg, game.iflags.wcolors[wcolor_status].bg, game.iflags.wcolors[wcolor_text].bg];
game.options_set_window_colors_flag = 0;
export function wc_set_window_colors(op) {
    let j = 0;
    let clr = 0;
    let buf = '';
    let wn = null;
    let tfg = null;
    let tbg = null;
    let newop = null;
    buf = strcpy(buf, op);
    newop = mungspaces(buf);
    while (__nh_char_at0(newop)) {
        wn = tfg = tbg = null;
        /* until first non-space in case there's leading spaces - before
           colorname*/
        /* until first non-space - before foreground*/
        /* until first non-space (in case there's leading space after slash) -
         * before background */
        if (__nh_char_at0(newop) == 32) {
            (newop = __nh_advance_str(newop, 1));
        }
        if (!__nh_char_at0(newop)) {
            return 0;
        }
        wn = newop;
        /* until first space - colorname*/
        /* until first space - background */
        while (__nh_char_at0(newop) && __nh_char_at0(newop) != 32) {
            (newop = __nh_advance_str(newop, 1));
        }
        if (!__nh_char_at0(newop)) {
            return 0;
        }
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        if (__nh_char_at0(newop) == 32) {
            (newop = __nh_advance_str(newop, 1));
        }
        if (!__nh_char_at0(newop)) {
            return 0;
        }
        tfg = newop;
        /* until slash - foreground */
        while (__nh_char_at0(newop) && __nh_char_at0(newop) != 47) {
            (newop = __nh_advance_str(newop, 1));
        }
        if (!__nh_char_at0(newop)) {
            return 0;
        }
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        if (__nh_char_at0(newop) == 32) {
            (newop = __nh_advance_str(newop, 1));
        }
        if (!__nh_char_at0(newop)) {
            return 0;
        }
        tbg = newop;
        while (__nh_char_at0(newop) && __nh_char_at0(newop) != 32) {
            (newop = __nh_advance_str(newop, 1));
        }
        if (__nh_char_at0(newop)) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        }
        for (j = 0; j < WC_COUNT; ++j) {
            if (!strncmpi((wn), (wcnames[j]), -1) || !strncmpi((wn), (wcshortnames[j]), -1)) {
                if (!strstri(tfg, " ")) {
                    if (game.fgp[j]) {
                        free(game.fgp[j]);
                    }
                    clr = check_enhanced_colors(tfg);
                    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = dupstr((clr >= 0) ? wc_color_name(clr) :) */;
                }
                if (!strstri(tbg, " ")) {
                    if (game.bgp[j]) {
                        free(game.bgp[j]);
                    }
                    clr = check_enhanced_colors(tbg);
                    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = dupstr((clr >= 0) ? wc_color_name(clr) :) */;
                }
                if (game.wcolors_opt[j] != 0) {
                    config_error_add("windowcolors for %s windows specified multiple times", wcnames[j]);
                }
                game.wcolors_opt[j]++;
                break;
            }
        }
        if (j == WC_COUNT) {
            config_error_add("windowcolors for unrecognized window type: %s", wn);
        }
    }
    game.options_set_window_colors_flag = 1;
    return 1;
}
export function options_free_window_colors() {
    let j = 0;
    for (j = 0; j < WC_COUNT; ++j) {
        if (game.fgp[j]) {
            free(game.fgp[j]) , void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = null) */;
        }
        if (game.bgp[j]) {
            free(game.bgp[j]) , void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = null) */;
        }
    }
    game.options_set_window_colors_flag = 0;
}
/* set up for wizard mode if player or save file has requested it;
   called from port-specific startup code to handle `nethack -D' or
   OPTIONS=playmode:debug, or from dorecover()'s restgamestate() if
   restoring a game which was saved in wizard mode */
export function set_playmode() {
    if (game.flags.debug) {
        if (authorize_wizard_mode()) {
            game.plnamelen = strlen(strcpy(game.plname, "wizard"));
        } else {
            game.flags.debug = (0);
        }
        game.flags.explore = !game.flags.debug;
        /* not allowed or not available */
        /* try explore mode if we didn't make it into wizard mode */
        /* if requesting wizard mode when restoring a normal game, this will
           set iflags.deferred_X and prompt to activate explore mode after the
           save file has already been deleted */
        game.iflags.deferred_X = (0);
    }
    /* don't need to do anything special for normal play */
    if (game.flags.explore && !authorize_explore_mode()) {
        game.flags.explore = game.iflags.deferred_X = (0);
    }
}
export function enhance_menu_text(buf, sz, whichpass, bool_p, thisopt) {
    let nowsz = 0;
    let availsz = 0;
    if (!buf) {
        return;
    }
    nowsz = strlen(buf) + 1;
    availsz = sz - nowsz;
    ((availsz));
    ((bool_p));
    ((thisopt));
    return;
}
export function heed_all_options() {
    let i = 0;
    for (i = 0; i < OPTCOUNT; i++) {
        game.allopt[i].disregarded = (0);
    }
}
export function disregard_all_options() {
    let i = 0;
    for (i = 0; i < OPTCOUNT; i++) {
        game.allopt[i].disregarded = (1);
    }
}
export function heed_this_option(optidx) {
    if (optidx >= 0 && optidx < OPTCOUNT) {
        game.allopt[optidx].disregarded = (0);
    }
}
export function disregard_this_option(optidx) {
    if (optidx >= 0 && optidx < OPTCOUNT) {
        game.allopt[optidx].disregarded = (1);
    }
}
/* OPTION_LISTS_ONLY */
/*options.c*/
/* we'll get here after <space> or <return> */
/* current element remains pending while the rest of the line gets
           handled recursively; if the rest of line contains any commas,
           then the process will recurse deeper as it is processed */
/* count number of named fruits; if 'op' is found among them,
               then the count doesn't matter because we won't be adding it */
/* if 'forig' is nonNull, we replace it rather than add
               a new fruit; it can only be nonNull if no fruits have
               been created since the previous name was put in place */
/* combination: first two as singles, then full page */
/* full page (default if specified without argument) */
/* full page in reverse order (LIFO; default for curses) */
/* use a menu to choose new value for perminv_mode */
/* avoids giving "unrecognized type of pet" but
                   pet_type(dog.c) won't actually honor this */
/* types of objects to pick up automatically */
/* sortloot order (subclasses for some classes) */
/* alphabetical within each class */
/* alphabetical across all classes */
/* return handler_sortdiscoveries(); */
/* return handler_sortvanquished(); */
/* return handler_versinfo(); */
/* make the choices match defaults */
/*
             * All corridor squares seen via night vision or
             * candles & lamps change.  Update them by calling
             * newsym() on them.  Don't do this if we are
             * initializing the options --- the vision system
             * isn't set up yet.
             */
/* [is reassessment really needed here?] */
/* boolean value has been toggled but some option changes can
           still be pending at this point (mainly for opt_need_redraw);
           give the toggled message now regardless */
/* second line is prefixed by spaces that "c - " would use */
/* PREV_MSGS (for tty or curses) */
/* extended command name for 'm' prefix */
/* parseoptions will prompt for the list of types */
/* combine main string and suffix */
/* skip buf[]'s initial quote */
/* index 'i' matches the numeric setting for windowborders,
           so allow corresponding digit as group accelerator */
/*
     * Most places that call initoptions_init()/initoptions() would
     * have the calls next to each other, so instead of adding
     * initoptions_init() everywhere, just add it where it's needed in
     * a non-adjacent place and call it here for all the other cases.
     */
/* make any symbol parsing quicker */
/* initialize the random number generator(s) */
/*
     * A multi-interface binary might only support status highlighting
     * for some of the interfaces; check whether we asked for it but are
     * using one which doesn't.
     *
     * Option processing can take place before a user-decided WindowPort
     * is even initialized, so check for that too.
     */
/* force fruit to be singular; this handling is not
           needed--or wanted--for fruits from bones because
           they already received it in their original game;
           str==pl_fruit but makesingular() creates a copy
           so we need to copy that back into pl_fruit */
/* handled inline by all_options_strbuf() via all_options_conds() */
/* we do this each time we're called instead of once in doset_simple()
       in case 'menu_tab_sep' ever gets included in the simple menu so
       becomes subject to being changed while doset_simple() is running */
