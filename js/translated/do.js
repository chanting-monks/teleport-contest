/* NetHack 5.0	do.c	$NHDT-Date: 1774269965 2026/03/23 04:46:05 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.404 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Derek S. Ray, 2015. */
/* NetHack may be freely redistributed.  See license for details. */
/* Contains code for 'd', 'D' (drop), '>', '<' (up, down) */
import { game } from '../gstate.js';
import { lua_getglobal, lua_pushstring, lua_settop, nhl_pcall_handle } from '../c2js-runtime/lua.js';
import { free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, You_see, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcmp, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { next_to_u, reset_trapset } from './apply.js';
import { artifact_has_invprop, finesse_ahriman, undiscovered_artifact } from './artifact.js';
import { ballfall, ballrelease, drag_down, drop_ball, placebc, unplacebc } from './ball.js';
import { bones_include_name } from './bones.js';
import { check_gold_symbol, describe_level } from './botl.js';
import { cmd_from_func, do_reqmenu, paranoid_ynq, reset_occupations, set_move_cmd, set_occupation, yn_function } from './cmd.js';
import { is_lava, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_color_names, c_common_strings, nhcb_name, ynchars } from './decl.js';
import { buried_ball_to_punishment, bury_objs, rot_corpse, use_pick_axe2 } from './dig.js';
import { canseemon, docrt, flush_screen, map_background, map_object, newsym, reglyph_darkroom, reset_glyphmap, sensemon } from './display.js';
import { Adjmonnam, Amonnam, Monnam, docall, hcolor, hliquid, mon_nam, obj_pmname, rndmonnam, y_monnam } from './do_name.js';
import { discard_migrations, keepdogs, losedogs, update_mlstmv } from './dog.js';
import { container_impact_dmg, impact_drop, obj_delivery, ship_object } from './dokick.js';
import { breakobj, hitfloor } from './dothrow.js';
import { defsyms } from './drawing.js';
import { Can_fall_thru, In_W_tower, In_hell, In_mines, In_quest, On_W_tower_level, assign_level, assign_rnd_level, at_dgn_entrance, builds_up, depth, dunlev, dunlevs_in_dungeon, goto_hell, ledger_no, ledger_to_dnum, level_difficulty, maxledgerno, next_level, on_level, prev_level, print_level_annotation, recalc_mapseen, recbranch_mapseen, remdun_mapseen, surface, u_on_newpos, u_on_rndspot } from './dungeon.js';
import { done } from './end.js';
import { can_reach_floor, engr_at, make_grave } from './engrave.js';
import { more_experienced, newexplevel } from './exper.js';
import { floating_above } from './fountain.js';
import { glyph_to_cmap } from './glyphs.js';
import { check_special_room, impact_disturbs_zombies, losehp, monster_nearby, near_capacity, notice_all_mons, pooleffects, set_uinwater, u_locomotion, u_rooted } from './hack.js';
import { dist2, s_suffix, upstart, visctrl } from './hacklib.js';
import { record_achievement } from './insight.js';
import { any_obj_ok, delobj, freeinv, getobj, ggetobj, stackobj, useup, useupf } from './invent.js';
import { maybe_reset_pick } from './lock.js';
import { grow_up } from './makemon.js';
import { gulp_blnd_check } from './mhitu.js';
import { gain_guardian_angel } from './minion.js';
import { free_luathemes, mklev } from './mklev.js';
import { fumaroles, movebubbles, set_levltyp } from './mkmaze.js';
import { add_to_buried, costly_alteration, free_omid, free_omonst, obj_meld, obj_nexto_xy, place_object, pudding_merge_message, rider_revival_time, set_bknown, set_corpsenm, splitobj, weight } from './mkobj.js';
import { healmon, iter_mons, kill_genocided_monsters, m_in_air, m_into_limbo, mnexto, mondied, newcham, pm_to_cham, set_ustuck, wake_nearto, zombie_form } from './mon.js';
import { dmgtype, dmgtype_fromattack, locomotion, olfaction, sticks } from './mondata.js';
import { create_mplayers } from './mplayer.js';
import { mcureblindness } from './muse.js';
import { ACH_ASTR, ACH_BGRM, ACH_ENDG, ACH_HELL, ACH_MINE, ACH_SOKO, ALTAR, ART_EYES_OF_THE_OVERWORLD, A_DEX, BLINDED, BOULDER, COIN_CLASS, CORPSE, CORR, COST_DEGRD, CRYSKNIFE, DEAF, DIR_DOWN, DIR_UP, DISMOUNT_FELL, DRAWBRIDGE_UP, EGG, ENORMOUS_MEATBALL, ESCAPED, FACE, FIRE_RES, FLYING, FOUNTAIN, FUMBLING, GLOB_OF_GREEN_SLIME, GRAVE, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, HMON_THROWN, HOLE, LADDER, LEASH, LEG, LEVITATION, LOADSTONE, LOW_PM, MAGIC_PORTAL, MEATBALL, MEAT_RING, MEAT_STICK, NHCB_LVL_LEAVE, NHLpa_panic, NON_PM, NO_TRAP, PASSES_WALLS, PIT, PM_AIR_ELEMENTAL, PM_CHICKATRICE, PM_COCKATRICE, PM_CROESUS, PM_DEATH, PM_FAMINE, PM_GREEN_SLIME, PM_MANES, PM_NURSE, PM_PESTILENCE, PM_ROGUE, PM_TOURIST, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WRAITH, POTION_CLASS, POT_OIL, PRIMARYSET, P_PICK_AXE, REVIVE_MON, RING_CLASS, RIN_ADORNMENT, RIN_AGGRAVATE_MONSTER, RIN_COLD_RESISTANCE, RIN_CONFLICT, RIN_FIRE_RESISTANCE, RIN_FREE_ACTION, RIN_GAIN_CONSTITUTION, RIN_GAIN_STRENGTH, RIN_HUNGER, RIN_INCREASE_ACCURACY, RIN_INCREASE_DAMAGE, RIN_INVISIBILITY, RIN_LEVITATION, RIN_POISON_RESISTANCE, RIN_POLYMORPH, RIN_POLYMORPH_CONTROL, RIN_PROTECTION, RIN_PROTECTION_FROM_SHAPE_CHAN, RIN_REGENERATION, RIN_SEARCHING, RIN_SEE_INVISIBLE, RIN_SHOCK_RESISTANCE, RIN_SLOW_DIGESTION, RIN_STEALTH, RIN_SUSTAIN_ABILITY, RIN_TELEPORTATION, RIN_TELEPORT_CONTROL, RIN_WARNING, ROGUESET, ROOM, ROT_CORPSE, SICK, SINK, SLIMED, SLT_ENCUMBER, SPIKED_PIT, STAIRS, STOMACH, STONED, STRANGLED, S_GOLEM, S_MIMIC, S_TROLL, S_VORTEX, S_ZOMBIE, S_altar, S_dnladder, S_dnstair, S_fountain, S_grave, S_room, S_sink, S_throne, THRONE, TIMER_OBJECT, TIN, TOOL_CLASS, TRAPDOOR, TT_BURIEDBALL, TT_PIT, UNENCUMBERED, UTOTYPE_ATSTAIRS, UTOTYPE_DEFERRED, UTOTYPE_FALLING, UTOTYPE_NONE, UTOTYPE_PORTAL, UTOTYPE_RMPORTAL, VIBRATING_SQUARE, WATER, WEAPON_CLASS, WORM_TOOTH, WOUNDED_LEGS, WT_SPLASH_THRESHOLD, gm_levelchange, most_themes, st_all, tut_themes } from './nh-constants.js';
import { oinit } from './o_init.js';
import { Doname2, The, Tobjnam, an, corpse_xname, doname, fruitname, makeplural, otense, the, vtense, xname, yname, yobjnam } from './objnam.js';
import { waterbody_name } from './pager.js';
import { add_valid_menu_class, allow_all, allow_category, count_justpicked, encumber_msg, find_justpicked, pickup, query_category, query_objlist, u_safe_from_fatal_corpse } from './pickup.js';
import { Norep, There, livelog_printf } from './pline.js';
import { body_part, mbodypart } from './polyself.js';
import { incr_itimeout, make_blinded, set_itimeout } from './potion.js';
import { reset_hostility } from './priest.js';
import { ok_to_quest, onquest } from './quest.js';
import { com_pager, deliver_splev_message } from './questpgr.js';
import { in_out_region } from './region.js';
import { d, reseed_random, rn2, rn2_on_display_rng, rnd, rnz } from './rnd.js';
import { fix_shop_damage, is_unpaid, obfree, sellobj, sellobj_state, stolen_value } from './shk.js';
import { stairway_at, stairway_find_from, stairway_free_all, u_on_dnstairs, u_on_sstairs, u_on_upstairs } from './stairs.js';
import { mpickobj } from './steal.js';
import { dismount_steed, stucksteed } from './steed.js';
import { assign_graphics } from './symbols.js';
import { enexto, rloc, safe_teleds } from './teleport.js';
import { burn_away_slime, obj_has_timer, run_timers, start_timer } from './timeout.js';
import { clamp_hole_destination, climb_pit, delfloortrap, deltrap, dotrap, fill_pit, float_down, lava_damage, maketrap, minstapetrify, reset_utrap, seetrap, selftouch, t_at, uescaped_shaft, uteetering_at_seen_pit, water_damage } from './trap.js';
import { hmon } from './uhitm.js';
import { recalc_block_point, vision_recalc, vision_reset } from './vision.js';
import { dmgval } from './weapon.js';
import { setuqwep, setuswapwep, setuwep, welded, weldmsg } from './wield.js';
import { resurrect } from './wizard.js';
import { bypass_objlist, nxt_unbypassed_obj } from './worn.js';
import { get_container_location, get_obj_location, obj_resists, revive } from './zap.js';

/* static boolean badspot(coordxy,coordxy); */
/* the #drop command: drop one inventory item */
export function dodrop() {
    let result = 0;
    if (game.u.ushops) {
        sellobj_state((1));
    }
    result = drop(getobj("drop", any_obj_ok, 2 | 1));
    if (game.u.ushops) {
        sellobj_state((0));
    }
    if (result) {
        reset_occupations();
    }
    return result;
}
/* Called when a boulder is dropped, thrown, or pushed.  If it ends up
 * in a pool, it either fills the pool up or sinks away.  In either case,
 * it's gone for good...  If the destination is not a pool, returns FALSE.
 */
/* the object falling into a pool or water or lava */
/* coordinates of the pool */
/* for a boulder, whether or not it is being pushed */
export function boulder_hits_pool(otmp, rx, ry, pushing) {
    if (!otmp || otmp.otyp != BOULDER) {
        impossible("Not a boulder?");
    } else if (is_pool_or_lava(rx, ry)) {
        let lava = is_lava(rx, ry);
        let fills_up = 0;
        let what = waterbody_name(rx, ry);
        let ltyp = game.level.locations[rx][ry].typ;
        let chance = rn2(10);
        let mtmp = null;
        /* chance for boulder to fill pool:  Plane of Water==0%,
           lava 10%, wall of water==50%, other water==90% */
        fills_up = (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? (0) : ((ltyp) == WATER) ? (chance < 5) : lava ? (chance == 0) : (chance != 0);
        if (fills_up) {
            let ttmp = t_at(rx, ry);
            if (ltyp == DRAWBRIDGE_UP) {
                game.level.locations[rx][ry].flags &= ~28;
                game.level.locations[rx][ry].flags |= 16;
            } else {
                game.level.locations[rx][ry].typ = ROOM , game.level.locations[rx][ry].flags = 0;
                recalc_block_point(rx, ry);
            }
            /* 5.0: normally DEADMONSTER() is used when traversing the fmon
               list--dead monsters usually aren't still at specific map
               locations; however, if ice melts causing a giant to drown,
               that giant would still be on the map when it drops inventory;
               if it was carrying a boulder which now fills the pool, 'mtmp'
               will be dead here; killing it again would yield impossible
               "dmonsfree: N removed doesn't match N+1 pending" when other
               monsters have finished their current turn */
            if ((mtmp = (game.level.monsters[rx][ry])) != null && !((mtmp).mhp < 1) && !m_in_air(mtmp)) {
                mondied(mtmp);
            }
            if (ttmp) {
                delfloortrap(ttmp);
            }
            bury_objs(rx, ry);
            newsym(rx, ry);
            if (pushing) {
                let whobuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                whobuf = strcpy(whobuf, "you");
                if (game.u.usteed) {
                    whobuf = strcpy(whobuf, y_monnam(game.u.usteed));
                }
                pline("%s %s %s into the %s.", upstart(whobuf), vtense(whobuf, "push"), the(xname(otmp)), what);
                /* no splashing in this case */
                if (game.flags.verbose && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    pline("Now you can cross it!");
                }
            }
        }
        if (!fills_up || !pushing) {
            if (!game.u.uinwater) {
                if (pushing ? !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) : ((game.viz_array[ry][rx] & 2) != 0)) {
                    There("is a large splash as %s %s the %s.", the(xname(otmp)), fills_up ? "fills" : "falls into", what);
                } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    if (lava) {
                        ;
                    } else {
                        ;
                    }
                    You_hear("a%s splash.", lava ? " sizzling" : "");
                }
                wake_nearto(rx, ry, 40);
            }
            if (fills_up && game.u.uinwater && dist2((rx), (ry), game.u.ux, game.u.uy) == 0) {
                set_uinwater(0);
                /* not noticing monsters yet! */
                /* does a full vision recalc */
                docrt();
                game.vision_full_recalc = 1;
                You("find yourself on dry land again!");
            } else if (lava && (dist2(((rx)), ((ry)), game.u.ux, game.u.uy) <= 2)) {
                let dmg = 0;
                You("are hit by molten %s%c", hliquid("lava"), (game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) ? 46 : 33);
                burn_away_slime();
                dmg = d(((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) ? 1 : 3), 6);
                losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "molten lava", 1);
            } else if (!fills_up && game.flags.verbose && (pushing ? !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) : ((game.viz_array[ry][rx] & 2) != 0))) {
                pline("It sinks without a trace!");
            }
        }
        if (pushing) {
            useupf(otmp, otmp.quan);
        } else {
            obfree(otmp, null);
        }
        return (1);
    }
    return (0);
}
/* Used for objects which sometimes do special things when dropped; must be
 * called with the object not in any chain.  Returns TRUE if the object goes
 * away.
 */
/* the object landing on the floor */
/* map coordinates for spot where it is landing */
/* "fall", "drop", "land", &c */
export function flooreffects(obj, x, y, verb) {
    let t = null;
    let mtmp = null;
    let otmp = null;
    let save_bhitpos = { x: 0, y: 0 };
    let tseen = 0;
    let ttyp = NO_TRAP;
    let res = (0);
    if (obj.where != 0) {
        panic("flooreffects: obj not free");
    }
    /* make sure things like water_damage() have no pointers to follow */
    obj.nobj = obj.v.v_nexthere = null;
    /* erode_obj() (called from water_damage() or lava_damage()) needs
       bhitpos, but that was screwing up wand zapping that called us from
       rloco(), so we now restore bhitpos before we return */
    Object.assign(save_bhitpos, game.bhitpos);
    game.bhitpos.x = x , game.bhitpos.y = y;
    if (obj.otyp == BOULDER && boulder_hits_pool(obj, x, y, (0))) {
        res = (1);
    } else if (obj.otyp == BOULDER && (t = t_at(x, y)) != null && (((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT) || ((t.ttyp) == HOLE || (t.ttyp) == TRAPDOOR))) {
        deletedwithboulder: {
            ttyp = t.ttyp;
            tseen = t.tseen ? (1) : (0);
            if (((mtmp = (game.level.monsters[x][y])) && mtmp.mtrapped) || (game.u.utrap && ((x) == game.u.ux && (y) == game.u.uy))) {
                if (verb.value && (((game.viz_array[y][x] & 2) != 0) || dist2((x), (y), game.u.ux, game.u.uy) == 0)) {
                    pline("%s boulder %s into the pit%s.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "A" : "The", vtense(null, verb), mtmp ? "" : " with you");
                }
                if (mtmp) {
                    if (!(((mtmp.data).mflags1 & 8) != 0) && !(((mtmp.data).mflags2 & 134217728) != 0)) {
                        /* dieroll was rnd(20); 1: maximum chance to hit
                       since trapped target is a sitting duck */
                        let damage = 0;
                        let dieroll = 1;
                        if (game.context.mon_moving) {
                            /* As of 3.6.2: this was calling hmon() unconditionally
                       so always credited/blamed the hero but the boulder
                       might have been thrown by a giant or launched by
                       a rolling boulder trap triggered by a monster or
                       dropped by a scroll of earth read by a monster */
                            /* normally we'd use ohitmon() but it can call
                           drop_throw() which calls flooreffects() */
                            damage = dmgval(obj, mtmp);
                            mtmp.mhp -= damage;
                            if (((mtmp).mhp < 1)) {
                                if ((canseemon(mtmp) || sensemon(mtmp))) {
                                    pline("%s is %s!", Monnam(mtmp), (((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) ? "destroyed" : "killed");
                                }
                                mondied(mtmp);
                            }
                        } else {
                            hmon(mtmp, obj, HMON_THROWN, dieroll);
                        }
                        if (!((mtmp).mhp < 1) && !((mtmp.data).mlet == S_VORTEX || (mtmp.data) == game.mons[PM_AIR_ELEMENTAL])) {
                            res = (0);
                        }
                        /* still alive, boulder still intact */
                        ((res));
                    }
                    mtmp.mtrapped = 0;
                } else {
                    if (!(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && !(((game.youmonst.data).mflags2 & 134217728) != 0)) {
                        losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(15)) + 1) / 2)) : (rnd(15))), "squished under a boulder", 2);
                        break deletedwithboulder;
                    } else {
                        reset_utrap((1));
                    }
                }
            }
            if (verb.value) {
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && ((x) == game.u.ux && (y) == game.u.uy)) {
                    ;
                    You_hear("a CRASH! beneath you.");
                } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && ((game.viz_array[y][x] & 2) != 0)) {
                    pline_The("boulder %s%s.", (ttyp == TRAPDOOR && !tseen) ? "triggers and " : "", (ttyp == TRAPDOOR) ? "plugs a trap door" : (ttyp == HOLE) ? "plugs a hole" : "fills a pit");
                } else {
                    ;
                    You_hear("a boulder %s.", verb);
                }
            }
        }
        if ((t = t_at(x, y)) != null) {
            /*
         * Note:  trap might have gone away via ((hmon -> killed -> xkilled)
         *  || mondied) -> mondead -> m_detach -> fill_pit.
         */
            /* creating a pit in ice results in that ice being turned into
           floor so we shouldn't need any special ice handing here */
            delfloortrap(t);
            if (game.u.utrap && ((x) == game.u.ux && (y) == game.u.uy)) {
                reset_utrap((0));
            }
        }
        useupf(obj, 1);
        bury_objs(x, y);
        newsym(x, y);
        res = (1);
    } else if (is_lava(x, y)) {
        res = lava_damage(obj, x, y);
    } else if (is_pool(x, y)) {
        if ((((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked))) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && ((x) == game.u.ux && (y) == game.u.uy)) {
            if (!(game.u.uinwater)) {
                if (weight(obj) > WT_SPLASH_THRESHOLD) {
                    /* Reasonably bulky objects (arbitrary) splash when dropped.
         * If you're floating above the water even small things make
         * noise.  Stuff dropped near fountains always misses */
                    pline("Splash!");
                } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
                    pline("Plop!");
                }
            }
            map_background(x, y, 0);
            newsym(x, y);
        }
        res = water_damage(obj, null, (0)) == 3;
    } else if (((x) == game.u.ux && (y) == game.u.uy) && (t = t_at(x, y)) != null && (uteetering_at_seen_pit(t) || uescaped_shaft(t))) {
        if (((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT)) {
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                You_hear("%s tumble downwards.", the(xname(obj)));
            } else {
                pline("%s into %s pit.", Tobjnam(obj, "tumble"), c_common_strings.c_the_your[t.madeby_u]);
            }
        } else if (ship_object(obj, x, y, (0))) {
            /* ship_object will print an appropriate "the item falls
             * through the hole" message, so no need to do it here. */
            res = (1);
        }
    } else if (obj.globby) {
        /* allow obj to be nonnull arg */
        let globbyobj = obj;
        while (globbyobj && (otmp = obj_nexto_xy(globbyobj, x, y, (1))) != null) {
            /* Globby things like puddings might stick together */
            pudding_merge_message(globbyobj, otmp);
            /* intentionally not getting the melded object; obj_meld may set
             * obj to null. */
            obj_meld(globbyobj, otmp);
        }
        res = !globbyobj;
    } else if (game.context.mon_moving && ((game.level.locations[x][y].typ) == ALTAR) && ((game.viz_array[y][x] & 2) != 0)) {
        doaltarobj(obj);
    } else if (obj.oclass == POTION_CLASS && game.level.flags.temperature > 0 && (game.level.locations[x][y].typ == ROOM || game.level.locations[x][y].typ == CORR)) {
        if (((game.viz_array[y][x] & 2) != 0)) {
            /* Potions are sometimes destroyed when landing on very hot
           ground. The basic odds are 50% for nonblessed potions and
           30% for blessed potions; if you have handled the object
           (i.e. it is or was yours), these odds are adjusted by Luck
           (each Luck point affects them by 2%). Artifact potions
           would not be affected, if any existed.

           Oil is not affected because its boiling point (and flash
           point) are higher than that of water. For example, whale
           oil, one of the substances traditionally used in oil lamps,
           can survive over 100 degrees Centigrade more heat than
           water can.*/
            /* unconditional "ground" is safe as this only runs for
               room and corridor tiles */
            pline("%s up as %s the hot ground.", Tobjnam(obj, "heat"), ((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "they hit" : "it hits");
        }
        let survival_chance = obj.blessed ? 70 : 50;
        if (obj.invlet) {
            survival_chance += (game.u.uluck + game.u.moreluck) * 2;
        }
        if (obj.otyp == POT_OIL) {
            survival_chance = 100;
        }
        if (!obj_resists(obj, survival_chance, 100)) {
            if (((game.viz_array[y][x] & 2) != 0)) {
                pline("%s from the heat!", ((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "They shatter" : "It shatters");
            } else {
                You_hear("a shattering noise.");
            }
            breakobj(obj, x, y, (0), (0));
            res = (1);
        }
    }
    game.bhitpos = save_bhitpos;
    return res;
}
/* obj is an object dropped on an altar */
export function doaltarobj(obj) {
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        return;
    }
    if (obj.oclass != COIN_CLASS) {
        if (!game.context.mon_moving && !game.u.uconduct.gnostic++) {
            livelog_printf(32, "eschewed atheism, by dropping %s on an altar", doname(obj));
        }
    } else {
        /* coins don't have bless/curse status */
        obj.blessed = obj.cursed = 0;
    }
    if (obj.blessed || obj.cursed) {
        There("is %s flash as %s %s the altar.", an(hcolor(obj.blessed ? c_color_names.c_amber : c_color_names.c_black)), doname(obj), otense(obj, "hit"));
        if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            obj.bknown = 1;
        }
    } else {
        pline("%s %s on the altar.", Doname2(obj), otense(obj, "land"));
        if (obj.oclass != COIN_CLASS) {
            obj.bknown = 1;
        }
    }
}
/* If obj is neither formally identified nor informally called something
 * already, prompt the player to call its object type. */
export function trycall(obj) {
    if (!game.objects[obj.otyp].oc_name_known && !game.objects[obj.otyp].oc_uname) {
        docall(obj);
    }
}
/* Transforms the sink at the player's position into
   a fountain, throne, altar or grave. */
export function polymorph_sink() {
    let sym = S_sink;
    let sinklooted = 0;
    let algn = 0;
    if (game.level.locations[game.u.ux][game.u.uy].typ != SINK) {
        return;
    }
    sinklooted = game.level.locations[game.u.ux][game.u.uy].flags != 0;
    game.level.locations[game.u.ux][game.u.uy].flags = 0;
    switch (rn2(4)) {
        /* svl.level.flags.nsinks--; // set_levltyp() will update this */
        default:
        case 0:
            sym = S_fountain;
            /* updates level.flags.nfountains */
            set_levltyp(game.u.ux, game.u.uy, FOUNTAIN);
            game.level.locations[game.u.ux][game.u.uy].horizontal = 0;
            if (sinklooted) {
                game.level.locations[game.u.ux][game.u.uy].flags |= 1;
            }
            ;
            break;
        case 1:
            sym = S_throne;
            set_levltyp(game.u.ux, game.u.uy, THRONE);
            if (sinklooted) {
                game.level.locations[game.u.ux][game.u.uy].flags = 1;
            }
            break;
        case 2:
            sym = S_altar;
            set_levltyp(game.u.ux, game.u.uy, ALTAR);
            /* 3.6.3: this used to pass 'rn2(A_LAWFUL + 2) - 1' to
           Align2amask() but that evaluates its argument more than once */
            /* -1 (A_Cha) or 0 (A_Neu) or +1 (A_Law) */
            algn = rn2(3) - 1;
            game.level.locations[game.u.ux][game.u.uy].flags = ((In_hell(game.u.uz) && rn2(3)) ? 0 : ((((algn) == (-128)) ? 0 : ((algn) == 1) ? 4 : ((algn) + 2))));
            break;
        case 3:
            sym = S_room;
            /* was SINK so updates nsinks */
            set_levltyp(game.u.ux, game.u.uy, ROOM);
            make_grave(game.u.ux, game.u.uy, null);
            if (game.level.locations[game.u.ux][game.u.uy].typ == GRAVE) {
                sym = S_grave;
            }
            break;
    }
    if (game.level.locations[game.u.ux][game.u.uy].typ != ROOM) {
        pline_The("sink transforms into %s!", an(defsyms[sym].explanation));
    /* give message even if blind; we know we're not levitating,
       so can feel the outcome even if we can't directly see it */
    } else {
        pline_The("sink vanishes.");
    }
    newsym(game.u.ux, game.u.uy);
}
/* Teleports the sink at the player's position;
   return True if sink teleported. */
export function teleport_sink() {
    let cx = 0;
    let cy = 0;
    let alreadylooted = 0;
    let trycnt = 0;
    do {
        /* this isn't incorrect but it is extremely unlikely that spots
         * on the level's edge will be ROOM so picking such wastes tries */
        cx = 1 + rnd((80 - 1) - 2);
        cy = 1 + rn2(21 - 2);
        if (game.level.locations[cx][cy].typ == ROOM && !t_at(cx, cy) && !engr_at(cx, cy) && (!((game.viz_array[cy][cx] & 2) != 0) || dist2((cx), (cy), game.u.ux, game.u.uy) > 3 * 3)) {
            /* this ends up having set_levltyp() count all sinks and
               fountains on the level twice but that is not a problem */
            alreadylooted = game.level.locations[game.u.ux][game.u.uy].flags;
            set_levltyp(game.u.ux, game.u.uy, ROOM);
            game.level.locations[game.u.ux][game.u.uy].flags = 0;
            /* remap location under self */
            newsym(game.u.ux, game.u.uy);
            /* create sink at new position */
            /* now SINK so also updates nsinks */
            set_levltyp(cx, cy, SINK);
            game.level.locations[cx][cy].flags = alreadylooted ? 1 : 0;
            newsym(cx, cy);
            return (1);
        }
    } while (++trycnt < 200);
    return (0);
}
/* obj is a ring being dropped over a kitchen sink */
export function dosinkring(obj) {
    let otmp = null;
    let otmp2 = null;
    let ideed = (1);
    let nosink = (0);
    You("drop %s down the drain.", doname(obj));
    /* block free identification via interrupt */
    obj.in_use = (1);
    switch (obj.otyp) {
        /* effects that can be noticed without eyes */
        case RIN_SEARCHING:
            You("thought %s got lost in the sink, but there it is!", yname(obj));
            obj.in_use = (0);
            dropx(obj);
            trycall(obj);
            return;
        case RIN_SLOW_DIGESTION:
            pline_The("ring is regurgitated!");
            obj.in_use = (0);
            dropx(obj);
            trycall(obj);
            return;
        case RIN_LEVITATION:
            pline_The("sink quivers upward for a moment.");
            break;
        case RIN_POISON_RESISTANCE:
            You("smell rotten %s.", makeplural(fruitname((0))));
            break;
        case RIN_AGGRAVATE_MONSTER:
            pline("Several %s buzz angrily around the sink.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? makeplural(rndmonnam(null)) : "flies");
            break;
        case RIN_SHOCK_RESISTANCE:
            pline("Static electricity surrounds the sink.");
            break;
        case RIN_CONFLICT:
            ;
            You_hear("loud noises coming from the drain.");
            break;
        case RIN_SUSTAIN_ABILITY:
            pline_The("%s flow seems fixed.", hliquid("water"));
            break;
        case RIN_GAIN_STRENGTH:
            pline_The("%s flow seems %ser now.", hliquid("water"), (obj.spe < 0) ? "weak" : "strong");
            break;
        case RIN_GAIN_CONSTITUTION:
            pline_The("%s flow seems %ser now.", hliquid("water"), (obj.spe < 0) ? "less" : "great");
            break;
        case RIN_INCREASE_ACCURACY:
            pline_The("%s flow %s the drain.", hliquid("water"), (obj.spe < 0) ? "misses" : "hits");
            break;
        case RIN_INCREASE_DAMAGE:
            pline_The("water's force seems %ser now.", (obj.spe < 0) ? "small" : "great");
            break;
        case RIN_HUNGER:
            ideed = (0);
            for (otmp = game.level.objects[game.u.ux][game.u.uy]; otmp; otmp = otmp2) {
                otmp2 = otmp.v.v_nexthere;
                if (otmp != game.uball && otmp != game.uchain && !obj_resists(otmp, 1, 99)) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        pline("Suddenly, %s %s from the sink!", doname(otmp), otense(otmp, "vanish"));
                        ideed = (1);
                    }
                    delobj(otmp);
                }
            }
            break;
        case MEAT_RING:
            pline("Several flies buzz around the sink.");
            break;
        case RIN_TELEPORTATION:
            nosink = teleport_sink();
            /* give message even if blind; we know we're not levitating,
           so can feel the outcome even if we can't directly see it */
            pline_The("sink %svanishes.", nosink ? "" : "momentarily ");
            ideed = (0);
            break;
        case RIN_POLYMORPH:
            polymorph_sink();
            nosink = (1);
            /* for S_room case, same message as for teleportation is given */
            ideed = (game.level.locations[game.u.ux][game.u.uy].typ != ROOM);
            break;
        default:
            ideed = (0);
            break;
    }
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !ideed) {
        ideed = (1);
        switch (obj.otyp) {
            case RIN_ADORNMENT:
                pline_The("faucets flash brightly for a moment.");
                break;
            case RIN_REGENERATION:
                pline_The("sink looks as good as new.");
                break;
            case RIN_INVISIBILITY:
                You("don't see anything happen to the sink.");
                break;
            case RIN_FREE_ACTION:
                You_see("the ring slide right down the drain!");
                break;
            case RIN_SEE_INVISIBLE:
                You_see("some %s in the sink.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "oxygen molecules" : "air");
                break;
            case RIN_STEALTH:
                pline_The("sink seems to blend into the floor for a moment.");
                break;
            case RIN_FIRE_RESISTANCE:
                pline_The("hot %s faucet flashes brightly for a moment.", hliquid("water"));
                break;
            case RIN_COLD_RESISTANCE:
                pline_The("cold %s faucet flashes brightly for a moment.", hliquid("water"));
                break;
            case RIN_PROTECTION_FROM_SHAPE_CHAN:
                pline_The("sink looks nothing like a fountain.");
                break;
            case RIN_PROTECTION:
                pline_The("sink glows %s for a moment.", hcolor((obj.spe < 0) ? c_color_names.c_black : c_color_names.c_silver));
                break;
            case RIN_WARNING:
                pline_The("sink glows %s for a moment.", hcolor(c_color_names.c_white));
                break;
            case RIN_TELEPORT_CONTROL:
                pline_The("sink looks like it is being beamed aboard somewhere.");
                break;
            case RIN_POLYMORPH_CONTROL:
                pline_The("sink momentarily looks like a regularly erupting geyser.");
                break;
            default:
                break;
        }
    }
    if (ideed) {
        trycall(obj);
    } else if (!nosink) {
        ;
        You_hear("the ring bouncing down the drainpipe.");
    }
    if (!rn2(20) && !nosink) {
        pline_The("sink backs up, leaving %s.", doname(obj));
        obj.in_use = (0);
        dropx(obj);
    } else if (!rn2(5)) {
        freeinv(obj);
        obj.in_use = (0);
        obj.ox = game.u.ux;
        obj.oy = game.u.uy;
        add_to_buried(obj);
    } else {
        useup(obj);
    }
}
/* some common tests when trying to drop or throw items */
export function canletgo(obj, word) {
    if (obj.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288))) {
        if (word.value) {
            Norep("You cannot %s %s you are wearing.", word, c_common_strings.c_something);
        }
        return (0);
    }
    if (obj == game.uwep && welded(game.uwep)) {
        if (word.value) {
            /* no weldmsg(), so uwep->bknown might become set silently
           if word is "" */
            let hand = body_part(HAND);
            if (((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) {
                hand = makeplural(hand);
            }
            Norep("You cannot %s %s welded to your %s.", word, c_common_strings.c_something, hand);
        }
        return (0);
    }
    if (obj.otyp == LOADSTONE && obj.cursed) {
        if (word.value) {
            /* getobj() kludge sets corpsenm to user's specified count
           when refusing to split a stack of cursed loadstones */
            /* getobj() ignores a count for throwing since that is
               implicitly forced to be 1; replicate its kludge... */
            if (!strcmp(word, "throw") && obj.quan > 1) {
                obj.corpsenm = 1;
            }
            pline("For some reason, you cannot %s%s the stone%s!", word, obj.corpsenm ? " any of" : "", (((obj.quan) == 1) ? "" : "s"));
        }
        obj.corpsenm = 0;
        set_bknown(obj, 1);
        return (0);
    }
    if (obj.otyp == LEASH && obj.corpsenm != 0) {
        if (word.value) {
            pline_The("leash is tied around your %s.", body_part(HAND));
        }
        return (0);
    }
    if (obj.owornmask & 1048576) {
        if (word.value) {
            You("cannot %s %s you are sitting on.", word, c_common_strings.c_something);
        }
        return (0);
    }
    return (1);
}
export function drop(obj) {
    if (!obj) {
        return 4;
    }
    if (!canletgo(obj, "drop")) {
        return 4;
    }
    if (obj.otyp == CORPSE && better_not_try_to_drop_that(obj)) {
        return 4;
    }
    if (obj == game.uwep) {
        if (welded(game.uwep)) {
            weldmsg(obj);
            return 4;
        }
        setuwep(null);
    }
    if (obj == game.uquiver) {
        setuqwep(null);
    }
    if (obj == game.uswapwep) {
        setuswapwep(null);
    }
    if (game.u.uswallow) {
        if (game.flags.verbose) {
            /* barrier between you and the floor */
            let onam_p = null;
            let mnam_p = null;
            let monbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            mnam_p = mon_nam(game.u.ustuck);
            /* doname can call s_suffix, reusing its buffer */
            if ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null)) {
                monbuf = sprintf(monbuf, "%s %s", s_suffix(mnam_p), mbodypart(game.u.ustuck, STOMACH));
                mnam_p = monbuf;
            }
            onam_p = is_unpaid(obj) ? yobjnam(obj, null) : doname(obj);
            You("drop %s into %s.", onam_p, mnam_p);
        }
    } else {
        if ((obj.oclass == RING_CLASS || obj.otyp == MEAT_RING) && ((game.level.locations[game.u.ux][game.u.uy].typ) == SINK)) {
            dosinkring(obj);
            /* came out of hiding; need '>' again to go down */
            /* Do nothing, but let other things happen */
            /* Not totally correct; what if they change back after now
         * but before they're finished wiping?
         */
            return 1;
        }
        if (!can_reach_floor((1))) {
            /* we might be levitating due to #invoke Heart of Ahriman;
               if so, levitation would end during call to freeinv()
               and we want hitfloor() to happen before float_down() */
            let levhack = finesse_ahriman(obj);
            if (levhack) {
                game.u.uprops[LEVITATION].extrinsic = 4096;
            }
            if (game.flags.verbose) {
                You("drop %s.", doname(obj));
            }
            freeinv(obj);
            hitfloor(obj, (1));
            if (levhack) {
                float_down(536870912 | 16777215, 8192 | 4096);
            }
            return 1;
        }
        if (!((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) && game.flags.verbose) {
            You("drop %s.", doname(obj));
        }
    }
    obj.how_lost = 2;
    dropx(obj);
    return 1;
}
/* dropx - take dropped item out of inventory;
   called in several places - may produce output
   (eg ship_object() and dropy() -> sellobj() both produce output) */
export function dropx(obj) {
    freeinv(obj);
    if (!game.u.uswallow) {
        if (ship_object(obj, game.u.ux, game.u.uy, (0))) {
            return;
        }
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR)) {
            doaltarobj(obj);
        }
    }
    dropy(obj);
}
/* dropy - put dropped object at destination; called from lots of places */
export function dropy(obj) {
    dropz(obj, (0));
}
/* dropz - really put dropped object at its destination... */
export function dropz(obj, with_impact) {
    if (obj == game.uwep) {
        setuwep(null);
    }
    if (obj == game.uquiver) {
        setuqwep(null);
    }
    if (obj == game.uswapwep) {
        setuswapwep(null);
    }
    if (game.u.uswallow) {
        if (obj != game.uball) {
            /* hero has dropped an item while inside an engulfer */
            /* mon doesn't pick up ball */
            /* moving shop item into engulfer's inventory treated as theft */
            if (is_unpaid(obj)) {
                stolen_value(obj, game.u.ux, game.u.uy, (1), (0));
            }
            /* add to engulfer's inventory if not immediately eaten */
            if (!engulfer_digests_food(obj)) {
                mpickobj(game.u.ustuck, obj);
            }
        }
    } else {
        if (flooreffects(obj, game.u.ux, game.u.uy, "drop")) {
            return;
        }
        place_object(obj, game.u.ux, game.u.uy);
        if (with_impact) {
            container_impact_dmg(obj, game.u.ux, game.u.uy);
        }
        impact_disturbs_zombies(obj, with_impact);
        if (obj == game.uball) {
            drop_ball(game.u.ux, game.u.uy);
        } else if (game.level.flags.has_shop) {
            sellobj(obj, game.u.ux, game.u.uy);
        }
        stackobj(obj);
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            map_object(obj, 0);
        }
        newsym(game.u.ux, game.u.uy);
    }
    /* the leg being wounded and its timeout might differ from one
       attack to the next, but we don't track the legs separately;
       5.0: both legs will ultimately heal together; this used to use
       direct assignment instead of bitwise-OR so getting wounded in
       one leg mysteriously healed the other */
    encumber_msg();
}
/* when swallowed, move dropped object from OBJ_FREE to u.ustuck's inventory;
   for purple worm, immediately eat any corpse, glob, or special meat item
   from object polymorph; return True if object is used up, False otherwise */
export function engulfer_digests_food(obj) {
    if ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) && (obj.otyp == CORPSE || obj.globby || obj.otyp == MEATBALL || obj.otyp == ENORMOUS_MEATBALL || obj.otyp == MEAT_RING || obj.otyp == MEAT_STICK)) {
        /* animal swallower (purple worn) eats any
       corpse, glob, or meat <item> but not other types of food */
        let could_petrify = (0);
        let could_poly = (0);
        let could_slime = (0);
        let could_grow = (0);
        let could_heal = (0);
        if (obj.otyp == CORPSE) {
            could_petrify = ((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE]);
            could_poly = (((obj).otyp == CORPSE || (obj).otyp == EGG || (obj).otyp == TIN) && (obj).corpsenm >= LOW_PM && (pm_to_cham((obj).corpsenm) != NON_PM || dmgtype(game.mons[(obj).corpsenm], 43)));
            could_grow = (obj.corpsenm == PM_WRAITH);
            could_heal = (obj.corpsenm == PM_NURSE);
        } else if (obj.otyp == GLOB_OF_GREEN_SLIME) {
            could_slime = (1);
        }
        pline("%s instantly digested!", Tobjnam(obj, "are"));
        if (could_poly || could_slime) {
            newcham(game.u.ustuck, could_slime ? game.mons[PM_GREEN_SLIME] : null, could_slime ? 1 : 0);
        } else if (could_petrify) {
            minstapetrify(game.u.ustuck, (1));
        } else if (could_grow) {
            grow_up(game.u.ustuck, null);
        } else if (could_heal) {
            healmon(game.u.ustuck, game.u.ustuck.mhpmax, 0);
            /* False: don't realize that sight is cured from inside */
            mcureblindness(game.u.ustuck, (0));
        }
        delobj(obj);
        return (1);
    }
    return (0);
}
/* things that must change when not held; recurse into containers.
   Called for both player and monsters */
export function obj_no_longer_held(obj) {
    if (!obj) {
        return;
    } else if (((obj).cobj != null)) {
        let contents = null;
        for (contents = obj.cobj; contents; contents = contents.nobj) {
            obj_no_longer_held(contents);
        }
    }
    switch (obj.otyp) {
        case CRYSKNIFE:
            if (!obj.oerodeproof || !rn2(10)) {
                /* Normal crysknife reverts to worm tooth when not held by hero
         * or monster; fixed crysknife has only 10% chance of reverting.
         * When a stack of the latter is involved, it could be worthwhile
         * to give each individual crysknife its own separate 10% chance,
         * but we aren't in any position to handle stack splitting here.
         */
                /* if monsters aren't moving, assume player is responsible */
                if (!game.context.mon_moving && !game.program_state.gameover) {
                    costly_alteration(obj, COST_DEGRD);
                }
                obj.otyp = WORM_TOOTH;
                obj.oerodeproof = 0;
            }
            break;
    }
}
/* the #droptype command: drop several things */
export function doddrop() {
    let result = 0;
    if (!game.invent) {
        You("have nothing to drop.");
        return 0;
    }
    /* clear any classes already there */
    add_valid_menu_class(0);
    if (game.u.ushops) {
        sellobj_state((1));
    }
    if (game.flags.menu_style != 0 || (result = ggetobj("drop", drop, 0, (0), null)) < -1) {
        result = menu_drop(result);
    }
    if (game.u.ushops) {
        sellobj_state((0));
    }
    if (result) {
        reset_occupations();
    }
    return result;
}
export function better_not_try_to_drop_that(otmp) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (otmp.otyp == CORPSE && !u_safe_from_fatal_corpse(otmp, st_all)) {
        nh_snprintf("better_not_try_to_drop_that", 958, buf, 256 /* sizeof(char [256]) */, "Drop the %s corpse without %s protection on?", obj_pmname(otmp), body_part(HAND));
        /* u_safe_from_fatal_corpse() with st_all checks for gloves and stoning
     *  resistance before bothering to prompt you.
     */
        return (paranoid_ynq((1), buf, (0)) != 121);
    }
    return (0);
}
/* check callers */
export function menudrop_split(otmp, cnt) {
    if (cnt && cnt < otmp.quan) {
        if (welded(otmp)) {
            ;
        } else if (otmp.otyp == LOADSTONE && otmp.cursed) {
            /* same kludge as getobj(), for canletgo()'s use */
            otmp.corpsenm = cnt;
        } else {
            otmp = splitobj(otmp, cnt);
        }
    }
    return drop(otmp);
}
/* Drop things from the hero's inventory, using a menu. */
export function menu_drop(retry) {
    let n = 0;
    let i = 0;
    let n_dropped = 0;
    let otmp = null;
    let otmp2 = null;
    let pick_list = null;
    let all_categories = 0;
    let drop_everything = 0;
    let autopick = 0;
    let drop_justpicked = 0;
    let justpicked_quan = 0;
    drop_done: {
        n_dropped = 0;
        all_categories = (1);
        drop_everything = (0);
        autopick = (0);
        drop_justpicked = (0);
        justpicked_quan = 0;
        if (retry) {
            all_categories = (retry == -2);
        } else if (game.flags.menu_style == 2) {
            all_categories = (0);
            n = query_category("Drop what type of items?", game.invent, (4 | 32 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 2), { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2);
            /* when paranoid_confirm:A is set, 'A' by itself implies
               'A'+'a' which will be followed by a confirmation prompt;
               when that option isn't set, 'A' by itself is rejected
               by query_categorry() and result here will be n==0 */
            if (!n) {
                break drop_done;
            }
            for (i = 0; i < n; i++) {
                if (pick_list[i].item.a_int == -2) {
                    /* no non-autopick category filters specified */
                    all_categories = (1);
                } else if (pick_list[i].item.a_int == 65) {
                    drop_everything = autopick = (1);
                } else if (pick_list[i].item.a_int == 80) {
                    justpicked_quan = ((0) > (pick_list[i].count) ? (0) : (pick_list[i].count));
                    drop_justpicked = (1);
                    drop_everything = (0);
                    add_valid_menu_class(pick_list[i].item.a_int);
                } else {
                    add_valid_menu_class(pick_list[i].item.a_int);
                    drop_everything = (0);
                }
            }
            free(pick_list);
        } else if (game.flags.menu_style == 1) {
            let ggoresults = 0;
            all_categories = (0);
            /* Gather valid classes via traditional NetHack method */
            i = ggetobj("drop", drop, 0, (1), { get value() { return ggoresults; }, set value(_v) { ggoresults = _v; } });
            if (i == -2) {
                all_categories = (1);
            }
            if ((ggoresults & 1) != 0) {
                n_dropped = i;
                break drop_done;
            }
        }
        if (autopick) {
            /*
         * Dropping a burning potion of oil while levitating can cause
         * an explosion which might destroy some of hero's inventory,
         * so the old code
         *      for (otmp = gi.invent; otmp; otmp = otmp2) {
         *          otmp2 = otmp->nobj;
         *          n_dropped += drop(otmp);
         *      }
         * was unreliable and could lead to an "object lost" panic.
         *
         * Use the bypass bit to mark items already processed (hence
         * not droppable) and rescan inventory until no unbypassed
         * items remain.
         *
         * FIXME?  if something explodes, or even breaks, we probably
         * ought to halt the traversal or perhaps ask player whether
         * to halt it.
         */
            /* clear bypass bit for invent */
            /* we might not have dropped everything (worn armor, welded weapon,
           cursed loadstones), so reset any remaining inventory to normal */
            bypass_objlist(game.invent, (0));
            while ((otmp = nxt_unbypassed_obj(game.invent)) != null) {
                if (drop_everything || all_categories || allow_category(otmp)) {
                    n_dropped += ((drop(otmp) & 1) != 0) ? 1 : 0;
                }
            }
            bypass_objlist(game.invent, (0));
        } else if (drop_justpicked && count_justpicked(game.invent) == 1) {
            /* drop the just picked item automatically, if only one stack */
            otmp = find_justpicked(game.invent);
            if (otmp) {
                n_dropped += ((menudrop_split(otmp, justpicked_quan) & 1) != 0) ? 1 : 0;
            }
        } else {
            /* should coordinate with perm invent, maybe not show worn items */
            n = query_objlist("What would you like to drop?", game.invent, (8 | 16 | 2), { get value() { return pick_list; }, set value(_v) { pick_list = _v; } }, 2, all_categories ? allow_all : allow_category);
            if (n > 0) {
                /*
             * picklist[] contains a set of pointers into inventory, but
             * as soon as something gets dropped, they might become stale
             * (see the autopick code above for an explanation).
             * Just checking to see whether one is still in the gi.invent
             * chain is not sufficient validation since destroyed items
             * will be freed and items we've split here might have already
             * reused that memory and put the same pointer value back into
             * gi.invent.  Ditto for using invlet to validate.  So we start
             * by setting bypass on all of gi.invent, then check each pointer
             * to verify that it is in gi.invent and has that bit set.
             */
                bypass_objlist(game.invent, (1));
                for (i = 0; i < n; i++) {
                    otmp = pick_list[i].item.a_obj;
                    for (otmp2 = game.invent; otmp2; otmp2 = otmp2.nobj) {
                        if (otmp2 == otmp) {
                            break;
                        }
                    }
                    if (!otmp2 || !otmp2.bypass) {
                        continue;
                    }
                    /* found next selected invent item */
                    n_dropped += ((menudrop_split(otmp, pick_list[i].count) & 1) != 0) ? 1 : 0;
                }
                /* reset gi.invent to normal */
                bypass_objlist(game.invent, (0));
                free(pick_list);
            }
        }
    }
    return (n_dropped ? 1 : 0);
}
export function u_stuck_cannot_go(updn) {
    if (game.u.ustuck) {
        if (game.u.uswallow || !sticks(game.youmonst.data)) {
            You("are %s, and cannot go %s.", !game.u.uswallow ? "being held" : (dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) ? "swallowed" : "engulfed", updn);
            return (1);
        } else {
            let mtmp = game.u.ustuck;
            /* clear u.ustuck and u.uswallow */
            set_ustuck(null);
            You("release %s.", mon_nam(mtmp));
        }
    }
    return (0);
}
/* the #down command */
export async function dodown() {
    let trap = null;
    let stway = null;
    let stairs_down = 0;
    let ladder_down = 0;
    set_move_cmd(DIR_DOWN, 0);
    if (u_rooted()) {
        return 1;
    }
    if (stucksteed((1))) {
        return 0;
    }
    stairs_down = ladder_down = (0);
    if ((stway = stairway_at(game.u.ux, game.u.uy)) != null && !stway.up) {
        stairs_down = !stway.isladder;
        ladder_down = !stairs_down;
    }
    if (game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) {
        if ((game.u.uprops[LEVITATION].intrinsic & 536870912) || (game.u.uprops[LEVITATION].extrinsic & 8192)) {
            if (game.u.uprops[LEVITATION].extrinsic & 8192) {
                /* Levitation might be blocked, but player can still use '>' to
       turn off controlled levitation */
                /* end controlled levitation */
                let obj = null;
                for (obj = game.invent; obj; obj = obj.nobj) {
                    if (obj.oartifact && artifact_has_invprop(obj, LEVITATION)) {
                        if (obj.age < game.moves) {
                            obj.age = game.moves;
                        }
                        obj.age += rnz(100);
                    }
                }
            }
            if (float_down(536870912 | 16777215, 8192)) {
                /* did something, effectively moved */
                return 1;
            } else if (!game.u.uprops[LEVITATION].intrinsic && !game.u.uprops[LEVITATION].extrinsic) {
                Your("latent levitation ceases.");
                return 1;
            }
        }
        if (game.u.uprops[LEVITATION].blocked) {
            ;
        } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            /* weren't actually floating after all */
            /* glyph_to_cmap() is a macro which expands its argument many
               times; use this to do part of its work just once */
            let glyph_at_uxuy = game.level.locations[game.u.ux][game.u.uy].glyph;
            /* Avoid alerting player to an unknown stair or ladder.
             * Changes the message for a covered, known staircase
             * too; staircase knowledge is not stored anywhere.
             */
            if (stairs_down) {
                stairs_down = (glyph_to_cmap(glyph_at_uxuy) == S_dnstair);
            } else if (ladder_down) {
                ladder_down = (glyph_to_cmap(glyph_at_uxuy) == S_dnladder);
            }
        }
        if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
            You("are floating in the %s.", surface(game.u.ux, game.u.uy));
        } else if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            You("are floating in %s.", is_pool(game.u.ux, game.u.uy) ? "the water" : "a bubble of air");
        } else {
            floating_above(stairs_down ? "stairs" : ladder_down ? "ladder" : surface(game.u.ux, game.u.uy));
        }
        return 0;
    }
    if ((game.u.umonnum != game.u.umonster) && ((((game.mons[game.u.umonnum]).mflags1 & 256) != 0) && (((((game.mons[game.u.umonnum]).mflags1 & 16) != 0) && (game.mons[game.u.umonnum]).mlet != S_MIMIC) || (((game.mons[game.u.umonnum]).mflags1 & 1) != 0))) && game.u.uundetected) {
        /* not hidden, even if means are available */
        game.u.uundetected = 0;
        if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            You("fly out of hiding.");
        } else {
            You("drop to the %s.", surface(game.u.ux, game.u.uy));
            if (is_pool_or_lava(game.u.ux, game.u.uy)) {
                pooleffects((0));
            } else {
                pickup(1);
                if ((trap = t_at(game.u.ux, game.u.uy)) != null) {
                    dotrap(trap, 16);
                }
            }
        }
        return 1;
    }
    if (u_stuck_cannot_go("down")) {
        return 1;
    }
    if (!stairs_down && !ladder_down) {
        trap = t_at(game.u.ux, game.u.uy);
        if (trap && (uteetering_at_seen_pit(trap) || uescaped_shaft(trap))) {
            dotrap(trap, 16);
            return 1;
        } else if (!trap || !((trap.ttyp) == HOLE || (trap.ttyp) == TRAPDOOR) || !Can_fall_thru(game.u.uz) || !trap.tseen) {
            if (game.flags.autodig && !game.context.nopick && game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp == P_PICK_AXE)) {
                return use_pick_axe2(game.uwep);
            } else {
                You_cant("go down here%s.", (trap && trap.ttyp == VIBRATING_SQUARE) ? " yet" : "");
                return 0;
            }
        }
    }
    if (on_level((game.dungeon_topology.d_valley_level), game.u.uz) && !game.u.uevent.gehennom_entered) {
        You("are standing at the gate to Gehennom.");
        pline("Unspeakable cruelty and harm lurk down there.");
        if (yn_function("Are you sure you want to enter?", ynchars, 110, (1)) != 121) {
            return 0;
        }
        pline("So be it.");
        game.u.uevent.gehennom_entered = 1;
    }
    if (!next_to_u()) {
        You("are held back by your pet!");
        return 0;
    }
    if (trap) {
        let down_or_thru = trap.ttyp == HOLE ? "down" : "through";
        let actn = u_locomotion("jump");
        if (game.youmonst.data.msize >= 4) {
            let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            You("don't fit %s easily.", down_or_thru);
            qbuf = sprintf(qbuf, "Try to squeeze %s?", down_or_thru);
            if (yn_function(qbuf, ynchars, 110, (1)) == 121) {
                if (!rn2(3)) {
                    actn = "manage to squeeze";
                    losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(4)) + 1) / 2)) : (rnd(4))), "contusion from a small passage", 1);
                } else {
                    You("were unable to fit %s.", down_or_thru);
                    return 0;
                }
            } else {
                return 0;
            }
        }
        You("%s %s the %s.", actn, down_or_thru, trap.ttyp == HOLE ? "hole" : "trap door");
    }
    if (trap && (((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
        await goto_hell((0), (1));
    } else if (trap && trap.dst.dlevel != -1) {
        let tdst = { dnum: 0, dlevel: 0 };
        assign_level(tdst, (trap.dst));
        clamp_hole_destination(tdst);
        await goto_level(tdst, (0), (0), (0));
    } else {
        game.at_ladder = (game.level.locations[game.u.ux][game.u.uy].typ == LADDER);
        await next_level(!trap);
        game.at_ladder = (0);
    }
    return 1;
}
/* the #up command - move up a staircase */
export async function doup() {
    let stway = stairway_at(game.u.ux, game.u.uy);
    set_move_cmd(DIR_UP, 0);
    if (u_rooted()) {
        return 1;
    }
    if (game.u.utrap && game.u.utraptype == TT_PIT) {
        /* "up" to get out of a pit... */
        climb_pit();
        return 1;
    }
    if (!stway || (stway && !stway.up)) {
        You_cant("go up here.");
        return 0;
    }
    if (stucksteed((1))) {
        return 0;
    }
    if (u_stuck_cannot_go("up")) {
        return 1;
    }
    if (near_capacity() > SLT_ENCUMBER) {
        /* No levitation check; inv_weight() already allows for it */
        Your("load is too heavy to climb the %s.", game.level.locations[game.u.ux][game.u.uy].typ == STAIRS ? "stairs" : "ladder");
        return 1;
    }
    if (ledger_no(game.u.uz) == 1) {
        if (game.iflags.debug_fuzzer) {
            return 0;
        }
        if (yn_function("Beware, there will be no return!  Still climb?", ynchars, 110, (1)) != 121) {
            return 0;
        }
    }
    if (!next_to_u()) {
        You("are held back by your pet!");
        return 0;
    }
    game.at_ladder = (game.level.locations[game.u.ux][game.u.uy].typ == LADDER);
    await prev_level((1));
    game.at_ladder = (0);
    return 1;
}
/* check that we can write out the current level */
export function currentlevel_rewrite() {
    let nhfp = null;
    let whynot = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    (game.windowprocs.win_mark_synch)();
    /* since level change might be a bit slow, flush any buffered screen
     *  output (like "you fall through a trap door") */
    nhfp = create_levelfile(ledger_no(game.u.uz), whynot);
    if (!nhfp) {
        pline("%s", whynot);
        /*
         * This is not quite impossible: e.g., we may have
         * exceeded our quota. If that is the case then we
         * cannot leave this level, and cannot save either.
         * Another possibility is that the directory was not
         * writable.
         */
        return null;
    }
    return nhfp;
}
export function save_currentstate() {
    let nhfp = null;
    game.program_state.in_checkpoint++;
    if (game.flags.ins_chkpt) {
        /* write out just-attained level, with pets and everything */
        /* (before we save/leave old level) */
        nhfp = currentlevel_rewrite();
        if (!nhfp) {
            return;
        }
        if (nhfp.structlevel) {
            bufon(nhfp.fd);
        }
        nhfp.mode = 2;
        savelev(nhfp, ledger_no(game.u.uz));
        close_nhfile(nhfp);
    }
    /* write out non-level state */
    savestateinlock();
    game.program_state.in_checkpoint--;
}
/*
static boolean
badspot(coordxy x, coordxy y)
{
    return (boolean) ((levl[x][y].typ != ROOM
                       && levl[x][y].typ != AIR
                       && levl[x][y].typ != CORR)
                      || MON_AT(x, y));
}
*/
/* when arriving on a level, if hero and a monster are trying to share same
   spot, move one; extracted from goto_level(); also used by wiz_makemap() */
export function u_collide_m(mtmp) {
    let cc = { x: 0, y: 0 };
    if (!mtmp || mtmp == game.u.usteed || mtmp != (game.level.monsters[game.u.ux][game.u.uy])) {
        impossible("level arrival collision: %s?", !mtmp ? "no monster" : (mtmp == game.u.usteed) ? "steed is on map" : "monster not co-located");
        return;
    }
    if (!rn2(2) && enexto(cc, game.u.ux, game.u.uy, game.youmonst.data) && (dist2(((cc.x)), ((cc.y)), game.u.ux, game.u.uy) <= 2)) {
        u_on_newpos(cc.x, cc.y);
    /* There's a monster at your target destination; it might be one
       which accompanied you--see mon_arrive(dogmove.c)--or perhaps
       it was already here.  Randomly move you to an adjacent spot
       or else the monster to any nearby location.  Prior to 3.3.0
       the latter was done unconditionally. */
    /*[maybe give message here?]*/
    } else {
        mnexto(mtmp, 4);
    }
    /* hero might be arriving at a spot containing a monster;
       if so, move one or the other to another location */
    if ((mtmp = (game.level.monsters[game.u.ux][game.u.uy])) != null) {
        /* there was an unconditional impossible("mnexto failed")
           here, but it's not impossible and we're prepared to cope
           with the situation, so only say something when debugging */
        if (game.flags.debug) {
            pline("(monster in hero's way)");
        }
        if (!rloc(mtmp, 4) || (mtmp = (game.level.monsters[game.u.ux][game.u.uy])) != null) {
            m_into_limbo(mtmp);
        }
    }
}
const __familiar_level_msg_fam_msgs = ["You have a sense of deja vu.", "You feel like you've been here before.", "This place %s familiar...", null];
const __familiar_level_msg_halu_fam_msgs = ["Whoa!  Everything %s different.", "You are surrounded by twisty little passages, all alike.", "Gee, this %s like uncle Conan's place...", null];
export function familiar_level_msg() {
    let mesg = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let which = rn2(4);
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        mesg = __familiar_level_msg_halu_fam_msgs[which];
    } else {
        mesg = __familiar_level_msg_fam_msgs[which];
    }
    if (mesg && strchr(mesg, 37)) {
        buf = sprintf(buf, mesg, !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "looks" : "seems");
        mesg = buf;
    }
    if (mesg) {
        pline("%s", mesg);
    }
}
/* destination */
/* True if arriving via stairs/ladder */
/* when falling to level, objects might tag along */
/* True if arriving via magic portal */
export async function goto_level(newlevel, at_stairs, falling, portal) {
    let l_idx = 0;
    let save_mode = 0;
    let nhfp = null;
    let new_ledger = 0;
    let cant_go_back = 0;
    let great_effort = 0;
    let up = (depth(newlevel) < depth(game.u.uz));
    let newdungeon = (game.u.uz.dnum != newlevel.dnum);
    let leaving_tutorial = (0);
    let was_in_W_tower = In_W_tower(game.u.ux, game.u.uy, game.u.uz);
    let familiar = (0);
    let new_ = (0);
    let mtmp = null;
    let whynot = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let dist = depth(newlevel) - depth(game.u.uz);
    let do_fall_dmg = (0);
    let prev_temperature = game.level.flags.temperature;
    if (dunlev(newlevel) > dunlevs_in_dungeon(newlevel)) {
        newlevel.dlevel = dunlevs_in_dungeon(newlevel);
    }
    if (newdungeon) {
        if (((newlevel).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
            if (!game.u.uhave.amulet) {
                return;
            }
            /* wizard ^V can bypass Earth level */
            if (!game.flags.debug) {
                assign_level(newlevel, (game.dungeon_topology.d_earth_level));
            }
        } else if (((newlevel).dnum == (game.dungeon_topology.d_tutorial_dnum))) {
            tutorial((1));
        } else if (((game.u.uz).dnum == (game.dungeon_topology.d_tutorial_dnum))) {
            tutorial((0));
            /* re-enter level 1 as if starting new game */
            up = (0);
            leaving_tutorial = (1);
        }
    }
    new_ledger = ledger_no(newlevel);
    if (new_ledger <= 0) {
        done(ESCAPED);
    }
    if (In_hell(game.u.uz) && up && game.u.uhave.amulet && !newdungeon && !portal && (dunlev(game.u.uz) < dunlevs_in_dungeon(game.u.uz) - 3)) {
        if (!rn2(4 + game.context.mysteryforce)) {
            /* in fact < 0 is impossible */
            /* If you have the amulet and are trying to get out of Gehennom,
     * going up a set of stairs sometimes does some very strange things!
     * Biased against law and towards chaos.  (The chance to be sent
     * down multiple levels when attempting to go up are significantly
     * less than the corresponding comment in older versions indicated
     * due to overlooking the effect of the call to assign_rnd_lvl().)
     *
     * Odds for making it to the next level up, or of being sent down:
     *  "up"    L      N      C
     *   +1   75.0   75.0   75.0
     *    0    6.25   8.33  12.5
     *   -1   11.46  12.50  12.5
     *   -2    5.21   4.17   0.0
     *   -3    2.08   0.0    0.0
     *
     * 5.0.0: the chance for the "mysterious force" to kick in goes down
     * as it kicks in, starting at 25% per climb attempt and dropping off
     * gradually but substantially.  The drop off is greater when hero is
     * sent down farther so benefits lawfuls more than chaotics this time.
     */
            let odds = 3 + game.u.ualign.type;
            let diff = (odds <= 1) ? 0 : rn2(odds);
            if (diff != 0) {
                assign_rnd_level(newlevel, game.u.uz, diff);
                /* assign_rnd_level() may have used a value less than diff */
                diff = newlevel.dlevel - game.u.uz.dlevel;
                /* if inside the tower, stay inside */
                if (was_in_W_tower && !On_W_tower_level(newlevel)) {
                    diff = 0;
                }
            }
            if (diff == 0) {
                assign_level(newlevel, game.u.uz);
            }
            pline("A mysterious force momentarily surrounds you...");
            /* each time it kicks in, the chance of doing so again may drop;
               that drops faster, on average, when being sent down farther so
               while the impact is reduced for everybody compared to earlier
               versions, it is reduced least for chaotics, most for lawfuls */
            game.context.mysteryforce += rn2(diff + 2);
            if (on_level(newlevel, game.u.uz)) {
                safe_teleds(0);
                next_to_u();
                return;
            }
            new_ledger = ledger_no(newlevel);
            at_stairs = game.at_ladder = (0);
        }
    }
    if (on_level(game.u.uz, (game.dungeon_topology.d_qstart_level)) && !newdungeon && !ok_to_quest()) {
        /* Prevent the player from going past the first quest level unless
     * (s)he has been given the go-ahead by the leader.
     */
        pline("A mysterious force prevents you from descending.");
        return;
    }
    if (on_level(newlevel, game.u.uz)) {
        return;
    }
    if (game.luacore && game.nhcb_counts[NHCB_LVL_LEAVE]) {
        lua_getglobal(game.luacore, "nh_callback_run");
        lua_pushstring(game.luacore, nhcb_name[NHCB_LVL_LEAVE]);
        nhl_pcall_handle(game.luacore, 1, 0, "goto_level", NHLpa_panic);
        lua_settop(game.luacore, 0);
    }
    /* tethered movement makes level change while trapped feasible */
    if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
        buried_ball_to_punishment();
    }
    nhfp = currentlevel_rewrite();
    if (!nhfp) {
        return;
    }
    /* discard context which applies to the level we're leaving;
       for lock-picking, container may be carried, in which case we
       keep context; if on the floor, it's about to be saved+freed and
       maybe_reset_pick() needs to do its carried() check before that */
    maybe_reset_pick(null);
    /* even if to-be-armed trap obj is accompanying hero */
    reset_trapset();
    /* travel destination cache */
    game.iflags.travelcc.x = game.iflags.travelcc.y = 0;
    game.context.polearm.hitmon = null;
    /* digging context is level-aware and can actually be resumed if
       hero returns to the previous level without any intervening dig */
    /* assuming this is only trap door or hole */
    if (falling) {
        impact_drop(null, game.u.ux, game.u.uy, newlevel.dlevel);
    }
    /* probably was a trap door */
    check_special_room((1));
    if ((game.uball != null)) {
        unplacebc();
    }
    reset_utrap((0));
    fill_pit(game.u.ux, game.u.uy);
    set_ustuck(null);
    set_uinwater(0);
    game.u.uundetected = 0;
    if (!game.iflags.nofollowers) {
        keepdogs((0));
    }
    /* recalculate map overview before we leave the level */
    recalc_mapseen();
    /*
     *  We no longer see anything on the level.  Make sure that this
     *  follows u.uswallow set to null since uswallow overrides all
     *  normal vision.
     */
    vision_recalc(2);
    /*
     * Save the level we're leaving.  If we're entering the endgame,
     * we can get rid of all existing levels because they cannot be
     * reached any more.  We still need to use savelev()'s cleanup
     * for the level being left, to recover dynamic memory in use and
     * to avoid dangling timers and light sources.
     */
    cant_go_back = ((newdungeon && ((newlevel).dnum == (game.dungeon_topology.d_astral_level).dnum)) || leaving_tutorial);
    if (!cant_go_back) {
        /* current monsters are becoming inactive */
        update_mlstmv();
        if (nhfp.structlevel) {
            bufon(nhfp.fd);
        }
    } else {
        free_luathemes(leaving_tutorial ? tut_themes : most_themes);
    }
    save_mode = nhfp.mode;
    nhfp.mode = cant_go_back ? 4 : (2 | 4);
    savelev(nhfp, ledger_no(game.u.uz));
    nhfp.mode = save_mode;
    close_nhfile(nhfp);
    if (cant_go_back) {
        /* discard unreachable levels; keep #0 */
        for (l_idx = maxledgerno(); l_idx > 0; --l_idx) {
            if (!leaving_tutorial || ledger_to_dnum(l_idx) == (game.dungeon_topology.d_tutorial_dnum)) {
                delete_levelfile(l_idx);
            }
        }
        /* mark #overview data for all dungeon branches as uninteresting */
        for (l_idx = 0; l_idx < game.n_dgns; ++l_idx) {
            if (!leaving_tutorial || l_idx == (game.dungeon_topology.d_tutorial_dnum)) {
                remdun_mapseen(l_idx);
            }
        }
        /* get rid of mons & objs scheduled to migrate to discarded levels */
        discard_migrations();
    }
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(newlevel, (game.dungeon_topology.d_rogue_level)))) || (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        assign_graphics((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(newlevel, (game.dungeon_topology.d_rogue_level)))) ? ROGUESET : PRIMARYSET);
    }
    check_gold_symbol();
    /* record this level transition as a potential seen branch unless using
     * some non-standard means of transportation (level teleport).
     */
    if ((at_stairs || falling || portal) && (game.u.uz.dnum != newlevel.dnum)) {
        recbranch_mapseen(game.u.uz, newlevel);
    }
    assign_level(game.u.uz0, game.u.uz);
    assign_level(game.u.uz, newlevel);
    assign_level(game.u.utolev, newlevel);
    /* our caller keys off of this */
    game.u.utotype = UTOTYPE_NONE;
    if (!builds_up(game.u.uz)) {
        if (dunlev(game.u.uz) > (game.dungeons[(game.u.uz).dnum].dunlev_ureached)) {
            (game.dungeons[(game.u.uz).dnum].dunlev_ureached) = dunlev(game.u.uz);
        }
    } else {
        if ((game.dungeons[(game.u.uz).dnum].dunlev_ureached) == 0 || dunlev(game.u.uz) < (game.dungeons[(game.u.uz).dnum].dunlev_ureached)) {
            (game.dungeons[(game.u.uz).dnum].dunlev_ureached) = dunlev(game.u.uz);
        }
    }
    stairway_free_all();
    /* set default level change destination areas */
    /* the special level code may override these */
    memset(game.updest, 0, 1 /* sizeof(dest_area) */);
    memset(game.dndest, 0, 1 /* sizeof(dest_area) */);
    if (!(game.level_info[new_ledger].flags & 4)) {
        if (game.level_info[new_ledger].flags & (1)) {
            /* entering this level for first time; make it now */
            impossible("goto_level: returning to discarded level?");
            game.level_info[new_ledger].flags &= ~(1);
        }
        await mklev();
        new_ = (1);
        familiar = bones_include_name(game.plname);
    } else {
        /* returning to previously visited level; reload it */
        nhfp = open_levelfile(new_ledger, whynot);
        if (tricked_fileremoved(nhfp, whynot)) {
            /* we'll reach here if running in wizard mode */
            error("Cannot continue this game.");
        }
        reseed_random(rn2);
        reseed_random(rn2_on_display_rng);
        getlev(nhfp, game.hackpid, new_ledger);
        close_nhfile(nhfp);
        /* reassign level dependent obj probabilities */
        oinit();
    }
    reglyph_darkroom();
    set_uinwater(0);
    /* do this prior to level-change pline messages */
    /* clear old level's line-of-sight */
    vision_reset();
    /* don't let that reenable vision yet */
    game.vision_full_recalc = 0;
    /* ensure all map flushes are postponed */
    flush_screen(-1);
    if (portal && !((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        /* find the portal on the new level */
        let ttrap = null;
        for (ttrap = game.ftrap; ttrap; ttrap = ttrap.ntrap) {
            if (ttrap.ttyp == MAGIC_PORTAL) {
                break;
            }
        }
        if (!ttrap) {
            if (game.u.uevent.qexpelled && ((((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz0, (game.dungeon_topology.d_qstart_level)))) || (((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level)))))) {
                /* we're coming back from or going into the quest home level,
                   after already getting expelled once. The portal back
                   doesn't exist anymore - see expulsion(). */
                u_on_rndspot(0);
            } else {
                if (!game.iflags.debug_fuzzer) {
                    impossible("goto_level: no corresponding portal!");
                }
                u_on_rndspot(0);
            }
        } else {
            seetrap(ttrap);
            u_on_newpos(ttrap.tx, ttrap.ty);
        }
    } else if (at_stairs && !((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        if (up) {
            let stway = stairway_find_from(game.u.uz0, game.at_ladder);
            if (stway) {
                u_on_newpos(stway.sx, stway.sy);
                stway.u_traversed = (1);
            } else if (newdungeon) {
                u_on_sstairs(1);
            } else {
                u_on_dnstairs();
            }
            /* you climb up the {stairs|ladder};
               fly up the stairs; fly up along the ladder */
            great_effort = ((game.uball != null) && !((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked));
            if (game.flags.verbose || great_effort) {
                pline("%s %s up%s the %s.", great_effort ? "With great effort, you" : "You", u_locomotion("climb"), (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && game.at_ladder) ? " along" : "", game.at_ladder ? "ladder" : "stairs");
            }
        } else {
            let stway = stairway_find_from(game.u.uz0, game.at_ladder);
            if (stway) {
                u_on_newpos(stway.sx, stway.sy);
                stway.u_traversed = (1);
            } else if (newdungeon) {
                u_on_sstairs(0);
            } else {
                u_on_upstairs();
            }
            if (!game.u.dz) {
                ;
            } else if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
                /* stayed on same level? (no transit effects) */
                if (game.flags.verbose) {
                    You("fly down %s.", game.at_ladder ? "along the ladder" : "the stairs");
                }
            } else if (near_capacity() > UNENCUMBERED || (game.uball != null) || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) {
                You("fall down the %s.", game.at_ladder ? "ladder" : "stairs");
                if ((game.uball != null)) {
                    drag_down();
                    if (!welded(game.uball)) {
                        ballrelease((0));
                    }
                }
                if (game.u.usteed) {
                    dismount_steed(DISMOUNT_FELL);
                /* falling off steed has its own losehp() call */
                } else {
                    losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(3)) + 1) / 2)) : (rnd(3))), game.at_ladder ? "falling off a ladder" : "tumbling down a flight of stairs", 1);
                }
                selftouch("Falling, you");
            } else {
                if (game.flags.verbose) {
                    You("%s.", game.at_ladder ? "climb down the ladder" : "descend the stairs");
                }
            }
        }
    } else {
        /* trap door or level_tele or In_endgame */
        u_on_rndspot((up ? 1 : 0) | (was_in_W_tower ? 2 : 0));
        if (falling) {
            if ((game.uball != null) && !welded(game.uball)) {
                ballfall();
            }
            selftouch("Falling, you");
            do_fall_dmg = (1);
        }
    }
    if ((game.uball != null)) {
        placebc();
    }
    obj_delivery((0));
    losedogs();
    /* for those wiped out while in limbo */
    kill_genocided_monsters();
    /*
     * Expire all timers that have gone off while away.  Must be
     * after migrating monsters and objects are delivered
     * (losedogs and obj_delivery).
     */
    run_timers();
    if ((mtmp = (game.level.monsters[game.u.ux][game.u.uy])) != null) {
        u_collide_m(mtmp);
    }
    /* initial movement of bubbles just before vision_recalc */
    if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        movebubbles();
    } else if (game.level.flags.fumaroles) {
        fumaroles();
    }
    vision_reset();
    reset_glyphmap(gm_levelchange);
    do {
        game.a11y.mon_notices_blocked++;
    } while (0);
    docrt();
    flush_screen(-1);
    /*
     *  Move all plines beyond the screen reset.
     */
    /* deferred arrival message for level teleport looks odd if given
       after the various messages below, so give it before them;
       [it might have already been delivered via docrt() -> see_monsters()
       -> Sting_effects() -> maybe_lvltport_feedback(), in which case
       'dfr_post_msg' has already been reset to Null];
       if 'dfr_post_msg' is "you materialize on a different level" then
       maybe_lvltport_feedback() will deliver it now and then free it */
    if (game.dfr_post_msg) {
        maybe_lvltport_feedback();
    }
    /* potentially called by Sting_effects() */
    /* special levels can have a custom arrival message */
    deliver_splev_message();
    if (!In_hell(game.u.uz0) && In_hell(game.u.uz)) {
        if ((((((game.dungeon_topology.d_valley_level)).dlevel || ((game.dungeon_topology.d_valley_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_valley_level))))) {
            /* Check whether we just entered Gehennom. */
            You("arrive at the Valley of the Dead...");
            pline_The("odor of burnt flesh and decay pervades the air.");
            ;
            You_hear("groans and moans everywhere.");
        }
        record_achievement(ACH_HELL);
    }
    /* in case we've managed to bypass the Valley's stairway down */
    if (In_hell(game.u.uz) && !(((((game.dungeon_topology.d_valley_level)).dlevel || ((game.dungeon_topology.d_valley_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_valley_level))))) {
        game.u.uevent.gehennom_entered = 1;
    }
    if (familiar) {
        familiar_level_msg();
    }
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        /* special location arrival messages/events */
        if (newdungeon) {
            record_achievement(ACH_ENDG);
        }
        if (new_ && on_level(game.u.uz, (game.dungeon_topology.d_astral_level))) {
            final_level();
            record_achievement(ACH_ASTR);
        } else if (newdungeon && game.u.uhave.amulet) {
            /* force confrontation with Wizard */
            resurrect();
        }
    } else if (In_quest(game.u.uz)) {
        /* might be reaching locate|goal level */
        onquest();
    } else if ((((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level))))) {
        if (new_ || !game.mvitals[PM_CROESUS].died) {
            /* alarm stops working once Croesus has died */
            You("have penetrated a high security area!");
            ;
            pline("An alarm sounds!");
            for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
                if (((mtmp).mhp < 1)) {
                    continue;
                }
                mtmp.msleeping = 0;
            }
        }
    } else if (In_mines(game.u.uz)) {
        if (newdungeon) {
            record_achievement(ACH_MINE);
        }
    } else if (((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum))) {
        if (newdungeon) {
            record_achievement(ACH_SOKO);
        }
    } else {
        if (new_ && (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
            You("enter what seems to be an older, more primitive world.");
        } else if (new_ && (((((game.dungeon_topology.d_bigroom_level)).dlevel || ((game.dungeon_topology.d_bigroom_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_bigroom_level))))) {
            record_achievement(ACH_BGRM);
        }
        if (!In_quest(game.u.uz0) && at_dgn_entrance("The Quest") && !(game.u.uevent.qcompleted || game.u.uevent.qexpelled || game.quest_status.leader_is_dead)) {
            if (!game.u.uevent.qcalled) {
                /* main dungeon message from your quest leader */
                /* [TODO: copy of same TODO below; if an achievement for
               receiving quest call from leader gets added, that should
               come after logging new level entry] */
                game.u.uevent.qcalled = 1;
                /* main "leader needs help" message */
                com_pager("quest_portal");
            } else {
                com_pager((game.urole.mnum == (PM_ROGUE)) ? "quest_portal_demand" : "quest_portal_again");
            }
        }
    }
    temperature_change_msg(prev_temperature);
    if (new_) {
        /* this was originally done earlier; moved here to be logged after
       any achievement related to entering a dungeon branch
       [TODO: if an achievement for receiving quest call from leader
       gets added, that should come after this rather than take place
       where the message is delivered above] */
        let dloc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        /* Astral is excluded as a major event here because entry to it
           is already one such due to that being an achievement;
           for the quest, listing the start, locate, and goal levels would
           seem reasonable but all quest levels are included for simplicity--
           level 2 (or 3 if hero level teleports after obtaining permission
           to enter) is useful to show since it indicates that hero has
           actually entered the quest rather than just received permission
           to do so, and listing the goal level could be used to figure out
           whether level 5 is the end or there's another level (ESP reveals
           the same thing, but is part of normal game play as opposed to
           #chronicle leaking information that hero hasn't discovered yet) */
        let major = ((((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && !(((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level))))) || In_quest(game.u.uz));
        describe_level(dloc, 2);
        livelog_printf(major ? 2 : 32768, "entered %s", dloc);
        if ((game.urole.mnum == (PM_TOURIST))) {
            more_experienced(level_difficulty(), 0);
            newexplevel();
        }
    }
    assign_level(game.u.uz0, game.u.uz);
    save_currentstate();
    do {
        if (--game.a11y.mon_notices_blocked < 0) {
            impossible("mon_notices_blocked<0");
            game.a11y.mon_notices_blocked = 0;
        }
    } while (0);
    notice_all_mons((1));
    print_level_annotation();
    /* give room entrance message, if any */
    check_special_room((0));
    /* deliver objects traveling with player */
    obj_delivery((1));
    /* assume this will always return TRUE when changing level */
    in_out_region(game.u.ux, game.u.uy);
    /* shop repair is normally done when shopkeepers move, but we may
       need to catch up for lost time here; do this before maybe dying
       so bones map will include it */
    if (!new_) {
        fix_shop_damage();
    }
    if (do_fall_dmg) {
        let dmg = d(((dist) > (1) ? (dist) : (1)), 6);
        dmg = (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg));
        losehp(dmg, "falling down a mine shaft", 1);
    }
    pickup(1);
    return;
}
/* give a message when entering a Gehennom level other than the Valley;
   also given if restoring a game in that situation */
export function hellish_smoke_mesg() {
    if (game.level.flags.temperature) {
        pline("It is %s here.", game.level.flags.temperature > 0 ? "hot" : "cold");
    }
    if (In_hell(game.u.uz) && game.level.flags.temperature > 0) {
        You("%s smoke...", olfaction(game.youmonst.data) ? "smell" : "sense");
    }
}
/* give a message when the level temperature is different from previous */
export function temperature_change_msg(prev_temperature) {
    if (prev_temperature != game.level.flags.temperature) {
        if (game.level.flags.temperature) {
            hellish_smoke_mesg();
        } else if (prev_temperature > 0) {
            pline_The("heat %s gone.", In_hell(game.u.uz0) ? "and smoke are" : "is");
        } else if (prev_temperature < 0) {
            You("are out of the cold.");
        }
    }
}
/* usually called from goto_level(); might be called from Sting_effects() */
export function maybe_lvltport_feedback() {
    if (game.dfr_post_msg && !strncmpi(game.dfr_post_msg, "You materialize", 15)) {
        /* "You materialize on a different level." */
        pline("%s", game.dfr_post_msg);
        free(game.dfr_post_msg) , game.dfr_post_msg = null;
    }
}
export function final_level() {
    /* reset monster hostility relative to player */
    iter_mons(reset_hostility);
    /* create some player-monsters */
    create_mplayers((rn2(4) + (3)), (1));
    /* create a guardian angel next to player, if worthy */
    gain_guardian_angel();
}
/* change levels at the end of this turn, after monsters finish moving */
export function schedule_goto(tolev, utotype_flags, pre_msg, post_msg) {
    /* UTOTYPE_DEFERRED is used, so UTOTYPE_NONE can trigger deferred_goto() */
    game.u.utotype = utotype_flags | UTOTYPE_DEFERRED;
    assign_level(game.u.utolev, tolev);
    if (pre_msg) {
        game.dfr_pre_msg = dupstr(pre_msg);
    }
    if (post_msg) {
        game.dfr_post_msg = dupstr(post_msg);
    }
}
/* handle something like portal ejection */
export async function deferred_goto() {
    if (!on_level(game.u.uz, game.u.utolev)) {
        let dest = { dnum: 0, dlevel: 0 };
        let oldlev = { dnum: 0, dlevel: 0 };
        /* save it; goto_level zeroes u.utotype */
        let typmask = game.u.utotype;
        assign_level(dest, game.u.utolev);
        assign_level(oldlev, game.u.uz);
        if (game.dfr_pre_msg) {
            pline("%s", game.dfr_pre_msg);
        }
        await goto_level(dest, !!(typmask & UTOTYPE_ATSTAIRS), !!(typmask & UTOTYPE_FALLING), !!(typmask & UTOTYPE_PORTAL));
        if (typmask & UTOTYPE_RMPORTAL) {
            let t = t_at(game.u.ux, game.u.uy);
            if (t) {
                deltrap(t);
                newsym(game.u.ux, game.u.uy);
            }
        }
        if (game.dfr_post_msg && !on_level(game.u.uz, oldlev)) {
            pline("%s", game.dfr_post_msg);
        }
    }
    game.u.utotype = UTOTYPE_NONE;
    if (game.dfr_pre_msg) {
        free(game.dfr_pre_msg) , game.dfr_pre_msg = null;
    }
    if (game.dfr_post_msg) {
        free(game.dfr_post_msg) , game.dfr_post_msg = null;
    }
}
/*
 * Return TRUE if we created a monster for the corpse.  If successful, the
 * corpse is gone.
 */
export function revive_corpse(corpse) {
    let mtmp = null;
    let mcarry = null;
    let is_uwep = 0;
    let chewed = 0;
    let where = 0;
    let cname = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let container = null;
    let container_where = 0;
    let montype = 0;
    let is_zomb = 0;
    let corpsex = 0;
    let corpsey = 0;
    where = corpse.where;
    montype = corpse.corpsenm;
    /* treat buried auto-reviver (troll, Rider?) like a zombie
       so that it can dig itself out of the ground if it revives */
    is_zomb = (game.mons[montype].mlet == S_ZOMBIE || (where == 6 && (((game.mons[montype]) == game.mons[PM_DEATH] || (game.mons[montype]) == game.mons[PM_FAMINE] || (game.mons[montype]) == game.mons[PM_PESTILENCE]) || (game.mons[montype]).mlet == S_TROLL)));
    is_uwep = (corpse == game.uwep);
    chewed = (corpse.oeaten != 0);
    cname = strcpy(cname, corpse_xname(corpse, chewed ? "bite-covered" : null, 1));
    mcarry = (where == 4) ? corpse.v.v_ocarry : null;
    /* mcarry is NULL for (where == OBJ_BURIED and OBJ_CONTAINED) now */
    get_obj_location(corpse, { get value() { return corpsex; }, set value(_v) { corpsex = _v; } }, { get value() { return corpsey; }, set value(_v) { corpsey = _v; } }, 1 | 2);
    if (where == 2) {
        let mtmp2 = null;
        container = corpse.v.v_ocontainer;
        mtmp2 = get_container_location(container, { get value() { return container_where; }, set value(_v) { container_where = _v; } }, null);
        /* container_where is outermost container's location even if nested */
        if (container_where == 4 && mtmp2) {
            mcarry = mtmp2;
        }
    }
    /* corpse is gone if successful */
    mtmp = revive(corpse, (0));
    if (mtmp) {
        switch (where) {
            case 3:
                if (is_uwep) {
                    pline_The("%s writhes out of your grasp!", cname);
                } else {
                    You_feel("squirming in your backpack!");
                }
                break;
            case 1:
                if (((game.viz_array[corpsey][corpsex] & 2) != 0) || canseemon(mtmp)) {
                    let effect = "";
                    if (mtmp.data == game.mons[PM_DEATH]) {
                        effect = " in a whirl of spectral skulls";
                    } else if (mtmp.data == game.mons[PM_PESTILENCE]) {
                        effect = " in a churning pillar of flies";
                    } else if (mtmp.data == game.mons[PM_FAMINE]) {
                        effect = " in a ring of withered crops";
                    }
                    if (canseemon(mtmp)) {
                        pline("%s rises from the dead%s!", chewed ? Adjmonnam(mtmp, "bite-covered") : Monnam(mtmp), effect);
                    } else {
                        pline("%s disappears%s!", The(cname), effect);
                    }
                }
                break;
            case 4:
                if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                    if (mcarry && canseemon(mcarry)) {
                        pline("Startled, %s drops %s as it %s!", mon_nam(mcarry), an(cname), (canseemon(mtmp) || sensemon(mtmp)) ? "revives" : "disappears");
                    } else if ((canseemon(mtmp) || sensemon(mtmp))) {
                        pline("%s suddenly appears!", chewed ? Adjmonnam(mtmp, "bite-covered") : Monnam(mtmp));
                    }
                }
                break;
            case 2:
{
                    let sackname = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    /* Could use x_monnam(..., AUGMENT_IT) but that'd say "someone"
               for humanoid monsters, which seems like a distinction the hero
               doesn't have knowledge to make here. */
                    let mnam = (canseemon(mtmp) || sensemon(mtmp)) ? Amonnam(mtmp) : c_common_strings.c_Something;
                    if (!container) {
                        impossible("reviving corpse from non-existent container");
                    } else if (mcarry && canseemon(mcarry)) {
                        pline("%s writhes out of %s!", mnam, yname(container));
                    } else if (container_where == 3) {
                        sackname = strcpy(sackname, an(xname(container)));
                        pline("%s %s out of %s in your pack!", mnam, locomotion(mtmp.data, "writhes"), sackname);
                    } else if (container_where == 1 && ((game.viz_array[corpsey][corpsex] & 2) != 0)) {
                        sackname = strcpy(sackname, an(xname(container)));
                        pline("%s escapes from %s!", mnam, sackname);
                    }
                    break;
                }
            case 6:
                if (is_zomb) {
                    maketrap(mtmp.mx, mtmp.my, PIT);
                    if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                        let ttmp = null;
                        ttmp = t_at(mtmp.mx, mtmp.my);
                        if (ttmp) {
                            ttmp.tseen = (1);
                        }
                        pline("%s claws itself out of the ground!", (canseemon(mtmp) || sensemon(mtmp)) ? Amonnam(mtmp) : c_common_strings.c_Something);
                        newsym(mtmp.mx, mtmp.my);
                    } else if (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) < 5 * 5) {
                        ;
                        You_hear("scratching noises.");
                    }
                    fill_pit(mtmp.mx, mtmp.my);
                    break;
                }
                ;
            default:
                impossible("revive_corpse: lost corpse @ %d", where);
                break;
        }
        return (1);
    }
    return (0);
}
/* Revive the corpse via a timeout. */
/*ARGSUSED*/
export function revive_mon(arg, timeout) {
    let body = arg.a_obj;
    let mptr = game.mons[body.corpsenm];
    let mtmp = null;
    let x = 0;
    let y = 0;
    if ((((mptr).mflags3 & 1024) != 0) && body.where == 1 && get_obj_location(body, { get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } }, 0) && (mtmp = (game.level.monsters[x][y])) != null && game.level.flags.stasis_until < game.moves) {
        /* corpse will revive somewhere else if there is a monster in the way;
       Riders get a chance to try to bump the obstacle out of their way */
        let notice_it = canseemon(mtmp);
        let monname = Monnam(mtmp);
        if (rloc(mtmp, 4)) {
            if (notice_it && !canseemon(mtmp)) {
                pline("%s vanishes.", monname);
            } else if (!notice_it && canseemon(mtmp)) {
                pline("%s appears.", Monnam(mtmp));
            } else if (notice_it && dist2(mtmp.mx, mtmp.my, x, y) > 2) {
                pline("%s teleports.", monname);
            }
        }
    }
    if (!revive_corpse(body)) {
        /* if we succeed, the corpse is gone */
        let when = 0;
        let action = 0;
        if (((mptr) == game.mons[PM_DEATH] || (mptr) == game.mons[PM_FAMINE] || (mptr) == game.mons[PM_PESTILENCE]) && rn2(99)) {
            /* Rider usually tries again */
            action = REVIVE_MON;
            when = rider_revival_time(body, (1));
        } else {
            if (!obj_has_timer(body, ROT_CORPSE)) {
                You_feel("%sless hassled.", ((mptr) == game.mons[PM_DEATH] || (mptr) == game.mons[PM_FAMINE] || (mptr) == game.mons[PM_PESTILENCE]) ? "much " : "");
            }
            action = ROT_CORPSE;
            when = d(5, 50) - (game.moves - body.age);
            if (when < 1) {
                when = 1;
            }
        }
        if (!obj_has_timer(body, action)) {
            start_timer(when, TIMER_OBJECT, action, arg);
        }
    }
}
/* Timeout callback. Revive the corpse as a zombie. */
export function zombify_mon(arg, timeout) {
    let body = arg.a_obj;
    let zmon = zombie_form(game.mons[body.corpsenm]);
    if (zmon != NON_PM && !(game.mvitals[zmon].mvflags & 2)) {
        if (((body).oextra && ((body).oextra.omid))) {
            free_omid(body);
        }
        if (((body).oextra && ((body).oextra.omonst))) {
            free_omonst(body);
        }
        set_corpsenm(body, zmon);
        revive_mon(arg, timeout);
    } else {
        rot_corpse(arg, timeout);
    }
}
/* return TRUE if hero properties are dangerous to hero */
export function danger_uprops() {
    return (game.u.uprops[STONED].intrinsic || game.u.uprops[SLIMED].intrinsic || game.u.uprops[STRANGLED].intrinsic || game.u.uprops[SICK].intrinsic);
}
export function cmd_safety_prevention(ucverb, cmddesc, act, flagcounter) {
    if (game.flags.safe_wait && !game.iflags.menu_requested && !game.multi) {
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        buf[0] = 0;
        if (game.iflags.cmdassist || !(flagcounter.value)++) {
            buf = sprintf(buf, "  Use '%s' prefix to force %s.", visctrl(cmd_from_func(do_reqmenu)), cmddesc);
        }
        if (monster_nearby()) {
            Norep("%s%s", act, buf);
            return (1);
        } else if (danger_uprops()) {
            Norep("%s doesn't feel like a good idea right now.", ucverb);
            return (1);
        }
    }
    flagcounter.value = 0;
    return (0);
}
/* '.' command: do nothing == rest; also the
   ' ' command iff 'rest_on_space' option is On */
export function donull() {
    if (cmd_safety_prevention("Waiting", "a no-op (to rest)", "Are you waiting to get hit?", { get value() { return game.did_nothing_flag; }, set value(_v) { game.did_nothing_flag = _v; } })) {
        return 0;
    }
    return 1;
}
export function wipeoff() {
    let udelta = game.u.ucreamed;
    let ldelta = (game.u.uprops[BLINDED].intrinsic & 16777215);
    if (udelta > 4) {
        udelta = 4;
    }
    /*u.ucreamed -= min(u.ucreamed,4);*/
    game.u.ucreamed -= udelta;
    if (ldelta > 4) {
        ldelta = 4;
    }
    /*HBlinded -= min(BlindedTimeout,4L);*/
    incr_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, -ldelta);
    if (!game.u.uprops[BLINDED].intrinsic) {
        pline("You've got the glop off.");
        game.u.ucreamed = 0;
        if (!gulp_blnd_check()) {
            set_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, 1);
            make_blinded(0, (1));
        }
        return 0;
    } else if (!game.u.ucreamed) {
        Your("%s feels clean now.", body_part(FACE));
        return 0;
    }
    return 1;
}
/* the #wipe command - wipe off your face */
let __dowipe_buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function dowipe() {
    if (game.u.ucreamed) {
        __dowipe_buf = sprintf(__dowipe_buf, "wiping off your %s", body_part(FACE));
        set_occupation(wipeoff, __dowipe_buf, 0);
        return 1;
    }
    Your("%s is already clean.", body_part(FACE));
    return 1;
}
/* common wounded legs feedback */
/* jumping, kicking, riding */
export function legs_in_no_shape(for_what, by_steed) {
    if (by_steed && game.u.usteed) {
        pline("%s is in no shape for %s.", Monnam(game.u.usteed), for_what);
    } else {
        let wl = (game.u.uprops[WOUNDED_LEGS].extrinsic & (131072 | 262144));
        let bp = body_part(LEG);
        if (wl == (131072 | 262144)) {
            bp = makeplural(bp);
        }
        Your("%s%s %s in no shape for %s.", (wl == 131072) ? "left " : (wl == 262144) ? "right " : "", bp, (wl == (131072 | 262144)) ? "are" : "is", for_what);
    }
}
export function set_wounded_legs(side, timex) {
    /* KMH -- STEED
     * If you are riding, your steed gets the wounded legs instead.
     * You still call this function, but don't lose hp.
     * Caller is also responsible for adjusting messages.
     */
    game.disp.botl = (1);
    if (!(game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) {
        (game.u.atemp.a[A_DEX])--;
    }
    if (!(game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) || (game.u.uprops[WOUNDED_LEGS].intrinsic & 16777215) < timex) {
        set_itimeout({ get value() { return game.u.uprops[WOUNDED_LEGS].intrinsic; }, set value(_v) { game.u.uprops[WOUNDED_LEGS].intrinsic = _v; } }, timex);
    }
    game.u.uprops[WOUNDED_LEGS].extrinsic |= side;
    encumber_msg();
}
/* 0: ordinary, 1: dismounting steed, 2: limbs turn to stone */
export function heal_legs(how) {
    if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) {
        game.disp.botl = (1);
        if ((game.u.atemp.a[A_DEX]) < 0) {
            (game.u.atemp.a[A_DEX])++;
        }
        if (!game.u.usteed && how != 2) {
            /* when mounted, wounded legs applies to the steed;
           during petrification countdown, "your limbs turn to stone"
           before the final stages and that calls us (how==2) to cure
           wounded legs, but we want to suppress the feel better message */
            let legs = body_part(LEG);
            if ((game.u.uprops[WOUNDED_LEGS].extrinsic & (131072 | 262144)) == (131072 | 262144)) {
                legs = makeplural(legs);
            }
            /* this used to say "somewhat better" but that was
               misleading since legs are being fully healed */
            Your("%s %s better.", legs, vtense(legs, "feel"));
        }
        game.u.uprops[WOUNDED_LEGS].intrinsic = game.u.uprops[WOUNDED_LEGS].extrinsic = 0;
        /* Wounded_legs reduces carrying capacity, so we want
           an encumbrance check when they're healed.  However,
           while dismounting, first steed's legs get healed,
           then hero is dropped to floor and a new encumbrance
           check is made [in dismount_steed()].  So don't give
           encumbrance feedback during the dismount stage
           because it could seem to be shown out of order and
           it might be immediately contradicted [able to carry
           more when steed becomes healthy, then possible floor
           feedback, then able to carry less when back on foot]. */
        if (how == 0) {
            encumber_msg();
        }
    }
}
/*do.c*/
/* ok to bypass set_bknown() */
/* Not the same as aggravate monster; besides, it's obvious. */
/* no room to move it; send it away, to return later */
/* we should be able to handle the other cases... */
