/* NetHack 5.0	drawing.c	$NHDT-Date: 1596498163 2020/08/03 23:42:43 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.78 $ */
/* Copyright (c) NetHack Development Team 1992.                   */
/* NetHack may be freely redistributed.  See license for details. */
import { strcmp, strncmp } from '../c2js-runtime/string.js';
import { AMULET_SYM, ARMOR_SYM, BALL_SYM, CHAIN_SYM, DEF_ANGEL, DEF_ANT, DEF_BAT, DEF_BLOB, DEF_CENTAUR, DEF_COCKATRICE, DEF_DEMON, DEF_DOG, DEF_DRAGON, DEF_EEL, DEF_ELEMENTAL, DEF_EYE, DEF_FELINE, DEF_FUNGUS, DEF_GHOST, DEF_GIANT, DEF_GNOME, DEF_GOLEM, DEF_GREMLIN, DEF_HUMAN, DEF_HUMANOID, DEF_IMP, DEF_INVISIBLE, DEF_JABBERWOCK, DEF_JELLY, DEF_KOBOLD, DEF_KOP, DEF_LEPRECHAUN, DEF_LICH, DEF_LIGHT, DEF_LIZARD, DEF_MIMIC, DEF_MIMIC_DEF, DEF_MUMMY, DEF_NAGA, DEF_NYMPH, DEF_OGRE, DEF_ORC, DEF_PIERCER, DEF_PUDDING, DEF_QUADRUPED, DEF_QUANTMECH, DEF_RODENT, DEF_RUSTMONST, DEF_SNAKE, DEF_SPIDER, DEF_TRAPPER, DEF_TROLL, DEF_UMBER, DEF_UNICORN, DEF_VAMPIRE, DEF_VORTEX, DEF_WORM, DEF_WORM_TAIL, DEF_WRAITH, DEF_XAN, DEF_XORN, DEF_YETI, DEF_ZOMBIE, DEF_ZRUTY, FOOD_SYM, GEM_SYM, GOLD_SYM, ILLOBJ_SYM, MAXMCLASSES, MAXOCLASSES, MAXPCHARS, POTION_SYM, RING_SYM, ROCK_SYM, SCROLL_SYM, SPBOOK_SYM, TOOL_SYM, VENOM_SYM, WAND_SYM, WEAPON_SYM } from './nh-constants.js';

/* Relevant header information in rm.h, objclass.h, sym.h, defsym.h. */
/* Default object class symbols.  See objclass.h.
 * {symbol, name, explain}
 *     name:    used in object_detect().
 *     explain: used in do_look().
 */
export const def_oc_syms = [{ sym: 0, name: "", explain: "" }, { sym: ILLOBJ_SYM, name: "illegal objects", explain: "strange object" }, { sym: WEAPON_SYM, name: "weapons", explain: "weapon" }, { sym: ARMOR_SYM, name: "armor", explain: "suit or piece of armor" }, { sym: RING_SYM, name: "rings", explain: "ring" }, { sym: AMULET_SYM, name: "amulets", explain: "amulet" }, { sym: TOOL_SYM, name: "tools", explain: "useful item (pick-axe, key, lamp...)" }, { sym: FOOD_SYM, name: "food", explain: "piece of food" }, { sym: POTION_SYM, name: "potions", explain: "potion" }, { sym: SCROLL_SYM, name: "scrolls", explain: "scroll" }, { sym: SPBOOK_SYM, name: "spellbooks", explain: "spellbook" }, { sym: WAND_SYM, name: "wands", explain: "wand" }, { sym: GOLD_SYM, name: "coins", explain: "pile of coins" }, { sym: GEM_SYM, name: "rocks", explain: "gem or rock" }, { sym: ROCK_SYM, name: "large stones", explain: "boulder or statue" }, { sym: BALL_SYM, name: "iron balls", explain: "iron ball" }, { sym: CHAIN_SYM, name: "chains", explain: "iron chain" }, { sym: VENOM_SYM, name: "venoms", explain: "splash of venom" }];
/* placeholder for the "random class" */
/* Default monster class symbols.  See sym.h and defsym.h. */
export const def_monsyms = [{ sym: 0, name: "", explain: "" }, { sym: DEF_ANT, name: "", explain: "ant or other insect" }, { sym: DEF_BLOB, name: "", explain: "blob" }, { sym: DEF_COCKATRICE, name: "", explain: "cockatrice" }, { sym: DEF_DOG, name: "", explain: "dog or other canine" }, { sym: DEF_EYE, name: "", explain: "eye or sphere" }, { sym: DEF_FELINE, name: "", explain: "cat or other feline" }, { sym: DEF_GREMLIN, name: "", explain: "gremlin" }, { sym: DEF_HUMANOID, name: "", explain: "humanoid" }, { sym: DEF_IMP, name: "", explain: "imp or minor demon" }, { sym: DEF_JELLY, name: "", explain: "jelly" }, { sym: DEF_KOBOLD, name: "", explain: "kobold" }, { sym: DEF_LEPRECHAUN, name: "", explain: "leprechaun" }, { sym: DEF_MIMIC, name: "", explain: "mimic" }, { sym: DEF_NYMPH, name: "", explain: "nymph" }, { sym: DEF_ORC, name: "", explain: "orc" }, { sym: DEF_PIERCER, name: "", explain: "piercer" }, { sym: DEF_QUADRUPED, name: "", explain: "quadruped" }, { sym: DEF_RODENT, name: "", explain: "rodent" }, { sym: DEF_SPIDER, name: "", explain: "arachnid or centipede" }, { sym: DEF_TRAPPER, name: "", explain: "trapper or lurker above" }, { sym: DEF_UNICORN, name: "", explain: "unicorn or horse" }, { sym: DEF_VORTEX, name: "", explain: "vortex" }, { sym: DEF_WORM, name: "", explain: "worm" }, { sym: DEF_XAN, name: "", explain: "xan or other mythical/fantastic insect" }, { sym: DEF_LIGHT, name: "", explain: "light" }, { sym: DEF_ZRUTY, name: "", explain: "zruty" }, { sym: DEF_ANGEL, name: "", explain: "angelic being" }, { sym: DEF_BAT, name: "", explain: "bat or bird" }, { sym: DEF_CENTAUR, name: "", explain: "centaur" }, { sym: DEF_DRAGON, name: "", explain: "dragon" }, { sym: DEF_ELEMENTAL, name: "", explain: "elemental" }, { sym: DEF_FUNGUS, name: "", explain: "fungus or mold" }, { sym: DEF_GNOME, name: "", explain: "gnome" }, { sym: DEF_GIANT, name: "", explain: "giant humanoid" }, { sym: DEF_INVISIBLE, name: "", explain: "invisible monster" }, { sym: DEF_JABBERWOCK, name: "", explain: "jabberwock" }, { sym: DEF_KOP, name: "", explain: "Keystone Kop" }, { sym: DEF_LICH, name: "", explain: "lich" }, { sym: DEF_MUMMY, name: "", explain: "mummy" }, { sym: DEF_NAGA, name: "", explain: "naga" }, { sym: DEF_OGRE, name: "", explain: "ogre" }, { sym: DEF_PUDDING, name: "", explain: "pudding or ooze" }, { sym: DEF_QUANTMECH, name: "", explain: "quantum mechanic" }, { sym: DEF_RUSTMONST, name: "", explain: "rust monster or disenchanter" }, { sym: DEF_SNAKE, name: "", explain: "snake" }, { sym: DEF_TROLL, name: "", explain: "troll" }, { sym: DEF_UMBER, name: "", explain: "umber hulk" }, { sym: DEF_VAMPIRE, name: "", explain: "vampire" }, { sym: DEF_WRAITH, name: "", explain: "wraith" }, { sym: DEF_XORN, name: "", explain: "xorn" }, { sym: DEF_YETI, name: "", explain: "apelike creature" }, { sym: DEF_ZOMBIE, name: "", explain: "zombie" }, { sym: DEF_HUMAN, name: "", explain: "human or elf" }, { sym: DEF_GHOST, name: "", explain: "ghost" }, { sym: DEF_GOLEM, name: "", explain: "golem" }, { sym: DEF_DEMON, name: "", explain: "major demon" }, { sym: DEF_EEL, name: "", explain: "sea monster" }, { sym: DEF_LIZARD, name: "", explain: "lizard" }, { sym: DEF_WORM_TAIL, name: "", explain: "long worm tail" }, { sym: DEF_MIMIC_DEF, name: "", explain: "mimic" }];
export const def_warnsyms = [{ sym: 48, explanation: "unknown creature causing you worry", color: 15 }, { sym: 49, explanation: "unknown creature causing you concern", color: 1 }, { sym: 50, explanation: "unknown creature causing you anxiety", color: 1 }, { sym: 51, explanation: "unknown creature causing you disquiet", color: 1 }, { sym: 52, explanation: "unknown creature causing you alarm", color: 5 }, { sym: 53, explanation: "unknown creature causing you dread", color: 13 }];
/* white warning  */
/* pink warning   */
/* red warning    */
/* ruby warning   */
/* purple warning */
/* black warning  */
/*
 *  Default screen symbols with explanations and colors.
 *
 *  If adding to or removing from this list, please note that,
 *  for builds with tile support, there is an array called altlabels[] in
 *  win/share/tilemap.c that requires the same number of elements as
 *  this, in the same order. It is used for tile name matching when
 *  parsing other.txt because some of the useful tile names don't exist
 *  within NetHack itself.
 */
export const defsyms = [{ sym: 32, explanation: "stone", color: 8 }, { sym: 124, explanation: "wall", color: 7 }, { sym: 45, explanation: "wall", color: 7 }, { sym: 45, explanation: "wall", color: 7 }, { sym: 45, explanation: "wall", color: 7 }, { sym: 45, explanation: "wall", color: 7 }, { sym: 45, explanation: "wall", color: 7 }, { sym: 45, explanation: "wall", color: 7 }, { sym: 45, explanation: "wall", color: 7 }, { sym: 45, explanation: "wall", color: 7 }, { sym: 124, explanation: "wall", color: 7 }, { sym: 124, explanation: "wall", color: 7 }, { sym: 46, explanation: "doorway", color: 7 }, { sym: 45, explanation: "open door", color: 3 }, { sym: 124, explanation: "open door", color: 3 }, { sym: 43, explanation: "closed door", color: 3 }, { sym: 43, explanation: "closed door", color: 3 }, { sym: 35, explanation: "iron bars", color: 6 }, { sym: 35, explanation: "tree", color: 2 }, { sym: 46, explanation: "floor of a room", color: 7 }, { sym: 46, explanation: "dark part of a room", color: 0 }, { sym: 96, explanation: "engraving", color: 12 }, { sym: 35, explanation: "corridor", color: 7 }, { sym: 35, explanation: "lit corridor", color: 7 }, { sym: 35, explanation: "engraving", color: 12 }, { sym: 60, explanation: "staircase up", color: 7 }, { sym: 62, explanation: "staircase down", color: 7 }, { sym: 60, explanation: "ladder up", color: 3 }, { sym: 62, explanation: "ladder down", color: 3 }, { sym: 60, explanation: "branch staircase up", color: 11 }, { sym: 62, explanation: "branch staircase down", color: 11 }, { sym: 60, explanation: "branch ladder up", color: 11 }, { sym: 62, explanation: "branch ladder down", color: 11 }, { sym: 95, explanation: "altar", color: 7 }, { sym: 124, explanation: "grave", color: 15 }, { sym: 92, explanation: "opulent throne", color: 11 }, { sym: 123, explanation: "sink", color: 15 }, { sym: 123, explanation: "fountain", color: 12 }, { sym: 125, explanation: "water", color: 4 }, { sym: 46, explanation: "ice", color: 6 }, { sym: 125, explanation: "molten lava", color: 1 }, { sym: 125, explanation: "wall of lava", color: 9 }, { sym: 46, explanation: "lowered drawbridge", color: 3 }, { sym: 46, explanation: "lowered drawbridge", color: 3 }, { sym: 35, explanation: "raised drawbridge", color: 3 }, { sym: 35, explanation: "raised drawbridge", color: 3 }, { sym: 32, explanation: "air", color: 6 }, { sym: 35, explanation: "cloud", color: 7 }, { sym: 125, explanation: "water", color: 12 }, { sym: 94, explanation: "arrow trap", color: 6 }, { sym: 94, explanation: "dart trap", color: 6 }, { sym: 94, explanation: "falling rock trap", color: 7 }, { sym: 94, explanation: "squeaky board", color: 3 }, { sym: 94, explanation: "bear trap", color: 6 }, { sym: 94, explanation: "land mine", color: 1 }, { sym: 94, explanation: "rolling boulder trap", color: 7 }, { sym: 94, explanation: "sleeping gas trap", color: 12 }, { sym: 94, explanation: "rust trap", color: 4 }, { sym: 94, explanation: "fire trap", color: 9 }, { sym: 94, explanation: "pit", color: 0 }, { sym: 94, explanation: "spiked pit", color: 0 }, { sym: 94, explanation: "hole", color: 3 }, { sym: 94, explanation: "trap door", color: 3 }, { sym: 94, explanation: "teleportation trap", color: 5 }, { sym: 94, explanation: "level teleporter", color: 5 }, { sym: 94, explanation: "magic portal", color: 13 }, { sym: 34, explanation: "web", color: 7 }, { sym: 94, explanation: "statue trap", color: 7 }, { sym: 94, explanation: "magic trap", color: 12 }, { sym: 94, explanation: "anti-magic field", color: 12 }, { sym: 94, explanation: "polymorph trap", color: 10 }, { sym: 126, explanation: "vibrating square", color: 5 }, { sym: 94, explanation: "trapped door", color: 9 }, { sym: 94, explanation: "trapped chest", color: 9 }, { sym: 124, explanation: "", color: 7 }, { sym: 45, explanation: "", color: 7 }, { sym: 92, explanation: "", color: 7 }, { sym: 47, explanation: "", color: 7 }, { sym: 42, explanation: "", color: 15 }, { sym: 33, explanation: "", color: 15 }, { sym: 41, explanation: "", color: 3 }, { sym: 40, explanation: "", color: 3 }, { sym: 48, explanation: "", color: 12 }, { sym: 35, explanation: "", color: 12 }, { sym: 64, explanation: "", color: 12 }, { sym: 42, explanation: "", color: 12 }, { sym: 35, explanation: "poison cloud", color: 10 }, { sym: 36, explanation: "valid position", color: 12 }, { sym: 47, explanation: "", color: 2 }, { sym: 45, explanation: "", color: 2 }, { sym: 92, explanation: "", color: 2 }, { sym: 124, explanation: "", color: 2 }, { sym: 124, explanation: "", color: 2 }, { sym: 92, explanation: "", color: 2 }, { sym: 45, explanation: "", color: 2 }, { sym: 47, explanation: "", color: 2 }, { sym: 47, explanation: "", color: 9 }, { sym: 45, explanation: "", color: 9 }, { sym: 92, explanation: "", color: 9 }, { sym: 124, explanation: "", color: 9 }, { sym: 32, explanation: "", color: 9 }, { sym: 124, explanation: "", color: 9 }, { sym: 92, explanation: "", color: 9 }, { sym: 45, explanation: "", color: 9 }, { sym: 47, explanation: "", color: 9 }, { sym: 0, explanation: null, color: 8 }];
/* default rogue level symbols */
export const def_r_oc_syms = [0, ILLOBJ_SYM, WEAPON_SYM, 93, RING_SYM, 44, TOOL_SYM, 58, POTION_SYM, SCROLL_SYM, SPBOOK_SYM, WAND_SYM, GEM_SYM, GEM_SYM, ROCK_SYM, BALL_SYM, CHAIN_SYM, VENOM_SYM];
/* 0*/
/* armor */
/* 5*/
/* amulet */
/* food */
/*10*/
/* gold -- yes it's the same as gems */
/*15*/
/*
 * Convert the given character to an object class.  If the character is not
 * recognized, then MAXOCLASSES is returned.  Used in detect.c, drawing.c,
 * invent.c, o_init.c, objnam.c, options.c, pickup.c, sp_lev.c, and
 * windows.c.
 */
export function def_char_to_objclass(ch) {
    /* note: these refer to defsyms[] order which is much different from
       levl[][].typ order but both keep furniture in a contiguous block */
    let i = 0;
    for (i = 1; i < MAXOCLASSES; i++) {
        if (ch == def_oc_syms[i].sym) {
            break;
        }
    }
    return i;
}
/*
 * Convert a character into a monster class.  This returns the _first_
 * match made.  If there are no matches, return MAXMCLASSES.
 * Used in detect.c, drawing.c, mondata.c, options.c, pickup.c,
 * sp_lev.c, and windows.c.
 */
export function def_char_to_monclass(ch) {
    let i = 0;
    for (i = 1; i < MAXMCLASSES; i++) {
        if (ch == def_monsyms[i].sym) {
            break;
        }
    }
    return i;
}
/* does 'ch' represent a furniture character?  returns index into defsyms[] */
const __def_char_is_furniture_first_furniture = "stair";
const __def_char_is_furniture_last_furniture = "fountain";
export function def_char_is_furniture(ch) {
    let i = 0;
    let furniture = (0);
    for (i = 0; i < MAXPCHARS; ++i) {
        if (!furniture) {
            if (!strncmp(defsyms[i].explanation, __def_char_is_furniture_first_furniture, 5)) {
                furniture = (1);
            }
        }
        if (furniture) {
            if (defsyms[i].sym == ch) {
                return i;
            }
            if (!strcmp(defsyms[i].explanation, __def_char_is_furniture_last_furniture)) {
                break;
            }
        }
    }
    return -1;
}
/*drawing.c*/
