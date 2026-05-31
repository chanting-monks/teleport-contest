/* NetHack 5.0	shknam.c	$NHDT-Date: 1764109114 2025/11/25 22:18:34 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.86 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
/* shknam.c -- initialize a shop */
import { game } from '../gstate.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcmp, strcpy, strncpy } from '../c2js-runtime/string.js';
import { isok } from './cmd.js';
import { cvt_sdoor_to_door } from './detect.js';
import { newsym } from './display.js';
import { noit_mon_nam } from './do_name.js';
import { In_mines, Is_special, assign_level, depth, ledger_no, on_level } from './dungeon.js';
import { set_tin_variety } from './eat.js';
import { make_engr_at } from './engrave.js';
import { in_rooms, in_town } from './hack.js';
import { distmin, highc, letter } from './hacklib.js';
import { makemon, mkclass, mkmonmoney, mongets, newmextra, set_malign } from './makemon.js';
import { mkobj_at, mksobj_at } from './mkobj.js';
import { mongone } from './mon.js';
import { mon_learns_traps } from './mondata.js';
import { ALL_TRAPS, ARMOR_CLASS, BRASS_LANTERN, CORPSE, CORR, EGG, FOOD_CLASS, HALLUC, HALLUC_RES, LOW_PM, MAGIC_LAMP, MAXOCLASSES, NON_PM, NUMMONS, NUM_OBJECTS, OIL_LAMP, PM_BLACK_PUDDING, PM_FLESH_GOLEM, PM_LEATHER_GOLEM, PM_LICHEN, PM_SHOPKEEPER, PM_STALKER, POTION_CLASS, POT_OIL, RANDOM_CLASS, RING_CLASS, ROOM, SCROLL_CLASS, SCR_CHARGING, SCR_LIGHT, SDOOR, SHOPBASE, SPBOOK_CLASS, SPE_LIGHT, SPE_NOVEL, S_BLOB, S_ELEMENTAL, S_FUNGUS, S_GHOST, S_GOLEM, S_JELLY, S_LIGHT, S_MIMIC, S_PUDDING, S_VORTEX, TALLOW_CANDLE, TIN, TOOL_CLASS, TOUCHSTONE, VEGGY, WAND_CLASS, WAN_LIGHT, WAX_CANDLE, WEAPON_CLASS } from './nh-constants.js';
import { rn2, rnd } from './rnd.js';
import { inside_shop, shop_keeper } from './shk.js';
import { rloc } from './teleport.js';

/*
 *  Name prefix codes:
 *      dash          -  female, personal name
 *      underscore    _  female, general name
 *      plus          +  male, personal name
 *      vertical bar  |  male, general name (implied for most of shktools)
 *      equals        =  gender not specified, personal name
 *
 *  Personal names do not receive the honorific prefix "Mr." or "Ms.".
 */
const shkliquors = ["Njezjin", "Tsjernigof", "Ossipewsk", "Gorlowka", "Gomel", "Konosja", "Weliki Oestjoeg", "Syktywkar", "Sablja", "Narodnaja", "Kyzyl", "Walbrzych", "Swidnica", "Klodzko", "Raciborz", "Gliwice", "Brzeg", "Krnov", "Hradec Kralove", "Leuk", "Brig", "Brienz", "Thun", "Sarnen", "Burglen", "Elm", "Flims", "Vals", "Schuls", "Zum Loch", null];
/* Ukraine */
/* Belarus */
/* N. Russia */
/* Silezie */
/* Schweiz */
const shkbooks = ["Skibbereen", "Kanturk", "Rath Luirc", "Ennistymon", "Lahinch", "Kinnegad", "Lugnaquillia", "Enniscorthy", "Gweebarra", "Kittamagh", "Nenagh", "Sneem", "Ballingeary", "Kilgarvan", "Cahersiveen", "Glenbeigh", "Kilmihil", "Kiltamagh", "Droichead Atha", "Inniscrone", "Clonegal", "Lisnaskea", "Culdaff", "Dunfanaghy", "Inishbofin", "Kesh", null];
/* Eire */
const shkarmors = ["Demirci", "Kalecik", "Boyabai", "Yildizeli", "Gaziantep", "Siirt", "Akhalataki", "Tirebolu", "Aksaray", "Ermenak", "Iskenderun", "Kadirli", "Siverek", "Pervari", "Malasgirt", "Bayburt", "Ayancik", "Zonguldak", "Balya", "Tefenni", "Artvin", "Kars", "Makharadze", "Malazgirt", "Midyat", "Birecik", "Kirikkale", "Alaca", "Polatli", "Nallihan", null];
/* Turquie */
const shkwands = ["Yr Wyddgrug", "Trallwng", "Mallwyd", "Pontarfynach", "Rhaeader", "Llandrindod", "Llanfair-ym-muallt", "Y-Fenni", "Maesteg", "Rhydaman", "Beddgelert", "Curig", "Llanrwst", "Llanerchymedd", "Caergybi", "Nairn", "Turriff", "Inverurie", "Braemar", "Lochnagar", "Kerloch", "Beinn a Ghlo", "Drumnadrochit", "Morven", "Uist", "Storr", "Sgurr na Ciche", "Cannich", "Gairloch", "Kyleakin", "Dunvegan", null];
/* Wales */
/* Scotland */
const shkrings = ["Feyfer", "Flugi", "Gheel", "Havic", "Haynin", "Hoboken", "Imbyze", "Juyn", "Kinsky", "Massis", "Matray", "Moy", "Olycan", "Sadelin", "Svaving", "Tapper", "Terwen", "Wirix", "Ypey", "Rastegaisa", "Varjag Njarga", "Kautekeino", "Abisko", "Enontekis", "Rovaniemi", "Avasaksa", "Haparanda", "Lulea", "Gellivare", "Oeloe", "Kajaani", "Fauske", null];
/* Hollandse familienamen */
/* Skandinaviske navne */
const shkfoods = ["Djasinga", "Tjibarusa", "Tjiwidej", "Pengalengan", "Bandjar", "Parbalingga", "Bojolali", "Sarangan", "Ngebel", "Djombang", "Ardjawinangun", "Berbek", "Papar", "Baliga", "Tjisolok", "Siboga", "Banjoewangi", "Trenggalek", "Karangkobar", "Njalindoeng", "Pasawahan", "Pameunpeuk", "Patjitan", "Kediri", "Pemboeang", "Tringanoe", "Makin", "Tipor", "Semai", "Berhala", "Tegal", "Samoe", null];
/* Indonesia */
const shkweapons = ["Voulgezac", "Rouffiac", "Lerignac", "Touverac", "Guizengeard", "Melac", "Neuvicq", "Vanzac", "Picq", "Urignac", "Corignac", "Fleac", "Lonzac", "Vergt", "Queyssac", "Liorac", "Echourgnac", "Cazelon", "Eypau", "Carignan", "Monbazillac", "Jonzac", "Pons", "Jumilhac", "Fenouilledes", "Laguiolet", "Saujon", "Eymoutiers", "Eygurande", "Eauze", "Labouheyre", null];
/* Perigord */
const shktools = ["Ymla", "Eed-morra", "Elan Lapinski", "Cubask", "Nieb", "Bnowr Falr", "Sperc", "Noskcirdneh", "Yawolloh", "Hyeghu", "Niskal", "Trahnil", "Htargcm", "Enrobwem", "Kachzi Rellim", "Regien", "Donmyar", "Yelpur", "Nosnehpets", "Stewe", "Renrut", "Senna Hut", "-Zlaw", "Nosalnef", "Rewuorb", "Rellenk", "Yad", "Cire Htims", "Y-crad", "Nenilukah", "Corsh", "Aned", "Dark Eery", "Niknar", "Lapu", "Lechaim", "Rebrol-nek", "AlliWar Wickson", "Oguhmk", "Telloc Cyaj", null];
/* Spmi */
const shklight = ["Zarnesti", "Slanic", "Nehoiasu", "Ludus", "Sighisoara", "Nisipitu", "Razboieni", "Bicaz", "Dorohoi", "Vaslui", "Fetesti", "Tirgu Neamt", "Babadag", "Zimnicea", "Zlatna", "Jiu", "Eforie", "Mamaia", "Silistra", "Tulovo", "Panagyuritshte", "Smolyan", "Kirklareli", "Pernik", "Lom", "Haskovo", "Dobrinishte", "Varvara", "Oryahovo", "Troyan", "Lovech", "Sliven", null];
/* Romania */
/* Bulgaria */
const shkgeneral = ["Hebiwerie", "Possogroenoe", "Asidonhopo", "Manlobbi", "Adjama", "Pakka Pakka", "Kabalebo", "Wonotobo", "Akalapi", "Sipaliwini", "Annootok", "Upernavik", "Angmagssalik", "Aklavik", "Inuvik", "Tuktoyaktuk", "Chicoutimi", "Ouiatchouane", "Chibougamau", "Matagami", "Kipawa", "Kinojevis", "Abitibi", "Maganasipi", "Akureyri", "Kopasker", "Budereyri", "Akranes", "Bordeyri", "Holmavik", null];
/* Suriname */
/* Greenland */
/* N. Canada */
/* Iceland */
const shkhealthfoods = ["Ga'er", "Zhangmu", "Rikaze", "Jiangji", "Changdu", "Linzhi", "Shigatse", "Gyantse", "Ganden", "Tsurphu", "Lhasa", "Tsedong", "Drepung", "=Azura", "=Blaze", "=Breanna", "=Breezy", "=Dharma", "=Feather", "=Jasmine", "=Luna", "=Melody", "=Moonjava", "=Petal", "=Rhiannon", "=Starla", "=Tranquilla", "=Windsong", "=Zennia", "=Zoe", "=Zora", null];
/* Tibet */
/* Hippie names */
/*
 * To add new shop types, all that is necessary is to edit the shtypes[]
 * array.  See mkroom.h for the structure definition.  Typically, you'll
 * have to lower some or all of the probability fields in old entries to
 * free up some percentage for the new type.
 *
 * The placement type field is not yet used but might be someday.
 *
 * The iprobs array in each entry defines the probabilities for various kinds
 * of objects to be present in the given shop type.  You can associate with
 * each percentage either a generic object type (represented by one of the
 * *_CLASS enum value) or a specific object enum value.
 * In the latter case, prepend it with a unary minus so the code can know
 * (by testing the sign) whether to use mkobj() or mksobj().
 * shtypes[] is externally referenced from mkroom.c, mon.c and shk.c.
 *
 * The second, usually shorter, store type name is used in automatically
 * generated annotations for #overview.  If Null, the first name gets used.
 */
export const shtypes = [{ name: "general store", annotation: null, symb: RANDOM_CLASS, prob: 42, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkgeneral }, { name: "used armor dealership", annotation: "armor shop", symb: ARMOR_CLASS, prob: 14, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkarmors }, { name: "second-hand bookstore", annotation: "scroll shop", symb: SCROLL_CLASS, prob: 10, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkbooks }, { name: "liquor emporium", annotation: "potion shop", symb: POTION_CLASS, prob: 10, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkliquors }, { name: "antique weapons outlet", annotation: "weapon shop", symb: WEAPON_CLASS, prob: 5, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkweapons }, { name: "delicatessen", annotation: "food shop", symb: FOOD_CLASS, prob: 5, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkfoods }, { name: "jewelers", annotation: "ring shop", symb: RING_CLASS, prob: 3, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkrings }, { name: "quality apparel and accessories", annotation: "wand shop", symb: WAND_CLASS, prob: 3, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkwands }, { name: "hardware store", annotation: "tool shop", symb: TOOL_CLASS, prob: 3, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shktools }, { name: "rare books", annotation: "bookstore", symb: SPBOOK_CLASS, prob: 3, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkbooks }, { name: "health food store", annotation: "vegetarian food shop", symb: FOOD_CLASS, prob: 2, shdist: 1, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: shkhealthfoods }, { name: "lighting store", annotation: "lighting shop", symb: TOOL_CLASS, prob: 0, shdist: 1, iprobs: [{ iprob: 30, itype: -WAX_CANDLE }, { iprob: 44, itype: -TALLOW_CANDLE }, { iprob: 5, itype: -BRASS_LANTERN }, { iprob: 9, itype: -OIL_LAMP }, { iprob: 3, itype: -MAGIC_LAMP }, { iprob: 5, itype: -POT_OIL }, { iprob: 2, itype: -WAN_LIGHT }, { iprob: 1, itype: -SCR_LIGHT }, { iprob: 1, itype: -SPE_LIGHT }], shknms: shklight }, { name: null, annotation: null, symb: 0, prob: 0, shdist: 0, iprobs: [{ iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }, { iprob: 0, itype: 0 }], shknms: null }];
/* Shops below this point are "unique".  That is they must all have a
     * probability of zero.  They are only created via the special level
     * loader.
     */
/* sentinel */
/* validate shop probabilities; otherwise incorrect local changes could
   end up provoking infinite loops or wild subscripts fetching garbage */
/*0*/
/* decide whether an object or object type is considered vegetarian;
   for types, items which might go either way are assumed to be veggy */
/* used iff obj is null */
export function veggy_item(obj, otyp) {
    let corpsenm = 0;
    let oclass = 0;
    if (obj) {
        /* actual object; will check tin content and corpse species */
        otyp = obj.otyp;
        oclass = obj.oclass;
        corpsenm = obj.corpsenm;
    } else {
        /* just a type; caller will have to handle tins and corpses */
        oclass = game.objects[otyp].oc_class;
        corpsenm = PM_LICHEN;
    }
    if (oclass == FOOD_CLASS) {
        if (game.objects[otyp].oc_material == VEGGY || otyp == EGG) {
            return (1);
        }
        if (otyp == TIN && corpsenm == NON_PM) {
            return (obj.spe == 1);
        }
        if (otyp == TIN || otyp == CORPSE) {
            return (((corpsenm) >= LOW_PM && (corpsenm) < NUMMONS) && (((game.mons[corpsenm]).mlet == S_BLOB || (game.mons[corpsenm]).mlet == S_JELLY || (game.mons[corpsenm]).mlet == S_FUNGUS || (game.mons[corpsenm]).mlet == S_VORTEX || (game.mons[corpsenm]).mlet == S_LIGHT || ((game.mons[corpsenm]).mlet == S_ELEMENTAL && (game.mons[corpsenm]) != game.mons[PM_STALKER]) || ((game.mons[corpsenm]).mlet == S_GOLEM && (game.mons[corpsenm]) != game.mons[PM_FLESH_GOLEM] && (game.mons[corpsenm]) != game.mons[PM_LEATHER_GOLEM]) || ((game.mons[corpsenm]).mlet == S_GHOST)) || ((game.mons[corpsenm]).mlet == S_PUDDING && (game.mons[corpsenm]) != game.mons[PM_BLACK_PUDDING])));
        }
    }
    return (0);
}
export function shkveg() {
    let i = 0;
    let j = 0;
    let maxprob = 0;
    let prob = 0;
    let oclass = FOOD_CLASS;
    let ok = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    memset(ok, 0, 1924 /* sizeof(int [481]) */);
    j = maxprob = 0;
    for (i = game.bases[oclass]; i < NUM_OBJECTS; ++i) {
        if (game.objects[i].oc_class != oclass) {
            break;
        }
        if (veggy_item(null, i)) {
            ok[j++] = i;
            maxprob += game.objects[i].oc_prob;
        }
    }
    if (maxprob < 1) {
        panic("shkveg no veggy objects");
    }
    prob = rnd(maxprob);
    j = 0;
    i = ok[0];
    while ((prob -= game.objects[i].oc_prob) > 0) {
        j++;
        i = ok[j];
    }
    if (game.objects[i].oc_class != oclass || !(game.obj_descr[(game.objects[i]).oc_name_idx].oc_name)) {
        panic("shkveg probtype error, oclass=%d i=%d", oclass, i);
    }
    return i;
}
/* make a random item for health food store */
export function mkveggy_at(sx, sy) {
    let obj = mksobj_at(shkveg(), sx, sy, (1), (1));
    if (obj && obj.otyp == TIN) {
        set_tin_variety(obj, (-3));
    }
    return;
}
/* make an object of the appropriate type for a shop square */
export function mkshobj_at(shp, sx, sy, mkspecl) {
    let mtmp = null;
    let ptr = null;
    let atype = 0;
    if (mkspecl && (!strcmp(shp.name, "rare books") || !strcmp(shp.name, "second-hand bookstore"))) {
        let novel = mksobj_at(SPE_NOVEL, sx, sy, (0), (0));
        if (novel) {
            game.context.tribute.bookstock = (1);
        }
        return;
    }
    if (rn2(100) < depth(game.u.uz) && !(game.level.monsters[sx][sy] != null) && (ptr = mkclass(S_MIMIC, 0)) != null && (mtmp = makemon(ptr, sx, sy, 0)) != null) {} else {
        atype = get_shop_item((shp - shtypes));
        if (atype == (MAXOCLASSES + 1)) {
            mkveggy_at(sx, sy);
        } else if (atype < 0) {
            mksobj_at(-atype, sx, sy, (1), (1));
        } else {
            mkobj_at(atype, sx, sy, (1));
        }
    }
}
/* extract a shopkeeper name for the given shop type */
export function nameshk(shk, nlp) {
    let i = 0;
    let trycnt = 0;
    let names_avail = 0;
    let shname = null;
    let mtmp = null;
    let name_wanted = shk.m_id;
    let sptr = null;
    if (nlp == shklight && In_mines(game.u.uz) && (sptr = Is_special(game.u.uz)) != null && sptr.flags.town) {
        /* special-case minetown lighting shk */
        shname = "+Izchak";
        shk.female = (0);
    } else {
        /* We want variation from game to game, without needing the save
           and restore support which would be necessary for randomization;
           try not to make too many assumptions about time_t's internals;
           use ledger_no rather than depth to keep minetown distinct. */
        let nseed = (game.ubirthday / 257);
        name_wanted += ledger_no(game.u.uz) + (nseed % 13) - (nseed % 5);
        if (name_wanted < 0) {
            name_wanted += (13 + 5);
        }
        shk.female = name_wanted & 1;
        for (names_avail = 0; nlp[names_avail]; names_avail++) {
            continue;
        }
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        name_wanted = name_wanted % names_avail;
        for (trycnt = 0; trycnt < 50; trycnt++) {
            if (nlp == shktools) {
                shname = shktools[rn2(names_avail)];
                /* reversed below for '_' prefix */
                shk.female = 0;
            } else if (name_wanted < names_avail) {
                shname = nlp[name_wanted];
            } else if ((i = rn2(names_avail)) != 0) {
                shname = nlp[i - 1];
            } else if (nlp != shkgeneral) {
                nlp = shkgeneral;
                for (names_avail = 0; nlp[names_avail]; names_avail++) {
                    continue;
                }
                continue;
            } else {
                shname = shk.female ? "-Lucrezia" : "+Dirk";
            }
            if (shname == 95 || shname == 45) {
                shk.female = 1;
            } else if (shname == 124 || shname == 43) {
                shk.female = 0;
            }
            for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
                /* is name already in use on this level? */
                if (((mtmp).mhp < 1) || (mtmp == shk) || !mtmp.isshk) {
                    continue;
                }
                (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
                if (strcmp(((mtmp).mextra.eshk).shknam, shname)) {
                    continue;
                }
                name_wanted = names_avail;
                break;
            }
            if (!mtmp) {
                break;
            }
        }
    }
    ((shk).mextra.eshk).shknam = strncpy(((shk).mextra.eshk).shknam, shname, 32);
    ((shk).mextra.eshk).shknam[32 - 1] = 0;
}
export function neweshk(mtmp) {
    if (!mtmp.mextra) {
        mtmp.mextra = newmextra();
    }
    if (!((mtmp).mextra.eshk)) {
        ((mtmp).mextra.eshk) = alloc(1 /* sizeof(struct eshk) */);
    }
    memset(((mtmp).mextra.eshk), 0, 1 /* sizeof(struct eshk) */);
    ((mtmp).mextra.eshk).parentmid = mtmp.m_id;
    ((mtmp).mextra.eshk).bill_p = null;
}
export function free_eshk(mtmp) {
    if (mtmp.mextra && ((mtmp).mextra.eshk)) {
        free(((mtmp).mextra.eshk));
        ((mtmp).mextra.eshk) = null;
    }
    /* don't want mon_nam() calling shkname() */
    mtmp.isshk = 0;
}
/* find a door in room sroom which is good for shop entrance.
   returns -1 if no good door found, or the svd.doors index
   and the door coordinates in sx, sy */
export function good_shopdoor(sroom, sx, sy) {
    let i = 0;
    for (i = 0; i < sroom.doorct; i++) {
        let di = sroom.fdoor + i;
        sx.value = game.doors[di].x;
        sy.value = game.doors[di].y;
        if (sroom.irregular) {
            /* check that the shopkeeper placement is sane */
            let rmno = ((game.rooms.indexOf(sroom)) + 3);
            if (isok(sx.value - 1, sy.value) && !game.level.locations[sx.value - 1][sy.value].edge && game.level.locations[sx.value - 1][sy.value].roomno == rmno) {
                (sx.value)--;
            } else if (isok(sx.value + 1, sy.value) && !game.level.locations[sx.value + 1][sy.value].edge && game.level.locations[sx.value + 1][sy.value].roomno == rmno) {
                (sx.value)++;
            } else if (isok(sx.value, sy.value - 1) && !game.level.locations[sx.value][sy.value - 1].edge && game.level.locations[sx.value][sy.value - 1].roomno == rmno) {
                (sy.value)--;
            } else if (isok(sx.value, sy.value + 1) && !game.level.locations[sx.value][sy.value + 1].edge && game.level.locations[sx.value][sy.value + 1].roomno == rmno) {
                (sy.value)++;
            } else {
                continue;
            }
        } else if (sx.value == sroom.lx - 1) {
            (sx.value)++;
        } else if (sx.value == sroom.hx + 1) {
            (sx.value)--;
        } else if (sy.value == sroom.ly - 1) {
            (sy.value)++;
        } else if (sy.value == sroom.hy + 1) {
            (sy.value)--;
        } else {
            continue;
        }
        return di;
    }
    return -1;
}
/* create a new shopkeeper in the given room */
export function shkinit(shp, sroom) {
    let sh = 0;
    /*
     * Someday soon we'll dispatch on the shdist field of shclass to do
     * different placements in this routine. Currently it only supports
     * shop-style placement (all squares except a row nearest the first
     * door get objects).
     */
    let sx = 0;
    let sy = 0;
    let shk = null;
    let eshkp = null;
    /* place the shopkeeper in the given room */
    sh = good_shopdoor(sroom, { get value() { return sx; }, set value(_v) { sx = _v; } }, { get value() { return sy; }, set value(_v) { sy = _v; } });
    if (sh < 0) {
        if (game.flags.debug) {
            /* Said to happen sometimes, but I have never seen it. */
            /* Supposedly fixed by fdoor change in mklev.c */
            let j = sroom.doorct;
            impossible("Where is shopdoor?");
            pline("Room at (%d,%d),(%d,%d).", sroom.lx, sroom.ly, sroom.hx, sroom.hy);
            pline("doormax=%d doorct=%d fdoor=%d", game.doorindex, sroom.doorct, sh);
            while (j--) {
                pline("door [%d,%d]", game.doors[sh].x, game.doors[sh].y);
                sh++;
            }
            (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        }
        return -1;
    }
    if ((game.level.monsters[sx][sy] != null)) {
        rloc((game.level.monsters[sx][sy]), 4);
    }
    /* now initialize the shopkeeper monster structure */
    if (!(shk = makemon(game.mons[PM_SHOPKEEPER], sx, sy, 512))) {
        return -1;
    }
    /* makemon(...,MM_ESHK) allocates this */
    eshkp = ((shk).mextra.eshk);
    shk.isshk = shk.mpeaceful = 1;
    set_malign(shk);
    shk.msleeping = 0;
    /* we know all the traps already */
    mon_learns_traps(shk, ALL_TRAPS);
    eshkp.shoproom = ((game.rooms.indexOf(sroom)) + 3);
    sroom.resident = shk;
    eshkp.shoptype = sroom.rtype;
    assign_level(eshkp.shoplevel, game.u.uz);
    eshkp.shd = game.doors[sh];
    eshkp.shk.x = sx;
    eshkp.shk.y = sy;
    eshkp.robbed = eshkp.credit = eshkp.debit = eshkp.loan = 0;
    eshkp.following = eshkp.surcharge = eshkp.dismiss_kops = (0);
    eshkp.billct = eshkp.visitct = 0;
    eshkp.bill_p = null;
    eshkp.customer[0] = 0;
    mkmonmoney(shk, 1000 + 30 * rnd(100));
    if (shp.shknms == shkrings) {
        mongets(shk, TOUCHSTONE);
    }
    if (shp.shknms == shktools || shp.shknms == shkwands || (shp.shknms == shkrings && rn2(2)) || (shp.shknms == shkgeneral && rn2(5))) {
        mongets(shk, SCR_CHARGING);
    }
    nameshk(shk, shp.shknms);
    return sh;
}
export function stock_room_goodpos(sroom, rmno, sh, sx, sy) {
    if (sroom.irregular) {
        if (game.level.locations[sx][sy].edge || game.level.locations[sx][sy].roomno != rmno || distmin(sx, sy, game.doors[sh].x, game.doors[sh].y) <= 1) {
            /* only generate items on solid floor squares */
            return (0);
        }
    } else if ((sx == sroom.lx && game.doors[sh].x == sx - 1) || (sx == sroom.hx && game.doors[sh].x == sx + 1) || (sy == sroom.ly && game.doors[sh].y == sy - 1) || (sy == sroom.hy && game.doors[sh].y == sy + 1)) {
        return (0);
    }
    if (!((game.level.locations[sx][sy].typ) >= ROOM)) {
        return (0);
    }
    return (1);
}
/* stock a newly-created room with objects */
export function stock_room(shp_indx, sroom) {
    let sx = 0;
    let sy = 0;
    let sh = 0;
    let stockcount = 0;
    let specialspot = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let rmno = ((game.rooms.indexOf(sroom)) + 3);
    let shp = shtypes[shp_indx];
    /* first, try to place a shopkeeper in the room */
    if ((sh = shkinit(shp, sroom)) < 0) {
        return;
    }
    /* make sure no doorways without doors, and no trapped doors, in shops */
    sx = game.doors[sroom.fdoor].x;
    sy = game.doors[sroom.fdoor].y;
    if (game.level.locations[sx][sy].flags == 0) {
        game.level.locations[sx][sy].flags = 2;
        newsym(sx, sy);
    }
    if (game.level.locations[sx][sy].typ == SDOOR) {
        cvt_sdoor_to_door(game.level.locations[sx][sy]);
        newsym(sx, sy);
    }
    if (game.level.locations[sx][sy].flags & 16) {
        game.level.locations[sx][sy].flags = 8;
    }
    if (game.level.locations[sx][sy].flags == 8) {
        let m = sx;
        let n = sy;
        if (inside_shop(sx + 1, sy)) {
            m--;
        } else if (inside_shop(sx - 1, sy)) {
            m++;
        }
        if (inside_shop(sx, sy + 1)) {
            n--;
        } else if (inside_shop(sx, sy - 1)) {
            n++;
        }
        buf = sprintf(buf, "Closed for inventory");
        make_engr_at(m, n, buf, null, 0, 1);
        if (game.level.locations[m][n].typ != CORR && game.level.locations[m][n].typ != ROOM) {
            game.level.locations[m][n].typ = (Is_special(game.u.uz) || in_rooms(m, n, 0)) ? ROOM : CORR;
        }
    }
    if (game.context.tribute.enabled && !game.context.tribute.bookstock) {
        /*
         * Out of the number of spots where we're actually
         * going to put stuff, randomly single out one in particular.
         */
        for (sx = sroom.lx; sx <= sroom.hx; sx++) {
            for (sy = sroom.ly; sy <= sroom.hy; sy++) {
                if (stock_room_goodpos(sroom, rmno, sh, sx, sy)) {
                    stockcount++;
                }
            }
        }
        specialspot = rnd(stockcount);
        stockcount = 0;
    }
    for (sx = sroom.lx; sx <= sroom.hx; sx++) {
        for (sy = sroom.ly; sy <= sroom.hy; sy++) {
            if (stock_room_goodpos(sroom, rmno, sh, sx, sy)) {
                stockcount++;
                mkshobj_at(shp, sx, sy, ((stockcount) && (stockcount == specialspot)));
            }
        }
    }
    if (on_level(game.u.uz, (game.dungeon_topology.d_orcus_level))) {
        /*
     * Special monster placements (if any) should go here: that way,
     * monsters will sit on top of objects and not the other way around.
     */
        /* Hack for Orcus's level: it's a ghost town, get rid of shopkeepers */
        let mtmp = shop_keeper(rmno);
        mongone(mtmp);
    }
    game.level.flags.has_shop = (1);
}
/* does shkp's shop stock this item type? */
export function saleable(shkp, obj) {
    let i = 0;
    let shp_indx = ((shkp).mextra.eshk).shoptype - SHOPBASE;
    let shp = shtypes[shp_indx];
    if (shp.symb == RANDOM_CLASS) {
        return (1);
    }
    for (i = 0; i < (Math.trunc(9 /* sizeof(struct itp const[9]) */ / 1 /* sizeof(const struct itp) */)) && shp.iprobs[i].iprob; i++) {
        if (shp.iprobs[i].itype == (MAXOCLASSES + 1)) {
            /* pseudo-class needs special handling */
            if (veggy_item(obj, 0)) {
                return (1);
            }
        } else if ((shp.iprobs[i].itype < 0) ? shp.iprobs[i].itype == -obj.otyp : shp.iprobs[i].itype == obj.oclass) {
            return (1);
        }
    }
    return (0);
}
/* positive value: class; negative value: specific object type.
   can also return non-existing object class (eg. VEGETARIAN_CLASS) */
export function get_shop_item(type) {
    let shp = shtypes + type;
    let i = 0;
    let j = 0;
    /* select an appropriate object type at random */
    for (j = rnd(100) , i = 0; (j -= shp.iprobs[i].iprob) > 0; i++) {
        continue;
    }
    return shp.iprobs[i].itype;
}
/* version of shkname() for beginning of sentence */
export function Shknam(mtmp) {
    let nam = shkname(mtmp);
    /* 'nam[]' is almost certainly already capitalized, but be sure */
    nam[0] = highc(nam[0]);
    return nam;
}
/* shopkeeper's name, without any visibility constraint; if hallucinating,
   will yield some other shopkeeper's name (not necessarily one residing
   in the current game's dungeon, or who keeps same type of shop) */
export function shkname(mtmp) {
    let nam = null;
    let save_isshk = mtmp.isshk;
    mtmp.isshk = 0;
    /* get a modifiable name buffer along with fallback result */
    nam = noit_mon_nam(mtmp);
    mtmp.isshk = save_isshk;
    if (!mtmp.isshk) {
        impossible("shkname: \"%s\" is not a shopkeeper.", nam);
    } else if (!((mtmp).mextra && ((mtmp).mextra.eshk))) {
        panic("shkname: shopkeeper \"%s\" lacks 'eshk' data.", nam);
    } else {
        let shknm = ((mtmp).mextra.eshk).shknam;
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !game.program_state.gameover) {
            let nlp = null;
            let num = 0;
            /* count the number of non-unique shop types;
               pick one randomly, ignoring shop generation probabilities;
               pick a name at random from that shop type's list */
            for (num = 0; num < (Math.trunc(13 /* sizeof(const struct shclass [13]) */ / 1 /* sizeof(const struct shclass) */)); num++) {
                if (shtypes[num].prob == 0) {
                    break;
                }
            }
            if (num > 0) {
                nlp = shtypes[rn2(num)].shknms;
                for (num = 0; nlp[num]; num++) {
                    continue;
                }
                if (num > 0) {
                    shknm = nlp[rn2(num)];
                }
            }
        }
        if (!letter(shknm)) {
            ++shknm;
        }
        nam = strcpy(nam, shknm);
    }
    return nam;
}
export function shkname_is_pname(mtmp) {
    let shknm = ((mtmp).mextra.eshk).shknam;
    return (shknm == 45 || shknm == 43 || shknm == 61);
}
export function is_izchak(shkp, override_hallucination) {
    let shknm = null;
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !override_hallucination) {
        return (0);
    }
    if (!shkp.isshk) {
        return (0);
    }
    /* outside of town, Izchak becomes just an ordinary shopkeeper */
    if (!in_town(shkp.mx, shkp.my)) {
        return (0);
    }
    shknm = ((shkp).mextra.eshk).shknam;
    if (!letter(shknm)) {
        ++shknm;
    }
    return !strcmp(shknm, "Izchak");
}
/*shknam.c*/
