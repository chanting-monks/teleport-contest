import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	role.c	$NHDT-Date: 1737607158 2025/01/22 20:39:18 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.107 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985-1999. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/*** Table of all roles ***/
/* According to AD&D, HD for some classes (ex. Wizard) should be smaller
 * (4-sided for wizards).  But this is not AD&D, and using the AD&D
 * rule here produces an unplayable character.  Thus I have used a minimum
 * of an 10-sided hit die for everything.  Another AD&D change: wizards get
 * a minimum strength of 4 since without one you can't teleport or cast
 * spells. --KAA
 *
 * As the wizard has been updated (wizard patch 5 jun '96) their HD can be
 * brought closer into line with AD&D. This forces wizards to use magic more
 * and distance themselves from their attackers. --LSZ
 *
 * With the introduction of races, some hit points and energy
 * has been reallocated for each race.  The values assigned
 * to the roles has been reduced by the amount allocated to
 * humans.  --KMH
 *
 * God names use a leading underscore to flag goddesses.
 */
/* NUM_ROLES is defined in hack.h */
import { game } from '../gstate.js';
import { free } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcpy, strlen, strncmpi, strstri } from '../c2js-runtime/string.js';
import { yn_function } from './cmd.js';
import { cg } from './decl.js';
import { nul_glyphinfo } from './display.js';
import { nh_terminate } from './end.js';
import { eos, findword, highc, lowc, s_suffix, strNsubst, strkitten, strsubst, trimspaces } from './hacklib.js';
import { ART_EYES_OF_THE_OVERWORLD, ART_EYE_OF_THE_AETHIOPICA, ART_HEART_OF_AHRIMAN, ART_LONGBOW_OF_DIANA, ART_MAGIC_MIRROR_OF_MERLIN, ART_MASTER_KEY_OF_THIEVERY, ART_MITRE_OF_HOLINESS, ART_ORB_OF_DETECTION, ART_ORB_OF_FATE, ART_SCEPTRE_OF_MIGHT, ART_STAFF_OF_AESCULAPIUS, ART_TSURUGI_OF_MURAMASA, ART_YENDORIAN_EXPRESS_CARD, A_INT, A_WIS, MS_LEADER, MS_NEMESIS, NON_PM, PM_ABBOT, PM_ACOLYTE, PM_APPRENTICE, PM_ARCHEOLOGIST, PM_ARCH_PRIEST, PM_ASHIKAGA_TAKAUJI, PM_ATTENDANT, PM_BARBARIAN, PM_BUGBEAR, PM_CAVE_DWELLER, PM_CHIEFTAIN, PM_CHROMATIC_DRAGON, PM_CLERIC, PM_CYCLOPS, PM_DARK_ONE, PM_DWARF, PM_DWARF_MUMMY, PM_DWARF_ZOMBIE, PM_EARTH_ELEMENTAL, PM_ELF, PM_ELF_MUMMY, PM_ELF_ZOMBIE, PM_FIRE_ANT, PM_FIRE_GIANT, PM_FOREST_CENTAUR, PM_GIANT_RAT, PM_GIANT_SPIDER, PM_GNOME, PM_GNOME_MUMMY, PM_GNOME_ZOMBIE, PM_GRAND_MASTER, PM_GUARDIAN_NAGA, PM_GUIDE, PM_HEALER, PM_HILL_GIANT, PM_HIPPOCRATES, PM_HUMAN, PM_HUMAN_MUMMY, PM_HUMAN_ZOMBIE, PM_HUNTER, PM_IXOTH, PM_KING_ARTHUR, PM_KITTEN, PM_KNIGHT, PM_LEPRECHAUN, PM_LITTLE_DOG, PM_LORD_CARNARVON, PM_LORD_SATO, PM_LORD_SURTUR, PM_MAIL_DAEMON, PM_MASTER_ASSASSIN, PM_MASTER_KAEN, PM_MASTER_OF_THIEVES, PM_MINION_OF_HUHETOTL, PM_MONK, PM_NALZOK, PM_NEANDERTHAL, PM_NEFERET_THE_GREEN, PM_NORN, PM_OCHRE_JELLY, PM_OGRE, PM_ORC, PM_ORC_MUMMY, PM_ORC_ZOMBIE, PM_ORION, PM_PAGE, PM_PELIAS, PM_PONY, PM_QUASIT, PM_RANGER, PM_ROGUE, PM_ROSHI, PM_SAMURAI, PM_SCORPION, PM_SCORPIUS, PM_SHAMAN_KARNOV, PM_SHOPKEEPER, PM_SNAKE, PM_STALKER, PM_STUDENT, PM_THOTH_AMON, PM_THUG, PM_TOURIST, PM_TROLL, PM_TWOFLOWER, PM_VALKYRIE, PM_VAMPIRE_BAT, PM_WARRIOR, PM_WIZARD, PM_WOLF, PM_WRAITH, PM_XORN, P_CLERIC_SPELL, SPE_CHARM_MONSTER, SPE_CLAIRVOYANCE, SPE_CONE_OF_COLD, SPE_CURE_SICKNESS, SPE_DETECT_TREASURE, SPE_DIG, SPE_HASTE_SELF, SPE_INVISIBILITY, SPE_LIGHT, SPE_MAGIC_MAPPING, SPE_MAGIC_MISSILE, SPE_REMOVE_CURSE, SPE_RESTORE_ABILITY, SPE_TURN_UNDEAD, STRANGE_OBJECT, S_ANT, S_BAT, S_CENTAUR, S_DOG, S_ELEMENTAL, S_GIANT, S_HUMANOID, S_IMP, S_JELLY, S_MUMMY, S_NAGA, S_NYMPH, S_OGRE, S_RODENT, S_SNAKE, S_SPIDER, S_TROLL, S_WRAITH, S_XORN, S_YETI, S_ZOMBIE } from './nh-constants.js';
import { an } from './objnam.js';
import { align_gtitle } from './pray.js';
import { rn2, rn2_on_display_rng } from './rnd.js';
import { Strlen_ } from './strutil.js';
import { add_menu, add_menu_str, select_menu } from './windows.js';

export const roles = [{ name: { m: "Archeologist", f: null }, rank: [{ m: "Digger", f: null }, { m: "Field Worker", f: null }, { m: "Investigator", f: null }, { m: "Exhumer", f: null }, { m: "Excavator", f: null }, { m: "Spelunker", f: null }, { m: "Speleologist", f: null }, { m: "Collector", f: null }, { m: "Curator", f: null }], lgod: "Quetzalcoatl", ngod: "Camaxtli", cgod: "Huhetotl", filecode: "Arc", homebase: "the College of Archeology", intermed: "the Tomb of the Toltec Kings", mnum: PM_ARCHEOLOGIST, petnum: NON_PM, ldrnum: PM_LORD_CARNARVON, guardnum: PM_STUDENT, neminum: PM_MINION_OF_HUHETOTL, enemy1num: NON_PM, enemy2num: PM_HUMAN_MUMMY, enemy1sym: S_SNAKE, enemy2sym: S_MUMMY, questarti: ART_ORB_OF_DETECTION, allow: 8 | 32 | 64 | 4096 | 8192 | 4 | 2, attrbase: [7, 10, 10, 7, 7, 7], attrdist: [20, 20, 20, 10, 20, 10], hpadv: { infix: 11, inrnd: 0, lofix: 0, lornd: 8, hifix: 1, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 }, xlev: 14, initrecord: 10, spelbase: 5, spelheal: 0, spelshld: 2, spelarmr: 10, spelstat: A_INT, spelspec: SPE_MAGIC_MAPPING, spelsbon: -4 }, { name: { m: "Barbarian", f: null }, rank: [{ m: "Plunderer", f: "Plunderess" }, { m: "Pillager", f: null }, { m: "Bandit", f: null }, { m: "Brigand", f: null }, { m: "Raider", f: null }, { m: "Reaver", f: null }, { m: "Slayer", f: null }, { m: "Chieftain", f: "Chieftainess" }, { m: "Conqueror", f: "Conqueress" }], lgod: "Mitra", ngod: "Crom", cgod: "Set", filecode: "Bar", homebase: "the Camp of the Duali Tribe", intermed: "the Duali Oasis", mnum: PM_BARBARIAN, petnum: NON_PM, ldrnum: PM_PELIAS, guardnum: PM_CHIEFTAIN, neminum: PM_THOTH_AMON, enemy1num: PM_OGRE, enemy2num: PM_TROLL, enemy1sym: S_OGRE, enemy2sym: S_TROLL, questarti: ART_HEART_OF_AHRIMAN, allow: 8 | 128 | 4096 | 8192 | 2 | 1, attrbase: [16, 7, 7, 15, 16, 6], attrdist: [30, 6, 7, 20, 30, 7], hpadv: { infix: 14, inrnd: 0, lofix: 0, lornd: 10, hifix: 2, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 }, xlev: 10, initrecord: 10, spelbase: 14, spelheal: 0, spelshld: 0, spelarmr: 8, spelstat: A_INT, spelspec: SPE_HASTE_SELF, spelsbon: -4 }, { name: { m: "Caveman", f: "Cavewoman" }, rank: [{ m: "Troglodyte", f: null }, { m: "Aborigine", f: null }, { m: "Wanderer", f: null }, { m: "Vagrant", f: null }, { m: "Wayfarer", f: null }, { m: "Roamer", f: null }, { m: "Nomad", f: null }, { m: "Rover", f: null }, { m: "Pioneer", f: null }], lgod: "Anu", ngod: "_Ishtar", cgod: "Anshar", filecode: "Cav", homebase: "the Caves of the Ancestors", intermed: "the Dragon's Lair", mnum: PM_CAVE_DWELLER, petnum: PM_LITTLE_DOG, ldrnum: PM_SHAMAN_KARNOV, guardnum: PM_NEANDERTHAL, neminum: PM_CHROMATIC_DRAGON, enemy1num: PM_BUGBEAR, enemy2num: PM_HILL_GIANT, enemy1sym: S_HUMANOID, enemy2sym: S_GIANT, questarti: ART_SCEPTRE_OF_MIGHT, allow: 8 | 32 | 64 | 4096 | 8192 | 4 | 2, attrbase: [10, 7, 7, 7, 8, 6], attrdist: [30, 6, 7, 20, 30, 7], hpadv: { infix: 14, inrnd: 0, lofix: 0, lornd: 8, hifix: 2, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 }, xlev: 10, initrecord: 0, spelbase: 12, spelheal: 0, spelshld: 1, spelarmr: 8, spelstat: A_INT, spelspec: SPE_DIG, spelsbon: -4 }, { name: { m: "Healer", f: null }, rank: [{ m: "Rhizotomist", f: null }, { m: "Empiric", f: null }, { m: "Embalmer", f: null }, { m: "Dresser", f: null }, { m: "Medicus ossium", f: "Medica ossium" }, { m: "Herbalist", f: null }, { m: "Magister", f: "Magistra" }, { m: "Physician", f: null }, { m: "Chirurgeon", f: null }], lgod: "_Athena", ngod: "Hermes", cgod: "Poseidon", filecode: "Hea", homebase: "the Temple of Epidaurus", intermed: "the Temple of Coeus", mnum: PM_HEALER, petnum: NON_PM, ldrnum: PM_HIPPOCRATES, guardnum: PM_ATTENDANT, neminum: PM_CYCLOPS, enemy1num: PM_GIANT_RAT, enemy2num: PM_SNAKE, enemy1sym: S_RODENT, enemy2sym: S_YETI, questarti: ART_STAFF_OF_AESCULAPIUS, allow: 8 | 64 | 4096 | 8192 | 2, attrbase: [7, 7, 13, 7, 11, 16], attrdist: [15, 20, 20, 15, 25, 5], hpadv: { infix: 11, inrnd: 0, lofix: 0, lornd: 8, hifix: 1, hirnd: 0 }, enadv: { infix: 1, inrnd: 4, lofix: 0, lornd: 1, hifix: 0, hirnd: 2 }, xlev: 20, initrecord: 10, spelbase: 3, spelheal: -3, spelshld: 2, spelarmr: 10, spelstat: A_WIS, spelspec: SPE_CURE_SICKNESS, spelsbon: -4 }, { name: { m: "Knight", f: null }, rank: [{ m: "Gallant", f: null }, { m: "Esquire", f: null }, { m: "Bachelor", f: null }, { m: "Sergeant", f: null }, { m: "Knight", f: null }, { m: "Banneret", f: null }, { m: "Chevalier", f: "Chevaliere" }, { m: "Seignieur", f: "Dame" }, { m: "Paladin", f: null }], lgod: "Lugh", ngod: "_Brigit", cgod: "Manannan Mac Lir", filecode: "Kni", homebase: "Camelot Castle", intermed: "the Isle of Glass", mnum: PM_KNIGHT, petnum: PM_PONY, ldrnum: PM_KING_ARTHUR, guardnum: PM_PAGE, neminum: PM_IXOTH, enemy1num: PM_QUASIT, enemy2num: PM_OCHRE_JELLY, enemy1sym: S_IMP, enemy2sym: S_JELLY, questarti: ART_MAGIC_MIRROR_OF_MERLIN, allow: 8 | 4096 | 8192 | 4, attrbase: [13, 7, 14, 8, 10, 17], attrdist: [30, 15, 15, 10, 20, 10], hpadv: { infix: 14, inrnd: 0, lofix: 0, lornd: 8, hifix: 2, hirnd: 0 }, enadv: { infix: 1, inrnd: 4, lofix: 0, lornd: 1, hifix: 0, hirnd: 2 }, xlev: 10, initrecord: 10, spelbase: 8, spelheal: -2, spelshld: 0, spelarmr: 9, spelstat: A_WIS, spelspec: SPE_TURN_UNDEAD, spelsbon: -4 }, { name: { m: "Monk", f: null }, rank: [{ m: "Candidate", f: null }, { m: "Novice", f: null }, { m: "Initiate", f: null }, { m: "Student of Stones", f: null }, { m: "Student of Waters", f: null }, { m: "Student of Metals", f: null }, { m: "Student of Winds", f: null }, { m: "Student of Fire", f: null }, { m: "Master", f: null }], lgod: "Shan Lai Ching", ngod: "Chih Sung-tzu", cgod: "Huan Ti", filecode: "Mon", homebase: "the Monastery of Chan-Sune", intermed: "the Monastery of the Earth-Lord", mnum: PM_MONK, petnum: NON_PM, ldrnum: PM_GRAND_MASTER, guardnum: PM_ABBOT, neminum: PM_MASTER_KAEN, enemy1num: PM_EARTH_ELEMENTAL, enemy2num: PM_XORN, enemy1sym: S_ELEMENTAL, enemy2sym: S_XORN, questarti: ART_EYES_OF_THE_OVERWORLD, allow: 8 | 4096 | 8192 | 4 | 2 | 1, attrbase: [10, 7, 8, 8, 7, 7], attrdist: [25, 10, 20, 20, 15, 10], hpadv: { infix: 12, inrnd: 0, lofix: 0, lornd: 8, hifix: 1, hirnd: 0 }, enadv: { infix: 2, inrnd: 2, lofix: 0, lornd: 2, hifix: 0, hirnd: 2 }, xlev: 10, initrecord: 10, spelbase: 8, spelheal: -2, spelshld: 2, spelarmr: 20, spelstat: A_WIS, spelspec: SPE_RESTORE_ABILITY, spelsbon: -4 }, { name: { m: "Priest", f: "Priestess" }, rank: [{ m: "Aspirant", f: null }, { m: "Acolyte", f: null }, { m: "Adept", f: null }, { m: "Priest", f: "Priestess" }, { m: "Curate", f: null }, { m: "Canon", f: "Canoness" }, { m: "Lama", f: null }, { m: "Patriarch", f: "Matriarch" }, { m: "High Priest", f: "High Priestess" }], lgod: null, ngod: null, cgod: null, filecode: "Pri", homebase: "the Great Temple", intermed: "the Temple of Nalzok", mnum: PM_CLERIC, petnum: NON_PM, ldrnum: PM_ARCH_PRIEST, guardnum: PM_ACOLYTE, neminum: PM_NALZOK, enemy1num: PM_HUMAN_ZOMBIE, enemy2num: PM_WRAITH, enemy1sym: S_ZOMBIE, enemy2sym: S_WRAITH, questarti: ART_MITRE_OF_HOLINESS, allow: 8 | 16 | 4096 | 8192 | 4 | 2 | 1, attrbase: [7, 7, 10, 7, 7, 7], attrdist: [15, 10, 30, 15, 20, 10], hpadv: { infix: 12, inrnd: 0, lofix: 0, lornd: 8, hifix: 1, hirnd: 0 }, enadv: { infix: 4, inrnd: 3, lofix: 0, lornd: 2, hifix: 0, hirnd: 2 }, xlev: 10, initrecord: 0, spelbase: 3, spelheal: -2, spelshld: 2, spelarmr: 10, spelstat: A_WIS, spelspec: SPE_REMOVE_CURSE, spelsbon: -4 }, { name: { m: "Rogue", f: null }, rank: [{ m: "Footpad", f: null }, { m: "Cutpurse", f: null }, { m: "Rogue", f: null }, { m: "Pilferer", f: null }, { m: "Robber", f: null }, { m: "Burglar", f: null }, { m: "Filcher", f: null }, { m: "Magsman", f: "Magswoman" }, { m: "Thief", f: null }], lgod: "Issek", ngod: "Mog", cgod: "Kos", filecode: "Rog", homebase: "the Thieves' Guild Hall", intermed: "the Assassins' Guild Hall", mnum: PM_ROGUE, petnum: NON_PM, ldrnum: PM_MASTER_OF_THIEVES, guardnum: PM_THUG, neminum: PM_MASTER_ASSASSIN, enemy1num: PM_LEPRECHAUN, enemy2num: PM_GUARDIAN_NAGA, enemy1sym: S_NYMPH, enemy2sym: S_NAGA, questarti: ART_MASTER_KEY_OF_THIEVERY, allow: 8 | 128 | 4096 | 8192 | 1, attrbase: [7, 7, 7, 10, 7, 6], attrdist: [20, 10, 10, 30, 20, 10], hpadv: { infix: 10, inrnd: 0, lofix: 0, lornd: 8, hifix: 1, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 }, xlev: 11, initrecord: 10, spelbase: 8, spelheal: 0, spelshld: 1, spelarmr: 9, spelstat: A_INT, spelspec: SPE_DETECT_TREASURE, spelsbon: -4 }, { name: { m: "Ranger", f: null }, rank: [{ m: "Tenderfoot", f: null }, { m: "Lookout", f: null }, { m: "Trailblazer", f: null }, { m: "Reconnoiterer", f: "Reconnoiteress" }, { m: "Scout", f: null }, { m: "Arbalester", f: null }, { m: "Archer", f: null }, { m: "Sharpshooter", f: null }, { m: "Marksman", f: "Markswoman" }], lgod: "Mercury", ngod: "_Venus", cgod: "Mars", filecode: "Ran", homebase: "Orion's camp", intermed: "the cave of the wumpus", mnum: PM_RANGER, petnum: PM_LITTLE_DOG, ldrnum: PM_ORION, guardnum: PM_HUNTER, neminum: PM_SCORPIUS, enemy1num: PM_FOREST_CENTAUR, enemy2num: PM_SCORPION, enemy1sym: S_CENTAUR, enemy2sym: S_SPIDER, questarti: ART_LONGBOW_OF_DIANA, allow: 8 | 16 | 64 | 128 | 4096 | 8192 | 2 | 1, attrbase: [13, 13, 13, 9, 13, 7], attrdist: [30, 10, 10, 20, 20, 10], hpadv: { infix: 13, inrnd: 0, lofix: 0, lornd: 6, hifix: 1, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 }, xlev: 12, initrecord: 10, spelbase: 9, spelheal: 2, spelshld: 1, spelarmr: 10, spelstat: A_INT, spelspec: SPE_INVISIBILITY, spelsbon: -4 }, { name: { m: "Samurai", f: null }, rank: [{ m: "Hatamoto", f: null }, { m: "Ronin", f: null }, { m: "Ninja", f: "Kunoichi" }, { m: "Joshu", f: null }, { m: "Ryoshu", f: null }, { m: "Kokushu", f: null }, { m: "Daimyo", f: null }, { m: "Kuge", f: null }, { m: "Shogun", f: null }], lgod: "_Amaterasu Omikami", ngod: "Raijin", cgod: "Susanowo", filecode: "Sam", homebase: "the Castle of the Taro Clan", intermed: "the Shogun's Castle", mnum: PM_SAMURAI, petnum: PM_LITTLE_DOG, ldrnum: PM_LORD_SATO, guardnum: PM_ROSHI, neminum: PM_ASHIKAGA_TAKAUJI, enemy1num: PM_WOLF, enemy2num: PM_STALKER, enemy1sym: S_DOG, enemy2sym: S_ELEMENTAL, questarti: ART_TSURUGI_OF_MURAMASA, allow: 8 | 4096 | 8192 | 4, attrbase: [10, 8, 7, 10, 17, 6], attrdist: [30, 10, 8, 30, 14, 8], hpadv: { infix: 13, inrnd: 0, lofix: 0, lornd: 8, hifix: 1, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 }, xlev: 11, initrecord: 10, spelbase: 10, spelheal: 0, spelshld: 0, spelarmr: 8, spelstat: A_INT, spelspec: SPE_CLAIRVOYANCE, spelsbon: -4 }, { name: { m: "Tourist", f: null }, rank: [{ m: "Rambler", f: null }, { m: "Sightseer", f: null }, { m: "Excursionist", f: null }, { m: "Peregrinator", f: "Peregrinatrix" }, { m: "Traveler", f: null }, { m: "Journeyer", f: null }, { m: "Voyager", f: null }, { m: "Explorer", f: null }, { m: "Adventurer", f: null }], lgod: "Blind Io", ngod: "_The Lady", cgod: "Offler", filecode: "Tou", homebase: "Ankh-Morpork", intermed: "the Thieves' Guild Hall", mnum: PM_TOURIST, petnum: NON_PM, ldrnum: PM_TWOFLOWER, guardnum: PM_GUIDE, neminum: PM_MASTER_OF_THIEVES, enemy1num: PM_GIANT_SPIDER, enemy2num: PM_FOREST_CENTAUR, enemy1sym: S_SPIDER, enemy2sym: S_CENTAUR, questarti: ART_YENDORIAN_EXPRESS_CARD, allow: 8 | 4096 | 8192 | 2, attrbase: [7, 10, 6, 7, 7, 10], attrdist: [15, 10, 10, 15, 30, 20], hpadv: { infix: 8, inrnd: 0, lofix: 0, lornd: 8, hifix: 0, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 }, xlev: 14, initrecord: 0, spelbase: 5, spelheal: 1, spelshld: 2, spelarmr: 10, spelstat: A_INT, spelspec: SPE_CHARM_MONSTER, spelsbon: -4 }, { name: { m: "Valkyrie", f: null }, rank: [{ m: "Stripling", f: null }, { m: "Skirmisher", f: null }, { m: "Fighter", f: null }, { m: "Man-at-arms", f: "Woman-at-arms" }, { m: "Warrior", f: null }, { m: "Swashbuckler", f: null }, { m: "Hero", f: "Heroine" }, { m: "Champion", f: null }, { m: "Lord", f: "Lady" }], lgod: "Tyr", ngod: "Odin", cgod: "Loki", filecode: "Val", homebase: "the Shrine of Destiny", intermed: "the cave of Surtur", mnum: PM_VALKYRIE, petnum: NON_PM, ldrnum: PM_NORN, guardnum: PM_WARRIOR, neminum: PM_LORD_SURTUR, enemy1num: PM_FIRE_ANT, enemy2num: PM_FIRE_GIANT, enemy1sym: S_ANT, enemy2sym: S_GIANT, questarti: ART_ORB_OF_FATE, allow: 8 | 32 | 8192 | 4 | 2, attrbase: [10, 7, 7, 7, 10, 7], attrdist: [30, 6, 7, 20, 30, 7], hpadv: { infix: 14, inrnd: 0, lofix: 0, lornd: 8, hifix: 2, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 1 }, xlev: 10, initrecord: 0, spelbase: 10, spelheal: -2, spelshld: 0, spelarmr: 9, spelstat: A_WIS, spelspec: SPE_CONE_OF_COLD, spelsbon: -4 }, { name: { m: "Wizard", f: null }, rank: [{ m: "Evoker", f: null }, { m: "Conjurer", f: null }, { m: "Thaumaturge", f: null }, { m: "Magician", f: null }, { m: "Enchanter", f: "Enchantress" }, { m: "Sorcerer", f: "Sorceress" }, { m: "Necromancer", f: null }, { m: "Wizard", f: null }, { m: "Mage", f: null }], lgod: "Ptah", ngod: "Thoth", cgod: "Anhur", filecode: "Wiz", homebase: "the Lonely Tower", intermed: "the Tower of Darkness", mnum: PM_WIZARD, petnum: PM_KITTEN, ldrnum: PM_NEFERET_THE_GREEN, guardnum: PM_APPRENTICE, neminum: PM_DARK_ONE, enemy1num: PM_VAMPIRE_BAT, enemy2num: PM_XORN, enemy1sym: S_BAT, enemy2sym: S_WRAITH, questarti: ART_EYE_OF_THE_AETHIOPICA, allow: 8 | 16 | 64 | 128 | 4096 | 8192 | 2 | 1, attrbase: [7, 10, 7, 7, 7, 7], attrdist: [10, 30, 10, 20, 20, 10], hpadv: { infix: 10, inrnd: 0, lofix: 0, lornd: 8, hifix: 1, hirnd: 0 }, enadv: { infix: 4, inrnd: 3, lofix: 0, lornd: 2, hifix: 0, hirnd: 3 }, xlev: 12, initrecord: 0, spelbase: 1, spelheal: 0, spelshld: 3, spelarmr: 10, spelstat: A_INT, spelspec: SPE_MAGIC_MISSILE, spelsbon: -4 }, { name: { m: null, f: null }, rank: [{ m: null, f: null }, { m: null, f: null }, { m: null, f: null }, { m: null, f: null }, { m: null, f: null }, { m: null, f: null }, { m: null, f: null }, { m: null, f: null }, { m: null, f: null }], lgod: null, ngod: null, cgod: null, filecode: null, homebase: null, intermed: null, mnum: NON_PM, petnum: NON_PM, ldrnum: NON_PM, guardnum: NON_PM, neminum: NON_PM, enemy1num: NON_PM, enemy2num: NON_PM, enemy1sym: 0, enemy2sym: 0, questarti: STRANGE_OBJECT, allow: 0, attrbase: [0, 0, 0, 0, 0, 0], attrdist: [0, 0, 0, 0, 0, 0], hpadv: { infix: 0, inrnd: 0, lofix: 0, lornd: 0, hifix: 0, hirnd: 0 }, enadv: { infix: 0, inrnd: 0, lofix: 0, lornd: 0, hifix: 0, hirnd: 0 }, xlev: 0, initrecord: 0, spelbase: 0, spelheal: 0, spelshld: 0, spelarmr: 0, spelstat: 0, spelspec: 0, spelsbon: 0 }];
/* Central American */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Hyborian */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Babylonian */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Greek */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Celtic */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Chinese */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* deities from a randomly chosen other role will be used */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Note:  Rogue precedes Ranger so that use of `-R' on the command line
       retains its traditional meaning. */
/* Nehwon */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* OBSOLETE */
/* elf-maid */
/* warrior */
/* commander (Q.) ['a] educated guess,
                                          until further research- SAC */
/* king's servant, minister (Q.) - guess */
/* lord, lady (S.) ['ir] */
/* noble elf, maiden (S.) */
/* prince (S.), elf-maiden (Q.) */
/* Star-king, -queen (Q.) */
/* Elven */
/* One skilled at crossbows */
/* Roman/planets */
/* Orion & canis major */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Banner Knight */
/* no allegiance */
/* secret society */
/* heads a castle */
/* has a territory */
/* heads a province */
/* a samurai lord */
/* Noble of the Court */
/* supreme commander, warlord */
/* Japanese */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Discworld */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Norse */
/*PM_WINTER_WOLF_CUB*/
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Egyptian */
/* Str Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Array terminator */
/* Table of all races */
/* NUM_RACES is defined in hack.h */
export const races = [{ noun: "human", adj: "human", coll: "humanity", filecode: "Hum", individual: { m: "man", f: "woman" }, mnum: PM_HUMAN, mummynum: PM_HUMAN_MUMMY, zombienum: PM_HUMAN_ZOMBIE, allow: 8 | 4096 | 8192 | 4 | 2 | 1, selfmask: 8, lovemask: 0, hatemask: 64 | 128, attrmin: [3, 3, 3, 3, 3, 3], attrmax: [(18 + (100)), 18, 18, 18, 18, 18], hpadv: { infix: 2, inrnd: 0, lofix: 0, lornd: 2, hifix: 1, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 2, lornd: 0, hifix: 2, hirnd: 0 } }, { noun: "elf", adj: "elven", coll: "elvenkind", filecode: "Elf", individual: { m: null, f: null }, mnum: PM_ELF, mummynum: PM_ELF_MUMMY, zombienum: PM_ELF_ZOMBIE, allow: 16 | 4096 | 8192 | 1, selfmask: 16, lovemask: 16, hatemask: 128, attrmin: [3, 3, 3, 3, 3, 3], attrmax: [18, 20, 20, 18, 16, 18], hpadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 1, hirnd: 0 }, enadv: { infix: 2, inrnd: 0, lofix: 3, lornd: 0, hifix: 3, hirnd: 0 } }, { noun: "dwarf", adj: "dwarven", coll: "dwarvenkind", filecode: "Dwa", individual: { m: null, f: null }, mnum: PM_DWARF, mummynum: PM_DWARF_MUMMY, zombienum: PM_DWARF_ZOMBIE, allow: 32 | 4096 | 8192 | 4, selfmask: 32, lovemask: 32 | 64, hatemask: 128, attrmin: [3, 3, 3, 3, 3, 3], attrmax: [(18 + (100)), 16, 16, 20, 20, 16], hpadv: { infix: 4, inrnd: 0, lofix: 0, lornd: 3, hifix: 2, hirnd: 0 }, enadv: { infix: 0, inrnd: 0, lofix: 0, lornd: 0, hifix: 0, hirnd: 0 } }, { noun: "gnome", adj: "gnomish", coll: "gnomehood", filecode: "Gno", individual: { m: null, f: null }, mnum: PM_GNOME, mummynum: PM_GNOME_MUMMY, zombienum: PM_GNOME_ZOMBIE, allow: 64 | 4096 | 8192 | 2, selfmask: 64, lovemask: 32 | 64, hatemask: 8, attrmin: [3, 3, 3, 3, 3, 3], attrmax: [(18 + (50)), 19, 18, 18, 18, 18], hpadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 0 }, enadv: { infix: 2, inrnd: 0, lofix: 2, lornd: 0, hifix: 2, hirnd: 0 } }, { noun: "orc", adj: "orcish", coll: "orcdom", filecode: "Orc", individual: { m: null, f: null }, mnum: PM_ORC, mummynum: PM_ORC_MUMMY, zombienum: PM_ORC_ZOMBIE, allow: 128 | 4096 | 8192 | 1, selfmask: 128, lovemask: 0, hatemask: 8 | 16 | 32, attrmin: [3, 3, 3, 3, 3, 3], attrmax: [(18 + (50)), 16, 16, 18, 18, 16], hpadv: { infix: 1, inrnd: 0, lofix: 0, lornd: 1, hifix: 0, hirnd: 0 }, enadv: { infix: 1, inrnd: 0, lofix: 1, lornd: 0, hifix: 1, hirnd: 0 } }, { noun: null, adj: null, coll: null, filecode: null, individual: { m: null, f: null }, mnum: NON_PM, mummynum: NON_PM, zombienum: NON_PM, allow: 0, selfmask: 0, lovemask: 0, hatemask: 0, attrmin: [0, 0, 0, 0, 0, 0], attrmax: [0, 0, 0, 0, 0, 0], hpadv: { infix: 0, inrnd: 0, lofix: 0, lornd: 0, hifix: 0, hirnd: 0 }, enadv: { infix: 0, inrnd: 0, lofix: 0, lornd: 0, hifix: 0, hirnd: 0 } }];
/*    Str     Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/*  Str    Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/*    Str     Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/*  Str    Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/*  Str    Int Wis Dex Con Cha */
/* Init   Lower  Higher */
/* Hit points */
/* Energy */
/* Array terminator */
/* Table of all genders */
export const genders = [{ adj: "male", he: "he", him: "him", his: "his", filecode: "Mal", allow: 4096 }, { adj: "female", he: "she", him: "her", his: "her", filecode: "Fem", allow: 8192 }, { adj: "neuter", he: "it", him: "it", his: "its", filecode: "Ntr", allow: 16384 }, { adj: "group", he: "they", him: "them", his: "their", filecode: "Grp", allow: 0 }];
/* used by pronoun_gender() when hallucinating */
/* Table of all alignments */
export const aligns = [{ noun: "law", adj: "lawful", filecode: "Law", allow: 4, value: 1 }, { noun: "balance", adj: "neutral", filecode: "Neu", allow: 2, value: 0 }, { noun: "chaos", adj: "chaotic", filecode: "Cha", allow: 1, value: (-1) }, { noun: "evil", adj: "unaligned", filecode: "Una", allow: 0, value: (-128) }];
/* used by str2XXX() */
game.randomstr = "random";
export function validrole(rolenum) {
    return (((rolenum) >= 0 && (rolenum) < ((Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1)));
}
export function randrole(for_display) {
    let res = (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1;
    if (for_display) {
        res = rn2_on_display_rng(res);
    } else {
        res = rn2(res);
    }
    return res;
}
export function randrole_filtered() {
    let i = 0;
    let n = 0;
    let set = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* this doesn't rule out impossible combinations but attempts to
       honor all the filter masks */
    /* -1: avoid terminating element */
    for (i = 0; i < (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1; ++i) {
        if (ok_role(i, (-1), (-1), (-1)) && ok_race(i, (-2), (-1), (-1)) && ok_gend(i, (-1), (-2), (-1)) && ok_align(i, (-1), (-1), (-2))) {
            set[n++] = i;
        }
    }
    return n ? set[rn2(n)] : randrole((0));
}
export function str2role(str) {
    let i = 0;
    let len = 0;
    if (!str || !__nh_char_at0(str)) {
        /* Couldn't find anything appropriate */
        return (-1);
    }
    /* Match as much of str as is provided */
    len = Strlen_(str, "str2role", 756);
    for (i = 0; roles[i].name.m; i++) {
        /* Does it match the male name? */
        if (!strncmpi(str, roles[i].name.m, len)) {
            return i;
        }
        if (roles[i].name.f && !strncmpi(str, roles[i].name.f, len)) {
            return i;
        }
        if (!strncmpi((str), (roles[i].filecode), -1)) {
            return i;
        }
    }
    if ((len == 1 && (__nh_char_at0(str) == 42 || __nh_char_at0(str) == 64)) || !strncmpi(str, game.randomstr, len)) {
        return (-2);
    }
    return (-1);
}
export function validrace(rolenum, racenum) {
    return (((racenum) >= 0 && (racenum) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1)) && (roles[rolenum].allow & races[racenum].allow & 4088));
}
export function randrace(rolenum) {
    let i = 0;
    let n = 0;
    /* Count the number of valid races */
    for (i = 0; races[i].noun; i++) {
        if (roles[rolenum].allow & races[i].allow & 4088) {
            n++;
        }
    }
    /* Use a factor of 100 in case of bad random number generators */
    if (n) {
        n = Math.trunc(rn2(n * 100) / 100);
    }
    for (i = 0; races[i].noun; i++) {
        if (roles[rolenum].allow & races[i].allow & 4088) {
            if (n) {
                n--;
            } else {
                return i;
            }
        }
    }
    /* This role has no permitted races? */
    return rn2((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1);
}
export function str2race(str) {
    let i = 0;
    let len = 0;
    if (!str || !__nh_char_at0(str)) {
        return (-1);
    }
    len = Strlen_(str, "str2race", 822);
    for (i = 0; races[i].noun; i++) {
        if (!strncmpi(str, races[i].noun, len)) {
            return i;
        }
        if (races[i].adj && !strncmpi(str, races[i].adj, len)) {
            return i;
        }
        if (!strncmpi((str), (races[i].filecode), -1)) {
            return i;
        }
    }
    if ((len == 1 && (__nh_char_at0(str) == 42 || __nh_char_at0(str) == 64)) || !strncmpi(str, game.randomstr, len)) {
        return (-2);
    }
    return (-1);
}
export function validgend(rolenum, racenum, gendnum) {
    /* Assumes validrole and validrace */
    return (gendnum >= 0 && gendnum < 2 && (roles[rolenum].allow & races[racenum].allow & genders[gendnum].allow & 61440));
}
export function randgend(rolenum, racenum) {
    let i = 0;
    let n = 0;
    /* Count the number of valid genders */
    for (i = 0; i < 2; i++) {
        if (roles[rolenum].allow & races[racenum].allow & genders[i].allow & 61440) {
            n++;
        }
    }
    if (n) {
        n = rn2(n);
    }
    for (i = 0; i < 2; i++) {
        if (roles[rolenum].allow & races[racenum].allow & genders[i].allow & 61440) {
            if (n) {
                n--;
            } else {
                return i;
            }
        }
    }
    /* This role/race has no permitted genders? */
    return rn2(2);
}
export function str2gend(str) {
    let i = 0;
    let len = 0;
    if (!str || !__nh_char_at0(str)) {
        return (-1);
    }
    len = Strlen_(str, "str2gend", 889);
    for (i = 0; i < 2; i++) {
        /* Does it match the adjective? */
        if (!strncmpi(str, genders[i].adj, len)) {
            return i;
        }
        if (!strncmpi((str), (genders[i].filecode), -1)) {
            return i;
        }
    }
    if ((len == 1 && (__nh_char_at0(str) == 42 || __nh_char_at0(str) == 64)) || !strncmpi(str, game.randomstr, len)) {
        return (-2);
    }
    return (-1);
}
export function validalign(rolenum, racenum, alignnum) {
    return (alignnum >= 0 && alignnum < 3 && (roles[rolenum].allow & races[racenum].allow & aligns[alignnum].allow & 7));
}
export function randalign(rolenum, racenum) {
    let i = 0;
    let n = 0;
    /* Count the number of valid alignments */
    for (i = 0; i < 3; i++) {
        if (roles[rolenum].allow & races[racenum].allow & aligns[i].allow & 7) {
            n++;
        }
    }
    if (n) {
        n = rn2(n);
    }
    for (i = 0; i < 3; i++) {
        if (roles[rolenum].allow & races[racenum].allow & aligns[i].allow & 7) {
            if (n) {
                n--;
            } else {
                return i;
            }
        }
    }
    /* This role/race has no permitted alignments? */
    return rn2(3);
}
export function str2align(str) {
    let i = 0;
    let len = 0;
    if (!str || !__nh_char_at0(str)) {
        return (-1);
    }
    len = Strlen_(str, "str2align", 952);
    for (i = 0; i < 3; i++) {
        if (!strncmpi(str, aligns[i].adj, len)) {
            return i;
        }
        if (!strncmpi((str), (aligns[i].filecode), -1)) {
            return i;
        }
    }
    if ((len == 1 && (__nh_char_at0(str) == 42 || __nh_char_at0(str) == 64)) || !strncmpi(str, game.randomstr, len)) {
        return (-2);
    }
    return (-1);
}
/* is rolenum compatible with any racenum/gendnum/alignnum constraints? */
export function ok_role(rolenum, racenum, gendnum, alignnum) {
    let i = 0;
    let allow = 0;
    if (((rolenum) >= 0 && (rolenum) < ((Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1))) {
        if (game.rfilter.roles[rolenum]) {
            return (0);
        }
        allow = roles[rolenum].allow;
        if (((racenum) >= 0 && (racenum) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1)) && !(allow & races[racenum].allow & 4088)) {
            return (0);
        }
        if (gendnum >= 0 && gendnum < 2 && !(allow & genders[gendnum].allow & 61440)) {
            return (0);
        }
        if (alignnum >= 0 && alignnum < 3 && !(allow & aligns[alignnum].allow & 7)) {
            return (0);
        }
        return (1);
    } else {
        for (i = 0; i < (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1; i++) {
            /* random; check whether any selection is possible */
            if (game.rfilter.roles[i]) {
                continue;
            }
            allow = roles[i].allow;
            if (((racenum) >= 0 && (racenum) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1)) && !(allow & races[racenum].allow & 4088)) {
                continue;
            }
            if (gendnum >= 0 && gendnum < 2 && !(allow & genders[gendnum].allow & 61440)) {
                continue;
            }
            if (alignnum >= 0 && alignnum < 3 && !(allow & aligns[alignnum].allow & 7)) {
                continue;
            }
            return (1);
        }
        return (0);
    }
}
/* pick a random role subject to any racenum/gendnum/alignnum constraints */
/* If pickhow == PICK_RIGID a role is returned only if there is  */
/* a single possibility */
export function pick_role(racenum, gendnum, alignnum, pickhow) {
    fnEnter("pick_role", "role.c", 0);
    let i = 0;
    let roles_ok = 0;
    let set = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1; i++) {
        if (ok_role(i, racenum, gendnum, alignnum) && ok_race(i, (racenum >= 0) ? racenum : (-2), gendnum, alignnum) && ok_gend(i, racenum, (gendnum >= 0) ? gendnum : (-2), alignnum) && ok_align(i, racenum, gendnum, (alignnum >= 0) ? alignnum : (-2))) {
            set[roles_ok++] = i;
        }
    }
    if (roles_ok == 0 || (roles_ok > 1 && pickhow == 1)) {
        return (-1);
    }
    return set[rn2(roles_ok)];
}
/* is racenum compatible with any rolenum/gendnum/alignnum constraints? */
export function ok_race(rolenum, racenum, gendnum, alignnum) {
    let i = 0;
    let allow = 0;
    if (((racenum) >= 0 && (racenum) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1))) {
        if (game.rfilter.mask & races[racenum].selfmask) {
            return (0);
        }
        allow = races[racenum].allow;
        if (((rolenum) >= 0 && (rolenum) < ((Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1)) && !(allow & roles[rolenum].allow & 4088)) {
            return (0);
        }
        if (gendnum >= 0 && gendnum < 2 && !(allow & genders[gendnum].allow & 61440)) {
            return (0);
        }
        if (alignnum >= 0 && alignnum < 3 && !(allow & aligns[alignnum].allow & 7)) {
            return (0);
        }
        return (1);
    } else {
        for (i = 0; i < (Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1; i++) {
            if (game.rfilter.mask & races[i].selfmask) {
                continue;
            }
            allow = races[i].allow;
            if (((rolenum) >= 0 && (rolenum) < ((Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1)) && !(allow & roles[rolenum].allow & 4088)) {
                continue;
            }
            if (gendnum >= 0 && gendnum < 2 && !(allow & genders[gendnum].allow & 61440)) {
                continue;
            }
            if (alignnum >= 0 && alignnum < 3 && !(allow & aligns[alignnum].allow & 7)) {
                continue;
            }
            return (1);
        }
        return (0);
    }
}
/* Pick a random race subject to any rolenum/gendnum/alignnum constraints.
   If pickhow == PICK_RIGID a race is returned only if there is
   a single possibility. */
export function pick_race(rolenum, gendnum, alignnum, pickhow) {
    fnEnter("pick_race", "role.c", 0);
    let i = 0;
    let races_ok = 0;
    for (i = 0; i < (Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1; i++) {
        if (ok_race(rolenum, i, gendnum, alignnum)) {
            races_ok++;
        }
    }
    if (races_ok == 0 || (races_ok > 1 && pickhow == 1)) {
        return (-1);
    }
    races_ok = rn2(races_ok);
    for (i = 0; i < (Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1; i++) {
        if (ok_race(rolenum, i, gendnum, alignnum)) {
            if (races_ok == 0) {
                return i;
            } else {
                races_ok--;
            }
        }
    }
    return (-1);
}
/* is gendnum compatible with any rolenum/racenum/alignnum constraints? */
/* gender and alignment are not comparable (and also not constrainable) */
export function ok_gend(rolenum, racenum, gendnum, alignnum) {
    let i = 0;
    let allow = 0;
    if (gendnum >= 0 && gendnum < 2) {
        if (game.rfilter.mask & genders[gendnum].allow) {
            return (0);
        }
        allow = genders[gendnum].allow;
        if (((rolenum) >= 0 && (rolenum) < ((Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1)) && !(allow & roles[rolenum].allow & 61440)) {
            return (0);
        }
        if (((racenum) >= 0 && (racenum) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1)) && !(allow & races[racenum].allow & 61440)) {
            return (0);
        }
        return (1);
    } else {
        for (i = 0; i < 2; i++) {
            if (game.rfilter.mask & genders[i].allow) {
                continue;
            }
            allow = genders[i].allow;
            if (((rolenum) >= 0 && (rolenum) < ((Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1)) && !(allow & roles[rolenum].allow & 61440)) {
                continue;
            }
            if (((racenum) >= 0 && (racenum) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1)) && !(allow & races[racenum].allow & 61440)) {
                continue;
            }
            return (1);
        }
        return (0);
    }
}
/* pick a random gender subject to any rolenum/racenum/alignnum constraints */
/* gender and alignment are not comparable (and also not constrainable) */
/* If pickhow == PICK_RIGID a gender is returned only if there is  */
/* a single possibility */
export function pick_gend(rolenum, racenum, alignnum, pickhow) {
    fnEnter("pick_gend", "role.c", 0);
    let i = 0;
    let gends_ok = 0;
    for (i = 0; i < 2; i++) {
        if (ok_gend(rolenum, racenum, i, alignnum)) {
            gends_ok++;
        }
    }
    if (gends_ok == 0 || (gends_ok > 1 && pickhow == 1)) {
        return (-1);
    }
    gends_ok = rn2(gends_ok);
    for (i = 0; i < 2; i++) {
        if (ok_gend(rolenum, racenum, i, alignnum)) {
            if (gends_ok == 0) {
                return i;
            } else {
                gends_ok--;
            }
        }
    }
    return (-1);
}
/* is alignnum compatible with any rolenum/racenum/gendnum constraints? */
/* alignment and gender are not comparable (and also not constrainable) */
export function ok_align(rolenum, racenum, gendnum, alignnum) {
    let i = 0;
    let allow = 0;
    if (alignnum >= 0 && alignnum < 3) {
        if (game.rfilter.mask & aligns[alignnum].allow) {
            return (0);
        }
        allow = aligns[alignnum].allow;
        if (((rolenum) >= 0 && (rolenum) < ((Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1)) && !(allow & roles[rolenum].allow & 7)) {
            return (0);
        }
        if (((racenum) >= 0 && (racenum) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1)) && !(allow & races[racenum].allow & 7)) {
            return (0);
        }
        return (1);
    } else {
        for (i = 0; i < 3; i++) {
            if (game.rfilter.mask & aligns[i].allow) {
                continue;
            }
            allow = aligns[i].allow;
            if (((rolenum) >= 0 && (rolenum) < ((Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1)) && !(allow & roles[rolenum].allow & 7)) {
                continue;
            }
            if (((racenum) >= 0 && (racenum) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1)) && !(allow & races[racenum].allow & 7)) {
                continue;
            }
            return (1);
        }
        return (0);
    }
}
/* Pick a random alignment subject to any rolenum/racenum/gendnum constraints;
   alignment and gender are not comparable (and also not constrainable).
   If pickhow == PICK_RIGID an alignment is returned only if there is
   a single possibility. */
export function pick_align(rolenum, racenum, gendnum, pickhow) {
    fnEnter("pick_align", "role.c", 0);
    let i = 0;
    let aligns_ok = 0;
    for (i = 0; i < 3; i++) {
        if (ok_align(rolenum, racenum, gendnum, i)) {
            aligns_ok++;
        }
    }
    if (aligns_ok == 0 || (aligns_ok > 1 && pickhow == 1)) {
        return (-1);
    }
    aligns_ok = rn2(aligns_ok);
    for (i = 0; i < 3; i++) {
        if (ok_align(rolenum, racenum, gendnum, i)) {
            if (aligns_ok == 0) {
                return i;
            } else {
                aligns_ok--;
            }
        }
    }
    return (-1);
}
export function rigid_role_checks() {
    let tmp = 0;
    if (game.flags.initrole == (-2)) {
        /* Some roles are limited to a single race, alignment, or gender and
     * calling this routine prior to XXX_player_selection() will help
     * prevent an extraneous prompt that actually doesn't allow
     * you to choose anything further. Note the use of PICK_RIGID which
     * causes the pick_XX() routine to return a value only if there is one
     * single possible selection, otherwise it returns ROLE_NONE.
     *
     */
        /* If the role was explicitly specified as ROLE_RANDOM
         * via -uXXXX-@ or OPTIONS=role:random then choose the role
         * in here to narrow down later choices.
         */
        game.flags.initrole = pick_role(game.flags.initrace, game.flags.initgend, game.flags.initalign, 0);
        if (game.flags.initrole < 0) {
            game.flags.initrole = randrole_filtered();
        }
    }
    if (game.flags.initrace == (-2) && (tmp = pick_race(game.flags.initrole, game.flags.initgend, game.flags.initalign, 0)) != (-1)) {
        game.flags.initrace = tmp;
    }
    if (game.flags.initalign == (-2) && (tmp = pick_align(game.flags.initrole, game.flags.initrace, game.flags.initgend, 0)) != (-1)) {
        game.flags.initalign = tmp;
    }
    if (game.flags.initgend == (-2) && (tmp = pick_gend(game.flags.initrole, game.flags.initrace, game.flags.initalign, 0)) != (-1)) {
        game.flags.initgend = tmp;
    }
    if (game.flags.initrole != (-1)) {
        if (game.flags.initrace == (-1)) {
            game.flags.initrace = pick_race(game.flags.initrole, game.flags.initgend, game.flags.initalign, 1);
        }
        if (game.flags.initalign == (-1)) {
            game.flags.initalign = pick_align(game.flags.initrole, game.flags.initrace, game.flags.initgend, 1);
        }
        if (game.flags.initgend == (-1)) {
            game.flags.initgend = pick_gend(game.flags.initrole, game.flags.initrace, game.flags.initalign, 1);
        }
    }
}
export function setrolefilter(bufp) {
    let i = 0;
    let reslt = (1);
    if ((i = str2role(bufp)) != (-1) && i != (-2)) {
        game.rfilter.roles[i] = (1);
    } else if ((i = str2race(bufp)) != (-1) && i != (-2)) {
        game.rfilter.mask |= races[i].selfmask;
    } else if ((i = str2gend(bufp)) != (-1) && i != (-2)) {
        game.rfilter.mask |= genders[i].allow;
    } else if ((i = str2align(bufp)) != (-1) && i != (-2)) {
        game.rfilter.mask |= aligns[i].allow;
    } else {
        reslt = (0);
    }
    return reslt;
}
export function gotrolefilter() {
    let i = 0;
    if (game.rfilter.mask) {
        return (1);
    }
    for (i = 0; i < (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1; ++i) {
        if (game.rfilter.roles[i]) {
            return (1);
        }
    }
    return (0);
}
/* create a string like " !Bar !Kni" or " !chaotic" that can be
   put back into an RC file by #saveoptions */
export function rolefilterstring(outbuf, which) {
    let i = 0;
    (outbuf = __nh_char_write(outbuf, 1, 0), outbuf = __nh_char_write(outbuf, 0, 0));
    switch (which) {
        case 1:
            for (i = 0; i < (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1; ++i) {
                if (game.rfilter.roles[i]) {
                    outbuf = __nh_buf_append(outbuf, sprintf('', " !%.3s", roles[i].name.m));
                }
            }
            break;
        case 2:
            for (i = 0; i < (Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1; ++i) {
                if ((game.rfilter.mask & races[i].selfmask) != 0) {
                    outbuf = __nh_buf_append(outbuf, sprintf('', " !%s", races[i].noun));
                }
            }
            break;
        case 3:
            for (i = 0; i < (Math.trunc(4 /* sizeof(const struct Gender [4]) */ / 1 /* sizeof(const struct Gender) */)) - 1; ++i) {
                if ((game.rfilter.mask & genders[i].allow) != 0) {
                    outbuf = __nh_buf_append(outbuf, sprintf('', " !%s", genders[i].adj));
                }
            }
            break;
        case 4:
            for (i = 0; i < (Math.trunc(4 /* sizeof(const struct Align [4]) */ / 1 /* sizeof(const struct Align) */)) - 1; ++i) {
                if ((game.rfilter.mask & aligns[i].allow) != 0) {
                    outbuf = __nh_buf_append(outbuf, sprintf('', " !%s", aligns[i].adj));
                }
            }
            break;
        default:
            impossible("rolefilterstring: bad role aspect (%d)", which);
            outbuf = strcpy(outbuf, " ?");
            break;
    }
    /* constructed with a leading space; drop it */
    return __nh_advance_str(outbuf, 1);
}
export function clearrolefilter(which) {
    let i = 0;
    switch (which) {
        case 5:
            game.rfilter.mask = 0;
            ;
        case 1:
            for (i = 0; i < (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1; ++i) {
                game.rfilter.roles[i] = (0);
            }
            break;
        case 2:
            game.rfilter.mask &= ~4088;
            break;
        case 3:
            game.rfilter.mask &= ~61440;
            break;
        case 4:
            game.rfilter.mask &= ~7;
            break;
    }
}
export function promptsep(buf, num_post_attribs) {
    let conjuct = "and ";
    if (num_post_attribs > 1 && game.role_post_attribs < num_post_attribs && game.role_post_attribs > 1) {
        buf = strcat(buf, ",");
    }
    buf = strcat(buf, " ");
    --game.role_post_attribs;
    if (!game.role_post_attribs && num_post_attribs > 1) {
        buf = strcat(buf, conjuct);
    }
    return buf;
}
export function role_gendercount(rolenum) {
    let gendcount = 0;
    if (validrole(rolenum)) {
        if (roles[rolenum].allow & 4096) {
            ++gendcount;
        }
        if (roles[rolenum].allow & 8192) {
            ++gendcount;
        }
        if (roles[rolenum].allow & 16384) {
            ++gendcount;
        }
    }
    return gendcount;
}
export function race_alignmentcount(racenum) {
    let aligncount = 0;
    /* How many alignments are allowed for the desired race? */
    if (racenum != (-1) && racenum != (-2)) {
        if (races[racenum].allow & 1) {
            ++aligncount;
        }
        if (races[racenum].allow & 4) {
            ++aligncount;
        }
        if (races[racenum].allow & 2) {
            ++aligncount;
        }
    }
    return aligncount;
}
let __root_plselection_prompt_err_ret = " character's";
__nh_register_static(() => { __root_plselection_prompt_err_ret = " character's"; });
export function root_plselection_prompt(suppliedbuf, buflen, rolenum, racenum, gendnum, alignnum) {
    let k = 0;
    let gendercount = 0;
    let aligncount = 0;
    let buf = '';
    let donefirst = (0);
    if (!suppliedbuf || buflen < 1) {
        return __root_plselection_prompt_err_ret;
    }
    /* initialize these static variables each time this is called */
    game.role_post_attribs = 0;
    for (k = 0; k < 4; ++k) {
        game.role_pa[k] = 0;
    }
    buf = '';
    suppliedbuf.value = 0;
    if (racenum != (-1) && racenum != (-2)) {
        aligncount = race_alignmentcount(racenum);
    }
    if (alignnum != (-1) && alignnum != (-2) && ok_align(rolenum, racenum, gendnum, alignnum)) {
        /* 'if' and 'else' had duplicate code here; probably a copy+parse
         * oversight; if a problem with filtering of random role selection
         * crops up, this is probably the place to start looking */
        /* if race specified, and multiple choice of alignments for it */
        /* the four lines of code below were in both 'if' and 'else' above */
        /* <your lawful female gnomish> || <your lawful female gnome> */
        if (donefirst) {
            buf = strcat(buf, " ");
        }
        buf = strcat(buf, aligns[alignnum].adj);
        donefirst = (1);
    } else {
        /* in case we got here by failing the ok_align() test */
        if (alignnum != (-2)) {
            alignnum = (-1);
        }
        if ((((racenum != (-1) && racenum != (-2)) && ok_race(rolenum, racenum, gendnum, alignnum)) && (aligncount > 1)) || (racenum == (-1) || racenum == (-2))) {
            /* if alignment not specified, but race is specified
           and only one choice of alignment for that race then
           don't include it in the later list */
            game.role_pa[0] = 1;
            game.role_post_attribs++;
        }
    }
    /* How many genders are allowed for the desired role? */
    if (validrole(rolenum)) {
        gendercount = role_gendercount(rolenum);
    }
    if (gendnum != (-1) && gendnum != (-2)) {
        if (validrole(rolenum)) {
            if ((rolenum != (-1)) && (gendercount > 1) && !roles[rolenum].name.f) {
                /* if role specified, and multiple choice of genders for it,
               and name of role itself does not distinguish gender */
                if (donefirst) {
                    buf = strcat(buf, " ");
                }
                buf = strcat(buf, genders[gendnum].adj);
                donefirst = (1);
            }
        } else {
            if (donefirst) {
                buf = strcat(buf, " ");
            }
            buf = strcat(buf, genders[gendnum].adj);
            donefirst = (1);
        }
    } else {
        if ((validrole(rolenum) && (gendercount > 1)) || !validrole(rolenum)) {
            /* if gender not specified, but role is specified
                and only one choice of gender then
                don't include it in the later list */
            game.role_pa[1] = 1;
            game.role_post_attribs++;
        }
    }
    if (racenum != (-1) && racenum != (-2)) {
        if (validrole(rolenum) && ok_race(rolenum, racenum, gendnum, alignnum)) {
            if (donefirst) {
                buf = strcat(buf, " ");
            }
            buf = strcat(buf, (rolenum == (-1)) ? races[racenum].noun : races[racenum].adj);
            donefirst = (1);
        } else if (!validrole(rolenum)) {
            if (donefirst) {
                buf = strcat(buf, " ");
            }
            buf = strcat(buf, races[racenum].noun);
            donefirst = (1);
        } else {
            game.role_pa[2] = 1;
            game.role_post_attribs++;
        }
    } else {
        game.role_pa[2] = 1;
        game.role_post_attribs++;
    }
    if (validrole(rolenum)) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        if (donefirst) {
            buf = strcat(buf, " ");
        }
        if (gendnum != (-1)) {
            if (gendnum == 1 && roles[rolenum].name.f) {
                buf = strcat(buf, roles[rolenum].name.f);
            } else {
                buf = strcat(buf, roles[rolenum].name.m);
            }
        } else {
            if (roles[rolenum].name.f) {
                buf = strcat(buf, roles[rolenum].name.m);
                buf = strcat(buf, "/");
                buf = strcat(buf, roles[rolenum].name.f);
            } else {
                buf = strcat(buf, roles[rolenum].name.m);
            }
        }
        donefirst = (1);
    } else if (rolenum == (-1)) {
        game.role_pa[3] = 1;
        game.role_post_attribs++;
    }
    if ((racenum == (-1) || racenum == (-2)) && !validrole(rolenum)) {
        if (donefirst) {
            buf = strcat(buf, " ");
        }
        buf = strcat(buf, "character");
    }
    if (buflen > (strlen(buf) + 1)) {
        suppliedbuf = strcpy(suppliedbuf, buf);
        /* <your lawful female gnomish cavewoman> || <your lawful female gnome>
     *    || <your lawful female character>
     */
        return suppliedbuf;
    } else {
        return __root_plselection_prompt_err_ret;
    }
}
export function build_plselection_prompt(buf, buflen, rolenum, racenum, gendnum, alignnum) {
    let defprompt = "Shall I pick a character for you? [ynaq] ";
    let num_post_attribs = 0;
    let tmpbuf = '';
    let p = null;
    if (buflen < 128) {
        return defprompt;
    }
    tmpbuf = strcpy(tmpbuf, "Shall I pick ");
    if (racenum != (-1) || validrole(rolenum)) {
        tmpbuf = strcat(tmpbuf, "your ");
    } else {
        tmpbuf = strcat(tmpbuf, "a ");
    }
    root_plselection_prompt(eos(tmpbuf), buflen - Strlen_(tmpbuf, "build_plselection_prompt", 1601), rolenum, racenum, gendnum, alignnum);
    /* "Shall I pick a character's role, race, gender, and alignment for you?"
       plus " [ynaq] (y)" is a little too long for a conventional 80 columns;
       also, "pick a character's <anything>" sounds a bit stilted */
    tmpbuf = strsubst(tmpbuf, "pick a character", "pick character");
    buf = sprintf(buf, "%s", s_suffix(tmpbuf));
    /* don't bother splitting caveman/cavewoman or priest/priestess
       in order to apply possessive suffix to both halves, but do
       change "priest/priestess'" to "priest/priestess's" */
    if ((p = strstri(buf, "priest/priestess'")) != null && __nh_char_at0(__nh_advance_str(p, 18 /* sizeof(char [18]) */ - 1 /* sizeof(char [1]) */)) == 0) {
        buf = strkitten(buf, 115);
    }
    /* buf should now be:
     *    <your lawful female gnomish cavewoman's>
     * || <your lawful female gnome's>
     * || <your lawful female character's>
     *
     * Now append the post attributes to it
     */
    num_post_attribs = game.role_post_attribs;
    if (!num_post_attribs) {
        /* some constraints might have been mutually exclusive, in which case
           some prompting that would have been omitted is needed after all */
        if (game.flags.initrole == (-1) && !game.role_pa[3]) {
            game.role_pa[3] = ++game.role_post_attribs;
        }
        if (game.flags.initrace == (-1) && !game.role_pa[2]) {
            game.role_pa[2] = ++game.role_post_attribs;
        }
        if (game.flags.initalign == (-1) && !game.role_pa[0]) {
            game.role_pa[0] = ++game.role_post_attribs;
        }
        if (game.flags.initgend == (-1) && !game.role_pa[1]) {
            game.role_pa[1] = ++game.role_post_attribs;
        }
        num_post_attribs = game.role_post_attribs;
    }
    if (num_post_attribs) {
        if (game.role_pa[2]) {
            promptsep(eos(buf), num_post_attribs);
            buf = strcat(buf, "race");
        }
        if (game.role_pa[3]) {
            promptsep(eos(buf), num_post_attribs);
            buf = strcat(buf, "role");
        }
        if (game.role_pa[1]) {
            promptsep(eos(buf), num_post_attribs);
            buf = strcat(buf, "gender");
        }
        if (game.role_pa[0]) {
            promptsep(eos(buf), num_post_attribs);
            buf = strcat(buf, "alignment");
        }
    }
    buf = strcat(buf, " for you? [ynaq] ");
    return buf;
}
export function plnamesuffix() {
    let sptr = null;
    let eptr = null;
    let i = 0;
    if (game.sysopt.genericusers) {
        if (__nh_char_at0(game.sysopt.genericusers) == 42) {
            /* some generic user names will be ignored in favor of prompting */
            game.plname = '';
        } else {
            /* need to ignore appended '-role-race-gender-alignment';
               'plnamelen' is non-zero when dealing with plname[] value that
               contains a username with dash(es) in it and is usually 0 */
            i = ((eptr = strchr(game.plname + game.plnamelen, 45)) != null) ? ((game.plname.length - eptr.length)) : Strlen_(game.plname, "plnamesuffix", 1680);
            /* look for plname[] in the 'genericusers' space-separated list */
            if (findword(game.sysopt.genericusers, game.plname, i, (0))) {
                game.plname = '';
            }
        }
        if (!game.plname[0]) {
            /* fill svp.plname[] if necessary, or set
                        * defer_plname */
            /* plname[] might have -role-race-&c attached */
            game.plnamelen = 0;
        }
    }
    do {
        if (!game.plname[0]) {
            (game.windowprocs.win_askname)();
            game.plnamelen = 0;
        }
        /* Look for tokens delimited by '-' */
        sptr = game.plname + game.plnamelen;
        if ((eptr = strchr(sptr, 45)) != null) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        }
        while (eptr) {
            sptr = eptr;
            if ((eptr = strchr(sptr, 45)) != null) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            }
            /* Try to match it to something */
            if ((i = str2role(sptr)) != (-1)) {
                game.flags.initrole = i;
            } else if ((i = str2race(sptr)) != (-1)) {
                game.flags.initrace = i;
            } else if ((i = str2gend(sptr)) != (-1)) {
                game.flags.initgend = i;
            } else if ((i = str2align(sptr)) != (-1)) {
                game.flags.initalign = i;
            }
        }
    } while (!game.plname[0] && !game.iflags.defer_plname);
    /* commas in the svp.plname confuse the record file, convert to spaces */
    strNsubst(game.plname, ",", " ", 0);
}
/* show current settings for name, role, race, gender, and alignment
   in the specified window */
const __role_selection_prolog_choosing = " choosing now";
const __role_selection_prolog_not_yet = " not yet specified";
const __role_selection_prolog_rand_choice = " random";
export function role_selection_prolog(which, where) {
    let buf = '';
    let r = 0;
    let c = 0;
    let gend = 0;
    let a = 0;
    let allowmask = 0;
    r = game.flags.initrole;
    c = game.flags.initrace;
    gend = game.flags.initgend;
    a = game.flags.initalign;
    if (r >= 0) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        allowmask = roles[r].allow;
        if ((allowmask & 4088) == 8) {
            c = 0;
        } else if (((c) >= 0 && (c) < ((Math.trunc(6 /* sizeof(const struct Race [6]) */ / 1 /* sizeof(const struct Race) */)) - 1)) && !(allowmask & 4088 & races[c].allow)) {
            c = (-2);
        }
        if ((allowmask & 61440) == 4096) {
            gend = 0;
        } else if ((allowmask & 61440) == 8192) {
            gend = 1;
        }
        /* role forces female (valkyrie) */
        if ((allowmask & 7) == 4) {
            a = 0;
        } else if ((allowmask & 7) == 2) {
            a = 1;
        } else if ((allowmask & 7) == 1) {
            a = 2;
        }
    }
    if (c >= 0) {
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        /* role forces male (hypothetical) */
        allowmask = races[c].allow;
        if ((allowmask & 7) == 4) {
            a = 0;
        } else if ((allowmask & 7) == 2) {
            a = 1;
        } else if ((allowmask & 7) == 1) {
            a = 2;
        }
    }
    buf = sprintf(buf, "%12s ", "name:");
    buf = strcat(buf, (which == 0) ? __role_selection_prolog_choosing : !game.plname ? __role_selection_prolog_not_yet : game.plname);
    (game.windowprocs.win_putstr)(where, 0, buf);
    buf = sprintf(buf, "%12s ", "role:");
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    buf = strcat(buf, (which == 1) ? __role_selection_prolog_choosing : (r == (-1)) ? __role_selection_prolog_not_yet : (r == (-2)) ? __role_selection_prolog_rand_choice : roles[r].name.m);
    if (r >= 0 && roles[r].name.f) {
        /* [g and a don't constrain anything sufficiently
       to narrow something done to a single choice] */
        /* distinct female name [caveman/cavewoman, priest/priestess] */
        if (gend == 1) {
            sprintf(strchr(buf, 58), ": %s", roles[r].name.f);
        } else if (gend < 0) {
            buf = __nh_buf_append(buf, sprintf('', "/%s", roles[r].name.f));
        }
    }
    (game.windowprocs.win_putstr)(where, 0, buf);
    buf = sprintf(buf, "%12s ", "race:");
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    buf = strcat(buf, (which == 2) ? __role_selection_prolog_choosing : (c == (-1)) ? __role_selection_prolog_not_yet : (c == (-2)) ? __role_selection_prolog_rand_choice : races[c].noun);
    (game.windowprocs.win_putstr)(where, 0, buf);
    buf = sprintf(buf, "%12s ", "gender:");
    buf = strcat(buf, (which == 3) ? __role_selection_prolog_choosing : (gend == (-1)) ? __role_selection_prolog_not_yet : (gend == (-2)) ? __role_selection_prolog_rand_choice : genders[gend].adj);
    (game.windowprocs.win_putstr)(where, 0, buf);
    buf = sprintf(buf, "%12s ", "alignment:");
    buf = strcat(buf, (which == 4) ? __role_selection_prolog_choosing : (a == (-1)) ? __role_selection_prolog_not_yet : (a == (-2)) ? __role_selection_prolog_rand_choice : aligns[a].adj);
    (game.windowprocs.win_putstr)(where, 0, buf);
}
/* add a "pick alignment first"-type entry to the specified menu */
const __role_menu_extra_RS_menu_let = [61, 63, 47, 34, 91];
export function role_menu_extra(which, where, preselect) {
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let buf = '';
    let what = null;
    let constrainer = null;
    let forcedvalue = null;
    let f = 0;
    let r = 0;
    let c = 0;
    let gend = 0;
    let a = 0;
    let i = 0;
    let allowmask = 0;
    let clr = 8;
    r = game.flags.initrole;
    c = game.flags.initrace;
    switch (which) {
        case 0:
            what = "name";
            break;
        case 1:
            what = "role";
            f = r;
            for (i = 0; i < (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1; ++i) {
                if (i != f && !game.rfilter.roles[i]) {
                    /* success; drop out through end of function */
                    break;
                }
            }
            if (i == (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1) {
                /* if there is only one alignment choice available due to user
               options disallowing others, algn menu entry is disabled */
                constrainer = "filter";
                forcedvalue = "role";
            }
            break;
        case 2:
            what = "race";
            f = game.flags.initrace;
            /* override player's setting */
            c = (-1);
            if (r >= 0) {
                allowmask = roles[r].allow & 4088;
                if (allowmask == 8) {
                    c = 0;
                }
                if (c >= 0) {
                    constrainer = "role";
                    forcedvalue = races[c].noun;
                } else if (f >= 0 && ((allowmask & ~game.rfilter.mask) == races[f].selfmask)) {
                    /* if there is only one race choice available due to user
                   options disallowing others, race menu entry is disabled */
                    /* if there is only one gender choice available due to user
                   options disallowing other, gender menu entry is disabled */
                    constrainer = "filter";
                    forcedvalue = "race";
                }
            }
            break;
        case 3:
            what = "gender";
            f = game.flags.initgend;
            gend = (-1);
            if (r >= 0) {
                allowmask = roles[r].allow & 61440;
                if (allowmask == 4096) {
                    gend = 0;
                } else if (allowmask == 8192) {
                    gend = 1;
                }
                if (gend >= 0) {
                    constrainer = "role";
                    forcedvalue = genders[gend].adj;
                } else if (f >= 0 && ((allowmask & ~game.rfilter.mask) == genders[f].allow)) {
                    constrainer = "filter";
                    forcedvalue = "gender";
                }
            }
            break;
        case 4:
            what = "alignment";
            f = game.flags.initalign;
            a = (-1);
            if (r >= 0) {
                allowmask = roles[r].allow & 7;
                if (allowmask == 4) {
                    a = 0;
                } else if (allowmask == 2) {
                    a = 1;
                } else if (allowmask == 1) {
                    a = 2;
                }
                if (a >= 0) {
                    constrainer = "role";
                }
            }
            if (c >= 0 && !constrainer) {
                allowmask = races[c].allow & 7;
                if (allowmask == 4) {
                    a = 0;
                } else if (allowmask == 2) {
                    a = 1;
                } else if (allowmask == 1) {
                    a = 2;
                }
                if (a >= 0) {
                    constrainer = "race";
                }
            }
            if (f >= 0 && !constrainer && (7 & ~game.rfilter.mask) == aligns[f].allow) {
                constrainer = "filter";
                forcedvalue = "alignment";
            }
            if (a >= 0) {
                forcedvalue = aligns[a].adj;
            }
            break;
    }
    Object.assign(any, cg.zeroany);
    if (constrainer) {
        any.a_int = 0;
        buf = sprintf(buf, "%4s%s forces %s", "", constrainer, forcedvalue);
        /* use four spaces of padding to fake a grayed out menu choice */
        add_menu_str(where, buf);
    } else if (what) {
        any.a_int = ((-2) - ((which) + 1));
        buf = sprintf(buf, "Pick%s %s first", (f >= 0) ? " another" : "", what);
        add_menu(where, nul_glyphinfo, any, __role_menu_extra_RS_menu_let[which], 0, 0, clr, buf, 0);
    } else if (which == 5) {
        let setfiltering = '';
        any.a_int = ((-2) - ((5) + 1));
        setfiltering = sprintf(setfiltering, "%s role/race/&c filtering", gotrolefilter() ? "Reset" : "Set");
        add_menu(where, nul_glyphinfo, any, 126, 0, 0, clr, setfiltering, 0);
    } else if (which == (-2)) {
        any.a_int = (-2);
        add_menu(where, nul_glyphinfo, any, 42, 0, 0, clr, "Random", preselect ? 1 : 0);
    } else if (which == (-1)) {
        any.a_int = (-1);
        add_menu(where, nul_glyphinfo, any, 113, 0, 0, clr, "Quit", preselect ? 1 : 0);
    } else {
        impossible("role_menu_extra: bad arg (%d)", which);
    }
}
/*
 *      Special setup modifications here:
 *
 *      Unfortunately, this is going to have to be done
 *      on each newgame or restore, because you lose the permonst mods
 *      across a save/restore.  :-)
 *
 *      1 - The Rogue Leader is the Tourist Nemesis.
 *      2 - Priests start with a random alignment - convert the leader and
 *          guardians here.
 *      3 - Priests also get their set of deities from a randomly chosen role.
 *      4 - [obsolete] Elves can have one of two different leaders,
 *          but can't work it out here because it requires hacking the
 *          level file data (see sp_lev.c).
 *
 * This code also replaces quest_init().
 */
export function role_init() {
    fnEnter("role_init", "role.c", 0);
    let alignmnt = 0;
    let pm = null;
    /* Strip the role letter out of the player name.
     * This is included for backwards compatibility.
     */
    plnamesuffix();
    if (!validrole(game.flags.initrole)) {
        /* Check for a valid role.  Try flags.initrole first. */
        /* Try the player letter second */
        if ((game.flags.initrole = str2role(game.pl_character)) < 0) {
            game.flags.initrole = randrole_filtered();
        }
    }
    strcpy(game.pl_character, roles[game.flags.initrole].name.m);
    if (Array.isArray(game.pl_character)) game.pl_character[32 - 1] = 0;
    if (!validrace(game.flags.initrole, game.flags.initrace)) {
        game.flags.initrace = randrace(game.flags.initrole);
    }
    if (game.flags.pantheon == -1) {
        /* None specified; pick a random role */
        /* Check for a valid gender.  If new game, check both initgend
     * and female.  On restore, assume flags.female is correct. */
        if (!validgend(game.flags.initrole, game.flags.initrace, game.flags.female)) {
            game.flags.female = !game.flags.female;
        }
    }
    if (!validgend(game.flags.initrole, game.flags.initrace, game.flags.initgend)) {
        game.flags.initgend = game.flags.female;
    }
    /* Check for a valid alignment */
    if (!validalign(game.flags.initrole, game.flags.initrace, game.flags.initalign)) {
        game.flags.initalign = randalign(game.flags.initrole, game.flags.initrace);
    }
    alignmnt = aligns[game.flags.initalign].value;
    /* Initialize gu.urole and gu.urace */
    Object.assign(game.urole, roles[game.flags.initrole]);
    Object.assign(game.urace, races[game.flags.initrace]);
    if (game.urole.ldrnum != NON_PM) {
        /* Note that there is no way to check for an unspecified gender. */
        pm = game.mons[game.urole.ldrnum];
        pm.msound = MS_LEADER;
        pm.mflags2 |= (2097152);
        pm.mflags3 |= 128;
        pm.maligntyp = alignmnt * 3;
        /* if gender is random, we choose it now instead of waiting
           until the leader monster is created */
        game.quest_status.ldrgend = (((pm).mflags2 & 262144) != 0) ? 2 : (((pm).mflags2 & 131072) != 0) ? 1 : (((pm).mflags2 & 65536) != 0) ? 0 : (rn2(100) < 50);
    }
    if (game.urole.guardnum != NON_PM) {
        /* Fix up the quest guardians */
        pm = game.mons[game.urole.guardnum];
        pm.mflags2 |= (2097152);
        pm.maligntyp = alignmnt * 3;
    }
    if (game.urole.neminum != NON_PM) {
        /* Fix up the quest nemesis */
        pm = game.mons[game.urole.neminum];
        pm.msound = MS_NEMESIS;
        pm.mflags2 &= ~(2097152);
        pm.mflags2 |= (33554432 | 16777216 | 1048576);
        pm.mflags3 &= ~(128);
        pm.mflags3 |= 16 | 64;
        /* if gender is random, we choose it now instead of waiting
           until the nemesis monster is created */
        game.quest_status.nemgend = (((pm).mflags2 & 262144) != 0) ? 2 : (((pm).mflags2 & 131072) != 0) ? 1 : (((pm).mflags2 & 65536) != 0) ? 0 : (rn2(100) < 50);
    }
    if (game.flags.pantheon == -1) {
        let trycnt = 0;
        game.flags.pantheon = game.flags.initrole;
        while (!roles[game.flags.pantheon].lgod && ++trycnt < 100) {
            game.flags.pantheon = randrole((0));
        }
        if (!roles[game.flags.pantheon].lgod) {
            let i = 0;
            for (i = 0; i < (Math.trunc(14 /* sizeof(const struct Role [14]) */ / 1 /* sizeof(const struct Role) */)) - 1; i++) {
                if (roles[i].lgod) {
                    game.flags.pantheon = i;
                    break;
                }
            }
        }
    }
    if (!game.urole.lgod) {
        game.urole.lgod = roles[game.flags.pantheon].lgod;
        game.urole.ngod = roles[game.flags.pantheon].ngod;
        game.urole.cgod = roles[game.flags.pantheon].cgod;
    }
    /* 0 or 1; no gods are neuter, nor is gender randomized */
    game.quest_status.godgend = !strncmpi((align_gtitle(alignmnt)), ("goddess"), -1);
    if ((game.urole.mnum == (PM_CLERIC))) {
        game.objects[SPE_LIGHT].oc_subtyp = P_CLERIC_SPELL;
    }
    /*
 * Disable this fixup so that mons[] can be const.  The only
 * place where it actually matters for the hero is in set_uasmon()
 * and that can use mons[race] rather than mons[role] for this
 * particular property.  Despite the comment, it is checked--where
 * needed--via intrinsic 'Infravision' which set_uasmon() manages.
 */
    /* although an infravision intrinsic is possible, infravision
         * is purely a property of the physical race.  This means that we
         * must put the infravision flag in the player's current race
         * (either that or have separate permonst entries for
         * elven/non-elven members of each class).  The side effect is that
         * all NPCs of that class will have (probably bogus) infravision,
         * but since infravision has no effect for NPCs anyway we can
         * ignore this.
         */
    /* Artifacts are fixed in hack_artifacts() */
    return;
}
export function Hello(mtmp) {
    switch ((game.urole.mnum)) {
        case PM_KNIGHT:
            return "Salutations";
        case PM_SAMURAI:
            return (mtmp && mtmp.data == game.mons[PM_SHOPKEEPER]) ? "Irasshaimase" : "Konnichi wa";
        case PM_TOURIST:
            return "Aloha";
        case PM_VALKYRIE:
            return (mtmp && mtmp.data == game.mons[PM_MAIL_DAEMON]) ? "Hallo" : "Velkommen";
        default:
            return "Hello";
    }
}
export function Goodbye() {
    switch ((game.urole.mnum)) {
        case PM_KNIGHT:
            return "Fare thee well";
        case PM_SAMURAI:
            return "Sayonara";
        case PM_TOURIST:
            return "Aloha";
        case PM_VALKYRIE:
            return "Farvel";
        default:
            return "Goodbye";
    }
}
/* if pmindex is any player race (not necessarily the hero's),
   return a pointer to the races[] entry for it; if pmindex is for some
   other type of monster which isn't a player race, return Null */
export function character_race(pmindex) {
    let r = null;
    for (let __nhi_r = 0; (r = races[__nhi_r]) && (r.noun != (null)); __nhi_r++) {
        if (r.mnum == pmindex) {
            return r;
        }
    }
    return (null);
}
/*--------------------------------------------------------------------------*/
/* potential interface routine */
export function genl_player_selection() {
    if (genl_player_setup(0)) {
        return;
    }
    /* player cancelled role/race/&c selection, so quit */
    nh_terminate(0);
}
/* ['#else' far below] */
/* try to reduce clutter in the code below... */
/* guts of tty's player_selection() */
export function genl_player_setup(screenheight) {
    let pbuf = '';
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let k = 0;
    let n = 0;
    let choice = 0;
    let nextpick = 0;
    let getconfirmation = 0;
    let picksomething = 0;
    let win = 0;
    let selected = null;
    let clr = 0;
    let pick4u = 0;
    let result = 0;
    game.program_state.in_role_selection++;
    chargen_loop: while (true) {
    win = (-1);
    selected = null;
    clr = 8;
    pick4u = 110;
    result = 0;
    picksomething = (game.flags.initrole == (-1) || game.flags.initrace == (-1) || game.flags.initgend == (-1) || game.flags.initalign == (-1));
    if (game.flags.randomall && picksomething) {
        if (game.flags.initrole == (-1)) {
            game.flags.initrole = (-2);
        }
        if (game.flags.initrace == (-1)) {
            game.flags.initrace = (-2);
        }
        if (game.flags.initgend == (-1)) {
            game.flags.initgend = (-2);
        }
        if (game.flags.initalign == (-1)) {
            game.flags.initalign = (-2);
        }
    }
    /* whatever aspect was just chosen might force others (Orc => chaotic,
       Samurai => Human+lawful, Valkyrie => female) */
    rigid_role_checks();
    let __bail_chargen = false;
    if (game.flags.initrole == (-1) || game.flags.initrace == (-1) || game.flags.initgend == (-1) || game.flags.initalign == (-1)) {
        let prompt = build_plselection_prompt(pbuf, 128, game.flags.initrole, game.flags.initrace, game.flags.initgend, game.flags.initalign);
        prompt = trimspaces(prompt);
        do {
            pick4u = yn_function(prompt, null, 0, (0));
            pick4u = lowc(pick4u);
            if (pick4u == 27 || pick4u == 113) {
                __bail_chargen = true;
                break;
            }
            if (pick4u == 32 || pick4u == 10 || pick4u == 13) {
                pick4u = 121;
            } else if (pick4u == 64 || pick4u == 42) {
                pick4u = 97;
            }
        } while (pick4u != 121 && pick4u != 110 && pick4u != 97);
    }
    if (__bail_chargen) {
        break chargen_loop;
    }
    nextpick = 1;
    setup_done: {
        do {
            if (nextpick == 1) {
                nextpick = 2;
                if (game.flags.initrole < 0) {
                    if (pick4u == 121 || pick4u == 97 || game.flags.initrole == (-2)) {
                        /* Select a role, if necessary;
               we'll try to be compatible with pre-selected
               race/gender/alignment, but may not succeed. */
                        k = pick_role(game.flags.initrace, game.flags.initgend, game.flags.initalign, 0);
                        if (k < 0) {
                            pline("Incompatible role!");
                            k = randrole((0));
                        }
                    } else {
                        /* 'excess' is used to try to avoid tty pagination */
                        let excess = maybe_skip_seps(screenheight, 1);
                        win = plsel_startmenu(screenheight, 1);
                        /* populate the menu with role choices */
                        setup_rolemenu(win, (1), game.flags.initrace, game.flags.initgend, game.flags.initalign);
                        /* add miscellaneous menu entries */
                        role_menu_extra((-2), win, (1));
                        Object.assign(any, cg.zeroany);
                        if (excess < 1 || excess > 2) {
                            add_menu_str(win, "");
                        }
                        role_menu_extra(2, win, (0));
                        role_menu_extra(3, win, (0));
                        role_menu_extra(4, win, (0));
                        role_menu_extra(5, win, (0));
                        role_menu_extra((-1), win, (0));
                        pbuf = strcpy(pbuf, "Pick a role or profession");
                        (game.windowprocs.win_end_menu)(win, pbuf);
                        n = select_menu(win, 1, selected);
                        if (n > 0) {
                            /*
                     * PICK_ONE with preselected choice behaves strangely:
                     *  n == -1 -- <escape>, so use quit choice;
                     *  n ==  0 -- explicitly chose preselected entry,
                     *             toggling it off, so use it;
                     *  n ==  1 -- implicitly chose preselected entry
                     *             with <space> or <return>;
                     *  n ==  2 -- explicitly chose a different entry, so
                     *             both it and preselected one are in list.
                     */
                            choice = selected[0].item.a_int;
                            if (n > 1 && choice == (-2)) {
                                choice = selected[1].item.a_int;
                            }
                        } else {
                            choice = (n == 0) ? (-2) : (-1);
                        }
                        if (selected) {
                            free(selected) , selected = null;
                        }
                        (game.windowprocs.win_destroy_nhwindow)(win) , win = (-1);
                        if (choice == (-1)) {
                            break setup_done;
                        } else if (choice == ((-2) - ((4) + 1))) {
                            game.flags.initalign = k = (-1);
                            nextpick = 4;
                        } else if (choice == ((-2) - ((3) + 1))) {
                            game.flags.initgend = k = (-1);
                            nextpick = 3;
                        } else if (choice == ((-2) - ((2) + 1))) {
                            game.flags.initrace = k = (-1);
                            nextpick = 2;
                        } else if (choice == ((-2) - ((5) + 1))) {
                            game.flags.initrole = k = (-1);
                            reset_role_filtering();
                            nextpick = 1;
                        } else if (choice == (-2)) {
                            k = pick_role(game.flags.initrace, game.flags.initgend, game.flags.initalign, 0);
                            if (k < 0) {
                                k = randrole((0));
                            }
                        } else {
                            k = choice - 1;
                        }
                    }
                    game.flags.initrole = k;
                }
            }
            if (nextpick == 2) {
                nextpick = (game.flags.initrole < 0) ? 1 : 3;
                if (game.flags.initrace < 0 || !validrace(game.flags.initrole, game.flags.initrace)) {
                    if (pick4u == 121 || pick4u == 97 || game.flags.initrace == (-2)) {
                        /* Select a race, if necessary;
               force compatibility with role, try for compatibility
               with pre-selected gender/alignment. */
                        /* no race yet, or pre-selected race not valid */
                        k = pick_race(game.flags.initrole, game.flags.initgend, game.flags.initalign, 0);
                        if (k < 0) {
                            pline("Incompatible race!");
                            k = randrace(game.flags.initrole);
                        }
                    } else {
                        n = 0;
                        k = 0;
                        for (i = 0; races[i].noun; i++) {
                            if (ok_race(game.flags.initrole, i, game.flags.initgend, game.flags.initalign)) {
                                n++;
                                k = i;
                            }
                        }
                        if (n == 0) {
                            for (i = 0; races[i].noun; i++) {
                                if (validrace(game.flags.initrole, i)) {
                                    n++;
                                    k = i;
                                }
                            }
                        }
                        if (n > 1) {
                            /* Permit the user to pick, if there is more than one */
                            win = plsel_startmenu(screenheight, 2);
                            Object.assign(any, cg.zeroany);
                            setup_racemenu(win, (1), game.flags.initrole, game.flags.initgend, game.flags.initalign);
                            role_menu_extra((-2), win, (1));
                            any.a_int = 0;
                            add_menu_str(win, "");
                            role_menu_extra(1, win, (0));
                            role_menu_extra(3, win, (0));
                            role_menu_extra(4, win, (0));
                            role_menu_extra(5, win, (0));
                            role_menu_extra((-1), win, (0));
                            pbuf = strcpy(pbuf, "Pick a race or species");
                            (game.windowprocs.win_end_menu)(win, pbuf);
                            n = select_menu(win, 1, selected);
                            if (n > 0) {
                                choice = selected[0].item.a_int;
                                if (n > 1 && choice == (-2)) {
                                    choice = selected[1].item.a_int;
                                }
                            } else {
                                choice = (n == 0) ? (-2) : (-1);
                            }
                            if (selected) {
                                free(selected) , selected = null;
                            }
                            (game.windowprocs.win_destroy_nhwindow)(win) , win = (-1);
                            if (choice == (-1)) {
                                break setup_done;
                            } else if (choice == ((-2) - ((4) + 1))) {
                                game.flags.initalign = k = (-1);
                                nextpick = 4;
                            } else if (choice == ((-2) - ((3) + 1))) {
                                game.flags.initgend = k = (-1);
                                nextpick = 3;
                            } else if (choice == ((-2) - ((1) + 1))) {
                                game.flags.initrole = k = (-1);
                                nextpick = 1;
                            } else if (choice == ((-2) - ((5) + 1))) {
                                game.flags.initrace = k = (-1);
                                if (reset_role_filtering()) {
                                    nextpick = 1;
                                } else {
                                    nextpick = 2;
                                }
                            } else if (choice == (-2)) {
                                k = pick_race(game.flags.initrole, game.flags.initgend, game.flags.initalign, 0);
                                if (k < 0) {
                                    k = randrace(game.flags.initrole);
                                }
                            } else {
                                k = choice - 1;
                            }
                        }
                    }
                    game.flags.initrace = k;
                }
            }
            if (nextpick == 3) {
                nextpick = (game.flags.initrole < 0) ? 1 : (game.flags.initrace < 0) ? 2 : 4;
                if (game.flags.initgend < 0 || !validgend(game.flags.initrole, game.flags.initrace, game.flags.initgend)) {
                    if (pick4u == 121 || pick4u == 97 || game.flags.initgend == (-2)) {
                        /* Select a gender, if necessary;
               force compatibility with role/race, try for compatibility
               with pre-selected alignment. */
                        /* no gender yet, or pre-selected gender not valid */
                        k = pick_gend(game.flags.initrole, game.flags.initrace, game.flags.initalign, 0);
                        if (k < 0) {
                            pline("Incompatible gender!");
                            k = randgend(game.flags.initrole, game.flags.initrace);
                        }
                    } else {
                        n = 0;
                        k = 0;
                        for (i = 0; i < 2; i++) {
                            if (ok_gend(game.flags.initrole, game.flags.initrace, i, game.flags.initalign)) {
                                n++;
                                k = i;
                            }
                        }
                        if (n == 0) {
                            for (i = 0; i < 2; i++) {
                                if (validgend(game.flags.initrole, game.flags.initrace, i)) {
                                    n++;
                                    k = i;
                                }
                            }
                        }
                        if (n > 1) {
                            win = plsel_startmenu(screenheight, 3);
                            Object.assign(any, cg.zeroany);
                            /* populate the menu with gender choices */
                            setup_gendmenu(win, (1), game.flags.initrole, game.flags.initrace, game.flags.initalign);
                            role_menu_extra((-2), win, (1));
                            any.a_int = 0;
                            add_menu_str(win, "");
                            role_menu_extra(1, win, (0));
                            role_menu_extra(2, win, (0));
                            role_menu_extra(4, win, (0));
                            role_menu_extra(5, win, (0));
                            role_menu_extra((-1), win, (0));
                            pbuf = strcpy(pbuf, "Pick a gender or sex");
                            (game.windowprocs.win_end_menu)(win, pbuf);
                            n = select_menu(win, 1, selected);
                            if (n > 0) {
                                choice = selected[0].item.a_int;
                                if (n > 1 && choice == (-2)) {
                                    choice = selected[1].item.a_int;
                                }
                            } else {
                                choice = (n == 0) ? (-2) : (-1);
                            }
                            if (selected) {
                                free(selected) , selected = null;
                            }
                            (game.windowprocs.win_destroy_nhwindow)(win) , win = (-1);
                            if (choice == (-1)) {
                                break setup_done;
                            } else if (choice == ((-2) - ((4) + 1))) {
                                game.flags.initalign = k = (-1);
                                nextpick = 4;
                            } else if (choice == ((-2) - ((2) + 1))) {
                                game.flags.initrace = k = (-1);
                                nextpick = 2;
                            } else if (choice == ((-2) - ((1) + 1))) {
                                game.flags.initrole = k = (-1);
                                nextpick = 1;
                            } else if (choice == ((-2) - ((5) + 1))) {
                                game.flags.initgend = k = (-1);
                                if (reset_role_filtering()) {
                                    nextpick = 1;
                                } else {
                                    nextpick = 3;
                                }
                            } else if (choice == (-2)) {
                                k = pick_gend(game.flags.initrole, game.flags.initrace, game.flags.initalign, 0);
                                if (k < 0) {
                                    k = randgend(game.flags.initrole, game.flags.initrace);
                                }
                            } else {
                                k = choice - 1;
                            }
                        }
                    }
                    game.flags.initgend = k;
                }
            }
            if (nextpick == 4) {
                nextpick = (game.flags.initrole < 0) ? 1 : (game.flags.initrace < 0) ? 2 : 3;
                if (game.flags.initalign < 0 || !validalign(game.flags.initrole, game.flags.initrace, game.flags.initalign)) {
                    if (pick4u == 121 || pick4u == 97 || game.flags.initalign == (-2)) {
                        /* Select an alignment, if necessary;
               force compatibility with role/race/gender. */
                        /* no alignment yet, or pre-selected alignment not valid */
                        k = pick_align(game.flags.initrole, game.flags.initrace, game.flags.initgend, 0);
                        if (k < 0) {
                            pline("Incompatible alignment!");
                            k = randalign(game.flags.initrole, game.flags.initrace);
                        }
                    } else {
                        n = 0;
                        k = 0;
                        for (i = 0; i < 3; i++) {
                            if (ok_align(game.flags.initrole, game.flags.initrace, game.flags.initgend, i)) {
                                n++;
                                k = i;
                            }
                        }
                        if (n == 0) {
                            for (i = 0; i < 3; i++) {
                                if (validalign(game.flags.initrole, game.flags.initrace, i)) {
                                    n++;
                                    k = i;
                                }
                            }
                        }
                        if (n > 1) {
                            win = plsel_startmenu(screenheight, 4);
                            Object.assign(any, cg.zeroany);
                            setup_algnmenu(win, (1), game.flags.initrole, game.flags.initrace, game.flags.initgend);
                            role_menu_extra((-2), win, (1));
                            any.a_int = 0;
                            add_menu_str(win, "");
                            role_menu_extra(1, win, (0));
                            role_menu_extra(2, win, (0));
                            role_menu_extra(3, win, (0));
                            role_menu_extra(5, win, (0));
                            role_menu_extra((-1), win, (0));
                            pbuf = strcpy(pbuf, "Pick an alignment or creed");
                            (game.windowprocs.win_end_menu)(win, pbuf);
                            n = select_menu(win, 1, selected);
                            if (n > 0) {
                                choice = selected[0].item.a_int;
                                if (n > 1 && choice == (-2)) {
                                    choice = selected[1].item.a_int;
                                }
                            } else {
                                choice = (n == 0) ? (-2) : (-1);
                            }
                            if (selected) {
                                free(selected) , selected = null;
                            }
                            (game.windowprocs.win_destroy_nhwindow)(win) , win = (-1);
                            if (choice == (-1)) {
                                break setup_done;
                            } else if (choice == ((-2) - ((3) + 1))) {
                                game.flags.initgend = k = (-1);
                                nextpick = 3;
                            } else if (choice == ((-2) - ((2) + 1))) {
                                game.flags.initrace = k = (-1);
                                nextpick = 2;
                            } else if (choice == ((-2) - ((1) + 1))) {
                                game.flags.initrole = k = (-1);
                                nextpick = 1;
                            } else if (choice == ((-2) - ((5) + 1))) {
                                game.flags.initalign = k = (-1);
                                if (reset_role_filtering()) {
                                    nextpick = 1;
                                } else {
                                    nextpick = 4;
                                }
                            } else if (choice == (-2)) {
                                k = pick_align(game.flags.initrole, game.flags.initrace, game.flags.initgend, 0);
                                if (k < 0) {
                                    k = randalign(game.flags.initrole, game.flags.initrace);
                                }
                            } else {
                                k = choice - 1;
                            }
                        }
                    }
                    game.flags.initalign = k;
                }
            }
        } while (game.flags.initrole < 0 || game.flags.initrace < 0 || game.flags.initgend < 0 || game.flags.initalign < 0);
        /*
     *  Role, race, &c have now been determined;
     *  ask for confirmation and maybe go back to choose all over again.
     *
     *  Uses ynaq for familiarity, although 'a' is usually a
     *  superset of 'y' but here is an alternate form of 'n'.
     *  Menu layout:
     *   title:  Is this ok? [ynaq]
     *   blank:
     *    text:  $name, $alignment $gender $race $role
     *   blank:
     *    menu:  y + yes; play
     *           n - no; pick again
     *   maybe:  a - no; rename hero
     *           q - quit
     *           (end)
     */
        getconfirmation = (picksomething && pick4u != 97 && !game.flags.randomall);
        while (getconfirmation) {
            win = plsel_startmenu(screenheight, 5);
            Object.assign(any, cg.zeroany);
            any.a_int = 1;
            add_menu(win, nul_glyphinfo, any, 121, 0, 0, clr, "Yes; start game", 1);
            any.a_int = 2;
            add_menu(win, nul_glyphinfo, any, 110, 0, 0, clr, "No; choose role again", 0);
            if (game.iflags.renameallowed) {
                any.a_int = 3;
                add_menu(win, nul_glyphinfo, any, 97, 0, 0, clr, "Not yet; choose another name", 0);
            }
            any.a_int = -1;
            add_menu(win, nul_glyphinfo, any, 113, 0, 0, clr, "Quit", 0);
            pbuf = sprintf(pbuf, "Is this ok? [yn%sq]", game.iflags.renameallowed ? "a" : "");
            (game.windowprocs.win_end_menu)(win, pbuf);
            n = select_menu(win, 1, selected);
            /* [pick-one menus with a preselected entry behave oddly...] */
            choice = (n > 0) ? selected[n - 1].item.a_int : (n == 0) ? 1 : -1;
            if (selected) {
                free(selected) , selected = null;
            }
            (game.windowprocs.win_destroy_nhwindow)(win);
            switch (choice) {
                default:
                    break setup_done;
                    break;
                case 3:
{
                        /*
             * TODO: what, if anything, should be done if the name is
             * changed to or from "wizard" after port-specific startup
             * code has set flags.debug based on the original name?
             */
                        let saveROLE = 0;
                        let saveRACE = 0;
                        let saveGEND = 0;
                        let saveALGN = 0;
                        /* affects main() in unixmain.c */
                        game.iflags.renameinprogress = (1);
                        /* plnamesuffix() can change any or all of ROLE, RACE,
               GEND, ALGN; we'll override that and honor only the name */
                        saveROLE = game.flags.initrole , saveRACE = game.flags.initrace , saveGEND = game.flags.initgend , saveALGN = game.flags.initalign;
                        game.plname = '';
                        /* calls askname() when svp.plname[] is empty */
                        plnamesuffix();
                        game.flags.initrole = saveROLE , game.flags.initrace = saveRACE , game.flags.initgend = saveGEND , game.flags.initalign = saveALGN;
                        /* getconfirmation is still True */
                        break;
                    }
                case 2:
                    pick4u = 110;
                    game.flags.initrole = game.flags.initrace = game.flags.initgend = game.flags.initalign = (-1);
                    continue chargen_loop;
                /* 'y' or Space or Return/Enter */
                case 1:
                    getconfirmation = (0);
                    break;
            }
        }
        result = 1;
    }
    break chargen_loop;
    }
    game.program_state.in_role_selection--;
    return result;
}
export function reset_role_filtering() {
    let win = 0;
    let i = 0;
    let n = 0;
    let filterprompt = '';
    let selected = null;
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    /* no extra blank line preceding this entry; end_menu supplies one */
    add_menu_str(win, "Unacceptable roles");
    setup_rolemenu(win, (0), (-1), (-1), (-1));
    add_menu_str(win, "");
    add_menu_str(win, "Unacceptable races");
    setup_racemenu(win, (0), (-1), (-1), (-1));
    add_menu_str(win, "");
    add_menu_str(win, "Unacceptable genders");
    setup_gendmenu(win, (0), (-1), (-1), (-1));
    add_menu_str(win, "");
    add_menu_str(win, "Unacceptable alignments");
    setup_algnmenu(win, (0), (-1), (-1), (-1));
    filterprompt = sprintf(filterprompt, "Pick all that apply%s", gotrolefilter() ? " and/or unpick any that no longer apply" : "");
    (game.windowprocs.win_end_menu)(win, filterprompt);
    n = select_menu(win, 2, selected);
    if (n >= 0) {
        /* n==0: clear current filters and don't set new ones */
        clearrolefilter(5);
        for (i = 0; i < n; i++) {
            setrolefilter(selected[i].item.a_string);
        }
        game.flags.initrole = game.flags.initrace = game.flags.initgend = game.flags.initalign = (-1);
    }
    if (selected) {
        free(selected) , selected = null;
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
    return (n > 0) ? (1) : (0);
}
/* the change in format when this extended role selection was converted from
   tty-only to tty+curses+? made the role selection menu require two pages
   on a traditional 24-line tty; that wasn't fair to tty, so squeeze out
   some blank separator lines from the menu if that will make it fit on one */
export function maybe_skip_seps(rows, aspect) {
    let i = 0;
    let n = 0;
    /* not much point to generalizing this to other aspects */
    if (aspect != 1) {
        return 0;
    }
    /*
     * If there are one or two excess lines, setup_rolemenu() will omit
     * the separator between 'random' and 'pick race first'.  If there are
     * two, plsel_startmenu() will omit the one between role info so far
     * ("<role> <race> ...") and the set of role entries.
     */
    /* title and ensuing separator, role info so far and separator */
    n += 4;
    for (i = 0; roles[i].name.m; ++i) {
        if (ok_role(i, game.flags.initrace, game.flags.initgend, game.flags.initalign) && ok_race(i, game.flags.initrace, game.flags.initgend, game.flags.initalign) && ok_gend(i, game.flags.initrace, game.flags.initgend, game.flags.initalign) && ok_align(i, game.flags.initrace, game.flags.initgend, game.flags.initalign)) {
            ++n;
        }
    }
    n += 2;
    /* race 1st, gender 1st, alignment 1st, reset filter, quit */
    n += 5;
    n += 1;
    if (rows > 0 && n > rows) {
        return n - rows;
    }
    return 0;
}
/* start a menu; show role aspects specified so far as a header line */
export function plsel_startmenu(ttyrows, aspect) {
    let qbuf = '';
    let win = 0;
    let rolename = null;
    rigid_role_checks();
    rolename = (game.flags.initrole < 0) ? "<role>" : (game.flags.initgend == 1 && roles[game.flags.initrole].name.f) ? roles[game.flags.initrole].name.f : roles[game.flags.initrole].name.m;
    if (!game.plname[0] || game.flags.initrole < 0 || game.flags.initrace < 0 || game.flags.initgend < 0 || game.flags.initalign < 0) {
        qbuf = sprintf(qbuf, "%.20s %.20s %.20s %.20s", rolename, (game.flags.initrace < 0) ? "<race>" : races[game.flags.initrace].noun, (game.flags.initgend < 0) ? "<gender>" : genders[game.flags.initgend].adj, (game.flags.initalign < 0) ? "<alignment>" : aligns[game.flags.initalign].adj);
    } else {
        qbuf = sprintf(qbuf, "%.20s the %.20s %.20s %.20s %.20s", game.plname, aligns[game.flags.initalign].adj, genders[game.flags.initgend].adj, races[game.flags.initrace].adj, rolename);
    }
    win = (game.windowprocs.win_create_nhwindow)(4);
    if (win == (-1)) {
        panic("could not create role selection window");
    }
    (game.windowprocs.win_start_menu)(win, 0);
    add_menu_str(win, qbuf);
    if (maybe_skip_seps(ttyrows, aspect) != 2) {
        add_menu_str(win, "");
    }
    return win;
}
/* add entries a-Archeologist, b-Barbarian, &c to menu being built in 'win' */
/* True => exclude filtered roles;
                        * False => filter reset */
/* all ROLE_NONE for !filtering case */
export function setup_rolemenu(win, filtering, race, gend, algn) {
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let role_ok = 0;
    let thisch = 0;
    let lastch = 0;
    let rolenamebuf = '';
    let clr = 8;
    Object.assign(any, cg.zeroany);
    for (i = 0; roles[i].name.m; i++) {
        /* role can be constrained by any of race, gender, or alignment */
        role_ok = (ok_role(i, race, gend, algn) && ok_race(i, race, gend, algn) && ok_gend(i, race, gend, algn) && ok_align(i, race, gend, algn));
        if (filtering && !role_ok) {
            continue;
        }
        if (filtering) {
            any.a_int = i + 1;
        } else {
            any.a_string = roles[i].name.m;
        }
        thisch = lowc(roles[i].name.m);
        if (thisch == lastch) {
            thisch = highc(thisch);
        }
        rolenamebuf = strcpy(rolenamebuf, roles[i].name.m);
        if (roles[i].name.f) {
            /* role has distinct name for female (C,P) */
            if (gend == 1) {
                rolenamebuf = strcpy(rolenamebuf, roles[i].name.f);
            } else if (gend < 0) {
                rolenamebuf = strcat(rolenamebuf, "/");
                rolenamebuf = strcat(rolenamebuf, roles[i].name.f);
            }
        }
        /* !filtering implies reset_role_filtering() where we want to
           mark this role as preselected if current filter excludes it */
        add_menu(win, nul_glyphinfo, any, thisch, 0, 0, clr, an(rolenamebuf), (!filtering && !role_ok) ? 1 : 0);
        lastch = thisch;
    }
}
export function setup_racemenu(win, filtering, role, gend, algn) {
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let race_ok = 0;
    let i = 0;
    let this_ch = 0;
    let clr = 8;
    Object.assign(any, cg.zeroany);
    for (i = 0; races[i].noun; i++) {
        /* no ok_gend(); race isn't constrained by gender */
        race_ok = (ok_race(role, i, gend, algn) && ok_role(role, i, gend, algn) && ok_align(role, i, gend, algn));
        if (filtering && !race_ok) {
            continue;
        }
        if (filtering) {
            any.a_int = i + 1;
        } else {
            any.a_string = races[i].noun;
        }
        this_ch = races[i].noun;
        /* filtering: picking race, so choose by first letter, with
           capital letter as unseen accelerator;
           !filtering: resetting filter rather than picking, choose by
           capital letter since lowercase role letters will be present */
        add_menu(win, nul_glyphinfo, any, filtering ? this_ch : highc(this_ch), filtering ? highc(this_ch) : 0, 0, clr, races[i].noun, (!filtering && !race_ok) ? 1 : 0);
    }
}
export function setup_gendmenu(win, filtering, role, race, algn) {
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let gend_ok = 0;
    let i = 0;
    let this_ch = 0;
    let clr = 8;
    Object.assign(any, cg.zeroany);
    for (i = 0; i < 2; i++) {
        /* no ok_align(); gender isn't constrained by alignment */
        gend_ok = (ok_gend(role, race, i, algn) && ok_role(role, race, i, algn) && ok_race(role, race, i, algn));
        if (filtering && !gend_ok) {
            continue;
        }
        if (filtering) {
            any.a_int = i + 1;
        } else {
            any.a_string = genders[i].adj;
        }
        this_ch = genders[i].adj;
        /* (see setup_racemenu for explanation of selector letters
           and setup_rolemenu for preselection) */
        add_menu(win, nul_glyphinfo, any, filtering ? this_ch : highc(this_ch), filtering ? highc(this_ch) : 0, 0, clr, genders[i].adj, (!filtering && !gend_ok) ? 1 : 0);
    }
}
export function setup_algnmenu(win, filtering, role, race, gend) {
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let algn_ok = 0;
    let i = 0;
    let this_ch = 0;
    let clr = 8;
    Object.assign(any, cg.zeroany);
    for (i = 0; i < 3; i++) {
        /* no ok_gend(); alignment isn't constrained by gender */
        algn_ok = (ok_align(role, race, gend, i) && ok_role(role, race, gend, i) && ok_race(role, race, gend, i));
        if (filtering && !algn_ok) {
            continue;
        }
        if (filtering) {
            any.a_int = i + 1;
        } else {
            any.a_string = aligns[i].adj;
        }
        this_ch = aligns[i].adj;
        add_menu(win, nul_glyphinfo, any, filtering ? this_ch : highc(this_ch), filtering ? highc(this_ch) : 0, 0, clr, aligns[i].adj, (!filtering && !algn_ok) ? 1 : 0);
    }
}
/* !TTY_GRAPHICS */
/* ?TTY_GRAPHICS */
/* role.c */
/* clear race, gender, and alignment filters */
/* it's generic; remove it so that askname() will be called */
/* female specified; replace male role name with female one */
/* gender unspecified; append slash and female role name */
/* We now have a valid role index.  Copy the role name back. */
/* This should become OBSOLETE */
/* assume failure (player chooses to 'quit') */
/* affects tty menu cleanup */
/* Used to avoid "Is this ok?" if player has already specified all
     * four facets of role.
     * Note that rigid_role_checks might force any unspecified facets to
     * have a specific value, but that will still require confirmation;
     * player can specify the forced ones if avoiding that is demanded.
     */
/* Used for '-@';
     * choose randomly without asking for all unspecified facets.
     */
/* prevent unnecessary prompting if role forces race (samurai) or gender
       (valkyrie) or alignment (rogue), or race forces alignment (orc), &c */
/* prompt[] contains "Shall I pick ... for you? [ynaq] "
           y - game picks role,&c then asks player to confirm;
           n - player manually chooses via menu selections;
           a - like 'y', but skips confirmation and starts game;
           q - quit
         */
/* 'prompt' is constructed with trailing space */
/* TODO? handle response of '?' */
/* similar to '-@' on command line */
/* accept any character and do validation ourselves so that we can
           shorten prompt; it will be "Shall I pick ... for you? [ynaq] "
           with final space appended by yn_function() [for tty at least] */
/* slightly simpler but more likely to end up being wrapped */
/* strip choices off prompt string; yn_function() will show them */
/* prompt becomes "Shall I pick ... for you? [ynaq] (y) "
           with " [ynaq] (y) " appended by yn_function() which also changes
           user's <space> and <return> to 'y', <escape> to 'q' */
/* start fresh, but bypass "shall I pick everything for you?"
               step; any partial role selection via config file, command
               line, or name suffix is discarded this time */
/* "<name> the <alignment> <gender> <race.adjective> <role>" */
/* "<role> <race.noun> <gender> <alignment>" */
/* female already chosen; replace male name */
/* not chosen yet; append slash+female name */
