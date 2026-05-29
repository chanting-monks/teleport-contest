import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	u_init.c	$NHDT-Date: 1769398807 2026/01/25 19:40:07 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.121 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2017. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { time } from '../c2js-runtime/calendar.js';
import { memset } from '../c2js-runtime/memory.js';
import { panic } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { is_art } from './artifact.js';
import { adjabil, adjattrib, init_attr, newhp, vary_init_attr } from './attrib.js';
import { max_rank_sz } from './botl.js';
import { cg } from './decl.js';
import { find_ac } from './do_wear.js';
import { init_uhunger } from './eat.js';
import { newpw } from './exper.js';
import { inv_weight } from './hack.js';
import { addinv, useupall } from './invent.js';
import { dealloc_obj, mkobj, mksobj, weight } from './mkobj.js';
import { APPLE, ARMOR_CLASS, ARM_BOOTS, ARM_CLOAK, ARM_GLOVES, ARM_HELM, ARM_SHIELD, ARM_SHIRT, ARM_SUIT, ARROW, ART_SNICKERSNEE, AXE, A_CON, A_STR, BAG_OF_TRICKS, BATTLE_AXE, BELL, BLINDED, BLINDFOLD, BOW, BUGLE, BULLWHIP, CARROT, CHAIN_MAIL, CLOAK_OF_DISPLACEMENT, CLOAK_OF_MAGIC_RESISTANCE, CLOVE_OF_GARLIC, CLUB, COIN_CLASS, CORNUTHAUM, CRAM_RATION, CREDIT_CARD, CROSSBOW, CROSSBOW_BOLT, DAGGER, DART, DUNCE_CAP, DWARVISH_CLOAK, DWARVISH_IRON_HELM, DWARVISH_MATTOCK, DWARVISH_MITHRIL_COAT, DWARVISH_ROUNDSHIELD, DWARVISH_SHORT_SWORD, DWARVISH_SPEAR, ELVEN_ARROW, ELVEN_BOOTS, ELVEN_BOW, ELVEN_BROADSWORD, ELVEN_CLOAK, ELVEN_DAGGER, ELVEN_LEATHER_HELM, ELVEN_MITHRIL_COAT, ELVEN_SHIELD, ELVEN_SHORT_SWORD, ELVEN_SPEAR, EXPENSIVE_CAMERA, FEDORA, FLINT, FOOD_CLASS, FOOD_RATION, FORTUNE_COOKIE, GEM_CLASS, GOLD_PIECE, HAWAIIAN_SHIRT, HELMET, JUMPING, KATANA, LANCE, LARGE_BOX, LEASH, LEATHER_ARMOR, LEATHER_DRUM, LEATHER_GLOVES, LEATHER_JACKET, LEMBAS_WAFER, LOADSTONE, LOCK_PICK, LONG_SWORD, LUCKSTONE, MACE, MAGIC_MARKER, MAXOCLASSES, MAXSPELL, NON_PM, NUM_OBJECTS, OIL_LAMP, ORANGE, ORCISH_ARROW, ORCISH_BOW, ORCISH_CHAIN_MAIL, ORCISH_CLOAK, ORCISH_DAGGER, ORCISH_HELM, ORCISH_RING_MAIL, ORCISH_SHIELD, ORCISH_SHORT_SWORD, ORCISH_SPEAR, PANCAKE, PICK_AXE, PM_ARCHEOLOGIST, PM_BARBARIAN, PM_CAVE_DWELLER, PM_CLERIC, PM_DWARF, PM_ELF, PM_GNOME, PM_HEALER, PM_HUMAN, PM_KNIGHT, PM_MONK, PM_ORC, PM_RANGER, PM_ROGUE, PM_SAMURAI, PM_TOURIST, PM_VALKYRIE, PM_WIZARD, POTION_CLASS, POT_ACID, POT_EXTRA_HEALING, POT_FULL_HEALING, POT_HALLUCINATION, POT_HEALING, POT_OIL, POT_POLYMORPH, POT_SICKNESS, POT_WATER, P_ATTACK_SPELL, P_AXE, P_BARE_HANDED_COMBAT, P_BASIC, P_BOOMERANG, P_BOW, P_BROAD_SWORD, P_CLERIC_SPELL, P_CLUB, P_CROSSBOW, P_DAGGER, P_DART, P_DIVINATION_SPELL, P_ENCHANTMENT_SPELL, P_ESCAPE_SPELL, P_EXPERT, P_FLAIL, P_GRAND_MASTER, P_HAMMER, P_HEALING_SPELL, P_KNIFE, P_LANCE, P_LONG_SWORD, P_MACE, P_MASTER, P_MATTER_SPELL, P_MORNING_STAR, P_NONE, P_NUM_SKILLS, P_PICK_AXE, P_POLEARMS, P_QUARTERSTAFF, P_RIDING, P_SABER, P_SHORT_SWORD, P_SHURIKEN, P_SKILLED, P_SLING, P_SPEAR, P_TRIDENT, P_TWO_HANDED_SWORD, P_TWO_WEAPON_COMBAT, P_UNICORN_HORN, P_UNSKILLED, P_WHIP, QUARTERSTAFF, RING_CLASS, RING_MAIL, RIN_AGGRAVATE_MONSTER, RIN_HUNGER, RIN_LEVITATION, RIN_POISON_RESISTANCE, RIN_POLYMORPH, RIN_POLYMORPH_CONTROL, ROBE, ROCK, SACK, SCALPEL, SCROLL_CLASS, SCR_AMNESIA, SCR_BLANK_PAPER, SCR_ENCHANT_WEAPON, SCR_FIRE, SCR_MAGIC_MAPPING, SHORT_SWORD, SHURIKEN, SLING, SMALL_SHIELD, SPBOOK_CLASS, SPEAR, SPE_BLANK_PAPER, SPE_CONFUSE_MONSTER, SPE_EXTRA_HEALING, SPE_FORCE_BOLT, SPE_HEALING, SPE_NOVEL, SPE_POLYMORPH, SPE_PROTECTION, SPE_STONE_TO_FLESH, SPLINT_MAIL, SPRIG_OF_WOLFSBANE, STATUE, STETHOSCOPE, STRANGE_OBJECT, TINNING_KIT, TIN_OPENER, TOOLED_HORN, TOOL_CLASS, TOUCHSTONE, TOWEL, TRIPE_RATION, TWO_HANDED_SWORD, URUK_HAI_SHIELD, WAND_CLASS, WAN_NOTHING, WAN_POLYMORPH, WAN_SLEEP, WAN_WISHING, WEAPON_CLASS, WOODEN_FLUTE, WOODEN_HARP, YA, YUMI } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { Japanese_item_name } from './objnam.js';
import { set_uasmon } from './polyself.js';
import { rn2, rnd, rne } from './rnd.js';
import { aligns } from './role.js';
import { initialspell, num_spells, spell_skilltype } from './spell.js';
import { hidden_gold } from './vault.js';
import { skill_init } from './weapon.js';
import { set_twoweap, setuqwep, setuswapwep, setuwep } from './wield.js';
import { setworn } from './worn.js';

// struct trobj: { trotyp, trspe, trclass, trquan_min, trquan_max, trbless }
/*
 *      Initial inventory for the various roles.
 */
const Archeologist = [{ trotyp: BULLWHIP, trspe: 2, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: LEATHER_JACKET, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: FEDORA, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: FOOD_RATION, trspe: 0, trclass: FOOD_CLASS, trquan_min: 3, trquan_max: 3, trbless: 0 }, { trotyp: PICK_AXE, trspe: 127, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: TINNING_KIT, trspe: 127, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: TOUCHSTONE, trspe: 0, trclass: GEM_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: SACK, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
/* if adventure has a name...  idea from tan@uvm-gen */
const Barbarian_0 = [{ trotyp: TWO_HANDED_SWORD, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: AXE, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: RING_MAIL, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: FOOD_RATION, trspe: 0, trclass: FOOD_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Barbarian_1 = [{ trotyp: BATTLE_AXE, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: SHORT_SWORD, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: RING_MAIL, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: FOOD_RATION, trspe: 0, trclass: FOOD_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Cave_man = [{ trotyp: CLUB, trspe: 1, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: SLING, trspe: 2, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: FLINT, trspe: 0, trclass: GEM_CLASS, trquan_min: 10, trquan_max: 20, trbless: 2 }, { trotyp: ROCK, trspe: 0, trclass: GEM_CLASS, trquan_min: 3, trquan_max: 3, trbless: 0 }, { trotyp: LEATHER_ARMOR, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
/* yields 18..33 */
const Healer = [{ trotyp: SCALPEL, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: LEATHER_GLOVES, trspe: 1, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: STETHOSCOPE, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: POT_HEALING, trspe: 0, trclass: POTION_CLASS, trquan_min: 4, trquan_max: 4, trbless: 2 }, { trotyp: POT_EXTRA_HEALING, trspe: 0, trclass: POTION_CLASS, trquan_min: 4, trquan_max: 4, trbless: 2 }, { trotyp: WAN_SLEEP, trspe: 127, trclass: WAND_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: SPE_HEALING, trspe: 0, trclass: SPBOOK_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: SPE_EXTRA_HEALING, trspe: 0, trclass: SPBOOK_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: SPE_STONE_TO_FLESH, trspe: 0, trclass: SPBOOK_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: APPLE, trspe: 0, trclass: FOOD_CLASS, trquan_min: 5, trquan_max: 5, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
/* always blessed, so it's guaranteed readable */
const Knight = [{ trotyp: LONG_SWORD, trspe: 1, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: LANCE, trspe: 1, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: RING_MAIL, trspe: 1, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: HELMET, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: SMALL_SHIELD, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: LEATHER_GLOVES, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: APPLE, trspe: 0, trclass: FOOD_CLASS, trquan_min: 10, trquan_max: 10, trbless: 0 }, { trotyp: CARROT, trspe: 0, trclass: FOOD_CLASS, trquan_min: 10, trquan_max: 10, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Monk = [{ trotyp: LEATHER_GLOVES, trspe: 2, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: ROBE, trspe: 1, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: 0, trspe: 127, trclass: SCROLL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: POT_HEALING, trspe: 0, trclass: POTION_CLASS, trquan_min: 3, trquan_max: 3, trbless: 2 }, { trotyp: FOOD_RATION, trspe: 0, trclass: FOOD_CLASS, trquan_min: 3, trquan_max: 3, trbless: 0 }, { trotyp: APPLE, trspe: 0, trclass: FOOD_CLASS, trquan_min: 5, trquan_max: 5, trbless: 2 }, { trotyp: ORANGE, trspe: 0, trclass: FOOD_CLASS, trquan_min: 5, trquan_max: 5, trbless: 2 }, { trotyp: FORTUNE_COOKIE, trspe: 0, trclass: FOOD_CLASS, trquan_min: 3, trquan_max: 3, trbless: 2 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
/* Yes, we know fortune cookies aren't really from China.  They were
       invented by George Jung in Los Angeles, California, USA in 1916. */
const Priest = [{ trotyp: MACE, trspe: 1, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: ROBE, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: SMALL_SHIELD, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: POT_WATER, trspe: 0, trclass: POTION_CLASS, trquan_min: 4, trquan_max: 4, trbless: 1 }, { trotyp: CLOVE_OF_GARLIC, trspe: 0, trclass: FOOD_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: SPRIG_OF_WOLFSBANE, trspe: 0, trclass: FOOD_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 127, trclass: SPBOOK_CLASS, trquan_min: 2, trquan_max: 2, trbless: 2 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
/* holy water */
const Ranger = [{ trotyp: DAGGER, trspe: 1, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: BOW, trspe: 1, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: ARROW, trspe: 2, trclass: WEAPON_CLASS, trquan_min: 50, trquan_max: 59, trbless: 2 }, { trotyp: ARROW, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 30, trquan_max: 39, trbless: 2 }, { trotyp: CLOAK_OF_DISPLACEMENT, trspe: 2, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: CRAM_RATION, trspe: 0, trclass: FOOD_CLASS, trquan_min: 4, trquan_max: 4, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Rogue = [{ trotyp: SHORT_SWORD, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: DAGGER, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 6, trquan_max: 15, trbless: 0 }, { trotyp: LEATHER_ARMOR, trspe: 1, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: POT_SICKNESS, trspe: 0, trclass: POTION_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: LOCK_PICK, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: SACK, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Samurai = [{ trotyp: KATANA, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: SHORT_SWORD, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: YUMI, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: YA, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 26, trquan_max: 45, trbless: 2 }, { trotyp: SPLINT_MAIL, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
/* wakizashi */
const Tourist = [{ trotyp: DART, trspe: 2, trclass: WEAPON_CLASS, trquan_min: 21, trquan_max: 40, trbless: 2 }, { trotyp: 0, trspe: 127, trclass: FOOD_CLASS, trquan_min: 10, trquan_max: 10, trbless: 0 }, { trotyp: POT_EXTRA_HEALING, trspe: 0, trclass: POTION_CLASS, trquan_min: 2, trquan_max: 2, trbless: 2 }, { trotyp: SCR_MAGIC_MAPPING, trspe: 0, trclass: SCROLL_CLASS, trquan_min: 4, trquan_max: 4, trbless: 2 }, { trotyp: HAWAIIAN_SHIRT, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: EXPENSIVE_CAMERA, trspe: 127, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: CREDIT_CARD, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Valkyrie = [{ trotyp: SPEAR, trspe: 1, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: DAGGER, trspe: 0, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: SMALL_SHIELD, trspe: 3, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: FOOD_RATION, trspe: 0, trclass: FOOD_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Wizard = [{ trotyp: QUARTERSTAFF, trspe: 1, trclass: WEAPON_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: CLOAK_OF_MAGIC_RESISTANCE, trspe: 0, trclass: ARMOR_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: 0, trspe: 127, trclass: WAND_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: 0, trspe: 127, trclass: RING_CLASS, trquan_min: 2, trquan_max: 2, trbless: 2 }, { trotyp: 0, trspe: 127, trclass: POTION_CLASS, trquan_min: 3, trquan_max: 3, trbless: 2 }, { trotyp: 0, trspe: 127, trclass: SCROLL_CLASS, trquan_min: 3, trquan_max: 3, trbless: 2 }, { trotyp: SPE_FORCE_BOLT, trspe: 0, trclass: SPBOOK_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: 0, trspe: 127, trclass: SPBOOK_CLASS, trquan_min: 1, trquan_max: 1, trbless: 2 }, { trotyp: MAGIC_MARKER, trspe: 19, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
/* actually spe = 18 + d4 */
/*
 *      Optional extra inventory items.
 */
const Healing_book = [{ trotyp: SPE_HEALING, trspe: 127, trclass: SPBOOK_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Protection_book = [{ trotyp: SPE_PROTECTION, trspe: 127, trclass: SPBOOK_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Confuse_monster_book = [{ trotyp: SPE_CONFUSE_MONSTER, trspe: 127, trclass: SPBOOK_CLASS, trquan_min: 1, trquan_max: 1, trbless: 1 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Tinopener = [{ trotyp: TIN_OPENER, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Magicmarker = [{ trotyp: MAGIC_MARKER, trspe: 19, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Lamp = [{ trotyp: OIL_LAMP, trspe: 1, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Blindfold = [{ trotyp: BLINDFOLD, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Xtra_food = [{ trotyp: 0, trspe: 127, trclass: FOOD_CLASS, trquan_min: 2, trquan_max: 2, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Leash = [{ trotyp: LEASH, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Towel = [{ trotyp: TOWEL, trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Wishing = [{ trotyp: WAN_WISHING, trspe: 3, trclass: WAND_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
const Money = [{ trotyp: GOLD_PIECE, trspe: 0, trclass: COIN_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
/* race-based substitutions for initial inventory;
   the weaker cloak for elven rangers is intentional--they shoot better */
// struct inv_sub: { race_pm, item_otyp, subs_otyp }
const inv_subs = [{ race_pm: PM_ELF, item_otyp: DAGGER, subs_otyp: ELVEN_DAGGER }, { race_pm: PM_ELF, item_otyp: SPEAR, subs_otyp: ELVEN_SPEAR }, { race_pm: PM_ELF, item_otyp: SHORT_SWORD, subs_otyp: ELVEN_SHORT_SWORD }, { race_pm: PM_ELF, item_otyp: BOW, subs_otyp: ELVEN_BOW }, { race_pm: PM_ELF, item_otyp: ARROW, subs_otyp: ELVEN_ARROW }, { race_pm: PM_ELF, item_otyp: HELMET, subs_otyp: ELVEN_LEATHER_HELM }, { race_pm: PM_ELF, item_otyp: CLOAK_OF_DISPLACEMENT, subs_otyp: ELVEN_CLOAK }, { race_pm: PM_ELF, item_otyp: CRAM_RATION, subs_otyp: LEMBAS_WAFER }, { race_pm: PM_ORC, item_otyp: DAGGER, subs_otyp: ORCISH_DAGGER }, { race_pm: PM_ORC, item_otyp: SPEAR, subs_otyp: ORCISH_SPEAR }, { race_pm: PM_ORC, item_otyp: SHORT_SWORD, subs_otyp: ORCISH_SHORT_SWORD }, { race_pm: PM_ORC, item_otyp: BOW, subs_otyp: ORCISH_BOW }, { race_pm: PM_ORC, item_otyp: ARROW, subs_otyp: ORCISH_ARROW }, { race_pm: PM_ORC, item_otyp: HELMET, subs_otyp: ORCISH_HELM }, { race_pm: PM_ORC, item_otyp: SMALL_SHIELD, subs_otyp: ORCISH_SHIELD }, { race_pm: PM_ORC, item_otyp: RING_MAIL, subs_otyp: ORCISH_RING_MAIL }, { race_pm: PM_ORC, item_otyp: CHAIN_MAIL, subs_otyp: ORCISH_CHAIN_MAIL }, { race_pm: PM_ORC, item_otyp: CRAM_RATION, subs_otyp: TRIPE_RATION }, { race_pm: PM_ORC, item_otyp: LEMBAS_WAFER, subs_otyp: TRIPE_RATION }, { race_pm: PM_DWARF, item_otyp: SPEAR, subs_otyp: DWARVISH_SPEAR }, { race_pm: PM_DWARF, item_otyp: SHORT_SWORD, subs_otyp: DWARVISH_SHORT_SWORD }, { race_pm: PM_DWARF, item_otyp: HELMET, subs_otyp: DWARVISH_IRON_HELM }, { race_pm: PM_DWARF, item_otyp: LEMBAS_WAFER, subs_otyp: CRAM_RATION }, { race_pm: PM_GNOME, item_otyp: BOW, subs_otyp: CROSSBOW }, { race_pm: PM_GNOME, item_otyp: ARROW, subs_otyp: CROSSBOW_BOLT }, { race_pm: NON_PM, item_otyp: STRANGE_OBJECT, subs_otyp: STRANGE_OBJECT }];
/* { PM_ELF, SMALL_SHIELD, ELVEN_SHIELD }, */
/* { PM_DWARF, SMALL_SHIELD, DWARVISH_ROUNDSHIELD }, */
/* { PM_DWARF, PICK_AXE, DWARVISH_MATTOCK }, */
const Skill_A = [{ skill: P_DAGGER, skmax: P_BASIC }, { skill: P_KNIFE, skmax: P_BASIC }, { skill: P_PICK_AXE, skmax: P_EXPERT }, { skill: P_SHORT_SWORD, skmax: P_BASIC }, { skill: P_SABER, skmax: P_EXPERT }, { skill: P_CLUB, skmax: P_SKILLED }, { skill: P_QUARTERSTAFF, skmax: P_SKILLED }, { skill: P_SLING, skmax: P_SKILLED }, { skill: P_DART, skmax: P_BASIC }, { skill: P_BOOMERANG, skmax: P_EXPERT }, { skill: P_WHIP, skmax: P_EXPERT }, { skill: P_UNICORN_HORN, skmax: P_SKILLED }, { skill: P_ATTACK_SPELL, skmax: P_BASIC }, { skill: P_HEALING_SPELL, skmax: P_BASIC }, { skill: P_DIVINATION_SPELL, skmax: P_EXPERT }, { skill: P_MATTER_SPELL, skmax: P_BASIC }, { skill: P_RIDING, skmax: P_BASIC }, { skill: P_TWO_WEAPON_COMBAT, skmax: P_BASIC }, { skill: P_BARE_HANDED_COMBAT, skmax: P_EXPERT }, { skill: P_NONE, skmax: 0 }];
const Skill_B = [{ skill: P_DAGGER, skmax: P_BASIC }, { skill: P_AXE, skmax: P_EXPERT }, { skill: P_PICK_AXE, skmax: P_SKILLED }, { skill: P_SHORT_SWORD, skmax: P_EXPERT }, { skill: P_BROAD_SWORD, skmax: P_SKILLED }, { skill: P_LONG_SWORD, skmax: P_SKILLED }, { skill: P_TWO_HANDED_SWORD, skmax: P_EXPERT }, { skill: P_SABER, skmax: P_SKILLED }, { skill: P_CLUB, skmax: P_SKILLED }, { skill: P_MACE, skmax: P_SKILLED }, { skill: P_MORNING_STAR, skmax: P_SKILLED }, { skill: P_FLAIL, skmax: P_BASIC }, { skill: P_HAMMER, skmax: P_EXPERT }, { skill: P_QUARTERSTAFF, skmax: P_BASIC }, { skill: P_SPEAR, skmax: P_SKILLED }, { skill: P_TRIDENT, skmax: P_SKILLED }, { skill: P_BOW, skmax: P_BASIC }, { skill: P_ATTACK_SPELL, skmax: P_BASIC }, { skill: P_ESCAPE_SPELL, skmax: P_BASIC }, { skill: P_RIDING, skmax: P_BASIC }, { skill: P_TWO_WEAPON_COMBAT, skmax: P_BASIC }, { skill: P_BARE_HANDED_COMBAT, skmax: P_MASTER }, { skill: P_NONE, skmax: 0 }];
/* special spell is haste self */
const Skill_C = [{ skill: P_DAGGER, skmax: P_BASIC }, { skill: P_KNIFE, skmax: P_SKILLED }, { skill: P_AXE, skmax: P_SKILLED }, { skill: P_PICK_AXE, skmax: P_BASIC }, { skill: P_CLUB, skmax: P_EXPERT }, { skill: P_MACE, skmax: P_EXPERT }, { skill: P_MORNING_STAR, skmax: P_BASIC }, { skill: P_FLAIL, skmax: P_SKILLED }, { skill: P_HAMMER, skmax: P_SKILLED }, { skill: P_QUARTERSTAFF, skmax: P_EXPERT }, { skill: P_POLEARMS, skmax: P_SKILLED }, { skill: P_SPEAR, skmax: P_EXPERT }, { skill: P_TRIDENT, skmax: P_SKILLED }, { skill: P_BOW, skmax: P_SKILLED }, { skill: P_SLING, skmax: P_EXPERT }, { skill: P_ATTACK_SPELL, skmax: P_BASIC }, { skill: P_MATTER_SPELL, skmax: P_SKILLED }, { skill: P_BOOMERANG, skmax: P_EXPERT }, { skill: P_UNICORN_HORN, skmax: P_BASIC }, { skill: P_BARE_HANDED_COMBAT, skmax: P_MASTER }, { skill: P_NONE, skmax: 0 }];
const Skill_H = [{ skill: P_DAGGER, skmax: P_SKILLED }, { skill: P_KNIFE, skmax: P_EXPERT }, { skill: P_SHORT_SWORD, skmax: P_SKILLED }, { skill: P_SABER, skmax: P_BASIC }, { skill: P_CLUB, skmax: P_SKILLED }, { skill: P_MACE, skmax: P_BASIC }, { skill: P_QUARTERSTAFF, skmax: P_EXPERT }, { skill: P_POLEARMS, skmax: P_BASIC }, { skill: P_SPEAR, skmax: P_BASIC }, { skill: P_TRIDENT, skmax: P_BASIC }, { skill: P_SLING, skmax: P_SKILLED }, { skill: P_DART, skmax: P_EXPERT }, { skill: P_SHURIKEN, skmax: P_SKILLED }, { skill: P_UNICORN_HORN, skmax: P_EXPERT }, { skill: P_HEALING_SPELL, skmax: P_EXPERT }, { skill: P_BARE_HANDED_COMBAT, skmax: P_BASIC }, { skill: P_NONE, skmax: 0 }];
const Skill_K = [{ skill: P_DAGGER, skmax: P_BASIC }, { skill: P_KNIFE, skmax: P_BASIC }, { skill: P_AXE, skmax: P_SKILLED }, { skill: P_PICK_AXE, skmax: P_BASIC }, { skill: P_SHORT_SWORD, skmax: P_SKILLED }, { skill: P_BROAD_SWORD, skmax: P_SKILLED }, { skill: P_LONG_SWORD, skmax: P_EXPERT }, { skill: P_TWO_HANDED_SWORD, skmax: P_SKILLED }, { skill: P_SABER, skmax: P_SKILLED }, { skill: P_CLUB, skmax: P_BASIC }, { skill: P_MACE, skmax: P_SKILLED }, { skill: P_MORNING_STAR, skmax: P_SKILLED }, { skill: P_FLAIL, skmax: P_BASIC }, { skill: P_HAMMER, skmax: P_BASIC }, { skill: P_POLEARMS, skmax: P_SKILLED }, { skill: P_SPEAR, skmax: P_SKILLED }, { skill: P_TRIDENT, skmax: P_BASIC }, { skill: P_LANCE, skmax: P_EXPERT }, { skill: P_BOW, skmax: P_BASIC }, { skill: P_CROSSBOW, skmax: P_SKILLED }, { skill: P_ATTACK_SPELL, skmax: P_SKILLED }, { skill: P_HEALING_SPELL, skmax: P_SKILLED }, { skill: P_CLERIC_SPELL, skmax: P_SKILLED }, { skill: P_RIDING, skmax: P_EXPERT }, { skill: P_TWO_WEAPON_COMBAT, skmax: P_SKILLED }, { skill: P_BARE_HANDED_COMBAT, skmax: P_EXPERT }, { skill: P_NONE, skmax: 0 }];
const Skill_Mon = [{ skill: P_QUARTERSTAFF, skmax: P_BASIC }, { skill: P_SPEAR, skmax: P_BASIC }, { skill: P_CROSSBOW, skmax: P_BASIC }, { skill: P_SHURIKEN, skmax: P_BASIC }, { skill: P_ATTACK_SPELL, skmax: P_BASIC }, { skill: P_HEALING_SPELL, skmax: P_EXPERT }, { skill: P_DIVINATION_SPELL, skmax: P_BASIC }, { skill: P_ENCHANTMENT_SPELL, skmax: P_BASIC }, { skill: P_CLERIC_SPELL, skmax: P_SKILLED }, { skill: P_ESCAPE_SPELL, skmax: P_SKILLED }, { skill: P_MATTER_SPELL, skmax: P_BASIC }, { skill: P_BARE_HANDED_COMBAT, skmax: P_GRAND_MASTER }, { skill: P_NONE, skmax: 0 }];
const Skill_P = [{ skill: P_CLUB, skmax: P_EXPERT }, { skill: P_MACE, skmax: P_EXPERT }, { skill: P_MORNING_STAR, skmax: P_EXPERT }, { skill: P_FLAIL, skmax: P_EXPERT }, { skill: P_HAMMER, skmax: P_EXPERT }, { skill: P_QUARTERSTAFF, skmax: P_EXPERT }, { skill: P_POLEARMS, skmax: P_SKILLED }, { skill: P_SPEAR, skmax: P_SKILLED }, { skill: P_TRIDENT, skmax: P_SKILLED }, { skill: P_LANCE, skmax: P_BASIC }, { skill: P_BOW, skmax: P_BASIC }, { skill: P_SLING, skmax: P_BASIC }, { skill: P_CROSSBOW, skmax: P_BASIC }, { skill: P_DART, skmax: P_BASIC }, { skill: P_SHURIKEN, skmax: P_BASIC }, { skill: P_BOOMERANG, skmax: P_BASIC }, { skill: P_UNICORN_HORN, skmax: P_SKILLED }, { skill: P_HEALING_SPELL, skmax: P_EXPERT }, { skill: P_DIVINATION_SPELL, skmax: P_EXPERT }, { skill: P_CLERIC_SPELL, skmax: P_EXPERT }, { skill: P_BARE_HANDED_COMBAT, skmax: P_BASIC }, { skill: P_NONE, skmax: 0 }];
const Skill_R = [{ skill: P_DAGGER, skmax: P_EXPERT }, { skill: P_KNIFE, skmax: P_EXPERT }, { skill: P_SHORT_SWORD, skmax: P_EXPERT }, { skill: P_BROAD_SWORD, skmax: P_SKILLED }, { skill: P_LONG_SWORD, skmax: P_SKILLED }, { skill: P_TWO_HANDED_SWORD, skmax: P_BASIC }, { skill: P_SABER, skmax: P_SKILLED }, { skill: P_CLUB, skmax: P_SKILLED }, { skill: P_MACE, skmax: P_SKILLED }, { skill: P_MORNING_STAR, skmax: P_BASIC }, { skill: P_FLAIL, skmax: P_BASIC }, { skill: P_HAMMER, skmax: P_BASIC }, { skill: P_POLEARMS, skmax: P_BASIC }, { skill: P_SPEAR, skmax: P_BASIC }, { skill: P_CROSSBOW, skmax: P_EXPERT }, { skill: P_DART, skmax: P_EXPERT }, { skill: P_SHURIKEN, skmax: P_SKILLED }, { skill: P_DIVINATION_SPELL, skmax: P_SKILLED }, { skill: P_ESCAPE_SPELL, skmax: P_SKILLED }, { skill: P_MATTER_SPELL, skmax: P_SKILLED }, { skill: P_RIDING, skmax: P_BASIC }, { skill: P_TWO_WEAPON_COMBAT, skmax: P_EXPERT }, { skill: P_BARE_HANDED_COMBAT, skmax: P_EXPERT }, { skill: P_NONE, skmax: 0 }];
const Skill_Ran = [{ skill: P_DAGGER, skmax: P_EXPERT }, { skill: P_KNIFE, skmax: P_SKILLED }, { skill: P_AXE, skmax: P_SKILLED }, { skill: P_PICK_AXE, skmax: P_BASIC }, { skill: P_SHORT_SWORD, skmax: P_BASIC }, { skill: P_MORNING_STAR, skmax: P_BASIC }, { skill: P_FLAIL, skmax: P_SKILLED }, { skill: P_HAMMER, skmax: P_BASIC }, { skill: P_QUARTERSTAFF, skmax: P_BASIC }, { skill: P_POLEARMS, skmax: P_SKILLED }, { skill: P_SPEAR, skmax: P_EXPERT }, { skill: P_TRIDENT, skmax: P_BASIC }, { skill: P_BOW, skmax: P_EXPERT }, { skill: P_SLING, skmax: P_EXPERT }, { skill: P_CROSSBOW, skmax: P_EXPERT }, { skill: P_DART, skmax: P_EXPERT }, { skill: P_SHURIKEN, skmax: P_SKILLED }, { skill: P_BOOMERANG, skmax: P_EXPERT }, { skill: P_WHIP, skmax: P_BASIC }, { skill: P_HEALING_SPELL, skmax: P_BASIC }, { skill: P_DIVINATION_SPELL, skmax: P_EXPERT }, { skill: P_ESCAPE_SPELL, skmax: P_BASIC }, { skill: P_RIDING, skmax: P_BASIC }, { skill: P_BARE_HANDED_COMBAT, skmax: P_BASIC }, { skill: P_NONE, skmax: 0 }];
const Skill_S = [{ skill: P_DAGGER, skmax: P_BASIC }, { skill: P_KNIFE, skmax: P_SKILLED }, { skill: P_SHORT_SWORD, skmax: P_EXPERT }, { skill: P_BROAD_SWORD, skmax: P_SKILLED }, { skill: P_LONG_SWORD, skmax: P_EXPERT }, { skill: P_TWO_HANDED_SWORD, skmax: P_EXPERT }, { skill: P_SABER, skmax: P_BASIC }, { skill: P_FLAIL, skmax: P_SKILLED }, { skill: P_QUARTERSTAFF, skmax: P_BASIC }, { skill: P_POLEARMS, skmax: P_SKILLED }, { skill: P_SPEAR, skmax: P_SKILLED }, { skill: P_LANCE, skmax: P_SKILLED }, { skill: P_BOW, skmax: P_EXPERT }, { skill: P_SHURIKEN, skmax: P_EXPERT }, { skill: P_ATTACK_SPELL, skmax: P_BASIC }, { skill: P_DIVINATION_SPELL, skmax: P_BASIC }, { skill: P_CLERIC_SPELL, skmax: P_SKILLED }, { skill: P_RIDING, skmax: P_SKILLED }, { skill: P_TWO_WEAPON_COMBAT, skmax: P_EXPERT }, { skill: P_BARE_HANDED_COMBAT, skmax: P_MASTER }, { skill: P_NONE, skmax: 0 }];
/* special spell is clairvoyance */
const Skill_T = [{ skill: P_DAGGER, skmax: P_EXPERT }, { skill: P_KNIFE, skmax: P_SKILLED }, { skill: P_AXE, skmax: P_BASIC }, { skill: P_PICK_AXE, skmax: P_BASIC }, { skill: P_SHORT_SWORD, skmax: P_EXPERT }, { skill: P_BROAD_SWORD, skmax: P_BASIC }, { skill: P_LONG_SWORD, skmax: P_BASIC }, { skill: P_TWO_HANDED_SWORD, skmax: P_BASIC }, { skill: P_SABER, skmax: P_SKILLED }, { skill: P_MACE, skmax: P_BASIC }, { skill: P_MORNING_STAR, skmax: P_BASIC }, { skill: P_FLAIL, skmax: P_BASIC }, { skill: P_HAMMER, skmax: P_BASIC }, { skill: P_QUARTERSTAFF, skmax: P_BASIC }, { skill: P_POLEARMS, skmax: P_BASIC }, { skill: P_SPEAR, skmax: P_BASIC }, { skill: P_TRIDENT, skmax: P_BASIC }, { skill: P_LANCE, skmax: P_BASIC }, { skill: P_BOW, skmax: P_BASIC }, { skill: P_SLING, skmax: P_BASIC }, { skill: P_CROSSBOW, skmax: P_BASIC }, { skill: P_DART, skmax: P_EXPERT }, { skill: P_SHURIKEN, skmax: P_BASIC }, { skill: P_BOOMERANG, skmax: P_BASIC }, { skill: P_WHIP, skmax: P_BASIC }, { skill: P_UNICORN_HORN, skmax: P_SKILLED }, { skill: P_DIVINATION_SPELL, skmax: P_BASIC }, { skill: P_ENCHANTMENT_SPELL, skmax: P_BASIC }, { skill: P_ESCAPE_SPELL, skmax: P_SKILLED }, { skill: P_RIDING, skmax: P_BASIC }, { skill: P_TWO_WEAPON_COMBAT, skmax: P_SKILLED }, { skill: P_BARE_HANDED_COMBAT, skmax: P_SKILLED }, { skill: P_NONE, skmax: 0 }];
const Skill_V = [{ skill: P_DAGGER, skmax: P_EXPERT }, { skill: P_AXE, skmax: P_EXPERT }, { skill: P_PICK_AXE, skmax: P_SKILLED }, { skill: P_SHORT_SWORD, skmax: P_SKILLED }, { skill: P_BROAD_SWORD, skmax: P_SKILLED }, { skill: P_LONG_SWORD, skmax: P_EXPERT }, { skill: P_TWO_HANDED_SWORD, skmax: P_EXPERT }, { skill: P_SABER, skmax: P_BASIC }, { skill: P_HAMMER, skmax: P_EXPERT }, { skill: P_QUARTERSTAFF, skmax: P_BASIC }, { skill: P_POLEARMS, skmax: P_SKILLED }, { skill: P_SPEAR, skmax: P_EXPERT }, { skill: P_TRIDENT, skmax: P_BASIC }, { skill: P_LANCE, skmax: P_SKILLED }, { skill: P_SLING, skmax: P_BASIC }, { skill: P_ATTACK_SPELL, skmax: P_BASIC }, { skill: P_ESCAPE_SPELL, skmax: P_BASIC }, { skill: P_RIDING, skmax: P_SKILLED }, { skill: P_TWO_WEAPON_COMBAT, skmax: P_SKILLED }, { skill: P_BARE_HANDED_COMBAT, skmax: P_EXPERT }, { skill: P_NONE, skmax: 0 }];
const Skill_W = [{ skill: P_DAGGER, skmax: P_EXPERT }, { skill: P_KNIFE, skmax: P_SKILLED }, { skill: P_AXE, skmax: P_SKILLED }, { skill: P_SHORT_SWORD, skmax: P_BASIC }, { skill: P_CLUB, skmax: P_SKILLED }, { skill: P_MACE, skmax: P_BASIC }, { skill: P_QUARTERSTAFF, skmax: P_EXPERT }, { skill: P_POLEARMS, skmax: P_SKILLED }, { skill: P_SPEAR, skmax: P_BASIC }, { skill: P_TRIDENT, skmax: P_BASIC }, { skill: P_SLING, skmax: P_SKILLED }, { skill: P_DART, skmax: P_EXPERT }, { skill: P_SHURIKEN, skmax: P_BASIC }, { skill: P_ATTACK_SPELL, skmax: P_EXPERT }, { skill: P_HEALING_SPELL, skmax: P_SKILLED }, { skill: P_DIVINATION_SPELL, skmax: P_EXPERT }, { skill: P_ENCHANTMENT_SPELL, skmax: P_SKILLED }, { skill: P_CLERIC_SPELL, skmax: P_SKILLED }, { skill: P_ESCAPE_SPELL, skmax: P_EXPERT }, { skill: P_MATTER_SPELL, skmax: P_EXPERT }, { skill: P_RIDING, skmax: P_BASIC }, { skill: P_BARE_HANDED_COMBAT, skmax: P_BASIC }, { skill: P_NONE, skmax: 0 }];
export function knows_object(obj, override_pauper) {
    if (game.u.uroleplay.pauper && !override_pauper) {
        return;
    }
    /* mark as known, but not yet encountered */
    discover_object(obj, (1), (0), (0));
}
/* Know ordinary (non-magical) objects of a certain class,
   like all gems except the loadstone and luckstone. */
export function knows_class(sym) {
    let odummy = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    let o = null;
    let ct = 0;
    if (game.u.uroleplay.pauper) {
        return;
    }
    Object.assign(odummy, cg.zeroobj);
    odummy.oclass = sym;
    /* for use in various obj.h macros */
    o = odummy;
    for (ct = game.bases[sym]; ct < game.bases[sym + 1]; ct++) {
        /*
     * Note:  the exceptions here can be bypassed if necessary by
     *        calling knows_object() directly.  So an elven ranger,
     *        for example, knows all elven weapons despite the bow,
     *        arrow, and spear limitation below.
     */
        /* not flagged as magic but shouldn't be pre-discovered
           (small shields look the same as two types of magical shield;
           cornuthaum / dunce cap look the same as each other) */
        if (ct == CORNUTHAUM || ct == DUNCE_CAP || ct == SMALL_SHIELD) {
            continue;
        }
        if (sym == WEAPON_CLASS) {
            odummy.otyp = ct;
            /* arbitrary: only knights and samurai recognize polearms */
            if ((!(game.urole.mnum == (PM_KNIGHT)) && !(game.urole.mnum == (PM_SAMURAI))) && ((o.oclass == WEAPON_CLASS || o.oclass == TOOL_CLASS) && (game.objects[o.otyp].oc_subtyp == P_POLEARMS || game.objects[o.otyp].oc_subtyp == P_LANCE || is_art(o, ART_SNICKERSNEE)))) {
                continue;
            }
            /* rangers know all launchers (bows, &c), ammo (arrows, &c),
               and spears regardless of race/species, but not other weapons */
            if ((game.urole.mnum == (PM_RANGER)) && (!(o.oclass == WEAPON_CLASS && game.objects[o.otyp].oc_subtyp >= P_BOW && game.objects[o.otyp].oc_subtyp <= P_CROSSBOW) && !((o.oclass == WEAPON_CLASS || o.oclass == GEM_CLASS) && game.objects[o.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[o.otyp].oc_subtyp <= -P_BOW) && !(o.oclass == WEAPON_CLASS && game.objects[o.otyp].oc_subtyp == P_SPEAR))) {
                continue;
            }
            /* rogues know daggers, regardless of racial variations */
            if ((game.urole.mnum == (PM_ROGUE)) && (game.objects[o.otyp].oc_subtyp != P_DAGGER)) {
                continue;
            }
        }
        if (game.objects[ct].oc_class == sym && !game.objects[ct].oc_magic) {
            knows_object(ct, (0));
        }
    }
}
/* role-specific initializations, mostly inventory

   other things may be initialised here, but the function might run more than
   once, so any non-inventory initialisations should be nonrandom and
   idempotent (i.e. doing them twice is OK) */
const __u_init_role_M_spell = [Healing_book, Protection_book, Confuse_monster_book];
export function u_init_role() {
    fnEnter("u_init_role", "u_init.c", 0);
    let i = 0;
    /* the program used to check moves<=1 && invent==NULL do decide whether
       a new game has started, but due to the 'pauper' option/conduct, can't
       rely on invent becoming non-Null anymore; instead, initialize moves
       to 0 instead of 1, then set it to 1 here, where invent init occurs */
    game.moves = 1;
    switch ((game.urole.mnum)) {
        /* rn2(100) > 50 necessary for some choices because some
     * random number generators are bad enough to seriously
     * skew the results if we use rn2(2)...  --KAA
     */
        case PM_ARCHEOLOGIST:
            ini_inv(Archeologist);
            if (!rn2(10)) {
                ini_inv(Tinopener);
            } else if (!rn2(4)) {
                ini_inv(Lamp);
            } else if (!rn2(5)) {
                ini_inv(Magicmarker);
            }
            /* FALSE: don't override pauper here,
                                    * but sack will be made known in
                                    * pauper_reinit() */
            knows_object(SACK, (0));
            /* FALSE: don't override pauper here,
                                          * but TOUCHSTONE will be made known
                                          * in pauper_reinit() */
            knows_object(TOUCHSTONE, (0));
            /* give knights chess-like mobility--idea from wooledge@..cwru.edu */
            /* KMH, conduct --
         * Some may claim that this isn't agnostic, since they
         * are literally "priests" and they have holy water.
         * But we don't count it as such.  Purists can always
         * avoid playing priests and/or confirm another player's
         * role in their YAAP.
         */
            /* only get here when didn't boost strength or constitution */
            break;
        case PM_BARBARIAN:
            if (rn2(100) >= 50) {
                ini_inv(Barbarian_0);
            } else {
                ini_inv(Barbarian_1);
            }
            if (!rn2(6)) {
                ini_inv(Lamp);
            }
            /* bows, arrows, spears only */
            knows_class(WEAPON_CLASS);
            knows_class(ARMOR_CLASS);
            break;
        case PM_CAVE_DWELLER:
            ini_inv(Cave_man);
            break;
        /* paupers don't know any spells yet, but several roles will recognize
       the spellbook for a key spell (not necessarily that role's special
       spell); "supply chests" on the first few levels provide a fairly
       high chance to find the book; some other roles know a non-book item */
        case PM_HEALER:
            game.u.umoney0 = (rn2(1000) + (1001));
            ini_inv(Healer);
            if (!rn2(25)) {
                ini_inv(Lamp);
            }
            knows_object(POT_FULL_HEALING, (0));
            break;
        case PM_KNIGHT:
            ini_inv(Knight);
            knows_class(WEAPON_CLASS);
            knows_class(ARMOR_CLASS);
            game.u.uprops[JUMPING].intrinsic |= 67108864;
            break;
        case PM_MONK:
{
                ini_inv(Monk);
                ini_inv(__u_init_role_M_spell[Math.trunc(rn2(90) / 30)]);
                if (!rn2(4)) {
                    ini_inv(Magicmarker);
                } else if (!rn2(10)) {
                    ini_inv(Lamp);
                }
                knows_class(ARMOR_CLASS);
                /* sufficiently martial-arts oriented item to ignore language issue */
                knows_object(SHURIKEN, (0));
                break;
            }
        case PM_CLERIC:
            ini_inv(Priest);
            if (!rn2(5)) {
                ini_inv(Magicmarker);
            } else if (!rn2(10)) {
                ini_inv(Lamp);
            }
            knows_object(POT_WATER, (1));
            break;
        case PM_RANGER:
            ini_inv(Ranger);
            knows_class(WEAPON_CLASS);
            break;
        case PM_ROGUE:
            game.u.umoney0 = 0;
            ini_inv(Rogue);
            if (!rn2(5)) {
                ini_inv(Blindfold);
            }
            knows_object(SACK, (0));
            knows_class(WEAPON_CLASS);
            break;
        case PM_SAMURAI:
            ini_inv(Samurai);
            if (!rn2(5)) {
                ini_inv(Blindfold);
            }
            knows_class(WEAPON_CLASS);
            knows_class(ARMOR_CLASS);
            for (i = MAXOCLASSES; i < NUM_OBJECTS; ++i) {
                /* in order to assist non-Japanese speakers, pre-discover items
           that switch to Japanese names when playing as a Samurai */
                if (game.objects[i].oc_magic) {
                    continue;
                }
                if (Japanese_item_name(i, null)) {
                    knows_object(i, (0));
                }
            }
            break;
        case PM_TOURIST:
            game.u.umoney0 = rnd(1000);
            ini_inv(Tourist);
            if (!rn2(25)) {
                ini_inv(Tinopener);
            } else if (!rn2(25)) {
                ini_inv(Leash);
            } else if (!rn2(25)) {
                ini_inv(Towel);
            } else if (!rn2(20)) {
                ini_inv(Magicmarker);
            }
            break;
        case PM_VALKYRIE:
            ini_inv(Valkyrie);
            if (!rn2(6)) {
                ini_inv(Lamp);
            }
            knows_class(WEAPON_CLASS);
            knows_class(ARMOR_CLASS);
            break;
        case PM_WIZARD:
            ini_inv(Wizard);
            if (!rn2(5)) {
                ini_inv(Blindfold);
            }
            break;
        default:
            break;
    }
    game.nocreate = STRANGE_OBJECT;
    game.nocreate2 = STRANGE_OBJECT;
    game.nocreate3 = STRANGE_OBJECT;
    game.nocreate4 = STRANGE_OBJECT;
}
/* race-specific initializations, same restrictions as u_init_role */
const __u_init_race_trotyp = [WOODEN_FLUTE, TOOLED_HORN, WOODEN_HARP, BELL, BUGLE, LEATHER_DRUM];
export function u_init_race() {
    fnEnter("u_init_race", "u_init.c", 0);
    switch ((game.urace.mnum)) {
        case PM_HUMAN:
            break;
        case PM_ELF:
            if ((game.urole.mnum == (PM_CLERIC)) || (game.urole.mnum == (PM_WIZARD))) {
                /*
         * Elves are people of music and song, or they are warriors.
         * Non-warriors get an instrument.  We use a kludge to
         * get only non-magic instruments.
         */
                let Instrument = [{ trotyp: __u_init_race_trotyp[rn2((Math.trunc(24 /* sizeof(const int [6]) */ / 4 /* sizeof(const int) */)))], trspe: 0, trclass: TOOL_CLASS, trquan_min: 1, trquan_max: 1, trbless: 0 }, { trotyp: 0, trspe: 0, trclass: 0, trquan_min: 0, trquan_max: 0, trbless: 0 }];
                ini_inv(Instrument);
            }
            /* Elves can recognize all elvish objects */
            knows_object(ELVEN_SHORT_SWORD, (0));
            knows_object(ELVEN_ARROW, (0));
            knows_object(ELVEN_BOW, (0));
            knows_object(ELVEN_SPEAR, (0));
            knows_object(ELVEN_DAGGER, (0));
            knows_object(ELVEN_BROADSWORD, (0));
            knows_object(ELVEN_MITHRIL_COAT, (0));
            knows_object(ELVEN_LEATHER_HELM, (0));
            knows_object(ELVEN_SHIELD, (0));
            knows_object(ELVEN_BOOTS, (0));
            knows_object(ELVEN_CLOAK, (0));
            break;
        case PM_DWARF:
            knows_object(DWARVISH_SPEAR, (0));
            knows_object(DWARVISH_SHORT_SWORD, (0));
            knows_object(DWARVISH_MATTOCK, (0));
            knows_object(DWARVISH_IRON_HELM, (0));
            knows_object(DWARVISH_MITHRIL_COAT, (0));
            knows_object(DWARVISH_CLOAK, (0));
            knows_object(DWARVISH_ROUNDSHIELD, (0));
            break;
        case PM_GNOME:
            break;
        case PM_ORC:
            if (!(game.urole.mnum == (PM_WIZARD))) {
                ini_inv(Xtra_food);
            }
            /* Orcs can recognize all orcish objects */
            knows_object(ORCISH_SHORT_SWORD, (0));
            knows_object(ORCISH_ARROW, (0));
            knows_object(ORCISH_BOW, (0));
            knows_object(ORCISH_SPEAR, (0));
            knows_object(ORCISH_DAGGER, (0));
            knows_object(ORCISH_CHAIN_MAIL, (0));
            knows_object(ORCISH_RING_MAIL, (0));
            knows_object(ORCISH_HELM, (0));
            knows_object(ORCISH_SHIELD, (0));
            knows_object(URUK_HAI_SHIELD, (0));
            knows_object(ORCISH_CLOAK, (0));
            break;
        default:
            break;
    }
}
/* for 'pauper' aka 'unprepared'; take away any skills (bare-handed combat,
   riding) that are better than unskilled; learn the book (without carrying
   it or knowing its spell yet) for some key spells */
export function pauper_reinit() {
    let skill = 0;
    let preknown = STRANGE_OBJECT;
    if (!game.u.uroleplay.pauper) {
        return;
    }
    for (skill = 0; skill < P_NUM_SKILLS; skill++) {
        if ((game.u.weapon_skills[skill].skill) > P_UNSKILLED) {
            (game.u.weapon_skills[skill].skill) = P_UNSKILLED;
            (game.u.weapon_skills[skill].advance) = 0;
        }
    }
    /* pauper has lost out on initial skills, but provide some unspent skill
       credits to make up for that */
    game.u.weapon_slots = 2;
    switch ((game.urole.mnum)) {
        case PM_HEALER:
            preknown = SPE_HEALING;
            break;
        case PM_CLERIC:
        case PM_KNIGHT:
        case PM_MONK:
            preknown = SPE_PROTECTION;
            break;
        case PM_WIZARD:
            preknown = SPE_FORCE_BOLT;
            break;
        case PM_ARCHEOLOGIST:
            preknown = TOUCHSTONE;
            break;
        case PM_CAVE_DWELLER:
            preknown = FLINT;
            break;
        case PM_ROGUE:
        case PM_TOURIST:
            preknown = SACK;
            break;
        case PM_SAMURAI:
            preknown = FOOD_RATION;
            break;
        default:
        case PM_BARBARIAN:
        case PM_RANGER:
        case PM_VALKYRIE:
            break;
    }
    if (preknown != STRANGE_OBJECT) {
        knows_object(preknown, (1));
    }
}
/* boost STR and CON until hero can carry inventory */
export function u_init_carry_attr_boost() {
    while (inv_weight() > 0) {
        /* make sure you can carry all you have - especially for Tourists */
        if (adjattrib(A_STR, 1, (1))) {
            continue;
        }
        if (adjattrib(A_CON, 1, (1))) {
            continue;
        }
        break;
    }
}
/* initialise u, except inventory, attributes, skills and discoveries */
export function u_init_misc() {
    fnEnter("u_init_misc", "u_init.c", 0);
    let i = 0;
    let tmpuroleplay = game.u.uroleplay;
    game.flags.female = game.flags.initgend;
    game.flags.beginner = (1);
    /* zero u, including pointer values --
     * necessary when aborting from a failed restore */
    memset(game.u, 0, 1 /* sizeof(struct you) */);
    game.u.ustuck = null;
    memset(game.ubirthday, 0, 1 /* sizeof(time_t) */);
    memset(game.urealtime, 0, 1 /* sizeof(struct u_realtime) */);
    /* restore options set via rcfile */
    game.u.uroleplay = tmpuroleplay;
    /* documentation of more zero values as desirable */
    /* no divine gifts bestowed */
    game.u.uz.dlevel = 1;
    game.u.uz0.dlevel = 0;
    game.u.utolev = game.u.uz;
    game.u.umoved = (0);
    game.u.umortality = 0;
    game.u.ugrave_arise = NON_PM;
    game.u.umonnum = game.u.umonster = game.urole.mnum;
    game.u.ulycn = NON_PM;
    set_uasmon();
    /* set up some of the initial attributes */
    game.u.ulevel = 0;
    game.u.uhp = game.u.uhpmax = game.u.uhppeak = newhp();
    game.u.uen = game.u.uenmax = game.u.uenpeak = newpw();
    game.u.uspellprot = 0;
    adjabil(0, 1);
    game.u.ulevel = game.u.ulevelmax = 1;
    init_uhunger();
    for (i = 0; i <= MAXSPELL; i++) {
        game.spl_book[i].sp_id = 0;
    }
    game.u.ublesscnt = 300;
    game.u.ualignbase[0] = game.u.ualignbase[1] = game.u.ualign.type = aligns[game.flags.initalign].value;
    time(game.ubirthday);
    /*
     *  For now, everyone starts out with a night vision range of 1 and
     *  their xray_range disabled.
     */
    game.u.nv_range = 1;
    game.u.xray_range = -1;
    game.u.unblind_telepat_range = -1;
    /* OPTIONS:blind results in permanent blindness (unless overridden
       by the Eyes of the Overworld, which will clear 'u.uroleplay.blind'
       to void the conduct, but will leave the PermaBlind bit set so that
       blindness resumes when the Eyes are removed). */
    if (game.u.uroleplay.blind) {
        game.u.uprops[BLINDED].intrinsic |= 67108864;
    }
    /* roughly based on distribution in human population */
    game.u.uhandedness = rn2(10) ? 0 : 1;
    /* set max str size for class ranks */
    max_rank_sz();
    return;
}
/* the appropriate set of skills for the role */
export function skills_for_role() {
    let skills = null;
    switch ((game.urole.mnum)) {
        case PM_ARCHEOLOGIST:
            skills = Skill_A;
            break;
        case PM_BARBARIAN:
            skills = Skill_B;
            break;
        case PM_CAVE_DWELLER:
            skills = Skill_C;
            break;
        case PM_HEALER:
            skills = Skill_H;
            break;
        case PM_KNIGHT:
            skills = Skill_K;
            break;
        case PM_MONK:
            skills = Skill_Mon;
            break;
        case PM_CLERIC:
            skills = Skill_P;
            break;
        case PM_RANGER:
            skills = Skill_Ran;
            break;
        case PM_ROGUE:
            skills = Skill_R;
            break;
        case PM_SAMURAI:
            skills = Skill_S;
            break;
        case PM_TOURIST:
            skills = Skill_T;
            break;
        case PM_VALKYRIE:
            skills = Skill_V;
            break;
        case PM_WIZARD:
            skills = Skill_W;
            break;
        default:
            panic("No skills found for role");
            break;
    }
    return skills;
}
/* skills aren't initialized, so we use the role-specific skill lists */
export function restricted_spell_discipline(otyp) {
    let skills = skills_for_role();
    let this_skill = spell_skilltype(otyp);
    const __nhi_skills_arr = skills;
    for (let __nhi_skills = 0; (skills = __nhi_skills_arr[__nhi_skills]) && (skills && skills.skill != P_NONE); __nhi_skills++) {
        if (skills.skill == this_skill) {
            return (0);
        }
    }
    return (1);
}
/* randomizes the quantity given a trobj description */
export function trquan(trop) {
    if (!trop.trquan_min) {
        return 1;
    }
    return trop.trquan_min + rn2(trop.trquan_max - trop.trquan_min + 1);
}
/* create random object of certain class, filtering out too powerful items */
export function ini_inv_mkobj_filter(oclass, got_level1_spellbook) {
    let obj = null;
    let otyp = 0;
    let trycnt = 0;
    /*
     * For random objects, do not create certain overly powerful
     * items: wand of wishing, ring of levitation, or the
     * polymorph/polymorph control combination.  Specific objects,
     * i.e. the discovery wishing, are still OK.
     * Also, don't get a couple of really useless items.  (Note:
     * punishment isn't "useless".  Some players who start out with
     * one will immediately read it and use the iron ball as a
     * weapon.)
     */
    obj = mkobj(oclass, (0));
    otyp = obj.otyp;
    while (otyp == WAN_WISHING || otyp == game.nocreate || otyp == game.nocreate2 || otyp == game.nocreate3 || otyp == game.nocreate4 || otyp == RIN_LEVITATION || otyp == POT_HALLUCINATION || otyp == POT_ACID || otyp == SCR_AMNESIA || otyp == SCR_FIRE || otyp == SCR_BLANK_PAPER || otyp == SPE_BLANK_PAPER || otyp == RIN_AGGRAVATE_MONSTER || otyp == RIN_HUNGER || otyp == WAN_NOTHING || (otyp == RIN_POISON_RESISTANCE && (game.urace.mnum == (PM_ORC))) || (otyp == SCR_ENCHANT_WEAPON && (game.urole.mnum == (PM_MONK))) || (otyp == SPE_FORCE_BOLT && (game.urole.mnum == (PM_WIZARD))) || (obj.oclass == SPBOOK_CLASS && (game.objects[otyp].oc_oc2 > (got_level1_spellbook ? 3 : 1) || restricted_spell_discipline(otyp))) || otyp == SPE_NOVEL) {
        /* orcs start with poison resistance */
        /* wizard patch -- they already have one */
        /* powerful spells are either useless to
              low level players or unbalancing; also
              spells in restricted skill categories */
        dealloc_obj(obj);
        if (++trycnt > 1000) {
            /* This lonely pancake's potential will never be realized.
             * It will exist only as a thought, of something that could have
             * been, but never will be. It will never experience maple syrup
             * oozing into its nooks, or see the delightful expression on
             * someone's face as they are about to let it dance across their
             * taste buds. */
            obj = mksobj(PANCAKE, (1), (0));
            break;
        }
        obj = mkobj(oclass, (0));
        otyp = obj.otyp;
    }
    return obj;
}
/* substitute object with something else based on race.
   only changes otyp, and returns it. */
export function ini_inv_obj_substitution(trop, obj) {
    if (game.urace.mnum != PM_HUMAN) {
        let i = 0;
        for (i = 0; inv_subs[i].race_pm != NON_PM; ++i) {
            if (inv_subs[i].race_pm == game.urace.mnum && obj.otyp == inv_subs[i].item_otyp) {
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/u_init.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        pline("ini_inv: substituting %s for %s%s", (game.obj_descr[(game.objects[inv_subs[i].subs_otyp]).oc_name_idx].oc_name), (trop.trotyp == 0) ? "random " : "", (game.obj_descr[(game.objects[obj.otyp]).oc_name_idx].oc_name));
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
                /* substitute race-specific items; this used to be in
           the 'if (otyp != UNDEF_TYP) { }' block above, but then
           substitutions didn't occur for randomly generated items
           (particularly food) which have racial substitutes */
                obj.otyp = inv_subs[i].subs_otyp;
                break;
            }
        }
    }
    return obj.otyp;
}
/* returns: TRUE to stop generating items from this trobj,
   FALSE for normal behaviour */
export function ini_inv_adjust_obj(trop, obj) {
    let stop = (0);
    if (trop.trclass == COIN_CLASS) {
        /* no "blessed" or "identified" money */
        obj.quan = game.u.umoney0;
    } else {
        if (game.objects[obj.otyp].oc_uses_known) {
            obj.known = 1;
        }
        /* not observe_object during startup, that's handled later */
        obj.dknown = obj.bknown = obj.rknown = 1;
        if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) || obj.otyp == STATUE) {
            obj.cknown = obj.lknown = 1;
            obj.otrapped = 0;
        }
        obj.cursed = 0;
        if (obj.otrapped && game.u.ualign.type != (-1)) {
            obj.otrapped = 0;
        }
        if (obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) {
            obj.quan = trquan(trop);
            stop = (1);
        } else if (obj.oclass == GEM_CLASS && ((obj).otyp == LUCKSTONE || (obj).otyp == LOADSTONE || (obj).otyp == FLINT || (obj).otyp == TOUCHSTONE) && obj.otyp != FLINT) {
            obj.quan = 1;
        }
        if (trop.trspe != 127) {
            obj.spe = trop.trspe;
            if (trop.trotyp == MAGIC_MARKER && obj.spe < 96) {
                obj.spe += rn2(4);
            }
        } else {
            /* Don't start with +0 or negative rings */
            if (game.objects[obj.otyp].oc_class == RING_CLASS && game.objects[obj.otyp].oc_charged && obj.spe <= 0) {
                obj.spe = rne(3);
            }
        }
        if (trop.trbless != 2) {
            obj.blessed = trop.trbless;
        }
    }
    /* defined after setting otyp+quan + blessedness */
    obj.owt = weight(obj);
    return stop;
}
/* initial inventory: wear, wield, learn the spell/obj */
export function ini_inv_use_obj(obj) {
    fnEnter("ini_inv_use_obj", "u_init.c", 0);
    /* Make the type known if necessary */
    if ((game.obj_descr[(game.objects[obj.otyp]).oc_descr_idx].oc_descr) && obj.known) {
        discover_object(obj.otyp, (1), (1), (0));
    }
    if (obj.otyp == OIL_LAMP) {
        discover_object(POT_OIL, (1), (1), (0));
    }
    if (obj.oclass == ARMOR_CLASS) {
        if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SHIELD) && !game.uarms && !(game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big))) {
            /* Prior to 3.6.2 this used to unset uswapwep if it was set,
               but wearing a shield doesn't prevent having an alternate
               weapon ready to swap with the primary; just make sure we
               aren't two-weaponing (academic; no one starts that way) */
            set_twoweap((0));
            setworn(obj, 8);
        } else if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_HELM) && !game.uarmh) {
            setworn(obj, 4);
        } else if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_GLOVES) && !game.uarmg) {
            setworn(obj, 16);
        } else if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SHIRT) && !game.uarmu) {
            setworn(obj, 64);
        } else if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_CLOAK) && !game.uarmc) {
            setworn(obj, 2);
        } else if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_BOOTS) && !game.uarmf) {
            setworn(obj, 32);
        } else if ((obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_SUIT) && !game.uarm) {
            setworn(obj, 1);
        }
    }
    if (obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || obj.otyp == TIN_OPENER || obj.otyp == FLINT || obj.otyp == ROCK) {
        if (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART)) {
            if (!game.uquiver) {
                setuqwep(obj);
            }
        } else if (!game.uwep && (!game.uarms || !((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_big))) {
            setuwep(obj);
        } else if (!game.uswapwep) {
            setuswapwep(obj);
        }
    }
    if (obj.oclass == SPBOOK_CLASS && obj.otyp != SPE_BLANK_PAPER) {
        initialspell(obj);
    }
}
export function ini_inv(trop) { let __ti = 0;
    let obj = null;
    let otyp = 0;
    /* got a level 1 spellbook? */
    let got_sp1 = (0);
    let quan = 0;
    if (game.u.uroleplay.pauper) {
        return;
    }
    quan = trquan(trop[__ti]);
    while (trop[__ti].trclass) {
        otyp = trop[__ti].trotyp;
        if (otyp != 0) {
            obj = mksobj(otyp, (1), (0));
        } else {
            obj = ini_inv_mkobj_filter(trop[__ti].trclass, got_sp1);
            otyp = obj.otyp;
            switch (otyp) {
                /* Heavily relies on the facts that 1) we create wands
             * before rings, that 2) we create rings before
             * spellbooks, and that 3) not more than 1 object of a
             * particular symbol is to be prohibited.  (For more
             * objects, we need more nocreate variables...)
             */
                case WAN_POLYMORPH:
                case RIN_POLYMORPH:
                case POT_POLYMORPH:
                    game.nocreate = RIN_POLYMORPH_CONTROL;
                    break;
                case RIN_POLYMORPH_CONTROL:
                    game.nocreate = RIN_POLYMORPH;
                    game.nocreate2 = SPE_POLYMORPH;
                    game.nocreate3 = POT_POLYMORPH;
            }
            /* Don't have 2 of the same ring or spellbook */
            if (obj.oclass == RING_CLASS || obj.oclass == SPBOOK_CLASS) {
                game.nocreate4 = otyp;
            }
        }
        otyp = ini_inv_obj_substitution(trop[__ti], obj);
        ((otyp));
        if (game.u.uroleplay.nudist && obj.oclass == ARMOR_CLASS) {
            dealloc_obj(obj);
            __ti++;
            continue;
        }
        if (ini_inv_adjust_obj(trop[__ti], obj)) {
            quan = 1;
        }
        obj = addinv(obj);
        /* First spellbook should be level 1 - did we get it? */
        if (obj.oclass == SPBOOK_CLASS && game.objects[obj.otyp].oc_oc2 == 1) {
            got_sp1 = (1);
        }
        if (--quan) {
            continue;
        }
        __ti++;
        quan = trquan(trop[__ti]);
    }
}
/* initialise starting inventory and attributes

   this function can be run multiple times and will overwrite the effects of
   previous runs */
export function u_init_inventory_attrs() {
    fnEnter("u_init_inventory_attrs", "u_init.c", 0);
    game.lastinvnr = 51;
    while (game.invent) {
        useupall(game.invent);
    }
    game.u.umoney0 = 0;
    u_init_role();
    u_init_race();
    if (game.flags.explore) {
        ini_inv(Wishing);
    }
    if (game.u.umoney0) {
        ini_inv(Money);
    }
    /* in case sack has gold in it */
    game.u.umoney0 += hidden_gold((1));
    init_attr(75);
    /* minor variation to attrs */
    vary_init_attr();
    u_init_carry_attr_boost();
}
/* side effects of starting inventory (e.g. discovering it) and skills (both
   those based on role and those based on starting inventory) */
export function u_init_skills_discoveries() {
    let otmp = null;
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        ini_inv_use_obj(otmp);
    }
    skill_init(skills_for_role());
    if (game.u.uroleplay.pauper) {
        pauper_reinit();
    }
    /* If we have at least one spell, force starting Pw to be enough,
       so hero can cast the level 1 spell they should have */
    if (num_spells() && (game.u.uenmax < ((1) * 5))) {
        game.u.uen = game.u.uenmax = game.u.uenpeak = game.u.ueninc[game.u.ulevel] = ((1) * 5);
    }
    find_ac();
}
/*u_init.c*/
/* we don't override pauper here because that would give
                   samarai an advantage of knowing several items in advance */
/* Dwarves can recognize all dwarvish objects */
/* compensate for generally inferior equipment */
/* food ration isn't interesting to discover, but put "gunyoki" into
           discoveries list for players who might not recognize what it is */
/* Put post-creation object adjustments that don't depend on whether
         * it was UNDEF_TYP or not after this. */
