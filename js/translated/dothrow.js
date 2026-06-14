/* NetHack 5.0	dothrow.c	$NHDT-Date: 1737343372 2025/01/19 19:22:52 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.300 $ */
/* Copyright (c) Stichting Mathematisch Centrum, Amsterdam, 1985. */
/*-Copyright (c) Robert Patrick Rankin, 2013. */
/* NetHack may be freely redistributed.  See license for details. */
/* Contains code for 't' (throw) */
import { game } from '../gstate.js';
import { sgn } from '../c2js-runtime/math.js';
import { impossible } from '../c2js-runtime/panic.js';
import { You, You_cant, You_feel, You_hear, Your, pline, pline_The, verbalize } from '../c2js-runtime/pline.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_char_at0, strcat, strchr, strcpy } from '../c2js-runtime/string.js';
import { stop_occupation } from './allmain.js';
import { could_pole_mon, snuff_candle, use_pole, use_whip } from './apply.js';
import { artifact_hit, is_art, spec_abon } from './artifact.js';
import { acurr, acurrstr, change_luck, exercise } from './attrib.js';
import { drag_ball, drop_ball, move_bc } from './ball.js';
import { cmdq_add_ec, cmdq_add_key, getdir, isok } from './cmd.js';
import { is_lava, is_moat, is_pool, is_waterwall } from './dbridge.js';
import { c_common_strings } from './decl.js';
import { canseemon, flush_screen, glyph_at, map_invisible, newsym, sensemon, tmp_at } from './display.js';
import { canletgo, doaltarobj, dropy, dropz, flooreffects, obj_no_longer_held } from './do.js';
import { Monnam, Some_Monnam, a_monnam, hliquid, mon_nam, pmname, rndmonnam, x_monnam } from './do_name.js';
import { hard_helmet } from './do_wear.js';
import { dogfood, tamedog } from './dog.js';
import { container_impact_dmg, ghitm, ship_object } from './dokick.js';
import { ceiling, has_ceiling, on_level, surface, u_on_newpos } from './dungeon.js';
import { done } from './end.js';
import { u_wipe_engr } from './engrave.js';
import { explode, explode_oil } from './explode.js';
import { bad_rock, calc_capacity, check_capacity, check_special_room, impact_disturbs_zombies, in_rooms, inv_weight, losehp, may_passwall, nomul, switch_terrain, weight_cap } from './hack.js';
import { dist2, distmin, isqrt, ordin, s_suffix } from './hacklib.js';
import { addinv, addinv_before, delobj, freeinv, fully_identify_obj, getobj, prinv, sobj_at, stackobj } from './invent.js';
import { obj_sheds_light } from './light.js';
import { makemon, set_malign } from './makemon.js';
import { add_to_minv, is_flammable, place_object, splitobj, unsplitobj, weight } from './mkobj.js';
import { minliquid, monnear, seemimic, setmangry, wake_nearto, wakeup } from './mon.js';
import { can_blnd, dmgtype_fromattack, hates_silver, mon_hates_blessings, poly_when_stoned, pronoun_gender } from './mondata.js';
import { closed_door, set_apparxy } from './monmove.js';
import { ACCFOOD, ACID_VENOM, AIR, AKLYS, ALTAR, AMULET_OF_YENDOR, ARM, ARMOR_CLASS, ART_MJOLLNIR, ART_SNICKERSNEE, A_CON, A_DEX, A_STR, BAG_OF_HOLDING, BAG_OF_TRICKS, BANANA, BLINDED, BLINDING_VENOM, BOOMERANG, BOULDER, BULLWHIP, CLOTH, CLOUD, COIN_CLASS, CONFUSION, CORPSE, CQ_CANNED, CREAM_PIE, CRYSTAL_BALL, DEAF, DOOR, DRAWBRIDGE_UP, EGG, ELVEN_ARROW, ELVEN_BOW, EUCALYPTUS_LEAF, EXPENSIVE_CAMERA, EXPL_FIERY, EYE, FACE, FAKE_AMULET_OF_YENDOR, FIRE_TRAP, FIRST_OBJECT, FIRST_REAL_GEM, FIRST_SPELL, FLINT, FLYING, FOOD_CLASS, FOOT, FORTUNE_COOKIE, FUMBLING, GAUNTLETS_OF_DEXTERITY, GAUNTLETS_OF_FUMBLING, GAUNTLETS_OF_POWER, GEMSTONE, GEM_CLASS, GETOBJ_DOWNPLAY, GETOBJ_EXCLUDE, GETOBJ_SUGGEST, GLASS, GLYPH_BODY_OFF, GLYPH_BODY_PILETOP_OFF, GLYPH_DETECT_FEM_OFF, GLYPH_DETECT_MALE_OFF, GLYPH_INVIS_OFF, GLYPH_MON_FEM_OFF, GLYPH_MON_MALE_OFF, GLYPH_OBJ_OFF, GLYPH_OBJ_PILETOP_OFF, GLYPH_PET_FEM_OFF, GLYPH_PET_MALE_OFF, GLYPH_RIDDEN_FEM_OFF, GLYPH_RIDDEN_MALE_OFF, GLYPH_STATUE_FEM_OFF, GLYPH_STATUE_FEM_PILETOP_OFF, GLYPH_STATUE_MALE_OFF, GLYPH_STATUE_MALE_PILETOP_OFF, HALF_PHDAM, HALLUC, HALLUC_RES, HAND, HEAD, HEAVY_IRON_BALL, HMON_APPLIED, HMON_KICKED, HMON_THROWN, HOLE, IRONBARS, KELP_FROND, LAST_GLASS_GEM, LAST_SPELL, LEATHER_GLOVES, LENSES, LEVITATION, LOW_PM, MAGIC_PORTAL, MELON, MINERAL, MIRROR, M_AP_MONSTER, NEUTRAL, NUMMONS, NUM_OBJECTS, OILSKIN_SACK, ORCISH_ARROW, ORCISH_BOW, PANCAKE, PASSES_WALLS, PIT, PM_AIR_ELEMENTAL, PM_APE, PM_CAVE_DWELLER, PM_CHICKATRICE, PM_CLERIC, PM_COCKATRICE, PM_CYCLOPS, PM_DWARF, PM_ELF, PM_FLOATING_EYE, PM_GNOME, PM_GRID_BUG, PM_HEALER, PM_HOMUNCULUS, PM_HUMAN, PM_IMP, PM_LICHEN, PM_MONK, PM_MONKEY, PM_NINJA, PM_ORC, PM_PYROLISK, PM_RANGER, PM_ROGUE, PM_SAMURAI, PM_SHADE, PM_STONE_GOLEM, PM_TOURIST, PM_VALKYRIE, PM_WIZARD, POOL, POTION_CLASS, POT_OIL, POT_WATER, P_AXE, P_BOOMERANG, P_BOW, P_CROSSBOW, P_DAGGER, P_DART, P_EXPERT, P_KNIFE, P_LANCE, P_NONE, P_PICK_AXE, P_POLEARMS, P_SABER, P_SHORT_SWORD, P_SHURIKEN, P_SKILLED, P_SLING, P_SPEAR, RING_CLASS, ROCK, RUBBER_HOSE, SACK, SCROLL_CLASS, SHOPBASE, SILVER, SLING, SLT_ENCUMBER, SPIKED_PIT, SPRIG_OF_WOLFSBANE, STATUE, STONE, STONE_RES, STONING, STRANGE_OBJECT, STUNNED, S_UNICORN, S_VORTEX, THROWN_TETHERED_WEAPON, THROWN_WEAPON, TOOL_CLASS, TOWEL, TRAPDOOR, TREE, TT_BURIEDBALL, TT_INFLOOR, TT_LAVA, TT_WEB, Trap_Caught_Mon, Trap_Killed_Mon, Trap_Moved_Mon, VEGGY, VENOM_CLASS, VIBRATING_SQUARE, WAND_CLASS, WAN_STRIKING, WAR_HAMMER, WEAPON_CLASS, WT_SPLASH_THRESHOLD, WT_TOOMUCH_DIAGONAL, WT_TO_DMG, WWALKING, YA, YUMI } from './nh-constants.js';
import { An, Doname2, The, Tobjnam, an, armor_simple_name, corpse_xname, helm_simple_name, killer_xname, makeplural, mshot_xname, otense, singular, the, thesimpleoname, vtense, xname } from './objnam.js';
import { encumber_msg } from './pickup.js';
import { Norep } from './pline.js';
import { body_part, polymon } from './polyself.js';
import { make_blinded, potionbreathe, potionhit } from './potion.js';
import { align_gname } from './pray.js';
import { finish_quest } from './quest.js';
import { is_quest_artifact } from './questpgr.js';
import { in_out_region, m_in_out_region } from './region.js';
import { d, rn2, rn2_on_display_rng, rnd, rnl } from './rnd.js';
import { genders } from './role.js';
import { contained_gold, costly_spot, donate_gold, hot_pursuit, inside_shop, is_unpaid, make_angry_shk, obfree, sellobj, shop_keeper, stolen_value, subfrombill } from './shk.js';
import { mpickobj, remove_worn_item } from './steal.js';
import { place_monster } from './steed.js';
import { goodpos, rloc, tele_restrict } from './teleport.js';
import { dotrap, drown, erode_obj, instapetrify, minstapetrify, mintrap, t_at, trapname } from './trap.js';
import { hmon, passive_obj } from './uhitm.js';
import { vision_recalc } from './vision.js';
import { autoreturn_weapon, dmgval, dry_a_towel, hitval, skill_name, weapon_descr, weapon_hit_bonus, weapon_type } from './weapon.js';
import { doquiver_core, doswapweapon, dowield, set_twoweap, setuqwep, setuswapwep, setuwep, welded, weldmsg } from './wield.js';
import { cutworm } from './worm.js';
import { find_mac, which_armor } from './worn.js';
import { bhit, boomhit, hit, miss, obj_resists } from './zap.js';

/* uwep might already be removed from inventory so test for W_WEP instead;
   for Valk+Mjollnir, caller needs to validate the strength requirement */
/* gt.thrownobj (decl.c) tracks an object until it lands */
/* can be NULL */
export function multishot_class_bonus(pm, ammo, launcher) {
    let multishot = 0;
    let skill = game.objects[ammo.otyp].oc_subtyp;
    switch (pm) {
        case PM_CAVE_DWELLER:
            if (skill == -P_SLING || skill == P_SPEAR) {
                multishot++;
            }
            /* monster breathing isn't handled... [yet?] */
            /* caller will handle object disposition;
           we're just doing the shop theft handling */
            break;
        case PM_MONK:
            if (skill == -P_SHURIKEN) {
                multishot++;
            }
            break;
        case PM_RANGER:
            if (skill != P_DAGGER) {
                multishot++;
            }
            break;
        case PM_ROGUE:
            if (skill == P_DAGGER) {
                multishot++;
            }
            break;
        case PM_NINJA:
            if (skill == -P_SHURIKEN || skill == -P_DART) {
                multishot++;
            }
            ;
        case PM_SAMURAI:
            if (ammo.otyp == YA && launcher && launcher.otyp == YUMI) {
                multishot++;
            }
            break;
        default:
            break;
    }
    return multishot;
}
/* Throw the selected object, asking for direction */
export async function throw_obj(obj, shotlimit) {
    let otmp = null;
    let oldslot = null;
    let multishot = 0;
    let skill = 0;
    let wep_mask = 0;
    let twoweap = 0;
    let weakmultishot = 0;
    let res = 0;
    let save_osplit = { parent_oid: 0, child_oid: 0 };
    unsplit_stack: {
        res = 1;
        save_osplit = game.context.objsplit;
        if (!await getdir(null)) {
            /* ask "in what direction?" */
            /* No direction specified, so cancel the throw */
            res = 2;
            break unsplit_stack;
        }
        if (obj.oclass == COIN_CLASS && obj != game.uquiver) {
            return await throw_gold(obj);
        }
        if (!await canletgo(obj, "throw")) {
            res = 0;
            break unsplit_stack;
        }
        if (is_art(obj, ART_MJOLLNIR) && obj != game.uwep) {
            await pline("%s must be wielded before it can be thrown.", await The(await xname(obj)));
            res = 0;
            break unsplit_stack;
        }
        if ((is_art(obj, ART_MJOLLNIR) && (acurr(A_STR)) < (100 + (25))) || (obj.otyp == BOULDER && !(((game.youmonst.data).mflags2 & 134217728) != 0))) {
            await pline("It's too heavy.");
            res = 1;
            break unsplit_stack;
        }
        if (!game.u.dx && !game.u.dy && !game.u.dz) {
            await You("cannot throw an object at yourself.");
            res = 0;
            break unsplit_stack;
        }
        await u_wipe_engr(2);
        if (!game.uarmg && obj.otyp == CORPSE && ((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE]) && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic)) {
            await You("throw %s with your bare %s.", await corpse_xname(obj, null, 4), await makeplural(await body_part(HAND)));
            game.killer.name = sprintf(game.killer.name, "throwing %s bare-handed", await killer_xname(obj));
            await instapetrify(game.killer.name);
        }
        if (welded(obj)) {
            await weldmsg(obj);
            res = 1;
            break unsplit_stack;
        }
        if (((obj).otyp == TOWEL && (obj).spe > 0)) {
            await dry_a_towel(obj, -1, (0));
        }
        /* Multishot calculations
     * (potential volley of up to N missiles; default for N is 1)
     */
        multishot = 1;
        skill = game.objects[obj.otyp].oc_subtyp;
        if (obj.quan > 1 && (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) ? ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp) : obj.oclass == WEAPON_CLASS) && !(game.u.uprops[CONFUSION].intrinsic || game.u.uprops[STUNNED].intrinsic)) {
            /* no point checking if there's only 1 */
            /* ammo requires corresponding launcher be wielded */
            /* otherwise any stackable (non-ammo) weapon */
            /* some roles don't get a volley bonus until becoming expert */
            weakmultishot = ((game.urole.mnum == (PM_WIZARD)) || (game.urole.mnum == (PM_CLERIC)) || ((game.urole.mnum == (PM_HEALER)) && skill != P_KNIFE) || ((game.urole.mnum == (PM_TOURIST)) && skill != -P_DART) || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic) || (acurr(A_DEX)) <= 6);
            switch ((game.u.weapon_skills[weapon_type(obj)].skill)) {
                /* poor dexterity also inhibits multishot */
                /* Bonus if the player is proficient in this weapon... */
                case P_EXPERT:
                    multishot++;
                    ;
                case P_SKILLED:
                    if (!weakmultishot) {
                        multishot++;
                    }
                    break;
                /* basic or unskilled: no bonus */
                default:
                    break;
            }
            /* ...or is using a special weapon for their role... */
            multishot += multishot_class_bonus((game.urole.mnum), obj, game.uwep);
            if (!weakmultishot) {
                switch ((game.urace.mnum)) {
                    /* ...or using their race's special bow; no bonus for spears */
                    case PM_ELF:
                        if (obj.otyp == ELVEN_ARROW && game.uwep && game.uwep.otyp == ELVEN_BOW) {
                            multishot++;
                        }
                        break;
                    case PM_ORC:
                        if (obj.otyp == ORCISH_ARROW && game.uwep && game.uwep.otyp == ORCISH_BOW) {
                            multishot++;
                        }
                        break;
                    case PM_GNOME:
                        if (skill == -P_CROSSBOW) {
                            multishot++;
                        }
                        break;
                    case PM_HUMAN:
                    case PM_DWARF:
                    default:
                        break;
                }
                /* when launcher is own quest artifact, give extra +1 with any
               type of ammo appropriate for that launcher (compensates for
               elven and orcish rangers loss of bonus for use of racial bow
               plus racial arrows if they switch to the Longbow of Diana) */
                if (game.uwep && is_quest_artifact(game.uwep) && (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
                    ++multishot;
                }
            }
            /* crossbows are slow to load and probably shouldn't allow multiple
           shots at all, but that would result in players never using them;
           instead, high strength is necessary to load and shoot quickly */
            if (multishot > 1 && skill == -P_CROSSBOW && (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp)) && (acurrstr()) < ((game.urace.mnum == (PM_GNOME)) ? 16 : 18)) {
                multishot = rnd(multishot);
            }
            multishot = rnd(multishot);
            if (multishot > obj.quan) {
                multishot = obj.quan;
            }
            if (shotlimit > 0 && multishot > shotlimit) {
                multishot = shotlimit;
            }
        }
        game.m_shot.s = (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp)) ? (1) : (0);
        if (multishot > 1 || shotlimit > 0) {
            await You("%s %d %s.", game.m_shot.s ? "shoot" : "throw", multishot, (multishot == 1) ? await singular(obj, xname) : await xname(obj));
        }
        wep_mask = obj.owornmask;
        oldslot = null;
        game.m_shot.o = obj.otyp;
        game.m_shot.n = multishot;
        for (game.m_shot.i = 1; game.m_shot.i <= game.m_shot.n; game.m_shot.i++) {
            /* (might be 1 if player gave shotlimit) */
            twoweap = game.u.twoweap;
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            if (obj.quan > 1) {
                otmp = await splitobj(obj, 1);
            } else {
                otmp = obj;
                if (otmp.owornmask) {
                    await remove_worn_item(otmp, (0));
                }
                oldslot = obj.nobj;
                /* obj will leave inventory and may be freed by throwit, don't
               try to unsplit it from potential parent stack below */
                obj = null;
            }
            await freeinv(otmp);
            await throwit(otmp, wep_mask, twoweap, oldslot);
            await encumber_msg();
        }
        game.m_shot.n = game.m_shot.i = 0;
        game.m_shot.o = STRANGE_OBJECT;
        game.m_shot.s = (0);
    }
    if (obj && obj != game.uquiver && (obj.o_id == save_osplit.parent_oid || obj.o_id == save_osplit.child_oid)) {
        /* might need to undo an object split.
     * We used to use freeinv(obj),addinv(obj) here, but that can
     * merge obj into another stack--usually quiver--even if it hadn't
     * been split from there (possibly triggering a panic in addinv),
     * and freeinv+addinv potentially has other side-effects.
     */
        /* futureproofing: objsplit will have been affected if partial stack
           was thrown; objects will have been split off stack to throw. */
        Object.assign(game.context.objsplit, save_osplit);
        await unsplitobj(obj);
    }
    return res;
}
/* common to dothrow() and dofire() */
/* (see dothrow()) */
export async function ok_to_throw(shotlimit_p) {
    shotlimit_p.value = (((game.command_count) < (0) ? (0) : (game.command_count) > (32767) ? (32767) : (game.command_count)));
    /* reset; it's been used up */
    game.multi = 0;
    if ((((game.youmonst.data).mflags1 & 2048) != 0)) {
        await You("are physically incapable of throwing or shooting anything.");
        /*[what about !freehand(), aside from cursed missile launcher?]*/
        /* previous step wants to stop now */
        return (0);
    } else if ((((game.youmonst.data).mflags1 & 8192) != 0)) {
        await You_cant("throw or shoot without hands.");
        return (0);
    }
    if (await check_capacity(null)) {
        return (0);
    }
    return (1);
}
/* getobj callback for object to be thrown */
export function throw_ok(obj) {
    if (!obj) {
        return GETOBJ_EXCLUDE;
    }
    /* not a candidate if known to be stuck */
    if (obj.bknown && welded(obj)) {
        return GETOBJ_DOWNPLAY;
    }
    if (((((obj.owornmask) & 256) != 0 && ((obj).otyp == AKLYS || ((obj).oartifact == ART_MJOLLNIR && (game.urole.mnum == (PM_VALKYRIE))))) || (obj).otyp == BOOMERANG) && (obj.oartifact != ART_MJOLLNIR || (acurr(A_STR)) >= (100 + (25)))) {
        return GETOBJ_SUGGEST;
    }
    if (obj.quan == 1 && (obj == game.uwep || (obj == game.uswapwep && game.u.twoweap))) {
        return GETOBJ_DOWNPLAY;
    }
    if (obj.oclass == COIN_CLASS) {
        return GETOBJ_SUGGEST;
    }
    if (!(game.uwep && game.objects[game.uwep.otyp].oc_subtyp == P_SLING) && obj.oclass == WEAPON_CLASS) {
        return GETOBJ_SUGGEST;
    }
    /* Possible extension: exclude weapons that make no sense to throw,
       such as whips, bows, slings, rubber hoses. */
    if ((game.uwep && game.objects[game.uwep.otyp].oc_subtyp == P_SLING) && obj.oclass == GEM_CLASS) {
        return GETOBJ_SUGGEST;
    }
    if ((((game.youmonst.data).mflags2 & 134217728) != 0) && obj.otyp == BOULDER) {
        return GETOBJ_SUGGEST;
    }
    return GETOBJ_DOWNPLAY;
}
/* the #throw command */
export async function dothrow() {
    let obj = null;
    let shotlimit = 0;
    if (!await ok_to_throw({ get value() { return shotlimit; }, set value(_v) { shotlimit = _v; } })) {
        return 0;
    }
    obj = await getobj("throw", throw_ok, 2 | 1);
    return obj ? await throw_obj(obj, shotlimit) : 2;
}
/* KMH -- Automatically fill quiver */
/* Suggested by Jeffrey Bay <jbay@convex.hp.com> */
export async function autoquiver() {
    let otmp = null;
    let oammo = null;
    let omissile = null;
    let omisc = null;
    let altammo = null;
    if (game.uquiver) {
        return;
    }
    for (otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.owornmask || otmp.oartifact || !otmp.dknown) {
            ;
        } else if (otmp.otyp == ROCK || (otmp.otyp == FLINT && game.objects[otmp.otyp].oc_name_known) || (otmp.oclass == GEM_CLASS && game.objects[otmp.otyp].oc_material == GLASS && game.objects[otmp.otyp].oc_name_known)) {
            /* Scan through the inventory */
            /* seen rocks or known flint or known glass */
            if ((game.uwep && game.objects[game.uwep.otyp].oc_subtyp == P_SLING)) {
                oammo = otmp;
            } else if ((((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((game.uswapwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(game.uswapwep).otyp].oc_subtyp))) {
                altammo = otmp;
            /* skip non-rock gems--they're ammo but
                 player has to select them explicitly */
            /* Ammo matched with launcher (bow+arrow, crossbow+bolt) */
            /* Mismatched ammo (no better than an ordinary weapon) */
            } else if (!omisc) {
                omisc = otmp;
            }
        } else if (otmp.oclass == GEM_CLASS) {
            ;
        } else if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW)) {
            if ((((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
                oammo = otmp;
            } else if ((((otmp.oclass == WEAPON_CLASS || otmp.oclass == GEM_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[otmp.otyp].oc_subtyp <= -P_BOW) && ((game.uswapwep) && game.objects[(otmp).otyp].oc_subtyp == -game.objects[(game.uswapwep).otyp].oc_subtyp))) {
                altammo = otmp;
            } else {
                omisc = otmp;
            }
        } else if (((otmp.oclass == WEAPON_CLASS || otmp.oclass == TOOL_CLASS) && game.objects[otmp.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[otmp.otyp].oc_subtyp <= -P_DART)) {
            /* Missile (dart, shuriken, etc.) */
            omissile = otmp;
        } else if (otmp.oclass == WEAPON_CLASS && throwing_weapon(otmp)) {
            if (game.objects[otmp.otyp].oc_subtyp == P_DAGGER && !omissile) {
                omissile = otmp;
            } else if (otmp.otyp == AKLYS) {
                continue;
            } else {
                omisc = otmp;
            }
        }
    }
    if (oammo) {
        await setuqwep(oammo);
    } else if (omissile) {
        await setuqwep(omissile);
    } else if (altammo) {
        await setuqwep(altammo);
    } else if (omisc) {
        await setuqwep(omisc);
    }
    return;
}
/* look through hero inventory for launcher matching ammo,
   avoiding known cursed items. Returns NULL if no match. */
export function find_launcher(ammo) {
    let otmp = null;
    let oX = null;
    if (!ammo) {
        return null;
    }
    for (oX = null , otmp = game.invent; otmp; otmp = otmp.nobj) {
        if (otmp.cursed && otmp.bknown) {
            continue;
        }
        if ((((ammo.oclass == WEAPON_CLASS || ammo.oclass == GEM_CLASS) && game.objects[ammo.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[ammo.otyp].oc_subtyp <= -P_BOW) && ((otmp) && game.objects[(ammo).otyp].oc_subtyp == -game.objects[(otmp).otyp].oc_subtyp))) {
            /* known to be cursed, so skip */
            if (otmp.bknown) {
                return otmp;
            }
            /* known-B or known-U (known-C won't get here) */
            if (!oX) {
                oX = otmp;
            }
        }
    }
    return oX;
}
/* the #fire command -- throw from the quiver or use wielded polearm */
export async function dofire() {
    let shotlimit = 0;
    let obj = null;
    /* AutoReturn() verifies Valkyrie if weapon is Mjollnir, but it relies
       on its caller to make sure hero is strong enough to throw that */
    let uwep_Throw_and_Return = (game.uwep && ((((game.uwep.owornmask) & 256) != 0 && ((game.uwep).otyp == AKLYS || ((game.uwep).oartifact == ART_MJOLLNIR && (game.urole.mnum == (PM_VALKYRIE))))) || (game.uwep).otyp == BOOMERANG) && (game.uwep.oartifact != ART_MJOLLNIR || (acurr(A_STR)) >= (100 + (25))));
    let skip_fireassist = (0);
    let altres = 0;
    let res = 0;
    if (!await ok_to_throw({ get value() { return shotlimit; }, set value(_v) { shotlimit = _v; } })) {
        return 0;
    }
    obj = game.uquiver;
    if (uwep_Throw_and_Return && (!obj || ((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW))) {
        /* if wielding a throw-and-return weapon, throw it if quiver is empty
       or has ammo rather than missiles [since the throw/return weapon is
       wielded, the ammo's launcher isn't; the ammo-only policy avoids
       throwing Mjollnir if quiver contains daggers] */
        obj = game.uwep;
        skip_fireassist = (1);
    } else if (!obj) {
        if (!game.flags.autoquiver) {
            if (game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && (game.objects[game.uwep.otyp].oc_subtyp == P_POLEARMS || game.objects[game.uwep.otyp].oc_subtyp == P_LANCE || is_art(game.uwep, ART_SNICKERSNEE)))) {
                return await use_pole(game.uwep, (1));
            } else if (game.uwep && game.uwep.otyp == BULLWHIP) {
                return await use_whip(game.uwep);
            } else if (game.iflags.fireassist && game.uswapwep && ((game.uswapwep.oclass == WEAPON_CLASS || game.uswapwep.oclass == TOOL_CLASS) && (game.objects[game.uswapwep.otyp].oc_subtyp == P_POLEARMS || game.objects[game.uswapwep.otyp].oc_subtyp == P_LANCE || is_art(game.uswapwep, ART_SNICKERSNEE))) && !(game.uswapwep.cursed && game.uswapwep.bknown)) {
                /* we have a known not-cursed polearm as swap weapon.
                   swap to it and retry */
                /* swap weapons and retry fire */
                cmdq_add_ec(CQ_CANNED, doswapweapon);
                cmdq_add_ec(CQ_CANNED, dofire);
                /* haven't taken any time yet */
                return 0;
            } else {
                await You("have no ammunition readied.");
            }
        } else {
            await autoquiver();
            obj = game.uquiver;
            if (obj) {
                /* give feedback if quiver has now been filled */
                game.uquiver.owornmask &= ~512;
                await prinv("You ready:", obj, 0);
                game.uquiver.owornmask |= 512;
            } else {
                await You("have nothing appropriate for your quiver.");
            }
        }
    }
    if (!obj) {
        /* if autoquiver is disabled or has failed, prompt for missile */
        /* in case we're using ^A to repeat prior 'f' command, don't
           use direction of previous throw as getobj()'s choice here */
        game.in_doagain = 0;
        res = await doquiver_core("fire");
        if (res != 0 && res != 1) {
            return res;
        }
        obj = game.uquiver;
    }
    if (game.uquiver && ((game.uquiver.oclass == WEAPON_CLASS || game.uquiver.oclass == GEM_CLASS) && game.objects[game.uquiver.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uquiver.otyp].oc_subtyp <= -P_BOW) && game.iflags.fireassist && !skip_fireassist) {
        let olauncher = null;
        if (game.uwep && ((game.uwep.oclass == WEAPON_CLASS || game.uwep.oclass == TOOL_CLASS) && (game.objects[game.uwep.otyp].oc_subtyp == P_POLEARMS || game.objects[game.uwep.otyp].oc_subtyp == P_LANCE || is_art(game.uwep, ART_SNICKERSNEE))) && could_pole_mon()) {
            return await use_pole(game.uwep, (1));
        }
        if ((((game.uquiver.oclass == WEAPON_CLASS || game.uquiver.oclass == GEM_CLASS) && game.objects[game.uquiver.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uquiver.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(game.uquiver).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
            obj = game.uquiver;
        } else if ((((game.uquiver.oclass == WEAPON_CLASS || game.uquiver.oclass == GEM_CLASS) && game.objects[game.uquiver.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[game.uquiver.otyp].oc_subtyp <= -P_BOW) && ((game.uswapwep) && game.objects[(game.uquiver).otyp].oc_subtyp == -game.objects[(game.uswapwep).otyp].oc_subtyp))) {
            cmdq_add_ec(CQ_CANNED, doswapweapon);
            cmdq_add_ec(CQ_CANNED, dofire);
            return res;
        } else if ((olauncher = find_launcher(game.uquiver)) != null) {
            /* wield launcher, retry fire */
            if (game.uwep && !game.flags.pushweapon) {
                cmdq_add_ec(CQ_CANNED, doswapweapon);
            }
            cmdq_add_ec(CQ_CANNED, dowield);
            cmdq_add_key(CQ_CANNED, olauncher.invlet);
            cmdq_add_ec(CQ_CANNED, dofire);
            return res;
        }
    }
    altres = obj ? await throw_obj(obj, shotlimit) : 2;
    /* fire can take time by filling quiver (if that causes something which
       was wielded to be unwielded) even if the throw itself gets cancelled */
    return (res == 1) ? res : altres;
}
/* if in midst of multishot shooting/throwing, stop early */
export async function endmultishot(verbose) {
    if (game.m_shot.i < game.m_shot.n) {
        if (verbose && !game.context.mon_moving) {
            await You("stop %s after the %d%s %s.", game.m_shot.s ? "firing" : "throwing", game.m_shot.i, ordin(game.m_shot.i), game.m_shot.s ? "shot" : "toss");
        }
        /* make current shot be the last */
        game.m_shot.n = game.m_shot.i;
    }
}
/* Object hits floor at hero's feet.
   Called from drop(), throwit(), hold_another_object(), litter(). */
/* usually True; False if caller has given drop mesg */
export async function hitfloor(obj, verbosely) {
    if (((game.level.locations[game.u.ux][game.u.uy].typ) == AIR || (game.level.locations[game.u.ux][game.u.uy].typ) == CLOUD || ((game.level.locations[game.u.ux][game.u.uy].typ) >= POOL && (game.level.locations[game.u.ux][game.u.uy].typ) <= DRAWBRIDGE_UP)) || game.u.uinwater || game.u.uswallow) {
        await dropy(obj);
        return;
    }
    if (((game.level.locations[game.u.ux][game.u.uy].typ) == ALTAR)) {
        await doaltarobj(obj);
    } else if (verbosely) {
        let verb = (obj.otyp == WAN_STRIKING) ? "strike" : "hit";
        let surf = surface(game.u.ux, game.u.uy);
        let t = t_at(game.u.ux, game.u.uy);
        if (t && t.tseen) {
            switch (t.ttyp) {
                /* describe something that might keep the object where it is
           or precede next message stating that it falls */
                case TRAPDOOR:
                    surf = "trap door";
                    break;
                case HOLE:
                    surf = "edge of the hole";
                    break;
                case PIT:
                case SPIKED_PIT:
                    surf = "edge of the pit";
                    break;
                default:
                    break;
            }
        }
        await pline("%s %s the %s.", await Doname2(obj), await otense(obj, verb), surf);
    }
    if (await hero_breaks(obj, game.u.ux, game.u.uy, 2)) {
        return;
    }
    if (await ship_object(obj, game.u.ux, game.u.uy, (0))) {
        return;
    }
    await dropz(obj, (1));
}
/*
 * Walk a path from src_cc to dest_cc, calling a proc for each location
 * except the starting one.  If the proc returns FALSE, stop walking
 * and return FALSE.  If stopped early, dest_cc will be the location
 * before the failed callback.
 */
export function walk_path(src_cc, dest_cc, check_proc, arg) {
    let err = 0;
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    let x_change = 0;
    let y_change = 0;
    let i = 0;
    let prev_x = 0;
    let prev_y = 0;
    let keep_going = (1);
    /* Use Bresenham's Line Algorithm to walk from src to dest.
     *
     * This should be replaced with a more versatile algorithm
     * since it handles slanted moves in a suboptimal way.
     * Going from 'x' to 'y' needs to pass through 'z', and will
     * fail if there's an obstacle there, but it could choose to
     * pass through 'Z' instead if that way imposes no obstacle.
     *     ..y          .Zy
     *     xz.    vs    x..
     * Perhaps we should check both paths and accept whichever
     * one isn't blocked.  But then multiple zigs and zags could
     * potentially produce a meandering path rather than the best
     * attempt at a straight line.  And (*check_proc)() would
     * need to work more like 'travel', distinguishing between
     * testing a possible move and actually attempting that move.
     */
    dx = dest_cc.x - src_cc.x;
    dy = dest_cc.y - src_cc.y;
    prev_x = x = src_cc.x;
    prev_y = y = src_cc.y;
    if (dx < 0) {
        x_change = -1;
        dx = -dx;
    } else {
        x_change = 1;
    }
    if (dy < 0) {
        y_change = -1;
        dy = -dy;
    } else {
        y_change = 1;
    }
    i = err = 0;
    if (dx < dy) {
        while (i++ < dy) {
            prev_x = x;
            prev_y = y;
            y += y_change;
            err += dx << 1;
            if (err > dy) {
                x += x_change;
                err -= dy << 1;
            }
            /* check for early exit condition */
            if (!(keep_going = (check_proc)(arg, x, y))) {
                break;
            }
        }
    } else {
        while (i++ < dx) {
            prev_x = x;
            prev_y = y;
            x += x_change;
            err += dy << 1;
            if (err > dx) {
                y += y_change;
                err -= dx << 1;
            }
            if (!(keep_going = (check_proc)(arg, x, y))) {
                break;
            }
        }
    }
    if (keep_going) {
        return (1);
    }
    dest_cc.x = prev_x;
    dest_cc.y = prev_y;
    return (0);
}
/* hack for hurtle_step() -- it ought to be changed to take an argument
   indicating lev/fly-to-dest vs lev/fly-to-dest-minus-one-land-on-dest
   vs drag-to-dest; original callers use first mode, jumping wants second,
   grappling hook backfire and thrown chained ball need third */
export async function hurtle_jump(arg, x, y) {
    let res = 0;
    let save_EWwalking = game.u.uprops[WWALKING].extrinsic;
    game.u.uprops[WWALKING].extrinsic |= 536870912;
    res = await hurtle_step(arg, x, y);
    game.u.uprops[WWALKING].extrinsic = save_EWwalking;
    return res;
}
/*
 * Single step for the hero flying through the air from jumping, flying,
 * etc.  Called from hurtle() and jump() via walk_path().  We expect the
 * argument to be a pointer to an integer -- the range -- which is
 * used in the calculation of points off if we hit something.
 *
 * Bumping into monsters won't cause damage but will wake them and make
 * them angry.  Auto-pickup isn't done, since you don't have control over
 * your movements at the time.
 *
 * Possible additions/changes:
 *      o really attack monster if we hit one
 *      o set stunned if we hit a wall or door
 *      o reset nomul when we stop
 *      o creepy feeling if pass through monster (if ever implemented...)
 *      o bounce off walls
 *      o let jumps go over boulders
 */
export async function hurtle_step(arg, x, y) {
    let ox = 0;
    let oy = 0;
    let range = arg;
    let obj = null;
    let mon = null;
    let may_pass = (1);
    let via_jumping = 0;
    let stopping_short = 0;
    let ttmp = null;
    let lev = null;
    let ltyp = 0;
    let dmg = 0;
    if (!isok(x, y)) {
        await You_feel("the spirits holding you back.");
        return (0);
    } else if (!await in_out_region(x, y)) {
        return (0);
    } else if (range.value == 0) {
        return (0);
    }
    via_jumping = (game.u.uprops[WWALKING].extrinsic & 536870912) != 0;
    stopping_short = (via_jumping && range.value < 2);
    lev = game.level.locations[x][y];
    ltyp = lev.typ;
    if (!(game.u.uprops[PASSES_WALLS].intrinsic || game.u.uprops[PASSES_WALLS].extrinsic) || !(may_pass = may_passwall(x, y))) {
        let why = null;
        let diagonal = (game.u.ux - x) != 0 && (game.u.uy - y) != 0;
        let open_door = ((ltyp) == DOOR) && (lev.flags & 2) != 0;
        let odoor_diag = open_door && diagonal;
        if (((game.level.locations[x][y].typ) < POOL) || closed_door(x, y) || odoor_diag) {
            why = ((ltyp) == TREE || (game.level.flags.arboreal && (ltyp) == STONE)) ? "bumping into a tree" : ((ltyp) < POOL) ? "bumping into a wall" : odoor_diag ? "bumping into a door frame" : "bumping into a closed door";
            if (odoor_diag) {
                await You("hit the door frame!");
            }
            await pline("Ouch!");
        } else if (ltyp == IRONBARS) {
            why = "crashing into iron bars";
            await You("crash into some iron bars.  Ouch!");
        } else if ((obj = sobj_at(BOULDER, x, y)) != null) {
            why = "bumping into a boulder";
            await You("bump into a %s.  Ouch!", await xname(obj));
        } else if (!may_pass) {
            /* did we hit a no-dig non-wall position? */
            why = "touching the edge of the universe";
            await You("smack into something!");
        } else if (diagonal && bad_rock(game.youmonst.data, game.u.ux, y) && bad_rock(game.youmonst.data, x, game.u.uy)) {
            let too_much = (game.invent && (inv_weight() + weight_cap() > WT_TOOMUCH_DIAGONAL));
            if (((game.youmonst.data).msize >= 3) || too_much) {
                why = "wedging into a narrow crevice";
                await You("%sget forcefully wedged into a crevice.", too_much ? "and all your belongings " : "");
            }
        }
        if (why) {
            dmg = rnd(2 + range.value);
            await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), why, 1);
            await wake_nearto(x, y, 10);
            return (0);
        }
    }
    if ((mon = (game.level.monsters[x][y])) != null) {
        let mnam = null;
        let glyph = glyph_at(x, y);
        /* wakeup() will handle mimic */
        /* undetected monster can be moved by your strike */
        mon.mundetected = 0;
        mnam = await x_monnam(mon, 2, null, ((((mon).mextra && ((mon).mextra.mgivenname)) ? 8 : 0) | 64), (0));
        if (!((((glyph) >= GLYPH_MON_MALE_OFF && (glyph) < (GLYPH_MON_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_MON_FEM_OFF && (glyph) < (GLYPH_MON_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_PET_MALE_OFF && (glyph) < (GLYPH_PET_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_PET_FEM_OFF && (glyph) < (GLYPH_PET_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_RIDDEN_MALE_OFF && (glyph) < (GLYPH_RIDDEN_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_RIDDEN_FEM_OFF && (glyph) < (GLYPH_RIDDEN_FEM_OFF + NUMMONS))) || (((glyph) >= GLYPH_DETECT_MALE_OFF && (glyph) < (GLYPH_DETECT_MALE_OFF + NUMMONS)) || ((glyph) >= GLYPH_DETECT_FEM_OFF && (glyph) < (GLYPH_DETECT_FEM_OFF + NUMMONS)))) && !((glyph) == GLYPH_INVIS_OFF)) {
            await You("find %s by bumping into %s.", mnam, (genders[pronoun_gender(mon, (1 | 2))].him));
        } else {
            await You("bump into %s.", mnam);
        }
        await wakeup(mon, (0));
        if (!(canseemon(mon) || sensemon(mon))) {
            await map_invisible(mon.mx, mon.my);
        }
        await setmangry(mon, (0));
        if (((mon.data) == game.mons[PM_COCKATRICE] || (mon.data) == game.mons[PM_CHICKATRICE]) && !game.uarmu && !game.uarm && !game.uarmc) {
            game.killer.name = sprintf(game.killer.name, "bumping into %s", await an(pmname(mon.data, NEUTRAL)));
            await instapetrify(game.killer.name);
        }
        if (((game.youmonst.data) == game.mons[PM_COCKATRICE] || (game.youmonst.data) == game.mons[PM_CHICKATRICE]) && !await which_armor(mon, 64 | 1 | 2)) {
            await minstapetrify(mon, (1));
        }
        await wake_nearto(x, y, 10);
        return (0);
    }
    if ((game.u.ux - x) && (game.u.uy - y) && bad_rock(game.youmonst.data, game.u.ux, y) && bad_rock(game.youmonst.data, x, game.u.uy)) {
        if (game.level.flags.sokoban_rules) {
            await You("come to an abrupt halt!");
            return (0);
        }
    }
    if ((game.uball != null)) {
        /* caller has already determined that dragging the ball is allowed;
       if ball is carried we might still need to drag the chain */
        let bc_control = 0;
        let ballx = 0;
        let bally = 0;
        let chainx = 0;
        let chainy = 0;
        let cause_delay = 0;
        if (await drag_ball(x, y, { get value() { return bc_control; }, set value(_v) { bc_control = _v; } }, { get value() { return ballx; }, set value(_v) { ballx = _v; } }, { get value() { return bally; }, set value(_v) { bally = _v; } }, { get value() { return chainx; }, set value(_v) { chainx = _v; } }, { get value() { return chainy; }, set value(_v) { chainy = _v; } }, { get value() { return cause_delay; }, set value(_v) { cause_delay = _v; } }, (1))) {
            await move_bc(0, bc_control, ballx, bally, chainx, chainy);
        }
    }
    ox = game.u.ux;
    oy = game.u.uy;
    await u_on_newpos(x, y);
    await newsym(ox, oy);
    await vision_recalc(1);
    await flush_screen(1);
    /* if terrain type changes, levitation or flying might become blocked
       or unblocked; might issue message, so do this after map+vision has
       been updated for new location instead of right after u_on_newpos() */
    if (ltyp != game.level.locations[ox][oy].typ) {
        await switch_terrain();
    }
    await check_special_room((0));
    if (is_pool(x, y) && !game.u.uinwater) {
        if (is_waterwall(x, y) || !(((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) || ((game.u.uprops[FLYING].intrinsic || game.u.uprops[FLYING].extrinsic || (game.u.usteed && (((game.u.usteed.data).mflags1 & 1) != 0))) && !game.u.uprops[FLYING].blocked) || ((game.u.uprops[WWALKING].intrinsic || game.u.uprops[WWALKING].extrinsic) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))))) {
            /* couldn't move while hurtling; allow movement now so that
               drown() will give a chance to crawl out of pool and survive */
            game.multi = 0;
            await drown();
            return (0);
        } else if (!(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level)))) && !stopping_short) {
            await Norep("You move over %s.", await an(is_moat(x, y) ? "moat" : "pool"));
        }
    } else if (is_lava(x, y) && !stopping_short) {
        await Norep("You move over some lava.");
    }
    if ((ttmp = t_at(x, y)) != null) {
        if (stopping_short) {
            ;
        } else if (ttmp.ttyp == MAGIC_PORTAL) {
            await dotrap(ttmp, 0);
            return (0);
        } else if (ttmp.ttyp == VIBRATING_SQUARE) {
            await pline("The ground vibrates as you pass it.");
            await dotrap(ttmp, 0);
        } else if (ttmp.ttyp == FIRE_TRAP) {
            await dotrap(ttmp, 0);
        } else if ((((ttmp.ttyp) == PIT || (ttmp.ttyp) == SPIKED_PIT) || ((ttmp.ttyp) == HOLE || (ttmp.ttyp) == TRAPDOOR)) && game.level.flags.sokoban_rules) {
            if (!via_jumping) {
                await dotrap(ttmp, 0);
            }
            range.value = 0;
            return (1);
        } else {
            if (ttmp.tseen) {
                await You("pass right over %s.", await an(trapname(ttmp.ttyp, (0))));
            }
        }
    }
    /* make sure our range never goes negative */
    if (--range.value < 0) {
        range.value = 0;
    }
    if (range.value != 0) {
        (game.windowprocs.win_delay_output)();
    }
    return (1);
}
/* used by mhurtle_step() for actual hurtling and also to vary message
   if target will/won't change location when knocked back */
export function will_hurtle(mon, x, y) {
    if (!isok(x, y)) {
        return (0);
    }
    /* redundant when called by mhurtle() but needed for mhitm_knockback() */
    if (mon.data.msize >= 4 || mon == game.u.ustuck || mon.mtrapped) {
        return (0);
    }
    /*
     * TODO: Treat walls, doors, iron bars, etc. specially
     * rather than just stopping before.
     */
    return goodpos(x, y, mon, 8 | 524288);
}
export async function mhurtle_step(arg, x, y) {
    let mon = arg;
    let mtmp = null;
    if (!isok(x, y)) {
        return (0);
    }
    if (will_hurtle(mon, x, y) && await m_in_out_region(mon, x, y)) {
        let res = 0;
        if (mon != game.u.usteed) {
            game.level.monsters[mon.mx][mon.my] = null;
            await newsym(mon.mx, mon.my);
            await place_monster(mon, x, y);
            await newsym(mon.mx, mon.my);
        } else {
            /* steed is hurtling, move hero which will also move steed */
            game.u.ux0 = game.u.ux , game.u.uy0 = game.u.uy;
            await u_on_newpos(x, y);
            await newsym(game.u.ux0, game.u.uy0);
            await vision_recalc(0);
        }
        await flush_screen(1);
        (game.windowprocs.win_delay_output)();
        set_apparxy(mon);
        if (is_waterwall(x, y)) {
            return (0);
        }
        res = await mintrap(mon, 128);
        if (res == Trap_Killed_Mon || res == Trap_Caught_Mon || res == Trap_Moved_Mon) {
            return (0);
        }
        return (1);
    }
    if ((mtmp = (game.level.monsters[x][y])) != null && mtmp != mon) {
        if (canseemon(mon) || canseemon(mtmp)) {
            await pline("%s bumps into %s.", await Monnam(mon), await a_monnam(mtmp));
        }
        await wakeup(mtmp, !game.context.mon_moving);
        if (((mtmp.data) == game.mons[PM_COCKATRICE] || (mtmp.data) == game.mons[PM_CHICKATRICE]) && !await which_armor(mon, 64 | 1 | 2)) {
            await minstapetrify(mon, !game.context.mon_moving);
            await newsym(mon.mx, mon.my);
        }
        if (((mon.data) == game.mons[PM_COCKATRICE] || (mon.data) == game.mons[PM_CHICKATRICE]) && !await which_armor(mtmp, 64 | 1 | 2)) {
            await minstapetrify(mtmp, !game.context.mon_moving);
            await newsym(mtmp.mx, mtmp.my);
        }
    } else if (((x) == game.u.ux && (y) == game.u.uy)) {
        await pline("%s bumps into you.", await Some_Monnam(mon));
        await stop_occupation();
        if ((game.u.umonnum != game.u.umonster) && ((game.youmonst.data) == game.mons[PM_COCKATRICE] || (game.youmonst.data) == game.mons[PM_CHICKATRICE]) && !await which_armor(mon, 64 | 1 | 2)) {
            await minstapetrify(mon, (1));
            await newsym(mon.mx, mon.my);
        }
        if (((mon.data) == game.mons[PM_COCKATRICE] || (mon.data) == game.mons[PM_CHICKATRICE]) && !(game.uarmu || game.uarm || game.uarmc)) {
            game.killer.name = nh_snprintf("mhurtle_step", 1061, game.killer.name, 256 /* sizeof(char [256]) */, "being hit by %s", await x_monnam(mon, mon.mtame ? 3 : 2, "hurtling", 31 | 32, (0)));
            await instapetrify(game.killer.name);
            await newsym(game.u.ux, game.u.uy);
        }
    }
    return (0);
}
/*
 * The player moves through the air for a few squares as a result of
 * throwing or kicking something.
 *
 * dx and dy should be the direction of the hurtle, not of the original
 * kick or throw.
 */
export async function hurtle(dx, dy, range, verbose) {
    let uc = { x: 0, y: 0 };
    let cc = { x: 0, y: 0 };
    if ((game.uball != null) && !((game.uball).where == 3)) {
        await You_feel("a tug from the iron ball.");
        nomul(0);
        return;
    } else if (game.u.utrap) {
        await You("are anchored by the %s.", (game.u.utraptype == TT_WEB) ? "web" : (game.u.utraptype == TT_LAVA) ? hliquid("lava") : (game.u.utraptype == TT_INFLOOR) ? surface(game.u.ux, game.u.uy) : (game.u.utraptype == TT_BURIEDBALL) ? "buried ball" : "trap");
        nomul(0);
        return;
    }
    /* make sure dx and dy are [-1,0,1] */
    /* Make sure dx and dy are [-1,0,1] */
    dx = sgn(dx);
    dy = sgn(dy);
    if (!range || (!dx && !dy) || game.u.ustuck) {
        return;
    }
    nomul(-range);
    game.multi_reason = "moving through the air";
    game.nomovemsg = "";
    if (verbose) {
        await You("%s in the opposite direction.", (range > 1) ? "hurtle" : "float");
    }
    await endmultishot((1));
    uc.x = game.u.ux;
    uc.y = game.u.uy;
    /* this setting of cc is only correct if dx and dy are [-1,0,1] only */
    cc.x = game.u.ux + (dx * range);
    cc.y = game.u.uy + (dy * range);
    walk_path(uc, cc, hurtle_step, range);
}
/* Move a monster through the air for a few squares. */
export async function mhurtle(mon, dx, dy, range) {
    let mc = { x: 0, y: 0 };
    let cc = { x: 0, y: 0 };
    await wakeup(mon, !game.context.mon_moving);
    /* At the very least, debilitate the monster */
    mon.movement = 0;
    mon.mstun = 1;
    if (mon.data.msize >= 4 || mon == game.u.ustuck || mon.mtrapped) {
        if (canseemon(mon)) {
            await pline("%s doesn't budge!", await Monnam(mon));
        }
        return;
    }
    dx = sgn(dx);
    dy = sgn(dy);
    if (!range || (!dx && !dy)) {
        return;
    }
    /* don't let grid bugs be hurtled diagonally */
    if (dx && dy && ((((mon.data).pmidx)) == PM_GRID_BUG)) {
        return;
    }
    if (mon.mundetected) {
        mon.mundetected = 0;
        await newsym(mon.mx, mon.my);
    }
    if (((mon).m_ap_type & 7)) {
        await seemimic(mon);
    }
    /* Send the monster along the path */
    mc.x = mon.mx;
    mc.y = mon.my;
    cc.x = mon.mx + (dx * range);
    cc.y = mon.my + (dy * range);
    walk_path(mc, cc, mhurtle_step, mon);
    if (!((mon).mhp < 1)) {
        if (t_at(mon.mx, mon.my)) {
            await mintrap(mon, 4);
        } else {
            await minliquid(mon);
        }
    }
    return;
}
export async function check_shop_obj(obj, x, y, broken) {
    let costly_xy = 0;
    let shkp = await shop_keeper(game.u.ushops);
    if (!shkp) {
        return;
    }
    costly_xy = await costly_spot(x, y);
    if (broken || !costly_xy || in_rooms(x, y, SHOPBASE) != game.u.ushops) {
        if (is_unpaid(obj)) {
            await stolen_value(obj, game.u.ux, game.u.uy, shkp.mpeaceful, (0));
        }
        if (broken) {
            obj.no_charge = 1;
        }
    } else if (costly_xy) {
        let oshops = in_rooms(x, y, SHOPBASE);
        if (__nh_char_at0(oshops) == game.u.ushops || __nh_char_at0(oshops) == game.u.ushops0) {
            if (is_unpaid(obj)) {
                /* ushops0: in case we threw while levitating and recoiled
           out of shop (most likely to the shk's spot in front of door) */
                let gtg = ((obj).cobj != null) ? contained_gold(obj, (1)) : 0;
                await subfrombill(obj, shkp);
                if (gtg > 0) {
                    await donate_gold(gtg, shkp, (1));
                }
            } else if (x != shkp.mx || y != shkp.my) {
                await sellobj(obj, x, y);
            }
        }
    }
}
/* Will 'obj' cause damage if it falls on hero's head when thrown upward?
   Not used to handle things which break when they hit.
   Stone missile hitting hero w/ Passes_walls attribute handled separately. */
export function harmless_missile(obj) {
    let otyp = obj.otyp;
    switch (otyp) {
        /* this list is fairly arbitrary */
        case SLING:
        case EUCALYPTUS_LEAF:
        case KELP_FROND:
        case SPRIG_OF_WOLFSBANE:
        case FORTUNE_COOKIE:
        case PANCAKE:
            return (1);
        case RUBBER_HOSE:
        case BAG_OF_TRICKS:
            return (obj.spe < 1);
        case SACK:
        case OILSKIN_SACK:
        case BAG_OF_HOLDING:
            return !((obj).cobj != null);
        default:
            if (obj.oclass == SCROLL_CLASS) {
                return (1);
            }
            /* scrolls but not all paper objs */
            if (game.objects[otyp].oc_material == CLOTH) {
                return (1);
            }
            break;
    }
    return (0);
}
/*
 * Hero tosses an object upwards with appropriate consequences.
 *
 * Returns FALSE if the object is gone.
 */
export async function toss_up(obj, hitsroof) {
    let action = null;
    let otyp = obj.otyp;
    let petrifier = ((otyp == EGG || otyp == CORPSE) && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS) && ((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE]));
    if (!has_ceiling(game.u.uz)) {
        /* into "the sky" or "the water above" */
        action = "flies up into";
    } else if (hitsroof) {
        if (breaktest(obj)) {
            await pline("%s hits the %s.", await Doname2(obj), ceiling(game.u.ux, game.u.uy));
            await breakmsg(obj, !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked));
            if (!await breakobj(obj, game.u.ux, game.u.uy, (1), (1))) {
                await hitfloor(obj, (0));
                /* bypass most of hitfloor() */
                /* now either gone or on floor */
                game.thrownobj = null;
                return (1);
            }
            return (0);
        }
        action = "hits";
    } else {
        action = "almost hits";
    }
    await pline("%s %s the %s, then falls back on top of your %s.", await Doname2(obj), action, ceiling(game.u.ux, game.u.uy), await body_part(HEAD));
    if (obj.oclass == POTION_CLASS) {
        await potionhit(game.youmonst, obj, 1);
    } else if (breaktest(obj)) {
        let blindinc = 0;
        blindinc = ((otyp == CREAM_PIE || otyp == BLINDING_VENOM) && await can_blnd(game.youmonst, game.youmonst, 254, obj)) ? rnd(25) : 0;
        await breakmsg(obj, !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked));
        if (await breakobj(obj, game.u.ux, game.u.uy, (1), (1))) {
            obj = null;
        }
        switch (otyp) {
            case EGG:
                if (petrifier && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && await polymon(PM_STONE_GOLEM))) {
                    if (game.uarmh) {
                        await Your("%s fails to protect you.", helm_simple_name(game.uarmh));
                    }
                    game.killer.format = 1;
                    game.killer.name = strcpy(game.killer.name, "elementary physics");
                    await You("turn to stone.");
                    if (obj) {
                        await dropy(obj);
                    }
                    game.thrownobj = null;
                    await done(STONING);
                    return obj ? (1) : (0);
                }
                ;
            case CREAM_PIE:
            case BLINDING_VENOM:
                await pline("You've got it all over your %s!", await body_part(FACE));
                if (blindinc) {
                    if (otyp == BLINDING_VENOM && !((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await pline("It blinds you!");
                    }
                    game.u.ucreamed += blindinc;
                    await make_blinded((game.u.uprops[BLINDED].intrinsic & 16777215) + blindinc, (0));
                    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
                        await Your("%s", c_common_strings.c_vision_clears);
                    }
                }
                break;
            default:
                break;
        }
        if (!obj) {
            return (0);
        }
        await hitfloor(obj, (0));
        game.thrownobj = null;
    } else if (harmless_missile(obj)) {
        await pline("It doesn't hurt.");
        await hitfloor(obj, (0));
        game.thrownobj = null;
    } else {
        /* neither potion nor other breaking object */
        let material = game.objects[otyp].oc_material;
        let is_silver = (material == SILVER);
        let less_damage = (hard_helmet(game.uarmh) && (!is_silver || !(game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data))));
        let harmless = (((game.objects[(obj).otyp].oc_material == GEMSTONE || (game.objects[(obj).otyp].oc_material == MINERAL)) && (obj).oclass != RING_CLASS) && ((((game.youmonst.data).mflags1 & 8) != 0) && !(((game.youmonst.data).mflags1 & 1048576) != 0)));
        let artimsg = (0);
        let dmg = await dmgval(obj, game.youmonst);
        if (obj.oartifact && !harmless) {
            artimsg = await artifact_hit(null, game.youmonst, obj, { get value() { return dmg; }, set value(_v) { dmg = _v; } }, (rn2(18) + (2)));
        }
        if (!dmg) {
            /* need a fake die roll here; rn1(18,2) avoids 1 and 20 */
            /* probably wasn't a weapon; base damage on weight */
            dmg = Math.trunc((obj.owt + (WT_TO_DMG - 1)) / WT_TO_DMG);
            dmg = (dmg <= 1) ? 1 : rnd(dmg);
            if (dmg > 6) {
                dmg = 6;
            }
            /* since obj is a non-weapon, bonuses for silver and blessed
               haven't been applied (otherwise '!dmg' test will fail when
               they're applicable here); we don't have to worry about
               dmgval()'s artifact light against gremlin or axe against
               woody creature since both involve weapons; hero-as-shade is
               hypothetical because hero can't polymorph into that form */
            if (game.youmonst.data == game.mons[PM_SHADE] && !is_silver) {
                dmg = 0;
            }
            if (obj.blessed && mon_hates_blessings(game.youmonst)) {
                dmg += rnd(4);
            }
            if (is_silver && (game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data))) {
                dmg += rnd(20);
            }
        }
        if (dmg > 1 && less_damage) {
            dmg = 1;
        }
        if (dmg > 0) {
            dmg += game.u.udaminc;
        }
        if (dmg < 0) {
            dmg = 0;
        }
        /* beware negative rings of increase damage */
        dmg = (((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg));
        if (game.uarmh) {
            if ((less_damage && dmg < ((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp)) || harmless) {
                /* helmet definitely protects you when it blocks petrification */
                if (!artimsg) {
                    if (!harmless) {
                        await pline("Fortunately, you are wearing a hard helmet.");
                    } else {
                        await pline("Unfortunately, you are wearing %s.", await an(helm_simple_name(game.uarmh)));
                    }
                }
            } else if (!petrifier) {
                if (game.flags.verbose) {
                    await Your("%s does not protect you.", helm_simple_name(game.uarmh));
                }
            }
            /* stone missile against hero in xorn form would have been
               harmless, but hitting a worn helmet negates that */
            harmless = (0);
        } else if (petrifier && !(game.u.uprops[STONE_RES].intrinsic || game.u.uprops[STONE_RES].extrinsic) && !(poly_when_stoned(game.youmonst.data) && await polymon(PM_STONE_GOLEM))) {
            petrify: {
            }
            game.killer.format = 1;
            game.killer.name = strcpy(game.killer.name, "elementary physics");
            await You("turn to stone.");
            if (obj) {
                await dropy(obj);
            }
            game.thrownobj = null;
            await done(STONING);
            return obj ? (1) : (0);
        }
        if (is_silver && (game.u.ulycn >= LOW_PM || hates_silver(game.youmonst.data))) {
            await pline_The("silver sears you!");
        }
        if (harmless) {
            await hit(await thesimpleoname(obj), game.youmonst, " but doesn't hurt.");
        }
        await hitfloor(obj, (1));
        game.thrownobj = null;
        if (!harmless) {
            await losehp(dmg, "falling object", 0);
        }
    }
    return (1);
}
/* return true for weapon meant to be thrown; excludes ammo */
export function throwing_weapon(obj) {
    return (((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART) || (obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp == P_SPEAR) || ((obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp >= P_DAGGER && game.objects[obj.otyp].oc_subtyp <= P_SABER) && !(obj.oclass == WEAPON_CLASS && game.objects[obj.otyp].oc_subtyp >= P_SHORT_SWORD && game.objects[obj.otyp].oc_subtyp <= P_SABER) && (game.objects[obj.otyp].oc_dir & 1)) || obj.otyp == WAR_HAMMER || obj.otyp == AKLYS);
}
/* the currently thrown object is returning to you (not for boomerangs) */
export async function sho_obj_return_to_u(obj) {
    if ((game.u.dx || game.u.dy) && (game.bhitpos.x != game.u.ux || game.bhitpos.y != game.u.uy)) {
        /* might already be our location (bounced off a wall) */
        let x = game.bhitpos.x - game.u.dx;
        let y = game.bhitpos.y - game.u.dy;
        await tmp_at((-4), (((obj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((obj).corpsenm + ((((obj).spe & 3) == 1) ? (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((obj).otyp == CORPSE) ? (((obj).corpsenm + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(obj).dknown && ((obj).oclass == POTION_CLASS || ((obj).otyp >= FIRST_REAL_GEM && ((obj).otyp <= LAST_GLASS_GEM)) || ((obj).otyp >= FIRST_SPELL && ((obj).otyp <= LAST_SPELL)))) ? (((obj).oclass + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((obj).otyp + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
        while (isok(x, y) && (x != game.u.ux || y != game.u.uy)) {
            await tmp_at(x, y);
            (game.windowprocs.win_delay_output)();
            x -= game.u.dx;
            y -= game.u.dy;
        }
        await tmp_at((-7), 0);
    }
}
export function throwit_return(clear_thrownobj) {
    game.iflags.returning_missile = null;
    if (clear_thrownobj) {
        game.thrownobj = null;
    }
}
export async function swallowit(obj) {
    if (obj != game.uball) {
        await mpickobj(game.u.ustuck, obj);
        throwit_return((0));
    } else {
        throwit_return((1));
    }
}
/* thrown object hits a monster.
   mon may be NULL.
   returns TRUE if shopkeeper caught the object.
   may delete object, clearing gt.thrownobj */
export async function throwit_mon_hit(obj, mon) {
    if (mon) {
        let obj_gone = 0;
        if (mon.isshk && obj.where == 4 && obj.v.v_ocarry == mon) {
            return (1);
        }
        await snuff_candle(obj);
        game.notonhead = (game.bhitpos.x != mon.mx || game.bhitpos.y != mon.my);
        obj_gone = await thitmonst(mon, obj);
        /* Monster may have been tamed; this frees old mon [obsolete] */
        mon = (game.level.monsters[game.bhitpos.x][game.bhitpos.y]);
        /* [perhaps this should be moved into thitmonst or hmon] */
        if (mon && mon.isshk && (!inside_shop(game.u.ux, game.u.uy) || !strchr(in_rooms(mon.mx, mon.my, SHOPBASE), game.u.ushops))) {
            hot_pursuit(mon);
        }
        if (obj_gone) {
            game.thrownobj = null;
        }
    }
    return (0);
}
/* throw an object, NB: obj may be consumed in the process */
/* used to re-equip returning boomerang */
/* used to restore twoweapon mode if
                          * wielded weapon returns */
/* for thrown-and-return used with !fixinv */
export async function throwit(obj, wep_mask, twoweap, oldslot) {
    let mon = null;
    let range = 0;
    let urange = 0;
    let arw = autoreturn_weapon(obj);
    let crossbowing = 0;
    let impaired = (game.u.uprops[CONFUSION].intrinsic || game.u.uprops[STUNNED].intrinsic || ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) || (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) || (game.u.uprops[FUMBLING].intrinsic || game.u.uprops[FUMBLING].extrinsic));
    let tethered_weapon = (arw && arw.tethered && (wep_mask & 256) != 0);
    /* reset potentially stale value */
    game.notonhead = (0);
    if ((obj.cursed || obj.greased) && (game.u.dx || game.u.dy) && !rn2(7)) {
        let slipok = (1);
        if ((((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
            await pline("%s!", await Tobjnam(obj, "misfire"));
        } else {
            if (obj.greased || throwing_weapon(obj)) {
                await pline("%s as you throw it!", await Tobjnam(obj, "slip"));
            /* only slip if it's greased or meant to be thrown */
            /* BUG: this message is grammatically incorrect if obj has
                   a plural name; greased gloves or boots for instance. */
            } else {
                slipok = (0);
            }
        }
        if (slipok) {
            game.u.dx = rn2(3) - 1;
            game.u.dy = rn2(3) - 1;
            if (!game.u.dx && !game.u.dy) {
                game.u.dz = 1;
            }
            impaired = (1);
        }
    }
    if ((game.u.dx || game.u.dy || (game.u.dz < 1)) && calc_capacity(obj.owt) > SLT_ENCUMBER && ((game.u.umonnum != game.u.umonster) ? (game.u.mh < 5 && game.u.mh != game.u.mhmax) : (game.u.uhp < 10 && game.u.uhp != game.u.uhpmax)) && obj.owt > (((game.u.umonnum != game.u.umonster) ? game.u.mh : game.u.uhp) * 2) && !(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level))))) {
        await You("have so little stamina, %s drops from your grasp.", await the(await xname(obj)));
        await exercise(A_CON, (0));
        game.u.dx = game.u.dy = 0;
        game.u.dz = 1;
    }
    game.thrownobj = obj;
    game.thrownobj.how_lost = 1;
    game.iflags.returning_missile = ((((wep_mask) & 256) != 0 && ((obj).otyp == AKLYS || ((obj).oartifact == ART_MJOLLNIR && (game.urole.mnum == (PM_VALKYRIE))))) || (obj).otyp == BOOMERANG) ? obj : null;
    if (game.u.uswallow) {
        if (obj == game.uball) {
            /* NOTE:  No early returns after this point or returning_missile
       will be left with a stale pointer. */
            game.uball.ox = game.uchain.ox = game.u.ux;
            game.uball.oy = game.uchain.oy = game.u.uy;
        }
        mon = game.u.ustuck;
        game.bhitpos.x = mon.mx;
        game.bhitpos.y = mon.my;
        if (tethered_weapon) {
            await tmp_at((-3), (((obj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((obj).corpsenm + ((((obj).spe & 3) == 1) ? (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((obj).otyp == CORPSE) ? (((obj).corpsenm + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(obj).dknown && ((obj).oclass == POTION_CLASS || ((obj).otyp >= FIRST_REAL_GEM && ((obj).otyp <= LAST_GLASS_GEM)) || ((obj).otyp >= FIRST_SPELL && ((obj).otyp <= LAST_SPELL)))) ? (((obj).oclass + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((obj).otyp + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
        }
    } else if (game.u.dz) {
        if (game.u.dz < 0 && game.iflags.returning_missile && !impaired) {
            await pline("%s the %s and returns to your hand!", await Tobjnam(obj, "hit"), ceiling(game.u.ux, game.u.uy));
            obj = await return_throw_to_inv(obj, wep_mask, twoweap, oldslot);
        } else if (game.u.dz < 0) {
            await toss_up(obj, rn2(5) && !(game.u.uinwater));
        } else if (game.u.dz > 0 && game.u.usteed && obj.oclass == POTION_CLASS && rn2(6)) {
            await potionhit(game.u.usteed, obj, 1);
        } else {
            await hitfloor(obj, (1));
        }
        throwit_return((1));
        return;
    } else if (obj.otyp == BOOMERANG && !(game.u.uinwater)) {
        /* have to do this after bhit() so u.ux & u.uy are correct */
        if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            await hurtle(-game.u.dx, -game.u.dy, 1, (1));
        }
        mon = await boomhit(obj, game.u.dx, game.u.dy);
        /* has returned or isn't going to */
        game.iflags.returning_missile = null;
        if (mon == game.youmonst) {
            await exercise(A_DEX, (1));
            obj = await return_throw_to_inv(obj, wep_mask, twoweap, oldslot);
            throwit_return((1));
            return;
        }
    } else {
        /* crossbow range is independent of strength */
        crossbowing = ((((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp)) && weapon_type(game.uwep) == P_CROSSBOW);
        urange = Math.trunc((crossbowing ? 18 : (acurrstr())) / 2);
        if (obj.otyp == HEAVY_IRON_BALL) {
            range = urange - (Math.trunc(obj.owt / 100));
        /* balls are easy to throw or at least roll;
         * also, this insures the maximum range of a ball is greater
         * than 1, so the effects from throwing attached balls are
         * actually possible
         */
        } else {
            range = urange - (Math.trunc(obj.owt / 40));
        }
        if (obj == game.uball) {
            if (game.u.ustuck) {
                range = 1;
            } else if (range >= 5) {
                range = 5;
            }
        }
        if (range < 1) {
            range = 1;
        }
        if (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW)) {
            if ((((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
                if (crossbowing) {
                    range = 8;
                } else {
                    range++;
                }
            } else if (obj.oclass != GEM_CLASS) {
                range = Math.trunc(range / 2);
                await pline("You aren't wielding %s, so you throw your %s by %s.", await an(skill_name(weapon_type(obj))), await weapon_descr(obj), await body_part(HAND));
            }
        }
        if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            urange -= range;
            if (urange < 1) {
                urange = 1;
            }
            range -= urange;
            if (range < 1) {
                range = 1;
            }
        }
        if (obj.otyp == BOULDER) {
            range = 20;
        } else if (is_art(obj, ART_MJOLLNIR)) {
            range = Math.trunc((range + 1) / 2);
        } else if (tethered_weapon) {
            range = ((range) < (isqrt(arw.range)) ? (range) : (isqrt(arw.range)));
        } else if (obj == game.uball && game.u.utrap && game.u.utraptype == TT_INFLOOR) {
            range = 1;
        }
        if ((game.u.uinwater)) {
            range = 1;
        }
        mon = await bhit(game.u.dx, game.u.dy, range, tethered_weapon ? THROWN_TETHERED_WEAPON : THROWN_WEAPON, null, null, obj);
        game.thrownobj = obj;
        if ((((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) || ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked)) {
            await hurtle(-game.u.dx, -game.u.dy, urange, (1));
        }
        if (!obj) {
            if (tethered_weapon) {
                await tmp_at((-7), 0);
            }
            throwit_return((0));
            return;
        }
    }
    if (await throwit_mon_hit(obj, mon)) {
        throwit_return((1));
        return;
    }
    if (!game.thrownobj) {
        if (tethered_weapon) {
            await tmp_at((-7), 0);
        }
    } else if (game.u.uswallow && !game.iflags.returning_missile) {
        await swallowit(obj);
        return;
    } else {
        if (game.iflags.returning_missile) {
            if (rn2(100)) {
                if (tethered_weapon) {
                    await tmp_at((-7), (-1));
                } else {
                    await sho_obj_return_to_u(obj);
                }
                if (!impaired && rn2(100)) {
                    await pline("%s to your hand!", await Tobjnam(obj, "return"));
                    obj = await addinv_before(obj, oldslot);
                    await encumber_msg();
                    if (obj.owornmask & 512) {
                        await setuqwep(null);
                    }
                    await setuwep(obj);
                    set_twoweap(twoweap);
                    if (((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0)) {
                        await newsym(game.bhitpos.x, game.bhitpos.y);
                    }
                } else {
                    let dmg = rn2(2);
                    if (!dmg) {
                        await pline(((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "%s lands %s your %s." : "%s back to you, landing %s your %s.", ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? c_common_strings.c_Something : await Tobjnam(obj, "return"), ((game.u.uprops[LEVITATION].intrinsic || game.u.uprops[LEVITATION].extrinsic) && !game.u.uprops[LEVITATION].blocked) ? "beneath" : "at", await makeplural(await body_part(FOOT)));
                    } else {
                        dmg += rnd(3);
                        await pline(((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "%s your %s!" : "%s back toward you, hitting your %s!", await Tobjnam(obj, ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "hit" : "fly"), await body_part(ARM));
                        if (obj.oartifact) {
                            await artifact_hit(null, game.youmonst, obj, { get value() { return dmg; }, set value(_v) { dmg = _v; } }, 0);
                        }
                        await losehp((((game.u.uprops[HALF_PHDAM].intrinsic || game.u.uprops[HALF_PHDAM].extrinsic)) ? (Math.trunc(((dmg) + 1) / 2)) : (dmg)), await killer_xname(obj), 1);
                    }
                    if (game.u.uswallow) {
                        await swallowit(obj);
                        return;
                    }
                    if (!await ship_object(obj, game.u.ux, game.u.uy, (0))) {
                        await dropy(obj);
                    }
                }
                throwit_return((1));
                return;
            } else {
                if (tethered_weapon) {
                    await tmp_at((-7), 0);
                }
                await pline("%s to return!", await Tobjnam(obj, "fail"));
                if (game.u.uswallow) {
                    await swallowit(obj);
                    return;
                }
            }
        }
        if ((!((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) == AIR || (game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) == CLOUD || ((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) >= POOL && (game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) <= DRAWBRIDGE_UP)) && breaktest(obj)) || obj.oclass == VENOM_CLASS) {
            await tmp_at((-4), (((obj).otyp == STATUE) ? (((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? ((((rn2_on_display_rng)(NUMMONS))) + ((!(rn2_on_display_rng)(2)) ? GLYPH_MON_MALE_OFF : GLYPH_MON_FEM_OFF)) : ((obj).corpsenm + ((((obj).spe & 3) == 1) ? (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_FEM_PILETOP_OFF : GLYPH_STATUE_FEM_OFF) : (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_STATUE_MALE_PILETOP_OFF : GLYPH_STATUE_MALE_OFF)))) : ((game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic))) ? (((game.otg_temp = ((rn2_on_display_rng)(NUM_OBJECTS - FIRST_OBJECT) + FIRST_OBJECT)) == CORPSE) ? (((rn2_on_display_rng)(NUMMONS)) + GLYPH_BODY_OFF) : (game.otg_temp + GLYPH_OBJ_OFF)) : ((obj).otyp == CORPSE) ? (((obj).corpsenm + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_BODY_PILETOP_OFF : GLYPH_BODY_OFF))) : (!(obj).dknown && ((obj).oclass == POTION_CLASS || ((obj).otyp >= FIRST_REAL_GEM && ((obj).otyp <= LAST_GLASS_GEM)) || ((obj).otyp >= FIRST_SPELL && ((obj).otyp <= LAST_SPELL)))) ? (((obj).oclass + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF))) : (((obj).otyp + (((obj).where == 1 && ((game.otg_otmp = game.level.objects[(obj).ox][(obj).oy].v.v_nexthere) != null) && ((obj).otyp != BOULDER || game.otg_otmp.otyp == BOULDER)) ? GLYPH_OBJ_PILETOP_OFF : GLYPH_OBJ_OFF)))));
            await tmp_at(game.bhitpos.x, game.bhitpos.y);
            (game.windowprocs.win_delay_output)();
            await tmp_at((-7), 0);
            await breakmsg(obj, ((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0));
            if (await breakobj(obj, game.bhitpos.x, game.bhitpos.y, (1), (1))) {
                throwit_return((1));
                return;
            }
        }
        if (!(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf) && !(game.u.uinwater)) {
            if (is_pool(game.bhitpos.x, game.bhitpos.y) || (is_lava(game.bhitpos.x, game.bhitpos.y) && !is_flammable(obj))) {
                ;
                await pline((await weight(obj) > WT_SPLASH_THRESHOLD) ? "Splash!" : "Plop!");
            }
        }
        if (await flooreffects(obj, game.bhitpos.x, game.bhitpos.y, "fall")) {
            throwit_return((1));
            return;
        }
        await obj_no_longer_held(obj);
        if (mon && mon.isshk && ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_PICK_AXE)) {
            if (((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0)) {
                await pline("%s snatches up %s.", await Monnam(mon), await the(await xname(obj)));
            }
            if (game.u.ushops || obj.unpaid) {
                await check_shop_obj(obj, game.bhitpos.x, game.bhitpos.y, (0));
            }
            await mpickobj(mon, obj);
            throwit_return((1));
            return;
        }
        await snuff_candle(obj);
        if (!mon && await ship_object(obj, game.bhitpos.x, game.bhitpos.y, (0))) {
            throwit_return((1));
            return;
        }
        game.thrownobj = null;
        await place_object(obj, game.bhitpos.x, game.bhitpos.y);
        if (!((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) == AIR || (game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) == CLOUD || ((game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) >= POOL && (game.level.locations[game.bhitpos.x][game.bhitpos.y].typ) <= DRAWBRIDGE_UP))) {
            await container_impact_dmg(obj, game.u.ux, game.u.uy);
            await impact_disturbs_zombies(obj, (1));
        }
        /* charge for items thrown out of shop;
           shk takes possession for items thrown into one */
        if ((game.u.ushops || obj.unpaid) && obj != game.uball) {
            await check_shop_obj(obj, game.bhitpos.x, game.bhitpos.y, (0));
        }
        await stackobj(obj);
        if (obj == game.uball) {
            await drop_ball(game.bhitpos.x, game.bhitpos.y);
        }
        if (((game.viz_array[game.bhitpos.y][game.bhitpos.x] & 2) != 0)) {
            await newsym(game.bhitpos.x, game.bhitpos.y);
        }
        if (obj_sheds_light(obj)) {
            game.vision_full_recalc = 1;
        }
    }
    throwit_return((0));
    return;
}
/* handle a throw-and-return missile coming back into inventory; makes sure
   that if it was wielded, it will be re-wielded; if it was split off of a
   stack (boomerang), don't let it merge with a different compatible stack */
/* object to add to invent */
/* its owornmask before it was removed from invent */
/* True if hero was dual-wielding before removal */
/* following item in invent in case of '!fixinv' */
export async function return_throw_to_inv(obj, wep_mask, twoweap, oldslot) {
    let otmp = null;
    if (obj.o_id == game.context.objsplit.parent_oid || obj.o_id == game.context.objsplit.child_oid) {
        /* if 'obj' is from a stack split, we can put it back by undoing split
       so there's no chance of merging with some other compatible stack */
        obj.nobj = game.invent;
        game.invent = obj;
        obj.where = 3;
        otmp = await unsplitobj(obj);
        if (!otmp) {
            game.invent = obj.nobj;
            obj.nobj = null;
            obj.where = 0;
        } else {
            obj = otmp;
        }
    }
    if (!otmp) {
        /* if 'obj' wasn't from a stack split or if it wouldn't merge back
       (maybe new erosion damage?) then it needs to be added to invent;
       don't merge with any other stack even if there is a compatible one
       (others with similar erosion?); can't use addinv_nomerge() here */
        /* redundant unless 'oldslot' somehow went away */
        obj.nomerge = 1;
        obj = await addinv_before(obj, oldslot);
        obj.nomerge = 0;
        /* in case addinv() autoquivered */
        if ((obj.owornmask & 512) != 0 && ((obj.owornmask | wep_mask) & (256 | 1024)) != 0) {
            await setuqwep(null);
        }
        if ((wep_mask & 256) && !game.uwep) {
            await setuwep(obj);
        } else if ((wep_mask & 1024) && !game.uswapwep) {
            await setuswapwep(obj);
        } else if ((wep_mask & 512) && !game.uquiver) {
            await setuqwep(obj);
        }
        /* in case the throw ended dual-wielding, reinstate it after
           successful catch (not needed for boomerang split/unsplit) */
        if (twoweap && !game.u.twoweap) {
            set_twoweap((1));
        }
    }
    await encumber_msg();
    return obj;
}
/* an object may hit a monster; various factors adjust chance of hitting */
export async function omon_adj(mon, obj, mon_notices) {
    let tmp = 0;
    /* size of target affects the chance of hitting */
    tmp += (mon.data.msize - 2);
    if (mon.msleeping) {
        /* sleeping target is more likely to be hit */
        tmp += 2;
    }
    if (!mon.mcanmove || !mon.data.mmove) {
        /* ditto for immobilized target */
        tmp += 4;
        if (mon_notices && mon.data.mmove && !rn2(10)) {
            mon.mcanmove = 1;
            mon.mfrozen = 0;
        }
    }
    switch (obj.otyp) {
        /* some objects are more likely to hit than others */
        case HEAVY_IRON_BALL:
            if (obj != game.uball) {
                tmp += 2;
            }
            break;
        case BOULDER:
            tmp += 6;
            break;
        default:
            if (obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || obj.oclass == GEM_CLASS) {
                tmp += await hitval(obj, mon);
            }
            break;
    }
    return tmp;
}
/* thrown object misses target monster */
export async function tmiss(obj, mon, maybe_wakeup) {
    let missile = await mshot_xname(obj);
    if (!canseemon(mon) || (((mon).m_ap_type & 7) && ((mon).m_ap_type & 7) != M_AP_MONSTER)) {
        await pline("%s %s.", await The(missile), await otense(obj, "miss"));
    } else {
        await miss(missile, mon);
    }
    if (maybe_wakeup && !rn2(3)) {
        await wakeup(mon, (1));
    }
    return;
}
/* whether or not object should be destroyed when it hits its target */
export function should_mulch_missile(obj) {
    let broken = 0;
    let chance = 0;
    /* only ammo (excluding magic stones) or missiles will break */
    if (!obj || !(((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) || ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_BOOMERANG && game.objects[obj.otyp].oc_subtyp <= -P_DART)) || obj.otyp == BOOMERANG || game.objects[obj.otyp].oc_magic) {
        return (0);
    }
    /* we had been breaking 2/3 of everything unconditionally.  we still don't
       want anything to survive unconditionally, but we need ammo to stay
       around longer on average. */
    chance = 3 + ((obj).oeroded > (obj).oeroded2 ? (obj).oeroded : (obj).oeroded2) - obj.spe;
    broken = chance > 1 ? rn2(chance) : !rn2(4);
    if (obj.blessed && (game.context.mon_moving ? !rn2(3) : !rnl(4))) {
        broken = (0);
    }
    /* Flint and hard gems don't break easily */
    if (((obj.oclass == GEM_CLASS && game.objects[obj.otyp].oc_tough) || obj.otyp == FLINT) && !rn2(2)) {
        broken = (0);
    }
    return broken;
}
/*
 * Object thrown by player arrives at monster's location.
 * Return 1 if obj has disappeared or otherwise been taken care of,
 * 0 if caller must take care of it.
 * Also used for kicked objects and for polearms/grapnel applied at range.
 */
/* gt.thrownobj or gk.kickedobj or uwep */
export async function thitmonst(mon, obj) {
    let tmp = 0;
    let disttmp = 0;
    let otyp = obj.otyp;
    let hmode = 0;
    let guaranteed_hit = (game.u.uswallow && (game.u.ustuck == (mon)));
    let dieroll = 0;
    hmode = (obj == game.uwep) ? HMON_APPLIED : (obj == game.kickedobj) ? HMON_KICKED : HMON_THROWN;
    /* Differences from melee weapons:
     *
     * Dex still gives a bonus, but strength does not.
     * Polymorphed players lacking attacks may still throw.
     * There's a base -1 to hit.
     * No bonuses for fleeing or stunned targets (they don't dodge
     *    melee blows as readily, but dodging arrows is hard anyway).
     * Not affected by traps, etc.
     * Certain items which don't in themselves do damage ignore 'tmp'.
     * Distance and monster size affect chance to hit.
     */
    tmp = -1 + (game.u.uluck + game.u.moreluck) + find_mac(mon) + game.u.uhitinc + ((game.u.umonnum != game.u.umonster) ? (game.youmonst.data.mlevel) : (game.u.ulevel));
    if ((acurr(A_DEX)) < 4) {
        tmp -= 3;
    } else if ((acurr(A_DEX)) < 6) {
        tmp -= 2;
    } else if ((acurr(A_DEX)) < 8) {
        tmp -= 1;
    } else if ((acurr(A_DEX)) >= 14) {
        tmp += ((acurr(A_DEX)) - 14);
    }
    /* Modify to-hit depending on distance; but keep it sane.
     * Polearms get a distance penalty even when wielded; it's
     * hard to hit at a distance.
     */
    disttmp = 3 - distmin(game.u.ux, game.u.uy, mon.mx, mon.my);
    if (disttmp < -4) {
        disttmp = -4;
    }
    tmp += disttmp;
    if (game.uarmg && game.uwep && game.objects[game.uwep.otyp].oc_subtyp == P_BOW) {
        switch (game.uarmg.otyp) {
            /* gloves are a hindrance to proper use of bows */
            case GAUNTLETS_OF_POWER:
                tmp -= 2;
                break;
            case GAUNTLETS_OF_FUMBLING:
                tmp -= 3;
                break;
            case LEATHER_GLOVES:
            case GAUNTLETS_OF_DEXTERITY:
                break;
            default:
                await impossible("Unknown type of gloves (%d)", game.uarmg.otyp);
                break;
        }
    }
    tmp += await omon_adj(mon, obj, (1));
    if ((((mon.data).mflags2 & 128) != 0) && ((game.u.umonnum != game.u.umonster) ? ((((game.youmonst.data).mflags2 & 16) != 0)) : ((game.urace.mnum == (PM_ELF))))) {
        tmp++;
    }
    if (guaranteed_hit) {
        tmp += 1000;
    }
    if (obj.oclass == GEM_CLASS && ((mon.data).mlet == S_UNICORN && (((mon.data).mflags2 & 536870912) != 0)) && game.objects[obj.otyp].oc_material != MINERAL && !(game.uwep && game.objects[game.uwep.otyp].oc_subtyp == P_SLING)) {
        if (((mon).msleeping || !(mon).mcanmove)) {
            await tmiss(obj, mon, (0));
            return 0;
        } else if (mon.mtame) {
            await pline("%s catches and drops %s.", await Monnam(mon), await the(await xname(obj)));
            return 0;
        } else {
            await pline("%s catches %s.", await Monnam(mon), await the(await xname(obj)));
            return await gem_accept(mon, obj);
        }
    }
    if (hmode != HMON_APPLIED && ((is_quest_artifact(obj) || game.objects[obj.otyp].oc_unique || (obj.otyp == FAKE_AMULET_OF_YENDOR && !obj.known)) && mon.m_id == game.quest_status.leader_m_id)) {
        /* don't make game unwinnable if naive player throws artifact
       at leader... (kicked artifact is ok too; HMON_APPLIED could
       occur if quest artifact polearm or grapnel ever gets added) */
        /* AIS: changes to wakeup() means that it's now less inappropriate
           here than it used to be, but manual version works just as well */
        mon.msleeping = 0;
        mon.mstrategy &= ~(268435456 | 536870912);
        if (mon.mcanmove) {
            await pline("%s catches %s.", await Some_Monnam(mon), await the(await xname(obj)));
            if ((game.u.uevent.invoked && game.objects[obj.otyp].oc_unique && obj.otyp != AMULET_OF_YENDOR) || !mon.mpeaceful) {
                if (mon.mpeaceful && !(game.u.uprops[DEAF].intrinsic || game.u.uprops[DEAF].extrinsic || game.u.uroleplay.deaf)) {
                    await fully_identify_obj(obj);
                    await verbalize("%s part in this is finished.", s_suffix(await The(await xname(obj))));
                    await verbalize("We will guard it in case it is ever needed again, %s forbid.", await align_gname(game.u.ualignbase[1]));
                }
                if (game.u.ushops || obj.unpaid) {
                    await check_shop_obj(obj, mon.mx, mon.my, (0));
                }
                await mpickobj(mon, obj);
            } else {
                /* under normal circumstances, leader will say something and
                   then return the item to the hero */
                let next2u = monnear(mon, game.u.ux, game.u.uy);
                await finish_quest(obj);
                await pline("%s %s %s back to you.", await Some_Monnam(mon), (next2u ? "hands" : "tosses"), await the(await xname(obj)));
                if (!next2u) {
                    await sho_obj_return_to_u(obj);
                }
                obj = await addinv(obj);
                ((obj));
                await encumber_msg();
            }
            /* caller doesn't need to place it */
            return 1;
        }
        return 0;
    }
    dieroll = rnd(20);
    if (obj.oclass == WEAPON_CLASS || ((obj).oclass == TOOL_CLASS && game.objects[(obj).otyp].oc_subtyp != P_NONE) || obj.oclass == GEM_CLASS) {
        if (hmode == HMON_KICKED) {
            /* throwing adjustments and weapon skill bonus don't apply */
            tmp -= (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) ? 5 : 3);
        } else if (((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW)) {
            if (!(((obj.oclass == WEAPON_CLASS || obj.oclass == GEM_CLASS) && game.objects[obj.otyp].oc_subtyp >= -P_CROSSBOW && game.objects[obj.otyp].oc_subtyp <= -P_BOW) && ((game.uwep) && game.objects[(obj).otyp].oc_subtyp == -game.objects[(game.uwep).otyp].oc_subtyp))) {
                tmp -= 4;
            } else {
                tmp += game.uwep.spe - ((game.uwep).oeroded > (game.uwep).oeroded2 ? (game.uwep).oeroded : (game.uwep).oeroded2);
                tmp += await weapon_hit_bonus(game.uwep);
                if (game.uwep.oartifact) {
                    tmp += await spec_abon(game.uwep, mon);
                }
                if (((game.urace.mnum == (PM_ELF)) || (game.urole.mnum == (PM_SAMURAI))) && (!(game.u.umonnum != game.u.umonster) || (((game.youmonst.data).mflags2 & game.urace.selfmask) != 0)) && game.objects[game.uwep.otyp].oc_subtyp == P_BOW) {
                    /*
                 * Elves and Samurais are highly trained w/bows,
                 * especially their own special types of bow.
                 * Polymorphing won't make you a bow expert.
                 */
                    ++tmp;
                    if (((game.urace.mnum == (PM_ELF)) && game.uwep.otyp == ELVEN_BOW) || ((game.urole.mnum == (PM_SAMURAI)) && game.uwep.otyp == YUMI)) {
                        ++tmp;
                    }
                }
            }
        } else {
            /* thrown non-ammo or applied polearm/grapnel */
            if (otyp == BOOMERANG) {
                tmp += 4;
            } else if (throwing_weapon(obj)) {
                tmp += 2;
            } else if (obj == game.thrownobj) {
                tmp -= 2;
            }
            tmp += await weapon_hit_bonus(obj);
        }
        if (tmp >= dieroll) {
            let wasthrown = (game.thrownobj != null);
            let chopper = ((obj.oclass == WEAPON_CLASS || obj.oclass == TOOL_CLASS) && game.objects[obj.otyp].oc_subtyp == P_AXE);
            if (hmode == HMON_APPLIED) {
                /* remember weapon attribute; hmon() might destroy obj */
                /* ranged hit with wielded polearm */
                /* hmon()'s caller is expected to do this; however, hmon()
                   delivers the "hit with wielded weapon for first time"
                   gamelog message when applicable */
                game.u.uconduct.weaphit++;
            }
            if (await hmon(mon, obj, hmode, dieroll)) {
                if (mon.wormno) {
                    await cutworm(mon, game.bhitpos.x, game.bhitpos.y, chopper);
                }
            }
            await exercise(A_DEX, (1));
            /* if hero was swallowed and projectile killed the engulfer,
               'obj' got added to engulfer's inventory and then dropped,
               so we can't safely use that pointer anymore; it escapes
               the chance to be used up here... */
            if (wasthrown && !game.thrownobj) {
                return 1;
            }
            if (should_mulch_missile(obj)) {
                if (game.u.ushops || obj.unpaid) {
                    await check_shop_obj(obj, game.bhitpos.x, game.bhitpos.y, (1));
                }
                await obfree(obj, null);
                return 1;
            }
            await passive_obj(mon, obj, null);
        } else {
            await tmiss(obj, mon, (1));
            if (hmode == HMON_APPLIED) {
                await wakeup(mon, (1));
            }
        }
    } else if (otyp == HEAVY_IRON_BALL) {
        await exercise(A_STR, (1));
        if (tmp >= dieroll) {
            let was_swallowed = guaranteed_hit;
            await exercise(A_DEX, (1));
            if (!await hmon(mon, obj, hmode, dieroll)) {
                if (was_swallowed && !game.u.uswallow && obj == game.uball) {
                    return 1;
                }
            }
        } else {
            await tmiss(obj, mon, (1));
        }
    } else if (otyp == BOULDER) {
        await exercise(A_STR, (1));
        if (tmp >= dieroll) {
            await exercise(A_DEX, (1));
            await hmon(mon, obj, hmode, dieroll);
        } else {
            await tmiss(obj, mon, (1));
        }
    } else if ((otyp == EGG || otyp == CREAM_PIE || otyp == BLINDING_VENOM || otyp == ACID_VENOM) && (guaranteed_hit || (acurr(A_DEX)) > rnd(25))) {
        await hmon(mon, obj, hmode, dieroll);
        return 1;
    } else if (obj.oclass == POTION_CLASS && (guaranteed_hit || (acurr(A_DEX)) > rnd(25))) {
        await potionhit(mon, obj, 1);
        return 1;
    } else if ((((mon.data) == game.mons[PM_MONKEY] || (mon.data) == game.mons[PM_APE]) ? (obj).otyp == BANANA : ((((mon.data).mflags2 & 4194304) != 0) && (obj).oclass == FOOD_CLASS && ((mon.data).mlet != S_UNICORN || game.objects[(obj).otyp].oc_material == VEGGY || ((obj).otyp == CORPSE && (obj).corpsenm == PM_LICHEN)))) || (mon.mtame && await dogfood(mon, obj) <= ACCFOOD)) {
        if (await tamedog(mon, obj, (1))) {
            return 1;
        } else {
            await tmiss(obj, mon, (0));
            mon.msleeping = 0;
            mon.mstrategy &= ~(268435456 | 536870912);
        }
    } else if (guaranteed_hit) {
        let trail = '';
        let monname = null;
        let md = game.u.ustuck.data;
        await wakeup(mon, (1));
        if (obj.otyp == CORPSE && ((game.mons[obj.corpsenm]) == game.mons[PM_COCKATRICE] || (game.mons[obj.corpsenm]) == game.mons[PM_CHICKATRICE])) {
            if ((((md).mflags1 & 262144) != 0)) {
                await minstapetrify(game.u.ustuck, (1));
                if (!game.u.uswallow) {
                    await delobj(obj);
                    return 1;
                }
            }
        }
        trail = strcpy(trail, (dmgtype_fromattack((md), 26, 11) != null) ? " entrails" : ((md).mlet == S_VORTEX || (md) == game.mons[PM_AIR_ELEMENTAL]) ? " currents" : "");
        monname = await mon_nam(mon);
        if (trail) {
            monname = s_suffix(monname);
        }
        await pline("%s into %s%s.", await Tobjnam(obj, "vanish"), monname, trail);
    } else {
        await tmiss(obj, mon, (1));
    }
    return 0;
}
const __gem_accept_nogood = " is not interested in your junk.";
const __gem_accept_acceptgift = " accepts your gift.";
const __gem_accept_maybeluck = " hesitatingly";
const __gem_accept_noluck = " graciously";
const __gem_accept_addluck = " gratefully";
export async function gem_accept(mon, obj) {
    let buf = '';
    let is_buddy = 0;
    let is_gem = 0;
    let ret = 0;
    nopick: {
        is_buddy = sgn(mon.data.maligntyp) == sgn(game.u.ualign.type);
        is_gem = game.objects[obj.otyp].oc_material == GEMSTONE;
        ret = 0;
        buf = strcpy(buf, await Monnam(mon));
        mon.mpeaceful = 1;
        mon.mavenge = 0;
        if (obj.dknown && game.objects[obj.otyp].oc_name_known) {
            /* value completely unknown to @ */
            if (is_gem) {
                if (is_buddy) {
                    buf = strcat(buf, __gem_accept_addluck);
                    /* object properly identified */
                    change_luck(5);
                } else {
                    buf = strcat(buf, __gem_accept_maybeluck);
                    change_luck(rn2(7) - 3);
                }
            } else {
                buf = strcat(buf, __gem_accept_nogood);
                break nopick;
            }
        } else if (((obj).oextra && ((obj).oextra.oname)) || game.objects[obj.otyp].oc_uname) {
            if (is_gem) {
                if (is_buddy) {
                    buf = strcat(buf, __gem_accept_addluck);
                    change_luck(2);
                } else {
                    buf = strcat(buf, __gem_accept_maybeluck);
                    change_luck(rn2(3) - 1);
                }
            } else {
                buf = strcat(buf, __gem_accept_nogood);
                break nopick;
            }
        } else {
            if (is_gem) {
                if (is_buddy) {
                    buf = strcat(buf, __gem_accept_addluck);
                    change_luck(1);
                } else {
                    buf = strcat(buf, __gem_accept_maybeluck);
                    change_luck(rn2(3) - 1);
                }
            } else {
                buf = strcat(buf, __gem_accept_noluck);
            }
        }
        buf = strcat(buf, __gem_accept_acceptgift);
        if (game.u.ushops || obj.unpaid) {
            await check_shop_obj(obj, mon.mx, mon.my, (1));
        }
        await mpickobj(mon, obj);
        ret = 1;
    }
    if (!((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked)) {
        await pline("%s", buf);
    }
    if (!await tele_restrict(mon)) {
        await rloc(mon, 2);
    }
    return ret;
}
/*
 * Comments about the restructuring of the old breaks() routine.
 *
 * There are now three distinct phases to object breaking:
 *     breaktest() - which makes the check/decision about whether the
 *                   object is going to break.
 *     breakmsg()  - which outputs a message about the breakage,
 *                   appropriate for that particular object. Should
 *                   only be called after a positive breaktest().
 *                   on the object and, if it going to be called,
 *                   it must be called before calling breakobj().
 *                   Calling breakmsg() is optional.
 *     breakobj()  - which actually does the breakage and the side-effects
 *                   of breaking that particular object. This should
 *                   only be called after a positive breaktest() on the
 *                   object.
 *
 * Each of the above routines is currently static to this source module.
 * There are two routines callable from outside this source module which
 * perform the routines above in the correct sequence.
 *
 *   hero_breaks() - called when an object is to be broken as a result
 *                   of something that the hero has done. (throwing it,
 *                   kicking it, etc.)
 *   breaks()      - called when an object is to be broken for some
 *                   reason other than the hero doing something to it.
 */
/*
 * The hero causes breakage of an object (throwing, dropping it, etc.)
 * Return 0 if the object didn't break, 1 if the object broke.
 */
/* object location (ox, oy may not be right) */
export async function hero_breaks(obj, x, y, breakflags) {
    /* from_invent: thrown or dropped by player; maybe on shop bill;
       by-hero is implicit so callers don't need to specify BRK_BY_HERO */
    let from_invent = (breakflags & 2) != 0;
    let in_view = ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? (0) : (from_invent || ((game.viz_array[y][x] & 2) != 0));
    let brk = (breakflags & (4 | 8));
    /* only call breaktest if caller hasn't already specified the outcome */
    if (!brk) {
        brk = breaktest(obj) ? 4 : 8;
    }
    if (brk == 8) {
        return 0;
    }
    await breakmsg(obj, in_view);
    return await breakobj(obj, x, y, (1), from_invent);
}
/*
 * The object is going to break for a reason other than the hero doing
 * something to it.
 * Return 0 if the object doesn't break, 1 if the object broke.
 */
/* object location (ox, oy may not be right) */
export async function breaks(obj, x, y) {
    let in_view = ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? (0) : ((game.viz_array[y][x] & 2) != 0);
    if (!breaktest(obj)) {
        return 0;
    }
    await breakmsg(obj, in_view);
    return await breakobj(obj, x, y, (0), (0));
}
export async function release_camera_demon(obj, x, y) {
    let mtmp = null;
    if (!rn2(3) && (mtmp = await makemon(game.mons[rn2(3) ? PM_HOMUNCULUS : PM_IMP], x, y, 131072)) != null) {
        if ((canseemon(mtmp) || sensemon(mtmp))) {
            await pline("%s is released!", (game.u.uprops[HALLUC].intrinsic && !(game.u.uprops[HALLUC_RES].intrinsic || game.u.uprops[HALLUC_RES].extrinsic)) ? await An(await rndmonnam(null)) : "The picture-painting demon");
        }
        mtmp.mpeaceful = !obj.cursed;
        set_malign(mtmp);
    }
}
/*
 * Break an object.  Breakable armor goes through erosion steps; other
 * items break unconditionally.  Assumes all resistance checks
 * and break messages have been delivered prior to getting here.
 * (No longer true; breakmsg() is silent for crackable armor and we
 * call erode_obj() for it and that delivers a damaged-the-item message.)
 */
/* object location (ox, oy may not be right) */
/* is this the hero's fault? */
export async function breakobj(obj, x, y, hero_caused, from_invent) {
    let fracture = (0);
    let explosion = (0);
    /* if erodeproof, erode_obj() will say so */
    /* breakobj() will call erode_obj() for message */
    if ((game.objects[(obj).otyp].oc_material == GLASS && (obj).oclass == ARMOR_CLASS)) {
        return (await erode_obj(obj, await armor_simple_name(obj), 4, 2 | 4) == 3);
    }
    switch (obj.oclass == POTION_CLASS ? POT_WATER : obj.otyp) {
        case MIRROR:
            if (hero_caused) {
                change_luck(-2);
            }
            break;
        case POT_WATER:
            obj.in_use = 1;
            if (obj.otyp == POT_OIL && obj.lamplit) {
                await explode_oil(obj, x, y);
            } else if ((dist2(((x)), ((y)), game.u.ux, game.u.uy) <= 2)) {
                if (!(((game.youmonst.data).mflags1 & 1024) != 0) || (((game.youmonst.data).mflags1 & 4096) == 0)) {
                    if (obj.otyp != POT_WATER && !(game.ublindf && game.ublindf.otyp == TOWEL && game.ublindf.spe > 0)) {
                        if (!(((game.youmonst.data).mflags1 & 1024) != 0)) {
                            await You("smell a peculiar odor...");
                        } else {
                            let eyes = await body_part(EYE);
                            if ((!(((game.youmonst.data).mflags1 & 4096) == 0) ? 0 : ((game.youmonst.data) == game.mons[PM_CYCLOPS] || (game.youmonst.data) == game.mons[PM_FLOATING_EYE]) ? 1 : 2) != 1) {
                                eyes = await makeplural(eyes);
                            }
                            await Your("%s %s.", eyes, await vtense(eyes, "water"));
                        }
                    }
                    await potionbreathe(obj);
                }
            }
            break;
        case EXPENSIVE_CAMERA:
            await release_camera_demon(obj, x, y);
            break;
        case EGG:
            if (hero_caused && obj.spe && ((obj.corpsenm) >= LOW_PM && (obj.corpsenm) < NUMMONS)) {
                change_luck(-((obj.quan) < (5) ? (obj.quan) : (5)));
            }
            if (obj.corpsenm == PM_PYROLISK) {
                explosion = (1);
            }
            break;
        case BOULDER:
        case STATUE:
            fracture = (1);
            break;
        default:
            break;
    }
    if (hero_caused) {
        if (from_invent || obj.unpaid) {
            if (game.u.ushops || obj.unpaid) {
                await check_shop_obj(obj, x, y, (1));
            }
        } else if (!obj.no_charge && await costly_spot(x, y)) {
            /* it is assumed that the obj is a floor-object */
            let o_shop = in_rooms(x, y, SHOPBASE);
            let shkp = await shop_keeper(__nh_char_at0(o_shop));
            if (shkp) {
                /* (implies *o_shop != '\0') */
                let eshkp = ((shkp).mextra.eshk);
                /* base shk actions on her peacefulness at start of
                   this turn, so that "simultaneous" multiple breakage
                   isn't drastically worse than single breakage */
                if (game.hero_seq != eshkp.break_seq) {
                    eshkp.seq_peaceful = shkp.mpeaceful;
                }
                if ((await stolen_value(obj, x, y, eshkp.seq_peaceful, (0)) > 0) && (__nh_char_at0(o_shop) != game.u.ushops[0] || !inside_shop(game.u.ux, game.u.uy)) && game.hero_seq != eshkp.break_seq) {
                    await make_angry_shk(shkp, x, y);
                }
                /* make_angry_shk() is only called on the first instance
                   of breakage during any particular hero move */
                eshkp.break_seq = game.hero_seq;
            }
        }
    }
    if (!fracture) {
        await delobj(obj);
    }
    if (explosion) {
        await explode(x, y, -11, d(3, 6), 0, EXPL_FIERY);
    }
    return 1;
}
/*
 * Check to see if obj (which has just hit hard something at speed, e.g.
 * thrown or dropped from height) is going to break, but don't actually
 * break it. Return 0 if the object isn't going to break, 1 if it is.
 */
export function breaktest(obj) {
    /* chance for non-artifacts to resist */
    let nonbreakchance = 1;
    /* this may need to be changed if actual glass armor gets added someday;
       for now, it affects crystal plate mail and helm of brilliance;
       either of them will have to be cracked 4 times before breaking */
    if (obj.oclass == ARMOR_CLASS && game.objects[obj.otyp].oc_material == GLASS) {
        nonbreakchance = 90;
    }
    if (obj_resists(obj, nonbreakchance, 99)) {
        return (0);
    }
    if (game.objects[obj.otyp].oc_material == GLASS && !obj.oartifact && obj.oclass != GEM_CLASS) {
        return (1);
    }
    switch (obj.oclass == POTION_CLASS ? POT_WATER : obj.otyp) {
        case EXPENSIVE_CAMERA:
        case POT_WATER:
        case EGG:
        case CREAM_PIE:
        case MELON:
        case ACID_VENOM:
        case BLINDING_VENOM:
            return (1);
        default:
            return (0);
    }
}
export async function breakmsg(obj, in_view) {
    let to_pieces = null;
    if ((game.objects[(obj).otyp].oc_material == GLASS && (obj).oclass == ARMOR_CLASS)) {
        return;
    }
    to_pieces = "";
    switch (obj.oclass == POTION_CLASS ? POT_WATER : obj.otyp) {
        default:
            if (obj.oclass != WAND_CLASS) {
                await impossible("breaking odd object (%d)?", obj.otyp);
            }
            ;
        case LENSES:
        case MIRROR:
        case CRYSTAL_BALL:
        case EXPENSIVE_CAMERA:
            to_pieces = " into a thousand pieces";
            ;
        case POT_WATER:
            if (!in_view) {
                await You_hear("%s shatter!", c_common_strings.c_something);
            } else {
                await pline("%s shatter%s%s!", await Doname2(obj), (obj.quan == 1) ? "s" : "", to_pieces);
            }
            break;
        case EGG:
        case MELON:
            await pline("Splat!");
            break;
        case CREAM_PIE:
            if (in_view) {
                await pline("What a mess!");
            }
            break;
        case ACID_VENOM:
        case BLINDING_VENOM:
            await pline("Splash!");
            break;
    }
}
export async function throw_gold(obj) {
    let range = 0;
    let odx = 0;
    let ody = 0;
    let mon = null;
    if (!game.u.dx && !game.u.dy && !game.u.dz) {
        await You("cannot throw gold at yourself.");
        /* If we tried to throw part of a stack, force it to merge back
           together (same as in throw_obj).  Essential for gold. */
        if (obj.o_id == game.context.objsplit.parent_oid || obj.o_id == game.context.objsplit.child_oid) {
            await unsplitobj(obj);
        }
        return 2;
    }
    await freeinv(obj);
    if (game.u.uswallow) {
        let swallower = await mon_nam(game.u.ustuck);
        if ((dmgtype_fromattack((game.u.ustuck.data), 26, 11) != null)) {
            swallower = strcat(s_suffix(swallower), " entrails");
        }
        await pline_The("gold disappears into %s.", swallower);
        await add_to_minv(game.u.ustuck, obj);
        return 1;
    }
    if (game.u.dz) {
        if (game.u.dz < 0 && !(((((game.dungeon_topology.d_air_level)).dlevel || ((game.dungeon_topology.d_air_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_air_level)))) && !(game.u.uinwater) && !(((((game.dungeon_topology.d_water_level)).dlevel || ((game.dungeon_topology.d_water_level)).dnum) && on_level(game.u.uz, (game.dungeon_topology.d_water_level))))) {
            await pline_The("gold hits the %s, then falls back on top of your %s.", ceiling(game.u.ux, game.u.uy), await body_part(HEAD));
            if (game.uarmh) {
                await pline("Fortunately, you are wearing %s!", await an(helm_simple_name(game.uarmh)));
            }
        }
        game.bhitpos.x = game.u.ux;
        game.bhitpos.y = game.u.uy;
    } else {
        /* consistent with range for normal objects */
        range = (Math.trunc(((acurrstr())) / 2) - Math.trunc(obj.owt / 40));
        /* see if the gold has a place to move into */
        odx = game.u.ux + game.u.dx;
        ody = game.u.uy + game.u.dy;
        if (!isok(odx, ody) || !((game.level.locations[odx][ody].typ) >= POOL) || closed_door(odx, ody)) {
            game.bhitpos.x = game.u.ux;
            game.bhitpos.y = game.u.uy;
        } else {
            mon = await bhit(game.u.dx, game.u.dy, range, THROWN_WEAPON, null, null, obj);
            if (!obj) {
                return 1;
            }
            if (mon) {
                if (await ghitm(mon, obj)) {
                    return 1;
                }
            } else {
                if (await ship_object(obj, game.bhitpos.x, game.bhitpos.y, (0))) {
                    return 1;
                }
            }
        }
    }
    if (await flooreffects(obj, game.bhitpos.x, game.bhitpos.y, "fall")) {
        return 1;
    }
    if (game.u.dz > 0) {
        await pline_The("gold hits the %s.", surface(game.bhitpos.x, game.bhitpos.y));
    }
    await place_object(obj, game.bhitpos.x, game.bhitpos.y);
    if (game.u.ushops) {
        await sellobj(obj, game.bhitpos.x, game.bhitpos.y);
    }
    await stackobj(obj);
    await newsym(game.bhitpos.x, game.bhitpos.y);
    return 1;
}
/*dothrow.c*/
/* give bonus for low-tech gear */
/* allow higher volley count despite skill limitation */
/* arbitrary; encourage use of other missiles beside daggers */
/* possibly should add knives... */
/* role-specific launcher and its ammo */
/*
     * Throwing gold is usually for getting rid of it when
     * a leprechaun approaches, or for bribing an oncoming
     * angry monster.  So throw the whole object.
     *
     * If the gold is in quiver, throw one coin at a time,
     * possibly using a sling.
     */
/* throw_gold will unsplit the stack itself if necessary and may have
           freed the object, so don't route through unsplit_stack here */
/* throwing with one hand, but pluralize since the
               expression "with your bare hands" sounds better */
/* arbitrary; there isn't any gnome-specific gear */
/* give a message if shooting more than one, or if player
       attempted to specify a count */
/* "You shoot N arrows." or "You throw N daggers." */
/* m_shot.i <= m_shot.n guarantees this */
/* split this object off from its slot if necessary */
/* to get here, obj is boomerang or is uwep and (alkys or Mjollnir) */
/*
     * Since some characters shoot multiple missiles at one time,
     * allow user to specify a count prefix for 'f' or 't' to limit
     * number of items thrown (to avoid possibly hitting something
     * behind target after killing it, or perhaps to conserve ammo).
     *
     * Prior to 3.3.0, command ``3t'' meant ``t(shoot) t(shoot) t(shoot)''
     * and took 3 turns.  Now it means ``t(shoot at most 3 missiles)''.
     *
     * [3.6.0:  shot count setup has been moved into ok_to_throw().]
     */
/* it is also possible to throw food */
/* (or jewels, or iron balls... ) */
/* unknown-BUC; used if no known-BU item found */
/*
     * Same as dothrow(), except we use quivered missile instead
     * of asking what to throw/shoot.  [Note: with the advent of
     * fireassist that is no longer accurate...]
     *
     * If hero is wielding a thrown-and-return weapon and quiver
     * is empty or contains ammo, use the wielded weapon (won't
     * have any ammo's launcher wielded due to the weapon).
     * If quiver is empty, use autoquiver to fill it when the
     * corresponding option is on.
     * If option is off or autoquiver doesn't select anything,
     * we ask what to throw.
     * Then we put the chosen item into the quiver slot unless
     * it is already in another slot.  [Matters most if it is a
     * stack but also matters for single item if this throw gets
     * aborted (ESC at the direction prompt).]
     */
/* if we're wielding a polearm, apply it */
/* if we're wielding a bullwhip, apply it */
/* this gives its own feedback about populating the quiver slot */
/* prevent jumping over water from being placed in that water */
/* after unhiding; combination of a_monnam() and some_mon_nam();
           yields "someone" or "something" instead of "it" for unseen mon */
/* we can't include these two exceptions unless we know we're
         * going to end up past the current spot rather than on it;
         * for that, we need to know that the range is not exhausted
         * and also that the next spot doesn't contain an obstacle */
/* this is a bodily collision, so check for body armor */
/* set u.<ux,uy>, u.usteed-><mx,my>; cliparound(); */
/* might be entering a special room (treasure zoo, thrown room, &c) that
       has a first-time entry message, or leaving shop with unpaid goods */
/* FIXME:
     * Each trap should really trigger on the recoil if it would
     * trigger during normal movement. However, not all the possible
     * side-effects of this are tested [as of 3.4.0] so we trigger
     * those that we have tested, and offer a message for the ones
     * that we have not yet tested.
     */
/* see the comment above hurtle_jump() */
/* air currents overcome the recoil in Sokoban;
               when jumping, caller performs last step and enters trap */
/* new location => different lines of sight */
/* check whether 'mon' is turned to stone by touching 'mtmp' */
/* and whether 'mtmp' is turned to stone by being touched by 'mon' */
/* a monster has caused 'mon' to hurtle against hero */
/* check whether 'mon' is turned to stone by touching poly'd hero */
/* give poly'd hero credit/blame despite a monster causing it */
/* and whether hero is turned to stone by being touched by 'mon' */
/* combine m_monnam() and noname_monnam():
                        "{your,a} hurtling cockatrice" w/o assigned name */
/* The chain is stretched vertically, so you shouldn't be able to move
     * very far diagonally.  The premise that you should be able to move one
     * spot leads to calculations that allow you to only move one spot away
     * from the ball, if you are levitating over the ball, or one spot
     * towards the ball, if you are at the end of the chain.  Rather than
     * bother with all of that, assume that there is no slack in the chain
     * for diagonal movement, give the player a message and return.
     */
/* if we're in the midst of shooting multiple projectiles, stop */
/* Is the monster stuck or too heavy to push?
     * (very large monsters have too much inertia, even floaters and flyers)
     */
/* thrown out of a shop or into a different shop */
/* crackable armor will return True for breaktest() but will
               usually return False for breakobj() */
/* need to check for blindness result prior to destroying obj */
/* AT_WEAP is ok here even if attack type was AT_SPIT */
/* egg ends up "all over your face"; perhaps
                   visored helmet should still save you here */
/* 'obj' still exists, so drop it and return True */
/* note: 'harmless' and 'petrifier' are mutually exclusive */
/* !harmless => less_damage here */
/* daggers and knife (excludes scalpel) */
/* special cases [might want to add AXE] */
/* Mjollnir must we wielded to be thrown--caller verifies this;
               aklys must we wielded as primary to return when thrown */
/* alternative to prayer or wand of opening/spell of knock
               for dealing with cursed saddle:  throw holy water > */
/* range of a tethered_weapon is limited by the
               length of the attached cord [implicit aspect of item] */
/* bhit display cleanup was left with this caller
               for tethered_weapon, but clean it up now since
               we're about to return */
/* missile has already been handled */
/* Mjollnir must be wielded to be thrown--caller verifies this;
           aklys must be wielded as primary to return when thrown */
/* addinv autoquivers an aklys if quiver is empty;
                       if obj is quivered, remove it before wielding */
/* when this location is stepped on, the weapon will be
                   auto-picked up due to 'obj->how_lost' of LOST_THROWN;
                   addinv() prevents thrown Mjollnir from being placed
                   into the quiver slot, but an aklys will end up there if
                   that slot is empty at the time; since hero will need to
                   explicitly rewield the weapon to get throw-and-return
                   capability back anyway, quivered or not shouldn't matter */
/* continue below with placing 'obj' at target location */
/* venom [via #monster to spit while poly'd] fails breaktest()
               but we want to force breakage even when location IS_SOFT() */
/* Some sound effects when item lands in water or lava */
/* container contents might break;
           do so before turning ownership of gt.thrownobj over to shk
           (container_impact_dmg handles item already owned by shop) */
/* <x,y> is spot where you initiated throw, not gb.bhitpos */
/* If the target can't be seen or doesn't look like a valid target,
       avoid "the arrow misses it," or worse, "the arrows misses the mimic."
       An attentive player will still notice that this is different from
       an arrow just landing short of any target (no message in that case),
       so will realize that there is a valid target here anyway. */
/* throwing real gems to co-aligned unicorns boosts Luck,
       to cross-aligned unicorns changes Luck by random amount;
       throwing worthless glass doesn't affect Luck but doesn't anger them;
       5.0: treat rocks and gray stones as attacks rather than like glass
       and also treat gems or glass shot via sling as attacks */
/* leader will keep tossed invocation item after you've done the
               invocation and it's become unnecessary for completion.. */
/* ...or any special item, if you've made him angry */
/* give an explanation for keeping the item only if leader is
                   not doing it out of anger */
/* just in case, identify the object so its name will
                       appear in the message */
/* acknowledge quest completion */
/* back into your inventory */
/* we know we're dealing with a weapon or weptool handled
               by WEAPON_SKILLS once ammo objects have been excluded */
/* projectiles other than magic stones sometimes disappear
               when thrown; projectiles aren't among the types of weapon
               that hmon() might have destroyed so obj is intact */
/* this assumes that guaranteed_hit is due to swallowing */
/* Don't leave a cockatrice corpse available in a statue */
/* wet towel protects both eyes and breathing */
/* [what about "familiar odor" when known?] */
/* breaking your own eggs is bad luck */
/* note: s_suffix() returns a modifiable buffer */
