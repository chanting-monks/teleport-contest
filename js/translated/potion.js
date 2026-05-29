/* NetHack 5.0	potion.c	$NHDT-Date: 1770949988 2026/02/12 18:33:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.279 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2013. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_feel, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { strcmp, strcpy } from '../c2js-runtime/string.js';
import { unfixable_trouble_count } from './apply.js';
import { Sting_effects, permapoisoned, undiscovered_artifact } from './artifact.js';
import { acurr, adjattrib, exercise, poisontell } from './attrib.js';
import { set_bc } from './ball.js';
import { cmdq_peek, yn_function } from './cmd.js';
import { is_pool } from './dbridge.js';
import { c_color_names, c_common_strings, cg, ynchars } from './decl.js';
import { monster_detect, object_detect } from './detect.js';
import { canseemon, glyph_at, map_invisible, newsym, see_monsters, see_objects, see_traps, sensemon, set_mimic_blocking, swallowed, tmp_at, unmap_object } from './display.js';
import { doup, goto_level, heal_legs, trycall } from './do.js';
import { Monnam, a_monnam, docall, hcolor, hliquid, mon_nam, rndmonnam, x_monnam } from './do_name.js';
import { fingers_or_gloves, hard_helmet, inaccessible_equipment } from './do_wear.js';
import { tamedog } from './dog.js';
import { Can_rise_up, assign_level, ceiling, depth, get_level, has_ceiling, ledger_no, on_level, surface } from './dungeon.js';
import { eatmupdate, fix_petrification, is_fainted, newuhs } from './eat.js';
import { dealloc_killer, delayed_killer, find_delayed_killer } from './end.js';
import { can_reach_floor } from './engrave.js';
import { more_experienced, pluslvl, rndexp } from './exper.js';
import { explode, explode_oil } from './explode.js';
import { dipfountain, dipsink, drinkfountain, drinksink, floating_above, wash_hands } from './fountain.js';
import { in_rooms, losehp, near_capacity, nomul, spoteffects } from './hack.js';
import { dist2, s_suffix, upstart } from './hacklib.js';
import { enlightenment } from './insight.js';
import { freeinv, getobj, hold_another_object, learn_unseen_invent, prinv, update_inventory, useup, useupall } from './invent.js';
import { clone_mon, makemon, set_malign } from './makemon.js';
import { paralyze_monst, sleep_monst, slept_monst } from './mhitm.js';
import { cloneu } from './mhitu.js';
import { bcsign, bless, costly_alteration, curse, dealloc_obj, fixup_oil, mkobj, mksobj, obj_extract_self, splitobj, unbless, uncurse } from './mkobj.js';
import { healmon, killed, mongone, monkilled, wake_nearto, wakeup } from './mon.js';
import { Resists_Elem, defended, dmgtype, mon_hates_blessings, monstseesu, monstunseesu, stagger } from './mondata.js';
import { mcureblindness } from './muse.js';
import { ACID_RES, ALCHEMY_SMOCK, AMETHYST, ANTIMAGIC, ARMOR_CLASS, ARM_BOOTS, ARM_GLOVES, ART_EYES_OF_THE_OVERWORLD, A_CON, A_DEX, A_INT, A_MAX, A_STR, A_WIS, BLINDED, COIN_CLASS, COLD_RES, CONFUSION, COPPER, CORPSE, COST_NUTRLZ, COST_UNBLSS, COST_UNCURS, CQ_CANNED, DEAF, DETECT_MONSTERS, EXPL_FIERY, EYE, FACE, FAST, FIRE_RES, FIXED_ABIL, FOOT, FOUNTAIN, FREE_ACTION, GEM_CLASS, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_EXCLUDE_INACCESS, GETOBJ_EXCLUDE_NONINVENT, GETOBJ_SUGGEST, GLIB, GLYPH_INVIS_OFF, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, HEAD, INFRAVISION, INVIS, IRON, LEG, LENSES, LEVITATION, LOW_PM, MAGIC_LAMP, MS_SILENT, MUMMY_WRAPPING, M_AP_MONSTER, M_AP_NOTHING, M_SEEN_SLEEP, NEUTRAL, NON_PM, NUMMONS, OIL_LAMP, PLNMSG_OBJ_GLOWS, PM_CYCLOPS, PM_DJINNI, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLOATING_EYE, PM_GHOST, PM_GREEN_SLIME, PM_GREMLIN, PM_HEALER, PM_IRON_GOLEM, PM_LICHEN, PM_PESTILENCE, PM_SALAMANDER, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, POISON_RES, POLY_CONTROLLED, POLY_LOW_CTRL, POLY_NOFLAGS, POTION_CLASS, POT_ACID, POT_BLINDNESS, POT_BOOZE, POT_CONFUSION, POT_ENLIGHTENMENT, POT_EXTRA_HEALING, POT_FRUIT_JUICE, POT_FULL_HEALING, POT_GAIN_ABILITY, POT_GAIN_ENERGY, POT_GAIN_LEVEL, POT_HALLUCINATION, POT_HEALING, POT_INVISIBILITY, POT_LEVITATION, POT_MONSTER_DETECTION, POT_OBJECT_DETECTION, POT_OIL, POT_PARALYSIS, POT_POLYMORPH, POT_RESTORE_ABILITY, POT_SEE_INVISIBLE, POT_SICKNESS, POT_SLEEPING, POT_SPEED, POT_WATER, PROT_FROM_SHAPE_CHANGERS, P_BASIC, P_BOW, P_CROSSBOW, P_NONE, P_RIDING, P_SHURIKEN, SEE_INVIS, SHOPBASE, SICK, SICK_RES, SINK, SLEEP_RES, SLIMED, SPBOOK_CLASS, SPE_DETECT_MONSTERS, SPE_DETECT_TREASURE, SPE_HASTE_SELF, SPE_INVISIBILITY, SPE_LEVITATION, SPE_RESTORE_ABILITY, STONED, STRANGE_OBJECT, STRANGLED, STUNNED, TELEPAT, TOOL_CLASS, TOWEL, UNCHANGING, UNICORN_HORN, VOMITING, WARN_OF_MON, WEAPON_CLASS, WOUNDED_LEGS } from './nh-constants.js';
import { discover_object, objdescr_is, observe_object } from './o_init.js';
import { The, Tobjnam, Yname2, Yobjnam2, an, aobjnam, cxname, doname, fruitname, makeplural, otense, short_oname, simpleonames, the, thesimpleoname, vtense, xname, yname } from './objnam.js';
import { waterbody_name } from './pager.js';
import { livelog_printf } from './pline.js';
import { body_part, float_vs_flight, polyself } from './polyself.js';
import { d, rn2, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { alter_cost, check_unpaid, obfree, shop_keeper, stolen_value, subfrombill } from './shk.js';
import { stairway_at } from './stairs.js';
import { remove_worn_item } from './steal.js';
import { rider_cant_reach } from './steed.js';
import { burn_away_slime, fall_asleep } from './timeout.js';
import { erode_obj, fire_damage, float_up, unconscious, water_damage } from './trap.js';
import { vision_recalc } from './vision.js';
import { new_were, set_ulycn, you_unwere, you_were } from './were.js';
import { aggravate } from './wizard.js';
import { mon_adjust_speed, mon_set_minvis, which_armor } from './worn.js';
import { bhitm, do_enlightenment_effect, makewish, obj_resists, obj_unpolyable, poly_obj, resist } from './zap.js';

/* used to indicate whether quaff or dip has skipped an opportunity to
   use a fountain or such, in order to vary the feedback if hero lacks
   any potions [reinitialized every time it's used so does not need to
   be placed in struct instance_globals gd] */
game.drink_ok_extra = 0;
/* force `val' to be within valid range for intrinsic timeout value */
export function itimeout(val) {
    if (val >= 16777215) {
        val = 16777215;
    } else if (val < 1) {
        val = 0;
    }
    return val;
}
/* increment `old' by `incr' and force result to be valid intrinsic timeout */
export function itimeout_incr(old, incr) {
    return itimeout((old & 16777215) + incr);
}
/* set the timeout field of intrinsic `which' */
export function set_itimeout(which, val) {
    which.value &= ~16777215;
    which.value |= itimeout(val);
}
/* increment the timeout field of intrinsic `which' */
export function incr_itimeout(which, incr) {
    set_itimeout(which, itimeout_incr(which.value, incr));
}
export function make_confused(xtime, talk) {
    let old = game.u.uprops[CONFUSION].intrinsic;
    if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        talk = (0);
    }
    if (!xtime && old) {
        if (talk) {
            You_feel("less %s now.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "trippy" : "confused");
        }
    }
    if ((xtime && !old) || (!xtime && old)) {
        /* blindness has just been toggled */
        /* status conditions need update */
        game.disp.botl = (1);
    }
    set_itimeout({ get value() { return game.u.uprops[CONFUSION].intrinsic; }, set value(_v) { game.u.uprops[CONFUSION].intrinsic = _v; } }, xtime);
}
export function make_stunned(xtime, talk) {
    let old = game.u.uprops[STUNNED].intrinsic;
    if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        talk = (0);
    }
    if (!xtime && old) {
        if (talk) {
            You_feel("%s now.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "less wobbly" : "a bit steadier");
        }
    }
    if (xtime && !old) {
        if (talk) {
            if (game.u.usteed) {
                You("wobble in the saddle.");
            } else {
                You("%s...", stagger(game.youmonst.data, "stagger"));
            }
        }
    }
    if ((!xtime && old) || (xtime && !old)) {
        game.disp.botl = (1);
    }
    set_itimeout({ get value() { return game.u.uprops[STUNNED].intrinsic; }, set value(_v) { game.u.uprops[STUNNED].intrinsic = _v; } }, xtime);
}
/* Sick is overloaded with both fatal illness and food poisoning (via
   u.usick_type bit mask), but delayed killer can only support one or
   the other at a time.  They should become separate intrinsics.... */
/* sickness cause */
export function make_sick(xtime, cause, talk, type) {
    let kptr = null;
    let old = game.u.uprops[SICK].intrinsic;
    if (xtime > 0) {
        /* tell player even if hero is unconscious */
        if ((game.u.uprops[SICK_RES].intrinsic || game.u.uprops[SICK_RES].extrinsic || defended(game.youmonst, 33))) {
            /* defer this until caller has used up the scroll so it won't be
         * visible; player was told that it disappeared as hero read it */
            /* carried() will always be True here */
            return;
        }
        if (!old) {
            You_feel("deathly sick.");
        } else {
            if (talk) {
                You_feel("%s worse.", xtime <= Math.trunc(game.u.uprops[SICK].intrinsic / 2) ? "much" : "even");
            }
        }
        set_itimeout({ get value() { return game.u.uprops[SICK].intrinsic; }, set value(_v) { game.u.uprops[SICK].intrinsic = _v; } }, xtime);
        game.u.usick_type |= type;
        game.disp.botl = (1);
    } else if (old && (type & game.u.usick_type)) {
        game.u.usick_type &= ~type;
        if (game.u.usick_type) {
            if (talk) {
                You_feel("somewhat better.");
            }
            set_itimeout({ get value() { return game.u.uprops[SICK].intrinsic; }, set value(_v) { game.u.uprops[SICK].intrinsic = _v; } }, game.u.uprops[SICK].intrinsic * 2);
        } else {
            if (talk) {
                You_feel("cured.  What a relief!");
            }
            game.u.uprops[SICK].intrinsic = 0;
        }
        game.disp.botl = (1);
    }
    kptr = find_delayed_killer(SICK);
    if (game.u.uprops[SICK].intrinsic) {
        exercise(A_CON, (0));
        if (xtime || !old || !kptr) {
            /* setting delayed_killer used to be unconditional, but that's
           not right when make_sick(0) is called to cure food poisoning
           if hero was also fatally ill; this is only approximate */
            let kpfx = ((cause && !strcmp(cause, "#wizintrinsic")) ? 1 : 0);
            delayed_killer(SICK, kpfx, cause);
        }
    } else {
        dealloc_killer(kptr);
    }
}
export function make_slimed(xtime, msg) {
    let old = game.u.uprops[SLIMED].intrinsic;
    set_itimeout({ get value() { return game.u.uprops[SLIMED].intrinsic; }, set value(_v) { game.u.uprops[SLIMED].intrinsic = _v; } }, xtime);
    if ((xtime != 0) ^ (old != 0)) {
        game.disp.botl = (1);
        if (msg) {
            pline("%s", msg);
        }
    }
    if (!game.u.uprops[SLIMED].intrinsic) {
        dealloc_killer(find_delayed_killer(SLIMED));
        if ((game.youmonst.m_ap_type & 7) == M_AP_MONSTER && game.youmonst.mappearance == PM_GREEN_SLIME) {
            /* fake appearance is set late in turn-to-slime countdown */
            game.youmonst.m_ap_type = M_AP_NOTHING;
            game.youmonst.mappearance = 0;
        }
    }
}
/* start or stop petrification */
export function make_stoned(xtime, msg, killedby, killername) {
    let old = game.u.uprops[STONED].intrinsic;
    set_itimeout({ get value() { return game.u.uprops[STONED].intrinsic; }, set value(_v) { game.u.uprops[STONED].intrinsic = _v; } }, xtime);
    if ((xtime != 0) ^ (old != 0)) {
        game.disp.botl = (1);
        if (msg) {
            pline("%s", msg);
        }
    }
    if (!game.u.uprops[STONED].intrinsic) {
        dealloc_killer(find_delayed_killer(STONED));
    } else if (!old) {
        delayed_killer(STONED, killedby, killername);
    }
}
export function make_vomiting(xtime, talk) {
    let old = game.u.uprops[VOMITING].intrinsic;
    if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        talk = (0);
    }
    set_itimeout({ get value() { return game.u.uprops[VOMITING].intrinsic; }, set value(_v) { game.u.uprops[VOMITING].intrinsic = _v; } }, xtime);
    game.disp.botl = (1);
    if (!xtime && old) {
        if (talk) {
            You_feel("much less nauseated now.");
        }
    }
}
const vismsg = "vision seems to %s for a moment but is %s now.";
const eyemsg = "%s momentarily %s.";
export function make_blinded(xtime, talk) {
    let old = (game.u.uprops[BLINDED].intrinsic & 16777215);
    let u_could_see = 0;
    let can_see_now = 0;
    let eyes = null;
    /* we probe ahead in case the Eyes of the Overworld
       are or will be overriding blindness */
    u_could_see = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    set_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, xtime ? 1 : 0);
    can_see_now = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    set_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, old);
    if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        talk = (0);
    }
    if (can_see_now && !u_could_see) {
        if (talk) {
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                pline("Far out!  Everything is all cosmic again!");
            } else {
                You("can see again.");
            }
        }
    } else if (old && !xtime) {
        if (talk) {
            if (!(((game.youmonst.data).mflags1 & 4096) == 0) || ((game.u.uprops[BLINDED].intrinsic & 67108864) != 0)) {
                /* clearing temporary blindness without toggling blindness */
                /* setting temporary blindness without toggling blindness */
                /* clearing temporary hallucination without toggling vision */
                strange_feeling(null, null);
            } else if (game.u.uprops[BLINDED].extrinsic) {
                eyes = body_part(EYE);
                if ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) != 1) {
                    eyes = makeplural(eyes);
                }
                Your(eyemsg, eyes, vtense(eyes, "itch"));
            } else {
                Your(vismsg, "brighten", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "sadder" : "normal");
            }
        }
    }
    if (u_could_see && !can_see_now) {
        if (talk) {
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                pline("Oh, bummer!  Everything is dark!  Help!");
            } else {
                pline("A cloud of darkness falls upon you.");
            }
        }
        /* Before the hero goes blind, set the ball&chain variables. */
        if ((game.uball != null)) {
            set_bc(0);
        }
    } else if (!old && xtime) {
        if (talk) {
            if (!(((game.youmonst.data).mflags1 & 4096) == 0) || ((game.u.uprops[BLINDED].intrinsic & 67108864) != 0)) {
                strange_feeling(null, null);
            } else if (game.u.uprops[BLINDED].extrinsic) {
                eyes = body_part(EYE);
                if ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) != 1) {
                    eyes = makeplural(eyes);
                }
                Your(eyemsg, eyes, vtense(eyes, "twitch"));
            } else {
                Your(vismsg, "dim", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "happier" : "normal");
            }
        }
    }
    set_itimeout({ get value() { return game.u.uprops[BLINDED].intrinsic; }, set value(_v) { game.u.uprops[BLINDED].intrinsic = _v; } }, xtime);
    if (u_could_see ^ can_see_now) {
        /* one or the other but not both */
        toggle_blindness();
    }
}
/* blindness has just started or just ended--caller enforces that;
   called by Blindf_on(), Blindf_off(), and make_blinded() */
export function toggle_blindness() {
    let Stinging = (game.uwep && (game.u.uprops[WARN_OF_MON].extrinsic & 256) != 0);
    game.disp.botl = (1);
    game.vision_full_recalc = 1;
    /* this vision recalculation used to be deferred until moveloop(),
       but that made it possible for vision irregularities to occur
       (cited case was force bolt hitting an adjacent potion of blindness
       and then a secret door; hero was blinded by vapors but then got the
       message "a door appears in the wall" because wall spot was IN_SIGHT) */
    vision_recalc(0);
    if ((game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic) || (game.u.uprops[INFRAVISION].intrinsic || game.u.uprops[INFRAVISION].extrinsic) || Stinging) {
        see_monsters();
    }
    /* also counts EWarn_of_mon monsters */
    /*
     * Avoid either of the sequences
     * "Sting starts glowing", [become blind], "Sting stops quivering" or
     * "Sting starts quivering", [regain sight], "Sting stops glowing"
     * by giving "Sting is quivering" when becoming blind or
     * "Sting is glowing" when regaining sight so that the eventual
     * "stops" message matches the most recent "Sting is ..." one.
     */
    if (Stinging) {
        Sting_effects(-1);
    }
    /* update dknown flag for inventory picked up while blind */
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        learn_unseen_invent();
    }
}
/* nonzero if this is an attempt to turn on hallucination */
/* nonzero if resistance status should change by mask */
export function make_hallucinated(xtime, talk, mask) {
    let old = game.u.uprops[HALLUC].intrinsic;
    let changed = 0;
    let message = null;
    let verb = null;
    if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        talk = (0);
    }
    message = (!xtime) ? "Everything %s SO boring now." : "Oh wow!  Everything %s so cosmic!";
    verb = (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) ? "looks" : "feels";
    if (mask) {
        if (game.u.uprops[HALLUC].intrinsic) {
            changed = (1);
        }
        if (!xtime) {
            game.u.uprops[HALLUC_RES].extrinsic |= mask;
        } else {
            game.u.uprops[HALLUC_RES].extrinsic &= ~mask;
        }
    } else {
        if (!game.u.uprops[HALLUC_RES].extrinsic && (!!game.u.uprops[HALLUC].intrinsic != !!xtime)) {
            changed = (1);
        }
        set_itimeout({ get value() { return game.u.uprops[HALLUC].intrinsic; }, set value(_v) { game.u.uprops[HALLUC].intrinsic = _v; } }, xtime);
        if (!changed && !game.u.uprops[HALLUC].intrinsic && old && talk) {
            if (!(((game.youmonst.data).mflags1 & 4096) == 0)) {
                strange_feeling(null, null);
            } else if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                let eyes = body_part(EYE);
                if ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) != 1) {
                    eyes = makeplural(eyes);
                }
                Your(eyemsg, eyes, vtense(eyes, "itch"));
            } else {
                Your(vismsg, "flatten", "normal");
            }
        }
    }
    if (changed) {
        /* in case we're mimicking an orange (hallucinatory form
           of mimicking gold) update the mimicking's-over message */
        if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            eatmupdate();
        }
        if (game.u.uswallow) {
            swallowed(0);
        } else {
            /* The see_* routines should be called *before* the pline. */
            /* if swallowed or underwater, fall through to uncursed case */
            see_monsters();
            see_objects();
            see_traps();
        }
        /* for perm_inv and anything similar
        (eg. Qt windowport's equipped items display) */
        update_inventory();
        game.disp.botl = (1);
        if (talk) {
            pline(message, verb);
        }
    }
    return changed;
}
export function make_deaf(xtime, talk) {
    let old = game.u.uprops[DEAF].intrinsic;
    if ((game.multi < 0 && (unconscious() || is_fainted()))) {
        talk = (0);
    }
    set_itimeout({ get value() { return game.u.uprops[DEAF].intrinsic; }, set value(_v) { game.u.uprops[DEAF].intrinsic = _v; } }, xtime);
    if ((xtime != 0) ^ (old != 0)) {
        game.disp.botl = (1);
        if (talk) {
            You(old && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "can hear again." : "are unable to hear anything.");
        }
    }
}
/* set or clear "slippery fingers" */
export function make_glib(xtime) {
    game.disp.botl |= (!game.u.uprops[GLIB].intrinsic ^ !!xtime);
    set_itimeout({ get value() { return game.u.uprops[GLIB].intrinsic; }, set value(_v) { game.u.uprops[GLIB].intrinsic = _v; } }, xtime);
    /* may change "(being worn)" to "(being worn; slippery)" or vice versa */
    if (game.uarmg) {
        update_inventory();
    }
}
export function self_invis_message() {
    pline("%s %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "Far out, man!  You" : "Gee!  All of a sudden, you", (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? "can see right through yourself" : "can't see yourself");
}
export function ghost_from_bottle() {
    let mtmp = makemon(game.mons[PM_GHOST], game.u.ux, game.u.uy, 131072);
    if (!mtmp) {
        pline("This bottle turns out to be empty.");
        return;
    }
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        pline("As you open the bottle, %s emerges.", c_common_strings.c_something);
        return;
    }
    pline("As you open the bottle, an enormous %s emerges!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? rndmonnam(null) : "ghost");
    if (game.flags.verbose) {
        You("are frightened to death, and unable to move.");
    }
    nomul(-3);
    game.multi_reason = "being frightened to death";
    game.nomovemsg = "You regain your composure.";
}
/* getobj callback for object to drink from, which also does double duty as
   the callback for dipping into (both just allow potions). */
export function drink_ok(obj) {
    /* getobj()'s callback to test whether hands/self is a valid "item" to
       pick is used here to communicate the fact that player has already
       passed up an opportunity to perform the action (drink or dip) on a
       non-inventory dungeon feature, so if there are no potions in invent
       the message will be "you have nothing /else/ to {drink | dip into}";
       if player used 'm' prefix to bypass dungeon features, drink_ok_extra
       will be 0 and the potential "else" will be omitted */
    if (!obj) {
        return game.drink_ok_extra ? GETOBJ_EXCLUDE_NONINVENT : GETOBJ_EXCLUDE;
    }
    if (obj.oclass == POTION_CLASS) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_EXCLUDE;
}
/* "Quaffing is like drinking, except you spill more." - Terry Pratchett */
/* the #quaff command */
export async function dodrink() {
    let otmp = null;
    if (game.u.uprops[STRANGLED].intrinsic) {
        pline("If you can't breathe air, how can you drink liquid?");
        return 0;
    }
    /* note: drink_ok() callback for quaffing is also used to validate
       a potion to dip into */
    /* affects drink_ok(): haven't been asked about and
                         * declined to use a floor feature like a fountain */
    game.drink_ok_extra = 0;
    if (!game.iflags.menu_requested) {
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == FOUNTAIN) && can_reach_floor((0))) {
            if (yn_function("Drink from the fountain?", ynchars, 110, (1)) == 121) {
                /* preceding 'q'/#quaff with 'm' skips the possibility of drinking
       from fountains, sinks, and surrounding water plus the prompting
       which those entail; optional for interactive use, essential for
       context-sensitive inventory item action 'quaff' */
                /* Is there a fountain to drink from here? */
                /* not as low as floor level but similar restrictions apply */
                drinkfountain();
                return 1;
            }
            ++game.drink_ok_extra;
        }
        if (((game.level.locations[game.u.ux][game.u.uy].typ) == SINK) && can_reach_floor((0))) {
            if (yn_function("Drink from the sink?", ynchars, 110, (1)) == 121) {
                drinksink();
                return 1;
            }
            ++game.drink_ok_extra;
        }
        if ((game.u.uinwater) && !game.u.uswallow) {
            if (yn_function("Drink the water around you?", ynchars, 110, (1)) == 121) {
                /* Or are you surrounded by water? */
                pline("Do you know what lives in this water?");
                return 1;
            }
            ++game.drink_ok_extra;
        }
    }
    otmp = getobj("drink", drink_ok, 0);
    if (!otmp) {
        return 2;
    }
    if (otmp.owornmask) {
        if (otmp.quan > 1) {
            /*
     * 3.6:  quan > 1 used to be left to useup(), but we need to
     * force the current potion to be unworn, and don't want to do
     * that for the entire stack when starting with more than 1.
     * [Drinking a wielded potion of polymorph can trigger a shape
     * change which causes hero's weapon to be dropped.  In 3.4.x,
     * that led to an "object lost" panic since subsequent useup()
     * was no longer dealing with an inventory item.  Unwearing
     * the current potion is intended to keep it in inventory.]
     *
     * 5.0: switch back to relying on useup() unless the object is
     * actually worn.  Otherwise drinking a stack of unpaid potions
     * one by one in a shop makes each one a separate used-up item
     * for 'Ix' invent display and for itemized shop billing instead
     * of having a single stack with quantity greater than 1.
     */
            otmp = splitobj(otmp, 1);
            /* rest of original stack is unaffected */
            otmp.owornmask = 0;
        } else {
            remove_worn_item(otmp, (0));
        }
    }
    /* you've opened the stopper */
    otmp.in_use = (1);
    if (objdescr_is(otmp, "milky") && !(game.mvitals[PM_GHOST].mvflags & (2 | 1)) && !rn2((13 + 2 * (game.mvitals[PM_GHOST].born)))) {
        ghost_from_bottle();
        useup(otmp);
        return 1;
    } else if (objdescr_is(otmp, "smoky") && !(game.mvitals[PM_DJINNI].mvflags & (2 | 1)) && !rn2((13 + 2 * (game.mvitals[PM_DJINNI].born)))) {
        djinni_from_bottle(otmp);
        useup(otmp);
        return 1;
    }
    return await dopotion(otmp);
}
export async function dopotion(otmp) {
    let retval = 0;
    otmp.in_use = (1);
    game.potion_nothing = game.potion_unkn = 0;
    if ((retval = await peffects(otmp)) >= 0) {
        return retval ? 1 : 0;
    }
    if (game.potion_nothing) {
        /* holy/unholy water can burn like acid too */
        game.potion_unkn++;
        You("have a %s feeling for a moment, then it passes.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : "peculiar");
    }
    if (otmp.dknown && !game.objects[otmp.otyp].oc_name_known) {
        if (!game.potion_unkn) {
            discover_object((otmp.otyp), (1), (1), (1));
            more_experienced(0, 10);
        } else {
            trycall(otmp);
        }
    }
    useup(otmp);
    return 1;
}
/* potion or spell of restore ability; for spell, otmp is a temporary
   spellbook object that will be blessed if hero is skilled in healing */
export function peffect_restore_ability(otmp) {
    game.potion_unkn++;
    if (otmp.cursed) {
        pline("Ulch!  This makes you feel mediocre!");
        return;
    } else {
        let i = 0;
        let ii = 0;
        /* unlike unicorn horn, overrides Fixed_abil;
           does not recover temporary strength loss due to hunger
           or temporary dexterity loss due to wounded legs */
        pline("Wow!  This makes you feel %s!", (!otmp.blessed) ? "good" : unfixable_trouble_count((0)) ? "better" : "great");
        i = rn2(A_MAX);
        for (ii = 0; ii < A_MAX; ii++) {
            let lim = (game.u.amax.a[i]);
            if ((game.u.acurr.a[i]) < lim) {
                (game.u.acurr.a[i]) = lim;
                (game.u.aexe.a[i]) = (((game.u.aexe.a[i])) > (0) ? ((game.u.aexe.a[i])) : (0));
                /* this used to adjust 'lim' for A_STR when u.uhs was
               WEAK or worse, but that's handled via ATEMP(A_STR) now */
                /* reset stat abuse (but not exercise) to 0 as well */
                game.disp.botl = (1);
                /* only first found if not blessed */
                if (!otmp.blessed) {
                    break;
                }
            }
            if (++i >= A_MAX) {
                i = 0;
            }
        }
        if (otmp.otyp == POT_RESTORE_ABILITY && game.u.ulevel < game.u.ulevelmax) {
            /* when using the potion (not the spell) also restore lost levels,
           to make the potion more worth keeping around for players with
           the spell or with a unihorn; this is better than full healing
           in that it can restore all of them, not just half, and a
           blessed potion restores them all at once */
            do {
                pluslvl((0));
            } while (game.u.ulevel < game.u.ulevelmax && otmp.blessed);
        }
    }
}
export function peffect_hallucination(otmp) {
    /* already levitating, or can't levitate */
    if ((game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) {
        game.potion_nothing++;
        return;
    } else if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        game.potion_nothing++;
    }
    make_hallucinated(itimeout_incr(game.u.uprops[HALLUC].intrinsic, (rn2(200) + (600 - 300 * bcsign(otmp)))), (1), 0);
    if ((otmp.blessed && !rn2(3)) || (!otmp.cursed && !rn2(6))) {
        You("perceive yourself...");
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        enlightenment(2, 0);
        Your("awareness re-normalizes.");
        exercise(A_WIS, (1));
    }
}
export function peffect_water(otmp) {
    if (!otmp.blessed && !otmp.cursed) {
        pline("This tastes like %s.", hliquid("water"));
        game.u.uhunger += rnd(10);
        newuhs((0));
        return;
    }
    game.potion_unkn++;
    if (mon_hates_blessings(game.youmonst) || game.u.ualign.type == (-1)) {
        if (otmp.blessed) {
            pline("This burns like %s!", hliquid("acid"));
            exercise(A_CON, (0));
            /* make_confused(0L, TRUE); */
            if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS)) {
                Your("affinity to %s disappears!", makeplural(game.mons[game.u.ulycn].pmnames[NEUTRAL]));
                if (game.youmonst.data == game.mons[game.u.ulycn]) {
                    you_unwere((0));
                }
                set_ulycn(NON_PM);
            }
            losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((d(2, 6)) + 1) / 2)) : (d(2, 6))), "potion of holy water", 0);
        } else if (otmp.cursed) {
            You_feel("quite proud of yourself.");
            healup(d(2, 6), 0, 0, 0);
            if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS) && !(game.u.umonnum != game.u.umonster)) {
                you_were();
            }
            exercise(A_CON, (1));
        }
    } else {
        if (otmp.blessed) {
            You_feel("full of awe.");
            make_sick(0, null, (1), 3);
            exercise(A_WIS, (1));
            exercise(A_CON, (1));
            if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS)) {
                you_unwere((1));
            }
        } else {
            if (game.u.ualign.type == 1) {
                pline("This burns like %s!", hliquid("acid"));
                losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((d(2, 6)) + 1) / 2)) : (d(2, 6))), "potion of unholy water", 0);
            } else {
                You_feel("full of dread.");
            }
            if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS) && !(game.u.umonnum != game.u.umonster)) {
                you_were();
            }
            exercise(A_CON, (0));
        }
    }
}
export function peffect_booze(otmp) {
    game.potion_unkn++;
    pline("Ooph!  This tastes like %s%s!", otmp.oeroded ? "watered down " : "", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "dandelion wine" : "liquid fire");
    if (!otmp.blessed) {
        /* booze hits harder if drinking on an empty stomach */
        make_confused(itimeout_incr(game.u.uprops[CONFUSION].intrinsic, d(2 + game.u.uhs, 8)), (0));
    }
    /* the whiskey makes us feel better */
    if (!otmp.oeroded) {
        healup(1, 0, (0), (0));
    }
    game.u.uhunger += 10 * (2 + bcsign(otmp));
    newuhs((0));
    exercise(A_WIS, (0));
    if (otmp.cursed) {
        You("pass out.");
        game.multi = -rnd(15);
        game.nomovemsg = "You awake with a headache.";
    }
}
export function peffect_enlightenment(otmp) {
    if (otmp.cursed) {
        game.potion_unkn++;
        You("have an uneasy feeling...");
        exercise(A_WIS, (0));
    } else {
        if (otmp.blessed) {
            adjattrib(A_INT, 1, (0));
            adjattrib(A_WIS, 1, (0));
        }
        do_enlightenment_effect();
    }
}
export function peffect_invisibility(otmp) {
    let is_spell = (otmp.oclass == SPBOOK_CLASS);
    if (is_spell && game.u.uprops[INVIS].blocked && game.uarmc.otyp == MUMMY_WRAPPING) {
        /* spell cannot penetrate mummy wrapping */
        You_feel("rather itchy under %s.", yname(game.uarmc));
        return;
    }
    if (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || game.u.uprops[INVIS].blocked) {
        game.potion_nothing++;
    } else {
        self_invis_message();
    }
    if (otmp.blessed && !rn2(game.u.uprops[INVIS].intrinsic ? 15 : 30)) {
        game.u.uprops[INVIS].intrinsic |= 67108864;
    } else {
        incr_itimeout({ get value() { return game.u.uprops[INVIS].intrinsic; }, set value(_v) { game.u.uprops[INVIS].intrinsic = _v; } }, d(6 - 3 * bcsign(otmp), 100) + 100);
    }
    newsym(game.u.ux, game.u.uy);
    if (otmp.cursed) {
        pline("For some reason, you feel your presence is known.");
        aggravate();
        /* doing this gives temporary invisibility, but removes permanent
           invisibility */
        game.u.uprops[INVIS].intrinsic &= ~67108864;
    }
}
export function peffect_see_invisible(otmp) {
    let msg = (((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked);
    let permchance = 10 - (game.u.uprops[INVIS].intrinsic ? 3 : 0) - (game.u.uprops[SEE_INVIS].intrinsic ? 6 : 0);
    game.potion_unkn++;
    if (otmp.cursed) {
        pline("Yecch!  This tastes %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "overripe" : "rotten");
    } else {
        pline((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "This tastes like 10%% real %s%s all-natural beverage." : "This tastes like %s%s.", otmp.oeroded ? "reconstituted " : "", fruitname((1)));
    }
    if (otmp.otyp == POT_FRUIT_JUICE) {
        game.u.uhunger += (otmp.oeroded ? 5 : 10) * (2 + bcsign(otmp));
        newuhs((0));
        return;
    }
    if (!otmp.cursed) {
        /* Tell them they can see again immediately, which
         * will help them identify the potion...
         */
        make_blinded(0, (1));
    }
    if (otmp.blessed && !rn2(permchance)) {
        game.u.uprops[SEE_INVIS].intrinsic |= 67108864;
    } else {
        incr_itimeout({ get value() { return game.u.uprops[SEE_INVIS].intrinsic; }, set value(_v) { game.u.uprops[SEE_INVIS].intrinsic = _v; } }, (rn2(100) + (750)));
    }
    /* do special mimic handling */
    set_mimic_blocking();
    see_monsters();
    newsym(game.u.ux, game.u.uy);
    if (msg && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        /* Blind possible if polymorphed */
        You("can see through yourself, but you are visible!");
        game.potion_unkn--;
    }
}
export function peffect_paralysis(otmp) {
    if (game.u.uprops[FREE_ACTION].extrinsic) {
        You("stiffen momentarily.");
    } else {
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || (((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            You("are motionlessly suspended.");
        } else if (game.u.usteed) {
            You("are frozen in place!");
        } else {
            Your("%s are frozen to the %s!", makeplural(body_part(FOOT)), surface(game.u.ux, game.u.uy));
        }
        nomul(-((rn2(10) + (25 - 12 * bcsign(otmp)))));
        game.multi_reason = "frozen by a potion";
        game.nomovemsg = c_common_strings.c_You_can_move_again;
        exercise(A_DEX, (0));
    }
}
export function peffect_sleeping(otmp) {
    if ((game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic) || game.u.uprops[FREE_ACTION].extrinsic) {
        monstseesu(M_SEEN_SLEEP);
        You("yawn.");
    } else {
        You("suddenly fall asleep!");
        monstunseesu(M_SEEN_SLEEP);
        fall_asleep(-(rn2(10) + (25 - 12 * bcsign(otmp))), (1));
    }
}
export function peffect_monster_detection(otmp) {
    if (otmp.blessed) {
        let i = 0;
        let x = 0;
        let y = 0;
        if ((game.u.uprops[DETECT_MONSTERS].intrinsic || game.u.uprops[DETECT_MONSTERS].extrinsic)) {
            game.potion_nothing++;
        }
        game.potion_unkn++;
        if ((game.u.uprops[DETECT_MONSTERS].intrinsic & 16777215) >= 300) {
            i = 1;
        } else if (otmp.oclass == SPBOOK_CLASS) {
            i = (rn2(40) + (21));
        /* after a while, repeated uses become less effective */
        } else {
            i = rn2(100) + 100;
        }
        incr_itimeout({ get value() { return game.u.uprops[DETECT_MONSTERS].intrinsic; }, set value(_v) { game.u.uprops[DETECT_MONSTERS].intrinsic = _v; } }, i);
        for (x = 1; x < 80; x++) {
            for (y = 0; y < 21; y++) {
                if (game.level.locations[x][y].glyph == GLYPH_INVIS_OFF) {
                    unmap_object(x, y);
                    newsym(x, y);
                }
                if ((game.level.monsters[x][y] != null)) {
                    game.potion_unkn = 0;
                }
            }
        }
        if (!game.u.uswallow && !(game.u.uinwater)) {
            see_monsters();
            if (game.potion_unkn) {
                You_feel("lonely.");
            }
            return 0;
        }
    }
    if (monster_detect(otmp, 0)) {
        return 1;
    }
    exercise(A_WIS, (1));
    return 0;
}
export function peffect_object_detection(otmp) {
    if (object_detect(otmp, 0)) {
        return 1;
    }
    exercise(A_WIS, (1));
    return 0;
}
export function peffect_sickness(otmp) {
    pline("Yecch!  This stuff tastes like poison.");
    if (otmp.blessed) {
        pline("(But in fact it was mildly stale %s.)", fruitname((1)));
        if (!(game.urole.mnum == (PM_HEALER))) {
            /* NB: blessed otmp->fromsink is not possible */
            losehp(1, "mildly contaminated potion", 0);
        }
    } else {
        if ((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
            pline("(But in fact it was biologically contaminated %s.)", fruitname((1)));
        }
        if ((game.urole.mnum == (PM_HEALER))) {
            pline("Fortunately, you have been immunized.");
        } else {
            let contaminant = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let typ = rn2(A_MAX);
            contaminant = sprintf(contaminant, "%s%s", ((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) ? "mildly " : "", (otmp.corpsenm) ? "contaminated tap water" : "contaminated potion");
            if (!game.u.uprops[FIXED_ABIL].extrinsic) {
                poisontell(typ, (0));
                adjattrib(typ, (game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic) ? -1 : -(rn2(4) + (3)), 1);
            }
            if (!(game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
                if (otmp.corpsenm) {
                    losehp(rnd(10) + 5 * !!(otmp.cursed), contaminant, 1);
                } else {
                    losehp(rnd(10) + 5 * !!(otmp.cursed), contaminant, 0);
                }
            } else {
                /* rnd loss is so that unblessed poorer than blessed */
                losehp(1 + rn2(2), contaminant, (otmp.corpsenm) ? 1 : 0);
            }
            exercise(A_CON, (0));
        }
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        You("are shocked back to your senses!");
        make_hallucinated(0, (0), 0);
    }
}
export function peffect_confusion(otmp) {
    if (!game.u.uprops[CONFUSION].intrinsic) {
        if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            pline("What a trippy feeling!");
            game.potion_unkn++;
        } else {
            pline("Huh, What?  Where am I?");
        }
    } else {
        game.potion_nothing++;
    }
    make_confused(itimeout_incr(game.u.uprops[CONFUSION].intrinsic, (rn2(7) + (16 - 8 * bcsign(otmp)))), (0));
}
export function peffect_gain_ability(otmp) {
    if (otmp.cursed) {
        pline("Ulch!  That potion tasted foul!");
        game.potion_unkn++;
    } else if (game.u.uprops[FIXED_ABIL].extrinsic) {
        game.potion_nothing++;
    } else {
        /* If blessed, increase all; if not, try up to */
        /* 6 times to find one which can be increased. */
        let itmp = 0;
        let ii = 0;
        let i = -1;
        for (ii = A_MAX; ii > 0; ii--) {
            i = (otmp.blessed ? i + 1 : rn2(A_MAX));
            /* only give "your X is already as high as it can get"
               message on last attempt (except blessed potions) */
            itmp = (otmp.blessed || ii == 1) ? 0 : -1;
            if (adjattrib(i, 1, itmp) && !otmp.blessed) {
                break;
            }
        }
    }
}
export function peffect_speed(otmp) {
    let is_speed = (otmp.otyp == POT_SPEED);
    if (is_speed && (game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) && !otmp.cursed && !game.u.usteed) {
        /* skip when mounted; heal_legs() would heal steed's legs */
        heal_legs(0);
        game.potion_unkn++;
        return;
    }
    speed_up((rn2(10) + (100 + 60 * bcsign(otmp))));
    if (is_speed && !otmp.cursed && !(game.u.uprops[FAST].intrinsic & (67108864 | 33554432 | 16777216))) {
        /* non-cursed potion grants intrinsic speed */
        Your("quickness feels very natural.");
        game.u.uprops[FAST].intrinsic |= 67108864;
    }
}
export function peffect_blindness(otmp) {
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && game.u.uprops[BLINDED].blocked)) {
        game.potion_nothing++;
    }
    make_blinded(itimeout_incr((game.u.uprops[BLINDED].intrinsic & 16777215), (rn2(200) + (250 - 125 * bcsign(otmp)))), !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked));
}
export async function peffect_gain_level(otmp) {
    if (otmp.cursed) {
        let on_lvl_1 = (ledger_no(game.u.uz) == 1);
        game.potion_unkn++;
        if (on_lvl_1 ? game.u.uhave.amulet : Can_rise_up(game.u.ux, game.u.uy, game.u.uz)) {
            let newlev = 0;
            let newlevel = { dnum: 0, dlevel: 0 };
            if (on_lvl_1) {
                assign_level(newlevel, (game.dungeon_topology.d_earth_level));
            } else {
                newlev = depth(game.u.uz) - 1;
                get_level(newlevel, newlev);
                if (on_level(newlevel, game.u.uz)) {
                    pline("It tasted bad.");
                    return;
                }
            }
            You("rise up, through the %s!", ceiling(game.u.ux, game.u.uy));
            await goto_level(newlevel, (0), (0), (0));
        } else {
            You("have an uneasy feeling.");
        }
        return;
    }
    pluslvl((0));
    /* blessed potions place you at a random spot in the
       middle of the new level instead of the low point */
    if (otmp.blessed) {
        game.u.uexp = rndexp((1));
    }
}
export function peffect_healing(otmp) {
    You_feel("better.");
    healup(8 + d(4 + 2 * bcsign(otmp), 4), !otmp.cursed ? 1 : 0, !!otmp.blessed, !otmp.cursed);
    exercise(A_CON, (1));
}
export function peffect_extra_healing(otmp) {
    You_feel("much better.");
    healup(16 + d(4 + 2 * bcsign(otmp), 8), otmp.blessed ? 5 : !otmp.cursed ? 2 : 0, !otmp.cursed, (1));
    make_hallucinated(0, (1), 0);
    exercise(A_CON, (1));
    exercise(A_STR, (1));
    /* blessed potion also heals wounded legs unless riding (where leg
       wounds apply to the steed rather than to the hero) */
    if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) && (otmp.blessed && !game.u.usteed)) {
        heal_legs(0);
    }
}
export function peffect_full_healing(otmp) {
    You_feel("completely healed.");
    healup(400, 4 + 4 * bcsign(otmp), !otmp.cursed, (1));
    if (otmp.blessed && game.u.ulevel < game.u.ulevelmax) {
        /* Restore one lost level if blessed */
        /* when multiple levels have been lost, drinking
           multiple potions will only get half of them back */
        game.u.ulevelmax -= 1;
        pluslvl((0));
    }
    make_hallucinated(0, (1), 0);
    exercise(A_STR, (1));
    exercise(A_CON, (1));
    /* blessed potion heals wounded legs even when riding (so heals steed's
       legs--it's magic); uncursed potion heals hero's legs unless riding */
    if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) && (otmp.blessed || (!otmp.cursed && !game.u.usteed))) {
        heal_legs(0);
    }
}
export function peffect_levitation(otmp) {
    if (!((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !game.u.uprops[LEVITATION].blocked) {
        /*
     * BLevitation will be set if levitation is blocked due to being
     * inside rock (currently or formerly in phazing xorn form, perhaps)
     * but it doesn't prevent setting or incrementing Levitation timeout
     * (which will take effect after escaping from the rock if it hasn't
     * expired by then).
     */
        /* kludge to ensure proper operation of float_up() */
        set_itimeout({ get value() { return game.u.uprops[LEVITATION].intrinsic; }, set value(_v) { game.u.uprops[LEVITATION].intrinsic = _v; } }, 1);
        /* This used to set timeout back to 0, then increment it below
           for blessed and uncursed effects.  But now we leave it so
           that cursed effect yields "you float down" on next turn.
           Blessed and uncursed get one extra turn duration. */
        float_up();
    } else {
        game.potion_nothing++;
    }
    if (otmp.cursed) {
        let stway = null;
        game.u.uprops[LEVITATION].intrinsic &= ~536870912;
        if (game.u.uprops[LEVITATION].blocked) {
            ;
        } else if ((stway = stairway_at(game.u.ux, game.u.uy)) != null && stway.up) {
            /* 'already levitating' used to block the cursed effect(s)
           aside from ~I_SPECIAL; it was not clear whether that was
           intentional; either way, it no longer does (as of 3.6.1) */
            /* can't descend upon demand */
            /* rising via levitation is blocked */
            doup();
            /* in case we're already Levitating, which would have
               resulted in incrementing 'nothing' */
            game.potion_nothing = 0;
        } else if (has_ceiling(game.u.uz)) {
            let dmg = rnd(!game.uarmh ? 10 : !hard_helmet(game.uarmh) ? 6 : 3);
            You("hit your %s on the %s.", body_part(HEAD), ceiling(game.u.ux, game.u.uy));
            losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "colliding with the ceiling", 1);
            game.potion_nothing = 0;
        }
    } else if (otmp.blessed) {
        /* at this point, timeout is already at least 1 */
        incr_itimeout({ get value() { return game.u.uprops[LEVITATION].intrinsic; }, set value(_v) { game.u.uprops[LEVITATION].intrinsic = _v; } }, (rn2(50) + (250)));
        /* can descend at will (stop levitating via '>') provided timeout
           is the only factor (ie, not also wearing Lev ring or boots) */
        game.u.uprops[LEVITATION].intrinsic |= 536870912;
    /* timeout is already at least 1 */
    } else {
        incr_itimeout({ get value() { return game.u.uprops[LEVITATION].intrinsic; }, set value(_v) { game.u.uprops[LEVITATION].intrinsic = _v; } }, (rn2(140) + (10)));
    }
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && ((game.level.locations[game.u.ux][game.u.uy].typ) == SINK)) {
        spoteffects((0));
    }
    /* levitating blocks flying */
    float_vs_flight();
}
export function peffect_gain_energy(otmp) {
    let num = 0;
    if (otmp.cursed) {
        You_feel("lackluster.");
    } else {
        pline("Magical energies course through your body.");
    }
    /* old: num = rnd(5) + 5 * otmp->blessed + 1;
     *      blessed:  +7..11 max & current (+9 avg)
     *      uncursed: +2.. 6 max & current (+4 avg)
     *      cursed:   -2.. 6 max & current (-4 avg)
     * new: (3.6.0)
     *      blessed:  +3..18 max (+10.5 avg), +9..54 current (+31.5 avg)
     *      uncursed: +2..12 max (+ 7   avg), +6..36 current (+21   avg)
     *      cursed:   -1.. 6 max (- 3.5 avg), -3..18 current (-10.5 avg)
     */
    num = d(otmp.blessed ? 3 : !otmp.cursed ? 2 : 1, 6);
    if (otmp.cursed) {
        num = -num;
    }
    /* subtract instead of add when cursed */
    game.u.uenmax += num;
    if (game.u.uenmax > game.u.uenpeak) {
        game.u.uenpeak = game.u.uenmax;
    } else if (game.u.uenmax <= 0) {
        game.u.uenmax = 0;
    }
    game.u.uen += 3 * num;
    if (game.u.uen > game.u.uenmax) {
        game.u.uen = game.u.uenmax;
    } else if (game.u.uen <= 0) {
        game.u.uen = 0;
    }
    game.disp.botl = (1);
    exercise(A_WIS, (1));
}
export function peffect_oil(otmp) {
    let good_for_you = (0);
    let vulnerable = 0;
    if (otmp.lamplit) {
        if (((game.youmonst.data) == game.mons[PM_FIRE_VORTEX] || (game.youmonst.data) == game.mons[PM_FLAMING_SPHERE] || (game.youmonst.data == game.mons[PM_FIRE_ELEMENTAL] || game.youmonst.data == game.mons[PM_SALAMANDER]))) {
            pline("Ahh, a refreshing drink.");
            good_for_you = (1);
        } else {
            /*
             * Note: if poly'd into green slime, hero ought to take
             * extra damage, but drinking potions in that form isn't
             * possible so there's no need to try to handle that.
             */
            You("burn your %s.", body_part(FACE));
            vulnerable = !(game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) || (game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic);
            losehp(d(vulnerable ? 4 : 2, 4), "quaffing a burning potion of oil", 1);
        }
        /*
         * This is slightly iffy because the burning isn't being
         * spread across the body.  But the message is "the slime
         * that covers you burns away" and having that follow
         * "you burn your face" seems consistent enough.
         */
        burn_away_slime();
    } else if (otmp.cursed) {
        pline("This tastes like castor oil.");
    } else {
        pline("That was smooth!");
    }
    exercise(A_WIS, good_for_you);
}
export function peffect_acid(otmp) {
    if ((game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
        /* Not necessarily a creature who _likes_ acid */
        pline("This tastes %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "tangy" : "sour");
    } else {
        let dmg = 0;
        pline("This burns%s!", otmp.blessed ? " a little" : otmp.cursed ? " a lot" : " like acid");
        dmg = d(otmp.cursed ? 2 : 1, otmp.blessed ? 4 : 8);
        losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "potion of acid", 0);
        exercise(A_CON, (0));
    }
    if (game.u.uprops[STONED].intrinsic) {
        fix_petrification();
    }
    game.potion_unkn++;
}
export function peffect_polymorph(otmp) {
    You_feel("a little %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : "strange");
    if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
        if (!otmp.blessed || (game.u.umonnum != game.u.umonster)) {
            polyself(POLY_NOFLAGS);
        } else {
            polyself(POLY_CONTROLLED | POLY_LOW_CTRL);
            if (game.u.mtimedone && game.u.umonnum != game.u.umonster) {
                game.u.mtimedone = ((game.u.mtimedone) < (rn2(15) + 10) ? (game.u.mtimedone) : (rn2(15) + 10));
            }
        }
    }
}
export async function peffects(otmp) {
    switch (otmp.otyp) {
        case POT_RESTORE_ABILITY:
        case SPE_RESTORE_ABILITY:
            peffect_restore_ability(otmp);
            break;
        case POT_HALLUCINATION:
            peffect_hallucination(otmp);
            break;
        case POT_WATER:
            peffect_water(otmp);
            break;
        case POT_BOOZE:
            peffect_booze(otmp);
            break;
        case POT_ENLIGHTENMENT:
            peffect_enlightenment(otmp);
            break;
        case SPE_INVISIBILITY:
        case POT_INVISIBILITY:
            peffect_invisibility(otmp);
            break;
        /* tastes like fruit juice in Rogue */
        case POT_SEE_INVISIBLE:
        case POT_FRUIT_JUICE:
            peffect_see_invisible(otmp);
            break;
        case POT_PARALYSIS:
            peffect_paralysis(otmp);
            break;
        case POT_SLEEPING:
            peffect_sleeping(otmp);
            break;
        case POT_MONSTER_DETECTION:
        case SPE_DETECT_MONSTERS:
            if (peffect_monster_detection(otmp)) {
                return 1;
            }
            break;
        case POT_OBJECT_DETECTION:
        case SPE_DETECT_TREASURE:
            if (peffect_object_detection(otmp)) {
                return 1;
            }
            break;
        case POT_SICKNESS:
            peffect_sickness(otmp);
            break;
        case POT_CONFUSION:
            peffect_confusion(otmp);
            break;
        case POT_GAIN_ABILITY:
            peffect_gain_ability(otmp);
            break;
        case POT_SPEED:
        case SPE_HASTE_SELF:
            peffect_speed(otmp);
            break;
        case POT_BLINDNESS:
            peffect_blindness(otmp);
            break;
        case POT_GAIN_LEVEL:
            await peffect_gain_level(otmp);
            break;
        case POT_HEALING:
            peffect_healing(otmp);
            break;
        case POT_EXTRA_HEALING:
            peffect_extra_healing(otmp);
            break;
        case POT_FULL_HEALING:
            peffect_full_healing(otmp);
            break;
        case POT_LEVITATION:
        case SPE_LEVITATION:
            peffect_levitation(otmp);
            break;
        case POT_GAIN_ENERGY:
            peffect_gain_energy(otmp);
            break;
        case POT_OIL:
            peffect_oil(otmp);
            break;
        case POT_ACID:
            peffect_acid(otmp);
            break;
        case POT_POLYMORPH:
            peffect_polymorph(otmp);
            break;
        default:
            impossible("What a funny potion! (%u)", otmp.otyp);
            return 0;
    }
    return -1;
}
export function healup(nhp, nxtra, curesick, cureblind) {
    if (nhp) {
        if ((game.u.umonnum != game.u.umonster)) {
            game.u.mh += nhp;
            if (game.u.mh > game.u.mhmax) {
                game.u.mh = (game.u.mhmax += nxtra);
            }
        } else {
            game.u.uhp += nhp;
            if (game.u.uhp > game.u.uhpmax) {
                game.u.uhp = (game.u.uhpmax += nxtra);
                if (game.u.uhpmax > game.u.uhppeak) {
                    game.u.uhppeak = game.u.uhpmax;
                }
            }
        }
    }
    if (cureblind) {
        /* 3.6.1: it's debatable whether healing magic should clean off
           mundane 'dirt', but if it doesn't, blindness isn't cured */
        game.u.ucreamed = 0;
        make_blinded(0, (1));
        make_deaf(0, (1));
    }
    if (curesick) {
        make_vomiting(0, (1));
        make_sick(0, null, (1), 3);
    }
    game.disp.botl = (1);
    return;
}
export function strange_feeling(obj, txt) {
    if (game.flags.beginner || !txt) {
        You("have a %s feeling for a moment, then it passes.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : "strange");
    } else {
        pline("%s", txt);
    }
    /* e.g., crystal ball finds no traps */
    if (!obj) {
        return;
    }
    if (obj.dknown) {
        trycall(obj);
    }
    useup(obj);
}
const bottlenames = ["bottle", "phial", "flagon", "carafe", "flask", "jar", "vial"];
const hbottlenames = ["jug", "pitcher", "barrel", "tin", "bag", "box", "glass", "beaker", "tumbler", "vase", "flowerpot", "pan", "thingy", "mug", "teacup", "teapot", "keg", "bucket", "thermos", "amphora", "wineskin", "parcel", "bowl", "ampoule"];
export function bottlename() {
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        return hbottlenames[rn2((Math.trunc(192 /* sizeof(const char *[24]) */ / 8 /* sizeof(const char *) */)))];
    } else {
        return bottlenames[rn2((Math.trunc(56 /* sizeof(const char *[7]) */ / 8 /* sizeof(const char *) */)))];
    }
}
/* handle item dipped into water potion or steed saddle splashed by same */
/* water */
/* item being dipped into the water */
/* will hero see the glow/aura? */
/* "Your widget glows" or "Steed's saddle glows" */
export function H2Opotion_dip(potion, targobj, useeit, objphrase) {
    let func = null;
    let glowcolor = null;
    let costchange = (-1);
    let altfmt = (0);
    let res = (0);
    if (!potion || potion.otyp != POT_WATER) {
        return (0);
    }
    if (potion.blessed) {
        if (targobj.cursed) {
            func = uncurse;
            glowcolor = c_color_names.c_amber;
            costchange = COST_UNCURS;
        } else if (!targobj.blessed) {
            func = bless;
            glowcolor = c_color_names.c_light_blue;
            costchange = (-2);
            altfmt = (1);
        }
    } else if (potion.cursed) {
        if (targobj.blessed) {
            func = unbless;
            glowcolor = "brown";
            costchange = COST_UNBLSS;
        } else if (!targobj.cursed) {
            func = curse;
            glowcolor = c_color_names.c_black;
            costchange = (-2);
            altfmt = (1);
        }
    } else {
        if (((targobj).where == 3)) {
            /* dipping into uncursed water; carried() check skips steed saddle */
            /* water_damage() might set this */
            game.mentioned_water = (0);
            if (water_damage(targobj, null, (1)) != 0) {
                res = (1);
            }
            if (game.mentioned_water) {
                discover_object((POT_WATER), (1), (1), (1));
            }
            game.mentioned_water = (0);
        }
    }
    if (func) {
        if (useeit) {
            /* give feedback before altering the target object;
           this used to set obj->bknown even when not seeing
           the effect; now hero has to see the glow, and bknown
           is cleared instead of set if perception is distorted */
            glowcolor = hcolor(glowcolor);
            if (altfmt) {
                pline("%s with %s aura.", objphrase, an(glowcolor));
            } else {
                pline("%s %s.", objphrase, glowcolor);
            }
            game.iflags.last_msg = PLNMSG_OBJ_GLOWS;
            targobj.bknown = !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic));
        } else {
            /* didn't see what happened:  forget the BUC state if that was
               known unless the bless/curse state of the water is known;
               without this, hero would know the new state even without
               seeing the glow; priest[ess] will immediately relearn it */
            /* [should the bknown+dknown exception require that water
               be discovered or at least named?] */
            if (!potion.bknown || !potion.dknown) {
                targobj.bknown = 0;
            }
        }
        if (targobj.unpaid && targobj.otyp == POT_WATER) {
            /* potions of water are the only shop goods whose price depends
           on their curse/bless state */
            if (costchange == (-2)) {
                alter_cost(targobj, 0);
            } else if (costchange != (-1)) {
                costly_alteration(targobj, costchange);
            }
        }
        /* finally, change curse/bless state */
        (func)(targobj);
        res = (1);
    }
    return res;
}
/* used when blessed or cursed scroll of light interacts with artifact light;
   if the lit object (Sunsword or gold dragon scales/mail) doesn't resist,
   treat like dipping it in holy or unholy water (BUC change, glow message) */
/* wielded Sunsword or worn gold dragon scales/mail */
/* True: lower BUC state unless already cursed;
                      * False: raise BUC state unless already blessed */
/* True: give "<obj> glows <color>" message */
export function impact_arti_light(obj, worsen, seeit) {
    let otmp = null;
    /* if already worst/best BUC it can be, or if it resists, do nothing */
    if ((worsen ? obj.cursed : obj.blessed) || obj_resists(obj, 25, 75)) {
        return;
    }
    /* curse() and bless() take care of maybe_adjust_light() */
    otmp = mksobj(POT_WATER, (1), (0));
    if (worsen) {
        curse(otmp);
    } else {
        bless(otmp);
    }
    H2Opotion_dip(otmp, obj, seeit, seeit ? Yobjnam2(obj, "glow") : "");
    dealloc_obj(otmp);
    return;
}
/* potion obj hits monster mon, which might be youmonst; obj always used up */
export function potionhit(mon, obj, how) {
    let botlnam = bottlename();
    let isyou = (mon == game.youmonst);
    let distance = 0;
    let tx = 0;
    let ty = 0;
    let saddle = null;
    let hit_saddle = (0);
    let your_fault = (how <= 1);
    if (isyou) {
        tx = game.u.ux , ty = game.u.uy;
        distance = 0;
        pline_The("%s crashes on your %s and breaks into shards.", botlnam, body_part(HEAD));
        losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((rnd(2)) + 1) / 2)) : (rnd(2))), (how == 3) ? "propelled potion" : "thrown potion", 0);
    } else {
        tx = mon.mx , ty = mon.my;
        /* sometimes it hits the saddle */
        if (((mon.misc_worn_check & 1048576) && (saddle = which_armor(mon, 1048576))) && (!rn2(10) || (obj.otyp == POT_WATER && ((rnl(10) > 7 && obj.cursed) || (rnl(10) < 4 && obj.blessed) || !rn2(3))))) {
            hit_saddle = (1);
        }
        distance = dist2((tx), (ty), game.u.ux, game.u.uy);
        if (!((game.viz_array[ty][tx] & 2) != 0)) {
            ;
            pline("Crash!");
        } else {
            let mnam = mon_nam(mon);
            let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            if (hit_saddle && saddle) {
                buf = sprintf(buf, "%s saddle", s_suffix(x_monnam(mon, 1, null, (1 | 8), (0))));
            } else if ((((mon.data).mflags1 & 32768) == 0)) {
                buf = sprintf(buf, "%s %s", s_suffix(mnam), (game.notonhead ? "body" : "head"));
            } else {
                buf = strcpy(buf, mnam);
            }
            ;
            pline_The("%s crashes on %s and breaks into shards.", botlnam, buf);
        }
        if (rn2(5) && mon.mhp > 1 && !hit_saddle) {
            mon.mhp--;
        }
    }
    /* oil doesn't instantly evaporate; Neither does a saddle hit */
    if (obj.otyp != POT_OIL && !hit_saddle && ((game.viz_array[ty][tx] & 2) != 0)) {
        pline("%s.", Tobjnam(obj, "evaporate"));
    }
    if (isyou) {
        switch (obj.otyp) {
            case POT_OIL:
                if (obj.lamplit) {
                    explode_oil(obj, game.u.ux, game.u.uy);
                }
                break;
            case POT_POLYMORPH:
                You_feel("a little %s.", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "normal" : "strange");
                if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic) && !(game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
                    polyself(POLY_NOFLAGS);
                }
                break;
            case POT_ACID:
                if (!(game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic)) {
                    let dmg = 0;
                    pline("This burns%s!", obj.blessed ? " a little" : obj.cursed ? " a lot" : "");
                    dmg = d(obj.cursed ? 2 : 1, obj.blessed ? 4 : 8);
                    losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), "potion of acid", 0);
                }
                break;
        }
    } else if (hit_saddle && saddle) {
        let mnam = null;
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let saddle_glows = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let affected = (0);
        let useeit = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && canseemon(mon) && ((game.viz_array[ty][tx] & 2) != 0);
        mnam = x_monnam(mon, 1, null, (1 | 8), (0));
        buf = sprintf(buf, "%s", upstart(s_suffix(mnam)));
        switch (obj.otyp) {
            case POT_WATER:
                nh_snprintf("potionhit", 1718, saddle_glows, 256 /* sizeof(char [256]) */, "%s %s", buf, aobjnam(saddle, "glow"));
                affected = H2Opotion_dip(obj, saddle, useeit, saddle_glows);
                break;
            case POT_POLYMORPH:
                break;
        }
        if (useeit && !affected) {
            pline("%s %s wet.", buf, aobjnam(saddle, "get"));
        }
    } else {
        let angermon = your_fault;
        let cureblind = (0);
        switch (obj.otyp) {
            case POT_FULL_HEALING:
                cureblind = (1);
                ;
            case POT_EXTRA_HEALING:
                if (!obj.cursed) {
                    cureblind = (1);
                }
                ;
            case POT_HEALING:
                if (obj.blessed) {
                    cureblind = (1);
                }
                if (mon.data == game.mons[PM_PESTILENCE]) {
                    if (mon.mhp > 2) {
                        mon.mhp = Math.trunc(mon.mhp / 2);
                        if (canseemon(mon)) {
                            pline("%s looks rather ill.", Monnam(mon));
                        }
                    }
                    break;
                }
                ;
            case POT_RESTORE_ABILITY:
            case POT_GAIN_ABILITY:
                angermon = (0);
                if (mon.mhp < mon.mhpmax) {
                    healmon(mon, mon.mhpmax, 0);
                    if (canseemon(mon)) {
                        pline("%s looks sound and hale again.", Monnam(mon));
                    }
                }
                if (cureblind) {
                    mcureblindness(mon, canseemon(mon));
                }
                break;
            case POT_SICKNESS:
                if (mon.data == game.mons[PM_PESTILENCE]) {
                    angermon = (0);
                    if (mon.mhp < mon.mhpmax) {
                        healmon(mon, mon.mhpmax, 0);
                        if (canseemon(mon)) {
                            pline("%s looks sound and hale again.", Monnam(mon));
                        }
                    }
                    if (cureblind) {
                        mcureblindness(mon, canseemon(mon));
                    }
                    break;
                }
                if (dmgtype(mon.data, 33) || dmgtype(mon.data, 38) || Resists_Elem(mon, POISON_RES)) {
                    /* won't happen, see prior goto */
                    if (canseemon(mon)) {
                        pline("%s looks unharmed.", Monnam(mon));
                    }
                    break;
                }
                if (mon.mhp > 2) {
                    mon.mhp = Math.trunc(mon.mhp / 2);
                    if (canseemon(mon)) {
                        pline("%s looks rather ill.", Monnam(mon));
                    }
                }
                break;
            case POT_CONFUSION:
            case POT_BOOZE:
                if (!resist(mon, POTION_CLASS, 0, 0)) {
                    mon.mconf = (1);
                }
                break;
            case POT_INVISIBILITY:
{
                    let sawit = (canseemon(mon) || sensemon(mon));
                    let cursed_potion = obj.cursed ? (1) : (0);
                    angermon = mon.minvis && cursed_potion;
                    mon_set_minvis(mon, cursed_potion);
                    if (sawit && !(canseemon(mon) || sensemon(mon))) {
                        if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
                            map_invisible(mon.mx, mon.my);
                        }
                    } else if (sawit && cursed_potion) {
                        /* see use_misc(muse.c) for comment about map_invisible() */
                        pline("%s briefly seems to be transparent.", Monnam(mon));
                    } else if (!sawit && (canseemon(mon) || sensemon(mon))) {
                        /* if an invisible mon glyph was present, mon_set_minvis()'s
                   newsym() has gotten rid of it */
                        pline("%s appears!", Monnam(mon));
                    }
                    break;
                }
            case POT_SLEEPING:
                if (sleep_monst(mon, rnd(12), POTION_CLASS)) {
                    /* wakeup() doesn't rouse victims of temporary sleep */
                    pline("%s falls asleep.", Monnam(mon));
                    slept_monst(mon);
                }
                break;
            case POT_PARALYSIS:
                if (mon.mcanmove) {
                    /* really should be rnd(5) for consistency with players
                 * breathing potions, but...
                 */
                    paralyze_monst(mon, rnd(25));
                }
                break;
            case POT_SPEED:
                angermon = (0);
                mon_adjust_speed(mon, 1, obj);
                break;
            case POT_BLINDNESS:
                if ((((mon.data).mflags1 & 4096) == 0) && !(!mon.mcansee && !mon.mblinded)) {
                    let btmp = 64 + rn2(32) + rn2(32) * !resist(mon, POTION_CLASS, 0, 0);
                    btmp += mon.mblinded;
                    mon.mblinded = ((btmp) < (127) ? (btmp) : (127));
                    mon.mcansee = 0;
                }
                break;
            case POT_WATER:
                if (mon_hates_blessings(mon) || (((mon.data).mflags2 & 4) != 0) || ((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) {
                    if (obj.blessed) {
                        pline("%s %s in pain!", Monnam(mon), ((mon.data).msound == MS_SILENT) ? "writhes" : "shrieks");
                        if (!((mon.data).msound == MS_SILENT)) {
                            wake_nearto(tx, ty, mon.data.mlevel * 10);
                        }
                        mon.mhp -= d(2, 6);
                        if (((mon).mhp < 1)) {
                            killed(mon);
                        } else if ((((mon.data).mflags2 & 4) != 0) && !(((mon.data).mflags2 & 8) != 0)) {
                            new_were(mon);
                        }
                    } else if (obj.cursed) {
                        angermon = (0);
                        if (canseemon(mon)) {
                            pline("%s looks healthier.", Monnam(mon));
                        }
                        healmon(mon, d(2, 6), 0);
                        if ((((mon.data).mflags2 & 4) != 0) && (((mon.data).mflags2 & 8) != 0) && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
                            new_were(mon);
                        }
                    }
                } else if (mon.data == game.mons[PM_GREMLIN]) {
                    angermon = (0);
                    split_mon(mon, null);
                } else if (mon.data == game.mons[PM_IRON_GOLEM]) {
                    if (canseemon(mon)) {
                        pline("%s rusts.", Monnam(mon));
                    }
                    mon.mhp -= d(1, 6);
                    if (((mon).mhp < 1)) {
                        killed(mon);
                    }
                }
                break;
            case POT_OIL:
                if (obj.lamplit) {
                    explode_oil(obj, tx, ty);
                }
                break;
            case POT_ACID:
                if (!Resists_Elem(mon, ACID_RES) && !resist(mon, POTION_CLASS, 0, 0)) {
                    pline("%s %s in pain!", Monnam(mon), ((mon.data).msound == MS_SILENT) ? "writhes" : "shrieks");
                    if (!((mon.data).msound == MS_SILENT)) {
                        wake_nearto(tx, ty, mon.data.mlevel * 10);
                    }
                    mon.mhp -= d(obj.cursed ? 2 : 1, obj.blessed ? 4 : 8);
                    if (((mon).mhp < 1)) {
                        if (your_fault) {
                            killed(mon);
                        } else {
                            monkilled(mon, "", 8);
                        }
                    }
                }
                break;
            case POT_POLYMORPH:
                bhitm(mon, obj);
                break;
        }
        if (!((mon).mhp < 1)) {
            if (angermon) {
                wakeup(mon, (1));
            /* target might have been killed */
            } else {
                mon.msleeping = 0;
            }
        }
    }
    /* Note: potionbreathe() does its own docall() */
    if ((distance == 0 || (distance < 3 && !rn2(Math.trunc((1 + (acurr(A_DEX))) / 2)))) && (!(((game.youmonst.data).mflags1 & 1024) != 0) || (((game.youmonst.data).mflags1 & 4096) == 0))) {
        potionbreathe(obj);
    } else if (obj.dknown && ((game.viz_array[ty][tx] & 2) != 0)) {
        trycall(obj);
    }
    if (game.u.ushops && obj.unpaid) {
        let shkp = shop_keeper(in_rooms(game.u.ux, game.u.uy, SHOPBASE));
        if (!shkp) {
            obj.unpaid = 0;
        } else if (game.context.mon_moving) {
            subfrombill(obj, shkp);
        /* neither of the first two cases should be able to happen;
           only the hero should ever have an unpaid item, and only
           when inside a tended shop */
        /* if shkp was killed, unpaid ought to cleared already */
        } else {
            stolen_value(obj, game.u.ux, game.u.uy, shkp.mpeaceful, (0));
        }
    }
    obfree(obj, null);
}
/* vapors are inhaled or get in your eyes */
export function potionbreathe(obj) {
    let i = 0;
    let ii = 0;
    let isdone = 0;
    let kn = 0;
    let cureblind = (0);
    let already_in_use = obj.in_use;
    /* potion of unholy water might be wielded; prevent
       you_were() -> drop_weapon() from dropping it so that it
       remains in inventory where our caller expects it to be */
    obj.in_use = 1;
    switch ((game.ublindf && game.ublindf.otyp == TOWEL && game.ublindf.spe > 0) ? TOWEL : obj.otyp) {
        /* wearing a wet towel protects both eyes and breathing, even when
       the breath effect might be beneficial; we still pass down to the
       naming opportunity in case potion was thrown at hero by a monster */
        case TOWEL:
            pline("Some vapor passes harmlessly around you.");
            break;
        case POT_RESTORE_ABILITY:
        case POT_GAIN_ABILITY:
            if (obj.cursed) {
                if (!(((game.youmonst.data).mflags1 & 1024) != 0)) {
                    pline("Ulch!  That potion smells terrible!");
                } else if ((((game.youmonst.data).mflags1 & 4096) == 0)) {
                    let eyes = body_part(EYE);
                    if ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) != 1) {
                        eyes = makeplural(eyes);
                    }
                    Your("%s %s!", eyes, vtense(eyes, "sting"));
                }
                break;
            } else {
                i = rn2(A_MAX);
                for (isdone = ii = 0; !isdone && ii < A_MAX; ii++) {
                    if ((game.u.acurr.a[i]) < (game.u.amax.a[i])) {
                        (game.u.acurr.a[i])++;
                        isdone = !(obj.blessed);
                        game.disp.botl = (1);
                    }
                    if (++i >= A_MAX) {
                        i = 0;
                    }
                }
            }
            break;
        case POT_FULL_HEALING:
            if ((game.u.umonnum != game.u.umonster) && game.u.mh < game.u.mhmax) {
                game.u.mh++ , game.disp.botl = (1);
            }
            if (game.u.uhp < game.u.uhpmax) {
                game.u.uhp++ , game.disp.botl = (1);
            }
            cureblind = (1);
            ;
        case POT_EXTRA_HEALING:
            if ((game.u.umonnum != game.u.umonster) && game.u.mh < game.u.mhmax) {
                game.u.mh++ , game.disp.botl = (1);
            }
            if (game.u.uhp < game.u.uhpmax) {
                game.u.uhp++ , game.disp.botl = (1);
            }
            if (!obj.cursed) {
                cureblind = (1);
            }
            ;
        case POT_HEALING:
            if ((game.u.umonnum != game.u.umonster) && game.u.mh < game.u.mhmax) {
                game.u.mh++ , game.disp.botl = (1);
            }
            if (game.u.uhp < game.u.uhpmax) {
                game.u.uhp++ , game.disp.botl = (1);
            }
            if (obj.blessed) {
                cureblind = (1);
            }
            if (cureblind) {
                make_blinded(0, !game.u.ucreamed);
                make_deaf(0, (1));
            }
            exercise(A_CON, (1));
            break;
        case POT_SICKNESS:
            if (!(game.urole.mnum == (PM_HEALER))) {
                if ((game.u.umonnum != game.u.umonster)) {
                    if (game.u.mh <= 5) {
                        game.u.mh = 1;
                    } else {
                        game.u.mh -= 5;
                    }
                } else {
                    if (game.u.uhp <= 5) {
                        game.u.uhp = 1;
                    } else {
                        game.u.uhp -= 5;
                    }
                }
                game.disp.botl = (1);
                exercise(A_CON, (0));
            }
            break;
        case POT_HALLUCINATION:
            You("have a momentary vision.");
            break;
        case POT_CONFUSION:
        case POT_BOOZE:
            if (!game.u.uprops[CONFUSION].intrinsic) {
                You_feel("somewhat dizzy.");
            }
            make_confused(itimeout_incr(game.u.uprops[CONFUSION].intrinsic, rnd(5)), (0));
            break;
        case POT_INVISIBILITY:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked)) {
                kn++;
                pline("For an instant you %s!", (game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic) ? "could see right through yourself" : "couldn't see yourself");
            }
            break;
        case POT_PARALYSIS:
            kn++;
            if (!game.u.uprops[FREE_ACTION].extrinsic) {
                pline("%s seems to be holding you.", c_common_strings.c_Something);
                nomul(-rnd(5));
                game.multi_reason = "frozen by a potion";
                game.nomovemsg = c_common_strings.c_You_can_move_again;
                exercise(A_DEX, (0));
            } else {
                You("stiffen momentarily.");
            }
            break;
        case POT_SLEEPING:
            kn++;
            if (!game.u.uprops[FREE_ACTION].extrinsic && !(game.u.uprops[SLEEP_RES].intrinsic || game.u.uprops[SLEEP_RES].extrinsic)) {
                You_feel("rather tired.");
                nomul(-rnd(5));
                game.multi_reason = "sleeping off a magical draught";
                game.nomovemsg = c_common_strings.c_You_can_move_again;
                exercise(A_DEX, (0));
            } else {
                You("yawn.");
                monstseesu(M_SEEN_SLEEP);
            }
            break;
        case POT_SPEED:
            if (!(game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic)) {
                Your("knees seem more flexible now.");
            }
            incr_itimeout({ get value() { return game.u.uprops[FAST].intrinsic; }, set value(_v) { game.u.uprops[FAST].intrinsic = _v; } }, rnd(5));
            exercise(A_DEX, (1));
            break;
        case POT_BLINDNESS:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.multi < 0 && (unconscious() || is_fainted()))) {
                kn++;
                pline("It suddenly gets dark.");
            }
            make_blinded(itimeout_incr((game.u.uprops[BLINDED].intrinsic & 16777215), rnd(5)), (0));
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.multi < 0 && (unconscious() || is_fainted()))) {
                Your("%s", c_common_strings.c_vision_clears);
            }
            break;
        case POT_WATER:
            if (game.u.umonnum == PM_GREMLIN) {
                split_mon(game.youmonst, null);
            } else if (((game.u.ulycn) >= LOW_PM && (game.u.ulycn) < NUMMONS)) {
                /* vapor from [un]holy water will trigger
               transformation but won't cure lycanthropy */
                if (obj.blessed && game.youmonst.data == game.mons[game.u.ulycn]) {
                    you_unwere((0));
                } else if (obj.cursed && !(game.u.umonnum != game.u.umonster)) {
                    you_were();
                }
            }
            break;
        case POT_ACID:
        case POT_POLYMORPH:
            exercise(A_CON, (0));
            break;
    }
    if (!already_in_use) {
        obj.in_use = 0;
    }
    if (obj.dknown) {
        if (kn) {
            discover_object((obj.otyp), (1), (1), (1));
        /* note: no obfree() -- that's our caller's responsibility */
        } else {
            trycall(obj);
        }
    }
    return;
}
/* returns the potion type when o1 is dipped in o2 */
export function mixtype(o1, o2) {
    let o1typ = o1.otyp;
    let o2typ = o2.otyp;
    if (o1.oclass == POTION_CLASS && (o2typ == POT_GAIN_LEVEL || o2typ == POT_GAIN_ENERGY || o2typ == POT_HEALING || o2typ == POT_EXTRA_HEALING || o2typ == POT_FULL_HEALING || o2typ == POT_ENLIGHTENMENT || o2typ == POT_FRUIT_JUICE)) {
        /* cut down on the number of cases below */
        o1typ = o2.otyp;
        o2typ = o1.otyp;
    }
    switch (o1typ) {
        case POT_HEALING:
            if (o2typ == POT_SPEED) {
                return POT_EXTRA_HEALING;
            }
            ;
        case POT_EXTRA_HEALING:
        case POT_FULL_HEALING:
            if (o2typ == POT_GAIN_LEVEL || o2typ == POT_GAIN_ENERGY) {
                return (o1typ == POT_HEALING) ? POT_EXTRA_HEALING : (o1typ == POT_EXTRA_HEALING) ? POT_FULL_HEALING : POT_GAIN_ABILITY;
            }
            ;
        case UNICORN_HORN:
            switch (o2typ) {
                case POT_SICKNESS:
                    return POT_FRUIT_JUICE;
                case POT_HALLUCINATION:
                case POT_BLINDNESS:
                case POT_CONFUSION:
                    return POT_WATER;
            }
            break;
        /* "a-methyst" == "not intoxicated" */
        case AMETHYST:
            if (o2typ == POT_BOOZE) {
                return POT_FRUIT_JUICE;
            }
            break;
        case POT_GAIN_LEVEL:
        case POT_GAIN_ENERGY:
            switch (o2typ) {
                case POT_CONFUSION:
                    return (rn2(3) ? POT_BOOZE : POT_ENLIGHTENMENT);
                case POT_HEALING:
                    return POT_EXTRA_HEALING;
                case POT_EXTRA_HEALING:
                    return POT_FULL_HEALING;
                case POT_FULL_HEALING:
                    return POT_GAIN_ABILITY;
                case POT_FRUIT_JUICE:
                    return POT_SEE_INVISIBLE;
                case POT_BOOZE:
                    return POT_HALLUCINATION;
            }
            break;
        case POT_FRUIT_JUICE:
            switch (o2typ) {
                case POT_SICKNESS:
                    return POT_SICKNESS;
                case POT_ENLIGHTENMENT:
                case POT_SPEED:
                    return POT_BOOZE;
                case POT_GAIN_LEVEL:
                case POT_GAIN_ENERGY:
                    return POT_SEE_INVISIBLE;
            }
            break;
        case POT_ENLIGHTENMENT:
            switch (o2typ) {
                case POT_LEVITATION:
                    if (rn2(3)) {
                        return POT_GAIN_LEVEL;
                    }
                    break;
                case POT_FRUIT_JUICE:
                    return POT_BOOZE;
                case POT_BOOZE:
                    return POT_CONFUSION;
            }
            break;
    }
    return STRANGE_OBJECT;
}
/* getobj callback for object to be dipped (not the thing being dipped into,
 * that uses drink_ok) */
export function dip_ok(obj) {
    if (!obj) {
        return GETOBJ_DOWNPLAY;
    }
    /* dipping gold isn't currently implemented */
    if (obj.oclass == COIN_CLASS) {
        return GETOBJ_EXCLUDE;
    }
    if (inaccessible_equipment(obj, null, (0))) {
        return GETOBJ_EXCLUDE_INACCESS;
    }
    return GETOBJ_SUGGEST;
}
/* getobj callback for object to be dipped when hero has slippery hands */
export function dip_hands_ok(obj) {
    if (!obj && (game.u.uprops[GLIB].intrinsic && can_reach_floor((0)))) {
        return GETOBJ_SUGGEST;
    }
    return dip_ok(obj);
}
/* call hold_another_object() to deal with a transformed potion; its weight
   won't have changed but it might require an extra slot that isn't available
   or it might merge into some other carried stack */
export function hold_potion(potobj, drop_fmt, drop_arg, hold_msg) {
    let cap = near_capacity();
    let save_pickup_burden = game.flags.pickup_burden;
    /* prevent a drop due to current setting of the 'pickup_burden' option */
    if (game.flags.pickup_burden < cap) {
        game.flags.pickup_burden = cap;
    }
    /* remove from inventory after calculating near_capacity() */
    obj_extract_self(potobj);
    /* re-insert into inventory, possibly merging with compatible stack */
    potobj = hold_another_object(potobj, drop_fmt, drop_arg, hold_msg);
    ((potobj));
    game.flags.pickup_burden = save_pickup_burden;
    update_inventory();
    return;
}
/* #dip command - get item to dip, then get potion to dip it into;
   precede with 'm' to bypass fountain, pool, or sink at hero's spot */
const __dodip_Dip_ = "Dip ";
export function dodip() {
    let potion = null;
    let obj = null;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let obuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* last resort obj name for prompt */
    let shortestname = null;
    let here = game.level.locations[game.u.ux][game.u.uy].typ;
    let is_hands = 0;
    let at_pool = is_pool(game.u.ux, game.u.uy);
    let at_fountain = ((here) == FOUNTAIN);
    let at_sink = ((here) == SINK);
    let at_here = (!game.iflags.menu_requested && (at_pool || at_fountain || at_sink));
    obj = getobj("dip", at_here ? dip_hands_ok : dip_ok, 2);
    if (!obj) {
        return 2;
    }
    if (inaccessible_equipment(obj, "dip", (0))) {
        return 0;
    }
    is_hands = (obj == game.hands_obj);
    shortestname = (is_hands || ((obj).quan != 1 || ((obj).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) || ((obj).otyp == LENSES || (obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_GLOVES) || (obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_subtyp == ARM_BOOTS))) ? "them" : "it";
    game.drink_ok_extra = 0;
    /*
     * Bypass safe_qbuf() since it doesn't handle varying suffix without
     * an awful lot of support work.  Format the object once, even though
     * the fountain and pool prompts offer a lot more room for it.
     * 3.6.0 used thesimpleoname() unconditionally, which posed no risk
     * of buffer overflow but drew bug reports because it omits user-
     * supplied type name.
     * getobj: "What do you want to dip <the object> into? [xyz or ?*] "
     */
    if (is_hands) {
        nh_snprintf("dodip", 2299, obuf, 128 /* sizeof(char [128]) */, "your %s", makeplural(body_part(HAND)));
    } else {
        obuf = strcpy(obuf, short_oname(obj, doname, thesimpleoname, 128 - 78 /* sizeof(char [78]) */));
    }
    if (!game.iflags.menu_requested) {
        if (!can_reach_floor((0))) {
            ;
        } else if (at_fountain) {
            nh_snprintf("dodip", 2316, qbuf, 128 /* sizeof(char [128]) */, "%s%s into the fountain?", __dodip_Dip_, game.flags.verbose ? obuf : shortestname);
            if (yn_function(qbuf, ynchars, 110, (1)) == 121) {
                /* preceding #dip with 'm' skips the possibility of dipping into pools,
       fountains, and sinks plus the extra prompting which those entail */
                /* Is there a fountain to dip into here? */
                /* can't dip something into fountain or pool if can't reach */
                /* "Dip <the object> into the fountain?" */
                if (!is_hands) {
                    /* no longer 'recently picked up' */
                    obj.pickup_prev = 0;
                }
                dipfountain(obj);
                return 1;
            }
            ++game.drink_ok_extra;
        } else if (at_sink) {
            nh_snprintf("dodip", 2327, qbuf, 128 /* sizeof(char [128]) */, "%s%s into the sink?", __dodip_Dip_, game.flags.verbose ? obuf : shortestname);
            if (yn_function(qbuf, ynchars, 110, (1)) == 121) {
                if (!is_hands) {
                    obj.pickup_prev = 0;
                }
                dipsink(obj);
                return 1;
            }
            ++game.drink_ok_extra;
        } else if (at_pool) {
            let pooltype = waterbody_name(game.u.ux, game.u.uy);
            nh_snprintf("dodip", 2339, qbuf, 128 /* sizeof(char [128]) */, "%s%s into the %s?", __dodip_Dip_, game.flags.verbose ? obuf : shortestname, pooltype);
            if (yn_function(qbuf, ynchars, 110, (1)) == 121) {
                if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
                    /* "Dip <the object> into the {pool, moat, &c}?" */
                    floating_above(pooltype);
                } else if (game.u.usteed && !(((game.u.usteed.data).mflags1 & 2) != 0) && (game.u.weapon_skills[P_RIDING].skill) < P_BASIC) {
                    /* not skilled enough to reach */
                    rider_cant_reach();
                } else if (is_hands || obj == game.uarmg) {
                    if (!is_hands) {
                        obj.pickup_prev = 0;
                    }
                    wash_hands();
                } else {
                    obj.pickup_prev = 0;
                    if (obj.otyp == POT_ACID) {
                        /* it would be better to use up the whole stack in advance
           of the message, but we can't because we need to keep it
           around for potionbreathe() [and we can't set obj->in_use
           to 'amt' because that's not implemented] */
                        obj.in_use = 1;
                    }
                    if (water_damage(obj, null, (1)) != 3 && obj.in_use) {
                        useup(obj);
                    }
                }
                return 1;
            }
            ++game.drink_ok_extra;
        }
    }
    nh_snprintf("dodip", 2367, qbuf, 128 /* sizeof(char [128]) */, "dip %s into", game.flags.verbose ? obuf : shortestname);
    /* "What do you want to dip <the object> into? [xyz or ?*] " */
    potion = getobj(qbuf, drink_ok, 0);
    if (!potion) {
        return 2;
    }
    return potion_dip(obj, potion);
}
/* #altdip - #dip with "what to dip?" and "what to dip it into?" asked
   in the opposite order; ignores floor water; used for context-sensitive
   inventory item-action: the potion has already been selected and is in
   cmdq ready to answer the first getobj() prompt */
export function dip_into() {
    let obj = null;
    let potion = null;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!cmdq_peek(CQ_CANNED)) {
        impossible("dip_into: where is potion?");
        return 4;
    }
    game.drink_ok_extra = 0;
    potion = getobj("dip", drink_ok, 0);
    if (!potion || potion.oclass != POTION_CLASS) {
        return 2;
    }
    nh_snprintf("dip_into", 2398, qbuf, 128 /* sizeof(char [128]) */, "dip into %s%s", ((potion).quan != 1 || ((potion).oartifact == ART_EYES_OF_THE_OVERWORLD && !undiscovered_artifact(ART_EYES_OF_THE_OVERWORLD))) ? "one of " : "", thesimpleoname(potion));
    /* "What do you want to dip into <the potion>? [abc or ?*] " */
    obj = getobj(qbuf, dip_ok, 2);
    if (!obj) {
        return 2;
    }
    if (inaccessible_equipment(obj, "dip", (0))) {
        return 0;
    }
    return potion_dip(obj, potion);
}
export function poof(potion) {
    if (potion.dknown) {
        trycall(potion);
    }
    useup(potion);
}
/* do dipped potion(s) explode? */
export function dip_potion_explosion(obj, dmg) {
    if (obj.cursed || obj.otyp == POT_ACID || (obj.otyp == POT_OIL && obj.lamplit) || !rn2((game.uarmc && game.uarmc.otyp == ALCHEMY_SMOCK) ? 30 : 10)) {
        obj.in_use = 1;
        pline("%sThey explode!", !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "BOOM!  " : "");
        wake_nearto(game.u.ux, game.u.uy, (8 + 1) * (8 + 1));
        exercise(A_STR, (0));
        if (!(((game.youmonst.data).mflags1 & 1024) != 0) || (((game.youmonst.data).mflags1 & 4096) == 0)) {
            potionbreathe(obj);
        }
        useupall(obj);
        losehp(dmg, "alchemic blast", 0);
        return (1);
    }
    return (0);
}
/* called by dodip() or dip_into() after obj and potion have been chosen */
export function potion_dip(obj, potion) {
    let singlepotion = null;
    let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let mixture = 0;
    more_dips: {
        if (potion == obj && potion.quan == 1) {
            pline("That is a potion bottle, not a Klein bottle!");
            return 0;
        }
        if (obj == game.hands_obj) {
            You("can't fit your %s into the mouth of the bottle!", body_part(HAND));
            return 0;
        }
        obj.pickup_prev = 0;
        /* assume it will be used up */
        potion.in_use = (1);
        if (potion.otyp == POT_WATER) {
            let useeit = !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (obj == game.ublindf && (game.u.uprops[BLINDED].extrinsic && !(game.u.uprops[BLINDED].intrinsic && !game.u.uprops[BLINDED].blocked)));
            let obj_glows = Yobjnam2(obj, "glow");
            if (H2Opotion_dip(potion, obj, useeit, obj_glows)) {
                /* wetting towel already done via water_damage() in H2Opotion_dip */
                poof(potion);
                return 1;
            }
        } else if (obj.otyp == POT_POLYMORPH || potion.otyp == POT_POLYMORPH) {
            if (obj_unpolyable(obj.otyp == POT_POLYMORPH ? potion : obj)) {
                pline("%s", c_common_strings.c_nothing_happens);
            } else {
                let save_otyp = obj.otyp;
                if (!game.u.uconduct.polypiles++) {
                    livelog_printf(32, "polymorphed %s first item", (genders[game.flags.female ? 1 : 0].his));
                }
                obj = poly_obj(obj, STRANGE_OBJECT);
                if (!obj) {
                    discover_object((POT_POLYMORPH), (1), (1), (1));
                    /* some objects can't be polymorphed */
                    /*
             * obj might be gone:
             *  poly_obj() -> set_wear() -> Amulet_on() -> useup()
             * if obj->otyp is worn amulet and becomes AMULET_OF_CHANGE.
             */
                    return 1;
                } else if (obj.otyp != save_otyp) {
                    discover_object((POT_POLYMORPH), (1), (1), (1));
                    /* get rid of 'dippee' before potential perm_invent updates */
                    /* Allow filling of MAGIC_LAMPs to prevent identification by player */
                    /* Turn off engine before fueling, turn off fuel too :-)  */
                    useup(potion);
                    prinv(null, obj, 0);
                    return 1;
                } else {
                    pline("%s", c_common_strings.c_nothing_seems_to_happen);
                    poof(potion);
                    return 1;
                }
            }
            potion.in_use = (0);
            return 1;
        } else if (obj.oclass == POTION_CLASS && obj.otyp != potion.otyp) {
            let amt = obj.quan;
            let magic = 0;
            mixture = mixtype(obj, potion);
            magic = (mixture != STRANGE_OBJECT) ? game.objects[mixture].oc_magic : (game.objects[obj.otyp].oc_magic || game.objects[potion.otyp].oc_magic);
            qbuf = strcpy(qbuf, "The");
            if (amt > (obj.oeroded ? 2 : magic ? 3 : 7)) {
                if (obj.oeroded) {
                    amt = 2;
                } else if (magic) {
                    amt = rnd(((amt) < (8) ? (amt) : (8)) - (3 - 1)) + (3 - 1);
                /* Trying to dip multiple potions will usually affect only a
               subset; pick an amount between 3 and 8, inclusive, for magic
               potion result, between 7 and N for non-magic. If diluted
               potions are being dipped, only two are affected; this is a
               balance fix to prevent cheap mass alchemy of the (very
               common) potion of healing into the (very valuable) potion of
               full healing, whilst permitting both healing->extra healing
               and extra healing->full healing. */
                } else {
                    amt = rnd(amt - (7 - 1)) + (7 - 1);
                }
                if (amt < obj.quan) {
                    obj = splitobj(obj, amt);
                    qbuf = sprintf(qbuf, "%ld of the", obj.quan);
                }
            }
            /* [N of] the {obj(s)} mix(es) with [one of] {the potion}... */
            pline("%s %s %s with %s%s...", qbuf, simpleonames(obj), otense(obj, "mix"), (potion.quan > 1) ? "one of " : "", thesimpleoname(potion));
            useup(potion);
            /* Mixing potions is dangerous...
           KMH, balance patch -- acid is particularly unstable */
            if (dip_potion_explosion(obj, amt + rnd(9))) {
                return 1;
            }
            obj.blessed = obj.cursed = obj.bknown = 0;
            if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                obj.dknown = 0;
            }
            if (mixture != STRANGE_OBJECT) {
                obj.otyp = mixture;
            } else {
                let otmp = null;
                switch (obj.oeroded ? 1 : rnd(8)) {
                    case 1:
                        obj.otyp = POT_WATER;
                        break;
                    case 2:
                    case 3:
                        obj.otyp = POT_SICKNESS;
                        break;
                    case 4:
                        otmp = mkobj(POTION_CLASS, (0));
                        obj.otyp = otmp.otyp;
                        /* oil uses obj->age field differently from other potions */
                        if (obj.otyp == POT_OIL || otmp.otyp == POT_OIL) {
                            fixup_oil(obj, otmp);
                        }
                        obfree(otmp, null);
                        break;
                    default:
                        useupall(obj);
                        pline_The("mixture %sevaporates.", !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "glows brightly and " : "");
                        return 1;
                }
            }
            obj.oeroded = (obj.otyp != POT_WATER);
            if (obj.otyp == POT_WATER && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                pline_The("mixture bubbles%s.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "" : ", then clears");
            } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline_The("mixture looks %s.", hcolor((game.obj_descr[(game.objects[obj.otyp]).oc_descr_idx].oc_descr)));
            }
            /* this is required when 'obj' was split off from a bigger stack,
           so that 'obj' will now be assigned its own inventory slot;
           it has a side-effect of merging 'obj' into another compatible
           stack if there is one, so we do it even when no split has
           been made in order to get the merge result for both cases;
           as a consequence, mixing while Fumbling drops the mixture */
            freeinv(obj);
            hold_potion(obj, "You drop %s!", doname(obj), null);
            return 1;
        }
        if (potion.otyp == POT_ACID && obj.otyp == CORPSE && obj.corpsenm == PM_LICHEN) {
            pline("%s %s %s around the edges.", The(cxname(obj)), otense(obj, "turn"), ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "wrinkled" : potion.oeroded ? hcolor(c_color_names.c_orange) : hcolor(c_color_names.c_red));
            potion.in_use = (0);
            if (potion.dknown) {
                trycall(potion);
            }
            return 1;
        }
        if (potion.otyp == POT_WATER && obj.otyp == TOWEL) {
            pline_The("towel soaks it up!");
            poof(potion);
            return 1;
        }
        if (((obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp >= -P_SHURIKEN && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || permapoisoned(obj))) {
            if (potion.otyp == POT_SICKNESS && !obj.otrapped) {
                let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                if (potion.quan > 1) {
                    buf = sprintf(buf, "One of %s", the(xname(potion)));
                } else {
                    buf = strcpy(buf, The(xname(potion)));
                }
                pline("%s forms a coating on %s.", buf, the(xname(obj)));
                obj.otrapped = (1);
                poof(potion);
                return 1;
            } else if (obj.otrapped && !permapoisoned(obj) && (potion.otyp == POT_HEALING || potion.otyp == POT_EXTRA_HEALING || potion.otyp == POT_FULL_HEALING)) {
                pline("A coating wears off %s.", the(xname(obj)));
                obj.otrapped = 0;
                poof(potion);
                return 1;
            }
        }
        if (potion.otyp == POT_ACID) {
            if (erode_obj(obj, null, 3, 1) != 0) {
                poof(potion);
                return 1;
            }
        }
        if (potion.otyp == POT_OIL) {
            let wisx = (0);
            if (potion.lamplit) {
                fire_damage(obj, (1), game.u.ux, game.u.uy);
            } else if (potion.cursed) {
                pline_The("potion spills and covers your %s with oil.", fingers_or_gloves((1)));
                make_glib((game.u.uprops[GLIB].intrinsic & 16777215) + d(2, 10));
            } else if (obj.oclass != WEAPON_CLASS && !((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE)) {
                /* the following cases apply only to weapons */
                /* Oil removes rust and corrosion, but doesn't unburn or repair
             * cracks.  Arrows, etc are classed as metallic due to arrowhead
             * material, but dipping in oil shouldn't repair them.
             */
                break more_dips;
            } else if ((!(game.objects[obj.otyp].oc_material == IRON) && !(game.objects[obj.otyp].oc_material == COPPER || game.objects[obj.otyp].oc_material == IRON)) || ((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || (!obj.oeroded && !obj.oeroded2)) {
                /* uses up potion, doesn't set obj->greased */
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    pline("%s %s with an oily sheen.", Yname2(obj), otense(obj, "gleam"));
                } else {
                    pline("%s %s oily.", Yname2(obj), otense(obj, "feel"));
                }
            } else {
                pline("%s %s less %s.", Yname2(obj), otense(obj, !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "are" : "feel"), (obj.oeroded && obj.oeroded2) ? "corroded and rusty" : obj.oeroded ? "rusty" : "corroded");
                if (obj.oeroded > 0) {
                    obj.oeroded--;
                }
                if (obj.oeroded2 > 0) {
                    obj.oeroded2--;
                }
                wisx = (1);
            }
            exercise(A_WIS, wisx);
            if (potion.dknown) {
                discover_object((potion.otyp), (1), (1), (1));
            }
            useup(potion);
            return 1;
        }
    }
    if ((obj.otyp == OIL_LAMP || obj.otyp == MAGIC_LAMP) && (potion.otyp == POT_OIL)) {
        if (obj.lamplit || potion.lamplit) {
            useup(potion);
            explode(game.u.ux, game.u.uy, 11, d(6, 6), 0, EXPL_FIERY);
            exercise(A_WIS, (0));
            return 1;
        }
        if ((obj.otyp == MAGIC_LAMP) && obj.spe == 0) {
            /* Adding oil to an empty magic lamp renders it into an oil lamp */
            obj.otyp = OIL_LAMP;
            obj.age = 0;
        }
        if (obj.age > 1000) {
            pline("%s %s full.", Yname2(obj), otense(obj, "are"));
            potion.in_use = (0);
        } else {
            You("fill %s with oil.", yname(obj));
            check_unpaid(potion);
            /* burns more efficiently in a lamp than in a bottle;
               diluted potion provides less benefit but we don't attempt
               to track that the lamp now also has some non-oil in it */
            obj.age += Math.trunc((!potion.oeroded ? 4 : 3) * potion.age / 2);
            if (obj.age > 1500) {
                obj.age = 1500;
            }
            useup(potion);
            exercise(A_WIS, (1));
        }
        if (potion.dknown) {
            discover_object((POT_OIL), (1), (1), (1));
        }
        obj.spe = 1;
        update_inventory();
        return 1;
    }
    potion.in_use = (0);
    if ((obj.otyp == UNICORN_HORN || obj.otyp == AMETHYST) && (mixture = mixtype(obj, potion)) != STRANGE_OBJECT) {
        let oldbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let newbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let old_otyp = potion.otyp;
        let old_dknown = (0);
        let more_than_one = potion.quan > 1;
        oldbuf[0] = 0;
        if (potion.dknown) {
            old_dknown = (1);
            oldbuf = sprintf(oldbuf, "%s ", hcolor((game.obj_descr[(game.objects[potion.otyp]).oc_descr_idx].oc_descr)));
        }
        if (potion.quan > 1) {
            /* with multiple merged potions, split off one and
           just clear it */
            singlepotion = splitobj(potion, 1);
        } else {
            singlepotion = potion;
        }
        costly_alteration(singlepotion, COST_NUTRLZ);
        singlepotion.otyp = mixture;
        singlepotion.blessed = 0;
        if (mixture == POT_WATER) {
            singlepotion.cursed = singlepotion.oeroded = 0;
        } else {
            singlepotion.cursed = obj.cursed;
        }
        singlepotion.bknown = (0);
        singlepotion.dknown = (0);
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                observe_object(singlepotion);
            }
            newbuf = '';
            if (mixture == POT_WATER && singlepotion.dknown) {
                newbuf = sprintf(newbuf, "clears");
            } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                newbuf = sprintf(newbuf, "turns %s", hcolor((game.obj_descr[(game.objects[mixture]).oc_descr_idx].oc_descr)));
            }
            if (newbuf) {
                pline_The("%spotion%s %s.", oldbuf, more_than_one ? " that you dipped into" : "", newbuf);
            } else {
                pline("Something happens.");
            }
            if (old_dknown && !game.objects[old_otyp].oc_name_known && !game.objects[old_otyp].oc_uname) {
                let fakeobj = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
                Object.assign(fakeobj, cg.zeroobj);
                /* no need to observe_object */
                fakeobj.dknown = 1;
                fakeobj.otyp = old_otyp;
                fakeobj.oclass = POTION_CLASS;
                docall(fakeobj);
            }
        }
        /* remove potion from inventory and re-insert it, possibly stacking
           with compatible ones; override 'pickup_burden' while doing so */
        hold_potion(singlepotion, "You juggle and drop %s!", doname(singlepotion), null);
        return 1;
    }
    pline("Interesting...");
    return 1;
}
/* *monp grants a wish and then leaves the game */
export function mongrantswish(monp) {
    let mon = monp.value;
    let mx = mon.mx;
    let my = mon.my;
    let glyph = glyph_at(mx, my);
    /* remove the monster first in case wish proves to be fatal
       (blasted by artifact), to keep it out of resulting bones file */
    mongone(mon);
    /* inform caller that monster is gone */
    monp.value = null;
    /* hide that removal from player--map is visible during wish prompt */
    tmp_at((-5), glyph);
    tmp_at(mx, my);
    makewish();
    tmp_at((-7), 0);
}
export function djinni_from_bottle(obj) {
    let mtmp = null;
    let chance = 0;
    if (!(mtmp = makemon(game.mons[PM_DJINNI], game.u.ux, game.u.uy, 131072))) {
        pline("It turns out to be empty.");
        return;
    }
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        pline("In a cloud of smoke, %s emerges!", a_monnam(mtmp));
        pline("%s speaks.", Monnam(mtmp));
    } else {
        You("smell acrid fumes.");
        pline("%s speaks.", c_common_strings.c_Something);
    }
    chance = rn2(5);
    if (obj.blessed) {
        chance = (chance == 4) ? rnd(4) : 0;
    } else if (obj.cursed) {
        chance = (chance == 0) ? rn2(4) : 4;
    }
    ;
    switch (chance) {
        /* 0,1,2,3,4:  b=80%,5,5,5,5; nc=20%,20,20,20,20; c=5%,5,5,5,80 */
        case 0:
            verbalize("I am in your debt.  I will grant one wish!");
            /* give a wish and discard the monster (mtmp set to null) */
            mongrantswish({ get value() { return mtmp; }, set value(_v) { mtmp = _v; } });
            break;
        case 1:
            verbalize("Thank you for freeing me!");
            tamedog(mtmp, null, (0));
            break;
        case 2:
            verbalize("You freed me!");
            mtmp.mpeaceful = (1);
            set_malign(mtmp);
            break;
        case 3:
            verbalize("It is about time!");
            if ((canseemon(mtmp) || sensemon(mtmp))) {
                pline("%s vanishes.", Monnam(mtmp));
            }
            mongone(mtmp);
            break;
        default:
            verbalize("You disturbed me, fool!");
            mtmp.mpeaceful = (0);
            set_malign(mtmp);
            break;
    }
}
/* clone a gremlin or mold (2nd arg non-null implies heat as the trigger);
   hit points are cut in half (odd HP stays with original) */
/* monster being split */
/* optional attacker whose heat triggered it */
export function split_mon(mon, mtmp) {
    let mtmp2 = null;
    let reason = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    reason[0] = 0;
    if (mtmp) {
        reason = sprintf(reason, " from %s heat", (mtmp == game.youmonst) ? c_common_strings.c_the_your[1] : s_suffix(mon_nam(mtmp)));
    }
    if (mon == game.youmonst) {
        if (game.u.mh > game.u.mhmax) {
            game.u.mh = game.u.mhmax;
        }
        mtmp2 = (game.u.mh > 1) ? cloneu() : null;
        if (mtmp2) {
            /* mtmp2 has been created with mhpmax = u.mhmax, mhp = u.mh / 2,
               and u.mh -= mtmp2->mhp; these reductions for both max hp
               can't make either of them exceed corresponding current hp */
            mtmp2.mhpmax = Math.trunc(game.u.mhmax / 2);
            game.u.mhmax -= mtmp2.mhpmax;
            game.disp.botl = (1);
            You("multiply%s!", reason);
        }
    } else {
        if (mon.mhp > mon.mhpmax) {
            mon.mhp = mon.mhpmax;
        }
        mtmp2 = (mon.mhp > 1) ? clone_mon(mon, 0, 0) : null;
        if (mtmp2) {
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            /* mtmp2 has been created with mhpmax = mon->mhpmax,
               mhp = mon->mhp / 2, and mon->mh -= mtmp2->mhp;
               dividing max by 2 can't result in it exceeding current */
            mtmp2.mhpmax = Math.trunc(mon.mhpmax / 2);
            mon.mhpmax -= mtmp2.mhpmax;
            if ((canseemon(mon) || sensemon(mon))) {
                pline("%s multiplies%s!", Monnam(mon), reason);
            }
        }
    }
    return mtmp2;
}
/* Character becomes very fast temporarily. */
export function speed_up(duration) {
    if (!((game.u.uprops[FAST].intrinsic & ~(67108864 | 33554432 | 16777216)) || game.u.uprops[FAST].extrinsic)) {
        You("are suddenly moving %sfaster.", (game.u.uprops[FAST].intrinsic || game.u.uprops[FAST].extrinsic) ? "" : "much ");
    } else {
        Your("%s get new energy.", makeplural(body_part(LEG)));
    }
    exercise(A_DEX, (1));
    incr_itimeout({ get value() { return game.u.uprops[FAST].intrinsic; }, set value(_v) { game.u.uprops[FAST].intrinsic = _v; } }, duration);
}
/*potion.c*/
/* added blessing or cursing; update shop
                   bill to reflect item's new higher price */
/* removed blessing or cursing; you
                   degraded it, now you'll have to buy it... */
/* Do we allow the saddle to polymorph? */
/*
        case POT_GAIN_LEVEL:
        case POT_LEVITATION:
        case POT_FRUIT_JUICE:
        case POT_MONSTER_DETECTION:
        case POT_OBJECT_DETECTION:
            break;
        */
/*
    case POT_GAIN_LEVEL:
    case POT_GAIN_ENERGY:
    case POT_LEVITATION:
    case POT_FRUIT_JUICE:
    case POT_MONSTER_DETECTION:
    case POT_OBJECT_DETECTION:
    case POT_OIL:
        break;
     */
/* 128 - (24 + 54 + 1) leaves 49 for
                                    <object> */
