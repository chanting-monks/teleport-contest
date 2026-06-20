import { fnEnter } from '../c2js-runtime/trace.js';
/* NetHack 5.0	mon.c	$NHDT-Date: 1770949988 2026/02/12 18:33:08 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.621 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Derek S. Ray, 2015. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { alloc, free, memcpy, memset } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { You, You_feel, You_hear, You_see, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { __nh_register_static } from '../c2js-runtime/static-registry.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_char_at0, nh_strchr_truncate, strcat, strcmp, strcpy, strlen, strncmpi, strstr } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { get_mleash, leashable, m_unleash, um_dist } from './apply.js';
import { artifact_exists, touch_artifact } from './artifact.js';
import { adjalign, change_luck } from './attrib.js';
import { placebc } from './ball.js';
import { newebones } from './bones.js';
import { describe_level } from './botl.js';
import { isok } from './cmd.js';
import { is_lava, is_pool, is_pool_or_lava, is_waterwall } from './dbridge.js';
import { c_common_strings, c_obj_colors, cg } from './decl.js';
import { canseemon, docrt, flash_glyph_at, newsym, see_monsters, sensemon, shieldeff, swallowed, unmap_object } from './display.js';
import { deferred_goto, flooreffects, revive_corpse } from './do.js';
import { Amonnam, Mgender, Monnam, a_monnam, free_mgivenname, hliquid, m_monnam, minimal_monnam, mon_nam, mon_pmname, new_mgivenname, noit_mon_nam, noname_monnam, oname, pmname, safe_oname, x_monnam, y_monnam } from './do_name.js';
import { migrate_to_level, newedog, wary_dog } from './dog.js';
import { could_reach_item, cursed_object_at, finish_meating, quickmimic } from './dogmove.js';
import { def_monsyms } from './drawing.js';
import { In_W_tower, In_hell, In_mines, On_W_tower_level, has_ceiling, ledger_no, level_difficulty, on_level, surface } from './dungeon.js';
import { corpse_intrinsic, is_fainted, should_givit } from './eat.js';
import { del_engr_at, sengr_at } from './engrave.js';
import { experience, more_experienced, newexplevel } from './exper.js';
import { explode, mon_explodes } from './explode.js';
import { dryup } from './fountain.js';
import { coord_desc } from './getpos.js';
import { bad_rock, cant_squeeze_thru, disturb_buried_zombies, in_rooms, losehp, may_dig, may_passwall, monst_to_any, spoteffects, u_locomotion } from './hack.js';
import { dist2, eos, mungspaces, online2, ordin, s_suffix, upstart } from './hacklib.js';
import { record_achievement } from './insight.js';
import { delobj, g_at, nxtobj, sobj_at, stackobj, update_inventory } from './invent.js';
import { any_light_source, del_light_source, new_light_source } from './light.js';
import { freemcorpsenm, grow_up, is_home_elemental, makemon, mbirth_limit, mkclass_poly, newmextra, newmonhp, set_mimic_sym } from './makemon.js';
import { fightm } from './mhitm.js';
import { expels, gazemu } from './mhitu.js';
import { newemin } from './minion.js';
import { add_to_container, add_to_minv, clear_dknown, clear_splitobjs, discard_minvent, mkcorpstat, mkgold, mkobj, mksobj_at, obj_extract_self, obj_meld, obj_nexto, place_object, pudding_merge_message, splitobj, weight } from './mkobj.js';
import { Resists_Elem, attacktype, attacktype_fordmg, big_little_match, big_to_little, dmgtype, dmgtype_fromattack, little_to_big, locomotion, mon_hates_silver, mon_knows_traps, name_to_mon, name_to_monclass, olfaction, on_fire, passes_bars, poly_when_stoned, resist_conflict, set_mon_data, sticks } from './mondata.js';
import { accessible, can_fog, can_hide_under_obj, closed_door, dochugw, m_can_break_boulder, m_everyturn_effect, mb_trapped, mon_regen, mon_track_clear, mon_would_take_item, monflee, monhaskey, onscary, set_apparxy } from './monmove.js';
import { m_carrying, m_useup } from './mthrowu.js';
import { mcureblindness } from './muse.js';
import { ACH_MEDU, AMULET_OF_LIFE_SAVING, AMULET_OF_STRANGULATION, AXE, BATTLE_AXE, BELL_OF_OPENING, BLINDED, BOOMERANG, BOULDER, BULLWHIP, CARROT, CLOVE_OF_GARLIC, CLUB, COIN_CLASS, COLD_RES, CONFLICT, CORPSE, DEAF, DISINT_RES, DISMOUNT_GENERIC, DISPLACED, DOOR, DWARVISH_MATTOCK, EGG, ELVEN_SPEAR, EXPL_FIERY, FIGURINE, FIRE_RES, FIRST_GLASS_GEM, FLYING, FOOD_CLASS, FOUNTAIN, GEM_CLASS, GLOB_OF_BLACK_PUDDING, GLOB_OF_GREEN_SLIME, GLYPH_ALTAR_OFF, GLYPH_CMAP_A_OFF, GLYPH_CMAP_B_OFF, GLYPH_CMAP_C_OFF, GLYPH_CMAP_GEH_OFF, GLYPH_CMAP_KNOX_OFF, GLYPH_CMAP_MAIN_OFF, GLYPH_CMAP_MINES_OFF, GLYPH_CMAP_SOKO_OFF, GLYPH_CMAP_STONE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GOLD, GRAPPLING_HOOK, GRAY_DRAGON_SCALES, GRAY_DRAGON_SCALE_MAIL, HALF_PHDAM, HALLUC, HALLUC_RES, HIGH_PM, ICE_BOX, INVIS, IRON, IRONBARS, IRON_CHAIN, LAVAPOOL, LAVAWALL, LEASH, LEATHER_ARMOR, LEATHER_CLOAK, LEAVESTATUE, LEVITATION, LOW_PM, LS_MONSTER, MAGICAL_BREATHING, MAX_CARR_CAP, MAX_GLYPH, MITHRIL, MOAT, MS_GUARDIAN, MS_LEADER, MS_NEMESIS, MS_SHRIEK, M_AP_FURNITURE, M_AP_MONSTER, M_AP_NOTHING, M_AP_OBJECT, NEUTRAL, NON_PM, NO_WEAPON_WANTED, NUMMONS, NUM_GLASS_GEMS, PICK_AXE, PIT, PLNMSG_GROWL, PLNMSG_HIDE_UNDER, PM_ABBOT, PM_ACOLYTE, PM_AIR_ELEMENTAL, PM_APPRENTICE, PM_ARCHEOLOGIST, PM_ARCHON, PM_ASMODEUS, PM_ATTENDANT, PM_BABY_GOLD_DRAGON, PM_BABY_PURPLE_WORM, PM_BALROG, PM_BARBARIAN, PM_BLACK_DRAGON, PM_BLACK_LIGHT, PM_BLACK_PUDDING, PM_BLACK_UNICORN, PM_BLUE_DRAGON, PM_BROWN_PUDDING, PM_CAVE_DWELLER, PM_CHAMELEON, PM_CHICKATRICE, PM_CHIEFTAIN, PM_CLAY_GOLEM, PM_CLERIC, PM_COCKATRICE, PM_DEATH, PM_DISPATER, PM_DOPPELGANGER, PM_DWARF, PM_DWARF_MUMMY, PM_DWARF_ZOMBIE, PM_ELF, PM_ELF_MUMMY, PM_ELF_ZOMBIE, PM_ERINYS, PM_ETTIN, PM_ETTIN_MUMMY, PM_ETTIN_ZOMBIE, PM_FAMINE, PM_FIRE_ELEMENTAL, PM_FIRE_VORTEX, PM_FLAMING_SPHERE, PM_FLESH_GOLEM, PM_FLOATING_EYE, PM_FOG_CLOUD, PM_GARGOYLE, PM_GELATINOUS_CUBE, PM_GHOUL, PM_GIANT, PM_GIANT_MIMIC, PM_GIANT_MUMMY, PM_GIANT_ZOMBIE, PM_GLASS_GOLEM, PM_GNOME, PM_GNOME_MUMMY, PM_GNOME_ZOMBIE, PM_GOLD_DRAGON, PM_GOLD_GOLEM, PM_GRAY_DRAGON, PM_GRAY_OOZE, PM_GRAY_UNICORN, PM_GREEN_DRAGON, PM_GREEN_SLIME, PM_GREMLIN, PM_GRID_BUG, PM_GUIDE, PM_HEALER, PM_HEZROU, PM_HIGH_CLERIC, PM_HORNED_DEVIL, PM_HUMAN, PM_HUMAN_MUMMY, PM_HUMAN_WEREJACKAL, PM_HUMAN_WERERAT, PM_HUMAN_WEREWOLF, PM_HUMAN_ZOMBIE, PM_HUNTER, PM_IRON_GOLEM, PM_JABBERWOCK, PM_JELLYFISH, PM_KILLER_BEE, PM_KNIGHT, PM_KOBOLD, PM_KOBOLD_MUMMY, PM_KOBOLD_ZOMBIE, PM_LARGE_MIMIC, PM_LEATHER_GOLEM, PM_LIZARD, PM_LONG_WORM, PM_LONG_WORM_TAIL, PM_MAIL_DAEMON, PM_MANES, PM_MEDUSA, PM_MINOTAUR, PM_MONK, PM_NEANDERTHAL, PM_NURSE, PM_ORANGE_DRAGON, PM_ORC, PM_ORCUS, PM_ORC_MUMMY, PM_ORC_ZOMBIE, PM_OWLBEAR, PM_PAGE, PM_PAPER_GOLEM, PM_PESTILENCE, PM_PONY, PM_PURPLE_WORM, PM_PYROLISK, PM_QUEEN_BEE, PM_RANGER, PM_RED_DRAGON, PM_ROGUE, PM_ROPE_GOLEM, PM_ROSHI, PM_ROTHE, PM_RUST_MONSTER, PM_SALAMANDER, PM_SAMURAI, PM_SANDESTIN, PM_SCORPION, PM_SCORPIUS, PM_SHOCKING_SPHERE, PM_SHRIEKER, PM_SILVER_DRAGON, PM_SKELETON, PM_SMALL_MIMIC, PM_STALKER, PM_STEAM_VORTEX, PM_STONE_GOLEM, PM_STRAW_GOLEM, PM_STUDENT, PM_THUG, PM_TOURIST, PM_VALKYRIE, PM_VAMPIRE, PM_VAMPIRE_BAT, PM_VAMPIRE_LEADER, PM_VIOLET_FUNGUS, PM_VLAD_THE_IMPALER, PM_VROCK, PM_WARRIOR, PM_WATCHMAN, PM_WATCH_CAPTAIN, PM_WEREJACKAL, PM_WERERAT, PM_WEREWOLF, PM_WHITE_DRAGON, PM_WHITE_UNICORN, PM_WINGED_GARGOYLE, PM_WIZARD, PM_WIZARD_OF_YENDOR, PM_WOLF, PM_WOOD_GOLEM, PM_WRAITH, PM_YEENOGHU, PM_YELLOW_DRAGON, POISON_RES, POOL, POTION_CLASS, PROT_FROM_SHAPE_CHANGERS, P_AXE, P_PICK_AXE, QUARTERSTAFF, RANDOM_CLASS, RIN_SLOW_DIGESTION, ROCK, ROCK_CLASS, ROOM, SADDLE, SCROLL_CLASS, SCR_BLANK_PAPER, SCR_MAIL, SCR_SCARE_MONSTER, SHOCK_RES, SHOPBASE, SILVER, SLEEP_RES, SMALL_SHIELD, SPECIAL_PM, SPE_EXTRA_HEALING, SPE_HEALING, SPIKED_PIT, STATUE, STOMACH, STONE, STONE_RES, S_BAT, S_BLOB, S_DOG, S_DRAGON, S_EEL, S_ELEMENTAL, S_EYE, S_FUNGUS, S_GHOST, S_GIANT, S_GNOME, S_GOLEM, S_HUMAN, S_HUMANOID, S_JELLY, S_KOBOLD, S_KOP, S_LICH, S_LIGHT, S_MIMIC, S_NYMPH, S_ORC, S_UNICORN, S_VAMPIRE, S_VORTEX, S_ZOMBIE, S_altar, S_arrow_trap, S_digbeam, S_goodpos, S_grave, S_hcdoor, S_ndoor, S_poisoncloud, S_stone, S_tree, S_trwall, S_vcdoor, S_vwall, TELEPAT, TELEP_TRAP, TEMPLE, TIN, TOOL_CLASS, TRAPNUM, TREE, UNICORN_HORN, WATER, WEAPON_CLASS, WOOD, WORM_TOOTH, WT_HUMAN, YELLOW_DRAGON_SCALES, YELLOW_DRAGON_SCALE_MAIL, _ISupper, altar_chaotic, altar_lawful, altar_neutral, altar_other, altar_unaligned } from './nh-constants.js';
import { discover_object, objdescr_is } from './o_init.js';
import { The, an, ansimpleoname, distant_name, doname, makeplural, simple_typename, vtense, xname } from './objnam.js';
import { removed_from_icebox } from './pickup.js';
import { There, livelog_printf, pline_mon, set_msg_xy } from './pline.js';
import { body_part, uunstick } from './polyself.js';
import { healup, split_mon } from './potion.js';
import { ghod_hitsu, in_your_sanctuary, newepri, p_coaligned } from './priest.js';
import { leaddead, nemdead, nemesis_stinks } from './quest.js';
import { quest_info, stinky_nemesis } from './questpgr.js';
import { unpunish } from './read.js';
import { create_gas_cloud, visible_region_at } from './region.js';
import { d, rn2, rn2_on_display_rng, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { hot_pursuit, inhishop, replshk, shkgone } from './shk.js';
import { neweshk, shtypes } from './shknam.js';
import { growl, maybe_gasp } from './sounds.js';
import { stairway_find_type_dir } from './stairs.js';
import { mdrop_special_objs, mpickobj, relobj, thiefdead } from './steal.js';
import { dismount_steed, place_monster, poly_steed } from './steed.js';
import { control_mon_tele, enexto, goodpos, noteleport_level, rloc, rloc_to, rloc_to_flag, tele_restrict } from './teleport.js';
import { end_burn, kill_egg } from './timeout.js';
import { tt_doppel } from './topten.js';
import { hastrack } from './track.js';
import { fill_pit, fire_damage_chain, m_harmless_trap, mselftouch, t_at, unconscious, water_damage_chain } from './trap.js';
import { gd_move, grddead, newegd } from './vault.js';
import { does_block, recalc_block_point, unblock_point, vision_recalc } from './vision.js';
import { possibly_unwield } from './weapon.js';
import { new_were, were_change } from './were.js';
import { getlin } from './windows.js';
import { aggravate, mon_has_amulet, mon_has_special, pick_nasty, wizdeadorgone } from './wizard.js';
import { count_wsegs, get_wormno, initworm, place_worm_tail_randomly, place_wsegs, remove_worm, sanity_check_worm, worm_cross, worm_known, wormgone, wormno_sanity_check } from './worm.js';
import { bypass_obj, clear_bypasses, extract_from_minvent, m_dowear, mon_adjust_speed, mon_break_armor, mon_set_minvis, which_armor } from './worn.js';
import { obj_resists } from './zap.js';

/* defined in shknam.c */
/* potentially of historical interest */
/* part of the original warning code which was replaced in 3.3.1 */
/* 0 */
export async function pet_sanity_check(mtmp, msgarg) {
    if (((mtmp).mextra && ((mtmp).mextra.edog))) {
        let edog = ((mtmp).mextra.edog);
        if (edog.droptime > game.moves) {
            await impossible("insane pet #%u has droptime (%ld) in the future (%ld) (%s)", mtmp.m_id, edog.droptime, game.moves, msgarg);
        }
    }
}
export async function sanity_check_single_mon(mtmp, chk_geno, msg) {
    let mptr = mtmp.data;
    let mx = mtmp.mx;
    let my = mtmp.my;
    if (!mptr || mptr.pmidx < LOW_PM || mptr.pmidx > HIGH_PM) {
        await panic("illegal mon data %s; mnum=%d (%s)", fmt_ptr(mptr), mtmp.mnum, msg);
    } else {
        let mndx = ((mptr).pmidx);
        if (mtmp.mnum != mndx) {
            await impossible("monster mnum=%d, monsndx=%d (%s)", mtmp.mnum, mndx, msg);
            mtmp.mnum = mndx;
        }
        /* check before DEADMONSTER() because dead monsters should still
           have sane mhpmax */
        if (mtmp.mhpmax < 1 || mtmp.mhp > mtmp.mhpmax) {
            await impossible("%s: level %d %s #%u [%s] has %d cur HP, %d max HP", msg, mtmp.m_lev, mptr.pmnames[NEUTRAL], mtmp.m_id, fmt_ptr(mtmp), mtmp.mhp, mtmp.mhpmax);
        }
        if (((mtmp).mhp < 1)) {
            /* Gremlins don't obey the (mhpmax >= m_lev) rule so disable
             * this check, at least for the time being.  We could skip it
             * when the cloned flag is set, but the original gremlin would
             * still be an issue.
            || mtmp->mhpmax < (int) mtmp->m_lev
             */
            /* bad if not fmon list or if not vault guard */
            /* HARDFOUGHT-only at present */
            return;
        }
        if (chk_geno && (game.mvitals[mndx].mvflags & 2) != 0) {
            await impossible("genocided %s in play (%s)", pmname(mptr, Mgender(mtmp)), msg);
        }
        if (mtmp.mtame && !mtmp.mpeaceful) {
            await impossible("tame %s is not peaceful (%s)", pmname(mptr, Mgender(mtmp)), msg);
        }
    }
    if (mtmp.isshk && !((mtmp).mextra && ((mtmp).mextra.eshk))) {
        await impossible("shk without eshk (%s)", msg);
    }
    if (mtmp.ispriest && !((mtmp).mextra && ((mtmp).mextra.epri))) {
        await impossible("priest without epri (%s)", msg);
    }
    if (mtmp.isgd && !((mtmp).mextra && ((mtmp).mextra.egd))) {
        await impossible("guard without egd (%s)", msg);
    }
    if (mtmp.isminion && !((mtmp).mextra && ((mtmp).mextra.emin))) {
        await impossible("minion without emin (%s)", msg);
    }
    if (mtmp.mtame) {
        if (!((mtmp).mextra && ((mtmp).mextra.edog)) && !mtmp.isminion) {
            await impossible("pet without edog (%s)", msg);
        } else {
            await pet_sanity_check(mtmp, msg);
        }
    }
    if (mtmp == game.u.usteed) {
        /* steed should be tame and saddled */
        let ns = null;
        let nt = !mtmp.mtame ? "not tame" : null;
        ns = !m_carrying(mtmp, SADDLE) ? "no saddle" : !await which_armor(mtmp, 1048576) ? "saddle not worn" : null;
        if (ns || nt) {
            await impossible("steed: %s%s%s (%s)", ns ? ns : "", (ns && nt) ? ", " : "", nt ? nt : "", msg);
        }
    }
    if (mtmp.mtrapped) {
        if (mtmp.wormno) {
            ;
        } else if (!t_at(mx, my)) {
            await impossible("trapped without a trap (%s)", msg);
        }
    }
    if (mtmp.mfrozen && mtmp.mcanmove) {
        await impossible("frozen monster [%s%s] is able to move (%s)", mtmp.mtame ? "tame " : mtmp.mpeaceful ? "peaceful " : "", pmname(mptr, Mgender(mtmp)), msg);
    }
    if (mtmp.mundetected) {
        /* TODO: how to check worm in trap? */
        let t = null;
        /* caller will have checked this but not fixed it */
        if (!isok(mx, my)) {
            mx = my = 0;
        }
        if (mtmp == game.u.ustuck) {
            await impossible("hiding monster stuck to you (%s)", msg);
        }
        if ((game.level.monsters[mx][my]) == mtmp && (((mptr).mflags1 & 128) != 0) && !(game.level.objects[mx][my] != null)) {
            await impossible("mon hiding under nonexistent obj (%s)", msg);
        }
        if (mptr.mlet == S_EEL && !(is_pool(mx, my) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))))) {
            await impossible("eel hiding %s (%s)", !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) ? "out of water" : "on Plane of Water", msg);
        }
        if (((((mptr).mflags1 & 256) != 0) && (((((mptr).mflags1 & 16) != 0) && (mptr).mlet != S_MIMIC) || (((mptr).mflags1 & 1) != 0))) && (!has_ceiling(game.u.uz) || !(game.level.locations[mx][my].typ == POOL || game.level.locations[mx][my].typ == MOAT || game.level.locations[mx][my].typ == WATER || game.level.locations[mx][my].typ == LAVAPOOL || game.level.locations[mx][my].typ == LAVAWALL || accessible(mx, my)))) {
            await impossible("ceiling hider hiding %s (%s)", !has_ceiling(game.u.uz) ? "without ceiling" : "in solid stone", msg);
        }
        if (mtmp.mtrapped && (t = t_at(mx, my)) != null && !((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT)) {
            await impossible("hiding while trapped in a non-pit (%s)", msg);
        }
    } else if (((mtmp).m_ap_type & 7) != M_AP_NOTHING) {
        /* normally !accessible would be overridable with passes_walls,
               but not for hiding on the ceiling */
        let is_mimic = (mptr.mlet == S_MIMIC);
        let what = (((mtmp).m_ap_type & 7) == M_AP_FURNITURE) ? "furniture" : (((mtmp).m_ap_type & 7) == M_AP_MONSTER) ? "a monster" : (((mtmp).m_ap_type & 7) == M_AP_OBJECT) ? "an object" : "something strange";
        if (!strcmp(msg, "migr")) {
            /* mimics come out of hiding, but disguised Wizard doesn't
           have to lose his disguise */
            if (((mtmp).m_ap_type & 7) != M_AP_MONSTER) {
                await impossible("migrating %s mimicking %s %s", is_mimic ? "mimic" : "monster", what, msg);
            }
        } else if ((game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
            await impossible("mimic%s concealed as %s despite Prot-from-shape-changers %s", is_mimic ? "" : "ker", what, msg);
        }
        /* the Wizard's clone after "double trouble" starts out mimicking
           some other monster; pet's quickmimic effect can temporarily take
           on furniture, object, or monster shape, but only until the pet
           finishes eating a mimic corpse */
        /* mimics who end up in strange locations do still hide while there */
        if (!(is_mimic || mtmp.meating || (mtmp.iswiz && ((mtmp).m_ap_type & 7) == M_AP_MONSTER))) {
            await impossible("non-mimic (%s) posing as %s (%s)", mptr.pmnames[NEUTRAL], what, msg);
        }
    }
    if (mtmp.mleashed) {
        if (!get_mleash(mtmp)) {
            await impossible("monst %u: leashed but no leash for %s", mtmp.m_id, mon_pmname(mtmp));
        } else if (!mtmp.mtame) {
            await impossible("monst %u: leashed but not tame %s", mtmp.m_id, mon_pmname(mtmp));
        }
    }
}
export async function mon_sanity_check() {
    let x = 0;
    let y = 0;
    let mtmp = null;
    let m = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        await sanity_check_single_mon(mtmp, (1), "fmon");
        if (((mtmp).mhp < 1) && !mtmp.isgd) {
            /* don't engulf boulders and statues or ball&chain */
            /* normally mtmp won't have stepped onto scare monster
                      scroll, but if it does, don't eat or engulf that
                      (note: scrolls inside eaten containers will still
                      become engulfed) */
            /* do nothing--neither eaten nor engulfed */
            /* inedible items -- engulf these */
            continue;
        }
        x = mtmp.mx , y = mtmp.my;
        if (!isok(x, y) && !(mtmp.isgd && x == 0 && y == 0)) {
            await impossible("mon (%s) claims to be at <%d,%d>?", fmt_ptr(mtmp), x, y);
        } else if (mtmp == game.u.usteed) {
            if (x != game.u.ux || y != game.u.uy) {
                await impossible("steed (%s) claims to be at <%d,%d>?", fmt_ptr(mtmp), x, y);
            }
        } else if (game.level.monsters[x][y] != mtmp) {
            await impossible("mon (%s) at <%d,%d> is not there!", fmt_ptr(mtmp), x, y);
        } else if (mtmp.wormno) {
            await sanity_check_worm(mtmp);
        } else if (((mtmp).mstate != 0)) {
            await impossible("floor mon (%s) with mstate set to 0x%08lx", fmt_ptr(mtmp), mtmp.mstate);
        }
    }
    for (x = 1; x < 80; x++) {
        for (y = 0; y < 21; y++) {
            if ((mtmp = game.level.monsters[x][y]) != null) {
                for (m = game.level.monlist; m; m = m.nmon) {
                    if (m == mtmp) {
                        /* [should check whether revival forced 'mtmp' off the level
               and return 3 in that situation (if possible...)] */
                        /* untouchable (or inaccessible) items */
                        /* revival failed? if so, corpse is gone */
                        /* Successful Rider revival; unlike skipped corpses, don't
               just move on to next corpse as if nothing has happened.
               [Can Rider revival bump 'mtmp' off level when it's full?
               We ought to return 3 if that happens.] */
                        break;
                    }
                }
                if (!m) {
                    await impossible("map mon (%s) at <%d,%d> not in fmon list!", fmt_ptr(mtmp), x, y);
                } else if (mtmp == game.u.usteed) {
                    await impossible("steed (%s) is on the map at <%d,%d>!", fmt_ptr(mtmp), x, y);
                } else if ((mtmp.mx != x || mtmp.my != y) && mtmp.data != game.mons[PM_LONG_WORM]) {
                    await impossible("map mon (%s) at <%d,%d> is found at <%d,%d>?", fmt_ptr(mtmp), mtmp.mx, mtmp.my, x, y);
                }
            }
        }
    }
    for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
        await sanity_check_single_mon(mtmp, (0), "migr");
        if ((mtmp.mstate & ~(4 | 8 | 64 | 1)) != 0 || !(mtmp.mstate & 4)) {
            await impossible("migrating mon (%s) with mstate set to 0x%08lx", fmt_ptr(mtmp), mtmp.mstate);
        }
    }
    /* test for bogus worm tail */
    wormno_sanity_check();
}
/* Would monster be OK with poison gas? */
/* Does not check for actual poison gas at the location. */
/* Returns one of M_POISONGAS_foo */
export async function m_poisongas_ok(mtmp) {
    let px = 0;
    let py = 0;
    let is_you = (mtmp == game.youmonst);
    /* Non living, non breathing, immune monsters are not concerned */
    if (((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) || (((mtmp.data).mflags1 & 1024) != 0) || ((mtmp.data) == game.mons[PM_HEZROU] || (mtmp.data) == game.mons[PM_VROCK])) {
        return 2;
    }
    /* not is_swimmer(); assume that non-fish are swimming on
       the surface and breathing the air above it periodically
       unless located at water spot on plane of water */
    px = is_you ? game.u.ux : mtmp.mx;
    py = is_you ? game.u.uy : mtmp.my;
    if ((mtmp.data.mlet == S_EEL || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) && is_pool(px, py)) {
        return 2;
    }
    /* exclude monsters with poison gas breath attack:
       adult green dragon and Chromatic Dragon (and iron golem,
       but nonliving() and breathless() tests also catch that) */
    if (attacktype_fordmg(mtmp.data, 12, 7) || attacktype_fordmg(mtmp.data, 12, 242)) {
        return 2;
    }
    if (is_you && (game.u.uinvulnerable || (game.u.uprops[MAGICAL_BREATHING].intrinsic || game.u.uprops[MAGICAL_BREATHING].extrinsic || (((game.youmonst.data).mflags1 & 1024) != 0)) || (game.u.uinwater))) {
        return 2;
    }
    if (is_you ? (game.u.uprops[POISON_RES].intrinsic || game.u.uprops[POISON_RES].extrinsic) : await Resists_Elem(mtmp, POISON_RES)) {
        return 1;
    }
    /* no displacing grid bugs diagonally */
    /* no displacing trapped monsters or multi-location longworms */
    /* riders can move anything; others, same size or smaller only */
    return 0;
}
/* return True if mon is capable of converting other monsters into zombies */
export function zombie_maker(mon) {
    let pm = mon.data;
    if (mon.mcan) {
        return (0);
    }
    switch (pm.mlet) {
        /* when already a zombie/ghoul/skeleton, will stay as is */
        case S_ZOMBIE:
            if (pm == game.mons[PM_GHOUL] || pm == game.mons[PM_SKELETON]) {
                /* can't hide while trapped except in pits */
                /* can't hide on ceiling if there isn't one */
                /* won't hide when adjacent to hero */
                /*
         * The mimic needs to be awake to disguise itself
         * as something else.
         */
                return (0);
            }
            /* Z-class monsters that aren't actually zombies go here */
            /* potential new form is ok */
            return (1);
        case S_LICH:
            return (1);
    }
    return (0);
}
/* Return monster index of zombie monster which this monster could
   be turned into, or NON_PM if it doesn't have a direct counterpart.
   Sort of the zombie-specific inverse of undead_to_corpse. */
export function zombie_form(pm) {
    switch (pm.mlet) {
        case S_ZOMBIE:
            return NON_PM;
        case S_KOBOLD:
            return PM_KOBOLD_ZOMBIE;
        case S_ORC:
            return PM_ORC_ZOMBIE;
        case S_GIANT:
            if (pm == game.mons[PM_ETTIN]) {
                return PM_ETTIN_ZOMBIE;
            }
            return PM_GIANT_ZOMBIE;
        case S_HUMAN:
        case S_KOP:
            if ((((pm).mflags2 & 16) != 0)) {
                return PM_ELF_ZOMBIE;
            }
            return PM_HUMAN_ZOMBIE;
        case S_HUMANOID:
            if ((((pm).mflags2 & 32) != 0)) {
                return PM_DWARF_ZOMBIE;
            } else {
                break;
            }
        case S_GNOME:
            return PM_GNOME_ZOMBIE;
    }
    return NON_PM;
}
/* convert the monster index of an undead to its living counterpart */
export function undead_to_corpse(mndx) {
    switch (mndx) {
        case PM_KOBOLD_ZOMBIE:
        case PM_KOBOLD_MUMMY:
            mndx = PM_KOBOLD;
            break;
        case PM_DWARF_ZOMBIE:
        case PM_DWARF_MUMMY:
            mndx = PM_DWARF;
            break;
        case PM_GNOME_ZOMBIE:
        case PM_GNOME_MUMMY:
            mndx = PM_GNOME;
            break;
        case PM_ORC_ZOMBIE:
        case PM_ORC_MUMMY:
            mndx = PM_ORC;
            break;
        case PM_ELF_ZOMBIE:
        case PM_ELF_MUMMY:
            mndx = PM_ELF;
            break;
        /* any vampire can become fog or bat */
        case PM_VAMPIRE:
        case PM_VAMPIRE_LEADER:
        case PM_HUMAN_ZOMBIE:
        case PM_HUMAN_MUMMY:
            mndx = PM_HUMAN;
            break;
        case PM_GIANT_ZOMBIE:
        case PM_GIANT_MUMMY:
            mndx = PM_GIANT;
            break;
        case PM_ETTIN_ZOMBIE:
        case PM_ETTIN_MUMMY:
            mndx = PM_ETTIN;
            break;
        default:
            break;
    }
    /* don't resort to arbitrary */
    return mndx;
}
/* Convert the monster index of some monsters (such as quest guardians)
 * to their generic species type.
 *
 * Return associated character class monster, rather than species
 * if mode is 1.
 */
export function genus(mndx, mode) {
    switch (mndx) {
        case PM_STUDENT:
            mndx = mode ? PM_ARCHEOLOGIST : PM_HUMAN;
            break;
        case PM_CHIEFTAIN:
            mndx = mode ? PM_BARBARIAN : PM_HUMAN;
            break;
        case PM_NEANDERTHAL:
            mndx = mode ? PM_CAVE_DWELLER : PM_HUMAN;
            break;
        case PM_ATTENDANT:
            mndx = mode ? PM_HEALER : PM_HUMAN;
            break;
        case PM_PAGE:
            mndx = mode ? PM_KNIGHT : PM_HUMAN;
            break;
        case PM_ABBOT:
            mndx = mode ? PM_MONK : PM_HUMAN;
            break;
        case PM_ACOLYTE:
            mndx = mode ? PM_CLERIC : PM_HUMAN;
            break;
        case PM_HUNTER:
            mndx = mode ? PM_RANGER : PM_HUMAN;
            break;
        case PM_THUG:
            mndx = mode ? PM_ROGUE : PM_HUMAN;
            break;
        case PM_ROSHI:
            mndx = mode ? PM_SAMURAI : PM_HUMAN;
            break;
        case PM_GUIDE:
            mndx = mode ? PM_TOURIST : PM_HUMAN;
            break;
        case PM_APPRENTICE:
            mndx = mode ? PM_WIZARD : PM_HUMAN;
            break;
        case PM_WARRIOR:
            mndx = mode ? PM_VALKYRIE : PM_HUMAN;
            break;
        default:
            if (((mndx) >= LOW_PM && (mndx) < NUMMONS)) {
                let ptr = game.mons[mndx];
                if ((((ptr).mflags2 & 8) != 0)) {
                    mndx = PM_HUMAN;
                } else if ((((ptr).mflags2 & 16) != 0)) {
                    mndx = PM_ELF;
                } else if ((((ptr).mflags2 & 32) != 0)) {
                    mndx = PM_DWARF;
                } else if ((((ptr).mflags2 & 64) != 0)) {
                    mndx = PM_GNOME;
                } else if ((((ptr).mflags2 & 128) != 0)) {
                    mndx = PM_ORC;
                }
            }
            break;
    }
    return mndx;
}
/* return monster index if chameleon, or NON_PM if not */
export function pm_to_cham(mndx) {
    let mcham = NON_PM;
    /*
     * As of 3.6.0 we just check M2_SHAPESHIFTER instead of having a
     * big switch statement with hardcoded shapeshifter types here.
     */
    if (((mndx) >= LOW_PM && (mndx) < NUMMONS) && (((game.mons[mndx]).mflags2 & 16384) != 0)) {
        mcham = mndx;
    }
    return mcham;
}
/* for deciding whether corpse will carry along full monster data */
/* normally quest leader will be unique, */
/* but he or she might have been polymorphed  */
/* special cancellation handling for these */
/* Creates a monster corpse, a "special" corpse, or nothing if it doesn't
 * leave corpses.  Monsters which leave "special" corpses should have
 * G_NOCORPSE set in order to prevent wishing for one, finding tins of one,
 * etc....
 */
export async function make_corpse(mtmp, corpseflags) {
    let mdat = mtmp.data;
    let num = 0;
    let obj = null;
    let otmp = null;
    let x = mtmp.mx;
    let y = mtmp.my;
    /*    int mndx = monsndx(mdat); */
    let mndx = ((mdat).pmidx);
    let corpstatflags = corpseflags;
    let burythem = ((corpstatflags & 16) != 0);
    let runDefault_1 = (0);
    if (mtmp.female) {
        corpstatflags |= 1;
    } else if (!(((mtmp.data).mflags2 & 262144) != 0)) {
        corpstatflags |= 2;
    }
    switch (mndx) {
        case PM_GRAY_DRAGON:
        case PM_GOLD_DRAGON:
        case PM_SILVER_DRAGON:
        case PM_RED_DRAGON:
        case PM_ORANGE_DRAGON:
        case PM_WHITE_DRAGON:
        case PM_BLACK_DRAGON:
        case PM_BLUE_DRAGON:
        case PM_GREEN_DRAGON:
        case PM_YELLOW_DRAGON:
            if (!rn2(mtmp.mrevived ? 20 : 3)) {
                /* Make dragon scales.  This assumes that the order of the
           dragons is the same as the order of the scales. */
                num = GRAY_DRAGON_SCALES + ((mdat).pmidx) - PM_GRAY_DRAGON;
                obj = await mksobj_at(num, x, y, (0), (0));
                obj.spe = 0;
                obj.cursed = obj.blessed = (0);
            }
            runDefault_1 = (1);
            break;
        case PM_WHITE_UNICORN:
        case PM_GRAY_UNICORN:
        case PM_BLACK_UNICORN:
            if (mtmp.mrevived && rn2(2)) {
                if (canseemon(mtmp)) {
                    await pline_mon(mtmp, "%s recently regrown horn crumbles to dust.", s_suffix(await Monnam(mtmp)));
                }
            } else {
                obj = await mksobj_at(UNICORN_HORN, x, y, (1), (0));
                if (obj && mtmp.mrevived) {
                    obj.obroken = 1;
                }
            }
            runDefault_1 = (1);
            break;
        case PM_LONG_WORM:
            await mksobj_at(WORM_TOOTH, x, y, (1), (0));
            runDefault_1 = (1);
            break;
        case PM_VAMPIRE:
        case PM_VAMPIRE_LEADER:
            num = undead_to_corpse(mndx);
            corpstatflags |= 8;
            obj = await mkcorpstat(CORPSE, mtmp, game.mons[num], x, y, corpstatflags);
            obj.age -= ((50) + 1);
            break;
        case PM_KOBOLD_MUMMY:
        case PM_DWARF_MUMMY:
        case PM_GNOME_MUMMY:
        case PM_ORC_MUMMY:
        case PM_ELF_MUMMY:
        case PM_HUMAN_MUMMY:
        case PM_GIANT_MUMMY:
        case PM_ETTIN_MUMMY:
        case PM_KOBOLD_ZOMBIE:
        case PM_DWARF_ZOMBIE:
        case PM_GNOME_ZOMBIE:
        case PM_ORC_ZOMBIE:
        case PM_ELF_ZOMBIE:
        case PM_HUMAN_ZOMBIE:
        case PM_GIANT_ZOMBIE:
        case PM_ETTIN_ZOMBIE:
            num = undead_to_corpse(mndx);
            corpstatflags |= 8;
            obj = await mkcorpstat(CORPSE, mtmp, game.mons[num], x, y, corpstatflags);
            obj.age -= ((50) + 1);
            break;
        case PM_IRON_GOLEM:
            num = d(2, 6);
            while (num--) {
                obj = await mksobj_at(IRON_CHAIN, x, y, (1), (0));
            }
            free_mgivenname(mtmp);
            break;
        case PM_GLASS_GOLEM:
            num = d(2, 4);
            while (num--) {
                obj = await mksobj_at(FIRST_GLASS_GEM + rn2(NUM_GLASS_GEMS), x, y, (1), (0));
            }
            free_mgivenname(mtmp);
            break;
        case PM_CLAY_GOLEM:
            obj = await mksobj_at(ROCK, x, y, (0), (0));
            obj.quan = (rn2(20) + 50);
            obj.owt = await weight(obj);
            free_mgivenname(mtmp);
            break;
        case PM_STONE_GOLEM:
            corpstatflags &= ~8;
            obj = await mkcorpstat(STATUE, null, mdat, x, y, corpstatflags);
            break;
        case PM_WOOD_GOLEM:
            num = d(2, 4);
            while (num--) {
                obj = await mksobj_at(rn2(2) ? QUARTERSTAFF : rn2(3) ? SMALL_SHIELD : rn2(3) ? CLUB : rn2(3) ? ELVEN_SPEAR : BOOMERANG, x, y, (1), (0));
            }
            free_mgivenname(mtmp);
            break;
        case PM_ROPE_GOLEM:
            num = rn2(3);
            while (num-- > 0) {
                obj = await mksobj_at(rn2(2) ? LEASH : rn2(3) ? BULLWHIP : GRAPPLING_HOOK, x, y, (1), (0));
            }
            free_mgivenname(mtmp);
            break;
        case PM_LEATHER_GOLEM:
            num = d(2, 4);
            while (num--) {
                obj = await mksobj_at(rn2(4) ? LEATHER_ARMOR : rn2(3) ? LEATHER_CLOAK : SADDLE, x, y, (1), (0));
            }
            free_mgivenname(mtmp);
            break;
        case PM_GOLD_GOLEM:
            obj = await mkgold((200 - rnl(101)), x, y);
            free_mgivenname(mtmp);
            break;
        case PM_PAPER_GOLEM:
            num = rnd(4);
            while (num--) {
                obj = await mksobj_at(SCR_BLANK_PAPER, x, y, (1), (0));
            }
            free_mgivenname(mtmp);
            break;
        /* expired puddings will congeal into a large blob;
       like dragons, relies on the order remaining consistent */
        case PM_GRAY_OOZE:
        case PM_BROWN_PUDDING:
        case PM_GREEN_SLIME:
        case PM_BLACK_PUDDING:
            obj = await mksobj_at(GLOB_OF_BLACK_PUDDING - (PM_BLACK_PUDDING - mndx), x, y, (1), (0));
            while (obj && (otmp = await obj_nexto(obj)) != null) {
                await pudding_merge_message(obj, otmp);
                obj = await obj_meld(obj, otmp);
            }
            free_mgivenname(mtmp);
            await newsym(x, y);
            return obj;
        case NON_PM:
        case LEAVESTATUE:
        case NUMMONS:
            break;
        default:
            runDefault_1 = (1);
            break;
    }
    if (runDefault_1) {
        /* default_1 body — C ref mon.c make_corpse default_1 label.
           KEEPTRAITS = isshk || mtame || unique_corpstat (geno&G_UNIQ)
                        || is_reviver (is_rider || mlet==S_TROLL)
                        || m_id == quest_status.leader_m_id
                        || dmgtype(AD_SEDU || AD_SSEX) */
        if ((game.mvitals[mndx].mvflags & 16 /*G_NOCORPSE*/) != 0) {
            return null;
        }
        corpstatflags |= 8 /*CORPSTAT_INIT*/;
        const _isUnique = (mtmp.data.geno & 0x1000 /*G_UNIQ*/) != 0;
        const _isRider = mndx === 311 /*PM_DEATH*/
            || mndx === 312 /*PM_PESTILENCE*/
            || mndx === 313 /*PM_FAMINE*/;
        const _isReviver = _isRider || mtmp.data.mlet === 46 /*S_TROLL*/;
        const _isLeader = mtmp.m_id === game.quest_status?.leader_m_id;
        const _keepTraits = mtmp.isshk || mtmp.mtame
            || _isUnique || _isReviver || _isLeader
            || dmgtype(mdat, 22 /*AD_SEDU*/) != null
            || dmgtype(mdat, 35 /*AD_SSEX*/) != null;
        obj = await mkcorpstat(CORPSE, _keepTraits ? mtmp : null, mdat, x, y, corpstatflags);
        /* bury branch (CORPSTAT_BURIED → bury_an_obj) intentionally
           omitted here — see build-engine.mjs comment. */
    }
    /* All special cases should precede the G_NOCORPSE check */
    if (!obj) {
        return null;
    }
    /* if polymorph or undead turning has killed this monster,
       prevent the same attack beam from hitting its corpse */
    if (game.context.bypasses) {
        bypass_obj(obj);
    }
    if (((mtmp).mextra && ((mtmp).mextra.mgivenname))) {
        obj = await oname(obj, ((mtmp).mextra.mgivenname), 0);
    }
    /*  Avoid "It was hidden under a green mold corpse!"
     *  during Blind combat. An unseen monster referred to as "it"
     *  could be killed and leave a corpse.  If a hider then hid
     *  underneath it, you could be told the corpse type of a
     *  monster that you never knew was there without this.
     *  The code in hitmu() substitutes the word "something"
     *  if the corpse's obj->dknown is 0.
     */
    if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !sensemon(mtmp)) {
        clear_dknown(obj);
    }
    await stackobj(obj);
    await newsym(x, y);
    if (obj.ox != x || obj.oy != y) {
        await newsym(obj.ox, obj.oy);
    }
    return obj;
}
/* check mtmp and water/lava for compatibility, 0 (survived), 1 (died) */
export async function minliquid(mtmp) {
    let res = 0;
    /* set up flag for mondead() and xkilled() */
    game.iflags.sad_feeling = (mtmp.mtame && !canseemon(mtmp));
    res = await minliquid_core(mtmp);
    game.iflags.sad_feeling = (0);
    return res;
}
/* guts of minliquid() */
export async function minliquid_core(mtmp) {
    let inpool = 0;
    let inlava = 0;
    let infountain = 0;
    let waterwall = is_waterwall(mtmp.mx, mtmp.my);
    /* [ceiling clingers are handled below] */
    inpool = (is_pool(mtmp.mx, mtmp.my) && (!((((mtmp.data).mflags1 & 1) != 0) || ((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)) || (((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))));
    inlava = (is_lava(mtmp.mx, mtmp.my) && !((((mtmp.data).mflags1 & 1) != 0) || ((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT)));
    infountain = ((game.level.locations[mtmp.mx][mtmp.my].typ) == FOUNTAIN);
    /* Flying and levitation keeps our steed out of the liquid
       (but not water-walking or swimming; note: if hero is in a
       water location on the Plane of Water, flight and levitating
       are blocked so this (Flying || Levitation) test fails there
       and steed will be subject to water effects, as intended) */
    if (mtmp == game.u.usteed && (((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) && !waterwall) {
        return 0;
    }
    if (mtmp.data == game.mons[PM_GREMLIN] && (inpool || infountain) && rn2(3)) {
        if (await split_mon(mtmp, null)) {
            await dryup(mtmp.mx, mtmp.my, (0));
        }
        if (inpool) {
            await water_damage_chain(mtmp.minvent, (0));
        }
        return 0;
    } else if (mtmp.data == game.mons[PM_IRON_GOLEM] && inpool && !rn2(5)) {
        let dam = d(2, 6);
        /* does not depend on seeing the monster; the shield effect is visible */
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
            await pline_mon(mtmp, "%s rusts.", await Monnam(mtmp));
        }
        mtmp.mhp -= dam;
        if (mtmp.mhpmax > dam) {
            mtmp.mhpmax -= dam;
        }
        if (((mtmp).mhp < 1)) {
            await mondied(mtmp);
            if (((mtmp).mhp < 1)) {
                return 1;
            }
        }
        await water_damage_chain(mtmp.minvent, (0));
        return 0;
    }
    if (inlava) {
        if (!(((mtmp.data).mflags1 & 16) != 0) && !(mtmp.data == game.mons[PM_FIRE_ELEMENTAL] || mtmp.data == game.mons[PM_SALAMANDER])) {
            if ((((mtmp.data).mflags1 & 33554432) != 0) && !await tele_restrict(mtmp)) {
                if (await rloc(mtmp, 2)) {
                    return 0;
                }
            }
            if (!await Resists_Elem(mtmp, FIRE_RES)) {
                /* genocided monster can't be life-saved */
                if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                    let dummy = mtmp.data.mattk[0];
                    let how = on_fire(mtmp.data, dummy);
                    await pline_mon(mtmp, "%s %s.", await Monnam(mtmp), !strcmp(how, "boiling") ? "boils away" : !strcmp(how, "melting") ? "melts away" : "burns to a crisp");
                }
                if (game.context.mon_moving) {
                    await mondead(mtmp);
                } else {
                    await xkilled(mtmp, 1);
                }
            } else {
                mtmp.mhp -= 1;
                if (((mtmp).mhp < 1)) {
                    if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                        await pline_mon(mtmp, "%s surrenders to the fire.", await Monnam(mtmp));
                    }
                    await mondead(mtmp);
                } else if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                    await pline_mon(mtmp, "%s burns slightly.", await Monnam(mtmp));
                }
            }
            if (!((mtmp).mhp < 1)) {
                if (m_in_air(mtmp)) {
                    ;
                } else if ((mtmp.data == game.mons[PM_FIRE_ELEMENTAL] || mtmp.data == game.mons[PM_SALAMANDER])) {
                    ;
                } else {
                    await fire_damage_chain(mtmp.minvent, (0), (0), mtmp.mx, mtmp.my);
                    if (!await rloc(mtmp, 2)) {
                        await deal_with_overcrowding(mtmp);
                    }
                }
                return 0;
            }
            return 1;
        }
    } else if (inpool || waterwall) {
        if ((waterwall || !(((mtmp.data).mflags1 & 16) != 0)) && !((((mtmp.data).mflags1 & 2) != 0) || (((mtmp.data).mflags1 & 512) != 0) || (((mtmp.data).mflags1 & 1024) != 0))) {
            if ((((mtmp.data).mflags1 & 33554432) != 0) && !await tele_restrict(mtmp)) {
                if (await rloc(mtmp, 2)) {
                    return 0;
                }
            }
            if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                if (game.context.mon_moving) {
                    await pline_mon(mtmp, "%s drowns.", await Monnam(mtmp));
                } else {
                    await You("drown %s.", await mon_nam(mtmp));
                }
            }
            /* this can happen if previously a fog cloud */
            if ((game.u.uswallow && (game.u.ustuck == (mtmp)))) {
                await pline("%s sinks as %s rushes in and flushes you out.", await Monnam(mtmp), hliquid("water"));
            }
            if (game.context.mon_moving) {
                await mondied(mtmp);
            } else {
                await xkilled(mtmp, 1);
            }
            if (!((mtmp).mhp < 1)) {
                if (m_in_air(mtmp)) {
                    ;
                } else {
                    await water_damage_chain(mtmp.minvent, (0));
                    if (!await rloc(mtmp, 4)) {
                        await deal_with_overcrowding(mtmp);
                    }
                }
                return 0;
            }
            return 1;
        }
    } else {
        if (mtmp.data.mlet == S_EEL && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !(((mtmp.data).mflags1 & 1024) != 0)) {
            /* but eels have a difficult time outside */
            /* as mhp gets lower, the rate of further loss slows down */
            if (mtmp.mhp > 1 && rn2(mtmp.mhp) > rn2(8)) {
                mtmp.mhp--;
            }
            await monflee(mtmp, 2, (0), (0));
        }
    }
    return 0;
}
/* calculate 'mon's movement for current turn; called from moveloop() */
/* True: adjust for moving;
                       * False: just adjust for speed */
export function mcalcmove(mon, m_moving) {
    fnEnter("mcalcmove", "mon.c", 0);
    let mmove = mon.data.mmove;
    let mmove_adj = 0;
    if (mon.mspeed == 1) {
        if (mmove < 12) {
            mmove = Math.trunc((2 * mmove + 1) / 3);
        /* Note: MSLOW's `+ 1' prevents slowed speed 1 getting reduced to 0;
     *       MFAST's `+ 2' prevents hasted speed 1 from becoming a no-op;
     *       both adjustments have negligible effect on higher speeds.
     */
        /* slow-monster effects work better against faster monsters: they
           lose 1/3 of their speed below 12 but 2/3 of their speed above */
        } else {
            mmove = 4 + (Math.trunc(mmove / 3));
        }
    } else if (mon.mspeed == 2) {
        mmove = Math.trunc((4 * mmove + 2) / 3);
    }
    if (mon == game.u.usteed && game.u.ugallop && game.context.mv) {
        /* increase movement by a factor of 1.5; also increase variance of
           movement speed (if it's naturally 24, we don't want it to always
           become 36) */
        mmove = Math.trunc(((rn2(2) ? 4 : 5) * mmove) / 3);
    }
    if (m_moving) {
        /* Randomly round the monster's speed to a multiple of NORMAL_SPEED.
           This makes it impossible for the player to predict when they'll
           get a free turn (thus preventing exploits like "melee kiting"),
           while retaining guarantees about shopkeepers not being outsped
           by a normal-speed player, normal-speed players being unable
           to open up a gap when fleeing a normal-speed monster, etc. */
        mmove_adj = mmove % 12;
        mmove -= mmove_adj;
        if (rn2(12) < mmove_adj) {
            mmove += 12;
        }
    }
    return mmove;
}
/* actions that happen once per ``turn'', regardless of each
   individual monster's metabolism; some of these might need to
   be reclassified to occur more in proportion with movement rate */
export async function mcalcdistress() {
    fnEnter("mcalcdistress", "mon.c", 0);
    await iter_mons(m_calcdistress);
}
export async function m_calcdistress(mtmp) {
    if (mtmp.data.mmove == 0) {
        if (game.vision_full_recalc) {
            await vision_recalc(0);
        }
        if (await minliquid(mtmp)) {
            return;
        }
    }
    await mon_regen(mtmp, (0));
    /* possibly polymorph shapechangers and lycanthropes */
    if (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS)) {
        await decide_to_shapeshift(mtmp);
    }
    await were_change(mtmp);
    /* gradually time out temporary problems */
    if (mtmp.mblinded && !--mtmp.mblinded) {
        mtmp.mcansee = 1;
    }
    if (mtmp.mfrozen && !--mtmp.mfrozen) {
        /* construct a 'before' argument to pass to pline(); this used
           to construct a dynamic format string but that's overkill */
        /* sandestins are stoning-immune so if hit by stoning damage
           they revert to innate shape rather than become a statue */
        mtmp.mcanmove = 1;
    }
    /* FIXME: mtmp->mlstmv ought to be updated here */
    if (mtmp.mfleetim && !--mtmp.mfleetim) {
        mtmp.mflee = 0;
    }
}
/* perform movement for a single monster.
   meant to be used with iter_mons_safe. */
export async function movemon_singlemon(mtmp) {
    fnEnter("movemon_singlemon", "mon.c", 0);
    /* end monster movement early if hero is flagged to leave the level */
    if (game.u.utotype || game.program_state.done_hup) {
        /* changed levels, so these monsters are dormant */
        game.somebody_can_move = (0);
        return (1);
    }
    if (mtmp.isgd && !mtmp.mx && !(mtmp.mstate & 4)) {
        if (game.moves > mtmp.mlstmv) {
            await gd_move(mtmp);
            mtmp.mlstmv = game.moves;
        }
        return (0);
    }
    if (((mtmp).mhp < 1)) {
        return (0);
    }
    /* monster isn't on this map anymore */
    if (((mtmp).mstate != 0)) {
        return (0);
    }
    await m_everyturn_effect(mtmp);
    /* Find a monster that we have not treated yet. */
    if (mtmp.movement < 12) {
        return (0);
    }
    mtmp.movement -= 12;
    if (mtmp.movement >= 12) {
        game.somebody_can_move = (1);
    }
    if (game.vision_full_recalc) {
        await vision_recalc(0);
    }
    /* reset obj bypasses before next monster moves */
    /* in case a mon moved w/ a light source */
    /* reset obj bypasses after last monster has moved */
    if (game.context.bypasses) {
        clear_bypasses();
    }
    clear_splitobjs();
    if (await minliquid(mtmp)) {
        return (0);
    }
    if (mtmp.misc_worn_check & 536870912) {
        /* after losing equipment, try to put on replacement */
        let oldworn = 0;
        if (mtmp.mpeaceful || mtmp.mtame || dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) > (3 * 3)) {
            /* hostiles only try to equip things if they think hero isn't
         * nearby; if they think hero is nearby, leave the flag intact so
         * that it can be checked again on subsequent moves until the hero
         * is perceived to be farther away. */
            mtmp.misc_worn_check &= ~536870912;
            oldworn = mtmp.misc_worn_check;
            await m_dowear(mtmp, (0));
            /* is spending this turn equipping */
            if (mtmp.misc_worn_check != oldworn || !mtmp.mcanmove) {
                return (0);
            }
        }
    }
    if ((((mtmp.data).mflags1 & 256) != 0)) {
        if (await restrap(mtmp)) {
            return (0);
        }
        if (((mtmp).m_ap_type & 7) == M_AP_FURNITURE || ((mtmp).m_ap_type & 7) == M_AP_OBJECT) {
            return (0);
        }
        if (mtmp.mundetected) {
            return (0);
        }
    } else if (mtmp.data.mlet == S_EEL && !mtmp.mundetected && (mtmp.mflee || !(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) && !canseemon(mtmp) && !rn2(4)) {
        if (await hideunder(mtmp)) {
            return (0);
        }
    }
    if ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !mtmp.iswiz && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0))) {
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0) && (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 8 * 8) && await fightm(mtmp)) {
            return (0);
        }
    }
    await dochugw(mtmp, (1));
    return (0);
}
/* perform movement for all monsters */
export async function movemon() {
    fnEnter("movemon", "mon.c", 0);
    game.somebody_can_move = (0);
    await iter_mons_safe(movemon_singlemon);
    if (any_light_source()) {
        game.vision_full_recalc = 1;
    }
    if (game.context.bypasses) {
        clear_bypasses();
    }
    clear_splitobjs();
    await dmonsfree();
    if (game.u.utotype) {
        await deferred_goto();
        game.somebody_can_move = (0);
    }
    return game.somebody_can_move;
}
/* dispose of contents of an eaten container; used for pets and other mons */
export async function meatbox(mon, otmp) {
    let engulf_contents = (mon.data == game.mons[PM_GELATINOUS_CUBE]);
    let x = mon.mx;
    let y = mon.my;
    let cobj = null;
    if (!((otmp).cobj != null) || !isok(x, y)) {
        return;
    }
    if (!engulf_contents && ((game.viz_array[y][x] & 2) != 0)) {
        await pline("%s contents spill out onto the %s.", s_suffix(await The(await distant_name(otmp, xname))), surface(x, y));
    }
    while ((cobj = otmp.cobj) != null) {
        await obj_extract_self(cobj);
        if (otmp.otyp == ICE_BOX) {
            await removed_from_icebox(cobj);
        }
        if (engulf_contents) {
            await mpickobj(mon, cobj);
        } else {
            if (!await flooreffects(cobj, x, y, "")) {
                await place_object(cobj, x, y);
            }
        }
    }
}
/* Monster mtmp consumes an object.
   Monster may die, polymorph, grow up, heal, etc; meating is not changed.
   Object is extracted from any linked list and freed. */
export async function m_consume_obj(mtmp, otmp) {
    let ispet = mtmp.mtame;
    if (!ispet && mtmp.mhp < mtmp.mhpmax) {
        await healmon(mtmp, game.objects[otmp.otyp].oc_weight, 0);
    }
    if (((otmp).cobj != null)) {
        await meatbox(mtmp, otmp);
    }
    if (otmp == game.uball) {
        await unpunish();
        await delobj(otmp);
    } else if (otmp == game.uchain) {
        await unpunish();
    } else {
        let deadmimic = 0;
        let slimer = 0;
        let poly = 0;
        let grow = 0;
        let heal = 0;
        let eyes = 0;
        let mstone = 0;
        let vis = canseemon(mtmp);
        let corpsenm = (otmp.otyp == CORPSE ? otmp.corpsenm : NON_PM);
        deadmimic = (otmp.otyp == CORPSE && (corpsenm == PM_SMALL_MIMIC || corpsenm == PM_LARGE_MIMIC || corpsenm == PM_GIANT_MIMIC));
        slimer = (otmp.otyp == GLOB_OF_GREEN_SLIME);
        poly = (((otmp).otyp == CORPSE || (otmp).otyp == EGG || (otmp).otyp == TIN) && (otmp).corpsenm >= LOW_PM && (pm_to_cham((otmp).corpsenm) != NON_PM || dmgtype(game.mons[(otmp).corpsenm], 43)));
        grow = (((otmp).otyp == CORPSE || (otmp).otyp == EGG || (otmp).otyp == TIN) && (otmp).corpsenm == PM_WRAITH);
        heal = (((otmp).otyp == CORPSE || (otmp).otyp == EGG || (otmp).otyp == TIN) && (otmp).corpsenm == PM_NURSE);
        eyes = (otmp.otyp == CARROT);
        mstone = (((otmp).otyp == CORPSE || (otmp).otyp == EGG || (otmp).otyp == TIN) && ((otmp.corpsenm) >= LOW_PM && (otmp.corpsenm) < NUMMONS) && (((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) || (game.mons[otmp.corpsenm]) == game.mons[PM_MEDUSA]));
        await delobj(otmp);
        if (poly || slimer) {
            let ptr = slimer ? game.mons[PM_GREEN_SLIME] : null;
            await newcham(mtmp, ptr, vis ? 1 : 0);
        }
        if (grow) {
            if ((ispet && mtmp.m_lev < mtmp.data.mlevel + 15) || !ispet) {
                await grow_up(mtmp, null);
            }
        }
        if (mstone) {
            if (poly_when_stoned(mtmp.data)) {
                await mon_to_stone(mtmp);
            } else if (!await Resists_Elem(mtmp, STONE_RES)) {
                if (vis) {
                    await pline_mon(mtmp, "%s turns to stone!", await Monnam(mtmp));
                }
                await monstone(mtmp);
            }
        }
        if (heal) {
            await healmon(mtmp, mtmp.mhpmax, 0);
        }
        if ((eyes || heal) && !mtmp.mcansee) {
            await mcureblindness(mtmp, canseemon(mtmp));
        }
        if (ispet && deadmimic) {
            await quickmimic(mtmp);
        }
        if (otmp.otyp == EGG && corpsenm == PM_PYROLISK) {
            await explode(mtmp.mx, mtmp.my, -11, d(3, 6), 0, EXPL_FIERY);
        }
        if (corpsenm != NON_PM) {
            await mon_givit(mtmp, game.mons[corpsenm]);
        }
    }
}
/*
 * Maybe eat a metallic object (not just gold).
 * Return value: 0 => nothing happened, 1 => monster ate something,
 * 2 => monster died (it must have grown into a genocided form, but
 * that can't happen at present because nothing which eats objects
 * has young and old forms).
 */
export async function meatmetal(mtmp) {
    let otmp = null;
    let otmpname = null;
    let vis = canseemon(mtmp);
    /* If a pet, eating is handled separately, in dog.c */
    /* if a pet, eating is handled separately, in dog.c */
    if (mtmp.mtame) {
        return 0;
    }
    for (otmp = game.level.objects[mtmp.mx][mtmp.my]; otmp; otmp = otmp.v.v_nexthere) {
        if ((mtmp.data == game.mons[PM_RUST_MONSTER] && !(game.objects[otmp.otyp].oc_material == IRON)) || (otmp.otyp == AMULET_OF_STRANGULATION || otmp.otyp == RIN_SLOW_DIGESTION) || (otmp.otrapped && !await Resists_Elem(mtmp, POISON_RES))) {
            continue;
        }
        if ((game.objects[otmp.otyp].oc_material >= IRON && game.objects[otmp.otyp].oc_material <= MITHRIL) && !obj_resists(otmp, 5, 95) && await touch_artifact(otmp, mtmp)) {
            if (mtmp.data == game.mons[PM_RUST_MONSTER] && otmp.oerodeproof) {
                if (vis) {
                    otmpname = await distant_name(otmp, doname);
                    if (game.flags.verbose) {
                        await pline_mon(mtmp, "%s eats %s!", await Monnam(mtmp), otmpname);
                    }
                }
                /* The object's rustproofing is gone now */
                otmp.oerodeproof = 0;
                /* no timeout but will eventually wear off */
                mtmp.mstun = 1;
                if (vis) {
                    otmpname = await distant_name(otmp, doname);
                    if (game.flags.verbose) {
                        await pline_mon(mtmp, "%s spits %s out in disgust!", await Monnam(mtmp), otmpname);
                    }
                }
            } else {
                if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                    otmpname = await distant_name(otmp, doname);
                    if (game.flags.verbose) {
                        await pline_mon(mtmp, "%s eats %s!", await Monnam(mtmp), otmpname);
                    }
                } else {
                    if (game.flags.verbose) {
                        ;
                        await You_hear("a crunching sound.");
                    }
                }
                mtmp.meating = Math.trunc(otmp.owt / 2) + 1;
                await m_consume_obj(mtmp, otmp);
                if (((mtmp).mhp < 1)) {
                    return 2;
                }
                if (rnd(25) < 3) {
                    await mksobj_at(ROCK, mtmp.mx, mtmp.my, (1), (0));
                }
                await newsym(mtmp.mx, mtmp.my);
                return 1;
            }
        }
    }
    return 0;
}
/* monster eats a pile of objects */
/* for gelatinous cubes */
export async function meatobj(mtmp) {
    let otmp = null;
    let otmp2 = null;
    let ptr = null;
    let original_ptr = mtmp.data;
    let count = 0;
    let ecount = 0;
    let buf = '';
    let otmpname = null;
    buf = '';
    if (mtmp.mtame) {
        return 0;
    }
    for (otmp = game.level.objects[mtmp.mx][mtmp.my]; otmp; otmp = otmp2) {
        /* eat organic objects, including cloth and wood, if present;
       engulf others, except huge rocks and metal attached to player
       [despite comment at top, doesn't assume that eater is a g-cube] */
        otmp2 = otmp.v.v_nexthere;
        /* avoid special items; once hero picks them up, they'll cease
           being special, becoming eligible for engulf and devore if
           dropped again */
        /* avoid special items; once hero picks them up, they'll cease
           being special, becoming eligible for normal pickup */
        if (((otmp).o_id == game.context.achieveo.mines_prize_oid) || ((otmp).o_id == game.context.achieveo.soko_prize_oid)) {
            continue;
        }
        if (otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_DEATH] || (game.mons[otmp.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[otmp.corpsenm]) == game.mons[PM_PESTILENCE])) {
            let ox = otmp.ox;
            let oy = otmp.oy;
            let revived_it = await revive_corpse(otmp);
            await newsym(ox, oy);
            /* Rider corpse isn't just inedible; can't engulf it either */
            if (!revived_it) {
                continue;
            }
            break;
        } else if ((otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) && !await Resists_Elem(mtmp, STONE_RES)) || otmp.oclass == ROCK_CLASS || otmp == game.uball || otmp == game.uchain || otmp.otyp == SCR_SCARE_MONSTER) {
            continue;
        } else if (!(game.objects[otmp.otyp].oc_material <= WOOD) || obj_resists(otmp, 5, 95) || !await touch_artifact(otmp, mtmp) || (otmp.otyp == AMULET_OF_STRANGULATION || otmp.otyp == RIN_SLOW_DIGESTION) || (otmp.otrapped && !await Resists_Elem(mtmp, POISON_RES)) || ((((otmp).otyp == CORPSE || (otmp).otyp == EGG || (otmp).otyp == TIN) && ((otmp.corpsenm) >= LOW_PM && (otmp.corpsenm) < NUMMONS) && (((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) || (game.mons[otmp.corpsenm]) == game.mons[PM_MEDUSA])) && !await Resists_Elem(mtmp, STONE_RES)) || (otmp.otyp == GLOB_OF_GREEN_SLIME && !((mtmp.data) == game.mons[PM_GREEN_SLIME] || ((mtmp.data) == game.mons[PM_FIRE_VORTEX] || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_SALAMANDER]) || ((mtmp.data).mlet == S_GHOST)))) {
            /* redundant due to non-organic composition but
                      included for emphasis */
            /* cockatrice corpses handled above; this
                      touch_petrifies() check catches eggs */
            ++ecount;
            otmpname = await distant_name(otmp, doname);
            if (ecount == 1) {
                buf = sprintf(buf, "%s engulfs %s.", await Monnam(mtmp), otmpname);
            } else if (ecount == 2) {
                buf = sprintf(buf, "%s engulfs several objects.", await Monnam(mtmp));
            }
            await obj_extract_self(otmp);
            await mpickobj(mtmp, otmp);
        } else {
            ++count;
            if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                otmpname = await distant_name(otmp, doname);
                if (game.flags.verbose) {
                    await pline_mon(mtmp, "%s eats %s!", await Monnam(mtmp), otmpname);
                }
                if (otmp.oclass == SCROLL_CLASS && await objdescr_is(otmp, "YUM YUM")) {
                    await pline("Yum%c", otmp.blessed ? 33 : 46);
                }
            } else {
                ;
                if (game.flags.verbose) {
                    await You_hear("a slurping sound.");
                }
            }
            await m_consume_obj(mtmp, otmp);
            /* in case it polymorphed or died */
            ptr = mtmp.data;
            if (ptr != original_ptr) {
                return !ptr ? 2 : 1;
            }
        }
        if (mtmp.minvis) {
            await newsym(mtmp.mx, mtmp.my);
        }
    }
    if (ecount > 0) {
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0) && game.flags.verbose && __nh_char_at0(buf)) {
            await pline("%s", buf);
        } else if (game.flags.verbose) {
            await You_hear("%s slurping sound%s.", (ecount == 1) ? "a" : "several", (((ecount) == 1) ? "" : "s"));
        }
    }
    return (count > 0 || ecount > 0) ? 1 : 0;
}
/* Monster eats a corpse off the ground.
   Return value is 0 = nothing eaten, 1 = ate a corpse, 2 = died. */
/* for purple worms and other voracious monsters */
export async function meatcorpse(mtmp) {
    let otmp = null;
    let ptr = null;
    let original_ptr = mtmp.data;
    let corpsepm = null;
    let x = mtmp.mx;
    let y = mtmp.my;
    if (mtmp.mtame) {
        return 0;
    }
    for (otmp = sobj_at(CORPSE, x, y); otmp; otmp = nxtobj(otmp, CORPSE, (1))) {
        /* won't get back here if otmp is split or gets used up */
        corpsepm = game.mons[otmp.corpsenm];
        if (((corpsepm).mlet == S_BLOB || (corpsepm).mlet == S_JELLY || (corpsepm).mlet == S_FUNGUS || (corpsepm).mlet == S_VORTEX || (corpsepm).mlet == S_LIGHT || ((corpsepm).mlet == S_ELEMENTAL && (corpsepm) != game.mons[PM_STALKER]) || ((corpsepm).mlet == S_GOLEM && (corpsepm) != game.mons[PM_FLESH_GOLEM] && (corpsepm) != game.mons[PM_LEATHER_GOLEM]) || ((corpsepm).mlet == S_GHOST)) || ((((corpsepm) == game.mons[PM_COCKATRICE] || (corpsepm) == game.mons[PM_CHICKATRICE]) || (corpsepm) == game.mons[PM_MEDUSA]) && !await Resists_Elem(mtmp, STONE_RES))) {
            continue;
        }
        if (((corpsepm) == game.mons[PM_DEATH] || (corpsepm) == game.mons[PM_FAMINE] || (corpsepm) == game.mons[PM_PESTILENCE])) {
            let revived_it = await revive_corpse(otmp);
            await newsym(x, y);
            if (!revived_it) {
                continue;
            }
            break;
        }
        if (otmp.quan > 1) {
            otmp = await splitobj(otmp, 1);
        }
        if (((game.viz_array[y][x] & 2) != 0) && canseemon(mtmp)) {
            let otmpname = await distant_name(otmp, doname);
            if (game.flags.verbose) {
                await pline_mon(mtmp, "%s eats %s!", await Monnam(mtmp), otmpname);
            }
        } else {
            ;
            if (game.flags.verbose) {
                await You_hear("a masticating sound.");
            }
        }
        await m_consume_obj(mtmp, otmp);
        ptr = mtmp.data;
        if (ptr != original_ptr) {
            return !ptr ? 2 : 1;
        }
        if (mtmp.minvis) {
            await newsym(x, y);
        }
        return 1;
    }
    return 0;
}
/* give monster property prop */
export async function mon_give_prop(mtmp, prop) {
    let msg = null;
    let intrinsic = 0;
    switch (prop) {
        /* Pets don't have all the fields that the hero does, so they can't get
       all the same intrinsics.  If it happens to choose strength gain or
       teleport control or whatever, ignore it. */
        case FIRE_RES:
            msg = "%s shivers slightly.";
            break;
        case COLD_RES:
            msg = "%s looks quite warm.";
            break;
        case SLEEP_RES:
            msg = "%s looks wide awake.";
            break;
        case DISINT_RES:
            msg = "%s looks very firm.";
            break;
        case SHOCK_RES:
            msg = "%s crackles with static electricity.";
            break;
        case POISON_RES:
            msg = "%s looks healthy.";
            break;
        default:
            return;
            break;
    }
    intrinsic = ((FIRE_RES <= (prop) && (prop) <= STONE_RES) ? (1 << ((prop) - 1)) : 0);
    /* Don't give message if it already had this property intrinsically, but
       still do grant the intrinsic if it only had it from mresists.
       Do print the message if it only had this property extrinsically, which
       is why mon_resistancebits isn't used here. */
    if ((mtmp.data.mresists | mtmp.mintrinsics) & intrinsic) {
        msg = null;
    }
    if (intrinsic) {
        mtmp.mintrinsics |= intrinsic;
    }
    if (canseemon(mtmp) && msg) {
        await pline_mon(mtmp, msg, await Monnam(mtmp));
    }
}
/* Maybe give an intrinsic to monster from eating corpse that confers it. */
export async function mon_givit(mtmp, ptr) {
    let prop = await corpse_intrinsic(ptr);
    let vis = canseemon(mtmp);
    if (((mtmp).mhp < 1)) {
        return;
    }
    if (ptr == game.mons[PM_STALKER]) {
        if (!mtmp.perminvis || mtmp.invis_blkd) {
            /*
         * Invisible stalker isn't flagged as conferring invisibility
         * so prop is 0.  For hero, eating a stalker corpse confers
         * temporary invisibility if hero is visible.  When already
         * invisible, if confers permanent invisibility and also
         * permanent see invisible.  For monsters, only permanent
         * invisibility is possible; temporary invisibility and see
         * invisible aren't implemented for them.
         *
         * A monster being invisible gains no benefit against other
         * monsters, and an invisible pet when hero can't see invisible
         * is a nuisance at best, so this is probably detrimental.
         * Players will just have to live with it if they want to be
         * able to have pets gain intrinsics from eating corpses.
         */
            let mtmpbuf = '';
            mtmpbuf = strcpy(mtmpbuf, await Monnam(mtmp));
            await mon_set_minvis(mtmp, (0));
            if (vis) {
                await pline_mon(mtmp, "%s %s.", mtmpbuf, !(canseemon(mtmp) || sensemon(mtmp)) ? "vanishes" : mtmp.invis_blkd ? "seems to flicker" : "becomes invisible");
            }
        }
        mtmp.mstun = 1;
        return;
    }
    if (prop == 0) {
        return;
    }
    /* no intrinsic from this corpse */
    if (!should_givit(prop, ptr)) {
        return;
    }
    await mon_give_prop(mtmp, prop);
}
export async function mpickgold(mtmp) {
    let gold = null;
    let mat_idx = 0;
    if ((gold = g_at(mtmp.mx, mtmp.my)) != null) {
        mat_idx = game.objects[gold.otyp].oc_material;
        await obj_extract_self(gold);
        await add_to_minv(mtmp, gold);
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
            if (game.flags.verbose && !mtmp.isgd) {
                await pline_mon(mtmp, "%s picks up some %s.", await Monnam(mtmp), mat_idx == GOLD ? "gold" : "money");
            }
            await newsym(mtmp.mx, mtmp.my);
        }
    }
}
/* monster picks up one item stack from the map location they are at */
export async function mpickstuff(mtmp) {
    let otmp = null;
    let otmp2 = null;
    let otmp3 = null;
    let carryamt = 0;
    /* prevent shopkeepers from leaving the door of their shop */
    if (mtmp.isshk && inhishop(mtmp)) {
        return (0);
    }
    /* non-tame monsters normally don't go shopping */
    if (!mtmp.mtame && in_rooms(mtmp.mx, mtmp.my, SHOPBASE) && rn2(25)) {
        return (0);
    }
    /* item in a pool, but monster can't swim */
    if (!could_reach_item(mtmp, mtmp.mx, mtmp.my)) {
        return (0);
    }
    for (otmp = game.level.objects[mtmp.mx][mtmp.my]; otmp; otmp = otmp2) {
        otmp2 = otmp.v.v_nexthere;
        if (((otmp).o_id == game.context.achieveo.mines_prize_oid) || ((otmp).o_id == game.context.achieveo.soko_prize_oid)) {
            continue;
        }
        if (await mon_would_take_item(mtmp, otmp)) {
            /* Nymphs take everything.  Most monsters don't pick up corpses. */
            if (otmp.otyp == CORPSE && mtmp.data.mlet != S_NYMPH && !((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) && otmp.corpsenm != PM_LIZARD && !(((game.mons[otmp.corpsenm]).mflags1 & 134217728) != 0)) {
                continue;
            }
            if (!await can_touch_safely(mtmp, otmp)) {
                continue;
            }
            carryamt = await can_carry(mtmp, otmp);
            if (carryamt == 0) {
                continue;
            }
            /* handle cases where the critter can only get some */
            otmp3 = otmp;
            if (carryamt != otmp.quan) {
                otmp3 = await splitobj(otmp, carryamt);
            }
            if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                let otmpname = await distant_name(otmp, doname);
                if (game.flags.verbose) {
                    await pline_mon(mtmp, "%s picks up %s.", await Monnam(mtmp), otmpname);
                }
            }
            await obj_extract_self(otmp3);
            await mpickobj(mtmp, otmp3);
            /* let them try to equip it on the next turn */
            /* equip replacement amulet, if any, on next move */
            check_gear_next_turn(mtmp);
            await newsym(mtmp.mx, mtmp.my);
            return (1);
        }
    }
    return (0);
}
export function curr_mon_load(mtmp) {
    let curload = 0;
    let obj = null;
    for (obj = mtmp.minvent; obj; obj = obj.nobj) {
        if (obj.otyp != BOULDER || !(((mtmp.data).mflags2 & 134217728) != 0)) {
            curload += obj.owt;
        }
    }
    return curload;
}
export function max_mon_load(mtmp) {
    let maxload = 0;
    if (!mtmp.data.cwt) {
        maxload = Math.trunc((MAX_CARR_CAP * mtmp.data.msize) / 2);
    } else if (!(((mtmp.data).mflags2 & 67108864) != 0) || ((((mtmp.data).mflags2 & 67108864) != 0) && (mtmp.data.cwt > WT_HUMAN))) {
        maxload = Math.trunc((MAX_CARR_CAP * mtmp.data.cwt) / WT_HUMAN);
    /* Base monster carrying capacity is equal to human maximum
     * carrying capacity, or half human maximum if not strong.
     * (for a polymorphed player, the value used would be the
     * non-polymorphed carrying capacity instead of max/half max).
     * This is then modified by the ratio between the monster weights
     * and human weights.  Corpseless monsters are given a capacity
     * proportional to their size instead of weight.
     */
    /*strong monsters w/cwt <= WT_HUMAN*/
    } else {
        maxload = MAX_CARR_CAP;
    }
    if (!(((mtmp.data).mflags2 & 67108864) != 0)) {
        maxload = Math.trunc(maxload / 2);
    }
    if (maxload < 1) {
        maxload = 1;
    }
    return maxload;
}
/* can monster touch object safely? */
export async function can_touch_safely(mtmp, otmp) {
    let otyp = otmp.otyp;
    let mdat = mtmp.data;
    if (otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE]) && !(mtmp.misc_worn_check & 16) && !await Resists_Elem(mtmp, STONE_RES)) {
        return (0);
    }
    if (otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_DEATH] || (game.mons[otmp.corpsenm]) == game.mons[PM_FAMINE] || (game.mons[otmp.corpsenm]) == game.mons[PM_PESTILENCE])) {
        return (0);
    }
    if (game.objects[otyp].oc_material == SILVER && mon_hates_silver(mtmp) && (otyp != BELL_OF_OPENING || !(((mdat).mflags3 & 31)))) {
        return (0);
    }
    if (!await touch_artifact(otmp, mtmp)) {
        return (0);
    }
    return (1);
}
/* for restricting monsters' object-pickup.
 *
 * to support the new pet behavior, this now returns the max # of objects
 * that a given monster could pick up from a pile. frequently this will be
 * otmp->quan, but special cases for 'only one' now exist.
 *
 * this will probably cause very amusing behavior with pets and gold coins.
 *
 * TODO: allow picking up 2-N objects from a pile of N based on weight.
 *       Change from 'int' to 'long' to accommodate big stacks of gold.
 *       Right now we fake it by reporting a partial quantity, but the
 *       likesgold handling m_move results in picking up the whole stack.
 */
export async function can_carry(mtmp, otmp) {
    let iquan = 0;
    let otyp = otmp.otyp;
    let newload = otmp.owt;
    let mdat = mtmp.data;
    let nattk = 0;
    if ((((mdat).mflags1 & 2048) != 0)) {
        return 0;
    }
    if (!await can_touch_safely(mtmp, otmp)) {
        return 0;
    }
    /* hostile monsters who like gold will pick up the whole stack;
       tame monsters with hands will pick up the partial stack */
    iquan = (otmp.quan > 32767) ? 20000 + rn2(32767 - 20000 + 1) : otmp.quan;
    if (iquan > 1) {
        /* monsters without hands can't pick up multiple objects at once
     * unless they have an engulfing attack
     *
     * ...dragons, of course, can always carry gold pieces and gems somehow
     */
        let glomper = (0);
        if (mtmp.data.mlet == S_DRAGON && (otmp.oclass == COIN_CLASS || otmp.oclass == GEM_CLASS)) {
            glomper = (1);
        } else {
            for (nattk = 0; nattk < 6; nattk++) {
                if (mtmp.data.mattk[nattk].aatyp == 11) {
                    glomper = (1);
                    break;
                }
            }
        }
        if ((mtmp.data.mflags1 & 8192) && !glomper) {
            return 1;
        }
    }
    /* steeds don't pick up stuff (to avoid shop abuse) */
    if (mtmp == game.u.usteed) {
        return 0;
    }
    if (mtmp.isshk) {
        return iquan;
    }
    if (mtmp.mpeaceful && !mtmp.mtame) {
        return 0;
    }
    /* otherwise players might find themselves obligated to violate
     * their alignment if the monster takes something they need
     */
    /* special--boulder throwers carry unlimited amounts of boulders */
    if ((((mdat).mflags2 & 134217728) != 0) && otyp == BOULDER) {
        return iquan;
    }
    /* nymphs deal in stolen merchandise, but not boulders or statues */
    if (mdat.mlet == S_NYMPH) {
        return (otmp.oclass == ROCK_CLASS) ? 0 : iquan;
    }
    if (curr_mon_load(mtmp) + newload > max_mon_load(mtmp)) {
        return 0;
    }
    return iquan;
}
/* is <nx,ny> in direct line with where 'mon' thinks hero is? */
export function monlineu(mon, nx, ny) {
    return online2(nx, ny, mon.mux, mon.muy);
}
/* return flags based on monster data, for mfndpos() */
export async function mon_allowflags(mtmp) {
    let allowflags = 0;
    let can_open = !((((mtmp.data).mflags1 & 8192) != 0) || ((mtmp.data).msize < 1));
    let can_unlock = ((can_open && monhaskey(mtmp, (1))) || mtmp.iswiz || ((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE]));
    let doorbuster = (((mtmp.data).mflags2 & 8192) != 0);
    /* don't tunnel if on rogue level or if hostile and close enough
       to prefer a weapon; same criteria as in m_move() */
    let can_tunnel = ((((mtmp.data).mflags1 & 32) != 0) && !(((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))));
    if (can_tunnel && (((mtmp.data).mflags1 & 64) != 0) && ((!mtmp.mpeaceful || (game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic)) && dist2(mtmp.mx, mtmp.my, mtmp.mux, mtmp.muy) <= 8)) {
        can_tunnel = (0);
    }
    if (mtmp.mtame) {
        allowflags |= 524288 | 131072 | 536870912 | 1073741824;
    } else if (mtmp.mpeaceful) {
        allowflags |= 536870912 | 1073741824;
    } else {
        allowflags |= 262144;
    }
    if ((game.u.uprops[CONFLICT].intrinsic || game.u.uprops[CONFLICT].extrinsic) && !resist_conflict(mtmp)) {
        allowflags |= 262144;
    }
    if (mtmp.isshk) {
        allowflags |= 1073741824;
    }
    if (mtmp.ispriest) {
        allowflags |= 1073741824 | 536870912;
    }
    if ((((mtmp.data).mflags1 & 8) != 0)) {
        allowflags |= (33554432 | 67108864);
    }
    if ((((mtmp.data).mflags2 & 134217728) != 0) || m_can_break_boulder(mtmp)) {
        allowflags |= 33554432;
    }
    if (can_tunnel) {
        allowflags |= 134217728;
    }
    if (doorbuster) {
        allowflags |= 16777216;
    }
    if (can_open) {
        allowflags |= 4194304;
    }
    if (can_unlock) {
        allowflags |= 8388608;
    }
    if (passes_bars(mtmp.data) && (mtmp != game.u.ustuck || ((((game.youmonst.data).mflags1 & 1048576) != 0) || ((game.youmonst.data).msize < 1)))) {
        allowflags |= 268435456;
    }
    /* restrict engulfer or holder who might try to pass iron bars while
           carrying hero; accept small subset for poly'd hero passes_bars() */
    /* can't do this here; leave it for mfndpos() */
    if ((((mtmp.data).mflags2 & 4096) != 0) || ((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE])) {
        allowflags |= 536870912;
    }
    if (((mtmp.data).mlet == S_UNICORN && (((mtmp.data).mflags2 & 536870912) != 0)) && !await noteleport_level(mtmp)) {
        allowflags |= 2097152;
    }
    if ((((mtmp.data).mflags2 & 8) != 0) || mtmp.data == game.mons[PM_MINOTAUR]) {
        allowflags |= 1073741824;
    }
    if (((((mtmp.data).mflags2 & 2) != 0) && mtmp.data.mlet != S_GHOST) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) {
        allowflags |= 2147483648;
    }
    return allowflags;
}
/* return TRUE if monster is up in the air/on the ceiling */
export function m_in_air(mtmp) {
    return ((((mtmp.data).mflags1 & 1) != 0) || ((mtmp.data).mlet == S_EYE || (mtmp.data).mlet == S_LIGHT) || ((((mtmp.data).mflags1 & 16) != 0) && has_ceiling(game.u.uz) && mtmp.mundetected));
}
/* return number of acceptable neighbour positions */
export async function mfndpos(mon, data, flag) {
    let mdat = mon.data;
    let ttmp = null;
    let x = 0;
    let y = 0;
    let nx = 0;
    let ny = 0;
    let cnt = 0;
    let ntyp = 0;
    let nowtyp = 0;
    let wantpool = 0;
    let poolok = 0;
    let lavaok = 0;
    let nodiag = 0;
    let rockok = (0);
    let treeok = (0);
    let thrudoor = 0;
    let maxx = 0;
    let maxy = 0;
    let poisongas_ok = 0;
    let in_poisongas = 0;
    let gas_reg = null;
    let gas_glyph = (((S_poisoncloud) == S_stone) ? GLYPH_CMAP_STONE_OFF : ((S_poisoncloud) <= S_trwall) ? ((S_poisoncloud) - S_vwall + (In_mines(game.u.uz) ? GLYPH_CMAP_MINES_OFF : In_hell(game.u.uz) ? GLYPH_CMAP_GEH_OFF : (((((game.dungeon_topology.d_knox_level)).dlevel || ((game.dungeon_topology.d_knox_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_knox_level)))) ? GLYPH_CMAP_KNOX_OFF : ((game.u.uz).dnum == (game.dungeon_topology.d_sokoban_dnum)) ? GLYPH_CMAP_SOKO_OFF : GLYPH_CMAP_MAIN_OFF)) : ((S_poisoncloud) < S_altar) ? (((S_poisoncloud) - S_ndoor) + GLYPH_CMAP_A_OFF) : ((S_poisoncloud) == S_altar) ? ((((2) & 16) == 16) ? (GLYPH_ALTAR_OFF + altar_other) : (((2) & 7) == 4) ? (GLYPH_ALTAR_OFF + altar_lawful) : (((2) & 7) == 2) ? (GLYPH_ALTAR_OFF + altar_neutral) : (((2) & 7) == 1) ? (GLYPH_ALTAR_OFF + altar_chaotic) : (GLYPH_ALTAR_OFF + altar_unaligned)) : ((S_poisoncloud) < S_arrow_trap + (TRAPNUM - 1)) ? (((S_poisoncloud) - S_grave) + GLYPH_CMAP_B_OFF) : ((S_poisoncloud) <= S_goodpos) ? (((S_poisoncloud) - S_digbeam) + GLYPH_CMAP_C_OFF) : MAX_GLYPH);
    x = mon.mx;
    y = mon.my;
    nowtyp = game.level.locations[x][y].typ;
    memset(data, 0, 1 /* sizeof(struct mfndposdata) */);
    nodiag = ((mdat.pmidx) == PM_GRID_BUG);
    wantpool = (mdat.mlet == S_EEL);
    poolok = ((!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && m_in_air(mon)) || ((((mdat).mflags1 & 2) != 0) && !wantpool));
    lavaok = (m_in_air(mon) || (mdat == game.mons[PM_FIRE_ELEMENTAL] || mdat == game.mons[PM_SALAMANDER]));
    if (mdat == game.mons[PM_FLOATING_EYE]) {
        lavaok = (0);
    }
    thrudoor = ((flag & (67108864 | 16777216)) != 0);
    poisongas_ok = (await m_poisongas_ok(mon) == 2);
    in_poisongas = ((gas_reg = visible_region_at(x, y)) != null && gas_reg.glyph == gas_glyph);
    if (flag & 134217728) {
        let mw_tmp = null;
        if (!(((mdat).mflags1 & 64) != 0)) {
            /* need to be specific about what can currently be dug */
            rockok = treeok = (1);
        } else if ((mw_tmp = ((mon).mw)) && mw_tmp.cursed && mon.weapon_check == NO_WEAPON_WANTED) {
            rockok = ((mw_tmp.oclass == WEAPON_CLASS || mw_tmp.oclass == TOOL_CLASS) && game.objects[mw_tmp.otyp].oc_subtyp == P_PICK_AXE);
            treeok = ((mw_tmp.oclass == WEAPON_CLASS || mw_tmp.oclass == TOOL_CLASS) && game.objects[mw_tmp.otyp].oc_subtyp == P_AXE);
        } else {
            rockok = (m_carrying(mon, PICK_AXE) || (m_carrying(mon, DWARVISH_MATTOCK) && !await which_armor(mon, 8)));
            treeok = (m_carrying(mon, AXE) || (m_carrying(mon, BATTLE_AXE) && !await which_armor(mon, 8)));
        }
        if (rockok || treeok) {
            thrudoor = (1);
        }
    }
    nexttry: while (true) {
        if (mon.mconf) {
            /* eels prefer the water, but if there is no water nearby,
             they will crawl over land */
            flag |= (262144 | 524288 | 1048576 | 131072);
            flag &= ~2097152;
        }
        if (!mon.mcansee) {
            flag |= 1073741824;
        }
        maxx = ((x + 1) < (80 - 1) ? (x + 1) : (80 - 1));
        maxy = ((y + 1) < (21 - 1) ? (y + 1) : (21 - 1));
        for (nx = ((1) > (x - 1) ? (1) : (x - 1)); nx <= maxx; nx++) {
            for (ny = ((0) > (y - 1) ? (0) : (y - 1)); ny <= maxy; ny++) {
                if (nx == x && ny == y) {
                    continue;
                }
                ntyp = game.level.locations[nx][ny].typ;
                if (((ntyp) < POOL) && !((flag & 67108864) && may_passwall(nx, ny)) && !((((ntyp) == TREE || (game.level.flags.arboreal && (ntyp) == STONE)) ? treeok : rockok) && may_dig(nx, ny))) {
                    continue;
                }
                /* intelligent peacefuls avoid digging shop/temple walls */
                if (((ntyp) < POOL) && rockok && !(((mon.data).mflags1 & 65536) != 0) && (mon.mpeaceful || mon.mtame) && (in_rooms(nx, ny, TEMPLE) || in_rooms(nx, ny, SHOPBASE)) && !(in_rooms(x, y, TEMPLE) || in_rooms(x, y, SHOPBASE))) {
                    continue;
                }
                if (((ntyp) == WATER) && !(((mdat).mflags1 & 2) != 0)) {
                    continue;
                }
                if (ntyp == IRONBARS && (!(flag & 268435456) || ((game.level.locations[nx][ny].flags & 8) && (dmgtype(mdat, 24) || dmgtype(mdat, 42))))) {
                    continue;
                }
                if (((ntyp) == DOOR) && !(((((mdat).mflags1 & 4) != 0) || can_fog(mon)) && !(game.u.uswallow && (game.u.ustuck == (mon)))) && (((game.level.locations[nx][ny].flags & 4) && !(flag & 4194304)) || ((game.level.locations[nx][ny].flags & 8) && !(flag & 8388608))) && !thrudoor) {
                    continue;
                }
                if (!poisongas_ok && !in_poisongas && (gas_reg = visible_region_at(nx, ny)) != null && gas_reg.glyph == gas_glyph) {
                    continue;
                }
                if (nx != x && ny != y && (nodiag || (((nowtyp) == DOOR) && (game.level.locations[x][y].flags & ~1)) || (((ntyp) == DOOR) && (game.level.locations[nx][ny].flags & ~1)) || ((((nowtyp) == DOOR) || ((ntyp) == DOOR)) && (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))))) || ((game.level.monsters[x][ny]) && (game.level.monsters[nx][y]) && await worm_cross(x, y, nx, ny) && !(game.level.monsters[nx][ny]) && (nx != game.u.ux || ny != game.u.uy)))) {
                    continue;
                }
                if ((!lavaok || !(flag & 67108864)) && ntyp == LAVAWALL) {
                    continue;
                }
                if ((poolok || is_pool(nx, ny) == wantpool) && (lavaok || !is_lava(nx, ny))) {
                    /* an amorphous creature can only move under/through a
                   closed door if it doesn't currently have hero engulfed */
                    /* mustn't pass between adjacent long worm segments,
                       but can attack that way */
                    let dispx = 0;
                    let dispy = 0;
                    let monseeu = (mon.mcansee && (!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || (((mdat).mflags1 & 16777216) != 0)));
                    let checkobj = (game.level.objects[nx][ny] != null);
                    if ((game.u.uprops[DISPLACED].intrinsic || game.u.uprops[DISPLACED].extrinsic) && monseeu && mon.mux == nx && mon.muy == ny) {
                        /* Displacement also displaces the Elbereth/scare monster,
                 * as long as you are visible.
                 */
                        dispx = game.u.ux;
                        dispy = game.u.uy;
                    } else {
                        dispx = nx;
                        dispy = ny;
                    }
                    data.info[cnt] = 0;
                    if (onscary(dispx, dispy, mon)) {
                        if (!(flag & 1073741824)) {
                            continue;
                        }
                        data.info[cnt] |= 1073741824;
                    }
                    if (((nx) == game.u.ux && (ny) == game.u.uy) || (nx == mon.mux && ny == mon.muy)) {
                        if (((nx) == game.u.ux && (ny) == game.u.uy)) {
                            /* If it's right next to you, it found you,
                         * displaced or no.  We must set mux and muy
                         * right now, so when we return we can tell
                         * that the ALLOW_U means to attack _you_ and
                         * not the image.
                         */
                            mon.mux = game.u.ux;
                            mon.muy = game.u.uy;
                        }
                        if (!(flag & 262144)) {
                            continue;
                        }
                        data.info[cnt] |= 262144;
                    } else {
                        if ((game.level.monsters[nx][ny] != null)) {
                            let mtmp2 = (game.level.monsters[nx][ny]);
                            let mmflag = flag | await mm_aggression(mon, mtmp2);
                            if (mmflag & 524288) {
                                data.info[cnt] |= 524288;
                                if (mtmp2.mtame) {
                                    if (!(mmflag & 1048576)) {
                                        continue;
                                    }
                                    data.info[cnt] |= 1048576;
                                }
                            } else {
                                flag &= ~4096;
                                mmflag = flag | mm_displacement(mon, mtmp2);
                                if (!(mmflag & 4096)) {
                                    continue;
                                }
                                data.info[cnt] |= 4096;
                            }
                        }
                        if (game.level.flags.has_temple && in_rooms(nx, ny, TEMPLE) && !in_rooms(x, y, TEMPLE) && in_your_sanctuary(null, nx, ny)) {
                            /* Note: ALLOW_SANCT only prevents movement, not
                       attack, into a temple. */
                            if (!(flag & 536870912)) {
                                continue;
                            }
                            data.info[cnt] |= 536870912;
                        }
                    }
                    if (checkobj && sobj_at(CLOVE_OF_GARLIC, nx, ny)) {
                        if (flag & 2147483648) {
                            continue;
                        }
                        data.info[cnt] |= 2147483648;
                    }
                    if (checkobj && sobj_at(BOULDER, nx, ny)) {
                        if (!(flag & 33554432)) {
                            continue;
                        }
                        data.info[cnt] |= 33554432;
                    }
                    if (monseeu && monlineu(mon, nx, ny)) {
                        if (flag & 2097152) {
                            continue;
                        }
                        data.info[cnt] |= 2097152;
                    }
                    /* check for diagonal tight squeeze */
                    if (nx != x && ny != y && bad_rock(mdat, x, ny) && bad_rock(mdat, nx, y) && cant_squeeze_thru(mon)) {
                        continue;
                    }
                    if ((ttmp = t_at(nx, ny)) != null) {
                        if (ttmp.ttyp >= TRAPNUM || ttmp.ttyp == 0) {
                            await impossible("A monster looked at a very strange trap of type %d.", ttmp.ttyp);
                            continue;
                        }
                        if (((ttmp).ttyp == TELEP_TRAP && isok((ttmp).launch.x, (ttmp).launch.y)) && hastrack(nx, ny)) {
                            data.info[cnt] |= 131072;
                        } else if (!await m_harmless_trap(mon, ttmp)) {
                            if (!(flag & 131072)) {
                                /* fixed-destination teleport trap, was used by hero */
                                if (mon_knows_traps(mon, ttmp.ttyp)) {
                                    continue;
                                }
                            }
                            data.info[cnt] |= 131072;
                        }
                    }
                    data.poss[cnt].x = nx;
                    data.poss[cnt].y = ny;
                    cnt++;
                }
            }
        }
        if (!cnt && wantpool && !is_pool(x, y)) {
            wantpool = (0);
            continue nexttry;
        }
        data.cnt = cnt;
        return cnt;
        break;
    }
}
/* Part of mm_aggression that represents two-way aggression.  To avoid
   having to code each case twice, this function contains those cases that
   ought to happen twice, and mm_aggression will call it twice. */
export async function mm_2way_aggression(magr, mdef) {
    if (On_W_tower_level(game.u.uz)) {
        if (await In_W_tower(game.u.ux, game.u.uy, game.u.uz) ? (!await In_W_tower(magr.mx, magr.my, game.u.uz) || !await In_W_tower(mdef.mx, mdef.my, game.u.uz)) : (await In_W_tower(magr.mx, magr.my, game.u.uz) || await In_W_tower(mdef.mx, mdef.my, game.u.uz))) {
            return 0;
        }
    }
    if (zombie_maker(magr) && zombie_form(mdef.data) != NON_PM) {
        /* liches/zombies vs things that can be zombified

       Note: avoid this on the Castle level, partly for balance reasons
       (the monster-versus-monster fights clear out significant portions of
       the Castle and make it easier than it should be), partly for flavor
       reasons (monsters who attacked other monsters to zombify them would
       have been counterattacked to death long before the hero arrived).

       Also don't include unique monsters in this, otherwise it leads to
       them waking up early (e.g. because a zombie decided to attack the
       Wizard of Yendor). */
        if (magr.mgenmklev && mdef.mgenmklev) {
            return 0;
        }
        if (!(((((game.dungeon_topology.d_stronghold_level)).dlevel || ((game.dungeon_topology.d_stronghold_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_stronghold_level)))) && !(((magr.data).geno & 4096) != 0) && !(((mdef.data).geno & 4096) != 0)) {
            return (524288 | 1048576);
        }
    }
    return 0;
}
/* Monster against monster special attacks; for the specified monster
   combinations, this allows one monster to attack another adjacent one
   in the absence of Conflict.  There is no provision for targeting
   other monsters; just hand to hand fighting when they happen to be
   next to each other. */
/* monster that is currently deciding where to move */
/* another monster which is next to it */
export async function mm_aggression(magr, mdef) {
    let mndx = ((magr.data).pmidx);
    /* don't allow pets to fight each other */
    if (magr.mtame && mdef.mtame) {
        return 0;
    }
    /* supposedly purple worms are attracted to shrieking because they
       like to eat shriekers, so attack the latter when feasible */
    if ((mndx == PM_PURPLE_WORM || mndx == PM_BABY_PURPLE_WORM) && mdef.data == game.mons[PM_SHRIEKER]) {
        return 524288 | 1048576;
    }
    return (await mm_2way_aggression(magr, mdef) | await mm_2way_aggression(mdef, magr));
}
/* Monster displacing another monster out of the way */
/* monster that is currently deciding where to move */
/* another monster which is next to it */
export function mm_displacement(magr, mdef) {
    let pa = magr.data;
    let pd = mdef.data;
    /* if attacker can't barge through, there's nothing to do;
       or if defender can barge through too and has a level at least
       as high as the attacker, don't let attacker do so, otherwise
       they might just end up swapping places again when defender
       gets its chance to move */
    if ((((pa).mflags3 & 1024) != 0) && (!(((pd).mflags3 & 1024) != 0) || magr.m_lev > mdef.m_lev) && !(magr.mx != mdef.mx && magr.my != mdef.my && ((((pd).pmidx)) == PM_GRID_BUG)) && !mdef.mtrapped && (!mdef.wormno || !count_wsegs(mdef)) && (((pa) == game.mons[PM_DEATH] || (pa) == game.mons[PM_FAMINE] || (pa) == game.mons[PM_PESTILENCE]) || pa.msize >= pd.msize)) {
        return 4096;
    }
    return 0;
}
/* Is the square close enough for the monster to move or attack into? */
export function monnear(mon, x, y) {
    let distance = dist2(mon.mx, mon.my, x, y);
    if (distance == 2 && ((mon.data.pmidx) == PM_GRID_BUG)) {
        return 0;
    }
    return (distance < 3);
}
/* really free dead monsters */
export async function dmonsfree() {
    fnEnter("dmonsfree", "mon.c", 0);
    let mtmp__parent = null;
    let mtmp__field = null;
    let freetmp = null;
    let count = 0;
    let buf = '';
    buf = '';
    for ((mtmp__parent = game.level, mtmp__field = "monlist"); mtmp__parent[mtmp__field]; ) {
        freetmp = mtmp__parent[mtmp__field];
        if (((freetmp).mhp < 1) && !freetmp.isgd) {
            mtmp__parent[mtmp__field] = freetmp.nmon;
            freetmp.nmon = null;
            await dealloc_monst(freetmp);
            count++;
        } else {
            (mtmp__parent = freetmp, mtmp__field = "nmon");
        }
    }
    if (count != game.iflags.purge_monsters) {
        describe_level(buf, 2);
        await impossible("dmonsfree: %d removed doesn't match %d pending on %s", count, game.iflags.purge_monsters, buf);
    }
    game.iflags.purge_monsters = 0;
}
/* called when monster is moved to larger structure */
export async function replmon(mtmp, mtmp2) {
    let otmp = null;
    for (otmp = mtmp2.minvent; otmp; otmp = otmp.nobj) {
        /* transfer the monster's inventory */
        if (otmp.where != 4 || otmp.v.v_ocarry != mtmp) {
            await impossible("replmon: minvent inconsistency");
        }
        otmp.v.v_ocarry = mtmp2;
    }
    mtmp.minvent = null;
    /* before relmon(mtmp), because it could clear polearm.hitmon */
    if (game.context.polearm.hitmon == mtmp) {
        game.context.polearm.hitmon = mtmp2;
    }
    await relmon(mtmp, null);
    if (mtmp != game.u.usteed) {
        await place_monster(mtmp2, mtmp2.mx, mtmp2.my);
    }
    if (mtmp2.wormno) {
        await place_wsegs(mtmp2, mtmp);
    }
    if ((((mtmp2.data).mlet == S_LIGHT || (mtmp2.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp2.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp2.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp2.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp2.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp2.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
        await new_light_source(mtmp2.mx, mtmp2.my, (((mtmp2.data).mlet == S_LIGHT || (mtmp2.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp2.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp2.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp2.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp2.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp2.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0), LS_MONSTER, monst_to_any(mtmp2));
        await del_light_source(LS_MONSTER, monst_to_any(mtmp));
    }
    mtmp2.nmon = game.level.monlist;
    game.level.monlist = mtmp2;
    if (game.u.ustuck == mtmp) {
        await set_ustuck(mtmp2);
    }
    if (game.u.usteed == mtmp) {
        game.u.usteed = mtmp2;
    }
    if (mtmp2.isshk) {
        replshk(mtmp, mtmp2);
    }
    await dealloc_monst(mtmp);
}
/* release mon from the display and the map's monster list,
   maybe transfer it to one of the other monster lists */
/* &gm.migrating_mons or &gm.mydogs or null */
export async function relmon(mon, monst_list) {
    if (!game.level.monlist) {
        await panic("relmon: no fmon available.");
    }
    await mon_leaving_level(mon);
    if (mon == game.level.monlist) {
        game.level.monlist = game.level.monlist.nmon;
    } else {
        let mtmp = null;
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            if (mtmp.nmon == mon) {
                /* remove 'mon' from the 'fmon' list */
                mtmp.nmon = mon.nmon;
                break;
            }
        }
        if (!mtmp) {
            await panic("relmon: mon not in list.");
        }
    }
    if (monst_list) {
        /* insert into gm.mydogs or gm.migrating_mons */
        mon.nmon = monst_list.value;
        monst_list.value = mon;
    } else {
        /* orphan has no next monster */
        mon.nmon = null;
    }
}
export function copy_mextra(mtmp2, mtmp1) {
    if (!mtmp2 || !mtmp1 || !mtmp1.mextra) {
        return;
    }
    if (!mtmp2.mextra) {
        mtmp2.mextra = newmextra();
    }
    if (((mtmp1).mextra.mgivenname)) {
        new_mgivenname(mtmp2, strlen(((mtmp1).mextra.mgivenname)) + 1);
        (mtmp2).mextra.mgivenname = strcpy(((mtmp2).mextra.mgivenname), ((mtmp1).mextra.mgivenname));
    }
    if (((mtmp1).mextra.egd)) {
        if (!((mtmp2).mextra.egd)) {
            newegd(mtmp2);
        }
        Object.assign(mtmp2.mextra.egd, mtmp1.mextra.egd);
    }
    if (((mtmp1).mextra.epri)) {
        if (!((mtmp2).mextra.epri)) {
            newepri(mtmp2);
        }
        Object.assign(mtmp2.mextra.epri, mtmp1.mextra.epri);
    }
    if (((mtmp1).mextra.eshk)) {
        if (!((mtmp2).mextra.eshk)) {
            neweshk(mtmp2);
        }
        Object.assign(mtmp2.mextra.eshk, mtmp1.mextra.eshk);
    }
    if (((mtmp1).mextra.emin)) {
        if (!((mtmp2).mextra.emin)) {
            newemin(mtmp2);
        }
        Object.assign(mtmp2.mextra.emin, mtmp1.mextra.emin);
    }
    if (((mtmp1).mextra.edog)) {
        if (!((mtmp2).mextra.edog)) {
            newedog(mtmp2);
        }
        Object.assign(mtmp2.mextra.edog, mtmp1.mextra.edog);
    }
    if (((mtmp1).mextra.ebones)) {
        if (!((mtmp2).mextra.ebones)) {
            newebones(mtmp2);
        }
        Object.assign(mtmp2.mextra.ebones, mtmp1.mextra.ebones);
    }
    if (((mtmp1).mextra && ((mtmp1).mextra.mcorpsenm) != NON_PM)) {
        ((mtmp2).mextra.mcorpsenm) = ((mtmp1).mextra.mcorpsenm);
    }
}
export function dealloc_mextra(m) {
    let x = m.mextra;
    if (x) {
        if (x.mgivenname) {
            free(x.mgivenname) , x.mgivenname = null;
        }
        if (x.egd) {
            free(x.egd) , x.egd = null;
        }
        if (x.epri) {
            free(x.epri) , x.epri = null;
        }
        if (x.eshk) {
            free(x.eshk) , x.eshk = null;
        }
        if (x.emin) {
            free(x.emin) , x.emin = null;
        }
        if (x.edog) {
            free(x.edog) , x.edog = null;
        }
        if (x.ebones) {
            free(x.ebones) , x.ebones = null;
        }
        /* no allocation to release */
        x.mcorpsenm = NON_PM;
        free(x);
        m.mextra = null;
    }
}
export async function dealloc_monst(mon) {
    let buf = '';
    buf = '';
    if (mon.nmon) {
        describe_level(buf, 2);
        await panic("dealloc_monst with nmon on %s", buf);
    }
    if (mon.mextra) {
        dealloc_mextra(mon);
    }
    /* clear out of date information contained in the about-to-become
       stale memory; see dealloc_obj() */
    Object.assign(mon, cg.zeromonst);
    free(mon);
}
/* 'mon' is being removed from level due to migration [relmon from keepdogs
   or migrate_to_level] or due to death [m_detach from mondead or mongone] */
export async function mon_leaving_level(mon) {
    let mx = mon.mx;
    let my = mon.my;
    let onmap = (isok(mx, my) && game.level.monsters[mx][my] == mon);
    /* to prevent an infinite relobj-flooreffects-hmon-killed loop */
    mon.mtrapped = 0;
    await unstuck(mon);
    if (onmap || mon == game.level.monsters[0][0]) {
        if (mon.wormno) {
            await remove_worm(mon);
        } else {
            game.level.monsters[mx][my] = null;
        }
    }
    if (onmap) {
        /* for migration; doesn't matter for death */
        mon.mundetected = 0;
        /* unhide mimic in case its shape has been blocking line of sight
           or it is accompanying the hero to another level */
        if (((mon).m_ap_type & 7) != M_AP_NOTHING && ((mon).m_ap_type & 7) != M_AP_MONSTER) {
            await seemimic(mon);
        }
        await fill_pit(mx, my);
        await newsym(mx, my);
    }
    /* if mon is a remembered target, forget it since it isn't here anymore */
    if (mon == game.context.polearm.hitmon) {
        game.context.polearm.hitmon = null;
    }
}
/* 'mtmp' is going away; remove effects of mtmp from other data structures */
/* reflects mtmp->data _prior_ to mtmp's death */
export async function m_detach(mtmp, mptr, due_to_death) {
    let mx = mtmp.mx;
    let my = mtmp.my;
    if (mtmp.mleashed) {
        await m_unleash(mtmp, (0));
    }
    if (mx > 0 && (((mptr).mlet == S_LIGHT || (mptr) == game.mons[PM_FLAMING_SPHERE] || (mptr) == game.mons[PM_SHOCKING_SPHERE] || (mptr) == game.mons[PM_BABY_GOLD_DRAGON] || (mptr) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mptr) == game.mons[PM_FIRE_ELEMENTAL] || (mptr) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
        await del_light_source(LS_MONSTER, monst_to_any(mtmp));
    }
    await mon_leaving_level(mtmp);
    /* simplify some tests: force mhp to 0 */
    /* in case caller hasn't done this */
    mtmp.mhp = 0;
    /* death handling for the Wizard needs to take place even if he is
       leaving the dungeon alive rather than dying */
    if (mtmp.iswiz) {
        wizdeadorgone();
    }
    if (due_to_death) {
        if (mtmp.data.msound == MS_NEMESIS) {
            await nemdead();
            if (await stinky_nemesis(mtmp)) {
                await nemesis_stinks(mx, my);
            }
        }
        if (mtmp.data.msound == MS_LEADER) {
            leaddead();
        }
        await relobj(mtmp, 1, (0));
    }
    if (mtmp.m_id == game.stealmid) {
        thiefdead();
    }
    if (mtmp.isshk) {
        await shkgone(mtmp);
    }
    if (mtmp.wormno) {
        await wormgone(mtmp);
    }
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        mtmp.mstate |= 32;
    }
    if ((mtmp.mstate & 2) != 0) {
        await impossible("m_detach: %s is already detached?", minimal_monnam(mtmp, (0)));
    } else {
        mtmp.mstate |= 2;
        game.iflags.purge_monsters++;
    }
    if (mtmp == game.u.usteed) {
        await dismount_steed(DISMOUNT_GENERIC);
    }
    return;
}
/* give a life-saved monster a reasonable mhpmax value in case it has
   been the victim of excessive life draining */
/* monster life-saving has traditionally used 10 */
export function set_mon_min_mhpmax(mon, minimum_mhpmax) {
    /* can't be less than m_lev+1 (if we just used m_lev itself, level 0
       monsters would end up allowing a minimum of 0); since life draining
       reduces m_lev, this usually won't give the monster much of a boost */
    if (mon.mhpmax < mon.m_lev + 1) {
        mon.mhpmax = mon.m_lev + 1;
    }
    /* caller can specify an alternate minimum; we'll honor it iff it is
       greater than m_lev+1; the traditional arbitrary value of 10 always
       gives level 0 and level 1 monsters a boost and has a moderate
       chance of doing so for level 2, a tiny chance for levels 3..9 */
    if (mon.mhpmax < minimum_mhpmax) {
        mon.mhpmax = minimum_mhpmax;
    }
}
/* find the worn amulet of life saving which will save a monster */
export async function mlifesaver(mon) {
    if (!((((mon.data).mflags2 & 2) != 0) || (mon.data) == game.mons[PM_MANES] || (((mon.data).mlet == S_GOLEM) || (mon.data).mlet == S_VORTEX)) || ((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) {
        let otmp = await which_armor(mon, 65536);
        if (otmp && otmp.otyp == AMULET_OF_LIFE_SAVING) {
            return otmp;
        }
    }
    return null;
}
export async function lifesaved_monster(mtmp) {
    let surviver = 0;
    let lifesave = await mlifesaver(mtmp);
    if (lifesave) {
        if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
            await pline("But wait...");
            await pline("%s medallion begins to glow!", s_suffix(await Monnam(mtmp)));
            await discover_object((AMULET_OF_LIFE_SAVING), (1), (1), (1));
            if (canseemon(mtmp)) {
                if (attacktype(mtmp.data, 13) || attacktype(mtmp.data, 14)) {
                    await pline("%s reconstitutes!", await Monnam(mtmp));
                } else {
                    await pline("%s looks much better!", await Monnam(mtmp));
                }
            }
            await pline_The("medallion crumbles to dust!");
        }
        await m_useup(mtmp, lifesave);
        check_gear_next_turn(mtmp);
        surviver = !(game.mvitals[((mtmp.data).pmidx)].mvflags & 2);
        mtmp.mcanmove = 1;
        mtmp.mfrozen = 0;
        if (mtmp.mtame && !mtmp.isminion) {
            await wary_dog(mtmp, !surviver);
        }
        /* mtmp->mhpmax=max(mtmp->m_lev+1,10) */
        /* mtmp->mhpmax=max(m_lev+1,10) */
        set_mon_min_mhpmax(mtmp, 10);
        mtmp.mhp = mtmp.mhpmax;
        if (!surviver) {
            if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
                await pline("Unfortunately, %s is still genocided...", await mon_nam(mtmp));
            }
            /* caller will usually have already done this */
            mtmp.mhp = 0;
        }
    }
}
/* when a shape-shifted vampire is killed, it reverts to base form instead
   of dying; returns True if mtmp successfully revives, False otherwise;
   "successfully revived" vampire might be killed by a booby trapped door */
const __vamprises_door_smashed = "a door being smashed";
const __vamprises_door_go_boom = "a door exploding";
export async function vamprises(mtmp) {
    let mndx = mtmp.cham;
    if (((mndx) >= LOW_PM && (mndx) < NUMMONS) && mndx != ((mtmp.data).pmidx) && !(game.mvitals[mndx].mvflags & 2)) {
        /*
     * Protection from shape changers protects against this because
     * the vampire will always be in normal form instead of shifted.
     * So there's no need to check for that attribute being active.
     */
        let action = '';
        /* alternate message phrasing for some monster types */
        let spec_mon = (((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) || ((mtmp.data).mlet == S_GHOST) || (((mtmp.data).mflags1 & 4) != 0));
        let spec_death = (game.disintegested || ((mtmp.data).mlet == S_GHOST) || (((mtmp.data).mflags1 & 4) != 0));
        let x = mtmp.mx;
        let y = mtmp.my;
        action = nh_snprintf("vamprises", 2919, action, 256 /* sizeof(char [256]) */, "%s%s %s%s and rises as", (game.multi < 0 && (unconscious() || is_fainted())) ? "you dream that " : "", await x_monnam(mtmp, 1, spec_mon ? null : "seemingly dead", (2 | 64), (0)), (game.multi < 0 && (unconscious() || is_fainted())) ? "" : "suddenly ", spec_death ? "reconstitutes" : "transforms");
        mtmp.mcanmove = 1;
        mtmp.mfrozen = 0;
        set_mon_min_mhpmax(mtmp, 10);
        mtmp.mhp = mtmp.mhpmax;
        if (mtmp == game.u.ustuck) {
            if (game.u.uswallow) {
                await expels(mtmp, mtmp.data, (0));
            } else {
                await uunstick();
            }
        }
        if (!await newcham(mtmp, game.mons[mndx], 0)) {
            return !((mtmp).mhp < 1);
        }
        mtmp.cham = (mtmp.data == game.mons[mndx]) ? NON_PM : mndx;
        if ((canseemon(mtmp) || sensemon(mtmp))) {
            await pline_mon(mtmp, "%s %s!", upstart(action), await x_monnam(mtmp, 2, null, (32 | 1 | 2), (0)));
            game.vamp_rise_msg = (1);
        }
        if (closed_door(x, y)) {
            /* revived vampire is in normal shape, so can't be amorphous; if on
           a closed door spot, destroy the door and if trapped, blow it up */
            let door = game.level.locations[x][y];
            let trapped = (door.flags & 16) != 0;
            let seeit = ((game.viz_array[y][x] & 2) != 0);
            /* You()/pline() will reset this */
            set_msg_xy(x, y);
            if (!seeit) {
                await You_hear("%s.", trapped ? "an explosion" : __vamprises_door_smashed);
            } else if (!(canseemon(mtmp) || sensemon(mtmp))) {
                await You_see("%s.", trapped ? __vamprises_door_go_boom : __vamprises_door_smashed);
            } else if (!(game.multi < 0 && (unconscious() || is_fainted()))) {
                await pline_The("door is smashed%s", trapped ? " and it explodes!" : ".");
            }
            /* in case none of the messages was delivered */
            set_msg_xy(0, 0);
            door.flags = 0;
            recalc_block_point(x, y);
            if (trapped) {
                let trap_killed = 0;
                let save_verbose = game.flags.verbose;
                /* suppress mb_trapped() messages
                                        * (that makes the 'seeit' arg moot) */
                game.flags.verbose = (0);
                trap_killed = await mb_trapped(mtmp, seeit);
                game.flags.verbose = save_verbose;
                /* if the booby trap has killed the monster, mondied() will
                   have been called but no message about its death given yet;
                   mtmp was a vampire so use unconditional "destroyed" */
                if (trap_killed && (canseemon(mtmp) || sensemon(mtmp)) && !(game.multi < 0 && (unconscious() || is_fainted()))) {
                    await pline_mon(mtmp, "%s is destroyed!", await Monnam(mtmp));
                }
            }
        }
        await newsym(x, y);
        return (1);
    }
    return (0);
}
/* specific combination of x_monnam flags for livelogging; show what was
   actually killed even when unseen or hallucinated to be something else */
/* when a mon has died, maybe record an achievement or issue livelog message;
   moved into separate routine to unclutter mondead() */
export async function logdeadmon(mtmp, mndx) {
    let howmany = game.mvitals[mndx].died;
    if (mndx == PM_MEDUSA && howmany == 1) {
        await record_achievement(ACH_MEDU);
    } else if (((((mtmp.data).geno & 4096) != 0) && (mndx != PM_HIGH_CLERIC || !mtmp.mrevived)) || (mtmp.isshk && !mtmp.mrevived)) {
        let shkdetail = '';
        let mkilled = null;
        let herodidit = !game.context.mon_moving;
        /*
         * livelog event; unique_corpstat() includes the Wizard and
         * any High Priest even though they aren't actually unique.
         *
         * Shopkeeper kills are logged, but only the first time per
         * shopkeeper, since their shared kill counter wouldn't work
         * for this purpose (and it wouldn't account for polymorphed
         * shopkeepers either).
         */
        shkdetail = '';
        if (mtmp.isshk) {
            /* the high priest[ess] monster is not unique; we know that
               this is the first death for this particular high priest
               (because of the !mtmp->mrevived test above) */
            howmany = 1;
            /* ", the <shoptype> proprietor" needs a trailing comma for
               the alternate phrasing "<shk>, shkdetails, has been killed"
               when hero isn't directly responsible */
            /* in case shk name doesn't include Mr or Ms honorific */
            shkdetail = nh_snprintf("logdeadmon", 3029, shkdetail, 128 /* sizeof(char [128]) */, ", the %s %s%s", shtypes[((mtmp).mextra.eshk).shoptype - SHOPBASE].name, mtmp.female ? "proprietrix" : "proprietor", herodidit ? "" : ",");
        } else if (mndx == PM_HIGH_CLERIC) {
            howmany = 1;
        }
        if (howmany <= 3 || howmany == 5 || howmany == 10 || howmany == 25 || (howmany % 50) == 0) {
            /* killing a unique more than once doesn't get logged every time;
           the Wizard and the Riders can be killed more than once
           "naturally", others require deliberate player action such as
           use of undead turning to revive a corpse or petrification plus
           stone-to-flesh to create and revive a statue */
            /* space for " (Nth time)" when N > 1 */
            let xtra = '';
            let llevent_type = 4;
            /* the first kill of any unique monster is a major event;
               all kills of the Wizard and the Riders are major when
               they're logged but they still don't get logged every time */
            if (howmany == 1 || mtmp.iswiz || ((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE])) {
                llevent_type |= 2;
            }
            xtra = '';
            /* "(2nd time)" or "(50th time)" */
            if (howmany > 1) {
                xtra = sprintf(xtra, " (%d%s time)", howmany, ordin(howmany));
            }
            mkilled = ((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) ? "destroyed" : "killed";
            if (herodidit) {
                livelog_printf(llevent_type, "%s %s%s%s", mkilled, await x_monnam(mtmp, 1, null, 31, (0)), shkdetail, xtra);
            } else {
                livelog_printf(llevent_type, "%s%s has been %s%s", await x_monnam(mtmp, 1, null, 31, (0)), shkdetail, mkilled, xtra);
            }
        }
    }
}
/* anger all the quest guards on the level */
export async function anger_quest_guardians(mtmp) {
    if (mtmp.data == game.mons[game.urole.guardnum]) {
        await setmangry(mtmp, (1));
    }
}
/* monster 'mtmp' has died; maybe life-save, otherwise unshapeshift and
   update vanquished stats and update map */
export async function mondead(mtmp) {
    let mptr = null;
    let be_sad = 0;
    let mndx = 0;
    /* potential pet message; always clear global flag */
    be_sad = game.iflags.sad_feeling;
    game.iflags.sad_feeling = (0);
    mtmp.mhp = 0;
    await lifesaved_monster(mtmp);
    if (!((mtmp).mhp < 1)) {
        return;
    }
    if (((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER) && await vamprises(mtmp)) {
        return;
    }
    if (be_sad) {
        await You("have a sad feeling for a moment, then it passes.");
    }
    if (mtmp.data == game.mons[PM_STEAM_VORTEX]) {
        await create_gas_cloud(mtmp.mx, mtmp.my, rn2(10) + 5, 0);
    }
    if (mtmp.isgd && !await grddead(mtmp)) {
        return;
    }
    /* save this for m_detach() */
    mptr = mtmp.data;
    if (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS)) {
        /* restore chameleon, lycanthropes to true form at death */
        set_mon_data(mtmp, game.mons[mtmp.cham]);
        mtmp.cham = NON_PM;
    } else if (mtmp.data == game.mons[PM_WEREJACKAL]) {
        set_mon_data(mtmp, game.mons[PM_HUMAN_WEREJACKAL]);
    } else if (mtmp.data == game.mons[PM_WEREWOLF]) {
        set_mon_data(mtmp, game.mons[PM_HUMAN_WEREWOLF]);
    } else if (mtmp.data == game.mons[PM_WERERAT]) {
        set_mon_data(mtmp, game.mons[PM_HUMAN_WERERAT]);
    }
    /*
     * svm.mvitals[].died does double duty as total number of dead monsters
     * and as experience factor for the player killing more monsters.
     * this means that a dragon dying by other means reduces the
     * experience the player gets for killing a dragon directly; this
     * is probably not too bad, since the player likely finagled the
     * first dead dragon via ring of conflict or pets, and extinguishing
     * based on only player kills probably opens more avenues of abuse
     * for rings of conflict and such.
     */
    mndx = ((mtmp.data).pmidx);
    if (game.mvitals[mndx].died < 255) {
        game.mvitals[mndx].died++;
    }
    /* if it's a (possibly polymorphed) quest leader, mark him as dead */
    if (mtmp.m_id == game.quest_status.leader_m_id) {
        game.quest_status.leader_is_dead = (1);
    }
    /* if the mail daemon dies, no more mail delivery.  -3. */
    if (mndx == PM_MAIL_DAEMON) {
        game.mvitals[mndx].mvflags |= 2;
    }
    if (mtmp.data.mlet == S_KOP) {
        let stway = stairway_find_type_dir((0), (0));
        switch (rnd(5)) {
            case 1:
                if (stway) {
                    await makemon(mtmp.data, stway.sx, stway.sy, 0);
                    break;
                }
                ;
            case 2:
                await makemon(mtmp.data, 0, 0, 0);
                break;
            default:
                break;
        }
    }
    await logdeadmon(mtmp, mndx);
    if (((game.level.locations[mtmp.mx][mtmp.my].glyph) == GLYPH_INVIS_OFF)) {
        await unmap_object(mtmp.mx, mtmp.my);
    }
    await m_detach(mtmp, mptr, (1));
    return;
}
/* TRUE if corpse might be dropped, magr may die if mon was swallowed */
/* killer, if swallowed */
/* digestion */
export async function corpse_chance(mon, magr, was_swallowed) {
    let mdat = mon.data;
    let i = 0;
    let tmp = 0;
    if (!magr && game.mswallower && attacktype(game.mswallower.data, 11)) {
        magr = game.mswallower , was_swallowed = (1);
    }
    if (mdat == game.mons[PM_VLAD_THE_IMPALER] || mdat.mlet == S_LICH) {
        if (((game.viz_array[mon.my][mon.mx] & 2) != 0) && !was_swallowed) {
            await pline_mon(mon, "%s body crumbles into dust.", s_suffix(await Monnam(mon)));
        }
        return (0);
    }
    for (i = 0; i < 6; i++) {
        if (mdat.mattk[i].aatyp == 14) {
            if (mdat.mattk[i].damn) {
                tmp = d(mdat.mattk[i].damn, mdat.mattk[i].damd);
            } else if (mdat.mattk[i].damd) {
                tmp = d(mdat.mlevel + 1, mdat.mattk[i].damd);
            /* Gas spores always explode upon death */
            } else {
                tmp = 0;
            }
            if (was_swallowed && magr) {
                if (magr == game.youmonst) {
                    await There("is an explosion in your %s!", await body_part(STOMACH));
                    game.killer.name = sprintf(game.killer.name, "%s explosion", s_suffix(pmname(mdat, Mgender(mon))));
                    await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((tmp) + 1) / 2)) : (tmp)), game.killer.name, 0);
                } else {
                    await You_hear("an explosion.");
                    magr.mhp -= tmp;
                    if (((magr).mhp < 1)) {
                        await mondied(magr);
                    }
                    if (((magr).mhp < 1)) {
                        if ((canseemon(magr) || sensemon(magr))) {
                            await pline_mon(magr, "%s rips open!", await Monnam(magr));
                        }
                    } else if (canseemon(magr)) {
                        await pline_mon(magr, "%s seems to have indigestion.", await Monnam(magr));
                    }
                }
                return (0);
            }
            await mon_explodes(mon, mdat.mattk[i]);
            return (0);
        }
    }
    /* must duplicate this below check in xkilled() since it results in
     * creating no objects as well as no corpse
     */
    if (((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) || !game.level.flags.deathdrops || (game.level.flags.graveyard && (((mdat).mflags2 & 2) != 0) && rn2(3)))) {
        return (0);
    }
    if (((((mdat).msize >= 3) || mdat == game.mons[PM_LIZARD]) && !mon.mcloned) || ((mdat).mlet == S_GOLEM) || (((mdat).pmidx >= PM_ARCHEOLOGIST) && ((mdat).pmidx <= PM_WIZARD)) || ((mdat) == game.mons[PM_DEATH] || (mdat) == game.mons[PM_FAMINE] || (mdat) == game.mons[PM_PESTILENCE]) || mon.isshk) {
        return (1);
    }
    tmp = 2 + ((mdat.geno & 7) < 2) + ((mdat).msize < 1);
    return !rn2(tmp);
}
/* drop (perhaps) a cadaver and remove monster */
export async function mondied(mdef) {
    await mondead(mdef);
    if (!((mdef).mhp < 1)) {
        return;
    }
    if (await corpse_chance(mdef, null, (0)) && (accessible(mdef.mx, mdef.my) || is_pool(mdef.mx, mdef.my))) {
        await make_corpse(mdef, 0);
    }
}
/* monster disappears, not dies */
export async function mongone(mdef) {
    /* can skip some inventory bookkeeping */
    /* we have to make the statue before calling mondead, to be able to
     * put inventory in it, and we have to check for lifesaving before
     * making the statue....
     */
    mdef.mhp = 0;
    if (mdef.isgd && !await grddead(mdef)) {
        return;
    }
    await unstuck(mdef);
    await mdrop_special_objs(mdef);
    await discard_minvent(mdef, (0));
    await m_detach(mdef, mdef.data, (0));
}
/* drop a statue or rock and remove monster */
export async function monstone(mdef) {
    let otmp = null;
    let obj = null;
    let oldminvent = null;
    let x = mdef.mx;
    let y = mdef.my;
    let wasinside = (0);
    if (!await vamp_stone(mdef)) {
        return;
    }
    mdef.mhp = 0;
    await lifesaved_monster(mdef);
    if (!((mdef).mhp < 1)) {
        return;
    }
    mdef.mtrapped = 0;
    if (mdef.data.msize > 0 || !rn2(2 + ((mdef.data.geno & 7) > 2))) {
        let corpstatflags = 0;
        oldminvent = null;
        while ((obj = mdef.minvent) != null) {
            await extract_from_minvent(mdef, obj, (1), (1));
            if (obj.otyp == BOULDER || obj_resists(obj, 0, 0)) {
                if (await flooreffects(obj, x, y, "fall")) {
                    continue;
                }
                await place_object(obj, x, y);
            } else {
                if (obj.lamplit) {
                    await end_burn(obj, (1));
                }
                obj.nobj = oldminvent;
                oldminvent = obj;
            }
        }
        /* defer statue creation until after inventory removal
           so that saved monster traits won't retain any stale
           item-conferred attributes */
        if (mdef.female) {
            corpstatflags |= 1;
        } else if (!(((mdef.data).mflags2 & 262144) != 0)) {
            corpstatflags |= 2;
        }
        /* Archeologists should not break unique statues */
        if (mdef.data.geno & 4096) {
            corpstatflags |= 4;
        }
        otmp = await mkcorpstat(STATUE, mdef, mdef.data, x, y, corpstatflags);
        if (((mdef).mextra && ((mdef).mextra.mgivenname))) {
            otmp = await oname(otmp, ((mdef).mextra.mgivenname), 0);
        }
        while ((obj = oldminvent) != null) {
            oldminvent = obj.nobj;
            /* avoid merged-> obfree-> dealloc_obj-> panic */
            obj.nobj = null;
            await add_to_container(otmp, obj);
        }
        otmp.owt = await weight(otmp);
    } else {
        otmp = await mksobj_at(ROCK, x, y, (1), (0));
    }
    await stackobj(otmp);
    /* mondead() already does this, but we must do it before the newsym */
    if (((game.level.locations[x][y].glyph) == GLYPH_INVIS_OFF)) {
        await unmap_object(x, y);
    }
    if (((game.viz_array[y][x] & 2) != 0)) {
        await newsym(x, y);
    }
    /* we don't currently trap the hero in the statue in this case but we
       could */
    if ((game.u.uswallow && (game.u.ustuck == (mdef)))) {
        wasinside = (1);
    }
    await mondead(mdef);
    if (wasinside) {
        if ((dmgtype_fromattack((mdef.data), 26, 11) != null)) {
            await You("%s through an opening in the new %s.", u_locomotion("jump"), await xname(otmp));
        }
    }
    return;
}
/* another monster has killed the monster mdef */
export async function monkilled(mdef, fltxt, how) {
    let mptr = mdef.data;
    /* C ref mon.c monkilled: `if (fltxt && ...)` tests a char* for non-NULL.
       An empty string "" is a non-NULL pointer (TRUTHY) in C, but "" is
       FALSY in JS — so the translated `fltxt &&` wrongly fell through to the
       sad_feeling branch when callers pass "" (e.g. a pit kill with no
       "by the <x>" suffix: "The little dog is killed!").  Test for non-null
       explicitly to match C pointer-truthiness. */
    if (fltxt != null && (mdef.wormno ? worm_known(mdef) : ((game.viz_array[mdef.my][mdef.mx] & 2) != 0))) {
        await pline_mon(mdef, "%s is %s%s%s!", await Monnam(mdef), ((((mptr).mflags2 & 2) != 0) || (mptr) == game.mons[PM_MANES] || (((mptr).mlet == S_GOLEM) || (mptr).mlet == S_VORTEX)) ? "destroyed" : "killed", __nh_char_at0(fltxt) ? " by the " : "", fltxt);
    /* sad feeling is deferred until after potential life-saving */
    } else {
        game.iflags.sad_feeling = mdef.mtame ? (1) : (0);
    }
    /* no corpse if digested or disintegrated or flammable golem burnt up;
       no corpse for a paper golem means no scrolls; golems that rust or
       rot completely are described as "falling to pieces" so they do
       leave a corpse (which means staves for wood golem, leather armor for
       leather golem, iron chains for iron golem, not a regular corpse) */
    game.disintegested = (how == 26 || how == -242 || (how == 2 && ((mptr) == game.mons[PM_PAPER_GOLEM] || (mptr) == game.mons[PM_STRAW_GOLEM])));
    if (game.disintegested) {
        await mondead(mdef);
    } else {
        await mondied(mdef);
    }
    if (!((mdef).mhp < 1)) {
        return;
    }
    if (mdef.mtame) {
        /* extra message if pet golem is completely destroyed;
       if not visible, this will follow "you have a sad feeling" */
        let rxt = (how == 2 && ((mptr) == game.mons[PM_PAPER_GOLEM] || (mptr) == game.mons[PM_STRAW_GOLEM])) ? "roast" : (how == 24 && ((mptr) == game.mons[PM_IRON_GOLEM])) ? "rust" : (how == 34 && ((mptr) == game.mons[PM_WOOD_GOLEM] || (mptr) == game.mons[PM_LEATHER_GOLEM])) ? "rot" : null;
        if (rxt) {
            await pline("May %s %s in peace.", await noit_mon_nam(mdef), rxt);
        }
    }
    return;
}
export async function set_ustuck(mtmp) {
    if (game.iflags.sanity_check || game.iflags.debug_fuzzer) {
        if (mtmp && !(dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
            await impossible("Sticking to %s at distu %d?", await mon_nam(mtmp), dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy));
        }
    }
    game.disp.botl = (1);
    game.u.ustuck = mtmp;
    if (!game.u.ustuck) {
        game.u.uswallow = 0;
        game.u.uswldtim = 0;
    }
}
export async function unstuck(mtmp) {
    if (game.u.ustuck == mtmp) {
        let ptr = mtmp.data;
        let swallowed = game.u.uswallow;
        await set_ustuck(null);
        if (swallowed) {
            game.mswallower = null;
            game.u.ux = mtmp.mx;
            game.u.uy = mtmp.my;
            if ((game.uball != null) && game.uchain.where != 1) {
                await placebc();
            }
            game.vision_full_recalc = 1;
            await docrt();
        }
        /* prevent holder/engulfer from immediately re-holding/re-engulfing
           [note: this call to unstuck() might be because u.ustuck has just
           changed shape and doesn't have a holding attack any more, hence
           don't set mspec_used unconditionally] */
        if (!mtmp.mspec_used && (dmgtype(ptr, 19) || attacktype(ptr, 11) || attacktype(ptr, 7))) {
            mtmp.mspec_used = rnd(2);
        }
    }
}
export async function killed(mtmp) {
    await xkilled(mtmp, 0);
}
/* the player has killed the monster mtmp */
/* 1: suppress mesg, 2: suppress corpse, 4: pacifist */
export async function xkilled(mtmp, xkill_flags) {
    let tmp = 0;
    let mndx = 0;
    let x = 0;
    let y = 0;
    let museum = { nmon: null, data: null, m_id: 0, mnum: 0, cham: 0, movement: 0, m_lev: 0, malign: 0, mx: 0, my: 0, mux: 0, muy: 0, mtrack: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], mhp: 0, mhpmax: 0, mappearance: 0, m_ap_type: 0, mtame: 0, mintrinsics: 0, mextrinsics: 0, seen_resistance: 0, mspec_used: 0, female: 0, minvis: 0, invis_blkd: 0, perminvis: 0, mcan: 0, mburied: 0, mundetected: 0, mcansee: 0, mspeed: 0, permspeed: 0, mrevived: 0, mcloned: 0, mavenge: 0, mflee: 0, mfleetim: 0, msleeping: 0, mblinded: 0, mstun: 0, mfrozen: 0, mcanmove: 0, mconf: 0, mpeaceful: 0, mtrapped: 0, mleashed: 0, isshk: 0, isminion: 0, isgd: 0, ispriest: 0, iswiz: 0, wormno: 0, mtemplit: 0, meverseen: 0, mspotted: 0, mwandexp: 0, mgenmklev: 0, mstrategy: 0, mgoal: { x: 0, y: 0 }, mtrapseen: 0, mlstmv: 0, mstate: 0, migflags: 0, mspare1: 0, minvent: null, mw: null, misc_worn_check: 0, weapon_check: 0, meating: 0, mextra: null };
    let mdat = null;
    let otmp = null;
    let t = null;
    let be_sad = 0;
    let wasinside = 0;
    let burycorpse = 0;
    let nomsg = 0;
    let nocorpse = 0;
    let noconduct = 0;
    cleanup: {
        x = mtmp.mx;
        y = mtmp.my;
        museum = cg.zeromonst;
        wasinside = (game.u.uswallow && (game.u.ustuck == (mtmp)));
        burycorpse = (0);
        nomsg = (xkill_flags & 1) != 0;
        nocorpse = (xkill_flags & 2) != 0;
        noconduct = (xkill_flags & 4) != 0;
        be_sad = game.iflags.sad_feeling;
        game.iflags.sad_feeling = (0);
        mtmp.mhp = 0;
        if (!noconduct) {
            if (!game.u.uconduct.killer++) {
                livelog_printf(32, "killed for the first time");
            }
        }
        if (!nomsg) {
            let namedpet = ((mtmp).mextra && ((mtmp).mextra.mgivenname)) && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic));
            await You("%s %s!", ((((mtmp.data).mflags2 & 2) != 0) || (mtmp.data) == game.mons[PM_MANES] || (((mtmp.data).mlet == S_GOLEM) || (mtmp.data).mlet == S_VORTEX)) ? "destroy" : "kill", !(wasinside || (canseemon(mtmp) || sensemon(mtmp))) ? "it" : !mtmp.mtame ? await mon_nam(mtmp) : await x_monnam(mtmp, namedpet ? 0 : 1, "poor", namedpet ? 8 : 0, (0)));
        }
        if (mtmp.mtrapped && (t = t_at(x, y)) != null && ((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT)) {
            if (sobj_at(BOULDER, x, y)) {
                nocorpse = (1);
            }
            /* Prevent corpses/treasure being created
                              * "on top" of boulder that is about to fall in.
                              * This is out of order, but cannot be helped
                              * unless this whole routine is rearranged. */
            if (m_carrying(mtmp, BOULDER)) {
                burycorpse = (1);
            }
        }
        /* your pet knows who just killed it...watch out */
        if (mtmp.mtame && !mtmp.isminion) {
            ((mtmp).mextra.edog).killed_by_u = 1;
        }
        if (wasinside && game.thrownobj && game.thrownobj != game.uball && game.thrownobj.oclass != POTION_CLASS && game.thrownobj != game.iflags.returning_missile) {
            await mpickobj(mtmp, game.thrownobj);
            /* let throwing code know that missile has been disposed of */
            game.thrownobj = null;
        }
        /* might get set in mondead(); checked below */
        game.vamp_rise_msg = (0);
        /* alternate vamp_rise mesg needed if true */
        game.disintegested = nocorpse;
        if (game.stoned) {
            await monstone(mtmp);
        } else {
            await mondead(mtmp);
        }
        game.disintegested = (0);
        if (!((mtmp).mhp < 1)) {
            /* Cannot put the non-visible lifesaving message in
         * lifesaved_monster() since the message appears only when _you_
         * kill it (as opposed to visible lifesaving which always appears).
         */
            game.stoned = (0);
            if (!((game.viz_array[y][x] & 2) != 0) && !game.vamp_rise_msg) {
                await pline("Maybe not...");
            }
            return;
        }
        if (be_sad) {
            await You("have a sad feeling for a moment, then it passes.");
        }
        /* note: mondead can change mtmp->data */
        mdat = mtmp.data;
        mndx = ((mdat).pmidx);
        if (game.stoned) {
            game.stoned = (0);
            break cleanup;
        }
        if (nocorpse || ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) || !game.level.flags.deathdrops || (game.level.flags.graveyard && (((mdat).mflags2 & 2) != 0) && rn2(3)))) {
            break cleanup;
        }
        if (mdat == game.mons[PM_MAIL_DAEMON]) {
            await stackobj(await mksobj_at(SCR_MAIL, x, y, (0), (0)));
        }
        if (accessible(x, y) || is_pool(x, y)) {
            let cadaver = null;
            let otyp = 0;
            if (!rn2(6) && !(game.mvitals[mndx].mvflags & 16) && (x != game.u.ux || y != game.u.uy) && mdat.mlet != S_KOP && !mtmp.mcloned) {
                otmp = await mkobj(RANDOM_CLASS, (1));
                /* don't create large objects from small monsters */
                otyp = otmp.otyp;
                if (otmp.oclass == FOOD_CLASS && !(mdat.mflags2 & 1073741824) && !otmp.oartifact) {
                    await delobj(otmp);
                } else if (mdat.msize < 2 && otyp != FIGURINE && (otmp.owt > 30 || game.objects[otyp].oc_big)) {
                    if (otmp.oartifact) {
                        await artifact_exists(otmp, safe_oname(otmp), (0), 0);
                    }
                    await delobj(otmp);
                } else if (!await flooreffects(otmp, x, y, nomsg ? "" : "fall")) {
                    await place_object(otmp, x, y);
                    await stackobj(otmp);
                }
            }
            if (!wasinside && await corpse_chance(mtmp, null, (0))) {
                /* corpse--none if hero was inside the monster */
                game.zombify = (!game.thrownobj && !game.stoned && !game.uwep && zombie_maker(game.youmonst) && zombie_form(mtmp.data) != NON_PM);
                cadaver = await make_corpse(mtmp, burycorpse ? 16 : 0);
                game.zombify = (0);
                if (burycorpse && cadaver && ((game.viz_array[y][x] & 2) != 0) && !mtmp.minvis && cadaver.where == 6 && !nomsg) {
                    await pline("%s corpse ends up buried.", s_suffix(await Monnam(mtmp)));
                }
            }
        }
        if (wasinside) {
            /* spoteffects() can end up clearing level of monsters; grab a copy */
            Object.assign(museum, mtmp);
            museum.nmon = null;
            museum.minvent = null;
            museum.mextra = null;
            await spoteffects((1));
            /* use the reference copy now */
            mtmp = museum;
        }
        await newsym(x, y);
    }
    if ((((mdat).mflags2 & 8) != 0) && (!(((mdat).mflags2 & 1048576) != 0) && mtmp.malign <= 0) && (mndx < PM_ARCHEOLOGIST || mndx > PM_WIZARD) && mndx != PM_HUMAN && game.u.ualign.type != (-1)) {
        game.u.uprops[TELEPAT].intrinsic &= ~(67108864 | 33554432 | 16777216);
        /*
     * Punish bad behavior.
     */
        /* exclude plain "human", which isn't flagged as always hostile;
           it is rare and most likely to occur as the result of resurrecting
           a corpse or animating a statue and usually will be hostile */
        /* only applicable if hero is lawful or neutral */
        change_luck(-2);
        await You("murderer!");
        if (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic)) {
            await see_monsters();
        }
    }
    if ((mtmp.mpeaceful && !rn2(2)) || mtmp.mtame) {
        change_luck(-1);
    }
    if (((mdat).mlet == S_UNICORN && (((mdat).mflags2 & 536870912) != 0)) && sgn(game.u.ualign.type) == sgn(mdat.maligntyp)) {
        /* Can't sense monsters any more. */
        change_luck(-5);
        await You_feel("guilty...");
    }
    tmp = experience(mtmp, game.mvitals[mndx].died);
    await more_experienced(tmp, 0);
    await newexplevel();
    if (mtmp.m_id == game.quest_status.leader_m_id) {
        adjalign(-(game.u.ualign.record + Math.trunc((10 + (Math.trunc(game.moves / 200))) / 2)));
        /* instantly become "extremely" angry */
        game.u.ugangr += 7;
        change_luck(-20);
        await pline("That was %sa bad idea...", game.u.uevent.qcompleted ? "probably " : "");
        if (!game.context.mon_moving) {
            await iter_mons(anger_quest_guardians);
        }
    } else if (mdat.msound == MS_NEMESIS) {
        if (!game.quest_status.killed_leader) {
            adjalign((Math.trunc((10 + (Math.trunc(game.moves / 200))) / 4)));
        }
    } else if (mdat.msound == MS_GUARDIAN) {
        adjalign(-(Math.trunc((10 + (Math.trunc(game.moves / 200))) / 8)));
        game.u.ugangr++;
        change_luck(-4);
        if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            await pline("That was probably a bad idea...");
        } else {
            await pline("Whoopsie-daisy!");
        }
    } else if (mtmp.ispriest) {
        adjalign((p_coaligned(mtmp)) ? -2 : 2);
        /* cancel divine protection for killing your priest */
        if (p_coaligned(mtmp)) {
            game.u.ublessed = 0;
        }
        if (mdat.maligntyp == (-128)) {
            adjalign((Math.trunc((10 + (Math.trunc(game.moves / 200))) / 4)));
        }
    } else if (mtmp.mtame) {
        adjalign(-15);
        if (!(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
            ;
            await You_hear("the rumble of distant thunder...");
        } else {
            ;
            await You_hear("the studio audience applaud!");
        }
        if (!(((mdat).geno & 4096) != 0)) {
            let mname = ((mtmp).mextra && ((mtmp).mextra.mgivenname));
            livelog_printf(256, "murdered %s%s%s faithful %s", mname ? ((mtmp).mextra.mgivenname) : "", mname ? ", " : "", (genders[game.flags.female ? 1 : 0].his), pmname(mdat, Mgender(mtmp)));
        }
    } else if (mtmp.mpeaceful) {
        adjalign(-5);
    }
    /* malign was already adjusted for u.ualign.type and randomization */
    adjalign(mtmp.malign);
    return;
}
/* changes the monster into a stone monster of the same type
   this should only be called when poly_when_stoned() is true */
export async function mon_to_stone(mtmp) {
    if (mtmp.data.mlet == S_GOLEM) {
        if (canseemon(mtmp)) {
            await pline_mon(mtmp, "%s solidifies...", await Monnam(mtmp));
        }
        if (await newcham(mtmp, game.mons[PM_STONE_GOLEM], 0)) {
            if (canseemon(mtmp)) {
                await pline("Now it's %s.", await an(pmname(mtmp.data, Mgender(mtmp))));
            }
        } else {
            if (canseemon(mtmp)) {
                await pline("... and returns to normal.");
            }
        }
    } else {
        await impossible("Can't polystone %s!", await a_monnam(mtmp));
    }
}
export async function vamp_stone(mtmp) {
    if (((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) {
        let mndx = mtmp.cham;
        let x = mtmp.mx;
        let y = mtmp.my;
        if (mndx >= LOW_PM && mndx != ((mtmp.data).pmidx) && !(game.mvitals[mndx].mvflags & 2)) {
            /* this only happens if shapeshifted */
            /* is no longer peaceful, but be explicit...  */
            let buf = '';
            buf = sprintf(buf, "The lapidifying %s %s %s", await x_monnam(mtmp, 0, null, (8 | 4 | 2 | 1), (0)), (((mtmp.data).mflags1 & 4) != 0) ? "coalesces on the" : (((mtmp.data).mflags1 & 1) != 0) ? "drops to the" : "writhes on the", surface(x, y));
            mtmp.mcanmove = 1;
            mtmp.mfrozen = 0;
            set_mon_min_mhpmax(mtmp, 10);
            mtmp.mhp = mtmp.mhpmax;
            if ((game.u.uswallow && (game.u.ustuck == (mtmp)))) {
                await expels(mtmp, mtmp.data, (0));
            }
            if ((((mtmp.data).mflags1 & 4) != 0) && closed_door(mtmp.mx, mtmp.my)) {
                /* construct a format string before transformation */
                let new_xy = { x: 0, y: 0 };
                if (await enexto(new_xy, mtmp.mx, mtmp.my, game.mons[mndx])) {
                    await rloc_to(mtmp, new_xy.x, new_xy.y);
                }
            }
            if ((canseemon(mtmp) || sensemon(mtmp))) {
                await pline_mon(mtmp, "%s!", buf);
                await (game.windowprocs.win_display_nhwindow)(game.WIN_MESSAGE, (0));
            }
            await newcham(mtmp, game.mons[mndx], 0);
            if (mtmp.data == game.mons[mndx]) {
                mtmp.cham = NON_PM;
            } else {
                mtmp.cham = mndx;
            }
            if ((canseemon(mtmp) || sensemon(mtmp))) {
                await pline_mon(mtmp, "%s rises from the %s with renewed agility!", await Amonnam(mtmp), surface(mtmp.mx, mtmp.my));
            }
            await newsym(mtmp.mx, mtmp.my);
            return (0);
        }
    } else if (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS) && (game.mons[mtmp.cham].mresists & 128)) {
        mtmp.mcanmove = 1;
        mtmp.mfrozen = 0;
        set_mon_min_mhpmax(mtmp, 10);
        mtmp.mhp = mtmp.mhpmax;
        await newcham(mtmp, game.mons[mtmp.cham], 1);
        await newsym(mtmp.mx, mtmp.my);
        return (0);
    }
    return (1);
}
/* drop monster into "limbo" - that is, migrate to the current level */
export async function m_into_limbo(mtmp) {
    let target_lev = ledger_no(game.u.uz);
    let xyloc = 1;
    mtmp.mstate |= 8;
    await migrate_mon(mtmp, target_lev, xyloc);
}
/* destination level */
/* MIGR_xxx flag for location within destination */
export async function migrate_mon(mtmp, target_lev, xyloc) {
    if (mtmp.mx) {
        await unstuck(mtmp);
        await mdrop_special_objs(mtmp);
    }
    await migrate_to_level(mtmp, target_lev, xyloc, null);
}
export function ok_to_obliterate(mtmp) {
    /*
     * Add checks for monsters that should not be obliterated
     * here (return FALSE).
     */
    if (mtmp.data == game.mons[PM_WIZARD_OF_YENDOR] || ((mtmp.data) == game.mons[PM_DEATH] || (mtmp.data) == game.mons[PM_FAMINE] || (mtmp.data) == game.mons[PM_PESTILENCE]) || ((mtmp).mextra && ((mtmp).mextra.emin)) || ((mtmp).mextra && ((mtmp).mextra.epri)) || ((mtmp).mextra && ((mtmp).mextra.eshk)) || mtmp == game.u.ustuck || mtmp == game.u.usteed) {
        return (0);
    }
    return (1);
}
let __elemental_clog_msgmv = 0;
__nh_register_static(() => { __elemental_clog_msgmv = 0; });
export async function elemental_clog(mon) {
    let m_lev = 0;
    let mtmp = null;
    let m1 = null;
    let m2 = null;
    let m3 = null;
    let m4 = null;
    let m5 = null;
    let zm = null;
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        m1 = m2 = m3 = m4 = m5 = zm = null;
        if (!__elemental_clog_msgmv || (game.moves - __elemental_clog_msgmv) > 200) {
            if (!__elemental_clog_msgmv || rn2(2)) {
                await You_feel("besieged.");
            }
            __elemental_clog_msgmv = game.moves;
        }
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            /*
         * m1 an elemental from another plane.
         * m2 an elemental from this plane.
         * m3 the least powerful monst encountered in loop so far.
         * m4 some other non-tame monster.
         * m5 a pet.
         */
            if (((mtmp).mhp < 1) || mtmp == mon) {
                continue;
            }
            if (mtmp.mx == 0 && mtmp.my == 0) {
                continue;
            }
            if (mon_has_amulet(mtmp) || !ok_to_obliterate(mtmp)) {
                continue;
            }
            if (mtmp.data.mlet == S_ELEMENTAL) {
                if (!is_home_elemental(mtmp.data)) {
                    if (!m1) {
                        m1 = mtmp;
                    }
                } else {
                    if (!m2) {
                        m2 = mtmp;
                    }
                }
            } else {
                if (!mtmp.mtame) {
                    if (!m_lev || mtmp.m_lev < m_lev) {
                        m_lev = mtmp.m_lev;
                        m3 = mtmp;
                    } else if (!m4) {
                        m4 = mtmp;
                    }
                } else {
                    if (!m5) {
                        m5 = mtmp;
                    }
                    break;
                }
            }
        }
        mtmp = m1 ? m1 : m2 ? m2 : m3 ? m3 : m4 ? m4 : m5 ? m5 : zm;
        if (mtmp) {
            let mx = mtmp.mx;
            let my = mtmp.my;
            mtmp.mstate |= 128;
            await mongone(mtmp);
            await rloc_to(mon, mx, my);
        } else if (!(((((game.dungeon_topology.d_astral_level)).dlevel || ((game.dungeon_topology.d_astral_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_astral_level))))) {
            let dest = { dnum: 0, dlevel: 0 };
            let target_lev = 0;
            Object.assign(dest, game.u.uz);
            dest.dlevel--;
            target_lev = ledger_no(dest);
            mon.mstate |= 64;
            await migrate_mon(mon, target_lev, 0);
        }
    }
}
/* make monster mtmp next to you (if possible);
   might place monst on far side of a wall or boulder */
export async function mnexto(mtmp, rlocflags) {
    let mm = { x: 0, y: 0 };
    if (mtmp == game.u.usteed) {
        /* Keep your steed in sync with you instead */
        mtmp.mx = game.u.ux;
        mtmp.my = game.u.uy;
        return;
    }
    if (!await enexto(mm, game.u.ux, game.u.uy, mtmp.data) || !isok(mm.x, mm.y)) {
        await deal_with_overcrowding(mtmp);
        return;
    }
    if (game.iflags.mon_telecontrol) {
        /* wizard-mode player can choose destination by setting 'montelecontrol'
       option; enexto()'s value for 'mm' will be the default; 'savemm' is
       used to make sure player doesn't choose hero's location and then
       answer 'y' to the 'override invalid spot' prompt */
        let savemm = mm;
        if (!await control_mon_tele(mtmp, mm, rlocflags, (0))) {
            Object.assign(mm, savemm);
        }
    }
    await rloc_to_flag(mtmp, mm.x, mm.y, rlocflags);
    return;
}
export async function deal_with_overcrowding(mtmp) {
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum)) {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mon.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                await pline("overcrowding: elemental_clog on %s", await m_monnam(mtmp));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        await elemental_clog(mtmp);
    } else {
        do {
            if (debugcore("/share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/mon.c", (1))) {
                let save_plnmsg = game.iflags.last_msg;
                await pline("overcrowding: sending %s into limbo", await m_monnam(mtmp));
                game.iflags.last_msg = save_plnmsg;
            }
        } while (0);
        await m_into_limbo(mtmp);
    }
}
/* like mnexto() but requires destination to be directly accessible */
export async function maybe_mnexto(mtmp) {
    let mm = { x: 0, y: 0 };
    let ptr = mtmp.data;
    let diagok = !((ptr.pmidx) == PM_GRID_BUG);
    let tryct = 20;
    do {
        if (!await enexto(mm, game.u.ux, game.u.uy, ptr)) {
            return;
        }
        if (((game.viz_array[mm.y][mm.x] & 1) != 0) && (diagok || mm.x == mtmp.mx || mm.y == mtmp.my)) {
            await rloc_to(mtmp, mm.x, mm.y);
            return;
        }
    } while (--tryct > 0);
}
/* mnearto()
 * Put monster near (or at) location if possible.
 * Returns:
 *  2 if another monster was moved out of this one's way;
 *  1 if relocation was successful (without moving another one);
 *  0 otherwise.
 * Note: if already at the target spot, result is 1 rather than 0.
 *
 * Might be called recursively if 'move_other' is True; if so, that argument
 * will be False on the nested call so there won't be any further recursion.
 */
/* make sure mtmp gets to x, y! so move m_at(x, y) */
export async function mnearto(mtmp, x, y, move_other, rlocflags) {
    let othermon = null;
    let newx = 0;
    let newy = 0;
    let mm = { x: 0, y: 0 };
    let res = 1;
    if (mtmp.mx == x && mtmp.my == y && (game.level.monsters[x][y]) == mtmp) {
        return res;
    }
    if (move_other && (othermon = (game.level.monsters[x][y])) != null) {
        await mon_leaving_level(othermon);
        /* 'othermon' is not on the map */
        othermon.mx = othermon.my = 0;
        othermon.mstate |= 1;
    }
    newx = x;
    newy = y;
    if (!goodpos(newx, newy, mtmp, 0)) {
        if (!await enexto(mm, newx, newy, mtmp.data) || !isok(mm.x, mm.y)) {
            if (othermon) {
                await deal_with_overcrowding(othermon);
            }
            return 0;
        }
        newx = mm.x;
        newy = mm.y;
    }
    await rloc_to_flag(mtmp, newx, newy, rlocflags);
    if (move_other && othermon) {
        /* moving another monster out of the way */
        res = 2;
        if (!await mnearto(othermon, x, y, (0), rlocflags)) {
            await deal_with_overcrowding(othermon);
        }
    }
    return res;
}
/* shrieker special action: shriek, maybe summon monster, aggravate */
export async function m_respond_shrieker(mtmp) {
    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
        await pline("%s shrieks.", await Monnam(mtmp));
        await stop_occupation();
    }
    if (!rn2(10)) {
        await makemon(rn2(13) ? null : game.mons[(game.mons[PM_PURPLE_WORM].difficulty > ((Math.trunc(((await level_difficulty()) + game.u.ulevel) / 2)))) ? PM_BABY_PURPLE_WORM : PM_PURPLE_WORM], 0, 0, 0);
    }
    await aggravate();
}
/* medusa special action: gaze at hero */
export async function m_respond_medusa(mtmp) {
    let i = 0;
    for (i = 0; i < 6; i++) {
        if (mtmp.data.mattk[i].aatyp == 15) {
            await gazemu(mtmp, mtmp.data.mattk[i]);
            break;
        }
    }
}
/* monster responds to player action; not the same as a passive attack */
export async function m_respond(mtmp) {
    if (mtmp.data.msound == MS_SHRIEK && !um_dist(mtmp.mx, mtmp.my, 1)) {
        await m_respond_shrieker(mtmp);
    }
    if (mtmp.data == game.mons[PM_MEDUSA] && ((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
        await m_respond_medusa(mtmp);
    }
    /* Erinyes will inform surrounding monsters of your crimes */
    if (mtmp.data == game.mons[PM_ERINYS] && !mtmp.mpeaceful && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mtmp).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mtmp).my][(mtmp).mx] & 1) != 0))) {
        await aggravate();
    }
}
/* how quest guardians respond when you attack the quest leader */
export async function qst_guardians_respond() {
    let mon = null;
    let q_guardian = game.mons[await quest_info(MS_GUARDIAN)];
    let got_mad = 0;
    for (mon = game.level.monlist; mon; mon = mon.nmon) {
        /* guardians will sense this attack even if they can't see it */
        if (((mon).mhp < 1)) {
            continue;
        }
        if (mon.data == q_guardian && mon.mpeaceful) {
            mon.mpeaceful = 0;
            if (canseemon(mon)) {
                ++got_mad;
            }
        }
    }
    if (got_mad && !(game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) {
        let who = q_guardian.pmnames[NEUTRAL];
        if (got_mad > 1) {
            who = await makeplural(who);
        }
        await pline_The("%s %s to be angry too...", who, await vtense(who, "appear"));
    }
}
/* how other peacefuls react when you attack monster */
export async function peacefuls_respond(mtmp) {
    let mon = null;
    let mndx = ((mtmp.data).pmidx);
    for (mon = game.level.monlist; mon; mon = mon.nmon) {
        if (((mon).mhp < 1)) {
            continue;
        }
        /* the mpeaceful test catches this since mtmp */
        if (mon == mtmp) {
            continue;
        }
        if (!(((mon.data).mflags1 & 65536) != 0) && mon.mpeaceful && ((game.viz_array[mon.my][mon.mx] & 1) != 0) && !mon.msleeping && mon.mcansee && ((!((game.u.uprops[INVIS].intrinsic || game.u.uprops[INVIS].extrinsic) && !game.u.uprops[INVIS].blocked) || ((((mon).data).mflags1 & 16777216) != 0)) && !(game.u.uinwater) && ((game.viz_array[(mon).my][(mon).mx] & 1) != 0))) {
            let buf = '';
            let exclaimed = (0);
            let needpunct = (0);
            let alreadyfleeing = 0;
            buf = '';
            if ((((mon.data).mflags1 & 131072) != 0) || mon.isshk || mon.ispriest) {
                if (((mon.data) == game.mons[PM_WATCHMAN] || (mon.data) == game.mons[PM_WATCH_CAPTAIN])) {
                    ;
                    await verbalize("Halt!  You're under arrest!");
                    await angry_guards(!!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf));
                } else {
                    if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !rn2(5)) {
                        let gasp = maybe_gasp(mon);
                        if (gasp) {
                            if (!strncmpi(gasp, "gasp", 4)) {
                                buf = sprintf(buf, "%s gasps", await Monnam(mon));
                                needpunct = (1);
                            } else {
                                buf = sprintf(buf, "%s exclaims \"%s\"", await Monnam(mon), gasp);
                            }
                            exclaimed = (1);
                        }
                    }
                    if (mon.isshk || mon.ispriest || (mon.data == game.mons[await quest_info(MS_LEADER)] && mtmp.data != game.mons[game.urole.guardnum])) {
                        if (exclaimed) {
                            await pline_mon(mon, "%s%s", buf, " then shrugs.");
                        }
                        continue;
                    }
                    if (mon.data.mlevel < rn2(10) && (mon.data != game.mons[game.urole.guardnum])) {
                        /* don't have quest guardians turn to flee */
                        alreadyfleeing = (mon.mflee || mon.mfleetim);
                        await monflee(mon, rn2(50) + 25, (1), !exclaimed);
                        if (exclaimed) {
                            if (game.flags.verbose && !alreadyfleeing) {
                                buf = strcat(buf, " and then turns to flee.");
                                needpunct = (0);
                            }
                        } else {
                            exclaimed = (1);
                        }
                    }
                    if (buf) {
                        await pline_mon(mon, "%s%s", buf, needpunct ? "." : "");
                    }
                    if (mon.mtame) {
                        ;
                    } else {
                        mon.mpeaceful = 0;
                        mon.mstrategy &= ~(268435456 | 536870912);
                        adjalign(-1);
                        if (!exclaimed) {
                            await pline_mon(mon, "%s gets angry!", await Monnam(mon));
                        }
                    }
                }
            } else if (mon.data.mlet == mtmp.data.mlet && big_little_match(mndx, ((mon.data).pmidx)) && !rn2(3)) {
                if (!rn2(4)) {
                    await growl(mon);
                    exclaimed = (game.iflags.last_msg == PLNMSG_GROWL);
                }
                if (rn2(6)) {
                    alreadyfleeing = (mon.mflee || mon.mfleetim);
                    await monflee(mon, rn2(25) + 15, (1), !exclaimed);
                    if (exclaimed && !alreadyfleeing) {
                        await pline("And then starts to flee.");
                    }
                }
            }
        }
    }
}
/* Called whenever the player attacks mtmp; also called in other situations
   where mtmp gets annoyed at the player. Handles mtmp getting annoyed at the
   attack and any ramifications that might have. Useful also in situations
   where mtmp was already hostile; it checks for situations where the player
   shouldn't be attacking and any ramifications /that/ might have. */
export async function setmangry(mtmp, via_attack) {
    if (via_attack && sengr_at("Elbereth", game.u.ux, game.u.uy, (1)) && (onscary(game.u.ux, game.u.uy, mtmp) || mtmp.mpeaceful)) {
        await You_feel("like a hypocrite.");
        /* AIS: Yes, I know alignment penalties and bonuses aren't balanced
           at the moment. This is about correct relative to other "small"
           penalties; it should be fairly large, as attacking while standing
           on an Elbereth means that you're requesting peace and then
           violating your own request. I know 5 isn't actually large, but
           it's intentionally larger than the 1s and 2s that are normally
           given for this sort of thing. */
        /* reduce to 3 (average) when alignment is already very low */
        adjalign((game.u.ualign.record > 5) ? -5 : -rnd(5));
        if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
            await pline("The engraving beneath you fades.");
        }
        await del_engr_at(game.u.ux, game.u.uy);
    }
    /* AIS: Should this be in both places, or just in wakeup()? */
    mtmp.mstrategy &= ~(268435456 | 536870912);
    if (!mtmp.mpeaceful) {
        return;
    }
    /* [FIXME: this logic seems wrong; peaceful humanoids gasp or exclaim
       when they see you attack a peaceful monster but they just casually
       look the other way when you attack a pet?] */
    if (mtmp.mtame) {
        return;
    }
    mtmp.mpeaceful = 0;
    if (mtmp.ispriest) {
        if (p_coaligned(mtmp)) {
            adjalign(-5);
        } else {
            adjalign(2);
        }
    /* attacking peaceful monsters is bad */
    } else {
        adjalign(-1);
    }
    if ((((mtmp.data).mflags1 & 131072) != 0) || mtmp.isshk || mtmp.isgd) {
        if (((game.viz_array[mtmp.my][mtmp.mx] & 1) != 0)) {
            await pline_mon(mtmp, "%s gets angry!", await Monnam(mtmp));
        }
    } else {
        await growl(mtmp);
    }
    if (mtmp.data == game.mons[await quest_info(MS_LEADER)]) {
        await qst_guardians_respond();
    }
    if (!game.context.mon_moving) {
        await peacefuls_respond(mtmp);
    }
}
/* Indicate via message that a monster has awoken. */
export async function wake_msg(mtmp, interesting) {
    if (mtmp.msleeping && canseemon(mtmp)) {
        await pline_mon(mtmp, "%s wakes up%s%s", await Monnam(mtmp), interesting ? "!" : ".", mtmp.data == game.mons[PM_FLESH_GOLEM] ? " It's alive!" : "");
    }
}
/* wake up a monster, possibly making it angry in the process */
export async function wakeup(mtmp, via_attack) {
    let was_sleeping = mtmp.msleeping;
    await wake_msg(mtmp, via_attack);
    mtmp.msleeping = 0;
    if (((mtmp).m_ap_type & 7) != M_AP_NOTHING) {
        if (((mtmp).m_ap_type & 7) != M_AP_MONSTER) {
            await seemimic(mtmp);
        }
    } else if (game.context.forcefight && !game.context.mon_moving && mtmp.mundetected) {
        mtmp.mundetected = 0;
        await newsym(mtmp.mx, mtmp.my);
    }
    await finish_meating(mtmp);
    if (via_attack) {
        let was_peaceful = mtmp.mpeaceful;
        if (was_sleeping) {
            await growl(mtmp);
        }
        await setmangry(mtmp, (1));
        if (was_peaceful) {
            if (mtmp.ispriest && in_rooms(mtmp.mx, mtmp.my, TEMPLE)) {
                await ghod_hitsu(mtmp);
            }
            if (mtmp.isshk && !game.u.ushops) {
                hot_pursuit(mtmp);
            }
        }
    }
}
/* Wake up nearby monsters without angering them. */
export async function wake_nearby(petcall) {
    await wake_nearto_core(game.u.ux, game.u.uy, game.u.ulevel * 20, petcall);
}
/* Wake up monsters near some particular location. */
export async function wake_nearto_core(x, y, distance, petcall) {
    let mtmp = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (distance == 0 || dist2(mtmp.mx, mtmp.my, x, y) < distance) {
            await wake_msg(mtmp, (0));
            /* wake indeterminate sleep */
            mtmp.msleeping = 0;
            if (!(mtmp.data.geno & 4096)) {
                mtmp.mstrategy &= ~(268435456 | 536870912);
            }
            if (game.context.mon_moving || !petcall) {
                continue;
            }
            if (mtmp.mtame) {
                if (!mtmp.isminion) {
                    ((mtmp).mextra.edog).whistletime = game.moves;
                }
                /* Fix up a pet who is stuck "fleeing" its master */
                mon_track_clear(mtmp);
            }
        }
    }
    await disturb_buried_zombies(x, y);
}
export async function wake_nearto(x, y, distance) {
    await wake_nearto_core(x, y, distance, (0));
}
/* NOTE: we must check for mimicry before calling this routine */
export async function seemimic(mtmp) {
    let is_blocker_appear = (((((mtmp).m_ap_type & 7) == M_AP_OBJECT && (mtmp).mappearance == (BOULDER)) || (((mtmp).m_ap_type & 7) == M_AP_FURNITURE && ((mtmp).mappearance == S_hcdoor || (mtmp).mappearance == S_vcdoor || (mtmp).mappearance < S_ndoor || (mtmp).mappearance == S_tree))));
    if (((mtmp).mextra && ((mtmp).mextra.mcorpsenm) != NON_PM)) {
        freemcorpsenm(mtmp);
    }
    mtmp.m_ap_type = M_AP_NOTHING;
    mtmp.mappearance = 0;
    /*
     *  Discovered mimics don't block light.
     */
    if (is_blocker_appear && !does_block(mtmp.mx, mtmp.my, game.level.locations[mtmp.mx][mtmp.my])) {
        unblock_point(mtmp.mx, mtmp.my);
    }
    await newsym(mtmp.mx, mtmp.my);
}
/* [taken out of rescham() in order to be shared by restore_cham()] */
export async function normal_shape(mon) {
    let mcham = mon.cham;
    if (((mcham) >= LOW_PM && (mcham) < NUMMONS)) {
        let mcan = mon.mcan;
        await newcham(mon, game.mons[mcham], 1);
        mon.cham = NON_PM;
        /* newcham() may uncancel a polymorphing monster; override that */
        if (mcan) {
            mon.mcan = 1;
        }
        await newsym(mon.mx, mon.my);
    }
    if ((((mon.data).mflags2 & 4) != 0) && mon.data.mlet != S_HUMAN) {
        await new_were(mon);
    }
    if (((mon).m_ap_type & 7) != M_AP_NOTHING) {
        if (!mon.meating) {
            /* this used to include a cansee() check but Protection_from_
           _shape_changers shouldn't be trumped by being unseen */
            /* make revealed mimic fall asleep in lieu of shape change */
            if (((mon).m_ap_type & 7) != M_AP_MONSTER) {
                mon.msleeping = 1;
            }
            await seemimic(mon);
        } else {
            await finish_meating(mon);
        }
    }
}
/* freed by freedynamicdata() when game ends; doesn't need to be struct g */
game.itermonarr = null;
game.itermonsiz = 0;
/* size in 'monst *' pointers */
/* manage itermonarr; it used to be allocated and freed every time the
   monster movement loop ran; now, keep it around most of the time */
export function alloc_itermonarr(count) {
    if (!count || count > game.itermonsiz || count + 40 < game.itermonsiz) {
        /* if count is 0 or bigger than itermonsiz or much smaller than
       itermonsiz, release itermonarr (and reset itermonsiz to 0) */
        if (game.itermonarr) {
            free(game.itermonarr) , game.itermonarr = null;
        }
        game.itermonsiz = 0;
    }
    if (count > game.itermonsiz) {
        /* when count is more than itermonsiz (including when that just
       got reset to 0), allocate a new instance of itermonarr;
       implies that count is greater than 0 */
        /* overallocate to reduce free/alloc-again thrashing when the
           number of monsters varies from turn to turn */
        game.itermonsiz = count + 20;
        game.itermonarr = alloc(game.itermonsiz * 8 /* sizeof(struct monst *) */);
    }
}
/* Iterate all monsters on the level, even dead or off-map ones, calling
   bfunc() for each monster.  If bfunc() returns TRUE, stop iterating.
   If the game ends during the call to bfunc(), then freedynamicdata()
   will free 'itermonarr'.

   Safe for list deletions and insertions, and guarantees calling bfunc()
   once per monster in fmon unless it returns TRUE (or game ends). */
export async function iter_mons_safe(bfunc) {
    let mtmp = null;
    let i = 0;
    let nmons = 0;
    for (nmons = 0 , mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        nmons++;
    }
    /* make sure itermonarr[] is big enough to hold nmons entries */
    alloc_itermonarr(nmons);
    if (nmons) {
        for (i = 0 , mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            game.itermonarr[i++] = mtmp;
        }
        for (i = 0; i < nmons; i++) {
            mtmp = game.itermonarr[i];
            if (await (bfunc)(mtmp)) {
                break;
            }
        }
    }
    return;
}
/* iterate all living monsters on current level, calling vfunc for each. */
export async function iter_mons(vfunc) {
    let mtmp = null;
    let mtmp2 = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
        /*
     * Called during genocide, and again upon level change.  The latter
     * catches up with any migrating monsters as they finally arrive at
     * their intended destinations, so possessions get deposited there.
     *
     * Chameleon handling:
     *  1) if chameleons have been genocided, destroy them
     *     regardless of current form;
     *  2) otherwise, force every chameleon which is imitating
     *     any genocided species to take on a new form.
     */
        mtmp2 = mtmp.nmon;
        if (((mtmp).mhp < 1) || ((mtmp).mstate != 0)) {
            continue;
        }
        await (vfunc)(mtmp);
    }
    return;
}
/* iterate all living monsters on current level, calling bfunc for each.
   if bfunc returns TRUE, stop and return that monster. */
export async function get_iter_mons(bfunc) {
    let mtmp = null;
    let mtmp2 = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
        mtmp2 = mtmp.nmon;
        if (((mtmp).mhp < 1) || ((mtmp).mstate != 0)) {
            continue;
        }
        if (await (bfunc)(mtmp)) {
            break;
        }
    }
    return mtmp;
}
/* iterate all living monsters on current level, calling bfunc for each,
   passing x,y to the function.
   if bfunc returns TRUE, stop and return that monster. */
export async function get_iter_mons_xy(bfunc, x, y) {
    let mtmp = null;
    let mtmp2 = null;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
        mtmp2 = mtmp.nmon;
        if (((mtmp).mhp < 1) || ((mtmp).mstate != 0)) {
            continue;
        }
        if (await (bfunc)(mtmp, x, y)) {
            break;
        }
    }
    return mtmp;
}
/* Heal the given monster by amt hitpoints, unless it is somehow prevented
   from healing. "overheal" is the maximum amount by which the max HP will
   increase to allow for the healing (the resulting HP caps at max HP +
   overheal, and the max HP stays the some unless it needs to increase to
   accommodate the new HP). Overhealing the player is not currently
   implemented by this method.

   This function should only be used for situations which are conceptually
   heals, rather than other situations where a monster's HP is set, so that
   "prevent healing" effects work correctly. In particular, it should not
   be used for cases where a monster's HP is restored upon revival, or when
   a monster is created. It also shouldn't be used for lifesaving, which
   overrides "cannot heal" effects.

   amt and overheal must not be negative (0 is allowed, and a very common
   amount for overheal). Returns the number of hitpoints healed. */
export async function healmon(mtmp, amt, overheal) {
    if (mtmp == game.youmonst) {
        let oldhp = (game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp;
        await healup(amt, 0, 0, 0);
        return ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp) - oldhp;
    } else {
        let oldhp = mtmp.mhp;
        if (mtmp.mhp + amt > mtmp.mhpmax + overheal) {
            mtmp.mhpmax += overheal;
            mtmp.mhp = mtmp.mhpmax;
        } else {
            mtmp.mhp += amt;
            if (mtmp.mhp > mtmp.mhpmax) {
                mtmp.mhpmax = mtmp.mhp;
            }
        }
        return mtmp.mhp - oldhp;
    }
}
/* force all chameleons and mimics to become themselves and werecreatures
   to revert to human form; called when Protection_from_shape_changers gets
   activated via wearing or eating ring or via #wizintrinsic */
export async function rescham() {
    await iter_mons(normal_shape);
}
export async function m_restartcham(mtmp) {
    if (!mtmp.mcan) {
        mtmp.cham = pm_to_cham(((mtmp.data).pmidx));
    }
    if (mtmp.data.mlet == S_MIMIC && mtmp.msleeping) {
        await set_mimic_sym(mtmp);
        await newsym(mtmp.mx, mtmp.my);
    }
}
/* let chameleons change and mimics hide again; called when taking off
   ring of protection from shape changers */
export async function restartcham() {
    await iter_mons(m_restartcham);
}
/* called when restoring a monster from a saved level; protection
   against shape-changing might be different now than it was at the
   time the level was saved. */
export async function restore_cham(mon) {
    if ((game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic) || mon.mcan) {
        await normal_shape(mon);
    } else if (mon.cham == NON_PM) {
        /* chameleon doesn't change shape here, just gets allowed to do so */
        mon.cham = pm_to_cham(((mon.data).pmidx));
    }
}
/* unwatched hiders may hide again; if so, returns True */
export async function restrap(mtmp) {
    let t = null;
    if (mtmp.mcan || ((mtmp).m_ap_type & 7) || ((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0) || rn2(3) || mtmp == game.u.ustuck || (mtmp.mtrapped && (t = t_at(mtmp.mx, mtmp.my)) != null && !((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT)) || (((((mtmp.data).mflags1 & 256) != 0) && (((((mtmp.data).mflags1 & 16) != 0) && (mtmp.data).mlet != S_MIMIC) || (((mtmp.data).mflags1 & 1) != 0))) && !has_ceiling(game.u.uz)) || (sensemon(mtmp) && (dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2))) {
        return (0);
    }
    if (mtmp.data.mlet == S_MIMIC) {
        if (mtmp.msleeping || mtmp.mfrozen) {
            return (0);
        }
        await set_mimic_sym(mtmp);
        return (1);
    } else if (game.level.locations[mtmp.mx][mtmp.my].typ == ROOM) {
        mtmp.mundetected = 1;
        return (1);
    }
    return (0);
}
/* reveal a hiding monster at x,y, either under nonexistent object,
   or an eel out of water. */
export async function maybe_unhide_at(x, y) {
    let mtmp = null;
    let undetected = (0);
    let trapped = (0);
    if ((mtmp = (game.level.monsters[x][y])) != null) {
        undetected = mtmp.mundetected;
        trapped = mtmp.mtrapped;
    } else if (((x) == game.u.ux && (y) == game.u.uy)) {
        mtmp = game.youmonst;
        undetected = game.u.uundetected;
        trapped = game.u.utrap;
    } else {
        return;
    }
    if (undetected && (((((mtmp.data).mflags1 & 128) != 0) && (!(game.level.objects[x][y] != null) || trapped || !can_hide_under_obj(game.level.objects[x][y]))) || (mtmp.data.mlet == S_EEL && !is_pool(x, y)))) {
        await hideunder(mtmp);
    }
}
/* monster/hero tries to hide under something at the current location;
   if used by monster creation, should only happen during level
   creation, otherwise there will be message sequencing issues */
export async function hideunder(mtmp) {
    let t = null;
    let otmp = null;
    let seenmon = null;
    let seenobj = null;
    let locomo = null;
    let seeit = game.in_mklev ? 0 : canseemon(mtmp);
    let oldundetctd = 0;
    let undetected = (0);
    let is_u = (mtmp == game.youmonst);
    let x = is_u ? game.u.ux : mtmp.mx;
    let y = is_u ? game.u.uy : mtmp.my;
    if (mtmp == game.u.ustuck) {
        ;
    } else if ((is_u ? game.u.utrap : mtmp.mtrapped) || ((t = t_at(x, y)) != null && !((t.ttyp) == PIT || (t.ttyp) == SPIKED_PIT))) {
        ;
    } else if (mtmp.data.mlet == S_EEL) {
        /* undetected==FALSE; can't hide if holding you or held by you */
        /* undetected==FALSE; can't hide while trapped or on/in/under
             any non-pit trap when not trapped */
        /* aquatic creatures only hide under water, not under objects;
           they don't do so on the Plane of Water or when hero is also
           under water unless some obstacle blocks line-of-sight */
        undetected = (is_pool(x, y) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && (!(game.u.uinwater) || !((game.viz_array[y][x] & 1) != 0)));
        if (seeit) {
            seenobj = "the water";
            locomo = "dive";
        }
    } else if ((((mtmp.data).mflags1 & 128) != 0) && (otmp = game.level.objects[x][y]) != null && can_hide_under_obj(otmp) && (!mtmp.mtame || !cursed_object_at(x, y)) && !is_pool_or_lava(x, y)) {
        if (seeit) {
            seenobj = await ansimpleoname(otmp);
        }
        if (is_u ? !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) : !await Resists_Elem(mtmp, STONE_RES)) {
            while (otmp && otmp.otyp == CORPSE && ((game.mons[otmp.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[otmp.corpsenm]) == game.mons[PM_CHICKATRICE])) {
                otmp = otmp.v.v_nexthere;
            }
        }
        if (otmp) {
            undetected = (1);
        }
    }
    if (is_u) {
        oldundetctd = game.u.uundetected != 0;
        /* feedback handled via #monster */
        game.u.uundetected = undetected ? 1 : 0;
    } else {
        if (seeit) {
            seenmon = await y_monnam(mtmp);
        }
        oldundetctd = mtmp.mundetected != 0;
        mtmp.mundetected = undetected ? 1 : 0;
        if (undetected && seenmon && seenobj) {
            /* the "you see" message won't be shown for monster hiding during
           level creation because 'seeit' will be 0 so 'seenmon' and 'seenobj'
           will be Null */
            if (!locomo) {
                locomo = locomotion(mtmp.data, "hide");
            }
            set_msg_xy(mtmp.mx, mtmp.my);
            await You_see("%s %s under %s.", seenmon, locomo, seenobj);
            game.iflags.last_msg = PLNMSG_HIDE_UNDER;
            game.last_hider = mtmp.m_id;
        }
    }
    if (undetected != oldundetctd) {
        await newsym(x, y);
    }
    return undetected;
}
/* called when returning to a previously visited level */
export async function hide_monst(mon) {
    let hider_under = (((mon.data).mflags1 & 128) != 0) || mon.data.mlet == S_EEL;
    if (((((mon.data).mflags1 & 256) != 0) || hider_under) && !(mon.mundetected || ((mon).m_ap_type & 7))) {
        let x = mon.mx;
        let y = mon.my;
        let save_viz = game.viz_array[y][x];
        /* override vision, forcing hero to be unable to see monster's spot */
        game.viz_array[y][x] &= ~(2 | 1);
        if ((((mon.data).mflags1 & 256) != 0)) {
            await restrap(mon);
        }
        /* try again if mimic missed its 1/3 chance to hide */
        if (mon.data.mlet == S_MIMIC && !((mon).m_ap_type & 7)) {
            await restrap(mon);
        }
        game.viz_array[y][x] = save_viz;
        if (hider_under) {
            await hideunder(mon);
        }
    }
}
export function mon_animal_list(construct) {
    if (construct) {
        let animal_temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let i = 0;
        let n = 0;
        /* if (animal_list) impossible("animal_list already exists"); */
        for (n = 0 , i = LOW_PM; i < SPECIAL_PM; i++) {
            if ((((game.mons[i]).mflags1 & 262144) != 0)) {
                animal_temp[n++] = i;
            }
        }
        /* if (n == 0) animal_temp[n++] = NON_PM; */
        game.animal_list = alloc(n * 2 /* sizeof(short) */);
        memcpy(game.animal_list, animal_temp, n * 2 /* sizeof(short) */);
        game.animal_list_count = n;
    } else {
        if (game.animal_list) {
            free(game.animal_list) , game.animal_list = null;
        }
        game.animal_list_count = 0;
    }
}
export function pick_animal() {
    let res = 0;
    if (!game.animal_list) {
        mon_animal_list((1));
    }
    (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
    res = game.animal_list[rn2(game.animal_list_count)];
    /* rogue level should use monsters represented by uppercase letters
       only, but since chameleons aren't generated there (not uppercase!)
       we don't perform a lot of retries */
    if ((((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) && !((__ctype_b_loc())[(((def_monsyms[(game.mons[res]).mlet].sym)))] & _ISupper)) {
        res = game.animal_list[rn2(game.animal_list_count)];
    }
    return res;
}
export async function decide_to_shapeshift(mon) {
    let ptr = null;
    let mndx = 0;
    let was_female = mon.female;
    let dochng = (0);
    if (!((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) {
        if (!mon.mspec_used && !rn2(6)) {
            /* regular shapeshifter; 'ptr' is Null */
            dochng = (1);
            mon.mspec_used = 3 + rn2(10);
        }
    } else if (!(mon.mstrategy & 536870912)) {
        if (mon.data.mlet != S_VAMPIRE) {
            if ((mon.mhp <= Math.trunc((mon.mhpmax + 5) / 6)) && rn2(4) && ((mon.cham) >= LOW_PM && (mon.cham) < NUMMONS)) {
                /* The vampire has to be in good health (mhp) to maintain
         * its shifted form.
         *
         * If we're shifted and getting low on hp, maybe shift back, or
         * if we're a fog cloud at full hp, maybe pick a different shape.
         * If we're not already shifted and in good health, maybe shift.
         */
                ptr = game.mons[mon.cham];
                dochng = (1);
            } else if (mon.data == game.mons[PM_FOG_CLOUD] && mon.mhp == mon.mhpmax && !rn2(4) && (!canseemon(mon) || dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) > 8 * 8)) {
                /* if a fog cloud, maybe change to wolf or vampire bat;
                   those are more likely to take damage--at least when
                   tame--and then switch back to vampire; they'll also
                   switch to fog cloud if they encounter a closed door */
                mndx = pickvampshape(mon);
                if (((mndx) >= LOW_PM && (mndx) < NUMMONS)) {
                    ptr = game.mons[mndx];
                    dochng = (ptr != mon.data);
                }
            }
            if (dochng && (((mon.data).mflags1 & 4) != 0) && closed_door(mon.mx, mon.my)) {
                let new_xy = { x: 0, y: 0 };
                if (await enexto(new_xy, mon.mx, mon.my, ptr)) {
                    await rloc_to(mon, new_xy.x, new_xy.y);
                }
            }
        } else {
            if (mon.mhp >= Math.trunc(9 * mon.mhpmax / 10) && !rn2(6) && (!canseemon(mon) || dist2(((mon).mx), ((mon).my), game.u.ux, game.u.uy) > 8 * 8)) {
                dochng = (1);
            }
        }
    }
    if (dochng) {
        if (await newcham(mon, ptr, 1)) {
            if (((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) {
                /* for vampshift, override the 10% chance for sex change
               (by forcing original gender in case that occurred) */
                ptr = mon.data;
                if (!(((ptr).mflags2 & 65536) != 0) && !(((ptr).mflags2 & 131072) != 0) && !(((ptr).mflags2 & 262144) != 0)) {
                    mon.female = was_female;
                }
            }
        }
    }
}
export function pickvampshape(mon) {
    let mndx = mon.cham;
    let wolfchance = 10;
    /* avoid picking monsters with lowercase display symbols ('d' for wolf
       and 'v' for fog cloud) on rogue level*/
    let uppercase_only = (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level))));
    switch (mndx) {
        case PM_VLAD_THE_IMPALER:
            if (mon_has_special(mon)) {
                break;
            }
            wolfchance = 3;
            ;
        case PM_VAMPIRE_LEADER:
            if (!rn2(wolfchance) && !uppercase_only && !is_pool_or_lava(mon.mx, mon.my)) {
                /* ensure Vlad can keep carrying the Candelabrum */
                /* vampire lord or Vlad can become wolf */
                /* don't pick a walking form if that would lead to immediate
               drowning or immolation and reversion to vampire form */
                mndx = PM_WOLF;
                break;
            }
            ;
        case PM_VAMPIRE:
            mndx = (!rn2(4) && !uppercase_only) ? PM_FOG_CLOUD : PM_VAMPIRE_BAT;
            break;
    }
    /* return to base form if chosen poly target has been genocided
       or randomly if already in an alternate form (to prevent always
       switching back and forth between bat and fog) */
    if ((game.mvitals[mndx].mvflags & 2) != 0 || (mon.data != game.mons[mon.cham] && !rn2(4))) {
        return mon.cham;
    }
    return mndx;
}
/* nonshapechangers who warrant special polymorph handling */
export function isspecmon(mon) {
    return (mon.isshk || mon.ispriest || mon.isgd || mon.m_id == game.quest_status.leader_m_id);
}
/* restrict certain special monsters (shopkeepers, aligned priests,
   vault guards) to forms that allow them to behave sensibly (catching
   gold, speaking?) so that they don't need too much extra code */
export function validspecmon(mon, mndx) {
    if (mndx == NON_PM) {
        return (1);
    }
    if (!accept_newcham_form(mon, mndx)) {
        return (0);
    }
    if (isspecmon(mon)) {
        let ptr = game.mons[mndx];
        /* reject notake because object manipulation is expected
           and nohead because speech capability is expected */
        /* [should we check ptr->msound here too?] */
        if ((((ptr).mflags1 & 2048) != 0) || !(((ptr).mflags1 & 32768) == 0)) {
            return (0);
        }
    }
    return (1);
}
/* used for hero polyself handling */
export function valid_vampshiftform(base, form) {
    if (base >= LOW_PM && ((game.mons[base]).mlet == S_VAMPIRE)) {
        if (form == PM_VAMPIRE_BAT || form == PM_FOG_CLOUD || (form == PM_WOLF && base != PM_VAMPIRE)) {
            return (1);
        }
    }
    return (0);
}
/* prevent wizard mode user from specifying invalid vampshifter shape
   when using monpolycontrol to assign a new form to a vampshifter */
export function validvamp(mon, mndx_p, monclass) {
    if (!((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER)) {
        return validspecmon(mon, mndx_p.value);
    }
    if (mon.cham == PM_VLAD_THE_IMPALER && mon_has_special(mon)) {
        /* Vlad with Candelabrum; override choice, then accept it */
        mndx_p.value = PM_VLAD_THE_IMPALER;
        return (1);
    }
    if (((mndx_p.value) >= LOW_PM && (mndx_p.value) < NUMMONS) && (((game.mons[mndx_p.value]).mflags2 & 16384) != 0)) {
        /* player picked some type of shapeshifter; use mon's self
           (vampire or chameleon) */
        mndx_p.value = mon.cham;
        return (1);
    }
    /* basic vampires can't become wolves; any can become fog or bat
       (we don't enforce upper-case only for rogue level here) */
    if (mndx_p.value == PM_WOLF) {
        return (mon.cham != PM_VAMPIRE);
    }
    if (mndx_p.value == PM_FOG_CLOUD || mndx_p.value == PM_VAMPIRE_BAT) {
        return (1);
    }
    switch (monclass) {
        /* if we get here, specific type was no good; try by class */
        case S_VAMPIRE:
            mndx_p.value = mon.cham;
            break;
        case S_BAT:
            mndx_p.value = PM_VAMPIRE_BAT;
            break;
        case S_VORTEX:
            mndx_p.value = PM_FOG_CLOUD;
            break;
        case S_DOG:
            if (mon.cham != PM_VAMPIRE) {
                mndx_p.value = PM_WOLF;
                break;
            }
            ;
        default:
            mndx_p.value = NON_PM;
            break;
    }
    return (mndx_p.value != NON_PM);
}
export async function wiz_force_cham_form(mon) {
    let pprompt = '';
    let parttwo = '';
    let buf = '';
    let prevbuf = '';
    let monclass = 0;
    let len = 0;
    let tryct = 0;
    let mndx = NON_PM;
    pprompt = sprintf(pprompt, "Change %s", await noit_mon_nam(mon));
    parttwo = sprintf(parttwo, " @ %s into what?", coord_desc(mon.mx, mon.my, buf, (game.iflags.getpos_coords != 110) ? game.iflags.getpos_coords : 109));
    /* combine the two parts, not exceeding QBUFSZ-1 in overall length;
       if combined length is too long it has to be due to monster's
       name so we'll chop enough of that off to fit the second part */
    if ((len = strlen(pprompt) + strlen(parttwo)) >= 128) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    }
    pprompt = strcat(pprompt, parttwo);
    /* clear buffer for EDIT_GETLIN */
    (prevbuf = '', buf = '');
    tryct = 5;
    do {
        if (tryct == 5 - 1) {
            /* construct prompt in pieces */
            /* strlen(parttwo) is less than QBUFSZ/2 so strlen(pprompt) is
           more than QBUFSZ/2 and excess amount being truncated can't
           exceed pprompt's length and back up to before &pprompt[0]) */
            /* change "into what?" to "into what kind of monster?" */
            if (strlen(pprompt) + 17 /* sizeof(char [17]) */ - 1 < 128) {
                pprompt = String(pprompt).slice(0, -1) + " kind of monster?";
            }
        }
        monclass = 0;
        buf = await getlin(pprompt, buf);
        buf = mungspaces(buf);
        /* for ESC, take form selected above (might be NON_PM) */
        if (buf == 27) {
            break;
        }
        if (!strcmp(buf, "*") || !strncmpi((buf), ("random"), -1)) {
            /* for "*", use NON_PM to pick an arbitrary shape below */
            /* can't; revert to random in case we exhaust tryct */
            mndx = NON_PM;
            break;
        }
        mndx = await name_to_mon(buf, null);
        if (mndx == NON_PM) {
            monclass = await name_to_monclass(buf, { get value() { return mndx; }, set value(_v) { mndx = _v; } });
            if (monclass && mndx == NON_PM) {
                mndx = mkclass_poly(monclass);
            }
        }
        if (((mndx) >= LOW_PM && (mndx) < NUMMONS)) {
            /* got a specific type of monster; use it if we can */
            if (validvamp(mon, { get value() { return mndx; }, set value(_v) { mndx = _v; } }, monclass)) {
                break;
            }
            mndx = NON_PM;
        }
        await pline("It can't become that.");
        /* EDIT_GETLIN preloads the input buffer with the previous
           response but we shouldn't just keep repeating that if player
           leaves it unchanged; affects retry for empty input too */
        ((prevbuf));
    } while (--tryct > 0);
    if (!tryct) {
        await pline("%s", c_common_strings.c_thats_enough_tries);
    }
    if (((mon).cham == PM_VAMPIRE || (mon).cham == PM_VAMPIRE_LEADER || (mon).cham == PM_VLAD_THE_IMPALER) && !validvamp(mon, { get value() { return mndx; }, set value(_v) { mndx = _v; } }, monclass)) {
        mndx = pickvampshape(mon);
    }
    return mndx;
}
export async function select_newcham_form(mon) {
    let mndx = NON_PM;
    let tryct = 0;
    switch (mon.cham) {
        case PM_SANDESTIN:
            if (rn2(7)) {
                mndx = pick_nasty(game.mons[PM_ARCHON].difficulty - 1);
            }
            break;
        case PM_DOPPELGANGER:
            if (!rn2(7)) {
                mndx = pick_nasty(game.mons[PM_JABBERWOCK].difficulty - 1);
            } else if (rn2(3)) {
                mndx = await tt_doppel(mon);
            } else if (!rn2(3)) {
                mndx = (rn2(PM_APPRENTICE - PM_STUDENT + 1) + (PM_STUDENT));
                /* avoid own role's guardian */
                if (mndx == game.urole.guardnum) {
                    mndx = NON_PM;
                }
            } else {
                tryct = 5;
                do {
                    mndx = (rn2(SPECIAL_PM - LOW_PM) + (LOW_PM));
                    if ((((game.mons[mndx]).mflags1 & 131072) != 0) && (((game.mons[mndx]).mflags2 & 1) == 0)) {
                        break;
                    }
                } while (--tryct > 0);
                if (!tryct) {
                    mndx = NON_PM;
                }
            }
            break;
        case PM_CHAMELEON:
            if (!rn2(3)) {
                mndx = pick_animal();
            }
            break;
        case PM_VLAD_THE_IMPALER:
        case PM_VAMPIRE_LEADER:
        case PM_VAMPIRE:
            mndx = pickvampshape(mon);
            break;
        case NON_PM:
{
                let m_armr = await which_armor(mon, 1);
                if (m_armr && ((m_armr).otyp >= GRAY_DRAGON_SCALES && (m_armr).otyp <= YELLOW_DRAGON_SCALES)) {
                    mndx = (game.mons[PM_GRAY_DRAGON + (m_armr).otyp - GRAY_DRAGON_SCALES].pmidx);
                } else if (m_armr && ((m_armr).otyp >= GRAY_DRAGON_SCALE_MAIL && (m_armr).otyp <= YELLOW_DRAGON_SCALE_MAIL)) {
                    mndx = (game.mons[PM_GRAY_DRAGON + (m_armr).otyp - GRAY_DRAGON_SCALE_MAIL].pmidx);
                }
            }
            break;
    }
    /* for debugging: allow control of polymorphed monster */
    if (game.flags.debug && game.iflags.mon_polycontrol) {
        mndx = await wiz_force_cham_form(mon);
    }
    if (mndx == NON_PM) {
        /* if no form was specified above, pick one at random now */
        tryct = 50;
        do {
            mndx = (rn2(SPECIAL_PM - LOW_PM) + (LOW_PM));
        } while (--tryct > 0 && !validspecmon(mon, mndx) && (tryct > 40 && (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) && !((__ctype_b_loc())[(((def_monsyms[(game.mons[mndx]).mlet].sym)))] & _ISupper)));
    }
    return mndx;
}
/* this used to be inline within newcham() but monpolycontrol needs it too */
export function accept_newcham_form(mon, mndx) {
    let mdat = null;
    if (mndx == NON_PM) {
        return null;
    }
    mdat = game.mons[mndx];
    if ((game.mvitals[mndx].mvflags & 2) != 0) {
        return null;
    }
    if (((mdat) == game.mons[PM_ORC] || (mdat) == game.mons[PM_GIANT] || (mdat) == game.mons[PM_ELF] || (mdat) == game.mons[PM_HUMAN])) {
        return null;
    }
    /* select_newcham_form() might deliberately pick a player
       character type (random selection never does) which
       polyok() rejects, so we need a special case here */
    if ((((mdat).pmidx >= PM_ARCHEOLOGIST) && ((mdat).pmidx <= PM_WIZARD))) {
        return mdat;
    }
    /* shapeshifters are rejected by polyok() but allow a shapeshifter
       to take on its 'natural' form */
    if ((((mdat).mflags2 & 16384) != 0) && ((mon.cham) >= LOW_PM && (mon.cham) < NUMMONS) && mdat == game.mons[mon.cham]) {
        return mdat;
    }
    /* polyok() rules out M2_PNAME, M2_WERE, and all humans except Kops */
    return (((mdat).mflags2 & 1) == 0) ? mdat : null;
}
/* shapechanger might take on a shape that forces gender change */
export function mgender_from_permonst(mtmp, mdat) {
    if ((((mdat).mflags2 & 65536) != 0)) {
        mtmp.female = (0);
    } else if ((((mdat).mflags2 & 131072) != 0)) {
        mtmp.female = (1);
    } else if (!(((mdat).mflags2 & 262144) != 0)) {
        /* usually leave as-is; same chance to change as polymorphing hero;
           vampires use controlled shapechange (from their perspective, even
           if it is random from the player's perspective) and don't undergo
           gender change */
        if (!rn2(10) && !(((mdat).mlet == S_VAMPIRE) || ((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER))) {
            mtmp.female = !mtmp.female;
        }
    }
}
/* make a chameleon take on another shape, or a polymorph target
   (possibly self-inflicted) become a different monster;
   returns 1 if it actually changes form */
export async function newcham(mtmp, mdat, ncflags) {
    let polyspot = ((ncflags & 2) != 0);
    let msg = ((ncflags & 1) != 0);
    let seenorsensed = (canseemon(mtmp) || sensemon(mtmp));
    let hpn = 0;
    let hpd = 0;
    let mndx = 0;
    let tryct = 0;
    let olddata = mtmp.data;
    let p = null;
    let oldname = '';
    let l_oldname = '';
    if (mtmp.cham == NON_PM) {
        /* "The oldmon turns into a newmon!" */
        /* Riders are immune to polymorph and green slime
       (but apparent Rider might actually be a doppelganger) */
        if (((olddata) == game.mons[PM_DEATH] || (olddata) == game.mons[PM_FAMINE] || (olddata) == game.mons[PM_PESTILENCE])) {
            return 0;
        }
        /* make Nazgul and erinyes immune too, to reduce chance of
           anomalous extinction feedback during final disclosure */
        if (mbirth_limit(((olddata).pmidx)) < 120) {
            return 0;
        }
        if (mtmp.mcan && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
            /* cancelled shapechangers become uncancelled prior
           to being given a new shape */
            mtmp.cham = pm_to_cham(((mtmp.data).pmidx));
            if (mtmp.cham != NON_PM) {
                mtmp.mcan = 0;
            }
        }
    }
    if (msg) {
        oldname = strcpy(oldname, await x_monnam(mtmp, mtmp.mtame ? 3 : 1, null, 8, (0)));
        oldname = (() => { const __s = oldname; if (!__s) return __s; const __t = Array.isArray(__s)   ? (() => { let r=''; for (let i=0;i<__s.length&&__s[i];i++) r+=String.fromCharCode(__s[i]); return r; })()   : (__s + ''); return __t.length ? __t[0].toUpperCase() + __t.slice(1) : __s; })();
    }
    l_oldname = strcpy(l_oldname, await x_monnam(mtmp, 1, null, ((mtmp).mextra && ((mtmp).mextra.mgivenname)) ? 8 : 0, (0)));
    if (mdat == null) {
        /* like YMonnam() but never mention saddle */
        /* we need this one whether msg is true or not */
        /* mdat = 0 -> caller wants a random monster shape */
        /* select_newcham_form() loops when resorting to random but
           it doesn't always pick that so we still retry here too */
        tryct = 20;
        do {
            mndx = await select_newcham_form(mtmp);
            mdat = accept_newcham_form(mtmp, mndx);
            /* for the first several tries we require upper-case on
               the rogue level (after that, we take whatever we get) */
            if (tryct > 15 && (((((game.dungeon_topology.d_rogue_level)).dlevel || ((game.dungeon_topology.d_rogue_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_rogue_level)))) && mdat && !((__ctype_b_loc())[(((def_monsyms[(mdat).mlet].sym)))] & _ISupper)) {
                mdat = null;
            }
            if (mdat) {
                break;
            }
        } while (--tryct > 0);
        if (!tryct) {
            return 0;
        }
    } else if (game.mvitals[((mdat).pmidx)].mvflags & 2) {
        return 0;
    }
    /* passed in mdat is genocided */
    if (mdat == olddata) {
        return 0;
    }
    mgender_from_permonst(mtmp, mdat);
    /* Endgame mplayers start out as "Foo the Bar", but some of the
     * titles are inappropriate when polymorphed, particularly into
     * the opposite sex.  Player characters don't use ranks when
     * polymorphed, so dropping rank for mplayers seems reasonable.
     */
    if (((game.u.uz).dnum == (game.dungeon_topology.d_astral_level).dnum) && (((olddata).pmidx >= PM_ARCHEOLOGIST) && ((olddata).pmidx <= PM_WIZARD)) && ((mtmp).mextra && ((mtmp).mextra.mgivenname)) && (p = strstr(((mtmp).mextra.mgivenname), " the ")) != null) {
        ((mtmp).mextra.mgivenname) = nh_strchr_truncate(((mtmp).mextra.mgivenname), " the ", 'str');
    }
    if (mtmp.wormno) {
        let mx = mtmp.mx;
        let my = mtmp.my;
        await wormgone(mtmp);
        await place_monster(mtmp, mx, my);
    }
    if (((mtmp).m_ap_type & 7) && mdat.mlet != S_MIMIC) {
        await seemimic(mtmp);
    }
    /* revert to normal monster */
    /* (this code used to try to adjust the monster's health based on
       a normal one of its type but there are too many special cases
       which need to be handled in order to do that correctly, so just
       give the new form the same proportion of HP as its old one had) */
    hpn = mtmp.mhp;
    hpd = mtmp.mhpmax;
    await newmonhp(mtmp, ((mdat).pmidx));
    /* new hp: same fraction of max as before */
    mtmp.mhp = (Math.trunc((hpn * mtmp.mhp) / hpd));
    /* sanity check (potential overflow) */
    if (mtmp.mhp < 0 || mtmp.mhp > mtmp.mhpmax) {
        mtmp.mhp = mtmp.mhpmax;
    }
    /* unlikely but not impossible; a 1HD creature with 1HP that changes
       into a 0HD creature will require this statement */
    if (!mtmp.mhp) {
        mtmp.mhp = 1;
    }
    set_mon_data(mtmp, mdat);
    if (mtmp.mleashed) {
        if (!leashable(mtmp)) {
            await m_unleash(mtmp, (1));
        /* if leashed, persistent inventory window needs updating
               (really only when mon_nam() is going to yield "a frog"
               rather than "Kermit" but no need to micromanage here) */
        /* x - leash (attached to a <mon>) */
        } else {
            update_inventory();
        }
    }
    if ((((olddata).mlet == S_LIGHT || (olddata) == game.mons[PM_FLAMING_SPHERE] || (olddata) == game.mons[PM_SHOCKING_SPHERE] || (olddata) == game.mons[PM_BABY_GOLD_DRAGON] || (olddata) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((olddata) == game.mons[PM_FIRE_ELEMENTAL] || (olddata) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0) != (((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
        /* used to give light, now doesn't, or vice versa,
           or light's range has changed */
        if ((((olddata).mlet == S_LIGHT || (olddata) == game.mons[PM_FLAMING_SPHERE] || (olddata) == game.mons[PM_SHOCKING_SPHERE] || (olddata) == game.mons[PM_BABY_GOLD_DRAGON] || (olddata) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((olddata) == game.mons[PM_FIRE_ELEMENTAL] || (olddata) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
            await del_light_source(LS_MONSTER, monst_to_any(mtmp));
        }
        if ((((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0)) {
            await new_light_source(mtmp.mx, mtmp.my, (((mtmp.data).mlet == S_LIGHT || (mtmp.data) == game.mons[PM_FLAMING_SPHERE] || (mtmp.data) == game.mons[PM_SHOCKING_SPHERE] || (mtmp.data) == game.mons[PM_BABY_GOLD_DRAGON] || (mtmp.data) == game.mons[PM_FIRE_VORTEX]) ? 1 : ((mtmp.data) == game.mons[PM_FIRE_ELEMENTAL] || (mtmp.data) == game.mons[PM_GOLD_DRAGON]) ? 1 : 0), LS_MONSTER, monst_to_any(mtmp));
        }
    }
    if (!mtmp.perminvis || ((olddata) == game.mons[PM_STALKER] || (olddata) == game.mons[PM_BLACK_LIGHT])) {
        mtmp.perminvis = ((mdat) == game.mons[PM_STALKER] || (mdat) == game.mons[PM_BLACK_LIGHT]);
    }
    mtmp.minvis = mtmp.invis_blkd ? 0 : mtmp.perminvis;
    if (mtmp.mundetected) {
        await hideunder(mtmp);
    }
    if (game.u.ustuck == mtmp) {
        if (game.u.uswallow) {
            if (!attacktype(mdat, 11)) {
                if (!((mdat).mlet == S_GHOST) && !((mdat).mlet == S_VORTEX || (mdat) == game.mons[PM_AIR_ELEMENTAL]) && !((((mdat).mflags1 & 4) != 0) || mdat.mlet == S_LIGHT)) {
                    let msgtrail = '';
                    if (((mtmp).cham == PM_VAMPIRE || (mtmp).cham == PM_VAMPIRE_LEADER || (mtmp).cham == PM_VLAD_THE_IMPALER)) {
                        msgtrail = sprintf(msgtrail, " which was a shapeshifted %s", await noname_monnam(mtmp, 0));
                    } else if ((dmgtype_fromattack((mdat), 26, 11) != null)) {
                        msgtrail = strcpy(msgtrail, "'s stomach");
                    } else {
                        msgtrail = '';
                    }
                    await You("%s %s%s!", ((((olddata).mflags1 & 4) != 0) || ((olddata).mlet == S_VORTEX || (olddata) == game.mons[PM_AIR_ELEMENTAL])) ? "emerge from" : "break out of", l_oldname, msgtrail);
                    msg = (0);
                    mtmp.mhp = 1;
                }
                await expels(mtmp, olddata, (0));
            } else {
                await swallowed(0);
            }
        } else if ((!sticks(mdat) && !sticks(game.youmonst.data)) || (((mdat).mflags1 & 1048576) != 0)) {
            await unstuck(mtmp);
        }
    }
    if (mdat == game.mons[PM_LONG_WORM] && (mtmp.wormno = get_wormno()) != 0) {
        initworm(mtmp, rn2(5));
        await place_worm_tail_randomly(mtmp, mtmp.mx, mtmp.my);
    }
    /* never seen mon in present shape; newsym() ->
                          * display_monster() may change it right back */
    mtmp.meverseen = 0;
    await newsym(mtmp.mx, mtmp.my);
    if (msg) {
        if (!(canseemon(mtmp) || sensemon(mtmp))) {
            if (seenorsensed) {
                await pline_mon(mtmp, "%s disappears!", oldname);
            }
            await usmellmon(mdat);
        } else if (!seenorsensed) {
            let mnm = await x_monnam(mtmp, mtmp.mtame ? 3 : 2, null, 0, (0));
            await pline_mon(mtmp, "%s appears!", upstart(mnm));
        } else {
            await pline_mon(mtmp, "%s turns into %s!", oldname, await noname_monnam(mtmp, 2));
        }
    }
    /* when polymorph trap/wand/potion produces a vampire, turn in into
       a full-fledged vampshifter unless shape-changing is blocked */
    if (mtmp.cham == NON_PM && mdat.mlet == S_VAMPIRE && !(game.u.uprops[PROT_FROM_SHAPE_CHANGERS].intrinsic || game.u.uprops[PROT_FROM_SHAPE_CHANGERS].extrinsic)) {
        mtmp.cham = pm_to_cham(((mdat).pmidx));
    }
    await possibly_unwield(mtmp, polyspot);
    await mon_break_armor(mtmp, polyspot);
    if (!(mtmp.misc_worn_check & 16)) {
        await mselftouch(mtmp, "No longer petrify-resistant, ", !game.context.mon_moving);
    }
    check_gear_next_turn(mtmp);
    if (mtmp.minvent && !(((mdat).mflags2 & 134217728) != 0)) {
        /* This ought to re-test can_carry() on each item in the inventory
     * rather than just checking ex-giants & boulders, but that'd be
     * pretty expensive to perform.  If implemented, then perhaps
     * minvent should be sorted in order to drop heaviest items first.
     */
        /* former giants can't continue carrying boulders */
        let otmp = null;
        let otmp2 = null;
        for (otmp = mtmp.minvent; otmp && !((mtmp).mhp < 1); otmp = otmp2) {
            /* DEADMONSTER(): it is possible for flooreffects() to kill mtmp;
           the rest of its inventory would be dropped making otmp2 stale */
            otmp2 = otmp.nobj;
            if (otmp.otyp == BOULDER) {
                /* this keeps otmp from being polymorphed in the
                   same zap that the monster that held it is polymorphed */
                if (polyspot) {
                    bypass_obj(otmp);
                }
                await obj_extract_self(otmp);
                if (await flooreffects(otmp, mtmp.mx, mtmp.my, "")) {
                    continue;
                }
                await place_object(otmp, mtmp.mx, mtmp.my);
            }
        }
    }
    if (mtmp == game.u.usteed) {
        await poly_steed(mtmp, olddata);
    }
    if (game.context.mon_moving) {
        /* old form might not have been affected by Elbereth but perhaps the
       new form is */
        /* give 'mtmp' a new chance to pinpoint hero's location */
        if (!((mtmp.mux) == game.u.ux && (mtmp.muy) == game.u.uy)) {
            set_apparxy(mtmp);
        }
        /* if hero is on Elbereth or scare monster, mtmp in new form might
           become scared */
        if (!mtmp.mpeaceful && onscary(mtmp.mux, mtmp.muy, mtmp) && monnear(mtmp, mtmp.mux, mtmp.muy)) {
            await monflee(mtmp, (rn2(9) + (2)), (1), (1));
        }
    }
    return 1;
}
/* sometimes an egg will be special */
/*
 * Determine if the given monster number can be hatched from an egg.
 * Return the monster number to use as the egg's corpsenm.  Return
 * NON_PM if the given monster can't be hatched.
 */
export function can_be_hatched(mnum) {
    /* ranger quest nemesis has the oviparous bit set, making it
       be possible to wish for eggs of that unique monster; turn
       such into ordinary eggs rather than forbidding them outright */
    if (mnum == PM_SCORPIUS) {
        mnum = PM_SCORPION;
    }
    mnum = little_to_big(mnum);
    /*
     * Queen bees lay killer bee eggs (usually), but killer bees don't
     * grow into queen bees.  Ditto for [winged-]gargoyles.
     */
    if (mnum == PM_KILLER_BEE || mnum == PM_GARGOYLE || ((((game.mons[mnum]).mflags1 & 4194304) != 0) && ((!rn2(77)) || (mnum != PM_QUEEN_BEE && mnum != PM_WINGED_GARGOYLE)))) {
        return mnum;
    }
    return NON_PM;
}
/* type of egg laid by #sit; usually matches parent */
/* parent monster; caller must handle lays_eggs() check */
export function egg_type_from_parent(mnum, force_ordinary) {
    if (force_ordinary || !(!rn2(77))) {
        if (mnum == PM_QUEEN_BEE) {
            mnum = PM_KILLER_BEE;
        } else if (mnum == PM_WINGED_GARGOYLE) {
            mnum = PM_GARGOYLE;
        }
    }
    return mnum;
}
/* decide whether an egg of the indicated monster type is viable;
   also used to determine whether an egg or tin can be created... */
export function dead_species(m_idx, egg) {
    let alt_idx = 0;
    /* generic eggs are unhatchable and have corpsenm of NON_PM */
    if (m_idx < LOW_PM) {
        return (1);
    }
    /*
     * For monsters with both baby and adult forms, genociding either
     * form kills all eggs of that monster.  Monsters with more than
     * two forms (small->large->giant mimics) are more or less ignored;
     * fortunately, none of them have eggs.  Species extinction due to
     * overpopulation does not kill eggs.
     */
    alt_idx = egg ? big_to_little(m_idx) : m_idx;
    return ((game.mvitals[m_idx].mvflags & 2) != 0 || (game.mvitals[alt_idx].mvflags & 2) != 0);
}
/* kill off any eggs of genocided monsters */
export function kill_eggs(obj_list) {
    let otmp = null;
    for (otmp = obj_list; otmp; otmp = otmp.nobj) {
        if (otmp.otyp == EGG) {
            if (dead_species(otmp.corpsenm, (1))) {
                /*
                 * It seems we could also just catch this when
                 * it attempted to hatch, so we wouldn't have to
                 * search all of the objlists.. or stop all
                 * hatch timers based on a corpsenm.
                 */
                kill_egg(otmp);
            }
        } else if (((otmp).cobj != null)) {
            kill_eggs(otmp.cobj);
        }
    }
}
/* kill all members of genocided species */
export async function kill_genocided_monsters() {
    let mtmp = null;
    let mtmp2 = null;
    let kill_cham = 0;
    let mndx = 0;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp2) {
        mtmp2 = mtmp.nmon;
        if (((mtmp).mhp < 1)) {
            continue;
        }
        mndx = ((mtmp.data).pmidx);
        kill_cham = (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS) && (game.mvitals[mtmp.cham].mvflags & 2));
        if ((game.mvitals[mndx].mvflags & 2) || kill_cham) {
            if (((mtmp.cham) >= LOW_PM && (mtmp.cham) < NUMMONS) && !kill_cham) {
                await newcham(mtmp, null, 1);
            } else {
                await mondead(mtmp);
            }
        }
        if (mtmp.minvent) {
            kill_eggs(mtmp.minvent);
        }
    }
    kill_eggs(game.invent);
    kill_eggs(game.level.objlist);
    kill_eggs(game.migrating_objs);
    kill_eggs(game.level.buriedobjlist);
}
export async function golemeffects(mon, damtype, dam) {
    let heal = 0;
    let slow = 0;
    if (mon.data == game.mons[PM_FLESH_GOLEM]) {
        if (damtype == 6) {
            heal = Math.trunc((dam + 5) / 6);
        } else if (damtype == 2 || damtype == 3) {
            slow = 1;
        }
    } else if (mon.data == game.mons[PM_IRON_GOLEM]) {
        if (damtype == 6) {
            slow = 1;
        } else if (damtype == 2) {
            heal = dam;
        }
    } else {
        return;
    }
    if (slow) {
        if (mon.mspeed != 1) {
            await mon_adjust_speed(mon, -1, null);
        }
    }
    if (heal) {
        if (await healmon(mon, heal, 0)) {
            if (((game.viz_array[mon.my][mon.mx] & 2) != 0)) {
                await pline_mon(mon, "%s seems healthier.", await Monnam(mon));
            }
        }
    }
}
/* anger the Minetown watch */
export async function angry_guards(silent) {
    let mtmp = null;
    let ct = 0;
    let nct = 0;
    let sct = 0;
    let slct = 0;
    for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
        if (((mtmp).mhp < 1)) {
            continue;
        }
        if (((mtmp.data) == game.mons[PM_WATCHMAN] || (mtmp.data) == game.mons[PM_WATCH_CAPTAIN]) && mtmp.mpeaceful) {
            ct++;
            if ((canseemon(mtmp) || sensemon(mtmp)) && mtmp.mcanmove) {
                if ((dist2(((mtmp).mx), ((mtmp).my), game.u.ux, game.u.uy) <= 2)) {
                    nct++;
                } else {
                    sct++;
                }
            }
            if (mtmp.msleeping || mtmp.mfrozen) {
                slct++;
                mtmp.msleeping = mtmp.mfrozen = 0;
            }
            mtmp.mpeaceful = 0;
        }
    }
    if (ct) {
        if (!silent) {
            let buf = '';
            if (slct) {
                buf = sprintf(buf, "guard%s", (((slct) == 1) ? "" : "s"));
                await pline_The("%s %s up.", buf, await vtense(buf, "wake"));
            }
            if (nct) {
                buf = sprintf(buf, "guard%s", (((nct) == 1) ? "" : "s"));
                await pline_The("%s %s angry!", buf, await vtense(buf, "get"));
            } else if (sct) {
                buf = sprintf(buf, "guard%s", (((sct) == 1) ? "" : "s"));
                await pline("%s %s %s approaching!", (sct == 1) ? "An angry" : "Angry", buf, await vtense(buf, "are"));
            } else {
                buf = strcpy(buf, (ct == 1) ? "a guard's" : "guards'");
                ;
                await You_hear("the shrill sound of %s whistle%s.", buf, (((ct) == 1) ? "" : "s"));
            }
        }
        return (1);
    }
    return (0);
}
export function pacify_guard(mtmp) {
    if (((mtmp.data) == game.mons[PM_WATCHMAN] || (mtmp.data) == game.mons[PM_WATCH_CAPTAIN])) {
        mtmp.mpeaceful = 1;
    }
}
export async function pacify_guards() {
    await iter_mons(pacify_guard);
}
export async function mimic_hit_msg(mtmp, otyp) {
    let ap = mtmp.mappearance;
    switch (((mtmp).m_ap_type & 7)) {
        case M_AP_NOTHING:
        case M_AP_FURNITURE:
        case M_AP_MONSTER:
            break;
        case M_AP_OBJECT:
            if (otyp == SPE_HEALING || otyp == SPE_EXTRA_HEALING) {
                await pline_mon(mtmp, "%s seems a more vivid %s than before.", await The(await simple_typename(ap)), c_obj_colors[game.objects[ap].oc_color]);
            }
            break;
    }
}
export async function usmellmon(mdat) {
    let mndx = 0;
    let nonspecific = (0);
    let msg_given = (0);
    if (mdat) {
        if (!olfaction(game.youmonst.data)) {
            return (0);
        }
        mndx = ((mdat).pmidx);
        switch (mndx) {
            case PM_ROTHE:
            case PM_MINOTAUR:
                await You("notice a bovine smell.");
                msg_given = (1);
                break;
            case PM_CAVE_DWELLER:
            case PM_BARBARIAN:
            case PM_NEANDERTHAL:
                await You("smell body odor.");
                msg_given = (1);
                break;
            /*
        case PM_PESTILENCE:
        case PM_FAMINE:
        case PM_DEATH:
            break;
        */
            case PM_HORNED_DEVIL:
            case PM_BALROG:
            case PM_ASMODEUS:
            case PM_DISPATER:
            case PM_YEENOGHU:
            case PM_ORCUS:
                break;
            case PM_HUMAN_WEREJACKAL:
            case PM_HUMAN_WERERAT:
            case PM_HUMAN_WEREWOLF:
            case PM_WEREJACKAL:
            case PM_WERERAT:
            case PM_WEREWOLF:
            case PM_OWLBEAR:
                await You("detect an odor reminiscent of an animal's den.");
                msg_given = (1);
                break;
            /*
        case PM_PURPLE_WORM:
            break;
        */
            case PM_STEAM_VORTEX:
                await You("smell steam.");
                msg_given = (1);
                break;
            case PM_GREEN_SLIME:
                await pline("%s stinks.", c_common_strings.c_Something);
                msg_given = (1);
                break;
            case PM_VIOLET_FUNGUS:
            case PM_SHRIEKER:
                await You("smell mushrooms.");
                msg_given = (1);
                break;
            /* These are here to avoid triggering the
           nonspecific treatment through the default case below*/
            case PM_WHITE_UNICORN:
            case PM_GRAY_UNICORN:
            case PM_BLACK_UNICORN:
            case PM_JELLYFISH:
                break;
            default:
                nonspecific = (1);
                break;
        }
        if (nonspecific) {
            switch (mdat.mlet) {
                case S_DOG:
                    await You("notice a dog smell.");
                    msg_given = (1);
                    break;
                case S_DRAGON:
                    await You("smell a dragon!");
                    msg_given = (1);
                    break;
                case S_FUNGUS:
                    await pline("%s smells moldy.", c_common_strings.c_Something);
                    msg_given = (1);
                    break;
                case S_UNICORN:
                    await You("detect a%s odor reminiscent of a stable.", (mndx == PM_PONY) ? "n" : " strong");
                    msg_given = (1);
                    break;
                case S_ZOMBIE:
                    await You("smell rotting flesh.");
                    msg_given = (1);
                    break;
                case S_EEL:
                    await You("smell fish.");
                    msg_given = (1);
                    break;
                case S_ORC:
                    if (((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 128) != 0)) : ((game.urace.mnum == (PM_ORC))))) {
                        await You("notice an attractive smell.");
                    } else {
                        await pline("A foul stench makes you feel a little nauseated.");
                    }
                    msg_given = (1);
                    break;
                default:
                    break;
            }
        }
    }
    return msg_given ? (1) : (0);
}
/* setting misc_worn_check's I_SPECIAL bit flags a monster to reassess
   and potentially re-equip gear at the start of its next move;
   this hides the details of that */
export function check_gear_next_turn(mon) {
    mon.misc_worn_check |= 536870912;
}
/* make erinyes more dangerous based on your alignment abuse */
export function adj_erinys(abuse) {
    let pm = game.mons[PM_ERINYS];
    if (abuse > 5) {
        pm.mflags1 |= 16777216;
    }
    if (abuse > 10) {
        pm.mflags1 |= 512;
    }
    if (abuse > 15) {
        pm.mflags1 |= 1;
    }
    if (abuse > 20) {
        pm.mattk[0].damn = 3;
    }
    if (abuse > 25) {
        pm.mflags1 |= 8388608;
    }
    if (abuse > 30) {
        pm.mflags1 |= 67108864;
    }
    if (abuse > 35) {
        pm.mattk[1].aatyp = 254;
        pm.mattk[1].adtyp = 7;
        pm.mattk[1].damn = 3;
        pm.mattk[1].damd = 4;
    }
    if (abuse > 40) {
        pm.mflags1 |= 33554432;
    }
    if (abuse > 50) {
        /* third (spellcasting) attack */
        pm.mattk[2].aatyp = 255;
        pm.mattk[2].adtyp = 241;
        pm.mattk[2].damn = 3;
        pm.mattk[2].damd = 4;
    }
    /* also adjust level and difficulty */
    pm.mlevel = ((7 + game.u.ualign.abuse) < (50) ? (7 + game.u.ualign.abuse) : (50));
    pm.difficulty = ((10 + (Math.trunc(game.u.ualign.abuse / 3))) < (25) ? (10 + (Math.trunc(game.u.ualign.abuse / 3))) : (25));
}
/* mark individual monster type as seen from close-up,
   if we haven't seen it nearby before */
export async function see_monster_closeup(mtmp, photo) {
    let mndx = 0;
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic))) {
        return;
    }
    mndx = ((mtmp.data).pmidx);
    if (((mtmp).m_ap_type & 7) == M_AP_MONSTER && !sensemon(mtmp)) {
        mndx = mtmp.mappearance;
    }
    if (mndx == PM_LONG_WORM && game.notonhead) {
        mndx = PM_LONG_WORM_TAIL;
    }
    if (!game.mvitals[mndx].seen_close) {
        game.mvitals[mndx].seen_close = 1;
        game.context.lifelist.total_seen_upclose++;
    }
    if (photo && !mtmp.minvis && !mtmp.mundetected && (((mtmp).m_ap_type & 7) == M_AP_NOTHING || ((mtmp).m_ap_type & 7) == M_AP_MONSTER)) {
        /* hallucinatory monsters don't reach here--they're not recorded;
       being able to see invisible doesn't make invisible monsters show up
       on photos; likewise, telepathy allows hero to see hidden monsters
       but doesn't cause them to appear on photos */
        if (((mtmp).m_ap_type & 7) == M_AP_MONSTER) {
            mndx = mtmp.mappearance;
        }
        if (!game.mvitals[mndx].photographed) {
            game.mvitals[mndx].photographed = 1;
            game.context.lifelist.total_photographed++;
            if ((game.urole.mnum == (PM_TOURIST)) && (mtmp.m_id != game.context.startingpet_mid || mndx != game.context.startingpet_typ) && mndx == ((mtmp.data).pmidx)) {
                await more_experienced(experience(mtmp, 0), 0);
                await newexplevel();
            }
        }
    }
}
/* mark a monster type as seen close-up when we see it next to us */
export async function see_nearby_monsters() {
    let mtmp = null;
    let mndx = 0;
    let x = 0;
    let y = 0;
    if ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || (((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) && !(game.u.uprops[TELEPAT].intrinsic || game.u.uprops[TELEPAT].extrinsic))) {
        return;
    }
    for (x = game.u.ux - 1; x <= game.u.ux + 1; x++) {
        for (y = game.u.uy - 1; y <= game.u.uy + 1; y++) {
            if (!isok(x, y)) {
                continue;
            }
            if (!(mtmp = (game.level.monsters[x][y]))) {
                continue;
            }
            mndx = ((mtmp.data).pmidx);
            if (((mtmp).m_ap_type & 7) == M_AP_MONSTER) {
                mndx = mtmp.mappearance;
            }
            /* skip closeup handling if this mon type has already been done */
            if (game.mvitals[mndx].seen_close) {
                continue;
            }
            if (canseemon(mtmp) || (mtmp.mundetected && sensemon(mtmp))) {
                /* disguised mimics pass canseemon(); undetected hiders don't */
                game.bhitpos.x = x , game.bhitpos.y = y;
                game.notonhead = (x != mtmp.mx || y != mtmp.my);
                await see_monster_closeup(mtmp, (0));
            }
        }
    }
}
/* monster resists something.
   make a shield effect at monster's location and give a message */
export async function shieldeff_mon(mtmp) {
    await shieldeff(mtmp.mx, mtmp.my);
    if (((game.viz_array[mtmp.my][mtmp.mx] & 2) != 0)) {
        await pline_mon(mtmp, "%s resists!", await Monnam(mtmp));
    }
}
export async function flash_mon(mtmp) {
    let mx = mtmp.mx;
    let my = mtmp.my;
    let count = ((game.viz_array[my][mx] & 1) != 0) ? 8 : 4;
    let saveviz = game.viz_array[my][mx];
    if (!game.flags.sparkle) {
        count = Math.trunc(count / 2);
    }
    game.viz_array[my][mx] |= (2 | 1);
    await flash_glyph_at(mx, my, (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? ((rn2_on_display_rng)(NUMMONS)) : (((mtmp).data).pmidx)) + (((mtmp).female == 0) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)), count);
    game.viz_array[my][mx] = saveviz;
    await newsym(mx, my);
}
/* cleanup for 'onefile' processing */
/*mon.c*/
/* TODO: verify some of the other edog fields */
/* most sanity checks issue warnings if they detect a problem,
           but this would be too extreme to keep going */
/* guardian angel on astral level is tame but has emin rather than edog */
/* monst->mfrozen is difficult to deal with--it's used for paralysis,
       for temporary sleep, and for being busy (usually donning armor);
       code that sets mfrozen needs to also clear mcanmove, otherwise the
       helpless() test will be unreliable */
/* after hero moves, leashed mon won't necessarily pass 'm_next2u()'
           test; 90 is farthest observed distance with expert jumping spell
           when very slow mon is already several steps away and hero jumps in
           opposite direction (if hero teleports, leashed mon moves adjacent
           immediately; knockback has shorter range than magical jumping) */
/* dead monsters should still have sane data */
/* steed is in fmon list but not on the map; its
               <mx,my> coordinates should match hero's location */
/* some temp mstate bits can be expected for a mon on fmon, as part of
           removing it, but DEADMONSTER check above should skip those. */
/* all liches will create zombies as well */
/* very low chance of creating all glass gems */
/* Good luck gives more coins */
/* we have to do this here because most other places
           expect there to be an object coming back; not this one */
/* include mtmp in the mkcorpstat() call */
/* preserve the unique traits of some creatures */
/* 'obj' remains valid if stacking happens */
/* in case the corpse was placed at a different spot from where
       the monster was (not expected to happen) */
/* there's no "above the surface" on the plane of water */
/* Gremlin multiplying won't go on forever since the hit points
     * keep going down, and when it gets to 1 hit point the clone
     * function will fail.
     */
/*
         * Lava effects much as water effects. Lava likers are able to
         * protect their stuff. Fire resistant monsters can only protect
         * themselves  --ALI
         */
/* not fair...?  hero doesn't automatically teleport away
               from lava, just from water */
/* unlike fire -> melt ice -> pool, there's no way for the
                   hero to create lava beneath a monster, so the !mon_moving
                   case is not expected to happen (and we haven't made a
                   player-against-monster variation of the message above) */
/* vampshifter in wolf form can revert to vampire lord
                       * and become a flyer so not need to teleport */
/* likes_lava case is hypothetical */
/* Most monsters drown in pools.  flooreffects() will take care of
         * water damage to dead monsters' inventory, but survivors need to
         * be handled here.  Swimmers are able to protect their stuff...
         */
/* like hero with teleport intrinsic or spell, teleport away
               if possible */
/* hero used fire to melt ice that monster was on */
/* This can happen after a purple worm plucks you off a
                   flying steed while you are over water. */
/* ok to leave corpse despite water */
/* must check non-moving monsters once/turn in case they managed
       to end up in water or lava; note: when not in liquid they regen,
       shape-shift, timeout temporary maladies just like other monsters */
/* or if the program has lost contact with the user */
/* one dead monster needs to perform a move after death: vault
       guard whose temporary corridor is still on the map; live
       guards who have led the hero back to civilization get moved
       off the map too; gd_move() decides whether the temporary
       corridor can be removed and guard discarded (via clearing
       mon->isgd flag so that dmonsfree() will get rid of mon) */
/* parked at <0,0>; eventually isgd should get set to false */
/* unwatched mimics and piercers may hide again  [MRS] */
/* some eels end up stuck in isolated pools, where they
           can't--or at least won't--move, so they never reach
           their post-move chance to re-hide */
/* continue if the monster died fighting */
/* Note:
         *  Conflict does not take effect in the first round.
         *  Therefore, A monster when stepping into the area will
         *  get to swing at you.
         *
         *  The call to fightm() must be _last_.  The monster might
         *  have died if it returns 1.
         */
/* otherwise just move the monster */
/* remove dead monsters; dead vault guard will be left at <0,0>
       if temporary corridor out of vault hasn't been removed yet */
/* a monster may have levteleported player -dlc */
/* contents of eaten containers become engulfed or dropped onto
      the floor; this is arbitrary, but otherwise g-cubes are too
      powerful */
/* non-pet: Heal up to the object's weight in hp */
/* Eats topmost metal object if it is there */
/* Don't eat indigestible/choking/inappropriate objects */
/* call distant_name() for its side-effects even when
                       !verbose so won't be printed */
/* (see above; format even if it won't be printed) */
/* call distant_name() for its possible side-effects even if
               the result won't be printed */
/* lastly, edible items; yum! */
/* (see above; distant_name() sometimes has side-effects */
/* give this one even if !verbose */
/* Engulf & devour is instant, so don't set meating */
/* ignore veggy corpse even if omnivorous */
/* don't eat harmful corpses */
/* corpse is gone; mtmp might be too so do this now
                             since we're bypassing the bottom of the loop */
/* let a handful of corpse types thru to can_carry() */
/* call distant_name() for its possible side-effects even
                   if the result won't be printed; do it before the extract
                   from floor and subsequent pickup by mtmp */
/* may merge and free otmp3 */
/* unicorn may not be able to avoid hero on a noteleport level */
/* first diagonal checks (tight squeezes handled below) */
/* The monster avoids a particular type of trap if it's
                 * familiar with the trap type.  Pets get ALLOW_TRAPS
                 * and checking is done in dogmove.c.  In either case,
                 * "harmless" traps are neither avoided nor marked in info[].
                 */
/* treat inside the Wizard's tower as if it were a separate level
           from outside so when hero is inside Wizard's tower, both monsters
           need to be too; when outside, the monsters need to be too */
/* Various other combinations such as dog vs cat, cat vs rat, and
       elf vs orc have been suggested.  For the time being we don't
       support those. */
/* remove the old monster from the map and from `fmon' list */
/* finish adding its replacement */
/* don't place steed onto the map */
/* update level.monsters[wseg->wx][wseg->wy] */
/* locations to mtmp2 not mtmp. */
/* since this is so rare, we don't have any `mon_move_light_source' */
/* here we rely on fact that `mtmp' hasn't actually been deleted */
/* mon is not swallowing or holding you nor held by you */
/* vault guard might be at <0,0> */
/* mustn't do this; too many places assume that the stale
         * monst->mx,my values are still valid */
/* if mon is pinned by a boulder, removing mon lets boulder drop */
/*
     * Take mtmp off map but not out of fmon list yet (dmonsfree does that).
     *
     * Sequencing issue:  mtmp's inventory should be dropped before taking
     * it off the map but if that includes a boulder and mtmp is at a pit
     * location, dropping minvent ought to be deferred until its corpse
     * gets placed.  We compromise and just make sure mtmp is off the map
     * before dropping its former belongings.
     */
/* foodead() might give quest feedback for foo having died; skip that
       if we're called for mongone() rather than mondead(); saving bones
       or wizard mode genocide of "*" can result in special monsters going
       away without having been killed */
/* The Archeologist, Caveman, and Priest quest texts describe
               the nemesis's body creating noxious fumes/gas when killed. */
/* release (drop onto map) all objects carried by mtmp; assumes that
           mtmp->mx,my contains the appropriate location */
/* drop mtmp->minvent, issue newsym(mx,my) */
/* reset theft-in-progress data */
/* hero is thrown from his steed when it dies or gets genocided */
/* not canseemon; amulets are on the head, so you don't want
         * to show this for a long worm with only a tail visible.
         * Nor do you check invisibility, because glowing and
         * disintegrating amulets are always visible. */
/* amulet is visible, but monster might not be */
/* mtmp==u.ustuck can happen if previously a fog cloud or if
           poly'd hero is hugging a vampire bat */
/* 3.6.0 used a_monnam(mtmp); that was weird if mtmp was
               named: "Dracula suddenly transforms and rises as Dracula";
               3.6.1 used mtmp->data->mname; that ignored hallucination */
/* also generates a livelog event */
/* trap, pet, conflict:  "<monst> has been killed" */
/* hero is responsible: "killed <monst>" */
/* vampire in bat/fog/wolf form reverts to vampire instead of dying */
/* dead vault guard is actually kept at coordinate <0,0> until
       his temporary corridor to/from the vault has been removed;
       need to do this after life-saving and before m_detach() */
/* Dead Kops may come back. */
/* achievement and/or livelog */
/* remove 'mtmp' from play; it will stay on the fmon list until end of
       current move, then dmonsfree() will get rid of it */
/* mdef is a gas spore (AT_BOOM) that is exploding inside an
                   engulfer; suppress usual explosion since it's contained */
/* this assumes that the dead monster's map coordinates remain accurate */
/* dead vault guard is actually kept at coordinate <0,0> until
       his temporary corridor to/from the vault has been removed */
/* drop special items like the Amulet so that a dismissed Kop or nurse
       can't remove them from the game */
/* release rest of monster's inventory--it is removed from game */
/* vampshifter reverts to vampire;
       3.6.3: also used to unshift shape-changed sandestin */
/* some objects may end up outside the statue */
/* monsters don't carry statues */
/* invocation tools resist even with 0% resistance */
/* calls mondead() and maybe leaves a corpse */
/* do this first so that docrt()'s botl update is accurate;
           clears u.uswallow as well as setting u.ustuck to Null */
/* don't give to mon if missile is going to be destroyed */
/* don't give to mon if missile is going to return to hero */
/* thrown object has killed hero's engulfer; add it to mon's
           inventory now so that it will be placed with mon's other
           stuff prior to lookhere/autopickup when hero is expelled
           below (as a side-effect, this missile has immunity from
           being consumed [for this shot/throw only]) */
/* dispose of monster and make cadaver */
/* illogical but traditional "treasure drop" */
/* no extra item from swallower or steed */
/* no extra item from kops--too easy to abuse */
/* no items from cloned monsters */
/* don't drop newly created permafood from kills, unless
                   the monster collects food; it creates too much nutrition
                   in the late game and encourages grinding in the early
                   game; oartifact check is paranoia and will be redundant
                   until an artifact comestible is added */
/* oc_big is also oc_bimanual and oc_bulky */
/* monster is gone, corpse or other object might now be visible */
/* will decide if you go up */
/* your god is mighty displeased... */
/* it's a golem, and not a stone golem */
/*
     * If mtmp->mx is zero, this was a failed arrival attempt from a
     * prior migration and mtmp isn't on the map.  In that situation
     * it can't be engulfing or holding the hero or held by same and
     * should have dropped any special objects during that earlier
     * migration back when it had a valid map location.  So only
     * perform some actions when mx is non-zero.
     */
/* places in the code might still reference mtmp->mx, mtmp->my */
/* mtmp->mx = mtmp->my = 0; */
/* last resort - migrate mon to the next plane */
/* don't move grid bugs diagonally */
/* [this doesn't honor the 'montelecontrol' option] */
/* take othermon off the map; it might end up immediately returning
           but for the moment it is leaving */
/* Actually we have real problems if enexto ever fails.
         * Migrating_mons that need to be placed will cause
         * no end of trouble.
         */
/* othermon already had its mx, my set to 0 above
                 * and this would shortly cause a sanity check to fail
                 * if we just return 0 here. The caller only possesses
                 * awareness of mtmp, not othermon. */
/* 'move_other'==FALSE this time; fail rather than recurse */
/* 1/10 chance per shriek to create a monster */
/* new monster has a 1/13 chance to be a purple worm, random
           otherwise; baby purple worm if adult is too difficult */
/* shopkeepers and temple priests might gasp in
                       surprise, but they won't become angry here;
                       quest leader will only get angry if hero attacks
                       own quest guardians */
/* mustn't set mpeaceful to 0 as below;
                           * perhaps reduce tameness? */
/* word like a separate sentence so that we
                           don't have to poke around inside growl() */
/* only hypocritical if monster is vulnerable to Elbereth (or
           peaceful--not vulnerable but attacking it is hypocritical) */
/* attacking your own quest leader will anger his or her guardians */
/* make other peaceful monsters react */
/* sleep for N turns uses mtmp->mfrozen, but so does paralysis
               so we leave mfrozen monsters alone */
/* quickmimic: pet is midst of eating a mimic corpse;
               this terminates the meal early */
/* force chameleon or mimic to revert to its natural shape */
/* hider-underers only hide under objects */
/* most things can be hidden under, but not all */
/* pets won't hide under a cursed item or an item of any BUC
                  state that shares a pile with one or more cursed items */
/* aquatic creatures don't reach here; other swimmers
                  shouldn't hide beneath underwater objects */
/*&& (!is_pool(x, y) || (Underwater && distu(x, y) <= 2))*/
/* most monsters won't hide under a cockatrice corpse but they
           can hide under a pile containing more than just such corpses */
/* didn't get a type, so check whether it's a class
               (single letter or text match with def_monsyms[]) */
/* try harder to select uppercase monster on rogue level */
/* discards tail segments, takes head off the map */
/* put the head back; it will morph into mtmp's new form */
/* set level and hit points */
/* Do this even if msg is FALSE */
/* update swallow glyphs for new monster */
/* sticky hero can't continue to hold mtmp if it has
                      turned into a non-solid creature; we don't use
                      uunstick() for that because its message would be
                      shown out of sequence [before 'if (msg)' below];
                      unstuck() doesn't issue any messages */
/* oldname is capitalized and might be an assigned name */
/* can't see or sense it now */
/* could see or sense it before */
/* couldn't see/sense before, can now */
/* saw/sensed it before, still see/sense it now */
/* "a <monster type>" even if it has a name assigned */
/* might lose use of weapon */
/* probably ought to give some "drop" message here */
/* seen/sensed adjacent guard(s) */
/* seen/sensed non-adjacent guard(s) */
/* tourist earns points (toward EXP but not final score) for
               the first instance of each type of monster photographed;
               worm tail can be photographed but yields no EXP bonus */
/* suppress extra points for photographing the pet that hero
                   started with (unless it has changed shape due to growing
                   up or being polymorphed) */
/* monsndx() check covers worm tail and also disguised
                   Wizard of Yendor; experienced() won't yield a reasonable
                   value for those */
