/* NetHack 5.0	iactions.c	$NHDT-Date: 1762680996 2025/11/09 01:36:36 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.543 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Pasi Kallinen, 2026. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_char_at0, __nh_char_write, strcpy } from '../c2js-runtime/string.js';
import { doapply, dorub } from './apply.js';
import { doinvoke, undiscovered_artifact } from './artifact.js';
import { cmdq_add_ec, cmdq_add_key, do_reqmenu } from './cmd.js';
import { cg } from './decl.js';
import { nul_glyphinfo } from './display.js';
import { dodrop, donull } from './do.js';
import { call_ok, docallcmd, name_ok } from './do_name.js';
import { dowear, ia_dotakeoff, remarm_swapwep } from './do_wear.js';
import { dofire, dothrow } from './dothrow.js';
import { surface } from './dungeon.js';
import { doeat, is_edible } from './eat.js';
import { doengrave } from './engrave.js';
import { in_rooms } from './hack.js';
import { adjust_split, carrying, check_invent_gold, doorganize } from './invent.js';
import { ALCHEMY_SMOCK, ALTAR, AMULET_CLASS, AMULET_OF_YENDOR, ARMOR_CLASS, ART_EYES_OF_THE_OVERWORLD, BAG_OF_TRICKS, BEARTRAP, BELL, BELL_OF_OPENING, BLINDFOLD, BRASS_LANTERN, BULLWHIP, CANDELABRUM_OF_INVOCATION, CAN_OF_GREASE, COIN_CLASS, CORPSE, CQ_CANNED, CREAM_PIE, CREDIT_CARD, CRYSTAL_BALL, DRUM_OF_EARTHQUAKE, DWARVISH_MATTOCK, EUCALYPTUS_LEAF, EXPENSIVE_CAMERA, FAKE_AMULET_OF_YENDOR, FIGURINE, FINGER, FLINT, FORTUNE_COOKIE, GEM_CLASS, GETOBJ_SUGGEST, GOLD_PIECE, GRAPPLING_HOOK, HAND, HAWAIIAN_SHIRT, HEAVY_IRON_BALL, HORN_OF_PLENTY, LAND_MINE, LARGE_BOX, LEASH, LENSES, LOADSTONE, LOCK_PICK, LUCKSTONE, MAGIC_LAMP, MAGIC_MARKER, MAGIC_WHISTLE, MEAT_RING, MIRROR, OIL_LAMP, PICK_AXE, POTION_CLASS, POT_OIL, P_BOOMERANG, P_BOW, P_CROSSBOW, P_DAGGER, P_DART, P_NONE, P_SABER, RING_CLASS, SADDLE, SCROLL_CLASS, SCR_BLANK_PAPER, SCR_MAIL, SHOPBASE, SKELETON_KEY, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_NOVEL, STETHOSCOPE, TALLOW_CANDLE, TIN, TINNING_KIT, TIN_OPENER, TIN_WHISTLE, TOOL_CLASS, TOUCHSTONE, TOWEL, T_SHIRT, UNICORN_HORN, WAND_CLASS, WAX_CANDLE, WEAPON_CLASS, WOODEN_FLUTE } from './nh-constants.js';
import { an, armor_simple_name, cxname, makeplural, simpleonames, the, the_unique_obj } from './objnam.js';
import { dowhatis, ia_checkfile } from './pager.js';
import { dotip } from './pickup.js';
import { body_part } from './polyself.js';
import { dip_into, dodrink } from './potion.js';
import { dosacrifice } from './pray.js';
import { doread } from './read.js';
import { dopay, inhishop, shop_keeper } from './shk.js';
import { doswapweapon, dotwoweapon, dowield, dowieldquiver } from './wield.js';
import { add_menu, select_menu } from './windows.js';
import { armcat_to_wornmask, wearmask_to_obj } from './worn.js';
import { dozap } from './zap.js';

export const IA_NONE = 0;
export const IA_UNWIELD = 1;
export const IA_APPLY_OBJ = 2;
export const IA_DIP_OBJ = 3;
export const IA_NAME_OBJ = 4;
export const IA_NAME_OTYP = 5;
export const IA_DROP_OBJ = 6;
export const IA_EAT_OBJ = 7;
export const IA_ENGRAVE_OBJ = 8;
export const IA_FIRE_OBJ = 9;
export const IA_ADJUST_OBJ = 10;
export const IA_ADJUST_STACK = 11;
export const IA_SACRIFICE = 12;
export const IA_BUY_OBJ = 13;
export const IA_QUAFF_OBJ = 14;
export const IA_QUIVER_OBJ = 15;
export const IA_READ_OBJ = 16;
export const IA_RUB_OBJ = 17;
export const IA_THROW_OBJ = 18;
export const IA_TAKEOFF_OBJ = 19;
export const IA_TIP_CONTAINER = 20;
export const IA_INVOKE_OBJ = 21;
export const IA_WIELD_OBJ = 22;
export const IA_WEAR_OBJ = 23;
export const IA_SWAPWEAPON = 24;
export const IA_TWOWEAPON = 25;
export const IA_ZAP_OBJ = 26;
export const IA_WHATIS_OBJ = 27;
/* hack for 'w-' */
/* 'a' */
/* 'a' on a potion == dip */
/* 'c' name individual item */
/* 'C' name item's type */
/* 'd' */
/* 'e' */
/* 'E' */
/* 'f' */
/* 'i' #adjust inventory letter */
/* 'I' #adjust with count to split stack */
/* 'O' offer sacrifice */
/* 'p' pay shopkeeper */
/* '/' specify inventory object */
/* construct text for the menu entries for IA_NAME_OBJ and IA_NAME_OTYP */
const __item_naming_classification_Name = "Name";
const __item_naming_classification_Rename = "Rename or un-name";
const __item_naming_classification_Call = "Call";
/* "re-call" seems a bit weird, but "recall" and
           "rename" don't fit for changing a type name */
const __item_naming_classification_Recall = "Re-call or un-call";
export async function item_naming_classification(obj, onamebuf, ocallbuf) {
    (ocallbuf = __nh_char_write(ocallbuf, 0, 0), onamebuf = __nh_char_write(onamebuf, 0, 0));
    if (name_ok(obj) == GETOBJ_SUGGEST) {
        onamebuf = sprintf(onamebuf, "%s %s %s", (!((obj).oextra && ((obj).oextra.oname)) || !__nh_char_at0(((obj).oextra.oname))) ? __item_naming_classification_Name : __item_naming_classification_Rename, the_unique_obj(obj) ? "the" : !((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "this specific" : "this stack of", await simpleonames(obj));
    }
    if (call_ok(obj) == GETOBJ_SUGGEST) {
        let callname = await simpleonames(obj);
        if (the_unique_obj(obj)) {
            callname = await the(callname);
        } else if (!((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD)))) {
            callname = await makeplural(callname);
        }
        ocallbuf = sprintf(ocallbuf, "%s the type for %s", (!game.objects[obj.otyp].oc_uname || !__nh_char_at0(game.objects[obj.otyp].oc_uname)) ? __item_naming_classification_Call : __item_naming_classification_Recall, callname);
    }
    return (__nh_char_at0(onamebuf) || __nh_char_at0(ocallbuf)) ? (1) : (0);
}
/* construct text for the menu entries for IA_READ_OBJ */
export async function item_reading_classification(obj, outbuf) {
    let otyp = obj.otyp;
    let res = IA_READ_OBJ;
    outbuf.value = 0;
    if (otyp == FORTUNE_COOKIE) {
        outbuf = strcpy(outbuf, "Read the message inside this cookie");
    } else if (otyp == T_SHIRT) {
        outbuf = strcpy(outbuf, "Read the slogan on the shirt");
    } else if (otyp == ALCHEMY_SMOCK) {
        outbuf = strcpy(outbuf, "Read the slogan on the apron");
    } else if (otyp == HAWAIIAN_SHIRT) {
        outbuf = strcpy(outbuf, "Look at the pattern on the shirt");
    } else if (obj.oclass == SCROLL_CLASS) {
        let magic = ((obj.dknown && otyp != SCR_MAIL && (otyp != SCR_BLANK_PAPER || !game.objects[otyp].oc_name_known)) ? " to activate its magic" : "");
        outbuf = sprintf(outbuf, "Read this scroll%s", magic);
    } else if (obj.oclass == SPBOOK_CLASS) {
        let novel = (otyp == SPE_NOVEL);
        let blank = (otyp == SPE_BLANK_PAPER && game.objects[otyp].oc_name_known);
        let tome = (otyp == SPE_BOOK_OF_THE_DEAD && game.objects[otyp].oc_name_known);
        outbuf = sprintf(outbuf, "%s this %s", (novel || blank) ? "Read" : tome ? "Examine" : "Study", novel ? await simpleonames(obj) : tome ? "tome" : "spellbook");
    } else {
        res = IA_NONE;
    }
    return res;
}
export async function ia_addmenu(win, act, let_, txt) {
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let clr = 8;
    Object.assign(any, cg.zeroany);
    any.a_int = act;
    await add_menu(win, nul_glyphinfo, any, let_, 0, 0, clr, txt, 0);
}
/* set up a command to execute on a specific item next */
export async function itemactions_pushkeys(otmp, act) {
    switch (act) {
        default:
            await impossible("Unknown item action %d", act);
            break;
        case IA_NONE:
            break;
        case IA_UNWIELD:
            cmdq_add_ec(CQ_CANNED, (otmp == game.uwep) ? dowield : (otmp == game.uswapwep) ? remarm_swapwep : (otmp == game.uquiver) ? dowieldquiver : donull);
            cmdq_add_key(CQ_CANNED, 45);
            break;
        case IA_APPLY_OBJ:
            cmdq_add_ec(CQ_CANNED, doapply);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_DIP_OBJ:
            cmdq_add_ec(CQ_CANNED, dip_into);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_NAME_OBJ:
        case IA_NAME_OTYP:
            cmdq_add_ec(CQ_CANNED, docallcmd);
            cmdq_add_key(CQ_CANNED, (act == IA_NAME_OBJ) ? 105 : 111);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_DROP_OBJ:
            cmdq_add_ec(CQ_CANNED, dodrop);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_EAT_OBJ:
            cmdq_add_ec(CQ_CANNED, do_reqmenu);
            cmdq_add_ec(CQ_CANNED, doeat);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_ENGRAVE_OBJ:
            cmdq_add_ec(CQ_CANNED, doengrave);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_FIRE_OBJ:
            cmdq_add_ec(CQ_CANNED, dofire);
            break;
        case IA_ADJUST_OBJ:
            cmdq_add_ec(CQ_CANNED, doorganize);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_ADJUST_STACK:
            cmdq_add_ec(CQ_CANNED, adjust_split);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_SACRIFICE:
            cmdq_add_ec(CQ_CANNED, dosacrifice);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_BUY_OBJ:
            cmdq_add_ec(CQ_CANNED, dopay);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_QUAFF_OBJ:
            cmdq_add_ec(CQ_CANNED, do_reqmenu);
            cmdq_add_ec(CQ_CANNED, dodrink);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_QUIVER_OBJ:
            cmdq_add_ec(CQ_CANNED, dowieldquiver);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_READ_OBJ:
            cmdq_add_ec(CQ_CANNED, doread);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_RUB_OBJ:
            cmdq_add_ec(CQ_CANNED, dorub);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_THROW_OBJ:
            cmdq_add_ec(CQ_CANNED, dothrow);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_TAKEOFF_OBJ:
            cmdq_add_ec(CQ_CANNED, ia_dotakeoff);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_TIP_CONTAINER:
            cmdq_add_ec(CQ_CANNED, do_reqmenu);
            cmdq_add_ec(CQ_CANNED, dotip);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_INVOKE_OBJ:
            cmdq_add_ec(CQ_CANNED, doinvoke);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_WIELD_OBJ:
            cmdq_add_ec(CQ_CANNED, dowield);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_WEAR_OBJ:
            cmdq_add_ec(CQ_CANNED, dowear);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_SWAPWEAPON:
            cmdq_add_ec(CQ_CANNED, doswapweapon);
            break;
        case IA_TWOWEAPON:
            cmdq_add_ec(CQ_CANNED, dotwoweapon);
            break;
        case IA_ZAP_OBJ:
            cmdq_add_ec(CQ_CANNED, dozap);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
        case IA_WHATIS_OBJ:
            cmdq_add_ec(CQ_CANNED, dowhatis);
            /* "i" == item from inventory */
            cmdq_add_key(CQ_CANNED, 105);
            cmdq_add_key(CQ_CANNED, otmp.invlet);
            break;
    }
}
/* Show menu of possible actions hero could do with item otmp */
export async function itemactions(otmp) {
    let n = 0;
    let act = IA_NONE;
    let win = 0;
    let buf = '';
    let buf2 = '';
    let selected = null;
    let mtmp = null;
    let light = otmp.lamplit ? "Extinguish" : "Light";
    let already_worn = (otmp.owornmask & ((1 | 2 | 4 | 8 | 16 | 32 | 64) | ((131072 | 262144) | 65536 | 524288))) != 0;
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    if (otmp == game.uwep || otmp == game.uswapwep || otmp == game.uquiver) {
        /* -: unwield; picking current weapon offers an opportunity for 'w-'
       to wield bare/gloved hands; likewise for 'Q-' with quivered item(s) */
        let verb = (otmp == game.uquiver) ? "Quiver" : "Wield";
        let action = (otmp == game.uquiver) ? "un-ready" : "un-wield";
        let which = ((otmp).quan != 1 || ((otmp).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "these" : "this";
        let what = ((otmp.oclass == WEAPON_CLASS || ((otmp).oclass == TOOL_CLASS && game.objects[(otmp).otyp].oc_subtyp != P_NONE)) ? "weapon" : "item");
        buf = sprintf(buf, "%s '%c' to %s %s %s", verb, 45, action, which, ((otmp).quan != 1 || ((otmp).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? await makeplural(what) : what);
        await ia_addmenu(win, IA_UNWIELD, 45, buf);
    }
    if (otmp.oclass == COIN_CLASS) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Flip a coin");
    } else if (otmp.otyp == CREAM_PIE) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Hit yourself with this cream pie");
    } else if (otmp.otyp == BULLWHIP) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Lash out with this whip");
    } else if (otmp.otyp == GRAPPLING_HOOK) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Grapple something with this hook");
    } else if (otmp.otyp == BAG_OF_TRICKS && game.objects[otmp.otyp].oc_name_known) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Reach into this bag");
    } else if (((otmp).otyp >= LARGE_BOX && (otmp).otyp <= BAG_OF_TRICKS)) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Open this container");
    } else if (otmp.otyp == CAN_OF_GREASE) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Use the can to grease an item");
    } else if (otmp.otyp == LOCK_PICK || otmp.otyp == CREDIT_CARD || otmp.otyp == SKELETON_KEY) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Use this tool to pick a lock");
    } else if (otmp.otyp == TINNING_KIT) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Use this kit to tin a corpse");
    } else if (otmp.otyp == LEASH) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Tie a pet to this leash");
    } else if (otmp.otyp == SADDLE) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Place this saddle on a pet");
    } else if (otmp.otyp == MAGIC_WHISTLE || otmp.otyp == TIN_WHISTLE) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Blow this whistle");
    } else if (otmp.otyp == EUCALYPTUS_LEAF) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Use this leaf as a whistle");
    } else if (otmp.otyp == STETHOSCOPE) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Listen through the stethoscope");
    } else if (otmp.otyp == MIRROR) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Show something its reflection");
    } else if (otmp.otyp == BELL || otmp.otyp == BELL_OF_OPENING) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Ring the bell");
    } else if (otmp.otyp == CANDELABRUM_OF_INVOCATION) {
        buf = sprintf(buf, "%s the candelabrum", light);
        await ia_addmenu(win, IA_APPLY_OBJ, 97, buf);
    } else if (otmp.otyp == WAX_CANDLE || otmp.otyp == TALLOW_CANDLE) {
        let multiple = (otmp.quan == 1) ? (0) : (1);
        let s = multiple ? "these" : "this";
        let o = carrying(CANDELABRUM_OF_INVOCATION);
        if (o && o.spe < 7) {
            buf = sprintf(buf, "Attach %s to your candelabrum, or %s %s", s, !otmp.lamplit ? "light" : "extinguish", multiple ? "them" : "it");
        } else {
            buf = sprintf(buf, "%s %s %s", light, s, await simpleonames(otmp));
        }
        await ia_addmenu(win, IA_APPLY_OBJ, 97, buf);
    } else if (otmp.otyp == OIL_LAMP || otmp.otyp == MAGIC_LAMP || otmp.otyp == BRASS_LANTERN) {
        buf = sprintf(buf, "%s this light source", light);
        await ia_addmenu(win, IA_APPLY_OBJ, 97, buf);
    } else if (otmp.otyp == POT_OIL && game.objects[otmp.otyp].oc_name_known) {
        buf = sprintf(buf, "%s this oil", light);
        await ia_addmenu(win, IA_APPLY_OBJ, 97, buf);
    } else if (otmp.oclass == POTION_CLASS) {
        buf = sprintf(buf, "Dip something into %s potion%s", ((otmp).quan != 1 || ((otmp).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "one of these" : "this", (((otmp.quan) == 1) ? "" : "s"));
        await ia_addmenu(win, IA_DIP_OBJ, 97, buf);
    } else if (otmp.otyp == EXPENSIVE_CAMERA) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Take a photograph");
    } else if (otmp.otyp == TOWEL) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Clean yourself off with this towel");
    } else if (otmp.otyp == CRYSTAL_BALL) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Peer into this crystal ball");
    } else if (otmp.otyp == MAGIC_MARKER) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Write on something with this marker");
    } else if (otmp.otyp == FIGURINE) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Make this figurine transform");
    } else if (otmp.otyp == UNICORN_HORN) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Use this unicorn horn");
    } else if (otmp.otyp == HORN_OF_PLENTY && game.objects[otmp.otyp].oc_name_known) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Blow into the horn of plenty");
    } else if (otmp.otyp >= WOODEN_FLUTE && otmp.otyp <= DRUM_OF_EARTHQUAKE) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Play this musical instrument");
    } else if (otmp.otyp == LAND_MINE || otmp.otyp == BEARTRAP) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Arm this trap");
    } else if (otmp.otyp == PICK_AXE || otmp.otyp == DWARVISH_MATTOCK) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Dig with this digging tool");
    } else if (otmp.oclass == WAND_CLASS) {
        await ia_addmenu(win, IA_APPLY_OBJ, 97, "Break this wand");
    }
    if (await item_naming_classification(otmp, buf, buf2)) {
        if (buf) {
            await ia_addmenu(win, IA_NAME_OBJ, 99, buf);
        }
        if (buf2) {
            await ia_addmenu(win, IA_NAME_OTYP, 67, buf2);
        }
    }
    if (!already_worn) {
        buf = sprintf(buf, "Drop this %s", (otmp.quan > 1) ? "stack" : "item");
        await ia_addmenu(win, IA_DROP_OBJ, 100, buf);
    }
    if (otmp.otyp == TIN) {
        buf = sprintf(buf, "Open %s%s and eat the contents", (otmp.quan > 1) ? "one of these tins" : "this tin", (otmp.otyp == TIN && game.uwep && game.uwep.otyp == TIN_OPENER) ? " with your tin opener" : "");
        await ia_addmenu(win, IA_EAT_OBJ, 101, buf);
    } else if (is_edible(otmp)) {
        buf = sprintf(buf, "Eat %s", (otmp.quan > 1) ? "one of these" : "this");
        await ia_addmenu(win, IA_EAT_OBJ, 101, buf);
    }
    if (otmp.otyp == TOWEL) {
        await ia_addmenu(win, IA_ENGRAVE_OBJ, 69, "Wipe the floor with this towel");
    } else if (otmp.otyp == MAGIC_MARKER) {
        await ia_addmenu(win, IA_ENGRAVE_OBJ, 69, "Scribble graffiti on the floor");
    } else if (otmp.oclass == WEAPON_CLASS || otmp.oclass == WAND_CLASS || otmp.oclass == GEM_CLASS || otmp.oclass == RING_CLASS) {
        buf = sprintf(buf, "%s on the %s with %s", ((otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp >= P_DAGGER && game.objects[otmp.otyp].oc_subtyp <= P_SABER) || otmp.oclass == WAND_CLASS || ((otmp.oclass == GEM_CLASS || otmp.oclass == RING_CLASS) && game.objects[otmp.otyp].oc_tough)) ? "Engrave" : "Write", surface(game.u.ux, game.u.uy), (otmp.quan > 1) ? "one of these items" : "this item");
        await ia_addmenu(win, IA_ENGRAVE_OBJ, 69, buf);
    }
    if (otmp == game.uquiver) {
        let shoot = (((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp));
        buf = sprintf(buf, "%s %s", shoot ? "Shoot" : "Throw", (otmp.quan > 1) ? "one of these" : "this");
        if (shoot) {
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            buf = __nh_buf_append(buf, sprintf('', " with your wielded %s", await simpleonames(game.uwep)));
        }
        await ia_addmenu(win, IA_FIRE_OBJ, 102, buf);
    }
    if (otmp.oclass != COIN_CLASS || await check_invent_gold("item-action")) {
        await ia_addmenu(win, IA_ADJUST_OBJ, 105, "Adjust inventory by assigning new letter");
    }
    /* I: #adjust inventory item by splitting its stack  */
    if (otmp.quan > 1 && otmp.oclass != COIN_CLASS) {
        await ia_addmenu(win, IA_ADJUST_STACK, 73, "Adjust inventory by splitting this stack");
    }
    if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR) && !game.u.uswallow) {
        if (otmp.otyp == CORPSE) {
            await ia_addmenu(win, IA_SACRIFICE, 79, "Offer this corpse as a sacrifice at this altar");
        } else if (otmp.otyp == AMULET_OF_YENDOR || otmp.otyp == FAKE_AMULET_OF_YENDOR) {
            await ia_addmenu(win, IA_SACRIFICE, 79, "Offer this amulet as a sacrifice at this altar");
        }
    }
    if (otmp.unpaid && (mtmp = await shop_keeper(in_rooms(game.u.ux, game.u.uy, SHOPBASE))) != null && inhishop(mtmp)) {
        buf = sprintf(buf, "Buy this unpaid %s", (otmp.quan > 1) ? "stack" : "item");
        await ia_addmenu(win, IA_BUY_OBJ, 112, buf);
    }
    if (!already_worn) {
        /* FIXME: should also handle player owned container (so not
           flagged 'unpaid') holding shop owned items */
        /* if 'otmp' is worn, we'll skip 'P' and show 'R' below;
           if not worn, we show 'P - Put on this <simple-item>' if
           the slot is available, or 'P - <unavailable>'; for the latter,
           'P' will fail but we don't want to omit the choice because
           item actions can be used to learn commands */
        buf = '';
        if (otmp.oclass == AMULET_CLASS) {
            buf = strcpy(buf, !game.uamul ? "Put this amulet on" : "[already wearing an amulet]");
        } else if (otmp.oclass == RING_CLASS || otmp.otyp == MEAT_RING) {
            if (!game.uleft || !game.uright) {
                buf = strcpy(buf, "Put this ring on");
            } else {
                buf = sprintf(buf, "[both ring %s in use]", await makeplural(await body_part(FINGER)));
            }
        } else if (otmp.otyp == BLINDFOLD || otmp.otyp == TOWEL || otmp.otyp == LENSES) {
            if (game.ublindf) {
                buf = strcpy(buf, "[already wearing eyewear]");
            } else if (otmp.otyp == LENSES) {
                buf = strcpy(buf, "Put these lenses on");
            } else {
                buf = sprintf(buf, "Put this on%s", (otmp.otyp == TOWEL) ? " to blindfold yourself" : "");
            }
        }
        if (buf) {
            await ia_addmenu(win, IA_WEAR_OBJ, 80, buf);
        }
    }
    if (otmp.oclass == POTION_CLASS) {
        buf = sprintf(buf, "Quaff (drink) %s", (otmp.quan > 1) ? "one of these potions" : "this potion");
        await ia_addmenu(win, IA_QUAFF_OBJ, 113, buf);
    }
    /* Q: quiver throwable item */
    if ((otmp.oclass == GEM_CLASS || otmp.oclass == WEAPON_CLASS) && otmp != game.uquiver) {
        buf = sprintf(buf, "Quiver this %s for easy %s with 'f'ire", (otmp.quan > 1) ? "stack" : "item", (((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp)) ? "shooting" : "throwing");
        await ia_addmenu(win, IA_QUIVER_OBJ, 81, buf);
    }
    if (await item_reading_classification(otmp, buf) == IA_READ_OBJ) {
        await ia_addmenu(win, IA_READ_OBJ, 114, buf);
    }
    /* R: remove accessory or rub item */
    if (otmp.owornmask & ((131072 | 262144) | 65536 | 524288)) {
        buf = sprintf(buf, "Remove this %s", (otmp.owornmask & 65536) ? "amulet" : (otmp.owornmask & (131072 | 262144)) ? "ring" : (otmp.owornmask & 524288) ? "eyewear" : "accessory");
        await ia_addmenu(win, IA_TAKEOFF_OBJ, 82, buf);
    }
    if (otmp.otyp == OIL_LAMP || otmp.otyp == MAGIC_LAMP || otmp.otyp == BRASS_LANTERN) {
        buf = sprintf(buf, "Rub this %s", await simpleonames(otmp));
        await ia_addmenu(win, IA_RUB_OBJ, 82, buf);
    } else if (otmp.oclass == GEM_CLASS && ((otmp).otyp == LUCKSTONE || (otmp).otyp == LOADSTONE || (otmp).otyp == FLINT || (otmp).otyp == TOUCHSTONE)) {
        await ia_addmenu(win, IA_RUB_OBJ, 82, "Rub something on this stone");
    }
    if (!already_worn) {
        let shoot = (((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp));
        buf = sprintf(buf, "%s %s%s", shoot ? "Shoot" : "Throw", (otmp.quan == 1) ? "this item" : (otmp.otyp == GOLD_PIECE) ? "them" : "one of these", (otmp == game.uquiver && (otmp.otyp != GOLD_PIECE || otmp.quan == 1)) ? " (same as 'f')" : "");
        await ia_addmenu(win, IA_THROW_OBJ, 116, buf);
    }
    /* T: take off armor, tip carried container */
    if (otmp.owornmask & (1 | 2 | 4 | 8 | 16 | 32 | 64)) {
        await ia_addmenu(win, IA_TAKEOFF_OBJ, 84, "Take off this armor");
    }
    if ((((otmp).otyp >= LARGE_BOX && (otmp).otyp <= BAG_OF_TRICKS) && (((otmp).cobj != null) || !otmp.cknown)) || (otmp.otyp == HORN_OF_PLENTY && (otmp.spe > 0 || !otmp.known))) {
        await ia_addmenu(win, IA_TIP_CONTAINER, 84, "Tip all the contents out of this container");
    }
    if ((otmp.otyp == FAKE_AMULET_OF_YENDOR && !otmp.known) || otmp.oartifact || game.objects[otmp.otyp].oc_unique || otmp.otyp == CRYSTAL_BALL) {
        await ia_addmenu(win, IA_INVOKE_OBJ, 86, "Try to invoke a unique power of this object");
    }
    if (otmp == game.uwep || ((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1))) {
        ;
    } else if (otmp.oclass == WEAPON_CLASS || ((otmp).oclass == TOOL_CLASS && game.objects[(otmp).otyp].oc_subtyp != P_NONE) || ((otmp).otyp == TOWEL && (otmp).spe > 0) || otmp.otyp == HEAVY_IRON_BALL) {
        buf = sprintf(buf, "Wield this %s as your weapon", (otmp.quan > 1) ? "stack" : "item");
        await ia_addmenu(win, IA_WIELD_OBJ, 119, buf);
    } else if (otmp.otyp == TIN_OPENER) {
        await ia_addmenu(win, IA_WIELD_OBJ, 119, "Wield the tin opener to easily open tins");
    } else if (!already_worn) {
        buf = sprintf(buf, "Wield this %s in your %s", (otmp.quan > 1) ? "stack" : "item", await makeplural(await body_part(HAND)));
        await ia_addmenu(win, IA_WIELD_OBJ, 119, buf);
    }
    if (!already_worn) {
        if (otmp.oclass == ARMOR_CLASS) {
            /* originally this was using "hold this item in your hands" but
           there's no concept of "holding an item", plus it unwields
           whatever item you already have wielded so use "wield this item" */
            /* only two-handed weapons and unicorn horns care about
                   pluralizing "hand" and they won't reach here, but plural
                   sounds better when poly'd into something with "claw" */
            /* if 'otmp' is worn we skip 'W' (and show 'T' above instead);
               if it isn't, we either show "W - wear this" if otmp's slot
               isn't populated, or "W - [already wearing <simple-armor>]";
               for the latter, picking 'W' will fail but we don't want to
               omit 'W' in this situation */
            let Wmask = armcat_to_wornmask(game.objects[otmp.otyp].oc_subtyp);
            let o = wearmask_to_obj(Wmask);
            if (!o) {
                buf = strcpy(buf, "Wear this armor");
            } else {
                buf = sprintf(buf, "[already wearing %s]", await an(await armor_simple_name(o)));
            }
            await ia_addmenu(win, IA_WEAR_OBJ, 87, buf);
        }
    }
    /* x: Swap main and readied weapon */
    if (otmp == game.uwep && game.uswapwep) {
        await ia_addmenu(win, IA_SWAPWEAPON, 120, "Swap this with your alternate weapon");
    } else if (otmp == game.uwep) {
        await ia_addmenu(win, IA_SWAPWEAPON, 120, "Ready this as an alternate weapon");
    } else if (otmp == game.uswapwep) {
        await ia_addmenu(win, IA_SWAPWEAPON, 120, "Swap this with your main weapon");
    }
    if ((otmp == game.uwep || otmp == game.uswapwep) && (game.u.twoweap || (((((game.youmonst.data).mattk[0].aatyp == 254) + ((game.youmonst.data).mattk[1].aatyp == 254) + ((game.youmonst.data).mattk[2].aatyp == 254)) > 1) && !game.uarms && game.uwep && ((((game.uwep).oclass == WEAPON_CLASS) ? !((game.uwep.oclass == WEAPON_CLASS && game.objects[game.uwep.otyp].oc_subtyp >= P_BOW && game.objects[game.uwep.otyp].oc_subtyp <= P_CROSSBOW) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == GEM_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uwep.otyp].oc_subtyp <= -P_BOW) || ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[game.uwep.otyp].oc_subtyp <= -P_DART)) : ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE)) && !((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big)) && game.uswapwep && ((((game.uswapwep).oclass == WEAPON_CLASS) ? !((game.uswapwep.oclass == WEAPON_CLASS && game.objects[game.uswapwep.otyp].oc_subtyp >= P_BOW && game.objects[game.uswapwep.otyp].oc_subtyp <= P_CROSSBOW) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == GEM_CLASS) && game.objects[game.uswapwep.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uswapwep.otyp].oc_subtyp <= -P_BOW) || ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && game.objects[game.uswapwep.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[game.uswapwep.otyp].oc_subtyp <= -P_DART)) : ((game.uswapwep).oclass == TOOL_CLASS && game.objects[(game.uswapwep).otyp].oc_subtyp != P_NONE)) && !((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && game.objects[game.uswapwep.otyp].oc_big))))) {
        buf = sprintf(buf, "Toggle two-weapon combat %s", game.u.twoweap ? "off" : "on");
        await ia_addmenu(win, IA_TWOWEAPON, 88, buf);
    }
    if (otmp.oclass == WAND_CLASS) {
        await ia_addmenu(win, IA_ZAP_OBJ, 122, "Zap this wand to release its magic");
    }
    if (await ia_checkfile(otmp)) {
        buf = sprintf(buf, "Look up information about %s", (otmp.quan > 1) ? "these" : "this");
        await ia_addmenu(win, IA_WHATIS_OBJ, 47, buf);
    }
    buf = sprintf(buf, "Do what with %s?", await the(await cxname(otmp)));
    (game.windowprocs.win_end_menu)(win, buf);
    { const __selbox = { value: null }; n = await select_menu(win, 1, __selbox); selected = __selbox.value; }
    if (n > 0) {
        act = selected[0].item.a_int;
        free(selected);
        await itemactions_pushkeys(otmp, act);
    }
    (game.windowprocs.win_destroy_nhwindow)(win);
    /* finish the 'i' command:  no time elapses and cancelling without
       selecting an action doesn't matter */
    return 0;
}
/*iactions.c*/
/* prefix known unique item with "the", make all other types plural */
/* treats unID'd fake amulets as if real */
/* "novel" or "paperback book" */
/* #altdip instead of normal #dip - takes potion to dip into
           first (the inventory item instigating this) and item to
           be dipped second, also ignores floor features such as
           fountain/sink so we don't need to force m-prefix here */
/* start with m-prefix; for #eat, it means ignore floor food
           if present and eat food from invent */
/* start with m-prefix; for #quaff, it means ignore fountain
           or sink if present and drink a potion from invent */
/* start with m-prefix to skip floor containers;
           for menustyle:Traditional when more than one floor container
           is present, player will get a #tip menu and have to pick
           the "tip something being carried" choice, then this item
           will be already chosen from inventory; suboptimal but
           possibly an acceptable tradeoff since combining item actions
           with use of traditional ggetobj() is an unlikely scenario */
/* bag of tricks skips this unless discovered */
/* bag of tricks gets here only if not yet discovered */
/* FIXME? this should probably be moved to 'D' rather than be 'a' */
/* 'c', 'C' - call an item or its type something */
/* d: drop item, works on everything except worn items; those will
       always have a takeoff/remove choice so we don't have to worry
       about the menu maybe being empty when 'd' is suppressed */
/* i: #adjust inventory letter; gold can't be adjusted unless there
       is some in a slot other than '$' (which shouldn't be possible) */
/* FIXME: see the multi-shot FIXME about "one of" for 't: throw' */
/* FIXME: this doesn't match #offer's likely candidates, which don't
           include corpses on Astral and don't include amulets off Astral */
/* catchall -- can't happen */
/* non-artifact crystal balls don't have any unique power but
           the #invoke command lists them as likely candidates */
/* w: wield, hold in hands, works on everything but with different
       advice text; not mentioned for things that are already wielded */
/* either already wielded or can't wield anything; skip 'w' */
/* this is based on TWOWEAPOK() in wield.c; we don't call can_two_weapon()
       because it is very verbose; attempting to two-weapon might be rejected
       but we screen out most reasons for rejection before offering it as a
       choice */
/* X: Toggle two-weapon mode on or off */
/* if already two-weaponing, no special checks needed to toggle off */
/* but if not, try to filter most "you can't do that" here */
/* ?: Look up an item in the game's database */
/*
         * TODO: if uwep is ammo, tell player that to shoot instead of toss,
         *       the corresponding launcher must be wielded;
         */
/*
         * FIXME:
         *  'one of these' should be changed to 'some of these' when there
         *  is the possibility of a multi-shot volley but we don't have
         *  any way to determine that except by actually calculating the
         *  volley count and that could randomly yield 1 here and 2..N
         *  while throwing or vice versa.
         */
/* if otmp is quivered, we've already listed
                   'f - shoot|throw this item' as a choice;
                   if 't' is duplicating that, say so ('t' and 'f'
                   behavior differs for throwing a stack of gold) */
