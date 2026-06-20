/* NetHack 5.0	light.c	$NHDT-Date: 1773375430 2026/03/12 20:17:10 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.82 $ */
/* Copyright (c) Dean Luick, 1994                                       */
/* NetHack may be freely redistributed.  See license for details.       */
/*
 * Mobile light sources.
 *
 * This implementation minimizes memory at the expense of extra
 * recalculations.
 *
 * Light sources are "things" that have a physical position and range.
 * They have a type, which gives us information about them.  Currently
 * they are only attached to objects and monsters.  Note well:  the
 * polymorphed-player handling assumes that gy.youmonst.m_id will
 * always remain 1 and gy.youmonst.mx will always remain 0.
 *
 * Light sources, like timers, either follow game play (RANGE_GLOBAL) or
 * stay on a level (RANGE_LEVEL).  Light sources are unique by their
 * (type, id) pair.  For light sources attached to objects, this id
 * is a pointer to the object.
 *
 * The major working function is do_light_sources(). It is called
 * when the vision system is recreating its "could see" array.  Here
 * we add a flag (TEMP_LIT) to the array for all locations that are lit
 * via a light source.  The bad part of this is that we have to
 * re-calculate the LOS of each light source every time the vision
 * system runs.  Even if the light sources and any topology (vision blocking
 * positions) have not changed.  The good part is that no extra memory
 * is used, plus we don't have to figure out how far the sources have moved,
 * or if the topology has changed.
 *
 * The structure of the save/restore mechanism is amazingly similar to
 * the timer save/restore.  This is because they both have the same
 * principals of having pointers into objects that must be recalculated
 * across saves and restores.
 */
/* flags */
/* display the light source */
/* need oid fixup */
/* impossible situation encountered */
import { game } from '../gstate.js';
import { abs } from '../c2js-runtime/math.js';
import { alloc, free, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { artifact_light } from './artifact.js';
import { cg } from './decl.js';
import { canseemon, flush_screen, map_invisible, sensemon } from './display.js';
import { dist2 } from './hacklib.js';
import { place_object, remove_object } from './mkobj.js';
import { BRASS_LANTERN, CANDELABRUM_OF_INVOCATION, GOLD_DRAGON_SCALE_MAIL, LS_MONSTER, LS_NONE, LS_OBJECT, MAGIC_LAMP, OIL_LAMP, POT_OIL, TALLOW_CANDLE, WAX_CANDLE } from './nh-constants.js';
import { otense, simpleonames, xname } from './objnam.js';
import { sfi_int, sfi_ls_t, sfo_int, sfo_ls_t } from './sfbase.js';
import { find_oid } from './shk.js';
import { end_burn, obj_is_local } from './timeout.js';
import { circle_data, circle_start, clear_path, vision_recalc } from './vision.js';
import { get_mon_location, get_obj_location } from './zap.js';

/* imported from vision.c, for small circles */
/* Create a new light source.  Caller (and extern.h) doesn't need to know
   anything about type 'light_source'. */
export async function new_light_source(x, y, range, type, id) {
    await new_light_core(x, y, range, type, id);
}
/* Create a new light source and return it.  Only used within this file. */
export async function new_light_core(x, y, range, type, id) {
    let ls = null;
    if (range > 15 || range < 0 || (range == 0 && (type != LS_OBJECT || id.a_obj != null))) {
        await impossible("new_light_source:  illegal range %d", range);
        return null;
    }
    ls = alloc(1 /* sizeof(light_source) */);
    /* C poison-before-free dropped — JS memset recursion would destroy id.a_obj (the lamp); see timeout.js note */
    ls.next = game.light_base;
    ls.x = x;
    ls.y = y;
    ls.range = range;
    ls.type = type;
    Object.assign(ls.id, id);
    ls.flags = 0;
    game.light_base = ls;
    game.vision_full_recalc = 1;
    return ls;
}
/* Find and delete a light source.
   Assumes at most one light source is attached to an object at a time. */
export async function del_light_source(type, id) {
    let curr = null;
    let tmp_id = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    Object.assign(tmp_id, cg.zeroany);
    switch (type) {
        /* need to be prepared for dealing a with light source which
       has only been partially restored during a level change
       (in particular: chameleon vs prot. from shape changers) */
        case LS_NONE:
            await impossible("del_light_source:type=none");
            tmp_id.a_uint = 0;
            break;
        case LS_OBJECT:
            tmp_id.a_uint = id.a_obj ? id.a_obj.o_id : 0;
            break;
        case LS_MONSTER:
            tmp_id.a_uint = id.a_monst.m_id;
            break;
        /* cursed artifact, embedded scales */
        default:
            tmp_id.a_uint = 0;
            break;
    }
    for (curr = game.light_base; curr; curr = curr.next) {
        /* find the light source from its id */
        if (curr.type != type) {
            continue;
        }
        if (curr.id.a_obj == ((curr.flags & 2) ? tmp_id.a_obj : id.a_obj)) {
            break;
        }
    }
    if (curr) {
        await delete_ls(curr);
    } else {
        await impossible("del_light_source: not found type=%d, id=%s", type, fmt_ptr(id.a_obj));
    }
}
/* remove a light source from the light_base list and free it */
export async function delete_ls(ls) {
    let curr = null;
    let prev = null;
    for (prev = null , curr = game.light_base; curr; prev = curr , curr = curr.next) {
        if (curr == ls) {
            if (prev) {
                prev.next = curr.next;
            } else {
                game.light_base = curr.next;
            }
            break;
        }
    }
    if (curr) {
        /* pacify static analysis; 'ls' is never Null for
           new_light_core(,,0,LS_OBJECT,&zeroany) */
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        /* C poison-before-free dropped — JS memset recursion would destroy id.a_obj (the lamp); see timeout.js note */
        free(ls);
        game.vision_full_recalc = 1;
    } else {
        await impossible("delete_ls not found, ls=%s", fmt_ptr(ls));
    }
    return;
}
/* Mark locations that are temporarily lit via mobile light sources. */
export function do_light_sources(cs_rows) {
    let x = 0;
    let y = 0;
    let min_x = 0;
    let max_x = 0;
    let max_y = 0;
    let offset = 0;
    let limits = null;
    let at_hero_range = 0;
    let ls = null;
    let row = null;
    for (ls = game.light_base; ls; ls = ls.next) {
        ls.flags &= ~1;
        if (ls.type == LS_OBJECT) {
            /*
         * Check for moved light sources.  It may be possible to
         * save some effort if an object has not moved, but not in
         * the current setup -- we need to recalculate for every
         * vision recalc.
         */
            /* camera flash; caller has set ls->{x,y} */
            if (ls.range == 0 || get_obj_location(ls.id.a_obj, { get value() { return ls.x; }, set value(_v) { ls.x = _v; } }, { get value() { return ls.y; }, set value(_v) { ls.y = _v; } }, 0)) {
                ls.flags |= 1;
            }
        } else if (ls.type == LS_MONSTER) {
            if (get_mon_location(ls.id.a_monst, { get value() { return ls.x; }, set value(_v) { ls.x = _v; } }, { get value() { return ls.y; }, set value(_v) { ls.y = _v; } }, 0)) {
                ls.flags |= 1;
            }
        }
        if (((ls.x) == game.u.ux && (ls.y) == game.u.uy)) {
            if (at_hero_range >= ls.range) {
                ls.flags &= ~1;
            /* minor optimization: don't bother with duplicate light sources
           at hero */
            } else {
                at_hero_range = ls.range;
            }
        }
        if (ls.flags & 1) {
            /*
             * Walk the points in the circle and see if they are
             * visible from the center.  If so, mark'em.
             *
             * Kevin's tests indicated that doing this brute-force
             * method is faster for radius <= 3 (or so).
             */
            limits = circle_start[ls.range]; /* C: limits = &circle_data[circle_start[ls.range]] — carry the index (was collapsed to a scalar, breaking non-hero light sources) */
            if ((max_y = (ls.y + ls.range)) >= 21) {
                max_y = 21 - 1;
            }
            if ((y = (ls.y - ls.range)) < 0) {
                y = 0;
            }
            for (; y <= max_y; y++) {
                row = cs_rows[y];
                offset = circle_data[limits + abs(y - ls.y)]; /* C: limits[abs(y-ls.y)] */
                if ((min_x = (ls.x - offset)) < 1) {
                    min_x = 1;
                }
                if ((max_x = (ls.x + offset)) >= 80) {
                    max_x = 80 - 1;
                }
                if (((ls.x) == game.u.ux && (ls.y) == game.u.uy)) {
                    /*
                     * If the light source is located at the hero, then
                     * we can use the COULD_SEE bits already calculated
                     * by the vision system.  More importantly than
                     * this optimization, is that it allows the vision
                     * system to correct problems with clear_path().
                     * The function clear_path() is a simple LOS
                     * path checker that doesn't go out of its way to
                     * make things look "correct".  The vision system
                     * does this.
                     */
                    for (x = min_x; x <= max_x; x++) {
                        if (row[x] & 1) {
                            row[x] |= 4;
                        }
                    }
                } else {
                    for (x = min_x; x <= max_x; x++) {
                        if ((ls.x == x && ls.y == y) || clear_path(ls.x, ls.y, x, y)) {
                            row[x] |= 4;
                        }
                    }
                }
            }
        }
    }
}
/* lit 'obj' has been thrown or kicked and is passing through x,y on the
   way to its destination; show its light so that hero has a chance to
   remember terrain, objects, and monsters being revealed;
   if 'obj' is Null, <x,y> is being hit by a camera's light flash */
export async function show_transient_light(obj, x, y) {
    let ls = null;
    let cameraflash = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let mon = null;
    let radius_squared = 0;
    if (!obj) {
        /* Null object indicates camera flash */
        /* no need to temporarily light an already lit spot */
        if (game.level.locations[x][y].lit) {
            return;
        }
        Object.assign(cameraflash, cg.zeroany);
        ls = await new_light_core(x, y, 0, LS_OBJECT, cameraflash);
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    } else {
        for (ls = game.light_base; ls; ls = ls.next) {
            /* thrown or kicked object which is emitting light; validate its
           light source to obtain its radius (for monster sightings) */
            if (ls.type != LS_OBJECT) {
                continue;
            }
            if (ls.id.a_obj == obj) {
                break;
            }
        }
        (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
        if (!ls || obj.where != 0) {
            await impossible("transient light %s %s %s not %s?", obj.lamplit ? "lit" : "unlit", await simpleonames(obj), await otense(obj, "are"), !ls ? "a light source" : "free");
            return;
        }
    }
    if (obj) {
        await place_object(obj, game.bhitpos.x, game.bhitpos.y);
    /* put lit candle or lamp temporarily on the map */
    /* camera flash:  no object; directly set light source's location */
    } else {
        ls.x = x , ls.y = y;
    }
    await vision_recalc(0);
    await flush_screen(0);
    radius_squared = ls.range * ls.range;
    for (mon = game.level.monlist; mon; mon = mon.nmon) {
        if (((mon).mhp < 1) || (mon.isgd && !mon.mx)) {
            continue;
        }
        /* [what about worm tails?] */
        if (dist2(mon.mx, mon.my, x, y) <= radius_squared) {
            /* light range is the radius of a circle and we're limiting
           canseemon() to a square enclosing that circle, but setting
           mtemplit 'erroneously' for a seen monster is not a problem;
           it just flags monsters for another canseemon() check when
           'obj' has reached its destination after missile traversal */
            if (canseemon(mon)) {
                mon.mtemplit = 1;
            }
        }
    }
    if (obj) {
        (game.windowprocs.win_delay_output)();
        await remove_object(obj);
    }
}
/* delete any camera flash light sources and draw "remembered, unseen
   monster" glyph at locations where a monster was flagged for being
   visible during transient light movement but can't be seen now */
export async function transient_light_cleanup() {
    let mon = null;
    let mtempcount = 0;
    await discard_flashes();
    if (game.vision_full_recalc) {
        await vision_recalc(0);
    }
    /* for thrown/kicked candle or lamp or for camera flash, some
       monsters may have been mapped in light which has now gone away
       so need to be replaced by "remembered, unseen monster" glyph */
    mtempcount = 0;
    for (mon = game.level.monlist; mon; mon = mon.nmon) {
        if (((mon).mhp < 1)) {
            continue;
        }
        if (mon.mtemplit) {
            mon.mtemplit = 0;
            ++mtempcount;
            if (!(canseemon(mon) || sensemon(mon))) {
                await map_invisible(mon.mx, mon.my);
            }
        }
    }
    if (mtempcount) {
        await flush_screen(0);
    }
}
/* camera flashes have Null object; caller wants to get rid of them now */
export async function discard_flashes() {
    let ls = null;
    let nxt_ls = null;
    for (ls = game.light_base; ls; ls = nxt_ls) {
        nxt_ls = ls.next;
        if (ls.type == LS_OBJECT && !ls.id.a_obj) {
            await delete_ls(ls);
        }
    }
}
/* (mon->mx == 0) implies migrating */
export function find_mid(nid, fmflags) {
    let mtmp = null;
    if ((fmflags & 8) && nid == 1) {
        return game.youmonst;
    }
    if (fmflags & 1) {
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (!((mtmp).mhp < 1) && mtmp.m_id == nid) {
                return mtmp;
            }
        }
    }
    if (fmflags & 2) {
        for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
            if (mtmp.m_id == nid) {
                return mtmp;
            }
        }
    }
    if (fmflags & 4) {
        for (mtmp = game.mydogs; mtmp; mtmp = mtmp.nmon) {
            if (mtmp.m_id == nid) {
                return mtmp;
            }
        }
    }
    return null;
}
export function whereis_mon(mon, fmflags) {
    let mtmp = null;
    if ((fmflags & 8) && mon == game.youmonst) {
        return 8;
    }
    if (fmflags & 1) {
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (mtmp == mon) {
                return 1;
            }
        }
    }
    if (fmflags & 2) {
        for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
            if (mtmp == mon) {
                return 2;
            }
        }
    }
    if (fmflags & 4) {
        for (mtmp = game.mydogs; mtmp; mtmp = mtmp.nmon) {
            if (mtmp == mon) {
                return 4;
            }
        }
    }
    return 0;
}
/* Save all light sources of the given range. */
export async function save_light_sources(nhfp, range) {
    let count = 0;
    let actual = 0;
    let is_global = 0;
    let prev = null;
    let curr = null;
    await discard_flashes();
    game.vision_full_recalc = 0;
    if (((nhfp).mode & (1 | 2))) {
        count = await maybe_write_ls(nhfp, range, (0));
        sfo_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "lightsource-count");
        actual = await maybe_write_ls(nhfp, range, (1));
        if (actual != count) {
            await panic("counted %d light sources, wrote %d! [range=%d]", count, actual, range);
        }
    }
    if (((nhfp).mode & 4)) {
        for (prev = game.light_base; (curr = prev) != null; ) {
            if (!curr.id.a_monst) {
                await impossible("save_light_sources: no id! [range=%d]", range);
                is_global = 0;
            } else {
                switch (curr.type) {
                    case LS_OBJECT:
                        is_global = !await obj_is_local(curr.id.a_obj);
                        break;
                    case LS_MONSTER:
                        is_global = !((curr.id.a_monst).mx > 0);
                        break;
                    default:
                        is_global = 0;
                        await impossible("save_light_sources: bad type (%d) [range=%d]", curr.type, range);
                        break;
                }
            }
            if (is_global ^ (range == 0)) {
                /* if global and not doing local, or vice versa, remove it */
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = curr.next) */;
                /* C poison-before-free dropped (light_source; see above) */
                free(curr);
            } else {
                prev = (prev).next;
            }
        }
    }
}
/* !SFCTOOL */
/*
 * Pull in the structures from disk, but don't recalculate the object
 * pointers.
 */
export function restore_light_sources(nhfp) {
    let count = 0;
    let ls = null;
    sfi_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "lightsource-count");
    ;
    while (count-- > 0) {
        ls = alloc(1 /* sizeof(light_source) */);
        sfi_ls_t(nhfp, ls, "lightsource");
        ls.next = game.light_base;
        game.light_base = ls;
    }
}
/* to support '#stats' wizard-mode command */
export function light_stats(hdrfmt, hdrbuf, count, size) {
    let ls = null;
    hdrbuf = sprintf(hdrbuf, hdrfmt, 1 /* sizeof(light_source) */);
    count.value = size.value = 0;
    for (ls = game.light_base; ls; ls = ls.next) {
        ++count.value;
        size.value += 1 /* sizeof(light_source) */;
    }
}
/* Relink all lights that are so marked. */
export async function relink_light_sources(ghostly) {
    let which = 0;
    let nid = 0;
    let ls = null;
    for (ls = game.light_base; ls; ls = ls.next) {
        if (ls.flags & 2) {
            if (ls.type == LS_OBJECT || ls.type == LS_MONSTER) {
                /*
     * Caveat:
     *  There has been at least one instance during to-be-5.0 development
     *  where the light_base linked list ended up with a circular link.
     *  If that happens, then once all the traversed elements have their
     *  LSF_NEEDS_FIXUP flag cleared, the traversal attempt will run wild.
     *
     *  The circular list instance was blamed on attempting to restore
     *  a save file which should have been invalidated by version/patch/
     *  editlevel verification, but wasn't rejected because EDITLEVEL
     *  didn't get incremented when it should have been.  Valid data should
     *  never produce the problem and it isn't possible in general to guard
     *  against code updates that neglect to set the verification info up
     *  to date.
     */
                nid = ls.id.a_uint;
                if (ghostly && !lookup_id_mapping(nid, { get value() { return nid; }, set value(_v) { nid = _v; } })) {
                    await panic("relink_light_sources: no id mapping");
                }
                which = 0;
                if (ls.type == LS_OBJECT) {
                    if ((ls.id.a_obj = find_oid(nid)) == null) {
                        which = 111;
                    }
                } else {
                    if ((ls.id.a_monst = find_mid(nid, (8 | 1 | 2 | 4))) == null) {
                        which = 109;
                    }
                }
                if (which != 0) {
                    await panic("relink_light_sources: can't find %c_id %u", which, nid);
                }
            } else {
                await panic("relink_light_sources: bad type (%d)", ls.type);
            }
            ls.flags &= ~2;
        }
    }
}
/*
 * Part of the light source save routine.  Count up the number of light
 * sources that would be written.  If write_it is true, actually write
 * the light source out.
 */
export async function maybe_write_ls(nhfp, range, write_it) {
    let count = 0;
    let is_global = 0;
    let ls = null;
    for (ls = game.light_base; ls; ls = ls.next) {
        if (!ls.id.a_monst) {
            await impossible("maybe_write_ls: no id! [range=%d]", range);
            continue;
        }
        switch (ls.type) {
            case LS_OBJECT:
                is_global = !await obj_is_local(ls.id.a_obj);
                break;
            case LS_MONSTER:
                is_global = !((ls.id.a_monst).mx > 0);
                break;
            default:
                is_global = 0;
                await impossible("maybe_write_ls: bad type (%d) [range=%d]", ls.type, range);
                break;
        }
        if (is_global ^ (range == 0)) {
            /* if global and not doing local, or vice versa, count it */
            count++;
            if (write_it) {
                await write_ls(nhfp, ls);
            }
        }
    }
    return count;
}
export async function light_sources_sanity_check() {
    let ls = null;
    let mtmp = null;
    let otmp = null;
    let auint = 0;
    for (ls = game.light_base; ls; ls = ls.next) {
        if (!ls.id.a_monst) {
            await panic("insane light source: no id!");
        }
        if (ls.type == LS_OBJECT) {
            otmp = ls.id.a_obj;
            auint = otmp.o_id;
            if (find_oid(auint) != otmp) {
                await panic("insane light source: can't find obj #%u!", auint);
            }
        } else if (ls.type == LS_MONSTER) {
            mtmp = ls.id.a_monst;
            auint = mtmp.m_id;
            if (find_mid(auint, (8 | 1 | 2 | 4)) != mtmp) {
                await panic("insane light source: can't find mon #%u!", auint);
            }
        } else {
            await panic("insane light source: bad ls type %d", ls.type);
        }
    }
}
/* Write a light source structure to disk. */
export async function write_ls(nhfp, ls) {
    let arg_save = { a_void: 0, a_obj: null, a_monst: null, a_int: 0, a_xint16: 0, a_xint8: 0, a_char: 0, a_schar: 0, a_uchar: 0, a_uint: 0, a_long: 0, a_ulong: 0, a_coordxy: 0, a_iptr: null, a_xint16ptr: null, a_xint8ptr: null, a_lptr: null, a_coordxyptr: null, a_ulptr: null, a_uptr: null, a_string: null, a_nfunc: null, a_mask32: 0, a_int64: 0, a_uint64: 0 };
    let otmp = null;
    let mtmp = null;
    if (ls.type == LS_OBJECT || ls.type == LS_MONSTER) {
        if (ls.flags & 2) {
            sfo_ls_t(nhfp, ls, "lightsource");
        } else {
            /* replace object pointer with id for write, then put back */
            Object.assign(arg_save, ls.id);
            if (ls.type == LS_OBJECT) {
                otmp = ls.id.a_obj;
                Object.assign(ls.id, cg.zeroany);
                ls.id.a_uint = otmp.o_id;
                if (find_oid(ls.id.a_uint) != otmp) {
                    await impossible("write_ls: can't find obj #%u!", ls.id.a_uint);
                    ls.flags |= 4;
                }
            } else {
                let monloc = 0;
                mtmp = ls.id.a_monst;
                if ((monloc = whereis_mon(mtmp, (8 | 1 | 2 | 4))) != 0) {
                    /* The monster pointer has been stashed in the light source
                 * for a while and while there is code meant to clean-up the
                 * light source aspects if a monster goes away, there have
                 * been some reports of light source issues, such as when
                 * going to the planes.
                 *
                 * Verify that the stashed monst pointer is still present
                 * in one of the monster chains before pulling subfield
                 * values such as m_id from it, to avoid any attempt to
                 * pull random m_id value from (now) freed memory.
                 *
                 * find_mid() disregards a DEADMONSTER, but whereis_mon()
                 * does not. */
                    Object.assign(ls.id, cg.zeroany);
                    ls.id.a_uint = mtmp.m_id;
                    if (find_mid(ls.id.a_uint, monloc) != mtmp) {
                        await impossible("write_ls: can't find mon%s #%u!", ((mtmp).mhp < 1) ? " because it's dead" : "", ls.id.a_uint);
                        ls.flags |= 4;
                    }
                } else {
                    await impossible("write_ls: stashed monst ptr not in any chain");
                    ls.flags |= 4;
                }
            }
            if (ls.flags & 4) {}
            ls.flags |= 2;
            sfo_ls_t(nhfp, ls, "lightsource");
            Object.assign(ls.id, arg_save);
            ls.flags &= ~2;
            ls.flags &= ~4;
        }
    } else {
        await impossible("write_ls: bad type (%d)", ls.type);
    }
}
/* Change light source's ID from src to dest. */
export function obj_move_light_source(src, dest) {
    let ls = null;
    for (ls = game.light_base; ls; ls = ls.next) {
        if (ls.type == LS_OBJECT && ls.id.a_obj == src) {
            ls.id.a_obj = dest;
        }
    }
    src.lamplit = 0;
    dest.lamplit = 1;
}
/* return true if there exist any light sources */
export function any_light_source() {
    return (game.light_base != null);
}
/*
 * Snuff an object light source if at (x,y).  This currently works
 * only for burning light sources.
 */
export async function snuff_light_source(x, y) {
    let ls = null;
    let obj = null;
    for (ls = game.light_base; ls; ls = ls.next) {
        if (ls.type == LS_OBJECT && ls.x == x && ls.y == y) {
            /*
         * Is this position check valid??? Can I assume that the positions
         * will always be correct because the objects would have been
         * updated with the last vision update?  [Is that recent enough???]
         */
            obj = ls.id.a_obj;
            if (obj_is_burning(obj)) {
                /* The only way to snuff Sunsword is to unwield it.  Darkness
                 * scrolls won't affect it.  (If we got here because it was
                 * dropped or thrown inside a monster, this won't matter
                 * anyway because it will go out when dropped.)
                 */
                if (artifact_light(obj)) {
                    continue;
                }
                await end_burn(obj, obj.otyp != MAGIC_LAMP);
                /*
                 * The current ls element has just been removed (and
                 * ls->next is now invalid).  Return assuming that there
                 * is only one light source attached to each object.
                 */
                return;
            }
        }
    }
}
/* Return TRUE if object sheds any light at all. */
export function obj_sheds_light(obj) {
    /* so far, only burning objects shed light */
    return obj_is_burning(obj);
}
/* Return TRUE if sheds light AND will be snuffed by end_burn(). */
export function obj_is_burning(obj) {
    return (obj.lamplit && (((obj).otyp == BRASS_LANTERN || (obj).otyp == OIL_LAMP || ((obj).otyp == MAGIC_LAMP && (obj).spe > 0) || (obj).otyp == CANDELABRUM_OF_INVOCATION || (obj).otyp == TALLOW_CANDLE || (obj).otyp == WAX_CANDLE || (obj).otyp == POT_OIL) || artifact_light(obj)));
}
/* copy the light source(s) attached to src, and attach it/them to dest */
export function obj_split_light_source(src, dest) {
    let ls = null;
    let new_ls = null;
    for (ls = game.light_base; ls; ls = ls.next) {
        if (ls.type == LS_OBJECT && ls.id.a_obj == src) {
            /*
             * Insert the new source at beginning of list.  This will
             * never interfere us walking down the list - we are already
             * past the insertion point.
             */
            new_ls = alloc(1 /* sizeof(light_source) */);
            /* light-source-split fix - C struct-copy `*new_ls = *ls`
               for value-copy semantics; the union `id` needs a
               fresh container so subsequent `new_ls.id.a_obj =
               dest` doesn't corrupt ls.id. */
            Object.assign(new_ls, ls);
            new_ls.id = Object.assign({}, ls.id);
            if ((src.otyp == TALLOW_CANDLE || src.otyp == WAX_CANDLE)) {
                /* split candles may emit less light than original group */
                ls.range = candle_light_range(src);
                new_ls.range = candle_light_range(dest);
                game.vision_full_recalc = 1;
            }
            new_ls.id.a_obj = dest;
            new_ls.next = game.light_base;
            game.light_base = new_ls;
            /* now an active light source */
            dest.lamplit = 1;
        }
    }
}
/* light source `src' has been folded into light source `dest';
   used for merging lit candles and adding candle(s) to lit candelabrum */
export async function obj_merge_light_sources(src, dest) {
    let ls = null;
    if (src != dest) {
        await end_burn(src, (1));
    }
    for (ls = game.light_base; ls; ls = ls.next) {
        if (ls.type == LS_OBJECT && ls.id.a_obj == dest) {
            ls.range = candle_light_range(dest);
            game.vision_full_recalc = 1;
            break;
        }
    }
}
/* light source `obj' is being made brighter or dimmer */
export async function obj_adjust_light_radius(obj, new_radius) {
    let ls = null;
    for (ls = game.light_base; ls; ls = ls.next) {
        if (ls.type == LS_OBJECT && ls.id.a_obj == obj) {
            if (new_radius != ls.range) {
                game.vision_full_recalc = 1;
            }
            ls.range = new_radius;
            return;
        }
    }
    await impossible("obj_adjust_light_radius: can't find %s", await xname(obj));
}
/* Candlelight is proportional to the number of candles;
   minimum range is 2 rather than 1 for playability. */
export function candle_light_range(obj) {
    let radius = 0;
    if (obj.otyp == CANDELABRUM_OF_INVOCATION) {
        /*
         *      The special candelabrum emits more light than the
         *      corresponding number of candles would.
         *       1..3 candles, range 2 (minimum range);
         *       4..6 candles, range 3 (normal lamp range);
         *          7 candles, range 4 (bright).
         */
        radius = (obj.spe < 4) ? 2 : (obj.spe < 7) ? 3 : 4;
    } else if ((obj.otyp == TALLOW_CANDLE || obj.otyp == WAX_CANDLE)) {
        /*
         *      Range is incremented quadratically. You can get the same
         *      amount of light as from a lamp with 4 candles, and
         *      even better light with 9 candles, and so on.
         *       1..3  candles, range 2;
         *       4..8  candles, range 3;
         *       9..15 candles, range 4; &c.
         */
        let n = obj.quan;
        /* always incremented at least once */
        radius = 1;
        while (radius * radius <= n && radius < 15) {
            radius++;
        }
    } else {
        /* we're only called for lit candelabrum or candles */
        /* impossible("candlelight for %d?", obj->otyp); */
        radius = 3;
    }
    return radius;
}
/* light emitting artifact's range depends upon its curse/bless state */
export function arti_light_radius(obj) {
    let res = 0;
    /*
     * Used by begin_burn() when setting up a new light source
     * (obj->lamplit will already be set by this point) and
     * also by bless()/unbless()/uncurse()/curse() to decide
     * whether to call obj_adjust_light_radius().
     */
    /* sanity check [simplifies usage by bless()/curse()/&c] */
    if (!obj.lamplit || !artifact_light(obj)) {
        return 0;
    }
    /* cursed radius of 1 is not noticeable for an item that's
       carried by the hero but is if it's carried by a monster
       or left lit on the floor (not applicable for Sunsword) */
    res = (obj.blessed ? 3 : !obj.cursed ? 2 : 1);
    /* if poly'd into gold dragon with embedded scales, make the scales
       have minimum radiance (hero as light source will use light radius
       based on monster form); otherwise, worn gold DSM gives off more
       light than other light sources */
    if (obj == game.uskin) {
        res = 1;
    } else if (obj.otyp == GOLD_DRAGON_SCALE_MAIL) {
        ++res;
    }
    return res;
}
/* adverb describing lit artifact's light; radius varies depending upon
   curse/bless state; also used for gold dragon scales/scale mail */
export function arti_light_description(obj) {
    switch (arti_light_radius(obj)) {
        case 4:
            return "radiantly";
        /* blessed gold dragon scale mail */
        case 3:
            return "brilliantly";
        /* blessed artifact, uncursed gold DSM */
        case 2:
            return "brightly";
        /* uncursed artifact, cursed gold DSM */
        case 1:
            return "dimly";
        default:
            break;
    }
    return "strangely";
}
/* the #lightsources command */
export async function wiz_light_sources() {
    let win = 0;
    let buf = '';
    let ls = null;
    win = (game.windowprocs.win_create_nhwindow)(4);
    if (win == (-1)) {
        return 0;
    }
    buf = sprintf(buf, "Mobile light sources: hero @ (%2d,%2d)", game.u.ux, game.u.uy);
    (game.windowprocs.win_putstr)(win, 0, buf);
    (game.windowprocs.win_putstr)(win, 0, "");
    if (game.light_base) {
        (game.windowprocs.win_putstr)(win, 0, "location range flags  type    id");
        (game.windowprocs.win_putstr)(win, 0, "-------- ----- ------ ----  -------");
        for (ls = game.light_base; ls; ls = ls.next) {
            buf = sprintf(buf, "  %2d,%2d   %2d   0x%04x  %s  %s", ls.x, ls.y, ls.range, ls.flags, (ls.type == LS_OBJECT ? "obj" : ls.type == LS_MONSTER ? (((ls.id.a_monst).mx > 0) ? "mon" : (ls.id.a_monst == game.youmonst) ? "you" : "<m>") : "???"), fmt_ptr(ls.id.a_void));
            (game.windowprocs.win_putstr)(win, 0, buf);
        }
    } else {
        (game.windowprocs.win_putstr)(win, 0, "<none>");
    }
    await (game.windowprocs.win_display_nhwindow)(win, (0));
    (game.windowprocs.win_destroy_nhwindow)(win);
    return 0;
}
/* !SFCTOOL */
/* for 'onefile' processing where end of this file isn't necessarily the
   end of the source code seen by the compiler */
/*light.c*/
/* camera flash uses radius 0 and passes Null object */
/* radius 0 will just light <x,y>; cameraflash.a_obj is Null */
/* necessary condition to get into this 'else' */
/* full recalc; runs do_light_sources() */
/* take thrown/kicked candle or lamp off the map */
/* in case we're cleaning up a camera flash, remove all object light
       sources which aren't associated with a specific object */
/* set by del_light_source() */
/* camera flash light sources have Null object and would trigger
       impossible("no id!") below; they can only happen here if we're
       in the midst of a panic save and they wouldn't be useful after
       restore so just throw any that are present away */
/* TODO: cleanup this ls, or skip writing it */
/* src == dest implies adding to candelabrum */
