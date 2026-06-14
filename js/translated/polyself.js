/* NetHack 5.0	polyself.c	$NHDT-Date: 1772101811 2026/02/26 02:30:11 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.227 $ */
/*      Copyright (C) 1987, 1988, 1989 by Ken Arromdee */
/* NetHack may be freely redistributed.  See license for details. */
/*
 * Polymorph self routine.
 *
 * Note:  the light source handling code assumes that gy.youmonst.m_id
 * always remains 1 and gy.youmonst.mx will always remain 0 when it handles
 * the case of the player polymorphed into a light-emitting monster.
 *
 * Transformation sequences:
 *              /-> polymon                 poly into monster form
 *    polyself =
 *              \-> newman -> polyman       fail to poly, get human form
 *
 *    rehumanize -> polyman                 return to original form
 *
 *    polymon (called directly)             usually golem petrification
 */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, strcat, strchr, strcmp, strcpy, strncmp, strstri } from '../c2js-runtime/string.js';
import { artifact_light, retouch_equipment } from './artifact.js';
import { acurr, adjabil, exercise, newhp, redist_attr, setuhpmax } from './attrib.js';
import { max_rank_sz, rank_of, status_initialize } from './botl.js';
import { getdir, yn_function } from './cmd.js';
import { is_pool, is_pool_or_lava } from './dbridge.js';
import { c_common_strings, ynchars } from './decl.js';
import { buried_ball_to_freedom, bury_objs } from './dig.js';
import { canseemon, newsym, see_monsters, sensemon, set_mimic_blocking } from './display.js';
import { canletgo, dropx } from './do.js';
import { Mgender, Monnam, Some_Monnam, hliquid, l_monnam, mon_nam, pmname, y_monnam } from './do_name.js';
import { Armor_gone, Blindf_off, Boots_off, Cloak_off, Gloves_off, Helmet_off, Shield_off, cancel_don, donning, find_ac } from './do_wear.js';
import { throwit } from './dothrow.js';
import { has_ceiling, on_level, surface } from './dungeon.js';
import { is_fainted, newuhs } from './eat.js';
import { dealloc_killer, done, find_delayed_killer } from './end.js';
import { newpw, rndexp } from './exper.js';
import { in_rooms, losehp, monst_to_any, nomul, rounddiv, spoteffects, unmul } from './hack.js';
import { dist2, mungspaces, s_suffix, strsubst } from './hacklib.js';
import { youhiding } from './insight.js';
import { update_inventory, useup } from './invent.js';
import { arti_light_radius, del_light_source, new_light_source } from './light.js';
import { golemhp, is_home_elemental, mkclass_poly } from './makemon.js';
import { expels } from './mhitu.js';
import { maybe_adjust_light, mksobj } from './mkobj.js';
import { egg_type_from_parent, hideunder, killed, set_ustuck, setmangry, valid_vampshiftform, wakeup } from './mon.js';
import { Resists_Elem, attacktype, attacktype_fordmg, breakarm, can_be_strangled, defended, dmgtype, dmgtype_fromattack, name_to_mon, name_to_monclass, num_horns, poly_when_stoned, resists_drli, set_mon_data, sliparm, sticks } from './mondata.js';
import { ACID_RES, ACID_VENOM, AIR, ALCHEMY_SMOCK, AMULET_OF_STRANGULATION, AMULET_OF_UNCHANGING, ANTIMAGIC, ANTI_MAGIC, ARM, ARROW_TRAP, A_CON, A_DEX, A_STR, A_WIS, BEAR_TRAP, BLACK_DRAGON_SCALES, BLACK_DRAGON_SCALE_MAIL, BLINDED, BLINDING_VENOM, BLND_RES, BLUE_DRAGON_SCALES, BLUE_DRAGON_SCALE_MAIL, CLOUD, COLD_RES, CONFUSION, CORPSE, DART_TRAP, DIED, DISINT_RES, DISMOUNT_POLY, DRAIN_RES, EYE, FEMALE, FINGER, FINGERTIP, FIRE_RES, FIRE_TRAP, FLYING, FOOT, FOUNTAIN, FREE_ACTION, GENOCIDED, GOLD_DRAGON_SCALES, GOLD_DRAGON_SCALE_MAIL, GRAY_DRAGON_SCALES, GRAY_DRAGON_SCALE_MAIL, GREEN_DRAGON_SCALES, GREEN_DRAGON_SCALE_MAIL, HAIR, HALLUC, HALLUC_RES, HAND, HANDED, HEAD, HOLE, INFRAVISION, INVIS, LANDMINE, LEATHER, LEG, LEVEL_TELEP, LEVITATION, LOW_PM, LS_MONSTER, MAGIC_PORTAL, MAGIC_TRAP, MALE, MS_SHRIEK, MUMMY_WRAPPING, M_AP_FURNITURE, M_AP_NOTHING, M_AP_OBJECT, NECK, NEUTRAL, NON_PM, NOSE, NO_PART, NUMMONS, ORANGE_DRAGON_SCALES, ORANGE_DRAGON_SCALE_MAIL, PASSES_WALLS, PIT, PM_AIR_ELEMENTAL, PM_ALIGNED_CLERIC, PM_AMOROUS_DEMON, PM_BABY_GOLD_DRAGON, PM_BABY_GRAY_DRAGON, PM_BABY_PURPLE_WORM, PM_BAT, PM_BLACK_DRAGON, PM_BLACK_LIGHT, PM_BLUE_DRAGON, PM_CAVE_SPIDER, PM_CHICKATRICE, PM_CLERIC, PM_COCKATRICE, PM_DWARF, PM_ELECTRIC_EEL, PM_ELF, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLESH_GOLEM, PM_FLOATING_EYE, PM_FOG_CLOUD, PM_GHOUL, PM_GIANT, PM_GIANT_BAT, PM_GIANT_EEL, PM_GIANT_SPIDER, PM_GNOME, PM_GOLD_DRAGON, PM_GRAY_DRAGON, PM_GREEN_DRAGON, PM_GREEN_ELF, PM_GREEN_SLIME, PM_GREMLIN, PM_GREY_ELF, PM_HILL_GIANT, PM_HILL_ORC, PM_HUMAN, PM_IRON_GOLEM, PM_JELLYFISH, PM_KI_RIN, PM_KRAKEN, PM_MANES, PM_MARILITH, PM_MASTER_MIND_FLAYER, PM_MASTODON, PM_MEDUSA, PM_MIND_FLAYER, PM_MORDOR_ORC, PM_MUMAK, PM_ORANGE_DRAGON, PM_ORC, PM_ORC_CAPTAIN, PM_OWLBEAR, PM_PURPLE_WORM, PM_RAVEN, PM_RED_DRAGON, PM_ROTHE, PM_SALAMANDER, PM_SHARK, PM_SHOCKING_SPHERE, PM_SHRIEKER, PM_SILVER_DRAGON, PM_STALKER, PM_STONE_GIANT, PM_STONE_GOLEM, PM_URUK_HAI, PM_VAMPIRE, PM_VAMPIRE_BAT, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WHITE_DRAGON, PM_WINGED_GARGOYLE, PM_WOLF, PM_YELLOW_DRAGON, POISON_RES, POLYMORPH, POLYMORPH_CONTROL, POLY_CONTROLLED, POLY_LOW_CTRL, POLY_MONSTER, POLY_REVERT, POLY_TRAP, PROT_FROM_SHAPE_CHANGERS, P_SABER, P_SHORT_SWORD, RED_DRAGON_SCALES, RED_DRAGON_SCALE_MAIL, REFLECTING, REGENERATION, ROCKTRAP, ROLLING_BOULDER_TRAP, RUBBER_HOSE, RUST_TRAP, SEE_INVIS, SHOCK_RES, SHOPBASE, SICK, SICK_RES, SILVER_DRAGON_SCALES, SILVER_DRAGON_SCALE_MAIL, SLEEP_RES, SLIMED, SLP_GAS_TRAP, SPECIAL_PM, SPIKED_PIT, SQKY_BOARD, STAIRS, STEALTH, STONED, STONE_RES, STONING, STRANGE_OBJECT, STRANGLED, STUNNED, SWIMMING, S_ANGEL, S_BLOB, S_CENTAUR, S_COCKATRICE, S_DOG, S_DRAGON, S_EEL, S_ELEMENTAL, S_EYE, S_FELINE, S_FUNGUS, S_GHOST, S_GIANT, S_GOLEM, S_HUMAN, S_JELLY, S_LEPRECHAUN, S_LIGHT, S_MIMIC, S_MUMMY, S_NYMPH, S_ORC, S_PUDDING, S_QUANTMECH, S_RODENT, S_SPIDER, S_UNICORN, S_VAMPIRE, S_VORTEX, S_WORM, S_YETI, S_ZOMBIE, TELEPAT, TELEPORT, TELEPORT_CONTROL, TELEP_TRAP, TOE, TRAPDOOR, TT_BEARTRAP, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, TT_PIT, TT_WEB, UNCHANGING, VIBRATING_SQUARE, WARN_OF_MON, WEAPON_CLASS, WEB, WHITE_DRAGON_SCALES, WHITE_DRAGON_SCALE_MAIL, YELLOW_DRAGON_SCALES, YELLOW_DRAGON_SCALE_MAIL } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { an, cloak_simple_name, cxname, helm_simple_name, makeplural, otense, simpleonames, the, the_unique_pm, vtense, yname } from './objnam.js';
import { encumber_msg } from './pickup.js';
import { There, livelog_printf, urgent_pline } from './pline.js';
import { make_blinded, make_glib, make_sick, make_slimed, make_stoned, set_itimeout } from './potion.js';
import { unpunish } from './read.js';
import { d, rn2, rnd, rnl } from './rnd.js';
import { character_race, genders } from './role.js';
import { add_damage } from './shk.js';
import { On_stairs } from './stairs.js';
import { can_ride, dismount_steed } from './steed.js';
import { end_burn, learn_egg_type } from './timeout.js';
import { deltrap, dotrap, feeltrap, ignite_items, instapetrify, maketrap, reset_utrap, selftouch, set_utrap, t_at, unconscious } from './trap.js';
import { weapon_descr } from './weapon.js';
import { counter_were, were_beastie, were_summon } from './were.js';
import { untwoweapon, uswapwepgone, uwepgone } from './wield.js';
import { getlin } from './windows.js';
import { racial_exception, setworn } from './worn.js';
import { destroy_items, ubreatheu, ubuzz } from './zap.js';

const no_longer_petrify_resistant = "No longer petrify-resistant, you";
/* update the gy.youmonst.data structure pointer and intrinsics */
export async function set_uasmon() {
    let mdat = game.mons[game.u.umonnum];
    let was_vampshifter = valid_vampshiftform(game.youmonst.cham, game.u.umonnum);
    set_mon_data(game.youmonst, mdat);
    game.youmonst.m_id = 1;
    if ((game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
        game.youmonst.cham = NON_PM;
    } else if (((game.youmonst.data).mlet == S_VAMPIRE)) {
        game.youmonst.cham = game.youmonst.mnum;
    } else if (!was_vampshifter) {
        game.youmonst.cham = NON_PM;
    }
    /* for save/restore since youmonst isn't */
    game.u.mcham = game.youmonst.cham;
    do {
        if (((game.youmonst.data.mresists & (1)) != 0)) {
            game.u.uprops[FIRE_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[FIRE_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((game.youmonst.data.mresists & (2)) != 0)) {
            game.u.uprops[COLD_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[COLD_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((game.youmonst.data.mresists & (4)) != 0)) {
            game.u.uprops[SLEEP_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[SLEEP_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((game.youmonst.data.mresists & (8)) != 0)) {
            game.u.uprops[DISINT_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[DISINT_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((game.youmonst.data.mresists & (16)) != 0)) {
            game.u.uprops[SHOCK_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[SHOCK_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((game.youmonst.data.mresists & (32)) != 0)) {
            game.u.uprops[POISON_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[POISON_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((game.youmonst.data.mresists & (64)) != 0)) {
            game.u.uprops[ACID_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[ACID_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((game.youmonst.data.mresists & (128)) != 0)) {
            game.u.uprops[STONE_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[STONE_RES].intrinsic &= ~268435456;
        }
    } while (0);
{
        /* resists_drli() takes wielded weapon into account; suppress it */
        let save_uwep = game.uwep;
        game.uwep = null;
        do {
            if (await resists_drli(game.youmonst)) {
                game.u.uprops[DRAIN_RES].intrinsic |= 268435456;
            } else {
                game.u.uprops[DRAIN_RES].intrinsic &= ~268435456;
            }
        } while (0);
        game.uwep = save_uwep;
    }
    do {
        if ((dmgtype(mdat, 1) || mdat == game.mons[PM_BABY_GRAY_DRAGON] || dmgtype(mdat, 242))) {
            game.u.uprops[ANTIMAGIC].intrinsic |= 268435456;
        } else {
            game.u.uprops[ANTIMAGIC].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((mdat.mlet == S_FUNGUS || mdat == game.mons[PM_GHOUL])) {
            game.u.uprops[SICK_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[SICK_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((mdat == game.mons[PM_STALKER] || ((mdat) == game.mons[PM_BAT] || (mdat) == game.mons[PM_GIANT_BAT] || (mdat) == game.mons[PM_VAMPIRE_BAT]))) {
            game.u.uprops[STUNNED].intrinsic |= 268435456;
        } else {
            game.u.uprops[STUNNED].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (dmgtype(mdat, 36)) {
            game.u.uprops[HALLUC_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[HALLUC_RES].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((((mdat).mflags1 & 16777216) != 0)) {
            game.u.uprops[SEE_INVIS].intrinsic |= 268435456;
        } else {
            game.u.uprops[SEE_INVIS].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((mdat) == game.mons[PM_FLOATING_EYE] || (mdat) == game.mons[PM_MIND_FLAYER] || (mdat) == game.mons[PM_MASTER_MIND_FLAYER])) {
            game.u.uprops[TELEPAT].intrinsic |= 268435456;
        } else {
            game.u.uprops[TELEPAT].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((((game.u.umonnum != game.u.umonster) ? mdat : game.mons[game.urace.mnum]).mflags3 & 256))) {
            game.u.uprops[INFRAVISION].intrinsic |= 268435456;
        } else {
            game.u.uprops[INFRAVISION].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((mdat) == game.mons[PM_STALKER] || (mdat) == game.mons[PM_BLACK_LIGHT])) {
            game.u.uprops[INVIS].intrinsic |= 268435456;
        } else {
            game.u.uprops[INVIS].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((((mdat).mflags1 & 33554432) != 0)) {
            game.u.uprops[TELEPORT].intrinsic |= 268435456;
        } else {
            game.u.uprops[TELEPORT].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((((mdat).mflags1 & 67108864) != 0)) {
            game.u.uprops[TELEPORT_CONTROL].intrinsic |= 268435456;
        } else {
            game.u.uprops[TELEPORT_CONTROL].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((mdat).mlet == S_EYE || (mdat).mlet == S_LIGHT)) {
            game.u.uprops[LEVITATION].intrinsic |= 268435456;
        } else {
            game.u.uprops[LEVITATION].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (((((mdat).mflags1 & 1) != 0) && !((mdat).mlet == S_EYE || (mdat).mlet == S_LIGHT))) {
            game.u.uprops[FLYING].intrinsic |= 268435456;
        } else {
            game.u.uprops[FLYING].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((((mdat).mflags1 & 2) != 0)) {
            game.u.uprops[SWIMMING].intrinsic |= 268435456;
        } else {
            game.u.uprops[SWIMMING].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((((mdat).mflags1 & 8) != 0)) {
            game.u.uprops[PASSES_WALLS].intrinsic |= 268435456;
        } else {
            game.u.uprops[PASSES_WALLS].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((((mdat).mflags1 & 8388608) != 0)) {
            game.u.uprops[REGENERATION].intrinsic |= 268435456;
        } else {
            game.u.uprops[REGENERATION].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((mdat == game.mons[PM_SILVER_DRAGON])) {
            game.u.uprops[REFLECTING].intrinsic |= 268435456;
        } else {
            game.u.uprops[REFLECTING].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if (!(((mdat).mflags1 & 4096) == 0)) {
            game.u.uprops[BLINDED].intrinsic |= 268435456;
        } else {
            game.u.uprops[BLINDED].intrinsic &= ~268435456;
        }
    } while (0);
    do {
        if ((dmgtype_fromattack(mdat, 11, 13) || dmgtype_fromattack(mdat, 11, 15))) {
            game.u.uprops[BLND_RES].intrinsic |= 268435456;
        } else {
            game.u.uprops[BLND_RES].intrinsic &= ~268435456;
        }
    } while (0);
    /* note that Infravision uses mons[race] rather than usual mons[role] */
    /* floating eye is the only 'floater'; it is also flagged as a 'flyer';
       suppress flying for it so that enlightenment doesn't confusingly
       show latent flight capability always blocked by levitation */
    /* [don't touch MAGICAL_BREATHING here; both Amphibious and Breathless
       key off of it but include different monster forms...] */
    /* whether the player is flying/floating depends on their steed,
       which won't be known during the restore process: but BFlying
       and BStealth should be set correctly already in that case, so
       there's nothing to do */
    if (!game.program_state.restoring) {
        float_vs_flight();
    }
    /* maybe toggle (BFlying & I_SPECIAL) */
    polysense();
    if (((game.windowprocs.wincap2 & (8 | 128)) != 0)) {
        await status_initialize((1));
    }
    /* we can reset this now, having just done what it is meant to trigger */
    game.were_changes = 0;
}
/* Levitation overrides Flying; set or clear BFlying|I_SPECIAL */
export function float_vs_flight() {
    let stuck_in_floor = (game.u.utrap && game.u.utraptype != TT_PIT);
    /* floating overrides flight; so does being trapped in the floor */
    if ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic) && stuck_in_floor)) {
        game.u.uprops[FLYING].blocked |= 536870912;
    } else {
        game.u.uprops[FLYING].blocked &= ~536870912;
    }
    /* being trapped on the ground (bear trap, web, molten lava survived
       with fire resistance, former lava solidified via cold, tethered
       to a buried iron ball) overrides floating--the floor is reachable */
    if ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && stuck_in_floor) {
        game.u.uprops[LEVITATION].blocked |= 536870912;
    } else {
        game.u.uprops[LEVITATION].blocked &= ~536870912;
    }
    /* riding blocks stealth unless hero+steed fly, so a change in flying
       might cause a change in stealth */
    steed_vs_stealth();
    game.disp.botl = (1);
}
/* riding blocks stealth unless hero+steed fly */
export function steed_vs_stealth() {
    if (game.u.usteed && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && !((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        game.u.uprops[STEALTH].blocked |= 67108864;
    } else {
        game.u.uprops[STEALTH].blocked &= ~67108864;
    }
}
/* for changing into form that's immune to strangulation */
export async function check_strangling(on) {
    if (on) {
        /* on -- maybe resume strangling */
        let was_strangled = (game.u.uprops[STRANGLED].intrinsic != 0);
        if (game.uamul && game.uamul.otyp == AMULET_OF_STRANGULATION && await can_be_strangled(game.youmonst)) {
            game.u.uprops[STRANGLED].intrinsic = 6;
            /* when Strangled is already set, polymorphing from one
           vulnerable form into another causes the counter to be reset */
            game.disp.botl = (1);
            await Your("%s %s your %s!", await simpleonames(game.uamul), was_strangled ? "still constricts" : "begins constricting", await body_part(NECK));
            await discover_object((AMULET_OF_STRANGULATION), (1), (1), (1));
        }
    } else {
        if (game.u.uprops[STRANGLED].intrinsic && !await can_be_strangled(game.youmonst)) {
            game.u.uprops[STRANGLED].intrinsic = 0;
            game.disp.botl = (1);
            await You("are no longer being strangled.");
        }
    }
}
/* make a (new) human out of the player */
export async function polyman(fmt, arg) {
    let sticking = (sticks(game.youmonst.data) && game.u.ustuck && !game.u.uswallow);
    let was_mimicking = ((game.youmonst.m_ap_type & 7) != M_AP_NOTHING);
    let was_blind = !!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    let had_see_invis = !!(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic);
    /* poly'd: also change saved sex */
    if ((game.u.umonnum != game.u.umonster)) {
        /* Monster to monster; restore human stats, to be
         * immediately changed to provide stats for the new monster
         */
        Object.assign(game.u.acurr, game.u.macurr);
        Object.assign(game.u.amax, game.u.mamax);
        game.u.umonnum = game.u.umonster;
        game.flags.female = game.u.mfemale;
    }
    await set_uasmon();
    game.u.mh = game.u.mhmax = 0;
    game.u.mtimedone = 0;
    await skinback((0));
    game.u.uundetected = 0;
    if (sticking) {
        await uunstick();
    }
    find_ac();
    if (was_mimicking) {
        if (game.multi < 0) {
            await unmul("");
        }
        /* if becoming a non-mimic, stop mimicking anything */
        game.youmonst.m_ap_type = M_AP_NOTHING;
        game.youmonst.mappearance = 0;
    }
    await newsym(game.u.ux, game.u.uy);
    await urgent_pline(fmt, arg);
    if (ugenocided()) {
        /* check whether player foolishly genocided self while poly'd */
        /* intervening activity might have clobbered genocide info */
        let kptr = find_delayed_killer(POLYMORPH);
        if (kptr != null && kptr.name[0]) {
            game.killer.format = kptr.format;
            game.killer.name = strcpy(game.killer.name, kptr.name);
        } else {
            game.killer.format = 1;
            game.killer.name = strcpy(game.killer.name, "self-genocide");
        }
        await dealloc_killer(kptr);
        await done(GENOCIDED);
    }
    if (!!(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ^ had_see_invis) {
        await set_mimic_blocking();
    }
    /* See_invisible just toggled */
    if (game.u.twoweap && !((((game.youmonst.data).mattk[0].aatyp == 254) + ((game.youmonst.data).mattk[1].aatyp == 254) + ((game.youmonst.data).mattk[2].aatyp == 254)) > 1)) {
        await untwoweapon();
    }
    if (game.u.utrap && game.u.utraptype == TT_PIT) {
        set_utrap((rn2(6) + (2)), TT_PIT);
    }
    if (was_blind && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        /* previous form was eyeless */
        set_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, 1);
        await make_blinded(0, (1));
    }
    await check_strangling((1));
    if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !game.u.ustuck && is_pool_or_lava(game.u.ux, game.u.uy)) {
        await spoteffects((1));
    }
    await see_monsters();
}
export async function change_sex() {
    /* Some monsters are always of one sex and their sex can't be changed;
     * Succubi/incubi can change, but are handled below.
     *
     * !Upolyd check necessary because is_male() and is_female()
     * may be true for certain roles
     */
    if (!(game.u.umonnum != game.u.umonster) || (!(((game.youmonst.data).mflags2 & 65536) != 0) && !(((game.youmonst.data).mflags2 & 131072) != 0) && !(((game.youmonst.data).mflags2 & 262144) != 0))) {
        game.flags.female = !game.flags.female;
    }
    if ((game.u.umonnum != game.u.umonster)) {
        game.u.mfemale = !game.u.mfemale;
    }
    /* [this appears to be superfluous] */
    max_rank_sz();
    if (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) && game.urole.name.f) {
        game.pl_character = strcpy(game.pl_character, game.urole.name.f);
    } else {
        game.pl_character = strcpy(game.pl_character, game.urole.name.m);
    }
    if (!(game.u.umonnum != game.u.umonster)) {
        game.u.umonnum = game.u.umonster;
    } else if (game.u.umonnum == PM_AMOROUS_DEMON) {
        game.flags.female = !game.flags.female;
        await set_uasmon();
    }
}
/* log a message if non-poly'd hero's gender has changed */
export async function livelog_newform(viapoly, oldgend, newgend) {
    let buf = '';
    let oldrole = null;
    let oldrank = null;
    let newrole = null;
    let newrank = null;
    if (!(game.u.umonnum != game.u.umonster)) {
        if (newgend != oldgend) {
            /*
     * TODO?
     *  Give other logging feedback here instead of in newman().
     */
            oldrole = (oldgend && game.urole.name.f) ? game.urole.name.f : game.urole.name.m;
            newrole = (newgend && game.urole.name.f) ? game.urole.name.f : game.urole.name.m;
            oldrank = rank_of(game.u.ulevel, (game.urole.mnum), oldgend);
            newrank = rank_of(game.u.ulevel, (game.urole.mnum), newgend);
            buf = sprintf(buf, "%.10s %.30s", genders[game.flags.female].adj, newrank);
            livelog_printf(4096, "%s into %s", viapoly ? "polymorphed" : "transformed", await an(strcmp(newrole, oldrole) ? newrole : strcmp(newrank, oldrank) ? newrank : buf));
        }
    }
}
export async function newman() {
    let newform = null;
    let i = 0;
    let oldlvl = 0;
    let newlvl = 0;
    let oldgend = 0;
    let newgend = 0;
    let hpmax = 0;
    let enmax = 0;
    oldlvl = game.u.ulevel;
    /* new = old + {-2,-1,0,+1,+2} */
    newlvl = oldlvl + (rn2(5) + (-2));
    if (newlvl > 127 || newlvl < 1) {
        await urgent_pline("Your new form doesn't seem healthy enough to survive.");
        game.killer.format = 2;
        game.killer.name = strcpy(game.killer.name, "unsuccessful polymorph");
        await done(DIED);
        await newuhs((0));
        await encumber_msg();
        return;
    }
    if (newlvl > 30) {
        newlvl = 30;
    }
    /* If your level goes down, your peak level goes down by
       the same amount so that you can't simply use blessed
       full healing to undo the decrease.  But if your level
       goes up, your peak level does *not* undergo the same
       adjustment; you might end up losing out on the chance
       to regain some levels previously lost to other causes. */
    if (newlvl < oldlvl) {
        game.u.ulevelmax -= (oldlvl - newlvl);
    }
    if (game.u.ulevelmax < newlvl) {
        game.u.ulevelmax = newlvl;
    }
    game.u.ulevel = newlvl;
    oldgend = poly_gender();
    if (game.sex_change_ok && !rn2(10)) {
        await change_sex();
    }
    await adjabil(oldlvl, game.u.ulevel);
    /* random experience points for the new experience level */
    game.u.uexp = rndexp((0));
    /* set up new attribute points (particularly Con) */
    redist_attr();
    /*
     * New hit points:
     *  remove "level gain"-based HP from any extra HP accumulated
     *  (the "extra" might actually be negative);
     *  modify the extra, retaining {80%, 90%, 100%, or 110%};
     *  add in newly generated set of level-gain HP.
     *
     * (This used to calculate new HP in direct proportion to old HP,
     * but that was subject to abuse:  accumulate a large amount of
     * extra HP, drain level down to 1, then polyself to level 2 or 3
     * [lifesaving capability needed to handle level 0 and -1 cases]
     * and the extra got multiplied by 2 or 3.  Repeat the level
     * drain and polyself steps until out of lifesaving capability.)
     */
    hpmax = game.u.uhpmax;
    for (i = 0; i < oldlvl; i++) {
        hpmax -= game.u.uhpinc[i];
    }
    hpmax = await rounddiv(hpmax * (rn2(4) + (8)), 10);
    for (i = 0; (game.u.ulevel = i) < newlvl; i++) {
        hpmax += newhp();
    }
    if (hpmax < game.u.ulevel) {
        hpmax = game.u.ulevel;
    }
    game.u.uhp = await rounddiv(game.u.uhp * hpmax, game.u.uhpmax);
    setuhpmax(hpmax, (1));
    /*
     * Do the same for spell power.
     */
    enmax = game.u.uenmax;
    for (i = 0; i < oldlvl; i++) {
        enmax -= game.u.ueninc[i];
    }
    enmax = await rounddiv(enmax * (rn2(4) + (8)), 10);
    for (i = 0; (game.u.ulevel = i) < newlvl; i++) {
        enmax += newpw();
    }
    if (enmax < game.u.ulevel) {
        enmax = game.u.ulevel;
    }
    game.u.uen = await rounddiv(game.u.uen * enmax, ((game.u.uenmax < 1) ? 1 : game.u.uenmax));
    game.u.uenmax = enmax;
    /* [should alignment record be tweaked too?] */
    game.u.uhunger = (rn2(500) + (500));
    if (game.u.uprops[SICK].intrinsic) {
        await make_sick(0, null, (0), 3);
    }
    if (game.u.uprops[STONED].intrinsic) {
        await make_stoned(0, null, 0, null);
    }
    if (game.u.uhp <= 0) {
        if ((game.u.uprops[POLYMORPH_CONTROL].intrinsic || game.u.uprops[POLYMORPH_CONTROL].extrinsic)) {
            /* even when Stunned || Unaware */
            if (game.u.uhp <= 0) {
                game.u.uhp = 1;
            }
        } else {
            dead: {
            }
            await urgent_pline("Your new form doesn't seem healthy enough to survive.");
            game.killer.format = 0;
            game.killer.name = strcpy(game.killer.name, "unsuccessful polymorph");
            await done(DIED);
            await newuhs((0));
            await encumber_msg();
            /* can get to here if declining to die in explore or wizard
               mode; since we're wearing an amulet of unchanging we can't
               be wearing an amulet of life-saving */
            /* don't rehumanize after all */
            return;
        }
    }
    await newuhs((0));
    /* use saved gender we're about to revert to, not current */
    newform = (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) && game.urace.individual.f) ? game.urace.individual.f : (game.urace.individual.m) ? game.urace.individual.m : game.urace.noun;
    await polyman("You feel like a new %s!", newform);
    newgend = poly_gender();
    /* note: newman() bypasses achievements for new ranks attained and
       doesn't log "new <form>" when that isn't accompanied by level change */
    if (newlvl != oldlvl) {
        livelog_printf(4096, "became experience level %d as a new %s", newlvl, newform);
    } else {
        await livelog_newform((1), oldgend, newgend);
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        await Your("body transforms, but there is still slime on you.");
        await make_slimed(10, null);
    }
    game.disp.botl = (1);
    await see_monsters();
    await encumber_msg();
    await retouch_equipment(2);
    if (!game.uarmg) {
        await selftouch(no_longer_petrify_resistant);
    }
}
export async function polyself(psflags) {
    let buf = '';
    let old_light = 0;
    let new_light = 0;
    let mntmp = 0;
    let class_ = 0;
    let tryct = 0;
    let gvariant = 0;
    let forcecontrol = 0;
    let low_control = 0;
    let monsterpoly = 0;
    let formrevert = 0;
    let draconian = 0;
    let iswere = 0;
    let isvamp = 0;
    let controllable_poly = 0;
    made_change: {
        gvariant = NEUTRAL;
        forcecontrol = ((psflags & POLY_CONTROLLED) != 0);
        low_control = ((psflags & POLY_LOW_CTRL) != 0);
        monsterpoly = ((psflags & POLY_MONSTER) != 0);
        formrevert = ((psflags & POLY_REVERT) != 0);
        draconian = (game.uarm && (((game.uarm).otyp >= GRAY_DRAGON_SCALES && (game.uarm).otyp <= YELLOW_DRAGON_SCALES) || ((game.uarm).otyp >= GRAY_DRAGON_SCALE_MAIL && (game.uarm).otyp <= YELLOW_DRAGON_SCALE_MAIL)));
        iswere = (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS));
        isvamp = (((game.youmonst.data).mlet == S_VAMPIRE) || ((game.youmonst).cham == PM_VAMPIRE || (game.youmonst).cham == PM_VAMPIRE_LEADER || (game.youmonst).cham == PM_VLAD_THE_IMPALER));
        controllable_poly = (game.u.uprops[POLYMORPH_CONTROL].intrinsic || game.u.uprops[POLYMORPH_CONTROL].extrinsic) && !(game.u.uprops[STUNNED].intrinsic || (game.multi < 0 && (unconscious() || is_fainted())));
        if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
            await You("fail to transform!");
            return;
        }
        if (!(game.u.uprops[POLYMORPH_CONTROL].intrinsic || game.u.uprops[POLYMORPH_CONTROL].extrinsic) && !forcecontrol && !draconian && !iswere && !isvamp) {
            if (rn2(20) > (acurr(A_CON))) {
                await You("%s", c_common_strings.c_shudder_for_moment);
                await losehp(rnd(30), "system shock", 0);
                await exercise(A_CON, (0));
                return;
            }
        }
        old_light = (((game.youmonst.data).mlet == S_LIGHT || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_SHOCKING_SPHERE] || (game.youmonst.data) == game.mons[PM_BABY_GOLD_DRAGON] || (game.youmonst.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0);
        mntmp = NON_PM;
        if (formrevert) {
            mntmp = game.youmonst.cham;
            monsterpoly = (1);
            controllable_poly = (0);
        }
        if (forcecontrol && low_control && (draconian || monsterpoly || isvamp || iswere)) {
            forcecontrol = (0);
        }
        if (monsterpoly && isvamp) {
            /* TODO Phase 5+: goto do_vampyr (label not in scope of break) */
        }
        if (controllable_poly || forcecontrol) {
            buf = '';
            tryct = 5;
            do {
                mntmp = NON_PM;
                buf = await getlin("Become what kind of monster? [type the name]", buf);
                buf = mungspaces(buf);
                if (buf == 27) {
                    if (forcecontrol) {
                        await pline("%s", c_common_strings.c_Never_mind);
                        /* user is cancelling controlled poly */
                        return;
                    }
                    buf = strcpy(buf, "*");
                }
                if (!strcmp(buf, "*") || !strcmp(buf, "random")) {
                    /* explicitly requesting random result */
                    /* will skip thats_enough_tries */
                    tryct = 0;
                    /* end do-while(--tryct > 0) loop */
                    continue;
                }
                class_ = 0;
                mntmp = await name_to_mon(buf, { get value() { return gvariant; }, set value(_v) { gvariant = _v; } });
                if (mntmp < LOW_PM) {
                    by_class: {
                    }
                    class_ = await name_to_monclass(buf, { get value() { return mntmp; }, set value(_v) { mntmp = _v; } });
                    if (class_ && mntmp == NON_PM) {
                        mntmp = (draconian && class_ == S_DRAGON) ? armor_to_dragon(game.uarm.otyp) : mkclass_poly(class_);
                    }
                } else if (((game.mons[mntmp]) == game.mons[PM_ORC] || (game.mons[mntmp]) == game.mons[PM_GIANT] || (game.mons[mntmp]) == game.mons[PM_ELF] || (game.mons[mntmp]) == game.mons[PM_HUMAN]) && !(((game.mons[mntmp]).mflags2 & game.urace.selfmask) != 0) && mntmp != PM_HUMAN) {
                    /* placeholder monsters are for corpses and all flagged
               M2_NOPOLY but they are reasonable polymorph targets;
               pick a suitable substitute (which might be geno'd) */
                    /* when your own race, fall to !polyok() case */
                    /* same for generic human, even if hero isn't human */
                    /* far less general than mkclass() */
                    /* note: PM_DWARF and PM_GNOME are ordinary monsters and
                   no longer flagged no-poly so have no need for placeholder
                   handling; PM_HUMAN is a placeholder without a suitable
                   substitute so gets handled differently below */
                    if (mntmp == PM_ORC) {
                        mntmp = rn2(3) ? PM_HILL_ORC : PM_MORDOR_ORC;
                    } else if (mntmp == PM_ELF) {
                        mntmp = rn2(3) ? PM_GREEN_ELF : PM_GREY_ELF;
                    } else if (mntmp == PM_GIANT) {
                        mntmp = rn2(3) ? PM_STONE_GIANT : PM_HILL_GIANT;
                    }
                }
                if (mntmp < LOW_PM) {
                    if (!class_) {
                        await pline("I've never heard of such monsters.");
                    } else {
                        await You_cant("polymorph into any of those.");
                    }
                } else if (game.flags.debug && (game.u.umonnum != game.u.umonster) && (mntmp == game.u.umonster || (game.u.umonster == PM_CLERIC && mntmp == PM_ALIGNED_CLERIC && !strstri(buf, "aligned")))) {
                    await rehumanize();
                    /* rehumanize() extinguishes u-as-mon light */
                    old_light = 0;
                    /* maybe not, but this is right anyway */
                    break made_change;
                } else if (iswere && (were_beastie(mntmp) == game.u.ulycn || mntmp == counter_were(game.u.ulycn) || ((game.u.umonnum != game.u.umonster) && mntmp == PM_HUMAN))) {
                    /* TODO Phase 5+: goto do_shift (label not in scope of break) */
                } else if (!(((game.mons[mntmp]).mflags2 & 1) == 0) && !(mntmp == PM_HUMAN || ((((game.mons[mntmp]).mflags2 & game.urace.selfmask) != 0) && (game.mons[mntmp].geno & 4096) == 0) || mntmp == game.urole.mnum)) {
                    /* Note:  humans are illegal as monsters, but an
                          illegal monster forces newman(), which is what
                          we want if they specified a human.... (unless
                          they specified a unique monster) */
                    let pm_name = null;
                    if (class_) {
                        /* mkclass_poly() can pick a !polyok()
                   candidate; if so, usually try again */
                        if (rn2(3) || --tryct > 0) {
                            /* TODO Phase 5+: goto by_class (label not in scope of break) */
                        }
                        /* no retries left; put one back on counter
                       so that end of loop decrement will yield
                       0 and trigger thats_enough_tries message */
                        ++tryct;
                    }
                    pm_name = pmname(game.mons[mntmp], game.flags.female ? FEMALE : MALE);
                    if (the_unique_pm(game.mons[mntmp])) {
                        pm_name = await the(pm_name);
                    } else if (!(((game.mons[mntmp]).mflags2 & 524288) != 0)) {
                        pm_name = await an(pm_name);
                    }
                    await You_cant("polymorph into %s.", pm_name);
                } else {
                    /* Note that otmp->nobj is pointing at fobj now,
             * as a result of:
             * dropx() -> dropy() -> dropz() -> place_object(),
             * and no longer pointing at the next obj in inventory.
             * That would be an issue if this loop were allowed
             * to continue, but the break statement that
             * follows prevents the loop from continuing on with
             * objects on the floor.
             */
                    break;
                }
            } while (--tryct > 0);
            if (!tryct) {
                await pline("%s", c_common_strings.c_thats_enough_tries);
            }
            /* allow skin merging, even when polymorph is controlled */
            if (draconian && (tryct <= 0 || mntmp == armor_to_dragon(game.uarm.otyp))) {
                /* TODO Phase 5+: goto do_merge (label not in scope of break) */
            }
            if (isvamp && (tryct <= 0 || mntmp == PM_WOLF || mntmp == PM_FOG_CLOUD || ((game.mons[mntmp]) == game.mons[PM_BAT] || (game.mons[mntmp]) == game.mons[PM_GIANT_BAT] || (game.mons[mntmp]) == game.mons[PM_VAMPIRE_BAT]))) {
                /* TODO Phase 5+: goto do_vampyr (label not in scope of break) */
            }
        } else if (draconian || iswere || isvamp) {
            if (draconian) {
                do_merge: {
                }
                mntmp = armor_to_dragon(game.uarm.otyp);
                if (!(game.mvitals[mntmp].mvflags & 2)) {
                    /* special changes that don't require polyok() */
                    let was_lit = game.uarm.lamplit;
                    let arm_light = artifact_light(game.uarm) ? arti_light_radius(game.uarm) : 0;
                    if (((game.uarm).otyp >= GRAY_DRAGON_SCALES && (game.uarm).otyp <= YELLOW_DRAGON_SCALES)) {
                        await You("merge with your scaly armor.");
                    } else {
                        buf = strcpy(buf, await simpleonames(game.uarm));
                        /* dragon scale mail reverts to scales */
                        /* similar to noarmor(invent.c),
                       shorten to "<color> scale mail" */
                        buf = strsubst(buf, " dragon ", " ");
                        await Your("%s reverts to scales as you merge with them.", buf);
                        /* uarm->spe enchantment remains unchanged;
                       re-converting scales to mail poses risk
                       of evaporation due to over enchanting */
                        game.uarm.otyp += GRAY_DRAGON_SCALES - GRAY_DRAGON_SCALE_MAIL;
                        await observe_object(game.uarm);
                        game.disp.botl = (1);
                    }
                    game.uskin = game.uarm;
                    game.uarm = null;
                    game.uskin.owornmask |= 536870912;
                    if (was_lit) {
                        await maybe_adjust_light(game.uskin, arm_light);
                    }
                    update_inventory();
                }
            } else if (iswere) {
                do_shift: {
                }
                if ((game.u.umonnum != game.u.umonster) && were_beastie(mntmp) != game.u.ulycn) {
                    mntmp = PM_HUMAN;
                } else {
                    mntmp = game.u.ulycn;
                }
            } else if (isvamp) {
                do_vampyr: {
                }
                if (mntmp < LOW_PM || (game.mons[mntmp].geno & 4096)) {
                    mntmp = (game.youmonst.data == game.mons[PM_VAMPIRE_LEADER] && !rn2(10)) ? PM_WOLF : !rn2(4) ? PM_FOG_CLOUD : PM_VAMPIRE_BAT;
                    if (((game.youmonst.cham) >= LOW_PM && (game.youmonst.cham) < NUMMONS) && !((game.youmonst.data).mlet == S_VAMPIRE) && !rn2(2)) {
                        mntmp = game.youmonst.cham;
                    }
                }
                if (controllable_poly) {
                    buf = sprintf(buf, "Become %s?", await an(pmname(game.mons[mntmp], gvariant)));
                    if (await yn_function(buf, ynchars, 110, (1)) != 121) {
                        return;
                    }
                }
            }
            if (mntmp == PM_HUMAN) {
                await newman();
            } else {
                await polymon(mntmp);
            }
            break made_change;
        }
        if (mntmp < LOW_PM) {
            tryct = 200;
            do {
                /* randomly pick an "ordinary" monster */
                mntmp = (rn2(SPECIAL_PM - LOW_PM) + (LOW_PM));
                if ((((game.mons[mntmp]).mflags2 & 1) == 0) && !((game.mons[mntmp]) == game.mons[PM_ORC] || (game.mons[mntmp]) == game.mons[PM_GIANT] || (game.mons[mntmp]) == game.mons[PM_ELF] || (game.mons[mntmp]) == game.mons[PM_HUMAN])) {
                    break;
                }
            } while (--tryct > 0);
        }
        /* The below polyok() fails either if everything is genocided, or if
     * we deliberately chose something illegal to force newman().
     */
        game.sex_change_ok++;
        if (!(((game.mons[mntmp]).mflags2 & 1) == 0) || (!forcecontrol && !rn2(5)) || (((game.mons[mntmp]).mflags2 & game.urace.selfmask) != 0)) {
            await newman();
        } else {
            await polymon(mntmp);
        }
        game.sex_change_ok--;
    }
    new_light = (((game.youmonst.data).mlet == S_LIGHT || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_SHOCKING_SPHERE] || (game.youmonst.data) == game.mons[PM_BABY_GOLD_DRAGON] || (game.youmonst.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0);
    if (old_light != new_light) {
        if (old_light) {
            await del_light_source(LS_MONSTER, monst_to_any(game.youmonst));
        }
        if (new_light == 1) {
            ++new_light;
        }
        if (new_light) {
            await new_light_source(game.u.ux, game.u.uy, new_light, LS_MONSTER, monst_to_any(game.youmonst));
        }
    }
}
/* (try to) make a mntmp monster out of the player; return 1 if successful */
const __polymon_use_thec = "Use the command #%s to %s.";
const __polymon_monsterc = "monster";
export async function polymon(mntmp) {
    let buf = '';
    let ustuckNam = '';
    let sticking = sticks(game.youmonst.data) && game.u.ustuck && !game.u.uswallow;
    let was_blind = !!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    let dochange = (0);
    let was_expelled = (0);
    let was_hiding_under = game.u.uundetected && (((game.youmonst.data).mflags1 & 128) != 0);
    let mlvl = 0;
    let newMaxStr = 0;
    if (game.mvitals[mntmp].mvflags & 2) {
        await You_feel("rather %s-ish.", pmname(game.mons[mntmp], game.flags.female ? FEMALE : MALE));
        await exercise(A_WIS, (1));
        return 0;
    }
    if (!game.u.uconduct.polyselfs++) {
        livelog_printf(32, "changed form for the first time, becoming %s", await an(pmname(game.mons[mntmp], game.flags.female ? FEMALE : MALE)));
    }
    await exercise(A_CON, (0));
    await exercise(A_WIS, (1));
    if (!(game.u.umonnum != game.u.umonster)) {
        /* Human to monster; save human stats */
        Object.assign(game.u.macurr, game.u.acurr);
        Object.assign(game.u.mamax, game.u.amax);
        game.u.mfemale = game.flags.female;
    } else {
        Object.assign(game.u.acurr, game.u.macurr);
        Object.assign(game.u.amax, game.u.mamax);
        game.flags.female = game.u.mfemale;
    }
    /* if stuck mimicking gold, stop immediately */
    if (game.multi < 0 && (game.youmonst.m_ap_type & 7) == M_AP_OBJECT && game.youmonst.data.mlet != S_MIMIC) {
        await unmul("");
    }
    if (game.mons[mntmp].mlet != S_MIMIC) {
        game.youmonst.m_ap_type = M_AP_NOTHING;
        game.youmonst.mappearance = 0;
    }
    if ((((game.mons[mntmp]).mflags2 & 65536) != 0)) {
        if (game.flags.female) {
            dochange = (1);
        }
    } else if ((((game.mons[mntmp]).mflags2 & 131072) != 0)) {
        if (!game.flags.female) {
            dochange = (1);
        }
    } else if (!(((game.mons[mntmp]).mflags2 & 262144) != 0) && mntmp != game.u.ulycn) {
        if (game.sex_change_ok && !rn2(10)) {
            dochange = (1);
        }
    }
    ustuckNam = strcpy(ustuckNam, game.u.ustuck ? await Some_Monnam(game.u.ustuck) : "");
    buf = strcpy(buf, (game.u.umonnum != mntmp) ? "" : "new ");
    if (dochange) {
        game.flags.female = !game.flags.female;
        buf = strcat(buf, ((((game.mons[mntmp]).mflags2 & 65536) != 0) || (((game.mons[mntmp]).mflags2 & 131072) != 0)) ? "" : game.flags.female ? "female " : "male ");
    }
    buf = strcat(buf, pmname(game.mons[mntmp], game.flags.female ? FEMALE : MALE));
    await You("%s %s!", (game.u.umonnum != mntmp) ? "turn into" : "feel like", await an(buf));
    if (game.u.uprops[STONED].intrinsic && poly_when_stoned(game.mons[mntmp])) {
        /* poly_when_stoned already checked stone golem genocide */
        mntmp = PM_STONE_GOLEM;
        await make_stoned(0, "You turn to stone!", 0, null);
    }
    game.u.mtimedone = (rn2(500) + (500));
    game.u.umonnum = mntmp;
    await set_uasmon();
    /* New stats for monster, to last only as long as polymorphed.
     * Currently only strength gets changed.
     */
    newMaxStr = uasmon_maxStr();
    if ((((game.mons[mntmp]).mflags2 & 67108864) != 0)) {
        (game.u.acurr.a[A_STR]) = (game.u.amax.a[A_STR]) = newMaxStr;
    } else {
        (game.u.amax.a[A_STR]) = newMaxStr;
        /* not a strongmonst(); if hero has exceptional strength, remove it
           (note: removal is temporary until returning to original form);
           we don't attempt to enforce lower maximum for wimpy forms;
           unlike for strongmonst, current strength does not get set to max */
        /* make sure current is not higher than max (strip exceptional Str) */
        if ((game.u.acurr.a[A_STR]) > (game.u.amax.a[A_STR])) {
            (game.u.acurr.a[A_STR]) = (game.u.amax.a[A_STR]);
        }
    }
    if ((game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && game.u.uprops[STONED].intrinsic) {
        await make_stoned(0, "You no longer seem to be petrifying.", 0, null);
    }
    if ((game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || await defended(game.youmonst, 33)) && game.u.uprops[SICK].intrinsic) {
        await make_sick(0, null, (0), 3);
        await You("no longer feel sick.");
    }
    if (game.u.uprops[SLIMED].intrinsic) {
        if (((game.youmonst.data) == game.mons[PM_FIRE_VORTEX] || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_SALAMANDER])) {
            await make_slimed(0, "The slime burns away!");
        } else if (mntmp == PM_GREEN_SLIME) {
            await make_slimed(0, null);
        }
    }
    await check_strangling((0));
    if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        make_glib(0);
    }
    /*
    mlvl = adj_lev(&mons[mntmp]);
     * We can't do the above, since there's no such thing as an
     * "experience level of you as a monster" for a polymorphed character.
     */
    mlvl = game.mons[mntmp].mlevel;
    if (game.youmonst.data.mlet == S_DRAGON && mntmp >= PM_GRAY_DRAGON) {
        game.u.mhmax = ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) ? (8 * mlvl) : (4 * mlvl + d(mlvl, 4));
    } else if (((game.youmonst.data).mlet == S_GOLEM)) {
        game.u.mhmax = golemhp(mntmp);
    } else {
        if (!mlvl) {
            game.u.mhmax = rnd(4);
        } else {
            game.u.mhmax = d(mlvl, 8);
        }
        if (is_home_elemental(game.mons[mntmp])) {
            game.u.mhmax *= 3;
        }
    }
    game.u.mh = game.u.mhmax;
    if (game.u.ulevel < mlvl) {
        /* Low level characters can't become high level monsters for long */
        /* DRS/NS 2.2.6 messes up -- Peter Kendell */
        game.u.mtimedone = Math.trunc(game.u.mtimedone * game.u.ulevel / mlvl);
    }
    if (game.uskin && mntmp != armor_to_dragon(game.uskin.otyp)) {
        await skinback((0));
    }
    await break_armor();
    await drop_weapon(1);
    find_ac();
    if (was_hiding_under) {
        await hideunder(game.youmonst);
    }
    if (game.u.utrap && game.u.utraptype == TT_PIT) {
        set_utrap((rn2(6) + (2)), TT_PIT);
    }
    if (was_blind && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        set_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, 1);
        await make_blinded(0, (1));
    }
    await newsym(game.u.ux, game.u.uy);
    if ((((game.youmonst.data).mflags1 & 4194304) != 0)) {
        /* you now know what an egg of your type looks like; [moved from
       below in case expels() -> spoteffects() drops hero onto any eggs] */
        learn_egg_type(game.u.umonnum);
        /* make queen bees recognize killer bee eggs */
        learn_egg_type(egg_type_from_parent(game.u.umonnum, (1)));
    }
    if (game.u.uswallow) {
        let usiz = 0;
        /* [note:  this 'sticking' handling is only sufficient for changing from
       grabber to engulfer or vice versa because engulfing by poly'd hero
       always ends immediately so won't be in effect during a polymorph] */
        if ((((game.youmonst.data).mflags1 & 1048576) != 0) || (usiz = game.youmonst.data.msize) >= 4 || (game.u.ustuck.data.msize < usiz && !((game.u.ustuck.data).mlet == S_VORTEX || (game.u.ustuck.data) == game.mons[PM_AIR_ELEMENTAL]))) {
            /* if new form can't be swallowed, make engulfer expel hero */
            /* subset of engulf_target() */
            let expels_mesg = (1);
            if ((((game.youmonst.data).mflags1 & 1048576) != 0)) {
                /* [see below for explanation] */
                /* being held; if now capable of holding, make holder
                  release so that hero doesn't automagically start holding
                  it; or, release if no longer capable of being held */
                /* u.ustuck name was saved above in case we're changing from can-see
           to can't-see; but might have changed from can't-see to can-see so
           override here if hero knows who u.ustuck is */
                if ((canseemon(game.u.ustuck) || sensemon(game.u.ustuck))) {
                    ustuckNam = strcpy(ustuckNam, await Monnam(game.u.ustuck));
                }
                await pline("%s can no longer contain you.", ustuckNam);
                expels_mesg = (0);
            }
            await expels(game.u.ustuck, game.u.ustuck.data, expels_mesg);
            /* FIXME? if expels() triggered rehumanize then we should
               return early */
            was_expelled = (1);
        }
    } else if (game.u.ustuck && !sticking && (sticks(game.youmonst.data) || (((game.youmonst.data).mflags1 & 1048576) != 0))) {
        if ((canseemon(game.u.ustuck) || sensemon(game.u.ustuck))) {
            ustuckNam = strcpy(ustuckNam, await Monnam(game.u.ustuck));
        }
        await set_ustuck(null);
        await pline("%s loses its grip on you.", ustuckNam);
    } else if (sticking && !sticks(game.youmonst.data)) {
        await uunstick();
    }
    if (game.u.usteed) {
        if (((game.u.usteed.data) == game.mons[PM_COCKATRICE] || (game.u.usteed.data) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && rnl(3)) {
            await pline("%s touch %s.", no_longer_petrify_resistant, await mon_nam(game.u.usteed));
            buf = sprintf(buf, "riding %s", await an(pmname(game.u.usteed.data, Mgender(game.u.usteed))));
            await instapetrify(buf);
        }
        if (!can_ride(game.u.usteed)) {
            await dismount_steed(DISMOUNT_POLY);
        }
    }
    find_ac();
    if (((!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !game.u.ustuck && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && is_pool_or_lava(game.u.ux, game.u.uy)) || ((game.u.uinwater) && !(game.u.uprops[SWIMMING].intrinsic || game.u.uprops[SWIMMING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 2) != 0))))) && !was_expelled) {
        await spoteffects((1));
    }
    if ((game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && game.u.utrap && (game.u.utraptype == TT_INFLOOR || game.u.utraptype == TT_BURIEDBALL)) {
        if (game.u.utraptype == TT_INFLOOR) {
            await pline_The("rock seems to no longer trap you.");
        } else {
            await pline_The("buried ball is no longer bound to you.");
            await buried_ball_to_freedom();
        }
        await reset_utrap((1));
    } else if ((game.youmonst.data == game.mons[PM_FIRE_ELEMENTAL] || game.youmonst.data == game.mons[PM_SALAMANDER]) && game.u.utrap && game.u.utraptype == TT_LAVA) {
        await pline_The("%s now feels soothing.", hliquid("lava"));
        await reset_utrap((1));
    }
    if ((((game.youmonst.data).mflags1 & 4) != 0) || ((game.youmonst.data).mlet == S_VORTEX || (game.youmonst.data) == game.mons[PM_AIR_ELEMENTAL]) || (((game.youmonst.data).mflags1 & 1048576) != 0)) {
        if ((game.uball != null)) {
            await You("slip out of the iron chain.");
            await unpunish();
        } else if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
            await You("slip free of the buried ball and chain.");
            await buried_ball_to_freedom();
        }
    }
    if (game.u.utrap && (game.u.utraptype == TT_WEB || game.u.utraptype == TT_BEARTRAP) && ((((game.youmonst.data).mflags1 & 4) != 0) || ((game.youmonst.data).mlet == S_VORTEX || (game.youmonst.data) == game.mons[PM_AIR_ELEMENTAL]) || (((game.youmonst.data).mflags1 & 1048576) != 0) || (game.youmonst.data.msize <= 1 && game.u.utraptype == TT_BEARTRAP))) {
        await You("are no longer stuck in the %s.", game.u.utraptype == TT_WEB ? "web" : "bear trap");
        await reset_utrap((1));
    }
    if (((game.youmonst.data) == game.mons[PM_CAVE_SPIDER] || (game.youmonst.data) == game.mons[PM_GIANT_SPIDER]) && game.u.utrap && game.u.utraptype == TT_WEB) {
        await You("orient yourself on the web.");
        await reset_utrap((1));
    }
    await check_strangling((1));
    game.disp.botl = (1);
    game.vision_full_recalc = 1;
    await see_monsters();
    await encumber_msg();
    await retouch_equipment(2);
    if (!game.uarmg) {
        await selftouch(no_longer_petrify_resistant);
    }
    if (game.flags.verbose) {
        /* the explanation of '#monster' used to be shown sooner, but there are
       possible fatalities above and it isn't useful unless hero survives */
        let uptr = game.youmonst.data;
        let might_hide = ((((uptr).mflags1 & 256) != 0) || (((uptr).mflags1 & 128) != 0));
        if (attacktype(uptr, 12)) {
            await pline(__polymon_use_thec, __polymon_monsterc, "use your breath weapon");
        }
        if (attacktype(uptr, 10)) {
            await pline(__polymon_use_thec, __polymon_monsterc, "spit venom");
        }
        if (uptr.mlet == S_NYMPH) {
            await pline(__polymon_use_thec, __polymon_monsterc, "remove an iron ball");
        }
        if (attacktype(uptr, 15)) {
            await pline(__polymon_use_thec, __polymon_monsterc, "gaze at monsters");
        }
        if (might_hide && ((uptr) == game.mons[PM_CAVE_SPIDER] || (uptr) == game.mons[PM_GIANT_SPIDER])) {
            await pline(__polymon_use_thec, __polymon_monsterc, "hide or to spin a web");
        } else if (might_hide) {
            await pline(__polymon_use_thec, __polymon_monsterc, "hide");
        } else if (((uptr) == game.mons[PM_CAVE_SPIDER] || (uptr) == game.mons[PM_GIANT_SPIDER])) {
            await pline(__polymon_use_thec, __polymon_monsterc, "spin a web");
        }
        if ((((uptr).mflags2 & 4) != 0)) {
            await pline(__polymon_use_thec, __polymon_monsterc, "summon help");
        }
        if (game.u.umonnum == PM_GREMLIN) {
            await pline(__polymon_use_thec, __polymon_monsterc, "multiply in a fountain");
        }
        if (((uptr).mlet == S_UNICORN && (((uptr).mflags2 & 536870912) != 0))) {
            await pline(__polymon_use_thec, __polymon_monsterc, "use your horn");
        }
        if (((uptr) == game.mons[PM_MIND_FLAYER] || (uptr) == game.mons[PM_MASTER_MIND_FLAYER])) {
            await pline(__polymon_use_thec, __polymon_monsterc, "emit a mental blast");
        }
        if (uptr.msound == MS_SHRIEK) {
            await pline(__polymon_use_thec, __polymon_monsterc, "shriek");
        }
        if (((uptr).mlet == S_VAMPIRE) || ((game.youmonst).cham == PM_VAMPIRE || (game.youmonst).cham == PM_VAMPIRE_LEADER || (game.youmonst).cham == PM_VLAD_THE_IMPALER)) {
            await pline(__polymon_use_thec, __polymon_monsterc, "change shape");
        }
        if ((((uptr).mflags1 & 4194304) != 0) && game.flags.female && !(uptr == game.mons[PM_GIANT_EEL] || uptr == game.mons[PM_ELECTRIC_EEL])) {
            await pline(__polymon_use_thec, "sit", ((((uptr).mflags1 & 4194304) != 0) && (uptr).mlet == S_EEL && (((uptr).mflags1 & 2) != 0)) ? "spawn in the water" : "lay an egg");
        }
    }
    return 1;
}
/* determine hero's temporary strength value used while polymorphed;
   hero poly'd into M2_STRONG monster usually gets 18/100 strength but
   there are exceptions; non-M2_STRONG get maximum strength set to 18 */
export function uasmon_maxStr() {
    let R = null;
    let newMaxStr = 0;
    let mndx = game.u.umonnum;
    let ptr = game.mons[mndx];
    if ((((ptr).mflags2 & 128) != 0)) {
        if (mndx != PM_URUK_HAI && mndx != PM_ORC_CAPTAIN) {
            mndx = PM_ORC;
        }
    } else if ((((ptr).mflags2 & 16) != 0)) {
        mndx = PM_ELF;
    } else if ((((ptr).mflags2 & 32) != 0)) {
        mndx = PM_DWARF;
    } else if ((((ptr).mflags2 & 64) != 0)) {
        /* use the mons[] value for humans */
        mndx = PM_GNOME;
    }
    R = character_race(mndx);
    if ((((ptr).mflags2 & 67108864) != 0)) {
        /* ettins, titans and minotaurs don't pass the is_giant() test;
           giant mummies and giant zombies do but we throttle those */
        let live_H = (((ptr).mflags2 & 8192) != 0) && !(((ptr).mflags2 & 2) != 0);
        /* hero orcs are limited to 18/50 for maximum strength, so treat
           hero poly'd into an orc the same; goblins, orc shamans, and orc
           zombies don't have strongmonst() attribute so won't get here;
           hobgoblins and orc mummies do get here and are limited to 18/50
           like normal orcs; however, orc captains and Uruk-hai retain 18/100
           strength; hero gnomes are also limited to 18/50; hero elves are
           limited to 18/00 regardless of whether they're strongmonst, but
           the two strongmonst types (monarchs and nobles) have current
           strength set to 18 [by polymon()], the others don't */
        newMaxStr = R ? R.attrmax[A_STR] : live_H ? (100 + (19)) : (18 + (100));
    } else {
        newMaxStr = R ? R.attrmax[A_STR] : 18;
    }
    return newMaxStr;
}
/* dropx() jacket for break_armor() */
export async function dropp(obj) {
    let otmp = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp == obj) {
            await dropx(obj);
            break;
        }
    }
}
export async function break_armor() {
    let otmp = null;
    let uptr = game.youmonst.data;
    if (breakarm(uptr)) {
        if ((otmp = game.uarm) != null) {
            if (donning(otmp)) {
                cancel_don();
            }
            if (otmp.lamplit) {
                await end_burn(otmp, (0));
            }
            await You("break out of your armor!");
            await exercise(A_STR, (0));
            await Armor_gone();
            await useup(otmp);
        }
        if ((otmp = game.uarmc) != null && (otmp.otyp != MUMMY_WRAPPING || !((((uptr).mflags1 & 131072) != 0) && (uptr).msize >= 1 && (uptr).msize <= 4 && !((uptr).mlet == S_GHOST) && (uptr).mlet != S_CENTAUR && (uptr) != game.mons[PM_WINGED_GARGOYLE] && (uptr) != game.mons[PM_MARILITH]))) {
            if (otmp.otyp == MUMMY_WRAPPING) {
                await Your("%s tears apart!", cloak_simple_name(otmp));
                await Cloak_off();
                await useup(otmp);
            } else if (otmp.otyp == ALCHEMY_SMOCK) {
                await pline_The("knot on your %s is pulled apart!", cloak_simple_name(otmp));
                await Cloak_off();
                await dropp(otmp);
            } else {
                await pline_The("clasp on your %s breaks open!", cloak_simple_name(otmp));
                await Cloak_off();
                await dropp(otmp);
            }
        }
        if (game.uarmu) {
            await Your("shirt rips to shreds!");
            await useup(game.uarmu);
        }
    } else if (sliparm(uptr)) {
        if ((otmp = game.uarm) != null && racial_exception(game.youmonst, otmp) < 1) {
            if (donning(otmp)) {
                cancel_don();
            }
            await Your("armor falls around you!");
            await Armor_gone();
            await dropp(otmp);
        }
        if ((otmp = game.uarmc) != null && (otmp.otyp != MUMMY_WRAPPING || !((((uptr).mflags1 & 131072) != 0) && (uptr).msize >= 1 && (uptr).msize <= 4 && !((uptr).mlet == S_GHOST) && (uptr).mlet != S_CENTAUR && (uptr) != game.mons[PM_WINGED_GARGOYLE] && (uptr) != game.mons[PM_MARILITH]))) {
            if (((uptr).mlet == S_VORTEX || (uptr) == game.mons[PM_AIR_ELEMENTAL])) {
                await Your("%s falls, unsupported!", cloak_simple_name(otmp));
            } else {
                await You("shrink out of your %s!", cloak_simple_name(otmp));
            }
            await Cloak_off();
            await dropp(otmp);
        }
        if ((otmp = game.uarmu) != null) {
            if (((uptr).mlet == S_VORTEX || (uptr) == game.mons[PM_AIR_ELEMENTAL])) {
                await You("seep right through your shirt!");
            } else {
                await You("become much too small for your shirt!");
            }
            await setworn(null, otmp.owornmask & 64);
            await dropp(otmp);
        }
    }
    if ((num_horns(uptr) > 0)) {
        if ((otmp = game.uarmh) != null) {
            if ((game.objects[(otmp).otyp].oc_material <= LEATHER || (otmp).otyp == RUBBER_HOSE) && !donning(otmp)) {
                let hornbuf = '';
                hornbuf = sprintf(hornbuf, "horn%s", (((num_horns(uptr)) == 1) ? "" : "s"));
                await Your("%s %s through %s.", hornbuf, await vtense(hornbuf, "pierce"), await yname(otmp));
            } else {
                if (donning(otmp)) {
                    cancel_don();
                }
                await Your("%s falls to the %s!", helm_simple_name(otmp), surface(game.u.ux, game.u.uy));
                await Helmet_off();
                await dropp(otmp);
            }
        }
    }
    if ((((uptr).mflags1 & 8192) != 0) || ((uptr).msize < 1)) {
        if ((otmp = game.uarmg) != null) {
            if (donning(otmp)) {
                cancel_don();
            }
            await You("drop your gloves%s!", game.uwep ? " and weapon" : "");
            await drop_weapon(0);
            await Gloves_off();
            await dropp(otmp);
        }
        if ((otmp = game.uarms) != null) {
            await You("can no longer hold your shield!");
            await Shield_off();
            await dropp(otmp);
        }
        if ((otmp = game.uarmh) != null) {
            if (donning(otmp)) {
                cancel_don();
            }
            await Your("%s falls to the %s!", helm_simple_name(otmp), surface(game.u.ux, game.u.uy));
            await Helmet_off();
            await dropp(otmp);
        }
    }
    if ((((uptr).mflags1 & 8192) != 0) || ((uptr).msize < 1) || (((uptr).mflags1 & 524288) != 0) || uptr.mlet == S_CENTAUR) {
        if ((otmp = game.uarmf) != null) {
            if (donning(otmp)) {
                cancel_don();
            }
            if (((uptr).mlet == S_VORTEX || (uptr) == game.mons[PM_AIR_ELEMENTAL])) {
                await Your("boots fall away!");
            } else {
                await Your("boots %s off your feet!", ((uptr).msize < 1) ? "slide" : "are pushed");
            }
            await Boots_off();
            await dropp(otmp);
        }
    }
    /* rings stay worn even when no hands */
    if ((otmp = game.ublindf) != null && !(((uptr).mflags1 & 32768) == 0)) {
        /* not armor, but eyewear shouldn't stay worn without a head to wear
       it/them on (should also come off if head is too tiny or too huge,
       but putting accessories on doesn't reject those cases [yet?]);
       amulet stays worn */
        let l = 0;
        let eyewear = await simpleonames(otmp);
        if (!strncmp(eyewear, "pair of ", l = 8)) {
            eyewear = __nh_advance_str(eyewear, l);
        }
        await Your("%s %s off!", eyewear, await vtense(eyewear, "fall"));
        await Blindf_off(null);
        await dropp(otmp);
    }
}
export async function drop_weapon(alone) {
    let otmp = null;
    let what = null;
    let which = null;
    let whichtoo = null;
    let candropwep = 0;
    let candropswapwep = 0;
    let updateinv = (1);
    if (game.uwep) {
        if (!alone || ((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1))) {
            candropwep = await canletgo(game.uwep, "");
            candropswapwep = !game.u.twoweap || await canletgo(game.uswapwep, "");
            if (alone) {
                what = (candropwep && candropswapwep) ? "drop" : "release";
                which = (game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[game.uwep.otyp].oc_subtyp <= P_SABER) ? "sword" : await weapon_descr(game.uwep);
                if (game.u.twoweap) {
                    whichtoo = (game.uswapwep.oclass == WEAPON_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[game.uswapwep.otyp].oc_subtyp <= P_SABER) ? "sword" : await weapon_descr(game.uswapwep);
                    if (strcmp(which, whichtoo)) {
                        which = "weapon";
                    }
                }
                if (game.uwep.quan != 1 || game.u.twoweap) {
                    which = await makeplural(which);
                }
                await You("find you must %s %s %s!", what, c_common_strings.c_the_your[!!strncmp(which, "corpse", 6)], which);
            }
            if (game.u.twoweap) {
                /* if either uwep or wielded uswapwep is flagged as 'in_use'
               then don't drop it or explicitly update inventory; leave
               those actions to caller (or caller's caller, &c) */
                otmp = game.uswapwep;
                await uswapwepgone();
                if (otmp.in_use) {
                    updateinv = (0);
                } else if (candropswapwep) {
                    await dropx(otmp);
                }
            }
            otmp = game.uwep;
            await uwepgone();
            if (otmp.in_use) {
                updateinv = (0);
            } else if (candropwep) {
                await dropx(otmp);
            }
            /* [note: dropp vs dropx -- if heart of ahriman is wielded, we
               might be losing levitation by dropping it; but that won't
               happen until the drop, unlike Boots_off() dumping hero into
               water and triggering emergency_disrobe() before dropx()] */
            if (updateinv) {
                update_inventory();
            }
        } else if (!((((game.youmonst.data).mattk[0].aatyp == 254) + ((game.youmonst.data).mattk[1].aatyp == 254) + ((game.youmonst.data).mattk[2].aatyp == 254)) > 1)) {
            await untwoweapon();
        }
    }
}
/* return to original form, usually either due to polymorph timing out
   or dying from loss of hit points while being polymorphed */
export async function rehumanize() {
    let was_flying = (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) != 0);
    if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
        if (game.u.mh < 1) {
            /* You can't revert back while unchanging */
            game.killer.format = 2;
            game.killer.name = strcpy(game.killer.name, "killed while stuck in creature form");
            await done(DIED);
            return;
        } else if (game.uamul && game.uamul.otyp == AMULET_OF_UNCHANGING) {
            await Your("%s %s!", await simpleonames(game.uamul), await otense(game.uamul, "fail"));
            await observe_object(game.uamul);
            await discover_object((AMULET_OF_UNCHANGING), (1), (1), (1));
        }
    }
    /*
     * Right now, dying while being a shifted vampire (bat, cloud, wolf)
     * reverts to human rather than to vampire.
     */
    if ((((game.youmonst.data).mlet == S_LIGHT || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data) == game.mons[PM_SHOCKING_SPHERE] || (game.youmonst.data) == game.mons[PM_BABY_GOLD_DRAGON] || (game.youmonst.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((game.youmonst.data) == game.mons[PM_FIRE_ELEMENTAL] || (game.youmonst.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
        await del_light_source(LS_MONSTER, monst_to_any(game.youmonst));
    }
    await polyman("You return to %s form!", game.urace.adj);
    if (game.u.uhp < 1) {
        await Your("old form was not healthy enough to survive.");
        game.killer.name = sprintf(game.killer.name, "reverting to unhealthy %s form", game.urace.adj);
        game.killer.format = 1;
        await done(DIED);
    }
    nomul(0);
    game.disp.botl = (1);
    game.vision_full_recalc = 1;
    await encumber_msg();
    update_inventory();
    if (was_flying && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) && game.u.usteed) {
        await You("and %s return gently to the %s.", await mon_nam(game.u.usteed), surface(game.u.ux, game.u.uy));
    }
    await retouch_equipment(2);
    if (!game.uarmg) {
        await selftouch(no_longer_petrify_resistant);
    }
}
export async function dobreathe() {
    let mattk = null;
    if (game.u.uprops[STRANGLED].intrinsic) {
        await You_cant("breathe.  Sorry.");
        return 0;
    }
    if (game.u.uen < 15) {
        await You("don't have enough energy to breathe!");
        return 0;
    }
    game.u.uen -= 15;
    game.disp.botl = (1);
    if (!await getdir(null)) {
        return 2;
    }
    mattk = attacktype_fordmg(game.youmonst.data, 12, (-1));
    if (!mattk) {
        await impossible("bad breath attack?");
    } else if (!game.u.dx && !game.u.dy && !game.u.dz) {
        await ubreatheu(mattk);
    } else {
        await ubuzz((20 + ((abs((mattk.adtyp) - 1) % 10))), mattk.damn);
    }
    return 1;
}
export async function dospit() {
    let otmp = null;
    let mattk = null;
    if (!await getdir(null)) {
        return 2;
    }
    mattk = attacktype_fordmg(game.youmonst.data, 10, (-1));
    if (!mattk) {
        await impossible("bad spit attack?");
    } else {
        switch (mattk.adtyp) {
            case 11:
            case 7:
                otmp = await mksobj(BLINDING_VENOM, (1), (0));
                break;
            default:
                await impossible("bad attack type in dospit");
                ;
            case 8:
                otmp = await mksobj(ACID_VENOM, (1), (0));
                break;
        }
        otmp.spe = 1;
        await throwit(otmp, 0, (0), null);
    }
    return 1;
}
export async function doremove() {
    if (!(game.uball != null)) {
        if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
            await pline_The("ball and chain are buried firmly in the %s.", surface(game.u.ux, game.u.uy));
            return 0;
        }
        await You("are not chained to anything!");
        return 0;
    }
    await unpunish();
    return 1;
}
export async function dospinweb() {
    let x = game.u.ux;
    let y = game.u.uy;
    let ttmp = t_at(x, y);
    /* disallow webs on water, lava, air & cloud */
    let reject_terrain = is_pool_or_lava(x, y) || ((game.level.locations[x][y].typ) == AIR || (game.level.locations[x][y].typ) == CLOUD);
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || reject_terrain) {
        await You("must be on %s ground to spin a web.", reject_terrain ? "solid" : "the");
        return 0;
    }
    if (game.u.uswallow) {
        await You("release web fluid inside %s.", await mon_nam(game.u.ustuck));
        if ((((game.u.ustuck.data).mflags1 & 262144) != 0)) {
            await expels(game.u.ustuck, game.u.ustuck.data, (1));
            return 0;
        }
        if (((game.u.ustuck.data).mlet == S_VORTEX || (game.u.ustuck.data) == game.mons[PM_AIR_ELEMENTAL])) {
            let i = 0;
            for (i = 0; i < 6; i++) {
                if (game.u.ustuck.data.mattk[i].aatyp == 11) {
                    break;
                }
            }
            if (i == 6) {
                await impossible("Swallower has no engulfing attack?");
            } else {
                let sweep = '';
                sweep = '';
                switch (game.u.ustuck.data.mattk[i].adtyp) {
                    case 2:
                        sweep = strcpy(sweep, "ignites and ");
                        break;
                    case 6:
                        sweep = strcpy(sweep, "fries and ");
                        break;
                    case 3:
                        sweep = strcpy(sweep, "freezes, shatters and ");
                        break;
                }
                await pline_The("web %sis swept away!", sweep);
            }
            return 0;
        }
        await pline_The("web dissolves into %s.", await mon_nam(game.u.ustuck));
        return 0;
    }
    if (game.u.utrap) {
        await You("cannot spin webs while stuck in a trap.");
        return 0;
    }
    await exercise(A_DEX, (1));
    if (ttmp) {
        switch (ttmp.ttyp) {
            case PIT:
            case SPIKED_PIT:
                await You("spin a web, covering up the pit.");
                await deltrap(ttmp);
                await bury_objs(x, y);
                await newsym(x, y);
                return 1;
            case SQKY_BOARD:
                await pline_The("squeaky board is muffled.");
                await deltrap(ttmp);
                await newsym(x, y);
                return 1;
            case TELEP_TRAP:
            case LEVEL_TELEP:
            case MAGIC_PORTAL:
            case VIBRATING_SQUARE:
                await Your("webbing vanishes!");
                return 0;
            case WEB:
                await You("make the web thicker.");
                return 1;
            case HOLE:
            case TRAPDOOR:
                await You("web over the %s.", (ttmp.ttyp == TRAPDOOR) ? "trap door" : "hole");
                await deltrap(ttmp);
                await newsym(x, y);
                return 1;
            case ROLLING_BOULDER_TRAP:
                await You("spin a web, jamming the trigger.");
                await deltrap(ttmp);
                await newsym(x, y);
                return 1;
            case ARROW_TRAP:
            case DART_TRAP:
            case BEAR_TRAP:
            case ROCKTRAP:
            case FIRE_TRAP:
            case LANDMINE:
            case SLP_GAS_TRAP:
            case RUST_TRAP:
            case MAGIC_TRAP:
            case ANTI_MAGIC:
            case POLY_TRAP:
                await You("have triggered a trap!");
                await dotrap(ttmp, 0);
                return 1;
            default:
                await impossible("Webbing over trap type %d?", ttmp.ttyp);
                return 0;
        }
    } else if (On_stairs(x, y)) {
        await Your("web fails to impede access to the %s.", (game.level.locations[x][y].typ == STAIRS) ? "stairs" : "ladder");
        return 1;
    }
    ttmp = await maketrap(x, y, WEB);
    if (ttmp) {
        await You("spin a web.");
        ttmp.madeby_u = 1;
        await feeltrap(ttmp);
        if (in_rooms(x, y, SHOPBASE)) {
            await add_damage(x, y, 30);
        }
    }
    return 1;
}
export async function dosummon() {
    let placeholder = 0;
    if (game.u.uen < 10) {
        await You("lack the energy to send forth a call for help!");
        return 0;
    }
    game.u.uen -= 10;
    game.disp.botl = (1);
    await You("call upon your brethren for help!");
    await exercise(A_WIS, (1));
    if (!await were_summon(game.youmonst.data, (1), { get value() { return placeholder; }, set value(_v) { placeholder = _v; } }, null)) {
        await pline("But none arrive.");
    }
    return 1;
}
export async function dogaze() {
    let mtmp = null;
    let looked = 0;
    let qbuf = '';
    let i = 0;
    let adtyp = 0;
    for (i = 0; i < 6; i++) {
        if (game.youmonst.data.mattk[i].aatyp == 15) {
            adtyp = game.youmonst.data.mattk[i].adtyp;
            break;
        }
    }
    if (adtyp != 25 && adtyp != 2) {
        await impossible("gaze attack %d?", adtyp);
        return 0;
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        await You_cant("see anything to gaze at.");
        return 0;
    } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        await You_cant("gaze at anything you can see.");
        return 0;
    }
    if (game.u.uen < 15) {
        await You("lack the energy to use your special gaze!");
        return 0;
    }
    game.u.uen -= 15;
    game.disp.botl = (1);
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (canseemon(mtmp) && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
            looked++;
            if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0)) {
                await pline("%s seems not to notice your gaze.", await Monnam(mtmp));
            } else if (mtmp.minvis && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
                await You_cant("see where to gaze at %s.", await Monnam(mtmp));
            } else if (((mtmp).m_ap_type & 7) == M_AP_FURNITURE || ((mtmp).m_ap_type & 7) == M_AP_OBJECT) {
                looked--;
                continue;
            } else if (game.flags.safe_dog && mtmp.mtame && !game.u.uprops[CONFUSION].intrinsic) {
                await You("avoid gazing at %s.", await y_monnam(mtmp));
            } else {
                if (game.flags.confirm && mtmp.mpeaceful && !game.u.uprops[CONFUSION].intrinsic) {
                    qbuf = sprintf(qbuf, "Really %s %s?", (adtyp == 25) ? "confuse" : "attack", await mon_nam(mtmp));
                    if (await yn_function(qbuf, ynchars, 110, (1)) != 121) {
                        continue;
                    }
                }
                await setmangry(mtmp, (1));
                if (((mtmp).msleeping || !(mtmp).mcanmove) || mtmp.mstun || !mtmp.mcansee || !(((mtmp.data).mflags1 & 4096) == 0)) {
                    looked--;
                    continue;
                }
                if (adtyp == 25) {
                    if (!mtmp.mconf) {
                        await Your("gaze confuses %s!", await mon_nam(mtmp));
                    } else {
                        await pline("%s is getting more and more confused.", await Monnam(mtmp));
                    }
                    mtmp.mconf = 1;
                } else if (adtyp == 2) {
                    let dmg = d(2, 6);
                    let orig_dmg = dmg;
                    let lev = game.u.ulevel;
                    await You("attack %s with a fiery gaze!", await mon_nam(mtmp));
                    if (await Resists_Elem(mtmp, FIRE_RES)) {
                        await pline_The("fire doesn't burn %s!", await mon_nam(mtmp));
                        dmg = 0;
                    }
                    if (lev > rn2(20)) {
                        dmg += await destroy_items(mtmp, 2, orig_dmg);
                        await ignite_items(mtmp.minvent);
                    }
                    if (dmg) {
                        mtmp.mhp -= dmg;
                    }
                    if (((mtmp).mhp < 1)) {
                        await killed(mtmp);
                    }
                }
                /* For consistency with passive() in uhitm.c, this only
                 * affects you if the monster is still alive.
                 */
                if (((mtmp).mhp < 1)) {
                    continue;
                }
                if (mtmp.data == game.mons[PM_FLOATING_EYE] && !mtmp.mcan) {
                    if (!game.u.uprops[FREE_ACTION].extrinsic) {
                        await You("are frozen by %s gaze!", s_suffix(await mon_nam(mtmp)));
                        nomul((game.u.ulevel > 6 || rn2(4)) ? -d(mtmp.m_lev + 1, mtmp.data.mattk[0].damd) : -200);
                        game.multi_reason = "frozen by a monster's gaze";
                        game.nomovemsg = null;
                        return 1;
                    } else {
                        await You("stiffen momentarily under %s gaze.", s_suffix(await mon_nam(mtmp)));
                    }
                }
                if (mtmp.data == game.mons[PM_MEDUSA] && !mtmp.mcan) {
                    await pline("Gazing at the awake %s is not a very good idea.", await l_monnam(mtmp));
                    await urgent_pline("You turn to stone...");
                    game.killer.format = 1;
                    game.killer.name = strcpy(game.killer.name, "deliberately meeting Medusa's gaze");
                    await done(STONING);
                }
            }
        }
    }
    if (!looked) {
        await You("gaze at no place in particular.");
    }
    return 1;
}
/* called by domonability() for #monster */
export async function dohide() {
    let ismimic = game.youmonst.data.mlet == S_MIMIC;
    let on_ceiling = (((game.youmonst.data).mflags1 & 16) != 0) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked);
    if (game.u.ustuck || (game.u.utrap && (game.u.utraptype != TT_PIT || on_ceiling))) {
        await You_cant("hide while you're %s.", !game.u.ustuck ? "trapped" : game.u.uswallow ? ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null) ? "swallowed" : "engulfed") : !sticks(game.youmonst.data) ? "being held" : ((((game.u.ustuck.data).mflags1 & 131072) != 0) ? "holding someone" : "holding that creature"));
        if (game.u.uundetected || (ismimic && (game.youmonst.m_ap_type & 7) != M_AP_NOTHING)) {
            /* only reach here if life-saved */
            game.u.uundetected = 0;
            game.youmonst.m_ap_type = M_AP_NOTHING;
            await newsym(game.u.ux, game.u.uy);
        }
        return 0;
    }
    if (game.youmonst.data.mlet == S_EEL && !is_pool(game.u.ux, game.u.uy)) {
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == FOUNTAIN)) {
            await pline_The("fountain is not deep enough to hide in.");
        } else {
            await There("is no %s to hide in here.", hliquid("water"));
        }
        game.u.uundetected = 0;
        return 0;
    }
    if ((((game.youmonst.data).mflags1 & 128) != 0)) {
        let ct = 0;
        let otmp = null;
        let otop = game.level.objects[game.u.ux][game.u.uy];
        if (!otop) {
            await There("is nothing to hide under here.");
            game.u.uundetected = 0;
            return 0;
        }
        for (otmp = otop; otmp && otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]); otmp = otmp.v.v_nexthere) {
            ct += otmp.quan;
        }
        if (!otmp && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
            /* otmp will be Null iff the entire pile consists of 'trice corpses */
            let kbuf = '';
            let corpse_name = await cxname(otop);
            if (ct == 1) {
                corpse_name = await an(corpse_name);
            }
            await pline("Hiding under %s%s is a fatal mistake...", corpse_name, (((ct) == 1) ? "" : "s"));
            kbuf = sprintf(kbuf, "hiding under %s%s", corpse_name, (((ct) == 1) ? "" : "s"));
            await instapetrify(kbuf);
            game.u.uundetected = 0;
            return 1;
        }
    }
    if (on_ceiling && !has_ceiling(game.u.uz)) {
        await There("is nowhere to hide above you.");
        game.u.uundetected = 0;
        return 0;
    }
    if (((((game.youmonst.data).mflags1 & 256) != 0) && !((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) && ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) {
        await There("is nowhere to hide beneath you.");
        game.u.uundetected = 0;
        return 0;
    }
    if (game.u.uundetected || (ismimic && (game.youmonst.m_ap_type & 7) != M_AP_NOTHING)) {
        await youhiding((0), 1);
        return 0;
    }
    if (ismimic) {
        /* should bring up a dialog "what would you like to imitate?" */
        game.youmonst.m_ap_type = M_AP_OBJECT;
        game.youmonst.mappearance = STRANGE_OBJECT;
    } else {
        game.u.uundetected = 1;
    }
    await newsym(game.u.ux, game.u.uy);
    await youhiding((0), 0);
    return 1;
}
export async function dopoly() {
    let savedat = game.youmonst.data;
    if (((game.youmonst.data).mlet == S_VAMPIRE) || ((game.youmonst).cham == PM_VAMPIRE || (game.youmonst).cham == PM_VAMPIRE_LEADER || (game.youmonst).cham == PM_VLAD_THE_IMPALER)) {
        await polyself(POLY_MONSTER);
        if (savedat != game.youmonst.data) {
            await You("transform into %s.", await an(pmname(game.youmonst.data, (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))));
            await newsym(game.u.ux, game.u.uy);
        }
    }
    return 1;
}
/* #monster for hero-as-mind_flayer giving psychic blast */
export async function domindblast() {
    let mtmp = null;
    let nmon = null;
    let dmg = 0;
    if (game.u.uen < 10) {
        await You("concentrate but lack the energy to maintain doing so.");
        return 0;
    }
    game.u.uen -= 10;
    game.disp.botl = (1);
    await You("concentrate.");
    await pline("A wave of psychic energy pours out.");
    for (mtmp = game.level.monlist; mtmp; mtmp = nmon) {
        let u_sen = 0;
        nmon = mtmp.nmon;
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) > 8 * 8) {
            continue;
        }
        if (mtmp.mpeaceful) {
            continue;
        }
        if ((((mtmp.data).mflags1 & 65536) != 0)) {
            continue;
        }
        u_sen = ((mtmp.data) == game.mons[PM_FLOATING_EYE] || (mtmp.data) == game.mons[PM_MIND_FLAYER] || (mtmp.data) == game.mons[PM_MASTER_MIND_FLAYER]) && !mtmp.mcansee;
        if (u_sen || (((mtmp.data) == game.mons[PM_FLOATING_EYE] || (mtmp.data) == game.mons[PM_MIND_FLAYER] || (mtmp.data) == game.mons[PM_MASTER_MIND_FLAYER]) && rn2(2)) || !rn2(10)) {
            dmg = rnd(15);
            await wakeup(mtmp, (dmg > mtmp.mhp) ? (1) : (0));
            await You("lock in on %s %s.", s_suffix(await mon_nam(mtmp)), u_sen ? "telepathy" : ((mtmp.data) == game.mons[PM_FLOATING_EYE] || (mtmp.data) == game.mons[PM_MIND_FLAYER] || (mtmp.data) == game.mons[PM_MASTER_MIND_FLAYER]) ? "latent telepathy" : "mind");
            mtmp.mhp -= dmg;
            if (((mtmp).mhp < 1)) {
                await killed(mtmp);
            }
        }
    }
    return 1;
}
export async function uunstick() {
    let mtmp = game.u.ustuck;
    if (!mtmp) {
        await impossible("uunstick: no ustuck?");
        return;
    }
    await set_ustuck(null);
    await pline("%s is no longer in your clutches.", await Monnam(mtmp));
}
export async function skinback(silently) {
    if (game.uskin) {
        let old_light = arti_light_radius(game.uskin);
        if (!silently) {
            await Your("skin returns to its original form.");
        }
        game.uarm = game.uskin;
        game.uskin = null;
        game.uarm.owornmask &= ~536870912;
        if (artifact_light(game.uarm)) {
            await maybe_adjust_light(game.uarm, old_light);
        }
    }
}
const __mbodypart_humanoid_parts = ["arm", "eye", "face", "finger", "fingertip", "foot", "hand", "handed", "head", "leg", "light headed", "neck", "spine", "toe", "hair", "blood", "lung", "nose", "stomach"];
const __mbodypart_jelly_parts = ["pseudopod", "dark spot", "front", "pseudopod extension", "pseudopod extremity", "pseudopod root", "grasp", "grasped", "cerebral area", "lower pseudopod", "viscous", "middle", "surface", "pseudopod extremity", "ripples", "juices", "surface", "sensor", "stomach"];
const __mbodypart_animal_parts = ["forelimb", "eye", "face", "foreclaw", "claw tip", "rear claw", "foreclaw", "clawed", "head", "rear limb", "light headed", "neck", "spine", "rear claw tip", "fur", "blood", "lung", "nose", "stomach"];
const __mbodypart_bird_parts = ["wing", "eye", "face", "wing", "wing tip", "foot", "wing", "winged", "head", "leg", "light headed", "neck", "spine", "toe", "feathers", "blood", "lung", "bill", "stomach"];
const __mbodypart_horse_parts = ["foreleg", "eye", "face", "forehoof", "hoof tip", "rear hoof", "forehoof", "hooved", "head", "rear leg", "light headed", "neck", "backbone", "rear hoof tip", "mane", "blood", "lung", "nose", "stomach"];
const __mbodypart_sphere_parts = ["appendage", "optic nerve", "body", "tentacle", "tentacle tip", "lower appendage", "tentacle", "tentacled", "body", "lower tentacle", "rotational", "equator", "body", "lower tentacle tip", "cilia", "life force", "retina", "olfactory nerve", "interior"];
const __mbodypart_fungus_parts = ["mycelium", "visual area", "front", "hypha", "hypha", "root", "strand", "stranded", "cap area", "rhizome", "sporulated", "stalk", "root", "rhizome tip", "spores", "juices", "gill", "gill", "interior"];
const __mbodypart_vortex_parts = ["region", "eye", "front", "minor current", "minor current", "lower current", "swirl", "swirled", "central core", "lower current", "addled", "center", "currents", "edge", "currents", "life force", "center", "leading edge", "interior"];
const __mbodypart_snake_parts = ["vestigial limb", "eye", "face", "large scale", "large scale tip", "rear region", "scale gap", "scale gapped", "head", "rear region", "light headed", "neck", "length", "rear scale", "scales", "blood", "lung", "forked tongue", "stomach"];
const __mbodypart_worm_parts = ["anterior segment", "light sensitive cell", "clitellum", "setae", "setae", "posterior segment", "segment", "segmented", "anterior segment", "posterior", "over stretched", "clitellum", "length", "posterior setae", "setae", "blood", "skin", "prostomium", "stomach"];
const __mbodypart_spider_parts = ["pedipalp", "eye", "face", "pedipalp", "tarsus", "claw", "pedipalp", "palped", "cephalothorax", "leg", "spun out", "cephalothorax", "abdomen", "claw", "hair", "hemolymph", "book lung", "labrum", "digestive tract"];
const __mbodypart_fish_parts = ["fin", "eye", "premaxillary", "pelvic axillary", "pelvic fin", "anal fin", "pectoral fin", "finned", "head", "peduncle", "played out", "gills", "dorsal fin", "caudal fin", "scales", "blood", "gill", "nostril", "stomach"];
/* string terminator; assert( S_xxx != 0 ); */
const __mbodypart_not_claws = [S_HUMAN, S_MUMMY, S_ZOMBIE, S_ANGEL, S_NYMPH, S_LEPRECHAUN, S_QUANTMECH, S_VAMPIRE, S_ORC, S_GIANT, 0];
export async function mbodypart(mon, part) {
    /* claw attacks are overloaded in mons[]; most humanoids with
       such attacks should still reference hands rather than claws */
    let mptr = mon.data;
    if (part <= NO_PART) {
        await impossible("mbodypart: bad part %d", part);
        return "mystery part";
    }
    if (mptr.mlet == S_DOG || mptr.mlet == S_FELINE || mptr.mlet == S_RODENT || mptr == game.mons[PM_OWLBEAR]) {
        switch (part) {
            case HAND:
                return "paw";
            case HANDED:
                return "pawed";
            case FOOT:
                return "rear paw";
            case ARM:
            case LEG:
                return __mbodypart_horse_parts[part];
            default:
                break;
        }
    } else if (mptr.mlet == S_YETI) {
        /* excl. owlbear due to 'if' above */
        /* opposable thumbs, hence "hands", "arms", "legs", &c */
        /* yeti/sasquatch, monkey/ape */
        return __mbodypart_humanoid_parts[part];
    }
    if ((part == HAND || part == HANDED) && ((((mptr).mflags1 & 131072) != 0) && attacktype(mptr, 1) && !strchr(__mbodypart_not_claws, mptr.mlet) && mptr != game.mons[PM_STONE_GOLEM] && mptr != game.mons[PM_AMOROUS_DEMON])) {
        return (part == HAND) ? "claw" : "clawed";
    }
    if ((mptr == game.mons[PM_MUMAK] || mptr == game.mons[PM_MASTODON]) && part == NOSE) {
        return "trunk";
    }
    if (mptr == game.mons[PM_SHARK] && part == HAIR) {
        return "skin";
    }
    /* sharks don't have scales */
    if ((mptr == game.mons[PM_JELLYFISH] || mptr == game.mons[PM_KRAKEN]) && (part == ARM || part == FINGER || part == HAND || part == FOOT || part == TOE)) {
        return "tentacle";
    }
    if (mptr == game.mons[PM_FLOATING_EYE] && part == EYE) {
        return "cornea";
    }
    if ((((mptr).mflags1 & 131072) != 0) && (part == ARM || part == FINGER || part == FINGERTIP || part == HAND || part == HANDED)) {
        return __mbodypart_humanoid_parts[part];
    }
    if (mptr.mlet == S_COCKATRICE) {
        return (part == HAIR) ? __mbodypart_snake_parts[part] : __mbodypart_bird_parts[part];
    }
    if (mptr == game.mons[PM_RAVEN]) {
        return __mbodypart_bird_parts[part];
    }
    if (mptr.mlet == S_CENTAUR || mptr.mlet == S_UNICORN || mptr == game.mons[PM_KI_RIN] || (mptr == game.mons[PM_ROTHE] && part != HAIR)) {
        return __mbodypart_horse_parts[part];
    }
    if (mptr.mlet == S_LIGHT) {
        if (part == HANDED) {
            return "rayed";
        } else if (part == ARM || part == FINGER || part == FINGERTIP || part == HAND) {
            return "ray";
        } else {
            return "beam";
        }
    }
    if (mptr == game.mons[PM_STALKER] && part == HEAD) {
        return "head";
    }
    if (mptr.mlet == S_EEL && mptr != game.mons[PM_JELLYFISH]) {
        return __mbodypart_fish_parts[part];
    }
    if (mptr.mlet == S_WORM) {
        return __mbodypart_worm_parts[part];
    }
    if (mptr.mlet == S_SPIDER) {
        return __mbodypart_spider_parts[part];
    }
    if ((((mptr).mflags1 & 524288) != 0) || (mptr.mlet == S_DRAGON && part == HAIR)) {
        return __mbodypart_snake_parts[part];
    }
    if (mptr.mlet == S_EYE) {
        return __mbodypart_sphere_parts[part];
    }
    if (mptr.mlet == S_JELLY || mptr.mlet == S_PUDDING || mptr.mlet == S_BLOB || mptr == game.mons[PM_JELLYFISH]) {
        return __mbodypart_jelly_parts[part];
    }
    if (mptr.mlet == S_VORTEX || mptr.mlet == S_ELEMENTAL) {
        return __mbodypart_vortex_parts[part];
    }
    if (mptr.mlet == S_FUNGUS) {
        return __mbodypart_fungus_parts[part];
    }
    if ((((mptr).mflags1 & 131072) != 0)) {
        return __mbodypart_humanoid_parts[part];
    }
    return __mbodypart_animal_parts[part];
}
export async function body_part(part) {
    return await mbodypart(game.youmonst, part);
}
export function poly_gender() {
    /* Returns gender of polymorphed player;
     * 0/1=same meaning as flags.female, 2=none.
     */
    if ((((game.youmonst.data).mflags2 & 262144) != 0) || !(((game.youmonst.data).mflags1 & 131072) != 0)) {
        return 2;
    }
    return game.flags.female;
}
export async function ugolemeffects(damtype, dam) {
    let heal = 0;
    /* We won't bother with "slow"/"haste" since players do not
     * have a monster-specific slow/haste so there is no way to
     * restore the old velocity once they are back to human.
     */
    if (game.u.umonnum != PM_FLESH_GOLEM && game.u.umonnum != PM_IRON_GOLEM) {
        return;
    }
    switch (damtype) {
        case 6:
            if (game.u.umonnum == PM_FLESH_GOLEM) {
                heal = Math.trunc((dam + 5) / 6);
            }
            break;
        case 2:
            if (game.u.umonnum == PM_IRON_GOLEM) {
                heal = dam;
            }
            break;
    }
    if (heal && (game.u.mh < game.u.mhmax)) {
        game.u.mh += heal;
        if (game.u.mh > game.u.mhmax) {
            game.u.mh = game.u.mhmax;
        }
        game.disp.botl = (1);
        await pline("Strangely, you feel better than before.");
        await exercise(A_STR, (1));
    }
}
export function armor_to_dragon(atyp) {
    switch (atyp) {
        case GRAY_DRAGON_SCALE_MAIL:
        case GRAY_DRAGON_SCALES:
            return PM_GRAY_DRAGON;
        case SILVER_DRAGON_SCALE_MAIL:
        case SILVER_DRAGON_SCALES:
            return PM_SILVER_DRAGON;
        case GOLD_DRAGON_SCALE_MAIL:
        case GOLD_DRAGON_SCALES:
            return PM_GOLD_DRAGON;
        case RED_DRAGON_SCALE_MAIL:
        case RED_DRAGON_SCALES:
            return PM_RED_DRAGON;
        case ORANGE_DRAGON_SCALE_MAIL:
        case ORANGE_DRAGON_SCALES:
            return PM_ORANGE_DRAGON;
        case WHITE_DRAGON_SCALE_MAIL:
        case WHITE_DRAGON_SCALES:
            return PM_WHITE_DRAGON;
        case BLACK_DRAGON_SCALE_MAIL:
        case BLACK_DRAGON_SCALES:
            return PM_BLACK_DRAGON;
        case BLUE_DRAGON_SCALE_MAIL:
        case BLUE_DRAGON_SCALES:
            return PM_BLUE_DRAGON;
        case GREEN_DRAGON_SCALE_MAIL:
        case GREEN_DRAGON_SCALES:
            return PM_GREEN_DRAGON;
        case YELLOW_DRAGON_SCALE_MAIL:
        case YELLOW_DRAGON_SCALES:
            return PM_YELLOW_DRAGON;
        default:
            return NON_PM;
    }
}
/* some species have awareness of other species */
export function polysense() {
    let warnidx = NON_PM;
    game.context.warntype.speciesidx = NON_PM;
    game.context.warntype.species = null;
    game.context.warntype.polyd = 0;
    game.u.uprops[WARN_OF_MON].intrinsic &= ~33554432;
    switch (game.u.umonnum) {
        case PM_PURPLE_WORM:
        case PM_BABY_PURPLE_WORM:
            warnidx = PM_SHRIEKER;
            break;
        case PM_VAMPIRE:
        case PM_VAMPIRE_LEADER:
            game.context.warntype.polyd = 8 | 16;
            game.u.uprops[WARN_OF_MON].intrinsic |= 33554432;
            return;
    }
    if (((warnidx) >= LOW_PM && (warnidx) < NUMMONS)) {
        game.context.warntype.speciesidx = warnidx;
        game.context.warntype.species = game.mons[warnidx];
        game.u.uprops[WARN_OF_MON].intrinsic |= 33554432;
    }
}
/* True iff hero's role or race has been genocided */
export function ugenocided() {
    return ((game.mvitals[game.urole.mnum].mvflags & 2) || (game.mvitals[game.urace.mnum].mvflags & 2));
}
/* how hero feels "inside" after self-genocide of role or race */
export function udeadinside() {
    /* self-genocide used to always say "you feel dead inside" but that
       seems silly when you're polymorphed into something undead;
       monkilled() distinguishes between living (killed) and non (destroyed)
       for monster death message; we refine the nonliving aspect a bit */
    return !((((game.youmonst.data).mflags2 & 2) != 0) || (game.youmonst.data) == game.mons[PM_MANES] || (((game.youmonst.data).mlet == S_GOLEM) || (game.youmonst.data).mlet == S_VORTEX)) ? "dead" : !(((game.youmonst.data).mlet == S_GOLEM) || (game.youmonst.data).mlet == S_VORTEX) ? "condemned" : "empty";
}
/*polyself.c*/
/* assume hero-as-chameleon/doppelganger/sandestin doesn't change shape */
/* resists_magm() takes wielded, worn, and carried equipment into
       into account; cheat and duplicate its monster-specific part */
/* off -- maybe block strangling */
/* change monster type to match new sex; disabled with
           PM_AMOROUS_DEMON */
/* old level is still intact (in case of lifesaving) */
/* hpmax * rn1(4,8) / 10; 0.95*hpmax on average */
/* retain same proportion for current HP; u.uhp * hpmax / u.uhpmax */
/* we come directly here if experience level went to 0 or less */
/* must have been life-saved to get here */
/* used to be done by redist_attr() */
/* being Stunned|Unaware doesn't negate this aspect of Poly_control */
/* "priest" and "priestess" match the monster
                              rather than the role; override that unless
                              the text explicitly contains "aligned" */
/* in wizard mode, picking own role while poly'd reverts to
                   normal without newman()'s chance of level or sex change */
/* dragon scales remain intact as uskin */
/* tricky phrasing; dragon scale mail is singular, dragon
                       scales are plural (note: we don't use "set of scales",
                       which usually overrides the distinction, here) */
/* if polymon fails, "you feel" message has been given
           so don't follow up with another polymon or newman;
           sex_change_ok left disabled here */
/* otherwise it's undetectable */
/* exercise used to be at the very end but only Wis was affected
       there since the polymorph was always in effect by then */
/* parnes@eniac.seas.upenn.edu */
/* if hiding under something and can't hide anymore, unhide now;
       but don't auto-hide when not already hiding-under */
/* was holding onto u.ustuck but no longer capable of that */
/* if expelled above, expels() already called spoteffects() */
/* FIXME? if spoteffects() triggered rehumanize then we should
           return early */
/* probably should burn webs too if PM_FIRE_ELEMENTAL */
/* this might trigger a recursive call to polymon() [stone golem
       wielding cockatrice corpse and hit by stone-to-flesh, becomes
       flesh golem above, now gets transformed back into stone golem;
       fortunately neither form uses #monster] */
/*
     * Dropping worn armor while polymorphing might put hero into water
     * (loss of levitation boots or water walking boots that the new
     * form can't wear), where emergency_disrobe() could remove it from
     * inventory.  Without this, dropx() could trigger an 'object lost'
     * panic.  Right now, boots are the only armor which might encounter
     * this situation, but handle it for all armor.
     *
     * Hypothetically, 'obj' could have merged with something (not
     * applicable for armor) and no longer be a valid pointer, so scan
     * inventory for it instead of trusting obj->where.
     */
/* for gold DSM, we don't want Armor_gone() to report that it
               stops shining _after_ we've been told that it is destroyed */
/* mummy wrapping adapts to small and very big sizes */
/* doesn't have a clasp to break open */
/* [note: _gone() instead of _off() dates to when life-saving
               could force fire resisting armor back on if hero burned in
               hell (3.0, predating Gehennom); the armor isn't actually
               gone here but also isn't available to be put back on] */
/* Future possibilities: This could damage/destroy helmet */
/* Drop weapon along with gloves */
/* Glib manipulation (ends immediately) handled by Gloves_off */
/* Null: skip usual off mesg */
/* !alone check below is currently superfluous but in the
         * future it might not be so if there are monsters which cannot
         * wear gloves but can wield weapons
         */
/* can only happen if some bit of code reduces u.uhp
           instead of u.mh while poly'd */
/* [at the time this was written, it was not possible to be both a
       webmaker and a flyer, but with the advent of amulet of flying that
       became a possibility; at present hero can spin a web while flying] */
/* default: a nasty jelly-like creature */
/* cop out: don't let them hide the stairs */
/* No reflection check for consistency with when a monster
                 * gazes at *you*--only medusa gaze gets reflected then.
                 */
/* Technically this one shouldn't affect you at all because
                 * the Medusa gaze is an active monster attack that only
                 * works on the monster's turn, but for it to *not* have an
                 * effect would be too weird.
                 */
/* as if gazing at a sleeping anything is fruitful... */
/* can't hide while being held (or holding) or while trapped
       (except for floor hiders [trapper or mimic] in pits) */
/* note: hero-as-eel handling is incomplete but unnecessary;
       such critters aren't offered the option of hiding via #monster */
/* for the plural case, we'll say "cockatrice corpses" or
               "chickatrice corpses" depending on the top of the pile
               even if both types are present */
/* no need to check poly_when_stoned(); no hide-underers can
               turn into stone golems instead of becoming petrified */
/* TODO? inhibit floor hiding at furniture locations, or
     * else make youhiding() give smarter messages at such spots.
     */
/* "you are already hiding" */
/* wake it up first, to bring hidden monster out of hiding;
               but in case it is currently peaceful, don't make it hostile
               unless it will survive the psychic blast, otherwise hero
               would avoid the penalty for killing it while peaceful */
/* for other parts, use animal_parts[] below */
/* living, including demons */
