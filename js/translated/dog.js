import { fnEnter, traceCheckpoint } from '../c2js-runtime/trace.js';
/* NetHack 5.0	dog.c	$NHDT-Date: 1753856387 2025/07/29 22:19:47 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.190 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2011. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, pline, pline_The } from '../c2js-runtime/pline.js';
import { __nh_char_at0 } from '../c2js-runtime/string.js';
import { m_unleash } from './apply.js';
import { acurr } from './attrib.js';
import { night } from './calendar.js';
import { is_pool } from './dbridge.js';
import { canseemon, newsym, sensemon } from './display.js';
import { Monnam, christen_monst, mon_pmname } from './do_name.js';
import { dog_eat, finish_meating } from './dogmove.js';
import { deliver_obj_to_mon } from './dokick.js';
import { In_W_tower, builds_up, depth, ledger_no, ledger_to_dlev, ledger_to_dnum, on_level } from './dungeon.js';
import { in_rooms, monst_to_any } from './hack.js';
import { s_suffix } from './hacklib.js';
import { carrying } from './invent.js';
import { del_light_source } from './light.js';
import { makemon, mbirth_limit, newmextra, rndmonst_adj, set_malign } from './makemon.js';
import { expels } from './mhitu.js';
import { free_emin } from './minion.js';
import { discard_minvent, peek_at_iced_corpse_age, place_object } from './mkobj.js';
import { somexy } from './mkroom.js';
import { dealloc_monst, healmon, iter_mons, m_into_limbo, minliquid, mnearto, mnexto, monnear, pm_to_cham, relmon, restore_cham, see_monster_closeup, unstuck, wake_nearto } from './mon.js';
import { Resists_Elem, attacktype, dmgtype, levl_follower, mon_hates_silver, same_race, sticks } from './mondata.js';
import { find_pmmonst, mon_track_clear } from './monmove.js';
import { ACCFOOD, ACID_RES, AGGRAVATE_MONSTER, AMULET_OF_STRANGULATION, APPLE, APPORT, A_CHA, BALL_CLASS, BANANA, CADAVER, CARROT, CHAIN_CLASS, CLOVE_OF_GARLIC, CONFLICT, CORPSE, DISMOUNT_GENERIC, DISMOUNT_THROWN, DOGFOOD, EGG, ENORMOUS_MEATBALL, EXPENSIVE_CAMERA, EYE, FOOD_CLASS, GLOB_OF_GREEN_SLIME, HALLUC, HALLUC_RES, IRON, LOW_PM, LS_MONSTER, LUMP_OF_ROYAL_JELLY, MAGIC_PORTAL, MANFOOD, MEATBALL, MEAT_RING, MEAT_STICK, MITHRIL, NEED_HTH_WEAPON, NON_PM, NUMMONS, PM_BABY_GOLD_DRAGON, PM_BARBARIAN, PM_CAVE_DWELLER, PM_CHICKATRICE, PM_COCKATRICE, PM_DEATH, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLESH_GOLEM, PM_GELATINOUS_CUBE, PM_GHOUL, PM_GOLD_DRAGON, PM_GREEN_SLIME, PM_KILLER_BEE, PM_KITTEN, PM_LEATHER_GOLEM, PM_LICHEN, PM_LITTLE_DOG, PM_LIZARD, PM_LONG_WORM, PM_MEDUSA, PM_PESTILENCE, PM_PONY, PM_PYROLISK, PM_QUEEN_BEE, PM_RANGER, PM_RUST_MONSTER, PM_SALAMANDER, PM_SAMURAI, PM_SHOCKING_SPHERE, PM_STALKER, PM_VAMPIRE, PM_VAMPIRE_LEADER, PM_VLAD_THE_IMPALER, POISON, POISON_RES, RIN_SLOW_DIGESTION, ROCK_CLASS, SCROLL_CLASS, SILVER, SLIME_MOLD, SPBOOK_CLASS, SPE_CREATE_FAMILIAR, STONE_RES, S_BLOB, S_DOG, S_ELEMENTAL, S_FUNGUS, S_GHOST, S_GOLEM, S_JELLY, S_KOBOLD, S_LIGHT, S_OGRE, S_ORC, S_VORTEX, S_YETI, TABU, TIN, TRIPE_RATION, UNDEF, WOOD } from './nh-constants.js';
import { Tobjnam, an, the, xname } from './objnam.js';
import { There, livelog_printf, pline_mon } from './pline.js';
import { body_part } from './polyself.js';
import { is_quest_artifact } from './questpgr.js';
import { rn2, rnd } from './rnd.js';
import { genders } from './role.js';
import { make_happy_shk, make_happy_shoppers, obfree, picked_container, set_residency } from './shk.js';
import { growl, yelp } from './sounds.js';
import { spell_skilltype } from './spell.js';
import { stairway_find, stairway_find_dir, stairway_find_from } from './stairs.js';
import { mdrop_special_objs } from './steal.js';
import { dismount_steed, place_monster, put_saddle_on_mon } from './steed.js';
import { rloc, rloc_to } from './teleport.js';
import { mintrap } from './trap.js';
import { vision_recalc } from './vision.js';
import { mon_wield_item } from './weapon.js';
import { mon_has_amulet } from './wizard.js';
import { count_wsegs, get_wormno, initworm, redraw_worm, wormgone } from './worm.js';
import { obj_resists } from './zap.js';

export const Before_you = 0;
export const With_you = 1;
export const After_you = 2;
export const Wiz_arrive = -1;
/* monsters kept on migrating_mons for accessibility;
                      * they haven't actually left their level */
/* pets and level followers */
/* regular migrating monsters */
/* resurrect(wizard.c) */
export function newedog(mtmp) {
    if (!mtmp.mextra) {
        mtmp.mextra = newmextra();
    }
    if (!((mtmp).mextra.edog)) {
        ((mtmp).mextra.edog) = alloc(1 /* sizeof(struct edog) */);
        memset(((mtmp).mextra.edog), 0, 1 /* sizeof(struct edog) */);
        ((mtmp).mextra.edog).parentmid = mtmp.m_id;
    }
}
export function free_edog(mtmp) {
    if (mtmp.mextra && ((mtmp).mextra.edog)) {
        free(((mtmp).mextra.edog));
        ((mtmp).mextra.edog) = null;
    }
    mtmp.mtame = 0;
}
export function initedog(mtmp, everything) {
    let edogp = ((mtmp).mextra.edog);
    let minhungry = game.moves + 1000;
    let minimumtame = (((mtmp.data).mflags2 & 4194304) != 0) ? 10 : 5;
    mtmp.mtame = ((minimumtame) > (mtmp.mtame) ? (minimumtame) : (mtmp.mtame));
    mtmp.mpeaceful = 1;
    mtmp.mavenge = 0;
    /* recalc alignment now that it's tamed */
    set_malign(mtmp);
    if (everything) {
        mtmp.mleashed = 0;
        mtmp.meating = 0;
        edogp.droptime = 0;
        edogp.dropdist = 10000;
        edogp.apport = (acurr(A_CHA));
        edogp.whistletime = 0;
        /* edogp->hungrytime = 0L; // set below */
        /* force error if used before set */
        edogp.ogoal.x = -1;
        edogp.ogoal.y = -1;
        edogp.abuse = 0;
        edogp.revivals = 0;
        edogp.mhpmax_penalty = 0;
        edogp.killed_by_u = 0;
    } else {
        if (edogp.apport <= 0) {
            edogp.apport = 1;
        }
    }
    /* always set for newly tamed pet or feral former pet; hungrytime might
       already be higher when taming magic affects already tame monst */
    if (edogp.hungrytime < minhungry) {
        edogp.hungrytime = minhungry;
    }
    if (!game.u.uconduct.pets && game.program_state.in_moveloop) {
        /* livelog first pet, but only if you didn't start with one (the starting
     * pet will be initialized before in_moveloop is true) */
        /* "obtained" a pet rather than "tamed" it because it might have come
         * from a figurine or some other method in which it was created tame
         * using an() is safe unless it somehow becomes possible to tame a
         * unique monster */
        livelog_printf(32, "obtained %s first pet (%s)", (genders[game.flags.female ? 1 : 0].his), an(mon_pmname(mtmp)));
    }
    game.u.uconduct.pets++;
}
export function pet_type() {
    fnEnter("pet_type", "dog.c", 0);
    if (game.urole.petnum != NON_PM) {
        return game.urole.petnum;
    } else if (game.preferred_pet == 99) {
        return PM_KITTEN;
    } else if (game.preferred_pet == 100) {
        return PM_LITTLE_DOG;
    } else {
        return rn2(2) ? PM_KITTEN : PM_LITTLE_DOG;
    }
}
export function pick_familiar_pm(otmp, quietly) {
    let pm = null;
    if (otmp) {
        /* figurine; otherwise spell */
        let mndx = otmp.corpsenm;
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        pm = game.mons[mndx];
        if ((game.mvitals[mndx].mvflags & 1) && mbirth_limit(mndx) != 120) {
            /* activating a figurine provides one way to exceed the
           maximum number of the target critter created--unless
           it has a special limit (erinys, Nazgul) */
            if (!quietly) {
                pline("... into a pile of dust.");
            }
            return null;
        }
    } else if (!rn2(3)) {
        /* have just been given "You <do something with>
                   the figurine and it transforms." message */
        pm = game.mons[pet_type()];
    } else {
        let skill = spell_skilltype(SPE_CREATE_FAMILIAR);
        let max = 3 * (game.u.weapon_skills[skill].skill);
        pm = rndmonst_adj(0, max);
        if (!pm && !quietly) {
            There("seems to be nothing available for a familiar.");
        }
    }
    return pm;
}
export function make_familiar(otmp, x, y, quietly) {
    let pm = null;
    let mtmp = null;
    let chance = 0;
    let trycnt = 100;
    let reallytame = (1);
    do {
        let mmflags = 0;
        let cgend = 0;
        if (!(pm = pick_familiar_pm(otmp, quietly))) {
            break;
        }
        mmflags = 2048 | 8 | 1 | 131072;
        cgend = otmp ? (otmp.spe & 3) : 0;
        mmflags |= ((cgend == 1) ? 65536 : (cgend == 2) ? 32768 : 0);
        mtmp = makemon(pm, x, y, mmflags);
        if (otmp) {
            if (!mtmp) {
                /* monster has been genocided or target spot is occupied */
                if (!quietly) {
                    pline_The("figurine writhes and then shatters into pieces!");
                }
                break;
            } else if (mtmp.isminion) {
                /* Fixup for figurine of an Angel:  makemon() is willing to
                   create a random Angel as either an ordinary monster or as
                   a minion of random allegiance.  We don't want the latter
                   here in case it successfully becomes a pet. */
                mtmp.isminion = 0;
                /* [This could and possibly should be redone as a new
                   MM_flag passed to makemon() to suppress making a minion
                   so that no post-creation fixup would be needed.] */
                free_emin(mtmp);
            }
        }
    } while (!mtmp && --trycnt > 0);
    if (!mtmp) {
        return null;
    }
    if (is_pool(mtmp.mx, mtmp.my) && minliquid(mtmp)) {
        return null;
    }
    if (otmp) {
        /* figurine; resulting monster might not become a pet */
        /* 0==tame, 1==peaceful, 2==hostile */
        chance = rn2(10);
        if (chance > 2) {
            chance = otmp.blessed ? 0 : !otmp.cursed ? 1 : 2;
        }
        if (chance > 0) {
            /* 0,1,2:  b=80%,10,10; nc=10%,80,10; c=10%,10,80 */
            reallytame = (0);
            if (chance == 2) {
                /* hostile (cursed figurine) */
                if (!quietly) {
                    You("get a bad feeling about this.");
                }
                mtmp.mpeaceful = 0;
                set_malign(mtmp);
            }
        }
        /* if figurine has been named, give same name to the monster */
        if (((otmp).oextra && ((otmp).oextra.oname))) {
            mtmp = christen_monst(mtmp, ((otmp).oextra.oname));
        }
    }
    if (reallytame) {
        initedog(mtmp, (1));
    }
    mtmp.msleeping = 0;
    set_malign(mtmp);
    newsym(mtmp.mx, mtmp.my);
    if (mtmp.mtame && attacktype(mtmp.data, 254)) {
        /* must wield weapon immediately since pets will otherwise drop it */
        mtmp.weapon_check = NEED_HTH_WEAPON;
        mon_wield_item(mtmp);
    }
    return mtmp;
}
/* despite rather general name, used exclusively for hero's starting pet */
export function makedog() {
    fnEnter("makedog", "dog.c", 0);
    traceCheckpoint('makedog.start', { ux: game.u.ux, uy: game.u.uy });
    let mtmp = null;
    let petname = null;
    let pettype = 0;
    if (game.preferred_pet == 110) {
        /* static init yields 0 (PM_GIANT_ANT); fix that up now */
        game.context.startingpet_typ = NON_PM;
        return (null);
    }
    pettype = game.context.startingpet_typ = pet_type();
    petname = (pettype == PM_LITTLE_DOG) ? game.dogname : (pettype == PM_KITTEN) ? game.catname : (pettype == PM_PONY) ? game.horsename : "";
    if (!__nh_char_at0(petname) && pettype == PM_LITTLE_DOG) {
        /* All of these names were for dogs. */
        if ((game.urole.mnum == (PM_CAVE_DWELLER))) {
            petname = "Slasher";
        }
        if ((game.urole.mnum == (PM_SAMURAI))) {
            petname = "Hachi";
        }
        if ((game.urole.mnum == (PM_BARBARIAN))) {
            petname = "Idefix";
        }
        if ((game.urole.mnum == (PM_RANGER))) {
            petname = "Sirius";
        }
    }
    /* specifying NO_MINVENT prevents makemon() from having a 1% chance
       of creating a pony with an already worn saddle; dogs and cats
       aren't affected because they don't have any initial inventory
       [if anybody adds stranger pets that are expected to have such,
       they'll need to modify this] */
    mtmp = makemon(game.mons[pettype], game.u.ux, game.u.uy, 2048 | 1);
    if (!mtmp) {
        return (null);
    }
    if (!game.context.startingpet_mid) {
        /* pets were genocided [how?] */
        game.context.startingpet_mid = mtmp.m_id;
        if (!game.u.uroleplay.pauper) {
            if (pettype == PM_PONY) {
                /* initial horses start wearing a saddle (pauper hero excluded) */
                /* NULL obj arg means put_saddle_on_mon()
                 * will carry out the saddle creation */
                put_saddle_on_mon(null, mtmp);
            }
        }
        /* starting pet's type has been seen up close (unless PermaBlind)
           and for tourist treat it as having already been photographed */
        game.bhitpos.x = mtmp.mx , game.bhitpos.y = mtmp.my;
        game.notonhead = (0);
        see_monster_closeup(mtmp, carrying(EXPENSIVE_CAMERA) ? (1) : (0));
    } else {
        impossible("makedog() when startingpet_mid is already non-zero?");
    }
    if (!game.petname_used++ && __nh_char_at0(petname)) {
        mtmp = christen_monst(mtmp, petname);
    }
    initedog(mtmp, (1));
    traceCheckpoint('makedog.end', { mx: mtmp.mx, my: mtmp.my, mtame: mtmp.mtame, mpeaceful: mtmp.mpeaceful, pmidx: mtmp.data ? mtmp.data.pmidx : -1 });
    return mtmp;
}
export function set_mon_lastmove(mtmp) {
    mtmp.mlstmv = game.moves;
}
/* record `last move time' for all monsters prior to level save so that
   mon_arrive() can catch up for lost time when they're restored later */
export function update_mlstmv() {
    iter_mons(set_mon_lastmove);
}
/* note: always reset when used so doesn't need to be part of struct 'g' */
game.failed_arrivals = null;
export function losedogs() {
    let mtmp = null;
    let mprev__parent = null;
    let mprev__field = null;
    let dismissKops = 0;
    let xyloc = 0;
    game.failed_arrivals = null;
    for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
        /*
     * First, scan gm.migrating_mons for shopkeepers who want to dismiss Kops,
     * and scan gm.mydogs for shopkeepers who want to retain kops.
     * Second, dismiss kops if warranted, making more room for arrival.
     * Third, replace monsters who went onto migrating_mons in order to
     * be accessible from other levels but didn't actually leave the level.
     * Fourth, place monsters accompanying the hero.
     * Last, place migrating monsters coming to this level.
     *
     * Hero might eventually be displaced (due to the third step, but
     * occurring later), which is the main reason to do the second step
     * sooner (in turn necessitating the first step, rather than combining
     * the list scans with monster placement).
     */
        /* check for returning shk(s) */
        if (mtmp.mux != game.u.uz.dnum || mtmp.muy != game.u.uz.dlevel) {
            continue;
        }
        if (mtmp.isshk) {
            if (((mtmp).mextra.eshk).dismiss_kops) {
                if (dismissKops == 0) {
                    dismissKops = 1;
                }
                ((mtmp).mextra.eshk).dismiss_kops = (0);
            } else if (!mtmp.mpeaceful) {
                /* an unpacified shk is returning; don't dismiss kops
                   even if another pacified one is willing to do so */
                /* [keep looping; later monsters might need ESHK reset] */
                dismissKops = -1;
            }
        }
    }
    for (mtmp = game.mydogs; mtmp && dismissKops >= 0; mtmp = mtmp.nmon) {
        if (mtmp.isshk) {
            /* make the same check for gm.mydogs */
            /* hostile shk might accompany hero [ESHK(mtmp)->dismiss_kops
               can't be set here; it's only used for gm.migrating_mons] */
            if (!mtmp.mpeaceful) {
                dismissKops = -1;
            }
        }
    }
    /* when a hostile shopkeeper chases hero to another level
       and then gets paid off there, get rid of summoned kops
       here now that he has returned to his shop level */
    if (dismissKops > 0) {
        make_happy_shoppers((1));
    }
    for ((mprev__parent = game, mprev__field = "migrating_mons"); (mtmp = mprev__parent[mprev__field]) != null; ) {
        /* put monsters who went onto migrating_mons in order to be accessible
       when other levels are active back to their positions on this level;
       they're handled before mydogs so that monsters accompanying the
       hero can't steal the spot that belongs to them; these migraters
       should always be able to arrive because they were present on the
       level at the time the hero left [if they can't arrive for some
       reason, mon_arrive() will put them on the 'failed_arrivals' list] */
        /* time for migrating monsters to arrive; monsters who belong on
       this level but fail to arrive get put on the failed_arrivals list
       temporarily [by mon_arrive()], then back onto the migrating_mons
       list below */
        xyloc = mtmp.mtrack[0].x;
        if (mtmp.mux == game.u.uz.dnum && mtmp.muy == game.u.uz.dlevel && xyloc == 2) {
            /* remove mtmp from migrating_mons */
            mprev__parent[mprev__field] = mtmp.nmon;
            mon_arrive(mtmp, Before_you);
        } else {
            /* the Wizard is kept regardless of location so that he is
           ready to be brought back; nothing should be scheduled to
           migrate to the endgame but if we find such, we'll keep it */
            /* keep mtmp on migrating_mons */
            (mprev__parent = mtmp, mprev__field = "nmon");
        }
    }
    while ((mtmp = game.mydogs) != null) {
        /* place pets and/or any other monsters who accompany hero;
       any that fail to arrive (level may be full) will be moved
       first to failed_arrivals, then to migrating_mons scheduled
       to arrive back on this level if hero leaves and returns */
        game.mydogs = mtmp.nmon;
        mon_arrive(mtmp, With_you);
    }
    for ((mprev__parent = game, mprev__field = "migrating_mons"); (mtmp = mprev__parent[mprev__field]) != null; ) {
        xyloc = mtmp.mtrack[0].x;
        if (mtmp.mux == game.u.uz.dnum && mtmp.muy == game.u.uz.dlevel && xyloc != 2) {
            mprev__parent[mprev__field] = mtmp.nmon;
            /* note: if there's no room, it ends up on failed_arrivals list */
            mon_arrive(mtmp, After_you);
        } else {
            (mprev__parent = mtmp, mprev__field = "nmon");
        }
    }
    while ((mtmp = game.failed_arrivals) != null) {
        /* put any monsters who couldn't arrive back on migrating_mons,
       clearing out the temporary 'failed_arrivals' list in the process */
        game.failed_arrivals = mtmp.nmon;
        /* mon_arrive() put mtmp onto fmon, but if there wasn't room to
           arrive, relmon() was used to take it off again; put it back now
           because m_into_limbo() expects it to be there */
        mtmp.nmon = game.level.monlist;
        game.level.monlist = mtmp;
        /* set this monster to migrate back to this level if hero leaves
           and then returns */
        m_into_limbo(mtmp);
    }
}
/* called from resurrect() in addition to losedogs() */
export function mon_arrive(mtmp, when) {
    if (typeof process !== 'undefined' && process.env?.NH_PETPROBE) {
        console.warn('[mon_arrive]', 'uz=', JSON.stringify(game.u.uz), 'mon=', mtmp?.data?.pmidx, 'tame=', mtmp?.mtame, 'when=', when);
    }
    let t = null;
    let xlocale = 0;
    let ylocale = 0;
    let xyloc = 0;
    let xyflags = 0;
    let wander = 0;
    let num_segs = 0;
    let failed_to_place = (0);
    let stway = null;
    let fromdlev = { dnum: 0, dlevel: 0 };
    mtmp.mstate |= 256;
    mtmp.nmon = game.level.monlist;
    game.level.monlist = mtmp;
    if (mtmp.isshk) {
        set_residency(mtmp, (0));
    }
    num_segs = mtmp.wormno;
    if (mtmp.data == game.mons[PM_LONG_WORM]) {
        /* baby long worms have no tail so don't use is_longworm() */
        mtmp.wormno = get_wormno();
        if (mtmp.wormno) {
            initworm(mtmp, num_segs);
        }
    } else {
        mtmp.wormno = 0;
    }
    /* some monsters might need to do something special upon arrival
       _after_ the current level has been fully set up; see dochug() */
    mtmp.mstrategy |= 1073741824;
    mtmp.mstate &= ~(4 | 8);
    /* make sure mnexto(rloc_to(set_apparxy())) doesn't use stale data */
    mtmp.mux = game.u.ux , mtmp.muy = game.u.uy;
    xyloc = mtmp.mtrack[0].x;
    xyflags = mtmp.mtrack[0].y;
    xlocale = mtmp.mtrack[1].x;
    ylocale = mtmp.mtrack[1].y;
    fromdlev.dnum = mtmp.mtrack[2].x;
    fromdlev.dlevel = mtmp.mtrack[2].y;
    mon_track_clear(mtmp);
    /* in case Protection_from_shape_changers is different now from when
       'mtmp' went onto the migrating monsters list; that's handled in
       getlev() when returning to a previously visited level and by the
       special level code for monsters specified in the level, but needed
       here for monsters migrating to a newly created level */
    restore_cham(mtmp);
    if (mtmp == game.u.usteed) {
        return;
    }
    if (when == With_you) {
        if (!(game.level.monsters[game.u.ux][game.u.uy] != null) && !rn2(mtmp.mtame ? 10 : mtmp.mpeaceful ? 5 : 2)) {
            rloc_to(mtmp, game.u.ux, game.u.uy);
        /* don't place steed on the map */
        /* When a monster accompanies you, sometimes it will arrive
           at your intended destination and you'll end up next to
           that spot.  This code doesn't control the final outcome;
           goto_level(do.c) decides who ends up at your target spot
           when there is a monster there too. */
        } else {
            mnexto(mtmp, 4);
        }
        mtmp.mstate &= ~256;
        return;
    } else if (when == Wiz_arrive) {
        /* resurrect() is bringing existing wizard to harass the hero */
        xyloc = 9;
    }
    if (mtmp.mlstmv < game.moves - 1) {
        /*
     * The monster arrived on this level independently of the player.
     * Its coordinate fields were overloaded for use as flags that
     * specify its final destination.
     */
        /* heal monster for time spent in limbo */
        let nmv = game.moves - 1 - mtmp.mlstmv;
        mon_catchup_elapsed_time(mtmp, nmv);
        /* let monster move a bit on new level (see placement code below) */
        wander = ((nmv) < (8) ? (nmv) : (8));
    } else {
        wander = 0;
    }
    switch (xyloc) {
        case 1:
            break;
        case 2:
            wander = 0;
            break;
        case 9:
            xlocale = game.u.ux , ylocale = game.u.uy;
            break;
        case 3:
            if ((stway = stairway_find_from(fromdlev, (0))) != null) {
                xlocale = stway.sx;
                ylocale = stway.sy;
            }
            break;
        case 4:
            if ((stway = stairway_find_from(fromdlev, (0))) != null) {
                xlocale = stway.sx;
                ylocale = stway.sy;
            }
            break;
        case 5:
            if ((stway = stairway_find_from(fromdlev, (1))) != null) {
                xlocale = stway.sx;
                ylocale = stway.sy;
            }
            break;
        case 6:
            if ((stway = stairway_find_from(fromdlev, (1))) != null) {
                xlocale = stway.sx;
                ylocale = stway.sy;
            }
            break;
        case 7:
            if ((stway = stairway_find(fromdlev)) != null) {
                xlocale = stway.sx;
                ylocale = stway.sy;
            }
            break;
        case 8:
            if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
                /* there is no arrival portal for endgame levels */
                /* BUG[?]: for simplicity, this code relies on the fact
               that we know that the current endgame levels always
               build upwards and never have any exclusion subregion
               inside their TELEPORT_REGION settings. */
                xlocale = (rn2(game.updest.hx - game.updest.lx + 1) + (game.updest.lx));
                ylocale = (rn2(game.updest.hy - game.updest.ly + 1) + (game.updest.ly));
                break;
            }
            for (t = game.ftrap; t; t = t.ntrap) {
                if (t.ttyp == MAGIC_PORTAL) {
                    break;
                }
            }
            if (t) {
                xlocale = t.tx , ylocale = t.ty;
                break;
            } else if (game.iflags.debug_fuzzer && (stway = stairway_find_dir(!builds_up(game.u.uz))) != null) {
                /* debugfuzzer returns from or enters another branch */
                xlocale = stway.sx , ylocale = stway.sy;
                break;
            } else if (!(game.u.uevent.qexpelled && ((((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz0, (game.dungeon_topology.d_qstart_level)))) || (((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level))))))) {
                impossible("mon_arrive: no corresponding portal?");
            }
            ;
        default:
        case 0:
            xlocale = ylocale = 0;
            break;
    }
    if ((mtmp.migflags & 8192) != 0) {
        /* Pick up the rest of the MIGR_TO_SPECIES objects */
        if (game.migrating_objs) {
            deliver_obj_to_mon(mtmp, 0, 4);
        }
    }
    if (xlocale && wander) {
        /* monster moved a bit; pick a nearby location */
        /* mnearto() deals w/stone, et al */
        let r = in_rooms(xlocale, ylocale, 0);
        if (r && __nh_char_at0(r)) {
            let c = { x: 0, y: 0 };
            if (somexy(game.rooms[__nh_char_at0(r) - 3], c)) {
                xlocale = c.x , ylocale = c.y;
            /* somexy() handles irregular rooms */
            } else {
                xlocale = ylocale = 0;
            }
        } else {
            let i = 0;
            let j = 0;
            i = ((1) > (xlocale - wander) ? (1) : (xlocale - wander));
            j = ((80 - 1) < (xlocale + wander) ? (80 - 1) : (xlocale + wander));
            xlocale = (rn2(j - i) + (i));
            i = ((0) > (ylocale - wander) ? (0) : (ylocale - wander));
            j = ((21 - 1) < (ylocale + wander) ? (21 - 1) : (ylocale + wander));
            ylocale = (rn2(j - i) + (i));
        }
    }
    mtmp.mx = 0;
    mtmp.my = xyflags;
    if (xlocale) {
        failed_to_place = !mnearto(mtmp, xlocale, ylocale, (0), 4);
    } else {
        failed_to_place = !rloc(mtmp, 4);
    }
    if (failed_to_place) {
        if (when != Wiz_arrive) {
            relmon(mtmp, { get value() { return game.failed_arrivals; }, set value(_v) { game.failed_arrivals = _v; } });
        /* losedogs() will deal with this */
        /* when==Wiz_arrive => not being called by losedogs() */
        } else {
            m_into_limbo(mtmp);
        }
    }
    mtmp.mstate &= ~256;
}
/* heal monster for time spent elsewhere */
/* number of moves */
export function mon_catchup_elapsed_time(mtmp, nmv) {
    /* avoid zillions of casts and lint warnings */
    let imv = 0;
    if (nmv < 0) {
        panic("catchup from future time?");
        return;
    } else if (nmv == 0) {
        /* safe, but shouldn't happen */
        impossible("catchup from now?");
    } else if (nmv >= 32767) {
        imv = 32767 - 1;
    } else {
        imv = nmv;
    }
    if (mtmp.mblinded) {
        if (imv >= mtmp.mblinded) {
            mtmp.mblinded = 1;
        /* might stop being afraid, blind or frozen */
        /* set to 1 and allow final decrement in movemon() */
        } else {
            mtmp.mblinded -= imv;
        }
    }
    if (mtmp.mfrozen) {
        if (imv >= mtmp.mfrozen) {
            mtmp.mfrozen = 1;
        } else {
            mtmp.mfrozen -= imv;
        }
    }
    if (mtmp.mfleetim) {
        if (imv >= mtmp.mfleetim) {
            mtmp.mfleetim = 1;
        } else {
            mtmp.mfleetim -= imv;
        }
    }
    /* might recover from temporary trouble */
    if (mtmp.mtrapped && rn2(imv + 1) > Math.trunc(40 / 2)) {
        mtmp.mtrapped = 0;
    }
    if (mtmp.mconf && rn2(imv + 1) > Math.trunc(50 / 2)) {
        mtmp.mconf = 0;
    }
    if (mtmp.mstun && rn2(imv + 1) > Math.trunc(10 / 2)) {
        mtmp.mstun = 0;
    }
    if (mtmp.meating) {
        if (imv > mtmp.meating) {
            finish_meating(mtmp);
        /* might finish eating or be able to use special ability again */
        } else {
            mtmp.meating -= imv;
        }
    }
    if (imv > mtmp.mspec_used) {
        mtmp.mspec_used = 0;
    } else {
        mtmp.mspec_used -= imv;
    }
    if (mtmp.mtame) {
        /* reduce tameness for every 150 moves you are separated */
        let wilder = Math.trunc((imv + 75) / 150);
        if (mtmp.mtame > wilder) {
            mtmp.mtame -= wilder;
        } else if (mtmp.mtame > rn2(wilder)) {
            mtmp.mtame = 0;
        } else {
            mtmp.mtame = mtmp.mpeaceful = 0;
        }
    }
    if (mtmp.mtame && !mtmp.isminion && ((((mtmp.data).mflags1 & 536870912) != 0) || (((mtmp.data).mflags1 & 1073741824) != 0))) {
        /* check to see if it would have died as a pet; if so, go wild instead
     * of dying the next time we call dog_move()
     */
        let edog = ((mtmp).mextra.edog);
        if ((game.moves > edog.hungrytime + 500 && mtmp.mhp < 3) || (game.moves > edog.hungrytime + 750)) {
            mtmp.mtame = mtmp.mpeaceful = 0;
        }
    }
    if (!mtmp.mtame && mtmp.mleashed) {
        /* leashed monsters should always be with hero, consequently
           never losing any time to be accounted for later */
        impossible("catching up for leashed monster?");
        m_unleash(mtmp, (0));
    }
    if (!(((mtmp.data).mflags1 & 8388608) != 0)) {
        imv = Math.trunc(imv / 20);
    }
    healmon(mtmp, imv, 0);
    set_mon_lastmove(mtmp);
}
/* bookkeeping when mtmp is about to leave the current level;
   common to keepdogs() and migrate_to_level() */
export function mon_leave(mtmp) {
    let obj = null;
    let num_segs = 0;
    for (obj = mtmp.minvent; obj; obj = obj.nobj) {
        /* set minvent's obj->no_charge to 0 */
        if (((obj).cobj != null)) {
            picked_container(obj);
        }
        obj.no_charge = 0;
    }
    /* if this is a shopkeeper, clear the 'resident' field of her shop;
       if/when she returns, it will be set back by mon_arrive()  */
    if (mtmp.isshk) {
        set_residency(mtmp, (1));
    }
    if (mtmp.wormno) {
        /* if this is a long worm, handle its tail segments before mtmp itself;
       we pass possibly truncated segment count to caller via return value  */
        let cnt = count_wsegs(mtmp);
        let mx = mtmp.mx;
        let my = mtmp.my;
        /* since monst->wormno is overloaded to hold the number of
           tail segments during migration, a very long worm with
           more segments than can fit in that field gets truncated */
        num_segs = ((cnt) < (32 - 1) ? (cnt) : (32 - 1));
        wormgone(mtmp);
        /* put the head back; note: mtmp might not be on the map if this
           is happening during a failed attempt to migrate to this level */
        if (mx) {
            place_monster(mtmp, mx, my);
        }
    }
    return num_segs;
}
/* when hero leaves a level, some monsters should be placed on the
   migrating_mons list instead of being stashed inside the level's file */
export function keep_mon_accessible(mon) {
    /* the Wizard is kept accessible so that his harassment can fetch
       him instead of creating a new instance but also so that he can
       be put back at his current location if hero returns to his level */
    if (mon.iswiz) {
        return (1);
    }
    /* monsters with special attachment to a particular level only need
       to be kept accessible when on some other level */
    if (mon.mextra && ((mon.isshk && !on_level(game.u.uz, ((mon).mextra.eshk).shoplevel)) || (mon.ispriest && !on_level(game.u.uz, ((mon).mextra.epri).shrlevel)) || (mon.isgd && !on_level(game.u.uz, ((mon).mextra.egd).gdlevel)))) {
        return (1);
    }
    /* normal monsters go into the level save file instead of being held
       on the migrating_mons list for off-level accessibility */
    return (0);
}
/* called when you move to another level */
/* true for ascension or final escape */
export function keepdogs(pets_only) {
    let mtmp = null;
    let mtmp2 = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
        mtmp2 = mtmp.nmon;
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (pets_only) {
            if (!mtmp.mtame) {
                continue;
            }
            /* don't block pets from accompanying hero's dungeon
               escape or ascension simply due to mundane trifles;
               unlike level change for steed, don't bother trying
               to achieve a normal trap escape first */
            mtmp.mtrapped = 0;
            finish_meating(mtmp);
            mtmp.msleeping = 0;
            mtmp.mfrozen = 0;
            mtmp.mcanmove = 1;
        }
        if (((monnear(mtmp, game.u.ux, game.u.uy) && levl_follower(mtmp)) || (game.u.uhave.amulet && mtmp.iswiz)) && (!((mtmp).msleeping || !(mtmp).mcanmove) || (mtmp == game.u.usteed)) && !(mtmp.mstrategy & 536870912)) {
            /* the wiz will level t-port from anywhere to chase
                the amulet; if you don't have it, will chase you
                only if in range. -3. */
            /* eg if level teleport or new trap, steed has no control
                   to avoid following */
            /* monster won't follow if it hasn't noticed you yet */
            let num_segs = 0;
            let stay_behind = (0);
            if (mtmp.mtrapped) {
                mintrap(mtmp, 0);
            }
            if (mtmp == game.u.usteed) {
                /* make sure steed is eligible to accompany hero */
                mtmp.mtrapped = 0;
                mtmp.meating = 0;
                mdrop_special_objs(mtmp);
            } else if (mtmp.meating || mtmp.mtrapped) {
                if (canseemon(mtmp)) {
                    pline_mon(mtmp, "%s is still %s.", Monnam(mtmp), mtmp.meating ? "eating" : "trapped");
                }
                stay_behind = (1);
            } else if (mon_has_amulet(mtmp)) {
                if (canseemon(mtmp)) {
                    pline("%s seems very disoriented for a moment.", Monnam(mtmp));
                }
                stay_behind = (1);
            }
            if (stay_behind) {
                if (mtmp.mleashed) {
                    pline("%s leash suddenly comes loose.", (((mtmp.data).mflags1 & 131072) != 0) ? (mtmp.female ? "Her" : "His") : "Its");
                    m_unleash(mtmp, (0));
                }
                if (mtmp == game.u.usteed) {
                    /* can't happen unless someone makes a change
                       which scrambles the stay_behind logic above */
                    impossible("steed left behind?");
                    dismount_steed(DISMOUNT_GENERIC);
                }
                continue;
            }
            /* prepare to take mtmp off the map */
            num_segs = mon_leave(mtmp);
            /* take off map and move mtmp from fmon list to mydogs */
            /* mtmp->mx,my retain current value */
            relmon(mtmp, { get value() { return game.mydogs; }, set value(_v) { game.mydogs = _v; } });
            mtmp.mx = mtmp.my = 0;
            mtmp.wormno = num_segs;
            mtmp.mlstmv = game.moves;
        } else if (keep_mon_accessible(mtmp)) {
            /* we want to be able to find the Wizard when his next
               resurrection chance comes up, but have him resume his
               present location if player returns to this level before
               that time; also needed for monsters (shopkeeper, temple
               priest, vault guard) who have level data in mon->mextra
               in case #wizmakemap is used to replace their home level
               while they're away from it */
            migrate_to_level(mtmp, ledger_no(game.u.uz), 2, null);
        } else if (mtmp.mleashed) {
            /* this can happen if your quest leader ejects you from the
               "home" level while a leashed pet isn't next to you */
            pline("%s leash goes slack.", s_suffix(Monnam(mtmp)));
            m_unleash(mtmp, (0));
        }
    }
}
/* destination level */
/* MIGR_xxx destination xy location: */
/* optional destination coordinates */
export function migrate_to_level(mtmp, tolev, xyloc, cc) {
    let new_lev = { dnum: 0, dlevel: 0 };
    let xyflags = 0;
    let mx = mtmp.mx;
    let my = mtmp.my;
    let num_segs = 0;
    if (mtmp.mleashed) {
        mtmp.mtame--;
        m_unleash(mtmp, (1));
    }
    num_segs = mon_leave(mtmp);
    /* take off map and move mtmp from fmon list to migrating_mons */
    /* mtmp->mx,my retain their value */
    relmon(mtmp, { get value() { return game.migrating_mons; }, set value(_v) { game.migrating_mons = _v; } });
    mtmp.mstate |= 4;
    new_lev.dnum = ledger_to_dnum(tolev);
    new_lev.dlevel = ledger_to_dlev(tolev);
    /* overload mtmp->[mx,my], mtmp->[mux,muy], and mtmp->mtrack[] as
       destination codes */
    xyflags = (depth(new_lev) < depth(game.u.uz));
    if (In_W_tower(mx, my, game.u.uz)) {
        xyflags |= 2;
    }
    mtmp.wormno = num_segs;
    mtmp.mlstmv = game.moves;
    /* migrating from this dungeon */
    mtmp.mtrack[2].x = game.u.uz.dnum;
    /* migrating from this dungeon level */
    mtmp.mtrack[2].y = game.u.uz.dlevel;
    mtmp.mtrack[1].x = cc ? cc.x : mx;
    mtmp.mtrack[1].y = cc ? cc.y : my;
    mtmp.mtrack[0].x = xyloc;
    mtmp.mtrack[0].y = xyflags;
    mtmp.mux = new_lev.dnum;
    mtmp.muy = new_lev.dlevel;
    mtmp.mx = mtmp.my = 0;
    /* don't extinguish a mobile light; it still exists but has changed
       from local (monst->mx > 0) to global (mx==0, not on this level) */
    if ((((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
        vision_recalc(0);
    }
}
/* when entering the endgame, levels from the dungeon and its branches are
   discarded because they can't be reached again; do the same for monsters
   and objects scheduled to migrate to those levels */
export function discard_migrations() {
    let mtmp = null;
    let mprev__parent = null;
    let mprev__field = null;
    let otmp = null;
    let oprev__parent = null;
    let oprev__field = null;
    let dest = { dnum: 0, dlevel: 0 };
    for ((mprev__parent = game, mprev__field = "migrating_mons"); (mtmp = mprev__parent[mprev__field]) != null; ) {
        dest.dnum = mtmp.mux;
        dest.dlevel = mtmp.muy;
        if (mtmp.iswiz || ((dest).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
            (mprev__parent = mtmp, mprev__field = "nmon");
        } else {
            mprev__parent[mprev__field] = mtmp.nmon;
            mtmp.nmon = null;
            discard_minvent(mtmp, (0));
            /* bypass mongone() and its call to m_detach() plus dmonsfree() */
            if ((((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
                del_light_source(LS_MONSTER, monst_to_any(mtmp));
            }
            dealloc_monst(mtmp);
        }
    }
    for ((oprev__parent = game, oprev__field = "migrating_objs"); (otmp = oprev__parent[oprev__field]) != null; ) {
        /* objects get similar treatment */
        dest.dnum = otmp.ox;
        dest.dlevel = otmp.oy;
        if (((dest).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
            /* there is no special case like the Wizard (certainly not the
           Amulet; the hero has to be carrying it to enter the endgame
           which triggers the call to this routine); again we don't
           expect any objects to be migrating to the endgame but will
           keep any we find so that they could be delivered */
            /* keep otmp on migrating_objs */
            (oprev__parent = otmp, oprev__field = "nobj");
        } else {
            /* bypass obj_extract_self() */
            /* remove otmp from migrating_objs */
            oprev__parent[oprev__field] = otmp.nobj;
            otmp.nobj = null;
            otmp.where = 0;
            /* overloaded for destination usage;
                                   * obfree() will complain if nonzero */
            otmp.owornmask = 0;
            /*
             * obfree(otmp,)
             *  -> dealloc_obj(otmp)
             *      -> obj_stop_timers(otmp)
             *      -> del_light_source(LS_OBJECT, obj_to_any(otmp))
             */
            /* releases any contents too */
            obfree(otmp, null);
        }
    }
}
/* returns the quality of an item of food; the lower the better;
   fungi and ghouls will eat even tainted food */
export function dogfood(mon, obj) {
    let mptr = mon.data;
    let fptr = null;
    let carni = (((mptr).mflags1 & 536870912) != 0);
    let herbi = (((mptr).mflags1 & 1073741824) != 0);
    let starving = 0;
    let mblind = 0;
    let fx = 0;
    if (obj.otrapped && !Resists_Elem(mon, POISON_RES)) {
        return POISON;
    }
    if (is_quest_artifact(obj) || obj_resists(obj, 0, 95)) {
        return obj.cursed ? TABU : APPORT;
    }
    switch (obj.oclass) {
        case FOOD_CLASS:
            fx = (obj.otyp == CORPSE || obj.otyp == TIN || obj.otyp == EGG) ? obj.corpsenm : NON_PM;
            /* mons[NUMMONS] is a valid array entry, though not a valid monster;
         * predicate tests against it will fail */
            fptr = game.mons[(((fx) >= LOW_PM && (fx) < NUMMONS)) ? fx : NUMMONS];
            if (obj.otyp == CORPSE && ((fptr) == game.mons[PM_DEATH] || (fptr) == game.mons[PM_FAMINE] || (fptr) == game.mons[PM_PESTILENCE])) {
                return TABU;
            }
            if ((obj.otyp == CORPSE || obj.otyp == EGG) && (((fptr) == game.mons[PM_COCKATRICE] || (fptr) == game.mons[PM_CHICKATRICE]) || (fptr) == game.mons[PM_MEDUSA]) && !Resists_Elem(mon, STONE_RES)) {
                return POISON;
            }
            if (obj.otyp == LUMP_OF_ROYAL_JELLY && mon.data == game.mons[PM_KILLER_BEE]) {
                /* corpsenm might be NON_PM (special tin, unhatchable egg) */
                let mtmp = find_pmmonst(PM_QUEEN_BEE);
                /* if there's a queen bee on the level, don't eat royal jelly;
               if there isn't, do eat it and grow into a queen */
                return !mtmp ? DOGFOOD : TABU;
            }
            if (!carni && !herbi) {
                return obj.cursed ? UNDEF : APPORT;
            }
            /* a starving pet will eat almost anything */
            starving = (mon.mtame && !mon.isminion && ((mon).mextra.edog).mhpmax_penalty);
            /* even carnivores will eat carrots if they're temporarily blind */
            mblind = (!mon.mcansee && (((mon.data).mflags1 & 4096) == 0));
            if (mptr == game.mons[PM_GHOUL]) {
                /* ghouls prefer old corpses and unhatchable eggs, yum!
           they'll eat fresh non-veggy corpses and hatchable eggs
           when starving; they never eat stone-to-flesh'd meat */
                if (obj.otyp == CORPSE) {
                    return (peek_at_iced_corpse_age(obj) + 50 <= game.moves && !(fx == PM_LIZARD || fx == PM_LICHEN)) ? DOGFOOD : (starving && !((fptr).mlet == S_BLOB || (fptr).mlet == S_JELLY || (fptr).mlet == S_FUNGUS || (fptr).mlet == S_VORTEX || (fptr).mlet == S_LIGHT || ((fptr).mlet == S_ELEMENTAL && (fptr) != game.mons[PM_STALKER]) || ((fptr).mlet == S_GOLEM && (fptr) != game.mons[PM_FLESH_GOLEM] && (fptr) != game.mons[PM_LEATHER_GOLEM]) || ((fptr).mlet == S_GHOST))) ? ACCFOOD : POISON;
                }
                if (obj.otyp == EGG) {
                    return ((game.moves - (obj).age) > (2 * 200)) ? CADAVER : starving ? ACCFOOD : POISON;
                }
                return TABU;
            }
            switch (obj.otyp) {
                case TRIPE_RATION:
                case MEATBALL:
                case MEAT_RING:
                case MEAT_STICK:
                case ENORMOUS_MEATBALL:
                    return carni ? DOGFOOD : MANFOOD;
                case EGG:
                    if (obj.corpsenm == PM_PYROLISK && !((mptr) == game.mons[PM_FIRE_VORTEX] || (mptr) == game.mons[PM_FLAMING_SPHERE] || (mptr == game.mons[PM_FIRE_ELEMENTAL] || mptr == game.mons[PM_SALAMANDER]))) {
                        return POISON;
                    }
                    return carni ? CADAVER : MANFOOD;
                case CORPSE:
                    if ((peek_at_iced_corpse_age(obj) + 50 <= game.moves && !(fx == PM_LIZARD || fx == PM_LICHEN) && mptr.mlet != S_FUNGUS) || ((((fptr).mflags1 & 134217728) != 0) && !Resists_Elem(mon, ACID_RES)) || ((((fptr).mflags1 & 268435456) != 0) && !Resists_Elem(mon, POISON_RES))) {
                        return POISON;
                    } else if ((((obj).otyp == CORPSE || (obj).otyp == EGG || (obj).otyp == TIN) && (obj).corpsenm >= LOW_PM && (pm_to_cham((obj).corpsenm) != NON_PM || dmgtype(game.mons[(obj).corpsenm], 43))) && mon.mtame > 1 && !starving) {
                        return MANFOOD;
                    } else if (((fptr).mlet == S_BLOB || (fptr).mlet == S_JELLY || (fptr).mlet == S_FUNGUS || (fptr).mlet == S_VORTEX || (fptr).mlet == S_LIGHT || ((fptr).mlet == S_ELEMENTAL && (fptr) != game.mons[PM_STALKER]) || ((fptr).mlet == S_GOLEM && (fptr) != game.mons[PM_FLESH_GOLEM] && (fptr) != game.mons[PM_LEATHER_GOLEM]) || ((fptr).mlet == S_GHOST))) {
                        return herbi ? CADAVER : MANFOOD;
                    } else if ((((mptr).mflags1 & 131072) != 0) && same_race(mptr, fptr) && (!(((mptr).mflags2 & 2) != 0) && fptr.mlet != S_KOBOLD && fptr.mlet != S_ORC && fptr.mlet != S_OGRE)) {
                        return (starving && carni && !(((mptr).mflags2 & 16) != 0)) ? ACCFOOD : TABU;
                    /* avoid polymorph unless starving or abused (in which case the
               pet will consider it for a chance to become more powerful) */
                    /* most humanoids will avoid cannibalism unless starving;
               arbitrary: elves won't eat other elves even then */
                    } else {
                        return carni ? CADAVER : MANFOOD;
                    }
                /* other globs use the default case */
                case GLOB_OF_GREEN_SLIME:
                    return (starving || ((mon.data) == game.mons[PM_GREEN_SLIME] || ((mon.data) == game.mons[PM_FIRE_VORTEX] || (mon.data) == game.mons[PM_FLAMING_SPHERE] || (mon.data) == game.mons[PM_FIRE_ELEMENTAL] || (mon.data) == game.mons[PM_SALAMANDER]) || ((mon.data).mlet == S_GHOST))) ? ACCFOOD : POISON;
                case CLOVE_OF_GARLIC:
                    return ((((mptr).mflags2 & 2) != 0) || ((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) ? TABU : (herbi || starving) ? ACCFOOD : MANFOOD;
                case TIN:
                    return (((mptr).mflags1 & 2147483648) != 0) ? ACCFOOD : MANFOOD;
                case APPLE:
                    return herbi ? DOGFOOD : starving ? ACCFOOD : MANFOOD;
                case CARROT:
                    return (herbi || mblind) ? DOGFOOD : starving ? ACCFOOD : MANFOOD;
                case BANANA:
                    return (mptr.mlet == S_YETI && herbi) ? DOGFOOD : (herbi || starving) ? ACCFOOD : MANFOOD;
                default:
                    if (starving) {
                        return ACCFOOD;
                    }
                    return (obj.otyp > SLIME_MOLD) ? (carni ? ACCFOOD : MANFOOD) : (herbi ? ACCFOOD : MANFOOD);
            }
        default:
            if (obj.otyp == AMULET_OF_STRANGULATION || obj.otyp == RIN_SLOW_DIGESTION) {
                return TABU;
            }
            if (mon_hates_silver(mon) && game.objects[obj.otyp].oc_material == SILVER) {
                return TABU;
            }
            if (mptr == game.mons[PM_GELATINOUS_CUBE] && (game.objects[obj.otyp].oc_material <= WOOD)) {
                return ACCFOOD;
            }
            if ((((mptr).mflags1 & 2147483648) != 0) && (game.objects[obj.otyp].oc_material >= IRON && game.objects[obj.otyp].oc_material <= MITHRIL) && ((game.objects[obj.otyp].oc_material == IRON) || mptr != game.mons[PM_RUST_MONSTER])) {
                /* Non-rustproofed ferrous-based metals are preferred. */
                return ((game.objects[obj.otyp].oc_material == IRON) && !obj.oerodeproof) ? DOGFOOD : ACCFOOD;
            }
            if (!obj.cursed && obj.oclass != BALL_CLASS && obj.oclass != CHAIN_CLASS) {
                return APPORT;
            }
            ;
        case ROCK_CLASS:
            return UNDEF;
    }
}
/*
 * tamedog() used to return the monster, which might have changed address
 * if a new one was created in order to allocate the edog extension.
 * With the separate mextra structure added in 3.6.x it always operates
 * on the original mtmp.  It now returns TRUE if the taming succeeded.
 */
/* food or scroll/spell */
export function tamedog(mtmp, obj, givemsg) {
    let blessed_scroll = (0);
    if (obj && (obj.oclass == SCROLL_CLASS || obj.oclass == SPBOOK_CLASS)) {
        blessed_scroll = obj.blessed ? (1) : (0);
        /* the rest of this routine assumes 'obj' represents food */
        obj = (null);
    }
    /* reduce timed sleep or paralysis, leaving mtmp->mcanmove as-is
       (note: if mtmp is donning armor, this will reduce its busy time) */
    if (mtmp.mfrozen) {
        mtmp.mfrozen = Math.trunc((mtmp.mfrozen + 1) / 2);
    }
    /* end indefinite sleep; using distance==1 limits the waking to mtmp */
    if (mtmp.msleeping) {
        wake_nearto(mtmp.mx, mtmp.my, 1);
    }
    /* [different from wakeup()] */
    /* The Wiz, Medusa and the quest nemeses aren't even made peaceful. */
    if (mtmp.iswiz || mtmp.data == game.mons[PM_MEDUSA] || (mtmp.data.mflags3 & 16)) {
        return (0);
    }
    if (givemsg && !mtmp.mpeaceful && (canseemon(mtmp) || sensemon(mtmp))) {
        /* worst case, at least it'll be peaceful. */
        pline_mon(mtmp, "%s seems %s.", Monnam(mtmp), (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "really chill" : "more amiable");
        /* don't give another message below */
        givemsg = (0);
    }
    mtmp.mpeaceful = 1;
    set_malign(mtmp);
    if (game.flags.moonphase == 4 && night() && rn2(6) && obj && mtmp.data.mlet == S_DOG) {
        return (0);
    }
    /* If we cannot tame it, at least it's no longer afraid. */
    mtmp.mflee = 0;
    mtmp.mfleetim = 0;
    if (mtmp == game.u.ustuck) {
        /* make grabber let go now, whether it becomes tame or not */
        if (game.u.uswallow) {
            expels(mtmp, mtmp.data, (1));
        } else if (!((game.u.umonnum != game.u.umonster) && sticks(game.youmonst.data))) {
            unstuck(mtmp);
        }
    }
    if (mtmp.mtame && obj) {
        /* feeding it treats makes it tamer */
        let tasty = 0;
        if (mtmp.mcanmove && !mtmp.mconf && !mtmp.meating && ((tasty = dogfood(mtmp, obj)) == DOGFOOD || (tasty <= ACCFOOD && ((mtmp).mextra.edog).hungrytime <= game.moves))) {
            if (canseemon(mtmp)) {
                /* pet will "catch" and eat this thrown food */
                let big_corpse = (obj.otyp == CORPSE && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS) && game.mons[obj.corpsenm].msize > mtmp.data.msize);
                pline_mon(mtmp, "%s catches %s%s", Monnam(mtmp), the(xname(obj)), !big_corpse ? "." : ", or vice versa!");
            } else if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                pline("%s.", Tobjnam(obj, "stop"));
            }
            /* dog_eat expects a floor object */
            /* defer eating until the edog extension has been set up */
            place_object(obj, mtmp.mx, mtmp.my);
            dog_eat(mtmp, obj, mtmp.mx, mtmp.my, (0));
            /* eating might have killed it, but that doesn't matter here;
               a non-null result suppresses "miss" message for thrown
               food and also implies that the object has been deleted */
            return (1);
        } else {
            return (0);
        }
    }
    if (mtmp.mtame && mtmp.mtame < 10) {
        /* maximum tameness is 20, only reachable via eating; if already tame but
       less than 10, taming magic might make it become tamer; blessed scroll
       or skilled spell raises low tameness by 2 or 3, uncursed by 0 or 1 */
        if (mtmp.mtame < rnd(10)) {
            mtmp.mtame++;
        }
        if (blessed_scroll) {
            mtmp.mtame += 2;
            if (mtmp.mtame > 10) {
                mtmp.mtame = 10;
            }
        }
        return (0);
    }
    if (mtmp.isshk) {
        /* pacify angry shopkeeper but don't tame him/her/it/them */
        make_happy_shk(mtmp, (0));
        return (0);
    }
    if (!mtmp.mcanmove || mtmp.isshk || mtmp.isgd || mtmp.ispriest || mtmp.isminion || (((mtmp.data).mflags3 & 31)) || (((mtmp.data).mflags2 & 8) != 0) || ((((mtmp.data).mflags2 & 256) != 0) && !(((game.youmonst.data).mflags2 & 256) != 0)) || (obj && dogfood(mtmp, obj) >= MANFOOD)) {
        return (0);
    }
    /* monsters with conflicting structures cannot be tamed
           [note: the various mextra structures don't actually conflict
           with each other anymore] */
    if (mtmp.m_id == game.quest_status.leader_m_id) {
        return (0);
    }
    if (!((mtmp).mextra && ((mtmp).mextra.edog))) {
        newedog(mtmp);
        initedog(mtmp, (1));
    } else {
        initedog(mtmp, (0));
    }
    if (obj) {
        place_object(obj, mtmp.mx, mtmp.my);
        /* devour the food (might grow into larger, genocided monster) */
        if (dog_eat(mtmp, obj, mtmp.mx, mtmp.my, (1)) == 2) {
            return (1);
        }
    }
    if (givemsg && (canseemon(mtmp) || sensemon(mtmp))) {
        pline_mon(mtmp, "%s seems quite %s.", Monnam(mtmp), (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? "approachable" : "friendly");
    }
    newsym(mtmp.mx, mtmp.my);
    if (mtmp.wormno) {
        redraw_worm(mtmp);
    }
    if (attacktype(mtmp.data, 254)) {
        mtmp.weapon_check = NEED_HTH_WEAPON;
        mon_wield_item(mtmp);
    }
    return (1);
}
/*
 * Called during pet revival or pet life-saving.
 * If you killed the pet, it revives wild.
 * If you abused the pet a lot while alive, it revives wild.
 * If you abused the pet at all while alive, it revives untame.
 * If the pet wasn't abused and was very tame, it might revive tame.
 */
export function wary_dog(mtmp, was_dead) {
    let edog = null;
    let quietly = was_dead;
    finish_meating(mtmp);
    if (!mtmp.mtame) {
        return;
    }
    edog = !mtmp.isminion ? ((mtmp).mextra.edog) : null;
    if (edog && edog.mhpmax_penalty) {
        /* if monster was starving when it died, undo that now */
        mtmp.mhpmax += edog.mhpmax_penalty;
        mtmp.mhp += edog.mhpmax_penalty;
        edog.mhpmax_penalty = 0;
    }
    if (edog && (edog.killed_by_u == 1 || edog.abuse > 2)) {
        mtmp.mpeaceful = mtmp.mtame = 0;
        if (edog.abuse >= 0 && edog.abuse < 10) {
            if (!rn2(edog.abuse + 1)) {
                mtmp.mpeaceful = 1;
            }
        }
        if (!quietly && ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
            if ((((game.youmonst.data).mflags1 & 4096) == 0)) {
                if ((((mtmp.data).mflags1 & 4096) == 0)) {
                    pline_mon(mtmp, "%s %s to look you in the %s.", Monnam(mtmp), mtmp.mpeaceful ? "seems unable" : "refuses", body_part(EYE));
                } else {
                    pline_mon(mtmp, "%s avoids your gaze.", Monnam(mtmp));
                }
            }
        }
    } else {
        /* chance it goes wild anyway - Pet Sematary */
        mtmp.mtame = rn2(mtmp.mtame + 1);
        if (!mtmp.mtame) {
            mtmp.mpeaceful = rn2(2);
        }
    }
    if (!mtmp.mtame) {
        if (!quietly && (canseemon(mtmp) || sensemon(mtmp))) {
            pline_mon(mtmp, "%s %s.", Monnam(mtmp), mtmp.mpeaceful ? "is no longer tame" : "has become feral");
        }
        newsym(mtmp.mx, mtmp.my);
        /* a life-saved monster might be leashed;
           don't leave it that way if it's no longer tame */
        if (mtmp.mleashed) {
            m_unleash(mtmp, (1));
        }
        if (mtmp == game.u.usteed) {
            dismount_steed(DISMOUNT_THROWN);
        }
    } else if (edog) {
        /* it's still a pet; start a clean pet-slate now */
        edog.revivals++;
        edog.killed_by_u = 0;
        edog.abuse = 0;
        edog.ogoal.x = edog.ogoal.y = -1;
        if (was_dead || edog.hungrytime < game.moves + 500) {
            edog.hungrytime = game.moves + 500;
        }
        if (was_dead) {
            edog.droptime = 0;
            edog.dropdist = 10000;
            edog.whistletime = 0;
            edog.apport = 5;
        }
    }
}
export function abuse_dog(mtmp) {
    if (!mtmp.mtame) {
        return;
    }
    if ((game.u.uprops[AGGRAVATE_MONSTER].intrinsic || game.u.uprops[AGGRAVATE_MONSTER].extrinsic) || (game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) {
        mtmp.mtame = Math.trunc(mtmp.mtame / 2);
    } else {
        mtmp.mtame--;
    }
    if (mtmp.mtame && !mtmp.isminion) {
        ((mtmp).mextra.edog).abuse++;
    }
    if (!mtmp.mtame && mtmp.mleashed) {
        m_unleash(mtmp, (1));
    }
    if (mtmp.mx != 0) {
        if (mtmp.mtame && rn2(mtmp.mtame)) {
            yelp(mtmp);
        /* don't make a sound if pet is in the middle of leaving the level */
        /* newsym isn't necessary in this case either */
        /* give them a moment's worry */
        } else {
            growl(mtmp);
        }
        if (!mtmp.mtame) {
            newsym(mtmp.mx, mtmp.my);
            if (mtmp.wormno) {
                redraw_worm(mtmp);
            }
        }
    }
}
/*dog.c*/
/* turning into slime is preferable to starvation */
/* monkeys and apes (tamable) plus sasquatch prefer these,
               yetis will only will only eat them if starving */
/* else lifesaved, so retain current values */
