/* NetHack 5.0	read.c	$NHDT-Date: 1762577372 2025/11/07 20:49:32 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.323 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { abs, sgn } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, atoi, strcat, strchr, strcmp, strcpy, strlen, strncmpi, strstri } from '../c2js-runtime/string.js';
import { snuff_lit } from './apply.js';
import { artifact_light, is_art } from './artifact.js';
import { adjalign, exercise } from './attrib.js';
import { move_bc, placebc, set_bc } from './ball.js';
import { isok, yn_function } from './cmd.js';
import { is_lava, is_pool } from './dbridge.js';
import { c_color_names, c_common_strings, ynchars } from './decl.js';
import { cvt_sdoor_to_door, do_mapping, food_detect, gold_detect, trap_detect } from './detect.js';
import { buried_ball_to_freedom } from './dig.js';
import { canseemon, map_invisible, newsym, sensemon, shieldeff, tmp_at } from './display.js';
import { dropy, flooreffects, trycall } from './do.js';
import { Monnam, hcolor, hliquid, mon_nam, pmname } from './do_name.js';
import { Ring_gone, Ring_off, Ring_on, adj_abon, any_worn_armor_ok, count_worn_armor, destroy_arm, disintegrate_arm, hard_helmet, some_armor } from './do_wear.js';
import { initedog, tamedog } from './dog.js';
import { def_monsyms } from './drawing.js';
import { In_hell, In_mines, avoid_ceiling, ceiling, has_ceiling, on_level } from './dungeon.js';
import { delayed_killer, done } from './end.js';
import { wipeout_text } from './engrave.js';
import { more_experienced } from './exper.js';
import { explode } from './explode.js';
import { getpos, getpos_sethilite } from './getpos.js';
import { check_capacity, losehp } from './hack.js';
import { digit, dist2, eos, mungspaces, s_suffix, upstart, upwords } from './hacklib.js';
import { list_genocided, num_genocides } from './insight.js';
import { delobj, getobj, identify_pack, stackobj, update_inventory, useup } from './invent.js';
import { arti_light_radius, snuff_light_source } from './light.js';
import { create_critters, makemon, mkclass, rndmonst, set_malign } from './makemon.js';
import { monster_census } from './minion.js';
import { bcsign, bless, blessorcurse, costly_alteration, curse, maybe_adjust_light, mkobj, mksobj, place_object, uncurse, weight } from './mkobj.js';
import { flash_mon, kill_genocided_monsters, killed, mondied, mongone, newcham, setmangry, wake_nearto, wakeup } from './mon.js';
import { can_chant, dmgtype_fromattack, monstseesu, monstunseesu, name_to_mon, name_to_monclass, pronoun_gender } from './mondata.js';
import { closed_door, monflee } from './monmove.js';
import { AIR, ALCHEMY_SMOCK, ARMOR_CLASS, ARM_SHIELD, ART_ORB_OF_FATE, ART_SUNSWORD, A_CON, A_STR, A_WIS, BAG_OF_TRICKS, BALL_CLASS, BELL_OF_OPENING, BLACK_DRAGON_SCALES, BLACK_DRAGON_SCALE_MAIL, BLINDED, BOULDER, BRASS_LANTERN, CANDY_BAR, CAN_OF_GREASE, CHAIN_CLASS, CLOUD, COIN_CLASS, CONFUSION, CORNUTHAUM, CORR, COST_DECHNT, COST_DEGRD, COST_UNCHRG, COST_UNCURS, CREDIT_CARD, CRYSTAL_BALL, DEAF, DOOR, DRUM_OF_EARTHQUAKE, DUNCE_CAP, ELVEN_BOOTS, ELVEN_CLOAK, ELVEN_LEATHER_HELM, ELVEN_MITHRIL_COAT, ELVEN_SHIELD, EXPENSIVE_CAMERA, EXPL_FIERY, FEMALE, FIRE_HORN, FIRE_RES, FORTUNE_COOKIE, FROST_HORN, GEM_CLASS, GENOCIDED, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_EXCLUDE_SELECTABLE, GETOBJ_SUGGEST, GLYPH_ALTAR_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GRAY_DRAGON_SCALES, GRAY_DRAGON_SCALE_MAIL, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, HAWAIIAN_SHIRT, HEAD, HEAVY_IRON_BALL, HORN_OF_PLENTY, INVIS, LEASH, LEG, LOADSTONE, LOW_PM, MAGIC_FLUTE, MAGIC_HARP, MAGIC_LAMP, MAGIC_MARKER, MALE, MAXMCLASSES, MAX_GLYPH, MS_GUARDIAN, MS_LEADER, MS_NEMESIS, M_SEEN_FIRE, NEUTRAL, NON_PM, NUMMONS, OIL_LAMP, PASSES_WALLS, PLNMSG_TOWER_OF_FLAME, PM_ACID_BLOB, PM_AIR_ELEMENTAL, PM_ALIGNED_CLERIC, PM_ANGEL, PM_BARBED_DEVIL, PM_BLACK_LIGHT, PM_DOPPELGANGER, PM_FIRE_ANT, PM_FLESH_GOLEM, PM_GIANT_BAT, PM_GREMLIN, PM_GUARD, PM_HELL_HOUND, PM_HIGH_CLERIC, PM_HUMAN_ZOMBIE, PM_IMP, PM_LARGE_MIMIC, PM_LEOCROTTA, PM_LONG_WORM, PM_LONG_WORM_TAIL, PM_MARILITH, PM_NINJA, PM_PIRANHA, PM_PYROLISK, PM_SAMURAI, PM_SCORPION, PM_SHOPKEEPER, PM_STALKER, PM_TOURIST, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WATER_MOCCASIN, PM_WIZARD, PM_XAN, PM_YELLOW_LIGHT, POLYMORPH, POLY_REVERT, POOL, POT_WATER, P_NONE, P_SLING, RING_CLASS, ROCK, SCROLL_CLASS, SCR_AMNESIA, SCR_BLANK_PAPER, SCR_CHARGING, SCR_CONFUSE_MONSTER, SCR_CREATE_MONSTER, SCR_DESTROY_ARMOR, SCR_EARTH, SCR_ENCHANT_ARMOR, SCR_ENCHANT_WEAPON, SCR_FIRE, SCR_FOOD_DETECTION, SCR_GENOCIDE, SCR_GOLD_DETECTION, SCR_IDENTIFY, SCR_LIGHT, SCR_MAGIC_MAPPING, SCR_MAIL, SCR_PUNISHMENT, SCR_REMOVE_CURSE, SCR_SCARE_MONSTER, SCR_STINKING_CLOUD, SCR_TAMING, SCR_TELEPORTATION, SDOOR, SEE_INVIS, SHIELD_OF_REFLECTION, SILVER_DRAGON_SCALES, SILVER_DRAGON_SCALE_MAIL, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_CAUSE_FEAR, SPE_CHARM_MONSTER, SPE_CONFUSE_MONSTER, SPE_CREATE_MONSTER, SPE_DETECT_FOOD, SPE_IDENTIFY, SPE_MAGIC_MAPPING, SPE_NOVEL, SPE_REMOVE_CURSE, STOMACH, STUNNED, S_EEL, S_GHOST, S_HUMAN, S_MIMIC, S_VAMPIRE, S_VORTEX, S_WORM_TAIL, S_altar, S_arrow_trap, S_digbeam, S_goodpos, S_grave, S_invisible, S_ndoor, S_stone, S_trwall, S_vwall, TINNING_KIT, TOOL_CLASS, TRAPNUM, TT_BURIEDBALL, T_SHIRT, UNCHANGING, WAND_CLASS, WAN_CANCELLATION, WAN_COLD, WAN_DEATH, WAN_FIRE, WAN_LIGHTNING, WAN_MAGIC_MISSILE, WAN_NOTHING, WAN_POLYMORPH, WAN_UNDEAD_TURNING, WAN_WISHING, WEAPON_CLASS, WT_IRON_BALL_INCR, YELLOW_DRAGON_SCALES, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { Tobjnam, Yname2, Yobjnam2, actualoname, an, doname, erosion_matters, makeplural, otense, simpleonames, singular, suit_simple_name, vtense, xname } from './objnam.js';
import { livelog_printf, urgent_pline } from './pline.js';
import { body_part, mbodypart, polyself, rehumanize, udeadinside } from './polyself.js';
import { impact_arti_light, make_confused, make_stunned, strange_feeling } from './potion.js';
import { quest_info } from './questpgr.js';
import { create_gas_cloud } from './region.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { outrumor } from './rumors.js';
import { alter_cost, obfree, shk_your } from './shk.js';
import { losespells, study_book } from './spell.js';
import { remove_worn_item } from './steal.js';
import { can_saddle, put_saddle_on_mon } from './steed.js';
import { level_tele, scrolltele } from './teleport.js';
import { burn_away_slime, end_burn } from './timeout.js';
import { sokoban_guilt } from './trap.js';
import { light_hits_gremlin } from './uhitm.js';
import { do_clear_area, unblock_point, vision_recalc } from './vision.js';
import { dmgval, drain_weapon_skill } from './weapon.js';
import { chwepon } from './wield.js';
import { getlin } from './windows.js';
import { setworn, which_armor } from './worn.js';
import { lightdamage, resist } from './zap.js';

/* MAIL_STRUCTURES */
export async function learnscrolltyp(scrolltyp) {
    if (!game.objects[scrolltyp].oc_name_known) {
        await discover_object((scrolltyp), (1), (1), (1));
        await more_experienced(0, 10);
        return (1);
    } else {
        return (0);
    }
}
/* also called from teleport.c for scroll of teleportation */
export async function learnscroll(sobj) {
    if (sobj.oclass != SPBOOK_CLASS) {
        await learnscrolltyp(sobj.otyp);
    }
}
/* max spe is +99, min is -99 */
export function cap_spe(obj) {
    if (obj) {
        if (abs(obj.spe) > 99) {
            obj.spe = sgn(obj.spe) * 99;
        }
    }
}
export function erode_obj_text(otmp, buf) {
    let erosion = ((otmp).oeroded > (otmp).oeroded2 ? (otmp).oeroded : (otmp).oeroded2);
    if (erosion) {
        wipeout_text(buf, (Math.trunc(strlen(buf) * erosion / (2 * 3))), otmp.o_id ^ game.ubirthday);
    }
    return buf;
}
/* note: there is a similarly worded apron (alchemy smock) slogan */
/* Discworld riff; unfortunately long */
/* expanded "rock--paper--scissors" featured in TV show "Big Bang
           Theory" although they didn't create it (and an actual T-shirt
           with pentagonal diagram showing which choices defeat which) */
/* "All men must die -- all men must serve" challenge and response
           from book series _A_Song_of_Ice_and_Fire_ by George R.R. Martin,
           TV show "Game of Thrones" (probably an actual T-shirt too...) */
const __tshirt_text_shirt_msgs = ["I explored the Dungeons of Doom and all I got was this lousy T-shirt!", "Is that Mjollnir in your pocket or are you just happy to see me?", "It's not the size of your sword, it's how #enhance'd you are with it.", "Madame Elvira's House O' Succubi Lifetime Customer", "Madame Elvira's House O' Succubi Employee of the Month", "Ludios Vault Guards Do It In Small, Dark Rooms", "Yendor Military Soldiers Do It In Large Groups", "I survived Yendor Military Boot Camp", "Ludios Accounting School Intra-Mural Lacrosse Team", "Oracle(TM) Fountains 10th Annual Wet T-Shirt Contest", "Hey, black dragon!  Disintegrate THIS!", "I'm With Stupid -->", "Don't blame me, I voted for Izchak!", "Don't Panic", "Furinkan High School Athletic Dept.", "Hel-LOOO, Nurse!", "=^.^=", "100% goblin hair - do not wash", "Aberzombie and Fitch", "cK -- Cockatrice touches the Kop", "Don't ask me, I only adventure here", "Down with pants!", "d, your dog or a killer?", "FREE PUG AND NEWT!", "Go team ant!", "Got newt?", "Hello, my darlings!", "Hey!  Nymphs!  Steal This T-Shirt!", "I <3 Dungeon of Doom", "I <3 Maud", "I am a Valkyrie.  If you see me running, try to keep up.", "I am not a pack rat - I am a collector", "I bounced off a rubber tree", "Plunder Island Brimstone Beach Club", "If you can read this, I can hit you with my polearm", "I'm confused!", "I scored with the princess", "I want to live forever or die in the attempt.", "Lichen Park", "LOST IN THOUGHT - please send search party", "Meat is Mordor", "Minetown Better Business Bureau", "Minetown Watch", ("Ms. Palm's House of Negotiable Affection--A Very Reputable House Of Disrepute"), "Protection Racketeer", "Real men love Crom", "Somebody stole my Mojo!", "The Hellhound Gang", "The Werewolves", "They Might Be Storm Giants", "Weapons don't kill people, I kill people", "White Zombie", "You're killing me!", "Anhur State University - Home of the Fighting Fire Ants!", "FREE HUGS", "Serial Ascender", "Real men are valkyries", "Young Men's Cavedigging Association", "Occupy Fort Ludios", "I couldn't afford this T-shirt so I stole it!", "Mind flayers suck", "I'm not wearing any pants", "Down with the living!", "Pudding farmer", "Vegetarian", "Hello, I'm War!", "It is better to light a candle than to curse the darkness", "It is easier to curse the darkness than to light a candle", "rock--paper--scissors--lizard--Spock!", "/Valar morghulis/ -- /Valar dohaeris/"];
export function tshirt_text(tshirt, buf) {
    buf = strcpy(buf, __tshirt_text_shirt_msgs[tshirt.o_id % (Math.trunc(70 /* sizeof(const char *const [70]) */ / 1 /* sizeof(const char *const) */))]);
    return erode_obj_text(tshirt, buf);
}
/* could be a bird or a flower */
const __hawaiian_motif_hawaiian_motifs = ["flamingo", "parrot", "toucan", "bird of paradise", "sea turtle", "tropical fish", "jellyfish", "giant eel", "water nymph", "plumeria", "orchid", "hibiscus flower", "palm tree", "hula dancer", "sailboat", "ukulele"];
export function hawaiian_motif(shirt, buf) {
    /* a tourist's starting shirt always has the same o_id; we need some
       additional randomness or else its design will never differ */
    let motif = shirt.o_id ^ game.ubirthday;
    buf = strcpy(buf, __hawaiian_motif_hawaiian_motifs[motif % (Math.trunc(16 /* sizeof(const char *const [16]) */ / 1 /* sizeof(const char *const) */))]);
    return buf;
}
const __hawaiian_design_hawaiian_bgs = ["purple", "yellow", "red", "blue", "orange", "black", "green", "abstract", "geometric", "patterned", "naturalistic"];
export async function hawaiian_design(shirt, buf) {
    /* This hash method is slightly different than the one in hawaiian_motif;
       using the same formula in both cases may lead to some shirt combos
       never appearing, if the sizes of the two lists have common factors. */
    let bg = shirt.o_id ^ ~game.ubirthday;
    buf = sprintf(buf, "%s on %s background", await makeplural(hawaiian_motif(shirt, buf)), await an(__hawaiian_design_hawaiian_bgs[bg % (Math.trunc(11 /* sizeof(const char *const [11]) */ / 1 /* sizeof(const char *const) */))]));
    return buf;
}
/* In the movie "The Sum of All Fears", a Russian worker in a weapons
           facility wears a T-shirt that a translator says reads, "I am a
           bomb technician, if you see me running ... try to catch up."
           In nethack, the quote is far more suitable to an alchemy smock
           (particularly since so many of these others are about cooking)
           than a T-shirt and is paraphrased to simplify/shorten it.
           [later... turns out that this is already a T-shirt message:
            "I am a Valkyrie.  If you see me running, try to keep up."
           so this one has been revised a little:  added alchemist prefix,
           changed "keep up" to original source's "catch up"] */
const __apron_text_apron_msgs = ["Kiss the cook", "I'm making SCIENCE!", "Don't mess with the chef", "Don't make me poison you", "Gehennom's Kitchen", "Rat: The other white meat", "If you can't stand the heat, get out of Gehennom!", "If we weren't meant to eat animals, why are they made out of meat?", "If you don't like the food, I'll stab you", "I am an alchemist; if you see me running, try to catch up..."];
export function apron_text(apron, buf) {
    buf = strcpy(buf, __apron_text_apron_msgs[apron.o_id % (Math.trunc(10 /* sizeof(const char *const [10]) */ / 1 /* sizeof(const char *const) */))]);
    return erode_obj_text(apron, buf);
}
const candy_wrappers = ["", "Apollo", "Moon Crunchy", "Snacky Cake", "Chocolate Nuggie", "The Small Bar", "Crispy Yum Yum", "Nilla Crunchie", "Berry Bar", "Choco Nummer", "Om-nom", "Fruity Oaty", "Wonka Bar"];
/* (none -- should never happen) */
/* Lost */
/* South Park */
/* Cat Macro */
/* Serenity */
/* Charlie and the Chocolate Factory */
/* return the text of a candy bar's wrapper */
export function candy_wrapper_text(obj) {
    /* modulo operation is just bullet proofing; 'spe' is already in range */
    return candy_wrappers[obj.spe % (Math.trunc(13 /* sizeof(const char *const [13]) */ / 1 /* sizeof(const char *const) */))];
}
/* assign a wrapper to a candy bar stack */
export function assign_candy_wrapper(obj) {
    if (obj.otyp == CANDY_BAR) {
        obj.spe = 1 + rn2((Math.trunc(13 /* sizeof(const char *const [13]) */ / 1 /* sizeof(const char *const) */)) - 1);
    }
    return;
}
/* getobj callback for object to read */
export function read_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.oclass == SCROLL_CLASS || obj.oclass == SPBOOK_CLASS) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_DOWNPLAY;
}
/* the #read command; read a scroll or spell book or various other things */
const __doread_find_any_braille = "feel any Braille writing.";
const __doread_card_msgs = ["Leprechaun Gold Tru$t - Shamrock Card", "Magic Memory Vault Charge Card", "Larn National Bank", "First Bank of Omega", "Bank of Zork - Frobozz Magic Card", "Ankh-Morpork Merchant's Guild Barter Card", "Ankh-Morpork Thieves' Guild Unlimited Transaction Card", "Ransmannsby Moneylenders Association", "Bank of Gehennom - 99% Interest Card", "Yendorian Express - Copper Card", "Yendorian Express - Silver Card", "Yendorian Express - Gold Card", "Yendorian Express - Mithril Card", "Yendorian Express - Platinum Card"];
const __doread_red_mons = [PM_FIRE_ANT, PM_PYROLISK, PM_HELL_HOUND, PM_IMP, PM_LARGE_MIMIC, PM_LEOCROTTA, PM_SCORPION, PM_XAN, PM_GIANT_BAT, PM_WATER_MOCCASIN, PM_FLESH_GOLEM, PM_BARBED_DEVIL, PM_MARILITH, PM_PIRANHA];
export async function doread() {
    let scroll = null;
    let confused = 0;
    let nodisappear = 0;
    let otyp = 0;
    /*
     * Reading while blind is allowed in most cases, including the
     * Book of the Dead but not regular spellbooks.  For scrolls, the
     * description has to have been seen or magically learned (so only
     * when scroll->dknown is true):  hero recites the label while
     * holding the unfurled scroll.  We deliberately don't require
     * free hands because that would cripple scroll of remove curse,
     * but we ought to be requiring hands or at least limbs.  The
     * recitation could be sub-vocal; actual speech isn't required.
     *
     * Reading while confused is allowed and can produce alternate
     * outcome.
     *
     * Reading while stunned is currently allowed but probably should
     * be prevented....
     */
    game.known = (0);
    if (await check_capacity(null)) {
        return 0;
    }
    scroll = await getobj("read", read_ok, 2);
    if (!scroll) {
        return 2;
    }
    otyp = scroll.otyp;
    /* no longer 'just picked up' */
    scroll.pickup_prev = 0;
    if (otyp == FORTUNE_COOKIE) {
        if (game.flags.verbose) {
            await You("break up the cookie and throw away the pieces.");
        }
        await outrumor(bcsign(scroll), 1);
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            if (!game.u.uconduct.literate++) {
                livelog_printf(32, "became literate by reading a fortune cookie");
            }
        }
        await useup(scroll);
        return 1;
    } else if (otyp == T_SHIRT || otyp == ALCHEMY_SMOCK || otyp == HAWAIIAN_SHIRT) {
        let buf = '';
        let mesg = null;
        let endpunct = null;
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await You_cant(__doread_find_any_braille);
            return 0;
        }
        if ((otyp == T_SHIRT || otyp == HAWAIIAN_SHIRT) && game.uarm && scroll == game.uarmu) {
            await pline("%s shirt is obscured by %s%s.", scroll.unpaid ? "That" : "Your", await shk_your(buf, game.uarm), suit_simple_name(game.uarm));
            return 0;
        }
        if (otyp == HAWAIIAN_SHIRT) {
            await pline("%s features %s.", game.flags.verbose ? "The design" : "It", await hawaiian_design(scroll, buf));
            return 1;
        }
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by reading %s", (scroll.otyp == T_SHIRT) ? "a T-shirt" : "an apron");
        }
        mesg = (otyp == T_SHIRT) ? tshirt_text(scroll, buf) : apron_text(scroll, buf);
        endpunct = "";
        if (game.flags.verbose) {
            let ln = strlen(mesg);
            /* we will be displaying a sentence; need ending punctuation */
            if (ln > 0 && !strchr(".!?", __nh_char_at0(__nh_advance_str(mesg, ln - 1)))) {
                endpunct = ".";
            }
            await pline("It reads:");
        }
        await pline("\"%s\"%s", mesg, endpunct);
        return 1;
    } else if ((otyp == DUNCE_CAP || otyp == CORNUTHAUM) && (game.urole.mnum == (PM_TOURIST))) {
        /* note: "DUNCE" isn't directly connected to tourists but
           if everyone could read it, they would always be able to
           trivially distinguish between the two types of conical hat;
           limiting this to tourists is better than rejecting it */
        /* another note: the misspelling, "wizzard", is correct;
           that's what is written on Rincewind's pointy hat from
           Pratchett's Discworld series, along with a lot of stars;
           rather than inked on or painted on, treat them as stitched
           or even separate pieces of fabric which have been attached
           (don't recall whether the books mention anything like that...) */
        let cap_text = (otyp == DUNCE_CAP) ? "DUNCE" : "WIZZARD";
        if (scroll.o_id % 3) {
            await You_cant("find anything to read on this %s.", await simpleonames(scroll));
            return 0;
        }
        await pline("%s on the %s.  It reads:  %s.", !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "There is writing" : "You feel lettering", await simpleonames(scroll), cap_text);
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by reading %s", (otyp == DUNCE_CAP) ? "a dunce cap" : "a cornuthaum");
        }
        await trycall(scroll);
        return 1;
    } else if (otyp == CREDIT_CARD) {
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await You("feel the embossed numbers:");
        } else {
            if (game.flags.verbose) {
                await pline("It reads:");
            }
            await pline("\"%s\"", scroll.oartifact ? __doread_card_msgs[(Math.trunc(14 /* sizeof(const char *const [14]) */ / 1 /* sizeof(const char *const) */)) - 1] : __doread_card_msgs[scroll.o_id % ((Math.trunc(14 /* sizeof(const char *const [14]) */ / 1 /* sizeof(const char *const) */)) - 1)]);
        }
        await pline("\"%d0%d %ld%d1 0%d%d0\"%s", ((scroll.o_id % 89) + 10), (scroll.o_id % 4), (((scroll.o_id * 499) % 899999) + 100000), (scroll.o_id % 10), (!(scroll.o_id % 3)), ((scroll.o_id * 7) % 10), (game.flags.verbose || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? "." : "");
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by reading a credit card");
        }
        return 1;
    } else if (otyp == CAN_OF_GREASE) {
        await pline("This %s has no label.", await singular(scroll, xname));
        return 0;
    } else if (otyp == MAGIC_MARKER) {
        let buf = '';
        let pm = game.mons[__doread_red_mons[scroll.o_id % (Math.trunc(56 /* sizeof(const int [14]) */ / 4 /* sizeof(const int) */))]];
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await You_cant(__doread_find_any_braille);
            return 0;
        }
        if (game.flags.verbose) {
            await pline("It reads:");
        }
        buf = sprintf(buf, "%s", pmname(pm, NEUTRAL));
        await pline("\"Magic Marker(TM) %s Red Ink Marker Pen.  Water Soluble.\"", upwords(buf));
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by reading a magic marker");
        }
        return 1;
    } else if (scroll.oclass == COIN_CLASS) {
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await You("feel the embossed words:");
        } else if (game.flags.verbose) {
            await You("read:");
        }
        await pline("\"1 Zorkmid.  857 GUE.  In Frobs We Trust.\"");
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by reading a coin's engravings");
        }
        return 1;
    } else if (is_art(scroll, ART_ORB_OF_FATE)) {
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await You("feel the engraved signature:");
        } else {
            await pline("It is signed:");
        }
        await pline("\"Odin.\"");
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by reading the divine signature of Odin");
        }
        return 1;
    } else if (otyp == CANDY_BAR) {
        let wrapper = candy_wrapper_text(scroll);
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await You_cant(__doread_find_any_braille);
            return 0;
        }
        if (!__nh_char_at0(wrapper)) {
            await pline("The candy bar's wrapper is blank.");
            return 0;
        }
        await pline("The wrapper reads: \"%s\".", wrapper);
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by reading a candy bar wrapper");
        }
        return 1;
    } else if (scroll.oclass != SCROLL_CLASS && scroll.oclass != SPBOOK_CLASS) {
        await pline(c_common_strings.c_silly_thing_to, "read");
        return 0;
    } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && otyp != SPE_BOOK_OF_THE_DEAD) {
        let what = null;
        if (otyp == SPE_NOVEL) {
            what = "words";
        } else if (scroll.oclass == SPBOOK_CLASS) {
            what = "mystic runes";
        } else if (!scroll.dknown) {
            what = "formula on the scroll";
        }
        if (what) {
            await pline("Being blind, you cannot read the %s.", what);
            return 0;
        }
    }
    confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    if (otyp == SCR_MAIL) {
        confused = (0);
        if (!game.u.uconduct.literate) {
            if (!scroll.spe && await yn_function("Reading mail will violate \"illiterate\" conduct.  Read anyway?", ynchars, 110, (1)) != 121) {
                return 0;
            }
        }
    }
    /* Actions required to win the game aren't counted towards conduct */
    /* Novel conduct is handled in read_tribute so exclude it too */
    if (otyp != SPE_BOOK_OF_THE_DEAD && otyp != SPE_NOVEL && otyp != SPE_BLANK_PAPER && otyp != SCR_BLANK_PAPER) {
        if (!game.u.uconduct.literate++) {
            livelog_printf(32, "became literate by reading %s", (scroll.oclass == SPBOOK_CLASS) ? "a book" : (scroll.oclass == SCROLL_CLASS) ? "a scroll" : c_common_strings.c_something);
        }
    }
    if (scroll.oclass == SPBOOK_CLASS) {
        return await study_book(scroll) ? 1 : 0;
    }
    /* scroll, not spellbook, now being read */
    scroll.in_use = (1);
    if (otyp != SCR_BLANK_PAPER) {
        let silently = !can_chant(game.youmonst);
        /* a few scroll feedback messages describe something happening
           to the scroll itself, so avoid "it disappears" for those */
        nodisappear = (otyp == SCR_FIRE || (otyp == SCR_REMOVE_CURSE && scroll.cursed));
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await pline(nodisappear ? "You %s the formula on the scroll." : "As you %s the formula on it, the scroll disappears.", silently ? "cogitate" : "pronounce");
        } else {
            await pline(nodisappear ? "You read the scroll." : "As you read the scroll, it disappears.");
        }
        if (confused) {
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                await pline("Being so trippy, you screw up...");
            } else {
                await pline("Being confused, you %s the magic words...", silently ? "misunderstand" : "mispronounce");
            }
        }
    }
    if (!await seffects(scroll)) {
        if (!game.objects[otyp].oc_name_known) {
            if (game.known) {
                await learnscroll(scroll);
            } else {
                await trycall(scroll);
            }
        }
        scroll.in_use = (0);
        if (otyp != SCR_BLANK_PAPER) {
            await useup(scroll);
        }
    }
    return 1;
}
export async function stripspe(obj) {
    if (obj.blessed || obj.spe <= 0) {
        await pline("%s", c_common_strings.c_nothing_happens);
    } else {
        await pline("%s briefly.", await Yobjnam2(obj, "vibrate"));
        await costly_alteration(obj, COST_UNCHRG);
        obj.spe = 0;
        if (obj.otyp == OIL_LAMP || obj.otyp == BRASS_LANTERN) {
            obj.age = 0;
        }
    }
}
export async function p_glow1(otmp) {
    await pline("%s briefly.", await Yobjnam2(otmp, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "vibrate" : "glow"));
}
export async function p_glow2(otmp, color) {
    await pline("%s%s%s for a moment.", await Yobjnam2(otmp, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "vibrate" : "glow"), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : " ", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : hcolor(color));
}
export async function p_glow3(otmp, color) {
    await pline("%s feebly%s%s for a moment.", await Yobjnam2(otmp, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "vibrate" : "glow"), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : " ", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : hcolor(color));
}
/* getobj callback for object to charge */
export function charge_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.oclass == WAND_CLASS) {
        return GETOBJ_SUGGEST;
    }
    if (obj.oclass == RING_CLASS && game.objects[obj.otyp].oc_charged && obj.dknown && game.objects[obj.otyp].oc_name_known) {
        return GETOBJ_SUGGEST;
    }
    /* specific check before general tools */
    if (((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE)) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.oclass == TOOL_CLASS) {
        if (obj.otyp == BRASS_LANTERN || (obj.otyp == OIL_LAMP) || (obj.otyp == MAGIC_LAMP && !game.objects[MAGIC_LAMP].oc_name_known)) {
            /* suggest tools that aren't oc_charged but can still be recharged */
            /* only list magic lamps if they are not identified yet */
            return GETOBJ_SUGGEST;
        }
        if (game.objects[obj.otyp].oc_charged) {
            /* suggest chargeable tools only if discovered, to prevent leaking
           info (e.g. revealing if an unidentified 'flute' is magic or not) */
            return (obj.dknown && game.objects[obj.otyp].oc_name_known) ? GETOBJ_SUGGEST : GETOBJ_DOWNPLAY;
        }
        return GETOBJ_EXCLUDE;
    }
    /* why are weapons/armor considered charged anyway?
     * make them selectable even so for "feeling of loss" message */
    return GETOBJ_EXCLUDE_SELECTABLE;
}
/* recharge an object; curse_bless is -1 if the recharging implement
   was cursed, +1 if blessed, 0 otherwise. */
export async function recharge(obj, curse_bless) {
    let n = 0;
    let is_cursed = 0;
    let is_blessed = 0;
    is_cursed = curse_bless < 0;
    is_blessed = curse_bless > 0;
    if (obj.oclass == WAND_CLASS) {
        let lim = (obj.otyp == WAN_WISHING) ? 1 : (game.objects[obj.otyp].oc_dir != 1) ? 8 : 15;
        /* undo any prior cancellation, even when is_cursed */
        if (obj.spe == -1) {
            obj.spe = 0;
        }
        /*
         * Recharging might cause wands to explode.
         *      v = number of previous recharges
         *            v = percentage chance to explode on this attempt
         *                    v = cumulative odds for exploding
         *      0 :   0       0
         *      1 :   0.29    0.29
         *      2 :   2.33    2.62
         *      3 :   7.87   10.28
         *      4 :  18.66   27.02
         *      5 :  36.44   53.62
         *      6 :  62.97   82.83
         *      7 : 100     100
         */
        n = obj.recharged;
        if (n > 0 && (obj.otyp == WAN_WISHING || (n * n * n > rn2(7 * 7 * 7)))) {
            await wand_explode(obj, rnd(lim));
            return;
        }
        /* didn't explode, so increment the recharge count */
        obj.recharged = (n + 1);
        if (is_cursed) {
            await stripspe(obj);
        } else {
            n = (lim == 1) ? 1 : (rn2(5) + (lim + 1 - 5));
            if (!is_blessed) {
                n = rnd(n);
            }
            if (obj.spe < n) {
                obj.spe = n;
            } else {
                obj.spe++;
            }
            if (obj.otyp == WAN_WISHING && obj.spe > 3) {
                await wand_explode(obj, 1);
                return;
            }
            if (lim == 1) {
                await p_glow3(obj, c_color_names.c_blue);
            } else if (obj.spe >= lim) {
                await p_glow2(obj, c_color_names.c_blue);
            } else {
                await p_glow1(obj);
            }
        }
    } else if (obj.oclass == RING_CLASS && game.objects[obj.otyp].oc_charged) {
        /* charging does not affect ring's curse/bless status */
        let s = is_blessed ? rnd(3) : is_cursed ? -rnd(2) : 1;
        let is_on = (obj == game.uleft || obj == game.uright);
        if (obj.spe > rn2(7) || obj.spe <= -5) {
            await pline("%s momentarily, then %s!", await Yobjnam2(obj, "pulsate"), await otense(obj, "explode"));
            if (is_on) {
                await Ring_gone(obj);
            }
            s = rnd(3 * abs(obj.spe));
            await useup(obj) , obj = null;
            await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((s) + 1) / 2)) : (s)), "exploding ring", 0);
        } else {
            let mask = is_on ? (obj == game.uleft ? 131072 : 262144) : 0;
            await pline("%s spins %sclockwise for a moment.", await Yname2(obj), s < 0 ? "counter" : "");
            if (s < 0) {
                await costly_alteration(obj, COST_DECHNT);
            }
            if (is_on) {
                await Ring_off(obj);
            }
            /* update the ring while it's off */
            obj.spe += s;
            if (is_on) {
                await setworn(obj, mask) , await Ring_on(obj);
            }
            if (s > 0 && obj.unpaid) {
                await alter_cost(obj, 0);
            }
        }
    } else if (obj.oclass == TOOL_CLASS) {
        let rechrg = obj.recharged;
        if (game.objects[obj.otyp].oc_charged) {
            /* tools don't have a limit, but the counter used does */
            if (rechrg < 7) {
                obj.recharged++;
            }
        }
        switch (obj.otyp) {
            case BELL_OF_OPENING:
                if (is_cursed) {
                    await stripspe(obj);
                } else if (is_blessed) {
                    obj.spe += rnd(3);
                } else {
                    obj.spe += 1;
                }
                if (obj.spe > 5) {
                    obj.spe = 5;
                }
                /* unreachable since with MAIL undefined, sobj->spe won't be 0;
           as a precaution, be prepared to give arbitrary feedback;
           caller has already reported that it disappears upon reading */
                break;
            case MAGIC_MARKER:
            case TINNING_KIT:
            case EXPENSIVE_CAMERA:
                if (is_cursed) {
                    await stripspe(obj);
                } else if (rechrg && obj.otyp == MAGIC_MARKER) {
                    /* override increment done above */
                    obj.recharged = 1;
                    if (obj.spe < 3) {
                        await Your("marker seems permanently dried out.");
                    } else {
                        await pline("%s", c_common_strings.c_nothing_happens);
                    }
                } else if (is_blessed) {
                    n = (rn2(16) + (15));
                    if (obj.spe + n <= 50) {
                        obj.spe = 50;
                    } else if (obj.spe + n <= 75) {
                        obj.spe = 75;
                    } else {
                        let chrg = obj.spe;
                        if ((chrg + n) > 127) {
                            obj.spe = 127;
                        } else {
                            obj.spe += n;
                        }
                    }
                    await p_glow2(obj, c_color_names.c_blue);
                } else {
                    n = (rn2(11) + (10));
                    if (obj.spe + n <= 50) {
                        obj.spe = 50;
                    } else {
                        let chrg = obj.spe;
                        if (chrg + n > 99) {
                            obj.spe = 99;
                        } else {
                            obj.spe += n;
                        }
                    }
                    await p_glow2(obj, c_color_names.c_white);
                }
                break;
            case OIL_LAMP:
            case BRASS_LANTERN:
                if (is_cursed) {
                    await stripspe(obj);
                    if (obj.lamplit) {
                        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                            await pline("%s out!", await Tobjnam(obj, "go"));
                        }
                        await end_burn(obj, (1));
                    }
                } else if (is_blessed) {
                    obj.spe = 1;
                    obj.age = 1500;
                    await p_glow2(obj, c_color_names.c_blue);
                } else {
                    obj.spe = 1;
                    obj.age += 750;
                    if (obj.age > 1500) {
                        obj.age = 1500;
                    }
                    await p_glow1(obj);
                }
                break;
            case CRYSTAL_BALL:
                if (obj.spe == -1) {
                    obj.spe = 0;
                }
                if (is_cursed) {
                    if (!obj.cursed) {
                        await p_glow2(obj, c_color_names.c_black);
                        await curse(obj);
                    } else {
                        await pline("%s briefly.", await Yobjnam2(obj, "vibrate"));
                    }
                    if (obj.spe > 0) {
                        await costly_alteration(obj, COST_UNCHRG);
                    }
                    obj.spe = 0;
                } else if (is_blessed) {
                    /* blessed scroll sets charges to max and blesses ball */
                    obj.spe = 7;
                    await p_glow2(obj, !obj.blessed ? c_color_names.c_light_blue : c_color_names.c_blue);
                    if (!obj.blessed) {
                        await bless(obj);
                    }
                } else {
                    if (obj.spe < 7 || obj.cursed) {
                        /* uncursed scroll increments charges and uncurses ball */
                        n = rnd(2);
                        obj.spe = ((obj.spe + n) < (7) ? (obj.spe + n) : (7));
                        if (!obj.cursed) {
                            await p_glow1(obj);
                        } else {
                            await p_glow2(obj, c_color_names.c_amber);
                            await uncurse(obj);
                        }
                    } else {
                        await pline("%s", c_common_strings.c_nothing_happens);
                    }
                }
                break;
            case HORN_OF_PLENTY:
            case BAG_OF_TRICKS:
            case CAN_OF_GREASE:
                if (is_cursed) {
                    await stripspe(obj);
                } else if (is_blessed) {
                    if (obj.spe <= 10) {
                        obj.spe += (rn2(10) + (6));
                    } else {
                        obj.spe += (rn2(5) + (6));
                    }
                    if (obj.spe > 50) {
                        obj.spe = 50;
                    }
                    await p_glow2(obj, c_color_names.c_blue);
                } else {
                    obj.spe += (rn2(5) + (2));
                    if (obj.spe > 50) {
                        obj.spe = 50;
                    }
                    await p_glow1(obj);
                }
                break;
            case MAGIC_FLUTE:
            case MAGIC_HARP:
            case FROST_HORN:
            case FIRE_HORN:
            case DRUM_OF_EARTHQUAKE:
                if (is_cursed) {
                    await stripspe(obj);
                } else if (is_blessed) {
                    obj.spe += d(2, 4);
                    if (obj.spe > 20) {
                        obj.spe = 20;
                    }
                    await p_glow2(obj, c_color_names.c_blue);
                } else {
                    obj.spe += rnd(4);
                    if (obj.spe > 20) {
                        obj.spe = 20;
                    }
                    await p_glow1(obj);
                }
                break;
            default:
                await You("have a feeling of loss.");
                /* prevent enchantment from getting out of range */
                cap_spe(obj);
                return;
        }
    } else {
        not_chargable: {
        }
        await You("have a feeling of loss.");
    }
    cap_spe(obj);
}
/*
 * Forget some things (e.g. after reading a scroll of amnesia).  When called,
 * the following are always forgotten:
 *      - felt ball & chain
 *      - skill training
 *
 * Other things are subject to flags:
 *      howmuch & ALL_SPELLS    = forget all spells
 */
export async function forget(howmuch) {
    let mtmp = null;
    if ((game.uball != null)) {
        game.u.bc_felt = 0;
    }
    if (howmuch & 2) {
        await losespells();
    }
    await drain_weapon_skill(rnd(howmuch ? 5 : 3));
    /* forget having seen monsts (affects recognizing unseen ones by sound) */
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (mtmp != game.u.usteed && mtmp != game.u.ustuck) {
            mtmp.meverseen = 0;
        }
    }
    /* [perhaps ought to forget having seen every monster on every level] */
    for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
        mtmp.meverseen = 0;
    }
}
/* monster is hit by scroll of taming's effect */
export async function maybe_tame(mtmp, sobj) {
    let was_tame = mtmp.mtame;
    let was_peaceful = mtmp.mpeaceful;
    if (sobj.cursed) {
        await setmangry(mtmp, (0));
        if (was_peaceful && !mtmp.mpeaceful) {
            return -1;
        }
    } else {
        if (!await resist(mtmp, sobj.oclass, 0, 0) || mtmp.isshk) {
            await tamedog(mtmp, sobj, (0));
        }
        if ((!was_peaceful && mtmp.mpeaceful) || was_tame != mtmp.mtame) {
            return 1;
        }
    }
    return 0;
}
/* Can a stinking cloud physically exist at a certain position?
 * NOT the same thing as can_center_cloud.
 */
export function valid_cloud_pos(x, y) {
    if (!isok(x, y)) {
        return (0);
    }
    return ((game.level.locations[x][y].typ) >= DOOR) || is_pool(x, y) || is_lava(x, y);
}
/* Callback for getpos_sethilite, also used in determining whether a scroll
 * should have its regular effects, or not because it was out of range.
 */
export function can_center_cloud(x, y) {
    if (!valid_cloud_pos(x, y)) {
        return (0);
    }
    return (((game.viz_array[y][x] & 2) != 0) && dist2((x), (y), game.u.ux, game.u.uy) < 32);
}
export async function display_stinking_cloud_positions(on_off) {
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    let dist = 6;
    if (on_off) {
        await tmp_at((-1), (((S_goodpos) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_goodpos) <= S_trwall) ? ((S_goodpos) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_goodpos) < S_altar) ? (((S_goodpos) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_goodpos) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_goodpos) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_goodpos) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_goodpos) <= S_goodpos) ? (((S_goodpos) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        for (dx = -dist; dx <= dist; dx++) {
            for (dy = -dist; dy <= dist; dy++) {
                x = game.u.ux + dx;
                y = game.u.uy + dy;
                /* hero's location is allowed but highlighting the hero's
                   spot makes map harder to read (if using '$' rather than
                   by changing background color) */
                if (((x) == game.u.ux && (y) == game.u.uy)) {
                    /* don't count this iteration as one of the tries */
                    continue;
                }
                if (can_center_cloud(x, y)) {
                    await tmp_at(x, y);
                }
            }
        }
    } else {
        await tmp_at((-7), 0);
    }
}
export async function seffect_enchant_armor(sobjp) {
    let sobj = sobjp.value;
    let s = 0;
    let special_armor = 0;
    let same_color = 0;
    let otmp = await some_armor(game.youmonst);
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let old_erodeproof = 0;
    let new_erodeproof = 0;
    if (!otmp) {
        await strange_feeling(sobj, !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "Your skin glows then fades." : "Your skin feels warm for a moment.");
        /* useup() in strange_feeling() */
        sobjp.value = null;
        await exercise(A_CON, !scursed);
        await exercise(A_STR, !scursed);
        return;
    }
    if (confused) {
        old_erodeproof = (otmp.oerodeproof != 0);
        new_erodeproof = !scursed;
        otmp.oerodeproof = 0;
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            otmp.rknown = (0);
            await pline("%s warm for a moment.", await Yobjnam2(otmp, "feel"));
        } else {
            otmp.rknown = (1);
            await pline("%s covered by a %s %s %s!", await Yobjnam2(otmp, "are"), scursed ? "mottled" : "shimmering", hcolor(scursed ? c_color_names.c_black : c_color_names.c_golden), scursed ? "glow" : ((otmp.oclass == ARMOR_CLASS && game.objects[otmp.otyp].oc_subtyp == ARM_SHIELD) ? "layer" : "shield"));
        }
        if (new_erodeproof && (otmp.oeroded || otmp.oeroded2)) {
            otmp.oeroded = otmp.oeroded2 = 0;
            await pline("%s as good as new!", await Yobjnam2(otmp, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "look"));
        }
        if (old_erodeproof && !new_erodeproof) {
            /* restore old_erodeproof before shop charges */
            otmp.oerodeproof = 1;
            await costly_alteration(otmp, COST_DEGRD);
        }
        otmp.oerodeproof = new_erodeproof ? 1 : 0;
        return;
    }
    /* elven armor vibrates warningly when enchanted beyond a limit */
    special_armor = ((otmp).otyp == ELVEN_LEATHER_HELM || (otmp).otyp == ELVEN_MITHRIL_COAT || (otmp).otyp == ELVEN_CLOAK || (otmp).otyp == ELVEN_SHIELD || (otmp).otyp == ELVEN_BOOTS) || ((game.urole.mnum == (PM_WIZARD)) && otmp.otyp == CORNUTHAUM);
    if (scursed) {
        same_color = (otmp.otyp == BLACK_DRAGON_SCALE_MAIL || otmp.otyp == BLACK_DRAGON_SCALES);
    } else {
        same_color = (otmp.otyp == SILVER_DRAGON_SCALE_MAIL || otmp.otyp == SILVER_DRAGON_SCALES || otmp.otyp == SHIELD_OF_REFLECTION);
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        same_color = (0);
    }
    s = scursed ? -otmp.spe : otmp.spe;
    if (s > (special_armor ? 5 : 3) && rn2(s)) {
        otmp.in_use = (1);
        await pline("%s violently %s%s%s for a while, then %s.", await Yname2(otmp), await otense(otmp, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "vibrate" : "glow"), (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !same_color) ? " " : "", (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || same_color) ? "" : hcolor(scursed ? c_color_names.c_black : c_color_names.c_silver), await otense(otmp, "evaporate"));
        await remove_worn_item(otmp, (0));
        await useup(otmp);
        return;
    }
    if (s < -100) {
        s = -100;
    }
    /* avoid integer overflow with very negative armor */
    /* Base power of the enchantment:

       2 for -1 to +0 armor;
       1 for +1 to +2 armor;
       0 for +3 to +4 armor, etc.

       When disenchanting, everything is done with reversed signs. */
    s = Math.trunc((4 - s) / 2);
    /* Elven/artifact and nonmagical armor is easier to enchant;
       blessed scrolls are more effective. */
    if (special_armor) {
        ++s;
    }
    if (!game.objects[otmp.otyp].oc_magic) {
        ++s;
    }
    if (sblessed) {
        ++s;
    }
    if (s <= 0) {
        s = 0;
        if (otmp.spe > 0 && !rn2(otmp.spe)) {
            s = 1;
        }
    } else {
        s = rnd(s);
    }
    if (s > 11) {
        s = 11;
    }
    /* unlikely but possible: avoids an overflow later */
    if (scursed) {
        s = -s;
    }
    if (s >= 0 && ((otmp).otyp >= GRAY_DRAGON_SCALES && (otmp).otyp <= YELLOW_DRAGON_SCALES)) {
        let was_lit = otmp.lamplit;
        let old_light = artifact_light(otmp) ? arti_light_radius(otmp) : 0;
        await pline("%s merges and hardens!", await Yname2(otmp));
        await setworn(null, 1);
        otmp.otyp += GRAY_DRAGON_SCALE_MAIL - GRAY_DRAGON_SCALES;
        /* don't want bless() or uncurse() to adjust
                            * light radius because scales -> scale_mail will
                            * result in a second increase with own message */
        otmp.lamplit = 0;
        if (sblessed) {
            otmp.spe++;
            /* make sure that it doesn't exceed SPE_LIM */
            cap_spe(otmp);
            if (!otmp.blessed) {
                await bless(otmp);
            }
        } else if (otmp.cursed) {
            await uncurse(otmp);
        }
        otmp.known = 1;
        await setworn(otmp, 1);
        if (otmp.unpaid) {
            await alter_cost(otmp, 0);
        }
        otmp.lamplit = was_lit;
        if (old_light) {
            await maybe_adjust_light(otmp, old_light);
        }
        return;
    }
    await pline("%s %s%s%s%s for a %s.", await Yname2(otmp), (s == 0) ? "violently " : "", await otense(otmp, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "vibrate" : "glow"), (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !same_color) ? " " : "", (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || same_color) ? "" : hcolor(scursed ? c_color_names.c_black : c_color_names.c_silver), (s * s > 1) ? "while" : "moment");
    if (s < 0) {
        await costly_alteration(otmp, COST_DECHNT);
    }
    if (scursed && !otmp.cursed) {
        await curse(otmp);
    } else if (sblessed && !otmp.blessed) {
        await bless(otmp);
    } else if (!scursed && otmp.cursed) {
        await uncurse(otmp);
    }
    if (s) {
        let oldspe = otmp.spe;
        /* despite being schar, it shouldn't be possible for spe to wrap
           here because it has been capped at 99 and s is quite small;
           however, might need to change s if it takes spe past 99 */
        otmp.spe += s;
        cap_spe(otmp);
        /* cap_spe() might have throttled 's' */
        s = otmp.spe - oldspe;
        if (s) {
            await adj_abon(otmp, s);
        }
        /* adjust armor bonus for Dex or Int+Wis */
        game.known = otmp.known;
        if (s > 0 && otmp.unpaid) {
            await alter_cost(otmp, 0);
        }
    }
    if ((otmp.spe > (special_armor ? 5 : 3)) && (special_armor || !rn2(7))) {
        await pline("%s %s.", await Yobjnam2(otmp, "suddenly vibrate"), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "again" : "unexpectedly");
    }
}
/* destroy a random cursed armor worn by hero */
export async function disintegrate_cursed_armor() {
    let armors = [null, null, null, null, null, null, null, null, null, null];
    let idx = 0;
    armors[0] = null;
    if (game.uarm && game.uarm.cursed) {
        armors[idx++] = game.uarm;
    }
    if (game.uarmc && game.uarmc.cursed) {
        armors[idx++] = game.uarmc;
    }
    if (game.uarmh && game.uarmh.cursed) {
        armors[idx++] = game.uarmh;
    }
    if (game.uarms && game.uarms.cursed) {
        armors[idx++] = game.uarms;
    }
    if (game.uarmg && game.uarmg.cursed) {
        armors[idx++] = game.uarmg;
    }
    if (game.uarmf && game.uarmf.cursed) {
        armors[idx++] = game.uarmf;
    }
    if (game.uarmu && game.uarmu.cursed) {
        armors[idx++] = game.uarmu;
    }
    if (!idx) {
        return (0);
    }
    if (await disintegrate_arm(armors[rn2(idx)])) {
        return (1);
    }
    return (0);
}
export async function seffect_destroy_armor(sobjp) {
    let sobj = sobjp.value;
    let otmp = await some_armor(game.youmonst);
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let old_erodeproof = 0;
    let new_erodeproof = 0;
    if (confused) {
        if (!otmp) {
            await strange_feeling(sobj, "Your bones itch.");
            sobjp.value = null;
            await exercise(A_STR, (0));
            await exercise(A_CON, (0));
            return;
        }
        old_erodeproof = (otmp.oerodeproof != 0);
        new_erodeproof = scursed;
        otmp.oerodeproof = 0;
        await p_glow2(otmp, c_color_names.c_purple);
        if (old_erodeproof && !new_erodeproof) {
            otmp.oerodeproof = 1;
            await costly_alteration(otmp, COST_DEGRD);
        }
        otmp.oerodeproof = new_erodeproof ? 1 : 0;
        return;
    }
    if (scursed) {
        if (otmp && otmp.cursed) {
            await pline("%s.", await Yobjnam2(otmp, "vibrate"));
            if (otmp.spe >= -6) {
                otmp.spe += -1;
                await adj_abon(otmp, -1);
            }
            await make_stunned((game.u.uprops[STUNNED].intrinsic & 16777215) + (rn2(10) + (10)), (1));
        } else if (await disintegrate_arm(otmp)) {
            /* gives "materialize on different/same level!" message, must
           be a teleport scroll */
            game.known = (1);
            return;
        }
    } else {
        let gets_choice = (otmp && sobj && sobj.blessed && count_worn_armor() > 1);
        if (gets_choice) {
            let atmp = null;
            if (!game.objects[sobj.otyp].oc_name_known) {
                await pline("This is %s!", await an(await actualoname(sobj)));
            }
            game.known = (1);
            atmp = await getobj("destroy", any_worn_armor_ok, 2);
            /* check the return value, if user picked non-valid obj */
            if (any_worn_armor_ok(atmp) == GETOBJ_SUGGEST) {
                otmp = atmp;
            }
            if (await disintegrate_arm(otmp)) {
                game.known = (1);
                return;
            }
        } else if (sobj.blessed && await disintegrate_cursed_armor()) {
            game.known = (1);
            return;
        } else if (!await destroy_arm()) {
            await strange_feeling(sobj, "Your skin itches.");
            sobjp.value = null;
            await exercise(A_STR, (0));
            await exercise(A_CON, (0));
            return;
        } else {
            game.known = (1);
        }
    }
}
export async function seffect_confuse_monster(sobjp) {
    /* scroll or fake spellbook */
    let sobj = sobjp;
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let altfeedback = (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)));
    let hands = await makeplural(await body_part(HAND));
    if (game.youmonst.data.mlet != S_HUMAN || scursed) {
        if (!game.u.uprops[CONFUSION].intrinsic) {
            await You_feel("confused.");
        }
        await make_confused(game.u.uprops[CONFUSION].intrinsic + rnd(100), (0));
    } else if (confused) {
        if (!sblessed) {
            await Your("%s begin to %s%s.", hands, altfeedback ? "tingle" : "glow ", altfeedback ? "" : hcolor(c_color_names.c_purple));
            await make_confused(game.u.uprops[CONFUSION].intrinsic + rnd(100), (0));
        } else {
            await pline("A %s%s surrounds your %s.", altfeedback ? "" : hcolor(c_color_names.c_red), altfeedback ? "faint buzz" : " glow", await body_part(HEAD));
            await make_confused(0, (1));
        }
    } else {
        let incr = (sobj.oclass == SCROLL_CLASS) ? 3 : 0;
        if (!sblessed) {
            if (altfeedback) {
                await Your("%s tingle%s.", hands, game.u.umconf ? " even more" : "");
            } else if (!game.u.umconf) {
                await Your("%s begin to glow %s.", hands, hcolor(c_color_names.c_red));
            } else {
                await pline_The("%s glow of your %s intensifies.", hcolor(c_color_names.c_red), hands);
            }
            incr += rnd(2);
        } else {
            if (altfeedback) {
                await Your("%s tingle %s sharply.", hands, game.u.umconf ? "even more" : "very");
            } else {
                await Your("%s glow %s brilliant %s.", hands, game.u.umconf ? "an even more" : "a", hcolor(c_color_names.c_red));
            }
            incr += (rn2(8) + (2));
        }
        /* after a while, repeated uses become less effective */
        if (game.u.umconf >= 40) {
            incr = 1;
        }
        game.u.umconf += incr;
    }
}
export async function seffect_scare_monster(sobjp) {
    let sobj = sobjp;
    let otyp = sobj.otyp;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let ct = 0;
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
            if (confused || scursed) {
                mtmp.mflee = mtmp.mfrozen = mtmp.msleeping = 0;
                mtmp.mcanmove = 1;
            } else if (!await resist(mtmp, sobj.oclass, 0, 0)) {
                await monflee(mtmp, 0, (0), (0));
            }
            if (!mtmp.mtame) {
                ct++;
            }
        }
    }
    if (otyp == SCR_SCARE_MONSTER || !ct) {
        if (confused || scursed) {
            ;
        } else {
            ;
        }
        await You_hear("%s %s.", (confused || scursed) ? "sad wailing" : "maniacal laughter", !ct ? "in the distance" : "close by");
    }
}
export async function seffect_remove_curse(sobjp) {
    let sobj = sobjp;
    let otyp = sobj.otyp;
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let obj = null;
    let nxto = null;
    let wornmask = 0;
    await You_feel(!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? (!confused ? "like someone is helping you." : "like you need some help.") : (!confused ? "in touch with the Universal Oneness." : "the power of the Force against you!"));
    if (scursed) {
        await pline_The("scroll disintegrates.");
    } else {
        for (obj = game.invent; obj; obj = nxto) {
            /* 5.0: this used to use a straight
               for (obj = invent; obj; obj = obj->nobj) {}
           traversal, but for the confused case, secondary weapon might
           become cursed and be dropped, moving it from the invent chain
           to the floor chain at hero's spot, so we have to remember the
           next object prior to processing the current one */
            nxto = obj.nobj;
            /* gold isn't subject to cursing and blessing */
            if (obj.oclass == COIN_CLASS) {
                continue;
            }
            /* hide current scroll from itself so that perm_invent won't
               show known blessed scroll losing bknown when confused */
            if (obj == sobj && obj.quan == 1) {
                continue;
            }
            wornmask = (obj.owornmask & ~(2097152 | 4096 | 8192));
            if (wornmask && !sblessed) {
                if (obj == game.uswapwep) {
                    /* handle a couple of special cases; we don't
                   allow auxiliary weapon slots to be used to
                   artificially increase number of worn items */
                    if (!game.u.twoweap) {
                        /* weptools don't merge and aren't
                           reasonable quivered weapons */
                        wornmask = 0;
                    }
                } else if (obj == game.uquiver) {
                    if (obj.oclass == WEAPON_CLASS) {
                        /* mergeable weapon test covers ammo,
                           missiles, spears, daggers & knives */
                        if (!game.objects[obj.otyp].oc_merge) {
                            wornmask = 0;
                        }
                    } else if (obj.oclass == GEM_CLASS) {
                        /* possibly ought to check whether
                           alternate weapon is a sling... */
                        if (!(game.uwep && game.objects[game.uwep.otyp].oc_subtyp == P_SLING)) {
                            wornmask = 0;
                        }
                    } else {
                        wornmask = 0;
                    }
                }
            }
            if (sblessed || wornmask || obj.otyp == LOADSTONE || (obj.otyp == LEASH && obj.corpsenm)) {
                /* this treats an in-use leash as a worn item but does not
                   do the same for lit lamp/candle [seems inconsistent] */
                /* water price varies by curse/bless status */
                let shop_h2o = (obj.unpaid && obj.otyp == POT_WATER);
                if (confused) {
                    await blessorcurse(obj, 2);
                    /* lose knowledge of this object's curse/bless
                       state (even if it didn't actually change) */
                    obj.bknown = 0;
                    /* blessorcurse() only affects uncursed items
                       so no need to worry about price of water
                       going down (hence no costly_alteration) */
                    if (shop_h2o && (obj.cursed || obj.blessed)) {
                        await alter_cost(obj, 0);
                    }
                } else if (obj.cursed) {
                    if (shop_h2o) {
                        await costly_alteration(obj, COST_UNCURS);
                    }
                    await uncurse(obj);
                    /* if the object was known to be cursed and is now
                       known not to be, make the scroll known; it's
                       trivial to identify anyway by comparing inventory
                       before and after */
                    if (obj.bknown && otyp == SCR_REMOVE_CURSE) {
                        await learnscrolltyp(SCR_REMOVE_CURSE);
                    }
                }
            }
        }
        if (game.u.usteed && (obj = await which_armor(game.u.usteed, 1048576)) != null) {
            if (confused) {
                await blessorcurse(obj, 2);
                obj.bknown = 0;
            } else if (obj.cursed) {
                await uncurse(obj);
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline("%s %s.", await Yobjnam2(obj, "glow"), hcolor("amber"));
                    obj.bknown = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 0 : 1;
                } else {
                    obj.bknown = 0;
                }
            }
        }
    }
    if ((game.uball != null) && !confused) {
        await unpunish();
    }
    if (game.u.utrap && game.u.utraptype == TT_BURIEDBALL) {
        await buried_ball_to_freedom();
        await pline_The("clasp on your %s vanishes.", await body_part(LEG));
    }
    update_inventory();
}
export async function seffect_create_monster(sobjp) {
    let sobj = sobjp;
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    if (await create_critters(1 + ((confused || scursed) ? 12 : 0) + ((sblessed || rn2(73)) ? 0 : rnd(4)), confused ? game.mons[PM_ACID_BLOB] : null, (0))) {
        game.known = (1);
    }
}
export async function seffect_enchant_weapon(sobjp) {
    let sobj = sobjp.value;
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let old_erodeproof = 0;
    let new_erodeproof = 0;
    let s = 0;
    if (confused && game.uwep && erosion_matters(game.uwep) && game.uwep.oclass != ARMOR_CLASS) {
        /* [What about twoweapon mode?  Proofing/repairing/enchanting both
       would be too powerful, but shouldn't we choose randomly between
       primary and secondary instead of always acting on primary?] */
        old_erodeproof = (game.uwep.oerodeproof != 0);
        new_erodeproof = !scursed;
        game.uwep.oerodeproof = 0;
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            game.uwep.rknown = (0);
            await Your("weapon feels warm for a moment.");
        } else {
            game.uwep.rknown = (1);
            await pline("%s covered by a %s %s %s!", await Yobjnam2(game.uwep, "are"), scursed ? "mottled" : "shimmering", hcolor(scursed ? c_color_names.c_purple : c_color_names.c_golden), scursed ? "glow" : "shield");
        }
        if (new_erodeproof && (game.uwep.oeroded || game.uwep.oeroded2)) {
            game.uwep.oeroded = game.uwep.oeroded2 = 0;
            await pline("%s as good as new!", await Yobjnam2(game.uwep, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "feel" : "look"));
        }
        if (old_erodeproof && !new_erodeproof) {
            game.uwep.oerodeproof = 1;
            await costly_alteration(game.uwep, COST_DEGRD);
        }
        game.uwep.oerodeproof = new_erodeproof ? 1 : 0;
        return;
    }
    s = scursed ? -1 : !game.uwep ? 1 : (game.uwep.spe >= 9) ? (rn2(game.uwep.spe) == 0) : sblessed ? rnd(3 - Math.trunc(game.uwep.spe / 3)) : 1;
    if (!await chwepon(sobj, s)) {
        sobjp.value = null;
    }
    /* nothing enchanted: strange_feeling -> useup */
    if (game.uwep) {
        cap_spe(game.uwep);
    }
}
export async function seffect_taming(sobjp) {
    let sobj = sobjp;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let candidates = 0;
    let res = 0;
    let results = 0;
    let vis_results = 0;
    if (game.u.uswallow) {
        candidates = 1;
        results = vis_results = await maybe_tame(game.u.ustuck, sobj);
    } else {
        let i = 0;
        let j = 0;
        let bd = confused ? 5 : 1;
        let mtmp = null;
        /* note: maybe_tame() can return either positive or
           negative values, but not both for the same scroll */
        candidates = results = vis_results = 0;
        for (i = -bd; i <= bd; i++) {
            for (j = -bd; j <= bd; j++) {
                if (!isok(game.u.ux + i, game.u.uy + j)) {
                    continue;
                }
                if ((mtmp = (game.level.monsters[game.u.ux + i][game.u.uy + j])) != null || (!i && !j && (mtmp = game.u.usteed) != null)) {
                    ++candidates;
                    res = await maybe_tame(mtmp, sobj);
                    results += res;
                    if ((canseemon(mtmp) || sensemon(mtmp))) {
                        vis_results += res;
                    }
                }
            }
        }
    }
    if (!results) {
        await pline("Nothing interesting %s.", !candidates ? "happens" : "seems to happen");
    } else {
        await pline_The("neighborhood %s %sfriendlier.", vis_results ? "is" : "seems", (results < 0) ? "un" : "");
        if (vis_results > 0) {
            game.known = (1);
        }
    }
}
export async function seffect_genocide(sobjp) {
    let sobj = sobjp;
    let otyp = sobj.otyp;
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let already_known = (sobj.oclass == SPBOOK_CLASS || game.objects[otyp].oc_name_known);
    if (!already_known) {
        await You("have found a scroll of genocide!");
    }
    game.known = (1);
    if (sblessed) {
        await do_class_genocide();
    } else {
        await do_genocide((!scursed) | (2 * !!game.u.uprops[CONFUSION].intrinsic));
    }
}
export async function seffect_light(sobjp) {
    let sobj = sobjp;
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    if (!confused) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            game.known = (1);
        }
        await litroom(!scursed, sobj);
        if (!scursed) {
            if (await lightdamage(sobj, (1), 5)) {
                game.known = (1);
            }
        }
    } else {
        let pm = scursed ? PM_BLACK_LIGHT : PM_YELLOW_LIGHT;
        if ((game.mvitals[pm].mvflags & (2 | 1))) {
            await pline("Tiny lights sparkle in the air momentarily.");
        } else {
            /* surround with cancelled tame lights which won't explode */
            let mon = null;
            let sawlights = (0);
            let i = 0;
            let numlights = (rn2(2) + (3)) + (sblessed * 2);
            for (i = 0; i < numlights; ++i) {
                mon = await makemon(game.mons[pm], game.u.ux, game.u.uy, 2048 | 1 | 131072);
                if (mon) {
                    await initedog(mon, (1));
                    mon.msleeping = 0;
                    mon.mcan = (1);
                    if ((canseemon(mon) || sensemon(mon))) {
                        sawlights = (1);
                    }
                    await newsym(mon.mx, mon.my);
                }
            }
            if (sawlights) {
                await pline("Lights appear all around you!");
                game.known = (1);
            }
        }
    }
}
export async function seffect_charging(sobjp) {
    let sobj = sobjp.value;
    let otyp = sobj.otyp;
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let already_known = (sobj.oclass == SPBOOK_CLASS || game.objects[otyp].oc_name_known);
    let otmp = null;
    if (confused) {
        if (scursed) {
            await You_feel("discharged.");
            game.u.uen = 0;
        } else {
            await You_feel("charged up!");
            game.u.uen += d(sblessed ? 6 : 4, 4);
            if (game.u.uen > game.u.uenmax) {
                game.u.uenmax = game.u.uen;
            /* if current energy is already at   */
            /* or near maximum, increase maximum */
            /* otherwise restore current to max  */
            } else {
                game.u.uen = game.u.uenmax;
            }
        }
        game.disp.botl = (1);
        return;
    }
    if (!already_known) {
        await pline("This is a charging scroll.");
        await learnscroll(sobj);
    }
    await useup(sobj);
    sobjp.value = null;
    otmp = await getobj("charge", charge_ok, 2 | 1);
    if (otmp) {
        await recharge(otmp, scursed ? -1 : sblessed ? 1 : 0);
    }
}
export async function seffect_amnesia(sobjp) {
    let sobj = sobjp;
    let sblessed = sobj.blessed;
    game.known = (1);
    await forget((!sblessed ? 2 : 0));
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        await Your("mind releases itself from mundane concerns.");
    } else if (!strncmpi(game.plname, "Maud", 4)) {
        await pline("As your mind turns inward on itself, you forget everything else.");
    } else if (rn2(2)) {
        await pline("Who was that Maud person anyway?");
    } else {
        await pline("Thinking of Maud you forget everything else.");
    }
    await exercise(A_WIS, (0));
}
export async function seffect_fire(sobjp) {
    let sobj = sobjp.value;
    let otyp = sobj.otyp;
    let sblessed = sobj.blessed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let already_known = (sobj.oclass == SPBOOK_CLASS || game.objects[otyp].oc_name_known);
    let cc = { x: 0, y: 0 };
    let dam = 0;
    let cval = 0;
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    cval = bcsign(sobj);
    dam = Math.trunc((2 * ((rn2(3) + (3)) + 2 * cval) + 1) / 3);
    await useup(sobj);
    sobjp.value = null;
    if (!already_known) {
        await learnscrolltyp(SCR_FIRE);
    }
    if (confused) {
        if ((game.u.uinwater)) {
            await pline("A little %s around you vaporizes.", hliquid("water"));
        } else if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
            await shieldeff(game.u.ux, game.u.uy);
            monstseesu(M_SEEN_FIRE);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("Oh, look, what a pretty fire in your %s.", await makeplural(await body_part(HAND)));
            } else {
                await You_feel("a pleasant warmth in your %s.", await makeplural(await body_part(HAND)));
            }
        } else {
            monstunseesu(M_SEEN_FIRE);
            await pline_The("scroll catches fire and you burn your %s.", await makeplural(await body_part(HAND)));
            await losehp(1, "scroll of fire", 0);
        }
        return;
    }
    if ((game.u.uinwater)) {
        await pline_The("%s around you vaporizes violently!", hliquid("water"));
    } else {
        if (sblessed) {
            if (!already_known) {
                await pline("This is a scroll of fire!");
            }
            dam *= 5;
            await pline("Where do you want to center the explosion?");
            await getpos_sethilite(display_stinking_cloud_positions, can_center_cloud);
            await getpos(cc, (1), "the desired position");
            if (!can_center_cloud(cc.x, cc.y)) {
                /* try to reach too far, get burned */
                cc.x = game.u.ux;
                cc.y = game.u.uy;
            }
        }
        if (((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
            await pline_The("scroll erupts in a tower of flame!");
            game.iflags.last_msg = PLNMSG_TOWER_OF_FLAME;
            await burn_away_slime();
        }
    }
    await explode(cc.x, cc.y, 11, dam, SCROLL_CLASS, EXPL_FIERY);
}
export async function seffect_earth(sobjp) {
    let sobj = sobjp;
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    if (!(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) && has_ceiling(game.u.uz) && (!((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) || (((((game.dungeon_topology.d_earth_level)).dlevel || ((game.dungeon_topology.d_earth_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_earth_level)))))) {
        let x = 0;
        let y = 0;
        let nboulders = 0;
        if (game.u.uswallow) {
            await You_hear("rumbling.");
        } else {
            if (!avoid_ceiling(game.u.uz)) {
                await pline_The("%s rumbles %s you!", ceiling(game.u.ux, game.u.uy), sblessed ? "around" : "above");
            } else {
                let matbuf = '';
                let avalanche = "avalanche";
                matbuf = sprintf(matbuf, "%s", sblessed ? await makeplural(avalanche) : await an(avalanche));
                await pline("%s of boulders %s %s you!", upstart(matbuf), await vtense(matbuf, "materialize"), sblessed ? "around" : "above");
            }
        }
        game.known = 1;
        sokoban_guilt();
        if (!scursed) {
            for (x = game.u.ux - 1; x <= game.u.ux + 1; x++) {
                for (y = game.u.uy - 1; y <= game.u.uy + 1; y++) {
                    if (isok(x, y) && !closed_door(x, y) && !((game.level.locations[x][y].typ) < POOL) && !((game.level.locations[x][y].typ) == AIR || (game.level.locations[x][y].typ) == CLOUD) && (x != game.u.ux || y != game.u.uy)) {
                        nboulders += await drop_boulder_on_monster(x, y, confused, (1));
                    }
                }
            }
        }
        if (!sblessed) {
            await drop_boulder_on_player(confused, !scursed, (1), (0));
        } else if (!nboulders) {
            await pline("But nothing else happens.");
        }
    }
}
export async function seffect_punishment(sobjp) {
    let sobj = sobjp;
    let sblessed = sobj.blessed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    game.known = (1);
    if (confused || sblessed) {
        await You_feel("guilty.");
        return;
    }
    await punish(sobj);
}
export async function seffect_stinking_cloud(sobjp) {
    let sobj = sobjp;
    let otyp = sobj.otyp;
    let already_known = (sobj.oclass == SPBOOK_CLASS || game.objects[otyp].oc_name_known);
    if (!already_known) {
        await You("have found a scroll of stinking cloud!");
    }
    game.known = (1);
    await do_stinking_cloud(sobj, already_known);
}
export async function seffect_blank_paper(sobjp) {
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        await You("don't remember there being any magic words on this scroll.");
    } else {
        await pline("This scroll seems to be blank.");
    }
    game.known = (1);
}
export async function seffect_teleportation(sobjp) {
    let sobj = sobjp;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    if (confused || scursed) {
        await level_tele();
        game.known = (1);
    } else {
        await scrolltele(sobj);
    }
}
export async function seffect_gold_detection(sobjp) {
    let sobj = sobjp.value;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    if ((confused || scursed) ? await trap_detect(sobj) : await gold_detect(sobj)) {
        sobjp.value = null;
    }
}
export async function seffect_food_detection(sobjp) {
    let sobj = sobjp.value;
    if (await food_detect(sobj)) {
        sobjp.value = null;
    }
}
export async function seffect_identify(sobjp) {
    let sobj = sobjp.value;
    let otyp = sobj.otyp;
    let is_scroll = (sobj.oclass == SCROLL_CLASS);
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let already_known = (sobj.oclass == SPBOOK_CLASS || game.objects[otyp].oc_name_known);
    if (is_scroll) {
        await useup(sobj);
        sobjp.value = null;
        /* scroll just identifies itself for any scroll read while confused
           or for cursed scroll read without knowing identify yet */
        if (confused || (scursed && !already_known)) {
            await You("identify this as an identify scroll.");
        } else if (!already_known) {
            await pline("This is an identify scroll.");
        }
        if (!already_known) {
            await learnscrolltyp(SCR_IDENTIFY);
        }
        if (confused || (scursed && !already_known)) {
            return;
        }
    }
    if (game.invent) {
        let cval = 1;
        if (sblessed || (!scursed && !rn2(5))) {
            cval = rn2(5);
            /* note: if cval==0, identify all items */
            if (cval == 1 && sblessed && (game.u.uluck + game.u.moreluck) > 0) {
                ++cval;
            }
        }
        await identify_pack(cval, !already_known);
    } else {
        await pline("You're not carrying anything%s to be identified.", (is_scroll) ? " else" : "");
    }
}
export async function seffect_magic_mapping(sobjp) {
    let sobj = sobjp;
    let is_scroll = (sobj.oclass == SCROLL_CLASS);
    let sblessed = sobj.blessed;
    let scursed = sobj.cursed;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let cval = 0;
    if (is_scroll) {
        if (game.level.flags.nommap) {
            await Your("mind is filled with crazy lines!");
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                await pline("Wow!  Modern art.");
            } else {
                await Your("%s spins in bewilderment.", await body_part(HEAD));
            }
            await make_confused(game.u.uprops[CONFUSION].intrinsic + rnd(30), (0));
            return;
        }
        if (sblessed) {
            let x = 0;
            let y = 0;
            /* do_mapping() already reveals secret passages */
            for (x = 1; x < 80; x++) {
                for (y = 0; y < 21; y++) {
                    if (game.level.locations[x][y].typ == SDOOR) {
                        cvt_sdoor_to_door(game.level.locations[x][y]);
                        if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
                            unblock_point(x, y);
                        }
                    }
                }
            }
        }
        game.known = (1);
    }
    if (game.level.flags.nommap) {
        await Your("%s spins as %s blocks the spell!", await body_part(HEAD), c_common_strings.c_something);
        await make_confused(game.u.uprops[CONFUSION].intrinsic + rnd(30), (0));
        return;
    }
    await pline("A map coalesces in your mind!");
    cval = (scursed && !confused);
    if (cval) {
        game.u.uprops[CONFUSION].intrinsic = 1;
    }
    do {
        game.a11y.mon_notices_blocked++;
    } while (0);
    await do_mapping();
    do {
        if (--game.a11y.mon_notices_blocked < 0) {
            await impossible("mon_notices_blocked<0");
            game.a11y.mon_notices_blocked = 0;
        }
    } while (0);
    if (cval) {
        game.u.uprops[CONFUSION].intrinsic = 0;
        await pline("Unfortunately, you can't grasp the details.");
    }
}
export async function seffect_mail(sobjp) {
    let sobj = sobjp;
    let odd = (sobj.o_id % 2) == 1;
    game.known = (1);
    switch (sobj.spe) {
        case 2:
            await pline("This scroll is marked \"%s\".", odd ? "Postage Due" : "Return to Sender");
            break;
        case 1:
            await pline("This seems to be %s.", odd ? "a chain letter threatening your luck" : "junk mail addressed to the finder of the Eye of Larn");
            break;
        default:
            readmail(sobj);
            break;
    }
}
/* MAIL_STRUCTURES */
/* scroll effects; return 1 if we use up the scroll and possibly make it
   become discovered, 0 if caller should take care of those side-effects */
/* sobj - scroll or fake spellbook for spell */
export async function seffects(sobj) {
    let otyp = sobj.otyp;
    if (game.objects[otyp].oc_magic) {
        await exercise(A_WIS, (1));
    }
    switch (otyp) {
        case SCR_MAIL:
            await seffect_mail(sobj);
            break;
        case SCR_ENCHANT_ARMOR:
            await seffect_enchant_armor({ get value() { return sobj; }, set value(_v) { sobj = _v; } });
            break;
        case SCR_DESTROY_ARMOR:
            await seffect_destroy_armor({ get value() { return sobj; }, set value(_v) { sobj = _v; } });
            break;
        case SCR_CONFUSE_MONSTER:
        case SPE_CONFUSE_MONSTER:
            await seffect_confuse_monster(sobj);
            break;
        case SCR_SCARE_MONSTER:
        case SPE_CAUSE_FEAR:
            await seffect_scare_monster(sobj);
            break;
        case SCR_BLANK_PAPER:
            await seffect_blank_paper(sobj);
            break;
        case SCR_REMOVE_CURSE:
        case SPE_REMOVE_CURSE:
            await seffect_remove_curse(sobj);
            break;
        case SCR_CREATE_MONSTER:
        case SPE_CREATE_MONSTER:
            await seffect_create_monster(sobj);
            break;
        case SCR_ENCHANT_WEAPON:
            await seffect_enchant_weapon({ get value() { return sobj; }, set value(_v) { sobj = _v; } });
            break;
        case SCR_TAMING:
        case SPE_CHARM_MONSTER:
            await seffect_taming(sobj);
            break;
        case SCR_GENOCIDE:
            await seffect_genocide(sobj);
            break;
        case SCR_LIGHT:
            await seffect_light(sobj);
            break;
        case SCR_TELEPORTATION:
            await seffect_teleportation(sobj);
            break;
        case SCR_GOLD_DETECTION:
            await seffect_gold_detection({ get value() { return sobj; }, set value(_v) { sobj = _v; } });
            break;
        case SCR_FOOD_DETECTION:
        case SPE_DETECT_FOOD:
            await seffect_food_detection({ get value() { return sobj; }, set value(_v) { sobj = _v; } });
            break;
        case SCR_IDENTIFY:
        case SPE_IDENTIFY:
            await seffect_identify({ get value() { return sobj; }, set value(_v) { sobj = _v; } });
            break;
        case SCR_CHARGING:
            await seffect_charging({ get value() { return sobj; }, set value(_v) { sobj = _v; } });
            break;
        case SCR_MAGIC_MAPPING:
        case SPE_MAGIC_MAPPING:
            await seffect_magic_mapping(sobj);
            break;
        case SCR_AMNESIA:
            await seffect_amnesia(sobj);
            break;
        case SCR_FIRE:
            await seffect_fire({ get value() { return sobj; }, set value(_v) { sobj = _v; } });
            break;
        case SCR_EARTH:
            await seffect_earth(sobj);
            break;
        case SCR_PUNISHMENT:
            await seffect_punishment(sobj);
            break;
        case SCR_STINKING_CLOUD:
            await seffect_stinking_cloud(sobj);
            break;
        default:
            await impossible("What weird effect is this? (%u)", otyp);
    }
    /* if sobj is gone, we've already called useup() above and the
       update_inventory() that it performs might have come too soon
       (before charging an item, for instance) */
    if (!sobj) {
        /* in case identified eggs were affected */
        update_inventory();
    }
    return sobj ? 0 : 1;
}
export async function drop_boulder_on_player(confused, helmet_protects, byu, skip_uswallow) {
    let dmg = 0;
    let otmp2 = null;
    if (game.u.uswallow && !skip_uswallow) {
        await drop_boulder_on_monster(game.u.ux, game.u.uy, confused, byu);
        return;
    }
    otmp2 = await mksobj(confused ? ROCK : BOULDER, (0), (0));
    if (!otmp2) {
        return;
    }
    otmp2.quan = confused ? (rn2(5) + (2)) : 1;
    otmp2.owt = await weight(otmp2);
    if (!(((game.youmonst.data).mflags1 & 4) != 0) && !(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) && !((game.youmonst.data).mlet == S_GHOST) && !(((game.youmonst.data).mflags1 & 1048576) != 0)) {
        await You("are hit by %s!", await doname(otmp2));
        dmg = (await dmgval(otmp2, game.youmonst) * otmp2.quan);
        if (game.uarmh && helmet_protects) {
            if (hard_helmet(game.uarmh)) {
                await pline("Fortunately, you are wearing a hard helmet.");
                if (dmg > 2) {
                    dmg = 2;
                }
            } else if (game.flags.verbose) {
                await pline("%s does not protect you.", await Yname2(game.uarmh));
            }
        }
    } else {
        dmg = 0;
    }
    await wake_nearto(game.u.ux, game.u.uy, 4 * 4);
    if (!await flooreffects(otmp2, game.u.ux, game.u.uy, "fall")) {
        await place_object(otmp2, game.u.ux, game.u.uy);
        await stackobj(otmp2);
        await newsym(game.u.ux, game.u.uy);
    }
    if (dmg) {
        await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "scroll of earth", 0);
    }
}
export async function drop_boulder_on_monster(x, y, confused, byu) {
    let otmp2 = null;
    let mtmp = null;
    otmp2 = await mksobj(confused ? ROCK : BOULDER, (0), (0));
    if (!otmp2) {
        return (0);
    }
    otmp2.quan = confused ? (rn2(5) + (2)) : 1;
    otmp2.owt = await weight(otmp2);
    /* Find the monster here (won't be player) */
    mtmp = (game.level.monsters[x][y]);
    if (mtmp && !(((mtmp.data).mflags1 & 4) != 0) && !(((mtmp.data).mflags1 & 8) != 0) && !((mtmp.data).mlet == S_GHOST) && !(((mtmp.data).mflags1 & 1048576) != 0)) {
        let helmet = await which_armor(mtmp, 4);
        let mdmg = 0;
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
            await pline("%s is hit by %s!", await Monnam(mtmp), await doname(otmp2));
            if (mtmp.minvis && !(canseemon(mtmp) || sensemon(mtmp))) {
                await map_invisible(mtmp.mx, mtmp.my);
            }
        } else if ((game.u.uswallow && (game.u.ustuck == (mtmp)))) {
            await You_hear("something hit %s %s over your %s!", s_suffix(await mon_nam(mtmp)), await mbodypart(mtmp, STOMACH), await body_part(HEAD));
        }
        mdmg = await dmgval(otmp2, mtmp) * otmp2.quan;
        if (helmet) {
            if (hard_helmet(helmet)) {
                if ((canseemon(mtmp) || sensemon(mtmp))) {
                    await pline("Fortunately, %s is wearing a hard helmet.", await mon_nam(mtmp));
                } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    await You_hear("a clanging sound.");
                }
                if (mdmg > 2) {
                    mdmg = 2;
                }
            } else {
                if ((canseemon(mtmp) || sensemon(mtmp))) {
                    await pline("%s's %s does not protect %s.", await Monnam(mtmp), await xname(helmet), (genders[pronoun_gender(mtmp, 2)].him));
                }
            }
        }
        mtmp.mhp -= mdmg;
        if (((mtmp).mhp < 1)) {
            if (byu) {
                await killed(mtmp);
            } else {
                await pline("%s is killed.", await Monnam(mtmp));
                await mondied(mtmp);
            }
        } else {
            await wakeup(mtmp, byu);
        }
        await wake_nearto(x, y, 4 * 4);
    } else if ((game.u.uswallow && (game.u.ustuck == (mtmp)))) {
        await obfree(otmp2, null);
        await drop_boulder_on_player(confused, (1), (0), (1));
        return 1;
    }
    if (!await flooreffects(otmp2, x, y, "fall")) {
        await place_object(otmp2, x, y);
        await stackobj(otmp2);
        await newsym(x, y);
    }
    return (1);
}
/* overcharging any wand or zapping/engraving cursed wand */
/* recharging */
export async function wand_explode(obj, chg) {
    let expl = !chg ? "suddenly" : "vibrates violently and";
    let dmg = 0;
    let n = 0;
    let k = 0;
    if (!chg) {
        chg = 2;
    }
    n = obj.spe + chg;
    if (n < 2) {
        n = 2;
    }
    switch (obj.otyp) {
        case WAN_WISHING:
            k = 12;
            break;
        case WAN_CANCELLATION:
        case WAN_DEATH:
        case WAN_POLYMORPH:
        case WAN_UNDEAD_TURNING:
            k = 10;
            break;
        case WAN_COLD:
        case WAN_FIRE:
        case WAN_LIGHTNING:
        case WAN_MAGIC_MISSILE:
            k = 8;
            break;
        case WAN_NOTHING:
            k = 4;
            break;
        default:
            k = 6;
            break;
    }
    /* inflict damage and destroy the wand */
    dmg = d(n, k);
    /* in case losehp() is fatal (or --More--^C) */
    obj.in_use = (1);
    await pline("%s %s explodes!", await Yname2(obj), expl);
    await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "exploding wand", 0);
    await useup(obj);
    await exercise(A_STR, (0));
}
/* used to collect gremlins being hit by light so that they can be processed
   after vision for the entire lit area has been brought up to date */
// struct litmon: { mon, nxt }
game.gremlins = null;
/*
 * Low-level lit-field update routine.
 */
export async function set_lit(x, y, val) {
    let mtmp = null;
    let gremlin = null;
    if (val) {
        game.level.locations[x][y].lit = 1;
        if ((mtmp = (game.level.monsters[x][y])) != null && mtmp.data == game.mons[PM_GREMLIN]) {
            gremlin = alloc(1 /* sizeof(struct litmon) */);
            gremlin.mon = mtmp;
            gremlin.nxt = game.gremlins;
            game.gremlins = gremlin;
        }
    } else {
        game.level.locations[x][y].lit = 0;
        await snuff_light_source(x, y);
    }
}
/* True: make nearby area lit; False: cursed scroll */
/* scroll, spellbook (for spell), or wand of light */
export async function litroom(on, obj) {
    let otmp = null;
    let nextobj = null;
    let blessed_effect = (obj && obj.oclass == SCROLL_CLASS && obj.blessed);
    let no_op = (game.u.uswallow || (game.u.uinwater) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))));
    /* value is irrelevant but assign something anyway; its
                      * address is used as a 'not null' flag for set_lit() */
    let is_lit = 0;
    if (!on) {
        /* update object lights and produce message (provided you're not blind) */
        let still_lit = 0;
        for (otmp = game.invent; otmp; otmp = nextobj) {
            /*
         * The magic douses lamps,&c too and might curse artifact lights.
         *
         * FIXME?
         *  Shouldn't this affect all lit objects in the area of effect
         *  rather than just those carried by the hero?
         */
            nextobj = otmp.nobj;
            if (otmp.lamplit) {
                if (!artifact_light(otmp)) {
                    await snuff_lit(otmp);
                } else {
                    await impact_arti_light(otmp, (1), !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked));
                }
                if (otmp.lamplit) {
                    ++still_lit;
                }
            }
        }
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            if (still_lit) {
                await pline_The("ambient light seems dimmer.");
            } else if (game.u.uswallow) {
                await pline("It seems even darker in here than before.");
            } else {
                await You("are surrounded by darkness!");
            }
        }
    } else {
        if (blessed_effect) {
            for (otmp = game.invent; otmp; otmp = nextobj) {
                /* might bless artifact lights; no effect on ordinary lights */
                nextobj = otmp.nobj;
                if (otmp.lamplit && artifact_light(otmp)) {
                    await impact_arti_light(otmp, (0), !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked));
                }
            }
        }
        if (game.u.uswallow) {
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                ;
            } else if ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null)) {
                await pline("%s %s is lit.", s_suffix(await Monnam(game.u.ustuck)), await mbodypart(game.u.ustuck, STOMACH));
            } else if (((game.u.ustuck.data).mlet == S_VORTEX || (game.u.ustuck.data) == game.mons[PM_AIR_ELEMENTAL])) {
                await pline("%s shines briefly.", await Monnam(game.u.ustuck));
            } else {
                await pline("%s glistens.", await Monnam(game.u.ustuck));
            }
        } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (!(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) || game.level.locations[game.u.ux][game.u.uy].typ != CORR)) {
            await pline("A lit field %ssurrounds you!", no_op ? "briefly " : "");
        }
    }
    /* No-op when swallowed or in water */
    if (no_op) {
        return;
    }
    /*
     *  If we are darkening the room and the hero is punished but not
     *  blind, then we have to pick up and replace the ball and chain so
     *  that we don't remember them if they are out of sight.
     */
    if ((game.uball != null) && !on && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        await move_bc(1, 0, game.uball.ox, game.uball.oy, game.uchain.ox, game.uchain.oy);
    }
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) {
        /* Can't use do_clear_area because MAX_RADIUS is too small */
        /* rogue lighting must light the entire room */
        let rnum = game.level.locations[game.u.ux][game.u.uy].roomno - 3;
        let rx = 0;
        let ry = 0;
        /* hallways remain dark on the rogue level */
        if (rnum >= 0) {
            for (rx = game.rooms[rnum].lx - 1; rx <= game.rooms[rnum].hx + 1; rx++) {
                for (ry = game.rooms[rnum].ly - 1; ry <= game.rooms[rnum].hy + 1; ry++) {
                    await set_lit(rx, ry, (on ? is_lit : null));
                }
            }
            game.rooms[rnum].rlit = on;
        }
    } else if (is_art(obj, ART_SUNSWORD)) {
        await set_lit(game.u.ux, game.u.uy, is_lit);
    } else {
        await do_clear_area(game.u.ux, game.u.uy, blessed_effect ? 9 : 5, set_lit, (on ? is_lit : null));
    }
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        await vision_recalc(2);
        if ((game.uball != null) && !on) {
            await move_bc(0, 0, game.uball.ox, game.uball.oy, game.uchain.ox, game.uchain.oy);
        }
    }
    /* delayed vision recalculation */
    game.vision_full_recalc = 1;
    if (game.gremlins) {
        let gremlin = null;
        await vision_recalc(0);
        /* after vision has been updated, monsters who are affected
           when hit by light can now be hit by it */
        do {
            gremlin = game.gremlins;
            game.gremlins = gremlin.nxt;
            await light_hits_gremlin(gremlin.mon, rnd(5));
            free(gremlin);
        } while (game.gremlins);
    }
    return;
}
export async function do_class_genocide() {
    let i = 0;
    let j = 0;
    let immunecnt = 0;
    let gonecnt = 0;
    let goodcnt = 0;
    let class_ = 0;
    let feel_dead = 0;
    let ll_done = 0;
    let buf = '';
    let promptbuf = '';
    let gameover = (0);
    buf = '';
    for (j = 0; ; j++) {
        if (j >= 5) {
            await pline("%s", c_common_strings.c_thats_enough_tries);
            return;
        }
        promptbuf = strcpy(promptbuf, "What class of monsters do you want to genocide?");
        if (j > 0) {
            nh_snprintf("do_class_genocide", 2657, eos(promptbuf), 128 /* sizeof(char [128]) */ - strlen(promptbuf), " [enter %s]", game.iflags.cmdassist ? "the symbol or name representing a class, or '?'" : "'?' to see previous genocides");
        }
        buf = await getlin(promptbuf, buf);
        buf = mungspaces(buf);
        if (!buf) {
            await pline("%s.", (j + 1 < 5) ? "Type letter (or punctuation) or name used for a class of monsters or 'none'" : "No class of monsters specified");
            continue;
        }
        if (buf == 27 || !strncmpi((buf), ("none"), -1) || !strncmpi((buf), ("'none'"), -1) || !strncmpi((buf), ("nothing"), -1)) {
            /* next iteration gives "that's enough tries"
                            so don't suggest typing anything this time */
            /* choosing "none" preserves genocideless conduct */
            livelog_printf(128, "declined to perform class genocide");
            return;
        }
        if (!strcmp(buf, "?") || !strcmp(buf, "'?'")) {
            await list_genocided(103, (0));
            --j;
            continue;
        }
        class_ = await name_to_monclass(buf, null);
        if (class_ == 0 && (i = await name_to_mon(buf, null)) != NON_PM) {
            class_ = game.mons[i].mlet;
        }
        immunecnt = gonecnt = goodcnt = 0;
        for (i = LOW_PM; i < NUMMONS; i++) {
            if (game.mons[i].mlet == class_) {
                if (!(game.mons[i].geno & 32)) {
                    immunecnt++;
                } else if (game.mvitals[i].mvflags & 2) {
                    gonecnt++;
                } else {
                    goodcnt++;
                }
            }
        }
        if (!goodcnt && class_ != game.mons[game.urole.mnum].mlet && class_ != game.mons[game.urace.mnum].mlet) {
            if (gonecnt) {
                await pline("All such monsters are already nonexistent.");
            } else if (immunecnt || class_ == S_invisible) {
                await You("aren't permitted to genocide such monsters.");
            } else if (game.flags.debug && __nh_char_at0(buf) == 42) {
                let mtmp = null;
                let mtmp2 = null;
                gonecnt = 0;
                for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
                    mtmp2 = mtmp.nmon;
                    if (((mtmp).mhp < 1)) {
                        continue;
                    }
                    await mongone(mtmp);
                    gonecnt++;
                }
                await pline("Eliminated %d monster%s.", gonecnt, (((gonecnt) == 1) ? "" : "s"));
                return;
            } else {
                await pline("That %s does not represent any monster.", strlen(buf) == 1 ? "symbol" : "response");
            }
            continue;
        }
        for (i = LOW_PM; i < NUMMONS; i++) {
            if (game.mons[i].mlet == class_) {
                let nam = '';
                nam = strcpy(nam, await makeplural(game.mons[i].pmnames[NEUTRAL]));
                if (((i) == game.urole.mnum) || ((i) == game.urace.mnum) || ((game.mons[i].geno & 32) && !(game.mvitals[i].mvflags & 2))) {
                    if (!ll_done++) {
                        if (!await num_genocides()) {
                            livelog_printf(32 | 128, "performed %s first genocide (class %c)", (genders[game.flags.female ? 1 : 0].his), def_monsyms[class_].sym);
                        } else {
                            livelog_printf(128, "genocided class %c", def_monsyms[class_].sym);
                        }
                    }
                    game.mvitals[i].mvflags |= (2 | 16);
                    await kill_genocided_monsters();
                    update_inventory();
                    await pline("Wiped out all %s.", nam);
                    if ((game.u.umonnum != game.u.umonster) && ((((game.youmonst)).cham == PM_VAMPIRE || ((game.youmonst)).cham == PM_VAMPIRE_LEADER || ((game.youmonst)).cham == PM_VLAD_THE_IMPALER) && !(((game.youmonst).data).mlet == S_VAMPIRE)) && (i == game.u.umonnum || i == game.youmonst.cham)) {
                        await polyself(POLY_REVERT);
                    }
                    if ((game.u.umonnum != game.u.umonster) && i == game.u.umonnum) {
                        /* current shifted form or base vampire form */
                        game.u.mh = -1;
                        if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                            if (!feel_dead++) {
                                await urgent_pline("You die.");
                            }
                            /* finish genociding this class of
                               monsters before ultimately dying */
                            gameover = (1);
                        } else {
                            await rehumanize();
                        }
                    }
                    if (i == game.urole.mnum || i == game.urace.mnum) {
                        /* Self-genocide if it matches either your race
                       or role.  Assumption:  male and female forms
                       share same monster class. */
                        game.u.uhp = -1;
                        if ((game.u.umonnum != game.u.umonster)) {
                            if (!feel_dead++) {
                                await You_feel("%s inside.", udeadinside());
                            }
                        } else {
                            if (!feel_dead++) {
                                await urgent_pline("You die.");
                            }
                            gameover = (1);
                        }
                    }
                } else if (game.mvitals[i].mvflags & 2) {
                    if (!gameover) {
                        await pline("%s are already nonexistent.", upstart(nam));
                    }
                } else if (!gameover) {
                    if ((game.mons[i].msound != MS_LEADER || await quest_info(MS_LEADER) == i) && (game.mons[i].msound != MS_NEMESIS || await quest_info(MS_NEMESIS) == i) && (game.mons[i].msound != MS_GUARDIAN || await quest_info(MS_GUARDIAN) == i) && (i != PM_NINJA || (game.urole.mnum == (PM_SAMURAI)))) {
                        /* suppress feedback about quest beings except
                       for those applicable to our own role */
                        /* non-leader/nemesis/guardian role-specific monster
                           */
                        let named = 0;
                        let uniq = 0;
                        named = (((game.mons[i]).mflags2 & 524288) != 0) ? (1) : (0);
                        uniq = (game.mons[i].geno & 4096) ? (1) : (0);
                        if (i == PM_HIGH_CLERIC) {
                            uniq = (0);
                        }
                        await You("aren't permitted to genocide %s%s.", (uniq && !named) ? "the " : "", (uniq || named) ? game.mons[i].pmnames[NEUTRAL] : nam);
                    }
                }
            }
        }
        if (gameover || game.u.uhp == -1) {
            game.killer.format = 0;
            game.killer.name = strcpy(game.killer.name, "scroll of genocide");
            if (gameover) {
                await done(GENOCIDED);
            }
        }
        return;
    }
}
/* 0 = no genocide; create monsters (cursed scroll)
              * 1 = normal genocide
              * 3 = forced genocide of player
              * 5 (4 | 1) = normal genocide from throne */
export async function do_genocide(how) {
    let buf = '';
    let realbuf = '';
    let promptbuf = '';
    let i = 0;
    let killplayer = 0;
    let mndx = 0;
    let ptr = null;
    let which = null;
    if (how & 2) {
        mndx = game.u.umonster;
        ptr = game.mons[mndx];
        buf = strcpy(buf, pmname(ptr, (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0)));
        killplayer++;
    } else {
        buf = '';
        for (i = 0; ; i++) {
            if (i >= 5) {
                if (!(how & 1) && (ptr = await rndmonst()) != null) {
                    break;
                }
                await pline("%s", c_common_strings.c_thats_enough_tries);
                return;
            }
            promptbuf = strcpy(promptbuf, "What type of monster do you want to genocide?");
            if (i > 0) {
                nh_snprintf("do_genocide", 2861, eos(promptbuf), 128 /* sizeof(char [128]) */ - strlen(promptbuf), " [enter %s]", game.iflags.cmdassist ? "the name of a type of monster, or '?'" : "'?' to see previous genocides");
            }
            buf = await getlin(promptbuf, buf);
            buf = mungspaces(buf);
            if (!buf) {
                await pline("%s.", (i + 1 < 5) ? "Type the name of a type of monster or 'none'" : "No type of monster specified");
                continue;
            }
            if (buf == 27 || !strncmpi((buf), ("none"), -1) || !strncmpi((buf), ("'none'"), -1) || !strncmpi((buf), ("nothing"), -1)) {
                if (!(how & 1) && (ptr = await rndmonst()) != null) {
                    break;
                }
                /* remaining checks don't apply */
                livelog_printf(128, "declined to perform genocide");
                return;
            }
            if (!strcmp(buf, "?") || !strcmp(buf, "'?'")) {
                await list_genocided(103, (0));
                --i;
                continue;
            }
            mndx = await name_to_mon(buf, null);
            if (mndx == NON_PM || (game.mvitals[mndx].mvflags & 2)) {
                await pline("Such creatures %s exist in this world.", (mndx == NON_PM) ? "do not" : "no longer");
                continue;
            }
            ptr = game.mons[mndx];
            /* first revert if current shifted form or base vampire form */
            if ((game.u.umonnum != game.u.umonster) && ((((game.youmonst)).cham == PM_VAMPIRE || ((game.youmonst)).cham == PM_VAMPIRE_LEADER || ((game.youmonst)).cham == PM_VLAD_THE_IMPALER) && !(((game.youmonst).data).mlet == S_VAMPIRE)) && (mndx == game.u.umonnum || mndx == game.youmonst.cham)) {
                await polyself(POLY_REVERT);
            }
            if (((mndx) == game.urole.mnum) || ((mndx) == game.urace.mnum)) {
                /* vampshifter (bat, &c) to vampire */
                /* Although "genus" is Latin for race, the hero benefits
             * from both race and role; thus genocide affects either.
             */
                killplayer++;
                break;
            }
            if ((((ptr).mflags2 & 8) != 0)) {
                adjalign(-sgn(game.u.ualign.type));
            }
            if ((((ptr).mflags2 & 256) != 0)) {
                adjalign(sgn(game.u.ualign.type));
            }
            if (!(ptr.geno & 32)) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    if (game.flags.verbose) {
                        await pline("A thunderous voice booms through the caverns:");
                    }
                    ;
                    await verbalize("No, mortal!  That will not be done.");
                }
                continue;
            }
            /* KMH -- Unchanging prevents rehumanization */
            if ((game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && ptr == game.youmonst.data) {
                killplayer++;
            }
            break;
        }
        /* needed for the 'no free pass' cases */
        mndx = ((ptr).pmidx);
    }
    which = "all ";
    realbuf = strcpy(realbuf, ptr.pmnames[NEUTRAL]);
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        if ((game.u.umonnum != game.u.umonster)) {
            buf = strcpy(buf, pmname(game.youmonst.data, game.flags.female ? FEMALE : MALE));
        } else {
            buf = strcpy(buf, (game.flags.female && game.urole.name.f) ? game.urole.name.f : game.urole.name.m);
            buf = (() => { const __s = buf; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toLowerCase() + __t.slice(1) : __s; })();
        }
    } else {
        buf = strcpy(buf, realbuf);
        if ((ptr.geno & 4096) && ptr != game.mons[PM_HIGH_CLERIC]) {
            which = !(((ptr).mflags2 & 524288) != 0) ? "the " : "";
        }
    }
    if (how & 1) {
        if (!await num_genocides()) {
            livelog_printf(32 | 128, "performed %s first genocide (%s)", (genders[game.flags.female ? 1 : 0].his), await makeplural(realbuf));
        } else {
            livelog_printf(128, "genocided %s", await makeplural(realbuf));
        }
        /* setting no-corpse affects wishing and random tin generation */
        game.mvitals[mndx].mvflags |= (2 | 16);
        await pline("Wiped out %s%s.", which, (__nh_char_at0(which) != 97) ? buf : await makeplural(buf));
        if (killplayer) {
            game.u.uhp = -1;
            if (how & 2) {
                game.killer.format = 1;
                game.killer.name = strcpy(game.killer.name, "genocidal confusion");
            } else if (how & 4) {
                /* player selected while on a throne */
                /* selected player deliberately, not confused */
                game.killer.format = 0;
                game.killer.name = strcpy(game.killer.name, "imperious order");
            } else {
                game.killer.format = 0;
                game.killer.name = strcpy(game.killer.name, "scroll of genocide");
            }
            if ((game.u.umonnum != game.u.umonster) && ptr != game.youmonst.data) {
                /* Polymorphed characters will die as soon as they're rehumanized.
               KMH -- Unchanging prevents rehumanization. */
                delayed_killer(POLYMORPH, game.killer.format, game.killer.name);
                await You_feel("%s inside.", udeadinside());
            } else {
                await done(GENOCIDED);
            }
        } else if (ptr == game.youmonst.data) {
            await rehumanize();
        }
        await kill_genocided_monsters();
        update_inventory();
    } else {
        let cnt = 0;
        let census = monster_census((0));
        if (!(game.mons[mndx].geno & 4096) && !(game.mvitals[mndx].mvflags & (2 | 1))) {
            for (i = (rn2(3) + (4)); i > 0; i--) {
                if (!await makemon(ptr, game.u.ux, game.u.uy, 1 | 131072)) {
                    break;
                }
                ++cnt;
                if (game.mvitals[mndx].mvflags & 1) {
                    break;
                }
            }
        }
        if (cnt) {
            /* accumulated 'cnt' doesn't take groups into account;
               assume bringing in new mon(s) didn't remove any old ones */
            cnt = monster_census((0)) - census;
            await pline("Sent in %s%s.", (cnt > 1) ? "some " : "", (cnt > 1) ? await makeplural(buf) : await an(buf));
        } else {
            await pline("%s", c_common_strings.c_nothing_happens);
        }
    }
}
export async function punish(sobj) {
    /* angrygods() calls this with NULL sobj arg */
    let reuse_ball = (sobj && sobj.otyp == HEAVY_IRON_BALL) ? sobj : null;
    /* analyzer doesn't know that the one caller that passes a NULL
     * sobj (angrygods) checks !Punished first, so add a guard */
    let cursed_levy = (sobj && sobj.cursed) ? 1 : 0;
    if (!reuse_ball) {
        await You("are being punished for your misbehavior!");
    }
    if ((game.uball != null)) {
        await Your("iron ball gets heavier.");
        game.uball.owt += WT_IRON_BALL_INCR * (1 + cursed_levy);
        return;
    }
    if ((((game.youmonst.data).mflags1 & 4) != 0) || ((game.youmonst.data).mlet == S_VORTEX || (game.youmonst.data) == game.mons[PM_AIR_ELEMENTAL]) || (((game.youmonst.data).mflags1 & 1048576) != 0)) {
        if (!reuse_ball) {
            await pline("A ball and chain appears, then falls away.");
            await dropy(await mkobj(BALL_CLASS, (1)));
        } else {
            await dropy(reuse_ball);
        }
        return;
    }
    await setworn(await mkobj(CHAIN_CLASS, (1)), 4194304);
    if (!reuse_ball) {
        await setworn(await mkobj(BALL_CLASS, (1)), 2097152);
    } else {
        await setworn(reuse_ball, 2097152);
    }
    if (!game.u.uswallow) {
        await placebc();
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await set_bc(1);
        }
        await newsym(game.u.ux, game.u.uy);
    }
}
/* remove the ball and chain */
export async function unpunish() {
    let savechain = game.uchain;
    await setworn(null, 4194304);
    await delobj(savechain);
    await setworn(null, 2097152);
}
/* prompt the player to create a stinking cloud and then create it if they
   give a location */
export async function do_stinking_cloud(sobj, mention_stinking) {
    let cc = { x: 0, y: 0 };
    await pline("Where do you want to center the %scloud?", mention_stinking ? "stinking " : "");
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    await getpos_sethilite(display_stinking_cloud_positions, can_center_cloud);
    if (await getpos(cc, (1), "the desired position") < 0) {
        await pline("%s", c_common_strings.c_Never_mind);
        return;
    } else if (!can_center_cloud(cc.x, cc.y)) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await pline("Ugh... someone cut the cheese.");
        } else {
            await pline("%s a whiff of rotten eggs.", sobj.oclass == SCROLL_CLASS ? "The scroll crumbles with" : "You smell");
        }
        return;
    }
    await create_gas_cloud(cc.x, cc.y, 15 + 10 * bcsign(sobj), 8 + 4 * bcsign(sobj));
}
/* some creatures have special data structures that only make sense in their
 * normal locations -- if the player tries to create one elsewhere, or to
 * revive one, the disoriented creature becomes a zombie
 */
export function cant_revive(mtype, revival, from_obj) {
    if (mtype.value == PM_GUARD || (mtype.value == PM_SHOPKEEPER && !revival) || mtype.value == PM_HIGH_CLERIC || mtype.value == PM_ALIGNED_CLERIC || mtype.value == PM_ANGEL) {
        /* SHOPKEEPERS can be revived now */
        mtype.value = PM_HUMAN_ZOMBIE;
        return (1);
    } else if (mtype.value == PM_LONG_WORM_TAIL) {
        mtype.value = PM_LONG_WORM;
        return (1);
    } else if ((((game.mons[mtype.value]).geno & 4096) != 0) && (!from_obj || !((from_obj).oextra && ((from_obj).oextra.omonst)))) {
        /* unique corpses (from bones or wizard mode wish) or
           statues (bones or any wish) end up as shapechangers */
        mtype.value = PM_DOPPELGANGER;
        return (1);
    }
    return (0);
}
export async function create_particular_parse(str, d) {
    let gender_name_var = NEUTRAL;
    let bufp = str;
    let tmpp = null;
    d.quan = 1 + ((game.multi > 0) ? game.multi : 0);
    d.monclass = MAXMCLASSES;
    /* an arbitrary index into mons[] */
    d.which = game.urole.mnum;
    d.fem = -1;
    /* no confusion on which gender to assign */
    d.genderconf = -1;
    d.randmonst = (0);
    d.maketame = d.makepeaceful = d.makehostile = (0);
    d.sleeping = d.saddled = d.invisible = d.hidden = (0);
    if (digit(bufp.value)) {
        d.quan = atoi(bufp);
        while (digit(bufp.value)) {
            (bufp = __nh_advance_str(bufp, 1));
        }
        while (bufp.value == 32) {
            (bufp = __nh_advance_str(bufp, 1));
        }
    }
    /* maximum possible quantity is one per cell: (0..ROWNO-1) x (1..COLNO-1)
       [21*79==1659 for default map size; could subtract 1 for hero's spot] */
    if (d.quan < 1 || d.quan > (21 * (80 - 1))) {
        d.quan = (21 * (80 - 1)) - monster_census((0));
    }
    if ((tmpp = strstri(bufp, "saddled ")) != null) {
        /* gear -- extremely limited number of possibilities supported */
        d.saddled = (1);
        memset(tmpp, 32, 9 /* sizeof(char [9]) */ - 1);
    }
    if ((tmpp = strstri(bufp, "sleeping ")) != null) {
        /* state -- limited number of possibilities supported */
        d.sleeping = (1);
        memset(tmpp, 32, 10 /* sizeof(char [10]) */ - 1);
    }
    if ((tmpp = strstri(bufp, "invisible ")) != null) {
        d.invisible = (1);
        memset(tmpp, 32, 11 /* sizeof(char [11]) */ - 1);
    }
    if ((tmpp = strstri(bufp, "hidden ")) != null) {
        d.hidden = (1);
        memset(tmpp, 32, 8 /* sizeof(char [8]) */ - 1);
    }
    if ((tmpp = strstri(bufp, "female ")) != null) {
        /* check "female" before "male" to avoid false hit mid-word */
        d.fem = 1;
        memset(tmpp, 32, 8 /* sizeof(char [8]) */ - 1);
    }
    if ((tmpp = strstri(bufp, "male ")) != null) {
        d.fem = 0;
        memset(tmpp, 32, 6 /* sizeof(char [6]) */ - 1);
    }
    /* after potential memset(' ') */
    bufp = mungspaces(bufp);
    if (!strncmpi(bufp, "tame ", 5)) {
        /* allow the initial disposition to be specified */
        bufp = __nh_advance_str(bufp, 5);
        d.maketame = (1);
    } else if (!strncmpi(bufp, "peaceful ", 9)) {
        bufp = __nh_advance_str(bufp, 9);
        d.makepeaceful = (1);
    } else if (!strncmpi(bufp, "hostile ", 8)) {
        bufp = __nh_advance_str(bufp, 8);
        d.makehostile = (1);
    }
    if (game.flags.debug && (!strcmp(bufp, "*") || !strcmp(bufp, "random"))) {
        /* decide whether a valid monster was chosen */
        d.randmonst = (1);
        return (1);
    }
    d.which = await name_to_mon(bufp, { get value() { return gender_name_var; }, set value(_v) { gender_name_var = _v; } });
    if (d.fem == MALE || d.fem == FEMALE) {
        /* otherwise keep the value of d->fem, as it's okay */
        if ((gender_name_var != NEUTRAL) && (d.fem != gender_name_var)) {
            /*
     * With the introduction of male and female monster names
     * in 5.0, preserve that detail.
     *
     * If d->fem is already set to MALE or FEMALE at this juncture, it means
     * one of those terms was explicitly specified.
     */
            /* apparent selection incompatibility */
            d.genderconf = gender_name_var;
        }
    } else {
        /* no explicit gender term was specified */
        d.fem = gender_name_var;
    }
    if (((d.which) >= LOW_PM && (d.which) < NUMMONS)) {
        return (1);
    }
    d.monclass = await name_to_monclass(bufp, { get value() { return d.which; }, set value(_v) { d.which = _v; } });
    if (((d.which) >= LOW_PM && (d.which) < NUMMONS)) {
        d.monclass = MAXMCLASSES;
        return (1);
    } else if (d.monclass == S_invisible) {
        /* not an actual monster class */
        d.which = PM_STALKER;
        d.monclass = MAXMCLASSES;
        return (1);
    } else if (d.monclass == S_WORM_TAIL) {
        d.which = PM_LONG_WORM;
        d.monclass = MAXMCLASSES;
        return (1);
    } else if (d.monclass > 0) {
        d.which = game.urole.mnum;
        return (1);
    }
    return (0);
}
export async function create_particular_creation(d) {
    let whichpm = null;
    let i = 0;
    let mx = 0;
    let my = 0;
    let firstchoice = NON_PM;
    let mtmp = null;
    let madeany = (0);
    if (!d.randmonst) {
        firstchoice = d.which;
        if (cant_revive({ get value() { return d.which; }, set value(_v) { d.which = _v; } }, (0), null) && firstchoice != PM_LONG_WORM_TAIL) {
            /* wizard mode can override handling of special monsters */
            let buf = '';
            buf = sprintf(buf, "Creating %s instead; force %s?", game.mons[d.which].pmnames[NEUTRAL], game.mons[firstchoice].pmnames[NEUTRAL]);
            if (await yn_function(buf, ynchars, 110, (1)) == 121) {
                d.which = firstchoice;
            }
        }
        whichpm = game.mons[d.which];
    }
    for (i = 0; i < d.quan; i++) {
        let mmflags = 0;
        if (d.monclass != MAXMCLASSES) {
            whichpm = await mkclass(d.monclass, 0);
        } else if (d.randmonst) {
            whichpm = await rndmonst();
        }
        if (d.genderconf == -1) {
            /* no conflict exists between explicit gender term and
               the specified monster name */
            if (d.fem != -1 && (!whichpm || (!(((whichpm).mflags2 & 65536) != 0) && !(((whichpm).mflags2 & 131072) != 0)))) {
                /* conundrum alert: an explicit gender term conflicts with an
               explicit gender-tied naming term (i.e. male cavewoman) */
                /* option not gone with: name overrides the explicit gender as
               commented out here */
                /*  d->fem = d->genderconf; */
                /* option chosen: let the explicit gender term (male or female)
               override the gender-tied naming term, so leave d->fem as-is */
                /* another option would be to consider it a faulty specification
               and reject the request completely and produce a random monster
               with a gender matching that specified instead (i.e. there is
               no such thing as a male cavewoman) */
                /* mmflags |= (d->fem == FEMALE) ? MM_FEMALE : MM_MALE; */
                mmflags |= (d.fem == FEMALE) ? 65536 : (d.fem == MALE) ? 32768 : 0;
            }
            /* no surprise; "<mon> appears." rather than "<mon> appears!" */
            mmflags |= 262144;
        } else {
            mmflags |= (d.fem == FEMALE) ? 65536 : (d.fem == MALE) ? 32768 : 0;
        }
        if (d.invisible) {
            mmflags |= 1048576;
        }
        mtmp = await makemon(whichpm, game.u.ux, game.u.uy, mmflags);
        if (!mtmp) {
            /* quit trying if creation failed and is going to repeat */
            if (d.monclass == MAXMCLASSES && !d.randmonst) {
                break;
            }
            continue;
        }
        mx = mtmp.mx , my = mtmp.my;
        if (d.maketame) {
            await tamedog(mtmp, null, (0));
        } else if (d.makepeaceful || d.makehostile) {
            mtmp.mtame = 0;
            mtmp.mpeaceful = d.makepeaceful ? 1 : 0;
            set_malign(mtmp);
        }
        if (d.saddled && can_saddle(mtmp) && !await which_armor(mtmp, 1048576)) {
            await put_saddle_on_mon(null, mtmp);
        }
        if (d.hidden && (((((mtmp.data).mflags1 & 256) != 0) && mtmp.data.mlet != S_MIMIC) || ((((mtmp.data).mflags1 & 128) != 0) && (game.level.objects[mx][my] != null)) || (mtmp.data.mlet == S_EEL && is_pool(mx, my)))) {
            mtmp.mundetected = 1;
        }
        if (d.sleeping) {
            mtmp.msleeping = 1;
        }
        /* if asking for 'hidden', show location of every created monster
           that can't be seen--whether that's due to successfully hiding
           or vision issues (line-of-sight, invisibility, blindness) */
        if ((d.hidden || d.invisible) && !(canseemon(mtmp) || sensemon(mtmp))) {
            await flash_mon(mtmp);
        }
        madeany = (1);
        /* in case we got a doppelganger instead of what was asked
           for, make it start out looking like what was asked for */
        if (mtmp.cham != NON_PM && firstchoice != NON_PM && mtmp.cham != firstchoice) {
            await newcham(mtmp, game.mons[firstchoice], 0);
        }
    }
    return madeany;
}
/*
 * Make a new monster with the type controlled by the user.
 *
 * Note:  when creating a monster by class letter, specifying the
 * "strange object" (']') symbol produces a random monster rather
 * than a mimic.  This behavior quirk is useful so don't "fix" it
 * (use 'm'--or "mimic"--to create a random mimic).
 *
 * Used in wizard mode only (for ^G command and for scroll or spell
 * of create monster).  Once upon a time, an earlier incarnation of
 * this code was also used for the scroll/spell in explore mode.
 */
export async function create_particular() {
    let d = { quan: 0, which: 0, fem: 0, genderconf: 0, monclass: 0, randmonst: 0, maketame: 0, makepeaceful: 0, makehostile: 0, sleeping: 0, saddled: 0, invisible: 0, hidden: 0 };
    let bufp = null;
    let buf = '';
    let prompt = '';
    let tryct = 5;
    let altmsg = 0;
    buf = '';
    prompt = strcpy(prompt, "Create what kind of monster?");
    do {
        buf = await getlin(prompt, buf);
        bufp = mungspaces(buf);
        if (__nh_char_at0(bufp) == 27) {
            return (0);
        }
        if (await create_particular_parse(bufp, d)) {
            break;
        }
        if (__nh_char_at0(bufp) || altmsg || tryct < 2) {
            await pline("I've never heard of such monsters.");
        } else {
            await pline("Try again (type * for random, ESC to cancel).");
            ++altmsg;
        }
        /* when a second try is needed, expand the prompt */
        if (tryct == 5) {
            prompt = strcat(prompt, " [type name or symbol]");
        }
    } while (--tryct > 0);
    if (!tryct) {
        await pline("%s", c_common_strings.c_thats_enough_tries);
    } else {
        return await create_particular_creation(d);
    }
    return (0);
}
/*read.c*/
/* it's implied that sobj->dknown is set;
       we couldn't be reading this scroll otherwise */
/* outrumor has its own blindness check */
/* can't read shirt worn under suit (under cloak is ok though) */
/* no need to vary this when blind; "on this ___" is important
               because it suggests that there might be something on others */
/* yet another note: despite the fact that player will recognize
           the object type, don't make it become a discovery for hero */
/* Make a credit card number */
/* unseen novels are already distinguishable from unseen
               spellbooks so this isn't revealing any extra information */
/* reading mail is a convenience for the player and takes
           place outside the game, so shouldn't affect gameplay;
           on the other hand, it starts by explicitly making the
           hero actively read something, which is pretty hard
           to simply ignore; as a compromise, if the player has
           maintained illiterate conduct so far, and this mail
           scroll didn't come from bones, ask for confirmation */
/* order matters: message, shop handling, actual transformation */
/* now handle the actual recharging */
/* wands can't give more than three wishes; this code is
                   currently unreachable but left in case the rules for
                   wands of wishing change in future */
/*[shop price doesn't vary by charge count]*/
/* update shop bill to reflect new higher price */
/* destruction depends on current state, not adjustment */
/* cause attributes and/or properties to be updated */
/* oartifact: if a touch-sensitive artifact ring is
               ever created the above will need to be revised  */
/* like wands, first uncancel */
/* cursed scroll removes charges and curses ball */
/*stripspe(obj); -- doesn't do quite what we want...*/
/* [shop price stays the same regardless of charges or BUC] */
/* charges at max and ball not being uncursed */
/* for a shopkeeper, tamedog() will call make_happy_shk() but
           not tame the target, so call it even if taming gets resisted */
/* dragon scales get turned into dragon scale mail */
/* [this cost handling will need updating if shop pricing is
       ever changed to care about curse/bless status of armor] */
/* skip if it got changed to 0 */
/* armor and scroll both cursed */
/* if riding, treat steed's saddle as if part of hero's invent */
/* like rndcurse(sit.c), effect on regular inventory
                   doesn't show things glowing but saddle does */
/* no need to flush monsters; we ask for identification only if the
     * monsters are not visible
     */
/* guard further tests against null pointer */
/* >= 9 case prevents rnd(0) */
/* known = TRUE; -- handled inline here */
/* use it up now to prevent it from showing in the
       getobj picklist because the "disappears" message
       was already delivered */
/* explained in splatter_burning_oil(explode.c) */
/* Loop through the surrounding squares */
/* Is this a suitable spot? */
/* this will call learnscroll() as appropriate, and has results
           which maybe shouldn't result in the scroll becoming known;
           either way, no need to set gk.known here */
/* failure: strange_feeling() -> useup() */
/* nothing detected: strange_feeling -> useup */
/* use up the scroll first, before learnscrolltyp() -> makeknown()
           performs perm_invent update; also simplifies empty invent check */
/* spell cast with inventory empty or scroll read when it's
           the only item leaving empty inventory after being used up */
/* "stamped scroll" created via magic marker--without a stamp */
/* scroll of mail obtained from bones file or from wishing;
           note to the puzzled: the game Larn actually sends you junk
           mail if you win! */
/* hit monster if swallowed */
/* Must be before the losehp(), for bones files */
/* Drop the rock/boulder to the floor */
/* wielded Sunsword or worn gold dragon scales/mail;
                       maybe lower its BUC state if not already cursed */
/* scroll of light becomes discovered when not blind, so some
           message to justify that is needed */
/* for the still_lit case, we don't know at this point whether
               anything currently visibly lit is going to go dark; if this
               message came after the darkening, we could count visibly
               lit squares before and after to know; we do know that being
               swallowed won't be affected--the interior is still lit */
/* wielded Sunsword or worn gold dragon scales/mail;
                       maybe raise its BUC state if not already blessed */
/* Sunsword's #invoke power directed up or down lights hero's spot
           (do_clear_area() rejects radius 0 so call set_lit() directly) */
/*
     *  If we are not blind, then force a redraw on all positions in sight
     *  by temporarily blinding the hero.  The vision recalculation will
     *  correctly update all previously seen positions *and* correctly
     *  set the waslit bit [could be messed up from above].
     */
/* can't delay vision recalc after all */
/* avoid 'that does not represent any monster' for empty input */
/* "?" runs #genocided to show existing genocides, then re-prompts;
           accept "'?'" too because the prompt's hint shows it that way */
/* Although "genus" is Latin for race, the hero benefits
                 * from both race and role; thus genocide affects either.
                 */
/* This check must be first since player monsters might
                     * have G_GENOD or !G_GENO.
                     */
/* cursed effect => no free pass (unless rndmonst() fails) */
/* avoid 'such creatures do not exist' for empty input */
/* next iteration gives "that's enough tries"
                                so don't suggest typing anything this time */
/* ... but no free pass if cursed */
/* "?" or "'?'" runs #genocided to show existing genocides */
/* FIXME: unconditional "caverns" will be silly in some
                     * circumstances.  Who's speaking?  Divine pronouncements
                     * aren't supposed to be hampered by deafness....
                     */
/* FIXME? shouldn't this override deafness? */
/* KMH -- Punishment is still okay when you are riding */
/*
     *  Place ball & chain if not swallowed.  If swallowed, the ball & chain
     *  variables will be set at the next call to placebc().
     */
/* set up ball and chain variables */
/* see ball&chain if can't see self */
/* for floor, unhides monster hidden under chain, calls newsym() */
/* the chain is gone but the no longer attached ball persists */
/* NULL obj arg means put_saddle_on_mon()
             * will create the saddle itself */
