/* NetHack 5.0	mplayer.c	$NHDT-Date: 1596498188 2020/08/03 23:43:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.30 $ */
/*      Copyright (c) Izchak Miller, 1992.                        */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { verbalize } from '../c2js-runtime/pline.js';
import { strcat, strcmp, strcpy, strlen, strncmp } from '../c2js-runtime/string.js';
import { is_art, mk_artifact } from './artifact.js';
import { rank_of } from './botl.js';
import { cg } from './decl.js';
import { christen_monst } from './do_name.js';
import { makemon, mkmonmoney, mongets, set_malign } from './makemon.js';
import { bless, curse, mkobj, mksobj, weight } from './mkobj.js';
import { set_mon_data } from './mondata.js';
import { rnd_defensive_item, rnd_misc_item, rnd_offensive_item } from './muse.js';
import { ART_MAGICBANE, ATHAME, BATTLE_AXE, BLACK_DRAGON_SCALE_MAIL, BULLWHIP, CHAIN_MAIL, CLOAK_OF_DISPLACEMENT, CLOAK_OF_MAGIC_RESISTANCE, CLUB, DILITHIUM_CRYSTAL, ELVEN_DAGGER, ELVEN_LEATHER_HELM, ELVEN_SHIELD, FAKE_AMULET_OF_YENDOR, GAUNTLETS_OF_DEXTERITY, GAUNTLETS_OF_POWER, GRAY_DRAGON_SCALE_MAIL, HELM_OF_BRILLIANCE, HELM_OF_TELEPATHY, JADE, KATANA, LEATHER_GLOVES, LEVITATION_BOOTS, LOADSTONE, LONG_SWORD, LOW_BOOTS, LUCKSTONE, MACE, OILSKIN_CLOAK, ORCISH_DAGGER, PLATE_MAIL, PM_ARCHEOLOGIST, PM_BARBARIAN, PM_CAVE_DWELLER, PM_CLERIC, PM_HEALER, PM_KNIGHT, PM_MONK, PM_RANGER, PM_ROGUE, PM_SAMURAI, PM_TOURIST, PM_VALKYRIE, PM_WIZARD, P_SPEAR, QUARTERSTAFF, RANDOM_CLASS, ROBE, SCALPEL, SHIELD_OF_REFLECTION, SHORT_SWORD, SHURIKEN, SILVER_DRAGON_SCALE_MAIL, SPEAR, STRANGE_OBJECT, TWO_HANDED_SWORD, UNICORN_HORN, WAR_HAMMER, WEAPON_CLASS, YELLOW_DRAGON_SCALE_MAIL } from './nh-constants.js';
import { rnd_class } from './objnam.js';
import { d, rn2, rnd } from './rnd.js';
import { mpickobj } from './steal.js';
import { goodpos, rloc } from './teleport.js';
import { monmightthrowwep } from './weapon.js';
import { m_dowear } from './worn.js';

/* These are the names of those who
 * contributed to the development of NetHack 3.2/3.3/3.4/3.6.
 *
 * Keep in alphabetical order within teams.
 * Same first name is entered once within each team.
 */
const developers = ["Alex", "Dave", "Dean", "Derek", "Eric", "Izchak", "Janet", "Jessie", "Ken", "Kevin", "Michael", "Mike", "Pasi", "Pat", "Patric", "Paul", "Sean", "Steve", "Timo", "Warwick", "Bill", "Eric", "Keizo", "Ken", "Kevin", "Michael", "Mike", "Paul", "Stephen", "Steve", "Timo", "Yitzhak", "Andy", "Gregg", "Janne", "Keni", "Mike", "Olaf", "Richard", "Andy", "Chris", "Dean", "Jon", "Jonathan", "Kevin", "Wang", "Eric", "Marvin", "Warwick", "Alex", "Dion", "Michael", "Helge", "Ron", "Timo", "Joshua", "Pat", ""];
/* devteam */
/* PC team */
/* Amiga team */
/* Mac team */
/* Atari team */
/* NT team */
/* OS/2 team */
/* VMS team */
/* return a randomly chosen developer name */
export function dev_name() {
    let i = 0;
    let m = 0;
    let n = (Math.trunc(58 /* sizeof(const char *const [58]) */ / 1 /* sizeof(const char *const) */));
    let mtmp = null;
    let match = 0;
    do {
        match = (0);
        i = rn2(n);
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (!(((mtmp.data).pmidx >= PM_ARCHEOLOGIST) && ((mtmp.data).pmidx <= PM_WIZARD))) {
                continue;
            }
            if (!strncmp(developers[i], (((mtmp).mextra && ((mtmp).mextra.mgivenname))) ? ((mtmp).mextra.mgivenname) : "", strlen(developers[i]))) {
                match = (1);
                break;
            }
        }
        m++;
    } while (match && m < 100);
    if (match) {
        return null;
    }
    return (developers[i]);
}
export function get_mplname(mtmp, nam) {
    let fmlkind = (((mtmp.data).mflags2 & 131072) != 0);
    let devnam = null;
    devnam = dev_name();
    if (!devnam) {
        nam = strcpy(nam, fmlkind ? "Eve" : "Adam");
    } else if (fmlkind && !!strcmp(devnam, "Janet")) {
        nam = strcpy(nam, rn2(2) ? "Maud" : "Eve");
    } else {
        nam = strcpy(nam, devnam);
    }
    if (fmlkind || !strcmp(nam, "Janet")) {
        mtmp.female = 1;
    } else {
        mtmp.female = 0;
    }
    nam = strcat(nam, " the ");
    nam = strcat(nam, rank_of(mtmp.m_lev, ((mtmp.data).pmidx), mtmp.female));
}
export function mk_mplayer_armor(mon, typ) {
    let obj = null;
    if (typ == STRANGE_OBJECT) {
        return;
    }
    obj = mksobj(typ, (0), (0));
    obj.oeroded = obj.oeroded2 = 0;
    if (!rn2(3)) {
        obj.oerodeproof = 1;
    }
    if (!rn2(3)) {
        curse(obj);
    }
    if (!rn2(3)) {
        bless(obj);
    }
    /* Most players who get to the endgame who have cursed equipment
     * have it because the wizard or other monsters cursed it, so its
     * chances of having plusses is the same as usual....
     */
    obj.spe = rn2(10) ? (rn2(3) ? rn2(5) : (rn2(4) + (4))) : -rnd(3);
    mpickobj(mon, obj);
}
export function mk_mplayer(ptr, x, y, special) {
    let mtmp = null;
    let nam = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (!(((ptr).pmidx >= PM_ARCHEOLOGIST) && ((ptr).pmidx <= PM_WIZARD))) {
        return (null);
    }
    if ((game.level.monsters[x][y] != null)) {
        rloc((game.level.monsters[x][y]), 1 | 4);
    }
    if (!((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        special = (0);
    }
    if ((mtmp = makemon(ptr, x, y, special ? 131072 : 0)) != null) {
        let weapon = 0;
        let armor = 0;
        let cloak = 0;
        let helm = 0;
        let shield = 0;
        let quan = 0;
        let otmp = null;
        mtmp.m_lev = (special ? (rn2(16) + (15)) : rnd(16));
        mtmp.mhp = mtmp.mhpmax = d(mtmp.m_lev, 10) + (special ? (30 + rnd(30)) : 30);
        if (special) {
            get_mplname(mtmp, nam);
            mtmp = christen_monst(mtmp, nam);
            /* that's why they are "stuck" in the endgame :-) */
            mongets(mtmp, FAKE_AMULET_OF_YENDOR);
        }
        mtmp.mpeaceful = 0;
        /* peaceful may have changed again */
        set_malign(mtmp);
        /* default equipment; much of it will be overridden below */
        weapon = !rn2(2) ? LONG_SWORD : rnd_class(SPEAR, BULLWHIP);
        armor = rnd_class(GRAY_DRAGON_SCALE_MAIL, YELLOW_DRAGON_SCALE_MAIL);
        cloak = !rn2(8) ? STRANGE_OBJECT : rnd_class(OILSKIN_CLOAK, CLOAK_OF_DISPLACEMENT);
        helm = !rn2(8) ? STRANGE_OBJECT : rnd_class(ELVEN_LEATHER_HELM, HELM_OF_TELEPATHY);
        shield = !rn2(8) ? STRANGE_OBJECT : rnd_class(ELVEN_SHIELD, SHIELD_OF_REFLECTION);
        switch (((ptr).pmidx)) {
            case PM_ARCHEOLOGIST:
                if (rn2(2)) {
                    weapon = BULLWHIP;
                }
                break;
            case PM_BARBARIAN:
                if (rn2(2)) {
                    weapon = rn2(2) ? TWO_HANDED_SWORD : BATTLE_AXE;
                    shield = STRANGE_OBJECT;
                }
                if (rn2(2)) {
                    armor = rnd_class(PLATE_MAIL, CHAIN_MAIL);
                }
                if (helm == HELM_OF_BRILLIANCE) {
                    helm = STRANGE_OBJECT;
                }
                break;
            case PM_CAVE_DWELLER:
                if (rn2(4)) {
                    weapon = MACE;
                } else if (rn2(2)) {
                    weapon = CLUB;
                }
                if (helm == HELM_OF_BRILLIANCE) {
                    helm = STRANGE_OBJECT;
                }
                break;
            case PM_HEALER:
                if (rn2(4)) {
                    weapon = QUARTERSTAFF;
                } else if (rn2(2)) {
                    weapon = rn2(2) ? UNICORN_HORN : SCALPEL;
                }
                if (rn2(4)) {
                    helm = rn2(2) ? HELM_OF_BRILLIANCE : HELM_OF_TELEPATHY;
                }
                if (rn2(2)) {
                    shield = STRANGE_OBJECT;
                }
                break;
            case PM_KNIGHT:
                if (rn2(4)) {
                    weapon = LONG_SWORD;
                }
                if (rn2(2)) {
                    armor = rnd_class(PLATE_MAIL, CHAIN_MAIL);
                }
                break;
            case PM_MONK:
                weapon = !rn2(3) ? SHURIKEN : STRANGE_OBJECT;
                armor = STRANGE_OBJECT;
                cloak = ROBE;
                if (rn2(2)) {
                    shield = STRANGE_OBJECT;
                }
                break;
            case PM_CLERIC:
                if (rn2(2)) {
                    weapon = MACE;
                }
                if (rn2(2)) {
                    armor = rnd_class(PLATE_MAIL, CHAIN_MAIL);
                }
                if (rn2(4)) {
                    cloak = ROBE;
                }
                if (rn2(4)) {
                    helm = rn2(2) ? HELM_OF_BRILLIANCE : HELM_OF_TELEPATHY;
                }
                if (rn2(2)) {
                    shield = STRANGE_OBJECT;
                }
                break;
            case PM_RANGER:
                if (rn2(2)) {
                    weapon = ELVEN_DAGGER;
                }
                break;
            case PM_ROGUE:
                if (rn2(2)) {
                    weapon = rn2(2) ? SHORT_SWORD : ORCISH_DAGGER;
                }
                break;
            case PM_SAMURAI:
                if (rn2(2)) {
                    weapon = KATANA;
                }
                break;
            case PM_TOURIST:
                break;
            case PM_VALKYRIE:
                if (rn2(2)) {
                    weapon = WAR_HAMMER;
                }
                if (rn2(2)) {
                    armor = rnd_class(PLATE_MAIL, CHAIN_MAIL);
                }
                break;
            case PM_WIZARD:
                if (rn2(4)) {
                    weapon = rn2(2) ? QUARTERSTAFF : ATHAME;
                }
                if (rn2(2)) {
                    armor = rn2(2) ? BLACK_DRAGON_SCALE_MAIL : SILVER_DRAGON_SCALE_MAIL;
                    cloak = CLOAK_OF_MAGIC_RESISTANCE;
                }
                if (rn2(4)) {
                    helm = HELM_OF_BRILLIANCE;
                }
                shield = STRANGE_OBJECT;
                break;
            default:
                impossible("bad mplayer monster");
                weapon = 0;
                break;
        }
        if (weapon != STRANGE_OBJECT) {
            otmp = mksobj(weapon, (1), (0));
            otmp.oeroded = otmp.oeroded2 = 0;
            otmp.spe = (special ? (rn2(5) + (4)) : rn2(4));
            if (!rn2(3)) {
                otmp.oerodeproof = 1;
            } else if (!rn2(2)) {
                otmp.greased = 1;
            }
            /* mk_artifact() with otmp and A_NONE will never return NULL */
            if (special && rn2(2)) {
                otmp = mk_artifact(otmp, (-128), 99, (0));
            }
            /* usually increase stack size if stackable weapon */
            if (game.objects[otmp.otyp].oc_merge && !otmp.oartifact && monmightthrowwep(otmp)) {
                otmp.quan += rn2((otmp.oclass == WEAPON_CLASS && game.objects[otmp.otyp].oc_subtyp == P_SPEAR) ? 4 : 8);
            }
            otmp.owt = weight(otmp);
            /* mplayers knew better than to overenchant Magicbane */
            if (is_art(otmp, ART_MAGICBANE)) {
                otmp.spe = rnd(4);
            }
            mpickobj(mtmp, otmp);
        }
        if (special) {
            if (!rn2(10)) {
                mongets(mtmp, rn2(3) ? LUCKSTONE : LOADSTONE);
            }
            mk_mplayer_armor(mtmp, armor);
            mk_mplayer_armor(mtmp, cloak);
            mk_mplayer_armor(mtmp, helm);
            mk_mplayer_armor(mtmp, shield);
            /* valkyrie: wimpy weapon or Mjollnir */
            if (weapon == WAR_HAMMER) {
                mk_mplayer_armor(mtmp, GAUNTLETS_OF_POWER);
            } else if (rn2(8)) {
                mk_mplayer_armor(mtmp, rnd_class(LEATHER_GLOVES, GAUNTLETS_OF_DEXTERITY));
            }
            if (rn2(8)) {
                mk_mplayer_armor(mtmp, rnd_class(LOW_BOOTS, LEVITATION_BOOTS));
            }
            m_dowear(mtmp, (1));
            quan = rn2(3) ? rn2(3) : rn2(16);
            while (quan--) {
                mongets(mtmp, rnd_class(DILITHIUM_CRYSTAL, JADE));
            }
            /* To get the gold "right" would mean a player can double his
               gold supply by killing one mplayer.  Not good. */
            mkmonmoney(mtmp, rn2(1000));
            quan = rn2(10);
            while (quan--) {
                mpickobj(mtmp, mkobj(RANDOM_CLASS, (0)));
            }
        }
        quan = rnd(3);
        while (quan--) {
            mongets(mtmp, rnd_offensive_item(mtmp));
        }
        quan = rnd(3);
        while (quan--) {
            mongets(mtmp, rnd_defensive_item(mtmp));
        }
        quan = rnd(3);
        while (quan--) {
            mongets(mtmp, rnd_misc_item(mtmp));
        }
    }
    return (mtmp);
}
/* create the indicated number (num) of monster-players,
 * randomly chosen, and in randomly chosen (free) locations
 * on the level.  If "special", the size of num should not
 * be bigger than the number of _non-repeated_ names in the
 * developers array, otherwise a bunch of Adams and Eves will
 * fill up the overflow.
 */
export function create_mplayers(num, special) {
    let pm = 0;
    let x = 0;
    let y = 0;
    let fakemon = { nmon: null, data: null, m_id: 0, mnum: 0, cham: 0, movement: 0, m_lev: 0, malign: 0, mx: 0, my: 0, mux: 0, muy: 0, mtrack: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], mhp: 0, mhpmax: 0, mappearance: 0, m_ap_type: 0, mtame: 0, mintrinsics: 0, mextrinsics: 0, seen_resistance: 0, mspec_used: 0, female: 0, minvis: 0, invis_blkd: 0, perminvis: 0, mcan: 0, mburied: 0, mundetected: 0, mcansee: 0, mspeed: 0, permspeed: 0, mrevived: 0, mcloned: 0, mavenge: 0, mflee: 0, mfleetim: 0, msleeping: 0, mblinded: 0, mstun: 0, mfrozen: 0, mcanmove: 0, mconf: 0, mpeaceful: 0, mtrapped: 0, mleashed: 0, isshk: 0, isminion: 0, isgd: 0, ispriest: 0, iswiz: 0, wormno: 0, mtemplit: 0, meverseen: 0, mspotted: 0, mwandexp: 0, mgenmklev: 0, mstrategy: 0, mgoal: { x: 0, y: 0 }, mtrapseen: 0, mlstmv: 0, mstate: 0, migflags: 0, mspare1: 0, minvent: null, mw: null, misc_worn_check: 0, weapon_check: 0, meating: 0, mextra: null };
    Object.assign(fakemon, cg.zeromonst);
    while (num) {
        let tryct = 0;
        /* roll for character class */
        pm = (rn2(PM_WIZARD - PM_ARCHEOLOGIST + 1) + (PM_ARCHEOLOGIST));
        set_mon_data(fakemon, game.mons[pm]);
        /* roll for an available location */
        do {
            x = (rn2(80 - 4) + (2));
            y = rnd(21 - 2);
        } while (!goodpos(x, y, fakemon, 0) && tryct++ <= 50);
        /* if pos not found in 50 tries, don't bother to continue */
        if (tryct > 50) {
            return;
        }
        mk_mplayer(game.mons[pm], x, y, special);
        num--;
    }
}
const __mplayer_talk_same_class_msg = ["I can't win, and neither will you!", "You don't deserve to win!", "Mine should be the honor, not yours!"];
const __mplayer_talk_other_class_msg = ["The low-life wants to talk, eh?", "Fight, scum!", "Here is what I have to say!"];
export function mplayer_talk(mtmp) {
    if (mtmp.mpeaceful) {
        return;
    }
    ;
    /* will drop to humanoid talk */
    verbalize("Talk? -- %s", mtmp.data == game.mons[game.urole.mnum] ? __mplayer_talk_same_class_msg[rn2(3)] : __mplayer_talk_other_class_msg[rn2(3)]);
}
/*mplayer.c*/
