/* NetHack 5.0	worm.c	$NHDT-Date: 1652689653 2022/05/16 08:27:33 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.56 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2009. */
/* NetHack may be freely redistributed.  See license for details. */
/* worm segment structure */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, pline } from '../c2js-runtime/pline.js';
import { isok } from './cmd.js';
import { canseemon, newsym, sensemon, show_glyph } from './display.js';
import { Monnam, mon_nam } from './do_name.js';
import { dist2, distmin, s_suffix } from './hacklib.js';
import { clone_mon } from './makemon.js';
import { mattacku } from './mhitu.js';
import { mcalcmove } from './mon.js';
import { FEMALE, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, HALLUC, HALLUC_RES, MALE, NON_PM, NUMMONS, PM_LONG_WORM, PM_LONG_WORM_TAIL } from './nh-constants.js';
import { d, rn2, rn2_on_display_rng, rnd } from './rnd.js';
import { sfi_int, sfi_int16, sfi_long, sfo_int, sfo_int16, sfo_long } from './sfbase.js';
import { rnd_nextto_goodpos } from './trap.js';

// struct wseg: { nseg, wx, wy }
/* the segment's position */
/* may return NULL */
/* !SFCTOOL */
/*  Description of long worm implementation.
 *
 *  Each monst struct of the head of a tailed worm has a wormno set to
 *                      1 <= wormno < MAX_NUM_WORMS
 *  If wormno == 0 this does not mean that the monster is not a worm,
 *  it just means that the monster does not have a long worm tail.
 *
 *  The actual segments of a worm are not full-blown monst structs.
 *  They are small wseg structs, and their position in the levels.monsters[][]
 *  array is held by the monst struct of the head of the worm.  This makes
 *  things like probing and hit point bookkeeping much easier.
 *
 *  The segments of the long worms on a level are kept as an array of
 *  singly threaded linked lists.  The wormno variable is used as an index
 *  for these segment arrays.
 *
 *  wtails:     The first (starting struct) of a linked list.  This points
 *              to the tail (last) segment of the worm.
 *
 *  wheads:     The last (end) of a linked list of segments.  This points to
 *              the segment that is at the same position as the real monster
 *              (the head).  Note that the segment that wheads[wormno] points
 *              to is not displayed.  It is simply there to keep track of
 *              where the head came from, so that worm movement and display
 *              are simplified later.
 *              Keeping the head segment of the worm at the end of the list
 *              of tail segments is an endless source of confusion, but it is
 *              necessary.
 *              From now on, we will use "start" and "end" to refer to the
 *              linked list and "head" and "tail" to refer to the worm.
 *
 *  One final worm array is:
 *
 *  wgrowtime:  This tells us when to add another segment to the worm.
 *
 *  When a worm is moved, we add a new segment at the head, and delete the
 *  segment at the tail (unless we want it to grow).  This new head segment is
 *  located in the same square as the actual head of the worm.  If we want
 *  to grow the worm, we don't delete the tail segment, and we give the worm
 *  extra hit points, which possibly go into its maximum.
 *
 *  Non-moving worms (worm_nomove) are assumed to be surrounded by their own
 *  tail, and, thus, shrink instead of grow (as their tails keep going while
 *  their heads are stopped short).  In this case, we delete the last tail
 *  segment, and remove hit points from the worm.
 */
/* restart: worm removal resets these so they don't need to be incorporated
   into 'struct instance_globals g' for potential reinitialization provided
   that old game disposes of monsters properly before starting a new one */
game.wheads = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
game.wtails = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
game.wgrowtime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
/*
 *  get_wormno()
 *
 *  Find an unused worm tail slot and return the index.  A zero means that
 *  there are no slots available.  This means that the worm head can exist,
 *  it just cannot ever grow a tail.
 *
 *  It, also, means that there is an optimization to made.  The [0] positions
 *  of the arrays are never used.  Meaning, we really *could* have one more
 *  tailed worm on the level, or use a smaller array (using wormno - 1).
 *
 *  Implementation is left to the interested hacker.
 */
export function get_wormno() {
    let new_wormno = 1;
    while (new_wormno < 32) {
        if (!game.wheads[new_wormno]) {
            return new_wormno;
        }
        /* found empty wtails[] slot at new_wormno */
        new_wormno++;
    }
    /* level infested with worms */
    /* your passive ability killed the worm */
    return 0;
}
/*
 *  initworm()
 *
 *  Use if (mon->wormno = get_wormno()) before calling this function!
 *
 *  Initialize the worm entry.  This will set up the worm grow time, and
 *  create and initialize the dummy segment for wheads[] and wtails[].
 *
 *  If the worm has no tail (ie get_wormno() fails) then this function
 *  need not be called.
 */
export function initworm(worm, wseg_count) {
    let seg = null;
    let new_tail = create_worm_tail(wseg_count);
    let wnum = worm.wormno;
    if (new_tail) {
        game.wtails[wnum] = new_tail;
        for (seg = new_tail; seg.nseg; seg = seg.nseg) {
            continue;
        }
        game.wheads[wnum] = seg;
    } else {
        game.wtails[wnum] = game.wheads[wnum] = seg = alloc(1 /* sizeof(struct wseg) */);
        seg.nseg = null;
    }
    seg.wx = worm.mx;
    seg.wy = worm.my;
    game.wgrowtime[wnum] = 0;
}
/*
 *  toss_wsegs()
 *
 *  Get rid of all worm segments on and following the given pointer curr.
 *  The display may or may not need to be updated as we free the segments.
 */
export async function toss_wsegs(curr, display_update) {
    let nxtseg = null;
    while (curr) {
        nxtseg = curr.nseg;
        if (curr.wx) {
            game.level.monsters[curr.wx][curr.wy] = null;
            if (display_update) {
                await newsym(curr.wx, curr.wy);
            }
        }
        free((curr));
        /* free memory used by the segment */
        curr = nxtseg;
    }
}
/*
 *  shrink_worm()
 *
 *  Remove the tail segment of the worm (the starting segment of the list).
 */
/* worm number */
export async function shrink_worm(wnum) {
    let seg = null;
    if (game.wtails[wnum] == game.wheads[wnum]) {
        return;
    }
    seg = game.wtails[wnum];
    game.wtails[wnum] = seg.nseg;
    seg.nseg = null;
    await toss_wsegs(seg, (1));
}
/*
 *  worm_move()
 *
 *  Check for mon->wormno before calling this function!
 *
 *  Move the worm.  Maybe grow.
 */
export async function worm_move(worm) {
    let seg = null;
    let new_seg = null;
    let wnum = worm.wormno;
    /*
     *  Place a segment at the old worm head.  The head has already moved.
     */
    seg = game.wheads[wnum];
    game.level.monsters[seg.wx][seg.wy] = worm;
    await newsym(seg.wx, seg.wy);
    /*
     *  Create a new dummy segment head and place it at the end of the list.
     */
    new_seg = alloc(1 /* sizeof(struct wseg) */);
    new_seg.wx = worm.mx;
    new_seg.wy = worm.my;
    new_seg.nseg = null;
    /* attach it to the end of the list */
    seg.nseg = new_seg;
    game.wheads[wnum] = new_seg;
    if (game.wgrowtime[wnum] <= game.moves) {
        let whplimit = 0;
        let whpcap = 0;
        let prev_mhp = 0;
        let wsegs = count_wsegs(worm);
        if (!game.wgrowtime[wnum]) {
            /* first set up for the next time to grow */
            /* new worm; usually grow a tail segment on its next turn */
            game.wgrowtime[wnum] = game.moves + rnd(5);
        } else {
            let mmove = mcalcmove(worm, (0));
            let incr = (rn2(10) + (2));
            /* 2..12; after adjusting for long worn
                                    * speed of 3, effective value is 8..48 */
            incr = Math.trunc((incr * 12) / (((mmove) > (1) ? (mmove) : (1))));
            game.wgrowtime[wnum] = game.moves + incr;
        }
        /* increase HP based on number of segments; if it has shrunk, it
           won't gain new HP until regaining previous peak segment count;
           when wounded (whether from damage or from shrinking), the HP
           which might have been 'new' will heal */
        whplimit = !worm.m_lev ? 4 : (8 * worm.m_lev);
        /* note: wsegs includes the hidden segment co-located with the head */
        if (wsegs > 33) {
            whplimit += 2 * (wsegs - 33) , wsegs = 33;
        }
        if (wsegs > 22) {
            whplimit += 4 * (wsegs - 22) , wsegs = 22;
        }
        if (wsegs > 11) {
            whplimit += 6 * (wsegs - 11) , wsegs = 11;
        }
        whplimit += 8 * wsegs;
        if (whplimit > 500) {
            whplimit = 500;
        }
        prev_mhp = worm.mhp;
        worm.mhp += d(2, 2);
        whpcap = ((whplimit) > (worm.mhpmax) ? (whplimit) : (worm.mhpmax));
        if (worm.mhp < whpcap) {
            /* can't exceed segment-derived limit unless level increase after
               peak tail growth has already done so; when that isn't the case,
               if segment growth exceeds current max HP then increase it */
            if (worm.mhp > whplimit) {
                worm.mhp = ((prev_mhp) > (whplimit) ? (prev_mhp) : (whplimit));
            }
            if (worm.mhp > worm.mhpmax) {
                worm.mhpmax = worm.mhp;
            }
        } else {
            if (worm.mhp > worm.mhpmax) {
                worm.mhp = worm.mhpmax;
            }
        }
    } else {
        await shrink_worm(wnum);
    }
}
/*
 *  worm_nomove()
 *
 *  Check for mon->wormno before calling this function!
 *
 *  The worm doesn't move, so it should shrink.
 */
export async function worm_nomove(worm) {
    await shrink_worm(worm.wormno);
    if (worm.mhp > count_wsegs(worm)) {
        /* 2..4, average 3; note: mhpmax not changed! */
        worm.mhp -= d(2, 2);
        if (worm.mhp < 1) {
            worm.mhp = 1;
        }
    }
}
/*
 *  wormgone()
 *
 *  Kill a worm tail.  Also takes the head off the map.  Caller needs to
 *  keep track of what its coordinates were if planning to put it back.
 *
 *  Should only be called when mon->wormno is non-zero.
 */
export async function wormgone(worm) {
    let wnum = worm.wormno;
    if (!wnum) {
        await impossible("wormgone: wormno is 0");
    }
    /* still a long worm but doesn't grow/shrink anymore */
    worm.wormno = 0;
    await toss_wsegs(game.wtails[wnum], (1));
    (game.wtails[wnum] = null, game.wheads[wnum] = null);
    game.wgrowtime[wnum] = 0;
    /* we don't expect to encounter this here but check for it anyway;
       when a long worm gets created by a polymorph zap, it gets flagged
       with MCORPSENM()==PM_LONG_WORM so that the same zap won't trigger
       another polymorph if it hits the new tail */
    if (worm.data == game.mons[PM_LONG_WORM] && ((worm).mextra && ((worm).mextra.mcorpsenm) != NON_PM)) {
        ((worm).mextra.mcorpsenm) = NON_PM;
    }
}
/*
 *  wormhitu()
 *
 *  Check for mon->wormno before calling this function!
 *
 *  If the hero is near any part of the worm, the worm will try to attack.
 *  Returns 1 if the worm dies (poly'd hero with passive counter-attack)
 *  or 0 if it doesn't.
 */
export async function wormhitu(worm) {
    let wnum = worm.wormno;
    let seg = null;
    /*  This does not work right now because mattacku() thinks that the head
     *  is out of range of the player.  We might try to kludge, and bring
     *  the head within range for a tiny moment, but this needs a bit more
     *  looking at before we decide to do this.
     *
     *  Head has already had a chance to attack, so the dummy tail segment
     *  sharing its location should be skipped.
     */
    for (seg = game.wtails[wnum]; seg != game.wheads[wnum]; seg = seg.nseg) {
        if (dist2((seg.wx), (seg.wy), game.u.ux, game.u.uy) < 3) {
            if (await mattacku(worm)) {
                return 1;
            }
        }
    }
    return 0;
}
/*  cutworm()
 *
 *  Check for mon->wormno before calling this function!
 *
 *  When hitting a worm (worm) at position x, y, with a weapon (weap),
 *  there is a chance that the worm will be cut in half, and a chance
 *  that both halves will survive.
 */
/* hit is by wielded blade or axe or by thrown axe */
export async function cutworm(worm, x, y, cuttier) {
    let curr = null;
    let new_tail = null;
    let new_worm = null;
    let wnum = worm.wormno;
    let cut_chance = 0;
    let new_wnum = 0;
    if (!wnum) {
        return;
    }
    if (x == worm.mx && y == worm.my) {
        return;
    }
    /* cutting goes best with a cuttier weapon */
    /* Normally     1-16 does not cut, 17-20 does, */
    cut_chance = rnd(20);
    if (cuttier) {
        cut_chance += 10;
    }
    /* with a blade 1- 6 does not cut,  7-20 does. */
    if (cut_chance < 17) {
        return;
    }
    /* Find the segment that was attacked. */
    curr = game.wtails[wnum];
    while ((curr.wx != x) || (curr.wy != y)) {
        curr = curr.nseg;
        if (!curr) {
            await impossible("cutworm: no segment at (%d,%d)", x, y);
            return;
        }
    }
    if (curr == game.wtails[wnum]) {
        await shrink_worm(wnum);
        return;
    }
    /*
     *  Split the worm.  The tail for the new worm is the old worm's tail.
     *  The tail for the old worm is the segment that follows "curr",
     *  and "curr" becomes the dummy segment under the new head.
     */
    new_tail = game.wtails[wnum];
    game.wtails[wnum] = curr.nseg;
    curr.nseg = null;
    /*
     *  At this point, the old worm is correct.  Any new worm will have
     *  its head at "curr" and its tail at "new_tail".  The old worm
     *  must be at least level 3 in order to produce a new worm.
     */
    new_worm = null;
    new_wnum = (worm.m_lev >= 3 && !rn2(3)) ? get_wormno() : 0;
    if (new_wnum) {
        game.level.monsters[x][y] = null;
        new_worm = await clone_mon(worm, x, y);
    }
    if (!new_worm) {
        game.level.monsters[x][y] = worm;
        if (game.context.mon_moving) {
            /* Sometimes the tail end dies. */
            /* place the "head" segment back */
            if ((canseemon(worm) || sensemon(worm))) {
                await pline("Part of %s tail has been cut off.", s_suffix(await mon_nam(worm)));
            }
        } else {
            await You("cut part of the tail off of %s.", await mon_nam(worm));
        }
        await toss_wsegs(new_tail, (1));
        if (worm.mhp > 1) {
            worm.mhp = Math.trunc(worm.mhp / 2);
        }
        return;
    }
    new_worm.wormno = new_wnum;
    /* treat second worm as a normal monster */
    new_worm.mcloned = 0;
    /* Devalue the monster level of both halves of the worm.
       Note: m_lev is always at least 3 in order to get this far. */
    worm.m_lev = ((worm.m_lev - 2) > (3) ? (worm.m_lev - 2) : (3));
    new_worm.m_lev = worm.m_lev;
    /* Calculate the lower-level mhp; use <N>d8 for long worms.
       Can't use newmonhp() here because it would reset m_lev. */
    new_worm.mhpmax = new_worm.mhp = d(new_worm.m_lev, 8);
    worm.mhpmax = d(worm.m_lev, 8);
    if (worm.mhpmax < worm.mhp) {
        worm.mhp = worm.mhpmax;
    }
    /* We've got all the info right now */
    game.wtails[new_wnum] = new_tail;
    /* so we can do this faster than    */
    game.wheads[new_wnum] = curr;
    /* trying to call initworm().       */
    game.wgrowtime[new_wnum] = 0;
    await place_wsegs(new_worm, worm);
    if (game.context.mon_moving) {
        await pline("%s is cut in half.", await Monnam(worm));
    } else {
        await You("cut %s in half.", await mon_nam(worm));
    }
}
/*
 *  see_wsegs()
 *
 *  Refresh all of the segments of the given worm.  This is only called
 *  from see_monster() in display.c or when a monster goes minvis.  It
 *  is located here for modularity.
 */
export async function see_wsegs(worm) {
    let curr = game.wtails[worm.wormno];
    while (curr != game.wheads[worm.wormno]) {
        await newsym(curr.wx, curr.wy);
        curr = curr.nseg;
    }
}
/*
 *  detect_wsegs()
 *
 *  Display all of the segments of the given worm for detection.
 */
export async function detect_wsegs(worm, use_detection_glyph) {
    let num = 0;
    let curr = game.wtails[worm.wormno];
    let what_tail = ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : PM_LONG_WORM_TAIL);
    while (curr != game.wheads[worm.wormno]) {
        num = use_detection_glyph ? ((what_tail) + (((worm.female ? FEMALE : MALE) == MALE) ? GLYPH_DETECT_MALE_OFF : GLYPH_DETECT_FEM_OFF)) : worm.mtame ? ((what_tail) + (((worm.female ? FEMALE : MALE) == MALE) ? GLYPH_PET_MALE_OFF : GLYPH_PET_FEM_OFF)) : ((what_tail) + (((worm.female ? FEMALE : MALE) == MALE) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF));
        await show_glyph(curr.wx, curr.wy, num);
        curr = curr.nseg;
    }
}
/*
 *  save_worm()
 *
 *  Save the worm information for later use.  The count is the number
 *  of segments, including the dummy.  Called from save.c.
 */
export function save_worm(nhfp) {
    let i = 0;
    let count = 0;
    let curr = null;
    let temp = null;
    if (((nhfp).mode & (1 | 2))) {
        for (i = 1; i < 32; i++) {
            for (count = 0 , curr = game.wtails[i]; curr; curr = curr.nseg) {
                count++;
            }
            sfo_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "worm-segment_count");
            if (count) {
                /* Save segment locations of the monster. */
                for (curr = game.wtails[i]; curr; curr = curr.nseg) {
                    sfo_int16(nhfp, { get value() { return (curr.wx); }, set value(_v) { (curr.wx) = _v; } }, "worm-wx");
                    sfo_int16(nhfp, { get value() { return (curr.wy); }, set value(_v) { (curr.wy) = _v; } }, "worm-wy");
                }
            }
        }
        for (i = 0; i < 32; ++i) {
            sfo_long(nhfp, { get value() { return game.wgrowtime[i]; }, set value(_v) { game.wgrowtime[i] = _v; } }, "worm-wgrowtime");
        }
        ;
    }
    if (((nhfp).mode & 4)) {
        for (i = 1; i < 32; i++) {
            /* Free the segments only.  savemonchn() will take care of the
         * monsters. */
            if (!(curr = game.wtails[i])) {
                continue;
            }
            while (curr) {
                temp = curr.nseg;
                free((curr));
                curr = temp;
            }
            (game.wtails[i] = null, game.wheads[i] = null);
            game.wgrowtime[i] = 0;
        }
    }
}
/* !SFCTOOL */
/*
 *  rest_worm()
 *
 *  Restore the worm information from the save file.  Called from restore.c
 */
export function rest_worm(nhfp) {
    let i = 0;
    let j = 0;
    let count = 0;
    let curr = null;
    let temp = null;
    for (i = 1; i < 32; i++) {
        sfi_int(nhfp, { get value() { return count; }, set value(_v) { count = _v; } }, "worm-segment_count");
        ;
        for (curr = null , j = 0; j < count; j++) {
            temp = alloc(1 /* sizeof(struct wseg) */);
            temp.nseg = null;
            sfi_int16(nhfp, { get value() { return (temp.wx); }, set value(_v) { (temp.wx) = _v; } }, "worm-wx");
            sfi_int16(nhfp, { get value() { return (temp.wy); }, set value(_v) { (temp.wy) = _v; } }, "worm-wy");
            if (curr) {
                curr.nseg = temp;
            } else {
                game.wtails[i] = temp;
            }
            curr = temp;
        }
        game.wheads[i] = curr;
    }
    for (i = 0; i < 32; ++i) {
        sfi_long(nhfp, { get value() { return game.wgrowtime[i]; }, set value(_v) { game.wgrowtime[i] = _v; } }, "worm-wgrowtime");
        ;
    }
}
/*
 *  place_wsegs()
 *
 *  Place the segments of the given worm.  Called from restore.c
 *  and from replmon() in mon.c.
 *  If oldworm is not NULL, assumes the oldworm segments are on map
 *  in the same location as worm segments
 */
export async function place_wsegs(worm, oldworm) {
    let curr = game.wtails[worm.wormno];
    while (curr != game.wheads[worm.wormno]) {
        let x = curr.wx;
        let y = curr.wy;
        let mtmp = (game.level.monsters[x][y]);
        if (oldworm && mtmp == oldworm) {
            game.level.monsters[x][y] = null;
        } else if (mtmp) {
            await impossible("placing worm seg <%d,%d> over another mon", x, y);
        } else if (oldworm) {
            await impossible("replacing worm seg <%d,%d> on empty spot", x, y);
        }
        game.level.monsters[x][y] = worm;
        curr = curr.nseg;
    }
    /* head segment is co-located with worm itself so not placed on the map */
    curr.wx = worm.mx , curr.wy = worm.my;
}
/* called from mon_sanity_check(mon.c) */
export async function sanity_check_worm(worm) {
    let curr = null;
    let wnum = 0;
    let x = 0;
    let y = 0;
    if (!worm) {
        await impossible("worm_sanity: null monster!");
        return;
    }
    if (!worm.wormno) {
        await impossible("worm_sanity: not a worm!");
        return;
    }
    wnum = worm.wormno;
    if (!game.wtails[wnum] || !game.wheads[wnum]) {
        await impossible("wormno %d is set without proper tail", wnum);
        return;
    }
    /* if worm is migrating, we can't check its segments against the map */
    if (!worm.mx) {
        return;
    }
    curr = game.wtails[wnum];
    while (curr != game.wheads[wnum]) {
        x = curr.wx , y = curr.wy;
        if (!isok(x, y)) {
            await impossible("worm seg not isok <%d,%d>", x, y);
        } else if (game.level.monsters[x][y] != worm) {
            await impossible("mon (%s) at seg location is not worm (%s)", fmt_ptr(game.level.monsters[x][y]), fmt_ptr(worm));
        }
        curr = curr.nseg;
    }
}
/* called from mon_sanity_check(mon.c) */
export function wormno_sanity_check() { /* checking tail management, not a particular monster; since wormno==0
       means 'not a worm', wheads[0] and wtails[0] should always be empty;
       note: if erroneously non-Null, tail segment count will include the
       extra segment for the worm's head that isn't shown on the map */ }
/*
 *  remove_worm()
 *
 *  This function is equivalent to the remove_monster #define in
 *  rm.h, only it will take the worm *and* tail out of the levels array.
 *  It does not get rid of (dealloc) the worm tail structures, and it does
 *  not remove the mon from the fmon chain.
 */
export async function remove_worm(worm) {
    let curr = game.wtails[worm.wormno];
    while (curr) {
        if (curr.wx) {
            game.level.monsters[curr.wx][curr.wy] = null;
            await newsym(curr.wx, curr.wy);
            curr.wx = 0;
        }
        curr = curr.nseg;
    }
}
/*
 *  place_worm_tail_randomly()
 *
 *  Place a worm tail somewhere on a level behind the head.
 *  This routine essentially reverses the order of the wsegs from head
 *  to tail while placing them.
 *  x, and y are most likely the worm->mx, and worm->my, but don't *need* to
 *  be, if somehow the head is disjoint from the tail.
 */
export async function place_worm_tail_randomly(worm, x, y) {
    let wnum = worm.wormno;
    let curr = game.wtails[wnum];
    let new_tail = null;
    let ox = x;
    let oy = y;
    if (wnum && (!game.wtails[wnum] || !game.wheads[wnum])) {
        await impossible("place_worm_tail_randomly: wormno is set without a tail!");
        return;
    }
    if (game.wtails[wnum] == game.wheads[wnum]) {
        if (curr.wx && (curr.wx != worm.mx || curr.wy != worm.my)) {
            await impossible("place_worm_tail_randomly: tail segment at <%d,%d>, worm at <%d,%d>", curr.wx, curr.wy, worm.mx, worm.my);
            if ((game.level.monsters[curr.wx][curr.wy]) == worm) {
                game.level.monsters[curr.wx][curr.wy] = null;
            }
        }
        curr.wx = worm.mx , curr.wy = worm.my;
        return;
    }
    /* remove head segment from map in case we end up calling toss_wsegs();
       if it doesn't get tossed, it will become the final tail segment and
       get new coordinates */
    game.wheads[wnum].wx = game.wheads[wnum].wy = 0;
    (new_tail = curr, game.wheads[wnum] = curr);
    curr = curr.nseg;
    new_tail.nseg = null;
    new_tail.wx = x;
    new_tail.wy = y;
    while (curr) {
        let nx = ox;
        let ny = oy;
        if (await rnd_nextto_goodpos({ get value() { return nx; }, set value(_v) { nx = _v; } }, { get value() { return ny; }, set value(_v) { ny = _v; } }, worm)) {
            game.level.monsters[nx][ny] = worm;
            curr.wx = (ox = nx);
            curr.wy = (oy = ny);
            game.wtails[wnum] = curr;
            curr = curr.nseg;
            game.wtails[wnum].nseg = new_tail;
            new_tail = game.wtails[wnum];
            await newsym(nx, ny);
        } else {
            await toss_wsegs(curr, (0));
            curr = null;
        }
    }
}
/*
 * Given a coordinate x, y.
 * return in *nx, *ny, the coordinates of one of the <= 8 squares adjoining.
 *
 * This function, and the loop it serves, could be eliminated by coding
 * enexto() with a search radius.
 */
/* extreme left ? */
/* extreme right ? */
/* neither, so +1, 0, or -1 */
/* right edge, use -1 or 0 */
/* left edge, use 0 or 1 */
/* if x has changed, do same thing with y */
/* y==0 is ok (x==0 is not) */
/* when x has remained the same, force y to change */
/* not at edge, so +1 or -1 */
/* bottom, use -1 */
/* top, use +1 */
/* for size_monst(cmd.c) to support #stats */
export function size_wseg(worm) {
    return (count_wsegs(worm) * 1 /* sizeof(struct wseg) */);
}
/*  count_wsegs()
 *  returns the number of segments that a worm has.
 */
export function count_wsegs(mtmp) {
    let i = 0;
    let curr = null;
    if (mtmp.wormno) {
        for (curr = game.wtails[mtmp.wormno].nseg; curr; curr = curr.nseg) {
            i++;
        }
    }
    return i;
}
/*  create_worm_tail()
 *  will create a worm tail chain of (num_segs + 1) and return pointer to it.
 */
export function create_worm_tail(num_segs) {
    let i = 0;
    let new_tail = null;
    let curr = null;
    if (!num_segs) {
        return null;
    }
    new_tail = curr = alloc(1 /* sizeof(struct wseg) */);
    curr.nseg = null;
    curr.wx = 0;
    curr.wy = 0;
    while (i < num_segs) {
        curr.nseg = alloc(1 /* sizeof(struct wseg) */);
        curr = curr.nseg;
        curr.nseg = null;
        curr.wx = 0;
        curr.wy = 0;
        i++;
    }
    return new_tail;
}
/*  worm_known()
 *  Is any segment of this worm in viewing range?  Note: caller must check
 *  invisibility and telepathy (which should only show the head anyway).
 *  Mostly used in the canseemon() macro.
 */
export function worm_known(worm) {
    let curr = game.wtails[worm.wormno];
    while (curr) {
        if (((game.viz_array[curr.wy][curr.wx] & 2) != 0)) {
            return (1);
        }
        curr = curr.nseg;
    }
    /* should never reach here... */
    return (0);
}
/* would moving from <x1,y1> to <x2,y2> involve passing between two
   consecutive segments of the same worm? */
export async function worm_cross(x1, y1, x2, y2) {
    let worm = null;
    let curr = null;
    let wnxt = null;
    if (distmin(x1, y1, x2, y2) != 1) {
        await impossible("worm_cross checking for non-adjacent location?");
        return (0);
    }
    /* attempting to pass between worm segs is only relevant for diagonal */
    if (x1 == x2 || y1 == y2) {
        return (0);
    }
    /* is the same monster at <x1,y2> and at <x2,y1>? */
    worm = (game.level.monsters[x1][y2]);
    if (!worm || (game.level.monsters[x2][y1]) != worm) {
        return (0);
    }
    for (curr = game.wtails[worm.wormno]; curr; curr = wnxt) {
        /* same monster is at both adjacent spots, so must be a worm; we need
       to figure out if the two spots are occupied by consecutive segments */
        wnxt = curr.nseg;
        if (!wnxt) {
            break;
        }
        /* no next segment; can't continue */
        /* we don't know which of <x1,y2> or <x2,y1> we'll hit first, but
           whichever it is, they're consecutive iff next seg is the other */
        if (curr.wx == x1 && curr.wy == y2) {
            return (wnxt.wx == x2 && wnxt.wy == y1);
        }
        if (curr.wx == x2 && curr.wy == y1) {
            return (wnxt.wx == x1 && wnxt.wy == y2);
        }
    }
    return (0);
}
/* construct an index number for a worm tail segment */
export function wseg_at(worm, x, y) {
    let res = 0;
    if (worm && worm.wormno && (game.level.monsters[x][y]) == worm) {
        let curr = null;
        let i = 0;
        let n = 0;
        let wx = x;
        let wy = y;
        for (i = 0 , curr = game.wtails[worm.wormno]; curr; curr = curr.nseg) {
            if (curr.wx == wx && curr.wy == wy) {
                break;
            }
            ++i;
        }
        for (n = i; curr; curr = curr.nseg) {
            ++n;
        }
        res = n - i;
    }
    return res;
}
export function flip_worm_segs_vertical(worm, miny, maxy) {
    let curr = game.wtails[worm.wormno];
    while (curr) {
        curr.wy = (maxy - curr.wy + miny);
        curr = curr.nseg;
    }
}
export function flip_worm_segs_horizontal(worm, minx, maxx) {
    let curr = game.wtails[worm.wormno];
    while (curr) {
        curr.wx = (maxx - curr.wx + minx);
        curr = curr.nseg;
    }
}
export async function redraw_worm(worm) {
    let curr = game.wtails[worm.wormno];
    while (curr) {
        await newsym(curr.wx, curr.wy);
        curr = curr.nseg;
    }
}
/* !SFCTOOL */
/*worm.c*/
/* remove from level.monsters[][];
           need to check curr->wx for genocided while migrating_mon */
/* update screen before deallocation */
/* prior to 5.0.0,, next-grow increment was 3..17 but since
                   it got checked every 4th turn when the speed 3 worm got
                   to move, it was effectively 0..5; also, its usage was
                   'wgrowtime += incr', so often 'wgrowtime' would be
                   exceeded by 'moves' on consecutive turns for the worm,
                   resulting in an excessively rapid growth cycle */
/* The worm doesn't grow, so the last segment goes away.
           (Done after inserting an extra segment at the head, so it
           isn't getting smaller here, just changing location without
           having to move any of the intermediate segments.) */
/* note: continuing with wnum==0 runs to completion */
/*
     *  This will also remove the real monster (ie 'w') from the its
     *  position in level.monsters[][].  (That happens when removing
     *  the hidden tail segment which is co-located with the head.)
     */
/* no longer polymorph-proof */
/* If this is the tail segment, then the worm just loses it. */
/* clone_mon puts new head here */
/* clone_mon() will fail if enough long worms have been
           created to have them be marked as extinct or if the hit
           that cut the current one has dropped it down to 1 HP */
/* Place the new monster at all the segment locations. */
/* note: wormno can't be less than 0 (unsigned bit field) and can't
       be greater that MAX_NUM_WORMS - 1 (which uses all available bits)
       so checking for 0 is all we can manage for wormno validation;
       since caller has already done that, this is rather pointless... */
/* single segment, co-located with worm;
           should either have same coordinates or have seg->wx==0
           to indicate that it is not currently on the map */
/* Oops.  Truncate because there is no place for rest of it. */
/*
     * With digits representing relative sequence number of the segments,
     * returns true when testing between @ and ? (passes through worm's
     * body), false between @ and ! (stays on same side of worm).
     *  .w1?..
     *  ..@2..
     *  .65!3.
     *  ...4..
     */
