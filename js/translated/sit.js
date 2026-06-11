/* NetHack 5.0	sit.c	$NHDT-Date: 1718136168 2024/06/11 20:02:48 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.95 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { atoi } from '../c2js-runtime/string.js';
import { is_art, spec_ability } from './artifact.js';
import { adjattrib, change_luck, exercise } from './attrib.js';
import { yn_function } from './cmd.js';
import { is_ice, is_lava, is_pool } from './dbridge.js';
import { c_color_names, c_common_strings, cg, ynchars } from './decl.js';
import { do_mapping } from './detect.js';
import { map_background, newsym, newsym_force, see_monsters, set_mimic_blocking, shieldeff } from './display.js';
import { dropy, heal_legs, schedule_goto } from './do.js';
import { Monnam, hcolor, hliquid, mon_nam } from './do_name.js';
import { defsyms } from './drawing.js';
import { In_V_tower, find_hell, on_level, surface } from './dungeon.js';
import { morehungry } from './eat.js';
import { can_reach_floor } from './engrave.js';
import { losexp } from './exper.js';
import { dryup } from './fountain.js';
import { losehp, money_cnt } from './hack.js';
import { delobj, identify_pack, stackobj, update_inventory, useupf } from './invent.js';
import { makemon } from './makemon.js';
import { msummon } from './minion.js';
import { curse, mksobj, set_corpsenm, unbless, weight } from './mkobj.js';
import { courtmon } from './mkroom.js';
import { egg_type_from_parent } from './mon.js';
import { pronoun_gender, sticks } from './mondata.js';
import { ACID_RES, AGGRAVATE_MONSTER, ALTAR, ANTIMAGIC, ART_MAGICBANE, A_CON, A_MAX, A_STR, A_WIS, BLINDED, CHEST, CLOTH, COIN_CLASS, COLD_RES, CONFUSION, CORPSE, CREAM_PIE, DEAF, DRAIN_RES, DRAWBRIDGE_DOWN, EGG, EYE, FAST, FIRE_RES, FLYING, FOOT, FOUNTAIN, GRAVE, HALF_PHDAM, HALF_SPDAM, HALLUC, HALLUC_RES, HEAD, INVIS, LADDER, LARGE_BOX, LEVITATION, PM_CYCLOPS, PM_ELECTRIC_EEL, PM_FIRE_ELEMENTAL, PM_FLOATING_EYE, PM_GIANT_EEL, PM_GREMLIN, PM_SALAMANDER, PM_TRAPPER, POISON_RES, POLY_NOFLAGS, PROTECTION, ROOM, SEE_INVIS, SHOCK_RES, SINK, SLIMED, SPBOOK_CLASS, SPE_REMOVE_CURSE, SPIKED_PIT, STAIRS, STEALTH, S_DRAGON, S_EEL, S_VAMPIRE, S_altar, S_grave, S_ice, S_sink, S_throne, TELEPAT, TELEPORT, THRONE, TOWEL, TT_BEARTRAP, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, TT_PIT, TT_WEB, UTOTYPE_NONE, WATER_WALKING_BOOTS } from './nh-constants.js';
import { observe_object } from './o_init.js';
import { Tobjnam, Yobjnam2, makeplural, the, vtense, xname } from './objnam.js';
import { There } from './pline.js';
import { body_part, polyself } from './polyself.js';
import { make_blinded, make_confused, make_glib, make_sick, split_mon } from './potion.js';
import { altar_wrath } from './pray.js';
import { do_genocide, seffects } from './read.js';
import { d, rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { remove_worn_item } from './steal.js';
import { tele } from './teleport.js';
import { burn_away_slime } from './timeout.js';
import { dotrap, t_at, uescaped_shaft, uteetering_at_seen_pit, water_damage } from './trap.js';
import { getlin } from './windows.js';
import { aggravate } from './wizard.js';
import { which_armor } from './worn.js';
import { makewish } from './zap.js';

/* take away the hero's money */
export function take_gold() {
    let otmp = null;
    let nobj = null;
    let lost_money = 0;
    for (otmp = game.invent; otmp; otmp = nobj) {
        nobj = otmp.nobj;
        if (otmp.oclass == COIN_CLASS) {
            lost_money = 1;
            remove_worn_item(otmp, (0));
            delobj(otmp);
        }
    }
    if (!lost_money) {
        You_feel("a strange sensation.");
    } else {
        You("notice you have no gold!");
        game.disp.botl = (1);
    }
}
/* maybe do something when hero sits on a throne */
export function throne_sit_effect() {
    let tx = game.u.ux;
    let ty = game.u.uy;
    let special_throne = !!In_V_tower(game.u.uz);
    if (rnd(6) > 4) {
        /* [why so convoluted? it's the same as '!rn2(3)'] */
        let effect = rnd(13);
        if (game.flags.debug && !game.iflags.debug_fuzzer) {
            let buf = '';
            let which = 0;
            buf = '';
            getlin("Throne sit effect (1..13) [0=random]", buf);
            if (buf[0] == 27) {
                pline("%s", c_common_strings.c_Never_mind);
                /* caller will still cause a move to elapse */
                return;
            }
            which = atoi(buf);
            if (which >= 1 && which <= 13) {
                effect = which;
            }
        }
        if (special_throne) {
            special_throne_effect(effect);
            return;
        }
        switch (effect) {
            case 1:
                adjattrib(rn2(A_MAX), -(rn2(4) + (3)), (0));
                losehp(rnd(10), "cursed throne", 0);
                break;
            case 2:
                adjattrib(rn2(A_MAX), 1, (0));
                break;
            case 3:
                pline("A%s electric shock shoots through your body!", ((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic)) ? "n" : " massive");
                losehp((game.u.uprops[SHOCK_RES].intrinsic || game.u.uprops[SHOCK_RES].extrinsic) ? rnd(6) : rnd(30), "electric chair", 0);
                exercise(A_CON, (0));
                break;
            case 4:
                You_feel("much, much better!");
                if ((game.u.umonnum != game.u.umonster)) {
                    if (game.u.mh >= (game.u.mhmax - 5)) {
                        game.u.mhmax += 4;
                    }
                    game.u.mh = game.u.mhmax;
                }
                if (game.u.uhp >= (game.u.uhpmax - 5)) {
                    game.u.uhpmax += 4;
                    if (game.u.uhpmax > game.u.uhppeak) {
                        game.u.uhppeak = game.u.uhpmax;
                    }
                }
                game.u.uhp = game.u.uhpmax;
                game.u.ucreamed = 0;
                make_blinded(0, (1));
                make_sick(0, null, (0), 3);
                heal_legs(0);
                game.disp.botl = (1);
                break;
            case 5:
                take_gold();
                break;
            case 6:
                if (game.u.uluck + rn2(5) < 0) {
                    You_feel("your luck is changing.");
                    change_luck(1);
                } else {
                    makewish();
                }
                break;
            case 7:
{
                    let cnt = rnd(10);
                    /* Magical voice not affected by deafness */
                    pline("A voice echoes:");
                    ;
                    verbalize("Thine audience hath been summoned, %s!", game.flags.female ? "Dame" : "Sire");
                    while (cnt--) {
                        makemon(courtmon(), tx, ty, 0);
                    }
                    break;
                }
            case 8:
                pline("A voice echoes:");
                ;
                verbalize("By thine Imperious order, %s...", game.flags.female ? "Dame" : "Sire");
                /* REALLY|ONTHRONE, see do_genocide() */
                do_genocide(5);
                break;
            case 9:
                pline("A voice echoes:");
                ;
                verbalize("A curse upon thee for sitting upon this most holy throne!");
                if ((game.u.uluck + game.u.moreluck) > 0) {
                    make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + (rn2(100) + (250)), (1));
                    change_luck(((game.u.uluck + game.u.moreluck) > 1) ? -rnd(2) : -1);
                } else {
                    rndcurse();
                }
                break;
            case 10:
                if ((game.u.uluck + game.u.moreluck) < 0 || (game.u.uprops[SEE_INVIS].intrinsic & (67108864 | 33554432 | 16777216))) {
                    if (game.level.flags.nommap) {
                        pline("A terrible drone fills your head!");
                        make_confused((game.u.uprops[CONFUSION].intrinsic & 16777215) + rnd(30), (0));
                    } else {
                        pline("An image forms in your mind.");
                        do_mapping();
                    }
                } else {
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        /* avoid "vision clears" if hero can't see */
                        Your("vision becomes clear.");
                    } else {
                        let num_of_eyes = (!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2);
                        let eye = body_part(EYE);
                        switch (num_of_eyes) {
                            /* note: 1 eye case won't actually happen--can't
                       sit on throne when poly'd into always-levitating
                       floating eye and can't polymorph into Cyclops */
                            default:
                            case 2:
                                eye = makeplural(eye);
                                ;
                            /* one eye (Cyclops, floating eye) */
                            case 1:
                                Your("%s %s...", eye, vtense(eye, "tingle"));
                                break;
                            case 0:
                                You("have a very strange feeling in your %s.", body_part(HEAD));
                                break;
                        }
                    }
                    game.u.uprops[SEE_INVIS].intrinsic |= 67108864;
                    /* might not be able to see self anymore */
                    newsym(game.u.ux, game.u.uy);
                }
                break;
            case 11:
                if ((game.u.uluck + game.u.moreluck) < 0) {
                    You_feel("threatened.");
                    aggravate();
                } else {
                    You_feel("a wrenching sensation.");
                    tele();
                }
                break;
            case 12:
                You("are granted an insight!");
                if (game.invent) {
                    /* rn2(5) agrees w/seffects() */
                    identify_pack(rn2(5), (0));
                }
                break;
            case 13:
                Your("mind turns into a pretzel!");
                make_confused((game.u.uprops[CONFUSION].intrinsic & 16777215) + (rn2(7) + (16)), (0));
                break;
            default:
                impossible("throne effect");
                break;
        }
    } else {
        if ((((game.youmonst.data).mflags2 & 2048) != 0) || game.u.uevent.uhand_of_elbereth) {
            You_feel("very comfortable here.");
        } else {
            You_feel("somehow out of place...");
        }
    }
    if (!special_throne && !rn2(3) && (!game.flags.debug || yn_function("Analyze throne?", ynchars, 110, (1)) == 121)) {
        game.level.locations[tx][ty].typ = ROOM , game.level.locations[tx][ty].flags = 0;
        /* 5.0: when the random chance for removal is hit, ask for confirmation
       if in wizard mode, and remove the throne even if hero was teleported
       away from it.  [This used to remove a throne at hero's current
       location if there happened to be one, so for the teleport case that
       only happened when teleporting back to the same point where hero
       started from.]  "Analyzing a throne" doesn't really make any sense
       but if the answer is yes than it will vanish in a puff of logic. */
        map_background(tx, ty, (0));
        newsym_force(tx, ty);
        /* "[God] promptly vanishes in a puff of logic" is from
           Douglas Adams' _The_Hitchhiker's_Guide_to_the_Galaxy_. */
        pline_The("throne %s in a puff of logic.", ((game.viz_array[ty][tx] & 2) != 0) ? "vanishes" : "has vanished");
    }
}
/* special throne in Vlad's tower: effect is 1 to 13 inclusive */
export function special_throne_effect(effect) {
    let tx = game.u.ux;
    let ty = game.u.uy;
    switch (effect) {
        case 1:
        case 2:
        case 3:
        case 4:
            makewish();
            game.level.locations[tx][ty].typ = ROOM , game.level.locations[tx][ty].flags = 0;
            map_background(tx, ty, (0));
            newsym_force(tx, ty);
            pline_The("throne disintegrates, having spent its power.");
            break;
        case 5:
            pline("Sitting on the throne was a terrible experience.");
            if (!(game.u.uprops[DRAIN_RES].intrinsic || game.u.uprops[DRAIN_RES].extrinsic)) {
                /* 4 chances of a wish, but then the throne disappears.

           This is the only way the throne can disappear from sitting
           on it, so if you sit on it enough (enduring the negative
           effects) you are guaranteed an eventual wish. */
                losexp("a bad experience sitting on a throne");
                if (game.u.ulevelmax > game.u.ulevel) {
                    game.u.ulevelmax -= 1;
                }
            }
            break;
        case 6:
{
                /* grease hands and inventory

           Same rules for which items can be affected as grease_ok in apply.c */
                let otmp = null;
                pline("A greasy liquid sprays all over you!");
                for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                    if (otmp.oclass != COIN_CLASS) {
                        otmp.greased = 1;
                    }
                }
                make_glib((rn2(101) + (100)));
                update_inventory();
                break;
            }
        case 7:
            attrcurse();
            pline_The("throne somehow seems to be amused.");
            break;
        case 8:
{
                /* level teleport to Vibrating Square level */
                let vs_level = { dnum: 0, dlevel: 0 };
                find_hell(vs_level);
                vs_level.dlevel = game.dungeons[vs_level.dnum].num_dunlevs - 1;
                if (game.u.uhave.amulet) {
                    You_feel("extremely disoriented for a moment.");
                } else {
                    schedule_goto(vs_level, UTOTYPE_NONE, null, "You feel extremely out of place.");
                }
                break;
            }
        case 9:
{
                /* summon demons; a NULL argument to msummon summons demons as
           though they were summoned by the Wizard of Yendor */
                pline_The("throne seeems to be calling for help!");
                msummon(null);
                msummon(null);
                msummon(null);
                break;
            }
        case 10:
{
                /* confused blessed remove curse effect */
                let fake_spellbook = { nobj: null, v: { v_nexthere: null, v_ocontainer: null, v_ocarry: null }, cobj: null, o_id: 0, ox: 0, oy: 0, otyp: 0, owt: 0, quan: 0, spe: 0, oclass: 0, invlet: 0, oartifact: 0, where: 0, timed: 0, cursed: 0, blessed: 0, unpaid: 0, no_charge: 0, recharged: 0, lamplit: 0, known: 0, dknown: 0, bknown: 0, rknown: 0, cknown: 0, lknown: 0, tknown: 0, nomerge: 0, oeroded: 0, oeroded2: 0, oerodeproof: 0, olocked: 0, obroken: 0, otrapped: 0, globby: 0, greased: 0, in_use: 0, bypass: 0, pickup_prev: 0, ghostly: 0, how_lost: 0, named_how: 0, corpsenm: 0, usecount: 0, oeaten: 0, age: 0, owornmask: 0, lua_ref_cnt: 0, omigr_from_dnum: 0, omigr_from_dlevel: 0, oextra: null };
                let save_confusion = game.u.uprops[CONFUSION].intrinsic;
                Object.assign(fake_spellbook, cg.zeroobj);
                fake_spellbook.otyp = SPE_REMOVE_CURSE;
                fake_spellbook.oclass = SPBOOK_CLASS;
                fake_spellbook.blessed = 1;
                game.u.uprops[CONFUSION].intrinsic = 1;
                seffects(fake_spellbook);
                game.u.uprops[CONFUSION].intrinsic = save_confusion;
                break;
            }
        case 11:
            if (((game.youmonst.data).mlet == S_VAMPIRE)) {
                /* polymorph effect (not blocked by magic resistance, but other things
           that protect from polymorphs work) */
                You_feel("unworthy.");
            } else {
                pline("This throne was not meant for those such as you!");
                You_feel("a change coming over you.");
                polyself(POLY_NOFLAGS);
            }
            break;
        case 12:
            pline("The throne is covered in acid!");
            losehp((game.u.uprops[ACID_RES].intrinsic || game.u.uprops[ACID_RES].extrinsic) ? rnd(16) : rnd(80), "acidic chair", 0);
            exercise(A_CON, (0));
            break;
        case 13:
{
                let ability = 0;
                pline("As you sit on the throne, your body and mind start to warp.");
                for (ability = 0; ability < A_MAX; ++ability) {
                    adjattrib(ability, rn2(5) - 2, -1);
                }
                break;
            }
    }
}
/* hero lays an egg */
export function lay_an_egg() {
    let uegg = null;
    if (!game.flags.female) {
        pline("%s can't lay eggs!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "You may think you are a platypus, but a male still" : "Males");
        return 0;
    } else if (game.u.uhunger < game.objects[EGG].oc_nutrition) {
        You("don't have enough energy to lay an egg.");
        return 0;
    } else if (((((game.youmonst.data).mflags1 & 4194304) != 0) && (game.youmonst.data).mlet == S_EEL && (((game.youmonst.data).mflags1 & 2) != 0))) {
        if (!((game.u.uinwater) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) {
            pline("A splash tetra you are not.");
            return 0;
        }
        if ((game.u.umonnum != game.u.umonster) && (game.youmonst.data == game.mons[PM_GIANT_EEL] || game.youmonst.data == game.mons[PM_ELECTRIC_EEL])) {
            You("yearn for the Sargasso Sea.");
            return 0;
        }
    }
    uegg = mksobj(EGG, (0), (0));
    uegg.spe = 1;
    uegg.quan = 1;
    uegg.owt = weight(uegg);
    /* this sets hatch timers if appropriate */
    set_corpsenm(uegg, egg_type_from_parent(game.u.umonnum, (0)));
    uegg.known = 1;
    observe_object(uegg);
    You("%s an egg.", ((((game.youmonst.data).mflags1 & 4194304) != 0) && (game.youmonst.data).mlet == S_EEL && (((game.youmonst.data).mflags1 & 2) != 0)) ? "spawn" : "lay");
    dropy(uegg);
    stackobj(uegg);
    morehungry(game.objects[EGG].oc_nutrition);
    return 1;
}
/* #sit command */
const __dosit_sit_message = "sit on the %s.";
export function dosit() {
    let trap = t_at(game.u.ux, game.u.uy);
    let typ = game.level.locations[game.u.ux][game.u.uy].typ;
    if (game.u.usteed) {
        You("are already sitting on %s.", mon_nam(game.u.usteed));
        return 0;
    }
    if (game.u.uundetected && (((game.youmonst.data).mflags1 & 256) != 0) && game.u.umonnum != PM_TRAPPER) {
        game.u.uundetected = 0;
    }
    if (!can_reach_floor((0))) {
        if (game.u.uswallow) {
            There("are no seats in here!");
        } else if (((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            You("tumble in place.");
        /* trapper can stay hidden on floor */
        /* no longer on the ceiling */
        } else {
            You("are sitting on air.");
        }
        return 0;
    } else if (game.u.ustuck && !sticks(game.youmonst.data)) {
        if ((((game.u.ustuck.data).mflags1 & 131072) != 0)) {
            pline("%s won't offer %s lap.", Monnam(game.u.ustuck), (genders[pronoun_gender(game.u.ustuck, 2)].his));
        /* holding monster is next to hero rather than beneath, but
           hero is in no condition to actually sit at has/her own spot */
        } else {
            pline("%s has no lap.", Monnam(game.u.ustuck));
        }
        return 0;
    } else if ((is_pool(game.u.ux, game.u.uy) && !(game.u.uinwater)) || ((game.u.umonnum != game.u.umonster) && game.u.umonnum == PM_GREMLIN && (game.level.locations[game.u.ux][game.u.uy].typ == FOUNTAIN || is_pool(game.u.ux, game.u.uy)))) {
        You("sit in the %s.", hliquid("water"));
        if ((game.u.umonnum != game.u.umonster) && game.u.umonnum == PM_GREMLIN) {
            /* splitting--or failing to do so--protects gear from the water */
            if (split_mon(game.youmonst, null)) {
                if (game.level.locations[game.u.ux][game.u.uy].typ == FOUNTAIN) {
                    dryup(game.u.ux, game.u.uy, (1));
                }
            }
        } else {
            if (!rn2(10) && game.uarm) {
                water_damage(game.uarm, "armor", (1));
            }
            if (!rn2(10) && game.uarmf && game.uarmf.otyp != WATER_WALKING_BOOTS) {
                water_damage(game.uarm, "armor", (1));
            }
        }
        return 1;
    }
    if ((game.level.objects[game.u.ux][game.u.uy] != null) && !(uteetering_at_seen_pit(trap) || uescaped_shaft(trap))) {
        /* ensure we're not standing on the precipice */
        let obj = null;
        obj = game.level.objects[game.u.ux][game.u.uy];
        if (game.youmonst.data.mlet == S_DRAGON && obj.oclass == COIN_CLASS) {
            You("coil up around your %shoard.", (obj.quan + money_cnt(game.invent) < game.u.ulevel * 1000) ? "meager " : "");
        } else if (obj.otyp == TOWEL) {
            pline("It's probably not a good time for a picnic...");
        } else {
            if ((((game.youmonst.data).mflags1 & 524288) != 0)) {
                You("coil up around %s.", the(xname(obj)));
            } else {
                You("sit on %s.", the(xname(obj)));
            }
            if (obj.otyp == CORPSE && (((game.mons[obj.corpsenm]).mflags1 & 4) != 0)) {
                pline("It's squishy...");
            } else if (obj.otyp == CREAM_PIE) {
                if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    ;
                    pline("Squelch!");
                }
                useupf(obj, obj.quan);
            } else if (!(((obj).otyp == LARGE_BOX || (obj).otyp == CHEST) || game.objects[obj.otyp].oc_material == CLOTH)) {
                pline("It's not very comfortable...");
            }
        }
    } else if (trap != null || (game.u.utrap && (game.u.utraptype >= TT_LAVA))) {
        if (game.u.utrap) {
            /* you're getting stuck longer */
            exercise(A_WIS, (0));
            if (game.u.utraptype == TT_BEARTRAP) {
                You_cant("sit down with your %s in the bear trap.", body_part(FOOT));
                game.u.utrap++;
            } else if (game.u.utraptype == TT_PIT) {
                if (trap && trap.ttyp == SPIKED_PIT) {
                    You("sit down on a spike.  Ouch!");
                    losehp((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic) ? rn2(2) : 1, "sitting on an iron spike", 1);
                    exercise(A_STR, (0));
                } else {
                    You("sit down in the pit.");
                }
                game.u.utrap += rn2(5);
            } else if (game.u.utraptype == TT_WEB) {
                You("sit in the spider web and get entangled further!");
                game.u.utrap += (rn2(10) + (5));
            } else if (game.u.utraptype == TT_LAVA) {
                /* Must have fire resistance or they'd be dead already */
                You("sit in the %s!", hliquid("lava"));
                if (game.u.uprops[SLIMED].intrinsic) {
                    burn_away_slime();
                }
                game.u.utrap += rnd(4);
                losehp(d(2, 10), "sitting in lava", 1);
            } else if (game.u.utraptype == TT_INFLOOR || game.u.utraptype == TT_BURIEDBALL) {
                You_cant("maneuver to sit!");
                game.u.utrap++;
            }
        } else {
            /* when flying, "you land" might need some refinement; it sounds
               as if you're staying on the ground but you will immediately
               take off again unless you become stuck in a holding trap */
            You("%s.", ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) ? "land" : "sit down");
            dotrap(trap, 32);
        }
    } else if (((game.u.uinwater) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) && !((((game.youmonst.data).mflags1 & 4194304) != 0) && (game.youmonst.data).mlet == S_EEL && (((game.youmonst.data).mflags1 & 2) != 0))) {
        if ((((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            There("are no cushions floating nearby.");
        } else {
            You("sit down on the muddy bottom.");
        }
    } else if (is_pool(game.u.ux, game.u.uy) && !((((game.youmonst.data).mflags1 & 4194304) != 0) && (game.youmonst.data).mlet == S_EEL && (((game.youmonst.data).mflags1 & 2) != 0))) {
        in_water: {
        }
        You("sit in the %s.", hliquid("water"));
        if ((game.u.umonnum != game.u.umonster) && game.u.umonnum == PM_GREMLIN) {
            if (split_mon(game.youmonst, null)) {
                if (game.level.locations[game.u.ux][game.u.uy].typ == FOUNTAIN) {
                    dryup(game.u.ux, game.u.uy, (1));
                }
            }
        } else {
            if (!rn2(10) && game.uarm) {
                water_damage(game.uarm, "armor", (1));
            }
            if (!rn2(10) && game.uarmf && game.uarmf.otyp != WATER_WALKING_BOOTS) {
                water_damage(game.uarm, "armor", (1));
            }
        }
    } else if (((typ) == SINK)) {
        You(__dosit_sit_message, defsyms[S_sink].explanation);
        Your("%s gets wet.", (((game.youmonst.data).mflags1 & 131072) != 0) ? "rump" : "underside");
    } else if (((typ) == ALTAR)) {
        You(__dosit_sit_message, defsyms[S_altar].explanation);
        altar_wrath(game.u.ux, game.u.uy);
    } else if (((typ) == GRAVE)) {
        You(__dosit_sit_message, defsyms[S_grave].explanation);
    } else if (typ == STAIRS) {
        You(__dosit_sit_message, "stairs");
    } else if (typ == LADDER) {
        You(__dosit_sit_message, "ladder");
    } else if (is_lava(game.u.ux, game.u.uy)) {
        You(__dosit_sit_message, hliquid("lava"));
        burn_away_slime();
        if ((game.youmonst.data == game.mons[PM_FIRE_ELEMENTAL] || game.youmonst.data == game.mons[PM_SALAMANDER])) {
            pline_The("%s feels warm.", hliquid("lava"));
            return 1;
        }
        pline_The("%s burns you!", hliquid("lava"));
        losehp(d(((game.u.uprops[FIRE_RES].intrinsic || game.u.uprops[FIRE_RES].extrinsic) ? 2 : 10), 10), "sitting on lava", 1);
    } else if (is_ice(game.u.ux, game.u.uy)) {
        You(__dosit_sit_message, defsyms[S_ice].explanation);
        if (!(game.u.uprops[COLD_RES].intrinsic || game.u.uprops[COLD_RES].extrinsic)) {
            pline_The("ice feels cold.");
        }
    } else if (typ == DRAWBRIDGE_DOWN) {
        You(__dosit_sit_message, "drawbridge");
    } else if (((typ) == THRONE)) {
        You(__dosit_sit_message, defsyms[S_throne].explanation);
        throne_sit_effect();
    } else if ((((game.youmonst.data).mflags1 & 4194304) != 0)) {
        return lay_an_egg();
    } else {
        pline("Having fun sitting on the %s?", surface(game.u.ux, game.u.uy));
    }
    return 1;
}
/* curse a few inventory items at random! */
const __rndcurse_mal_aura = "feel a malignant aura surround %s.";
export function rndcurse() {
    let nobj = 0;
    let cnt = 0;
    let onum = 0;
    let otmp = null;
    if (is_art(game.uwep, ART_MAGICBANE) && rn2(20)) {
        You(__rndcurse_mal_aura, "the magic-absorbing blade");
        return;
    }
    if ((game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) {
        shieldeff(game.u.ux, game.u.uy);
    }
    You(__rndcurse_mal_aura, "you");
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        /* gold isn't subject to being cursed or blessed */
        if (otmp.oclass == COIN_CLASS) {
            continue;
        }
        nobj++;
    }
    cnt = rnd(Math.trunc(6 / ((!!(game.u.uprops[ANTIMAGIC].intrinsic || game.u.uprops[ANTIMAGIC].extrinsic)) + (!!(game.u.uprops[HALF_SPDAM].intrinsic || game.u.uprops[HALF_SPDAM].extrinsic)) + 1)));
    if (nobj) {
        for (; cnt > 0; cnt--) {
            onum = rnd(nobj);
            for (otmp = game.invent; otmp; otmp = otmp.nobj) {
                if (otmp.oclass == COIN_CLASS) {
                    continue;
                }
                if (--onum == 0) {
                    break;
                }
            }
            /* the !otmp case should never happen; picking an already
               cursed item happens--avoid "resists" message in that case */
            if (!otmp || otmp.cursed) {
                continue;
            }
            if (otmp.oartifact && spec_ability(otmp, 4) && rn2(10) < 8) {
                pline("%s!", Tobjnam(otmp, "resist"));
                continue;
            }
            if (otmp.blessed) {
                unbless(otmp);
            } else {
                curse(otmp);
            }
        }
        update_inventory();
    }
    if (game.u.usteed && !rn2(4) && (otmp = which_armor(game.u.usteed, 1048576)) != null && !otmp.cursed) {
        if (otmp.blessed) {
            unbless(otmp);
        /* treat steed's saddle as extended part of hero's inventory */
        } else {
            curse(otmp);
        }
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            pline("%s %s.", Yobjnam2(otmp, "glow"), hcolor(otmp.cursed ? c_color_names.c_black : "brown"));
            otmp.bknown = (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? 0 : 1;
        } else {
            otmp.bknown = 0;
        }
    }
}
/* remove a random INTRINSIC ability from hero.
   returns the intrinsic property which was removed,
   or 0 if nothing was removed. */
export function attrcurse() {
    let ret = 0;
    switch (rnd(11)) {
        case 1:
            if (game.u.uprops[FIRE_RES].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[FIRE_RES].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You_feel("warmer.");
                ret = FIRE_RES;
                break;
            }
            ;
        case 2:
            if (game.u.uprops[TELEPORT].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[TELEPORT].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You_feel("less jumpy.");
                ret = TELEPORT;
                break;
            }
            ;
        case 3:
            if (game.u.uprops[POISON_RES].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[POISON_RES].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You_feel("a little sick!");
                ret = POISON_RES;
                break;
            }
            ;
        case 4:
            if (game.u.uprops[TELEPAT].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[TELEPAT].intrinsic &= ~(67108864 | 33554432 | 16777216);
                if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic)) {
                    see_monsters();
                }
                /* Can't sense mons anymore! */
                Your("senses fail!");
                ret = TELEPAT;
                break;
            }
            ;
        case 5:
            if (game.u.uprops[COLD_RES].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[COLD_RES].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You_feel("cooler.");
                ret = COLD_RES;
                break;
            }
            ;
        case 6:
            if (game.u.uprops[INVIS].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[INVIS].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You_feel("paranoid.");
                ret = INVIS;
                break;
            }
            ;
        case 7:
            if (game.u.uprops[SEE_INVIS].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[SEE_INVIS].intrinsic &= ~(67108864 | 33554432 | 16777216);
                if (!(game.u.uprops[SEE_INVIS].intrinsic || game.u.uprops[SEE_INVIS].extrinsic)) {
                    set_mimic_blocking();
                    see_monsters();
                    newsym(game.u.ux, game.u.uy);
                }
                You("%s!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "tawt you taw a puttie tat" : "thought you saw something");
                ret = SEE_INVIS;
                break;
            }
            ;
        case 8:
            if (game.u.uprops[FAST].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[FAST].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You_feel("slower.");
                ret = FAST;
                break;
            }
            ;
        case 9:
            if (game.u.uprops[STEALTH].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[STEALTH].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You_feel("clumsy.");
                ret = STEALTH;
                break;
            }
            ;
        case 10:
            if (game.u.uprops[PROTECTION].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[PROTECTION].intrinsic &= ~(67108864 | 33554432 | 16777216);
                /* intrinsic protection is just disabled, not set back to 0 */
                You_feel("vulnerable.");
                ret = PROTECTION;
                break;
            }
            ;
        case 11:
            if (game.u.uprops[AGGRAVATE_MONSTER].intrinsic & (67108864 | 33554432 | 16777216)) {
                game.u.uprops[AGGRAVATE_MONSTER].intrinsic &= ~(67108864 | 33554432 | 16777216);
                You_feel("less attractive.");
                ret = AGGRAVATE_MONSTER;
                break;
            }
            ;
        default:
            break;
    }
    return ret;
}
/*sit.c*/
