/* NetHack 5.0	write.c	$NHDT-Date: 1702023275 2023/12/08 08:14:35 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.41 $ */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { memcpy } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcpy, strncmpi, strstri } from '../c2js-runtime/string.js';
import { exercise } from './attrib.js';
import { dropx } from './do.js';
import { fingers_or_gloves } from './do_wear.js';
import { wipeout_text } from './engrave.js';
import { mungspaces, upstart } from './hacklib.js';
import { getobj, hold_another_object, update_inventory, useup } from './invent.js';
import { bcsign, mksobj } from './mkobj.js';
import { A_WIS, BLINDED, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_SUGGEST, GLIB, HALLUC, HALLUC_RES, PM_WIZARD, SCROLL_CLASS, SCR_AMNESIA, SCR_BLANK_PAPER, SCR_CHARGING, SCR_CONFUSE_MONSTER, SCR_CREATE_MONSTER, SCR_DESTROY_ARMOR, SCR_EARTH, SCR_ENCHANT_ARMOR, SCR_ENCHANT_WEAPON, SCR_FIRE, SCR_FOOD_DETECTION, SCR_GENOCIDE, SCR_GOLD_DETECTION, SCR_IDENTIFY, SCR_LIGHT, SCR_MAGIC_MAPPING, SCR_MAIL, SCR_PUNISHMENT, SCR_REMOVE_CURSE, SCR_SCARE_MONSTER, SCR_STINKING_CLOUD, SCR_TAMING, SCR_TELEPORTATION, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_NOVEL, spe_Fresh, spe_GoingStale, spe_Unknown } from './nh-constants.js';
import { discover_object, observe_object } from './o_init.js';
import { The, Tobjnam, an, aobjnam, ysimple_name } from './objnam.js';
import { There, livelog_printf } from './pline.js';
import { rn2, rnl } from './rnd.js';
import { check_unpaid, obfree } from './shk.js';
import { known_spell } from './spell.js';
import { getlin } from './windows.js';

/*
 * returns base cost of a scroll or a spellbook
 */
export function cost(otmp) {
    if (otmp.oclass == SPBOOK_CLASS) {
        return (10 * game.objects[otmp.otyp].oc_oc2);
    }
    switch (otmp.otyp) {
        case SCR_MAIL:
            return 2;
        case SCR_LIGHT:
        case SCR_GOLD_DETECTION:
        case SCR_FOOD_DETECTION:
        case SCR_MAGIC_MAPPING:
        case SCR_AMNESIA:
        case SCR_FIRE:
        case SCR_EARTH:
            return 8;
        case SCR_DESTROY_ARMOR:
        case SCR_CREATE_MONSTER:
        case SCR_PUNISHMENT:
            return 10;
        case SCR_CONFUSE_MONSTER:
            return 12;
        case SCR_IDENTIFY:
            return 14;
        case SCR_ENCHANT_ARMOR:
        case SCR_REMOVE_CURSE:
        case SCR_ENCHANT_WEAPON:
        case SCR_CHARGING:
            return 16;
        case SCR_SCARE_MONSTER:
        case SCR_STINKING_CLOUD:
        case SCR_TAMING:
        case SCR_TELEPORTATION:
            return 20;
        case SCR_GENOCIDE:
            return 30;
        case SCR_BLANK_PAPER:
        default:
            impossible("You can't write such a weird scroll!");
    }
    return 1000;
}
/* getobj callback for object to write on */
export function write_ok(obj) {
    if (!obj || (obj.oclass != SCROLL_CLASS && obj.oclass != SPBOOK_CLASS)) {
        return GETOBJ_EXCLUDE;
    }
    if (obj.otyp == SCR_BLANK_PAPER || obj.otyp == SPE_BLANK_PAPER) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_DOWNPLAY;
}
/* write -- applying a magic marker */
export function dowrite(pen) {
    let paper = null;
    let namebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let nm = null;
    let bp = null;
    let new_obj = null;
    let basecost = 0;
    let actualcost = 0;
    let curseval = 0;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let first = 0;
    let last = 0;
    let i = 0;
    let deferred = 0;
    let deferralchance = 0;
    let real = 0;
    let by_descr = 0;
    let typeword = null;
    let spell_knowledge = 0;
    found: {
        namebuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        by_descr = (0);
        if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
            You("need hands to be able to write!");
            return 0;
        } else if (game.u.uprops[GLIB].intrinsic) {
            pline("%s from your %s.", Tobjnam(pen, "slip"), fingers_or_gloves((0)));
            dropx(pen);
            /* try to avoid complaint about dead assignment */
            return 1;
        }
        paper = getobj("write on", write_ok, 0);
        if (!paper) {
            return 2;
        }
        /* can't write on a novel (unless/until it's been converted into a blank
       spellbook), but we want messages saying so to avoid "spellbook" */
        typeword = (paper.otyp == SPE_NOVEL) ? "book" : (paper.oclass == SPBOOK_CLASS) ? "spellbook" : "scroll";
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            if (!paper.dknown) {
                You("don't know whether that %s is blank or not.", typeword);
                return 0;
            } else if (paper.oclass == SPBOOK_CLASS) {
                /* can't write a magic book while blind */
                pline("%s can't create braille text.", upstart(ysimple_name(pen)));
                return 0;
            }
        }
        observe_object(paper);
        if (paper.otyp != SCR_BLANK_PAPER && paper.otyp != SPE_BLANK_PAPER) {
            pline("That %s is not blank!", typeword);
            exercise(A_WIS, (0));
            return 1;
        }
        discover_object((SCR_BLANK_PAPER), (1), (1), (1));
        qbuf = sprintf(qbuf, "What type of %s do you want to write?", typeword);
        getlin(qbuf, namebuf);
        /* remove any excess whitespace */
        namebuf = mungspaces(namebuf);
        if (namebuf[0] == 27 || !namebuf[0]) {
            return 1;
        }
        __nh_nm_idx = 0;
        if (!strncmpi(namebuf.slice(__nh_nm_idx), "scroll ", 7)) {
            __nh_nm_idx += 7;
        } else if (!strncmpi(namebuf.slice(__nh_nm_idx), "spellbook ", 10)) {
            __nh_nm_idx += 10;
        }
        if (!strncmpi(namebuf.slice(__nh_nm_idx), "of ", 3)) {
            __nh_nm_idx += 3;
        }
        if ((bp = strstri(namebuf.slice(__nh_nm_idx), " armour")) != null) {
            memcpy(bp, " armor ", 7);
            mungspaces(bp + 1);
        }
        deferred = real = 0;
        /* incremented for each oc_uname match */
        deferralchance = 0;
        first = game.bases[paper.oclass];
        last = game.bases[paper.oclass + 1] - 1;
        for (i = first; i <= last; i++) {
            /* first loop: look for match with name/description */
            /* extra shufflable descr not representing a real object */
            if (!(game.obj_descr[(game.objects[i]).oc_name_idx].oc_name)) {
                continue;
            }
            if (!strncmpi(((game.obj_descr[(game.objects[i]).oc_name_idx].oc_name)), namebuf.slice(__nh_nm_idx), -1)) {
                if (game.objects[i].oc_name_known || paper.oclass == SPBOOK_CLASS) {
                    /* spellbooks can only be written by_name, so no need to
                   hold out for a 'better' by_descr match */
                    break found;
                } else {
                    /* save item in case there are no better by_descr matches */
                    real = deferred = i;
                    break;
                }
            }
            if (!strncmpi(((game.obj_descr[(game.objects[i]).oc_descr_idx].oc_descr)), namebuf.slice(__nh_nm_idx), -1)) {
                /* writing by user-assigned name is same as by description:
               fails for books, works for scrolls (having an assigned
               type name guarantees presence on discoveries list) */
                by_descr = (1);
                break found;
            }
        }
        for (i = first; i <= last; i++) {
            if (game.objects[i].oc_uname && !strncmpi((game.objects[i].oc_uname), namebuf.slice(__nh_nm_idx), -1) && !(real && game.objects[i].oc_name_known) && !rn2(++deferralchance)) {
                /* second loop: look for match with user-assigned name */
                /* we will get here if 'nm' isn't a real scroll name/descr, or is the name
     * of a real scroll that hasn't been formally IDed. */
                /* player might assign same name multiple times and if so,
           we choose one of those matches randomly */
                /* prefer attempting to write the real scroll type if
               the typename clobbers a real scroll and is known to
               be incorrect */
                /*
             * First match: chance incremented to 1,
             *   !rn2(1) is 1, we remember i;
             * second match: chance incremented to 2,
             *   !rn2(2) has 1/2 chance to replace i;
             * third match: chance incremented to 3,
             *   !rn2(3) has 1/3 chance to replace i
             *   and 2/3 chance to keep previous 50:50
             *   choice; so on for higher match counts.
             */
                deferred = i;
                by_descr = (1);
            }
        }
        if (deferred) {
            i = deferred;
            break found;
        }
        There("is no such %s!", typeword);
        return 1;
    }
    if (i == SCR_BLANK_PAPER || i == SPE_BLANK_PAPER) {
        You_cant("write that!");
        pline("It's obscene!");
        return 1;
    } else if (i == SPE_NOVEL) {
        let fanfic = !rn2(3);
        let tearup = !rn2(3);
        if (!fanfic) {
            You("%s to write the Great Yendorian Novel, but %s inspiration.", !tearup ? "prepare" : "try", !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "lack" : "have too much");
        } else {
            You("%sproduce really %s fan-fiction.", !tearup ? "start to " : "", !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "lame" : "awesome");
        }
        if (!tearup) {
            You("give up on the idea.");
        } else {
            You("tear it up.");
            /* use up old scroll / spellbook */
            useup(paper);
        }
        return 1;
    } else if (i == SPE_BOOK_OF_THE_DEAD) {
        pline("No mere dungeon adventurer could write that.");
        return 1;
    } else if (by_descr && paper.oclass == SPBOOK_CLASS && !game.objects[i].oc_name_known) {
        /* can't write unknown spellbooks by description */
        pline("Unfortunately you don't have enough information to go on.");
        return 1;
    }
    if (!game.u.uconduct.literate++) {
        livelog_printf(32, "became literate by writing %s", an(typeword));
    }
    new_obj = mksobj(i, (0), (0));
    new_obj.bknown = (paper.bknown && pen.bknown);
    /* shk imposes a flat rate per use, not based on actual charges used */
    check_unpaid(pen);
    /* see if there's enough ink */
    basecost = cost(new_obj);
    if (pen.spe < Math.trunc(basecost / 2)) {
        Your("marker is too dry to write that!");
        obfree(new_obj, null);
        return 1;
    }
    /* we're really going to write now, so calculate cost
     */
    actualcost = (rn2(Math.trunc(basecost / 2)) + (Math.trunc(basecost / 2)));
    curseval = bcsign(pen) + bcsign(paper);
    exercise(A_WIS, (1));
    if (pen.spe < actualcost) {
        pen.spe = 0;
        Your("marker dries out!");
        if (paper.oclass == SPBOOK_CLASS) {
            /* scrolls disappear, spellbooks don't */
            pline_The("spellbook is left unfinished and your writing fades.");
            update_inventory();
        } else {
            pline_The("scroll is now useless and disappears!");
            useup(paper);
        }
        obfree(new_obj, null);
        return 1;
    }
    pen.spe -= actualcost;
    if (paper.oclass == SPBOOK_CLASS) {
        /*
     * Writing by name requires that the hero knows the scroll or
     * book type.  One has previously been read (and its effect
     * was evident) or been ID'd via scroll/spell/throne (or skill
     * for Wizards) and it will be on the discoveries list.
     * Unknown spellbooks can also be written by name if the hero
     * has fresh knowledge of the spell, or if the spell is almost
     * forgotten and the hero is Lucky (with a greater chance than
     * if the spell is unknown or forgotten).
     * (Previous versions allowed scrolls and books to be written
     * by type name if they were on the discoveries list via being
     * given a user-assigned name, even though doing the latter
     * doesn't--and shouldn't--make the actual type become known.)
     *
     * Writing by description requires that the hero knows the
     * description (a scroll's label, that is, since books by_descr
     * are rejected above).  This is done by checking to see if a
     * scroll with the same description has been encountered.
     *
     * Normal requirements can be overridden if hero is Lucky.
     */
        spell_knowledge = known_spell(new_obj.otyp);
    } else {
        spell_knowledge = spe_Unknown;
    }
    if (!game.objects[new_obj.otyp].oc_name_known && !(by_descr && game.objects[new_obj.otyp].oc_encountered) && spell_knowledge != spe_Fresh && rnl((((game.urole.mnum == (PM_WIZARD)) && paper.oclass != SPBOOK_CLASS) || spell_knowledge == spe_GoingStale) ? 5 : 15)) {
        /* if known, then either by-name or by-descr works */
        /* else if named, then only by-descr works */
        /* else fresh knowledge of the spell works */
        /* and Luck might override after previous checks have failed */
        You("%s to write that.", by_descr ? "fail" : "don't know how");
        if (paper.oclass == SPBOOK_CLASS) {
            You("write in your best handwriting:  \"My Diary\", but it quickly fades.");
            update_inventory();
        } else {
            if (by_descr) {
                namebuf = strcpy(namebuf, (game.obj_descr[(game.objects[new_obj.otyp]).oc_descr_idx].oc_descr));
                wipeout_text(namebuf, Math.trunc((6 + 30 - game.u.ulevel) / 6), 0);
            } else {
                namebuf = sprintf(namebuf, "%s was here!", game.plname);
            }
            You("write \"%s\" and the scroll disappears.", namebuf);
            useup(paper);
        }
        obfree(new_obj, null);
        return 1;
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && rnl(3)) {
        /* can write scrolls when blind, but requires luck too;
       attempts to write books when blind are caught above */
        /* writing while blind usually fails regardless of
           whether the target scroll is known; even if we
           have passed the write-an-unknown scroll test
           above we can still fail this one, so it's doubly
           hard to write an unknown scroll while blind */
        You("fail to write the scroll correctly and it disappears.");
        useup(paper);
        obfree(new_obj, null);
        return 1;
    }
    useup(paper);
    if (new_obj.oclass == SPBOOK_CLASS) {
        /* acknowledge the change in the object's description... */
        pline_The("spellbook warps strangely, then turns %s.", new_book_description(new_obj.otyp, namebuf));
    }
    new_obj.blessed = (curseval > 0);
    new_obj.cursed = (curseval < 0);
    if (new_obj.otyp == SCR_MAIL) {
        new_obj.spe = 2;
    }
    /* unlike alchemy, for example, a successful result yields the
       specifically chosen item so hero recognizes it even if blind;
       the exception is for being lucky writing an undiscovered scroll,
       where the label associated with the type-name isn't known yet;
       but if writing by description, the description is always known */
    new_obj.dknown = (0);
    if (game.objects[new_obj.otyp].oc_name_known || by_descr) {
        observe_object(new_obj);
    }
    new_obj = hold_another_object(new_obj, "Oops!  %s out of your grasp!", The(aobjnam(new_obj, "slip")), null);
    ((new_obj));
    return 1;
}
/* most book descriptions refer to cover appearance, so we can issue a
   message for converting a plain book into one of those with something
   like "the spellbook turns red" or "the spellbook turns ragged";
   but some descriptions refer to composition and "the book turns vellum"
   looks funny, so we want to insert "into " prior to such descriptions;
   even that's rather iffy, indicating that such descriptions probably
   ought to be eliminated (especially "cloth"!) */
/* not applicable--can't be produced via writing */
const __new_book_description_compositions = ["parchment", "vellum", "cloth", null];
export function new_book_description(booktype, outbuf) {
    /* subset of description strings from objects.c; if it grows
       much, we may need to add a new flag field to objects[] instead */
    let descr = null;
    let comp_p = null;
    descr = (game.obj_descr[(game.objects[booktype]).oc_descr_idx].oc_descr);
    for (comp_p = __new_book_description_compositions; comp_p; ++comp_p) {
        if (!strncmpi((descr), (comp_p), -1)) {
            break;
        }
    }
    outbuf = sprintf(outbuf, "%s%s", comp_p ? "into " : "", descr);
    return outbuf;
}
/*write.c*/
/* 0: delivered in-game via external event (or randomly for fake mail);
           1: from bones or wishing; 2: written with marker */
