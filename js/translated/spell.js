/* NetHack 5.0	spell.c	$NHDT-Date: 1769498874 2026/01/26 23:27:54 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.185 $ */
/*      Copyright (c) M. Stephenson 1988                          */
/* NetHack may be freely redistributed.  See license for details. */
/* spellmenu arguments; 0..n-1 used as svs.spl_book[] index when swapping */
/* special menu entry */
/* spell retention period, in turns; at 10% of this value, player becomes
   eligible to reread the spellbook and regain 100% retention (the threshold
   used to be 1000 turns, which was 10% of the original 10000 turn retention
   period but didn't get adjusted when that period got doubled to 20000) */
/* x: need to add 1 when used for reading a spellbook rather than for hero
   initialization; spell memory is decremented at the end of each turn,
   including the turn on which the spellbook is read; without the extra
   increment, the hero used to get cheated out of 1 turn of retention */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, You_hear, Your, pline, pline_The } from '../c2js-runtime/pline.js';
import { qsort } from '../c2js-runtime/qsort.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcpy, strncmpi } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { jump } from './apply.js';
import { acurr, exercise, poison_strdmg } from './attrib.js';
import { cmdq_add_key, cmdq_pop, getdir, isok, set_occupation, yn_function } from './cmd.js';
import { c_color_names, c_common_strings, cg, quitchars, xdir, ydir, ynchars } from './decl.js';
import { do_vicinity_map } from './detect.js';
import { canseemon, map_invisible, nul_glyphinfo, sensemon, shieldeff, tmp_at, zapdir_to_glyph } from './display.js';
import { trycall } from './do.js';
import { Monnam, hcolor, hliquid, mon_nam, noveltitle } from './do_name.js';
import { find_ac } from './do_wear.js';
import { make_familiar, tamedog } from './dog.js';
import { walk_path } from './dothrow.js';
import { In_hell, In_mines, on_level } from './dungeon.js';
import { morehungry } from './eat.js';
import { freehand } from './engrave.js';
import { more_experienced, newexplevel } from './exper.js';
import { explode } from './explode.js';
import { getpos, getpos_sethilite } from './getpos.js';
import { check_capacity, invocation_pos, losehp, nomul } from './hack.js';
import { dist2, distmin, isqrt } from './hacklib.js';
import { record_achievement } from './insight.js';
import { update_inventory, useup } from './invent.js';
import { makemon, set_malign } from './makemon.js';
import { mkinvokearea } from './mklev.js';
import { mksobj, set_bknown, weight } from './mkobj.js';
import { mkundead } from './mkroom.js';
import { iter_mons, wakeup, xkilled } from './mon.js';
import { Resists_Elem, can_chant, defended, dmgtype_fromattack } from './mondata.js';
import { monflee } from './monmove.js';
import { ACH_INVK, ACH_NOVL, ANTIMAGIC, A_INT, A_STR, A_WIS, BELL_OF_OPENING, BLINDED, CANDELABRUM_OF_INVOCATION, CLAIRVOYANT, CLOUD, CMDQ_KEY, CONFUSION, CORNUTHAUM, CQ_REPEAT, DBWALL, DOOR, DRAWBRIDGE_UP, EXPL_FIERY, EXPL_FROSTY, EYE, FACE, GLYPH_ALTAR_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, HALF_PHDAM, HALLUC, HALLUC_RES, HEAD, IRON, LAVAPOOL, LENSES, MAXSPELL, MAX_GLYPH, MITHRIL, MOAT, N_DIRS_Z, PM_AIR_ELEMENTAL, PM_CYCLOPS, PM_FLOATING_EYE, PM_FOG_CLOUD, PM_KNIGHT, PM_MASTER_LICH, PM_NALFESHNEE, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WIZARD, POISON_RES, POOL, P_ATTACK_SPELL, P_BASIC, P_CLERIC_SPELL, P_DIVINATION_SPELL, P_ENCHANTMENT_SPELL, P_ESCAPE_SPELL, P_EXPERT, P_GRAND_MASTER, P_HEALING_SPELL, P_MASTER, P_MATTER_SPELL, P_NONE, P_SKILLED, P_UNSKILLED, QUARTERSTAFF, ROBE, SHOCK_RES, SICK, SLEEP_RES, SLIMED, SMALL_SHIELD, SPBOOK_CLASS, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_CANCELLATION, SPE_CAUSE_FEAR, SPE_CHAIN_LIGHTNING, SPE_CHARM_MONSTER, SPE_CLAIRVOYANCE, SPE_CONE_OF_COLD, SPE_CONFUSE_MONSTER, SPE_CREATE_FAMILIAR, SPE_CREATE_MONSTER, SPE_CURE_BLINDNESS, SPE_CURE_SICKNESS, SPE_DETECT_FOOD, SPE_DETECT_MONSTERS, SPE_DETECT_TREASURE, SPE_DETECT_UNSEEN, SPE_DIG, SPE_DRAIN_LIFE, SPE_EXTRA_HEALING, SPE_FINGER_OF_DEATH, SPE_FIREBALL, SPE_FORCE_BOLT, SPE_HASTE_SELF, SPE_HEALING, SPE_IDENTIFY, SPE_INVISIBILITY, SPE_JUMPING, SPE_KNOCK, SPE_LEVITATION, SPE_LIGHT, SPE_MAGIC_MAPPING, SPE_MAGIC_MISSILE, SPE_NOVEL, SPE_POLYMORPH, SPE_PROTECTION, SPE_REMOVE_CURSE, SPE_RESTORE_ABILITY, SPE_SLEEP, SPE_SLOW_MONSTER, SPE_STONE_TO_FLESH, SPE_TELEPORT_AWAY, SPE_TURN_UNDEAD, SPE_WIZARD_LOCK, SPINE, STONE, STUNNED, S_VORTEX, S_altar, S_arrow_trap, S_digbeam, S_goodpos, S_grave, S_ndoor, S_stone, S_trwall, S_vwall, TRAPNUM, TREE, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned, spe_Forgotten, spe_Fresh, spe_GoingStale, spe_Unknown } from './nh-constants.js';
import { discover_object, objdescr_is, observe_object } from './o_init.js';
import { Tobjnam, an, makeplural } from './objnam.js';
import { livelog_printf } from './pline.js';
import { body_part } from './polyself.js';
import { healup, make_blinded, make_confused, make_slimed, make_stunned, peffects } from './potion.js';
import { seffects } from './read.js';
import { d, rn2, rn2_on_display_rng, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { check_unpaid, obfree } from './shk.js';
import { rndcurse, take_gold } from './sit.js';
import { On_stairs } from './stairs.js';
import { tele } from './teleport.js';
import { fall_asleep } from './timeout.js';
import { erode_obj } from './trap.js';
import { use_skill } from './weapon.js';
import { add_menu, add_menu_heading, add_menu_str, select_menu } from './windows.js';
import { aggravate } from './wizard.js';
import { exclam, spell_damage_bonus, unturn_dead, weffects, zapyourself, zhitm } from './zap.js';

/* The roles[] table lists the role-specific values for tuning
 * percent_success().
 *
 * Reasoning:
 *   spelbase, spelheal:
 *      Arc are aware of magic through historical research
 *      Bar abhor magic (Conan finds it "interferes with his animal instincts")
 *      Cav are ignorant to magic
 *      Hea are very aware of healing magic through medical research
 *      Kni are moderately aware of healing from Paladin training
 *      Mon use magic to attack and defend in lieu of weapons and armor
 *      Pri are very aware of healing magic through theological research
 *      Ran avoid magic, preferring to fight unseen and unheard
 *      Rog are moderately aware of magic through trickery
 *      Sam have limited magical awareness, preferring meditation to conjuring
 *      Tou are aware of magic from all the great films they have seen
 *      Val have limited magical awareness, preferring fighting
 *      Wiz are trained mages
 *
 *      The arms penalty is lessened for trained fighters Bar, Kni, Ran,
 *      Sam, Val -- the penalty is its metal interference, not encumbrance.
 *      The `spelspec' is a single spell which is fundamentally easier
 *      for that role to cast.
 *
 *  spelspec, spelsbon:
 *      Arc map masters (SPE_MAGIC_MAPPING)
 *      Bar fugue/berserker (SPE_HASTE_SELF)
 *      Cav born to dig (SPE_DIG)
 *      Hea to heal (SPE_CURE_SICKNESS)
 *      Kni to turn back evil (SPE_TURN_UNDEAD)
 *      Mon to preserve their abilities (SPE_RESTORE_ABILITY)
 *      Pri to bless (SPE_REMOVE_CURSE)
 *      Ran to hide (SPE_INVISIBILITY)
 *      Rog to find loot (SPE_DETECT_TREASURE)
 *      Sam to be At One (SPE_CLAIRVOYANCE)
 *      Tou to smile (SPE_CHARM_MONSTER)
 *      Val control the cold (SPE_CONE_OF_COLD)
 *      Wiz all really, but SPE_MAGIC_MISSILE is their party trick
 *
 *      See percent_success() below for more comments.
 *
 *  uarmbon, uarmsbon, uarmhbon, uarmgbon, uarmfbon:
 *      Fighters find body armour & shield a little less limiting.
 *      Headgear, Gauntlets and Footwear are not role-specific (but
 *      still have an effect, except helm of brilliance, which is designed
 *      to permit magic use).
 */
/* Metal helmets interfere with the mind */
/* Casting channels through the hands */
/* All metal interferes to some degree */
/* since the spellbook itself doesn't blow up, don't say just "explodes" */
const explodes = "radiates explosive energy";
/* convert a letter into a number in the range 0..51, or -1 if not a letter */
export function spell_let_to_idx(ilet) {
    let indx = 0;
    indx = ilet - 97;
    if (indx >= 0 && indx < 26) {
        return indx;
    }
    indx = ilet - 65;
    if (indx >= 0 && indx < 26) {
        return indx + 26;
    }
    return -1;
}
/* TRUE: book should be destroyed by caller */
export function cursed_book(bp) {
    let was_in_use = 0;
    let lev = game.objects[bp.otyp].oc_oc2;
    let dmg = 0;
    switch (rn2(lev)) {
        /* Prior to 3.4.1, only effect was confusion; it still predominates.
     *
     * 3.6.0: this used to override pre-existing confusion duration
     * (cases 0..8) and pre-existing stun duration (cases 4..9);
     * increase them instead.   (Hero can no longer cast spells while
     * Stunned, so the potential increment to stun duration here is
     * just hypothetical.)
     */
        case 0:
            You_feel("a wrenching sensation.");
            tele();
            break;
        case 1:
            You_feel("threatened.");
            aggravate();
            break;
        case 2:
            make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + (rn2(100) + (250)), (1));
            break;
        case 3:
            take_gold();
            break;
        case 4:
            pline("These runes were just too much to comprehend.");
            make_confused(game.u.uprops[CONFUSION].intrinsic + (rn2(7) + (16)), (0));
            break;
        case 5:
            pline_The("book was coated with contact poison!");
            if (game.uarmg) {
                erode_obj(game.uarmg, "gloves", 3, 1 | 4);
                break;
            }
            /* temp disable in_use; death should not destroy the book */
            was_in_use = bp.in_use;
            bp.in_use = (0);
            poison_strdmg((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic) ? (rn2(2) + (1)) : (rn2(4) + (3)), rnd((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic) ? 6 : 10), "contact-poisoned spellbook", 0);
            bp.in_use = was_in_use;
            break;
        case 6:
            if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                shieldeff(game.u.ux, game.u.uy);
                pline_The("book %s, but you are unharmed!", explodes);
            } else {
                pline("As you read the book, it %s in your %s!", explodes, body_part(FACE));
                dmg = 2 * rnd(10) + 5;
                losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "exploding rune", 0);
            }
            /* once had enough but have lost some since */
            return (1);
        default:
            rndcurse();
            break;
    }
    return (0);
}
/* study while confused: returns TRUE if the book is destroyed */
export function confused_book(spellbook) {
    let gone = (0);
    if (!rn2(3) && spellbook.otyp != SPE_BOOK_OF_THE_DEAD) {
        /* in case called from learn() */
        /* Books are often wiser than their readers (Rus.) */
        spellbook.in_use = (1);
        pline("Being confused you have difficulties in controlling your actions.");
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        You("accidentally tear the spellbook to pieces.");
        trycall(spellbook);
        useup(spellbook);
        gone = (1);
    } else {
        You("find yourself reading the %s line over and over again.", spellbook == game.context.spbook.book ? "next" : "first");
    }
    return gone;
}
/* pacify or tame an undead monster */
export function deadbook_pacify_undead(mtmp) {
    if (((((mtmp.data).mflags2 & 2) != 0) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) && ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
        mtmp.mpeaceful = (1);
        if (sgn(mtmp.data.maligntyp) == sgn(game.u.ualign.type) && dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) < 4) {
            if (mtmp.mtame) {
                if (mtmp.mtame < 20) {
                    mtmp.mtame++;
                }
            } else {
                tamedog(mtmp, null, (1));
            }
        } else {
            monflee(mtmp, 0, (0), (1));
        }
    }
}
/* special effects for the Book of the Dead; reading it while blind is
   allowed so that needs to be taken into account too */
export function deadbook(book2) {
    let mtmp = null;
    let mm = { x: 0, y: 0 };
    You("turn the pages of the Book of the Dead...");
    discover_object((SPE_BOOK_OF_THE_DEAD), (1), (1), (1));
    /* in case blind now and hasn't been seen yet */
    observe_object(book2);
    /* KMH -- Need ->known to avoid "_a_ Book of the Dead" */
    book2.known = 1;
    if (invocation_pos(game.u.ux, game.u.uy) && !On_stairs(game.u.ux, game.u.uy)) {
        let otmp = null;
        let arti1_primed = (0);
        let arti2_primed = (0);
        let arti_cursed = (0);
        if (book2.cursed) {
            pline_The("%s!", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "Book seems to be ignoring you" : "runes appear scrambled.  You can't read them");
            return;
        }
        if (!game.u.uhave.bell || !game.u.uhave.menorah) {
            pline("A chill runs down your %s.", body_part(SPINE));
            if (!game.u.uhave.bell) {
                ;
                You_hear("a faint chime...");
            }
            if (!game.u.uhave.menorah) {
                pline("Vlad's doppelganger is amused.");
            }
            return;
        }
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if (otmp.otyp == CANDELABRUM_OF_INVOCATION && otmp.spe == 7 && otmp.lamplit) {
                if (!otmp.cursed) {
                    arti1_primed = (1);
                } else {
                    arti_cursed = (1);
                }
            }
            if (otmp.otyp == BELL_OF_OPENING && (game.moves - otmp.age) < 5) {
                if (!otmp.cursed) {
                    arti2_primed = (1);
                } else {
                    arti_cursed = (1);
                }
            }
        }
        if (arti_cursed) {
            pline_The("invocation fails!");
            /* this used to say "your artifacts" but the invocation tools
               are not artifacts */
            pline("At least one of your relics is cursed...");
        } else if (arti1_primed && arti2_primed) {
            /* time til next intervene() */
            let soon = d(2, 6);
            mkinvokearea();
            game.u.uevent.invoked = 1;
            record_achievement(ACH_INVK);
            /* in case you haven't killed the Wizard yet, behave as if
               you just did */
            game.u.uevent.udemigod = 1;
            if (!game.u.udg_cnt || game.u.udg_cnt > soon) {
                game.u.udg_cnt = soon;
            }
        } else {
            /* at least one relic not prepared properly */
            You("have a feeling that %s is amiss...", c_common_strings.c_something);
            You("raised the dead!");
            if (!rn2(3) && ((mtmp = makemon(game.mons[PM_MASTER_LICH], game.u.ux, game.u.uy, 1)) != null || (mtmp = makemon(game.mons[PM_NALFESHNEE], game.u.ux, game.u.uy, 1)) != null)) {
                /* when not an invocation situation */
                /* first maybe place a dangerous adversary */
                mtmp.mpeaceful = 0;
                set_malign(mtmp);
            }
            /* next handle the affect on things you're carrying */
            unturn_dead(game.youmonst);
            /* last place some monsters around you */
            mm.x = game.u.ux;
            mm.y = game.u.uy;
            mkundead(mm, (1), 1);
            return;
        }
        return;
    }
    if (book2.cursed) {
        raise_dead: {
        }
        You("raised the dead!");
        if (!rn2(3) && ((mtmp = makemon(game.mons[PM_MASTER_LICH], game.u.ux, game.u.uy, 1)) != null || (mtmp = makemon(game.mons[PM_NALFESHNEE], game.u.ux, game.u.uy, 1)) != null)) {
            mtmp.mpeaceful = 0;
            set_malign(mtmp);
        }
        unturn_dead(game.youmonst);
        mm.x = game.u.ux;
        mm.y = game.u.uy;
        mkundead(mm, (1), 1);
    } else if (book2.blessed) {
        iter_mons(deadbook_pacify_undead);
    } else {
        switch (rn2(3)) {
            case 0:
                Your("ancestors are annoyed with you!");
                break;
            case 1:
                pline_The("headstones in the cemetery begin to move!");
                break;
            default:
                pline("Oh my!  Your name appears in the book!");
        }
    }
    return;
}
/* 'book' has just become cursed; if we're reading it, interrupt */
export function book_cursed(book) {
    if (book.cursed && game.multi >= 0 && game.occupation == learn && game.context.spbook.book == book) {
        pline("%s shut!", Tobjnam(book, "slam"));
        set_bknown(book, 1);
        stop_occupation();
    }
}
export function learn() {
    let i = 0;
    let booktype = 0;
    let splname = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let costly = (1);
    let faded_to_blank = (0);
    let book = game.context.spbook.book;
    /* JDS: lenses give 50% faster reading; 33% smaller read time */
    if (game.context.spbook.delay && game.ublindf && game.ublindf.otyp == LENSES && rn2(2)) {
        /* not if (svc.context.spbook.delay++), so at end delay == 0 */
        game.context.spbook.delay++;
    }
    if (game.u.uprops[CONFUSION].intrinsic) {
        /* became confused while learning */
        confused_book(book);
        /* in case reading has been interrupted earlier, discard context */
        game.context.spbook.book = null;
        game.context.spbook.o_id = 0;
        /* remaining delay is uninterrupted */
        nomul(game.context.spbook.delay);
        game.multi_reason = "reading a book";
        game.nomovemsg = null;
        game.context.spbook.delay = 0;
        return 0;
    }
    if (game.context.spbook.delay) {
        game.context.spbook.delay++;
        return 1;
    }
    exercise(A_WIS, (1));
    booktype = book.otyp;
    if (booktype == SPE_BOOK_OF_THE_DEAD) {
        deadbook(book);
        return 0;
    }
    splname = sprintf(splname, game.objects[booktype].oc_name_known ? "\"%s\"" : "the \"%s\" spell", (game.obj_descr[(game.objects[booktype]).oc_name_idx].oc_name));
    for (i = 0; i < MAXSPELL; i++) {
        if (game.spl_book[i].sp_id == booktype || game.spl_book[i].sp_id == 0) {
            break;
        }
    }
    if (i == MAXSPELL) {
        impossible("Too many spells memorized!");
    } else if (game.spl_book[i].sp_id == booktype) {
        if (book.usecount > 3) {
            /* normal book can be read and re-read a total of 4 times */
            pline("This spellbook is too faint to be read any more.");
            book.otyp = booktype = SPE_BLANK_PAPER;
            faded_to_blank = (1);
            /* reset spestudied as if polymorph had taken place */
            book.usecount = rn2(book.usecount);
        } else {
            Your("knowledge of %s is %s.", splname, game.spl_book[i].sp_know ? "keener" : "restored");
            (game.spl_book[i].sp_know = 20000 + (1));
            book.usecount++;
            exercise(A_WIS, (1));
        }
    } else {
        if (book.usecount >= 3) {
            /* (spellid(i) == NO_SPELL) */
            /* for a normal book, spestudied will be zero, but for
           a polymorphed one, spestudied will be non-zero and
           one less reading is available than when re-learning */
            /* pre-used due to being the product of polymorph */
            pline("This spellbook is too faint to read even once.");
            book.otyp = booktype = SPE_BLANK_PAPER;
            faded_to_blank = (1);
            book.usecount = rn2(book.usecount);
        } else {
            game.spl_book[i].sp_id = booktype;
            game.spl_book[i].sp_lev = game.objects[booktype].oc_oc2;
            (game.spl_book[i].sp_know = 20000 + (1));
            book.usecount++;
            if (!i) {
                You("learn %s.", splname);
            /* first is always 'a', so no need to mention the letter */
            } else {
                You("add %s to your repertoire, as '%c'.", splname, (((i < 26) ? (97 + i) : (65 + i - 26))));
            }
        }
    }
    if (i < MAXSPELL) {
        discover_object((booktype), (1), (1), (1));
        /* might be learning a new spellbook type or spellbook of blank paper;
           if so, persistent inventory will get updated */
        /* makeknown() calls update_inventory() when discovering something
           new but is a no-op for something that's already known so wouldn't
           update persistent inventory to reflect faded book if spellbook of
           blank paper happens to already be discovered */
        if (faded_to_blank) {
            /* spell may modify inventory */
            update_inventory();
        }
    }
    if (book.cursed) {
        if (cursed_book(book)) {
            useup(book);
            game.context.spbook.book = null;
            game.context.spbook.o_id = 0;
            return 0;
        }
    }
    if (costly) {
        check_unpaid(book);
    }
    game.context.spbook.book = null;
    game.context.spbook.o_id = 0;
    return 0;
}
export function study_book(spellbook) {
    let booktype = spellbook.otyp;
    let i = 0;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    let too_hard = (0);
    if (!confused && !(game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic) && objdescr_is(spellbook, "dull")) {
        /* attempting to read dull book may make hero fall asleep */
        let eyes = null;
        let dullbook = rnd(25) - (acurr(A_WIS));
        /* adjust chance if hero stayed awake, got interrupted, retries */
        if (game.context.spbook.delay && spellbook == game.context.spbook.book) {
            dullbook -= rnd(game.objects[booktype].oc_oc2);
        }
        if (dullbook > 0) {
            eyes = body_part(EYE);
            if ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) > 1) {
                eyes = makeplural(eyes);
            }
            pline("This book is so dull that you can't keep your %s open.", eyes);
            dullbook += rnd(2 * game.objects[booktype].oc_oc2);
            fall_asleep(-dullbook, (1));
            return 1;
        }
    }
    if (game.context.spbook.delay && !confused && spellbook == game.context.spbook.book && booktype != SPE_BLANK_PAPER) {
        /* handle the sequence: start reading, get interrupted, have
           svc.context.spbook.book become erased somehow, resume reading it */
        You("continue your efforts to %s.", (booktype == SPE_NOVEL) ? "read the novel" : "memorize the spell");
    } else {
        if (booktype == SPE_BLANK_PAPER) {
            /* KMH -- Simplified this code */
            pline("This spellbook is all blank.");
            discover_object((booktype), (1), (1), (1));
            return 1;
        }
        if (booktype == SPE_NOVEL) {
            /* Obtain current Terry Pratchett book title */
            let tribtitle = noveltitle({ get value() { return spellbook.corpsenm; }, set value(_v) { spellbook.corpsenm = _v; } });
            if (read_tribute("books", tribtitle, 0, null, 0, spellbook.o_id)) {
                if (!game.u.uconduct.literate++) {
                    livelog_printf(32, "became literate by reading %s", tribtitle);
                }
                check_unpaid(spellbook);
                discover_object((booktype), (1), (1), (1));
                if (!game.u.uevent.read_tribute) {
                    record_achievement(ACH_NOVL);
                    /* give bonus of 20 xp and 4*20+0 pts */
                    more_experienced(20, 0);
                    newexplevel();
                    game.u.uevent.read_tribute = 1;
                }
            }
            return 1;
        }
        switch (game.objects[booktype].oc_oc2) {
            case 1:
            case 2:
                game.context.spbook.delay = -game.objects[booktype].oc_delay;
                break;
            case 3:
            case 4:
                game.context.spbook.delay = -(game.objects[booktype].oc_oc2 - 1) * game.objects[booktype].oc_delay;
                break;
            case 5:
            case 6:
                game.context.spbook.delay = -game.objects[booktype].oc_oc2 * game.objects[booktype].oc_delay;
                break;
            case 7:
                game.context.spbook.delay = -8 * game.objects[booktype].oc_delay;
                break;
            default:
                impossible("Unknown spellbook level %d, book %d;", game.objects[booktype].oc_oc2, booktype);
                return 0;
        }
        /* check to see if we already know it and want to refresh our memory */
        for (i = 0; i < MAXSPELL; i++) {
            if (game.spl_book[i].sp_id == booktype || game.spl_book[i].sp_id == 0) {
                break;
            }
        }
        if (game.spl_book[i].sp_id == booktype && game.spl_book[i].sp_know > Math.trunc(20000 / 10)) {
            You("know \"%s\" quite well already.", (game.obj_descr[(game.objects[booktype]).oc_name_idx].oc_name));
            discover_object((booktype), (1), (1), (1));
            /* hero has just been told what spell this book is for; it may
               have been undiscovered if spell was learned via divine gift */
            if (yn_function("Refresh your memory anyway?", ynchars, 110, (1)) == 110) {
                return 0;
            }
        }
        spellbook.in_use = (1);
        if (!spellbook.blessed && spellbook.otyp != SPE_BOOK_OF_THE_DEAD) {
            if (spellbook.cursed) {
                too_hard = (1);
            } else {
                /* uncursed - chance to fail */
                let read_ability = (acurr(A_INT)) + 4 + Math.trunc(game.u.ulevel / 2) - 2 * game.objects[booktype].oc_oc2 + ((game.ublindf && game.ublindf.otyp == LENSES) ? 2 : 0);
                if ((game.urole.mnum == (PM_WIZARD)) && read_ability < 20 && !confused) {
                    /* only wizards know if a spell is too difficult */
                    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    qbuf = sprintf(qbuf, "This spellbook is %sdifficult to comprehend.  Continue?", (read_ability < 12 ? "very " : ""));
                    if (yn_function(qbuf, ynchars, 110, (1)) != 121) {
                        spellbook.in_use = (0);
                        return 1;
                    }
                }
                if (rnd(20) > read_ability) {
                    /* its up to random luck now */
                    too_hard = (1);
                }
            }
        }
        if (too_hard) {
            let gone = cursed_book(spellbook);
            nomul(game.context.spbook.delay);
            game.multi_reason = "reading a book";
            game.nomovemsg = null;
            game.context.spbook.delay = 0;
            if (gone || !rn2(3)) {
                if (!gone) {
                    pline_The("spellbook crumbles to dust!");
                }
                trycall(spellbook);
                useup(spellbook);
            } else {
                spellbook.in_use = (0);
            }
            return 1;
        } else if (confused) {
            if (!confused_book(spellbook)) {
                spellbook.in_use = (0);
            }
            nomul(game.context.spbook.delay);
            game.multi_reason = "reading a book";
            game.nomovemsg = null;
            game.context.spbook.delay = 0;
            return 1;
        }
        spellbook.in_use = (0);
        You("begin to %s the runes.", spellbook.otyp == SPE_BOOK_OF_THE_DEAD ? "recite" : "memorize");
    }
    game.context.spbook.book = spellbook;
    if (game.context.spbook.book) {
        game.context.spbook.o_id = game.context.spbook.book.o_id;
    }
    set_occupation(learn, "studying", 0);
    return 1;
}
/* a spellbook has been destroyed or the character has changed levels;
   the stored address for the current book is no longer valid */
export function book_disappears(obj) {
    if (obj == game.context.spbook.book) {
        game.context.spbook.book = null;
        game.context.spbook.o_id = 0;
    }
}
/* renaming an object usually results in it having a different address;
   so the sequence start reading, get interrupted, name the book, resume
   reading would read the "new" book from scratch */
export function book_substitution(old_obj, new_obj) {
    if (old_obj == game.context.spbook.book) {
        game.context.spbook.book = new_obj;
        if (game.context.spbook.book) {
            game.context.spbook.o_id = game.context.spbook.book.o_id;
        }
    }
}
/* called from moveloop() */
export function age_spells() {
    let i = 0;
    /*
     * The time relative to the hero (a pass through move
     * loop) causes all spell knowledge to be decremented.
     * The hero's speed, rest status, conscious status etc.
     * does not alter the loss of memory.
     */
    for (i = 0; i < MAXSPELL && game.spl_book[i].sp_id != 0; i++) {
        if (game.spl_book[i].sp_know) {
            game.spl_book[i].sp_know--;
        }
    }
    return;
}
/* return True if spellcasting is inhibited;
   only covers a small subset of reasons why casting won't work */
export function rejectcasting() {
    if (game.u.uprops[STUNNED].intrinsic) {
        /* rejections which take place before selecting a particular spell */
        You("are too impaired to cast a spell.");
        return (1);
    } else if (!can_chant(game.youmonst)) {
        You("are unable to chant the incantation.");
        return (1);
    } else if (!freehand() && !(game.uwep && game.uwep.otyp == QUARTERSTAFF)) {
        /* Note: !freehand() occurs when weapon and shield (or two-handed
         * weapon) are welded to hands, so "arms" probably doesn't need
         * to be makeplural(bodypart(ARM)).
         *
         * But why isn't lack of free arms (for gesturing) an issue when
         * poly'd hero has no limbs?
         */
        Your("arms are not free to cast!");
        return (1);
    }
    return (0);
}
/*
 * Return TRUE if a spell was picked, with the spell index in the return
 * parameter.  Otherwise return FALSE.
 */
export function getspell(spell_no) {
    let nspells = 0;
    let idx = 0;
    let retry_limit = 0;
    let ilet = 0;
    let lets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let cq = { typ: 0, key: 0, dirx: 0, diry: 0, dirz: 0, intval: 0, ec_entry: null, next: null };
    let cmdq = null;
    nspells = num_spells();
    if (!nspells) {
        You("don't know any spells right now.");
        return (0);
    }
    if (rejectcasting()) {
        return (0);
    }
    if ((cmdq = cmdq_pop()) != null) {
        Object.assign(cq, cmdq);
        free(cmdq);
        if (cq.typ == CMDQ_KEY) {
            idx = spell_let_to_idx(cq.key);
            if (idx < 0 || idx >= nspells) {
                return (0);
            }
            spell_no.value = idx;
            return (1);
        } else {
            return (0);
        }
    }
    if (game.flags.menu_style == 0) {
        /* if we get here, we know there is at least 1 known spell */
        if (nspells == 1) {
            lets = strcpy(lets, "a");
        } else if (nspells < 27) {
            lets = sprintf(lets, "a-%c", 97 + nspells - 1);
        } else if (nspells == 27) {
            lets = strcpy(lets, "a-zA");
        } else {
            lets = sprintf(lets, "a-zA-%c", 65 + nspells - 27);
        }
        nh_snprintf("getspell", 755, qbuf, 128 /* sizeof(char [128]) */, "Cast which spell? [%s *?]", lets);
        for (retry_limit = 0; ; ++retry_limit) {
            if (retry_limit == 10) {
                /* this assumes that there are at most 52 spells... */
                /* limit is mainly to prevent the fuzzer from getting stuck
                   since hangup should hit the 'quitchars' case; fuzzer
                   would too, but after an arbitrary number of attempts */
                pline("That's enough tries.");
                return (0);
            }
            ilet = yn_function(qbuf, null, 0, (1));
            if (ilet == 42 || ilet == 63) {
                break;
            }
            if (strchr(quitchars, ilet)) {
                pline("%s", c_common_strings.c_Never_mind);
                return (0);
            }
            idx = spell_let_to_idx(ilet);
            if (idx < 0 || idx >= nspells) {
                You("don't know that spell.");
                continue;
            }
            spell_no.value = idx;
            return (1);
        }
    }
    return dospellmenu("Choose which spell to cast", (-2), spell_no);
}
/* #wizcast - cast any spell even without knowing it */
export function dowizcast() {
    let win = 0;
    let selected = null;
    let any = 0;
    let i = 0;
    let n = 0;
    win = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(win, 0);
    any = cg.zeroany;
    for (i = 0; i < MAXSPELL; i++) {
        n = (SPE_DIG + i);
        if (n >= SPE_BLANK_PAPER) {
            break;
        }
        any.a_int = n;
        add_menu(win, nul_glyphinfo, any, 0, 0, 0, 8, (game.obj_descr[(game.objects[n]).oc_name_idx].oc_name), 0);
    }
    (game.windowprocs.win_end_menu)(win, "Cast which spell?");
    n = select_menu(win, 1, selected);
    (game.windowprocs.win_destroy_nhwindow)(win);
    if (n > 0) {
        i = selected[0].item.a_int;
        free(selected);
        return spelleffects(i, (0), (1));
    }
    return 0;
}
/* the #cast command -- cast a spell */
export function docast() {
    let spell_no = 0;
    if (getspell({ get value() { return spell_no; }, set value(_v) { spell_no = _v; } })) {
        cmdq_add_key(CQ_REPEAT, (((spell_no < 26) ? (97 + spell_no) : (65 + spell_no - 26))));
        return spelleffects(game.spl_book[spell_no].sp_id, (0), (0));
    }
    return 4;
}
export function spelltypemnemonic(skill) {
    switch (skill) {
        case P_ATTACK_SPELL:
            return "attack";
        case P_HEALING_SPELL:
            return "healing";
        case P_DIVINATION_SPELL:
            return "divination";
        case P_ENCHANTMENT_SPELL:
            return "enchantment";
        case P_CLERIC_SPELL:
            return "clerical";
        case P_ESCAPE_SPELL:
            return "escape";
        case P_MATTER_SPELL:
            return "matter";
        default:
            impossible("Unknown spell skill, %d;", skill);
            return "";
    }
}
export function spell_skilltype(booktype) {
    return game.objects[booktype].oc_subtyp;
}
/* Wizards learn what spellbooks look like based on their skill in the
   spell's school */
export function skill_based_spellbook_id() {
    if (!(game.urole.mnum == (PM_WIZARD))) {
        return;
    }
    let booktype = 0;
    let spbook_class = SPBOOK_CLASS;
    for (booktype = game.bases[spbook_class]; booktype < game.bases[spbook_class + 1]; booktype++) {
        let known_up_to_level = 0;
        let skill = spell_skilltype(booktype);
        if (skill == P_NONE) {
            continue;
        }
        switch ((game.u.weapon_skills[skill].skill)) {
            case P_BASIC:
                known_up_to_level = 3;
                break;
            case P_SKILLED:
                known_up_to_level = 5;
                break;
            case P_EXPERT:
            case P_MASTER:
            case P_GRAND_MASTER:
                known_up_to_level = 7;
                break;
            case P_UNSKILLED:
            default:
                known_up_to_level = game.u.uroleplay.pauper ? 0 : 1;
                break;
        }
        if (game.objects[booktype].oc_oc2 <= known_up_to_level) {
            discover_object(booktype, (1), (0), (0));
        }
    }
}
/* Limit the total area chain lightning can cover; this is both for
   technical reasons (making it possible to limit the size of arrays
   here and in the display code) and for gameplay balance reasons;
   this value should be smaller than TMP_AT_MAX_GLYPHS (display.c) in
   order for chain lightning to display properly */
/* Unlike most zaps, chain lightning can't hit solid terrain (it
   doesn't have enough power), it only covers open space; this also
   means that it can't hit monsters inside walls, which makes sense as
   they would be earthed */
/* not WATER */
/* not LAVAWALL */
// struct chain_lightning_zap: { dir, x, y, strength }
/* direction in which this zap is currently moving; this is an
       enum movementdirs, clamped to the range 0 inclusive to N_DIRS
       exclusive */
/* current location of the zap */
/* distance this zap can cover without chaining */
// struct chain_lightning_queue: { q, head, tail, displayed_beam }
/* Given a potential chain lightning zap, moves it one square forward in
   the given direction, then adds it to the queue unless it would hit an
   invalid square or is out of power.

   zap is passed by value, so the move-forward doesn't change the passed
   argument. */
export function propagate_chain_lightning(clq, zap) {
    let mon = null;
    zap.x += xdir[zap.dir];
    zap.y += ydir[zap.dir];
    if (clq.tail >= 100) {
        return;
    }
    /* zap has covered too many squares */
    if (!(isok(zap.x, zap.y) && ((((game.level.locations[zap.x][zap.y].typ) > DOOR) || (game.level.locations[zap.x][zap.y].typ) == POOL || (game.level.locations[zap.x][zap.y].typ) == MOAT || (game.level.locations[zap.x][zap.y].typ) == DRAWBRIDGE_UP || (game.level.locations[zap.x][zap.y].typ) == LAVAPOOL) || (((game.level.locations[zap.x][zap.y].typ) == DOOR) && !(game.level.locations[zap.x][zap.y].flags & (4 | 8)))))) {
        return;
    }
    /* zap can't go to this square */
    mon = (game.level.monsters[zap.x][zap.y]);
    if (mon && mon.mpeaceful) {
        return;
    }
    /* chain lightning avoids peaceful and tame monsters */
    /* When hitting a monster that isn't electricity-resistant, a
       particular chain lightning zap regains all its power, allowing it to
       chain to other monsters; upon hitting a shock-resistant monster it
       can't continue any further, but we let it hit the monster to show
       the shield effect */
    if (mon && !Resists_Elem(mon, SHOCK_RES) && !defended(mon, 6)) {
        zap.strength = 3;
    } else if (mon) {
        zap.strength = 0;
    }
    /* Unless it hits a monster, the last square of a zap isn't drawn on
       screen and can't propagate further, so it may as well be discarded
       now */
    if (!mon && !zap.strength) {
        return;
    }
    for (let i = 0; i < clq.tail; i++) {
        /* The same square can't be chained to twice. */
        if (clq.q[i].x == zap.x && clq.q[i].y == zap.y) {
            return;
        }
    }
    /* This array access must be inbounds due to the CHAIN_LIGHTNING_LIMIT
       check earlier. */
    Object.assign(clq.q[clq.tail++], zap);
    tmp_at((-6), zapdir_to_glyph(xdir[zap.dir], ydir[zap.dir], clq.displayed_beam));
    tmp_at(zap.x, zap.y);
}
export function cast_chain_lightning() {
    let clq = { q: [{ dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }, { dir: 0, x: 0, y: 0, strength: 0 }], head: 0, tail: 0, displayed_beam: (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? rn2_on_display_rng(6) : (6 - 1) };
    if (game.u.uswallow) {
        return;
    }
    /* set the type of beam we're using; the direction here is arbitrary
       because we change the beam direction just before drawing the beam
       anyway */
    tmp_at((-1), zapdir_to_glyph(0, 1, clq.displayed_beam));
    for (let dir = 0; dir < (N_DIRS_Z - 2); dir++) {
        /* start by propagating in all directions from the caster */
        let zap = { dir: dir, x: game.u.ux, y: game.u.uy, strength: 2 };
        propagate_chain_lightning(clq, zap);
    }
    (game.windowprocs.win_delay_output)();
    while (clq.head < clq.tail) {
        let delay_tail = clq.tail;
        while (clq.head < delay_tail) {
            let zap = clq.q[clq.head++];
            /* damage any monster that was hit */
            let mon = (game.level.monsters[zap.x][zap.y]);
            if (mon) {
                /* AD_ELEC can't destroy armor */
                let unused = null;
                let dmg = 0;
                game.notonhead = (mon.mx != game.bhitpos.x || mon.my != game.bhitpos.y);
                dmg = zhitm(mon, (10 + (6 - 1)), 2, { get value() { return unused; }, set value(_v) { unused = _v; } });
                if (dmg) {
                    if (((mon).mhp < 1)) {
                        /* mon has been damaged, but we haven't yet printed the
                       messages or given kill credit; assume the hero can
                       sense their spell hitting monsters, because they can
                       steer it away from peacefuls */
                        xkilled(mon, 0);
                    } else {
                        pline("You shock %s%s", mon_nam(mon), exclam(dmg));
                        /* if a long worm, only map 'I' for its head */
                        if (!canseemon(mon) && !game.notonhead) {
                            map_invisible(zap.x, zap.y);
                        }
                    }
                } else if (canseemon(mon)) {
                    pline("%s resists.", Monnam(mon));
                }
                if (!((mon).mhp < 1)) {
                    /* wakeup is via attack, but since mon is already
                       hostile we pass via_attack==False rather than True,
                       otherwise other monsters witnessing this would treat
                       it as seeing hero attack a peaceful; mimic will be
                       exposed; forcefight makes hider unhide */
                    game.context.forcefight++;
                    wakeup(mon, (0));
                    game.context.forcefight--;
                }
            }
            /* each zap propagates forwards with 1 less strength, and
               diagonally with 0 strength (thus the diagonal zaps aren't
               drawn and don't spread unless they hit a monster);
               exception: if the zap just hit a monster, the diagonals have
               as much strength as the forwards zap */
            if (!zap.strength) {
                continue;
            }
            /* happens upon hitting a shock-resistant monster */
            zap.strength--;
            propagate_chain_lightning(clq, zap);
            if (zap.strength < 2) {
                zap.strength = 0;
            } else if (game.u.uen > 0) {
                game.u.uen--;
            }
            /* propagating past mons increases Pw cost a bit */
            zap.dir = (((zap.dir) + 7) % (N_DIRS_Z - 2));
            propagate_chain_lightning(clq, zap);
            zap.dir = (((zap.dir) + 2) % (N_DIRS_Z - 2));
            propagate_chain_lightning(clq, zap);
        }
        (game.windowprocs.win_delay_output)();
    }
    (game.windowprocs.win_delay_output)();
    (game.windowprocs.win_delay_output)();
    tmp_at((-7), 0);
}
export function cast_protection() {
    let l = game.u.ulevel;
    let loglev = 0;
    let gain = 0;
    let natac = game.u.uac + game.u.uspellprot;
    while (l) {
        /* note: u.uspellprot is subtracted when find_ac() factors it into u.uac,
       so adding here factors it back out
       (versions prior to 3.6 had this backwards) */
        /* loglev=log2(u.ulevel)+1 (1..5) */
        loglev++;
        l = Math.trunc(l / 2);
    }
    /* The more u.uspellprot you already have, the less you get,
     * and the better your natural ac, the less you get.
     *
     *  LEVEL AC    SPELLPROT from successive SPE_PROTECTION casts
     *      1     10    0,  1,  2,  3,  4
     *      1      0    0,  1,  2,  3
     *      1    -10    0,  1,  2
     *      2-3   10    0,  2,  4,  5,  6,  7,  8
     *      2-3    0    0,  2,  4,  5,  6
     *      2-3  -10    0,  2,  3,  4
     *      4-7   10    0,  3,  6,  8,  9, 10, 11, 12
     *      4-7    0    0,  3,  5,  7,  8,  9
     *      4-7  -10    0,  3,  5,  6
     *      7-15 -10    0,  3,  5,  6
     *      8-15  10    0,  4,  7, 10, 12, 13, 14, 15, 16
     *      8-15   0    0,  4,  7,  9, 10, 11, 12
     *      8-15 -10    0,  4,  6,  7,  8
     *     16-30  10    0,  5,  9, 12, 14, 16, 17, 18, 19, 20
     *     16-30   0    0,  5,  9, 11, 13, 14, 15
     *     16-30 -10    0,  5,  8,  9, 10
     */
    /* convert to positive and scale down */
    natac = Math.trunc((10 - natac) / 10);
    gain = loglev - Math.trunc(game.u.uspellprot / (4 - ((3) < (natac) ? (3) : (natac))));
    if (gain > 0) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            let rmtyp = 0;
            let hgolden = hcolor(c_color_names.c_golden);
            let atmosphere = null;
            if (game.u.uspellprot) {
                pline_The("%s haze around you becomes more dense.", hgolden);
            } else {
                let pm = game.u.ustuck ? game.u.ustuck.data : null;
                rmtyp = game.level.locations[game.u.ux][game.u.uy].typ;
                atmosphere = (pm && game.u.uswallow) ? ((pm == game.mons[PM_FOG_CLOUD]) ? "mist" : ((pm).mlet == S_VORTEX || (pm) == game.mons[PM_AIR_ELEMENTAL]) ? "maelstrom" : (dmgtype_fromattack((pm), 28, 11) != null) ? "folds" : (((pm).mflags1 & 262144) != 0) ? "maw" : "ooze") : (game.u.uinwater ? hliquid("water") : (rmtyp == CLOUD) ? "cloud" : ((rmtyp) == TREE || (game.level.flags.arboreal && (rmtyp) == STONE)) ? "vegetation" : ((rmtyp) <= DBWALL) ? "stone" : "air");
                pline_The("%s around you begins to shimmer with %s haze.", atmosphere, an(hgolden));
            }
        }
        game.u.uspellprot += gain;
        game.u.uspmtime = ((game.u.weapon_skills[spell_skilltype(SPE_PROTECTION)].skill) == P_EXPERT) ? 20 : 10;
        if (!game.u.usptime) {
            game.u.usptime = game.u.uspmtime;
        }
        find_ac();
    } else {
        Your("skin feels warm for a moment.");
    }
}
/* attempting to cast a forgotten spell will cause disorientation */
export function spell_backfire(spell) {
    let duration = ((game.spl_book[spell].sp_lev + 1) * 3);
    let old_stun = (game.u.uprops[STUNNED].intrinsic & 16777215);
    let old_conf = (game.u.uprops[CONFUSION].intrinsic & 16777215);
    switch (rn2(10)) {
        case 0:
        case 1:
        case 2:
        case 3:
            make_confused(old_conf + duration, (0));
            break;
        case 4:
        case 5:
        case 6:
            make_confused(old_conf + Math.trunc(2 * duration / 3), (0));
            make_stunned(old_stun + Math.trunc(duration / 3), (0));
            break;
        case 7:
        case 8:
            make_stunned(old_stun + Math.trunc(2 * duration / 3), (0));
            make_confused(old_conf + Math.trunc(duration / 3), (0));
            break;
        case 9:
            make_stunned(old_stun + duration, (0));
            break;
    }
    return;
}
export function spelleffects_check(spell, res, energy) {
    let chance = 0;
    let confused = (game.u.uprops[CONFUSION].intrinsic != 0);
    energy.value = 0;
    if ((spell == (-1)) || rejectcasting()) {
        /*
     * Reject attempting to cast while stunned or with no free hands.
     * Already done in getspell() to stop casting before choosing
     * which spell, but duplicated here for cases where spelleffects()
     * gets called directly for ^T without intrinsic teleport capability
     * or #turn for non-priest/non-knight.
     * (There's no duplication of messages; when the rejection takes
     * place in getspell(), we don't get called.)
     */
        res.value = 0;
        return (1);
    }
    /*
     *  Note: dotele() also calculates energy use and checks nutrition
     *  and strength requirements; if any of these change, update it too.
     */
    energy.value = ((game.spl_book[spell].sp_lev) * 5);
    if (game.spl_book[spell].sp_know <= 0) {
        /*
     * Spell casting no longer affects knowledge of the spell. A
     * decrement of spell knowledge is done every turn.
     */
        Your("knowledge of this spell is twisted.");
        pline("It invokes nightmarish images in your mind...");
        spell_backfire(spell);
        game.u.uen -= rnd(energy.value);
        if (game.u.uen < 0) {
            game.u.uen = 0;
        }
        game.disp.botl = (1);
        /* time is used even if spell doesn't get cast */
        res.value = 1;
        return (1);
    } else if (game.spl_book[spell].sp_know <= Math.trunc(20000 / 200)) {
        You("strain to recall the spell.");
    } else if (game.spl_book[spell].sp_know <= Math.trunc(20000 / 40)) {
        You("have difficulty remembering the spell.");
    } else if (game.spl_book[spell].sp_know <= Math.trunc(20000 / 20)) {
        Your("knowledge of this spell is growing faint.");
    } else if (game.spl_book[spell].sp_know <= Math.trunc(20000 / 10)) {
        Your("recall of this spell is gradually fading.");
    }
    if (game.u.uhunger <= 10 && game.spl_book[spell].sp_id != SPE_DETECT_FOOD) {
        You("are too hungry to cast that spell.");
        res.value = 0;
        return (1);
    } else if ((acurr(A_STR)) < 4 && game.spl_book[spell].sp_id != SPE_RESTORE_ABILITY) {
        You("lack the strength to cast spells.");
        res.value = 0;
        return (1);
    } else if (check_capacity("Your concentration falters while carrying so much stuff.")) {
        res.value = 1;
        return (1);
    }
    if (game.u.uhave.amulet && game.u.uen >= energy.value) {
        /* if the cast attempt is already going to fail due to insufficient
       energy (ie, u.uen < energy), the Amulet's drain effect won't kick
       in and no turn will be consumed; however, when it does kick in,
       the attempt may fail due to lack of energy after the draining, in
       which case a turn will be used up in addition to the energy loss */
        You_feel("the amulet draining your energy away.");
        /* this used to be 'energy += rnd(2 * energy)' (without 'res'),
           so if amulet-induced cost was more than u.uen, nothing
           (except the "don't have enough energy" message) happened
           and player could just try again (and again and again...);
           now we drain some energy immediately, which has a
           side-effect of not increasing the hunger aspect of casting */
        game.u.uen -= rnd(2 * energy.value);
        if (game.u.uen < 0) {
            game.u.uen = 0;
        }
        game.disp.botl = (1);
        res.value = 1;
    }
    if (energy.value > game.u.uen) {
        /*
         * Hero has insufficient energy/power to cast the spell.
         * Augment the message when current energy is at maximum.
         * "yet": mainly for level 1 characters who already know a spell
         * but don't start with enough energy to cast it.
         * "anymore": maximum energy was high enough at some point but
         * isn't now (lost energy when losing levels or polymorphing into
         * new person or had some stripped away by traps or monsters).
         */
        You("don't have enough energy to cast that spell%s.", (game.u.uen < game.u.uenmax) ? "" : (energy.value > game.u.uenpeak) ? " yet" : " anymore");
        return (1);
    } else {
        if (game.spl_book[spell].sp_id != SPE_DETECT_FOOD) {
            /* not at full energy => normal message */
            let hungr = energy.value * 2;
            /* If hero is a wizard, their current intelligence
             * (bonuses + temporary + current)
             * affects hunger reduction in casting a spell.
             * 1. int = 17-18 no reduction
             * 2. int = 16    1/4 hungr
             * 3. int = 15    1/2 hungr
             * 4. int = 1-14  normal reduction
             * The reason for this is:
             * a) Intelligence affects the amount of exertion
             * in thinking.
             * b) Wizards have spent their life at magic and
             * understand quite well how to cast spells.
             */
            let intell = acurr(A_INT);
            if (!(game.urole.mnum == (PM_WIZARD))) {
                intell = 10;
            }
            switch (intell) {
                case 25:
                case 24:
                case 23:
                case 22:
                case 21:
                case 20:
                case 19:
                case 18:
                case 17:
                    hungr = 0;
                    break;
                case 16:
                    hungr = Math.trunc(hungr / 4);
                    break;
                case 15:
                    hungr = Math.trunc(hungr / 2);
                    break;
            }
            /* don't put player (quite) into fainting from
             * casting a spell, particularly since they might
             * not even be hungry at the beginning; however,
             * this is low enough that they must eat before
             * casting anything else except detect food
             */
            if (hungr > game.u.uhunger - 3) {
                hungr = game.u.uhunger - 3;
            }
            morehungry(hungr);
        }
    }
    chance = percent_success(spell);
    if (confused || (rnd(100) > chance)) {
        You("fail to cast the spell correctly.");
        game.u.uen -= Math.trunc(energy.value / 2);
        game.disp.botl = (1);
        res.value = 1;
        return (1);
    }
    return (0);
}
/* hero casts a spell of type spell_otyp, eg. SPE_SLEEP.
   hero must know the spell (unless force is TRUE). */
export function spelleffects(spell_otyp, atme, force) {
    let spell = force ? spell_otyp : spell_idx(spell_otyp);
    let energy = 0;
    let damage = 0;
    let n = 0;
    let otyp = 0;
    let skill = 0;
    let role_skill = 0;
    let res = 0;
    let physical_damage = (0);
    let pseudo = null;
    let cc = { x: 0, y: 0 };
    if (!force && spelleffects_check(spell, { get value() { return res; }, set value(_v) { res = _v; } }, { get value() { return energy; }, set value(_v) { energy = _v; } })) {
        return res;
    }
    game.u.uen -= energy;
    game.disp.botl = (1);
    exercise(A_WIS, (1));
    /* pseudo is a temporary "false" object containing the spell stats */
    pseudo = mksobj(force ? spell : game.spl_book[spell].sp_id, (0), (0));
    pseudo.blessed = pseudo.cursed = 0;
    pseudo.quan = 20;
    /*
     * Find the skill the hero has in a spell type category.
     * See spell_skilltype for categories.
     */
    otyp = pseudo.otyp;
    skill = spell_skilltype(otyp);
    role_skill = (game.u.weapon_skills[skill].skill);
    switch (otyp) {
        case SPE_FIREBALL:
        case SPE_CONE_OF_COLD:
            if (role_skill >= P_SKILLED) {
                if (throwspell()) {
                    /*
     * At first spells act as expected.  As the hero increases in skill
     * with the appropriate spell type, some spells increase in their
     * effects, e.g. more damage, further distance, and so on, without
     * additional cost to the spellcaster.
     */
                    cc.x = game.u.dx;
                    cc.y = game.u.dy;
                    n = rnd(8) + 1;
                    while (n--) {
                        if (!game.u.dx && !game.u.dy && !game.u.dz) {
                            if ((damage = zapyourself(pseudo, (1))) != 0) {
                                let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                                buf = sprintf(buf, "zapped %sself with a spell", (genders[game.flags.female ? 1 : 0].him));
                                losehp(damage, buf, 2);
                            }
                        } else {
                            explode(game.u.dx, game.u.dy, otyp - SPE_MAGIC_MISSILE + 10, spell_damage_bonus(Math.trunc(game.u.ulevel / 2) + 1), 0, (otyp == SPE_CONE_OF_COLD) ? EXPL_FROSTY : EXPL_FIERY);
                        }
                        game.u.dx = cc.x + rnd(3) - 2;
                        game.u.dy = cc.y + rnd(3) - 2;
                        if (!isok(game.u.dx, game.u.dy) || !((game.viz_array[game.u.dy][game.u.dx] & 2) != 0) || ((game.level.locations[game.u.dx][game.u.dy].typ) <= DBWALL) || game.u.uswallow) {
                            /* Spell is reflected back to center */
                            game.u.dx = cc.x;
                            game.u.dy = cc.y;
                        }
                    }
                }
                break;
            }
            ;
        /* these spells are all duplicates of wand effects */
        case SPE_FORCE_BOLT:
            physical_damage = (1);
            ;
        case SPE_SLEEP:
        case SPE_MAGIC_MISSILE:
        case SPE_KNOCK:
        case SPE_SLOW_MONSTER:
        case SPE_WIZARD_LOCK:
        case SPE_DIG:
        case SPE_TURN_UNDEAD:
        case SPE_POLYMORPH:
        case SPE_TELEPORT_AWAY:
        case SPE_CANCELLATION:
        case SPE_FINGER_OF_DEATH:
        case SPE_LIGHT:
        case SPE_DETECT_UNSEEN:
        case SPE_HEALING:
        case SPE_EXTRA_HEALING:
        case SPE_DRAIN_LIFE:
        case SPE_STONE_TO_FLESH:
            if (game.objects[otyp].oc_dir != 1) {
                if (otyp == SPE_HEALING || otyp == SPE_EXTRA_HEALING) {
                    /* healing and extra healing are actually potion effects,
                   but they've been extended to take a direction like wands */
                    if (role_skill >= P_SKILLED) {
                        pseudo.blessed = 1;
                    }
                }
                if (atme) {
                    game.u.dx = game.u.dy = game.u.dz = 0;
                } else if (!getdir(null)) {
                    /* getdir cancelled, re-use previous direction */
                    /*
                 * FIXME:  reusing previous direction only makes sense
                 * if there is an actual previous direction.  When there
                 * isn't one, the spell gets cast at self which is rarely
                 * what the player intended.  Unfortunately, the way
                 * spelleffects() is organized means that aborting with
                 * "nevermind" is not an option.
                 */
                    pline_The("magical energy is released!");
                }
                if (!game.u.dx && !game.u.dy && !game.u.dz) {
                    if ((damage = zapyourself(pseudo, (1))) != 0) {
                        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        buf = sprintf(buf, "zapped %sself with a spell", (genders[game.flags.female ? 1 : 0].him));
                        if (physical_damage) {
                            damage = (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((damage) + 1) / 2)) : (damage));
                        }
                        losehp(damage, buf, 2);
                    }
                } else {
                    weffects(pseudo);
                }
            } else {
                weffects(pseudo);
            }
            update_inventory();
            break;
        /* these are all duplicates of scroll effects */
        case SPE_REMOVE_CURSE:
        case SPE_CONFUSE_MONSTER:
        case SPE_DETECT_FOOD:
        case SPE_CAUSE_FEAR:
        case SPE_IDENTIFY:
        case SPE_CHARM_MONSTER:
            if (role_skill >= P_SKILLED) {
                pseudo.blessed = 1;
            }
            ;
        case SPE_MAGIC_MAPPING:
        case SPE_CREATE_MONSTER:
            seffects(pseudo);
            break;
        /* these are all duplicates of potion effects */
        case SPE_HASTE_SELF:
        case SPE_DETECT_TREASURE:
        case SPE_DETECT_MONSTERS:
        case SPE_LEVITATION:
        case SPE_RESTORE_ABILITY:
            if (role_skill >= P_SKILLED) {
                pseudo.blessed = 1;
            }
            ;
        case SPE_INVISIBILITY:
            peffects(pseudo);
            break;
        /* end of potion-like spells */
        case SPE_CURE_BLINDNESS:
            healup(0, 0, (0), (1));
            break;
        case SPE_CURE_SICKNESS:
{
                /* high skill yields effect equivalent to blessed scroll */
                /* high skill yields effect equivalent to blessed potion */
                let was_sick = !!game.u.uprops[SICK].intrinsic;
                let was_slimed = !!game.u.uprops[SLIMED].intrinsic;
                /* cure conditions (which updates status) before feedback */
                healup(0, 0, (1), (0));
                /*
         *  Sick + !Slimed -- You are no longer ill.
         * !Sick + !Slimed -- You are not ill.
         * !Sick +  Slimed -- The slime disappears.
         *  Sick +  Slimed -- You are no longer ill.  The slime disappears.
         */
                if (was_sick || !was_slimed) {
                    You("are %s ill.", was_sick ? "no longer" : "not");
                }
                if (was_slimed) {
                    make_slimed(0, "The slime disappears!");
                }
                break;
            }
        case SPE_CREATE_FAMILIAR:
            make_familiar(null, game.u.ux, game.u.uy, (0));
            break;
        case SPE_CLAIRVOYANCE:
            if (!game.u.uprops[CLAIRVOYANT].blocked) {
                if (role_skill >= P_SKILLED) {
                    pseudo.blessed = 1;
                }
                /* detect monsters as well as map */
                /* at present, only one thing blocks clairvoyance */
                do_vicinity_map(pseudo);
            } else if (game.uarmh && game.uarmh.otyp == CORNUTHAUM) {
                You("sense a pointy hat on top of your %s.", body_part(HEAD));
            }
            break;
        case SPE_PROTECTION:
            cast_protection();
            break;
        case SPE_JUMPING:
            if (!(jump(((role_skill) > (1) ? (role_skill) : (1))) & 1)) {
                pline("%s", c_common_strings.c_nothing_happens);
            }
            break;
        case SPE_CHAIN_LIGHTNING:
            cast_chain_lightning();
            break;
        default:
            impossible("Unknown spell %d attempted.", spell);
            obfree(pseudo, null);
            return 0;
    }
    /* gain skill for successful cast */
    if (!force) {
        use_skill(skill, game.spl_book[spell].sp_lev);
    }
    obfree(pseudo, null);
    return 1;
}
/*ARGSUSED*/
export function spell_aim_step(arg, x, y) {
    if (!isok(x, y)) {
        return (0);
    }
    if (!((game.level.locations[x][y].typ) >= POOL) && !(((game.level.locations[x][y].typ) == DOOR) && (game.level.locations[x][y].flags & 2))) {
        return (0);
    }
    return (1);
}
/* not quite the same as throwspell limits, but close enough */
export function can_center_spell_location(x, y) {
    if (distmin(game.u.ux, game.u.uy, x, y) > 10) {
        return (0);
    }
    return (isok(x, y) && ((game.viz_array[y][x] & 2) != 0) && !(((game.level.locations[x][y].typ) <= DBWALL)));
}
export function display_spell_target_positions(on_off) {
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    let dist = 10;
    if (on_off) {
        tmp_at((-1), (((S_goodpos) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_goodpos) <= S_trwall) ? ((S_goodpos) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_goodpos) < S_altar) ? (((S_goodpos) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_goodpos) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_goodpos) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_goodpos) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_goodpos) <= S_goodpos) ? (((S_goodpos) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH));
        for (dx = -dist; dx <= dist; dx++) {
            for (dy = -dist; dy <= dist; dy++) {
                x = game.u.ux + dx;
                y = game.u.uy + dy;
                /* hero's location is allowed but highlighting the hero's
                   spot makes map harder to read (if using '$' rather than
                   by changing background color) */
                if (((x) == game.u.ux && (y) == game.u.uy)) {
                    continue;
                }
                if (can_center_spell_location(x, y)) {
                    tmp_at(x, y);
                }
            }
        }
    } else {
        tmp_at((-7), 0);
    }
}
/* Choose location where spell takes effect. */
export function throwspell() {
    let cc = { x: 0, y: 0 };
    let uc = { x: 0, y: 0 };
    let mtmp = null;
    if (game.u.uinwater) {
        pline("You're joking!  In this weather?");
        return 0;
    } else if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
        You("had better wait for the sun to come out.");
        return 0;
    }
    pline("Where do you want to cast the spell?");
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    getpos_sethilite(display_spell_target_positions, can_center_spell_location);
    if (getpos(cc, (1), "the desired position") < 0) {
        return 0;
    }
    (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
    if (distmin(game.u.ux, game.u.uy, cc.x, cc.y) > 10) {
        /* discard any autodescribe feedback */
        /* The number of moves from hero to where the spell drops.*/
        pline_The("spell dissipates over the distance!");
        return 0;
    } else if (game.u.uswallow) {
        pline_The("spell is cut short!");
        exercise(A_WIS, (0));
        game.u.dx = 0;
        game.u.dy = 0;
        return 1;
    } else if (((cc.x != game.u.ux || cc.y != game.u.uy) && !((game.viz_array[cc.y][cc.x] & 2) != 0) && (!(mtmp = (game.level.monsters[cc.x][cc.y])) || !(canseemon(mtmp) || sensemon(mtmp)))) || ((game.level.locations[cc.x][cc.y].typ) <= DBWALL)) {
        Your("mind fails to lock onto that location!");
        return 0;
    }
    uc.x = game.u.ux;
    uc.y = game.u.uy;
    walk_path(uc, cc, spell_aim_step, null);
    game.u.dx = cc.x;
    game.u.dy = cc.y;
    return 1;
}
/* add/hide/remove/unhide teleport-away on behalf of dotelecmd() to give
   more control to behavior of ^T when used in wizard mode */
let __tport_spell_save_tport = { savespell: { sp_id: 0, sp_lev: 0, sp_know: 0 }, tport_indx: 0 };
export function tport_spell(what) {
    let i = 0;
    /* also defined in teleport.c */
    for (i = 0; i < MAXSPELL; i++) {
        if (game.spl_book[i].sp_id == SPE_TELEPORT_AWAY || game.spl_book[i].sp_id == 0) {
            break;
        }
    }
    if (i == MAXSPELL) {
        /* wizard mode ^T is not able to honor player's menu choice */
        impossible("tport_spell: spellbook full");
    } else if (game.spl_book[i].sp_id == 0) {
        if (what == 1 || what == 4) {
            /* spellid(i) == SPE_TELEPORT_AWAY */
            __tport_spell_save_tport.tport_indx = MAXSPELL;
        } else if (what == 3) {
            /*assert( save_tport.savespell.sp_id == SPE_TELEPORT_AWAY );*/
            Object.assign(game.spl_book[__tport_spell_save_tport.tport_indx], __tport_spell_save_tport.savespell);
            __tport_spell_save_tport.tport_indx = MAXSPELL;
        } else if (what == 2) {
            __tport_spell_save_tport.savespell = game.spl_book[i];
            __tport_spell_save_tport.tport_indx = i;
            game.spl_book[i].sp_id = SPE_TELEPORT_AWAY;
            game.spl_book[i].sp_lev = game.objects[SPE_TELEPORT_AWAY].oc_oc2;
            game.spl_book[i].sp_know = 20000;
            /* operation needed to reverse */
            return 4;
        }
    } else {
        if (what == 2 || what == 3) {
            __tport_spell_save_tport.tport_indx = MAXSPELL;
        } else if (what == 4) {
            /*assert( i == save_tport.tport_indx );*/
            Object.assign(game.spl_book[i], __tport_spell_save_tport.savespell);
            __tport_spell_save_tport.tport_indx = MAXSPELL;
        } else if (what == 1) {
            __tport_spell_save_tport.savespell = game.spl_book[i];
            __tport_spell_save_tport.tport_indx = i;
            game.spl_book[i].sp_id = 0;
            return 3;
        }
    }
    return 0;
}
/* forget a random selection of known spells due to amnesia;
   they used to be lost entirely, as if never learned, but now we
   just set the memory retention to zero so that they can't be cast */
export function losespells() {
    let n = 0;
    let nzap = 0;
    let i = 0;
    game.context.spbook.book = null;
    game.context.spbook.o_id = 0;
    /* count the number of known spells */
    for (n = 0; n < MAXSPELL; ++n) {
        if (game.spl_book[n].sp_id == 0) {
            break;
        }
    }
    /* lose anywhere from zero to all known spells;
       if confused, use the worse of two die rolls */
    nzap = rn2(n + 1);
    if (game.u.uprops[CONFUSION].intrinsic) {
        i = rn2(n + 1);
        if (i > nzap) {
            nzap = i;
        }
    }
    /* good Luck might ameliorate spell loss */
    if (nzap > 1 && !rnl(7)) {
        nzap = rnd(nzap);
    }
    for (i = 0; nzap > 0; ++i) {
        /*
     * Forget 'nzap' out of 'n' known spells by setting their memory
     * retention to zero.  Every spell has the same probability to be
     * forgotten, even if its retention is already zero.
     *
     * Perhaps we should forget the corresponding book too?
     *
     * (3.4.3 removed spells entirely from the list, but always did
     * so from its end, so the 'nzap' most recently learned spells
     * were the ones lost by default.  Player had sort control over
     * the list, so could move the most useful spells to front and
     * only lose them if 'nzap' turned out to be a large value.
     *
     * Discarding from the end of the list had the virtue of making
     * casting letters for lost spells become invalid and retaining
     * the original letter for the ones which weren't lost, so there
     * was no risk to the player of accidentally casting the wrong
     * spell when using a letter that was in use prior to amnesia.
     * That wouldn't be the case if we implemented spell loss spread
     * throughout the list of known spells; every spell located past
     * the first lost spell would end up with new letter assigned.)
     */
        if (rn2(n - i) < nzap) {
            game.spl_book[i].sp_know = 0;
            /* when nzap is small relative to the number of spells left,
           the chance to lose spell [i] is small; as the number of
           remaining candidates shrinks, the chance per candidate
           gets bigger; overall, exactly nzap entries are affected */
            /* lose access to spell [i] */
            exercise(A_WIS, (0));
            /* there's now one less spell slated to be forgotten */
            --nzap;
        }
    }
}
/*
 * Allow player to sort the list of known spells.  Manually swapping
 * pairs of them becomes very tedious once the list reaches two pages.
 *
 * Possible extensions:
 *      provide means for player to control ordering of skill classes;
 *      provide means to supply value N such that first N entries stick
 *      while rest of list is being sorted;
 *      make chosen sort order be persistent such that when new spells
 *      are learned, they get inserted into sorted order rather than be
 *      appended to the end of the list?
 */
export const SORTBY_LETTER = 0;
export const SORTBY_ALPHA = 1;
export const SORTBY_LVL_LO = 2;
export const SORTBY_LVL_HI = 3;
export const SORTBY_SKL_AL = 4;
export const SORTBY_SKL_LO = 5;
export const SORTBY_SKL_HI = 6;
export const SORTBY_CURRENT = 7;
export const SORTRETAINORDER = 8;
export const NUM_SPELL_SORTBY = 9;
const spl_sortchoices = ["by casting letter", "alphabetically", "by level, low to high", "by level, high to low", "by skill group, alphabetized within each group", "by skill group, low to high level within group", "by skill group, high to low level within group", "maintain current ordering", "reassign casting letters to retain current order"];
/* a menu choice rather than a sort choice */
/* qsort callback routine */
export function spell_cmp(vptr1, vptr2) {
    /*
     * gather up all of the possible parameters except spell name
     * in advance, even though some might not be needed:
     *  indx. = spl_orderindx[] index into svs.spl_book[];
     *  otyp. = svs.spl_book[] index into objects[];
     *  levl. = spell level;
     *  skil. = skill group aka spell class.
     */
    let indx1 = vptr1;
    let indx2 = vptr2;
    let otyp1 = game.spl_book[indx1].sp_id;
    let otyp2 = game.spl_book[indx2].sp_id;
    let levl1 = game.objects[otyp1].oc_oc2;
    let levl2 = game.objects[otyp2].oc_oc2;
    let skil1 = game.objects[otyp1].oc_subtyp;
    let skil2 = game.objects[otyp2].oc_subtyp;
    switch (game.spl_sortmode) {
        case SORTBY_LETTER:
            return indx1 - indx2;
        case SORTBY_ALPHA:
            break;
        case SORTBY_LVL_LO:
            if (levl1 != levl2) {
                return levl1 - levl2;
            }
            break;
        case SORTBY_LVL_HI:
            if (levl1 != levl2) {
                return levl2 - levl1;
            }
            break;
        case SORTBY_SKL_AL:
            if (skil1 != skil2) {
                return skil1 - skil2;
            }
            break;
        case SORTBY_SKL_LO:
            if (skil1 != skil2) {
                return skil1 - skil2;
            }
            if (levl1 != levl2) {
                return levl1 - levl2;
            }
            break;
        case SORTBY_SKL_HI:
            if (skil1 != skil2) {
                return skil1 - skil2;
            }
            if (levl1 != levl2) {
                return levl2 - levl1;
            }
            break;
        case SORTBY_CURRENT:
        default:
            return (vptr1 < vptr2) ? -1 : (vptr1 > vptr2);
    }
    /* tie-breaker for most sorts--alphabetical by spell name */
    return strncmpi(((game.obj_descr[(game.objects[otyp1]).oc_name_idx].oc_name)), ((game.obj_descr[(game.objects[otyp2]).oc_name_idx].oc_name)), -1);
}
/* sort the index used for display order of the "view known spells"
   list (sortmode == SORTBY_xxx), or sort the spellbook itself to make
   the current display order stick (sortmode == SORTRETAINORDER) */
export function sortspells() {
    let i = 0;
    let n = 0;
    if (game.spl_sortmode == SORTBY_CURRENT) {
        return;
    }
    for (n = 0; n < MAXSPELL && game.spl_book[n].sp_id != 0; ++n) {
        continue;
    }
    if (n < 2) {
        return;
    }
    if (!game.spl_orderindx) {
        /* not enough entries to need sorting */
        /* we haven't done any sorting yet; list is in casting order */
        if (game.spl_sortmode == SORTBY_LETTER || game.spl_sortmode == SORTRETAINORDER) {
            return;
        }
        /* allocate enough for full spellbook rather than just N spells */
        game.spl_orderindx = alloc(MAXSPELL * 4 /* sizeof(int) */);
        for (i = 0; i < MAXSPELL; i++) {
            game.spl_orderindx[i] = i;
        }
    }
    if (game.spl_sortmode == SORTRETAINORDER) {
        let tmp_book = [{ sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }, { sp_id: 0, sp_lev: 0, sp_know: 0 }];
        /* sort svs.spl_book[] rather than spl_orderindx[];
           this also updates the index to reflect the new ordering (we
           could just free it since that ordering becomes the default) */
        for (i = 0; i < MAXSPELL; i++) {
            Object.assign(tmp_book[i], game.spl_book[game.spl_orderindx[i]]);
        }
        for (i = 0; i < MAXSPELL; i++) {
            Object.assign(game.spl_book[i], tmp_book[i]) , game.spl_orderindx[i] = i;
        }
        game.spl_sortmode = SORTBY_LETTER;
        return;
    }
    /* usual case, sort the index rather than the spells themselves */
    qsort(game.spl_orderindx, n, 4 /* sizeof(int) */, spell_cmp);
    return;
}
/* called if the [sort spells] entry in the view spells menu gets chosen */
export function spellsortmenu() {
    let tmpwin = 0;
    let selected = null;
    let any = 0;
    let let_ = 0;
    let i = 0;
    let n = 0;
    let choice = 0;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    any = cg.zeroany;
    for (i = 0; i < (Math.trunc(9 /* sizeof(const char *const [9]) */ / 1 /* sizeof(const char *const) */)); i++) {
        if (i == SORTRETAINORDER) {
            /* assumes fewer than 26 sort choices... */
            let_ = 122;
            /* separate final choice from others with a blank line */
            add_menu_str(tmpwin, "");
        } else {
            let_ = 97 + i;
        }
        any.a_int = i + 1;
        add_menu(tmpwin, nul_glyphinfo, any, let_, 0, 0, clr, spl_sortchoices[i], (i == game.spl_sortmode) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, "View known spells list sorted");
    n = select_menu(tmpwin, 1, selected);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (n > 0) {
        choice = selected[0].item.a_int - 1;
        /* skip preselected entry if we have more than one item chosen */
        if (n > 1 && choice == game.spl_sortmode) {
            choice = selected[1].item.a_int - 1;
        }
        free(selected);
        game.spl_sortmode = choice;
        return (1);
    }
    return (0);
}
/* the #showspells command -- view known spells */
export function dovspell() {
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let splnum = 0;
    let othnum = 0;
    let spl_tmp = { sp_id: 0, sp_lev: 0, sp_know: 0 };
    if (game.spl_book[0].sp_id == 0) {
        You("don't know any spells right now.");
    } else {
        while (dospellmenu("Currently known spells", (-1), { get value() { return splnum; }, set value(_v) { splnum = _v; } })) {
            if (splnum == (MAXSPELL)) {
                if (spellsortmenu()) {
                    sortspells();
                }
            } else {
                qbuf = sprintf(qbuf, "Reordering spells; swap '%c' with", (((splnum < 26) ? (97 + splnum) : (65 + splnum - 26))));
                if (!dospellmenu(qbuf, splnum, { get value() { return othnum; }, set value(_v) { othnum = _v; } })) {
                    break;
                }
                Object.assign(spl_tmp, game.spl_book[splnum]);
                Object.assign(game.spl_book[splnum], game.spl_book[othnum]);
                Object.assign(game.spl_book[othnum], spl_tmp);
            }
        }
    }
    if (game.spl_orderindx) {
        free(game.spl_orderindx);
        game.spl_orderindx = null;
    }
    game.spl_sortmode = SORTBY_LETTER;
    return 0;
}
/* lists spells for endgame dumplog purposes */
export function show_spells() {
    let unused = (-3);
    if (game.spl_book[0].sp_id == 0) {
        pline("You didn't know any spells.");
        pline("%s", "");
    } else {
        pline("Spells:");
        ((dospellmenu("", (-3), { get value() { return unused; }, set value(_v) { unused = _v; } })));
    }
}
/* shows menu of known spells, with options to sort them.
   return FALSE on cancel, TRUE otherwise.
   spell_no is set to the internal spl_book index, if any selected */
/* SPELLMENU_CAST, SPELLMENU_VIEW, SPELLMENU_DUMP or
                    * svs.spl_book[] index */
export function dospellmenu(prompt, splaction, spell_no) {
    let tmpwin = 0;
    let i = 0;
    let n = 0;
    let how = 0;
    let splnum = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let retentionbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let sep = 0;
    let fmt = null;
    let selected = null;
    let any = 0;
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    any = cg.zeroany;
    /*
     * The correct spacing of the columns when not using
     * tab separation depends on the following:
     * (1) that the font is monospaced, and
     * (2) that selection letters are prepended to the
     *     given string and are of the form "a - ".
     * For SPELLMENU_DUMP, (2) is untrue, so four spaces
     * need to be subtracted.
     */
    if (!game.iflags.menu_tab_sep) {
        buf = sprintf(buf, "%s%-20s Level %-12s Fail Retention", splaction == (-3) ? "" : "    ", "Name", "Category");
        fmt = "%-20s  %2d   %-12s %3d%% %9s";
        sep = 32;
    } else {
        buf = sprintf(buf, "Name\tLevel\tCategory\tFail\tRetention");
        fmt = "%s\t%-d\t%s\t%-d%%\t%s";
        sep = 9;
    }
    if (game.flags.debug) {
        buf = (buf || '') + sprintf('', "%c%6s", sep, "turns");
    }
    add_menu_heading(tmpwin, buf);
    for (i = 0; i < MAXSPELL && game.spl_book[i].sp_id != 0; i++) {
        splnum = !game.spl_orderindx ? i : game.spl_orderindx[i];
        buf = sprintf(buf, fmt, (game.obj_descr[(game.objects[game.spl_book[splnum].sp_id]).oc_name_idx].oc_name), game.spl_book[splnum].sp_lev, spelltypemnemonic(spell_skilltype(game.spl_book[splnum].sp_id)), 100 - percent_success(splnum), spellretention(splnum, retentionbuf));
        if (game.flags.debug) {
            buf = (buf || '') + sprintf('', "%c%6d", sep, game.spl_book[i].sp_know);
        }
        any.a_int = splnum + 1;
        add_menu(tmpwin, nul_glyphinfo, any, (((splnum < 26) ? (97 + splnum) : (65 + splnum - 26))), 0, 0, clr, buf, (splnum == splaction) ? 1 : 0);
    }
    how = 1;
    if (splaction == (-1)) {
        if (game.spl_book[1].sp_id == 0) {
            /* only one spell => nothing to swap with */
            how = 0;
        } else {
            /* more than 1 spell, add an extra menu entry */
            any.a_int = (MAXSPELL) + 1;
            add_menu(tmpwin, nul_glyphinfo, any, 43, 0, 0, clr, "[sort spells]", 0);
        }
    }
    (game.windowprocs.win_end_menu)(tmpwin, prompt);
    n = select_menu(tmpwin, how, selected);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (n > 0) {
        spell_no.value = selected[0].item.a_int - 1;
        /* menu selection for `PICK_ONE' does not
           de-select any preselected entry */
        if (n > 1 && spell_no.value == splaction) {
            spell_no.value = selected[1].item.a_int - 1;
        }
        free(selected);
        /* default selection of preselected spell means that
           user chose not to swap it with anything */
        if (spell_no.value == splaction) {
            return (0);
        }
        return (1);
    } else if (splaction >= 0) {
        /* explicit de-selection of preselected spell means that
           user is still swapping but not for the current spell */
        spell_no.value = splaction;
        return (1);
    }
    return (0);
}
export function percent_success(spell) {
    /* Intrinsic and learned ability are combined to calculate
     * the probability of player's success at casting a given spell.
     */
    let chance = 0;
    let splcaster = 0;
    let special = 0;
    let statused = 0;
    let difficulty = 0;
    let skill = 0;
    let skilltype = spell_skilltype(game.spl_book[spell].sp_id);
    /* Knights don't get metal armor penalty for clerical spells */
    let paladin_bonus = ((game.urole.mnum == (PM_KNIGHT)) && skilltype == P_CLERIC_SPELL);
    /* Calculate intrinsic ability (splcaster) */
    splcaster = game.urole.spelbase;
    special = game.urole.spelheal;
    statused = (acurr(game.urole.spelstat));
    if (game.uarm && (game.objects[game.uarm.otyp].oc_material >= IRON && game.objects[game.uarm.otyp].oc_material <= MITHRIL) && !paladin_bonus) {
        splcaster += (game.uarmc && game.uarmc.otyp == ROBE) ? Math.trunc(game.urole.spelarmr / 2) : game.urole.spelarmr;
    } else if (game.uarmc && game.uarmc.otyp == ROBE) {
        splcaster -= game.urole.spelarmr;
    }
    if (game.uarms) {
        splcaster += game.urole.spelshld;
    }
    if (game.uwep && game.uwep.otyp == QUARTERSTAFF) {
        splcaster -= 3;
    }
    if (!paladin_bonus) {
        /* && otyp != HELM_OF_BRILLIANCE */
        if (game.uarmh && (game.objects[game.uarmh.otyp].oc_material >= IRON && game.objects[game.uarmh.otyp].oc_material <= MITHRIL)) {
            splcaster += 4;
        }
        if (game.uarmg && (game.objects[game.uarmg.otyp].oc_material >= IRON && game.objects[game.uarmg.otyp].oc_material <= MITHRIL)) {
            splcaster += 6;
        }
        if (game.uarmf && (game.objects[game.uarmf.otyp].oc_material >= IRON && game.objects[game.uarmf.otyp].oc_material <= MITHRIL)) {
            splcaster += 2;
        }
    }
    if (game.spl_book[spell].sp_id == game.urole.spelspec) {
        splcaster += game.urole.spelsbon;
    }
    if (game.spl_book[spell].sp_id == SPE_HEALING || game.spl_book[spell].sp_id == SPE_EXTRA_HEALING || game.spl_book[spell].sp_id == SPE_CURE_BLINDNESS || game.spl_book[spell].sp_id == SPE_CURE_SICKNESS || game.spl_book[spell].sp_id == SPE_RESTORE_ABILITY || game.spl_book[spell].sp_id == SPE_REMOVE_CURSE) {
        splcaster += special;
    }
    if (splcaster > 20) {
        splcaster = 20;
    }
    /* Calculate learned ability */
    /* The player's basic likelihood of being able to cast any spell
     * is based of their `magic' statistic. (Int or Wis)
     */
    chance = Math.trunc(11 * statused / 2);
    /*
     * High-level spells are harder.  Easier for higher-level casters.
     * The difficulty is based on the hero's level and their skill level
     * in that spell type.
     */
    skill = (game.u.weapon_skills[skilltype].skill);
    skill = ((skill) > (P_UNSKILLED) ? (skill) : (P_UNSKILLED)) - 1;
    difficulty = (game.spl_book[spell].sp_lev - 1) * 4 - ((skill * 6) + (Math.trunc(game.u.ulevel / 3)) + 1);
    if (difficulty > 0) {
        /* Player is too low level or unskilled. */
        chance -= isqrt(900 * difficulty + 2000);
    } else {
        /* Player is above level.  Learning continues, but the
         * law of diminishing returns sets in quickly for
         * low-level spells.  That is, a player quickly gains
         * no advantage for raising level.
         */
        let learning = Math.trunc(15 * -difficulty / game.spl_book[spell].sp_lev);
        chance += learning > 20 ? 20 : learning;
    }
    /* Clamp the chance: >18 stat and advanced learning only help
     * to a limit, while chances below "hopeless" only raise the
     * specter of overflowing 16-bit ints (and permit wearing a
     * shield to raise the chances :-).
     */
    if (chance < 0) {
        chance = 0;
    }
    if (chance > 120) {
        chance = 120;
    }
    if (game.uarms && weight(game.uarms) > game.objects[SMALL_SHIELD].oc_weight) {
        if (game.spl_book[spell].sp_id == game.urole.spelspec) {
            /* Wearing anything but a light shield makes it very awkward
     * to cast a spell.  The penalty is not quite so bad for the
     * player's role-specific spell.
     */
            chance = Math.trunc(chance / 2);
        } else {
            chance = Math.trunc(chance / 4);
        }
    }
    /* Finally, chance (based on player intell/wisdom and level) is
     * combined with ability (based on player intrinsics and
     * encumbrances).  No matter how intelligent/wise and advanced
     * a player is, intrinsics and encumbrance can prevent casting;
     * and no matter how able, learning is always required.
     */
    chance = Math.trunc(chance * (20 - splcaster) / 15) - splcaster;
    if (chance > 100) {
        chance = 100;
    }
    if (chance < 0) {
        chance = 0;
    }
    return chance;
}
export function spellretention(idx, outbuf) {
    let turnsleft = 0;
    let percent = 0;
    let accuracy = 0;
    let skill = 0;
    skill = (game.u.weapon_skills[spell_skilltype(game.spl_book[idx].sp_id)].skill);
    /* restricted same as unskilled */
    skill = ((skill) > (P_UNSKILLED) ? (skill) : (P_UNSKILLED));
    turnsleft = game.spl_book[idx].sp_know;
    outbuf.value = 0;
    if (turnsleft < 1) {
        outbuf = strcpy(outbuf, "(gone)");
    } else if (turnsleft >= 20000) {
        outbuf = strcpy(outbuf, "100%");
    } else {
        /*
         * Retention is displayed as a range of percentages of
         * amount of time left until memory of the spell expires;
         * the precision of the range depends upon hero's skill
         * in this spell.
         *    expert:  2% intervals; 1-2,   3-4,  ...,   99-100;
         *   skilled:  5% intervals; 1-5,   6-10, ...,   95-100;
         *     basic: 10% intervals; 1-10, 11-20, ...,   91-100;
         * unskilled: 25% intervals; 1-25, 26-50, 51-75, 76-100.
         *
         * At the low end of each range, a value of N% really means
         * (N-1)%+1 through N%; so 1% is "greater than 0, at most 200".
         * KEEN is a multiple of 100; KEEN/100 loses no precision.
         */
        percent = Math.trunc((turnsleft - 1) / (Math.trunc(20000 / 100))) + 1;
        accuracy = (skill == P_EXPERT) ? 2 : (skill == P_SKILLED) ? 5 : (skill == P_BASIC) ? 10 : 25;
        /* round up to the high end of this range */
        percent = accuracy * (Math.trunc((percent - 1) / accuracy) + 1);
        outbuf = sprintf(outbuf, "%ld%%-%ld%%", percent - accuracy + 1, percent);
    }
    return outbuf;
}
/* Learn a spell during creation of the initial inventory */
export function initialspell(obj) {
    let i = 0;
    let otyp = obj.otyp;
    for (i = 0; i < MAXSPELL; i++) {
        if (game.spl_book[i].sp_id == 0 || game.spl_book[i].sp_id == otyp) {
            break;
        }
    }
    if (i == MAXSPELL) {
        impossible("Too many spells memorized!");
    } else if (game.spl_book[i].sp_id != 0) {
        /* initial inventory shouldn't contain duplicate spellbooks */
        impossible("Spell %s already known.", (game.obj_descr[(game.objects[otyp]).oc_name_idx].oc_name));
    } else {
        /* for a going-stale or forgotten spell the sp_id and sp_lev assignments
       are redundant but harmless; for an unknown spell, they're essential */
        game.spl_book[i].sp_id = otyp;
        game.spl_book[i].sp_lev = game.objects[otyp].oc_oc2;
        (game.spl_book[i].sp_know = 20000 + (0));
    }
    return;
}
/* returns one of spe_Unknown, spe_Fresh, spe_GoingStale, spe_Forgotten */
export function known_spell(otyp) {
    let i = 0;
    let k = 0;
    for (i = 0; (i < MAXSPELL) && (game.spl_book[i].sp_id != 0); i++) {
        if (game.spl_book[i].sp_id == otyp) {
            k = game.spl_book[i].sp_know;
            return (k > Math.trunc(20000 / 10)) ? spe_Fresh : (k > 0) ? spe_GoingStale : spe_Forgotten;
        }
    }
    return spe_Unknown;
}
/* return index for spell otyp, or UNKNOWN_SPELL if not found */
export function spell_idx(otyp) {
    let i = 0;
    for (i = 0; (i < MAXSPELL) && (game.spl_book[i].sp_id != 0); i++) {
        if (game.spl_book[i].sp_id == otyp) {
            return i;
        }
    }
    return (-1);
}
/* learn or refresh spell otyp, if feasible; return casting letter or '\0' */
export function force_learn_spell(otyp) {
    let i = 0;
    if (otyp == SPE_BLANK_PAPER || otyp == SPE_BOOK_OF_THE_DEAD || known_spell(otyp) == spe_Fresh) {
        return 0;
    }
    for (i = 0; i < MAXSPELL; i++) {
        if (game.spl_book[i].sp_id == 0 || game.spl_book[i].sp_id == otyp) {
            break;
        }
    }
    if (i == MAXSPELL) {
        impossible("Too many spells memorized");
        return 0;
    }
    game.spl_book[i].sp_id = otyp;
    game.spl_book[i].sp_lev = game.objects[otyp].oc_oc2;
    (game.spl_book[i].sp_know = 20000 + (0));
    /* set spl_book[i].sp_know to KEEN; unlike when learning
                      * a spell by reading its book, we don't need to add 1 */
    return (((i < 26) ? (97 + i) : (65 + i - 26)));
}
/* number of spells hero knows */
export function num_spells() {
    let i = 0;
    for (i = 0; i < MAXSPELL; i++) {
        if (game.spl_book[i].sp_id == 0) {
            break;
        }
    }
    return i;
}
/*spell.c*/
/* paupers need more skill than this to ID books, but most wizards
               know the basics */
/* makeknown(booktype) but don't exercise Wisdom or mark as
               encountered */
/* FIXME: this doesn't work, possibly because
                               cleaning up tmp_at() restores old glyph? */
/* spell has expired; hero can't successfully cast it anymore */
/* full retention, first turn or immediately after reading book */
