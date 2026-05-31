/* NetHack 5.0	region.c	$NHDT-Date: 1727251269 2024/09/25 08:01:09 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.104 $ */
/* Copyright (c) 1996 by Jean-Christophe Collet  */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * This should really go into the level structure, but
 * I'll start here for ease. It *WILL* move into the level
 * structure eventually.
 */
import { game } from '../gstate.js';
import { alloc, free, memcpy, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, You_see, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcpy, strlen } from '../c2js-runtime/string.js';
import { isok } from './cmd.js';
import { c_common_strings, cg } from './decl.js';
import { newsym, show_glyph } from './display.js';
import { Monnam, m_monnam } from './do_name.js';
import { In_hell, In_mines, on_level } from './dungeon.js';
import { losehp } from './hack.js';
import { dist2 } from './hacklib.js';
import { find_mid } from './light.js';
import { killed, m_poisongas_ok, monkilled, setmangry, wake_nearto } from './mon.js';
import { Resists_Elem, monstseesu, monstunseesu } from './mondata.js';
import { BLINDED, EYE, GLYPH_ALTAR_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, HALF_PHDAM, LUNG, MAGICAL_BREATHING, MAX_GLYPH, MS_SILENT, M_SEEN_POISON, PLNMSG_ENVELOPED_IN_GAS, PM_FOG_CLOUD, PM_LONG_WORM, PM_MANES, POISON_RES, S_GOLEM, S_VORTEX, S_altar, S_arrow_trap, S_cloud, S_digbeam, S_goodpos, S_grave, S_ndoor, S_poisoncloud, S_stone, S_trwall, S_vwall, TOWEL, TRAPNUM, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned } from './nh-constants.js';
import { makeplural } from './objnam.js';
import { body_part } from './polyself.js';
import { make_blinded, set_itimeout } from './potion.js';
import { valid_cloud_pos } from './read.js';
import { d, rn2, rnd } from './rnd.js';
import { selection_getbounds, selection_getpoint } from './selvar.js';
import { sfi_any, sfi_boolean, sfi_char, sfi_int, sfi_long, sfi_nhrect, sfi_short, sfi_unsigned, sfo_any, sfo_boolean, sfo_char, sfo_int, sfo_long, sfo_nhrect, sfo_short, sfo_unsigned } from './sfbase.js';
import { safe_teleds } from './teleport.js';
import { block_point, does_block, unblock_point } from './vision.js';

const callbacks = [inside_gas_cloud, expire_gas_cloud];
/* Should be inlined. */
export function inside_rect(r, x, y) {
    return (x >= r.lx && x <= r.hx && y >= r.ly && y <= r.hy);
}
/*
 * Check if a point is inside a region.
 */
export function inside_region(reg, x, y) {
    let i = 0;
    if (reg == null || !inside_rect((reg.bounding_box), x, y)) {
        /* THEN return FALSE, means "still there" */
        return (0);
    }
    for (i = 0; i < reg.nrects; i++) {
        if (inside_rect((reg.rects[i]), x, y)) {
            /* OK, it's gone, you can free it! */
            return (1);
        }
    }
    return (0);
}
/*
 * Create a region. It does not activate it.
 */
export function create_region(rects, nrect) {
    let i = 0;
    let reg = null;
    reg = alloc(1 /* sizeof(NhRegion) */);
    memset(reg, 0, 1 /* sizeof(NhRegion) */);
    if (nrect > 0) {
        reg.bounding_box = rects[0];
    } else {
        reg.bounding_box.lx = 80;
        reg.bounding_box.ly = 21;
        reg.bounding_box.hx = 0;
        reg.bounding_box.hy = 0;
    }
    reg.nrects = nrect;
    reg.rects = (nrect > 0) ? alloc(nrect * 1 /* sizeof(NhRect) */) : null;
    for (i = 0; i < nrect; i++) {
        if (rects[i].lx < reg.bounding_box.lx) {
            reg.bounding_box.lx = rects[i].lx;
        }
        if (rects[i].ly < reg.bounding_box.ly) {
            reg.bounding_box.ly = rects[i].ly;
        }
        if (rects[i].hx > reg.bounding_box.hx) {
            reg.bounding_box.hx = rects[i].hx;
        }
        if (rects[i].hy > reg.bounding_box.hy) {
            reg.bounding_box.hy = rects[i].hy;
        }
        Object.assign(reg.rects[i], rects[i]);
    }
    reg.ttl = -1;
    reg.attach_2_u = (0);
    reg.attach_2_m = 0;
    reg.enter_msg = null;
    reg.leave_msg = null;
    reg.expire_f = (-1);
    reg.enter_f = (-1);
    reg.can_enter_f = (-1);
    reg.leave_f = (-1);
    reg.can_leave_f = (-1);
    reg.inside_f = (-1);
    ((reg).player_flags &= ~1);
    ((reg).player_flags |= 2);
    reg.n_monst = 0;
    reg.max_monst = 0;
    reg.monsters = null;
    reg.arg = cg.zeroany;
    return reg;
}
/*
 * Add rectangle to region.
 */
export function add_rect_to_reg(reg, rect) {
    let tmp_rect = null;
    tmp_rect = alloc((reg.nrects + 1) * 1 /* sizeof(NhRect) */);
    if (reg.nrects > 0) {
        memcpy(tmp_rect, reg.rects, reg.nrects * 1 /* sizeof(NhRect) */);
        free(reg.rects);
    }
    Object.assign(tmp_rect[reg.nrects], rect);
    reg.nrects++;
    reg.rects = tmp_rect;
    /* Update bounding box if needed */
    if (reg.bounding_box.lx > rect.lx) {
        reg.bounding_box.lx = rect.lx;
    }
    if (reg.bounding_box.ly > rect.ly) {
        reg.bounding_box.ly = rect.ly;
    }
    if (reg.bounding_box.hx < rect.hx) {
        reg.bounding_box.hx = rect.hx;
    }
    if (reg.bounding_box.hy < rect.hy) {
        reg.bounding_box.hy = rect.hy;
    }
}
/*
 * Add a monster to the region
 */
export function add_mon_to_reg(reg, mon) {
    let i = 0;
    let tmp_m = null;
    if (mon_in_region(reg, mon)) {
        /* if this is a long worm, it might already be present in the region;
       only include it once no matter how segments the region contains */
        if (mon.data != game.mons[PM_LONG_WORM]) {
            impossible("add_mon_to_reg: %s [#%u] already in region.", m_monnam(mon), mon.m_id);
        }
        return;
    }
    if (reg.max_monst <= reg.n_monst) {
        tmp_m = alloc(4 /* sizeof(unsigned int) */ * (reg.max_monst + 5));
        if (reg.max_monst > 0) {
            for (i = 0; i < reg.max_monst; i++) {
                tmp_m[i] = reg.monsters[i];
            }
            free(reg.monsters);
        }
        reg.monsters = tmp_m;
        reg.max_monst += 5;
    }
    reg.monsters[reg.n_monst++] = mon.m_id;
}
/*
 * Remove a monster from the region list (it left or died...)
 */
export function remove_mon_from_reg(reg, mon) {
    let i = 0;
    for (i = 0; i < reg.n_monst; i++) {
        if (reg.monsters[i] == mon.m_id) {
            reg.n_monst--;
            reg.monsters[i] = reg.monsters[reg.n_monst];
            return;
        }
    }
}
/*
 * Check if a monster is inside the region.
 * It's probably quicker to check with the region internal list
 * than to check for coordinates.
 */
export function mon_in_region(reg, mon) {
    let i = 0;
    for (i = 0; i < reg.n_monst; i++) {
        if (reg.monsters[i] == mon.m_id) {
            return (1);
        }
    }
    return (0);
}
/* not yet used */
/*
 * Clone (make a standalone copy) the region.
 */
/* ret_reg->attach_2_o = reg->attach_2_o; */
/* set/clear_hero_inside,&c*/
/*0*/
/* !SFCTOOL */
/*
 * Free mem from region.
 */
export function free_region(reg) {
    if (reg) {
        if (reg.rects) {
            free(reg.rects);
        }
        if (reg.monsters) {
            free(reg.monsters);
        }
        if (reg.enter_msg) {
            free(reg.enter_msg);
        }
        if (reg.leave_msg) {
            free(reg.leave_msg);
        }
        free(reg);
    }
}
/*
 * Add a region to the list.
 * This actually activates the region.
 */
export function add_region(reg) {
    let tmp_reg = null;
    let i = 0;
    let j = 0;
    if (game.max_regions <= game.n_regions) {
        tmp_reg = game.regions;
        game.regions = alloc((game.max_regions + 10) * 8 /* sizeof(NhRegion *) */);
        if (game.max_regions > 0) {
            memcpy(game.regions, tmp_reg, game.max_regions * 8 /* sizeof(NhRegion *) */);
            free(tmp_reg);
        }
        game.max_regions += 10;
    }
    game.regions[game.n_regions] = reg;
    game.n_regions++;
    for (i = reg.bounding_box.lx; i <= reg.bounding_box.hx; i++) {
        for (j = reg.bounding_box.ly; j <= reg.bounding_box.hy; j++) {
            /* Check for monsters inside the region */
            let mtmp = null;
            let is_inside = (0);
            /* Some regions can cross the level boundaries */
            if (!isok(i, j)) {
                continue;
            }
            if (inside_region(reg, i, j)) {
                is_inside = (1);
                /* if there's a monster here, add it to the region */
                if ((mtmp = (game.level.monsters[i][j])) != null) {
                    add_mon_to_reg(reg, mtmp);
                }
            }
            if (reg.visible) {
                /* leave this bit (to exclude long worm tails) out;
                       assume that worms use "cutaneous respiration" (they
                       breath through their skin rather than nose/gills/&c)
                       so their tails are susceptible to poison gas */
                if (is_inside) {
                    block_point(i, j);
                }
                if (((game.viz_array[j][i] & 2) != 0)) {
                    newsym(i, j);
                }
            }
        }
    }
    if (inside_region(reg, game.u.ux, game.u.uy)) {
        ((reg).player_flags |= 1);
    } else {
        ((reg).player_flags &= ~1);
    }
}
/*
 * Remove a region from the list & free it.
 */
export function remove_region(reg) {
    let i = 0;
    let x = 0;
    let y = 0;
    for (i = 0; i < game.n_regions; i++) {
        if (game.regions[i] == reg) {
            break;
        }
    }
    if (i == game.n_regions) {
        return;
    }
    /* remove region before potential newsym() calls, but don't free it yet */
    if (--game.n_regions != i) {
        game.regions[i] = game.regions[game.n_regions];
    }
    game.regions[game.n_regions] = null;
    /* Update screen if necessary */
    reg.ttl = -2;
    if (reg.visible) {
        let pass = 0;
        let tmp_uinwater = game.u.uinwater;
        for (pass = 1; pass <= (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? 1 : 2); ++pass) {
            /* need to process the region's spots twice, first unblocking all
           locations which no longer block line-of-sight, then redrawing
           spots within revised line-of-sight; skip second pass if blind */
            game.u.uinwater = (pass == 1) ? 0 : tmp_uinwater;
            for (x = reg.bounding_box.lx; x <= reg.bounding_box.hx; x++) {
                for (y = reg.bounding_box.ly; y <= reg.bounding_box.hy; y++) {
                    if (isok(x, y) && inside_region(reg, x, y)) {
                        if (pass == 1) {
                            /* The cloud no longer blocks vision.  cansee() checks shouldn't be made
       until all blocked spots have been unblocked, so we need two passes */
                            if (!does_block(x, y, game.level.locations[x][y])) {
                                unblock_point(x, y);
                            }
                        } else {
                            if (((game.viz_array[y][x] & 2) != 0)) {
                                newsym(x, y);
                            }
                        }
                    }
                }
            }
        }
        game.u.uinwater = tmp_uinwater;
    }
    free_region(reg);
}
/* !SFCTOOL */
/*
 * Remove all regions and clear all related data.  This must be done
 * when changing level, for instance.
 */
export function clear_regions() {
    let i = 0;
    for (i = 0; i < game.n_regions; i++) {
        free_region(game.regions[i]);
    }
    game.n_regions = 0;
    if (game.max_regions > 0) {
        free(game.regions);
    }
    game.max_regions = 0;
    game.regions = null;
}
/*
 * This function is called every turn.
 * It makes the regions age, if necessary and calls the appropriate
 * callbacks when needed.
 */
export function run_regions() {
    let i = 0;
    let j = 0;
    let k = 0;
    let f_indx = 0;
    /* reset some messaging variables */
    game.gas_cloud_diss_within = (0);
    game.gas_cloud_diss_seen = 0;
    for (i = game.n_regions - 1; i >= 0; i--) {
        if (game.regions[i].ttl == 0) {
            /* Do it backward because the array will be modified */
            if ((f_indx = game.regions[i].expire_f) == (-1) || (callbacks[f_indx])(game.regions[i], null)) {
                remove_region(game.regions[i]);
            }
        }
    }
    for (i = 0; i < game.n_regions; i++) {
        /* Process remaining regions */
        if (game.regions[i].ttl > 0) {
            game.regions[i].ttl--;
        }
        /* Check if player is inside region */
        f_indx = game.regions[i].inside_f;
        if (f_indx != (-1) && ((game.regions[i]).player_flags & 1)) {
            (callbacks[f_indx])(game.regions[i], null);
        }
        if (f_indx != (-1)) {
            for (j = 0; j < game.regions[i].n_monst; j++) {
                /* Check if any monster is inside region */
                let mtmp = find_mid(game.regions[i].monsters[j], 1);
                if (!mtmp || ((mtmp).mhp < 1) || (callbacks[f_indx])(game.regions[i], mtmp)) {
                    /* The monster died, remove it from list */
                    k = (game.regions[i].n_monst -= 1);
                    game.regions[i].monsters[j] = game.regions[i].monsters[k];
                    game.regions[i].monsters[k] = 0;
                    --j;
                }
            }
        }
    }
    if (game.gas_cloud_diss_within) {
        /* current slot has been reused; recheck it next */
        pline_The("gas cloud around you dissipates.");
        /* normally won't see additional dissipation when within */
        /* FIXME? this assumes that additional dissipation is close by */
        if (game.u.xray_range <= 1) {
            game.gas_cloud_diss_seen = 0;
        }
        game.gas_cloud_diss_within = (0);
    }
    if (game.gas_cloud_diss_seen) {
        You_see("%s gas cloud%s dissipate.", (game.gas_cloud_diss_seen == 1) ? "a" : "some", (((game.gas_cloud_diss_seen) == 1) ? "" : "s"));
        game.gas_cloud_diss_seen = 0;
    }
}
/*
 * check whether player enters/leaves one or more regions.
 */
export function in_out_region(x, y) {
    let i = 0;
    let f_indx = 0;
    for (i = 0; i < game.n_regions; i++) {
        /* First check if hero can do the move */
        /* Callbacks for the regions hero does leave */
        /* Callbacks for the regions hero does enter */
        if (game.regions[i].attach_2_u) {
            continue;
        }
        if (inside_region(game.regions[i], x, y) ? (!((game.regions[i]).player_flags & 1) && (f_indx = game.regions[i].can_enter_f) != (-1)) : (((game.regions[i]).player_flags & 1) && (f_indx = game.regions[i].can_leave_f) != (-1))) {
            if (!(callbacks[f_indx])(game.regions[i], null)) {
                return (0);
            }
        }
    }
    for (i = 0; i < game.n_regions; i++) {
        if (game.regions[i].attach_2_u) {
            continue;
        }
        if (((game.regions[i]).player_flags & 1) && !inside_region(game.regions[i], x, y)) {
            ((game.regions[i]).player_flags &= ~1);
            if (game.regions[i].leave_msg != null) {
                pline("%s", game.regions[i].leave_msg);
            }
            if ((f_indx = game.regions[i].leave_f) != (-1)) {
                (callbacks[f_indx])(game.regions[i], null);
            }
        }
    }
    for (i = 0; i < game.n_regions; i++) {
        if (game.regions[i].attach_2_u) {
            continue;
        }
        if (!((game.regions[i]).player_flags & 1) && inside_region(game.regions[i], x, y)) {
            ((game.regions[i]).player_flags |= 1);
            if (game.regions[i].enter_msg != null) {
                pline("%s", game.regions[i].enter_msg);
            }
            if ((f_indx = game.regions[i].enter_f) != (-1)) {
                (callbacks[f_indx])(game.regions[i], null);
            }
        }
    }
    return (1);
}
/*
 * check whether a monster enters/leaves one or more regions.
 */
export function m_in_out_region(mon, x, y) {
    let i = 0;
    let f_indx = 0;
    for (i = 0; i < game.n_regions; i++) {
        /* First check if mon can do the move */
        /* Callbacks for the regions mon does leave */
        /* Callbacks for the regions mon does enter */
        if (game.regions[i].attach_2_m == mon.m_id) {
            continue;
        }
        if (inside_region(game.regions[i], x, y) ? (!mon_in_region(game.regions[i], mon) && (f_indx = game.regions[i].can_enter_f) != (-1)) : (mon_in_region(game.regions[i], mon) && (f_indx = game.regions[i].can_leave_f) != (-1))) {
            if (!(callbacks[f_indx])(game.regions[i], mon)) {
                return (0);
            }
        }
    }
    for (i = 0; i < game.n_regions; i++) {
        if (game.regions[i].attach_2_m == mon.m_id) {
            continue;
        }
        if (mon_in_region(game.regions[i], mon) && !inside_region(game.regions[i], x, y)) {
            remove_mon_from_reg(game.regions[i], mon);
            if ((f_indx = game.regions[i].leave_f) != (-1)) {
                (callbacks[f_indx])(game.regions[i], mon);
            }
        }
    }
    for (i = 0; i < game.n_regions; i++) {
        if (game.regions[i].attach_2_m == mon.m_id) {
            continue;
        }
        if (!mon_in_region(game.regions[i], mon) && inside_region(game.regions[i], x, y)) {
            add_mon_to_reg(game.regions[i], mon);
            if ((f_indx = game.regions[i].enter_f) != (-1)) {
                (callbacks[f_indx])(game.regions[i], mon);
            }
        }
    }
    return (1);
}
/*
 * Checks player's regions after a teleport for instance.
 */
export function update_player_regions() {
    let i = 0;
    for (i = 0; i < game.n_regions; i++) {
        if (!game.regions[i].attach_2_u && inside_region(game.regions[i], game.u.ux, game.u.uy)) {
            ((game.regions[i]).player_flags |= 1);
        } else {
            ((game.regions[i]).player_flags &= ~1);
        }
    }
}
/*
 * Ditto for a specified monster.
 */
export function update_monster_region(mon) {
    let i = 0;
    for (i = 0; i < game.n_regions; i++) {
        if (inside_region(game.regions[i], mon.mx, mon.my)) {
            if (!mon_in_region(game.regions[i], mon)) {
                add_mon_to_reg(game.regions[i], mon);
            }
        } else {
            if (mon_in_region(game.regions[i], mon)) {
                remove_mon_from_reg(game.regions[i], mon);
            }
        }
    }
}
/* not yet used */
/*
 * Change monster pointer in gr.regions
 * This happens, for instance, when a monster grows and
 * need a new structure (internally that is).
 */
/*
 * Remove monster from all regions it was in (ie monster just died)
 */
/*0*/
/* per-turn damage inflicted by visible region; hides details from caller */
export function reg_damg(reg) {
    let damg = (!reg.visible || reg.ttl == -2) ? 0 : reg.arg.a_int;
    return damg;
}
/* check whether current level has any visible regions */
export function any_visible_region() {
    let i = 0;
    for (i = 0; i < game.n_regions; i++) {
        if (!game.regions[i].visible || game.regions[i].ttl == -2) {
            continue;
        }
        return (1);
    }
    return (0);
}
/* for the wizard mode #timeout command */
export function visible_region_summary(win) {
    let reg = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let typbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    let damg = 0;
    let hdr_done = 0;
    let fldsep = game.iflags.menu_tab_sep ? "\t" : "  ";
    for (i = 0; i < game.n_regions; i++) {
        reg = game.regions[i];
        if (!reg.visible || reg.ttl == -2) {
            continue;
        }
        if (!hdr_done++) {
            (game.windowprocs.win_putstr)(win, 0, "");
            (game.windowprocs.win_putstr)(win, 0, "Visible regions");
        }
        buf = sprintf(buf, "%5ld", reg.ttl + 1);
        /*
         * TODO? sort the regions by time-to-live or by bounding box.
         */
        /* we display relative time (turns left) rather than absolute
           (the turn when region will go away);
           since time-to-live has already been decremented, regions
           which are due to timeout on the next turn have ttl==0;
           adding 1 is intended to make the display be less confusing */
        damg = reg.arg.a_int;
        if (damg) {
            typbuf = sprintf(typbuf, "poison gas (%d)", damg);
        } else {
            typbuf = strcpy(typbuf, "vapor");
        }
        buf = (buf || '') + sprintf('', "%s%-16s", fldsep, typbuf);
        buf = (buf || '') + sprintf('', "%s@[%d,%d..%d,%d]", fldsep, reg.bounding_box.lx, reg.bounding_box.ly, reg.bounding_box.hx, reg.bounding_box.hy);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
}
/*
 * Check if a spot is under a visible region (eg: gas cloud).
 * Returns NULL if not, otherwise returns region.
 */
export function visible_region_at(x, y) {
    let i = 0;
    for (i = 0; i < game.n_regions; i++) {
        if (!game.regions[i].visible || game.regions[i].ttl == -2) {
            continue;
        }
        if (inside_region(game.regions[i], x, y)) {
            return game.regions[i];
        }
    }
    return null;
}
export function show_region(reg, x, y) {
    show_glyph(x, y, reg.glyph);
}
/**
 * save_regions :
 */
export function save_regions(nhfp) {
    let r = null;
    let i = 0;
    let j = 0;
    let n = 0;
    skip_lots: {
        if (!((nhfp).mode & (1 | 2))) {
            break skip_lots;
        }
        sfo_long(nhfp, { get value() { return game.moves; }, set value(_v) { game.moves = _v; } }, "region-tmstamp");
        ;
        sfo_int(nhfp, { get value() { return game.n_regions; }, set value(_v) { game.n_regions = _v; } }, "region-region_count");
        for (i = 0; i < game.n_regions; i++) {
            /* remove expired regions, do not trigger the expire_f callback (yet!);
       also update monster lists if this data is coming from a bones file */
            r = game.regions[i];
            sfo_nhrect(nhfp, r.bounding_box, "region-bounding_box");
            sfo_short(nhfp, { get value() { return r.nrects; }, set value(_v) { r.nrects = _v; } }, "region-nrects");
            for (j = 0; j < r.nrects; j++) {
                sfo_nhrect(nhfp, r.rects[j], "region-rect");
            }
            sfo_boolean(nhfp, { get value() { return r.attach_2_u; }, set value(_v) { r.attach_2_u = _v; } }, "region-attach_2_u");
            sfo_unsigned(nhfp, { get value() { return r.attach_2_m; }, set value(_v) { r.attach_2_m = _v; } }, "region-attach_2_m");
            n = 0;
            n = !r.enter_msg ? 0 : strlen(r.enter_msg);
            sfo_unsigned(nhfp, { get value() { return n; }, set value(_v) { n = _v; } }, "region-enter_msg_length");
            if (n > 0) {
                sfo_char(nhfp, r.enter_msg, "region-enter_msg", n);
            }
            n = !r.leave_msg ? 0 : strlen(r.leave_msg);
            sfo_unsigned(nhfp, { get value() { return n; }, set value(_v) { n = _v; } }, "region-leave_msg_length");
            if (n > 0) {
                sfo_char(nhfp, r.leave_msg, "region-leave_msg", n);
            }
            sfo_long(nhfp, { get value() { return r.ttl; }, set value(_v) { r.ttl = _v; } }, "region-ttl");
            ;
            sfo_short(nhfp, { get value() { return r.expire_f; }, set value(_v) { r.expire_f = _v; } }, "region-expire_f");
            sfo_short(nhfp, { get value() { return r.can_enter_f; }, set value(_v) { r.can_enter_f = _v; } }, "region-can_enter_f");
            sfo_short(nhfp, { get value() { return r.enter_f; }, set value(_v) { r.enter_f = _v; } }, "region-enter_f");
            sfo_short(nhfp, { get value() { return r.can_leave_f; }, set value(_v) { r.can_leave_f = _v; } }, "region-can_leave_f");
            sfo_short(nhfp, { get value() { return r.leave_f; }, set value(_v) { r.leave_f = _v; } }, "region-leave_f");
            sfo_short(nhfp, { get value() { return r.inside_f; }, set value(_v) { r.inside_f = _v; } }, "region-inside_f");
            sfo_unsigned(nhfp, { get value() { return r.player_flags; }, set value(_v) { r.player_flags = _v; } }, "region-player_flags");
            sfo_short(nhfp, { get value() { return r.n_monst; }, set value(_v) { r.n_monst = _v; } }, "region-monster_count");
            for (j = 0; j < r.n_monst; j++) {
                sfo_unsigned(nhfp, { get value() { return r.monsters[j]; }, set value(_v) { r.monsters[j] = _v; } }, "region-monster");
            }
            sfo_boolean(nhfp, { get value() { return r.visible; }, set value(_v) { r.visible = _v; } }, "region-visible");
            sfo_int(nhfp, { get value() { return r.glyph; }, set value(_v) { r.glyph = _v; } }, "region-glyph");
            sfo_any(nhfp, r.arg, "region-arg");
        }
    }
    if (((nhfp).mode & 4)) {
        clear_regions();
    }
}
/* !SFCTOOL */
export function rest_regions(nhfp) {
    let r = null;
    let i = 0;
    let j = 0;
    let n = 0;
    let tmstamp = 0;
    let msg_buf = null;
    let ghostly = (nhfp.ftype == 3);
    clear_regions();
    sfi_long(nhfp, { get value() { return tmstamp; }, set value(_v) { tmstamp = _v; } }, "region-tmstamp");
    ;
    if (ghostly) {
        tmstamp = 0;
    } else {
        tmstamp = (game.moves - tmstamp);
    }
    sfi_int(nhfp, { get value() { return game.n_regions; }, set value(_v) { game.n_regions = _v; } }, "region-region_count");
    ;
    game.max_regions = game.n_regions;
    if (game.n_regions > 0) {
        game.regions = alloc(game.n_regions * 8 /* sizeof(NhRegion *) */);
    }
    for (i = 0; i < game.n_regions; i++) {
        r = game.regions[i] = alloc(1 /* sizeof(NhRegion) */);
        sfi_nhrect(nhfp, r.bounding_box, "region-bounding box");
        sfi_short(nhfp, { get value() { return r.nrects; }, set value(_v) { r.nrects = _v; } }, "region-nrects");
        if (r.nrects > 0) {
            r.rects = alloc(r.nrects * 1 /* sizeof(NhRect) */);
        } else {
            r.rects = null;
        }
        for (j = 0; j < r.nrects; j++) {
            sfi_nhrect(nhfp, r.rects[j], "region-rect");
        }
        sfi_boolean(nhfp, { get value() { return r.attach_2_u; }, set value(_v) { r.attach_2_u = _v; } }, "region-attach_2_u");
        sfi_unsigned(nhfp, { get value() { return r.attach_2_m; }, set value(_v) { r.attach_2_m = _v; } }, "region-attach_2_m");
        ;
        sfi_unsigned(nhfp, { get value() { return n; }, set value(_v) { n = _v; } }, "region-enter_msg_length");
        ;
        if (n > 0) {
            msg_buf = alloc(n + 1);
            sfi_char(nhfp, msg_buf, "region-enter_msg", n);
            msg_buf[n] = 0;
        } else {
            msg_buf = null;
        }
        r.enter_msg = msg_buf;
        sfi_unsigned(nhfp, { get value() { return n; }, set value(_v) { n = _v; } }, "region-leave_msg_length");
        ;
        if (n > 0) {
            msg_buf = alloc(n + 1);
            sfi_char(nhfp, msg_buf, "region-leave_msg", n);
            msg_buf[n] = 0;
            r.leave_msg = msg_buf;
        } else {
            msg_buf = null;
        }
        r.leave_msg = msg_buf;
        sfi_long(nhfp, { get value() { return r.ttl; }, set value(_v) { r.ttl = _v; } }, "region-ttl");
        ;
        /* check for expired region */
        if (r.ttl >= 0) {
            r.ttl = (r.ttl > tmstamp) ? r.ttl - tmstamp : 0;
        }
        sfi_short(nhfp, { get value() { return r.expire_f; }, set value(_v) { r.expire_f = _v; } }, "region-expire_f");
        sfi_short(nhfp, { get value() { return r.can_enter_f; }, set value(_v) { r.can_enter_f = _v; } }, "region-can_enter_f");
        sfi_short(nhfp, { get value() { return r.enter_f; }, set value(_v) { r.enter_f = _v; } }, "region-enter_f");
        sfi_short(nhfp, { get value() { return r.can_leave_f; }, set value(_v) { r.can_leave_f = _v; } }, "region-can_leave_f");
        sfi_short(nhfp, { get value() { return r.leave_f; }, set value(_v) { r.leave_f = _v; } }, "region-leave_f");
        sfi_short(nhfp, { get value() { return r.inside_f; }, set value(_v) { r.inside_f = _v; } }, "region-inside_f");
        sfi_unsigned(nhfp, { get value() { return r.player_flags; }, set value(_v) { r.player_flags = _v; } }, "region-player_flags");
        ;
        /* settings pertained to old player */
        if (ghostly) {
            ((r).player_flags &= ~1);
            ((r).player_flags |= 2);
        }
        sfi_short(nhfp, { get value() { return r.n_monst; }, set value(_v) { r.n_monst = _v; } }, "region-monster_count");
        if (r.n_monst > 0) {
            r.monsters = alloc(r.n_monst * 4 /* sizeof(unsigned int) */);
        } else {
            r.monsters = null;
        }
        r.max_monst = r.n_monst;
        for (j = 0; j < r.n_monst; j++) {
            sfi_unsigned(nhfp, { get value() { return r.monsters[j]; }, set value(_v) { r.monsters[j] = _v; } }, "region-monster");
            ;
        }
        sfi_boolean(nhfp, { get value() { return r.visible; }, set value(_v) { r.visible = _v; } }, "region-visible");
        sfi_int(nhfp, { get value() { return r.glyph; }, set value(_v) { r.glyph = _v; } }, "region-glyph");
        ;
        sfi_any(nhfp, r.arg, "region-arg");
    }
    for (i = game.n_regions - 1; i >= 0; i--) {
        r = game.regions[i];
        if (r.ttl == 0) {
            remove_region(r);
        } else if (ghostly && r.n_monst > 0) {
            reset_region_mids(r);
        }
    }
}
/* to support '#stats' wizard-mode command */
export function region_stats(hdrfmt, hdrbuf, count, size) {
    let rg = null;
    let i = 0;
    hdrbuf = sprintf(hdrbuf, hdrfmt, 1 /* sizeof(NhRegion) */, 1 /* sizeof(NhRect) */);
    /* other stats formats take one parameter; this takes two */
    /* might be 0 even tho max_regions isn't */
    count.value = game.n_regions;
    size.value = game.max_regions * 1 /* sizeof(NhRegion) */;
    for (i = 0; i < game.n_regions; ++i) {
        rg = game.regions[i];
        size.value += rg.nrects * 1 /* sizeof(NhRect) */;
        if (rg.enter_msg) {
            size.value += (strlen(rg.enter_msg) + 1);
        }
        if (rg.leave_msg) {
            size.value += (strlen(rg.leave_msg) + 1);
        }
        size.value += rg.max_monst * 4 /* sizeof(unsigned int) */;
    }
}
/* update monster IDs for region being loaded from bones; `ghostly' implied */
export function reset_region_mids(reg) {
    let i = 0;
    let n = reg.n_monst;
    let mid_list = reg.monsters;
    while (i < n) {
        if (!lookup_id_mapping(mid_list[i], { get value() { return mid_list[i]; }, set value(_v) { mid_list[i] = _v; } })) {
            /* shrink list to remove missing monster; order doesn't matter */
            mid_list[i] = mid_list[--n];
        } else {
            ++i;
        }
    }
    reg.n_monst = n;
    return;
}
/* not yet used */
/*--------------------------------------------------------------*
 *                                                              *
 *                      Create Region with just a message       *
 *                                                              *
 *--------------------------------------------------------------*/
/*--------------------------------------------------------------*
 *                                                              *
 *                      Force Field Related Cod                 *
 *                      (unused yet)                            *
 *--------------------------------------------------------------*/
/* That means the player */
/* assume player has created it */
/* ff->can_enter_f = enter_force_field; */
/* ff->can_leave_f = enter_force_field; */
/*0*/
/*--------------------------------------------------------------*
 *                                                              *
 *                      Gas cloud related code                  *
 *                                                              *
 *--------------------------------------------------------------*/
/*
 * Here is an example of an expire function that may prolong
 * region life after some mods...
 */
/*ARGSUSED*/
export function expire_gas_cloud(p1, p2) {
    let reg = null;
    let damage = 0;
    let pass = 0;
    let x = 0;
    let y = 0;
    reg = p1;
    damage = reg.arg.a_int;
    if (damage >= 5) {
        /* If it was a thick cloud, it dissipates a little first */
        /* It dissipates, let's do less damage */
        damage = Math.trunc(damage / 2);
        reg.arg = cg.zeroany;
        reg.arg.a_int = damage;
        /* Here's the trick : reset ttl */
        reg.ttl = 2;
        return (0);
    }
    for (pass = 1; pass <= (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? 1 : 2); ++pass) {
        for (x = reg.bounding_box.lx; x <= reg.bounding_box.hx; x++) {
            for (y = reg.bounding_box.ly; y <= reg.bounding_box.hy; y++) {
                if (inside_region(reg, x, y)) {
                    if (pass == 1) {
                        if (!does_block(x, y, game.level.locations[x][y])) {
                            unblock_point(x, y);
                        }
                    } else {
                        if (!game.u.uswallow) {
                            if (((x) == game.u.ux && (y) == game.u.uy)) {
                                game.gas_cloud_diss_within = (1);
                            } else if (((game.viz_array[y][x] & 2) != 0)) {
                                game.gas_cloud_diss_seen++;
                            }
                        }
                    }
                }
            }
        }
    }
    return (1);
}
/* returns True if p2 is killed by region p1, False otherwise */
export function inside_gas_cloud(p1, p2) {
    let reg = p1;
    let mtmp = p2;
    let umon = mtmp ? mtmp : game.youmonst;
    let dam = reg.arg.a_int;
    /*
     * Gas clouds can't be targeted at water locations, but they can
     * start next to water and spread over it.
     */
    /* fog clouds maintain gas clouds, even poisonous ones */
    if (reg.ttl < 20 && umon && umon.data == game.mons[PM_FOG_CLOUD]) {
        reg.ttl += 5;
    }
    if (dam < 1) {
        return (0);
    }
    if (!mtmp) {
        /* if no damage then there's nothing to do here... */
        /* hero is indicated by Null rather than by &youmonst */
        if (m_poisongas_ok(game.youmonst) == 2) {
            return (0);
        }
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            Your("%s sting.", makeplural(body_part(EYE)));
            make_blinded(1, (0));
        }
        if (!(game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
            pline("%s is burning your %s!", c_common_strings.c_Something, makeplural(body_part(LUNG)));
            You("cough and spit blood!");
            wake_nearto(game.u.ux, game.u.uy, 2);
            dam = (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(dam) + 5) + 1) / 2)) : (rnd(dam) + 5));
            if ((game.ublindf && game.ublindf.otyp == TOWEL && game.ublindf.spe > 0)) {
                dam = Math.trunc((dam + 1) / 2);
            }
            losehp(dam, "gas cloud", 0);
            monstunseesu(M_SEEN_POISON);
            return (0);
        } else {
            You("cough!");
            wake_nearto(game.u.ux, game.u.uy, 2);
            monstseesu(M_SEEN_POISON);
            return (0);
        }
    } else {
        /* A monster is inside the cloud */
        mtmp = p2;
        if (m_poisongas_ok(mtmp) != 2) {
            if (!((mtmp.data).msound == MS_SILENT)) {
                if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0) || (dist2((mtmp.mx), (mtmp.my), game.u.ux, game.u.uy) < 8)) {
                    pline("%s coughs!", Monnam(mtmp));
                }
                wake_nearto(mtmp.mx, mtmp.my, 2);
            }
            if ((!((reg).player_flags & 2))) {
                setmangry(mtmp, (1));
            }
            if ((((mtmp.data).mflags1 & 4096) == 0) && mtmp.mcansee) {
                mtmp.mblinded = 1;
                mtmp.mcansee = 0;
            }
            if (Resists_Elem(mtmp, POISON_RES)) {
                return (0);
            }
            mtmp.mhp -= rnd(dam) + 5;
            if (((mtmp).mhp < 1)) {
                if ((!((reg).player_flags & 2))) {
                    killed(mtmp);
                } else {
                    monkilled(mtmp, "gas cloud", 7);
                }
                if (((mtmp).mhp < 1)) {
                    return (1);
                }
            }
        }
    }
    return (0);
}
export function is_hero_inside_gas_cloud() {
    let i = 0;
    for (i = 0; i < game.n_regions; i++) {
        if (((game.regions[i]).player_flags & 1) && game.regions[i].inside_f == 0) {
            return (1);
        }
    }
    return (0);
}
/* details of gas cloud creation which are common to create_gas_cloud()
   and create_gas_cloud_selection() */
export function make_gas_cloud(cloud, damage, inside_cloud) {
    if (!game.in_mklev && !game.context.mon_moving) {
        ((cloud).player_flags &= ~2);
    }
    cloud.inside_f = 0;
    cloud.expire_f = 1;
    cloud.arg = cg.zeroany;
    cloud.arg.a_int = damage;
    cloud.visible = (1);
    cloud.glyph = (((damage ? S_poisoncloud : S_cloud) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((damage ? S_poisoncloud : S_cloud) <= S_trwall) ? ((damage ? S_poisoncloud : S_cloud) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((damage ? S_poisoncloud : S_cloud) < S_altar) ? (((damage ? S_poisoncloud : S_cloud) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((damage ? S_poisoncloud : S_cloud) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((damage ? S_poisoncloud : S_cloud) < S_arrow_trap + (TRAPNUM - 1)) ? (((damage ? S_poisoncloud : S_cloud) - S_grave) + GLYPH_CMAP_B_OFF) : ((damage ? S_poisoncloud : S_cloud) <= S_goodpos) ? (((damage ? S_poisoncloud : S_cloud) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
    add_region(cloud);
    if (!game.in_mklev && !inside_cloud && is_hero_inside_gas_cloud()) {
        You("are enveloped in a cloud of %s!", damage ? "noxious gas" : "steam");
        game.iflags.last_msg = PLNMSG_ENVELOPED_IN_GAS;
    }
}
/* Create a gas cloud which starts at (x,y) and grows outward from it via
 * breadth-first search.
 * cloudsize is the number of squares the cloud will attempt to fill.
 * damage is how much it deals to afflicted creatures. */
export function create_gas_cloud(x, y, cloudsize, damage) {
    let cloud = null;
    let i = 0;
    let j = 0;
    let tmprect = { lx: 0, ly: 0, hx: 0, hy: 0 };
    let xcoords = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ycoords = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    xcoords[0] = x;
    ycoords[0] = y;
    let curridx = 0;
    /* initial spot is already taken */
    let newidx = 1;
    let inside_cloud = is_hero_inside_gas_cloud();
    /* a single-point cloud on hero and it deals no damage.
       probably a natural cause of being polyed. don't message about it */
    if (!game.context.mon_moving && ((x) == game.u.ux && (y) == game.u.uy) && cloudsize == 1 && (!damage || (damage && m_poisongas_ok(game.youmonst) == 2))) {
        inside_cloud = (1);
    }
    if (cloudsize > 150) {
        impossible("create_gas_cloud: cloud too large (%d)!", cloudsize);
        cloudsize = 150;
    }
    for (curridx = 0; curridx < newidx; curridx++) {
        if (newidx >= cloudsize) {
            break;
        }
        let xx = xcoords[curridx];
        let yy = ycoords[curridx];
        /* Do NOT check for if there is already a gas cloud created at some
         * other time at this position. They can overlap. */
        /* Primitive Fisher-Yates-Knuth shuffle to randomize the order of
         * directions chosen. */
        let dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        for (i = 4; i > 0; --i) {
            let swapidx = rn2(i);
            let tmp = dirs[swapidx];
            Object.assign(dirs[swapidx], dirs[i - 1]);
            Object.assign(dirs[i - 1], tmp);
        }
        /* # of valid adjacent spots */
        let nvalid = 0;
        for (i = 0; i < 4; ++i) {
            /* try all 4 cardinal directions */
            let dx = dirs[i].x;
            let dy = dirs[i].y;
            let isunpicked = (1);
            if (valid_cloud_pos(xx + dx, yy + dy)) {
                nvalid++;
                for (j = 0; j < newidx; ++j) {
                    if (xcoords[j] == xx + dx && ycoords[j] == yy + dy) {
                        /* don't pick a location we've already picked */
                        isunpicked = (0);
                        /* don't try further directions */
                        break;
                    }
                }
                /* randomly disrupt the natural breadth-first search, so that
                 * clouds released in open spaces don't always tend towards a
                 * rhombus shape */
                if (nvalid == 4 && !rn2(2)) {
                    continue;
                }
                if (isunpicked) {
                    xcoords[newidx] = xx + dx;
                    ycoords[newidx] = yy + dy;
                    newidx++;
                }
            }
            if (newidx >= cloudsize) {
                break;
            }
        }
    }
    /* We have now either filled up xcoord and ycoord entirely or run out
       of space.  In either case, newidx is the correct total number of
       coordinates inserted. */
    cloud = create_region(null, 0);
    for (i = 0; i < newidx; ++i) {
        tmprect.lx = tmprect.hx = xcoords[i];
        tmprect.ly = tmprect.hy = ycoords[i];
        add_rect_to_reg(cloud, tmprect);
    }
    cloud.ttl = (rn2(3) + (4));
    /* If cloud was constrained in small space, give it more time to live. */
    cloud.ttl = Math.trunc((cloud.ttl * cloudsize) / newidx);
    make_gas_cloud(cloud, damage, inside_cloud);
    return cloud;
}
/* create a single gas cloud from selection */
export function create_gas_cloud_selection(sel, damage) {
    let cloud = null;
    let tmprect = { lx: 0, ly: 0, hx: 0, hy: 0 };
    let x = 0;
    let y = 0;
    let r = cg.zeroNhRect;
    let inside_cloud = is_hero_inside_gas_cloud();
    selection_getbounds(sel, r);
    cloud = create_region(null, 0);
    for (x = r.lx; x <= r.hx; x++) {
        for (y = r.ly; y <= r.hy; y++) {
            if (selection_getpoint(x, y, sel)) {
                tmprect.lx = tmprect.hx = x;
                tmprect.ly = tmprect.hy = y;
                add_rect_to_reg(cloud, tmprect);
            }
        }
    }
    make_gas_cloud(cloud, damage, inside_cloud);
    return cloud;
}
/* for checking troubles during prayer; is hero at risk? */
export function region_danger() {
    let i = 0;
    let f_indx = 0;
    let n = 0;
    for (i = 0; i < game.n_regions; i++) {
        /* only care about regions that hero is in */
        if (!((game.regions[i]).player_flags & 1)) {
            continue;
        }
        f_indx = game.regions[i].inside_f;
        if (f_indx == 0) {
            /* the only type of region we understand is gas_cloud */
            /* completely harmless if you don't need to breathe */
            if (((((game.youmonst.data).mflags2 & 2) != 0) || (game.youmonst.data) == game.mons[PM_MANES] || (((game.youmonst.data).mlet == S_GOLEM) || (game.youmonst.data).mlet == S_VORTEX)) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) {
                continue;
            }
            /* minor inconvenience if you're poison resistant;
               not harmful enough to be a prayer-level trouble */
            if ((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
                continue;
            }
            ++n;
        }
    }
    return n ? (1) : (0);
}
/* for fixing trouble at end of prayer;
   danger detected at start of prayer might have expired by now */
export function region_safety() {
    let r = null;
    let i = 0;
    let f_indx = 0;
    let n = 0;
    for (i = 0; i < game.n_regions; i++) {
        if (!((game.regions[i]).player_flags & 1)) {
            continue;
        }
        f_indx = game.regions[i].inside_f;
        if (f_indx == 0) {
            if (!n++ && game.regions[i].ttl >= 0) {
                r = game.regions[i];
            }
        }
    }
    if (n > 1 || (n == 1 && !r)) {
        /* multiple overlapping cloud regions or non-expiring one */
        safe_teleds(0);
        if (region_danger()) {
            /* maybe there's no safe place available; must get hero out of danger
           or prayer's "fix all troubles" result will get stuck in a loop */
            set_itimeout({ get value() { return game.u.uprops[MAGICAL_BREATHING].intrinsic; }, set value(_v) { game.u.uprops[MAGICAL_BREATHING].intrinsic = _v; } }, (d(4, 4) + 4));
            /* not already Breathless or wouldn't be in region danger */
            You_feel("able to breathe.");
        }
    } else if (r) {
        remove_region(r);
        pline_The("gas cloud enveloping you dissipates.");
    } else {
        /* cloud dissipated on its own, so nothing needs to be done */
        pline_The("gas cloud has dissipated.");
    }
    /* maybe cure blindness too */
    if ((game.u.uprops[BLINDED].intrinsic & 16777215) == 1) {
        make_blinded(0, (1));
    }
}
/* !SFCTOOL */
/*region.c*/
/* FIXME: "steam" is wrong if this cloud is just the trail of
               a fog cloud's movement; changing to "vapor" would handle
               that but seems a step backward when it really is steam */
