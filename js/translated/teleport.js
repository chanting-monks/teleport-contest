import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';
/* NetHack 5.0	teleport.c	$NHDT-Date: 1769342601 2026/01/25 04:03:21 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.239 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, Your, pline, verbalize } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcmp, strcpy } from '../c2js-runtime/string.js';
import { get_mleash, m_unleash, next_to_u } from './apply.js';
import { acurr, exercise } from './attrib.js';
import { drag_ball, move_bc, placebc, unplacebc } from './ball.js';
import { isok, yn_function } from './cmd.js';
import { is_lava, is_pool, is_waterwall } from './dbridge.js';
import { c_common_strings, cg, ynchars, ynqchars } from './decl.js';
import { buried_ball_to_punishment } from './dig.js';
import { canseemon, docrt, newsym, nul_glyphinfo, see_monsters, sensemon, shieldeff } from './display.js';
import { flooreffects, revive_corpse, schedule_goto } from './do.js';
import { Amonnam, Monnam, mon_nam, noit_mon_nam } from './do_name.js';
import { migrate_to_level } from './dog.js';
import { In_W_tower, In_hell, In_mines, In_quest, Is_botlevel, On_W_tower_level, assign_level, depth, dunlevs_in_dungeon, find_hell, get_level, ledger_no, lev_by_name, on_level, print_dungeon, single_level_branch, surface, u_on_newpos } from './dungeon.js';
import { morehungry } from './eat.js';
import { done } from './end.js';
import { sengr_at } from './engrave.js';
import { getpos } from './getpos.js';
import { check_capacity, check_special_room, in_rooms, invocation_message, may_passwall, near_capacity, nomul, notice_all_mons, spoteffects, switch_terrain, u_locomotion } from './hack.js';
import { digit, dist2, distmin } from './hacklib.js';
import { addinv, prinv, sobj_at } from './invent.js';
import { is_home_elemental } from './makemon.js';
import { is_exclusion_zone } from './mkmaze.js';
import { mksobj, obj_extract_self, place_object } from './mkobj.js';
import { search_special, somexyspace } from './mkroom.js';
import { get_iter_mons, hideunder, m_in_air, m_into_limbo, maybe_unhide_at, set_ustuck, unstuck } from './mon.js';
import { set_mon_data } from './mondata.js';
import { accessible, closed_door, dochugw, mon_track_clear, onscary, set_apparxy } from './monmove.js';
import { ALTAR, AMULET_OF_YENDOR, ANTIMAGIC, A_STR, A_WIS, BLINDED, BOULDER, CONFUSION, CORPSE, DIED, FIRE_RES, FLYING, HALLUC, HALLUC_RES, HOLE, LEVEL_TELEP, LEVITATION, LR_MONGEN, MAGICAL_BREATHING, MAGIC_PORTAL, MS_SILENT, M_AP_NOTHING, NEUTRAL, NO_TRAP, PASSES_WALLS, PIT, PM_DEATH, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_FLOATING_EYE, PM_MINOTAUR, PM_PESTILENCE, PM_SALAMANDER, PM_WIZARD, POOL, SCR_SCARE_MONSTER, SHOPBASE, SLT_ENCUMBER, SPE_TELEPORT_AWAY, SPIKED_PIT, STUNNED, SWIMMING, S_ANGEL, S_EEL, S_ELEMENTAL, S_HUMAN, S_MIMIC, S_VAMPIRE, TELEPORT, TELEPORT_CONTROL, TELEP_TRAP, TEMPLE, TRAPDOOR, TT_BURIEDBALL, Trap_Effect_Finished, Trap_Moved_Mon, UTOTYPE_ATSTAIRS, UTOTYPE_NONE, UTOTYPE_PORTAL, VAULT, VIBRATING_SQUARE, WAN_TELEPORTATION, WWALKING, spe_Fresh, spe_Unknown } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { pline_mon, set_msg_xy } from './pline.js';
import { make_blinded, make_confused, make_stunned } from './potion.js';
import { inhistemple } from './priest.js';
import { learnscroll } from './read.js';
import { in_out_region, update_monster_region, update_player_regions } from './region.js';
import { rn2, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { addtobill, costly_adjacent, costly_spot, find_objowner, inhishop, make_angry_shk, onshopbill, stolen_value, subfrombill, u_left_shop } from './shk.js';
import { yelp } from './sounds.js';
import { known_spell, spelleffects, tport_spell } from './spell.js';
import { place_monster } from './steed.js';
import { settrack } from './track.js';
import { clamp_hole_destination, deltrap, fill_pit, mintrap, reset_utrap, seetrap, t_at, unconscious } from './trap.js';
import { findgd, uleftvault, vault_occupied } from './vault.js';
import { vision_recalc } from './vision.js';
import { add_menu, getlin, select_menu } from './windows.js';
import { mon_has_amulet } from './wizard.js';
import { place_worm_tail_randomly, remove_worm } from './worm.js';

/* does monster block others from teleporting? */
export function m_blocks_teleporting(mtmp) {
    if (((((mtmp.data).mflags2 & 256) != 0) && (((mtmp.data).mflags2 & 1024) != 0)) || ((((mtmp.data).mflags2 & 256) != 0) && (((mtmp.data).mflags2 & 2048) != 0))) {
        return (1);
    }
    /* failed to find any acceptable spot */
    return (0);
}
/* teleporting is prevented on this level for this monster? */
export function noteleport_level(mon) {
    /* demon court in Gehennom prevent others from teleporting */
    if (In_hell(game.u.uz) && !(((((mon.data).mflags2 & 256) != 0) && (((mon.data).mflags2 & 1024) != 0)) || ((((mon.data).mflags2 & 256) != 0) && (((mon.data).mflags2 & 2048) != 0)))) {
        if (get_iter_mons(m_blocks_teleporting)) {
            return (1);
        }
    }
    /* natural no-teleport level; covetous monsters can bypass these */
    if (game.level.flags.noteleport && !(((mon.data).mflags3 & 31))) {
        return (1);
    }
    /* wand of stasis prevents teleportation while the effect is active
       (even for covetous monsters) */
    if (game.level.flags.stasis_until >= game.moves) {
        return (1);
    }
    return (0);
}
/* this is an approximation of onscary() that doesn't use any 'struct monst'
   fields aside from 'monst->data'; used primarily for new monster creation
   and monster teleport destination, not for ordinary monster movement */
export function goodpos_onscary(x, y, mptr) {
    /* onscary() checks Angels and lawful minions; this oversimplifies */
    if (mptr.mlet == S_HUMAN || mptr.mlet == S_ANGEL || ((mptr) == game.mons[PM_DEATH] || (mptr) == game.mons[PM_FAMINE] || (mptr) == game.mons[PM_PESTILENCE]) || (((mptr).geno & 4096) != 0)) {
        return (0);
    }
    /* onscary() checks for vampshifted vampire bats/fog clouds/wolves too */
    if (((game.level.locations[x][y].typ) == ALTAR) && mptr.mlet == S_VAMPIRE) {
        return (1);
    }
    /* scare monster scroll doesn't have any of the below restrictions,
       being its own source of power */
    if (sobj_at(SCR_SCARE_MONSTER, x, y)) {
        return (1);
    }
    /* engraved Elbereth doesn't work in Gehennom or the end-game */
    if (In_hell(game.u.uz) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        return (0);
    }
    /* creatures who don't (or can't) fear a written Elbereth and weren't
       caught by the minions check */
    if (mptr == game.mons[PM_MINOTAUR] || !(((mptr).mflags1 & 4096) == 0)) {
        return (0);
    }
    return sengr_at("Elbereth", x, y, (1)) ? (1) : (0);
}
/*
 * Is (x,y) a good position of mtmp?  If mtmp is NULL, then is (x,y) good
 * for an object?
 *
 * This function will only look at mtmp->mdat, so makemon, mplayer, etc can
 * call it to generate new monster positions with fake monster structures.
 */
export function goodpos(x, y, mtmp, gpflags) {
    fnEnter("goodpos", "teleport.c", 0);
    let mdat = null;
    let ignorewater = ((gpflags & 8) != 0);
    let ignorelava = ((gpflags & 524288) != 0);
    let checkscary = ((gpflags & 8388608) != 0);
    let allow_u = ((gpflags & 4194304) != 0);
    let avoid_monpos = ((gpflags & 16777216) != 0);
    if (!isok(x, y)) {
        return (0);
    }
    if (!allow_u) {
        /* in many cases, we're trying to create a new monster, which
     * can't go on top of the player or any existing monster.
     * however, occasionally we are relocating engravings or objects,
     * which could be co-located and thus get restricted a bit too much.
     * oh well.
     */
        if (((x) == game.u.ux && (y) == game.u.uy) && mtmp != game.youmonst && (mtmp != game.u.ustuck || !game.u.uswallow) && (!game.u.usteed || mtmp != game.u.usteed)) {
            /* water on the Plane of Water has no surface
                               so there's no way to be on or above that */
            return (0);
        }
    }
    if ((game.level.monsters[x][y] != null) && avoid_monpos) {
        return (0);
    }
    if (mtmp) {
        let mtmp2 = (game.level.monsters[x][y]);
        /* Be careful with long worms.  A monster may be placed back in
         * its own location.  Normally, if m_at() returns the same monster
         * that we're trying to place, the monster is being placed in its
         * own location.  However, that is not correct for worm segments,
         * because all the segments of the worm return the same m_at().
         * Actually we overdo the check a little bit--a worm can't be placed
         * in its own location, period.  If we just checked for mtmp->mx
         * != x || mtmp->my != y, we'd miss the case where we're called
         * to place the worm segment and the worm's head is at x,y.
         */
        if (mtmp2 && (mtmp2 != mtmp || mtmp.wormno)) {
            return (0);
        }
        mdat = mtmp.data;
        if (is_pool(x, y) && !ignorewater) {
            /* [what about Breathless?] */
            if (mtmp == game.youmonst) {
                return ((game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) || (!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !is_waterwall(x, y) && (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || ((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))))));
            } else {
                return ((((mdat).mflags1 & 2) != 0) || (!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !is_waterwall(x, y) && m_in_air(mtmp)));
            }
        } else if (mdat.mlet == S_EEL && rn2(13) && !ignorewater) {
            return (0);
        } else if (is_lava(x, y) && !ignorelava) {
            /* 3.6.3: floating eye can levitate over lava but it avoids
               that due the effect of the heat causing it to dry out */
            if (mdat == game.mons[PM_FLOATING_EYE]) {
                return (0);
            } else if (mtmp == game.youmonst) {
                return (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) && ((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) && game.uarmf && game.uarmf.oerodeproof) || ((game.u.umonnum != game.u.umonster) && (game.youmonst.data == game.mons[PM_FIRE_ELEMENTAL] || game.youmonst.data == game.mons[PM_SALAMANDER])));
            } else {
                return (m_in_air(mtmp) || (mdat == game.mons[PM_FIRE_ELEMENTAL] || mdat == game.mons[PM_SALAMANDER]));
            }
        }
        if ((((mdat).mflags1 & 8) != 0) && may_passwall(x, y)) {
            return (1);
        }
        if ((((mdat).mflags1 & 4) != 0) && closed_door(x, y)) {
            return (1);
        }
        /* avoid onscary() if caller has specified that restriction */
        if (checkscary && (mtmp.m_id ? onscary(x, y, mtmp) : goodpos_onscary(x, y, mdat))) {
            return (0);
        }
    }
    if (!accessible(x, y)) {
        if (!(is_pool(x, y) && ignorewater) && !(is_lava(x, y) && ignorelava)) {
            return (0);
        }
    }
    /* skip boulder locations for most creatures */
    if (sobj_at(BOULDER, x, y) && (!mdat || !(((mdat).mflags2 & 134217728) != 0))) {
        return (0);
    }
    /* pretend GP_AVOID_MONPOS == monster creation */
    if (avoid_monpos && is_exclusion_zone(LR_MONGEN, x, y)) {
        return (0);
    }
    return (1);
}
/*
 * "entity next to"
 *
 * Attempt to find a good place for the given monster type in the closest
 * position to (xx,yy).  Do so in successive square rings around (xx,yy).
 * If there is more than one valid position in the ring, choose one randomly.
 * Return TRUE and the position chosen when successful, FALSE otherwise.
 */
export function enexto(cc, xx, yy, mdat) {
    fnEnter("enexto", "teleport.c", 0);
    return (enexto_core(cc, xx, yy, mdat, 8388608) || enexto_core(cc, xx, yy, mdat, 0));
}
export function enexto_gpflags(cc, xx, yy, mdat, entflags) {
    return (enexto_core(cc, xx, yy, mdat, 8388608 | entflags) || enexto_core(cc, xx, yy, mdat, entflags));
}
/* output; <cc.x,cc.y> as close as feasible to <xx,yy> */
/* input coordinates */
/* type of monster; affects whether water or
                             * lava or boulder spots will be considered */
/* flags for goodpos() */
export function enexto_core(cc, xx, yy, mdat, entflags) {
    fnEnter("enexto_core", "teleport.c", 0);
    /* enough room for every location */
    let candy = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    let i = 0;
    let nearcandyct = 0;
    let allcandyct = 0;
    let fakemon = { nmon: null, data: null, m_id: 0, mnum: 0, cham: 0, movement: 0, m_lev: 0, malign: 0, mx: 0, my: 0, mux: 0, muy: 0, mtrack: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], mhp: 0, mhpmax: 0, mappearance: 0, m_ap_type: 0, mtame: 0, mintrinsics: 0, mextrinsics: 0, seen_resistance: 0, mspec_used: 0, female: 0, minvis: 0, invis_blkd: 0, perminvis: 0, mcan: 0, mburied: 0, mundetected: 0, mcansee: 0, mspeed: 0, permspeed: 0, mrevived: 0, mcloned: 0, mavenge: 0, mflee: 0, mfleetim: 0, msleeping: 0, mblinded: 0, mstun: 0, mfrozen: 0, mcanmove: 0, mconf: 0, mpeaceful: 0, mtrapped: 0, mleashed: 0, isshk: 0, isminion: 0, isgd: 0, ispriest: 0, iswiz: 0, wormno: 0, mtemplit: 0, meverseen: 0, mspotted: 0, mwandexp: 0, mgenmklev: 0, mstrategy: 0, mgoal: { x: 0, y: 0 }, mtrapseen: 0, mlstmv: 0, mstate: 0, migflags: 0, mspare1: 0, minvent: null, mw: null, misc_worn_check: 0, weapon_check: 0, meating: 0, mextra: null };
    let allow_xx_yy = ((entflags & 2097152) != 0);
    if (!mdat) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/teleport.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("enexto() called with null mdat");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        /* note: GP_ALLOW_XY isn't used by goodpos(); old enext_core() used to
       mask it off to hide it from goodpos but that isn't required and we
       want to keep it in case the debugpline4() gets called */
        mdat = game.mons[game.u.umonster];
    }
    Object.assign(fakemon, cg.zeromonst);
    set_mon_data(fakemon, mdat);
    traceCheckpoint('enexto_core.start', { xx, yy, gpflags: entflags });
    /* gather candidate coordinates within 3 steps, those 1 step away in
       random order first, then those 2 steps away in random order, then 3;
       this will usually find a good spot without scanning the whole map */
    nearcandyct = collect_coords(candy, xx, yy, 3, 0, null);
    for (i = 0; i < nearcandyct; ++i) {
        cc.x = candy[i].x; cc.y = candy[i].y;
        const __ok = goodpos(cc.x, cc.y, fakemon, entflags);
        traceCheckpoint('enexto_core.try', { i, x: cc.x, y: cc.y, ok: __ok ? 1 : 0 });
        if (__ok) {
            traceCheckpoint('enexto_core.pick', { x: cc.x, y: cc.y });
            return (1);
        }
    }
    /* didn't find a spot; gather coordinates for the whole map except
       for <xx,yy> itself, ordered in expanding distance from <xx,yy>
       (subsets of equal distance grouped together with order randomized) */
    allcandyct = collect_coords(candy, xx, yy, 0, 0, null);
    for (i = nearcandyct; i < allcandyct; ++i) {
        cc.x = candy[i].x; cc.y = candy[i].y;
        if (goodpos(cc.x, cc.y, fakemon, entflags)) {
            return (1);
        }
    }
    /* still didn't find a spot; maybe try <xx,yy> itself */
    /* final value for 'cc' in case we return False */
    cc.x = xx , cc.y = yy;
    if (allow_xx_yy && goodpos(cc.x, cc.y, fakemon, entflags)) {
        return (1);
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/teleport.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("enexto(\"%s\",%d,%d,0x%08lx) failed", mdat.pmnames[NEUTRAL], xx, yy, entflags);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    return (0);
}
/* !NEW_ENEXTO */
/* dummy monster */
/* default to player's original monster type */
/* set up for goodpos */
/* used to use 'if (range > ROWNO && range > COLNO) return FALSE' below,
       so effectively 'max(ROWNO, COLNO)' which performs useless iterations
       (possibly many iterations if <xx,yy> is in the center of the map) */
/* setup: no suitable spots yet, first iteration checks adjacent spots */
/*
     * Walk around the border of the square with center (xx,yy) and
     * radius range.  Stop when we find at least one valid position.
     */
/* beware of accessing beyond segment boundaries.. */
/* 3.6.3: this used to use 'ymin+1' which left top row unchecked */
/* return False if we exhausted 'range' without finding anything */
/* 3.6.3: earlier versions didn't have the option to try <xx,yy>,
           and left 'cc' uninitialized when returning False */
/* if every spot other than <xx,yy> has failed, try <xx,yy> itself */
/* 'cc' is set */
/* we've got between 1 and SIZE(good) candidates; choose one */
/* ?NEW_ENEXTO */
/*
 * Check for restricted areas present in some special levels.  (This might
 * need to be augmented to allow deliberate passage in wizard mode, but
 * only for explicitly chosen destinations.)
 */
export function tele_jump_ok(x1, y1, x2, y2) {
    if (!isok(x2, y2)) {
        return (0);
    }
    if (game.dndest.nlx > 0) {
        /* if inside a restricted region, can't teleport outside */
        if (((x1) >= (game.dndest.nlx) && (x1) <= (game.dndest.nhx) && (y1) >= (game.dndest.nly) && (y1) <= (game.dndest.nhy)) && !((x2) >= (game.dndest.nlx) && (x2) <= (game.dndest.nhx) && (y2) >= (game.dndest.nly) && (y2) <= (game.dndest.nhy))) {
            return (0);
        }
        /* and if outside, can't teleport inside */
        if (!((x1) >= (game.dndest.nlx) && (x1) <= (game.dndest.nhx) && (y1) >= (game.dndest.nly) && (y1) <= (game.dndest.nhy)) && ((x2) >= (game.dndest.nlx) && (x2) <= (game.dndest.nhx) && (y2) >= (game.dndest.nly) && (y2) <= (game.dndest.nhy))) {
            return (0);
        }
    }
    if (game.updest.nlx > 0) {
        if (((x1) >= (game.updest.nlx) && (x1) <= (game.updest.nhx) && (y1) >= (game.updest.nly) && (y1) <= (game.updest.nhy)) && !((x2) >= (game.updest.nlx) && (x2) <= (game.updest.nhx) && (y2) >= (game.updest.nly) && (y2) <= (game.updest.nhy))) {
            return (0);
        }
        if (!((x1) >= (game.updest.nlx) && (x1) <= (game.updest.nhx) && (y1) >= (game.updest.nly) && (y1) <= (game.updest.nhy)) && ((x2) >= (game.updest.nlx) && (x2) <= (game.updest.nhx) && (y2) >= (game.updest.nly) && (y2) <= (game.updest.nhy))) {
            return (0);
        }
    }
    return (1);
}
export function teleok(x, y, trapok) {
    if (!trapok) {
        /* allow teleportation onto vibrating square, it's not a real trap;
           also allow pits and holes if levitating or flying */
        let trap = t_at(x, y);
        if (!trap) {
            trapok = (1);
        } else if (trap.ttyp == VIBRATING_SQUARE) {
            trapok = (1);
        } else if ((((trap.ttyp) == PIT || (trap.ttyp) == SPIKED_PIT) || ((trap.ttyp) == HOLE || (trap.ttyp) == TRAPDOOR)) && (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked))) {
            trapok = (1);
        }
        if (!trapok) {
            return (0);
        }
    }
    if (!goodpos(x, y, game.youmonst, 0)) {
        return (0);
    }
    if (!tele_jump_ok(game.u.ux, game.u.uy, x, y)) {
        return (0);
    }
    if (!in_out_region(x, y)) {
        return (0);
    }
    return (1);
}
export function teleds(nux, nuy, teleds_flags) {
    let was_swallowed = 0;
    let ball_active = 0;
    let ball_still_in_range = (0);
    let allow_drag = (teleds_flags & 1) != 0;
    let is_teleport = (teleds_flags & 2) != 0;
    let vault_guard = vault_occupied(game.u.urooms) ? findgd() : null;
    if (game.u.utraptype == TT_BURIEDBALL) {
        buried_ball_to_punishment();
    }
    ball_active = ((game.uball != null) && game.uball.where != 0);
    if (!ball_active || near_capacity() > SLT_ENCUMBER || distmin(game.u.ux, game.u.uy, nux, nuy) > 1) {
        allow_drag = (0);
    }
    if (ball_active) {
        /* If they have to move the ball, then drag if allow_drag is true;
     * otherwise they are teleporting, so unplacebc().
     * If they don't have to move the ball, then always "drag" whether or
     * not allow_drag is true, because we are calling that function, not
     * to drag, but to move the chain.  *However*, there are some dumb
     * special cases:
     *    0                          0
     *   _X  move east       ----->  X_
     *    @                           @
     * These are permissible if teleporting, but not if dragging.  As a
     * result, drag_ball() needs to know about allow_drag and might end
     * up dragging the ball anyway.  Also, drag_ball() might find that
     * dragging the ball is completely impossible (ball in range but there's
     * rock in the way), in which case it teleports the ball on its own.
     */
        if (!((game.uball).where == 3) && distmin(nux, nuy, game.uball.ox, game.uball.oy) <= 2) {
            ball_still_in_range = (1);
        } else if (!allow_drag) {
            unplacebc();
        }
    }
    reset_utrap((0));
    /* set_ustuck(Null) clears uswallow */
    was_swallowed = game.u.uswallow;
    set_ustuck(null);
    game.u.ux0 = game.u.ux;
    game.u.uy0 = game.u.uy;
    if (!hideunder(game.youmonst) && game.youmonst.data.mlet == S_MIMIC) {
        /* don't have to move the ball */
        /* mimics stop being unnoticed */
        game.youmonst.m_ap_type = M_AP_NOTHING;
    }
    if (was_swallowed) {
        if ((game.uball != null)) {
            /* ball&chain are off map while swallowed */
            /* to put chain and non-carried ball on map */
            ball_active = (1);
            ball_still_in_range = allow_drag = (0);
        }
        docrt();
    }
    if (ball_active && (ball_still_in_range || allow_drag)) {
        let bc_control = 0;
        let ballx = 0;
        let bally = 0;
        let chainx = 0;
        let chainy = 0;
        let cause_delay = 0;
        if (drag_ball(nux, nuy, { get value() { return bc_control; }, set value(_v) { bc_control = _v; } }, { get value() { return ballx; }, set value(_v) { ballx = _v; } }, { get value() { return bally; }, set value(_v) { bally = _v; } }, { get value() { return chainx; }, set value(_v) { chainx = _v; } }, { get value() { return chainy; }, set value(_v) { chainy = _v; } }, { get value() { return cause_delay; }, set value(_v) { cause_delay = _v; } }, allow_drag)) {
            move_bc(0, bc_control, ballx, bally, chainx, chainy);
        } else {
            /* dragging fails if hero is encumbered beyond 'burdened' */
            /* uball might've been cleared via drag_ball -> spoteffects ->
               dotrap -> magic trap unpunishment */
            ball_active = ((game.uball != null) && game.uball.where != 0);
            if (ball_active) {
                unplacebc();
            }
        }
    }
    /* must set u.ux, u.uy after drag_ball(), which may need to know
       the old position if allow_drag is true... */
    /* set u.<x,y>, usteed-><mx,my>; cliparound() */
    u_on_newpos(nux, nuy);
    fill_pit(game.u.ux0, game.u.uy0);
    if (ball_active && game.uchain && game.uchain.where == 0) {
        placebc();
    }
    /* put back the ball&chain if they were taken off map */
    update_player_regions();
    /*
     *  Make sure the hero disappears from the old location.  This will
     *  not happen if she is teleported within sight of her previous
     *  location.  Force a full vision recalculation because the hero
     *  is now in a new location.
     */
    newsym(game.u.ux0, game.u.uy0);
    see_monsters();
    game.vision_full_recalc = 1;
    nomul(0);
    do {
        game.a11y.mon_notices_blocked++;
    } while (0);
    vision_recalc(0);
    /* this used to take place sooner, but if a --More-- prompt was issued
       then the old map display was shown instead of the new one */
    if (is_teleport && game.flags.verbose) {
        You("materialize in %s location!", (nux == game.u.ux0 && nuy == game.u.uy0) ? "the same" : "a different");
    }
    /* if terrain type changes, levitation or flying might become blocked
       or unblocked; might issue message, so do this after map+vision has
       been updated for new location instead of right after u_on_newpos() */
    if (game.level.locations[game.u.ux][game.u.uy].typ != game.level.locations[game.u.ux0][game.u.uy0].typ) {
        switch_terrain();
    }
    if (vault_guard) {
        /* sequencing issue:  we want guard's alarm, if any, to occur before
       room entry message, if any, so need to check for vault exit prior
       to spoteffects; but spoteffects() sets up new value for u.urooms
       and vault code depends upon that value, so we need to fake it */
        let save_urooms = [0, 0, 0, 0, 0];
        save_urooms = strcpy(save_urooms, game.u.urooms);
        strcpy(game.u.urooms, in_rooms(game.u.ux, game.u.uy, VAULT));
        /* if hero has left vault, make guard notice */
        if (!vault_occupied(game.u.urooms)) {
            uleftvault(vault_guard);
        }
        strcpy(game.u.urooms, save_urooms);
    }
    /* possible shop entry message comes after guard's shrill whistle */
    spoteffects((1));
    invocation_message();
    do {
        if (--game.a11y.mon_notices_blocked < 0) {
            impossible("mon_notices_blocked<0");
            game.a11y.mon_notices_blocked = 0;
        }
    } while (0);
    notice_all_mons((1));
    return;
}
/* make a list of coordinates in expanding distance from <cx,cy>;
   return value is number of coordinates inserted into ccc[]  */
/* pointer to array of at least size ROWNO*(COLNO-1) */
/* center point, not necessarily <u.ux,u.uy> */
/* how far from center to go collecting spots;
                             * 0 means collect entire map */
/* incl_center: put <cx,cy> in output list
                             * (provided that it passes filter, if any);
                             * unshuffled: keep output in collection order;
                             * ring_pairs: shuffle pairs of rings together
                             * instead of keeping each ring distinct;
                             * skip_mons: reject occupied spots;
                             * skip_inaccs: reject !ZAP_POS() spots */
/* if Null, no filtering */
export function collect_coords(ccc, cx, cy, maxradius, cc_flags, filter) {
    let cccIdx = 0;
    let passccIdx = 0;
    let x = 0;
    let y = 0;
    let lox = 0;
    let hix = 0;
    let loy = 0;
    let hiy = 0;
    let radius = 0;
    let rowrange = 0;
    let colrange = 0;
    let k = 0;
    let n = 0;
    let cc = { x: 0, y: 0 };
    let passcc = null;
    let newpass = 0;
    let passend = 0;
    let include_cxcy = (cc_flags & 1) != 0;
    let scramble = (cc_flags & 2) == 0;
    let ring_pairs = (scramble && (cc_flags & 4) != 0);
    let skip_mons = (cc_flags & 8) != 0;
    let skip_inaccessible = (cc_flags & 16) != 0;
    let result = 0;
    rowrange = (cy < Math.trunc(21 / 2)) ? (21 - 1 - cy) : cy;
    colrange = (cx < Math.trunc(80 / 2)) ? (80 - 1 - cx) : cx;
    k = ((rowrange) > (colrange) ? (rowrange) : (colrange));
    if (!maxradius) {
        maxradius = k;
    /* flag is negative; turn local variable into positive */
    /* if scrambling, shuffle rings 1+2, 3+4, &c together */
    /* exclude locations containing monsters from output */
    /* exclude !ZAP_POS() locations from output; allows pools+lava */
    /* if no radius limit has been specified, cover the whole map */
    } else {
        maxradius = ((maxradius) < (k) ? (maxradius) : (k));
    }
    for (radius = include_cxcy ? 0 : 1; radius <= maxradius; ++radius) {
        if (!ring_pairs) {
            newpass = passend = (1);
        } else {
            /* 0 (if include_cxcy) and maxradius override odd/even */
            newpass = ((radius % 2) != 0 || radius == 0);
            passend = ((radius % 2) == 0 || radius == maxradius);
        }
        if (newpass || !passcc) {
            /* !passcc is redundant but used to fend
                                   * off analyzers thinking use of passcc
                                   * below might occur while still Null */
            /* start of output entries for current radius (or
                           * first half of radius pair depending on flags) */
            passcc = ccc;
            passccIdx = cccIdx;
            /* number of entries for passcc; used for shuffling */
            n = 0;
        }
        lox = cx - radius , hix = cx + radius;
        loy = cy - radius , hiy = cy + radius;
        for (y = ((loy) > (0) ? (loy) : (0)); y <= hiy; ++y) {
            if (y > 21 - 1) {
                break;
            }
            for (x = ((lox) > (1) ? (lox) : (1)); x <= hix; ++x) {
                /* done with collection for current radius */
                if (x > 80 - 1) {
                    break;
                }
                if (x != lox && x != hix && y != loy && y != hiy) {
                    continue;
                }
                /* not any edge of ring/square */
                if ((skip_mons && (game.level.monsters[x][y])) || (skip_inaccessible && !((game.level.locations[x][y].typ) >= POOL))) {
                    continue;
                }
                if (filter && !(filter)(x, y)) {
                    continue;
                }
                cc.x = x , cc.y = y;
                ccc[cccIdx++] = { x: cc.x, y: cc.y };
                ++n;
                ++result;
            }
        }
        if (scramble && passend) {
            while (n > 1) {
                /* note: !ACCESSIBLE() would reject water and lava;
                       !ZAP_POS() accepts them; caller needs to handle such */
                /* shuffle entries gathered for current radius (or pair) */
                k = rn2(n);
                if (k) {
                    const __tmp = passcc[passccIdx];
                    passcc[passccIdx] = passcc[passccIdx + k];
                    passcc[passccIdx + k] = __tmp;
                }
                ++passccIdx;
                --n;
            }
        }
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/teleport.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("collect_coords(,%d,%d,%d,,)=%d", cx, cy, maxradius, result);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    return result;
}
/* [try to] teleport hero to a safe spot */
export function safe_teleds(teleds_flags) {
    let nux = 0;
    let nuy = 0;
    let cc_flags = 0;
    let candy = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    let backupspot = { x: 0, y: 0 };
    let tcnt = 0;
    let candycount = 0;
    for (tcnt = 0; tcnt < 40; ++tcnt) {
        /*
     * This used to try random locations up to 400 times, with first 200
     * tries disallowing trap locations and remaining 200 accepting such.
     * On levels without many accessible locations (either due to being
     * mostly stone or high monster population) it could fail to find a
     * spot.
     *
     * Now it tries completely randomly only 40 times, all disallowing
     * traps, then resorts to checking the entire map, near hero's spot
     * first then expanding out from there.  If no non-trap spot is found,
     * first trap spot is used.
     */
        nux = rnd(80 - 1);
        nuy = rn2(21);
        if (teleok(nux, nuy, (0))) {
            teleds(nux, nuy, teleds_flags);
            return (1);
        }
    }
    /* get a shuffled list of candidate locations, starting with spots
       1 or 2 steps from hero, then 3 or 4 steps, then 5 or 6, on up */
    cc_flags = 4 | 8;
    if (!(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        cc_flags |= 16;
    }
    candycount = collect_coords(candy, game.u.ux, game.u.uy, 0, cc_flags, null);
    backupspot.x = backupspot.y = 0;
    for (tcnt = 0; tcnt < candycount; ++tcnt) {
        /* skip trap locations via teleok(,,FALSE) but remember first
       encountered trap spot that is acceptable to teleok(,,TRUE) */
        nux = candy[tcnt].x , nuy = candy[tcnt].y;
        if (teleok(nux, nuy, (0))) {
            teleds(nux, nuy, teleds_flags);
            return (1);
        }
        if (!backupspot.x && t_at(nux, nuy) && teleok(nux, nuy, (1))) {
            backupspot.x = nux , backupspot.y = nuy;
        }
    }
    if (backupspot.x) {
        /* no non-trap spot found; if we skipped a viable trap spot, use it */
        teleds(backupspot.x, backupspot.y, teleds_flags);
        return (1);
    }
    return (0);
}
export function vault_tele() {
    let croom = search_special(VAULT);
    let c = { x: 0, y: 0 };
    if (croom && somexyspace(croom, c) && teleok(c.x, c.y, (0))) {
        teleds(c.x, c.y, 2);
        /* this is obviously a teleport scroll */
        return;
    }
    tele();
}
export function teleport_pet(mtmp, force_it) {
    let otmp = null;
    if (mtmp == game.u.usteed) {
        return (0);
    }
    if (mtmp.mleashed) {
        otmp = get_mleash(mtmp);
        if (!otmp) {
            impossible("%s is leashed, without a leash.", Monnam(mtmp));
            m_unleash(mtmp, (0));
            return (1);
        }
        if (otmp.cursed && !force_it) {
            yelp(mtmp);
            return (0);
        } else {
            release_it: {
                Your("leash goes slack.");
            }
            m_unleash(mtmp, (0));
            return (1);
        }
    }
    return (1);
}
/* teleport to random pet, if valid location next to it */
export function tele_to_rnd_pet() {
    let mtmp = null;
    let pet = null;
    let cnt = 0;
    if (noteleport_level(game.youmonst)) {
        impossible("%s", "attempt to teleport hero to be near a pet on no-teleport level");
        return;
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (!((mtmp).mhp < 1) && mtmp.mtame && !((mtmp).mstate != 0)) {
            cnt++;
            if (!rn2(cnt)) {
                pet = mtmp;
            }
        }
    }
    if (pet && !(dist2(((pet).mx), ((pet).my), game.u.ux, game.u.uy) <= 2)) {
        let tx = pet.mx + rn2(3) - 1;
        let ty = pet.my + rn2(3) - 1;
        if (isok(tx, ty) && teleok(tx, ty, (0))) {
            teleds(tx, ty, 2);
        }
    }
}
/* teleport the hero via some method other than scroll of teleport */
export function tele() {
    scrolltele(null);
}
/* teleport the hero; usually discover scroll of teleportation if via scroll */
export function scrolltele(scroll) {
    let cc = { x: 0, y: 0 };
    if (noteleport_level(game.youmonst) && !game.flags.debug) {
        /* Disable teleportation in stronghold && Vlad's Tower */
        pline("A mysterious force prevents you from teleporting!");
        if (scroll) {
            learnscroll(scroll);
        }
        return;
    }
    /* don't show trap if "Sorry..." */
    if (!(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)) {
        make_blinded(0, (0));
    }
    if ((game.u.uhave.amulet || On_W_tower_level(game.u.uz)) && !rn2(3)) {
        You_feel("disoriented for a moment.");
        /* don't discover the scroll [at least not yet for wizard override];
           disorientation doesn't reveal that this is a teleport attempt */
        if (!game.flags.debug || yn_function("Override?", ynchars, 110, (1)) != 121) {
            /* if in Knox and the requested level > 0, stay put.
         * we let negative values requests fall into the "heaven" loop.
         */
            return;
        }
    }
    if ((((game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic) || (scroll && scroll.blessed)) && !game.u.uprops[STUNNED].intrinsic) || game.flags.debug) {
        if (unconscious()) {
            pline("Being unconscious, you cannot control your teleport.");
        } else {
            let whobuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            whobuf = strcpy(whobuf, "you");
            if (game.u.usteed) {
                whobuf = (whobuf || '') + sprintf('', " and %s", mon_nam(game.u.usteed));
            }
            pline("Where do %s want to be teleported?", whobuf);
            if (scroll) {
                learnscroll(scroll);
            }
            cc.x = game.u.ux;
            cc.y = game.u.uy;
            if (isok(game.iflags.travelcc.x, game.iflags.travelcc.y)) {
                /* The player showed some interest in traveling here;
                 * pre-suggest this coordinate. */
                Object.assign(cc, game.iflags.travelcc);
            }
            if (getpos(cc, (1), "the desired position") < 0) {
                return;
            }
            if (teleok(cc.x, cc.y, (0))) {
                /* possible extensions: introduce a small error if
               magic power is low; allow transfer to solid rock */
                /* for scroll, discover it regardless of destination */
                teleds(cc.x, cc.y, 2);
                if (((game.iflags.travelcc.x) == game.u.ux && (game.iflags.travelcc.y) == game.u.uy)) {
                    game.iflags.travelcc.x = game.iflags.travelcc.y = 0;
                }
                return;
            }
            pline("Sorry...");
        }
    }
    /* we used to suppress discovery if hero teleported to a nearby
       spot which was already within view, but now there is always a
       "materialize" message regardless of how far you teleported so
       discovery of scroll type is unconditional */
    if (scroll) {
        learnscroll(scroll);
    }
    safe_teleds(2);
}
/* the #teleport command; 'm ^T' == choose among several teleport modes */
/*
             * Potential combinations:
             *  1) attempt ^T without intrinsic, not know spell;
             *  2) via intrinsic, not know spell, obey restrictions;
             *  3) via intrinsic, not know spell, ignore restrictions;
             *  4) via intrinsic, know spell, obey restrictions;
             *  5) via intrinsic, know spell, ignore restrictions;
             *  6) via spell, not have intrinsic, obey restrictions;
             *  7) via spell, not have intrinsic, ignore restrictions;
             *  8) force, obey other restrictions;
             *  9) force, ignore restrictions.
             * We only support the 1st (t), 2nd (n), 6th (s), and 9th (w).
             *
             * This ignores the fact that there is an experience level
             * (or poly-form) requirement which might make normal ^T fail.
             */
const __dotelecmd_tports = [{ menulet: 110, menudesc: "normal ^T on demand; no spell, obey restrictions" }, { menulet: 115, menudesc: "via spellcast; no intrinsic teleport" }, { menulet: 116, menudesc: "try ^T without having it; no spell" }, { menulet: 119, menudesc: "debug mode; ignore restrictions" }];
export function dotelecmd() {
    let save_HTele = 0;
    let save_ETele = 0;
    let res = 0;
    let added = 0;
    let hidden = 0;
    let ignore_restrictions = (0);
    /* normal mode; ignore 'm' prefix if it was given */
    if (!game.flags.debug) {
        return dotele((0)) ? 1 : 0;
    }
    added = hidden = 0;
    save_HTele = game.u.uprops[TELEPORT].intrinsic , save_ETele = game.u.uprops[TELEPORT].extrinsic;
    if (!game.iflags.menu_requested) {
        ignore_restrictions = (1);
    } else {
        let picks = null;
        let any = 0;
        let win = 0;
        let i = 0;
        let tmode = 0;
        let clr = 8;
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        any = cg.zeroany;
        for (i = 0; i < (Math.trunc(4 /* sizeof(const struct tporttypes [4]) */ / 1 /* sizeof(const struct tporttypes) */)); ++i) {
            any.a_int = __dotelecmd_tports[i].menulet;
            add_menu(win, nul_glyphinfo, any, any.a_int, 0, 0, clr, __dotelecmd_tports[i].menudesc, (__dotelecmd_tports[i].menulet == 119) ? 1 : 0);
        }
        (game.windowprocs.win_end_menu)(win, "Which way do you want to teleport?");
        i = select_menu(win, 1, picks);
        (game.windowprocs.win_destroy_nhwindow)(win);
        if (i > 0) {
            tmode = picks[0].item.a_int;
            /* if we got 2, use the one which wasn't preselected */
            if (i > 1 && tmode == 119) {
                tmode = picks[1].item.a_int;
            }
            free(picks);
        } else if (i == 0) {
            /* preselected one was explicitly chosen and got toggled off */
            tmode = 119;
        } else {
            return 0;
        }
        switch (tmode) {
            case 110:
                game.u.uprops[TELEPORT].intrinsic |= 536870912;
                /* confer intrinsic teleportation */
                hidden = tport_spell(1);
                break;
            case 115:
                game.u.uprops[TELEPORT].intrinsic = game.u.uprops[TELEPORT].extrinsic = 0;
                added = tport_spell(2);
                break;
            case 116:
                game.u.uprops[TELEPORT].intrinsic = game.u.uprops[TELEPORT].extrinsic = 0;
                hidden = tport_spell(1);
                break;
            case 119:
                ignore_restrictions = (1);
                break;
        }
    }
    /* if dotele() can be fatal, final disclosure might lie about
       intrinsic teleportation; we should be able to live with that
       since the menu finagling is only applicable in wizard mode */
    res = dotele(ignore_restrictions);
    game.u.uprops[TELEPORT].intrinsic = save_HTele;
    game.u.uprops[TELEPORT].extrinsic = save_ETele;
    if (added != 0 || hidden != 0) {
        tport_spell(added + hidden - 0);
    }
    return res ? 1 : 0;
}
/* True: wizard mode ^T */
export function dotele(break_the_rules) {
    let trap = null;
    let cantdoit = null;
    let trap_once = (0);
    trap = t_at(game.u.ux, game.u.uy);
    if (trap && !trap.tseen) {
        trap = null;
    }
    if (trap) {
        if (trap.ttyp == LEVEL_TELEP && trap.tseen) {
            if (yn_function("There is a level teleporter here. Trigger it?", ynchars, 110, (1)) == 121) {
                level_tele_trap(trap, 1);
                /* deliberate jumping will always take time even if it doesn't
                 * work */
                /* this failure in spelleffects() also uses the move */
                return 1;
            /* continue with normal horizontal teleport */
            } else {
                trap = null;
            }
        } else if (trap.ttyp == TELEP_TRAP) {
            /* trap may get deleted, save this */
            trap_once = trap.once;
            if (trap.once) {
                pline("This is a vault teleport, usable once only.");
                if (yn_function("Jump in?", ynchars, 110, (1)) == 110) {
                    trap = null;
                } else {
                    deltrap(trap);
                    newsym(game.u.ux, game.u.uy);
                }
            }
            if (trap) {
                You("%s onto the teleportation trap.", u_locomotion("jump"));
            }
        } else {
            trap = null;
        }
    }
    if (!trap && !break_the_rules) {
        let castit = (0);
        let energy = 0;
        if (!(game.u.uprops[TELEPORT].intrinsic || game.u.uprops[TELEPORT].extrinsic) || (game.u.ulevel < ((game.urole.mnum == (PM_WIZARD)) ? 8 : 12) && !(((game.youmonst.data).mflags1 & 33554432) != 0))) {
            /* Try to use teleport away spell. */
            let knownsp = known_spell(SPE_TELEPORT_AWAY);
            /* casting isn't inhibited by being Stunned (...it ought to be) */
            castit = (knownsp >= spe_Fresh && !game.u.uprops[CONFUSION].intrinsic);
            if (!castit && !break_the_rules) {
                You("%s.", (!(game.u.uprops[TELEPORT].intrinsic || game.u.uprops[TELEPORT].extrinsic) ? ((knownsp != spe_Unknown) ? "can't cast that spell" : "don't know that spell") : "are not able to teleport at will"));
                return 0;
            }
        }
        cantdoit = null;
        /* 3.6.2: the magic numbers for hunger, strength, and energy
           have been changed to match the ones used in spelleffects().
           Also, failing these tests used to return 1 and use a move
           even though casting failure due to these reasons doesn't.
           [Note: this spellev() is different from the one in spell.c
           but they both yield the same result.] */
        energy = 5 * (game.objects[SPE_TELEPORT_AWAY].oc_oc2);
        if (game.u.uhunger <= 10) {
            /* the addition of !break_the_rules to the outer if-block in
           1ada454f rendered this dead code */
            /* spell will cost more if carrying the Amulet, but the
               amount is rnd(2 * energy) so we can't know by how much;
               average is twice the normal cost, but could be triple;
               the extra energy is spent even if that results in not
               having enough to cast (which also uses the move) */
            cantdoit = "are too weak from hunger";
        } else if ((acurr(A_STR)) < 4) {
            cantdoit = "lack the strength";
        } else if (energy > game.u.uen) {
            cantdoit = "lack the energy";
        }
        if (cantdoit) {
            You("%s %s.", cantdoit, castit ? "for a teleport spell" : "to teleport");
            return 0;
        } else if (check_capacity("Your concentration falters from carrying so much.")) {
            return 1;
        }
        if (castit) {
            /* energy cost is deducted in spelleffects() */
            exercise(A_WIS, (1));
            if ((spelleffects(SPE_TELEPORT_AWAY, (1), (0)) & 1)) {
                return 1;
            } else if (!break_the_rules) {
                return 0;
            }
        } else {
            /* bypassing spelleffects(); apply energy cost directly */
            game.u.uen -= energy;
            game.disp.botl = (1);
        }
    }
    if (next_to_u()) {
        if (trap && trap_once) {
            vault_tele();
        } else if (trap && isok(trap.launch.x, trap.launch.y)) {
            /* could not find some other place to put mtmp; the level must
                 * be nearly or completely full */
            teleds(trap.launch.x, trap.launch.y, 2);
        } else {
            game.iflags.travelcc.x = game.iflags.travelcc.y = 0;
            tele();
        }
        next_to_u();
    } else {
        You("%s", c_common_strings.c_shudder_for_moment);
        return 0;
    }
    if (!trap) {
        morehungry(100);
    }
    return 1;
}
const __level_tele_get_there_from = "get there from %s.";
export function level_tele() {
    let newlev = 0;
    let newlevel = { dnum: 0, dlevel: 0 };
    /* when surviving dest of -N */
    let escape_by_flying = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let force_dest = (0);
    if (game.iflags.debug_fuzzer) {
        do {
            newlevel.dnum = rn2(game.n_dgns);
        } while (newlevel.dnum == (game.dungeon_topology.d_astral_level).dnum || game.dungeons[newlevel.dnum].flags.unconnected || !game.dungeons[newlevel.dnum].num_dunlevs);
        newlevel.dlevel = 1 + rn2(dunlevs_in_dungeon(newlevel));
        assign_level(game.u.ucamefrom, game.u.uz);
        schedule_goto(newlevel, UTOTYPE_NONE, null, null);
        return;
    }
    if ((game.u.uhave.amulet || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum))) && !game.flags.debug) {
        You_feel("very disoriented for a moment.");
        return;
    }
    let __do_random_levtport = false;
    let __controllable_taken = false;
    if (((game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic) && !game.u.uprops[STUNNED].intrinsic) || game.flags.debug) {
        __controllable_taken = true;
        let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let trycnt = 0;
        qbuf = strcpy(qbuf, "To what level do you want to teleport?");
        /* levTport_menu-force-menu fix */
        levtport_pick: do {
            let __force_menu = (0);
            if (game.iflags.menu_requested) {
                /* wizard mode 'm ^V' skips prompting on first pass
                   (note: level Tport via menu won't have any second pass) */
                game.iflags.menu_requested = (0);
                if (game.flags.debug) {
                    __force_menu = (1);
                }
            }
            if (!__force_menu) {
                if (++trycnt == 2) {
                    if (game.flags.debug) {
                        qbuf = strcat(qbuf, " [type a number, name, or ? for a menu]");
                    } else {
                        qbuf = strcat(qbuf, " [type a number or name]");
                    }
                }
                /* EDIT_GETLIN: if we're on second or later pass,
                            the previous input was invalid so don't use it
                            as getlin()'s preloaded default answer */
                buf = '';
                getlin(qbuf, buf);
                if (!strcmp(buf, "*")) {
                    __do_random_levtport = true;
                    break levtport_pick;
                } else if (game.u.uprops[CONFUSION].intrinsic && rnl(5)) {
                    pline("Oops...");
                    __do_random_levtport = true;
                    break levtport_pick;
                } else if (!strcmp(buf, "\x1b")) {
                    return;
                }
            }
            if (__force_menu || (game.flags.debug && !strcmp(buf, "?"))) {
                let destlev = 0;
                let destdnum = 0;
                newlev = print_dungeon((1), { get value() { return destlev; }, set value(_v) { destlev = _v; } }, { get value() { return destdnum; }, set value(_v) { destdnum = _v; } });
                if (!newlev) {
                    return;
                }
                newlevel.dnum = destdnum;
                newlevel.dlevel = destlev;
                if (((newlevel).dnum == (game.dungeon_topology.d_astral_level).dnum) && !((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
                    let amu = null;
                    if (!game.u.uhave.amulet && (amu = mksobj(AMULET_OF_YENDOR, (1), (0))) != null) {
                        /* ordinarily we'd use hold_another_object()
                           for something like this, but we don't want
                           fumbling or already full pack to interfere */
                        amu = addinv(amu);
                        prinv("Endgame prerequisite:", amu, 0);
                    }
                }
                force_dest = (1);
            } else if ((newlev = lev_by_name(buf)) == 0) {
                newlev = atoi(buf);
            }
        } while (!newlev && !digit(buf[0]) && (buf[0] != 45 || !digit(buf[1])) && trycnt < 10);
        if (!__do_random_levtport && newlev == 0) {
            if (trycnt >= 10) {
                __do_random_levtport = true;
            } else {
                if (yn_function("Go to Nowhere.  Are you sure?", ynqchars, 113, (1)) != 121) {
                    return;
                }
                You("%s in agony as your body begins to warp...", ((game.youmonst.data).msound == MS_SILENT) ? "writhe" : "scream");
                (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
                You("cease to exist.");
                if (game.invent) {
                    Your("possessions land on the %s with a thud.", surface(game.u.ux, game.u.uy));
                }
                game.killer.format = 2;
                game.killer.name = strcpy(game.killer.name, "committed suicide");
                done(DIED);
                pline("An energized cloud of dust begins to coalesce.");
                Your("body rematerializes%s.", game.invent ? ", and you gather up all your possessions" : "");
                return;
            }
        }
        if (!__do_random_levtport) {
            if (single_level_branch(game.u.uz) && newlev > 0 && !force_dest) {
                You("%s", c_common_strings.c_shudder_for_moment);
                return;
            }
            /* if in Quest, the player sees "Home 1", etc., on the status
         * line, instead of the logical depth of the level.  controlled
         * level teleport request is likely to be relativized to the
         * status line, and consequently it should be incremented to
         * the value of the logical depth of the target level.
         *
         * we let negative values requests fall into the "heaven" handling.
         */
            if (In_quest(game.u.uz) && newlev > 0) {
                newlev = newlev + game.dungeons[game.u.uz.dnum].depth_start - 1;
            }
        }
    }
    if (__do_random_levtport || !__controllable_taken) {
        newlev = random_teleport_level();
        if (newlev == depth(game.u.uz)) {
            You("%s", c_common_strings.c_shudder_for_moment);
            return;
        }
    }
    if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
        buried_ball_to_punishment();
    }
    if (!next_to_u() && !force_dest) {
        You("%s", c_common_strings.c_shudder_for_moment);
        return;
    }
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        let llimit = dunlevs_in_dungeon(game.u.uz);
        if (newlev >= 0 || newlev <= -llimit) {
            You_cant(__level_tele_get_there_from, "here");
            return;
        }
        newlevel.dnum = game.u.uz.dnum;
        newlevel.dlevel = llimit + newlev;
        schedule_goto(newlevel, UTOTYPE_NONE, null, null);
        return;
    }
    game.killer.name[0] = 0;
    if (game.iflags.debug_fuzzer && newlev < 0) {
        newlev = random_teleport_level();
        if (newlev == depth(game.u.uz)) {
            You("%s", c_common_strings.c_shudder_for_moment);
            return;
        }
    }
    if (newlev < 0 && !force_dest) {
        if (game.u.ushops0) {
            /* take unpaid inventory items off of shop bills */
            game.in_mklev = (1);
            u_left_shop(game.u.ushops0, (1));
            game.u.ushops0 = '';
            game.u.ushops = '';
            game.in_mklev = (0);
        }
        if (newlev <= -10) {
            You("arrive in heaven.");
            ;
            verbalize("Thou art early, but we'll admit thee.");
            game.killer.format = 2;
            game.killer.name = strcpy(game.killer.name, "went to heaven prematurely");
        } else if (newlev == -9) {
            You_feel("deliriously happy.");
            pline("(In fact, you're on Cloud 9!)");
            (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        } else {
            You("are now high above the clouds...");
        }
        if (game.killer.name[0]) {
            ;
        } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            /* arrival in heaven is pending */
            escape_by_flying = "float gently down to earth";
        } else if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            escape_by_flying = "fly down to the ground";
        } else {
            pline("Unfortunately, you don't know how to fly.");
            You("plummet a few thousand feet to your death.");
            game.killer.name = sprintf(game.killer.name, "teleported out of the dungeon and fell to %s death", (genders[game.flags.female ? 1 : 0].his));
            game.killer.format = 2;
        }
    }
    if (game.killer.name[0]) {
        /* the chosen destination was not survivable */
        let lsav = { dnum: 0, dlevel: 0 };
        /* set specific death location; this also suppresses bones */
        /* save current level; see below */
        Object.assign(lsav, game.u.uz);
        game.u.uz.dnum = 0;
        game.u.uz.dlevel = (newlev <= -10) ? -10 : 0;
        done(DIED);
        /* can only get here via life-saving (or declining to die in
           explore|debug mode); the hero has now left the dungeon... */
        escape_by_flying = "find yourself back on the surface";
        /* restore u.uz so escape code works */
        game.u.uz = lsav;
    }
    if (escape_by_flying) {
        /* calls done(ESCAPED) if newlevel==0 */
        You("%s.", escape_by_flying);
        /* [dlevel used to be set to 1, but it doesn't make sense to
            teleport out of the dungeon and float or fly down to the
            surface but then actually arrive back inside the dungeon] */
        newlevel.dnum = 0;
        newlevel.dlevel = 0;
    } else if (force_dest) {
        ;
    } else if (game.u.uz.dnum == (game.dungeon_topology.d_medusa_level).dnum && newlev >= game.dungeons[game.u.uz.dnum].depth_start + dunlevs_in_dungeon(game.u.uz)) {
        /* wizard mode menu; no further validation needed */
        find_hell(newlevel);
    } else {
        /* FIXME: we should avoid using hard-coded knowledge of
           which branches don't connect to anything deeper;
           mainly used to distinguish "can't get there from here"
           vs "from anywhere" rather than to control destination */
        let qbranch = In_quest(game.u.uz) ? (game.dungeon_topology.d_qstart_level) : In_mines(game.u.uz) ? (game.dungeon_topology.d_mineend_level) : (game.dungeon_topology.d_sanctum_level);
        let deepest = game.dungeons[qbranch.dnum].depth_start + dunlevs_in_dungeon(qbranch) - 1;
        if (!game.flags.debug && In_hell(game.u.uz) && !game.u.uevent.invoked && newlev >= deepest) {
            /* if invocation did not yet occur, teleporting into
         * the last level of Gehennom is forbidden.
         */
            newlev = deepest - 1;
            pline("Sorry...");
        }
        /* no teleporting out of quest dungeon */
        if (In_quest(game.u.uz) && newlev < depth((game.dungeon_topology.d_qstart_level))) {
            newlev = depth((game.dungeon_topology.d_qstart_level));
        }
        /* the player thinks of levels purely in logical terms, so
         * we must translate newlev to a number relative to the
         * current dungeon.
         */
        get_level(newlevel, newlev);
        if (on_level(newlevel, game.u.uz) && newlev != depth(game.u.uz)) {
            You_cant(__level_tele_get_there_from, (newlev > deepest) ? "anywhere" : "here");
            return;
        }
    }
    /* always wait until end of turn to change level, otherwise code
         * that references monsters as this call stack unwinds won't be
         * able to access them reliably; the do-the-change-now code here
         * dates from when reading a scroll of teleportation wouldn't
         * always make the scroll become discovered but that's no longer
         * the case so it shouldn't be needed anymore */
    /* in case player just read a scroll and is about to be asked to
       call it something, we can't defer until the end of the turn */
    schedule_goto(newlevel, UTOTYPE_NONE, null, game.flags.verbose ? "You materialize on a different level!" : null);
}
export function domagicportal(ttmp) {
    let target_level = { dnum: 0, dlevel: 0 };
    let totype = 0;
    let stunmsg = null;
    if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
        buried_ball_to_punishment();
    }
    if (!next_to_u()) {
        You("%s", c_common_strings.c_shudder_for_moment);
        return;
    }
    /* if landed from another portal, do nothing */
    /* problem: level teleport landing escapes the check */
    if (!on_level(game.u.uz, game.u.uz0)) {
        return;
    }
    You("activated a magic portal!");
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && !game.u.uhave.amulet) {
        /* prevent the poor shnook, whose amulet was stolen while in
     * the endgame, from accidently triggering the portal to the
     * next level, and thus losing the game
     */
        You_feel("dizzy for a moment, but nothing happens...");
        return;
    }
    Object.assign(target_level, ttmp.dst);
    if (((game.u.uz).dnum == (game.dungeon_topology.d_tutorial_dnum)) && !((target_level).dnum == (game.dungeon_topology.d_tutorial_dnum))) {
        /* coming back from tutorial doesn't trigger stunning */
        /* returning to normal play => arrive on level 1 stairs */
        totype = UTOTYPE_ATSTAIRS;
        stunmsg = "Resuming regular play.";
    } else {
        totype = UTOTYPE_PORTAL;
        stunmsg = !game.u.uprops[STUNNED].intrinsic ? "You feel slightly dizzy." : "You feel dizzier.";
        make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + 3, (0));
    }
    schedule_goto(target_level, totype, stunmsg, null);
}
let __tele_trap_in_tele_trap = (0);
export function tele_trap(trap) {
    /* a fixed-destination teleport trap could theoretically place hero onto a
     * second teleport trap; prevent the recursive call from spoteffects() from
     * triggering the trap at the destination */
    if (__tele_trap_in_tele_trap) {
        return;
    }
    __tele_trap_in_tele_trap = (1);
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || (game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) || noteleport_level(game.youmonst)) {
        if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
            shieldeff(game.u.ux, game.u.uy);
        }
        You_feel("a wrenching sensation.");
    } else if (!next_to_u()) {
        You("%s", c_common_strings.c_shudder_for_moment);
    } else if (trap.once) {
        deltrap(trap);
        newsym(game.u.ux, game.u.uy);
        vault_tele();
    } else if (isok(trap.launch.x, trap.launch.y)) {
        let cc = { x: 0, y: 0 };
        let mtmp = (game.level.monsters[trap.launch.x][trap.launch.y]);
        settrack();
        if (mtmp) {
            if (!enexto(cc, mtmp.mx, mtmp.my, mtmp.data)) {
                You("%s", c_common_strings.c_shudder_for_moment);
            } else {
                rloc_to(mtmp, cc.x, cc.y);
                /* no longer a monster at dest */
                mtmp = null;
            }
        }
        if (!mtmp) {
            teleds(trap.launch.x, trap.launch.y, 2);
        }
    } else {
        tele();
    }
    __tele_trap_in_tele_trap = (0);
}
export function level_tele_trap(trap, trflags) {
    let verbbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let intentional = (0);
    if ((trflags & (32 | 1)) != 0) {
        verbbuf = strcpy(verbbuf, "trigger");
        intentional = (1);
    } else {
        verbbuf = sprintf(verbbuf, "%s onto", u_locomotion("step"));
    }
    You("%s a level teleport trap!", verbbuf);
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) && !intentional) {
        shieldeff(game.u.ux, game.u.uy);
    }
    if (((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic) && !intentional) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        You_feel("a wrenching sensation.");
        return;
    }
    deltrap(trap);
    newsym(game.u.ux, game.u.uy);
    level_tele();
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || (game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic)) {
        You("briefly feel %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "oriented" : "centered");
    } else {
        You_feel("%sdisoriented.", game.u.uprops[CONFUSION].intrinsic ? "even more " : "");
    }
    /* magic portal traversal causes brief Stun; for level teleport, use
       confusion instead, and only when hero lacks control; do this after
       processing the level teleportation attempt because being confused
       can affect the outcome ("Oops" result) */
    if (!(game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic)) {
        make_confused((game.u.uprops[CONFUSION].intrinsic & 16777215) + 3, (0));
    }
}
/* check whether monster can arrive at location <x,y> via Tport (or fall) */
/* coordinates of candidate location */
export function rloc_pos_ok(x, y, mtmp) {
    let xx = 0;
    let yy = 0;
    if (!goodpos(x, y, mtmp, 8388608)) {
        return (0);
    }
    /*
     * Check for restricted areas present in some special levels.
     *
     * `xx' is current column; if 0, then `yy' will contain flag bits
     * rather than row:  bit #0 set => moving upwards; bit #1 set =>
     * inside the Wizard's tower.
     */
    xx = mtmp.mx;
    yy = mtmp.my;
    if (!xx) {
        /* no current location (migrating monster arrival) */
        if (game.dndest.nlx && On_W_tower_level(game.u.uz)) {
            return (((yy & 2) != 0) ^ !((x) >= (game.dndest.nlx) && (x) <= (game.dndest.nhx) && (y) >= (game.dndest.nly) && (y) <= (game.dndest.nhy)));
        }
        if (game.updest.lx && (yy & 1) != 0) {
            return (((x) >= (game.updest.lx) && (x) <= (game.updest.hx) && (y) >= (game.updest.ly) && (y) <= (game.updest.hy)) && (!game.updest.nlx || !((x) >= (game.updest.nlx) && (x) <= (game.updest.nhx) && (y) >= (game.updest.nly) && (y) <= (game.updest.nhy))));
        }
        if (game.dndest.lx && (yy & 1) == 0) {
            return (((x) >= (game.dndest.lx) && (x) <= (game.dndest.hx) && (y) >= (game.dndest.ly) && (y) <= (game.dndest.hy)) && (!game.dndest.nlx || !((x) >= (game.dndest.nlx) && (x) <= (game.dndest.nhx) && (y) >= (game.dndest.nly) && (y) <= (game.dndest.nhy))));
        }
    } else {
        if (mtmp.isshk && inhishop(mtmp)) {
            /* [try to] prevent a shopkeeper or temple priest from being
           sent out of his room (caller might resort to goodpos() if
           we report failure here, so this isn't full prevention) */
            if (game.level.locations[x][y].roomno != ((mtmp).mextra.eshk).shoproom) {
                return (0);
            }
        } else if (mtmp.ispriest && inhistemple(mtmp)) {
            if (game.level.locations[x][y].roomno != ((mtmp).mextra.epri).shroom) {
                return (0);
            }
        }
        /* current location is <xx,yy> */
        if (!tele_jump_ok(xx, yy, x, y)) {
            return (0);
        }
    }
    return (1);
}
/*
 * rloc_to()
 *
 * Pulls a monster from its current position and places a monster at
 * a new x and y.  If oldx is 0, then the monster was not in the
 * levels.monsters array.  However, if oldx is 0, oldy may still have
 * a value because mtmp is a migrating_mon.  Worm tails are always
 * placed randomly around the head of the worm.
 */
export function rloc_to_core(mtmp, x, y, rlocflags) {
    let oldx = mtmp.mx;
    let oldy = mtmp.my;
    let resident_shk = mtmp.isshk && inhishop(mtmp);
    let preventmsg = (rlocflags & 4) != 0;
    let vanishmsg = (rlocflags & 2) != 0;
    let appearmsg = (mtmp.mstrategy & 2147483648) != 0;
    let domsg = !game.in_mklev && (vanishmsg || appearmsg) && !preventmsg;
    let telemsg = (0);
    if (x == mtmp.mx && y == mtmp.my && (game.level.monsters[x][y]) == mtmp) {
        return;
    }
    if (oldx) {
        if (domsg && (canseemon(mtmp) || sensemon(mtmp))) {
            if (((game.viz_array[y][x] & 1) != 0) || sensemon(mtmp)) {
                telemsg = (1);
            } else {
                pline("%s vanishes!", Monnam(mtmp));
            }
            /* avoid "It suddenly appears!" for a STRAT_APPEARMSG monster
               that has just teleported away if we won't see it after this
               vanishing (the regular appears message will be given if we
               do see it) */
            appearmsg = (0);
        }
        if (mtmp.wormno) {
            remove_worm(mtmp);
        } else {
            game.level.monsters[oldx][oldy] = null;
            newsym(oldx, oldy);
        }
    }
    mon_track_clear(mtmp);
    place_monster(mtmp, x, y);
    update_monster_region(mtmp);
    if (mtmp.wormno) {
        place_worm_tail_randomly(mtmp, x, y);
    }
    if (game.u.ustuck == mtmp) {
        if (game.u.uswallow) {
            u_on_newpos(mtmp.mx, mtmp.my);
            check_special_room((0));
            docrt();
        } else if (!(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
            unstuck(mtmp);
        }
    }
    maybe_unhide_at(x, y);
    newsym(x, y);
    set_apparxy(mtmp);
    if (domsg && ((canseemon(mtmp) || sensemon(mtmp)) || appearmsg || mtmp == game.u.ustuck)) {
        let du = dist2((x), (y), game.u.ux, game.u.uy);
        let olddu = 0;
        let next = (du <= 2) ? " next to you" : null;
        let nearu = (du <= 8 * 8) ? " close by" : null;
        set_msg_xy(x, y);
        mtmp.mstrategy &= ~2147483648;
        if (mtmp == game.u.ustuck && !((game.u.ux0) == game.u.ux && (game.u.uy0) == game.u.uy)) {
            You("and %s teleport together.", mon_nam(mtmp));
        } else if (telemsg && (((game.viz_array[y][x] & 1) != 0) || sensemon(mtmp))) {
            pline("%s vanishes and reappears%s.", Monnam(mtmp), next ? next : nearu ? nearu : ((olddu = dist2((oldx), (oldy), game.u.ux, game.u.uy)) == du) ? "" : (du < olddu) ? " closer to you" : " farther away");
        } else {
            pline("%s %s%s%s!", appearmsg ? Amonnam(mtmp) : Monnam(mtmp), appearmsg ? "suddenly " : "", !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "appears" : "arrives", next ? next : nearu ? nearu : "");
        }
        /* wand discovery only happens if a messaage is delivered (bug?);
           if spell or q.mechanic attack or artifact #invoke for banish
           then current_wand will be Null */
        if (game.current_wand && game.current_wand.otyp == WAN_TELEPORTATION) {
            discover_object((WAN_TELEPORTATION), (1), (1), (1));
        }
    }
    /* shopkeepers will only teleport if you zap them with a wand of
       teleportation or if they've been transformed into a jumpy monster;
       the latter only happens if you've attacked them with polymorph
       [FIXME? or they've been hit by a genetic engineer, which won't
       necessarily be due to Conflict by hero] */
    if (resident_shk && !inhishop(mtmp)) {
        make_angry_shk(mtmp, oldx, oldy);
    }
    if (mtmp.minvent && !costly_spot(x, y)) {
        /* if a monster carrying shop goods teleports out of the shop, blame
       it on the hero; chance of an unpaid item is vanishingly small, but
       no_charge is easily possible and needs to be cleared if not in shop;
       a for-sale item is ordinary here--shk won't notice it leaving; if
       mtmp teleports from one shop into another, no_charge status sticks
       and an item on the first shk's bill stays there */
        let otmp = null;
        let shkp = find_objowner(mtmp.minvent, oldx, oldy);
        let peaceful = !shkp || shkp.mpeaceful;
        for (otmp = mtmp.minvent; otmp; otmp = otmp.nobj) {
            if (otmp.no_charge) {
                otmp.no_charge = 0;
            } else if (shkp && onshopbill(otmp, shkp, (1))) {
                stolen_value(otmp, oldx, oldy, peaceful, (0));
            }
        }
    }
    /* if hero is busy, maybe stop occupation */
    if (game.occupation) {
        dochugw(mtmp, (0));
    }
    /* trapped monster teleported away */
    if (mtmp.mtrapped && !mtmp.wormno) {
        mintrap(mtmp, 0);
    }
}
export function rloc_to(mtmp, x, y) {
    rloc_to_core(mtmp, x, y, 4);
}
export function rloc_to_flag(mtmp, x, y, rlocflags) {
    rloc_to_core(mtmp, x, y, rlocflags);
}
export function stairway_find_forwiz(isladder, up) {
    let stway = game.stairs;
    while (stway && !(stway.isladder == isladder && stway.up == up && stway.tolev.dnum == game.u.uz.dnum)) {
        stway = stway.next;
    }
    return stway;
}
/* place a monster at a random location, typically due to teleport;
   return TRUE if successful, FALSE if not; rlocflags is RLOC_foo flags */
/* mtmp->mx==0 implies migrating monster arrival */
export function rloc(mtmp, rlocflags) {
    let cc = { x: 0, y: 0 };
    let backupcc = { x: 0, y: 0 };
    let candy = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    let cc_flags = 0;
    let x = 0;
    let y = 0;
    let trycount = 0;
    let i = 0;
    let j = 0;
    let candycount = 0;
    found_xy: {
        if (mtmp == game.u.usteed) {
            tele();
            return (1);
        }
        if (mtmp.iswiz && mtmp.mx) {
            /* Wizard, not just arriving */
            let stway = null;
            if (!In_W_tower(game.u.ux, game.u.uy, game.u.uz)) {
                stway = stairway_find_forwiz((0), (1));
            } else if (!stairway_find_forwiz((1), (0))) {
                stway = stairway_find_forwiz((1), (1));
            } else {
                stway = stairway_find_forwiz((1), (0));
            }
            x = stway ? stway.sx : 0;
            y = stway ? stway.sy : 0;
            /* if the wiz teleports away to heal, try the up staircase,
           to block the player's escaping before he's healed
           (deliberately use `goodpos' rather than `rloc_pos_ok' here) */
            if (goodpos(x, y, mtmp, 0)) {
                break found_xy;
            }
        }
        if (game.iflags.mon_telecontrol && mtmp.mx) {
            /* wizard-mode player can choose destination by setting 'montelecontrol'
       option; ignored if/when this is arrival of a migrating monster */
            cc.x = mtmp.mx , cc.y = mtmp.my;
            if (control_mon_tele(mtmp, cc, rlocflags, (1))) {
                x = cc.x , y = cc.y;
                break found_xy;
            }
        }
        for (trycount = 0; trycount < 50; ++trycount) {
            /* this used to try randomly 1000 times, then fallback to left-to-right
       top-to-bottom exhaustive check; now that the exhaustive check uses
       randomized order, reduce the number of random attempts to 50;
       on levels with lots of available space, random can find a spot more
       quickly but might fail to find one no matter how many tries it makes */
            x = rnd(80 - 1);
            y = rn2(21);
            if (rloc_pos_ok(x, y, mtmp)) {
                break found_xy;
            }
        }
        /* try harder to find a good place; gather a list of all candidate
       locations (every accessible unoccupied spot except for hero's;
       goodpos() will reject that), then shuffle them ourselves instead
       of having collect_coords() do it (which would be in rings centered
       around arbitrary <COLNO/2,ROWNO/2>) */
        cc_flags = 1 | 2 | 8;
        if (!(((mtmp.data).mflags1 & 8) != 0)) {
            cc_flags |= 16;
        }
        candycount = collect_coords(candy, Math.trunc(80 / 2), Math.trunc(21 / 2), 0, cc_flags, null);
        backupcc.x = backupcc.y = 0;
        for (i = 0; i < candycount; ++i) {
            if ((j = rn2(candycount - i)) > 0) {
                Object.assign(cc, candy[i]);
                Object.assign(candy[i], candy[i + j]);
                Object.assign(candy[i + j], cc);
            }
            x = candy[i].x , y = candy[i].y;
            if (rloc_pos_ok(x, y, mtmp)) {
                break found_xy;
            }
            if (!backupcc.x && goodpos(x, y, mtmp, 0)) {
                backupcc.x = x , backupcc.y = y;
            }
        }
        if (!backupcc.x) {
            /* we didn't find any spot acceptable to rloc_pos_ok() which avoids
       'onscary' and honors teleport regions, but if we did find a spot
       that was acceptable to goodpos() (which ignores 'onscary' and
       teleport regions) we'll use that; otherwise give up */
            /* level either full of monsters or somehow faulty */
            if ((rlocflags & 1) != 0) {
                impossible("rloc(): couldn't relocate monster");
            }
            return (0);
        }
        x = backupcc.x , y = backupcc.y;
    }
    rloc_to_core(mtmp, x, y, rlocflags);
    return (1);
}
/* let wizard-mode player choose a teleporting monster's destination */
/* input: default spot; output: player selected spot */
export function control_mon_tele(mon, cc_p, rlocflags, via_rloc) {
    let tcbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!isok(cc_p.x, cc_p.y)) {
        cc_p.x = mon.mx , cc_p.y = mon.my;
        if (!isok(cc_p.x, cc_p.y)) {
            cc_p.x = game.u.ux , cc_p.y = game.u.uy;
        }
    }
    if (!game.flags.debug || !game.iflags.mon_telecontrol) {
        return (0);
    }
    pline("Teleport %s @ <%d,%d> where?", noit_mon_nam(mon), mon.mx, mon.my);
    tcbuf = sprintf(tcbuf, "where to teleport %s", noit_mon_nam(mon));
    if (getpos(cc_p, (0), tcbuf) >= 0 && !((cc_p.x) == game.u.ux && (cc_p.y) == game.u.uy)) {
        /* getpos '?' will show "Move the cursor to <where to teleport Foo>:" */
        if (via_rloc ? rloc_pos_ok(cc_p.x, cc_p.y, mon) : goodpos(cc_p.x, cc_p.y, mon, rlocflags)) {
            return (1);
        }
        if (!game.iflags.debug_fuzzer) {
            tcbuf = sprintf(tcbuf, "<%d,%d> is not considered viable; force anyway?", mon.mx, mon.my);
            if (yn_function(tcbuf, ynchars, 110, (1)) == 121) {
                return (1);
            }
        }
    }
    pline("%s destination.", via_rloc ? "Picking random" : "Using derived");
    return (0);
}
export function mvault_tele(mtmp) {
    let croom = search_special(VAULT);
    let c = { x: 0, y: 0 };
    if (croom && somexyspace(croom, c) && goodpos(c.x, c.y, mtmp, 0)) {
        rloc_to(mtmp, c.x, c.y);
        return;
    }
    rloc(mtmp, 0);
}
export function tele_restrict(mon) {
    if (noteleport_level(mon)) {
        if (canseemon(mon)) {
            pline("A mysterious force prevents %s from teleporting!", mon_nam(mon));
        }
        return (1);
    }
    return (0);
}
export function mtele_trap(mtmp, trap, in_sight) {
    let monname = null;
    /* don't print feedback here: a monster stepping on a trap and not
       teleporting from it isn't visible */
    if (noteleport_level(mtmp)) {
        return;
    }
    if (teleport_pet(mtmp, (0))) {
        /* save name with pre-movement visibility */
        monname = Monnam(mtmp);
        if (trap.once) {
            mvault_tele(mtmp);
        } else if (isok(trap.launch.x, trap.launch.y)) {
            if (!((game.level.monsters[trap.launch.x][trap.launch.y]) || ((trap.launch.x) == game.u.ux && (trap.launch.y) == game.u.uy))) {
                /* Note: don't remove the trap if a vault.  Other-
         * wise the monster will be stuck there, since
         * the guard isn't going to come for it...
         */
                /* monster teleporting onto hero's or another monster's spot does
             * not work the same as hero teleporting onto monster's spot where
             * the incoming monster displaces the resident to the nearest
             * possible space - instead it just doesn't work. */
                rloc_to_core(mtmp, trap.launch.x, trap.launch.y, 2);
            }
        } else {
            rloc(mtmp, 0);
        }
        if (in_sight) {
            if (canseemon(mtmp)) {
                pline("%s seems disoriented.", monname);
            } else {
                pline("%s suddenly disappears!", monname);
            }
            seetrap(trap);
        }
    }
}
/* return Trap_Effect_Finished if still on level, Trap_Moved_Mon if not */
export function mlevel_tele_trap(mtmp, trap, force_it, in_sight) {
    let tt = (trap ? trap.ttyp : NO_TRAP);
    if (mtmp == game.u.ustuck) {
        return Trap_Effect_Finished;
    }
    if (teleport_pet(mtmp, force_it)) {
        let tolevel = { dnum: 0, dlevel: 0 };
        let migrate_typ = 0;
        if (((tt) == HOLE || (tt) == TRAPDOOR)) {
            if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
                assign_level(tolevel, (game.dungeon_topology.d_valley_level));
            } else if (Is_botlevel(game.u.uz)) {
                if (in_sight && trap.tseen) {
                    pline_mon(mtmp, "%s avoids the %s.", Monnam(mtmp), (tt == HOLE) ? "hole" : "trap");
                }
                return Trap_Effect_Finished;
            } else {
                assign_level(tolevel, trap.dst);
                clamp_hole_destination(tolevel);
            }
        } else if (tt == MAGIC_PORTAL) {
            if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && (mon_has_amulet(mtmp) || is_home_elemental(mtmp.data) || rn2(7))) {
                if (in_sight && mtmp.data.mlet != S_ELEMENTAL) {
                    pline_mon(mtmp, "%s seems to shimmer for a moment.", Monnam(mtmp));
                    seetrap(trap);
                }
                return Trap_Effect_Finished;
            } else {
                assign_level(tolevel, trap.dst);
                migrate_typ = 8;
            }
        } else if (tt == LEVEL_TELEP || tt == NO_TRAP) {
            let nlev = 0;
            if (mon_has_amulet(mtmp) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || (tt == NO_TRAP && onscary(0, 0, mtmp))) {
                /* NO_TRAP is used when forcing a monster off the level;
                   onscary(0,0,) is true for the Wizard, Riders, lawful
                   minions, Angels of any alignment, shopkeeper or priest
                   currently inside his or her own special room */
                if (in_sight) {
                    pline_mon(mtmp, "%s seems very disoriented for a moment.", Monnam(mtmp));
                }
                return Trap_Effect_Finished;
            }
            if (tt == NO_TRAP) {
                /* creature is being forced off the level to make room;
                   it will try to return to this level (at a random spot
                   rather than its current one) if the level is left by
                   the hero and then revisited */
                assign_level(tolevel, game.u.uz);
            } else {
                nlev = random_teleport_level();
                if (nlev == depth(game.u.uz)) {
                    if (in_sight) {
                        pline_mon(mtmp, "%s shudders for a moment.", Monnam(mtmp));
                    }
                    return Trap_Effect_Finished;
                }
                get_level(tolevel, nlev);
            }
        } else {
            impossible("mlevel_tele_trap: unexpected trap type (%d)", tt);
            return Trap_Effect_Finished;
        }
        if (in_sight) {
            pline_mon(mtmp, "Suddenly, %s %s.", mon_nam(mtmp), (tt == HOLE) ? "falls into a hole" : (tt == TRAPDOOR) ? "falls through a trap door" : "disappears out of sight");
            if (trap) {
                seetrap(trap);
            }
        }
        if (((tt) >= TELEP_TRAP && (tt) <= MAGIC_PORTAL) && !(((mtmp.data).mflags1 & 67108864) != 0)) {
            mtmp.mconf = 1;
        }
        migrate_to_level(mtmp, ledger_no(tolevel), migrate_typ, null);
        return Trap_Moved_Mon;
    }
    return Trap_Effect_Finished;
}
/* place object randomly, returns False if it's gone (eg broken) */
export function rloco(obj) {
    let tx = 0;
    let ty = 0;
    let otx = 0;
    let oty = 0;
    let restricted_fall = 0;
    let try_limit = 4000;
    if (obj.otyp == CORPSE && ((game.mons[obj.corpsenm]) == game.mons[PM_DEATH] || (game.mons[obj.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[obj.corpsenm]) == game.mons[PM_PESTILENCE])) {
        if (revive_corpse(obj)) {
            return (0);
        }
    }
    obj_extract_self(obj);
    otx = obj.ox;
    oty = obj.oy;
    restricted_fall = (otx == 0 && game.dndest.lx);
    do {
        tx = (rn2(80 - 3) + (2));
        ty = rn2(21);
        if (!--try_limit) {
            break;
        }
    } while (!goodpos(tx, ty, null, 0) || (restricted_fall && (!((tx) >= (game.dndest.lx) && (tx) <= (game.dndest.hx) && (ty) >= (game.dndest.ly) && (ty) <= (game.dndest.hy)) || (game.dndest.nlx && ((tx) >= (game.dndest.nlx) && (tx) <= (game.dndest.nhx) && (ty) >= (game.dndest.nly) && (ty) <= (game.dndest.nhy))))) || (game.dndest.nlx && On_W_tower_level(game.u.uz) && ((tx) >= (game.dndest.nlx) && (tx) <= (game.dndest.nhx) && (ty) >= (game.dndest.nly) && (ty) <= (game.dndest.nhy)) != ((otx) >= (game.dndest.nlx) && (otx) <= (game.dndest.nhx) && (oty) >= (game.dndest.nly) && (oty) <= (game.dndest.nhy))));
    if (flooreffects(obj, tx, ty, "fall")) {
        /* on the Wizard Tower levels, objects inside should
                stay inside and objects outside should stay outside */
        /* update old location (if any) since flooreffects() couldn't;
           unblock_point() for boulder handled by obj_extract_self() */
        if (!(otx == 0 && oty == 0)) {
            newsym(otx, oty);
        }
        return (0);
    } else if (otx == 0 && oty == 0) {
        ;
    } else {
        let shkp = find_objowner(obj, otx, oty);
        let objinshop = shkp && costly_spot(otx, oty);
        let onboundary = shkp && costly_adjacent(shkp, otx, oty);
        if (objinshop || (obj.unpaid && onboundary)) {
            /* fell through a trap door; no update of old loc needed */
            /*
         * If object starts inside shop or is unpaid and on shop boundary:
         * if hero is outside the shop, treat this as theft;
         * otherwise, if it arrives inside same shop, remove it from bill;
         * otherwise, if it arrives on the boundary, add it to bill;
         * if it arrives outside the shop, treat this as a theft.
         * Billing routines deal with obj->no_charge.
         */
            let h = in_rooms(game.u.ux, game.u.uy, SHOPBASE);
            let oo = in_rooms(otx, oty, 0);
            let hinshop = h && strchr(in_rooms(shkp.mx, shkp.my, 0), h);
            if (hinshop && costly_spot(tx, ty) && oo && strchr(in_rooms(tx, ty, 0), oo)) {
                /* verify that it's the same shop */
                if (obj.unpaid) {
                    subfrombill(obj, shkp);
                }
            } else if (hinshop && costly_adjacent(shkp, tx, ty) && oo && strchr(in_rooms(tx, ty, 0), oo)) {
                if (!obj.unpaid) {
                    addtobill(obj, (0), (0), (0));
                }
            } else {
                stolen_value(obj, otx, oty, (0), (0));
            }
        }
        newsym(otx, oty);
    }
    place_object(obj, tx, ty);
    /* note: block_point() for boulder handled by place_object() */
    newsym(tx, ty);
    return (1);
}
/* Returns an absolute depth */
export function random_teleport_level() {
    let nlev = 0;
    let max_depth = 0;
    let min_depth = 0;
    let cur_depth = depth(game.u.uz);
    /* [the endgame case can only occur in wizard mode] */
    if (!rn2(5) || single_level_branch(game.u.uz) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        return cur_depth;
    }
    if (In_quest(game.u.uz)) {
        /* What I really want to do is as follows:
     * -- If in a dungeon that goes down, the new level is to be restricted
     *    to [top of parent, bottom of current dungeon]
     * -- If in a dungeon that goes up, the new level is to be restricted
     *    to [top of current dungeon, bottom of parent]
     * -- If in a quest dungeon or similar dungeon entered by portals,
     *    the new level is to be restricted to [top of current dungeon,
     *    bottom of current dungeon]
     * The current behavior is not as sophisticated as that ideal, but is
     * still better what we used to do, which was like this for players
     * but different for monsters for no obvious reason.  Currently, we
     * must explicitly check for special dungeons.  We check for Knox
     * above; endgame is handled in the caller due to its different
     * message ("disoriented").
     * --KAA
     * 3.4.2: explicitly handle quest here too, to fix the problem of
     * monsters sometimes level teleporting out of it into main dungeon.
     * Also prevent monsters reaching the Sanctum prior to invocation.
     */
        let bottom = dunlevs_in_dungeon(game.u.uz);
        let qlocate_depth = (game.dungeon_topology.d_qlocate_level).dlevel;
        /* if hero hasn't reached the middle locate level yet,
           no one can randomly teleport past it */
        if ((game.dungeons[(game.u.uz).dnum].dunlev_ureached) < qlocate_depth) {
            bottom = qlocate_depth;
        }
        min_depth = game.dungeons[game.u.uz.dnum].depth_start;
        max_depth = bottom + (game.dungeons[game.u.uz.dnum].depth_start - 1);
    } else {
        min_depth = 1;
        max_depth = dunlevs_in_dungeon(game.u.uz) + (game.dungeons[game.u.uz.dnum].depth_start - 1);
        /* can't reach Sanctum if the invocation hasn't been performed */
        if (In_hell(game.u.uz) && !game.u.uevent.invoked) {
            max_depth -= 1;
        }
    }
    /* Get a random value relative to the current dungeon */
    /* Range is 1 to current+3, current not counting */
    nlev = rn2(cur_depth + 3 - min_depth) + min_depth;
    if (nlev >= cur_depth) {
        nlev++;
    }
    if (nlev > max_depth) {
        nlev = max_depth;
        /* teleport up if already on bottom */
        if (Is_botlevel(game.u.uz)) {
            nlev -= rnd(3);
        }
    }
    if (nlev < min_depth) {
        nlev = min_depth;
        if (nlev == cur_depth) {
            nlev += rnd(3);
            if (nlev > max_depth) {
                nlev = max_depth;
            }
        }
    }
    return nlev;
}
/* you teleport a monster (via wand, spell, or poly'd q.mechanic attack);
   return false iff the attempt fails */
export function u_teleport_mon(mtmp, give_feedback) {
    let cc = { x: 0, y: 0 };
    if (game.level.flags.stasis_until >= game.moves) {
        if (give_feedback) {
            pline("A mysterious force prevents you teleporting %s!", mon_nam(mtmp));
        }
        return (0);
    } else if (mtmp.ispriest && in_rooms(mtmp.mx, mtmp.my, TEMPLE)) {
        if (give_feedback) {
            pline("%s resists your magic!", Monnam(mtmp));
        }
        return (0);
    } else if ((game.u.uswallow && (game.u.ustuck == (mtmp))) && noteleport_level(mtmp)) {
        if (give_feedback) {
            You("are no longer inside %s!", mon_nam(mtmp));
        }
        unstuck(mtmp);
        if (!rloc(mtmp, 2)) {
            m_into_limbo(mtmp);
        }
    } else if ((((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE]) || (((mtmp.data).mflags1 & 67108864) != 0)) && rn2(13) && enexto(cc, game.u.ux, game.u.uy, mtmp.data)) {
        rloc_to(mtmp, cc.x, cc.y);
    } else {
        if (!rloc(mtmp, 2)) {
            return (0);
        }
    }
    return (1);
}
/*teleport.c*/
/* skip first 'nearcandyct' spots, they have already been rejected;
       they will occur in different random order but same overall total */
/* to match placebc() below */
/* reset prior to spoteffects() */
/* swap [k] with [0] when k is 1..n-1 */
/* passcc[0] has reached its final place    */
/*
     * We operate on an expanding radius around the center, optionally
     * starting with the center spot itself, and shuffle the edges of
     * each expanding square or "ring".  (So all 1's are shuffled at
     * end of the pass for radius==1, then all 2's at end of radius==2,
     * and so on.  Shuffling of each ring doesn't encroach on any of
     * the others except when ring_pairs mode is specified.)
     *
     * Diagram of first three rings (four if 'include_cxcy' is specified)
     *   rings       unshuffled output      sample shuffled output (varies)
     *  3333333     25 26  .  .  .  . 31     33 29  .  .  .  . 44
     *  3222223     32  9 10 11 12 13 33     35 22 16 14 24 13 40
     *  3211123     34 14  1  2  3 15  .     38 20  2  8  3 15  .
     *  3210123     .  16  4  0  5 17  .     .  11  1  0  6  9  .
     *  3211123     .  18  6  7  8 19 39     .  19  5  7  4 12 25
     *  3222223     40 20 21 22 23 24 41     43 10 21 17 23 18 27
     *  3333333     42  .  .  .  . 47 48     37  .  .  .  . 30 36
     * . == entry not shown to reduce clutter when viewing inner portion.
     *
     * The digits under 'rings' are ring number, which is also distmin
     * from center, indicating the order in which sets of spots are
     * evaluated.  Output gets collected in expanding rings.  For the
     * two output grids, the number shown represents the position in the
     * returned list of coordinates.  When shuffling while ring_pairs is
     * specified, the 1's and 2's will be mixed together, the 3's and
     * (unshown) 4's will be mixed together, and so forth.
     *
     * If caller processes the output list in order, the closest viable
     * spot will be chosen.  If a completely random spot is preferred,
     * the list can be requested to be unscrambled and then the caller
     * can shuffle it, overriding the collection rings.  A filter function
     * could be used to skip everything after the first acceptable spot.
     * 'ring_pairs' mode allows for choosing a very close spot that isn't
     * immediately adjacent to the center point, useful for emergency
     * teleport to not always end up at the closest possible spot.
     *
     * TODO:
     *  Redo filter interface to have caller pass in a context cookie
     *  that can be passed through to filter so that it could have access
     *  to more info than just <x,y>.  Also add a way to stop collecting
     *  when an optimal value is found, without checking and skipping the
     *  rest of the map.
     */
/* and become exempt from further shuffling */
/* can't both be non-NOOP so addition will yield the non-NOOP one */
/* no dungeon escape via this route */
/* you're now effectively out of the shop */
