/* NetHack 5.0	detect.c	$NHDT-Date: 1763708572 2025/11/20 23:02:52 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.191 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2018. */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * Detection routines, including crystal ball, magic mapping, and search
 * command.
 */
/* for screen alert shown to player when secret door detection or ^E
   finds stuff; to use tmp_at() instead of flash_glyph_at(), define as 0;
   extra code for tmp_at() will be included and the flash_glyph_at()
   calls will execute but won't do anything */
import { game } from '../gstate.js';
import { memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, You_see, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcpy } from '../c2js-runtime/string.js';
import { spec_ability } from './artifact.js';
import { acurr, exercise } from './attrib.js';
import { isok, yn_function } from './cmd.js';
import { find_drawbridge, is_pool, open_drawbridge } from './dbridge.js';
import { c_common_strings, cg, quitchars } from './decl.js';
import { back_to_glyph, canseemon, cls, docrt, feel_location, feel_newsym, flash_glyph_at, flush_screen, glyph_at, magic_map_background, map_background, map_engraving, map_invisible, map_object, map_trap, mon_visible, newsym, see_monsters, sensemon, show_glyph, under_ground, under_water, unmap_invisible, unmap_object, warning_of, xy_set_wall_state } from './display.js';
import { cmd_safety_prevention } from './do.js';
import { Monnam, a_monnam, hcolor, x_monnam, y_monnam } from './do_name.js';
import { def_char_is_furniture, def_char_to_monclass, def_char_to_objclass, def_monsyms, def_oc_syms } from './drawing.js';
import { In_hell, In_mines, depth, on_level, room_discovered } from './dungeon.js';
import { engr_at } from './engrave.js';
import { getpos } from './getpos.js';
import { glyph_to_cmap } from './glyphs.js';
import { losehp, money_cnt, nomul } from './hack.js';
import { dist2, s_suffix } from './hacklib.js';
import { consume_obj_charge, currency, sobj_at, useup } from './invent.js';
import { expels } from './mhitu.js';
import { seemimic, wake_nearto } from './mon.js';
import { dmgtype_fromattack, resists_blnd } from './mondata.js';
import { closed_door } from './monmove.js';
import { ALTAR, A_INT, A_WIS, BEAR_TRAP, BLINDED, BOULDER, CHEST, CLAIRVOYANT, COIN_CLASS, CONFUSION, CORPSE, CORR, CRYSTAL_BALL, DBWALL, DEAF, DEF_MIMIC, DEF_MIMIC_DEF, DETECT_MONSTERS, DOOR, FIRST_OBJECT, FOOD_CLASS, FOOT, GLYPH_ALTAR_OFF, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_NOTHING_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_SWALLOW_OFF, GLYPH_UNEXPLORED_OFF, GLYPH_WARNING_OFF, GOLD, GOLD_PIECE, HALF_PHDAM, HALLUC, HALLUC_RES, LARGE_BOX, LAVAPOOL, LAVAWALL, LENSES, MALE, MAXMCLASSES, MAXOCLASSES, MAXPCHARS, MAX_GLYPH, M_AP_FURNITURE, M_AP_NOTHING, M_AP_OBJECT, NON_PM, NOSE, NO_PART, NUMMONS, NUM_OBJECTS, PM_GOLD_GOLEM, PM_LONG_WORM, PM_LONG_WORM_TAIL, PM_TENGU, POTION_CLASS, ROCK_CLASS, SCORR, SCROLL_CLASS, SDOOR, SPBOOK_CLASS, STAIRS, STATUE, STATUE_TRAP, STONE, STUNNED, SYM_BOULDER, S_EEL, S_GHOST, S_WORM_TAIL, S_altar, S_arrow_trap, S_cloud, S_corr, S_darkroom, S_digbeam, S_fountain, S_goodpos, S_grave, S_hcdoor, S_litcorr, S_ndoor, S_poisoncloud, S_room, S_stone, S_tree, S_trwall, S_upstair, S_vcdoor, S_vwall, TOE, TRAPNUM, TRAPPED_CHEST, TRAPPED_DOOR, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { Tobjnam, an, makeplural, the, xname } from './objnam.js';
import { Norep, There, set_msg_xy } from './pline.js';
import { body_part, poly_gender } from './polyself.js';
import { make_blinded, make_confused, make_hallucinated, strange_feeling } from './potion.js';
import { is_quest_artifact } from './questpgr.js';
import { visible_region_at } from './region.js';
import { rn2, rn2_on_display_rng, rnd, rnl } from './rnd.js';
import { findgold } from './steal.js';
import { activate_statue_trap, b_trapped, openfallingtrap, openholdingtrap, t_at, trapname } from './trap.js';
import { hidden_gold } from './vault.js';
import { do_clear_area, recalc_block_point, unblock_point } from './vision.js';
import { detect_wsegs } from './worm.js';
import { get_obj_location } from './zap.js';

/* dummytrap: used when detecting traps finds a door or chest trap; the
   couple of fields that matter are always re-initialized during use so
   this does not need to be part of 'struct instance_globals g'; fields
   that aren't used are compile-/link-/load-time initialized to 0 */
game.dummytrap = { ntrap: null, tx: 0, ty: 0, dst: { dnum: 0, dlevel: 0 }, launch: { x: 0, y: 0 }, ttyp: 0, tseen: 0, once: 0, madeby_u: 0, vl: { v_launch_otyp: 0, v_launch2: { x: 0, y: 0 }, v_conjoined: 0, v_tnote: 0 } };
/* data for enhanced feedback from findone() */
// struct found_things: { ft_cc, num_sdoors, num_scorrs, num_traps, num_mons, num_invis, num_cleared_invis, num_kept_invis }
/* for passing extra info to detect_obj_traps() */
/* wildcard class for clear_stale_map - this used to be used as a getobj()
   input but it's no longer used for that function */
/* bring hero out from underwater or underground or being engulfed;
   return True iff any change occurred */
export function unconstrain_map() {
    let res = game.u.uinwater || game.u.uburied || game.u.uswallow;
    /* bring Underwater, buried, or swallowed hero to normal map;
       bypass set_uinwater() */
    game.iflags.save_uinwater = game.u.uinwater , game.u.uinwater = 0;
    game.iflags.save_uburied = game.u.uburied , game.u.uburied = 0;
    game.iflags.save_uswallow = game.u.uswallow , game.u.uswallow = 0;
    return res;
}
/* put hero back underwater or underground or engulfed */
export function reconstrain_map() {
    /* if was in water and taken out, put back; bypass set_uinwater() */
    game.u.uinwater = game.iflags.save_uinwater , game.iflags.save_uinwater = 0;
    game.u.uburied = game.iflags.save_uburied , game.iflags.save_uburied = 0;
    game.u.uswallow = game.iflags.save_uswallow , game.iflags.save_uswallow = 0;
}
export async function map_redisplay() {
    reconstrain_map();
    await docrt();
    if ((game.u.uinwater)) {
        await under_water(2);
    }
    if (game.u.uburied) {
        await under_ground(2);
    }
}
/* use getpos()'s 'autodescribe' to view whatever is currently shown on map */
export async function browse_map(ter_typ, ter_explain) {
    /* don't care whether player actually picks a spot */
    let dummy_pos = { x: 0, y: 0 };
    let save_autodescribe = 0;
    /* starting spot for getpos() */
    dummy_pos.x = game.u.ux , dummy_pos.y = game.u.uy;
    save_autodescribe = game.iflags.autodescribe;
    game.iflags.autodescribe = (1);
    game.iflags.terrainmode = ter_typ;
    await getpos(dummy_pos, (0), ter_explain);
    game.iflags.terrainmode = 0;
    game.iflags.autodescribe = save_autodescribe;
}
/* extracted from monster_detection() so can be shared by do_vicinity_map() */
export async function map_monst(mtmp, showtail) {
    let glyph = ((def_monsyms[(mtmp.data).mlet].sym) == 32) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((mtmp).data).pmidx)) + (((mtmp).female == 0) ? GLYPH_DETECT_MALE_OFF : GLYPH_DETECT_FEM_OFF)) : mtmp.mtame ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((mtmp).data).pmidx)) + (((mtmp).female == 0) ? GLYPH_PET_MALE_OFF : GLYPH_PET_FEM_OFF)) : (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((mtmp).data).pmidx)) + (((mtmp).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF));
    await show_glyph(mtmp.mx, mtmp.my, glyph);
    if (showtail && mtmp.data == game.mons[PM_LONG_WORM]) {
        await detect_wsegs(mtmp, 0);
    }
}
/* this is checking whether a trap symbol represents a trapped chest,
   not whether a trapped chest is actually present */
export function trapped_chest_at(ttyp, x, y) {
    let mtmp = null;
    let otmp = null;
    if (!((glyph_at(x, y)) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph_at(x, y)) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1)))) {
        return (0);
    }
    if (ttyp != TRAPPED_CHEST || ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && rn2(20))) {
        return (0);
    }
    /*
     * TODO?  We should check containers recursively like the trap
     * detecting routine does.  Chests and large boxes do not nest in
     * themselves or each other, but could be contained inside statues.
     *
     * For farlook, we should also check for buried containers, but
     * for '^' command to examine adjacent trap glyph, we shouldn't.
     */
    /* on map, presence of any trappable container will do */
    if (sobj_at(CHEST, x, y) || sobj_at(LARGE_BOX, x, y)) {
        return (1);
    }
    if (((x) == game.u.ux && (y) == game.u.uy)) {
        /* in inventory, we need to find one which is actually trapped */
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST) && otmp.otrapped) {
                /* detection indicates removal of this object from the map */
                return (1);
            }
        }
        if (game.u.usteed) {
            /* steed isn't on map so won't be found by m_at() */
            for (otmp = game.u.usteed.minvent; otmp; otmp = otmp.nobj) {
                if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST) && otmp.otrapped) {
                    return (1);
                }
            }
        }
    }
    if ((mtmp = (game.level.monsters[x][y])) != null) {
        for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
            if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST) && otmp.otrapped) {
                return (1);
            }
        }
    }
    return (0);
}
/* this is checking whether a trap symbol represents a trapped door,
   not whether the door here is actually trapped */
export function trapped_door_at(ttyp, x, y) {
    let lev = null;
    if (!((glyph_at(x, y)) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph_at(x, y)) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1)))) {
        return (0);
    }
    if (ttyp != TRAPPED_DOOR || ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && rn2(20))) {
        return (0);
    }
    lev = game.level.locations[x][y];
    if (!((lev.typ) == DOOR)) {
        return (0);
    }
    if ((lev.flags & (0 | 1 | 2)) != 0 && trapped_chest_at(ttyp, x, y)) {
        return (0);
    }
    return (1);
}
/* recursively search obj for an object in class oclass, return 1st found */
export function o_in(obj, oclass) {
    let otmp = null;
    let temp = null;
    if (obj.oclass == oclass) {
        return obj;
    }
    if (((obj).cobj != null) && !((obj).otyp == LARGE_BOX && (obj).spe == 1)) {
        /*
     * Note:  we exclude SchroedingersBox because the corpse it contains
     * isn't necessarily a corpse yet.  Resolving the status would lead
     * to complications if it turns out to be a live cat.  We know that
     * that Box can't contain anything else because putting something in
     * would resolve the cat/corpse situation and convert to ordinary box.
     */
        for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
            if (otmp.oclass == oclass) {
                return otmp;
            } else if (((otmp).cobj != null) && (temp = o_in(otmp, oclass)) != null) {
                return temp;
            }
        }
    }
    return null;
}
/* Recursively search obj for an object made of specified material.
 * Return first found.
 */
export function o_material(obj, material) {
    let otmp = null;
    let temp = null;
    if (game.objects[obj.otyp].oc_material == material) {
        return obj;
    }
    if (((obj).cobj != null)) {
        for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
            if (game.objects[otmp.otyp].oc_material == material) {
                return otmp;
            } else if (((otmp).cobj != null) && (temp = o_material(otmp, material)) != null) {
                return temp;
            }
        }
    }
    return null;
}
export async function observe_recursively(obj) {
    let otmp = null;
    await observe_object(obj);
    if (((obj).cobj != null)) {
        for (otmp = obj.cobj; otmp; otmp = otmp.nobj) {
            await observe_recursively(otmp);
        }
    }
}
/* Check whether the location has an outdated object displayed on it. */
export function check_map_spot(x, y, oclass, material) {
    let glyph = 0;
    let otmp = null;
    let mtmp = null;
    glyph = glyph_at(x, y);
    if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
        if (oclass == (MAXOCLASSES + 1)) {
            /* there's some object shown here */
            return !(game.level.objects[x][y] || ((mtmp = (game.level.monsters[x][y])) != null && mtmp.minvent));
        } else {
            if (material && game.objects[(((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))) ? CORPSE : (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) ? STATUE : (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) ? ((glyph) - (((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : ((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) ? ((glyph) - (((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS))) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : NUM_OBJECTS)].oc_material == material) {
                /* object shown here is of interest because material matches */
                /* obj shown here is of interest because its class matches */
                for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
                    if (o_material(otmp, GOLD)) {
                        return (0);
                    }
                }
                if ((mtmp = (game.level.monsters[x][y])) != null) {
                    /* didn't find it; perhaps a monster is carrying it */
                    for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
                        if (o_material(otmp, GOLD)) {
                            return (0);
                        }
                    }
                }
                return (1);
            }
            if (oclass && game.objects[(((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))) ? CORPSE : (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) ? STATUE : (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) ? ((glyph) - (((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : ((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) ? ((glyph) - (((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS))) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : NUM_OBJECTS)].oc_class == oclass) {
                for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
                    if (o_in(otmp, oclass)) {
                        return (0);
                    }
                }
                if ((mtmp = (game.level.monsters[x][y])) != null) {
                    for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
                        if (o_in(otmp, oclass)) {
                            return (0);
                        }
                    }
                }
                return (1);
            }
        }
    }
    return (0);
}
/*
 * When doing detection, remove stale data from the map display (corpses
 * rotted away, objects carried away by monsters, etc) so that it won't
 * reappear after the detection has completed.  Return true if noticeable
 * change occurs.
 */
export async function clear_stale_map(oclass, material) {
    let zx = 0;
    let zy = 0;
    let change_made = (0);
    for (zx = 1; zx < 80; zx++) {
        for (zy = 0; zy < 21; zy++) {
            if (check_map_spot(zx, zy, oclass, material)) {
                await unmap_object(zx, zy);
                change_made = (1);
            }
        }
    }
    return change_made;
}
/* look for gold, on the floor or in monsters' possession */
export async function gold_detect(sobj) {
    let obj = null;
    let mtmp = null;
    let gold = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let temp = null;
    let stale = 0;
    let ugold = 0;
    let steedgold = 0;
    let ter_typ = 0;
    outgoldmap: {
        temp = null;
        ugold = (0);
        steedgold = (0);
        ter_typ = 32 | 4;
        game.known = stale = await clear_stale_map(COIN_CLASS, (sobj.blessed ? GOLD : 0));
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            /* look for gold carried by monsters (might be in a container) */
            /* Objects in the monster's inventory override floor objects. */
            /* Note: This used to just check fmon for a non-zero value
     * but in versions since 3.3.0 fmon can test TRUE due to the
     * presence of dmons, so we have to find at least one
     * with positive hit-points to know for sure.
     */
            if (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx)) {
                continue;
            }
            if (findgold(mtmp.minvent) || ((mtmp.data).pmidx) == PM_GOLD_GOLEM) {
                if (mtmp == game.u.usteed) {
                    steedgold = (1);
                } else {
                    game.known = (1);
                    break outgoldmap;
                }
            } else {
                for (obj = mtmp.minvent; obj; obj = obj.nobj) {
                    if ((sobj.blessed && o_material(obj, GOLD)) || o_in(obj, COIN_CLASS)) {
                        if (mtmp == game.u.usteed) {
                            steedgold = (1);
                        } else {
                            game.known = (1);
                            break outgoldmap;
                        }
                    }
                }
            }
        }
        for (obj = game.level.objlist; obj; obj = obj.nobj) {
            if (sobj.blessed && o_material(obj, GOLD)) {
                game.known = (1);
                if (obj.ox != game.u.ux || obj.oy != game.u.uy) {
                    break outgoldmap;
                }
            } else if (o_in(obj, COIN_CLASS)) {
                game.known = (1);
                if (obj.ox != game.u.ux || obj.oy != game.u.uy) {
                    break outgoldmap;
                }
            }
        }
        if (!game.known) {
            /* no gold found on floor or monster's inventory.
           adjust message if you have gold in your inventory */
            let buf = '';
            if (game.youmonst.data == game.mons[PM_GOLD_GOLEM]) {
                buf = sprintf(buf, "You feel like a million %s!", await currency(2));
            } else if (money_cnt(game.invent) || hidden_gold((1))) {
                buf = strcpy(buf, "You feel worried about your future financial situation.");
            } else if (steedgold) {
                buf = sprintf(buf, "You feel interested in %s financial situation.", s_suffix(await x_monnam(game.u.usteed, game.u.usteed.mtame ? 3 : 1, null, 8, (0))));
            } else {
                buf = strcpy(buf, "You feel materially poor.");
            }
            await strange_feeling(sobj, buf);
            return 1;
        }
        if (stale) {
            await docrt();
        }
        await You("notice some gold between your %s.", await makeplural(await body_part(FOOT)));
        return 0;
    }
    await cls();
    unconstrain_map();
    for (obj = game.level.objlist; obj; obj = obj.nobj) {
        if (sobj.blessed && (temp = o_material(obj, GOLD)) != null) {
            if (temp != obj) {
                /* Discover gold locations. */
                temp.ox = obj.ox;
                temp.oy = obj.oy;
            }
            await map_object(temp, 1);
        } else if ((temp = o_in(obj, COIN_CLASS)) != null) {
            if (temp != obj) {
                temp.ox = obj.ox;
                temp.oy = obj.oy;
            }
            await map_object(temp, 1);
        }
        if (temp && ((temp.ox) == game.u.ux && (temp.oy) == game.u.uy)) {
            ugold = (1);
        }
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx)) {
            continue;
        }
        temp = null;
        if (findgold(mtmp.minvent) || ((mtmp.data).pmidx) == PM_GOLD_GOLEM) {
            /* ensure oextra is cleared too */
            Object.assign(gold, cg.zeroobj);
            gold.otyp = GOLD_PIECE;
            gold.quan = rnd(10);
            gold.ox = mtmp.mx;
            gold.oy = mtmp.my;
            await map_object(gold, 1);
            temp = gold;
        } else {
            for (obj = mtmp.minvent; obj; obj = obj.nobj) {
                if (sobj.blessed && (temp = o_material(obj, GOLD)) != null) {
                    temp.ox = mtmp.mx;
                    temp.oy = mtmp.my;
                    await map_object(temp, 1);
                    /* skip rest of this monster's inventory */
                    /* no need for full count, just 1 or more vs 0 */
                    break;
                } else if ((temp = o_in(obj, COIN_CLASS)) != null) {
                    temp.ox = mtmp.mx;
                    temp.oy = mtmp.my;
                    await map_object(temp, 1);
                    break;
                }
            }
        }
        if (temp && ((temp.ox) == game.u.ux && (temp.oy) == game.u.uy)) {
            ugold = (1);
        }
    }
    if (!ugold) {
        await newsym(game.u.ux, game.u.uy);
        /* so autodescribe will recognize hero */
        /* for autodescribe at <u.ux,u.uy> */
        ter_typ |= 8;
    }
    await You_feel("very greedy, and sense gold!");
    await exercise(A_WIS, (1));
    await browse_map(ter_typ, "gold");
    await map_redisplay();
    return 0;
}
/* returns 1 if nothing was detected, 0 if something was detected */
export async function food_detect(sobj) {
    let obj = null;
    let mtmp = null;
    let ct = 0;
    let ctu = 0;
    let confused = (game.u.uprops[CONFUSION].intrinsic || (sobj && sobj.cursed));
    let stale = 0;
    let oclass = confused ? POTION_CLASS : FOOD_CLASS;
    let what = confused ? c_common_strings.c_something : "food";
    stale = await clear_stale_map(oclass, 0);
    /* some situations leave steed with stale coordinates */
    if (game.u.usteed) {
        game.u.usteed.mx = game.u.ux , game.u.usteed.my = game.u.uy;
    }
    for (obj = game.level.objlist; obj; obj = obj.nobj) {
        if (o_in(obj, oclass)) {
            if (((obj.ox) == game.u.ux && (obj.oy) == game.u.uy)) {
                ctu++;
            } else {
                ct++;
            }
        }
    }
    for (mtmp = game.level.monlist; mtmp && (!ct || !ctu); mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx)) {
            continue;
        }
        for (obj = mtmp.minvent; obj; obj = obj.nobj) {
            if (o_in(obj, oclass)) {
                if (((mtmp.mx) == game.u.ux && (mtmp.my) == game.u.uy)) {
                    ctu++;
                /* steed or an engulfer with inventory */
                } else {
                    ct++;
                }
                break;
            }
        }
    }
    if (!ct && !ctu) {
        game.known = stale && !confused;
        if (stale) {
            await docrt();
            await You("sense a lack of %s nearby.", what);
            if (sobj && sobj.blessed) {
                if (!game.u.uedibility) {
                    await Your("%s starts to tingle.", await body_part(NOSE));
                }
                game.u.uedibility = 1;
            }
        } else if (sobj) {
            let buf = '';
            buf = sprintf(buf, "Your %s twitches%s.", await body_part(NOSE), (sobj.blessed && !game.u.uedibility) ? " then starts to tingle" : "");
            if (sobj.blessed && !game.u.uedibility) {
                let savebeginner = game.flags.beginner;
                /* prevent non-delivery of message */
                game.flags.beginner = (0);
                await strange_feeling(sobj, buf);
                game.flags.beginner = savebeginner;
                game.u.uedibility = 1;
            } else {
                await strange_feeling(sobj, buf);
            }
        }
        return !stale;
    } else if (!ct) {
        game.known = (1);
        await You("%s %s nearby.", sobj ? "smell" : "sense", what);
        if (sobj && sobj.blessed) {
            if (!game.u.uedibility) {
                await Your("%s starts to tingle.", await body_part(NOSE));
            }
            game.u.uedibility = 1;
        }
    } else {
        let temp = null;
        let ter_typ = 32 | 4;
        game.known = (1);
        await cls();
        unconstrain_map();
        for (obj = game.level.objlist; obj; obj = obj.nobj) {
            if ((temp = o_in(obj, oclass)) != null) {
                if (temp != obj) {
                    temp.ox = obj.ox;
                    temp.oy = obj.oy;
                }
                await map_object(temp, 1);
            }
        }
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx)) {
                continue;
            }
            for (obj = mtmp.minvent; obj; obj = obj.nobj) {
                if ((temp = o_in(obj, oclass)) != null) {
                    temp.ox = mtmp.mx;
                    temp.oy = mtmp.my;
                    await map_object(temp, 1);
                    break;
                }
            }
        }
        if (!ctu) {
            await newsym(game.u.ux, game.u.uy);
            /* for autodescribe of self */
            ter_typ |= 8;
        }
        if (sobj) {
            if (sobj.blessed) {
                await Your("%s %s to tingle and you smell %s.", await body_part(NOSE), game.u.uedibility ? "continues" : "starts", what);
                game.u.uedibility = 1;
            } else {
                await Your("%s tingles and you smell %s.", await body_part(NOSE), what);
            }
        } else {
            await You("sense %s.", what);
        }
        await exercise(A_WIS, (1));
        await browse_map(ter_typ, "food");
        await map_redisplay();
    }
    return 0;
}
/*
 * Used for scrolls, potions, spells, and crystal balls.  Returns:
 *
 *      1 - nothing was detected
 *      0 - something was detected
 */
/* object doing the detecting */
/* an object class, 0 for all */
export async function object_detect(detector, class_) {
    let x = 0;
    let y = 0;
    let stuff = '';
    let is_cursed = (detector && detector.cursed);
    let do_dknown = (detector && (detector.oclass == POTION_CLASS || detector.oclass == SPBOOK_CLASS) && detector.blessed);
    let ct = 0;
    let ctu = 0;
    let obj = null;
    let otmp = null;
    let mtmp = null;
    let sym = 0;
    let boulder = 0;
    let ter_typ = 32 | 4;
    if (class_ < 0 || class_ >= MAXOCLASSES) {
        await impossible("object_detect:  illegal class %d", class_);
        class_ = 0;
    }
    /* Special boulder symbol check - does the class symbol happen
     * to match showsyms[SYM_BOULDER + SYM_OFF_X] which is user-defined.
     * If so, that means we aren't sure what they really wanted to
     * detect. Rather than trump anything, show both possibilities.
     * We can exclude checking the buried obj chain for boulders below.
     */
    sym = class_ ? def_oc_syms[class_].sym : 0;
    if (sym && sym == game.showsyms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)]) {
        boulder = ROCK_CLASS;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || (game.u.uprops[CONFUSION].intrinsic && class_ == SCROLL_CLASS)) {
        stuff = strcpy(stuff, c_common_strings.c_something);
    } else {
        stuff = strcpy(stuff, class_ ? def_oc_syms[class_].name : "objects");
    }
    if (boulder && class_ != ROCK_CLASS) {
        stuff = strcat(stuff, " and/or large stones");
    }
    if (do_dknown) {
        for (obj = game.invent; obj; obj = obj.nobj) {
            await observe_recursively(obj);
        }
    }
    for (obj = game.level.objlist; obj; obj = obj.nobj) {
        if ((!class_ && !boulder) || o_in(obj, class_) || o_in(obj, boulder)) {
            if (((obj.ox) == game.u.ux && (obj.oy) == game.u.uy)) {
                ctu++;
            } else {
                ct++;
            }
        }
        if (do_dknown) {
            await observe_recursively(obj);
        }
    }
    for (obj = game.level.buriedobjlist; obj; obj = obj.nobj) {
        if (!class_ || o_in(obj, class_)) {
            if (((obj.ox) == game.u.ux && (obj.oy) == game.u.uy)) {
                ctu++;
            } else {
                ct++;
            }
        }
        if (do_dknown) {
            await observe_recursively(obj);
        }
    }
    if (game.u.usteed) {
        game.u.usteed.mx = game.u.ux , game.u.usteed.my = game.u.uy;
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx)) {
            continue;
        }
        for (obj = mtmp.minvent; obj; obj = obj.nobj) {
            if ((!class_ && !boulder) || o_in(obj, class_) || o_in(obj, boulder)) {
                ct++;
            }
            if (do_dknown) {
                await observe_recursively(obj);
            }
        }
        if ((is_cursed && ((mtmp).m_ap_type & 7) == M_AP_OBJECT && (!class_ || class_ == game.objects[mtmp.mappearance].oc_class)) || (findgold(mtmp.minvent) && (!class_ || class_ == COIN_CLASS))) {
            ct++;
            break;
        }
    }
    if (!await clear_stale_map(!class_ ? (MAXOCLASSES + 1) : class_, 0) && !ct) {
        if (!ctu) {
            if (detector) {
                await strange_feeling(detector, "You feel a lack of something.");
            }
            return 1;
        }
        await You("sense %s nearby.", stuff);
        return 0;
    }
    await cls();
    unconstrain_map();
    for (obj = game.level.buriedobjlist; obj; obj = obj.nobj) {
        if (!class_ || (otmp = o_in(obj, class_)) != null) {
            if (class_) {
                if (otmp != obj) {
                    /*
     *  Map all buried objects first.
     */
                    otmp.ox = obj.ox;
                    otmp.oy = obj.oy;
                }
                await map_object(otmp, 1);
            } else {
                await map_object(obj, 1);
            }
        }
    }
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            for (obj = game.level.objects[x][y]; obj; obj = obj.v.v_nexthere) {
                if ((!class_ && !boulder) || (otmp = o_in(obj, class_)) != null || (otmp = o_in(obj, boulder)) != null) {
                    if (class_ || boulder) {
                        if (otmp != obj) {
                            /*
     * If we are mapping all objects, map only the top object of a pile or
     * the first object in a monster's inventory.  Otherwise, go looking
     * for a matching object class and display the first one encountered
     * at each location.
     *
     * Objects on the floor override buried objects.
     */
                            otmp.ox = obj.ox;
                            otmp.oy = obj.oy;
                        }
                        await map_object(otmp, 1);
                    } else {
                        await map_object(obj, 1);
                    }
                    break;
                }
            }
        }
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx)) {
            continue;
        }
        for (obj = mtmp.minvent; obj; obj = obj.nobj) {
            if ((!class_ && !boulder) || (otmp = o_in(obj, class_)) != null || (otmp = o_in(obj, boulder)) != null) {
                if (!class_ && !boulder) {
                    otmp = obj;
                }
                otmp.ox = mtmp.mx;
                otmp.oy = mtmp.my;
                await map_object(otmp, 1);
                break;
            }
        }
        if (is_cursed && ((mtmp).m_ap_type & 7) == M_AP_OBJECT && (!class_ || class_ == game.objects[mtmp.mappearance].oc_class)) {
            /* Allow a mimic to override the detected objects it is carrying. */
            let temp = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
            Object.assign(temp, cg.zeroobj);
            /* needed for obj_to_glyph() */
            temp.otyp = mtmp.mappearance;
            temp.quan = 1;
            temp.ox = mtmp.mx;
            temp.oy = mtmp.my;
            /* used for mimicking a corpse or statue */
            temp.corpsenm = ((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM) ? ((mtmp).mextra.mcorpsenm) : PM_TENGU;
            await map_object(temp, 1);
        } else if (findgold(mtmp.minvent) && (!class_ || class_ == COIN_CLASS)) {
            let gold = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
            Object.assign(gold, cg.zeroobj);
            gold.otyp = GOLD_PIECE;
            gold.quan = rnd(10);
            gold.ox = mtmp.mx;
            gold.oy = mtmp.my;
            await map_object(gold, 1);
        }
    }
    if (!(((glyph_at(game.u.ux, game.u.uy)) == GLYPH_OBJ_OFF || ((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph_at(game.u.ux, game.u.uy)) == GLYPH_OBJ_PILETOP_OFF || ((glyph_at(game.u.ux, game.u.uy)) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph_at(game.u.ux, game.u.uy)) > GLYPH_OBJ_OFF && (glyph_at(game.u.ux, game.u.uy)) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph_at(game.u.ux, game.u.uy)) > GLYPH_OBJ_PILETOP_OFF && (glyph_at(game.u.ux, game.u.uy)) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_STATUE_MALE_OFF) && ((glyph_at(game.u.ux, game.u.uy)) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph_at(game.u.ux, game.u.uy)) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_STATUE_FEM_OFF) && ((glyph_at(game.u.ux, game.u.uy)) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph_at(game.u.ux, game.u.uy)) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_BODY_OFF) && ((glyph_at(game.u.ux, game.u.uy)) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_BODY_PILETOP_OFF) && ((glyph_at(game.u.ux, game.u.uy)) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
        await newsym(game.u.ux, game.u.uy);
        ter_typ |= 8;
    }
    await You("detect the %s of %s.", ct ? "presence" : "absence", stuff);
    if (!ct) {
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (1));
    } else {
        await browse_map(ter_typ, "object");
    }
    await map_redisplay();
    return 0;
}
/*
 * Used by: crystal balls, potions, fountains
 *
 * Returns 1 if nothing was detected.
 * Returns 0 if something was detected.
 */
/* detecting object (if any) */
/* monster class, 0 for all */
export async function monster_detect(otmp, mclass) {
    let mtmp = null;
    let mcnt = 0;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx)) {
            continue;
        }
        ++mcnt;
        break;
    }
    if (!mcnt) {
        if (otmp) {
            await strange_feeling(otmp, (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "You get the heebie jeebies." : "You feel threatened.");
        }
        return 1;
    } else {
        let unconstrained = 0;
        let woken = (0);
        /* before unconstrain_map() */
        let swallowed = game.u.uswallow;
        await cls();
        /* for skilled spell, getpos() scanning of the map will display all
       monsters within range; otherwise, "unseen creature" will be shown */
        unconstrained = unconstrain_map();
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx)) {
                continue;
            }
            if (!mclass || mtmp.data.mlet == mclass || (mtmp.data == game.mons[PM_LONG_WORM] && mclass == S_WORM_TAIL)) {
                await map_monst(mtmp, (1));
            }
            if (otmp && otmp.cursed && ((mtmp).msleeping || !(mtmp).mcanmove)) {
                mtmp.msleeping = mtmp.mfrozen = 0;
                mtmp.mcanmove = 1;
                woken = (1);
            }
        }
        if (!swallowed) {
            await show_glyph(game.u.ux, game.u.uy, ((game.u.usteed && mon_visible(game.u.usteed)) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((game.u.usteed).data).pmidx)) + (((game.u.usteed).female == 0) ? GLYPH_RIDDEN_MALE_OFF : GLYPH_RIDDEN_FEM_OFF)) : (((game.youmonst.m_ap_type & 7) == M_AP_NOTHING) ? ((((game.u.umonnum != game.u.umonster) || !game.flags.showrace) ? game.u.umonnum : game.urace.mnum) + (((((((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((game.youmonst.m_ap_type & 7) == M_AP_FURNITURE) ? (((game.youmonst.mappearance) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((game.youmonst.mappearance) <= S_trwall) ? ((game.youmonst.mappearance) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((game.youmonst.mappearance) < S_altar) ? (((game.youmonst.mappearance) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((game.youmonst.mappearance) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((game.youmonst.mappearance) < S_arrow_trap + (TRAPNUM - 1)) ? (((game.youmonst.mappearance) - S_grave) + GLYPH_CMAP_B_OFF) : ((game.youmonst.mappearance) <= S_goodpos) ? (((game.youmonst.mappearance) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH) : ((game.youmonst.m_ap_type & 7) == M_AP_OBJECT) ? ((game.youmonst.mappearance) + GLYPH_OBJ_OFF) : ((game.youmonst.mappearance) + ((((((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)))));
        }
        await You("sense the presence of monsters.");
        if (woken) {
            await pline("Monsters sense the presence of you.");
        }
        if ((otmp && otmp.blessed) && !unconstrained) {
            await (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (1));
        } else {
            game.u.uprops[DETECT_MONSTERS].extrinsic |= 536870912;
            await browse_map(32 | 8, "monster of interest");
            game.u.uprops[DETECT_MONSTERS].extrinsic &= ~536870912;
        }
        await map_redisplay();
    }
    return 0;
}
export async function sense_trap(trap, x, y, src_cursed) {
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || src_cursed) {
        let obj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
        Object.assign(obj, cg.zeroobj);
        if (trap) {
            obj.ox = trap.tx;
            obj.oy = trap.ty;
        } else {
            obj.ox = x;
            obj.oy = y;
        }
        obj.otyp = !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? GOLD_PIECE : ((rn2)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT);
        obj.quan = ((obj.otyp == GOLD_PIECE) ? rnd(10) : game.objects[obj.otyp].oc_merge ? rnd(2) : 1);
        obj.corpsenm = ((rn2)(NUMMONS));
        await map_object(obj, 1);
    } else if (trap) {
        await map_trap(trap, 1);
        trap.tseen = 1;
    } else {
        /*
         * OBSOLETE; this was for trapped door or trapped chest
         * but those are handled by 'if (trap) {map_trap()}' now
         * and this block of code shouldn't be reachable anymore.
         */
        game.dummytrap.tx = x;
        game.dummytrap.ty = y;
        game.dummytrap.ttyp = BEAR_TRAP;
        await map_trap(game.dummytrap, 1);
    }
}
/* nothing found */
/* found at hero's location */
/* found at any other location */
/* check a list of objects for chest traps; return 1 if found at <ux,uy>,
   2 if found at some other spot, 3 if both, 0 otherwise; optionally
   update the map to show where such traps were found */
/* 1 for misleading map feedback */
/* being called by findone() when non-Null */
export async function detect_obj_traps(objlist, show_them, how, ft) {
    let otmp = null;
    let x = 0;
    let y = 0;
    let trapglyph = 0;
    let result = 0;
    /*
     * TODO?  Display locations of unarmed land mine and beartrap objects.
     * If so, should they be displayed as objects or as traps?
     */
    game.dummytrap.ttyp = TRAPPED_CHEST;
    trapglyph = ft ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH) : GLYPH_NOTHING_OFF;
    for (otmp = objlist; otmp; otmp = otmp.nobj) {
        x = y = 0;
        if ((((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST) && otmp.otrapped) || ((otmp).cobj != null)) {
            /* !get_obj_location and !isok should both be impossible here */
            if (!get_obj_location(otmp, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 2 | 1) || !isok(x, y) || (ft && (x != ft.ft_cc.x || y != ft.ft_cc.y))) {
                continue;
            }
        }
        if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST) && otmp.otrapped) {
            otmp.tknown = 1;
            await observe_object(otmp);
            result |= ((x) == game.u.ux && (y) == game.u.uy) ? 1 : 2;
            if (ft) {
                await flash_glyph_at(x, y, trapglyph, 6);
            }
            if (show_them) {
                game.dummytrap.tx = x , game.dummytrap.ty = y;
                await sense_trap(game.dummytrap, x, y, how);
            }
            if (ft) {
                await foundone(x, y, trapglyph);
                ft.num_traps++;
            }
        }
        if (((otmp).cobj != null)) {
            result |= await detect_obj_traps(otmp.cobj, show_them, how, ft);
        }
    }
    return result;
}
export async function display_trap_map(cursed_src) {
    let mon = null;
    let ttmp = null;
    let door = 0;
    let glyph = 0;
    let ter_typ = 32 | (cursed_src ? 4 : 2);
    let cc = { x: 0, y: 0 };
    await cls();
    unconstrain_map();
    await detect_obj_traps(game.level.buriedobjlist, (1), cursed_src, null);
    await detect_obj_traps(game.level.objlist, (1), cursed_src, null);
    for (mon = game.level.monlist; mon; mon = mon.nmon) {
        if (((mon).mhp < 1) || (mon.isgd && !mon.mx)) {
            continue;
        }
        await detect_obj_traps(mon.minvent, (1), cursed_src, null);
    }
    await detect_obj_traps(game.invent, (1), cursed_src, null);
    for (ttmp = game.ftrap; ttmp; ttmp = ttmp.ntrap) {
        await sense_trap(ttmp, 0, 0, cursed_src);
    }
    game.dummytrap.ttyp = TRAPPED_DOOR;
    for (door = 0; door < game.doorindex; door++) {
        Object.assign(cc, game.doors[door]);
        /* can't be trapped; see above */
        /* levl[][].doormask and .wall_info both overlay levl[][].flags;
           the bit in doormask for D_TRAPPED is also a bit in wall_info;
           secret doors use wall_info so can't be marked as trapped */
        if (game.level.locations[cc.x][cc.y].typ == SDOOR) {
            continue;
        }
        if (game.level.locations[cc.x][cc.y].flags & 16) {
            game.dummytrap.tx = cc.x , game.dummytrap.ty = cc.y;
            await sense_trap(game.dummytrap, cc.x, cc.y, cursed_src);
        }
    }
    /* redisplay hero unless sense_trap() revealed something at <ux,uy> */
    glyph = glyph_at(game.u.ux, game.u.uy);
    if (!(((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) || (((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS))))))) {
        await newsym(game.u.ux, game.u.uy);
        ter_typ |= 8;
    }
    await You_feel("%s.", cursed_src ? "very greedy" : "entrapped");
    await browse_map(ter_typ, cursed_src ? "gold" : "trap of interest");
    await map_redisplay();
}
/* the detections are pulled out so they can
 * also be used in the crystal ball routine
 * returns 1 if nothing was detected
 * returns 0 if something was detected
 */
/* Null if crystal ball, scroll if gold detection */
export async function trap_detect(sobj) {
    let ttmp = null;
    let mon = null;
    let door = 0;
    let tr = 0;
    let cursed_src = sobj && sobj.cursed;
    let found = (0);
    let cc = { x: 0, y: 0 };
    if (game.u.usteed) {
        game.u.usteed.mx = game.u.ux , game.u.usteed.my = game.u.uy;
    }
    for (ttmp = game.ftrap; ttmp; ttmp = ttmp.ntrap) {
        if (ttmp.tx != game.u.ux || ttmp.ty != game.u.uy) {
            await display_trap_map(cursed_src);
            return 0;
        }
        found = (1);
    }
    if ((tr = await detect_obj_traps(game.level.objlist, (0), 0, null)) != 0) {
        if (tr & 2) {
            await display_trap_map(cursed_src);
            return 0;
        }
        found = (1);
    }
    if ((tr = await detect_obj_traps(game.level.buriedobjlist, (0), 0, null)) != 0) {
        if (tr & 2) {
            await display_trap_map(cursed_src);
            return 0;
        }
        found = (1);
    }
    for (mon = game.level.monlist; mon; mon = mon.nmon) {
        if (((mon).mhp < 1) || (mon.isgd && !mon.mx)) {
            continue;
        }
        if ((tr = await detect_obj_traps(mon.minvent, (0), 0, null)) != 0) {
            if (tr & 2) {
                await display_trap_map(cursed_src);
                return 0;
            }
            found = (1);
        }
    }
    if (await detect_obj_traps(game.invent, (0), 0, null) != 0) {
        found = (1);
    }
    for (door = 0; door < game.doorindex; door++) {
        Object.assign(cc, game.doors[door]);
        if (game.level.locations[cc.x][cc.y].typ == SDOOR) {
            continue;
        }
        if (game.level.locations[cc.x][cc.y].flags & 16) {
            if (cc.x != game.u.ux || cc.y != game.u.uy) {
                await display_trap_map(cursed_src);
                return 0;
            }
            found = (1);
        }
    }
    if (!found) {
        let buf = '';
        buf = sprintf(buf, "Your %s stop itching.", await makeplural(await body_part(TOE)));
        await strange_feeling(sobj, buf);
        return 1;
    }
    await Your("%s itch.", await makeplural(await body_part(TOE)));
    return 0;
}
export async function furniture_detect() {
    let mon = null;
    let x = 0;
    let y = 0;
    let glyph = 0;
    let sym = 0;
    let found = 0;
    let revealed = 0;
    unconstrain_map();
    for (y = 0; y < 21; ++y) {
        for (x = 1; x < 80; ++x) {
            glyph = glyph_at(x, y);
            sym = glyph_to_cmap(glyph);
            if (((game.level.locations[x][y].typ) >= STAIRS && (game.level.locations[x][y].typ) <= ALTAR)) {
                ++found;
                await magic_map_background(x, y, 1);
            } else if (((sym) >= S_upstair && (sym) <= S_fountain)) {
                ++found;
                if ((mon = (game.level.monsters[x][y])) != null && ((mon).m_ap_type & 7) == M_AP_FURNITURE) {
                    await seemimic(mon);
                }
                if (!mon || !(canseemon(mon) || sensemon(mon))) {
                    await map_invisible(x, y);
                }
            }
            if (glyph_at(x, y) != glyph) {
                ++revealed;
            }
        }
    }
    if (!found) {
        await There("seems to be nothing of interest on this level.");
    } else if (!revealed) {
        await Your("map already shows all relevant locations.");
    }
    if (!revealed) {
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (1));
    } else {
        await browse_map(32 | 1 | 2 | 4 | 8, "location");
    }
    await map_redisplay();
    return 0;
}
/* way back in 3.0plN and/or 2.x, you could use a crystal ball to find out
   where the wizard was relative to your current location; that was when the
   Wizard guarded the Amulet and was located on a random maze level, and you
   were expected to level teleport deep into Hell and hunt for him while
   working your way up; this isn't of much use anymore */
export function level_distance(where) {
    let ll = depth(game.u.uz) - depth(where);
    let indun = (game.u.uz.dnum == where.dnum);
    /* always replaced by some other non-Null value */
    let res = "";
    if (ll < 0) {
        if (ll < (-8 - rn2(3))) {
            if (!indun) {
                res = "far away";
            } else {
                res = "far below";
            }
        } else if (ll < -1) {
            if (!indun) {
                res = "away below you";
            } else {
                res = "below you";
            }
        } else if (!indun) {
            res = "in the distance";
        } else {
            res = "just below";
        }
    } else if (ll > 0) {
        if (ll > (8 + rn2(3))) {
            if (!indun) {
                res = "far away";
            } else {
                res = "far above";
            }
        } else if (ll > 1) {
            if (!indun) {
                res = "away above you";
            } else {
                res = "above you";
            }
        } else if (!indun) {
            res = "in the distance";
        } else {
            res = "just above";
        }
    } else {
        if (!indun) {
            res = "in the distance";
        } else {
            res = "near you";
        }
    }
    return res;
}
/*
     * This could be made a lot more useful.  Especially now that
     * amnesia no longer causes levels to be forgotten.  Perhaps a
     * menu, and it ought to include the entrance to Vlad's Tower,
     * one of the few things that requires active searching/mapping
     * to find.  And once the Wizard is in play, he is easy for the
     * game to locate but not necessarily for the player.
     */
// struct crystalballlevels: { what, where }
const level_detects = [{ what: "Delphi", where: (game.dungeon_topology.d_oracle_level) }, { what: "Medusa's lair", where: (game.dungeon_topology.d_medusa_level) }, { what: "a castle", where: (game.dungeon_topology.d_stronghold_level) }, { what: "the Wizard of Yendor's tower", where: (game.dungeon_topology.d_wiz1_level) }];
export async function use_crystal_ball(optr) {
    let ch = 0;
    let oops = 0;
    let obj = optr.value;
    let charged = (obj.spe > 0);
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        await pline("Too bad you can't see %s.", await the(await xname(obj)));
        return;
    }
    oops = is_quest_artifact(obj) ? 8 : obj.blessed ? 16 : 20;
    if (charged && (obj.cursed || rnd(oops) > (acurr(A_INT)))) {
        let impair = rnd(100 - 3 * (acurr(A_INT)));
        switch (rnd((obj.oartifact || obj.blessed) ? 4 : 5)) {
            case 1:
                await pline("%s too much to comprehend!", await Tobjnam(obj, "are"));
                break;
            case 2:
                await pline("%s you!", await Tobjnam(obj, "confuse"));
                await make_confused((game.u.uprops[CONFUSION].intrinsic & 16777215) + impair, (0));
                break;
            case 3:
                if (!await resists_blnd(game.youmonst)) {
                    await pline("%s your vision!", await Tobjnam(obj, "damage"));
                    await make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + impair, (0));
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await Your("%s", c_common_strings.c_vision_clears);
                    }
                } else {
                    await pline("%s your vision.", await Tobjnam(obj, "assault"));
                    await You("are unaffected!");
                }
                break;
            case 4:
                await pline("%s your mind!", await Tobjnam(obj, "zap"));
                await make_hallucinated((game.u.uprops[HALLUC].intrinsic & 16777215) + impair, (0), 0);
                break;
            case 5:
                await pline("%s!", await Tobjnam(obj, "explode"));
                await useup(obj);
                optr.value = obj = null;
                await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(30)) + 1) / 2)) : (rnd(30))), "exploding crystal ball", 0);
                break;
        }
        if (obj) {
            await consume_obj_charge(obj, (1));
        }
        return;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        nomul(-rnd(charged ? 4 : 2));
        game.multi_reason = "gazing into a Magic 8-Ball (tm)";
        game.nomovemsg = "";
        if (!charged) {
            await pline("All you see is funky %s haze.", hcolor(null));
            if (obj.spe < 0) {
                await pline("%s!", await Tobjnam(obj, "implode"));
                await useup(obj);
                optr.value = obj = null;
                return;
            }
        } else {
            switch (rnd(6)) {
                /* destroy it when it has been cancelled */
                case 1:
                    await You("grok some groovy globs of incandescent lava.");
                    break;
                case 2:
                    await pline("Whoa!  Psychedelic colors, %s!", poly_gender() == 1 ? "babe" : "dude");
                    break;
                case 3:
                    await pline_The("crystal pulses with sinister %s light!", hcolor(null));
                    break;
                case 4:
                    await You_see("goldfish swimming above fluorescent rocks.");
                    break;
                case 5:
                    await You_see("tiny snowflakes spinning around a miniature farmhouse.");
                    break;
                default:
                    await pline("Oh wow... like a kaleidoscope!");
                    break;
            }
            await consume_obj_charge(obj, (1));
        }
        return;
    }
    if (game.flags.verbose) {
        await You("may look for an object, monster, or special map symbol.");
    }
    ch = await yn_function("What do you look for?", null, 0, (1));
    if ((ch != def_monsyms[S_GHOST].sym) && strchr(quitchars, ch)) {
        if (game.flags.verbose) {
            await pline("%s", c_common_strings.c_Never_mind);
        }
        return;
    }
    await You("peer into %s...", await the(await xname(obj)));
    nomul(-rnd(charged ? 10 : 2));
    game.multi_reason = "gazing into a crystal ball";
    game.nomovemsg = "";
    if (!charged) {
        await pline_The("vision is unclear.");
        if (obj.spe < 0) {
            implode: {
            }
            await pline("%s!", await Tobjnam(obj, "implode"));
            await useup(obj);
            optr.value = obj = null;
            return;
        }
    } else {
        let class_ = 0;
        let i = 0;
        let ret = 0;
        await discover_object((CRYSTAL_BALL), (1), (1), (1));
        await consume_obj_charge(obj, (1));
        /* special case: accept ']' as synonym for mimic
         * we have to do this before the def_char_to_objclass check
         */
        if (ch == DEF_MIMIC_DEF) {
            ch = DEF_MIMIC;
        }
        if (def_char_is_furniture(ch) >= 0) {
            ret = await furniture_detect();
        } else if ((class_ = def_char_to_objclass(ch)) != MAXOCLASSES) {
            ret = await object_detect(null, class_);
        } else if ((class_ = def_char_to_monclass(ch)) != MAXMCLASSES) {
            ret = await monster_detect(null, class_);
        } else if (game.showsyms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)] && (ch == game.showsyms[SYM_BOULDER + (((((0) + MAXPCHARS) + MAXOCLASSES) + MAXMCLASSES) + 6)])) {
            ret = await object_detect(null, ROCK_CLASS);
        } else if (ch == 94) {
            ret = await trap_detect(null);
        } else {
            i = rn2((Math.trunc(4 /* sizeof(const struct crystalballlevels [4]) */ / 1 /* sizeof(const struct crystalballlevels) */)));
            await You_see("%s, %s.", level_detects[i].what, level_distance(level_detects[i].where));
            ret = 0;
        }
        if (ret) {
            if (!rn2(100)) {
                await You_see("the Wizard of Yendor gazing out at you.");
            } else {
                await pline_The("vision is unclear.");
            }
        }
    }
    return;
}
/* used by magic mapping, clairvoyance, and wand of probing */
export async function show_map_spot(x, y, cnf) {
    let lev = null;
    let t = null;
    let ep = null;
    let oldglyph = 0;
    if (cnf && rn2(7)) {
        return;
    }
    lev = game.level.locations[x][y];
    lev.seenv = (255);
    if (lev.typ == SCORR) {
        /* Secret corridors are found, but not secret doors. */
        lev.typ = CORR;
        unblock_point(x, y);
    }
    /*
     * Force the real background, then if it's not furniture and there's
     * a known trap there, display the trap, else if there was an object
     * shown there, redisplay the object.  So during mapping, furniture
     * takes precedence over traps, which take precedence over objects,
     * opposite to how normal vision behaves.
     */
    oldglyph = glyph_at(x, y);
    if (game.level.flags.hero_memory) {
        await magic_map_background(x, y, 0);
        await newsym(x, y);
    } else {
        await magic_map_background(x, y, 1);
    }
    if (!((lev.typ) >= STAIRS && (lev.typ) <= ALTAR)) {
        if ((t = t_at(x, y)) != null && t.tseen) {
            await map_trap(t, 1);
        } else if ((ep = engr_at(x, y)) != null && !cnf) {
            await map_engraving(ep, 1);
        } else if (((oldglyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (oldglyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) || (((oldglyph) == GLYPH_OBJ_OFF || ((oldglyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (oldglyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((oldglyph) == GLYPH_OBJ_PILETOP_OFF || ((oldglyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (oldglyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((oldglyph) > GLYPH_OBJ_OFF && (oldglyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((oldglyph) > GLYPH_OBJ_PILETOP_OFF && (oldglyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((oldglyph) >= GLYPH_STATUE_MALE_OFF) && ((oldglyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((oldglyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((oldglyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((oldglyph) >= GLYPH_STATUE_FEM_OFF) && ((oldglyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((oldglyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((oldglyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((oldglyph) >= GLYPH_BODY_OFF) && ((oldglyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((oldglyph) >= GLYPH_BODY_PILETOP_OFF) && ((oldglyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
            await show_glyph(x, y, oldglyph);
            if (game.level.flags.hero_memory) {
                lev.glyph = oldglyph;
            }
        }
    }
    if (!cnf && lev.roomno >= 3) {
        await room_discovered(lev.roomno - 3);
    }
}
export async function do_mapping() {
    let zx = 0;
    let zy = 0;
    let unconstrained = 0;
    unconstrained = unconstrain_map();
    for (zx = 1; zx < 80; zx++) {
        for (zy = 0; zy < 21; zy++) {
            await show_map_spot(zx, zy, game.u.uprops[CONFUSION].intrinsic);
        }
    }
    if (!game.level.flags.hero_memory || unconstrained) {
        await flush_screen(1);
        await browse_map(32 | 1 | 2 | 4, "anything of interest");
        await map_redisplay();
    } else {
        /* we only get here when unconstrained is False, so reconstrain_map
           will be a no-op; call it anyway */
        reconstrain_map();
    }
    await exercise(A_WIS, (1));
}
/* clairvoyance */
/* scroll--actually fake spellbook--object */
export async function do_vicinity_map(sobj) {
    let zx = 0;
    let zy = 0;
    let mtmp = null;
    let otmp = null;
    let save_EDetect_mons = 0;
    let save_viz_uyux = 0;
    let unconstrained = 0;
    let refresh = (0);
    let mdetected = (0);
    let odetected = (0);
    let extended = (sobj && (sobj.blessed || ((game.u.uprops[CLAIRVOYANT].intrinsic || game.u.uprops[CLAIRVOYANT].extrinsic) && !game.u.uprops[CLAIRVOYANT].blocked)));
    let random_farsight = !sobj;
    let newglyph = 0;
    let oldglyph = 0;
    let lo_y = ((game.u.uy - 5 < 0) ? 0 : game.u.uy - 5);
    let hi_y = ((game.u.uy + 6 >= 21) ? 21 - 1 : game.u.uy + 6);
    let lo_x = ((game.u.ux - 9 < 1) ? 1 : game.u.ux - 9);
    let hi_x = ((game.u.ux + 10 >= 80) ? 80 - 1 : game.u.ux + 10);
    let ter_typ = 32 | 1 | 2 | 4;
    /*
     * 3.6.0 attempted to emphasize terrain over transient map
     * properties (monsters and objects) but that led to problems.
     * Notably, known trap would be displayed instead of a monster
     * on or in it and then the display remained that way after the
     * clairvoyant snapshot finished.  That could have been fixed by
     * issuing --More-- and then regular vision update, but we want
     * to avoid that when having a clairvoyant episode every N turns
     * (from donating to a temple priest or by carrying the Amulet).
     * Unlike when casting the spell, it is much too intrusive when
     * in the midst of walking around or combatting monsters.
     *
     * As of 3.6.2, show terrain, then object, then monster like regular
     * map updating, except in this case the map locations get marked
     * as seen from every direction rather than just from direction of
     * hero.  Skilled spell marks revealed objects as 'seen up close'
     * (but for piles, only the top item) and shows monsters as if
     * detected.  Non-skilled and timed clairvoyance reveals non-visible
     * monsters as 'remembered, unseen'.
     */
    /* if hero is engulfed, show engulfer at <u.ux,u.uy> */
    save_viz_uyux = game.viz_array[game.u.uy][game.u.ux];
    if (game.u.uswallow) {
        game.viz_array[game.u.uy][game.u.ux] |= 2;
    }
    /* <x,y> are reversed, [y][x] */
    save_EDetect_mons = game.u.uprops[DETECT_MONSTERS].extrinsic;
    game.u.uprops[DETECT_MONSTERS].extrinsic |= 536870912;
    unconstrained = unconstrain_map();
    for (zx = lo_x; zx <= hi_x; zx++) {
        for (zy = lo_y; zy <= hi_y; zy++) {
            oldglyph = glyph_at(zx, zy);
            await show_map_spot(zx, zy, game.u.uprops[CONFUSION].intrinsic);
            if ((game.level.objects[zx][zy] != null)) {
                /* if there are any objects here, see the top one */
                /* not vobj_at(); this is not vision-based access;
                   unlike object detection, we don't notice buried items */
                otmp = game.level.objects[zx][zy];
                if (extended) {
                    await observe_object(otmp);
                }
                await map_object(otmp, (1));
                newglyph = glyph_at(zx, zy);
                /* if otmp is underwater, we'll need to redisplay the water */
                if (newglyph != oldglyph && ((is_pool(zx, zy) && !(game.u.uinwater)) || (game.level.locations[zx][zy].typ == LAVAPOOL) || (game.level.locations[zx][zy].typ == LAVAWALL))) {
                    odetected = (1);
                }
            }
            if ((mtmp = (game.level.monsters[zx][zy])) != null && mtmp.mx == zx && mtmp.my == zy) {
                if ((unconstrained || !game.level.flags.hero_memory) && !extended && (zx != game.u.ux || zy != game.u.uy) && !((((oldglyph) >= GLYPH_MON_MALE_OFF && (oldglyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((oldglyph) >= GLYPH_MON_FEM_OFF && (oldglyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((oldglyph) >= GLYPH_PET_MALE_OFF && (oldglyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((oldglyph) >= GLYPH_PET_FEM_OFF && (oldglyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((oldglyph) >= GLYPH_RIDDEN_MALE_OFF && (oldglyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((oldglyph) >= GLYPH_RIDDEN_FEM_OFF && (oldglyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((oldglyph) >= GLYPH_DETECT_MALE_OFF && (oldglyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((oldglyph) >= GLYPH_DETECT_FEM_OFF && (oldglyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
                    await map_invisible(zx, zy);
                } else {
                    await map_monst(mtmp, (0));
                }
                newglyph = glyph_at(zx, zy);
                if (extended && newglyph != oldglyph && !((newglyph) == GLYPH_INVIS_OFF)) {
                    mdetected = (1);
                }
            }
        }
    }
    /* when this instance of clairvoyance is random (see allmain()) and
       the only reason to browse the map is that previously undetected
       monster(s) or object(s) have been revealed, player can prevent
       the you-sense-your-surroundings message and browse operation from
       happening by setting 'quick_farsight' option; for clairvoyance
       spell, that option is ignored because the message and the pause
       for map browsing isn't as intrusive in that circumstance */
    if (random_farsight && game.flags.quick_farsight) {
        mdetected = odetected = (0);
    }
    if (!game.level.flags.hero_memory || unconstrained || mdetected || odetected) {
        await flush_screen(1);
        await You("sense your surroundings.");
        if (extended || ((((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_MON_MALE_OFF && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_MON_FEM_OFF && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_PET_MALE_OFF && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_PET_FEM_OFF && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_RIDDEN_MALE_OFF && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_RIDDEN_FEM_OFF && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_DETECT_MALE_OFF && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph_at(game.u.ux, game.u.uy)) >= GLYPH_DETECT_FEM_OFF && (glyph_at(game.u.ux, game.u.uy)) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
            ter_typ |= 8;
        }
        await browse_map(ter_typ, "anything of interest");
        refresh = (1);
    }
    reconstrain_map();
    game.u.uprops[DETECT_MONSTERS].extrinsic = save_EDetect_mons;
    game.viz_array[game.u.uy][game.u.ux] = save_viz_uyux;
    for (zx = lo_x; zx <= hi_x; zx++) {
        for (zy = lo_y; zy <= hi_y; zy++) {
            /* replace monsters with remembered,unseen monster, then run
       see_monsters() to update visible ones and warned-of ones */
            if (((zx) == game.u.ux && (zy) == game.u.uy)) {
                continue;
            }
            newglyph = glyph_at(zx, zy);
            if (((((newglyph) >= GLYPH_MON_MALE_OFF && (newglyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((newglyph) >= GLYPH_MON_FEM_OFF && (newglyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((newglyph) >= GLYPH_PET_MALE_OFF && (newglyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((newglyph) >= GLYPH_PET_FEM_OFF && (newglyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((newglyph) >= GLYPH_RIDDEN_MALE_OFF && (newglyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((newglyph) >= GLYPH_RIDDEN_FEM_OFF && (newglyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((newglyph) >= GLYPH_DETECT_MALE_OFF && (newglyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((newglyph) >= GLYPH_DETECT_FEM_OFF && (newglyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) && (((newglyph) >= GLYPH_MON_FEM_OFF && (newglyph) < (GLYPH_MON_FEM_OFF + NUMMONS)) ? ((newglyph) - GLYPH_MON_FEM_OFF) : ((newglyph) >= GLYPH_MON_MALE_OFF && (newglyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) ? ((newglyph) - GLYPH_MON_MALE_OFF) : ((newglyph) >= GLYPH_PET_FEM_OFF && (newglyph) < (GLYPH_PET_FEM_OFF + NUMMONS)) ? ((newglyph) - GLYPH_PET_FEM_OFF) : ((newglyph) >= GLYPH_PET_MALE_OFF && (newglyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) ? ((newglyph) - GLYPH_PET_MALE_OFF) : ((newglyph) >= GLYPH_DETECT_FEM_OFF && (newglyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)) ? ((newglyph) - GLYPH_DETECT_FEM_OFF) : ((newglyph) >= GLYPH_DETECT_MALE_OFF && (newglyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) ? ((newglyph) - GLYPH_DETECT_MALE_OFF) : ((newglyph) >= GLYPH_RIDDEN_FEM_OFF && (newglyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS)) ? ((newglyph) - GLYPH_RIDDEN_FEM_OFF) : ((newglyph) >= GLYPH_RIDDEN_MALE_OFF && (newglyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) ? ((newglyph) - GLYPH_RIDDEN_MALE_OFF) : NUMMONS) != PM_LONG_WORM_TAIL) {
                /* map_invisible() was unconditional here but that made
                   remembered objects be forgotten for the case where a
                   monster is immediately redrawn by see_monsters() */
                if ((mtmp = (game.level.monsters[zx][zy])) == null || !(canseemon(mtmp) || sensemon(mtmp))) {
                    await map_invisible(zx, zy);
                }
            }
        }
    }
    await see_monsters();
    if (refresh) {
        await docrt();
    }
}
/* convert a secret door into a normal door; it might be trapped */
export function cvt_sdoor_to_door(lev) {
    let newmask = lev.flags & ~7;
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        /* rogue didn't have doors, only doorways */
        newmask = 0;
    } else {
        /* newly exposed door is closed */
        if (!(newmask & 8)) {
            newmask |= 4;
        }
    }
    lev.typ = DOOR;
    lev.flags = newmask;
    lev.candig = 0;
}
/* update the map for something which has just been found by wand of secret
   door detection or wizard mode ^E; will be called multiple times during a
   single operation if multiple things of interest are discovered */
export async function foundone(zx, zy, glyph) {
    if (((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) || ((glyph) == GLYPH_UNEXPLORED_OFF)) {
        game.level.locations[zx][zy].seenv = (255);
    }
/*
     * This works [for non-monsters at present] but flash_glyph_at()
     * seems preferrable because the tmp_at() variation requires that
     * the player respond to --More-- at the end, the flash_glyph
     * variation doesn't.
     */
{
        let save_viz = game.viz_array[zy][zx];
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            game.viz_array[zy][zx] = 1 | 2;
        }
        await newsym(zx, zy);
        game.viz_array[zy][zx] = save_viz;
    }
}
/* find something at one location; this should find all somethings there
   since it is used for magical detection rather than physical searching */
export async function findone(zx, zy, whatfound) {
    let lev = game.level.locations[zx][zy];
    let ttmp = t_at(zx, zy);
    let mtmp = (game.level.monsters[zx][zy]);
    let found_p = whatfound;
    if (mtmp && (((mtmp).mhp < 1) || (mtmp.isgd && !mtmp.mx))) {
        mtmp = (null);
    }
    /* needed by detect_obj_traps() */
    found_p.ft_cc.x = zx;
    found_p.ft_cc.y = zy;
    if (lev.typ == SDOOR) {
        let sym = lev.horizontal ? S_hcdoor : S_vcdoor;
        await flash_glyph_at(zx, zy, (((sym) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((sym) <= S_trwall) ? ((sym) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((sym) < S_altar) ? (((sym) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((sym) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((sym) < S_arrow_trap + (TRAPNUM - 1)) ? (((sym) - S_grave) + GLYPH_CMAP_B_OFF) : ((sym) <= S_goodpos) ? (((sym) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH), 6);
        cvt_sdoor_to_door(lev);
        recalc_block_point(zx, zy);
        await magic_map_background(zx, zy, 0);
        await foundone(zx, zy, await back_to_glyph(zx, zy));
        found_p.num_sdoors++;
    } else if (lev.typ == SCORR) {
        await flash_glyph_at(zx, zy, (((S_corr) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_corr) <= S_trwall) ? ((S_corr) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_corr) < S_altar) ? (((S_corr) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_corr) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_corr) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_corr) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_corr) <= S_goodpos) ? (((S_corr) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH), 6);
        lev.typ = CORR;
        unblock_point(zx, zy);
        await magic_map_background(zx, zy, 0);
        await foundone(zx, zy, (((S_corr) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_corr) <= S_trwall) ? ((S_corr) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_corr) < S_altar) ? (((S_corr) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_corr) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_corr) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_corr) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_corr) <= S_goodpos) ? (((S_corr) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        found_p.num_scorrs++;
    }
    if (ttmp && !ttmp.tseen && ttmp.ttyp != STATUE_TRAP) {
        await flash_glyph_at(zx, zy, ((((S_arrow_trap + (((ttmp).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((ttmp).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((ttmp).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((ttmp).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((ttmp).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH), 6);
        ttmp.tseen = 1;
        await sense_trap(ttmp, zx, zy, 0);
        await foundone(zx, zy, ((((S_arrow_trap + (((ttmp).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((ttmp).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((ttmp).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((ttmp).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((ttmp).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((ttmp).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        found_p.num_traps++;
    }
    if (closed_door(zx, zy) && (lev.flags & 16) != 0) {
        game.dummytrap.ttyp = TRAPPED_DOOR;
        game.dummytrap.tx = zx , game.dummytrap.ty = zy;
        await flash_glyph_at(zx, zy, ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH), 6);
        game.dummytrap.tseen = 1;
        await sense_trap(game.dummytrap, zx, zy, 0);
        await foundone(zx, zy, ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((game.dummytrap).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        found_p.num_traps++;
    }
    await detect_obj_traps(game.level.buriedobjlist, (1), 0, found_p);
    await detect_obj_traps(game.level.objlist, (1), 0, found_p);
    if (mtmp) {
        await detect_obj_traps(mtmp.minvent, (1), 0, found_p);
    }
    if (((zx) == game.u.ux && (zy) == game.u.uy)) {
        await detect_obj_traps(game.invent, (1), 0, found_p);
    }
    if (mtmp && (!(canseemon(mtmp) || sensemon(mtmp)) || mtmp.mundetected || ((mtmp).m_ap_type & 7))) {
        if (((mtmp).m_ap_type & 7)) {
            await flash_glyph_at(zx, zy, (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((mtmp).data).pmidx)) + (((mtmp).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)), 6);
            await seemimic(mtmp);
            /*foundone(zx, zy, mon_to_glyph(mtmp, rn2_on_display_rng);*/
            found_p.num_mons++;
        } else if (mtmp.mundetected && ((((mtmp.data).mflags1 & 256) != 0) || (((mtmp.data).mflags1 & 128) != 0) || mtmp.data.mlet == S_EEL)) {
            await flash_glyph_at(zx, zy, (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((mtmp).data).pmidx)) + (((mtmp).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)), 6);
            mtmp.mundetected = 0;
            await newsym(zx, zy);
            found_p.num_mons++;
        }
        if (!((lev.glyph) == GLYPH_INVIS_OFF)) {
            if (!(canseemon(mtmp) || sensemon(mtmp))) {
                await flash_glyph_at(zx, zy, GLYPH_INVIS_OFF, 6);
                await map_invisible(zx, zy);
                found_p.num_invis++;
            }
        } else {
            found_p.num_kept_invis++;
        }
    } else if (await unmap_invisible(zx, zy)) {
        await flash_glyph_at(zx, zy, GLYPH_INVIS_OFF, 6);
        found_p.num_cleared_invis++;
    }
}
export async function openone(zx, zy, num) {
    let ttmp = null;
    let otmp = null;
    let num_p = num;
    if ((game.level.objects[zx][zy] != null)) {
        /* let it fall to the next cases. could be on trap. */
        for (otmp = game.level.objects[zx][zy]; otmp; otmp = otmp.v.v_nexthere) {
            if (((otmp).otyp == LARGE_BOX || (otmp).otyp == CHEST) && otmp.olocked) {
                otmp.olocked = 0;
                (num_p.value)++;
            }
        }
    }
    if (game.level.locations[zx][zy].typ == SDOOR || (game.level.locations[zx][zy].typ == DOOR && (game.level.locations[zx][zy].flags & (4 | 8)))) {
        /* note: secret doors can't be trapped; they use levl[][].wall_info;
       see rm.h for the troublesome overlay of doormask and wall_info */
        if (game.level.locations[zx][zy].typ == SDOOR) {
            cvt_sdoor_to_door(game.level.locations[zx][zy]);
        }
        if (game.level.locations[zx][zy].flags & 16) {
            if (dist2((zx), (zy), game.u.ux, game.u.uy) < 3) {
                await b_trapped("door", NO_PART);
            } else {
                await Norep("You %s an explosion!", ((game.viz_array[zy][zx] & 2) != 0) ? "see" : (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "hear" : "feel the shock of"));
            }
            await wake_nearto(zx, zy, 11 * 11);
            game.level.locations[zx][zy].flags = 0;
        } else {
            game.level.locations[zx][zy].flags = 2;
        }
        unblock_point(zx, zy);
        await newsym(zx, zy);
        (num_p.value)++;
    } else if (game.level.locations[zx][zy].typ == SCORR) {
        game.level.locations[zx][zy].typ = CORR;
        unblock_point(zx, zy);
        await newsym(zx, zy);
        (num_p.value)++;
    } else if ((ttmp = t_at(zx, zy)) != null) {
        let mon = null;
        /* unneeded "you notice it arg" */
        let dummy = 0;
        if (!ttmp.tseen && ttmp.ttyp != STATUE_TRAP) {
            ttmp.tseen = 1;
            await newsym(zx, zy);
            (num_p.value)++;
        }
        mon = ((zx) == game.u.ux && (zy) == game.u.uy) ? game.youmonst : (game.level.monsters[zx][zy]);
        if (await openholdingtrap(mon, { get value() { return dummy; }, set value(_v) { dummy = _v; } }) || await openfallingtrap(mon, (1), { get value() { return dummy; }, set value(_v) { dummy = _v; } })) {
            (num_p.value)++;
        }
    } else if (find_drawbridge({ get value() { return zx; }, set value(_v) { zx = _v; } }, { get value() { return zy; }, set value(_v) { zy = _v; } })) {
        await open_drawbridge(zx, zy);
        (num_p.value)++;
    }
}
/* returns number of things found */
export async function findit() {
    let num = 0;
    let k = 0;
    let buf = '';
    let found = { ft_cc: { x: 0, y: 0 }, num_sdoors: 0, num_scorrs: 0, num_traps: 0, num_mons: 0, num_invis: 0, num_cleared_invis: 0, num_kept_invis: 0 };
    /*
     *  findit() -> do_clear_area(findone) -> findone() -> foundone()
     *  is used to notify player where various things have been found.
     *  Changing FOUND_FLASH_COUNT to 0 will switch to tmp_at() to
     *  highlight all discoveries for the current operation, but requires
     *  player to respond to --More-- when done.  Neither allows browsing
     *  the map via getpos() autodescribe (until after it has reverted to
     *  normal display, where found traps might be covered by objects).
     */
    if (game.u.uswallow) {
        return 0;
    }
    /* _COUNT > 0 doesn't need to init tmp_at() */
    memset(found, 0, 1 /* sizeof(struct found_things) */);
    await do_clear_area(game.u.ux, game.u.uy, 8, findone, found);
    /* count that controls "reveal" punctuation; 0..4 */
    k = !!found.num_sdoors + !!found.num_scorrs + !!found.num_traps + !!found.num_mons;
    buf = '';
    if (found.num_sdoors) {
        if (found.num_sdoors > 1) {
            buf = __nh_buf_append(buf, sprintf('', "%d secret doors", found.num_sdoors));
        } else {
            buf = strcat(buf, "a secret door");
        }
        num += found.num_sdoors;
    }
    if (found.num_scorrs) {
        /* note: non-\0 *buf implies that at least one previous type is present */
        /* "doors and corrs" or "doors, corrs ..." */
        if (buf) {
            buf = strcat(buf, (k == 2) ? " and " : ", ");
        }
        if (found.num_scorrs > 1) {
            buf = __nh_buf_append(buf, sprintf('', "%d secret corridors", found.num_scorrs));
        } else {
            buf = strcat(buf, "a secret corridor");
        }
        num += found.num_scorrs;
    }
    if (found.num_traps) {
        /* "doors, corrs, and traps" or "{doors|corrs} and traps"
                   * or "..., traps ..." */
        if (buf) {
            buf = strcat(buf, (k == 3 && !found.num_mons) ? ", and " : (k == 2) ? " and " : ", ");
        }
        if (found.num_traps > 1) {
            buf = __nh_buf_append(buf, sprintf('', "%d traps", found.num_traps));
        } else {
            buf = strcat(buf, "a trap");
        }
        num += found.num_traps;
    }
    if (found.num_mons) {
        /* sdoors, scorrs, and traps call tmp_at() */
        if (buf) {
            buf = strcat(buf, (k > 2) ? ", and " : " and ");
        }
        if (found.num_mons > 1) {
            buf = __nh_buf_append(buf, sprintf('', "%d hidden monsters", found.num_mons));
        } else {
            buf = strcat(buf, "a hidden monster");
        }
        num += found.num_mons;
    }
    if (buf) {
        await You("reveal %s!", buf);
    }
    if (found.num_invis) {
        if (found.num_invis > 1) {
            buf = sprintf(buf, "%d%s unseen monsters", found.num_invis, found.num_kept_invis ? " other" : "");
        } else {
            buf = sprintf(buf, "%s unseen monster", found.num_kept_invis ? "another" : "an");
        }
        await You("detect %s!", buf);
        num += found.num_invis;
    }
    if (found.num_cleared_invis) {
        if (!num) {
            await You_feel("%sless paranoid.", found.num_kept_invis ? "somewhat " : "");
        }
        num += found.num_cleared_invis;
    }
    if (!num) {
        await You("don't find anything.");
    }
    /* note: outside of 'if (tmp_num) { }' */
    return num;
}
/* returns number of things found and opened */
export async function openit() {
    let num = 0;
    /* C passes &num to do_clear_area→openone which does (*num_p)++; carry a
       live {value} ref (the do_clear_area path was previously dead, so this
       surfaced only once limited/area vision was fixed). */
    const num_p = { get value() { return num; }, set value(_v) { num = _v; } };
    if (game.u.uswallow) {
        if ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null)) {
            /* expels() will take care of this */
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("Its mouth opens!");
            } else {
                await pline("%s opens its mouth!", await Monnam(game.u.ustuck));
            }
        }
        await expels(game.u.ustuck, game.u.ustuck.data, (1));
        return -1;
    }
    await do_clear_area(game.u.ux, game.u.uy, 8, openone, num_p);
    return num;
}
/* callback hack for overriding vision in do_clear_area() */
export function detecting(func) {
    return (func == findone || func == openone);
}
export async function find_trap(trap) {
    let cleared = (0);
    trap.tseen = 1;
    await exercise(A_WIS, (1));
    await feel_newsym(trap.tx, trap.ty);
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || game.level.locations[trap.tx][trap.ty].glyph != ((((S_arrow_trap + (((trap).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((trap).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((trap).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((trap).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((trap).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((trap).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((trap).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((trap).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((trap).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((trap).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH)) {
        await cls();
        await map_trap(trap, 1);
        await show_glyph(game.u.ux, game.u.uy, ((game.u.usteed && mon_visible(game.u.usteed)) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((game.u.usteed).data).pmidx)) + (((game.u.usteed).female == 0) ? GLYPH_RIDDEN_MALE_OFF : GLYPH_RIDDEN_FEM_OFF)) : (((game.youmonst.m_ap_type & 7) == M_AP_NOTHING) ? ((((game.u.umonnum != game.u.umonster) || !game.flags.showrace) ? game.u.umonnum : game.urace.mnum) + (((((((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((game.youmonst.m_ap_type & 7) == M_AP_FURNITURE) ? (((game.youmonst.mappearance) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((game.youmonst.mappearance) <= S_trwall) ? ((game.youmonst.mappearance) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((game.youmonst.mappearance) < S_altar) ? (((game.youmonst.mappearance) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((game.youmonst.mappearance) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((game.youmonst.mappearance) < S_arrow_trap + (TRAPNUM - 1)) ? (((game.youmonst.mappearance) - S_grave) + GLYPH_CMAP_B_OFF) : ((game.youmonst.mappearance) <= S_goodpos) ? (((game.youmonst.mappearance) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH) : ((game.youmonst.m_ap_type & 7) == M_AP_OBJECT) ? ((game.youmonst.mappearance) + GLYPH_OBJ_OFF) : ((game.youmonst.mappearance) + ((((((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)))));
        cleared = (1);
    }
    set_msg_xy(trap.tx, trap.ty);
    await You("find %s.", await an(trapname(trap.ttyp, (0))));
    if (cleared) {
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (1));
        await docrt();
    }
}
export async function mfind0(mtmp, via_warning) {
    let x = mtmp.mx;
    let y = mtmp.my;
    let found_something = (0);
    if (via_warning && !warning_of(mtmp)) {
        return -1;
    }
    if (((mtmp).m_ap_type & 7)) {
        await seemimic(mtmp);
        found_something = (1);
    } else {
        /* this used to only be executed if a !canspotmon() test passed
           but that failed to bring sensed monsters out of hiding */
        found_something = !(canseemon(mtmp) || sensemon(mtmp));
        if (mtmp.mundetected && ((((mtmp.data).mflags1 & 256) != 0) || (((mtmp.data).mflags1 & 128) != 0) || mtmp.data.mlet == S_EEL)) {
            if (via_warning && found_something) {
                set_msg_xy(x, y);
                await Your("danger sense causes you to take a second %s.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "to check nearby" : "look close by");
                await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
            }
            mtmp.mundetected = 0;
            found_something = (1);
        }
        await newsym(x, y);
    }
    if (found_something) {
        if (!(canseemon(mtmp) || sensemon(mtmp)) && ((game.level.locations[x][y].glyph) == GLYPH_INVIS_OFF)) {
            return -1;
        }
        await exercise(A_WIS, (1));
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            await map_invisible(x, y);
            set_msg_xy(x, y);
            await You_feel("an unseen monster!");
        } else if (!sensemon(mtmp)) {
            set_msg_xy(x, y);
            await You("find %s.", mtmp.mtame ? await y_monnam(mtmp) : await a_monnam(mtmp));
        }
        return 1;
    }
    return 0;
}
/* intrinsic autosearch vs explicit searching */
export async function dosearch0(aflag) {
    let x = 0;
    let y = 0;
    let trap = null;
    let mtmp = null;
    if (game.u.uswallow) {
        if (!aflag) {
            await Norep("What are you looking for?  The exit?");
        }
    } else {
        let fund = (game.uwep && game.uwep.oartifact && spec_ability(game.uwep, 512)) ? game.uwep.spe : 0;
        if (game.ublindf && game.ublindf.otyp == LENSES && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            fund += 2;
        }
        /* JDS: lenses help searching */
        if (fund > 5) {
            fund = 5;
        }
        for (x = game.u.ux - 1; x < game.u.ux + 2; x++) {
            for (y = game.u.uy - 1; y < game.u.uy + 2; y++) {
                if (!isok(x, y)) {
                    continue;
                }
                if (((x) == game.u.ux && (y) == game.u.uy)) {
                    continue;
                }
                if (!aflag && (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || visible_region_at(x, y))) {
                    await feel_location(x, y);
                }
                if (game.level.locations[x][y].typ == SDOOR) {
                    if (rnl(7 - fund)) {
                        continue;
                    }
                    cvt_sdoor_to_door(game.level.locations[x][y]);
                    recalc_block_point(x, y);
                    await exercise(A_WIS, (1));
                    nomul(0);
                    await feel_location(x, y);
                    set_msg_xy(x, y);
                    await You("find a hidden door.");
                } else if (game.level.locations[x][y].typ == SCORR) {
                    if (rnl(7 - fund)) {
                        continue;
                    }
                    game.level.locations[x][y].typ = CORR;
                    unblock_point(x, y);
                    await exercise(A_WIS, (1));
                    nomul(0);
                    await feel_newsym(x, y);
                    set_msg_xy(x, y);
                    await You("find a hidden passage.");
                } else {
                    if ((mtmp = (game.level.monsters[x][y])) != null && !aflag) {
                        let mfres = await mfind0(mtmp, 0);
                        if (mfres == -1) {
                            continue;
                        } else if (mfres > 0) {
                            return mfres;
                        }
                    }
                    /* see if an invisible monster has moved--if Blind,
                     * feel_location() already did it
                     */
                    if (!aflag && !mtmp && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await unmap_invisible(x, y);
                    }
                    if ((trap = t_at(x, y)) && !trap.tseen && !rnl(8)) {
                        nomul(0);
                        if (trap.ttyp == STATUE_TRAP) {
                            if (await activate_statue_trap(trap, x, y, (0))) {
                                await exercise(A_WIS, (1));
                            }
                            return 1;
                        } else {
                            await find_trap(trap);
                        }
                    }
                }
            }
        }
    }
    return 1;
}
/* the #search command -- explicit searching */
export async function dosearch() {
    if (await cmd_safety_prevention("Searching", "another search", "You already found a monster.", { get value() { return game.already_found_flag; }, set value(_v) { game.already_found_flag = _v; } })) {
        return 0;
    }
    return await dosearch0(0) ? 1 : 0;
}
export async function warnreveal() {
    let x = 0;
    let y = 0;
    let mtmp = null;
    for (x = game.u.ux - 1; x <= game.u.ux + 1; x++) {
        for (y = game.u.uy - 1; y <= game.u.uy + 1; y++) {
            if (!isok(x, y) || ((x) == game.u.ux && (y) == game.u.uy)) {
                continue;
            }
            if ((mtmp = (game.level.monsters[x][y])) != null && warning_of(mtmp) && mtmp.mundetected) {
                await mfind0(mtmp, 1);
            }
        }
    }
}
/* skip premap detection of areas outside Sokoban map */
export function skip_premap_detect(x, y) {
    if ((game.level.locations[x][y].typ == STONE) && (game.level.locations[x][y].flags & (8 | 16)) != 0) {
        return (1);
    }
    return (0);
}
/* Pre-map (the sokoban) levels */
export async function premap_detect() {
    let x = 0;
    let y = 0;
    let ttmp = null;
    let obj = null;
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            /* Map the background and boulders */
            if (skip_premap_detect(x, y)) {
                continue;
            }
            game.level.locations[x][y].seenv = (255);
            game.level.locations[x][y].waslit = (1);
            if (game.level.locations[x][y].typ == SDOOR) {
                game.level.locations[x][y].flags = 0;
            }
            await map_background(x, y, 1);
            if ((obj = sobj_at(BOULDER, x, y)) != null) {
                await map_object(obj, 1);
            }
        }
    }
    for (ttmp = game.ftrap; ttmp; ttmp = ttmp.ntrap) {
        ttmp.tseen = 1;
        await map_trap(ttmp, 1);
    }
}
/* used to see under visible gas/cloud regions; caller must declare cmaptmp */
export async function reveal_terrain_getglyph(x, y, swallowed, default_glyph, which_subset) {
    let t = null;
    let mtmp = null;
    let glyph = 0;
    let levl_glyph = 0;
    let seenv = 0;
    let keep_traps = (which_subset & 2) != 0;
    let keep_objs = (which_subset & 4) != 0;
    let keep_mons = (which_subset & 8) != 0;
    /* 'full' overrides impairment and implies no-traps, no-objs, no-mons */
    let full = (which_subset & 16) != 0;
    /*
     * FIXME:
     *  travel treats discovered vibrating square as if it were terrain
     *  rather than a trap so this should do so too.
     */
    /* for 'full', show the actual terrain for the entire level,
       otherwise what the hero remembers for seen locations with
       monsters, objects, and/or traps removed as caller dictates */
    seenv = (full || game.level.flags.hero_memory) ? game.level.locations[x][y].seenv : ((game.viz_array[y][x] & 2) != 0) ? (255) : 0;
    if (full) {
        game.level.locations[x][y].seenv = (255);
        glyph = await back_to_glyph(x, y);
        game.level.locations[x][y].seenv = seenv;
    } else {
        /* used by glyph_is_gascloud() macro */
        let cmaptmp = 0;
        let reg = visible_region_at(x, y);
        let was_mon = (0);
        levl_glyph = game.level.flags.hero_memory ? game.level.locations[x][y].glyph : seenv ? await back_to_glyph(x, y) : default_glyph;
        /* glyph_at() returns the displayed glyph, which might
           be a monster.  levl[][].glyph contains the remembered
           glyph, which will never be a monster (unless it is
           the invisible monster glyph, which is handled like
           an object, replacing any object or trap at its spot) */
        glyph = !swallowed ? glyph_at(x, y) : levl_glyph;
        if (keep_mons && ((x) == game.u.ux && (y) == game.u.uy) && swallowed) {
            glyph = (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((game.u.ustuck).data).pmidx)) + (((game.u.ustuck).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF));
        } else if ((!keep_mons && (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) || ((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6)))) || ((glyph) >= GLYPH_SWALLOW_OFF && (glyph) < (((NUMMONS << 3) + GLYPH_SWALLOW_OFF)))) {
            glyph = levl_glyph;
            was_mon = (1);
        }
        if (((!keep_objs && (((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) || ((glyph) == GLYPH_INVIS_OFF)) && keep_traps && !((is_pool(x, y) && !(game.u.uinwater)) || (game.level.locations[x][y].typ == LAVAPOOL) || (game.level.locations[x][y].typ == LAVAWALL))) {
            if ((t = t_at(x, y)) != null && t.tseen) {
                glyph = ((((S_arrow_trap + (((t).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((t).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((t).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((t).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((t).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((t).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((t).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
            }
        }
        if ((!keep_objs && (((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) || (!keep_traps && (((glyph) >= ((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) && (glyph) < (((GLYPH_CMAP_B_OFF + (S_arrow_trap - S_grave))) + (TRAPNUM - 1))) || (reg && (((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && ((cmaptmp = glyph_to_cmap(glyph)) == S_cloud || cmaptmp == S_poisoncloud))))) || (reg && was_mon) || ((glyph) == GLYPH_INVIS_OFF)) {
            if (!seenv) {
                /* we either show both traps and visible regions (trap if both
               are present at the same spot) or neither traps nor regions */
                /* it's possible to have a visible region shown at an
                   otherwise unexplored location (cast stinking cloud
                   through unexplored corridor into lit room, then approach
                   far enough to be adjacent to the cloud without having
                   seen the corridor underneath it) */
                glyph = !reg ? default_glyph : GLYPH_UNEXPLORED_OFF;
            } else if (keep_traps && reg && ((((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && ((cmaptmp = glyph_to_cmap(glyph)) == S_cloud || cmaptmp == S_poisoncloud)) || was_mon)) {
                t = t_at(x, y);
                /* we need reg->glyph here when there's a monster shown
                   at a region spot; the region glyph isn't the remembered
                   background glyph or the current glyph */
                /* FIXME? what about objects temporarily hidden by regions?
                   when objects are being shown, shouldn't showing them take
                   precedence over showing the region, just like traps? */
                glyph = (t && t.tseen) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) == S_stone) ? GLYPH_CMAP_STONE_OFF : (((S_arrow_trap + (((t).ttyp)) - 1)) <= S_trwall) ? (((S_arrow_trap + (((t).ttyp)) - 1)) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : (((S_arrow_trap + (((t).ttyp)) - 1)) < S_altar) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_ndoor) + GLYPH_CMAP_A_OFF) : (((S_arrow_trap + (((t).ttyp)) - 1)) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : (((S_arrow_trap + (((t).ttyp)) - 1)) < S_arrow_trap + (TRAPNUM - 1)) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_grave) + GLYPH_CMAP_B_OFF) : (((S_arrow_trap + (((t).ttyp)) - 1)) <= S_goodpos) ? ((((S_arrow_trap + (((t).ttyp)) - 1)) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH) : reg.glyph;
            } else if (game.lastseentyp[x][y] == game.level.locations[x][y].typ) {
                glyph = await back_to_glyph(x, y);
            } else {
                if ((mtmp = (game.level.monsters[x][y])) != null && ((mtmp).m_ap_type & 7) == M_AP_FURNITURE) {
                    /* look for a mimic here posing as furniture;
                   if we don't find one, we'll have to fake it */
                    glyph = (((mtmp.mappearance) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((mtmp.mappearance) <= S_trwall) ? ((mtmp.mappearance) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((mtmp.mappearance) < S_altar) ? (((mtmp.mappearance) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((mtmp.mappearance) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((mtmp.mappearance) < S_arrow_trap + (TRAPNUM - 1)) ? (((mtmp.mappearance) - S_grave) + GLYPH_CMAP_B_OFF) : ((mtmp.mappearance) <= S_goodpos) ? (((mtmp.mappearance) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
                } else {
                    let save_spot = { glyph: 0, typ: 0, seenv: 0, flags: 0, horizontal: 0, lit: 0, waslit: 0, roomno: 0, edge: 0, candig: 0 };
                    /*
                     * We have a topology type but we want a screen symbol
                     * in order to derive a glyph.  Some screen symbols need
                     * the flags field of levl[][] in addition to the type
                     * (to disambiguate STAIRS to S_upstair or S_dnstair,
                     * for example).  Current flags might not be intended
                     * for remembered type, but we've got no other choice.
                     * An exception is wall_info which can be recalculated and
                     * needs to be.  Otherwise back_to_glyph() -> wall_angle()
                     * might issue an impossible() for it if it is currently
                     * doormask==D_OPEN for an open door remembered as a wall.
                     */
                    Object.assign(save_spot, game.level.locations[x][y]);
                    game.level.locations[x][y].typ = game.lastseentyp[x][y];
                    if (((game.level.locations[x][y].typ) && (game.level.locations[x][y].typ) <= DBWALL) || game.level.locations[x][y].typ == SDOOR) {
                        xy_set_wall_state(x, y);
                    }
                    glyph = await back_to_glyph(x, y);
                    Object.assign(game.level.locations[x][y], save_spot);
                }
            }
        }
    }
    if (glyph == (((S_darkroom) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_darkroom) <= S_trwall) ? ((S_darkroom) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_darkroom) < S_altar) ? (((S_darkroom) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_darkroom) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_darkroom) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_darkroom) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_darkroom) <= S_goodpos) ? (((S_darkroom) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH)) {
        glyph = (((S_room) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_room) <= S_trwall) ? ((S_room) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_room) < S_altar) ? (((S_room) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_room) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_room) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_room) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_room) <= S_goodpos) ? (((S_room) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
    } else if (glyph == (((S_litcorr) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_litcorr) <= S_trwall) ? ((S_litcorr) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_litcorr) < S_altar) ? (((S_litcorr) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_litcorr) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_litcorr) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_litcorr) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_litcorr) <= S_goodpos) ? (((S_litcorr) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH)) {
        glyph = (((S_corr) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_corr) <= S_trwall) ? ((S_corr) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_corr) < S_altar) ? (((S_corr) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_corr) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_corr) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_corr) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_corr) <= S_goodpos) ? (((S_corr) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
    }
    return glyph;
}
/* cmap_to_glyph() evaluates its argument multiple times, so pull the
       tree vs stone conditional out of it */
/*
     * Squeeze out excess vertical space when dumping the map.
     * If there are any blank map rows at the top, suppress them
     * (our caller has already printed a separator).  If there is
     * more than one blank map row at the bottom, keep just one.
     * Any blank rows within the middle of the map are kept.
     * Note: putstr() with winid==0 is for dumplog.
     */
/* assume blank until we discover otherwise */
/* buf[] index rather than map's x */
/* map row #y */
/* DUMPLOG */
/* idea from crawl; show known portion of map without any monsters,
   objects, or traps occluding the view of the underlying terrain;
   in explore or wizard modes, can also display unexplored portion */
/* TER_TRP | TER_OBJ | TER_MON | TER_FULL */
export async function reveal_terrain(which_subset) {
    let full = (which_subset & 16) != 0;
    if (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || game.u.uprops[STUNNED].intrinsic || game.u.uprops[CONFUSION].intrinsic) && !full) {
        await You("are too disoriented for this.");
    } else {
        let x = 0;
        let y = 0;
        let glyph = 0;
        let default_glyph = 0;
        let buf = '';
        /* there is a TER_MAP bit too; we always show map regardless of it */
        let keep_traps = (which_subset & 2) != 0;
        let keep_objs = (which_subset & 4) != 0;
        let keep_mons = (which_subset & 8) != 0;
        let swallowed = game.u.uswallow;
        let default_sym = game.level.flags.arboreal ? S_tree : S_stone;
        if (unconstrain_map()) {
            await docrt();
        }
        default_glyph = (((default_sym) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((default_sym) <= S_trwall) ? ((default_sym) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((default_sym) < S_altar) ? (((default_sym) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((default_sym) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((default_sym) < S_arrow_trap + (TRAPNUM - 1)) ? (((default_sym) - S_grave) + GLYPH_CMAP_B_OFF) : ((default_sym) <= S_goodpos) ? (((default_sym) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
        for (x = 1; x < 80; x++) {
            for (y = 0; y < 21; y++) {
                glyph = await reveal_terrain_getglyph(x, y, swallowed, default_glyph, which_subset);
                await show_glyph(x, y, glyph);
            }
        }
        await flush_screen(1);
        if (full) {
            buf = strcpy(buf, "underlying terrain");
        } else {
            buf = strcpy(buf, "known terrain");
            if (keep_traps) {
                buf = __nh_buf_append(buf, sprintf('', "%s traps", (keep_objs || keep_mons) ? "," : " and"));
            }
            if (keep_objs) {
                buf = __nh_buf_append(buf, sprintf('', "%s%s objects", (keep_traps || keep_mons) ? "," : "", keep_mons ? "" : " and"));
            }
            if (keep_mons) {
                buf = __nh_buf_append(buf, sprintf('', "%s and monsters", (keep_traps || keep_objs) ? "," : ""));
            }
        }
        await pline("Showing %s only...", buf);
        /* allow player to move cursor around and get autodescribe feedback
           based on what is visible now rather than what is on 'real' map */
        which_subset |= 1;
        await browse_map(which_subset, "anything of interest");
        await map_redisplay();
    }
    return;
}
/*detect.c*/
/* redraw the screen to remove unseen traps from the map */
/* only under me - no separate display required */
/* one-shot detection--allow player to move cursor around and
               get autodescribe feedback */
/* persistent detection--just show updated map */
/* show chest traps first, first buried chests then floor chests, so
       that subsequent floor trap display will override if both types are
       present at the same location */
/* chest traps (might be buried or carried) */
/* traps exist, but only under me - no separate display required */
/* [what about clipped map with points of interest outside of the
            currently shown area?] */
/* we need to browse all types because we haven't redrawn the map
          * with only points of interest */
/* physical damage cause by the shards and force */
/* Don't filter out ' ' here; it has a use */
/* Possible extension:
     *  If ch=='?', ask whether player wants to find scrolls or is asking
     *  for help in using the crystal ball.
     */
/* destroy ball if used after being cancelled */
/* no damage to hero but 'multi' has a small negative value */
/* checking furniture before objects allows '_' to find altars
           (along with other furniture) instead of finding iron chains */
/* possibly update #overview */
/* browse_map() instead of display_nhwindow(WIN_MAP, TRUE) */
/* calls reconstrain_map() and docrt() */
/* this will remove 'remembered, unseen mon' (and objects) */
/* if there is a monster here, see or detect it,
               possibly as "remembered, unseen monster" */
/* if we're going to offer browse_map()/getpos() scanning of
                   the map and we're not doing extended/blessed clairvoyance
                   (hence must be swallowed or underwater), show "unseen
                   creature" unless map already displayed a monster here */
/* the getpos() prompt from browse_map() is only shown when
           flags.verbose is set, but make this unconditional so that
           not-verbose users become aware of the prompting situation */
/* fake spellbook 'sobj' implies hero has cast the spell;
               when book is blessed, casting is skilled or expert level;
               if already clairvoyant, non-skilled spell acts like skilled */
/* [shouldn't successful 'find' reveal and activate statue traps?] */
/* flash the invisible monster glyph because it is already gone */
/* make sure it isn't an open drawbridge */
/* at least 1 "remembered, unseen monster" marker has been removed */
/* note: num_kept_invis is not included in the final result */
/* The "Hallucination ||" is to preserve 3.6.1 behavior, but this
       behavior might need a rework in the hallucination case
       (e.g. to not prompt if any trap glyph appears on the square). */
/* There's too much clutter to see your find otherwise */
/* Found invisible monster in square which already has
                        * 'I' in it.  Logically, this should still take time
                        * and lead to `return 1', but if we did that the hero
                        * would keep finding the same monster every turn. */
/* Be careful not to find anything in an SCORR or SDOOR */
/* see rm.h for explanation */
/* hero's location is not highlighted, but getpos() starts with
           cursor there, and after moving it anywhere '@' moves it back */
