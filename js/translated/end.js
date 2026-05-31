/* NetHack 5.0	end.c	$NHDT-Date: 1720397752 2024/07/08 00:15:52 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.315 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/* comment line for pre-compiled headers */
import { game } from '../gstate.js';
import { __builtin_va_end, __builtin_va_start } from '../c2js-runtime/builtins.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, Your, pline, pline_The, raw_printf } from '../c2js-runtime/pline.js';
import { sprintf, vsnprintf } from '../c2js-runtime/stdio.js';
import { nh_strchr_truncate, strcat, strchr, strcmp, strcpy, strlen, strstri } from '../c2js-runtime/string.js';
import { timet_delta } from './allmain.js';
import { arti_cost, artiname } from './artifact.js';
import { acurr, adjattrib, minuhpmax, setuhpmax } from './attrib.js';
import { lift_covet_and_placebc } from './ball.js';
import { can_make_bones, savebones } from './bones.js';
import { bot } from './botl.js';
import { getnow, midnight, night } from './calendar.js';
import { cmdq_add_ec, isok, paranoid_query, yn_function } from './cmd.js';
import { disclosure_options, ynchars, ynqchars } from './decl.js';
import { canseemon, curs_on_u, sensemon } from './display.js';
import { schedule_goto } from './do.js';
import { Mgender, Monnam, free_oname, m_monnam, mon_nam, pmname } from './do_name.js';
import { keepdogs } from './dog.js';
import { endmultishot } from './dothrow.js';
import { In_quest, deepest_lev_reached, depth, dunlev, on_level, show_overview, single_level_branch } from './dungeon.js';
import { init_uhunger } from './eat.js';
import { make_grave } from './engrave.js';
import { money_cnt, nomul } from './hack.js';
import { eos, upstart } from './hacklib.js';
import { count_achievements, enlightenment, list_genocided, list_vanquished, record_achievement, show_conduct } from './insight.js';
import { carrying, currency, display_inventory, free_pickinv_cache, perm_invent_toggled, set_cknown_lknown, sortloot, stackobj, unsortloot, update_inventory, useup } from './invent.js';
import { adj_lev } from './makemon.js';
import { expels } from './mhitu.js';
import { bless, mk_named_object, mksobj, place_object } from './mkobj.js';
import { unstuck, zombie_maker } from './mon.js';
import { sticks } from './mondata.js';
import { accessible } from './monmove.js';
import { ACH_BLND, ACH_NUDE, ACH_UWIN, AMULET_CLASS, AMULET_OF_LIFE_SAVING, ASCENDED, A_CON, BAG_OF_TRICKS, BELL_OF_OPENING, BLINDED, BURNING, CANDELABRUM_OF_INVOCATION, CHOKING, CORPSE, CQ_CANNED, DIED, DISSOLVED, ESCAPED, FAKE_AMULET_OF_YENDOR, FIRST_AMULET, FIRST_REAL_GEM, GEM_CLASS, GENOCIDED, GRAVE, HALLUC, HALLUC_RES, LARGE_BOX, LAST_GLASS_GEM, LAST_REAL_GEM, LEAVESTATUE, LIFESAVED, LOW_PM, M_AP_MONSTER, NHCORE_GAME_EXIT, NON_PM, NUMMONS, PANICKED, PLNMSG_OK_DONT_DIE, PM_GHOST, PM_GHOUL, PM_GREEN_SLIME, PM_HIGH_CLERIC, PM_HOUSECAT, PM_HUMAN, PM_TOURIST, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, PM_WRAITH, POT_RESTORE_ABILITY, POT_WATER, QUIT, SICK, SPE_BOOK_OF_THE_DEAD, STARVING, STATUE, STONING, S_MUMMY, S_VAMPIRE, S_WRAITH, TRICKED, TT_LAVA, TURNED_SLIME, UNCHANGING, UTOTYPE_ATSTAIRS, _ISspace, fuzzer_off, override_restriction } from './nh-constants.js';
import { discover_object } from './o_init.js';
import { an, doname_with_price, the, the_unique_obj, the_unique_pm, thesimpleoname, xname } from './objnam.js';
import { monhealthdescr } from './pager.js';
import { observe_quantum_cat } from './pickup.js';
import { livelog_printf } from './pline.js';
import { make_sick, peffects, set_itimeout } from './potion.js';
import { clearpriests } from './priest.js';
import { NH_panictrace_gdb, NH_panictrace_libc, panictrace_setsignals, submit_web_report } from './report.js';
import { d, rn2 } from './rnd.js';
import { Goodbye } from './role.js';
import { sfi_kinfo, sfo_kinfo } from './sfbase.js';
import { finish_paybill, obfree, paybill } from './shk.js';
import { shkname, shkname_is_pname } from './shknam.js';
import { Strlen_ } from './strutil.js';
import { formatkiller, topten } from './topten.js';
import { force_launch_placement, launch_in_progress, reset_utrap } from './trap.js';
import { hidden_gold, paygd } from './vault.js';
import { dump_close_log, dump_forward_putstr, dump_open_log } from './windows.js';
import { wiz_makemap } from './wizcmds.js';

/* SFCTOOL */
/*
 * The order of these needs to match the macros in hack.h.
 */
const deaths = ["died", "choked", "poisoned", "starvation", "drowning", "burning", "dissolving under the heat and pressure", "crushed", "turned to stone", "turned into slime", "genocided", "panic", "trickery", "quit", "escaped", "ascended"];
/* the array of death */
const ends = ["died", "choked", "were poisoned", "starved", "drowned", "burned", "dissolved in the lava", "were crushed", "turned to stone", "turned into slime", "were genocided", "panicked", "were tricked", "quit", "escaped", "ascended"];
/* "when you %s" */
game.Schroedingers_cat = (0);
/* called as signal() handler, so sent at least one arg */
/*ARGSUSED*/
export function done1(sig_unused) {
    signal(2, (1));
    game.iflags.debug_fuzzer = fuzzer_off;
    if (game.flags.ignintr) {
        signal(2, done1);
        (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
        curs_on_u();
        (game.windowprocs.win_wait_synch)();
        if (game.multi > 0) {
            nomul(0);
        }
    } else {
        done2();
    }
}
/* "#quit" command or keyboard interrupt */
export function done2() {
    let abandon_tutorial = (0);
    if (((game.u.uz).dnum == (game.dungeon_topology.d_tutorial_dnum)) && yn_function("Switch from the tutorial back to regular play?", ynchars, 110, (1)) == 121) {
        abandon_tutorial = (1);
    }
    if (abandon_tutorial || !paranoid_query(((game.flags.paranoia_bits & 2) != 0), "Really quit without saving?")) {
        signal(2, done1);
        (game.windowprocs.win_clear_nhwindow)(game.WIN_MESSAGE);
        curs_on_u();
        (game.windowprocs.win_wait_synch)();
        if (game.multi > 0) {
            nomul(0);
        }
        if (game.multi == 0) {
            game.u.uinvulnerable = (0);
            game.u.usleep = 0;
        }
        if (abandon_tutorial) {
            schedule_goto(game.u.ucamefrom, UTOTYPE_ATSTAIRS, "Resuming regular play.", null);
        }
        return 0;
    }
    if (game.flags.debug) {
        let c = 0;
        /* sys/vms/vmsmisc.c, vmsunix.c */
        c = yn_function("Dump core?", ynqchars, 113, (1));
        if (c == 121) {
            signal(2, done1);
            /* make sure all pending output gets flushed */
            if (game.soundprocs.sound_exit_nhsound) {
                (game.soundprocs.sound_exit_nhsound)("done2");
            }
            (game.windowprocs.win_exit_nhwindows)(null);
            NH_abort(null);
        } else if (c == 113) {
            game.program_state.stopprint++;
        }
    }
    done(QUIT);
    return 0;
}
/* called as signal() handler, so sent at least 1 arg */
/*ARGSUSED*/
export function done_intr(sig_unused) {
    game.program_state.stopprint++;
    signal(2, (1));
    signal(3, (1));
    return;
}
/* signal() handler */
export function done_hangup(sig) {
    game.program_state.done_hup++;
    sethanguphandler((1));
    done_intr(sig);
    return;
}
/* NO_SIGNAL */
/* one compiler warns if the format
                                     string is the result of a ? x : y */
export function done_in_by(mtmp, how) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mptr = mtmp.data;
    let champtr = ((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS) ? game.mons[mtmp.cham] : mptr;
    let distorted = ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && (canseemon(mtmp) || sensemon(mtmp)));
    let mimicker = (((mtmp).m_ap_type & 7) == M_AP_MONSTER);
    let imitator = (mptr != champtr || mimicker);
    You((how == STONING) ? "turn to stone..." : "die...");
    (game.windowprocs.win_mark_synch)();
    /* flush buffered screen output */
    buf[0] = 0;
    game.killer.format = 0;
    if ((mptr.geno & 4096) != 0 && !(imitator && !mimicker) && !(mptr == game.mons[PM_HIGH_CLERIC] && !mtmp.ispriest)) {
        /* "killed by the high priest of Crom" is okay,
       "killed by the high priest" alone isn't */
        if (!(((mptr).mflags2 & 524288) != 0)) {
            buf = strcat(buf, "the ");
        }
        /* _the_ <invisible> <distorted> ghost of Dudley */
        game.killer.format = 1;
    }
    if (mptr == game.mons[PM_GHOST] && ((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
        buf = strcat(buf, "the ");
        game.killer.format = 1;
    }
    monhealthdescr(mtmp, (1), eos(buf));
    if (mtmp.minvis) {
        buf = strcat(buf, "invisible ");
    }
    if (distorted) {
        buf = strcat(buf, "hallucinogen-distorted ");
    }
    if (imitator) {
        let shape = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let realnm = pmname(champtr, Mgender(mtmp));
        let fakenm = pmname(mptr, Mgender(mtmp));
        let alt = ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER);
        if (mimicker) {
            /* realnm is already correct because champtr==mptr;
               set up fake mptr for type_is_pname/the_unique_pm */
            mptr = game.mons[mtmp.mappearance];
            fakenm = pmname(mptr, Mgender(mtmp));
        } else if (alt && strstri(realnm, "vampire") && !strcmp(fakenm, "vampire bat")) {
            /* special case: use "vampire in bat form" in preference
               to redundant looking "vampire in vampire bat form" */
            fakenm = "bat";
        }
        /* for the alternate format, always suppress any article;
           pname and the_unique should also have s_suffix() applied,
           but vampires don't take on any shapes which warrant that */
        if (alt || (((mptr).mflags2 & 524288) != 0)) {
            shape = strcpy(shape, fakenm);
        } else if (the_unique_pm(mptr)) {
            shape = sprintf(shape, "the %s", fakenm);
        } else {
            shape = strcpy(shape, an(fakenm));
        }
        buf = (buf || '') + sprintf('', alt ? "%s in %s form" : mimicker ? "%s disguised as %s" : "%s imitating %s", realnm, shape);
        mptr = mtmp.data;
    } else if (mptr == game.mons[PM_GHOST]) {
        buf = strcat(buf, "ghost");
        /* "the"; don't use the() here */
        /* omit "called" to avoid excessive verbosity */
        if (((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
            buf = (buf || '') + sprintf('', " of %s", ((mtmp).mextra.mgivenname));
        }
    } else if (mtmp.isshk) {
        let shknm = shkname(mtmp);
        let honorific = shkname_is_pname(mtmp) ? "" : mtmp.female ? "Ms. " : "Mr. ";
        buf = (buf || '') + sprintf('', "%s%s, the shopkeeper", honorific, shknm);
        game.killer.format = 1;
    } else if (mtmp.ispriest || mtmp.isminion) {
        buf = strcat(buf, m_monnam(mtmp));
    } else {
        buf = strcat(buf, pmname(mptr, Mgender(mtmp)));
        if (((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
            buf = (buf || '') + sprintf('', " %s %s", ((mtmp).mextra && ((mtmp).mextra.ebones)) ? "of" : "called", ((mtmp).mextra.mgivenname));
        }
    }
    game.killer.name = strcpy(game.killer.name, buf);
    if (game.multi_reason && game.multi_reason > game.multireasonbuf && game.multi_reason < game.multireasonbuf + 128 /* sizeof(char [128]) */ - 1) {
        /* m_monnam() suppresses "the" prefix plus "invisible", and
           it overrides the effect of Hallucination on priestname() */
        /* might need to fix up multi_reason if 'mtmp' caused the reason */
        let reasondummy = 0;
        let p = null;
        let reasonmid = 0;
        if (sscanf(game.multireasonbuf, "%u:%c", reasonmid, reasondummy) == 2 && mtmp.m_id == reasonmid) {
            /*
         * multireasonbuf[] contains 'm_id:reason' and multi_reason
         * points at the text past the colon, so we have something
         * like "42:paralyzed by a ghoul"; if mtmp->m_id matches 42
         * then we truncate 'reason' at its first space so that final
         * death reason becomes "Killed by a ghoul, while paralyzed."
         * instead of "Killed by a ghoul, while paralyzed by a ghoul."
         * (3.6.x gave "Killed by a ghoul, while paralyzed by a monster."
         * which is potentially misleading when the monster is also
         * the killer.)
         *
         * Note that if the hero is life-saved and then killed again
         * before the helplessness has cleared, the second death will
         * report the truncated helplessness reason even if some other
         * monster performs the /coup de grace/.
         */
            if ((p = strchr(game.multireasonbuf, 32)) != null) {
                game.multireasonbuf = nh_strchr_truncate(game.multireasonbuf, 32, 'chr');
            }
        }
    }
    /*
     * Chicken and egg issue:
     *  Ordinarily Unchanging ought to override something like this,
     *  but the transformation occurs at death.  With the current code,
     *  the effectiveness of Unchanging stops first, but a case could
     *  be made that it should last long enough to prevent undead
     *  transformation.  (Turning to slime isn't an issue here because
     *  Unchanging prevents that from happening.)
     */
    if (mptr.mlet == S_WRAITH) {
        game.u.ugrave_arise = PM_WRAITH;
    } else if (mptr.mlet == S_MUMMY && game.urace.mummynum != NON_PM) {
        game.u.ugrave_arise = game.urace.mummynum;
    } else if (zombie_maker(mtmp) && game.urace.zombienum != NON_PM) {
        game.u.ugrave_arise = game.urace.zombienum;
    } else if (mptr.mlet == S_VAMPIRE && (game.urace.mnum == (PM_HUMAN))) {
        game.u.ugrave_arise = PM_VAMPIRE;
    } else if (mptr == game.mons[PM_GHOUL]) {
        game.u.ugrave_arise = PM_GHOUL;
    }
    /* this could happen if a high-end vampire kills the hero
       when ordinary vampires are genocided; ditto for wraiths */
    if (game.u.ugrave_arise >= LOW_PM && (game.mvitals[game.u.ugrave_arise].mvflags & 2)) {
        game.u.ugrave_arise = NON_PM;
    }
    done(how);
    return;
}
/* some special cases for overriding while-helpless reason */
const death_fixups = [{ why: STONING, unmulti: 1, exclude: "getting stoned", include: null }, { why: STARVING, unmulti: 0, exclude: "fainted from lack of food", include: "fainted" }];
/* "petrified by <foo>, while getting stoned" -- "while getting stoned"
       prevented any last-second recovery, but it was not the cause of
       "petrified by <foo>" */
/* "died of starvation, while fainted from lack of food" is accurate
       but sounds a fairly silly (and doesn't actually appear unless you
       splice together death and while-helpless from xlogfile) */
/* clear away while-helpless when the cause of death caused that
   helplessness (ie, "petrified by <foo> while getting stoned") */
export function fixup_death(how) {
    let i = 0;
    if (game.multi_reason) {
        for (i = 0; i < (Math.trunc(2 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/end.c:349:14) [2]) */ / 1 /* sizeof(const struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/end.c:349:14)) */)); ++i) {
            if (death_fixups[i].why == how && !strcmp(death_fixups[i].exclude, game.multi_reason)) {
                if (death_fixups[i].include) {
                    game.multi_reason = death_fixups[i].include;
                /* substitute alternate reason */
                /* remove the helplessness reason */
                } else {
                    game.multi_reason = null;
                }
                /* dynamic buf stale either way */
                game.multireasonbuf[0] = 0;
                /* possibly hide helplessness */
                if (death_fixups[i].unmulti) {
                    game.multi = 0;
                }
                break;
            }
        }
    }
}
/*VARARGS1*/
export function panic(str) {
    let the_args = 0;
{
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        __builtin_va_start(the_args, str);
        ;
        if (game.program_state.panicking++) {
            NH_abort(null);
        }
        /* avoid loops - this should never happen*/
        game.bot_disabled = (1);
        if (game.iflags.window_inited) {
            (game.windowprocs.win_raw_print)("\r\nOops...");
            (game.windowprocs.win_wait_synch)();
            if (game.soundprocs.sound_exit_nhsound) {
                (game.soundprocs.sound_exit_nhsound)("panic");
            }
            (game.windowprocs.win_exit_nhwindows)(null);
            /* they're gone; force raw_print()ing */
            game.iflags.window_inited = (0);
        }
        (game.windowprocs.win_raw_print)(game.program_state.gameover ? "Postgame wrapup disrupted." : !game.program_state.something_worth_saving ? "Program initialization has failed." : "Suddenly, the dungeon collapses.");
        if (!game.flags.debug) {
            let maybe_rebuild = !game.program_state.something_worth_saving ? "." : "\nand it may be possible to rebuild.";
            // XXX this may need an update if defined(CRASHREPORT) TBD
            if (game.sysopt.support) {
                raw_printf("To report this error, %s%s", game.sysopt.support, maybe_rebuild);
            } else if (game.sysopt.fmtd_wizard_list) {
                raw_printf("To report this error, contact %s%s", game.sysopt.fmtd_wizard_list, maybe_rebuild);
            } else {
                raw_printf("Report error to \"%s\"%s", "wizard", maybe_rebuild);
            }
        }
        if (game.program_state.something_worth_saving && !game.iflags.debug_fuzzer) {
            /* XXX can we move this above the prints?  Then we'd be able to
     * suppress "it may be possible to rebuild" based on dosave0()
     * or say it's NOT possible to rebuild. */
            set_error_savefile();
            if (dosave0()) {
                /* os/win port specific recover instructions */
                if (game.sysopt.recover) {
                    raw_printf("%s", game.sysopt.recover);
                }
            }
        }
        vsnprintf(buf, 256 /* sizeof(char [256]) */, str, the_args);
        (game.windowprocs.win_raw_print)(buf);
        paniclog("panic", buf);
        NH_abort(buf);
        __builtin_va_end(the_args);
    }
    ;
    really_done(PANICKED);
}
/* !NOTIFY_NETHACK_BUGS */
/* formatted SYSCF WIZARDS */
/* ?NOTIFY_NETHACK_BUGS */
/* !MICRO */
/* generate core dump */
export function should_query_disclose_option(category, defquery) {
    let __nh_defquery_idx = 0;
    let idx = 0;
    let disclose = 0;
    let dop = null;
    defquery.value = 110;
    if ((dop = strchr(disclosure_options, category)) != null) {
        idx = (dop - disclosure_options);
        if (idx < 0 || idx >= 6) {
            impossible("should_query_disclose_option: bad disclosure index %d %c", idx, category);
            defquery.value = 121;
            return (1);
        }
        disclose = game.flags.end_disclose[idx];
        if (disclose == 43) {
            defquery.value = 121;
            /* panic or too many consecutive deaths */
            return (0);
        } else if (disclose == 35) {
            defquery.value = 97;
            return (0);
        } else if (disclose == 45) {
            defquery.value = 110;
            return (0);
        } else if (disclose == 121) {
            defquery.value = 121;
            return (1);
        } else if (disclose == 63) {
            defquery.value = 97;
            return (1);
        } else {
            defquery.value = 110;
            return (1);
        }
    }
    impossible("should_query_disclose_option: bad category %c", category);
    return (1);
}
/* one space for indentation */
/* DUMPLOG */
/*ARGSUSED*/
/* ASCENDED, ESCAPED, QUIT, etc */
/* date+time at end of game */
export function dump_everything(how, when) {
    ((how));
    /* overview of the game up to this point */
    ((when));
}
export function disclose(how, taken) {
    let c = 0;
    let defquery = 0;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ask = (0);
    if (game.invent && !game.program_state.stopprint) {
        if (taken) {
            qbuf = sprintf(qbuf, "Do you want to see what you had when you %s?", (how == QUIT) ? "quit" : "died");
        } else {
            qbuf = strcpy(qbuf, "Do you want your possessions identified?");
        }
        ask = should_query_disclose_option(105, { get value() { return defquery; }, set value(_v) { defquery = _v; } });
        c = ask ? yn_function(qbuf, ynqchars, defquery, (1)) : defquery;
        if (c == 121) {
            /* caller has already ID'd everything; we pass 'want_reply=True'
               to force display_pickinv() to avoid using WIN_INVENT */
            game.iflags.force_invmenu = (0);
            display_inventory(null, (1));
            container_contents(game.invent, (1), (1), (0));
        }
        if (c == 113) {
            game.program_state.stopprint++;
        }
    }
    if (!game.program_state.stopprint) {
        ask = should_query_disclose_option(97, { get value() { return defquery; }, set value(_v) { defquery = _v; } });
        c = ask ? yn_function("Do you want to see your attributes?", ynqchars, defquery, (1)) : defquery;
        if (c == 121) {
            enlightenment((1 | 2), (how >= PANICKED) ? 1 : 2);
        }
        if (c == 113) {
            game.program_state.stopprint++;
        }
    }
    if (!game.program_state.stopprint) {
        ask = should_query_disclose_option(118, { get value() { return defquery; }, set value(_v) { defquery = _v; } });
        list_vanquished(defquery, ask);
    }
    if (!game.program_state.stopprint) {
        ask = should_query_disclose_option(103, { get value() { return defquery; }, set value(_v) { defquery = _v; } });
        list_genocided(defquery, ask);
    }
    if (!game.program_state.stopprint) {
        if (should_query_disclose_option(99, { get value() { return defquery; }, set value(_v) { defquery = _v; } })) {
            let acnt = count_achievements();
            qbuf = sprintf(qbuf, "Do you want to see your conduct%s?", (acnt > 0) ? " and achievements" : "");
            c = yn_function(qbuf, ynqchars, defquery, (1));
        } else {
            c = defquery;
        }
        if (c == 121) {
            show_conduct((how >= PANICKED) ? 1 : 2);
        }
        if (c == 113) {
            game.program_state.stopprint++;
        }
    }
    if (!game.program_state.stopprint) {
        /* this was distinguishing between one achievement and
                       multiple achievements, but "conduct and achievement"
                       looked strange if multiple conducts got shown (which
                       is usual for an early game death); we could switch
                       to plural vs singular for conducts but the less
                       specific "conduct and achievements" is sufficient */
        ask = should_query_disclose_option(111, { get value() { return defquery; }, set value(_v) { defquery = _v; } });
        c = ask ? yn_function("Do you want to see the dungeon overview?", ynqchars, defquery, (1)) : defquery;
        if (c == 121) {
            show_overview((how >= PANICKED) ? 1 : 2, how);
        }
        if (c == 113) {
            game.program_state.stopprint++;
        }
    }
}
/* try to get the player back in a viable state after being killed */
export function savelife(how) {
    let uhpmin = 0;
    let givehp = 50 + 10 * (Math.trunc((acurr(A_CON)) / 2));
    /* life-drain/level-loss to experience level 0 kills without actually
       reducing ulevel below 1, but include this for bulletproofing */
    if (game.u.ulevel < 1) {
        game.u.ulevel = 1;
    }
    uhpmin = minuhpmax(10);
    if (game.u.uhpmax < uhpmin) {
        setuhpmax(uhpmin, (1));
    }
    game.u.uhp = ((game.u.uhpmax) < (givehp) ? (game.u.uhpmax) : (givehp));
    /* Unchanging, or death which bypasses losing hit points */
    if ((game.u.umonnum != game.u.umonster)) {
        game.u.mh = ((game.u.mhmax) < (givehp) ? (game.u.mhmax) : (givehp));
    }
    if (game.u.uhunger < 500 || how == CHOKING) {
        init_uhunger();
    }
    if ((game.u.uprops[SICK].intrinsic & 16777215) == 1) {
        /* cure impending doom of sickness hero won't have time to fix
       [shouldn't this also be applied to other fatal timeouts?] */
        make_sick(0, null, (0), 3);
    }
    game.nomovemsg = "You survived that attempt on your life.";
    game.context.move = 0;
    /* can't move again during the current turn */
    game.multi = -1;
    /* in case being life-saved is immediately followed by being killed
       again (perhaps due to zap rebound); this text will be appended to
          "killed by <something>, while "
       in high scores entry, if any, and in logfile (but not on tombstone) */
    game.multi_reason = (game.urole.mnum == (PM_TOURIST)) ? "being toyed with by Fate" : "attempting to cheat Death";
    if (game.u.utrap && game.u.utraptype == TT_LAVA) {
        reset_utrap((0));
    }
    game.disp.botl = (1);
    game.u.ugrave_arise = NON_PM;
    game.u.uprops[UNCHANGING].intrinsic = 0;
    curs_on_u();
    if (!game.context.mon_moving) {
        endmultishot((0));
    }
    if (game.u.uswallow) {
        /* might drop hero onto a trap that kills her all over again */
        expels(game.u.ustuck, game.u.ustuck.data, (1));
    } else if (game.u.ustuck) {
        if ((game.u.umonnum != game.u.umonster) && sticks(game.youmonst.data)) {
            You("release %s.", mon_nam(game.u.ustuck));
        } else {
            pline("%s releases you.", Monnam(game.u.ustuck));
        }
        unstuck(game.u.ustuck);
    }
}
/*
 * Get valuables from the given list.  Revised code: the list always remains
 * intact.
 */
/* inventory or container contents */
export function get_valuables(list) {
    let obj = null;
    let i = 0;
    for (obj = list; obj; obj = obj.nobj) {
        if (((obj).cobj != null)) {
            /* find amulets and gems, ignoring all artifacts */
            get_valuables(obj.cobj);
        } else if (obj.oartifact) {
            continue;
        } else if (obj.oclass == AMULET_CLASS) {
            i = obj.otyp - FIRST_AMULET;
            if (!game.amulets[i].count) {
                game.amulets[i].count = obj.quan;
                game.amulets[i].typ = obj.otyp;
            } else {
                game.amulets[i].count += obj.quan;
            }
        } else if (obj.oclass == GEM_CLASS && obj.otyp <= LAST_GLASS_GEM) {
            /* last+1: combine all glass gems into one slot */
            i = ((obj.otyp) < (LAST_REAL_GEM + 1) ? (obj.otyp) : (LAST_REAL_GEM + 1)) - FIRST_REAL_GEM;
            if (!game.gems[i].count) {
                game.gems[i].count = obj.quan;
                game.gems[i].typ = obj.otyp;
            } else {
                game.gems[i].count += obj.quan;
            }
        }
    }
    return;
}
/*
 *  Sort collected valuables, most frequent to least.  We could just
 *  as easily use qsort, but we don't care about efficiency here.
 */
/* max value is less than 20 */
export function sort_valuables(list, size) {
    let i = 0;
    let j = 0;
    let ltmp = { count: 0, typ: 0 };
    for (i = 1; i < size; i++) {
        /* move greater quantities to the front of the list */
        if (list[i].count == 0) {
            continue;
        }
        Object.assign(ltmp, list[i]);
        for (j = i; j > 0; --j) {
            if (list[j - 1].count >= ltmp.count) {
                break;
            }
            Object.assign(list[j], list[j - 1]);
        }
        Object.assign(list[j], ltmp);
    }
    return;
}
/*
 * odds_and_ends() was used for 3.6.0 and 3.6.1.
 * Schroedinger's Cat is handled differently as of 3.6.2.
 */
/* Schroedinger's Cat */
/* Ascending is deterministic */
/* deal with some objects which may be in an abnormal state at end of game */
export function done_object_cleanup() {
    let ox = 0;
    let oy = 0;
    /* might have been killed while using a disposable item, so make sure
       it's gone prior to inventory disclosure and creation of bones */
    inven_inuse((1));
    /*
     * Hero can die when throwing an object (by hitting an adjacent
     * gas spore, for instance, or being hit by mis-returning Mjollnir),
     * or while in transit (from falling down stairs).  If that happens,
     * some object(s) might be in limbo rather than on the map or in
     * any inventory.  Saving bones with an active light source in limbo
     * would trigger an 'object not local' panic.
     *
     * We used to use dealloc_obj() on gt.thrownobj and gk.kickedobj but
     * that keeps them out of bones and could leave uball in a confused
     * state (gone but still attached).  Place them on the map but
     * bypass flooreffects().  That could lead to minor anomalies in
     * bones, like undamaged paper at water or lava locations or piles
     * not being knocked down holes, but it seems better to get this
     * game over with than risk being tangled up in more and more details.
     */
    ox = game.u.ux + game.u.dx , oy = game.u.uy + game.u.dy;
    if (!isok(ox, oy) || !accessible(ox, oy)) {
        ox = game.u.ux , oy = game.u.uy;
    }
    if (game.thrownobj && game.thrownobj.where == 0) {
        /* put thrown or kicked object on map (for bones); location might
       be incorrect (perhaps killed by divine lightning when throwing at
       a temple priest?) but this should be better than just vanishing
       (fragile stuff should be taken care of before getting here) */
        place_object(game.thrownobj, ox, oy);
        stackobj(game.thrownobj) , game.thrownobj = null;
    }
    if (game.kickedobj && game.kickedobj.where == 0) {
        place_object(game.kickedobj, ox, oy);
        stackobj(game.kickedobj) , game.kickedobj = null;
    }
    if (game.uchain && game.uchain.where == 0) {
        /* if Punished hero dies during level change or dies or quits while
       swallowed, uball and uchain will be in limbo; put them on floor
       so bones will have them and object list cleanup finds them */
        lift_covet_and_placebc(override_restriction);
    }
    if (game.iflags.perm_invent) {
        /* persistent inventory window now obsolete since disclosure uses
       a normal popup one; avoids "Bad fruit #n" when saving bones */
        /* in case we're panicking; normally cleared by done_object_cleanup() */
        game.iflags.perm_invent = (0);
        /* make interface notice the change */
        perm_invent_toggled((1));
    }
    return;
}
/* called twice; first to calculate total, then to list relevant items */
/* true => add up points; false => display them */
export function artifact_score(list, counting, endwin) {
    let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let otmp = null;
    let value = 0;
    let points = 0;
    for (otmp = list; otmp; otmp = otmp.nobj) {
        if (otmp.oartifact || otmp.otyp == BELL_OF_OPENING || otmp.otyp == SPE_BOOK_OF_THE_DEAD || otmp.otyp == CANDELABRUM_OF_INVOCATION) {
            value = arti_cost(otmp);
            points = Math.trunc(value * 5 / 2);
            if (counting) {
                game.u.urexp = ((game.u.urexp) <= (9223372036854775807 - (points)) ? ((game.u.urexp) + (points)) : 9223372036854775807);
            } else {
                discover_object(otmp.otyp, (1), (1), (0));
                /* not observe_object; dead characters don't observe */
                otmp.known = otmp.dknown = otmp.bknown = otmp.rknown = 1;
                pbuf = sprintf(pbuf, "%s%s (worth %ld %s and %ld points)", the_unique_obj(otmp) ? "The " : "", otmp.oartifact ? artiname(otmp.oartifact) : (game.obj_descr[(game.objects[otmp.otyp]).oc_name_idx].oc_name), value, currency(value), points);
                (game.windowprocs.win_putstr)(endwin, 0, pbuf);
            }
        }
        if (((otmp).cobj != null)) {
            artifact_score(otmp.cobj, counting, endwin);
        }
    }
}
/* when dying while running the debug fuzzer, [almost] always keep going;
   True: forced survival; False: doomed unless wearing life-save amulet */
export function fuzzer_savelife(how) {
    if (!game.program_state.panicking && how != PANICKED && how != TRICKED) {
        /*
     * Some debugging code pulled out of done() to unclutter it.
     * 'done_seq' is maintained in done().
     */
        savelife(how);
        if (!rn2((game.done_seq > game.hero_seq + 2) ? 2 : 10)) {
            /* periodically restore characteristics plus lost experience
           levels or cure lycanthropy or both; those conditions make the
           hero vulnerable to repeat deaths (often by becoming surrounded
           while being too encumbered to do anything) */
            let potion = null;
            let propidx = 0;
            let proptim = 0;
            let remedies = 0;
            if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS) && !rn2(3)) {
                /* get rid of temporary potion with obfree() rather than useup()
               because it doesn't get entered into inventory */
                potion = mksobj(POT_WATER, (1), (0));
                bless(potion);
                peffects(potion);
                obfree(potion, null);
                ++remedies;
            }
            if (!remedies || rn2(3)) {
                potion = mksobj(POT_RESTORE_ABILITY, (1), (0));
                bless(potion);
                peffects(potion);
                obfree(potion, null);
                ++remedies;
            }
            if (!rn2(3 + 3 * remedies)) {
                for (propidx = 1; propidx <= 8; ++propidx) {
                    /* confer temporary resistances for first 8 properties:
                   fire, cold, sleep, disint, shock, poison, acid, stone */
                    if (!game.u.uprops[propidx].intrinsic && !game.u.uprops[propidx].extrinsic && (proptim = rn2(3)) > 0) {
                        set_itimeout({ get value() { return game.u.uprops[propidx].intrinsic; }, set value(_v) { game.u.uprops[propidx].intrinsic = _v; } }, (2 * proptim + 1));
                    }
                }
                ++remedies;
            }
            if (!rn2(5 + 5 * remedies)) {
                ;
            }
        }
        /* clear stale cause of death info after life-saving */
        game.killer.name[0] = 0;
        game.killer.format = 0;
        if (game.done_seq++ > game.hero_seq + 100) {
            /* might confer temporary Antimagic (magic resistance)
                   * or even Invulnerable */
            /*
         * Guard against getting stuck in a loop if we die in one of
         * the few ways where life-saving isn't effective (cited case
         * was burning in lava when the level was too full to allow
         * teleporting to safety).  Deal with it by recreating the level
         * if we're in wizmode (always the case for debug_fuzzer unless
         * player has used a debugger to fiddle with 'iflags' bits).
         */
            if (!game.flags.debug) {
                return (0);
            }
            cmdq_add_ec(CQ_CANNED, wiz_makemap);
        }
        return (1);
    }
    return (0);
}
/* Be careful not to call panic from here! */
export function done(how) {
    let survive = (0);
    if (how == TRICKED) {
        if (game.killer.name[0]) {
            paniclog("trickery", game.killer.name);
            game.killer.name[0] = 0;
        }
        if (game.flags.debug) {
            You("are a very tricky wizard, it seems.");
            game.killer.format = 0;
            return;
        }
    }
    if (game.program_state.panicking || game.program_state.done_hup || (how == QUIT && game.program_state.stopprint)) {
        /* skip status update if panicking or disconnected
           or answer of 'q' to "Really quit?" */
        game.disp.botl = game.disp.botlx = game.disp.time_botl = (0);
    } else {
        /* otherwise force full status update */
        game.disp.botlx = (1);
        bot();
    }
    /* hero_seq is (moves<<3 + n) where n is number of moves made
       by the hero on the current turn (since the 'moves' variable
       actually counts turns); its details shouldn't matter here;
       used by fuzzer_savelife() and for hangup below */
    if (game.done_seq < game.hero_seq) {
        game.done_seq = game.hero_seq;
    }
    if (game.iflags.debug_fuzzer) {
        if (fuzzer_savelife(how)) {
            return;
        }
    }
    if (how == ASCENDED || (!game.killer.name[0] && how == GENOCIDED)) {
        /* statue instead of corpse */
        /* it's possible to turn into slime even though green slimes
                have been genocided:  genocide could occur after hero is
                already infected or hero could eat a glob of one created
                before genocide; don't try to arise as one if they're gone */
        game.killer.format = 2;
    }
    /* Avoid killed by "a" burning or "a" starvation */
    if (!game.killer.name[0] && (how == STARVING || how == BURNING)) {
        game.killer.format = 1;
    }
    if (!game.killer.name[0] || how >= PANICKED) {
        game.killer.name = strcpy(game.killer.name, deaths[how]);
    }
    if (how < PANICKED) {
        game.u.umortality++;
        if (game.u.uhp != 0 || ((game.u.umonnum != game.u.umonster) && game.u.mh != 0)) {
            /* in case caller hasn't already done this */
            /* force HP to zero in case it is still positive (some
               deaths aren't triggered by loss of hit points), or
               negative (-1 is used as a flag in some circumstances
               which don't apply when actually dying due to HP loss) */
            game.u.uhp = game.u.mh = 0;
            game.disp.botl = (1);
        }
    }
    if (game.u.uprops[LIFESAVED].extrinsic && (how <= GENOCIDED)) {
        pline("But wait...");
        discover_object((AMULET_OF_LIFE_SAVING), (1), (1), (1));
        /* assumes that only one type of item confers LifeSaved property */
        Your("medallion %s!", !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "begins to glow" : "feels warm");
        if (how == CHOKING) {
            You("vomit ...");
        }
        You_feel("much better!");
        pline_The("medallion crumbles to dust!");
        if (game.uamul) {
            useup(game.uamul);
        }
        adjattrib(A_CON, -1, (1));
        savelife(how);
        if (how == GENOCIDED) {
            pline("Unfortunately you are still genocided...");
        } else {
            let killbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            formatkiller(killbuf, 256, how, (0));
            livelog_printf(16, "averted death (%s)", killbuf);
            survive = (1);
        }
    }
    if (!survive && (game.flags.debug || game.flags.explore) && how <= GENOCIDED && !(game.program_state.done_hup && game.done_seq++ == game.hero_seq) && !paranoid_query(((game.flags.paranoia_bits & 4) != 0), "Die?")) {
        /* explore and wizard modes offer player the option to keep playing */
        /* if hangup has occurred, the only possible answer to a paranoid
           query is 'no'; we want 'no' as the default for "Die?" but can't
           accept it more than once if there's no user supplying it */
        pline("OK, so you don't %s.", (how == CHOKING) ? "choke" : "die");
        game.iflags.last_msg = PLNMSG_OK_DONT_DIE;
        savelife(how);
        survive = (1);
    }
    if (survive) {
        game.killer.name[0] = 0;
        game.killer.format = 0;
        return;
    }
    really_done(how);
}
/* separated from done() in order to specify the __noreturn__ attribute */
export function really_done(how) {
    let taken = 0;
    let pbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let endwin = (-1);
    let bones_ok = 0;
    let have_windows = game.iflags.window_inited;
    let corpse = null;
    let endtime = 0;
    let umoney = 0;
    let tmp = 0;
    /*
     *  The game is now over...
     */
    game.program_state.gameover = 1;
    /* in case of a subsequent panic(), there's no point trying to save */
    game.program_state.something_worth_saving = 0;
    if (game.program_state.done_hup) {
        game.program_state.stopprint++;
    }
    /* render vision subsystem inoperative */
    game.iflags.vision_inited = (0);
    /* maybe use up active invent item(s), place thrown/kicked missile,
       deal with ball and chain possibly being temporarily off the map */
    if (!game.program_state.panicking) {
        done_object_cleanup();
    }
    game.iflags.perm_invent = (0);
    /* remember time of death here instead of having bones, rip, and
       topten figure it out separately and possibly getting different
       time or even day if player is slow responding to --More-- */
    game.urealtime.finish_time = endtime = getnow();
    game.urealtime.realtime += timet_delta(endtime, game.urealtime.start_timing);
    /* collect these for end of game disclosure (not used during play) */
    game.iflags.at_night = night();
    game.iflags.at_midnight = midnight();
    if (game.u.uachieved[0] || !game.flags.beginner) {
        /* final achievement tracking; only show blind and nudist if some
       tangible progress has been made; always show ascension last */
        if (game.u.uroleplay.blind) {
            record_achievement(ACH_BLND);
        }
        if (game.u.uroleplay.nudist) {
            record_achievement(ACH_NUDE);
        }
    }
    if (how == ASCENDED) {
        record_achievement(ACH_UWIN);
    }
    dump_open_log(endtime);
    /* Sometimes you die on the first move.  Life's not fair.
     * On those rare occasions you get hosed immediately, go out
     * smiling... :-)  -3.
     */
    if (game.moves <= 1 && how < PANICKED && !game.program_state.stopprint) {
        pline("Do not pass Go.  Do not collect 200 %s.", currency(200));
    }
    if (have_windows) {
        (game.windowprocs.win_wait_synch)();
    }
    signal(2, done_intr);
    signal(3, done_intr);
    sethanguphandler(done_hangup);
    bones_ok = (how < GENOCIDED) && can_make_bones();
    if (bones_ok && launch_in_progress()) {
        force_launch_placement();
    }
    /* maintain ugrave_arise even for !bones_ok */
    if (how == PANICKED) {
        game.u.ugrave_arise = (NON_PM - 3);
    } else if (how == BURNING || how == DISSOLVED) {
        game.u.ugrave_arise = (NON_PM - 2);
    } else if (how == STONING) {
        game.u.ugrave_arise = LEAVESTATUE;
    } else if (how == TURNED_SLIME && !(game.mvitals[PM_GREEN_SLIME].mvflags & 2)) {
        game.u.ugrave_arise = PM_GREEN_SLIME;
    }
    if (how == QUIT) {
        game.killer.format = 2;
        if (game.u.uhp < 1) {
            how = DIED;
            /* skipped above when how==QUIT */
            game.u.umortality++;
            game.killer.name = strcpy(game.killer.name, "quit while already on Charon's boat");
        }
    }
    if (how == ESCAPED || how == PANICKED) {
        game.killer.format = 2;
    }
    /* actually, fixup gm.multi_reason */
    fixup_death(how);
    if (how != PANICKED) {
        let silently = game.program_state.stopprint ? (1) : (0);
        /* these affect score and/or bones, but avoid them during panic */
        taken = paybill((how == ESCAPED) ? -1 : (how != QUIT), silently);
        paygd(silently);
        clearpriests();
    /* lint; assert( !bones_ok ); */
    } else {
        taken = (0);
    }
    clearlocks();
    if (have_windows) {
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
    }
    if (how != PANICKED) {
        let obj = null;
        let nextobj = null;
        for (obj = game.invent; obj; obj = nextobj) {
            /*
         * This is needed for both inventory disclosure and dumplog.
         * Both are optional, so do it once here instead of duplicating
         * it in both of those places.
         */
            nextobj = obj.nobj;
            discover_object(obj.otyp, (1), (1), (0));
            /* observe_object not necessary after discover_object */
            obj.known = obj.bknown = obj.dknown = obj.rknown = 1;
            /* set flags when applicable */
            set_cknown_lknown(obj);
            if (((obj).otyp == LARGE_BOX && (obj).spe == 1)) {
                if (!game.Schroedingers_cat) {
                    /* we resolve Schroedinger's cat now in case of both
               disclosure and dumplog, where the 50:50 chance for
               live cat has to be the same both times */
                    /* tell observe_quantum_cat() not to create a cat; if it
                       chooses live cat in this situation, it will leave the
                       SchroedingersBox flag set (for container_contents()) */
                    observe_quantum_cat(obj, (0), (0));
                    if (((obj).otyp == LARGE_BOX && (obj).spe == 1)) {
                        game.Schroedingers_cat = (1);
                    }
                /* ordinary box with cat corpse in it */
                } else {
                    obj.spe = 0;
                }
            }
        }
        if (strcmp(game.flags.end_disclose, "none")) {
            disclose(how, taken);
        }
        /* it would be better to do this after killer.name fixups but
           that comes too late; included in final dumplog but might be
           excluded by active livelog */
        formatkiller(pbuf, 256 /* sizeof(char [256]) */, how, (1));
        if (!pbuf) {
            pbuf = strcpy(pbuf, deaths[how]);
        }
        livelog_printf(16384, "%s", pbuf);
        dump_everything(how, endtime);
    }
    /* if pets will contribute to score, populate gm.mydogs list now
       (bones creation isn't a factor, but pline() messaging is; used to
       be done even sooner, but we need it to come after dump_everything()
       so that any accompanying pets are still on the map during dump) */
    if (how == ESCAPED || how == ASCENDED) {
        keepdogs((1));
    }
    /* finish_paybill should be called after disclosure but before bones */
    if (bones_ok && taken) {
        finish_paybill();
    }
    if (bones_ok && game.u.ugrave_arise == NON_PM && !(game.mvitals[game.u.umonnum].mvflags & 16)) {
        /* grave creation should be after disclosure so it doesn't have
       this grave in the current level's features for #overview */
        /* Base corpse on race when not poly'd since original u.umonnum
           is based on role, and all role monsters are human. */
        let mnum = !(game.u.umonnum != game.u.umonster) ? game.urace.mnum : game.u.umonnum;
        let was_already_grave = ((game.level.locations[game.u.ux][game.u.uy].typ) == GRAVE);
        corpse = mk_named_object(CORPSE, game.mons[mnum], game.u.ux, game.u.uy, game.plname);
        pbuf = sprintf(pbuf, "%s, ", game.plname);
        formatkiller(eos(pbuf), 256 /* sizeof(char [256]) */ - Strlen_(pbuf, "really_done", 1315), how, (1));
        make_grave(game.u.ux, game.u.uy, pbuf);
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == GRAVE) && !was_already_grave) {
            game.level.locations[game.u.ux][game.u.uy].flags = 1;
        }
    }
    /* clear grave text; also lint suppression */
    pbuf[0] = 0;
{
        let deepest = deepest_lev_reached((0));
        umoney = money_cnt(game.invent);
        tmp = game.u.umoney0;
        /* accumulate gold from containers */
        umoney += hidden_gold((1));
        tmp = umoney - tmp;
        if (tmp < 0) {
            tmp = 0;
        }
        if (how < PANICKED) {
            tmp -= Math.trunc(tmp / 10);
        }
        tmp += 50 * (deepest - 1);
        if (deepest > 20) {
            tmp += 1000 * ((deepest > 30) ? 10 : deepest - 20);
        }
        game.u.urexp = ((game.u.urexp) <= (9223372036854775807 - (tmp)) ? ((game.u.urexp) + (tmp)) : 9223372036854775807);
        if (how == ASCENDED && game.u.ualign.type == game.u.ualignbase[1]) {
            /* calculate score, before creating bones [container gold] */
            /* ascension gives a score bonus iff offering to original deity */
            /* retaining original alignment: score *= 2;
               converting, then using helm-of-OA to switch back: *= 1.5 */
            tmp = (game.u.ualignbase[0] == game.u.ualignbase[1]) ? game.u.urexp : (Math.trunc(game.u.urexp / 2));
            game.u.urexp = ((game.u.urexp) <= (9223372036854775807 - (tmp)) ? ((game.u.urexp) + (tmp)) : 9223372036854775807);
        }
    }
    if (((game.u.ugrave_arise) >= LOW_PM && (game.u.ugrave_arise) < NUMMONS) && !game.program_state.stopprint) {
        /* give this feedback even if bones aren't going to be created,
           so that its presence or absence doesn't tip off the player to
           new bones or their lack; it might be a lie if makemon fails */
        Your("%s as %s...", (game.u.ugrave_arise != PM_GREEN_SLIME) ? "body rises from the dead" : "revenant persists", an(pmname(game.mons[game.u.ugrave_arise], (((game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female) ? 1 : 0))));
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
    }
    if (bones_ok) {
        if (!game.flags.debug || paranoid_query(((game.flags.paranoia_bits & 8) != 0), "Save bones?")) {
            savebones(how, endtime, corpse);
        }
        /* corpse may be invalid pointer now so
            ensure that it isn't used again */
        corpse = null;
    }
    /* update gold for the rip output, which can't use hidden_gold()
       (containers will be gone by then if bones just got saved...) */
    game.done_money = umoney;
    if (have_windows) {
        (game.windowprocs.win_wait_synch)();
        /* clean up unneeded windows */
        /* extra persistent window if perm_invent */
        free_pickinv_cache();
        if (game.WIN_INVEN != (-1)) {
            (game.windowprocs.win_destroy_nhwindow)(game.WIN_INVEN) , game.WIN_INVEN = (-1);
            /* precaution in case any late update_inventory() calls occur */
            game.iflags.perm_invent = (0);
        }
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
        (game.windowprocs.win_destroy_nhwindow)(game.WIN_MAP) , game.WIN_MAP = (-1);
        if (game.WIN_STATUS != (-1)) {
            (game.windowprocs.win_destroy_nhwindow)(game.WIN_STATUS) , game.WIN_STATUS = (-1);
        }
        (game.windowprocs.win_destroy_nhwindow)(game.WIN_MESSAGE) , game.WIN_MESSAGE = (-1);
        if (!game.program_state.stopprint || game.flags.tombstone) {
            endwin = (game.windowprocs.win_create_nhwindow)(5);
        }
        if (how < GENOCIDED && game.flags.tombstone && endwin != (-1)) {
            (game.windowprocs.win_outrip)(endwin, how, endtime);
        }
    } else {
        game.program_state.stopprint = 1;
    }
    if (game.u.uhave.amulet) {
        game.killer.name = strcat(game.killer.name, " (with the Amulet)");
    } else if (how == ESCAPED) {
        /* just avoid any more output */
        /* 'how' reasons beyond genocide shouldn't show tombstone;
       for normal end of game, genocide doesn't either */
        /* offered Amulet to wrong deity */
        /* don't bother counting to see whether it should be plural */
        if ((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level))))) {
            game.killer.name = strcat(game.killer.name, " (in celestial disgrace)");
        } else if (carrying(FAKE_AMULET_OF_YENDOR)) {
            game.killer.name = strcat(game.killer.name, " (with a fake Amulet)");
        }
    }
    pbuf = sprintf(pbuf, "%s %s the %s...", Goodbye(), game.plname, (how != ASCENDED) ? ((game.flags.female && game.urole.name.f) ? game.urole.name.f : game.urole.name.m) : (game.flags.female ? "Demigoddess" : "Demigod"));
    dump_forward_putstr(endwin, 0, pbuf, game.program_state.stopprint);
    dump_forward_putstr(endwin, 0, "", game.program_state.stopprint);
    if (how == ESCAPED || how == ASCENDED) {
        let mtmp = null;
        let otmp = null;
        let val = null;
        let i = 0;
        for (let __nhi_val = 0; (val = game.valuables[__nhi_val]) && (val.list); __nhi_val++) {
            for (i = 0; i < val.size; i++) {
                val.list[i].count = 0;
            }
        }
        get_valuables(game.invent);
        for (let __nhi_val = 0; (val = game.valuables[__nhi_val]) && (val.list); __nhi_val++) {
            for (i = 0; i < val.size; i++) {
                if (val.list[i].count != 0) {
                    /* add points for collected valuables */
                    tmp = val.list[i].count * game.objects[val.list[i].typ].oc_cost;
                    game.u.urexp = ((game.u.urexp) <= (9223372036854775807 - (tmp)) ? ((game.u.urexp) + (tmp)) : 9223372036854775807);
                }
            }
        }
        /* count the points for artifacts */
        artifact_score(game.invent, (1), endwin);
        /* need visibility for naming */
        game.viz_array[0][0] |= 2;
        mtmp = game.mydogs;
        pbuf = strcpy(pbuf, "You");
        if (mtmp || game.Schroedingers_cat) {
            while (mtmp) {
                pbuf = (pbuf || '') + sprintf('', " and %s", mon_nam(mtmp));
                if (mtmp.mtame) {
                    game.u.urexp = ((game.u.urexp) <= (9223372036854775807 - (mtmp.mhp)) ? ((game.u.urexp) + (mtmp.mhp)) : 9223372036854775807);
                }
                mtmp = mtmp.nmon;
            }
            if (game.Schroedingers_cat) {
                /* [it might be more robust to create a housecat and add it to
               gm.mydogs; it doesn't have to be placed on the map for that] */
                let mhp = 0;
                let m_lev = adj_lev(game.mons[PM_HOUSECAT]);
                mhp = d(m_lev, 8);
                game.u.urexp = ((game.u.urexp) <= (9223372036854775807 - (mhp)) ? ((game.u.urexp) + (mhp)) : 9223372036854775807);
                strcat(eos(pbuf), " and Schroedinger's cat");
            }
            dump_forward_putstr(endwin, 0, pbuf, game.program_state.stopprint);
            pbuf[0] = 0;
        } else {
            pbuf = strcat(pbuf, " ");
        }
        pbuf = (pbuf || '') + sprintf('', "%s with %ld point%s,", (how == ASCENDED) ? "went to your reward" : "escaped from the dungeon", game.u.urexp, (((game.u.urexp) == 1) ? "" : "s"));
        dump_forward_putstr(endwin, 0, pbuf, game.program_state.stopprint);
        if (!game.program_state.stopprint) {
            artifact_score(game.invent, (0), endwin);
        }
        for (let __nhi_val = 0; (val = game.valuables[__nhi_val]) && (val.list); __nhi_val++) {
            sort_valuables(val.list, val.size);
            for (i = 0; i < val.size && !game.program_state.stopprint; i++) {
                let typ = val.list[i].typ;
                let count = val.list[i].count;
                if (count == 0) {
                    continue;
                }
                if (game.objects[typ].oc_class != GEM_CLASS || typ <= LAST_REAL_GEM) {
                    otmp = mksobj(typ, (0), (0));
                    discover_object(otmp.otyp, (1), (1), (0));
                    otmp.dknown = 1;
                    otmp.known = 1;
                    if (((otmp).oextra && ((otmp).oextra.oname))) {
                        free_oname(otmp);
                    }
                    otmp.quan = count;
                    pbuf = sprintf(pbuf, "%8ld %s (worth %ld %s),", count, xname(otmp), count * game.objects[typ].oc_cost, currency(2));
                    obfree(otmp, null);
                } else {
                    pbuf = sprintf(pbuf, "%8ld worthless piece%s of colored glass,", count, (((count) == 1) ? "" : "s"));
                }
                dump_forward_putstr(endwin, 0, pbuf, 0);
            }
        }
    } else {
        /* did not escape or ascend */
        if (game.u.uz.dnum == 0 && game.u.uz.dlevel <= 0) {
            pbuf = sprintf(pbuf, "You %s beyond the confines of the dungeon", (game.u.uz.dlevel < 0) ? "passed away" : ends[how]);
        } else {
            /* more conventional demise */
            let where = game.dungeons[game.u.uz.dnum].dname;
            if ((((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level))))) {
                where = "The Astral Plane";
            }
            pbuf = sprintf(pbuf, "You %s in %s", ends[how], where);
            if (!((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && !single_level_branch(game.u.uz)) {
                pbuf = (pbuf || '') + sprintf('', " on dungeon level %d", In_quest(game.u.uz) ? dunlev(game.u.uz) : depth(game.u.uz));
            }
        }
        pbuf = (pbuf || '') + sprintf('', " with %ld point%s,", game.u.urexp, (((game.u.urexp) == 1) ? "" : "s"));
        dump_forward_putstr(endwin, 0, pbuf, game.program_state.stopprint);
    }
    pbuf = sprintf(pbuf, "and %ld piece%s of gold, after %ld move%s.", umoney, (((umoney) == 1) ? "" : "s"), game.moves, (((game.moves) == 1) ? "" : "s"));
    dump_forward_putstr(endwin, 0, pbuf, game.program_state.stopprint);
    pbuf = sprintf(pbuf, "You were level %d with a maximum of %d hit point%s when you %s.", game.u.ulevel, game.u.uhpmax, (((game.u.uhpmax) == 1) ? "" : "s"), ends[how]);
    dump_forward_putstr(endwin, 0, pbuf, game.program_state.stopprint);
    dump_forward_putstr(endwin, 0, "", game.program_state.stopprint);
    if (!game.program_state.stopprint) {
        (game.windowprocs.win_display_nhwindow)(endwin, (1));
    }
    if (endwin != (-1)) {
        (game.windowprocs.win_destroy_nhwindow)(endwin);
    }
    dump_close_log();
    if (game.soundprocs.sound_exit_nhsound) {
        (game.soundprocs.sound_exit_nhsound)("really_done");
    }
    /*
     * "So when I die, the first thing I will see in Heaven is a score list?"
     *
     * topten() updates 'logfile' and 'xlogfile', when they're enabled.
     * Then the current game's score is shown in its relative position
     * within high scores, and 'record' is updated if that makes the cut.
     *
     * FIXME!
     *  If writing topten with raw_print(), which will usually be sent to
     *  stdout, we call exit_nhwindows() first in case it erases the screen.
     *  But when writing topten to a window, we call exit_nhwindows()
     *  after topten() because that needs the windowing system to still
     *  be up.  This sequencing is absurd; we need something like
     *  raw_prompt("--More--") (or "Press <return> to continue.") that
     *  topten() can call for !toptenwin before returning here.
     */
    if (have_windows && !game.iflags.toptenwin) {
        (game.windowprocs.win_exit_nhwindows)(null) , have_windows = (0);
    }
    topten(how, endtime);
    if (have_windows) {
        (game.windowprocs.win_exit_nhwindows)(null);
    }
    if (game.program_state.stopprint) {
        (game.windowprocs.win_raw_print)("");
        (game.windowprocs.win_raw_print)("");
    }
    nh_terminate(0);
}
/* used for disclosure and for the ':' choice when looting a container */
export function container_contents(list, identified, all_containers, reportempty) {
    let box = null;
    let obj = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let cat = 0;
    let dumping = game.iflags.in_dumplog;
    for (box = list; box; box = box.nobj) {
        if (((box).otyp >= LARGE_BOX && (box).otyp <= BAG_OF_TRICKS) || box.otyp == STATUE) {
            if (!box.cknown || (identified && !box.lknown)) {
                /* we're looking at the contents now */
                box.cknown = 1;
                if (identified) {
                    box.lknown = 1;
                }
                update_inventory();
            }
            if (box.otyp == BAG_OF_TRICKS) {
                continue;
            } else if (box.cobj) {
                let tmpwin = (game.windowprocs.win_create_nhwindow)(4);
                let sortedcobj = null;
                let srtc = null;
                let sortflags = 0;
                /* at this stage, the SchroedingerBox() flag is only set
                   if the cat inside the box is alive; the box actually
                   contains a cat corpse that we'll pretend is not there;
                   for dead cat, the flag will be clear and there'll be
                   a cat corpse inside the box; either way, inventory
                   reports the box as containing "1 item" */
                cat = ((box).otyp == LARGE_BOX && (box).spe == 1);
                buf = sprintf(buf, "Contents of %s:", the(xname(box)));
                (game.windowprocs.win_putstr)(tmpwin, 0, buf);
                if (!dumping) {
                    (game.windowprocs.win_putstr)(tmpwin, 0, "");
                }
                buf[0] = buf[1] = 32;
                if (box.cobj && !cat) {
                    sortflags = (((game.flags.sortloot == 108 || game.flags.sortloot == 102) ? 4 : 0) | (game.flags.sortpack ? 1 : 0));
                    sortedcobj = sortloot(box.cobj, sortflags, (0), null);
                    for (let __nhi_srtc = 0; (srtc = sortedcobj[__nhi_srtc]) && ((obj = srtc.obj) != null); __nhi_srtc++) {
                        if (identified) {
                            discover_object(obj.otyp, (1), (1), (0));
                            /* observe_object unnecessary */
                            obj.dknown = 1;
                            obj.known = obj.bknown = obj.rknown = 1;
                            if (((obj).otyp >= LARGE_BOX && (obj).otyp <= BAG_OF_TRICKS) || obj.otyp == STATUE) {
                                obj.cknown = obj.lknown = 1;
                            }
                        }
                        strcpy({ get value() { return buf[2]; }, set value(_v) { buf[2] = _v; } }, doname_with_price(obj));
                        (game.windowprocs.win_putstr)(tmpwin, 0, buf);
                    }
                    unsortloot({ get value() { return sortedcobj; }, set value(_v) { sortedcobj = _v; } });
                } else if (cat) {
                    strcpy({ get value() { return buf[2]; }, set value(_v) { buf[2] = _v; } }, "Schroedinger's cat!");
                    (game.windowprocs.win_putstr)(tmpwin, 0, buf);
                }
                if (dumping) {
                    (game.windowprocs.win_putstr)(0, 0, "");
                }
                (game.windowprocs.win_display_nhwindow)(tmpwin, (1));
                (game.windowprocs.win_destroy_nhwindow)(tmpwin);
                if (all_containers) {
                    container_contents(box.cobj, identified, (1), reportempty);
                }
            } else if (reportempty) {
                pline("%s is empty.", upstart(thesimpleoname(box)));
                (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
            }
        }
        if (!all_containers) {
            break;
        }
    }
}
/* should be called with either EXIT_SUCCESS or EXIT_FAILURE */
export function nh_terminate(status) {
    /* won't be returning to normal play */
    game.program_state.in_moveloop = 0;
    l_nhcore_call(NHCORE_GAME_EXIT);
    if (!game.program_state.panicking) {
        /* don't bother to try to release memory if we're in panic mode, to
       avoid trouble in case that happens to be due to memory problems */
        freedynamicdata();
        ;
        l_nhcore_done();
    }
    /*
     *  This is liable to draw a warning if compiled with gcc, but it's
     *  more important to flag panic() -> really_done() -> nh_terminate()
     *  as __noreturn__ then to avoid the warning.
     */
    /* don't call exit() if already executing within an exit handler;
       that would cancel any other pending user-mode handlers */
    game.program_state.exiting = 1;
    exit(status);
}
/* set a delayed killer, ensure non-delayed killer is cleared out */
export function delayed_killer(id, format, killername) {
    let k = find_delayed_killer(id);
    if (!k) {
        /* no match, add a new delayed killer to the list */
        k = alloc(1 /* sizeof(struct kinfo) */);
        memset(k, 0, 1 /* sizeof(struct kinfo) */);
        k.id = id;
        k.next = game.killer.next;
        game.killer.next = k;
    }
    k.format = format;
    k.name = strcpy(k.name, killername ? killername : "");
    game.killer.name[0] = 0;
}
export function find_delayed_killer(id) {
    let k = null;
    for (k = game.killer.next; k != null; k = k.next) {
        if (k.id == id) {
            break;
        }
    }
    return k;
}
export function dealloc_killer(kptr) {
    let prev = game.killer;
    let k = null;
    if (kptr == null) {
        return;
    }
    for (k = game.killer.next; k != null; k = k.next) {
        if (k == kptr) {
            break;
        }
        prev = k;
    }
    if (k == null) {
        impossible("dealloc_killer (#%d) not on list", kptr.id);
    } else {
        prev.next = k.next;
        free(k);
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/end.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("freed delayed killer #%d", kptr.id);
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    }
}
export function save_killers(nhfp) {
    let kptr = null;
    if (((nhfp).mode & (1 | 2))) {
        for (kptr = game.killer; kptr; kptr = kptr.next) {
            sfo_kinfo(nhfp, kptr, "kinfo");
        }
    }
    if (((nhfp).mode & 4)) {
        while (game.killer.next) {
            kptr = game.killer.next.next;
            free(game.killer.next);
            game.killer.next = kptr;
        }
    }
}
/* !SFCTOOL */
export function restore_killers(nhfp) {
    let kptr = null;
    for (kptr = game.killer; kptr != null; kptr = kptr.next) {
        sfi_kinfo(nhfp, kptr, "kinfo");
        if (kptr.next) {
            kptr.next = alloc(1 /* sizeof(struct kinfo) */);
        }
    }
}
export function wordcount(p) {
    let words = 0;
    while (p.value) {
        while (p.value && ((__ctype_b_loc())[((p.value))] & _ISspace)) {
            p++;
        }
        if (p.value) {
            words++;
        }
        while (p.value && !((__ctype_b_loc())[((p.value))] & _ISspace)) {
            p++;
        }
    }
    return words;
}
export function bel_copy1(inp, out) {
    let __nh_inp_idx = 0;
    let __nh_out_idx = 0;
    let in_ = inp[__nh_inp_idx];
    __nh_out_idx += strlen(out.slice(__nh_out_idx));
    while (in_ && ((__ctype_b_loc())[((in_))] & _ISspace)) {
        in_++;
    }
    while (in_ && !((__ctype_b_loc())[((in_))] & _ISspace)) {
        out[__nh_out_idx++] = in_++;
    }
    out.value = 0;
    inp.value = in_;
}
export function build_english_list(in_) {
    let out = null;
    let p = in_;
    let len = strlen(p);
    let words = wordcount(p);
    /* +3: " or " - " "; +(words - 1): (N-1)*(", " - " ") */
    if (words > 1) {
        len += 3 + (words - 1);
    }
    out = alloc(len + 1);
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    switch (words) {
        case 0:
            impossible("no words in list");
            break;
        case 1:
            bel_copy1({ get value() { return p; }, set value(_v) { p = _v; } }, out);
            break;
        default:
            if (words == 2) {
                bel_copy1({ get value() { return p; }, set value(_v) { p = _v; } }, out);
                out = strcat(out, " ");
            } else {
                /* "first, second, or third */
                do {
                    bel_copy1({ get value() { return p; }, set value(_v) { p = _v; } }, out);
                    out = strcat(out, ", ");
                } while (--words > 1);
            }
            out = strcat(out, "or ");
            bel_copy1({ get value() { return p; }, set value(_v) { p = _v; } }, out);
            break;
    }
    return out;
}
/* What do we try to in what order?  Tradeoffs:
 * libc: +no external programs required
 *        -requires newish libc/glibc
 *        -requires -rdynamic
 * gdb:   +gives more detailed information
 *        +works on more OS versions
 *        -requires -g, which may preclude -O on some compilers
 *
 * And the UI: if sysopt.crashreporturl, and defined(CRASHREPORT)
 * we gather the stacktrace (etc) and launch a browser to submit a bug report
 * otherwise we just use stdout.  Requires libc for now.
 */
let __NH_abort_aborting = (0);
export function NH_abort(why) {
    let gdb_prio = game.sysopt.panictrace_gdb;
    let libc_prio = game.sysopt.panictrace_libc;
    /* don't execute this code recursively if a second abort is requested
       while this routine or the code it calls is executing */
    if (__NH_abort_aborting) {
        return;
    }
    __NH_abort_aborting = (1);
    if (!submit_web_report(1, "Panic", why)) {
        if (gdb_prio == libc_prio && gdb_prio > 0) {
            gdb_prio++;
        }
        /* overload otherwise unused priority for debug mode: 1 = show
           traceback and exit; 2 = show traceback and stay in debugger */
        /* if (wizard && gdb_prio == 1) gdb_prio = 2; */
        if (gdb_prio > libc_prio) {
            (NH_panictrace_gdb() || (libc_prio && NH_panictrace_libc()));
        } else {
            (NH_panictrace_libc() || (gdb_prio && NH_panictrace_gdb()));
        }
    }
    panictrace_setsignals((0));
    abort();
}
/*end.c*/
/* [24]: room for 64-bit bogus value */
/* revert to default symbol set */
/* one line version ID, which includes build date+time;
       it's conceivable that the game started with a different
       build date+time or even with an older nethack version,
       but we only have access to the one it finished under */
/* game start and end date+time to disambiguate version date+time */
/* character name and basic role info */
/* info about current game state */
/* assumes artifacts don't have quan > 1 */
/* level teleported out of the dungeon; `how' is DIED,
               due to falling or to "arriving at heaven prematurely" */
