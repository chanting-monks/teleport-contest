/* NetHack 5.0	explode.c	$NHDT-Date: 1736530208 2025/01/10 09:30:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.122 $ */
/*      Copyright (C) 1990 by Ken Arromdee */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_hear, pline, pline_The } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcpy, strncmpi, strstri } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { exercise } from './attrib.js';
import { isok } from './cmd.js';
import { shield_static, xdir, ydir } from './decl.js';
import { canseemon, curs_on_u, map_invisible, newsym, sensemon, show_glyph, tmp_at, unmap_invisible } from './display.js';
import { flooreffects } from './do.js';
import { Mgender, Monnam, pmname, rndmonnam } from './do_name.js';
import { breaks } from './dothrow.js';
import { In_hell, In_mines, on_level } from './dungeon.js';
import { done } from './end.js';
import { in_rooms, nomul } from './hack.js';
import { dist2, lowc, s_suffix } from './hacklib.js';
import { sobj_at, stackobj } from './invent.js';
import { obj_extract_self, place_object, splitobj } from './mkobj.js';
import { golemeffects, hideunder, maybe_unhide_at, mondead, monkilled, seemimic, setmangry, wake_nearto, xkilled } from './mon.js';
import { Resists_Elem, cvt_adtyp_to_mseenres, dmgtype_fromattack, monstseesu, monstunseesu, resists_magm, sticks } from './mondata.js';
import { closed_door } from './monmove.js';
import { ohitmon, thitu } from './mthrowu.js';
import { ACID_RES, ANTIMAGIC, A_STR, BOULDER, BURNING, COLD_RES, DEAF, DIED, DISINT_RES, EGG, EXPL_FIERY, EXPL_FROSTY, EXPL_MAGICAL, EXPL_MUDDY, EXPL_NOXIOUS, EXPL_WET, FIRE_RES, GLASS, GLYPH_ALTAR_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_EXPLODE_FIERY_OFF, GLYPH_EXPLODE_FROSTY_OFF, GLYPH_EXPLODE_MAGICAL_OFF, GLYPH_EXPLODE_MUDDY_OFF, GLYPH_EXPLODE_NOXIOUS_OFF, GLYPH_EXPLODE_WET_OFF, GOLD_PIECE, HALF_PHDAM, HALLUC, HALLUC_RES, INVULNERABLE, MAXOCLASSES, MAX_GLYPH, N_DIRS_Z, PLNMSG_CAUGHT_IN_EXPLOSION, PLNMSG_TOWER_OF_FLAME, PM_CLERIC, PM_HEALER, PM_KNIGHT, PM_MANES, PM_MONK, PM_PAPER_GOLEM, PM_STRAW_GOLEM, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WIZARD, POISON_RES, POOL, POT_OIL, SCROLL_CLASS, SCR_FIRE, SHOCK_RES, SHOPBASE, SINK, STATUE, STATUE_TRAP, STONE, S_GOLEM, S_VORTEX, S_altar, S_arrow_trap, S_digbeam, S_expl_bc, S_expl_bl, S_expl_br, S_expl_mc, S_expl_ml, S_expl_mr, S_expl_tc, S_expl_tl, S_expl_tr, S_goodpos, S_grave, S_ndoor, S_stone, S_trwall, S_vwall, TRAPNUM, WAND_CLASS, WAN_DIGGING, WAN_MAGIC_MISSILE, WAN_SLEEP, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned } from './nh-constants.js';
import { Tobjnam } from './objnam.js';
import { rehumanize, ugolemeffects } from './polyself.js';
import { unpunish } from './read.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { addtobill, costly_spot, credit_report, pay_for_damage, shop_keeper } from './shk.js';
import { burn_away_slime, end_burn } from './timeout.js';
import { burnarmor, deltrap, ignite_items, t_at } from './trap.js';
import { dmgval } from './weapon.js';
import { break_statue, destroy_items, fracture_rock, resist, zap_over_floor } from './zap.js';

/* Note: Arrays are column first, while the screen is row first */
const explosion = [[S_expl_tl, S_expl_ml, S_expl_bl], [S_expl_tc, S_expl_mc, S_expl_bc], [S_expl_tr, S_expl_mr, S_expl_br]];
/* what to do at [x+i][y+j] for i=-1,0,1 and j=-1,0,1 */
export const EXPL_NONE = 0;
export const EXPL_MON = 1;
export const EXPL_HERO = 2;
export const EXPL_SKIP = 4;
/* not specified yet or no shield effect needed */
/* monster is affected */
/* hero is affected */
/* don't apply shield effect (out of bounds) */
/* check if shield effects are needed for location affected by explosion */
/* target monster (might be youmonst) */
/* damage type */
/* object class (only matters for AD_DISN) */
export async function explosionmask(m, adtyp, olet) {
    let res = EXPL_NONE;
    if (m == game.youmonst) {
        switch (adtyp) {
            case 0:
                break;
            case 1:
                if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                    res = EXPL_HERO;
                }
                break;
            case 2:
                if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                    res = EXPL_HERO;
                }
                break;
            case 3:
                if ((game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
                    res = EXPL_HERO;
                }
                break;
            case 5:
                if ((olet == WAND_CLASS) ? (((((m.data).mflags2 & 2) != 0) || (m.data) == game.mons[PM_MANES] || (((m.data).mlet == S_GOLEM) || (m.data).mlet == S_VORTEX)) || (((m.data).mflags2 & 256) != 0)) : (game.u.uprops[DISINT_RES].intrinsic || game.u.uprops[DISINT_RES].extrinsic)) {
                    res = EXPL_HERO;
                }
                break;
            case 6:
                if ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
                    res = EXPL_HERO;
                }
                break;
            case 7:
                if ((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
                    res = EXPL_HERO;
                }
                break;
            case 8:
                if ((game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
                    res = EXPL_HERO;
                }
                break;
            default:
                await impossible("explosion type %d?", adtyp);
                break;
        }
    } else {
        switch (adtyp) {
            case 0:
                break;
            case 1:
                if (resists_magm(m)) {
                    res = EXPL_MON;
                }
                break;
            case 2:
                if (await Resists_Elem(m, FIRE_RES)) {
                    res = EXPL_MON;
                }
                break;
            case 3:
                if (await Resists_Elem(m, COLD_RES)) {
                    res = EXPL_MON;
                }
                break;
            case 5:
                if ((olet == WAND_CLASS) ? (((((m.data).mflags2 & 2) != 0) || (m.data) == game.mons[PM_MANES] || (((m.data).mlet == S_GOLEM) || (m.data).mlet == S_VORTEX)) || (((m.data).mflags2 & 256) != 0) || ((m).cham == PM_VAMPIRE || (m).cham == PM_VAMPIRE_LEADER || (m).cham == PM_VLAD_THE_IMPALER)) : !!await Resists_Elem(m, DISINT_RES)) {
                    res = EXPL_MON;
                }
                break;
            case 6:
                if (await Resists_Elem(m, SHOCK_RES)) {
                    res = EXPL_MON;
                }
                break;
            case 7:
                if (await Resists_Elem(m, POISON_RES)) {
                    res = EXPL_MON;
                }
                break;
            case 8:
                if (await Resists_Elem(m, ACID_RES)) {
                    res = EXPL_MON;
                }
                break;
            default:
                await impossible("explosion type %d?", adtyp);
                break;
        }
    }
    return res;
}
export async function engulfer_explosion_msg(adtyp, olet) {
    let adj = null;
    if ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null)) {
        switch (adtyp) {
            case 2:
                adj = "heartburn";
                break;
            case 3:
                adj = "chilly";
                break;
            case 5:
                if (olet == WAND_CLASS) {
                    adj = "irradiated by pure energy";
                } else {
                    adj = "perforated";
                }
                break;
            case 6:
                adj = "shocked";
                break;
            case 7:
                adj = "poisoned";
                break;
            case 8:
                adj = "an upset stomach";
                break;
            default:
                adj = "fried";
                break;
        }
        await pline("%s gets %s!", await Monnam(game.u.ustuck), adj);
    } else {
        switch (adtyp) {
            case 2:
                adj = "toasted";
                break;
            case 3:
                adj = "chilly";
                break;
            case 5:
                if (olet == WAND_CLASS) {
                    adj = "overwhelmed by pure energy";
                } else {
                    adj = "perforated";
                }
                break;
            case 6:
                adj = "shocked";
                break;
            case 7:
                adj = "intoxicated";
                break;
            case 8:
                adj = "burned";
                break;
            default:
                adj = "fried";
                break;
        }
        await pline("%s gets slightly %s!", await Monnam(game.u.ustuck), adj);
    }
}
/* Note: I had to choose one of three possible kinds of "type" when writing
 * this function: a wand type (like in zap.c), an adtyp, or an object type.
 * Wand types get complex because they must be converted to adtyps for
 * determining such things as fire resistance.  Adtyps get complex in that
 * they don't supply enough information--was it a player or a monster that
 * did it, and with a wand, spell, or breath weapon?  Object types share both
 * these disadvantages....
 *
 * Note: anything with a AT_BOOM AD_PHYS attack uses PHYS_EXPL_TYPE for type.
 *
 * Important note about Half_physical_damage:
 *      Unlike losehp(), explode() makes the Half_physical_damage adjustments
 *      itself, so the caller should never have done that ahead of time.
 *      It has to be done this way because the damage value is applied to
 *      things beside the player. Care is taken within explode() to ensure
 *      that Half_physical_damage only affects the damage applied to the hero.
 */
/* explosion's location;
                           * adjacent spots are also affected */
/* same as in zap.c; -(wand typ) for some WAND_CLASS */
/* damage amount */
/* object class or BURNING_OIL or MON_EXPLODE */
/* explosion type: controls color of explosion glyphs */
export async function explode(x, y, type, dam, olet, expltype) {
    let i = 0;
    let j = 0;
    let k = 0;
    let damu = dam;
    let starting = 1;
    let visible = 0;
    let any_shield = 0;
    /* 0=unhurt, 1=items damaged, 2=you and items damaged */
    let uhurt = 0;
    let str = null;
    let mtmp = null;
    let mdef = null;
    let adtyp = 0;
    /* 0=normal explosion, 1=do shieldeff, 2=do nothing */
    let explmask = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    let xx = 0;
    let yy = 0;
    let shopdamage = (0);
    let generic = (0);
    let do_hallu = (0);
    let inside_engulfer = 0;
    let grabbed = 0;
    let grabbing = 0;
    let grabxy = { x: 0, y: 0 };
    let hallu_buf = '';
    let killr_buf = '';
    let exploding_wand_typ = 0;
    let you_exploding = (olet == (MAXOCLASSES + 2) && type >= 0);
    let didmsg = (0);
    if (olet == WAND_CLASS) {
        if (type < 0) {
            /* 'type' is passed as (wand's object type * -1); save
           object type and convert 'type' itself to zap-type */
            type = -type;
            exploding_wand_typ = type;
            if (game.objects[type].oc_dir == 3 && type != WAN_DIGGING && type != WAN_SLEEP) {
                /* most attack wands produce specific explosions;
               other types produce a generic magical explosion */
                type -= WAN_MAGIC_MISSILE;
                if (type < 0 || type > 9) {
                    await impossible("explode: wand has bad zap type (%d).", type);
                    /* hardcoded to generic magic explosion */
                    type = 0;
                }
            } else {
                type = 0;
            }
        }
        switch ((game.urole.mnum)) {
            case PM_CLERIC:
            case PM_MONK:
            case PM_WIZARD:
                damu = Math.trunc(damu / 5);
                break;
            case PM_HEALER:
            case PM_KNIGHT:
                damu = Math.trunc(damu / 2);
                break;
            default:
                break;
        }
    } else if (olet == (MAXOCLASSES + 1)) {
        /* used to provide extra information to zap_over_floor() */
        exploding_wand_typ = POT_OIL;
    } else if (olet == SCROLL_CLASS) {
        exploding_wand_typ = SCR_FIRE;
    } else if (olet == (MAXOCLASSES + 3)) {
        type = 0;
    }
    if (expltype < 0) {
        /* hero gets credit/blame for killing this monster, not others */
        mdef = (game.level.monsters[x][y]);
        expltype = -expltype;
    }
    /* if hero is engulfed and caused the explosion, only hero and
       engulfer will be affected */
    inside_engulfer = (game.u.uswallow && type >= 0);
    /* held but not engulfed implies holder is reaching into second spot
       so might get hit by double damage */
    grabbed = grabbing = (0);
    if (game.u.ustuck && !game.u.uswallow) {
        if ((game.u.umonnum != game.u.umonster) && sticks(game.youmonst.data)) {
            grabbing = (1);
        } else {
            grabbed = (1);
        }
        grabxy.x = game.u.ustuck.mx;
        grabxy.y = game.u.ustuck.my;
    } else {
        grabxy.x = grabxy.y = 0;
    }
    if (olet == (MAXOCLASSES + 2) && !you_exploding) {
        /* FIXME:
     *  It is possible for a grabber to be outside the explosion
     *  radius and reaching inside to hold the hero.  If so, it ought
     *  to take damage (the extra half of double damage).  It is also
     *  possible for poly'd hero to be outside the radius and reaching
     *  in to hold a monster.  Hero should take damage in that situation.
     *
     *  Probably the simplest way to handle this would be to expand
     *  the radius used when collecting targets but exclude everything
     *  beyond the regular radius which isn't reaching inside.  Then
     *  skip harm to gear of any extended targets when inflicting damage.
     */
        /* when explode() is called recursively, svk.killer.name might change
           so retain a copy of the current value for this explosion */
        str = strcpy(killr_buf, game.killer.name);
        do_hallu = ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (strstri(str, "'s explosion") || strstri(str, "s' explosion")));
    }
    if (type == -1) {
        /* currently only gas spores */
        adtyp = 0;
    } else {
        /* If str is e.g. "flaming sphere's explosion" from above, we want to
         * still assign adtyp appropriately, but not replace str. */
        let adstr = null;
        switch (abs(type) % 10) {
            case 0:
                adstr = "magical blast";
                adtyp = 1;
                break;
            case 1:
                adstr = (olet == (MAXOCLASSES + 1)) ? "burning oil" : (olet == SCROLL_CLASS) ? "tower of flame" : "fireball";
                /* fire damage, not physical damage */
                adtyp = 2;
                break;
            case 2:
                adstr = "ball of cold";
                adtyp = 3;
                break;
            case 4:
                adstr = (olet == WAND_CLASS) ? "death field" : "disintegration field";
                adtyp = 5;
                break;
            case 5:
                adstr = "ball of lightning";
                adtyp = 6;
                break;
            case 6:
                adstr = "poison gas cloud";
                adtyp = 7;
                break;
            case 7:
                adstr = "splash of acid";
                adtyp = 8;
                break;
            default:
                await impossible("explosion base type %d?", type);
                return;
        }
        if (!str) {
            str = adstr;
        }
    }
    any_shield = visible = (0);
    for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
            xx = x + i - 1;
            yy = y + j - 1;
            if (!isok(xx, yy)) {
                explmask[i][j] = EXPL_SKIP;
                continue;
            }
            explmask[i][j] = EXPL_NONE;
            if (((xx) == game.u.ux && (yy) == game.u.uy)) {
                explmask[i][j] = await explosionmask(game.youmonst, adtyp, olet);
            }
            /* can be both you and mtmp if you're swallowed or riding */
            mtmp = (game.level.monsters[xx][yy]);
            if (!mtmp && ((xx) == game.u.ux && (yy) == game.u.uy)) {
                mtmp = game.u.usteed;
            }
            if (mtmp && ((mtmp).mhp < 1)) {
                mtmp = null;
            }
            if (mtmp) {
                explmask[i][j] |= await explosionmask(mtmp, adtyp, olet);
            }
            if (mtmp && ((game.viz_array[yy][xx] & 2) != 0) && !(canseemon(mtmp) || sensemon(mtmp))) {
                await map_invisible(xx, yy);
            } else if (!mtmp) {
                await unmap_invisible(xx, yy);
            }
            if (((game.viz_array[yy][xx] & 2) != 0)) {
                visible = (1);
            }
            if ((explmask[i][j] & (EXPL_MON | EXPL_HERO)) != 0) {
                any_shield = (1);
            }
        }
    }
    if (visible) {
        for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
                if (explmask[i][j] == EXPL_SKIP) {
                    /* for inside_engulfer, only <u.ux,u.uy> is affected */
                    continue;
                }
                xx = x + i - 1;
                yy = y + j - 1;
                await tmp_at(starting ? (-1) : (-6), ((explosion[i][j]) - S_expl_tl + (((expltype) == EXPL_FROSTY) ? GLYPH_EXPLODE_FROSTY_OFF : ((expltype) == EXPL_MAGICAL) ? GLYPH_EXPLODE_MAGICAL_OFF : ((expltype) == EXPL_WET) ? GLYPH_EXPLODE_WET_OFF : ((expltype) == EXPL_MUDDY) ? GLYPH_EXPLODE_MUDDY_OFF : ((expltype) == EXPL_NOXIOUS) ? GLYPH_EXPLODE_NOXIOUS_OFF : GLYPH_EXPLODE_FIERY_OFF)));
                await tmp_at(xx, yy);
                starting = 0;
            }
        }
        await curs_on_u();
        if (any_shield && game.flags.sparkle) {
            for (k = 0; k < 21; k++) {
                for (i = 0; i < 3; i++) {
                    for (j = 0; j < 3; j++) {
                        /*
                             * Bypass tmp_at() and send the shield glyphs
                             * directly to the buffered screen.  tmp_at()
                             * will clean up the location for us later.
                             */
                        /* Cover last shield glyph with blast symbol. */
                        xx = x + i - 1;
                        yy = y + j - 1;
                        if ((explmask[i][j] & (EXPL_MON | EXPL_HERO)) != 0) {
                            await show_glyph(xx, yy, (((shield_static[k]) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((shield_static[k]) <= S_trwall) ? ((shield_static[k]) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((shield_static[k]) < S_altar) ? (((shield_static[k]) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((shield_static[k]) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((shield_static[k]) < S_arrow_trap + (TRAPNUM - 1)) ? (((shield_static[k]) - S_grave) + GLYPH_CMAP_B_OFF) : ((shield_static[k]) <= S_goodpos) ? (((shield_static[k]) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
                        }
                    }
                }
                await curs_on_u();
                (game.windowprocs.win_delay_output)();
            }
            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    xx = x + i - 1;
                    yy = y + j - 1;
                    if ((explmask[i][j] & (EXPL_MON | EXPL_HERO)) != 0) {
                        await show_glyph(xx, yy, ((explosion[i][j]) - S_expl_tl + (((expltype) == EXPL_FROSTY) ? GLYPH_EXPLODE_FROSTY_OFF : ((expltype) == EXPL_MAGICAL) ? GLYPH_EXPLODE_MAGICAL_OFF : ((expltype) == EXPL_WET) ? GLYPH_EXPLODE_WET_OFF : ((expltype) == EXPL_MUDDY) ? GLYPH_EXPLODE_MUDDY_OFF : ((expltype) == EXPL_NOXIOUS) ? GLYPH_EXPLODE_NOXIOUS_OFF : GLYPH_EXPLODE_FIERY_OFF)));
                    }
                }
            }
        } else {
            (game.windowprocs.win_delay_output)();
            (game.windowprocs.win_delay_output)();
        }
        await tmp_at((-7), 0);
    } else {
        if (olet == (MAXOCLASSES + 2) || olet == (MAXOCLASSES + 3)) {
            str = "explosion";
            generic = (1);
        }
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && olet != SCROLL_CLASS) {
            ;
            await You_hear("a blast.");
            didmsg = (1);
        }
    }
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !didmsg) {
        await pline("Boom!");
    }
    if (dam) {
        for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
                /* apply effects to monsters and floor objects first, in case the
       damage to the hero is fatal and leaves bones */
                let itemdmg = 0;
                if (explmask[i][j] == EXPL_SKIP) {
                    continue;
                }
                xx = x + i - 1;
                yy = y + j - 1;
                if (((xx) == game.u.ux && (yy) == game.u.uy)) {
                    uhurt = ((explmask[i][j] & EXPL_HERO) != 0) ? 1 : 2;
                    /* If the player is attacking via polyself into something
                     * with an explosion attack, leave them (and their gear)
                     * unharmed, to avoid punishing them from using such
                     * polyforms creatively */
                    if (!game.context.mon_moving && you_exploding) {
                        uhurt = 0;
                    }
                } else if (inside_engulfer) {
                    continue;
                }
                /* Affect the floor unless the player caused the explosion
                 * from inside their engulfer. */
                if (!(game.u.uswallow && !game.context.mon_moving)) {
                    await zap_over_floor(xx, yy, type, { get value() { return shopdamage; }, set value(_v) { shopdamage = _v; } }, (0), exploding_wand_typ);
                }
                mtmp = (game.level.monsters[xx][yy]);
                if (!mtmp && ((xx) == game.u.ux && (yy) == game.u.uy)) {
                    mtmp = game.u.usteed;
                }
                if (!mtmp) {
                    continue;
                }
                if (do_hallu) {
                    let tryct = 0;
                    do {
                        hallu_buf = sprintf(hallu_buf, "%s explosion", s_suffix(await rndmonnam(null)));
                    } while (hallu_buf != lowc(hallu_buf) && ++tryct < 20);
                    str = hallu_buf;
                }
                if ((game.u.uswallow && (game.u.ustuck == (mtmp)))) {
                    await engulfer_explosion_msg(adtyp, olet);
                } else if (((game.viz_array[yy][xx] & 2) != 0)) {
                    if (mtmp.m_ap_type) {
                        await seemimic(mtmp);
                    }
                    await pline("%s is caught in the %s!", await Monnam(mtmp), str);
                }
                itemdmg = await destroy_items(mtmp, adtyp, dam);
                if (adtyp == 2) {
                    await burnarmor(mtmp);
                    await ignite_items(mtmp.minvent);
                }
                if ((explmask[i][j] & EXPL_MON) != 0) {
                    await golemeffects(mtmp, adtyp, dam);
                    mtmp.mhp -= itemdmg;
                } else {
                    /* Call resist with 0 and do damage manually so 1) we can
                     * get out the message before doing the damage, and 2) we
                     * can call mondied, not killed, if it's not your blast.
                     */
                    let mdam = dam;
                    if (await resist(mtmp, olet, 0, (0))) {
                        /* inside_engulfer: <xx,yy> == <u.ux,u.uy> */
                        if (((game.viz_array[yy][xx] & 2) != 0) || inside_engulfer) {
                            await pline("%s resists the %s!", await Monnam(mtmp), str);
                        }
                        mdam = Math.trunc((dam + 1) / 2);
                    }
                    /* if grabber is reaching into hero's spot and
                       hero's spot is within explosion radius, grabber
                       gets hit by double damage */
                    if (grabbed && mtmp == game.u.ustuck && (dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2)) {
                        mdam *= 2;
                    }
                    if (await Resists_Elem(mtmp, COLD_RES) && adtyp == 2) {
                        mdam *= 2;
                    } else if (await Resists_Elem(mtmp, FIRE_RES) && adtyp == 3) {
                        mdam *= 2;
                    }
                    mtmp.mhp -= mdam + itemdmg;
                }
                if (((mtmp).mhp < 1)) {
                    let xkflg = ((adtyp == 2 && ((mtmp.data) == game.mons[PM_PAPER_GOLEM] || (mtmp.data) == game.mons[PM_STRAW_GOLEM])) ? 2 : 0);
                    if (!game.context.mon_moving) {
                        await xkilled(mtmp, 0 | xkflg);
                    } else if (mdef && mtmp == mdef) {
                        /* 'mdef' killed self trying to cure being turned
                         * into slime due to some action by the player.
                         * Hero gets the credit (experience) and most of
                         * the blame (possible loss of alignment and/or
                         * luck and/or telepathy depending on mtmp) but
                         * doesn't break pacifism.  xkilled()'s message
                         * would be "you killed <mdef>" so give our own.
                         */
                        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0) || (canseemon(mtmp) || sensemon(mtmp))) {
                            await pline("%s is %s!", await Monnam(mtmp), xkflg ? "burned completely" : ((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) ? "destroyed" : "killed");
                        }
                        await xkilled(mtmp, 1 | 4 | xkflg);
                    } else {
                        if (xkflg) {
                            adtyp = 242;
                        }
                        await monkilled(mtmp, "", adtyp);
                    }
                } else if (!game.context.mon_moving) {
                    await setmangry(mtmp, (1));
                }
            }
        }
    }
    if (uhurt) {
        if (game.flags.verbose && (type < 0 || olet != SCROLL_CLASS)) {
            if (do_hallu) {
                do {
                    hallu_buf = sprintf(hallu_buf, "%s explosion", s_suffix(await rndmonnam(null)));
                } while (hallu_buf != lowc(hallu_buf));
                str = hallu_buf;
            }
            await You("are caught in the %s!", str);
            game.iflags.last_msg = PLNMSG_CAUGHT_IN_EXPLOSION;
        }
        if (adtyp == 2) {
            await burn_away_slime();
        }
        if (game.u.uprops[INVULNERABLE].intrinsic) {
            damu = 0;
            await You("are unharmed!");
        } else if (adtyp == 0 || adtyp == 8) {
            damu = (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((damu) + 1) / 2)) : (damu));
        }
        if (adtyp == 2) {
            await burnarmor(game.youmonst);
            await ignite_items(game.invent);
        }
        await destroy_items(game.youmonst, adtyp, dam);
        await ugolemeffects(adtyp, damu);
        if (uhurt == 2) {
            /* if poly'd hero is grabbing another victim, hero takes
               double damage (note: don't rely on u.ustuck here because
               that victim might have been killed when hit by the blast) */
            if (grabbing && dist2(grabxy.x, grabxy.y, x, y) <= 2) {
                damu *= 2;
            }
            if ((game.u.umonnum != game.u.umonster)) {
                game.u.mh -= damu;
            /* hero does not get same fire-resistant vs cold and
               cold-resistant vs fire double damage as monsters [why not?] */
            } else {
                game.u.uhp -= damu;
            }
            game.disp.botl = (1);
        }
        /* You resisted the damage, lets not keep that to ourselves */
        if (uhurt == 1) {
            monstseesu(cvt_adtyp_to_mseenres(adtyp));
        } else {
            monstunseesu(cvt_adtyp_to_mseenres(adtyp));
        }
        if (game.u.uhp <= 0 || ((game.u.umonnum != game.u.umonster) && game.u.mh <= 0)) {
            if ((game.u.umonnum != game.u.umonster)) {
                await rehumanize();
            } else {
                if (olet == (MAXOCLASSES + 2)) {
                    /* explosion was unseen; str=="explosion", */
                    if (generic) {
                        ;
                    } else if (str != game.killer.name && str != hallu_buf) {
                        game.killer.name = strcpy(game.killer.name, str);
                    }
                    game.killer.format = 0;
                } else if (olet == (MAXOCLASSES + 3)) {
                    /* svk.killer.name=="gas spore's explosion". */
                    game.killer.format = 2;
                    game.killer.name = nh_snprintf("explode", 655, game.killer.name, 256 /* sizeof(char [256]) */, "caught %sself in a %s", (genders[game.flags.female ? 1 : 0].him), str);
                } else if (type >= 0 && olet != SCROLL_CLASS) {
                    game.killer.format = 2;
                    game.killer.name = nh_snprintf("explode", 660, game.killer.name, 256 /* sizeof(char [256]) */, "caught %sself in %s own %s", (genders[game.flags.female ? 1 : 0].him), (genders[game.flags.female ? 1 : 0].his), str);
                } else {
                    game.killer.format = (!strncmpi((str), ("tower of flame"), -1) || !strncmpi((str), ("fireball"), -1)) ? 0 : 1;
                    game.killer.name = strcpy(game.killer.name, str);
                }
                if (game.iflags.last_msg == PLNMSG_CAUGHT_IN_EXPLOSION || game.iflags.last_msg == PLNMSG_TOWER_OF_FLAME) {
                    await pline("It is fatal.");
                } else {
                    await pline_The("%s is fatal.", str);
                }
                await done((adtyp == 2) ? BURNING : DIED);
            }
        }
        await exercise(A_STR, (0));
    }
    if (shopdamage) {
        await pay_for_damage((adtyp == 2) ? "burn away" : (adtyp == 3) ? "shatter" : (adtyp == 5) ? "disintegrate" : "destroy", (0));
    }
    i = dam * dam;
    if (i < 50) {
        i = 50;
    }
    /* in case random damage is very small */
    if (inside_engulfer) {
        i = Math.trunc((i + 3) / 4);
    }
    await wake_nearto(x, y, i);
}
// struct scatter_chain: { next, obj, ox, oy, dx, dy, range, stopped }
/* pointer to next scatter item */
/* pointer to the object        */
/* location of                  */
/*      item                    */
/* direction of                 */
/*      travel                  */
/* range of object              */
/* flag for in-motion/stopped   */
/*
 * scflags:
 *      VIS_EFFECTS     Add visual effects to display
 *      MAY_HITMON      Objects may hit monsters
 *      MAY_HITYOU      Objects may hit hero
 *      MAY_HIT         Objects may hit you or monsters
 *      MAY_DESTROY     Objects may be destroyed at random
 *      MAY_FRACTURE    Stone objects can be fractured (statues, boulders)
 */
/* returns number of scattered objects */
/* location of objects to scatter */
/* force behind the scattering */
/* only scatter this obj */
export async function scatter(sx, sy, blastforce, scflags, obj) {
    let otmp = null;
    let tmp = 0;
    let farthest = 0;
    let typ = 0;
    let qtmp = 0;
    let used_up = 0;
    let individual_object = obj ? (1) : (0);
    let shop_origin = 0;
    let lostgoods = (0);
    let mtmp = null;
    let shkp = null;
    let stmp = null;
    let stmp2 = null;
    let schain = null;
    let total = 0;
    if (individual_object && (obj.ox != sx || obj.oy != sy)) {
        await impossible("scattered object <%d,%d> not at scatter site <%d,%d>", obj.ox, obj.oy, sx, sy);
    }
    shop_origin = ((shkp = await shop_keeper(in_rooms(sx, sy, SHOPBASE))) != null && await costly_spot(sx, sy));
    if (shop_origin) {
        await credit_report(shkp, 0, (1));
    }
    while ((otmp = (individual_object ? obj : game.level.objects[sx][sy])) != null) {
        if (otmp == game.uball || otmp == game.uchain) {
            /* establish baseline, without msgs */
            let waschain = (otmp == game.uchain);
            ;
            await pline_The("chain shatters!");
            await unpunish();
            if (waschain) {
                continue;
            }
        }
        if (otmp.quan > 1) {
            qtmp = otmp.quan - 1;
            if (qtmp > 32767) {
                qtmp = 32767;
            }
            qtmp = rnd(qtmp);
            otmp = await splitobj(otmp, qtmp);
        } else {
            obj = null;
        }
        await obj_extract_self(otmp);
        used_up = (0);
        if ((scflags & 16) != 0 && (otmp.otyp == BOULDER || otmp.otyp == STATUE) && rn2(10)) {
            if (otmp.otyp == BOULDER) {
                if (((game.viz_array[sy][sx] & 2) != 0)) {
                    await pline("%s apart.", await Tobjnam(otmp, "break"));
                } else {
                    ;
                    await You_hear("stone breaking.");
                }
                await fracture_rock(otmp);
                await place_object(otmp, sx, sy);
                if ((otmp = sobj_at(BOULDER, sx, sy)) != null) {
                    await obj_extract_self(otmp);
                    await place_object(otmp, sx, sy);
                }
            } else {
                let trap = null;
                if ((trap = t_at(sx, sy)) && trap.ttyp == STATUE_TRAP) {
                    await deltrap(trap);
                }
                if (((game.viz_array[sy][sx] & 2) != 0)) {
                    await pline("%s.", await Tobjnam(otmp, "crumble"));
                } else {
                    ;
                    await You_hear("stone crumbling.");
                }
                await break_statue(otmp);
                await place_object(otmp, sx, sy);
            }
            await newsym(sx, sy);
            /* 1 in 10 chance of destruction of obj; glass, egg destruction */
            used_up = (1);
        } else if ((scflags & 8) != 0 && (!rn2(10) || (game.objects[otmp.otyp].oc_material == GLASS || otmp.otyp == EGG))) {
            if (await breaks(otmp, sx, sy)) {
                used_up = (1);
            }
        }
        if (!used_up) {
            stmp = alloc(1 /* sizeof(struct scatter_chain) */);
            stmp.next = null;
            stmp.obj = otmp;
            stmp.ox = sx;
            stmp.oy = sy;
            tmp = rn2((N_DIRS_Z - 2));
            stmp.dx = xdir[tmp];
            stmp.dy = ydir[tmp];
            tmp = blastforce - (Math.trunc(otmp.owt / 40));
            if (tmp < 1) {
                tmp = 1;
            }
            /* anywhere up to that determ. by wt */
            stmp.range = rnd(tmp);
            if (farthest < stmp.range) {
                farthest = stmp.range;
            }
            stmp.stopped = (0);
            if (!schain) {
                schain = stmp;
            } else {
                stmp2.next = stmp;
            }
            stmp2 = stmp;
        }
    }
    while (farthest-- > 0) {
        for (stmp = schain; stmp; stmp = stmp.next) {
            if ((stmp.range-- > 0) && (!stmp.stopped)) {
                /* mainly in case it kills hero */
                game.thrownobj = stmp.obj;
                game.bhitpos.x = stmp.ox + stmp.dx;
                game.bhitpos.y = stmp.oy + stmp.dy;
                if (isok(game.bhitpos.x, game.bhitpos.y)) {
                    typ = game.level.locations[game.bhitpos.x][game.bhitpos.y].typ;
                } else {
                    typ = STONE;
                }
                if (!isok(game.bhitpos.x, game.bhitpos.y)) {
                    game.bhitpos.x -= stmp.dx;
                    game.bhitpos.y -= stmp.dy;
                    stmp.stopped = (1);
                } else if (!((typ) >= POOL) || closed_door(game.bhitpos.x, game.bhitpos.y)) {
                    game.bhitpos.x -= stmp.dx;
                    game.bhitpos.y -= stmp.dy;
                    stmp.stopped = (1);
                } else if ((mtmp = (game.level.monsters[game.bhitpos.x][game.bhitpos.y])) != null) {
                    if (scflags & 2) {
                        stmp.range--;
                        if (await ohitmon(mtmp, stmp.obj, 1, (0))) {
                            stmp.obj = null;
                            stmp.stopped = (1);
                        }
                    }
                } else if (((game.bhitpos.x) == game.u.ux && (game.bhitpos.y) == game.u.uy)) {
                    if (scflags & 4) {
                        let dam = 0;
                        let hitvalu = 0;
                        let hitu = 0;
                        if (game.multi) {
                            nomul(0);
                        }
                        dam = await dmgval(stmp.obj, game.youmonst);
                        hitvalu = 8 + stmp.obj.spe;
                        if (((game.youmonst.data).msize >= 3)) {
                            hitvalu++;
                        }
                        hitu = await thitu(hitvalu, (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dam) + 1) / 2)) : (dam)), { get value() { return stmp.obj; }, set value(_v) { stmp.obj = _v; } }, null);
                        if (!stmp.obj) {
                            stmp.stopped = (1);
                        }
                        if (hitu) {
                            stmp.range -= 3;
                            await stop_occupation();
                        }
                    }
                } else {
                    if (scflags & 1) {}
                }
                stmp.ox = game.bhitpos.x;
                stmp.oy = game.bhitpos.y;
                if (((game.level.locations[stmp.ox][stmp.oy].typ) == SINK)) {
                    stmp.stopped = (1);
                }
                game.thrownobj = null;
            }
        }
    }
    for (stmp = schain; stmp; stmp = stmp2) {
        let x = 0;
        let y = 0;
        let obj_left_shop = (0);
        stmp2 = stmp.next;
        x = stmp.ox;
        y = stmp.oy;
        if (stmp.obj) {
            if (x != sx || y != sy) {
                total += stmp.obj.quan;
                obj_left_shop = (shop_origin && !await costly_spot(x, y));
            }
            if (!await flooreffects(stmp.obj, x, y, "land")) {
                if (obj_left_shop && strchr(game.u.urooms, in_rooms(game.u.ux, game.u.uy, SHOPBASE))) {
                    if (stmp.obj.otyp == GOLD_PIECE) {
                        await addtobill(stmp.obj, (0), (0), (1));
                        lostgoods = (1);
                    }
                }
                await place_object(stmp.obj, x, y);
                await stackobj(stmp.obj);
            }
        }
        free(stmp);
        await newsym(x, y);
    }
    await newsym(sx, sy);
    if (((sx) == game.u.ux && (sy) == game.u.uy) && game.u.uundetected && (((game.youmonst.data).mflags1 & 128) != 0)) {
        await hideunder(game.youmonst);
    }
    if (((mtmp = (game.level.monsters[sx][sy])) != null) && mtmp.mtrapped) {
        mtmp.mtrapped = 0;
    }
    await maybe_unhide_at(sx, sy);
    if (lostgoods) {
        await credit_report(shkp, 1, (0));
    }
    return total;
}
/*
 * Splatter burning oil from x,y to the surrounding area.
 *
 * This routine should really take a how and direction parameters.
 * The how is how it was caused, e.g. kicked verses thrown.  The
 * direction is which way to spread the flaming oil.  Different
 * "how"s would give different dispersal patterns.  For example,
 * kicking a burning flask will splatter differently from a thrown
 * flask hitting the ground.
 *
 * For now, just perform a "regular" explosion.
 */
export async function splatter_burning_oil(x, y, diluted_oil) {
    let dmg = d(diluted_oil ? 3 : 4, 4);
    await explode(x, y, 11, dmg, (MAXOCLASSES + 1), EXPL_FIERY);
}
/* lit potion of oil is exploding; extinguish it as a light source before
   possibly killing the hero and attempting to save bones */
export async function explode_oil(obj, x, y) {
    let diluted_oil = obj.oeroded;
    if (!obj.lamplit) {
        await impossible("exploding unlit oil");
    }
    await end_burn(obj, (1));
    obj.how_lost = 4;
    await splatter_burning_oil(x, y, diluted_oil);
}
/* Convert a damage type into an explosion display type. */
export async function adtyp_to_expltype(adtyp) {
    switch (adtyp) {
        case 6:
        case 241:
        case 16:
        case 41:
            return EXPL_MAGICAL;
        case 2:
            return EXPL_FIERY;
        case 3:
            return EXPL_FROSTY;
        case 7:
        case 30:
        case 31:
        case 33:
        case 38:
        case 0:
            return EXPL_NOXIOUS;
        default:
            await impossible("adtyp_to_expltype: bad explosion type %d", adtyp);
            return EXPL_FIERY;
    }
}
/* A monster explodes in a way that produces a real explosion (e.g. a sphere
 * or gas spore, not a yellow light or similar).
 * This is some common code between explmu() and explmm().
 */
export async function mon_explodes(mon, mattk) {
    let dmg = 0;
    let type = 0;
    if (mattk.damn) {
        dmg = d(mattk.damn, mattk.damd);
    } else if (mattk.damd) {
        dmg = d(mon.data.mlevel + 1, mattk.damd);
    } else {
        dmg = 0;
    }
    if (mattk.adtyp == 0) {
        type = -1;
    } else if (mattk.adtyp >= 1 && mattk.adtyp <= 10) {
        /* The -1, +20, *-1 math is to set it up as a 'monster breath' type
         * for the explosions (it isn't, but this is the closest analogue). */
        /* FIXME: there are macros for kind of thing... */
        type = -((mattk.adtyp - 1) + 20);
    } else {
        await impossible("unknown type for mon_explode %d", mattk.adtyp);
        return;
    }
    if (!((mon).mhp < 1)) {
        await mondead(mon);
    }
    game.killer.name = sprintf(game.killer.name, "%s explosion", s_suffix(pmname(mon.data, Mgender(mon))));
    game.killer.format = 0;
    await explode(mon.mx, mon.my, type, dmg, (MAXOCLASSES + 2), await adtyp_to_expltype(mattk.adtyp));
    game.killer.name = '';
}
/*explode.c*/
/* leave 'res' with EXPL_NONE */
/* will flush screen and output */
/* replace "gas spore" with a different description
                       for each target (we can't distinguish personal names
                       like "Barney" here in order to suppress "the" below,
                       so avoid any which begins with a capital letter) */
/* Damage from ring/wand explosion isn't itself
                     * electrical in nature, nor is damage from freezing
                     * potion really cold in nature, nor is damage from
                     * boiling potion or exploding oil; only burning items
                     * damage is the "same type" as the explosion.  Because
                     * this is imperfect and marginal (burning items only
                     * deal 1 damage), ignore it for golemeffects(). */
/* being resistant to opposite type of damage makes
                       target more vulnerable to current type of damage
                       (when target is also resistant to current type,
                       we won't get here) */
/* all affected monsters, even if mdef is set */
/* give message for any monster-induced explosion
           or player-induced one other than scroll of fire */
/* do property damage first, in case we end up leaving bones */
/* Known BUG: BURNING suppresses corpse in bones data,
                   but done does not handle killer reason correctly */
/* 9 in 10 chance of fracturing boulders or statues */
/* another boulder here, restack it to the top */
/* in case it's beyond radius of 'farthest' */
/* tmp_at(gb.bhitpos.x, gb.bhitpos.y); */
/* At the moment this only takes on gold. While it is
                       simple enough to call addtobill for other items that
                       leave the shop due to scatter(), by default the hero
                       will get billed for the full shopkeeper asking-price
                       on the object's way out of shop. That can leave the
                       hero in a pickle. Even if the hero then manages to
                       retrieve the item and drop it back inside the shop,
                       the owed charges will only be reduced at that point
                       by the lesser shopkeeper buying-price.
                       The non-gold situation will likely get adjusted
                       further.
                     */
/* implies shop_origin and therefore shkp valid */
/* ZT_SPELL(ZT_FIRE) = ZT_SPELL(AD_FIRE-1) = 10+(2-1) = 11 */
/* Electricity isn't magical, but there currently isn't an electric
         * explosion type. Magical is the next best thing. */
/* Kill it now so it won't appear to be caught in its own explosion.
     * Must check to see if already dead - which happens if this is called
     * from an AT_BOOM attack upon death. */
/* This might end up killing you, too; you never know...
     * also, it is used in explode() messages */
