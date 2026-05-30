/* NetHack 5.0	steed.c	$NHDT-Date: 1720128167 2024/07/04 21:22:47 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.121 $ */
/* Copyright (c) Kevin Hugo, 1998-1999. */
/* NetHack may be freely redistributed.  See license for details. */
/* Monsters that might be ridden */
import { game } from '../gstate.js';
import { memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_cant, Your, pline } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strchr, strcpy } from '../c2js-runtime/string.js';
import { m_unleash } from './apply.js';
import { is_art } from './artifact.js';
import { acurr, adjalign, exercise } from './attrib.js';
import { describe_level } from './botl.js';
import { directionname, dirtocoord, getdir, isok, xytodir, yn_function } from './cmd.js';
import { is_lava, is_pool } from './dbridge.js';
import { c_common_strings, ynchars } from './decl.js';
import { canseemon, newsym, sensemon } from './display.js';
import { heal_legs, legs_in_no_shape, set_wounded_legs } from './do.js';
import { Mgender, Monnam, YMonnam, a_monnam, hliquid, minimal_monnam, mon_nam, monverbself, pmname, x_monnam, y_monnam } from './do_name.js';
import { finish_meating } from './dogmove.js';
import { has_ceiling, surface } from './dungeon.js';
import { losehp, near_capacity, test_move, u_locomotion } from './hack.js';
import { dist2, strsubst } from './hacklib.js';
import { freeinv, fully_identify_obj, sobj_at } from './invent.js';
import { mksobj } from './mkobj.js';
import { killed, monkilled } from './mon.js';
import { poly_when_stoned, pronoun_gender } from './mondata.js';
import { accessible } from './monmove.js';
import { ART_SNICKERSNEE, A_CHA, A_DEX, A_WIS, BLINDED, BOULDER, CONFUSION, DIR_ERR, DISMOUNT_BONES, DISMOUNT_BYCHOICE, DISMOUNT_ENGULFED, DISMOUNT_FELL, DISMOUNT_GENERIC, DISMOUNT_KNOCKED, DISMOUNT_POLY, DISMOUNT_THROWN, FLYING, FUMBLING, GLIB, HALF_PHDAM, HALLUC, HALLUC_RES, IRON, LEG, LEVITATION, MITHRIL, M_AP_FURNITURE, M_AP_OBJECT, N_DIRS_Z, PM_AIR_ELEMENTAL, PM_AMOROUS_DEMON, PM_BAT, PM_CHICKATRICE, PM_COCKATRICE, PM_FIRE_ELEMENTAL, PM_GHOST, PM_GRID_BUG, PM_KNIGHT, PM_LONG_WORM, PM_SALAMANDER, PM_STONE_GOLEM, P_BASIC, P_EXPERT, P_ISRESTRICTED, P_LANCE, P_POLEARMS, P_RIDING, P_SKILLED, P_UNSKILLED, SADDLE, SLT_ENCUMBER, STEALTH, STONE_RES, STUNNED, S_ANGEL, S_CENTAUR, S_DRAGON, S_EYE, S_GHOST, S_JABBERWOCK, S_LIGHT, S_QUADRUPED, S_UNICORN, S_VORTEX, TELEPAT, TOOL_CLASS, TT_BEARTRAP, TT_PIT, TT_WEB, VIBRATING_SQUARE, WEAPON_CLASS, WOUNDED_LEGS } from './nh-constants.js';
import { objdescr_is } from './o_init.js';
import { an } from './objnam.js';
import { encumber_msg, u_handsy } from './pickup.js';
import { body_part, polymon, steed_vs_stealth } from './polyself.js';
import { rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { mpickobj, remove_worn_item } from './steal.js';
import { enexto, rloc, rloc_to, teleds } from './teleport.js';
import { float_down, instapetrify, mintrap, sokoban_guilt, t_at, trapname } from './trap.js';
import { use_skill } from './weapon.js';
import { update_mon_extrinsics, which_armor } from './worn.js';

const steeds = [S_QUADRUPED, S_UNICORN, S_ANGEL, S_CENTAUR, S_DRAGON, S_JABBERWOCK, 0];
/* caller has decided that hero can't reach something while mounted */
export function rider_cant_reach() {
    You("aren't skilled enough to reach from %s.", y_monnam(game.u.usteed));
}
/*** Putting the saddle on ***/
/* Can this monster wear a saddle? */
export function can_saddle(mtmp) {
    let ptr = mtmp.data;
    return (strchr(steeds, ptr.mlet) && (ptr.msize >= 2) && (!(((ptr).mflags1 & 131072) != 0) || ptr.mlet == S_CENTAUR) && !(((ptr).mflags1 & 4) != 0) && !((ptr).mlet == S_GHOST) && !((ptr).mlet == S_VORTEX || (ptr) == game.mons[PM_AIR_ELEMENTAL]) && !(((ptr).mflags1 & 1048576) != 0));
}
export function use_saddle(otmp) {
    let mtmp = null;
    let ptr = null;
    let chance = 0;
    if (!u_handsy()) {
        return 0;
    }
    if (game.u.uswallow || (game.u.uinwater) || !getdir(null)) {
        pline("%s", c_common_strings.c_Never_mind);
        return 2;
    }
    if (!game.u.dx && !game.u.dy) {
        pline("Saddle yourself?  Very funny...");
        return 0;
    }
    if (!isok(game.u.ux + game.u.dx, game.u.uy + game.u.dy) || !(mtmp = (game.level.monsters[game.u.ux + game.u.dx][game.u.uy + game.u.dy])) || !(canseemon(mtmp) || sensemon(mtmp))) {
        /* Can the player reach and see the monster? */
        pline("I see nobody there.");
        return 1;
    }
    if ((mtmp.misc_worn_check & 1048576) != 0 || which_armor(mtmp, 1048576)) {
        /* Is this a valid monster? */
        pline("%s doesn't need another one.", Monnam(mtmp));
        return 1;
    }
    ptr = mtmp.data;
    if (((ptr) == game.mons[PM_COCKATRICE] || (ptr) == game.mons[PM_CHICKATRICE]) && !game.uarmg && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        let kbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        You("touch %s.", mon_nam(mtmp));
        if (!(poly_when_stoned(game.youmonst.data) && polymon(PM_STONE_GOLEM))) {
            kbuf = sprintf(kbuf, "attempting to saddle %s", an(pmname(mtmp.data, Mgender(mtmp))));
            instapetrify(kbuf);
        }
    }
    if (ptr == game.mons[PM_AMOROUS_DEMON]) {
        pline("Shame on you!");
        exercise(A_WIS, (0));
        return 1;
    }
    if (mtmp.isminion || mtmp.isshk || mtmp.ispriest || mtmp.isgd || mtmp.iswiz) {
        pline("I think %s would mind.", mon_nam(mtmp));
        return 1;
    }
    if (!can_saddle(mtmp)) {
        You_cant("saddle such a creature.");
        return 1;
    }
    chance = (acurr(A_DEX)) + Math.trunc((acurr(A_CHA)) / 2) + 2 * mtmp.mtame;
    chance += game.u.ulevel * (mtmp.mtame ? 20 : 5);
    if (!mtmp.mtame) {
        chance -= 10 * mtmp.m_lev;
    }
    if ((game.urole.mnum == (PM_KNIGHT))) {
        chance += 20;
    }
    switch ((game.u.weapon_skills[P_RIDING].skill)) {
        case P_ISRESTRICTED:
        case P_UNSKILLED:
        default:
            chance -= 20;
            break;
        case P_BASIC:
            break;
        case P_SKILLED:
            chance += 15;
            break;
        case P_EXPERT:
            chance += 30;
            break;
    }
    if (game.u.uprops[CONFUSION].intrinsic || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || game.u.uprops[GLIB].intrinsic) {
        chance -= 20;
    } else if (game.uarmg && objdescr_is(game.uarmg, "riding gloves")) {
        chance += 10;
    } else if (game.uarmf && objdescr_is(game.uarmf, "riding boots")) {
        chance += 10;
    }
    if (otmp.cursed) {
        chance -= 50;
    }
    /* [intended] steed becomes alert if possible */
    maybewakesteed(mtmp);
    if (rn2(100) < chance) {
        /* Bonus for wearing "riding" (but not fumbling) gloves */
        /* ... or for "riding boots" */
        You("put the saddle on %s.", mon_nam(mtmp));
        if (otmp.owornmask) {
            remove_worn_item(otmp, (0));
        }
        freeinv(otmp);
        /* !can_saddle(mtmp) already eliminated above */
        put_saddle_on_mon(otmp, mtmp);
    } else {
        pline("%s resists!", Monnam(mtmp));
    }
    return 1;
}
export function put_saddle_on_mon(saddle, mtmp) {
    if (!can_saddle(mtmp) || which_armor(mtmp, 1048576)) {
        if (saddle) {
            impossible("put_saddle_on_mon: saddle obj could get orphaned");
        }
        return;
    }
    if (!saddle) {
        if ((saddle = mksobj(SADDLE, (1), (0))) != null) {
            /* mpickobj can later override identification if out-of-view */
            fully_identify_obj(saddle);
        } else {
            return;
        }
    }
    if (mpickobj(mtmp, saddle)) {
        panic("merged saddle?");
    }
    mtmp.misc_worn_check |= 1048576;
    saddle.owornmask = 1048576;
    saddle.corpsenm = mtmp.m_id;
    update_mon_extrinsics(mtmp, saddle, (1), (0));
}
/*** Riding the monster ***/
/* Can we ride this monster?  Caller should also check can_saddle() */
export function can_ride(mtmp) {
    return (mtmp.mtame && (((game.youmonst.data).mflags1 & 131072) != 0) && !((game.youmonst.data).msize < 1) && !((game.youmonst.data).msize >= 3) && (!(game.u.uinwater) || (((mtmp.data).mflags1 & 2) != 0)));
}
/* the #ride command */
export function doride() {
    let forcemount = (0);
    if (game.u.usteed) {
        dismount_steed(DISMOUNT_BYCHOICE);
    } else if (getdir(null) && isok(game.u.ux + game.u.dx, game.u.uy + game.u.dy)) {
        if (game.flags.debug && yn_function("Force the mount to succeed?", ynchars, 110, (1)) == 121) {
            forcemount = (1);
        }
        return (mount_steed((game.level.monsters[game.u.ux + game.u.dx][game.u.uy + game.u.dy]), forcemount) ? 1 : 0);
    } else {
        return 2;
    }
    return 1;
}
/* Start riding, with the given monster */
/* The animal */
/* Quietly force this animal */
export function mount_steed(mtmp, force) {
    let otmp = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ptr = null;
    if (game.u.usteed) {
        You("are already riding %s.", mon_nam(game.u.usteed));
        return ((0));
    }
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) && !force) {
        /* Is the player in the right form? */
        pline("Maybe you should find a designated driver.");
        return ((0));
    }
    if ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic)) {
        /* While riding, Wounded_legs refers to the steed's
     * legs, not the hero's legs.
     * That opens up a potential abuse where the player
     * can mount a steed, then dismount immediately to
     * heal leg damage, because leg damage is always
     * healed upon dismount (Wounded_legs context switch).
     * By preventing a hero with Wounded_legs from
     * mounting a steed, the potential for abuse is
     * reduced.  However, dismounting still immediately
     * heals the steed's wounded legs.  [In 3.4.3 and
     * earlier, that unintentionally made the hero's
     * temporary 1 point Dex loss become permanent.]
     */
        let qbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        legs_in_no_shape("riding", (0));
        qbuf = sprintf(qbuf, "Heal your leg%s?", ((game.u.uprops[WOUNDED_LEGS].intrinsic & (131072 | 262144)) == (131072 | 262144)) ? "s" : "");
        if (force && game.flags.debug && yn_function(qbuf, ynchars, 110, (1)) == 121) {
            heal_legs(0);
        } else {
            return ((0));
        }
    }
    if ((game.u.umonnum != game.u.umonster) && (!(((game.youmonst.data).mflags1 & 131072) != 0) || ((game.youmonst.data).msize < 1) || ((game.youmonst.data).msize >= 3) || (((game.youmonst.data).mflags1 & 524288) != 0))) {
        You("won't fit on a saddle.");
        return ((0));
    }
    if (!force && (near_capacity() > SLT_ENCUMBER)) {
        You_cant("do that while carrying so much stuff.");
        return ((0));
    }
    if (!mtmp || (!force && ((((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic)) || mtmp.mundetected || ((mtmp).m_ap_type & 7) == M_AP_FURNITURE || ((mtmp).m_ap_type & 7) == M_AP_OBJECT))) {
        pline("I see nobody there.");
        return ((0));
    }
    if (mtmp.data == game.mons[PM_LONG_WORM] && (game.u.ux + game.u.dx != mtmp.mx || game.u.uy + game.u.dy != mtmp.my)) {
        /* As of 3.6.2:  test_move(below) is used to check for trying to mount
           diagonally into or out of a doorway or through a tight squeeze;
           attempting to mount a tail segment when hero was not adjacent
           to worm's head could trigger an impossible() in worm_cross()
           called from test_move(), so handle not-on-head before that */
        You("couldn't ride %s, let alone its tail.", a_monnam(mtmp));
        return (0);
    }
    if (game.u.uswallow || game.u.ustuck || game.u.utrap || (game.uball != null) || !test_move(game.u.ux, game.u.uy, mtmp.mx - game.u.ux, mtmp.my - game.u.uy, 1)) {
        if ((game.uball != null) || !(game.u.uswallow || game.u.ustuck || game.u.utrap)) {
            You("are unable to swing your %s over.", body_part(LEG));
        } else {
            You("are stuck here for now.");
        }
        return ((0));
    }
    /* Check the reason for dismounting */
    otmp = which_armor(mtmp, 1048576);
    if (!otmp) {
        pline("%s is not saddled.", Monnam(mtmp));
        return ((0));
    }
    ptr = mtmp.data;
    if (((ptr) == game.mons[PM_COCKATRICE] || (ptr) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
        let kbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        You("touch %s.", mon_nam(mtmp));
        kbuf = sprintf(kbuf, "attempting to ride %s", an(pmname(mtmp.data, Mgender(mtmp))));
        instapetrify(kbuf);
    }
    if (!mtmp.mtame || mtmp.isminion) {
        pline("I think %s would mind.", mon_nam(mtmp));
        return ((0));
    }
    if (mtmp.mtrapped) {
        let t = t_at(mtmp.mx, mtmp.my);
        You_cant("mount %s while %s's trapped in %s.", mon_nam(mtmp), (genders[pronoun_gender(mtmp, 2)].he), an(trapname(t.ttyp, (0))));
        return ((0));
    }
    if (!force && !(game.urole.mnum == (PM_KNIGHT)) && !(--mtmp.mtame)) {
        newsym(mtmp.mx, mtmp.my);
        pline("%s resists%s!", Monnam(mtmp), mtmp.mleashed ? " and its leash comes off" : "");
        if (mtmp.mleashed) {
            m_unleash(mtmp, (0));
        }
        return ((0));
    }
    if (!force && (game.u.uinwater) && !(((ptr).mflags1 & 2) != 0)) {
        You_cant("ride that creature while under %s.", hliquid("water"));
        return ((0));
    }
    if (!can_saddle(mtmp) || !can_ride(mtmp)) {
        You_cant("ride such a creature.");
        return (0);
    }
    if (!force && !((ptr).mlet == S_EYE || (ptr).mlet == S_LIGHT) && !(((ptr).mflags1 & 1) != 0) && ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !(((game.u.uprops[LEVITATION].intrinsic & 536870912) != 0 || (game.u.uprops[LEVITATION].extrinsic & 8192) != 0) && (game.u.uprops[LEVITATION].intrinsic & ~(536870912 | 16777215)) == 0 && (game.u.uprops[LEVITATION].extrinsic & ~8192) == 0)) {
        You("cannot reach %s.", mon_nam(mtmp));
        return ((0));
    }
    if (!force && game.uarm && (game.objects[game.uarm.otyp].oc_material >= IRON && game.objects[game.uarm.otyp].oc_material <= MITHRIL) && ((game.uarm).oeroded > (game.uarm).oeroded2 ? (game.uarm).oeroded : (game.uarm).oeroded2)) {
        Your("%s armor is too stiff to be able to mount %s.", game.uarm.oeroded ? "rusty" : "corroded", mon_nam(mtmp));
        return ((0));
    }
    if (!force && (game.u.uprops[CONFUSION].intrinsic || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || game.u.uprops[GLIB].intrinsic || (game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) || otmp.cursed || otmp.greased || (game.u.ulevel + mtmp.mtame < rnd(Math.trunc(30 / 2) + 5)))) {
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            pline("%s slips away from you.", Monnam(mtmp));
            return (0);
        }
        You("slip while trying to get on %s.", mon_nam(mtmp));
        buf = sprintf(buf, "slipped while mounting %s", x_monnam(mtmp, 2, null, 1 | 2 | 4, (1)));
        losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc((((rn2(5) + (10))) + 1) / 2)) : ((rn2(5) + (10)))), buf, 2);
        return ((0));
    }
    maybewakesteed(mtmp);
    if (!force) {
        /* "a saddled mumak" or "a saddled pony called Dobbin" */
        if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) && !((ptr).mlet == S_EYE || (ptr).mlet == S_LIGHT) && !(((ptr).mflags1 & 1) != 0)) {
            pline("%s magically floats up!", Monnam(mtmp));
        }
        You("mount %s.", mon_nam(mtmp));
        if (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked)) {
            You("and %s take flight together.", mon_nam(mtmp));
        }
    }
    /* setuwep handles polearms differently when you're mounted */
    /* polearms behave differently when not mounted */
    if (game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && (game.objects[game.uwep.otyp].oc_subtyp == P_POLEARMS || game.objects[game.uwep.otyp].oc_subtyp == P_LANCE || is_art(game.uwep, ART_SNICKERSNEE)))) {
        game.unweapon = (0);
    }
    game.u.usteed = mtmp;
{
        let was_stealthy = ((game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic) && !game.u.uprops[STEALTH].blocked) != 0;
        /* riding blocks stealth unless hero+steed fly */
        steed_vs_stealth();
        if (was_stealthy && !((game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic) && !game.u.uprops[STEALTH].blocked)) {
            You("aren't stealthy anymore.");
        }
    }
    game.level.monsters[mtmp.mx][mtmp.my] = null;
    teleds(mtmp.mx, mtmp.my, 1);
    game.disp.botl = (1);
    return (1);
}
/* You and your steed have moved */
export function exercise_steed() {
    if (!game.u.usteed) {
        return;
    }
    if (++game.u.urideturns >= 100) {
        /* It takes many turns of riding to exercise skill */
        game.u.urideturns = 0;
        use_skill(P_RIDING, 1);
    }
    return;
}
/* The player kicks or whips the steed */
export function kick_steed() {
    /* monverbself() appends to the "He"/"She"/"It" value */
    let He = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!game.u.usteed) {
        return;
    }
    if (((game.u.usteed).msleeping || !(game.u.usteed).mcanmove)) {
        He = strcpy(He, (genders[pronoun_gender(game.u.usteed, 2)].he));
        /* [ALI] Various effects of kicking sleeping/paralyzed steeds */
        /* We assume a message has just been output of the form
         * "You kick <steed>."
         */
        He = (() => { const __s = He; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
        if ((game.u.usteed.mcanmove || game.u.usteed.mfrozen) && !rn2(2)) {
            if (game.u.usteed.mcanmove) {
                game.u.usteed.msleeping = 0;
            } else if (game.u.usteed.mfrozen > 2) {
                game.u.usteed.mfrozen -= 2;
            } else {
                game.u.usteed.mfrozen = 0;
                game.u.usteed.mcanmove = 1;
            }
            if (((game.u.usteed).msleeping || !(game.u.usteed).mcanmove)) {
                pline("%s stirs.", He);
            /* if hallucinating, might yield "He rouses herself" or
                   "She rouses himself" */
            } else {
                pline("%s!", monverbself(game.u.usteed, He, "rouse", null));
            }
        } else {
            pline("%s does not respond.", He);
        }
        return;
    }
    /* Make the steed less tame and check if it resists */
    if (game.u.usteed.mtame) {
        game.u.usteed.mtame--;
    }
    if (!game.u.usteed.mtame && game.u.usteed.mleashed) {
        m_unleash(game.u.usteed, (1));
    }
    if (!game.u.usteed.mtame || (game.u.ulevel + game.u.usteed.mtame < rnd(Math.trunc(30 / 2) + 5))) {
        newsym(game.u.usteed.mx, game.u.usteed.my);
        dismount_steed(DISMOUNT_THROWN);
        return;
    }
    pline("%s gallops!", Monnam(game.u.usteed));
    game.u.ugallop += (rn2(20) + (30));
    return;
}
/*
 * Try to find a dismount point adjacent to the steed's location.
 * If all else fails, try enexto().  Use enexto() as a last resort because
 * enexto() chooses its point randomly, possibly even outside the
 * room's walls, which is not what we want.
 * Adapted from mail daemon code.
 */
/* landing position (we fill it in) */
export function landing_spot(spot, reason, forceit) {
    /* 8: the 8 spots adjacent to the hero's spot */
    let cc = { x: 0, y: 0 };
    let try_ = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    let i = 0;
    let j = 0;
    let best_j = 0;
    let clockwise_j = 0;
    let counterclk_j = 0;
    let n = 0;
    let viable = 0;
    let distance = 0;
    let min_distance = -1;
    let x = 0;
    let y = 0;
    let found = 0;
    let impaird = 0;
    let kn_trap = 0;
    let boulder = 0;
    let t = null;
    memset(try_, 0, 8 /* sizeof(coord [8]) */);
    n = 0;
    j = xytodir(game.u.dx, game.u.dy);
    if (reason == DISMOUNT_KNOCKED && j != DIR_ERR) {
        /* we'll check preferred location first; if viable it'll be picked */
        best_j = j;
        try_[0].x = game.u.dx , try_[0].y = game.u.dy;
        /* the two next best locations are checked second and third */
        i = rn2(2);
        clockwise_j = (((j) + 1) % (N_DIRS_Z - 2));
        dirtocoord(cc, clockwise_j);
        try_[1 + i].x = cc.x , try_[1 + i].y = cc.y;
        counterclk_j = (((j) + 7) % (N_DIRS_Z - 2));
        dirtocoord(cc, counterclk_j);
        try_[2 - i].x = cc.x , try_[2 - i].y = cc.y;
        n = 3;
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/steed.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                pline("knock from saddle: best %s, next %s or %s", directionname(best_j), directionname(clockwise_j), directionname(counterclk_j));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
    } else {
        best_j = clockwise_j = counterclk_j = -1;
    }
    for (j = 0; j < (N_DIRS_Z - 2); ++j) {
        /* fortunately NODIAG() handling isn't needed for DISMOUNT_KNOCKED
           because hero can only ride when humanoid */
        if (j == best_j || j == clockwise_j || j == counterclk_j) {
            continue;
        }
        /* j==0 is W, j==1 NW, j==2 N, j==3 NE, ..., around to j==7 SW;
           so odd j values are diagonal directions here */
        if (reason == DISMOUNT_POLY && ((game.u.umonnum) == PM_GRID_BUG) && (j % 1) != 0) {
            continue;
        }
        dirtocoord(cc, j);
        Object.assign(try_[n++], cc);
    }
    /*
     * Up to three passes;
     * i==0: voluntary dismount without impairment avoids known traps and
     *       boulders;
     * i==1: voluntary dismount with impairment or knocked out of saddle
     *       avoids boulders but allows known traps;
     * i==2: other, allow traps and boulders.
     *
     * Fallback to i==1 if nothing appropriate was found for i==0 and
     * to i==2 as last resort.
     */
    impaird = (game.u.uprops[STUNNED].intrinsic || game.u.uprops[CONFUSION].intrinsic || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic));
    viable = 0;
    found = (0);
    for (i = (reason == DISMOUNT_BYCHOICE && !impaird) ? 0 : ((reason == DISMOUNT_BYCHOICE && impaird) || reason == DISMOUNT_KNOCKED) ? 1 : 2; i <= 2 && !found; ++i) {
        for (j = 0; j < n; ++j) {
            x = game.u.ux + try_[j].x;
            y = game.u.uy + try_[j].y;
            /* [note: u_at() can't happen] */
            if (!isok(x, y) || ((x) == game.u.ux && (y) == game.u.uy)) {
                continue;
            }
            if (accessible(x, y) && !(game.level.monsters[x][y] != null) && test_move(game.u.ux, game.u.uy, x - game.u.ux, y - game.u.uy, 1)) {
                ++viable;
                distance = dist2((x), (y), game.u.ux, game.u.uy);
                if (min_distance < 0 || ((best_j == -1) ? (distance < min_distance) : (j < 3)) || (distance == min_distance && !rn2(viable))) {
                    /* or better than pending candidate (note: orthogonal
                       spots are distance 1 and diagonal ones distance 2;
                       treating one as better than the other is arbitrary
                       and not wanted for DISMOUNT_KNOCKED) */
                    /* or equally good, maybe substitute this one */
                    /* traps avoided on pass 0; boulders avoided on 0 and 1 */
                    kn_trap = i == 0 && ((t = t_at(x, y)) != null && t.tseen && t.ttyp != VIBRATING_SQUARE);
                    boulder = i <= 1 && (sobj_at(BOULDER, x, y) && !(((game.youmonst.data).mflags2 & 134217728) != 0));
                    if (!kn_trap && !boulder) {
                        spot.x = x;
                        spot.y = y;
                        min_distance = distance;
                        found = (1);
                        if (best_j != -1 && j < 3) {
                            break;
                        }
                    }
                }
            }
        }
    }
    /* If we didn't find a good spot and forceit is on, try enexto(). */
    if (forceit && !found) {
        found = enexto(spot, game.u.ux, game.u.uy, game.youmonst.data);
    }
    return found;
}
/* Stop riding the current steed */
/* Player was thrown off etc. */
export function dismount_steed(reason) {
    let mtmp = null;
    let otmp = null;
    let verb = null;
    let cc = { x: 0, y: 0 };
    let steedcc = { x: 0, y: 0 };
    let save_utrap = game.u.utrap;
    let ulev = 0;
    let ufly = 0;
    let repair_leg_damage = ((game.u.uprops[WOUNDED_LEGS].intrinsic || game.u.uprops[WOUNDED_LEGS].extrinsic) != 0);
    let have_spot = landing_spot(cc, reason, 0);
    /* make a copy of steed pointer */
    mtmp = game.u.usteed;
    if (!mtmp) {
        return;
    }
    /* affects Fly test; could hypothetically affect Lev;
                   * also affects u_locomotion() */
    game.u.usteed = null;
    ufly = ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ? (1) : (0);
    ulev = ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) ? (1) : (0);
    /* only used for _FELL and _KNOCKED */
    verb = u_locomotion("fall");
    game.u.usteed = mtmp;
    otmp = which_armor(mtmp, 1048576);
    switch (reason) {
        case DISMOUNT_THROWN:
            verb = "are thrown";
            ;
        case DISMOUNT_KNOCKED:
        case DISMOUNT_FELL:
            You("%s off of %s!", verb, mon_nam(mtmp));
            if (!have_spot) {
                have_spot = landing_spot(cc, reason, 1);
            }
            if (!ulev && !ufly) {
                losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc((((rn2(10) + (10))) + 1) / 2)) : ((rn2(10) + (10)))), "riding accident", 0);
                set_wounded_legs((131072 | 262144), game.u.uprops[WOUNDED_LEGS].intrinsic + (rn2(5) + (5)));
                repair_leg_damage = (0);
            }
            break;
        case DISMOUNT_POLY:
            You("can no longer ride %s.", mon_nam(game.u.usteed));
            if (!have_spot) {
                have_spot = landing_spot(cc, reason, 1);
            }
            break;
        case DISMOUNT_ENGULFED:
            break;
        case DISMOUNT_BONES:
            break;
        case DISMOUNT_GENERIC:
            break;
        case DISMOUNT_BYCHOICE:
        default:
            if (otmp && otmp.cursed) {
                /* no messages, just make it so */
                You("can't.  The saddle %s cursed.", otmp.bknown ? "is" : "seems to be");
                /* ok to skip set_bknown() here */
                otmp.bknown = 1;
                return;
            }
            if (!have_spot) {
                You("can't.  There isn't anywhere for you to stand.");
                return;
            }
            if (!((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
                pline("You've been through the dungeon on %s with no name.", an(pmname(mtmp.data, Mgender(mtmp))));
                if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                    pline("It felt good to get out of the rain.");
                }
            } else {
                You("dismount %s.", mon_nam(mtmp));
            }
    }
    /* While riding, Wounded_legs refers to the steed's legs;
       after dismounting, it reverts to the hero's legs. */
    if (repair_leg_damage) {
        heal_legs(1);
    }
    game.u.usteed = (null);
    game.u.ugallop = 0;
{
        let was_stealthy = ((game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic) && !game.u.uprops[STEALTH].blocked) != 0;
        steed_vs_stealth();
        if (((game.u.uprops[STEALTH].intrinsic || game.u.uprops[STEALTH].extrinsic) && !game.u.uprops[STEALTH].blocked) && !was_stealthy) {
            You("seem less noisy now.");
        }
    }
    if (game.u.utraptype == TT_BEARTRAP || game.u.utraptype == TT_PIT || game.u.utraptype == TT_WEB) {
        mtmp.mtrapped = 1;
    }
    /*
     * rloc(), rloc_to(), and monkilled()->mondead()->m_detach() all
     * expect mtmp to be on the map or else have mtmp->mx be 0, but
     * setting the latter to 0 here would interfere with dropping
     * the saddle.  Prior to 3.6.2, being off the map didn't matter.
     *
     * place_monster() expects mtmp to be alive and not be u.usteed.
     *
     * Unfortunately, <u.ux,u.uy> (former steed's implicit location)
     * might now be occupied by an engulfer, so we can't just put mtmp
     * at that spot.  An engulfer's previous spot will be unoccupied
     * but we don't know where that was and even if we did, it might
     * be hostile terrain.
     */
    steedcc.x = game.u.ux , steedcc.y = game.u.uy;
    if ((game.level.monsters[game.u.ux][game.u.uy])) {
        /* hero's spot has a monster in it; hero must have been plucked
           from saddle as engulfer moved into his spot--other dismounts
           shouldn't run into this situation; find nearest viable spot */
        if (!enexto(steedcc, game.u.ux, game.u.uy, mtmp.data) && !enexto(steedcc, game.u.ux, game.u.uy, game.mons[PM_BAT])) {
            enexto(steedcc, game.u.ux, game.u.uy, game.mons[PM_GHOST]);
        }
    }
    if (!((mtmp).mhp < 1)) {
        /* no spot? must have been engulfed by a lurker-above over
               water or lava; try requesting a location for a flyer */
        /* still no spot; last resort is any spot within bounds */
        game.in_steed_dismounting++;
        place_monster(mtmp, steedcc.x, steedcc.y);
        game.in_steed_dismounting--;
        if (reason == DISMOUNT_BONES) {
            if (enexto(cc, game.u.ux, game.u.uy, mtmp.data)) {
                /* Keep player here, move the steed to cc */
                /* Otherwise, steed goes bye-bye. */
                rloc_to(mtmp, cc.x, cc.y);
            /* if for bones, there's no reason to place the hero;
           we want to make room for potential ghost, so move steed */
            /* move the steed to an adjacent square */
            /* evidently no room nearby; move steed elsewhere */
            } else {
                rloc(mtmp, 1 | 4);
            }
            return;
        }
        if (!game.u.uswallow && !game.u.ustuck && have_spot) {
            /* Set hero's and/or steed's positions.  Usually try moving the
           hero first.  Note: for DISMOUNT_ENGULFED, caller hasn't set
           u.uswallow yet but has set u.ustuck. */
            let mdat = mtmp.data;
            if ((!(((mdat).mflags1 & 1) != 0) && !((mdat).mlet == S_EYE || (mdat).mlet == S_LIGHT) && (!(((mdat).mflags1 & 16) != 0) || !has_ceiling(game.u.uz)))) {
                if (is_pool(game.u.ux, game.u.uy)) {
                    /* The steed may drop into water/lava */
                    if (!(game.u.uinwater)) {
                        pline("%s falls into the %s!", Monnam(mtmp), surface(game.u.ux, game.u.uy));
                    }
                    if (!((((mdat).mflags1 & 2) != 0) || (((mdat).mflags1 & 512) != 0) || (((mdat).mflags1 & 1024) != 0))) {
                        /* original there's-no-room handling */
                        /* [un]#ride: hero gets credit/blame for killing steed */
                        killed(mtmp);
                        adjalign(-1);
                    }
                } else if (is_lava(game.u.ux, game.u.uy)) {
                    pline("%s is pulled into the %s!", Monnam(mtmp), hliquid("lava"));
                    if (!(mdat == game.mons[PM_FIRE_ELEMENTAL] || mdat == game.mons[PM_SALAMANDER])) {
                        killed(mtmp);
                        adjalign(-1);
                    }
                }
            }
            if (!((mtmp).mhp < 1)) {
                /* Steed dismounting consists of two steps: being moved to another
             * square, and descending to the floor.  We have functions to do
             * each of these activities, but they're normally called
             * individually and include an attempt to look at or pick up the
             * objects on the floor:
             * teleds() --> spoteffects() --> pickup()
             * float_down() --> pickup()
             * We use this kludge to make sure there is only one such attempt.
             *
             * Clearly this is not the best way to do it.  A full fix would
             * involve having these functions not call pickup() at all,
             * instead calling them first and calling pickup() afterwards.
             * But it would take a lot of work to keep this change from
             * having any unforeseen side effects (for instance, you would
             * no longer be able to walk onto a square with a hole, and
             * autopickup before falling into the hole).
             */
                /* [ALI] No need to move the player if the steed died. */
                /* Keep steed here, move the player to cc;
                 * teleds() clears u.utrap
                 */
                /* usually return the hero to the surface */
                game.in_steed_dismounting = (1);
                teleds(cc.x, cc.y, 1);
                if (sobj_at(BOULDER, cc.x, cc.y)) {
                    sokoban_guilt();
                }
                game.in_steed_dismounting = (0);
                /* Put your steed in your trap */
                if (save_utrap) {
                    mintrap(mtmp, 0);
                }
            }
        } else if (enexto(cc, game.u.ux, game.u.uy, mtmp.data)) {
            rloc_to(mtmp, cc.x, cc.y);
        } else {
            /* Can't use this [yet?] because it violates monmove()'s
             * assumption that a moving monster (engulfer) can't cause
             * another monster (steed) to be removed from the fmon list.
             * That other monster (steed) might be cached as the next one
             * to move.
             */
            /* migrate back to this level if hero leaves and returns
               or to next level if it is happening in the endgame */
            if (reason == DISMOUNT_BYCHOICE) {
                killed(mtmp);
                adjalign(-1);
            } else {
                /* other dismount: kill former steed with no penalty;
                   damage type is just "neither AD_DGST nor -AD_RBRE" */
                monkilled(mtmp, "", -0);
            }
        }
    }
    if (reason != DISMOUNT_ENGULFED && reason != DISMOUNT_BONES) {
        game.in_steed_dismounting = (1);
        float_down(0, 1048576);
        game.in_steed_dismounting = (0);
        game.disp.botl = (1);
        encumber_msg();
        game.vision_full_recalc = 1;
    } else {
        game.disp.botl = (1);
    }
    if (game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && (game.objects[game.uwep.otyp].oc_subtyp == P_POLEARMS || game.objects[game.uwep.otyp].oc_subtyp == P_LANCE || is_art(game.uwep, ART_SNICKERSNEE)))) {
        game.unweapon = (1);
    }
    return;
}
/* when attempting to saddle or mount a sleeping steed, try to wake it up
   (for the saddling case, it won't be u.usteed yet) */
export function maybewakesteed(steed) {
    let frozen = steed.mfrozen;
    let wasimmobile = ((steed).msleeping || !(steed).mcanmove);
    steed.msleeping = 0;
    if (frozen) {
        frozen = Math.trunc((frozen + 1) / 2);
        if (!rn2(frozen)) {
            /* might break out of timed sleep or paralysis */
            steed.mfrozen = 0;
            steed.mcanmove = 1;
        } else {
            /* didn't awake, but remaining duration is halved */
            steed.mfrozen = frozen;
        }
    }
    if (wasimmobile && !((steed).msleeping || !(steed).mcanmove)) {
        pline("%s wakes up.", Monnam(steed));
    }
    /* regardless of waking, terminate any meal in progress */
    finish_meating(steed);
}
/* steed has taken on a new shape */
export function poly_steed(steed, oldshape) {
    if (!can_saddle(steed) || !can_ride(steed)) {
        /* can't get here; newcham() -> mon_break_armor() -> m_lose_armor()
           removes saddle and/or forces hero to dismount, if applicable,
           before newcham() calls us */
        dismount_steed(DISMOUNT_FELL);
    } else {
        let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        buf = strcpy(buf, x_monnam(steed, 3, null, 8, (0)));
        if (oldshape != steed.data) {
            buf = strsubst(buf, "your ", "your new ");
        }
        You("adjust yourself in the saddle on %s.", buf);
        steed_vs_stealth();
    }
}
/* decide whether hero's steed is able to move;
   doesn't check for holding traps--those affect the hero directly */
export function stucksteed(checkfeeding) {
    let steed = game.u.usteed;
    if (steed) {
        if (((steed).msleeping || !(steed).mcanmove)) {
            /* check whether steed can move */
            pline("%s won't move!", YMonnam(steed));
            return (1);
        }
        if (checkfeeding && steed.meating) {
            /* optionally check whether steed is in the midst of a meal */
            pline("%s is still eating.", YMonnam(steed));
            return (1);
        }
    }
    return (0);
}
export function place_monster(mon, x, y) {
    let othermon = null;
    let monnm = null;
    let othnm = null;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    buf[0] = 0;
    if (!isok(x, y) && (x != 0 || y != 0 || !mon.isgd)) {
        /* normal map bounds are <1..COLNO-1,0..ROWNO-1> but sometimes
       vault guards (either living or dead) are parked at <0,0> */
        /* special case is for convoluted vault guard handling */
        describe_level(buf, 0);
        impossible("trying to place %s at <%d,%d> mstate:%lx on %s", minimal_monnam(mon, (1)), x, y, mon.mstate, buf);
        x = y = 0;
    }
    if ((mon == game.u.usteed && !game.in_steed_dismounting) || (((mon).mhp < 1) && !(mon.isgd && x == 0 && y == 0))) {
        describe_level(buf, 0);
        impossible("placing %s onto map, mstate:%lx, on %s?", (mon == game.u.usteed) ? "steed" : "defunct monster", mon.mstate, buf);
        return;
    }
    if ((othermon = game.level.monsters[x][y]) != null) {
        describe_level(buf, 0);
        monnm = minimal_monnam(mon, (0));
        othnm = (mon != othermon) ? minimal_monnam(othermon, (1)) : "itself";
        impossible("placing %s over %s at <%d,%d>, mstates:%lx %lx on %s?", monnm, othnm, x, y, othermon.mstate, mon.mstate, buf);
    }
    mon.mx = x , mon.my = y;
    game.level.monsters[x][y] = mon;
    mon.mstate = 0;
}
/*steed.c*/
/* Must have Lev_at_will at this point */
/* since best_j is first candidate (j==0), j==1
                               and j==2 can only get here when best_j was
                               not viable; 50:50 chance for clockwise_j to
                               come before counterclk_j so each has same
                               chance to be next after best_j */
/* Couldn't move hero... try moving the steed. */
