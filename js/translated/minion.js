/* NetHack 5.0	minion.c	$NHDT-Date: 1762727599 2025/11/09 14:33:19 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.81 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2008. */
/* NetHack may be freely redistributed.  See license for details. */
/* used to pick among the four basic elementals without worrying whether
   they've been reordered (difficulty reassessment?) or any new ones have
   been introduced (hybrid types added to 'E'-class?) */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_feel, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { stop_occupation } from './allmain.js';
import { is_art } from './artifact.js';
import { acurr } from './attrib.js';
import { canseemon, newsym, sensemon } from './display.js';
import { Amonnam, Monnam, mon_nam, x_monnam } from './do_name.js';
import { In_hell } from './dungeon.js';
import { Hear_again, is_fainted, reset_faint } from './eat.js';
import { money_cnt, nomul, unmul } from './hack.js';
import { s_suffix } from './hacklib.js';
import { currency } from './invent.js';
import { show_transient_light, transient_light_cleanup } from './light.js';
import { makemon, mkclass, mkclass_aligned, mongets, newmextra, set_malign } from './makemon.js';
import { bless, mksobj } from './mkobj.js';
import { mongone } from './mon.js';
import { msummon_environ } from './mondata.js';
import { AMULET_OF_REFLECTION, ART_DEMONBANE, ART_EXCALIBUR, A_CHA, BLINDED, CONFLICT, DEAF, NON_PM, PM_AIR_ELEMENTAL, PM_ALIGNED_CLERIC, PM_ANGEL, PM_ARCHON, PM_BONE_DEVIL, PM_DEMOGORGON, PM_EARTH_ELEMENTAL, PM_FIRE_ELEMENTAL, PM_GUARD, PM_HIGH_CLERIC, PM_JUIBLEX, PM_ORCUS, PM_SHOPKEEPER, PM_SKELETON, PM_WATER_ELEMENTAL, PM_WIZARD_OF_YENDOR, PM_YEENOGHU, SHIELD_OF_REFLECTION, SILVER_SABER, S_ANGEL, S_DEMON } from './nh-constants.js';
import { livelog_printf } from './pline.js';
import { align_gname } from './pray.js';
import { mk_roamer, mon_aligntyp } from './priest.js';
import { d, rn2, rnd } from './rnd.js';
import { money2mon } from './shk.js';
import { mpickobj } from './steal.js';
import { enexto, rloc, tele_restrict } from './teleport.js';
import { select_hwep } from './weapon.js';
import { getlin } from './windows.js';
import { mon_has_amulet } from './wizard.js';
import { m_dowear, which_armor } from './worn.js';

const elementals = [PM_AIR_ELEMENTAL, PM_FIRE_ELEMENTAL, PM_EARTH_ELEMENTAL, PM_WATER_ELEMENTAL];
export function newemin(mtmp) {
    if (!mtmp.mextra) {
        mtmp.mextra = newmextra();
    }
    if (!((mtmp).mextra.emin)) {
        ((mtmp).mextra.emin) = alloc(1 /* sizeof(struct emin) */);
        memset(((mtmp).mextra.emin), 0, 1 /* sizeof(struct emin) */);
        ((mtmp).mextra.emin).parentmid = mtmp.m_id;
    }
}
export function free_emin(mtmp) {
    if (mtmp.mextra && ((mtmp).mextra.emin)) {
        free(((mtmp).mextra.emin));
        ((mtmp).mextra.emin) = null;
    }
    mtmp.isminion = 0;
}
/* count the number of monsters on the level */
/* seen|sensed vs all */
export function monster_census(spotted) {
    let mtmp = null;
    let count = 0;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (mtmp.isgd && mtmp.mx == 0) {
            continue;
        }
        if (spotted && !(canseemon(mtmp) || sensemon(mtmp))) {
            continue;
        }
        ++count;
    }
    return count;
}
/* mon summons a monster */
export async function msummon(mon) {
    let ptr = null;
    let dtype = NON_PM;
    let cnt = 0;
    let result = 0;
    let census = 0;
    let xlight = 0;
    let atyp = 0;
    let mtmp = null;
    if (mon) {
        ptr = mon.data;
        if (is_art(game.uwep, ART_DEMONBANE) && (((ptr).mflags2 & 256) != 0)) {
            if (canseemon(mon)) {
                await pline("%s looks puzzled for a moment.", await Monnam(mon));
            }
            return 0;
        }
        atyp = mon.ispriest ? ((mon).mextra.epri).shralign : mon.isminion ? ((mon).mextra.emin).min_align : (ptr.maligntyp == (-128)) ? (-128) : sgn(ptr.maligntyp);
    } else {
        ptr = game.mons[PM_WIZARD_OF_YENDOR];
        atyp = (ptr.maligntyp == (-128)) ? (-128) : sgn(ptr.maligntyp);
    }
    if (((((ptr).mflags2 & 256) != 0) && (((ptr).mflags2 & 2048) != 0)) || (ptr == game.mons[PM_WIZARD_OF_YENDOR])) {
        dtype = (!rn2(20)) ? await dprince(atyp) : (!rn2(4)) ? await dlord(atyp) : await ndemon(atyp);
        cnt = ((dtype != NON_PM) && !rn2(4) && ((((game.mons[dtype]).mflags2 & 256) != 0) && (((game.mons[dtype]).mflags2 & (1024 | 2048)) == 0))) ? 2 : 1;
    } else if (((((ptr).mflags2 & 256) != 0) && (((ptr).mflags2 & 1024) != 0))) {
        dtype = (!rn2(50)) ? await dprince(atyp) : (!rn2(20)) ? await dlord(atyp) : await ndemon(atyp);
        cnt = ((dtype != NON_PM) && !rn2(4) && ((((game.mons[dtype]).mflags2 & 256) != 0) && (((game.mons[dtype]).mflags2 & (1024 | 2048)) == 0))) ? 2 : 1;
    } else if (ptr == game.mons[PM_BONE_DEVIL]) {
        dtype = PM_SKELETON;
        cnt = 1;
    } else if (((((ptr).mflags2 & 256) != 0) && (((ptr).mflags2 & (1024 | 2048)) == 0))) {
        dtype = (!rn2(20)) ? await dlord(atyp) : (!rn2(6)) ? await ndemon(atyp) : ((ptr).pmidx);
        cnt = 1;
    } else if ((((((mon).data).mflags2 & 4096) != 0) && mon_aligntyp(mon) == 1)) {
        dtype = ((((ptr).mflags2 & 1024) != 0) && !rn2(20)) ? await llord() : ((((ptr).mflags2 & 1024) != 0) || !rn2(6)) ? await lminion() : ((ptr).pmidx);
        cnt = ((dtype != NON_PM) && !rn2(4) && !(((game.mons[dtype]).mflags2 & 1024) != 0)) ? 2 : 1;
    } else if (ptr == game.mons[PM_ANGEL]) {
        if (!rn2(6)) {
            switch (atyp) {
                /* non-lawful angels can also summon */
                case 0:
                    dtype = elementals[rn2((Math.trunc(16 /* sizeof(const int [4]) */ / 4 /* sizeof(const int) */)))];
                    break;
                case (-1):
                case (-128):
                    dtype = await ndemon(atyp);
                    break;
            }
        } else {
            dtype = PM_ANGEL;
        }
        cnt = ((dtype != NON_PM) && !rn2(4) && !(((game.mons[dtype]).mflags2 & 1024) != 0)) ? 2 : 1;
    }
    if (dtype == NON_PM) {
        return 0;
    }
    if (cnt > 1 && (game.mons[dtype].geno & 4096) != 0) {
        cnt = 1;
    }
    if ((game.mvitals[dtype].mvflags & (2 | 1)) != 0) {
        dtype = await ndemon(atyp);
        if (dtype == NON_PM) {
            return 0;
        }
    }
    /* some candidates can generate a group of monsters, so simple
       count of non-null makemon() result is not sufficient */
    census = monster_census((0));
    xlight = (0);
    while (cnt > 0) {
        mtmp = await makemon(game.mons[dtype], game.u.ux, game.u.uy, 1024 | 131072);
        if (mtmp) {
            result++;
            if (dtype == PM_ANGEL) {
                /* an angel's alignment should match the summoner */
                mtmp.isminion = 1;
                ((mtmp).mextra.emin).min_align = atyp;
                ((mtmp).mextra.emin).renegade = (atyp != game.u.ualign.type) ^ !mtmp.mpeaceful;
            }
            if (mtmp.data.mlet == S_ANGEL && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await show_transient_light(null, mtmp.mx, mtmp.my);
                /* we don't do this for 'burst of flame' (fire elemental)
                   because those monsters become their own light source */
                xlight = (1);
            }
            if (cnt == 1 && canseemon(mtmp)) {
                let cloud = null;
                let what = msummon_environ(mtmp.data, { get value() { return cloud; }, set value(_v) { cloud = _v; } });
                await pline("%s appears in a %s of %s!", await Amonnam(mtmp), cloud, what);
            }
        }
        cnt--;
    }
    if (xlight) {
        await transient_light_cleanup();
    }
    /* how many monsters exist now compared to before? */
    if (result) {
        result = monster_census((0)) - census;
    }
    return result;
}
export async function summon_minion(alignment, talk) {
    let mon = null;
    let mnum = 0;
    switch (alignment) {
        case 1:
            mnum = await lminion();
            break;
        case 0:
            mnum = elementals[rn2((Math.trunc(16 /* sizeof(const int [4]) */ / 4 /* sizeof(const int) */)))];
            break;
        case (-1):
        case (-128):
            mnum = await ndemon(alignment);
            break;
        default:
            await impossible("unaligned player?");
            mnum = await ndemon((-128));
            break;
    }
    if (mnum == NON_PM) {
        mon = null;
    } else if (mnum == PM_ANGEL) {
        mon = await makemon(game.mons[mnum], game.u.ux, game.u.uy, 1024 | 131072);
        if (mon) {
            mon.isminion = 1;
            ((mon).mextra.emin).min_align = alignment;
            ((mon).mextra.emin).renegade = (0);
        }
    } else if (mnum != PM_SHOPKEEPER && mnum != PM_GUARD && mnum != PM_ALIGNED_CLERIC && mnum != PM_HIGH_CLERIC) {
        mon = await makemon(game.mons[mnum], game.u.ux, game.u.uy, 1024 | 131072);
        if (mon) {
            mon.isminion = 1;
            ((mon).mextra.emin).min_align = alignment;
            ((mon).mextra.emin).renegade = (0);
        }
    } else {
        mon = await makemon(game.mons[mnum], game.u.ux, game.u.uy, 131072);
    }
    if (mon) {
        if (talk) {
            /* Won't blackmail their own. */
            /* 125: 5*25 in case hero has maximum possible charisma */
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                await pline_The("voice of %s booms:", await align_gname(alignment));
            } else {
                await You_feel("%s booming voice:", s_suffix(await align_gname(alignment)));
            }
            ;
            await verbalize("Thou shalt pay for thine indiscretion!");
            if ((canseemon(mon) || sensemon(mon))) {
                await pline("%s appears before you.", await Amonnam(mon));
            }
            mon.mstrategy &= ~2147483648;
        }
        /* don't call set_malign(); player was naughty */
        mon.mpeaceful = (0);
    }
}
/* returns 1 if it won't attack. */
export async function demon_talk(mtmp) {
    let cash = 0;
    let demand = 0;
    let offer = 0;
    if (is_art(game.uwep, ART_EXCALIBUR) || is_art(game.uwep, ART_DEMONBANE)) {
        if ((canseemon(mtmp) || sensemon(mtmp))) {
            await pline("%s looks very angry.", await Amonnam(mtmp));
        } else {
            await You_feel("tension building.");
        }
        mtmp.mpeaceful = mtmp.mtame = 0;
        set_malign(mtmp);
        await newsym(mtmp.mx, mtmp.my);
        return 0;
    }
    if (is_fainted()) {
        await reset_faint();
    } else {
        await stop_occupation();
        if (game.multi > 0) {
            nomul(0);
            await unmul(null);
        }
    }
    if (((((mtmp.data).mflags2 & 256) != 0) && (((mtmp.data).mflags2 & 2048) != 0)) && mtmp.minvis) {
        let wasunseen = !(canseemon(mtmp) || sensemon(mtmp));
        mtmp.minvis = mtmp.perminvis = 0;
        if (wasunseen && (canseemon(mtmp) || sensemon(mtmp))) {
            await pline("%s appears before you.", await Amonnam(mtmp));
            mtmp.mstrategy &= ~2147483648;
        }
        await newsym(mtmp.mx, mtmp.my);
    }
    if (game.youmonst.data.mlet == S_DEMON) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await pline("%s says, \"Good hunting, %s.\"", await Amonnam(mtmp), game.flags.female ? "Sister" : "Brother");
        } else if (canseemon(mtmp)) {
            await pline("%s says something.", await Amonnam(mtmp));
        }
        if (!await tele_restrict(mtmp)) {
            await rloc(mtmp, 2);
        }
        return 1;
    }
    cash = money_cnt(game.invent);
    demand = Math.trunc((cash * (rnd(80) + 20 * (In_hell(game.u.uz) && (mtmp.cham == NON_PM)))) / (100 * (1 + (sgn(game.u.ualign.type) == sgn(mtmp.data.maligntyp)))));
    if (!demand || game.multi < 0) {
        /* you have no gold or can't move */
        mtmp.mpeaceful = 0;
        set_malign(mtmp);
        return 0;
    } else {
        /* make sure that the demand is unmeetable if the monster
           has the Amulet, preventing monster from being satisfied
           and removed from the game (along with said Amulet...) */
        /* [actually the Amulet is safe; it would be dropped when
           mongone() gets rid of the monster; force combat anyway;
           also make it unmeetable if the player is Deaf, to simplify
           handling that case as player-won't-pay] */
        if (mon_has_amulet(mtmp) || (game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            demand = cash + (rn2(1000) + (125));
        }
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await pline("%s demands %ld %s for safe passage.", await Amonnam(mtmp), demand, await currency(demand));
        } else if (canseemon(mtmp)) {
            await pline("%s seems to be demanding something.", await Amonnam(mtmp));
        }
        offer = 0;
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && ((offer = await bribe(mtmp, "How much will you offer?")) >= demand)) {
            await pline("%s vanishes, laughing about cowardly mortals.", await Amonnam(mtmp));
        } else if (offer > 0 && rnd(5 * (acurr(A_CHA))) > (demand - offer)) {
            await pline("%s scowls at you menacingly, then vanishes.", await Amonnam(mtmp));
        } else {
            await pline("%s gets angry...", await Amonnam(mtmp));
            mtmp.mpeaceful = 0;
            set_malign(mtmp);
            return 0;
        }
    }
    livelog_printf(4, "bribed %s with %ld %s for safe passage", await x_monnam(mtmp, 2, null, 31, (0)), offer, (offer == 1) ? "zorkmid" : "zorkmids");
    await mongone(mtmp);
    return 1;
}
export async function bribe(mtmp, prompt) {
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let offer = 0;
    let umoney = money_cnt(game.invent);
    buf = await getlin(prompt, buf);
    if (sscanf(buf, "%ld", offer) != 1) {
        offer = 0;
    }
    if (offer < 0) {
        await You("try to shortchange %s, but fumble.", await mon_nam(mtmp));
        return 0;
    } else if (offer == 0) {
        await You("refuse.");
        return 0;
    } else if (offer >= umoney) {
        await You("give %s all your gold.", await mon_nam(mtmp));
        offer = umoney;
    } else {
        await You("give %s %ld %s.", await mon_nam(mtmp), offer, await currency(offer));
    }
    await money2mon(mtmp, offer);
    game.disp.botl = (1);
    return offer;
}
export async function dprince(atyp) {
    let tryct = 0;
    let pm = 0;
    for (tryct = !((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) ? 20 : 0; tryct > 0; --tryct) {
        pm = (rn2(PM_DEMOGORGON + 1 - PM_ORCUS) + (PM_ORCUS));
        if (!(game.mvitals[pm].mvflags & (2 | 1)) && (atyp == (-128) || sgn(game.mons[pm].maligntyp) == sgn(atyp))) {
            return pm;
        }
    }
    return await dlord(atyp);
}
export async function dlord(atyp) {
    let tryct = 0;
    let pm = 0;
    for (tryct = !((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) ? 20 : 0; tryct > 0; --tryct) {
        pm = (rn2(PM_YEENOGHU + 1 - PM_JUIBLEX) + (PM_JUIBLEX));
        if (!(game.mvitals[pm].mvflags & (2 | 1)) && (atyp == (-128) || sgn(game.mons[pm].maligntyp) == sgn(atyp))) {
            return pm;
        }
    }
    return await ndemon(atyp);
}
/* create lawful (good) lord */
export async function llord() {
    if (!(game.mvitals[PM_ARCHON].mvflags & (2 | 1))) {
        return PM_ARCHON;
    }
    return await lminion();
}
export async function lminion() {
    let tryct = 0;
    let ptr = null;
    for (tryct = 0; tryct < 20; tryct++) {
        ptr = await mkclass(S_ANGEL, 0);
        if (ptr && !(((ptr).mflags2 & 1024) != 0)) {
            return ((ptr).pmidx);
        }
    }
    return NON_PM;
}
/* A_NONE is used for 'any alignment' */
export async function ndemon(atyp) {
    let ptr = null;
    ptr = await mkclass_aligned(S_DEMON, 0, atyp);
    return (ptr && ((((ptr).mflags2 & 256) != 0) && (((ptr).mflags2 & (1024 | 2048)) == 0))) ? ((ptr).pmidx) : NON_PM;
}
/* guardian angel has been affected by conflict so is abandoning hero */
/* if Null, angel hasn't been created yet */
export async function lose_guardian_angel(mon) {
    let mm = { x: 0, y: 0 };
    let i = 0;
    if (mon) {
        if ((canseemon(mon) || sensemon(mon))) {
            if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                await pline("%s rebukes you, saying:", await Monnam(mon));
                ;
                await verbalize("Since you desire conflict, have some more!");
            } else {
                await pline("%s vanishes!", await Monnam(mon));
            }
        }
        await mongone(mon);
    }
    for (i = (rn2(3) + (2)); i > 0; --i) {
        /* create 2 to 4 hostile angels to replace the lost guardian */
        mm.x = game.u.ux;
        mm.y = game.u.uy;
        if (await enexto(mm, mm.x, mm.y, game.mons[PM_ANGEL])) {
            await mk_roamer(game.mons[PM_ANGEL], game.u.ualign.type, mm.x, mm.y, (0));
        }
    }
}
/* just entered the Astral Plane; receive tame guardian angel if worthy */
export async function gain_guardian_angel() {
    let mtmp = null;
    let otmp = null;
    let mm = { x: 0, y: 0 };
    await Hear_again();
    if ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await pline("A voice booms:");
        } else {
            await You_feel("a booming voice:");
        }
        ;
        await verbalize("Thy desire for conflict shall be fulfilled!");
        await lose_guardian_angel(null);
    } else if (game.u.ualign.record > 8) {
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            await pline("A voice whispers:");
        } else {
            await You_feel("a soft voice:");
        }
        ;
        await verbalize("Thou hast been worthy of me!");
        mm.x = game.u.ux;
        mm.y = game.u.uy;
        if (await enexto(mm, mm.x, mm.y, game.mons[PM_ANGEL]) && (mtmp = await mk_roamer(game.mons[PM_ANGEL], game.u.ualign.type, mm.x, mm.y, (1))) != null) {
            mtmp.mstrategy &= ~2147483648;
            if (game.u.uconduct.pets) {
                /* guardian angel -- the one case mtame doesn't imply an
             * edog structure, so we don't want to call tamedog().
             * [Note: this predates mon->mextra which allows a monster
             * to have both emin and edog at the same time.]
             */
                /* Too nasty for the game to unexpectedly break petless conduct on
             * the final level of the game. The angel will still appear, but
             * won't be tamed. */
                mtmp.mtame = 10;
                game.u.uconduct.pets++;
            }
            await newsym(mtmp.mx, mtmp.my);
            if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                await pline("An angel appears near you.");
            } else {
                await You_feel("the presence of a friendly angel near you.");
            }
            /* make him strong enough vs. endgame foes */
            mtmp.m_lev = (rn2(8) + (15));
            mtmp.mhp = mtmp.mhpmax = d(mtmp.m_lev, 10) + 30 + rnd(30);
            if ((otmp = await select_hwep(mtmp)) == null) {
                otmp = await mksobj(SILVER_SABER, (0), (0));
                if (await mpickobj(mtmp, otmp)) {
                    await panic("merged weapon?");
                }
            }
            await bless(otmp);
            if (otmp.spe < 4) {
                otmp.spe += rnd(4);
            }
            if ((otmp = await which_armor(mtmp, 8)) == null || otmp.otyp != SHIELD_OF_REFLECTION) {
                await mongets(mtmp, AMULET_OF_REFLECTION);
                await m_dowear(mtmp, (1));
            }
        }
    }
}
/*minion.c*/
/*
     * If this daemon is unique and being re-summoned (the only way we
     * could get this far with an extinct dtype), try another.
     */
/* renegade if same alignment but not peaceful
                   or peaceful but different alignment */
/* for any 'A', 'cloud of smoke' will be 'flash of light';
                   if more than one monster is being created, that message
                   might be skipped for this monster but show 'mtmp' anyway */
/* Note: if we forced --More-- here, the 'A's would be visible for
           long enough to be seen, but like with clairvoyance, some players
           would be annoyed at the disruption of having to acknowledge it */
/* This was mons[mnum].pxlth == 0 but is this restriction
           appropriate or necessary now that the structures are separate? */
/* if 'mtmp' is unrecognizable due to hero's hallucination,
       #chronicle will reveal its true identity -- just live with that;
       also, avoid random hallucinatory currency() units */
/*Michael Paddon -- fix for negative offer to monster*/
/*
     * 3.6.2:  [fixed #H2204, 22-Dec-2010, eight years later...]
     * pick a correctly aligned demon in one try.  This used to
     * use mkclass() to choose a random demon type and keep trying
     * (up to 20 times) until it got one with the desired alignment.
     * mkclass_aligned() skips wrongly aligned potential candidates.
     * [The only neutral demons are djinni and mail daemon and
     * mkclass() won't pick them, but call it anyway in case either
     * aspect of that changes someday.]
     */
/* attempt to cure any deafness now (divine
                     message will be heard even if that fails) */
/* send in some hostile angels instead */
/* for 'hilite_pet'; after making tame, before next message */
