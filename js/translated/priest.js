/* NetHack 5.0	priest.c	$NHDT-Date: 1764567778 2025/11/30 21:42:58 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.106 $ */
/* Copyright (c) Izchak Miller, Steve Linhart, 1989.              */
/* NetHack may be freely redistributed.  See license for details. */
/* these match the categorizations shown by enlightenment */
/* worse than strayed (-1..-3) */
/* better than fervent (9..13) */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, Your, pline, verbalize } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcmp, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { adjalign, exercise } from './attrib.js';
import { xdir, ydir } from './decl.js';
import { canseemon, newsym, sensemon } from './display.js';
import { Monnam, bogon_is_pname, mon_nam, mon_pmname, rndmonnam } from './do_name.js';
import { assign_level, mapseen_temple, on_level } from './dungeon.js';
import { check_special_room, in_rooms, money_cnt, nomul } from './hack.js';
import { dist2, online2, s_suffix } from './hacklib.js';
import { record_achievement } from './insight.js';
import { currency } from './invent.js';
import { makemon, mongets, newmextra, set_malign } from './makemon.js';
import { mattacku } from './mhitu.js';
import { bribe, newemin } from './minion.js';
import { curse, mkobj, uncurse } from './mkobj.js';
import { mfndpos, mon_allowflags, mongone, monnear, setmangry, wakeup } from './mon.js';
import { mon_learns_traps, pronoun_gender, resist_conflict } from './mondata.js';
import { m_break_boulder, m_move_aggress } from './monmove.js';
import { linedup } from './mthrowu.js';
import { ACH_TMPL, ALL_TRAPS, ALTAR, AMULET_OF_YENDOR, A_WIS, CLAIRVOYANT, CONFLICT, DEAF, DISPLACED, DOOR, HALLUC, HALLUC_RES, INVIS, N_DIRS_Z, PM_ALIGNED_CLERIC, PM_ANGEL, PM_DEATH, PM_FAMINE, PM_GHOST, PM_HIGH_CLERIC, PM_PESTILENCE, PROTECTION, ROOM, SPBOOK_CLASS, SPINE, TEMPLE } from './nh-constants.js';
import { just_an } from './objnam.js';
import { livelog_printf } from './pline.js';
import { body_part } from './polyself.js';
import { incr_itimeout } from './potion.js';
import { a_gname_at, halu_gname } from './pray.js';
import { d, rn2 } from './rnd.js';
import { genders } from './role.js';
import { inhishop, money2u } from './shk.js';
import { pm_good_location } from './sp_lev.js';
import { mpickobj } from './steal.js';
import { place_monster } from './steed.js';
import { rloc } from './teleport.js';
import { which_armor } from './worn.js';
import { buzz } from './zap.js';

export function newepri(mtmp) {
    if (!mtmp.mextra) {
        mtmp.mextra = newmextra();
    }
    if (!((mtmp).mextra.epri)) {
        ((mtmp).mextra.epri) = alloc(1 /* sizeof(struct epri) */);
        memset(((mtmp).mextra.epri), 0, 1 /* sizeof(struct epri) */);
        ((mtmp).mextra.epri).parentmid = mtmp.m_id;
    }
}
export function free_epri(mtmp) {
    if (mtmp.mextra && ((mtmp).mextra.epri)) {
        free(((mtmp).mextra.epri));
        ((mtmp).mextra.epri) = null;
    }
    mtmp.ispriest = 0;
}
/*
 * Move for priests and shopkeepers.  Called from shk_move() and pri_move().
 * Valid returns are  1: moved  0: didn't  -1: let m_move do it  -2: died.
 */
export function move_special(mtmp, in_his_shop, appr, uondoor, avoid, omx, omy, ggx, ggy) {
    let nx = 0;
    let ny = 0;
    let nix = 0;
    let niy = 0;
    let i = 0;
    let chcnt = 0;
    let cnt = 0;
    let mfp = { cnt: 0, poss: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], info: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    let ninfo = 0;
    let allowflags = 0;
    pick_move: {
        ninfo = 0;
        if (omx == ggx && omy == ggy) {
            return 0;
        }
        if (mtmp.mconf) {
            /* might as well move closer as long it's going to stay
         * lined up */
            avoid = (0);
            appr = 0;
        }
        nix = omx;
        niy = omy;
        allowflags = mon_allowflags(mtmp);
        cnt = mfndpos(mtmp, mfp, allowflags);
        if (mtmp.isshk && avoid && uondoor) {
            /* perhaps we cannot avoid him */
            for (i = 0; i < cnt; i++) {
                if (!(mfp.info[i] & 2097152)) {
                    break pick_move;
                }
            }
            avoid = (0);
        }
    }
    pick_move_iter: while (true) {
    chcnt = 0;
    for (i = 0; i < cnt; i++) {
        nx = mfp.poss[i].x;
        ny = mfp.poss[i].y;
        if (((game.level.locations[nx][ny].typ) >= ROOM) || (mtmp.isshk && (!in_his_shop || ((mtmp).mextra.eshk).following))) {
            if (avoid && (mfp.info[i] & 2097152) && !(mfp.info[i] & 524288)) {
                continue;
            }
            if ((!appr && !rn2(++chcnt)) || (appr && (dist2(nx, ny, ggx, ggy)) < (dist2(nix, niy, ggx, ggy))) || (mfp.info[i] & 524288)) {
                nix = nx;
                niy = ny;
                ninfo = mfp.info[i];
            }
        }
    }
    if (mtmp.ispriest && avoid && nix == omx && niy == omy && online2((omx), (omy), game.u.ux, game.u.uy)) {
        avoid = (0);
        continue pick_move_iter;
    }
    break;
    }
    if (nix != omx || niy != omy) {
        if (ninfo & 33554432) {
            m_break_boulder(mtmp, nix, niy);
            /* dead code; maybe someday someone will track down why... */
            return 1;
        } else if (ninfo & 524288) {
            switch (m_move_aggress(mtmp, nix, niy)) {
                /* mtmp is deciding it would like to attack this turn.
             * Returns from m_move_aggress don't correspond to the same things
             * as this function should return, so we need to translate. */
                case 2:
                    return -2;
                case 3:
                    return 1;
            }
        }
        if ((game.level.monsters[nix][niy] != null) || ((nix) == game.u.ux && (niy) == game.u.uy)) {
            return 0;
        }
        game.level.monsters[omx][omy] = null;
        place_monster(mtmp, nix, niy);
        newsym(nix, niy);
        if (mtmp.isshk && !in_his_shop && inhishop(mtmp)) {
            check_special_room((0));
        }
        return 1;
    }
    return 0;
}
export function temple_occupied(array) {
    if (!array) return 0;
    for (let i = 0; i < array.length; i++) {
        const v = array[i];
        if (!v) break;
        if (game.rooms[v - 3].rtype == TEMPLE) return v;
    }
    return 0;
}
export function histemple_at(priest, x, y) {
    return (priest && priest.ispriest && (((priest).mextra.epri).shroom == in_rooms(x, y, TEMPLE)) && on_level((((priest).mextra.epri).shrlevel), game.u.uz));
}
export function inhistemple(priest) {
    /* make sure we have a priest */
    if (!priest || !priest.ispriest) {
        return (0);
    }
    /* priest must be on right level and in right room */
    if (!histemple_at(priest, priest.mx, priest.my)) {
        return (0);
    }
    /* temple room must still contain properly aligned altar */
    return has_shrine(priest);
}
/*
 * pri_move: return 1: moved  0: didn't  -1: let m_move do it  -2: died
 */
export function pri_move(priest) {
    let ggx = 0;
    let ggy = 0;
    let omx = 0;
    let omy = 0;
    let temple = 0;
    let avoid = (1);
    omx = priest.mx;
    omy = priest.my;
    if (!histemple_at(priest, omx, omy)) {
        return -1;
    }
    temple = ((priest).mextra.epri).shroom;
    ggx = ((priest).mextra.epri).shrpos.x;
    ggy = ((priest).mextra.epri).shrpos.y;
    ggx += (rn2(3) + (-1));
    ggy += (rn2(3) + (-1));
    if (!priest.mpeaceful || ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !resist_conflict(priest))) {
        if (monnear(priest, game.u.ux, game.u.uy)) {
            if ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic)) {
                Your("displaced image doesn't fool %s!", mon_nam(priest));
            }
            mattacku(priest);
            return 0;
        } else if (strchr(game.u.urooms, temple)) {
            if (priest.mcansee && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((priest).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(priest).my][(priest).mx] & 1) != 0))) {
                /* chase player if inside temple & can see him */
                ggx = game.u.ux;
                ggy = game.u.uy;
            }
            avoid = (0);
        }
    } else if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked)) {
        avoid = (0);
    }
    return move_special(priest, (0), (1), (0), avoid, omx, omy, ggx, ggy);
}
/* exclusively for mktemple() */
/* is it the seat of the high priest? */
export function priestini(lvl, sroom, sx, sy, sanctum) {
    let priest = null;
    let otmp = null;
    let cnt = 0;
    let px = 0;
    let py = 0;
    let i = 0;
    let si = rn2((N_DIRS_Z - 2));
    let prim = game.mons[sanctum ? PM_HIGH_CLERIC : PM_ALIGNED_CLERIC];
    for (i = 0; i < (N_DIRS_Z - 2); i++) {
        px = sx + xdir[(((i + si) + (N_DIRS_Z - 2)) % (N_DIRS_Z - 2))];
        py = sy + ydir[(((i + si) + (N_DIRS_Z - 2)) % (N_DIRS_Z - 2))];
        if (pm_good_location(px, py, prim)) {
            break;
        }
    }
    if (i == (N_DIRS_Z - 2)) {
        px = sx , py = sy;
    }
    if ((game.level.monsters[px][py] != null)) {
        rloc((game.level.monsters[px][py]), 4);
    }
    priest = makemon(prim, px, py, 256);
    if (priest) {
        ((priest).mextra.epri).shroom = ((game.rooms.indexOf(sroom)) + 3);
        ((priest).mextra.epri).shralign = (((((game.level.locations[sx][sy].flags) & 7) == 0) ? (-128) : (((game.level.locations[sx][sy].flags) & 7) == 4) ? 1 : (((game.level.locations[sx][sy].flags) & 7)) - 2));
        ((priest).mextra.epri).shrpos.x = sx;
        ((priest).mextra.epri).shrpos.y = sy;
        assign_level((((priest).mextra.epri).shrlevel), lvl);
        mon_learns_traps(priest, ALL_TRAPS);
        priest.mpeaceful = 1;
        priest.ispriest = 1;
        priest.isminion = 0;
        priest.msleeping = 0;
        /* mpeaceful may have changed */
        set_malign(priest);
        if (sanctum && ((priest).mextra.epri).shralign == (-128) && on_level((game.dungeon_topology.d_sanctum_level), game.u.uz)) {
            mongets(priest, AMULET_OF_YENDOR);
        }
        for (cnt = (rn2(3) + (2)); cnt > 0; --cnt) {
            mpickobj(priest, mkobj((0 - SPBOOK_CLASS), (0)));
        }
        if (rn2(2) && (otmp = which_armor(priest, 2)) != null) {
            if (p_coaligned(priest)) {
                uncurse(otmp);
            } else {
                curse(otmp);
            }
        }
    }
}
/* get a monster's alignment type without caller needing EPRI & EMIN */
export function mon_aligntyp(mon) {
    let algn = mon.ispriest ? ((mon).mextra.epri).shralign : mon.isminion ? ((mon).mextra.emin).min_align : mon.data.maligntyp;
    if (algn == (-128)) {
        return (-128);
    }
    /* negative but differs from chaotic */
    return (algn > 0) ? 1 : (algn < 0) ? (-1) : 0;
}
/*
 * Specially aligned monsters are named specially.
 *      - aligned priests with ispriest and high priests have shrines
 *              they retain ispriest and epri when polymorphed
 *      - aligned priests without ispriest are roamers
 *              they have isminion set and use emin rather than epri
 *      - minions do not have ispriest but have isminion and emin
 *      - caller needs to inhibit Hallucination if it wants to force
 *              the true name even when under that influence
 */
/* caller-supplied output buffer */
export function priestname(mon, article, reveal_high_priest, pname) {
    let do_hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic));
    let aligned_priest = mon.data == game.mons[PM_ALIGNED_CLERIC];
    let high_priest = mon.data == game.mons[PM_HIGH_CLERIC];
    let whatcode = 0;
    let what = do_hallu ? rndmonnam({ get value() { return whatcode; }, set value(_v) { whatcode = _v; } }) : mon_pmname(mon);
    if (!mon.ispriest && !mon.isminion) {
        return strcpy(pname, what);
    }
    /* for high priest(ess), "high" (or "grand" for poohbah) will be inserted
       [this was done near the end but we want 'what' to be updated sooner] */
    if (mon.ispriest || aligned_priest || high_priest) {
        what = do_hallu ? "poohbah" : mon.female ? "priestess" : "priest";
    }
    pname.value = 0;
    if (article != 0 && (!do_hallu || !bogon_is_pname(whatcode))) {
        if (article == 3 || (article == 2 && high_priest)) {
            article = 1;
        }
        if (article == 1) {
            pname = strcpy(pname, "the ");
        } else if (!strcmp(what, "Angel")) {
            pname = strcpy(pname, "an ");
        } else {
            just_an(pname, what);
        }
    }
    if (mon.minvis) {
        /* bypass just_an(); it would yield "" due to treating capital A
               as indicating a personal name */
        /* pname[] contains "" or {"a ","an ","the "} */
        /* avoid "a invisible priest" */
        if (!strcmp(pname, "a ")) {
            pname = strcpy(pname, "an ");
        }
        pname = strcat(pname, "invisible ");
    }
    if (mon.isminion && ((mon).mextra.emin).renegade) {
        /* avoid "an renegade Angel" */
        if (!strcmp(pname, "an ") && !mon.minvis) {
            pname = strcpy(pname, "a ");
        }
        pname = strcat(pname, "renegade ");
    }
    if (mon.ispriest || aligned_priest) {
        if (high_priest) {
            pname = strcat(pname, do_hallu ? "grand " : "high ");
        }
    } else {
        if (mon.mtame && !strncmpi((what), ("Angel"), -1)) {
            pname = strcat(pname, "guardian ");
        }
    }
    pname = strcat(pname, what);
    /* same as distant_monnam(), more or less... */
    if (do_hallu || !high_priest || reveal_high_priest || !(((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) || (dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= 2) || game.program_state.gameover) {
        pname = strcat(pname, " of ");
        pname = strcat(pname, halu_gname(mon_aligntyp(mon)));
    }
    return pname;
}
export function p_coaligned(priest) {
    return (game.u.ualign.type == mon_aligntyp(priest));
}
export function has_shrine(pri) {
    let lev = null;
    let epri_p = null;
    if (!pri || !pri.ispriest) {
        return (0);
    }
    epri_p = ((pri).mextra.epri);
    lev = game.level.locations[epri_p.shrpos.x][epri_p.shrpos.y];
    if (!((lev.typ) == ALTAR) || !(lev.flags & 8)) {
        return (0);
    }
    return (epri_p.shralign == ((((((lev.flags & ~8) & 7) == 0) ? (-128) : (((lev.flags & ~8) & 7) == 4) ? 1 : (((lev.flags & ~8) & 7)) - 2))));
}
export function findpriest(roomno) {
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (mtmp.ispriest && (((mtmp).mextra.epri).shroom == roomno) && histemple_at(mtmp, mtmp.mx, mtmp.my)) {
            return mtmp;
        }
    }
    return null;
}
/* called from check_special_room() when the player enters the temple room */
export function intemple(roomno) {
    let priest = null;
    let mtmp = null;
    let epri_p = null;
    let shrined = 0;
    let sanctum = 0;
    let can_speak = 0;
    let this_time = null;
    let other_time = null;
    let msg1 = null;
    let msg2 = null;
    let buf = '';
    /* don't do anything if hero is already in the room */
    if (temple_occupied(game.u.urooms0)) {
        return;
    }
    if ((priest = findpriest(roomno)) != null) {
        record_achievement(ACH_TMPL);
        epri_p = ((priest).mextra.epri);
        shrined = has_shrine(priest);
        sanctum = (priest.data == game.mons[PM_HIGH_CLERIC] && ((((((game.dungeon_topology.d_sanctum_level)).dlevel || ((game.dungeon_topology.d_sanctum_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sanctum_level)))) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)));
        can_speak = !((priest).msleeping || !(priest).mcanmove);
        if (can_speak && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && game.moves >= epri_p.intone_time) {
            let save_priest = priest.ispriest;
            /* don't reveal the altar's owner upon temple entry in
               the endgame; for the Sanctum, the next message names
               Moloch so suppress the "of Moloch" for him here too */
            if (sanctum && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                priest.ispriest = 0;
            }
            pline("%s intones:", canseemon(priest) ? Monnam(priest) : "A nearby voice");
            priest.ispriest = save_priest;
            epri_p.intone_time = game.moves + d(10, 500);
            /* make sure that we don't suppress entry message when
               we've just given its "priest intones" introduction */
            epri_p.enter_time = 0;
        }
        msg1 = msg2 = null;
        if (sanctum && (((((game.dungeon_topology.d_sanctum_level)).dlevel || ((game.dungeon_topology.d_sanctum_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sanctum_level))))) {
            if (priest.mpeaceful) {
                msg1 = "Infidel, you have entered Moloch's Sanctum!";
                msg2 = "Be gone!";
                priest.mpeaceful = 0;
                /* became angry voluntarily; no penalty for attacking him */
                set_malign(priest);
            } else {
                /* repeat visit, or attacked priest before entering */
                msg1 = "You desecrate this place by your presence!";
            }
        } else if (game.moves >= epri_p.enter_time) {
            buf = sprintf(buf, "Pilgrim, you enter a %s place!", !shrined ? "desecrated" : "sacred");
            msg1 = buf;
        }
        if (msg1 && can_speak && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            ;
            verbalize("%s", msg1);
            if (msg2) {
                verbalize("%s", msg2);
            }
            epri_p.enter_time = game.moves + d(10, 100);
        }
        if (!sanctum) {
            if (!shrined || !p_coaligned(priest) || game.u.ualign.record <= (-4)) {
                msg1 = "have a%s forbidding feeling...";
                msg2 = (!shrined || !p_coaligned(priest)) ? "" : " strange";
                this_time = epri_p.hostile_time;
                other_time = epri_p.peaceful_time;
            } else {
                msg1 = "experience %s sense of peace.";
                msg2 = (game.u.ualign.record >= 14) ? "a" : "an unusual";
                this_time = epri_p.peaceful_time;
                other_time = epri_p.hostile_time;
            }
            if (game.moves >= this_time || other_time >= this_time) {
                /* give message if we haven't seen it recently or
               if alignment update has caused it to switch from
               forbidding to sense-of-peace or vice versa */
                You(msg1, msg2);
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = game.moves + d(10, 20)) */;
                /* avoid being tricked by the RNG:  switch might have just
                   happened and previous random threshold could be larger */
                if (this_time <= other_time) {
                    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = this_time - 1) */;
                }
            }
        }
        /* recognize the Valley of the Dead and Moloch's Sanctum
           once hero has encountered the temple priest on those levels */
        mapseen_temple(priest);
    } else {
        switch (rn2(4)) {
            case 0:
                You("have an eerie feeling...");
                break;
            case 1:
                You_feel("like you are being watched.");
                break;
            case 2:
                pline("A shiver runs down your %s.", body_part(SPINE));
                break;
            default:
                break;
        }
        if (!rn2(5) && (mtmp = makemon(game.mons[PM_GHOST], game.u.ux, game.u.uy, 131072)) != null) {
            let ngen = game.mvitals[PM_GHOST].born;
            if ((canseemon(mtmp) || sensemon(mtmp))) {
                pline("A%s ghost appears next to you%c", ngen < 5 ? "n enormous" : "", ngen < 10 ? 33 : 46);
            } else {
                You("sense a presence close by!");
            }
            mtmp.mpeaceful = 0;
            set_malign(mtmp);
            if (game.flags.verbose) {
                You("are frightened to death, and unable to move.");
            }
            nomul(-3);
            game.multi_reason = "being terrified of a ghost";
            game.nomovemsg = "You regain your composure.";
        }
    }
}
/* reset the move counters used to limit temple entry feedback;
   leaving the level and then returning yields a fresh start */
export function forget_temple_entry(priest) {
    let epri_p = priest.ispriest ? ((priest).mextra.epri) : null;
    if (!epri_p) {
        impossible("attempting to manipulate shrine data for non-priest?");
        return;
    }
    epri_p.intone_time = epri_p.enter_time = epri_p.peaceful_time = epri_p.hostile_time = 0;
}
const __priest_talk_cranky_msg = ["Thou wouldst have words, eh?  I'll give thee a word or two!", "Talk?  Here is what I have to say!", "Pilgrim, I would speak no longer with thee."];
export function priest_talk(priest) {
    let coaligned = p_coaligned(priest);
    let strayed = (game.u.ualign.record < 0);
    let cheapskate = null;
    if (((priest).mextra.epri)) {
        cheapskate = ((priest).mextra.epri).cheapskate_count;
    }
    /*
     * Note: we won't be called if hero is Deaf [since dochat() will
     * return before calling domonnoise()], so we don't need to check
     * for that before the various calls to verbalize() here.
     */
    if (!game.u.uconduct.gnostic++) {
        livelog_printf(32, "rejected atheism by consulting with %s", mon_nam(priest));
    }
    if (priest.mflee || (!priest.ispriest && coaligned && strayed)) {
        pline("%s doesn't want anything to do with you!", Monnam(priest));
        priest.mpeaceful = 0;
        return;
    }
    if (!inhistemple(priest) || !priest.mpeaceful || ((priest).msleeping || !(priest).mcanmove)) {
        if (((priest).msleeping || !(priest).mcanmove)) {
            /* priests don't chat unless peaceful and in their own temple */
            pline("%s breaks out of %s reverie!", Monnam(priest), (genders[pronoun_gender(priest, 2)].his));
            priest.mfrozen = priest.msleeping = 0;
            priest.mcanmove = 1;
        }
        priest.mpeaceful = 0;
        ;
        verbalize("%s", __priest_talk_cranky_msg[rn2(3)]);
        return;
    }
    if (priest.mpeaceful && in_rooms(priest.mx, priest.my, TEMPLE) && !has_shrine(priest)) {
        ;
        /* you desecrated the temple and now you want to chat? */
        verbalize("Begone!  Thou desecratest this holy place with thy presence.");
        priest.mpeaceful = 0;
        return;
    }
    if (!money_cnt(game.invent)) {
        if (coaligned && !strayed) {
            let pmoney = money_cnt(priest.minvent);
            if (pmoney > 0) {
                let bits = null;
                bits = ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? currency(pmoney) : (pmoney == 1) ? "bit" : "bits";
                /* Note: two bits is actually 25 cents.  Hmm. */
                pline("%s gives you %s%s for an ale.", Monnam(priest), (pmoney == 1) ? "one " : "two ", bits);
                money2u(priest, pmoney > 1 ? 2 : 1);
            } else {
                pline("%s preaches the virtues of poverty.", Monnam(priest));
            }
            exercise(A_WIS, (1));
        } else {
            pline("%s is not interested.", Monnam(priest));
        }
        return;
    } else {
        /* there's now some randomization in how much you need to donate, but
           you are given suggested donation values that will guarantee
           clairvoyance and protection respectively; with more gold visible
           you need to donate more but get a greater effect; and if you
           cheapskate out to rerandomize the donation amounts they will be
           higher next time */
        let offer = 0;
        let suggested = (game.u.ulevelpeak ? game.u.ulevelpeak : 1) * (rn2(101) + (150 + (cheapskate ? cheapskate : 0) * 40));
        let quan = Math.trunc(money_cnt(game.invent) / (suggested * 3));
        let buf = '';
        if (quan < 1) {
            quan = 1;
        }
        buf = sprintf(buf, "How much will you offer (suggested: %ld or %ld)?", suggested * quan, suggested * quan * 2);
        if (game.flags.debug) {
            pline("%s asks you for a contribution for the temple (base %ld).", Monnam(priest), suggested);
        } else {
            pline("%s asks you for a contribution for the temple.", Monnam(priest));
        }
        if ((offer = bribe(priest, buf)) == 0) {
            ;
            verbalize("Thou shalt regret thine action!");
            if (coaligned) {
                adjalign(-1);
            }
            if (cheapskate) {
                ++cheapskate;
            }
        } else if (offer < suggested * quan) {
            if (money_cnt(game.invent) > (offer * 2)) {
                ;
                verbalize("Cheapskate.");
                if (cheapskate) {
                    ++cheapskate;
                }
            } else {
                ;
                verbalize("I thank thee for thy contribution.");
                exercise(A_WIS, (1));
            }
        } else if (offer < suggested * quan * 2) {
            ;
            verbalize("Thou art indeed a pious individual.");
            if (money_cnt(game.invent) < (offer * 2)) {
                if (coaligned && game.u.ualign.record <= (-4)) {
                    adjalign(1);
                }
            }
            verbalize("I bestow upon thee a blessing.");
            incr_itimeout({ get value() { return game.u.uprops[CLAIRVOYANT].intrinsic; }, set value(_v) { game.u.uprops[CLAIRVOYANT].intrinsic = _v; } }, (rn2(Math.trunc(500 * offer / suggested)) + (Math.trunc(500 * offer / suggested))));
        } else if (offer < suggested * quan * 3) {
            let orig_ublessed = game.u.ublessed;
            if (!(game.u.uprops[PROTECTION].intrinsic & (67108864 | 33554432 | 16777216))) {
                game.u.uprops[PROTECTION].intrinsic |= 67108864;
                /* u.ublessed is only active when Protection is enabled via
               something other than worn gear (theft by gremlin clears the
               intrinsic but not its former magnitude, making it
               recoverable) */
                /* force "rewarded" message */
                orig_ublessed = -1;
            }
            for (; offer >= (2 * suggested); offer -= (2 * suggested)) {
                if (!game.u.ublessed) {
                    game.u.ublessed = (rn2(3) + (2));
                } else if (game.u.ublessed < 20 && (game.u.ublessed < 9 || !rn2(game.u.ublessed))) {
                    game.u.ublessed++;
                }
            }
            ;
            if (game.u.ublessed > orig_ublessed) {
                verbalize("Thou hast been rewarded for thy devotion.");
            } else {
                verbalize("Thy selfless generosity is deeply appreciated.");
            }
        } else {
            ;
            verbalize("Thy selfless generosity is deeply appreciated.");
            if (money_cnt(game.invent) < (offer * 2) && coaligned) {
                if (strayed && (game.moves - game.u.ucleansed) > 5000) {
                    /* money_cnt check is preserved for futureproofing but probably
               can't fail in the current code */
                    game.u.ualign.record = 0;
                    game.u.ucleansed = game.moves;
                } else {
                    adjalign(2);
                }
            }
        }
    }
}
export function mk_roamer(ptr, alignment, x, y, peaceful) {
    let roamer = null;
    let coaligned = (game.u.ualign.type == alignment);
    /* this was due to permonst's pxlth field which is now gone */
    if ((game.level.monsters[x][y] != null)) {
        rloc((game.level.monsters[x][y]), 4);
    }
    if (!(roamer = makemon(ptr, x, y, 16 | 1024 | 131072))) {
        return null;
    }
    ((roamer).mextra.emin).min_align = alignment;
    ((roamer).mextra.emin).renegade = (coaligned && !peaceful);
    roamer.ispriest = 0;
    roamer.isminion = 1;
    mon_learns_traps(roamer, ALL_TRAPS);
    roamer.mpeaceful = peaceful;
    roamer.msleeping = 0;
    /* peaceful may have changed */
    set_malign(roamer);
    return roamer;
}
export function reset_hostility(roamer) {
    if (!roamer.isminion) {
        return;
    }
    if (roamer.data != game.mons[PM_ALIGNED_CLERIC] && roamer.data != game.mons[PM_ANGEL]) {
        return;
    }
    if (((roamer).mextra.emin).min_align != game.u.ualign.type) {
        roamer.mpeaceful = roamer.mtame = 0;
        set_malign(roamer);
    }
    newsym(roamer.mx, roamer.my);
}
/* if non-null, <mx,my> overrides <x,y> */
export function in_your_sanctuary(mon, x, y) {
    let roomno = 0;
    let priest = null;
    if (mon) {
        if ((((mon.data).mflags2 & 4096) != 0) || ((mon.data) == game.mons[PM_DEATH] || (mon.data) == game.mons[PM_FAMINE] || (mon.data) == game.mons[PM_PESTILENCE])) {
            return (0);
        }
        x = mon.mx , y = mon.my;
    }
    if (game.u.ualign.record <= (-4)) {
        return (0);
    }
    if ((roomno = temple_occupied(game.u.urooms)) == 0 || roomno != in_rooms(x, y, TEMPLE)) {
        return (0);
    }
    if ((priest = findpriest(roomno)) == null) {
        return (0);
    }
    return (has_shrine(priest) && p_coaligned(priest) && priest.mpeaceful);
}
/* when attacking "priest" in his temple */
export function ghod_hitsu(priest) {
    let troom = null;
    let oldbuzzer = null;
    let oldcurrwand = null;
    let x = 0;
    let y = 0;
    let ax = 0;
    let ay = 0;
    let roomno = temple_occupied(game.u.urooms);
    if (!roomno || !has_shrine(priest)) {
        return;
    }
    ax = x = ((priest).mextra.epri).shrpos.x;
    ay = y = ((priest).mextra.epri).shrpos.y;
    troom = game.rooms[roomno - 3];
    if (((x) == game.u.ux && (y) == game.u.uy) || !linedup(game.u.ux, game.u.uy, x, y, 1)) {
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == DOOR)) {
            if (game.u.ux == troom.lx - 1) {
                x = troom.hx;
                y = game.u.uy;
            } else if (game.u.ux == troom.hx + 1) {
                x = troom.lx;
                y = game.u.uy;
            } else if (game.u.uy == troom.ly - 1) {
                x = game.u.ux;
                y = troom.hy;
            } else if (game.u.uy == troom.hy + 1) {
                x = game.u.ux;
                y = troom.ly;
            }
        } else {
            switch (rn2(4)) {
                case 0:
                    x = game.u.ux;
                    y = troom.ly;
                    break;
                case 1:
                    x = game.u.ux;
                    y = troom.hy;
                    break;
                case 2:
                    x = troom.lx;
                    y = game.u.uy;
                    break;
                default:
                    x = troom.hx;
                    y = game.u.uy;
                    break;
            }
        }
        if (!linedup(game.u.ux, game.u.uy, x, y, 1)) {
            return;
        }
    }
    switch (rn2(3)) {
        case 0:
            pline("%s roars in anger:  \"Thou shalt suffer!\"", a_gname_at(ax, ay));
            break;
        case 1:
            pline("%s voice booms:  \"How darest thou harm my servant!\"", s_suffix(a_gname_at(ax, ay)));
            break;
        default:
            pline("%s roars:  \"Thou dost profane my shrine!\"", a_gname_at(ax, ay));
            break;
    }
    /* bolt of lightning cast by unspecified monster */
    oldcurrwand = game.current_wand;
    game.current_wand = null;
    oldbuzzer = game.buzzer;
    game.buzzer = null;
    buzz((-10 - ((abs((6) - 1) % 10))), 6, x, y, sgn(game.tbx), sgn(game.tby));
    game.buzzer = oldbuzzer;
    game.current_wand = oldcurrwand;
    exercise(A_WIS, (0));
}
export function angry_priest() {
    let priest = null;
    let lev = null;
    if ((priest = findpriest(temple_occupied(game.u.urooms))) != null) {
        let eprip = ((priest).mextra.epri);
        wakeup(priest, (0));
        setmangry(priest, (0));
        /*
         * If the altar has been destroyed or converted, let the
         * priest run loose.
         * (When it's just a conversion and there happens to be
         * a fresh corpse nearby, the priest ought to have an
         * opportunity to try converting it back; maybe someday...)
         */
        lev = game.level.locations[eprip.shrpos.x][eprip.shrpos.y];
        if (!((lev.typ) == ALTAR) || ((((((lev.flags & 7) & 7) == 0) ? (-128) : (((lev.flags & 7) & 7) == 4) ? 1 : (((lev.flags & 7) & 7)) - 2)) != eprip.shralign)) {
            if (!((priest).mextra.emin)) {
                newemin(priest);
            }
            priest.ispriest = 0;
            priest.isminion = 1;
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            ((priest).mextra.emin).min_align = eprip.shralign;
            ((priest).mextra.emin).renegade = (0);
            /* discard priest's memory of his former shrine;
               if we ever implement the re-conversion mentioned
               above, this will need to be removed */
            free_epri(priest);
        }
    }
}
/*
 * When saving bones, find priests that aren't on their shrine level,
 * and remove them.  This avoids big problems when restoring bones.
 * [Perhaps we should convert them into roamers instead?]
 */
export function clearpriests() {
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (mtmp.ispriest && !on_level((((mtmp).mextra.epri).shrlevel), game.u.uz)) {
            mongone(mtmp);
        }
    }
}
/* munge priest-specific structure when restoring -dlc */
export function restpriest(mtmp, ghostly) {
    if (game.u.uz.dlevel) {
        if (ghostly) {
            assign_level((((mtmp).mextra.epri).shrlevel), game.u.uz);
        }
    }
}
/*priest.c*/
/* attacked and spent this move */
/* no message; unfortunately there's no
                      EPRI(priest)->eerie_time available to
                      make sure we give one the first time */
