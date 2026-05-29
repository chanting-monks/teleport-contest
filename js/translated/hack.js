import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	hack.c	$NHDT-Date: 1763708572 2025/11/20 23:02:52 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.494 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Derek S. Ray, 2015. */
/* NetHack may be freely redistributed.  See license for details. */
/* #define DEBUG */
/* uncomment for debugging */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, Your, pline, pline_The, pline_dir, raw_printf, verbalize } from '../c2js-runtime/pline.js';
import { qsort } from '../c2js-runtime/qsort.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcmp, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { check_leash } from './apply.js';
import { attacks, is_art } from './artifact.js';
import { acurr, acurrstr, adjalign, exercise } from './attrib.js';
import { drag_ball, move_bc } from './ball.js';
import { midnight } from './calendar.js';
import { cmd_from_func, cmdq_clear, cmdq_peek, confdir, directionname, do_reqmenu, ext_func_tab_from_func, isok, paranoid_query, reset_occupations, xytodir } from './cmd.js';
import { db_under_typ, is_db_wall, is_ice, is_lava, is_pool, is_pool_or_lava, is_waterwall } from './dbridge.js';
import { c_common_strings, cg, decl_globals_init, dirs_ord, xdir, ydir } from './decl.js';
import { buried_ball, buried_ball_to_punishment, bury_objs, dig_typ, use_pick_axe2, watch_dig } from './dig.js';
import { back_to_glyph, canseemon, curs_on_u, docrt, feel_location, glyph_at, is_safemon, map_invisible, map_object, mon_visible, newsym, sensemon, tmp_at, unmap_invisible, unmap_object } from './display.js';
import { boulder_hits_pool, flooreffects, revive_corpse } from './do.js';
import { Amonnam, YMonnam, a_monnam, hliquid, m_monnam, mon_nam, pmname, x_monnam, y_monnam } from './do_name.js';
import { Boots_off, Boots_on, Ring_off, hard_helmet, off_msg, stop_donning } from './do_wear.js';
import { abuse_dog } from './dog.js';
import { dokick } from './dokick.js';
import { breaktest } from './dothrow.js';
import { defsyms } from './drawing.js';
import { In_mines, Invocation_lev, assign_level, ceiling, depth, get_level, has_ceiling, on_level, room_discovered, surface, u_on_newpos } from './dungeon.js';
import { gethungry, morehungry } from './eat.js';
import { done } from './end.js';
import { can_reach_floor, engr_at, wipe_engr_at } from './engrave.js';
import { experience, more_experienced, newexplevel } from './exper.js';
import { glyph_to_cmap } from './glyphs.js';
import { dist2, distmin, highc, ing_suffix, s_suffix, upstart, visctrl } from './hacklib.js';
import { record_achievement } from './insight.js';
import { carrying, delobj, freeinv, sobj_at, useupf } from './invent.js';
import { doopen_indir } from './lock.js';
import { mdamageu } from './mhitu.js';
import { maybe_adjust_hero_bubble, water_friction } from './mkmaze.js';
import { add_to_migration, obj_extract_self, obj_ice_effects, place_object, remove_object, splitobj } from './mkobj.js';
import { inside_room, search_special } from './mkroom.js';
import { curr_mon_load, hideunder, maybe_unhide_at, minliquid, mnexto, seemimic, set_ustuck, wake_msg, wake_nearto } from './mon.js';
import { Resists_Elem, attacktype, attacktype_fordmg, dmgtype, dmgtype_fromattack, locomotion, noattacks, passes_bars, sticks } from './mondata.js';
import { accessible, can_fog, can_ooze, closed_door, dissolve_bars, m_postmove_effect, onscary } from './monmove.js';
import { hit_bars } from './mthrowu.js';
import { ACH_TOWN, AIR, ALTAR, ANTHOLE, ART_STING, A_CON, A_DEX, A_STR, BARRACKS, BEEHIVE, BLINDED, BOULDER, CANDELABRUM_OF_INVOCATION, CLOUD, CMDQ_EXTCMD, COCKNEST, COIN_CLASS, COLD_RES, CONFLICT, CONFUSION, CORPSE, CORR, COURT, CQ_CANNED, DBWALL, DEAF, DELPHI, DIED, DISINT_RES, DISMOUNT_FELL, DISMOUNT_GENERIC, DOOR, DRAWBRIDGE_UP, DWARVISH_MATTOCK, EXT_ENCUMBER, FAST, FIRE_RES, FIRST_OBJECT, FLYING, FOOT, FOUNTAIN, FUMBLING, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_UNEXPLORED_OFF, GLYPH_WARNING_OFF, GOLD_SYM, GRAVE, HALF_PHDAM, HALLUC, HALLUC_RES, HEAVY_IRON_BALL, HOLE, HVY_ENCUMBER, ICE, INVIS, IRONBARS, LANDMINE, LAVAPOOL, LAVAWALL, LEATHER, LEPREHALL, LEVEL_TELEP, LEVITATION, LEVITATION_BOOTS, MAGICAL_BREATHING, MAX_CARR_CAP, MAX_TYPE, MELT_ICE_AWAY, MOAT, MOD_ENCUMBER, MORGUE, M_AP_FURNITURE, M_AP_NOTHING, M_AP_OBJECT, NEUTRAL, NHCORE_GETPOS_TIP, NO_PART, NO_TRAP, NUMMONS, NUM_OBJECTS, NUM_TIPS, N_DIRS_Z, OROOM, OVERLOADED, PASSES_WALLS, PICK_AXE, PIT, PLNMSG_BACK_ON_GROUND, PM_AIR_ELEMENTAL, PM_CAPTAIN, PM_DEATH, PM_DISPLACER_BEAST, PM_ELF, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_GRID_BUG, PM_LIEUTENANT, PM_LONG_WORM_TAIL, PM_ORACLE, PM_PESTILENCE, PM_SALAMANDER, PM_SERGEANT, PM_SOLDIER, PM_VALKYRIE, PM_WIZARD, PM_WIZARD_OF_YENDOR, POISON_RES, POOL, PROT_FROM_SHAPE_CHANGERS, P_BASIC, P_DAGGER, P_NONE, P_PICK_AXE, P_RIDING, P_SABER, P_UNSKILLED, RIN_LEVITATION, ROLLING_BOULDER_TRAP, ROOM, RUBBER_HOSE, RUN_CRAWL, RUN_LEAP, RUN_TPORT, SCORR, SDOOR, SEE_INVIS, SHOCK_RES, SHOPBASE, SINK, SLEEP_RES, SLIME_MOLD, SLT_ENCUMBER, SPIKED_PIT, STAIRS, STATUE, STEALTH, STONE, STUNNED, SWAMP, SWIMMING, S_EEL, S_EYE, S_GHOST, S_LIGHT, S_MIMIC, S_NYMPH, S_PIERCER, S_VORTEX, S_arrow_trap, S_digbeam, S_goodpos, S_hcdoor, S_stone, S_vcdoor, TELEPORT, TELEPORT_CONTROL, TELEP_TRAP, TEMPLE, THRONE, TIMER_OBJECT, TIP_ENHANCE, TIP_GETPOS, TIP_SWIM, TIP_UNTRAP_MON, TOOL_CLASS, TRAPDOOR, TRAPNUM, TRAP_CLEARLY_IMMUNE, TREE, TT_BEARTRAP, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, TT_NONE, TT_PIT, TT_WEB, Trap_Caught_Mon, Trap_Effect_Finished, Trap_Killed_Mon, Trap_Moved_Mon, UNCHANGING, UNENCUMBERED, VIBRATING_SQUARE, WAN_DIGGING, WARNING, WATER, WATER_WALKING_BOOTS, WEAPON_CLASS, WEB, WOUNDED_LEGS, WT_ELF, WT_HUMAN, WT_SQUEEZABLE_INV, WT_TOOMUCH_DIAGONAL, WT_WEIGHTCAP_SPARE, WT_WEIGHTCAP_STRCON, WT_WOUNDEDLEG_REDUCT, WWALKING, ZOMBIFY_MON, ZOO, invlet_basic, xFLOOR, xGROUND, xOPENDOOR, xSEA, xSHUTDOOR, xSUBMERGED, xSWAMP, xWATERWALL } from './nh-constants.js';
import { init_objects, objdescr_is } from './o_init.js';
import { The, Tobjnam, an, ansimpleoname, bare_artifactname, doname, helm_simple_name, just_an, makeplural, otense, simple_typename, the, xname } from './objnam.js';
import { waterbody_name } from './pager.js';
import { autopick_testobj, loot_mon, pickup } from './pickup.js';
import { Norep, There, livelog_printf, pline_xy, set_msg_xy, urgent_pline } from './pline.js';
import { body_part, float_vs_flight, rehumanize } from './polyself.js';
import { incr_itimeout } from './potion.js';
import { intemple } from './priest.js';
import { in_out_region, reg_damg, visible_region_at } from './region.js';
import { d, rn2, rnd } from './rnd.js';
import { Hello } from './role.js';
import { CapitalMon } from './rumors.js';
import { selection_free, selection_getpoint, selection_new, selection_setpoint } from './selvar.js';
import { add_damage, addtobill, block_door, block_entry, costly_spot, find_objowner, onshopbill, pay_for_damage, shop_keeper, stolen_value, subfrombill, u_entered_shop, u_left_shop } from './shk.js';
import { On_stairs } from './stairs.js';
import { dismount_steed, exercise_steed, place_monster, rider_cant_reach, stucksteed } from './steed.js';
import { enexto, goodpos, random_teleport_level, rloc_to, rloco } from './teleport.js';
import { fall_asleep, peek_timer, spot_stop_timers, spot_time_left, start_timer, stop_timer } from './timeout.js';
import { b_trapped, back_on_ground, blow_up_landmine, climb_pit, deltrap, dotrap, drown, feeltrap, fill_pit, float_down, float_up, immune_to_trap, into_vs_onto, launch_obj, lava_effects, mintrap, reset_utrap, seetrap, selftouch, sokoban_guilt, t_at, trapname, uteetering_at_seen_pit } from './trap.js';
import { do_attack, explum, stumble_onto_mimic } from './uhitm.js';
import { block_point, recalc_block_point, vision_recalc } from './vision.js';
import { use_skill, uwep_skill_type, weapon_descr } from './weapon.js';
import { setuwep } from './wield.js';
import { worm_cross } from './worm.js';

/* XXX: if more sources of water walking than just boots are added,
   cause_known(insight.c) should be externified and used for this */
/* mode values for findtravelpath() */
export function uint_to_any(ui) {
    return { a_obj: null, a_void: null, a_monst: null, a_long: ui, a_int: ui, a_uint: ui, a_ulong: ui, a_iflags: ui };
}
export function long_to_any(lng) {
    return { a_obj: null, a_void: null, a_monst: null, a_long: lng, a_int: lng, a_uint: lng, a_ulong: lng, a_iflags: lng };
}
export function monst_to_any(mtmp) {
    return { a_obj: null, a_void: mtmp, a_monst: mtmp, a_long: 0, a_int: 0, a_uint: 0, a_ulong: 0, a_iflags: 0 };
}
export function obj_to_any(obj) {
    return { a_obj: obj, a_void: obj, a_monst: null, a_long: 0, a_int: 0, a_uint: 0, a_ulong: 0, a_iflags: 0 };
}
export function revive_nasty(x, y, msg) {
    let otmp = null;
    let otmp2 = null;
    let mtmp = null;
    let cc = { x: 0, y: 0 };
    let revived = (0);
    for (otmp = game.level.objects[x][y]; otmp; otmp = otmp2) {
        otmp2 = otmp.v.v_nexthere;
        if (otmp.otyp == CORPSE && (((game.mons[otmp.corpsenm]) == game.mons[PM_DEATH] || (game.mons[otmp.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[otmp.corpsenm]) == game.mons[PM_PESTILENCE]) || otmp.corpsenm == PM_WIZARD_OF_YENDOR)) {
            /* move any living monster already at that location */
            if ((mtmp = (game.level.monsters[x][y])) && enexto(cc, x, y, mtmp.data)) {
                rloc_to(mtmp, cc.x, cc.y);
            }
            if (msg) {
                Norep("%s", msg);
            }
            revived = revive_corpse(otmp);
        }
    }
    if (revived) {
        /* this location might not be safe, if not, move revived monster */
        mtmp = (game.level.monsters[x][y]);
        if (mtmp && !goodpos(x, y, mtmp, 0) && enexto(cc, x, y, mtmp.data)) {
            rloc_to(mtmp, cc.x, cc.y);
        }
    }
    return revived;
}
/* can hero move onto a spot containing one or more boulders?
   used for m<dir> and travel and during boulder push failure */
export function could_move_onto_boulder(sx, sy) {
    /* can if able to phaze through rock (must be poly'd, so not riding) */
    /* poly'd into a grid bug... */
    if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        /* OK, it is a legal place to move. */
        return (1);
    }
    if (game.u.usteed) {
        /* don't stop if you're not on a transition between terrain types... */
        /* or you are using shift-dir running and the transition isn't
            dangerous... */
        /* and you know you won't fall in */
        /* XXX: should send 'is_clinger(gy.youmonst.data)' here once clinging
           polyforms are allowed to move over water */
        /* liquid is safe to traverse */
        return (0);
    }
    /* can if a giant, unless doing so allows hero to pass into a
       diagonal squeeze at the same time */
    if ((((game.youmonst.data).mflags2 & 134217728) != 0)) {
        return (!game.u.dx || !game.u.dy || !(((game.level.locations[game.u.ux][sy].typ) < POOL) && ((game.level.locations[sx][game.u.uy].typ) < POOL)));
    }
    /* can if tiny (implies carrying very little else couldn't move at all) */
    if (((game.youmonst.data).msize < 1)) {
        return (1);
    }
    /* can squeeze to spot if carrying extremely little, otherwise can't */
    return (!game.invent || inv_weight() <= (WT_SQUEEZABLE_INV * -1));
}
export function dopush(sx, sy, rx, ry, otmp, costly) {
    let shkp = null;
{
        let what = null;
        let givemesg = 0;
        let easypush = 0;
        if (otmp.o_id != game.bldrpush_oid) {
            /* give boulder pushing feedback if this is a different
           boulder than the last one pushed or if it's been at
           least 2 turns since we last pushed this boulder;
           unlike with Norep(), intervening messages don't cause
           it to repeat, only doing something else in the meantime */
            game.bldrpushtime = game.moves + 1;
            game.bldrpush_oid = otmp.o_id;
        }
        givemesg = (game.moves > game.bldrpushtime + 2 || game.moves < game.bldrpushtime);
        what = givemesg ? the(xname(otmp)) : null;
        if (!game.u.usteed) {
            easypush = (((game.youmonst.data).mflags2 & 134217728) != 0);
            if (givemesg) {
                pline("With %s effort you move %s.", easypush ? "little" : "great", what);
            }
            if (!easypush) {
                exercise(A_STR, (1));
            }
        } else {
            if (givemesg) {
                pline("%s moves %s.", YMonnam(game.u.usteed), what);
            }
        }
        game.bldrpushtime = game.moves;
    }
    /* Move the boulder *after* the message. */
    if (((game.level.locations[rx][ry].glyph) == GLYPH_INVIS_OFF)) {
        unmap_object(rx, ry);
    }
    otmp.corpsenm = 0;
    movobj(otmp, rx, ry);
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        feel_location(rx, ry);
        feel_location(sx, sy);
    } else {
        newsym(sx, sy);
    }
    if (costly && !costly_spot(rx, ry)) {
        /* maybe adjust bill if boulder was pushed across shop boundary;
       normally otmp->unpaid would not apply because otmp isn't in
       hero's inventory, but addtobill() sets it and subfrombill()
       clears it */
        /* pushing from inside shop to its boundary (or free spot) */
        addtobill(otmp, (0), (0), (0));
    } else if (!costly && costly_spot(rx, ry) && otmp.unpaid && ((shkp = shop_keeper(in_rooms(rx, ry, SHOPBASE))) != null) && onshopbill(otmp, shkp, (1))) {
        /* this can happen if hero pushes boulder from farther inside
           shop into shop's free spot (which will add it to the bill),
           then teleports or Passes_walls to doorway (without exiting
           the shop), and then pushes the boulder from the free spot
           back into the shop; it's contingent upon the shopkeeper not
           "muttering an incantation" to fracture the boulder while it
           is unpaid at the free spot */
        subfrombill(otmp, shkp);
    } else if (otmp.unpaid && (shkp = find_objowner(otmp, sx, sy)) != null && !strchr(in_rooms(rx, ry, SHOPBASE), ((shkp).mextra.eshk).shoproom)) {
        /* once the boulder is fully out of the shop, so that it's
         * impossible to change your mind and push it back in without
         * leaving and triggering Kops, switch it to stolen_value */
        stolen_value(otmp, sx, sy, (1), (0));
    }
}
export function cannot_push_msg(otmp, sx, sy) {
    let what = null;
    what = the(xname(otmp));
    if (game.u.usteed) {
        pline("%s tries to move %s, but cannot.", YMonnam(game.u.usteed), what);
    } else {
        You("try to move %s, but in vain.", what);
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        feel_location(sx, sy);
    }
}
export function cannot_push(otmp, sx, sy) {
    if ((((game.youmonst.data).mflags2 & 134217728) != 0)) {
        let canpickup = (!game.level.flags.sokoban_rules && (inv_cnt((0)) < invlet_basic || !carrying(BOULDER)));
        let willpickup = (canpickup && (game.flags.pickup && !game.context.nopick) && autopick_testobj(otmp, (1)));
        if (game.u.usteed && (game.u.weapon_skills[P_RIDING].skill) < P_BASIC) {
            /* similar exception as in can_lift():
                            when poly'd into a giant, you can
                            pick up a boulder if you have a free
                            slot or into the overflow ('#') slot
                            unless already carrying at least one */
            You("aren't skilled enough to %s %s from %s.", willpickup ? "pick up" : "push aside", the(xname(otmp)), y_monnam(game.u.usteed));
        } else {
            /*
             * will pick up:  you easily pick it up
             * can but won't: you maneuver over it and could pick it up
             * can't pick up: you maneuver over it (possibly followed
             *     by feedback from failed auto-pickup attempt)
             */
            pline("However, you %s%s.", willpickup ? "easily pick it up" : "maneuver over it", (canpickup && !willpickup) ? " and could pick it up" : "");
            /* similar to dropping everything and squeezing onto
               a Sokoban boulder's spot, moving to same breaks the
               Sokoban rules because on next step you could go
               past it without pushing it to plug a pit or hole */
            sokoban_guilt();
        }
        return 0;
    }
    if (could_move_onto_boulder(sx, sy)) {
        pline("However, you can squeeze yourself into a small opening.");
        sokoban_guilt();
        return 0;
    } else {
        return -1;
    }
}
export function rock_disappear_msg(otmp) {
    if (game.u.usteed) {
        pline("%s pushes %s and suddenly it disappears!", YMonnam(game.u.usteed), the(xname(otmp)));
    } else {
        You("push %s and suddenly it disappears!", the(xname(otmp)));
    }
}
export function moverock_done(sx, sy) {
    let otmp = null;
    for (otmp = game.level.objects[sx][sy]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.otyp == BOULDER) {
            otmp.corpsenm = 0;
        }
    }
}
export function moverock() {
    fnEnter("moverock", "hack.c", 0);
    let sx = 0;
    let sy = 0;
    let ret = 0;
    /* boulder starting position */
    sx = game.u.ux + game.u.dx , sy = game.u.uy + game.u.dy;
    ret = moverock_core(sx, sy);
    moverock_done(sx, sy);
    return ret;
}
export function moverock_core(sx, sy) {
    fnEnter("moverock_core", "hack.c", 0);
    let rx = 0;
    let ry = 0;
    let otmp = null;
    let ttmp = null;
    let mtmp = null;
    let costly = 0;
    let firstboulder = (1);
    while ((otmp = sobj_at(BOULDER, sx, sy)) != null) {
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (((((glyph_at(sx, sy)) >= GLYPH_BODY_OFF) && ((glyph_at(sx, sy)) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph_at(sx, sy)) >= GLYPH_BODY_PILETOP_OFF) && ((glyph_at(sx, sy)) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))) ? CORPSE : (((((glyph_at(sx, sy)) >= GLYPH_STATUE_MALE_OFF) && ((glyph_at(sx, sy)) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph_at(sx, sy)) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph_at(sx, sy)) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph_at(sx, sy)) >= GLYPH_STATUE_FEM_OFF) && ((glyph_at(sx, sy)) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph_at(sx, sy)) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph_at(sx, sy)) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) ? STATUE : (((glyph_at(sx, sy)) > GLYPH_OBJ_OFF && (glyph_at(sx, sy)) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph_at(sx, sy)) > GLYPH_OBJ_PILETOP_OFF && (glyph_at(sx, sy)) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) ? ((glyph_at(sx, sy)) - (((glyph_at(sx, sy)) > GLYPH_OBJ_PILETOP_OFF && (glyph_at(sx, sy)) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : ((glyph_at(sx, sy)) == GLYPH_OBJ_OFF || ((glyph_at(sx, sy)) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph_at(sx, sy)) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph_at(sx, sy)) == GLYPH_OBJ_PILETOP_OFF || ((glyph_at(sx, sy)) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph_at(sx, sy)) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) ? ((glyph_at(sx, sy)) - (((glyph_at(sx, sy)) == GLYPH_OBJ_PILETOP_OFF || ((glyph_at(sx, sy)) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph_at(sx, sy)) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS))) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : NUM_OBJECTS) != BOULDER) {
            pline("That feels like a boulder.");
            map_object(otmp, (1));
            /* treat entering a visible gas cloud region like entering a trap;
       there could be a known trap as well as a region at the target spot;
       if so, ask about entring the region first; even though this could
       lead to two consecutive confirmation prompts, the situation seems
       to be too uncommon to warrant a separate case with combined
       trap+region confirmation */
            /* skip if player used 'm' prefix or is moving recklessly */
            /* if moving from one region into another, only ask for
               confirmation if the one potentially being entered inflicts
               damage (poison gas) and the one being exited doesn't (vapor) */
            /* check whether attempted move will be viable */
            /* we don't override confirmation for poison resistance since the
           region also hinders hero's vision even if/when no damage is done */
            /* handled like paranoid_confirm:pray; when paranoid_confirm:trap
           isn't set, don't ask at all but if it is set (checked above),
           ask via y/n if parnoid_confirm:confirm isn't also set or via
           yes/no if it is */
            /* not attacking an animal, so we try to move */
            /* stop running or travelling */
            nomul(0);
            /* Give them a chance to climb over it? */
            return -1;
        }
        /* when otmp->next_boulder is 1, xname() will format it as
           "next boulder" instead of just "boulder"; affects
           boulder_hits_pool()'s messages as well as messages below */
        otmp.corpsenm = firstboulder ? 0 : 1;
        /* FIXME?  'firstboulder' should be reset to True if this boulder
           isn't the first and the previous one is named differently from
           this one.  Probably not worth bothering with... */
        firstboulder = (0);
        /* make sure that this boulder is visible as the top object */
        if (otmp != game.level.objects[sx][sy]) {
            movobj(otmp, sx, sy);
        }
        /* boulder destination position */
        rx = game.u.ux + 2 * game.u.dx;
        ry = game.u.uy + 2 * game.u.dy;
        nomul(0);
        if (game.context.nopick) {
            /* using m<dir> towards an adjacent boulder steps over/onto it if
           poly'd into a giant or squeezes under/beside it if small/light
           enough but is a no-op in other circumstances unless move attempt
           reveals an unseen boulder or lack of remembered, unseen monster */
            let oldglyph = glyph_at(sx, sy);
            let res = 0;
            /* same for all 3 if/else-if/else cases */
            feel_location(sx, sy);
            if ((((game.youmonst.data).mflags2 & 134217728) != 0)) {
                /* player has used 'm<dir>' to move, so step to boulder's
                   spot without pushing it; hero is poly'd into a giant,
                   so exotic forms of locomotion are out, but might be
                   levitating (ring, potion, spell) or flying (amulet) */
                You("%s over a boulder here.", u_locomotion("step"));
                /* ["over" seems weird on air level but what else to say?] */
                sokoban_guilt();
                res = 0;
            } else if (could_move_onto_boulder(sx, sy)) {
                You("squeeze yourself %s the boulder.", ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ? "over" : "against");
                sokoban_guilt();
                res = 0;
            } else {
                There("is a boulder in your way.");
                /* use a move if hero learns something; see test_move() for
                   how/why 'context.door_opened' is being dragged into this */
                if (glyph_at(sx, sy) != oldglyph) {
                    game.context.door_opened = game.context.move = (1);
                }
                /* don't move to <sx,sy>, so no soko guilt */
                res = -1;
            }
            return res;
        }
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
            /* FIXME?  behavior in an air bubble on the water level should
               be similar to being on the air level; both cases probably
               ought to let push attempt proceed when flying (which implies
               not levitating) */
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                feel_location(sx, sy);
            }
            You("don't have enough leverage to push %s.", the(xname(otmp)));
            return -1;
        }
        if (((game.youmonst.data).msize < 1) && !game.u.usteed) {
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                feel_location(sx, sy);
            }
            pline("You're too small to push that %s.", xname(otmp));
            return cannot_push(otmp, sx, sy);
        }
        if (isok(rx, ry) && !((game.level.locations[rx][ry].typ) < POOL) && game.level.locations[rx][ry].typ != IRONBARS && (!((game.level.locations[rx][ry].typ) == DOOR) || !(game.u.dx && game.u.dy) || doorless_door(rx, ry)) && !sobj_at(BOULDER, rx, ry)) {
            ttmp = t_at(rx, ry);
            mtmp = (game.level.monsters[rx][ry]);
            costly = (costly_spot(sx, sy) && shop_keeper(in_rooms(sx, sy, SHOPBASE)));
            if (game.level.flags.sokoban_rules && game.u.dx && game.u.dy) {
                /* KMH -- Sokoban doesn't let you push boulders diagonally */
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    feel_location(sx, sy);
                }
                pline("%s won't roll diagonally on this %s.", The(xname(otmp)), surface(sx, sy));
                return cannot_push(otmp, sx, sy);
            }
            if (revive_nasty(rx, ry, "You sense movement on the other side.")) {
                return -1;
            }
            if (mtmp && !((mtmp.data).mlet == S_GHOST) && (!mtmp.mtrapped || !(ttmp && ((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT)))) {
                let deliver_part1 = (0);
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    feel_location(sx, sy);
                }
                if ((canseemon(mtmp) || sensemon(mtmp))) {
                    pline("There's %s on the other side.", a_monnam(mtmp));
                    deliver_part1 = (1);
                } else {
                    ;
                    You_hear("a monster behind %s.", the(xname(otmp)));
                    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                        deliver_part1 = (1);
                    }
                    map_invisible(rx, ry);
                }
                if (game.flags.verbose) {
                    let you_or_steed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    you_or_steed = strcpy(you_or_steed, game.u.usteed ? y_monnam(game.u.usteed) : "you");
                    pline("%s%s cannot move %s.", deliver_part1 ? "Perhaps that's why " : "", deliver_part1 ? you_or_steed : upstart(you_or_steed), deliver_part1 ? "it" : the(xname(otmp)));
                }
                return cannot_push(otmp, sx, sy);
            }
            if (closed_door(rx, ry)) {
                cannot_push_msg(otmp, sx, sy);
                return cannot_push(otmp, sx, sy);
            }
            /* at this point the boulder should be able to move (though
               potentially into something like a trap, pool, or lava) */
            /* rumbling disturbs buried zombies */
            disturb_buried_zombies(sx, sy);
            if (ttmp) {
                let newlev = 0;
                let dest = { dnum: 0, dlevel: 0 };
                switch (ttmp.ttyp) {
                    case LANDMINE:
                        if (rn2(10)) {
                            /* if a trap operates on the boulder, don't attempt
                   to move any others at this location; return -1
                   if another boulder is in hero's way, or 0 if he
                   should advance to the vacated boulder position */
                            obj_extract_self(otmp);
                            /* "kablam" is a variation of "ka-boom" or
                                 "kablooey", rather cartoonish descriptions
                                 of the sound of an explosion, but give it
                                 even when deaf if hero sees the explosion */
                            /* use an alternate exclamation when feeling
                                 the floor/ground/whatever shake (or maybe
                                 a weak shockwave if levitating or flying) */
                            place_object(otmp, rx, ry);
                            newsym(sx, sy);
                            pline("%s!  %s %s land mine.", (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) || !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? "KAABLAMM!!" : "Gadzooks", Tobjnam(otmp, "trigger"), ttmp.madeby_u ? "your" : "a");
                            blow_up_landmine(ttmp);
                            /* if the boulder remains, it should fill the pit */
                            fill_pit(game.u.ux, game.u.uy);
                            if (((game.viz_array[ry][rx] & 2) != 0)) {
                                newsym(rx, ry);
                            }
                            return sobj_at(BOULDER, sx, sy) ? -1 : 0;
                        }
                        break;
                    case SPIKED_PIT:
                    case PIT:
                        obj_extract_self(otmp);
                        /* vision kludge to get messages right;
                       the pit will temporarily be seen even
                       if this is one among multiple boulders */
                        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            game.viz_array[ry][rx] |= 2;
                        }
                        if (!flooreffects(otmp, rx, ry, "fall")) {
                            place_object(otmp, rx, ry);
                        }
                        if (mtmp && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            newsym(rx, ry);
                        }
                        return sobj_at(BOULDER, sx, sy) ? -1 : 0;
                    case HOLE:
                    case TRAPDOOR:
                        ;
                        /* Diagonal moves into a door are not allowed. */
                        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            pline("Kerplunk!  You no longer feel %s.", the(xname(otmp)));
                        } else {
                            pline("%s%s and %s a %s in the %s!", Tobjnam(otmp, (ttmp.ttyp == TRAPDOOR) ? "trigger" : "fall"), (ttmp.ttyp == TRAPDOOR) ? "" : " into", otense(otmp, "plug"), (ttmp.ttyp == TRAPDOOR) ? "trap door" : "hole", surface(rx, ry));
                        }
                        deltrap(ttmp);
                        useupf(otmp, 1);
                        bury_objs(rx, ry);
                        game.level.locations[rx][ry].flags &= ~8;
                        game.level.locations[rx][ry].candig = 1;
                        if (((game.viz_array[ry][rx] & 2) != 0)) {
                            newsym(rx, ry);
                        }
                        return sobj_at(BOULDER, sx, sy) ? -1 : 0;
                    case LEVEL_TELEP:
                        newlev = random_teleport_level();
                        if (newlev == depth(game.u.uz)) {
                            /* 20% chance of picking current level; 100% chance for
                       that if in single-level branch (Knox) or in endgame */
                            /* if trap doesn't work, skip "disappears" message */
                            dopush(sx, sy, rx, ry, otmp, costly);
                            /* more uninteresting terrain */
                            continue;
                        }
                        ;
                    case TELEP_TRAP:
                        rock_disappear_msg(otmp);
                        otmp.corpsenm = 0;
                        if (ttmp.ttyp == TELEP_TRAP) {
                            rloco(otmp);
                        } else {
                            if (costly) {
                                stolen_value(otmp, rx, ry, !ttmp.tseen, (0));
                            }
                            obj_extract_self(otmp);
                            add_to_migration(otmp);
                            get_level(dest, newlev);
                            otmp.ox = dest.dnum;
                            otmp.oy = dest.dlevel;
                            otmp.owornmask = 0;
                        }
                        seetrap(ttmp);
                        return sobj_at(BOULDER, sx, sy) ? -1 : 0;
                    case ROLLING_BOULDER_TRAP:
{
                            let tox = rx;
                            let toy = ry;
                            while (isok(tox + game.u.dx, toy + game.u.dy)) {
                                /* the boulder continues until it reaches one of
                       the trap's launch spots or hits a wall / out-of-bounds */
                                tox += game.u.dx;
                                toy += game.u.dy;
                                if (tox == ttmp.launch.x && toy == ttmp.launch.y) {
                                    break;
                                }
                                if (tox == ttmp.vl.v_launch2.x && toy == ttmp.vl.v_launch2.y) {
                                    break;
                                }
                            }
                            pline("%s away from you!", Tobjnam(otmp, "suddenly roll"));
                            feeltrap(ttmp);
                            launch_obj(BOULDER, sx, sy, tox, toy, 1 | 128);
                            return sobj_at(BOULDER, sx, sy) ? -1 : 0;
                        }
                    /* don't bother -- Passes_walls for hero is rare, moving
         * from one type of wall to another even rarer, and the
         * cost of some extra once per move status updates is low */
                    /* (note: lastseentyp[][] never yields SDOOR) */
                    /* any wall type would do, terrain_descr[] is "Wall" for all;
               forcing just one avoids false 'changed' detection below if
               hero with Passes_walls ability moves from one to another */
                    default:
                        break;
                }
            }
            if (boulder_hits_pool(otmp, rx, ry, (1))) {
                continue;
            }
            if (otmp != game.level.objlist) {
                /*
             * Re-link at top of fobj chain so that pile order is preserved
             * when level is restored.
             */
                remove_object(otmp);
                place_object(otmp, otmp.ox, otmp.oy);
            }
            dopush(sx, sy, rx, ry, otmp, costly);
        } else {
            cannot_push_msg(otmp, sx, sy);
            return cannot_push(otmp, sx, sy);
        }
    }
    return 0;
}
/*
 *  still_chewing()
 *
 *  Chew on a wall, door, or boulder.  [What about statues?]
 *  Returns TRUE if still eating, FALSE when done.
 */
export function still_chewing(x, y) {
    fnEnter("still_chewing", "hack.c", 0);
    let lev = game.level.locations[x][y];
    let boulder = sobj_at(BOULDER, x, y);
    let digtxt = null;
    let dmgtxt = null;
    /* not continuing prev dig (w/ pick-axe) */
    if (game.context.digging.down) {
        memset(game.context.digging, 0, 1 /* sizeof(struct dig_info) */);
    }
    if (!boulder && ((((lev.typ) < POOL) && !may_dig(x, y)) || (lev.typ == IRONBARS && (lev.flags & 8)))) {
        /* may_dig() checks W_NONDIGGABLE but doesn't handle iron bars */
        You("hurt your teeth on the %s.", (lev.typ == IRONBARS) ? "bars" : ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) ? "tree" : "hard stone");
        nomul(0);
        return 1;
    } else if (lev.typ == IRONBARS && (((game.youmonst.data).mflags1 & 2147483648) != 0) && game.u.uhunger > 1500) {
        /* finishing eating via 'morehungry()' doesn't handle choking */
        You("are too full to eat the bars.");
        nomul(0);
        return 1;
    } else if (!game.context.digging.chew || game.context.digging.pos.x != x || game.context.digging.pos.y != y || !on_level(game.context.digging.level, game.u.uz)) {
        game.context.digging.down = (0);
        game.context.digging.chew = (1);
        game.context.digging.warned = (0);
        game.context.digging.pos.x = x;
        game.context.digging.pos.y = y;
        assign_level(game.context.digging.level, game.u.uz);
        /* solid rock takes more work & time to dig through */
        game.context.digging.effort = (((lev.typ) < POOL) && !((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) ? 30 : 60) + game.u.udaminc;
        You("start chewing %s %s.", (boulder || ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) || lev.typ == IRONBARS) ? "on a" : "a hole in the", boulder ? "boulder" : ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) ? "tree" : ((lev.typ) < POOL) ? "rock" : (lev.typ == IRONBARS) ? "bar" : "door");
        watch_dig(null, x, y, (0));
        return 1;
    } else if ((game.context.digging.effort += (30 + game.u.udaminc)) <= 100) {
        if (game.flags.verbose) {
            You("%s chewing on the %s.", game.context.digging.chew ? "continue" : "begin", boulder ? "boulder" : ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) ? "tree" : ((lev.typ) < POOL) ? "rock" : (lev.typ == IRONBARS) ? "bars" : "door");
        }
        game.context.digging.chew = (1);
        watch_dig(null, x, y, (0));
        return 1;
    }
    /* Okay, you've chewed through something */
    if (!game.u.uconduct.food++) {
        livelog_printf(32, "ate for the first time, by chewing through %s", boulder ? "a boulder" : ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) ? "a tree" : ((lev.typ) < POOL) ? "rock" : (lev.typ == IRONBARS) ? "iron bars" : "a door");
    }
    game.u.uhunger += rnd(20);
    if (boulder) {
        delobj(boulder);
        You("eat the boulder.");
        if (((lev.typ) < POOL) || closed_door(x, y) || sobj_at(BOULDER, x, y)) {
            /*
         *  The location could still block because of
         *      1. More than one boulder
         *      2. Boulder stuck in a wall/stone/door.
         *
         *  [perhaps use does_block() below (from vision.c)]
         */
            /* delobj will unblock the point */
            block_point(x, y);
            memset(game.context.digging, 0, 1 /* sizeof(struct dig_info) */);
            return 1;
        }
    } else if (((lev.typ) && (lev.typ) <= DBWALL)) {
        if (in_rooms(x, y, SHOPBASE)) {
            add_damage(x, y, (10 * (acurrstr())));
            dmgtxt = "damage";
        }
        digtxt = "chew a hole in the wall.";
        if (game.level.flags.is_maze_lev) {
            lev.typ = ROOM;
        } else if (game.level.flags.is_cavernous_lev && !in_town(x, y)) {
            lev.typ = CORR;
        } else {
            lev.typ = DOOR;
            lev.flags = 0;
        }
    } else if (((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE))) {
        digtxt = "chew through the tree.";
        lev.typ = ROOM;
    } else if (lev.typ == IRONBARS) {
        if ((((game.youmonst.data).mflags1 & 2147483648) != 0)) {
            /* should always be True here */
            /* arbitrary amount; unlike proper eating, nutrition is
               bestowed in a lump sum at the end */
            let nut = game.objects[HEAVY_IRON_BALL].oc_weight;
            /* lesshungry() requires that victual be set up, so skip it;
               morehungry() of a negative amount will increase nutrition
               without any possibility of choking to death on the meal;
               updates hunger state and requests status update if changed */
            morehungry(-nut);
        }
        digtxt = ((x) == game.u.ux && (y) == game.u.uy) ? "devour the iron bars." : "eat through the bars.";
        dissolve_bars(x, y);
    } else if (lev.typ == SDOOR) {
        if (lev.flags & 16) {
            lev.flags = 0;
            b_trapped("secret door", NO_PART);
        } else {
            digtxt = "chew through the secret door.";
            lev.flags = 1;
        }
        lev.typ = DOOR;
    } else if (((lev.typ) == DOOR)) {
        if (in_rooms(x, y, SHOPBASE)) {
            add_damage(x, y, 400);
            dmgtxt = "break";
        }
        if (lev.flags & 16) {
            lev.flags = 0;
            b_trapped("door", NO_PART);
        } else {
            digtxt = "chew through the door.";
            lev.flags = 1;
        }
    } else {
        digtxt = "chew a passage through the rock.";
        lev.typ = CORR;
    }
    recalc_block_point(x, y);
    newsym(x, y);
    if (digtxt) {
        You("%s", digtxt);
    }
    if (dmgtxt) {
        pay_for_damage(dmgtxt, (0));
    }
    memset(game.context.digging, 0, 1 /* sizeof(struct dig_info) */);
    return 0;
}
export function movobj(obj, ox, oy) {
    /* optimize by leaving on the fobj chain? */
    remove_object(obj);
    maybe_unhide_at(obj.ox, obj.oy);
    newsym(obj.ox, obj.oy);
    place_object(obj, ox, oy);
    newsym(ox, oy);
}
const __dosinkfall_fell_on_sink = "fell onto a sink";
export function dosinkfall() {
    let obj = null;
    let dmg = 0;
    let lev_boots = (game.uarmf && game.uarmf.otyp == LEVITATION_BOOTS);
    let innate_lev = ((game.u.uprops[LEVITATION].intrinsic & (67108864 | 268435456)) != 0);
    let blockd_lev = (game.u.uprops[LEVITATION].blocked == 536870912);
    let ufall = (!innate_lev && !blockd_lev && !(game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic));
    if (!ufall) {
        /* to handle being chained to buried iron ball, trying to
               levitate but being blocked, then moving onto adjacent sink;
               no need to worry about being blocked by terrain because we
               couldn't be over a sink at the same time */
        You((innate_lev || blockd_lev) ? "wobble unsteadily for a moment." : "gain control of your flight.");
    } else {
        let save_ELev = game.u.uprops[LEVITATION].extrinsic;
        let save_HLev = game.u.uprops[LEVITATION].intrinsic;
        game.u.uprops[LEVITATION].extrinsic = game.u.uprops[LEVITATION].intrinsic = 0;
        /* fake removal of levitation in advance so that final
           disclosure will be right in case this turns out to
           be fatal; fortunately the fact that rings and boots
           are really still worn has no effect on bones data */
        You("crash to the floor!");
        dmg = (rn2(8) + (25 - (acurr(A_CON))));
        losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), __dosinkfall_fell_on_sink, 2);
        exercise(A_DEX, (0));
        selftouch("Falling, you");
        for (obj = game.level.objects[game.u.ux][game.u.uy]; obj; obj = obj.v.v_nexthere) {
            if (obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE)) {
                You("fell on %s.", doname(obj));
                losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(3)) + 1) / 2)) : (rnd(3))), __dosinkfall_fell_on_sink, 2);
                exercise(A_CON, (0));
            }
        }
        game.u.uprops[LEVITATION].extrinsic = save_ELev;
        game.u.uprops[LEVITATION].intrinsic = save_HLev;
    }
    if (ufall || lev_boots) {
        /*
     * Interrupt multi-turn putting on/taking off of armor (in which
     * case we reached the sink due to being teleported while busy;
     * in 3.4.3, Boots_on()/Boots_off() [called via (*afternmv)() when
     * 'multi' reaches 0] triggered a crash if we were donning/doffing
     * levitation boots [because the Boots_off() below causes 'uarmf'
     * to be null by the time 'afternmv' gets called]).
     *
     * Interrupt donning/doffing if we fall onto the sink, or if the
     * code below is going to remove levitation boots even when we
     * haven't fallen (innate floating or flying becoming unblocked).
     */
        stop_donning(lev_boots ? game.uarmf : null);
        /* recalculate in case uarmf just got set to null */
        lev_boots = (game.uarmf && game.uarmf.otyp == LEVITATION_BOOTS);
    }
    game.u.uprops[LEVITATION].extrinsic &= ~8192;
    game.u.uprops[LEVITATION].intrinsic &= ~(536870912 | 16777215);
    game.u.uprops[LEVITATION].intrinsic++;
    if (game.uleft && game.uleft.otyp == RIN_LEVITATION) {
        /* remove worn levitation items */
        obj = game.uleft;
        Ring_off(obj);
        off_msg(obj);
    }
    if (game.uright && game.uright.otyp == RIN_LEVITATION) {
        obj = game.uright;
        Ring_off(obj);
        off_msg(obj);
    }
    if (lev_boots) {
        obj = game.uarmf;
        Boots_off();
        off_msg(obj);
    }
    game.u.uprops[LEVITATION].intrinsic--;
    /* probably moot; we're either still levitating or went
       through float_down(), but make sure BFlying is up to date */
    float_vs_flight();
}
/* intended to be called only on ROCKs or TREEs */
export function may_dig(x, y) {
    let lev = game.level.locations[x][y];
    return !((((lev.typ) <= DBWALL) || ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE))) && (lev.flags & 8));
}
export function may_passwall(x, y) {
    return !(((game.level.locations[x][y].typ) <= DBWALL) && (game.level.locations[x][y].flags & 16));
}
export function bad_rock(mdat, x, y) {
    return ((game.level.flags.sokoban_rules && sobj_at(BOULDER, x, y)) || (((game.level.locations[x][y].typ) < POOL) && (!(((mdat).mflags1 & 32) != 0) || (((mdat).mflags1 & 64) != 0) || !may_dig(x, y)) && !((((mdat).mflags1 & 8) != 0) && may_passwall(x, y))));
}
/* caller has already decided that it's a tight diagonal; check whether a
   monster--who might be the hero--can fit through, and if not then return
   the reason why:  1: can't fit, 2: possessions won't fit, 3: sokoban
   returns 0 if we can squeeze through */
export function cant_squeeze_thru(mon) {
    let amt = 0;
    let ptr = mon.data;
    if ((mon == game.youmonst) ? (game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) : (((ptr).mflags1 & 8) != 0)) {
        return 0;
    }
    if (((ptr).msize >= 3) && !((((ptr).mflags1 & 4) != 0) || ((ptr).mlet == S_VORTEX || (ptr) == game.mons[PM_AIR_ELEMENTAL]) || ((ptr).mlet == S_GHOST) || (((ptr).mflags1 & 524288) != 0) || can_fog(mon))) {
        return 1;
    }
    amt = (mon == game.youmonst) ? inv_weight() + weight_cap() : curr_mon_load(mon);
    if (amt > WT_TOOMUCH_DIAGONAL) {
        return 2;
    }
    /* Sokoban restriction applies to hero only */
    if (mon == game.youmonst && game.level.flags.sokoban_rules) {
        return 3;
    }
    return 0;
}
export function invocation_pos(x, y) {
    return (Invocation_lev(game.u.uz) && x == game.inv_pos.x && y == game.inv_pos.y);
}
/* return TRUE if (ux+dx,uy+dy) is an OK place to move;
   mode is one of DO_MOVE, TEST_MOVE, TEST_TRAV, or TEST_TRAP */
/* these are -1|0|+1, not coordinates */
export function test_move(ux, uy, dx, dy, mode) {
    fnEnter("test_move", "hack.c", 0);
    let x = ux + dx;
    let y = uy + dy;
    let tmpr = null;
    let ust = null;
    game.context.door_opened = (0);
    if (!isok(x, y)) {
        return (0);
    }
    tmpr = game.level.locations[x][y];
    if (((tmpr.typ) < POOL) || tmpr.typ == IRONBARS) {
        /*
     *  Check for physical obstacles.  First, the place we are going.
     */
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && mode == 0) {
            feel_location(x, y);
        }
        if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && may_passwall(x, y)) {
            ;
        } else if ((game.u.uinwater)) {
            /* note: if water_friction() changes direction due to
               turbulence, new target destination will always be water,
               so we won't get here, hence don't need to worry about
               "there" being somewhere the player isn't sure of */
            if (mode == 0) {
                There("is an obstacle there.");
            }
            /* check for entering water or lava */
            /* floating or clinging steed keeps hero safe (is_flyer() test
               is redundant; it can't be true since Flying yielded false) */
            return (0);
        } else if (tmpr.typ == IRONBARS) {
            if (mode == 0 && (dmgtype(game.youmonst.data, 24) || dmgtype(game.youmonst.data, 42) || (((game.youmonst.data).mflags1 & 2147483648) != 0)) && still_chewing(x, y)) {
                return (0);
            }
            if (!((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) || passes_bars(game.youmonst.data))) {
                /* never enter wall of liquid */
                /* don't enter pool or lava (must be one of the two to
                   get here) unless flying or levitating or have known
                   water-walking for pool or known lava-walking and
                   already be on/over lava for lava */
                /* Now see if other things block our way . . */
                /* Can't move at a diagonal out of a doorway with door. */
                if (mode == 0 && game.flags.mention_walls) {
                    You("cannot pass through the bars.");
                }
                return (0);
            }
        } else if ((((game.youmonst.data).mflags1 & 32) != 0) && !(((game.youmonst.data).mflags1 & 64) != 0)) {
            if (mode == 0 && still_chewing(x, y)) {
                return (0);
            }
        } else if (game.flags.autodig && !game.context.run && !game.context.nopick && game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp == P_PICK_AXE)) {
            /* MRKR: Automatic digging when wielding the appropriate tool */
            if (mode == 0) {
                use_pick_axe2(game.uwep);
            }
            return (0);
        } else {
            if (mode == 0) {
                if (is_db_wall(x, y)) {
                    pline("That drawbridge is up!");
                } else if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && !may_passwall(x, y) && ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum))) {
                    /* soko restriction stays even after puzzle is solved */
                    pline_The("Sokoban walls resist your ability.");
                } else if (game.flags.mention_walls) {
                    /* a special clue-msg when on the Invocation position */
                    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    let glyph = back_to_glyph(x, y);
                    let sym = ((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) ? glyph_to_cmap(glyph) : -1;
                    if (sym == S_stone) {
                        buf = strcpy(buf, "solid stone");
                    } else if (sym >= 0) {
                        buf = strcpy(buf, an(defsyms[sym].explanation));
                    } else {
                        buf = sprintf(buf, "impossible [background glyph=%d]", glyph);
                    }
                    pline_dir(xytodir(dx, dy), "It's %s.", buf);
                }
            }
            return (0);
        }
    } else if (((tmpr.typ) == DOOR)) {
        if (closed_door(x, y)) {
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && mode == 0) {
                feel_location(x, y);
            }
            if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
                ;
            } else if (can_ooze(game.youmonst)) {
                if (mode == 0) {
                    You("ooze under the door.");
                }
            } else if ((game.u.uinwater)) {
                if (mode == 0) {
                    pline("There is an obstacle there.");
                }
                return (0);
            } else if ((((game.youmonst.data).mflags1 & 32) != 0) && !(((game.youmonst.data).mflags1 & 64) != 0)) {
                if (mode == 0 && still_chewing(x, y)) {
                    return (0);
                }
            } else {
                if (mode == 0) {
                    if ((((game.youmonst.data).mflags1 & 4) != 0)) {
                        You("try to ooze under the door, but can't squeeze your possessions through.");
                    }
                    if (game.flags.autoopen && !game.context.run && !game.u.uprops[CONFUSION].intrinsic && !game.u.uprops[STUNNED].intrinsic && !(game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
                        let tmp = doopen_indir(x, y);
                        /* if 'autounlock' includes Kick, we might have a
                           kick at the door queued up after doopen_indir() */
                        let cq = cmdq_peek(CQ_CANNED);
                        if (tmp == 0 && cq && cq.typ == CMDQ_EXTCMD && cq.ec_entry == ext_func_tab_from_func(dokick)) {
                            game.context.door_opened = (1);
                        /* door hasn't been opened, but fake it so that
                               canned kick will be executed as next command */
                        } else {
                            game.context.door_opened = !closed_door(x, y);
                        }
                        game.context.move = (ux != game.u.ux || uy != game.u.uy);
                    } else if (x == ux || y == uy) {
                        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || game.u.uprops[STUNNED].intrinsic || (acurr(A_DEX)) < 10 || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
                            if (game.u.usteed) {
                                You_cant("lead %s through that closed door.", y_monnam(game.u.usteed));
                            } else {
                                pline("Ouch!  You bump into a door.");
                                exercise(A_DEX, (0));
                            }
                            /* use current move; needed for the "ouch" case
                               but done for steed case too for consistency;
                               we haven't opened a door but we're going to
                               return False and without having 'door_opened'
                               set, 'move' would get reset by caller */
                            game.context.door_opened = game.context.move = (1);
                            /* since we've just lied about successfully
                               moving, we need to manually stop running */
                            /* Don't attack if you're running, and can see it */
                            /* It's fine to displace pets, though */
                            /* We should never get here if forcefight */
                            nomul(0);
                        } else {
                            pline("That door is closed.");
                        }
                    }
                } else if (mode == 2 || mode == 3) {
                    if (dx && dy && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && (!doorless_door(x, y) || block_door(x, y))) {
                        return (0);
                    }
                } else {
                    return (0);
                }
                if (mode == 0) {
                    return (0);
                }
            }
        } else {
            if (dx && dy && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && (!doorless_door(x, y) || block_door(x, y))) {
                if (mode == 0) {
                    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        feel_location(x, y);
                    }
                    if ((game.u.uinwater) || game.flags.mention_walls) {
                        You_cant("move diagonally into an intact doorway.");
                    }
                }
                return (0);
            }
        }
    }
    if (dx && dy && bad_rock(game.youmonst.data, ux, y) && bad_rock(game.youmonst.data, x, uy)) {
        switch (cant_squeeze_thru(game.youmonst)) {
            case 3:
                if (mode == 0) {
                    You("cannot pass that way.");
                }
                return (0);
            case 2:
                if (mode == 0) {
                    You("are carrying too much to get through.");
                }
                return (0);
            case 1:
                if (mode == 0) {
                    Your("body is too large to fit through.");
                }
                return (0);
            default:
                break;
        }
    } else if (dx && dy && worm_cross(ux, uy, x, y)) {
        /* consecutive long worm segments are at <ux,y> and <x,uy> */
        if (mode == 0) {
            pline("%s is in your way.", YMonnam((game.level.monsters[ux][y])));
        }
        return (0);
    }
    if (game.context.run == 8 && (mode != 0) && !((x) == game.u.ux && (y) == game.u.uy)) {
        /* Pick travel path that does not require crossing a trap.
     * Avoid water and lava using the usual running rules.
     * (but not u.ux/u.uy because findtravelpath walks toward u.ux/u.uy) */
        let t = t_at(x, y);
        if (t && t.tseen && t.ttyp != VIBRATING_SQUARE) {
            return (mode == 3);
        }
        /* FIXME: should be using lastseentyp[x][y] rather than seen vector
         */
        if ((game.level.locations[x][y].seenv && is_pool_or_lava(x, y)) && ((((game.level.locations[x][y].typ) == WATER) || game.level.locations[x][y].typ == LAVAWALL) || !(((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || (is_pool(x, y) ? (game.uarmf && game.uarmf.otyp == WATER_WALKING_BOOTS && game.objects[WATER_WALKING_BOOTS].oc_name_known && !game.u.usteed) : (((game.uarmf && game.uarmf.otyp == WATER_WALKING_BOOTS && game.objects[WATER_WALKING_BOOTS].oc_name_known && !game.u.usteed) && (game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) && game.uarmf.oerodeproof && game.uarmf.rknown) && is_lava(game.u.ux, game.u.uy)))))) {
            return (mode == 3);
        }
    }
    if (mode == 3) {
        return (0);
    }
    /* do not move through traps */
    ust = game.level.locations[ux][uy];
    if (dx && dy && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && ((ust.typ) == DOOR) && (!doorless_door(ux, uy) || block_entry(x, y))) {
        if (mode == 0 && game.flags.mention_walls) {
            You_cant("move diagonally out of an intact doorway.");
        }
        return (0);
    }
    if (sobj_at(BOULDER, x, y) && (game.level.flags.sokoban_rules || !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic))) {
        if (mode != 2 && game.context.run >= 2 && !(((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) && !could_move_onto_boulder(x, y)) {
            if (mode == 0 && game.flags.mention_walls) {
                pline_dir(xytodir(dx, dy), "A boulder blocks your path.");
            }
            return (0);
        }
        /* assume you'll be able to push it when you get there... */
        if (mode == 0) {
            if ((((game.youmonst.data).mflags1 & 32) != 0) && !(((game.youmonst.data).mflags1 & 64) != 0) && !game.level.flags.sokoban_rules) {
                /* tunneling monsters will chew before pushing */
                if (still_chewing(x, y)) {
                    return (0);
                }
            } else if (moverock() < 0) {
                return (0);
            }
        } else if (mode == 2) {
            let obj = null;
            /* never travel through boulders in Sokoban */
            if (game.level.flags.sokoban_rules) {
                return (0);
            }
            if (sobj_at(BOULDER, ux, uy) && !game.level.flags.sokoban_rules) {
                /* don't pick two boulders in a row, unless there's a way thru */
                if (!(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && !could_move_onto_boulder(ux, uy) && !((((game.youmonst.data).mflags1 & 32) != 0) && !(((game.youmonst.data).mflags1 & 64) != 0)) && !carrying(PICK_AXE) && !carrying(DWARVISH_MATTOCK) && !((obj = carrying(WAN_DIGGING)) && !game.objects[obj.otyp].oc_name_known)) {
                    return (0);
                }
            }
        }
    }
    return (1);
}
/*
 * Find a path from the destination (u.tx,u.ty) back to (u.ux,u.uy).
 * A shortest path is returned.  If guess is TRUE, consider various
 * inaccessible locations as valid intermediate path points.
 * Returns TRUE if a path was found.
 * gt.travelmap keeps track of map locations we've moved through
 * this travel session. It will be cleared once the travel stops.
 */
export function findtravelpath(mode) {
    found: {
        if (!game.travelmap) {
            game.travelmap = selection_new();
        }
        if ((mode == 0 || mode == 2) && game.context.travel1 && (dist2(((game.u.tx)), ((game.u.ty)), game.u.ux, game.u.uy) <= 2) && crawl_destination(game.u.tx, game.u.ty)) {
            /* if travel to adjacent, reachable location, use normal movement rules */
            /* was '&& distmin(u.ux, u.uy, u.tx, u.ty) == 1' */
            /* handle restricted diagonals */
            end_running((0));
            if (test_move(game.u.ux, game.u.uy, game.u.tx - game.u.ux, game.u.ty - game.u.uy, 1)) {
                if (mode == 0) {
                    game.u.dx = game.u.tx - game.u.ux;
                    game.u.dy = game.u.ty - game.u.uy;
                    nomul(0);
                    game.iflags.travelcc.x = game.iflags.travelcc.y = 0;
                }
                /* weapon is ok; check whether hit is successful */
                return (1);
            }
            if (mode == 0) {
                game.context.run = 8;
            }
        }
        if (game.u.tx != game.u.ux || game.u.ty != game.u.uy) {
            let travel = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
            let travelstepx = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
            let travelstepy = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
            let tx = 0;
            let ty = 0;
            let ux = 0;
            let uy = 0;
            /* max offset in travelsteps */
            let n = 1;
            /* two sets current and previous */
            let set = 0;
            let radius = 1;
            let i = 0;
            if (mode == 1 || mode == 2) {
                /* If guessing, first find an "obvious" goal location.  The obvious
         * goal is the position the player knows of, or might figure out
         * (couldsee) that is closest to the target on a straight path.
         */
                tx = game.u.ux;
                ty = game.u.uy;
                ux = game.u.tx;
                uy = game.u.ty;
            } else {
                tx = game.u.tx;
                ty = game.u.ty;
                ux = game.u.ux;
                uy = game.u.uy;
            }
            noguess: while (true) {
                memset(travel, 0, 80 /* sizeof(coordxy [80][21]) */);
                travelstepx[0][0] = tx;
                travelstepy[0][0] = ty;
                while (n != 0) {
                    let nn = 0;
                    for (i = 0; i < n; i++) {
                        let dir = 0;
                        let x = travelstepx[set][i];
                        let y = travelstepy[set][i];
                        /* no diagonal movement for grid bugs */
                        let dirmax = ((game.u.umonnum) == PM_GRID_BUG) ? 4 : (N_DIRS_Z - 2);
                        let alreadyrepeated = (0);
                        for (dir = 0; dir < dirmax; ++dir) {
                            let nx = x + xdir[dirs_ord[dir]];
                            let ny = y + ydir[dirs_ord[dir]];
                            if (!isok(nx, ny) || ((mode == 1) && !((game.viz_array[ny][nx] & 1) != 0))) {
                                continue;
                            }
                            if ((!(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && !can_ooze(game.youmonst) && closed_door(x, y)) || (sobj_at(BOULDER, x, y) && !could_move_onto_boulder(x, y)) || test_move(x, y, nx - x, ny - y, 3)) {
                                if (travel[x][y] > radius - 3) {
                                    if (!alreadyrepeated) {
                                        /* closed doors and boulders usually cause a delay,
                           so prefer another path; however, giants and tiny
                           creatures can use m<dir> to move onto a boulder's
                           spot without pushing, so allow boulders for them */
                                        travelstepx[1 - set][nn] = x;
                                        travelstepy[1 - set][nn] = y;
                                        nn++;
                                        /* don't change travel matrix! */
                                        alreadyrepeated = (1);
                                    }
                                    continue;
                                }
                            }
                            if (test_move(x, y, nx - x, ny - y, 2) && (game.level.locations[nx][ny].seenv || (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && ((game.viz_array[ny][nx] & 1) != 0)))) {
                                if (nx == ux && ny == uy) {
                                    if (mode == 0 || mode == 2) {
                                        let visited = selection_getpoint(x, y, game.travelmap);
                                        game.u.dx = x - ux;
                                        game.u.dy = y - uy;
                                        if (mode == 0 && ((x == game.u.tx && y == game.u.ty) || visited)) {
                                            nomul(0);
                                            /* reset run so domove run checks work */
                                            game.context.run = 8;
                                            if (visited) {
                                                You("stop, unsure which way to go.");
                                            } else {
                                                game.iflags.travelcc.x = game.iflags.travelcc.y = 0;
                                            }
                                        }
                                        selection_setpoint(game.u.ux, game.u.uy, game.travelmap, 1);
                                        return (1);
                                    }
                                } else if (!travel[nx][ny]) {
                                    travelstepx[1 - set][nn] = nx;
                                    travelstepy[1 - set][nn] = ny;
                                    travel[nx][ny] = radius;
                                    nn++;
                                }
                            }
                        }
                    }
                    if (game.iflags.trav_debug) {
                        /* Use of warning glyph is arbitrary. It stands out. */
                        tmp_at((-2), ((1) + GLYPH_WARNING_OFF));
                        for (i = 0; i < nn; ++i) {
                            tmp_at(travelstepx[1 - set][i], travelstepy[1 - set][i]);
                        }
                        (game.windowprocs.win_delay_output)();
                        if (game.flags.runmode == RUN_CRAWL) {
                            (game.windowprocs.win_delay_output)();
                            (game.windowprocs.win_delay_output)();
                        }
                        tmp_at((-7), 0);
                    }
                    n = nn;
                    set = 1 - set;
                    radius++;
                }
                if (mode == 1) {
                    /* if guessing, find best location in travel matrix and go there */
                    let px = tx;
                    let py = ty;
                    let dist = 0;
                    let nxtdist = 0;
                    let d2 = 0;
                    let nd2 = 0;
                    let ctrav = 0;
                    let ptrav = 80 * 21;
                    dist = distmin(ux, uy, tx, ty);
                    d2 = dist2(ux, uy, tx, ty);
                    for (tx = 1; tx < 80; ++tx) {
                        for (ty = 0; ty < 21; ++ty) {
                            if (((game.viz_array[ty][tx] & 1) != 0) && (ctrav = travel[tx][ty]) > 0) {
                                nxtdist = distmin(ux, uy, tx, ty);
                                if (nxtdist == dist && ctrav < ptrav) {
                                    nd2 = dist2(ux, uy, tx, ty);
                                    if (nd2 < d2) {
                                        px = tx;
                                        py = ty;
                                        d2 = nd2;
                                        ptrav = ctrav;
                                    }
                                } else if (nxtdist < dist) {
                                    px = tx;
                                    py = ty;
                                    dist = nxtdist;
                                    d2 = dist2(ux, uy, tx, ty);
                                    ptrav = ctrav;
                                }
                            }
                        }
                    }
                    if (((px) == game.u.ux && (py) == game.u.uy)) {
                        /* no guesses, just go in the general direction */
                        game.u.dx = sgn(game.u.tx - game.u.ux);
                        game.u.dy = sgn(game.u.ty - game.u.uy);
                        if (test_move(game.u.ux, game.u.uy, game.u.dx, game.u.dy, 1)) {
                            selection_setpoint(game.u.ux, game.u.uy, game.travelmap, 1);
                            return (1);
                        }
                        break found;
                    }
                    if (game.iflags.trav_debug) {
                        tmp_at((-2), ((2) + GLYPH_WARNING_OFF));
                        tmp_at(px, py);
                        (game.windowprocs.win_delay_output)();
                        if (game.flags.runmode == RUN_CRAWL) {
                            (game.windowprocs.win_delay_output)();
                            (game.windowprocs.win_delay_output)();
                            (game.windowprocs.win_delay_output)();
                            (game.windowprocs.win_delay_output)();
                        }
                        tmp_at((-7), 0);
                    }
                    tx = px;
                    ty = py;
                    ux = game.u.ux;
                    uy = game.u.uy;
                    set = 0;
                    n = radius = 1;
                    mode = 0;
                    continue noguess;
                }
                return (0);
                break;
            }
        }
    }
    game.u.dx = 0;
    game.u.dy = 0;
    nomul(0);
    return (0);
}
export function is_valid_travelpt(x, y) {
    let tx = game.u.tx;
    let ty = game.u.ty;
    let ret = 0;
    let glyph = glyph_at(x, y);
    if (((x) == game.u.ux && (y) == game.u.uy)) {
        return (1);
    }
    if (isok(x, y) && ((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) && S_stone == glyph_to_cmap(glyph) && !game.level.locations[x][y].seenv) {
        return (0);
    }
    game.u.tx = x;
    game.u.ty = y;
    ret = findtravelpath(2);
    game.u.tx = tx;
    game.u.ty = ty;
    return ret;
}
/* try to escape being stuck in a trapped state by walking out of it;
   return true iff moving should continue to intended destination
   (all failures and most successful escapes leave hero at original spot) */
/* targeted destination, <u.ux+u.dx,u.uy+u.dy> */
/* nonnull if another trap at <x,y> */
export function trapmove(x, y, desttrap) {
    let anchored = (0);
    let predicament = null;
    let culprit = null;
    let steedname = !game.u.usteed ? null : y_monnam(game.u.usteed);
    if (!game.u.utrap) {
        return (1);
    }
    switch (game.u.utraptype) {
        case TT_BEARTRAP:
            if (game.flags.verbose) {
                /*
     * Note: caller should call reset_utrap() when we set u.utrap to 0.
     */
                predicament = "caught in a bear trap";
                if (game.u.usteed) {
                    Norep("%s is %s.", upstart(steedname), predicament);
                } else {
                    Norep("You are %s.", predicament);
                }
            }
            /* [why does diagonal movement give quickest escape?] */
            if ((game.u.dx && game.u.dy) || !rn2(5)) {
                game.u.utrap--;
            }
            if (!game.u.utrap) {
                if (game.u.usteed) {
                    pline("%s finally %s free.", upstart(steedname), "lurches");
                } else {
                    You("finally %s free.", "wriggle");
                }
            }
            break;
        case TT_PIT:
            if (desttrap && desttrap.tseen && ((desttrap.ttyp) == PIT || (desttrap.ttyp) == SPIKED_PIT)) {
                return (1);
            }
            /* try to escape; position stays same regardless of success */
            climb_pit();
            break;
        case TT_WEB:
            if (is_art(game.uwep, ART_STING)) {
                /* escape trap but don't move and don't destroy it */
                /* caller will call reset_utrap() */
                game.u.utrap = 0;
                pline("Sting cuts through the web!");
                break;
            }
            if (--game.u.utrap) {
                if (game.flags.verbose) {
                    predicament = "stuck to the web";
                    if (game.u.usteed) {
                        Norep("%s is %s.", upstart(steedname), predicament);
                    } else {
                        Norep("You are %s.", predicament);
                    }
                }
            } else {
                if (game.u.usteed) {
                    pline("%s breaks out of the web.", upstart(steedname));
                } else {
                    You("disentangle yourself.");
                }
            }
            break;
        case TT_LAVA:
            if (game.flags.verbose) {
                predicament = "stuck in the lava";
                if (game.u.usteed) {
                    Norep("%s is %s.", upstart(steedname), predicament);
                } else {
                    Norep("You are %s.", predicament);
                }
            }
            if (!is_lava(x, y)) {
                game.u.utrap--;
                if ((game.u.utrap & 255) == 0) {
                    game.u.utrap = 0;
                    if (game.u.usteed) {
                        You("lead %s to the edge of the %s.", steedname, hliquid("lava"));
                    } else {
                        You("pull yourself to the edge of the %s.", hliquid("lava"));
                    }
                }
            }
            game.u.umoved = (1);
            break;
        case TT_INFLOOR:
        case TT_BURIEDBALL:
            anchored = (game.u.utraptype == TT_BURIEDBALL);
            if (anchored) {
                let cc = { x: 0, y: 0 };
                cc.x = game.u.ux , cc.y = game.u.uy;
                if (buried_ball(cc) && dist2(x, y, cc.x, cc.y) <= 2) {
                    /* can move normally within radius 1 of buried ball */
                    /* ugly hack: we need to issue some message here
                   in case "you are chained to the buried ball"
                   was the most recent message given, otherwise
                   our next attempt to move out of tether range
                   after this successful move would have its
                   can't-do-that message suppressed by Norep */
                    if (game.flags.verbose) {
                        Norep("You move within the chain's reach.");
                    }
                    return (1);
                }
            }
            if (--game.u.utrap) {
                if (game.flags.verbose) {
                    if (anchored) {
                        predicament = "chained to the";
                        culprit = "buried ball";
                    } else {
                        predicament = "stuck in the";
                        culprit = surface(game.u.ux, game.u.uy);
                    }
                    if (game.u.usteed) {
                        if (anchored) {
                            Norep("You and %s are %s %s.", steedname, predicament, culprit);
                        } else {
                            Norep("%s is %s %s.", upstart(steedname), predicament, culprit);
                        }
                    } else {
                        Norep("You are %s %s.", predicament, culprit);
                    }
                }
            } else {
                wriggle_free: {
                }
                if (game.u.usteed) {
                    pline("%s finally %s free.", upstart(steedname), !anchored ? "lurches" : "wrenches the ball");
                } else {
                    You("finally %s free.", !anchored ? "wriggle" : "wrench the ball");
                }
                if (anchored) {
                    buried_ball_to_punishment();
                }
            }
            break;
        case TT_NONE:
            impossible("trapmove: trapped in nothing?");
            break;
        default:
            impossible("trapmove: stuck in unknown trap? (%d)", game.u.utraptype);
            break;
    }
    return (0);
}
export function u_rooted() {
    if (!game.youmonst.data.mmove) {
        You("are rooted %s.", ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? "in place" : "to the ground");
        nomul(0);
        return (1);
    }
    return (0);
}
export function notice_mon(mtmp) {
    if (game.a11y.mon_notices && !game.a11y.mon_notices_blocked) {
        let spot = (canseemon(mtmp) || sensemon(mtmp)) && !((((mtmp.data).mflags1 & 256) != 0) && (mtmp.mundetected || ((mtmp).m_ap_type & 7) == M_AP_FURNITURE || ((mtmp).m_ap_type & 7) == M_AP_OBJECT));
        if (spot && !mtmp.mspotted && !((mtmp).mhp < 1)) {
            mtmp.mspotted = (1);
            set_msg_xy(mtmp.mx, mtmp.my);
            You("%s %s.", canseemon(mtmp) ? "see" : "notice", x_monnam(mtmp, mtmp.mtame ? 3 : (!((mtmp).mextra && ((mtmp).mextra.mgivenname)) && !(((mtmp.data).mflags2 & 524288) != 0)) ? 2 : 0, (mtmp.mpeaceful && !mtmp.mtame) ? "peaceful" : null, ((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? 8 : 0, (0)));
        } else if (!spot) {
            mtmp.mspotted = (0);
        }
    }
}
export function notice_mons_cmp(ptr1, ptr2) {
    let m1 = ptr1;
    let m2 = ptr2;
    return (dist2((m1.mx), (m1.my), game.u.ux, game.u.uy) - dist2((m2.mx), (m2.my), game.u.ux, game.u.uy));
}
export function notice_all_mons(reset) {
    if (game.a11y.mon_notices && !game.a11y.mon_notices_blocked) {
        let mtmp = null;
        let arr = null;
        let j = 0;
        let i = 0;
        let cnt = 0;
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (((mtmp).mhp < 1)) {
                continue;
            }
            if ((canseemon(mtmp) || sensemon(mtmp))) {
                cnt++;
            } else if (reset) {
                mtmp.mspotted = (0);
            }
        }
        if (!cnt) {
            return;
        }
        arr = alloc(cnt * 8 /* sizeof(struct monst *) */);
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (((mtmp).mhp < 1)) {
                continue;
            }
            if (!(canseemon(mtmp) || sensemon(mtmp))) {
                mtmp.mspotted = (0);
            } else if (i < cnt) {
                arr[i++] = mtmp;
            }
        }
        if (i) {
            qsort(arr, i, 8 /* sizeof(struct monst *) */, notice_mons_cmp);
            for (j = 0; j < i; j++) {
                notice_mon(arr[j]);
            }
        }
        free(arr);
    }
}
/* maybe disturb buried zombies when an object is dropped or thrown nearby */
export function impact_disturbs_zombies(obj, violent) {
    /* if object won't make a noticeable impact, let buried zombies rest */
    if (obj.owt < (violent ? 10 : 100) || (game.objects[(obj).otyp].oc_material <= LEATHER || (obj).otyp == RUBBER_HOSE)) {
        return;
    }
    disturb_buried_zombies(obj.ox, obj.oy);
}
/* reduce zombification timeout of buried zombies around px, py */
export function disturb_buried_zombies(x, y) {
    let otmp = null;
    let t = 0;
    for (otmp = game.level.buriedobjlist; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == CORPSE && otmp.timed && otmp.ox >= x - 1 && otmp.ox <= x + 1 && otmp.oy >= y - 1 && otmp.oy <= y + 1 && (t = peek_timer(ZOMBIFY_MON, obj_to_any(otmp))) > 0) {
            t = stop_timer(ZOMBIFY_MON, obj_to_any(otmp));
            start_timer(((1) > ((Math.trunc(t * 2 / 3))) ? (1) : ((Math.trunc(t * 2 / 3)))), TIMER_OBJECT, ZOMBIFY_MON, obj_to_any(otmp));
        }
    }
}
/* return an appropriate locomotion word for hero */
export function u_locomotion(def) {
    let capitalize = (def.value == highc(def.value));
    /* regular locomotion() takes a monster type rather than a specific
       monster, so can't tell whether it is operating on hero;
       its is_flyer() and is_floater() tests wouldn't work on hero except
       when hero is polymorphed and not wearing an amulet of flying
       or boots/ring/spell of levitation */
    return ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) ? (capitalize ? "Float" : "float") : ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ? (capitalize ? "Fly" : "fly") : locomotion(game.youmonst.data, def);
}
/* Return a simplified floor solid/liquid state based on hero's state */
export function u_simple_floortyp(x, y) {
    let u_in_air = (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || !(!(((game.youmonst.data).mflags1 & 1) != 0) && !((game.youmonst.data).mlet == S_EYE || (game.youmonst.data).mlet == S_LIGHT) && (!(((game.youmonst.data).mflags1 & 16) != 0) || !has_ceiling(game.u.uz))));
    if (is_waterwall(x, y)) {
        return WATER;
    }
    /* wall of water, fly/lev does not matter */
    if (game.level.locations[x][y].typ == LAVAWALL) {
        return LAVAWALL;
    }
    if (!u_in_air) {
        /* wall of lava, fly/lev does not matter */
        if (is_pool(x, y)) {
            return POOL;
        }
        if (is_lava(x, y)) {
            return LAVAPOOL;
        }
    }
    return ROOM;
}
/* maybe show a helpful gameplay tip? returns True if tip gets shown */
export function handle_tip(tip) {
    if (!game.flags.tips) {
        return (0);
    }
    if (tip >= 0 && tip < NUM_TIPS && !(game.context.tips & (1 << tip))) {
        game.context.tips |= (1 << tip);
        switch (tip) {
            /* the "Tip:" prefix is a hint to use of OPTIONS=!tips to suppress */
            case TIP_ENHANCE:
                pline("(Tip: use the #enhance command to advance them.)");
                break;
            case TIP_SWIM:
                pline("(Tip: use '%s' prefix to step in if you really want to.)", visctrl(cmd_from_func(do_reqmenu)));
                break;
            case TIP_UNTRAP_MON:
                pline("(Tip: perhaps #untrap would help?)");
                break;
            case TIP_GETPOS:
                l_nhcore_call(NHCORE_GETPOS_TIP);
                break;
            default:
                impossible("Unknown tip in handle_tip(%i)", tip);
                break;
        }
        return (1);
    }
    return (0);
}
/* Is it dangerous for hero to move to x,y due to water or lava? */
export function swim_move_danger(x, y) {
    let newtyp = u_simple_floortyp(x, y);
    let liquid_wall = ((newtyp) == WATER) || newtyp == LAVAWALL;
    if ((game.u.uinwater) && (is_pool(x, y) || ((newtyp) == WATER))) {
        return (0);
    }
    if ((newtyp != u_simple_floortyp(game.u.ux, game.u.uy)) && !game.u.uprops[STUNNED].intrinsic && !game.u.uprops[CONFUSION].intrinsic && game.level.locations[x][y].seenv && (is_pool(x, y) || is_lava(x, y) || liquid_wall)) {
        if ((is_pool(x, y) && !(game.uarmf && game.uarmf.otyp == WATER_WALKING_BOOTS && game.objects[WATER_WALKING_BOOTS].oc_name_known && !game.u.usteed)) || (is_lava(x, y) && !((game.uarmf && game.uarmf.otyp == WATER_WALKING_BOOTS && game.objects[WATER_WALKING_BOOTS].oc_name_known && !game.u.usteed) && (game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) && game.uarmf.oerodeproof && game.uarmf.rknown) && !is_lava(game.u.ux, game.u.uy)) || liquid_wall) {
            if (game.context.nopick) {
                /* FIXME: This can be exploited to identify ring of fire resistance
         * if the player is wearing it unidentified and has identified
         * fireproof boots of water walking and is walking over lava. However,
         * this is such a marginal case that it may not be worth fixing. */
                /* is_lava(ux,uy): don't move onto/over lava with known
               lava-walking because it isn't completely safe, but do
               continue to move over lava if already doing so */
                game.context.tips |= (1 << TIP_SWIM);
                return (0);
            } else if (((game.flags.paranoia_bits & 1024) != 0) || liquid_wall) {
                You("avoid %s into the %s.", ing_suffix(u_locomotion("step")), waterbody_name(x, y));
                handle_tip(TIP_SWIM);
                return (1);
            }
        }
    }
    return (0);
}
/* moving with 'm' prefix, bump into a monster? */
export function domove_bump_mon(mtmp, glyph) {
    if (game.context.nopick && !game.context.travel && ((canseemon(mtmp) || sensemon(mtmp)) || ((glyph) == GLYPH_INVIS_OFF) || ((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6)))) {
        if (((mtmp).m_ap_type & 7) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && !sensemon(mtmp)) {
            stumble_onto_mimic(mtmp);
        } else if (mtmp.mpeaceful && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            pline("Pardon me, %s.", m_monnam(mtmp));
        /* If they used a 'm' command, trying to move onto a monster
     * prints the below message and wastes a turn.  The exception is
     * if the monster is unseen and the player doesn't remember an
     * invisible monster--then, we fall through to do_attack() and
     * attack_check(), which still wastes a turn, but prints a
     * different message and makes the player remember the monster.
     */
        /* m_monnam(): "dog" or "Fido", no "invisible dog" or "it" */
        } else {
            You("move right into %s.", mon_nam(mtmp));
        }
        return (1);
    }
    return (0);
}
/* hero is moving, do we maybe attack a monster at (x,y)?
   returns TRUE if hero movement is used up.
   sets displaceu, if hero and monster could swap places instead.
*/
export function domove_attackmon_at(mtmp, x, y, displaceu) {
    if (game.context.forcefight || !mtmp.mundetected || sensemon(mtmp) || (((((mtmp.data).mflags1 & 128) != 0) || mtmp.data.mlet == S_EEL) && !is_safemon(mtmp))) {
        /* only attack if we know it's there
     * or if we used the 'F' command to fight blindly
     * or if it hides_under, in which case we call do_attack() to print
     * the Wait! message.
     * This is different from ceiling hiders, who aren't handled in
     * do_attack().
     */
        /* target monster might decide to switch places with you... */
        displaceu.value = (mtmp.data == game.mons[PM_DISPLACER_BEAST] && !rn2(2) && mtmp.mux == game.u.ux0 && mtmp.muy == game.u.uy0 && !((mtmp).msleeping || !(mtmp).mcanmove) && !mtmp.meating && !mtmp.mtrapped && !game.u.utrap && !game.u.ustuck && !game.u.usteed && !(game.u.dx && game.u.dy && (((game.u.umonnum) == PM_GRID_BUG) || (bad_rock(mtmp.data, x, game.u.uy0) && bad_rock(mtmp.data, game.u.ux0, y)) || (bad_rock(game.youmonst.data, game.u.ux0, y) && bad_rock(game.youmonst.data, x, game.u.uy0)))) && goodpos(game.u.ux0, game.u.uy0, mtmp, 4194304));
        if (!displaceu.value) {
            /* if not displacing, try to attack; note that it might evade;
           also, we don't attack tame or peaceful when safemon() */
            if (do_attack(mtmp)) {
                return (1);
            }
        }
    }
    return (0);
}
/* force-fight iron bars with your weapon? */
export function domove_fight_ironbars(x, y) {
    if (game.context.forcefight && game.level.locations[x][y].typ == IRONBARS && game.uwep) {
        let obj = game.uwep;
        let breakflags = (1 | 2 | 16);
        if (breaktest(obj)) {
            if (obj.quan > 1) {
                obj = splitobj(obj, 1);
            } else {
                setuwep(null);
            }
            freeinv(obj);
            breakflags |= 4;
        } else {
            breakflags |= 8;
        }
        hit_bars({ get value() { return obj; }, set value(_v) { obj = _v; } }, game.u.ux, game.u.uy, x, y, breakflags);
        return (1);
    }
    return (0);
}
/* force-fight a spider web with your weapon */
export function domove_fight_web(x, y) {
    let trap = t_at(x, y);
    if (game.context.forcefight && trap && trap.ttyp == WEB && trap.tseen) {
        let wtype = uwep_skill_type();
        let wskill_minus_2 = (((game.u.weapon_skills[wtype].skill)) > (P_UNSKILLED) ? ((game.u.weapon_skills[wtype].skill)) : (P_UNSKILLED)) - 2;
        let roll = rn2(game.uwep ? 20 : (45 - 5 * wskill_minus_2));
        if (game.uwep && (is_art(game.uwep, ART_STING) || (game.uwep.oartifact && attacks(2, game.uwep)))) {
            /* minus_2: restricted or unskilled: -1, basic: 0, skilled: 1,
               expert: 2, master: 3, grandmaster: 4 */
            /* higher value is worse for player; for weaponless, adjust the
               chance to succeed rather than maybe make two tries */
            /* is_blade() includes daggers (which are classified as PIERCE)
           but doesn't include axes and slashing polearms */
            pline("%s %s through the web!", bare_artifactname(game.uwep), is_art(game.uwep, ART_STING) ? "cuts" : "burns");
        } else if (game.uwep && !(game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_DAGGER && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER) && (!game.u.twoweap || !(game.uswapwep.oclass == WEAPON_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp >= P_DAGGER && game.objects[game.uswapwep.otyp].oc_subtyp <= P_SABER))) {
            let uwepstr = null;
            let scndstr = null;
            let uwepbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let scndbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let onewep = 0;
            uwepbuf = strcpy(uwepbuf, weapon_descr(game.uwep));
            scndbuf = strcpy(scndbuf, game.u.twoweap ? weapon_descr(game.uswapwep) : "");
            /* when dual wielding, second weapon will only be mentioned
               if it has a different type description from primary */
            onewep = !scndbuf || !strcmp(uwepbuf, scndbuf);
            if (!strncmpi((uwepbuf), ("armor"), -1) || !strncmpi((uwepbuf), ("food"), -1) || !strncmpi((uwepbuf), ("venom"), -1)) {
                /* non-weapon item wielded, of a type where an() would
                   result in weird phrasing; dual wield not possible */
                uwepstr = uwepbuf;
            } else if (game.uwep.quan == 1 && !(game.u.twoweap && onewep)) {
                /* unless secondary is suppressed due to same type */
                uwepstr = an(uwepbuf);
            } else {
                uwepstr = makeplural(uwepbuf);
            }
            if (!onewep) {
                (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                scndstr = (game.uswapwep.quan == 1) ? an(scndbuf) : makeplural(scndbuf);
            }
            You_cant("cut a web with %s%s%s!", uwepstr, !onewep ? " or " : "", !onewep ? scndstr : "");
            return (1);
        } else if (roll > (acurrstr() - 2 + (game.uwep ? game.uwep.spe + wskill_minus_2 : 0))) {
            /* for weaponless, 'roll' was adjusted above */
            /* TODO: add failures, maybe make an occupation? */
            You("%s ineffectually at some of the strands.", game.uwep ? "hack" : "thrash");
            return (1);
        } else {
            You("%s through the web.", game.uwep ? "cut" : "punch");
            /* doesn't break "never hit with a wielded weapon" conduct */
            use_skill(wtype, 1);
        }
        deltrap(trap);
        newsym(x, y);
        return (1);
    }
    return (0);
}
/* maybe swap places with a pet? returns TRUE if swapped places */
export function domove_swap_with_pet(mtmp, x, y) {
    let trap = null;
    /* if it turns out we can't actually move */
    let didnt_move = (0);
    let u_with_boulder = (sobj_at(BOULDER, game.u.ux, game.u.uy) != null);
    /* seemimic/newsym should be done before moving hero, otherwise
       the display code will draw the hero here before we possibly
       cancel the swap below (we can ignore steed mx,my here) */
    game.u.ux = game.u.ux0 , game.u.uy = game.u.uy0;
    mtmp.mundetected = 0;
    if (((mtmp).m_ap_type & 7)) {
        seemimic(mtmp);
    }
    /* resume swapping positions */
    game.u.ux = mtmp.mx , game.u.uy = mtmp.my;
    trap = mtmp.mtrapped ? t_at(mtmp.mx, mtmp.my) : null;
    if (!trap) {
        mtmp.mtrapped = 0;
    }
    if (mtmp.mtrapped && ((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT) && sobj_at(BOULDER, trap.tx, trap.ty)) {
        /* can't swap places with pet pinned in a pit by a boulder */
        didnt_move = (1);
    } else if (game.u.ux0 != x && game.u.uy0 != y && (((mtmp.data).pmidx) == PM_GRID_BUG)) {
        /* can't swap places when pet can't move to your spot */
        You("stop.  %s can't move diagonally.", YMonnam(mtmp));
        didnt_move = (1);
    } else if (u_with_boulder && !(((mtmp.data).msize < 1) && (!mtmp.minvent || curr_mon_load(mtmp) <= 600))) {
        /* can't swap places when pet won't fit there with the boulder */
        You("stop.  %s won't fit into the same spot that you're at.", YMonnam(mtmp));
        didnt_move = (1);
    } else if (game.u.ux0 != x && game.u.uy0 != y && bad_rock(mtmp.data, x, game.u.uy0) && bad_rock(mtmp.data, game.u.ux0, y) && (((mtmp.data).msize >= 3) || (curr_mon_load(mtmp) > 600))) {
        /* can't swap places when pet won't fit thru the opening */
        You("stop.  %s won't fit through.", YMonnam(mtmp));
        didnt_move = (1);
    } else if (mtmp.mpeaceful && mtmp.mtrapped) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        /* all mtame are also mpeaceful, so this affects pets too */
        let what = trapname(trap.ttyp, (0));
        let which = "that ";
        let anbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        if (!trap.tseen) {
            /* show on map once mtmp is out of the way */
            feeltrap(trap);
            which = just_an(anbuf, what);
        }
        You("stop.  %s can't move out of %s%s.", YMonnam(mtmp), which, what);
        handle_tip(TIP_UNTRAP_MON);
        didnt_move = (1);
    } else if (mtmp.mpeaceful && (!goodpos(game.u.ux0, game.u.uy0, mtmp, 0) || t_at(game.u.ux0, game.u.uy0) != (null) || ((mtmp).ispriest || (mtmp).isshk || (mtmp).isgd || (mtmp).data == game.mons[PM_ORACLE] || (mtmp).m_id == game.quest_status.leader_m_id))) {
        /* displacing peaceful into unsafe or trapped space, or trying to
           displace quest leader, Oracle, shk, priest, or vault guard */
        You("stop.  %s doesn't want to swap places.", YMonnam(mtmp));
        didnt_move = (1);
    } else {
        mtmp.mtrapped = 0;
        game.level.monsters[x][y] = null;
        place_monster(mtmp, game.u.ux0, game.u.uy0);
        newsym(x, y);
        /* Clean old position -- vision_recalc() will print our new one. */
        newsym(game.u.ux0, game.u.uy0);
        You("%s %s.", mtmp.mpeaceful ? "swap places with" : "frighten", x_monnam(mtmp, mtmp.mtame ? 3 : (!((mtmp).mextra && ((mtmp).mextra.mgivenname)) && !(((mtmp.data).mflags2 & 524288) != 0)) ? 1 : 0, (mtmp.mpeaceful && !mtmp.mtame) ? "peaceful" : null, ((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? 8 : 0, (0)));
        switch (minliquid(mtmp) ? Trap_Killed_Mon : mintrap(mtmp, 0)) {
            /* check for displacing it into pools and traps */
            case Trap_Effect_Finished:
                break;
            case Trap_Caught_Mon:
            case Trap_Moved_Mon:
                abuse_dog(mtmp);
                adjalign(-3);
                break;
            case Trap_Killed_Mon:
{
                    /* minliquid() and mintrap() call mondead() rather than
                   killed() so we duplicate some of the latter here */
                    let tmp = 0;
                    let mndx = 0;
                    if (!game.u.uconduct.killer++) {
                        livelog_printf(32, "killed for the first time");
                    }
                    mndx = ((mtmp.data).pmidx);
                    tmp = experience(mtmp, game.mvitals[mndx].died);
                    more_experienced(tmp, 0);
                    /* will decide if you go up */
                    newexplevel();
                }
                if (rn2(4)) {
                    /* there's already been a trap message, reinforce it */
                    /* drowned or died...
             * you killed your pet by direct action, so get experience
             * and possibly penalties;
             * we want the level gain message, if it happens, to occur
             * before the guilt message below
             */
                    /* That's no way to treat a pet!  Your god gets angry.
             *
             * [This has always been pretty iffy.  Why does your
             * patron deity care at all, let alone enough to get mad?]
             */
                    You_feel("guilty about losing your pet like this.");
                    game.u.ugangr++;
                    adjalign(-15);
                }
                break;
            default:
                impossible("that's strange, unknown mintrap result!");
                break;
        }
    }
    return !didnt_move;
}
/* force-fight (x,y) which doesn't have anything to fight */
const __domove_fight_empty_unknown_obstacle = "an unknown obstacle";
export function domove_fight_empty(x, y) {
    let off_edge = !isok(x, y);
    let glyph = !off_edge ? glyph_at(x, y) : GLYPH_UNEXPLORED_OFF;
    if (off_edge) {
        x = 0 , y = 1;
    }
    if (game.context.forcefight || (((glyph) == GLYPH_INVIS_OFF) && !(game.level.monsters[x][y]) && !game.context.nopick)) {
        let boulder = null;
        let explo = 0;
        let solid = 0;
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        futile: {
            /* for forcefight against the edge of the map; make
                       * sure 'bad' coordinates are within array bounds in
                       * case a bounds check gets overlooked; avoid <0,0>
                       * because m_at() might find a vault guard there */
            /* specifying 'F' with no monster wastes a turn */
            /* remembered an 'I' && didn't use a move command */
            boulder = null;
            explo = ((game.u.umonnum != game.u.umonster) && attacktype(game.youmonst.data, 13));
            solid = (off_edge || (!accessible(x, y) || ((game.level.locations[x][y].typ) >= STAIRS && (game.level.locations[x][y].typ) <= ALTAR)));
            if (off_edge) {
                buf = strcpy(buf, __domove_fight_empty_unknown_obstacle);
                /* treat as if solid rock, even on planes' levels */
                break futile;
            }
            if (!(game.u.uinwater)) {
                boulder = sobj_at(BOULDER, x, y);
                /* if a statue is displayed at the target location,
               player is attempting to attack it [and boulder
               handling below is suitable for handling that] */
                if ((((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && ((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))))) {
                    boulder = sobj_at(STATUE, x, y);
                }
                if (game.context.forcefight && game.uwep && dig_typ(game.uwep, x, y) && !((glyph) == GLYPH_INVIS_OFF) && !((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
                    /* force fight at boulder/statue or wall/door while wielding
               pick:  start digging to break the boulder or wall */
                    use_pick_axe2(game.uwep);
                    return (1);
                }
            }
            /* about to become known empty -- remove 'I' if present */
            unmap_object(x, y);
            if (boulder) {
                map_object(boulder, (1));
            }
            newsym(x, y);
            glyph = glyph_at(x, y);
            ((glyph));
            if (boulder) {
                buf = strcpy(buf, ansimpleoname(boulder));
            } else if ((game.u.uinwater) && !is_pool(x, y)) {
                buf = sprintf(buf, "%s", ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && game.level.locations[x][y].typ == AIR) ? "an air bubble" : "nothing");
            } else if (solid) {
                /* note: 'solid' is misleadingly named and catches pools
               of water and lava as well as rock and walls;
               5.0: furniture too */
                if (game.level.locations[x][y].seenv || ((game.level.locations[x][y].typ) <= DBWALL) || game.level.locations[x][y].typ == SDOOR || game.level.locations[x][y].typ == SCORR) {
                    /* Underwater, targeting non-water; the map just shows blank
               because you don't see remembered terrain while underwater;
               although the hero can attack an adjacent monster this way,
               assume he can't reach out far enough to distinguish terrain */
                    /* glyph might indicate unseen terrain if hero is blind;
               unlike searching, this won't reveal what that terrain is;
               5.0: used to say "solid rock" for STONE, but that made it be
               different from unmapped walls outside of rooms (and was wrong
               on arboreal levels) */
                    glyph = back_to_glyph(x, y);
                    buf = strcpy(buf, the(defsyms[glyph_to_cmap(glyph)].explanation));
                } else {
                    buf = strcpy(buf, __domove_fight_empty_unknown_obstacle);
                }
            } else {
                buf = strcpy(buf, "thin air");
            }
        }
        You("%s%s %s.", !(boulder || solid) ? "" : !explo ? "harmlessly " : "futilely ", explo ? "explode at" : "attack", buf);
        nomul(0);
        if (explo) {
            let attk = attacktype_fordmg(game.youmonst.data, 13, (-1));
            /* no monster has been attacked so we have bypassed explum() */
            wake_nearto(game.u.ux, game.u.uy, 7 * 7);
            if (attk) {
                explum(null, attk);
            }
            /* dead in the current form */
            game.u.mh = -1;
            rehumanize();
        }
        return (1);
    }
    return (0);
}
/* does the plane of air disturb movement? */
export function air_turbulence() {
    if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) && rn2(4) && !((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
        switch (rn2(3)) {
            case 0:
                You("tumble in place.");
                exercise(A_DEX, (0));
                break;
            case 1:
                You_cant("control your movements very well.");
                break;
            case 2:
                pline("It's hard to walk in thin air.");
                exercise(A_DEX, (1));
                break;
        }
        return (1);
    }
    return (0);
}
/* does water disturb the movement? */
export function water_turbulence(x, y) {
    if (game.u.uinwater) {
        let wtcap = 0;
        let wtmod = ((game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) ? MOD_ENCUMBER : SLT_ENCUMBER);
        water_friction();
        if (!game.u.dx && !game.u.dy) {
            nomul(0);
            return (1);
        }
        x.value = game.u.ux + game.u.dx;
        y.value = game.u.uy + game.u.dy;
        if (isok(x.value, y.value) && !is_pool(x.value, y.value) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && (wtcap = near_capacity()) > wtmod) {
            /* are we trying to move out of water while carrying too much? */
            /* when escaping from drowning you need to be unencumbered
               in order to crawl out of water, but when not drowning,
               doing so while encumbered is feasible; if in an aquatic
               form, stressed or less is allowed; otherwise (magical
               breathing), only burdened is allowed */
            You("are carrying too much to climb out of the water.");
            nomul(0);
            return (1);
        }
    }
    return (0);
}
export function slippery_ice_fumbling() {
    let recharged = !((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && is_ice(game.u.ux, game.u.uy);
    let iceskater = game.u.usteed ? game.u.usteed : game.youmonst;
    if (recharged) {
        if ((game.uarmf && objdescr_is(game.uarmf, "snow boots")) || Resists_Elem(iceskater, COLD_RES) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || ((iceskater.data).mlet == S_EYE || (iceskater.data).mlet == S_LIGHT) || (((iceskater.data).mflags1 & 16) != 0) || ((iceskater.data).mlet == S_VORTEX || (iceskater.data) == game.mons[PM_AIR_ELEMENTAL])) {
            recharged = (0);
        } else if (!rn2((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic) ? 3 : 2)) {
            game.u.uprops[FUMBLING].intrinsic |= 67108864;
            game.u.uprops[FUMBLING].intrinsic &= ~16777215;
            game.u.uprops[FUMBLING].intrinsic += 1;
        }
    }
    if (!recharged && (game.u.uprops[FUMBLING].intrinsic & 67108864)) {
        game.u.uprops[FUMBLING].intrinsic &= ~67108864;
    }
}
export function u_maybe_impaired() {
    return (game.u.uprops[STUNNED].intrinsic || (game.u.uprops[CONFUSION].intrinsic && !rn2(5)));
}
/* change movement dir if impaired. return TRUE if can't move */
export function impaired_movement(x, y) {
    if (u_maybe_impaired()) {
        let tries = 0;
        do {
            if (tries++ > 50) {
                nomul(0);
                return (1);
            }
            confdir((1));
            x.value = game.u.ux + game.u.dx;
            y.value = game.u.uy + game.u.dy;
        } while (!isok(x.value, y.value) || bad_rock(game.youmonst.data, x.value, y.value));
    }
    return (0);
}
export function avoid_moving_on_trap(x, y, msg) {
    let trap = null;
    if ((trap = t_at(x, y)) && trap.tseen && trap.ttyp != VIBRATING_SQUARE) {
        if (msg && game.flags.mention_walls) {
            /* the vibrating square is implemented as a trap but treated as if
           it were a type of terrain */
            set_msg_xy(x, y);
            You("stop in front of %s.", an(trapname(trap.ttyp, (0))));
        }
        return (1);
    }
    return (0);
}
export function avoid_moving_on_liquid(x, y, msg) {
    let in_air = (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked));
    if ((game.level.locations[x][y].typ == game.level.locations[game.u.ux][game.u.uy].typ || (game.context.run < 2 && (!is_lava(x, y) || in_air)) || game.context.travel) && (in_air || ((game.uarmf && game.uarmf.otyp == WATER_WALKING_BOOTS && game.objects[WATER_WALKING_BOOTS].oc_name_known && !game.u.usteed) && (game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) && game.uarmf.oerodeproof && game.uarmf.rknown) || (is_pool(x, y) && (game.uarmf && game.uarmf.otyp == WATER_WALKING_BOOTS && game.objects[WATER_WALKING_BOOTS].oc_name_known && !game.u.usteed))) && !(((game.level.locations[x][y].typ) == WATER) || game.level.locations[x][y].typ == LAVAWALL)) {
        return (0);
    } else if (is_pool_or_lava(x, y) && game.level.locations[x][y].seenv) {
        if (msg && game.flags.mention_walls) {
            set_msg_xy(x, y);
            You("stop at the edge of the %s.", hliquid(is_pool(x, y) ? "water" : "lava"));
        }
        return (1);
    }
    return (0);
}
/* when running/rushing, avoid stepping on a known trap or pool of liquid.
   returns TRUE if avoided. */
export function avoid_running_into_trap_or_liquid(x, y) {
    let would_stop = (game.context.run >= 2);
    if (!game.context.run) {
        return (0);
    }
    if (avoid_moving_on_trap(x, y, would_stop) || (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && avoid_moving_on_liquid(x, y, would_stop))) {
        nomul(0);
        if (would_stop) {
            /* Is it dangerous to swim in water or lava? */
            game.context.move = 0;
        }
        return would_stop;
    }
    return (0);
}
/* if paranoid_confirm:Trap is enabled, check whether the next step forward
   needs player confirmation due to visible region or discovered trap;
   result: True => stop moving, False => proceed */
export function avoid_trap_andor_region(x, y) {
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let newreg = null;
    let oldreg = null;
    let trap = null;
    if (((game.flags.paranoia_bits & 2048) != 0) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !game.u.uprops[STUNNED].intrinsic && !game.u.uprops[CONFUSION].intrinsic && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (!game.context.nopick || game.context.run) && (newreg = visible_region_at(x, y)) != null && ((oldreg = visible_region_at(game.u.ux, game.u.uy)) == null || (reg_damg(newreg) > 0 && reg_damg(oldreg) == 0)) && test_move(game.u.ux, game.u.uy, game.u.dx, game.u.dy, 1)) {
        nh_snprintf("avoid_trap_andor_region", 2544, qbuf, 128 /* sizeof(char [128]) */, "%s into that %s cloud?", u_locomotion("step"), (reg_damg(newreg) > 0) ? "poison gas" : "vapor");
        if (!paranoid_query(((game.flags.paranoia_bits & 1) != 0), upstart(qbuf))) {
            nomul(0);
            game.context.move = 0;
            return (1);
        }
    }
    if (((game.flags.paranoia_bits & 2048) != 0) && !game.u.uprops[STUNNED].intrinsic && !game.u.uprops[CONFUSION].intrinsic && (!game.context.nopick || game.context.run) && (trap = t_at(x, y)) != null && trap.tseen && test_move(game.u.ux, game.u.uy, game.u.dx, game.u.dy, 1) && (immune_to_trap(game.youmonst, trap.ttyp) != TRAP_CLEARLY_IMMUNE || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) {
        /* maybe ask player for confirmation before walking into known trap */
        /* check for discovered trap */
        /* override confirmation if the trap is harmless to the hero */
        /* Hallucination: all traps still show as ^, but the
               hero can't tell what they are, so treat as dangerous */
        let traptype = ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? rnd(TRAPNUM - 1) : trap.ttyp);
        let into = into_vs_onto(traptype);
        nh_snprintf("avoid_trap_andor_region", 2570, qbuf, 128 /* sizeof(char [128]) */, "Really %s %s that %s?", u_locomotion("step"), into ? "into" : "onto", defsyms[(S_arrow_trap + (traptype) - 1)].explanation);
        if (!paranoid_query(((game.flags.paranoia_bits & 1) != 0), qbuf)) {
            nomul(0);
            game.context.move = 0;
            return (1);
        }
    }
    return (0);
}
/* trying to move out-of-bounds? */
export function move_out_of_bounds(x, y) {
    if (!isok(x, y)) {
        if (game.context.forcefight) {
            return domove_fight_empty(x, y);
        }
        if (game.flags.mention_walls) {
            let dx = game.u.dx;
            let dy = game.u.dy;
            if (dx && dy) {
                /* only as far as possible diagonally if in very
                   corner; otherwise just report whichever of the
                   cardinal directions has reached its limit */
                if (isok(x, game.u.uy)) {
                    dx = 0;
                } else if (isok(game.u.ux, y)) {
                    dy = 0;
                }
            }
            You("have already gone as far %s as possible.", directionname(xytodir(dx, dy)));
        }
        nomul(0);
        game.context.move = 0;
        return (1);
    }
    return (0);
}
/* carrying too much to be able to move? */
export function carrying_too_much() {
    let wtcap = 0;
    if (((wtcap = near_capacity()) >= OVERLOADED || (wtcap > SLT_ENCUMBER && ((game.u.umonnum != game.u.umonster) ? (game.u.mh < 5 && game.u.mh != game.u.mhmax) : (game.u.uhp < 10 && game.u.uhp != game.u.uhpmax)))) && !(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        if (wtcap < OVERLOADED) {
            You("don't have enough stamina to move.");
            exercise(A_CON, (0));
        } else {
            You("collapse under your load.");
        }
        nomul(0);
        return (1);
    }
    return (0);
}
/* try to pull free from sticking monster, or you release a monster
   you're sticking to. returns TRUE if you lose your movement. */
export function escape_from_sticky_mon(x, y) {
    if (game.u.ustuck && (x != game.u.ustuck.mx || y != game.u.ustuck.my)) {
        let mtmp = null;
        if (!(dist2(((game.u.ustuck).mx), ((game.u.ustuck).my), game.u.ux, game.u.uy) <= 2)) {
            /* perhaps it fled (or was teleported or ... ) */
            set_ustuck(null);
        } else if (sticks(game.youmonst.data)) {
            /* When polymorphed into a sticking monster,
             * u.ustuck means it's stuck to you, not you to it.
             */
            mtmp = game.u.ustuck;
            set_ustuck(null);
            You("release %s.", y_monnam(mtmp));
        } else {
            switch (rn2(!game.u.ustuck.mcanmove ? 8 : 40)) {
                case 3:
                    if (!game.u.ustuck.mcanmove) {
                        /* If holder is asleep or paralyzed:
             *      37.5% chance of getting away,
             *      12.5% chance of waking/releasing it;
             * otherwise:
             *       7.5% chance of getting away.
             * [strength ought to be a factor]
             * If holder is tame and there is no conflict,
             * guaranteed escape.
             */
                        /* it's free to move on next turn */
                        game.u.ustuck.mfrozen = 1;
                        game.u.ustuck.msleeping = 0;
                    }
                    ;
                default:
                    if ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) || game.u.ustuck.mconf || !game.u.ustuck.mtame) {
                        You("cannot escape from %s!", y_monnam(game.u.ustuck));
                        nomul(0);
                        return (1);
                    }
                    ;
                case 0:
                case 1:
                case 2:
                    mtmp = game.u.ustuck;
                    set_ustuck(null);
                    You("pull free from %s.", y_monnam(mtmp));
                    break;
            }
        }
    }
    return (0);
}
export function domove() {
    fnEnter("domove", "hack.c", 0);
    let ux1 = game.u.ux;
    let uy1 = game.u.uy;
    game.domove_succeeded = 0;
    domove_core();
    if ((game.domove_succeeded & (2 | 1)) != 0) {
        /* gd.domove_succeeded is available to make assessments now */
        maybe_smudge_engr(ux1, uy1, game.u.ux, game.u.uy);
        maybe_adjust_hero_bubble();
    }
    game.domove_attempting = 0;
    game.kickedloc.x = 0 , game.kickedloc.y = 0;
}
export function domove_core() {
    fnEnter("domove_core", "hack.c", 0);
    let mtmp = null;
    let tmpr = null;
    let x = 0;
    let y = 0;
    let glyph = 0;
    let chainx = 0;
    let chainy = 0;
    let ballx = 0;
    let bally = 0;
    /* ball&chain new positions */
    let bc_control = 0;
    /* dragging ball will skip a move */
    let cause_delay = (0);
    let displaceu = (0);
    if (game.context.travel) {
        if (!findtravelpath(0)) {
            findtravelpath(1);
        }
        game.context.travel1 = 0;
    }
    if (carrying_too_much()) {
        return;
    }
    if (game.u.uswallow) {
        game.u.dx = game.u.dy = 0;
        x = game.u.ustuck.mx , y = game.u.ustuck.my;
        /* set u.ux,uy and handle CLIPPING */
        u_on_newpos(x, y);
        mtmp = game.u.ustuck;
    } else {
        if (air_turbulence()) {
            return;
        }
        slippery_ice_fumbling();
        x = game.u.ux + game.u.dx;
        y = game.u.uy + game.u.dy;
        if (impaired_movement({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } })) {
            return;
        }
        /* turbulence might alter your actual destination */
        if (water_turbulence({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } })) {
            return;
        }
        if (move_out_of_bounds(x, y)) {
            return;
        }
        if (avoid_running_into_trap_or_liquid(x, y)) {
            return;
        }
        if (escape_from_sticky_mon(x, y)) {
            return;
        }
        mtmp = (game.level.monsters[x][y]);
        if (mtmp && !is_safemon(mtmp)) {
            if (game.context.run && ((!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && mon_visible(mtmp) && ((((mtmp).m_ap_type & 7) != M_AP_FURNITURE && ((mtmp).m_ap_type & 7) != M_AP_OBJECT) || (game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic))) || sensemon(mtmp))) {
                nomul(0);
                game.context.move = 0;
                return;
            }
        }
    }
    game.u.ux0 = game.u.ux;
    game.u.uy0 = game.u.uy;
    game.bhitpos.x = x;
    game.bhitpos.y = y;
    tmpr = game.level.locations[x][y];
    glyph = glyph_at(x, y);
    if (mtmp) {
        /* don't stop travel when displacing pets; if the
           displace fails for some reason, do_attack() in uhitm.c
           will stop travel rather than domove */
        if (!is_safemon(mtmp) || game.context.forcefight) {
            nomul(0);
        }
        if (domove_bump_mon(mtmp, glyph)) {
            return;
        }
        if (domove_attackmon_at(mtmp, x, y, { get value() { return displaceu; }, set value(_v) { displaceu = _v; } })) {
            return;
        }
    }
    if (!displaceu) {
        if (domove_fight_ironbars(x, y)) {
            return;
        }
        if (domove_fight_web(x, y)) {
            return;
        }
        if (domove_fight_empty(x, y)) {
            return;
        }
        unmap_invisible(x, y);
        if ((game.u.dx || game.u.dy) && game.u.usteed && stucksteed((0))) {
            nomul(0);
            return;
        }
        if (u_rooted()) {
            return;
        }
        if (((game.flags.paranoia_bits & 2048) != 0)) {
            /* handling for paranoid_confirm:Trap which doubles as
           paranoid_confirm:Region */
            if (avoid_trap_andor_region(x, y)) {
                return;
            }
        }
        if (game.u.utrap) {
            /* when u.utrap is True, displaceu is False */
            let moved = trapmove(x, y, (null));
            if (!game.u.utrap) {
                /* code below is prepared to handle negative 'loss' so don't add this
         * until we've verified that no callers intentionally rely on that */
                /* u.uhp or u.mh is changing */
                game.disp.botl = (1);
                /* might resume levitation or flight */
                reset_utrap((1));
            }
            /* might not have escaped, or did escape but remain in the same
               spot */
            if (!moved) {
                return;
            }
        }
        if (!test_move(game.u.ux, game.u.uy, x - game.u.ux, y - game.u.uy, 0)) {
            if (!game.context.door_opened) {
                game.context.move = 0;
                nomul(0);
            }
            return;
        }
        if (swim_move_danger(x, y)) {
            game.context.move = 0;
            nomul(0);
            return;
        }
    }
    if ((game.uball != null)) {
        if (!drag_ball(x, y, { get value() { return bc_control; }, set value(_v) { bc_control = _v; } }, { get value() { return ballx; }, set value(_v) { ballx = _v; } }, { get value() { return bally; }, set value(_v) { bally = _v; } }, { get value() { return chainx; }, set value(_v) { chainx = _v; } }, { get value() { return chainy; }, set value(_v) { chainy = _v; } }, { get value() { return cause_delay; }, set value(_v) { cause_delay = _v; } }, (1))) {
            return;
        }
    }
    /* Check regions entering/leaving */
    if (!in_out_region(x, y)) {
        return;
    }
    mtmp = (game.level.monsters[x][y]);
    /* mtmp can be null at this point */
    /* tentatively move the hero plus steed; leave CLIPPING til later */
    game.u.ux += game.u.dx;
    game.u.uy += game.u.dy;
    m_postmove_effect(game.youmonst);
    if (game.u.usteed) {
        game.u.usteed.mx = game.u.ux;
        game.u.usteed.my = game.u.uy;
        /* [if move attempt ends up being blocked, should training count?] */
        exercise_steed();
    }
    if (mtmp) {
        if (displaceu) {
            let noticed_it = ((canseemon(mtmp) || sensemon(mtmp)) || ((glyph) == GLYPH_INVIS_OFF) || ((glyph) >= GLYPH_WARNING_OFF && (glyph) < (GLYPH_WARNING_OFF + 6)));
            game.level.monsters[game.u.ux][game.u.uy] = null;
            place_monster(mtmp, game.u.ux0, game.u.uy0);
            newsym(game.u.ux, game.u.uy);
            newsym(game.u.ux0, game.u.uy0);
            /* monst still knows where hero is */
            mtmp.mux = game.u.ux , mtmp.muy = game.u.uy;
            pline("%s swaps places with you...", !noticed_it ? c_common_strings.c_Something : YMonnam(mtmp));
            if (!(canseemon(mtmp) || sensemon(mtmp))) {
                map_invisible(game.u.ux0, game.u.uy0);
            }
            /* monster chose to swap places; hero doesn't get any credit
               or blame if something bad happens to it */
            game.context.mon_moving = 1;
            if (!minliquid(mtmp)) {
                mintrap(mtmp, 0);
            }
            /*
         * If safepet at destination then move the pet to the hero's
         * previous location using the same conditions as in do_attack().
         * there are special extenuating circumstances:
         * (1) if the pet dies then your god angers,
         * (2) if the pet gets trapped then your god may disapprove.
         *
         * Ceiling-hiding pets are skipped by this section of code, to
         * be caught by the normal falling-monster code.
         */
            game.context.mon_moving = 0;
        } else if (is_safemon(mtmp) && !((((mtmp.data).mflags1 & 256) != 0) && mtmp.mundetected)) {
            if (!domove_swap_with_pet(mtmp, x, y)) {
                game.u.ux = game.u.ux0 , game.u.uy = game.u.uy0;
                /* could skip this since we're about to call u_on_newpos() */
                if (game.u.usteed) {
                    game.u.usteed.mx = game.u.ux , game.u.usteed.my = game.u.uy;
                }
            }
        }
    }
    /* tentative move above didn't handle CLIPPING, in case there was a
       monster in the way and the move attempt ended up being blocked;
       do a full re-position now, possibly back to where hero started */
    u_on_newpos(game.u.ux, game.u.uy);
    reset_occupations();
    if (game.context.run) {
        if (game.context.run < 8) {
            if (((tmpr.typ) == DOOR) || ((tmpr.typ) < POOL) || ((tmpr.typ) >= STAIRS && (tmpr.typ) <= ALTAR)) {
                nomul(0);
            }
        }
    }
    /* your tread on the ground may disturb the slumber of nearby zombies */
    if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && !((game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic) && !game.u.uprops[STEALTH].blocked) && game.youmonst.data.cwt >= (Math.trunc(WT_ELF / 2))) {
        disturb_buried_zombies(game.u.ux, game.u.uy);
    }
    if ((((game.youmonst.data).mflags1 & 128) != 0) || game.youmonst.data.mlet == S_EEL || game.u.dx || game.u.dy) {
        hideunder(game.youmonst);
    }
    /*
     * Mimics (or whatever) become noticeable if they move and are
     * imitating something that doesn't move.  We could extend this
     * to non-moving monsters...
     */
    if ((game.u.dx || game.u.dy) && ((game.youmonst.m_ap_type & 7) == M_AP_OBJECT || (game.youmonst.m_ap_type & 7) == M_AP_FURNITURE)) {
        game.youmonst.m_ap_type = M_AP_NOTHING;
    }
    check_leash(game.u.ux0, game.u.uy0);
    if (game.u.ux0 != game.u.ux || game.u.uy0 != game.u.uy) {
        /* let caller know so that an evaluation may take place */
        game.domove_succeeded |= (game.domove_attempting & (2 | 1));
        game.u.umoved = (1);
        newsym(game.u.ux0, game.u.uy0);
        /* Since the hero has moved, adjust what can be seen/unseen. */
        /* Do the work now in the recover time. */
        vision_recalc(1);
        invocation_message();
    }
    if ((game.uball != null)) {
        move_bc(0, bc_control, ballx, bally, chainx, chainy);
    }
    if (game.u.umoved) {
        spoteffects((1));
    }
    if (cause_delay) {
        /* delay next move because of ball dragging */
        /* must come after we finished picking up, in spoteffects() */
        nomul(-2);
        game.multi_reason = "dragging an iron ball";
        game.nomovemsg = "";
    }
    runmode_delay_output();
}
/* delay output based on value of runmode,
   if hero is running or doing a multi-turn action */
export function runmode_delay_output() {
    if ((game.context.run || game.multi) && game.flags.runmode != RUN_TPORT) {
        if (game.flags.runmode != RUN_LEAP || !(game.moves % 7)) {
            /* for tport mode, don't display anything until we've stopped;
           for normal (leap) mode, update display every 7th step
           (relative to turn counter; ought to be to start of running);
           for walk and crawl (visual debugging) modes, update the
           display after every step */
            /* moveloop() suppresses time_botl when running */
            game.disp.time_botl = game.flags.time;
            curs_on_u();
            (game.windowprocs.win_delay_output)();
            if (game.flags.runmode == RUN_CRAWL) {
                (game.windowprocs.win_delay_output)();
                (game.windowprocs.win_delay_output)();
                (game.windowprocs.win_delay_output)();
                (game.windowprocs.win_delay_output)();
            }
        }
    }
}
export function maybe_smudge_engr(x1, y1, x2, y2) {
    let ep = null;
    if (can_reach_floor((1))) {
        if ((ep = engr_at(x1, y1)) && ep.engr_type != 6) {
            wipe_engr_at(x1, y1, rnd(5), (0));
        }
        if ((x2 != x1 || y2 != y1) && (ep = engr_at(x2, y2)) && ep.engr_type != 6) {
            wipe_engr_at(x2, y2, rnd(5), (0));
        }
    }
}
/* HP loss or passing out from overexerting yourself */
export function overexert_hp() {
    let hp = (!(game.u.umonnum != game.u.umonster) ? game.u.uhp : game.u.mh);
    if (hp > 1) {
        hp -= 1;
        game.disp.botl = (1);
    } else {
        You("pass out from exertion!");
        exercise(A_CON, (0));
        fall_asleep(-10, (0));
    }
}
/* combat increases metabolism */
export function overexertion() {
    /* this used to be part of domove() when moving to a monster's
       position, but is now called by do_attack() so that it doesn't
       execute if you decline to attack a peaceful monster */
    gethungry();
    if ((game.moves % 3) != 0 && near_capacity() >= HVY_ENCUMBER) {
        overexert_hp();
    }
    /* might have fainted (forced to sleep) */
    return (game.multi < 0);
}
export function invocation_message() {
    if (invocation_pos(game.u.ux, game.u.uy) && !On_stairs(game.u.ux, game.u.uy)) {
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let otmp = carrying(CANDELABRUM_OF_INVOCATION);
        nomul(0);
        if (game.u.usteed) {
            buf = sprintf(buf, "beneath %s", y_monnam(game.u.usteed));
        } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            buf = strcpy(buf, "beneath you");
        } else {
            buf = sprintf(buf, "under your %s", makeplural(body_part(FOOT)));
        }
        You_feel("a strange vibration %s.", buf);
        game.u.uevent.uvibrated = 1;
        if (otmp && otmp.spe == 7 && otmp.lamplit) {
            pline("%s %s!", The(xname(otmp)), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "throbs palpably" : "glows with a strange light");
        }
    }
}
/* for status: set up iflags.terrain_typ, an index into terrain_descrp[];
   some types need fixing up  */
export function classify_terrain() {
    let lev = game.level.locations[game.u.ux][game.u.uy];
    let typ = game.lastseentyp[game.u.ux][game.u.uy];
    if ((game.u.uinwater)) {
        /*
     * If the terrain under the hero is different now from what it
     * was on the previous check, bring iflags.terrain_typ up to date
     * and request a status update.  Unless hero is running--then the
     * update request will be suppressed.
     */
        typ = xSUBMERGED;
    } else {
        switch (typ) {
            case STONE:
                if (game.level.flags.arboreal) {
                    typ = TREE;
                }
                break;
            case CORR:
            case ROOM:
                typ = !(((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level)))) ? xFLOOR : xGROUND;
                break;
            case DOOR:
                if ((lev.flags & 2) != 0) {
                    typ = xOPENDOOR;
                } else if ((lev.flags & (4 | 8 | 16)) != 0) {
                    typ = xSHUTDOOR;
                }
                break;
            case DRAWBRIDGE_UP:
                typ = db_under_typ(lev.flags);
                if (typ == STONE || typ == ROOM) {
                    typ = xGROUND;
                }
                break;
            case MOAT:
                if ((((((game.dungeon_topology.d_medusa_level)).dlevel || ((game.dungeon_topology.d_medusa_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_medusa_level))))) {
                    typ = xSEA;
                } else if ((((((game.dungeon_topology.d_juiblex_level)).dlevel || ((game.dungeon_topology.d_juiblex_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_juiblex_level))))) {
                    typ = xSWAMP;
                }
                break;
            case WATER:
                if (!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
                    typ = xWATERWALL;
                }
                break;
            default:
                break;
        }
    }
    if (typ != game.iflags.terrain_typ) {
        /* terrain at hero's spot is different */
        game.iflags.terrain_typ = typ;
        /* request a status update unless hero is running */
        if (game.flags.terrainstatus && !game.context.run) {
            game.disp.botl = (1);
        }
    }
}
/* moving onto different terrain;
   might be going into solid rock, inhibiting levitation or flight,
   or coming back out of such, reinstating levitation/flying */
export function switch_terrain() {
    fnEnter("switch_terrain", "hack.c", 0);
    let lev = game.level.locations[game.u.ux][game.u.uy];
    let blocklev = (((lev.typ) < POOL) || closed_door(game.u.ux, game.u.uy) || ((lev.typ) == WATER) || lev.typ == LAVAWALL);
    let was_levitating = !!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked);
    let was_flying = !!((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked);
    if (blocklev) {
        /* called from spoteffects(), stop levitating but skip float_down() */
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            You_cant("levitate in here.");
        }
        game.u.uprops[LEVITATION].blocked |= 67108864;
    } else if (game.u.uprops[LEVITATION].blocked) {
        game.u.uprops[LEVITATION].blocked &= ~67108864;
        /* we're probably levitating now; if not, we must be chained
           to a buried iron ball so get float_up() feedback for that */
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || game.u.uprops[LEVITATION].blocked) {
            float_up();
        }
    }
    if (blocklev) {
        /* the same terrain that blocks levitation also blocks flight */
        /* [minor bug: we don't know whether this is beginning flight or
           resuming it; that could be tracked so that this message could
           be adjusted to "resume flying", but isn't worth the effort...] */
        if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            You_cant("fly in here.");
        }
        game.u.uprops[FLYING].blocked |= 67108864;
    } else if (game.u.uprops[FLYING].blocked) {
        game.u.uprops[FLYING].blocked &= ~67108864;
        /* maybe toggle (BFlying & I_SPECIAL) */
        /* boots take multiple turns to wear but any properties they
       confer are enabled at the start rather than the end; that
       causes message sequencing issues for boots of levitation
       so defer their encumbrance benefit until they're fully worn */
        /* in case Levitation is blocking Flying */
        float_vs_flight();
        if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            You("start flying.");
        }
    }
    if ((!!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) ^ was_levitating) || (!!((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ^ was_flying)) {
        game.disp.botl = (1);
    }
    /* update Lev/Fly status condition */
    if (game.flags.terrainstatus) {
        classify_terrain();
    }
}
/* set or clear u.uinwater */
export function set_uinwater(in_out) {
    if (in_out != game.u.uinwater) {
        game.u.uinwater = in_out ? 1 : 0;
        switch_terrain();
    }
}
/* extracted from spoteffects; called by spoteffects to check for entering or
   leaving a pool of water/lava, and by moveloop to check for staying on one;
   returns true to skip rest of spoteffects */
/* true if called by spoteffects */
export function pooleffects(newspot) {
    if (game.u.uinwater) {
        /* assume we're getting out */
        let still_inwater = (0);
        if (!is_pool(game.u.ux, game.u.uy)) {
            if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
                You("pop into an air bubble.");
                game.iflags.last_msg = PLNMSG_BACK_ON_GROUND;
            } else if (is_lava(game.u.ux, game.u.uy)) {
                You("leave the %s...", hliquid("water"));
            } else {
                back_on_ground((0));
            }
        } else if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            still_inwater = (1);
        } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            You("pop out of the %s like a cork!", hliquid("water"));
        } else if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            You("fly out of the %s.", hliquid("water"));
        } else if (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) {
            You("slowly rise above the surface.");
        } else {
            still_inwater = (1);
        }
        if (!still_inwater) {
            let was_underwater = ((game.u.uinwater) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))));
            /* u.uinwater = 0; leave the water */
            set_uinwater(0);
            if (was_underwater) {
                docrt();
                game.vision_full_recalc = 1;
            }
        }
    }
    if (!game.u.ustuck && !((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && is_pool_or_lava(game.u.ux, game.u.uy)) {
        if (game.u.usteed && !(!(((game.u.usteed.data).mflags1 & 1) != 0) && !((game.u.usteed.data).mlet == S_EYE || (game.u.usteed.data).mlet == S_LIGHT) && (!(((game.u.usteed.data).mflags1 & 16) != 0) || !has_ceiling(game.u.uz)))) {
            return (0);
        } else if (game.u.usteed) {
            dismount_steed((game.u.uinwater) ? DISMOUNT_FELL : DISMOUNT_GENERIC);
            /* dismount_steed() -> float_down() -> pickup()
               (float_down doesn't do autopickup on Air or Water) */
            if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
                return (0);
            }
            /* even if we actually end up at same location, float_down()
               has already done trap and pickup actions of spoteffects() */
            if (newspot) {
                check_special_room((0));
            }
            return (1);
        }
        /* if hiding on ceiling then don't automatically enter pool */
        if ((game.u.umonnum != game.u.umonster) && ((((game.mons[game.u.umonnum]).mflags1 & 256) != 0) && (((((game.mons[game.u.umonnum]).mflags1 & 16) != 0) && (game.mons[game.u.umonnum]).mlet != S_MIMIC) || (((game.mons[game.u.umonnum]).mflags1 & 1) != 0))) && game.u.uundetected) {
            return (0);
        }
        if (is_lava(game.u.ux, game.u.uy)) {
            /* drown(),lava_effects() return true if hero changes
           location while surviving the problem */
            if (lava_effects()) {
                return (1);
            }
        } else if ((!((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) || is_waterwall(game.u.ux, game.u.uy)) && (newspot || !game.u.uinwater || !((game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))))) {
            if (drown()) {
                return (1);
            }
        }
    }
    return (0);
}
let __spoteffects_inspoteffects = 0;
let __spoteffects_spotloc = { x: 0, y: 0 };
let __spoteffects_spotterrain = 0;
let __spoteffects_spottrap = null;
let __spoteffects_spottraptyp = NO_TRAP;
const __spoteffects_icewarnings = ["The ice seems very soft and slushy.", "You feel the ice shift beneath you!", "The ice, is gonna BREAK!"];
export function spoteffects(pick) {
    fnEnter("spoteffects", "hack.c", 0);
    let mtmp = null;
    let trap = null;
    let trapflag = 0;
    spotdone: {
        trap = t_at(game.u.ux, game.u.uy);
        trapflag = game.iflags.failing_untrap ? 64 : 0;
        /* prevent recursion from affecting the hero all over again
       [hero poly'd to iron golem enters water here, drown() inflicts
       damage that triggers rehumanize() which calls spoteffects()...] */
        if (__spoteffects_inspoteffects && ((__spoteffects_spotloc.x) == game.u.ux && (__spoteffects_spotloc.y) == game.u.uy) && __spoteffects_spotterrain == game.level.locations[game.u.ux][game.u.uy].typ && (!__spoteffects_spottrap || !trap || trap.ttyp == __spoteffects_spottraptyp)) {
            return;
        }
        /* when float_down() puts hero into lava and she teleports out,
       defer spoteffects() until after "you are back on solid <surface>" */
        if (game.iflags.in_lava_effects) {
            return;
        }
        ++__spoteffects_inspoteffects;
        __spoteffects_spotterrain = game.level.locations[game.u.ux][game.u.uy].typ;
        __spoteffects_spotloc.x = game.u.ux , __spoteffects_spotloc.y = game.u.uy;
        /* moving onto different terrain might cause Lev or Fly to toggle;
      level change sets <ux0,uy0> to <ux,uy>, so this spotterrain
      check always fails then, but it also sets iflags.terrain_typ */
        if (__spoteffects_spotterrain != game.level.locations[game.u.ux0][game.u.uy0].typ || game.iflags.terrain_typ == MAX_TYPE) {
            switch_terrain();
        }
        if (pooleffects((1))) {
            break spotdone;
        }
        check_special_room((0));
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == SINK) && ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            dosinkfall();
        }
        if (!game.in_steed_dismounting) {
            /* except when reason is transformed terrain (ice -> water) */
            /* or transformed trap (land mine -> pit) */
            /* if dismounting, check again later */
            let pit = 0;
            if (trap && (game.u.uprops[LEVITATION].intrinsic & 16777215) == 1 && !(game.u.uprops[LEVITATION].extrinsic || (game.u.uprops[LEVITATION].intrinsic & ~(536870912 | 16777215)))) {
                if (rn2(2)) {
                    /* if levitation is due to time out at the end of this
           turn, allowing it to do so could give the perception
           that a trap here is being triggered twice, so adjust
           the timeout to prevent that */
                    incr_itimeout({ get value() { return game.u.uprops[LEVITATION].intrinsic; }, set value(_v) { game.u.uprops[LEVITATION].intrinsic = _v; } }, 1);
                } else {
                    if (float_down(536870912 | 16777215, 0)) {
                        /* levitation has ended; we've already triggered
                       any trap and [usually] performed autopickup */
                        trap = null;
                        pick = (0);
                    }
                }
            }
            /*
         * If not a pit, pickup before triggering trap.
         * If pit, trigger trap before pickup.
         */
            pit = (trap && ((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT));
            if (pick && !pit) {
                pickup(1);
            }
            if (trap) {
                if (!__spoteffects_spottrap || __spoteffects_spottraptyp != trap.ttyp) {
                    /*
             * dotrap on a fire trap calls melt_ice() which triggers
             * spoteffects() (again) which can trigger the same fire
             * trap (again).  Use static spottrap to prevent that.
             * We track spottraptyp because some traps morph (landmine
             * to pit) and any new trap type should get triggered.
             */
                    __spoteffects_spottrap = trap;
                    __spoteffects_spottraptyp = trap.ttyp;
                    /* fall into arrow trap, etc. */
                    dotrap(trap, trapflag);
                    __spoteffects_spottrap = null;
                    __spoteffects_spottraptyp = NO_TRAP;
                }
            }
            if (pick && pit) {
                pickup(1);
            }
        }
        if ((game.u.uprops[WARNING].intrinsic || game.u.uprops[WARNING].extrinsic) && is_ice(game.u.ux, game.u.uy)) {
            /* Warning alerts you to ice danger */
            let time_left = spot_time_left(game.u.ux, game.u.uy, MELT_ICE_AWAY);
            if (time_left && time_left < 15) {
                pline("%s", __spoteffects_icewarnings[(time_left < 5) ? 2 : (time_left < 10) ? 1 : 0]);
            }
        }
        if ((mtmp = (game.level.monsters[game.u.ux][game.u.uy])) != null && !game.u.uswallow) {
            mtmp.mundetected = mtmp.msleeping = 0;
            switch (mtmp.data.mlet) {
                case S_PIERCER:
                    pline("%s suddenly drops from the %s!", Amonnam(mtmp), ceiling(game.u.ux, game.u.uy));
                    if (mtmp.mtame) {
                        ;
                    } else if (hard_helmet(game.uarmh)) {
                        /* jumps to greet you, not attack */
                        pline("Its blow glances off your %s.", helm_simple_name(game.uarmh));
                    } else if (game.u.uac + 3 <= rnd(20)) {
                        You("are almost hit by %s!", x_monnam(mtmp, 2, "falling", 0, (1)));
                    } else {
                        let dmg = 0;
                        You("are hit by %s!", x_monnam(mtmp, 2, "falling", 0, (1)));
                        dmg = d(4, 6);
                        if ((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) {
                            dmg = Math.trunc((dmg + 1) / 2);
                        }
                        mdamageu(mtmp, dmg);
                    }
                    break;
                default:
                    if (mtmp.mtame) {
                        pline("%s jumps near you from the %s.", Amonnam(mtmp), ceiling(game.u.ux, game.u.uy));
                    } else if (mtmp.mpeaceful) {
                        You("surprise %s!", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !sensemon(mtmp) ? c_common_strings.c_something : a_monnam(mtmp));
                        mtmp.mpeaceful = 0;
                    } else {
                        pline("%s attacks you by surprise!", Amonnam(mtmp));
                    }
                    break;
            }
            /* have to move the monster */
            mnexto(mtmp, 4);
        }
    }
    if (!--__spoteffects_inspoteffects) {
        __spoteffects_spotterrain = STONE;
        __spoteffects_spotloc.x = __spoteffects_spotloc.y = 0;
    }
    return;
}
/* returns first matching monster */
export function monstinroom(mdat, roomno) {
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (mtmp.data == mdat && strchr(in_rooms(mtmp.mx, mtmp.my, 0), roomno + 3)) {
            return mtmp;
        }
    }
    return null;
}
/* check whether room contains a particular type of furniture */
export function furniture_present(furniture, roomno) {
    let x = 0;
    let y = 0;
    let lx = 0;
    let ly = 0;
    let hx = 0;
    let hy = 0;
    let sroom = game.rooms[roomno];
    ly = sroom.ly , hy = sroom.hy;
    lx = sroom.lx;
    hx = sroom.hx;
    /* the inside_room() check handles irregularly shaped rooms */
    for (y = ly; y <= hy; ++y) {
        for (x = lx; x <= hx; ++x) {
            if (game.level.locations[x][y].typ == furniture && inside_room(sroom, x, y)) {
                return (1);
            }
        }
    }
    return (0);
}
let __in_rooms_buf = [0, 0, 0, 0, 0];
export function in_rooms(x, y, typewanted) {
    fnEnter("in_rooms", "hack.c", 0);
    let result = "";
    let step = 0;
    let typefound = 0;
    const goodtype = (rn) => (!typewanted
        || (typefound = game.rooms[rn - 3].rtype) == typewanted
        || (typewanted == 14 /*SHOPBASE*/ && typefound > 14));
    let rno = game.level.locations[x][y].roomno;
    switch (rno) {
        case 0: return result;
        case 1: step = 2; break;
        case 2: step = 1; break;
        default:
            if (goodtype(rno)) result = String.fromCharCode(rno) + result;
            return result;
    }
    let min_x = x - 1, max_x = x + 1;
    if (x < 1) min_x += step;
    else if (x >= 80) max_x -= step;
    let min_y = y - 1, max_y_offset = 2;
    if (min_y < 0) { min_y += step; max_y_offset -= step; }
    else if ((min_y + max_y_offset) >= 21) max_y_offset -= step;
    for (let xx = min_x; xx <= max_x; xx += step) {
        for (let yo = 0; yo <= max_y_offset; yo += step) {
            const yy = min_y + yo;
            const cell = game.level.locations[xx][yy];
            const rn = cell.roomno;
            if (rn >= 3 && result.indexOf(String.fromCharCode(rn)) < 0 && goodtype(rn)) {
                result = String.fromCharCode(rn) + result;
            }
        }
    }
    return result;
}
/* is (x,y) in a town? */
export function in_town(x, y) {
    let sroom = null;
    let has_subrooms = (0);
    if (!game.level.flags.has_town) {
        return (0);
    }
    for (let __nhi_sroom = 0; (sroom = game.rooms[__nhi_sroom]) && (sroom.hx > 0); __nhi_sroom++) {
        if (sroom.nsubrooms > 0) {
            /*
     * See if (x,y) is in a room with subrooms, if so, assume it's the
     * town.  If there are no subrooms, the whole level is in town.
     */
            has_subrooms = (1);
            if (inside_room(sroom, x, y)) {
                return (1);
            }
        }
    }
    return !has_subrooms;
}
export function move_update(newlev) {
    let c = 0;
    let ptr1 = null;
    let ptr2 = null;
    let ptr3 = null;
    let ptr4 = null;
    strcpy(game.u.urooms0, game.u.urooms);
    strcpy(game.u.ushops0, game.u.ushops);
    if (newlev) {
        memset(game.u.urooms, 0, 5 /* sizeof(char [5]) */);
        memset(game.u.uentered, 0, 5 /* sizeof(char [5]) */);
        memset(game.u.ushops, 0, 5 /* sizeof(char [5]) */);
        memset(game.u.ushops_entered, 0, 5 /* sizeof(char [5]) */);
        strcpy(game.u.ushops_left, game.u.ushops0);
        return;
    }
    strcpy(game.u.urooms, in_rooms(game.u.ux, game.u.uy, 0));
    // Indexed iteration: walk u.urooms (room number array, terminated
    // by 0 byte); for each entry, mirror to u.uentered if not in
    // u.urooms0, and to u.ushops + u.ushops_entered if it's a shop.
    let __p2 = 0, __p3 = 0, __p4 = 0;
    for (let __p1 = 0; __p1 < game.u.urooms.length && game.u.urooms[__p1]; __p1++) {
        const c = game.u.urooms[__p1];
        if (!strchr(game.u.urooms0, c)) {
            game.u.uentered[__p2++] = c;
        }
        const __rno = c - 3;
        if (__rno >= 0 && game.rooms[__rno] && (game.rooms[__rno].rtype >= SHOPBASE)) {
            game.u.ushops[__p3++] = c;
            if (!strchr(game.u.ushops0, c)) {
                game.u.ushops_entered[__p4++] = c;
            }
        }
    }
    if (__p2 < game.u.uentered.length) game.u.uentered[__p2] = 0;
    if (__p3 < game.u.ushops.length) game.u.ushops[__p3] = 0;
    if (__p4 < game.u.ushops_entered.length) game.u.ushops_entered[__p4] = 0;
    let __pl2 = 0;
    for (let __pl1 = 0; __pl1 < game.u.ushops0.length && game.u.ushops0[__pl1]; __pl1++) {
        const __c2 = game.u.ushops0[__pl1];
        if (!strchr(game.u.ushops, __c2)) {
            game.u.ushops_left[__pl2++] = __c2;
        }
    }
    if (__pl2 < game.u.ushops_left.length) game.u.ushops_left[__pl2] = 0;
}
/* possibly deliver a one-time room entry message */
export function check_special_room(newlev) {
    let mtmp = null;
    let ptr = null;
    move_update(newlev);
    if (game.u.ushops0) {
        u_left_shop(game.u.ushops_left, newlev);
    }
    if (game.level.flags.has_town && !game.context.achieveo.minetn_reached && In_mines(game.u.uz) && in_town(game.u.ux, game.u.uy)) {
        /*
     * Check for attaining 'entered Mine Town' achievement.
     * Most of the Mine Town variations have the town in one large room
     * containing a bunch of subrooms; we check for entering that large
     * room.  However, two of the variations cover the whole level rather
     * than include a room with subrooms.  We need to check for town entry
     * before the possible early return for not having entered a room in
     * case we have arrived in the town but have not entered any room.
     *
     * TODO: change the minetn variants which don't include any town
     * boundary to have such.
     */
        record_achievement(ACH_TOWN);
        game.context.achieveo.minetn_reached = (1);
    }
    if (!game.u.uentered && !game.u.ushops_entered) {
        return;
    }
    /* no entrance messages necessary */
    /* Did we just enter a shop? */
    if (game.u.ushops_entered) {
        u_entered_shop(game.u.ushops_entered);
    }
    for (let __ue_i = 0; __ue_i < game.u.uentered.length && game.u.uentered[__ue_i]; __ue_i++) {
        const ptr = game.u.uentered[__ue_i];
        let roomno = ptr - 3;
        if (roomno < 0 || !game.rooms[roomno]) continue;
        let rt = game.rooms[roomno].rtype;
        let msg_given = (1);
        switch (rt) {
            /* Did we just enter some other special room? */
            /* vault.c insists that a vault remain a VAULT,
         * and temples should remain TEMPLEs,
         * but everything else gives a message only the first time */
            case ZOO:
                pline("Welcome to David's treasure zoo!");
                break;
            case SWAMP:
                pline("It %s rather %s down here.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feels" : "looks", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "humid" : "muddy");
                break;
            case COURT:
                You("enter an opulent%s room!", !furniture_present(THRONE, roomno) ? "" : " throne");
                break;
            case LEPREHALL:
                You("enter a leprechaun hall!");
                break;
            case MORGUE:
                if (midnight()) {
                    /* the throne room in Sam quest home level lacks a throne */
                    let run = u_locomotion("Run");
                    pline("%s away!  %s away!", run, run);
                } else {
                    You("have an uncanny feeling...");
                }
                break;
            case BEEHIVE:
                You("enter a giant beehive!");
                break;
            case COCKNEST:
                You("enter a disgusting nest!");
                break;
            case ANTHOLE:
                You("enter an anthole!");
                break;
            case BARRACKS:
                if (monstinroom(game.mons[PM_SOLDIER], roomno) || monstinroom(game.mons[PM_SERGEANT], roomno) || monstinroom(game.mons[PM_LIEUTENANT], roomno) || monstinroom(game.mons[PM_CAPTAIN], roomno)) {
                    You("enter a military barracks!");
                } else {
                    You("enter an abandoned barracks.");
                }
                break;
            case DELPHI:
{
                    let oracle = monstinroom(game.mons[PM_ORACLE], roomno);
                    if (oracle) {
                        ;
                        if (!oracle.mpeaceful) {
                            verbalize("You're in Delphi, %s.", game.plname);
                        } else {
                            verbalize("%s, %s, welcome to Delphi!", Hello(null), game.plname);
                        }
                    } else {
                        msg_given = (0);
                    }
                    break;
                }
            case TEMPLE:
                intemple(roomno + 3);
                ;
            default:
                msg_given = (rt == TEMPLE || rt >= SHOPBASE);
                rt = 0;
                break;
        }
        if (msg_given) {
            room_discovered(roomno);
        }
        if (rt != 0) {
            game.rooms[roomno].rtype = OROOM;
            if (!search_special(rt)) {
                switch (rt) {
                    /* No more room of that type */
                    case COURT:
                        game.level.flags.has_court = 0;
                        break;
                    case SWAMP:
                        game.level.flags.has_swamp = 0;
                        break;
                    case MORGUE:
                        game.level.flags.has_morgue = 0;
                        break;
                    case ZOO:
                        game.level.flags.has_zoo = 0;
                        break;
                    case BARRACKS:
                        game.level.flags.has_barracks = 0;
                        break;
                    case TEMPLE:
                        game.level.flags.has_temple = 0;
                        break;
                    case BEEHIVE:
                        game.level.flags.has_beehive = 0;
                        break;
                }
            }
            if (rt == COURT || rt == SWAMP || rt == MORGUE || rt == ZOO) {
                for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
                    if (((mtmp).mhp < 1)) {
                        continue;
                    }
                    if (!isok(mtmp.mx, mtmp.my) || roomno != game.level.locations[mtmp.mx][mtmp.my].roomno) {
                        continue;
                    }
                    if (!((game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic) && !game.u.uprops[STEALTH].blocked) && !rn2(3)) {
                        wake_msg(mtmp, (0));
                        mtmp.msleeping = 0;
                    }
                }
            }
        }
    }
    return;
}
/* returns
   1 = cannot pickup, time taken
   0 = cannot pickup, no time taken
  -1 = do normal pickup
  -2 = loot the monster */
export function pickup_checks() {
    let traphere = null;
    if (game.u.uswallow) {
        if (!game.u.ustuck.minvent) {
            if ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null)) {
                /* uswallow case added by GAN 01/29/87 */
                You("pick up %s tongue.", s_suffix(mon_nam(game.u.ustuck)));
                pline("But it's kind of slimy, so you drop it.");
            } else {
                You("don't %s anything in here to pick up.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "see");
            }
            return 1;
        } else {
            /* loot the monster inventory */
            return -2;
        }
    }
    if (is_pool(game.u.ux, game.u.uy)) {
        if (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) || ((game.youmonst.data).mlet == S_EYE || (game.youmonst.data).mlet == S_LIGHT) || (((game.youmonst.data).mflags1 & 16) != 0) || (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && !(game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)))) {
            You("cannot dive into the %s to pick things up.", hliquid("water"));
            return 0;
        } else if (!(game.u.uinwater)) {
            You_cant("even see the bottom, let alone pick up %s.", c_common_strings.c_something);
            return 0;
        }
    }
    if (is_lava(game.u.ux, game.u.uy)) {
        if (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) || ((game.youmonst.data).mlet == S_EYE || (game.youmonst.data).mlet == S_LIGHT) || (((game.youmonst.data).mflags1 & 16) != 0) || (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && !(game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)))) {
            You_cant("reach the bottom to pick things up.");
            return 0;
        } else if (!(game.youmonst.data == game.mons[PM_FIRE_ELEMENTAL] || game.youmonst.data == game.mons[PM_SALAMANDER])) {
            You("would burn to a crisp trying to pick things up.");
            return 0;
        }
    }
    if (!(game.level.objects[game.u.ux][game.u.uy] != null)) {
        let lev = game.level.locations[game.u.ux][game.u.uy];
        if (((lev.typ) == THRONE)) {
            pline("It must weigh%s a ton!", lev.flags ? " almost" : "");
        } else if (((lev.typ) == SINK)) {
            pline_The("plumbing connects it to the floor.");
        } else if (((lev.typ) == GRAVE)) {
            You("don't need a gravestone.  Yet.");
        } else if (((lev.typ) == FOUNTAIN)) {
            You("could drink the %s...", hliquid("water"));
        } else if (((lev.typ) == DOOR) && (lev.flags & 2)) {
            pline("It won't come off the hinges.");
        } else if (((lev.typ) == ALTAR)) {
            pline("Moving the altar would be a very bad idea.");
        } else if (lev.typ == STAIRS) {
            pline_The("stairs are solidly affixed.");
        } else {
            There("is nothing here to pick up.");
        }
        return 0;
    }
    traphere = t_at(game.u.ux, game.u.uy);
    if (!can_reach_floor(traphere && ((traphere.ttyp) == PIT || (traphere.ttyp) == SPIKED_PIT))) {
        if (traphere && uteetering_at_seen_pit(traphere)) {
            /* if there's a hole here, any objects here clearly aren't at
           the bottom so only check for pits */
            You("cannot reach the bottom of the pit.");
        } else if (game.u.usteed && (game.u.weapon_skills[P_RIDING].skill) < P_BASIC) {
            rider_cant_reach();
        } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            You("cannot reach anything here.");
        } else {
            let surf = surface(game.u.ux, game.u.uy);
            if (traphere) {
                if (traphere.ttyp == HOLE) {
                    surf = "edge of the hole";
                } else if (traphere.ttyp == TRAPDOOR) {
                    surf = "trap door";
                }
            }
            You("cannot reach the %s.", surf);
        }
        return 0;
    }
    return -1;
}
/* the #pickup command */
export function dopickup() {
    let count = 0;
    let tmpcount = 0;
    let ret = 0;
    count = game.command_count;
    /* caller will usually have done this already */
    game.multi = 0;
    if ((ret = pickup_checks()) >= 0) {
        return ret ? 1 : 0;
    } else if (ret == -2) {
        tmpcount = -count;
        return loot_mon(game.u.ustuck, { get value() { return tmpcount; }, set value(_v) { tmpcount = _v; } }, null) ? 1 : 0;
    }
    return pickup(-count) ? 1 : 0;
}
/* stop running if we see something interesting next to us */
/* turn around a corner if that is the only way we can proceed */
/* do not turn left or right twice */
export function lookaround() {
    fnEnter("lookaround", "hack.c", 0);
    let x = 0;
    let y = 0;
    let i = 0;
    let x0 = 0;
    let y0 = 0;
    let m0 = 1;
    let i0 = 9;
    let corrct = 0;
    let noturn = 0;
    let mtmp = null;
    if (((game.u.umonnum) == PM_GRID_BUG) && game.u.dx && game.u.dy) {
        /* Grid bugs stop if trying to move diagonal, even if blind.  Maybe */
        /* they polymorphed while in the middle of a long move. */
        You("cannot move diagonally.");
        nomul(0);
        return;
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || game.context.run == 0) {
        return;
    }
    for (x = game.u.ux - 1; x <= game.u.ux + 1; x++) {
        for (y = game.u.uy - 1; y <= game.u.uy + 1; y++) {
            let infront = 0;
            stop: {
                infront = (x == game.u.ux + game.u.dx && y == game.u.uy + game.u.dy);
                /* ignore out of bounds, and our own location */
                /* Also see the similar check in dochugw() in monmove.c */
                if (!isok(x, y) || ((x) == game.u.ux && (y) == game.u.uy)) {
                    continue;
                }
                /* (grid bugs) ignore diagonals */
                if (((game.u.umonnum) == PM_GRID_BUG) && x != game.u.ux && y != game.u.uy) {
                    continue;
                }
                if ((mtmp = (game.level.monsters[x][y])) != null && ((mtmp).m_ap_type & 7) != M_AP_FURNITURE && ((mtmp).m_ap_type & 7) != M_AP_OBJECT && mon_visible(mtmp)) {
                    if ((game.context.run != 1 && !is_safemon(mtmp)) || (infront && !game.context.travel)) {
                        /* can we see a monster there? */
                        /* running movement and not a hostile monster */
                        /* OR it blocks our move direction and we're not traveling */
                        if (game.flags.mention_walls) {
                            pline_xy(x, y, "%s blocks your path.", upstart(a_monnam(mtmp)));
                        }
                        break stop;
                    }
                }
                /* stone is never interesting */
                if (game.level.locations[x][y].typ == STONE) {
                    continue;
                }
                /* ignore the square we're moving away from */
                if (x == game.u.ux - game.u.dx && y == game.u.uy - game.u.dy) {
                    continue;
                }
                if (avoid_moving_on_trap(x, y, (infront && game.context.run > 1))) {
                    if (game.context.run == 1) {
                        if (game.level.locations[game.u.ux][game.u.uy].typ != ROOM) {
                            if (game.context.run == 1 || game.context.run == 3 || game.context.run == 8) {
                                /* distance from x,y to location we're moving to */
                                i = dist2(x, y, game.u.ux + game.u.dx, game.u.uy + game.u.dy);
                                if (i > 2) { continue; }
                                /* x,y is (adjacent to) the location we're moving to;
                           if we've seen one corridor, and x,y is not directly
                           orthogonally next to it, mark noturn */
                                if (corrct == 1 && dist2(x, y, x0, y0) != 1) { noturn = 1; }
                                if (i < i0) { i0 = i; x0 = x; y0 = y; m0 = mtmp ? 1 : 0; }
                            }
                            corrct++;
                        }
                        continue;
                    }
                    if (infront) {
                        break stop;
                    }
                }
                if (((game.level.locations[x][y].typ) < POOL) || game.level.locations[x][y].typ == ROOM || ((game.level.locations[x][y].typ) == AIR || (game.level.locations[x][y].typ) == CLOUD) || game.level.locations[x][y].typ == ICE) {
                    continue;
                } else if (closed_door(x, y) || (mtmp && (((mtmp).m_ap_type & 7) == M_AP_FURNITURE && ((mtmp).mappearance == S_hcdoor || (mtmp).mappearance == S_vcdoor)))) {
                    if (x != game.u.ux && y != game.u.uy) {
                        continue;
                    }
                    if (game.context.run != 1 && !game.context.travel) {
                        if (game.flags.mention_walls) {
                            set_msg_xy(x, y);
                            You("stop in front of the door.");
                        }
                        break stop;
                    }
                    if (game.level.locations[game.u.ux][game.u.uy].typ != ROOM) {
                        if (game.context.run == 1 || game.context.run == 3 || game.context.run == 8) {
                            i = dist2(x, y, game.u.ux + game.u.dx, game.u.uy + game.u.dy);
                            if (i > 2) { continue; }
                            if (corrct == 1 && dist2(x, y, x0, y0) != 1) { noturn = 1; }
                            if (i < i0) { i0 = i; x0 = x; y0 = y; m0 = mtmp ? 1 : 0; }
                        }
                        corrct++;
                    }
                    continue;
                } else if (game.level.locations[x][y].typ == CORR) {
                    bcorr: {
                    }
                    if (game.level.locations[game.u.ux][game.u.uy].typ != ROOM) {
                        if (game.context.run == 1 || game.context.run == 3 || game.context.run == 8) {
                            i = dist2(x, y, game.u.ux + game.u.dx, game.u.uy + game.u.dy);
                            /* ignore if not on or directly adjacent to it */
                            if (i > 2) {
                                continue;
                            }
                            if (corrct == 1 && dist2(x, y, x0, y0) != 1) {
                                noturn = 1;
                            }
                            if (i < i0) {
                                /* if previous x,y was diagonal, now x,y is
                           orthogonal (or this is first time we're here) */
                                i0 = i;
                                x0 = x;
                                y0 = y;
                                m0 = mtmp ? 1 : 0;
                            }
                        }
                        corrct++;
                    }
                    continue;
                } else if (is_pool_or_lava(x, y)) {
                    if (infront && avoid_moving_on_liquid(x, y, (1))) {
                        break stop;
                    }
                    continue;
                } else {
                    if (game.context.run == 1) {
                        if (game.level.locations[game.u.ux][game.u.uy].typ != ROOM) {
                            if (game.context.run == 1 || game.context.run == 3 || game.context.run == 8) {
                                i = dist2(x, y, game.u.ux + game.u.dx, game.u.uy + game.u.dy);
                                if (i > 2) { continue; }
                                if (corrct == 1 && dist2(x, y, x0, y0) != 1) { noturn = 1; }
                                if (i < i0) { i0 = i; x0 = x; y0 = y; m0 = mtmp ? 1 : 0; }
                            }
                            corrct++;
                        }
                        continue;
                    }
                    if (game.context.run == 8) {
                        continue;
                    }
                    if (mtmp) {
                        continue;
                    }
                    if (((x == game.u.ux - game.u.dx) && (y != game.u.uy + game.u.dy)) || ((y == game.u.uy - game.u.dy) && (x != game.u.ux + game.u.dx))) {
                        continue;
                    }
                }
            }
            nomul(0);
            return;
        }
    }
    if (corrct > 1 && game.context.run == 2) {
        if (game.flags.mention_walls) {
            pline_The("corridor widens here.");
        }
        nomul(0);
        return;
    }
    if ((game.context.run == 1 || game.context.run == 3 || game.context.run == 8) && !noturn && !m0 && i0 && (corrct == 1 || (corrct == 2 && i0 == 1))) {
        if (i0 == 2) {
            if (game.u.dx == y0 - game.u.uy && game.u.dy == game.u.ux - x0) {
                i = 2;
            /* make sure that we do not turn too far */
            } else {
                i = -2;
            }
        } else if (game.u.dx && game.u.dy) {
            if ((game.u.dx == game.u.dy && y0 == game.u.uy) || (game.u.dx != game.u.dy && y0 != game.u.uy)) {
                i = -1;
            } else {
                i = 1;
            }
        } else {
            if ((x0 - game.u.ux == y0 - game.u.uy && !game.u.dy) || (x0 - game.u.ux != y0 - game.u.uy && game.u.dy)) {
                i = 1;
            } else {
                i = -1;
            }
        }
        i += game.u.last_str_turn;
        if (i <= 2 && i >= -2) {
            game.u.last_str_turn = i;
            game.u.dx = x0 - game.u.ux;
            game.u.dy = y0 - game.u.uy;
        }
    }
}
/* check for a doorway which lacks its door (NODOOR or BROKEN) */
export function doorless_door(x, y) {
    let lev_p = game.level.locations[x][y];
    if (!((lev_p.typ) == DOOR)) {
        return (0);
    }
    /* all rogue level doors are doorless but disallow diagonal access, so
       we treat them as if their non-existent doors were actually present */
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        return (0);
    }
    return !(lev_p.flags & ~(0 | 1));
}
/* used by drown() to check whether hero can crawl from water to <x,y>;
   also used by findtravelpath() when destination is one step away */
export function crawl_destination(x, y) {
    /* is location ok in general? */
    if (!goodpos(x, y, game.youmonst, 0)) {
        return (0);
    }
    /* orthogonal movement is unrestricted when destination is ok */
    if (x == game.u.ux || y == game.u.uy) {
        return (1);
    }
    /* diagonal movement has some restrictions */
    if (((game.u.umonnum) == PM_GRID_BUG)) {
        return (0);
    }
    if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        return (1);
    }
    /* pool could be next to a door, conceivably even inside a shop */
    if (((game.level.locations[x][y].typ) == DOOR) && (!doorless_door(x, y) || block_door(x, y))) {
        return (0);
    }
    /* finally, are we trying to squeeze through a too-narrow gap? */
    return !(bad_rock(game.youmonst.data, game.u.ux, y) && bad_rock(game.youmonst.data, x, game.u.uy) && cant_squeeze_thru(game.youmonst));
}
/* something like lookaround, but we are not running */
/* react only to monsters that might hit us */
export function monster_nearby() {
    fnEnter("monster_nearby", "hack.c", 0);
    let x = 0;
    let y = 0;
    let mtmp = null;
    for (x = game.u.ux - 1; x <= game.u.ux + 1; x++) {
        for (y = game.u.uy - 1; y <= game.u.uy + 1; y++) {
            if (!isok(x, y) || ((x) == game.u.ux && (y) == game.u.uy)) {
                continue;
            }
            if ((mtmp = (game.level.monsters[x][y])) != null && ((mtmp).m_ap_type & 7) != M_AP_FURNITURE && ((mtmp).m_ap_type & 7) != M_AP_OBJECT && ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || (!mtmp.mpeaceful && !noattacks(mtmp.data))) && (!(((mtmp.data).mflags1 & 256) != 0) || !mtmp.mundetected) && !((mtmp).msleeping || !(mtmp).mcanmove) && !onscary(game.u.ux, game.u.uy, mtmp) && (canseemon(mtmp) || sensemon(mtmp))) {
                return 1;
            }
        }
    }
    return 0;
}
export function end_running(and_travel) {
    if (game.context.run) {
        /* moveloop() suppresses time_botl when context.run is non-zero; when
       running stops, update 'time' even if other botl status is unchanged */
        game.context.run = 0;
        if (game.flags.time) {
            game.disp.time_botl = (1);
        }
        if (game.flags.terrainstatus) {
            /* classify_terrain() suppresses setting disp.botl when
           running; after that, it can no longer compare current terrain
           against iflaga.terrain_typ to detect a change, so recompute */
            /* "none of the above" value */
            game.iflags.terrain_typ = MAX_TYPE;
            classify_terrain();
        }
    }
    /* 'context.mv' isn't travel but callers who want to end travel
       all clear it too */
    if (and_travel) {
        game.context.travel = game.context.travel1 = game.context.mv = 0;
    }
    if (game.travelmap) {
        selection_free(game.travelmap, (1));
        game.travelmap = null;
    }
    if (game.multi > 0) {
        game.multi = 0;
    }
}
export function nomul(nval) {
    if (game.multi < nval) {
        return;
    }
    /* This is a bug fix by ab@unido */
    game.disp.botl |= (game.multi >= 0);
    /* Kludge to avoid ctrl-C bug -dlc */
    game.u.uinvulnerable = (0);
    game.u.usleep = 0;
    game.multi = nval;
    if (nval == 0) {
        game.multi_reason = null , game.multireasonbuf[0] = 0;
    }
    end_running((1));
    cmdq_clear(CQ_CANNED);
}
/* called when a non-movement, multi-turn action has completed */
export function unmul(msg_override) {
    game.disp.botl = (1);
    game.multi = 0;
    if (msg_override) {
        game.nomovemsg = msg_override;
    } else if (!game.nomovemsg) {
        game.nomovemsg = c_common_strings.c_You_can_move_again;
    }
    if (game.nomovemsg) {
        pline("%s", game.nomovemsg);
        /* follow "you survived that attempt on your life" with a message
           about current form if it's not the default; primarily for
           life-saving while turning into green slime but is also a reminder
           if life-saved while poly'd and Unchanging (explore or wizard mode
           declining to die since can't be both Unchanging and Lifesaved) */
        if ((game.u.umonnum != game.u.umonster) && !strncmpi(game.nomovemsg, "You survived that ", 18)) {
            You("are %s.", an(pmname(game.mons[game.u.umonnum], (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))));
        }
    }
    game.nomovemsg = null;
    game.u.usleep = 0;
    game.multi_reason = null , game.multireasonbuf[0] = 0;
    if (game.afternmv) {
        let f = game.afternmv;
        /* clear afternmv before calling it (to override the
           encumbrance hack for levitation--see weight_cap()) */
        game.afternmv = null;
        (f)();
    }
}
let __maybe_wail_powers = [TELEPORT, SEE_INVIS, POISON_RES, COLD_RES, SHOCK_RES, FIRE_RES, SLEEP_RES, DISINT_RES, TELEPORT_CONTROL, STEALTH, FAST, INVIS];
export function maybe_wail() {
    if (game.moves <= game.wailmsg + 50) {
        return;
    }
    game.wailmsg = game.moves;
    if ((game.urole.mnum == (PM_WIZARD)) || (game.urace.mnum == (PM_ELF)) || (game.urole.mnum == (PM_VALKYRIE))) {
        let who = null;
        let i = 0;
        let powercnt = 0;
        who = ((game.urole.mnum == (PM_WIZARD)) || (game.urole.mnum == (PM_VALKYRIE))) ? game.urole.name.m : "Elf";
        if (game.u.uhp == 1) {
            pline("%s is about to die.", who);
        } else {
            for (i = 0 , powercnt = 0; i < (Math.trunc(24 /* sizeof(short [12]) */ / 2 /* sizeof(short) */)); ++i) {
                if (game.u.uprops[__maybe_wail_powers[i]].intrinsic & (67108864 | 33554432 | 16777216)) {
                    ++powercnt;
                }
            }
            pline((powercnt >= 4) ? "%s, all your powers will be lost..." : "%s, your life force is running out.", who);
        }
    } else {
        ;
        You_hear(game.u.uhp == 1 ? "the wailing of the Banshee..." : "the howling of the CwnAnnwn...");
    }
}
/* show a message how much damage you received */
export function showdamage(dmg) {
    if (!game.iflags.showdamage || !dmg) {
        return;
    }
    pline("[HP %i, %i left]", -dmg, (game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp);
}
export function losehp(n, knam, k_format) {
    game.disp.botl = (1);
    end_running((1));
    if ((game.u.umonnum != game.u.umonster)) {
        game.u.mh -= n;
        showdamage(n);
        if (game.u.mhmax < game.u.mh) {
            game.u.mhmax = game.u.mh;
        }
        if (game.u.mh < 1) {
            rehumanize();
        } else if (n > 0 && game.u.mh * 10 < game.u.mhmax && (game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
            maybe_wail();
        }
        return;
    }
    game.u.uhp -= n;
    showdamage(n);
    if (game.u.uhp > game.u.uhpmax) {
        game.u.uhpmax = game.u.uhp;
    }
    if (game.u.uhp < 1) {
        game.killer.format = k_format;
        /* the thing that killed you */
        if (game.killer.name != knam) {
            game.killer.name = strcpy(game.killer.name, knam ? knam : "");
        }
        urgent_pline("You die...");
        done(DIED);
    } else if (n > 0 && game.u.uhp * 10 < game.u.uhpmax) {
        maybe_wail();
    }
}
export function weight_cap() {
    let carrcap = 0;
    let save_ELev = game.u.uprops[LEVITATION].extrinsic;
    let save_BLev = game.u.uprops[LEVITATION].blocked;
    if (game.afternmv == Boots_on && (game.u.uprops[LEVITATION].extrinsic & 32) != 0) {
        game.u.uprops[LEVITATION].extrinsic &= ~32;
        float_vs_flight();
    }
    game.u.uprops[LEVITATION].blocked &= ~536870912;
    /* levitation is blocked by being trapped in the floor, but it still
       functions enough in that situation to enhance carrying capacity */
    carrcap = (WT_WEIGHTCAP_STRCON * ((acurrstr()) + (acurr(A_CON)))) + WT_WEIGHTCAP_SPARE;
    if ((game.u.umonnum != game.u.umonster)) {
        /* consistent with can_carry() in mon.c */
        if (game.youmonst.data.mlet == S_NYMPH) {
            carrcap = MAX_CARR_CAP;
        } else if (!game.youmonst.data.cwt) {
            carrcap = Math.trunc((carrcap * game.youmonst.data.msize) / 2);
        } else if (!(((game.youmonst.data).mflags2 & 67108864) != 0) || ((((game.youmonst.data).mflags2 & 67108864) != 0) && (game.youmonst.data.cwt > WT_HUMAN))) {
            carrcap = (Math.trunc(carrcap * game.youmonst.data.cwt / WT_HUMAN));
        }
    }
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (game.u.usteed && (((game.u.usteed.data).mflags2 & 67108864) != 0))) {
        carrcap = MAX_CARR_CAP;
    } else {
        if (carrcap > MAX_CARR_CAP) {
            carrcap = MAX_CARR_CAP;
        }
        if (!((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            if (game.u.uprops[WOUNDED_LEGS].extrinsic & 131072) {
                carrcap -= WT_WOUNDEDLEG_REDUCT;
            }
            if (game.u.uprops[WOUNDED_LEGS].extrinsic & 262144) {
                carrcap -= WT_WOUNDEDLEG_REDUCT;
            }
        }
    }
    if (game.u.uprops[LEVITATION].extrinsic != save_ELev || game.u.uprops[LEVITATION].blocked != save_BLev) {
        game.u.uprops[LEVITATION].extrinsic = save_ELev;
        game.u.uprops[LEVITATION].blocked = save_BLev;
        float_vs_flight();
    }
    return ((carrcap) > (1) ? (carrcap) : (1));
}
/* returns how far beyond the normal capacity the player is currently. */
/* inv_weight() is negative if the player is below normal capacity. */
export function inv_weight() {
    let otmp = game.invent;
    let wt = 0;
    while (otmp) {
        if (otmp.oclass == COIN_CLASS) {
            wt += (Math.trunc((otmp.quan + 50) / 100));
        } else if (otmp.otyp != BOULDER || !(((game.youmonst.data).mflags2 & 134217728) != 0)) {
            wt += otmp.owt;
        }
        otmp = otmp.nobj;
    }
    game.wc = weight_cap();
    return (wt - game.wc);
}
/*
 * Returns 0 if below normal capacity, or the number of "capacity units"
 * over the normal capacity the player is loaded.  Max is 5.
 */
export function calc_capacity(xtra_wt) {
    let cap = 0;
    let wt = inv_weight() + xtra_wt;
    if (wt <= 0) {
        return UNENCUMBERED;
    }
    if (game.wc <= 1) {
        return OVERLOADED;
    }
    cap = (Math.trunc(wt * 2 / game.wc)) + 1;
    return ((cap) < (OVERLOADED) ? (cap) : (OVERLOADED));
}
export function near_capacity() {
    return calc_capacity(0);
}
export function max_capacity() {
    let wt = inv_weight();
    return (wt - (2 * game.wc));
}
export function check_capacity(str) {
    if (near_capacity() >= EXT_ENCUMBER) {
        if (str) {
            pline("%s", str);
        } else {
            You_cant("do that while carrying so much stuff.");
        }
        return 1;
    }
    return 0;
}
// struct weight_table_entry: { wtyp, nm, wt, idx, unique }
/* 1 = monst, 2 = obj */
/* 0-6 = weight in ascii; 7 - end = name */
game.weightlist = null;
export function dump_weights() {
    let i = 0;
    let cnt = 0;
    let nmwidth = 49;
    let mcount = NUMMONS;
    let ocount = NUM_OBJECTS;
    let nmbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let nmbufbase = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let num_entries = (mcount + ocount);
    game.weightlist = alloc(1 /* sizeof(struct weight_table_entry) */ * num_entries);
    decl_globals_init();
    init_objects();
    for (i = 0; i < mcount; ++i) {
        if (i != PM_LONG_WORM_TAIL) {
            let cm = 0;
            game.weightlist[cnt].wt = game.mons[i].cwt;
            game.weightlist[cnt].idx = i;
            game.weightlist[cnt].wtyp = 1;
            game.weightlist[cnt].unique = ((game.mons[i].geno & 4096) != 0);
            nh_snprintf("dump_weights", 4439, nmbuf, 256 /* sizeof(char [256]) */, "%07u", game.weightlist[cnt].wt);
            cm = CapitalMon(game.mons[i].pmnames[NEUTRAL]);
            nh_snprintf("dump_weights", 4444, nmbuf[7], 256 /* sizeof(char [256]) */ - 7, "%s%s", "the body of ", (cm) ? the(game.mons[i].pmnames[NEUTRAL]) : game.weightlist[cnt].unique ? game.mons[i].pmnames[NEUTRAL] : an(game.mons[i].pmnames[NEUTRAL]));
            game.weightlist[cnt].nm = dupstr(nmbuf);
            cnt++;
        }
    }
    for (i = 0; i < ocount; ++i) {
        let oc_name = (i == SLIME_MOLD) ? "slime mold" : game.obj_descr[i].oc_name;
        let wt = game.objects[i].oc_weight;
        if (wt && oc_name) {
            game.weightlist[cnt].idx = i;
            game.weightlist[cnt].wt = wt;
            game.weightlist[cnt].wtyp = 2;
            game.weightlist[cnt].unique = (game.objects[i].oc_unique != 0);
            game.objects[i].oc_name_known = 1;
            nmbufbase = strcpy(nmbufbase, simple_typename(i));
            nh_snprintf("dump_weights", 4463, nmbuf, 256 /* sizeof(char [256]) */, "%07u%s", wt, (game.weightlist[cnt].unique) ? the(nmbufbase) : an(nmbufbase));
            game.weightlist[cnt].nm = dupstr(nmbuf);
            cnt++;
        }
    }
    qsort(game.weightlist, cnt, 1 /* sizeof(struct weight_table_entry) */, cmp_weights);
    raw_printf("int all_weights[] = {");
    for (i = 0; i < cnt; ++i) {
        if (game.weightlist[i].nm) {
            raw_printf("    %7u%s /* %*s */", game.weightlist[i].wt, (i == cnt - 1) ? " " : ",", -nmwidth, game.weightlist[i].nm[7]);
            free(game.weightlist[i].nm) , game.weightlist[i].nm = null;
        }
    }
    (game.windowprocs.win_raw_print)("};");
    (game.windowprocs.win_raw_print)("");
    free(game.weightlist);
    freedynamicdata();
}
export function cmp_weights(p1, p2) {
    let i1 = p1;
    let i2 = p2;
    /* return (i1->wt - i2->wt); */
    return strcmp(i1.nm, i2.nm);
}
export function inv_cnt(incl_gold) {
    let otmp = game.invent;
    let ct = 0;
    while (otmp) {
        if (incl_gold || otmp.invlet != GOLD_SYM) {
            ct++;
        }
        otmp = otmp.nobj;
    }
    return ct;
}
/* Counts the money in an object chain. */
/* Intended use is for your or some monster's inventory, */
/* now that u.gold/m.gold is gone.*/
/* Counting money in a container might be possible too. */
export function money_cnt(otmp) {
    while (otmp) {
        if (otmp.oclass == COIN_CLASS) {
            return otmp.quan;
        }
        otmp = otmp.nobj;
    }
    return 0;
}
export function spot_checks(x, y, old_typ) {
    let new_typ = game.level.locations[x][y].typ;
    let db_ice_now = (0);
    switch (old_typ) {
        case DRAWBRIDGE_UP:
            db_ice_now = ((game.level.locations[x][y].flags & 28) == 8);
            ;
        case ICE:
            if ((new_typ != old_typ) || (old_typ == DRAWBRIDGE_UP && !db_ice_now)) {
                if (spot_time_left(x, y, MELT_ICE_AWAY)) {
                    /* make sure there's no MELT_ICE_AWAY timer */
                    spot_stop_timers(x, y, MELT_ICE_AWAY);
                }
                /* adjust things affected by the ice */
                obj_ice_effects(x, y, (0));
            }
            break;
    }
}
/* calculate x/y, rounding as appropriate */
export function rounddiv(x, y) {
    let r = 0;
    let m = 0;
    let divsgn = 1;
    if (y == 0) {
        panic("division by zero in rounddiv");
    } else if (y < 0) {
        divsgn = -divsgn;
        y = -y;
    }
    if (x < 0) {
        divsgn = -divsgn;
        x = -x;
    }
    r = (Math.trunc(x / y));
    m = x % y;
    if (2 * m >= y) {
        r++;
    }
    return divsgn * r;
}
/*hack.c*/
/* resume normal xname() for this obj */
/* boulder not affected by this trap */
/* this matches surface() but 'floor' is odd in many places */
/* defaults to "doorway" (door-less or broken) */
/* ICE, MOAT, LAVA, or 'STONE' (which ought to be 'room') */
/* moat and swamp handling match waterbody_name()'s result */
/* filter u.ushops0 -> u.ushops_left */
/* stop for traps, sometimes */
/* orthogonal to a closed door, consider it a corridor */
/* e.g. objects or trap or stairs */
/*
                     * When guessing and trying to travel as close as possible
                     * to an unreachable target space, don't include spaces
                     * that would never be picked as a guessed target in the
                     * travel matrix describing hero-reachable spaces.
                     * This stops travel from getting confused and moving
                     * the hero back and forth in certain degenerate
                     * configurations of sight-blocking obstacles, e.g.
                     *
                     *  T         1. Dig this out and carry enough to not be
                     *   ####       able to squeeze through diagonal gaps.
                     *   #--.---    Stand at @ and target travel at space T.
                     *    @.....
                     *    |.....
                     *
                     *  T         2. couldsee() marks spaces marked a and x
                     *   ####       as eligible guess spaces to move the hero
                     *   a--.---    towards.  Space a is closest to T, so it
                     *    @xxxxx    gets chosen.  Travel system moves @ right
                     *    |xxxxx    to travel to space a.
                     *
                     *  T         3. couldsee() marks spaces marked b, c and x
                     *   ####       as eligible guess spaces to move the hero
                     *   a--c---    towards.  Since findtravelpath() is called
                     *    b@xxxx    repeatedly during travel, it doesn't
                     *    |xxxxx    remember that it wanted to go to space a,
                     *              so in comparing spaces b and c, b is
                     *              chosen, since it seems like the closest
                     *              eligible space to T. Travel system moves @
                     *              left to go to space b.
                     *
                     *            4. Go to 2.
                     *
                     * By limiting the travel matrix here, space a in the
                     * example above is never included in it, preventing
                     * the cycle.
                     */
