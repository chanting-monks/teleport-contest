/* NetHack 5.0	bones.c	$NHDT-Date: 1701500709 2023/12/02 07:05:09 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.129 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985,1993. */
/*-Copyright (c) Robert Patrick Rankin, 2012. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { You, pline } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { strcat, strcmp, strcpy, strlen, strncmp } from '../c2js-runtime/string.js';
import { unleash_all } from './apply.js';
import { artifact_exists, artifact_light, exist_artifact } from './artifact.js';
import { yyyymmddhhmmss } from './calendar.js';
import { isok, yn_function } from './cmd.js';
import { ynchars } from './decl.js';
import { newsym } from './display.js';
import { obj_no_longer_held } from './do.js';
import { christen_monst, free_oname, safe_oname } from './do_name.js';
import { update_mlstmv } from './dog.js';
import { In_hell, Is_botlevel, Is_branchlev, Is_special, assign_level, depth, dunlevs_in_dungeon, ledger_no, maxledgerno, on_level } from './dungeon.js';
import { forget_engravings, sanitize_engravings } from './engrave.js';
import { in_rooms } from './hack.js';
import { obj_is_burning } from './light.js';
import { makemon, mongets, newmextra } from './makemon.js';
import { add_to_container, add_to_minv, curse, dealloc_obj, free_omonst, mk_named_object, obj_attach_mid, obj_extract_self, place_object, set_corpsenm, weight } from './mkobj.js';
import { can_carry, dmonsfree, iter_mons, mongone } from './mon.js';
import { attacktype, give_u_to_m_resistances } from './mondata.js';
import { m_carrying } from './mthrowu.js';
import { AMULET_OF_YENDOR, BELL, BELL_OF_OPENING, BOOMERANG, BOW, CANDELABRUM_OF_INVOCATION, CORPSE, DELPHI, DISMOUNT_BONES, EGG, ELVEN_BOW, FAKE_AMULET_OF_YENDOR, FOOD_CLASS, GLYPH_UNEXPLORED_OFF, HOLE, LEAVESTATUE, LOW_PM, MAGIC_PORTAL, MS_LEADER, MS_NEMESIS, MUMMY_WRAPPING, M_SEEN_NOTHING, NEUTRAL, NON_PM, NUMMONS, ORCISH_BOW, PM_DOPPELGANGER, PM_GHOST, PM_MEDUSA, PM_ORACLE, PM_VLAD_THE_IMPALER, SCR_MAIL, SHOPBASE, SLIME_MOLD, SPECIAL_PM, SPE_BLANK_PAPER, SPE_BOOK_OF_THE_DEAD, SPE_NOVEL, STATUE, S_MUMMY, TIN, WAX_CANDLE, YUMI, wp_tty } from './nh-constants.js';
import { fruit_from_indx, the, xname } from './objnam.js';
import { is_quest_artifact } from './questpgr.js';
import { cant_revive, unpunish } from './read.js';
import { rn2 } from './rnd.js';
import { aligns, genders, races, roles } from './role.js';
import { sfi_char, sfo_char } from './sfbase.js';
import { fix_shop_damage, inside_shop, tended_shop } from './shk.js';
import { dismount_steed } from './steed.js';
import { enexto, rloc_to } from './teleport.js';
import { end_burn } from './timeout.js';
import { formatkiller } from './topten.js';
import { store_version, validate } from './version.js';
import { clear_bypasses, m_dowear } from './worn.js';
import { get_obj_location } from './zap.js';

export function no_bones_level(lev) {
    let sptr = null;
    if (ledger_no(game.save_dlevel)) {
        assign_level(lev, game.save_dlevel);
    }
    return (((sptr = Is_special(lev)) != null && !sptr.boneid) || !game.dungeons[lev.dnum].boneid || Is_botlevel(lev) || (Is_branchlev(lev) && lev.dlevel > 1) || (In_hell(lev) && lev.dlevel == dunlevs_in_dungeon(lev) - 1));
}
/* Call this function for each fruit object saved in the bones level: it marks
 * that particular type of fruit as existing (the marker is that that type's
 * ID is positive instead of negative).  This way, when we later save the
 * chain of fruit types, we know to only save the types that exist.
 */
export function goodfruit(id) {
    let f = fruit_from_indx(-id);
    if (f) {
        f.fid = id;
    }
}
export function resetobjs(ochain, restore) {
    let otmp = null;
    let nobj = null;
    for (otmp = ochain; otmp; otmp = nobj) {
        nobj = otmp.nobj;
        if (otmp.cobj) {
            resetobjs(otmp.cobj, restore);
        }
        if (otmp.in_use) {
            /* all inventory is dropped (for the normal case), even non-droppable
       things like worn armor and accessories, welded weapon, or cursed
       loadstones */
            obj_extract_self(otmp);
            dealloc_obj(otmp);
            continue;
        }
        if (restore) {
            if (otmp.oartifact) {
                if (exist_artifact(otmp.otyp, safe_oname(otmp)) || is_quest_artifact(otmp)) {
                    /* artifact bookkeeping needs to be done during
               restore; other fixups are done while saving */
                    /* prevent duplicate--revert to ordinary obj */
                    otmp.oartifact = 0;
                    if (((otmp).oextra && ((otmp).oextra.oname))) {
                        /* strip user-supplied names */
                        /* Statue and some corpse names are left intact,
               presumably in case they came from score file.
               [TODO: this ought to be done differently--names
               which came from such a source or came from any
               stoned or killed monster should be flagged in
               some manner; then we could just check the flag
               here and keep "real" names (dead pets, &c) while
               discarding player notes attached to statues.] */
                        free_oname(otmp);
                    }
                } else {
                    artifact_exists(otmp, safe_oname(otmp), (1), 64);
                }
            } else if (((otmp).oextra && ((otmp).oextra.oname))) {
                sanitize_name(((otmp).oextra.oname));
            }
            if (otmp.oclass == FOOD_CLASS && otmp.oeaten) {
                /* 3.6.3: set no_charge for partly eaten food in shop;
               all other items become goods for sale if in a shop */
                let top = null;
                let p = null;
                let ox = 0;
                let oy = 0;
                for (top = otmp; top.where == 2; top = top.v.v_ocontainer) {
                    continue;
                }
                otmp.no_charge = (top.where == 1 && get_obj_location(top, { get value() { return ox; }, set value(_v) { ox = _v; } }, { get value() { return oy; }, set value(_v) { oy = _v; } }, 0) && inside_shop(ox, oy) && (p = in_rooms(ox, oy, SHOPBASE)) && tended_shop(game.rooms[p - 3]));
            }
        } else {
            /* do not zero out o_ids for ghost levels anymore */
            if (game.objects[otmp.otyp].oc_uses_known) {
                otmp.known = 0;
            }
            otmp.dknown = otmp.bknown = 0;
            otmp.rknown = 0;
            otmp.lknown = 0;
            otmp.cknown = 0;
            otmp.tknown = 0;
            otmp.invlet = 0;
            otmp.no_charge = 0;
            otmp.how_lost = 0;
            if (((otmp).oextra && ((otmp).oextra.oname)) && !(otmp.oartifact || otmp.otyp == STATUE || otmp.otyp == SPE_NOVEL || (otmp.otyp == CORPSE && otmp.corpsenm >= SPECIAL_PM))) {
                free_oname(otmp);
            }
            if (otmp.otyp == SLIME_MOLD) {
                goodfruit(otmp.spe);
            } else if (otmp.otyp == SCR_MAIL) {
                /* 0: delivered in-game via external event;
                   1: from bones or wishing; 2: written with marker */
                if (otmp.spe == 0) {
                    otmp.spe = 1;
                }
            } else if (otmp.otyp == EGG) {
                /* not "laid by you" in next game */
                otmp.spe = 0;
            } else if (otmp.otyp == TIN) {
                /* make tins of unique monster's meat be empty */
                if (((otmp.corpsenm) >= LOW_PM && (otmp.corpsenm) < NUMMONS) && (((game.mons[otmp.corpsenm]).geno & 4096) != 0)) {
                    otmp.corpsenm = NON_PM;
                }
            } else if (otmp.otyp == CORPSE || otmp.otyp == STATUE) {
                let mnum = otmp.corpsenm;
                if (((otmp).oextra && ((otmp).oextra.omonst)) && cant_revive({ get value() { return mnum; }, set value(_v) { mnum = _v; } }, (0), null)) {
                    /* Discard incarnation details of unique monsters
                   (by passing null instead of otmp for object),
                   shopkeepers (by passing false for revival flag),
                   temple priests, and vault guards in order to
                   prevent corpse revival or statue reanimation. */
                    free_omonst(otmp);
                    /* mnum is now either human_zombie or doppelganger;
                       for corpses of uniques, we need to force the
                       transformation now rather than wait until a
                       revival attempt, otherwise eating this corpse
                       would behave as if it remains unique */
                    if (mnum == PM_DOPPELGANGER && otmp.otyp == CORPSE) {
                        set_corpsenm(otmp, mnum);
                    }
                }
            } else if (((otmp).o_id == game.context.achieveo.mines_prize_oid) || ((otmp).o_id == game.context.achieveo.soko_prize_oid)) {
                /* achievement tracking; in case prize was moved off its
                   original level (which is always a no-bones level) */
                otmp.nomerge = 0;
            } else if (otmp.otyp == AMULET_OF_YENDOR) {
                /* no longer the real Amulet */
                otmp.otyp = FAKE_AMULET_OF_YENDOR;
                curse(otmp);
            } else if (otmp.otyp == CANDELABRUM_OF_INVOCATION) {
                if (otmp.lamplit) {
                    end_burn(otmp, (1));
                }
                otmp.otyp = WAX_CANDLE;
                otmp.age = 50;
                if (otmp.spe > 0) {
                    otmp.quan = otmp.spe;
                }
                otmp.spe = 0;
                otmp.owt = weight(otmp);
                curse(otmp);
            } else if (otmp.otyp == BELL_OF_OPENING) {
                otmp.otyp = BELL;
                curse(otmp);
            } else if (otmp.otyp == SPE_BOOK_OF_THE_DEAD) {
                otmp.otyp = SPE_BLANK_PAPER;
                curse(otmp);
            }
        }
    }
}
/* while loading bones, strip out text possibly supplied by old player
   that might accidentally or maliciously disrupt new player's display */
export function sanitize_name(namebuf) {
    let c = 0;
    let strip_8th_bit = ((game.windowprocs.wp_id == wp_tty) && !game.iflags.wc_eight_bit_input);
    while (namebuf.value) {
        /* it's tempting to skip this for single-user platforms, since
       only the current player could have left these bones--except
       things like "hearse" and other bones exchange schemes make
       that assumption false */
        c = namebuf.value & 127;
        if (c < 32 || c == 127) {
            /* non-printable or undesirable */
            namebuf.value = 46;
        } else if (c != namebuf.value) {
            /* expected to be printable if user wants such things */
            if (strip_8th_bit) {
                namebuf.value = 95;
            }
        }
        ++namebuf;
    }
}
/* Give object to a random object-liking monster on or adjacent to x,y
   but skipping hero's location.
   If no such monster, place object on floor at x,y. */
export function give_to_nearby_mon(otmp, x, y) {
    let mtmp = null;
    let selected = null;
    let nmon = 0;
    let xx = 0;
    let yy = 0;
    for (xx = x - 1; xx <= x + 1; ++xx) {
        for (yy = y - 1; yy <= y + 1; ++yy) {
            if (!isok(xx, yy)) {
                continue;
            }
            if (((xx) == game.u.ux && (yy) == game.u.uy)) {
                continue;
            }
            if (!(mtmp = (game.level.monsters[xx][yy]))) {
                continue;
            }
            /* This doesn't do any checks on otmp to see that it matches the
             * likes_* property, intentionally. Assume that the monster is
             * rifling through and taking things that look interesting. */
            if (!((((mtmp.data).mflags2 & 268435456) != 0) || (((mtmp.data).mflags2 & 536870912) != 0) || (((mtmp.data).mflags2 & 1073741824) != 0 || attacktype(mtmp.data, 254)) || (((mtmp.data).mflags2 & 2147483648) != 0))) {
                continue;
            }
            nmon++;
            if (!rn2(nmon)) {
                selected = mtmp;
            }
        }
    }
    if (selected && can_carry(selected, otmp)) {
        add_to_minv(selected, otmp);
    } else {
        place_object(otmp, x, y);
    }
}
/* called by savebones(); also by finish_paybill(shk.c) */
/* monster if hero rises as one (non ghost) */
/* container if hero is turned into a statue */
export function drop_upon_death(mtmp, cont, x, y) {
    let otmp = null;
    /* when dual-wielding, the second weapon gets dropped rather than
       welded if it becomes cursed; ensure that that won't happen here
       by ending dual-wield */
    game.u.twoweap = (0);
    while ((otmp = game.invent) != null) {
        obj_extract_self(otmp);
        /* when turning into green slime, all gear remains held;
           other types "arise from the dead" do aren't holding
           equipment during their brief interval as a corpse */
        if (!mtmp || (((mtmp.data).mflags2 & 2) != 0)) {
            obj_no_longer_held(otmp);
        }
        /* lamps don't go out when dropped */
        if ((cont || artifact_light(otmp)) && obj_is_burning(otmp)) {
            end_burn(otmp, (1));
        }
        otmp.owornmask = 0;
        if (otmp.otyp == SLIME_MOLD) {
            goodfruit(otmp.spe);
        }
        if (rn2(5)) {
            curse(otmp);
        }
        if (mtmp) {
            add_to_minv(mtmp, otmp);
        } else if (cont) {
            add_to_container(cont, otmp);
        } else if (!rn2(8)) {
            give_to_nearby_mon(otmp, x, y);
        } else {
            place_object(otmp, x, y);
        }
    }
    if (cont) {
        cont.owt = weight(cont);
    }
}
/* possibly restore oracle's room and/or put her back inside it; returns
   False if she's on the wrong level and should be removed, True otherwise */
export function fixuporacle(oracle) {
    let cc = { x: 0, y: 0 };
    let ridx = 0;
    let o_ridx = 0;
    /* oracle doesn't move, but knight's joust or monk's staggering blow
       could push her onto a hole in the floor; at present, traps don't
       activate in such situation hence she won't fall to another level;
       however, that could change so be prepared to cope with such things */
    if (!(((((game.dungeon_topology.d_oracle_level)).dlevel || ((game.dungeon_topology.d_oracle_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_oracle_level))))) {
        /* no bones for specific levels */
        return (0);
    }
    /* for behavior toward next character */
    oracle.mpeaceful = 1;
    o_ridx = game.level.locations[oracle.mx][oracle.my].roomno - 3;
    if (o_ridx >= 0 && game.rooms[o_ridx].rtype == DELPHI) {
        /* keep oracle in new bones file */
        return (1);
    }
    /*
     * The Oracle isn't in DELPHI room.  Either hero entered her chamber
     * and got the one-time welcome message, converting it into an
     * ordinary room, or she got teleported out, or both.  Try to put
     * her back inside her room, if necessary, and restore its type.
     */
    /* find original delphi chamber; should always succeed */
    for (ridx = 0; ridx < (Math.trunc(82 /* sizeof(struct mkroom [82]) */ / 1 /* sizeof(struct mkroom) */)); ++ridx) {
        if (game.rooms[ridx].orig_rtype == DELPHI) {
            break;
        }
    }
    if (o_ridx != ridx && ridx < (Math.trunc(82 /* sizeof(struct mkroom [82]) */ / 1 /* sizeof(struct mkroom) */))) {
        /* room found and she's not in it, so try to move her there */
        cc.x = Math.trunc((game.rooms[ridx].lx + game.rooms[ridx].hx) / 2);
        cc.y = Math.trunc((game.rooms[ridx].ly + game.rooms[ridx].hy) / 2);
        /* [if her room is already full, she might end up outside;
           that's ok, next hero just won't get any welcome message,
           same as used to happen before this fixup was introduced] */
        if (enexto(cc, cc.x, cc.y, oracle.data)) {
            rloc_to(oracle, cc.x, cc.y);
            o_ridx = game.level.locations[oracle.mx][oracle.my].roomno - 3;
        }
    }
    /* if she's in her room, mark it as such */
    if (ridx == o_ridx) {
        game.rooms[ridx].rtype = DELPHI;
    }
    return (1);
}
/* check whether bones are feasible */
export function can_make_bones() {
    let ttmp = null;
    if (!game.flags.bones) {
        return (0);
    }
    if (ledger_no(game.u.uz) <= 0 || ledger_no(game.u.uz) > maxledgerno()) {
        return (0);
    }
    if (no_bones_level(game.u.uz)) {
        return (0);
    }
    if (game.u.uswallow) {
        return (0);
    }
    if (!Is_branchlev(game.u.uz)) {
        /* no bones on non-branches with portals */
        for (ttmp = game.ftrap; ttmp; ttmp = ttmp.ntrap) {
            if (ttmp.ttyp == MAGIC_PORTAL) {
                return (0);
            }
        }
    }
    /* bulletproofing for endgame */
    if (depth(game.u.uz) <= 0 || (!rn2(1 + (depth(game.u.uz) >> 2)) && !game.flags.debug)) {
        return (0);
    }
    /* fewer ghosts on low levels */
    /* don't let multiple restarts generate multiple copies of objects
       in bones files */
    if (game.flags.explore) {
        return (0);
    }
    return (1);
}
/* monster might need to be removed before saving a bones file,
   in case these characters are not in their home bases */
export function remove_mon_from_bones(mtmp) {
    let mptr = mtmp.data;
    if (mtmp.iswiz || mptr == game.mons[PM_MEDUSA] || mptr.msound == MS_NEMESIS || mptr.msound == MS_LEADER || ((mtmp).data == game.mons[PM_VLAD_THE_IMPALER] || (mtmp).cham == PM_VLAD_THE_IMPALER) || (mptr == game.mons[PM_ORACLE] && !fixuporacle(mtmp))) {
        mongone(mtmp);
    }
}
/* save bones and possessions of a deceased adventurer */
export function savebones(how, when, corpse) {
    let x = 0;
    let y = 0;
    let ttmp = null;
    let mtmp = null;
    let f = null;
    let newbones = null;
    let c = 0;
    let bonesid = null;
    let whynot = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let nhfp = null;
    make_bones: {
        /* caller has already checked `can_make_bones()' */
        clear_bypasses();
        nhfp = open_bonesfile(game.u.uz, bonesid);
        if (nhfp) {
            close_nhfile(nhfp);
            if (game.flags.debug) {
                if (yn_function("Bones file already exists.  Replace it?", ynchars, 110, (1)) == 121) {
                    if (delete_bonesfile(game.u.uz)) {
                        break make_bones;
                    } else {
                        pline("Cannot unlink old bones.");
                    }
                }
            }
            /* compression can change the file's name, so must
           wait until after any attempt to delete this file */
            compress_bonesfile();
            return;
        }
    }
    unleash_all();
    /* new ghost or other undead isn't punished even if hero was;
       end-of-game disclosure has already had a chance to report the
       Punished status so we don't need to preserve it any further */
    if ((game.uball != null)) {
        unpunish();
    }
    /* unwear uball, destroy uchain */
    /* in case dismounting kills steed [is that even possible?], do so
       before cleaning up dead monsters */
    if (game.u.usteed) {
        dismount_steed(DISMOUNT_BONES);
    }
    /* send various unique monsters away, */
    iter_mons(remove_mon_from_bones);
    /* then discard dead or gone monsters */
    dmonsfree();
    /* next hero won't have read any engravings yet */
    forget_engravings();
    /* mark all named fruits as nonexistent; if/when we come to instances
       of any of them we'll mark those as existing (using goodfruit()) */
    for (f = game.ffruit; f; f = f.nextf) {
        f.fid = -f.fid;
    }
    set_ghostly_objlist(game.invent);
    if (((game.u.ugrave_arise) >= LOW_PM && (game.u.ugrave_arise) < NUMMONS)) {
        /* dispose of your possessions, usually cursed */
        /* give your possessions to the monster you become */
        /* trick makemon() into allowing monster creation
         * on your location
         */
        game.in_mklev = (1);
        mtmp = makemon(game.mons[game.u.ugrave_arise], game.u.ux, game.u.uy, 1);
        game.in_mklev = (0);
        if (!mtmp) {
            /* arise-type might have been genocided */
            /* u.ugrave_arise < LEAVESTATUE */
            drop_upon_death(null, null, game.u.ux, game.u.uy);
            game.u.ugrave_arise = NON_PM;
            return;
        }
        give_u_to_m_resistances(mtmp);
        mtmp = christen_monst(mtmp, game.plname);
        newsym(game.u.ux, game.u.uy);
        /* ["Your body rises from the dead as an <mname>..." used
           to be given here, but it has been moved to done() so that
           it gets delivered even when savebones() isn't called] */
        drop_upon_death(mtmp, null, game.u.ux, game.u.uy);
        /* 'mtmp' now has hero's inventory; if 'mtmp' is a mummy, give it
           a wrapping unless already carrying one */
        if (mtmp.data.mlet == S_MUMMY && !m_carrying(mtmp, MUMMY_WRAPPING)) {
            mongets(mtmp, MUMMY_WRAPPING);
        }
        m_dowear(mtmp, (1));
    } else if (game.u.ugrave_arise == LEAVESTATUE) {
        let otmp = null;
        /* embed your possessions in your statue */
        otmp = mk_named_object(STATUE, game.mons[game.u.umonnum], game.u.ux, game.u.uy, game.plname);
        drop_upon_death(null, otmp, game.u.ux, game.u.uy);
        if (!otmp) {
            return;
        }
        mtmp = null;
    } else {
        drop_upon_death(null, null, game.u.ux, game.u.uy);
        game.in_mklev = (1);
        mtmp = makemon(game.mons[PM_GHOST], game.u.ux, game.u.uy, 64);
        game.in_mklev = (0);
        if (!mtmp) {
            return;
        }
        mtmp = christen_monst(mtmp, game.plname);
        if (corpse) {
            obj_attach_mid(corpse, mtmp.m_id);
        }
    }
    if (mtmp) {
        let i = 0;
        mtmp.m_lev = (game.u.ulevel ? game.u.ulevel : 1);
        mtmp.mhp = mtmp.mhpmax = game.u.uhpmax;
        mtmp.female = game.flags.female;
        mtmp.msleeping = 1;
        if (!((mtmp).mextra && ((mtmp).mextra.ebones))) {
            newebones(mtmp);
        }
        if (((mtmp).mextra && ((mtmp).mextra.ebones))) {
            for (i = 0; i <= (13); ++i) {
                /* impossible("savebones: bad gu.urole.name.m \"%s\"",
                              gu.urole.name.m); */
                if (!strcmp(game.urole.name.m, roles[i].name.m)) {
                    ((mtmp).mextra.ebones).role = i;
                    break;
                }
            }
            for (i = 0; i <= (5); ++i) {
                /* impossible("savebones: bad gu.urace.noun \"%s\"",
                              gu.urace.noun); */
                if (!strcmp(game.urace.noun, races[i].noun)) {
                    ((mtmp).mextra.ebones).race = i;
                    break;
                }
            }
            ((mtmp).mextra.ebones).oldalign = game.u.ualign;
            ((mtmp).mextra.ebones).deathlevel = game.u.ulevel;
            ((mtmp).mextra.ebones).luck = game.u.uluck;
            ((mtmp).mextra.ebones).mnum = (game.urole.mnum);
            ((mtmp).mextra.ebones).female = game.flags.female;
            ((mtmp).mextra.ebones).demigod = game.u.uevent.udemigod;
            ((mtmp).mextra.ebones).crowned = game.u.uevent.uhand_of_elbereth;
        }
    }
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        set_ghostly_objlist(mtmp.minvent);
        resetobjs(mtmp.minvent, (0));
        /* do not zero out m_ids for bones levels any more */
        mtmp.mlstmv = 0;
        if (mtmp.mtame) {
            mtmp.mtame = mtmp.mpeaceful = 0;
        }
        /* observations about the current hero won't apply to future game */
        mtmp.seen_resistance = M_SEEN_NOTHING;
    }
    for (ttmp = game.ftrap; ttmp; ttmp = ttmp.ntrap) {
        ttmp.madeby_u = 0;
        ttmp.tseen = ((ttmp.ttyp) == HOLE);
    }
    set_ghostly_objlist(game.level.objlist);
    resetobjs(game.level.objlist, (0));
    set_ghostly_objlist(game.level.buriedobjlist);
    resetobjs(game.level.buriedobjlist, (0));
    /* Hero is no longer on the map. */
    game.u.ux0 = game.u.ux , game.u.uy0 = game.u.uy;
    game.u.ux = game.u.uy = 0;
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            game.level.locations[x][y].seenv = 0;
            game.level.locations[x][y].waslit = 0;
            game.level.locations[x][y].glyph = GLYPH_UNEXPLORED_OFF;
            /* Clear all memory from the level. */
            game.lastseentyp[x][y] = 0;
        }
    }
    /* Attach bones info to the current level before saving. */
    newbones = alloc(1 /* sizeof(struct cemetery) */);
    /* entries are '\0' terminated but have fixed length allocations,
       so pre-fill with spaces to initialize any excess room */
    memset(newbones, 32, 1 /* sizeof(struct cemetery) */);
    newbones.who = sprintf(newbones.who, "%s-%.3s-%.3s-%.3s-%.3s", game.plname, game.urole.filecode, game.urace.filecode, genders[game.flags.female].filecode, aligns[1 - game.u.ualign.type].filecode);
    formatkiller(newbones.how, 101 /* sizeof(char [101]) */, how, (1));
    newbones.when = strcpy(newbones.when, yyyymmddhhmmss(when));
    /* final resting place, used to decide when bones are discovered */
    newbones.frpx = game.u.ux0 , newbones.frpy = game.u.uy0;
    newbones.bonesknown = (0);
    /* if current character died on a bones level, the cemetery list
       will have multiple entries, most recent (this dead hero) first */
    newbones.next = game.level.bonesinfo;
    game.level.bonesinfo = newbones;
    /* flag these bones if they are being created in wizard mode;
       they might already be flagged as such, even when we're playing
       in normal mode, if this level came from a previous bones file */
    if (game.flags.debug) {
        game.level.flags.wizard_bones = 1;
    }
    nhfp = create_bonesfile(game.u.uz, bonesid, whynot);
    if (!nhfp) {
        /* format name+role,&c, death reason, and date+time;
       gender and alignment reflect final values rather than what the
       character started out as, same as topten and logfile entries */
        if (game.flags.debug) {
            pline("%s", whynot);
        }
        /* bones file creation problems are silent to the player.
         * Keep it that way, but place a clue into the paniclog.
         */
        paniclog("savebones", whynot);
        return;
    }
    c = (strlen(bonesid) + 1);
    nhfp.mode = 2;
    store_version(nhfp);
    sfo_char(nhfp, game.nhuuid[0], "ancestor-nhuuid", 37 /* sizeof(char [37]) */);
    sfo_char(nhfp, { get value() { return c; }, set value(_v) { c = _v; } }, "bones_count", 1);
    sfo_char(nhfp, bonesid, "bonesid", c);
    /* if a bones pool digit is in use, it precedes the bonesid
       string and isn't recorded in the file */
    savefruitchn(nhfp);
    /* update monsters for eventual restoration */
    update_mlstmv();
    savelev(nhfp, ledger_no(game.u.uz));
    close_nhfile(nhfp);
    commit_bonesfile(game.u.uz);
    compress_bonesfile();
}
/* !SFCTOOL */
export function getbones() {
    let ok = 0;
    let nhfp = null;
    let c = 0;
    let bonesid = null;
    let oldbonesid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* was [10]; more should be safer */
    let ancestor_nhuuid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* save bones files for real games */
    if (game.flags.explore) {
        /* When N games try to simultaneously restore the same
         * bones file, N-1 of them will fail to delete it
         * (the first N-1 under AmigaDOS, the last N-1 under UNIX).
         * So no point in a mysterious message for a normal event
         * -- just generate a new level for those N-1 games.
         */
        /* pline("Cannot unlink bones."); */
        return 0;
    }
    if (!game.flags.bones) {
        return 0;
    }
    /* wizard check added by GAN 02/05/87 */
    /* only once in three times do we find bones */
    if (rn2(3) && !game.flags.debug) {
        return 0;
    }
    if (no_bones_level(game.u.uz)) {
        return 0;
    }
    nhfp = open_bonesfile(game.u.uz, bonesid);
    if (!nhfp) {
        return 0;
    }
    if (nhfp && nhfp.structlevel && nhfp.fd < 0) {
        return 0;
    }
    if (nhfp && nhfp.fieldlevel) {
        if (nhfp.style.deflt && !nhfp.fpdef) {
            return 0;
        }
    }
    game.program_state.reading_bonesfile = 1;
    if (validate(nhfp, game.bones, (0)) != 0) {
        if (!game.flags.debug) {
            pline("Discarding unusable bones; no need to panic...");
        }
        ok = (0);
        game.program_state.reading_bonesfile = 0;
    } else {
        ok = (1);
        if (game.flags.debug) {
            if (yn_function("Get bones?", ynchars, 110, (1)) == 110) {
                close_nhfile(nhfp);
                compress_bonesfile();
                /* ToDo: maybe unlink these problematic bones? */
                game.program_state.reading_bonesfile = 0;
                return 0;
            }
        }
        sfi_char(nhfp, ancestor_nhuuid[0], "ancestor-nhuuid", 37 /* sizeof(char [37]) */);
        sfi_char(nhfp, { get value() { return c; }, set value(_v) { c = _v; } }, "bones_count", 1);
        if (c <= 40 /* sizeof(char [40]) */) {
            sfi_char(nhfp, oldbonesid, "bonesid", c);
        } else {
            if (game.flags.debug) {
                do {
                    if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/bones.c", (1))) {
                        let save_plnmsg = game.iflags.last_msg;
                        pline("Abandoning bones , %u > %u.", c, 40 /* sizeof(char [40]) */);
                        game.iflags.last_msg = save_plnmsg;
                    }
                } while (0);
            }
            close_nhfile(nhfp);
            compress_bonesfile();
            game.program_state.reading_bonesfile = 0;
            return 0;
        }
        if (strcmp(bonesid, oldbonesid) != 0) {
            let errbuf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            errbuf = sprintf(errbuf, "This is bones level '%s', not '%s'!", oldbonesid, bonesid);
            if (game.flags.debug) {
                pline("%s", errbuf);
                ok = (0);
            }
            game.program_state.reading_bonesfile = 0;
            trickery(errbuf);
        } else {
            let mtmp = null;
            getlev(nhfp, 0, 0);
            for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
                /* Note that getlev() now keeps tabs on unique
             * monsters such as demon lords, and tracks the
             * birth counts of all species just as makemon()
             * does.  If a bones monster is extinct or has been
             * subject to genocide, their mhpmax will be
             * set to the magic DEFUNCT_MONSTER cookie value.
             */
                if (((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
                    sanitize_name(((mtmp).mextra.mgivenname));
                }
                if (mtmp.mhpmax == (-100)) {
                    if (game.flags.debug) {
                        do {
                            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/bones.c", (1))) {
                                let save_plnmsg = game.iflags.last_msg;
                                pline("Removing defunct monster %s from bones.", mtmp.data.pmnames[NEUTRAL]);
                                game.iflags.last_msg = save_plnmsg;
                            }
                        } while (0);
                    }
                    mongone(mtmp);
                /* to correctly reset named artifacts on the level */
                } else {
                    resetobjs(mtmp.minvent, (1));
                }
            }
            resetobjs(game.level.objlist, (1));
            resetobjs(game.level.buriedobjlist, (1));
            fix_shop_damage();
        }
    }
    close_nhfile(nhfp);
    game.program_state.reading_bonesfile = 0;
    sanitize_engravings();
    game.u.uroleplay.numbones++;
    if (game.flags.debug) {
        if (yn_function("Unlink bones?", ynchars, 110, (1)) == 110) {
            compress_bonesfile();
            return ok;
        }
    }
    if (!delete_bonesfile(game.u.uz)) {
        return 0;
    }
    return ok;
}
/* check whether current level contains bones from a particular player */
export function bones_include_name(name) {
    let bp = null;
    let len = 0;
    let buf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    buf = strcpy(buf, name);
    buf = strcat(buf, "-");
    /* prepare buffer by appending terminal hyphen to name, to avoid partial
     * matches producing false positives */
    len = strlen(buf);
    for (bp = game.level.bonesinfo; bp; bp = bp.next) {
        if (!strncmp(bp.who, buf, len)) {
            return (1);
        }
    }
    return (0);
}
/* set the ghostly bit in a list of objects */
export function set_ghostly_objlist(objchain) {
    while (objchain) {
        objchain.ghostly = 1;
        objchain = objchain.nobj;
    }
}
/* This is called when a marked object from a bones file is picked-up.
   Some could result in a message, and the obj->ghostly flag is always
   cleared. obj->ghostly has no other usage at this time. */
export function fix_ghostly_obj(obj) {
    if (!obj.ghostly) {
        return;
    }
    switch (obj.otyp) {
        case BOW:
        case ELVEN_BOW:
        case ORCISH_BOW:
        case YUMI:
        case BOOMERANG:
            You("make adjustments to %s to suit your %s hand.", the(xname(obj)), (game.u.uhandedness == 0) ? "right" : "left");
            break;
        default:
            break;
    }
    obj.ghostly = 0;
}
export function newebones(mtmp) {
    if (!mtmp.mextra) {
        mtmp.mextra = newmextra();
    }
    if (!((mtmp).mextra.ebones)) {
        ((mtmp).mextra.ebones) = alloc(1 /* sizeof(struct ebones) */);
        memset(((mtmp).mextra.ebones), 0, 1 /* sizeof(struct ebones) */);
        ((mtmp).mextra.ebones).parentmid = mtmp.m_id;
    }
}
/* this is not currently used */
export function free_ebones(mtmp) {
    if (mtmp.mextra && ((mtmp).mextra.ebones)) {
        free(((mtmp).mextra.ebones));
        ((mtmp).mextra.ebones) = null;
    }
}
/* SFCTOOL */
/*bones.c*/
/* no bones on the last or multiway branch levels
                         in any dungeon (level 1 isn't multiway) */
/* no bones in the invocation level */
/* can't use costly_spot() since its
                                      result depends upon hero's location */
/* mptr == &mons[VLAD_THE_IMPALER] || cham == VLAD */
