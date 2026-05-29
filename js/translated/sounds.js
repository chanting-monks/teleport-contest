/* NetHack 5.0	sounds.c	$NHDT-Date: 1736530208 2025/01/10 09:30:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.165 $ */
/*      Copyright (c) 1989 Janet Walz, Mike Threepoint */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { panic } from '../c2js-runtime/panic.js';
import { You, You_cant, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strchr, strcmp, strcpy, strlen, strncmpi } from '../c2js-runtime/string.js';
import { midnight, night } from './calendar.js';
import { getdir, isok } from './cmd.js';
import { c_common_strings } from './decl.js';
import { canseemon, glyph_at, map_invisible, sensemon } from './display.js';
import { Monnam, mon_nam, noveltitle, pmname, rndmonnam } from './do_name.js';
import { cursed } from './do_wear.js';
import { on_level } from './dungeon.js';
import { money_cnt, nomul } from './hack.js';
import { dist2, letter, ucase } from './hacklib.js';
import { currency, g_at, u_have_novel } from './invent.js';
import { could_seduce, doseduce } from './mhitu.js';
import { demon_talk } from './minion.js';
import { search_special } from './mkroom.js';
import { genus, get_iter_mons, wake_nearto } from './mon.js';
import { pronoun_gender, same_race } from './mondata.js';
import { accessible } from './monmove.js';
import { mplayer_talk } from './mplayer.js';
import { BARRACKS, BEEHIVE, BLINDED, BLOOD, CONFLICT, COURT, DBWALL, DEAF, FEMALE, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_MON_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, HAIR, HALLUC, HALLUC_RES, HEAD, INVIS, IRONBARS, MALE, MORGUE, MS_ANIMAL, MS_ARREST, MS_BARK, MS_BELLOW, MS_BOAST, MS_BONES, MS_BRIBE, MS_BURBLE, MS_BUZZ, MS_CHIRP, MS_CUSS, MS_DJINNI, MS_GROAN, MS_GROWL, MS_GRUNT, MS_GUARD, MS_GUARDIAN, MS_GURGLE, MS_HISS, MS_HUMANOID, MS_IMITATE, MS_LAUGH, MS_LEADER, MS_MEW, MS_MOO, MS_MUMBLE, MS_NEIGH, MS_NEMESIS, MS_NURSE, MS_ORACLE, MS_ORC, MS_PRIEST, MS_RIDER, MS_ROAR, MS_SEDUCE, MS_SELL, MS_SHRIEK, MS_SILENT, MS_SOLDIER, MS_SPELL, MS_SQAWK, MS_SQEEK, MS_TRUMPET, MS_VAMPIRE, MS_WAIL, MS_WERE, M_AP_FURNITURE, M_AP_OBJECT, NECK, NUMMONS, PLNMSG_GROWL, PM_ARCHEOLOGIST, PM_BABY_SILVER_DRAGON, PM_DEATH, PM_DINGO, PM_GECKO, PM_HEALER, PM_HOBBIT, PM_HUMAN_WERERAT, PM_LONG_WORM, PM_ORACLE, PM_PRISONER, PM_RAVEN, PM_SILVER_DRAGON, PM_TOURIST, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WATER_DEMON, PM_WINTER_WOLF, PM_WINTER_WOLF_CUB, PM_WIZARD, PM_WOLF, P_NONE, SDOOR, STATUE, STRANGLED, S_ANT, S_CENTAUR, S_EEL, S_NYMPH, TOOL_CLASS, VAULT, WEAPON_CLASS, ZOO, se_avian_screak, se_canine_whine, se_canine_yelp, se_feline_yelp, se_squeal, se_wail, se_yelp, sff_base_only, sff_havedir_append_rest, soundlib_nosound } from './nh-constants.js';
import { an, helm_simple_name, vtense } from './objnam.js';
import { body_part, poly_gender } from './polyself.js';
import { halu_gname } from './pray.js';
import { inhistemple, mon_aligntyp, p_coaligned, priest_talk, temple_occupied } from './priest.js';
import { quest_chat } from './quest.js';
import { rn2 } from './rnd.js';
import { genders } from './role.js';
import { doconsult } from './rumors.js';
import { noisy_shop, price_quote, shk_chat, shop_object, tended_shop } from './shk.js';
import { t_at } from './trap.js';
import { gd_sound, vault_occupied } from './vault.js';
import { aggravate, cuss } from './wizard.js';
import { which_armor } from './worn.js';

/* this easily could be a macro, but it might overtax dumb compilers */
export function mon_in_room(mon, rmtyp) {
    let rno = game.level.locations[mon.mx][mon.my].roomno;
    if (rno >= 3) {
        return game.rooms[rno - 3].rtype == rmtyp;
    }
    return (0);
}
const __throne_mon_sound_throne_msg = ["the tones of courtly conversation.", "a sceptre pounded in judgment.", "Someone shouts \"Off with %s head!\"", "Queen Beruthiel's cats!"];
export function throne_mon_sound(mtmp) {
    if ((mtmp.msleeping || (((mtmp.data).mflags2 & 1024) != 0) || (((mtmp.data).mflags2 & 2048) != 0)) && !(((mtmp.data).mflags1 & 262144) != 0) && mon_in_room(mtmp, COURT)) {
        let which = rn2(3) + ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 1 : 0);
        if (which != 2) {
            if (which == 0) {
                ;
            } else if (which == 1) {
                ;
            }
            You_hear("%s", __throne_mon_sound_throne_msg[which]);
        } else {
            pline(__throne_mon_sound_throne_msg[2], (genders[game.flags.female ? 1 : 0].his));
        }
        return (1);
    }
    return (0);
}
export function beehive_mon_sound(mtmp) {
    if ((mtmp.data.mlet == S_ANT && (((mtmp.data).mflags1 & 1) != 0)) && mon_in_room(mtmp, BEEHIVE)) {
        /* and don't produce silly effects when she's clearly visible */
        let hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 1 : 0;
        switch (rn2(2) + hallu) {
            case 0:
                ;
                You_hear("a low buzzing.");
                /* temple priest, roaming aligned priest (not mplayer) */
                /* doppelganger, leocrotta, Aleax */
                break;
            case 1:
                ;
                You_hear("an angry drone.");
                break;
            case 2:
                ;
                You_hear("bees in your %sbonnet!", game.uarmh ? "" : "(nonexistent) ");
                break;
        }
        return (1);
    }
    return (0);
}
export function morgue_mon_sound(mtmp) {
    if (((((mtmp.data).mflags2 & 2) != 0) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) && mon_in_room(mtmp, MORGUE)) {
        let hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 1 : 0;
        let hair = body_part(HAIR);
        switch (rn2(2) + hallu) {
            case 0:
                You("suddenly realize it is unnaturally quiet.");
                break;
            case 1:
                pline_The("%s on the back of your %s %s up.", hair, body_part(NECK), vtense(hair, "stand"));
                break;
            case 2:
                pline_The("%s on your %s %s to stand up.", hair, body_part(HEAD), vtense(hair, "seem"));
                break;
        }
        return (1);
    }
    return (0);
}
const __zoo_mon_sound_zoo_msg = ["a sound reminiscent of an elephant stepping on a peanut.", "a sound reminiscent of a seal barking.", "Doctor Dolittle!"];
export function zoo_mon_sound(mtmp) {
    if ((mtmp.msleeping || (((mtmp.data).mflags1 & 262144) != 0)) && mon_in_room(mtmp, ZOO)) {
        let hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 1 : 0;
        let selection = rn2(2) + hallu;
        You_hear("%s", __zoo_mon_sound_zoo_msg[selection]);
        return (1);
    }
    return (0);
}
const __temple_priest_sound_temple_msg = ["*someone praising %s.", "*someone beseeching %s.", "#an animal carcass being offered in sacrifice.", "*a strident plea for donations."];
export function temple_priest_sound(mtmp) {
    if (mtmp.ispriest && inhistemple(mtmp) && !((mtmp).msleeping || !(mtmp).mcanmove) && temple_occupied(game.u.urooms) != ((mtmp).mextra.epri).shroom) {
        /* hero must be outside this temple */
        /* Generic temple messages; no attempt to match topic or tone
           to the pantheon involved, let alone to the specific deity.
           These are assumed to be coming from the attending priest;
           asterisk means that the priest must be capable of speech;
           pound sign (octathorpe,&c--don't go there) means that the
           priest and the altar must not be directly visible (we don't
           care if telepathy or extended detection reveals that the
           priest is not currently standing on the altar; he's mobile). */
        let msg = null;
        let hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 1 : 0;
        let trycount = 0;
        let ax = ((mtmp).mextra.epri).shrpos.x;
        let ay = ((mtmp).mextra.epri).shrpos.y;
        let speechless = (mtmp.data.msound <= MS_ANIMAL);
        let in_sight = canseemon(mtmp) || ((game.viz_array[ay][ax] & 2) != 0);
        do {
            msg = __temple_priest_sound_temple_msg[rn2((Math.trunc(4 /* sizeof(const char *const [4]) */ / 1 /* sizeof(const char *const) */)) - 1 + hallu)];
            if (strchr(msg, 42) && speechless) {
                continue;
            }
            if (strchr(msg, 35) && in_sight) {
                continue;
            }
            break;
        } while (++trycount < 50);
        while (!letter(msg)) {
            ++msg;
        }
        if (strchr(msg, 37)) {
            You_hear(msg, halu_gname(((mtmp).mextra.epri).shralign));
        } else {
            You_hear("%s", msg);
        }
        return (1);
    }
    return (0);
}
/* AEsculapius at Epidaurus */
const __oracle_sound_ora_msg = ["a strange wind.", "convulsive ravings.", "snoring snakes.", "someone say \"No more woodchucks!\"", "a loud ZOT!"];
export function oracle_sound(mtmp) {
    if (mtmp.data != game.mons[PM_ORACLE]) {
        return (0);
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || !canseemon(mtmp)) {
        let hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 1 : 0;
        You_hear("%s", __oracle_sound_ora_msg[rn2(3) + hallu * 2]);
    }
    return (1);
}
const __dosounds_fountain_msg = ["bubbling water.", "water falling on coins.", "the splashing of a naiad.", "a soda fountain!"];
const __dosounds_sink_msg = ["a slow drip.", "a gurgling noise.", "dishes being washed!"];
const __dosounds_swamp_msg = ["hear mosquitoes!", "smell marsh gas!", "hear Donald Duck!"];
const __dosounds_barracks_msg = ["blades being honed.", "loud snoring.", "dice being thrown.", "General MacArthur!"];
const __dosounds_shop_msg = ["someone cursing shoplifters.", "the chime of a cash register.", "Neiman and Marcus arguing!"];
export function dosounds() {
    let sroom = null;
    let hallu = 0;
    let vx = 0;
    let vy = 0;
    let mtmp = null;
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) || !game.flags.acoustics || game.u.uswallow || (game.u.uinwater)) {
        return;
    }
    hallu = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 1 : 0;
    if (game.level.flags.nfountains && !rn2(400)) {
        You_hear("%s", __dosounds_fountain_msg[rn2(3) + hallu]);
    }
    if (game.level.flags.nsinks && !rn2(300)) {
        You_hear("%s", __dosounds_sink_msg[rn2(2) + hallu]);
    }
    if (game.level.flags.has_court && !rn2(200)) {
        if (get_iter_mons(throne_mon_sound)) {
            return;
        }
    }
    if (game.level.flags.has_swamp && !rn2(200)) {
        You("%s", __dosounds_swamp_msg[rn2(2) + hallu]);
        return;
    }
    if (game.level.flags.has_vault && !rn2(200)) {
        if (!(sroom = search_special(VAULT))) {
            game.level.flags.has_vault = 0;
            return;
        }
        if (gd_sound()) {
            switch (rn2(2) + hallu) {
                case 1:
{
                        let gold_in_vault = (0);
                        for (vx = sroom.lx; vx <= sroom.hx; vx++) {
                            for (vy = sroom.ly; vy <= sroom.hy; vy++) {
                                if (g_at(vx, vy)) {
                                    gold_in_vault = (1);
                                }
                            }
                        }
                        if (vault_occupied(game.u.urooms) != (game.rooms.indexOf(sroom) + 3)) {
                            if (gold_in_vault) {
                                You_hear(!hallu ? "someone counting gold coins." : "the quarterback calling the play.");
                            } else {
                                ;
                                You_hear("someone searching.");
                            }
                            break;
                        }
                    }
                    ;
                case 0:
                    ;
                    You_hear("the footsteps of a guard on patrol.");
                    break;
                case 2:
                    You_hear("Ebenezer Scrooge!");
                    break;
            }
        }
        return;
    }
    if (game.level.flags.has_beehive && !rn2(200)) {
        if (get_iter_mons(beehive_mon_sound)) {
            return;
        }
    }
    if (game.level.flags.has_morgue && !rn2(200)) {
        if (get_iter_mons(morgue_mon_sound)) {
            return;
        }
    }
    if (game.level.flags.has_barracks && !rn2(200)) {
        let count = 0;
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (((mtmp).mhp < 1)) {
                continue;
            }
            if ((((mtmp.data).mflags2 & 512) != 0) && mon_in_room(mtmp, BARRACKS) && (mtmp.msleeping || ++count > 5)) {
                You_hear("%s", __dosounds_barracks_msg[rn2(3) + hallu]);
                /* don't bother excluding these */
                /* sleeping implies not-yet-disturbed (usually) */
                return;
            }
        }
    }
    if (game.level.flags.has_zoo && !rn2(200)) {
        if (get_iter_mons(zoo_mon_sound)) {
            return;
        }
    }
    if (game.level.flags.has_shop && !rn2(200)) {
        if (!(sroom = search_special((-2)))) {
            game.level.flags.has_shop = 0;
            return;
        }
        if (tended_shop(sroom) && !strchr(game.u.ushops, (game.rooms.indexOf(sroom) + 3))) {
            You_hear("%s", __dosounds_shop_msg[rn2(2) + hallu]);
            noisy_shop(sroom);
        }
        return;
    }
    if (game.level.flags.has_temple && !rn2(200) && !((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level)))) || (((((game.dungeon_topology.d_sanctum_level)).dlevel || ((game.dungeon_topology.d_sanctum_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_sanctum_level)))))) {
        if (get_iter_mons(temple_priest_sound)) {
            return;
        }
    }
    if ((((((game.dungeon_topology.d_oracle_level)).dlevel || ((game.dungeon_topology.d_oracle_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_oracle_level)))) && !rn2(400)) {
        if (get_iter_mons(oracle_sound)) {
            return;
        }
    }
}
const h_sounds = ["beep", "boing", "sing", "belche", "creak", "cough", "rattle", "ululate", "pop", "jingle", "sniffle", "tinkle", "eep", "clatter", "hum", "sizzle", "twitter", "wheeze", "rustle", "honk", "lisp", "yodel", "coo", "burp", "moo", "boom", "murmur", "oink", "quack", "rumble", "twang", "toot", "gargle", "hoot", "warble"];
export function growl_sound(mtmp) {
    let ret = null;
    switch (mtmp.data.msound) {
        case MS_MEW:
        /* chickatrice, pyrolisk, snakes */
        case MS_HISS:
            ret = "hiss";
            break;
        case MS_BARK:
        case MS_GROWL:
            ret = "growl";
            break;
        /* baby dragons; have them growl instead of roar */
        case MS_ROAR:
            ret = "roar";
            break;
        case MS_BELLOW:
            ret = "bellow";
            break;
        case MS_BUZZ:
            ret = "buzz";
            break;
        case MS_SQEEK:
            ret = "squeal";
            break;
        case MS_SQAWK:
            ret = "screech";
            break;
        case MS_NEIGH:
            ret = "neigh";
            break;
        case MS_WAIL:
            ret = "wail";
            break;
        case MS_GROAN:
            ret = "groan";
            break;
        case MS_MOO:
            ret = "low";
            break;
        case MS_SILENT:
            ret = "commotion";
            break;
        /* a relatively small subset of MS_ sound values are used by oviparous
       species so we don't try to supply something for every MS_ type */
        default:
            ret = "scream";
    }
    return ret;
}
/* the sounds of a seriously abused pet, including player attacking it */
export function growl(mtmp) {
    let growl_verb = null;
    if (((mtmp).msleeping || !(mtmp).mcanmove) || mtmp.data.msound == MS_SILENT) {
        return;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        growl_verb = h_sounds[rn2((Math.trunc(35 /* sizeof(const char *const [35]) */ / 1 /* sizeof(const char *const) */)))];
    /* presumably nearness and soundok checks have already been made */
    } else {
        growl_verb = growl_sound(mtmp);
    }
    if (growl_verb) {
        if (canseemon(mtmp) || !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            pline("%s %s!", Monnam(mtmp), vtense(null, growl_verb));
            game.iflags.last_msg = PLNMSG_GROWL;
            if (game.context.run) {
                nomul(0);
            }
        }
        wake_nearto(mtmp.mx, mtmp.my, mtmp.data.mlevel * 18);
    }
}
/* the sounds of mistreated pets */
export function yelp(mtmp) {
    let yelp_verb = null;
    let se = se_yelp;
    if (((mtmp).msleeping || !(mtmp).mcanmove) || !mtmp.data.msound) {
        return;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        yelp_verb = h_sounds[rn2((Math.trunc(35 /* sizeof(const char *const [35]) */ / 1 /* sizeof(const char *const) */)))];
    } else {
        switch (mtmp.data.msound) {
            case MS_MEW:
                se = se_feline_yelp;
                yelp_verb = (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "yowl" : "arch";
                break;
            case MS_BARK:
            case MS_GROWL:
                se = se_canine_yelp;
                yelp_verb = (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "yelp" : "recoil";
                break;
            case MS_ROAR:
                yelp_verb = (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "snarl" : "bluff";
                break;
            case MS_SQEEK:
                se = se_squeal;
                yelp_verb = (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "squeal" : "quiver";
                break;
            case MS_SQAWK:
                se = se_avian_screak;
                yelp_verb = (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "screak" : "thrash";
                break;
            case MS_WAIL:
                se = se_wail;
                yelp_verb = (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) ? "wail" : "cringe";
                break;
        }
    }
    if (yelp_verb) {
        ;
        /* Soundeffect() handles Deaf or not Deaf */
        pline("%s %s!", Monnam(mtmp), vtense(null, yelp_verb));
        if (game.context.run) {
            nomul(0);
        }
        wake_nearto(mtmp.mx, mtmp.my, mtmp.data.mlevel * 12);
    }
    ((se));
}
/* the sounds of distressed pets */
export function whimper(mtmp) {
    let whimper_verb = null;
    let se = se_canine_whine;
    if (((mtmp).msleeping || !(mtmp).mcanmove) || !mtmp.data.msound) {
        return;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        whimper_verb = h_sounds[rn2((Math.trunc(35 /* sizeof(const char *const [35]) */ / 1 /* sizeof(const char *const) */)))];
    } else {
        switch (mtmp.data.msound) {
            case MS_MEW:
            case MS_GROWL:
                whimper_verb = "whimper";
                break;
            case MS_BARK:
                whimper_verb = "whine";
                break;
            case MS_SQEEK:
                se = se_squeal;
                whimper_verb = "squeal";
                break;
        }
    }
    if (whimper_verb) {
        if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            ;
        }
        pline("%s %s.", Monnam(mtmp), vtense(null, whimper_verb));
        if (game.context.run) {
            nomul(0);
        }
        wake_nearto(mtmp.mx, mtmp.my, mtmp.data.mlevel * 6);
    }
    ((se));
}
/* pet makes "I'm hungry" noises */
export function beg(mtmp) {
    if (((mtmp).msleeping || !(mtmp).mcanmove) || !((((mtmp.data).mflags1 & 536870912) != 0) || (((mtmp.data).mflags1 & 1073741824) != 0))) {
        return;
    }
    if (!((mtmp.data).msound == MS_SILENT) && mtmp.data.msound <= MS_ANIMAL) {
        domonnoise(mtmp);
    } else if (mtmp.data.msound >= MS_HUMANOID) {
        /* be sure to do this before talking; the monster might teleport away, in
     * which case we want to check its pre-teleport position
     */
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            map_invisible(mtmp.mx, mtmp.my);
        }
        ;
        verbalize("I'm hungry.");
    } else {
        /* this is pretty lame but is better than leaving out the block
           of speech types between animal and humanoid; this covers
           MS_SILENT too (if caller lets that get this far) since it's
           excluded by the first two cases */
        /* looking famished will be a good trick for a tame skeleton... */
        /* sleeping monsters won't talk, except priests (who wake up) */
        /* If it is unseen, the player can't tell the difference between
           not noticing him and just not existing, so skip the message. */
        if ((canseemon(mtmp) || sensemon(mtmp))) {
            pline("%s seems famished.", Monnam(mtmp));
        }
    }
}
/* hero has attacked a peaceful monster within 'mon's view */
const __maybe_gasp_Exclam = ["Gasp!", "Uh-oh.", "Oh my!", "What?", "Why?"];
export function maybe_gasp(mon) {
    let mptr = mon.data;
    let msound = mptr.msound;
    let dogasp = (0);
    /* other roles' guardians and cross-aligned priests don't gasp */
    if ((msound == MS_GUARDIAN && mptr != game.mons[game.urole.guardnum]) || (msound == MS_PRIEST && !p_coaligned(mon))) {
        msound = MS_SILENT;
    } else if (msound == MS_CUSS && ((mon).mextra && ((mon).mextra.emin)) && (p_coaligned(mon) ? !((mon).mextra.emin).renegade : ((mon).mextra.emin).renegade)) {
        msound = MS_HUMANOID;
    }
    switch (msound) {
        /* co-aligned angels do gasp */
        /*
     * Only called for humanoids so animal noise handling is ignored.
     */
        case MS_HUMANOID:
        case MS_ARREST:
        case MS_SOLDIER:
        case MS_GUARD:
        case MS_NURSE:
        case MS_SEDUCE:
        case MS_LEADER:
        case MS_GUARDIAN:
        case MS_SELL:
        /* make sure it's your role's quest guardian; adjust if not */
        /* even polymorphed, shopkeepers retain their minds and capitalist bent */
        /* some normally non-speaking types can/will speak if hero is similar */
        /* silliness; formerly had a slight chance to interfere with shopping */
        case MS_ORACLE:
        case MS_PRIEST:
        case MS_BOAST:
        case MS_IMITATE:
            dogasp = (1);
            break;
        /* issue comprehensible word(s) if hero is similar type of creature */
        /* used to be synonym for MS_GRUNT */
        /* this used to be an alias for grunt, now it is distinct */
        case MS_ORC:
        case MS_GRUNT:
        case MS_LAUGH:
        case MS_ROAR:
        case MS_BELLOW:
        case MS_DJINNI:
        case MS_VAMPIRE:
        case MS_WERE:
        case MS_SPELL:
            dogasp = (mptr.mlet == game.youmonst.data.mlet);
            break;
        /* capable of speech but don't care if you attack peacefuls */
        case MS_BRIBE:
        case MS_CUSS:
        case MS_RIDER:
        case MS_NEMESIS:
        case MS_SILENT:
        default:
            break;
    }
    if (dogasp) {
        /* [mon->m_id % SIZE(Exclam)]; */
        return __maybe_gasp_Exclam[rn2((Math.trunc(5 /* sizeof(const char *const [5]) */ / 1 /* sizeof(const char *const) */)))];
    }
    return null;
}
/* for egg hatching; caller will apply "ing" suffix
   [the old message when a carried egg hatches was
   "its cries sound like {mommy,daddy}"
   regardless of what type of sound--if any--the creature made] */
export function cry_sound(mtmp) {
    let ret = null;
    /* verbalize() if cancelled */
    let ptr = mtmp.data;
    switch (ptr.msound) {
        default:
        case MS_SILENT:
            ret = (ptr.mlet == S_EEL) ? "gurgle" : "chitter";
            break;
        case MS_HISS:
            ret = "hiss";
            break;
        case MS_ROAR:
        case MS_GROWL:
            ret = "growl";
            break;
        /* adult crocodiles bellow, babies chirp */
        case MS_CHIRP:
            ret = "chirp";
            break;
        case MS_BUZZ:
            ret = "buzz";
            break;
        case MS_SQAWK:
            ret = "screech";
            break;
        case MS_GRUNT:
            ret = "grunt";
            break;
        case MS_MUMBLE:
            ret = "mumble";
            break;
    }
    return ret;
}
/* return True if mon is a gecko or seems to look like one (hallucination) */
export function mon_is_gecko(mon) {
    let glyph = 0;
    /* return True if it is actually a gecko */
    if (mon.data == game.mons[PM_GECKO]) {
        return (1);
    }
    /* return False if it is a long worm; we might be chatting to its tail
       (not strictly needed; long worms are MS_SILENT so won't get here) */
    if (mon.data == game.mons[PM_LONG_WORM]) {
        return (0);
    }
    /* result depends upon whether map spot shows a gecko, which will
       be due to hallucination or to mimickery since mon isn't one */
    glyph = glyph_at(mon.mx, mon.my);
    return ((((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_FEM_OFF) : ((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_MALE_OFF) : ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_FEM_OFF) : ((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_MALE_OFF) : ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_FEM_OFF) : ((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_MALE_OFF) : ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_FEM_OFF) : ((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_MALE_OFF) : NUMMONS) == PM_GECKO);
}
/* check calls to this */
/* These first two (0 and 1) are specially handled below */
/* other famous vampire quotes can follow here if desired */
const __domonnoise_vampmsg = ["I vant to suck your %s!", "I vill come after %s without regret!"];
const __domonnoise_laugh_msg = ["giggles.", "chuckles.", "snickers.", "laughs."];
const __domonnoise_arrest_msg = ["Anything you say can be used against you.", "You're under arrest!", "Stop in the name of the Law!"];
const __domonnoise_soldier_foe_msg = ["Resistance is useless!", "You're dog meat!", "Surrender!"];
const __domonnoise_soldier_pax_msg = ["What lousy pay we're getting here!", "The food's not fit for Orcs!", "My feet hurt, I've been on them all day!"];
export function domonnoise(mtmp) {
    let verbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* Monnam(mtmp) will be prepended */
    let pline_msg = null;
    let verbl_msg = null;
    let verbl_msg_mcan = null;
    let ptr = mtmp.data;
    let msound = ptr.msound;
    let gnomeplan = 0;
    /* presumably nearness and sleep checks have already been made */
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        return 0;
    }
    /* shk_chat can handle nonverbal monsters */
    if (((ptr).msound == MS_SILENT) && !mtmp.isshk) {
        return 0;
    }
    /* leader might be poly'd; if he can still speak, give leader speech */
    if (mtmp.m_id == game.quest_status.leader_m_id && msound > MS_ANIMAL) {
        msound = MS_LEADER;
    } else if (msound == MS_GUARDIAN && ptr != game.mons[game.urole.guardnum]) {
        msound = game.mons[genus(((ptr).pmidx), 1)].msound;
    } else if (mtmp.isshk) {
        msound = MS_SELL;
    } else if (msound == MS_ORC && ((same_race(ptr, game.youmonst.data) || same_race(ptr, game.mons[(game.urace.mnum)])) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) {
        msound = MS_HUMANOID;
    } else if (msound == MS_MOO && !mtmp.mtame) {
        msound = MS_BELLOW;
    } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && mon_is_gecko(mtmp)) {
        msound = MS_SELL;
    }
    if (!(canseemon(mtmp) || sensemon(mtmp))) {
        map_invisible(mtmp.mx, mtmp.my);
    }
    switch (msound) {
        case MS_ORACLE:
            return doconsult(mtmp);
        case MS_PRIEST:
            priest_talk(mtmp);
            break;
        case MS_LEADER:
        case MS_NEMESIS:
        case MS_GUARDIAN:
            quest_chat(mtmp);
            break;
        case MS_SELL:
            if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || ((ptr).msound == MS_SILENT) || (mtmp.isshk && !rn2(2))) {
                shk_chat(mtmp);
            } else {
                verbuf = sprintf(verbuf, "15 minutes could save you 15 %s.", currency(15));
                verbl_msg = verbuf;
            }
            break;
        case MS_VAMPIRE:
{
                /* vampire messages are varied by tameness, peacefulness, and time of
           night */
                let isnight = night();
                let kindred = ((game.u.umonnum != game.u.umonster) && (game.u.umonnum == PM_VAMPIRE || game.u.umonnum == PM_VAMPIRE_LEADER));
                let nightchild = ((game.u.umonnum != game.u.umonster) && (game.u.umonnum == PM_WOLF || game.u.umonnum == PM_WINTER_WOLF || game.u.umonnum == PM_WINTER_WOLF_CUB));
                let racenoun = (game.flags.female && game.urace.individual.f) ? game.urace.individual.f : (game.urace.individual.m) ? game.urace.individual.m : game.urace.noun;
                if (mtmp.mtame) {
                    if (kindred) {
                        verbuf = sprintf(verbuf, "Good %s to you Master%s", isnight ? "evening" : "day", isnight ? "!" : ".  Why do we not rest?");
                        verbl_msg = verbuf;
                    } else {
                        verbuf = sprintf(verbuf, "%s%s", nightchild ? "Child of the night, " : "", midnight() ? "I can stand this craving no longer!" : isnight ? "I beg you, help me satisfy this growing craving!" : "I find myself growing a little weary.");
                        verbl_msg = verbuf;
                    }
                } else if (mtmp.mpeaceful) {
                    if (kindred && isnight) {
                        verbuf = sprintf(verbuf, "Good feeding %s!", game.flags.female ? "sister" : "brother");
                        verbl_msg = verbuf;
                    } else if (nightchild && isnight) {
                        verbuf = sprintf(verbuf, "How nice to hear you, child of the night!");
                        verbl_msg = verbuf;
                    } else {
                        verbl_msg = "I only drink... potions.";
                    }
                } else {
                    let vampindex = 0;
                    if (kindred) {
                        verbl_msg = "This is my hunting ground that you dare to prowl!";
                    } else if (game.youmonst.data == game.mons[PM_SILVER_DRAGON] || game.youmonst.data == game.mons[PM_BABY_SILVER_DRAGON]) {
                        verbuf = sprintf(verbuf, "%s!  Your silver sheen does not frighten me!", (game.youmonst.data == game.mons[PM_SILVER_DRAGON]) ? "Fool" : "Young Fool");
                        verbl_msg = verbuf;
                    } else {
                        vampindex = rn2((Math.trunc(2 /* sizeof(const char *const [2]) */ / 1 /* sizeof(const char *const) */)));
                        if (vampindex == 0) {
                            verbuf = sprintf(verbuf, __domonnoise_vampmsg[vampindex], body_part(BLOOD));
                            /* Silver dragons are silver in color, not made of silver */
                            verbl_msg = verbuf;
                        } else if (vampindex == 1) {
                            verbuf = sprintf(verbuf, __domonnoise_vampmsg[vampindex], (game.u.umonnum != game.u.umonster) ? an(pmname(game.mons[game.u.umonnum], game.flags.female ? FEMALE : MALE)) : an(racenoun));
                            verbl_msg = verbuf;
                        } else {
                            verbl_msg = __domonnoise_vampmsg[vampindex];
                        }
                    }
                }
                break;
            }
        case MS_WERE:
            if (game.flags.moonphase == 4 && (night() ^ !rn2(13))) {
                pline("%s throws back %s head and lets out a blood curdling %s!", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his), (ptr == game.mons[PM_HUMAN_WERERAT]) ? "shriek" : "howl");
                ;
                wake_nearto(mtmp.mx, mtmp.my, 11 * 11);
            } else {
                pline_msg = "whispers inaudibly.  All you can make out is \"moon\".";
            }
            break;
        case MS_BARK:
            if (game.flags.moonphase == 4 && night()) {
                pline_msg = "howls.";
            } else if (mtmp.mpeaceful) {
                if (mtmp.mtame && (mtmp.mconf || mtmp.mflee || mtmp.mtrapped || game.moves > ((mtmp).mextra.edog).hungrytime || mtmp.mtame < 5)) {
                    pline_msg = "whines.";
                } else if (mtmp.mtame && ((mtmp).mextra.edog).hungrytime > game.moves + 1000) {
                    pline_msg = "yips.";
                } else {
                    /* dingos do not actually bark */
                    if (ptr != game.mons[PM_DINGO]) {
                        pline_msg = "barks.";
                    }
                }
            } else {
                pline_msg = "growls.";
            }
            break;
        case MS_MEW:
            if (mtmp.mtame) {
                if (mtmp.mconf || mtmp.mflee || mtmp.mtrapped || mtmp.mtame < 5) {
                    ;
                    pline_msg = "yowls.";
                } else if (game.moves > ((mtmp).mextra.edog).hungrytime) {
                    ;
                    pline_msg = "meows.";
                } else if (((mtmp).mextra.edog).hungrytime > game.moves + 1000) {
                    ;
                    pline_msg = "purrs.";
                } else {
                    ;
                    pline_msg = "mews.";
                }
                break;
            }
            ;
        case MS_GROWL:
            ;
            pline_msg = mtmp.mpeaceful ? "snarls." : "growls!";
            break;
        case MS_ROAR:
            ;
            pline_msg = mtmp.mpeaceful ? "snarls." : "roars!";
            break;
        case MS_SQEEK:
            ;
            pline_msg = "squeaks.";
            break;
        case MS_SQAWK:
            if (ptr == game.mons[PM_RAVEN] && !mtmp.mpeaceful) {
                verbl_msg = "Nevermore!";
            } else {
                ;
                pline_msg = "squawks.";
            }
            break;
        case MS_HISS:
            if (!mtmp.mpeaceful) {
                ;
                pline_msg = "hisses!";
            } else {
                return 0;
            }
            break;
        case MS_BUZZ:
            ;
            pline_msg = mtmp.mpeaceful ? "drones." : "buzzes angrily.";
            break;
        case MS_GRUNT:
            ;
            pline_msg = "grunts.";
            break;
        case MS_NEIGH:
            if (mtmp.mtame < 5) {
                ;
                pline_msg = "neighs.";
            } else if (game.moves > ((mtmp).mextra.edog).hungrytime) {
                ;
                pline_msg = "whinnies.";
            } else {
                ;
                pline_msg = "whickers.";
            }
            break;
        case MS_MOO:
            ;
            pline_msg = "moos.";
            break;
        case MS_BELLOW:
            ;
            pline_msg = "bellows!";
            break;
        case MS_CHIRP:
            ;
            pline_msg = "chirps.";
            break;
        case MS_WAIL:
            ;
            pline_msg = "wails mournfully.";
            break;
        case MS_GROAN:
            if (!rn2(3)) {
                ;
                pline_msg = "groans.";
            }
            break;
        case MS_GURGLE:
            ;
            pline_msg = "gurgles.";
            break;
        case MS_BURBLE:
            ;
            pline_msg = "burbles.";
            break;
        case MS_TRUMPET:
            ;
            pline_msg = "trumpets!";
            wake_nearto(mtmp.mx, mtmp.my, 11 * 11);
            break;
        case MS_SHRIEK:
            ;
            pline_msg = "shrieks.";
            aggravate();
            break;
        case MS_IMITATE:
            pline_msg = "imitates you.";
            break;
        case MS_BONES:
            ;
            pline("%s rattles noisily.", Monnam(mtmp));
            You("freeze for a moment.");
            nomul(-2);
            game.multi_reason = "scared by rattling";
            game.nomovemsg = null;
            break;
        case MS_LAUGH:
{
                ;
                pline_msg = __domonnoise_laugh_msg[rn2(4)];
                break;
            }
        case MS_MUMBLE:
            pline_msg = "mumbles incomprehensibly.";
            break;
        case MS_ORC:
            ;
            pline_msg = "grunts.";
            break;
        case MS_DJINNI:
            if (mtmp.mtame) {
                verbl_msg = "Sorry, I'm all out of wishes.";
            } else if (mtmp.mpeaceful) {
                if (ptr == game.mons[PM_WATER_DEMON]) {
                    pline_msg = "gurgles.";
                } else {
                    verbl_msg = "I'm free!";
                }
            } else {
                if (ptr != game.mons[PM_PRISONER]) {
                    verbl_msg = "This will teach you not to disturb me!";
                /* vague because prisoner might already be out of cell */
                } else {
                    verbl_msg = "Get me out of here.";
                }
            }
            break;
        case MS_BOAST:
            if (!mtmp.mpeaceful) {
                switch (rn2(4)) {
                    case 0:
                        pline("%s boasts about %s gem collection.", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his));
                        break;
                    case 1:
                        pline_msg = "complains about a diet of mutton.";
                        break;
                    default:
                        pline_msg = "shouts \"Fee Fie Foe Foo!\" and guffaws.";
                        wake_nearto(mtmp.mx, mtmp.my, 7 * 7);
                        break;
                }
                break;
            }
            ;
        case MS_HUMANOID:
            if (!mtmp.mpeaceful) {
                if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && ((ptr).pmidx >= PM_ARCHEOLOGIST && (ptr).pmidx <= PM_WIZARD)) {
                    mplayer_talk(mtmp);
                } else {
                    pline_msg = "threatens you.";
                }
                break;
            }
            if (mtmp.mflee) {
                pline_msg = "wants nothing to do with you.";
            } else if (mtmp.mhp < Math.trunc(mtmp.mhpmax / 4)) {
                pline_msg = "moans.";
            } else if (mtmp.mconf || mtmp.mstun) {
                verbl_msg = !rn2(3) ? "Huh?" : rn2(2) ? "What?" : "Eh?";
            } else if (!mtmp.mcansee) {
                verbl_msg = "I can't see!";
            } else if (mtmp.mtrapped) {
                /* Generic peaceful humanoid behavior. */
                let t = t_at(mtmp.mx, mtmp.my);
                if (t) {
                    t.tseen = 1;
                }
                verbl_msg = "I'm trapped!";
            } else if (mtmp.mhp < Math.trunc(mtmp.mhpmax / 2)) {
                pline_msg = "asks for a potion of healing.";
            } else if (mtmp.mtame && !mtmp.isminion && game.moves > ((mtmp).mextra.edog).hungrytime) {
                verbl_msg = "I'm hungry.";
            } else if ((((ptr).mflags2 & 16) != 0)) {
                pline_msg = "curses orcs.";
            } else if ((((ptr).mflags2 & 32) != 0)) {
                pline_msg = "talks about mining.";
            } else if ((((ptr).mflags2 & 2147483648) != 0)) {
                pline_msg = "talks about spellcraft.";
            } else if (ptr.mlet == S_CENTAUR) {
                pline_msg = "discusses hunting.";
            } else if ((((ptr).mflags2 & 64) != 0)) {
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (gnomeplan = rn2(4)) % 2) {
                    /* Specific monsters' interests */
                    /* skipped for rn2(4) result of 0 or 2;
                   gag from an early episode of South Park called "Gnomes";
                   initially, Tweek (introduced in that episode) is the only
                   one aware of the tiny gnomes after spotting them sneaking
                   about; they are embarked upon a three-step business plan;
                   a diagram of the plan shows:
                               Phase 1         Phase 2      Phase 3
                         Collect underpants       ?          Profit
                   and they never verbalize step 2 so we don't either */
                    verbl_msg = (gnomeplan == 1) ? "Phase one, collect underpants." : "Phase three, profit!";
                } else {
                    verbl_msg = "Many enter the dungeon, and few return to the sunlit lands.";
                }
            } else {
                switch (((ptr).pmidx)) {
                    case PM_HOBBIT:
                        pline_msg = (mtmp.mhp < mtmp.mhpmax && (mtmp.mhpmax <= 10 || mtmp.mhp <= mtmp.mhpmax - 10)) ? "complains about unpleasant dungeon conditions." : "asks you about the One Ring.";
                        break;
                    case PM_ARCHEOLOGIST:
                        pline_msg = "describes a recent article in \"Spelunker Today\" magazine.";
                        break;
                    case PM_TOURIST:
                        verbl_msg = "Aloha.";
                        break;
                    default:
                        pline_msg = "discusses dungeon exploration.";
                        break;
                }
            }
            break;
        case MS_SEDUCE:
{
                let swval = 0;
                if (game.sysopt.seduce) {
                    if (ptr.mlet != S_NYMPH && (could_seduce(mtmp, game.youmonst, null) == 1)) {
                        doseduce(mtmp);
                        break;
                    }
                    swval = ((poly_gender() != mtmp.female) ? rn2(3) : 0);
                } else {
                    swval = ((poly_gender() == 0) ? rn2(3) : 0);
                }
                switch (swval) {
                    case 2:
                        verbl_msg = "Hello, sailor.";
                        break;
                    case 1:
                        pline_msg = "comes on to you.";
                        break;
                    default:
                        pline_msg = "cajoles you.";
                }
            }
            break;
        case MS_ARREST:
            if (mtmp.mpeaceful) {
                ;
                verbalize("Just the facts, %s.", game.flags.female ? "Ma'am" : "Sir");
            } else {
                verbl_msg = __domonnoise_arrest_msg[rn2(3)];
            }
            break;
        case MS_BRIBE:
            if (mtmp.mpeaceful && !mtmp.mtame) {
                demon_talk(mtmp);
                break;
            }
            ;
        case MS_CUSS:
            if (!mtmp.mpeaceful) {
                cuss(mtmp);
            } else if ((((((mtmp).data).mflags2 & 4096) != 0) && mon_aligntyp(mtmp) == 1)) {
                verbl_msg = "It's not too late.";
            } else {
                verbl_msg = "We're all doomed.";
            }
            break;
        case MS_SPELL:
            pline_msg = "seems to mutter a cantrip.";
            break;
        case MS_NURSE:
            verbl_msg_mcan = "I hate this job!";
            if (game.uwep && (game.uwep.oclass == WEAPON_CLASS || ((game.uwep).oclass == TOOL_CLASS && game.objects[(game.uwep).otyp].oc_subtyp != P_NONE))) {
                verbl_msg = "Put that weapon away before you hurt someone!";
            } else if (game.uarmc || game.uarm || game.uarmh || game.uarms || game.uarmg || game.uarmf) {
                verbl_msg = (game.urole.mnum == (PM_HEALER)) ? "Doc, I can't help you unless you cooperate." : "Please undress so I can examine you.";
            } else if (game.uarmu) {
                verbl_msg = "Take off your shirt, please.";
            /* deliberately vague, since it's not actually casting any spell */
            } else {
                verbl_msg = "Relax, this won't hurt a bit.";
            }
            break;
        case MS_GUARD:
            if (money_cnt(game.invent)) {
                verbl_msg = "Please drop that gold and follow me.";
            } else {
                verbl_msg = "Please follow me.";
            }
            break;
        case MS_SOLDIER:
{
                verbl_msg = mtmp.mpeaceful ? __domonnoise_soldier_pax_msg[rn2(3)] : __domonnoise_soldier_foe_msg[rn2(3)];
                break;
            }
        case MS_RIDER:
{
                let tribtitle = null;
                let book = null;
                let ms_Death = (ptr == game.mons[PM_DEATH]);
                if (ms_Death && !game.context.tribute.Deathnotice && (book = u_have_novel()) != null) {
                    if ((tribtitle = noveltitle({ get value() { return book.corpsenm; }, set value(_v) { book.corpsenm = _v; } })) != null) {
                        verbuf = sprintf(verbuf, "Ah, so you have a copy of /%s/.", tribtitle);
                        /* no Death featured in these two, so exclude them */
                        if (strncmpi((tribtitle), ("Snuff"), -1) && strncmpi((tribtitle), ("The Wee Free Men"), -1)) {
                            verbuf = strcat(verbuf, "  I may have been misquoted there.");
                        }
                        verbl_msg = verbuf;
                    }
                    game.context.tribute.Deathnotice = 1;
                } else if (ms_Death && rn2(3) && Death_quote(verbuf, 256 /* sizeof(char [256]) */)) {
                    verbl_msg = verbuf;
                } else if (ms_Death && !rn2(10)) {
                    pline_msg = "is busy reading a copy of Sandman #8.";
                } else {
                    verbl_msg = "Who do you think you are, War?";
                }
                break;
            }
    }
    if (pline_msg) {
        pline("%s %s", Monnam(mtmp), pline_msg);
    } else if (mtmp.mcan && verbl_msg_mcan) {
        ;
        verbalize("%s", verbl_msg_mcan);
    } else if (verbl_msg) {
        if (ptr == game.mons[PM_DEATH]) {
            /* Death talks in CAPITAL LETTERS
               and without quotation marks */
            let tmpbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            pline("%s", ucase(strcpy(tmpbuf, verbl_msg)));
            ;
            sound_speak(tmpbuf);
        } else {
            ;
            verbalize("%s", verbl_msg);
        }
    }
    return 1;
}
/* #chat command */
export function dotalk() {
    let result = 0;
    result = dochat();
    return result;
}
const __dochat_walltalk = ["gripes about its job.", "tells you a funny joke!", "insults your heritage!", "chuckles.", "guffaws merrily!", "deprecates your exploration efforts.", "suggests a stint of rehab...", "doesn't seem to be interested."];
export function dochat() {
    let mtmp = null;
    let tx = 0;
    let ty = 0;
    let otmp = null;
    if (((game.youmonst.data).msound == MS_SILENT)) {
        pline("As %s, you cannot speak.", an(pmname(game.youmonst.data, game.flags.female ? FEMALE : MALE)));
        return 0;
    }
    if (game.u.uprops[STRANGLED].intrinsic) {
        You_cant("speak.  You're choking!");
        return 0;
    }
    if (game.u.uswallow) {
        pline("They won't hear you out there.");
        return 0;
    }
    if ((game.u.uinwater)) {
        Your("speech is unintelligible underwater.");
        return 0;
    }
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && (otmp = shop_object(game.u.ux, game.u.uy)) != null) {
        /* standing on something in a shop and chatting causes the shopkeeper
           to describe the price(s).  This can inhibit other chatting inside
           a shop, but that shouldn't matter much.  shop_object() returns an
           object iff inside a shop and the shopkeeper is present and willing
           (not angry) and able (not asleep) to speak and the position
           contains any objects other than just gold.
        */
        price_quote(otmp);
        return 1;
    }
    if (!getdir("Talk to whom? (in what direction)")) {
        return 2;
    }
    if (game.u.usteed && game.u.dz > 0) {
        if (((game.u.usteed).msleeping || !(game.u.usteed).mcanmove)) {
            pline("%s seems not to notice you.", Monnam(game.u.usteed));
            return 1;
        } else {
            return domonnoise(game.u.usteed);
        }
    }
    if (game.u.dz) {
        pline("They won't hear you %s there.", game.u.dz < 0 ? "up" : "down");
        return 0;
    }
    if (game.u.dx == 0 && game.u.dy == 0) {
        /*
         * Let's not include this.
         * It raises all sorts of questions: can you wear
         * 2 helmets, 2 amulets, 3 pairs of gloves or 6 rings as a marilith,
         * etc...  --KAA
        if (u.umonnum == PM_ETTIN) {
            You("discover that your other head makes boring conversation.");
            return 1;
        }
         */
        pline("Talking to yourself is a bad habit for a dungeoneer.");
        return 0;
    }
    tx = game.u.ux + game.u.dx;
    ty = game.u.uy + game.u.dy;
    if (!isok(tx, ty)) {
        return 0;
    }
    mtmp = (game.level.monsters[tx][ty]);
    if (!mtmp || mtmp.mundetected) {
        if ((otmp = (game.level.objects[tx][ty])) != null && otmp.otyp == STATUE) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline_The("%s seems not to notice you.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? rndmonnam(null) : "statue");
            }
            return 0;
        }
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && (((game.level.locations[tx][ty].typ) && (game.level.locations[tx][ty].typ) <= DBWALL) || game.level.locations[tx][ty].typ == SDOOR)) {
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !((game.lastseentyp[tx][ty]) && (game.lastseentyp[tx][ty]) <= DBWALL)) {
                ;
            } else if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                /* if hallucinating, you can't tell it's a statue */
                /* Talking to a wall; secret door remains hidden by behaving
               like a wall; IS_WALL() test excludes solid rock even when
               that serves as a wall bordering a corridor */
                /* when blind, you can only talk to a wall if it has
                   already been mapped as a wall */
                pline("It's like talking to a wall.");
            } else {
                let idx = rn2(10);
                if (idx >= (Math.trunc(8 /* sizeof(const char *const [8]) */ / 1 /* sizeof(const char *const) */))) {
                    idx = (Math.trunc(8 /* sizeof(const char *const [8]) */ / 1 /* sizeof(const char *const) */)) - 1;
                }
                pline_The("wall %s", __dochat_walltalk[idx]);
            }
            return 0;
        }
    }
    if (!mtmp || mtmp.mundetected || ((mtmp).m_ap_type & 7) == M_AP_FURNITURE || ((mtmp).m_ap_type & 7) == M_AP_OBJECT) {
        return 0;
    }
    if (((mtmp).msleeping || !(mtmp).mcanmove) && !mtmp.ispriest) {
        if ((canseemon(mtmp) || sensemon(mtmp))) {
            pline("%s seems not to notice you.", Monnam(mtmp));
        }
        return 0;
    }
    /* if this monster is waiting for something, prod it into action */
    mtmp.mstrategy &= ~(268435456 | 536870912);
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && mtmp.mtame && mtmp.meating) {
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            map_invisible(mtmp.mx, mtmp.my);
        }
        pline("%s is eating noisily.", Monnam(mtmp));
        return 0;
    }
    if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        let xresponse = (((game.youmonst.data).mflags1 & 131072) != 0) ? "falls on deaf ears" : "is inaudible";
        pline("Any response%s%s %s.", (canseemon(mtmp) || sensemon(mtmp)) ? " from " : "", (canseemon(mtmp) || sensemon(mtmp)) ? mon_nam(mtmp) : "", xresponse);
        return 0;
    }
    return domonnoise(mtmp);
}
/* is there a monster at <x,y> that can see the hero and react? */
export function responsive_mon_at(x, y) {
    let mtmp = isok(x, y) ? (game.level.monsters[x][y]) : null;
    if (mtmp && (((mtmp).msleeping || !(mtmp).mcanmove) || !mtmp.mcansee || !(((mtmp.data).mflags1 & 4096) == 0) || (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(((mtmp.data).mflags1 & 16777216) != 0)) || (x != mtmp.mx || y != mtmp.my))) {
        mtmp = null;
    }
    return mtmp;
}
/* player chose 'uarmh' for #tip (pickup.c); visual #chat, sort of... */
const __tiphat_reaction = ["curses", "gestures rudely", "gestures offensively"];
export function tiphat() {
    let mtmp = null;
    let otmp = null;
    let x = 0;
    let y = 0;
    let range = 0;
    let glyph = 0;
    let vismon = 0;
    let unseen = 0;
    let statue = 0;
    let res = 0;
    /* can't get here from there */
    if (!game.uarmh) {
        return 0;
    }
    res = game.uarmh.bknown ? 0 : 1;
    /* "You can't.  It is cursed." */
    if (cursed(game.uarmh)) {
        return res;
    }
    /* if learned of curse, use a move */
    /* might choose a position, but dealing with direct lines is simpler */
    if (!getdir("At whom? (in what direction)")) {
        return res;
    }
    /* iffy; now know it's not cursed for sure (since we got
                     * past prior test) but might have already known that */
    /* physical action is going to take place */
    res = 1;
    /* most helmets have a short wear/take-off delay and we could set
       'multi' to account for that, but we'll pretend that no extra time
       beyond the current move is necessary */
    You("briefly doff your %s.", helm_simple_name(game.uarmh));
    if (!game.u.dx && !game.u.dy) {
        if (game.u.usteed && game.u.dz > 0) {
            if (((game.u.usteed).msleeping || !(game.u.usteed).mcanmove)) {
                pline("%s doesn't notice.", Monnam(game.u.usteed));
            } else {
                domonnoise(game.u.usteed);
            }
        } else if (game.u.dz) {
            pline("There's no one %s there.", (game.u.dz < 0) ? "up" : "down");
        } else {
            pline_The("lout here doesn't acknowledge you...");
        }
        return res;
    }
    mtmp = null;
    vismon = unseen = statue = 0 , glyph = GLYPH_MON_OFF;
    x = game.u.ux , y = game.u.uy;
    for (range = 1; range <= 8 + 1; ++range) {
        x += game.u.dx , y += game.u.dy;
        if (!isok(x, y) || (range > 1 && !((game.viz_array[y][x] & 1) != 0))) {
            /* switch back to coordinates for previous iteration's 'mtmp' */
            x -= game.u.dx , y -= game.u.dy;
            break;
        }
        mtmp = (game.level.monsters[x][y]);
        vismon = (mtmp && canseemon(mtmp));
        glyph = glyph_at(x, y);
        unseen = ((glyph) == GLYPH_INVIS_OFF);
        /* mimic or hallucinatory statue */
        statue = ((((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || (!vismon && !unseen && (otmp = (game.level.objects[x][y])) != null && otmp.otyp == STATUE));
        if (vismon && (((mtmp).m_ap_type & 7) == M_AP_FURNITURE || ((mtmp).m_ap_type & 7) == M_AP_OBJECT)) {
            vismon = 0 , mtmp = null;
        }
        if (vismon || unseen || (statue && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) || (range == 1 && mtmp && responsive_mon_at(x, y) && !((mtmp.data).msound == MS_SILENT)) || !(accessible(x, y) || game.level.locations[x][y].typ == IRONBARS)) {
            break;
        }
    }
    if (unseen || (statue && (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) {
        /* unseen adjacent monster will respond if able */
        /* we check accessible() after m_at() in case there's a
               visible monster phazing through a wall here */
        pline("That %screature is ignoring you!", unseen ? "unseen " : "");
    } else if (!mtmp || !responsive_mon_at(x, y)) {
        if (vismon) {
            pline("%s seems not to notice you.", Monnam(mtmp));
        } else {
            pline("%s", c_common_strings.c_nothing_happens);
        }
    } else {
        /* 'mtmp' is guaranteed to be non-Null if we get here */
        mtmp.mstrategy &= ~(268435456 | 536870912);
        if (vismon && (((mtmp.data).mflags1 & 131072) != 0) && mtmp.mpeaceful && !(game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) {
            if ((otmp = which_armor(mtmp, 4)) == null) {
                pline("%s waves.", Monnam(mtmp));
            } else if (otmp.cursed) {
                pline("%s grasps %s %s but can't remove it.", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his), helm_simple_name(otmp));
                otmp.bknown = 1;
            } else {
                pline("%s tips %s %s in response.", Monnam(mtmp), (genders[pronoun_gender(mtmp, 2)].his), helm_simple_name(otmp));
            }
        } else if (vismon && (((mtmp.data).mflags1 & 131072) != 0)) {
            let which = !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? rn2(3) : (rn2(2) + (1));
            let twice = ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) || which > 0 || rn2(3)) ? 0 : (rn2(2) + (1));
            pline("%s %s%s%s at you...", Monnam(mtmp), __tiphat_reaction[which], twice ? " and " : "", twice ? __tiphat_reaction[twice] : "");
        } else if ((dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2) && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && domonnoise(mtmp)) {
            if (!vismon) {
                map_invisible(x, y);
            }
        } else if (vismon) {
            pline("%s doesn't respond.", Monnam(mtmp));
        } else {
            nada: {
            }
            pline("%s", c_common_strings.c_nothing_happens);
        }
    }
    return res;
}
/* set in files.c */
/* adds a sound file mapping, returns 0 on failure, 1 on success */
/* we do this check here first, in order to completely
     * avoid doing the regex search when there won't be a
     * sound anyway, despite a match.
     */
/* we do this check here first, in order to completely
     * avoid doing the regex search when there won't be a
     * sound anyway, despite a match.
     */
/* USER_SOUNDS */
game.soundprocs = { soundname: null, soundlib_id: 0, sound_triggers: 0, sound_init_nhsound: null, sound_exit_nhsound: null, sound_achievement: null, sound_soundeffect: null, sound_hero_playnotes: null, sound_play_usersound: null, sound_ambience: null, sound_verbal: null };
game.nosound_procs = { soundname: "nosound", soundlib_id: (soundlib_nosound), sound_triggers: 0, sound_init_nhsound: null, sound_exit_nhsound: null, sound_achievement: null, sound_soundeffect: null, sound_hero_playnotes: null, sound_play_usersound: null, sound_ambience: null, sound_verbal: null };
/* init_nhsound   */
/* exit_nhsound   */
/* achievement    */
/* sound effect   */
/* hero_playnotes */
/* play_usersound */
/* ambience       */
/* verbal */
/* The order of these array entries must match the
   order of the enum soundlib_ids in sndprocs.h */
// struct sound_choices: { sndprocs }
game.soundlib_choices = [{ sndprocs: game.nosound_procs }];
/* default, built-in */
export function activate_chosen_soundlib() {
    let idx = game.chosen_soundlib;
    if (!((idx) >= 0 && (idx) < (Math.trunc(1 /* sizeof(struct sound_choices [1]) */ / 1 /* sizeof(struct sound_choices) */)))) {
        panic("activate_chosen_soundlib: invalid soundlib (%d)", idx);
    }
    if (game.active_soundlib != soundlib_nosound || idx != soundlib_nosound) {
        if (game.soundprocs.sound_exit_nhsound) {
            (game.soundprocs.sound_exit_nhsound)("assigning a new sound library");
        }
    }
    Object.assign(game.soundprocs, game.soundlib_choices[idx].sndprocs);
    if (game.soundprocs.sound_init_nhsound) {
        (game.soundprocs.sound_init_nhsound)();
    }
    game.active_soundlib = game.soundprocs.soundlib_id;
    game.chosen_soundlib = game.active_soundlib;
}
export function assign_soundlib(idx) {
    if (!((idx) >= 0 && (idx) < (Math.trunc(1 /* sizeof(struct sound_choices [1]) */ / 1 /* sizeof(struct sound_choices) */)))) {
        panic("assign_soundlib: invalid soundlib (%d)", idx);
    }
    game.chosen_soundlib = game.soundlib_choices[idx].sndprocs.soundlib_id;
}
/* The code below here mimics that in windows.c error handling
       for choosing Window type */
/* 50: arbitrary, no real soundlib names are anywhere near that long;
       used to prevent potential raw_printf() overflow if user supplies a
       very long string (on the order of 1200 chars) on the command line
       (config file options can't get that big; they're truncated at 1023) */
/*, tmps = 0*/
/* copy up to maxlen-1 characters; 'dest' must be able to hold maxlen;
   treat comma as alternate end of 'src' */
export function get_soundlib_name(dest, maxlen) {
    /* Hand-port: C walks src char-by-char, copying to dest until comma
       (',' = 44), null terminator, or maxlen-1 chars copied.  Translator
       emitted `src == 44` (string vs int, always false), `src++` (string
       concat), and `*p = src++` (void 0 TODO).  Loop bailed without
       copying.  Also wrote `dest.value = 0` which is wrong because dest
       is an Array (caller's soundlibbuf in options.js:2762). */
    let idx = game.active_soundlib;
    if (!((idx) >= 0 && (idx) < 1 /* sizeof(struct sound_choices [1])/sizeof */)) {
        panic("get_soundlib_name: invalid active_soundlib (%d)", idx);
    }
    const src = game.soundlib_choices[idx].sndprocs.soundname;
    const s = (typeof src === 'string') ? src
        : (Array.isArray(src) ? ((() => { let r=''; for (let i=0; i<src.length && src[i]; i++) r += String.fromCharCode(src[i]); return r; })()) : (src == null ? '' : String(src)));
    /* Stop at ',' or end-of-string */
    const commaIdx = s.indexOf(',');
    const end = (commaIdx >= 0) ? commaIdx : s.length;
    const truncEnd = Math.min(end, maxlen - 1);
    if (Array.isArray(dest)) {
        let i;
        for (i = 0; i < dest.length && i < truncEnd; i++) dest[i] = s.charCodeAt(i);
        if (i < dest.length) dest[i] = 0;
    }
}
export function soundlib_id_from_opt(op) {
    let idx = 0;
    let defproc = game.nosound_procs;
    let sp = null;
    for (idx = 0; idx < (Math.trunc(1 /* sizeof(struct sound_choices [1]) */ / 1 /* sizeof(struct sound_choices) */)); ++idx) {
        sp = game.soundlib_choices[idx].sndprocs;
        if (!strcmp(sp.soundname, op)) {
            return sp.soundlib_id;
        }
    }
    return defproc.soundlib_id;
}
/*
 * The default sound interface
 *
 * 3rd party sound_procs should be placed in ../sound/x
 * and build procedures should reference them there.
 */
/* prototype in case a build defines staticfn to nothing */
/* to avoid things getting out of sequence; seid an index to the name */
/*    enum sound_effect_entries seid = (enum sound_effect_entries) seidint; */
/* sounddir would get set in files.c */
/* 1 for '/' */
/* consumes += (sizeof suffix - 1); */
/* points at trailing NUL */
/* points at last character */
/* points back at trailing NUL */
/* for '/' */
/* for trailing NUL */
/* existinglen could be >= bufsz if caller didn't initialize buf
     * to properly include a trailing NUL */
/* SND_SOUNDEFFECTS_AUTOMAP */
const __base_soundname_to_filename_suffix = ".wav";
export function base_soundname_to_filename(basename, buf, bufsz, approach) {
    let consumes = 0;
    let baselen = 0;
    let existinglen = 0;
    let cp = buf;
    let needslash = (1);
    if (!buf) {
        return null;
    }
    baselen = strlen(basename);
    consumes = baselen;
    if (approach == sff_havedir_append_rest) {
        existinglen = strlen(buf);
        if (existinglen > 0) {
            cp = buf + existinglen;
            cp--;
            if (cp.value == 47 || cp.value == 92) {
                needslash = (0);
            }
            cp++;
        }
        if (needslash) {
            consumes++;
        }
        consumes += existinglen;
        consumes += (5 /* sizeof(const char [5]) */ - 1);
    }
    consumes += 1;
    if (!baselen || consumes > bufsz || existinglen >= bufsz) {
        return null;
    }
    if (approach == sff_havedir_append_rest) {
        if (needslash) {
            cp.value = 47;
            cp++;
            cp.value = 0;
            existinglen++;
        }
        nh_snprintf("base_soundname_to_filename", 2144, cp, bufsz - (existinglen + 1), "%s%s", basename, __base_soundname_to_filename_suffix);
    } else if (approach == sff_base_only) {
        nh_snprintf("base_soundname_to_filename", 2146, buf, bufsz, "%s", basename);
    } else {
        return null;
    }
    return buf;
}
export function set_voice(mtmp, tone, volume, moreinfo) {}
export function sound_speak(text) { /* cp1 -> 1st, cp2 -> last non-nul) */ }
/*sounds.c*/
/* ogres, trolls, gargoyles, one or two others */
/* capable of speech but only do so if hero is similar type */
/* lycanthrope in human form */
/* titan, barrow wight, Nazgul, nalfeshnee */
/* insects, arthropods, worms, sea creatures */
/* "chitter": have silent critters make some noise
           or the mommy/daddy gag when hatching doesn't work */
/* approximation of GEICO's advertising slogan (it actually
               concludes with "save you 15% or more on car insurance.") */
/* 5.0: the 'complains' message used to be given if the
                   hobbit's current hit points were at 10 below max or
                   less, but their max is normally less than 10 so it
                   would almost never occur */
/* 'vismon' is only True when 'mtmp' is non-Null */
