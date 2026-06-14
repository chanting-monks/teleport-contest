/* NetHack 5.0	engrave.c	$NHDT-Date: 1737345573 2025/01/19 19:59:33 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.165 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/* doengrave() data */
import { game } from '../gstate.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_see, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { get_rnd_text, getrumor } from '../c2js-runtime/rumors.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, strcat, strchr, strcmp, strcpy, strlen, strncat, strncmpi, strncpy, strstri, xcrypt } from '../c2js-runtime/string.js';
import { is_art } from './artifact.js';
import { exercise } from './attrib.js';
import { sanitize_name } from './bones.js';
import { isok, set_occupation, yn_function } from './cmd.js';
import { db_under_typ, is_ice, is_lava, is_pool, is_pool_or_lava } from './dbridge.js';
import { c_common_strings, ynqchars } from './decl.js';
import { map_engraving, newsym } from './display.js';
import { mon_nam } from './do_name.js';
import { ceiling, on_level, surface } from './dungeon.js';
import { more_experienced } from './exper.js';
import { check_capacity, nomul } from './hack.js';
import { mungspaces } from './hacklib.js';
import { getobj, hold_another_object, prinv, update_inventory, useup } from './invent.js';
import { makemon } from './makemon.js';
import { set_levltyp } from './mkmaze.js';
import { obj_extract_self, splitobj } from './mkobj.js';
import { attacktype, resists_blnd, sticks } from './mondata.js';
import { AIR, ALTAR, AMULET_CLASS, ARMOR_CLASS, ARM_BOOTS, ART_FIRE_BRAND, ATHAME, A_WIS, BALL_CLASS, BLINDED, CHAIN_CLASS, CLOUD, COIN_CLASS, CONFUSION, DEAF, DOOR, DRAWBRIDGE_DOWN, DRAWBRIDGE_UP, FINGERTIP, FLYING, FOOD_CLASS, FOUNTAIN, GEM_CLASS, GETOBJ_DOWNPLAY, GETOBJ_SUGGEST, GRAVE, HALLUC, HALLUC_RES, HAND, ILLOBJ_CLASS, LEVITATION, MAGIC_MARKER, PM_AIR_ELEMENTAL, PM_GHOUL, POTION_CLASS, P_BASIC, P_DAGGER, P_RIDING, P_SABER, RANDOM_CLASS, RING_CLASS, ROCK_CLASS, ROOM, SCROLL_CLASS, SPBOOK_CLASS, STUNNED, S_MIMIC, S_VAMPIRE, S_VORTEX, TOOL_CLASS, TOWEL, VENOM_CLASS, WAND_CLASS, WAN_CANCELLATION, WAN_COLD, WAN_CREATE_MONSTER, WAN_DEATH, WAN_DIGGING, WAN_ENLIGHTENMENT, WAN_FIRE, WAN_LIGHT, WAN_LIGHTNING, WAN_LOCKING, WAN_MAGIC_MISSILE, WAN_MAKE_INVISIBLE, WAN_NOTHING, WAN_OPENING, WAN_POLYMORPH, WAN_PROBING, WAN_SECRET_DOOR_DETECTION, WAN_SLEEP, WAN_SLOW_MONSTER, WAN_SPEED_MONSTER, WAN_STASIS, WAN_STRIKING, WAN_TELEPORTATION, WAN_UNDEAD_TURNING, WAN_WISHING, WEAPON_CLASS, actual_text, pristine_text, remembered_text, text_states } from './nh-constants.js';
import { The, Tobjnam, Yname2, Yobjnam2, doname, otense, xname, yname } from './objnam.js';
import { There, livelog_printf } from './pline.js';
import { body_part } from './polyself.js';
import { make_blinded } from './potion.js';
import { altar_wrath } from './pray.js';
import { wand_explode } from './read.js';
import { rn2, rnd } from './rnd.js';
import { sfi_char, sfi_engr, sfi_unsigned, sfo_char, sfo_engr, sfo_unsigned } from './sfbase.js';
import { check_unpaid } from './shk.js';
import { Strlen_ } from './strutil.js';
import { goodpos } from './teleport.js';
import { t_at, uescaped_shaft, uteetering_at_seen_pit } from './trap.js';
import { dry_a_towel } from './weapon.js';
import { welded } from './wield.js';
import { getlin } from './windows.js';
import { learnwand, zapnodir, zappable } from './zap.js';

// struct _doengrave_ctx: { dengr, doblind, doknown, eow, jello, ptext, teleengr, zapwand, disprefresh, frosted, adding, ret, type, oetype, otmp, oep, buf, ebuf, fbuf, qbuf, post_engr_text, writer, everb, eloc, len }
/* TRUE if we wipe out the current engraving */
/* TRUE if engraving blinds the player */
/* TRUE if we identify the stylus */
/* TRUE if we are overwriting oep */
/* TRUE if we are engraving in slime */
/* TRUE if we must prompt for engrave text */
/* TRUE if we move the old engraving */
/* TRUE if we remove a wand charge */
/* TRUE if the display needs a refresh */
/* TRUE if engraving on ice */
/* TRUE if adding to existing engraving */
/* doengrave return value */
/* Type of engraving made */
/* will be set to type of current engraving */
/* Object selected with which to engrave */
/* The current engraving */
/* Buffer for final/poly engraving text */
/* Buffer for initial engraving text */
/* Buffer for "your fingers" */
/* Buffer for query text */
/* Text displayed after engraving prompt */
/* text of item used for writing */
/* Present tense of engraving type */
/* Where the engraving is (ie dust/floor/...) */
/* # of nonspace chars of new engraving text */
export async function random_engraving(outbuf, pristine_copy) {
    let rumor = null;
    if (!rn2(4) || !(rumor = await getrumor(0, pristine_copy, (1))) || !__nh_char_at0(rumor)) {
        await get_rnd_text("engrave", pristine_copy, rn2, 60);
    }
    outbuf = strcpy(outbuf, pristine_copy);
    wipeout_text(outbuf, (Math.trunc(strlen(outbuf) / 4)), 0);
    return outbuf;
}
/* Partial rubouts for engraving characters. -3. */
const rubouts = [{ wipefrom: 65, wipeto: "^" }, { wipefrom: 66, wipeto: "Pb[" }, { wipefrom: 67, wipeto: "(" }, { wipefrom: 68, wipeto: "|)[" }, { wipefrom: 69, wipeto: "|FL[_" }, { wipefrom: 70, wipeto: "|-" }, { wipefrom: 71, wipeto: "C(" }, { wipefrom: 72, wipeto: "|-" }, { wipefrom: 73, wipeto: "|" }, { wipefrom: 75, wipeto: "|<" }, { wipefrom: 76, wipeto: "|_" }, { wipefrom: 77, wipeto: "|" }, { wipefrom: 78, wipeto: "|\\" }, { wipefrom: 79, wipeto: "C(" }, { wipefrom: 80, wipeto: "F" }, { wipefrom: 81, wipeto: "C(" }, { wipefrom: 82, wipeto: "PF" }, { wipefrom: 84, wipeto: "|" }, { wipefrom: 85, wipeto: "J" }, { wipefrom: 86, wipeto: "/\\" }, { wipefrom: 87, wipeto: "V/\\" }, { wipefrom: 90, wipeto: "/" }, { wipefrom: 98, wipeto: "|" }, { wipefrom: 100, wipeto: "c|" }, { wipefrom: 101, wipeto: "c" }, { wipefrom: 103, wipeto: "c" }, { wipefrom: 104, wipeto: "n" }, { wipefrom: 106, wipeto: "i" }, { wipefrom: 107, wipeto: "|" }, { wipefrom: 108, wipeto: "|" }, { wipefrom: 109, wipeto: "nr" }, { wipefrom: 110, wipeto: "r" }, { wipefrom: 111, wipeto: "c" }, { wipefrom: 113, wipeto: "c" }, { wipefrom: 119, wipeto: "v" }, { wipefrom: 121, wipeto: "v" }, { wipefrom: 58, wipeto: "." }, { wipefrom: 59, wipeto: ",:" }, { wipefrom: 44, wipeto: "." }, { wipefrom: 61, wipeto: "-" }, { wipefrom: 43, wipeto: "-|" }, { wipefrom: 42, wipeto: "+" }, { wipefrom: 64, wipeto: "0" }, { wipefrom: 48, wipeto: "C(" }, { wipefrom: 49, wipeto: "|" }, { wipefrom: 54, wipeto: "o" }, { wipefrom: 55, wipeto: "/" }, { wipefrom: 56, wipeto: "3o" }];
/* degrade some of the characters in a string */
/* engraving text */
/* number of chars to degrade */
/* for semi-controlled randomization */
export function wipeout_text(engr, cnt, seed) {
    if (typeof engr === "string") {
        const __arr = new Array(engr.length + 1);
        for (let __i = 0; __i < engr.length; __i++) __arr[__i] = engr.charCodeAt(__i);
        __arr[engr.length] = 0;
        engr = __arr;
    }
    let s = null;
    let i = 0;
    let j = 0;
    let nxt = 0;
    let use_rubout = 0;
    let lth = strlen(engr);
    if (lth && cnt > 0) {
        while (cnt--) {
            if (!seed) {
                nxt = rn2(lth);
                use_rubout = rn2(4);
            } else {
                /* predictable; caller can reproduce the same sequence by
                   supplying the same arguments later, or a pseudo-random
                   sequence by varying any of them */
                nxt = seed % lth;
                seed *= 31 , seed %= (256 - 1);
                use_rubout = seed & 3;
            }
            s = __nh_advance_str(engr, nxt);
            if (__nh_char_at0(s) == 32) {
                continue;
            }
            if (strchr("?.,'`-|_", __nh_char_at0(s))) {
                engr[nxt] = 32;
                continue;
            }
            if (!use_rubout) {
                i = (Math.trunc(48 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/engrave.c:66:14) [48]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/engrave.c:66:14)) */));
            } else {
                for (i = 0; i < (Math.trunc(48 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/engrave.c:66:14) [48]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/engrave.c:66:14)) */)); i++) {
                    if (__nh_char_at0(s) == rubouts[i].wipefrom) {
                        let ln = strlen(rubouts[i].wipeto);
                        if (!seed) {
                            /*
                         * Pick one of the substitutes at random.
                         */
                            j = rn2(ln);
                        } else {
                            seed *= 31 , seed %= (256 - 1);
                            j = seed % ln;
                        }
                        engr[nxt] = rubouts[i].wipeto.charCodeAt(j);
                        break;
                    }
                }
            }
            /* didn't pick rubout; use '?' for unreadable character */
            if (i == (Math.trunc(48 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/engrave.c:66:14) [48]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/engrave.c:66:14)) */))) {
                engr[nxt] = 63;
            }
        }
    }
    while (lth && __nh_char_at0(__nh_advance_str(engr, lth - 1)) == 32) {
        engr = __nh_char_write(engr, --lth, 0);
    }
}
/* check whether hero can reach something at ground level */
export function can_reach_floor(check_pit) {
    let t = null;
    if (game.u.uswallow || (game.u.ustuck && !sticks(game.youmonst.data) && attacktype(game.u.ustuck.data, 7)) || (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))))) {
        return (0);
    }
    /* assume that arms are pinned rather than that the hero
               has been lifted up above the floor [doesn't explain
               how hero can attack the creature holding him or her;
               that's life in nethack...] */
    /* Restricted/unskilled riders can't reach the floor */
    if (game.u.usteed && (game.u.weapon_skills[P_RIDING].skill) < P_BASIC) {
        return (0);
    }
    if (game.u.uundetected && ((((game.youmonst.data).mflags1 & 256) != 0) && (((((game.youmonst.data).mflags1 & 16) != 0) && (game.youmonst.data).mlet != S_MIMIC) || (((game.youmonst.data).mflags1 & 1) != 0)))) {
        return (0);
    }
    if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || game.youmonst.data.msize >= 4) {
        return (1);
    }
    if (check_pit && (t = t_at(game.u.ux, game.u.uy)) != null && (uteetering_at_seen_pit(t) || uescaped_shaft(t))) {
        return (0);
    }
    return (1);
}
/* give a message after caller has determined that hero can't reach */
export async function cant_reach_floor(x, y, up, check_pit, wand_engraving) {
    await pline("%s can't reach the %s.", wand_engraving ? "The wand does nothing more, and the tip of the wand" : "You", up ? ceiling(x, y) : (check_pit && can_reach_floor((0))) ? "bottom of the pit" : surface(x, y));
}
export function engr_at(x, y) {
    let ep = game.head_engr;
    while (ep) {
        if (x == ep.engr_x && y == ep.engr_y) {
            return ep;
        }
        ep = ep.nxt_engr;
    }
    return null;
}
/* Decide whether a particular string is engraved at a specified
 * location; a case-insensitive substring match is used.
 * Ignore headstones, in case the player names herself "Elbereth".
 *
 * If strict checking is requested, the word is only considered to be
 * present if it is intact and is the entire content of the engraving.
 */
export function sengr_at(s, x, y, strict) {
    let ep = engr_at(x, y);
    if (ep && ep.engr_type != 6 && ep.engr_time <= game.moves) {
        if (strict ? !strncmpi((ep.engr_txt[actual_text]), (s), -1) : (strstri(ep.engr_txt[actual_text], s) != null)) {
            return ep;
        }
    }
    return (null);
}
export async function u_wipe_engr(cnt) {
    if (can_reach_floor((1))) {
        await wipe_engr_at(game.u.ux, game.u.uy, cnt, (0));
    }
}
export async function wipe_engr_at(x, y, cnt, magical) {
    let ep = engr_at(x, y);
    if (ep && ep.engr_type != 6 && !ep.nowipeout) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/engrave.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                await pline("asked to erode %d characters", cnt);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        if (ep.engr_type != 3 || is_ice(x, y) || (magical && !rn2(2))) {
            if (ep.engr_type != 1 && ep.engr_type != 5) {
                /* Headstones and some specially marked engravings are indelible */
                cnt = rn2(1 + Math.trunc(50 / (cnt + 1))) ? 0 : 1;
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/engrave.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        await pline("actually eroding %d characters", cnt);
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
            }
            wipeout_text(ep.engr_txt[actual_text], cnt, 0);
            while (ep.engr_txt[actual_text][0] == 32) {
                ep.engr_txt[actual_text]++;
            }
            if (!ep.engr_txt[actual_text][0]) {
                await del_engr(ep);
            }
        }
    }
}
/*
 * Returns:
 *    non-zero if it can be felt
 */
export function engr_can_be_felt(ep) {
    let canfeel = (0);
    switch (ep.engr_type) {
        case 2:
        case 6:
        case 3:
            canfeel = (1);
            break;
        case 1:
        case 4:
        case 5:
        default:
            canfeel = (0);
            break;
    }
    return canfeel;
}
export async function read_engr_at(x, y) {
    let ep = engr_at(x, y);
    let eloc = surface(x, y);
    let sensed = 0;
    if (ep && ep.engr_txt[actual_text][0]) {
        switch (ep.engr_type) {
            case 1:
                /* since doname() yields "N items" when quantity is more than
               one, match that by using "1 of" rather than "one of" when
               informing the player that the stack will be split */
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    /* Sensing an engraving does not require sight for some engraving types,
     * nor does it necessarily imply comprehension (literacy).
     */
                    /* "It's a message!  Scrawled in blood!"
             * "What's it say?"
             * "It says... `See you next Wednesday.'" -- Thriller
             */
                    sensed = 1;
                    await pline("%s is written here in the %s.", c_common_strings.c_Something, is_ice(x, y) ? "frost" : "dust");
                }
                break;
            case 2:
            case 6:
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || can_reach_floor((1))) {
                    sensed = 1;
                    await pline("%s is engraved here on the %s.", c_common_strings.c_Something, eloc);
                }
                break;
            case 3:
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || can_reach_floor((1))) {
                    sensed = 1;
                    await pline("Some text has been %s into the %s here.", is_ice(x, y) ? "melted" : "burned", eloc);
                }
                break;
            case 4:
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    sensed = 1;
                    await pline("There's some graffiti on the %s here.", eloc);
                }
                break;
            case 5:
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    sensed = 1;
                    await You_see("a message scrawled in blood here.");
                }
                break;
            default:
                await impossible("%s is written in a very strange way.", c_common_strings.c_Something);
                sensed = 1;
        }
        if (sensed) {
            let et = null;
            /* holds the post-this-action engr text, including
                      * anything already there */
            let buf = '';
            let endpunct = null;
            let maxelen = (256 /* sizeof(char [256]) */ - 24 /* sizeof(char [24]) */);
            let elen = strlen(ep.engr_txt[actual_text]);
            let off = (ep.engr_txt[actual_text] - (((ep) + 1)));
            if (elen > maxelen) {
                /* sizeof "literal" counts terminating \0 */
                buf = strncpy(buf, ep.engr_txt[actual_text], maxelen);
                buf = __nh_char_write(buf, maxelen, 0);
                et = buf;
                elen = maxelen;
            } else {
                et = ep.engr_txt[actual_text];
            }
            endpunct = "";
            if (elen < 2 || !((ep.engr_txt[pristine_text][off + elen - 1] == __nh_char_at0(__nh_advance_str(et, elen - 1))) && strchr(".!?", __nh_char_at0(__nh_advance_str(et, elen - 1))))) {
                /* only skip if punctuation is original, not degraded char */
                endpunct = ".";
            }
            await You("%s: \"%s\"%s", (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? "feel the words" : "read", et, endpunct);
            ep.engr_txt[remembered_text] = strcpy(ep.engr_txt[remembered_text], ep.engr_txt[actual_text]);
            ep.eread = 1;
            ep.erevealed = 1;
            if (game.context.run > 0) {
                nomul(0);
            }
        }
    }
}
export async function make_engr_at(x, y, s, pristine_s, e_time, e_type) {
    {
        // Minimal JS-friendly make_engr_at: build an engr object
        // with engr_txt as 3 char-arrays, link into head_engr.
        // C ref: engrave.c:408-451.  No RNG fired here unless
        // e_type == 0 (random type), in which case rnd(6-1) fires —
        // we forward that to match C.
        const __toArr = (str) => {
            if (str == null) return null;
            if (Array.isArray(str)) return str.slice();
            const arr = new Array(str.length + 1);
            for (let __i = 0; __i < str.length; __i++) arr[__i] = str.charCodeAt(__i);
            arr[str.length] = 0;
            return arr;
        };
        const __sStr = Array.isArray(s) ? ((() => { let __r=''; for (let __i=0; __i<s.length && s[__i]; __i++) __r += String.fromCharCode(s[__i]); return __r; })()) : (typeof s === 'string' ? s : '');
        let __oldEp = engr_at(x, y);
        if (__oldEp) await del_engr(__oldEp);
        const __ep = {
            nxt_engr: game.head_engr,
            engr_x: x, engr_y: y,
            engr_time: e_time,
            engr_type: (e_type > 0) ? e_type : rnd(6 - 1),
            engr_txt: [__toArr(s), __toArr(s), __toArr(pristine_s || s)],
            nowipeout: 0, guardobjects: 0,
            engr_szeach: __sStr.length + 1, engr_alloc: (__sStr.length + 1) * 3,
        };
        game.head_engr = __ep;
        if (__sStr === 'Elbereth') {
            if (game.in_mklev) {
                __ep.guardobjects = 1;
            } else {
                await exercise(A_WIS, (1));
            }
        }
        return;
    }
    // eslint-disable-next-line no-unreachable
    let i = 0;
    let ep = null;
    let smem = await Strlen_(s, "make_engr_at", 417) + 1;
    let havepristine = (0);
    if (pristine_s != (null)) {
        let prmem = await Strlen_(pristine_s, "make_engr_at", 421) + 1;
        if (prmem > smem) {
            smem = prmem;
        }
        havepristine = (1);
    }
    if ((ep = engr_at(x, y)) != null) {
        await del_engr(ep);
    }
    ep = alloc((smem * 3) + 1 /* sizeof(struct engr) */);
    memset(ep, 0, (smem * 3) + 1 /* sizeof(struct engr) */);
    ep.nxt_engr = game.head_engr;
    game.head_engr = ep;
    ep.engr_x = x;
    ep.engr_y = y;
    ep.engr_txt[actual_text] = (((ep) + 1));
    ep.engr_txt[remembered_text] = ep.engr_txt[actual_text] + smem;
    ep.engr_txt[pristine_text] = ep.engr_txt[remembered_text] + smem;
    for (i = 0; i < text_states; ++i) {
        ep.engr_txt[i] = strcpy(ep.engr_txt[i], s);
    }
    if (havepristine) {
        ep.engr_txt[pristine_text] = strcpy(ep.engr_txt[pristine_text], pristine_s);
    }
    if (!strcmp(s, "Elbereth")) {
        if (game.in_mklev) {
            ep.guardobjects = 1;
        } else {
            await exercise(A_WIS, (1));
        }
    }
    ep.engr_time = e_time;
    ep.engr_type = ((e_type > 0) ? e_type : rnd(6 - 1));
    ep.engr_szeach = smem;
    /* we do not set ep->eread or ep->erevealed;
     * the caller will need to if required */
    ep.engr_alloc = smem * 3;
}
/* delete any engraving at location <x,y> */
export async function del_engr_at(x, y) {
    let ep = engr_at(x, y);
    if (ep) {
        await del_engr(ep);
    }
}
/*
 * freehand - returns true if player has a free hand
 */
export function freehand() {
    return (!game.uwep || !welded(game.uwep) || (!((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && game.objects[game.uwep.otyp].oc_big) && (!game.uarms || !game.uarms.cursed)));
}
/* getobj callback for an object to engrave with */
export function stylus_ok(obj) {
    if (!obj) {
        return GETOBJ_SUGGEST;
    }
    /* Potential extension: exclude weapons that don't make any sense (such as
     * bullwhips) and downplay rings and gems that wouldn't be good to write
     * with (such as glass and non-gem rings) */
    if (obj.oclass == WEAPON_CLASS || obj.oclass == WAND_CLASS || obj.oclass == GEM_CLASS || obj.oclass == RING_CLASS) {
        return GETOBJ_SUGGEST;
    }
    /* Only markers and towels are recommended tools. */
    if (obj.oclass == TOOL_CLASS && (obj.otyp == TOWEL || obj.otyp == MAGIC_MARKER)) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_DOWNPLAY;
}
/* can hero engrave at all (at their location)? */
export async function u_can_engrave() {
    let levtyp = ((game.level.locations[game.u.ux][game.u.uy].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[game.u.ux][game.u.uy].flags) : game.level.locations[game.u.ux][game.u.uy].typ);
    if (game.u.uswallow) {
        /* Note: for amorphous engulfers, writing attempt is allowed here
           but yields the 'jello' result in doengrave() */
        if ((((game.u.ustuck.data).mflags1 & 262144) != 0)) {
            await pline("What would you write?  \"Jonah was here\"?");
            return (0);
        } else if (((game.u.ustuck.data).mlet == S_VORTEX || (game.u.ustuck.data) == game.mons[PM_AIR_ELEMENTAL])) {
            await cant_reach_floor(game.u.ux, game.u.uy, (0), (0), (0));
            return (0);
        }
    } else if (is_lava(game.u.ux, game.u.uy)) {
        await You_cant("write on the %s!", surface(game.u.ux, game.u.uy));
        return (0);
    } else if (is_pool(game.u.ux, game.u.uy) || ((levtyp) == FOUNTAIN)) {
        await You_cant("write on the %s!", surface(game.u.ux, game.u.uy));
        return (0);
    } else if (((levtyp) == AIR || (levtyp) == CLOUD)) {
        await You_cant("write in %s!", (levtyp == CLOUD) ? "cloud vapor" : "thin air");
        return (0);
    } else if (!((levtyp) >= DOOR)) {
        await You_cant("write here.");
        return (0);
    }
    if (((((game.youmonst.data).mflags1 & 8192) != 0) || ((game.youmonst.data).msize < 1))) {
        await You_cant("even hold anything!");
        return (0);
    }
    if (await check_capacity(null)) {
        return (0);
    }
    return (1);
}
/* initialize the doengrave data */
export function doengrave_ctx_init(de) {
    de.dengr = (0);
    de.doblind = (0);
    de.doknown = (0);
    de.eow = (0);
    de.ptext = (1);
    de.teleengr = (0);
    de.zapwand = (0);
    de.disprefresh = (0);
    de.adding = (0);
    de.ret = 0;
    de.type = 1;
    de.oetype = 0;
    de.otmp = null;
    de.oep = engr_at(game.u.ux, game.u.uy);
    de.buf = '';
    de.ebuf = '';
    de.fbuf = '';
    de.qbuf = '';
    de.post_engr_text = '';
    de.writer = null;
    if (de.oep) {
        de.oetype = de.oep.engr_type;
    }
    if ((((game.youmonst.data).mflags2 & 256) != 0) || ((game.youmonst.data).mlet == S_VAMPIRE)) {
        de.type = 5;
    }
    de.jello = (game.u.uswallow && !((((game.u.ustuck.data).mflags1 & 262144) != 0) || ((game.u.ustuck.data).mlet == S_VORTEX || (game.u.ustuck.data) == game.mons[PM_AIR_ELEMENTAL])));
    de.frosted = is_ice(game.u.ux, game.u.uy);
}
/* special engraving effects for WAND objects */
export async function doengrave_sfx_item_WAN(de) {
    switch (de.otmp.otyp) {
        default:
            break;
        case WAN_LIGHT:
        case WAN_SECRET_DOOR_DETECTION:
        case WAN_STASIS:
        case WAN_CREATE_MONSTER:
        case WAN_WISHING:
        case WAN_ENLIGHTENMENT:
            await zapnodir(de.otmp);
            break;
        /* If wand is "IMMEDIATE", remember to affect the
         * previous engraving even if turning to dust.
         */
        case WAN_STRIKING:
            de.post_engr_text = strcpy(de.post_engr_text, "The wand unsuccessfully fights your attempt to write!");
            break;
        case WAN_SLOW_MONSTER:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                de.post_engr_text = sprintf(de.post_engr_text, "The bugs on the %s slow down!", surface(game.u.ux, game.u.uy));
            }
            break;
        case WAN_SPEED_MONSTER:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                de.post_engr_text = sprintf(de.post_engr_text, "The bugs on the %s speed up!", surface(game.u.ux, game.u.uy));
            }
            break;
        case WAN_POLYMORPH:
            if (de.oep) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    de.type = 0;
                    await random_engraving(de.buf, de.ebuf);
                } else {
                    /* keep the same type so that feels don't
                   change and only the text is altered,
                   but you won't know anyway because
                   you're a _blind writer_ */
                    if (de.oetype) {
                        de.type = de.oetype;
                    }
                    xcrypt(blengr(), de.buf);
                }
                de.dengr = (1);
            }
            break;
        case WAN_NOTHING:
        case WAN_UNDEAD_TURNING:
        case WAN_OPENING:
        case WAN_LOCKING:
        case WAN_PROBING:
            break;
        case WAN_MAGIC_MISSILE:
            de.ptext = (1);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                de.post_engr_text = sprintf(de.post_engr_text, "The %s is riddled by bullet holes!", surface(game.u.ux, game.u.uy));
            }
            break;
        /* can't tell sleep from death - Eric Backus */
        case WAN_SLEEP:
        case WAN_DEATH:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                de.post_engr_text = sprintf(de.post_engr_text, "The bugs on the %s stop moving!", surface(game.u.ux, game.u.uy));
            }
            break;
        case WAN_COLD:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                de.post_engr_text = strcpy(de.post_engr_text, "A few ice cubes drop from the wand.");
            }
            if (!de.oep || (de.oep.engr_type != 3)) {
                break;
            }
            ;
        case WAN_CANCELLATION:
        case WAN_MAKE_INVISIBLE:
            if (de.oep && de.oep.engr_type != 6) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline_The("engraving on the %s vanishes!", surface(game.u.ux, game.u.uy));
                }
                de.dengr = (1);
            }
            break;
        case WAN_TELEPORTATION:
            if (de.oep && de.oep.engr_type != 6) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline_The("engraving on the %s vanishes!", surface(game.u.ux, game.u.uy));
                }
                de.teleengr = (1);
            }
            break;
        case WAN_DIGGING:
            de.ptext = (1);
            de.type = 2;
            if (!game.objects[de.otmp.otyp].oc_name_known) {
                if (game.flags.verbose) {
                    await pline("This %s is a wand of digging!", await xname(de.otmp));
                }
                de.doknown = (1);
            }
            de.post_engr_text = strcpy(de.post_engr_text, (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "You hear drilling!" : ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "You feel tremors." : ((game.level.locations[game.u.ux][game.u.uy].typ) == GRAVE) ? "Chips fly out from the headstone." : de.frosted ? "Ice chips fly up from the ice surface!" : (game.level.locations[game.u.ux][game.u.uy].typ == DRAWBRIDGE_DOWN) ? "Splinters fly up from the bridge." : "Gravel flies up from the floor.");
            break;
        case WAN_FIRE:
            de.ptext = (1);
            de.type = 3;
            if (!game.objects[de.otmp.otyp].oc_name_known) {
                if (game.flags.verbose) {
                    await pline("This %s is a wand of fire!", await xname(de.otmp));
                }
                de.doknown = (1);
            }
            de.post_engr_text = strcpy(de.post_engr_text, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "You feel the wand heat up." : "Flames fly from the wand.");
            break;
        case WAN_LIGHTNING:
            de.ptext = (1);
            de.type = 3;
            if (!game.objects[de.otmp.otyp].oc_name_known) {
                if (game.flags.verbose) {
                    await pline("This %s is a wand of lightning!", await xname(de.otmp));
                }
                de.doknown = (1);
            }
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                de.post_engr_text = strcpy(de.post_engr_text, "Lightning arcs from the wand.");
                de.doblind = (1);
            } else {
                de.post_engr_text = strcpy(de.post_engr_text, !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "You hear crackling!" : "Your hair stands up!");
            }
            break;
    }
}
/* special engraving effects for all objects */
export async function doengrave_sfx_item(de) {
    switch (de.otmp.oclass) {
        default:
        case AMULET_CLASS:
        case CHAIN_CLASS:
        case POTION_CLASS:
        case COIN_CLASS:
            break;
        case RING_CLASS:
        case GEM_CLASS:
            if (game.objects[de.otmp.otyp].oc_tough) {
                /* "diamond" rings and others should work */
                /* diamonds & other hard gems should work */
                de.type = 2;
                break;
            }
            break;
        case ARMOR_CLASS:
            if ((de.otmp.oclass == ARMOR_CLASS && game.objects[de.otmp.otyp].oc_subtyp == ARM_BOOTS)) {
                /* ensures the "cannot wipe out" case */
                de.type = 1;
                break;
            }
            ;
        /* Objects too large to engrave with */
        case BALL_CLASS:
        case ROCK_CLASS:
            await You_cant("engrave with such a large object!");
            de.ptext = (0);
            break;
        /* Objects too silly to engrave with */
        case FOOD_CLASS:
        case SCROLL_CLASS:
        case SPBOOK_CLASS:
            await pline("%s would get %s.", await Yname2(de.otmp), de.frosted ? "all frosty" : "too dirty");
            de.ptext = (0);
            break;
        /* This should mean fingers */
        case RANDOM_CLASS:
            break;
        case WAND_CLASS:
            if (await zappable(de.otmp)) {
                await check_unpaid(de.otmp);
                if (de.otmp.cursed && !rn2(100)) {
                    await wand_explode(de.otmp, 0);
                    de.ret = 1;
                    return (0);
                }
                de.zapwand = (1);
                if (!can_reach_floor((1))) {
                    /* failing to wrest one last charge takes time */
                    /* use "early exit" below, return 1 */
                    de.ptext = (0);
                }
                await doengrave_sfx_item_WAN(de);
            } else {
                de.ptext = (0);
                if (can_reach_floor((1))) {
                    if (de.otmp.spe < 0) {
                        de.zapwand = (1);
                    } else {
                        await pline_The("wand is too worn out to engrave.");
                    }
                }
            }
            break;
        case WEAPON_CLASS:
            if (is_art(de.otmp, ART_FIRE_BRAND)) {
                de.type = 3;
            } else if ((de.otmp.oclass == WEAPON_CLASS && game.objects[de.otmp.otyp].oc_subtyp >= P_DAGGER && game.objects[de.otmp.otyp].oc_subtyp <= P_SABER)) {
                if (welded(de.otmp)) {
                    await pline("%s can only scratch the %s.", await Yname2(de.otmp), surface(game.u.ux, game.u.uy));
                } else if (de.otmp.spe <= -3) {
                    await pline("%s too dull for engraving.", await Yobjnam2(de.otmp, "are"));
                } else {
                    de.type = 2;
                }
            }
            break;
        case TOOL_CLASS:
            if (de.otmp == game.ublindf) {
                await pline("That is a bit difficult to engrave with, don't you think?");
                de.ret = 4;
                return (0);
            }
            switch (de.otmp.otyp) {
                case MAGIC_MARKER:
                    if (de.otmp.spe <= 0) {
                        await Your("marker has dried out.");
                    } else {
                        de.type = 4;
                    }
                    break;
                case TOWEL:
                    de.ptext = (0);
                    if (de.oep) {
                        if (de.oep.engr_type == 1 || de.oep.engr_type == 5 || de.oep.engr_type == 4) {
                            /* Can't really engrave with a towel */
                            if (((de.otmp).otyp == TOWEL && (de.otmp).spe > 0)) {
                                await dry_a_towel(de.otmp, -1, (1));
                            }
                            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                                await You("wipe out the message here.");
                            } else {
                                await pline("%s %s.", await Yobjnam2(de.otmp, "get"), de.frosted ? "frosty" : "dusty");
                            }
                            de.dengr = (1);
                        } else {
                            await pline("%s can't wipe out this engraving.", await Yname2(de.otmp));
                        }
                    } else {
                        await pline("%s %s.", await Yobjnam2(de.otmp, "get"), de.frosted ? "frosty" : "dusty");
                    }
                    break;
                default:
                    break;
            }
            break;
        case VENOM_CLASS:
            await pline("Writing a poison pen letter?");
            break;
        case ILLOBJ_CLASS:
            await impossible("You're engraving with an illegal object!");
            break;
    }
    return (1);
}
/* which verb phrasing to use for engraving */
export function doengrave_ctx_verb(de) {
    switch (de.type) {
        default:
            de.everb = de.adding ? "add to the weird writing on" : "write strangely on";
            break;
        case 1:
            de.everb = de.adding ? "add to the writing in" : "write in";
            de.eloc = de.frosted ? "frost" : "dust";
            break;
        case 6:
            de.everb = de.adding ? "add to the epitaph on" : "engrave on";
            break;
        case 2:
            de.everb = de.adding ? "add to the engraving in" : "engrave in";
            break;
        case 3:
            de.everb = de.adding ? (de.frosted ? "add to the text melted into" : "add to the text burned into") : (de.frosted ? "melt into" : "burn into");
            break;
        case 4:
            de.everb = de.adding ? "add to the graffiti on" : "scribble on";
            break;
        case 5:
            de.everb = de.adding ? "add to the scrawl on" : "scrawl on";
            break;
    }
}
/* Mohs' Hardness Scale:
 *  1 - Talc             6 - Orthoclase
 *  2 - Gypsum           7 - Quartz
 *  3 - Calcite          8 - Topaz
 *  4 - Fluorite         9 - Corundum
 *  5 - Apatite         10 - Diamond
 *
 * Since granite is an igneous rock hardness ~ 7, anything >= 8 should
 * probably be able to scratch the rock.
 * Devaluation of less hard gems is not easily possible because obj struct
 * does not contain individual oc_cost currently. 7/91
 *
 * steel      - 5-8.5   (usu. weapon)
 * diamond    - 10                      * jade       -  5-6      (nephrite)
 * ruby       -  9      (corundum)      * turquoise  -  5-6
 * sapphire   -  9      (corundum)      * opal       -  5-6
 * topaz      -  8                      * glass      - ~5.5
 * emerald    -  7.5-8  (beryl)         * dilithium  -  4-5??
 * aquamarine -  7.5-8  (beryl)         * iron       -  4-5
 * garnet     -  7.25   (var. 6.5-8)    * fluorite   -  4
 * agate      -  7      (quartz)        * brass      -  3-4
 * amethyst   -  7      (quartz)        * gold       -  2.5-3
 * jasper     -  7      (quartz)        * silver     -  2.5-3
 * onyx       -  7      (quartz)        * copper     -  2.5-3
 * moonstone  -  6      (orthoclase)    * amber      -  2-2.5
 */
/* the #engrave command */
export async function doengrave() {
    let sp = null;
    let de = null;
    let retval = 0;
    let initial_msg_given = 0;
    doengr_exit: {
        /* Place holder for space count of engr text */
        initial_msg_given = (0);
        if (!await u_can_engrave()) {
            return 4;
        }
        de = alloc(1 /* sizeof(struct _doengrave_ctx) */);
        doengrave_ctx_init(de);
        game.multi = 0;
        game.nomovemsg = null;
        de.otmp = await getobj("write with", stylus_ok, 2);
        if (!de.otmp) {
            /* otmp == &hands_obj if fingers */
            de.ret = 2;
            break doengr_exit;
        }
        if (de.otmp == game.hands_obj) {
            strcat(strcpy(de.fbuf, "your "), await body_part(FINGERTIP));
            de.writer = de.fbuf;
        } else {
            de.writer = await yname(de.otmp);
        }
        if (!freehand() && de.otmp != game.uwep && !de.otmp.owornmask) {
            await You("have no free %s to write with!", await body_part(HAND));
            break doengr_exit;
        }
        if (de.jello) {
            await You("tickle %s with %s.", await mon_nam(game.u.ustuck), de.writer);
            await Your("message dissolves...");
            break doengr_exit;
        }
        if (!can_reach_floor((1))) {
            if (de.otmp.oclass != WAND_CLASS) {
                await cant_reach_floor(game.u.ux, game.u.uy, (0), (1), (0));
                break doengr_exit;
            } else {
                await You("gesture, with your wand, towards the %s below you.", surface(game.u.ux, game.u.uy));
                initial_msg_given = (1);
            }
        }
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR)) {
            if (!initial_msg_given) {
                await You("make a motion towards the altar with %s.", de.writer);
            }
            await altar_wrath(game.u.ux, game.u.uy);
            break doengr_exit;
        }
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == GRAVE)) {
            if (de.otmp == game.hands_obj) {
                await You("would only make a small smudge on the %s.", surface(game.u.ux, game.u.uy));
                break doengr_exit;
            } else if (!game.level.locations[game.u.ux][game.u.uy].horizontal) {
                await disturb_grave(game.u.ux, game.u.uy);
                break doengr_exit;
            }
        }
        if (!await doengrave_sfx_item(de)) {
            break doengr_exit;
        }
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == GRAVE)) {
            if (de.type == 2 || de.type == 0) {
                de.type = 6;
            } else {
                de.type = 1;
                de.dengr = (0);
                de.teleengr = (0);
                de.buf = '';
            }
        }
        if (de.doknown) {
            await learnwand(de.otmp);
            if (game.objects[de.otmp.otyp].oc_name_known) {
                await more_experienced(0, 10);
            }
        }
        if (de.teleengr) {
            await rloc_engr(de.oep);
            de.oep.eread = 0;
            de.oep.erevealed = 0;
            de.disprefresh = (1);
            de.oep = null;
        }
        if (de.dengr) {
            await del_engr(de.oep);
            de.oep = null;
            de.disprefresh = (1);
        }
        if (de.buf) {
            /* Something has changed the engraving here */
            let tmp_ep = null;
            await make_engr_at(game.u.ux, game.u.uy, de.buf, de.ebuf, game.moves, de.type);
            tmp_ep = engr_at(game.u.ux, game.u.uy);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                if (tmp_ep != null) {
                    await pline_The("engraving now reads: \"%s\".", de.buf);
                    tmp_ep.eread = 1;
                    tmp_ep.erevealed = 1;
                    de.disprefresh = (1);
                }
            }
            de.ptext = (0);
        }
        if (de.zapwand && (de.otmp.spe < 0)) {
            await pline("%s %sturns to dust.", await The(await xname(de.otmp)), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : "glows violently, then ");
            if (!((game.level.locations[game.u.ux][game.u.uy].typ) == GRAVE)) {
                await You("are not going to get anywhere trying to write in the %s with your dust.", de.frosted ? "frost" : "dust");
            }
            await useup(de.otmp);
            de.otmp = null;
            de.ptext = (0);
        }
        if (!de.ptext) {
            /* Early exit for some implements. */
            if (de.otmp && de.otmp.oclass == WAND_CLASS && !can_reach_floor((1))) {
                await cant_reach_floor(game.u.ux, game.u.uy, (0), (1), (1));
            }
            de.ret = 1;
            break doengr_exit;
        }
        if (de.oep) {
            /*
     * Special effects should have deleted the current engraving (if
     * possible) by now.
     */
            let c = 110;
            if (de.type == 6) {
                /* Give player the choice to add to engraving. */
                c = 121;
            } else if (de.type == de.oep.engr_type && (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || de.oep.engr_type == 3 || de.oep.engr_type == 2)) {
                c = await yn_function("Do you want to add to the current engraving?", ynqchars, 121, (1));
                if (c == 113) {
                    await pline("%s", c_common_strings.c_Never_mind);
                    break doengr_exit;
                }
            }
            if (c == 110 || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                if (de.oep.engr_type == 1 || de.oep.engr_type == 5 || de.oep.engr_type == 4) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await You("wipe out the message that was %s here.", (de.oep.engr_type == 1) ? (de.frosted ? "written in the frost" : "written in the dust") : (de.oep.engr_type == 5) ? "scrawled in blood" : "written");
                        await del_engr(de.oep);
                        de.oep = null;
                        de.disprefresh = (1);
                    } else {
                        /* defer deletion until after we *know* we're engraving */
                        de.eow = (1);
                    }
                } else if (de.type == 1 || de.type == 4 || de.type == 5) {
                    await You("cannot wipe out the message that is %s the %s here.", (de.oep.engr_type == 3) ? (de.frosted ? "melted into" : "burned into") : "engraved in", surface(game.u.ux, game.u.uy));
                    de.ret = 1;
                    break doengr_exit;
                } else if (de.type != de.oep.engr_type || c == 110) {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || can_reach_floor((1))) {
                        await You("will overwrite the current message.");
                    }
                    de.eow = (1);
                }
            } else if (de.oep && await Strlen_(de.oep.engr_txt[actual_text], "doengrave", 1163) >= 256 - 1) {
                await There("is no room to add anything else here.");
                de.ret = 1;
                break doengr_exit;
            }
        }
        de.eloc = surface(game.u.ux, game.u.uy);
        de.adding = (de.oep && !de.eow);
        doengrave_ctx_verb(de);
        if (de.otmp != game.hands_obj) {
            await You("%s the %s with %s%s.", de.everb, de.eloc, (de.type == 2 && de.otmp.quan > 1) ? "1 of " : "", await doname(de.otmp));
        } else {
            await You("%s the %s with your %s.", de.everb, de.eloc, await body_part(FINGERTIP));
        }
        de.qbuf = sprintf(de.qbuf, "What do you want to %s the %s here?", de.everb, de.eloc);
        de.ebuf = await getlin(de.qbuf, de.ebuf);
        /* convert tabs to spaces and condense consecutive spaces to one */
        de.ebuf = mungspaces(de.ebuf);
        /* Count the actual # of chars engraved not including spaces */
        de.len = strlen(de.ebuf);
        for (sp = de.ebuf; __nh_char_at0(sp); (sp = __nh_advance_str(sp, 1))) {
            if (__nh_char_at0(sp) == 32) {
                de.len -= 1;
            }
        }
        if (de.len == 0 || strchr(de.ebuf, 27)) {
            if (de.zapwand) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    await pline("%s, then %s.", await Tobjnam(de.otmp, "glow"), await otense(de.otmp, "fade"));
                }
                de.ret = 1;
                break doengr_exit;
            } else {
                await pline("%s", c_common_strings.c_Never_mind);
                break doengr_exit;
            }
        }
        /* A single `x' is the traditional signature of an illiterate person */
        if (de.len != 1 || (!strchr(de.ebuf, 120) && !strchr(de.ebuf, 88))) {
            if (!game.u.uconduct.literate++) {
                livelog_printf(32, "became literate by engraving \"%s\"", de.ebuf);
            }
        }
        for (sp = de.ebuf; __nh_char_at0(sp); (sp = __nh_advance_str(sp, 1))) {
            /* Mix up engraving if surface or state of mind is unsound.
       Note: this won't add or remove any spaces. */
            if (__nh_char_at0(sp) == 32) {
                continue;
            }
            if (((de.type == 1 || de.type == 5) && !rn2(25)) || (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !rn2(11)) || (game.u.uprops[CONFUSION].intrinsic && !rn2(7)) || (game.u.uprops[STUNNED].intrinsic && !rn2(4)) || ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !rn2(2))) {
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 32 + rnd(96 - 2)) */;
            }
        }
        if (de.eow) {
            await del_engr(de.oep);
            de.oep = null;
            de.disprefresh = (1);
        }
        game.context.engraving.text = strcpy(game.context.engraving.text, de.ebuf);
        game.context.engraving.nextc = game.context.engraving.text;
        game.context.engraving.stylus = de.otmp;
        game.context.engraving.type = de.type;
        game.context.engraving.pos.x = game.u.ux;
        game.context.engraving.pos.y = game.u.uy;
        game.context.engraving.actionct = 0;
        set_occupation(engrave, "engraving", 0);
        if (de.post_engr_text[0]) {
            await pline("%s", de.post_engr_text);
        }
        if (de.doblind && !await resists_blnd(game.youmonst)) {
            await You("are blinded by the flash!");
            await make_blinded(rnd(50), (0));
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await Your("%s", c_common_strings.c_vision_clears);
            }
        }
    }
    if (de.disprefresh) {
        await newsym(game.u.ux, game.u.uy);
    }
    retval = de.ret;
    free(de);
    return retval;
}
/* occupation callback for engraving some text */
export async function engrave() {
    let oep = null;
    let buf = '';
    let finishverb = null;
    /* shorthand for svc.context.engraving.stylus */
    let stylus = null;
    let firsttime = (game.context.engraving.actionct == 0);
    /* # characters that can be engraved in this action */
    let rate = 10;
    let truncate = (0);
    let neweng = (game.context.engraving.actionct == 0);
    let carving = (game.context.engraving.type == 2 || game.context.engraving.type == 6);
    let dulling_wep = 0;
    let marker = 0;
    /* points at character 1 beyond the last character to engrave
                 * this action */
    let endc = null;
    let i = 0;
    let space_left = 0;
    if (game.context.engraving.pos.x != game.u.ux || game.context.engraving.pos.y != game.u.uy) {
        await You("are unable to continue engraving.");
        return 0;
    }
    if (game.context.engraving.stylus == game.hands_obj) {
        /* Stylus might have been taken out of inventory and destroyed somehow.
     * Not safe to dereference stylus until after this. */
        stylus = null;
    } else {
        for (stylus = game.invent; stylus; stylus = stylus.nobj) {
            if (stylus == game.context.engraving.stylus) {
                break;
            }
        }
        if (!stylus) {
            await You("are unable to continue engraving.");
            return 0;
        }
    }
    dulling_wep = (carving && stylus && stylus.oclass == WEAPON_CLASS && (stylus.otyp != ATHAME || stylus.cursed));
    marker = (stylus && stylus.otyp == MAGIC_MARKER && game.context.engraving.type == 4);
    game.context.engraving.actionct++;
    if (dulling_wep && !(stylus.oclass == WEAPON_CLASS && game.objects[stylus.otyp].oc_subtyp >= P_DAGGER && game.objects[stylus.otyp].oc_subtyp <= P_SABER)) {
        await impossible("carving with non-bladed weapon");
    } else if (game.context.engraving.type == 4 && !marker) {
        await impossible("making graffiti with non-marker stylus");
    }
    if (carving && stylus && (dulling_wep || stylus.oclass == RING_CLASS || stylus.oclass == GEM_CLASS)) {
        rate = 1;
    } else if (marker) {
        rate = ((rate) < (stylus.spe * 2) ? (rate) : (stylus.spe * 2));
    }
    /* Step 2: Compute last character that can be engraved this action. */
    i = rate;
    for (endc = game.context.engraving.nextc; __nh_char_at0(endc) && i > 0; (endc = __nh_advance_str(endc, 1))) {
        if (__nh_char_at0(endc) != 32) {
            i--;
        }
    }
    if (dulling_wep) {
        /* Step 3: affect stylus from engraving - it might wear out. */
        let splitstack = (0);
        let dulled = (0);
        if (stylus.quan > 1) {
            if (firsttime) {
                await pline("One of %s gets dull.", await yname(stylus));
            }
            stylus = game.context.engraving.stylus = await splitobj(stylus, 1);
            /* if stack is wielded or quivered, the split-off one isn't */
            stylus.owornmask = 0;
            splitstack = (1);
        } else {
            if (firsttime) {
                await pline("%s gets dull.", await Yname2(stylus));
            }
        }
        if (game.context.engraving.actionct % 2 == 1) {
            if (stylus.spe <= -3) {
                if (firsttime) {
                    await impossible("<= -3 weapon valid for engraving");
                }
                truncate = (1);
            } else if (__nh_char_at0(endc) || game.context.engraving.actionct == 1) {
                stylus.spe -= 1;
                dulled = (1);
            }
        }
        if (splitstack) {
            await obj_extract_self(stylus);
            stylus = await hold_another_object(stylus, "You drop one %s!", await doname(stylus), (null));
            ((stylus));
        } else if (dulled && stylus.known) {
            await prinv((null), stylus, 1);
            update_inventory();
        }
    } else if (marker) {
        /* Prevent infinite graffiti */
        let ink_cost = ((Math.trunc(rate / 2)) > (1) ? (Math.trunc(rate / 2)) : (1));
        if (stylus.spe < ink_cost) {
            await impossible("overly dry marker valid for graffiti?");
            ink_cost = stylus.spe;
            truncate = (1);
        }
        stylus.spe -= ink_cost;
        update_inventory();
        if (stylus.spe == 0) {
            await Your("marker dries out.");
            truncate = (1);
        }
    }
    switch (game.context.engraving.type) {
        default:
            finishverb = "your weird engraving";
            break;
        case 1:
            finishverb = is_ice(game.u.ux, game.u.uy) ? "writing in the frost" : "writing in the dust";
            break;
        case 6:
        case 2:
            finishverb = "engraving";
            break;
        case 3:
            finishverb = is_ice(game.u.ux, game.u.uy) ? "melting your message into the ice" : "burning your message into the floor";
            break;
        case 4:
            finishverb = "defacing the dungeon";
            break;
        case 5:
            finishverb = "scrawling";
    }
    /* actions that happen at the end of every engraving action go here */
    buf = '';
    oep = engr_at(game.u.ux, game.u.uy);
    /* add to existing engraving */
    if (oep) {
        buf = strcpy(buf, oep.engr_txt[actual_text]);
    }
    space_left = (256 /* sizeof(char [256]) */ - strlen(buf) - 1);
    if ((game.context.engraving.nextc.length - endc.length) > space_left) {
        await You("run out of room to write.");
        endc = __nh_advance_str(game.context.engraving.nextc, space_left);
        truncate = (1);
    }
    if (truncate && __nh_char_at0(endc) != 0) {
        /* If the stylus did wear out mid-engraving, truncate the input so that we
     * can't go any further. */
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        await You("are only able to write \"%s\".", game.context.engraving.text);
    } else {
        /* input was not truncated; stylus may still have worn out on the last
         * character, though */
        truncate = (0);
    }
    buf = strncat(buf, game.context.engraving.nextc, ((space_left) < ((game.context.engraving.nextc.length - endc.length)) ? (space_left) : ((game.context.engraving.nextc.length - endc.length))));
    await make_engr_at(game.u.ux, game.u.uy, buf, null, game.moves - game.multi, game.context.engraving.type);
    oep = engr_at(game.u.ux, game.u.uy);
    if (oep) {
        oep.eread = 1;
        oep.erevealed = 1;
    }
    if (__nh_char_at0(endc)) {
        game.context.engraving.nextc = endc;
        if (neweng) {
            await newsym(game.context.engraving.pos.x, game.context.engraving.pos.y);
        }
        /* not yet finished this turn */
        return 1;
    } else {
        if (truncate) {
            await You("cannot write any more.");
        } else if (!firsttime) {
            await You("finish %s.", finishverb);
        }
        game.context.engraving.text = '';
        game.context.engraving.nextc = null;
        game.context.engraving.stylus = null;
    }
    if (neweng) {
        await newsym(game.context.engraving.pos.x, game.context.engraving.pos.y);
    }
    return 0;
}
/* while loading bones, clean up text which might accidentally
   or maliciously disrupt player's terminal when displayed */
export function sanitize_engravings() {
    let ep = null;
    for (ep = game.head_engr; ep; ep = ep.nxt_engr) {
        sanitize_name(ep.engr_txt[actual_text]);
    }
}
/* mark all engravings as not-discovered/not-read when saving bones */
export function forget_engravings() {
    let ep = null;
    for (ep = game.head_engr; ep; ep = ep.nxt_engr) {
        /* Note: engr_txt[actual_text], engr_txt[rememberd_text], and
         * engr_txt[pristine_text] retain their original text rather
         * than get updated to reflect each engraving's current text.
         * Does it matter? */
        ep.erevealed = ep.eread = 0;
    }
}
export async function engraving_sanity_check() {
    let ep = null;
    let levtyp = 0;
    if (game.head_engr && ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) {
        await impossible("engraving sanity: on plane of air/water");
        return;
    }
    for (ep = game.head_engr; ep; ep = ep.nxt_engr) {
        let x = ep.engr_x;
        let y = ep.engr_y;
        if (!isok(x, y)) {
            await impossible("engraving sanity: !isok <%i,%i>", x, y);
            continue;
        }
        levtyp = ((game.level.locations[x][y].typ == DRAWBRIDGE_UP) ? db_under_typ(game.level.locations[x][y].flags) : game.level.locations[x][y].typ);
        if (is_pool_or_lava(x, y) || ((levtyp) == AIR || (levtyp) == CLOUD) || !((levtyp) >= DOOR)) {
            await impossible("engraving sanity: illegal surface (%d: \"%s\")", levtyp, surface(x, y));
            continue;
        }
    }
}
export function save_engravings(nhfp) {
    let ep = null;
    let ep2 = null;
    let no_more_engr = 0;
    let engr_alloc = 0;
    let szeach = 0;
    for (ep = game.head_engr; ep; ep = ep2) {
        ep2 = ep.nxt_engr;
        if (ep.engr_alloc && ep.engr_txt[actual_text][0] && ((nhfp).mode & (1 | 2))) {
            engr_alloc = ep.engr_alloc;
            szeach = ep.engr_szeach;
            sfo_unsigned(nhfp, { get value() { return engr_alloc; }, set value(_v) { engr_alloc = _v; } }, "engraving-engr_alloc");
            sfo_engr(nhfp, ep, "engraving");
            ep.engr_txt[actual_text] = (((ep) + 1));
            ep.engr_txt[remembered_text] = ep.engr_txt[actual_text] + szeach;
            ep.engr_txt[pristine_text] = ep.engr_txt[remembered_text] + szeach;
            sfo_char(nhfp, ep.engr_txt[actual_text], "engraving-actual_text", szeach);
            sfo_char(nhfp, ep.engr_txt[remembered_text], "engraving-remembered_text", szeach);
            sfo_char(nhfp, ep.engr_txt[pristine_text], "engraving-pristine_text", szeach);
        }
        if (((nhfp).mode & 4)) {
            free((ep));
        }
    }
    if (((nhfp).mode & (1 | 2))) {
        sfo_unsigned(nhfp, { get value() { return no_more_engr; }, set value(_v) { no_more_engr = _v; } }, "engraving-engr_alloc");
    }
    if (((nhfp).mode & 4)) {
        game.head_engr = null;
    }
}
/* !SFCTOOL */
export function rest_engravings(nhfp) {
    let ep = null;
    let lth = 0;
    let szeach = 0;
    game.head_engr = null;
    while (1) {
        sfi_unsigned(nhfp, { get value() { return lth; }, set value(_v) { lth = _v; } }, "engraving-engr_alloc");
        ;
        if (lth == 0) {
            return;
        }
        ep = alloc((lth) + 1 /* sizeof(struct engr) */);
        sfi_engr(nhfp, ep, "engraving");
        szeach = ep.engr_szeach;
        ep.nxt_engr = game.head_engr;
        game.head_engr = ep;
        ep.engr_txt[actual_text] = (((ep) + 1));
        ep.engr_txt[remembered_text] = ep.engr_txt[actual_text] + szeach;
        ep.engr_txt[pristine_text] = ep.engr_txt[remembered_text] + szeach;
        sfi_char(nhfp, ep.engr_txt[actual_text], "engraving-actual_text", szeach);
        sfi_char(nhfp, ep.engr_txt[remembered_text], "engraving-remembered_text", szeach);
        sfi_char(nhfp, ep.engr_txt[pristine_text], "engraving-pristine_text", szeach);
        while (ep.engr_txt[actual_text][0] == 32) {
            ep.engr_txt[actual_text]++;
        }
        while (ep.engr_txt[remembered_text][0] == 32) {
            ep.engr_txt[remembered_text]++;
        }
        /* mark as finished for bones levels -- no problem for
         * normal levels as the player must have finished engraving
         * to be able to move again */
        ep.engr_time = game.moves;
    }
}
/* to support '#stats' wizard-mode command */
export function engr_stats(hdrfmt, hdrbuf, count, size) {
    let ep = null;
    hdrbuf = sprintf(hdrbuf, hdrfmt, 1 /* sizeof(struct engr) */);
    count.value = size.value = 0;
    for (ep = game.head_engr; ep; ep = ep.nxt_engr) {
        ++count.value;
        size.value += 1 /* sizeof(struct engr) */ + ep.engr_alloc;
    }
}
export async function del_engr(ep) {
    if (ep == game.head_engr) {
        game.head_engr = ep.nxt_engr;
    } else {
        let ept = null;
        for (ept = game.head_engr; ept; ept = ept.nxt_engr) {
            if (ept.nxt_engr == ep) {
                ept.nxt_engr = ep.nxt_engr;
                break;
            }
        }
        if (!ept) {
            await impossible("Error in del_engr?");
            return;
        }
    }
    free((ep));
}
/* randomly relocate an engraving */
export async function rloc_engr(ep) {
    let tx = 0;
    let ty = 0;
    let tryct = 200;
    do {
        if (--tryct < 0) {
            return;
        }
        tx = (rn2(80 - 3) + (2));
        ty = rn2(21);
    } while (engr_at(tx, ty) || !goodpos(tx, ty, null, 0));
    ep.engr_x = tx;
    ep.engr_y = ty;
    await newsym(tx, ty);
}
/* Create a headstone at the given location.
 * The caller is responsible for newsym(x, y).
 */
export async function make_grave(x, y, str) {
    let buf = '';
    /* Can we put a grave here? */
    if ((game.level.locations[x][y].typ != ROOM && game.level.locations[x][y].typ != GRAVE) || t_at(x, y)) {
        return;
    }
    if (!await set_levltyp(x, y, GRAVE)) {
        return;
    }
    await del_engr_at(x, y);
    if (!str) {
        str = await get_rnd_text("epitaph", buf, rn2, 60);
    }
    await make_engr_at(x, y, str, null, 0, 6);
    return;
}
/* called when kicking or engraving on a grave's headstone */
export async function disturb_grave(x, y) {
    let lev = game.level.locations[x][y];
    if (!((lev.typ) == GRAVE)) {
        await impossible("Disturbing grave that isn't a grave? (%d)", lev.typ);
    } else if (lev.horizontal) {
        await impossible("Disturbing already disturbed grave?");
    } else {
        await You("disturb the undead!");
        lev.horizontal = 1;
        await makemon(game.mons[PM_GHOUL], x, y, 0);
        await exercise(A_WIS, (0));
    }
}
export async function see_engraving(ep) {
    await newsym(ep.engr_x, ep.engr_y);
}
/* like see_engravings() but overrides vision, but only for some types
   of engravings that can be felt  [this isn't actually used anywhere?] */
export async function feel_engraving(ep) {
    if (engr_can_be_felt(ep)) {
        ep.eread = 1;
        ep.erevealed = 1;
        await map_engraving(ep, 1);
        await newsym(ep.engr_x, ep.engr_y);
    }
}
const blind_writing = [[68, 102, 109, 105, 98, 101, 34, 69, 123, 113, 101, 109, 114, 0, 0, 0, 0, 0, 0, 0, 0], [81, 103, 96, 122, 127, 33, 64, 113, 107, 113, 111, 103, 99, 0, 0, 0, 0, 0, 0, 0, 0], [73, 109, 115, 105, 98, 101, 34, 76, 97, 124, 109, 103, 36, 66, 127, 105, 108, 119, 103, 126, 0], [75, 109, 108, 102, 48, 76, 107, 104, 124, 127, 111, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [81, 103, 112, 122, 127, 111, 103, 104, 100, 113, 33, 79, 107, 109, 126, 114, 0, 0, 0, 0, 0], [76, 99, 118, 97, 113, 33, 72, 107, 123, 117, 103, 99, 36, 69, 101, 107, 107, 101, 0, 0, 0], [76, 103, 104, 107, 120, 104, 109, 118, 122, 117, 33, 79, 113, 122, 117, 111, 119, 0, 0, 0, 0], [68, 102, 109, 124, 120, 33, 80, 101, 102, 101, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [68, 102, 115, 105, 98, 101, 34, 86, 125, 99, 105, 118, 107, 102, 0, 0, 0, 0, 0, 0, 0]];
export function blengr() {
    return blind_writing[rn2((Math.trunc(189 /* sizeof(const char [9][21]) */ / 21 /* sizeof(const char [21]) */)))];
}
/* !SFCTOOL */
/*engrave.c*/
/* a random engraving may come from the "rumors" file,
       or from the "engrave" file (formerly in an array here) */
/* rub out unreadable & small punctuation marks */
/* engraving "Elbereth":  if done when making a level, it creates
           an old-style Elbereth that deters monsters when any objects are
           present; otherwise (done by the player), exercises wisdom */
/* airlevel or inside bubble on waterlevel */
/* stone, tree, wall, secret corridor, pool, lava, bars */
/* The charge is removed from the wand before prompting for
     * the engraving text, because all kinds of setup decisions
     * and pre-engraving messages are based upon knowing what type
     * of engraving the wand is going to do.  Also, the player
     * will have potentially seen "You wrest .." message, and
     * therefore will know they are using a charge.
     */
/* give feedback here if we won't be getting the
               "can't reach floor" message below */
/* cancelled wand turns to dust */
/* empty wand just doesn't write */
/* if non-blade or welded or too dull, engraving type stays set
               to DUST; feedback for that is only given for bladed weapons */
/* this used to be ``if (wizard)'' and fall through to ILLOBJ_CLASS
           for normal play, but splash of venom isn't "illegal" because it
           could occur in normal play via wizard mode bones */
/* Can the adventurer engrave at all? */
/* One may write with finger, or weapon, or wand, or..., or...
     * Edited by GAN 10/20/86 so as not to change weapon wielded.
     */
/* There's no reason you should be able to write with a wand
     * while both your hands are tied up.
     */
/* disturb the grave: summon a ghoul, same as sometimes
               happens when kicking; sets levl[ux][uy]->disturbed so
               that it'll only happen once */
/*
     * End of implement setup
     */
/* Tell adventurer what is going on */
/* ASCII '!' thru '~'
                                        (excludes ' ' and DEL) */
/* Previous engraving is overwritten */
/* Engraving will always take at least one action via being run as an
       occupation, so do not count this setup as taking time. */
/* 'dulling_wep' guarantees that 'stylus' is a weapon which is
           not welded to the hero's hand(s) */
/* normal case: stylus->quan==1 */
/* Dull the weapon at a rate of -1 enchantment per 2 characters,
         * rounding down.
         * The number of characters obtainable given starting enchantment:
         * -2 => 3, -1 => 5, 0 => 7, +1 => 9, +2 => 11
         * Note: this does not allow a +0 anything (except an athame) to
         * engrave "Elbereth" all at once.
         * However, you can engrave "Elb", then "ere", then "th", by taking
         * advantage of the rounding down. */
/* deduct a point on 1st, 3rd, 5th, ... turns, unless this is the
             * last character being engraved (a rather convoluted way to round
             * down), but always deduct a point on the 1st turn to prevent
             * zero-cost engravings.
             * Check for truncation *before* deducting a point - otherwise,
             * attempting to e.g. engrave 3 characters with a -2 weapon will
             * stop at the 1st. */
/* reflect change in stylus->spe; not needed for splitstack
               since hold_another_object() does this */
/* can't engrave any further; truncate the string */
/* actions that happen after the engraving is finished go here */
/* Now that "You are only able to write 'foo'" also prints at the
             * end of engraving, this might be redundant. */
/* only print this if engraving took multiple actions */
/* caller took care of the old location */
/* in case it's beneath something, redisplay the something */
