/* NetHack 5.0	quest.c	$NHDT-Date: 1774269965 2026/03/23 04:46:05 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.46 $ */
/*      Copyright 1991, M. Stephenson             */
/* NetHack may be freely redistributed.  See license for details. */
/*  quest dungeon branch routines. */
import { game } from '../gstate.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, pline, verbalize } from '../c2js-runtime/pline.js';
import { adjalign, exercise } from './attrib.js';
import { yn_function } from './cmd.js';
import { canseemon } from './display.js';
import { schedule_goto } from './do.js';
import { Monnam, mon_nam, noit_mon_nam } from './do_name.js';
import { Is_special, dungeon_branch, on_level, remdun_mapseen } from './dungeon.js';
import { nomul } from './hack.js';
import { align_str } from './insight.js';
import { carrying, fully_identify_obj, update_inventory } from './invent.js';
import { angry_guards, monnear, setmangry } from './mon.js';
import { AMULET_OF_YENDOR, A_WIS, BELL_OF_OPENING, DEAF, FAKE_AMULET_OF_YENDOR, MAGIC_PORTAL, MS_DJINNI, MS_GUARDIAN, MS_NEMESIS, PM_PRISONER, UTOTYPE_NONE, UTOTYPE_PORTAL, UTOTYPE_RMPORTAL } from './nh-constants.js';
import { observe_object } from './o_init.js';
import { the, xname } from './objnam.js';
import { livelog_printf } from './pline.js';
import { com_pager, find_quest_artifact, is_quest_artifact, qt_pager } from './questpgr.js';
import { create_gas_cloud } from './region.js';
import { rn2 } from './rnd.js';
import { deltrap } from './trap.js';

export async function on_start() {
    if (!(game.quest_status.first_start)) {
        await qt_pager("firsttime");
        (game.quest_status.first_start) = (1);
    } else if ((game.u.uz0.dnum != game.u.uz.dnum) || (game.u.uz0.dlevel < game.u.uz.dlevel)) {
        if ((game.quest_status.not_ready) <= 2) {
            await qt_pager("nexttime");
        } else {
            await qt_pager("othertime");
        }
    }
}
export async function on_locate() {
    /* the locate messages are phrased in a manner such that they only
       make sense when arriving on the level from above */
    let from_above = (game.u.uz0.dlevel < game.u.uz.dlevel);
    if ((game.quest_status.killed_nemesis)) {
        return;
    } else if (!(game.quest_status.first_locate)) {
        if (from_above) {
            await qt_pager("locate_first");
        }
        /* if we've arrived from below this will be a lie, but there won't
           be any point in delivering the message upon a return visit from
           above later since the level has now been seen */
        (game.quest_status.first_locate) = (1);
    } else {
        if (from_above) {
            await qt_pager("locate_next");
        }
    }
}
export async function on_goal() {
    if ((game.quest_status.killed_nemesis)) {
        return;
    } else if (!(game.quest_status.made_goal)) {
        await qt_pager("goal_first");
        (game.quest_status.made_goal) = 1;
    } else {
        /*
         * Some QT_NEXTGOAL messages reference the quest artifact;
         * find out if it is still present.  If not, request an
         * alternate message (qt_pager() will revert to delivery
         * of QT_NEXTGOAL if current role doesn't have QT_ALTGOAL).
         * Note: if hero is already carrying it, it is treated as
         * being absent from the level for quest message purposes.
         */
        let whichobjchains = ((1 << 1) | (1 << 4) | (1 << 6));
        let qarti = find_quest_artifact(whichobjchains);
        await qt_pager(qarti ? "goal_next" : "goal_alt");
        if ((game.quest_status.made_goal) < 7) {
            (game.quest_status.made_goal)++;
        }
    }
}
export async function onquest() {
    if (game.u.uevent.qcompleted || (on_level(game.u.uz0, game.u.uz))) {
        return;
    }
    if (!Is_special(game.u.uz)) {
        return;
    }
    if ((((((game.dungeon_topology.d_qstart_level)).dlevel || ((game.dungeon_topology.d_qstart_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qstart_level))))) {
        await on_start();
    } else if ((((((game.dungeon_topology.d_qlocate_level)).dlevel || ((game.dungeon_topology.d_qlocate_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_qlocate_level))))) {
        await on_locate();
    } else if ((((((game.dungeon_topology.d_nemesis_level)).dlevel || ((game.dungeon_topology.d_nemesis_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_nemesis_level))))) {
        await on_goal();
    }
    return;
}
export function nemdead() {
    if (!(game.quest_status.killed_nemesis)) {
        (game.quest_status.killed_nemesis) = (1);
        qt_pager("killed_nemesis");
    }
}
export function leaddead() {
    if (!(game.quest_status.killed_leader)) {
        (game.quest_status.killed_leader) = (1);
    }
}
export function artitouch(obj) {
    if (!(game.quest_status.touched_artifact)) {
        /* in case we haven't seen the item yet (ie, currently blinded),
           this quest message describes it by name so mark it as seen */
        observe_object(obj);
        (game.quest_status.touched_artifact) = (1);
        /* only give this message once */
        qt_pager("gotit");
        exercise(A_WIS, (1));
    }
}
/* external hook for do.c (level change check) */
export function ok_to_quest() {
    return ((((game.quest_status.got_quest) || (game.quest_status.got_thanks)) && is_pure((0)) > 0) || (game.quest_status.killed_leader));
}
export function not_capable() {
    return (game.u.ulevel < 14);
}
export function is_pure(talk) {
    let purity = 0;
    let original_alignment = game.u.ualignbase[1];
    if (game.flags.debug && talk) {
        if (game.u.ualign.type != original_alignment) {
            You("are currently %s instead of %s.", align_str(game.u.ualign.type), align_str(original_alignment));
        } else if (game.u.ualignbase[0] != original_alignment) {
            You("have converted.");
        } else if (game.u.ualign.record < 20) {
            You("are currently %d and require %d.", game.u.ualign.record, 20);
            if (yn_function("adjust?", null, 121, (1)) == 121) {
                game.u.ualign.record = 20;
            }
        }
    }
    purity = (game.u.ualign.record >= 20 && game.u.ualign.type == original_alignment && game.u.ualignbase[0] == original_alignment) ? 1 : (game.u.ualignbase[0] != original_alignment) ? -1 : 0;
    return purity;
}
/*
 * Expel the player to the stairs on the parent of the quest dungeon.
 *
 * This assumes that the hero is currently _in_ the quest dungeon and that
 * there is a single branch to and from it.
 */
export function expulsion(seal) {
    let br = null;
    let dest = null;
    let t = null;
    let portal_flag = game.u.uevent.qexpelled ? UTOTYPE_NONE : UTOTYPE_PORTAL;
    br = dungeon_branch("The Quest");
    dest = (br.end1.dnum == game.u.uz.dnum) ? br.end2 : br.end1;
    if (seal) {
        portal_flag |= UTOTYPE_RMPORTAL;
    }
    nomul(0);
    schedule_goto(dest, portal_flag, null, null);
    if (seal) {
        /* remove the portal to the quest - sealing it off */
        let reexpelled = game.u.uevent.qexpelled;
        game.u.uevent.qexpelled = 1;
        remdun_mapseen((game.dungeon_topology.d_quest_dnum));
        /* Delete the near portal now; the far (main dungeon side)
           portal will be deleted as part of arrival on that level.
           If monster movement is in progress, any who haven't moved
           yet will now miss out on a chance to wander through it... */
        for (t = game.ftrap; t; t = t.ntrap) {
            if (t.ttyp == MAGIC_PORTAL) {
                break;
            }
        }
        if (t) {
            deltrap(t);
        } else if (!reexpelled) {
            impossible("quest portal already gone?");
        }
    }
}
/* Either you've returned to quest leader while carrying the quest
   artifact or you've just thrown it to/at him or her.  If quest
   completion text hasn't been given yet, give it now.  Otherwise
   give another message about the character keeping the artifact
   and using the magic portal to return to the dungeon.  Also called
   if hero throws or kicks an invocation item (probably the Bell)
   at the leader. */
/* quest artifact or thrown unique item or faux
                               * AoY; possibly null if carrying the Amulet */
export function finish_quest(obj) {
    let otmp = null;
    if (obj && !is_quest_artifact(obj)) {
        /* tossed an invocation item (or [fake] AoY) at the quest leader */
        if ((game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
            return;
        }
        /* optional (unlike quest completion) so skip if deaf */
        /* do ID first so that the message identifying the item will refer to
           it by name (and so justify the ID we already gave...) */
        /* behave as if leader imparts sufficient info about the
           quest artifact */
        fully_identify_obj(obj);
        if (obj.otyp == AMULET_OF_YENDOR) {
            /* update_inventory() is not necessary or helpful here because item
           was thrown, so isn't currently in inventory anyway */
            /* has the amulet in inventory -- most likely the player has already
           completed the quest and stopped in on her way back up, but it's not
           impossible to have gotten the amulet before formally presenting the
           quest artifact to the leader. */
            qt_pager("hasamulet");
        } else if (obj.otyp == FAKE_AMULET_OF_YENDOR) {
            verbalize("Sorry to say, this is a mere imitation of the true Amulet of Yendor.");
        } else {
            verbalize("Ah, I see you've found %s.", the(xname(obj)));
        }
        return;
    }
    if (game.u.uhave.amulet) {
        qt_pager("hasamulet");
        if ((otmp = carrying(AMULET_OF_YENDOR)) != null) {
            /* leader IDs the real amulet but ignores any fakes */
            fully_identify_obj(otmp);
            update_inventory();
        }
    } else {
        /* normal quest completion; threw artifact or walked up carrying it */
        qt_pager(!(game.quest_status.got_thanks) ? "offeredit" : "offeredit2");
        /* should have obtained bell during quest;
           if not, suggest returning for it now */
        if ((otmp = carrying(BELL_OF_OPENING)) == null) {
            com_pager("quest_complete_no_bell");
        }
    }
    (game.quest_status.got_thanks) = (1);
    if (obj) {
        game.u.uevent.qcompleted = 1;
        fully_identify_obj(obj);
        update_inventory();
    }
}
export function chat_with_leader(mtmp) {
    if (!mtmp.mpeaceful || (game.quest_status.pissed_off)) {
        return;
    }
    /*  Rule 0: Cheater checks. */
    if (game.u.uhave.questart && !(game.quest_status.met_nemesis)) {
        (game.quest_status.cheater) = (1);
    }
    if ((game.quest_status.got_thanks)) {
        /* Rule 3: You've got the artifact and are back to return it. */
        if (game.u.uhave.amulet) {
            finish_quest(null);
        /*  It is possible for you to get the amulet without completing
     *  the quest.  If so, try to induce the player to quest.
     */
        /* Rule 1: You've gone back with/without the amulet. */
        /* Rule 2: You've gone back before going for the amulet. */
        } else {
            qt_pager("posthanks");
        }
    } else if (game.u.uhave.questart) {
        let otmp = null;
        for (otmp = game.invent; otmp; otmp = otmp.nobj) {
            if (is_quest_artifact(otmp)) {
                break;
            }
        }
        /* Rule 4: You haven't got the artifact yet. */
        finish_quest(otmp);
    } else if ((game.quest_status.got_quest)) {
        /* Rule 5: You aren't yet acceptable - or are you? */
        qt_pager("encourage");
    } else {
        let purity = 0;
        if (!(game.quest_status.met_leader)) {
            qt_pager("leader_first");
            (game.quest_status.met_leader) = (1);
            (game.quest_status.not_ready) = 0;
        } else {
            qt_pager("leader_next");
        }
        /* the quest leader might have passed through the portal into
           the regular dungeon; none of the remaining make sense there */
        /* the quest leader might have passed through the portal into the
       regular dungeon; if so, mustn't perform "backwards expulsion" */
        if (!on_level(game.u.uz, (game.dungeon_topology.d_qstart_level))) {
            return;
        }
        if (not_capable()) {
            qt_pager("badlevel");
            exercise(A_WIS, (1));
            expulsion((0));
        } else if ((purity = is_pure((1))) < 0) {
            if (!(game.quest_status.pissed_off)) {
                com_pager("banished");
                (game.quest_status.pissed_off) = (1);
                expulsion((0));
                /* being expelled is hardly an achievement but none of the
                   other livelog classifications fit */
                livelog_printf(2, "%s has expelled you from the quest", noit_mon_nam(mtmp));
            }
        } else if (purity == 0) {
            qt_pager("badalign");
            (game.quest_status.not_ready) = 1;
            exercise(A_WIS, (1));
            expulsion((0));
        } else {
            qt_pager("assignquest");
            exercise(A_WIS, (1));
            (game.quest_status.got_quest) = (1);
            /* phrasing is a bit clumsy but allows #chronicle to provide a
               clue to players who are reaching the quest for first time;
               matters most for Home 1 that has stairs down which aren't
               easily found */
            livelog_printf(2, "%s has granted access to proceed deeper into the quest", noit_mon_nam(mtmp));
        }
    }
}
export function leader_speaks(mtmp) {
    if (!mtmp.mpeaceful) {
        if (!(game.quest_status.pissed_off)) {
            /* maybe you attacked leader? */
            /* again, don't end it permanently if the leader gets angry
             * since you're going to have to kill him to go questing... :)
             * ...but do only show this crap once. */
            qt_pager("leader_last");
        }
        (game.quest_status.pissed_off) = (1);
        mtmp.mstrategy &= ~(268435456 | 536870912);
    }
    if (!on_level(game.u.uz, (game.dungeon_topology.d_qstart_level))) {
        return;
    }
    if (!(game.quest_status.pissed_off)) {
        chat_with_leader(mtmp);
    }
}
export function chat_with_nemesis() {
    /*  The nemesis will do most of the talking, but... */
    qt_pager("discourage");
    if (!(game.quest_status.met_nemesis)) {
        (game.quest_status.met_nemesis++);
    }
}
export function nemesis_speaks() {
    if (!(game.quest_status.in_battle)) {
        if (game.u.uhave.questart) {
            qt_pager("nemesis_wantsit");
        } else if ((game.quest_status.made_goal) == 1 || !(game.quest_status.met_nemesis)) {
            qt_pager("nemesis_first");
        } else if ((game.quest_status.made_goal) < 4) {
            qt_pager("nemesis_next");
        } else if ((game.quest_status.made_goal) < 7) {
            qt_pager("nemesis_other");
        } else if (!rn2(5)) {
            qt_pager("discourage");
        }
        if ((game.quest_status.made_goal) < 7) {
            (game.quest_status.made_goal)++;
        }
        (game.quest_status.met_nemesis) = (1);
    } else if (!rn2(5)) {
        qt_pager("discourage");
    }
}
/* create cloud of stinking gas around dying nemesis */
export function nemesis_stinks(mx, my) {
    let save_mon_moving = game.context.mon_moving;
    /*
     * Some nemeses (determined by caller) release a cloud of noxious
     * gas when they die.  Don't make the hero be responsible for such
     * a cloud even if hero has just killed nemesis.
     */
    game.context.mon_moving = (1);
    create_gas_cloud(mx, my, 5, 8);
    game.context.mon_moving = save_mon_moving;
}
export function chat_with_guardian() {
    if (game.u.uhave.questart && (game.quest_status.killed_nemesis)) {
        qt_pager("guardtalk_after");
    /*  These guys/gals really don't have much to say... */
    } else {
        qt_pager("guardtalk_before");
    }
}
export function prisoner_speaks(mtmp) {
    if (mtmp.data == game.mons[PM_PRISONER] && (mtmp.mstrategy & (268435456 | 536870912))) {
        if (canseemon(mtmp)) {
            pline("%s speaks:", Monnam(mtmp));
        }
        ;
        verbalize("I'm finally free!");
        mtmp.mstrategy &= ~(268435456 | 536870912);
        mtmp.mpeaceful = 1;
        adjalign(3);
        /* ...But the guards are not */
        angry_guards((0));
    }
    return;
}
export function quest_chat(mtmp) {
    if (mtmp.m_id == (game.quest_status.leader_m_id)) {
        chat_with_leader(mtmp);
        /* leader might have become pissed during the chat */
        if ((game.quest_status.pissed_off)) {
            setmangry(mtmp, (0));
        }
        return;
    }
    switch (mtmp.data.msound) {
        case MS_NEMESIS:
            chat_with_nemesis();
            break;
        case MS_GUARDIAN:
            chat_with_guardian();
            break;
        default:
            impossible("quest_chat: Unknown quest character %s.", mon_nam(mtmp));
    }
}
export function quest_talk(mtmp) {
    if (mtmp.m_id == (game.quest_status.leader_m_id)) {
        leader_speaks(mtmp);
        return;
    }
    switch (mtmp.data.msound) {
        case MS_NEMESIS:
            nemesis_speaks();
            break;
        case MS_DJINNI:
            prisoner_speaks(mtmp);
            break;
        default:
            break;
    }
}
export function quest_stat_check(mtmp) {
    if (mtmp.data.msound == MS_NEMESIS) {
        (game.quest_status.in_battle) = (!((mtmp).msleeping || !(mtmp).mcanmove) && monnear(mtmp, game.u.ux, game.u.uy));
    }
}
/*quest.c*/
/* TODO: qt_pager("killed_leader"); ? */
/* (display might be briefly out of sync) */
/* he will spit out random maledictions */
