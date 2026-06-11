/* NetHack 5.0	fountain.c	$NHDT-Date: 1699582923 2023/11/10 02:22:03 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.100 $ */
/*      Copyright Scott R. Turner, srt@ucla, 10/27/86 */
/* NetHack may be freely redistributed.  See license for details. */
/* Code for drinking from fountains. */
import { game } from '../gstate.js';
import { You, You_feel, You_hear, You_see, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcpy } from '../c2js-runtime/string.js';
import { artiname, discover_artifact, exist_artifact } from './artifact.js';
import { acurr, adjattrib, exercise, poison_strdmg } from './attrib.js';
import { yn_function } from './cmd.js';
import { c_common_strings, ynchars } from './decl.js';
import { monster_detect } from './detect.js';
import { canseemon, glyph_at, newsym, sensemon } from './display.js';
import { polymorph_sink, trycall } from './do.js';
import { Amonnam, a_monnam, hcolor, hliquid, oname, rndmonnam } from './do_name.js';
import { fingers_or_gloves } from './do_wear.js';
import { dunlev, dunlevs_in_dungeon, level_difficulty, surface } from './dungeon.js';
import { morehungry, newuhs, vomit } from './eat.js';
import { del_engr_at } from './engrave.js';
import { more_experienced, newexplevel } from './exper.js';
import { glyph_to_cmap } from './glyphs.js';
import { in_town, losehp, money_cnt } from './hack.js';
import { distmin } from './hacklib.js';
import { enlightenment } from './insight.js';
import { delobj, sobj_at, update_inventory, useup } from './invent.js';
import { makemon } from './makemon.js';
import { set_levltyp } from './mkmaze.js';
import { bless, curse, mkgold, mkobj, mkobj_at, mksobj_at, uncurse } from './mkobj.js';
import { nexttodoor } from './mkroom.js';
import { angry_guards, get_iter_mons, minliquid } from './mon.js';
import { monstseesu, monstunseesu, pronoun_gender } from './mondata.js';
import { monflee } from './monmove.js';
import { ARM, ART_EXCALIBUR, A_CON, A_DEX, A_MAX, A_WIS, BLINDED, BOULDER, COIN_CLASS, DEAF, DILITHIUM_CRYSTAL, FACE, FIRE_RES, FOUNTAIN, GLIB, GLYPH_CMAP_C_OFF, GLYPH_CMAP_STONE_OFF, HALLUC, HALLUC_RES, HAND, HEAD, INVIS, LEVITATION, LONG_SWORD, LUCKSTONE, M_SEEN_FIRE, PM_KNIGHT, PM_SEWER_RAT, PM_WATCHMAN, PM_WATCH_CAPTAIN, PM_WATER_DEMON, PM_WATER_ELEMENTAL, PM_WATER_MOCCASIN, PM_WATER_NYMPH, POISON_RES, POLY_NOFLAGS, POOL, POTION_CLASS, POT_ACID, POT_FRUIT_JUICE, POT_GAIN_ENERGY, POT_GAIN_LEVEL, POT_LEVITATION, POT_MONSTER_DETECTION, POT_OBJECT_DETECTION, POT_OIL, POT_POLYMORPH, POT_WATER, RING_CLASS, ROOM, SEE_INVIS, S_cloud, S_digbeam, S_goodpos, TT_INFLOOR, TT_LAVA, UNCHANGING } from './nh-constants.js';
import { observe_object } from './o_init.js';
import { fruitname, makeplural, rnd_class, the, xname } from './objnam.js';
import { livelog_printf } from './pline.js';
import { body_part, mbodypart, polyself } from './polyself.js';
import { dopotion, make_glib, mongrantswish, potionbreathe } from './potion.js';
import { create_gas_cloud } from './region.js';
import { rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { obfree } from './shk.js';
import { somegold } from './steal.js';
import { delfloortrap, mintrap, t_at, water_damage, water_damage_chain } from './trap.js';
import { do_clear_area } from './vision.js';

/* used when trying to dip in or drink from fountain or sink or pool while
   levitating above it, or when trying to move downwards in that state */
export function floating_above(what) {
    let umsg = "are floating high above the %s.";
    if (game.u.utrap && (game.u.utraptype == TT_INFLOOR || game.u.utraptype == TT_LAVA)) {
        /* when stuck in floor (not possible at fountain or sink location,
           so must be attempting to move down), override the usual message */
        umsg = "are trapped in the %s.";
        what = surface(game.u.ux, game.u.uy);
    }
    You(umsg, what);
}
/* Fountain of snakes! */
export function dowatersnakes() {
    let num = (rn2(5) + (2));
    let mtmp = null;
    if (!(game.mvitals[PM_WATER_MOCCASIN].mvflags & (2 | 1))) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("An endless stream of %s pours forth!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? makeplural(rndmonnam(null)) : "snakes");
        } else {
            ;
            You_hear("%s hissing!", c_common_strings.c_something);
        }
        while (num-- > 0) {
            if ((mtmp = makemon(game.mons[PM_WATER_MOCCASIN], game.u.ux, game.u.uy, 131072)) != null && t_at(mtmp.mx, mtmp.my)) {
                mintrap(mtmp, 0);
            }
        }
    } else {
        ;
        pline_The("fountain bubbles furiously for a moment, then calms.");
    }
}
/* Water demon */
export function dowaterdemon() {
    let mtmp = null;
    if (!(game.mvitals[PM_WATER_DEMON].mvflags & (2 | 1))) {
        if ((mtmp = makemon(game.mons[PM_WATER_DEMON], game.u.ux, game.u.uy, 131072)) != null) {
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                You("unleash %s!", a_monnam(mtmp));
            } else {
                You_feel("the presence of evil.");
            }
            if (rnd(100) > (80 + level_difficulty())) {
                /* Give those on low levels a (slightly) better chance of survival
             */
                pline("Grateful for %s release, %s grants you a wish!", (genders[pronoun_gender(mtmp, 2)].his), (genders[pronoun_gender(mtmp, 2)].he));
                /* give a wish and discard the monster (mtmp set to null) */
                mongrantswish({ get value() { return mtmp; }, set value(_v) { mtmp = _v; } });
            } else if (t_at(mtmp.mx, mtmp.my)) {
                mintrap(mtmp, 0);
            }
        }
    } else {
        ;
        pline_The("fountain bubbles furiously for a moment, then calms.");
    }
}
/* Water Nymph */
export function dowaternymph() {
    let mtmp = null;
    if (!(game.mvitals[PM_WATER_NYMPH].mvflags & (2 | 1)) && (mtmp = makemon(game.mons[PM_WATER_NYMPH], game.u.ux, game.u.uy, 131072)) != null) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            You("attract %s!", a_monnam(mtmp));
        } else {
            You_hear("a seductive voice.");
        }
        mtmp.msleeping = 0;
        if (t_at(mtmp.mx, mtmp.my)) {
            mintrap(mtmp, 0);
        }
    } else if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        ;
        ;
        pline("A large bubble rises to the surface and pops.");
    } else {
        ;
        You_hear("a loud pop.");
    }
}
/* Gushing forth along LOS from (u.ux, u.uy) */
export function dogushforth(drinking) {
    let madepool = 0;
    do_clear_area(game.u.ux, game.u.uy, 7, gush, madepool);
    if (!madepool) {
        if (drinking) {
            Your("thirst is quenched.");
        } else {
            pline("Water sprays all over you.");
        }
    }
}
export function gush(x, y, poolcnt) {
    let mtmp = null;
    let ttmp = null;
    if (((x + y) % 2) || ((x) == game.u.ux && (y) == game.u.uy) || (rn2(1 + distmin(game.u.ux, game.u.uy, x, y))) || (game.level.locations[x][y].typ != ROOM) || (sobj_at(BOULDER, x, y)) || nexttodoor(x, y)) {
        return;
    }
    if ((ttmp = t_at(x, y)) != null && !delfloortrap(ttmp)) {
        return;
    }
    if (!((poolcnt)++)) {
        pline("Water gushes forth from the overflowing fountain!");
    }
    set_levltyp(x, y, POOL);
    game.level.locations[x][y].flags = 0;
    del_engr_at(x, y);
    water_damage_chain(game.level.objects[x][y], (1));
    if ((mtmp = (game.level.monsters[x][y])) != null) {
        minliquid(mtmp);
    } else {
        /* The location is seen if the hero/monster is invisible
           or felt if the hero is blind. */
        newsym(x, y);
    }
}
/* Find a gem in the sparkling waters. */
export function dofindgem() {
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        You("spot a gem in the sparkling waters!");
    } else {
        You_feel("a gem here!");
    }
    mksobj_at(rnd_class(DILITHIUM_CRYSTAL, LUCKSTONE - 1), game.u.ux, game.u.uy, (0), (0));
    game.level.locations[game.u.ux][game.u.uy].flags |= 1;
    ;
    newsym(game.u.ux, game.u.uy);
    exercise(A_WIS, (1));
}
export function watchman_warn_fountain(mtmp) {
    if (((mtmp.data) == game.mons[PM_WATCHMAN] || (mtmp.data) == game.mons[PM_WATCH_CAPTAIN]) && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0) && mtmp.mpeaceful) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            pline("%s yells:", Amonnam(mtmp));
            verbalize("Hey, stop using that fountain!");
        } else {
            pline("%s earnestly %s %s %s!", Amonnam(mtmp), (((mtmp.data).mflags1 & 24576) == 24576) ? "shakes" : "waves", (genders[pronoun_gender(mtmp, 2)].his), (((mtmp.data).mflags1 & 24576) == 24576) ? mbodypart(mtmp, HEAD) : makeplural(mbodypart(mtmp, ARM)));
        }
        return (1);
    }
    return (0);
}
export function dryup(x, y, isyou) {
    if (((game.level.locations[x][y].typ) == FOUNTAIN) && (!rn2(3) || (game.level.locations[x][y].flags & 2))) {
        if (isyou && in_town(x, y) && !(game.level.locations[x][y].flags & 2)) {
            let mtmp = null;
            game.level.locations[x][y].flags |= 2;
            ;
            /* Warn about future fountain use. */
            mtmp = get_iter_mons(watchman_warn_fountain);
            /* You can see or hear this effect */
            if (!mtmp) {
                pline_The("flow reduces to a trickle.");
            }
            return;
        }
        if (isyou && game.flags.debug) {
            if (yn_function("Dry up fountain?", ynchars, 110, (1)) == 110) {
                return;
            }
        }
        if (((game.viz_array[y][x] & 2) != 0)) {
            /* FIXME: sight-blocking clouds should use block_point() when
           being created and unblock_point() when going away, then this
           glyph hackery wouldn't be necessary */
            let glyph = glyph_at(x, y);
            if (!((glyph) >= GLYPH_CMAP_STONE_OFF && (glyph) < (GLYPH_CMAP_C_OFF + ((S_goodpos - S_digbeam) + 1))) || glyph_to_cmap(glyph) != S_cloud) {
                pline_The("fountain dries up!");
            }
        }
        /* replace the fountain with ordinary floor */
        /* updates level.flags.nfountains */
        set_levltyp(x, y, ROOM);
        game.level.locations[x][y].flags = 0;
        game.level.locations[x][y].horizontal = 0;
        newsym(x, y);
        if (isyou && in_town(x, y)) {
            angry_guards((0));
        }
    }
}
/* quaff from a fountain when standing on its location */
export function drinkfountain() {
    /* What happens when you drink from a fountain? */
    let mgkftn = (game.level.locations[game.u.ux][game.u.uy].horizontal == 1);
    let fate = rnd(30);
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        floating_above("fountain");
        return;
    }
    if (mgkftn && game.u.uluck >= 0 && fate >= 10) {
        let i = 0;
        let ii = 0;
        let littleluck = (game.u.uluck < 4);
        pline("Wow!  This makes you feel great!");
        for (ii = 0; ii < A_MAX; ii++) {
            if ((game.u.acurr.a[ii]) < (game.u.amax.a[ii])) {
                (game.u.acurr.a[ii]) = (game.u.amax.a[ii]);
                game.disp.botl = (1);
            }
        }
        /* gain ability, blessed if "natural" luck is high */
        /* start at a random attribute */
        i = rn2(A_MAX);
        for (ii = 0; ii < A_MAX; ii++) {
            if (adjattrib(i, 1, littleluck ? -1 : 0) && littleluck) {
                /* boiling water burns considered fire damage */
                /* potions with no potionbreathe() effects, plus water.  if effects
           are added to potionbreathe these should go to that instead (except
           for water). */
                break;
            }
            if (++i >= A_MAX) {
                i = 0;
            }
        }
        (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
        pline("A wisp of vapor escapes the fountain...");
        exercise(A_WIS, (1));
        game.level.locations[game.u.ux][game.u.uy].horizontal = 0;
        return;
    }
    if (fate < 10) {
        pline_The("cool draught refreshes you.");
        game.u.uhunger += rnd(10);
        newuhs((0));
        if (mgkftn) {
            return;
        }
    } else {
        switch (fate) {
            case 19:
                You_feel("self-knowledgeable...");
                (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
                enlightenment(2, 0);
                exercise(A_WIS, (1));
                pline_The("feeling subsides.");
                break;
            case 20:
                pline_The("water is foul!  You gag and vomit.");
                morehungry((rn2(20) + (11)));
                vomit();
                break;
            case 21:
                pline_The("water is contaminated!");
                if ((game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic)) {
                    pline("Perhaps it is runoff from the nearby %s farm.", fruitname((0)));
                    losehp(rnd(4), "unrefrigerated sip of juice", 0);
                    break;
                }
                poison_strdmg((rn2(4) + (3)), rnd(10), "contaminated water", 1);
                exercise(A_CON, (0));
                break;
            case 22:
                dowatersnakes();
                break;
            /* an Endless Stream of Snakes */
            case 23:
                dowaterdemon();
                break;
            case 24:
{
                    let obj = null;
                    let nextobj = null;
                    let buc_changed = 0;
                    pline("This water's no good!");
                    morehungry((rn2(20) + (11)));
                    exercise(A_CON, (0));
                    for (obj = game.invent; obj; obj = nextobj) {
                        /* this is more severe than rndcurse() */
                        nextobj = obj.nobj;
                        if (obj.oclass != COIN_CLASS && !obj.cursed && !rn2(5)) {
                            curse(obj);
                            ++buc_changed;
                        }
                    }
                    if (buc_changed) {
                        update_inventory();
                    }
                    break;
                }
            case 25:
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    if ((((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) && !(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic))) {
                        You("feel transparent.");
                    } else {
                        You("feel very self-conscious.");
                        pline("Then it passes.");
                    }
                } else {
                    You_see("an image of someone stalking you.");
                    pline("But it disappears.");
                }
                game.u.uprops[SEE_INVIS].intrinsic |= 67108864;
                newsym(game.u.ux, game.u.uy);
                exercise(A_WIS, (1));
                break;
            case 26:
                if (monster_detect(null, 0)) {
                    pline_The("%s tastes like nothing.", hliquid("water"));
                }
                exercise(A_WIS, (1));
                break;
            case 27:
                if (!(game.level.locations[game.u.ux][game.u.uy].flags & 1)) {
                    dofindgem();
                    break;
                }
                ;
            case 28:
                dowaternymph();
                break;
            case 29:
{
                    let mtmp = null;
                    pline("This %s gives you bad breath!", hliquid("water"));
                    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
                        if (((mtmp).mhp < 1)) {
                            continue;
                        }
                        monflee(mtmp, 0, (0), (0));
                    }
                    break;
                }
            /* Gushing forth in this room */
            case 30:
                dogushforth((1));
                break;
            default:
                pline("This tepid %s is tasteless.", hliquid("water"));
                break;
        }
    }
    dryup(game.u.ux, game.u.uy, (1));
}
/* dip an object into a fountain when standing on its location */
const __dipfountain_lady = "Lady of the Lake";
export function dipfountain(obj) {
    let er = 0;
    let is_hands = (obj == game.hands_obj);
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        floating_above("fountain");
        return;
    }
    if (obj.otyp == LONG_SWORD && game.u.ulevel >= 5 && !rn2((game.urole.mnum == (PM_KNIGHT)) ? 6 : 30) && obj.quan == 1 && !obj.oartifact && !exist_artifact(LONG_SWORD, artiname(ART_EXCALIBUR))) {
        if (game.u.ualign.type != 1) {
            /* once upon a time it was possible to poly N daggers into N swords */
            /* Ha!  Trying to cheat her. */
            pline("A freezing mist rises from the %s and envelopes the sword.", hliquid("water"));
            pline_The("fountain disappears!");
            curse(obj);
            if (obj.spe > -6 && !rn2(3)) {
                obj.spe--;
            }
            obj.oerodeproof = (0);
            exercise(A_WIS, (0));
            livelog_printf(64, "was denied %s!  The %s has deemed %s unworthy", artiname(ART_EXCALIBUR), __dipfountain_lady, (genders[game.flags.female ? 1 : 0].him));
        } else {
            /* The lady of the lake acts! - Eric Backus */
            pline("From the murky depths, a hand reaches up to bless the sword.");
            pline("As the hand retreats, the fountain disappears!");
            obj = oname(obj, artiname(ART_EXCALIBUR), 16 | 256);
            discover_artifact(ART_EXCALIBUR);
            bless(obj);
            obj.oeroded = obj.oeroded2 = 0;
            obj.oerodeproof = (1);
            exercise(A_WIS, (1));
            livelog_printf(64, "was given %s by the %s", artiname(ART_EXCALIBUR), __dipfountain_lady);
        }
        update_inventory();
        set_levltyp(game.u.ux, game.u.uy, ROOM);
        game.level.locations[game.u.ux][game.u.uy].flags = 0;
        newsym(game.u.ux, game.u.uy);
        if (in_town(game.u.ux, game.u.uy)) {
            angry_guards((0));
        }
        return;
    } else if (is_hands || obj == game.uarmg) {
        er = wash_hands();
    } else {
        er = water_damage(obj, null, (1));
    }
    if (er == 3 || (er != 0 && !rn2(2))) {
        return;
    }
    switch (rnd(30)) {
        case 16:
            if (!is_hands && obj.oclass != COIN_CLASS && !obj.cursed) {
                curse(obj);
            }
            break;
        case 17:
        case 18:
        case 19:
        case 20:
            if (!is_hands && obj.cursed) {
                if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                    pline_The("%s glows for a moment.", hliquid("water"));
                }
                uncurse(obj);
            } else {
                pline("A feeling of loss comes over you.");
            }
            break;
        case 21:
            dowaterdemon();
            break;
        case 22:
            dowaternymph();
            break;
        case 23:
            dowatersnakes();
            break;
        case 24:
            if (!(game.level.locations[game.u.ux][game.u.uy].flags & 1)) {
                dofindgem();
                break;
            }
            ;
        case 25:
            dogushforth((0));
            break;
        case 26:
            pline("A strange tingling runs up your %s.", body_part(ARM));
            break;
        case 27:
            You_feel("a sudden chill.");
            break;
        case 28:
            pline("An urge to take a bath overwhelms you.");
{
                let money = money_cnt(game.invent);
                let otmp = null;
                let nextobj = null;
                if (money > 10) {
                    /* Amount to lose.  Might get rounded up as fountains don't
                 * pay change... */
                    money = Math.trunc(somegold(money) / 10);
                    for (otmp = game.invent; otmp && money > 0; otmp = nextobj) {
                        nextobj = otmp.nobj;
                        if (otmp.oclass == COIN_CLASS) {
                            let denomination = game.objects[otmp.otyp].oc_cost;
                            let coin_loss = Math.trunc((money + denomination - 1) / denomination);
                            coin_loss = ((coin_loss) < (otmp.quan) ? (coin_loss) : (otmp.quan));
                            otmp.quan -= coin_loss;
                            money -= coin_loss * denomination;
                            if (!otmp.quan) {
                                delobj(otmp);
                            }
                        }
                    }
                    You("lost some of your gold in the fountain!");
                    game.level.locations[game.u.ux][game.u.uy].flags &= ~1;
                    ;
                    exercise(A_WIS, (0));
                }
            }
            break;
        case 29:
            if ((game.level.locations[game.u.ux][game.u.uy].flags & 1)) {
                break;
            }
            game.level.locations[game.u.ux][game.u.uy].flags |= 1;
            ;
            mkgold((rnd((dunlevs_in_dungeon(game.u.uz) - dunlev(game.u.uz) + 1) * 2) + 5), game.u.ux, game.u.uy);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("Far below you, you see coins glistening in the %s.", hliquid("water"));
            }
            exercise(A_WIS, (1));
            newsym(game.u.ux, game.u.uy);
            break;
        default:
            if (er == 0) {
                pline("%s", c_common_strings.c_nothing_seems_to_happen);
            }
            break;
    }
    update_inventory();
    dryup(game.u.ux, game.u.uy, (1));
}
/* dipping '-' in fountain, pool, or sink */
export function wash_hands() {
    let hands = makeplural(body_part(HAND));
    let res = 0;
    let was_glib = !!game.u.uprops[GLIB].intrinsic;
    You("wash your %s%s in the %s.", game.uarmg ? "gloved " : "", hands, hliquid("water"));
    if (game.u.uprops[GLIB].intrinsic) {
        make_glib(0);
        Your("%s are no longer slippery.", fingers_or_gloves((1)));
    }
    if (game.uarmg) {
        res = water_damage(game.uarmg, null, (1));
    }
    /* not what ER_GREASED is for, but the checks in dipfountain just
       compare the result to ER_DESTROYED and ER_NOTHING, so it works */
    if (was_glib && res == 0) {
        res = 1;
    }
    return res;
}
/* convert a sink into a fountain */
export function breaksink(x, y) {
    if (((game.viz_array[y][x] & 2) != 0) || ((x) == game.u.ux && (y) == game.u.uy)) {
        pline_The("pipes break!  Water spurts out!");
    }
    /* updates level.flags.nsinks and level.flags.nfountains */
    set_levltyp(x, y, FOUNTAIN);
    game.level.locations[x][y].flags = 0;
    game.level.locations[x][y].horizontal = 0;
    game.level.locations[x][y].flags |= 1;
    ;
    newsym(x, y);
}
/* quaff from a sink while standing on its location */
export function drinksink() {
    let otmp = null;
    let mtmp = null;
    if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
        floating_above("sink");
        return;
    }
    switch (rn2(20)) {
        case 0:
            You("take a sip of very cold %s.", hliquid("water"));
            break;
        case 1:
            You("take a sip of very warm %s.", hliquid("water"));
            break;
        case 2:
            You("take a sip of scalding hot %s.", hliquid("water"));
            if ((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic)) {
                pline("It seems quite tasty.");
                monstseesu(M_SEEN_FIRE);
            } else {
                losehp(rnd(6), "sipping boiling water", 1);
                monstunseesu(M_SEEN_FIRE);
            }
            break;
        case 3:
            if (game.mvitals[PM_SEWER_RAT].mvflags & (2 | 1)) {
                pline_The("sink seems quite dirty.");
            } else {
                mtmp = makemon(game.mons[PM_SEWER_RAT], game.u.ux, game.u.uy, 131072);
                if (mtmp) {
                    pline("Eek!  There's %s in the sink!", (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || !(canseemon(mtmp) || sensemon(mtmp))) ? "something squirmy" : a_monnam(mtmp));
                }
            }
            break;
        case 4:
            for (; ; ) {
                otmp = mkobj(POTION_CLASS, (0));
                if (otmp.otyp != POT_WATER) {
                    break;
                }
                /* reject water and try again */
                obfree(otmp, null);
            }
            otmp.cursed = otmp.blessed = 0;
            pline("Some %s liquid flows from the faucet.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "odd" : hcolor((game.obj_descr[(game.objects[otmp.otyp]).oc_descr_idx].oc_descr)));
            if (!(((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)))) {
                observe_object(otmp);
            }
            /* Avoid panic upon useup() */
            otmp.quan++;
            otmp.corpsenm = 1;
            dopotion(otmp);
            obfree(otmp, null);
            break;
        case 5:
            if (!(game.level.locations[game.u.ux][game.u.uy].flags & 4)) {
                You("find a ring in the sink!");
                mkobj_at(RING_CLASS, game.u.ux, game.u.uy, (1));
                game.level.locations[game.u.ux][game.u.uy].flags |= 4;
                exercise(A_WIS, (1));
                newsym(game.u.ux, game.u.uy);
            } else {
                pline("Some dirty %s backs up in the drain.", hliquid("water"));
            }
            break;
        case 6:
            /* can't rely on using sink for unlimited scroll blanking; however,
           since sink will be converted into a fountain, hero can dip again */
            /* "The pipes break!  Water spurts out!" */
            breaksink(game.u.ux, game.u.uy);
            break;
        case 7:
            pline_The("%s moves as though of its own will!", hliquid("water"));
            if ((game.mvitals[PM_WATER_ELEMENTAL].mvflags & (2 | 1)) || !makemon(game.mons[PM_WATER_ELEMENTAL], game.u.ux, game.u.uy, 131072)) {
                pline("But it quiets down.");
            }
            break;
        case 8:
            pline("Yuk, this %s tastes awful.", hliquid("water"));
            more_experienced(1, 0);
            newexplevel();
            break;
        case 9:
            pline("Gaggg... this tastes like sewage!  You vomit.");
            morehungry((rn2(30 - (acurr(A_CON))) + (11)));
            vomit();
            break;
        case 10:
            pline("This %s contains toxic wastes!", hliquid("water"));
            if (!(game.u.uprops[UNCHANGING].intrinsic || game.u.uprops[UNCHANGING].extrinsic)) {
                You("undergo a freakish metamorphosis!");
                polyself(POLY_NOFLAGS);
            }
            break;
        case 11:
            ;
            You_hear("clanking from the pipes...");
            break;
        case 12:
            ;
            You_hear("snatches of song from among the sewers...");
            break;
        case 13:
            pline("Ew, what a stench!");
            create_gas_cloud(game.u.ux, game.u.uy, 1, 4);
            break;
        case 19:
            if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
                pline("From the murky drain, a hand reaches up... --oops--");
                break;
            }
            ;
        default:
            You("take a sip of %s %s.", rn2(3) ? (rn2(2) ? "cold" : "warm") : "hot", hliquid("water"));
    }
}
/* for #dip(potion.c) when standing on a sink */
export function dipsink(obj) {
    let try_call = (0);
    let not_looted_yet = (game.level.locations[game.u.ux][game.u.uy].flags & 4) == 0;
    let is_hands = (obj == game.hands_obj || (game.uarmg && obj == game.uarmg));
    if (!rn2(not_looted_yet ? 25 : 15)) {
        breaksink(game.u.ux, game.u.uy);
        if (game.u.uprops[GLIB].intrinsic && is_hands) {
            Your("%s are still slippery.", fingers_or_gloves((1)));
        }
        return;
    } else if (is_hands) {
        wash_hands();
        return;
    } else if (obj.oclass != POTION_CLASS) {
        You("hold %s under the tap.", the(xname(obj)));
        if (water_damage(obj, null, (1)) == 0) {
            pline("%s", c_common_strings.c_nothing_seems_to_happen);
        }
        return;
    }
    /* at this point the object must be a potion */
    You("pour %s%s down the drain.", (obj.quan > 1 ? "one of " : ""), the(xname(obj)));
    switch (obj.otyp) {
        case POT_POLYMORPH:
            polymorph_sink();
            try_call = (1);
            break;
        case POT_OIL:
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                pline("It leaves an oily film on the basin.");
                try_call = (1);
            } else {
                pline("%s", c_common_strings.c_nothing_seems_to_happen);
            }
            break;
        case POT_ACID:
            try_call = (1);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                /* acts like a drain cleaner product */
                pline_The("drain seems less clogged.");
            } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                You_hear("a sucking sound.");
            } else {
                pline("%s", c_common_strings.c_nothing_seems_to_happen);
                try_call = (0);
            }
            break;
        case POT_LEVITATION:
            sink_backs_up(game.u.ux, game.u.uy);
            try_call = (1);
            break;
        case POT_OBJECT_DETECTION:
            if (!(game.level.locations[game.u.ux][game.u.uy].flags & 4)) {
                You("sense a ring lost down the drain.");
                try_call = (1);
                break;
            }
            ;
        case POT_GAIN_LEVEL:
        case POT_GAIN_ENERGY:
        case POT_MONSTER_DETECTION:
        case POT_FRUIT_JUICE:
        case POT_WATER:
            pline("%s", c_common_strings.c_nothing_seems_to_happen);
            break;
        default:
            pline("A wisp of vapor rises up...");
            /* NB: potionbreathe calls trycall or makeknown as appropriate */
            if (!(((game.youmonst.data).mflags1 & 1024) != 0) || (((game.youmonst.data).mflags1 & 4096) == 0)) {
                potionbreathe(obj);
            }
            break;
    }
    if (try_call && obj.dknown) {
        trycall(obj);
    }
    useup(obj);
}
/* find a ring in a sink */
export function sink_backs_up(x, y) {
    let buf = '';
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        buf = strcpy(buf, "Muddy waste pops up from the drain");
    } else if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        buf = strcpy(buf, "You hear a sloshing sound");
    } else {
        buf = sprintf(buf, "Something splashes you in the %s", body_part(FACE));
    }
    pline("%s%s.", !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) ? "Flupp!  " : "", buf);
    if (!(game.level.locations[x][y].flags & 4)) {
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            You_see("a ring shining in its midst.");
        }
        mkobj_at(RING_CLASS, x, y, (1));
        newsym(x, y);
        exercise(A_DEX, (1));
        exercise(A_WIS, (1));
        game.level.locations[x][y].flags |= 4;
    }
}
/*fountain.c*/
/* We make fountains have more coins the closer you are to the
         * surface.  After all, there will have been more people going
         * by.  Just like a shopping mall!  Chris Woodbury  */
/* hero can feel the vapor on her skin, so no need to check Blind or
           breathless for this message */
