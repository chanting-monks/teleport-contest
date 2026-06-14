/* NetHack 5.0	muse.c	$NHDT-Date: 1770949988 2026/02/12 18:33:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.241 $ */
/*      Copyright (C) 1990 by Ken Arromdee                         */
/* NetHack may be freely redistributed.  See license for details.  */
/*
 * Monster item usage routines.
 */
/* Let monsters use magic items.  Arbitrary assumptions: Monsters only use
 * scrolls when they can see, monsters know when wands have 0 charges,
 * monsters cannot recognize if items are cursed are not, monsters which
 * are confused don't know not to read scrolls, etc....
 */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_feel, You_hear, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_char_write, strcpy, strlen, strncpy } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { arti_reflects, undiscovered_artifact } from './artifact.js';
import { dirtocoord, isok, xytodir } from './cmd.js';
import { destroy_drawbridge, find_drawbridge, is_drawbridge_wall, is_ice, is_lava, is_pool } from './dbridge.js';
import { c_color_names, c_common_strings, cg } from './decl.js';
import { canseemon, cls, docrt, map_invisible, mon_visible, newsym, sensemon, shieldeff, show_glyph } from './display.js';
import { canletgo, dropy, trycall } from './do.js';
import { Monnam, Some_Monnam, a_monnam, hcolor, mon_nam, monverbself, noit_mon_nam, rndmonnam, x_monnam } from './do_name.js';
import { hard_helmet } from './do_wear.js';
import { migrate_to_level } from './dog.js';
import { dog_nutrition } from './dogmove.js';
import { Can_dig_down, Can_fall_thru, Can_rise_up, In_V_tower, In_hell, In_mines, Is_botlevel, On_W_tower_level, ceiling, depth, dunlev, dunlevs_in_dungeon, get_level, ledger_no, on_level, surface } from './dungeon.js';
import { is_fainted } from './eat.js';
import { explode } from './explode.js';
import { in_rooms, losehp, nomul } from './hack.js';
import { dist2, distmin, s_suffix, strsubst, upstart } from './hacklib.js';
import { carrying, freeinv, sobj_at } from './invent.js';
import { doorlock } from './lock.js';
import { grow_up, makemon, rndmonst, set_malign } from './makemon.js';
import { paralyze_monst } from './mhitm.js';
import { add_to_container, bcsign, obj_extract_self, place_object, splitobj, unbless, unknow_object, weight } from './mkobj.js';
import { can_carry, flash_mon, healmon, maybe_unhide_at, mondead, mongone, monkilled, monnear, newcham, seemimic, wakeup, xkilled } from './mon.js';
import { Resists_Elem, attacktype, attacktype_fordmg, can_blow, dmgtype, locomotion, mon_hates_silver, mon_knows_traps, mon_learns_traps, monstseesu, monstunseesu, poly_when_stoned, pronoun_gender, resists_blnd, resists_magm, same_race } from './mondata.js';
import { accessible, closed_door, mon_would_take_item, monflee, onscary } from './monmove.js';
import { lined_up, linedup_callback, m_carrying, m_throw, m_useup } from './mthrowu.js';
import { awaken_soldiers } from './music.js';
import { ACID_RES, AIR, ALTAR, AMULET_CLASS, AMULET_OF_GUARDING, AMULET_OF_LIFE_SAVING, AMULET_OF_REFLECTION, ANTIMAGIC, ART_EYES_OF_THE_OVERWORLD, BAG_OF_HOLDING, BAG_OF_TRICKS, BEAR_TRAP, BLINDED, BOULDER, BUGLE, BULLWHIP, CLOUD, CORPSE, CORR, DEAF, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, EGG, EXPENSIVE_CAMERA, EXPL_FIERY, FIRE_HORN, FIRE_TRAP, FOOD_CLASS, FROST_HORN, GLOB_OF_GREEN_SLIME, GLYPH_ALTAR_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GRAY_DRAGON_SCALES, GRAY_DRAGON_SCALE_MAIL, HALF_SPDAM, HALLUC, HALLUC_RES, HAND, HEAVY_IRON_BALL, HOLE, ICE_BOX, LADDER, LARGE_BOX, LOW_PM, MALE, MAX_GLYPH, M_AP_FURNITURE, M_AP_NOTHING, M_AP_OBJECT, M_SEEN_ACID, M_SEEN_COLD, M_SEEN_ELEC, M_SEEN_FIRE, M_SEEN_MAGR, M_SEEN_REFL, M_SEEN_SLEEP, NON_PM, NUMMONS, N_DIRS_Z, PICK_AXE, PIT, PLNMSG_enum, PM_ACID_BLOB, PM_BAT, PM_CHICKATRICE, PM_CHROMATIC_DRAGON, PM_COCKATRICE, PM_CROCODILE, PM_DJINNI, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_GHOST, PM_GIANT_BAT, PM_GIANT_EEL, PM_GRAY_DRAGON, PM_GREEN_SLIME, PM_GREMLIN, PM_GRID_BUG, PM_GUARD, PM_KI_RIN, PM_LIZARD, PM_MANES, PM_PESTILENCE, PM_SALAMANDER, PM_SILVER_DRAGON, PM_STALKER, PM_VAMPIRE, PM_VAMPIRE_BAT, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, POLY_TRAP, POOL, POTION_CLASS, POT_ACID, POT_BLINDNESS, POT_CONFUSION, POT_EXTRA_HEALING, POT_FULL_HEALING, POT_GAIN_LEVEL, POT_HEALING, POT_INVISIBILITY, POT_OIL, POT_PARALYSIS, POT_POLYMORPH, POT_SICKNESS, POT_SLEEPING, POT_SPEED, P_DAGGER, P_KNIFE, REFLECTING, SCORR, SCROLL_CLASS, SCR_CREATE_MONSTER, SCR_EARTH, SCR_FIRE, SCR_TELEPORTATION, SDOOR, SEE_INVIS, SHIELD_OF_REFLECTION, SHOPBASE, SILVER, SILVER_DRAGON_SCALES, SILVER_DRAGON_SCALE_MAIL, SPE_CANCELLATION, SPIKED_PIT, STAIRS, STONE_RES, STRANGE_OBJECT, S_EYE, S_GHOST, S_GOLEM, S_KOP, S_LIGHT, S_UNICORN, S_VORTEX, S_altar, S_arrow_trap, S_digbeam, S_goodpos, S_grave, S_ndoor, S_stone, S_trwall, S_vwall, TELEPORT_CONTROL, TELEP_TRAP, TEMPLE, TIN, TIN_OPENER, TOOL_CLASS, TRAPDOOR, TRAPNUM, Trap_Killed_Mon, UNICORN_HORN, WAND_CLASS, WAN_CANCELLATION, WAN_COLD, WAN_CREATE_MONSTER, WAN_DEATH, WAN_DIGGING, WAN_FIRE, WAN_LIGHTNING, WAN_LOCKING, WAN_MAGIC_MISSILE, WAN_MAKE_INVISIBLE, WAN_OPENING, WAN_POLYMORPH, WAN_SLEEP, WAN_SPEED_MONSTER, WAN_STRIKING, WAN_TELEPORTATION, WAN_UNDEAD_TURNING, WEAPON_CLASS, WEB, YELLOW_DRAGON_SCALES, YELLOW_DRAGON_SCALE_MAIL, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned } from './nh-constants.js';
import { discover_object, objdescr_is, observe_object } from './o_init.js';
import { an, ansimpleoname, distant_name, doname, makeplural, simpleonames, singular, the, vtense, xname } from './objnam.js';
import { removed_from_icebox } from './pickup.js';
import { Norep, pline_mon, urgent_pline } from './pline.js';
import { body_part } from './polyself.js';
import { make_blinded } from './potion.js';
import { in_your_sanctuary } from './priest.js';
import { drop_boulder_on_monster, drop_boulder_on_player } from './read.js';
import { d, rn2, rn2_on_display_rng, rnd } from './rnd.js';
import { genders } from './role.js';
import { add_damage, inhishop, obfree } from './shk.js';
import { stairway_at } from './stairs.js';
import { mpickobj, remove_worn_item } from './steal.js';
import { place_monster } from './steed.js';
import { enexto, noteleport_level, random_teleport_level, rloc, tele, tele_restrict } from './teleport.js';
import { begin_burn } from './timeout.js';
import { fill_pit, maketrap, mintrap, seetrap, t_at, trapname, unconscious, wearing_iron_shoes } from './trap.js';
import { recalc_block_point, unblock_point } from './vision.js';
import { mwelded, welded } from './wield.js';
import { mon_has_amulet, mon_has_special } from './wizard.js';
import { worm_move } from './worm.js';
import { extract_from_minvent, find_mac, mon_adjust_speed, mon_set_minvis, which_armor } from './worn.js';
import { bhito, buzz, cancel_monst, dobuzz, exclam, hit, lightdamage, miss, resist, unturn_dead, unturn_you, zhitm } from './zap.js';

/* Any preliminary checks which may result in the monster being unable to use
 * the item.  Returns 0 if nothing happened, 2 if the monster can't do
 * anything (i.e. it teleported) and 1 if it's dead.
 */
const __precheck_empty = "The potion turns out to be empty.";
export async function precheck(mon, obj) {
    let vis = 0;
    if (!obj) {
        return 0;
    }
    vis = ((game.viz_array[mon.my][mon.mx] & 2) != 0);
    if (obj.oclass == POTION_CLASS) {
        let cc = { x: 0, y: 0 };
        let mtmp = null;
        if (await objdescr_is(obj, "milky")) {
            if (!(game.mvitals[PM_GHOST].mvflags & (2 | 1)) && !rn2((13 + 2 * (game.mvitals[PM_GHOST].born)))) {
                if (!await enexto(cc, mon.mx, mon.my, game.mons[PM_GHOST])) {
                    return 0;
                }
                await mquaffmsg(mon, obj);
                await m_useup(mon, obj);
                mtmp = await makemon(game.mons[PM_GHOST], cc.x, cc.y, 131072);
                if (!mtmp) {
                    if (vis) {
                        await pline("%s", __precheck_empty);
                    }
                } else {
                    if (vis) {
                        await pline("As %s opens the bottle, an enormous %s emerges!", await mon_nam(mon), (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? await rndmonnam(null) : "ghost");
                        await pline("%s is frightened to death, and unable to move.", await Monnam(mon));
                    }
                    paralyze_monst(mon, 3);
                }
                /* grew into genocided monster */
                return 2;
            }
        }
        if (await objdescr_is(obj, "smoky") && !(game.mvitals[PM_DJINNI].mvflags & (2 | 1)) && !rn2((13 + 2 * (game.mvitals[PM_DJINNI].born)))) {
            if (!await enexto(cc, mon.mx, mon.my, game.mons[PM_DJINNI])) {
                return 0;
            }
            await mquaffmsg(mon, obj);
            await m_useup(mon, obj);
            mtmp = await makemon(game.mons[PM_DJINNI], cc.x, cc.y, 131072);
            if (!mtmp) {
                if (vis) {
                    await pline("%s", __precheck_empty);
                }
            } else {
                if (vis) {
                    await pline_mon(mtmp, "In a cloud of smoke, %s emerges!", await a_monnam(mtmp));
                }
                await pline("%s speaks.", vis ? await Monnam(mtmp) : c_common_strings.c_Something);
                ;
                if (rn2(2)) {
                    await verbalize("You freed me!");
                    mtmp.mpeaceful = 1;
                    set_malign(mtmp);
                } else {
                    await verbalize("It is about time.");
                    if (vis) {
                        await pline("%s vanishes.", await Monnam(mtmp));
                    }
                    await mongone(mtmp);
                }
            }
            return 2;
        }
    }
    if (obj.oclass == WAND_CLASS && obj.cursed && !rn2(100)) {
        let dam = d(obj.spe + 2, 6);
        if (vis) {
            await pline_mon(mon, "%s zaps %s, which suddenly explodes!", await Monnam(mon), await an(await xname(obj)));
        } else {
            /* same near/far threshold as mzapwand() */
            let range = ((game.viz_array[mon.my][mon.mx] & 1) != 0) ? (8 + 1) : (8 - 3);
            ;
            await You_hear("a zap and an explosion %s.", (dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) <= range * range) ? "nearby" : "in the distance");
        }
        await m_useup(mon, obj);
        mon.mhp -= dam;
        if (((mon).mhp < 1)) {
            await monkilled(mon, "", 242);
            return 1;
        }
        /* Only one needed to be set to 0 but the others are harmless */
        game.m.has_defense = game.m.has_offense = game.m.has_misc = 0;
    }
    return 0;
}
/* when a monster zaps a wand give a message, deduct a charge, and if it
   isn't directly seen, remove hero's memory of the number of charges */
export async function mzapwand(mtmp, otmp, self) {
    if (otmp.spe < 1) {
        await impossible("Mon zapping wand with %d charges?", otmp.spe);
        return;
    }
    if (!canseemon(mtmp)) {
        let range = ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) ? (8 + 1) : (8 - 3);
        ;
        await You_hear("a %s zap.", (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= range * range) ? "nearby" : "distant");
        /* hero loses info when unseen obj is used */
        unknow_object(otmp);
    } else if (self) {
        await pline("%s with %s!", await monverbself(mtmp, await Monnam(mtmp), "zap", null), await doname(otmp));
    } else {
        await pline_mon(mtmp, "%s zaps %s!", await Monnam(mtmp), await an(await xname(otmp)));
        await stop_occupation();
    }
    otmp.spe -= 1;
}
/* similar to mzapwand() but for magical horns (only instrument mons play) */
export async function mplayhorn(mtmp, otmp, self) {
    let objnamp = null;
    let objbuf = '';
    if (!canseemon(mtmp)) {
        let range = ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) ? (8 + 1) : (8 - 3);
        ;
        await You_hear("a horn being played %s.", (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= range * range) ? "nearby" : "in the distance");
        unknow_object(otmp);
    } else if (self) {
        await observe_object(otmp);
        objnamp = await xname(otmp);
        if (strlen(objnamp) >= 128) {
            objnamp = await simpleonames(otmp);
        }
        objbuf = sprintf(objbuf, "a %s directed at", objnamp);
        await pline("%s!", await monverbself(mtmp, await Monnam(mtmp), "play", objbuf));
        await discover_object((otmp.otyp), (1), (1), (1));
    } else {
        await observe_object(otmp);
        objnamp = await xname(otmp);
        if (strlen(objnamp) >= 128) {
            objnamp = await simpleonames(otmp);
        }
        await pline("%s %s %s directed at you!", await Monnam(mtmp), "plays", await an(objnamp));
        await discover_object((otmp.otyp), (1), (1), (1));
        await stop_occupation();
    }
    otmp.spe -= 1;
}
/* see or hear a monster reading a scroll;
   when scroll hasn't been seen, its label is revealed unless hero is deaf */
export async function mreadmsg(mtmp, otmp) {
    let onambuf = '';
    let vismon = canseemon(mtmp);
    let tpindicator = (!vismon && sensemon(mtmp));
    if (!vismon && (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        return;
    }
    await observe_object(otmp);
    onambuf = strcpy(onambuf, await singular(otmp, vismon ? doname : ansimpleoname));
    if (vismon) {
        await pline_mon(mtmp, "%s reads %s!", await Monnam(mtmp), onambuf);
    } else {
        /* !Deaf, otherwise we wouldn't reach here */
        let blindbuf = '';
        let similar = same_race(game.youmonst.data, mtmp.data);
        let uniqmon = ((mtmp.data.geno & 4096) != 0 || mtmp.isshk);
        let recognize = (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (mtmp.meverseen || (similar && !uniqmon)));
        /* describe unseen monster accurately when not hallucinating if it
           has ever been seen or is the same race as the hero (not yet seen
           unique monsters excepted) */
        let mflags = (2 | 8 | (recognize ? 1 : 64));
        if (sensemon(mtmp)) {
            /* shopkeepers aren't unique monsters but since
                              they have distinct names, treat them as such */
            tpindicator = (1);
        } else if (((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 10 * 10) {
            await map_invisible(mtmp.mx, mtmp.my);
        }
        blindbuf = nh_snprintf("mreadmsg", 278, blindbuf, 256 /* sizeof(char [256]) */, "reading %s", onambuf);
        blindbuf = strsubst(blindbuf, "reading a scroll labeled", mtmp.mconf ? "attempting to incant" : "incant");
        await You_hear("%s %s.", await x_monnam(mtmp, 2, null, mflags, (0)), blindbuf);
        if (tpindicator) {
            await flash_mon(mtmp);
        }
    }
    if (mtmp.mconf) {
        await pline("Being confused, %s mispronounces the magic words...", vismon ? await mon_nam(mtmp) : (genders[pronoun_gender(mtmp, 2)].he));
    }
}
export async function mquaffmsg(mtmp, otmp) {
    if (canseemon(mtmp)) {
        await observe_object(otmp);
        await pline_mon(mtmp, "%s drinks %s!", await Monnam(mtmp), await singular(otmp, doname));
    } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        ;
        await You_hear("a chugging sound.");
    }
}
/* Defines for various types of stuff.  The order in which monsters prefer
 * to use them is determined by the order of the code logic, not the
 * numerical order in which they are defined.
 */
/* also an offensive item */
/*
#define MUSE_INNATE_TPT 9999
 * We cannot use this.  Since monsters get unlimited teleportation, if they
 * were allowed to teleport at will you could never catch them.  Instead,
 * assume they only teleport at random times, despite the inconsistency
 * that if you polymorph into one you teleport at will.
 */
export function m_use_healing(mtmp) {
    let obj = null;
    if ((obj = m_carrying(mtmp, POT_FULL_HEALING)) != null) {
        game.m.defensive = obj;
        game.m.has_defense = 18;
        return (1);
    }
    if ((obj = m_carrying(mtmp, POT_EXTRA_HEALING)) != null) {
        game.m.defensive = obj;
        game.m.has_defense = 4;
        return (1);
    }
    if ((obj = m_carrying(mtmp, POT_HEALING)) != null) {
        game.m.defensive = obj;
        game.m.has_defense = 3;
        return (1);
    }
    return (0);
}
/* return TRUE if monster mtmp can see at least one sleeping soldier */
export function m_sees_sleepy_soldier(mtmp) {
    let x = mtmp.mx;
    let y = mtmp.my;
    let xx = 0;
    let yy = 0;
    let mon = null;
    for (xx = x - 3; xx <= x + 3; xx++) {
        for (yy = y - 3; yy <= y + 3; yy++) {
            /* Distance is arbitrary.  What we really want to do is
     * have the soldier play the bugle when it sees or
     * remembers soldiers nearby...
     */
            if (!isok(xx, yy) || (xx == x && yy == y)) {
                continue;
            }
            if ((mon = (game.level.monsters[xx][yy])) != null && (((mon.data).mflags2 & 512) != 0) && mon.data != game.mons[PM_GUARD] && ((mon).msleeping || !(mon).mcanmove)) {
                return (1);
            }
        }
    }
    return (0);
}
/* monst that might be teleported */
/* can see it */
/* have seen the object that triggered this */
/* type of that object */
export async function m_tele(mtmp, vismon, oseen, how) {
    if (await tele_restrict(mtmp)) {
        if (vismon && how) {
            await discover_object((how), (1), (1), (1));
        }
        if (await noteleport_level(mtmp)) {
            mon_learns_traps(mtmp, TELEP_TRAP);
        }
    } else if ((mon_has_amulet(mtmp) || On_W_tower_level(game.u.uz)) && !rn2(3)) {
        if (vismon) {
            await pline_mon(mtmp, "%s seems disoriented for a moment.", await Monnam(mtmp));
        }
    } else {
        if (how) {
            if (oseen) {
                await discover_object((how), (1), (1), (1));
            }
            await rloc(mtmp, 2);
        } else {
            /* monster is voluntarily entering a teleporation trap; use the
               trap instead of rloc() in case it sends 'victim' to a vault */
            mtmp.mx = game.trapx , mtmp.my = game.trapy;
            await mintrap(mtmp, 1);
        }
    }
}
/* return TRUE if monster mtmp has another monster next to it.
 * Called from find_defensive() where it is limited to Is_knox()
 * only, otherwise you could trap two monsters next to each other
 * in a boulder fort, and they would be happy to stay in there. */
export function m_next2m(mtmp) {
    let x = 0;
    let y = 0;
    let m2 = null;
    if (((mtmp).mhp < 1) || ((mtmp).mstate != 0)) {
        /* don't let monsters interact with protected items on the floor */
        return (0);
    }
    for (x = mtmp.mx - 1; x <= mtmp.mx + 1; x++) {
        for (y = mtmp.my - 1; y <= mtmp.my + 1; y++) {
            if (!isok(x, y)) {
                continue;
            }
            if ((m2 = (game.level.monsters[x][y])) && m2 != mtmp) {
                return (1);
            }
        }
    }
    return (0);
}
/* Select a defensive item/action for a monster.  Returns TRUE iff one is
   found. */
export async function find_defensive(mtmp, tryescape) {
    let obj = null;
    let t = null;
    let fraction = 0;
    let x = 0;
    let y = 0;
    let stuck = 0;
    let immobile = 0;
    let stway = null;
    botm: {
        x = mtmp.mx;
        y = mtmp.my;
        stuck = (mtmp == game.u.ustuck);
        immobile = (mtmp.data.mmove == 0);
        game.m.defensive = null;
        game.m.has_defense = 0;
        if ((((mtmp.data).mflags1 & 262144) != 0) || (((mtmp.data).mflags1 & 65536) != 0)) {
            return (0);
        }
        if (!tryescape && dist2(x, y, mtmp.mux, mtmp.muy) > 25) {
            return (0);
        }
        if (tryescape && (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) && !(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2) && m_next2m(mtmp)) {
            return (0);
        }
        if (game.u.uswallow && stuck) {
            return (0);
        }
        if (mtmp.mconf || mtmp.mstun || !mtmp.mcansee) {
            /*
     * Since unicorn horns don't get used up, the monster would look
     * silly trying to use the same cursed horn round after round,
     * so skip cursed unicorn horns.
     *
     * Unicorns use their own horns; they're excluded from inventory
     * scanning by nohands().  Ki-rin is depicted in the AD&D Monster
     * Manual with same horn as a unicorn, so let it use its horn too.
     * is_unicorn() doesn't include it; the class differs and it has
     * no interest in gems.
     */
            obj = null;
            if (!(((mtmp.data).mflags1 & 8192) != 0)) {
                for (obj = mtmp.minvent; obj; obj = obj.nobj) {
                    if (obj.otyp == UNICORN_HORN && !obj.cursed) {
                        /* no need to look at any other spots */
                        break;
                    }
                }
            }
            if (obj || ((mtmp.data).mlet == S_UNICORN && (((mtmp.data).mflags2 & 536870912) != 0)) || mtmp.data == game.mons[PM_KI_RIN]) {
                /* monsters digging in Sokoban can ruin things */
                /* digging wouldn't be effective; assume they know that */
                game.m.defensive = obj;
                game.m.has_defense = 17;
                return (1);
            }
        }
        if (mtmp.mconf || mtmp.mstun) {
            let liztin = null;
            for (obj = mtmp.minvent; obj; obj = obj.nobj) {
                if (obj.otyp == CORPSE && obj.corpsenm == PM_LIZARD) {
                    /* monsters aren't given wands of undead turning but if they
       happen to have picked one up, use it against corpse wielder;
       when applicable, use it now even if 'mtmp' isn't wounded */
                    /* only lines up if distu range is within 5*5 */
                    /* could use m_carrying(), then nxtobj() when matching wand
           is empty, but direct traversal is actually simpler here */
                    /* use the TELEP_TRAP bit to determine if they know
             * about noteleport on this level or not.  Avoids
             * ineffective re-use of teleportation.  This does
             * mean if the monster leaves the level, they'll know
             * about teleport traps.
             */
                    /* see WAN_TELEPORTATION case above */
                    game.m.defensive = obj;
                    /* tin and corpse ultimately end up being handled the same */
                    game.m.has_defense = 19;
                    return (1);
                } else if (obj.otyp == TIN && obj.corpsenm == PM_LIZARD) {
                    liztin = obj;
                }
            }
            if (liztin && mcould_eat_tin(mtmp) && rn2(3)) {
                /* confused or stunned monster might not be able to open tin */
                game.m.defensive = liztin;
                game.m.has_defense = 19;
                return (1);
            }
        }
        if (!mtmp.mcansee && !(((mtmp.data).mflags1 & 8192) != 0) && mtmp.data != game.mons[PM_PESTILENCE]) {
            /* It so happens there are two unrelated cases when we might want to
     * check specifically for healing alone.  The first is when the monster
     * is blind (healing cures blindness).  The second is when the monster
     * is peaceful; then we don't want to flee the player, and by
     * coincidence healing is all there is that doesn't involve fleeing.
     * These would be hard to combine because of the control flow.
     * Pestilence won't use healing even when blind.
     */
            if (m_use_healing(mtmp)) {
                return (1);
            }
        }
        if (!mtmp.mpeaceful && !(((mtmp.data).mflags1 & 8192) != 0) && game.uwep && game.uwep.otyp == CORPSE && ((game.mons[game.uwep.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[game.uwep.corpsenm]) == game.mons[PM_CHICKATRICE]) && !poly_when_stoned(mtmp.data) && !await Resists_Elem(mtmp, STONE_RES) && lined_up(mtmp)) {
            for (obj = mtmp.minvent; obj; obj = obj.nobj) {
                if (obj.otyp == WAN_UNDEAD_TURNING && obj.spe > 0) {
                    game.m.defensive = obj;
                    game.m.has_defense = 20;
                    return (1);
                }
            }
        }
        if (!tryescape) {
            fraction = game.u.ulevel < 10 ? 5 : game.u.ulevel < 14 ? 4 : 3;
            if (mtmp.mhp >= mtmp.mhpmax || (mtmp.mhp >= 10 && mtmp.mhp * fraction >= mtmp.mhpmax)) {
                return (0);
            }
            if (mtmp.mpeaceful) {
                if (!(((mtmp.data).mflags1 & 8192) != 0)) {
                    if (m_use_healing(mtmp)) {
                        return (1);
                    }
                }
                return (0);
            }
        }
        if (stuck || immobile || mtmp.mtrapped) {
            ;
        } else if (game.level.locations[x][y].typ == STAIRS) {
            /* fleeing by stairs or traps is not possible */
            stway = stairway_at(x, y);
            if (stway && !stway.up && stway.tolev.dnum == game.u.uz.dnum) {
                if (!((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) {
                    game.m.has_defense = 9;
                }
            } else if (stway && stway.up && stway.tolev.dnum == game.u.uz.dnum) {
                game.m.has_defense = 8;
            } else if (stway && stway.tolev.dnum != game.u.uz.dnum) {
                if (stway.up || !((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) {
                    game.m.has_defense = 14;
                }
            }
        } else if (game.level.locations[x][y].typ == LADDER) {
            stway = stairway_at(x, y);
            if (stway && stway.up && stway.tolev.dnum == game.u.uz.dnum) {
                game.m.has_defense = 12;
            } else if (stway && !stway.up && stway.tolev.dnum == game.u.uz.dnum) {
                if (!((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) {
                    game.m.has_defense = 13;
                }
            } else if (stway && stway.tolev.dnum != game.u.uz.dnum) {
                if (stway.up || !((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) {
                    game.m.has_defense = 14;
                }
            }
        } else {
            /* Note: trap doors take precedence over teleport traps. */
            let xx = 0;
            let yy = 0;
            let i = 0;
            let locs = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
            let ignore_boulders = (((mtmp.data).msize < 1) || (((mtmp.data).mflags2 & 134217728) != 0) || (((mtmp.data).mflags1 & 8) != 0));
            let diag_ok = !((((mtmp.data).pmidx)) == PM_GRID_BUG);
            /* 10: 9 spots plus sentinel */
            for (i = 0; i < 10; ++i) {
                (locs[i][1] = 0, locs[i][0] = 0);
            }
            /* collect viable spots; monster's <mx,my> comes first */
            locs[0][0] = x , locs[0][1] = y;
            i = 1;
            for (xx = x - 1; xx <= x + 1; xx++) {
                for (yy = y - 1; yy <= y + 1; yy++) {
                    if (isok(xx, yy) && (xx != x || yy != y)) {
                        locs[i][0] = xx , locs[i][1] = yy;
                        ++i;
                    }
                }
            }
            for (i = 0; i < 10; ++i) {
                /* look for a suitable trap among the viable spots */
                xx = locs[i][0] , yy = locs[i][1];
                if (!xx) {
                    break;
                }
                /* skip if it's hero's location
               or a diagonal spot and monster can't move diagonally
               or some other monster is there */
                if (((xx) == game.u.ux && (yy) == game.u.uy) || (xx != x && yy != y && !diag_ok) || (game.level.monsters[xx][yy] && !(xx == x && yy == y))) {
                    continue;
                }
                /* skip if there's no trap or can't/won't move onto trap */
                if ((t = t_at(xx, yy)) == null || (!ignore_boulders && sobj_at(BOULDER, xx, yy)) || onscary(xx, yy, mtmp)) {
                    continue;
                }
                if (((t.ttyp) == HOLE || (t.ttyp) == TRAPDOOR) && !((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT) && !mtmp.isshk && !mtmp.isgd && !mtmp.ispriest && Can_fall_thru(game.u.uz)) {
                    /* use trap if it's the correct type */
                    game.trapx = xx;
                    game.trapy = yy;
                    game.m.has_defense = 6;
                    break;
                } else if (t.ttyp == TELEP_TRAP) {
                    game.trapx = xx;
                    game.trapy = yy;
                    game.m.has_defense = 7;
                }
            }
        }
        if ((((mtmp.data).mflags1 & 8192) != 0)) {
            break botm;
        }
        if ((((mtmp.data).mflags2 & 512) != 0) && (obj = m_carrying(mtmp, BUGLE)) != null && m_sees_sleepy_soldier(mtmp)) {
            game.m.defensive = obj;
            game.m.has_defense = 16;
        }
        /* use immediate physical escape prior to attempting magic */
        /* stairs, trap door or tele-trap, bugle alert */
        if (game.m.has_defense) {
            break botm;
        }
        /* kludge to cut down on trap destruction (particularly portals) */
        t = t_at(x, y);
        if (t && (((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT) || t.ttyp == WEB || t.ttyp == BEAR_TRAP)) {
            t = null;
        }
        for (obj = mtmp.minvent; obj; obj = obj.nobj) {
            /* ok for monster to dig here */
            /* selection could be improved by collecting all possibilities
       into an array and then picking one at random */
            /* don't always use the same selection pattern */
            if (game.m.has_defense && !rn2(3)) {
                break;
            }
            /* nomore(MUSE_WAN_DIGGING); */
            if (game.m.has_defense == 5) {
                break;
            }
            if (obj.otyp == WAN_DIGGING && obj.spe > 0 && !stuck && !t && !mtmp.isshk && !mtmp.isgd && !mtmp.ispriest && !((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT) && !game.level.flags.sokoban_rules && !(game.level.locations[x][y].flags & 8) && !(Is_botlevel(game.u.uz) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) && !(is_ice(x, y) || is_pool(x, y) || is_lava(x, y)) && !(((mtmp).data == game.mons[PM_VLAD_THE_IMPALER] || (mtmp).cham == PM_VLAD_THE_IMPALER) && In_V_tower(game.u.uz))) {
                game.m.defensive = obj;
                game.m.has_defense = 5;
            }
            if (game.m.has_defense == 2) {
                continue;
            }
            ;
            if (game.m.has_defense == 15) {
                continue;
            }
            ;
            if (obj.otyp == WAN_TELEPORTATION && obj.spe > 0) {
                if (!await noteleport_level(mtmp) || !mon_knows_traps(mtmp, TELEP_TRAP)) {
                    game.m.defensive = obj;
                    game.m.has_defense = (mon_has_amulet(mtmp)) ? 15 : 2;
                }
            }
            if (game.m.has_defense == 1) {
                continue;
            }
            ;
            if (obj.otyp == SCR_TELEPORTATION && mtmp.mcansee && (((mtmp.data).mflags1 & 4096) == 0) && (!obj.cursed || (!(mtmp.isshk && inhishop(mtmp)) && !mtmp.isgd && !mtmp.ispriest))) {
                if (!await noteleport_level(mtmp) || !mon_knows_traps(mtmp, TELEP_TRAP)) {
                    game.m.defensive = obj;
                    game.m.has_defense = 1;
                }
            }
            if (mtmp.data != game.mons[PM_PESTILENCE]) {
                if (game.m.has_defense == 18) {
                    continue;
                }
                ;
                if (obj.otyp == POT_FULL_HEALING) {
                    game.m.defensive = obj;
                    game.m.has_defense = 18;
                }
                if (game.m.has_defense == 4) {
                    continue;
                }
                ;
                if (obj.otyp == POT_EXTRA_HEALING) {
                    game.m.defensive = obj;
                    game.m.has_defense = 4;
                }
                if (game.m.has_defense == 10) {
                    continue;
                }
                ;
                if (obj.otyp == WAN_CREATE_MONSTER && obj.spe > 0) {
                    game.m.defensive = obj;
                    game.m.has_defense = 10;
                }
                if (game.m.has_defense == 3) {
                    continue;
                }
                ;
                if (obj.otyp == POT_HEALING) {
                    game.m.defensive = obj;
                    game.m.has_defense = 3;
                }
            } else {
                if (game.m.has_defense == 18) {
                    continue;
                }
                ;
                if (obj.otyp == POT_SICKNESS) {
                    game.m.defensive = obj;
                    game.m.has_defense = 18;
                }
                if (game.m.has_defense == 10) {
                    continue;
                }
                ;
                if (obj.otyp == WAN_CREATE_MONSTER && obj.spe > 0) {
                    game.m.defensive = obj;
                    game.m.has_defense = 10;
                }
            }
            if (game.m.has_defense == 11) {
                continue;
            }
            ;
            if (obj.otyp == SCR_CREATE_MONSTER) {
                game.m.defensive = obj;
                game.m.has_defense = 11;
            }
        }
    }
    return !!game.m.has_defense;
}
/* when a monster deliberately enters a trap, make sure the spot becomes
   accessible (trap doors and teleporters inside niches are located at
   secret corridor locations; convert such into normal corridor even if
   hero doesn't see it happen) */
export async function reveal_trap(t, seeit) {
    let lev = game.level.locations[t.tx][t.ty];
    if (lev.typ == SCORR) {
        lev.typ = CORR , lev.flags = 0;
        unblock_point(t.tx, t.ty);
    }
    if (seeit) {
        await seetrap(t);
    }
}
/* Monsters without the Amulet escape the dungeon and
 * are gone for good when they leave up the up stairs.
 * A monster with the Amulet would leave it behind
 * (mongone -> mdrop_special_objs) but we force any
 * monster who manages to acquire it or the invocation
 * tools to stick around instead of letting it escape.
 * Don't let the Wizard escape even when not carrying
 * anything of interest unless there are more than 1
 * of him.
 */
export async function mon_escape(mtmp, vismon) {
    if (mon_has_special(mtmp) || (mtmp.iswiz && game.context.no_of_wizards < 2)) {
        return 0;
    }
    if (vismon) {
        await pline_mon(mtmp, "%s escapes the dungeon!", await Monnam(mtmp));
    }
    await mongone(mtmp);
    return 2;
}
/* Perform a defensive action for a monster.  Must be called immediately
 * after find_defensive().  Return values are 0: did something, 1: died,
 * 2: did something and can't attack again (i.e. teleported).
 */
const __use_defensive_MissingDefensiveItem = "use_defensive: no %s";
export async function use_defensive(mtmp) {
    let i = 0;
    let fleetim = 0;
    let otmp = game.m.defensive;
    let vis = 0;
    let vismon = 0;
    let oseen = 0;
    let t = null;
    let stway = null;
    if ((i = await precheck(mtmp, otmp)) != 0) {
        return i;
    }
    vis = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
    vismon = canseemon(mtmp);
    oseen = otmp && vismon;
    /* when using defensive choice to run away, we want monster to avoid
       rushing right straight back; don't override if already scared */
    fleetim = !mtmp.mflee ? (33 - (Math.trunc(30 * mtmp.mhp / mtmp.mhpmax))) : 0;
    switch (game.m.has_defense) {
        case 17:
            if (vismon) {
                if (otmp) {
                    await pline_mon(mtmp, "%s uses a unicorn horn!", await Monnam(mtmp));
                } else {
                    await pline_The("tip of %s's horn glows!", await mon_nam(mtmp));
                }
            }
            if (!mtmp.mcansee) {
                await mcureblindness(mtmp, vismon);
            } else if (mtmp.mconf || mtmp.mstun) {
                mtmp.mconf = mtmp.mstun = 0;
                if (vismon) {
                    await pline_mon(mtmp, "%s seems steadier now.", await Monnam(mtmp));
                }
            } else {
                await impossible("No need for unicorn horn?");
            }
            return 2;
        case 16:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "bugle");
            }
            if (vismon) {
                await pline_mon(mtmp, "%s plays %s!", await Monnam(mtmp), await doname(otmp));
            } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                await You_hear("a bugle playing reveille!");
            }
            await awaken_soldiers(mtmp);
            return 2;
        case 2:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "wand of teleportation");
            }
            if ((mtmp.isshk && inhishop(mtmp)) || mtmp.isgd || mtmp.ispriest) {
                return 2;
            }
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            await mzapwand(mtmp, otmp, (1));
            await m_tele(mtmp, vismon, oseen, WAN_TELEPORTATION);
            return 2;
        case 15:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "wand of teleportation");
            }
            game.zap_oseen = oseen;
            await mzapwand(mtmp, otmp, (0));
            game.m_using = (1);
            await mbhit(mtmp, (rn2(8) + (6)), mbhitm, bhito, otmp);
            if (await noteleport_level(mtmp)) {
                mon_learns_traps(mtmp, TELEP_TRAP);
            }
            /* note: 'otmp' might have been destroyed (drawbridge destruction) */
            game.m_using = (0);
            return 2;
        case 1:
{
                let obj_is_cursed = 0;
                if (!otmp) {
                    await panic(__use_defensive_MissingDefensiveItem, "scroll of teleportation");
                }
                obj_is_cursed = otmp.cursed;
                if (mtmp.isshk || mtmp.isgd || mtmp.ispriest) {
                    return 2;
                }
                if (fleetim && !mtmp.iswiz) {
                    await monflee(mtmp, fleetim, (0), (0));
                }
                ;
                if (otmp.quan > 1) {
                    otmp = await splitobj(otmp, 1);
                }
                await extract_from_minvent(mtmp, otmp, (0), (0));
                /* 'last_msg' will be changed to PLNMSG_UNKNOWN if any messages
           are issued by mreadmsg(), 'if (vismon) pline()', or m_tele() */
                game.iflags.last_msg = PLNMSG_enum;
                await mreadmsg(mtmp, otmp);
                if (obj_is_cursed || mtmp.mconf) {
                    let nlev = 0;
                    let flev = { dnum: 0, dlevel: 0 };
                    nlev = random_teleport_level();
                    if (mon_has_amulet(mtmp) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
                        if (vismon) {
                            await pline_mon(mtmp, "%s seems very disoriented for a moment.", await Monnam(mtmp));
                        }
                    } else if (nlev == depth(game.u.uz)) {
                        if (vismon) {
                            await pline_mon(mtmp, "%s shudders for a moment.", await Monnam(mtmp));
                        }
                    } else {
                        await get_level(flev, nlev);
                        await migrate_to_level(mtmp, ledger_no(flev), 0, null);
                    }
                } else {
                    await m_tele(mtmp, vismon, oseen, SCR_TELEPORTATION);
                }
                /* m_tele() handles makeknown(); trycall() will be a no-op when
           otmp->otyp is already discovered */
                if (otmp.dknown && game.iflags.last_msg != PLNMSG_enum) {
                    await trycall(otmp);
                }
                await obfree(otmp, null);
                return 2;
            }
        case 5:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "wand of digging");
            }
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            await mzapwand(mtmp, otmp, (0));
            if (oseen) {
                await discover_object((WAN_DIGGING), (1), (1), (1));
            }
            if (((game.level.locations[mtmp.mx][mtmp.my].typ) >= STAIRS && (game.level.locations[mtmp.mx][mtmp.my].typ) <= ALTAR) || ((game.level.locations[mtmp.mx][mtmp.my].typ) == DRAWBRIDGE_UP || (game.level.locations[mtmp.mx][mtmp.my].typ) == DRAWBRIDGE_DOWN) || (is_drawbridge_wall(mtmp.mx, mtmp.my) >= 0) || stairway_at(mtmp.mx, mtmp.my)) {
                await pline_The("digging ray is ineffective.");
                return 2;
            }
            if (!Can_dig_down(game.u.uz) && !game.level.locations[mtmp.mx][mtmp.my].candig) {
                if (t_at(mtmp.mx, mtmp.my) || !(t = await maketrap(mtmp.mx, mtmp.my, PIT))) {
                    if (vismon) {
                        await pline_The("%s here is too hard to dig in.", surface(mtmp.mx, mtmp.my));
                    }
                    return 2;
                }
                if (vis) {
                    await seetrap(t);
                    await pline_mon(mtmp, "%s has made a pit in the %s.", await Monnam(mtmp), surface(mtmp.mx, mtmp.my));
                }
                await fill_pit(mtmp.mx, mtmp.my);
                recalc_block_point(mtmp.mx, mtmp.my);
                return (await mintrap(mtmp, 4) == Trap_Killed_Mon) ? 1 : 2;
            }
            t = await maketrap(mtmp.mx, mtmp.my, HOLE);
            if (!t) {
                return 2;
            }
            recalc_block_point(mtmp.mx, mtmp.my);
            await seetrap(t);
            if (vis) {
                await pline_mon(mtmp, "%s has made a hole in the %s.", await Monnam(mtmp), surface(mtmp.mx, mtmp.my));
                await pline_mon(mtmp, "%s %s through...", await Monnam(mtmp), (((mtmp.data).mflags1 & 1) != 0) ? "dives" : "falls");
            } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                ;
                await You_hear("%s crash through the %s.", c_common_strings.c_something, surface(mtmp.mx, mtmp.my));
            }
            await fill_pit(mtmp.mx, mtmp.my);
            await migrate_to_level(mtmp, ledger_no(game.u.uz) + 1, 0, null);
            return 2;
        case 20:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "wand of undead turning");
            }
            game.zap_oseen = oseen;
            await mzapwand(mtmp, otmp, (0));
            game.m_using = (1);
            await mbhit(mtmp, (rn2(8) + (6)), mbhitm, bhito, otmp);
            game.m_using = (0);
            return 2;
        case 10:
{
                let cc = { x: 0, y: 0 };
                let mon = null;
                /* pm: 0 => random, eel => aquatic, croc => amphibious */
                let pm = !is_pool(mtmp.mx, mtmp.my) ? null : game.mons[game.u.uinwater ? PM_GIANT_EEL : PM_CROCODILE];
                if (!otmp) {
                    await panic(__use_defensive_MissingDefensiveItem, "wand of create monster");
                }
                if (!await enexto(cc, mtmp.mx, mtmp.my, pm)) {
                    return 0;
                }
                await mzapwand(mtmp, otmp, (0));
                mon = await makemon(null, cc.x, cc.y, 0);
                if (mon && (canseemon(mon) || sensemon(mon)) && oseen) {
                    await discover_object((WAN_CREATE_MONSTER), (1), (1), (1));
                }
                return 2;
            }
        case 11:
{
                let cc = { x: 0, y: 0 };
                let pm = null;
                let fish = null;
                let cnt = 1;
                let mon = null;
                let known = (0);
                if (!otmp) {
                    await panic(__use_defensive_MissingDefensiveItem, "scroll of create monster");
                }
                if (!rn2(73)) {
                    cnt += rnd(4);
                }
                if (mtmp.mconf || otmp.cursed) {
                    cnt += 12;
                }
                if (mtmp.mconf) {
                    pm = fish = game.mons[PM_ACID_BLOB];
                } else if (is_pool(mtmp.mx, mtmp.my)) {
                    fish = game.mons[game.u.uinwater ? PM_GIANT_EEL : PM_CROCODILE];
                }
                await mreadmsg(mtmp, otmp);
                while (cnt--) {
                    if (!await enexto(cc, mtmp.mx, mtmp.my, fish)) {
                        break;
                    }
                    mon = await makemon(pm, cc.x, cc.y, 0);
                    if (mon && (canseemon(mon) || sensemon(mon))) {
                        known = (1);
                    }
                }
                if (known) {
                    await discover_object((SCR_CREATE_MONSTER), (1), (1), (1));
                } else {
                    await trycall(otmp);
                }
                await m_useup(mtmp, otmp);
                return 2;
            }
        case 6:
            if (Is_botlevel(game.u.uz)) {
                return 0;
            }
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            t = t_at(game.trapx, game.trapy);
            if (vis) {
                await pline_mon(mtmp, "%s %s into a %s!", await Monnam(mtmp), await vtense(c_common_strings.c_fakename[0], locomotion(mtmp.data, "jump")), trapname(t.ttyp, (0)));
            }
            await reveal_trap(t, vis);
            game.level.monsters[mtmp.mx][mtmp.my] = null;
            await newsym(mtmp.mx, mtmp.my);
            await place_monster(mtmp, game.trapx, game.trapy);
            if (mtmp.wormno) {
                await worm_move(mtmp);
            }
            await newsym(game.trapx, game.trapy);
            await migrate_to_level(mtmp, ledger_no(game.u.uz) + 1, 0, null);
            return 2;
        case 8:
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            stway = stairway_at(mtmp.mx, mtmp.my);
            if (!stway) {
                return 0;
            }
            if (ledger_no(game.u.uz) == 1) {
                return await mon_escape(mtmp, vismon);
            }
            if (In_hell(game.u.uz) && mon_has_amulet(mtmp) && !rn2(4) && (dunlev(game.u.uz) < dunlevs_in_dungeon(game.u.uz) - 3)) {
                if (vismon) {
                    await pline("As %s climbs the stairs, a mysterious force momentarily surrounds %s...", await mon_nam(mtmp), (genders[pronoun_gender(mtmp, 2)].him));
                }
                await migrate_to_level(mtmp, ledger_no(game.u.uz) + 1, 0, null);
            } else {
                if (vismon) {
                    await pline_mon(mtmp, "%s escapes upstairs!", await Monnam(mtmp));
                }
                await migrate_to_level(mtmp, ledger_no((stway.tolev)), 4, null);
            }
            return 2;
        case 9:
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            stway = stairway_at(mtmp.mx, mtmp.my);
            if (!stway) {
                return 0;
            }
            if (vismon) {
                await pline_mon(mtmp, "%s escapes downstairs!", await Monnam(mtmp));
            }
            await migrate_to_level(mtmp, ledger_no((stway.tolev)), 3, null);
            return 2;
        case 12:
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            stway = stairway_at(mtmp.mx, mtmp.my);
            if (!stway) {
                return 0;
            }
            if (vismon) {
                await pline_mon(mtmp, "%s escapes up the ladder!", await Monnam(mtmp));
            }
            await migrate_to_level(mtmp, ledger_no((stway.tolev)), 6, null);
            return 2;
        case 13:
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            stway = stairway_at(mtmp.mx, mtmp.my);
            if (!stway) {
                return 0;
            }
            if (vismon) {
                await pline_mon(mtmp, "%s escapes down the ladder!", await Monnam(mtmp));
            }
            await migrate_to_level(mtmp, ledger_no((stway.tolev)), 5, null);
            return 2;
        case 14:
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            stway = stairway_at(mtmp.mx, mtmp.my);
            if (!stway) {
                return 0;
            }
            if (ledger_no(game.u.uz) == 1) {
                return await mon_escape(mtmp, vismon);
            }
            if (vismon) {
                await pline_mon(mtmp, "%s escapes %sstairs!", await Monnam(mtmp), stway.up ? "up" : "down");
            }
            await migrate_to_level(mtmp, ledger_no((stway.tolev)), 7, null);
            return 2;
        case 7:
            if (fleetim && !mtmp.iswiz) {
                await monflee(mtmp, fleetim, (0), (0));
            }
            ;
            t = t_at(game.trapx, game.trapy);
            if (vis) {
                await pline_mon(mtmp, "%s %s onto a %s!", await Monnam(mtmp), await vtense(c_common_strings.c_fakename[0], locomotion(mtmp.data, "jump")), trapname(t.ttyp, (0)));
            }
            await reveal_trap(t, vis);
            game.level.monsters[mtmp.mx][mtmp.my] = null;
            await newsym(mtmp.mx, mtmp.my);
            await place_monster(mtmp, game.trapx, game.trapy);
            if (mtmp.wormno) {
                await worm_move(mtmp);
            }
            await maybe_unhide_at(mtmp.mx, mtmp.my);
            await newsym(game.trapx, game.trapy);
            await m_tele(mtmp, vismon, (0), 0);
            return 2;
        case 3:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "potioh of healing");
            }
            await mquaffmsg(mtmp, otmp);
            i = d(6 + 2 * bcsign(otmp), 4);
            await healmon(mtmp, i, 1);
            if (!otmp.cursed && !mtmp.mcansee) {
                await mcureblindness(mtmp, vismon);
            }
            if (vismon) {
                await pline_mon(mtmp, "%s looks better.", await Monnam(mtmp));
            }
            if (oseen) {
                await discover_object((POT_HEALING), (1), (1), (1));
            }
            await m_useup(mtmp, otmp);
            return 2;
        case 4:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "potioh of extra healing");
            }
            await mquaffmsg(mtmp, otmp);
            i = d(6 + 2 * bcsign(otmp), 8);
            await healmon(mtmp, i, otmp.blessed ? 5 : 2);
            if (!mtmp.mcansee) {
                await mcureblindness(mtmp, vismon);
            }
            if (vismon) {
                await pline_mon(mtmp, "%s looks much better.", await Monnam(mtmp));
            }
            if (oseen) {
                await discover_object((POT_EXTRA_HEALING), (1), (1), (1));
            }
            await m_useup(mtmp, otmp);
            return 2;
        case 18:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "potioh of full healing");
            }
            await mquaffmsg(mtmp, otmp);
            if (otmp.otyp == POT_SICKNESS) {
                await unbless(otmp);
            }
            await healmon(mtmp, mtmp.mhpmax, otmp.blessed ? 8 : 4);
            if (!mtmp.mcansee && otmp.otyp != POT_SICKNESS) {
                await mcureblindness(mtmp, vismon);
            }
            if (vismon) {
                await pline_mon(mtmp, "%s looks completely healed.", await Monnam(mtmp));
            }
            if (oseen) {
                await discover_object((otmp.otyp), (1), (1), (1));
            }
            await m_useup(mtmp, otmp);
            return 2;
        case 19:
            if (!otmp) {
                await panic(__use_defensive_MissingDefensiveItem, "lizard corpse");
            }
            await mon_consume_unstone(mtmp, otmp, (0), (0));
            return 2;
        case 0:
            return 0;
        default:
            await impossible("%s wanted to perform action %d?", await Monnam(mtmp), game.m.has_defense);
            break;
    }
    return 0;
}
export async function rnd_defensive_item(mtmp) {
    let pm = mtmp.data;
    let difficulty = game.mons[(((pm).pmidx))].difficulty;
    let trycnt = 0;
    if ((((pm).mflags1 & 262144) != 0) || attacktype(pm, 13) || (((mtmp.data).mflags1 & 65536) != 0) || pm.mlet == S_GHOST || pm.mlet == S_KOP) {
        return 0;
    }
    try_again: while (true) {
        switch (rn2(8 + (difficulty > 3) + (difficulty > 6) + (difficulty > 8))) {
            case 6:
            case 9:
                if (await noteleport_level(mtmp) && ++trycnt < 2) {
                    continue try_again;
                }
                if (!rn2(3)) {
                    return WAN_TELEPORTATION;
                }
                ;
            case 0:
            case 1:
                return SCR_TELEPORTATION;
            case 8:
            case 10:
                if (!rn2(3)) {
                    return WAN_CREATE_MONSTER;
                }
                ;
            case 2:
                return SCR_CREATE_MONSTER;
            case 3:
                return POT_HEALING;
            case 4:
                return POT_EXTRA_HEALING;
            case 5:
                return (mtmp.data != game.mons[PM_PESTILENCE]) ? POT_FULL_HEALING : POT_SICKNESS;
            case 7:
                if (game.level.flags.sokoban_rules && rn2(4)) {
                    continue try_again;
                }
                /* some creatures shouldn't dig down to another level when hurt */
                if (((pm).mlet == S_EYE || (pm).mlet == S_LIGHT) || mtmp.isshk || mtmp.isgd || mtmp.ispriest) {
                    return 0;
                }
                return WAN_DIGGING;
        }
        return 0;
        break;
    }
}
/*#define MUSE_WAN_UNDEAD_TURNING 20*/
/* also a defensive item so don't
                                     * redefine; nonconsecutive value is ok */
export function linedup_chk_corpse(x, y) {
    return (sobj_at(CORPSE, x, y) != null);
}
export function m_use_undead_turning(mtmp, obj) {
    let ax = game.u.ux + sgn(mtmp.mux - mtmp.mx) * 3;
    let ay = game.u.uy + sgn(mtmp.muy - mtmp.my) * 3;
    let bx = mtmp.mx;
    let by = mtmp.my;
    if (!(obj.otyp == WAN_UNDEAD_TURNING && obj.spe > 0)) {
        return;
    }
    /* not necrophiliac(); unlike deciding whether to pick this
       type of wand up, we aren't interested in corpses within
       carried containers until they're moved into open inventory;
       we don't check whether hero is poly'd into an undead--the
       wand's turning effect is too weak to be a useful direct
       attack--only whether hero is carrying at least one corpse */
    if (carrying(CORPSE) || linedup_callback(ax, ay, bx, by, linedup_chk_corpse)) {
        game.m.offensive = obj;
        game.m.has_offense = 20;
    }
}
/* from monster's point of view, is hero behind a chokepoint? */
export function hero_behind_chokepoint(mtmp) {
    let dx = sgn(mtmp.mx - mtmp.mux);
    let dy = sgn(mtmp.my - mtmp.muy);
    let x = mtmp.mux + dx;
    let y = mtmp.muy + dy;
    let dir = xytodir(dx, dy);
    let dir_l = ((((((dir) + 6) % (N_DIRS_Z - 2))) + (N_DIRS_Z - 2)) % (N_DIRS_Z - 2));
    let dir_r = ((((((dir) + 2) % (N_DIRS_Z - 2))) + (N_DIRS_Z - 2)) % (N_DIRS_Z - 2));
    let c1 = { x: 0, y: 0 };
    let c2 = { x: 0, y: 0 };
    dirtocoord(c1, dir_l);
    dirtocoord(c2, dir_r);
    c1.x += x , c2.x += x;
    c1.y += y , c2.y += y;
    if ((!isok(c1.x, c1.y) || !accessible(c1.x, c1.y)) && (!isok(c2.x, c2.y) || !accessible(c2.x, c2.y))) {
        return (1);
    }
    return (0);
}
/* hostile monster has another hostile next to it */
export function mon_has_friends(mtmp) {
    let dx = 0;
    let dy = 0;
    let mon2 = null;
    if (mtmp.mtame || mtmp.mpeaceful) {
        return (0);
    }
    for (dx = -1; dx <= 1; dx++) {
        for (dy = -1; dy <= 1; dy++) {
            let x = mtmp.mx + dx;
            let y = mtmp.my + dy;
            if (isok(x, y) && (mon2 = (game.level.monsters[x][y])) != null && mon2 != mtmp && !mon2.mtame && !mon2.mpeaceful) {
                return (1);
            }
        }
    }
    return (0);
}
/* does monster like object pile at x,y? */
export async function mon_likes_objpile_at(mtmp, x, y) {
    let i = 0;
    let otmp = null;
    if (!isok(x, y) || !(game.level.objects[x][y] != null)) {
        return (0);
    }
    for (i = 0 , otmp = game.level.objects[x][y]; otmp && i < 3; i++) {
        if (await mon_would_take_item(mtmp, otmp)) {
            return (1);
        }
        otmp = otmp.v.v_nexthere;
    }
    /* pile is larger than 3 stacks? */
    if (i >= 3) {
        return (1);
    }
    return (0);
}
/* Select an offensive item/action for a monster.  Returns TRUE iff one is
 * found.
 */
export async function find_offensive(mtmp) {
    let obj = null;
    let mtmp_helmet = null;
    let reflection_skip = 0;
    game.m.offensive = null;
    game.m.has_offense = 0;
    if (mtmp.mpeaceful || (((mtmp.data).mflags1 & 262144) != 0) || (((mtmp.data).mflags1 & 65536) != 0) || (((mtmp.data).mflags1 & 8192) != 0)) {
        return (0);
    }
    if (game.u.uswallow) {
        return (0);
    }
    if (in_your_sanctuary(mtmp, 0, 0)) {
        return (0);
    }
    if (dmgtype(mtmp.data, 27) && !game.uwep && !game.uarmu && !game.uarm && !game.uarmh && !game.uarms && !game.uarmg && !game.uarmc && !game.uarmf) {
        return (0);
    }
    /* all offensive items require orthogonal or diagonal targeting */
    if (!lined_up(mtmp)) {
        return (0);
    }
    reflection_skip = (((mtmp).seen_resistance & (M_SEEN_REFL)) != 0 || monnear(mtmp, mtmp.mux, mtmp.muy));
    mtmp_helmet = await which_armor(mtmp, 4);
    for (obj = mtmp.minvent; obj; obj = obj.nobj) {
        if (!reflection_skip) {
            if (game.m.has_offense == 1) {
                continue;
            }
            ;
            if (obj.otyp == WAN_DEATH && obj.spe > 0 && !((mtmp).seen_resistance & (M_SEEN_MAGR))) {
                /* this picks the last viable item rather than prioritizing choices */
                /* don't give controlled hero a free teleport */
                /* same hack as MUSE_WAN_TELEPORTATION_SELF */
                /* do try to move hero to a more vulnerable spot */
                /* we can safely put this scroll here since the locations that
         * are in a 1 square radius are a subset of the locations that
         * are in wand or throwing range (in other words, always lined_up())
         */
                game.m.offensive = obj;
                game.m.has_offense = 1;
            }
            if (game.m.has_offense == 2) {
                continue;
            }
            ;
            if (obj.otyp == WAN_SLEEP && obj.spe > 0 && game.multi >= 0 && !((mtmp).seen_resistance & (M_SEEN_SLEEP))) {
                game.m.offensive = obj;
                game.m.has_offense = 2;
            }
            if (game.m.has_offense == 3) {
                continue;
            }
            ;
            if (obj.otyp == WAN_FIRE && obj.spe > 0 && !((mtmp).seen_resistance & (M_SEEN_FIRE))) {
                game.m.offensive = obj;
                game.m.has_offense = 3;
            }
            if (game.m.has_offense == 13) {
                continue;
            }
            ;
            if (obj.otyp == FIRE_HORN && obj.spe > 0 && can_blow(mtmp) && !((mtmp).seen_resistance & (M_SEEN_FIRE))) {
                game.m.offensive = obj;
                game.m.has_offense = 13;
            }
            if (game.m.has_offense == 4) {
                continue;
            }
            ;
            if (obj.otyp == WAN_COLD && obj.spe > 0 && !((mtmp).seen_resistance & (M_SEEN_COLD))) {
                game.m.offensive = obj;
                game.m.has_offense = 4;
            }
            if (game.m.has_offense == 12) {
                continue;
            }
            ;
            if (obj.otyp == FROST_HORN && obj.spe > 0 && can_blow(mtmp) && !((mtmp).seen_resistance & (M_SEEN_COLD))) {
                game.m.offensive = obj;
                game.m.has_offense = 12;
            }
            if (game.m.has_offense == 5) {
                continue;
            }
            ;
            if (obj.otyp == WAN_LIGHTNING && obj.spe > 0 && !((mtmp).seen_resistance & (M_SEEN_ELEC))) {
                game.m.offensive = obj;
                game.m.has_offense = 5;
            }
            if (game.m.has_offense == 6) {
                continue;
            }
            ;
            if (obj.otyp == WAN_MAGIC_MISSILE && obj.spe > 0 && !((mtmp).seen_resistance & (M_SEEN_MAGR))) {
                game.m.offensive = obj;
                game.m.has_offense = 6;
            }
        }
        if (game.m.has_offense == 20) {
            continue;
        }
        ;
        m_use_undead_turning(mtmp, obj);
        if (game.m.has_offense == 7) {
            continue;
        }
        ;
        if (obj.otyp == WAN_STRIKING && obj.spe > 0 && !((mtmp).seen_resistance & (M_SEEN_MAGR))) {
            game.m.offensive = obj;
            game.m.has_offense = 7;
        }
        if (game.m.has_offense == 15) {
            continue;
        }
        ;
        if (obj.otyp == WAN_TELEPORTATION && obj.spe > 0 && !(game.u.uprops[TELEPORT_CONTROL].intrinsic || game.u.uprops[TELEPORT_CONTROL].extrinsic) && (!await noteleport_level(mtmp) || !mon_knows_traps(mtmp, TELEP_TRAP)) && (onscary(game.u.ux, game.u.uy, mtmp) || (hero_behind_chokepoint(mtmp) && mon_has_friends(mtmp)) || await mon_likes_objpile_at(mtmp, game.u.ux, game.u.uy) || stairway_at(game.u.ux, game.u.uy))) {
            game.m.offensive = obj;
            game.m.has_offense = 15;
        }
        if (game.m.has_offense == 9) {
            continue;
        }
        ;
        if (obj.otyp == POT_PARALYSIS && game.multi >= 0) {
            game.m.offensive = obj;
            game.m.has_offense = 9;
        }
        if (game.m.has_offense == 10) {
            continue;
        }
        ;
        if (obj.otyp == POT_BLINDNESS && !attacktype(mtmp.data, 15)) {
            game.m.offensive = obj;
            game.m.has_offense = 10;
        }
        if (game.m.has_offense == 11) {
            continue;
        }
        ;
        if (obj.otyp == POT_CONFUSION) {
            game.m.offensive = obj;
            game.m.has_offense = 11;
        }
        if (game.m.has_offense == 16) {
            continue;
        }
        ;
        if (obj.otyp == POT_SLEEPING && !((mtmp).seen_resistance & (M_SEEN_SLEEP))) {
            game.m.offensive = obj;
            game.m.has_offense = 16;
        }
        if (game.m.has_offense == 14) {
            continue;
        }
        ;
        if (obj.otyp == POT_ACID && !((mtmp).seen_resistance & (M_SEEN_ACID))) {
            game.m.offensive = obj;
            game.m.has_offense = 14;
        }
        if (game.m.has_offense == 17) {
            continue;
        }
        ;
        if (obj.otyp == SCR_EARTH && (hard_helmet(mtmp_helmet) || mtmp.mconf || (((mtmp.data).mflags1 & 4) != 0) || (((mtmp.data).mflags1 & 8) != 0) || ((mtmp.data).mlet == S_GHOST) || (((mtmp.data).mflags1 & 1048576) != 0) || !rn2(10)) && dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= 2 && mtmp.mcansee && (((mtmp.data).mflags1 & 4096) == 0) && !(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) && (!((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || (((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level)))))) {
            game.m.offensive = obj;
            game.m.has_offense = 17;
        }
        if (game.m.has_offense == 18) {
            continue;
        }
        ;
        if (obj.otyp == EXPENSIVE_CAMERA && ((!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !await resists_blnd(game.youmonst)) || ((game.youmonst.data) == game.mons[PM_GREMLIN])) && dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= 2 && obj.spe > 0 && !rn2(6)) {
            game.m.offensive = obj;
            game.m.has_offense = 18;
        }
    }
    return !!game.m.has_offense;
}
export async function mbhitm(mtmp, otmp) {
    let tmp = 0;
    let reveal_invis = (0);
    let learnit = (0);
    let hits_you = (mtmp == game.youmonst);
    if (!hits_you && otmp.otyp != WAN_UNDEAD_TURNING) {
        mtmp.msleeping = 0;
        if (mtmp.m_ap_type) {
            await seemimic(mtmp);
        }
    }
    switch (otmp.otyp) {
        case WAN_STRIKING:
            reveal_invis = (1);
            if (hits_you) {
                if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                    /* monsters notice hero resisting */
                    monstseesu(M_SEEN_MAGR);
                    await shieldeff(game.u.ux, game.u.uy);
                    ;
                    await pline("Boing!");
                    learnit = (1);
                } else if (rnd(20) < 10 + game.u.uac && !(game.buzzer && !game.buzzer.mwandexp)) {
                    /* mons see hero not resisting */
                    monstunseesu(M_SEEN_MAGR);
                    await pline_The("wand hits you!");
                    tmp = d(2, 12);
                    if ((game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) {
                        tmp = Math.trunc((tmp + 1) / 2);
                    }
                    await losehp(tmp, "wand", 0);
                    learnit = (1);
                } else {
                    await pline_The("wand misses you.");
                }
                await stop_occupation();
                nomul(0);
            } else if (resists_magm(mtmp)) {
                await shieldeff(mtmp.mx, mtmp.my);
                ;
                await pline("Boing!");
                learnit = (1);
            } else if (rnd(20) < 10 + find_mac(mtmp)) {
                tmp = d(2, 12);
                await hit("wand", mtmp, exclam(tmp));
                await resist(mtmp, otmp.oclass, tmp, 1);
                learnit = (1);
            } else {
                await miss("wand", mtmp);
            }
            /* need to see the wand being zapped and also the spot where the
           target is hit; don't have to see the target itself though */
            if (learnit && game.zap_oseen && (hits_you || ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0))) {
                await discover_object((WAN_STRIKING), (1), (1), (1));
            }
            break;
        case WAN_TELEPORTATION:
            if (hits_you) {
                await tele();
                if (game.zap_oseen) {
                    await discover_object((WAN_TELEPORTATION), (1), (1), (1));
                }
            } else {
                if (mtmp.ispriest && in_rooms(mtmp.mx, mtmp.my, TEMPLE)) {
                    /* for consistency with zap.c, don't identify */
                    if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                        await pline_mon(mtmp, "%s resists the magic!", await Monnam(mtmp));
                    }
                } else if (!await tele_restrict(mtmp)) {
                    await rloc(mtmp, 2);
                }
            }
            break;
        case WAN_CANCELLATION:
        case SPE_CANCELLATION:
            await cancel_monst(mtmp, otmp, (0), (1), (0));
            break;
        case WAN_UNDEAD_TURNING:
            if (hits_you) {
                await unturn_you();
                learnit = game.zap_oseen;
            } else {
                let wake = (0);
                if (await unturn_dead(mtmp)) {
                    wake = (1);
                }
                if ((((mtmp.data).mflags2 & 2) != 0) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) {
                    wake = reveal_invis = (1);
                    /* context.bypasses=True: if resist() happens to be fatal,
                   make_corpse() will set obj->bypass on the new corpse
                   so that mbhito() will skip it instead of reviving it */
                    game.context.bypasses = (1);
                    await resist(mtmp, WAND_CLASS, rnd(8), 0);
                }
                if (wake) {
                    if (!((mtmp).mhp < 1)) {
                        await wakeup(mtmp, (0));
                    }
                    learnit = game.zap_oseen;
                }
            }
            if (learnit) {
                await discover_object((WAN_UNDEAD_TURNING), (1), (1), (1));
            }
            break;
        default:
            break;
    }
    if (reveal_invis && !((mtmp).mhp < 1) && ((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0) && !(canseemon(mtmp) || sensemon(mtmp))) {
        await map_invisible(game.bhitpos.x, game.bhitpos.y);
    }
    return 0;
}
/* hit all objects at x,y with fhito function */
export function fhito_loc(obj, tx, ty, fhito) {
    let otmp = null;
    let next_obj = null;
    let hitanything = 0;
    if (!fhito || !(game.level.objects[tx][ty] != null)) {
        return (0);
    }
    for (otmp = game.level.objects[tx][ty]; otmp; otmp = next_obj) {
        next_obj = otmp.v.v_nexthere;
        if (otmp.where != 1 || otmp.ox != tx || otmp.oy != ty) {
            continue;
        }
        hitanything += (fhito)(otmp, obj);
    }
    return hitanything ? (1) : (0);
}
/* A modified bhit() for monsters.  Based on bhit() in zap.c.  Unlike
 * buzz(), bhit() doesn't take into account the possibility of a monster
 * zapping you, so we need a special function for it.  (Unless someone wants
 * to merge the two functions...)
 */
/* monster shooting the wand */
/* direction and range */
/* must be non-Null */
/* fns called when mon/obj hit */
/* 2nd arg to fhitm/fhito */
export async function mbhit(mon, range, fhitm, fhito, obj) {
    let mtmp = null;
    let ltyp = 0;
    let ddx = 0;
    let ddy = 0;
    let otyp = obj.otyp;
    game.bhitpos.x = mon.mx;
    game.bhitpos.y = mon.my;
    ddx = sgn(mon.mux - mon.mx);
    ddy = sgn(mon.muy - mon.my);
    while (range-- > 0) {
        let x = 0;
        let y = 0;
        let dbx = 0;
        let dby = 0;
        game.bhitpos.x += ddx;
        game.bhitpos.y += ddy;
        x = game.bhitpos.x;
        y = game.bhitpos.y;
        if (!isok(x, y)) {
            game.bhitpos.x -= ddx;
            game.bhitpos.y -= ddy;
            break;
        }
        if (((game.bhitpos.x) == game.u.ux && (game.bhitpos.y) == game.u.uy)) {
            (fhitm)(game.youmonst, obj);
            range -= 3;
        } else if ((mtmp = (game.level.monsters[game.bhitpos.x][game.bhitpos.y])) != null) {
            if (((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0) && !(canseemon(mtmp) || sensemon(mtmp))) {
                await map_invisible(game.bhitpos.x, game.bhitpos.y);
            }
            (fhitm)(mtmp, obj);
            range -= 3;
        }
        if (fhito_loc(obj, game.bhitpos.x, game.bhitpos.y, fhito)) {
            range--;
        }
        ltyp = game.level.locations[game.bhitpos.x][game.bhitpos.y].typ;
        dbx = x , dby = y;
        if (otyp == WAN_STRIKING && ltyp != DRAWBRIDGE_UP && find_drawbridge({ get value() { return dbx; }, set value(_v) { dbx = _v; } }, { get value() { return dby; }, set value(_v) { dby = _v; } })) {
            await destroy_drawbridge(dbx, dby);
        } else if (((ltyp) == DOOR) || ltyp == SDOOR) {
            switch (otyp) {
                case WAN_OPENING:
                case WAN_LOCKING:
                case WAN_STRIKING:
                    if (await doorlock(obj, game.bhitpos.x, game.bhitpos.y)) {
                        if (game.zap_oseen) {
                            await discover_object((otyp), (1), (1), (1));
                        }
                        /* if a shop door gets broken, add it to
                       the shk's fix list (no cost to player) */
                        if (game.level.locations[game.bhitpos.x][game.bhitpos.y].flags == 1 && in_rooms(game.bhitpos.x, game.bhitpos.y, SHOPBASE)) {
                            await add_damage(game.bhitpos.x, game.bhitpos.y, 0);
                        }
                    }
                    break;
            }
        }
        if (!((ltyp) >= POOL) || (((ltyp) == DOOR) && (game.level.locations[game.bhitpos.x][game.bhitpos.y].flags & (8 | 4)))) {
            game.bhitpos.x -= ddx;
            game.bhitpos.y -= ddy;
            break;
        }
    }
}
export async function buzz_force_miss(type, nd, sx, sy, dx, dy) {
    await dobuzz(type, nd, sx, sy, dx, dy, (1), (0), (1));
}
/* Perform an offensive action for a monster.  Must be called immediately
 * after find_offensive().  Return values are same as use_defensive().
 */
export async function use_offensive(mtmp) {
    let i = 0;
    let otmp = game.m.offensive;
    let oseen = 0;
    /* if a monster has never used an attack wand before, it takes them some
       time to get used to holding that much power, so the first shot always
       misses */
    let buzzfn = mtmp.mwandexp ? buzz : buzz_force_miss;
    if (otmp.oclass != POTION_CLASS && (i = await precheck(mtmp, otmp)) != 0) {
        return i;
    }
    oseen = canseemon(mtmp);
    switch (game.m.has_offense) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
            await mzapwand(mtmp, otmp, (0));
            if (oseen) {
                await discover_object((otmp.otyp), (1), (1), (1));
            }
            game.m_using = (1);
            game.current_wand = otmp;
            game.buzzer = mtmp;
            buzzfn((-30 - ((abs((otmp.otyp) - WAN_MAGIC_MISSILE) % 10))), (otmp.otyp == WAN_MAGIC_MISSILE) ? 2 : 6, mtmp.mx, mtmp.my, sgn(mtmp.mux - mtmp.mx), sgn(mtmp.muy - mtmp.my));
            game.buzzer = null;
            game.current_wand = null;
            game.m_using = (0);
            mtmp.mwandexp = (1);
            return (((mtmp).mhp < 1)) ? 1 : 2;
        case 13:
        case 12:
            await mplayhorn(mtmp, otmp, (0));
            game.m_using = (1);
            game.buzzer = mtmp;
            game.current_wand = otmp;
            buzzfn((-30 - ((abs(((otmp.otyp == FROST_HORN) ? 3 : 2) - 1) % 10))), (rn2(6) + (6)), mtmp.mx, mtmp.my, sgn(mtmp.mux - mtmp.mx), sgn(mtmp.muy - mtmp.my));
            game.buzzer = null;
            game.current_wand = null;
            game.m_using = (0);
            mtmp.mwandexp = (1);
            return (((mtmp).mhp < 1)) ? 1 : 2;
        case 15:
        case 20:
        case 7:
            game.zap_oseen = oseen;
            await mzapwand(mtmp, otmp, (0));
            game.m_using = (1);
            game.buzzer = mtmp;
            await mbhit(mtmp, (rn2(8) + (6)), mbhitm, bhito, otmp);
            game.buzzer = null;
            game.m_using = (0);
            if (game.m.has_offense == 7) {
                mtmp.mwandexp = (1);
            }
            return 2;
        case 17:
{
                let x = 0;
                let y = 0;
                /* don't use monster fields after killing it */
                let confused = (mtmp.mconf ? (1) : (0));
                let mmx = mtmp.mx;
                let mmy = mtmp.my;
                let is_cursed = otmp.cursed;
                let is_blessed = otmp.blessed;
                await mreadmsg(mtmp, otmp);
                if ((canseemon(mtmp) || sensemon(mtmp))) {
                    await pline_The("%s rumbles %s %s!", ceiling(mtmp.mx, mtmp.my), otmp.blessed ? "around" : "above", await mon_nam(mtmp));
                    if (oseen) {
                        await discover_object((otmp.otyp), (1), (1), (1));
                    }
                } else if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                    await pline_The("%s rumbles in the middle of nowhere!", ceiling(mtmp.mx, mtmp.my));
                    if (mtmp.minvis) {
                        await map_invisible(mtmp.mx, mtmp.my);
                    }
                    if (oseen) {
                        await discover_object((otmp.otyp), (1), (1), (1));
                    }
                }
                await m_useup(mtmp, otmp);
                for (x = mmx - 1; x <= mmx + 1; x++) {
                    for (y = mmy - 1; y <= mmy + 1; y++) {
                        if (isok(x, y) && !closed_door(x, y) && !((game.level.locations[x][y].typ) < POOL) && !((game.level.locations[x][y].typ) == AIR || (game.level.locations[x][y].typ) == CLOUD) && (((x == mmx) && (y == mmy)) ? !is_blessed : !is_cursed) && (x != game.u.ux || y != game.u.uy)) {
                            await drop_boulder_on_monster(x, y, confused, (0));
                        }
                    }
                }
                if (distmin(mmx, mmy, game.u.ux, game.u.uy) == 1 && !is_cursed) {
                    await drop_boulder_on_player(confused, !is_cursed, (0), (1));
                }
                return (((mtmp).mhp < 1)) ? 1 : 2;
            }
        case 18:
{
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    ;
                    await verbalize("Say cheese!");
                } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline("%s takes a picture of you with %s!", await Monnam(mtmp), await an(await xname(otmp)));
                }
                game.m_using = (1);
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !await resists_blnd(game.youmonst)) {
                    await You("are blinded by the flash of light!");
                    await make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + rnd(1 + 50), (0));
                }
                await lightdamage(otmp, (1), 5);
                game.m_using = (0);
                otmp.spe--;
                return 1;
            }
        case 9:
        case 10:
        case 11:
        case 16:
        case 14:
            if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                await observe_object(otmp);
                await pline_mon(mtmp, "%s hurls %s!", await Monnam(mtmp), await singular(otmp, doname));
            }
            await m_throw(mtmp, mtmp.mx, mtmp.my, sgn(mtmp.mux - mtmp.mx), sgn(mtmp.muy - mtmp.my), distmin(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy), otmp);
            return 2;
        case 0:
            return 0;
        default:
            await impossible("%s wanted to perform action %d?", await Monnam(mtmp), game.m.has_offense);
            break;
    }
    return 0;
}
export async function rnd_offensive_item(mtmp) {
    let pm = mtmp.data;
    let difficulty = game.mons[(((pm).pmidx))].difficulty;
    if ((((pm).mflags1 & 262144) != 0) || attacktype(pm, 13) || (((mtmp.data).mflags1 & 65536) != 0) || pm.mlet == S_GHOST || pm.mlet == S_KOP) {
        return 0;
    }
    if (difficulty > 7 && !rn2(35)) {
        return WAN_DEATH;
    }
    switch (rn2(9 - (difficulty < 4) + 4 * (difficulty > 6))) {
        case 0:
{
                let mtmp_helmet = await which_armor(mtmp, 4);
                if (hard_helmet(mtmp_helmet) || (((pm).mflags1 & 4) != 0) || (((pm).mflags1 & 8) != 0) || ((pm).mlet == S_GHOST) || (((pm).mflags1 & 1048576) != 0)) {
                    return SCR_EARTH;
                }
            }
            ;
        case 1:
            return WAN_STRIKING;
        case 2:
            return POT_ACID;
        case 3:
            return POT_CONFUSION;
        case 4:
            return POT_BLINDNESS;
        case 5:
            return POT_SLEEPING;
        case 6:
            return POT_PARALYSIS;
        case 7:
        case 8:
            return WAN_MAGIC_MISSILE;
        case 9:
            return WAN_SLEEP;
        case 10:
            return WAN_FIRE;
        case 11:
            return WAN_COLD;
        case 12:
            return WAN_LIGHTNING;
    }
    return 0;
}
export async function find_misc(mtmp) {
    let obj = null;
    let mdat = mtmp.data;
    let x = mtmp.mx;
    let y = mtmp.my;
    let t = null;
    let xx = 0;
    let yy = 0;
    let pmidx = NON_PM;
    let immobile = (mdat.mmove == 0);
    let stuck = (mtmp == game.u.ustuck);
    game.m.misc = null;
    game.m.has_misc = 0;
    if ((((mdat).mflags1 & 262144) != 0) || (((mdat).mflags1 & 65536) != 0)) {
        return 0;
    }
    if (game.u.uswallow && stuck) {
        return (0);
    }
    /* We arbitrarily limit to times when a player is nearby for the
     * same reason as Junior Pac-Man doesn't have energizers eaten until
     * you can see them...
     */
    if (dist2(x, y, mtmp.mux, mtmp.muy) > 36) {
        return (0);
    }
    if (!stuck && !immobile && !mtmp.mtrapped && (mtmp.cham == NON_PM) && game.mons[(pmidx = ((mdat).pmidx))].difficulty < 6) {
        let ignore_boulders = (((mdat).msize < 1) || (((mdat).mflags2 & 134217728) != 0) || (((mdat).mflags1 & 8) != 0));
        let diag_ok = !((pmidx) == PM_GRID_BUG);
        for (xx = x - 1; xx <= x + 1; xx++) {
            for (yy = y - 1; yy <= y + 1; yy++) {
                if (isok(xx, yy) && !((xx) == game.u.ux && (yy) == game.u.uy) && (diag_ok || xx == x || yy == y) && ((xx == x && yy == y) || !game.level.monsters[xx][yy])) {
                    if ((t = t_at(xx, yy)) != null && (ignore_boulders || !sobj_at(BOULDER, xx, yy)) && !onscary(xx, yy, mtmp)) {
                        if (t.ttyp == POLY_TRAP && !await wearing_iron_shoes(mtmp)) {
                            /* use trap if it's the correct type and will
                           polymorph the monster */
                            game.trapx = xx;
                            game.trapy = yy;
                            game.m.has_misc = 4;
                            return (1);
                        }
                    }
                }
            }
        }
    }
    if ((((mdat).mflags1 & 8192) != 0)) {
        return 0;
    }
    for (obj = mtmp.minvent; obj; obj = obj.nobj) {
        if (obj.otyp == POT_GAIN_LEVEL && (!obj.cursed || (!mtmp.isgd && !mtmp.isshk && !mtmp.ispriest))) {
            /* normally we would want to bracket a macro expansion containing
       'if' without matching 'else' with 'do { ... } while (0)' but we
       can't do that here because it would intercept 'continue' */
            /*
     * [bug?]  Choice of item is not prioritized; the last viable one
     * in the monster's inventory will be chosen.
     * 'nomore()' is nearly worthless because it only screens checking
     * of duplicates when there is no alternate type in between them.
     *
     * MUSE_BAG issues:
     * should allow looting floor container instead of needing the
     * monster to have picked it up and now be carrying it which takes
     * extra time and renders heavily filled containers immune;
     * hero should have a chance to see the monster fail to open a
     * locked container instead of monster always knowing lock state
     * (may not be feasible to implement--requires too much per-object
     * info for each monster);
     * monster with key should be able to unlock a locked floor
     * container and not know whether it is trapped.
     */
            /* Monsters shouldn't recognize cursed items; this kludge is
           necessary to prevent serious problems though... */
            /* the random test prevents whip-wielding
               monster from attempting disarm every turn */
            /* hero's location must be known and adjacent */
            /* don't bother if it can't work (this doesn't
               prevent cursed weapons from being targeted) */
            /* Note: peaceful/tame monsters won't make themselves
         * invisible unless you can see them.  Not really right, but...
         */
            game.m.misc = obj;
            game.m.has_misc = 1;
        }
        if (game.m.has_misc == (8)) {
            continue;
        }
        if (obj.otyp == BULLWHIP && !mtmp.mpeaceful && game.uwep && !rn2(5) && obj == ((mtmp).mw) && ((mtmp.mux) == game.u.ux && (mtmp.muy) == game.u.uy) && (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2) && !game.u.uswallow && (await canletgo(game.uwep, "") || (game.u.twoweap && await canletgo(game.uswapwep, "")))) {
            game.m.misc = obj;
            game.m.has_misc = 8;
        }
        if (game.m.has_misc == (2)) {
            continue;
        }
        if (obj.otyp == WAN_MAKE_INVISIBLE && obj.spe > 0 && !mtmp.minvis && !mtmp.invis_blkd && (!mtmp.mpeaceful || (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) && (!attacktype(mtmp.data, 15) || mtmp.mcan)) {
            game.m.misc = obj;
            game.m.has_misc = 2;
        }
        if (game.m.has_misc == (3)) {
            continue;
        }
        if (obj.otyp == POT_INVISIBILITY && !mtmp.minvis && !mtmp.invis_blkd && (!mtmp.mpeaceful || (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) && (!attacktype(mtmp.data, 15) || mtmp.mcan)) {
            game.m.misc = obj;
            game.m.has_misc = 3;
        }
        if (game.m.has_misc == (7)) {
            continue;
        }
        if (obj.otyp == WAN_SPEED_MONSTER && obj.spe > 0 && mtmp.mspeed != 2 && !mtmp.isgd) {
            game.m.misc = obj;
            game.m.has_misc = 7;
        }
        if (game.m.has_misc == (6)) {
            continue;
        }
        if (obj.otyp == POT_SPEED && mtmp.mspeed != 2 && !mtmp.isgd) {
            game.m.misc = obj;
            game.m.has_misc = 6;
        }
        if (game.m.has_misc == (5)) {
            continue;
        }
        if (obj.otyp == WAN_POLYMORPH && obj.spe > 0 && (mtmp.cham == NON_PM) && game.mons[((mdat).pmidx)].difficulty < 6) {
            game.m.misc = obj;
            game.m.has_misc = 5;
        }
        if (game.m.has_misc == (9)) {
            continue;
        }
        if (obj.otyp == POT_POLYMORPH && (mtmp.cham == NON_PM) && game.mons[((mdat).pmidx)].difficulty < 6) {
            game.m.misc = obj;
            game.m.has_misc = 9;
        }
        if (game.m.has_misc == (10)) {
            continue;
        }
        if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) && obj.otyp != BAG_OF_TRICKS && !rn2(5) && !((obj).otyp == LARGE_BOX && (obj).spe == 1) && !game.m.has_misc && ((obj).cobj != null) && !obj.olocked && !obj.otrapped) {
            game.m.misc = obj;
            game.m.has_misc = 10;
        }
    }
    return !!game.m.has_misc;
}
/* type of monster to polymorph into; defaults to one suitable for the
   current level rather than the totally arbitrary choice of newcham() */
export async function muse_newcham_mon(mon) {
    let m_armr = null;
    if ((m_armr = await which_armor(mon, 1)) != null) {
        if (((m_armr).otyp >= GRAY_DRAGON_SCALES && (m_armr).otyp <= YELLOW_DRAGON_SCALES)) {
            return game.mons[PM_GRAY_DRAGON + (m_armr).otyp - GRAY_DRAGON_SCALES];
        } else if (((m_armr).otyp >= GRAY_DRAGON_SCALE_MAIL && (m_armr).otyp <= YELLOW_DRAGON_SCALE_MAIL)) {
            return game.mons[PM_GRAY_DRAGON + (m_armr).otyp - GRAY_DRAGON_SCALE_MAIL];
        }
    }
    return await rndmonst();
}
export async function mloot_container(mon, container, vismon) {
    let contnr_nam = '';
    let mpronounbuf = '';
    let nearby = 0;
    let takeout_indx = 0;
    let takeout_count = 0;
    let howfar = 0;
    let res = 0;
    if (!container || !((container).cobj != null) || container.olocked) {
        return res;
    }
    /* FIXME: handle cursed bag of holding */
    if (((container).otyp == BAG_OF_HOLDING || (container).otyp == BAG_OF_TRICKS) && container.cursed) {
        return res;
    }
    if (((container).otyp == LARGE_BOX && (container).spe == 1)) {
        return res;
    }
    switch (rn2(10)) {
        default:
            takeout_count = 1;
            break;
        case 4:
        case 5:
        case 6:
            takeout_count = 2;
            break;
        case 7:
        case 8:
            takeout_count = 3;
            break;
        case 9:
            takeout_count = 4;
            break;
    }
    howfar = dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy);
    nearby = (howfar <= 7 * 7);
    (mpronounbuf = '', contnr_nam = '');
    if (vismon) {
        mpronounbuf = strcpy(mpronounbuf, (genders[pronoun_gender(mon, 2)].he));
    }
    for (takeout_indx = 0; takeout_indx < takeout_count; ++takeout_indx) {
        /* do this once so that when hallucinating it won't change
           from one item to the next */
        let xobj = null;
        let nitems = 0;
        /* might have removed all items */
        if (!((container).cobj != null)) {
            break;
        }
        /* TODO?
         *  Monster ought to prioritize on something it wants to use.
         */
        nitems = 0;
        for (xobj = container.cobj; xobj != null; xobj = xobj.nobj) {
            ++nitems;
        }
        /* nitems is always greater than 0 due to Has_contents() check;
           throttle item removal as the container becomes less filled */
        if (!rn2(nitems + 1)) {
            break;
        }
        nitems = rn2(nitems);
        for (xobj = container.cobj; xobj != null; xobj = xobj.nobj) {
            if (--nitems < 0) {
                break;
            }
        }
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        /* hero no longer knows container's contents
                                * even if [attempted] removal is observed */
        container.cknown = 0;
        if (!contnr_nam) {
            contnr_nam = strcpy(contnr_nam, await an(nearby ? await xname(container) : await distant_name(container, xname)));
        }
        await obj_extract_self(xobj);
        if (await can_carry(mon, xobj)) {
            if (vismon) {
                if (howfar > 2) {
                    await Norep("%s rummages through %s.", await Monnam(mon), contnr_nam);
                } else if (takeout_indx == 0) {
                    await pline_mon(mon, "%s removes %s from %s.", await Monnam(mon), await doname(xobj), contnr_nam);
                } else {
                    await pline("%s removes %s.", upstart(mpronounbuf), await doname(xobj));
                }
            }
            if (container.otyp == ICE_BOX) {
                await removed_from_icebox(xobj);
            }
            await mpickobj(mon, xobj);
            res = 2;
        } else {
            /* couldn't carry xobj separately so put back inside */
            /* an achievement prize (castle's wand?) might already be
               marked nomerge (when it hasn't been in invent yet) */
            let already_nomerge = xobj.nomerge != 0;
            let just_xobj = !((container).cobj != null);
            /* this doesn't restore the original contents ordering
               [shouldn't be a problem; even though this item didn't
               give the rummage message, that's what mon was doing] */
            xobj.nomerge = 1;
            xobj = await add_to_container(container, xobj);
            if (!already_nomerge) {
                xobj.nomerge = 0;
            }
            container.owt = await weight(container);
            if (just_xobj) {
                break;
            }
        }
    }
    return res;
}
const __use_misc_MissingMiscellaneousItem = "use_misc: no %s";
export async function use_misc(mtmp) {
    let nambuf = '';
    let vis = 0;
    let vismon = 0;
    let vistrapspot = 0;
    let oseen = 0;
    let i = 0;
    let t = null;
    let otmp = game.m.misc;
    if ((i = await precheck(mtmp, otmp)) != 0) {
        return i;
    }
    vis = ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0);
    vismon = canseemon(mtmp);
    oseen = otmp && vismon;
    switch (game.m.has_misc) {
        case 1:
            if (!otmp) {
                await panic(__use_misc_MissingMiscellaneousItem, "potion of gain level");
            }
            await mquaffmsg(mtmp, otmp);
            if (otmp.cursed) {
                if (await Can_rise_up(mtmp.mx, mtmp.my, game.u.uz)) {
                    let tolev = depth(game.u.uz) - 1;
                    let tolevel = { dnum: 0, dlevel: 0 };
                    await get_level(tolevel, tolev);
                    if (on_level(tolevel, game.u.uz)) {
                        if (vismon) {
                            await pline_mon(mtmp, "%s looks uneasy.", await Monnam(mtmp));
                            await trycall(otmp);
                        }
                        await m_useup(mtmp, otmp);
                        return 2;
                    }
                    if (vismon) {
                        await pline_mon(mtmp, "%s rises up, through the %s!", await Monnam(mtmp), ceiling(mtmp.mx, mtmp.my));
                        await trycall(otmp);
                    }
                    await m_useup(mtmp, otmp);
                    await migrate_to_level(mtmp, ledger_no(tolevel), 0, null);
                    return 2;
                } else {
                    if (vismon) {
                        await pline_mon(mtmp, "%s looks uneasy.", await Monnam(mtmp));
                        await trycall(otmp);
                    }
                    await m_useup(mtmp, otmp);
                    return 2;
                }
            }
            if (vismon) {
                await pline_mon(mtmp, "%s seems more experienced.", await Monnam(mtmp));
            }
            if (oseen) {
                await discover_object((POT_GAIN_LEVEL), (1), (1), (1));
            }
            await m_useup(mtmp, otmp);
            if (!await grow_up(mtmp, null)) {
                return 1;
            }
            return 2;
        case 2:
        case 3:
            if (!otmp) {
                await panic(__use_misc_MissingMiscellaneousItem, "potion of invisibility");
            }
            if (otmp.otyp == WAN_MAKE_INVISIBLE) {
                await mzapwand(mtmp, otmp, (1));
            } else {
                await mquaffmsg(mtmp, otmp);
            }
            nambuf = strcpy(nambuf, await mon_nam(mtmp));
            await mon_set_minvis(mtmp, !otmp.cursed ? (0) : (1));
            if (vismon && mtmp.minvis) {
                if ((canseemon(mtmp) || sensemon(mtmp))) {
                    await pline("%s body takes on a %s transparency.", upstart(s_suffix(nambuf)), (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : "strange");
                } else {
                    await pline("Suddenly you cannot see %s.", nambuf);
                    if (vis) {
                        await map_invisible(mtmp.mx, mtmp.my);
                    }
                }
                if (oseen) {
                    await discover_object((otmp.otyp), (1), (1), (1));
                }
            } else if (vismon && !mtmp.minvis) {
                await pline("%s briefly seems to be transparent.", await Monnam(mtmp));
            } else if (!vismon && canseemon(mtmp)) {
                await pline("%s suddenly appears!", await Monnam(mtmp));
            }
            if (otmp.otyp == POT_INVISIBILITY) {
                if (otmp.cursed) {
                    await you_aggravate(mtmp);
                }
                await m_useup(mtmp, otmp);
            }
            return 2;
        case 7:
            if (!otmp) {
                await panic(__use_misc_MissingMiscellaneousItem, "wand of speed monster");
            }
            await mzapwand(mtmp, otmp, (1));
            await mon_adjust_speed(mtmp, 1, otmp);
            return 2;
        case 6:
            if (!otmp) {
                await panic(__use_misc_MissingMiscellaneousItem, "potion of speed");
            }
            await mquaffmsg(mtmp, otmp);
            await mon_adjust_speed(mtmp, 1, otmp);
            await m_useup(mtmp, otmp);
            return 2;
        case 5:
            if (!otmp) {
                await panic(__use_misc_MissingMiscellaneousItem, "wand of polymorph");
            }
            await mzapwand(mtmp, otmp, (1));
            await newcham(mtmp, await muse_newcham_mon(mtmp), 2 | 1);
            if (oseen) {
                await discover_object((WAN_POLYMORPH), (1), (1), (1));
            }
            return 2;
        case 9:
            if (!otmp) {
                await panic(__use_misc_MissingMiscellaneousItem, "potion of polymorph");
            }
            await mquaffmsg(mtmp, otmp);
            await m_useup(mtmp, otmp);
            if (vismon) {
                await pline_mon(mtmp, "%s suddenly mutates!", await Monnam(mtmp));
            }
            await newcham(mtmp, await muse_newcham_mon(mtmp), 1);
            if (oseen) {
                await discover_object((POT_POLYMORPH), (1), (1), (1));
            }
            return 2;
        case 4:
            t = t_at(game.trapx, game.trapy);
            vistrapspot = ((game.viz_array[t.ty][t.tx] & 2) != 0);
            if (vis || vistrapspot) {
                await seetrap(t);
            }
            if (vismon || vistrapspot) {
                await pline_mon(mtmp, "%s deliberately %s onto a %s!", await Some_Monnam(mtmp), await vtense(c_common_strings.c_fakename[0], locomotion(mtmp.data, "jump")), t.tseen ? trapname(t.ttyp, (0)) : "hidden trap");
            }
            game.level.monsters[mtmp.mx][mtmp.my] = null;
            await newsym(mtmp.mx, mtmp.my);
            await place_monster(mtmp, game.trapx, game.trapy);
            await maybe_unhide_at(game.trapx, game.trapy);
            if (mtmp.wormno) {
                await worm_move(mtmp);
            }
            await newsym(game.trapx, game.trapy);
            await newcham(mtmp, null, 1);
            return 2;
        case 10:
            if (!otmp) {
                await panic(__use_misc_MissingMiscellaneousItem, "container");
            }
            return await mloot_container(mtmp, otmp, vismon);
        case 8:
{
                let The_whip = vismon ? "The bullwhip" : "A whip";
                let where_to = rn2(4);
                let obj = game.uwep;
                let hand = null;
                let the_weapon = '';
                let hand_buf = '';
                if (!obj || !await canletgo(obj, "") || (game.u.twoweap && await canletgo(game.uswapwep, "") && rn2(2))) {
                    obj = game.uswapwep;
                }
                if (!obj) {
                    break;
                }
                the_weapon = strcpy(the_weapon, await the(await xname(obj)));
                hand = await body_part(HAND);
                if (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big)) {
                    hand = await makeplural(hand);
                }
                hand_buf = strncpy(hand_buf, hand, 256 /* sizeof(char [256]) */ - 1);
                hand_buf = __nh_char_write(hand_buf, 256 /* sizeof(char [256]) */ - 1, 0);
                if (vismon) {
                    await pline_mon(mtmp, "%s flicks a bullwhip towards your %s!", await Monnam(mtmp), hand_buf);
                }
                if (obj.otyp == HEAVY_IRON_BALL) {
                    await pline("%s fails to wrap around %s.", The_whip, the_weapon);
                    return 1;
                }
                await urgent_pline("%s wraps around %s you're wielding!", The_whip, the_weapon);
                if (welded(obj)) {
                    await pline("%s welded to your %s%c", !((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "It is" : "They are", hand_buf, !obj.bknown ? 33 : 46);
                    /* welded() takes care of this */
                    where_to = 0;
                }
                if (!where_to) {
                    await pline_The("whip slips free.");
                    return 1;
                } else if (where_to == 3 && mon_hates_silver(mtmp) && game.objects[obj.otyp].oc_material == SILVER) {
                    /* this monster won't want to catch a silver
                   weapon; drop it at hero's feet instead */
                    where_to = 2;
                }
                await remove_worn_item(obj, (0));
                await freeinv(obj);
                switch (where_to) {
                    case 1:
                        await pline_mon(mtmp, "%s yanks %s from your %s!", await Monnam(mtmp), the_weapon, hand_buf);
                        await place_object(obj, mtmp.mx, mtmp.my);
                        break;
                    case 2:
                        await pline_mon(mtmp, "%s yanks %s to the %s!", await Monnam(mtmp), the_weapon, surface(game.u.ux, game.u.uy));
                        await dropy(obj);
                        break;
                    case 3:
                        await pline_mon(mtmp, "%s snatches %s!", await Monnam(mtmp), the_weapon);
                        await mpickobj(mtmp, obj);
                        break;
                }
                return 1;
            }
            return 0;
        case 0:
            return 0;
        default:
            await impossible("%s wanted to perform action %d?", await Monnam(mtmp), game.m.has_misc);
            break;
    }
    return 0;
}
export async function you_aggravate(mtmp) {
    await pline("For some reason, %s presence is known to you.", s_suffix(await noit_mon_nam(mtmp)));
    await cls();
    (game.windowprocs.win_cliparound)(mtmp.mx, mtmp.my);
    await show_glyph(mtmp.mx, mtmp.my, (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((mtmp).data).pmidx)) + (((mtmp).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)));
    await show_glyph(game.u.ux, game.u.uy, ((game.u.usteed && mon_visible(game.u.usteed)) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((game.u.usteed).data).pmidx)) + (((game.u.usteed).female == 0) ? GLYPH_RIDDEN_MALE_OFF : GLYPH_RIDDEN_FEM_OFF)) : (((game.youmonst.m_ap_type & 7) == M_AP_NOTHING) ? ((((game.u.umonnum != game.u.umonster) || !game.flags.showrace) ? game.u.umonnum : game.urace.mnum) + (((((((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((game.youmonst.m_ap_type & 7) == M_AP_FURNITURE) ? (((game.youmonst.mappearance) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((game.youmonst.mappearance) <= S_trwall) ? ((game.youmonst.mappearance) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((game.youmonst.mappearance) < S_altar) ? (((game.youmonst.mappearance) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((game.youmonst.mappearance) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((game.youmonst.mappearance) < S_arrow_trap + (TRAPNUM - 1)) ? (((game.youmonst.mappearance) - S_grave) + GLYPH_CMAP_B_OFF) : ((game.youmonst.mappearance) <= S_goodpos) ? (((game.youmonst.mappearance) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH) : ((game.youmonst.m_ap_type & 7) == M_AP_OBJECT) ? ((game.youmonst.mappearance) + GLYPH_OBJ_OFF) : ((game.youmonst.mappearance) + ((((((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)))));
    await You_feel("aggravated at %s.", await noit_mon_nam(mtmp));
    await (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (1));
    await docrt();
    if (unconscious()) {
        game.multi = -1;
        game.nomovemsg = "Aggravated, you are jolted into full consciousness.";
    }
    await newsym(mtmp.mx, mtmp.my);
    if (!(canseemon(mtmp) || sensemon(mtmp))) {
        await map_invisible(mtmp.mx, mtmp.my);
    }
}
export function rnd_misc_item(mtmp) {
    let pm = mtmp.data;
    let difficulty = game.mons[(((pm).pmidx))].difficulty;
    if ((((pm).mflags1 & 262144) != 0) || attacktype(pm, 13) || (((mtmp.data).mflags1 & 65536) != 0) || pm.mlet == S_GHOST || pm.mlet == S_KOP) {
        return 0;
    }
    /* Unlike other rnd_item functions, we only allow _weak_ monsters
     * to have this item; after all, the item will be used to strengthen
     * the monster and strong monsters won't use it at all...
     */
    if (difficulty < 6 && !rn2(30)) {
        return rn2(6) ? POT_POLYMORPH : WAN_POLYMORPH;
    }
    if (!rn2(40) && !((((pm).mflags2 & 2) != 0) || (pm) == game.mons[PM_MANES] || (((pm).mlet == S_GOLEM) || (pm).mlet == S_VORTEX)) && !((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) {
        return AMULET_OF_LIFE_SAVING;
    }
    switch (rn2(3)) {
        case 0:
            if (mtmp.isgd) {
                return 0;
            }
            return rn2(6) ? POT_SPEED : WAN_SPEED_MONSTER;
        case 1:
            if (mtmp.mpeaceful && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
                return 0;
            }
            return rn2(6) ? POT_INVISIBILITY : WAN_MAKE_INVISIBLE;
        case 2:
            return POT_GAIN_LEVEL;
    }
    return 0;
}
/* check whether hero is carrying a corpse or contained petrifier corpse */
export async function searches_for_item(mon, obj) {
    let typ = obj.otyp;
    if (obj.where == 1 && (obj.ox == mon.mx && obj.oy == mon.my) && onscary(obj.ox, obj.oy, mon)) {
        return (0);
    }
    if ((((mon.data).mflags1 & 262144) != 0) || (((mon.data).mflags1 & 65536) != 0) || mon.data == game.mons[PM_GHOST]) {
        return (0);
    }
    if (typ == WAN_MAKE_INVISIBLE || typ == POT_INVISIBILITY) {
        return (!mon.minvis && !mon.invis_blkd && !attacktype(mon.data, 15));
    }
    if (typ == WAN_SPEED_MONSTER || typ == POT_SPEED) {
        return (mon.mspeed != 2);
    }
    switch (obj.oclass) {
        case WAND_CLASS:
            if (obj.spe <= 0) {
                return (0);
            }
            if (typ == WAN_DIGGING) {
                return !((mon.data).mlet == S_EYE || (mon.data).mlet == S_LIGHT);
            }
            if (typ == WAN_POLYMORPH) {
                return (game.mons[((mon.data).pmidx)].difficulty < 6);
            }
            if (game.objects[typ].oc_dir == 3 || typ == WAN_STRIKING || typ == WAN_UNDEAD_TURNING || typ == WAN_TELEPORTATION || typ == WAN_CREATE_MONSTER) {
                return (1);
            }
            break;
        case POTION_CLASS:
            if (typ == POT_HEALING || typ == POT_EXTRA_HEALING || typ == POT_FULL_HEALING || typ == POT_POLYMORPH || typ == POT_GAIN_LEVEL || typ == POT_PARALYSIS || typ == POT_SLEEPING || typ == POT_ACID || typ == POT_CONFUSION) {
                return (1);
            }
            if (typ == POT_BLINDNESS && !attacktype(mon.data, 15)) {
                return (1);
            }
            break;
        case SCROLL_CLASS:
            if (typ == SCR_TELEPORTATION || typ == SCR_CREATE_MONSTER || typ == SCR_EARTH || typ == SCR_FIRE) {
                return (1);
            }
            break;
        case AMULET_CLASS:
            if (typ == AMULET_OF_LIFE_SAVING) {
                return !(((((mon.data).mflags2 & 2) != 0) || (mon.data) == game.mons[PM_MANES] || (((mon.data).mlet == S_GOLEM) || (mon.data).mlet == S_VORTEX)) || ((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER));
            }
            if (typ == AMULET_OF_REFLECTION || typ == AMULET_OF_GUARDING) {
                return (1);
            }
            break;
        case TOOL_CLASS:
            if (typ == PICK_AXE) {
                return (((mon.data).mflags1 & 64) != 0);
            }
            if (typ == UNICORN_HORN) {
                return (!obj.cursed && !((mon.data).mlet == S_UNICORN && (((mon.data).mflags2 & 536870912) != 0)) && mon.data != game.mons[PM_KI_RIN]);
            }
            if (typ == FROST_HORN || typ == FIRE_HORN) {
                return (obj.spe > 0 && can_blow(mon));
            }
            if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) && !(((obj).otyp == BAG_OF_HOLDING || (obj).otyp == BAG_OF_TRICKS) && obj.cursed) && !obj.olocked) {
                return (1);
            }
            if (typ == EXPENSIVE_CAMERA) {
                return (obj.spe > 0);
            }
            break;
        case FOOD_CLASS:
            if (typ == CORPSE) {
                return (((mon.misc_worn_check & 16) != 0 && ((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE])) || (!await Resists_Elem(mon, STONE_RES) && cures_stoning(mon, obj, (0))));
            }
            if (typ == TIN) {
                return (mcould_eat_tin(mon) && (!await Resists_Elem(mon, STONE_RES) && cures_stoning(mon, obj, (1))));
            }
            if (typ == EGG && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS)) {
                return ((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE]);
            }
            break;
        default:
            break;
    }
    return (0);
}
export async function mon_reflects(mon, str) {
    let orefl = await which_armor(mon, 8);
    if (orefl && orefl.otyp == SHIELD_OF_REFLECTION) {
        if (str) {
            await pline(str, s_suffix(await mon_nam(mon)), "shield");
            await discover_object((SHIELD_OF_REFLECTION), (1), (1), (1));
        }
        return (1);
    } else if (arti_reflects(((mon).mw))) {
        if (str) {
            await pline(str, s_suffix(await mon_nam(mon)), "weapon");
        }
        return (1);
    } else if ((orefl = await which_armor(mon, 65536)) && orefl.otyp == AMULET_OF_REFLECTION) {
        if (str) {
            await pline(str, s_suffix(await mon_nam(mon)), "amulet");
            await discover_object((AMULET_OF_REFLECTION), (1), (1), (1));
        }
        return (1);
    } else if ((orefl = await which_armor(mon, 1)) && (orefl.otyp == SILVER_DRAGON_SCALES || orefl.otyp == SILVER_DRAGON_SCALE_MAIL)) {
        if (str) {
            await pline(str, s_suffix(await mon_nam(mon)), "armor");
        }
        return (1);
    } else if (mon.data == game.mons[PM_SILVER_DRAGON] || mon.data == game.mons[PM_CHROMATIC_DRAGON]) {
        if (str) {
            await pline(str, s_suffix(await mon_nam(mon)), "scales");
        }
        return (1);
    }
    return (0);
}
export async function ureflects(fmt, str) {
    if (game.u.uprops[REFLECTING].extrinsic & 8) {
        if (fmt && str) {
            await pline(fmt, str, "shield");
            await discover_object((SHIELD_OF_REFLECTION), (1), (1), (1));
        }
        return (1);
    } else if (game.u.uprops[REFLECTING].extrinsic & 256) {
        if (fmt && str) {
            await pline(fmt, str, "weapon");
        }
        return (1);
    } else if (game.u.uprops[REFLECTING].extrinsic & 65536) {
        if (fmt && str) {
            await pline(fmt, str, "medallion");
            await discover_object((AMULET_OF_REFLECTION), (1), (1), (1));
        }
        return (1);
    } else if (game.u.uprops[REFLECTING].extrinsic & 1) {
        if (fmt && str) {
            await pline(fmt, str, game.uskin ? "luster" : "armor");
        }
        return (1);
    } else if (game.youmonst.data == game.mons[PM_SILVER_DRAGON]) {
        if (fmt && str) {
            await pline(fmt, str, "scales");
        }
        return (1);
    }
    return (0);
}
/* cure mon's blindness (use_defensive, dog_eat, meatobj) */
export async function mcureblindness(mon, verbos) {
    if (!mon.mcansee) {
        mon.mcansee = 1;
        mon.mblinded = 0;
        if (verbos && (((mon.data).mflags1 & 4096) == 0)) {
            await pline_mon(mon, "%s can see again.", await Monnam(mon));
        }
    }
}
/* TRUE if the monster ate something */
export async function munstone(mon, by_you) {
    let obj = null;
    let tinok = 0;
    if (await Resists_Elem(mon, STONE_RES)) {
        return (0);
    }
    if (mon.meating || ((mon).msleeping || !(mon).mcanmove)) {
        return (0);
    }
    mon.mstrategy &= ~536870912;
    tinok = mcould_eat_tin(mon);
    for (obj = mon.minvent; obj; obj = obj.nobj) {
        if (cures_stoning(mon, obj, tinok)) {
            await mon_consume_unstone(mon, obj, by_you, (1));
            return (1);
        }
    }
    return (0);
}
/* T: stop petrification, F: cure stun && confusion */
export async function mon_consume_unstone(mon, obj, by_you, stoning) {
    let vis = canseemon(mon);
    let tinned = obj.otyp == TIN;
    let food = obj.otyp == CORPSE || tinned;
    let acid = obj.otyp == POT_ACID || (food && (((game.mons[obj.corpsenm]).mflags1 & 134217728) != 0));
    let lizard = food && obj.corpsenm == PM_LIZARD;
    let nutrit = food ? await dog_nutrition(mon, obj) : 0;
    if (stoning) {
        await mon_adjust_speed(mon, -3, null);
    }
    if (vis) {
        let save_quan = obj.quan;
        obj.quan = 1;
        await pline_mon(mon, "%s %s %s.", await Monnam(mon), ((obj.oclass == POTION_CLASS) ? "quaffs" : (obj.otyp == TIN) ? "opens and eats the contents of" : "eats"), await distant_name(obj, doname));
        obj.quan = save_quan;
    } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        await You_hear("%s.", (obj.oclass == POTION_CLASS) ? "drinking" : "chewing");
    }
    await m_useup(mon, obj);
    if (acid && !tinned && !await Resists_Elem(mon, ACID_RES)) {
        mon.mhp -= rnd(15);
        if (vis) {
            await pline_mon(mon, "%s has a very bad case of stomach acid.", await Monnam(mon));
        }
        if (((mon).mhp < 1)) {
            await pline_mon(mon, "%s dies!", await Monnam(mon));
            if (by_you) {
                await xkilled(mon, 1 | 4);
            } else {
                await mondead(mon);
            }
            return;
        }
    }
    if (stoning && vis) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await pline("What a pity - %s just ruined a future piece of art!", await mon_nam(mon));
        } else {
            await pline_mon(mon, "%s seems limber!", await Monnam(mon));
        }
    }
    if (lizard && (mon.mconf || mon.mstun)) {
        mon.mconf = 0;
        mon.mstun = 0;
        if (vis && !((mon.data) == game.mons[PM_BAT] || (mon.data) == game.mons[PM_GIANT_BAT] || (mon.data) == game.mons[PM_VAMPIRE_BAT]) && mon.data != game.mons[PM_STALKER]) {
            await pline_mon(mon, "%s seems steadier now.", await Monnam(mon));
        }
    }
    if (mon.mtame && !mon.isminion && nutrit > 0) {
        let edog = ((mon).mextra.edog);
        if (edog.hungrytime < game.moves) {
            edog.hungrytime = game.moves;
        }
        edog.hungrytime += nutrit;
        mon.mconf = 0;
    }
    /* use up monster's next move */
    mon.movement -= 12;
    mon.mlstmv = game.moves;
}
/* decide whether obj can cure petrification; also used when picking up */
export function cures_stoning(mon, obj, tinok) {
    if (obj.otyp == POT_ACID) {
        return (1);
    }
    if (obj.otyp == GLOB_OF_GREEN_SLIME) {
        return ((mon.data) == game.mons[PM_GREEN_SLIME] || ((mon.data) == game.mons[PM_FIRE_VORTEX] || (mon.data) == game.mons[PM_FLAMING_SPHERE] || (mon.data) == game.mons[PM_FIRE_ELEMENTAL] || (mon.data) == game.mons[PM_SALAMANDER]) || ((mon.data).mlet == S_GHOST));
    }
    if (obj.otyp != CORPSE && (obj.otyp != TIN || !tinok)) {
        return (0);
    }
    /* corpse, or tin that mon can open */
    if (obj.corpsenm == NON_PM) {
        return (0);
    }
    return (obj.corpsenm == PM_LIZARD || (((game.mons[obj.corpsenm]).mflags1 & 134217728) != 0));
}
export function mcould_eat_tin(mon) {
    let obj = null;
    let mwep = null;
    let welded_wep = 0;
    /* monkeys who manage to steal tins can't open and eat them
       even if they happen to also have the appropriate tool */
    if ((((mon.data).mflags1 & 262144) != 0)) {
        return (0);
    }
    mwep = ((mon).mw);
    welded_wep = mwep && mwelded(mwep);
    for (obj = mon.minvent; obj; obj = obj.nobj) {
        /* this is different from the player; tin opener or dagger doesn't
       have to be wielded, and knife can be used instead of dagger */
        /* if stuck with a cursed weapon, don't check rest of inventory */
        if (welded_wep && obj != mwep) {
            continue;
        }
        if (obj.otyp == TIN_OPENER || (obj.oclass == WEAPON_CLASS && (game.objects[obj.otyp].oc_subtyp == P_DAGGER || game.objects[obj.otyp].oc_subtyp == P_KNIFE))) {
            return (1);
        }
    }
    return (0);
}
/* TRUE if monster does something to avoid turning into green slime */
export async function munslime(mon, by_you) {
    let obj = null;
    let odummy = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let mptr = mon.data;
    /*
     * muse_unslime() gives "mon starts turning green", "mon zaps
     * itself with a wand of fire", and "mon's slime burns away"
     * messages.  Monsters who don't get any chance at that just have
     * (via our caller) newcham()'s "mon turns into slime" feedback.
     */
    if (((mptr) == game.mons[PM_GREEN_SLIME] || ((mptr) == game.mons[PM_FIRE_VORTEX] || (mptr) == game.mons[PM_FLAMING_SPHERE] || (mptr) == game.mons[PM_FIRE_ELEMENTAL] || (mptr) == game.mons[PM_SALAMANDER]) || ((mptr).mlet == S_GHOST))) {
        return (0);
    }
    if (mon.meating || ((mon).msleeping || !(mon).mcanmove)) {
        return (0);
    }
    mon.mstrategy &= ~536870912;
    if (!mon.mcan && !mon.mspec_used && attacktype_fordmg(mptr, 12, 2)) {
        /* if monster can breathe fire, do so upon self; a monster who deals
       fire damage by biting, clawing, gazing, and especially exploding
       isn't able to cure itself of green slime with its own attack
       [possible extension: monst capable of casting high level clerical
       spells could toss pillar of fire at self--probably too suicidal] */
        Object.assign(odummy, cg.zeroobj);
        return await muse_unslime(mon, odummy, null, by_you);
    }
    if (!(((mptr).mflags1 & 262144) != 0) && !(((mptr).mflags1 & 65536) != 0)) {
        /* same MUSE criteria as use_defensive() */
        let t = null;
        for (obj = mon.minvent; obj; obj = obj.nobj) {
            if (cures_sliming(mon, obj)) {
                return await muse_unslime(mon, obj, null, by_you);
            }
        }
        if (((t = t_at(mon.mx, mon.my)) == null || t.ttyp != FIRE_TRAP) && mptr.mmove && !mon.mtrapped) {
            let xy = [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]];
            let x = 0;
            let y = 0;
            let idx = 0;
            let ridx = 0;
            let nxy = 0;
            for (x = mon.mx - 1; x <= mon.mx + 1; ++x) {
                for (y = mon.my - 1; y <= mon.my + 1; ++y) {
                    if (isok(x, y) && accessible(x, y) && !(game.level.monsters[x][y]) && (x != game.u.ux || y != game.u.uy)) {
                        xy[0][nxy] = x , xy[1][nxy] = y;
                        ++nxy;
                    }
                }
            }
            for (idx = 0; idx < nxy; ++idx) {
                ridx = (rn2(nxy - idx) + (idx));
                if (ridx != idx) {
                    x = xy[0][idx];
                    xy[0][idx] = xy[0][ridx];
                    xy[0][ridx] = x;
                    y = xy[1][idx];
                    xy[1][idx] = xy[1][ridx];
                    xy[1][ridx] = y;
                }
                if ((t = t_at(xy[0][idx], xy[1][idx])) != null && t.ttyp == FIRE_TRAP) {
                    break;
                }
            }
        }
        if (t && t.ttyp == FIRE_TRAP) {
            return await muse_unslime(mon, game.hands_obj, t, by_you);
        }
    }
    return (0);
}
/* mon uses an item--selected by caller--to burn away incipient slime */
/* true: if mon kills itself, hero gets credit/blame */
export async function muse_unslime(mon, obj, trap, by_you) {
    /* [by_you not honored if 'mon' triggers fire trap]. */
    let odummyp = null;
    let otyp = obj.otyp;
    let dmg = 0;
    let vis = canseemon(mon);
    let res = (1);
    if (vis) {
        await pline_mon(mon, "%s starts turning %s.", await Monnam(mon), green_mon(mon) ? "into ooze" : hcolor(c_color_names.c_green));
    }
    await mon_adjust_speed(mon, -4, null);
    if (trap) {
        let Mnam = vis ? await Monnam(mon) : null;
        if (mon.mx == trap.tx && mon.my == trap.ty) {
            if (vis) {
                await pline("%s triggers %s fire trap!", Mnam, trap.tseen ? "the" : "a");
            }
        } else {
            game.level.monsters[mon.mx][mon.my] = null;
            await newsym(mon.mx, mon.my);
            await place_monster(mon, trap.tx, trap.ty);
            if (mon.wormno) {
                await worm_move(mon);
            }
            await newsym(mon.mx, mon.my);
            if (vis) {
                await pline("%s %s %s %s fire trap!", Mnam, await vtense(c_common_strings.c_fakename[0], locomotion(mon.data, "move")), ((mon.data).mlet == S_EYE || (mon.data).mlet == S_LIGHT) ? "over" : "onto", trap.tseen ? "the" : "a");
            }
        }
        await mintrap(mon, 1);
    } else if (otyp == STRANGE_OBJECT) {
        if (vis) {
            await pline_mon(mon, "%s.", await monverbself(mon, await Monnam(mon), "breath", "fire on"));
        }
        if (!rn2(3)) {
            mon.mspec_used = (rn2(10) + (5));
        }
        dmg = await zhitm(mon, by_you ? 21 : -21, 1, { get value() { return odummyp; }, set value(_v) { odummyp = _v; } });
    } else if (otyp == SCR_FIRE) {
        await mreadmsg(mon, obj);
        if (mon.mconf) {
            if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
                await pline("Oh, what a pretty fire!");
            }
            if (vis) {
                await trycall(obj);
            }
            await m_useup(mon, obj);
            vis = (0);
            res = (0);
        } else {
            dmg = Math.trunc((2 * ((rn2(3) + (3)) + 2 * bcsign(obj)) + 1) / 3);
            await m_useup(mon, obj);
            await explode(mon.mx, mon.my, -11, dmg, SCROLL_CLASS, by_you ? -EXPL_FIERY : EXPL_FIERY);
            /* damage has been applied by explode() */
            dmg = 0;
        }
    } else if (otyp == POT_OIL) {
        let Pronoun = '';
        let was_lit = obj.lamplit ? (1) : (0);
        let saw_lit = (0);
        if (obj.quan > 1) {
            obj = await splitobj(obj, 1);
        }
        if (vis && !was_lit) {
            await pline_mon(mon, "%s ignites %s.", await Monnam(mon), await ansimpleoname(obj));
            saw_lit = (1);
        }
        await begin_burn(obj, was_lit);
        /* burning potion may improve visibility */
        vis |= canseemon(mon);
        if (vis) {
            if (!(game.multi < 0 && (unconscious() || is_fainted()))) {
                await observe_object(obj);
            }
            await pline("%s quaffs a burning %s", saw_lit ? upstart(strcpy(Pronoun, (genders[pronoun_gender(mon, 2)].he))) : await Monnam(mon), await simpleonames(obj));
            await discover_object((POT_OIL), (1), (1), (1));
        }
        /* [**TEMP** (different from hero)] */
        dmg = d(3, 4);
        await m_useup(mon, obj);
    } else {
        if (obj.otyp == FIRE_HORN) {
            await mplayhorn(mon, obj, (1));
        } else {
            await mzapwand(mon, obj, (1));
        }
        dmg = await zhitm(mon, by_you ? 1 : -1, 2, { get value() { return odummyp; }, set value(_v) { odummyp = _v; } });
    }
    if (dmg) {
        if (((mon).mhp < 1)) {
            if (by_you) {
                if (vis) {
                    await pline_mon(mon, "%s is %s by the fire!", await Monnam(mon), ((((mon.data).mflags2 & 2) != 0) || (mon.data) == game.mons[PM_MANES] || (((mon.data).mlet == S_GOLEM) || (mon.data).mlet == S_VORTEX)) ? "destroyed" : "killed");
                }
                await xkilled(mon, 1 | 4);
            } else {
                await monkilled(mon, "fire", 2);
            }
        } else {
            if (vis) {
                await pline_mon(mon, "%s is burned%s", await Monnam(mon), exclam(dmg));
            }
        }
    }
    if (vis) {
        if (res && !((mon).mhp < 1)) {
            await pline_mon(mon, "%s slime is burned away!", s_suffix(await Monnam(mon)));
        }
        if (otyp != STRANGE_OBJECT) {
            await discover_object((otyp), (1), (1), (1));
        }
    }
    mon.movement -= 12;
    mon.mlstmv = game.moves;
    return res;
}
/* decide whether obj can be used to cure green slime */
export function cures_sliming(mon, obj) {
    if (obj.otyp == SCR_FIRE) {
        return ((((mon.data).mflags1 & 4096) == 0) && mon.mcansee && !(((mon.data).mflags1 & 8192) != 0));
    }
    /* potion of oil; will be set burning if not already */
    if (obj.otyp == POT_OIL) {
        return !(((mon.data).mflags1 & 8192) != 0);
    }
    /* non-empty wand or horn of fire;
       hero doesn't need hands or even limbs to zap, so mon doesn't either */
    return ((obj.otyp == WAN_FIRE || (obj.otyp == FIRE_HORN && can_blow(mon))) && obj.spe > 0);
}
/* TRUE if monster appears to be green; we go by the display color.
   The alternative was to just pick things that
   seem plausibly green (which didn't necessarily match the categorization
   by the color of the text).
   iflags.use_color is not meant for game behavior decisions */
export function green_mon(mon) {
    let ptr = mon.data;
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        return (0);
    }
    return (ptr.mcolor == 2 || ptr.mcolor == 10);
}
/*muse.c*/
/* I suspect few players will be upset that monsters */
/* can't wish for wands of death here.... */
/* 3.6.1: no Deaf filter; 'if' message doesn't warrant it, 'else'
           message doesn't need it since You_hear() has one of its own */
/* "<mon> plays a <horn> directed at himself!" */
/* (wands handle this slightly differently) */
/* monverbself() would adjust the verb if hallucination made
                 subject plural; stick with singular here, at least for now */
/* seeing/hearing scroll read reveals its label */
/* directly see the monster reading the scroll */
/* monster can't be seen or sensed; hero might be blind or monster
               might be at a spot that isn't in view or might be invisible;
               remember it if the spot is within line of sight and relatively
               close */
/* (note: won't get if not seen and hero can't hear) */
/* monster learns that teleportation isn't useful here */
/* teleporation has been triggered by an object */
/* unlike most defensive cases, unicorn horn object is optional */
/* we want to be able to access otmp after the teleport but it
           might get destroyed if still in mtmp's inventory (maybe mtmp
           lands in lava or on a fire trap) so take it out in advance */
/* sets otmp->dknown if !Blind or !Deaf */
/* already removed from mtmp->minvent so not 'm_useup(mtmp, otmp)' */
/* can't dig further if there's already a pit (or other trap)
               here, or if pit creation fails for some reason */
/* we made sure that there is a level for mtmp to go to */
/* `fish' potentially gives bias towards water locations;
               `pm' is what to actually create (0 => random) */
/* The only case where we don't use oseen.  For wands, you
         * have to be able to see the monster zap the wand to know
         * what type it is.  For teleport scrolls, you have to see
         * the monster to know it teleported.
         */
/* trap doors on "bottom" levels of dungeons are rock-drop
         * trap doors, not holes in the floor.  We check here for
         * safety.
         */
/* if trap was in a concealed niche, it's no longer concealed */
/*  don't use rloc_to() because worm tails must "move" */
/* impossible; level 1 upstairs are SSTAIRS */
/* simpler than for the player; this will usually be
               the Wizard and he'll immediately go right to the
               upstairs, so there's not much point in having any
               chance for a random position on the current level */
/* going from the Valley to Castle (Stronghold) has no sstairs
           to target, but having gs.sstairs.<sx,sy> == <0,0> will work the
           same as specifying MIGR_RANDOM when mon_arrive() eventually
           places the monster, so we can use MIGR_SSTAIRS unconditionally */
/* 0: 'no object' rather than STRANGE_OBJECT; FALSE: obj not seen */
/* not actually called for its unstoning effect */
/* usually avoid digging in Sokoban */
/*
         * If hero is carrying one or more corpses but isn't wielding
         * a cockatrice corpse (unless being hit by one won't do
         * the monster much harm); otherwise we'd be using this wand
         * as a defensive item with higher priority.
         *
         * Might be cockatrice intended as a weapon (or being denied
         * to glove-wearing monsters for use as a weapon) or lizard
         * intended as a cure or lichen intended as veggy food or
         * sacrifice fodder being lugged to an altar.  Zapping with
         * this will deprive hero of one from each stack although
         * they might subsequently be recovered after killing again.
         * In the sacrifice fodder case, it could even be to the
         * player's advantage (fresher corpse if a new one gets
         * dropped; player might not choose to spend a wand charge
         * on that when/if hero acquires this wand).
         */
/* or there's a corpse on the ground in a direct line from the
           monster to the hero, and up to 3 steps beyond. */
/* monster likes any of the top 3 items in the pile? */
/*
             * TODO?
             *  Could choose scroll if <mux,muy> (where attacker thinks
             *  hero is located) is ice and attacker either isn't also
             *  on ice or is able to fly/float/swim.
             */
/* affects mtmp's invent, not mtmp */
/* if levl[x][y].typ is DRAWBRIDGE_UP then the zap is passing
               over the moat in front of a closed drawbridge and doesn't
               hit any part of the bridge's mechanism (yet; it might be
               about to hit the closed portcullis on the next iteration) */
/* this might kill mon and destroy obj but they'll remain
               accessible; (*fhitm)() and (*fhito)() use obj for zap type */
/* note: monsters don't use opening or locking magic
               at present, but keep these as placeholders */
/* offensive potions are not drunk, they're thrown */
/* could be fatal to monster, so use up the scroll before
           there's a chance that monster's inventory will be dropped */
/* Loop through the surrounding squares */
/* Is this a suitable spot? */
/* Note: this setting of dknown doesn't suffice.  A monster
         * which is out of sight might throw and it hits something _in_
         * sight, a problem not existing with wands because wand rays
         * are not objects.  Also set dknown in mthrowu.c.
         */
/* this was originally just 'can_carry(mon, xobj)' which
           covers objects a monster shouldn't pick up but also
           checks carrying capacity; for that, it ended up counting
           xobj's weight twice when container is carried; so take
           xobj out, check whether it can be carried, and then put
           it back (below) if it can't be */
/* this reduces container's weight */
/* adjacent, additional items */
/* xname sets dknown, distant_name might depending on its own
               idea about nearness */
/* check whether mon can handle xobj and whether weight of xobj plus
           minvent (including container, now without xobj) can be carried */
/* resume rotting for corpse */
/* obj_extract_self(xobj); -- already done above */
/* out of takeout_count loop */
/* insurance against future changes... */
/* format monster's name before altering its visibility */
/* cursed potion; mon tried to make itself invisible but failed */
/* we could call map_invisible() before the pline(), then
               newsym() after; unseen monster glyph would be visible during
               the pline, but hero would forget any remembered object under
               the monster */
/* cursed potion; this won't happen because a monster will only
               drink a potion of invisibility when not already invisible */
/* note difference in potion effect due to substantially
           different methods of maintaining speed ratings:
           player's character becomes "very fast" temporarily;
           monster becomes "one stage faster" permanently */
/* note: if mtmp is unseen because it is invisible, its new
               shape will also be invisible and could produce "Its armor
               falls off" messages during the transformation; those make
               more sense after we've given "Someone jumps onto a trap." */
/*  don't use rloc() due to worms */
/* shouldn't happen after find_misc() */
/* due to wielded artifact weapon */
/* Silver dragons only reflect when mature; babies do not */
/* Check from outermost to innermost objects */
/* Due to wielded artifact weapon */
/* give a "<mon> is slowing down" message and also remove
       intrinsic speed (comparable to similar effect on the hero) */
/* hero gets credit (experience) and blame (possible loss
                   of alignment and/or luck and/or telepathy depending on
                   mon) for the kill but does not break pacifism conduct */
/* -4 => sliming, causes quiet loss of enhanced speed */
/* won't happen; worms don't MUSE to unslime */
/* monster is using fire breath on self */
/* -21 => monster's fire breath; 1 => # of damage dice */
/* -11 => monster's fireball */
/* by_you: override -11 for mon but not others */
/*
         * If not already lit, requires two actions.  We cheat and let
         * monster do both rather than render the potion unusable.
         *
         * Monsters don't start with oil and don't actively pick up oil
         * so this may never occur in a real game.  (Possible though;
         * nymph can steal potions of oil; shapechanger could take on
         * nymph form or vacuum up stuff as a gel.cube and then eventually
         * engage with a green slime.)
         */
/* hero is watching mon drink obj */
/* wand/horn of fire w/ positive charge count */
/* -1 => monster's wand of fire; 2 => # of damage dice */
/* zhitm() applies damage but doesn't kill creature off;
           for fire breath, dmg is going to be 0 (fire breathers are
           immune to fire damage) but for wand of fire or fire horn,
           'mon' could have taken damage so might die */
/* mon killed self but hero gets credit and blame (except
                   for pacifist conduct); xkilled()'s message would say
                   "You killed/destroyed <mon>" so give our own message */
/* non-fatal damage occurred */
