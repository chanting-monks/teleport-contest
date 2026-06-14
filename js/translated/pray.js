/* NetHack 5.0	pray.c	$NHDT-Date: 1762680996 2025/11/09 01:36:36 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.244 $ */
/* Copyright (c) Benson I. Margulies, Mike Stephenson, Steve Linhart, 1989. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, strcmp, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { artifact_origin, artiname, confers_luck, discover_artifact, exist_artifact, is_art, mk_artifact, nartifact_exist } from './artifact.js';
import { adjalign, adjattrib, change_luck, exercise, setuhpmax, uchangealign } from './attrib.js';
import { xlev_to_rank } from './botl.js';
import { isok, paranoid_query, yn_function } from './cmd.js';
import { is_pool_or_lava } from './dbridge.js';
import { c_color_names, c_common_strings, ynchars } from './decl.js';
import { buried_ball_to_freedom } from './dig.js';
import { newsym, see_monsters, shieldeff } from './display.js';
import { dropy, heal_legs } from './do.js';
import { Monnam, a_monnam, hcolor, mon_nam, oname } from './do_name.js';
import { Amulet_off, disintegrate_arm, stuck_ring, unchanger } from './do_wear.js';
import { In_hell, on_level } from './dungeon.js';
import { eaten_stat, floorfood, init_uhunger } from './eat.js';
import { done } from './end.js';
import { freehand } from './engrave.js';
import { losexp, pluslvl } from './exper.js';
import { losehp, near_capacity, nomul } from './hack.js';
import { dist2, s_suffix, upstart } from './hacklib.js';
import { align_str, record_achievement } from './insight.js';
import { carrying, feel_cockatrice, sobj_at, update_inventory, useup, useupf } from './invent.js';
import { makemon, set_malign } from './makemon.js';
import { dlord, summon_minion } from './minion.js';
import { bless, get_mtraits, mkobj, mksobj, peek_at_iced_corpse_age, place_object, set_bknown, uncurse } from './mkobj.js';
import { iter_mons, killed, wake_nearby, xkilled } from './mon.js';
import { Resists_Elem, attacktype_fordmg, can_chant, monstseesu, monstunseesu } from './mondata.js';
import { monflee } from './monmove.js';
import { ureflects } from './muse.js';
import { ACH_TUNE, AGGRAVATE_MONSTER, ALTAR, AMULET_OF_STRANGULATION, AMULET_OF_YENDOR, ANTIMAGIC, ART_EXCALIBUR, ART_STORMBRINGER, ART_VORPAL_BLADE, ASCENDED, A_CG_CONVERT, A_CON, A_MAX, A_STR, A_WIS, BLINDED, BOULDER, COLD_RES, CONFUSION, CORPSE, DEAF, DIED, DISINT_RES, DISSOLVED, ESCAPED, EXT_ENCUMBER, EYE, FAKE_AMULET_OF_YENDOR, FAST, FIRE_RES, FIXED_ABIL, FLYING, FOOT, FUMBLE_BOOTS, GAUNTLETS_OF_FUMBLING, GLIB, HALLUC, HALLUC_RES, HELM_OF_OPPOSITE_ALIGNMENT, HUNGRY, HVY_ENCUMBER, LEVITATION, LEVITATION_BOOTS, LOADSTONE, LONG_SWORD, LOW_PM, MAGIC_MARKER, M_AP_FURNITURE, M_SEEN_DISINT, M_SEEN_ELEC, M_SEEN_REFL, NON_PM, NUMMONS, PASSES_WALLS, PLNMSG_OBJ_GLOWS, PM_ACID_BLOB, PM_CLERIC, PM_CYCLOPS, PM_FLOATING_EYE, PM_KNIGHT, PM_MONK, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WIZARD, PM_WRAITH, POISON_RES, POOL, POTION_CLASS, POT_WATER, PROTECTION, P_BROAD_SWORD, P_ISRESTRICTED, P_LONG_SWORD, P_NONE, REFLECTING, RIN_LEVITATION, RIN_SUSTAIN_ABILITY, ROOM, RUNESWORD, SADDLE, SCORR, SDOOR, SEE_INVIS, SHOCK_RES, SICK, SLEEP_RES, SLIMED, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_FINGER_OF_DEATH, SPE_RESTORE_ABILITY, SPE_TURN_UNDEAD, STATUE, STEALTH, STOMACH, STONED, STRANGE_OBJECT, STRANGLED, STUNNED, S_GHOST, S_HUMAN, S_LICH, S_MUMMY, S_UNICORN, S_VAMPIRE, S_WRAITH, S_ZOMBIE, S_altar, TELEPAT, TOOL_CLASS, TT_BURIEDBALL, TT_LAVA, UNCHANGING, WEAK, WEAPON_CLASS, WOUNDED_LEGS, spe_Forgotten, spe_Fresh, spe_Unknown } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { An, Yobjnam2, actualoname, an, ansimpleoname, bare_artifactname, corpse_xname, gloves_simple_name, makeplural, otense, rnd_class, simpleonames, vtense, xname, yname } from './objnam.js';
import { encumber_msg, rider_corpse_revival } from './pickup.js';
import { livelog_printf } from './pline.js';
import { body_part, mbodypart, rehumanize } from './polyself.js';
import { make_blinded, make_confused, make_deaf, make_glib, make_hallucinated, make_sick, make_slimed, make_stoned, make_stunned, set_itimeout } from './potion.js';
import { angry_priest, findpriest, p_coaligned, temple_occupied } from './priest.js';
import { punish, unpunish } from './read.js';
import { region_danger, region_safety } from './region.js';
import { d, rn2, rn2_on_display_rng, rnd, rnl, rnz } from './rnd.js';
import { genders, randrole, roles } from './role.js';
import { obfree } from './shk.js';
import { attrcurse, rndcurse } from './sit.js';
import { force_learn_spell, known_spell, spell_skilltype, spelleffects } from './spell.js';
import { safe_teleds } from './teleport.js';
import { animate_statue, rescued_from_terrain, reset_utrap } from './trap.js';
import { add_weapon_skill, unrestrict_weapon_skill, weapon_type } from './weapon.js';
import { you_unwere } from './were.js';
import { welded } from './wield.js';
import { aggravate } from './wizard.js';
import { which_armor } from './worn.js';
import { resist, revive } from './zap.js';

/* NORETURN */
/* simplify a few tests */
/*
 * Logic behind deities and altars and such:
 * + prayers are made to your god if not on an altar, and to the altar's god
 *   if you are on an altar
 * + If possible, your god answers all prayers, which is why bad things happen
 *   if you try to pray on another god's altar
 * + sacrifices work basically the same way, but the other god may decide to
 *   accept your allegiance, after which they are your god.  If rejected,
 *   your god takes over with your punishment.
 * + if you're in Gehennom, all messages come from Moloch
 */
/*
 *      Moloch, who dwells in Gehennom, is the "renegade" cruel god
 *      responsible for the theft of the Amulet from Marduk, the Creator.
 *      Moloch is unaligned.
 */
const Moloch = "Moloch";
const godvoices = ["booms out", "thunders", "rings out", "booms"];
/*
 * The actual trouble priority is determined by the order of the
 * checks performed in in_trouble() rather than by these numeric
 * values, so keep that code and these values synchronized in
 * order to have the values be meaningful.
 */
/* stinking cloud */
/* used by turn undead iteration function; always reinitialized
   before iterating that, so don't need to be globals */
game.turn_undead_range = 0;
game.turn_undead_msg_cnt = 0;
/* critically low hit points if hp <= 5 or hp <= maxhp/N for some N */
/* determines whether maxhp <= 5 matters */
export function critically_low_hp(only_if_injured) {
    let divisor = 0;
    let hplim = 0;
    let curhp = (game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp;
    let maxhp = (game.u.umonnum != game.u.umonster) ? game.u.mhmax : game.u.uhpmax;
    if (only_if_injured && !(curhp < maxhp)) {
        return (0);
    }
    /* if maxhp is extremely high, use lower threshold for the division test
       (golden glow cuts off at 11+5*lvl, nurse interaction at 25*lvl; this
       ought to use monster hit dice--and a smaller multiplier--rather than
       ulevel when polymorphed, but polyself doesn't maintain that) */
    hplim = 15 * game.u.ulevel;
    if (maxhp > hplim) {
        maxhp = hplim;
    }
    switch (xlev_to_rank(game.u.ulevel)) {
        /* 7 used to be the unconditional divisor */
        /* possible if bad align & good luck */
        case 0:
        /* no boulders--not blocked */
        case 1:
            divisor = 5;
            break;
        case 2:
        case 3:
            divisor = 6;
            break;
        case 4:
        case 5:
            divisor = 7;
            break;
        case 6:
        case 7:
            divisor = 8;
            break;
        default:
            divisor = 9;
            break;
    }
    /* 5 is a magic number in TROUBLE_HIT handling below */
    return (curhp <= 5 || curhp * divisor <= maxhp);
}
/* return True if surrounded by impassible rock, regardless of the state
   of your own location (for example, inside a doorless closet) */
export function stuck_in_wall() {
    let i = 0;
    let j = 0;
    let x = 0;
    let y = 0;
    let count = 0;
    if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic)) {
        return (0);
    }
    for (i = -1; i <= 1; i++) {
        x = game.u.ux + i;
        for (j = -1; j <= 1; j++) {
            if (!i && !j) {
                continue;
            }
            y = game.u.uy + j;
            if (!isok(x, y) || (((game.level.locations[x][y].typ) < POOL) && (game.level.locations[x][y].typ != SDOOR && game.level.locations[x][y].typ != SCORR)) || (blocked_boulder(i, j) && !(((game.youmonst.data).mflags2 & 134217728) != 0))) {
                ++count;
            }
        }
    }
    return (count == 8) ? (1) : (0);
}
/*
 * Return 0 if nothing particular seems wrong, positive numbers for
 * serious trouble, and negative numbers for comparative annoyances.
 * This returns the worst problem. There may be others, and the gods
 * may fix more than one.
 *
 * This could get as bizarre as noting surrounding opponents, (or
 * hostile dogs), but that's really hard.
 *
 * We could force rehumanize of polyselfed people, but we can't tell
 * unintentional shape changes from the other kind. Oh well.
 * 3.4.2: make an exception if polymorphed into a form which lacks
 * hands; that's a case where the ramifications override this doubt.
 */
export async function in_trouble() {
    let otmp = null;
    let i = 0;
    /*
     * major troubles
     */
    if (game.u.uprops[STONED].intrinsic) {
        return 14;
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        return 13;
    }
    if (game.u.uprops[STRANGLED].intrinsic) {
        return 12;
    }
    if (game.u.utrap && game.u.utraptype == TT_LAVA) {
        return 11;
    }
    if (game.u.uprops[SICK].intrinsic) {
        return 10;
    }
    if (game.u.uhs >= WEAK) {
        return 9;
    }
    if (region_danger()) {
        return 8;
    }
    if ((!(game.u.umonnum != game.u.umonster) || (game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) && critically_low_hp((0))) {
        return 7;
    }
    if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS)) {
        return 6;
    }
    if (near_capacity() >= EXT_ENCUMBER && (game.u.amax.a[A_STR]) - (game.u.acurr.a[A_STR]) > 3) {
        return 5;
    }
    if (stuck_in_wall()) {
        return 4;
    }
    if (((game.uarmf) && (game.uarmf).otyp == (LEVITATION_BOOTS) && (game.uarmf).cursed) || await stuck_ring(game.uleft, RIN_LEVITATION) || await stuck_ring(game.uright, RIN_LEVITATION)) {
        return 3;
    }
    if ((((game.youmonst.data).mflags1 & 8192) != 0) || !freehand()) {
        /* for bag/box access [cf use_container()]...
           make sure it's a case that we know how to handle;
           otherwise "fix all troubles" would get stuck in a loop */
        if (welded(game.uwep)) {
            return 2;
        }
        if ((game.u.umonnum != game.u.umonster) && (((game.youmonst.data).mflags1 & 8192) != 0) && (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) || ((otmp = unchanger()) != null && otmp.cursed))) {
            return 2;
        }
    }
    if (game.u.uprops[BLINDED].extrinsic && game.ublindf.cursed) {
        return 1;
    }
    /*
     * minor troubles
     */
    if ((game.uball != null) || (game.u.utrap && game.u.utraptype == TT_BURIEDBALL)) {
        return (-1);
    }
    if (((game.uarmg) && (game.uarmg).otyp == (GAUNTLETS_OF_FUMBLING) && (game.uarmg).cursed) || ((game.uarmf) && (game.uarmf).otyp == (FUMBLE_BOOTS) && (game.uarmf).cursed)) {
        return (-2);
    }
    if (worst_cursed_item()) {
        return (-3);
    }
    if (game.u.usteed) {
        otmp = await which_armor(game.u.usteed, 1048576);
        if (((otmp) && (otmp).otyp == (SADDLE) && (otmp).cursed)) {
            return (-4);
        }
    }
    if ((game.u.uprops[BLINDED].intrinsic & 16777215) > 1 && !(game.u.uprops[BLINDED].intrinsic & ~16777215) && (!game.u.uswallow || !attacktype_fordmg(game.u.ustuck.data, 11, 11))) {
        return (-5);
    }
    /* deafness isn't its own trouble; healing magic cures deafness
       when it cures blindness, so do the same with trouble repair */
    if ((game.u.uprops[DEAF].intrinsic & 16777215) > 1) {
        return (-5);
    }
    for (i = 0; i < A_MAX; i++) {
        if ((game.u.acurr.a[i]) < (game.u.amax.a[i])) {
            return (-6);
        }
    }
    if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) && !game.u.usteed) {
        return (-7);
    }
    if (game.u.uhs >= HUNGRY) {
        return (-8);
    }
    if (game.u.uprops[STUNNED].intrinsic & 16777215) {
        return (-9);
    }
    if (game.u.uprops[CONFUSION].intrinsic & 16777215) {
        return (-10);
    }
    if (game.u.uprops[HALLUC].intrinsic & 16777215) {
        return (-11);
    }
    return 0;
}
/* select an item for TROUBLE_CURSED_ITEMS */
export function worst_cursed_item() {
    let otmp = null;
    if (near_capacity() >= HVY_ENCUMBER) {
        /* if strained or worse, check for loadstone first */
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if (((otmp) && (otmp).otyp == (LOADSTONE) && (otmp).cursed)) {
                return otmp;
            }
        }
    }
    if (welded(game.uwep) && (game.uright || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big))) {
        /* weapon takes precedence if it is interfering
       with taking off a ring or putting on a shield */
        /* gloves come next, due to rings */
        /* active secondary weapon even though it isn't welded */
        otmp = game.uwep;
    } else if (game.uarmg && game.uarmg.cursed) {
        /* then shield due to two handed weapons and spells */
        otmp = game.uarmg;
    } else if (game.uarms && game.uarms.cursed) {
        /* then cloak due to body armor */
        otmp = game.uarms;
    } else if (game.uarmc && game.uarmc.cursed) {
        otmp = game.uarmc;
    } else if (game.uarm && game.uarm.cursed) {
        /* if worn helmet of opposite alignment is making you an adherent
       of the current god, he/she/it won't uncurse that for you */
        otmp = game.uarm;
    } else if (game.uarmh && game.uarmh.cursed && game.uarmh.otyp != HELM_OF_OPPOSITE_ALIGNMENT) {
        otmp = game.uarmh;
    } else if (game.uarmf && game.uarmf.cursed) {
        otmp = game.uarmf;
    } else if (game.uarmu && game.uarmu.cursed) {
        otmp = game.uarmu;
    } else if (game.uamul && game.uamul.cursed) {
        otmp = game.uamul;
    } else if (game.uleft && game.uleft.cursed) {
        otmp = game.uleft;
    } else if (game.uright && game.uright.cursed) {
        otmp = game.uright;
    } else if (game.ublindf && game.ublindf.cursed) {
        /* must be non-blinding lenses */
        /* if weapon wasn't handled above, do it now */
        otmp = game.ublindf;
    } else if (welded(game.uwep)) {
        otmp = game.uwep;
    } else if (game.uswapwep && game.uswapwep.cursed && game.u.twoweap) {
        /* all worn items ought to be handled by now */
        otmp = game.uswapwep;
    } else {
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if (!otmp.cursed) {
                continue;
            }
            if (otmp.otyp == LOADSTONE || confers_luck(otmp)) {
                break;
            }
        }
    }
    return otmp;
}
export async function fix_curse_trouble(otmp, what) {
    if (!otmp) {
        await impossible("fix_curse_trouble: nothing to uncurse.");
        /* too old; don't give undead or unicorn bonus or penalty */
        return;
    }
    if (otmp == game.uarmg && game.u.uprops[GLIB].intrinsic) {
        make_glib(0);
        await Your("%s are no longer slippery.", gloves_simple_name(game.uarmg));
        if (!otmp.cursed) {
            return;
        }
    }
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (otmp == game.ublindf && (game.u.uprops[BLINDED].extrinsic && !(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)))) {
        await pline("%s %s.", what ? what : await Yobjnam2(otmp, "softly glow"), hcolor(c_color_names.c_amber));
        game.iflags.last_msg = PLNMSG_OBJ_GLOWS;
        otmp.bknown = !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic));
    }
    await uncurse(otmp);
    update_inventory();
}
const __fix_worst_trouble_leftglow = "Your left ring softly glows";
const __fix_worst_trouble_rightglow = "Your right ring softly glows";
export async function fix_worst_trouble(trouble) {
    let i = 0;
    let maxhp = 0;
    let otmp = null;
    let what = null;
    switch (trouble) {
        case 14:
            await make_stoned(0, "You feel more limber.", 0, null);
            break;
        case 13:
            await make_slimed(0, "The slime disappears.");
            break;
        case 12:
            if (game.uamul && game.uamul.otyp == AMULET_OF_STRANGULATION) {
                await Your("amulet vanishes!");
                await useup(game.uamul);
            }
            await You("can breathe again.");
            game.u.uprops[STRANGLED].intrinsic = 0;
            game.disp.botl = (1);
            break;
        case 11:
            if (!await safe_teleds(0)) {
                await reset_utrap((1));
            }
            await rescued_from_terrain(DISSOLVED);
            break;
        case 9:
            ;
        case (-8):
            await Your("%s feels content.", await body_part(STOMACH));
            await init_uhunger();
            game.disp.botl = (1);
            break;
        case 10:
            await You_feel("better.");
            await make_sick(0, null, (0), 3);
            break;
        case 8:
            await region_safety();
            break;
        case 7:
            await You_feel("much better.");
            if ((game.u.umonnum != game.u.umonster)) {
                /* teleport should always succeed, but if not, just untrap them */
                /* temporarily lost strength recovery now handled by init_uhunger() */
                /* stinking cloud, with hero vulnerable to HP loss */
                /* "fix all troubles" will keep trying if hero has
           5 or less hit points, so make sure they're always
           boosted to be more than that */
                maxhp = game.u.mhmax + rnd(5);
                setuhpmax(((maxhp) > (5 + 1) ? (maxhp) : (5 + 1)), (0));
                game.u.mh = game.u.mhmax;
            }
            maxhp = game.u.uhpmax;
            if (maxhp < game.u.ulevel * 5 + 11) {
                maxhp += rnd(5);
            }
            /* True: update u.uhpmax even if currently poly'd */
            setuhpmax(((maxhp) > (5 + 1) ? (maxhp) : (5 + 1)), (1));
            /* setuhpmax() will do this when u.uhp is higher
                           * than u.uhpmax; prayer also does this if lower */
            game.u.uhp = game.u.uhpmax;
            game.disp.botl = (1);
            break;
        case 5:
            await You_feel("%sstronger.", ((game.u.amax.a[A_STR]) - (game.u.acurr.a[A_STR]) > 6) ? "much " : "");
            (game.u.acurr.a[A_STR]) = (game.u.amax.a[A_STR]);
            game.disp.botl = (1);
            if (game.u.uprops[FIXED_ABIL].extrinsic) {
                if ((otmp = await stuck_ring(game.uleft, RIN_SUSTAIN_ABILITY)) != null) {
                    /* override Fixed_abil; uncurse that if feasible */
                    if (otmp == game.uleft) {
                        what = __fix_worst_trouble_leftglow;
                    }
                } else if ((otmp = await stuck_ring(game.uright, RIN_SUSTAIN_ABILITY)) != null) {
                    if (otmp == game.uright) {
                        what = __fix_worst_trouble_rightglow;
                    }
                }
                if (otmp) {
                    await fix_curse_trouble(otmp, what);
                    break;
                }
            }
            break;
        case 4:
            if (await safe_teleds(0)) {
                await Your("surroundings change.");
            } else {
                /* safe_teleds() couldn't find a safe place; perhaps the
               level is completely full.  As a last resort, confer
               intrinsic wall/rock-phazing.  Hero might get stuck
               again fairly soon....
               Without something like this, fix_all_troubles can get
               stuck in an infinite loop trying to fix STUCK_IN_WALL
               and repeatedly failing. */
                set_itimeout({ get value() { return game.u.uprops[PASSES_WALLS].intrinsic; }, set value(_v) { game.u.uprops[PASSES_WALLS].intrinsic = _v; } }, (d(4, 4) + 4));
                await You_feel("much slimmer.");
            }
            break;
        case 3:
            if (((game.uarmf) && (game.uarmf).otyp == (LEVITATION_BOOTS) && (game.uarmf).cursed)) {
                otmp = game.uarmf;
            } else if ((otmp = await stuck_ring(game.uleft, RIN_LEVITATION)) != null) {
                if (otmp == game.uleft) {
                    what = __fix_worst_trouble_leftglow;
                }
            } else if ((otmp = await stuck_ring(game.uright, RIN_LEVITATION)) != null) {
                if (otmp == game.uright) {
                    what = __fix_worst_trouble_rightglow;
                }
            }
            await fix_curse_trouble(otmp, what);
            break;
        case 2:
            if (welded(game.uwep)) {
                otmp = game.uwep;
                await fix_curse_trouble(otmp, what);
                break;
            }
            if ((game.u.umonnum != game.u.umonster) && (((game.youmonst.data).mflags1 & 8192) != 0)) {
                if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                    await Your("shape becomes uncertain.");
                    await rehumanize();
                } else if ((otmp = unchanger()) != null && otmp.cursed) {
                    await fix_curse_trouble(otmp, what);
                    break;
                }
            }
            if ((((game.youmonst.data).mflags1 & 8192) != 0) || !freehand()) {
                await impossible("fix_worst_trouble: couldn't cure hands.");
            }
            break;
        case 1:
            otmp = game.ublindf;
            await fix_curse_trouble(otmp, what);
            break;
        case 6:
            await you_unwere((1));
            break;
        case (-1):
            await Your("chain disappears.");
            if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
                await buried_ball_to_freedom();
            } else {
                await unpunish();
            }
            break;
        case (-2):
            if (((game.uarmg) && (game.uarmg).otyp == (GAUNTLETS_OF_FUMBLING) && (game.uarmg).cursed)) {
                otmp = game.uarmg;
            } else if (((game.uarmf) && (game.uarmf).otyp == (FUMBLE_BOOTS) && (game.uarmf).cursed)) {
                otmp = game.uarmf;
            }
            await fix_curse_trouble(otmp, what);
            break;
        case (-3):
            otmp = worst_cursed_item();
            if (otmp == game.uright) {
                what = __fix_worst_trouble_rightglow;
            } else if (otmp == game.uleft) {
                what = __fix_worst_trouble_leftglow;
            }
            await fix_curse_trouble(otmp, what);
            break;
        case (-6):
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                await pline("There's a tiger in your tank.");
            } else {
                await You_feel("in good health again.");
            }
            for (i = 0; i < A_MAX; i++) {
                if ((game.u.acurr.a[i]) < (game.u.amax.a[i])) {
                    (game.u.acurr.a[i]) = (game.u.amax.a[i]);
                    /* before potential message */
                    game.disp.botl = (1);
                }
            }
            await encumber_msg();
            break;
        case (-5):
{
                /* handles deafness as well as blindness */
                let msgbuf = '';
                let eyes = await body_part(EYE);
                let cure_deaf = (game.u.uprops[DEAF].intrinsic & 16777215) ? (1) : (0);
                msgbuf = '';
                if ((game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)) {
                    if ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) != 1) {
                        eyes = await makeplural(eyes);
                    }
                    msgbuf = sprintf(msgbuf, "Your %s %s better", eyes, await vtense(eyes, "feel"));
                    /* superfluous; if hero was blinded we'd be handling trouble
               rather than issuing a pat-on-head */
                    game.u.ucreamed = 0;
                    await make_blinded(0, (0));
                }
                if (cure_deaf) {
                    await make_deaf(0, (0));
                    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                        msgbuf = __nh_buf_append(msgbuf, sprintf('', "%s can hear again", !msgbuf ? "You" : " and you"));
                    }
                }
                if (msgbuf) {
                    await pline("%s.", msgbuf);
                }
                break;
            }
        case (-7):
            await heal_legs(0);
            break;
        case (-9):
            await make_stunned(0, (1));
            break;
        case (-10):
            await make_confused(0, (1));
            break;
        case (-11):
            await pline("Looks like you are back in Kansas.");
            await make_hallucinated(0, (0), 0);
            break;
        case (-4):
            otmp = await which_armor(game.u.usteed, 1048576);
            /* if you've been true to your god you can't die while you pray */
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("%s %s.", await Yobjnam2(otmp, "softly glow"), hcolor(c_color_names.c_amber));
                set_bknown(otmp, 1);
            }
            await uncurse(otmp);
            break;
    }
}
/* "I am sometimes shocked by... the nuns who never take a bath without
 * wearing a bathrobe all the time.  When asked why, since no man can see them,
 * they reply 'Oh, but you forget the good God'.  Apparently they conceive of
 * the Deity as a Peeping Tom, whose omnipotence enables Him to see through
 * bathroom walls, but who is foiled by bathrobes." --Bertrand Russell, 1943
 * Divine wrath, dungeon walls, and armor follow the same principle.
 */
export async function god_zaps_you(resp_god) {
    if (game.u.uswallow) {
        await pline("Suddenly a bolt of lightning comes down at you from the heavens!");
        await pline("It strikes %s!", await mon_nam(game.u.ustuck));
        if (!await Resists_Elem(game.u.ustuck, SHOCK_RES)) {
            await pline("%s fries to a crisp!", await Monnam(game.u.ustuck));
            await xkilled(game.u.ustuck, 1 | 4);
        } else {
            await pline("%s seems unaffected.", await Monnam(game.u.ustuck));
        }
    } else {
        await pline("Suddenly, a bolt of lightning strikes you!");
        if ((game.u.uprops[REFLECTING].intrinsic || game.u.uprops[REFLECTING].extrinsic)) {
            await shieldeff(game.u.ux, game.u.uy);
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("For some reason you're unaffected.");
            } else {
                await ureflects("%s reflects from your %s.", "It");
            }
            monstseesu(M_SEEN_REFL);
        } else if ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) {
            await shieldeff(game.u.ux, game.u.uy);
            await pline("It seems not to affect you.");
            monstseesu(M_SEEN_ELEC);
            monstunseesu(M_SEEN_REFL);
        } else {
            await fry_by_god(resp_god, (0));
            monstunseesu(M_SEEN_REFL | M_SEEN_ELEC);
        }
    }
    await pline("%s is not deterred...", await align_gname(resp_god));
    if (game.u.uswallow) {
        await pline("A wide-angle disintegration beam aimed at you hits %s!", await mon_nam(game.u.ustuck));
        if (!await Resists_Elem(game.u.ustuck, DISINT_RES)) {
            await pline("%s disintegrates into a pile of dust!", await Monnam(game.u.ustuck));
            await xkilled(game.u.ustuck, 1 | 2 | 4);
        } else {
            await pline("%s seems unaffected.", await Monnam(game.u.ustuck));
        }
    } else {
        await pline("A wide-angle disintegration beam hits you!");
        /* disintegrate shield and body armor before disintegrating
         * the impudent mortal, like black dragon breath -3.
         */
        if (game.uarms && !(game.u.uprops[REFLECTING].extrinsic & 8) && !(game.u.uprops[DISINT_RES].extrinsic & 8)) {
            await disintegrate_arm(game.uarms);
        }
        if (game.uarmc && !(game.u.uprops[REFLECTING].extrinsic & 2) && !(game.u.uprops[DISINT_RES].extrinsic & 2)) {
            await disintegrate_arm(game.uarmc);
        }
        if (game.uarm && !(game.u.uprops[REFLECTING].extrinsic & 1) && !(game.u.uprops[DISINT_RES].extrinsic & 1) && !game.uarmc) {
            await disintegrate_arm(game.uarm);
        }
        if (game.uarmu && !game.uarm && !game.uarmc) {
            await disintegrate_arm(game.uarmu);
        }
        if (!(game.u.uprops[DISINT_RES].intrinsic || game.u.uprops[DISINT_RES].extrinsic)) {
            await fry_by_god(resp_god, (1));
            monstunseesu(M_SEEN_DISINT);
        } else {
            await You("bask in its %s glow for a minute...", c_color_names.c_black);
            await godvoice(resp_god, "I believe it not!");
            monstseesu(M_SEEN_DISINT);
        }
        if ((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) || (((((game.dungeon_topology.d_sanctum_level)).dlevel || ((game.dungeon_topology.d_sanctum_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sanctum_level))))) {
            ;
            await verbalize("Thou cannot escape my wrath, mortal!");
            await summon_minion(resp_god, (0));
            await summon_minion(resp_god, (0));
            await summon_minion(resp_god, (0));
            ;
            await verbalize("Destroy %s, my servants!", (genders[game.flags.female ? 1 : 0].him));
        }
    }
}
export async function fry_by_god(resp_god, via_disintegration) {
    await You("%s!", !via_disintegration ? "fry to a crisp" : "disintegrate into a pile of dust");
    game.killer.format = 1;
    game.killer.name = sprintf(game.killer.name, "the wrath of %s", await align_gname(resp_god));
    await done(DIED);
}
export async function angrygods(resp_god) {
    let maxanger = 0;
    let new_ublesscnt = 0;
    if (In_hell(game.u.uz)) {
        resp_god = (-128);
    }
    game.u.ublessed = 0;
    if (resp_god != game.u.ualign.type) {
        maxanger = Math.trunc(game.u.ualign.record / 2) + ((game.u.uluck + game.u.moreluck) > 0 ? Math.trunc(-(game.u.uluck + game.u.moreluck) / 3) : -(game.u.uluck + game.u.moreluck));
    /* changed from tmp = u.ugangr + abs (u.uluck) -- rph */
    /* added test for alignment diff -dlc */
    } else {
        maxanger = 3 * game.u.ugangr + (((game.u.uluck + game.u.moreluck) > 0 || game.u.ualign.record >= 4) ? Math.trunc(-(game.u.uluck + game.u.moreluck) / 3) : -(game.u.uluck + game.u.moreluck));
    }
    if (maxanger < 1) {
        maxanger = 1;
    } else if (maxanger > 15) {
        maxanger = 15;
    }
    switch (rn2(maxanger)) {
        case 0:
        case 1:
            await You_feel("that %s is %s.", await align_gname(resp_god), (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "bummed" : "displeased");
            break;
        case 2:
        case 3:
            await godvoice(resp_god, null);
            await pline("\"Thou %s, %s.\"", ((game.u.ualign.record < 0) && resp_god == game.u.ualign.type) ? "hast strayed from the path" : "art arrogant", game.youmonst.data.mlet == S_HUMAN ? "mortal" : "creature");
            ;
            await verbalize("Thou must relearn thy lessons!");
            await adjattrib(A_WIS, -1, (0));
            await losexp(null);
            break;
        case 6:
            if (!(game.uball != null)) {
                await gods_angry(resp_god);
                await punish(null);
                break;
            }
            ;
        case 4:
        case 5:
            await gods_angry(resp_god);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                await pline("%s glow surrounds you.", await An(hcolor(c_color_names.c_black)));
            }
            if (rn2(2) || !await attrcurse()) {
                await rndcurse();
            }
            break;
        case 7:
        case 8:
            await godvoice(resp_god, null);
            ;
            await verbalize("Thou durst %s me?", (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) && (((((((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7) == 0) ? (-128) : (((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7) == 4) ? 1 : (((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7)) - 2))) != resp_god)) ? "scorn" : "call upon");
            await pline("\"Then die, %s!\"", (game.youmonst.data.mlet == S_HUMAN) ? "mortal" : "creature");
            await summon_minion(resp_god, (0));
            break;
        default:
            await gods_angry(resp_god);
            await god_zaps_you(resp_god);
            break;
    }
    /* even though this might not be in response to prayer, set pray timer */
    new_ublesscnt = rnz(300);
    if (new_ublesscnt > game.u.ublesscnt) {
        game.u.ublesscnt = new_ublesscnt;
    }
    return;
}
/* helper to print "str appears at your feet", or appropriate */
export async function at_your_feet(str) {
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        str = c_common_strings.c_Something;
    }
    if (game.u.uswallow) {
        await pline("%s %s into %s %s.", str, await vtense(str, "drop"), s_suffix(await mon_nam(game.u.ustuck)), await mbodypart(game.u.ustuck, STOMACH));
    } else {
        await pline("%s %s %s your %s!", str, await vtense(str, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "land" : "appear"), ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) ? "beneath" : "at", await makeplural(await body_part(FOOT)));
    }
}
export async function gcrownu() {
    let obj = null;
    let what = null;
    let already_exists = 0;
    let in_hand = 0;
    let class_gift = 0;
    game.u.uprops[SEE_INVIS].intrinsic |= 67108864;
    game.u.uprops[FIRE_RES].intrinsic |= 67108864;
    game.u.uprops[COLD_RES].intrinsic |= 67108864;
    game.u.uprops[SHOCK_RES].intrinsic |= 67108864;
    game.u.uprops[SLEEP_RES].intrinsic |= 67108864;
    game.u.uprops[POISON_RES].intrinsic |= 67108864;
    await godvoice(game.u.ualign.type, null);
    class_gift = STRANGE_OBJECT;
    if ((game.urole.mnum == (PM_WIZARD)) && !is_art(game.uwep, ART_VORPAL_BLADE) && !is_art(game.uwep, ART_STORMBRINGER) && !carrying(SPE_FINGER_OF_DEATH)) {
        /* 3.3.[01] had this in the A_NEUTRAL case,
       preventing chaotic wizards from receiving a spellbook */
        class_gift = SPE_FINGER_OF_DEATH;
    } else if ((game.urole.mnum == (PM_MONK)) && (!game.uwep || !game.uwep.oartifact) && !carrying(SPE_RESTORE_ABILITY)) {
        /* monks rarely wield a weapon */
        class_gift = SPE_RESTORE_ABILITY;
    }
    obj = ((game.uwep) && ((game.uwep).oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE))) ? game.uwep : null;
    already_exists = in_hand = (0);
    switch (game.u.ualign.type) {
        case 1:
            game.u.uevent.uhand_of_elbereth = 1;
            ;
            await verbalize("I crown thee...  The Hand of Elbereth!");
            livelog_printf(8, "was crowned \"The Hand of Elbereth\" by %s", await u_gname());
            break;
        case 0:
            game.u.uevent.uhand_of_elbereth = 2;
            in_hand = is_art(game.uwep, ART_VORPAL_BLADE);
            already_exists = exist_artifact(LONG_SWORD, artiname(ART_VORPAL_BLADE));
            ;
            await verbalize("Thou shalt be my Envoy of Balance!");
            livelog_printf(8, "became %s Envoy of Balance", s_suffix(await u_gname()));
            break;
        case (-1):
            game.u.uevent.uhand_of_elbereth = 3;
            in_hand = is_art(game.uwep, ART_STORMBRINGER);
            already_exists = exist_artifact(RUNESWORD, artiname(ART_STORMBRINGER));
            what = (((already_exists && !in_hand) || class_gift != STRANGE_OBJECT) ? "take lives" : "steal souls");
            ;
            await verbalize("Thou art chosen to %s for My Glory!", what);
            livelog_printf(8, "was chosen to %s for the Glory of %s", what, await u_gname());
            break;
    }
    if (game.objects[class_gift].oc_class == SPBOOK_CLASS) {
        let bbuf = '';
        obj = await mksobj(class_gift, (1), (0));
        bbuf = strcpy(bbuf, await actualoname(obj));
        await bless(obj);
        obj.bknown = 1;
        await observe_object(obj);
        await at_your_feet(upstart(await ansimpleoname(obj)));
        await dropy(obj);
        game.u.ugifts++;
        /* not an artifact, but treat like one for this situation;
           classify as a spoiler in case player hasn't IDed the book yet */
        livelog_printf(8 | 64 | 8192, "was bestowed with %s", bbuf);
        /* when getting a new book for known spell, enhance
           currently wielded weapon rather than the book */
        if (known_spell(class_gift) != spe_Unknown && ((game.uwep) && ((game.uwep).oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)))) {
            obj = game.uwep;
        }
    }
    switch (game.u.ualign.type) {
        case 1:
            if (class_gift != STRANGE_OBJECT) {
                ;
            } else if (obj && obj.otyp == LONG_SWORD && !obj.oartifact) {
                let lbuf = '';
                lbuf = strcpy(lbuf, await simpleonames(obj));
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await Your("sword shines brightly for a moment.");
                }
                obj = await oname(obj, artiname(ART_EXCALIBUR), 8 | 256);
                if (is_art(obj, ART_EXCALIBUR)) {
                    game.u.ugifts++;
                    livelog_printf(8 | 64, "had %s wielded %s transformed into %s", (genders[game.flags.female ? 1 : 0].his), lbuf, artiname(ART_EXCALIBUR));
                }
            }
            /* acquire Excalibur's skill regardless of weapon or gift */
            /* acquire Vorpal Blade's skill regardless of weapon or gift */
            unrestrict_weapon_skill(P_LONG_SWORD);
            if (is_art(obj, ART_EXCALIBUR)) {
                await discover_artifact(ART_EXCALIBUR);
            }
            break;
        case 0:
            if (class_gift != STRANGE_OBJECT) {
                ;
            } else if (obj && in_hand) {
                await Your("%s goes snicker-snack!", await xname(obj));
                await observe_object(obj);
            } else if (!already_exists) {
                obj = await mksobj(LONG_SWORD, (0), (0));
                obj = await oname(obj, artiname(ART_VORPAL_BLADE), 8 | 256);
                obj.spe = 1;
                await at_your_feet("A sword");
                await dropy(obj);
                game.u.ugifts++;
                livelog_printf(8 | 64, "was bestowed with %s", artiname(ART_VORPAL_BLADE));
            }
            unrestrict_weapon_skill(P_LONG_SWORD);
            if (is_art(obj, ART_VORPAL_BLADE)) {
                await discover_artifact(ART_VORPAL_BLADE);
            }
            break;
        case (-1):
{
                let swordbuf = '';
                swordbuf = sprintf(swordbuf, "%s sword", hcolor(c_color_names.c_black));
                if (class_gift != STRANGE_OBJECT) {
                    ;
                } else if (obj && in_hand) {
                    await Your("%s hums ominously!", swordbuf);
                    await observe_object(obj);
                } else if (!already_exists) {
                    obj = await mksobj(RUNESWORD, (0), (0));
                    obj = await oname(obj, artiname(ART_STORMBRINGER), 8 | 256);
                    obj.spe = 1;
                    await at_your_feet(await An(swordbuf));
                    await dropy(obj);
                    game.u.ugifts++;
                    livelog_printf(8 | 64, "was bestowed with %s", artiname(ART_STORMBRINGER));
                }
                /* acquire Stormbringer's skill regardless of weapon or gift */
                unrestrict_weapon_skill(P_BROAD_SWORD);
                if (is_art(obj, ART_STORMBRINGER)) {
                    await discover_artifact(ART_STORMBRINGER);
                }
                break;
            }
        default:
            obj = null;
            break;
    }
    if (((obj) && ((obj).oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE)))) {
        await bless(obj);
        obj.oeroded = obj.oeroded2 = 0;
        obj.oerodeproof = (1);
        obj.bknown = obj.rknown = 1;
        if (obj.spe < 1) {
            obj.spe = 1;
        }
        /* acquire skill in this weapon */
        unrestrict_weapon_skill(weapon_type(obj));
    } else if (class_gift == STRANGE_OBJECT) {
        await You_feel("unworthy.");
    }
    update_inventory();
    await add_weapon_skill(1);
    return;
}
export async function give_spell() {
    let otmp = null;
    let spe_let = 0;
    let spe_knowledge = 0;
    let trycnt = game.u.ulevel + 1;
    otmp = await mkobj((0 - SPBOOK_CLASS), (1));
    while (--trycnt > 0) {
        if (otmp.otyp != SPE_BLANK_PAPER) {
            if (known_spell(otmp.otyp) <= spe_Unknown && !(game.u.weapon_skills[spell_skilltype(otmp.otyp)].skill == P_ISRESTRICTED)) {
                break;
            }
        } else {
            /* blank paper is acceptable if not discovered yet or
               if hero has a magic marker to write something on it
               (doesn't matter if marker is out of charges); it will
               become discovered (below) without needing to be read */
            if (!game.objects[SPE_BLANK_PAPER].oc_name_known || carrying(MAGIC_MARKER)) {
                break;
            }
        }
        otmp.otyp = rnd_class(game.bases[SPBOOK_CLASS], SPE_BLANK_PAPER);
    }
    if (otmp.otyp != SPE_BLANK_PAPER && !rn2(4) && (spe_knowledge = known_spell(otmp.otyp)) != spe_Fresh) {
        if ((spe_let = await force_learn_spell(otmp.otyp)) != 0) {
            /* forgotten or not yet known */
            /*
     * 25% chance of learning the spell directly instead of
     * receiving the book for it, unless it's already well known.
     * The chance is not influenced by whether hero is illiterate.
     */
            /* force_learn_spell() should only return '\0' if the book
           is blank paper or the spell is known and has retention
           of spe_Fresh, so no 'else' case is needed here */
            /* for spellbook class, OBJ_NAME() yields the name of
               the spell rather than "spellbook of <spell-name>" */
            let spe_name = (game.obj_descr[(game.objects[otmp.otyp]).oc_name_idx].oc_name);
            if (spe_knowledge == spe_Unknown) {
                await pline("Divine knowledge of %s fills your mind!  Spell '%c'.", spe_name, spe_let);
            } else {
                await Your("knowledge of spell '%c' - %s is %s.", spe_let, spe_name, (spe_knowledge == spe_Forgotten) ? "restored" : "refreshed");
            }
        }
        await obfree(otmp, null);
    } else {
        await observe_object(otmp);
        /* discovering blank paper will make it less likely to
           be given again; small chance to arbitrarily discover
           some other book type without having to read it first */
        if (otmp.otyp == SPE_BLANK_PAPER || !rn2(100)) {
            await discover_object((otmp.otyp), (1), (1), (1));
        }
        await bless(otmp);
        await at_your_feet(upstart(await ansimpleoname(otmp)));
        await place_object(otmp, game.u.ux, game.u.uy);
        await newsym(game.u.ux, game.u.uy);
    }
    return;
}
const __pleased_msg = "\"and thus I grant thee the gift of %s!\"";
export async function pleased(g_align) {
    let trouble = await in_trouble();
    let pat_on_head = 0;
    let kick_on_butt = 0;
    await You_feel("that %s is %s.", await align_gname(g_align), (game.u.ualign.record >= 14) ? (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "pleased as punch" : "well-pleased" : (game.u.ualign.record >= 4) ? (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "ticklish" : "pleased" : (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "full" : "satisfied");
    if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) && game.p_aligntyp != game.u.ualign.type) {
        adjalign(-1);
        return;
    } else if (game.u.ualign.record < 2 && trouble <= 0) {
        adjalign(1);
    }
    if (!trouble && game.u.ualign.record >= 14) {
        /*
     * Depending on your luck & align level, the god you prayed to will:
     *  - fix your worst problem if it's major;
     *  - fix all your major problems;
     *  - fix your worst problem if it's minor;
     *  - fix all of your problems;
     *  - do you a gratuitous favor.
     *
     * If you make it to the last category, you roll randomly again
     * to see what they do for you.
     *
     * If your luck is at least 0, then you are guaranteed rescued from
     * your worst major problem.
     */
        /* if hero was in trouble, but got better, no special favor */
        if (game.p_trouble == 0) {
            pat_on_head = 1;
        }
    } else {
        let action = 0;
        let prayer_luck = 0;
        let tryct = 0;
        /* Negative luck is normally impossible here (can_pray() forces
           prayer failure in that situation), but it's possible for
           Luck to drop during the period of prayer occupation and
           become negative by the time we get here.  [Reported case
           was lawful character whose stinking cloud caused a delayed
           killing of a peaceful human, triggering the "murderer"
           penalty while successful prayer was in progress.  It could
           also happen due to inconvenient timing on Friday 13th, but
           the magnitude there (-1) isn't big enough to cause trouble.]
           We don't bother remembering start-of-prayer luck, just make
           sure it's at least -1 so that Luck+2 is big enough to avoid
           a divide by zero crash when generating a random number.  */
        /* => (prayer_luck + 2 > 0) */
        prayer_luck = (((game.u.uluck + game.u.moreluck)) > (-1) ? ((game.u.uluck + game.u.moreluck)) : (-1));
        action = (rn2(prayer_luck + (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) ? 3 + ((game.level.locations[game.u.ux][game.u.uy].flags & 8) != 0) : 2)) + (1));
        if (!((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR)) {
            action = ((action) < (3) ? (action) : (3));
        }
        if (game.u.ualign.record < 4) {
            action = (game.u.ualign.record > 0 || !rnl(2)) ? 1 : 0;
        }
        switch (((action) < (5) ? (action) : (5))) {
            case 5:
                pat_on_head = 1;
                ;
            case 4:
                do {
                    await fix_worst_trouble(trouble);
                } while ((trouble = await in_trouble()) != 0);
                break;
            case 3:
                await fix_worst_trouble(trouble);
                ;
            case 2:
                while ((trouble = await in_trouble()) > 0 && (++tryct < 10)) {
                    await fix_worst_trouble(trouble);
                }
                break;
            case 1:
                if (trouble > 0) {
                    await fix_worst_trouble(trouble);
                }
                break;
            /* note: can't get pat_on_head unless all troubles have just been
       fixed or there were no troubles to begin with; hallucination
       won't be in effect so special handling for it is superfluous */
            case 0:
                break;
        }
    }
    if (pat_on_head) {
        switch (rn2(((game.u.uluck + game.u.moreluck) + 6) >> 1)) {
            case 0:
                break;
            case 1:
                if (game.uwep && (welded(game.uwep) || game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE))) {
                    let repair_buf = '';
                    repair_buf = '';
                    if (game.uwep.oeroded || game.uwep.oeroded2) {
                        repair_buf = sprintf(repair_buf, " and %s now as good as new", await otense(game.uwep, "are"));
                    }
                    if (game.uwep.cursed) {
                        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            await pline("%s %s%s.", await Yobjnam2(game.uwep, "softly glow"), hcolor(c_color_names.c_amber), repair_buf);
                            game.iflags.last_msg = PLNMSG_OBJ_GLOWS;
                        } else {
                            await You_feel("the power of %s over %s.", await u_gname(), await yname(game.uwep));
                        }
                        await uncurse(game.uwep);
                        /* ok to bypass set_bknown() */
                        game.uwep.bknown = 1;
                        repair_buf = '';
                    } else if (!game.uwep.blessed) {
                        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            await pline("%s with %s aura%s.", await Yobjnam2(game.uwep, "softly glow"), await an(hcolor(c_color_names.c_light_blue)), repair_buf);
                            game.iflags.last_msg = PLNMSG_OBJ_GLOWS;
                        } else {
                            await You_feel("the blessing of %s over %s.", await u_gname(), await yname(game.uwep));
                        }
                        await bless(game.uwep);
                        game.uwep.bknown = 1;
                        repair_buf = '';
                    }
                    if (game.uwep.oeroded || game.uwep.oeroded2) {
                        /* fix any rust/burn/rot damage, but don't protect
                   against future damage */
                        game.uwep.oeroded = game.uwep.oeroded2 = 0;
                        if (repair_buf) {
                            await pline("%s as good as new!", await Yobjnam2(game.uwep, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "look"));
                        }
                    }
                    update_inventory();
                }
                break;
            case 3:
                if (!game.u.uevent.uopened_dbridge && !game.u.uevent.gehennom_entered) {
                    if (game.u.uevent.uheard_tune < 1) {
                        await godvoice(g_align, null);
                        ;
                        await verbalize("Hark, %s!", (((game.youmonst.data).mflags2 & 8) != 0) ? "mortal" : "creature");
                        ;
                        await verbalize("To enter the castle, thou must play the right tune!");
                        game.u.uevent.uheard_tune++;
                        break;
                    } else if (game.u.uevent.uheard_tune < 2) {
                        ;
                        await You_hear("a divine music...");
                        await pline("It sounds like:  \"%s\".", game.tune);
                        game.u.uevent.uheard_tune++;
                        await record_achievement(ACH_TUNE);
                        break;
                    }
                }
                ;
            case 2:
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await You("are surrounded by %s glow.", await an(hcolor(c_color_names.c_golden)));
                }
                if (game.u.ulevel < game.u.ulevelmax) {
                    /* if any levels have been lost (and not yet regained),
               treat this effect like blessed full healing */
                    game.u.ulevelmax -= 1;
                    await pluslvl((0));
                } else {
                    game.u.uhpmax += 5;
                    if (game.u.uhpmax > game.u.uhppeak) {
                        game.u.uhppeak = game.u.uhpmax;
                    }
                    if ((game.u.umonnum != game.u.umonster)) {
                        game.u.mhmax += 5;
                    }
                }
                game.u.uhp = game.u.uhpmax;
                if ((game.u.umonnum != game.u.umonster)) {
                    game.u.mh = game.u.mhmax;
                }
                if ((game.u.acurr.a[A_STR]) < (game.u.amax.a[A_STR])) {
                    (game.u.acurr.a[A_STR]) = (game.u.amax.a[A_STR]);
                    game.disp.botl = (1);
                    await encumber_msg();
                }
                if (game.u.uhunger < 900) {
                    await init_uhunger();
                }
                /* luck couldn't have been negative at start of prayer because
               the prayer would have failed, but might have been decremented
               due to a timed event (delayed death of peaceful monster hit
               by hero-created stinking cloud) during the praying interval */
                if (game.u.uluck < 0) {
                    game.u.uluck = 0;
                }
                game.u.ucreamed = 0;
                await make_blinded(0, (1));
                game.disp.botl = (1);
                break;
            case 4:
{
                    let otmp = null;
                    let nextobj = null;
                    let any = 0;
                    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await You_feel("the power of %s.", await u_gname());
                    } else {
                        await You("are surrounded by %s aura.", await an(hcolor(c_color_names.c_light_blue)));
                    }
                    for (otmp = game.invent; otmp; otmp = nextobj) {
                        nextobj = otmp.nobj;
                        if (otmp.cursed && (otmp != game.uarmh || game.uarmh.otyp != HELM_OF_OPPOSITE_ALIGNMENT)) {
                            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                                await pline("%s %s.", await Yobjnam2(otmp, "softly glow"), hcolor(c_color_names.c_amber));
                                game.iflags.last_msg = PLNMSG_OBJ_GLOWS;
                                otmp.bknown = 1;
                                ++any;
                            }
                            await uncurse(otmp);
                        }
                    }
                    if (any) {
                        update_inventory();
                    }
                    break;
                }
            case 5:
{
                    await godvoice(game.u.ualign.type, "Thou hast pleased me with thy progress,");
                    if (!(game.u.uprops[TELEPAT].intrinsic & (67108864 | 33554432 | 16777216))) {
                        game.u.uprops[TELEPAT].intrinsic |= 67108864;
                        await pline(__pleased_msg, "Telepathy");
                        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            await see_monsters();
                        }
                    } else if (!(game.u.uprops[FAST].intrinsic & (67108864 | 33554432 | 16777216))) {
                        game.u.uprops[FAST].intrinsic |= 67108864;
                        await pline(__pleased_msg, "Speed");
                    } else if (!(game.u.uprops[STEALTH].intrinsic & (67108864 | 33554432 | 16777216))) {
                        game.u.uprops[STEALTH].intrinsic |= 67108864;
                        await pline(__pleased_msg, "Stealth");
                    } else {
                        if (!(game.u.uprops[PROTECTION].intrinsic & (67108864 | 33554432 | 16777216))) {
                            game.u.uprops[PROTECTION].intrinsic |= 67108864;
                            if (!game.u.ublessed) {
                                game.u.ublessed = (rn2(3) + (2));
                            }
                        } else {
                            game.u.ublessed++;
                        }
                        await pline(__pleased_msg, "my protection");
                    }
                    ;
                    await verbalize("Use it wisely in my name!");
                    break;
                }
            case 7:
            case 8:
                if (game.u.ualign.record >= 20 && !game.u.uevent.uhand_of_elbereth) {
                    await gcrownu();
                    break;
                }
                ;
            case 6:
                await give_spell();
                break;
            default:
                await impossible("Confused deity!");
                break;
        }
    }
    game.u.ublesscnt = rnz(350);
    kick_on_butt = game.u.uevent.udemigod ? 1 : 0;
    if (game.u.uevent.uhand_of_elbereth) {
        kick_on_butt++;
    }
    if (kick_on_butt) {
        game.u.ublesscnt += kick_on_butt * rnz(1000);
    }
    if (game.moves > 100000) {
        /* Avoid games that go into infinite loops of copy-pasted commands
       with no human interaction; this is a DoS vector against the
       computer running NetHack.  Once the turn counter is over 100000,
       every additional 100 turns increases the prayer timeout by 1,
       thus eventually hunger prayers will fail and some other source
       of nutrition will be required.  The increase gets throttled if
       it ever reaches 32K so that configurations using 16-bit ints are
       still viable. */
        let incr = Math.trunc((game.moves - 100000) / 100);
        let largest_ublesscnt_incr = (32767 - game.u.ublesscnt);
        if (incr > largest_ublesscnt_incr) {
            incr = largest_ublesscnt_incr;
        }
        game.u.ublesscnt += incr;
    }
    return;
}
/* either blesses or curses water on the altar,
 * returns true if it found any water here.
 */
export async function water_prayer(bless_water) {
    let otmp = null;
    let changed = 0;
    let other = (0);
    let bc_known = !(((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)));
    for (otmp = game.level.objects[game.u.ux][game.u.uy]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.otyp == POT_WATER && (bless_water ? !otmp.blessed : !otmp.cursed)) {
            /* turn water into (un)holy water */
            otmp.blessed = bless_water;
            otmp.cursed = !bless_water;
            otmp.bknown = bc_known;
            changed += otmp.quan;
        } else if (otmp.oclass == POTION_CLASS) {
            other = (1);
        }
    }
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && changed) {
        await pline("%s potion%s on the altar glow%s %s for a moment.", ((other && changed > 1) ? "Some of the" : (other ? "One of the" : "The")), ((other || changed > 1) ? "s" : ""), (changed > 1 ? "" : "s"), (bless_water ? hcolor(c_color_names.c_light_blue) : hcolor(c_color_names.c_black)));
    }
    return (changed > 0);
}
export async function godvoice(g_align, words) {
    let quot = "";
    if (words) {
        quot = "\"";
    } else {
        words = "";
    }
    await pline_The("voice of %s %s: %s%s%s", await align_gname(g_align), godvoices[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)))], quot, words, quot);
}
export async function gods_angry(g_align) {
    await godvoice(g_align, "Thou hast angered me.");
}
/* The g_align god is upset with you. */
export async function gods_upset(g_align) {
    if (g_align == game.u.ualign.type) {
        game.u.ugangr++;
    } else if (game.u.ugangr) {
        game.u.ugangr--;
    }
    await angrygods(g_align);
}
export async function consume_offering(otmp) {
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        switch (rn2(3)) {
            case 0:
                await Your("sacrifice sprouts wings and a propeller and roars away!");
                break;
            case 1:
                await Your("sacrifice puffs up, swelling bigger and bigger, and pops!");
                break;
            case 2:
                await Your("sacrifice collapses into a cloud of dancing particles and fades away!");
                break;
        }
    } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && game.u.ualign.type == 1) {
        await Your("sacrifice disappears!");
    } else {
        await Your("sacrifice is consumed in a %s!", (game.u.ualign.type == 1) ? "flash of light" : (game.u.ualign.type == 0) ? "plume of smoke" : "burst of flame");
    }
    if (((otmp).where == 3)) {
        await useup(otmp);
    } else {
        await useupf(otmp, 1);
    }
    await exercise(A_WIS, (1));
}
/* feedback when attempting to offer the Amulet on a "low altar" (not one of
   the high altars in the temples on the Astral Plane or Moloch's Sanctum) */
export async function offer_too_soon(altaralign) {
    if (altaralign == (-128) && In_hell(game.u.uz)) {
        await gods_upset((-128));
        return;
    }
    await You_feel("%s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "homesick" : (altaralign == game.u.ualign.type) ? "an urge to return to the surface" : "ashamed");
}
export async function desecrate_altar(highaltar, altaralign) {
    let gvbuf = '';
    if (altaralign == game.u.ualign.type) {
        /*
     * REAL BAD NEWS!!! High altars cannot be converted.  Even an attempt
     * gets the god who owns it truly pissed off.  The same effect for
     * deliberately destroying a normal altar.
     */
        /* if you did this to your own altar, your god will hold a grudge... */
        adjalign(-20);
        game.u.ugangr += 5;
    }
    await You_feel("the air around you grow charged...");
    await pline("Suddenly, you realize that %s has noticed you...", await align_gname(altaralign));
    gvbuf = sprintf(gvbuf, "So, mortal!  You dare desecrate my %s!", highaltar ? "High Temple" : "altar");
    await godvoice(altaralign, gvbuf);
    await god_zaps_you(altaralign);
}
/* offering the Amulet on a high altar (checked by caller) ends the game;
   we don't declare this 'NORETURN' because done() can return (if called
   with some reasons other than ASCENDED and ESCAPED) */
const __offer_real_amulet_cloud_of_smoke = "A cloud of %s smoke surrounds you...";
export async function offer_real_amulet(otmp, altaralign) {
    if (game.uamul == otmp) {
        await Amulet_off();
    }
    if (((otmp).where == 3)) {
        await useup(otmp);
    } else {
        await useupf(otmp, 1);
    }
    await You("offer the Amulet of Yendor to %s...", await a_gname());
    if (altaralign == (-128)) {
        /* Moloch's high altar at the bottom of Gehennom. */
        if (game.u.ualign.record > -99) {
            game.u.ualign.record = -99;
        }
        await pline("An invisible choir chants, and you are bathed in darkness...");
        await pline("%s shrugs and retains dominion over %s,", Moloch, await u_gname());
        await pline("then mercilessly snuffs out your life.");
        game.killer.name = sprintf(game.killer.name, "%s indifference", s_suffix(Moloch));
        game.killer.format = 1;
        await done(DIED);
        await pline("%s snarls and tries again...", Moloch);
        await fry_by_god((-128), (1));
        await pline(__offer_real_amulet_cloud_of_smoke, hcolor(c_color_names.c_black));
        await done(ESCAPED);
    } else if (game.u.ualign.type != altaralign) {
        /* And the opposing team picks you up and carries you off
           on their shoulders. */
        adjalign(-99);
        await pline("%s accepts your gift, and gains dominion over %s...", await a_gname(), await u_gname());
        await pline("%s is enraged...", await u_gname());
        await pline("Fortunately, %s permits you to live...", await a_gname());
        await pline(__offer_real_amulet_cloud_of_smoke, hcolor(c_color_names.c_orange));
        await done(ESCAPED);
    } else {
        /* You've won the game!  Feedback-wise, it's a bit of a let down. */
        game.u.uevent.ascended = 1;
        adjalign(10);
        await pline("An invisible choir sings, and you are bathed in radiance...");
        await godvoice(altaralign, "Mortal, thou hast done well!");
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        ;
        await verbalize("In return for thy service, I grant thee the gift of Immortality!");
        await You("ascend to the status of Demigod%s...", game.flags.female ? "dess" : "");
        await done(ASCENDED);
    }
}
export async function offer_negative_valued(highaltar, altaralign) {
    if (altaralign != game.u.ualign.type && highaltar) {
        await desecrate_altar(highaltar, altaralign);
    } else {
        await gods_upset(altaralign);
    }
}
export async function offer_fake_amulet(otmp, highaltar, altaralign) {
    if (!highaltar && !otmp.known) {
        await offer_too_soon(altaralign);
        return;
    }
    ;
    await You_hear("a nearby thunderclap.");
    if (!otmp.known) {
        await You("realize you have made a %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "boo-boo" : "mistake");
        otmp.known = (1);
        change_luck(-1);
    } else {
        /* don't you dare try to fool the gods */
        if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await pline("Oh, no.");
        }
        change_luck(-3);
        adjalign(-1);
        game.u.ugangr += 3;
        await offer_negative_valued(highaltar, altaralign);
    }
}
/* possibly convert an altar's alignment or the hero's alignment */
export async function offer_different_alignment_altar(otmp, altaralign) {
    if ((game.u.ualign.record < 0) || (altaralign == (-128) && In_hell(game.u.uz))) {
        if (game.u.ualignbase[0] == game.u.ualignbase[1] && altaralign != (-128)) {
            await You("have a strong feeling that %s is angry...", await u_gname());
            await consume_offering(otmp);
            await pline("%s accepts your allegiance.", await a_gname());
            await uchangealign(altaralign, A_CG_CONVERT);
            /* Beware, Conversion is costly */
            change_luck(-3);
            game.u.ublesscnt += 300;
        } else {
            game.u.ugangr += 3;
            adjalign(-5);
            await pline("%s rejects your sacrifice!", await a_gname());
            await godvoice(altaralign, "Suffer, infidel!");
            change_luck(-5);
            await adjattrib(A_WIS, -2, (1));
            if (!In_hell(game.u.uz)) {
                await angrygods(game.u.ualign.type);
            }
        }
    } else {
        await consume_offering(otmp);
        await You("sense a conflict between %s and %s.", await u_gname(), await a_gname());
        if (rn2(8 + game.u.ulevel) > 5) {
            let pri = null;
            let shrine = 0;
            await You_feel("the power of %s increase.", await u_gname());
            await exercise(A_WIS, (1));
            change_luck(1);
            shrine = ((game.level.locations[game.u.ux][game.u.uy].flags & 8) != 0);
            game.level.locations[game.u.ux][game.u.uy].flags = ((((game.u.ualign.type) == (-128)) ? 0 : ((game.u.ualign.type) == 1) ? 4 : ((game.u.ualign.type) + 2)));
            if (shrine) {
                game.level.locations[game.u.ux][game.u.uy].flags |= 8;
            }
            await newsym(game.u.ux, game.u.uy);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline_The("altar glows %s.", hcolor((game.u.ualign.type == 1) ? c_color_names.c_white : game.u.ualign.type ? c_color_names.c_black : "gray"));
            }
            if (rnl(game.u.ulevel) > 6 && game.u.ualign.record > 0 && rnd(game.u.ualign.record) > Math.trunc((3 * (10 + (Math.trunc(game.moves / 200)))) / 4)) {
                await summon_minion(altaralign, (1));
            }
            /* anger priest; test handles bones files */
            if ((pri = findpriest(temple_occupied(game.u.urooms))) && !p_coaligned(pri)) {
                await angry_priest();
            }
        } else {
            await pline("Unluckily, you feel the power of %s decrease.", await u_gname());
            change_luck(-1);
            await exercise(A_WIS, (0));
            if (rnl(game.u.ulevel) > 6 && game.u.ualign.record > 0 && rnd(game.u.ualign.record) > Math.trunc((7 * (10 + (Math.trunc(game.moves / 200)))) / 8)) {
                await summon_minion(altaralign, (1));
            }
        }
    }
}
export async function sacrifice_your_race(otmp, highaltar, altaralign) {
    let pm = 0;
    if ((((game.youmonst.data).mflags2 & 256) != 0)) {
        await You("find the idea very satisfying.");
        await exercise(A_WIS, (1));
    } else if (game.u.ualign.type != (-1)) {
        await pline("You'll regret this infamous offense!");
        await exercise(A_WIS, (0));
    }
    if (highaltar && (altaralign != (-1) || game.u.ualign.type != (-1))) {
        await desecrate_altar(highaltar, altaralign);
        return;
    } else if (altaralign != (-1) && altaralign != (-128)) {
        await pline_The("altar is stained with %s blood.", game.urace.adj);
        game.level.locations[game.u.ux][game.u.uy].flags = 1;
        await newsym(game.u.ux, game.u.uy);
        await angry_priest();
    } else {
        let dmon = null;
        let demonless_msg = null;
        if (altaralign == (-1) && game.u.ualign.type != (-1)) {
            await pline("The blood floods the altar, which vanishes in %s cloud!", await an(hcolor(c_color_names.c_black)));
            game.level.locations[game.u.ux][game.u.uy].typ = ROOM;
            game.level.locations[game.u.ux][game.u.uy].flags = 0;
            await newsym(game.u.ux, game.u.uy);
            await angry_priest();
            demonless_msg = "cloud dissipates";
        } else {
            await pline_The("blood covers the altar!");
            change_luck(altaralign == (-128) ? -2 : 2);
            demonless_msg = "blood coagulates";
        }
        if ((pm = await dlord(altaralign)) != NON_PM && (dmon = await makemon(game.mons[pm], game.u.ux, game.u.uy, 131072)) != null) {
            let dbuf = '';
            dbuf = strcpy(dbuf, await a_monnam(dmon));
            if (!strncmpi((dbuf), ("it"), -1)) {
                dbuf = strcpy(dbuf, "something dreadful");
            } else {
                dmon.mstrategy &= ~2147483648;
            }
            await You("have summoned %s!", dbuf);
            if (sgn(game.u.ualign.type) == sgn(dmon.data.maligntyp)) {
                dmon.mpeaceful = (1);
            }
            await You("are terrified, and unable to move.");
            nomul(-3);
            game.multi_reason = "being terrified of a demon";
            game.nomovemsg = null;
        } else {
            await pline_The("%s.", demonless_msg);
        }
    }
    if (game.u.ualign.type != (-1)) {
        adjalign(-5);
        game.u.ugangr += 3;
        await adjattrib(A_WIS, -1, (1));
        if (!In_hell(game.u.uz)) {
            await angrygods(game.u.ualign.type);
        }
        change_luck(-5);
    } else {
        adjalign(5);
    }
    if (((otmp).where == 3)) {
        await useup(otmp);
    } else {
        await useupf(otmp, 1);
    }
}
export async function bestow_artifact(max_giftvalue) {
    let nartifacts = nartifact_exist();
    let do_bestow = game.u.ulevel > 2 && game.u.uluck >= 0;
    if (do_bestow) {
        if (game.flags.debug) {
            do_bestow = await yn_function("Gift an artifact?", ynchars, 110, (1)) == 121;
        /* you were already in pretty good standing */
        /* The player can gain an artifact */
        /* The chance goes down as the number of artifacts goes up */
        } else {
            do_bestow = !rn2(6 + (2 * game.u.ugifts * nartifacts));
        }
    }
    if (do_bestow) {
        let otmp = null;
        otmp = await mk_artifact(null, ((((((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7) == 0) ? (-128) : (((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7) == 4) ? 1 : (((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7)) - 2))), max_giftvalue, (1));
        if (otmp) {
            let buf = '';
            await artifact_origin(otmp, 8 | 256);
            if (otmp.spe < 0) {
                otmp.spe = 0;
            }
            if (otmp.cursed) {
                await uncurse(otmp);
            }
            otmp.oerodeproof = (1);
            buf = strcpy(buf, ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "a doodad" : ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "an object" : await ansimpleoname(otmp)));
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                buf = __nh_buf_append(buf, sprintf('', " named %s", await bare_artifactname(otmp)));
            }
            await at_your_feet(upstart(buf));
            await dropy(otmp);
            await godvoice(game.u.ualign.type, "Use my gift wisely!");
            game.u.ugifts++;
            game.u.ublesscnt = rnz(300 + (50 * nartifacts));
            await exercise(A_WIS, (1));
            livelog_printf(8 | 64, "was bestowed with %s by %s", artiname(otmp.oartifact), await align_gname(game.u.ualign.type));
            /* make sure we can use this weapon */
            unrestrict_weapon_skill(weapon_type(otmp));
            if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await observe_object(otmp);
                await discover_object((otmp.otyp), (1), (1), (1));
                await discover_artifact(otmp.oartifact);
            }
            return (1);
        }
    }
    return (0);
}
export async function sacrifice_value(otmp) {
    let value = 0;
    if (otmp.corpsenm == PM_ACID_BLOB || (game.moves <= await peek_at_iced_corpse_age(otmp) + 50)) {
        value = game.mons[otmp.corpsenm].difficulty + 1;
        if (otmp.oeaten) {
            value = await eaten_stat(value, otmp);
        }
    }
    return value;
}
/* the #offer command - sacrifice something to the gods */
export async function dosacrifice() {
    let otmp = null;
    let highaltar = 0;
    let altaralign = ((((((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7) == 0) ? (-128) : (((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7) == 4) ? 1 : (((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7)) - 2)));
    if (!((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) || game.u.uswallow) {
        await You("are not %s an altar.", (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) ? "over" : "on");
        return 0;
    } else if (game.u.uprops[CONFUSION].intrinsic || game.u.uprops[STUNNED].intrinsic) {
        await You("are too impaired to perform the rite.");
        return 0;
    }
    highaltar = (game.level.locations[game.u.ux][game.u.uy].flags & 16);
    otmp = await floorfood("sacrifice", 1);
    if (!otmp) {
        return 0;
    }
    if (otmp.otyp == AMULET_OF_YENDOR) {
        if (!highaltar) {
            await offer_too_soon(altaralign);
            return 1;
        } else {
            await offer_real_amulet(otmp, altaralign);
        }
    }
    if (otmp.otyp == FAKE_AMULET_OF_YENDOR) {
        await offer_fake_amulet(otmp, highaltar, altaralign);
        return 1;
    }
    if (otmp.otyp == CORPSE) {
        await offer_corpse(otmp, highaltar, altaralign);
        return 1;
    }
    await pline("%s", c_common_strings.c_nothing_happens);
    return 1;
}
export async function eval_offering(otmp, altaralign) {
    let ptr = null;
    let value = 0;
    value = await sacrifice_value(otmp);
    if (!value) {
        return 0;
    }
    ptr = game.mons[otmp.corpsenm];
    if ((((ptr).mflags2 & 2) != 0)) {
        /* Not demons--no demon corpses */
        /* most undead that leave a corpse yield 'human' (or other race)
           corpse so won't get here; the exception is wraith; give the
           bonus for wraith to chaotics too because they are sacrificing
           something valuable (unless hero refuses to eat such things) */
        if (game.u.ualign.type != (-1) || (ptr == game.mons[PM_WRAITH] && game.u.uconduct.unvegetarian)) {
            value += 1;
        }
    } else if (((ptr).mlet == S_UNICORN && (((ptr).mflags2 & 536870912) != 0))) {
        /* reaching this side of the 'or' means hero is chaotic */
        let unicalign = sgn(ptr.maligntyp);
        if (unicalign == altaralign) {
            await pline("Such an action is an insult to %s!", (unicalign == (-1)) ? "chaos" : unicalign ? "law" : "balance");
            await adjattrib(A_WIS, -1, (1));
            return -1;
        } else if (game.u.ualign.type == altaralign) {
            if (game.u.ualign.record < (10 + (Math.trunc(game.moves / 200)))) {
                await You_feel("appropriately %s.", align_str(game.u.ualign.type));
            } else {
                await You_feel("you are thoroughly on the right path.");
            }
            adjalign(5);
            /* Otherwise, unicorn's alignment is different from yours
             * and different from the altar's.  It's an ordinary (well,
             * with a bonus) sacrifice on a cross-aligned altar.
             */
            value += 3;
        } else if (unicalign == game.u.ualign.type) {
            /* When sacrificing unicorn of your alignment to altar not of
             * your alignment, your god gets angry and it's a conversion.
             */
            game.u.ualign.record = -1;
            value = 1;
        } else {
            value += 3;
        }
    }
    return value;
}
export async function offer_corpse(otmp, highaltar, altaralign) {
    let value = 0;
    let ptr = null;
    let mtmp = null;
    if (!game.u.uconduct.gnostic++) {
        livelog_printf(32, "rejected atheism by offering %s on an altar of %s", await corpse_xname(otmp, null, 8), await a_gname());
    }
    await feel_cockatrice(otmp, (1));
    if (await rider_corpse_revival(otmp, (0))) {
        return;
    }
    ptr = game.mons[otmp.corpsenm];
    if ((((ptr).mflags2 & game.urace.selfmask) != 0)) {
        await sacrifice_your_race(otmp, highaltar, altaralign);
        return;
    }
    if (((otmp).oextra && ((otmp).oextra.omonst)) && (mtmp = get_mtraits(otmp, (0))) != null && mtmp.mtame) {
        await pline("So this is how you repay loyalty?");
        adjalign(-3);
        game.u.uprops[AGGRAVATE_MONSTER].intrinsic |= 67108864;
        await offer_negative_valued(highaltar, altaralign);
        return;
    }
    value = await eval_offering(otmp, altaralign);
    if (value == 0) {
        await pline("%s", c_common_strings.c_nothing_happens);
        return;
    }
    if (value < 0) {
        await offer_negative_valued(highaltar, altaralign);
        return;
    }
    if (altaralign != game.u.ualign.type && highaltar) {
        await desecrate_altar(highaltar, altaralign);
        return;
    }
    if (game.u.ualign.type != altaralign) {
        await offer_different_alignment_altar(otmp, altaralign);
        return;
    }
    await consume_offering(otmp);
    if (game.u.ugangr) {
        /* OK, you get brownie points. */
        let saved_anger = game.u.ugangr;
        game.u.ugangr -= (Math.trunc((value * (game.u.ualign.type == (-1) ? 2 : 3)) / 24));
        if (game.u.ugangr < 0) {
            game.u.ugangr = 0;
        }
        if (game.u.ugangr != saved_anger) {
            if (game.u.ugangr) {
                await pline("%s seems %s.", await u_gname(), (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "groovy" : "slightly mollified");
                if (game.u.uluck < 0) {
                    change_luck(1);
                }
            } else {
                await pline("%s seems %s.", await u_gname(), (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "cosmic (not a new fact)" : "mollified");
                if (game.u.uluck < 0) {
                    game.u.uluck = 0;
                }
            }
        } else {
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                await pline_The("gods seem tall.");
            } else {
                await You("have a feeling of inadequacy.");
            }
        }
    } else if ((game.u.ualign.record < 0)) {
        if (value > 24) {
            value = 24;
        }
        if (value > -game.u.ualign.record) {
            value = -game.u.ualign.record;
        }
        adjalign(value);
        await You_feel("partially absolved.");
    } else if (game.u.ublesscnt > 0) {
        let saved_cnt = game.u.ublesscnt;
        game.u.ublesscnt -= (Math.trunc((value * (game.u.ualign.type == (-1) ? 500 : 300)) / 24));
        if (game.u.ublesscnt < 0) {
            game.u.ublesscnt = 0;
        }
        if (game.u.ublesscnt != saved_cnt) {
            if (game.u.ublesscnt) {
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    await You("realize that the gods are not like you and I.");
                } else {
                    await You("have a hopeful feeling.");
                }
                if (game.u.uluck < 0) {
                    change_luck(1);
                }
            } else {
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    await pline("Overall, there is a smell of fried onions.");
                } else {
                    await You("have a feeling of reconciliation.");
                }
                if (game.u.uluck < 0) {
                    game.u.uluck = 0;
                }
            }
        }
    } else {
        let orig_luck = 0;
        let luck_increase = 0;
        if (await bestow_artifact(value)) {
            return;
        }
        orig_luck = game.u.uluck;
        luck_increase = Math.trunc((value * 10) / (24 * 2));
        /* sacrificing can't increase non-bonus Luck to above the value of the
           sacrifice; this prevents players immediately maxing their Luck as
           soon as they find an altar and a few rations via sacrificing lots
           of low-valued corpses, which can unbalance the early game */
        if (orig_luck > value) {
            luck_increase = 0;
        } else if (orig_luck + luck_increase > value) {
            luck_increase = value - orig_luck;
        }
        change_luck(luck_increase);
        if (game.u.uluck < 0) {
            game.u.uluck = 0;
        }
        if (game.u.uluck != orig_luck) {
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await You("think %s brushed your %s.", c_common_strings.c_something, await body_part(FOOT));
            } else {
                await You((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "see crabgrass at your %s.  A funny thing in a dungeon." : "glimpse a four-leaf clover at your %s.", await makeplural(await body_part(FOOT)));
            }
        }
    }
}
/* determine prayer results in advance; also used for enlightenment */
/* false means no messages should be given */
export async function can_pray(praying) {
    let alignment = 0;
    game.p_aligntyp = ((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) ? ((((((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7) == 0) ? (-128) : (((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7) == 4) ? 1 : (((game.level.locations[game.u.ux][game.u.uy].flags & 7) & 7)) - 2))) : game.u.ualign.type;
    game.p_trouble = await in_trouble();
    if ((((game.youmonst.data).mflags2 & 256) != 0) && (game.p_aligntyp == 1 || game.p_aligntyp != 0)) {
        if (praying) {
            await pline_The("very idea of praying to a %s god is repugnant to you.", game.p_aligntyp ? "lawful" : "neutral");
        }
        return (0);
    }
    if (praying) {
        await You("begin praying to %s.", await align_gname(game.p_aligntyp));
    }
    if (game.u.ualign.type && game.u.ualign.type == -game.p_aligntyp) {
        alignment = -game.u.ualign.record;
    } else if (game.u.ualign.type != game.p_aligntyp) {
        alignment = Math.trunc(game.u.ualign.record / 2);
    /* Opposite alignment altar */
    /* Different alignment altar */
    } else {
        alignment = game.u.ualign.record;
    }
    if (game.p_aligntyp == (-128)) {
        game.p_type = -2;
    } else if ((game.p_trouble > 0) ? (game.u.ublesscnt > 200) : (game.p_trouble < 0) ? (game.u.ublesscnt > 100) : (game.u.ublesscnt > 0)) {
        game.p_type = 0;
    } else if ((game.u.uluck + game.u.moreluck) < 0 || game.u.ugangr || alignment < 0) {
        game.p_type = 1;
    } else {
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) && game.u.ualign.type != game.p_aligntyp) {
            game.p_type = 2;
        } else {
            game.p_type = 3;
        }
    }
    if ((((game.youmonst.data).mflags2 & 2) != 0) && !In_hell(game.u.uz) && (game.p_aligntyp == 1 || (game.p_aligntyp == 0 && !rn2(10)))) {
        game.p_type = -1;
    }
    /* Note:  when !praying, the random factor for neutrals makes the
       return value a non-deterministic approximation for enlightenment.
       This case should be uncommon enough to live with... */
    return !praying ? (game.p_type == 3 && !In_hell(game.u.uz)) : (1);
}
/* return TRUE if praying revived a pet corpse */
export async function pray_revive() {
    let otmp = null;
    for (otmp = game.level.objects[game.u.ux][game.u.uy]; otmp; otmp = otmp.v.v_nexthere) {
        if ((otmp.otyp == CORPSE || otmp.otyp == STATUE) && ((otmp).oextra && ((otmp).oextra.omonst)) && ((otmp).oextra.omonst).mtame && !((otmp).oextra.omonst).isminion) {
            break;
        }
    }
    if (!otmp) {
        return (0);
    }
    if (otmp.otyp == CORPSE) {
        return (await revive(otmp, (1)) != (null));
    } else {
        return (await animate_statue(otmp, game.u.ux, game.u.uy, 2, null) != (null));
    }
}
/* #pray command */
const __dopray_forcesuccess = "Force the gods to be pleased?";
export async function dopray() {
    let ok = 0;
    if (((game.flags.paranoia_bits & 32) != 0)) {
        ok = await paranoid_query(((game.flags.paranoia_bits & 1) != 0), "Are you sure you want to pray?");
        /* clear command recall buffer; otherwise ^A to repeat p(ray) would
           do so without confirmation (if 'ok') or do nothing (if '!ok') */
        /* declined the "are you sure?" confirmation */
        if (!ok) {
            return 0;
        }
    }
    if (!game.u.uconduct.gnostic++) {
        livelog_printf(32, "rejected atheism with a prayer");
    }
    if (!await can_pray((1))) {
        return 0;
    }
    if (game.flags.debug && game.p_type >= 0) {
        if (((game.flags.paranoia_bits & 32) != 0)) {
            /* breaking conduct should probably occur in can_pray() at
         * "You begin praying to %s", as demons who find praying repugnant
         * should not break conduct.  Also we can add more detail to the
         * livelog message as p_aligntyp will be known.
         */
            /* if we asked "are you sure?" above we suppressed the response
           from the do-again buffer, so need to suppress this response too;
           otherwise subsequent ^A would use this answer for "are you sure?"
           and bypass confirmation */
            let save_doagain = game.in_doagain;
            game.in_doagain = (0);
            ok = (await yn_function(__dopray_forcesuccess, ynchars, 110, (0)) == 121);
            game.in_doagain = save_doagain;
        } else {
            ok = (await yn_function(__dopray_forcesuccess, ynchars, 110, (1)) == 121);
        }
        if (ok) {
            game.u.ublesscnt = 0;
            if (game.u.uluck < 0) {
                game.u.uluck = 0;
            }
            if (game.u.ualign.record <= 0) {
                game.u.ualign.record = 1;
            }
            game.u.ugangr = 0;
            if (game.p_type < 2) {
                game.p_type = 3;
            }
        }
    }
    nomul(-3);
    game.multi_reason = "praying";
    game.nomovemsg = "You finish your prayer.";
    game.afternmv = prayer_done;
    if (game.p_type == 3 && !In_hell(game.u.uz)) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await You("are surrounded by a shimmering light.");
        }
        game.u.uinvulnerable = (1);
    }
    return 1;
}
/* M. Stephenson (1.0.3b) */
export async function prayer_done() {
    let alignment = game.p_aligntyp;
    game.u.uinvulnerable = (0);
    if (game.p_type == -2) {
        await You("%s diabolical laughter all around you...", !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "hear" : "intuit");
        await wake_nearby((0));
        adjalign(-2);
        await exercise(A_WIS, (0));
        if (!In_hell(game.u.uz)) {
            await pline("Nothing else happens.");
            return 1;
        }
    } else if (game.p_type == -1) {
        await godvoice(alignment, (alignment == 1) ? "Vile creature, thou durst call upon me?" : "Walk no more, perversion of nature!");
        await You_feel("like you are falling apart.");
        await rehumanize();
        await losehp(rnd(20), "residual undead turning effect", 0);
        await exercise(A_CON, (0));
        return 1;
    }
    if (In_hell(game.u.uz)) {
        await pline("Since you are in Gehennom, %s can't help you.", await align_gname(alignment));
        /* haltingly aligned is least likely to anger */
        if (game.u.ualign.record <= 0 || rnl(game.u.ualign.record)) {
            await angrygods(game.u.ualign.type);
        }
        return 0;
    }
    if (game.p_type == 0) {
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) && game.u.ualign.type != alignment) {
            await water_prayer((0));
        }
        game.u.ublesscnt += rnz(250);
        change_luck(-3);
        await gods_upset(game.u.ualign.type);
    } else if (game.p_type == 1) {
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) && game.u.ualign.type != alignment) {
            await water_prayer((0));
        }
        await angrygods(game.u.ualign.type);
    } else if (game.p_type == 2) {
        if (await water_prayer((0))) {
            /* attempted water prayer on a non-coaligned altar */
            game.u.ublesscnt += rnz(250);
            change_luck(-3);
            await gods_upset(game.u.ualign.type);
        } else {
            await pleased(alignment);
        }
    } else {
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR)) {
            await pray_revive();
            await water_prayer((1));
        }
        await pleased(alignment);
    }
    return 1;
}
/* iterable for undead turning by priest/knight */
export async function maybe_turn_mon_iter(mtmp) {
    /* 3.6.3: used to use cansee() here but the purpose is to prevent
       #turn operating through walls, not to require that the hero be
       able to see the target location */
    if (!((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) || dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) > game.turn_undead_range) {
        return;
    }
    if (!mtmp.mpeaceful && ((((mtmp.data).mflags2 & 2) != 0) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) || ((((mtmp.data).mflags2 & 256) != 0) && (game.u.ulevel > (Math.trunc(30 / 2)))))) {
        mtmp.msleeping = 0;
        if (game.u.uprops[CONFUSION].intrinsic) {
            if (!game.turn_undead_msg_cnt++) {
                await pline("Unfortunately, your voice falters.");
            }
            mtmp.mflee = 0;
            mtmp.mfrozen = 0;
            mtmp.mcanmove = 1;
        } else if (!await resist(mtmp, 0, 0, 1)) {
            let xlev = 6;
            switch (mtmp.data.mlet) {
                /* this is intentional, lichs are tougher
                   than zombies. */
                case S_LICH:
                    xlev += 2;
                    ;
                case S_GHOST:
                    xlev += 2;
                    ;
                case S_VAMPIRE:
                    xlev += 2;
                    ;
                case S_WRAITH:
                    xlev += 2;
                    ;
                case S_MUMMY:
                    xlev += 2;
                    ;
                case S_ZOMBIE:
                    if (game.u.ulevel >= xlev && !await resist(mtmp, 0, 0, 0)) {
                        if (game.u.ualign.type == (-1)) {
                            mtmp.mpeaceful = 1;
                            set_malign(mtmp);
                        } else {
                            await killed(mtmp);
                        }
                        break;
                    }
                    ;
                default:
                    await monflee(mtmp, 0, (0), (1));
                    break;
            }
        }
    }
}
/* #turn command */
export async function doturn() {
    /* Knights & Priest(esse)s only please */
    let Gname = null;
    if (!(game.urole.mnum == (PM_CLERIC)) && !(game.urole.mnum == (PM_KNIGHT))) {
        if (known_spell(SPE_TURN_UNDEAD)) {
            return await spelleffects(SPE_TURN_UNDEAD, (0), (0));
        }
        await You("don't know how to turn undead!");
        return 0;
    }
    if (!game.u.uconduct.gnostic++) {
        livelog_printf(32, "rejected atheism by turning undead");
    }
    Gname = await halu_gname(game.u.ualign.type);
    if (!can_chant(game.youmonst)) {
        await You("are %s upon %s to turn aside evilness.", game.u.uprops[STRANGLED].intrinsic ? "not able to call" : "incapable of calling", Gname);
        /* violates agnosticism due to intent; conduct tracking is not
           supposed to affect play but we make an exception here:  use a
           move if this is the first time agnostic conduct has been broken */
        return (game.u.uconduct.gnostic == 1) ? 1 : 0;
    }
    if ((game.u.ualign.type != (-1) && ((((game.youmonst.data).mflags2 & 256) != 0) || (((game.youmonst.data).mflags2 & 2) != 0) || ((game.youmonst).cham == PM_VAMPIRE || (game.youmonst).cham == PM_VAMPIRE_LEADER || (game.youmonst).cham == PM_VLAD_THE_IMPALER))) || game.u.ugangr > 6) {
        await pline("For some reason, %s seems to ignore you.", Gname);
        await aggravate();
        await exercise(A_WIS, (0));
        return 1;
    }
    if (In_hell(game.u.uz)) {
        await pline("Since you are in Gehennom, %s %s help you.", Gname, !strcmp(Gname, Moloch) ? "won't" : "can't");
        await aggravate();
        return 1;
    }
    await pline("Calling upon %s, you chant an arcane formula.", Gname);
    await exercise(A_WIS, (1));
    /* note: does not perform unturn_dead() on victims' inventories */
    game.turn_undead_range = 8 + (Math.trunc(game.u.ulevel / 5));
    game.turn_undead_range *= game.turn_undead_range;
    game.turn_undead_msg_cnt = 0;
    await iter_mons(maybe_turn_mon_iter);
    /*
     *  There is no detrimental effect on self for successful #turn
     *  while in demon or undead form.  That can only be done while
     *  chaotic oneself (see "For some reason" above) and chaotic
     *  turning only makes targets peaceful.
     *
     *  Paralysis duration probably ought to be based on the strength
     *  of turned creatures rather than on turner's level.
     *  Why doesn't this honor Free_action?  [Because being able to
     *  repeat #turn every turn would be too powerful.  Maybe instead
     *  of nomul(-N) we should add the equivalent of mon->mspec_used
     *  for the hero and refuse to #turn when it's non-zero?  Or have
     *  both and u.uspec_used only matters when Free_action prevents
     *  the brief paralysis?]
     */
    nomul(-(5 - (Math.trunc((game.u.ulevel - 1) / 6))));
    game.multi_reason = "trying to turn the monsters";
    game.nomovemsg = c_common_strings.c_You_can_move_again;
    return 1;
}
export function altarmask_at(x, y) {
    let res = 0;
    if (isok(x, y)) {
        let mon = (game.level.monsters[x][y]);
        if (mon && ((mon).m_ap_type & 7) == M_AP_FURNITURE && mon.mappearance == S_altar) {
            res = ((mon).mextra && ((mon).mextra.mcorpsenm) != NON_PM) ? ((mon).mextra.mcorpsenm) : 0;
        } else if (((game.level.locations[x][y].typ) == ALTAR)) {
            res = game.level.locations[x][y].flags;
        }
    }
    return res;
}
export async function a_gname() {
    return await a_gname_at(game.u.ux, game.u.uy);
}
/* returns the name of an altar's deity */
export async function a_gname_at(x, y) {
    if (!((game.level.locations[x][y].typ) == ALTAR)) {
        return null;
    }
    return await align_gname(((((((game.level.locations[x][y].flags & 7) & 7) == 0) ? (-128) : (((game.level.locations[x][y].flags & 7) & 7) == 4) ? 1 : (((game.level.locations[x][y].flags & 7) & 7)) - 2))));
}
/* returns the name of the hero's deity */
export async function u_gname() {
    return await align_gname(game.u.ualign.type);
}
export async function align_gname(alignment) {
    let gnam = null;
    switch (alignment) {
        case (-128):
            gnam = Moloch;
            break;
        case 1:
            gnam = game.urole.lgod;
            break;
        case 0:
            gnam = game.urole.ngod;
            break;
        case (-1):
            gnam = game.urole.cgod;
            break;
        default:
            await impossible("unknown alignment.");
            gnam = "someone";
            break;
    }
    if (__nh_char_at0(gnam) == 95) {
        (gnam = __nh_advance_str(gnam, 1));
    }
    return gnam;
}
const hallu_gods = ["the Flying Spaghetti Monster", "Eris", "the Martians", "Xom", "AnDoR dRaKoN", "the Central Bank of Yendor", "Tooth Fairy", "Om", "Yawgmoth", "Morgoth", "Cthulhu", "the Ori", "destiny", "your Friend the Computer"];
/* Church of the FSM */
/* Discordianism */
/* every science fiction ever */
/* Crawl */
/* ADOM */
/* economics */
/* real world(?) */
/* Discworld */
/* Magic: the Gathering */
/* LoTR */
/* Lovecraft */
/* Stargate */
/* why not? */
/* Paranoia */
/* hallucination handling for priest/minion names: select a random god
   iff character is hallucinating */
export async function halu_gname(alignment) {
    let gnam = null;
    let which = 0;
    if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        return await align_gname(alignment);
    }
    /* Some roles (Priest) don't have a pantheon unless we're playing as
       that role, so keep trying until we get a role which does have one.
       [If playing a Priest, the current pantheon will be twice as likely
       to get picked as any of the others.  That's not significant enough
       to bother dealing with.] */
    do {
        which = randrole((1));
    } while (!roles[which].lgod);
    switch (rn2_on_display_rng(9)) {
        case 0:
        case 1:
            gnam = roles[which].lgod;
            break;
        case 2:
        case 3:
            gnam = roles[which].ngod;
            break;
        case 4:
        case 5:
            gnam = roles[which].cgod;
            break;
        case 6:
        case 7:
            gnam = hallu_gods[rn2_on_display_rng((Math.trunc(14 /* sizeof(const char *const [14]) */ / 1 /* sizeof(const char *const) */)))];
            break;
        case 8:
            gnam = Moloch;
            break;
        default:
            await impossible("rn2 broken in halu_gname?!?");
    }
    if (!gnam) {
        await impossible("No random god name?");
        gnam = "your Friend the Computer";
    }
    if (__nh_char_at0(gnam) == 95) {
        (gnam = __nh_advance_str(gnam, 1));
    }
    return gnam;
}
/* deity's title */
export function align_gtitle(alignment) {
    let gnam = null;
    let result = "god";
    switch (alignment) {
        case 1:
            gnam = game.urole.lgod;
            break;
        case 0:
            gnam = game.urole.ngod;
            break;
        case (-1):
            gnam = game.urole.cgod;
            break;
        default:
            gnam = null;
            break;
    }
    if (gnam && __nh_char_at0(gnam) == 95) {
        result = "goddess";
    }
    return result;
}
export async function altar_wrath(x, y) {
    let altaralign = ((((((game.level.locations[x][y].flags & 7) & 7) == 0) ? (-128) : (((game.level.locations[x][y].flags & 7) & 7) == 4) ? 1 : (((game.level.locations[x][y].flags & 7) & 7)) - 2)));
    if (game.u.ualign.type == altaralign && game.u.ualign.record > -rn2(4)) {
        await godvoice(altaralign, "How darest thou desecrate my altar!");
        await adjattrib(A_WIS, -1, (0));
        game.u.ualign.record--;
    } else {
        await pline("%s %s%s:", !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "A voice (could it be" : "Despite your deafness, you seem to hear", await align_gname(altaralign), !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "?) whispers" : " say");
        ;
        await verbalize("Thou shalt pay, infidel!");
        /* higher luck is more likely to be reduced; as it approaches -5
           the chance to lose another point drops down, eventually to 0 */
        if ((game.u.uluck + game.u.moreluck) > -5 && rn2((game.u.uluck + game.u.moreluck) + 6)) {
            change_luck(rn2(20) ? -1 : -2);
        }
    }
}
/* assumes isok() at one space away, but not necessarily at two */
export function blocked_boulder(dx, dy) {
    let otmp = null;
    let nx = 0;
    let ny = 0;
    let count = 0;
    for (otmp = game.level.objects[game.u.ux + dx][game.u.uy + dy]; otmp; otmp = otmp.v.v_nexthere) {
        if (otmp.otyp == BOULDER) {
            count += otmp.quan;
        }
    }
    /* next spot beyond boulder(s) */
    nx = game.u.ux + 2 * dx , ny = game.u.uy + 2 * dy;
    switch (count) {
        case 0:
            return (0);
        case 1:
            break;
        case 2:
            if (is_pool_or_lava(nx, ny)) {
                break;
            }
            ;
        default:
            return (1);
    }
    /* can't push boulder diagonally in Sokoban */
    if (dx && dy && game.level.flags.sokoban_rules) {
        return (1);
    }
    if (!isok(nx, ny)) {
        return (1);
    }
    if (((game.level.locations[nx][ny].typ) < POOL)) {
        return (1);
    }
    if (sobj_at(BOULDER, nx, ny)) {
        return (1);
    }
    return (0);
}
/*pray.c*/
/* can't voluntarily dismount from a cursed saddle */
/* DISSOLVED: pending cause of death
                                          * if trouble didn't get cured */
/* no control, but works on no-teleport levels */
/* how else could you move between packed rocks or among
               lattice forming "solid" rock? */
/* "You return to {normal} form." */
/* otmp is an amulet of unchanging */
/* override Fixed_abil; ignore items which confer that */
/* Yup, you get experience.  It takes guts to successfully
             * pull off this trick on your god, anyway.
             * Other credit/blame applies (luck or alignment adjustments),
             * but not direct kill count (pacifist conduct).
             */
/* one more try for high altars */
/* [why isn't this using verbalize()?] */
/* barrier between you and the floor */
/* get book type before dropping (don't think that could destroy
           the book because we need to be on an altar in order to become
           crowned, but be paranoid about it) */
/* for livelog; "spellbook of <foo>"
                                         * even if hero doesn't know book */
/* enhance weapon regardless of alignment or artifact status */
/* opportunity knocked, but there was nobody home... */
/* lastly, confer an extra skill slot/credit beyond the
       up-to-29 you can get from gaining experience levels */
/* not yet known spells and forgotten spells are given preference over
       usable ones; also, try to grant spell that hero could gain skill in
       (even though being restricted doesn't prevent learning and casting) */
/* appending "spell 'a'" seems slightly silly but
                   is similar to "added to your repertoire, as 'a'"
                   and without any spellbook on hand a novice player
                   might not recognize that 'spe_name' is a spell */
/* don't use p_trouble, worst trouble may get fixed while praying */
/* what's your worst difficulty? */
/* your god blows you off, too bad */
/* only give this message if we didn't just bless
                       or uncurse (which has already given a message) */
/* takes 2 hints to get the music to enter the stronghold;
               skip if you've solved it via mastermind or destroyed the
               drawbridge (both set uopened_dbridge) or if you've already
               travelled past the Valley of the Dead (gehennom_entered) */
/* [see worst_cursed_item()] */
/* offering on an unaligned altar in Gehennom;
           hero has left Moloch's Sanctum (caller handles that)
           so is in the process of getting away with the Amulet;
           for any unaligned altar outside of Gehennom, give the
           "you feel ashamed" feedback for wrong alignment below */
/* if on track, give a big hint */
/* else headed towards celestial disgrace */
/* Throw everything we have at the player */
/* The final Test.  Did you win? */
/*[apparently shrug/snarl can be sensed without being seen]*/
/* life-saved (or declined to die in wizard/explore mode) */
/* declined to die in wizard or explore mode */
/* An unaligned altar in Gehennom will always elicit rejection. */
/* in case Invisible to self */
/* curse the lawful/neutral altar */
/* Human sacrifice on a chaotic or unaligned altar */
/* is equivalent to demon summoning */
/* either you're chaotic or altar is Moloch's or both */
/* mk_artifact() with NULL obj and a_align() arg can return NULL */
/* When same as altar, always a very bad action.
             */
/* When different from altar, and altar is same as yours,
             * it's a very good action.
             */
/*
     * Was based on nutritional value and aging behavior (< 50 moves).
     * Sacrificing a food ration got you max luck instantly, making the
     * gods as easy to please as an angry dog!
     *
     * Now only accepts corpses, based on the game's evaluation of their
     * toughness.  Human and pet sacrifice, as well as sacrificing unicorns
     * of your alignment, is strongly discouraged.
     */
/* Highest corpse value (besides Wiz) */
/* you're handling this corpse, even if it was killed upon the altar
     */
/* same race or former pet results apply even if the corpse is
       too old (value==0) */
/* mtmp is a temporary pointer to a tame monster's attributes,
             * not a real monster */
/* Sacrificing at an altar of a different alignment */
/* ok if chaotic or none (Moloch) */
/*
     * If ParanoidPray is set, confirm prayer to avoid accidental slips
     * of Alt+p.  If ParanoidConfirm is also set, require "yes" rather
     * than just "y" (will also require "no" to decline).
     */
/* set up p_type and p_alignment */
/* praying at an unaligned altar, not necessarily in Gehennom */
/* hero's god[dess] seems to be keeping his/her head down */
/* else use regular Inhell result below */
/* praying while poly'd into an undead creature while non-chaotic */
/* KMH -- Gods have mastery over unchanging */
/* no Half_physical_damage adjustment here */
/* Try to use the "turn undead" spell. */
/* [What about needing free hands (does #turn involve any gesturing)?] */
/* "evilness": "demons and undead" is too verbose and too precise */
/* not actually calling upon Moloch but use alternate
                 phrasing anyway if hallucinatory feedback says it's him */
/* possibly blocked depending on if it's pushable */
/* this is only approximate since multiple boulders might sink */
/* does its own isok() check */
/* still need Sokoban check below */
/* more than one boulder--blocked after they push the top one;
           don't force them to push it first to find out */
