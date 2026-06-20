/* NetHack 5.0	botl.c	$NHDT-Date: 1769839231 2026/01/30 22:00:31 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.277 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Michael Allison, 2006. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { qsort , qsort_async } from '../c2js-runtime/qsort.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, atoi, atol, nh_strchr_truncate, strcat, strchr, strcmp, strcpy, strlen, strncmp, strncmpi, strncpy, strstri } from '../c2js-runtime/string.js';
import { acurr } from './attrib.js';
import { clr2colorname, match_str2attr, match_str2clr, query_attr, query_color } from './coloratt.js';
import { cg } from './decl.js';
import { nul_glyphinfo, suppress_map_output } from './display.js';
import { pmname } from './do_name.js';
import { In_quest, depth, dunlev, endgamelevelname, on_level } from './dungeon.js';
import { hu_stat } from './eat.js';
import { newuexp } from './exper.js';
import { classify_terrain, money_cnt, near_capacity } from './hack.js';
import { digit, eos, fuzzymatch, highc, lowc, mungspaces, strNsubst, str_start_is, stripchars, strkitten, strsubst, trimspaces, upstart } from './hacklib.js';
import { sticks } from './mondata.js';
import { AKLYS, AMULET_OF_GUARDING, ANY_INT, ANY_INVALID, ANY_IPTR, ANY_LONG, ANY_LPTR, ANY_MASK32, ANY_STR, ANY_UINT, ANY_ULONG, ANY_ULPTR, ANY_UPTR, ART_MITRE_OF_HOLINESS, ART_TSURUGI_OF_MURAMASA, A_CHA, A_CON, A_DEX, A_INT, A_STR, A_WIS, BLINDED, BL_AC, BL_ALIGN, BL_ARMOR, BL_CAP, BL_CH, BL_CHARACTERISTICS, BL_CO, BL_CONDITION, BL_DX, BL_ENE, BL_ENEMAX, BL_EXP, BL_FLUSH, BL_GOLD, BL_HD, BL_HP, BL_HPMAX, BL_HUNGER, BL_IN, BL_LEVELDESC, BL_RESET, BL_SCORE, BL_STR, BL_TERRAIN, BL_TIME, BL_TITLE, BL_VERS, BL_WEAPON, BL_WI, BL_XP, CLOAK_OF_PROTECTION, COIN_CLASS, CONDITION_COUNT, CONFUSION, CREAM_PIE, DEAF, EQ_VALUE, FLYING, GE_VALUE, GLIB, GLYPH_OBJ_OFF, GOLD_PIECE, GT_VALUE, HALLUC, HALLUC_RES, HL_BLINK, HL_BOLD, HL_DIM, HL_INVERSE, HL_ITALIC, HL_NONE, HL_ULINE, HL_UNDEF, ICE, LEVITATION, LE_VALUE, LT_VALUE, MAXBLSTATS, MAXPCHARS, MAX_TYPE, NON_PM, NOT_HUNGRY, NO_LTEQGT, OVERLOADED, P_LANCE, P_MORNING_STAR, P_NONE, P_POLEARMS, P_QUARTERSTAFF, P_SABER, P_SHORT_SWORD, P_UNICORN_HORN, RIN_PROTECTION, SATIATED, SICK, SLIMED, SLT_ENCUMBER, STARVED, STONED, STRANGLED, STUNNED, S_EEL, TOOL_CLASS, TT_BURIEDBALL, TT_LAVA, TXT_VALUE, UNENCUMBERED, WEAPON_CLASS, WOUNDED_LEGS, bl_bareh, bl_blind, bl_busy, bl_conf, bl_deaf, bl_elf_iron, bl_fly, bl_foodpois, bl_glowhands, bl_grab, bl_hallu, bl_held, bl_holding, bl_icy, bl_inlava, bl_lev, bl_parlyz, bl_ride, bl_sleeping, bl_slime, bl_slippery, bl_stone, bl_strngl, bl_stun, bl_submerged, bl_termill, bl_tethered, bl_trapped, bl_unconsc, bl_woundedl, opt_in, opt_out } from './nh-constants.js';
import { helm_simple_name } from './objnam.js';
import { match_optname } from './options.js';
import { critically_low_hp } from './pray.js';
import { roles } from './role.js';
import { Strlen_, strbuf_append } from './strutil.js';
import { unconscious } from './trap.js';
import { status_version } from './version.js';
import { weapon_descr, weapon_type } from './weapon.js';
import { add_menu, add_menu_heading, add_menu_str, encglyph, getlin, select_menu } from './windows.js';

/* defined in eat.c */
/* also used in insight.c */
export const enc_stat = ["", "Burdened", "Stressed", "Strained", "Overtaxed", "Overloaded"];
let __get_strength_str_buf = '';
__nh_register_static(() => { __get_strength_str_buf = ''; });
export function get_strength_str() {
    let st = (acurr(A_STR));
    if (st > 18) {
        if (st > (18 + (100))) {
            __get_strength_str_buf = sprintf(__get_strength_str_buf, "%2d", st - 100);
        } else if (st < (18 + (100))) {
            __get_strength_str_buf = sprintf(__get_strength_str_buf, "18/%02d", st - 18);
        } else {
            __get_strength_str_buf = sprintf(__get_strength_str_buf, "18/**");
        }
    } else {
        __get_strength_str_buf = sprintf(__get_strength_str_buf, "%-1d", st);
    }
    return __get_strength_str_buf;
}
export function check_gold_symbol() {
    let goldch = game.showsyms[COIN_CLASS + ((0) + MAXPCHARS)];
    game.iflags.invis_goldsym = (goldch <= 32);
}
let __do_statusline1_newbot1 = '';
__nh_register_static(() => { __do_statusline1_newbot1 = ''; });
export function do_statusline1() {
    let nb = null;
    let i = 0;
    let j = 0;
    if (suppress_map_output()) {
        return strcpy(__do_statusline1_newbot1, "");
    }
    strcpy(__do_statusline1_newbot1, game.plname);
    if (97 <= __nh_char_at0(__do_statusline1_newbot1) && __nh_char_at0(__do_statusline1_newbot1) <= 122) {
        __nh_char_at0(__do_statusline1_newbot1) += 65 - 97;
    }
    __do_statusline1_newbot1 = __nh_char_write(__do_statusline1_newbot1, 16, 0);
    sprintf(nb = eos(__do_statusline1_newbot1), " the ");
    if ((game.u.umonnum != game.u.umonster)) {
        let mbot = '';
        let k = 0;
        mbot = strcpy(mbot, pmname(game.mons[game.u.umonnum], (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)));
        while (__nh_char_at0(__nh_advance_str(mbot, k)) != 0) {
            if ((k == 0 || (k > 0 && __nh_char_at0(__nh_advance_str(mbot, k - 1)) == 32)) && 97 <= __nh_char_at0(__nh_advance_str(mbot, k)) && __nh_char_at0(__nh_advance_str(mbot, k)) <= 122) {
                __nh_char_at0(__nh_advance_str(mbot, k)) += 65 - 97;
            }
            k++;
        }
        strcpy(nb = eos(nb), mbot);
    } else {
        strcpy(nb = eos(nb), rank());
    }
    sprintf(nb = eos(nb), "  ");
    i = game.mrank_sz + 15;
    /* strlen(newbot1) but less computation */
    j = ((__nh_advance_str(nb, 2)) - __do_statusline1_newbot1);
    if ((i - j) > 0) {
        sprintf(nb = eos(nb), "%*s", i - j, " ");
    }
    sprintf(nb = eos(nb), "St:%s Dx:%-1d Co:%-1d In:%-1d Wi:%-1d Ch:%-1d", get_strength_str(), (acurr(A_DEX)), (acurr(A_CON)), (acurr(A_INT)), (acurr(A_WIS)), (acurr(A_CHA)));
    sprintf(nb = eos(nb), "%s", (game.u.ualign.type == (-1)) ? "  Chaotic" : (game.u.ualign.type == 0) ? "  Neutral" : "  Lawful");
    return __do_statusline1_newbot1;
}
let __do_statusline2_newbot2 = '';
__nh_register_static(() => { __do_statusline2_newbot2 = ''; });
/* dungeon location (and gold), hero health (HP, PW, AC),
            experience (HD if poly'd, else Exp level and maybe Exp points),
            time (in moves), varying number of status conditions */
let __do_statusline2_dloc = '';
__nh_register_static(() => { __do_statusline2_dloc = ''; });
let __do_statusline2_hlth = '';
__nh_register_static(() => { __do_statusline2_hlth = ''; });
let __do_statusline2_expr = '';
__nh_register_static(() => { __do_statusline2_expr = ''; });
let __do_statusline2_tmmv = '';
__nh_register_static(() => { __do_statusline2_tmmv = ''; });
let __do_statusline2_cond = '';
__nh_register_static(() => { __do_statusline2_cond = ''; });
let __do_statusline2_vers = '';
__nh_register_static(() => { __do_statusline2_vers = ''; });
export async function do_statusline2() {
    let nb = null;
    let dln = 0;
    let dx = 0;
    let hln = 0;
    let xln = 0;
    let tln = 0;
    let cln = 0;
    let vrn = 0;
    let hp = 0;
    let hpmax = 0;
    let cap = 0;
    let money = 0;
    if (suppress_map_output()) {
        return strcpy(__do_statusline2_newbot2, "");
    }
    /*
     * Various min(x,9999)'s are to avoid having excessive values
     * violate the field width assumptions in botl.h and should not
     * impact normal play.  Particularly 64-bit long for gold which
     * could require many more digits if someone figures out a way
     * to get and carry a really large (or negative) amount of it.
     * Turn counter is also long, but we'll risk that.
     */
    /* dungeon location plus gold */
    /* includes at least one trailing space */
    describe_level(__do_statusline2_dloc, 1);
    if ((money = money_cnt(game.invent)) < 0) {
        money = 0;
    }
    __do_statusline2_dloc = __nh_buf_append(__do_statusline2_dloc, sprintf('', "%s:%-2ld", (game.iflags.in_dumplog || game.iflags.invis_goldsym) ? "$" : encglyph(((GOLD_PIECE) + GLYPH_OBJ_OFF)), ((money) < (999999) ? (money) : (999999))));
    dln = strlen(__do_statusline2_dloc);
    /* '$' encoded as \GXXXXNNNN is 9 chars longer than display will need */
    dx = strstri(__do_statusline2_dloc, "\\G") ? 9 : 0;
    /* health and armor class (has trailing space for AC 0..9) */
    hp = (game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp;
    hpmax = (game.u.umonnum != game.u.umonster) ? game.u.mhmax : game.u.uhpmax;
    if (hp < 0) {
        hp = 0;
    }
    __do_statusline2_hlth = sprintf(__do_statusline2_hlth, "HP:%d(%d) Pw:%d(%d) AC:%-2d", ((hp) < (9999) ? (hp) : (9999)), ((hpmax) < (9999) ? (hpmax) : (9999)), ((game.u.uen) < (9999) ? (game.u.uen) : (9999)), ((game.u.uenmax) < (9999) ? (game.u.uenmax) : (9999)), game.u.uac);
    hln = strlen(__do_statusline2_hlth);
    if ((game.u.umonnum != game.u.umonster)) {
        __do_statusline2_expr = sprintf(__do_statusline2_expr, "HD:%d", game.mons[game.u.umonnum].mlevel);
    } else if (game.flags.showexp) {
        __do_statusline2_expr = sprintf(__do_statusline2_expr, "Xp:%d/%-1ld", game.u.ulevel, game.u.uexp);
    } else {
        __do_statusline2_expr = sprintf(__do_statusline2_expr, "Xp:%d", game.u.ulevel);
    }
    xln = strlen(__do_statusline2_expr);
    if (game.flags.time) {
        __do_statusline2_tmmv = sprintf(__do_statusline2_tmmv, "T:%ld", game.moves);
    /* ought to issue impossible() and then discard gold */
    /* strongest hero can lift ~300000 gold */
    } else {
        __do_statusline2_tmmv = '';
    }
    tln = strlen(__do_statusline2_tmmv);
    /* status conditions; worst ones first */
    /* once non-empty, cond will have a leading space */
    __do_statusline2_cond = '';
    nb = __do_statusline2_cond;
    /*
     * Stoned, Slimed, Strangled, and both types of Sick are all fatal
     * unless remedied before timeout expires.  Should we order them by
     * shortest time left?  [Probably not worth the effort, since it's
     * unusual for more than one of them to apply at a time.]
     */
    if (game.u.uprops[STONED].intrinsic) {
        strcpy(nb = eos(nb), " Stone");
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        strcpy(nb = eos(nb), " Slime");
    }
    if (game.u.uprops[STRANGLED].intrinsic) {
        strcpy(nb = eos(nb), " Strngl");
    }
    if (game.u.uprops[SICK].intrinsic) {
        if (game.u.usick_type & 1) {
            strcpy(nb = eos(nb), " FoodPois");
        }
        if (game.u.usick_type & 2) {
            strcpy(nb = eos(nb), " TermIll");
        }
    }
    if (game.u.uhs != NOT_HUNGRY) {
        sprintf(nb = eos(nb), " %s", hu_stat[game.u.uhs]);
    }
    if ((cap = near_capacity()) > UNENCUMBERED) {
        sprintf(nb = eos(nb), " %s", enc_stat[cap]);
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        strcpy(nb = eos(nb), " Blind");
    }
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        strcpy(nb = eos(nb), " Deaf");
    }
    if (game.u.uprops[STUNNED].intrinsic) {
        strcpy(nb = eos(nb), " Stun");
    }
    if (game.u.uprops[CONFUSION].intrinsic) {
        strcpy(nb = eos(nb), " Conf");
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        strcpy(nb = eos(nb), " Hallu");
    }
    /* levitation and flying are mutually exclusive; riding is not */
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        strcpy(nb = eos(nb), " Lev");
    }
    if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
        strcpy(nb = eos(nb), " Fly");
    }
    if (game.u.usteed) {
        strcpy(nb = eos(nb), " Ride");
    }
    cln = strlen(__do_statusline2_cond);
    if (game.flags.showvers) {
        status_version(__do_statusline2_vers, 128 /* sizeof(char [128]) */, (1));
    /* version on status line, with leading space */
    } else {
        __do_statusline2_vers = '';
    }
    vrn = strlen(__do_statusline2_vers);
    if ((dln - dx) + 1 + hln + 1 + xln + 1 + tln + 1 + cln + vrn <= 80) {
        __do_statusline2_newbot2 = nh_snprintf("do_statusline2", 229, __do_statusline2_newbot2, 256 /* sizeof(char [256]) */, "%s %s %s %s %s%s", __do_statusline2_dloc, __do_statusline2_hlth, __do_statusline2_expr, __do_statusline2_tmmv, __do_statusline2_cond, __do_statusline2_vers);
    } else {
        if (dln + 1 + hln + 1 + xln + 1 + tln + 1 + cln + vrn > 200) {
            await panic("bot2: second status line exceeds MAXCO (%u > %d)", (dln + 1 + hln + 1 + xln + 1 + tln + 1 + cln + vrn), 200);
        } else if ((dln - dx) + 1 + hln + 1 + xln + 1 + cln <= 80) {
            __do_statusline2_newbot2 = nh_snprintf("do_statusline2", 238, __do_statusline2_newbot2, 256 /* sizeof(char [256]) */, "%s %s %s %s %s%s", __do_statusline2_dloc, __do_statusline2_hlth, __do_statusline2_expr, __do_statusline2_cond, __do_statusline2_tmmv, __do_statusline2_vers);
        } else if ((dln - dx) + 1 + hln + 1 + cln <= 80) {
            __do_statusline2_newbot2 = nh_snprintf("do_statusline2", 241, __do_statusline2_newbot2, 256 /* sizeof(char [256]) */, "%s %s %s %s %s%s", __do_statusline2_dloc, __do_statusline2_hlth, __do_statusline2_cond, __do_statusline2_expr, __do_statusline2_tmmv, __do_statusline2_vers);
        } else {
            __do_statusline2_newbot2 = nh_snprintf("do_statusline2", 244, __do_statusline2_newbot2, 256 /* sizeof(char [256]) */, "%s %s %s %s %s%s", __do_statusline2_hlth, __do_statusline2_cond, __do_statusline2_dloc, __do_statusline2_expr, __do_statusline2_tmmv, __do_statusline2_vers);
        }
        /* only two or three consecutive spaces available to squeeze out */
        __do_statusline2_newbot2 = mungspaces(__do_statusline2_newbot2);
    }
    return __do_statusline2_newbot2;
}
export async function bot() {
    if (game.bot_disabled) {
        return;
    }
    if (game.u.uhp != -1 && game.youmonst.data && game.iflags.status_updates && !suppress_map_output()) {
        if (((game.windowprocs.wincap2 & (8 | 128)) != 0)) {
            await bot_via_windowport();
        } else {
            (game.windowprocs.win_curs)(game.WIN_STATUS, 1, 0);
            (game.windowprocs.win_putstr)(game.WIN_STATUS, 0, do_statusline1());
            (game.windowprocs.win_curs)(game.WIN_STATUS, 1, 1);
            (game.windowprocs.win_putmixed)(game.WIN_STATUS, 0, await do_statusline2());
        }
    }
    game.disp.botl = game.disp.botlx = game.disp.time_botl = (0);
}
/* special purpose status update: move counter ('time' status) only */
export async function timebot() {
    if (game.bot_disabled) {
        return;
    }
    if (game.flags.time && game.iflags.status_updates && !suppress_map_output()) {
        if (((game.windowprocs.wincap2 & (8 | 128)) != 0)) {
            await stat_update_time();
        } else {
            await bot();
        }
    }
    game.disp.time_botl = (0);
}
/* convert experience level (1..30) to rank index (0..8) */
export function xlev_to_rank(xlev) {
    /*
     *   1..2  => 0
     *   3..5  => 1
     *   6..9  => 2
     *  10..13 => 3
     *      ...
     *  26..29 => 7
     *    30   => 8
     * Conversion is precise but only partially reversible.
     */
    return (xlev <= 2) ? 0 : (xlev <= 30) ? (Math.trunc((xlev + 2) / 4)) : 8;
}
/* convert rank index (0..8) to experience level (1..30) */
export function rank_to_xlev(rank) {
    /*
     *  0 =>  1..2
     *  1 =>  3..5
     *  2 =>  6..9
     *  3 => 10..13
     *      ...
     *  7 => 26..29
     *  8 =>   30
     * We return the low end of each range.
     */
    return (rank < 1) ? 1 : (rank < 2) ? 3 : (rank < 8) ? ((rank * 4) - 2) : 30;
}
export function rank_of(lev, monnum, female) {
    let role = null;
    let i = 0;
    for (let __nhi_role = 0; (role = roles[__nhi_role]) && (role.name.m); __nhi_role++) {
        if (monnum == role.mnum) {
            break;
        }
    }
    if (!role.name.m) {
        role = game.urole;
    }
    for (i = xlev_to_rank(lev); i >= 0; i--) {
        if (female && role.rank[i].f) {
            return role.rank[i].f;
        }
        if (role.rank[i].m) {
            return role.rank[i].m;
        }
    }
    /* Try the role name, instead */
    if (female && role.name.f) {
        return role.name.f;
    } else if (role.name.m) {
        return role.name.m;
    }
    return "Player";
}
export function rank() {
    return rank_of(game.u.ulevel, (game.urole.mnum), game.flags.female);
}
export async function title_to_mon(str, rank_indx, title_length) {
    let i = 0;
    let j = 0;
    for (i = 0; roles[i].name.m; i++) {
        for (j = 0; j < 9; j++) {
            if (roles[i].rank[j].m && str_start_is(str, roles[i].rank[j].m, (1))) {
                /* Loop through each of the roles */
                /* loop through each of the rank titles for role #i */
                if (rank_indx) {
                    rank_indx.value = j;
                }
                if (title_length) {
                    title_length.value = await Strlen_(roles[i].rank[j].m, "title_to_mon", 383);
                }
                return roles[i].mnum;
            }
            if (roles[i].rank[j].f && str_start_is(str, roles[i].rank[j].f, (1))) {
                if (rank_indx) {
                    rank_indx.value = j;
                }
                if (title_length) {
                    title_length.value = await Strlen_(roles[i].rank[j].f, "title_to_mon", 391);
                }
                return roles[i].mnum;
            }
        }
    }
    if (title_length) {
        title_length.value = 0;
    }
    return NON_PM;
}
export function max_rank_sz() {
    let i = 0;
    let r = 0;
    let maxr = 0;
    for (i = 0; i < 9; i++) {
        if (game.urole.rank[i].m && (r = strlen(game.urole.rank[i].m)) > maxr) {
            maxr = r;
        }
        if (game.urole.rank[i].f && (r = strlen(game.urole.rank[i].f)) > maxr) {
            maxr = r;
        }
    }
    game.mrank_sz = maxr;
    return;
}
/* hidden_gold(False): only gold in containers whose contents are known */
/* don't include initial gold; don't impose penalty if it's all gone */
/* neither umoney nor depthbonus can grow unusually big (gold due to
       weight); u.urexp might */
/* SCORE_ON_BOTL */
/* provide the name of the current level for display by various ports */
/* output buffer */
/* 1: append trailing space; 2: include dungeon branch name */
export function describe_level(buf, dflgs) {
    /* (used to be unconditional) */
    let addspace = (dflgs & 1) != 0;
    let addbranch = (dflgs & 2) != 0;
    /* False: status, True: livelog */
    let ret = 1;
    if ((((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level))))) {
        buf = sprintf(buf, "%s", game.dungeons[game.u.uz.dnum].dname);
        addbranch = (0);
    } else if (In_quest(game.u.uz)) {
        buf = sprintf(buf, "Home %d", dunlev(game.u.uz));
    } else if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        /* [3.6.2: this used to be "Astral Plane" or generic "End Game"] */
        endgamelevelname(buf, depth(game.u.uz));
        if (!addbranch) {
            buf = strsubst(buf, "Plane of ", "");
        }
        addbranch = (0);
    } else {
        /* ports with more room may expand this one */
        if (!addbranch) {
            buf = sprintf(buf, "%s:%-2d", ((game.u.uz).dnum == (game.dungeon_topology.d_tutorial_dnum)) ? "Tutorial" : "Dlvl", depth(game.u.uz));
        } else {
            buf = sprintf(buf, "level %d", depth(game.u.uz));
        }
        ret = 0;
    }
    if (addbranch) {
        buf = __nh_buf_append(buf, sprintf('', ", %s", game.dungeons[game.u.uz.dnum].dname));
        buf = strsubst(buf, "The ", "the ");
    }
    if (addspace) {
        buf = strcat(buf, " ");
    }
    return ret;
}
/* weapon description for status lines; started as a terser version of
   what ^X shows but has diverged to some extent */
export async function weapon_status(outbuf) {
    let res = null;
    outbuf.value = 0;
    if (!game.uwep) {
        /* no weapon; gloves imply hands; humanoid also implies hands;
           otherwise make no assumptions */
        /* empty handed means "gloves only" */
        res = game.uarmg ? "Empty-hnd" : (((game.youmonst.data).mflags1 & 131072) != 0) ? "Bare-hnds" : "No-weapon";
    } else if (game.u.twoweap) {
        /* two-weaponing implies hands and a weapon or wep-tool
           (not other odd stuff) in each hand */
        res = "Dual-weps";
        /* note: dual wielding two lances doesn't produce double joust */
        if (game.u.usteed && (weapon_type(game.uwep) == P_LANCE || weapon_type(game.uswapwep) == P_LANCE)) {
            res = "Dual+joust";
        }
    } else {
        /* report most weapons by their skill class (so a katana will be
           described as a long sword, for instance; mattock and hook are
           exceptions), or wielded non-weapon item by its object class */
        let p = null;
        let skill = weapon_type(game.uwep);
        if (game.u.usteed && skill == P_LANCE) {
            /* lance behaves specially when mounted */
            /* lance behaves specially when hero is mounted */
            res = "joust";
        } else if (game.uwep.otyp == AKLYS) {
            /* aklys behaves specially when thrown while wielded, so
               give it a distinct name instead of skill name of "club";
               [maybe FIXME?] for the time being
               use real name even if 'obj' is undiscovered "thonged club" */
            res = "aklys";
        } else if ((game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER)) {
            /* simplify short short/broad sword/long sword/two-handed sword
               (similar to messages when dropped due to slippery fingers) */
            res = "sword";
        } else {
            switch (skill) {
                case P_QUARTERSTAFF:
                    res = "staff";
                    break;
                case P_MORNING_STAR:
                    res = "mrng-star";
                    break;
                case P_POLEARMS:
                    res = "pole";
                    break;
                case P_UNICORN_HORN:
                    res = "unihorn";
                    break;
                default:
                    res = await weapon_descr(game.uwep);
                    /* [should this be moved into weapon_descr()?] */
                    if (!strncmpi((res), ("food"), -1) && game.uwep.otyp == CREAM_PIE) {
                        res = "pie";
                    }
                    break;
            }
        }
        if ((game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big) && __nh_char_at0(res) != 50 && strncmpi(res, "two", 3)) {
            outbuf = strcat(outbuf, "2H-");
        }
        strcpy(p = eos(outbuf), res) , res = outbuf;
        p = (() => { const __s = p; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
        /* avoid embedded spaces since its designed to appear as part
           of a space-separated status line */
        strNsubst(outbuf, " ", "-", 0);
    }
    return (outbuf == res) ? outbuf : strcpy(outbuf, res);
}
/* armor description for status lines */
export function armor_status(armbuf) {
    let n = !!game.uarmg + !!game.uarmc + !!game.uarm + !!game.uarmu + !!game.uarmh + !!game.uarmf + !!game.uarms;
    /*
     * FIXME: ^X needs to provide non-abbreviated version of this info.
     * At present it just reports the "no armor" case.
     */
    if (n == 0) {
        armbuf = strcpy(armbuf, "naked");
    } else if (n == 1) {
        armbuf = strcpy(armbuf, game.uarmg ? "gloves" : game.uarmc ? "cloak" : game.uarm ? "suit" : game.uarmu ? "shirt" : game.uarmh ? helm_simple_name(game.uarmh) : game.uarmf ? "boots" : game.uarms ? "shield" : "");
    } else {
        let __nh_p_idx = 0;
        /* gloves first since this is expected to follow weapon_status();
           cloak next since it tends to provide the most protection
           aside from raw AC */
        if (game.uarmg) {
            armbuf = armbuf.slice(0, __nh_p_idx++) + String.fromCharCode(71);
        }
        if (game.uarmc) {
            armbuf = armbuf.slice(0, __nh_p_idx++) + String.fromCharCode(67);
        }
        if (game.uarm) {
            armbuf = armbuf.slice(0, __nh_p_idx++) + String.fromCharCode(65);
        }
        /* suit but 's' is for shield */
        if (game.uarmu) {
            armbuf = armbuf.slice(0, __nh_p_idx++) + String.fromCharCode(85);
        }
        if (game.uarmh) {
            armbuf = armbuf.slice(0, __nh_p_idx++) + String.fromCharCode(72);
        }
        if (game.uarmf) {
            armbuf = armbuf.slice(0, __nh_p_idx++) + String.fromCharCode(66);
        }
        if (game.uarms) {
            armbuf = armbuf.slice(0, __nh_p_idx++) + String.fromCharCode(83);
        }
        armbuf = armbuf.slice(0, __nh_p_idx);
    }
    /*
     * Add a hint about MC by appending a plus sign if that's augmented.
     * Bug:  we should modfiy magical_negation() to return extra info and
     * call it to scan whole inventory looking for sources of protection.
     * This is a hack for efficiency to avoid that during status updates.
     */
    if ((game.uright && game.uright.otyp == RIN_PROTECTION) || (game.uleft && game.uleft.otyp == RIN_PROTECTION) || (game.uamul && game.uamul.otyp == AMULET_OF_GUARDING) || (game.uarmc && game.uarmc.otyp == CLOAK_OF_PROTECTION) || (game.uarmh && game.uarmh.oartifact == ART_MITRE_OF_HOLINESS) || (game.uwep && game.uwep.oartifact == ART_TSURUGI_OF_MURAMASA)) {
        armbuf = strkitten(armbuf, 43);
    }
    return upstart(armbuf);
}
/* =======================================================================*/
/*  statusnew routines                                                    */
/* =======================================================================*/
/* structure that tracks the status details in the core */
/* STATUS_HILITES */
/* TH_UPDOWN encompasses specific 'up' and 'down' also general 'changed' */
/* pointers to current hilite rule and list of this field's defined rules */
/* !STATUS_HILITES */
/*empty*/
/*
 * If entries are added to this, botl.h will require updating too.
 *
 * 'max' values of BL_XP and BL_EXP get special handling since the
 * percentage involved isn't a direct 100*current/maximum calculation.
 *
 * long int fields are given a buffer size of 30 which is guaranteed to
 * be big enough for short prefix followed by a 20+ digit 64-bit long
 * even though the actual values will be much smaller.  The gold field
 * is even bigger due to its encoded dollar sign prefix.
 */
game.initblstats = [{ fldname: "title", fldfmt: "%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_STR, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 80, idxmax: -1, fld: BL_TITLE, hilite_rule: null, thresholds: null }, { fldname: "strength", fldfmt: " St:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_STR, hilite_rule: null, thresholds: null }, { fldname: "dexterity", fldfmt: " Dx:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_DX, hilite_rule: null, thresholds: null }, { fldname: "constitution", fldfmt: " Co:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_CO, hilite_rule: null, thresholds: null }, { fldname: "intelligence", fldfmt: " In:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_IN, hilite_rule: null, thresholds: null }, { fldname: "wisdom", fldfmt: " Wi:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_WI, hilite_rule: null, thresholds: null }, { fldname: "charisma", fldfmt: " Ch:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_CH, hilite_rule: null, thresholds: null }, { fldname: "alignment", fldfmt: " %s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_STR, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 20, idxmax: -1, fld: BL_ALIGN, hilite_rule: null, thresholds: null }, { fldname: "score", fldfmt: " S:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_LONG, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 30, idxmax: -1, fld: BL_SCORE, hilite_rule: null, thresholds: null }, { fldname: "carrying-capacity", fldfmt: " %s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 20, idxmax: -1, fld: BL_CAP, hilite_rule: null, thresholds: null }, { fldname: "gold", fldfmt: " %s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_LONG, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 40, idxmax: -1, fld: BL_GOLD, hilite_rule: null, thresholds: null }, { fldname: "power", fldfmt: " Pw:%s", time: 0, chg: (0), percent_matters: (1), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: BL_ENEMAX, fld: BL_ENE, hilite_rule: null, thresholds: null }, { fldname: "power-max", fldfmt: "(%s)", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_ENEMAX, hilite_rule: null, thresholds: null }, { fldname: "experience-level", fldfmt: " Xp:%s", time: 0, chg: (0), percent_matters: (1), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: BL_EXP, fld: BL_XP, hilite_rule: null, thresholds: null }, { fldname: "armor-class", fldfmt: " AC:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_AC, hilite_rule: null, thresholds: null }, { fldname: "HD", fldfmt: " HD:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_HD, hilite_rule: null, thresholds: null }, { fldname: "time", fldfmt: " T:%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_LONG, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 30, idxmax: -1, fld: BL_TIME, hilite_rule: null, thresholds: null }, { fldname: "hunger", fldfmt: " %s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 20, idxmax: -1, fld: BL_HUNGER, hilite_rule: null, thresholds: null }, { fldname: "hitpoints", fldfmt: " HP:%s", time: 0, chg: (0), percent_matters: (1), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: BL_HPMAX, fld: BL_HP, hilite_rule: null, thresholds: null }, { fldname: "hitpoints-max", fldfmt: "(%s)", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_INT, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 10, idxmax: -1, fld: BL_HPMAX, hilite_rule: null, thresholds: null }, { fldname: "dungeon-level", fldfmt: "%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_STR, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 80, idxmax: -1, fld: BL_LEVELDESC, hilite_rule: null, thresholds: null }, { fldname: "experience", fldfmt: "/%s", time: 0, chg: (0), percent_matters: (1), percent_value: 0, anytype: ANY_LONG, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 30, idxmax: BL_EXP, fld: BL_EXP, hilite_rule: null, thresholds: null }, { fldname: "condition", fldfmt: "%s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_MASK32, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 0, idxmax: -1, fld: BL_CONDITION, hilite_rule: null, thresholds: null }, { fldname: "version", fldfmt: " %s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_STR, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 80, idxmax: -1, fld: BL_VERS, hilite_rule: null, thresholds: null }, { fldname: "weapon", fldfmt: " %s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_STR, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 20, idxmax: -1, fld: BL_WEAPON, hilite_rule: null, thresholds: null }, { fldname: "armor", fldfmt: " %s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_STR, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 20, idxmax: -1, fld: BL_ARMOR, hilite_rule: null, thresholds: null }, { fldname: "terrain", fldfmt: " %s", time: 0, chg: (0), percent_matters: (0), percent_value: 0, anytype: ANY_STR, a: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: null, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 20, idxmax: -1, fld: BL_TERRAIN, hilite_rule: null, thresholds: null }];
/* hunger used to be 'ANY_UINT'; see note below in bot_via_windowport() */
/* optional; once set it doesn't change unless 'showvers' option is
       toggled or player modifies the 'versinfo' option;
       available mostly for screenshots or someone looking over shoulder;
       blstat[][BL_VERS] is actually an int copy of flags.versinfo (0...7) */
/* weapon and armor are constructed strings with no particular numeric
       equivalent */
/* terrain is tracked by a number but designating it as type 'int'
       isn't useful; using type 'string' allows highlighting based on text
       matching which is potentially useful */
const condition_aliases = [{ id: "strangled", bitmask: 2097152 }, { id: "all", bitmask: 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32768 | 65536 | 131072 | 262144 | 524288 | 1048576 | 2097152 | 4194304 | 8388608 | 16777216 | 33554432 | 67108864 | 134217728 | 268435456 | 536870912 }, { id: "major_troubles", bitmask: 128 | 512 | 8192 | 262144 | 1048576 | 2097152 | 16777216 }, { id: "minor_troubles", bitmask: 2 | 8 | 16 | 1024 | 32768 | 8388608 | 4194304 }, { id: "movement", bitmask: 16384 | 64 | 65536 }, { id: "opt_in", bitmask: 1 | 4 | 256 | 2048 | 4096 | 32768 | 131072 | 524288 | 8388608 | 33554432 | 67108864 | 134217728 | 268435456 | 536870912 }];
/* STATUS_HILITES */
/* condition names and their abbreviations are used by windowport code */
export const conditions = [{ ranking: 20, mask: 1, c: bl_bareh, text: ["Bare", "Bar", "Bh"] }, { ranking: 10, mask: 2, c: bl_blind, text: ["Blind", "Blnd", "Bl"] }, { ranking: 20, mask: 4, c: bl_busy, text: ["Busy", "Bsy", "By"] }, { ranking: 10, mask: 8, c: bl_conf, text: ["Conf", "Cnf", "Cf"] }, { ranking: 10, mask: 16, c: bl_deaf, text: ["Deaf", "Def", "Df"] }, { ranking: 15, mask: 32, c: bl_elf_iron, text: ["Iron", "Irn", "Fe"] }, { ranking: 10, mask: 64, c: bl_fly, text: ["Fly", "Fly", "Fl"] }, { ranking: 6, mask: 128, c: bl_foodpois, text: ["FoodPois", "Fpois", "Poi"] }, { ranking: 20, mask: 256, c: bl_glowhands, text: ["Glow", "Glo", "Gl"] }, { ranking: 2, mask: 512, c: bl_grab, text: ["Grab", "Grb", "Gr"] }, { ranking: 10, mask: 1024, c: bl_hallu, text: ["Hallu", "Hal", "Hl"] }, { ranking: 20, mask: 2048, c: bl_held, text: ["Held", "Hld", "Hd"] }, { ranking: 20, mask: 4096, c: bl_icy, text: ["Icy", "Icy", "Ic"] }, { ranking: 8, mask: 8192, c: bl_inlava, text: ["InLava", "Lav", "La"] }, { ranking: 10, mask: 16384, c: bl_lev, text: ["Lev", "Lev", "Lv"] }, { ranking: 20, mask: 32768, c: bl_parlyz, text: ["Parlyz", "Para", "Par"] }, { ranking: 10, mask: 65536, c: bl_ride, text: ["Ride", "Rid", "Rd"] }, { ranking: 20, mask: 131072, c: bl_sleeping, text: ["Zzz", "Zzz", "Zz"] }, { ranking: 6, mask: 262144, c: bl_slime, text: ["Slime", "Slim", "Slm"] }, { ranking: 20, mask: 524288, c: bl_slippery, text: ["Slip", "Slp", "Sl"] }, { ranking: 6, mask: 1048576, c: bl_stone, text: ["Stone", "Ston", "Sto"] }, { ranking: 4, mask: 2097152, c: bl_strngl, text: ["Strngl", "Stngl", "Str"] }, { ranking: 10, mask: 4194304, c: bl_stun, text: ["Stun", "Stun", "St"] }, { ranking: 15, mask: 8388608, c: bl_submerged, text: ["Submrg", "Subm", "Sm"] }, { ranking: 6, mask: 16777216, c: bl_termill, text: ["TermIll", "Ill", "Ill"] }, { ranking: 20, mask: 33554432, c: bl_tethered, text: ["Teth", "Tth", "Te"] }, { ranking: 20, mask: 67108864, c: bl_trapped, text: ["Trap", "Trp", "Tr"] }, { ranking: 20, mask: 134217728, c: bl_unconsc, text: ["Out", "Out", "KO"] }, { ranking: 20, mask: 268435456, c: bl_woundedl, text: ["WLegs", "Leg", "Lg"] }, { ranking: 20, mask: 536870912, c: bl_holding, text: ["UHold", "UHld", "UHd"] }];
/* ranking, mask, identifier, txt1, txt2, txt3 */
/* [perhaps these should all be opt_out with default of 'in';
   otherwise some players may never learn about them] */
game.condtests = [{ c: bl_bareh, useroption: "barehanded", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_blind, useroption: "blind", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_busy, useroption: "busy", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_conf, useroption: "conf", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_deaf, useroption: "deaf", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_elf_iron, useroption: "iron", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_fly, useroption: "fly", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_foodpois, useroption: "foodPois", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_glowhands, useroption: "glowhands", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_grab, useroption: "grab", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_hallu, useroption: "hallucinat", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_held, useroption: "held", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_icy, useroption: "ice", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_inlava, useroption: "lava", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_lev, useroption: "levitate", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_parlyz, useroption: "paralyzed", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_ride, useroption: "ride", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_sleeping, useroption: "sleep", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_slime, useroption: "slime", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_slippery, useroption: "slip", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_stone, useroption: "stone", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_strngl, useroption: "strngl", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_stun, useroption: "stun", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_submerged, useroption: "submerged", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_termill, useroption: "termIll", opt: opt_out, enabled: (1), choice: (0), test: (0) }, { c: bl_tethered, useroption: "tethered", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_trapped, useroption: "trap", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_unconsc, useroption: "unconscious", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_woundedl, useroption: "woundedlegs", opt: opt_in, enabled: (0), choice: (0), test: (0) }, { c: bl_holding, useroption: "holding", opt: opt_in, enabled: (0), choice: (0), test: (0) }];
/* id, useropt, opt_in or out, enabled, configchoice, testresult;
       default value for enabled is !opt_in but can get changed via options */
/* condition indexing */
game.cond_idx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const c_Wall = "Wall";
/*
 *  Terrain descriptions for flags.terrainstatus; simplified from
 *  def_syms[].name and indexed by iflags.terrain_typ; should be
 *  kept in sync with rm.h types and the first half of def_syms[].
 *  The extra pseudo-types are specified by classify_terrain()
 *  when it sets up iflags.terrain_typ.  Walls and a few of the
 *  others can only occur when hero has the Passes_walls ability.
 */
export const terrain_descr = ["Stone", c_Wall, c_Wall, c_Wall, c_Wall, c_Wall, c_Wall, c_Wall, c_Wall, c_Wall, c_Wall, c_Wall, "Portcullis", "Tree", c_Wall, "Stone", "Pool", "Moat", "Water", "(gap)", "Lava", "LavaWall", "Bars", "Doorway", "Corridor", "Room", "Stairs", "Ladder", "Fountain", "Throne", "Sink", "Grave", "Altar", "Ice", "Bridge", "Air", "Cloud", "", c_Wall, "Floor", "Ground", "Open-door", "Shut-door", "Swamp", "Submerged", "Sea", "WaterWall"];
/* 0*/
/* stone */
/* vwall */
/* hwall */
/* tlcorner */
/* trcorner */
/* blcorner */
/* brcorner */
/* crosswall */
/* tuwall */
/* tdwall */
/*10*/
/* tlwall */
/* trwall */
/* dbwall, closed drawbridge 'door' */
/* sdoor: secret door */
/* scorr: secret corridor */
/* pool or non-moat water; can be boiled away */
/* water that can't be boiled away */
/* water on Water level; can't be boiled or frozen */
/* drawbridge_up; replaced by whatever is under */
/*20*/
/* lavapool */
/* lava that extends to ceiling */
/* ironbars */
/* doorless or broken door; diagonal movement is ok */
/* replaced by "Floor" */
/* also replaced by "Floor" */
/*30*/
/* drawbridge_down, span across moat/ice/lava/floor */
/* open air on Air level or bubble on Water level */
/* [part of] a cloud or Air level */
/*
        */
/*37*/
/* MAX_TYPE; skipped ratther than overloaded */
/*38*/
/* MATCH_WALL for special levels; shouldn't happen */
/*
        * additional terrain names that aren't simple levl[][].typ values
        */
/*39*/
/* substituted for room or corridor */
/*40*/
/* 'room' on Earth level */
/* open (not broken or doorless) */
/* closed or locked (or trapped) */
/* Juiblex level */
/* under water */
/* moat terrain on Medusa's level: "shallow sea" */
/* water that extends to the ceiling */
/* cache-related */
game.cache_avail = [(0), (0), (0)];
game.cache_reslt = [(0), (0), (0)];
const cache_nomovemsg = null;
const cache_multi_reason = null;
/* we don't put this next declaration in #ifdef STATUS_HILITES.
 * In the absence of STATUS_HILITES, each array
 * element will be 0 however, and quite meaningless,
 * but we need to pass the first array element as
 * the final argument of status_update, with or
 * without STATUS_HILITES.
 */
export async function bot_via_windowport() {
    let buf = '';
    let titl = null;
    let nb = null;
    let i = 0;
    let idx = 0;
    let cap = 0;
    let money = 0;
    if (!game.blinit) {
        await panic("bot before init.");
    }
    /* toggle from previous iteration */
    idx = 1 - game.now_or_before_idx;
    game.now_or_before_idx = idx;
    /* clear the "value set" indicators */
    memset(game.valset, 0, MAXBLSTATS * 1 /* sizeof(boolean) */);
    strcpy(nb = buf, game.plname);
    /*
     * Note: min(x,9999) - we enforce the same maximum on hp, maxhp,
     * pw, maxpw, and gold as basic status formatting so that the two
     * modes of status display don't produce different information.
     */
    /*
     *  Player name and title.
     */
    nb = (() => { const __s = nb; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    titl = !(game.u.umonnum != game.u.umonster) ? rank() : pmname(game.mons[game.u.umonnum], (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0));
    i = (strlen(buf) + 6 /* sizeof(char [6]) */ + strlen(titl) - 1 /* sizeof(char [1]) */);
    if (i > 30) {
        /* if "Name the Rank/monster" is too long, we truncate the name but
       always keep at least BOTL_NSIZ characters of it; when hitpointbar is
       enabled, anything beyond 30 (long monster name) will be truncated */
        i = 30 - (6 /* sizeof(char [6]) */ + strlen(titl) - 1 /* sizeof(char [1]) */);
        nb = __nh_char_write(nb, ((i) > (16) ? (i) : (16)), 0);
    }
    strcpy(nb = eos(nb), " the ");
    strcpy(nb = eos(nb), titl);
    if ((game.u.umonnum != game.u.umonster)) {
        /* when poly'd, capitalize monster name */
        for (i = 0; __nh_char_at0(__nh_advance_str(nb, i)); i++) {
            if (i == 0 || __nh_char_at0(__nh_advance_str(nb, i - 1)) == 32) {
                nb = __nh_char_write(nb, i, highc(__nh_char_at0(__nh_advance_str(nb, i))));
            }
        }
    }
    game.blstats[idx][BL_TITLE].val = sprintf(game.blstats[idx][BL_TITLE].val, "%-30s", buf);
    /* indicate val already set */
    game.valset[BL_TITLE] = (1);
    game.blstats[idx][BL_STR].a.a_int = (acurr(A_STR));
    game.blstats[idx][BL_STR].val = strcpy(game.blstats[idx][BL_STR].val, get_strength_str());
    game.valset[BL_STR] = (1);
    /*  Dexterity, constitution, intelligence, wisdom, charisma. */
    game.blstats[idx][BL_DX].a.a_int = (acurr(A_DEX));
    game.blstats[idx][BL_CO].a.a_int = (acurr(A_CON));
    game.blstats[idx][BL_IN].a.a_int = (acurr(A_INT));
    game.blstats[idx][BL_WI].a.a_int = (acurr(A_WIS));
    game.blstats[idx][BL_CH].a.a_int = (acurr(A_CHA));
    game.blstats[idx][BL_ALIGN].val = strcpy(game.blstats[idx][BL_ALIGN].val, (game.u.ualign.type == (-1)) ? "Chaotic" : (game.u.ualign.type == 0) ? "Neutral" : "Lawful");
    game.blstats[idx][BL_SCORE].a.a_long = 0;
    i = (game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp;
    /* gameover sets u.uhp to -1 */
    if (i < 0) {
        i = 0;
    }
    game.blstats[idx][BL_HP].rawval.a_int = i;
    game.blstats[idx][BL_HP].a.a_int = ((i) < (9999) ? (i) : (9999));
    i = (game.u.umonnum != game.u.umonster) ? game.u.mhmax : game.u.uhpmax;
    game.blstats[idx][BL_HPMAX].rawval.a_int = i;
    game.blstats[idx][BL_HPMAX].a.a_int = ((i) < (9999) ? (i) : (9999));
    describe_level(game.blstats[idx][BL_LEVELDESC].val, 1);
    game.valset[BL_LEVELDESC] = (1);
    if ((money = money_cnt(game.invent)) < 0) {
        money = 0;
    }
    game.blstats[idx][BL_GOLD].rawval.a_long = money;
    game.blstats[idx][BL_GOLD].a.a_long = ((money) < (999999) ? (money) : (999999));
    game.blstats[idx][BL_GOLD].val = sprintf(game.blstats[idx][BL_GOLD].val, "%s:%ld", (game.iflags.in_dumplog || game.iflags.invis_goldsym) ? "$" : encglyph(((GOLD_PIECE) + GLYPH_OBJ_OFF)), game.blstats[idx][BL_GOLD].a.a_long);
    game.valset[BL_GOLD] = (1);
    game.blstats[idx][BL_ENE].rawval.a_int = game.u.uen;
    game.blstats[idx][BL_ENE].a.a_int = ((game.u.uen) < (9999) ? (game.u.uen) : (9999));
    game.blstats[idx][BL_ENEMAX].rawval.a_int = game.u.uenmax;
    game.blstats[idx][BL_ENEMAX].a.a_int = ((game.u.uenmax) < (9999) ? (game.u.uenmax) : (9999));
    game.blstats[idx][BL_AC].a.a_int = game.u.uac;
    /* Monster level (if Upolyd) */
    game.blstats[idx][BL_HD].a.a_int = (game.u.umonnum != game.u.umonster) ? game.mons[game.u.umonnum].mlevel : 0;
    game.blstats[idx][BL_XP].a.a_int = game.u.ulevel;
    game.blstats[idx][BL_EXP].a.a_long = game.u.uexp;
    game.blstats[idx][BL_TIME].a.a_long = game.moves;
    /* note: u.uhs is unsigned, and 3.6.1's STATUS_HILITE defined
       BL_HUNGER to be ANY_UINT, but that was the only non-int/non-long
       numeric field so it's far simpler to treat it as plain int and
       not need ANY_UINT handling at all */
    game.blstats[idx][BL_HUNGER].a.a_int = game.u.uhs;
    game.blstats[idx][BL_HUNGER].val = strcpy(game.blstats[idx][BL_HUNGER].val, (game.u.uhs != NOT_HUNGRY) ? hu_stat[game.u.uhs] : "");
    game.valset[BL_HUNGER] = (1);
    cap = near_capacity();
    game.blstats[idx][BL_CAP].a.a_int = cap;
    game.blstats[idx][BL_CAP].val = strcpy(game.blstats[idx][BL_CAP].val, (cap > UNENCUMBERED) ? enc_stat[cap] : "");
    game.valset[BL_CAP] = (1);
    if (game.blstats[idx][BL_VERS].a.a_int != game.flags.versinfo) {
        /* Version; unchanging unless player toggles 'showvers' option or
       modifies 'versinfo' option; toggling showvers off will clear it */
        game.blstats[idx][BL_VERS].a.a_int = game.flags.versinfo;
        game.valset[BL_VERS] = (0);
    }
    if (!game.valset[BL_VERS]) {
        status_version(game.blstats[idx][BL_VERS].val, game.blstats[idx][BL_VERS].valwidth, (0));
        game.valset[BL_VERS] = (1);
    }
    game.blstats[idx][BL_CONDITION].a.a_ulong = 0;
    /*
     * Avoid anything that does string comparisons in here because this
     * is called *extremely* often, for every screen update and the same
     * string comparisons would be repeated, thus contributing toward
     * performance degradation.  If it is essential that string comparisons
     * are needed for a particular condition, consider adding a caching
     * mechanism to limit the string comparisons to the first occurrence
     * for that cache lifetime.  There is caching of that nature done for
     * unconsc (1) and parlyz (2) because the suggested way of being able
     * to distinguish unconsc, parlyz, sleeping, and busy involves multiple
     * string comparisons.
     *
     * [Rebuttal:  it's called a lot for Windows and MS-DOS because their
     * sample run-time configuration file enables 'time' (move counter).
     * The optimization to bypass full status update when only 'time'
     * has changed (via timebot(), only effective for VIA_WINDOWPORT()
     * configurations) should ameliorate that.]
     */
    game.condtests[bl_foodpois].test = game.condtests[bl_termill].test = (0);
    if (game.u.uprops[SICK].intrinsic) {
        if (game.condtests[(bl_foodpois)].enabled) {
            game.condtests[(bl_foodpois)].test = (game.u.usick_type & 1) != 0;
        }
        if (game.condtests[(bl_termill)].enabled) {
            game.condtests[(bl_termill)].test = (game.u.usick_type & 2) != 0;
        }
    }
    game.condtests[bl_inlava].test = game.condtests[bl_tethered].test = game.condtests[bl_trapped].test = (0);
    if (game.u.utrap) {
        if (game.condtests[(bl_inlava)].enabled) {
            game.condtests[(bl_inlava)].test = (game.u.utraptype == TT_LAVA);
        }
        if (game.condtests[(bl_tethered)].enabled) {
            game.condtests[(bl_tethered)].test = (game.u.utraptype == TT_BURIEDBALL);
        }
        if (game.condtests[(bl_trapped)].enabled) {
            game.condtests[(bl_trapped)].test = (!game.condtests[bl_inlava].test && !game.condtests[bl_tethered].test);
        }
    }
    game.condtests[bl_grab].test = game.condtests[bl_held].test = game.condtests[bl_holding].test = (0);
    if (game.u.ustuck) {
        if (game.u.uswallow) {
            /* grab == hero is held by sea monster and about to be drowned;
               held == hero is held by something else and can't move away */
            if (game.condtests[(bl_held)].enabled) {
                game.condtests[(bl_held)].test = (1);
            }
        } else if ((game.u.umonnum != game.u.umonster) && sticks(game.youmonst.data)) {
            if (game.condtests[(bl_holding)].enabled) {
                game.condtests[(bl_holding)].test = (1);
            }
        } else {
            if (game.condtests[(bl_grab)].enabled) {
                game.condtests[(bl_grab)].test = (game.u.ustuck.data.mlet == S_EEL);
            }
            if (game.condtests[(bl_held)].enabled) {
                game.condtests[(bl_held)].test = !game.condtests[bl_grab].test;
            }
        }
    }
    game.condtests[bl_blind].test = (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? (1) : (0);
    game.condtests[bl_conf].test = (game.u.uprops[CONFUSION].intrinsic) ? (1) : (0);
    game.condtests[bl_deaf].test = ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? (1) : (0);
    game.condtests[bl_fly].test = (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) ? (1) : (0);
    game.condtests[bl_glowhands].test = (game.u.umconf) ? (1) : (0);
    game.condtests[bl_hallu].test = ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (1) : (0);
    game.condtests[bl_lev].test = (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) ? (1) : (0);
    game.condtests[bl_ride].test = (game.u.usteed) ? (1) : (0);
    game.condtests[bl_slime].test = (game.u.uprops[SLIMED].intrinsic) ? (1) : (0);
    game.condtests[bl_stone].test = (game.u.uprops[STONED].intrinsic) ? (1) : (0);
    game.condtests[bl_strngl].test = (game.u.uprops[STRANGLED].intrinsic) ? (1) : (0);
    game.condtests[bl_stun].test = (game.u.uprops[STUNNED].intrinsic) ? (1) : (0);
    game.condtests[bl_submerged].test = ((game.u.uinwater)) ? (1) : (0);
    if (game.condtests[(bl_elf_iron)].enabled) {
        game.condtests[(bl_elf_iron)].test = ((0));
    }
    if (game.condtests[(bl_bareh)].enabled) {
        game.condtests[(bl_bareh)].test = (!game.uarmg && !game.uwep);
    }
    if (game.condtests[(bl_icy)].enabled) {
        game.condtests[(bl_icy)].test = (game.level.locations[game.u.ux][game.u.uy].typ == ICE);
    }
    if (game.condtests[(bl_slippery)].enabled) {
        game.condtests[(bl_slippery)].test = (game.u.uprops[GLIB].intrinsic) ? (1) : (0);
    }
    if (game.condtests[(bl_woundedl)].enabled) {
        game.condtests[(bl_woundedl)].test = ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) ? (1) : (0);
    }
    if (game.multi < 0) {
        do {
            let clear_cache = (0);
            let refresh_cache = (0);
            if (game.multi < 0) {
                if (game.nomovemsg || game.multi_reason) {
                    if (cache_nomovemsg != game.nomovemsg) {
                        refresh_cache = (1);
                    }
                    if (cache_multi_reason != game.multi_reason) {
                        refresh_cache = (1);
                    }
                } else {
                    clear_cache = (1);
                }
            } else {
                clear_cache = (1);
            }
            if (clear_cache) {
                cache_nomovemsg = null;
                cache_multi_reason = null;
            }
            if (refresh_cache) {
                cache_nomovemsg = game.nomovemsg;
                cache_multi_reason = game.multi_reason;
            }
            if (clear_cache || refresh_cache) {
                (game.cache_avail[0] = (0), game.cache_reslt[0] = (0));
                (game.cache_avail[1] = (0), game.cache_reslt[1] = (0));
            }
        } while (0);
        if (game.condtests[bl_unconsc].enabled && cache_nomovemsg && !game.cache_avail[0]) {
            game.cache_reslt[0] = (!game.u.usleep && unconscious());
            game.cache_avail[0] = (1);
        }
        if (game.condtests[bl_parlyz].enabled && cache_multi_reason && !game.cache_avail[1]) {
            game.cache_reslt[1] = (!strncmp(cache_multi_reason, "paralyzed", 9) || !strncmp(cache_multi_reason, "frozen", 6));
            game.cache_avail[1] = (1);
        }
        if (game.cache_avail[0] && game.cache_reslt[0]) {
            game.condtests[bl_unconsc].test = game.cache_reslt[0];
        } else if (game.cache_avail[1] && game.cache_reslt[1]) {
            game.condtests[bl_parlyz].test = game.cache_reslt[1];
        } else if (game.condtests[bl_sleeping].enabled && game.u.usleep) {
            game.condtests[bl_sleeping].test = (1);
        } else if (game.condtests[bl_busy].enabled) {
            game.condtests[bl_busy].test = (1);
        }
    } else {
        game.condtests[bl_unconsc].test = game.condtests[bl_parlyz].test = game.condtests[bl_sleeping].test = game.condtests[bl_busy].test = (0);
    }
    for (i = 0; i < CONDITION_COUNT; ++i) {
        /* uncomment to suppress UHold */
        if (game.condtests[i].enabled && game.condtests[i].test) {
            game.blstats[idx][BL_CONDITION].a.a_ulong |= conditions[(i)].mask;
        }
    }
    if (game.flags.weaponstatus) {
        await weapon_status(game.blstats[idx][BL_WEAPON].val);
    /*
     * Optionally displayed weapon(s), armor, and terrain.
     */
    } else {
        game.blstats[idx][BL_WEAPON].val = '';
    }
    if (game.flags.armorstatus) {
        armor_status(game.blstats[idx][BL_ARMOR].val);
    } else {
        game.blstats[idx][BL_ARMOR].val = '';
    }
    if (game.flags.terrainstatus) {
        if (game.iflags.terrain_typ == MAX_TYPE) {
            classify_terrain();
        }
        i = game.iflags.terrain_typ;
        if (game.blstats[idx][BL_TERRAIN].a.a_int != i) {
            game.blstats[idx][BL_TERRAIN].val = strcpy(game.blstats[idx][BL_TERRAIN].val, terrain_descr[i]);
            game.blstats[idx][BL_TERRAIN].a.a_int = i;
        }
    } else {
        game.blstats[idx][BL_TERRAIN].val = '';
        /* MAX_TYPE is "none of the above" for levl[][].typ */
        game.blstats[idx][BL_TERRAIN].a.a_int = MAX_TYPE;
    }
    game.valset[BL_TERRAIN] = (1);
    await evaluate_and_notify_windowport(game.valset, idx);
}
/* update just the status lines' 'time' field */
export async function stat_update_time() {
    let idx = game.now_or_before_idx;
    let fld = BL_TIME;
    game.blstats[idx][fld].a.a_long = game.moves;
    game.valset[fld] = (0);
    await eval_notify_windowport_field(fld, game.valset, idx);
    if ((game.windowprocs.wincap2 & 128) != 0) {
        (game.windowprocs.win_status_update)(BL_FLUSH, null, 0, 0, 8, null);
    }
    return;
}
/* deal with player's choice to change processing of a condition */
export async function condopt(idx, addr, negated) {
    let i = 0;
    if ((idx < 0 || idx >= CONDITION_COUNT) || (addr && addr != game.condtests[idx].choice)) {
        return;
    }
    if (!addr) {
        /* special: indicates a request to init so
           set the choice values to match the defaults */
        game.condmenu_sortorder = 0;
        for (i = 0; i < CONDITION_COUNT; ++i) {
            game.cond_idx[i] = i;
            game.condtests[i].choice = game.condtests[i].enabled;
        }
        await qsort_async(game.cond_idx, CONDITION_COUNT, 4 /* sizeof(int) */, cond_cmp);
    } else {
        /* (addr == &condtests[idx].choice) */
        game.condtests[idx].enabled = negated ? (0) : (1);
        game.condtests[idx].choice = game.condtests[idx].enabled;
        /* avoid lingering false positives if test is no longer run */
        game.condtests[idx].test = (0);
    }
}
/* qsort callback routine for sorting the condition index */
export function cond_cmp(vptr1, vptr2) {
    let indx1 = vptr1;
    let indx2 = vptr2;
    let c1 = conditions[indx1].ranking;
    let c2 = conditions[indx2].ranking;
    if (c1 != c2) {
        return c1 - c2;
    }
    /* tie-breaker - visible alpha by name */
    return strncmpi((game.condtests[indx1].useroption), (game.condtests[indx2].useroption), -1);
}
/* qsort callback routine for alphabetical sorting of index */
export function menualpha_cmp(vptr1, vptr2) {
    let indx1 = vptr1;
    let indx2 = vptr2;
    return strncmpi((game.condtests[indx1].useroption), (game.condtests[indx2].useroption), -1);
}
export async function parse_cond_option(negated, opts) {
    let i = 0;
    let sl = 0;
    let compareto = null;
    let uniqpart = null;
    let prefix = "cond_";
    if (!opts || strlen(opts) <= 6 /* sizeof(const char [6]) */ - 1) {
        return 2;
    }
    uniqpart = __nh_advance_str(opts, (6 /* sizeof(const char [6]) */ - 1));
    for (i = 0; i < CONDITION_COUNT; ++i) {
        compareto = game.condtests[i].useroption;
        sl = await Strlen_(compareto, "parse_cond_option", 1364);
        if (match_optname(uniqpart, compareto, (sl >= 4) ? 4 : sl, (0))) {
            await condopt(i, { get value() { return game.condtests[i].choice; }, set value(_v) { game.condtests[i].choice = _v; } }, negated);
            return 0;
        }
    }
    return 1;
}
/* display a menu of all available status condition options and let player
   toggled them on or off; returns True iff any changes are made */
const __cond_menu_menutitle = ["alphabetically", "by ranking"];
export async function cond_menu() {
    let i = 0;
    let res = 0;
    let idx = 0;
    let sequence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let picks = null;
    let mbuf = '';
    let showmenu = (1);
    let clr = 8;
    let changed = (0);
    do {
        for (i = 0; i < CONDITION_COUNT; ++i) {
            sequence[i] = i;
        }
        await qsort_async(sequence, CONDITION_COUNT, 4 /* sizeof(int) */, (game.condmenu_sortorder) ? cond_cmp : menualpha_cmp);
        tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(tmpwin, 0);
        /*... set to Null between Satiated and Hungry     */
        Object.assign(any, cg.zeroany);
        any.a_int = 1;
        mbuf = sprintf(mbuf, "change sort order from \"%s\" to \"%s\"", __cond_menu_menutitle[game.condmenu_sortorder], __cond_menu_menutitle[1 - game.condmenu_sortorder]);
        await add_menu(tmpwin, nul_glyphinfo, any, 83, 0, 0, clr, mbuf, 2);
        Object.assign(any, cg.zeroany);
        mbuf = sprintf(mbuf, "sorted %s", __cond_menu_menutitle[game.condmenu_sortorder]);
        await add_menu_heading(tmpwin, mbuf);
        for (i = 0; i < (Math.trunc(30 /* sizeof(struct condtests_t [30]) */ / 1 /* sizeof(struct condtests_t) */)); i++) {
            idx = sequence[i];
            mbuf = sprintf(mbuf, "cond_%-14s", game.condtests[idx].useroption);
            Object.assign(any, cg.zeroany);
            /* avoid zero and the sort change pick */
            any.a_int = idx + 2;
            game.condtests[idx].choice = (0);
            await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, mbuf, game.condtests[idx].enabled ? 1 : 0);
        }
        (game.windowprocs.win_end_menu)(tmpwin, "Choose status conditions to toggle");
        res = await select_menu(tmpwin, 2, picks);
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        showmenu = (0);
        if (res > 0) {
            for (i = 0; i < res; i++) {
                idx = picks[i].item.a_int;
                if (idx == 1) {
                    game.condmenu_sortorder = 1 - game.condmenu_sortorder;
                    showmenu = (1);
                    break;
                } else {
                    idx -= 2;
                    game.condtests[idx].choice = (1);
                }
            }
            free(picks);
        }
    } while (showmenu);
    if (res >= 0) {
        for (i = 0; i < CONDITION_COUNT; ++i) {
            if (game.condtests[i].enabled != game.condtests[i].choice) {
                game.condtests[i].enabled = game.condtests[i].choice;
                game.condtests[idx].test = (0);
                game.disp.botl = changed = (1);
            }
        }
    }
    return changed;
}
/* called by all_options_conds() to get value for next cond_xyz option
   so that #saveoptions can collect it and write the set into new RC file.
   returns zero-length string if the option is the default value. */
export function opt_next_cond(indx, outbuf) {
    outbuf.value = 0;
    if (indx >= CONDITION_COUNT) {
        return (0);
    }
    /*
     * The entries are returned in internal order which requires the
     * least code.  It would be easy to sort them into alphabetic order
     * (just sort all over again for every requested entry:
     *  int i, sequence[CONDITION_COUNT]
     *  for (i = 0; i < CONDITION_COUNT; ++i) sequence[i] = i;
     *  qsort(sequence, ..., menualpha_cmp);
     *  indx = sequence[indx];
     *  Sprintf(outbuf, ...);
     * with no need to hang on to 'sequence[]' between calls).
     *
     * But using 'severity order' isn't feasible unless the player has
     * used 'mO' on conditions in this session.  Even then, they would
     * revert to the default order (whether internal or alphabetical)
     * if #saveoptions got used in some later session where doset()
     * wasn't used to choose their preferred order.
     */
    if ((game.condtests[indx].opt == opt_in && game.condtests[indx].enabled) || (game.condtests[indx].opt == opt_out && !game.condtests[indx].enabled)) {
        outbuf = sprintf(outbuf, "%scond_%s", game.condtests[indx].enabled ? "" : "!", game.condtests[indx].useroption);
    }
    return (1);
}
let __eval_notify_windowport_field_oldrndencode = 0;
__nh_register_static(() => { __eval_notify_windowport_field_oldrndencode = 0; });
let __eval_notify_windowport_field_oldgoldsym = 0;
__nh_register_static(() => { __eval_notify_windowport_field_oldgoldsym = 0; });
export async function eval_notify_windowport_field(fld, valsetlist, idx) {
    let pc = 0;
    let chg = 0;
    let color = 8;
    let anytype = 0;
    let updated = (0);
    let reset = 0;
    let curr = null;
    let prev = null;
    let fldmax = 0;
    /*
     *  Now pass the changed values to window port.
     */
    anytype = game.blstats[idx][fld].anytype;
    curr = game.blstats[idx][fld];
    prev = game.blstats[1 - idx][fld];
    color = 8;
    chg = game.update_all ? 0 : await compare_blstats(prev, curr);
    if (((chg || game.update_all || fld == BL_XP) && curr.percent_matters && curr.thresholds) || (fld == BL_HP && game.iflags.wc2_hitpointbar)) {
        /*
     * TODO:
     *  Dynamically update 'percent_matters' as rules are added or
     *  removed to track whether any of them are percentage rules.
     *  Then there'll be no need to assume that non-Null 'thresholds'
     *  means that percentages need to be kept up to date.
     *  [Affects exp_percent_changing() too.]
     */
        /* when 'hitpointbar' is On, percent matters even if HP
           hasn't changed and has no percentage rules (in case HPmax
           has changed when HP hasn't, where we ordinarily wouldn't
           update HP so would miss an update of the hitpoint bar) */
        fldmax = curr.idxmax;
        pc = (fldmax == BL_EXP) ? await exp_percentage() : (fldmax >= 0 && fldmax < MAXBLSTATS) ? await percentage(curr, game.blstats[idx][fldmax]) : 0;
        /* bullet proofing; can't get here */
        if (pc != prev.percent_value) {
            chg = (pc < prev.percent_value) ? -1 : 1;
        }
        curr.percent_value = pc;
    } else {
        pc = 0;
    }
    if (fld == BL_GOLD && (game.context.rndencode != __eval_notify_windowport_field_oldrndencode || game.showsyms[COIN_CLASS + ((0) + MAXPCHARS)] != __eval_notify_windowport_field_oldgoldsym)) {
        /* Temporary? hack: moveloop()'s prolog for a new game sets
     * svc.context.rndencode after the status window has been init'd,
     * so $:0 has already been encoded and cached by the window
     * port.  Without this hack, gold's \G sequence won't be
     * recognized and ends up being displayed as-is for 'gu.update_all'.
     *
     * Also, even if svc.context.rndencode hasn't changed and the
     * gold amount itself hasn't changed, the glyph portion of the
     * encoding may have changed if a new symset was put into effect.
     *
     *  \GXXXXNNNN:25
     *  XXXX = the svc.context.rndencode portion
     *  NNNN = the glyph portion
     *  25   = the gold amount
     *
     * Setting 'chg = 2' is enough to render the field properly, but
     * not to honor an initial highlight, so force 'gu.update_all = TRUE'.
     */
        game.update_all = (1);
        __eval_notify_windowport_field_oldrndencode = game.context.rndencode;
        __eval_notify_windowport_field_oldgoldsym = game.showsyms[COIN_CLASS + ((0) + MAXPCHARS)];
    }
    reset = (0);
    if (game.update_all) {
        chg = 0;
        curr.time = prev.time = 0;
    } else if (!chg && curr.time) {
        reset = hilite_reset_needed(prev, game.bl_hilite_moves);
        if (reset) {
            curr.time = prev.time = 0;
        }
    }
    if (game.update_all || chg || reset) {
        if (!valsetlist[fld]) {
            anything_to_s(curr.val, curr.a, anytype);
        }
        if (anytype != ANY_MASK32) {
            if (chg || __nh_char_at0(curr.val)) {
                if (chg == 1 && fld == BL_XP) {
                    chg = await compare_blstats(prev, curr);
                }
                curr.hilite_rule = get_hilite(idx, fld, curr.a, chg, pc, { get value() { return color; }, set value(_v) { color = _v; } });
                prev.hilite_rule = curr.hilite_rule;
                if (chg == 2) {
                    color = 8;
                    chg = 0;
                }
            }
            (game.windowprocs.win_status_update)(fld, curr.val, chg, pc, color, null);
        } else {
            (game.windowprocs.win_status_update)(fld, curr.a.a_ulong, chg, pc, color, game.cond_hilites);
        }
        curr.chg = prev.chg = (1);
        updated = (1);
    }
    return updated;
}
export async function evaluate_and_notify_windowport(valsetlist, idx) {
    let i = 0;
    let fld = 0;
    let updated = 0;
    for (i = 0; i < MAXBLSTATS; i++) {
        fld = game.initblstats[i].fld;
        if (((fld == BL_SCORE) && !game.flags.showscore) || ((fld == BL_EXP) && !game.flags.showexp) || ((fld == BL_TIME) && !game.flags.time) || ((fld == BL_HD) && !(game.u.umonnum != game.u.umonster)) || ((fld == BL_XP || fld == BL_EXP) && (game.u.umonnum != game.u.umonster)) || ((fld == BL_VERS) && !game.flags.showvers) || ((fld == BL_TERRAIN) && !game.flags.terrainstatus) || ((fld == BL_WEAPON) && !game.flags.weaponstatus) || ((fld == BL_ARMOR) && !game.flags.armorstatus)) {
            continue;
        }
        if (await eval_notify_windowport_field(fld, valsetlist, idx)) {
            updated++;
        }
    }
    /*
     * Notes:
     *  1. It is possible to get here, with nothing having been pushed
     *     to the window port, when none of the info has changed.
     *
     *  2. Some window ports are also known to optimize by only drawing
     *     fields that have changed since the previous update.
     *
     * In both of those situations, we need to force updates to
     * all of the fields when disp.botlx is set. The tty port in
     * particular has a problem if that isn't done, since the core sets
     * disp.botlx when a menu or text display obliterates the status
     * line.
     *
     * For those situations, to trigger the full update of every field
     * whether changed or not, call status_update() with BL_RESET.
     *
     * For regular processing and to notify the window port that a
     * bot() round has finished and it's time to trigger a flush of
     * all buffered changes received thus far but not reflected in
     * the display, call status_update() with BL_FLUSH.
     *
     */
    if (game.disp.botlx && (game.windowprocs.wincap2 & 256) != 0) {
        (game.windowprocs.win_status_update)(BL_RESET, null, 0, 0, 8, null);
    } else if ((updated || game.disp.botlx) && (game.windowprocs.wincap2 & 128) != 0) {
        (game.windowprocs.win_status_update)(BL_FLUSH, null, 0, 0, 8, null);
    }
    game.disp.botl = game.disp.botlx = game.disp.time_botl = (0);
    game.update_all = (0);
}
/* True: just recheck fields without other init */
export async function status_initialize(reassessment) {
    let fld = 0;
    let fldenabl = 0;
    let i = 0;
    let fieldfmt = null;
    let fieldname = null;
    if (!reassessment) {
        if (game.blinit) {
            await impossible("2nd status_initialize with full init.");
        }
        await init_blstats();
        (game.windowprocs.win_status_init)();
        game.blinit = (1);
    } else if (!game.blinit) {
        await panic("status 'reassess' before init");
    }
    for (i = 0; i < MAXBLSTATS; ++i) {
        fld = game.initblstats[i].fld;
        fldenabl = (fld == BL_SCORE) ? game.flags.showscore : (fld == BL_TIME) ? game.flags.time : (fld == BL_EXP) ? (game.flags.showexp && !(game.u.umonnum != game.u.umonster)) : (fld == BL_XP) ? !(game.u.umonnum != game.u.umonster) : (fld == BL_HD) ? (game.u.umonnum != game.u.umonster) : (fld == BL_VERS) ? game.flags.showvers : (fld == BL_WEAPON) ? game.flags.weaponstatus : (fld == BL_ARMOR) ? game.flags.armorstatus : (fld == BL_TERRAIN) ? game.flags.terrainstatus : (1);
        fieldname = game.initblstats[i].fldname;
        fieldfmt = (fld == BL_TITLE && game.iflags.wc2_hitpointbar) ? "%-30.30s" : game.initblstats[i].fldfmt;
        (game.windowprocs.win_status_enablefield)(fld, fieldname, fieldfmt, fldenabl);
    }
    game.update_all = (1);
    game.disp.botlx = (1);
}
export function status_finish() {
    let i = 0;
    /* call the window port cleanup routine first */
    if (game.windowprocs.win_status_finish) {
        (game.windowprocs.win_status_finish)();
    }
    for (i = 0; i < MAXBLSTATS; ++i) {
        /* free memory that we alloc'd now */
        if (game.blstats[0][i].val) {
            free(game.blstats[0][i].val) , game.blstats[0][i].val = (null);
        }
        if (game.blstats[1][i].val) {
            free(game.blstats[1][i].val) , game.blstats[1][i].val = (null);
        }
        /* pointer to an entry in thresholds list; Null it out since
           that list is about to go away */
        /* pointer into thresholds list, now stale */
        game.blstats[0][i].hilite_rule = game.blstats[1][i].hilite_rule = null;
        if (game.blstats[0][i].thresholds) {
            let temp = null;
            let next = null;
            for (temp = game.blstats[0][i].thresholds; temp; temp = next) {
                next = temp.next;
                free(temp);
            }
            game.blstats[0][i].thresholds = game.blstats[1][i].thresholds = (null);
        }
    }
}
let __init_blstats_initalready = (0);
__nh_register_static(() => { __init_blstats_initalready = (0); });
export async function init_blstats() {
    let i = 0;
    let j = 0;
    if (__init_blstats_initalready) {
        await impossible("init_blstats called more than once.");
        return;
    }
    for (i = 0; i <= 1; ++i) {
        for (j = 0; j < MAXBLSTATS; ++j) {
            let keep_hilite_chain = game.blstats[i][j].thresholds;
            Object.assign(game.blstats[i][j], game.initblstats[j]);
            Object.assign(game.blstats[i][j].a, cg.zeroany);
            if (game.blstats[i][j].valwidth) {
                game.blstats[i][j].val = alloc(game.blstats[i][j].valwidth);
                game.blstats[i][j].val = __nh_char_write(game.blstats[i][j].val, 0, 0);
            } else {
                game.blstats[i][j].val = null;
            }
            game.blstats[i][j].thresholds = keep_hilite_chain;
        }
    }
    __init_blstats_initalready = (1);
}
/*
 * This compares the previous stat with the current stat,
 * and returns one of the following results based on that:
 *
 *   if prev_value < new_value (stat went up, increased)
 *      return 1
 *
 *   if prev_value > new_value (stat went down, decreased)
 *      return  -1
 *
 *   if prev_value == new_value (stat stayed the same)
 *      return 0
 *
 *   Special cases:
 *     - for bitmasks, 0 = stayed the same, 1 = changed
 *     - for strings,  0 = stayed the same, 1 = changed
 *
 */
export async function compare_blstats(bl1, bl2) {
    let a1 = null;
    let a2 = null;
    let use_rawval = 0;
    let anytype = 0;
    let fld = 0;
    let result = 0;
    if (!bl1 || !bl2) {
        await panic("compare_blstat: bad istat pointer %s, %s", fmt_ptr(bl1), fmt_ptr(bl2));
    }
    anytype = bl1.anytype;
    if ((!bl1.a.a_void || !bl2.a.a_void) && (anytype == ANY_IPTR || anytype == ANY_UPTR || anytype == ANY_LPTR || anytype == ANY_ULPTR)) {
        await panic("compare_blstat: invalid pointer %s, %s", fmt_ptr(bl1.a.a_void), fmt_ptr(bl2.a.a_void));
    }
    /* cheat; terrain is highlighted as a string but we have a handy int
       reflecting its value to use when checking for changes */
    if (bl1.fld == BL_TERRAIN) {
        anytype = ANY_INT;
    }
    fld = bl1.fld;
    use_rawval = (fld == BL_HP || fld == BL_HPMAX || fld == BL_ENE || fld == BL_ENEMAX || fld == BL_GOLD);
    a1 = use_rawval ? bl1.rawval : bl1.a;
    a2 = use_rawval ? bl2.rawval : bl2.a;
    switch (anytype) {
        case ANY_INT:
            result = (a1.a_int < a2.a_int) ? 1 : (a1.a_int > a2.a_int) ? -1 : 0;
            break;
        case ANY_IPTR:
            result = (a1.a_iptr < a2.a_iptr) ? 1 : (a1.a_iptr > a2.a_iptr) ? -1 : 0;
            break;
        case ANY_LONG:
            result = (a1.a_long < a2.a_long) ? 1 : (a1.a_long > a2.a_long) ? -1 : 0;
            break;
        case ANY_LPTR:
            result = (a1.a_lptr < a2.a_lptr) ? 1 : (a1.a_lptr > a2.a_lptr) ? -1 : 0;
            break;
        case ANY_UINT:
            result = (a1.a_uint < a2.a_uint) ? 1 : (a1.a_uint > a2.a_uint) ? -1 : 0;
            break;
        case ANY_UPTR:
            result = (a1.a_uptr < a2.a_uptr) ? 1 : (a1.a_uptr > a2.a_uptr) ? -1 : 0;
            break;
        case ANY_ULONG:
            result = (a1.a_ulong < a2.a_ulong) ? 1 : (a1.a_ulong > a2.a_ulong) ? -1 : 0;
            break;
        case ANY_ULPTR:
            result = (a1.a_ulptr < a2.a_ulptr) ? 1 : (a1.a_ulptr > a2.a_ulptr) ? -1 : 0;
            break;
        case ANY_STR:
            result = sgn(strcmp(bl1.val, bl2.val));
            break;
        case ANY_MASK32:
            result = (a1.a_ulong != a2.a_ulong);
            break;
        default:
            result = 1;
    }
    return result;
}
export function anything_to_s(buf, a, anytype) {
    if (!buf) {
        return null;
    }
    switch (anytype) {
        case ANY_ULONG:
            buf = sprintf(buf, "%lu", a.a_ulong);
            break;
        case ANY_MASK32:
            buf = sprintf(buf, "%lx", a.a_ulong);
            break;
        case ANY_LONG:
            buf = sprintf(buf, "%ld", a.a_long);
            break;
        case ANY_INT:
            buf = sprintf(buf, "%d", a.a_int);
            break;
        case ANY_UINT:
            buf = sprintf(buf, "%u", a.a_uint);
            break;
        case ANY_IPTR:
            buf = sprintf(buf, "%d", a.a_iptr);
            break;
        case ANY_LPTR:
            buf = sprintf(buf, "%ld", a.a_lptr);
            break;
        case ANY_ULPTR:
            buf = sprintf(buf, "%lu", a.a_ulptr);
            break;
        case ANY_UPTR:
            buf = sprintf(buf, "%u", a.a_uptr);
            break;
        case ANY_STR:
            ;
            break;
        default:
            buf = __nh_char_write(buf, 0, 0);
    }
    return buf;
}
export function s_to_anything(a, buf, anytype) {
    if (!buf || !a) {
        return;
    }
    switch (anytype) {
        case ANY_LONG:
            a.a_long = atol(buf);
            break;
        case ANY_INT:
            a.a_int = atoi(buf);
            break;
        case ANY_UINT:
            a.a_uint = atoi(buf);
            break;
        case ANY_ULONG:
            a.a_ulong = atol(buf);
            break;
        case ANY_IPTR:
            if (a.a_iptr) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = atoi(buf)) */;
            }
            break;
        case ANY_UPTR:
            if (a.a_uptr) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = atoi(buf)) */;
            }
            break;
        case ANY_LPTR:
            if (a.a_lptr) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = atol(buf)) */;
            }
            break;
        case ANY_ULPTR:
            if (a.a_ulptr) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = atol(buf)) */;
            }
            break;
        case ANY_MASK32:
            a.a_ulong = atol(buf);
            break;
        default:
            a.a_void = null;
            break;
    }
    return;
}
/* STATUS_HILITES */
/* integer percentage is 100 * bl->a / maxbl->a */
export async function percentage(bl, maxbl) {
    let result = 0;
    let anytype = 0;
    let ival = 0;
    let mval = 0;
    let lval = 0;
    let uval = 0;
    let ulval = 0;
    let fld = 0;
    let use_rawval = 0;
    if (!bl || !maxbl) {
        await impossible("percentage: bad istat pointer %s, %s", fmt_ptr(bl), fmt_ptr(maxbl));
        return 0;
    }
    fld = bl.fld;
    use_rawval = (fld == BL_HP || fld == BL_ENE);
    ival = 0 , lval = 0 , uval = 0 , ulval = 0;
    anytype = bl.anytype;
    if (maxbl.a.a_void) {
        switch (anytype) {
            case ANY_INT:
                ival = use_rawval ? bl.rawval.a_int : bl.a.a_int;
                mval = use_rawval ? maxbl.rawval.a_int : maxbl.a.a_int;
                result = (Math.trunc((100 * ival) / mval));
                break;
            case ANY_LONG:
                lval = bl.a.a_long;
                result = (Math.trunc((100 * lval) / maxbl.a.a_long));
                break;
            case ANY_UINT:
                uval = bl.a.a_uint;
                result = (Math.trunc((100 * uval) / maxbl.a.a_uint));
                break;
            case ANY_ULONG:
                ulval = bl.a.a_ulong;
                result = (Math.trunc((100 * ulval) / maxbl.a.a_ulong));
                break;
            case ANY_IPTR:
                ival = bl.a.a_iptr;
                result = (Math.trunc((100 * ival) / (maxbl.a.a_iptr)));
                break;
            case ANY_LPTR:
                lval = bl.a.a_lptr;
                result = (Math.trunc((100 * lval) / (maxbl.a.a_lptr)));
                break;
            case ANY_UPTR:
                uval = bl.a.a_uptr;
                result = (Math.trunc((100 * uval) / (maxbl.a.a_uptr)));
                break;
            case ANY_ULPTR:
                ulval = bl.a.a_ulptr;
                result = (Math.trunc((100 * ulval) / (maxbl.a.a_ulptr)));
                break;
        }
    }
    /* don't let truncation from integer division produce a zero result
       from a non-zero input; note: if we ever change to something like
       ((((1000 * val) / max) + 5) / 10) for a rounded result, we'll
       also need to check for and convert false 100 to 99 */
    if (result == 0 && (ival != 0 || lval != 0 || uval != 0 || ulval != 0)) {
        result = 1;
    }
    return result;
}
/* percentage for both xp (level) and exp (points) is the percentage for
   (curr_exp - this_level_start) in (next_level_start - this_level_start) */
export async function exp_percentage() {
    let res = 0;
    if (game.u.ulevel < 30) {
        let exp_val = 0;
        let nxt_exp_val = 0;
        let curlvlstart = 0;
        curlvlstart = newuexp(game.u.ulevel - 1);
        exp_val = game.u.uexp - curlvlstart;
        nxt_exp_val = newuexp(game.u.ulevel) - curlvlstart;
        if (exp_val == nxt_exp_val - 1) {
            /*
             * Full 100% is unattainable since hero gains a level
             * and the threshold for next level increases, but treat
             * (next_level_start - 1 point) as a special case.  It's a
             * key value after being level drained so is something that
             * some players would like to be able to highlight distinctly.
             */
            res = 100;
        } else {
            let curval = { fldname: null, fldfmt: null, time: 0, chg: 0, percent_matters: 0, percent_value: 0, anytype: 0, a: { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 0, idxmax: 0, fld: 0, hilite_rule: null, thresholds: null };
            let maxval = { fldname: null, fldfmt: null, time: 0, chg: 0, percent_matters: 0, percent_value: 0, anytype: 0, a: { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, rawval: { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, val: null, valwidth: 0, idxmax: 0, fld: 0, hilite_rule: null, thresholds: null };
            curval.anytype = maxval.anytype = ANY_LONG;
            Object.assign(curval.a, Object.assign(maxval.a, cg.zeroany));
            curval.a.a_long = exp_val;
            maxval.a.a_long = nxt_exp_val;
            /* (neither BL_HP nor BL_ENE) */
            curval.fld = maxval.fld = BL_EXP;
            res = await percentage(curval, maxval);
        }
    }
    return res;
}
/* experience points have changed but experience level hasn't; decide whether
   botl update is needed for a different percentage highlight rule for Xp */
export async function exp_percent_changing() {
    let pc = 0;
    let a = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let color_dummy = 0;
    let rule = null;
    let curr = null;
    if (!game.disp.botl) {
        /* if status update is already requested, skip this processing */
        /*
         * Status update is warranted iff percent integer changes and the new
         * percentage results in a different highlighting rule being selected.
         */
        curr = game.blstats[game.now_or_before_idx][BL_XP];
        if (curr.percent_matters && curr.thresholds && (pc = await exp_percentage()) != curr.percent_value) {
            /* TODO: [see eval_notify_windowport_field() about percent_matters
           and the check against 'thresholds'] */
            Object.assign(a, cg.zeroany);
            a.a_int = game.u.ulevel;
            rule = get_hilite(game.now_or_before_idx, BL_XP, a, 0, pc, { get value() { return color_dummy; }, set value(_v) { color_dummy = _v; } });
            /* caller should set 'disp.botl' to True */
            if (rule != curr.hilite_rule) {
                return (1);
            }
        }
    }
    return (0);
}
/* callback so that interface can get capacity index rather than trying
   to reconstruct that from the encumbrance string or asking the general
   core what the value is */
export function stat_cap_indx() {
    let cap = 0;
    cap = game.blstats[game.now_or_before_idx][BL_CAP].a.a_int;
    return cap;
}
/* callback so that interface can get hunger index rather than trying to
   reconstruct that from the hunger string or dipping into core internals */
export function stat_hunger_indx() {
    let uhs = 0;
    uhs = game.blstats[game.now_or_before_idx][BL_HUNGER].a.a_int;
    return uhs;
}
/* used by X11 for "tty status" even when STATUS_HILITES is disabled */
export function bl_idx_to_fldname(idx) {
    if (idx >= 0 && idx < MAXBLSTATS) {
        return game.initblstats[idx].fldname;
    }
    return null;
}
/* used when rendering hitpointbar; inoutbuf[] has been padded with
   trailing spaces; replace pairs of spaces with pairs of space+dash */
export function repad_with_dashes(inoutbuf) {
    let p = eos(inoutbuf);
    while (p >= __nh_advance_str(inoutbuf, 2) && __nh_char_at0(__nh_advance_str(p, -1)) == 32 && __nh_char_at0(__nh_advance_str(p, -2)) == 32) {
        p = __nh_char_write(p, -1, 45);
        p = __nh_advance_str(p, -(2));
    }
}
/****************************************************************************/
/* Core status hiliting support */
/****************************************************************************/
// struct fieldid_t: { fieldname, fldid }
const fieldids_alias = [{ fieldname: "characteristics", fldid: BL_CHARACTERISTICS }, { fieldname: "encumbrance", fldid: BL_CAP }, { fieldname: "experience-points", fldid: BL_EXP }, { fieldname: "dx", fldid: BL_DX }, { fieldname: "co", fldid: BL_CO }, { fieldname: "con", fldid: BL_CO }, { fieldname: "points", fldid: BL_SCORE }, { fieldname: "cap", fldid: BL_CAP }, { fieldname: "pw", fldid: BL_ENE }, { fieldname: "pw-max", fldid: BL_ENEMAX }, { fieldname: "xl", fldid: BL_XP }, { fieldname: "xplvl", fldid: BL_XP }, { fieldname: "ac", fldid: BL_AC }, { fieldname: "hit-dice", fldid: BL_HD }, { fieldname: "turns", fldid: BL_TIME }, { fieldname: "hp", fldid: BL_HP }, { fieldname: "hp-max", fldid: BL_HPMAX }, { fieldname: "dgn", fldid: BL_LEVELDESC }, { fieldname: "xp", fldid: BL_EXP }, { fieldname: "exp", fldid: BL_EXP }, { fieldname: "flags", fldid: BL_CONDITION }, { fieldname: null, fldid: BL_FLUSH }];
/* format arguments */
const threshold_value = "hilite_status threshold ";
const is_out_of_range = " is out of range";
/* field name to bottom line index */
export function fldname_to_bl_indx(name) {
    let i = 0;
    let nmatches = 0;
    let fld = 0;
    if (name && __nh_char_at0(name)) {
        for (i = 0; i < (Math.trunc(27 /* sizeof(struct istat_s [27]) */ / 1 /* sizeof(struct istat_s) */)); i++) {
            if (fuzzymatch(game.initblstats[i].fldname, name, " -_", (1))) {
                /* check matches to canonical names */
                fld = game.initblstats[i].fld;
                nmatches++;
            }
        }
        if (!nmatches) {
            for (i = 0; fieldids_alias[i].fieldname; i++) {
                if (fuzzymatch(fieldids_alias[i].fieldname, name, " -_", (1))) {
                    fld = fieldids_alias[i].fldid;
                    nmatches++;
                }
            }
        }
        if (!nmatches) {
            /* check partial matches to canonical names */
            let len = strlen(name);
            for (i = 0; i < (Math.trunc(27 /* sizeof(struct istat_s [27]) */ / 1 /* sizeof(struct istat_s) */)); i++) {
                if (!strncmpi(name, game.initblstats[i].fldname, len)) {
                    fld = game.initblstats[i].fld;
                    nmatches++;
                }
            }
        }
    }
    return (nmatches == 1) ? fld : BL_FLUSH;
}
/* no longer augmented; it once encoded fractional
                          * amounts for multiple moves within same turn */
export function hilite_reset_needed(bl_p, augmented_time) {
    /*
     * This 'multi' handling may need some tuning...
     */
    if (game.multi) {
        return (0);
    }
    if (!((bl_p.hilite_rule) && (bl_p.hilite_rule).behavior == 102)) {
        return (0);
    }
    if (bl_p.time == 0 || bl_p.time >= augmented_time) {
        return (0);
    }
    return (1);
}
/* called from moveloop(); sets context.botl if temp hilites have timed out */
export function status_eval_next_unhilite() {
    let i = 0;
    let curr = null;
    let next_unhilite = 0;
    let this_unhilite = 0;
    /* simplified; at one point we used to
                                     * try to encode fractional amounts for
                                     * multiple moves within same turn */
    game.bl_hilite_moves = game.moves;
    /* figure out whether an unhilight needs to be performed now */
    next_unhilite = 0;
    for (i = 0; i < MAXBLSTATS; ++i) {
        /* blstats[0][*].time==blstats[1][*].time */
        curr = game.blstats[0][i];
        if (curr.chg) {
            let prev = game.blstats[1][i];
            if (((curr.hilite_rule) && (curr.hilite_rule).behavior == 102)) {
                curr.time = (game.bl_hilite_moves + game.iflags.hilite_delta);
            } else {
                curr.time = 0;
            }
            prev.time = curr.time;
            curr.chg = prev.chg = (0);
            game.disp.botl = (1);
        }
        if (game.disp.botl) {
            continue;
        }
        /* just process other gb.blstats[][].time and .chg */
        this_unhilite = curr.time;
        if (this_unhilite > 0 && (next_unhilite == 0 || this_unhilite < next_unhilite) && hilite_reset_needed(curr, this_unhilite + 1)) {
            next_unhilite = this_unhilite;
            if (next_unhilite < game.bl_hilite_moves) {
                game.disp.botl = (1);
            }
        }
    }
}
/* called by options handling when 'statushilites' value is changed */
export function reset_status_hilites() {
    if (game.iflags.hilite_delta) {
        let i = 0;
        for (i = 0; i < MAXBLSTATS; ++i) {
            game.blstats[0][i].time = game.blstats[1][i].time = 0;
        }
        game.update_all = (1);
    }
    game.disp.botlx = (1);
}
/* test whether the text from a title rule matches the string for
   title-while-polymorphed in the 'textmatch' menu */
export function noneoftheabove(hl_text) {
    if (fuzzymatch(hl_text, "none of the above", "\" -_", (1)) || fuzzymatch(hl_text, "(polymorphed)", "\"()", (1)) || fuzzymatch(hl_text, "none of the above (polymorphed)", "\" -_()", (1))) {
        return (1);
    }
    return (0);
}
/*
 * get_hilite
 *
 * Returns, based on the value and the direction it is moving,
 * the highlight rule that applies to the specified field.
 *
 * Provide get_hilite() with the following to work with:
 *     actual value vp
 *          useful for BL_TH_VAL_ABSOLUTE
 *     indicator of down, up, or the same (-1, 1, 0) chg
 *          useful for BL_TH_UPDOWN or change detection
 *     percentage (current value percentage of max value) pc
 *          useful for BL_TH_VAL_PERCENTAGE
 *
 * Get back:
 *     pointer to rule that applies; Null if no rule does.
 */
export function get_hilite(idx, fldidx, vp, chg, pc, colorptr) {
    let hl = null;
    let rule = null;
    let value = vp;
    let txtstr = null;
    if (fldidx < 0 || fldidx >= MAXBLSTATS) {
        return null;
    }
    if ((game.blstats[0][(fldidx)].thresholds)) {
        let dt = 0;
        /* there are hilites set here */
        let max_pc = -1;
        let min_pc = 101;
        /* LARGEST_INT isn't INT_MAX; it fits within 16 bits, but that
           value is big enough to handle all 'int' status fields */
        let max_ival = -32767;
        let min_ival = 32767;
        /* LONG_MAX comes from <limits.h> which might not be available for
           ancient configurations; we don't need LONG_MIN */
        let max_lval = -9223372036854775807;
        let min_lval = 9223372036854775807;
        let exactmatch = (0);
        let updown = (0);
        let changed = (0);
        let perc_or_abs = (0);
        let crit_hp = (0);
        for (hl = game.blstats[0][fldidx].thresholds; hl; hl = hl.next) {
            /* min_/max_ are used to track best fit */
            /* only needed for 'absolute' */
            dt = game.initblstats[fldidx].anytype;
            /* for HP, if we already have a critical-hp rule then we ignore
               other HP rules unless we hit another critical-hp one (last
               one found wins); critical-hp takes precedence over temporary
               HP highlights, otherwise a hero with regeneration and an up
               or changed rule for HP would always show that up or changed
               highlight even when within the critical-hp threshold because
               the value will go up by at least one on every move */
            if (crit_hp && hl.behavior != 106) {
                continue;
            }
            /* if we've already matched a temporary highlight, it takes
               precedence over all persistent ones; we still process
               updown rules to get the last one which qualifies */
            if ((updown || changed) && hl.behavior != 102) {
                continue;
            }
            /* among persistent highlights, if a 'percentage' or 'absolute'
               rule has been matched, it takes precedence over 'always' */
            if (perc_or_abs && hl.behavior == 105) {
                continue;
            }
            switch (hl.behavior) {
                case 100:
                    if (hl.rel == EQ_VALUE && pc == hl.value.a_int) {
                        /* percent values are always ANY_INT */
                        /* already found best fit, skip lt,ge,&c */
                        /* uses 'chg' (set by caller), not 'dt' */
                        /* specific 'up' or 'down' takes precedence over general
                   'changed' regardless of their order in the rule set */
                        rule = hl;
                        min_pc = max_pc = hl.value.a_int;
                        exactmatch = perc_or_abs = (1);
                    } else if (exactmatch) {
                        ;
                    } else if (hl.rel == LT_VALUE && (pc < hl.value.a_int) && (hl.value.a_int <= min_pc)) {
                        rule = hl;
                        min_pc = hl.value.a_int;
                        perc_or_abs = (1);
                    } else if (hl.rel == LE_VALUE && (pc <= hl.value.a_int) && (hl.value.a_int <= min_pc)) {
                        rule = hl;
                        min_pc = hl.value.a_int;
                        perc_or_abs = (1);
                    } else if (hl.rel == GT_VALUE && (pc > hl.value.a_int) && (hl.value.a_int >= max_pc)) {
                        rule = hl;
                        max_pc = hl.value.a_int;
                        perc_or_abs = (1);
                    } else if (hl.rel == GE_VALUE && (pc >= hl.value.a_int) && (hl.value.a_int >= max_pc)) {
                        rule = hl;
                        max_pc = hl.value.a_int;
                        perc_or_abs = (1);
                    }
                    break;
                case 102:
                    if (chg < 0 && hl.rel == LT_VALUE) {
                        rule = hl;
                        updown = (1);
                    } else if (chg > 0 && hl.rel == GT_VALUE) {
                        rule = hl;
                        updown = (1);
                    } else if (chg != 0 && hl.rel == EQ_VALUE && !updown) {
                        rule = hl;
                        changed = (1);
                    }
                    break;
                case 101:
                    if (dt == ANY_INT) {
                        if (hl.rel == EQ_VALUE && hl.value.a_int == value.a_int) {
                            /* either ANY_INT or ANY_LONG */
                            /*
                 * The int and long variations here are identical aside from
                 * union field and min_/max_ variable names.  If you change
                 * one, be sure to make a corresponding change in the other.
                 */
                            /* "<name> the <rank-title>", skip past "<name> the " */
                            /* already found best fit, skip "noneoftheabove" */
                            rule = hl;
                            min_ival = max_ival = hl.value.a_int;
                            exactmatch = perc_or_abs = (1);
                        } else if (exactmatch) {
                            ;
                        } else if (hl.rel == LT_VALUE && (value.a_int < hl.value.a_int) && (hl.value.a_int <= min_ival)) {
                            rule = hl;
                            min_ival = hl.value.a_int;
                            perc_or_abs = (1);
                        } else if (hl.rel == LE_VALUE && (value.a_int <= hl.value.a_int) && (hl.value.a_int <= min_ival)) {
                            rule = hl;
                            min_ival = hl.value.a_int;
                            perc_or_abs = (1);
                        } else if (hl.rel == GT_VALUE && (value.a_int > hl.value.a_int) && (hl.value.a_int >= max_ival)) {
                            rule = hl;
                            max_ival = hl.value.a_int;
                            perc_or_abs = (1);
                        } else if (hl.rel == GE_VALUE && (value.a_int >= hl.value.a_int) && (hl.value.a_int >= max_ival)) {
                            rule = hl;
                            max_ival = hl.value.a_int;
                            perc_or_abs = (1);
                        }
                    } else {
                        if (hl.rel == EQ_VALUE && hl.value.a_long == value.a_long) {
                            rule = hl;
                            min_lval = max_lval = hl.value.a_long;
                            exactmatch = perc_or_abs = (1);
                        } else if (exactmatch) {
                            ;
                        } else if (hl.rel == LT_VALUE && (value.a_long < hl.value.a_long) && (hl.value.a_long <= min_lval)) {
                            rule = hl;
                            min_lval = hl.value.a_long;
                            perc_or_abs = (1);
                        } else if (hl.rel == LE_VALUE && (value.a_long <= hl.value.a_long) && (hl.value.a_long <= min_lval)) {
                            rule = hl;
                            min_lval = hl.value.a_long;
                            perc_or_abs = (1);
                        } else if (hl.rel == GT_VALUE && (value.a_long > hl.value.a_long) && (hl.value.a_long >= max_lval)) {
                            rule = hl;
                            max_lval = hl.value.a_long;
                            perc_or_abs = (1);
                        } else if (hl.rel == GE_VALUE && (value.a_long >= hl.value.a_long) && (hl.value.a_long >= max_lval)) {
                            rule = hl;
                            max_lval = hl.value.a_long;
                            perc_or_abs = (1);
                        }
                    }
                    break;
                case 104:
                    txtstr = game.blstats[idx][fldidx].val;
                    if (fldidx == BL_TITLE) {
                        txtstr = __nh_advance_str(txtstr, strlen(game.plname) + 6 /* sizeof(char [6]) */ - 1 /* sizeof(char [1]) */);
                    }
                    if (hl.rel == TXT_VALUE && hl.textmatch[0]) {
                        if (fuzzymatch(hl.textmatch, txtstr, "\" -_", (1))) {
                            rule = hl;
                            exactmatch = (1);
                        } else if (exactmatch) {
                            ;
                        } else if (fldidx == BL_TITLE && (game.u.umonnum != game.u.umonster) && noneoftheabove(hl.textmatch)) {
                            rule = hl;
                        }
                    }
                    break;
                case 105:
                    rule = hl;
                    break;
                case 106:
                    if (fldidx == BL_HP && critically_low_hp((0))) {
                        rule = hl;
                        crit_hp = (1);
                        updown = changed = perc_or_abs = (0);
                    }
                    break;
                case 0:
                    break;
                default:
                    break;
            }
        }
    }
    colorptr.value = rule ? rule.coloridx : 8;
    return rule;
}
export function split_clridx(idx, coloridx, attrib) {
    if (coloridx) {
        coloridx.value = idx & 255;
    }
    if (attrib) {
        attrib.value = (idx >> 8) & 255;
    }
}
/*
 * This is the parser for the hilite options.
 *
 * parse_status_hl1() separates each hilite entry into
 * a set of field threshold/action component strings,
 * then calls parse_status_hl2() to parse further
 * and configure the hilite.
 */
export function parse_status_hl1(op, from_configfile) {
    let hsbuf = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
    let rslt = 0;
    let badopt = (0);
    let i = 0;
    let fldnum = 0;
    let ccount = 0;
    let c = 0;
    fldnum = 0;
    for (i = 0; i < 21; ++i) {
        hsbuf[i][0] = 0;
    }
    while (__nh_char_at0(op) && fldnum < 21 && ccount < (128 - 2)) {
        c = lowc(__nh_char_at0(op));
        if (c == 32) {
            if (fldnum >= 1) {
                if (fldnum == 1 && strncmpi((hsbuf[0]), ("title"), -1) == 0) {
                    /* spaces are allowed in title */
                    hsbuf[fldnum][ccount++] = c;
                    hsbuf[fldnum][ccount] = 0;
                    (op = __nh_advance_str(op, 1));
                    continue;
                }
                rslt = parse_status_hl2(hsbuf, from_configfile);
                if (!rslt) {
                    badopt = (1);
                    break;
                }
            }
            for (i = 0; i < 21; ++i) {
                hsbuf[i][0] = 0;
            }
            fldnum = 0;
            ccount = 0;
        } else if (c == 47) {
            fldnum++;
            ccount = 0;
        } else {
            hsbuf[fldnum][ccount++] = c;
            hsbuf[fldnum][ccount] = 0;
        }
        (op = __nh_advance_str(op, 1));
    }
    if (fldnum >= 1 && !badopt) {
        rslt = parse_status_hl2(hsbuf, from_configfile);
        if (!rslt) {
            badopt = (1);
        }
    }
    if (badopt) {
        return (0);
    }
    /* make sure highlighting is On; use short duration for temp highlights */
    if (!game.iflags.hilite_delta) {
        game.iflags.hilite_delta = 3;
    }
    return (1);
}
/* is str in the format of "[<>]?=?[-+]?[0-9]+%?" regex */
export function is_ltgt_percentnumber(str) {
    let __nh_s_idx = 0;
    if (__nh_char_at0(__nh_advance_str(str, __nh_s_idx)) == 60 || __nh_char_at0(__nh_advance_str(str, __nh_s_idx)) == 62) {
        __nh_s_idx++;
    }
    if (__nh_char_at0(__nh_advance_str(str, __nh_s_idx)) == 61) {
        __nh_s_idx++;
    }
    if (__nh_char_at0(__nh_advance_str(str, __nh_s_idx)) == 45 || __nh_char_at0(__nh_advance_str(str, __nh_s_idx)) == 43) {
        __nh_s_idx++;
    }
    if (!digit(__nh_char_at0(__nh_advance_str(str, __nh_s_idx)))) {
        return (0);
    }
    while (digit(__nh_char_at0(__nh_advance_str(str, __nh_s_idx)))) {
        __nh_s_idx++;
    }
    if (__nh_char_at0(__nh_advance_str(str, __nh_s_idx)) == 37) {
        __nh_s_idx++;
    }
    return (__nh_char_at0(__nh_advance_str(str, __nh_s_idx)) == 0);
}
/* does str only contain "<>=-+0-9%" chars */
export function has_ltgt_percentnumber(str) {
    let __nh_s_idx = 0;
    while (__nh_char_at0(__nh_advance_str(str, __nh_s_idx))) {
        if (!strchr("<>=-+0123456789%", __nh_char_at0(__nh_advance_str(str, __nh_s_idx)))) {
            return (0);
        }
        __nh_s_idx++;
    }
    return (1);
}
/* splitsubfields(): splits str in place into '+' or '&' separated strings.
   returns number of strings, or -1 if more than maxsf or MAX_SUBFIELDS */
let __splitsubfields_subfields = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
__nh_register_static(() => { __splitsubfields_subfields = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]; });
export function splitsubfields(str, sfarr, maxsf) {
    let __nh_sfarr_idx = 0;
    let st = null;
    let sf = 0;
    if (!str) {
        return 0;
    }
    for (sf = 0; sf < 16; ++sf) {
        __splitsubfields_subfields[sf] = null;
    }
    maxsf = (maxsf == 0) ? 16 : ((maxsf) < (16) ? (maxsf) : (16));
    if (strchr(str, 43) || strchr(str, 38)) {
        let c = str;
        sf = 0;
        st = c;
        while (c.value && sf < maxsf) {
            if (c.value == 38 || c.value == 43) {
                c.value = 0;
                __splitsubfields_subfields[sf] = st;
                st = __nh_advance_str(c, 1);
                sf++;
            }
            (c = __nh_advance_str(c, 1));
        }
        if (sf >= maxsf - 1) {
            return -1;
        }
        if (!c.value && c != st) {
            __splitsubfields_subfields[sf++] = st;
        }
    } else {
        sf = 1;
        __splitsubfields_subfields[0] = str;
    }
    sfarr.value = __splitsubfields_subfields;
    return sf;
}
export function is_fld_arrayvalues(str, arr, arrmin, arrmax, retidx) {
    let i = 0;
    for (i = arrmin; i < arrmax; i++) {
        if (!strncmpi((str), (arr[i]), -1)) {
            retidx.value = i;
            return (1);
        }
    }
    return (0);
}
export async function query_arrayvalue(querystr, arr, arrmin, arrmax) {
    let i = 0;
    let res = 0;
    let ret = arrmin - 1;
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let picks = null;
    let adj = (arrmin > 0) ? 1 : arrmax;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    for (i = arrmin; i < arrmax; i++) {
        /* the array of hunger status values has a gap ...*/
        if (!arr[i]) {
            continue;
        }
        Object.assign(any, cg.zeroany);
        any.a_int = i + adj;
        await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, arr[i], 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, querystr);
    res = await select_menu(tmpwin, 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (res > 0) {
        ret = picks.item.a_int - adj;
        free(picks);
    }
    return ret;
}
export function status_hilite_add_threshold(fld, hilite) {
    let new_hilite = null;
    let old_hilite = null;
    if (!hilite) {
        return;
    }
    /* alloc and initialize a new hilite_s struct */
    new_hilite = alloc(1 /* sizeof(struct hilite_s) */);
    Object.assign(new_hilite, hilite);
    new_hilite.set = (1);
    new_hilite.fld = fld;
    new_hilite.next = null;
    if (!game.blstats[0][fld].thresholds) {
        /* insert new entry at the end of the list */
        game.blstats[0][fld].thresholds = new_hilite;
    } else {
        for (old_hilite = game.blstats[0][fld].thresholds; old_hilite.next; old_hilite = old_hilite.next) {
            continue;
        }
        old_hilite.next = new_hilite;
    }
    /* current and prev must both point at the same hilites */
    game.blstats[1][fld].thresholds = game.blstats[0][fld].thresholds;
}
const __parse_status_hl2_aligntxt = ["chaotic", "neutral", "lawful"];
const __parse_status_hl2_hutxt = ["Satiated", "", "Hungry", "Weak", "Fainting", "Fainted", "Starved"];
export function parse_status_hl2(s, from_configfile) {
    /* hu_stat[] from eat.c has trailing spaces which foul up comparisons;
       for the "not hungry" case, there's no text hence no way to highlight */
    let tmp = null;
    let how = null;
    let sidx = 0;
    let i = -1;
    let dt = ANY_INVALID;
    let coloridx = -1;
    let successes = 0;
    let disp_attrib = 0;
    let percent = 0;
    let changed = 0;
    let numeric = 0;
    let down = 0;
    let up = 0;
    let grt = 0;
    let lt = 0;
    let gte = 0;
    let le = 0;
    let eq = 0;
    let txtval = 0;
    let always = 0;
    let criticalhp = 0;
    let txt = null;
    let fld = BL_FLUSH;
    let hilite = { fld: 0, set: 0, anytype: 0, value: { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, behavior: 0, textmatch: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], rel: 0, coloridx: 0, next: null };
    let tmpbuf = '';
    /* Examples:
        3.6.1:
      OPTION=hilite_status: hitpoints/<10%/red
      OPTION=hilite_status: hitpoints/<10%/red/<5%/purple/1/red&blink+inverse
      OPTION=hilite_status: experience/down/red/up/green
      OPTION=hilite_status: cap/strained/yellow/overtaxed/orange
      OPTION=hilite_status: title/always/blue
      OPTION=hilite_status: title/blue
    */
    /* field name to statusfield */
    fld = fldname_to_bl_indx(s[sidx]);
    if (fld == BL_CHARACTERISTICS) {
        let res = (0);
        for (fld = BL_STR; fld <= BL_CH; fld++) {
            s[sidx] = strcpy(s[sidx], game.initblstats[fld].fldname);
            /* recursively set each of strength, dexterity, constitution, &c */
            res = parse_status_hl2(s, from_configfile);
            if (!res) {
                return (0);
            }
        }
        return (1);
    }
    if (fld == BL_FLUSH) {
        config_error_add("Unknown status field '%s'", s[sidx]);
        return (0);
    }
    if (fld == BL_CONDITION) {
        return parse_condition(s, sidx);
    }
    ++sidx;
    while (s[sidx][0]) {
        let buf = '';
        let subfields = null;
        let sf = 0;
        let kidx = 0;
        txt = null;
        percent = numeric = always = (0);
        down = up = changed = (0);
        criticalhp = (0);
        grt = gte = eq = le = lt = txtval = (0);
        /* threshold value - return on empty string */
        memset(hilite, 0, 1 /* sizeof(struct hilite_s) */);
        hilite.set = (0);
        hilite.fld = fld;
        if (s[sidx + 1] == 0 || !strncmpi((s[sidx]), ("always"), -1)) {
            /* "field/always/color" OR "field/color" */
            always = (1);
            if (s[sidx + 1] == 0) {
                sidx--;
            }
        } else if (!strncmpi((s[sidx]), ("up"), -1) || !strncmpi((s[sidx]), ("down"), -1)) {
            if (game.initblstats[fld].anytype == ANY_STR) {
                ;
            } else if (!strncmpi((s[sidx]), ("down"), -1)) {
                down = (1);
            /* ordered string comparison is supported but LT/GT for
                   the string fields (title, dungeon-level, alignment)
                   is pointless; treat 'up' or 'down' for string fields
                   as 'changed' rather than rejecting them outright */
            } else {
                up = (1);
            }
            changed = (1);
        } else if (fld == BL_CAP && is_fld_arrayvalues(s[sidx], enc_stat, SLT_ENCUMBER, OVERLOADED + 1, { get value() { return kidx; }, set value(_v) { kidx = _v; } })) {
            txt = enc_stat[kidx];
            txtval = (1);
        } else if (fld == BL_ALIGN && is_fld_arrayvalues(s[sidx], __parse_status_hl2_aligntxt, 0, 3, { get value() { return kidx; }, set value(_v) { kidx = _v; } })) {
            txt = __parse_status_hl2_aligntxt[kidx];
            txtval = (1);
        } else if (fld == BL_HUNGER && is_fld_arrayvalues(s[sidx], __parse_status_hl2_hutxt, SATIATED, STARVED + 1, { get value() { return kidx; }, set value(_v) { kidx = _v; } })) {
            /* store hu_stat[] val, not hutxt[] */
            txt = hu_stat[kidx];
            txtval = (1);
        } else if (!strncmpi((s[sidx]), ("changed"), -1)) {
            changed = (1);
        } else if (fld == BL_HP && !strncmpi((s[sidx]), ("criticalhp"), -1)) {
            criticalhp = (1);
        } else if (is_ltgt_percentnumber(s[sidx])) {
            let op = null;
            /* is_ltgt_() guarantees [<>]?=?[-+]?[0-9]+%? */
            tmp = s[sidx];
            if (strchr(tmp, 37)) {
                percent = (1);
            }
            if (__nh_char_at0(tmp) == 60) {
                if (__nh_char_at0(__nh_advance_str(tmp, 1)) == 61) {
                    le = (1);
                } else {
                    lt = (1);
                }
            } else if (__nh_char_at0(tmp) == 62) {
                if (__nh_char_at0(__nh_advance_str(tmp, 1)) == 61) {
                    gte = (1);
                } else {
                    grt = (1);
                }
            }
            /* '%', '<', '>' have served their purpose, '=' is either
               part of '<' or '>' or optional for '=N', unary '+' is
               just decorative, so get rid of them, leaving -?[0-9]+ */
            tmp = stripchars(tmpbuf, "%<>=+", tmp);
            numeric = (1);
            dt = percent ? ANY_INT : game.initblstats[fld].anytype;
            s_to_anything(hilite.value, tmp, dt);
            op = grt ? ">" : gte ? ">=" : lt ? "<" : le ? "<=" : "=";
            if (dt == ANY_INT && (hilite.value.a_int < ((fld == BL_AC) ? -128 : grt ? -1 : lt ? 1 : 0) || hilite.value.a_int > (percent ? (lt ? 101 : 100) : 32767))) {
                /* AC is the only field where negative values make sense but
                   accept >-1 for other fields; reject <0 for non-AC */
                /* percentages have another more comprehensive check below */
                config_error_add("%s'%s%d%s'%s", threshold_value, op, hilite.value.a_int, percent ? "%" : "", is_out_of_range);
                return (0);
            } else if (dt == ANY_LONG && hilite.value.a_long < (grt ? -1 : lt ? 1 : 0)) {
                config_error_add("%s'%s%ld'%s", threshold_value, op, hilite.value.a_long, is_out_of_range);
                return (0);
            }
        } else if (game.initblstats[fld].anytype == ANY_STR) {
            txt = s[sidx];
            txtval = (1);
        } else {
            config_error_add(has_ltgt_percentnumber(s[sidx]) ? "Wrong format '%s', expected a threshold number or percent" : "Unknown behavior '%s'", s[sidx]);
            return (0);
        }
        if (grt || up) {
            hilite.rel = GT_VALUE;
        /* relationships {LT_VALUE, LE_VALUE, EQ_VALUE, GE_VALUE, GT_VALUE} */
        } else if (lt || down) {
            hilite.rel = LT_VALUE;
        } else if (gte) {
            hilite.rel = GE_VALUE;
        } else if (le) {
            hilite.rel = LE_VALUE;
        } else if (eq || percent || numeric || changed) {
            hilite.rel = EQ_VALUE;
        } else if (txtval) {
            hilite.rel = TXT_VALUE;
        } else {
            hilite.rel = LT_VALUE;
        }
        if (game.initblstats[fld].anytype == ANY_STR && (percent || numeric)) {
            config_error_add("Field '%s' does not support numeric values", game.initblstats[fld].fldname);
            return (0);
        }
        if (percent) {
            if (game.initblstats[fld].idxmax < 0) {
                config_error_add("Cannot use percent with '%s'", game.initblstats[fld].fldname);
                return (0);
            } else if ((hilite.value.a_int < -1) || (hilite.value.a_int == -1 && hilite.value.a_int != GT_VALUE) || (hilite.value.a_int == 0 && hilite.rel == LT_VALUE) || (hilite.value.a_int == 100 && hilite.rel == GT_VALUE) || (hilite.value.a_int == 101 && hilite.value.a_int != LT_VALUE) || (hilite.value.a_int > 101)) {
                config_error_add("hilite_status: invalid percentage value '%s%d%%'", (hilite.rel == LT_VALUE) ? "<" : (hilite.rel == LE_VALUE) ? "<=" : (hilite.rel == GT_VALUE) ? ">" : (hilite.rel == GE_VALUE) ? ">=" : "=", hilite.value.a_int);
                return (0);
            }
        }
        /*3.6.1:
      OPTION=hilite_status: condition/stone+slime+foodPois/red&inverse */
        /*
     * TODO?
     *  It would be simpler to treat each condition (also hunger state
     *  and encumbrance level) as if it were a separate field.  That
     *  way they could have either or both 'changed' temporary rule and
     *  'always' persistent rule and wouldn't need convoluted access to
     *  the intended color and attributes.
     */
        /*
         * We have the conditions_bitmask with bits set for
         * each ailment we want in a particular color and/or
         * attribute, but we need to assign it to an array of
         * bitmasks indexed by the color chosen
         *        (0 to (CLR_MAX - 1))
         * and/or attributes chosen
         *        (HL_ATTCLR_NONE to (BL_ATTCLR_MAX - 1))
         * We still have to parse the colors and attributes out.
         */
        sidx++;
        how = s[sidx];
        if (!how) {
            if (!successes) {
                return (0);
            }
        }
        coloridx = -1;
        buf = strcpy(buf, how);
        sf = splitsubfields(buf, { get value() { return subfields; }, set value(_v) { subfields = _v; } }, 0);
        if (sf < 1) {
            return (0);
        }
        disp_attrib = HL_UNDEF;
        for (i = 0; i < sf; ++i) {
            /*
         * conditions_bitmask now has bits set representing
         * the conditions that player wants represented, but
         * now we parse out *how* they will be represented.
         *
         * Only 1 colour is allowed, but potentially multiple
         * attributes are allowed.
         *
         * We have the following additional array offsets to
         * use for storing the attributes beyond the end of
         * the color indexes, all of which are less than CLR_MAX.
         *
         */
            let a = match_str2attr(subfields[i], (0));
            if (a == 1) {
                disp_attrib |= HL_BOLD;
            } else if (a == 2) {
                disp_attrib |= HL_DIM;
            } else if (a == 3) {
                disp_attrib |= HL_ITALIC;
            } else if (a == 4) {
                disp_attrib |= HL_ULINE;
            } else if (a == 5) {
                disp_attrib |= HL_BLINK;
            } else if (a == 7) {
                disp_attrib |= HL_INVERSE;
            } else if (a == 0) {
                disp_attrib = HL_NONE;
            } else {
                let c = match_str2clr(subfields[i], (0));
                if (c >= 16 || coloridx != -1) {
                    config_error_add("bad color '%d %d'", c, coloridx);
                    return (0);
                }
                coloridx = c;
            }
        }
        if (coloridx == -1) {
            coloridx = 8;
        }
        hilite.coloridx = coloridx | (disp_attrib << 8);
        if (always) {
            hilite.behavior = 105;
        } else if (percent) {
            hilite.behavior = 100;
        } else if (changed) {
            hilite.behavior = 102;
        } else if (numeric) {
            hilite.behavior = 101;
        } else if (txtval) {
            hilite.behavior = 104;
        } else if (hilite.value.a_void) {
            hilite.behavior = 101;
        } else if (criticalhp) {
            hilite.behavior = 106;
        } else {
            hilite.behavior = 0;
        }
        hilite.anytype = dt;
        if (hilite.behavior == 104 && txt) {
            hilite.textmatch = strncpy(hilite.textmatch, txt, 80 /* sizeof(char [80]) */);
            hilite.textmatch[80 /* sizeof(char [80]) */ - 1] = 0;
            hilite.textmatch = trimspaces(hilite.textmatch);
        }
        status_hilite_add_threshold(fld, hilite);
        successes++;
        sidx++;
    }
    return (successes > 0);
}
export async function query_conditions() {
    let i = 0;
    let res = 0;
    let ret = 0;
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let picks = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    for (i = 0; i < (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)); i++) {
        Object.assign(any, cg.zeroany);
        any.a_ulong = conditions[i].mask;
        await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, conditions[i].text[0], 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Choose status conditions");
    res = await select_menu(tmpwin, 2, picks);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (res > 0) {
        for (i = 0; i < res; i++) {
            ret |= picks[i].item.a_ulong;
        }
        free(picks);
    }
    return ret;
}
let __conditionbitmask2str_buf = '';
__nh_register_static(() => { __conditionbitmask2str_buf = ''; });
export function conditionbitmask2str(ul) {
    let i = 0;
    let first = (1);
    let alias = null;
    __conditionbitmask2str_buf = '';
    if (!ul) {
        return __conditionbitmask2str_buf;
    }
    for (i = 1; i < (Math.trunc(6 /* sizeof(const struct condmap [6]) */ / 1 /* sizeof(const struct condmap) */)); i++) {
        if (condition_aliases[i].bitmask == ul) {
            alias = condition_aliases[i].id;
        }
    }
    for (i = 0; i < (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)); i++) {
        if ((conditions[i].mask & ul) != 0) {
            __conditionbitmask2str_buf = __nh_buf_append(__conditionbitmask2str_buf, sprintf('', "%s%s", (first) ? "" : "+", conditions[i].text[0]));
            first = (0);
        }
    }
    if (!first && alias) {
        __conditionbitmask2str_buf = sprintf(__conditionbitmask2str_buf, "%s", alias);
    }
    return __conditionbitmask2str_buf;
}
export function match_str2conditionbitmask(str) {
    let i = 0;
    let nmatches = 0;
    let mask = 0;
    if (str && __nh_char_at0(str)) {
        for (i = 0; i < (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)); i++) {
            if (fuzzymatch(conditions[i].text[0], str, " -_", (1))) {
                mask |= conditions[i].mask;
                nmatches++;
            }
        }
        if (!nmatches) {
            for (i = 0; i < (Math.trunc(6 /* sizeof(const struct condmap [6]) */ / 1 /* sizeof(const struct condmap) */)); i++) {
                if (fuzzymatch(condition_aliases[i].id, str, " -_", (1))) {
                    mask |= condition_aliases[i].bitmask;
                    nmatches++;
                }
            }
        }
        if (!nmatches) {
            /* check partial matches to aliases */
            let len = strlen(str);
            for (i = 0; i < (Math.trunc(6 /* sizeof(const struct condmap [6]) */ / 1 /* sizeof(const struct condmap) */)); i++) {
                if (!strncmpi(str, condition_aliases[i].id, len)) {
                    mask |= condition_aliases[i].bitmask;
                    nmatches++;
                }
            }
        }
    }
    return mask;
}
export function str2conditionbitmask(str) {
    let conditions_bitmask = 0;
    let subfields = null;
    let i = 0;
    let sf = 0;
    sf = splitsubfields(str, { get value() { return subfields; }, set value(_v) { subfields = _v; } }, (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)));
    if (sf < 1) {
        return 0;
    }
    for (i = 0; i < sf; ++i) {
        let bm = match_str2conditionbitmask(subfields[i]);
        if (!bm) {
            config_error_add("Unknown condition '%s'", subfields[i]);
            return 0;
        }
        conditions_bitmask |= bm;
    }
    return conditions_bitmask;
}
export function parse_condition(s, sidx) {
    let i = 0;
    let coloridx = 8;
    let tmp = null;
    let how = null;
    let conditions_bitmask = 0;
    let result = (0);
    if (!s) {
        return (0);
    }
    sidx++;
    if (!s[sidx][0]) {
        config_error_add("Missing condition(s)");
        return (0);
    }
    while (s[sidx][0]) {
        let sf = 0;
        let buf = '';
        let subfields = null;
        tmp = s[sidx];
        buf = strcpy(buf, tmp);
        conditions_bitmask = str2conditionbitmask(buf);
        if (!conditions_bitmask) {
            return (0);
        }
        sidx++;
        how = s[sidx];
        if (!how || !__nh_char_at0(how)) {
            config_error_add("Missing color+attribute");
            return (0);
        }
        buf = strcpy(buf, how);
        sf = splitsubfields(buf, { get value() { return subfields; }, set value(_v) { subfields = _v; } }, 0);
        for (i = 0; i < sf; ++i) {
            let a = match_str2attr(subfields[i], (0));
            if (a == 1) {
                game.cond_hilites[16 + 2] |= conditions_bitmask;
            } else if (a == 2) {
                game.cond_hilites[16 + 3] |= conditions_bitmask;
            } else if (a == 3) {
                game.cond_hilites[16 + 4] |= conditions_bitmask;
            } else if (a == 4) {
                game.cond_hilites[16 + 5] |= conditions_bitmask;
            } else if (a == 5) {
                game.cond_hilites[16 + 6] |= conditions_bitmask;
            } else if (a == 7) {
                game.cond_hilites[16 + 7] |= conditions_bitmask;
            } else if (a == 0) {
                game.cond_hilites[16 + 2] &= ~conditions_bitmask;
                game.cond_hilites[16 + 3] &= ~conditions_bitmask;
                game.cond_hilites[16 + 4] &= ~conditions_bitmask;
                game.cond_hilites[16 + 5] &= ~conditions_bitmask;
                game.cond_hilites[16 + 6] &= ~conditions_bitmask;
                game.cond_hilites[16 + 7] &= ~conditions_bitmask;
            } else {
                let k = match_str2clr(subfields[i], (0));
                if (k >= 16) {
                    config_error_add("bad color %d", k);
                    return (0);
                }
                coloridx = k;
            }
        }
        /* set the bits in the appropriate member of the
           condition array according to color chosen as index */
        game.cond_hilites[coloridx] |= conditions_bitmask;
        result = (1);
        sidx++;
    }
    return result;
}
export function clear_status_hilites() {
    let i = 0;
    for (i = 0; i < MAXBLSTATS; ++i) {
        let temp = null;
        let next = null;
        for (temp = game.blstats[0][i].thresholds; temp; temp = next) {
            next = temp.next;
            free(temp);
        }
        game.blstats[0][i].thresholds = game.blstats[1][i].thresholds = null;
        game.blstats[0][i].hilite_rule = game.blstats[1][i].hilite_rule = null;
    }
}
export function hlattr2attrname(attrib, buf, bufsz) {
    if (attrib && buf) {
        let attbuf = '';
        let first = 0;
        let k = 0;
        attbuf = '';
        if (attrib == HL_NONE) {
            buf = strcpy(buf, "normal");
            return buf;
        }
        if (attrib & HL_BOLD) {
            attbuf = strcat(attbuf, first++ ? "+bold" : "bold");
        }
        if (attrib & HL_DIM) {
            attbuf = strcat(attbuf, first++ ? "+dim" : "dim");
        }
        if (attrib & HL_ITALIC) {
            attbuf = strcat(attbuf, first++ ? "+italic" : "italic");
        }
        if (attrib & HL_ULINE) {
            attbuf = strcat(attbuf, first++ ? "+underline" : "underline");
        }
        if (attrib & HL_BLINK) {
            attbuf = strcat(attbuf, first++ ? "+blink" : "blink");
        }
        if (attrib & HL_INVERSE) {
            attbuf = strcat(attbuf, first++ ? "+inverse" : "inverse");
        }
        k = strlen(attbuf);
        if (k < (bufsz - 1)) {
            buf = strcpy(buf, attbuf);
        }
        return buf;
    }
    return null;
}
// struct _status_hilite_line_str: { id, fld, hl, mask, str, next }
/* these don't need to be in 'struct g' */
game.status_hilite_str = null;
game.status_hilite_str_id = 0;
export function status_hilite_linestr_add(fld, hl, mask, str) {
    let tmp = null;
    let nxt = null;
    tmp = alloc(1 /* sizeof(struct _status_hilite_line_str) */);
    memset(tmp, 0, 1 /* sizeof(struct _status_hilite_line_str) */);
    tmp.next = null;
    tmp.id = ++game.status_hilite_str_id;
    tmp.fld = fld;
    tmp.hl = hl;
    tmp.mask = mask;
    if (fld == BL_TITLE) {
        tmp.str = strcpy(tmp.str, str);
    } else {
        tmp.str = stripchars(tmp.str, " ", str);
    }
    if ((nxt = game.status_hilite_str) != null) {
        while (nxt.next) {
            nxt = nxt.next;
        }
        nxt.next = tmp;
    } else {
        game.status_hilite_str = tmp;
    }
}
export function status_hilite_linestr_done() {
    let nxt = null;
    let tmp = game.status_hilite_str;
    while (tmp) {
        nxt = tmp.next;
        free(tmp);
        tmp = nxt;
    }
    game.status_hilite_str = null;
    game.status_hilite_str_id = 0;
}
export function status_hilite_linestr_countfield(fld) {
    let tmp = null;
    let countall = (fld == BL_FLUSH);
    let count = 0;
    for (tmp = game.status_hilite_str; tmp; tmp = tmp.next) {
        if (countall || tmp.fld == fld) {
            count++;
        }
    }
    return count;
}
/* used by options handling, doset(options.c) */
export async function count_status_hilites() {
    let count = 0;
    await status_hilite_linestr_gather();
    count = status_hilite_linestr_countfield(BL_FLUSH);
    status_hilite_linestr_done();
    return count;
}
export function status_hilite_linestr_gather_conditions() {
    let i = 0;
    let cond_maps = [{ bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }, { bm: 0, clratr: 0 }];
    memset(cond_maps, 0, (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)) * 1 /* sizeof(struct _cond_map) */);
    for (i = 0; i < (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)); i++) {
        let clr = 8;
        let atr = HL_NONE;
        let j = 0;
        for (j = 0; j < 16; j++) {
            if (game.cond_hilites[j] & conditions[i].mask) {
                clr = j;
                break;
            }
        }
        if (game.cond_hilites[16 + 2] & conditions[i].mask) {
            atr |= HL_BOLD;
        }
        if (game.cond_hilites[16 + 3] & conditions[i].mask) {
            atr |= HL_DIM;
        }
        if (game.cond_hilites[16 + 4] & conditions[i].mask) {
            atr |= HL_ITALIC;
        }
        if (game.cond_hilites[16 + 5] & conditions[i].mask) {
            atr |= HL_ULINE;
        }
        if (game.cond_hilites[16 + 6] & conditions[i].mask) {
            atr |= HL_BLINK;
        }
        if (game.cond_hilites[16 + 7] & conditions[i].mask) {
            atr |= HL_INVERSE;
        }
        if (atr != HL_NONE) {
            atr &= ~HL_NONE;
        }
        if (clr != 8 || atr != HL_NONE) {
            let ca = clr | (atr << 8);
            let added_condmap = (0);
            for (j = 0; j < (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)); j++) {
                if (cond_maps[j].clratr == ca) {
                    cond_maps[j].bm |= conditions[i].mask;
                    added_condmap = (1);
                    break;
                }
            }
            if (!added_condmap) {
                for (j = 0; j < (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)); j++) {
                    if (!cond_maps[j].bm) {
                        cond_maps[j].bm = conditions[i].mask;
                        cond_maps[j].clratr = ca;
                        break;
                    }
                }
            }
        }
    }
    for (i = 0; i < (Math.trunc(30 /* sizeof(const struct conditions_t [30]) */ / 1 /* sizeof(const struct conditions_t) */)); i++) {
        if (cond_maps[i].bm) {
            let clr = 8;
            let atr = HL_NONE;
            split_clridx(cond_maps[i].clratr, { get value() { return clr; }, set value(_v) { clr = _v; } }, { get value() { return atr; }, set value(_v) { atr = _v; } });
            if (clr != 8 || atr != HL_NONE) {
                let clrbuf = '';
                let attrbuf = '';
                let condbuf = '';
                let tmpattr = null;
                strNsubst(strcpy(clrbuf, clr2colorname(clr)), " ", "-", 0);
                tmpattr = hlattr2attrname(atr, attrbuf, 256);
                if (tmpattr) {
                    clrbuf = __nh_buf_append(clrbuf, sprintf('', "&%s", tmpattr));
                }
                condbuf = nh_snprintf("status_hilite_linestr_gather_conditions", 3562, condbuf, 256 /* sizeof(char [256]) */, "condition/%s/%s", conditionbitmask2str(cond_maps[i].bm), clrbuf);
                status_hilite_linestr_add(BL_CONDITION, null, cond_maps[i].bm, condbuf);
            }
        }
    }
}
export async function status_hilite_linestr_gather() {
    let i = 0;
    let hl = null;
    status_hilite_linestr_done();
    for (i = 0; i < MAXBLSTATS; i++) {
        hl = game.blstats[0][i].thresholds;
        while (hl) {
            status_hilite_linestr_add(i, hl, 0, await status_hilite2str(hl));
            hl = hl.next;
        }
    }
    status_hilite_linestr_gather_conditions();
}
let __status_hilite2str_buf = '';
__nh_register_static(() => { __status_hilite2str_buf = ''; });
export async function status_hilite2str(hl) {
    let clr = 8;
    let attr = 0;
    let behavebuf = '';
    let clrbuf = '';
    let attrbuf = '';
    let tmpattr = null;
    let op = null;
    if (!hl) {
        return null;
    }
    behavebuf = '';
    clrbuf = '';
    op = (hl.rel == LT_VALUE) ? "<" : (hl.rel == LE_VALUE) ? "<=" : (hl.rel == GT_VALUE) ? ">" : (hl.rel == GE_VALUE) ? ">=" : (hl.rel == EQ_VALUE) ? "=" : null;
    switch (hl.behavior) {
        case 100:
            if (op) {
                behavebuf = sprintf(behavebuf, "%s%d%%", op, hl.value.a_int);
            } else {
                await impossible("hl->behavior=percentage, rel error");
            }
            break;
        case 102:
            if (hl.rel == LT_VALUE) {
                behavebuf = sprintf(behavebuf, "down");
            } else if (hl.rel == GT_VALUE) {
                behavebuf = sprintf(behavebuf, "up");
            } else if (hl.rel == EQ_VALUE) {
                behavebuf = sprintf(behavebuf, "changed");
            } else {
                await impossible("hl->behavior=updown, rel error");
            }
            break;
        case 101:
            if (op) {
                behavebuf = sprintf(behavebuf, "%s%d", op, hl.value.a_int);
            } else {
                await impossible("hl->behavior=absolute, rel error");
            }
            break;
        case 104:
            if (hl.rel == TXT_VALUE && hl.textmatch[0]) {
                behavebuf = sprintf(behavebuf, "%s", hl.textmatch);
            } else {
                await impossible("hl->behavior=textmatch, rel or textmatch error");
            }
            break;
        case 103:
            if (hl.rel == EQ_VALUE) {
                behavebuf = sprintf(behavebuf, "%s", conditionbitmask2str(hl.value.a_ulong));
            } else {
                await impossible("hl->behavior=condition, rel error");
            }
            break;
        case 105:
            behavebuf = sprintf(behavebuf, "always");
            break;
        case 106:
            behavebuf = sprintf(behavebuf, "criticalhp");
            break;
        case 0:
            break;
        default:
            break;
    }
    split_clridx(hl.coloridx, { get value() { return clr; }, set value(_v) { clr = _v; } }, { get value() { return attr; }, set value(_v) { attr = _v; } });
    strNsubst(strcpy(clrbuf, clr2colorname(clr)), " ", "-", 0);
    if (attr != HL_UNDEF) {
        if ((tmpattr = hlattr2attrname(attr, attrbuf, 256)) != null) {
            clrbuf = __nh_buf_append(clrbuf, sprintf('', "&%s", tmpattr));
        }
    }
    __status_hilite2str_buf = nh_snprintf("status_hilite2str", 3666, __status_hilite2str_buf, 256 /* sizeof(char [256]) */, "%s/%s/%s", game.initblstats[hl.fld].fldname, behavebuf, clrbuf);
    return __status_hilite2str_buf;
}
export async function status_hilite_menu_choose_field() {
    let tmpwin = 0;
    let i = 0;
    let res = 0;
    let fld = BL_FLUSH;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let picks = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    for (i = 0; i < MAXBLSTATS; i++) {
        if (game.initblstats[i].fld == BL_SCORE && !game.blstats[0][BL_SCORE].thresholds) {
            continue;
        }
        Object.assign(any, cg.zeroany);
        any.a_int = (i + 1);
        await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, game.initblstats[i].fldname, 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Select a hilite field:");
    res = await select_menu(tmpwin, 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (res > 0) {
        fld = picks.item.a_int - 1;
        free(picks);
    }
    return fld;
}
export async function status_hilite_menu_choose_behavior(fld) {
    let tmpwin = 0;
    let res = 0;
    let beh = 0 - 1;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let picks = null;
    let buf = '';
    let at = 0;
    let onlybeh = 0;
    let nopts = 0;
    let clr = 8;
    if (fld < 0 || fld >= MAXBLSTATS) {
        return 0;
    }
    at = game.initblstats[fld].anytype;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    if (fld != BL_CONDITION) {
        Object.assign(any, cg.zeroany);
        any.a_int = onlybeh = 105;
        buf = sprintf(buf, "Always highlight %s", game.initblstats[fld].fldname);
        await add_menu(tmpwin, nul_glyphinfo, any, 97, 0, 0, clr, buf, 0);
        nopts++;
    }
    if (fld == BL_CONDITION) {
        Object.assign(any, cg.zeroany);
        any.a_int = onlybeh = 103;
        await add_menu(tmpwin, nul_glyphinfo, any, 98, 0, 0, clr, "Bitmask of conditions", 0);
        nopts++;
    }
    if (fld != BL_CONDITION && fld != BL_VERS) {
        Object.assign(any, cg.zeroany);
        any.a_int = onlybeh = 102;
        buf = sprintf(buf, "%s value changes", game.initblstats[fld].fldname);
        await add_menu(tmpwin, nul_glyphinfo, any, 99, 0, 0, clr, buf, 0);
        nopts++;
    }
    if (fld != BL_CAP && fld != BL_HUNGER && (at == ANY_INT || at == ANY_LONG)) {
        Object.assign(any, cg.zeroany);
        any.a_int = onlybeh = 101;
        await add_menu(tmpwin, nul_glyphinfo, any, 110, 0, 0, clr, "Number threshold", 0);
        nopts++;
    }
    if (game.initblstats[fld].idxmax >= 0) {
        Object.assign(any, cg.zeroany);
        any.a_int = onlybeh = 100;
        await add_menu(tmpwin, nul_glyphinfo, any, 112, 0, 0, clr, "Percentage threshold", 0);
        nopts++;
    }
    if (fld == BL_HP) {
        Object.assign(any, cg.zeroany);
        any.a_int = onlybeh = 106;
        buf = sprintf(buf, "Highlight critically low %s", game.initblstats[fld].fldname);
        await add_menu(tmpwin, nul_glyphinfo, any, 67, 0, 0, clr, buf, 0);
        nopts++;
    }
    if (game.initblstats[fld].anytype == ANY_STR || fld == BL_CAP || fld == BL_HUNGER) {
        Object.assign(any, cg.zeroany);
        any.a_int = onlybeh = 104;
        buf = sprintf(buf, "%s text match", game.initblstats[fld].fldname);
        await add_menu(tmpwin, nul_glyphinfo, any, 116, 0, 0, clr, buf, 0);
        nopts++;
    }
    buf = sprintf(buf, "Select %s field hilite behavior:", game.initblstats[fld].fldname);
    (game.windowprocs.win_end_menu)(tmpwin, buf);
    if (nopts > 1) {
        res = await select_menu(tmpwin, 1, picks);
        if (res == 0) {
            beh = 0;
        } else if (res == -1) {
            beh = (0 - 1);
        }
    } else if (onlybeh != 0) {
        beh = onlybeh;
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (res > 0) {
        beh = picks.item.a_int;
        free(picks);
    }
    return beh;
}
export async function status_hilite_menu_choose_updownboth(fld, str, ltok, gtok) {
    let res = 0;
    let ret = NO_LTEQGT;
    let tmpwin = 0;
    let buf = '';
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let picks = null;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    if (ltok) {
        if (str) {
            buf = sprintf(buf, "%s than %s", (fld == BL_AC) ? "Better (lower)" : "Less", str);
        } else {
            buf = sprintf(buf, "Value goes down");
        }
        Object.assign(any, cg.zeroany);
        any.a_int = 10 + LT_VALUE;
        await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        if (str) {
            buf = sprintf(buf, "%s or %s", str, (fld == BL_AC) ? "better (lower)" : "less");
            Object.assign(any, cg.zeroany);
            any.a_int = 10 + LE_VALUE;
            await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        }
    }
    if (str) {
        buf = sprintf(buf, "Exactly %s", str);
    } else {
        buf = sprintf(buf, "Value changes");
    }
    Object.assign(any, cg.zeroany);
    any.a_int = 10 + EQ_VALUE;
    await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
    if (gtok) {
        if (str) {
            buf = sprintf(buf, "%s or %s", str, (fld == BL_AC) ? "worse (higher)" : "more");
            Object.assign(any, cg.zeroany);
            any.a_int = 10 + GE_VALUE;
            await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        }
        if (str) {
            buf = sprintf(buf, "%s than %s", (fld == BL_AC) ? "Worse (higher)" : "More", str);
        } else {
            buf = sprintf(buf, "Value goes up");
        }
        Object.assign(any, cg.zeroany);
        any.a_int = 10 + GT_VALUE;
        await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
    }
    buf = sprintf(buf, "Select field %s value:", game.initblstats[fld].fldname);
    (game.windowprocs.win_end_menu)(tmpwin, buf);
    res = await select_menu(tmpwin, 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (res > 0) {
        ret = picks.item.a_int - 10;
        free(picks);
    }
    return ret;
}
const __status_hilite_menu_add_aligntxt = ["chaotic", "neutral", "lawful"];
const __status_hilite_menu_add_hutxt = ["Satiated", null, "Hungry", "Weak", "Fainting", "Fainted", "Starved"];
export async function status_hilite_menu_add(origfld) {
    let fld = 0;
    let behavior = 0;
    let lt_gt_eq = 0;
    let clr = 8;
    let atr = HL_UNDEF;
    let hilite = { fld: 0, set: 0, anytype: 0, value: { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 }, behavior: 0, textmatch: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], rel: 0, coloridx: 0, next: null };
    let cond = 0;
    let colorqry = '';
    let attrqry = '';
    let retry = 0;
    choose_field: while (true) {
        fld = origfld;
        if (fld == BL_FLUSH) {
            fld = await status_hilite_menu_choose_field();
            /* isn't this redundant given what follows? */
            if (fld == BL_FLUSH) {
                return (0);
            }
        }
        if (fld == BL_FLUSH) {
            return (0);
        }
        colorqry = '';
        attrqry = '';
        memset(hilite, 0, 1 /* sizeof(struct hilite_s) */);
        hilite.next = null;
        hilite.set = (0);
        hilite.fld = fld;
        choose_behavior: while (true) {
            behavior = await status_hilite_menu_choose_behavior(fld);
            if (behavior == (0 - 1)) {
                return (0);
            } else if (behavior == 0) {
                if (origfld == BL_FLUSH) {
                    continue choose_field;
                }
                return (0);
            }
            hilite.behavior = behavior;
            choose_value: while (true) {
                if (retry++ > 5) {
                    await pline("That's enough tries.");
                    return (0);
                }
                if (behavior == 100 || behavior == 101) {
                    let inbuf = '';
                    let buf = '';
                    let aval = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
                    let val = 0;
                    let dt = 0;
                    let gotnum = (0);
                    let percent = (behavior == 100);
                    let inp = null;
                    let numstart = null;
                    let op = null;
                    lt_gt_eq = NO_LTEQGT;
                    inbuf = '';
                    buf = sprintf(buf, "Enter %svalue for %s threshold:", percent ? "percentage " : "", game.initblstats[fld].fldname);
                    inbuf = await getlin(buf, inbuf);
                    if (__nh_char_at0(inbuf) == 0 || __nh_char_at0(inbuf) == 27) {
                        continue choose_behavior;
                    }
                    inp = numstart = trimspaces(inbuf);
                    if (!__nh_char_at0(inp)) {
                        continue choose_behavior;
                    }
                    if (__nh_char_at0(inp) == 62 || __nh_char_at0(inp) == 60 || __nh_char_at0(inp) == 61) {
                        /* allow user to enter "<50%" or ">50" or just "50"
           or <=50% or >=50 or =50 */
                        lt_gt_eq = (__nh_char_at0(inp) == 62) ? ((__nh_char_at0(__nh_advance_str(inp, 1)) == 61) ? GE_VALUE : GT_VALUE) : (__nh_char_at0(inp) == 60) ? ((__nh_char_at0(__nh_advance_str(inp, 1)) == 61) ? LE_VALUE : LT_VALUE) : EQ_VALUE;
                        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
                        (numstart = __nh_advance_str(numstart, 1));
                        if (lt_gt_eq == GE_VALUE || lt_gt_eq == LE_VALUE) {
                            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
                            (numstart = __nh_advance_str(numstart, 1));
                        }
                    }
                    if (__nh_char_at0(inp) == 45) {
                        (inp = __nh_advance_str(inp, 1));
                    } else if (__nh_char_at0(inp) == 43) {
                        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32) */;
                        (numstart = __nh_advance_str(numstart, 1));
                    }
                    while (digit(__nh_char_at0(inp))) {
                        (inp = __nh_advance_str(inp, 1));
                        gotnum = (1);
                    }
                    if (__nh_char_at0(inp) == 37) {
                        if (!percent) {
                            await pline("Not expecting a percentage.");
                            continue choose_behavior;
                        }
                        /* strip '%' [this accepts trailing junk!] */
                        inp = __nh_char_write(inp, 0, 0);
                    } else if (__nh_char_at0(inp)) {
                        await pline("\"%s\" is not a recognized number.", inp);
                        continue choose_value;
                    }
                    if (!gotnum) {
                        await pline("Is that an invisible number?");
                        continue choose_value;
                    }
                    op = (lt_gt_eq == LT_VALUE) ? "<" : (lt_gt_eq == LE_VALUE) ? "<=" : (lt_gt_eq == GT_VALUE) ? ">" : (lt_gt_eq == GE_VALUE) ? ">=" : (lt_gt_eq == EQ_VALUE) ? "=" : "";
                    /* didn't specify lt_gt_eq with number */
                    Object.assign(aval, cg.zeroany);
                    dt = percent ? ANY_INT : game.initblstats[fld].anytype;
                    s_to_anything(aval, numstart, dt);
                    if (percent) {
                        val = aval.a_int;
                        if (game.initblstats[fld].idxmax == -1) {
                            await pline("Field '%s' does not support percentage values.", game.initblstats[fld].fldname);
                            behavior = 101;
                            continue choose_value;
                        }
                        if ((val < 0 && (val != -1 || lt_gt_eq != GT_VALUE)) || (val == 0 && lt_gt_eq == LT_VALUE) || (val == 100 && lt_gt_eq == GT_VALUE) || (val > 100 && (val != 101 || lt_gt_eq != LT_VALUE))) {
                            await pline("'%s%d%%' is not a valid percent value.", op, val);
                            continue choose_value;
                        }
                        /* restore suffix for use in color and attribute prompts */
                        /* reject negative values except for AC and >-1; reject 0 for < */
                        if (!strchr(numstart, 37)) {
                            numstart = strcat(numstart, "%");
                        }
                    } else if (dt == ANY_INT && (aval.a_int < ((fld == BL_AC) ? -128 : (lt_gt_eq == GT_VALUE) ? -1 : (lt_gt_eq == LT_VALUE) ? 1 : 0))) {
                        await pline("%s'%s%d'%s", threshold_value, op, aval.a_int, is_out_of_range);
                        continue choose_value;
                    } else if (dt == ANY_LONG && (aval.a_long < ((lt_gt_eq == GT_VALUE) ? -1 : (lt_gt_eq == LT_VALUE) ? 1 : 0))) {
                        await pline("%s'%s%ld'%s", threshold_value, op, aval.a_long, is_out_of_range);
                        continue choose_value;
                    }
                    if (lt_gt_eq == NO_LTEQGT) {
                        let ltok = ((dt == ANY_INT) ? (aval.a_int > 0 || fld == BL_AC) : (aval.a_long > 0));
                        let gtok = (!percent || aval.a_long < 100);
                        lt_gt_eq = await status_hilite_menu_choose_updownboth(fld, inbuf, ltok, gtok);
                        if (lt_gt_eq == NO_LTEQGT) {
                            continue choose_value;
                        }
                    }
                    colorqry = sprintf(colorqry, "Choose a color for when %s is %s%s%s:", game.initblstats[fld].fldname, (lt_gt_eq == LT_VALUE) ? "less than " : (lt_gt_eq == GT_VALUE) ? "more than " : "", numstart, (lt_gt_eq == LE_VALUE) ? " or less" : (lt_gt_eq == GE_VALUE) ? " or more" : "");
                    attrqry = sprintf(attrqry, "Choose attribute for when %s is %s%s%s:", game.initblstats[fld].fldname, (lt_gt_eq == LT_VALUE) ? "less than " : (lt_gt_eq == GT_VALUE) ? "more than " : "", numstart, (lt_gt_eq == LE_VALUE) ? " or less" : (lt_gt_eq == GE_VALUE) ? " or more" : "");
                    hilite.rel = lt_gt_eq;
                    Object.assign(hilite.value, aval);
                } else if (behavior == 102) {
                    if (game.initblstats[fld].anytype != ANY_STR) {
                        let ltok = (fld != BL_TIME);
                        let gtok = (1);
                        lt_gt_eq = await status_hilite_menu_choose_updownboth(fld, null, ltok, gtok);
                        if (lt_gt_eq == NO_LTEQGT) {
                            continue choose_behavior;
                        }
                    } else {
                        /* player picked '<field> value changes' in outer menu;
               ordered string comparison is supported but LT/GT for the
               string status fields (title, dungeon level, alignment)
               is pointless; rather than calling ..._choose_updownboth()
               with ltok==False plus gtok=False and having a menu with a
               single choice, skip it altogether and just use 'changed' */
                        lt_gt_eq = EQ_VALUE;
                    }
                    colorqry = sprintf(colorqry, "Choose a color for when %s %s:", game.initblstats[fld].fldname, (lt_gt_eq == EQ_VALUE) ? "changes" : (lt_gt_eq == LT_VALUE) ? "decreases" : "increases");
                    attrqry = sprintf(attrqry, "Choose attribute for when %s %s:", game.initblstats[fld].fldname, (lt_gt_eq == EQ_VALUE) ? "changes" : (lt_gt_eq == LT_VALUE) ? "decreases" : "increases");
                    hilite.rel = lt_gt_eq;
                } else if (behavior == 103) {
                    cond = await query_conditions();
                    if (!cond) {
                        if (origfld == BL_FLUSH) {
                            continue choose_field;
                        }
                        return (0);
                    }
                    colorqry = nh_snprintf("status_hilite_menu_add", 4121, colorqry, 256 /* sizeof(char [256]) */, "Choose a color for conditions %s:", conditionbitmask2str(cond));
                    attrqry = nh_snprintf("status_hilite_menu_add", 4124, attrqry, 256 /* sizeof(char [256]) */, "Choose attribute for conditions %s:", conditionbitmask2str(cond));
                } else if (behavior == 104) {
                    let qry_buf = '';
                    qry_buf = sprintf(qry_buf, "%s %s text value to match:", (fld == BL_CAP || fld == BL_ALIGN || fld == BL_HUNGER || fld == BL_TITLE) ? "Choose" : "Enter", game.initblstats[fld].fldname);
                    if (fld == BL_CAP) {
                        let rv = await query_arrayvalue(qry_buf, enc_stat, SLT_ENCUMBER, OVERLOADED + 1);
                        if (rv < SLT_ENCUMBER) {
                            continue choose_behavior;
                        }
                        hilite.rel = TXT_VALUE;
                        hilite.textmatch = strcpy(hilite.textmatch, enc_stat[rv]);
                    } else if (fld == BL_ALIGN) {
                        let rv = await query_arrayvalue(qry_buf, __status_hilite_menu_add_aligntxt, 0, 2 + 1);
                        if (rv < 0) {
                            continue choose_behavior;
                        }
                        hilite.rel = TXT_VALUE;
                        hilite.textmatch = strcpy(hilite.textmatch, __status_hilite_menu_add_aligntxt[rv]);
                    } else if (fld == BL_HUNGER) {
                        let rv = await query_arrayvalue(qry_buf, __status_hilite_menu_add_hutxt, SATIATED, STARVED + 1);
                        if (rv < SATIATED) {
                            continue choose_behavior;
                        }
                        hilite.rel = TXT_VALUE;
                        hilite.textmatch = strcpy(hilite.textmatch, __status_hilite_menu_add_hutxt[rv]);
                    } else if (fld == BL_TITLE) {
                        let rolelist = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
                        let mbuf = '';
                        let fbuf = '';
                        let obuf = '';
                        let i = 0;
                        let j = 0;
                        let rv = 0;
                        for (i = j = 0; i < 9; i++) {
                            mbuf = sprintf(mbuf, "\"%s\"", game.urole.rank[i].m);
                            if (game.urole.rank[i].f) {
                                fbuf = sprintf(fbuf, "\"%s\"", game.urole.rank[i].f);
                                obuf = nh_snprintf("status_hilite_menu_add", 4179, obuf, 80 /* sizeof(char [80]) */, "%s or %s", game.flags.female ? fbuf : mbuf, game.flags.female ? mbuf : fbuf);
                            } else {
                                (obuf = '', fbuf = '');
                            }
                            if (game.flags.female) {
                                if (fbuf) {
                                    rolelist[j++] = dupstr(fbuf);
                                }
                                rolelist[j++] = dupstr(mbuf);
                                if (obuf) {
                                    rolelist[j++] = dupstr(obuf);
                                }
                            } else {
                                rolelist[j++] = dupstr(mbuf);
                                if (fbuf) {
                                    rolelist[j++] = dupstr(fbuf);
                                }
                                if (obuf) {
                                    rolelist[j++] = dupstr(obuf);
                                }
                            }
                        }
                        rolelist[j++] = dupstr("\"none of the above (polymorphed)\"");
                        rv = await query_arrayvalue(qry_buf, rolelist, 0, j);
                        if (rv >= 0) {
                            hilite.rel = TXT_VALUE;
                            hilite.textmatch = strcpy(hilite.textmatch, rolelist[rv]);
                        }
                        for (i = 0; i < j; i++) {
                            free(rolelist[i]) , rolelist[i] = null;
                        }
                        if (rv < 0) {
                            continue choose_behavior;
                        }
                    } else {
                        let inbuf = '';
                        inbuf = '';
                        inbuf = await getlin(qry_buf, inbuf);
                        if (__nh_char_at0(inbuf) == 0 || __nh_char_at0(inbuf) == 27) {
                            continue choose_behavior;
                        }
                        hilite.rel = TXT_VALUE;
                        if (strlen(inbuf) < 80 /* sizeof(char [80]) */) {
                            hilite.textmatch = strcpy(hilite.textmatch, inbuf);
                        } else {
                            return (0);
                        }
                    }
                    colorqry = sprintf(colorqry, "Choose a color for when %s is '%s':", game.initblstats[fld].fldname, hilite.textmatch);
                    attrqry = sprintf(attrqry, "Choose attribute for when %s is '%s':", game.initblstats[fld].fldname, hilite.textmatch);
                } else if (behavior == 105) {
                    colorqry = sprintf(colorqry, "Choose a color to always hilite %s:", game.initblstats[fld].fldname);
                    attrqry = sprintf(attrqry, "Choose attribute to always hilite %s:", game.initblstats[fld].fldname);
                }
                choose_color: while (true) {
                    clr = await query_color(colorqry, 8);
                    if (clr == -1) {
                        if (behavior != 105) {
                            continue choose_value;
                        } else {
                            continue choose_behavior;
                        }
                    }
                    atr = await query_attr(attrqry, 0);
                    if (atr == -1) {
                        continue choose_color;
                    }
                    if (behavior == 103) {
                        let clrbuf = '';
                        let attrbuf = '';
                        let tmpattr = null;
                        if (atr & HL_BOLD) {
                            game.cond_hilites[16 + 2] |= cond;
                        }
                        if (atr & HL_DIM) {
                            game.cond_hilites[16 + 3] |= cond;
                        }
                        if (atr & HL_ITALIC) {
                            game.cond_hilites[16 + 4] |= cond;
                        }
                        if (atr & HL_ULINE) {
                            game.cond_hilites[16 + 5] |= cond;
                        }
                        if (atr & HL_BLINK) {
                            game.cond_hilites[16 + 6] |= cond;
                        }
                        if (atr & HL_INVERSE) {
                            game.cond_hilites[16 + 7] |= cond;
                        }
                        if (atr == HL_NONE) {
                            game.cond_hilites[16 + 2] &= ~cond;
                            game.cond_hilites[16 + 3] &= ~cond;
                            game.cond_hilites[16 + 4] &= ~cond;
                            game.cond_hilites[16 + 5] &= ~cond;
                            game.cond_hilites[16 + 6] &= ~cond;
                            game.cond_hilites[16 + 7] &= ~cond;
                        }
                        game.cond_hilites[clr] |= cond;
                        strNsubst(strcpy(clrbuf, clr2colorname(clr)), " ", "-", 0);
                        tmpattr = hlattr2attrname(atr, attrbuf, 256);
                        if (tmpattr) {
                            clrbuf = __nh_buf_append(clrbuf, sprintf('', "&%s", tmpattr));
                        }
                        await pline("Added hilite condition/%s/%s", conditionbitmask2str(cond), clrbuf);
                    } else {
                        let p = null;
                        let q = null;
                        hilite.coloridx = clr | (atr << 8);
                        hilite.anytype = game.initblstats[fld].anytype;
                        if (fld == BL_TITLE && (p = strstri(hilite.textmatch, " or ")) != null) {
                            /* split menu choice "male-rank or female-rank" into two distinct
               but otherwise identical rules, "male-rank" and "female-rank" */
                            /* chop off " or female-rank" */
                            hilite.textmatch = nh_strchr_truncate(hilite.textmatch, " or ", 'stri');
                            status_hilite_add_threshold(fld, hilite);
                            await pline("Added hilite %s", await status_hilite2str(hilite));
                            /* transfer female-rank to start of hilite.textmatch buffer */
                            p = __nh_advance_str(p, 5 /* sizeof(char [5]) */ - 1 /* sizeof(char [1]) */);
                            q = hilite.textmatch;
                            /* proceed with normal addition of new rule */
                            while ((void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = (p = __nh_advance_str(p, 1))) */) != 0) {
                                continue;
                            }
                        }
                        status_hilite_add_threshold(fld, hilite);
                        await pline("Added hilite %s", await status_hilite2str(hilite));
                    }
                    reset_status_hilites();
                    return (1);
                    break;
                }
                break;
            }
            break;
        }
        break;
    }
}
export function status_hilite_remove(id) {
    let hlstr = game.status_hilite_str;
    while (hlstr && hlstr.id != id) {
        hlstr = hlstr.next;
    }
    if (!hlstr) {
        return (0);
    }
    if (hlstr.fld == BL_CONDITION) {
        let i = 0;
        for (i = 0; i < 16; i++) {
            game.cond_hilites[i] &= ~hlstr.mask;
        }
        game.cond_hilites[16 + 2] &= ~hlstr.mask;
        game.cond_hilites[16 + 3] &= ~hlstr.mask;
        game.cond_hilites[16 + 4] &= ~hlstr.mask;
        game.cond_hilites[16 + 5] &= ~hlstr.mask;
        game.cond_hilites[16 + 6] &= ~hlstr.mask;
        game.cond_hilites[16 + 7] &= ~hlstr.mask;
        return (1);
    } else {
        let fld = hlstr.fld;
        let hl = null;
        let hlprev = null;
        for (hl = game.blstats[0][fld].thresholds; hl; hl = hl.next) {
            if (hlstr.hl == hl) {
                if (hlprev) {
                    hlprev.next = hl.next;
                } else {
                    game.blstats[0][fld].thresholds = hl.next;
                    game.blstats[1][fld].thresholds = game.blstats[0][fld].thresholds;
                }
                if (game.blstats[0][fld].hilite_rule == hl) {
                    game.blstats[0][fld].hilite_rule = game.blstats[1][fld].hilite_rule = null;
                    game.blstats[0][fld].time = game.blstats[1][fld].time = 0;
                }
                free(hl);
                return (1);
            }
            hlprev = hl;
        }
    }
    return (0);
}
export async function status_hilite_menu_fld(fld) {
    let tmpwin = 0;
    let i = 0;
    let res = 0;
    let picks = null;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let count = status_hilite_linestr_countfield(fld);
    let hlstr = null;
    let buf = '';
    let acted = 0;
    let clr = 8;
    if (!count) {
        if (await status_hilite_menu_add(fld)) {
            status_hilite_linestr_done();
            await status_hilite_linestr_gather();
            count = status_hilite_linestr_countfield(fld);
        } else {
            return (0);
        }
    }
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    if (count) {
        hlstr = game.status_hilite_str;
        while (hlstr) {
            if (hlstr.fld == fld) {
                Object.assign(any, cg.zeroany);
                any.a_int = hlstr.id;
                await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, hlstr.str, 0);
            }
            hlstr = hlstr.next;
        }
    } else {
        buf = sprintf(buf, "No current hilites for %s", game.initblstats[fld].fldname);
        await add_menu_str(tmpwin, buf);
    }
    await add_menu_str(tmpwin, "");
    if (count) {
        Object.assign(any, cg.zeroany);
        any.a_int = -1;
        await add_menu(tmpwin, nul_glyphinfo, any, 88, 0, 0, clr, "Remove selected hilites", 0);
    }
    if (fld == BL_SCORE) {
        ;
    } else {
        Object.assign(any, cg.zeroany);
        any.a_int = -2;
        await add_menu(tmpwin, nul_glyphinfo, any, 90, 0, 0, clr, "Add new hilites", 0);
    }
    buf = sprintf(buf, "Current %s hilites:", game.initblstats[fld].fldname);
    (game.windowprocs.win_end_menu)(tmpwin, buf);
    acted = (0);
    if ((res = await select_menu(tmpwin, 2, picks)) > 0) {
        /* suppress 'Z - Add a new hilite' for 'score' when SCORE_ON_BOTL
           is disabled; we wouldn't be called for 'score' unless it has
           hilite rules from the config file, so count must be positive
           (hence there's no risk that we're putting up an empty menu) */
        let idx = 0;
        let mode = 0;
        for (i = 0; i < res; i++) {
            idx = picks[i].item.a_int;
            if (idx == -1) {
                mode |= 1;
            } else if (idx == -2) {
                mode |= 2;
            }
        }
        if (mode & 1) {
            for (i = 0; i < res; i++) {
                idx = picks[i].item.a_int;
                if (idx > 0 && status_hilite_remove(idx)) {
                    acted = (1);
                }
            }
        }
        if (mode & 2) {
            while (await status_hilite_menu_add(fld)) {
                acted = (1);
            }
        }
        free(picks) , picks = null;
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return acted;
}
export async function status_hilites_viewall() {
    let datawin = 0;
    let hlstr = game.status_hilite_str;
    let buf = '';
    datawin = (game.windowprocs.win_create_nhwindow)(5);
    while (hlstr) {
        buf = sprintf(buf, "OPTIONS=hilite_status: %.*s", (256 - 24 /* sizeof(char [24]) */ - 1), hlstr.str);
        (game.windowprocs.win_putstr)(datawin, 0, buf);
        hlstr = hlstr.next;
    }
    await (game.windowprocs.win_display_nhwindow)(datawin, (0));
    (game.windowprocs.win_destroy_nhwindow)(datawin);
}
export async function all_options_statushilites(sbuf) {
    let hlstr = null;
    let buf = '';
    status_hilite_linestr_done();
    await status_hilite_linestr_gather();
    hlstr = game.status_hilite_str;
    while (hlstr) {
        buf = sprintf(buf, "OPTIONS=hilite_status: %.*s\n", (256 - 25 /* sizeof(char [25]) */ - 1), hlstr.str);
        strbuf_append(sbuf, buf);
        hlstr = hlstr.next;
    }
    status_hilite_linestr_done();
}
export async function status_hilite_menu() {
    let tmpwin = 0;
    let i = 0;
    let fld = 0;
    let res = 0;
    let picks = null;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let redo = 0;
    let countall = 0;
    let clr = 8;
    shlmenu_redo: while (true) {
        redo = (0);
        tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(tmpwin, 0);
        await status_hilite_linestr_gather();
        countall = status_hilite_linestr_countfield(BL_FLUSH);
        if (countall) {
            Object.assign(any, cg.zeroany);
            any.a_int = -1;
            await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, "View all hilites in config format", 0);
            await add_menu_str(tmpwin, "");
        }
        for (i = 0; i < MAXBLSTATS; i++) {
            let count = 0;
            let buf = '';
            fld = game.initblstats[i].fld;
            count = status_hilite_linestr_countfield(fld);
            /* config file might contain rules for highlighting 'score'
           even when SCORE_ON_BOTL is disabled; if so, 'O' command
           menus will show them and allow deletions but not additions,
           otherwise, it won't show 'score' at all */
            if (fld == BL_SCORE && !count) {
                continue;
            }
            Object.assign(any, cg.zeroany);
            any.a_int = fld + 1;
            buf = sprintf(buf, "%-18s", game.initblstats[i].fldname);
            if (count) {
                buf = __nh_buf_append(buf, sprintf('', " (%d defined)", count));
            }
            await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        }
        (game.windowprocs.win_end_menu)(tmpwin, "Status hilites:");
        if ((res = await select_menu(tmpwin, 1, picks)) > 0) {
            fld = picks.item.a_int - 1;
            if (fld < 0) {
                await status_hilites_viewall();
            } else {
                if (await status_hilite_menu_fld(fld)) {
                    reset_status_hilites();
                }
            }
            free(picks) , picks = null;
            redo = (1);
        }
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        countall = status_hilite_linestr_countfield(BL_FLUSH);
        status_hilite_linestr_done();
        /* fuzzer is unlikely to pick something useful within nested menus;
       limit it to one try */
        if (redo && !game.iflags.debug_fuzzer) {
            continue shlmenu_redo;
        }
        /* hilite_delta=='statushilites' does double duty:  it is the
       number of turns for temporary highlights to remain visible
       and also when non-zero it is the flag to enable highlighting */
        if (countall > 0 && !game.iflags.hilite_delta) {
            game.iflags.hilite_delta = 3;
        }
        return (1);
        break;
    }
}
/* STATUS_HILITES */
/*botl.c*/
/*
     * Put the pieces together.  If they all fit, keep the traditional
     * sequence.  Otherwise, move least important parts to the end in
     * case the interface side of things has to truncate.  Note that
     * dloc[] contains '$' encoded in ten character sequence \GXXXXNNNN
     * so we want to test its display length rather than buffer length.
     *
     * We don't have an actual display limit here, so have to go by the
     * width of the map.  Since we're reordering rather than truncating,
     * wider displays can still show wider status than the map if the
     * interface supports that.
     */
/* dosave() flags completion by setting u.uhp to -1; suppress_map_output()
       covers program_state.restoring and is used for status as well as map */
/* we're called when disp.time_botl is set and general disp.botl
       is clear; disp.time_botl gets set whenever svm.moves changes value
       so there's no benefit in tracking previous value to decide whether
       to skip update; suppress_map_output() handles program_state.restoring
       and program_state.done_hup (tty hangup => no further output at all)
       and we use it for maybe skipping status as well as for the map */
/* old status display updates everything */
/* just one piece; spell it out */
/* if in-lava or tethered is disabled and the condition applies,
           lump it in with trapped */
/* it is possible for a hero in sticks() form to be swallowed,
           so swallowed needs to be checked first; it is not possible for
           a hero in sticks() form to be held--sticky hero does the holding
           even if u.ustuck is also a holder */
/*
     * The tty port needs to display the current symbol for gold
     * as a field header, so to accommodate that we pass gold with
     * that already included. If a window port needs to use the text
     * gold amount without the leading "$:" the port will have to
     * skip past ':' to the value pointer it was passed in status_update()
     * for the BL_GOLD case.
     *
     * Another quirk of BL_GOLD is that the field display may have
     * changed if a new symbol set was loaded, or we entered or left
     * the rogue level.
     *
     * The currency prefix is encoded as ten character \GXXXXNNNN
     * sequence.
     */
/* engulfed/swallowed isn't currently a tracked status condition;
               "held" might look odd for it but seems better than blank */
/* if Xp percentage changed, we set 'chg' to 1 above;
                   reset that if the Xp value hasn't actually changed
                   or possibly went down rather than up (level loss) */
/* Color for conditions is done through gc.cond_hilites[] */
/* HP and energy are int so this is the only case that cares
               about 'rawval'; for them, we use that rather than their
               potentially truncated (to 9999) display value */
/* maximum delta between levels is 10000000; calculation of
               100 * (10000000 - N) / 10000000 fits within 32-bit long */
/* if player only specified a number then lt_gt_eq isn't set
               up yet and the >-1 and <101 exceptions can't be honored;
               deliberate use of those should be uncommon enough for
               that to be palatable; for 0 and 100, choose_updown_both()
               will prevent useless operations */
