/* NetHack 5.0	dbridge.c	$NHDT-Date: 1772771734 2026/03/05 20:35:34 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.70 $ */
/*      Copyright (c) 1989 by Jean-Christophe Collet              */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * This file contains the drawbridge manipulation (create, open, close,
 * destroy).
 *
 * Added comprehensive monster-handling, and the "entity" structure to
 * deal with players as well. - 11/89
 *
 * Any traps and/or engravings at either the portcullis or span location
 * are destroyed whenever the bridge is lowered, raised, or destroyed.
 * (Engraving handling could be extended to flag whether an engraving on
 * the DB_UNDER surface is hidden by the lowered bridge, or one on the
 * bridge itself is hidden because the bridge has been raised, but that
 * seems like an awful lot of effort for very little gain.)
 */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_hear, You_see, pline, pline_The } from '../c2js-runtime/pline.js';
import { strcat, strcpy } from '../c2js-runtime/string.js';
import { isok } from './cmd.js';
import { canseemon, newsym, sensemon } from './display.js';
import { flooreffects } from './do.js';
import { Monnam, hliquid, mon_nam } from './do_name.js';
import { on_level } from './dungeon.js';
import { is_fainted } from './eat.js';
import { done } from './end.js';
import { del_engr_at } from './engrave.js';
import { scatter } from './explode.js';
import { revive_nasty, spoteffects } from './hack.js';
import { dist2 } from './hacklib.js';
import { delallobj, sobj_at } from './invent.js';
import { mksobj_at, obj_extract_self } from './mkobj.js';
import { minliquid, monkilled, wake_nearto, xkilled } from './mon.js';
import { pronoun_gender } from './mondata.js';
import { BOULDER, BURNING, CONFUSION, CRUSHING, DBWALL, DEAF, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, DROWNING, FLYING, FUMBLING, HALLUC, HALLUC_RES, ICE, IRON_CHAIN, LAVAPOOL, LAVAWALL, LEVITATION, MAGICAL_BREATHING, MOAT, PASSES_WALLS, PM_FIRE_ELEMENTAL, PM_LONG_WORM_TAIL, PM_SALAMANDER, POOL, ROOM, STONE, STUNNED, SWIMMING, S_EYE, S_GHOST, S_LIGHT, WATER, WWALKING } from './nh-constants.js';
import { vtense } from './objnam.js';
import { update_monster_region } from './region.js';
import { rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { place_monster } from './steed.js';
import { enexto, teleds } from './teleport.js';
import { deltrap, drown, lava_effects, t_at, unconscious } from './trap.js';
import { block_point, does_block, unblock_point, vision_recalc } from './vision.js';

export function is_waterwall(x, y) {
    if (isok(x, y) && ((game.level.locations[x][y].typ) == WATER)) {
        return (1);
    }
    return (0);
}
export function is_pool(x, y) {
    let ltyp = 0;
    if (!isok(x, y)) {
        return (0);
    }
    ltyp = game.level.locations[x][y].typ;
    /* The ltyp == MOAT is not redundant with is_moat, because the
     * Juiblex level does not have moats, although it has MOATs. There
     * is probably a better way to express this. */
    if (ltyp == POOL || ltyp == MOAT || ltyp == WATER || is_moat(x, y)) {
        return (1);
    }
    return (0);
}
export function is_lava(x, y) {
    let ltyp = 0;
    if (!isok(x, y)) {
        return (0);
    }
    ltyp = game.level.locations[x][y].typ;
    if (ltyp == LAVAPOOL || ltyp == LAVAWALL || (ltyp == DRAWBRIDGE_UP && (game.level.locations[x][y].flags & 28) == 4)) {
        return (1);
    }
    return (0);
}
export function is_pool_or_lava(x, y) {
    if (is_pool(x, y) || is_lava(x, y)) {
        return (1);
    } else {
        return (0);
    }
}
export function is_ice(x, y) {
    let ltyp = 0;
    if (!isok(x, y)) {
        return (0);
    }
    ltyp = game.level.locations[x][y].typ;
    if (ltyp == ICE || (ltyp == DRAWBRIDGE_UP && (game.level.locations[x][y].flags & 28) == 8)) {
        return (1);
    }
    return (0);
}
export function is_moat(x, y) {
    let ltyp = 0;
    if (!isok(x, y)) {
        return (0);
    }
    ltyp = game.level.locations[x][y].typ;
    if (!(((((game.dungeon_topology.d_juiblex_level)).dlevel || ((game.dungeon_topology.d_juiblex_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_juiblex_level)))) && (ltyp == MOAT || (ltyp == DRAWBRIDGE_UP && (game.level.locations[x][y].flags & 28) == 0))) {
        return (1);
    }
    return (0);
}
export function db_under_typ(mask) {
    switch (mask & 28) {
        case 8:
            return ICE;
        case 4:
            return LAVAPOOL;
        case 0:
            return MOAT;
        default:
            return STONE;
    }
}
/*
 * We want to know whether a wall (or a door) is the portcullis (passageway)
 * of an eventual drawbridge.
 *
 * Return value:  the direction of the drawbridge, or -1 if not valid
 */
export function is_drawbridge_wall(x, y) {
    let lev = null;
    if (!isok(x, y)) {
        return -1;
    }
    lev = game.level.locations[x][y];
    if (lev.typ != DOOR && lev.typ != DBWALL) {
        return -1;
    }
    if (isok(x + 1, y) && ((game.level.locations[x + 1][y].typ) == DRAWBRIDGE_UP || (game.level.locations[x + 1][y].typ) == DRAWBRIDGE_DOWN) && (game.level.locations[x + 1][y].flags & 3) == 3) {
        return 3;
    }
    if (isok(x - 1, y) && ((game.level.locations[x - 1][y].typ) == DRAWBRIDGE_UP || (game.level.locations[x - 1][y].typ) == DRAWBRIDGE_DOWN) && (game.level.locations[x - 1][y].flags & 3) == 2) {
        return 2;
    }
    if (isok(x, y - 1) && ((game.level.locations[x][y - 1].typ) == DRAWBRIDGE_UP || (game.level.locations[x][y - 1].typ) == DRAWBRIDGE_DOWN) && (game.level.locations[x][y - 1].flags & 3) == 1) {
        return 1;
    }
    if (isok(x, y + 1) && ((game.level.locations[x][y + 1].typ) == DRAWBRIDGE_UP || (game.level.locations[x][y + 1].typ) == DRAWBRIDGE_DOWN) && (game.level.locations[x][y + 1].flags & 3) == 0) {
        return 0;
    }
    return -1;
}
/*
 * Use is_db_wall where you want to verify that a
 * drawbridge "wall" is UP in the location x, y
 * (instead of UP or DOWN, as with is_drawbridge_wall).
 */
export function is_db_wall(x, y) {
    return (game.level.locations[x][y].typ == DBWALL);
}
/*
 * Return true with x,y pointing to the drawbridge if x,y initially indicate
 * a drawbridge or drawbridge wall.
 */
export function find_drawbridge(x, y) {
    let dir = 0;
    if (((game.level.locations[x.value][y.value].typ) == DRAWBRIDGE_UP || (game.level.locations[x.value][y.value].typ) == DRAWBRIDGE_DOWN)) {
        return (1);
    }
    dir = is_drawbridge_wall(x.value, y.value);
    if (dir >= 0) {
        switch (dir) {
            case 0:
                (y.value)++;
                break;
            case 1:
                (y.value)--;
                break;
            case 2:
                (x.value)--;
                break;
            case 3:
                (x.value)++;
                break;
        }
        return (1);
    }
    return (0);
}
/*
 * Find the drawbridge wall associated with a drawbridge.
 */
export function get_wall_for_db(x, y) {
    switch (game.level.locations[x.value][y.value].flags & 3) {
        case 0:
            (y.value)--;
            break;
        case 1:
            (y.value)++;
            break;
        case 2:
            (x.value)++;
            break;
        case 3:
            (x.value)--;
            break;
    }
}
/*
 * Creation of a drawbridge at pos x,y.
 *     dir is the direction.
 *     flag must be put to TRUE if we want the drawbridge to be opened.
 */
export function create_drawbridge(x, y, dir, flag) {
    let x2 = 0;
    let y2 = 0;
    let horiz = 0;
    let lava = game.level.locations[x][y].typ == LAVAPOOL;
    x2 = x;
    y2 = y;
    switch (dir) {
        case 0:
            horiz = (1);
            y2--;
            break;
        case 1:
            horiz = (1);
            y2++;
            break;
        case 2:
            horiz = (0);
            x2++;
            break;
        default:
            impossible("bad direction in create_drawbridge");
            ;
        case 3:
            horiz = (0);
            x2--;
            break;
    }
    if (!((game.level.locations[x2][y2].typ) && (game.level.locations[x2][y2].typ) <= DBWALL)) {
        return (0);
    }
    if (flag) {
        game.level.locations[x][y].typ = DRAWBRIDGE_DOWN;
        game.level.locations[x2][y2].typ = DOOR;
        game.level.locations[x2][y2].flags = 0;
    } else {
        game.level.locations[x][y].typ = DRAWBRIDGE_UP;
        game.level.locations[x2][y2].typ = DBWALL;
        /* Drawbridges are non-diggable. */
        game.level.locations[x2][y2].flags = 8;
    }
    game.level.locations[x][y].horizontal = !horiz;
    game.level.locations[x2][y2].horizontal = horiz;
    game.level.locations[x][y].flags = dir;
    if (lava) {
        game.level.locations[x][y].flags |= 4;
    }
    return (1);
}
export function e_at(x, y) {
    let entitycnt = 0;
    for (entitycnt = 0; entitycnt < 2; entitycnt++) {
        if (game.occupants[entitycnt].edata && game.occupants[entitycnt].ex == x && game.occupants[entitycnt].ey == y) {
            break;
        }
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("entitycnt = %d", entitycnt);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    return (entitycnt == 2) ? null : (game.occupants[entitycnt]);
}
export function m_to_e(mtmp, x, y, etmp) {
    etmp.emon = mtmp;
    if (mtmp) {
        etmp.ex = x;
        etmp.ey = y;
        if (mtmp.wormno && (x != mtmp.mx || y != mtmp.my)) {
            etmp.edata = game.mons[PM_LONG_WORM_TAIL];
        } else {
            etmp.edata = mtmp.data;
        }
    } else {
        etmp.edata = null;
        etmp.ex = etmp.ey = 0;
    }
}
export function u_to_e(etmp) {
    etmp.emon = game.youmonst;
    etmp.ex = game.u.ux;
    etmp.ey = game.u.uy;
    etmp.edata = game.youmonst.data;
}
/* location of span or portcullis */
/* pointer to occupants[0] or occupants[1] */
export function set_entity(x, y, etmp) {
    if (((x) == game.u.ux && (y) == game.u.uy)) {
        u_to_e(etmp);
    /* m_at() might yield Null; that's ok */
    } else {
        m_to_e((game.level.monsters[x][y]), x, y, etmp);
    }
}
/*
 * e_strg is a utility routine which is not actually in use anywhere, since
 * the specialized routines below suffice for all current purposes.
 */
/* #define e_strg(etmp, func) (is_u(etmp) ? (char *) 0 : func(etmp->emon)) */
export function e_nam(etmp) {
    return (etmp.emon == game.youmonst) ? "you" : mon_nam(etmp.emon);
}
/*
 * Generates capitalized entity name, makes 2nd -> 3rd person conversion on
 * verb, where necessary.
 */
let __E_phrase_wholebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
export function E_phrase(etmp, verb) {
    __E_phrase_wholebuf = strcpy(__E_phrase_wholebuf, (etmp.emon == game.youmonst) ? "You" : Monnam(etmp.emon));
    if (!verb || !verb.value) {
        return __E_phrase_wholebuf;
    }
    __E_phrase_wholebuf = strcat(__E_phrase_wholebuf, " ");
    if ((etmp.emon == game.youmonst)) {
        __E_phrase_wholebuf = strcat(__E_phrase_wholebuf, verb);
    } else {
        __E_phrase_wholebuf = strcat(__E_phrase_wholebuf, vtense(null, verb));
    }
    return __E_phrase_wholebuf;
}
/*
 * Simple-minded "can it be here?" routine
 */
export function e_survives_at(etmp, x, y) {
    if (((etmp.edata).mlet == S_GHOST)) {
        return (1);
    }
    if (is_pool(x, y)) {
        return (((etmp.emon == game.youmonst) && (((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 512) != 0)) || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)) || (game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked))) || (((etmp.edata).mflags1 & 2) != 0) || (((etmp.edata).mflags1 & 1) != 0) || ((etmp.edata).mlet == S_EYE || (etmp.edata).mlet == S_LIGHT));
    }
    /* must force call to lava_effects in e_died if is_u */
    if (is_lava(x, y)) {
        return (((etmp.emon == game.youmonst) && (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked))) || (etmp.edata == game.mons[PM_FIRE_ELEMENTAL] || etmp.edata == game.mons[PM_SALAMANDER]) || (((etmp.edata).mflags1 & 1) != 0));
    }
    if (is_db_wall(x, y)) {
        return ((etmp.emon == game.youmonst) ? (game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) : (((etmp.edata).mflags1 & 8) != 0));
    }
    return (1);
}
export function e_died(etmp, xkill_flags, how) {
    if ((etmp.emon == game.youmonst)) {
        if (how == DROWNING) {
            /* drown() sets its own killer */
            /* lava_effects() sets own killer */
            game.killer.name[0] = 0;
            drown();
        } else if (how == BURNING) {
            game.killer.name[0] = 0;
            lava_effects();
        } else {
            let xy = { x: 0, y: 0 };
            if (!game.killer.name[0]) {
                /* use more specific killer if specified */
                game.killer.format = 0;
                game.killer.name = strcpy(game.killer.name, "falling drawbridge");
            }
            done(how);
            if (!e_survives_at(etmp, etmp.ex, etmp.ey)) {
                /* otherwise on top of the drawbridge is the
                 * only viable spot in the dungeon, so stay there
                 */
                if (enexto(xy, etmp.ex, etmp.ey, etmp.edata)) {
                    pline("A %s force teleports you away...", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : "strange");
                    teleds(xy.x, xy.y, 0);
                }
            }
        }
        /* we might have crawled out of the moat to survive */
        etmp.ex = game.u.ux , etmp.ey = game.u.uy;
    } else {
        let entitycnt = 0;
        game.killer.name[0] = 0;
        /* fake "digested to death" damage-type suppresses corpse */
        /* if monsters are moving, one of them caused the destruction */
        if (game.context.mon_moving) {
            monkilled(etmp.emon, (((xkill_flags & 1) != 0) ? null : ""), (((xkill_flags & 2) != 0) ? 26 : 0));
        } else {
            xkilled(etmp.emon, xkill_flags);
        }
        if (!((etmp.emon).mhp < 1)) {
            /* if etmp gets life-saved, kill it again; otherwise we might end up
           trying to place another monster (probably a xorn) on same spot */
            let seeit = (canseemon(etmp.emon) || sensemon(etmp.emon));
            xkill_flags |= 1 | 4;
            if (game.context.mon_moving) {
                monkilled(etmp.emon, "", (((xkill_flags & 2) != 0) ? 26 : 0));
            } else {
                xkilled(etmp.emon, xkill_flags);
            }
            if (((etmp.emon).mhp < 1)) {
                if (seeit) {
                    pline("Unfortunately for %s, %s is still crushed.", mon_nam(etmp.emon), (genders[pronoun_gender(etmp.emon, 2)].he));
                }
            } else {
                ;
            }
        }
        etmp.edata = null;
        for (entitycnt = 0; entitycnt < 2; entitycnt++) {
            if (etmp != (game.occupants[entitycnt]) && etmp.emon == game.occupants[entitycnt].emon) {
                game.occupants[entitycnt].edata = null;
            }
        }
    }
}
/*
 * These are never directly affected by a bridge or portcullis.
 */
export function automiss(etmp) {
    return (((etmp.emon == game.youmonst) ? (game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) : (((etmp.edata).mflags1 & 8) != 0)) || ((etmp.edata).mlet == S_GHOST));
}
/*
 * Does falling drawbridge or portcullis miss etmp?
 */
export function e_missed(etmp, chunks) {
    let misses = 0;
    if (chunks) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("Do chunks miss?");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
    if (automiss(etmp)) {
        return (1);
    }
    if ((((etmp.edata).mflags1 & 1) != 0) && ((etmp.emon == game.youmonst) ? !(game.multi < 0 && (unconscious() || is_fainted())) : !((etmp.emon).msleeping || !(etmp.emon).mcanmove))) {
        misses = 5;
    } else if (((etmp.edata).mlet == S_EYE || (etmp.edata).mlet == S_LIGHT) || ((etmp.emon == game.youmonst) && ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked))) {
        misses = 3;
    } else if (chunks && is_pool(etmp.ex, etmp.ey)) {
        misses = 2;
    /* flying requires mobility */
    /* doesn't require mobility */
    } else {
        misses = 0;
    }
    if (is_db_wall(etmp.ex, etmp.ey)) {
        misses -= 3;
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("Miss chance = %d (out of 8)", misses);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    return (misses >= rnd(8)) ? (1) : (0);
}
/*
 * Can etmp jump from death?
 */
export function e_jumps(etmp) {
    let tmp = 4;
    if ((etmp.emon == game.youmonst) ? ((game.multi < 0 && (unconscious() || is_fainted())) || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic)) : (((etmp.emon).msleeping || !(etmp.emon).mcanmove) || !etmp.edata.mmove || etmp.emon.wormno)) {
        return (0);
    }
    if ((etmp.emon == game.youmonst) ? game.u.uprops[CONFUSION].intrinsic : etmp.emon.mconf) {
        tmp -= 2;
    }
    if ((etmp.emon == game.youmonst) ? game.u.uprops[STUNNED].intrinsic : etmp.emon.mstun) {
        tmp -= 3;
    }
    if (is_db_wall(etmp.ex, etmp.ey)) {
        tmp -= 2;
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("%s to jump (%d chances in 10)", E_phrase(etmp, "try"), tmp);
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    return (tmp >= rnd(10)) ? (1) : (0);
}
export function do_entity(etmp) {
    let newx = 0;
    let newy = 0;
    let oldx = 0;
    let oldy = 0;
    let at_portcullis = 0;
    let must_jump = (0);
    let relocates = (0);
    let e_inview = 0;
    let crm = null;
    if (!etmp.edata) {
        return;
    }
    e_inview = ((etmp.emon == game.youmonst) || canseemon(etmp.emon));
    oldx = etmp.ex;
    oldy = etmp.ey;
    at_portcullis = is_db_wall(oldx, oldy);
    crm = game.level.locations[oldx][oldy];
    if (automiss(etmp) && e_survives_at(etmp, oldx, oldy)) {
        if (e_inview && (at_portcullis || ((crm.typ) == DRAWBRIDGE_UP || (crm.typ) == DRAWBRIDGE_DOWN))) {
            pline_The("%s passes through %s!", at_portcullis ? "portcullis" : "drawbridge", e_nam(etmp));
        }
        if ((etmp.emon == game.youmonst)) {
            spoteffects((0));
        }
        return;
    }
    if (e_missed(etmp, (0))) {
        if (at_portcullis) {
            pline_The("portcullis misses %s!", e_nam(etmp));
        } else {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("The drawbridge misses %s!", e_nam(etmp));
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
        }
        if (e_survives_at(etmp, oldx, oldy)) {
            /* Note: Beyond this point, we know we're  */
            return;
        } else {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Mon can't survive here");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (at_portcullis) {
                /* not at an opened drawbridge, since all  */
                /* *missable* creatures survive on the     */
                must_jump = (1);
            } else {
                /* square, and all the unmissed ones die.  */
                relocates = (1);
            }
        }
    } else {
        if (crm.typ == DRAWBRIDGE_DOWN) {
            if ((etmp.emon == game.youmonst)) {
                game.killer.format = 2;
                game.killer.name = strcpy(game.killer.name, "crushed to death underneath a drawbridge");
            }
            pline("%s crushed underneath the drawbridge.", E_phrase(etmp, "are"));
            e_died(etmp, 2 | (e_inview ? 0 : 1), CRUSHING);
            return;
        }
        must_jump = (1);
    }
    if (must_jump) {
        if (at_portcullis) {
            if (e_jumps(etmp)) {
                relocates = (1);
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        pline("Jump succeeds!");
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
            } else {
                if (e_inview) {
                    pline("%s crushed by the falling portcullis!", E_phrase(etmp, "are"));
                } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    ;
                    You_hear("a crushing sound.");
                }
                e_died(etmp, 2 | (e_inview ? 0 : 1), CRUSHING);
                return;
            }
        } else {
            /* tries to jump off bridge to original square */
            relocates = !e_jumps(etmp);
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Jump %s!", (relocates) ? "fails" : "succeeds");
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
        }
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("Doing relocation.");
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    /*
     * Here's where we try to do relocation.  Assumes that etmp is not
     * arriving at the portcullis square while the drawbridge is
     * falling, since this square would be inaccessible (i.e. etmp
     * started on drawbridge square) or unnecessary (i.e. etmp started
     * here) in such a situation.
     */
    newx = oldx;
    newy = oldy;
    find_drawbridge({ get value() { return newx; }, set value(_v) { newx = _v; } }, { get value() { return newy; }, set value(_v) { newy = _v; } });
    if ((newx == oldx) && (newy == oldy)) {
        get_wall_for_db({ get value() { return newx; }, set value(_v) { newx = _v; } }, { get value() { return newy; }, set value(_v) { newy = _v; } });
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("Checking new square for occupancy.");
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (relocates && (e_at(newx, newy))) {
        /*
         * Standoff problem: one or both entities must die, and/or
         * both switch places.  Avoid infinite recursion by checking
         * first whether the other entity is staying put.  Clean up if
         * we happen to move/die in recursion.
         */
        let other = null;
        other = e_at(newx, newy);
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("New square is occupied by %s", e_nam(other));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        if (e_survives_at(other, newx, newy) && automiss(other)) {
            relocates = (0);
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("%s suicide.", E_phrase(etmp, "commit"));
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
        } else {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Handling %s", e_nam(other));
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            while ((e_at(newx, newy) != null) && (e_at(newx, newy) != etmp)) {
                do_entity(other);
            }
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Checking existence of %s", e_nam(etmp));
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if (e_at(oldx, oldy) != etmp) {
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        pline("%s moved or died in recursion somewhere", E_phrase(etmp, "have"));
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                return;
            }
        }
    }
    if (relocates && !e_at(newx, newy)) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("Moving %s", e_nam(etmp));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        if (!(etmp.emon == game.youmonst)) {
            game.level.monsters[etmp.ex][etmp.ey] = null;
            /* if e_at() entity = worm tail */
            place_monster(etmp.emon, newx, newy);
            update_monster_region(etmp.emon);
        } else {
            game.u.ux = newx;
            game.u.uy = newy;
        }
        etmp.ex = newx;
        etmp.ey = newy;
        e_inview = ((etmp.emon == game.youmonst) || canseemon(etmp.emon));
    }
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            pline("Final disposition of %s", e_nam(etmp));
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (is_db_wall(etmp.ex, etmp.ey)) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("%s in portcullis chamber", E_phrase(etmp, "are"));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        if (e_inview) {
            if ((etmp.emon == game.youmonst)) {
                You("tumble towards the closed portcullis!");
                if (automiss(etmp)) {
                    You("pass through it!");
                } else {
                    pline_The("drawbridge closes in...");
                }
            } else {
                pline("%s behind the drawbridge.", E_phrase(etmp, "disappear"));
            }
        }
        if (!e_survives_at(etmp, etmp.ex, etmp.ey)) {
            game.killer.format = 0;
            game.killer.name = strcpy(game.killer.name, "closing drawbridge");
            e_died(etmp, 1, CRUSHING);
            return;
        }
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("%s in here", E_phrase(etmp, "survive"));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    } else {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("%s on drawbridge square", E_phrase(etmp, "are"));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        if (is_pool(etmp.ex, etmp.ey) && !e_inview) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                You_hear("a splash.");
            }
        }
        if (e_survives_at(etmp, etmp.ex, etmp.ey)) {
            if (e_inview && !(((etmp.edata).mflags1 & 1) != 0) && !((etmp.edata).mlet == S_EYE || (etmp.edata).mlet == S_LIGHT)) {
                pline("%s from the bridge.", E_phrase(etmp, "fall"));
            }
            return;
        }
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("%s cannot survive on the drawbridge square", E_phrase(etmp, null));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        if (is_pool(etmp.ex, etmp.ey) || is_lava(etmp.ex, etmp.ey)) {
            if (e_inview && !(etmp.emon == game.youmonst)) {
                /* drown() will supply msgs if nec. */
                let lava = is_lava(etmp.ex, etmp.ey);
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    pline("%s the %s and disappears.", E_phrase(etmp, "drink"), lava ? "lava" : "moat");
                } else {
                    pline("%s into the %s.", E_phrase(etmp, "fall"), lava ? hliquid("lava") : "moat");
                }
            }
        }
        game.killer.format = 2;
        game.killer.name = strcpy(game.killer.name, "fell from a drawbridge");
        e_died(etmp, 2 | (e_inview ? 0 : 1), is_pool(etmp.ex, etmp.ey) ? DROWNING : is_lava(etmp.ex, etmp.ey) ? BURNING : CRUSHING);
        return;
    }
}
/* clear stale reason for death and both 'entities' before returning */
export function nokiller() {
    game.killer.name[0] = 0;
    game.killer.format = 0;
    m_to_e(null, 0, 0, game.occupants[0]);
    m_to_e(null, 0, 0, game.occupants[1]);
}
/*
 * Close the drawbridge located at x,y
 */
export function close_drawbridge(x, y) {
    let lev1 = null;
    let lev2 = null;
    let t = null;
    let x2 = 0;
    let y2 = 0;
    lev1 = game.level.locations[x][y];
    if (lev1.typ != DRAWBRIDGE_DOWN) {
        return;
    }
    x2 = x;
    y2 = y;
    get_wall_for_db({ get value() { return x2; }, set value(_v) { x2 = _v; } }, { get value() { return y2; }, set value(_v) { y2 = _v; } });
    if (((game.viz_array[y][x] & 2) != 0) || ((game.viz_array[y2][x2] & 2) != 0)) {
        You_see("a drawbridge %s up!", (((game.u.ux == x || game.u.uy == y) && !(game.u.uinwater)) || dist2((x2), (y2), game.u.ux, game.u.uy) < dist2((x), (y), game.u.ux, game.u.uy)) ? "coming" : "going");
    } else {
        ;
        /* "5 gears turn" for castle drawbridge tune */
        You_hear("chains rattling and gears turning.");
    }
    lev1.typ = DRAWBRIDGE_UP;
    lev2 = game.level.locations[x2][y2];
    lev2.typ = DBWALL;
    switch (lev1.flags & 3) {
        case 0:
        case 1:
            lev2.horizontal = (1);
            break;
        case 3:
        case 2:
            lev2.horizontal = (0);
            break;
    }
    lev2.flags = 8;
    set_entity(x, y, (game.occupants[0]));
    /* do_entity for worm tails */
    set_entity(x2, y2, (game.occupants[1]));
    /* Do set_entity after first */
    /* do set_entity after first */
    do_entity((game.occupants[0]));
    set_entity(x2, y2, (game.occupants[1]));
    do_entity((game.occupants[1]));
    if ((game.level.objects[x][y] != null) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        ;
        You_hear("smashing and crushing.");
    }
    revive_nasty(x, y, null);
    revive_nasty(x2, y2, null);
    delallobj(x, y);
    delallobj(x2, y2);
    if ((t = t_at(x, y)) != null) {
        deltrap(t);
    }
    if ((t = t_at(x2, y2)) != null) {
        deltrap(t);
    }
    del_engr_at(x, y);
    del_engr_at(x2, y2);
    newsym(x, y);
    newsym(x2, y2);
    block_point(x2, y2);
    nokiller();
}
/*
 * Open the drawbridge located at x,y
 */
export function open_drawbridge(x, y) {
    let lev1 = null;
    let lev2 = null;
    let t = null;
    let x2 = 0;
    let y2 = 0;
    lev1 = game.level.locations[x][y];
    if (lev1.typ != DRAWBRIDGE_UP) {
        return;
    }
    x2 = x;
    y2 = y;
    get_wall_for_db({ get value() { return x2; }, set value(_v) { x2 = _v; } }, { get value() { return y2; }, set value(_v) { y2 = _v; } });
    if (((game.viz_array[y][x] & 2) != 0) || ((game.viz_array[y2][x2] & 2) != 0)) {
        You_see("a drawbridge %s down!", (dist2((x2), (y2), game.u.ux, game.u.uy) < dist2((x), (y), game.u.ux, game.u.uy)) ? "going" : "coming");
    } else {
        ;
        You_hear("gears turning and chains rattling.");
    }
    lev1.typ = DRAWBRIDGE_DOWN;
    lev2 = game.level.locations[x2][y2];
    lev2.typ = DOOR;
    lev2.flags = 0;
    set_entity(x, y, (game.occupants[0]));
    set_entity(x2, y2, (game.occupants[1]));
    do_entity((game.occupants[0]));
    set_entity(x2, y2, (game.occupants[1]));
    do_entity((game.occupants[1]));
    revive_nasty(x, y, null);
    delallobj(x, y);
    if ((t = t_at(x, y)) != null) {
        deltrap(t);
    }
    if ((t = t_at(x2, y2)) != null) {
        deltrap(t);
    }
    del_engr_at(x, y);
    del_engr_at(x2, y2);
    newsym(x, y);
    newsym(x2, y2);
    unblock_point(x2, y2);
    if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
        game.u.uevent.uopened_dbridge = (1);
    }
    nokiller();
}
/*
 * Let's destroy the drawbridge located at x,y
 */
export function destroy_drawbridge(x, y) {
    let lev1 = null;
    let lev2 = null;
    let t = null;
    let otmp = null;
    let x2 = 0;
    let y2 = 0;
    let i = 0;
    let e_inview = 0;
    let etmp1 = (game.occupants[0]);
    let etmp2 = (game.occupants[1]);
    lev1 = game.level.locations[x][y];
    if (!((lev1.typ) == DRAWBRIDGE_UP || (lev1.typ) == DRAWBRIDGE_DOWN)) {
        return;
    }
    x2 = x;
    y2 = y;
    get_wall_for_db({ get value() { return x2; }, set value(_v) { x2 = _v; } }, { get value() { return y2; }, set value(_v) { y2 = _v; } });
    lev2 = game.level.locations[x2][y2];
    if ((lev1.flags & 28) == 0 || (lev1.flags & 28) == 4) {
        let otmp2 = null;
        let lava = (lev1.flags & 28) == 4;
        ;
        if (lev1.typ == DRAWBRIDGE_UP) {
            if (((game.viz_array[y2][x2] & 2) != 0) || ((x2) == game.u.ux && (y2) == game.u.uy)) {
                pline_The("portcullis of the drawbridge falls into the %s!", lava ? hliquid("lava") : "moat");
            } else {
                You_hear("a loud *SPLASH*!");
            }
        } else {
            if (((game.viz_array[y][x] & 2) != 0) || ((x) == game.u.ux && (y) == game.u.uy)) {
                pline_The("drawbridge collapses into the %s!", lava ? hliquid("lava") : "moat");
            } else {
                You_hear("a loud *SPLASH*!");
            }
        }
        lev1.typ = lava ? LAVAPOOL : MOAT;
        lev1.flags = 0;
        if ((otmp2 = sobj_at(BOULDER, x, y)) != null) {
            obj_extract_self(otmp2);
            flooreffects(otmp2, x, y, "fall");
        }
    } else {
        ;
        if (((game.viz_array[y][x] & 2) != 0) || ((x) == game.u.ux && (y) == game.u.uy)) {
            pline_The("drawbridge disintegrates!");
        } else {
            You_hear("a loud *CRASH*!");
        }
        lev1.typ = ((lev1.flags & 8) ? ICE : ROOM);
        lev1.flags = ((lev1.flags & 8) ? 16 : 0);
    }
    wake_nearto(x, y, 500);
    lev2.typ = DOOR;
    lev2.flags = 0;
    if ((t = t_at(x, y)) != null) {
        deltrap(t);
    }
    if ((t = t_at(x2, y2)) != null) {
        deltrap(t);
    }
    del_engr_at(x, y);
    del_engr_at(x2, y2);
    for (i = rn2(6); i > 0; --i) {
        /* doesn't matter if we happen to pick <x,y2> or <x2,y>;
           since drawbridges are never placed diagonally, those
           pairings will always match one of <x,y> or <x2,y2> */
        otmp = mksobj_at(IRON_CHAIN, rn2(2) ? x : x2, rn2(2) ? y : y2, (1), (0));
        /* a force of 5 here would yield a radius of 2 for
           iron chain; anything less produces a radius of 1 */
        scatter(otmp.ox, otmp.oy, 1, (2 | 4), otmp);
    }
    newsym(x, y);
    newsym(x2, y2);
    if (!does_block(x2, y2, lev2)) {
        unblock_point(x2, y2);
    }
    vision_recalc(0);
    if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
        game.u.uevent.uopened_dbridge = (1);
    }
    /* currently only automissers can be here */
    set_entity(x2, y2, etmp2);
    if (etmp2.edata) {
        e_inview = ((etmp2.emon == game.youmonst) || canseemon(etmp2.emon));
        if (!automiss(etmp2)) {
            if (e_inview) {
                pline("%s blown apart by flying debris.", E_phrase(etmp2, "are"));
            }
            game.killer.format = 0;
            game.killer.name = strcpy(game.killer.name, "exploding drawbridge");
            e_died(etmp2, 2 | (e_inview ? 0 : 1), CRUSHING);
        }
    }
    set_entity(x, y, etmp1);
    if (etmp1.edata) {
        /* nothing which is vulnerable can survive this */
        e_inview = ((etmp1.emon == game.youmonst) || canseemon(etmp1.emon));
        if (e_missed(etmp1, (1))) {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("%s spared!", E_phrase(etmp1, "are"));
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
            if ((etmp1.emon == game.youmonst)) {
                spoteffects((0));
            /* if there is water or lava here, fall in now */
            } else {
                minliquid(etmp1.emon);
            }
        } else {
            if (e_inview) {
                if (!(etmp1.emon == game.youmonst) && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    pline("%s into some heavy metal!", E_phrase(etmp1, "get"));
                } else {
                    pline("%s hit by a huge chunk of metal!", E_phrase(etmp1, "are"));
                }
            } else {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(etmp1.emon == game.youmonst) && !is_pool(x, y)) {
                    ;
                    You_hear("a crushing sound.");
                } else {
                    do {
                        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/dbridge.c", (1))) {
                            let save_plnmsg = game.iflags.last_msg;
                            pline("%s from shrapnel", E_phrase(etmp1, "die"));
                            game.iflags.last_msg = save_plnmsg;
                        }
                    } while (0);
                }
            }
            game.killer.format = 0;
            game.killer.name = strcpy(game.killer.name, "collapsing drawbridge");
            e_died(etmp1, 2 | (e_inview ? 0 : 1), CRUSHING);
            if (game.level.locations[etmp1.ex][etmp1.ey].typ == MOAT) {
                do_entity(etmp1);
            }
        }
    }
    nokiller();
    if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
        game.u.uevent.uheard_tune = 3;
    }
}
/*dbridge.c*/
/* FIXME: still not dead?  What should we do now? */
/* bridge is gone so tune is now useless */
