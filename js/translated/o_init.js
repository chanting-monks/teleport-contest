import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	o_init.c	$NHDT-Date: 1771216675 2026/02/15 20:37:55 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.101 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, pline, raw_printf } from '../c2js-runtime/pline.js';
import { qsort , qsort_async } from '../c2js-runtime/qsort.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { __nh_buf_append, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcmp, strcpy, strlen, strncat, strncmpi, strrchr, strstri } from '../c2js-runtime/string.js';
import { disp_artifact_discoveries, dump_artifact_info } from './artifact.js';
import { exercise } from './attrib.js';
import { yn_function } from './cmd.js';
import { cg, ynchars } from './decl.js';
import { nul_glyphinfo } from './display.js';
import { docall, objtyp_is_callable } from './do_name.js';
import { def_char_to_objclass, def_oc_syms } from './drawing.js';
import { ledger_no, maxledgerno } from './dungeon.js';
import { strkitten, strsubst, upstart, visctrl } from './hacklib.js';
import { let_to_name, loot_classify, update_inventory } from './invent.js';
import { AMULET_CLASS, AMULET_OF_YENDOR, AQUAMARINE, ARMOR_CLASS, A_WIS, BELL_OF_OPENING, CANDELABRUM_OF_INVOCATION, CLOAK_OF_DISPLACEMENT, CLOAK_OF_PROTECTION, DIAMOND, EMERALD, FIRST_OBJECT, FLUORITE, GAUNTLETS_OF_DEXTERITY, GEM_CLASS, HALLUC, HALLUC_RES, HELMET, HELM_OF_TELEPATHY, ILLOBJ_CLASS, LAST_REAL_GEM, LEATHER_GLOVES, LEVITATION_BOOTS, MAGIC_HARP, MAXOCLASSES, NON_PM, NROFARTIFACTS, NUM_OBJECTS, PM_SAMURAI, POTION_CLASS, POT_WATER, RING_CLASS, SAPPHIRE, SCROLL_CLASS, SLIME_MOLD, SPBOOK_CLASS, SPEED_BOOTS, SPE_BOOK_OF_THE_DEAD, STRANGE_OBJECT, TURQUOISE, VENOM_CLASS, WAND_CLASS, WAN_NOTHING, WOODEN_HARP } from './nh-constants.js';
import { Japanese_item_name, obj_typename } from './objnam.js';
import { rn2 } from './rnd.js';
import { sfi_char, sfi_int, sfi_objclass, sfi_short, sfi_unsigned, sfo_char, sfo_int, sfo_objclass, sfo_short, sfo_unsigned } from './sfbase.js';
import { append_price_quote, gem_learned } from './shk.js';
import { Strlen_ } from './strutil.js';
import { add_menu, add_menu_heading, add_menu_str, select_menu } from './windows.js';

/* Shuffle tile assignments to match descriptions, so a red potion isn't
 * displayed with a blue tile and so on.
 *
 * Tile assignments are not saved, and shouldn't be so that a game can
 * be resumed on an otherwise identical non-tile-using binary, so we have
 * to reshuffle the assignments from oc_descr_idx information when a game
 * is restored.  So might as well do that the first time instead of writing
 * another routine.
 */
/* TILES_IN_GLYPHMAP */
export async function setgemprobs(dlev) {
    let j = 0;
    let first = 0;
    let lev = 0;
    let sum = 0;
    if (dlev) {
        lev = (ledger_no(dlev) > maxledgerno()) ? maxledgerno() : ledger_no(dlev);
    } else {
        lev = 0;
    }
    first = game.bases[GEM_CLASS];
    for (j = 0; j < 9 - Math.trunc(lev / 3); j++) {
        game.objects[first + j].oc_prob = 0;
    }
    first += j;
    if (first > LAST_REAL_GEM || game.objects[first].oc_class != GEM_CLASS || (game.obj_descr[(game.objects[first]).oc_name_idx].oc_name) == null) {
        await raw_printf("Not enough gems? - first=%d j=%d LAST_GEM=%d", first, j, LAST_REAL_GEM);
        (game.windowprocs.win_wait_synch)();
    }
    for (j = first; j <= LAST_REAL_GEM; j++) {
        game.objects[j].oc_prob = Math.trunc((171 + j - first) / (LAST_REAL_GEM + 1 - first));
    }
    /* recompute GEM_CLASS total oc_prob - including rocks/stones */
    for (j = game.bases[GEM_CLASS]; j < game.bases[GEM_CLASS + 1]; j++) {
        sum += game.objects[j].oc_prob;
    }
    game.oclass_prob_totals[GEM_CLASS] = sum;
}
/* some gems can have different colors */
export function randomize_gem_colors() {
    fnEnter("randomize_gem_colors", "o_init.c", 0);
    /* change turquoise from green to blue? */
    if (rn2(2)) {
        game.objects[TURQUOISE].oc_descr_idx = game.objects[SAPPHIRE].oc_descr_idx , game.objects[TURQUOISE].oc_color = game.objects[SAPPHIRE].oc_color;
    }
    /* change aquamarine from green to blue? */
    if (rn2(2)) {
        game.objects[AQUAMARINE].oc_descr_idx = game.objects[SAPPHIRE].oc_descr_idx , game.objects[AQUAMARINE].oc_color = game.objects[SAPPHIRE].oc_color;
    }
    switch (rn2(4)) {
        /* change fluorite from violet? */
        case 0:
            break;
        case 1:
            game.objects[FLUORITE].oc_descr_idx = game.objects[SAPPHIRE].oc_descr_idx , game.objects[FLUORITE].oc_color = game.objects[SAPPHIRE].oc_color;
            break;
        case 2:
            game.objects[FLUORITE].oc_descr_idx = game.objects[DIAMOND].oc_descr_idx , game.objects[FLUORITE].oc_color = game.objects[DIAMOND].oc_color;
            break;
        case 3:
            game.objects[FLUORITE].oc_descr_idx = game.objects[EMERALD].oc_descr_idx , game.objects[FLUORITE].oc_color = game.objects[EMERALD].oc_color;
            break;
    }
}
/* shuffle descriptions on objects o_low to o_high */
export function shuffle(o_low, o_high, domaterial) {
    fnEnter("shuffle", "o_init.c", 0);
    let i = 0;
    let j = 0;
    let num_to_shuffle = 0;
    let sw = 0;
    let color = 0;
    for (num_to_shuffle = 0 , j = o_low; j <= o_high; j++) {
        if (!game.objects[j].oc_name_known) {
            num_to_shuffle++;
        }
    }
    if (num_to_shuffle < 2) {
        return;
    }
    for (j = o_low; j <= o_high; j++) {
        if (game.objects[j].oc_name_known) {
            continue;
        }
        do {
            i = j + rn2(o_high - j + 1);
        } while (game.objects[i].oc_name_known);
        sw = game.objects[j].oc_descr_idx;
        game.objects[j].oc_descr_idx = game.objects[i].oc_descr_idx;
        game.objects[i].oc_descr_idx = sw;
        sw = game.objects[j].oc_tough;
        game.objects[j].oc_tough = game.objects[i].oc_tough;
        game.objects[i].oc_tough = sw;
        color = game.objects[j].oc_color;
        game.objects[j].oc_color = game.objects[i].oc_color;
        game.objects[i].oc_color = color;
        if (domaterial) {
            sw = game.objects[j].oc_material;
            game.objects[j].oc_material = game.objects[i].oc_material;
            game.objects[i].oc_material = sw;
        }
    }
}
export async function init_objects() {
    fnEnter("init_objects", "o_init.c", 0);
    let i = 0;
    /* entire classes; obj_shuffle_range() handles their exceptions */
    /* sub-class type ranges (one item from each group) */
    let first = 0;
    let last = 0;
    let prevoclass = 0;
    let oclass = 0;
    for (i = 0; i <= MAXOCLASSES; i++) {
        game.bases[i] = 0;
        if (i > 0 && i < MAXOCLASSES && game.objects[i].oc_class != i) {
            await panic("init_objects: class for generic object #%d doesn't match (%d)", i, game.objects[i].oc_class);
        }
    }
    /* initialize object descriptions */
    for (i = 0; i < NUM_OBJECTS; i++) {
        game.objects[i].oc_name_idx = game.objects[i].oc_descr_idx = i;
    }
    /* init base; if probs given check that they add up to 1000,
       otherwise compute probs */
    first = MAXOCLASSES;
    prevoclass = -1;
    while (first < NUM_OBJECTS) {
        oclass = game.objects[first].oc_class;
        if (oclass < prevoclass) {
            await panic("objects[%d] class #%d not in order!", first, oclass);
        }
        last = first + 1;
        while (last < NUM_OBJECTS && game.objects[last].oc_class == oclass) {
            last++;
        }
        game.bases[oclass] = first;
        if (oclass == GEM_CLASS) {
            await setgemprobs(null);
            randomize_gem_colors();
        }
        first = last;
        prevoclass = oclass;
    }
    /* extra entry allows deriving the range of a class via
       bases[class] through bases[class+1]-1 for all classes
       (except for ILLOBJ_CLASS which is separated from WEAPON_CLASS
       by generic objects); second extra entry is to prevent an
       unexplained crash in doclassdisco(), where the code ended up
       attempting to process non-existent class MAXOCLASSES; the
       [MAXOCLASSES+1] element gives that non-class 0 objects
       when traversing objects[] from bases[X] through bases[X+1]-1 */
    (game.bases[MAXOCLASSES + 1] = NUM_OBJECTS, game.bases[MAXOCLASSES] = NUM_OBJECTS);
    /* hypothetically someone might remove all objects of some class,
       or be adding a new class and not populated it yet, leaving gaps
       in bases[]; guarantee that there are no such gaps */
    for (last = MAXOCLASSES - 1; last >= 0; --last) {
        if (!game.bases[last]) {
            game.bases[last] = game.bases[last + 1];
        }
    }
    for (i = MAXOCLASSES; i < NUM_OBJECTS; ++i) {
        /* check objects[].oc_name_known */
        let nmkn = game.objects[i].oc_name_known != 0;
        if (!(game.obj_descr[(game.objects[i]).oc_descr_idx].oc_descr) ^ nmkn) {
            if (game.iflags.sanity_check) {
                await impossible("obj #%d (%s) name is %s despite%s alternate description", i, (game.obj_descr[(game.objects[i]).oc_name_idx].oc_name), nmkn ? "pre-known" : "not known", nmkn ? "" : " no");
            }
            /* repair the mistake and keep going */
            game.objects[i].oc_name_known = nmkn ? 0 : 1;
        }
    }
    await init_oclass_probs();
    shuffle_all();
    game.objects[WAN_NOTHING].oc_dir = rn2(2) ? 1 : 2;
}
/* Compute the total probability of each object class.
 * Assumes svb.bases[] has already been set. */
export async function init_oclass_probs() {
    let i = 0;
    let sum = 0;
    let oclass = 0;
    for (oclass = 0; oclass < MAXOCLASSES; ++oclass) {
        sum = 0;
        for (i = game.bases[oclass]; i < game.bases[oclass + 1]; ++i) {
            /* note: for ILLOBJ_CLASS, bases[oclass+1]-1 isn't the last item
           in the class; but all the generic items have probability 0 so
           adding them to 'sum' has no impact */
            sum += game.objects[i].oc_prob;
        }
        if (sum <= 0 && oclass != ILLOBJ_CLASS && game.bases[oclass] != game.bases[oclass + 1]) {
            await impossible("%s (%d) probability total for oclass %d", !sum ? "zero" : "negative", sum, oclass);
            for (i = game.bases[oclass]; i < game.bases[oclass + 1]; ++i) {
                /* gracefully fail by setting all members of this class to 1 */
                game.objects[i].oc_prob = 1;
                sum++;
            }
        }
        game.oclass_prob_totals[oclass] = sum;
    }
}
/* retrieve the range of objects that otyp shares descriptions with */
/* input: representative item */
/* output: range that item belongs among */
export function obj_shuffle_range(otyp, lo_p, hi_p) {
    let i = 0;
    let ocls = game.objects[otyp].oc_class;
    /* default is just the object itself */
    lo_p.value = hi_p.value = otyp;
    switch (ocls) {
        case ARMOR_CLASS:
            if (otyp >= HELMET && otyp <= HELM_OF_TELEPATHY) {
                lo_p.value = HELMET , hi_p.value = HELM_OF_TELEPATHY;
            } else if (otyp >= LEATHER_GLOVES && otyp <= GAUNTLETS_OF_DEXTERITY) {
                lo_p.value = LEATHER_GLOVES , hi_p.value = GAUNTLETS_OF_DEXTERITY;
            } else if (otyp >= CLOAK_OF_PROTECTION && otyp <= CLOAK_OF_DISPLACEMENT) {
                lo_p.value = CLOAK_OF_PROTECTION , hi_p.value = CLOAK_OF_DISPLACEMENT;
            } else if (otyp >= SPEED_BOOTS && otyp <= LEVITATION_BOOTS) {
                lo_p.value = SPEED_BOOTS , hi_p.value = LEVITATION_BOOTS;
            }
            break;
        case POTION_CLASS:
            lo_p.value = game.bases[POTION_CLASS];
            hi_p.value = POT_WATER - 1;
            break;
        case AMULET_CLASS:
        case SCROLL_CLASS:
        case SPBOOK_CLASS:
            lo_p.value = game.bases[ocls];
            for (i = lo_p.value; game.objects[i].oc_class == ocls; i++) {
                if (game.objects[i].oc_unique || !game.objects[i].oc_magic) {
                    break;
                }
            }
            hi_p.value = i - 1;
            break;
        case RING_CLASS:
        case WAND_CLASS:
        case VENOM_CLASS:
            lo_p.value = game.bases[ocls];
            hi_p.value = game.bases[ocls + 1] - 1;
            break;
    }
    /* artifact checking might ask about item which isn't part of any range
       but fell within the classes that do have ranges specified above */
    if (otyp < lo_p.value || otyp > hi_p.value) {
        lo_p.value = hi_p.value = otyp;
    }
    return;
}
/* randomize object descriptions */
let __shuffle_all_shuffle_classes = [AMULET_CLASS, POTION_CLASS, RING_CLASS, SCROLL_CLASS, SPBOOK_CLASS, WAND_CLASS, VENOM_CLASS];
__nh_register_static(() => { __shuffle_all_shuffle_classes = [AMULET_CLASS, POTION_CLASS, RING_CLASS, SCROLL_CLASS, SPBOOK_CLASS, WAND_CLASS, VENOM_CLASS]; });
let __shuffle_all_shuffle_types = [HELMET, LEATHER_GLOVES, CLOAK_OF_PROTECTION, SPEED_BOOTS];
__nh_register_static(() => { __shuffle_all_shuffle_types = [HELMET, LEATHER_GLOVES, CLOAK_OF_PROTECTION, SPEED_BOOTS]; });
export function shuffle_all() {
    let first = 0;
    let last = 0;
    let idx = 0;
    for (idx = 0; idx < (Math.trunc(7 /* sizeof(char [7]) */ / 1 /* sizeof(char) */)); idx++) {
        /* do whole classes (amulets, &c) */
        obj_shuffle_range(game.bases[__shuffle_all_shuffle_classes[idx]], { get value() { return first; }, set value(_v) { first = _v; } }, { get value() { return last; }, set value(_v) { last = _v; } });
        shuffle(first, last, (1));
    }
    for (idx = 0; idx < (Math.trunc(8 /* sizeof(short [4]) */ / 2 /* sizeof(short) */)); idx++) {
        /* do type ranges (helms, &c) */
        obj_shuffle_range(__shuffle_all_shuffle_types[idx], { get value() { return first; }, set value(_v) { first = _v; } }, { get value() { return last; }, set value(_v) { last = _v; } });
        shuffle(first, last, (0));
    }
    return;
}
/* Return TRUE if the provided string matches the unidentified description of
 * the provided object. */
export async function objdescr_is(obj, descr) {
    let objdescr = null;
    if (!obj) {
        await impossible("objdescr_is: null obj");
        return (0);
    }
    objdescr = (game.obj_descr[(game.objects[obj.otyp]).oc_descr_idx].oc_descr);
    if (!objdescr) {
        return (0);
    }
    /* no obj description, no match */
    return !strcmp(objdescr, descr);
}
/* level dependent initialization */
export async function oinit() {
    await setgemprobs(game.u.uz);
}
export async function savenames(nhfp) {
    let i = 0;
    let len = 0;
    if (((nhfp).mode & (1 | 2))) {
        for (i = 0; i < (MAXOCLASSES + 2); ++i) {
            sfo_int(nhfp, { get value() { return game.bases[i]; }, set value(_v) { game.bases[i] = _v; } }, "names-bases");
        }
        for (i = 0; i < NUM_OBJECTS; ++i) {
            sfo_short(nhfp, { get value() { return game.disco[i]; }, set value(_v) { game.disco[i] = _v; } }, "names-disco");
        }
        for (i = 0; i < NUM_OBJECTS; ++i) {
            sfo_objclass(nhfp, game.objects[i], "names-objclass");
        }
    }
    for (i = 0; i < NUM_OBJECTS; i++) {
        if (game.objects[i].oc_uname) {
            if (((nhfp).mode & (1 | 2))) {
                len = await Strlen_(game.objects[i].oc_uname, "savenames", 397) + 1;
                sfo_unsigned(nhfp, { get value() { return len; }, set value(_v) { len = _v; } }, "names-len");
                sfo_char(nhfp, game.objects[i].oc_uname, "names-oc_uname", len);
            }
            if (((nhfp).mode & 4)) {
                free(game.objects[i].oc_uname);
                game.objects[i].oc_uname = null;
            }
        }
    }
}
/* !SFCTOOL */
export function restnames(nhfp) {
    let i = 0;
    let len = 0;
    for (i = 0; i < (MAXOCLASSES + 2); ++i) {
        sfi_int(nhfp, { get value() { return game.bases[i]; }, set value(_v) { game.bases[i] = _v; } }, "names-bases");
        ;
    }
    for (i = 0; i < NUM_OBJECTS; ++i) {
        sfi_short(nhfp, { get value() { return game.disco[i]; }, set value(_v) { game.disco[i] = _v; } }, "names-disco");
    }
    for (i = 0; i < NUM_OBJECTS; ++i) {
        sfi_objclass(nhfp, game.objects[i], "names-objclass");
    }
    for (i = 0; i < NUM_OBJECTS; i++) {
        if (game.objects[i].oc_uname) {
            sfi_unsigned(nhfp, { get value() { return len; }, set value(_v) { len = _v; } }, "names-len");
            ;
            game.objects[i].oc_uname = alloc(len);
            sfi_char(nhfp, game.objects[i].oc_uname, "names-oc_uname", len);
        }
    }
}
/* make the object dknown and mark it as encountered */
export async function observe_object(obj) {
    let oindx = obj.otyp;
    if (oindx >= FIRST_OBJECT && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        /* skip for generic objects and for STRANGE_OBJECT */
        obj.dknown = 1;
        await discover_object(oindx, (0), (1), (0));
    }
}
/* type of object */
/* discover the type */
/* mark the type as having been seen/felt */
/* exercise wisdom */
export async function discover_object(oindx, mark_as_known, mark_as_encountered, credit_hero) {
    /* don't discover generic objects */
    if (oindx < FIRST_OBJECT) {
        return;
    }
    if ((!game.objects[oindx].oc_name_known && mark_as_known) || (!game.objects[oindx].oc_encountered && mark_as_encountered) || ((game.urole.mnum == (PM_SAMURAI)) && Japanese_item_name(oindx, null))) {
        let dindx = 0;
        let acls = game.objects[oindx].oc_class;
        /* Loop thru disco[] 'til we find the target (which may have been
           uname'd) or the next open slot; one or the other will be found
           before we reach the next class... */
        for (dindx = game.bases[acls]; game.disco[dindx] != 0; dindx++) {
            if (game.disco[dindx] == oindx) {
                break;
            }
        }
        game.disco[dindx] = oindx;
        if (mark_as_encountered) {
            game.objects[oindx].oc_encountered = 1;
        }
        if (!game.objects[oindx].oc_name_known && mark_as_known) {
            game.objects[oindx].oc_name_known = 1;
            if (credit_hero) {
                await exercise(A_WIS, (1));
            }
            if (game.program_state.in_moveloop && !game.program_state.gameover) {
                /* !in_moveloop => initial inventory,
               gameover => final disclosure */
                if (game.objects[oindx].oc_class == GEM_CLASS) {
                    await gem_learned(oindx);
                }
                /* could affect price of unpaid gems */
                update_inventory();
            }
        }
    }
}
/* if a class name has been cleared, we may need to purge it from disco[] */
export async function undiscover_object(oindx) {
    if (!game.objects[oindx].oc_name_known && !game.objects[oindx].oc_encountered) {
        let dindx = 0;
        let acls = game.objects[oindx].oc_class;
        let found = (0);
        /* find the object; shift those behind it forward one slot */
        for (dindx = game.bases[acls]; dindx < NUM_OBJECTS && game.disco[dindx] != 0 && game.objects[dindx].oc_class == acls; dindx++) {
            if (found) {
                game.disco[dindx - 1] = game.disco[dindx];
            } else if (game.disco[dindx] == oindx) {
                found = (1);
            }
        }
        if (found) {
            game.disco[dindx - 1] = 0;
        } else {
            await impossible("named object not in disco");
        }
        if (game.objects[oindx].oc_class == GEM_CLASS) {
            await gem_learned(oindx);
        }
    }
}
export function interesting_to_discover(i) {
    /* most players who don't speak Japanese manage to figure out what
       gunyoki, osaku, and so forth mean, but treat them as pre-discovered
       to be disclosed by '\' */
    if ((game.urole.mnum == (PM_SAMURAI)) && Japanese_item_name(i, null)) {
        return (1);
    }
    /* Objects that were discovered without encountering them are now printed
       with a '*' */
    return (game.objects[i].oc_uname != null || ((game.objects[i].oc_name_known || game.objects[i].oc_encountered) && (game.obj_descr[(game.objects[i]).oc_descr_idx].oc_descr) != null));
}
/* items that should stand out once they're known */
const uniq_objs = [AMULET_OF_YENDOR, BELL_OF_OPENING, SPE_BOOK_OF_THE_DEAD, CANDELABRUM_OF_INVOCATION];
/* same order as major oracularity; alphabetical when fully IDed */
/* discoveries qsort comparison function */
export function discovered_cmp(v1, v2) {
    let s1 = v1;
    let s2 = v2;
    /* each element starts with "* " or "  " but we don't sort by those */
    let res = strncmpi((__nh_advance_str(s1, 2)), (__nh_advance_str(s2, 2)), -1);
    if (res == 0) {
        ;
    }
    return res;
}
export async function sortloot_descr(otyp, outbuf) {
    let sl_cookie = { obj: null, str: null, indx: 0, orderclass: 0, subclass: 0, disco: 0, inuse: 0 };
    let o = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
    Object.assign(o, cg.zeroobj);
    o.otyp = otyp;
    o.oclass = game.objects[otyp].oc_class;
    /* not observe_object, this isn't a real object */
    o.dknown = 1;
    o.known = (game.objects[otyp].oc_name_known || !game.objects[otyp].oc_uses_known) ? 1 : 0;
    /* suppress statue and figurine details */
    o.corpsenm = NON_PM;
    /* but suppressing fruit details leads to "bad fruit #0" */
    if (otyp == SLIME_MOLD) {
        o.spe = game.context.current_fruit;
    }
    memset(sl_cookie, 0, 1 /* sizeof(Loot) */);
    sl_cookie.obj = null;
    sl_cookie.str = null;
    await loot_classify(sl_cookie, o);
    outbuf = sprintf(outbuf, "%02d%02d%1d ", sl_cookie.orderclass, sl_cookie.subclass, sl_cookie.disco);
    return outbuf;
}
/* !SFCTOOL */
/* by discovery order within each class */
/* by discovery order within each subclass */
/* alphabetized within each class */
/* alphabetized across all classes */
/* also used in options.c (optfn_sortdiscoveries) */
const disco_order_let = "osca";
const disco_orders_descr = ["by order of discovery within each class", "sortloot order (by class with some sub-class groupings)", "alphabetical within each class", "alphabetical across all classes", null];
/* 0 => 'O' cmd, 1 => full discoveries; 2 => class disco */
export async function choose_disco_sort(mode) {
    let tmpwin = 0;
    let selected = null;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let i = 0;
    let n = 0;
    let choice = 0;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    Object.assign(any, cg.zeroany);
    for (i = 0; disco_orders_descr[i]; ++i) {
        any.a_int = __nh_char_at0(__nh_advance_str(disco_order_let, i));
        await add_menu(tmpwin, nul_glyphinfo, any, any.a_int, 0, 0, clr, disco_orders_descr[i], (__nh_char_at0(__nh_advance_str(disco_order_let, i)) == game.flags.discosort) ? 1 : 0);
    }
    if (mode == 2) {
        await add_menu_str(tmpwin, "");
        await add_menu_str(tmpwin, "Note: full alphabetical and alphabetical within class");
        await add_menu_str(tmpwin, "      are equivalent for single class discovery, but");
        await add_menu_str(tmpwin, "      will matter for future use of total discoveries.");
    }
    (game.windowprocs.win_end_menu)(tmpwin, "Ordering of discoveries");
    n = await select_menu(tmpwin, 1, selected);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (n > 0) {
        choice = selected[0].item.a_int;
        /* skip preselected entry if we have more than one item chosen */
        if (n > 1 && choice == game.flags.discosort) {
            choice = selected[1].item.a_int;
        }
        free(selected);
        game.flags.discosort = choice;
    }
    return n;
}
/* augment obj_typename() with explanation of Japanese item names */
export async function disco_typename(otyp) {
    let result = await obj_typename(otyp);
    if ((game.urole.mnum == (PM_SAMURAI)) && Japanese_item_name(otyp, null)) {
        let buf = '';
        let actualn = (((otyp != MAGIC_HARP && otyp != WOODEN_HARP) || game.objects[otyp].oc_name_known) ? (game.obj_descr[(game.objects[otyp]).oc_name_idx].oc_name) : "harp");
        if (!actualn) {
            ;
        } else if (strstri(result, " called")) {
            buf = sprintf(buf, " [%s] called", actualn);
            /* undiscovered harp (since wooden harp is
                                  non-magic so pre-discovered, only applies
                                  to magic harp and will only be seen if
                                  magic harp has been 'called' something) */
            /* won't happen; used to pacify static analyzer */
            result = strsubst(result, " called", buf);
        } else if (strstri(result, " (")) {
            buf = sprintf(buf, " [%s] (", actualn);
            result = strsubst(result, " (", buf);
        } else {
            result = __nh_buf_append(result, sprintf('', " [%s]", actualn));
        }
    }
    return result;
}
/* append typename(dis) to buf[], possibly truncating in the process;
   also append price quote information if it fits */
export async function disco_append_typename(buf, dis) {
    let len = strlen(buf);
    let p = null;
    let typnm = await disco_typename(dis);
    let typnm_len = strlen(typnm);
    let eos = null;
    if (len + typnm_len < 256) {
        buf = strcat(buf, typnm);
        eos = __nh_advance_str(buf, len) + typnm_len;
    } else if ((p = strrchr(typnm, 40)) != null && p > typnm && __nh_char_at0(__nh_advance_str(p, -1)) == 32 && strchr(p, 41) != null) {
        /* typename() returned "really long user-applied name (actual type)"
           and we want to truncate from "really long user-applied name" while
           keeping " (actual type)" intact */
        /* back up to space in front of open paren */
        (p = __nh_advance_str(p, -1));
        buf = strncat(buf, typnm, 256 - 1 - (len + strlen(p)));
        buf = strcat(buf, p);
        eos = __nh_advance_str(buf, strlen(buf));
    } else {
        /* unexpected; just truncate from end of typename */
        buf = strncat(buf, typnm, 256 - 1 - len);
        eos = __nh_advance_str(buf, strlen(buf));
    }
    append_price_quote(buf, eos, dis);
    return buf;
}
/* minor fixup for Book of the Dead needed in more than one place */
export function disco_fmt_uniq(uidx, outbuf) {
    outbuf = sprintf(outbuf, "  %s", game.objects[uidx].oc_name_known ? (game.obj_descr[(game.objects[uidx]).oc_name_idx].oc_name) : (game.obj_descr[(game.objects[uidx]).oc_descr_idx].oc_descr));
    /* in the spellbooks section of main discoveries list, encountered
       but not fully discovered Book of the Dead is shown as
       "spellbook (papyrus)" like other encountered but not discovered books;
       in the unique/relics section we want "papyrus spellbook" instead */
    if (!game.objects[uidx].oc_name_known && game.objects[uidx].oc_class == SPBOOK_CLASS) {
        outbuf = strcat(outbuf, " spellbook");
    }
}
/* sort and output sorted_lines to window and free the lines */
export async function disco_output_sorted(tmpwin, sorted_lines, sorted_ct, lootsort) {
    let p = null;
    let j = 0;
    await qsort_async(sorted_lines, sorted_ct, 8 /* sizeof(char *) */, discovered_cmp);
    for (j = 0; j < sorted_ct; ++j) {
        p = sorted_lines[j];
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        if (lootsort) {
            p = __nh_char_write(p, 6, __nh_char_at0(p));
            p = __nh_advance_str(p, 6);
        }
        (game.windowprocs.win_putstr)(tmpwin, 0, p);
        free(sorted_lines[j]) , sorted_lines[j] = null;
    }
}
/* the #known command - show discovered object types */
/* free after Robert Viduya */
export async function dodiscovered() {
    let tmpwin = 0;
    let __nh_s_idx = 0;
    let oclass = 0;
    let prev_class = 0;
    let classes = '';
    let buf = '';
    let sorted_lines = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    let p = null;
    let i = 0;
    let dis = 0;
    let ct = 0;
    let uniq_ct = 0;
    let arti_ct = 0;
    let sorted_ct = 0;
    let uidx = 0;
    // should be ptrdiff_t, but we don't require that exists
    let sortindx = 0;
    let alphabetized = 0;
    let alphabyclass = 0;
    let lootsort = 0;
    if (!game.flags.discosort || !(p = strchr(disco_order_let, game.flags.discosort))) {
        game.flags.discosort = 111;
    }
    if (game.iflags.menu_requested) {
        if (await choose_disco_sort(1) < 0) {
            return 0;
        }
    }
    alphabyclass = (game.flags.discosort == 99);
    alphabetized = (game.flags.discosort == 97 || alphabyclass);
    lootsort = (game.flags.discosort == 115);
    sortindx = disco_order_let.indexOf(String.fromCharCode(game.flags.discosort));
    /* player declined to make a selection */
    /*
     * show discoveries for object class c
     */
    tmpwin = (game.windowprocs.win_create_nhwindow)(5);
    buf = sprintf(buf, "Discoveries, %s", disco_orders_descr[sortindx]);
    (game.windowprocs.win_putstr)(tmpwin, 0, buf);
    (game.windowprocs.win_putstr)(tmpwin, 0, "");
    /*
     * FIXME?
     *  relics and artifacts don't obey player's sort order even though
     *  the header line states that they're shown in such-and-such order.
     */
    /* gather "unique objects", also called "relics", into a pseudo-class;
       they'll also be displayed individually within their regular class */
    uniq_ct = 0;
    for (i = dis = 0; i < (Math.trunc(8 /* sizeof(const short [4]) */ / 2 /* sizeof(const short) */)); i++) {
        /* check whether we've discovered any unique objects (primarily the
       invocation items; the Guidebook calls unique items "relics" but the
       Amulet of Yendor is unique too so we haven't made a blanket change
       from 'u' to 'r') */
        uidx = uniq_objs[i];
        if (game.objects[uidx].oc_name_known || (game.objects[uidx].oc_encountered && uidx != AMULET_OF_YENDOR)) {
            if (!dis++) {
                (game.windowprocs.win_putstr)(tmpwin, game.iflags.menu_headings.attr, "Unique items or Relics");
            }
            ++uniq_ct;
            disco_fmt_uniq(uidx, buf);
            (game.windowprocs.win_putstr)(tmpwin, 0, buf);
        }
    }
    arti_ct = await disp_artifact_discoveries(tmpwin);
    classes = strcpy(classes, game.flags.inv_order);
    /* several classes are omitted from packorder; one is of interest here */
    if (!strchr(classes, VENOM_CLASS)) {
        classes = strkitten(classes, VENOM_CLASS);
    }
    ct = uniq_ct + arti_ct;
    sorted_ct = 0;
    for (__nh_s_idx = 0; __nh_char_at0(__nh_advance_str(classes, __nh_s_idx)); __nh_s_idx++) {
        oclass = __nh_char_at0(__nh_advance_str(classes, __nh_s_idx));
        /* forced different from oclass */
        prev_class = oclass + 1;
        for (i = game.bases[oclass]; i < NUM_OBJECTS && game.objects[i].oc_class == oclass; i++) {
            if ((dis = game.disco[i]) != 0 && interesting_to_discover(dis)) {
                ct++;
                if (oclass != prev_class) {
                    if ((alphabyclass || lootsort) && sorted_ct) {
                        await disco_output_sorted(tmpwin, sorted_lines, sorted_ct, lootsort);
                        /* skip iflags.menu_headings */
                        sorted_ct = 0;
                    }
                    if (!alphabetized || alphabyclass) {
                        (game.windowprocs.win_putstr)(tmpwin, game.iflags.menu_headings.attr, await let_to_name(oclass, (0), (0)));
                        prev_class = oclass;
                    }
                }
                buf = strcpy(buf, game.objects[dis].oc_encountered ? "  " : "* ");
                if (lootsort) {
                    await sortloot_descr(dis, __nh_char_at0(__nh_advance_str(buf, 2)));
                }
                buf = await disco_append_typename(buf, dis);
                if (!alphabetized && !lootsort) {
                    (game.windowprocs.win_putstr)(tmpwin, 0, buf);
                } else {
                    sorted_lines[sorted_ct++] = dupstr(buf);
                }
            }
        }
    }
    if (ct == 0) {
        await You("haven't discovered anything yet...");
    } else {
        if (sorted_ct) {
            /* if we're alphabetizing by class, we've already shown the
               relevant header above; if we're alphabetizing across all
               classes, we normally don't need a header; but it we showed
               any unique items or any artifacts then we do need one */
            if ((uniq_ct || arti_ct) && alphabetized && !alphabyclass) {
                (game.windowprocs.win_putstr)(tmpwin, game.iflags.menu_headings.attr, "Discovered items");
            }
            await disco_output_sorted(tmpwin, sorted_lines, sorted_ct, lootsort);
        }
        await (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return 0;
}
/* lower case let_to_name() output, which differs from def_oc_syms[].name */
export async function oclass_to_name(oclass, buf) {
    let __nh_s_idx = 0;
    buf = strcpy(buf, await let_to_name(oclass, (0), (0)));
    for (__nh_s_idx = 0; __nh_char_at0(__nh_advance_str(buf, __nh_s_idx)); ++__nh_s_idx) {
        s = (() => { const __s = s; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toLowerCase() + __t.slice(1) : __s; })();
    }
    return buf;
}
/* the #knownclass command - show discovered object types for one class;
   in addition to actual object classes, supports pseudo-class 'a' for
   discovered artifacts and 'u' (or 'r', for "relics") for unique items */
const __doclassdisco_prompt = "View discoveries for which sort of objects?";
const __doclassdisco_havent_discovered_any = "haven't discovered any %s yet.";
const __doclassdisco_unique_items = "unique items or relics";
const __doclassdisco_artifact_items = "artifacts";
export async function doclassdisco() {
    let tmpwin = (-1);
    let pick_list = null;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let s = null;
    let c = 0;
    let oclass = 0;
    let menulet = 0;
    let allclasses = '';
    let discosyms = '';
    let buf = '';
    let sorted_lines = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    let p = null;
    let i = 0;
    let ct = 0;
    let dis = 0;
    let xtras = 0;
    let sorted_ct = 0;
    let uidx = 0;
    let traditional = 0;
    let alphabetized = 0;
    let lootsort = 0;
    let clr = 8;
    if (!game.flags.discosort || !(p = strchr(disco_order_let, game.flags.discosort))) {
        game.flags.discosort = 111;
    }
    if (game.iflags.menu_requested) {
        if (await choose_disco_sort(2) < 0) {
            return 0;
        }
    }
    alphabetized = (game.flags.discosort == 97 || game.flags.discosort == 99);
    lootsort = (game.flags.discosort == 115);
    discosyms = '';
    traditional = (game.flags.menu_style == 0 || game.flags.menu_style == 1);
    if (!traditional) {
        tmpwin = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(tmpwin, 0);
    }
    Object.assign(any, cg.zeroany);
    menulet = 97;
    for (i = 0; i < (Math.trunc(8 /* sizeof(const short [4]) */ / 2 /* sizeof(const short) */)); i++) {
        uidx = uniq_objs[i];
        if (game.objects[uidx].oc_name_known || (game.objects[uidx].oc_encountered && uidx != AMULET_OF_YENDOR)) {
            discosyms = strcat(discosyms, "u");
            if (!traditional) {
                any.a_int = 117;
                await add_menu(tmpwin, nul_glyphinfo, any, menulet++, 114, 0, clr, __doclassdisco_unique_items, 0);
            }
            break;
        }
    }
    if (await disp_artifact_discoveries((-1)) > 0) {
        discosyms = strcat(discosyms, "a");
        if (!traditional) {
            /* check whether we've discovered any artifacts */
            any.a_int = 97;
            await add_menu(tmpwin, nul_glyphinfo, any, menulet++, 0, 0, clr, __doclassdisco_artifact_items, 0);
        }
    }
    allclasses = strcpy(allclasses, game.flags.inv_order);
    /* collect classes with discoveries, in packorder ordering; several
       classes are omitted from packorder and one is of interest here */
    if (!strchr(allclasses, VENOM_CLASS)) {
        allclasses = strkitten(allclasses, VENOM_CLASS);
    }
    for (s = allclasses; __nh_char_at0(s); (s = __nh_advance_str(s, 1))) {
        /*
     * Skip the "unique objects" section (each will appear within its
     * regular class if it is nameable) and the artifacts section.
     * We assume that classes omitted from packorder aren't nameable
     * so we skip venom too.
     */
        /* for each class, show discoveries in that class */
        oclass = __nh_char_at0(s);
        c = def_oc_syms[oclass].sym;
        for (i = game.bases[oclass]; i < NUM_OBJECTS && game.objects[i].oc_class == oclass; ++i) {
            if ((dis = game.disco[i]) != 0 && interesting_to_discover(dis)) {
                if (!strchr(discosyms, c)) {
                    discosyms = strkitten(discosyms, c);
                    if (!traditional) {
                        any.a_int = c;
                        await add_menu(tmpwin, nul_glyphinfo, any, menulet++, c, 0, clr, await oclass_to_name(oclass, buf), 0);
                    }
                }
            }
        }
    }
    if (!__nh_char_at0(discosyms)) {
        await You(__doclassdisco_havent_discovered_any, "items");
        if (tmpwin != (-1)) {
            (game.windowprocs.win_destroy_nhwindow)(tmpwin);
        }
        return 0;
    }
    /* have player choose a class */
    c = 0;
    if (traditional) {
        let allclasses_plustwo = '';
        allclasses_plustwo = sprintf(allclasses_plustwo, "%s%c%c%c", allclasses, 97, 117, 114);
        for (s = allclasses_plustwo , xtras = 0; __nh_char_at0(s); (s = __nh_advance_str(s, 1))) {
            /* we'll prompt even if there's only one viable class; we add all
           nonviable classes as unseen acceptable choices so player can ask
           for discoveries of any class whether it has discoveries or not */
            c = strchr("aur", __nh_char_at0(s)) ? __nh_char_at0(s) : def_oc_syms[__nh_char_at0(s)].sym;
            if (!strchr(discosyms, c)) {
                if (!xtras++) {
                    discosyms = strkitten(discosyms, 27);
                }
                discosyms = strkitten(discosyms, c);
            }
        }
        c = await yn_function(__doclassdisco_prompt, discosyms, 0, (1));
        if (!c) {
            (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
        }
    } else {
        if (!__nh_char_at0(__nh_advance_str(discosyms, 1)) && game.flags.menu_style == 3) {
            /* menustyle:full or menustyle:partial */
            /* only one class; menustyle:partial normally jumps past class
               filtering straight to final menu so skip class filter here */
            c = __nh_char_at0(discosyms);
        } else {
            (game.windowprocs.win_end_menu)(tmpwin, __doclassdisco_prompt);
            i = await select_menu(tmpwin, 1, pick_list);
            if (i > 0) {
                c = pick_list[0].item.a_int;
                free(pick_list);
            }
        }
        (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    }
    if (!c) {
        return 0;
    }
    tmpwin = (game.windowprocs.win_create_nhwindow)(5);
    ct = 0;
    switch (c) {
        case 117:
        case 114:
            (game.windowprocs.win_putstr)(tmpwin, game.iflags.menu_headings.attr, upstart(strcpy(buf, __doclassdisco_unique_items)));
            for (i = 0; i < (Math.trunc(8 /* sizeof(const short [4]) */ / 2 /* sizeof(const short) */)); i++) {
                uidx = uniq_objs[i];
                if (game.objects[uidx].oc_name_known || (game.objects[uidx].oc_encountered && uidx != AMULET_OF_YENDOR)) {
                    ++ct;
                    disco_fmt_uniq(uidx, buf);
                    (game.windowprocs.win_putstr)(tmpwin, 0, buf);
                }
            }
            if (!ct) {
                await You(__doclassdisco_havent_discovered_any, __doclassdisco_unique_items);
            }
            break;
        case 97:
            if (game.flags.debug && await yn_function("Dump information about all artifacts?", ynchars, 110, (1)) == 121) {
                /* note: this will work all the time for menustyle traditional
           but requires at least one artifact discovery for other styles
           [could fix that by forcing the 'a' choice into the pick-class
           menu when running in wizard mode] */
                dump_artifact_info(tmpwin);
                /* non-zero vs zero is what matters below */
                ct = NROFARTIFACTS;
                break;
            }
            ct = await disp_artifact_discoveries(tmpwin);
            if (!ct) {
                await You(__doclassdisco_havent_discovered_any, __doclassdisco_artifact_items);
            }
            break;
        default:
            oclass = def_char_to_objclass(c);
            if (oclass == MAXOCLASSES) {
                await impossible("doclassdisco: invalid object class '%s'", visctrl(c));
            }
            buf = sprintf(buf, "Discovered %s in %s", await let_to_name(oclass, (0), (0)), (game.flags.discosort == 111) ? "order of discovery" : (game.flags.discosort == 115) ? "'sortloot' order" : "alphabetical order");
            (game.windowprocs.win_putstr)(tmpwin, 0, buf);
            sorted_ct = 0;
            for (i = game.bases[oclass]; i <= game.bases[oclass + 1] - 1; ++i) {
                if ((dis = game.disco[i]) != 0 && interesting_to_discover(dis)) {
                    ++ct;
                    buf = strcpy(buf, game.objects[dis].oc_encountered ? "  " : "* ");
                    if (lootsort) {
                        await sortloot_descr(dis, __nh_char_at0(__nh_advance_str(buf, 2)));
                    }
                    buf = await disco_append_typename(buf, dis);
                    if (!alphabetized && !lootsort) {
                        (game.windowprocs.win_putstr)(tmpwin, 0, buf);
                    } else {
                        sorted_lines[sorted_ct++] = dupstr(buf);
                    }
                }
            }
            if (!ct) {
                await You(__doclassdisco_havent_discovered_any, await oclass_to_name(oclass, buf));
            } else if (sorted_ct) {
                await qsort_async(sorted_lines, sorted_ct, 8 /* sizeof(char *) */, discovered_cmp);
                for (i = 0; i < sorted_ct; ++i) {
                    let sl = null;
                    sl = sorted_lines[i];
                    if (lootsort) {
                        sl = __nh_char_write(sl, 6, __nh_char_at0(sl));
                        sl = __nh_advance_str(sl, 6);
                    }
                    (game.windowprocs.win_putstr)(tmpwin, 0, sl);
                    free(sorted_lines[i]) , sorted_lines[i] = null;
                }
            }
            break;
    }
    if (ct) {
        await (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return 0;
}
/* put up nameable subset of discoveries list as a menu */
export async function rename_disco() {
    let i = 0;
    let dis = 0;
    let ct = 0;
    let mn = 0;
    let sl = 0;
    let s = null;
    let oclass = 0;
    let prev_class = 0;
    let tmpwin = 0;
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let selected = null;
    let clr = 8;
    let buf = '';
    Object.assign(any, cg.zeroany);
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    for (s = game.flags.inv_order; __nh_char_at0(s); (s = __nh_advance_str(s, 1))) {
        oclass = __nh_char_at0(s);
        prev_class = oclass + 1;
        for (i = game.bases[oclass]; i < NUM_OBJECTS && game.objects[i].oc_class == oclass; i++) {
            dis = game.disco[i];
            if (!dis || !interesting_to_discover(dis)) {
                continue;
            }
            ct++;
            if (!objtyp_is_callable(dis)) {
                continue;
            }
            mn++;
            if (oclass != prev_class) {
                any.a_int = 0;
                await add_menu_heading(tmpwin, await let_to_name(oclass, (0), (0)));
                prev_class = oclass;
            }
            any.a_int = dis;
            buf = '';
            buf = await disco_append_typename(buf, dis);
            await add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        }
    }
    if (ct == 0) {
        await You("haven't discovered anything yet...");
    } else if (mn == 0) {
        await pline("None of your discoveries can be assigned names...");
    } else {
        (game.windowprocs.win_end_menu)(tmpwin, "Pick an object type to name");
        dis = STRANGE_OBJECT;
        sl = await select_menu(tmpwin, 1, selected);
        if (sl > 0) {
            dis = selected[0].item.a_int;
            free(selected);
        }
        if (dis != STRANGE_OBJECT) {
            let odummy = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
            Object.assign(odummy, cg.zeroobj);
            odummy.otyp = dis;
            odummy.oclass = game.objects[dis].oc_class;
            odummy.quan = 1;
            odummy.known = !game.objects[dis].oc_uses_known;
            /* not observe_object: it isn't real */
            odummy.dknown = 1;
            await docall(odummy);
        }
    }
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    return;
}
/* !SFCTOOL */
export function get_sortdisco(opts, cnf) {
    let p = strchr(disco_order_let, game.flags.discosort);
    if (!p) {
        game.flags.discosort = 111 , p = disco_order_let;
    }
    if (cnf) {
        opts = sprintf(opts, "%c", game.flags.discosort);
    } else {
        opts = strcpy(opts, disco_orders_descr[(disco_order_let.length - p.length)]);
    }
}
/*o_init.c*/
/*
         * objects[] sanity check:  must be in ascending oc_class order to
         * be able to use bases[class+1]-1 for the end of a class's range.
         * Also catches a non-contiguous class because reverting to any
         * earlier class would involve switching back to a lower class
         * number after having moved on to one or more other classes.
         */
/* compute oclass_prob_totals */
/* potion of water has the only fixed description */
/* exclude non-magic types and also unique ones */
/* as long as we use only one version of Hack we
       need not save oc_name and oc_descr, but we must save
       oc_uname for all objects */
/* ok, it's actually been unlearned */
/* called via 'm `' where full alphabetize doesn't make sense
           (only showing one class so can't span all classes) but the
           chosen sort will stick and also apply to '\' usage */
/* display any known artifacts as another pseudo-class */
/* FIXME: having 'r' as an accelerator to provide an unseen
                   synonym works but doesn't make much sense since the main
                   selector is 'a' (implicit lootabc) rather than 'u' */
/* there might not be anything for us to do... */
/* get the class (via its symbol character) */
/* more than one choice, or menustyle:full which normally has
               an intermediate class selection menu before the final menu */
/* disp_artifact_discoveries() includes a header */
/* this should never happen but has been observed via the fuzzer */
