/* NetHack 5.0	dig.c	$NHDT-Date: 1740629713 2025/02/26 20:15:13 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.227 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Michael Allison, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { __nh_char_at0, strcat, strcpy } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { doapply, next_to_u, o_unleash } from './apply.js';
import { acurr, acurrstr, adjalign, exercise } from './attrib.js';
import { cmd_from_dir, cmdq_add_ec, cmdq_add_key, confdir, dxdy_moveok, getdir, isok, movecmd, set_occupation, xytodir } from './cmd.js';
import { destroy_drawbridge, find_drawbridge, is_db_wall, is_drawbridge_wall, is_ice, is_lava, is_moat, is_pool, is_pool_or_lava } from './dbridge.js';
import { xdir, ydir } from './decl.js';
import { cvt_sdoor_to_door } from './detect.js';
import { canseemon, feel_newsym, flush_screen, newsym, tmp_at } from './display.js';
import { dropx, goto_level, set_wounded_legs } from './do.js';
import { Monnam, hliquid, mon_nam } from './do_name.js';
import { hard_helmet } from './do_wear.js';
import { migrate_to_level } from './dog.js';
import { impact_drop } from './dokick.js';
import { Can_dig_down, In_hell, In_mines, Is_botlevel, assign_level, ceiling, depth, get_level, has_ceiling, ledger_no, on_level, surface } from './dungeon.js';
import { is_fainted } from './eat.js';
import { can_reach_floor, cant_reach_floor, del_engr_at, u_wipe_engr } from './engrave.js';
import { explode } from './explode.js';
import { breaksink, dogushforth, dryup } from './fountain.js';
import { in_rooms, in_town, losehp, may_dig, nomul, obj_to_any, pooleffects, spot_checks, spoteffects, switch_terrain } from './hack.js';
import { dist2, s_suffix } from './hacklib.js';
import { align_str } from './insight.js';
import { currency, delobj, sobj_at, stackobj, update_inventory } from './invent.js';
import { makemon, mkclass } from './makemon.js';
import { expels } from './mhitu.js';
import { add_to_buried, mk_tt_object, mksobj_at, obj_extract_self, obj_ice_effects, place_object, rnd_treefruit_at } from './mkobj.js';
import { angry_guards, get_iter_mons, hideunder, maybe_unhide_at, minliquid, wake_nearby } from './mon.js';
import { dmgtype_fromattack } from './mondata.js';
import { closed_door, mb_trapped } from './monmove.js';
import { ALTAR, ANTI_MAGIC, A_CHA, A_CON, A_DEX, A_INT, A_STR, A_WIS, BEARTRAP, BEAR_TRAP, BLINDED, BOULDER, COIN_CLASS, CORPSE, CORR, CQ_CANNED, DBWALL, DEAF, DIGCHECK_FAILED, DIGCHECK_FAIL_AIRLEVEL, DIGCHECK_FAIL_ALTAR, DIGCHECK_FAIL_BOULDER, DIGCHECK_FAIL_CANTDIG, DIGCHECK_FAIL_OBJ_POOL_OR_TRAP, DIGCHECK_FAIL_ONLADDER, DIGCHECK_FAIL_ONSTAIRS, DIGCHECK_FAIL_THRONE, DIGCHECK_FAIL_TOOHARD, DIGCHECK_FAIL_UNDESTROYABLETRAP, DIGCHECK_FAIL_WATERLEVEL, DIGCHECK_PASSED, DIGCHECK_PASSED_DESTROY_TRAP, DIGCHECK_PASSED_PITONLY, DIR_ERR, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, EXPL_MAGICAL, FLYING, FOOT, FOUNTAIN, FUMBLING, GLYPH_ALTAR_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GRAVE, HALF_PHDAM, HALLUC, HALLUC_RES, HEAD, HEAVY_IRON_BALL, HOLE, INVIS, IRONBARS, LANDMINE, LAND_MINE, LAVAPOOL, LAVAWALL, LEASH, LEVEL_TELEP, LEVITATION, MAGIC_PORTAL, MAGIC_TRAP, MAXOCLASSES, MAX_GLYPH, MOAT, MV_WALK, NO_PART, N_DIRS_Z, PIT, PM_AIR_ELEMENTAL, PM_ARCHEOLOGIST, PM_DWARF, PM_EARTH_ELEMENTAL, PM_ELF, PM_RANGER, PM_SAMURAI, PM_WATCHMAN, PM_WATCH_CAPTAIN, PM_XORN, POLY_TRAP, POOL, POTION_CLASS, POT_OIL, P_AXE, P_PICK_AXE, ROCK, ROOM, ROT_ORGANIC, SCORR, SDOOR, SHOPBASE, SINK, SPIKED_PIT, STAIRS, STATUE, STOMACH, STONE, S_EYE, S_LIGHT, S_MUMMY, S_VORTEX, S_ZOMBIE, S_altar, S_arrow_trap, S_digbeam, S_goodpos, S_grave, S_ndoor, S_stone, S_trwall, S_vwall, TELEP_TRAP, THRONE, TIMER_OBJECT, TOOL_CLASS, TRAPDOOR, TRAPNUM, TREE, TT_BURIEDBALL, TT_INFLOOR, TT_PIT, TT_WEB, VIBRATING_SQUARE, WATER, WEAPON_CLASS, WEB, WOOD, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned } from './nh-constants.js';
import { An, Yobjnam2, an, corpse_xname, otense, simpleonames, the, xname, yname, yobjnam } from './objnam.js';
import { pickup } from './pickup.js';
import { There } from './pline.js';
import { body_part, mbodypart } from './polyself.js';
import { altar_wrath, altarmask_at, desecrate_altar } from './pray.js';
import { angry_priest } from './priest.js';
import { punish, unpunish } from './read.js';
import { d, rn2, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { add_damage, costly_spot, make_angry_shk, obfree, pay_for_damage, shop_keeper, shopdig, stolen_value } from './shk.js';
import { shkname } from './shknam.js';
import { On_ladder, On_stairs, stairway_at } from './stairs.js';
import { remove_worn_item } from './steal.js';
import { rloc, teleport_pet } from './teleport.js';
import { end_burn, start_timer, stop_timer } from './timeout.js';
import { b_trapped, cnv_trap_obj, conjoined_pits, delfloortrap, deltrap, dotrap, feeltrap, fire_damage, fire_damage_chain, maketrap, mintrap, reset_utrap, seetrap, set_utrap, t_at, trapname, uescaped_shaft, unconscious, uteetering_at_seen_pit, water_damage_chain } from './trap.js';
import { do_attack } from './uhitm.js';
import { does_block, recalc_block_point, unblock_point } from './vision.js';
import { abon, dbon, dmgval, setmnotwielded } from './weapon.js';
import { welded, wield_tool } from './wield.js';
import { count_wsegs } from './worm.js';
import { break_statue, fracture_rock, obj_resists } from './zap.js';

/* Indices returned by dig_typ() */
export const DIGTYP_UNDIGGABLE = 0;
export const DIGTYP_ROCK = 1;
export const DIGTYP_STATUE = 2;
export const DIGTYP_BOULDER = 3;
export const DIGTYP_DOOR = 4;
export const DIGTYP_TREE = 5;
export function rm_waslit() {
    let x = 0;
    let y = 0;
    if (game.level.locations[game.u.ux][game.u.uy].typ == ROOM && game.level.locations[game.u.ux][game.u.uy].waslit) {
        return (1);
    }
    for (x = game.u.ux - 2; x < game.u.ux + 3; x++) {
        for (y = game.u.uy - 1; y < game.u.uy + 2; y++) {
            if (isok(x, y) && game.level.locations[x][y].waslit) {
                return (1);
            }
        }
    }
    return (0);
}
/* Change level topology.  Messes with vision tables and ignores things like
 * boulders in the name of a nice effect.  Vision will get fixed up again
 * immediately after the effect is complete.
 */
export async function mkcavepos(x, y, dist, waslit, rockit) {
    let lev = null;
    if (!isok(x, y)) {
        return;
    }
    lev = game.level.locations[x][y];
    if (rockit) {
        let mtmp = null;
        if (((lev.typ) < POOL)) {
            return;
        }
        if (t_at(x, y)) {
            return;
        }
        /* make sure crucial monsters survive */
        if ((mtmp = (game.level.monsters[x][y])) != null) {
            if (!(((mtmp.data).mflags1 & 8) != 0)) {
                await rloc(mtmp, 4);
            }
        }
    } else if (lev.typ == ROOM) {
        return;
    }
    /* make sure vision knows this location is open */
    unblock_point(x, y);
    lev.seenv = 0;
    lev.flags = 0;
    if (dist < 3) {
        lev.lit = (rockit ? (0) : (1));
    }
    if (waslit) {
        lev.waslit = (rockit ? (0) : (1));
    }
    lev.horizontal = (0);
    /* short-circuit vision recalc */
    game.viz_array[y][x] = (dist < 3) ? (2 | 1) : 1;
    /* flags set via doormask above */
    lev.typ = (rockit ? STONE : ROOM);
    if (dist >= 3) {
        await impossible("mkcavepos called with dist %d", dist);
    }
    await feel_newsym(x, y);
}
export async function mkcavearea(rockit) {
    let dist = 0;
    let xmin = game.u.ux;
    let xmax = game.u.ux;
    let ymin = game.u.uy;
    let ymax = game.u.uy;
    let i = 0;
    let waslit = rm_waslit();
    if (rockit) {
        ;
        await pline("Crash!  The ceiling collapses around you!");
    } else {
        await pline("A mysterious force %s cave around you!", (game.level.locations[game.u.ux][game.u.uy].typ == CORR) ? "creates a" : "extends the");
    }
    await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
    for (dist = 1; dist <= 2; dist++) {
        xmin--;
        xmax++;
        if (dist < 2) {
            /* the area is wider that it is high */
            ymin--;
            ymax++;
            for (i = xmin + 1; i < xmax; i++) {
                await mkcavepos(i, ymin, dist, waslit, rockit);
                await mkcavepos(i, ymax, dist, waslit, rockit);
            }
        }
        for (i = ymin; i <= ymax; i++) {
            await mkcavepos(xmin, i, dist, waslit, rockit);
            await mkcavepos(xmax, i, dist, waslit, rockit);
        }
        await flush_screen(1);
        (game.windowprocs.win_delay_output)();
    }
    if (!rockit && game.level.locations[game.u.ux][game.u.uy].typ == CORR) {
        game.level.locations[game.u.ux][game.u.uy].typ = ROOM;
        /* flags for CORR already 0 */
        if (waslit) {
            game.level.locations[game.u.ux][game.u.uy].waslit = (1);
        }
        await newsym(game.u.ux, game.u.uy);
    }
    game.vision_full_recalc = 1;
}
/* called when attempting to break a statue or boulder with a pick */
export function pick_can_reach(pick, x, y) {
    let t = t_at(x, y);
    /* tseen: pit only affects item positioning when it is known */
    let target_in_pit = t && ((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT) && t.tseen;
    if (game.u.utrap && game.u.utraptype == TT_PIT) {
        /* if hero is in a pit, pick can only reach if the statue is too and
       the two pits are conjoined or the statue isn't and pick is two-handed;
       this applies to hero in pit trying to reach an adjcacent boulder too */
        if (target_in_pit) {
            return conjoined_pits(t, t_at(game.u.ux, game.u.uy), (0));
        }
        return ((pick.oclass == WEAPON_CLASS || pick.oclass == TOOL_CLASS) && game.objects[pick.otyp].oc_big);
    }
    /* when hero isn't in a pit, a mattock or flying hero w/ pick can reach
       whether or not the statue is in a pit */
    if (((pick.oclass == WEAPON_CLASS || pick.oclass == TOOL_CLASS) && game.objects[pick.otyp].oc_big) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
        return (1);
    }
    /* one-handed pick-axe can reach if statue isn't in a pit */
    if (!target_in_pit) {
        return (1);
    }
    return (0);
}
/* When digging into location <x,y>, what are you actually digging into? */
export function dig_typ(otmp, x, y) {
    let ltyp = 0;
    if (!isok(x, y) || !otmp || (!((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_subtyp == P_PICK_AXE) && !((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_subtyp == P_AXE))) {
        return DIGTYP_UNDIGGABLE;
    }
    ltyp = game.level.locations[x][y].typ;
    if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_subtyp == P_AXE)) {
        return closed_door(x, y) ? DIGTYP_DOOR : ((ltyp) == TREE || (game.level.flags.arboreal && (ltyp) == STONE)) ? DIGTYP_TREE : DIGTYP_UNDIGGABLE;
    }
    return (sobj_at(STATUE, x, y) && pick_can_reach(otmp, x, y)) ? DIGTYP_STATUE : (sobj_at(BOULDER, x, y) && pick_can_reach(otmp, x, y)) ? DIGTYP_BOULDER : closed_door(x, y) ? DIGTYP_DOOR : ((ltyp) == TREE || (game.level.flags.arboreal && (ltyp) == STONE)) ? DIGTYP_UNDIGGABLE : (((ltyp) < POOL) && (!game.level.flags.arboreal || ((ltyp) && (ltyp) <= DBWALL))) ? DIGTYP_ROCK : DIGTYP_UNDIGGABLE;
}
export function is_digging() {
    if (game.occupation == dig) {
        return (1);
    }
    return (0);
}
export function dig_check(madeby, x, y) {
    let ttmp = t_at(x, y);
    if (On_stairs(x, y)) {
        let stway = stairway_at(x, y);
        if (stway.isladder) {
            return DIGCHECK_FAIL_ONLADDER;
        } else {
            return DIGCHECK_FAIL_ONSTAIRS;
        }
    } else if (((game.level.locations[x][y].typ) == THRONE) && madeby != (null)) {
        return DIGCHECK_FAIL_THRONE;
    } else if (((game.level.locations[x][y].typ) == ALTAR) && (madeby != (null) || (altarmask_at(x, y) & 16) != 0)) {
        return DIGCHECK_FAIL_ALTAR;
    } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        return DIGCHECK_FAIL_AIRLEVEL;
    } else if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        return DIGCHECK_FAIL_WATERLEVEL;
    } else if ((((game.level.locations[x][y].typ) < POOL) && game.level.locations[x][y].typ != SDOOR && (game.level.locations[x][y].flags & 8) != 0)) {
        return DIGCHECK_FAIL_TOOHARD;
    } else if (ttmp && ((ttmp.ttyp) == MAGIC_PORTAL || (ttmp.ttyp) == VIBRATING_SQUARE)) {
        return DIGCHECK_FAIL_UNDESTROYABLETRAP;
    } else if (!Can_dig_down(game.u.uz) && !game.level.locations[x][y].candig) {
        if (ttmp) {
            if (!((ttmp.ttyp) == HOLE || (ttmp.ttyp) == TRAPDOOR) && !((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT)) {
                return DIGCHECK_PASSED_DESTROY_TRAP;
            } else {
                return DIGCHECK_FAIL_CANTDIG;
            }
        } else {
            return DIGCHECK_PASSED_PITONLY;
        }
    } else if (sobj_at(BOULDER, x, y)) {
        return DIGCHECK_FAIL_BOULDER;
    } else if (madeby == (null) && (ttmp || is_pool_or_lava(x, y))) {
        /* the block against existing traps is mainly to
                  prevent broken wands from turning holes into pits */
        /* digging by player handles pools separately */
        return DIGCHECK_FAIL_OBJ_POOL_OR_TRAP;
    }
    return DIGCHECK_PASSED;
}
export async function digcheck_fail_message(digresult, madeby, x, y) {
    let verb = (madeby == (game.youmonst) && game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp == P_AXE)) ? "chop" : "dig in";
    if (digresult < DIGCHECK_FAILED) {
        return;
    }
    switch (digresult) {
        case DIGCHECK_FAIL_AIRLEVEL:
            await You("cannot %s thin air.", verb);
            break;
        case DIGCHECK_FAIL_ALTAR:
            await pline_The("altar is too hard to break apart.");
            break;
        case DIGCHECK_FAIL_BOULDER:
            await There("isn't enough room to %s here.", verb);
            break;
        case DIGCHECK_FAIL_ONLADDER:
            await pline_The("ladder resists your effort.");
            break;
        case DIGCHECK_FAIL_ONSTAIRS:
            await pline_The("stairs are too hard to %s.", verb);
            break;
        case DIGCHECK_FAIL_THRONE:
            await pline_The("throne is too hard to break apart.");
            break;
        case DIGCHECK_FAIL_CANTDIG:
        case DIGCHECK_FAIL_TOOHARD:
        case DIGCHECK_FAIL_UNDESTROYABLETRAP:
            await pline_The("%s here is too hard to %s.", surface(x, y), verb);
            break;
        case DIGCHECK_FAIL_WATERLEVEL:
            await pline_The("%s splashes and subsides.", hliquid("water"));
            break;
        case DIGCHECK_FAIL_OBJ_POOL_OR_TRAP:
        case DIGCHECK_PASSED:
        case DIGCHECK_PASSED_PITONLY:
        case DIGCHECK_PASSED_DESTROY_TRAP:
            break;
    }
}
const __dig_d_target = ["", "rock", "statue", "boulder", "door", "tree"];
export async function dig() {
    let lev = null;
    let dpx = game.context.digging.pos.x;
    let dpy = game.context.digging.pos.y;
    let ispick = game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp == P_PICK_AXE);
    let verb = (!game.uwep || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp == P_PICK_AXE)) ? "dig into" : "chop through";
    let dcresult = DIGCHECK_PASSED;
    lev = game.level.locations[dpx][dpy];
    /* perhaps a nymph stole your pick-axe while you were busy digging */
    /* or perhaps you teleported away */
    if (game.u.uswallow || !game.uwep || (!ispick && !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp == P_AXE)) || !on_level(game.context.digging.level, game.u.uz) || ((game.context.digging.down ? (dpx != game.u.ux || dpy != game.u.uy) : !(dist2(((dpx)), ((dpy)), game.u.ux, game.u.uy) <= 2)))) {
        return 0;
    }
    if (game.context.digging.down) {
        dcresult = dig_check((game.youmonst), game.u.ux, game.u.uy);
        if (dcresult >= DIGCHECK_FAILED) {
            await digcheck_fail_message(dcresult, (game.youmonst), game.u.ux, game.u.uy);
            return 0;
        }
    } else {
        if (((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)) && !may_dig(dpx, dpy) && dig_typ(game.uwep, dpx, dpy) == DIGTYP_TREE) {
            await pline("This tree seems to be petrified.");
            return 0;
        }
        if (((lev.typ) < POOL) && !may_dig(dpx, dpy) && dig_typ(game.uwep, dpx, dpy) == DIGTYP_ROCK) {
            await pline("This %s is too hard to %s.", is_db_wall(dpx, dpy) ? "drawbridge" : "wall", verb);
            return 0;
        }
    }
    if ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) && !rn2(3)) {
        switch (rn2(3)) {
            case 0:
                if (!welded(game.uwep)) {
                    await You("fumble and drop %s.", await yname(game.uwep));
                    await dropx(game.uwep);
                } else {
                    if (game.u.usteed) {
                        await pline("%s and %s %s!", await Yobjnam2(game.uwep, "bounce"), await otense(game.uwep, "hit"), await mon_nam(game.u.usteed));
                    } else {
                        await pline("Ouch!  %s and %s you!", await Yobjnam2(game.uwep, "bounce"), await otense(game.uwep, "hit"));
                    }
                    await set_wounded_legs(262144, 5 + rnd(5));
                }
                break;
            case 1:
                ;
                await pline("Bang!  You hit with the broad side of %s!", await the(await xname(game.uwep)));
                await wake_nearby((0));
                break;
            default:
                await Your("swing misses its mark.");
                break;
        }
        return 0;
    }
    game.context.digging.effort += 10 + rn2(5) + await abon() + game.uwep.spe - ((game.uwep).oeroded > (game.uwep).oeroded2 ? (game.uwep).oeroded : (game.uwep).oeroded2) + game.u.udaminc;
    if ((game.urace.mnum == (PM_DWARF))) {
        game.context.digging.effort *= 2;
    }
    if (game.context.digging.down) {
        let ttmp = t_at(dpx, dpy);
        if (game.context.digging.effort > 250 || (ttmp && ttmp.ttyp == HOLE)) {
            await dighole((0), (0), null);
            /* restart completely from scratch if we resume digging */
            memset(game.context.digging, 0, 1 /* sizeof(struct dig_info) */);
            return 0;
        }
        if (game.context.digging.effort <= 50 || (ttmp && (ttmp.ttyp == TRAPDOOR || ((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT)))) {
            return 1;
        } else if (ttmp && (ttmp.ttyp == LANDMINE || (ttmp.ttyp == BEAR_TRAP && !game.u.utrap))) {
            await dotrap(ttmp, 1);
            memset(game.context.digging, 0, 1 /* sizeof(struct dig_info) */);
            return 0;
        } else if (ttmp && ttmp.ttyp == BEAR_TRAP && game.u.utrap) {
            if (rnl(7) > ((game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) ? 1 : 4)) {
                let kbuf = '';
                let dmg = await dmgval(game.uwep, game.youmonst) + dbon();
                if (dmg < 1) {
                    dmg = 1;
                } else if (game.uarmf) {
                    dmg = Math.trunc((dmg + 1) / 2);
                }
                await You("hit yourself in the %s.", await body_part(FOOT));
                kbuf = sprintf(kbuf, "chopping off %s own %s", (genders[game.flags.female ? 1 : 0].his), await body_part(FOOT));
                await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), kbuf, 1);
            } else {
                await You("destroy the bear trap with %s.", await yobjnam(game.uwep, null));
                await deltrap(ttmp);
                await reset_utrap((1));
            }
            /* we haven't made any progress toward a pit yet */
            game.context.digging.effort = 0;
            return 0;
        } else if (ttmp && dcresult == DIGCHECK_PASSED_DESTROY_TRAP) {
            let ttmpname = trapname(ttmp.ttyp, (0));
            if (ispick) {
                await You("destroy %s with %s.", ttmp.tseen ? await the(ttmpname) : await an(ttmpname), await yobjnam(game.uwep, null));
            }
            await deltrap(ttmp);
            game.context.digging.effort = 0;
            return 0;
        }
        if (((lev.typ) == ALTAR)) {
            await altar_wrath(dpx, dpy);
            await angry_priest();
        }
        if (await dighole((1), (0), null)) {
            game.context.digging.level.dnum = 0;
            game.context.digging.level.dlevel = -1;
        }
        return 0;
    }
    if (game.context.digging.effort > 100) {
        let digbuf = '';
        let digtxt = null;
        let dmgtxt = null;
        let obj = null;
        let bobj = null;
        let shopedge = 0;
        let digtyp = 0;
        cleanup: {
            dmgtxt = null;
            shopedge = in_rooms(dpx, dpy, SHOPBASE);
            digtyp = dig_typ(game.uwep, dpx, dpy);
            if (digtyp == DIGTYP_STATUE && (obj = sobj_at(STATUE, dpx, dpy)) != null) {
                if (await break_statue(obj)) {
                    digtxt = "The statue shatters.";
                /* it was a statue trap; break_statue()
                   printed a message and updated the screen */
                } else {
                    digtxt = null;
                }
            } else if (digtyp == DIGTYP_BOULDER && (obj = sobj_at(BOULDER, dpx, dpy)) != null) {
                await fracture_rock(obj);
                if ((bobj = sobj_at(BOULDER, dpx, dpy)) != null) {
                    await obj_extract_self(bobj);
                    await place_object(bobj, dpx, dpy);
                }
                digtxt = "The boulder falls apart.";
            } else if (lev.typ == STONE || lev.typ == SCORR || ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE))) {
                if ((((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level))))) {
                    if (game.uwep.blessed && !rn2(3)) {
                        await mkcavearea((0));
                        break cleanup;
                    } else if ((game.uwep.cursed && !rn2(4)) || (!game.uwep.blessed && !rn2(6))) {
                        await mkcavearea((1));
                        break cleanup;
                    }
                }
                if (digtyp == DIGTYP_TREE) {
                    digtxt = "You cut down the tree.";
                    lev.typ = ROOM , lev.flags = 0;
                    if (!rn2(5)) {
                        await rnd_treefruit_at(dpx, dpy);
                    }
                    if ((game.urace.mnum == (PM_ELF)) || (game.urole.mnum == (PM_RANGER))) {
                        adjalign(-1);
                    }
                } else {
                    digtxt = "You succeed in cutting away some rock.";
                    lev.typ = CORR , lev.flags = 0;
                }
            } else if (((lev.typ) && (lev.typ) <= DBWALL)) {
                if (shopedge) {
                    await add_damage(dpx, dpy, (10 * (acurrstr())));
                    dmgtxt = "damage";
                }
                if (game.level.flags.is_maze_lev) {
                    lev.typ = ROOM , lev.flags = 0;
                } else if (game.level.flags.is_cavernous_lev && !in_town(dpx, dpy)) {
                    lev.typ = CORR , lev.flags = 0;
                } else {
                    lev.typ = DOOR , lev.flags = 0;
                }
                digtxt = "You make an opening in the wall.";
            } else if (lev.typ == SDOOR) {
                cvt_sdoor_to_door(lev);
                digtxt = "You break through a secret door!";
                if (!(lev.flags & 16)) {
                    lev.flags = 1;
                }
            } else if (closed_door(dpx, dpy)) {
                digbuf = sprintf(digbuf, "You break through the door with your %s.", await simpleonames(game.uwep));
                digtxt = digbuf;
                if (shopedge) {
                    await add_damage(dpx, dpy, 400);
                    dmgtxt = "break";
                }
                if (!(lev.flags & 16)) {
                    lev.flags = 1;
                }
            /* statue or boulder got taken */
            } else {
                return 0;
            }
            if (!does_block(dpx, dpy, game.level.locations[dpx][dpy])) {
                unblock_point(dpx, dpy);
            }
            await feel_newsym(dpx, dpy);
            if (digtxt && !game.context.digging.quiet) {
                await pline("%s", digtxt);
            }
            if (dmgtxt) {
                await pay_for_damage(dmgtxt, (0));
            }
            if ((((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level)))) && !rn2(3)) {
                let mndx = rn2(2) ? PM_EARTH_ELEMENTAL : PM_XORN;
                if (await makemon(game.mons[mndx], dpx, dpy, 131072)) {
                    await pline_The("debris from your digging comes to life!");
                }
            }
            if (((lev.typ) == DOOR) && (lev.flags & 16)) {
                lev.flags = 0;
                await b_trapped("door", NO_PART);
                recalc_block_point(dpx, dpy);
                await newsym(dpx, dpy);
            }
        }
        game.context.digging.lastdigtime = game.moves;
        game.context.digging.quiet = (0);
        game.context.digging.level.dnum = 0;
        game.context.digging.level.dlevel = -1;
        return 0;
    } else {
        /* not enough effort has been spent yet */
        let dig_target = dig_typ(game.uwep, dpx, dpy);
        if (((lev.typ) && (lev.typ) <= DBWALL) || dig_target == DIGTYP_DOOR) {
            if (in_rooms(dpx, dpy, SHOPBASE)) {
                await pline("This %s seems too hard to %s.", ((lev.typ) == DOOR) ? "door" : "wall", verb);
                return 0;
            }
        } else if (dig_target == DIGTYP_UNDIGGABLE || (dig_target == DIGTYP_ROCK && !((lev.typ) < POOL))) {
            return 0;
        }
        if (!game.did_dig_msg) {
            await You("hit the %s with all your might.", __dig_d_target[dig_target]);
            await wake_nearby((0));
            game.did_dig_msg = (1);
        }
    }
    return 1;
}
export async function furniture_handled(x, y, madeby_u) {
    let lev = game.level.locations[x][y];
    if (((lev.typ) == FOUNTAIN)) {
        await dogushforth((0));
        game.level.locations[x][y].flags |= 2;
        ;
        await dryup(x, y, madeby_u);
    } else if (((lev.typ) == SINK)) {
        await breaksink(x, y);
    } else if (lev.typ == DRAWBRIDGE_DOWN || (is_drawbridge_wall(x, y) >= 0)) {
        let bx = x;
        let by = y;
        /* if under the portcullis, the bridge is adjacent */
        find_drawbridge({ get value() { return bx; }, set value(_v) { bx = _v; } }, { get value() { return by; }, set value(_v) { by = _v; } });
        await destroy_drawbridge(bx, by);
    } else {
        /* this is handled by the caller after we return FALSE */
        /* We reject this here because dighole() isn't
           prepared to deal with this case */
        /* if (room->wall_info & W_NONDIGGABLE) */
        return (0);
    }
    return (1);
}
/* When will hole be finished? Very rough indication used by shopkeeper. */
export function holetime() {
    if (game.occupation != dig || !game.u.ushops) {
        return -1;
    }
    return (Math.trunc((250 - game.context.digging.effort) / 20));
}
/* Return typ of liquid to fill a hole with, or ROOM, if no liquid nearby */
/* force filling if it exists at all */
export function fillholetyp(x, y, fill_if_any) {
    let x1 = 0;
    let y1 = 0;
    let lo_x = ((1) > (x - 1) ? (1) : (x - 1));
    let hi_x = ((x + 1) < (80 - 1) ? (x + 1) : (80 - 1));
    let lo_y = ((0) > (y - 1) ? (0) : (y - 1));
    let hi_y = ((y + 1) < (21 - 1) ? (y + 1) : (21 - 1));
    let pool_cnt = 0;
    let moat_cnt = 0;
    let lava_cnt = 0;
    for (x1 = lo_x; x1 <= hi_x; x1++) {
        for (y1 = lo_y; y1 <= hi_y; y1++) {
            if (is_moat(x1, y1)) {
                moat_cnt++;
            } else if (is_pool(x1, y1)) {
                pool_cnt++;
            } else if (is_lava(x1, y1)) {
                lava_cnt++;
            }
        }
    }
    if (!fill_if_any) {
        pool_cnt = Math.trunc(pool_cnt / 3);
    }
    if ((lava_cnt > moat_cnt + pool_cnt && rn2(lava_cnt + 1)) || (lava_cnt && fill_if_any)) {
        return LAVAPOOL;
    } else if ((moat_cnt > 0 && rn2(moat_cnt + 1)) || (moat_cnt && fill_if_any)) {
        return MOAT;
    } else if ((pool_cnt > 0 && rn2(pool_cnt + 1)) || (pool_cnt && fill_if_any)) {
        return POOL;
    /* This must come after is_moat since moats are pools
                 * but not vice-versa. */
    /* not as much liquid as the others */
    } else {
        return ROOM;
    }
}
export async function digactualhole(x, y, madeby, ttyp) {
    let oldobjs = null;
    let newobjs = null;
    let ttmp = null;
    let surface_type = null;
    let tname = null;
    let in_thru = null;
    let furniture = '';
    let lev = game.level.locations[x][y];
    let mtmp = (game.level.monsters[x][y]);
    let madeby_u = (madeby == (game.youmonst));
    let madeby_obj = (madeby == (null));
    let heros_fault = (madeby_u || madeby_obj);
    let shopdoor = 0;
    let at_u = ((x) == game.u.ux && (y) == game.u.uy);
    let wont_fall = ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked);
    let old_typ = 0;
    let old_aligntyp = (-128);
    if (at_u && game.u.utrap) {
        /* BY_OBJECT means the hero broke a wand, so blame her for it */
        if (game.u.utraptype == TT_BURIEDBALL) {
            await buried_ball_to_punishment();
        } else if (game.u.utraptype == TT_INFLOOR) {
            await reset_utrap((0));
        }
    }
    if (await furniture_handled(x, y, madeby_u)) {
        return;
    }
    if (ttyp != PIT && (!Can_dig_down(game.u.uz) && !lev.candig)) {
        await impossible("digactualhole: can't dig %s on this level.", trapname(ttyp, (1)));
        ttyp = PIT;
    }
    /* maketrap() might change terrain type but we deliver messages after
       that, so prepare in advance */
    old_typ = lev.typ;
    furniture = '';
    if (((lev.typ) >= STAIRS && (lev.typ) <= ALTAR)) {
        /* should mirror the word used by surface() for normal floor */
        surface_type = (((lev.typ) >= ROOM) && !(((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level)))) ? "floor" : "ground");
        if (((lev.typ) == ALTAR)) {
            old_aligntyp = (((((game.level.locations[x][y].flags & 7) & 7) == 0) ? (-128) : (((game.level.locations[x][y].flags & 7) & 7) == 4) ? 1 : (((game.level.locations[x][y].flags & 7) & 7)) - 2));
            furniture = strcpy(furniture, align_str(old_aligntyp));
            furniture = strcat(furniture, " ");
        }
        furniture = strcat(furniture, surface(x, y));
    } else {
        surface_type = surface(x, y);
    }
    shopdoor = ((lev.typ) == DOOR) && in_rooms(x, y, SHOPBASE);
    oldobjs = game.level.objects[x][y];
    ttmp = await maketrap(x, y, ttyp);
    if (!ttmp) {
        return;
    }
    newobjs = game.level.objects[x][y];
    ttmp.madeby_u = heros_fault;
    ttmp.tseen = 0;
    if (((game.viz_array[y][x] & 2) != 0)) {
        await seetrap(ttmp);
    } else if (madeby_u) {
        await feeltrap(ttmp);
    }
    tname = trapname(ttyp, (1));
    in_thru = (ttyp == HOLE ? "through" : "in");
    if (madeby_u) {
        if (x != game.u.ux || y != game.u.uy) {
            await You("dig an adjacent %s.", tname);
        } else {
            await You("dig %s %s the %s.", await an(tname), in_thru, surface_type);
        }
    } else if (!madeby_obj && canseemon(madeby)) {
        await pline("%s digs %s %s the %s.", await Monnam(madeby), await an(tname), in_thru, surface_type);
    } else if (((game.viz_array[y][x] & 2) != 0) && game.flags.verbose) {
        if (((old_typ) <= DBWALL)) {
            await pline_The("%s crumbles into %s.", surface_type, await an(tname));
        } else {
            await pline("%s appears in the %s.", await An(tname), surface_type);
        }
    }
    if (((old_typ) >= STAIRS && (old_typ) <= ALTAR) && ((game.viz_array[y][x] & 2) != 0)) {
        await pline_The("%s falls into the %s!", furniture, tname);
    }
    if (heros_fault && old_typ == ALTAR) {
        await desecrate_altar((0), old_aligntyp);
    }
    if (ttyp == PIT) {
        if (shopdoor && heros_fault) {
            await pay_for_damage("ruin", (0));
        } else {
            await add_damage(x, y, heros_fault ? 100 : 0);
        }
        if (madeby_u) {
            await wake_nearby((0));
        }
        await switch_terrain();
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            wont_fall = (1);
        }
        if (at_u) {
            if (!wont_fall) {
                set_utrap((rn2(4) + (2)), TT_PIT);
                game.vision_full_recalc = 1;
            } else {
                await reset_utrap((1));
            }
            if (oldobjs != newobjs) {
                await pickup(1);
            }
        } else if (mtmp) {
            if ((((mtmp.data).mflags1 & 1) != 0) || ((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) {
                if (canseemon(mtmp)) {
                    await pline("%s %s over the pit.", await Monnam(mtmp), ((((mtmp.data).mflags1 & 1) != 0)) ? "flies" : "floats");
                }
            } else if (mtmp != madeby) {
                await mintrap(mtmp, 0);
            }
        }
    } else {
        if (at_u) {
            await switch_terrain();
            if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
                wont_fall = (1);
            }
            if (!game.u.ustuck && !wont_fall && !await next_to_u()) {
                await You("are jerked back by your pet!");
                wont_fall = (1);
            }
            if (game.u.ustuck || wont_fall) {
                if (newobjs) {
                    await impact_drop(null, x, y, 0);
                }
                if (oldobjs != newobjs) {
                    await pickup(1);
                }
                if (shopdoor && heros_fault) {
                    await pay_for_damage("ruin", (0));
                }
            } else {
                let newlevel = { dnum: 0, dlevel: 0 };
                if (game.u.ushops && heros_fault) {
                    await shopdig(1);
                } else {
                    await pay_for_damage("dig into", (1));
                }
                await You("fall through...");
                /* Earlier checks must ensure that the destination
                 * level exists and is in the present dungeon.
                 */
                newlevel.dnum = game.u.uz.dnum;
                newlevel.dlevel = game.u.uz.dlevel + 1;
                await goto_level(newlevel, (0), (1), (0));
                await spoteffects((0));
            }
        } else {
            if (shopdoor && heros_fault) {
                await pay_for_damage("ruin", (0));
            }
            if (newobjs) {
                await impact_drop(null, x, y, 0);
            }
            if (mtmp) {
                /*[don't we need special sokoban handling here?]*/
                if (!(!(((mtmp.data).mflags1 & 1) != 0) && !((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT) && (!(((mtmp.data).mflags1 & 16) != 0) || !has_ceiling(game.u.uz))) || (mtmp.wormno && count_wsegs(mtmp) > 5) || mtmp.data.msize >= 4) {
                    return;
                }
                if (mtmp == game.u.ustuck) {
                    return;
                }
                if (await teleport_pet(mtmp, (0))) {
                    let tolevel = { dnum: 0, dlevel: 0 };
                    if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
                        assign_level(tolevel, (game.dungeon_topology.d_valley_level));
                    } else if (Is_botlevel(game.u.uz)) {
                        if (canseemon(mtmp)) {
                            await pline("%s avoids the trap.", await Monnam(mtmp));
                        }
                        return;
                    } else {
                        await get_level(tolevel, depth(game.u.uz) + 1);
                    }
                    if (mtmp.isshk) {
                        await make_angry_shk(mtmp, 0, 0);
                    }
                    await migrate_to_level(mtmp, ledger_no(tolevel), 0, null);
                }
            }
        }
    }
}
/*
 * Called from dighole(); also from do_break_wand() in apply.c
 * and do_earthquake() in music.c.
 */
export async function liquid_flow(x, y, typ, ttmp, fillmsg) {
    let objchain = null;
    let mon = null;
    let u_spot = ((x) == game.u.ux && (y) == game.u.uy);
    if (!is_pool_or_lava(x, y)) {
        if (game.iflags.sanity_check) {
            await impossible("Insane liquid_flow(%d,%d,%s,%s).", x, y, ttmp ? trapname(ttmp.ttyp, (1)) : "no trap", fillmsg ? fillmsg : "no mesg");
        }
        return;
    }
    if (ttmp) {
        await delfloortrap(ttmp);
    }
    await obj_ice_effects(x, y, (1));
    await unearth_objs(x, y);
    if (fillmsg) {
        await pline(fillmsg, hliquid(typ == LAVAPOOL ? "lava" : "water"));
    }
    if ((objchain = game.level.objects[x][y]) != null) {
        if (typ == LAVAPOOL) {
            await fire_damage_chain(objchain, (1), (1), x, y);
        } else {
            await water_damage_chain(objchain, (1));
        }
    }
    if (u_spot) {
        await pooleffects((0));
    } else if ((mon = (game.level.monsters[x][y])) != null) {
        await minliquid(mon);
    }
}
/* return TRUE if digging succeeded, FALSE otherwise */
export async function dighole(pit_only, by_magic, cc) {
    let ttmp = null;
    let lev = null;
    let boulder_here = null;
    let typ = 0;
    let old_typ = 0;
    let dig_x = 0;
    let dig_y = 0;
    let nohole = 0;
    let retval = (0);
    let dig_check_result = 0;
    if (!cc) {
        dig_x = game.u.ux;
        dig_y = game.u.uy;
    } else {
        dig_x = cc.x;
        dig_y = cc.y;
        if (!isok(dig_x, dig_y)) {
            return (0);
        }
    }
    ttmp = t_at(dig_x, dig_y);
    lev = game.level.locations[dig_x][dig_y];
    dig_check_result = dig_check((game.youmonst), dig_x, dig_y);
    /* nohole = (!Can_dig_down(&u.uz) && !lev->candig); */
    nohole = (dig_check_result == DIGCHECK_FAIL_CANTDIG || dig_check_result == DIGCHECK_FAIL_TOOHARD);
    old_typ = lev.typ;
    if ((ttmp && (((ttmp.ttyp) == MAGIC_PORTAL || (ttmp.ttyp) == VIBRATING_SQUARE) || nohole)) || (((old_typ) < POOL) && old_typ != SDOOR && (lev.flags & 8) != 0)) {
        await pline_The("%s %shere is too hard to dig in.", surface(dig_x, dig_y), (dig_x != game.u.ux || dig_y != game.u.uy) ? "t" : "");
    } else if (ttmp && ((ttmp.ttyp) == TELEP_TRAP || (ttmp.ttyp) == LEVEL_TELEP || (ttmp.ttyp) == MAGIC_TRAP || (ttmp.ttyp) == ANTI_MAGIC || (ttmp.ttyp) == POLY_TRAP)) {
        await explode(dig_x, dig_y, 0, 20 + d(3, 6), (MAXOCLASSES + 3), EXPL_MAGICAL);
        await deltrap(ttmp);
        await newsym(dig_x, dig_y);
    } else if (is_pool_or_lava(dig_x, dig_y)) {
        await pline_The("%s sloshes furiously for a moment, then subsides.", hliquid(is_lava(dig_x, dig_y) ? "lava" : "water"));
        await wake_nearby((0));
    } else if (old_typ == DRAWBRIDGE_DOWN || (is_drawbridge_wall(dig_x, dig_y) >= 0)) {
        if (pit_only) {
            await pline_The("drawbridge seems too hard to dig through.");
        } else {
            let x = dig_x;
            let y = dig_y;
            find_drawbridge({ get value() { return x; }, set value(_v) { x = _v; } }, { get value() { return y; }, set value(_v) { y = _v; } });
            await destroy_drawbridge(x, y);
            retval = (1);
        }
    } else if ((boulder_here = sobj_at(BOULDER, dig_x, dig_y)) != null) {
        if (ttmp && ((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT) && rn2(2)) {
            await pline_The("boulder settles into the %spit.", (dig_x != game.u.ux || dig_y != game.u.uy) ? "adjacent " : "");
            ttmp.ttyp = PIT;
        } else {
            ;
            await pline("KADOOM!  The boulder falls in!");
            await wake_nearby((0));
            await delfloortrap(ttmp);
        }
        await delobj(boulder_here);
    } else if (((old_typ) == GRAVE)) {
        await digactualhole(dig_x, dig_y, (game.youmonst), PIT);
        await dig_up_grave(cc);
        retval = (1);
    } else if (old_typ == DRAWBRIDGE_UP) {
        /* must be floor or ice, other cases handled above */
        /* dig "pit" and let fluid flow in (if possible) */
        typ = fillholetyp(dig_x, dig_y, (0));
        if (typ == ROOM) {
            await pline_The("%s %shere is too hard to dig in.", surface(dig_x, dig_y), (dig_x != game.u.ux || dig_y != game.u.uy) ? "t" : "");
        } else {
            lev.flags &= ~28;
            lev.flags |= (typ == LAVAPOOL) ? 4 : 0;
            await liquid_flow(dig_x, dig_y, typ, ttmp, "As you dig, the hole fills with %s!");
            retval = (1);
        }
    } else if (((old_typ) == THRONE)) {
        await pline_The("throne is too hard to break apart.");
    } else if (((old_typ) == ALTAR)) {
        await pline_The("altar is too hard to break apart.");
    } else {
        typ = fillholetyp(dig_x, dig_y, (0));
        lev.flags = 0;
        if (typ != ROOM) {
            if (!await furniture_handled(dig_x, dig_y, (1))) {
                lev.typ = typ;
                await liquid_flow(dig_x, dig_y, typ, ttmp, "As you dig, the hole fills with %s!");
            }
            retval = (1);
        } else {
            if (by_magic && ttmp && (ttmp.ttyp == LANDMINE || ttmp.ttyp == BEAR_TRAP)) {
                /* magical digging disarms settable traps */
                let otyp = (ttmp.ttyp == LANDMINE) ? LAND_MINE : BEARTRAP;
                await cnv_trap_obj(otyp, 1, ttmp, (1));
            }
            if (nohole || pit_only || dig_check_result == DIGCHECK_PASSED_DESTROY_TRAP || dig_check_result == DIGCHECK_PASSED_PITONLY) {
                await digactualhole(dig_x, dig_y, (game.youmonst), PIT);
            } else {
                await digactualhole(dig_x, dig_y, (game.youmonst), HOLE);
            }
            retval = (1);
        }
    }
    await spot_checks(dig_x, dig_y, old_typ);
    return retval;
}
export async function dig_up_grave(cc) {
    let otmp = null;
    let what_happens = 0;
    let dig_x = 0;
    let dig_y = 0;
    if (!cc) {
        dig_x = game.u.ux;
        dig_y = game.u.uy;
    } else {
        dig_x = cc.x;
        dig_y = cc.y;
        if (!isok(dig_x, dig_y)) {
            return;
        }
    }
    await exercise(A_WIS, (0));
    if ((game.urole.mnum == (PM_ARCHEOLOGIST))) {
        adjalign(-sgn(game.u.ualign.type) * 3);
        await You_feel("like a despicable grave-robber!");
    } else if ((game.urole.mnum == (PM_SAMURAI))) {
        adjalign(-sgn(game.u.ualign.type));
        await You("disturb the honorable dead!");
    } else if (game.u.ualign.type == 1) {
        if (game.u.ualign.record > -10) {
            adjalign(-1);
        }
        await You("have violated the sanctity of this grave!");
    }
    /* -1: force default case for empty grave */
    what_happens = game.level.locations[dig_x][dig_y].flags ? -1 : rn2(5);
    switch (what_happens) {
        case 0:
        case 1:
            await You("unearth a corpse.");
            if ((otmp = await mk_tt_object(CORPSE, dig_x, dig_y)) != null) {
                otmp.age -= ((50) + 1);
            }
            break;
        case 2:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("%s!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "Dude!  The living dead" : "The grave's owner is very upset");
            }
            await makemon(await mkclass(S_ZOMBIE, 0), dig_x, dig_y, 131072);
            break;
        case 3:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("%s!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "I want my mummy" : "You've disturbed a tomb");
            }
            await makemon(await mkclass(S_MUMMY, 0), dig_x, dig_y, 131072);
            break;
        default:
            await pline_The("grave is unoccupied.  Strange...");
            break;
    }
    game.level.locations[dig_x][dig_y].typ = ROOM;
    game.level.locations[dig_x][dig_y].flags = 0;
    game.level.locations[dig_x][dig_y].horizontal = 0;
    await del_engr_at(dig_x, dig_y);
    await newsym(dig_x, dig_y);
    return;
}
export async function use_pick_axe(obj) {
    let verb = null;
    let __nh_dsp_idx = 0;
    let dirsyms = '';
    let qbuf = '';
    let ispick = 0;
    let rx = 0;
    let ry = 0;
    let downok = 0;
    let res = 0;
    let dir = 0;
    if (obj != game.uwep) {
        if (await wield_tool(obj, "swing")) {
            /* we're now wielding it. next turn, apply to dig. */
            cmdq_add_ec(CQ_CANNED, doapply);
            cmdq_add_key(CQ_CANNED, obj.invlet);
            return 1;
        }
        return 0;
    }
    ispick = ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_PICK_AXE);
    verb = ispick ? "dig" : "chop";
    if (game.u.utrap && game.u.utraptype == TT_WEB) {
        await pline("%s you can't %s while entangled in a web.", !res ? "Unfortunately," : "But", verb);
        return res;
    }
    /* construct list of directions to show player for likely choices */
    downok = !!can_reach_floor((0));
    __nh_dsp_idx = 0;
    for (dir = 0; dir < N_DIRS_Z; dir++) {
        /* res==0 => no prior message;
                 res==1 => just got "You now wield a pick-axe." message */
        let dirch = cmd_from_dir(dir, MV_WALK);
        if (game.u.uswallow) {
            ;
        } else if (movecmd(dirch, MV_WALK)) {
            /* filter out useless directions */
            /* all directions are viable when swallowed */
            /* normal direction, within plane of the level map */
            if (!dxdy_moveok()) {
                continue;
            }
            rx = game.u.ux + game.u.dx;
            ry = game.u.uy + game.u.dy;
            if (!isok(rx, ry) || dig_typ(obj, rx, ry) == DIGTYP_UNDIGGABLE) {
                continue;
            }
        } else {
            /* up or down; we used to always include down, so that
               there would always be at least one choice shown, but
               it shouldn't be a likely candidate when floating high
               above the floor; include up instead in that situation
               (as a silly candidate rather than a likely one...) */
            if ((game.u.dz > 0) ^ downok) {
                continue;
            }
        }
        dirsyms = dirsyms.slice(0, __nh_dsp_idx++) + String.fromCharCode(dirch);
    }
    dirsyms = dirsyms.slice(0, __nh_dsp_idx);
    qbuf = sprintf(qbuf, "In what direction do you want to %s? [%s]", verb, dirsyms);
    if (!await getdir(qbuf)) {
        return (res | 2);
    }
    return await use_pick_axe2(obj);
}
/* MRKR: use_pick_axe() is split in two to allow autodig to bypass */
/*       the "In what direction do you want to dig?" query.        */
/*       use_pick_axe2() uses the existing u.dx, u.dy and u.dz    */
const __use_pick_axe2_d_action = ["swinging", "digging", "chipping the statue", "hitting the boulder", "chopping at the door", "cutting the tree"];
export async function use_pick_axe2(obj) {
    let rx = 0;
    let ry = 0;
    let lev = null;
    let trap = null;
    let trap_with_u = null;
    let dig_target = 0;
    let ispick = ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_PICK_AXE);
    let verbing = ispick ? "digging" : "chopping";
    if (game.u.uswallow && await do_attack(game.u.ustuck)) {
        ;
    } else if ((game.u.uinwater)) {
        await pline("Turbulence torpedoes your %s attempts.", verbing);
    } else if (game.u.dz < 0) {
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            await You("don't have enough leverage.");
        } else {
            await You_cant("reach the %s.", ceiling(game.u.ux, game.u.uy));
        }
    } else if (!game.u.dx && !game.u.dy && !game.u.dz) {
        let buf = '';
        let dam = 0;
        dam = rnd(2) + dbon() + obj.spe;
        if (dam <= 0) {
            dam = 1;
        }
        await You("hit yourself with %s.", await yname(game.uwep));
        buf = sprintf(buf, "%s own %s", (genders[game.flags.female ? 1 : 0].his), (game.obj_descr[(game.objects[obj.otyp]).oc_name_idx].oc_name));
        await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), buf, 1);
        game.disp.botl = (1);
        return 1;
    } else if (game.u.dz == 0) {
        confdir((0));
        rx = game.u.ux + game.u.dx;
        ry = game.u.uy + game.u.dy;
        if (!isok(rx, ry)) {
            ;
            await pline("Clash!");
            return 1;
        }
        lev = game.level.locations[rx][ry];
        if ((game.level.monsters[rx][ry] != null) && await do_attack((game.level.monsters[rx][ry]))) {
            return 1;
        }
        dig_target = dig_typ(obj, rx, ry);
        if (dig_target == DIGTYP_UNDIGGABLE) {
            let boulder = null;
            trap = t_at(rx, ry);
            if (trap && trap.ttyp == WEB) {
                if (!trap.tseen) {
                    await seetrap(trap);
                    await There("is a spider web there!");
                }
                await pline("%s entangled in the web.", await Yobjnam2(obj, "become"));
                /* you ought to be able to let go; tough luck */
                /* (maybe `move_into_trap()' would be better) */
                nomul(-d(2, 2));
                game.multi_reason = "stuck in a spider web";
                game.nomovemsg = "You pull free.";
            } else if (lev.typ == IRONBARS) {
                await pline("Clang!");
                await wake_nearby((0));
            } else if (((lev.typ) == WATER)) {
                await pline("Splash!");
            } else if (lev.typ == LAVAWALL) {
                await pline("Splash!");
                await fire_damage(game.uwep, (0), rx, ry);
            } else if (((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE))) {
                await You("need an axe to cut down a tree.");
            } else if (((lev.typ) < POOL)) {
                await You("need a pick to dig rock.");
            } else if ((boulder = sobj_at(BOULDER, rx, ry)) != null || sobj_at(STATUE, rx, ry)) {
                /* if both boulders and statues are present, the topmost
                   boulder will be shown on the map so treat it as target */
                let what = boulder ? "boulder" : "statue";
                if (!ispick) {
                    let vibrate = !rn2(3);
                    await pline("Sparks fly as you whack the %s.%s", what, vibrate ? "  The axe-handle vibrates violently!" : "");
                    if (vibrate) {
                        await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((2) + 1) / 2)) : (2)), "axing a hard object", 1);
                    }
                    await wake_nearby((0));
                } else {
                    await You_cant("reach the %s.", what);
                }
            } else if (game.u.utrap && game.u.utraptype == TT_PIT && trap && (trap_with_u = t_at(game.u.ux, game.u.uy)) && ((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT) && !conjoined_pits(trap, trap_with_u, (0))) {
                let idx = xytodir(game.u.dx, game.u.dy);
                if (idx != DIR_ERR) {
                    let adjidx = (((idx) + 4) % (N_DIRS_Z - 2));
                    trap_with_u.vl.v_conjoined |= (1 << idx);
                    trap.vl.v_conjoined |= (1 << adjidx);
                    await You("clear some debris from between the pits.");
                }
            } else if (game.u.utrap && game.u.utraptype == TT_PIT && (trap_with_u = t_at(game.u.ux, game.u.uy)) != null) {
                await You("swing %s, but the rubble has no place to go.", await yobjnam(obj, null));
            } else {
                await You("swing %s through thin air.", await yobjnam(obj, null));
            }
        } else {
            game.did_dig_msg = (0);
            game.context.digging.quiet = (0);
            if (game.context.digging.pos.x != rx || game.context.digging.pos.y != ry || !on_level(game.context.digging.level, game.u.uz) || game.context.digging.down) {
                if (game.flags.autodig && dig_target == DIGTYP_ROCK && !game.context.digging.down && ((game.context.digging.pos.x) == game.u.ux && (game.context.digging.pos.y) == game.u.uy) && (game.moves <= game.context.digging.lastdigtime + 2 && game.moves >= game.context.digging.lastdigtime)) {
                    /* avoid messages if repeated autodigging */
                    game.did_dig_msg = (1);
                    game.context.digging.quiet = (1);
                }
                game.context.digging.down = game.context.digging.chew = (0);
                game.context.digging.warned = (0);
                game.context.digging.pos.x = rx;
                game.context.digging.pos.y = ry;
                assign_level(game.context.digging.level, game.u.uz);
                game.context.digging.effort = 0;
                if (!game.context.digging.quiet) {
                    await You("start %s.", __use_pick_axe2_d_action[dig_target]);
                }
            } else {
                await You("%s %s.", game.context.digging.chew ? "begin" : "continue", __use_pick_axe2_d_action[dig_target]);
                game.context.digging.chew = (0);
            }
            set_occupation(dig, verbing, 0);
        }
    } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        await You("swing %s through thin air.", await yobjnam(obj, null));
    } else if (!can_reach_floor((0))) {
        await cant_reach_floor(game.u.ux, game.u.uy, (0), (0), (0));
    } else if (is_pool_or_lava(game.u.ux, game.u.uy)) {
        await You("cannot stay under%s long enough.", is_pool(game.u.ux, game.u.uy) ? "water" : " the lava");
    } else if ((trap = t_at(game.u.ux, game.u.uy)) != null && (uteetering_at_seen_pit(trap) || uescaped_shaft(trap))) {
        await dotrap(trap, 4);
        if (!game.u.utrap) {
            await cant_reach_floor(game.u.ux, game.u.uy, (0), (1), (0));
        }
    } else if (!ispick && (!trap || (trap.ttyp != LANDMINE && trap.ttyp != BEAR_TRAP))) {
        await pline("%s merely scratches the %s.", await Yobjnam2(obj, null), surface(game.u.ux, game.u.uy));
        await u_wipe_engr(3);
    } else {
        if (game.context.digging.pos.x != game.u.ux || game.context.digging.pos.y != game.u.uy || !on_level(game.context.digging.level, game.u.uz) || !game.context.digging.down) {
            game.context.digging.chew = (0);
            game.context.digging.down = (1);
            game.context.digging.warned = (0);
            game.context.digging.pos.x = game.u.ux;
            game.context.digging.pos.y = game.u.uy;
            assign_level(game.context.digging.level, game.u.uz);
            game.context.digging.effort = 0;
            await You("start %s downward.", verbing);
            if (game.u.ushops) {
                await shopdig(0);
                await add_damage(game.u.ux, game.u.uy, 100);
            }
        } else {
            await You("continue %s downward.", verbing);
        }
        game.did_dig_msg = (0);
        set_occupation(dig, verbing, 0);
    }
    return 1;
}
export function watchman_canseeu(mtmp) {
    if (((mtmp.data) == game.mons[PM_WATCHMAN] || (mtmp.data) == game.mons[PM_WATCH_CAPTAIN]) && mtmp.mcansee && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0)) && mtmp.mpeaceful) {
        return (1);
    }
    return (0);
}
/*
 * Town Watchmen frown on damage to the town walls, trees or fountains.
 * It's OK to dig holes in the ground, however.
 * If mtmp is assumed to be a watchman, a watchman is found if mtmp == 0
 * zap == TRUE if wand/spell of digging, FALSE otherwise (chewing)
 */
export async function watch_dig(mtmp, x, y, zap) {
    let lev = game.level.locations[x][y];
    if (in_town(x, y) && (closed_door(x, y) || lev.typ == SDOOR || ((lev.typ) && (lev.typ) <= DBWALL) || ((lev.typ) == FOUNTAIN) || ((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE)))) {
        if (!mtmp) {
            mtmp = await get_iter_mons(watchman_canseeu);
        }
        if (mtmp) {
            ;
            if (zap || game.context.digging.warned) {
                await verbalize("Halt, vandal!  You're under arrest!");
                await angry_guards(!!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf));
            } else {
                let str = null;
                if (((lev.typ) == DOOR)) {
                    str = "door";
                } else if (((lev.typ) == TREE || (game.level.flags.arboreal && (lev.typ) == STONE))) {
                    str = "tree";
                } else if (((lev.typ) < POOL)) {
                    str = "wall";
                } else {
                    str = "fountain";
                }
                await verbalize("Hey, stop damaging that %s!", str);
                game.context.digging.warned = (1);
            }
            if (is_digging()) {
                await stop_occupation();
            }
        }
    }
}
/* Return TRUE if monster died, FALSE otherwise.  Called from m_move(). */
export async function mdig_tunnel(mtmp) {
    let here = null;
    let sawit = 0;
    let seeit = 0;
    let trapped = 0;
    let pile = rnd(12);
    here = game.level.locations[mtmp.mx][mtmp.my];
    if (here.typ == SDOOR) {
        cvt_sdoor_to_door(here);
    }
    if (closed_door(mtmp.mx, mtmp.my)) {
        /* Eats away door if present & closed or locked */
        if (in_rooms(mtmp.mx, mtmp.my, SHOPBASE)) {
            await add_damage(mtmp.mx, mtmp.my, 0);
        }
        /* sawit: closed door location is more visible than an open one */
        /* before door state change and unblock_pt */
        sawit = canseemon(mtmp);
        trapped = (here.flags & 16) ? (1) : (0);
        here.flags = trapped ? 0 : 1;
        recalc_block_point(mtmp.mx, mtmp.my);
        await newsym(mtmp.mx, mtmp.my);
        if (trapped) {
            seeit = canseemon(mtmp);
            if (await mb_trapped(mtmp, sawit || seeit)) {
                await newsym(mtmp.mx, mtmp.my);
                return (1);
            }
        } else {
            if (game.flags.verbose) {
                if (!(game.multi < 0 && (unconscious() || is_fainted())) && !rn2(3)) {
                    await draft_message((1));
                }
            }
        }
        return (0);
    } else if (here.typ == SCORR) {
        here.typ = CORR , here.flags = 0;
        unblock_point(mtmp.mx, mtmp.my);
        await newsym(mtmp.mx, mtmp.my);
        await draft_message((0));
        return (0);
    } else if (!((here.typ) < POOL) && !((here.typ) == TREE || (game.level.flags.arboreal && (here.typ) == STONE))) {
        return (0);
    }
    if ((here.flags & 8) != 0) {
        await impossible("mdig_tunnel:  %s at (%d,%d) is undiggable", (((here.typ) && (here.typ) <= DBWALL) ? "wall" : ((here.typ) == TREE || (game.level.flags.arboreal && (here.typ) == STONE)) ? "tree" : "stone"), mtmp.mx, mtmp.my);
        return (0);
    }
    if (((here.typ) && (here.typ) <= DBWALL)) {
        if (game.flags.verbose && !rn2(5)) {
            ;
            await You_hear("crashing rock.");
        }
        if (in_rooms(mtmp.mx, mtmp.my, SHOPBASE)) {
            await add_damage(mtmp.mx, mtmp.my, 0);
        }
        if (game.level.flags.is_maze_lev) {
            here.typ = ROOM , here.flags = 0;
        } else if (game.level.flags.is_cavernous_lev && !in_town(mtmp.mx, mtmp.my)) {
            here.typ = CORR , here.flags = 0;
        } else {
            here.typ = DOOR , here.flags = 0;
        }
    } else if (((here.typ) == TREE || (game.level.flags.arboreal && (here.typ) == STONE))) {
        here.typ = ROOM , here.flags = 0;
        if (pile && pile < 5) {
            await rnd_treefruit_at(mtmp.mx, mtmp.my);
        }
    } else {
        here.typ = CORR , here.flags = 0;
        if (pile && pile < 5) {
            await mksobj_at((pile == 1) ? BOULDER : ROCK, mtmp.mx, mtmp.my, (1), (0));
        }
    }
    await newsym(mtmp.mx, mtmp.my);
    if (!sobj_at(BOULDER, mtmp.mx, mtmp.my)) {
        unblock_point(mtmp.mx, mtmp.my);
    }
    return (0);
}
/* from pray.c */
/* draft refers to air currents, but can be a pun on "draft" as conscription
   for military service (probably not a good pun if it has to be explained) */
const __draft_message_draft_reaction = ["enlisting", "marching", "protesting", "fleeing"];
export async function draft_message(unexpected) {
    if (unexpected) {
        if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await You_feel("an unexpected draft.");
        } else {
            await You_feel("like you are %s.", ((acurr(A_STR)) < 6 || (acurr(A_DEX)) < 6 || (acurr(A_CON)) < 6 || (acurr(A_CHA)) < 6 || (acurr(A_INT)) < 6 || (acurr(A_WIS)) < 6) ? "4-F" : "1-A");
        }
    } else {
        if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await You_feel("a draft.");
        } else {
            /* "marching" is deliberately ambiguous; it might mean drills
                after entering military service or mean engaging in protests */
            let dridx = 0;
            /* Lawful: 0..1, Neutral: 1..2, Chaotic: 2..3 */
            dridx = (rn2(2) + (1 - sgn(game.u.ualign.type)));
            if (game.u.ualign.record < 4) {
                dridx += (rn2(3) + (sgn(game.u.ualign.type) - 1));
            }
            await You_feel("like %s.", __draft_message_draft_reaction[dridx]);
        }
    }
}
/* digging via wand zap or spell cast */
export async function zap_dig() {
    let room = null;
    let mtmp = null;
    let otmp = null;
    let trap_with_u = null;
    let zx = 0;
    let zy = 0;
    let flow_x = -1;
    let flow_y = -1;
    let diridx = 8;
    let digdepth = 0;
    let shopdoor = 0;
    let shopwall = 0;
    let maze_dig = 0;
    let pitdig = (0);
    let pitflow = (0);
    if (game.u.uswallow) {
        /*
     * Original effect (approximately):
     * from CORR: dig until we pierce a wall
     * from ROOM: pierce wall and dig until we reach
     * an ACCESSIBLE place.
     * Currently: dig for digdepth positions;
     * also down on request of Lennart Augustsson.
     * 3.6.0: from a PIT: dig one adjacent pit.
     */
        mtmp = game.u.ustuck;
        if (!((mtmp.data).mlet == S_VORTEX || (mtmp.data) == game.mons[PM_AIR_ELEMENTAL])) {
            if ((dmgtype_fromattack((mtmp.data), 26, 11) != null)) {
                await You("pierce %s %s wall!", s_suffix(await mon_nam(mtmp)), await mbodypart(mtmp, STOMACH));
            }
            if ((((mtmp.data).geno & 4096) != 0)) {
                mtmp.mhp = Math.trunc((mtmp.mhp + 1) / 2);
            } else {
                mtmp.mhp = 1;
            }
            await expels(mtmp, mtmp.data, !(dmgtype_fromattack((mtmp.data), 26, 11) != null));
        }
        return;
    }
    if (game.u.dz) {
        if (!(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !(game.u.uinwater)) {
            if (game.u.dz < 0 || On_stairs(game.u.ux, game.u.uy)) {
                let dmg = 0;
                if (On_stairs(game.u.ux, game.u.uy)) {
                    let stway = stairway_at(game.u.ux, game.u.uy);
                    await pline_The("beam bounces off the %s and hits the %s.", stway.isladder ? "ladder" : "stairs", ceiling(game.u.ux, game.u.uy));
                }
                await You("loosen a rock from the %s.", ceiling(game.u.ux, game.u.uy));
                await pline("It falls on your %s!", await body_part(HEAD));
                dmg = rnd(hard_helmet(game.uarmh) ? 2 : 6);
                await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "falling rock", 0);
                otmp = await mksobj_at(ROCK, game.u.ux, game.u.uy, (0), (0));
                if (otmp) {
                    await xname(otmp);
                    await stackobj(otmp);
                }
                await newsym(game.u.ux, game.u.uy);
            } else {
                await watch_dig(null, game.u.ux, game.u.uy, (1));
                await dighole((0), (1), null);
            }
        }
        return;
    }
    /* normal case: digging across the level */
    shopdoor = shopwall = (0);
    maze_dig = game.level.flags.is_maze_lev && !(((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level))));
    zx = game.u.ux + game.u.dx;
    zy = game.u.uy + game.u.dy;
    if (game.u.utrap && game.u.utraptype == TT_PIT && (trap_with_u = t_at(game.u.ux, game.u.uy))) {
        pitdig = (1);
        diridx = xytodir(game.u.dx, game.u.dy);
    }
    digdepth = (rn2(18) + (8));
    await tmp_at((-1), (((S_digbeam) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_digbeam) <= S_trwall) ? ((S_digbeam) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_digbeam) < S_altar) ? (((S_digbeam) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_digbeam) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_digbeam) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_digbeam) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_digbeam) <= S_goodpos) ? (((S_digbeam) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
    while (--digdepth >= 0) {
        if (!isok(zx, zy)) {
            break;
        }
        room = game.level.locations[zx][zy];
        await tmp_at(zx, zy);
        (game.windowprocs.win_delay_output)();
        if (pitdig) {
            /* we are already in a pit if this is true */
            let cc = { x: 0, y: 0 };
            let adjpit = t_at(zx, zy);
            if (diridx != DIR_ERR && !conjoined_pits(adjpit, trap_with_u, (0))) {
                /* limited to the adjacent location only */
                digdepth = 0;
                ((digdepth));
                if (!(adjpit && ((adjpit.ttyp) == PIT || (adjpit.ttyp) == SPIKED_PIT))) {
                    let buf = '';
                    cc.x = zx;
                    cc.y = zy;
                    if (!adj_pit_checks(cc, buf)) {
                        if (__nh_char_at0(buf)) {
                            await pline("%s", buf);
                        }
                    } else {
                        await dighole((1), (1), cc);
                        adjpit = t_at(zx, zy);
                    }
                }
                if (adjpit && ((adjpit.ttyp) == PIT || (adjpit.ttyp) == SPIKED_PIT)) {
                    let adjidx = (((diridx) + 4) % (N_DIRS_Z - 2));
                    trap_with_u.vl.v_conjoined |= (1 << diridx);
                    adjpit.vl.v_conjoined |= (1 << adjidx);
                    flow_x = zx;
                    flow_y = zy;
                    pitflow = (1);
                }
                if (is_pool(zx, zy) || is_lava(zx, zy)) {
                    flow_x = zx - game.u.dx;
                    flow_y = zy - game.u.dy;
                    pitflow = (1);
                }
                break;
            }
        } else if (closed_door(zx, zy) || room.typ == SDOOR) {
            if (in_rooms(zx, zy, SHOPBASE)) {
                await add_damage(zx, zy, 400);
                shopdoor = (1);
            }
            if (room.typ == SDOOR) {
                room.typ = DOOR;
            } else if (((game.viz_array[zy][zx] & 2) != 0)) {
                await pline_The("door is razed!");
            }
            await watch_dig(null, zx, zy, (1));
            room.flags = 0;
            recalc_block_point(zx, zy);
            digdepth -= 2;
            if (maze_dig) {
                break;
            }
        } else if (maze_dig) {
            if (((room.typ) && (room.typ) <= DBWALL)) {
                if (!(room.flags & 8)) {
                    if (in_rooms(zx, zy, SHOPBASE)) {
                        await add_damage(zx, zy, 200);
                        shopwall = (1);
                    }
                    /* check trees before stone */
                    room.typ = ROOM , room.flags = 0;
                    unblock_point(zx, zy);
                } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline_The("wall glows then fades.");
                }
                break;
            } else if (((room.typ) == TREE || (game.level.flags.arboreal && (room.typ) == STONE))) {
                if (!(room.flags & 8)) {
                    room.typ = ROOM , room.flags = 0;
                    unblock_point(zx, zy);
                } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline_The("tree shudders but is unharmed.");
                }
                break;
            } else if (room.typ == STONE || room.typ == SCORR) {
                if (!(room.flags & 8)) {
                    /* IS_OBSTRUCTED but not IS_WALL or SDOOR */
                    room.typ = CORR , room.flags = 0;
                    unblock_point(zx, zy);
                } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline_The("rock glows then fades.");
                }
                break;
            }
        } else if (((room.typ) < POOL)) {
            if (!may_dig(zx, zy)) {
                break;
            }
            if (((room.typ) && (room.typ) <= DBWALL) || room.typ == SDOOR) {
                if (in_rooms(zx, zy, SHOPBASE)) {
                    await add_damage(zx, zy, 200);
                    shopwall = (1);
                }
                await watch_dig(null, zx, zy, (1));
                if (game.level.flags.is_cavernous_lev && !in_town(zx, zy)) {
                    room.typ = CORR , room.flags = 0;
                } else {
                    room.typ = DOOR , room.flags = 0;
                }
                digdepth -= 2;
            } else if (((room.typ) == TREE || (game.level.flags.arboreal && (room.typ) == STONE))) {
                room.typ = ROOM , room.flags = 0;
                digdepth -= 2;
            } else {
                room.typ = CORR , room.flags = 0;
                digdepth--;
            }
            unblock_point(zx, zy);
        }
        zx += game.u.dx;
        zy += game.u.dy;
    }
    await tmp_at((-7), 0);
    if (pitflow && isok(flow_x, flow_y)) {
        let ttmp = t_at(flow_x, flow_y);
        if (ttmp && ((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT)) {
            let filltyp = fillholetyp(ttmp.tx, ttmp.ty, (1));
            if (filltyp != ROOM) {
                await pit_flow(ttmp, filltyp);
            }
        }
    }
    if (shopdoor || shopwall) {
        await pay_for_damage(shopdoor ? "destroy" : "dig into", (0));
    }
    return;
}
/*
 * This checks what is on the surface above the
 * location where an adjacent pit might be created if
 * you're zapping a wand of digging laterally while
 * down in the pit.
 */
export function adj_pit_checks(cc, msg) {
    let ltyp = 0;
    let room = null;
    let foundation_msg = "The foundation is too hard to dig through from this angle.";
    if (!cc) {
        return (0);
    }
    if (!isok(cc.x, cc.y)) {
        return (0);
    }
    msg.value = 0;
    room = game.level.locations[cc.x][cc.y];
    ltyp = room.typ , room.flags = 0;
    if (is_pool(cc.x, cc.y) || is_lava(cc.x, cc.y)) {
        return (0);
    } else if (closed_door(cc.x, cc.y) || room.typ == SDOOR) {
        msg = strcpy(msg, foundation_msg);
        return (0);
    } else if (((ltyp) && (ltyp) <= DBWALL)) {
        msg = strcpy(msg, foundation_msg);
        return (0);
    } else if (((ltyp) == TREE || (game.level.flags.arboreal && (ltyp) == STONE))) {
        msg = strcpy(msg, "The tree's roots glow then fade.");
        return (0);
    } else if (ltyp == STONE || ltyp == SCORR) {
        if (room.flags & 8) {
            msg = strcpy(msg, "The rock glows then fades.");
            return (0);
        }
    } else if (ltyp == IRONBARS) {
        msg = strcpy(msg, "The bars go much deeper than your pit.");
        return (0);
    } else if (((ltyp) == SINK)) {
        msg = strcpy(msg, "A tangled mass of plumbing remains below the sink.");
        return (0);
    } else if (On_ladder(cc.x, cc.y)) {
        msg = strcpy(msg, "The ladder is unaffected.");
        return (0);
    } else {
        let supporting = null;
        if (((ltyp) == FOUNTAIN)) {
            supporting = "fountain";
        } else if (((ltyp) == THRONE)) {
            supporting = "throne";
        } else if (((ltyp) == ALTAR)) {
            supporting = "altar";
        } else if (On_stairs(cc.x, cc.y)) {
            supporting = "stairs";
        } else if (ltyp == DRAWBRIDGE_DOWN || ltyp == DBWALL) {
            supporting = "drawbridge";
        }
        if (supporting) {
            msg = sprintf(msg, "The %s supporting structures remain intact.", s_suffix(supporting));
            return (0);
        }
    }
    return (1);
}
/*
 * Ensure that all conjoined pits fill up.
 */
export async function pit_flow(trap, filltyp) {
    if (trap && filltyp != ROOM && ((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT)) {
        /*
     * FIXME?
     *  liquid_flow() -> pooleffects() -> {drown(),lava_effects()}
     *  might kill the hero; the game will end and if that leaves bones,
     *  remaining conjoined pits will be left unprocessed.
     */
        let t = { ntrap: null, tx: 0, ty: 0, dst: { dnum: 0, dlevel: 0 }, launch: { x: 0, y: 0 }, ttyp: 0, tseen: 0, once: 0, madeby_u: 0, vl: { v_launch_otyp: 0, v_launch2: { x: 0, y: 0 }, v_conjoined: 0, v_tnote: 0 } };
        let idx = 0;
        Object.assign(t, trap);
        game.level.locations[t.tx][t.ty].typ = filltyp , game.level.locations[t.tx][t.ty].flags = 0;
        await liquid_flow(t.tx, t.ty, filltyp, trap, ((t.tx) == game.u.ux && (t.ty) == game.u.uy) ? "Suddenly %s flows in from the adjacent pit!" : null);
        for (idx = 0; idx < (N_DIRS_Z - 2); ++idx) {
            if (t.vl.v_conjoined & (1 << idx)) {
                let x = 0;
                let y = 0;
                let t2 = null;
                x = t.tx + xdir[idx];
                y = t.ty + ydir[idx];
                t2 = t_at(x, y);
                await pit_flow(t2, filltyp);
            }
        }
    }
}
export function buried_ball(cc) {
    let odist = 0;
    let bdist = 80;
    let otmp = null;
    let ball = null;
    if (!game.u.utrap || game.u.utraptype == TT_BURIEDBALL) {
        for (otmp = game.level.buriedobjlist; otmp; otmp = otmp.nobj) {
            /* FIXME:
     *  This is just approximate; if multiple buried balls meet the
     *  criterium (within 2 steps of tethered hero's present location)
     *  it will find an arbitrary one rather than the one which used
     *  to be uball.  Once 3.6.{0,1} save file compatibility is broken,
     *  we should add svc.context.buriedball_oid and then we can find the
     *  actual former uball, which might be extra heavy or christened
     *  or not the one buried directly underneath the target spot.
     *
     *  [Why does this search within a radius of two when trapmove()
     *  only lets hero get one step away from the buried ball?]
     */
            /* u.utrap might have already been cleared, in which case the value
       of u.utraptype is no longer meaningful; if u.utrap is still set
       then u.utraptype needs to be for buried ball */
            if (otmp.otyp != HEAVY_IRON_BALL) {
                continue;
            }
            /* if found at the target spot, we're done */
            if (otmp.ox == cc.x && otmp.oy == cc.y) {
                return otmp;
            }
            /* find nearest within allowable vicinity: +/-2
             *  4 5 8
             *  1 2 5
             *  0 1 4
             */
            odist = dist2(otmp.ox, otmp.oy, cc.x, cc.y);
            if (odist <= 8 && (!ball || odist < bdist)) {
                /* remember nearest buried ball but keep checking others */
                ball = otmp;
                bdist = odist;
            }
        }
    }
    if (ball) {
        /* found, but not at < cc->x, cc->y > */
        cc.x = ball.ox;
        cc.y = ball.oy;
    }
    return ball;
}
export async function buried_ball_to_punishment() {
    let cc = { x: 0, y: 0 };
    let ball = null;
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    ball = buried_ball(cc);
    if (ball) {
        await obj_extract_self(ball);
        await punish(ball);
        await reset_utrap((0));
        await del_engr_at(cc.x, cc.y);
        await newsym(cc.x, cc.y);
    }
}
export async function buried_ball_to_freedom() {
    let cc = { x: 0, y: 0 };
    let ball = null;
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    ball = buried_ball(cc);
    if (ball) {
        await obj_extract_self(ball);
        await place_object(ball, cc.x, cc.y);
        await stackobj(ball);
        await reset_utrap((1));
        await del_engr_at(cc.x, cc.y);
        await newsym(cc.x, cc.y);
    }
}
/* move objects from fobj/nexthere lists to buriedobjlist, keeping position
   information */
export async function bury_an_obj(otmp, dealloced) {
    let otmp2 = null;
    let under_ice = 0;
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dig.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            await pline("bury_an_obj: %s", await xname(otmp));
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (dealloced) {
        dealloced.value = (0);
    }
    if (otmp == game.uball) {
        await unpunish();
        set_utrap((rn2(50) + (20)), TT_BURIEDBALL);
        await pline_The("iron ball gets buried!");
    }
    /* after unpunish(), or might get deallocated chain */
    otmp2 = otmp.v.v_nexthere;
    /*
     * obj_resists(,0,0) prevents Rider corpses from being buried.
     * It also prevents The Amulet and invocation tools from being
     * buried.  Since they can't be confined to bags and statues,
     * it makes sense that they can't be buried either, even though
     * the real reason there (direct accessibility when carried) is
     * completely different.
     */
    if (otmp == game.uchain || obj_resists(otmp, 0, 0)) {
        return otmp2;
    }
    if (otmp.otyp == LEASH && otmp.corpsenm != 0) {
        o_unleash(otmp);
    }
    if (otmp.lamplit && otmp.otyp != POT_OIL) {
        await end_burn(otmp, (1));
    }
    await obj_extract_self(otmp);
    under_ice = is_ice(otmp.ox, otmp.oy);
    if ((otmp.otyp == ROCK && !under_ice) || otmp.otyp == BOULDER) {
        /* merges into burying material; boulder removal is for #wizbury */
        if (dealloced) {
            dealloced.value = (1);
        }
        await obfree(otmp, null);
        return otmp2;
    }
    if (otmp.otyp == CORPSE) {
        ;
    } else if ((under_ice ? (otmp.oclass == POTION_CLASS) : (game.objects[otmp.otyp].oc_material <= WOOD)) && !obj_resists(otmp, 5, 95)) {
        await start_timer((under_ice ? 0 : 250) + rnd(250), TIMER_OBJECT, ROT_ORGANIC, obj_to_any(otmp));
    }
    await add_to_buried(otmp);
    return otmp2;
}
export async function bury_objs(x, y) {
    let otmp = null;
    let otmp2 = null;
    let shkp = null;
    let loss = 0;
    let costly = 0;
    costly = ((shkp = await shop_keeper(in_rooms(x, y, SHOPBASE))) && await costly_spot(x, y));
    if (game.level.objects[x][y] != null) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dig.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                await pline("bury_objs: at <%d,%d>", x, y);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    for (otmp = game.level.objects[x][y]; otmp; otmp = otmp2) {
        if (costly && !game.context.mon_moving) {
            loss += await stolen_value(otmp, x, y, shkp.mpeaceful, (1));
            if (otmp.oclass != COIN_CLASS) {
                otmp.no_charge = 1;
            }
        }
        otmp2 = await bury_an_obj(otmp, null);
    }
    await del_engr_at(x, y);
    await newsym(x, y);
    await maybe_unhide_at(x, y);
    if (costly && loss) {
        await You("owe %s %ld %s for burying merchandise.", await shkname(shkp), loss, await currency(loss));
    }
}
/* move objects from buriedobjlist to fobj/nexthere lists; if caller
   converts terrain from ice to something, it should call obj_ice_effects() */
export async function unearth_objs(x, y) {
    let otmp = null;
    let otmp2 = null;
    let bball = null;
    let cc = { x: 0, y: 0 };
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dig.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            await pline("unearth_objs: at <%d,%d>", x, y);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    cc.x = x;
    cc.y = y;
    bball = buried_ball(cc);
    for (otmp = game.level.buriedobjlist; otmp; otmp = otmp2) {
        otmp2 = otmp.nobj;
        if (otmp.ox == x && otmp.oy == y) {
            if (bball && otmp == bball && game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
                await buried_ball_to_punishment();
            } else {
                await obj_extract_self(otmp);
                if (otmp.timed) {
                    stop_timer(ROT_ORGANIC, obj_to_any(otmp));
                }
                await place_object(otmp, x, y);
                await stackobj(otmp);
            }
        }
    }
    await del_engr_at(x, y);
    await newsym(x, y);
}
/*
 * The organic material has rotted away while buried.  As an expansion,
 * we could add partial damage.  A damage count is kept in the object
 * and every time we are called we increment the count and reschedule another
 * timeout.  Eventually the object rots away.
 *
 * This is used by buried objects other than corpses.  When a container rots
 * away, any contents become newly buried objects.
 */
/* ARGSUSED */
export async function rot_organic(arg, timeout) {
    let obj = arg.a_obj;
    while (((obj).cobj != null)) {
        /* We don't need to place contained object on the floor
           first, but we do need to update its map coordinates. */
        obj.cobj.ox = obj.ox , obj.cobj.oy = obj.oy;
        await bury_an_obj(obj.cobj, null);
    }
    await obj_extract_self(obj);
    await obfree(obj, null);
}
/*
 * Called when a corpse has rotted completely away.
 */
export async function rot_corpse(arg, timeout) {
    let x = 0;
    let y = 0;
    let obj = arg.a_obj;
    let on_floor = obj.where == 1;
    let in_invent = obj.where == 3;
    if (on_floor) {
        x = obj.ox;
        y = obj.oy;
    } else if (in_invent) {
        if (game.flags.verbose) {
            let cname = await corpse_xname(obj, null, 2);
            await Your("%s%s %s away%c", obj == game.uwep ? "wielded " : "", cname, await otense(obj, "rot"), obj == game.uwep ? 33 : 46);
        }
        if (obj.owornmask) {
            await remove_worn_item(obj, (1));
            await stop_occupation();
        }
    } else if (obj.where == 4) {
        if (obj.owornmask && obj == ((obj.v.v_ocarry).mw)) {
            await setmnotwielded(obj.v.v_ocarry, obj);
        }
    } else if (obj.where == 5) {
        /* clear destination flag so that obfree()'s check for
           freeing a worn object doesn't get a false hit */
        obj.owornmask = 0;
    }
    await rot_organic(arg, timeout);
    if (on_floor) {
        let mtmp = (game.level.monsters[x][y]);
        if (mtmp && !(game.level.objects[x][y] != null) && mtmp.mundetected && (((mtmp.data).mflags1 & 128) != 0)) {
            /* a hiding monster may be exposed */
            mtmp.mundetected = 0;
        } else if (((x) == game.u.ux && (y) == game.u.uy) && game.u.uundetected && (((game.youmonst.data).mflags1 & 128) != 0)) {
            await hideunder(game.youmonst);
        }
        await newsym(x, y);
    } else if (in_invent) {
        update_inventory();
    }
}
/* at least give it a chance :-) */
/* calls unearth_you() */
/* still buried after 'port attempt */
/*0*/
/* the #wizbury command - bury everything at your loc and around */
export async function wiz_debug_cmd_bury() {
    let otmp = null;
    let x = 0;
    let y = 0;
    let before = 0;
    let after = 0;
    let diff = 0;
    for (x = game.u.ux - 1; x <= game.u.ux + 1; x++) {
        for (y = game.u.uy - 1; y <= game.u.uy + 1; y++) {
            if (!isok(x, y)) {
                continue;
            }
            for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
                ++before;
            }
            await bury_objs(x, y);
            for (otmp = game.level.objects[x][y]; otmp; otmp = otmp.v.v_nexthere) {
                ++after;
            }
        }
    }
    diff = before - after;
    if (before == 0) {
        await pline("No objects here or adjacent to bury.");
    } else if (diff == 0) {
        await pline("No objects buried.");
    } else {
        await pline("%d object%s buried.", diff, (((diff) == 1) ? "" : "s"));
    }
    return 0;
}
/* DEBUG */
/* for 'onefile' testing, leave STRIDENT defined so that the other instance
   of it in pray.c will trigger a complaint if someone changes its value */
/*#undef STRIDENT*/
/*dig.c*/
/* make sure the new glyphs shows up */
/* in case player is invisible */
/* !svc.context.digging.down */
/* digging onto a set object trap triggers it;
               hero should have used #untrap first */
/* release from trap, maybe Lev or Fly */
/*[5.0: this probably isn't necessary anymore]*/
/* another boulder here, restack it to the top */
/* vision:  can see through */
/* wrath should immediately follow altar destruction message */
/* now deal with actual post-trap creation effects */
/* in case we're digging down while encased in solid rock
           which is blocking levitation or flight */
/* in case we're digging down while encased in solid rock
               which is blocking levitation or flight */
/* check for leashed pet that can't fall right now */
/* Floor objects get a chance of falling down.  The case where
             * the hero does NOT fall down is treated here.  The case
             * where the hero does fall down is treated in goto_level().
             */
/* handle any earlier hero-caused damage */
/* messages for arriving in special rooms */
/* caller should have changed levl[x][y].typ to POOL, MOAT, or LAVA */
/* will untrap monster if one is here */
/* if any objects were frozen here, they're released now */
/* handle object damage before hero damage; affects potential bones */
/* drawbridge_down is the platform crossing the moat when the
           bridge is extended; drawbridge_wall is the open "doorway" or
           closed "door" where the portcullis/mechanism is located */
/*
             * digging makes a hole, but the boulder immediately
             * fills it.  Final outcome:  no hole, no boulder.
             */
/*
             * We can't dig a hole here since that will destroy
             * the drawbridge.  The following is a cop-out. --dlc
             */
/* the following two are here for the wand of digging */
/* convert trap into buried object (deletes trap) */
/* finally we get to make a hole */
/* Grave-robbing is frowned upon... */
/* using a pick but dig_target is DIGTYPE_UNDIGGABLE
                       and there is at least one boulder or statue or both
                       present; pick_can_reach() returned false */
/* it must be air -- water checked above */
/* Monsters which swim also happen not to be able to dig */
/* might escape trap and still be teetering at brink */
/* can only dig down with an axe when doing so will
                  trigger or disarm a trap here */
/* "You feel an unexpected draft." */
/* Only rock, trees, and walls fall through to this point. */
/* KMH -- Okay on arboreal levels (room walls are still stone) */
/*
     * [Bug or TODO?  Have caller pass coordinates and use the travel
     * mechanism to determine whether there is a path between
     * destroyed door (or exposed secret corridor) and hero's location.
     * When there is no such path, no draft should be felt.]
     */
/* U.S. classification system uses 1-A for eligible to serve
               and 4-F for ineligible due to physical or mental defect;
               some intermediate values exist but are rarely seen */
/* L: +(0..2), N: +(-1..1), C: +(-2..0); all: 0..3 */
/* set dknown, maybe bknown */
/* this can also result in a pool at zx,zy */
/* staircase up or down. On_ladder handled above. */
/* cannot do this back-check; liquid_flow()
                 * called deltrap() which cleaned up the
                 * conjoined fields on both pits.
                 */
/* rusting buried metallic objects is not implemented yet */
/* use ball as flag for unearthed buried ball */
/*
     * Start a rot on organic material.  Not corpses -- they
     * are already handled.
     */
/* should cancel timer if under_ice */
/* rusting of buried metal not yet implemented */
/* don't expect any engravings here, but just in case */
/* Everything which can be held in a container can also be
           buried, so bury_an_obj's use of obj_extract_self insures
           that Has_contents(obj) will eventually become false. */
/* before and after will be the same if only unburiable objects are
           present (The Amulet, invocation items, Rider corpses, uchain when
           uball doesn't get buried: carried or floor beyond burial range) */
/* usual case; if uball got buried, uchain went away and won't be
           counted as buried */
