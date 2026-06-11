import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';
/* NetHack 5.0	makemon.c	$NHDT-Date: 1770949988 2026/02/12 18:33:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.271 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/* this assumes that a human quest leader or nemesis is an archetype
   of the corresponding role; that isn't so for some roles (tourist
   for instance) but is for the priests and monks we use it for... */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { pline, raw_printf } from '../c2js-runtime/pline.js';
import { qsort } from '../c2js-runtime/qsort.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { is_art } from './artifact.js';
import { isok } from './cmd.js';
import { c_common_strings, cg } from './decl.js';
import { canseemon, newsym, sensemon } from './display.js';
import { Amonnam, Mgender, YMonnam, christen_monst, mon_nam, oname, pmname, rndghostname } from './do_name.js';
import { newedog, tamedog } from './dog.js';
import { deliver_obj_to_mon } from './dokick.js';
import { def_monsyms } from './drawing.js';
import { In_V_tower, In_hell, In_mines, In_quest, Is_special, depth, level_difficulty, on_level } from './dungeon.js';
import { in_town, monst_to_any, obj_to_any } from './hack.js';
import { dist2, upstart } from './hacklib.js';
import { consume_obj_charge, update_inventory } from './invent.js';
import { new_light_source } from './light.js';
import { newemin } from './minion.js';
import { add_to_container, add_to_minv, bless, curse, discard_minvent, mkobj, mkobj_at, mksobj, next_ident, rndmonnum, set_corpsenm, weight } from './mkobj.js';
import { can_be_hatched, hideunder, mondied, mongone, newcham, pm_to_cham } from './mon.js';
import { attacktype, little_to_big, mon_learns_traps, pronoun_gender, set_mon_data } from './mondata.js';
import { dochugw, mon_track_clear, set_apparxy } from './monmove.js';
import { monst_globals_init } from './monst.js';
import { rnd_defensive_item, rnd_misc_item, rnd_offensive_item } from './muse.js';
import { AKLYS, ALL_TRAPS, AMULET_CLASS, ARMOR_CLASS, ARROW, ART_DEMONBANE, ART_EXCALIBUR, ATHAME, AXE, BAG_OF_TRICKS, BANDED_MAIL, BATTLE_AXE, BEC_DE_CORBIN, BELL_OF_OPENING, BLCORNER, BLINDED, BOULDER, BOW, BROADSWORD, BUGLE, BULLWHIP, CANDELABRUM_OF_INVOCATION, CHAIN_MAIL, CLOAK_OF_MAGIC_RESISTANCE, CLOAK_OF_PROTECTION, CLUB, COIN_CLASS, CORPSE, CREAM_PIE, CROSSBOW, CROSSBOW_BOLT, CROSSWALL, CRYSTAL_BALL, CRYSTAL_PLATE_MAIL, C_RATION, DAGGER, DART, DBWALL, DELPHI, DENTED_POT, DILITHIUM_CRYSTAL, DOOR, DWARVISH_CLOAK, DWARVISH_IRON_HELM, DWARVISH_MATTOCK, DWARVISH_MITHRIL_COAT, DWARVISH_ROUNDSHIELD, DWARVISH_SHORT_SWORD, DWARVISH_SPEAR, EGG, ELVEN_ARROW, ELVEN_BOOTS, ELVEN_BOW, ELVEN_BROADSWORD, ELVEN_CLOAK, ELVEN_DAGGER, ELVEN_LEATHER_HELM, ELVEN_MITHRIL_COAT, ELVEN_SHIELD, ELVEN_SHORT_SWORD, ELVEN_SPEAR, FIGURINE, FLAIL, FLINT, FODDERSHOP, FOOD_CLASS, GEM_CLASS, GLAIVE, GOLD_PIECE, HELMET, HIGH_BOOTS, HOLE, HWALL, IRON_SHOES, KNIFE, K_RATION, LARGE_BOX, LARGE_SHIELD, LEATHER_ARMOR, LEATHER_CLOAK, LEATHER_GLOVES, LEATHER_JACKET, LONG_SWORD, LOW_BOOTS, LOW_PM, LS_MONSTER, LUCERN_HAMMER, LUCKSTONE, LUMP_OF_ROYAL_JELLY, MACE, MAXMCLASSES, MAXOCLASSES, MIRROR, MS_BRIBE, MS_GUARDIAN, MS_LEADER, MS_NEMESIS, MS_PRIEST, MUMMY_WRAPPING, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, M_SEEN_NOTHING, NEUTRAL, NON_PM, NUMMONS, ORCISH_ARROW, ORCISH_BOW, ORCISH_CHAIN_MAIL, ORCISH_CLOAK, ORCISH_DAGGER, ORCISH_HELM, ORCISH_SHIELD, ORCISH_SHORT_SWORD, PARTISAN, PICK_AXE, PIT, PLATE_MAIL, PM_ABBOT, PM_ACOLYTE, PM_AIR_ELEMENTAL, PM_ALIGNED_CLERIC, PM_ANGEL, PM_APPRENTICE, PM_ARCHEOLOGIST, PM_ARCH_LICH, PM_ASMODEUS, PM_ATTENDANT, PM_BABY_GOLD_DRAGON, PM_BALROG, PM_BAT, PM_BLACK_LIGHT, PM_CAPTAIN, PM_CHIEFTAIN, PM_CLAY_GOLEM, PM_CLERIC, PM_CROESUS, PM_DEATH, PM_DISPATER, PM_EARTH_ELEMENTAL, PM_ELF, PM_ELVEN_MONARCH, PM_ERINYS, PM_ETTIN, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLESH_GOLEM, PM_FOREST_CENTAUR, PM_GHOST, PM_GIANT, PM_GIANT_BAT, PM_GIANT_EEL, PM_GLASS_GOLEM, PM_GOBLIN, PM_GOLD_DRAGON, PM_GOLD_GOLEM, PM_GRAY_DRAGON, PM_GUARD, PM_GUIDE, PM_HIGH_CLERIC, PM_HOBBIT, PM_HORNED_DEVIL, PM_HOUSECAT, PM_HUMAN, PM_HUNTER, PM_ICE_DEVIL, PM_IRON_GOLEM, PM_KILLER_BEE, PM_LEATHER_GOLEM, PM_LIEUTENANT, PM_LONG_WORM, PM_MAIL_DAEMON, PM_MANES, PM_MASTER_LICH, PM_MINOTAUR, PM_MONK, PM_MORDOR_ORC, PM_NAZGUL, PM_NEANDERTHAL, PM_NINJA, PM_OGRE_LEADER, PM_OGRE_TYRANT, PM_ORC, PM_ORCUS, PM_ORC_CAPTAIN, PM_ORC_SHAMAN, PM_PAGE, PM_PAPER_GOLEM, PM_PESTILENCE, PM_QUANTUM_MECHANIC, PM_QUEEN_BEE, PM_RAVEN, PM_ROPE_GOLEM, PM_ROSHI, PM_SALAMANDER, PM_SERGEANT, PM_SHOCKING_SPHERE, PM_SHOPKEEPER, PM_SOLDIER, PM_STALKER, PM_STONE_GOLEM, PM_STRAW_GOLEM, PM_STUDENT, PM_THUG, PM_URUK_HAI, PM_VAMPIRE_BAT, PM_VLAD_THE_IMPALER, PM_WARRIOR, PM_WATCHMAN, PM_WATCH_CAPTAIN, PM_WATER_ELEMENTAL, PM_WIZARD, PM_WIZARD_OF_YENDOR, PM_WOOD_GOLEM, PM_WUMPUS, PM_YEENOGHU, POTION_CLASS, POT_EXTRA_HEALING, POT_HEALING, POT_OBJECT_DETECTION, POT_SICKNESS, PROT_FROM_SHAPE_CHANGERS, P_POLEARMS, P_SABER, P_SHORT_SWORD, QUARTERSTAFF, RANDOM_CLASS, RANSEUR, RING_CLASS, RING_MAIL, RIN_INVISIBILITY, ROBE, ROCK, ROCK_CLASS, ROT_CORPSE, RUBBER_HOSE, SCIMITAR, SCORR, SCROLL_CLASS, SDOOR, SHIELD_OF_REFLECTION, SHOPBASE, SHORT_SWORD, SHURIKEN, SILVER_MACE, SILVER_SABER, SKELETON_KEY, SLIME_MOLD, SLING, SMALL_SHIELD, SPBOOK_CLASS, SPEAR, SPECIAL_PM, SPETUM, SPE_BOOK_OF_THE_DEAD, SPE_DIG, SPLINT_MAIL, STATUE, STILETTO, STRANGE_OBJECT, STUDDED_LEATHER_ARMOR, S_ANGEL, S_BAT, S_CENTAUR, S_DEMON, S_DRAGON, S_EEL, S_ELEMENTAL, S_EYE, S_GHOST, S_GIANT, S_GNOME, S_GOLEM, S_HUMAN, S_HUMANOID, S_JABBERWOCK, S_KOBOLD, S_KOP, S_LEPRECHAUN, S_LICH, S_LIGHT, S_LIZARD, S_MIMIC, S_MIMIC_DEF, S_MUMMY, S_NYMPH, S_OGRE, S_ORC, S_QUANTMECH, S_SNAKE, S_SPIDER, S_TRAPPER, S_TROLL, S_UNICORN, S_VORTEX, S_WRAITH, S_ZOMBIE, S_altar, S_dnstair, S_fountain, S_grave, S_hcdoor, S_hwall, S_sink, S_throne, S_upstair, S_vcdoor, S_vwall, TALLOW_CANDLE, TDWALL, TEMPLE, TIN, TIN_WHISTLE, TLCORNER, TOOL_CLASS, TRAPDOOR, TRIDENT, TRWALL, TUWALL, TWO_HANDED_SWORD, URUK_HAI_SHIELD, VAULT, WAND_CLASS, WAN_COLD, WAN_DEATH, WAN_DIGGING, WAN_FIRE, WAN_MAGIC_MISSILE, WAN_NOTHING, WAN_STRIKING, WAX_CANDLE, WEAPON_CLASS, ZOO, _ISupper } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { an, makeplural, rnd_class, vtense } from './objnam.js';
import { mhidden_description } from './pager.js';
import { Norep, pline_mon, set_msg_xy } from './pline.js';
import { mon_aligntyp, newepri } from './priest.js';
import { qt_montype, quest_info } from './questpgr.js';
import { create_particular } from './read.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { obfree } from './shk.js';
import { get_shop_item, neweshk, shkname } from './shknam.js';
import { findgold, mpickobj } from './steal.js';
import { can_saddle, place_monster, put_saddle_on_mon } from './steed.js';
import { enexto, enexto_core, enexto_gpflags, goodpos } from './teleport.js';
import { begin_burn, stop_timer } from './timeout.js';
import { t_at } from './trap.js';
import { newegd } from './vault.js';
import { block_point, does_block } from './vision.js';
import { count_wsegs, get_wormno, initworm, place_worm_tail_randomly } from './worm.js';
import { m_dowear, mon_adjust_speed, mon_set_minvis, which_armor } from './worn.js';

export function is_home_elemental(ptr) {
    if (ptr.mlet == S_ELEMENTAL) {
        switch (((ptr).pmidx)) {
            case PM_AIR_ELEMENTAL:
                return (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))));
            case PM_FIRE_ELEMENTAL:
                return (((((game.dungeon_topology.d_fire_level)).dlevel || ((game.dungeon_topology.d_fire_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_fire_level))));
            case PM_EARTH_ELEMENTAL:
                return (((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level))));
            case PM_WATER_ELEMENTAL:
                return (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))));
            default:
                break;
        }
    }
    return (0);
}
/*
 * Return true if the given monster cannot exist on this elemental level.
 */
export function wrong_elem_type(ptr) {
    if (ptr.mlet == S_ELEMENTAL) {
        return !is_home_elemental(ptr);
    } else if ((((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level))))) {} else if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        /* just monsters that can swim */
        if (!(((ptr).mflags1 & 2) != 0)) {
            return (1);
        }
    } else if ((((((game.dungeon_topology.d_fire_level)).dlevel || ((game.dungeon_topology.d_fire_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_fire_level))))) {
        if (!(((ptr).mresists & (1)) != 0)) {
            return (1);
        }
    } else if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        if (!((((ptr).mflags1 & 1) != 0) && ptr.mlet != S_TRAPPER) && !((ptr).mlet == S_EYE || (ptr).mlet == S_LIGHT) && !(((ptr).mflags1 & 4) != 0) && !((ptr).mlet == S_GHOST) && !((ptr).mlet == S_VORTEX || (ptr) == game.mons[PM_AIR_ELEMENTAL])) {
            return (1);
        }
    }
    return (0);
}
/* make a group just like mtmp */
export function m_initgrp(mtmp, x, y, n, mmflags) {
    fnEnter("m_initgrp", "makemon.c", 0);
    let mm = { x: 0, y: 0 };
    let cnt = rnd(n);
    let mon = null;
    /* There is an unresolved problem with several people finding that
     * the game hangs eating CPU; if interrupted and restored, the level
     * will be filled with monsters.  Of those reports giving system type,
     * there were two DG/UX and two HP-UX, all using gcc as the compiler.
     * hcroft@hpopb1.cern.ch, using gcc 2.6.3 on HP-UX, says that the
     * problem went away for him and another reporter-to-newsgroup
     * after adding this debugging code.  This has almost got to be a
     * compiler bug, but until somebody tracks it down and gets it fixed,
     * might as well go with the "but it went away when I tried to find
     * it" code.
     */
    /* Tuning: cut down on swarming at low character levels [mrs] */
    cnt = Math.trunc(cnt / ((game.u.ulevel < 3) ? 4 : (game.u.ulevel < 5) ? 2 : 1));
    if (!cnt) {
        cnt++;
    }
    mm.x = x;
    mm.y = y;
    while (cnt--) {
        if (peace_minded(mtmp.data)) {
            continue;
        }
        if (enexto_gpflags(mm, mm.x, mm.y, mtmp.data, mmflags)) {
            /* Don't create groups of peaceful monsters since they'll get
         * in our way.  If the monster has a percentage chance so some
         * are peaceful and some are not, the result will just be a
         * smaller group.
         */
            mon = makemon(mtmp.data, mm.x, mm.y, (mmflags | 8192));
            if (mon) {
                mon.mpeaceful = (0);
                mon.mavenge = 0;
                /* Undo the second peace_minded() check in makemon(); if the
                 * monster turned out to be peaceful the first time we
                 * didn't create it at all; we don't want a second check.
                 */
                set_malign(mon);
            }
        }
    }
}
export function m_initthrow(mtmp, otyp, oquan) {
    fnEnter("m_initthrow", "makemon.c", 0);
    let otmp = null;
    otmp = mksobj(otyp, (1), (0));
    otmp.quan = (rn2(oquan) + (3));
    otmp.owt = weight(otmp);
    if (otyp == ORCISH_ARROW) {
        otmp.otrapped = (1);
    }
    mpickobj(mtmp, otmp);
}
export function m_initweap(mtmp) {
    fnEnter("m_initweap", "makemon.c", 0);
    let ptr = mtmp.data;
    let mm = ((ptr).pmidx);
    let otmp = null;
    let bias = 0;
    let w1 = 0;
    let w2 = 0;
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        return;
    }
    switch (ptr.mlet) {
        /*
     *  First a few special cases:
     *          giants get a boulder to throw sometimes
     *          ettins get clubs
     *          kobolds get darts to throw
     *          centaurs get some sort of bow & arrows or bolts
     *          soldiers get all sorts of things
     *          kops get clubs & cream pies.
     */
        case S_GIANT:
            if (rn2(2)) {
                mongets(mtmp, (mm != PM_ETTIN) ? BOULDER : CLUB);
            }
            if ((mm != PM_ETTIN) && !rn2(5)) {
                mongets(mtmp, rn2(2) ? TWO_HANDED_SWORD : BATTLE_AXE);
            }
            break;
        case S_HUMAN:
            if ((((ptr).mflags2 & 512) != 0)) {
                w1 = w2 = 0;
                switch (mm) {
                    case PM_WATCHMAN:
                    case PM_SOLDIER:
                        if (!rn2(3)) {
                            /* lance and dwarvish mattock used to be in midst of
                       the polearms but use different skills from polearms
                       and aren't appropriates choices for human soldiers */
                            do {
                                w1 = (rn2(BEC_DE_CORBIN - PARTISAN + 1) + (PARTISAN));
                            } while (game.objects[w1].oc_subtyp != P_POLEARMS);
                            w2 = rn2(2) ? DAGGER : KNIFE;
                        } else {
                            w1 = rn2(2) ? SPEAR : SHORT_SWORD;
                        }
                        break;
                    case PM_SERGEANT:
                        w1 = rn2(2) ? FLAIL : MACE;
                        break;
                    case PM_LIEUTENANT:
                        w1 = rn2(2) ? BROADSWORD : LONG_SWORD;
                        break;
                    case PM_CAPTAIN:
                    case PM_WATCH_CAPTAIN:
                        w1 = rn2(2) ? LONG_SWORD : SILVER_SABER;
                        break;
                    default:
                        if (!rn2(4)) {
                            w1 = DAGGER;
                        }
                        if (!rn2(7)) {
                            w2 = SPEAR;
                        }
                        break;
                }
                if (w1) {
                    mongets(mtmp, w1);
                }
                if (!w2 && w1 != DAGGER && !rn2(4)) {
                    w2 = KNIFE;
                }
                if (w2) {
                    mongets(mtmp, w2);
                }
            } else if ((((ptr).mflags2 & 16) != 0)) {
                if (rn2(2)) {
                    mongets(mtmp, rn2(2) ? ELVEN_MITHRIL_COAT : ELVEN_CLOAK);
                }
                if (rn2(2)) {
                    mongets(mtmp, ELVEN_LEATHER_HELM);
                } else if (!rn2(4)) {
                    mongets(mtmp, ELVEN_BOOTS);
                }
                if (rn2(2)) {
                    mongets(mtmp, ELVEN_DAGGER);
                }
                switch (rn2(3)) {
                    case 0:
                        if (!rn2(4)) {
                            mongets(mtmp, ELVEN_SHIELD);
                        }
                        if (rn2(3)) {
                            mongets(mtmp, ELVEN_SHORT_SWORD);
                        }
                        mongets(mtmp, ELVEN_BOW);
                        m_initthrow(mtmp, ELVEN_ARROW, 12);
                        break;
                    case 1:
                        mongets(mtmp, ELVEN_BROADSWORD);
                        if (rn2(2)) {
                            mongets(mtmp, ELVEN_SHIELD);
                        }
                        break;
                    case 2:
                        if (rn2(2)) {
                            mongets(mtmp, ELVEN_SPEAR);
                            mongets(mtmp, ELVEN_SHIELD);
                        }
                        break;
                }
                if (mm == PM_ELVEN_MONARCH) {
                    if (rn2(3) || (game.in_mklev && (((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level)))))) {
                        mongets(mtmp, PICK_AXE);
                    }
                    if (!rn2(50)) {
                        mongets(mtmp, CRYSTAL_BALL);
                    }
                }
            } else if (ptr.msound == MS_PRIEST || (ptr.mlet == S_HUMAN && (game.urole.mnum == (PM_CLERIC)) && (ptr.msound == MS_LEADER || ptr.msound == MS_NEMESIS))) {
                otmp = mksobj(MACE, (0), (0));
                otmp.spe = rnd(3);
                if (!rn2(2)) {
                    curse(otmp);
                }
                mpickobj(mtmp, otmp);
            } else if (mm == PM_NINJA) {
                mongets(mtmp, rn2(4) ? SHURIKEN : DART);
                mongets(mtmp, rn2(4) ? SHORT_SWORD : AXE);
            } else if (ptr.msound == MS_GUARDIAN) {
                switch (mm) {
                    case PM_STUDENT:
                    case PM_ATTENDANT:
                    case PM_ABBOT:
                    case PM_ACOLYTE:
                    case PM_GUIDE:
                    case PM_APPRENTICE:
                        if (rn2(2)) {
                            mongets(mtmp, rn2(3) ? DAGGER : KNIFE);
                        }
                        if (rn2(5)) {
                            mongets(mtmp, rn2(3) ? LEATHER_JACKET : LEATHER_CLOAK);
                        }
                        if (rn2(3)) {
                            mongets(mtmp, rn2(3) ? LOW_BOOTS : HIGH_BOOTS);
                        }
                        if (rn2(3)) {
                            mongets(mtmp, POT_HEALING);
                        }
                        break;
                    case PM_CHIEFTAIN:
                    case PM_PAGE:
                    case PM_ROSHI:
                    case PM_WARRIOR:
                        mongets(mtmp, rn2(3) ? LONG_SWORD : SHORT_SWORD);
                        mongets(mtmp, rn2(3) ? CHAIN_MAIL : LEATHER_ARMOR);
                        if (rn2(2)) {
                            mongets(mtmp, rn2(2) ? LOW_BOOTS : HIGH_BOOTS);
                        }
                        if (!rn2(3)) {
                            mongets(mtmp, LEATHER_CLOAK);
                        }
                        if (!rn2(3)) {
                            mongets(mtmp, BOW);
                            m_initthrow(mtmp, ARROW, 12);
                        }
                        break;
                    case PM_HUNTER:
                        mongets(mtmp, rn2(3) ? SHORT_SWORD : DAGGER);
                        if (rn2(2)) {
                            mongets(mtmp, rn2(2) ? LEATHER_JACKET : LEATHER_ARMOR);
                        }
                        mongets(mtmp, BOW);
                        m_initthrow(mtmp, ARROW, 12);
                        break;
                    case PM_THUG:
                        mongets(mtmp, CLUB);
                        mongets(mtmp, rn2(3) ? DAGGER : KNIFE);
                        if (rn2(2)) {
                            mongets(mtmp, LEATHER_GLOVES);
                        }
                        mongets(mtmp, rn2(2) ? LEATHER_JACKET : LEATHER_ARMOR);
                        break;
                    case PM_NEANDERTHAL:
                        mongets(mtmp, CLUB);
                        mongets(mtmp, LEATHER_ARMOR);
                        break;
                }
            }
            break;
        case S_ANGEL:
            if ((((ptr).mflags1 & 131072) != 0)) {
                /* create minion stuff; bypass mongets */
                let typ = rn2(3) ? LONG_SWORD : SILVER_MACE;
                let nam = (typ == LONG_SWORD) ? "Sunsword" : "Demonbane";
                otmp = mksobj(typ, (0), (0));
                /* maybe promote weapon to an artifact */
                if ((!rn2(20) || (((ptr).mflags2 & 1024) != 0)) && sgn(mtmp.isminion ? ((mtmp).mextra.emin).min_align : ptr.maligntyp) == 1) {
                    otmp = oname(otmp, nam, 128);
                }
                bless(otmp);
                /* uncurse(otmp); -- mksobj(,FALSE,) item is always uncursed */
                otmp.oerodeproof = (1);
                /* make long sword be +0 to +3, mace be +3 to +6 to compensate
               for being significantly weaker against large opponents */
                otmp.spe = rn2(4);
                if (typ == SILVER_MACE) {
                    otmp.spe += 3;
                }
                mpickobj(mtmp, otmp);
                otmp = mksobj(!rn2(4) || (((ptr).mflags2 & 1024) != 0) ? SHIELD_OF_REFLECTION : LARGE_SHIELD, (0), (0));
                otmp.oerodeproof = (1);
                otmp.spe = 0;
                mpickobj(mtmp, otmp);
            }
            break;
        case S_HUMANOID:
            if (mm == PM_HOBBIT) {
                switch (rn2(3)) {
                    case 0:
                        mongets(mtmp, DAGGER);
                        break;
                    case 1:
                        mongets(mtmp, ELVEN_DAGGER);
                        break;
                    case 2:
                        mongets(mtmp, SLING);
                        m_initthrow(mtmp, !rn2(4) ? FLINT : ROCK, 6);
                        break;
                }
                if (!rn2(10)) {
                    mongets(mtmp, ELVEN_MITHRIL_COAT);
                }
                if (!rn2(10)) {
                    mongets(mtmp, DWARVISH_CLOAK);
                }
            } else if ((((ptr).mflags2 & 32) != 0)) {
                if (rn2(7)) {
                    mongets(mtmp, DWARVISH_CLOAK);
                }
                if (rn2(7)) {
                    mongets(mtmp, IRON_SHOES);
                }
                if (!rn2(4)) {
                    mongets(mtmp, DWARVISH_SHORT_SWORD);
                    if (rn2(2)) {
                        mongets(mtmp, DWARVISH_MATTOCK);
                    /* note: you can't use a mattock with a shield */
                    } else {
                        mongets(mtmp, rn2(2) ? AXE : DWARVISH_SPEAR);
                        mongets(mtmp, DWARVISH_ROUNDSHIELD);
                    }
                    mongets(mtmp, DWARVISH_IRON_HELM);
                    if (!rn2(3)) {
                        mongets(mtmp, DWARVISH_MITHRIL_COAT);
                    }
                } else {
                    mongets(mtmp, !rn2(3) ? PICK_AXE : DAGGER);
                }
            }
            break;
        case S_KOP:
            if (!rn2(4)) {
                m_initthrow(mtmp, CREAM_PIE, 2);
            }
            if (!rn2(3)) {
                mongets(mtmp, (rn2(2)) ? CLUB : RUBBER_HOSE);
            }
            break;
        case S_ORC:
            if (rn2(2)) {
                mongets(mtmp, ORCISH_HELM);
            }
            switch ((mm != PM_ORC_CAPTAIN) ? mm : rn2(2) ? PM_MORDOR_ORC : PM_URUK_HAI) {
                /* create Keystone Kops with cream pies to
           throw. As suggested by KAA.     [MRS] */
                case PM_MORDOR_ORC:
                    if (!rn2(3)) {
                        mongets(mtmp, SCIMITAR);
                    }
                    if (!rn2(3)) {
                        mongets(mtmp, ORCISH_SHIELD);
                    }
                    if (!rn2(3)) {
                        mongets(mtmp, KNIFE);
                    }
                    if (!rn2(3)) {
                        mongets(mtmp, ORCISH_CHAIN_MAIL);
                    }
                    break;
                case PM_URUK_HAI:
                    if (!rn2(3)) {
                        mongets(mtmp, ORCISH_CLOAK);
                    }
                    if (!rn2(3)) {
                        mongets(mtmp, ORCISH_SHORT_SWORD);
                    }
                    if (!rn2(3)) {
                        mongets(mtmp, IRON_SHOES);
                    }
                    if (!rn2(3)) {
                        mongets(mtmp, ORCISH_BOW);
                        m_initthrow(mtmp, ORCISH_ARROW, 12);
                    }
                    if (!rn2(3)) {
                        mongets(mtmp, URUK_HAI_SHIELD);
                    }
                    break;
                default:
                    if (mm != PM_ORC_SHAMAN && rn2(2)) {
                        mongets(mtmp, (mm == PM_GOBLIN || rn2(2) == 0) ? ORCISH_DAGGER : SCIMITAR);
                    }
            }
            break;
        case S_OGRE:
            if (!rn2(mm == PM_OGRE_TYRANT ? 3 : mm == PM_OGRE_LEADER ? 6 : 12)) {
                mongets(mtmp, BATTLE_AXE);
            } else {
                mongets(mtmp, CLUB);
            }
            break;
        case S_TROLL:
            if (!rn2(2)) {
                switch (rn2(4)) {
                    case 0:
                        mongets(mtmp, RANSEUR);
                        break;
                    case 1:
                        mongets(mtmp, PARTISAN);
                        break;
                    case 2:
                        mongets(mtmp, GLAIVE);
                        break;
                    case 3:
                        mongets(mtmp, SPETUM);
                        break;
                }
            }
            break;
        case S_KOBOLD:
            if (!rn2(4)) {
                m_initthrow(mtmp, DART, 12);
            }
            break;
        case S_CENTAUR:
            if (rn2(2)) {
                if (ptr == game.mons[PM_FOREST_CENTAUR]) {
                    mongets(mtmp, BOW);
                    m_initthrow(mtmp, ARROW, 12);
                } else {
                    mongets(mtmp, CROSSBOW);
                    m_initthrow(mtmp, CROSSBOW_BOLT, 12);
                }
            }
            break;
        case S_WRAITH:
            mongets(mtmp, KNIFE);
            mongets(mtmp, LONG_SWORD);
            break;
        case S_ZOMBIE:
            if (!rn2(4)) {
                mongets(mtmp, LEATHER_ARMOR);
            }
            if (!rn2(4)) {
                mongets(mtmp, (rn2(3) ? KNIFE : SHORT_SWORD));
            }
            break;
        case S_LIZARD:
            if (mm == PM_SALAMANDER) {
                mongets(mtmp, (rn2(7) ? SPEAR : rn2(3) ? TRIDENT : STILETTO));
            }
            break;
        case S_DEMON:
            switch (mm) {
                case PM_BALROG:
                    mongets(mtmp, BULLWHIP);
                    mongets(mtmp, BROADSWORD);
                    break;
                case PM_ORCUS:
                    mongets(mtmp, WAN_DEATH);
                    break;
                case PM_HORNED_DEVIL:
                    mongets(mtmp, rn2(4) ? TRIDENT : BULLWHIP);
                    break;
                case PM_DISPATER:
                    mongets(mtmp, WAN_STRIKING);
                    break;
                case PM_YEENOGHU:
                    mongets(mtmp, FLAIL);
                    break;
            }
            /* prevent djinn and mail daemons from leaving objects when
         * they vanish
         */
            if (!(((ptr).mflags2 & 256) != 0)) {
                break;
            }
            ;
        default:
            bias = (((ptr).mflags2 & 1024) != 0) + (((ptr).mflags2 & 2048) != 0) * 2 + (((ptr).mflags2 & 33554432) != 0);
            switch (rnd(14 - (2 * bias))) {
                case 1:
                    if ((((ptr).mflags2 & 67108864) != 0)) {
                        mongets(mtmp, BATTLE_AXE);
                    /*
         * Now the general case, some chance of getting some type
         * of weapon for "normal" monsters.  Certain special types
         * of monsters will get a bonus chance or different selections.
         */
                    } else {
                        m_initthrow(mtmp, DART, 12);
                    }
                    break;
                case 2:
                    if ((((ptr).mflags2 & 67108864) != 0)) {
                        mongets(mtmp, TWO_HANDED_SWORD);
                    } else {
                        mongets(mtmp, CROSSBOW);
                        m_initthrow(mtmp, CROSSBOW_BOLT, 12);
                    }
                    break;
                case 3:
                    mongets(mtmp, BOW);
                    m_initthrow(mtmp, ARROW, 12);
                    break;
                case 4:
                    if ((((ptr).mflags2 & 67108864) != 0)) {
                        mongets(mtmp, LONG_SWORD);
                    } else {
                        m_initthrow(mtmp, DAGGER, 3);
                    }
                    break;
                case 5:
                    if ((((ptr).mflags2 & 67108864) != 0)) {
                        mongets(mtmp, LUCERN_HAMMER);
                    } else {
                        mongets(mtmp, AKLYS);
                    }
                    break;
                default:
                    break;
            }
            break;
    }
    if (mtmp.m_lev > rn2(75)) {
        mongets(mtmp, rnd_offensive_item(mtmp));
    }
}
/* create a new stack of gold in monster's inventory */
export function mkmonmoney(mtmp, amount) {
    if (amount > 0) {
        /* mk_mplayer() passes rn2(1000) so the amount might be 0 */
        let gold = mksobj(GOLD_PIECE, (0), (0));
        gold.quan = amount;
        gold.owt = weight(gold);
        add_to_minv(mtmp, gold);
    }
}
export function m_initinv(mtmp) {
    let cnt = 0;
    let otmp = null;
    let ptr = mtmp.data;
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        return;
    }
    switch (ptr.mlet) {
        case S_HUMAN:
            if ((((ptr).mflags2 & 512) != 0)) {
                /*
     *  Soldiers get armour & rations - armour approximates their ac.
     *  Nymphs may get mirror or potion of object detection.
     */
                let mac = 0;
                switch (((ptr).pmidx)) {
                    case PM_GUARD:
                        mac = -1;
                        break;
                    case PM_SOLDIER:
                        mac = 3;
                        break;
                    case PM_SERGEANT:
                        mac = 0;
                        break;
                    case PM_LIEUTENANT:
                        mac = -2;
                        break;
                    case PM_CAPTAIN:
                        mac = -3;
                        break;
                    case PM_WATCHMAN:
                        mac = 3;
                        break;
                    case PM_WATCH_CAPTAIN:
                        mac = -2;
                        break;
                    default:
                        impossible("odd mercenary %d?", ((ptr).pmidx));
                        mac = 0;
                        break;
                }
                /* round 1: give them body armor */
                if (mac < -1 && rn2(5)) {
                    otmp = mongets(mtmp, (rn2(5)) ? PLATE_MAIL : CRYSTAL_PLATE_MAIL);
                } else if (mac < 3 && rn2(5)) {
                    otmp = mongets(mtmp, (rn2(3)) ? SPLINT_MAIL : BANDED_MAIL);
                } else if (rn2(5)) {
                    otmp = mongets(mtmp, (rn2(3)) ? RING_MAIL : STUDDED_LEATHER_ARMOR);
                } else {
                    otmp = mongets(mtmp, LEATHER_ARMOR);
                }
                if (otmp) {
                    mac += (game.objects[(otmp).otyp].oc_oc1 + (otmp).spe - ((((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) < (game.objects[(otmp).otyp].oc_oc1) ? (((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) : (game.objects[(otmp).otyp].oc_oc1)));
                }
                /* otmp was freed via merging with something else */
                otmp = null;
                ;
                if (mac < 10 && rn2(3)) {
                    otmp = mongets(mtmp, HELMET);
                } else if (mac < 10 && rn2(2)) {
                    otmp = mongets(mtmp, DENTED_POT);
                }
                if (otmp) {
                    mac += (game.objects[(otmp).otyp].oc_oc1 + (otmp).spe - ((((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) < (game.objects[(otmp).otyp].oc_oc1) ? (((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) : (game.objects[(otmp).otyp].oc_oc1)));
                }
                otmp = null;
                ;
                if (mac < 10 && rn2(3)) {
                    otmp = mongets(mtmp, SMALL_SHIELD);
                } else if (mac < 10 && rn2(2)) {
                    otmp = mongets(mtmp, LARGE_SHIELD);
                }
                if (otmp) {
                    mac += (game.objects[(otmp).otyp].oc_oc1 + (otmp).spe - ((((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) < (game.objects[(otmp).otyp].oc_oc1) ? (((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) : (game.objects[(otmp).otyp].oc_oc1)));
                }
                otmp = null;
                ;
                if (mac < 10 && rn2(3)) {
                    otmp = mongets(mtmp, LOW_BOOTS);
                } else if (mac < 10 && rn2(2)) {
                    otmp = mongets(mtmp, HIGH_BOOTS);
                }
                if (otmp) {
                    mac += (game.objects[(otmp).otyp].oc_oc1 + (otmp).spe - ((((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) < (game.objects[(otmp).otyp].oc_oc1) ? (((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) : (game.objects[(otmp).otyp].oc_oc1)));
                }
                otmp = null;
                ;
                if (mac < 10 && rn2(3)) {
                    otmp = mongets(mtmp, LEATHER_GLOVES);
                } else if (mac < 10 && rn2(2)) {
                    otmp = mongets(mtmp, LEATHER_CLOAK);
                }
                if (otmp) {
                    mac += (game.objects[(otmp).otyp].oc_oc1 + (otmp).spe - ((((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) < (game.objects[(otmp).otyp].oc_oc1) ? (((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2)) : (game.objects[(otmp).otyp].oc_oc1)));
                }
                otmp = null;
                ;
                ((mac));
                if (ptr == game.mons[PM_WATCH_CAPTAIN]) {
                    ;
                } else if (ptr == game.mons[PM_WATCHMAN]) {
                    /* suppress 'dead increment' from static analyzer */
                    /* better weapon rather than extra gear here */
                    /* most watchmen carry a whistle */
                    if (rn2(3)) {
                        mongets(mtmp, TIN_WHISTLE);
                    }
                } else if (ptr == game.mons[PM_GUARD]) {
                    /* if hero teleports out of a vault while being confronted
                   by the vault's guard, there is a shrill whistling sound,
                   so guard evidently carries a cursed whistle */
                    otmp = mksobj(TIN_WHISTLE, (1), (0));
                    curse(otmp);
                    mpickobj(mtmp, otmp);
                } else {
                    /* soldiers and their officers */
                    if (!rn2(3)) {
                        mongets(mtmp, K_RATION);
                    }
                    if (!rn2(2)) {
                        mongets(mtmp, C_RATION);
                    }
                    if (ptr != game.mons[PM_SOLDIER] && !rn2(3)) {
                        mongets(mtmp, BUGLE);
                    }
                }
            } else if (ptr == game.mons[PM_SHOPKEEPER]) {
                mongets(mtmp, SKELETON_KEY);
                switch (rn2(4)) {
                    case 0:
                        mongets(mtmp, WAN_MAGIC_MISSILE);
                        ;
                    case 1:
                        mongets(mtmp, POT_EXTRA_HEALING);
                        ;
                    case 2:
                        mongets(mtmp, POT_HEALING);
                        ;
                    case 3:
                        mongets(mtmp, WAN_STRIKING);
                }
            } else if (ptr.msound == MS_PRIEST || (ptr.mlet == S_HUMAN && (game.urole.mnum == (PM_CLERIC)) && (ptr.msound == MS_LEADER || ptr.msound == MS_NEMESIS))) {
                mongets(mtmp, rn2(7) ? ROBE : rn2(3) ? CLOAK_OF_PROTECTION : CLOAK_OF_MAGIC_RESISTANCE);
                mongets(mtmp, SMALL_SHIELD);
                mkmonmoney(mtmp, (rn2(10) + (20)));
            } else if ((ptr.mlet == S_HUMAN && (game.urole.mnum == (PM_MONK)) && (ptr.msound == MS_LEADER || ptr.msound == MS_NEMESIS))) {
                mongets(mtmp, rn2(11) ? ROBE : CLOAK_OF_MAGIC_RESISTANCE);
            }
            break;
        case S_NYMPH:
            if (!rn2(2)) {
                mongets(mtmp, MIRROR);
            }
            if (!rn2(2)) {
                mongets(mtmp, POT_OBJECT_DETECTION);
            }
            break;
        case S_GIANT:
            if (ptr == game.mons[PM_MINOTAUR]) {
                if (!rn2(8) || (game.in_mklev && (((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level)))))) {
                    mongets(mtmp, WAN_DIGGING);
                }
            } else if ((((ptr).mflags2 & 8192) != 0)) {
                for (cnt = rn2((Math.trunc(mtmp.m_lev / 2))); cnt; cnt--) {
                    otmp = mksobj(rnd_class(DILITHIUM_CRYSTAL, LUCKSTONE - 1), (0), (0));
                    otmp.quan = (rn2(2) + (3));
                    otmp.owt = weight(otmp);
                    mpickobj(mtmp, otmp);
                }
            }
            break;
        case S_WRAITH:
            if (ptr == game.mons[PM_NAZGUL]) {
                otmp = mksobj(RIN_INVISIBILITY, (0), (0));
                curse(otmp);
                mpickobj(mtmp, otmp);
            }
            break;
        case S_LICH:
            if (ptr == game.mons[PM_MASTER_LICH] && !rn2(13)) {
                mongets(mtmp, (rn2(7) ? ATHAME : WAN_NOTHING));
            } else if (ptr == game.mons[PM_ARCH_LICH] && !rn2(3)) {
                otmp = mksobj(rn2(3) ? ATHAME : QUARTERSTAFF, (1), rn2(13) ? (0) : (1));
                if (otmp.spe < 2) {
                    otmp.spe = rnd(3);
                }
                if (!rn2(4)) {
                    otmp.oerodeproof = 1;
                }
                mpickobj(mtmp, otmp);
            }
            break;
        case S_MUMMY:
            if (rn2(7)) {
                mongets(mtmp, MUMMY_WRAPPING);
            }
            break;
        case S_QUANTMECH:
            if (!rn2(20) && ptr == game.mons[PM_QUANTUM_MECHANIC]) {
                let catcorpse = null;
                otmp = mksobj(LARGE_BOX, (0), (0));
                if ((catcorpse = mksobj(CORPSE, (1), (0))) != null) {
                    /* we used to just set the flag, which resulted in weight()
               treating the box as being heavier by the weight of a cat;
               now we include a cat corpse that won't rot; when opening or
               disclosing the box's contents, the corpse might be revived,
               otherwise it's given a rot timer; weight is now ordinary */
                    /* flag for special SchroedingersBox */
                    otmp.spe = 1;
                    set_corpsenm(catcorpse, PM_HOUSECAT);
                    stop_timer(ROT_CORPSE, obj_to_any(catcorpse));
                    add_to_container(otmp, catcorpse);
                    otmp.owt = weight(otmp);
                }
                mpickobj(mtmp, otmp);
            }
            break;
        case S_LEPRECHAUN:
            mkmonmoney(mtmp, d(level_difficulty(), 30));
            break;
        case S_DEMON:
            if (ptr == game.mons[PM_ICE_DEVIL] && !rn2(4)) {
                /* moved here from m_initweap() because these don't
           have AT_WEAP so m_initweap() is not called for them */
                mongets(mtmp, SPEAR);
            } else if (ptr == game.mons[PM_ASMODEUS]) {
                mongets(mtmp, WAN_COLD);
                mongets(mtmp, WAN_FIRE);
            }
            break;
        case S_GNOME:
            if (!rn2((In_mines(game.u.uz) && game.in_mklev) ? 20 : 60)) {
                otmp = mksobj(rn2(4) ? TALLOW_CANDLE : WAX_CANDLE, (1), (0));
                otmp.quan = 1;
                otmp.owt = weight(otmp);
                if (!mpickobj(mtmp, otmp) && !game.level.locations[mtmp.mx][mtmp.my].lit) {
                    begin_burn(otmp, (0));
                }
            }
            break;
        default:
            break;
    }
    /* ordinary soldiers rarely have access to magic (or gold :-) */
    if (ptr == game.mons[PM_SOLDIER] && rn2(13)) {
        return;
    }
    if (mtmp.m_lev > rn2(50)) {
        mongets(mtmp, rnd_defensive_item(mtmp));
    }
    if (mtmp.m_lev > rn2(100)) {
        mongets(mtmp, rnd_misc_item(mtmp));
    }
    if ((((ptr).mflags2 & 268435456) != 0) && !findgold(mtmp.minvent) && !rn2(5)) {
        mkmonmoney(mtmp, d(level_difficulty(), mtmp.minvent ? 5 : 10));
    }
}
/* Note: for long worms, always call cutworm (cutworm calls clone_mon) */
/* clone's preferred location or 0 (near mon) */
export function clone_mon(mon, x, y) {
    fnEnter("clone_mon", "makemon.c", 0);
    let mm = { x: 0, y: 0 };
    let m2 = null;
    /* may be too weak or have been extinguished for population control */
    if (mon.mhp <= 1 || (game.mvitals[((mon.data).pmidx)].mvflags & 1) != 0) {
        return null;
    }
    if (x == 0) {
        mm.x = mon.mx;
        mm.y = mon.my;
    } else {
        mm.x = x;
        mm.y = y;
    }
    if (!isok(mm.x, mm.y)) {
        impossible("clone_mon trying to create a monster at <%d,%d>?", mm.x, mm.y);
        return null;
    }
    if ((game.level.monsters[mm.x][mm.y] != null)) {
        /* (always True for the x==0 case) */
        if (!enexto(mm, mm.x, mm.y, mon.data) || (game.level.monsters[mm.x][mm.y] != null)) {
            return null;
        }
    }
    m2 = alloc(1 /* sizeof(struct monst) */);
    /* copy condition of old monster */
    Object.assign(m2, mon);
    m2.mextra = null;
    m2.nmon = game.level.monlist;
    game.level.monlist = m2;
    m2.m_id = next_ident();
    m2.mx = mm.x;
    m2.my = mm.y;
    m2.mundetected = 0;
    m2.mtrapped = 0;
    m2.mcloned = 1;
    m2.minvent = null;
    m2.mleashed = 0;
    /* Max HP the same, but current HP halved for both.  The caller
     * might want to override this by halving the max HP also.
     * When current HP is odd, the original keeps the extra point.
     * We know original has more than 1 HP, so both end up with at least 1.
     */
    m2.mhpmax = mon.mhpmax;
    m2.mhp = Math.trunc(mon.mhp / 2);
    mon.mhp -= m2.mhp;
    /* clone doesn't have mextra so mustn't retain special monster flags */
    m2.isshk = 0;
    m2.isgd = 0;
    m2.ispriest = 0;
    /* ms->isminion handled below */
    /* clone shouldn't be reluctant to move on spots 'parent' just moved on */
    mon_track_clear(m2);
    place_monster(m2, m2.mx, m2.my);
    if ((((m2.data).mlet == S_LIGHT || (m2.data) == game.mons[PM_FLAMING_SPHERE] || (m2.data) == game.mons[PM_SHOCKING_SPHERE] || (m2.data) == game.mons[PM_BABY_GOLD_DRAGON] || (m2.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((m2.data) == game.mons[PM_FIRE_ELEMENTAL] || (m2.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
        new_light_source(m2.mx, m2.my, (((m2.data).mlet == S_LIGHT || (m2.data) == game.mons[PM_FLAMING_SPHERE] || (m2.data) == game.mons[PM_SHOCKING_SPHERE] || (m2.data) == game.mons[PM_BABY_GOLD_DRAGON] || (m2.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((m2.data) == game.mons[PM_FIRE_ELEMENTAL] || (m2.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0), LS_MONSTER, monst_to_any(m2));
    }
    if (((mon).mextra && ((mon).mextra.mgivenname))) {
        /* if 'parent' is named, give the clone the same name */
        m2 = christen_monst(m2, ((mon).mextra.mgivenname));
    } else if (mon.isshk) {
        m2 = christen_monst(m2, shkname(mon));
    }
    if (!game.context.mon_moving && mon.mpeaceful) {
        /* not all clones caused by player are tame or peaceful */
        if (mon.mtame) {
            m2.mtame = rn2(((2 + game.u.uluck) > (2) ? (2 + game.u.uluck) : (2))) ? mon.mtame : 0;
        } else if (mon.mpeaceful) {
            m2.mpeaceful = rn2(((2 + game.u.uluck) > (2) ? (2 + game.u.uluck) : (2))) ? 1 : 0;
        }
    }
    if (m2.isminion) {
        /* if guardian angel could be cloned (maybe after polymorph?),
       m2 could be both isminion and mtame; isminion takes precedence */
        let atyp = 0;
        newemin(m2);
        Object.assign(m2.mextra.emin, mon.mextra.emin);
        /* renegade when same alignment as hero but not peaceful or
           when peaceful while being different alignment from hero */
        atyp = ((m2).mextra.emin).min_align;
        ((m2).mextra.emin).renegade = (atyp != game.u.ualign.type) ^ !m2.mpeaceful;
    } else if (m2.mtame) {
        /* Because m2 is a copy of mon it is tame but not init'ed.
           However, tamedog() will not re-tame a tame dog, so m2
           must be made non-tame to get initialized properly. */
        m2.mtame = 0;
        if (tamedog(m2, null, (0))) {
            Object.assign(m2.mextra.edog, mon.mextra.edog);
        }
    }
    set_malign(m2);
    newsym(m2.mx, m2.my);
    return m2;
}
/*
 * Propagate a species
 *
 * Once a certain number of monsters are created, don't create any more
 * at random (i.e. make them extinct).  The previous (3.2) behavior was
 * to do this when a certain number had _died_, which didn't make
 * much sense.
 *
 * Returns FALSE propagation unsuccessful
 *         TRUE  propagation successful
 */
export function propagate(mndx, tally, ghostly) {
    let gone = 0;
    let result = 0;
    let lim = mbirth_limit(mndx);
    gone = (game.mvitals[mndx].mvflags & (2 | 1)) != 0;
    result = (game.mvitals[mndx].born < lim && !gone) ? (1) : (0);
    /* if it's unique, don't ever make it again */
    if ((game.mons[mndx].geno & 4096) != 0 && mndx != PM_HIGH_CLERIC) {
        game.mvitals[mndx].mvflags |= 1;
    }
    if (game.mvitals[mndx].born < 255 && tally && (!ghostly || result)) {
        game.mvitals[mndx].born++;
    }
    if (game.mvitals[mndx].born >= lim && !(game.mons[mndx].geno & 512) && !(game.mvitals[mndx].mvflags & 1)) {
        if (game.flags.debug) {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/makemon.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Automatically extinguished %s.", makeplural(game.mons[mndx].pmnames[NEUTRAL]));
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
        }
        game.mvitals[mndx].mvflags |= 1;
    }
    return result;
}
/* amount of HP to lose from level drain (or gain from Stormbringer) */
export function monhp_per_lvl(mon) {
    let ptr = mon.data;
    let hp = rnd(8);
    if (((ptr).mlet == S_GOLEM)) {
        /* like newmonhp, but home elementals are ignored, riders use normal d8 */
        /* draining usually won't be applicable for these critters */
        hp = Math.trunc(golemhp(((ptr).pmidx)) / ptr.mlevel);
    } else if (ptr.mlevel > 49) {
        /* arbitrary; such monsters won't be involved in draining anyway */
        hp = 4 + rnd(4);
    } else if (ptr.mlet == S_DRAGON && ((ptr).pmidx) >= PM_GRAY_DRAGON) {
        /* adult dragons; newmonhp() uses In_endgame(&u.uz) ? 8 : 4 + rnd(4)
         */
        hp = 4 + rn2(5);
    } else if (!mon.m_lev) {
        /* level 0 monsters use 1d4 instead of Nd8 */
        hp = rnd(4);
    }
    return hp;
}
/* set up a new monster's initial level and hit points;
   used by newcham() as well as by makemon() */
export function newmonhp(mon, mndx) {
    let ptr = game.mons[mndx];
    let basehp = 0;
    mon.m_lev = adj_lev(ptr);
    if (((ptr).mlet == S_GOLEM)) {
        /* golems have a fixed amount of HP, varying by golem type */
        mon.mhpmax = mon.mhp = golemhp(mndx);
    } else if (((ptr) == game.mons[PM_DEATH] || (ptr) == game.mons[PM_FAMINE] || (ptr) == game.mons[PM_PESTILENCE])) {
        /* we want low HP, but a high mlevel so they can attack well */
        /* minimum is 1 per false (weaker) level */
        basehp = 10;
        mon.mhpmax = mon.mhp = d(basehp, 8);
    } else if (ptr.mlevel > 49) {
        /* "special" fixed hp monster
         * the hit points are encoded in the mlevel in a somewhat strange
         * way to fit in the 50..127 positive range of a signed character
         * above the 1..49 that indicate "normal" monster levels */
        mon.mhpmax = mon.mhp = 2 * (ptr.mlevel - 6);
        mon.m_lev = Math.trunc(mon.mhp / 4);
    } else if (ptr.mlet == S_DRAGON && mndx >= PM_GRAY_DRAGON) {
        /* adult dragons; N*(4+rnd(4)) before endgame, N*8 once there */
        /* not really applicable; isolates cast */
        /* minimum possible is one per level */
        basehp = mon.m_lev;
        mon.mhpmax = mon.mhp = ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) ? (8 * basehp) : (4 * basehp + d(basehp, 4));
    } else if (!mon.m_lev) {
        /* minimum is 1, increased to 2 below */
        basehp = 1;
        mon.mhpmax = mon.mhp = rnd(4);
    } else {
        basehp = mon.m_lev;
        mon.mhpmax = mon.mhp = d(basehp, 8);
        if (is_home_elemental(ptr)) {
            mon.mhpmax = (mon.mhp *= 3);
        }
    }
    if (mon.mhpmax == basehp) {
        /* if d(X,8) rolled a 1 all X times, give a boost;
       most beneficial for level 0 and level 1 monsters, making mhpmax
       and starting mhp always be at least 2 */
        mon.mhpmax += 1;
        mon.mhp = mon.mhpmax;
    }
}
const zeromextra = { mgivenname: null, egd: null, epri: null, eshk: null, emin: null, edog: null, ebones: null, mcorpsenm: 0 };
export function init_mextra(mex) {
    Object.assign(mex, zeromextra);
    mex.mcorpsenm = NON_PM;
}
export function newmextra() {
    let mextra = null;
    mextra = alloc(1 /* sizeof(struct mextra) */);
    init_mextra(mextra);
    return mextra;
}
/* output */
export function makemon_rnd_goodpos(mon, gpflags, cc) {
    fnEnter("makemon_rnd_goodpos", "makemon.c", 0);
    let tryct = 0;
    let nx = 0;
    let ny = 0;
    let good = 0;
    gpflags |= 16777216;
    do {
        nx = (rn2(80 - 3) + (2));
        ny = rn2(21);
        good = (!game.in_mklev && ((game.viz_array[ny][nx] & 2) != 0)) ? (0) : goodpos(nx, ny, mon, gpflags);
    } while ((++tryct < 50) && !good);
    if (!good) {
        /* else go through all map positions, twice, first round
           ignoring positions in sight, and pick first good one.
           skip first round if we're in special level loader or blind */
        let xofs = nx;
        let yofs = ny;
        let dx = 0;
        let dy = 0;
        let bl = (game.in_mklev || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? 1 : 0;
        for (; bl < 2; bl++) {
            if (!bl) {
                gpflags &= ~8388608;
            }
            for (dx = 0; dx < 80; dx++) {
                for (dy = 0; dy < 21; dy++) {
                    /* perhaps should be a 3rd pass */
                    nx = ((dx + xofs) % (80 - 1)) + 1;
                    ny = ((dy + yofs) % (21 - 1)) + 1;
                    if (bl == 0 && ((game.viz_array[ny][nx] & 2) != 0)) {
                        continue;
                    }
                    if (goodpos(nx, ny, mon, gpflags)) {
                        cc.x = nx;
                        cc.y = ny;
                        return 1;
                    }
                }
            }
            if (bl == 0 && (!mon || mon.data.mmove)) {
                let stway = game.stairs;
                while (stway) {
                    if (stway.tolev.dnum == game.u.uz.dnum && !rn2(2)) {
                        /* all map positions are visible (or not good),
                   try to pick something logical */
                        nx = stway.sx;
                        ny = stway.sy;
                        break;
                    }
                    stway = stway.next;
                }
                if (goodpos(nx, ny, mon, gpflags)) {
                        cc.x = nx;
                        cc.y = ny;
                        return 1;
                    }
            }
        }
    } else {
        gotgood: {
        }
        cc.x = nx;
        cc.y = ny;
        return (1);
    }
    return (0);
}
/*
 * called with [x,y] = coordinates;
 *      [0,0] means anyplace
 *      [u.ux,u.uy] means: near player (if !gi.in_mklev)
 *
 *      In case we make a monster group, only return the one at [x,y].
 */
export function makemon(ptr, x, y, mmflags) {
    fnEnter("makemon", "makemon.c", 0);
    traceCheckpoint('makemon.call', { x, y, mmflags, pmidx: ptr ? (ptr.pmidx | 0) : -1 });
    let mtmp = null;
    let fakemon = { nmon: null, data: null, m_id: 0, mnum: 0, cham: 0, movement: 0, m_lev: 0, malign: 0, mx: 0, my: 0, mux: 0, muy: 0, mtrack: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], mhp: 0, mhpmax: 0, mappearance: 0, m_ap_type: 0, mtame: 0, mintrinsics: 0, mextrinsics: 0, seen_resistance: 0, mspec_used: 0, female: 0, minvis: 0, invis_blkd: 0, perminvis: 0, mcan: 0, mburied: 0, mundetected: 0, mcansee: 0, mspeed: 0, permspeed: 0, mrevived: 0, mcloned: 0, mavenge: 0, mflee: 0, mfleetim: 0, msleeping: 0, mblinded: 0, mstun: 0, mfrozen: 0, mcanmove: 0, mconf: 0, mpeaceful: 0, mtrapped: 0, mleashed: 0, isshk: 0, isminion: 0, isgd: 0, ispriest: 0, iswiz: 0, wormno: 0, mtemplit: 0, meverseen: 0, mspotted: 0, mwandexp: 0, mgenmklev: 0, mstrategy: 0, mgoal: { x: 0, y: 0 }, mtrapseen: 0, mlstmv: 0, mstate: 0, migflags: 0, mspare1: 0, minvent: null, mw: null, misc_worn_check: 0, weapon_check: 0, meating: 0, mextra: null };
    let cc = { x: 0, y: 0 };
    let mndx = 0;
    let mcham = 0;
    let ct = 0;
    let mitem = 0;
    let femaleok = 0;
    let maleok = 0;
    let anymon = !ptr;
    let byyou = ((x) == game.u.ux && (y) == game.u.uy);
    let allow_minvent = ((mmflags & 1) == 0);
    let countbirth = ((mmflags & 4) == 0);
    let allowtail = ((mmflags & 16384) == 0);
    let gpflags = (((mmflags & 8) ? 8 : 0) | 8388608 | 16777216);
    Object.assign(fakemon, cg.zeromonst);
    cc.x = cc.y = 0;
    if (game.iflags.debug_mongen || (!game.level.flags.rndmongen && !ptr)) {
        return null;
    }
    if (x == 0 && y == 0) {
        /* if caller wants random location, do it here */
        fakemon.data = ptr;
        if (!makemon_rnd_goodpos(ptr ? fakemon : null, gpflags, cc)) {
            return null;
        }
        x = cc.x;
        y = cc.y;
    } else if (byyou && !game.in_mklev) {
        if (!enexto_core(cc, game.u.ux, game.u.uy, ptr, gpflags) && !enexto_core(cc, game.u.ux, game.u.uy, ptr, gpflags & ~8388608)) {
            return null;
        }
        x = cc.x;
        y = cc.y;
    }
    if (!isok(x, y)) {
        impossible("makemon trying to create a monster at <%d,%d>?", x, y);
        return null;
    }
    if ((game.level.monsters[x][y] != null)) {
        /* Does monster already exist at the position? */
        if (!(mmflags & 16) || !enexto_core(cc, x, y, ptr, gpflags)) {
            return null;
        }
        x = cc.x;
        y = cc.y;
    }
    if (ptr) {
        mndx = ((ptr).pmidx);
        /* if you are to make a specific monster and it has
           already been genocided, return */
        if (game.mvitals[mndx].mvflags & 2) {
            return null;
        }
        if (game.flags.debug && (game.mvitals[mndx].mvflags & 1)) {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/makemon.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("Explicitly creating extinct monster %s.", game.mons[mndx].pmnames[NEUTRAL]);
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
        }
    } else {
        /* make a random (common) monster that can survive here.
         * (the special levels ask for random monsters at specific
         * positions, causing mass drowning on the medusa level,
         * for instance.)
         */
        /* maybe there are no good choices */
        let tryct = 0;
        do {
            if (!(ptr = rndmonst())) {
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/makemon.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        pline("Warning: no monster.");
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                return null;
            }
            fakemon.data = ptr;
        } while (++tryct <= 50 && ((tryct == 1 && (((ptr).mflags2 & 134217728) != 0) && ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum))) || !goodpos(x, y, fakemon, gpflags)));
        mndx = ((ptr).pmidx);
    }
    propagate(mndx, countbirth, (0));
    mtmp = alloc(1 /* sizeof(struct monst) */);
    /* clear all entries in structure */
    Object.assign(mtmp, cg.zeromonst);
    mtmp.mtrack = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    mtmp.mgoal = { x: 0, y: 0 };
    if (mmflags & 128) {
        newegd(mtmp);
    }
    if (mmflags & 256) {
        newepri(mtmp);
    }
    if (mmflags & 512) {
        neweshk(mtmp);
    }
    if (mmflags & 1024) {
        newemin(mtmp);
    }
    if (mmflags & 2048) {
        newedog(mtmp);
    }
    if (mmflags & 4096) {
        mtmp.msleeping = 1;
    }
    mtmp.nmon = game.level.monlist;
    game.level.monlist = mtmp;
    mtmp.m_id = next_ident();
    set_mon_data(mtmp, ptr);
    if (ptr.msound == MS_LEADER && quest_info(MS_LEADER) == mndx) {
        game.quest_status.leader_m_id = mtmp.m_id;
    }
    mtmp.mnum = mndx;
    /* set up level and hit points */
    newmonhp(mtmp, mndx);
    femaleok = (!(((ptr).mflags2 & 65536) != 0) && !(((ptr).mflags2 & 262144) != 0));
    maleok = (!(((ptr).mflags2 & 131072) != 0) && !(((ptr).mflags2 & 262144) != 0));
    if ((((ptr).mflags2 & 131072) != 0) || ((mmflags & 65536) != 0 && femaleok)) {
        mtmp.female = 1;
    } else if ((((ptr).mflags2 & 65536) != 0) || ((mmflags & 32768) != 0 && maleok)) {
        mtmp.female = 0;
    } else if (ptr.msound == MS_LEADER && quest_info(MS_LEADER) == mndx) {
        mtmp.female = game.quest_status.ldrgend;
    } else if (ptr.msound == MS_NEMESIS && quest_info(MS_NEMESIS) == mndx) {
        mtmp.female = game.quest_status.nemgend;
    /* leader and nemesis gender is usually hardcoded in mons[],
       but for ones which can be random, it has already been chosen
       (in role_init(), for possible use by the quest pager code) */
    /* female used to be set randomly here even for neuters on the
       grounds that it was ignored, but after corpses were changed to
       retain gender it matters because it affects stacking of corpses */
    } else {
        mtmp.female = femaleok ? rn2(2) : 0;
    }
    if (((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) && !(((ptr).mflags1 & 65536) != 0)) {
        mon_learns_traps(mtmp, PIT);
        mon_learns_traps(mtmp, HOLE);
    }
    if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level)))) && !(((ptr).mflags1 & 65536) != 0)) {
        mon_learns_traps(mtmp, TRAPDOOR);
    }
    /* quest leader and nemesis both know about all trap types */
    if (ptr.msound == MS_LEADER || ptr.msound == MS_NEMESIS) {
        mon_learns_traps(mtmp, ALL_TRAPS);
    }
    /* locations where monsters are already experienced with wands */
    if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level)))) || (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) || ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || In_hell(game.u.uz) || In_V_tower(game.u.uz) || In_quest(game.u.uz)) {
        mtmp.mwandexp = (1);
    }
    place_monster(mtmp, x, y);
    mtmp.mcansee = mtmp.mcanmove = (1);
    mtmp.mgenmklev = game.in_mklev;
    mtmp.seen_resistance = M_SEEN_NOTHING;
    mtmp.mpeaceful = (mmflags & 32) ? (0) : peace_minded(ptr);
    if ((mmflags & 1048576) != 0) {
        mon_set_minvis(mtmp, (0));
    }
    switch (ptr.mlet) {
        /* call after place_monster() */
        case S_MIMIC:
            set_mimic_sym(mtmp);
            break;
        case S_SPIDER:
        case S_SNAKE:
            if (game.in_mklev) {
                if (x && y) {
                    mkobj_at(RANDOM_CLASS, x, y, (1));
                }
                hideunder(mtmp);
            }
            break;
        case S_LIGHT:
        case S_ELEMENTAL:
            if (mndx == PM_STALKER || mndx == PM_BLACK_LIGHT) {
                mtmp.perminvis = (1);
                mtmp.minvis = (1);
            }
            break;
        case S_EEL:
            if (game.in_mklev) {
                hideunder(mtmp);
            }
            break;
        case S_LEPRECHAUN:
            mtmp.msleeping = 1;
            break;
        case S_JABBERWOCK:
        case S_NYMPH:
            if (rn2(5) && !game.u.uhave.amulet) {
                mtmp.msleeping = 1;
            }
            break;
        case S_ORC:
            if ((game.urace.mnum == (PM_ELF))) {
                mtmp.mpeaceful = (0);
            }
            break;
        case S_UNICORN:
            if (((ptr).mlet == S_UNICORN && (((ptr).mflags2 & 536870912) != 0)) && sgn(game.u.ualign.type) == sgn(ptr.maligntyp)) {
                mtmp.mpeaceful = (1);
            }
            break;
        case S_BAT:
            if (In_hell(game.u.uz) && ((ptr) == game.mons[PM_BAT] || (ptr) == game.mons[PM_GIANT_BAT] || (ptr) == game.mons[PM_VAMPIRE_BAT])) {
                mon_adjust_speed(mtmp, 2, null);
            }
            break;
    }
    if ((ct = (((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) > 0) {
        new_light_source(mtmp.mx, mtmp.my, ct, LS_MONSTER, monst_to_any(mtmp));
    }
    /* extra inventory item for this monster */
    mitem = STRANGE_OBJECT;
    if (mndx == PM_VLAD_THE_IMPALER) {
        mitem = CANDELABRUM_OF_INVOCATION;
    }
    /* default is "not a shapechanger" */
    mtmp.cham = NON_PM;
    if (!(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) && (mcham = pm_to_cham(mndx)) != NON_PM) {
        /* this is a shapechanger after all */
        mtmp.cham = mcham;
        /* Vlad stays in his normal shape so he can carry the Candelabrum */
        /* Note:  shapechanger's initial form used to be chosen here
               with rndmonst(), yielding a monster which was appropriate
               to the level's difficulty but ignoring the changer's usual
               type selection, so was inappropriate for vampshifters.
               Let newcham() pick the shape. */
        if (mndx != PM_VLAD_THE_IMPALER && newcham(mtmp, null, 0)) {
            allow_minvent = (0);
        }
    } else if (mndx == PM_WIZARD_OF_YENDOR) {
        mtmp.iswiz = (1);
        game.context.no_of_wizards++;
        if (game.context.no_of_wizards == 1 && (((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level))))) {
            mitem = SPE_DIG;
        }
    } else if (mndx == PM_GHOST && !(mmflags & 64)) {
        mtmp = christen_monst(mtmp, rndghostname());
    } else if (mndx == PM_CROESUS) {
        mitem = TWO_HANDED_SWORD;
    } else if (ptr.msound == MS_NEMESIS) {
        mitem = BELL_OF_OPENING;
    } else if (mndx == PM_PESTILENCE) {
        mitem = POT_SICKNESS;
    }
    if (mitem != STRANGE_OBJECT && allow_minvent) {
        mongets(mtmp, mitem);
    }
    if (game.in_mklev) {
        if ((((((ptr).mflags2 & 256) != 0) && (((ptr).mflags2 & (1024 | 2048)) == 0)) || mndx == PM_WUMPUS || mndx == PM_LONG_WORM || mndx == PM_GIANT_EEL) && !game.u.uhave.amulet && rn2(5)) {
            mtmp.msleeping = (1);
        }
    } else {
        if (byyou) {
            /* in case of waiting items */
            /* make sure the mon shows up */
            /* vampire growing into vampire lord */
            newsym(mtmp.mx, mtmp.my);
            set_apparxy(mtmp);
        }
    }
    if (((((ptr).mflags2 & 256) != 0) && (((ptr).mflags2 & 2048) != 0)) && ptr.msound == MS_BRIBE) {
        mtmp.mpeaceful = mtmp.minvis = mtmp.perminvis = 1;
        mtmp.mavenge = 0;
        if (is_art(game.uwep, ART_EXCALIBUR) || is_art(game.uwep, ART_DEMONBANE)) {
            mtmp.mpeaceful = mtmp.mtame = (0);
        }
    }
    if (mndx == PM_RAVEN && game.uwep && game.uwep.otyp == BEC_DE_CORBIN) {
        mtmp.mpeaceful = (1);
    }
    if (mndx == PM_LONG_WORM && (mtmp.wormno = get_wormno()) != 0) {
        initworm(mtmp, allowtail ? rn2(5) : 0);
        if (count_wsegs(mtmp)) {
            place_worm_tail_randomly(mtmp, x, y);
        }
    }
    if ((mndx == PM_ALIGNED_CLERIC || mndx == PM_HIGH_CLERIC) ? !(mmflags & (256 | 1024)) : (mndx == PM_ANGEL && !(mmflags & 1024) && !rn2(3))) {
        /* it's possible to create an ordinary monster of some special
       types; make sure their extended data is initialized to
       something sensible if caller hasn't specified MM_EPRI|MM_EMIN
       (when they're specified, caller intends to handle this itself) */
        let eminp = null;
        newemin(mtmp);
        eminp = ((mtmp).mextra.emin);
        mtmp.isminion = 1;
        eminp.min_align = rn2(3) - 1;
        eminp.renegade = ((mmflags & 32) ? 1 : !rn2(3));
        mtmp.mpeaceful = (eminp.min_align == game.u.ualign.type) ? !eminp.renegade : eminp.renegade;
    }
    /* having finished peaceful changes */
    set_malign(mtmp);
    if (anymon && !(mmflags & 8192)) {
        if ((ptr.geno & 128) && rn2(2)) {
            m_initgrp(mtmp, mtmp.mx, mtmp.my, 3, mmflags);
        } else if (ptr.geno & 64) {
            if (rn2(3)) {
                m_initgrp(mtmp, mtmp.mx, mtmp.my, 10, mmflags);
            } else {
                m_initgrp(mtmp, mtmp.mx, mtmp.my, 3, mmflags);
            }
        }
    }
    if (allow_minvent) {
        if (attacktype(ptr, 254)) {
            m_initweap(mtmp);
        }
        /* equip with weapons / armor */
        /* add on a few special items incl. more armor */
        m_initinv(mtmp);
        m_dowear(mtmp, (1));
        if (!rn2(100) && (((ptr).mflags2 & 4194304) != 0) && can_saddle(mtmp) && !which_armor(mtmp, 1048576)) {
            /* NULL obj arg means put_saddle_on_mon()
             * will create the saddle itself */
            put_saddle_on_mon(null, mtmp);
        }
    } else {
        /* no initial inventory is allowed */
        if (mtmp.minvent) {
            discard_minvent(mtmp, (1));
        }
        mtmp.minvent = null;
    }
    if (ptr.mflags3 && !(mmflags & 2)) {
        if (ptr.mflags3 & 64) {
            mtmp.mstrategy |= 536870912;
        }
        if (ptr.mflags3 & 128) {
            mtmp.mstrategy |= 268435456;
        }
        if (ptr.mflags3 & (192 | 31)) {
            mtmp.mstrategy |= 2147483648;
        }
    }
    if (allow_minvent && game.migrating_objs) {
        deliver_obj_to_mon(mtmp, 1, 0);
    }
    if (!game.in_mklev) {
        newsym(mtmp.mx, mtmp.my);
        if (!(mmflags & 131072)) {
            let mbuf = '';
            let what = null;
            /* MM_NOEXCLAM is used for #wizgenesis (^G) */
            let exclaim = !(mmflags & 262144);
            if ((canseemon(mtmp) && (((mtmp).m_ap_type & 7) == M_AP_NOTHING || ((mtmp).m_ap_type & 7) == M_AP_MONSTER)) || sensemon(mtmp)) {
                what = Amonnam(mtmp);
                if (((mtmp).m_ap_type & 7) == M_AP_MONSTER) {
                    exclaim = (1);
                }
            } else if (canseemon(mtmp)) {
                /* mimic masquerading as furniture or object and not sensed */
                mhidden_description(mtmp, 2 | 4, mbuf);
                what = upstart(mbuf);
            }
            if (what) {
                set_msg_xy(mtmp.mx, mtmp.my);
                Norep("%s%s %s%s%c", what, exclaim ? " suddenly" : "", vtense(what, "appear"), (dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2) ? " next to you" : (dist2((x), (y), game.u.ux, game.u.uy) <= (8 * 8)) ? " close by" : "", exclaim ? 33 : 46);
            }
        }
        /* if discernable and a threat, stop fiddling while Rome burns */
        /* TODO: unify with teleport appears msg */
        if (game.occupation) {
            dochugw(mtmp, (0));
        }
    }
    if (mtmp) traceCheckpoint('makemon.return', { mx: mtmp.mx, my: mtmp.my, pmidx: mtmp.data ? mtmp.data.pmidx : -1 });
    return mtmp;
}
/* caller rejects makemon()'s result; always returns Null */
export function unmakemon(mon, mmflags) {
    let countbirth = ((mmflags & 4) == 0);
    let mndx = ((mon.data).pmidx);
    /* if count has reached the limit of 255, we don't know whether
       that just happened when creating this monster or the threshold
       had already been reached and further increments were suppressed;
       assume the latter */
    if (countbirth && game.mvitals[mndx].born > 0 && game.mvitals[mndx].born < 255) {
        game.mvitals[mndx].born -= 1;
    }
    if ((mon.data.geno & 4096) != 0) {
        game.mvitals[mndx].mvflags &= ~1;
    }
    /* let discard_minvent() know that mon isn't being kept */
    mon.mhp = 0;
    /* uncreate any artifact that the monster was provided with; unlike
       mongone(), this doesn't protect special items like the Amulet
       by dropping them so caller should handle them when applicable */
    discard_minvent(mon, (1));
    mongone(mon);
    return null;
}
export function mbirth_limit(mndx) {
    /* There is an implicit limit of 4 for "high priest of <deity>",
     * but aligned priests can grow into high priests, thus they aren't
     * really limited to 4, so leave the default amount in place for them.
     */
    return (mndx == PM_NAZGUL ? 9 : mndx == PM_ERINYS ? 3 : 120);
}
/* used for wand/scroll/spell of create monster */
/* returns TRUE iff you know monsters have been created */
/* usually null; used for confused reading */
export function create_critters(cnt, mptr, neverask) {
    let c = { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    let mon = null;
    let known = (0);
    let ask = (game.flags.debug && !neverask);
    while (cnt--) {
        if (ask) {
            if (create_particular()) {
                known = (1);
                continue;
            /* ESC will shut off prompting */
            } else {
                ask = (0);
            }
        }
        x = game.u.ux , y = game.u.uy;
        /* if in water, try to encourage an aquatic monster
           by finding and then specifying another wet location */
        if (!mptr && game.u.uinwater && enexto(c, x, y, game.mons[PM_GIANT_EEL])) {
            x = c.x , y = c.y;
        }
        if ((mon = makemon(mptr, x, y, 0)) == null) {
            continue;
        }
        /* try again [should probably stop instead] */
        if ((canseemon(mon) && (((mon).m_ap_type & 7) == M_AP_NOTHING || ((mon).m_ap_type & 7) == M_AP_MONSTER)) || sensemon(mon)) {
            known = (1);
        }
    }
    return known;
}
export function uncommon(mndx) {
    if (game.mons[mndx].geno & (512 | 4096)) {
        return (1);
    }
    if (game.mvitals[mndx].mvflags & (2 | 1)) {
        return (1);
    }
    if (In_hell(game.u.uz)) {
        return (game.mons[mndx].maligntyp > 0);
    } else {
        return ((game.mons[mndx].geno & 1024) != 0);
    }
}
/*
 *      shift the probability of a monster's generation by
 *      comparing the dungeon alignment and monster alignment.
 *      return an integer in the range of 0-5.
 */
let __align_shift_oldmoves = 0;
let __align_shift_lev = null;
export function align_shift(ptr) {
    /* != 1, starting value of moves */
    let alshift = 0;
    if (__align_shift_oldmoves != game.moves) {
        __align_shift_lev = Is_special(game.u.uz);
        __align_shift_oldmoves = game.moves;
    }
    switch ((__align_shift_lev) ? __align_shift_lev.flags.align : game.dungeons[game.u.uz.dnum].flags.align) {
        default:
        case 0:
            alshift = 0;
            break;
        case 4:
            alshift = Math.trunc((ptr.maligntyp + 20) / (2 * 4));
            break;
        case 2:
            alshift = Math.trunc((20 - abs(ptr.maligntyp)) / 4);
            break;
        case 1:
            alshift = Math.trunc((-(ptr.maligntyp - 20)) / (2 * 4));
            break;
    }
    return alshift;
}
/* return larger value if monster prefers the level temperature */
export function temperature_shift(ptr) {
    if (game.level.flags.temperature && (((ptr).mresists & ((game.level.flags.temperature > 0) ? 1 : 2)) != 0)) {
        return 3;
    }
    return 0;
}
/* select a random monster type */
export function rndmonst() {
    return rndmonst_adj(0, 0);
}
/* select a random monster type, with adjusted difficulty */
export function rndmonst_adj(minadj, maxadj) {
    let ptr = null;
    let mndx = 0;
    let weight = 0;
    let totalweight = 0;
    let selected_mndx = 0;
    let zlevel = 0;
    let minmlev = 0;
    let maxmlev = 0;
    let elemlevel = 0;
    let upper = 0;
    if (game.u.uz.dnum == (game.dungeon_topology.d_quest_dnum) && rn2(7) && (ptr = qt_montype()) != null) {
        return ptr;
    }
    zlevel = level_difficulty();
    minmlev = (Math.trunc((zlevel) / 6)) + minadj;
    maxmlev = (Math.trunc(((zlevel) + game.u.ulevel) / 2)) + maxadj;
    /* prefer uppercase only on rogue level */
    upper = (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))));
    elemlevel = ((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && !(((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level))));
    totalweight = 0;
    selected_mndx = NON_PM;
    for (mndx = LOW_PM; mndx < SPECIAL_PM; ++mndx) {
        ptr = game.mons[mndx];
        if ((game.mons[mndx].difficulty < minmlev) || (game.mons[mndx].difficulty > maxmlev)) {
            continue;
        }
        if (upper && !((__ctype_b_loc())[(((def_monsyms[(ptr).mlet].sym)))] & _ISupper)) {
            continue;
        }
        if (elemlevel && wrong_elem_type(ptr)) {
            continue;
        }
        if (uncommon(mndx)) {
            continue;
        }
        if (In_hell(game.u.uz) && (ptr.geno & 2048)) {
            continue;
        }
        /*
         * Weighted reservoir sampling:  select ptr with a
         * (ptr weight)/(total of all weights so far including ptr's)
         * probability.  For example, if the previous total is 10, and
         * this is now looking at acid blobs with a frequency of 2, it
         * has a 2/12 chance of abandoning ptr's previous value in favor
         * of acid blobs, and 10/12 chance of keeping whatever it was.
         *
         * This does not bias results towards either the earlier or the
         * later monsters:  the smaller pool and better odds from being
         * earlier are exactly canceled out by having more monsters to
         * potentially steal its spot.
         */
        weight = (ptr.geno & 7) + align_shift(ptr);
        weight += temperature_shift(ptr);
        if (weight < 0 || weight > 127) {
            impossible("bad weight in rndmonst for mndx %d", mndx);
            weight = 0;
        }
        if (weight > 0) {
            /* was unconditional, but if weight==0, rn2() < 0 will always fail;
           also need to avoid rn2(0) if totalweight is still 0 so far */
            /* totalweight now guaranteed to be > 0 */
            totalweight += weight;
            if (rn2(totalweight) < weight) {
                selected_mndx = mndx;
            }
        }
    }
    if (selected_mndx == NON_PM || uncommon(selected_mndx)) {
        /*
     * Possible modification:  if totalweight is "too low" or nothing
     * viable was picked, expand minmlev..maxmlev range and try again.
     */
        /* maybe no common monsters left, or all are too weak or too strong */
        if (selected_mndx != NON_PM) {
            do {
                if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/makemon.c", (1))) {
                    let save_plnmsg = game.iflags.last_msg;
                    pline("rndmonst returning Null [uncommon 'mndx'=#%d]", selected_mndx);
                    game.iflags.last_msg = save_plnmsg;
                }
            } while (0);
        }
        return null;
    }
    return game.mons[selected_mndx];
}
/* decide whether it's ok to generate a candidate monster by mkclass() */
export function mk_gen_ok(mndx, mvflagsmask, genomask) {
    let ptr = game.mons[mndx];
    if (game.mvitals[mndx].mvflags & mvflagsmask) {
        return (0);
    }
    if (ptr.geno & genomask) {
        return (0);
    }
    if (((ptr) == game.mons[PM_ORC] || (ptr) == game.mons[PM_GIANT] || (ptr) == game.mons[PM_ELF] || (ptr) == game.mons[PM_HUMAN])) {
        return (0);
    }
    /* special levels might ask for random demon type; reject this one */
    if (ptr == game.mons[PM_MAIL_DAEMON]) {
        return (0);
    }
    return (1);
}
/* monsters in order by mlet & difficulty for mkclass() */
game.mongen_order = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
game.mclass_maxf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
game.mongen_order_init = (0);
export function cmp_init_mongen_order(p1, p2) {
    let i1 = (p1);
    let i2 = (p2);
    /* This will cause these to be moved last in the mlet sort order */
    let offset1 = 0;
    let offset2 = 0;
    /* incorporate the mlet into the sort values for comparison */
    let difficulty1 = ((game.mons[i1].difficulty + offset1) | (game.mons[i1].mlet << 8));
    let difficulty2 = ((game.mons[i2].difficulty + offset2) | (game.mons[i2].mlet << 8));
    return difficulty1 - difficulty2;
}
/* check that monsters are in correct difficulty order for mkclass() */
/* initialize monster order for mkclass */
export function init_mongen_order() {
    let i = 0;
    let mlet = 0;
    if (game.mongen_order_init) {
        return;
    }
    game.mongen_order_init = (1);
    for (i = LOW_PM; i < NUMMONS; i++) {
        game.mongen_order[i] = i;
        mlet = game.mons[i].mlet;
        if ((game.mons[i].geno & 7) > game.mclass_maxf[mlet]) {
            game.mclass_maxf[mlet] = (game.mons[i].geno & 7);
        }
    }
    qsort(game.mongen_order, SPECIAL_PM, 4 /* sizeof(int) */, cmp_init_mongen_order);
}
/* allmain.c */
export function dump_mongen() {
    let mlet = 0;
    let prev_mlet = 0;
    let i = 0;
    let nmwidth = 27;
    let special = 0;
    let nmbuf = '';
    monst_globals_init();
    init_mongen_order();
    raw_printf("int mongen_order[] = {");
    for (i = LOW_PM; i < SPECIAL_PM; ++i) {
        special = (game.mons[(game.mongen_order[i])].geno & (512 | 4096));
        mlet = def_monsyms[game.mons[(game.mongen_order[i])].mlet].sym;
        if (prev_mlet && prev_mlet != mlet) {
            (game.windowprocs.win_raw_print)("");
        }
        nmbuf = nh_snprintf("dump_mongen", 1851, nmbuf, 80 /* sizeof(char [80]) */, "PM_%s%s", monsdump[(game.mongen_order[i])].nm, (i == SPECIAL_PM - 1) ? "" : ",");
        raw_printf("    %*s /* %c seq=%3d, idx=%3d, sym='%c', diff=%2d, freq=%2d[%d] %s */", -nmwidth, nmbuf, (i == (game.mongen_order[i])) ? 32 : 46, i, (game.mongen_order[i]), mlet, game.mons[(game.mongen_order[i])].difficulty, (game.mons[(game.mongen_order[i])].geno & 7), game.mclass_maxf[game.mons[(game.mongen_order[i])].mlet], (special == (512 | 4096)) ? "(G_NOGEN | G_UNIQ)" : (special == 512) ? "(G_NOGEN)" : (special == 4096) ? "(G_UNIQ)" : "");
        prev_mlet = mlet;
    }
    (game.windowprocs.win_raw_print)("};");
    (game.windowprocs.win_raw_print)("");
    freedynamicdata();
}
/* Make one of the multiple types of a given monster class.
   The second parameter specifies a special casing bit mask
   to allow the normal genesis masks to be deactivated.
   Returns Null if no monsters in that class can be made. */
export function mkclass(class_, spc) {
    return mkclass_aligned(class_, spc, (-128));
}
/* mkclass() with alignment restrictions; used by ndemon() */
/* special mons[].geno handling */
export function mkclass_aligned(class_, spc, atyp) {
    let first = 0;
    let last = 0;
    let num = 0;
    /* +1: insurance for final return value */
    let k = 0;
    let nums = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let maxmlev = 0;
    let gehennom = In_hell(game.u.uz) != 0;
    let mv_mask = 0;
    let gn_mask = 0;
    let zero_freq_for_entire_class = 0;
    memset(nums, 0, 1324 /* sizeof(int [331]) */);
    maxmlev = level_difficulty() >> 1;
    if (class_ < 1 || class_ >= MAXMCLASSES) {
        impossible("mkclass called with bad class!");
        return null;
    }
    init_mongen_order();
    /* the following must come after init_mongen_order() */
    zero_freq_for_entire_class = (game.mclass_maxf[class_] == 0);
    /*  Assumption #1:  monsters of a given class are contiguous in the
     *                  mons[] array.  Player monsters and quest denizens
     *                  are an exception; mkclass() won't pick them.
     *                  SPECIAL_PM is long worm tail and separates the
     *                  regular monsters from the exceptions.
     */
    for (first = LOW_PM; first < SPECIAL_PM; first++) {
        if (game.mons[(game.mongen_order[first])].mlet == class_) {
            break;
        }
    }
    if (first == SPECIAL_PM) {
        impossible("mkclass found no class %d monsters", class_);
        return null;
    }
    mv_mask = (2 | 1);
    if ((spc & 32768) != 0) {
        mv_mask = 0;
        /* G_IGNORE is not a mons[].geno mask so get rid of it now */
        spc &= ~32768;
    }
    for (last = first; last < SPECIAL_PM && game.mons[(game.mongen_order[last])].mlet == class_; last++) {
        /*  Assumption #2:  monsters of a given class are presented in ascending
     *                  order of strength.
     */
        if (atyp != (-128) && sgn(game.mons[(game.mongen_order[last])].maligntyp) != sgn(atyp)) {
            continue;
        }
        /* traditionally mkclass() ignored hell-only and never-in-hell;
           now we usually honor those but not all the time, mostly so that
           the majority of major demons aren't constrained to Gehennom;
           arch- and master liches are always so constrained (for creation;
           lesser liches might grow up into them elsewhere) */
        gn_mask = (512 | 4096);
        if (rn2(9) || class_ == S_LICH) {
            gn_mask |= (gehennom ? 2048 : 1024);
        }
        gn_mask &= ~spc;
        if (mk_gen_ok((game.mongen_order[last]), mv_mask, gn_mask)) {
            /* consider it; don't reject a toostrong() monster if we
               don't have anything yet (num==0) or if it is the same
               (or lower) difficulty as preceding candidate (non-zero
               'num' implies last > first so mons[last-1] is safe);
               sometimes accept it even if high difficulty */
            if (num && (game.mons[(game.mongen_order[last])].difficulty > maxmlev) && game.mons[(game.mongen_order[last])].difficulty > game.mons[(game.mongen_order[last - 1])].difficulty && rn2(2)) {
                break;
            }
            if ((k = (game.mons[(game.mongen_order[last])].geno & 7)) > 0 || (k = (zero_freq_for_entire_class ? 1 : 0)) > 0) {
                /* skew towards lower value monsters at lower exp. levels
                   (this used to be done in the next loop, but that didn't
                   work well when multiple species had the same level and
                   were followed by one that was past the bias threshold;
                   cited example was succubus and incubus, where the bias
                   against picking the next demon resulted in incubus
                   being picked nearly twice as often as succubus);
                   we need the '+1' in case the entire set is too high
                   level (really low svl.level hero) */
                nums[(game.mongen_order[last])] = k + 1 - (adj_lev(game.mons[(game.mongen_order[last])]) > (game.u.ulevel * 2));
                num += nums[(game.mongen_order[last])];
            }
        }
    }
    if (!num) {
        return null;
    }
    /* the hard work has already been done; 'num' should hit 0 before
       first reaches last (which is actually one past our last candidate) */
    for (num = rnd(num); first < last; first++) {
        if ((num -= nums[(game.mongen_order[first])]) <= 0) {
            break;
        }
    }
    return nums[(game.mongen_order[first])] ? game.mons[(game.mongen_order[first])] : null;
}
/* like mkclass(), but excludes difficulty considerations; used when
   player with polycontrol picks a class instead of a specific type;
   genocided types are avoided but extinct ones are acceptable; we don't
   check polyok() here--caller accepts some choices !polyok() would reject */
export function mkclass_poly(class_) {
    let first = 0;
    let last = 0;
    let num = 0;
    let gmask = 0;
    for (first = LOW_PM; first < SPECIAL_PM; first++) {
        if (game.mons[first].mlet == class_) {
            break;
        }
    }
    if (first == SPECIAL_PM) {
        return NON_PM;
    }
    gmask = (512 | 4096);
    /* mkclass() does this on a per monster type basis, but doing that here
       would make the two loops inconsistent with each other for non L */
    if (rn2(9) || class_ == S_LICH) {
        gmask |= (In_hell(game.u.uz) ? 2048 : 1024);
    }
    for (last = first; last < SPECIAL_PM && game.mons[last].mlet == class_; last++) {
        if (mk_gen_ok(last, 2, gmask)) {
            num += game.mons[last].geno & 7;
        }
    }
    if (!num) {
        return NON_PM;
    }
    for (num = rnd(num); num > 0; first++) {
        if (mk_gen_ok(first, 2, gmask)) {
            num -= game.mons[first].geno & 7;
        }
    }
    /* correct an off-by-one error */
    first--;
    return first;
}
/* adjust strength of monsters based on u.uz and u.ulevel */
export function adj_lev(ptr) {
    let tmp = 0;
    let tmp2 = 0;
    if (ptr == game.mons[PM_WIZARD_OF_YENDOR]) {
        /* does not depend on other strengths, but does get stronger
         * every time he is killed
         */
        tmp = ptr.mlevel + game.mvitals[PM_WIZARD_OF_YENDOR].died;
        if (tmp > 49) {
            tmp = 49;
        }
        return tmp;
    }
    if ((tmp = ptr.mlevel) > 49) {
        return 50;
    }
    tmp2 = (level_difficulty() - tmp);
    if (tmp2 < 0) {
        tmp--;
    /* if mlevel > u.uz decrement tmp */
    /* else increment 1 per five diff */
    } else {
        tmp += (Math.trunc(tmp2 / 5));
    }
    tmp2 = (game.u.ulevel - ptr.mlevel);
    if (tmp2 > 0) {
        tmp += (Math.trunc(tmp2 / 4));
    }
    tmp2 = Math.trunc((3 * (ptr.mlevel)) / 2);
    if (tmp2 > 49) {
        tmp2 = 49;
    }
    return ((tmp > tmp2) ? tmp2 : (tmp > 0 ? tmp : 0));
}
/* monster earned experience and will gain some hit points; it might also
   grow into a bigger monster (baby to adult, soldier to officer, etc) */
export function grow_up(mtmp, victim) {
    let oldtype = 0;
    let newtype = 0;
    let max_increase = 0;
    let cur_increase = 0;
    let lev_limit = 0;
    let hp_threshold = 0;
    let fem = 0;
    let ptr = mtmp.data;
    /* monster died after killing enemy but before calling this function */
    /* currently possible if killing a gas spore */
    if (((mtmp).mhp < 1)) {
        return null;
    }
    /* note:  none of the monsters with special hit point calculations
       have both little and big forms (killer bee can't grow into queen
       bee by just killing things, so isn't in the little_to_big list) */
    oldtype = ((ptr).pmidx);
    newtype = (oldtype == PM_KILLER_BEE && !victim) ? PM_QUEEN_BEE : little_to_big(oldtype);
    if (victim) {
        /* gender-neutral PM_CLERIC now */
        /* growth limits differ depending on method of advancement */
        /*
         * The HP threshold is the maximum number of hit points for the
         * current level; once exceeded, a level will be gained.
         * Possible bug: if somehow the hit points are already higher
         * than that, monster will gain a level without any increase in HP.
         */
        hp_threshold = mtmp.m_lev * 8;
        if (!mtmp.m_lev) {
            hp_threshold = 4;
        } else if (((ptr).mlet == S_GOLEM)) {
            hp_threshold = ((Math.trunc(mtmp.mhpmax / 10)) + 1) * 10 - 1;
        } else if (is_home_elemental(ptr)) {
            hp_threshold *= 3;
        }
        lev_limit = Math.trunc(3 * ptr.mlevel / 2);
        /* If they can grow up, be sure the level is high enough for that */
        if (oldtype != newtype && game.mons[newtype].mlevel > lev_limit) {
            lev_limit = game.mons[newtype].mlevel;
        }
        /* number of hit points to gain; unlike for the player, we put
           the limit at the bottom of the next level rather than the top */
        max_increase = rnd(victim.m_lev + 1);
        if (mtmp.mhpmax + max_increase > hp_threshold + 1) {
            max_increase = (((hp_threshold + 1) - mtmp.mhpmax) > (0) ? ((hp_threshold + 1) - mtmp.mhpmax) : (0));
        }
        cur_increase = (max_increase > 1) ? rn2(max_increase) : 0;
    } else {
        /* a gain level potion or wraith corpse; always go up a level
           unless already at maximum (49 is hard upper limit except
           for demon lords, who start at 50 and can't go any higher) */
        max_increase = cur_increase = rnd(8);
        /* smaller than `mhpmax + max_increase' */
        hp_threshold = 0;
        lev_limit = 50;
    }
    mtmp.mhpmax += max_increase;
    mtmp.mhp += cur_increase;
    if (mtmp.mhpmax <= hp_threshold) {
        return ptr;
    }
    if ((((ptr).pmidx >= PM_ARCHEOLOGIST) && ((ptr).pmidx <= PM_WIZARD))) {
        lev_limit = 30;
    } else if (lev_limit < 5) {
        lev_limit = 5;
    } else if (lev_limit > 49) {
        lev_limit = (ptr.mlevel > 49 ? 50 : 49);
    }
    if (++mtmp.m_lev >= game.mons[newtype].mlevel && newtype != oldtype) {
        ptr = game.mons[newtype];
        /* new form might force gender change */
        fem = (((ptr).mflags2 & 65536) != 0) ? 0 : (((ptr).mflags2 & 131072) != 0) ? 1 : mtmp.female;
        if (game.mvitals[newtype].mvflags & 2) {
            if ((canseemon(mtmp) || sensemon(mtmp))) {
                pline("As %s grows up into %s, %s %s!", mon_nam(mtmp), an(pmname(ptr, Mgender(mtmp))), (genders[pronoun_gender(mtmp, 2)].he), ((((ptr).mflags2 & 2) != 0) || (ptr) == game.mons[PM_MANES] || (((ptr).mlet == S_GOLEM) || (ptr).mlet == S_VORTEX)) ? "expires" : "dies");
            }
            /* keep svm.mvitals[] accurate */
            set_mon_data(mtmp, ptr);
            mondied(mtmp);
            return null;
        } else if ((canseemon(mtmp) || sensemon(mtmp))) {
            let buf = '';
            buf = sprintf(buf, "%s%s", (mtmp.female && !fem) ? "male " : (fem && !mtmp.female) ? "female " : "", pmname(ptr, fem));
            pline_mon(mtmp, "%s %s %s.", YMonnam(mtmp), (fem != mtmp.female) ? "changes into" : (((ptr).mflags1 & 131072) != 0) ? "becomes" : "grows up into", an(buf));
        }
        set_mon_data(mtmp, ptr);
        if (mtmp.cham == oldtype && (((ptr).mflags2 & 16384) != 0)) {
            mtmp.cham = newtype;
        }
        newsym(mtmp.mx, mtmp.my);
        lev_limit = mtmp.m_lev;
        /* gender might be changing */
        mtmp.female = fem;
        /* if 'mtmp' is leashed, persistent inventory window needs updating */
        if (mtmp.mleashed) {
            update_inventory();
        }
    }
    if (mtmp.m_lev > lev_limit) {
        /* 3.6.1:
             * Temporary (?) hack to fix growing into opposite gender.
             */
        /* deal with female gnome becoming a gnome lord */
        /* or a male gnome becoming a gnome lady
                           (can't happen with 3.6.0 mons[], but perhaps
                           slightly less sexist if prepared for it...) */
        /* x - leash (attached to a <mon>) */
        mtmp.m_lev--;
        /* HP might have been allowed to grow when it shouldn't */
        if (mtmp.mhpmax == hp_threshold + 1) {
            mtmp.mhpmax--;
        }
    }
    if (mtmp.mhpmax > 50 * 8) {
        mtmp.mhpmax = 50 * 8;
    }
    if (mtmp.mhp > mtmp.mhpmax) {
        mtmp.mhp = mtmp.mhpmax;
    }
    return ptr;
}
export function mongets(mtmp, otyp) {
    let otmp = null;
    if (!otyp) {
        return null;
    }
    otmp = mksobj(otyp, (1), (0));
    if (otmp) {
        if (mtmp.data.mlet == S_DEMON) {
            /* demons never get blessed objects */
            if (otmp.blessed) {
                curse(otmp);
            }
        } else if ((((((mtmp).data).mflags2 & 4096) != 0) && mon_aligntyp(mtmp) == 1)) {
            /* lawful minions don't get cursed, bad, or rusting objects */
            otmp.cursed = (0);
            if (otmp.spe < 0) {
                otmp.spe = 0;
            }
            otmp.oerodeproof = 1;
            otmp.oeroded = otmp.oeroded2 = 0;
        } else if ((((mtmp.data).pmidx >= PM_ARCHEOLOGIST) && ((mtmp.data).pmidx <= PM_WIZARD)) && (otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[otmp.otyp].oc_subtyp <= P_SABER)) {
            otmp.spe = (3 + rn2(4));
        }
        if (otmp.otyp == CANDELABRUM_OF_INVOCATION) {
            otmp.spe = 0;
            otmp.age = 0;
            otmp.lamplit = (0);
            otmp.blessed = otmp.cursed = (0);
        } else if (otmp.otyp == BELL_OF_OPENING) {
            otmp.blessed = otmp.cursed = (0);
        } else if (otmp.otyp == SPE_BOOK_OF_THE_DEAD) {
            otmp.blessed = (0);
            otmp.cursed = (1);
        }
        if ((((mtmp.data).mflags2 & 2048) != 0)) {
            /* leaders don't tolerate inferior quality battle gear */
            if (otmp.oclass == WEAPON_CLASS && otmp.spe < 1) {
                otmp.spe = 1;
            } else if (otmp.oclass == ARMOR_CLASS && otmp.spe < 0) {
                otmp.spe = 0;
            }
        }
        if (mpickobj(mtmp, otmp)) {
            otmp = null;
        }
    }
    return otmp;
}
export function golemhp(type) {
    switch (type) {
        case PM_STRAW_GOLEM:
            return 20;
        case PM_PAPER_GOLEM:
            return 20;
        case PM_ROPE_GOLEM:
            return 30;
        case PM_LEATHER_GOLEM:
            return 40;
        case PM_GOLD_GOLEM:
            return 60;
        case PM_WOOD_GOLEM:
            return 50;
        case PM_FLESH_GOLEM:
            return 40;
        case PM_CLAY_GOLEM:
            return 70;
        case PM_STONE_GOLEM:
            return 100;
        case PM_GLASS_GOLEM:
            return 80;
        case PM_IRON_GOLEM:
            return 120;
        default:
            return 0;
    }
}
/*
 *      Alignment vs. yours determines monster's attitude to you.
 *      (Some "animal" types are co-aligned, but also hungry.)
 */
export function peace_minded(ptr) {
    let mal = ptr.maligntyp;
    let ual = game.u.ualign.type;
    if ((((ptr).mflags2 & 2097152) != 0)) {
        return (1);
    }
    if ((((ptr).mflags2 & 1048576) != 0)) {
        return (0);
    }
    if (ptr.msound == MS_LEADER || ptr.msound == MS_GUARDIAN) {
        return (1);
    }
    if (ptr.msound == MS_NEMESIS) {
        return (0);
    }
    if (ptr == game.mons[PM_ERINYS]) {
        return !game.u.ualign.abuse;
    }
    if ((((ptr).mflags2 & game.urace.lovemask) != 0)) {
        return (1);
    }
    if ((((ptr).mflags2 & game.urace.hatemask) != 0)) {
        return (0);
    }
    /* the monster is hostile if its alignment is different from the
     * player's */
    if (sgn(mal) != sgn(ual)) {
        return (0);
    }
    /* Negative monster hostile to player with Amulet. */
    if (mal < 0 && game.u.uhave.amulet) {
        return (0);
    }
    /* minions are hostile to players that have strayed at all */
    if ((((ptr).mflags2 & 4096) != 0)) {
        return (game.u.ualign.record >= 0);
    }
    /* Last case:  a chance of a co-aligned monster being
     * hostile.  This chance is greater if the player has strayed
     * (u.ualign.record negative) or the monster is not strongly aligned.
     */
    return (!!rn2(16 + (game.u.ualign.record < -15 ? -15 : game.u.ualign.record)) && !!rn2(2 + abs(mal)));
}
/* Set malign to have the proper effect on player alignment if monster is
 * killed.  Negative numbers mean it's bad to kill this monster; positive
 * numbers mean it's good.  Since there are more hostile monsters than
 * peaceful monsters, the penalty for killing a peaceful monster should be
 * greater than the bonus for killing a hostile monster to maintain balance.
 * Rules:
 *   it's bad to kill peaceful monsters, potentially worse to kill always-
 *      peaceful monsters;
 *   it's never bad to kill a hostile monster, although it may not be good.
 */
export function set_malign(mtmp) {
    let mal = mtmp.data.maligntyp;
    let coaligned = 0;
    if (mtmp.ispriest || mtmp.isminion) {
        /* some monsters have individual alignments; check them */
        if (mtmp.ispriest && ((mtmp).mextra.epri)) {
            mal = ((mtmp).mextra.epri).shralign;
        } else if (mtmp.isminion && ((mtmp).mextra.emin)) {
            mal = ((mtmp).mextra.emin).min_align;
        }
        /* unless alignment is none, set mal to -5,0,5 */
        /* (see align.h for valid aligntyp values)     */
        if (mal != (-128)) {
            mal *= 5;
        }
    }
    coaligned = (sgn(mal) == sgn(game.u.ualign.type));
    if (mtmp.data.msound == MS_LEADER) {
        mtmp.malign = -20;
    } else if (mal == (-128)) {
        if (mtmp.mpeaceful) {
            mtmp.malign = 0;
        } else {
            mtmp.malign = 20;
        }
    } else if ((((mtmp.data).mflags2 & 2097152) != 0)) {
        let absmal = abs(mal);
        if (mtmp.mpeaceful) {
            mtmp.malign = -3 * ((5) > (absmal) ? (5) : (absmal));
        } else {
            mtmp.malign = 3 * ((5) > (absmal) ? (5) : (absmal));
        }
    } else if ((((mtmp.data).mflags2 & 1048576) != 0)) {
        let absmal = abs(mal);
        if (coaligned) {
            mtmp.malign = 0;
        } else {
            mtmp.malign = ((5) > (absmal) ? (5) : (absmal));
        }
    } else if (coaligned) {
        let absmal = abs(mal);
        if (mtmp.mpeaceful) {
            mtmp.malign = -3 * ((3) > (absmal) ? (3) : (absmal));
        } else {
            mtmp.malign = ((3) > (absmal) ? (3) : (absmal));
        }
    /* not coaligned and therefore hostile */
    } else {
        mtmp.malign = abs(mal);
    }
}
/* allocate a new mcorpsenm field for a monster; only need mextra itself */
export function newmcorpsenm(mtmp) {
    if (!mtmp.mextra) {
        mtmp.mextra = newmextra();
    }
    ((mtmp).mextra.mcorpsenm) = NON_PM;
}
/* release monster's mcorpsenm field; basically a no-op */
export function freemcorpsenm(mtmp) {
    if (((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM)) {
        ((mtmp).mextra.mcorpsenm) = NON_PM;
    }
}
const syms = [MAXOCLASSES, MAXOCLASSES, RING_CLASS, WAND_CLASS, WEAPON_CLASS, FOOD_CLASS, COIN_CLASS, SCROLL_CLASS, POTION_CLASS, ARMOR_CLASS, AMULET_CLASS, TOOL_CLASS, ROCK_CLASS, GEM_CLASS, SPBOOK_CLASS, S_MIMIC_DEF, S_MIMIC_DEF];
const __set_mimic_sym_furnsyms = [S_upstair, S_upstair, S_dnstair, S_dnstair, S_altar, S_grave, S_throne, S_sink];
export function set_mimic_sym(mtmp) {
    let typ = 0;
    let roomno = 0;
    let rt = 0;
    let appear = 0;
    let ap_type = 0;
    let s_sym = 0;
    let otmp = null;
    let mx = 0;
    let my = 0;
    if (!mtmp || (game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
        return;
    }
    mx = mtmp.mx;
    my = mtmp.my;
    typ = game.level.locations[mx][my].typ;
    /* only valid for INSIDE of room */
    roomno = game.level.locations[mx][my].roomno - 3;
    if (roomno >= 0) {
        rt = game.rooms[roomno].rtype;
    /* roomno < 0 case for GCC_WARN */
    } else {
        rt = 0;
    }
    if ((game.level.objects[mx][my] != null)) {
        ap_type = M_AP_OBJECT;
        appear = game.level.objects[mx][my].otyp;
    } else if (((typ) == DOOR) || ((typ) && (typ) <= DBWALL) || typ == SDOOR || typ == SCORR) {
        ap_type = M_AP_FURNITURE;
        if (mx != 0 && (game.level.locations[mx - 1][my].typ == HWALL || game.level.locations[mx - 1][my].typ == TLCORNER || game.level.locations[mx - 1][my].typ == TRWALL || game.level.locations[mx - 1][my].typ == BLCORNER || game.level.locations[mx - 1][my].typ == TDWALL || game.level.locations[mx - 1][my].typ == CROSSWALL || game.level.locations[mx - 1][my].typ == TUWALL)) {
            appear = (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) ? S_hwall : S_hcdoor;
        /*
         *  If there is a wall to the left that connects to this
         *  location, then the mimic mimics a horizontal closed door.
         *  This does not allow doors to be in corners of rooms.
         *  Since rogue has no closed doors, mimic a wall there
         *  (yes, mimics can end up on this level by various means).
         */
        } else {
            appear = (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) ? S_vwall : S_vcdoor;
        }
    } else if (game.level.flags.is_maze_lev && !(In_mines(game.u.uz) && in_town(game.u.ux, game.u.uy)) && !((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) && rn2(2)) {
        ap_type = M_AP_OBJECT;
        appear = STATUE;
    } else if (roomno < 0 && !t_at(mx, my)) {
        ap_type = M_AP_OBJECT;
        appear = BOULDER;
    } else if (rt == ZOO || rt == VAULT) {
        ap_type = M_AP_OBJECT;
        appear = GOLD_PIECE;
    } else if (rt == DELPHI) {
        if (rn2(2)) {
            /* health food store usually generates pseudo-class
               VEGETARIAN_CLASS which is MAXOCLASSES+1; we don't bother
               trying to select among all possible vegetarian food items */
            ap_type = M_AP_OBJECT;
            appear = STATUE;
        } else {
            ap_type = M_AP_FURNITURE;
            appear = S_fountain;
        }
    } else if (rt == TEMPLE) {
        ap_type = M_AP_FURNITURE;
        /*
     * We won't bother with beehives, morgues, barracks, throne rooms
     * since they shouldn't contain too many mimics anyway...
     */
        appear = S_altar;
    } else {
        let __do_assign_sym = false;
        if (rt >= SHOPBASE) {
            if (rn2(10) >= depth(game.u.uz)) {
                s_sym = S_MIMIC_DEF;
                __do_assign_sym = true;
            } else {
                s_sym = get_shop_item(rt - SHOPBASE);
                if (s_sym < 0) {
                    ap_type = M_AP_OBJECT;
                    appear = -s_sym;
                } else if (rt == FODDERSHOP && s_sym > MAXOCLASSES) {
                    ap_type = M_AP_OBJECT;
                    appear = rn2(2) ? LUMP_OF_ROYAL_JELLY : SLIME_MOLD;
                } else {
                    if (s_sym == RANDOM_CLASS || s_sym >= MAXOCLASSES) {
                        s_sym = syms[rn2((Math.trunc(17 /* sizeof(const char [17]) */ / 1 /* sizeof(const char) */)) - 2) + 2];
                    }
                    __do_assign_sym = true;
                }
            }
        } else {
            s_sym = syms[rn2((Math.trunc(17 /* sizeof(const char [17]) */ / 1 /* sizeof(const char) */)))];
            __do_assign_sym = true;
        }
        if (__do_assign_sym) {
            if (s_sym == MAXOCLASSES) {
                ap_type = M_AP_FURNITURE;
                appear = __set_mimic_sym_furnsyms[rn2((Math.trunc(32 /* sizeof(const int [8]) */ / 4 /* sizeof(const int) */)))];
            } else {
                ap_type = M_AP_OBJECT;
                if (s_sym == S_MIMIC_DEF) {
                    appear = STRANGE_OBJECT;
                } else if (s_sym == COIN_CLASS) {
                    appear = GOLD_PIECE;
                } else {
                    otmp = mkobj(s_sym, (0));
                    appear = otmp.otyp;
                    /* make sure container contents are free'ed */
                    obfree(otmp, null);
                }
            }
        }
    }
    mtmp.m_ap_type = ap_type;
    mtmp.mappearance = appear;
    if (ap_type == M_AP_OBJECT && (appear == STATUE || appear == FIGURINE || appear == CORPSE || appear == EGG || appear == TIN)) {
        /* when appearing as an object based on a monster type, pick a shape */
        let mndx = rndmonnum();
        let nocorpse_ndx = (game.mvitals[mndx].mvflags & 16) != 0;
        if (appear == CORPSE && nocorpse_ndx) {
            mndx = (rn2(PM_WIZARD - PM_ARCHEOLOGIST + 1) + (PM_ARCHEOLOGIST));
        } else if ((appear == EGG && !can_be_hatched(mndx)) || (appear == TIN && nocorpse_ndx)) {
            mndx = NON_PM;
        }
        /* revert to generic egg or empty tin */
        newmcorpsenm(mtmp);
        ((mtmp).mextra.mcorpsenm) = mndx;
    } else if (ap_type == M_AP_OBJECT && appear == SLIME_MOLD) {
        newmcorpsenm(mtmp);
        ((mtmp).mextra.mcorpsenm) = game.context.current_fruit;
        /* if no objects of this fruit type have been created yet,
           context.current_fruit is available for re-use when the player
           assigns a new fruit name; override that--having a mimic as the
           current_fruit is equivalent to creating an instance of that
           fruit (no-op if a fruit of this type has actually been made) */
        game.flags.made_fruit = (1);
    } else if (ap_type == M_AP_FURNITURE && appear == S_altar) {
        /* -1 (A_Cha) or 0 (A_Neu) or +1 (A_Law) */
        let algn = rn2(3) - 1;
        newmcorpsenm(mtmp);
        ((mtmp).mextra.mcorpsenm) = (In_hell(game.u.uz) && rn2(3)) ? 0 : ((((algn) == (-128)) ? 0 : ((algn) == 1) ? 4 : ((algn) + 2)));
    } else if (((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM)) {
        ((mtmp).mextra.mcorpsenm) = NON_PM;
    }
    if (does_block(mx, my, game.level.locations[mx][my])) {
        block_point(mx, my);
    }
}
/* release monster from bag of tricks; return number of monsters created */
/* caller emptying entirely; affects shop handling */
/* secondary output */
export function bagotricks(bag, tipping, seencount) {
    let moncount = 0;
    if (!bag || bag.otyp != BAG_OF_TRICKS) {
        impossible("bad bag o' tricks");
    } else if (bag.spe < 1) {
        pline("%s", (tipping && bag.cknown) ? "It's empty." : c_common_strings.c_nothing_happens);
        if (bag.dknown && game.objects[bag.otyp].oc_name_known) {
            /* if tipping known empty bag, give normal empty container message */
            /* now known to be empty if sufficiently discovered */
            bag.cknown = 1;
            update_inventory();
        }
    } else {
        let mtmp = null;
        let creatcnt = 1;
        let seecount = 0;
        consume_obj_charge(bag, !tipping);
        if (!rn2(23)) {
            creatcnt += rnd(7);
        }
        do {
            mtmp = makemon(null, game.u.ux, game.u.uy, 0);
            if (mtmp) {
                ++moncount;
                if ((canseemon(mtmp) && (((mtmp).m_ap_type & 7) == M_AP_NOTHING || ((mtmp).m_ap_type & 7) == M_AP_MONSTER)) || sensemon(mtmp)) {
                    ++seecount;
                }
            }
        } while (--creatcnt > 0);
        if (seecount) {
            if (seencount) {
                seencount.value += seecount;
            }
            if (bag.dknown) {
                discover_object((BAG_OF_TRICKS), (1), (1), (1));
                update_inventory();
            }
        } else if (!tipping) {
            pline("%s", !moncount ? c_common_strings.c_nothing_happens : c_common_strings.c_nothing_seems_to_happen);
        }
    }
    return moncount;
}
/* create some or all remaining erinyes around the player */
/* number to create, or 0 to create until extinct */
export function summon_furies(limit) {
    let i = 0;
    while (mk_gen_ok(PM_ERINYS, (2 | 1), 0) && (i < limit || !limit)) {
        makemon(game.mons[PM_ERINYS], game.u.ux, game.u.uy, 16 | 2);
        i++;
    }
}
/*makemon.c*/
/* [TODO? some (most? all?) edog fields probably should be
           reinitialized rather that retain the 'parent's values] */
/* in Sokoban, don't accept a giant on first try;
                    after that, boulder carriers are fair game */
/* 'what' might be "gold pieces" so need plural verb */
/* don't retain stale value from a previously mimicked shape */
