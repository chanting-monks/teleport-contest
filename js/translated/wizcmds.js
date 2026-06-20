/* NetHack 5.0	wizcmds.c	$NHDT-Date: 1736530208 2025/01/10 09:30:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.21 $ */
/*-Copyright (c) Robert Patrick Rankin, 2024. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { load_lua } from '../c2js-runtime/lua.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, pline } from '../c2js-runtime/pline.js';
import { qsort , qsort_async } from '../c2js-runtime/qsort.js';
import { __nh_buf_append, nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, __nh_char_write, atoi, strcat, strchr, strcmp, strcpy, strlen, strncmp, strncmpi } from '../c2js-runtime/string.js';
import { bc_sanity_check } from './ball.js';
import { cmd_from_func, ecname_from_fn, getdir, levltyp, makemap_prepost, paranoid_query, unavailcmd, yn_function } from './cmd.js';
import { c_common_strings, cg, ynchars, ynqchars } from './decl.js';
import { do_mapping, findit } from './detect.js';
import { canseemon, docrt, glyph_at, map_engraving, map_invisible, map_trap, nul_glyphinfo, sensemon, unmap_invisible } from './display.js';
import { minimal_monnam, mon_nam, x_monnam } from './do_name.js';
import { keepdogs, migrate_to_level } from './dog.js';
import { hurtle, mhurtle } from './dothrow.js';
import { defsyms } from './drawing.js';
import { In_W_tower, Invocation_lev, Is_botlevel, Is_special, On_W_tower_level, assign_level, depth, get_level, ledger_no, on_level, overview_stats, print_dungeon } from './dungeon.js';
import { done } from './end.js';
import { engr_stats, engraving_sanity_check } from './engrave.js';
import { losexp, pluslvl } from './exper.js';
import { getpos } from './getpos.js';
import { fill_glyphid_cache, free_glyphid_cache, glyph_to_cmap, glyphid_cache_status, wizcustom_glyphids } from './glyphs.js';
import { may_dig, pooleffects } from './hack.js';
import { dist2, mungspaces, strkitten, strsubst, upstart } from './hacklib.js';
import { check_invent_gold, display_inventory } from './invent.js';
import { light_sources_sanity_check, light_stats } from './light.js';
import { makemon, rndmonst } from './makemon.js';
import { mklev } from './mklev.js';
import { obj_sanity_check } from './mkobj.js';
import { dmonsfree, mon_sanity_check, mongone, monkilled, rescham, usmellmon, xkilled } from './mon.js';
import { mstrength, olfaction } from './mondata.js';
import { ARM, BLINDED, CONFUSION, CORPSE, CORR, DBWALL, DEAF, DIED, DOOR, FIRE_RES, FIRST_OBJECT, FLYING, GLIB, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, GLYPH_ZAP_OFF, HALLUC, HALLUC_RES, LEVITATION, MAX_GLYPH, NEUTRAL, NUMMONS, NUM_OBJECTS, PM_GRID_BUG, PM_MANES, PM_SAMURAI, POLY_CONTROLLED, PRIMARYSET, PROT_FROM_SHAPE_CHANGERS, ROOM, SDOOR, SICK, SLIMED, STATUE, STONE, STONED, STUNNED, S_GOLEM, S_VORTEX, S_digbeam, S_fountain, S_goodpos, S_rslant, S_sink, S_vbeam, UTOTYPE_NONE, VOMITING, WARN_OF_MON, WWALKING, fuzzer_impossible_continue, fuzzer_impossible_panic, wp_tty } from './nh-constants.js';
import { encumber_msg } from './pickup.js';
import { There } from './pline.js';
import { body_part, float_vs_flight, polyself } from './polyself.js';
import { make_blinded, make_deaf, make_glib, make_hallucinated, make_sick, make_slimed, make_stoned, make_stunned, make_vomiting } from './potion.js';
import { create_particular } from './read.js';
import { region_stats } from './region.js';
import { rn2 } from './rnd.js';
import { genders } from './role.js';
import { rumor_check } from './rumors.js';
import { setpaid } from './shk.js';
import { flip_level, flip_level_rnd, load_special, lspo_finalize_level, lspo_reset_level } from './sp_lev.js';
import { level_tele } from './teleport.js';
import { property_by_index, timer_sanity_check, timer_stats } from './timeout.js';
import { trap_sanity_check } from './trap.js';
import { does_block, get_viz_clear } from './vision.js';
import { add_menu, add_menu_heading, add_menu_str, getlin, select_menu } from './windows.js';
import { size_wseg } from './worm.js';
import { check_wornmask_slots } from './worn.js';
import { makewish } from './zap.js';

/* cmd.c [27] */
/* cmd.c */
/* #wizwish command - wish for something */
/* Unlimited wishes for debug mode by Paul Polderman */
export async function wiz_wish() {
    if (game.flags.debug) {
        let save_verbose = game.flags.verbose;
        game.flags.verbose = (0);
        await makewish();
        game.flags.verbose = save_verbose;
        await encumber_msg();
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_wish));
    }
    /* distinction between ECMD_CANCEL and ECMD_OK is unimportant here */
    return 0;
}
/* #wizidentify command - reveal and optionally identify hero's inventory */
export async function wiz_identify() {
    if (game.flags.debug) {
        game.iflags.override_ID = cmd_from_func(wiz_identify);
        /* command remapping might leave #wizidentify as the only way
           to invoke us, in which case cmd_from_func() will yield NUL;
           it won't matter to display_inventory()/display_pickinv()
           if ^I invokes some other command--what matters is that
           display_pickinv() and xname() see override_ID as nonzero */
        if (!game.iflags.override_ID) {
            game.iflags.override_ID = (31 & (73));
        }
        await display_inventory(null, (0));
        game.iflags.override_ID = 0;
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_identify));
    }
    return 0;
}
/* used when wiz_makemap() gets rid of monsters for the old incarnation of
   a level before creating a new incarnation of it */
export async function makemap_unmakemon(mtmp, migratory) {
    let ndx = ((mtmp.data).pmidx);
    /* uncreate any unique monster so that it is eligible to be remade
       on the new incarnation of the level; ignores DEADMONSTER() [why?] */
    if (mtmp.data.geno & 4096) {
        game.mvitals[ndx].mvflags &= ~1;
    }
    if (game.mvitals[ndx].born) {
        game.mvitals[ndx].born--;
    }
    if (mtmp.isgd) {
        /* vault is going away; get rid of guard who might be in play or
       be parked at <0,0>; for the latter, might already be flagged as
       dead but is being kept around because of the 'isgd' flag */
        /* after this, fall through to mongone() */
        mtmp.isgd = 0;
    } else if (((mtmp).mhp < 1)) {
        /* already set to be discarded */
        return;
    } else if (mtmp.isshk && on_level(game.u.uz, ((mtmp).mextra.eshk).shoplevel)) {
        await setpaid(mtmp);
    }
    if (migratory) {
        /* caller has removed 'mtmp' from migrating_mons; put it onto fmon
           so that dmonsfree() bookkeeping for number of dead or removed
           monsters won't get out of sync; it is not on the map but
           mongone() -> m_detach() -> mon_leaving_level() copes with that */
        mtmp.mstate |= 1;
        mtmp.mstate &= ~(4 | 8 | 64);
        mtmp.nmon = game.level.monlist;
        game.level.monlist = mtmp;
    }
    await mongone(mtmp);
}
/* get rid of the all the monsters on--or intimately involved with--current
   level; used when #wizmakemap destroys the level before replacing it */
export async function makemap_remove_mons() {
    let mtmp = null;
    let mprev__parent = null;
    let mprev__field = null;
    await keepdogs((1));
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        /* get rid of all the monsters that didn't make it to 'mydogs' */
        /* if already dead, dmonsfree(below) will get rid of it */
        if (((mtmp).mhp < 1)) {
            continue;
        }
        await makemap_unmakemon(mtmp, (0));
    }
    for ((mprev__parent = game, mprev__field = "migrating_mons"); (mtmp = mprev__parent[mprev__field]) != null; ) {
        if (mtmp.mextra && ((mtmp.isshk && on_level(game.u.uz, ((mtmp).mextra.eshk).shoplevel)) || (mtmp.ispriest && on_level(game.u.uz, ((mtmp).mextra.epri).shrlevel)) || (mtmp.isgd && on_level(game.u.uz, ((mtmp).mextra.egd).gdlevel)))) {
            /* some monsters retain details of this level in mon->mextra; that
       data becomes invalid when the level is replaced by a new one;
       get rid of them now if migrating or already arrived elsewhere;
       [when on their 'home' level, the previous loop got rid of them;
       if they aren't actually migrating but have been placed on some
       'away' level, such monsters are treated like the Wizard:  kept
       on migrating monsters list, scheduled to migrate back to their
       present location instead of being saved with whatever level they
       happen to be on; see keepdogs() and keep_mon_accessible(dog.c)] */
            mprev__parent[mprev__field] = mtmp.nmon;
            await makemap_unmakemon(mtmp, (1));
        } else {
            (mprev__parent = mtmp, mprev__field = "nmon");
        }
    }
    await dmonsfree();
    if (game.level.monlist) {
        await impossible("makemap_remove_mons: 'fmon' did not get emptied?");
    }
    return;
}
/* #wizmakemap - discard current dungeon level and replace with a new one */
export async function wiz_makemap() {
    if (game.flags.debug) {
        let was_in_W_tower = await In_W_tower(game.u.ux, game.u.uy, game.u.uz);
        await makemap_prepost((1), was_in_W_tower);
        await mklev();
        await makemap_prepost((0), was_in_W_tower);
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_makemap));
    }
    return 0;
}
/* the #wizmap command - reveal the level map
   and any traps or engravings on it */
export async function wiz_map() {
    if (game.flags.debug) {
        let t = null;
        let ep = null;
        let save_Hconf = game.u.uprops[CONFUSION].intrinsic;
        let save_Hhallu = game.u.uprops[HALLUC].intrinsic;
        do {
            game.a11y.mon_notices_blocked++;
        } while (0);
        game.u.uprops[CONFUSION].intrinsic = game.u.uprops[HALLUC].intrinsic = 0;
        for (t = game.ftrap; t != null; t = t.ntrap) {
            t.tseen = 1;
            await map_trap(t, (1));
        }
        for (ep = game.head_engr; ep != null; ep = ep.nxt_engr) {
            await map_engraving(ep, (1));
        }
        await do_mapping();
        do {
            if (--game.a11y.mon_notices_blocked < 0) {
                await impossible("mon_notices_blocked<0");
                game.a11y.mon_notices_blocked = 0;
            }
        } while (0);
        game.u.uprops[CONFUSION].intrinsic = save_Hconf;
        game.u.uprops[HALLUC].intrinsic = save_Hhallu;
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_map));
    }
    return 0;
}
/* #wizgenesis - generate monster(s); a count prefix will be honored */
export async function wiz_genesis() {
    if (game.flags.debug) {
        let mongen_saved = game.iflags.debug_mongen;
        game.iflags.debug_mongen = (0);
        await create_particular();
        game.iflags.debug_mongen = mongen_saved;
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_genesis));
    }
    return 0;
}
/* #wizwhere command - display dungeon layout */
export async function wiz_where() {
    if (game.flags.debug) {
        await print_dungeon((0), null, null);
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_where));
    }
    return 0;
}
/* the #wizdetect command - detect secret doors, traps, hidden monsters */
export async function wiz_detect() {
    if (game.flags.debug) {
        await findit();
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_detect));
    }
    return 0;
}
/* the #wizkill command - pick targets and reduce them to 0HP;
   by default, the hero is credited/blamed; use 'm' prefix to avoid that */
export async function wiz_kill() {
    let mtmp = null;
    let cc = { x: 0, y: 0 };
    let ans = 0;
    let c = 0;
    let qbuf = '';
    let prompt = "Pick first monster to slay";
    let save_verbose = game.flags.verbose;
    let save_autodescribe = game.iflags.autodescribe;
    let uarehere = game.u.uz;
    cc.x = game.u.ux , cc.y = game.u.uy;
    for (; ; ) {
        await pline("%s:", prompt);
        prompt = "Next monster";
        game.flags.verbose = (0);
        game.iflags.autodescribe = (1);
        ans = await getpos(cc, (1), "a monster");
        game.flags.verbose = save_verbose;
        game.iflags.autodescribe = save_autodescribe;
        if (ans < 0 || cc.x < 1) {
            break;
        }
        mtmp = null;
        if (((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
            if (game.u.usteed) {
                qbuf = sprintf(qbuf, "Kill %.110s?", await mon_nam(game.u.usteed));
                if ((c = await yn_function(qbuf, ynqchars, 113, (1))) == 113) {
                    break;
                }
                if (c == 121) {
                    mtmp = game.u.usteed;
                }
            }
            if (!mtmp) {
                qbuf = sprintf(qbuf, "%s?", (game.urole.mnum == (PM_SAMURAI)) ? "Perform seppuku" : "Commit suicide");
                if (await paranoid_query((1), qbuf)) {
                    game.killer.name = sprintf(game.killer.name, "%s own player", (genders[game.flags.female ? 1 : 0].his));
                    game.killer.format = 1;
                    await done(DIED);
                }
                break;
            }
        } else if (game.u.uswallow) {
            mtmp = (dist2(((cc.x)), ((cc.y)), game.u.ux, game.u.uy) <= 2) ? game.u.ustuck : null;
        } else {
            mtmp = (game.level.monsters[cc.x][cc.y]);
        }
        await unmap_invisible(cc.x, cc.y);
        if (mtmp) {
            /* we don't require that the monster be seen or sensed so
               we issue our own message in order to name it in case it
               isn't; note that if it triggers other kills, those might
               be referred to as "it" */
            let tame = !!mtmp.mtame;
            let seen = ((canseemon(mtmp) || sensemon(mtmp)) || (game.u.uswallow && mtmp == game.u.ustuck));
            let flgs = (1 | 4 | ((tame && ((mtmp).mextra && ((mtmp).mextra.mgivenname))) ? 8 : 0));
            let articl = tame ? 3 : seen ? 1 : 2;
            let adjs = tame ? (!seen ? "poor, unseen" : "poor") : (!seen ? "unseen" : null);
            let Mn = await x_monnam(mtmp, articl, adjs, flgs, (0));
            if (!game.iflags.menu_requested) {
                await You("%s %s!", ((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) ? "destroy" : "kill", Mn);
                await xkilled(mtmp, 1);
            } else {
                /* we know that monsters aren't moving because player has
                   just issued this #wizkill command, but if 'mtmp' is a
                   gas spore whose explosion kills any other monsters we
                   need to have the mon_moving flag be True in order to
                   avoid blaming or crediting hero for their deaths */
                game.context.mon_moving = (1);
                await pline("%s is %s.", upstart(Mn), ((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) ? "destroyed" : "killed");
                await monkilled(mtmp, null, 0);
                game.context.mon_moving = (0);
            }
            /* end targetting loop if an engulfer dropped hero onto a level-
               changing trap */
            if (game.u.utotype || !on_level(game.u.uz, uarehere)) {
                break;
            }
        } else {
            await There("is no monster there.");
            break;
        }
    }
    await dmonsfree();
    return 0;
}
/* the #wizloadlua command - load an arbitrary lua file */
export async function wiz_load_lua() {
    if (game.flags.debug) {
        let buf = '';
        /* Large but not unlimited memory and CPU so random bits of
             * code can be tested by wizards. */
        let sbi = { flags: 2147483648 | 134217728, memlimit: 16 * 1024 * 1024, steps: 0, perpcall: 16 * 1024 * 1024 };
        /* in case EDIT_GETLIN is enabled */
        buf = '';
        buf = await getlin("Load which lua file?", buf);
        if (__nh_char_at0(buf) == 27 || __nh_char_at0(buf) == 0) {
            return 2;
        }
        if (!strchr(buf, 46)) {
            buf = strcat(buf, ".lua");
        }
        await load_lua(buf, sbi);
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_load_lua));
    }
    return 0;
}
/* the #wizloaddes command - load a special level lua file */
export async function wiz_load_splua() {
    if (game.flags.debug) {
        let buf = '';
        buf = '';
        buf = await getlin("Load which des lua file?", buf);
        if (__nh_char_at0(buf) == 27 || __nh_char_at0(buf) == 0) {
            return 2;
        }
        if (!strchr(buf, 46)) {
            buf = strcat(buf, ".lua");
        }
        await lspo_reset_level(null);
        await load_special(buf);
        await lspo_finalize_level(null);
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_load_splua));
    }
    return 0;
}
/* the #wizlevelport command - level teleport */
export async function wiz_level_tele() {
    if (game.flags.debug) {
        await level_tele();
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_level_tele));
    }
    return 0;
}
/* #wizfliplevel - transpose the current level */
const __wiz_flip_level_choices = "0123";
const __wiz_flip_level_prmpt = "Flip 0=randomly, 1=vertically, 2=horizontally, 3=both:";
export async function wiz_flip_level() {
    if (game.flags.debug) {
        let c = await yn_function(__wiz_flip_level_prmpt, __wiz_flip_level_choices, 0, (1));
        if (c && strchr(__wiz_flip_level_choices, c)) {
            c -= 48;
            if (!c) {
                await flip_level_rnd(3, (1));
            } else {
                await flip_level(c, (1));
            }
            await docrt();
        } else {
            await pline("%s", c_common_strings.c_Never_mind);
        }
    }
    return 0;
}
/* #levelchange command - adjust hero's experience level */
export async function wiz_level_change() {
    let buf = '';
    let dummy = 0;
    let newlevel = 0;
    let ret = 0;
    buf = '';
    buf = await getlin("To what experience level do you want to be set?", buf);
    buf = mungspaces(buf);
    if (__nh_char_at0(buf) == 27 || __nh_char_at0(buf) == 0) {
        ret = 0;
    } else {
        ret = sscanf(buf, "%d%c", newlevel, dummy);
    }
    if (ret != 1) {
        await pline("%s", c_common_strings.c_Never_mind);
        return 0;
    }
    if (newlevel == game.u.ulevel) {
        await You("are already that experienced.");
    } else if (newlevel < game.u.ulevel) {
        if (game.u.ulevel == 1) {
            await You("are already as inexperienced as you can get.");
            return 0;
        }
        if (newlevel < 1) {
            newlevel = 1;
        }
        while (game.u.ulevel > newlevel) {
            await losexp("#levelchange");
        }
    } else {
        if (game.u.ulevel >= 30) {
            await You("are already as experienced as you can get.");
            return 0;
        }
        if (newlevel > 30) {
            newlevel = 30;
        }
        while (game.u.ulevel < newlevel) {
            await pluslvl((0));
        }
    }
    /* blessed full healing or restore ability won't fix any lost levels */
    game.u.ulevelmax = game.u.ulevel;
    return 0;
}
/* #wiztelekinesis */
export async function wiz_telekinesis() {
    let ans = 0;
    let cc = { x: 0, y: 0 };
    let mtmp = null;
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    await pline("Pick a monster to hurtle.");
    do {
        ans = await getpos(cc, (1), "a monster");
        if (ans < 0 || cc.x < 1) {
            return 2;
        }
        if ((((mtmp = (game.level.monsters[cc.x][cc.y])) != null) && (canseemon(mtmp) || sensemon(mtmp))) || ((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
            if (!await getdir("which direction?")) {
                return 2;
            }
            if (mtmp) {
                await mhurtle(mtmp, game.u.dx, game.u.dy, 6);
                if (!((mtmp).mhp < 1) && (canseemon(mtmp) || sensemon(mtmp))) {
                    cc.x = mtmp.mx;
                    cc.y = mtmp.my;
                }
            } else {
                await hurtle(game.u.dx, game.u.dy, 6, (0));
                cc.x = game.u.ux , cc.y = game.u.uy;
            }
        }
    } while (game.u.utotype == UTOTYPE_NONE);
    return 0;
}
/* #panic command - test program's panic handling */
export async function wiz_panic() {
    if (game.iflags.debug_fuzzer) {
        game.u.uhp = game.u.uhpmax = 1000;
        game.u.uen = game.u.uenmax = 1000;
        return 0;
    }
    if (await paranoid_query((1), "Do you want to call panic() and end your game?")) {
        await panic("Crash test (#panic).");
    }
    return 0;
}
/* #debugfuzzer command - fuzztest the program */
export async function wiz_fuzzer() {
    if (game.flags.suppress_alert < ((3 << 24) | (7 << 16) | (0 << 8) | (0))) {
        await pline("The fuzz tester will make NetHack execute random keypresses.");
        await There("is no conventional way out of this mode.");
    }
    if (await paranoid_query((1), "Do you want to start fuzz testing?")) {
        if (await yn_function("Do you want to call panic() after impossible()?", ynchars, 110, (1)) == 110) {
            game.iflags.debug_fuzzer = fuzzer_impossible_continue;
        } else {
            game.iflags.debug_fuzzer = fuzzer_impossible_panic;
        }
    }
    return 0;
}
/* #polyself command - change hero's form */
export async function wiz_polyself() {
    await polyself(POLY_CONTROLLED);
    return 0;
}
/* #seenv command */
export async function wiz_show_seenv() {
    let win = 0;
    let x = 0;
    let y = 0;
    let startx = 0;
    let stopx = 0;
    let curx = 0;
    let v = 0;
    let row = '';
    /*
     * Possible extension:  choose between showing discrepancies,
     * showing all monsters, or monsters within a particular class.
     */
    win = (game.windowprocs.win_create_nhwindow)(5);
    /*
     * Each seenv description takes up 2 characters, so center
     * the seenv display around the hero.
     */
    startx = ((1) > (game.u.ux - (Math.trunc(80 / 4))) ? (1) : (game.u.ux - (Math.trunc(80 / 4))));
    stopx = ((startx + (Math.trunc(80 / 2))) < (80) ? (startx + (Math.trunc(80 / 2))) : (80));
    /* can't have a line exactly 80 chars long */
    if (stopx - startx == Math.trunc(80 / 2)) {
        startx++;
    }
    for (y = 0; y < 21; y++) {
        for (x = startx , curx = 0; x < stopx; x++ , curx += 2) {
            if (((x) == game.u.ux && (y) == game.u.uy)) {
                (row = __nh_char_write(row, curx + 1, 64), row = __nh_char_write(row, curx, 64));
            } else {
                v = game.level.locations[x][y].seenv & 255;
                if (v == 0) {
                    (row = __nh_char_write(row, curx + 1, 32), row = __nh_char_write(row, curx, 32));
                } else {
                    sprintf({ get value() { return __nh_char_at0(__nh_advance_str(row, curx)); }, set value(_v) { __nh_char_at0(__nh_advance_str(row, curx)) = _v; } }, "%02x", v);
                }
            }
        }
        for (x = curx - 1; x >= 0; x--) {
            if (__nh_char_at0(__nh_advance_str(row, x)) != 32) {
                break;
            }
        }
        row = __nh_char_write(row, x + 1, 0);
        (game.windowprocs.win_putstr)(win, 0, row);
    }
    await (game.windowprocs.win_display_nhwindow)(win, (1));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* #vision command */
export async function wiz_show_vision() {
    let win = 0;
    let x = 0;
    let y = 0;
    let v = 0;
    let row = '';
    win = (game.windowprocs.win_create_nhwindow)(5);
    row = sprintf(row, "Flags: 0x%x could see, 0x%x in sight, 0x%x temp lit", 1, 2, 4);
    (game.windowprocs.win_putstr)(win, 0, row);
    (game.windowprocs.win_putstr)(win, 0, "");
    for (y = 0; y < 21; y++) {
        for (x = 1; x < 80; x++) {
            if (((x) == game.u.ux && (y) == game.u.uy)) {
                row = __nh_char_write(row, x, 64);
            } else {
                /* data access should be hidden */
                v = game.viz_array[y][x];
                row = __nh_char_write(row, x, (v == 0) ? 32 : (48 + v));
            }
        }
        for (x = 80 - 1; x >= 1; x--) {
            if (__nh_char_at0(__nh_advance_str(row, x)) != 32) {
                break;
            }
        }
        row = __nh_char_write(row, x + 1, 0);
        /* map column 0, levl[0][], is off the left edge of the screen */
        (game.windowprocs.win_putstr)(win, 0, __nh_char_at0(__nh_advance_str(row, 1)));
    }
    await (game.windowprocs.win_display_nhwindow)(win, (1));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* #wmode command */
export async function wiz_show_wmodes() {
    let win = 0;
    let x = 0;
    let y = 0;
    let row = '';
    let lev = null;
    let istty = (game.windowprocs.wp_id == wp_tty);
    win = (game.windowprocs.win_create_nhwindow)(5);
    /* map row 0, levl[][0], is drawn on the second line of tty screen */
    if (istty) {
        (game.windowprocs.win_putstr)(win, 0, "");
    }
    for (y = 0; y < 21; y++) {
        for (x = 0; x < 80; x++) {
            /* tty only: blank top line */
            lev = game.level.locations[x][y];
            if (((x) == game.u.ux && (y) == game.u.uy)) {
                row = __nh_char_write(row, x, 64);
            } else if (((lev.typ) && (lev.typ) <= DBWALL) || lev.typ == SDOOR) {
                row = __nh_char_write(row, x, 48 + (lev.flags & 7));
            } else if (lev.typ == CORR) {
                row = __nh_char_write(row, x, 35);
            } else if (((lev.typ) >= ROOM) || ((lev.typ) == DOOR)) {
                row = __nh_char_write(row, x, 46);
            } else {
                row = __nh_char_write(row, x, 120);
            }
        }
        row = __nh_char_write(row, 80, 0);
        (game.windowprocs.win_putstr)(win, 0, __nh_char_at0(__nh_advance_str(row, 1)));
    }
    await (game.windowprocs.win_display_nhwindow)(win, (1));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* wizard mode variant of #terrain; internal levl[][].typ values in base-36 */
export async function wiz_map_levltyp() {
    let win = 0;
    let x = 0;
    let y = 0;
    let terrain = 0;
    let row = '';
    let istty = !strcmp(game.windowprocs.name, "tty");
    win = (game.windowprocs.win_create_nhwindow)(5);
    if (istty) {
        (game.windowprocs.win_putstr)(win, 0, "");
    }
    for (y = 0; y < 21; y++) {
        for (x = 1; x < 80; x++) {
            /* map column 0, levl[0][], is off the left edge of the screen;
           it should always have terrain type "undiggable stone" */
            terrain = game.level.locations[x][y].typ;
            /* assumes there aren't more than 10+26+26 terrain types */
            row = __nh_char_write(row, x - 1, ((terrain == STONE && !may_dig(x, y)) ? 42 : (terrain < 10) ? 48 + terrain : (terrain < 36) ? 97 + terrain - 10 : 65 + terrain - 36));
        }
        x--;
        if (game.level.locations[0][y].typ != STONE || may_dig(0, y)) {
            row = __nh_char_write(row, x++, 33);
        }
        row = __nh_char_write(row, x, 0);
        (game.windowprocs.win_putstr)(win, 0, row);
    }
{
        let dsc = '';
        let slev = Is_special(game.u.uz);
        dsc = sprintf(dsc, "D:%d,L:%d", game.u.uz.dnum, game.u.uz.dlevel);
        if (slev) {
            dsc = __nh_buf_append(dsc, sprintf('', " \"%s\"", slev.proto));
            /* [dungeon branch features currently omitted] */
            /* special level flags (note: dungeon.def doesn't set `maze'
               or `hell' for any specific levels so those never show up) */
            if (slev.flags.maze_like) {
                dsc = strcat(dsc, " mazelike");
            }
            if (slev.flags.hellish) {
                dsc = strcat(dsc, " hellish");
            }
            if (slev.flags.town) {
                dsc = strcat(dsc, " town");
            }
            /* alignment currently omitted to save space */
            if (slev.flags.rogue_like) {
                dsc = strcat(dsc, " roguelike");
            }
        }
        if (game.level.flags.nfountains) {
            dsc = __nh_buf_append(dsc, sprintf('', " %c:%d", defsyms[S_fountain].sym, game.level.flags.nfountains));
        }
        if (game.level.flags.nsinks) {
            dsc = __nh_buf_append(dsc, sprintf('', " %c:%d", defsyms[S_sink].sym, game.level.flags.nsinks));
        }
        if (game.level.flags.has_vault) {
            dsc = strcat(dsc, " vault");
        }
        if (game.level.flags.has_shop) {
            dsc = strcat(dsc, " shop");
        }
        if (game.level.flags.has_temple) {
            dsc = strcat(dsc, " temple");
        }
        if (game.level.flags.has_court) {
            dsc = strcat(dsc, " throne");
        }
        if (game.level.flags.has_zoo) {
            dsc = strcat(dsc, " zoo");
        }
        if (game.level.flags.has_morgue) {
            dsc = strcat(dsc, " morgue");
        }
        if (game.level.flags.has_barracks) {
            dsc = strcat(dsc, " barracks");
        }
        if (game.level.flags.has_beehive) {
            dsc = strcat(dsc, " hive");
        }
        if (game.level.flags.has_swamp) {
            dsc = strcat(dsc, " swamp");
        }
        if (game.level.flags.noteleport) {
            dsc = strcat(dsc, " noTport");
        }
        if (game.level.flags.hardfloor) {
            dsc = strcat(dsc, " noDig");
        }
        if (game.level.flags.nommap) {
            dsc = strcat(dsc, " noMMap");
        }
        if (!game.level.flags.hero_memory) {
            dsc = strcat(dsc, " noMem");
        }
        if (game.level.flags.shortsighted) {
            dsc = strcat(dsc, " shortsight");
        }
        if (game.level.flags.graveyard) {
            dsc = strcat(dsc, " graveyard");
        }
        if (game.level.flags.is_maze_lev) {
            dsc = strcat(dsc, " maze");
        }
        if (game.level.flags.is_cavernous_lev) {
            dsc = strcat(dsc, " cave");
        }
        if (game.level.flags.arboreal) {
            dsc = strcat(dsc, " tree");
        }
        if (game.level.flags.sokoban_rules) {
            dsc = strcat(dsc, " sokoban-rules");
        }
        /* non-flag info; probably should include dungeon branching
           checks (extra stairs and magic portals) here */
        if (Invocation_lev(game.u.uz)) {
            dsc = strcat(dsc, " invoke");
        }
        if (On_W_tower_level(game.u.uz)) {
            dsc = strcat(dsc, " tower");
        }
        if (game.u.uz.dnum == 0) {
            dsc = strcat(dsc, " dungeon");
        } else if (game.u.uz.dnum == (game.dungeon_topology.d_mines_dnum)) {
            dsc = strcat(dsc, " mines");
        } else if (((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum))) {
            dsc = strcat(dsc, " sokoban");
        } else if (game.u.uz.dnum == (game.dungeon_topology.d_quest_dnum)) {
            dsc = strcat(dsc, " quest");
        } else if ((((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level))))) {
            dsc = strcat(dsc, " ludios");
        } else if (game.u.uz.dnum == 1) {
            dsc = strcat(dsc, " gehennom");
        } else if (game.u.uz.dnum == (game.dungeon_topology.d_tower_dnum)) {
            dsc = strcat(dsc, " vlad");
        } else if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
            dsc = strcat(dsc, " endgame");
        } else {
            /* somebody's added a dungeon branch we're not expecting */
            let brname = game.dungeons[game.u.uz.dnum].dname;
            if (!brname || !__nh_char_at0(brname)) {
                brname = "unknown";
            }
            if (!strncmpi(brname, "the ", 4)) {
                brname = __nh_advance_str(brname, 4);
            }
            dsc = __nh_buf_append(dsc, sprintf('', " %s", brname));
        }
        /* limit the line length to map width */
        if (strlen(dsc) >= 80) {
            dsc = __nh_char_write(dsc, 80 - 1, 0);
        }
        (game.windowprocs.win_putstr)(win, 0, dsc);
    }
    await (game.windowprocs.win_display_nhwindow)(win, (1));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return;
}
/* explanation of base-36 output from wiz_map_levltyp() */
export async function wiz_levltyp_legend() {
    let win = 0;
    let i = 0;
    let j = 0;
    let last = 0;
    let c = 0;
    let dsc = null;
    let fmt = null;
    let buf = '';
    win = (game.windowprocs.win_create_nhwindow)(5);
    (game.windowprocs.win_putstr)(win, 0, "#terrain encodings:");
    (game.windowprocs.win_putstr)(win, 0, "");
    /* TODO: include tab-separated variant for win32 */
    fmt = " %c - %-28s";
    buf = '';
    /* output in pairs, left hand column holds [0],[1],...,[N/2-1]
       and right hand column holds [N/2],[N/2+1],...,[N-1];
       N ('last') will always be even, and may or may not include
       the empty string entry to pad out the final pair, depending
       upon how many other entries are present in levltyp[] */
    last = (Math.trunc(312 /* sizeof(const char *[39]) */ / 8 /* sizeof(const char *) */)) & ~1;
    for (i = 0; i < Math.trunc(last / 2); ++i) {
        for (j = i; j < last; j += Math.trunc(last / 2)) {
            dsc = levltyp[j];
            c = !__nh_char_at0(dsc) ? 32 : !strncmp(dsc, "unreachable", 11) ? 42 : (j < 10) ? 48 + j : (j < 36) ? 97 + j - 10 : 65 + j - 36;
            buf = __nh_buf_append(buf, sprintf('', fmt, c, dsc));
            if (j > i) {
                (game.windowprocs.win_putstr)(win, 0, buf);
                /* same int-to-char conversion as wiz_map_levltyp() */
                buf = '';
            }
        }
    }
    await (game.windowprocs.win_display_nhwindow)(win, (1));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return;
}
/* #wizsmell command - test usmellmon(). */
export async function wiz_smell() {
    let mtmp = null;
    let mptr = null;
    let ans = 0;
    let glyph = 0;
    let cc = { x: 0, y: 0 };
    let is_you = 0;
    cc.x = game.u.ux;
    cc.y = game.u.uy;
    if (!olfaction(game.youmonst.data)) {
        await You("are incapable of detecting odors in your present form.");
        return 0;
    }
    await You("can move the cursor to a monster that you want to smell.");
    do {
        await pline("Pick a monster to smell.");
        ans = await getpos(cc, (1), "a monster");
        if (ans < 0 || cc.x < 0) {
            return 2;
        }
        is_you = (0);
        if (((cc.x) == game.u.ux && (cc.y) == game.u.uy)) {
            if (game.u.usteed) {
                mptr = game.u.usteed.data;
            } else {
                mptr = game.youmonst.data;
                is_you = (1);
            }
        } else if ((mtmp = (game.level.monsters[cc.x][cc.y])) != null) {
            mptr = mtmp.data;
        } else {
            mptr = null;
        }
        /* Buglet: mapping or unmapping "remembered, unseen monster" should
           cause time to elapse; since we're in wizmode, don't bother */
        glyph = glyph_at(cc.x, cc.y);
        if (mptr) {
            if (is_you) {
                await You("surreptitiously sniff under your %s.", await body_part(ARM));
            }
            if (!await usmellmon(mptr)) {
                await pline("%s to not give off any smell.", is_you ? "You seem" : "That monster seems");
            }
            if (!((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
                await map_invisible(cc.x, cc.y);
            }
        } else {
            await You("don't smell any monster there.");
            if (((glyph) == GLYPH_INVIS_OFF)) {
                await unmap_invisible(cc.x, cc.y);
            }
        }
    } while ((1));
    return 0;
}
/* #wizinstrinsic command to set some intrinsics for testing */
const __wiz_intrinsic_wizintrinsic = "#wizintrinsic";
const __wiz_intrinsic_fmt = "You are%s %s.";
export async function wiz_intrinsic() {
    if (game.flags.debug) {
        let win = 0;
        let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
        let buf = '';
        let i = 0;
        let j = 0;
        let n = 0;
        let amt = 0;
        let typ = 0;
        let p = 0;
        let oldtimeout = 0;
        let newtimeout = 0;
        let propname = null;
        let pick_list = null;
        let clr = 8;
        Object.assign(any, cg.zeroany);
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        if (game.iflags.cmdassist) {
            buf = sprintf(buf, "[Precede any selection with a count to increment by other than %d.]", 30);
            await add_menu_str(win, buf);
        }
        for (i = 0; (propname = property_by_index(i, { get value() { return p; }, set value(_v) { p = _v; } })) != null; ++i) {
            if (p == HALLUC_RES) {
                /* start menu with a subtitle */
                /* Grayswandir vs hallucination; ought to be redone to
                   use u.uprops[HALLUC].blocked instead of being treated
                   as a separate property; letting in be manually toggled
                   even only in wizard mode would be asking for trouble... */
                continue;
            }
            if (p == FIRE_RES) {
                await add_menu_str(win, "--");
            }
            any.a_int = i + 1;
            oldtimeout = game.u.uprops[p].intrinsic & 16777215;
            if (oldtimeout) {
                buf = sprintf(buf, "%-27s [%li]", propname, oldtimeout);
            } else {
                buf = sprintf(buf, "%s", propname);
            }
            await add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        }
        (game.windowprocs.win_end_menu)(win, "Which intrinsics?");
        n = await select_menu(win, 2, { get value() { return pick_list; }, set value(_v) { pick_list = _v; } });
        (game.windowprocs.win_destroy_nhwindow)(win);
        for (j = 0; j < n; ++j) {
            i = pick_list[j].item.a_int - 1;
            propname = property_by_index(i, { get value() { return p; }, set value(_v) { p = _v; } });
            oldtimeout = game.u.uprops[p].intrinsic & 16777215;
            amt = (pick_list[j].count == -1) ? 30 : pick_list[j].count;
            if (amt <= 0) {
                continue;
            }
            newtimeout = oldtimeout + amt;
            switch (p) {
                case SICK:
                case SLIMED:
                case STONED:
                    if (oldtimeout > 0 && newtimeout > oldtimeout) {
                        newtimeout = oldtimeout;
                    }
                    break;
            }
            switch (p) {
                case BLINDED:
                    await make_blinded(newtimeout, (1));
                    break;
                /* make_confused() only gives feedback when confusion is
             * ending so use the 'default' case for it instead */
                case DEAF:
                    await make_deaf(newtimeout, (1));
                    break;
                case HALLUC:
                    await make_hallucinated(newtimeout, (1), 0);
                    break;
                case SICK:
                    typ = !rn2(2) ? 1 : 2;
                    await make_sick(newtimeout, __wiz_intrinsic_wizintrinsic, (1), typ);
                    break;
                case SLIMED:
                    buf = sprintf(buf, __wiz_intrinsic_fmt, !game.u.uprops[SLIMED].intrinsic ? "" : " still", "turning into slime");
                    await make_slimed(newtimeout, buf);
                    break;
                case STONED:
                    buf = sprintf(buf, __wiz_intrinsic_fmt, !game.u.uprops[STONED].intrinsic ? "" : " still", "turning into stone");
                    await make_stoned(newtimeout, buf, 1, __wiz_intrinsic_wizintrinsic);
                    break;
                case STUNNED:
                    await make_stunned(newtimeout, (1));
                    break;
                case VOMITING:
                    buf = sprintf(buf, __wiz_intrinsic_fmt, !game.u.uprops[VOMITING].intrinsic ? "" : " still", "vomiting");
                    await make_vomiting(newtimeout, (0));
                    await pline("%s", buf);
                    break;
                case WARN_OF_MON:
                    if (!(game.u.uprops[WARN_OF_MON].intrinsic || game.u.uprops[WARN_OF_MON].extrinsic)) {
                        game.context.warntype.speciesidx = PM_GRID_BUG;
                        game.context.warntype.species = game.mons[game.context.warntype.speciesidx];
                    }
                    if (p != GLIB) {
                        incr_itimeout({ get value() { return game.u.uprops[p].intrinsic; }, set value(_v) { game.u.uprops[p].intrinsic = _v; } }, amt);
                    }
                    /* have pline() do a status update */
                    game.disp.botl = (1);
                    await pline("Timeout for %s %s %d.", propname, oldtimeout ? "increased by" : "set to", amt);
                    break;
                case GLIB:
                    make_glib(newtimeout);
                    ;
                default:
                    if (p != GLIB) {
                        incr_itimeout({ get value() { return game.u.uprops[p].intrinsic; }, set value(_v) { game.u.uprops[p].intrinsic = _v; } }, amt);
                    }
                    game.disp.botl = (1);
                    await pline("Timeout for %s %s %d.", propname, oldtimeout ? "increased by" : "set to", amt);
                    break;
            }
            /* this has to be after incr_itimeout() */
            if (p == LEVITATION || p == FLYING) {
                float_vs_flight();
            } else if (p == PROT_FROM_SHAPE_CHANGERS) {
                await rescham();
            }
            if (p == WWALKING || p == LEVITATION || p == FLYING) {
                if (game.u.uinwater) {
                    await pooleffects((0));
                }
            }
        }
        if (n >= 1) {
            free(pick_list);
        }
        await docrt();
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_intrinsic));
    }
    return 0;
}
/* #wizrumorcheck command - verify each rumor access */
export async function wiz_rumor_check() {
    await rumor_check();
    return 0;
}
/*
 * wizard mode sanity_check code
 */
const template = "%-27s  %4ld  %6ld";
const stats_hdr = "                             count  bytes";
const stats_sep = "---------------------------  ----- -------";
export function size_obj(otmp) {
    let sz = 1 /* sizeof(struct obj) */;
    if (otmp.oextra) {
        sz += 1 /* sizeof(struct oextra) */;
        if (((otmp).oextra.oname)) {
            sz += strlen(((otmp).oextra.oname)) + 1;
        }
        if (((otmp).oextra.omonst)) {
            sz += size_monst(((otmp).oextra.omonst), (0));
        }
        /* sz += (int) sizeof (unsigned); -- now part of oextra itself */
        if (((otmp).oextra.omailcmd)) {
            sz += strlen(((otmp).oextra.omailcmd)) + 1;
        }
    }
    return sz;
}
export function count_obj(chain, total_count, total_size, top, recurse) {
    let count = 0;
    let size = 0;
    let obj = null;
    for (count = size = 0 , obj = chain; obj; obj = obj.nobj) {
        if (top) {
            count++;
            size += size_obj(obj);
        }
        if (recurse && obj.cobj) {
            count_obj(obj.cobj, total_count, total_size, (1), (1));
        }
    }
    total_count.value += count;
    total_size.value += size;
}
/* RESTORE_WARNING follows wiz_show_stats */
export function obj_chain(win, src, chain, force, total_count, total_size) {
    let buf = '';
    let count = 0;
    let size = 0;
    count_obj(chain, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } }, (1), (0));
    if (count || size || force) {
        total_count.value += count;
        total_size.value += size;
        buf = sprintf(buf, template, src, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
}
export function mon_invent_chain(win, src, chain, total_count, total_size) {
    let buf = '';
    let count = 0;
    let size = 0;
    let mon = null;
    for (mon = chain; mon; mon = mon.nmon) {
        count_obj(mon.minvent, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } }, (1), (0));
    }
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        buf = sprintf(buf, template, src, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
}
export function contained_stats(win, src, total_count, total_size) {
    let buf = '';
    let count = 0;
    let size = 0;
    let mon = null;
    count_obj(game.invent, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } }, (0), (1));
    count_obj(game.level.objlist, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } }, (0), (1));
    count_obj(game.level.buriedobjlist, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } }, (0), (1));
    count_obj(game.migrating_objs, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } }, (0), (1));
    /* DEADMONSTER check not required in this loop since they have no
     * inventory */
    for (mon = game.level.monlist; mon; mon = mon.nmon) {
        count_obj(mon.minvent, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } }, (0), (1));
    }
    for (mon = game.migrating_mons; mon; mon = mon.nmon) {
        count_obj(mon.minvent, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } }, (0), (1));
    }
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        buf = sprintf(buf, template, src, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
}
export function size_monst(mtmp, incl_wsegs) {
    let sz = 1 /* sizeof(struct monst) */;
    if (mtmp.wormno && incl_wsegs) {
        sz += size_wseg(mtmp);
    }
    if (mtmp.mextra) {
        sz += 1 /* sizeof(struct mextra) */;
        if (((mtmp).mextra.mgivenname)) {
            sz += strlen(((mtmp).mextra.mgivenname)) + 1;
        }
        if (((mtmp).mextra.egd)) {
            sz += 1 /* sizeof(struct egd) */;
        }
        if (((mtmp).mextra.epri)) {
            sz += 1 /* sizeof(struct epri) */;
        }
        if (((mtmp).mextra.eshk)) {
            sz += 1 /* sizeof(struct eshk) */;
        }
        if (((mtmp).mextra.emin)) {
            sz += 1 /* sizeof(struct emin) */;
        }
        if (((mtmp).mextra.edog)) {
            sz += 1 /* sizeof(struct edog) */;
        }
        /* mextra->mcorpsenm doesn't point to more memory */
        if (((mtmp).mextra.ebones)) {
            sz += 1 /* sizeof(struct ebones) */;
        }
    }
    return sz;
}
export function mon_chain(win, src, chain, force, total_count, total_size) {
    let buf = '';
    let count = 0;
    let size = 0;
    let mon = null;
    /* mon->wormno means something different for migrating_mons and mydogs */
    let incl_wsegs = !strncmpi((src), ("fmon"), -1);
    /* traps and engravings are output unconditionally;
     * others only if nonzero
     */
    count = size = 0;
    for (mon = chain; mon; mon = mon.nmon) {
        count++;
        size += size_monst(mon, incl_wsegs);
    }
    if (count || size || force) {
        total_count.value += count;
        total_size.value += size;
        buf = sprintf(buf, template, src, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
}
export function misc_stats(win, total_count, total_size) {
    let buf = '';
    let hdrbuf = '';
    let count = 0;
    let size = 0;
    let idx = 0;
    let tt = null;
    let sd = null;
    let k = null;
    let bi = null;
    count = size = 0;
    for (tt = game.ftrap; tt; tt = tt.ntrap) {
        ++count;
        size += 1 /* sizeof(struct trap) */;
    }
    total_count.value += count;
    total_size.value += size;
    hdrbuf = sprintf(hdrbuf, "traps, size %ld", 1 /* sizeof(struct trap) */);
    buf = sprintf(buf, template, hdrbuf, count, size);
    (game.windowprocs.win_putstr)(win, 0, buf);
    count = size = 0;
    engr_stats("engravings, size %ld+text", hdrbuf, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } });
    total_count.value += count;
    total_size.value += size;
    buf = sprintf(buf, template, hdrbuf, count, size);
    (game.windowprocs.win_putstr)(win, 0, buf);
    count = size = 0;
    light_stats("light sources, size %ld", hdrbuf, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } });
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        buf = sprintf(buf, template, hdrbuf, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    count = size = 0;
    timer_stats("timers, size %ld", hdrbuf, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } });
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        buf = sprintf(buf, template, hdrbuf, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    count = size = 0;
    for (sd = game.level.damagelist; sd; sd = sd.next) {
        ++count;
        size += 1 /* sizeof(struct damage) */;
    }
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        hdrbuf = sprintf(hdrbuf, "shop damage, size %ld", 1 /* sizeof(struct damage) */);
        buf = sprintf(buf, template, hdrbuf, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    count = size = 0;
    region_stats("regions, size %ld+%ld*rect+N", hdrbuf, { get value() { return count; }, set value(_v) { count = _v; } }, { get value() { return size; }, set value(_v) { size = _v; } });
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        buf = sprintf(buf, template, hdrbuf, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    count = size = 0;
    for (k = game.killer.next; k; k = k.next) {
        ++count;
        size += 1 /* sizeof(struct kinfo) */;
    }
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        hdrbuf = sprintf(hdrbuf, "delayed killer%s, size %ld", (((count) == 1) ? "" : "s"), 1 /* sizeof(struct kinfo) */);
        buf = sprintf(buf, template, hdrbuf, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    count = size = 0;
    for (bi = game.level.bonesinfo; bi; bi = bi.next) {
        ++count;
        size += 1 /* sizeof(struct cemetery) */;
    }
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        hdrbuf = sprintf(hdrbuf, "bones history, size %ld", 1 /* sizeof(struct cemetery) */);
        buf = sprintf(buf, template, hdrbuf, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    count = size = 0;
    for (idx = 0; idx < NUM_OBJECTS; ++idx) {
        if (game.objects[idx].oc_uname) {
            ++count;
            size += (strlen(game.objects[idx].oc_uname) + 1);
        }
    }
    if (count || size) {
        total_count.value += count;
        total_size.value += size;
        hdrbuf = strcpy(hdrbuf, "object type names, text");
        buf = sprintf(buf, template, hdrbuf, count, size);
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
}
export async function you_sanity_check() {
    let mtmp = null;
    if (game.u.uswallow && !game.u.ustuck) {
        await impossible("sanity_check: swallowed by nothing?");
        await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (1));
        /* try to recover from whatever the problem is */
        game.u.uswallow = 0;
        game.u.uswldtim = 0;
        await docrt();
    }
    if ((mtmp = (game.level.monsters[game.u.ux][game.u.uy])) != null) {
        if (game.u.ustuck != mtmp) {
            await impossible("sanity_check: you over monster");
        }
    }
    if (game.u.uhp > game.u.uhpmax) {
        await impossible("current hero health (%d) better than maximum? (%d)", game.u.uhp, game.u.uhpmax);
        game.u.uhp = game.u.uhpmax;
    }
    if ((game.u.umonnum != game.u.umonster) && game.u.mh > game.u.mhmax) {
        await impossible("current hero health as monster (%d) better than maximum? (%d)", game.u.mh, game.u.mhmax);
        game.u.mh = game.u.mhmax;
    }
    if (game.u.uen > game.u.uenmax) {
        await impossible("current hero energy (%d) better than maximum? (%d)", game.u.uen, game.u.uenmax);
        game.u.uen = game.u.uenmax;
    }
    await check_wornmask_slots();
    await check_invent_gold("invent");
}
export async function levl_sanity_check() {
    let x = 0;
    let y = 0;
    if ((game.u.uinwater)) {
        return;
    }
    for (y = 0; y < 21; y++) {
        for (x = 1; x < 80; x++) {
            /* Underwater uses different vision */
            if ((does_block(x, y, game.level.locations[x][y]) ? 1 : 0) != get_viz_clear(x, y)) {
                await impossible("levl[%i][%i] vision blocking", x, y);
            }
        }
    }
}
export async function sanity_check() {
    if (game.iflags.sanity_no_check) {
        /* in case a recurring sanity_check warning occurs, we mustn't
           re-trigger it when ^P is used, otherwise msg_window:Single
           and msg_window:Combination will always repeat the most recent
           instance, never able to go back to any earlier messages */
        game.iflags.sanity_no_check = (0);
        return;
    }
    game.program_state.in_sanity_check++;
    await you_sanity_check();
    await obj_sanity_check();
    await timer_sanity_check();
    await mon_sanity_check();
    await light_sources_sanity_check();
    await bc_sanity_check();
    await trap_sanity_check();
    await engraving_sanity_check();
    await levl_sanity_check();
    game.program_state.in_sanity_check--;
}
/* qsort() comparison routine for use in list_migrating_mons() */
export function migrsort_cmp(vptr1, vptr2) {
    let m1 = vptr1;
    let m2 = vptr2;
    let d1 = m1.mux;
    let l1 = m1.muy;
    let d2 = m2.mux;
    let l2 = m2.muy;
    /* if different branches, sort by dungeon number */
    if (d1 != d2) {
        return d1 - d2;
    }
    /* within same branch, sort by level number */
    if (l1 != l2) {
        return l1 - l2;
    }
    /* same destination level:  use a tie-breaker to force stable sort;
       monst->m_id is unsigned so we need more than just simple subtraction */
    return (m1.m_id < m2.m_id) ? -1 : (m1.m_id > m2.m_id);
}
/* called by #migratemons; displays count of migrating monsters, optionally
   displays them as well */
/* default destination for wiz_migrate_mons() */
export async function list_migrating_mons(nextlevl) {
    let win = (-1);
    let showit = (0);
    let n = 0;
    let xyloc = 0;
    let x = 0;
    let y = 0;
    let c = 0;
    let prmpt = '';
    let xtra = '';
    let buf = '';
    let mtmp = null;
    let marray = null;
    let here = 0;
    let nxtlv = 0;
    let other = 0;
    for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
        if (mtmp.mux == game.u.uz.dnum && mtmp.muy == game.u.uz.dlevel) {
            ++here;
        } else if (mtmp.mux == nextlevl.dnum && mtmp.muy == nextlevl.dlevel) {
            ++nxtlv;
        } else {
            ++other;
        }
    }
    if (here + nxtlv + other == 0) {
        await pline("No monsters currently migrating.");
    } else {
        await pline("%d mon%s pending for current level, %d for next level, %d for others.", here, (((here) == 1) ? "" : "s"), nxtlv, other);
        (xtra = '', prmpt = '');
        strkitten(here ? prmpt : xtra, 99);
        strkitten(nxtlv ? prmpt : xtra, 110);
        strkitten(other ? prmpt : xtra, 111);
        prmpt = strcat(prmpt, "a q");
        if (xtra) {
            prmpt = __nh_buf_append(prmpt, sprintf('', "%c%s", 27, xtra));
        }
        c = await yn_function("List which?", prmpt, 113, (1));
        n = (c == 99) ? here : (c == 110) ? nxtlv : (c == 111) ? other : (c == 97) ? here + nxtlv + other : 0;
        if (n > 0) {
            win = (game.windowprocs.win_create_nhwindow)(5);
            switch (c) {
                case 99:
                case 110:
                case 111:
                    buf = sprintf(buf, "Monster%s migrating to %s:", (((n) == 1) ? "" : "s"), (c == 99) ? "current level" : (c == 110) ? "next level" : "'other' levels");
                    break;
                default:
                    buf = strcpy(buf, "All migrating monsters:");
                    break;
            }
            (game.windowprocs.win_putstr)(win, 0, buf);
            (game.windowprocs.win_putstr)(win, 0, "");
            /* collect the migrating monsters into an array; for 'o' and 'a'
               where multiple destination levels might be present, sort by
               the destination; 'c' and 'n' don't need to be sorted but we
               do that anyway to get the same tie-breaker as 'o' and 'a' */
            marray = alloc((n + 1) * 8 /* sizeof(struct monst *) */);
            n = 0;
            for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
                if (c == 97) {
                    showit = (1);
                } else if (mtmp.mux == game.u.uz.dnum && mtmp.muy == game.u.uz.dlevel) {
                    showit = (c == 99);
                } else if (mtmp.mux == nextlevl.dnum && mtmp.muy == nextlevl.dlevel) {
                    showit = (c == 110);
                } else {
                    showit = (c == 111);
                }
                if (showit) {
                    marray[n++] = mtmp;
                }
            }
            /* mark end for traversal loop */
            marray[n] = null;
            if (n > 1) {
                await qsort_async(marray, n, 8 /* sizeof(struct monst *) */, migrsort_cmp);
            }
            for (n = 0; (mtmp = marray[n]) != null; ++n) {
                buf = sprintf(buf, "  %s", minimal_monnam(mtmp, (0)));
                /* sort elements [0] through [n-1] */
                /* minimal_monnam() appends map coordinates; strip that */
                buf = strsubst(buf, " <0,0>", "");
                /* if mtmp is named, include that */
                if (((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
                    buf = __nh_buf_append(buf, sprintf('', " named %s", ((mtmp).mextra.mgivenname)));
                }
                if (c == 111 || c == 97) {
                    buf = __nh_buf_append(buf, sprintf('', " to %d:%d", mtmp.mux, mtmp.muy));
                }
                xyloc = mtmp.mtrack[0].x;
                if (xyloc == 2) {
                    x = mtmp.mtrack[1].x;
                    y = mtmp.mtrack[1].y;
                    buf = __nh_buf_append(buf, sprintf('', " at <%d,%d>", x, y));
                }
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
            free(marray);
            await (game.windowprocs.win_display_nhwindow)(win, (0));
            (game.windowprocs.win_destroy_nhwindow)(win);
        } else if (c != 113) {
            await pline("None.");
        }
    }
}
/* the #stats command
 * Display memory usage of all monsters and objects on the level.
 */
export async function wiz_show_stats() {
    let buf = '';
    let win = 0;
    let total_obj_size = 0;
    let total_obj_count = 0;
    let total_mon_size = 0;
    let total_mon_count = 0;
    let total_ovr_size = 0;
    let total_ovr_count = 0;
    let total_misc_size = 0;
    let total_misc_count = 0;
    win = (game.windowprocs.win_create_nhwindow)(5);
    (game.windowprocs.win_putstr)(win, 0, "Current memory statistics:");
    total_obj_count = total_obj_size = 0;
    (game.windowprocs.win_putstr)(win, 0, stats_hdr);
    buf = sprintf(buf, "  Objects, base size %ld", 1 /* sizeof(struct obj) */);
    (game.windowprocs.win_putstr)(win, 0, buf);
    obj_chain(win, "invent", game.invent, (1), { get value() { return total_obj_count; }, set value(_v) { total_obj_count = _v; } }, { get value() { return total_obj_size; }, set value(_v) { total_obj_size = _v; } });
    obj_chain(win, "fobj", game.level.objlist, (1), { get value() { return total_obj_count; }, set value(_v) { total_obj_count = _v; } }, { get value() { return total_obj_size; }, set value(_v) { total_obj_size = _v; } });
    obj_chain(win, "buried", game.level.buriedobjlist, (0), { get value() { return total_obj_count; }, set value(_v) { total_obj_count = _v; } }, { get value() { return total_obj_size; }, set value(_v) { total_obj_size = _v; } });
    obj_chain(win, "migrating obj", game.migrating_objs, (0), { get value() { return total_obj_count; }, set value(_v) { total_obj_count = _v; } }, { get value() { return total_obj_size; }, set value(_v) { total_obj_size = _v; } });
    obj_chain(win, "billobjs", game.billobjs, (0), { get value() { return total_obj_count; }, set value(_v) { total_obj_count = _v; } }, { get value() { return total_obj_size; }, set value(_v) { total_obj_size = _v; } });
    mon_invent_chain(win, "minvent", game.level.monlist, { get value() { return total_obj_count; }, set value(_v) { total_obj_count = _v; } }, { get value() { return total_obj_size; }, set value(_v) { total_obj_size = _v; } });
    mon_invent_chain(win, "migrating minvent", game.migrating_mons, { get value() { return total_obj_count; }, set value(_v) { total_obj_count = _v; } }, { get value() { return total_obj_size; }, set value(_v) { total_obj_size = _v; } });
    contained_stats(win, "contained", { get value() { return total_obj_count; }, set value(_v) { total_obj_count = _v; } }, { get value() { return total_obj_size; }, set value(_v) { total_obj_size = _v; } });
    (game.windowprocs.win_putstr)(win, 0, stats_sep);
    buf = sprintf(buf, template, "  Obj total", total_obj_count, total_obj_size);
    (game.windowprocs.win_putstr)(win, 0, buf);
    total_mon_count = total_mon_size = 0;
    (game.windowprocs.win_putstr)(win, 0, "");
    buf = sprintf(buf, "  Monsters, base size %ld", 1 /* sizeof(struct monst) */);
    (game.windowprocs.win_putstr)(win, 0, buf);
    mon_chain(win, "fmon", game.level.monlist, (1), { get value() { return total_mon_count; }, set value(_v) { total_mon_count = _v; } }, { get value() { return total_mon_size; }, set value(_v) { total_mon_size = _v; } });
    mon_chain(win, "migrating", game.migrating_mons, (0), { get value() { return total_mon_count; }, set value(_v) { total_mon_count = _v; } }, { get value() { return total_mon_size; }, set value(_v) { total_mon_size = _v; } });
    /* 'gm.mydogs' is only valid during level change or end of game disclosure,
       but conceivably we've been called from within debugger at such time */
    /* monsters accompanying hero */
    if (game.mydogs) {
        mon_chain(win, "mydogs", game.mydogs, (0), { get value() { return total_mon_count; }, set value(_v) { total_mon_count = _v; } }, { get value() { return total_mon_size; }, set value(_v) { total_mon_size = _v; } });
    }
    (game.windowprocs.win_putstr)(win, 0, stats_sep);
    buf = sprintf(buf, template, "  Mon total", total_mon_count, total_mon_size);
    (game.windowprocs.win_putstr)(win, 0, buf);
    total_ovr_count = total_ovr_size = 0;
    (game.windowprocs.win_putstr)(win, 0, "");
    (game.windowprocs.win_putstr)(win, 0, "  Overview");
    overview_stats(win, template, { get value() { return total_ovr_count; }, set value(_v) { total_ovr_count = _v; } }, { get value() { return total_ovr_size; }, set value(_v) { total_ovr_size = _v; } });
    (game.windowprocs.win_putstr)(win, 0, stats_sep);
    buf = sprintf(buf, template, "  Over total", total_ovr_count, total_ovr_size);
    (game.windowprocs.win_putstr)(win, 0, buf);
    total_misc_count = total_misc_size = 0;
    (game.windowprocs.win_putstr)(win, 0, "");
    (game.windowprocs.win_putstr)(win, 0, "  Miscellaneous");
    misc_stats(win, { get value() { return total_misc_count; }, set value(_v) { total_misc_count = _v; } }, { get value() { return total_misc_size; }, set value(_v) { total_misc_size = _v; } });
    (game.windowprocs.win_putstr)(win, 0, stats_sep);
    buf = sprintf(buf, template, "  Misc total", total_misc_count, total_misc_size);
    (game.windowprocs.win_putstr)(win, 0, buf);
    (game.windowprocs.win_putstr)(win, 0, "");
    (game.windowprocs.win_putstr)(win, 0, stats_sep);
    buf = sprintf(buf, template, "  Grand total", (total_obj_count + total_mon_count + total_ovr_count + total_misc_count), (total_obj_size + total_mon_size + total_ovr_size + total_misc_size));
    (game.windowprocs.win_putstr)(win, 0, buf);
    await (game.windowprocs.win_display_nhwindow)(win, (0));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* the #wizdispmacros command
 * Verify that some display macros are returning sane values */
const __wiz_display_macros_display_issues = "Display macro issues:";
export async function wiz_display_macros() {
    let buf = '';
    let win = 0;
    let glyph = 0;
    let test = 0;
    let trouble = 0;
    let no_glyph = MAX_GLYPH;
    let max_glyph = MAX_GLYPH;
    win = (game.windowprocs.win_create_nhwindow)(5);
    for (glyph = 0; glyph < MAX_GLYPH; ++glyph) {
        if (((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1)))) {
            /* glyph_is_cmap / glyph_to_cmap() */
            test = glyph_to_cmap(glyph);
            if (test == no_glyph) {
                /* check for MAX_GLYPH return */
                /* check against defsyms array subscripts */
                /* check against mons array subscripts */
                /* check against objects array subscripts */
                if (!trouble++) {
                    (game.windowprocs.win_putstr)(win, 0, __wiz_display_macros_display_issues);
                }
                buf = sprintf(buf, "glyph_is_cmap() / glyph_to_cmap(glyph=%d) sync failure, returned NO_GLYPH (%d)", glyph, test);
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
            if (((glyph) >= GLYPH_ZAP_OFF && (glyph) < ((8 << 2) + GLYPH_ZAP_OFF)) && !(test >= S_vbeam && test <= S_rslant)) {
                if (!trouble++) {
                    (game.windowprocs.win_putstr)(win, 0, __wiz_display_macros_display_issues);
                }
                buf = sprintf(buf, "glyph_is_cmap_zap(glyph=%d) returned non-zap cmap %d", glyph, test);
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
            if (!((test) >= 0 && (test) < (Math.trunc(106 /* sizeof(const struct symdef [106]) */ / 1 /* sizeof(const struct symdef) */)))) {
                if (!trouble++) {
                    (game.windowprocs.win_putstr)(win, 0, __wiz_display_macros_display_issues);
                }
                buf = sprintf(buf, "glyph_to_cmap(glyph=%d) returns %d exceeds defsyms[%d] bounds (MAX_GLYPH = %d)", glyph, test, (Math.trunc(106 /* sizeof(const struct symdef [106]) */ / 1 /* sizeof(const struct symdef) */)), max_glyph);
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
        }
        if (((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS))))) {
            /* glyph_is_monster / glyph_to_mon */
            test = (((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_FEM_OFF) : ((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_MON_MALE_OFF) : ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_FEM_OFF) : ((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_PET_MALE_OFF) : ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_FEM_OFF) : ((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_DETECT_MALE_OFF) : ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_FEM_OFF) : ((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) ? ((glyph) - GLYPH_RIDDEN_MALE_OFF) : NUMMONS);
            if (test < 0 || test >= NUMMONS) {
                if (!trouble++) {
                    (game.windowprocs.win_putstr)(win, 0, __wiz_display_macros_display_issues);
                }
                buf = sprintf(buf, "glyph_to_mon(glyph=%d) returns %d exceeds mons[%d] bounds", glyph, test, NUMMONS);
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
        }
        if ((((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) || (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) || (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) || ((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))))) {
            /* glyph_is_object / glyph_to_obj */
            test = (((((glyph) >= GLYPH_BODY_OFF) && ((glyph) < (GLYPH_BODY_OFF + NUMMONS))) || (((glyph) >= GLYPH_BODY_PILETOP_OFF) && ((glyph) < (GLYPH_BODY_PILETOP_OFF + NUMMONS)))) ? CORPSE : (((((glyph) >= GLYPH_STATUE_MALE_OFF) && ((glyph) < (GLYPH_STATUE_MALE_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_MALE_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_MALE_PILETOP_OFF + NUMMONS)))) || ((((glyph) >= GLYPH_STATUE_FEM_OFF) && ((glyph) < (GLYPH_STATUE_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_STATUE_FEM_PILETOP_OFF) && ((glyph) < (GLYPH_STATUE_FEM_PILETOP_OFF + NUMMONS))))) ? STATUE : (((glyph) > GLYPH_OBJ_OFF && (glyph) < GLYPH_OBJ_OFF + FIRST_OBJECT - 1) || ((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1)) ? ((glyph) - (((glyph) > GLYPH_OBJ_PILETOP_OFF && (glyph) < GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : ((glyph) == GLYPH_OBJ_OFF || ((glyph) >= GLYPH_OBJ_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_OFF + NUM_OBJECTS)) || ((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS)))) ? ((glyph) - (((glyph) == GLYPH_OBJ_PILETOP_OFF || ((glyph) > GLYPH_OBJ_PILETOP_OFF + FIRST_OBJECT - 1 && (glyph) < (GLYPH_OBJ_PILETOP_OFF + NUM_OBJECTS))) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)) : NUM_OBJECTS);
            if (test < 0 || test > NUM_OBJECTS) {
                if (!trouble++) {
                    (game.windowprocs.win_putstr)(win, 0, __wiz_display_macros_display_issues);
                }
                buf = sprintf(buf, "glyph_to_obj(glyph=%d) returns %d exceeds objects[%d] bounds", glyph, test, NUM_OBJECTS);
                (game.windowprocs.win_putstr)(win, 0, buf);
            }
        }
    }
    if (!trouble) {
        (game.windowprocs.win_putstr)(win, 0, "No display macro issues detected.");
    }
    await (game.windowprocs.win_display_nhwindow)(win, (0));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* the #wizshownhuuid command */
export async function wiz_show_nhuuid() {
    await pline("The NHUUID for this game is { %s }.", game.nhuuid);
    return 0;
}
/* the #wizmondiff command */
const __wiz_mon_diff_window_title = "Review of monster difficulty ratings [index:level]:";
export async function wiz_mon_diff() {
    let buf = '';
    let win = 0;
    let mhardcoded = 0;
    let mcalculated = 0;
    let trouble = 0;
    let cnt = 0;
    let mdiff = 0;
    let mlev = 0;
    let ptr = null;
    win = (game.windowprocs.win_create_nhwindow)(5);
    for (let __ptr_i = 0; __ptr_i < game.mons.length && (ptr = game.mons[__ptr_i]).mlet; __ptr_i++, cnt++) {
        mcalculated = mstrength(ptr);
        mhardcoded = ptr.difficulty;
        mdiff = mhardcoded - mcalculated;
        if (mdiff) {
            if (!trouble++) {
                (game.windowprocs.win_putstr)(win, 0, __wiz_mon_diff_window_title);
            }
            mlev = ptr.mlevel;
            if (mlev > 50) {
                mlev = 50;
            }
            buf = nh_snprintf("wiz_mon_diff", 1819, buf, 256 /* sizeof(char [256]) */, "%-18s [%3d:%2d]: calculated: %2d, hardcoded: %2d (%+d)", ptr.pmnames[NEUTRAL], cnt, mlev, mcalculated, mhardcoded, mdiff);
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
    }
    if (!trouble) {
        (game.windowprocs.win_putstr)(win, 0, "No monster difficulty discrepancies were detected.");
    }
    await (game.windowprocs.win_display_nhwindow)(win, (0));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* the #wizobjprobs command */
export async function wiz_objprobs() {
    let win = 0;
    let buf = '';
    let probsum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let otyp = 0;
    let oclass = game.objects[FIRST_OBJECT].oc_class;
    memset(probsum, 0, 72 /* sizeof(int [18]) */);
    for (otyp = FIRST_OBJECT; otyp < NUM_OBJECTS; otyp++) {
        probsum[game.objects[otyp].oc_class] += game.objects[otyp].oc_prob;
    }
    win = (game.windowprocs.win_create_nhwindow)(5);
    for (otyp = FIRST_OBJECT; otyp < NUM_OBJECTS; otyp++) {
        /* placeholders for extra descriptions aren't generatable objects */
        if (!(game.obj_descr[(game.objects[otyp]).oc_name_idx].oc_name)) {
            continue;
        }
        if (game.objects[otyp].oc_class != oclass) {
            (game.windowprocs.win_putstr)(win, 0, "");
        }
        oclass = game.objects[otyp].oc_class;
        buf = nh_snprintf("wiz_objprobs", 1861, buf, 256 /* sizeof(char [256]) */, "%4d / %4d (%6.2f%%): %s", game.objects[otyp].oc_prob, probsum[oclass], game.objects[otyp].oc_prob * 100 / probsum[oclass], (game.obj_descr[(game.objects[otyp]).oc_name_idx].oc_name));
        (game.windowprocs.win_putstr)(win, 0, buf);
    }
    await (game.windowprocs.win_display_nhwindow)(win, (0));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* (NH_DEVEL_STATUS != NH_STATUS_RELEASED) || defined(DEBUG) */
/* #migratemons command */
export async function wiz_migrate_mons() {
    let mcount = 0;
    let inbuf = '';
    let ptr = null;
    let mtmp = null;
    let use_random_mon = (1);
    let mongen_saved = game.iflags.debug_mongen;
    let tolevel = { dnum: 0, dlevel: 0 };
    if ((((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level))))) {
        assign_level(tolevel, (game.dungeon_topology.d_valley_level));
    } else if (!Is_botlevel(game.u.uz)) {
        await get_level(tolevel, depth(game.u.uz) + 1);
    } else {
        tolevel.dnum = 0 , tolevel.dlevel = 0;
    }
    await list_migrating_mons(tolevel);
    (inbuf = __nh_char_write(inbuf, 1, 0), inbuf = '');
    if (tolevel.dnum || tolevel.dlevel) {
        inbuf = await getlin("How many random monsters to migrate to next level? [0]", inbuf);
    } else {
        await pline("Can't get there from here.");
    }
    if (inbuf == 27 || inbuf == 0) {
        return 0;
    }
    mcount = atoi(inbuf);
    if (mcount < 0) {
        use_random_mon = (0);
        mcount *= -1;
    }
    if (mcount < 1) {
        mcount = 0;
    } else if (mcount > ((80 - 1) * 21)) {
        mcount = (80 - 1) * 21;
    }
    game.iflags.debug_mongen = (0);
    while (mcount > 0) {
        if (use_random_mon) {
            ptr = await rndmonst();
            mtmp = await makemon(ptr, 0, 0, 131072);
        } else {
            mtmp = game.level.monlist;
        }
        if (mtmp) {
            await migrate_to_level(mtmp, ledger_no(tolevel), 0, null);
        }
        mcount--;
    }
    game.iflags.debug_mongen = mongen_saved;
    return 0;
}
/* #wizcustom command to see glyphmap customizations */
const __wiz_custom_wizcustom = "#wizcustom";
export async function wiz_custom() {
    if (game.flags.debug) {
        let win = 0;
        let buf = '';
        let bufa = '';
        let n = 0;
        let pick_list = null;
        if (!glyphid_cache_status()) {
            await fill_glyphid_cache();
        }
        win = (game.windowprocs.win_create_nhwindow)(4);
        (game.windowprocs.win_start_menu)(win, 0);
        await add_menu_heading(win, "    glyph  glyph identifier                             sym   clr customcolor unicode utf8");
        bufa = sprintf(bufa, "%s: colorcount=%ld %s", __wiz_custom_wizcustom, game.iflags.colorcount, game.symset[PRIMARYSET].name ? game.symset[PRIMARYSET].name : "default");
        if (game.currentgraphics == PRIMARYSET && game.symset[PRIMARYSET].name) {
            bufa = strcat(bufa, ", active");
        }
        if (game.symset[PRIMARYSET].handling) {
            bufa = __nh_buf_append(bufa, sprintf('', ", handler=%s", known_handling[game.symset[PRIMARYSET].handling]));
        }
        buf = sprintf(buf, "%s", bufa);
        await wizcustom_glyphids(win);
        (game.windowprocs.win_end_menu)(win, bufa);
        n = await select_menu(win, 0, pick_list);
        (game.windowprocs.win_destroy_nhwindow)(win);
        if (n >= 1) {
            free(pick_list);
        }
        if (glyphid_cache_status()) {
            free_glyphid_cache();
        }
        await docrt();
    } else {
        await pline(unavailcmd, ecname_from_fn(wiz_custom));
    }
    return 0;
}
export async function wizcustom_callback(win, glyphnum, id) {
    let cgm = null;
    let clr = 8;
    let buf = '';
    let bufa = '';
    let bufb = '';
    let bufc = '';
    let bufd = '';
    let bufu = '';
    let any = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let cp = null;
    if (win && id) {
        cgm = glyphmap[glyphnum];
        if (cgm.u || cgm.customcolor != 0) {
            bufa = sprintf(bufa, "[%04d] %-44s", glyphnum, id);
            bufb = sprintf(bufb, "'\\%03d' %02d", game.showsyms[cgm.sym.symidx], cgm.sym.color);
            bufc = sprintf(bufc, "%011lx", cgm.customcolor);
            bufu = '';
            if (cgm.u && cgm.u.utf8str) {
                bufu = sprintf(bufu, "U+%04lx", cgm.u.utf32ch);
                cp = cgm.u.utf8str;
                while (cp) {
                    bufd = sprintf(bufd, " <%d>", cp);
                    bufu = strcat(bufu, bufd);
                    cp++;
                }
            }
            any.a_int = glyphnum + 1;
            buf = nh_snprintf("wizcustom_callback", 2021, buf, 256 /* sizeof(char [256]) */, "%s %s %s %s", bufa, bufb, bufc, bufu);
            await add_menu(win, nul_glyphinfo, any, 0, 0, 0, clr, buf, 0);
        }
    }
    return;
}
/*wizcmds.c*/
/* keep steed and other adjacent pets after releasing them
       from traps, stopping eating, &c as if hero were ascending */
/* (pets-only; normally we'd be using 'FALSE') */
/* release dead and 'unmade' monsters */
/* create a new level; various things like bestowing a guardian
           angel on Astral or setting off alarm on Ft.Ludios are handled
           by goto_level(do.c) so won't occur for replacement levels */
/* whether there's an unseen monster here or not, player will know
           that there's no monster here after the kill or failed attempt;
           let hero know too */
/* normal case: hero is credited/blamed */
/* Null second arg suppresses the usual message */
/* since #wizkill takes no game time, it is possible to kill something
       in the main dungeon and immediately level teleport into the endgame
       which will delete the main dungeon's level files; avoid triggering
       impossible "dmonsfree: 0 removed doesn't match N pending" by forcing
       dead monster cleanup; we don't track whether anything was actually
       killed above--if nothing was, this will be benign */
/*
     * Does not handle
     *   levregions,
     *   monster mtrack,
     *   migrating monsters aimed at returning to specific coordinates
     *     on this level
     * as flipping is normally done only during level creation.
     */
/* append a branch identifier for completeness' sake */
/* FIRE_RES and properties beyond it (in the propertynames[]
                   ordering, not their numerical PROP values), can only be
                   set to timed values here so show a separator */
/* slippery fingers might need a persistent inventory update
                   so needs more than simple incr_itimeout() but we want
                   the pline() issued with that */
/* this probably ought to be panic() */
/* u.usteed isn't on the map */
/* [should we also check for (u.uhp < 1), (Upolyd && u.mh < 1),
       and (u.uen < 0) here?] */
