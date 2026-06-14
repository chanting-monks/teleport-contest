/* NetHack 5.0	vault.c	$NHDT-Date: 1737622664 2025/01/23 00:57:44 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.113 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_hear, You_see, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, strlen, strncmpi } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { um_dist } from './apply.js';
import { adjalign } from './attrib.js';
import { isok } from './cmd.js';
import { canseemon, map_invisible, map_location, mon_visible, newsym, sensemon, unset_seenv, xy_set_wall_state } from './display.js';
import { Mgender, Monnam, Some_Monnam, noit_Monnam, noit_mon_nam, pmname, x_monnam } from './do_name.js';
import { assign_level, on_level } from './dungeon.js';
import { is_fainted, reset_faint } from './eat.js';
import { del_engr_at, make_grave } from './engrave.js';
import { in_rooms, money_cnt, nomul, unmul } from './hack.js';
import { dist2, mungspaces, upstart } from './hacklib.js';
import { currency, freeinv, g_at, sobj_at, stackobj } from './invent.js';
import { makemon, newmextra, set_malign } from './makemon.js';
import { add_to_minv, obj_extract_self, place_object, remove_object } from './mkobj.js';
import { m_into_limbo, mnexto, mongone, mpickgold, setmangry } from './mon.js';
import { pronoun_gender, sticks } from './mondata.js';
import { mon_track_clear } from './monmove.js';
import { m_carrying } from './mthrowu.js';
import { BLCORNER, BLINDED, BOULDER, BRCORNER, COIN_CLASS, CORR, DBWALL, DEAF, DOOR, DRAWBRIDGE_UP, FEMALE, GOLD_PIECE, HWALL, INVIS, MALE, MELT_ICE_AWAY, MS_SILENT, M_AP_OBJECT, NEED_HTH_WEAPON, PM_CROESUS, PM_GUARD, POOL, ROCK, ROOM, SCORR, STONE, STRANGLED, TIN_WHISTLE, TLCORNER, TRCORNER, VAULT, VWALL } from './nh-constants.js';
import { an, makeplural, mimic_obj_name, simpleonames } from './objnam.js';
import { rn2 } from './rnd.js';
import { genders } from './role.js';
import { contained_gold, obfree } from './shk.js';
import { yelp } from './sounds.js';
import { relobj } from './steal.js';
import { place_monster } from './steed.js';
import { enexto, rloc, tele } from './teleport.js';
import { spot_stop_timers } from './timeout.js';
import { deltrap, t_at } from './trap.js';
import { block_point, recalc_block_point, unblock_point } from './vision.js';
import { mon_wield_item } from './weapon.js';
import { getlin } from './windows.js';
import { fracture_rock } from './zap.js';

export function newegd(mtmp) {
    if (!mtmp.mextra) {
        mtmp.mextra = newmextra();
    }
    if (!((mtmp).mextra.egd)) {
        ((mtmp).mextra.egd) = alloc(1 /* sizeof(struct egd) */);
        memset(((mtmp).mextra.egd), 0, 1 /* sizeof(struct egd) */);
        ((mtmp).mextra.egd).parentmid = mtmp.m_id;
    }
}
export function free_egd(mtmp) {
    if (mtmp.mextra && ((mtmp).mextra.egd)) {
        free(((mtmp).mextra.egd));
        ((mtmp).mextra.egd) = null;
    }
    mtmp.isgd = 0;
}
/* try to remove the temporary corridor (from vault to rest of map) being
   maintained by guard 'grd'; if guard is still in it, removal will fail,
   to be tried again later */
export async function clear_fcorr(grd, forceshow) {
    let fcx = 0;
    let fcy = 0;
    let fcbeg = 0;
    let mtmp = null;
    let sawcorridor = (0);
    let silently = game.program_state.stopprint ? (1) : (0);
    let egrd = ((grd).mextra.egd);
    let trap = null;
    let lev = null;
    if (!on_level(egrd.gdlevel, game.u.uz)) {
        return (1);
    }
    while ((fcbeg = egrd.fcbeg) < egrd.fcend) {
        /* note: guard remains on 'fmon' list (alive or dead, at off-map
       coordinate <0,0>), until temporary corridor from vault back to
       civilization has been removed */
        fcx = egrd.fakecorr[fcbeg].fx;
        fcy = egrd.fakecorr[fcbeg].fy;
        if ((((grd).mhp < 1) || !in_fcorridor(grd, game.u.ux, game.u.uy)) && egrd.gddone) {
            forceshow = (1);
        }
        if ((((fcx) == game.u.ux && (fcy) == game.u.uy) && !((grd).mhp < 1)) || (!forceshow && ((game.viz_array[fcy][fcx] & 1) != 0)) || ((game.uball != null) && !((game.uball).where == 3) && game.uball.ox == fcx && game.uball.oy == fcy)) {
            return (0);
        }
        if ((mtmp = (game.level.monsters[fcx][fcy])) != null) {
            if (mtmp.isgd) {
                return (0);
            } else {
                if (mtmp.mtame) {
                    await yelp(mtmp);
                }
                if (!await rloc(mtmp, 2)) {
                    await m_into_limbo(mtmp);
                }
            }
        }
        lev = game.level.locations[fcx][fcy];
        if (lev.typ == CORR && ((game.viz_array[fcy][fcx] & 2) != 0)) {
            sawcorridor = (1);
        }
        lev.typ = egrd.fakecorr[fcbeg].ftyp;
        lev.flags = egrd.fakecorr[fcbeg].flags;
        if (((lev.typ) <= DBWALL)) {
            if ((trap = t_at(fcx, fcy)) != null) {
                await deltrap(trap);
            }
            /* undo scroll/wand/spell of light affecting this spot */
            if (lev.typ == STONE) {
                blackout(fcx, fcy);
            }
        }
        await del_engr_at(fcx, fcy);
        await map_location(fcx, fcy, 1);
        recalc_block_point(fcx, fcy);
        game.vision_full_recalc = 1;
        egrd.fcbeg++;
    }
    if (sawcorridor && !silently) {
        await pline_The("corridor disappears.");
    }
    /* only give encased message if hero is still alive (might get here
       via paygd() -> mongone() -> grddead() when game is over;
       died: no message, quit: message) */
    if (((game.level.locations[game.u.ux][game.u.uy].typ) < POOL) && ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp) > 0 && !silently) {
        await You("are encased in rock.");
    }
    return (1);
}
/* as a temporary corridor is removed, set stone locations and adjacent
   spots to unlit; if player used scroll/wand/spell of light while inside
   the corridor, we don't want the light to reappear if/when a new tunnel
   goes through the same area */
export function blackout(x, y) {
    let lev = null;
    let i = 0;
    let j = 0;
    for (i = x - 1; i <= x + 1; ++i) {
        for (j = y - 1; j <= y + 1; ++j) {
            if (!isok(i, j)) {
                continue;
            }
            lev = game.level.locations[i][j];
            /* [possible bug: when (i != x || j != y), perhaps we ought
               to check whether the spot on the far side is lit instead
               of doing a blanket blackout of adjacent locations] */
            if (lev.typ == STONE) {
                lev.lit = lev.waslit = 0;
            }
            /* mark <i,j> as not having been seen from <x,y> */
            unset_seenv(lev, x, y, i, j);
        }
    }
}
export async function restfakecorr(grd) {
    if (await clear_fcorr(grd, (0))) {
        /* it seems you left the corridor - let the guard disappear */
        /* dmonsfree() should delete this mon */
        grd.isgd = 0;
        await mongone(grd);
    }
}
/* move guard--dead to alive--to <0,0> until temporary corridor is removed */
export async function parkguard(grd) {
    /* either guard is dead or will now be treated as if so;
       monster traversal loops should skip it */
    if (grd == game.context.polearm.hitmon) {
        game.context.polearm.hitmon = null;
    }
    if (grd.mx) {
        game.level.monsters[grd.mx][grd.my] = null;
        await newsym(grd.mx, grd.my);
    }
    if ((game.level.monsters[0][0]) != grd) {
        await place_monster(grd, 0, 0);
    }
    ((grd).mextra.egd).ogx = grd.mx;
    /* [grd->mx,my just got set to 0,0 by place_monster(), so this
       just sets EGD(grd)->ogx,ogy to 0,0 too; is that what we want?] */
    ((grd).mextra.egd).ogy = grd.my;
}
/* called in mon.c */
export async function grddead(grd) {
    let dispose = await clear_fcorr(grd, (1));
    if (!dispose) {
        await relobj(grd, 0, (0));
        grd.mhp = 0;
        await parkguard(grd);
        dispose = await clear_fcorr(grd, (1));
    }
    if (dispose) {
        grd.isgd = 0;
    }
    return dispose;
}
export function in_fcorridor(grd, x, y) {
    let fci = 0;
    let egrd = ((grd).mextra.egd);
    for (fci = egrd.fcbeg; fci < egrd.fcend; fci++) {
        if (x == egrd.fakecorr[fci].fx && y == egrd.fakecorr[fci].fy) {
            return (1);
        }
    }
    return (0);
}
export async function findgd() {
    let mtmp = null;
    let mprev__parent = null;
    let mprev__field = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (mtmp.isgd && on_level(((mtmp).mextra.egd).gdlevel, game.u.uz)) {
            /* this might find a guard parked at <0,0> since it'll be on fmon list */
            if (!mtmp.mx && !((mtmp).mextra.egd).gddone) {
                mtmp.mhp = mtmp.mhpmax;
            }
            return mtmp;
        }
    }
    for ((mprev__parent = game, mprev__field = "migrating_mons"); (mtmp = mprev__parent[mprev__field]) != null; (mprev__parent = mtmp, mprev__field = "nmon")) {
        if (mtmp.isgd && on_level(((mtmp).mextra.egd).gdlevel, game.u.uz)) {
            /* if not on fmon, look for a guard waiting to migrate to this level */
            /* take out of migrating_mons and place at <0,0>;
               simplified mon_arrive(); avoid that because it would
               send mtmp into limbo if no regular map spot is available */
            mprev__parent[mprev__field] = mtmp.nmon;
            mtmp.nmon = game.level.monlist;
            game.level.monlist = mtmp;
            mon_track_clear(mtmp);
            mtmp.mux = game.u.ux , mtmp.muy = game.u.uy;
            /* not on map (note: mx is already 0) */
            mtmp.mx = mtmp.my = 0;
            await parkguard(mtmp);
            return mtmp;
        }
    }
    return null;
}
export async function vault_summon_gd() {
    if (vault_occupied(game.u.urooms) && !await findgd()) {
        game.u.uinvault = (30 - 1);
    }
}
export function vault_occupied(array) {
    if (!array) return 0;
    for (let i = 0; i < array.length; i++) {
        const v = array[i];
        if (!v) break;
        if (game.rooms[v - 3].rtype == VAULT) return v;
    }
    return 0;
}
/* hero has teleported out of vault while a guard is active */
export async function uleftvault(grd) {
    if (!grd || !grd.isgd || ((grd).mhp < 1)) {
        await impossible("escaping vault without guard?");
        return;
    }
    if ((money_cnt(game.invent) || hidden_gold((1))) && um_dist(grd.mx, grd.my, 1)) {
        if (grd.mpeaceful) {
            /* if carrying gold and arriving anywhere other than next to the guard,
       set the guard loose */
            /* see or sense via telepathy */
            if ((canseemon(grd) || sensemon(grd))) {
                await pline("%s becomes irate.", await Monnam(grd));
            }
            grd.mpeaceful = 0;
        }
        /* if arriving outside guard's temporary corridor, give the
           guard an extra move to deliver message(s) and to teleport
           out of and remove that corridor */
        if (!in_fcorridor(grd, game.u.ux, game.u.uy)) {
            await gd_move(grd);
        }
    }
}
export async function find_guard_dest(guard, rx, ry) {
    let x = 0;
    let y = 0;
    let dd = 0;
    let lx = 0;
    let ly = 0;
    for (dd = 2; (dd < 21 || dd < 80); dd++) {
        incr_radius: {
            for (y = game.u.uy - dd; y <= game.u.uy + dd; y++) {
                if (y < 0 || y > 21 - 1) {
                    continue;
                }
                for (x = game.u.ux - dd; x <= game.u.ux + dd; x++) {
                    if (y != game.u.uy - dd && y != game.u.uy + dd && x != game.u.ux - dd) {
                        x = game.u.ux + dd;
                    }
                    if (x < 1 || x > 80 - 1) {
                        continue;
                    }
                    if (guard && ((x == guard.mx && y == guard.my) || (guard.isgd && in_fcorridor(guard, x, y)))) {
                        continue;
                    }
                    if (game.level.locations[x][y].typ == CORR) {
                        lx = (x < game.u.ux) ? x + 1 : (x > game.u.ux) ? x - 1 : x;
                        ly = (y < game.u.uy) ? y + 1 : (y > game.u.uy) ? y - 1 : y;
                        if (game.level.locations[lx][ly].typ != STONE && game.level.locations[lx][ly].typ != CORR) {
                            break incr_radius;
                        }
                        rx.value = x;
                        ry.value = y;
                        return (1);
                    }
                }
            }
        }
    }
    await impossible("Not a single corridor on this level?");
    await tele();
    return (0);
}
export async function invault() {
    let guard = null;
    let otmp = null;
    let spotted = 0;
    let trycount = 0;
    let vaultroom = vault_occupied(game.u.urooms);
    let vgdeathcount = 0;
    if (!vaultroom) {
        game.u.uinvault = 0;
        return;
    }
    /* after a couple of guards don't come back from their trips to
       the vault, future guards become more reluctant to turn up (even
       if summoned via whistle) */
    vgdeathcount = game.mvitals[PM_GUARD].died;
    if (vgdeathcount < 2 || (vgdeathcount < 50 && !rn2(vgdeathcount * vgdeathcount))) {
        /* ensure the guard doesn't respawn again next turn if killed
           immediately */
        ++game.u.uinvault;
    }
    if (game.u.uinvault < 30 || (game.u.uinvault % (Math.trunc(30 / 2))) != 0) {
        return;
    }
    guard = await findgd();
    if (!guard) {
        /* if time ok and no guard now. */
        let buf = '';
        let x = 0;
        let y = 0;
        let gdx = 0;
        let gdy = 0;
        let typ = 0;
        let rx = 0;
        let ry = 0;
        let umoney = 0;
        if (!await find_guard_dest(null, { get value() { return rx; }, set value(_v) { rx = _v; } }, { get value() { return ry; }, set value(_v) { ry = _v; } })) {
            return;
        }
        gdx = rx , gdy = ry;
        vaultroom -= 3;
        /* next find a good place for a door in the wall */
        x = game.u.ux;
        y = game.u.uy;
        if (game.level.locations[x][y].typ != ROOM) {
            if (game.level.locations[x + 1][y].typ == ROOM) {
                /* player dug a door and is in it */
                x = x + 1;
            } else if (game.level.locations[x][y + 1].typ == ROOM) {
                y = y + 1;
            } else if (game.level.locations[x - 1][y].typ == ROOM) {
                x = x - 1;
            } else if (game.level.locations[x][y - 1].typ == ROOM) {
                y = y - 1;
            } else if (game.level.locations[x + 1][y + 1].typ == ROOM) {
                x = x + 1;
                y = y + 1;
            } else if (game.level.locations[x - 1][y - 1].typ == ROOM) {
                x = x - 1;
                y = y - 1;
            } else if (game.level.locations[x + 1][y - 1].typ == ROOM) {
                x = x + 1;
                y = y - 1;
            } else if (game.level.locations[x - 1][y + 1].typ == ROOM) {
                x = x - 1;
                y = y + 1;
            }
        }
        while (game.level.locations[x][y].typ == ROOM) {
            let dx = 0;
            let dy = 0;
            dx = (gdx > x) ? 1 : (gdx < x) ? -1 : 0;
            dy = (gdy > y) ? 1 : (gdy < y) ? -1 : 0;
            if (abs(gdx - x) >= abs(gdy - y)) {
                x += dx;
            } else {
                y += dy;
            }
        }
        if (((x) == game.u.ux && (y) == game.u.uy)) {
            if (game.level.locations[x + 1][y].typ == HWALL || game.level.locations[x + 1][y].typ == DOOR) {
                x = x + 1;
            } else if (game.level.locations[x - 1][y].typ == HWALL || game.level.locations[x - 1][y].typ == DOOR) {
                x = x - 1;
            } else if (game.level.locations[x][y + 1].typ == VWALL || game.level.locations[x][y + 1].typ == DOOR) {
                y = y + 1;
            } else if (game.level.locations[x][y - 1].typ == VWALL || game.level.locations[x][y - 1].typ == DOOR) {
                y = y - 1;
            } else {
                return;
            }
        }
        if (!(guard = await makemon(game.mons[PM_GUARD], x, y, 128 | 131072))) {
            return;
        }
        guard.isgd = 1;
        guard.mpeaceful = 1;
        set_malign(guard);
        ((guard).mextra.egd).gddone = 0;
        ((guard).mextra.egd).ogx = x;
        ((guard).mextra.egd).ogy = y;
        assign_level((((guard).mextra.egd).gdlevel), game.u.uz);
        ((guard).mextra.egd).vroom = vaultroom;
        ((guard).mextra.egd).warncnt = 0;
        ++game.u.uinvault;
        await reset_faint();
        if ((otmp = sobj_at(BOULDER, guard.mx, guard.my)) != null) {
            /* if there are any boulders in the guard's way, destroy them;
           perhaps the guard knows a touch equivalent of force bolt;
           otherwise the hero wouldn't be able to push one to follow the
           guard out of the vault because that guard would be in its way */
            let func = null;
            let bname = await simpleonames(otmp);
            let bcnt = 0;
            do {
                ++bcnt;
                await fracture_rock(otmp);
                otmp = sobj_at(BOULDER, guard.mx, guard.my);
            } while (otmp);
            /* You_hear() will handle Deaf/!Deaf */
            func = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? You_see : You_hear;
            (func)("%s shatter.", (bcnt == 1) ? await an(bname) : await makeplural(bname));
        }
        spotted = (canseemon(guard) || sensemon(guard));
        if (spotted) {
            await pline("Suddenly one of the Vault's %s enters!", await makeplural(pmname(guard.data, Mgender(guard))));
            await newsym(guard.mx, guard.my);
        } else {
            await pline("Someone else has entered the Vault.");
            await map_invisible(guard.mx, guard.my);
        }
        if (game.u.uswallow) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                await verbalize("What's going on here?");
            }
            if (!spotted) {
                await pline_The("other presence vanishes.");
            }
            await mongone(guard);
            return;
        }
        if ((game.youmonst.m_ap_type & 7) == M_AP_OBJECT || game.u.uundetected) {
            if ((game.youmonst.m_ap_type & 7) == M_AP_OBJECT && game.youmonst.mappearance != GOLD_PIECE) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    ;
                    await verbalize("Hey!  Who left that %s in here?", await mimic_obj_name(game.youmonst));
                }
            }
            await pline("Puzzled, %s turns around and leaves.", (genders[pronoun_gender(guard, 2)].he));
            await mongone(guard);
            return;
        }
        if (game.u.uprops[STRANGLED].intrinsic || ((game.youmonst.data).msound == MS_SILENT) || game.multi < 0) {
            if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                await pline("%s huffs and turns to leave.", await noit_Monnam(guard));
            } else {
                ;
                await verbalize("I'll be back when you're ready to speak to me!");
            }
            await mongone(guard);
            return;
        }
        await stop_occupation();
        if (game.multi > 0) {
            nomul(0);
            await unmul(null);
        }
        buf = '';
        trycount = 5;
        do {
            buf = await getlin((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "You are required to supply your name. -" : "\"Hello stranger, who are you?\" -", buf);
            buf = mungspaces(buf);
        } while (!__nh_char_at0(buf) && --trycount > 0);
        if (game.u.ualign.type == 1 && strncmpi(buf, game.plname, strlen(game.plname)) != 0) {
            /* ignore trailing text, in case player includes rank */
            adjalign(-1);
        }
        if (!strncmpi((buf), ("Croesus"), -1) || !strncmpi((buf), ("Kroisos"), -1) || !strncmpi((buf), ("Creosote"), -1)) {
            if (!game.mvitals[PM_CROESUS].died) {
                if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await pline("%s waves goodbye.", await noit_Monnam(guard));
                    }
                } else {
                    ;
                    await verbalize("Oh, yes, of course.  Sorry to have disturbed you.");
                }
                await mongone(guard);
            } else {
                await setmangry(guard, (0));
                if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await pline("%s mouths something and looks very angry!", await noit_Monnam(guard));
                    }
                } else {
                    ;
                    await verbalize("Back from the dead, are you?  I'll remedy that!");
                }
                if (!((guard).mw)) {
                    /* don't want guard to waste next turn wielding a weapon */
                    guard.weapon_check = NEED_HTH_WEAPON;
                    await mon_wield_item(guard);
                }
            }
            return;
        }
        if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await pline("%s doesn't %srecognize you.", await noit_Monnam(guard), (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? "" : "appear to ");
        } else {
            ;
            await verbalize("I don't know you.");
        }
        umoney = money_cnt(game.invent);
        if (!umoney && !hidden_gold((1))) {
            if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                await pline("%s stomps%s.", await noit_Monnam(guard), (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? "" : " and beckons");
            } else {
                ;
                await verbalize("Please follow me.");
            }
        } else {
            if (!umoney) {
                if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await pline("%s glares at you%s.", await noit_Monnam(guard), game.invent ? "r stuff" : "");
                    }
                } else {
                    ;
                    await verbalize("You have hidden gold.");
                }
            }
            if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline("%s holds out %s palm and beckons with %s other hand.", await noit_Monnam(guard), (genders[pronoun_gender(guard, (1 | 2))].his), (genders[pronoun_gender(guard, (1 | 2))].his));
                }
            } else {
                ;
                await verbalize("Most likely all your gold was stolen from this vault.");
                ;
                await verbalize("Please drop that gold and follow me.");
            }
            ((guard).mextra.egd).dropgoldcnt++;
        }
        ((guard).mextra.egd).gdx = gdx;
        ((guard).mextra.egd).gdy = gdy;
        ((guard).mextra.egd).fcbeg = 0;
        ((guard).mextra.egd).fakecorr[0].fx = x;
        ((guard).mextra.egd).fakecorr[0].fy = y;
        typ = game.level.locations[x][y].typ;
        if (!((typ) && (typ) <= DBWALL)) {
            /* guard arriving at non-wall implies a door; vault wall was
               dug into an empty doorway (which could subsequently have
               been plugged with an intact door by use of locking magic) */
            let vlt = ((guard).mextra.egd).vroom;
            let lowx = game.rooms[vlt].lx;
            let hix = game.rooms[vlt].hx;
            let lowy = game.rooms[vlt].ly;
            let hiy = game.rooms[vlt].hy;
            if (x == lowx - 1 && y == lowy - 1) {
                typ = TLCORNER;
            } else if (x == hix + 1 && y == lowy - 1) {
                typ = TRCORNER;
            } else if (x == lowx - 1 && y == hiy + 1) {
                typ = BLCORNER;
            } else if (x == hix + 1 && y == hiy + 1) {
                typ = BRCORNER;
            } else if (y == lowy - 1 || y == hiy + 1) {
                typ = HWALL;
            } else if (x == lowx - 1 || x == hix + 1) {
                typ = VWALL;
            }
            game.level.locations[x][y].typ = typ;
            game.level.locations[x][y].flags = 0;
            /* we lack access to the original wall_info bit mask for this
               former wall location so recreate it */
            /* wall; will be changed to door below */
            /* will be reset too via doormask */
            /* set WA_MASK bits in .wall_info */
            xy_set_wall_state(x, y);
        }
        ((guard).mextra.egd).fakecorr[0].ftyp = typ;
        ((guard).mextra.egd).fakecorr[0].flags = game.level.locations[x][y].flags;
        /* guard's entry point where confrontation with hero takes place */
        spot_stop_timers(x, y, MELT_ICE_AWAY);
        game.level.locations[x][y].typ = DOOR;
        game.level.locations[x][y].flags = 0;
        /* empty doorway doesn't block light */
        unblock_point(x, y);
        ((guard).mextra.egd).fcend = 1;
        ((guard).mextra.egd).warncnt = 1;
    }
}
export async function move_gold(gold, vroom) {
    let nx = 0;
    let ny = 0;
    await remove_object(gold);
    await newsym(gold.ox, gold.oy);
    nx = game.rooms[vroom].lx + rn2(2);
    ny = game.rooms[vroom].ly + rn2(2);
    await place_object(gold, nx, ny);
    await stackobj(gold);
    await newsym(nx, ny);
}
export async function wallify_vault(grd) {
    let typ = 0;
    let x = 0;
    let y = 0;
    let vlt = ((grd).mextra.egd).vroom;
    let tmp_viz = 0;
    let lox = game.rooms[vlt].lx - 1;
    let hix = game.rooms[vlt].hx + 1;
    let loy = game.rooms[vlt].ly - 1;
    let hiy = game.rooms[vlt].hy + 1;
    let mon = null;
    let gold = null;
    let rocks = null;
    let trap = null;
    let fixed = (0);
    let movedgold = (0);
    for (x = lox; x <= hix; x++) {
        for (y = loy; y <= hiy; y++) {
            /* if not on the room boundary, skip ahead */
            if (x != lox && x != hix && y != loy && y != hiy) {
                continue;
            }
            if ((!((game.level.locations[x][y].typ) && (game.level.locations[x][y].typ) <= DBWALL) || g_at(x, y) || sobj_at(ROCK, x, y) || sobj_at(BOULDER, x, y)) && !in_fcorridor(grd, x, y)) {
                if ((mon = (game.level.monsters[x][y])) != null && mon != grd) {
                    if (mon.mtame) {
                        await yelp(mon);
                    }
                    if (!await rloc(mon, 2)) {
                        await m_into_limbo(mon);
                    }
                }
                if ((gold = g_at(x, y)) != null) {
                    await move_gold(gold, ((grd).mextra.egd).vroom);
                    movedgold = (1);
                }
                while ((rocks = sobj_at(ROCK, x, y)) != null) {
                    await obj_extract_self(rocks);
                    await obfree(rocks, null);
                }
                while ((rocks = sobj_at(BOULDER, x, y)) != null) {
                    await obj_extract_self(rocks);
                    await obfree(rocks, null);
                }
                if ((trap = t_at(x, y)) != null) {
                    await deltrap(trap);
                }
                if (x == lox) {
                    typ = (y == loy) ? TLCORNER : (y == hiy) ? BLCORNER : VWALL;
                } else if (x == hix) {
                    typ = (y == loy) ? TRCORNER : (y == hiy) ? BRCORNER : VWALL;
                /* not left or right side, must be top or bottom */
                } else {
                    typ = HWALL;
                }
                game.level.locations[x][y].typ = typ;
                game.level.locations[x][y].flags = 0;
                xy_set_wall_state(x, y);
                await del_engr_at(x, y);
                /*
                 * hack: player knows walls are restored because of the
                 * message, below, so show this on the screen.
                 */
                tmp_viz = game.viz_array[y][x];
                game.viz_array[y][x] = 2 | 1;
                await newsym(x, y);
                game.viz_array[y][x] = tmp_viz;
                block_point(x, y);
                fixed = (1);
            }
        }
    }
    if (movedgold || fixed) {
        if (in_fcorridor(grd, grd.mx, grd.my) || ((game.viz_array[grd.my][grd.mx] & 2) != 0)) {
            await pline("%s whispers an incantation.", await noit_Monnam(grd));
        } else {
            await You_hear("a distant chant.");
        }
        if (movedgold) {
            await pline("A mysterious force moves the gold into the vault.");
        }
        if (fixed) {
            await pline_The("damaged vault's walls are magically restored!");
        }
    }
}
export async function gd_mv_monaway(grd, nx, ny) {
    let mtmp = (game.level.monsters[nx][ny]);
    if (mtmp && mtmp != grd) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            ;
            await verbalize("Out of my way, scum!");
        }
        if (!await rloc(mtmp, 1 | 2) || (game.level.monsters[nx][ny] != null)) {
            await m_into_limbo(mtmp);
        }
        recalc_block_point(nx, ny);
    }
}
/* have guard pick gold off the floor, possibly moving to the gold's
   position before message and back to his current spot after */
export async function gd_pick_corridor_gold(grd, goldx, goldy) {
    let gold = null;
    let newcc = { x: 0, y: 0 };
    let bestcc = { x: 0, y: 0 };
    let gdelta = 0;
    let newdelta = 0;
    let bestdelta = 0;
    let tryct = 0;
    let guardx = grd.mx;
    let guardy = grd.my;
    let under_u = ((goldx) == game.u.ux && (goldy) == game.u.uy);
    let see_it = ((game.viz_array[goldy][goldx] & 2) != 0);
    if (under_u) {
        /* Grab the gold from between the hero's feet.
           If guard is two or more steps away; bring him closer first. */
        gold = g_at(goldx, goldy);
        if (!gold) {
            await impossible("vault guard: no gold at hero's feet?");
            return;
        }
        gdelta = dist2((guardx), (guardy), game.u.ux, game.u.uy);
        if (gdelta > 2 && see_it) {
            /* skip if player won't see it */
            bestdelta = gdelta;
            bestcc.x = guardx , bestcc.y = guardy;
            tryct = 9;
            do {
                if (await enexto(newcc, goldx, goldy, grd.data)) {
                    if ((newdelta = dist2((newcc.x), (newcc.y), game.u.ux, game.u.uy)) < bestdelta || (newdelta == bestdelta && dist2(newcc.x, newcc.y, guardx, guardy) < dist2(bestcc.x, bestcc.y, guardx, guardy))) {
                        /* pick an available spot nearest the hero and also try
                   to find the one meeting that criterium which is nearest
                   the guard's current location */
                        bestdelta = newdelta;
                        Object.assign(bestcc, newcc);
                    }
                }
            } while (--tryct >= 0);
            if (bestdelta < gdelta) {
                game.level.monsters[guardx][guardy] = null;
                await newsym(guardx, guardy);
                await place_monster(grd, bestcc.x, bestcc.y);
                await newsym(grd.mx, grd.my);
            }
        }
        await obj_extract_self(gold);
        await add_to_minv(grd, gold);
        await newsym(goldx, goldy);
    } else if (goldx == guardx && goldy == guardy) {
        await mpickgold(grd);
    } else {
        await gd_mv_monaway(grd, goldx, goldy);
        if (see_it) {
            game.level.monsters[grd.mx][grd.my] = null;
            await newsym(grd.mx, grd.my);
            await place_monster(grd, goldx, goldy);
        }
        await mpickgold(grd);
    }
    if (see_it) {
        await pline("%s%s picks up the gold%s.", await Some_Monnam(grd), (grd.mpeaceful && ((grd).mextra.egd).warncnt > 5) ? " calms down and" : "", under_u ? " from beneath you" : "");
    }
    if (grd.mx != guardx || grd.my != guardy) {
        game.level.monsters[grd.mx][grd.my] = null;
        await newsym(grd.mx, grd.my);
        await place_monster(grd, guardx, guardy);
        await newsym(guardx, guardy);
    }
    return;
}
/* return 1: guard moved, -2: died  */
export async function gd_move_cleanup(grd, semi_dead, disappear_msg_seen) {
    let x = 0;
    let y = 0;
    let see_guard = 0;
    /*
     * The following is a kludge.  We need to keep the guard around in
     * order to be able to make the fake corridor disappear as the
     * player moves out of it, but we also need the guard out of the
     * way.  We send the guard to never-never land.  We set ogx ogy to
     * mx my in order to avoid a check at the top of this function.
     * At the end of the process, the guard is killed in restfakecorr().
     */
    x = grd.mx , y = grd.my;
    see_guard = (canseemon(grd) || sensemon(grd));
    await parkguard(grd);
    await wallify_vault(grd);
    await restfakecorr(grd);
    do {
        if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/vault.c", (1))) {
            let save_plnmsg = game.iflags.last_msg;
            await pline("gd_move_cleanup: %scleanup%s", grd.isgd ? "" : "final ", grd.isgd ? " attempt" : "");
            game.iflags.last_msg = save_plnmsg;
        }
    } while (0);
    if (!semi_dead && (in_fcorridor(grd, game.u.ux, game.u.uy) || ((game.viz_array[y][x] & 2) != 0))) {
        if (!disappear_msg_seen && see_guard) {
            await pline("Suddenly, %s disappears.", await noit_mon_nam(grd));
        }
        return 1;
    }
    return -2;
}
export async function gd_letknow(grd) {
    if (!((game.viz_array[grd.my][grd.mx] & 2) != 0) || !mon_visible(grd)) {
        await You_hear("%s.", m_carrying(grd, TIN_WHISTLE) ? "the shrill sound of a guard's whistle" : "angry shouting");
    } else {
        await You(um_dist(grd.mx, grd.my, 2) ? "see %s approaching." : "are confronted by %s.", await x_monnam(grd, 2, "angry", 0, (0)));
    }
}
/*
 * return  1: guard moved,  0: guard didn't,  -1: let m_move do it,  -2: died
 */
export async function gd_move(grd) {
    let x = 0;
    let y = 0;
    let nx = 0;
    let ny = 0;
    let m = 0;
    let n = 0;
    let ex = 0;
    let ey = 0;
    let dx = 0;
    let dy = 0;
    let ggx = 0;
    let ggy = 0;
    let fci = 0;
    let typ = 0;
    let crm = null;
    let fcp = null;
    let egrd = null;
    let umoney = 0;
    let goldincorridor = 0;
    let u_in_vault = 0;
    let grd_in_vault = 0;
    let semi_dead = 0;
    let u_carry_gold = 0;
    let newspot = 0;
    let __skip_to_gd_mv_monaway = false;
    let __skip_to_fcorr_setup = false;
    gd_move_loop: while (true) {
    __skip_to_gd_mv_monaway = false;
    __skip_to_fcorr_setup = false;
    nextpos: {
        ggx = 0;
        ggy = 0;
        egrd = ((grd).mextra.egd);
        umoney = 0;
        goldincorridor = (0);
        u_in_vault = (0);
        grd_in_vault = (0);
        semi_dead = ((grd).mhp < 1);
        u_carry_gold = (0);
        newspot = (0);
        if (!on_level((egrd.gdlevel), game.u.uz)) {
            return -1;
        }
        if (semi_dead || !grd.mx || egrd.gddone) {
            egrd.gddone = 1;
            return await gd_move_cleanup(grd, semi_dead, (0));
        }
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/vault.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                await pline("gd_move: %s guard", grd.mpeaceful ? "peaceful" : "hostile");
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        u_in_vault = vault_occupied(game.u.urooms) ? (1) : (0);
        grd_in_vault = in_rooms(grd.mx, grd.my, VAULT) ? (1) : (0);
        if (!u_in_vault && !grd_in_vault) {
            await wallify_vault(grd);
        }
        if (!grd.mpeaceful) {
            if (!u_in_vault && (grd_in_vault || (in_fcorridor(grd, grd.mx, grd.my) && !in_fcorridor(grd, game.u.ux, game.u.uy)))) {
                await rloc(grd, 2);
                await wallify_vault(grd);
                if (!in_fcorridor(grd, grd.mx, grd.my)) {
                    await clear_fcorr(grd, (1));
                }
                await gd_letknow(grd);
                return -1;
            }
            if (!in_fcorridor(grd, grd.mx, grd.my)) {
                await clear_fcorr(grd, (1));
            }
            return -1;
        }
        if (abs(egrd.ogx - grd.mx) > 1 || abs(egrd.ogy - grd.my) > 1) {
            return -1;
        }
        if (egrd.witness) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                await verbalize("How dare you %s that gold, scoundrel!", (egrd.witness & 1) ? "consume" : "destroy");
            }
            egrd.witness = 0;
            grd.mpeaceful = 0;
            return -1;
        }
        umoney = money_cnt(game.invent);
        u_carry_gold = (umoney > 0 || hidden_gold((1)) > 0);
        if (egrd.fcend == 1) {
            if (u_in_vault && (u_carry_gold || um_dist(grd.mx, grd.my, 1))) {
                if (egrd.warncnt == 3 && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    let buf = '';
                    buf = sprintf(buf, "%sfollow me!", u_carry_gold ? (!umoney ? "drop that hidden gold and " : "drop that gold and ") : "");
                    ;
                    if (egrd.dropgoldcnt || !u_carry_gold) {
                        await verbalize("I repeat, %s", buf);
                    } else {
                        await verbalize("%s", upstart(buf));
                    }
                    if (u_carry_gold) {
                        egrd.dropgoldcnt++;
                    }
                }
                if (egrd.warncnt == 7) {
                    m = grd.mx;
                    n = grd.my;
                    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                        ;
                        await verbalize("You've been warned, knave!");
                    }
                    grd.mpeaceful = 0;
                    await mnexto(grd, 4);
                    game.level.locations[m][n].typ = egrd.fakecorr[0].ftyp;
                    game.level.locations[m][n].flags = egrd.fakecorr[0].flags;
                    /* guard corridor goes away */
                    recalc_block_point(m, n);
                    await del_engr_at(m, n);
                    await newsym(m, n);
                    return -1;
                }
                /* not fair to get mad when (s)he's fainted or paralyzed */
                if (!is_fainted() && game.multi >= 0) {
                    egrd.warncnt++;
                }
                return 0;
            }
            if (!u_in_vault) {
                if (u_carry_gold) {
                    m = grd.mx;
                    n = grd.my;
                    await rloc(grd, 2);
                    game.level.locations[m][n].typ = egrd.fakecorr[0].ftyp;
                    game.level.locations[m][n].flags = egrd.fakecorr[0].flags;
                    recalc_block_point(m, n);
                    await del_engr_at(m, n);
                    await newsym(m, n);
                    grd.mpeaceful = 0;
                    await gd_letknow(grd);
                    return -1;
                } else {
                    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                        ;
                        await verbalize("Well, begone.");
                    }
                    egrd.gddone = 1;
                    return await gd_move_cleanup(grd, semi_dead, (0));
                }
            }
        }
        if (egrd.fcend > 1) {
            if (egrd.fcend > 2 && in_fcorridor(grd, grd.mx, grd.my) && !egrd.gddone && !in_fcorridor(grd, game.u.ux, game.u.uy) && (game.level.locations[egrd.fakecorr[0].fx][egrd.fakecorr[0].fy].typ == egrd.fakecorr[0].ftyp)) {
                await pline("%s, confused, disappears.", await noit_Monnam(grd));
                return await gd_move_cleanup(grd, semi_dead, (1));
            }
            if (u_carry_gold && (in_fcorridor(grd, game.u.ux, game.u.uy) || (egrd.fcend > 1 && u_in_vault))) {
                if (!grd.mx) {
                    await restfakecorr(grd);
                    return -2;
                }
                if (egrd.warncnt < 6) {
                    egrd.warncnt = 6;
                    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            await pline("%s holds out %s palm demandingly!", await noit_Monnam(grd), (genders[pronoun_gender(grd, (1 | 2))].his));
                        }
                    } else {
                        ;
                        await verbalize("Drop all your gold, scoundrel!");
                    }
                    return 0;
                } else {
                    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            await pline("%s rubs %s hands with enraged delight!", await noit_Monnam(grd), (genders[pronoun_gender(grd, (1 | 2))].his));
                        }
                    } else {
                        ;
                        await verbalize("So be it, rogue!");
                    }
                    grd.mpeaceful = 0;
                    return -1;
                }
            }
        }
        m = n = 0;
        for (fci = egrd.fcbeg; fci < egrd.fcend; fci++) {
            if (g_at(egrd.fakecorr[fci].fx, egrd.fakecorr[fci].fy)) {
                m = egrd.fakecorr[fci].fx;
                n = egrd.fakecorr[fci].fy;
                goldincorridor = (1);
                break;
            }
        }
        if (goldincorridor && !egrd.gddone) {
            await gd_pick_corridor_gold(grd, m, n);
            if (!grd.mpeaceful) {
                return -1;
            }
            egrd.warncnt = 5;
            return 0;
        }
        if (um_dist(grd.mx, grd.my, 1) || egrd.gddone) {
            if (!egrd.gddone && !rn2(10) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !game.u.uswallow && !(game.u.ustuck && !sticks(game.youmonst.data))) {
                ;
                await verbalize("Move along!");
            }
            await restfakecorr(grd);
            return 0;
        }
        x = grd.mx;
        y = grd.my;
        if (u_in_vault) {
            break nextpos;
        }
        for (nx = x - 1; nx <= x + 1; nx++) {
            for (ny = y - 1; ny <= y + 1; ny++) {
                nextnxy: {
                    if ((nx == x || ny == y) && (nx != x || ny != y) && isok(nx, ny)) {
                        /* look around (hor & vert only) for accessible places */
                        crm = game.level.locations[nx][ny];
                        typ = crm.typ;
                        if (!((typ) <= DBWALL) && !((typ) >= POOL && (typ) <= DRAWBRIDGE_UP)) {
                            if (in_fcorridor(grd, nx, ny)) {
                                break nextnxy;
                            }
                            if (in_rooms(nx, ny, VAULT)) {
                                continue;
                            }
                            /* seems we found a good place to leave him alone */
                            egrd.gddone = 1;
                            if (((typ) >= DOOR)) {
                                __skip_to_gd_mv_monaway = true;
                                break nextpos;
                            }
                            crm.typ = (typ == SCORR) ? CORR : DOOR;
                            if (crm.typ == DOOR) {
                                crm.flags = 0;
                            } else {
                                crm.flags = 0;
                            }
                            await del_engr_at(nx, ny);
                            __skip_to_fcorr_setup = true;
                            break nextpos;
                        }
                    }
                }
            }
        }
    }
    nx = x;
    if (!__skip_to_gd_mv_monaway && !__skip_to_fcorr_setup) {
    proceed: {
        ny = y;
        ggx = egrd.gdx;
        ggy = egrd.gdy;
        dx = (ggx > x) ? 1 : (ggx < x) ? -1 : 0;
        dy = (ggy > y) ? 1 : (ggy < y) ? -1 : 0;
        if (abs(ggx - x) >= abs(ggy - y)) {
            nx += dx;
        } else {
            ny += dy;
        }
        while ((typ = (crm = game.level.locations[nx][ny]).typ) != STONE) {
            ex = nx + nx - x;
            ey = ny + ny - y;
            if (isok(ex, ey) && ((game.level.locations[ex][ey].typ) >= ROOM)) {
                /* in view of the above we must have IS_WALL(typ) or typ == POOL */
                /* I don't like this, but ... */
                crm.typ = DOOR;
                crm.flags = 0;
                await del_engr_at(ex, ey);
                break proceed;
            }
            if (dy && nx != x) {
                nx = x;
                ny = y + dy;
                continue;
            }
            if (dx && ny != y) {
                ny = y;
                nx = x + dx;
                dy = 0;
                continue;
            }
            if (((typ) >= ROOM)) {
                crm.typ = DOOR;
                crm.flags = 0;
                await del_engr_at(ex, ey);
                break proceed;
            }
            break;
        }
        crm.typ = CORR;
        crm.flags = 0;
    }
    }
    newspot = (1);
    if (!__skip_to_gd_mv_monaway) {
    newpos: {
        unblock_point(nx, ny);
        if (((game.viz_array[ny][nx] & 2) != 0)) {
            await newsym(nx, ny);
        }
        if ((nx != ggx || ny != ggy) || (grd.mx != ggx || grd.my != ggy)) {
            fcp = (egrd.fakecorr[egrd.fcend]);
            if (egrd.fcend++ == (21 + 80)) {
                await panic("fakecorr overflow");
            }
            fcp.fx = nx;
            fcp.fy = ny;
            fcp.ftyp = typ;
            fcp.flags = crm.flags;
        } else if (!egrd.gddone) {
            if (!await find_guard_dest(grd, { get value() { return egrd.gdx; }, set value(_v) { egrd.gdx = _v; } }, { get value() { return egrd.gdy; }, set value(_v) { egrd.gdy = _v; } }) || (egrd.gdx == ggx && egrd.gdy == ggy)) {
                await pline("%s, confused, disappears.", await Monnam(grd));
                return await gd_move_cleanup(grd, semi_dead, (1));
            } else {
                continue gd_move_loop;
            }
        }
    }
    }
    break;
    }
    await gd_mv_monaway(grd, nx, ny);
    if (egrd.gddone) {
        return await gd_move_cleanup(grd, semi_dead, (0));
    }
    egrd.ogx = grd.mx;
    egrd.ogy = grd.my;
    game.level.monsters[grd.mx][grd.my] = null;
    await place_monster(grd, nx, ny);
    if (newspot && g_at(nx, ny)) {
        await mpickgold(grd);
        if ((canseemon(grd) || sensemon(grd))) {
            await pline("%s picks up some gold.", await Monnam(grd));
        }
    } else {
        await newsym(grd.mx, grd.my);
    }
    await restfakecorr(grd);
    return 1;
}
/* Routine when dying or quitting with a vault guard around */
export async function paygd(silently) {
    let grd = null;
    let umoney = 0;
    let coins = null;
    let nextcoins = null;
    let gdx = 0;
    let gdy = 0;
    let buf = '';
    remove_guard: {
        grd = await findgd();
        umoney = money_cnt(game.invent);
        if (!umoney || !grd) {
            return;
        }
        if (game.u.uinvault) {
            if (!silently) {
                await Your("%ld %s goes into the Magic Memory Vault.", umoney, await currency(umoney));
            }
            gdx = game.u.ux;
            gdy = game.u.uy;
        } else {
            /* peaceful guard has no "right" to your gold */
            if (grd.mpeaceful) {
                break remove_guard;
            }
            await mnexto(grd, 4);
            if (!silently) {
                await pline("%s remits your gold to the vault.", await Monnam(grd));
            }
            gdx = game.rooms[((grd).mextra.egd).vroom].lx + rn2(2);
            gdy = game.rooms[((grd).mextra.egd).vroom].ly + rn2(2);
            buf = sprintf(buf, "To Croesus: here's the gold recovered from %s the %s.", game.plname, pmname(game.mons[game.u.umonster], game.flags.female ? FEMALE : MALE));
            await make_grave(gdx, gdy, buf);
        }
        for (coins = game.invent; coins; coins = nextcoins) {
            nextcoins = coins.nobj;
            if (game.objects[coins.otyp].oc_class == COIN_CLASS) {
                await freeinv(coins);
                await place_object(coins, gdx, gdy);
                await stackobj(coins);
            }
        }
    }
    await mongone(grd);
    return;
}
/*
 * amount of gold in carried containers
 *
 * even_if_unknown:
 *   True:  all gold
 *   False: limit to known contents
 */
export function hidden_gold(even_if_unknown) {
    let value = 0;
    let obj = null;
    for (obj = game.invent; obj; obj = obj.nobj) {
        if (((obj).cobj != null) && (obj.cknown || even_if_unknown)) {
            value += contained_gold(obj, even_if_unknown);
        }
    }
    /* unknown gold stuck inside statues may cause some consternation... */
    return value;
}
/* prevent "You hear footsteps.." when inappropriate */
export async function gd_sound() {
    return !(vault_occupied(game.u.urooms) || await findgd());
}
export async function vault_gd_watching(activity) {
    let guard = await findgd();
    if (guard && guard.mx && guard.mcansee && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((guard).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(guard).my][(guard).mx] & 1) != 0))) {
        if (activity == 1 || activity == 2) {
            ((guard).mextra.egd).witness = activity;
        }
    }
}
/*vault.c*/
/* destroy any trap here (pit dug by you, hole dug via
               wand while levitating or by monster, bear trap or land
               mine via object, spun web) when spot reverts to stone */
/* destroy guard's gold; drop any other inventory */
/* only called if caller has checked vault_occupied() and findgd() */
/* first find the goal for the guard */
/* make something interesting happen */
/* make sure that hero who can't see the guard knows where the
               wall is breeched, otherwise we couldn't follow the guard out;
               the breech isn't necessarily adjacent to the hero */
/* can't interrogate hero, don't interrogate engulfer */
/* You're mimicking some object or you're hidden. */
/* [we ought to record whether this message has already
               been given in order to vary it upon repeat visits, but
               discarding the monster and its egd data renders that hard] */
/* if occupied, stop it *now* */
/* move gold at wall locations into the vault */
/* destroy rocks and boulders (subsume them into the walls);
                   other objects present stay intact and become embedded */
/* guard is already at gold's location */
/* gold is at some third spot, neither guard's nor hero's */
/* skip if player won't see the message */
/* if guard was moved to get the gold, move him back */
/* teleported guard - treat as monster */
/* new gold can appear if it was embedded in stone and hero kicks it
       (on even via wish and drop) so don't assume hero has been warned */
/* fakecorr overflow does not occur because egrd->fakecorr[]
           is too small, but it has occurred when the same <x,y> are
           put into it repeatedly for some as yet unexplained reason */
/* We're stuck, so try to find a new destination. */
/* if there's gold already here (most likely from mineralize()),
           pick it up now so that guard doesn't later think hero dropped
           it and give an inappropriate message */
