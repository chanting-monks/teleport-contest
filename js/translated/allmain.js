import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	allmain.c	$NHDT-Date: 1771213100 2026/02/15 19:38:20 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.286 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
/* various code that was replicated in *main.c */
import { game } from '../gstate.js';
import { difftime } from '../c2js-runtime/calendar.js';
import { lua_getglobal, lua_pushstring, lua_settop, nhl_pcall_handle } from '../c2js-runtime/lua.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, pline } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { check_leash, next_to_u } from './apply.js';
import { init_artifacts, mkot_trap_warn } from './artifact.js';
import { acurr, change_luck, exerchk } from './attrib.js';
import { bot, status_eval_next_unhilite, status_initialize, timebot } from './botl.js';
import { friday_13th, getnow, night, phase_of_the_moon } from './calendar.js';
import { cmdq_clear, dolookaround, end_of_input, enter_explore_mode, rhack } from './cmd.js';
import { is_pool } from './dbridge.js';
import { decl_globals_init, nhcb_name, program_state_init } from './decl.js';
import { do_vicinity_map, dosearch0, warnreveal } from './detect.js';
import { clear_glyph_buffer, curs_on_u, docrt, flush_screen, reset_glyphmap, see_monsters, see_objects, see_traps, swallowed, under_ground, under_water } from './display.js';
import { deferred_goto, hellish_smoke_mesg, save_currentstate, schedule_goto } from './do.js';
import { find_ac, glibr, set_wear } from './do_wear.js';
import { makedog } from './dog.js';
import { obj_delivery } from './dokick.js';
import { assign_level, depth, find_level, init_dungeons, on_level, print_level_annotation } from './dungeon.js';
import { gethungry, maybe_finished_meal, reset_eat } from './eat.js';
import { done, done1 } from './end.js';
import { read_engr_at, u_wipe_engr } from './engrave.js';
import { maybe_shuffle_customizations } from './glyphs.js';
import { check_special_room, domove, end_running, lookaround, monster_nearby, near_capacity, nomul, notice_all_mons, overexert_hp, pooleffects, runmode_delay_output, unmul } from './hack.js';
import { align_str } from './insight.js';
import { reroll_menu, update_inventory } from './invent.js';
import { makemon } from './makemon.js';
import { mklev } from './mklev.js';
import { fumaroles, movebubbles } from './mkmaze.js';
import { clear_splitobjs, dobjsfree } from './mkobj.js';
import { mcalcdistress, mcalcmove, mnexto, movemon, see_nearby_monsters } from './mon.js';
import { m_everyturn_effect } from './monmove.js';
import { monst_globals_init } from './monst.js';
import { A_CON, A_DEX, A_INT, A_WIS, BLINDED, CLAIRVOYANT, CQ_CANNED, CQ_REPEAT, ENERGY_REGENERATION, ESCAPED, EXT_ENCUMBER, FAST, GLIB, HALF_PHDAM, HALLUC, HALLUC_RES, HVY_ENCUMBER, LOW_PM, MAGICAL_BREATHING, MOD_ENCUMBER, NHCB_END_TURN, NHCORE_MOVELOOP_TURN, NHCORE_RESTORE_OLD_GAME, NHCORE_START_NEW_GAME, NHLpa_panic, NON_PM, NUMMONS, PM_WIZARD, POLYMORPH, POLY_NOFLAGS, REGENERATION, RUN_TPORT, SEARCHING, SLEEPY, SLT_ENCUMBER, S_EEL, TELEPAT, TELEPORT, TT_LAVA, UNCHANGING, UNENCUMBERED, UTOTYPE_NONE, WARNING, WARN_OF_MON, fuzzer_impossible_panic, gm_newgame } from './nh-constants.js';
import { init_objects } from './o_init.js';
import { objects_globals_init } from './objects.js';
import { ask_do_tutorial } from './options.js';
import { encumber_msg, pickup, reset_justpicked } from './pickup.js';
import { Norep, livelog_printf, nhassert_failed, urgent_pline } from './pline.js';
import { polyself, rehumanize, set_uasmon, udeadinside, ugenocided } from './polyself.js';
import { com_pager } from './questpgr.js';
import { any_visible_region, run_regions } from './region.js';
import { crashreport_init } from './report.js';
import { rn2, rnd } from './rnd.js';
import { Hello, genders, role_init } from './role.js';
import { fix_shop_damage } from './shk.js';
import { activate_chosen_soundlib, dosounds } from './sounds.js';
import { age_spells } from './spell.js';
import { u_on_upstairs } from './stairs.js';
import { sys_early_init } from './sys.js';
import { tele } from './teleport.js';
import { do_storms, nh_timeout } from './timeout.js';
import { initrack, settrack } from './track.js';
import { sink_into_lava } from './trap.js';
import { u_init_inventory_attrs, u_init_misc, u_init_skills_discoveries } from './u_init.js';
import { invault } from './vault.js';
import { vision_recalc, vision_reset } from './vision.js';
import { you_were } from './were.js';
import { adjust_menu_promptstyle } from './windows.js';
import { amulet, intervene } from './wizard.js';
import { sanity_check } from './wizcmds.js';
import { clear_bypasses } from './worn.js';
import { makewish } from './zap.js';

/*ARGSUSED*/
export function early_init(argc, argv) {
    program_state_init();
    /* Do this as early as possible, but let ports do other things first. */
    crashreport_init(argc, argv);
    decl_globals_init();
    objects_globals_init();
    monst_globals_init();
    sys_early_init();
    runtime_info_init();
}
export function moveloop_preamble(resuming) {
    fnEnter("moveloop_preamble", "allmain.c", 0);
    /* if a save file created in normal mode is now being restored in
       explore mode, treat it as normal restore followed by 'X' command
       to use up the save file and require confirmation for explore mode */
    if (resuming && game.iflags.deferred_X) {
        enter_explore_mode();
    }
    /* side-effects from the real world */
    game.flags.moonphase = phase_of_the_moon();
    if (game.flags.moonphase == 4) {
        You("are lucky!  Full moon tonight.");
        change_luck(1);
    } else if (game.flags.moonphase == 0) {
        pline("Be careful!  New moon tonight.");
    }
    game.flags.friday13 = friday_13th();
    if (game.flags.friday13) {
        pline("Watch out!  Bad things can happen on Friday the 13th.");
        change_luck(-1);
    }
    if (!resuming) {
        game.program_state.beyond_savefile_load = 1;
        game.context.rndencode = rnd(9000);
        /* for side-effects of starting gear */
        set_wear(null);
        reset_justpicked(game.invent);
        /* autopickup at initial location */
        pickup(1);
        /* only matters if someday a character is able to start with
           clairvoyance (wizard with cornuthaum perhaps?); without this,
           first "random" occurrence would always kick in on turn 1 */
        game.context.seer_turn = rnd(30);
        /* give hero initial movement points; new game only--for restore,
           pending movement points were included in the save file */
        game.u.umovement = 12;
        initrack();
    }
    /* make sure welcome messages are given before noticing monsters */
    game.disp.botlx = (1);
    if (resuming) {
        read_engr_at(game.u.ux, game.u.uy);
        fix_shop_damage();
    }
    /* in case they auto-picked up something */
    encumber_msg();
    if (game.defer_see_monsters) {
        game.defer_see_monsters = (0);
        see_monsters();
    }
    game.u.uz0.dlevel = game.u.uz.dlevel;
    game.context.move = 0;
    if (game.iflags.fuzzerpending) {
        /* finish processing "--debug:fuzzer" from the command line */
        game.iflags.debug_fuzzer = fuzzer_impossible_panic;
        game.iflags.fuzzerpending = (0);
    }
    game.program_state.in_moveloop = 1;
    /* for perm_invent preset at startup, display persistent inventory after
       invent is fully populated and the in_moveloop flag has been set */
    if (game.iflags.perm_invent) {
        update_inventory();
    }
}
export function u_calc_moveamt(wtcap) {
    fnEnter("u_calc_moveamt", "allmain.c", 0);
    let moveamt = 0;
    if (game.u.usteed && game.u.umoved) {
        /* calculate how much time passed. */
        /* your speed doesn't augment steed's speed */
        moveamt = mcalcmove(game.u.usteed, (1));
    } else {
        moveamt = game.youmonst.data.mmove;
        if (((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic)) {
            /* speed boots, potion, or spell */
            /* gain a free action on 2/3 of turns */
            if (rn2(3) != 0) {
                moveamt += 12;
            }
        } else if ((game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic)) {
            /* gain a free action on 1/3 of turns */
            if (rn2(3) == 0) {
                moveamt += 12;
            }
        }
    }
    switch (wtcap) {
        case UNENCUMBERED:
            break;
        case SLT_ENCUMBER:
            moveamt -= (Math.trunc(moveamt / 4));
            break;
        case MOD_ENCUMBER:
            moveamt -= (Math.trunc(moveamt / 2));
            break;
        case HVY_ENCUMBER:
            moveamt -= (Math.trunc((moveamt * 3) / 4));
            break;
        case EXT_ENCUMBER:
            moveamt -= (Math.trunc((moveamt * 7) / 8));
            break;
        default:
            break;
    }
    game.u.umovement += moveamt;
    if (game.u.umovement < 0) {
        game.u.umovement = 0;
    }
}
/* small chance of generating a new random monster */
export function maybe_generate_rnd_mon() {
    fnEnter("maybe_generate_rnd_mon", "allmain.c", 0);
    if (!rn2(game.u.uevent.udemigod ? 25 : (depth(game.u.uz) > depth((game.dungeon_topology.d_stronghold_level))) ? 50 : 70)) {
        makemon(null, 0, 0, 0);
    }
}
game.mvl_wtcap = 0;
game.mvl_change = 0;
export async function moveloop_core() {
    fnEnter("moveloop_core", "allmain.c", 0);
    let monscanmove = (0);
    if (game.program_state.done_hup) {
        end_of_input();
    }
    (game.windowprocs.win_get_nh_event)();
    if (game.iflags.pending_customizations) {
        maybe_shuffle_customizations();
    }
    dobjsfree();
    if (game.context.bypasses) {
        clear_bypasses();
    }
    if (game.iflags.sanity_check || game.iflags.debug_fuzzer) {
        sanity_check();
    }
    if (game.context.resume_wish) {
        makewish();
    }
    if (game.context.move) {
        game.u.umovement -= 12;
        do {
            /* hero can't move this turn loop */
            /* although we checked for encumbrance above, we need to
           check again for message purposes, as the weight of
           inventory may have changed in, e.g., nh_timeout(); we do
           need two checks here so that the player gets feedback
           immediately if their own action encumbered them */
            encumber_msg();
            game.context.mon_moving = (1);
            do {
                monscanmove = movemon();
                if (game.u.umovement >= 12) {
                    break;
                }
            } while (monscanmove);
            game.context.mon_moving = (0);
            /* this needs to be after the monster movement loop in
               case monster actions affected burden, e.g. rehumanize */
            game.mvl_wtcap = near_capacity();
            if (!monscanmove && game.u.umovement < 12) {
                /* both hero and monsters are out of steam this round */
                let mtmp = null;
                game.were_changes = 0;
                /* adjust monsters' trap, blind, etc */
                mcalcdistress();
                /* reallocate movement rations to monsters; don't need
                   to skip dead monsters here because they will have
                   been purged at end of their previous round of moving */
                for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
                    mtmp.movement += mcalcmove(mtmp, (1));
                }
                /* occasionally add another monster; since this takes
                   place after movement has been allotted, the new
                   monster effectively loses its first turn */
                maybe_generate_rnd_mon();
                u_calc_moveamt(game.mvl_wtcap);
                settrack();
                game.moves++;
                if (game.moves >= 1000000000) {
                    (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
                    /*
                 * Never allow 'moves' to grow big enough to wrap.
                 * We don't care what the maximum possible 'long int'
                 * is for the current configuration, we want a value
                 * that is the same for all viable configurations.
                 * When imposing the limit, use a mystic decimal value
                 * instead of a magic binary one such as 0x7fffffffL.
                 */
                    urgent_pline("The dungeon capitulates.");
                    done(ESCAPED);
                }
                /* 'moves' is misnamed; it represents turns; hero_seq is
                   a value that is distinct every time the hero moves */
                game.hero_seq = game.moves << 3;
                if (game.flags.time && !game.context.run) {
                    game.disp.time_botl = (1);
                }
                /********************************/
                /* once-per-turn things go here */
                l_nhcore_call(NHCORE_MOVELOOP_TURN);
                if (game.u.uprops[GLIB].intrinsic) {
                    glibr();
                }
                nh_timeout();
                run_regions();
                if (game.u.ublesscnt) {
                    game.u.ublesscnt--;
                }
                if (game.u.uinvulnerable) {
                    /* One possible result of prayer is healing.  Whether or
                 * not you get healed depends on your current hit points.
                 * If you are allowed to regenerate during the prayer,
                 * the end-of-prayer calculation messes up on this.
                 * Another possible result is rehumanization, which
                 * requires that encumbrance and movement rate be
                 * recalculated.
                 */
                    /* for the moment at least, you're in tiptop shape */
                    game.mvl_wtcap = UNENCUMBERED;
                } else if (!(game.u.umonnum != game.u.umonster) ? (game.u.uhp < game.u.uhpmax) : (game.u.mh < game.u.mhmax || game.youmonst.data.mlet == S_EEL)) {
                    regen_hp(game.mvl_wtcap);
                }
                if (game.mvl_wtcap > MOD_ENCUMBER && game.u.umoved) {
                    if (!(game.mvl_wtcap < EXT_ENCUMBER ? game.moves % 30 : game.moves % 10)) {
                        /* moving around while encumbered is hard work */
                        overexert_hp();
                    }
                }
                regen_pw(game.mvl_wtcap);
                if (!game.u.uinvulnerable) {
                    if ((game.u.uprops[TELEPORT].intrinsic || game.u.uprops[TELEPORT].extrinsic) && !rn2(85)) {
                        let old_ux = game.u.ux;
                        let old_uy = game.u.uy;
                        tele();
                        if (game.u.ux != old_ux || game.u.uy != old_uy) {
                            if (!next_to_u()) {
                                check_leash(old_ux, old_uy);
                            }
                            /* clear doagain keystrokes */
                            cmdq_clear(CQ_CANNED);
                            cmdq_clear(CQ_REPEAT);
                        }
                    }
                    /* delayed change may not be valid anymore */
                    if ((game.mvl_change == 1 && !(game.u.uprops[POLYMORPH].intrinsic || game.u.uprops[POLYMORPH].extrinsic)) || (game.mvl_change == 2 && game.u.ulycn == NON_PM)) {
                        game.mvl_change = 0;
                    }
                    if ((game.u.uprops[POLYMORPH].intrinsic || game.u.uprops[POLYMORPH].extrinsic) && !rn2(100)) {
                        game.mvl_change = 1;
                    } else if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS) && !(game.u.umonnum != game.u.umonster) && !rn2(80 - (20 * night()))) {
                        game.mvl_change = 2;
                    }
                    if (game.mvl_change && !(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                        if (game.multi >= 0) {
                            stop_occupation();
                            if (game.mvl_change == 1) {
                                polyself(POLY_NOFLAGS);
                            } else {
                                you_were();
                            }
                            game.mvl_change = 0;
                        }
                    }
                }
                if ((game.u.uprops[SEARCHING].intrinsic || game.u.uprops[SEARCHING].extrinsic) && !game.level.flags.noautosearch && game.multi >= 0) {
                    dosearch0(1);
                }
                if ((game.u.uprops[WARNING].intrinsic || game.u.uprops[WARNING].extrinsic)) {
                    warnreveal();
                }
                if (game.were_changes) {
                    /* update innate intrinsics (mainly Drain_resistance) */
                    set_uasmon();
                }
                mkot_trap_warn();
                dosounds();
                do_storms();
                gethungry();
                age_spells();
                exerchk();
                invault();
                if (game.u.uhave.amulet) {
                    amulet();
                }
                if (!rn2(40 + ((acurr(A_DEX)) * 3))) {
                    u_wipe_engr(rnd(3));
                }
                if (game.u.uevent.udemigod && !game.u.uinvulnerable) {
                    if (game.u.udg_cnt) {
                        game.u.udg_cnt--;
                    }
                    if (!game.u.udg_cnt) {
                        intervene();
                        game.u.udg_cnt = (rn2(200) + (50));
                    }
                }
                /* XXX This should be recoded to use something like regions - a list of
 * things that are active and need to be handled that is dynamically
 * maintained and not a list of special cases. */
                /* vision will be updated as bubbles move */
                if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
                    movebubbles();
                } else if (game.level.flags.fumaroles) {
                    fumaroles();
                }
                if (game.multi < 0) {
                    /* when immobile, count is in turns */
                    runmode_delay_output();
                    if (++game.multi == 0) {
                        unmul(null);
                        /* if unmul caused a level change, take it now */
                        if (game.u.utotype) {
                            await deferred_goto();
                        }
                    }
                }
            }
        } while (game.u.umovement < 12);
        /******************************************/
        /* once-per-hero-took-time things go here */
        /* moves*8 + n for n == 1..7 */
        game.hero_seq++;
        encumber_msg();
        if (game.iflags.hilite_delta) {
            status_eval_next_unhilite();
        }
        if (game.moves >= game.context.seer_turn) {
            if ((game.u.uhave.amulet || ((game.u.uprops[CLAIRVOYANT].intrinsic || game.u.uprops[CLAIRVOYANT].extrinsic) && !game.u.uprops[CLAIRVOYANT].blocked)) && !((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && !game.u.uprops[CLAIRVOYANT].blocked) {
                do_vicinity_map(null);
            }
            /* we maintain this counter even when clairvoyance isn't
               taking place; on average, go again 30 turns from now */
            /* [it used to be that on every 15th turn, there was a 50%
               chance of farsight, so it could happen as often as every
               15 turns or theoretically never happen at all; but when
               a fast hero got multiple moves on that 15th turn, it
               could actually happen more than once on the same turn!] */
            game.context.seer_turn = game.moves + (rn2(31) + (15));
        }
        /* [fast hero who gets multiple moves per turn ends up sinking
           multiple times per turn; is that what we really want?] */
        if (game.u.utrap && game.u.utraptype == TT_LAVA) {
            sink_into_lava();
        } else if (!game.u.umoved) {
            pooleffects((0));
        }
        /* vision while buried or underwater is updated here */
        if ((game.u.uinwater)) {
            under_water(0);
        } else if (game.u.uburied) {
            under_ground(0);
        }
        see_nearby_monsters();
    }
    /****************************************/
    /* once-per-player-input things go here */
    clear_splitobjs();
    if (game.u.uhave.amulet && !game.u.uevent.amulet_wish) {
        /* when/if hero escapes from lava, he can't just stay there */
        /* the Amulet of Yendor gives a wish when initially picked up */
        game.u.uevent.amulet_wish = 1;
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
        urgent_pline("The Amulet is bestowing a wish upon you!");
        makewish();
    }
    find_ac();
    if (!game.context.mv || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            /* redo monsters if hallu or wearing a helm of telepathy */
            /* this is needed for the case where you saw a monster
                      due to being next to it while it's in a gas cloud
                      and then you moved away; it should no longer be seen
                      when that happens, even if it hasn't moved */
            see_monsters();
            see_objects();
            see_traps();
            if (game.u.uswallow) {
                swallowed(0);
            }
        } else if ((game.u.uprops[TELEPAT].extrinsic) || (game.u.uprops[WARNING].intrinsic || game.u.uprops[WARNING].extrinsic) || (game.u.uprops[WARN_OF_MON].intrinsic || game.u.uprops[WARN_OF_MON].extrinsic) || any_visible_region()) {
            see_monsters();
        }
        if (game.vision_full_recalc) {
            vision_recalc(0);
        }
    }
    if (game.disp.botl || game.disp.botlx) {
        bot();
        curs_on_u();
    } else if (game.disp.time_botl) {
        timebot();
        curs_on_u();
    }
    m_everyturn_effect(game.youmonst);
    game.context.move = 1;
    if (game.multi >= 0 && game.occupation) {
        if ((game.occupation)() == 0) {
            game.occupation = null;
        }
        if (monster_nearby()) {
            stop_occupation();
            reset_eat();
        }
        runmode_delay_output();
        return;
    }
    game.u.umoved = (0);
    if (game.multi > 0) {
        lookaround();
        runmode_delay_output();
        if (!game.multi) {
            /* lookaround may clear multi */
            game.context.move = 0;
            return;
        }
        if (game.context.mv) {
            if (game.multi < 80 && !--game.multi) {
                end_running((1));
            }
            domove();
        } else {
            --game.multi;
            ((!!(game.command_count != 0)) || (nhassert_failed("gc.command_count != 0", "/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/allmain.c", 529) , 0));
            rhack(game.cmd_key);
        }
    } else if (game.multi == 0) {
        ckmailstatus();
        rhack(0);
    }
    if (game.u.utotype) {
        await deferred_goto();
    }
    if (game.vision_full_recalc) {
        vision_recalc(0);
    }
    (game.windowprocs.win_cliparound)(game.u.ux, game.u.uy);
    if ((!game.context.run || game.flags.runmode == RUN_TPORT) && (game.multi && (!game.context.travel ? !(game.multi % 7) : !(game.moves % 7)))) {
        /* after rhack() and vision_recalc() so that the map is redrawn
       once with correct vision data, not twice (overshoot+correct) */
        /* when running in non-tport mode, this gets done through domove() */
        if (game.flags.time && game.context.run) {
            game.disp.botl = (1);
        }
        /* [should this be flush_screen() instead?] */
        (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (0));
    }
    if (game.luacore && game.nhcb_counts[NHCB_END_TURN]) {
        lua_getglobal(game.luacore, "nh_callback_run");
        lua_pushstring(game.luacore, nhcb_name[NHCB_END_TURN]);
        await nhl_pcall_handle(game.luacore, 1, 0, "moveloop_core", NHLpa_panic);
        lua_settop(game.luacore, 0);
    }
}
export async function maybe_do_tutorial() {
    let sp = find_level("tut-1");
    if (!sp) {
        return;
    }
    if (ask_do_tutorial()) {
        assign_level(game.u.ucamefrom, game.u.uz);
        game.iflags.nofollowers = (1);
        schedule_goto(sp.dlevel, UTOTYPE_NONE, "Entering the tutorial.", null);
        await deferred_goto();
        vision_recalc(0);
        docrt();
        game.iflags.nofollowers = (0);
    }
}
export async function moveloop(resuming) {
    moveloop_preamble(resuming);
    if (!resuming) {
        await maybe_do_tutorial();
    }
    for (; ; ) {
        await moveloop_core();
    }
}
export function regen_pw(wtcap) {
    if (game.u.uen < game.u.uenmax && ((wtcap < MOD_ENCUMBER && (!(game.moves % (Math.trunc((30 + 8 - game.u.ulevel) * ((game.urole.mnum == (PM_WIZARD)) ? 3 : 4) / 6))))) || (game.u.uprops[ENERGY_REGENERATION].intrinsic || game.u.uprops[ENERGY_REGENERATION].extrinsic))) {
        let upper = Math.trunc(((acurr(A_WIS)) + (acurr(A_INT))) / 15) + 1;
        if (game.u.uprops[MAGICAL_BREATHING].extrinsic) {
            upper += 2;
        }
        game.u.uen += (rn2(upper) + (1));
        if (game.u.uen > game.u.uenmax) {
            game.u.uen = game.u.uenmax;
        }
        game.disp.botl = (1);
        if (game.u.uen == game.u.uenmax) {
            interrupt_multi("You feel full of energy.");
        }
    }
}
/* maybe recover some lost health (or lose some when an eel out of water) */
export function regen_hp(wtcap) {
    let heal = 0;
    let reached_full = (0);
    let encumbrance_ok = (wtcap < MOD_ENCUMBER || !game.u.umoved);
    if ((game.u.umonnum != game.u.umonster)) {
        if (game.u.mh < 1) {
            rehumanize();
        } else if (game.youmonst.data.mlet == S_EEL && !is_pool(game.u.ux, game.u.uy) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !(game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0))) {
            /* eel out of water loses hp, similar to monster eels;
               as hp gets lower, rate of further loss slows down */
            if (game.u.mh > 1 && !(game.u.uprops[REGENERATION].intrinsic || game.u.uprops[REGENERATION].extrinsic) && rn2(game.u.mh) > rn2(8) && (!(game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic) || !(game.moves % 2))) {
                heal = -1;
            }
        } else if (game.u.mh < game.u.mhmax) {
            if (((game.u.uprops[REGENERATION].intrinsic || game.u.uprops[REGENERATION].extrinsic) || ((game.u.uprops[SLEEPY].intrinsic || game.u.uprops[SLEEPY].extrinsic) && game.u.usleep)) || (encumbrance_ok && !(game.moves % 20))) {
                heal = 1;
            }
        }
        if (heal) {
            game.disp.botl = (1);
            game.u.mh += heal;
            reached_full = (game.u.mh == game.u.mhmax);
        }
    } else {
        if (game.u.uhp < game.u.uhpmax && (encumbrance_ok || ((game.u.uprops[REGENERATION].intrinsic || game.u.uprops[REGENERATION].extrinsic) || ((game.u.uprops[SLEEPY].intrinsic || game.u.uprops[SLEEPY].extrinsic) && game.u.usleep)))) {
            /* [when this code was in-line within moveloop(), there was
           no !Upolyd check here, so poly'd hero recovered lost u.uhp
           once u.mh reached u.mhmax; that may have been convenient
           for the player, but it didn't make sense for gameplay...] */
            heal = (game.u.ulevel + (acurr(A_CON))) > rn2(100);
            if (((game.u.uprops[REGENERATION].intrinsic || game.u.uprops[REGENERATION].extrinsic) || ((game.u.uprops[SLEEPY].intrinsic || game.u.uprops[SLEEPY].extrinsic) && game.u.usleep))) {
                heal += 1;
            }
            if ((game.u.uprops[SLEEPY].intrinsic || game.u.uprops[SLEEPY].extrinsic) && game.u.usleep) {
                heal++;
            }
            if (heal) {
                game.disp.botl = (1);
                game.u.uhp += heal;
                if (game.u.uhp > game.u.uhpmax) {
                    game.u.uhp = game.u.uhpmax;
                }
                /* stop voluntary multi-turn activity if now fully healed */
                reached_full = (game.u.uhp == game.u.uhpmax);
            }
        }
    }
    if (reached_full) {
        interrupt_multi("You are in full health.");
    }
}
export function stop_occupation() {
    if (game.occupation) {
        if (!maybe_finished_meal((1))) {
            You("stop %s.", game.occtxt);
        }
        game.occupation = null;
        game.disp.botl = (1);
        nomul(0);
    } else if (game.multi >= 0) {
        nomul(0);
    }
    cmdq_clear(CQ_CANNED);
}
export function init_sound_disp_gamewindows() {
    let menu_behavior = 0;
    activate_chosen_soundlib();
    if (game.iflags.wc_splash_screen && !game.flags.randomall) {
        ;
    } else {
        ;
    }
    /* init_nhwindows() has already been called, so before
       creating the windows, check to see if there are any
       palette entries to alter */
    game.WIN_MESSAGE = (game.windowprocs.win_create_nhwindow)(1);
    if (((game.windowprocs.wincap2 & (8 | 128)) != 0)) {
        /* ToDo: new splash screen invocation will go here */
        status_initialize((0));
    } else {
        game.WIN_STATUS = (game.windowprocs.win_create_nhwindow)(2);
    }
    game.WIN_MAP = (game.windowprocs.win_create_nhwindow)(3);
    game.WIN_INVEN = (game.windowprocs.win_create_nhwindow)(4);
    if (game.WIN_INVEN != (-1)) {
        adjust_menu_promptstyle(game.WIN_INVEN, game.iflags.menu_headings);
    }
    (game.windowprocs.win_start_menu)(game.WIN_INVEN, menu_behavior) , (game.windowprocs.win_end_menu)(game.WIN_INVEN, null);
    (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
    /* in case of early quit where WIN_INVEN could be destroyed before
       ever having been used, use it here to pacify the Qt interface */
    /* This _is_ the right place for this - maybe we will
     * have to split init_sound_disp_gamewindows into
     * create_gamewindows and show_gamewindows to get rid of this ifdef...
     */
    /*
     * The mac port is not DEPENDENT on the order of these
     * displays, but it looks a lot better this way...
     */
    clear_glyph_buffer();
    (game.windowprocs.win_display_nhwindow)(game.WIN_MAP, (0));
}
export async function newgame() {
    fnEnter("newgame", "allmain.c", 0);
    let i = 0;
    do {
        game.a11y.mon_notices_blocked++;
    } while (0);
    game.disp.botlx = (1);
    /* id 1 is reserved for gy.youmonst */
    game.context.ident = 2;
    game.context.warnlevel = 1;
    game.context.next_attrib_check = 600;
    game.context.tribute.enabled = (1);
    game.context.tribute.tributesz = 1 /* sizeof(struct tribute_info) */;
    get_nhuuid();
    for (i = LOW_PM; i < NUMMONS; i++) {
        game.mvitals[i].mvflags = game.mons[i].geno & 16;
    }
    init_objects();
    /* role_init() will reset this */
    game.flags.pantheon = -1;
    /* must be before init_dungeons(), u_init(),
                          * and init_artifacts() */
    role_init();
    /* must be before u_init() to avoid rndmonst()
                       * creating odd monsters for any tins and eggs
                       * in hero's initial inventory */
    await init_dungeons();
    /* before u_init() in case $WIZKIT specifies
                       * any artifacts */
    init_artifacts();
    u_init_misc();
    /* create a Lua state that lasts until end of game */
    l_nhcore_init();
    reset_glyphmap(gm_newgame);
    signal(2, done1);
    if (game.iflags.news) {
        (game.windowprocs.win_display_file)("news", (0));
    }
    /* quest_init();  --  Now part of role_init() */
    await mklev();
    u_on_upstairs();
    /* set up internals for level (after mklev) */
    vision_reset();
    check_special_room((0));
    if ((game.level.monsters[game.u.ux][game.u.uy] != null)) {
        mnexto((game.level.monsters[game.u.ux][game.u.uy]), 4);
    }
    makedog();
    u_init_inventory_attrs();
    docrt();
    flush_screen(1);
    bot();
    while (game.u.uroleplay.reroll && reroll_menu()) {
        u_init_inventory_attrs();
        bot();
    }
    u_init_skills_discoveries();
    if (game.flags.debug) {
        read_wizkit();
        obj_delivery((0));
    }
    if (game.flags.legacy) {
        com_pager(game.u.uroleplay.pauper ? "pauper_legacy" : "legacy");
    }
    game.urealtime.realtime = 0;
    game.urealtime.start_timing = getnow();
    save_currentstate();
    game.program_state.something_worth_saving++;
    welcome((1));
    do {
        if (--game.a11y.mon_notices_blocked < 0) {
            impossible("mon_notices_blocked<0");
            game.a11y.mon_notices_blocked = 0;
        }
    } while (0);
    if (game.a11y.glyph_updates) {
        dolookaround();
    /* now we can notice monsters */
    } else {
        notice_all_mons((1));
    }
    return;
}
/* show "welcome [back] to NetHack" message at program startup */
/* false => restoring an old game */
export function welcome(new_game) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let currentgend = (game.u.umonnum != game.u.umonster) ? game.u.mfemale : game.flags.female;
    let adrift = (game.u.ualign.type != game.u.ualignbase[0]);
    l_nhcore_call(new_game ? NHCORE_START_NEW_GAME : NHCORE_RESTORE_OLD_GAME);
    if (!new_game && (game.u.umonnum != game.u.umonster) && ugenocided()) {
        /* skip "welcome back" if restoring a doomed character */
        /* death via self-genocide is pending */
        pline("You're back, but you still feel %s inside.", udeadinside());
        return;
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        pline("NetHack is filmed in front of an undead studio audience.");
    }
    /*
     * The "welcome back" message always describes your innate form
     * even when polymorphed or wearing a helm of opposite alignment.
     * Alignment is shown unconditionally for new games; for restores
     * it's only shown if it has changed from its original value.
     * Sex is shown for new games except when it is redundant; for
     * restores it's only shown if different from its original value.
     */
    buf = '';
    /*
     * 2026-04-24
     * GitHub issue https://github.com/NetHack/NetHack/issues/537
     * "Judging by the comment above, it should display your new alignment
     *  if it was changed, so align_str(u.ualignbase[A_CURRENT]) would
     *  probably be more appropriate. This won't affect the new game message."
     *
     * That is followed by a suggestion to revisit the matter (paraphrased):
     * "That's actually intentional; the comment oversimplifies.
     *  When it was implemented, it may have been the only way to tell that
     *  you had converted alignment. Now ^X mentions your starting alignment
     *  if base alignment has been changed, so revisiting this welcome back
     *  message."
     */
    if (new_game || game.u.ualignbase[1] != game.u.ualignbase[0] || adrift) {
        buf = (buf || '') + sprintf('', " %s%s", adrift ? "adrift " : "", adrift ? align_str(game.u.ualign.type) : align_str(game.u.ualignbase[0]));
    }
    if (!game.urole.name.f && (new_game ? (game.urole.allow & 61440) == (4096 | 8192) : currentgend != game.flags.initgend)) {
        buf = (buf || '') + sprintf('', " %s", genders[currentgend].adj);
    }
    buf = (buf || '') + sprintf('', " %s %s", game.urace.adj, (currentgend && game.urole.name.f) ? game.urole.name.f : game.urole.name.m);
    pline(new_game ? "%s %s, welcome to NetHack!  You are a%s." : "%s %s, the%s, welcome back to NetHack!", Hello(null), game.plname, buf);
    if (new_game) {
        /* guarantee that 'major' event category is never empty */
        livelog_printf(2, "%s the%s entered the dungeon", game.plname, buf);
    } else {
        /* if restoring in Gehennom, give same hot/smoky message as when
           first entering it */
        hellish_smoke_mesg();
        /* remind player of the level annotation, like in goto_level() */
        print_level_annotation();
    }
}
/* FIXME: this will break if any coordinate is too big for (char);
       the sys/msdos/vid*.c code uses (unsigned char) which is less
       vulnerable but not guaranteed to be able to hold coordxy values;
       also, there doesn't appear to be any need for this to be static,
       nor to contain pairs of (> or <) and x; it could just be a full
       line of spaces and > or < characters with update_positionbar()
       revised to reconstruct the x values for non-space characters */
/* TODO: use the same method as getpos() so objects don't cover stairs */
/* FIXME: traversing 'stairs' list ignores mimics that pose as stairs */
/* hero location */
/* fence post */
export function interrupt_multi(msg) {
    if (game.multi > 0 && !game.context.travel && !game.context.run) {
        nomul(0);
        if (game.flags.verbose && msg) {
            Norep("%s", msg);
        }
    }
}
/* convert from time_t to number of seconds */
export function timet_to_seconds(ttim) {
    /* for Unix-based and Posix-compliant systems, a cast to 'long' would
       suffice but the C Standard doesn't require time_t to be that simple */
    return timet_delta(ttim, 0);
}
/* calculate the difference in seconds between two time_t values */
/* end and start times */
export function timet_delta(etim, stim) {
    /* difftime() is a STDC routine which returns the number of seconds
       between two time_t values as a 'double' */
    return difftime(etim, stim);
}
/*allmain.c*/
