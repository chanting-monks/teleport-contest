/* NetHack 5.0	pager.c	$NHDT-Date: 1774846177 2026/03/29 20:49:37 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.296 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2018. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * This file contains the command routines dowhatis() and dohelp() and
 * a few other help related facilities such as data.base lookup.
 */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { free, memcpy } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { nh_strchr_truncate, strcat, strchr, strcmp, strcpy, strlen, strncat, strncmp, strncmpi, strstri } from '../c2js-runtime/string.js';
import { cmd_from_func, cmdname_from_func, cmdq_clear, cmdq_pop, do_reqmenu, doextlist, dokeylist, getdir, isok, key2extcmddesc, key2txt, yn_function } from './cmd.js';
import { db_under_typ, is_drawbridge_wall, is_lava, is_pool } from './dbridge.js';
import { c_common_strings, cg, ynchars } from './decl.js';
import { trapped_chest_at, trapped_door_at } from './detect.js';
import { glyph_at, map_glyphinfo, nul_glyphinfo } from './display.js';
import { Mgender, coyotename, distant_monnam, hliquid, mon_nam, pmname, rndmonnam, y_monnam } from './do_name.js';
import { def_monsyms, def_oc_syms, def_warnsyms, defsyms } from './drawing.js';
import { In_hell, In_mines, on_level, surface } from './dungeon.js';
import { engr_at } from './engrave.js';
import { coord_desc, getpos } from './getpos.js';
import { glyph_to_cmap } from './glyphs.js';
import { copynchars, digit, dist2, eos, lcase, mungspaces, strip_newline, strkitten, strsubst, tabexpand, upstart, visctrl } from './hacklib.js';
import { align_str, trap_predicament } from './insight.js';
import { display_inventory, sobj_at } from './invent.js';
import { dealloc_obj, is_treefruit, mkobj, mksobj } from './mkobj.js';
import { dmgtype_fromattack, sticks } from './mondata.js';
import { closed_door } from './monmove.js';
import { BEAR_TRAP, BLINDED, BOULDER, CHEST, CMDQ_KEY, COIN_CLASS, CORPSE, CORR, CQ_CANNED, DBWALL, DEF_INVISIBLE, DETECT_MONSTERS, DRAWBRIDGE_UP, FIRST_OBJECT, GLYPH_ALTAR_OFF, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_NOTHING_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_UNEXPLORED_OFF, GLYPH_WARNING_OFF, GRAVE, HALLUC, HALLUC_RES, HOLE, ICE, INFRAVISION, INVIS, LARGE_BOX, LAVAPOOL, LAVAWALL, LEASH, LEVITATION, LOOK_ONCE, LOOK_QUICK, LOOK_VERBOSE, MAXMCLASSES, MAXOCLASSES, MAXOTHER, MAXPCHARS, MAX_GLYPH, MELT_ICE_AWAY, MOAT, M_AP_FURNITURE, M_AP_MONSTER, M_AP_OBJECT, NEUTRAL, NON_PM, NO_TRAP, NUMMONS, NUM_OBJECTS, PIT, PM_COYOTE, PM_ELF, PM_GNOME, PM_HUMAN, PM_SAMURAI, PM_WIZARD, POOL, ROCKTRAP, ROCK_CLASS, SCORR, SDOOR, SEE_INVIS, SLIME_MOLD, SPIKED_PIT, STATUE, STONE, STRANGE_OBJECT, SYM_BOULDER, SYM_HERO_OVERRIDE, SYM_INVISIBLE, SYM_NOTHING, SYM_PET_OVERRIDE, SYM_UNEXPLORED, S_EEL, S_HUMAN, S_MIMIC, S_altar, S_arrow_trap, S_cloud, S_darkroom, S_digbeam, S_engrcorr, S_engroom, S_goodpos, S_grave, S_hcdbridge, S_ice, S_invisible, S_lava, S_lavawall, S_ndoor, S_poisoncloud, S_pool, S_stone, S_sw_br, S_sw_tl, S_trwall, S_vibrating_square, S_vodbridge, S_vwall, S_water, TELEPAT, TRAPDOOR, TRAPNUM, TRAPPED_CHEST, TRAPPED_DOOR, TREE, VENOM_CLASS, VIBRATING_SQUARE, WATER, WEB, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned, remembered_text } from './nh-constants.js';
import { observe_object } from './o_init.js';
import { an, ansimpleoname, distant_name, doname_vague_quan, doname_with_price, fruit_from_name, makeplural, makesingular, simpleonames, singular, the, xname } from './objnam.js';
import { doset, doset_simple, option_help, show_menu_controls } from './options.js';
import { dumplogmsg } from './pline.js';
import { altarmask_at } from './pray.js';
import { ok_to_quest } from './quest.js';
import { visible_region_at } from './region.js';
import { rn2_on_display_rng } from './rnd.js';
import { costly_spot } from './shk.js';
import { pmatch } from './strutil.js';
import { obj_stop_timers, spot_time_left } from './timeout.js';
import { t_at, trapname } from './trap.js';
import { doextversion } from './version.js';
import { howmonseen } from './vision.js';
import { add_menu, add_menu_str, decode_mixed, encglyph, getlin, select_menu } from './windows.js';

/* lookat() can return Null */
export const chkfilNone = 0;
export const chkfilUsrTyped = 1;
export const chkfilDontAsk = 2;
export const chkfilIaCheck = 4;
const invisexplain = "remembered, unseen, creature";
const altinvisexplain = "unseen creature";
/* for clairvoyance */
/* Returns "true" for characters that could represent a monster's stomach. */
export function is_swallow_sym(c) {
    let i = 0;
    for (i = S_sw_tl; i <= S_sw_br; i++) {
        if (game.showsyms[i] == c) {
            return (1);
        }
    }
    return (0);
}
/* Append " or "+new_str to the end of buf if new_str doesn't already exist
   as a substring of buf.  Return 1 if the string was appended, 0 otherwise.
   It is expected that buf is of size BUFSZ. */
const __append_str_sep = " or ";
export function append_str(buf, new_str) {
    let oldlen = 0;
    let space_left = 0;
    if (strstri(buf, new_str)) {
        return 0;
    }
    oldlen = strlen(buf);
    if (oldlen >= 256 - 1) {
        if (oldlen > 256 - 1) {
            impossible("append_str: 'buf' contains %lu characters.", oldlen);
        }
        return 0;
    }
    /* some space available, but not necessarily enough for full append */
    space_left = 256 - 1 - oldlen;
    buf = strncat(buf, __append_str_sep, space_left);
    if (space_left > 5 /* sizeof(const char [5]) */ - 1) {
        buf = strncat(buf, new_str, space_left - (5 /* sizeof(const char [5]) */ - 1));
    }
    /* something was appended, possibly just part of " or " */
    return 1;
}
/* shared by monster probing (via query_objlist!) as well as lookat() */
export function self_lookat(outbuf) {
    let race = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let trapbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* include race with role unless polymorphed */
    race[0] = 0;
    if (!(game.u.umonnum != game.u.umonster)) {
        race = sprintf(race, "%s ", game.urace.adj);
    }
    outbuf = sprintf(outbuf, "%s%s%s called %s", (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && (((game.u.uprops[TELEPAT].extrinsic) || (game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic)) || !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked))) ? "invisible " : "", race, pmname(game.mons[game.u.umonnum], (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)), game.plname);
    if (game.u.usteed) {
        outbuf = (outbuf || '') + sprintf('', ", mounted on %s", y_monnam(game.u.usteed));
    }
    if (game.u.uundetected || ((game.u.umonnum != game.u.umonster) && (game.youmonst.m_ap_type & 7)) || visible_region_at(game.u.ux, game.u.uy)) {
        mhidden_description(game.youmonst, 1 | 2 | 8, eos(outbuf));
    }
    if ((game.uball != null)) {
        outbuf = (outbuf || '') + sprintf('', ", chained to %s", game.uball ? ansimpleoname(game.uball) : "nothing?");
    }
    /* bear trap, pit, web, in-floor, in-lava, tethered */
    if (game.u.utrap) {
        outbuf = (outbuf || '') + sprintf('', ", %s", trap_predicament(trapbuf, 0, (0)));
    }
    return outbuf;
}
/* format a description of 'mon's health for look_at_monster(), done_in_by();
   result isn't Healer-specific (not trained for arbitrary creatures) */
export function monhealthdescr(mon, addspace, outbuf) {
    ((mon));
    ((addspace));
    /* [disable this for the time being] */
    outbuf.value = 0;
    return outbuf;
}
/* copy a trap's description into outbuf[] */
export function trap_description(outbuf, tnum, x, y) {
    /*
     * Trap detection used to display a bear trap at locations having
     * a trapped door or trapped container or both.  They're semi-real
     * traps now (defined trap types but not part of ftrap chain).
     */
    if (trapped_chest_at(tnum, x, y)) {
        outbuf = strcpy(outbuf, "trapped chest");
    } else if (trapped_door_at(tnum, x, y)) {
        outbuf = strcpy(outbuf, "trapped door");
    } else {
        outbuf = strcpy(outbuf, trapname(tnum, (0)));
    }
    return;
}
/* describe a hidden monster; used for look_at during extended monster
   detection and for probing; also when looking at self and camera feedback */
/* hidden monster to describe */
/* controls optional aspects of description */
/* output buffer */
export function mhidden_description(mon, mhid_flags, outbuf) {
    let otmp = null;
    let what = null;
    let reg = null;
    let buflen = 0;
    let incl_prefix = (mhid_flags & 1) != 0;
    let incl_article = (mhid_flags & 2) != 0;
    let show_altmon = (mhid_flags & 4) != 0;
    let force_region = (mhid_flags & 8) != 0;
    let fakeobj = 0;
    let isyou = (mon == game.youmonst);
    let x = isyou ? game.u.ux : mon.mx;
    let y = isyou ? game.u.uy : mon.my;
    let glyph = (game.level.flags.hero_memory && !isyou) ? game.level.locations[x][y].glyph : glyph_at(x, y);
    outbuf.value = 0;
    if (((mon).m_ap_type & 7) == M_AP_FURNITURE || ((mon).m_ap_type & 7) == M_AP_OBJECT) {
        if (incl_prefix) {
            outbuf = strcpy(outbuf, ", mimicking ");
        }
        if (((mon).m_ap_type & 7) == M_AP_FURNITURE) {
            what = defsyms[mon.mappearance].explanation;
            if (incl_article) {
                what = an(what);
            }
            outbuf = strcat(outbuf, what);
        } else if (((mon).m_ap_type & 7) == M_AP_OBJECT && (((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
            objfrommap: {
            }
            /* if not an object, probably a detected chest trap */
            /* assume trapped chest|door */
            otmp = null;
            /* remembered glyph, not glyph_at() which is 'mon' */
            fakeobj = object_from_map(glyph, x, y, { get value() { return otmp; }, set value(_v) { otmp = _v; } });
            what = (otmp && otmp.otyp != STRANGE_OBJECT) ? simpleonames(otmp) : game.obj_descr[STRANGE_OBJECT].oc_name;
            if (incl_article && (!otmp || otmp.quan == 1)) {
                what = an(what);
            }
            outbuf = strcat(outbuf, what);
            if (fakeobj && otmp) {
                /* object_from_map set to OBJ_FLOOR */
                /* object_from_map set it to OBJ_FLOOR */
                otmp.where = 0;
                dealloc_obj(otmp);
            }
        } else {
            outbuf = strcat(outbuf, c_common_strings.c_something);
        }
    } else if (((mon).m_ap_type & 7) == M_AP_MONSTER) {
        if (show_altmon) {
            if (incl_prefix) {
                outbuf = strcat(outbuf, ", masquerading as ");
            }
            what = pmname(game.mons[mon.mappearance], Mgender(mon));
            if (incl_prefix) {
                what = an(what);
            }
            outbuf = strcat(outbuf, what);
        }
    } else if (isyou ? game.u.uundetected : mon.mundetected) {
        outbuf = strcpy(outbuf, ", hiding");
        if ((((mon.data).mflags1 & 128) != 0)) {
            outbuf = strcat(outbuf, " under ");
            if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
                otmp = null;
                fakeobj = object_from_map(glyph, x, y, { get value() { return otmp; }, set value(_v) { otmp = _v; } });
                what = (otmp && otmp.otyp != STRANGE_OBJECT) ? simpleonames(otmp) : game.obj_descr[STRANGE_OBJECT].oc_name;
                if (incl_article && (!otmp || otmp.quan == 1)) {
                    what = an(what);
                }
                outbuf = strcat(outbuf, what);
                if (fakeobj && otmp) {
                    otmp.where = 0;
                    dealloc_obj(otmp);
                }
            } else {
                outbuf = strcat(outbuf, c_common_strings.c_something);
            }
        } else if ((((mon.data).mflags1 & 256) != 0)) {
            outbuf = (outbuf || '') + sprintf('', " on the %s", ((((mon.data).mflags1 & 256) != 0) && (((((mon.data).mflags1 & 16) != 0) && (mon.data).mlet != S_MIMIC) || (((mon.data).mflags1 & 1) != 0))) ? "ceiling" : surface(x, y));
        } else {
            if (mon.data.mlet == S_EEL && is_pool(x, y)) {
                outbuf = strcat(outbuf, " in murky water");
            }
        }
    }
    if ((reg = visible_region_at(x, y)) != null && (buflen = strlen(outbuf)) < 256 - 1) {
        /* FIXME: <x,y> isn't right when looking at long worm tails */
        let r = (game.u.xray_range > 1) ? game.u.xray_range : 1;
        if (dist2((x), (y), game.u.ux, game.u.uy) <= r * (r + 1) || force_region) {
            /* at present, hero must be next to the monster; being able to see
           from the hero's spot to the monster's spot would be much better,
           but a visible region marks all its spots as can't-be-seen, so
           this monster's spot is !cansee and !couldsee [maybe we need an
           additional vision bit for "hero's side of edge of gas cloud"?] */
            let rglyph = reg.glyph;
            let poison_gas = (((rglyph) >= GLYPH_CMAP_STONE_OFF && (rglyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && glyph_to_cmap(rglyph) == S_poisoncloud);
            nh_snprintf("mhidden_description", 277, eos(outbuf), 256 - buflen, ", in a cloud of %s", poison_gas ? "poison gas" : "vapor");
        }
    }
}
/* extracted from lookat(); also used by namefloorobj() */
export function object_from_map(glyph, x, y, obj_p) {
    let fakeobj = (0);
    let mimic_obj = (0);
    let mtmp = null;
    let otmp = null;
    let glyphotyp = (((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))))) ? (((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))) ? CORPSE : (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) ? STATUE : (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) ? ((glyph) - (((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : ((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) ? ((glyph) - (((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS))) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : NUM_OBJECTS) : ((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) ? (sobj_at(CHEST, x, y) ? CHEST : LARGE_BOX) : STRANGE_OBJECT;
    obj_p.value = null;
    /* TODO: check inside containers in case glyph came from detection */
    if ((otmp = sobj_at(glyphotyp, x, y)) == null) {
        for (otmp = game.level.buriedobjlist; otmp; otmp = otmp.nobj) {
            if (otmp.ox == x && otmp.oy == y && otmp.otyp == glyphotyp) {
                break;
            }
        }
    }
    /* there might be a mimic here posing as an object */
    mtmp = (game.level.monsters[x][y]);
    if (mtmp && (((mtmp).m_ap_type & 7) == M_AP_OBJECT && (mtmp).mappearance == (glyphotyp))) {
        otmp = null;
        mimic_obj = (1);
    } else {
        mtmp = null;
    }
    if (!otmp || otmp.otyp != glyphotyp) {
        if ((game.obj_descr[(game.objects[glyphotyp]).oc_name_idx].oc_name)) {
            /* this used to exclude STRANGE_OBJECT; now caller deals with it */
            /* map shows a regular object, but one that's not actually here */
            otmp = mksobj(glyphotyp, (0), (0));
        } else {
            /* map shows a non-item that holds an extra object type (shown
               on map due to hallucination) for a name which might have been
               shuffled into play but wasn't (or was shuffled out of play);
               pick another item that is a regular one in same object class */
            /* mkobj() doesn't provide any no-init option; however, there
               aren't any extra tool items (or statues) so we won't get here
               for tools and don't need to check for and delete container
               contents or extinguish lights on the temporary object */
            otmp = mkobj(game.objects[glyphotyp].oc_class, (0));
        }
        /* even though we pass False for mksobj()'s 'init' arg, corpse-rot,
           egg-hatch, and figurine-transform timers get initialized */
        if (otmp.timed) {
            obj_stop_timers(otmp);
        }
        fakeobj = (1);
        if (otmp.oclass == COIN_CLASS) {
            otmp.quan = 2;
        } else if (otmp.otyp == SLIME_MOLD) {
            otmp.spe = game.context.current_fruit;
        }
        if (mtmp && ((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM)) {
            if (otmp.otyp == SLIME_MOLD) {
                otmp.spe = ((mtmp).mextra.mcorpsenm);
            /* override svc.context.current_fruit to avoid
                     look, use 'O' to make new named fruit, look again
                   giving different results when current_fruit changes */
            } else {
                otmp.corpsenm = ((mtmp).mextra.mcorpsenm);
            }
        } else if (otmp.otyp == CORPSE && ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))))) {
            otmp.corpsenm = ((((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))) ? ((glyph) - GLYPH_BODY_PILETOP_OFF) : ((glyph) - GLYPH_BODY_OFF));
        } else if (otmp.otyp == STATUE && (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS)))))) {
            otmp.corpsenm = ((((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))) ? ((glyph) - GLYPH_STATUE_FEM_PILETOP_OFF) : (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS))) ? ((glyph) - GLYPH_STATUE_MALE_PILETOP_OFF) : ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS)))) ? ((glyph) - GLYPH_STATUE_FEM_OFF) : ((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) ? ((glyph) - GLYPH_STATUE_MALE_OFF) : MAX_GLYPH);
        }
        if (otmp.otyp == LEASH) {
            otmp.corpsenm = 0;
        }
        /* extra fields needed for shop price with doname() formatting */
        otmp.where = 1;
        otmp.ox = x , otmp.oy = y;
        otmp.no_charge = (otmp.otyp == STRANGE_OBJECT && costly_spot(x, y));
    }
    /* if located at adjacent spot, mark it as having been seen up close
       (corpse type will be known even if dknown is 0, so we don't need a
       touch check for cockatrice corpse--we're looking without touching) */
    if (otmp && (dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (fakeobj || otmp.where == 1) && !game.iflags.terrainmode) {
        observe_object(otmp);
    }
    if (fakeobj && mtmp && mimic_obj && (otmp.dknown || (((mtmp).m_ap_type & ~7) & 8))) {
        /* redundant: we only look for an object which matches current
           glyph among floor and buried objects; when !Blind, any buried
           object's glyph will have been replaced by whatever is present
           on the surface as soon as we moved next to its spot */
        /* terrain mode views what's already known, doesn't learn new stuff */
        /* so don't set dknown when in terrain mode */
        /* if a pile, clearly see the top item only */
        mtmp.m_ap_type |= 8;
        observe_object(otmp);
    }
    obj_p.value = otmp;
    /* when True, caller needs to dealloc *obj_p */
    return fakeobj;
}
/* output buffer */
export function look_at_object(buf, x, y, glyph) {
    let otmp = null;
    let fakeobj = object_from_map(glyph, x, y, { get value() { return otmp; }, set value(_v) { otmp = _v; } });
    if (otmp) {
        buf = strcpy(buf, (otmp.otyp != STRANGE_OBJECT) ? distant_name(otmp, otmp.dknown ? doname_with_price : doname_vague_quan) : game.obj_descr[STRANGE_OBJECT].oc_name);
        if (fakeobj) {
            otmp.where = 0;
            dealloc_obj(otmp) , otmp = null;
        }
    } else {
        buf = strcpy(buf, c_common_strings.c_something);
    }
    if (otmp && otmp.where == 6) {
        buf = strcat(buf, " (buried)");
    } else if (((game.level.locations[x][y].typ) == TREE || (game.level.flags.arboreal && (game.level.locations[x][y].typ) == STONE))) {
        nh_snprintf("look_at_object", 407, eos(buf), 256 - strlen(buf), " %s in a tree", (otmp && is_treefruit(otmp)) ? "dangling" : "stuck");
    } else if (game.level.locations[x][y].typ == STONE || game.level.locations[x][y].typ == SCORR) {
        buf = strcat(buf, " embedded in stone");
    } else if (((game.level.locations[x][y].typ) && (game.level.locations[x][y].typ) <= DBWALL) || game.level.locations[x][y].typ == SDOOR) {
        buf = strcat(buf, " embedded in a wall");
    } else if (closed_door(x, y)) {
        buf = strcat(buf, " embedded in a door");
    } else if (is_pool(x, y)) {
        buf = strcat(buf, " in water");
    } else if (is_lava(x, y)) {
        buf = strcat(buf, " in molten lava");
    }
    return;
}
/* buf: output, monbuf: optional output */
export function look_at_monster(buf, monbuf, mtmp, x, y) {
    let name = null;
    let monnambuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let healthbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let accurate = !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic));
    name = (mtmp.data == game.mons[PM_COYOTE] && accurate) ? coyotename(mtmp, monnambuf) : distant_monnam(mtmp, 0, monnambuf);
    buf = sprintf(buf, "%s%s%s%s", (mtmp.mx != x || mtmp.my != y) ? ((mtmp.isshk && accurate) ? "tail of " : "tail of a ") : "", accurate ? monhealthdescr(mtmp, (1), healthbuf) : "", (mtmp.mtame && accurate) ? "tame " : (mtmp.mpeaceful && accurate) ? "peaceful " : "", name);
    if (game.u.ustuck == mtmp) {
        if (game.u.uswallow || game.iflags.save_uswallow) {
            buf = strcat(buf, (dmgtype_fromattack((mtmp.data), 26, 11) != null) ? ", swallowing you" : ", engulfing you");
        } else {
            buf = strcat(buf, ((game.u.umonnum != game.u.umonster) && sticks(game.youmonst.data)) ? ", being held" : ", holding you");
        }
    }
    /* if mtmp isn't able to move (other than because it is a type of
       monster that never moves), say so [excerpt from mstatusline() for
       stethoscope or wand of probing] */
    if (mtmp.mfrozen) {
        buf = strcat(buf, ", can't move (paralyzed or sleeping or busy)");
    } else if (mtmp.msleeping) {
        buf = strcat(buf, ", asleep");
    } else if ((mtmp.mstrategy & (268435456 | 536870912)) != 0) {
        buf = strcat(buf, ", meditating");
    }
    if (mtmp.mleashed) {
        buf = strcat(buf, ", leashed to you");
    }
    if (mtmp.mtrapped && ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
        /* unfortunately mfrozen covers temporary sleep and being busy
           (donning armor, for instance) as well as paralysis */
        /* sleeping for an indeterminate duration */
        /* arbitrary reason why it isn't moving */
        let t = t_at(mtmp.mx, mtmp.my);
        let tt = t ? t.ttyp : NO_TRAP;
        if (tt == BEAR_TRAP || ((tt) == PIT || (tt) == SPIKED_PIT) || tt == WEB) {
            buf = (buf || '') + sprintf('', ", trapped in %s", an(trapname(tt, (0))));
            /* newsym lets you know of the trap, so mention it here */
            t.tseen = 1;
        }
    }
    /* we know the hero sees a monster at this location, but if it's shown
       due to persistent monster detection he might remember something else */
    if (mtmp.mundetected || ((mtmp).m_ap_type & 7) || visible_region_at(x, y)) {
        mhidden_description(mtmp, 1 | 2 | 8, eos(buf));
    }
    if (monbuf) {
        let how_seen = howmonseen(mtmp);
        monbuf[0] = 0;
        if (how_seen != 0 && how_seen != 1) {
            if (how_seen & 1) {
                monbuf = strcat(monbuf, "normal vision");
                how_seen &= ~1;
                /* how_seen can't be 0 yet... */
                if (how_seen) {
                    monbuf = strcat(monbuf, ", ");
                }
            }
            if (how_seen & 2) {
                monbuf = strcat(monbuf, "see invisible");
                how_seen &= ~2;
                if (how_seen) {
                    monbuf = strcat(monbuf, ", ");
                }
            }
            if (how_seen & 4) {
                monbuf = strcat(monbuf, "infravision");
                how_seen &= ~4;
                if (how_seen) {
                    monbuf = strcat(monbuf, ", ");
                }
            }
            if (how_seen & 8) {
                monbuf = strcat(monbuf, "telepathy");
                how_seen &= ~8;
                if (how_seen) {
                    monbuf = strcat(monbuf, ", ");
                }
            }
            if (how_seen & 16) {
                monbuf = strcat(monbuf, "astral vision");
                how_seen &= ~16;
                if (how_seen) {
                    monbuf = strcat(monbuf, ", ");
                }
            }
            if (how_seen & 32) {
                monbuf = strcat(monbuf, "monster detection");
                how_seen &= ~32;
                if (how_seen) {
                    monbuf = strcat(monbuf, ", ");
                }
            }
            if (how_seen & 64) {
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    monbuf = strcat(monbuf, "paranoid delusion");
                } else {
                    let mW = (game.context.warntype.obj | game.context.warntype.polyd);
                    let m2 = mtmp.data.mflags2;
                    let whom = ((mW & 8 & m2) ? "human" : (mW & 16 & m2) ? "elf" : (mW & 128 & m2) ? "orc" : (mW & 256 & m2) ? "demon" : pmname(mtmp.data, Mgender(mtmp)));
                    monbuf = (monbuf || '') + sprintf('', "warned of %s", makeplural(whom));
                }
                how_seen &= ~64;
                if (how_seen) {
                    monbuf = strcat(monbuf, ", ");
                }
            }
            if (how_seen) {
                /* should have used up all the how_seen bits by now */
                impossible("lookat: unknown method of seeing monster");
                monbuf = (monbuf || '') + sprintf('', "(%u)", how_seen);
            }
        }
    }
}
/* describe a pool location's contents; might return a static buffer so
   caller should use it or copy it before calling waterbody_name() again
   [5.0: moved here from mkmaze.c] */
let __waterbody_name_pooltype = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function waterbody_name(x, y) {
    let ltyp = 0;
    let hallucinate = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !game.program_state.gameover;
    if (!isok(x, y)) {
        return "drink";
    }
    ltyp = ((game.level.locations[x][y].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[x][y].flags) : game.level.locations[x][y].typ);
    if (ltyp == LAVAPOOL) {
        nh_snprintf("waterbody_name", 572, __waterbody_name_pooltype, 40 /* sizeof(char [40]) */, "molten %s", hliquid("lava"));
        return __waterbody_name_pooltype;
    } else if (ltyp == ICE) {
        if (!hallucinate) {
            return "ice";
        }
        nh_snprintf("waterbody_name", 577, __waterbody_name_pooltype, 40 /* sizeof(char [40]) */, "frozen %s", hliquid("water"));
        return __waterbody_name_pooltype;
    } else if (ltyp == POOL) {
        nh_snprintf("waterbody_name", 580, __waterbody_name_pooltype, 40 /* sizeof(char [40]) */, "pool of %s", hliquid("water"));
        return __waterbody_name_pooltype;
    } else if (ltyp == MOAT) {
        if (hallucinate) {
            nh_snprintf("waterbody_name", 585, __waterbody_name_pooltype, 40 /* sizeof(char [40]) */, "deep %s", hliquid("water"));
            /* a bit of extra flavor over general moat */
            return __waterbody_name_pooltype;
        } else if ((((((game.dungeon_topology.d_medusa_level)).dlevel || ((game.dungeon_topology.d_medusa_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_medusa_level))))) {
            /* somewhat iffy since ordinary stairs can take you beneath,
               but previous generic "water" was rather anti-climactic */
            return "shallow sea";
        } else if ((((((game.dungeon_topology.d_juiblex_level)).dlevel || ((game.dungeon_topology.d_juiblex_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_juiblex_level))))) {
            return "swamp";
        } else if ((game.urole.mnum == (PM_SAMURAI)) && (((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level))))) {
            /* samurai quest home level has two isolated moat spots;
               they sound silly if farlook describes them as such */
            return "pond";
        } else {
            return "moat";
        }
    } else if (((ltyp) == WATER)) {
        if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            return "limitless water";
        }
        nh_snprintf("waterbody_name", 603, __waterbody_name_pooltype, 40 /* sizeof(char [40]) */, "wall of %s", hliquid("water"));
        return __waterbody_name_pooltype;
    } else if (ltyp == LAVAWALL) {
        nh_snprintf("waterbody_name", 606, __waterbody_name_pooltype, 40 /* sizeof(char [40]) */, "wall of %s", hliquid("lava"));
        return __waterbody_name_pooltype;
    }
    /* default; should be unreachable */
    /* don't hallucinate this as some other liquid */
    return "water";
}
/* 1: more than 1000 turns left */
/* 5:   1..14 turns left; matches Warning on ice */
const __ice_descr_icetyp = ["solid", "sturdy", "steady", "unsteady", "thin", "slushy"];
export function ice_descr(x, y, outbuf) {
    /* same formula as is used in distant_name() for objects */
    let r = (game.u.xray_range > 2) ? game.u.xray_range : 2;
    let neardist = (r * r) * 2 - r;
    /* secondary output, for 'mention_decor' */
    game.iflags.ice_rating = -1;
    if (((game.level.locations[x][y].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[x][y].flags) : game.level.locations[x][y].typ) != ICE) {
        outbuf = sprintf(outbuf, "[ice:%d?]", game.level.locations[x][y].typ);
    } else if ((dist2((x), (y), game.u.ux, game.u.uy) > neardist || (!((game.viz_array[y][x] & 2) != 0) && (!((x) == game.u.ux && (y) == game.u.uy) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)))) && !game.decor_levitate_override) {
        outbuf = strcpy(outbuf, waterbody_name(x, y));
    } else {
        let time_left = spot_time_left(x, y, MELT_ICE_AWAY);
        /* other, real ice thickness/strength terminology exists but seems
           to be too unfamiliar for nethack's use */
        game.iflags.ice_rating = !time_left ? 0 : (time_left > 1000) ? 1 : (time_left > 100) ? 2 : (time_left > 50) ? 3 : (time_left > 14) ? 4 : 5;
        outbuf = sprintf(outbuf, "%s %s", __ice_descr_icetyp[game.iflags.ice_rating], waterbody_name(x, y));
    }
    return outbuf;
}
/*
 * Return the name of the glyph found at (x,y).
 * If not hallucinating and the glyph is a monster, also monster data.
 */
export function lookat(x, y, buf, monbuf) {
    let mtmp = null;
    let pm = null;
    let glyph = 0;
    buf[0] = monbuf[0] = 0;
    /* trapped doors and chests used to be shown as fake bear traps;
       they have their own trap types now but aren't part of the ftrap
       chain; usually they revert to normal door or chest when the hero
       sees them but player might be using '^' while the hero is blind */
    glyph = glyph_at(x, y);
    if (((x) == game.u.ux && (y) == game.u.uy) && ((((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || game.u.uswallow || (!(((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) && !game.u.uundetected)) || ((game.u.uprops[TELEPAT].extrinsic) || (game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic))) && !(game.iflags.save_uswallow && glyph == (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((game.u.ustuck).data).pmidx)) + (((game.u.ustuck).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF))) && (!game.iflags.terrainmode || (game.iflags.terrainmode & 8) != 0)) {
        self_lookat(buf);
        /* file lookup can't distinguish between "gnomish wizard" monster
           and correspondingly named player character, always picking the
           former; force it to find the general "wizard" entry instead */
        if ((game.urole.mnum == (PM_WIZARD)) && (game.urace.mnum == (PM_GNOME)) && !(game.u.umonnum != game.u.umonster)) {
            pm = game.mons[PM_WIZARD];
        }
        if (((((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) || game.u.uundetected) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uswallow || game.iflags.save_uswallow)) {
            /* When you see yourself normally, no explanation is appended
           (even if you could also see yourself via other means).
           Sensing self while blind or swallowed is treated as if it
           were by normal vision (cf canseeself()). */
            let how = 0;
            if ((game.u.uprops[INFRAVISION].intrinsic || game.u.uprops[INFRAVISION].extrinsic)) {
                how |= 1;
            }
            if ((game.u.uprops[TELEPAT].extrinsic)) {
                how |= 2;
            }
            if ((game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic)) {
                how |= 4;
            }
            if (how) {
                buf = (buf || '') + sprintf('', " [seen: %s%s%s%s%s]", (how & 1) ? "infravision" : "", ((how & 3) > 2) ? ", " : "", (how & 2) ? "telepathy" : "", ((how & 7) > 4) ? ", " : "", (how & 4) ? "monster detection" : "");
            }
        }
    } else if (game.u.uswallow) {
        buf = sprintf(buf, "interior of %s", mon_nam(game.u.ustuck));
        /* add comma if telep and infrav */
        /* add comma if detect and (infrav or telep or both) */
        /* when swallowed, we're only called for spots adjacent to hero,
           and blindness doesn't prevent hero from feeling what holds him */
        pm = game.u.ustuck.data;
    } else if (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
        if ((mtmp = (game.level.monsters[x][y])) != null) {
            look_at_monster(buf, monbuf, mtmp, x, y);
            pm = mtmp.data;
        } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            buf = strcpy(buf, rndmonnam(null));
        }
    } else if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
        /* 'monster' must actually be a statue */
        look_at_object(buf, x, y, glyph);
    } else if (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1)))) {
        let tnum = (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) ? (((((glyph) - (GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + S_arrow_trap) - S_arrow_trap + 1)) : MAX_GLYPH);
        trap_description(buf, tnum, x, y);
    } else if (((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6))) {
        let warnindx = (((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6)) ? ((glyph) - GLYPH_WARNING_OFF) : 0);
        buf = strcpy(buf, def_warnsyms[warnindx].explanation);
    } else if (((glyph) == GLYPH_INVIS_OFF)) {
        buf = strcpy(buf, invisexplain);
    } else if (((glyph) == GLYPH_NOTHING_OFF)) {
        buf = strcpy(buf, "dark part of a room");
    } else if (((glyph) == GLYPH_UNEXPLORED_OFF)) {
        /* redundant; handled by caller */
        if ((game.u.uinwater) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            buf = strcpy(buf, ((dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2)) ? "land" : "unknown");
        } else {
            buf = strcpy(buf, "unexplored area");
        }
    } else if (((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1)))) {
        /* "unknown" == previously mapped but not visible when
               submerged; better terminology appreciated... */
        let amsk = 0;
        let algn = 0;
        let symidx = glyph_to_cmap(glyph);
        switch (symidx) {
            case S_altar:
                amsk = altarmask_at(x, y);
                algn = (((((amsk & 7) & 7) == 0) ? (-128) : (((amsk & 7) & 7) == 4) ? 1 : (((amsk & 7) & 7)) - 2));
                buf = sprintf(buf, "%s %saltar", ((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) && !(dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2) && (amsk & 16)) ? "aligned" : align_str(algn), (amsk & 16) ? "high " : "");
                break;
            case S_ndoor:
                if (is_drawbridge_wall(x, y) >= 0) {
                    buf = strcpy(buf, "open drawbridge portcullis");
                } else if ((game.level.locations[x][y].flags & ~16) == 1) {
                    buf = strcpy(buf, "broken door");
                } else {
                    buf = strcpy(buf, "doorway");
                }
                break;
            case S_cloud:
                buf = strcpy(buf, (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) ? "cloudy area" : "fog/vapor cloud");
                break;
            case S_pool:
            case S_water:
            case S_lava:
            case S_lavawall:
            case S_ice:
                buf = strcpy(buf, waterbody_name(x, y));
                break;
            case S_engroom:
            case S_engrcorr:
                buf = strcpy(buf, "engraving");
                break;
            case S_stone:
                if (!game.level.locations[x][y].seenv) {
                    buf = strcpy(buf, "unexplored");
                    /* was Plane of Water, now that or "wall of water" */
                    /* for hallucination; otherwise defsyms[] would be fine */
                    /* "unknown" == previously mapped but not visible when
                   submerged; better terminology appreciated... */
                    break;
                } else if ((game.u.uinwater) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
                    buf = strcpy(buf, ((dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2)) ? "land" : "unknown");
                    break;
                } else if (game.level.locations[x][y].typ == STONE || game.level.locations[x][y].typ == SCORR) {
                    buf = strcpy(buf, "stone");
                    break;
                }
                ;
            default:
                buf = strcpy(buf, defsyms[symidx].explanation);
                break;
        }
    /* not mon, obj, trap, or cmap */
    } else {
        buf = strcpy(buf, "unexplored area");
    }
    return (pm && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? pm : null;
}
/* used to decide whether the context-sensitive inventory action menu for
   item 'otmp' should include the "/ - look up this item" choice */
export function ia_checkfile(otmp) {
    let itemnam = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    itemnam = strcpy(itemnam, singular(otmp, xname));
    /* singular() of xname() of otmp is what "/i" looks up */
    return checkfile(itemnam, null, chkfilIaCheck | chkfilDontAsk, null);
}
/*
 * Look in the "data" file for more info.  Called if the user typed in the
 * whole name (user_typed_name == TRUE), or we've found a possible match
 * with a character/glyph and flags.help is TRUE.
 *
 * NOTE: when (user_typed_name == FALSE), inp is considered read-only and
 *       must not be changed directly, e.g. via lcase(). We want to force
 *       lcase() for data.base lookup so that we can have a clean key.
 *       Therefore, we create a copy of inp _just_ for data.base lookup.
 *
 * Returns True if an entry is found, False otherwise.
 */
/* string to look up */
/* monster type to look up (overrides 'inp') */
export function checkfile(inp, pm, chkflags, supplemental_name) {
    let fp = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let newstr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let givenname = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ep = null;
    let dbase_str = null;
    let user_typed_name = 0;
    let without_asking = 0;
    let ia_checking = 0;
    let txt_offset = 0;
    let datawin = 0;
    let res = 0;
    /* checkfile-skip-impossible fix */
    let __skip_impossible = (0);
    bad_data_file: {
        user_typed_name = (chkflags & chkfilUsrTyped) != 0;
        without_asking = (chkflags & chkfilDontAsk) != 0;
        ia_checking = (chkflags & chkfilIaCheck) != 0;
        txt_offset = 0;
        datawin = (-1);
        res = (0);
        fp = fopen("data", "r");
        if (!fp) {
            pline("Cannot open 'data' file!");
            return res;
        }
        if (!inp || strlen(inp) > (256 - 1)) {
            /* If someone passed us garbage, prevent fault. */
            impossible("bad do_look buffer passed (%s)!", !inp ? "null" : "too long");
            __skip_impossible = (1); break bad_data_file;
        }
        if (pm != null && !user_typed_name) {
            dbase_str = strcpy(newstr, pm.pmnames[NEUTRAL]);
        /* To prevent the need for entries in data.base like *ngel to account
     * for Angel and angel, make the lookup string the same for both
     * user_typed_name and picked name.
     */
        } else {
            dbase_str = strcpy(newstr, inp);
        }
        dbase_str = lcase(dbase_str);
        /*
     * TODO:
     * The switch from xname() to doname_vague_quan() in look_at_obj()
     * had the unintended side-effect of making names picked from
     * pointing at map objects become harder to simplify for lookup.
     * We should split the prefix and suffix handling used by wish
     * parsing and also wizmode monster generation out into separate
     * routines and use those routines here.  This currently lacks
     * erosion handling and probably lots of other bits and pieces
     * that wishing already understands and most of this duplicates
     * stuff already done for wish handling or monster generation.
     */
        if (!strncmp(dbase_str, "interior of ", 12)) {
            dbase_str += 12;
        }
        if (!strncmp(dbase_str, "a ", 2)) {
            dbase_str += 2;
        } else if (!strncmp(dbase_str, "an ", 3)) {
            dbase_str += 3;
        } else if (!strncmp(dbase_str, "the ", 4)) {
            dbase_str += 4;
        } else if (!strncmp(dbase_str, "some ", 5)) {
            dbase_str += 5;
        } else if (digit(dbase_str)) {
            /* remove count prefix ("2 ya") which can come from looking at map */
            while (digit(dbase_str)) {
                /* remove enchantment ("+0 aklys"); [for 3.6.0 and earlier, this wasn't
       needed because looking at items on the map used xname() rather than
       doname() hence known enchantment was implicitly suppressed] */
                ++dbase_str;
            }
            if (dbase_str == 32) {
                ++dbase_str;
            }
        }
        if (!strncmp(dbase_str, "pair of ", 8)) {
            dbase_str += 8;
        }
        if (!strncmp(dbase_str, "tame ", 5)) {
            dbase_str += 5;
        } else if (!strncmp(dbase_str, "peaceful ", 9)) {
            dbase_str += 9;
        }
        if (!strncmp(dbase_str, "invisible ", 10)) {
            dbase_str += 10;
        }
        if (!strncmp(dbase_str, "saddled ", 8)) {
            dbase_str += 8;
        }
        if (!strncmp(dbase_str, "blessed ", 8)) {
            dbase_str += 8;
        } else if (!strncmp(dbase_str, "uncursed ", 9)) {
            dbase_str += 9;
        } else if (!strncmp(dbase_str, "cursed ", 7)) {
            dbase_str += 7;
        }
        if (!strncmp(dbase_str, "empty ", 6)) {
            dbase_str += 6;
        }
        if (!strncmp(dbase_str, "partly used ", 12)) {
            dbase_str += 12;
        } else if (!strncmp(dbase_str, "partly eaten ", 13)) {
            dbase_str += 13;
        }
        if (!strncmp(dbase_str, "statue of ", 10)) {
            dbase_str[6] = 0;
        } else if (!strncmp(dbase_str, "figurine of ", 12)) {
            dbase_str[8] = 0;
        }
        if (dbase_str && strchr("+-", dbase_str[0]) && digit(dbase_str[1])) {
            ++dbase_str;
            while (digit(dbase_str)) {
                ++dbase_str;
            }
            if (dbase_str == 32) {
                ++dbase_str;
            }
        }
        /* "towel", "wet towel", and "moist towel" share one data.base entry;
       for "wet towel", we keep prefix so that the prompt will ask about
       "wet towel"; for "moist towel", we also want to ask about "wet towel".
       (note: strncpy() only terminates output string if the specified
       count is bigger than the length of the substring being copied) */
        if (!strncmp(dbase_str, "moist towel", 11)) {
            memcpy(dbase_str += 2, "wet", 3);
        }
        if (dbase_str) {
            /* Make sure the name is non-empty. */
            let pass1offset = -1;
            let chk_skip = 0;
            let pass = 1;
            let yes_to_moreinfo = 0;
            let found_in_file = 0;
            let pass1found_in_file = 0;
            let skipping_entry = 0;
            let sp = null;
            let ap = null;
            let alt = null;
            if ((ep = strstri(dbase_str, " named ")) != null) {
                /* adjust the input to remove "named " and "called " */
                alt = ep + 7;
                if ((ap = strstri(dbase_str, " called ")) != null && ap < ep) {
                    ep = ap;
                }
            } else if ((ep = strstri(dbase_str, " called ")) != null) {
                /* "named" is alt but truncate at "called" */
                givenname = copynchars(givenname, ep + 8, 256 - 1);
                alt = givenname;
                if (supplemental_name && (sp = strstri(inp, " called ")) != null) {
                    supplemental_name = copynchars(supplemental_name, sp + 8, 256 - 1);
                }
            } else {
                ep = strstri(dbase_str, ", ");
            }
            if (ep && ep > dbase_str) {
                /* for 'm' prefix, where 'reslt' has an embedded newline to
               indicate and separate two lines of output; we add a comma to
               first line so that the combination is a complete sentence */
                /* replace embedded newline with end of first line */
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            }
            /* remove article from 'alt' name ("a pair of lenses named
           The Eyes of the Overworld" simplified above to "lenses named
           The Eyes of the Overworld", now reduced to "The Eyes of the
           Overworld", skip "The" as with base name processing) */
            if (alt && (!strncmpi(alt, "a ", 2) || !strncmpi(alt, "an ", 3) || !strncmpi(alt, "the ", 4))) {
                alt = strchr(alt, 32) + 1;
            }
            /* remove charges or "(lit)" or wizmode "(N aum)" */
            if ((ep = strstri(dbase_str, " (")) != null && ep > dbase_str) {
        dbase_str = (typeof dbase_str === 'string') ? dbase_str.slice(0, dbase_str.length - ep.length) : dbase_str;
    }
            if (alt && (ap = strstri(alt, " (")) != null && ap > alt) {
                alt = nh_strchr_truncate(alt, " (", 'stri');
            }
            /* If the object's name matches the player-specified fruitname,
           then "fruit" is the alternate description. We do this here so that
           if the fruit name is an extant object, looking at the fruit yields
           that object's description. */
            if (!alt && fruit_from_name(dbase_str, (1), null)) {
                alt = strcpy(newstr, game.obj_descr[SLIME_MOLD].oc_name);
            } else if (!alt) {
                alt = makesingular(dbase_str);
            }
            pass1found_in_file = (0);
            for (pass = !strcmp(alt, dbase_str) ? 0 : 1; pass >= 0; --pass) {
                /*
         * If the object is named, then the name is the alternate description;
         * otherwise, the result of makesingular() applied to the name is.
         * This isn't strictly optimal, but named objects of interest to the
         * user will usually be found under their name, rather than under
         * their object type, so looking for a singular form is pointless.
         */
                found_in_file = skipping_entry = (0);
                txt_offset = 0;
                if (fseek(fp, txt_offset, 0) < 0) {
                    impossible("can't get to start of 'data' file");
                    __skip_impossible = (1); break bad_data_file;
                }
                if (!fgets(buf, 256, fp) || !fgets(buf, 256, fp)) {
                    /* skip first record; read second */
                    impossible("can't read 'data' file");
                    __skip_impossible = (1); break bad_data_file;
                } else if (sscanf(buf, "%8lx\n", txt_offset) < 1 || txt_offset == 0) {
                    break bad_data_file;
                }
                while (fgets(buf, 256, fp)) {
                    /* look for the appropriate entry */
                    if (buf == 46) {
                        break;
                    }
                    if (digit(buf)) {
                        /* we passed last entry without success */
                        /* a number indicates the end of current entry */
                        skipping_entry = (0);
                    } else if (!skipping_entry) {
                        if (!(ep = strchr(buf, 10))) {
                            break bad_data_file;
                        }
                        strip_newline((ep > buf) ? ep - 1 : ep);
                        /* if we match a key that begins with "~", skip
                       this entry */
                        chk_skip = (buf == 126) ? 1 : 0;
                        if ((pass == 0 && pmatch(buf[chk_skip], dbase_str)) || (pass == 1 && alt && pmatch(buf[chk_skip], alt))) {
                            if (chk_skip) {
                                skipping_entry = (1);
                                continue;
                            } else {
                                found_in_file = (1);
                                if (pass == 1) {
                                    pass1found_in_file = (1);
                                }
                                break;
                            }
                        }
                    }
                }
                if (found_in_file) {
                    let entry_offset = 0;
                    let fseekoffset = 0;
                    let entry_count = 0;
                    let i = 0;
                    /* skip over other possible matches for the info */
                    do {
                        if (!fgets(buf, 256, fp)) {
                            break bad_data_file;
                        }
                    } while (!digit(buf));
                    if (sscanf(buf, "%ld,%d\n", entry_offset, entry_count) < 2) {
                        break bad_data_file;
                    }
                    fseekoffset = txt_offset + entry_offset;
                    if (pass == 1) {
                        pass1offset = fseekoffset;
                    } else if (fseekoffset == pass1offset) {
                        __skip_impossible = (1); break bad_data_file;
                    }
                    yes_to_moreinfo = (0);
                    if (!user_typed_name && !without_asking) {
                        let entrytext = pass ? alt : dbase_str;
                        let question = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        question = strcpy(question, "More info about \"");
                        copynchars(eos(question), entrytext, (128 /* sizeof(char [128]) */ - 1 - (strlen(question) + 2)));
                        question = strcat(question, "\"?");
                        if (yn_function(question, ynchars, 110, (1)) == 121) {
                            yes_to_moreinfo = (1);
                        }
                    }
                    if (user_typed_name || without_asking || yes_to_moreinfo) {
                        if (fseek(fp, fseekoffset, 0) < 0) {
                            pline("? Seek error on 'data' file!");
                            __skip_impossible = (1); break bad_data_file;
                        }
                        res = (1);
                        if (ia_checking) {
                            __skip_impossible = (1); break bad_data_file;
                        }
                        datawin = (game.windowprocs.win_create_nhwindow)(4);
                        for (i = 0; i < entry_count; i++) {
                            /* room for 1-tab or 8-space prefix + BUFSZ-1 + \0 */
                            let tabbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            let tp = null;
                            if (!fgets(tabbuf, 256, fp)) {
                                break bad_data_file;
                            }
                            tp = tabbuf;
                            if (!strchr(tp, 10)) {
                                break bad_data_file;
                            }
                            tp = strip_newline(tp);
                            if (tp == 9) {
                                ++tp;
                            } else if (tp == 32) {
                                /* text in this file is indented with one tab but
                           someone modifying it might use spaces instead */
                                /* remove up to 8 spaces (we expect 8-column
                               tab stops but user might have them set at
                               something else so we don't require it) */
                                do {
                                    ++tp;
                                } while (tp < tabbuf[8] && tp == 32);
                            } else if (tp) {
                                break bad_data_file;
                            }
                            /* if a tab after the leading one is found,
                           convert tabs into spaces; the attributions
                           at the end of quotes typically have them */
                            if (strchr(tp, 9) != null) {
                                tp = tabexpand(tp);
                            }
                            (game.windowprocs.win_putstr)(datawin, 0, tp);
                        }
                        (game.windowprocs.win_display_nhwindow)(datawin, (0));
                        (game.windowprocs.win_destroy_nhwindow)(datawin) , datawin = (-1);
                    }
                } else if (user_typed_name && pass == 0 && !pass1found_in_file) {
                    pline("You don't have any information on those things.");
                }
            }
        }
        __skip_impossible = (1); break bad_data_file;
    }
    if (!__skip_impossible) {
        impossible("'data' file in wrong format or corrupted");
    }
    checkfile_done: {
    }
    if (datawin != (-1)) {
        (game.windowprocs.win_destroy_nhwindow)(datawin);
    }
    fclose(fp);
    return res;
}
/* extracted from do_screen_description() */
/* number of matching descriptions so far */
/* cmap index into defsyms[] */
/* map glyph of screen symbol being described;
                         * anything other than NO_GLYPH implies 'looked' */
/* 0: (none), 1: a/an, 2: the */
/* map location */
/* description of defsyms[idx] */
/* text to insert in front of first match */
/* input/output: True if a trap has been described */
/* output: pointer to 1st matching description */
/* input/output: current description gets appended */
export function add_cmap_descr(found, idx, glyph, article, cc, x_str, prefix, hit_trap, firstmatch, out_str) {
    let mbuf = null;
    let p = null;
    let absidx = abs(idx);
    if (glyph == MAX_GLYPH) {
        if (!strcmp(x_str, "water")) {
            /* use x_str [almost] as-is */
            /* duplicate some transformations performed by waterbody_name() */
            if (idx == S_pool) {
                x_str = "pool of water";
            } else if (idx == S_water) {
                x_str = !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? "wall of water" : "limitless water";
            }
        }
        if (absidx == S_pool) {
            /* force fake negative moat value to be positive */
            idx = S_pool;
        }
    } else if (absidx == S_pool || idx == S_water || idx == S_lava || idx == S_lavawall || idx == S_ice) {
        /* replace some descriptions (x_str) with waterbody_name() */
        let save_ltyp = game.level.locations[cc.x][cc.y].typ;
        let save_prop = game.u.uprops[HALLUC_RES].extrinsic;
        /* grab a scratch buffer we can safely return (via *firstmatch
           when applicable) */
        mbuf = mon_nam(game.youmonst);
        if (absidx == S_pool) {
            game.level.locations[cc.x][cc.y].typ = (idx == S_pool) ? POOL : MOAT;
            idx = S_pool;
        } else {
            game.level.locations[cc.x][cc.y].typ = (idx == S_water) ? WATER : (idx == S_lava) ? LAVAPOOL : (idx == S_lavawall) ? LAVAWALL : ICE;
        }
        game.u.uprops[HALLUC_RES].extrinsic = 1;
        mbuf = strcpy(mbuf, waterbody_name(cc.x, cc.y));
        game.u.uprops[HALLUC_RES].extrinsic = save_prop;
        game.level.locations[cc.x][cc.y].typ = save_ltyp;
        /* shorten the feedback for farlook/quicklook: "pool or ..." */
        if (!strcmp(mbuf, "pool of water")) {
            mbuf[4] = 0;
        } else if (!strcmp(mbuf, "molten lava")) {
            mbuf = strcpy(mbuf, "lava");
        }
        x_str = mbuf;
        /* avoid "an ice" and so forth; "a pool", "a moat", and
           "a wall of ..." are grammatically correct but make
           "a pool or a moat or a wall of water" become too verbose */
        article = !(!strncmp(x_str, "water", 5) || !strncmp(x_str, "ice", 3) || !strncmp(x_str, "pool", 4) || !strncmp(x_str, "moat", 4) || !strncmp(x_str, "lava", 4) || !strncmp(x_str, "swamp", 5) || !strncmp(x_str, "molten", 6) || !strncmp(x_str, "shallow", 7) || !strncmp(x_str, "limitless", 9) || !strncmp(x_str, "wall of lava", 12) || !strncmp(x_str, "wall of water", 13) || !strncmp(x_str, "frozen", 6) || ((p = strchr(x_str, 32)) != null && !strncmpi((p), (" ice"), -1)));
    }
    if (!found) {
        if (((idx) >= S_arrow_trap && (idx) < S_arrow_trap + (TRAPNUM - 1)) && idx != S_vibrating_square) {
            out_str = sprintf(out_str, "%sa trap", prefix);
            /* thawing ice ("solid ice", "thin ice", &c) */
            hit_trap.value = (1);
        } else {
            out_str = sprintf(out_str, "%s%s", prefix, (article == 2) ? the(x_str) : (article == 1) ? an(x_str) : x_str);
        }
        firstmatch.value = x_str;
        found = 1;
    } else if (!(hit_trap.value && ((idx) >= S_arrow_trap && (idx) < S_arrow_trap + (TRAPNUM - 1))) && !(found >= 3 && ((idx) >= S_vodbridge && (idx) <= S_hcdbridge)) && (idx != S_vibrating_square || In_hell(game.u.uz) || (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) && (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) ? (((((glyph) - (GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + S_arrow_trap) - S_arrow_trap + 1)) : MAX_GLYPH) == VIBRATING_SQUARE))) {
        /* don't mention vibrating square outside of Gehennom
                  unless this happens to be one (hallucination?) */
        /* append unless out_str already contains the string to append */
        found += append_str(out_str, (article == 2) ? the(x_str) : (article == 1) ? an(x_str) : x_str);
        if (((idx) >= S_arrow_trap && (idx) < S_arrow_trap + (TRAPNUM - 1)) && idx != S_vibrating_square) {
            hit_trap.value = (1);
        }
    }
    return found;
}
const __do_screen_description_mon_interior = "the interior of a monster";
const __do_screen_description_unreconnoitered = "unreconnoitered";
let __do_screen_description_look_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function do_screen_description(cc, looked, sym, out_str, firstmatch, for_supplement) {
    let prefix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let j = 0;
    let alt_i = 0;
    let glyph = 0;
    let skipped_venom = 0;
    let found = 0;
    let hit_trap = 0;
    let need_to_look = 0;
    let submerged = 0;
    let hallucinate = 0;
    let x_str = null;
    let tmpsym = 0;
    let glyphinfo = { glyph: 0, ttychar: 0, framecolor: 0, gm: { glyphflags: 0, sym: { color: 0, symidx: 0 }, customcolor: 0, color256idx: 0, tileidx: 0, u: null } };
    /* didlook-skip-monsters fix */
    let __skip_monster_class = (0);
    check_monsters: {
        glyph = MAX_GLYPH;
        skipped_venom = 0;
        found = 0;
        /* count of matching syms found */
        need_to_look = (0);
        submerged = ((game.u.uinwater) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))));
        hallucinate = ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !game.program_state.gameover);
        glyphinfo = nul_glyphinfo;
        if (looked) {
            glyph = glyph_at(cc.x, cc.y);
            /* Convert glyph at selected position to a symbol for use below. */
            map_glyphinfo(cc.x, cc.y, glyph, 0, glyphinfo);
            sym = glyphinfo.ttychar;
            prefix = sprintf(prefix, "%s        ", encglyph(glyphinfo.glyph));
        } else {
            prefix = sprintf(prefix, "%c        ", sym);
        }
        /*
     * Check all the possibilities, saving all explanations in a buffer.
     * When all have been checked then the string is printed.
     */
        /*
     * Handle restricted vision range (limited to adjacent spots when
     * swallowed or underwater) cases first.
     *
     * 3.6.0 listed anywhere on map, other than self, as "interior
     * of a monster" when swallowed, and non-adjacent water or
     * non-water anywhere as "dark part of a room" when underwater.
     * "unreconnoitered" is an attempt to convey "even if you knew
     * what was there earlier, you don't know what is there in the
     * current circumstance".
     *
     * (Note: 'self' will always be visible when swallowed so we don't
     * need special swallow handling for <ux,uy>.
     * Another note: for '#terrain' without monsters, u.uswallow and
     * submerged will always both be False and skip this code.)
     */
        x_str = null;
        if (!looked) {
            ;
        } else if (((game.u.uswallow || submerged) && !(dist2(((cc.x)), ((cc.y)), game.u.ux, game.u.uy) <= 2)) || ((game.iflags.terrainmode & (32 | 1)) == 32 && glyph == (((S_stone) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_stone) <= S_trwall) ? ((S_stone) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_stone) < S_altar) ? (((S_stone) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_stone) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_stone) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_stone) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_stone) <= S_goodpos) ? (((S_stone) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH))) {
            /* detection showing some category, so mostly background */
            x_str = __do_screen_description_unreconnoitered;
            need_to_look = (0);
        } else if (is_swallow_sym(sym)) {
            x_str = __do_screen_description_mon_interior;
            /* for specific monster type */
            need_to_look = (1);
        }
        if (x_str) {
            if (!found) {
                out_str = sprintf(out_str, "%s%s", prefix, x_str);
                /* we know 'found' is zero here, but guard against some other
           special case being inserted ahead of us someday */
                firstmatch.value = x_str;
                found++;
            } else {
                found += append_str(out_str, x_str);
            }
            /* for is_swallow_sym(), we want to list the current symbol's
           other possibilities (wand for '/', throne for '\\', &c) so
           don't jump to the end for the x_str==mon_interior case */
            if (x_str == __do_screen_description_unreconnoitered) {
                __skip_monster_class = (1);
            }
        }
    }
    /* check_monsters-rerun fix — wrap monster + obj + symX-override
       loop in a do-while so pet/hero override `goto check_monsters`
       back-jumps become __rerun_monsters re-iterations. */
    let __rerun_monsters = (0);
    do {
        __rerun_monsters = (0);
    if (!__skip_monster_class && (!game.iflags.terrainmode || (game.iflags.terrainmode & 8) != 0)) {
        for (i = 1; i < MAXMCLASSES; i++) {
            if (i == S_invisible) {
                continue;
            }
            if (sym == (looked ? game.showsyms[i + (((0) + MAXPCHARS) + MAXOCLASSES)] : def_monsyms[i].sym) && def_monsyms[i].explain && def_monsyms[i].explain) {
                need_to_look = (1);
                if (!found) {
                    out_str = sprintf(out_str, "%s%s", prefix, an(def_monsyms[i].explain));
                    firstmatch.value = def_monsyms[i].explain;
                    found++;
                } else {
                    found += append_str(out_str, an(def_monsyms[i].explain));
                }
            }
        }
        /* handle '@' as a special case if it refers to you and you're
           playing a character which isn't normally displayed by that
           symbol; firstmatch is assumed to already be set for '@' */
        if ((looked ? (sym == game.showsyms[S_HUMAN + (((0) + MAXPCHARS) + MAXOCLASSES)] && ((cc.x) == game.u.ux && (cc.y) == game.u.uy)) : (sym == def_monsyms[S_HUMAN].sym && !game.flags.showrace)) && !((game.urace.mnum == (PM_HUMAN)) || (game.urace.mnum == (PM_ELF))) && !(game.u.umonnum != game.u.umonster)) {
            found += append_str(out_str, "you");
        }
    }
    didlook: {
        if (!game.iflags.terrainmode || (game.iflags.terrainmode & 4) != 0) {
            let oc_ptr = null;
            let bouldersym = 0;
            j = SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6);
            bouldersym = (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) ? game.ov_rogue_syms[j] : game.ov_primary_syms[j];
            if (!bouldersym) {
                bouldersym = def_oc_syms[ROCK_CLASS].sym;
            }
            for (i = 1; i < MAXOCLASSES; i++) {
                if ((i != ROCK_CLASS) ? (sym == (looked ? game.showsyms[i + ((0) + MAXPCHARS)] : def_oc_syms[i].sym)) : ((((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || sym == bouldersym)) {
                    /* ROCK_CLASS is complicated; statues are displayed as the
                   monster they depict rather than as S_rock; boulders might
                   be displayed as a custom symbol rather than as S_rock */
                    oc_ptr = def_oc_syms[i].explain;
                    if (i == ROCK_CLASS && !strcmp(oc_ptr, "boulder or statue")) {
                        /* for added fun, engravings are shown with the same symbol
                   as S_rock which is why we want to shorten this */
                        if (sym == bouldersym) {
                            oc_ptr = "boulder";
                        } else if ((((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS)))))) {
                            oc_ptr = "statue";
                        } else if (looked) {
                            continue;
                        }
                    }
                    need_to_look = (1);
                    if (looked && i == VENOM_CLASS) {
                        skipped_venom++;
                        continue;
                    }
                    if (!found) {
                        out_str = sprintf(out_str, "%s%s", prefix, an(oc_ptr));
                        /* note: if the value assigned to *firstmatch ever
                       becomes dynamically constructed, it will need to be
                       copied into a static buffer; as of now, all alternate
                       values are string literals and implicitly static */
                        firstmatch.value = oc_ptr;
                        found++;
                    } else {
                        found += append_str(out_str, an(oc_ptr));
                    }
                }
            }
        }
        if (sym == DEF_INVISIBLE) {
            /* for active clairvoyance, use alternate "unseen creature" */
            let usealt = (game.u.uprops[DETECT_MONSTERS].extrinsic & 536870912) != 0;
            let unseen_explain = (usealt || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? altinvisexplain : invisexplain;
            if (!found) {
                out_str = sprintf(out_str, "%s%s", prefix, an(unseen_explain));
                firstmatch.value = unseen_explain;
                found++;
            } else {
                found += append_str(out_str, an(unseen_explain));
            }
        }
        if ((glyph && ((glyph) == GLYPH_NOTHING_OFF)) || (looked && sym == game.showsyms[SYM_NOTHING + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)])) {
            x_str = "the dark part of a room";
            if (!found) {
                out_str = sprintf(out_str, "%s%s", prefix, x_str);
                firstmatch.value = x_str;
                found++;
            } else {
                found += append_str(out_str, x_str);
            }
        }
        if ((glyph && ((glyph) == GLYPH_UNEXPLORED_OFF)) || (looked && sym == game.showsyms[SYM_UNEXPLORED + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)])) {
            x_str = "unexplored";
            if (submerged) {
                x_str = "land";
            }
            if (!found) {
                out_str = sprintf(out_str, "%s%s", prefix, x_str);
                firstmatch.value = x_str;
                found++;
            } else {
                found += append_str(out_str, x_str);
            }
        }
        for (hit_trap = (0) , i = 0; i < MAXPCHARS; i++) {
            /* Now check for graphics symbols */
            /*
         * Index hackery:  we want
         *   "pool or moat or wall of water or lava or wall of lava"
         * rather than
         *   "pool or moat or lava or wall of lava or wall of water"
         * but S_lava comes before S_water so 'i' reaches it sooner.
         * Use 'alt_i' for the rest of the loop to behave as if their
         * places were swapped.
         * This was much simpler when it just exchanged water and lava.
         * Now it rotates water to the first of (lava, lavawall, water)
         * lava to the middle of (lava, lavawall, water), and lavawall
         * to last of (lava, lavawall, water); other values are used
         * as-is.
         * If S_water (and corresponding tile) were renumbered, this
         * hackery could go away.
         */
            /* do water first (of these 3) */
            alt_i = (i == S_lava) ? S_water : (i == S_lavawall) ? S_lava : (i == S_water) ? S_lavawall : i;
            /* other; handle in defsyms[] order */
            x_str = defsyms[alt_i].explanation;
            /* cmap includes beams, shield effects, swallow boundaries, and
           explosions; skip all of those */
            if (!x_str) {
                continue;
            }
            if (sym == (looked ? game.showsyms[alt_i] : defsyms[alt_i].sym)) {
                /* article==2 => "the", 1 => "an", 0 => (none) */
                let article = 0;
                /* check if dark part of a room was already included above */
                if (alt_i == S_darkroom && glyph && ((glyph) == GLYPH_NOTHING_OFF)) {
                    continue;
                }
                /* avoid "an unexplored", "an stone", "an air",
               "a floor of a room", "a dark part of a room" */
                article = strstri(x_str, " of a room") ? 2 : !(alt_i == S_stone || strcmp(x_str, "air") == 0 || strcmp(x_str, "land") == 0);
                found = add_cmap_descr(found, alt_i, glyph, article, cc, x_str, prefix, { get value() { return hit_trap; }, set value(_v) { hit_trap = _v; } }, firstmatch, out_str);
                if (alt_i == S_pool) {
                    /* "pool of water" and "moat" use the same symbol and glyph
                   but have different descriptions; when handling pool, add
                   it a second time for moat but pass an alternate symbol;
                   skip incrementing 'found' to avoid "can be many things" */
                    add_cmap_descr(found, -S_pool, glyph, 1, cc, "moat", prefix, { get value() { return hit_trap; }, set value(_v) { hit_trap = _v; } }, firstmatch, out_str);
                    need_to_look = (1);
                }
                /* 'need_to_look' to report engraving */
                if (alt_i == S_altar || ((alt_i) >= S_arrow_trap && (alt_i) < S_arrow_trap + (TRAPNUM - 1)) || (hallucinate && (alt_i == S_water || alt_i == S_lava || alt_i == S_lavawall || alt_i == S_ice)) || alt_i == S_engroom || alt_i == S_engrcorr || alt_i == S_grave) {
                    need_to_look = (1);
                }
            }
        }
        for (i = 1; i < 6; i++) {
            /* Now check for warning symbols */
            x_str = def_warnsyms[i].explanation;
            if (sym == (looked ? game.warnsyms[i] : def_warnsyms[i].sym)) {
                if (!found) {
                    out_str = sprintf(out_str, "%s%s", prefix, x_str);
                    firstmatch.value = x_str;
                    ;
                    found++;
                } else {
                    found += append_str(out_str, x_str);
                }
                /* Kludge: warning trumps boulders on the display.
               Reveal the boulder too or player can get confused */
                if (looked && sobj_at(BOULDER, cc.x, cc.y)) {
                    out_str = strcat(out_str, " co-located with a boulder");
                }
                break;
            }
        }
        if (skipped_venom && found < 2) {
            /* if we ignored venom and list turned out to be short, put it back */
            x_str = def_oc_syms[VENOM_CLASS].explain;
            if (!found) {
                out_str = sprintf(out_str, "%s%s", prefix, an(x_str));
                firstmatch.value = x_str;
                found++;
            } else {
                found += append_str(out_str, an(x_str));
            }
        }
        for (j = (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6); j < ((((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6) + MAXOTHER); ++j) {
            /* Finally, handle some optional overriding symbols */
            if (j == SYM_INVISIBLE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6) || j == SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)) {
                continue;
            }
            tmpsym = (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) ? game.ov_rogue_syms[j] : game.ov_primary_syms[j];
            if (tmpsym && sym == tmpsym) {
                switch (j) {
                    case SYM_PET_OVERRIDE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6):
                        if (looked) {
                            /* convert to symbol without override in effect */
                            map_glyphinfo(cc.x, cc.y, glyph, 1, glyphinfo);
                            sym = glyphinfo.ttychar;
                            __rerun_monsters = (1);
                        }
                        break;
                    case SYM_HERO_OVERRIDE + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6):
                        sym = game.showsyms[S_HUMAN + (((0) + MAXPCHARS) + MAXOCLASSES)];
                        __rerun_monsters = (1);
                }
            }
            if (__rerun_monsters) break;
        }
        /*
     * If we are looking at the screen, follow multiple possibilities or
     * an ambiguous explanation by something more detailed.
     */
        if (found > 4) {
            out_str = sprintf(out_str, "%scan be many things", prefix);
        }
    }
    } while (__rerun_monsters);
    if (looked) {
        /* 3.6.3: this used to be "That can be many things" (without prefix)
           which turned it into a sentence that lacked its terminating period;
           we could add one below but reinstating the prefix here is better */
        let pm = null;
        if (found > 1 || need_to_look) {
            let monbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let temp_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            pm = lookat(cc.x, cc.y, __do_screen_description_look_buf, monbuf);
            if (pm && for_supplement) {
                for_supplement.value = pm;
            }
            if (!strcmp(__do_screen_description_look_buf, "ice")) {
                ice_descr(cc.x, cc.y, __do_screen_description_look_buf);
            }
            if (!strcmp(__do_screen_description_look_buf, "staircase down") && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level)) && !ok_to_quest()) {
                __do_screen_description_look_buf = strcpy(__do_screen_description_look_buf, "blocked staircase down");
            }
            if (__do_screen_description_look_buf[0] != 0) {
                firstmatch.value = __do_screen_description_look_buf;
            }
            if ((firstmatch.value)) {
                temp_buf = sprintf(temp_buf, " (%s", firstmatch.value);
                add_quoted_engraving(cc.x, cc.y, temp_buf, (0));
                temp_buf = strcat(temp_buf, ")");
                out_str = strncat(out_str, temp_buf, 256 - strlen(out_str) - 1);
                /* we have something to look up */
                found = 1;
            }
            if (monbuf[0]) {
                nh_snprintf("do_screen_description", 1619, temp_buf, 256 /* sizeof(char [256]) */, " [seen: %s]", monbuf);
                out_str = strncat(out_str, temp_buf, 256 - strlen(out_str) - 1);
            }
        }
    }
    return found;
}
/* when farlook is reporting on an engraving, include its text */
/* True: '/e' or '/E', False: '//' or ';' */
export function add_quoted_engraving(x, y, buf, force) {
    let temp_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ep = engr_at(x, y);
    let floorengr = !strcmp(buf, " (engraving");
    let headstone = !strcmp(buf, " (grave");
    /*
     * If there is no engraving here, there's nothing to do; just return.
     *
     * When buf[] is " (engraving" or " (grave" then we're looking at an
     * engraving and we'll add its text.  Caller supplies the closing paren.
     *
     * If buf[] contains anything else, we're looking at something (monster
     * or object) that happens to be on top of an engraving, so we won't
     * append the engraving text.
     */
    if (!ep) {
        return (0);
    }
    if (!floorengr && !headstone && !force) {
        return (0);
    }
    if (ep.eread) {
        nh_snprintf("add_quoted_engraving", 1660, temp_buf, 256 /* sizeof(char [256]) */, " with %s: \"%s\"", headstone ? "headstone reading" : "remembered text", ep.engr_txt[remembered_text]);
    } else {
        nh_snprintf("add_quoted_engraving", 1663, temp_buf, 256 /* sizeof(char [256]) */, " %s you haven't read", headstone ? "whose headstone" : "that");
    }
    buf = strncat(buf, temp_buf, 256 - strlen(buf) - 1);
    return (1);
}
/* also used by getpos hack in getpos.c */
export const what_is_a_location = "a monster, object or location";
export function do_look(mode, click_cc) {
    /* use cursor; don't search for "more info" */
    let quick = (mode == 1);
    /* right mouse-click method */
    let clicklook = (mode == 2);
    let out_str = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let cq = { typ: 0, key: 0, dirx: 0, diry: 0, dirz: 0, intval: 0, ec_entry: null, next: null };
    let cmdq = null;
    let firstmatch = null;
    let pm = null;
    let supplemental_pm = null;
    let i = 0;
    let ans = 0;
    /* typed symbol or converted glyph */
    let sym = 0;
    let found = 0;
    /* screen pos of unknown glyph */
    let cc = { x: 0, y: 0 };
    /* saved value of flags.verbose */
    let save_verbose = 0;
    /* question from the screen */
    let from_screen = 0;
    let clr = 8;
    cc.x = 0;
    cc.y = 0;
    let __from_cmdq = false;
    if ((cmdq = cmdq_pop()) != null) {
        Object.assign(cq, cmdq);
        free(cmdq);
        if (cq.typ == CMDQ_KEY) {
            i = cq.key;
        } else {
            cmdq_clear(CQ_CANNED);
        }
        __from_cmdq = true;
    }
    if (!clicklook || __from_cmdq) {
        if (!__from_cmdq) {
            if (quick) {
                i = 121;
            } else {
                let pick_list = null;
                let win = 0;
                let any = 0;
                any = cg.zeroany;
                win = (game.windowprocs.win_create_nhwindow)(4);
                (game.windowprocs.win_start_menu)(win, 0);
                /*
             * Originally this was just a y|n question about whether to
             * use the cursor or to type a word.  When other choices were
             * added, it was changed to be a menu.  Using 'y' and 'n' as
             * unshown accelerators keeps backwards compatibility with
             * the old y|n behavior.
             *
             * Initially the menu included a third choice and always used
             * 'a', 'b', and 'c'.  Then it was changed to be controlled by
             * the 'lootabc' option instead, defaulting to '/', 'i', '?'
             * when that's false.  Eventually additional entries have been
             * introduced.
             *
             * When lootabc is set, abandon the 'y'|'n' compatibility in
             * favor of newer '/' and '?' compatibility instead.
             */
                any.a_char = 47;
                add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? 47 : 121, 0, clr, "something on the map", 0);
                any.a_char = 105;
                add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, 0, 0, clr, "something you're carrying", 0);
                any.a_char = 63;
                add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? 63 : 110, 0, clr, "something else (by symbol or name)", 0);
                if (!game.u.uswallow && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    /* [don't use 'i' as lootabc group accelerator because
                        it will make the regular 'i' choice inaccessible] */
                    any = cg.zeroany;
                    add_menu_str(win, "");
                    /* these options work sensibly for swallowed case, but
                   there's no reason for player to use them then because
                   the swallowed display hides all applicable targets;
                   objects work fine when hallucinating, but screen
                   symbol/monster class letter doesn't match up with
                   bogus monster type, so suppress when hallucinating */
                    any.a_char = 109;
                    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? any.a_char : 0, 0, clr, "nearby monsters", 0);
                    any.a_char = 77;
                    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? any.a_char : 0, 0, clr, "all monsters shown on map", 0);
                    any.a_char = 111;
                    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? any.a_char : 0, 0, clr, "nearby objects", 0);
                    any.a_char = 79;
                    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? any.a_char : 0, 0, clr, "all objects shown on map", 0);
                    any.a_char = 116;
                    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? any.a_char : 94, 0, clr, "nearby traps", 0);
                    any.a_char = 84;
                    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? any.a_char : 34, 0, clr, "all seen or remembered traps", 0);
                    any.a_char = 101;
                    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? 0 : 96, 0, clr, "nearby engravings", 0);
                    any.a_char = 69;
                    add_menu(win, nul_glyphinfo, any, game.flags.lootabc ? 0 : any.a_char, game.flags.lootabc ? any.a_char : 124, 0, clr, "all seen or remembered engravings", 0);
                }
                (game.windowprocs.win_end_menu)(win, "What do you want to look at:");
                if (select_menu(win, 1, pick_list) > 0) {
                    /* [don't use 'e' as lootabc group accelerator] */
                    i = pick_list.item.a_char;
                    free(pick_list);
                }
                (game.windowprocs.win_destroy_nhwindow)(win);
            }
        }
        switch (i) {
            default:
            case 113:
                /* list all traps (visible or remembered) */
                /* list all engravings (visible|remembered) */
                /* trap ID'd, but no time elapses */
                return 0;
            case 121:
            case 47:
                from_screen = (1);
                sym = 0;
                cc.x = game.u.ux;
                cc.y = game.u.uy;
                break;
            case 105:
{
                    let invlet = 0;
                    let invobj = null;
                    invlet = display_inventory(null, (1));
                    if (!invlet || invlet == 27) {
                        return 0;
                    }
                    out_str = '';
                    for (invobj = game.invent; invobj; invobj = invobj.nobj) {
                        if (invobj.invlet == invlet) {
                            out_str = strcpy(out_str, singular(invobj, xname));
                            break;
                        }
                    }
                    if (out_str) {
                        /* remove leading and trailing whitespace and
                   condense consecutive internal whitespace */
                        /* user typed in a complete string */
                        checkfile(out_str, pm, chkfilUsrTyped | chkfilDontAsk, null);
                    }
                    return 0;
                }
            case 63:
                from_screen = (0);
                getlin("Specify what? (type the word)", out_str);
                if (strcmp(out_str, " ")) {
                    out_str = mungspaces(out_str);
                }
                if (out_str[0] == 0 || out_str[0] == 27) {
                    return 0;
                }
                if (out_str[1]) {
                    checkfile(out_str, pm, chkfilUsrTyped | chkfilDontAsk, null);
                    return 0;
                }
                sym = out_str[0];
                break;
            case 109:
                look_all((1), (1));
                return 0;
            case 77:
                look_all((0), (1));
                return 0;
            case 111:
                look_all((1), (0));
                return 0;
            case 79:
                look_all((0), (0));
                return 0;
            case 116:
                look_traps((1));
                return 0;
            case 84:
                look_traps((0));
                return 0;
            case 101:
                look_engrs((1));
                return 0;
            case 69:
                look_engrs((0));
                return 0;
        }
    } else {
        cc.x = click_cc.x;
        cc.y = click_cc.y;
        sym = 0;
        from_screen = (0);
    }
    /* Save the verbose flag, we change it later. */
    save_verbose = game.flags.verbose;
    game.flags.verbose = game.flags.verbose && !quick;
    do {
        pm = null;
        out_str[0] = 0;
        if (from_screen || clicklook) {
            if (from_screen) {
                /*
     * The user typed one letter, or we're identifying from the screen.
     */
                if (game.flags.verbose) {
                    pline("Please move the cursor to %s.", what_is_a_location);
                } else {
                    pline("Pick %s.", what_is_a_location);
                }
                ans = getpos(cc, quick, what_is_a_location);
                if (ans < 0 || cc.x < 0) {
                    break;
                }
                /* only print long question once */
                game.flags.verbose = (0);
            }
        }
        found = do_screen_description(cc, (from_screen || clicklook), sym, out_str, { get value() { return firstmatch; }, set value(_v) { firstmatch = _v; } }, { get value() { return supplemental_pm; }, set value(_v) { supplemental_pm = _v; } });
        if (found) {
            (game.windowprocs.win_putmixed)(game.WIN_MESSAGE, 0, out_str);
/* Finally, print out our explanation. */
/* use putmixed() because there may be an encoded glyph present */
{
                let dmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                /* putmixed() bypasses pline() so doesn't write to DUMPLOG;
                   tty puts it into ^P recall, so it ought to be there;
                   DUMPLOG is plain text, so override graphics character;
                   at present, force space, but we ought to use defsyms[]
                   value for the glyph the graphics character came from */
                decode_mixed(dmpbuf, out_str);
                if (dmpbuf[0] < 32 || dmpbuf[0] >= 127) {
                    dmpbuf[0] = 32;
                }
                dumplogmsg(dmpbuf);
            }
            if (found == 1 && ans != LOOK_QUICK && ans != LOOK_ONCE && (ans == LOOK_VERBOSE || (game.flags.help && !quick)) && !clicklook) {
                /* check the data file for information about this thing */
                let temp_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let supplemental_name = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                supplemental_name[0] = 0;
                temp_buf = strcpy(temp_buf, firstmatch);
                checkfile(temp_buf, pm, (ans == LOOK_VERBOSE) ? chkfilDontAsk : chkfilNone, supplemental_name);
                if (supplemental_pm) {
                    do_supplemental_info(supplemental_name, supplemental_pm, (ans == LOOK_VERBOSE));
                }
            }
        } else {
            pline("I've never heard of such things.");
        }
    } while (from_screen && !quick && ans != LOOK_ONCE && !clicklook);
    game.flags.verbose = save_verbose;
    return 0;
}
export function look_region_nearby(lo_x, lo_y, hi_x, hi_y, nearby) {
    lo_y.value = nearby ? ((game.u.uy - 8) > (0) ? (game.u.uy - 8) : (0)) : 0;
    lo_x.value = nearby ? ((game.u.ux - 8) > (1) ? (game.u.ux - 8) : (1)) : 1;
    hi_y.value = nearby ? ((game.u.uy + 8) < (21 - 1) ? (game.u.uy + 8) : (21 - 1)) : 21 - 1;
    hi_x.value = nearby ? ((game.u.ux + 8) < (80 - 1) ? (game.u.ux + 8) : (80 - 1)) : 80 - 1;
}
/* RESTORE is after do_supplemental_info() */
/* True => within BOLTLIM, False => entire map */
/* True => monsters, False => objects */
export function look_all(nearby, do_mons) {
    let win = 0;
    let glyph = 0;
    let count = 0;
    let x = 0;
    let y = 0;
    let lo_x = 0;
    let lo_y = 0;
    let hi_x = 0;
    let hi_y = 0;
    let lookbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let outbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    win = (game.windowprocs.win_create_nhwindow)(5);
    look_region_nearby({ get value() { return lo_x; }, set value(_v) { lo_x = _v; } }, { get value() { return lo_y; }, set value(_v) { lo_y = _v; } }, { get value() { return hi_x; }, set value(_v) { hi_x = _v; } }, { get value() { return hi_y; }, set value(_v) { hi_y = _v; } }, nearby);
    for (y = lo_y; y <= hi_y; y++) {
        for (x = lo_x; x <= hi_x; x++) {
            /*assert(lo_x >= 1 && lo_y >= 0 && hi_x < MAXCO && hi_y < MAXLI);*/
            lookbuf[0] = 0;
            glyph = glyph_at(x, y);
            if (do_mons) {
                if (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
                    let mtmp = null;
                    if (((x) == game.u.ux && (y) == game.u.uy) && ((((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || game.u.uswallow || (!(((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) && !game.u.uundetected)) || ((game.u.uprops[TELEPAT].extrinsic) || (game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic)))) {
                        self_lookat(lookbuf);
                        /* remembered, unseen, creature */
                        /* engraving or grave+headstone shown on the map */
                        ++count;
                    } else if ((mtmp = (game.level.monsters[x][y])) != null) {
                        look_at_monster(lookbuf, null, mtmp, x, y);
                        ++count;
                    }
                } else if (((glyph) == GLYPH_INVIS_OFF)) {
                    lookbuf = strcpy(lookbuf, invisexplain);
                    ++count;
                } else if (((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6))) {
                    let warnindx = (((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6)) ? ((glyph) - GLYPH_WARNING_OFF) : 0);
                    lookbuf = strcpy(lookbuf, def_warnsyms[warnindx].explanation);
                    ++count;
                }
            } else {
                if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
                    look_at_object(lookbuf, x, y, glyph);
                    ++count;
                }
            }
            if (lookbuf) {
                let coordbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let which = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let cmode = 0;
                cmode = (game.iflags.getpos_coords != 110) ? game.iflags.getpos_coords : 109;
                if (count == 1) {
                    which = strcpy(which, do_mons ? "monsters" : "objects");
                    if (nearby) {
                        outbuf = sprintf(outbuf, "%s currently shown near %s:", upstart(which), (cmode != 99) ? coord_desc(game.u.ux, game.u.uy, coordbuf, cmode) : !((((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || game.u.uswallow || (!(((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) && !game.u.uundetected)) || ((game.u.uprops[TELEPAT].extrinsic) || (game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic))) ? "your position" : "you");
                    } else {
                        outbuf = sprintf(outbuf, "All %s currently shown on the map:", which);
                    }
                    (game.windowprocs.win_putstr)(win, 0, outbuf);
                    /* hack alert! Qt watches a text window for any line
                       with 4 consecutive spaces and renders the window
                       in a fixed-width font it if finds at least one */
                    (game.windowprocs.win_putstr)(win, 0, "    ");
                }
                coord_desc(x, y, coordbuf, cmode);
                /* this format wrinkle makes the commas of <x,y> line up;
                   it isn't needed when all the y values have same number
                   of digits but looks better when there is a mixture of 1
                   and 2 digit values; done unconditionally because we
                   would need two passes over the map to determine whether
                   y width is uniform or a mixture; x width is not a factor
                   because the result gets right-justified by %8s; adding
                   a trailing space effectively pushes non-space text left */
                if (cmode == 109 && y < 10) {
                    coordbuf = strkitten(coordbuf, 32);
                }
                outbuf = sprintf(outbuf, (cmode == 115) ? "%s  " : (cmode == 109) ? "%8s  " : "%12s  ", coordbuf);
                outbuf = (outbuf || '') + sprintf('', "%s  ", encglyph(glyph));
                /* guard against potential overflow */
                lookbuf[256 /* sizeof(char [256]) */ - 1 - strlen(outbuf)] = 0;
                outbuf = strcat(outbuf, lookbuf);
                (game.windowprocs.win_putmixed)(win, 0, outbuf);
            }
        }
    }
    if (count) {
        (game.windowprocs.win_display_nhwindow)(win, (1));
    /* prefix: "coords  C  " where 'C' is mon or obj symbol */
    } else {
        pline("No %s are currently shown %s.", do_mons ? "monsters" : "objects", nearby ? "nearby" : "on the map");
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
}
/* give a /M style display of discovered traps, even when they're covered */
export function look_traps(nearby) {
    let win = 0;
    let t = null;
    let glyph = 0;
    let tnum = 0;
    let count = 0;
    let x = 0;
    let y = 0;
    let lo_x = 0;
    let lo_y = 0;
    let hi_x = 0;
    let hi_y = 0;
    let lookbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let outbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    win = (game.windowprocs.win_create_nhwindow)(5);
    look_region_nearby({ get value() { return lo_x; }, set value(_v) { lo_x = _v; } }, { get value() { return lo_y; }, set value(_v) { lo_y = _v; } }, { get value() { return hi_x; }, set value(_v) { hi_x = _v; } }, { get value() { return hi_y; }, set value(_v) { hi_y = _v; } }, nearby);
    for (y = lo_y; y <= hi_y; y++) {
        for (x = lo_x; x <= hi_x; x++) {
            lookbuf[0] = 0;
            glyph = glyph_at(x, y);
            if (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1)))) {
                tnum = (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) ? (((((glyph) - (GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + S_arrow_trap) - S_arrow_trap + 1)) : MAX_GLYPH);
                trap_description(lookbuf, tnum, x, y);
                ++count;
            } else if ((t = t_at(x, y)) != null && t.tseen && ((!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) || ((game.viz_array[y][x] & 1) != 0))) {
                lookbuf = strcpy(lookbuf, trapname(t.ttyp, (0)));
                lookbuf = (lookbuf || '') + sprintf('', ", obscured by %s", encglyph(glyph));
                /* can't use /" to track traps moved by bubbles or
                          clouds except when hero has direct line of sight */
                glyph = ((((S_arrow_trap + (((t).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((t).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((t).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((t).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((t).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((t).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((t).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
                ++count;
            }
            if (lookbuf) {
                let coordbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let cmode = 0;
                cmode = (game.iflags.getpos_coords != 110) ? game.iflags.getpos_coords : 109;
                if (count == 1) {
                    outbuf = sprintf(outbuf, "%sseen or remembered traps%s:", nearby ? "nearby " : "", nearby ? "" : " on this level");
                    (game.windowprocs.win_putstr)(win, 0, upstart(outbuf));
                    (game.windowprocs.win_putstr)(win, 0, "    ");
                }
                outbuf = sprintf(outbuf, (cmode == 115) ? "%s  " : (cmode == 109) ? "%8s  " : "%12s  ", coord_desc(x, y, coordbuf, cmode));
                outbuf = (outbuf || '') + sprintf('', "%s  ", encglyph(glyph));
                lookbuf[256 /* sizeof(char [256]) */ - 1 - strlen(outbuf)] = 0;
                outbuf = strcat(outbuf, lookbuf);
                (game.windowprocs.win_putmixed)(win, 0, outbuf);
            }
        }
    }
    if (count) {
        (game.windowprocs.win_display_nhwindow)(win, (1));
    /* prefix: "coords  C  " where 'C' is trap symbol */
    } else {
        pline("No traps seen or remembered%s.", nearby ? " nearby" : "");
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
}
/* display of discovered engravings including headstones, even when they're
   covered provided they've been read */
export function look_engrs(nearby) {
    let win = 0;
    let e = null;
    let lookbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let outbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let x = 0;
    let y = 0;
    let lo_x = 0;
    let lo_y = 0;
    let hi_x = 0;
    let hi_y = 0;
    let is_headstone = 0;
    let sym = 0;
    let glyph = 0;
    let count = 0;
    win = (game.windowprocs.win_create_nhwindow)(5);
    look_region_nearby({ get value() { return lo_x; }, set value(_v) { lo_x = _v; } }, { get value() { return lo_y; }, set value(_v) { lo_y = _v; } }, { get value() { return hi_x; }, set value(_v) { hi_x = _v; } }, { get value() { return hi_y; }, set value(_v) { hi_y = _v; } }, nearby);
    for (y = lo_y; y <= hi_y; y++) {
        for (x = lo_x; x <= hi_x; x++) {
            lookbuf[0] = 0;
            if (!game.level.locations[x][y].seenv) {
                continue;
            }
            /* this won't find remembered engravings which aren't there
               anymore (in case the hero is unaware that they're gone;
               scuffed away by monster movement or deleted during shop
               or vault wall repair); not sure what to do about that */
            e = engr_at(x, y);
            if (!e) {
                continue;
            }
            is_headstone = ((game.lastseentyp[x][y]) == GRAVE);
            lookbuf = sprintf(lookbuf, " (%s", is_headstone ? "grave" : "engraving");
            add_quoted_engraving(x, y, lookbuf, (1));
            if (is_headstone) {
                /* the paren is used by farlook and add_quoted_engraving()
               expected to see it; we don't want it here */
                lookbuf = strsubst(lookbuf, "(grave with ", "");
                lookbuf = strsubst(lookbuf, "(grave whose ", "");
            } else {
                lookbuf = strsubst(lookbuf, "(engraving with ", "");
                lookbuf = strsubst(lookbuf, "(engraving ", "engraving ");
            }
            glyph = glyph_at(x, y);
            sym = ((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) ? glyph_to_cmap(glyph) : SYM_NOTHING;
            if (((sym) == S_engroom || (sym) == S_engrcorr) || sym == S_grave) {
                ++count;
            } else {
                nh_snprintf("look_engrs", 2190, eos(lookbuf), 256 /* sizeof(char [256]) */ - strlen(lookbuf), ", obscured by %s", encglyph(glyph));
                /* engraving or grave covered by object(s) */
                glyph = is_headstone ? (((S_grave) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_grave) <= S_trwall) ? ((S_grave) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_grave) < S_altar) ? (((S_grave) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_grave) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_grave) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_grave) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_grave) <= S_goodpos) ? (((S_grave) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH) : (((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) <= S_trwall) ? ((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) < S_altar) ? (((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) < S_arrow_trap + (TRAPNUM - 1)) ? (((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) - S_grave) + GLYPH_CMAP_B_OFF) : ((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) <= S_goodpos) ? (((((game.level.locations[(e).engr_x][(e).engr_y].typ == CORR) ? S_engrcorr : S_engroom)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
                ++count;
            }
            if (lookbuf) {
                let coordbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let cmode = 0;
                cmode = (game.iflags.getpos_coords != 110) ? game.iflags.getpos_coords : 109;
                if (count == 1) {
                    outbuf = sprintf(outbuf, "%sseen or remembered engravings%s:", nearby ? "nearby " : "", nearby ? "" : " on this level");
                    (game.windowprocs.win_putstr)(win, 0, upstart(outbuf));
                    (game.windowprocs.win_putstr)(win, 0, "    ");
                }
                outbuf = sprintf(outbuf, (cmode == 115) ? "%s  " : (cmode == 109) ? "%8s  " : "%12s  ", coord_desc(x, y, coordbuf, cmode));
                outbuf = (outbuf || '') + sprintf('', "%s ", encglyph(glyph));
                lookbuf[256 /* sizeof(char [256]) */ - 1 - strlen(outbuf)] = 0;
                outbuf = strcat(outbuf, lookbuf);
                (game.windowprocs.win_putmixed)(win, 0, outbuf);
            }
        }
    }
    if (count) {
        (game.windowprocs.win_display_nhwindow)(win, (1));
    /* prefix: "coords  C  " where 'C' is engrvng|grave symbol */
    } else {
        pline("No engravings seen or remembered%s.", nearby ? " nearby" : "");
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
}
const suptext1 = ["%s is a member of a marauding horde of orcs", "rumored to have brutally attacked and plundered", "the ordinarily sheltered town that is located ", "deep within The Gnomish Mines.", "", "The members of that vicious horde proudly and ", "defiantly acclaim their allegiance to their", "leader %s in their names.", null];
const suptext2 = ["\"%s\" is the common dungeon name of", "a nefarious orc who is known to acquire property", "from thieves and sell it off for profit.", "", "The perpetrator was last seen hanging around the", "stairs leading to the Gnomish Mines.", null];
export function do_supplemental_info(name, pm, without_asking) {
    let textp = null;
    let datawin = (-1);
    let entrytext = name;
    let bp = null;
    let bp2 = null;
    let question = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let yes_to_moreinfo = (0);
    let is_marauder = (((pm).mflags2 & 128) != 0);
    if (is_marauder && (strlen(name) < (256 - 1))) {
        /*
     * Provide some info on some specific things
     * meant to support in-game mythology, and not
     * available from data.base or other sources.
     */
        let fullname = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        bp = strstri(name, " of ");
        bp2 = strstri(name, " the Fence");
        if (bp || bp2) {
            fullname = strcpy(fullname, name);
            if (!without_asking) {
                question = strcpy(question, "More info about \"");
                copynchars(eos(question), entrytext, (128 /* sizeof(char [128]) */ - 1 - (strlen(question) + 2)));
                question = strcat(question, "\"?");
                if (yn_function(question, ynchars, 110, (1)) == 121) {
                    yes_to_moreinfo = (1);
                }
            }
            if (yes_to_moreinfo) {
                let i = 0;
                let subs = 0;
                let gang = null;
                if (bp) {
                    textp = suptext1;
                    gang = bp + 4;
                    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
                } else {
                    textp = suptext2;
                    gang = "";
                }
                datawin = (game.windowprocs.win_create_nhwindow)(4);
                for (i = 0; textp[i]; i++) {
                    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    let txt = null;
                    if (strstri(textp[i], "%s") != null) {
                        buf = sprintf(buf, textp[i], subs++ ? gang : fullname);
                        txt = buf;
                    } else {
                        txt = textp[i];
                    }
                    (game.windowprocs.win_putstr)(datawin, 0, txt);
                }
                (game.windowprocs.win_display_nhwindow)(datawin, (0));
                (game.windowprocs.win_destroy_nhwindow)(datawin) , datawin = (-1);
            }
        }
    }
}
/* the #whatis command */
export function dowhatis() {
    return do_look(0, null);
}
/* the #glance command */
export function doquickwhatis() {
    return do_look(1, null);
}
/* the #showtrap command */
export function doidtrap() {
    let trap = null;
    let tt = 0;
    let glyph = 0;
    let x = 0;
    let y = 0;
    if (!getdir("^")) {
        return 2;
    }
    x = game.u.ux + game.u.dx;
    y = game.u.uy + game.u.dy;
    glyph = glyph_at(x, y);
    if (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) && ((tt = (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) ? (((((glyph) - (GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + S_arrow_trap) - S_arrow_trap + 1)) : MAX_GLYPH)) == BEAR_TRAP || tt == TRAPPED_DOOR || tt == TRAPPED_CHEST)) {
        let chesttrap = trapped_chest_at(tt, x, y);
        if (chesttrap || trapped_door_at(tt, x, y)) {
            pline("That is a trapped %s.", chesttrap ? "chest" : "door");
            return 0;
        }
    }
    for (trap = game.ftrap; trap; trap = trap.ntrap) {
        if (trap.tx == x && trap.ty == y) {
            if (!trap.tseen) {
                break;
            }
            tt = trap.ttyp;
            if (game.u.dz) {
                if (game.u.dz < 0 ? ((tt) == HOLE || (tt) == TRAPDOOR) : tt == ROCKTRAP) {
                    break;
                }
            }
            pline("That is %s%s%s.", an(trapname(tt, (0))), !trap.madeby_u ? "" : (tt == WEB) ? " woven" : (tt == HOLE || tt == PIT) ? " dug" : " set", !trap.madeby_u ? "" : " by you");
            return 0;
        }
    }
    pline("I can't see a trap there.");
    return 0;
}
/*
    Implements a rudimentary if/elif/else/endif interpreter and use
    conditionals in dat/cmdhelp to describe what command each keystroke
    currently invokes, so that there isn't a lot of "(debug mode only)"
    and "(if number_pad is off)" cluttering the feedback that the user
    sees.  (The conditionals add quite a bit of clutter to the raw data
    but users don't see that.  number_pad produces a lot of conditional
    commands:  basic letters vs digits, 'g' vs 'G' for '5', phone
    keypad vs normal layout of digits, and QWERTZ keyboard swap between
    y/Y/^Y/M-y/M-Y/M-^Y and z/Z/^Z/M-z/M-Z/M-^Z.)

    The interpreter understands
     '&#' for comment,
     '&? option' for 'if' (also '&? !option'
                           or '&? option=value[,value2,...]'
                           or '&? !option=value[,value2,...]'),
     '&: option' for 'elif' (with argument variations same as 'if';
                             any number of instances for each 'if'),
     '&:' for 'else' (also '&: #comment';
                      0 or 1 instance for a given 'if'), and
     '&.' for 'endif' (also '&. #comment'; required for each 'if').

    The option handling is a bit of a mess, with no generality for
    which options to deal with and only a comma separated list of
    integer values for the '=value' part.  number_pad is the only
    supported option that has a value; the few others (wizard/debug,
    rest_on_space, #if SHELL, #if SUSPEND) are booleans.
*/
export function whatdoes_help() {
    let fp = null;
    let p = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tmpwin = 0;
    fp = fopen("keyhelp", "r");
    if (!fp) {
        pline("Cannot open \"%s\" data file!", "keyhelp");
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
        return;
    }
    tmpwin = (game.windowprocs.win_create_nhwindow)(5);
    while (fgets(buf, 256 /* sizeof(char [256]) */, fp)) {
        if (buf == 35) {
            continue;
        }
        for (p = buf; p; p++) {
            if (p != 32 && p != 9) {
                break;
            }
        }
        (game.windowprocs.win_putstr)(tmpwin, 0, p);
    }
    fclose(fp);
    (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
}
/* lint suppression */
/* we have a value specified */
/* handle a space before or after (or both) '=' (or ':') */
/* end of keyword in buf[] */
/* terminate keyword, advance to start of value */
/* convert internal encoding (separate yes/no and 0..3)
                   back to user-visible one (-1..4) */
/* 1..4 */
/* -1..0 */
/* == wizard */
/* should we also check sysopt.shellers? */
/* sysopt.shellers is also used for dosuspend()... */
/* this works for number_pad too: &? !number_pad:-1,0
           would be true for 1..4 after negation */
/* comment */
/* endif */
/* else or elif */
/* so that stack[*depth - 1] is a valid access */
/* if */
/* 0 */
export function dowhatdoes_core(q, cbuf) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ec_desc = null;
    if ((ec_desc = key2extcmddesc(q)) != (null)) {
        let keybuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        buf = sprintf(buf, "%-8s%s.", key2txt(q, keybuf), ec_desc);
        cbuf = strcpy(cbuf, buf);
        /* note: if "%-8s" gets changed, the "%8.8s" in dowhatdoes() will
           need a comparable change */
        return cbuf;
    }
    return null;
}
/* the whatdoes command */
let __dowhatdoes_once = (0);
export function dowhatdoes() {
    let bufr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let q = 0;
    let reslt = null;
    if (!__dowhatdoes_once) {
        pline("Ask about '&' or '?' to get more info.%s", game.iflags.altmeta ? "  (For ESC, type it twice.)" : "");
        __dowhatdoes_once = (1);
    }
    introff();
    q = yn_function("What command?", null, 0, (1));
    if (q == 27 && game.iflags.altmeta) {
        /* in an ideal world, we would know whether another keystroke
           was already pending, but this is not an ideal world...
           if user typed ESC, we'll essentially hang until another
           character is typed */
        q = yn_function("]", null, 0, (1));
        if (q != 27) {
            q = (q | 128);
        }
    }
    intron();
    reslt = dowhatdoes_core(q, bufr);
    if (reslt) {
        /* 'm' prefix has two lines of output */
        let p = strchr(reslt, 10);
        if (q == 38 || q == 63) {
            whatdoes_help();
        }
        if (!p) {
            /* normal usage; 'reslt' starts with key, some indentation, and
               then explanation followed by '.' for sentence punctuation */
            pline("%s", reslt);
        } else {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            pline("%s,", reslt);
            /* cheat by knowing how dowhatdoes_core() handles key portion */
            pline("%8.8s%s", reslt, p + 1);
        }
    } else {
        pline("No such command '%s', char code %d (0%03o or 0x%02x).", visctrl(q), q, q, q);
    }
    return 0;
}
export function docontact() {
    let cwin = (game.windowprocs.win_create_nhwindow)(5);
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (game.sysopt.support) {
        buf = sprintf(buf, "To contact local support, %s", game.sysopt.support);
        (game.windowprocs.win_putstr)(cwin, 0, buf);
        (game.windowprocs.win_putstr)(cwin, 0, "");
    } else if (game.sysopt.fmtd_wizard_list) {
        buf = sprintf(buf, "To contact local support, contact %s.", game.sysopt.fmtd_wizard_list);
        (game.windowprocs.win_putstr)(cwin, 0, buf);
        (game.windowprocs.win_putstr)(cwin, 0, "");
    }
    (game.windowprocs.win_putstr)(cwin, 0, "To contact the NetHack development team directly,");
    buf = sprintf(buf, "see the 'Contact' form on our website or email <%s>.", "devteam@nethack.org");
    (game.windowprocs.win_putstr)(cwin, 0, buf);
    (game.windowprocs.win_putstr)(cwin, 0, "");
    (game.windowprocs.win_putstr)(cwin, 0, "For more information on NetHack, or to report a bug,");
    buf = sprintf(buf, "visit our website \"%s\".", "https://www.nethack.org/");
    (game.windowprocs.win_putstr)(cwin, 0, buf);
    (game.windowprocs.win_display_nhwindow)(cwin, (0));
    (game.windowprocs.win_destroy_nhwindow)(cwin);
}
export function dispfile_help() {
    (game.windowprocs.win_display_file)("help", (1));
}
export function dispfile_shelp() {
    (game.windowprocs.win_display_file)("hh", (1));
}
export function dispfile_optionfile() {
    (game.windowprocs.win_display_file)("opthelp", (1));
}
export function dispfile_optmenu() {
    (game.windowprocs.win_display_file)("optmenu", (1));
}
export function dispfile_license() {
    (game.windowprocs.win_display_file)("license", (1));
}
export function dispfile_debughelp() {
    (game.windowprocs.win_display_file)("wizhelp", (1));
}
export function dispfile_usagehelp() {
    (game.windowprocs.win_display_file)("usagehlp", (1));
}
export function hmenu_doextversion() {
    doextversion();
}
export function hmenu_dohistory() {
    dohistory();
}
export function hmenu_dowhatis() {
    dowhatis();
}
export function hmenu_dowhatdoes() {
    dowhatdoes();
}
export function hmenu_doextlist() {
    doextlist();
}
export function domenucontrols() {
    let cwin = (game.windowprocs.win_create_nhwindow)(5);
    show_menu_controls(cwin, (0));
    (game.windowprocs.win_display_nhwindow)(cwin, (0));
    (game.windowprocs.win_destroy_nhwindow)(cwin);
}
/* data for dohelp() */
const help_menu_items = [{ f: hmenu_doextversion, text: "About NetHack (version information)." }, { f: dispfile_help, text: "Long description of the game and commands." }, { f: dispfile_shelp, text: "List of game commands." }, { f: hmenu_dohistory, text: "Concise history of NetHack." }, { f: hmenu_dowhatis, text: "Info on a character in the game display." }, { f: hmenu_dowhatdoes, text: "Info on what a given key does." }, { f: option_help, text: "List of game options." }, { f: dispfile_optionfile, text: "Longer explanation of game options." }, { f: dispfile_optmenu, text: "Using the %s command to set options." }, { f: dokeylist, text: "Full list of keyboard commands." }, { f: hmenu_doextlist, text: "List of extended commands." }, { f: domenucontrols, text: "List menu control keys." }, { f: dispfile_usagehelp, text: "Description of NetHack's command line." }, { f: dispfile_license, text: "The NetHack license." }, { f: docontact, text: "Support information." }, { f: dispfile_debughelp, text: "List of wizard-mode commands." }, { f: null, text: null }];
/* the #help command */
export function dohelp() {
    let tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    let helpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let n = 0;
    let selected = null;
    let any = 0;
    let sel = 0;
    let clr = 8;
    any = cg.zeroany;
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    for (i = 0; help_menu_items[i].text; i++) {
        if (!game.flags.debug && help_menu_items[i].f == dispfile_debughelp) {
            continue;
        }
        if (game.sysopt.hideusage && help_menu_items[i].f == dispfile_usagehelp) {
            continue;
        }
        if (help_menu_items[i].text[0] == 37) {
            helpbuf = sprintf(helpbuf, help_menu_items[i].text, "Unix");
        } else if (help_menu_items[i].f == dispfile_optmenu) {
            helpbuf = sprintf(helpbuf, help_menu_items[i].text, setopt_cmd(tmpbuf));
        } else {
            helpbuf = strcpy(helpbuf, help_menu_items[i].text);
        }
        any.a_int = i + 1;
        add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, helpbuf, 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Select one item:");
    n = select_menu(tmpwin, 1, selected);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (n > 0) {
        sel = selected[0].item.a_int - 1;
        free(selected);
        (help_menu_items[sel].f)();
    }
    return 0;
}
/* format the key or extended command name of command used to set options;
   normally 'O' but could be bound to something else, or not bound at all;
   with the implementation of a simple options subset, now need 'mO' to get
   the full options command; format it as 'm O' */
export function setopt_cmd(outbuf) {
    let cmdbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let cmdnm = null;
    let key = 0;
    outbuf = strcpy(outbuf, "'");
    key = cmd_from_func(doset);
    if (key) {
        outbuf = strcat(outbuf, visctrl(key));
    } else {
        /* extended command name, with leading "#" */
        cmdnm = cmdname_from_func(doset, cmdbuf, (1));
        if (!cmdnm) {
            cmdnm = "optionsfull";
        }
        outbuf = (outbuf || '') + sprintf('', "%s%.31s", (cmdnm != 35) ? "#" : "", cmdnm);
        outbuf = strcat(outbuf, "' or '");
        /* since there's no key bound to #optionsfull, include 'm O' */
        key = cmd_from_func(do_reqmenu);
        if (key) {
            outbuf = strcat(outbuf, visctrl(key));
        } else {
            /* extended command name for 'm' prefix */
            cmdnm = cmdname_from_func(do_reqmenu, cmdbuf, (1));
            if (!cmdnm) {
                cmdnm = "reqmenu";
            }
            outbuf = (outbuf || '') + sprintf('', "%s%.31s", (cmdnm != 35) ? "#" : "", cmdnm);
        }
        outbuf = strcat(outbuf, " ");
        /* this is slightly iffy because the user shouldn't type <space> to
           get the command we're describing, but it improves readability */
        /* now #options, normally 'O' */
        key = cmd_from_func(doset_simple);
        if (key) {
            outbuf = strcat(outbuf, visctrl(key));
        } else {
            cmdnm = cmdname_from_func(doset_simple, cmdbuf, (1));
            if (!cmdnm) {
                cmdnm = "options";
            }
            outbuf = (outbuf || '') + sprintf('', "%s%.31s", (cmdnm != 35) ? "#" : "", cmdnm);
        }
    }
    outbuf = strcat(outbuf, "'");
    return outbuf;
}
/* the 'V' command; also a choice for '?' */
export function dohistory() {
    (game.windowprocs.win_display_file)("history", (1));
    return 0;
}
/*pager.c*/
/* being blinded may hide invisibility from self */
/* might actually be a large box */
/* check TREE before STONE due to level.flags.arboreal */
/* "dangling": "hanging" could imply that it's growing on this tree */
/* seen by something other than normal vision */
/* "ice" or "frozen <liquid>" */
/* like endgame high priests, endgame high altars
                       are only recognizable when immediately adjacent */
/* we might be examining a pool location but trying to match
               water or lava; override the terrain with what we're matching
               because that's what waterbody_name() bases its result on;
               it's not pool so must be one of water/lava/ice to get here */
/* trap doors & spiked pits can't be made by
                           player, and should be considered at least
                           as much "set" as "dug" anyway */
/* NUL -> '@', ^A -> 'A', ... ^Z -> 'Z', ^[ -> '[', ... */
/*XXX overflow possibilities*/
