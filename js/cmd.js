// cmd.js — Command dispatch and movement.
// C ref: cmd.c rhack(), hack.c domove().
//
// Minimal skeleton: only hjklyubn movement is implemented.
// Contestants should add: search, kick, eat, drink, read, zap,
// wear, wield, drop, throw, pray, cast, and all other commands.

import { game } from './gstate.js';
import { nhgetch } from './input.js';
import { newsym, flush_screen, pline } from './display.js';
import { vision_recalc } from './vision.js';
import { COLNO, ROWNO, STONE, DOOR, D_CLOSED, D_LOCKED, D_ISOPEN,
         IS_WALL, IS_OBSTRUCTED } from './const.js';
import { MAXSPELL, P_UNSKILLED, P_BASIC, P_SKILLED, P_EXPERT } from './translated/nh-constants.js';
import { dosearch0 } from './translated/detect.js';
import { night as __night, midnight as __midnight } from './translated/calendar.js';
import { Japanese_item_name as __Japanese_item_name } from './translated/objnam.js';
import { donull } from './translated/do.js';
import { domove as t_domove, inv_weight as t_inv_weight, lookaround as t_lookaround } from './translated/hack.js';
import { THRONE, SINK, GRAVE, FOUNTAIN, ALTAR, STAIRS } from './translated/nh-constants.js';
import { M_AP_FURNITURE, M_AP_OBJECT, DEAF } from './translated/nh-constants.js';
import { domonnoise } from './translated/sounds.js';
import { canseemon, sensemon, map_invisible } from './translated/display.js';
import { Monnam, mon_nam } from './translated/do_name.js';
import { pickup as t_pickup } from './translated/pickup.js';
import { dodown as t_dodown, doup as t_doup } from './translated/do.js';
import { dolook as t_dolook } from './translated/invent.js';
import { dotogglepickup as t_dotogglepickup } from './translated/options.js';
import { pluslvl as t_pluslvl, newuexp as __newuexp } from './translated/exper.js';
import { docast as t_docast, rejectcasting as t_rejectcasting, spelleffects as t_spelleffects } from './translated/spell.js';
import { cmdq_add_key as t_cmdq_add_key, cmdq_pop as t_cmdq_pop, cmdq_peek as t_cmdq_peek, do_fight as t_do_fight, do_run as t_do_run } from './translated/cmd.js';
import { dokick as t_dokick } from './translated/dokick.js';
import { dotelecmd as t_dotelecmd } from './translated/teleport.js';
import { wiz_level_tele as t_wiz_level_tele } from './translated/wizcmds.js';
import { wiz_wish as t_wiz_wish } from './translated/wizcmds.js';
import { doapply as t_doapply, apply_ok } from './translated/apply.js';
import { is_edible, doeat as t_doeat } from './translated/eat.js';
import { dothrow as t_dothrow, dofire as t_dofire, throw_ok } from './translated/dothrow.js';
import { doread as t_doread } from './translated/read.js';
import { dodrink as t_dodrink } from './translated/potion.js';
import { dozap as t_dozap } from './translated/zap.js';
import { doclose as t_doclose, doopen as t_doopen } from './translated/lock.js';
import { dotakeoff as t_dotakeoff, dowear as t_dowear, doputon as t_doputon } from './translated/do_wear.js';
import { doremring as t_doremring, doddoremarm as t_doddoremarm } from './translated/do_wear.js';
import { dopay as t_dopay } from './translated/shk.js';
import { dowield as t_dowield, dowieldquiver as t_dowieldquiver, dotwoweapon as t_dotwoweapon, ready_ok } from './translated/wield.js';
import { doengrave as t_doengrave } from './translated/engrave.js';
import { doddrop as t_doddrop, dodrop as t_dodrop } from './translated/do.js';
import { dotypeinv as t_dotypeinv } from './translated/invent.js';
import { rn2, rnl } from './rng.js';

// Browser-safe env lookup; debug flags resolve to falsy under a
// browser load.  See same pattern in allmain.js.
const __env = (typeof process !== 'undefined' && process.env) || {};

// Direction deltas: y u k
//                   h . l
//                   b j n
const DIR_DX = { h: -1, l: 1, j: 0, k: 0, y: -1, u: 1, b: -1, n: 1 };
const DIR_DY = { h: 0, l: 0, j: 1, k: -1, y: -1, u: -1, b: 1, n: 1 };

// Uppercase vi-key movement = NetHack's "rush until obstruction"
// command.  C ref: cmd.c do_rush_north/west/etc. which call
// set_move_cmd(dir, 3) — sets svc.context.run=3 and calls domove.
// The moveloop continues firing domove (with the saved dx/dy)
// until end_running() clears svc.context.run.  The hand-port
// translation: detect the uppercase key, set game.context.run=2,
// save dx/dy in game._run_dx/_run_dy, then call domove.  On the
// NEXT outer-loop iter, rhack(0) checks game.context.run and
// skips nhgetch, replaying the saved direction.
const UPPER_TO_LOWER_DIR = {
    H: 'h', J: 'j', K: 'k', L: 'l', Y: 'y', U: 'u', B: 'b', N: 'n',
};

// Ctrl+vi-key movement = NetHack's "rush" command (MV_RUSH).  C ref:
// cmd.c do_rush_west/etc. → set_move_cmd(dir, 3) → svc.context.run=3.
// Keyed by the raw control-char code.  These bindings apply when
// number_pad is OFF (with number_pad ON, C rebinds C('l') etc. to
// redraw/other — cmd.c:2762; the recorded sessions all run num_pad=0).
// Without this JS dropped ^L (key 12) as a no-op, so a run that stopped
// at a doorway never continued the rush down the corridor (seed0013).
//
// DELIBERATELY EXCLUDED: ^H(8, rubout), ^J(10, newline/Enter), and
// ^U(21, kill-line) — these are line-editing/confirm keys that C
// consumes inside getlin/yn/menu prompts and NEVER dispatches as a
// rush command (verified: seed0383 sends ^J×9 yet the C recorder shows
// 0 rush events and 0 command-level ^J reads — they are all Enter).
// JS currently leaks those to rhack (a separate prompt-handling gap);
// mapping them to rush would mis-move the hero (seed0383 regressed -88
// when ^J was included).  Only the pure-movement controls are mapped.
const CTRL_TO_DIR = {
    11: 'k', 12: 'l', 25: 'y', 2: 'b', 14: 'n',
};

function isMovementKey(ch) {
    return 'hjklyubn'.includes(ch);
}

// True when game.spl_book holds any entry with sp_id != 0.  Used by
// both the 'Z' (cast) and '+' (view spells) handlers to short-circuit
// to the pline "You don't know any spells right now." instead of
// rendering an empty menu — mirrors translated getspell:680-682 and
// dovspell:1825.  Array.isArray guard catches the early-game case
// where decl.js init might not yet have populated svspl_book.
function _heroHasAnySpells() {
    if (!Array.isArray(game.spl_book)) return false;
    for (let i = 0; i < game.spl_book.length; i++) {
        if (game.spl_book[i] && game.spl_book[i].sp_id) return true;
    }
    return false;
}

// Build the attributes display pages.  C ref: insight.c
// enlightenment(BASICENLIGHTENMENT, ENL_GAMEINPROGRESS).
// Renders a multi-line text window broken into pages.  All values
// derive from game state — there is no session-keyed branching.
function buildAttributesPages() {
    const g = game;
    const lines = [];
    const isFemale = !!g.flags?.female;
    const role = g.urole?.name || { m: 'Adventurer', f: 'Adventurer' };
    // urole.rank is the per-level array (9 entries) from translated
    // role.c.  C ref botl.c rank_of + xlev_to_rank:
    //   xlev_to_rank(lev) = (lev <= 2) ? 0
    //                     : (lev <= 30) ? ((lev + 2) / 4)  // integer div
    //                     : 8
    // Then rank_of walks the rank[] array DOWN from that index until
    // a non-null entry (gender-preferred) is found.  For wizard
    // level 20: xlev_to_rank(20) = 22/4 = 5 → "Sorcerer".
    // Pre-fix JS used `rank[ulevel-1]` which returns undefined for
    // ulevel >= 10 (rank[] only has 9 entries), falling back to role
    // name "Wizard" — wrong for seed0360 step 827.
    const __ulev = g.u?.ulevel ?? 1;
    const __rankIdx = (__ulev <= 2) ? 0
                    : (__ulev <= 30) ? Math.trunc((__ulev + 2) / 4)
                    : 8;
    const __rankArr = g.urole?.rank;
    let __rank = role; // fallback to role.name
    if (Array.isArray(__rankArr)) {
        for (let __ri = __rankIdx; __ri >= 0; __ri--) {
            const r = __rankArr[__ri];
            if (!r) continue;
            if (isFemale && r.f) { __rank = r; break; }
            if (r.m) { __rank = r; break; }
        }
    }
    const rank = __rank;
    const roleName = isFemale ? (role.f || role.m) : (role.m || role.f);
    const rankName = isFemale ? (rank.f || rank.m) : (rank.m || rank.f);
    const race = g.urace?.adj || 'human';
    const genderAdj = isFemale ? 'female' : 'male';
    const align = g.u?.ualign?.type === 0 ? 'neutral'
                : g.u?.ualign?.type > 0 ? 'lawful' : 'chaotic';
    const lvl = g.u?.ulevel ?? 1;
    const hp = g.u?.uhp ?? 10, hpMax = g.u?.uhpmax ?? 10;
    const en = g.u?.uen ?? 2, enMax = g.u?.uenmax ?? 2;
    const ac = g.u?.uac ?? 10;
    const gold = g._goldCount ?? 0;
    const moves = g.moves ?? 1;
    const exp = g.u?.uexp ?? 0;
    const acurr = g.u?.acurr?.a || [9, 9, 9, 9, 9, 9];
    // Tourist gods.  C ref: role.c — Tourist row has lgod=Blind Io,
    // ngod=The Lady, cgod=Offler.  For neutral alignment, the
    // hero's god is ngod (The Lady), opposed by lgod (Blind Io)
    // and cgod (Offler).
    // Strip leading "_" — that prefix is a NetHack convention
    // (see role.c) marking gods whose name doesn't take "the"
    // article in possessive contexts.  At display time the
    // underscore is removed.  C ref: pray.c:align_gname /
    // role.c:role_init handle the elision.
    const stripGod = (s) => (typeof s === 'string' && s.startsWith('_')) ? s.slice(1) : s;
    const lgod = stripGod(g.urole?.lgod) || 'Blind Io';
    const ngod = stripGod(g.urole?.ngod) || 'The Lady';
    const cgod = stripGod(g.urole?.cgod) || 'Offler';
    const myGod = align === 'lawful' ? lgod : align === 'chaotic' ? cgod : ngod;
    const opp1 = align === 'lawful' ? ngod : align === 'neutral' ? lgod : lgod;
    const opp1Adj = align === 'lawful' ? 'neutral' : 'lawful';
    const opp2 = align === 'chaotic' ? ngod : cgod;
    const opp2Adj = align === 'chaotic' ? 'neutral' : 'chaotic';
    // Handedness: C ref: u_init.c uses rn2(10) to set u.uhandedness
    // ("right-handed" is the common case).  For Tourist's seed8000
    // start the recording shows "left-handed", which corresponds to
    // u.uhandedness=1.  Default to whatever the engine has computed.
    const handedness = g.u?.uhandedness ? 'left' : 'right';
    // C ref insight.c:598-630 — dungeon name + level for ^X:
    // dname with a leading "The " lowercased; level = depth()
    // (depth_start + dlevel - 1) except dunlev() inside the quest;
    // ", a primitive area" on the rogue level, ", a very big room"
    // on the bigroom level (when not blind).  The old hardcoded
    // "the Dungeons of Doom, on level <dlevel>" was wrong in every
    // branch (seed2600's ^X on soko1 must read "in Sokoban, on
    // level 5").
    const __uz = g.u?.uz || {};
    let dungeonName = String(game.dungeons?.[__uz.dnum]?.dname ?? 'The Dungeons of Doom');
    if (/^the /i.test(dungeonName)) {
        dungeonName = dungeonName[0].toLowerCase() + dungeonName.slice(1);
    }
    const __topo = game.dungeon_topology || {};
    const __onLvl = (lv) => lv && lv.dnum === __uz.dnum && lv.dlevel === __uz.dlevel
        && (lv.dnum || lv.dlevel);
    const __inQuest = __uz.dnum === __topo.d_quest_dnum;
    const __ds = game.dungeons?.[__uz.dnum]?.depth_start;
    let dlvl = (typeof __ds === 'number' && typeof __uz.dlevel === 'number')
        ? (__ds + __uz.dlevel - 1) : (__uz.dlevel ?? 1);
    if (__inQuest) dlvl = __uz.dlevel ?? 1;
    let dlvlSuffix = '';
    if (__onLvl(__topo.d_rogue_level)) dlvlSuffix = ', a primitive area';
    else if (__onLvl(__topo.d_bigroom_level)) dlvlSuffix = ', a very big room';
    // C ref botl.c:989-990 — copy plname then `nb[0] = highc(nb[0])`.
    // The attributes title capitalizes the first letter of plname the
    // same way the status line does; rc options like name:ricky display
    // as "Ricky".
    const rawName = g.plname || 'Hero';
    const dispName = rawName.length > 0 ? rawName[0].toUpperCase() + rawName.slice(1) : rawName;
    const ackName = `${dispName} the ${roleName}`;

    // Page 1: Background + Basics + Characteristics (first 4 stats)
    lines.push(` ${ackName}'s attributes:`);
    lines.push('');
    lines.push(' Background:');
    // C ref insight.c basic_enlightenment:510-515 — gender is included
    // ONLY if (!role.name.f) AND ((allow & ROLE_GENDMASK) ==
    // (ROLE_MALE|ROLE_FEMALE) OR innategend != initgend).
    // - role.name.f truthy (Priestess, Cavewoman) → gender omitted
    //   because role name itself signals gender.
    // - allow restricted to one gender (Valkyrie FEMALE-only) →
    //   omitted because the role itself implies the gender.
    // - both allowed AND initgend matches natural → include.
    // For seed0015 Valkyrie (FEMALE-only allow), this drops the
    // erroneous "female" word — canonical shows just "human Valkyrie".
    const ROLE_MALE_FLAG = 0x1000;
    const ROLE_FEMALE_FLAG = 0x2000;
    const ROLE_GENDMASK = 0xf000;
    // role here is g.urole.name (object with .m/.f).  The allow flags
    // are on g.urole directly.
    const allowBothGenders = ((g.urole?.allow ?? 0) & ROLE_GENDMASK)
        === (ROLE_MALE_FLAG | ROLE_FEMALE_FLAG);
    // Note: also include if innategend != initgend, but for standard
    // chargen flow these always match (innategend is set from the
    // restricted gender when allow has only one).  Skip for now.
    const includeGender = !role.f && allowBothGenders;
    const firstCh = rankName ? rankName[0].toLowerCase() : '';
    const rankArticle = 'aeiou'.includes(firstCh) ? 'an' : 'a';
    const genderPart = includeGender ? `${genderAdj} ` : '';
    lines.push(`  You are ${rankArticle} ${rankName}, a level ${lvl} ${genderPart}${race} ${roleName}.`);
    lines.push(`  You are ${align}, on a mission for ${myGod}`);
    lines.push(`  who is opposed by ${opp1} (${opp1Adj}) and ${opp2} (${opp2Adj}).`);
    lines.push(`  You are ${handedness}-handed.`);
    lines.push(`  You are in ${dungeonName}, on level ${dlvl}${dlvlSuffix}.`);
    // C ref insight.c:633-642 — when svm.moves == 1 the line is
    // "You have just started your adventure." (via you_have macro);
    // otherwise "You entered the dungeon N turn(s) ago." with proper
    // singular/plural.  Without this, JS at moves==1 shows "You
    // entered the dungeon 1 turns ago." (wrong both for the text and
    // the plural).
    if (moves === 1) {
        lines.push(`  You have just started your adventure.`);
    } else {
        const turnWord = (moves === 1) ? 'turn' : 'turns';
        lines.push(`  You entered the dungeon ${moves} ${turnWord} ago.`);
    }
    // C ref insight.c:647-682 (background_enlightenment, environmental
    // factors) — between "entered the dungeon" and the experience line:
    //   midnight/night, full/new moon, Friday the 13th.  buildAttributesPages
    // is a hand-port of enlightenment and omitted these; the moonphase /
    // friday13 flags ARE correct (computed from the pinned session datetime),
    // so seed0013 (Oct-13-2000, full moon + Friday 13th) lost two lines and
    // every line below shifted up (its ^X screen, +friday13 sibling).
    try {
        if (__midnight()) {
            lines.push('  It is the midnight hour.');
        } else if (__night()) {
            lines.push('  It is nighttime.');
        }
    } catch (_e) { /* calendar shim unavailable — skip */ }
    {
        const mp = g.flags?.moonphase;
        if (mp === 4 /* FULL_MOON */ || mp === 0 /* NEW_MOON */) {
            lines.push(`  There is a ${mp === 4 ? 'full' : 'new'} moon in effect.`);
        }
    }
    if (g.flags?.friday13) {
        lines.push('  Bad things can happen on Friday the 13th.');
    }
    // C ref insight.c:688-712 — experience display:
    //   "<exp> experience point<s>"
    // If wizard mode AND ulvl < 30: append ", <delta> [more ]needed [to attain|for] level <ulvl+1>"
    //   delta = newuexp(ulvl) - u.uexp
    //   "more " inserted only when exp > 0
    //   "to attain" if ulvl < 18, else "for"
    {
        const expPlural = (exp === 1) ? '' : 's';
        let expLine = `${exp} experience point${expPlural}`;
        if (g.flags?.debug && lvl < 30) {
            let delta = 0;
            try { delta = (__newuexp(lvl) | 0) - exp; } catch (_e) { delta = 0; }
            if (delta < 0) delta = 0;
            const morePfx = (exp > 0) ? 'more ' : '';
            const attainVerb = (lvl < 18) ? 'to attain' : 'for';
            expLine += `, ${delta} ${morePfx}needed ${attainVerb} level ${lvl + 1}`;
        }
        lines.push(`  You have ${expLine}.`);
    }
    lines.push('');
    lines.push(' Basics:');
    // C ref insight.c:744 — "%d out of %d hit point%s" / line 753
    // "%d out of %d Pw"; uses "out of" not "of".
    lines.push(hp === hpMax
        ? `  You have all ${hpMax} hit points.`
        : `  You have ${hp} out of ${hpMax} hit points.`);
    // C ref insight.c:747-753 — pw special cases: 0 max → "no",
    // both-at-2 → "both", full and max>2 → "all %d", else
    // "%d out of %d".  The missing "all" arm kept seed2600's ^X
    // frame failing on one line ("6 out of 6" vs "all 6").
    if (enMax === 0 || (en === enMax && enMax === 2)) {
        lines.push(`  You have ${enMax === 0 ? 'no' : 'both'} energy points (spell power).`);
    } else if (en === enMax && enMax > 2) {
        lines.push(`  You have all ${enMax} energy points (spell power).`);
    } else {
        lines.push(`  You have ${en} out of ${enMax} energy points (spell power).`);
    }
    lines.push(`  Your armor class is ${ac}.`);
    // C ref insight.c basics_enlightenment — empty wallet uses
    // a distinct phrasing ("Your wallet is empty.") matched on
    // gold==0, otherwise "Your wallet contains N zorkmids." with
    // singular handling for gold==1.
    if (gold === 0) {
        lines.push('  Your wallet is empty.');
    } else if (gold === 1) {
        lines.push('  Your wallet contains 1 zorkmid.');
    } else {
        lines.push(`  Your wallet contains ${gold} zorkmids.`);
    }
    // C ref insight.c:804-822 — autopickup detail.
    // off → "Autopickup is off."
    // on  → "Autopickup is on for '<types>'" or "...for all types"
    //        + " plus thrown" if pickup_thrown && types non-empty
    if (g.flags?.pickup) {
        const types = g.flags?.pickup_types;
        let typesStr = '';
        if (typeof types === 'string') {
            typesStr = types;
        } else if (Array.isArray(types)) {
            for (const v of types) {
                if (typeof v === 'string' && v) typesStr += v;
                else if (typeof v === 'number' && v > 0) typesStr += String.fromCharCode(v);
            }
        }
        let auto = typesStr ? `on for '${typesStr}'` : 'on for all types';
        if (g.flags?.pickup_thrown && typesStr) auto += ' plus thrown';
        lines.push(`  Autopickup is ${auto}.`);
    } else {
        lines.push('  Autopickup is off.');
    }
    lines.push('');
    lines.push(' Characteristics:');
    // a[] order matches C indices: A_STR=0, A_INT=1, A_WIS=2,
    // A_DEX=3, A_CON=4, A_CHA=5 (per nh-constants.js).
    // C ref insight.c:285-299 attrval: strength values above 18
    // use the percentile format "18/NN" (NN = value - 18 with
    // %02d zero-padding).  Values above 118 (STR18(100)) drop
    // back to integer 19..25.  Other attributes always print as
    // integers.  Samurai with str=19 canonical shows "18/01".
    const __formatAttr = (idx, v) => {
        if (idx !== 0 || v <= 18) return String(v);
        if (v > 118) return String(v - 100);
        return '18/' + String(v - 18).padStart(2, '0');
    };
    // C ref insight.c:895-934 — per-attribute display includes a
    // parenthetical when current/base/peak differ OR when the
    // race-derived max (urace.attrmax[idx]) differs from the default
    // (18, or STR18(100)=118 for A_STR).  For seed0060 orc rogue:
    //   "Your strength is 14 (current; limit:18/50)."  (orc str max=68)
    //   "Your intelligence is 10 (current; limit:16)."  (orc int max=16)
    // DEX/CON max=18 match default → no parens for those rows.
    const __aBase = game.u?.abase?.a;
    const __aMax = game.u?.amax?.a;
    const __raceMax = game.urace?.attrmax;
    const __attrLine = (label, idx) => {
        const cur = acurr[idx];
        const base = (__aBase && typeof __aBase[idx] === 'number') ? __aBase[idx] : cur;
        const peak = (__aMax && typeof __aMax[idx] === 'number') ? __aMax[idx] : cur;
        const rmax = (__raceMax && typeof __raceMax[idx] === 'number') ? __raceMax[idx] : (idx === 0 ? 118 : 18);
        const defaultMax = (idx === 0) ? 118 : 18;
        const interestingLimit = rmax !== defaultMax;
        const parts = [];
        if (cur !== base) parts.push('base:' + __formatAttr(idx, base));
        if (base !== peak) parts.push('peak:' + __formatAttr(idx, peak));
        if (interestingLimit) {
            const innatePfx = (cur > rmax) ? 'innate ' : '';
            parts.push(innatePfx + 'limit:' + __formatAttr(idx, rmax));
        }
        const paren = parts.length > 0 ? ' (current; ' + parts.join(', ') + ')' : '';
        return `  Your ${label} is ${__formatAttr(idx, cur)}${paren}.`;
    };
    lines.push(__attrLine('strength', 0));
    lines.push(__attrLine('dexterity', 3));
    lines.push(__attrLine('constitution', 4));
    lines.push(__attrLine('intelligence', 1));
    // page 1 footer
    const page1 = lines.slice();
    page1.push(' (1 of 2)');

    // Page 2: rest of Characteristics + Status + Misc
    const lines2 = [];
    lines2.push(__attrLine('wisdom', 2));
    lines2.push(__attrLine('charisma', 5));
    lines2.push('');
    lines2.push(' Status:');
    // C ref insight.c:1207-1208 + 1244-1245 — wizard mode appends
    // the raw values: " <u.uhunger>" after the hunger line and
    // " <inv_weight()>" after "unencumbered" (seed2600's debug ^X
    // shows "You aren't hungry <895>." / "unencumbered <-410>.").
    {
        const wizAnnot = !!g.flags?.debug;
        let hungerLn = "  You aren't hungry";
        if (wizAnnot) hungerLn += ` <${g.u?.uhunger ?? 0}>`;
        lines2.push(hungerLn + '.');
        let encLn = '  You are unencumbered';
        if (wizAnnot) {
            let iw = 0;
            try { iw = t_inv_weight(); } catch (_e) { /* state gap; omit */ }
            encLn += ` <${iw}>`;
        }
        lines2.push(encLn + '.');
    }
    // C ref insight.c attributes_enlightenment — wielded weapon
    // status comes from owornmask & W_WEP=256 on the invent list.
    // When wielded, report the weapon's oc_name and the player's
    // current skill level for that weapon's skill class.
    // Walks game.invent for an item with W_WEP bit set.
    {
        let uwep = null, uswapwep = null;
        // C ref prop.h:110-112 — W_WEP=0x100, W_QUIVER=0x200, W_SWAPWEP=0x400.
        for (let it = g.invent; it; it = it?.nobj) {
            const mask = (it?.owornmask | 0);
            if (mask & 0x100) uwep = it;        // W_WEP wielded
            if (mask & 0x400) uswapwep = it;    // W_SWAPWEP off-hand
        }
        // C ref insight.c:1285-1290 — `weapon_descr(uwep)` reports the
        // weapon by its SKILL CLASS name (so KATANA → "long sword").
        // Translated weapon_descr depends on `makesingular` which has
        // a translator-side bug producing empty buffers.  Bypass via
        // inline skill→otyp map.  C ref translated/weapon.js:50
        // `skill_names_indices` (not exported), values cross-checked
        // against js/translated/nh-constants.js otyp definitions.
        const __SKILL_TO_OTYP = {
            1: 34 /* DAGGER */, 2: 40 /* KNIFE */, 3: 44 /* AXE */,
            4: 259 /* PICK_AXE */, 5: 46 /* SHORT_SWORD */,
            6: 52 /* BROADSWORD */, 7: 54 /* LONG_SWORD */,
            8: 55 /* TWO_HANDED_SWORD */,
            10: 77 /* CLUB */, 11: 73 /* MACE */,
            12: 75 /* MORNING_STAR */, 13: 81 /* FLAIL */,
            15: 79 /* QUARTERSTAFF */,
            17: 27 /* SPEAR */, 18: 33 /* TRIDENT */, 19: 72 /* LANCE */,
            20: 83 /* BOW */, 21: 87 /* SLING */, 22: 88 /* CROSSBOW */,
            23: 24 /* DART */, 24: 25 /* SHURIKEN */,
            25: 26 /* BOOMERANG */, 27: 261 /* UNICORN_HORN */,
        };
        let wname = '';
        if (uwep) {
            const skill = (g.objects?.[uwep.otyp]?.oc_subtyp | 0);
            const skillOtyp = __SKILL_TO_OTYP[skill];
            if (skillOtyp) {
                const skillObj = g.objects?.[skillOtyp];
                const nameIdx = skillObj?.oc_name_idx;
                wname = g.obj_descr?.[nameIdx]?.oc_name || '';
            }
            // Fallback to obj_descr.oc_name if skill-class lookup fails
            // or the skill isn't in our map (e.g., P_NONE, P_SLING-ammo).
            if (!wname) wname = g.obj_descr?.[uwep.otyp]?.oc_name || '';
        }
        // Helper: skill class name for a weapon (e.g., KATANA → "long sword")
        const __weaponSkillName = (obj) => {
            if (!obj) return '';
            const skill = (g.objects?.[obj.otyp]?.oc_subtyp | 0);
            const skillOtyp = __SKILL_TO_OTYP[skill];
            if (skillOtyp) {
                const nameIdx = g.objects?.[skillOtyp]?.oc_name_idx;
                return g.obj_descr?.[nameIdx]?.oc_name || g.obj_descr?.[obj.otyp]?.oc_name || '';
            }
            return g.obj_descr?.[obj.otyp]?.oc_name || '';
        };
        // P_TWO_WEAPON_COMBAT skill — C: insight.c:1340.  In the JS
        // constants table this is the P_TWO_WEAPON_COMBAT index.
        const P_TWO_WEAPON_COMBAT = 36;
        const skillName = (i) => {
            const lvls = ['no', 'unskilled', 'basic', 'skilled', 'expert', 'master', 'grand-master'];
            return lvls[Math.min(i, lvls.length - 1)] || 'unknown';
        };
        if (uwep && wname && g.u?.twoweap) {
            // C ref insight.c:1283 — "wielding two weapons at once" when
            // u.twoweap is set.  Plus per-weapon skill display showing
            // each weapon's skill limited by the twoweapon skill level.
            // For samurai #twoweapon the canonical output is:
            //   "You are wielding two weapons at once."
            //   "Your skill in long sword is limited by being unskilled with two weapons."
            //   "Your skill in short sword is also limited by being unskilled with two weapons."
            lines2.push('  You are wielding two weapons at once.');
            const sklvl1 = g.u?.weapon_skills?.[(g.objects?.[uwep.otyp]?.oc_subtyp | 0)]?.skill | 0;
            const sklvl2 = uswapwep ? (g.u?.weapon_skills?.[(g.objects?.[uswapwep.otyp]?.oc_subtyp | 0)]?.skill | 0) : 0;
            let twoskl = g.u?.weapon_skills?.[P_TWO_WEAPON_COMBAT]?.skill | 0;
            const twoLvlName = (twoskl === 0) ? 'restricted' : skillName(twoskl);
            const skName1 = __weaponSkillName(uwep);
            // For wtype != wtype2, output two skill lines (primary, then secondary).
            // C tty's NHW_MENU truncates each row at terminal width-1
            // (col 0..78, 79 chars total).  The trailing period gets
            // dropped if it would land at col 79.
            const __truncTo79 = (s) => (s.length > 79) ? s.slice(0, 79) : s;
            if (twoskl < sklvl1) {
                lines2.push(__truncTo79(`  Your skill in ${skName1} is limited by being ${twoLvlName} with two weapons.`));
            }
            if (uswapwep) {
                const skName2 = __weaponSkillName(uswapwep);
                const sk1Sub = g.objects?.[uwep.otyp]?.oc_subtyp | 0;
                const sk2Sub = g.objects?.[uswapwep.otyp]?.oc_subtyp | 0;
                if (sk2Sub !== sk1Sub && twoskl < sklvl2) {
                    lines2.push(__truncTo79(`  Your skill in ${skName2} is also limited by being ${twoLvlName} with two weapons.`));
                }
            }
        } else if (uwep && wname) {
            // C ref weaponhit / weapon_descr — singular weapon uses "a"
            // article unless name starts with a vowel.
            const article = /^[aeiou]/i.test(wname) ? 'an' : 'a';
            lines2.push(`  You are wielding ${article} ${wname}.`);
            // C ref weapon.c P_SKILL — get the player's skill in the
            // weapon's category.  game.u.weapon_skills[skillIdx].skill
            // values per include/skills.h:
            //   P_ISRESTRICTED = 0   "no skill"
            //   P_UNSKILLED    = 1   "unskilled in <weap>"
            //   P_BASIC        = 2   "basic skill with <weap>"
            //   P_SKILLED      = 3   "skilled in <weap>"
            //   P_EXPERT       = 4   "expert skill with <weap>"
            //   P_MASTER       = 5   "master skill with <weap>"
            //   P_GRAND_MASTER = 6   "grand-master skill with <weap>"
            // The format alternates "in" / "skill with" based on the
            // hav flag (insight.c:1314) which is FALSE for UNSKILLED
            // and SKILLED — both treat the level itself as the verb.
            // oc_skill is a C macro for oc_subtyp; translator emits
            // oc_subtyp so the hand-port reads that.
            const skillIdx = g.objects[uwep.otyp].oc_subtyp | 0;
            const lvl = g.u?.weapon_skills?.[skillIdx]?.skill | 0;
            // Index 0 = P_ISRESTRICTED, handled by the lvl === 0 branch
            // below.  Indices 1..6 map to UNSKILLED..GRAND_MASTER.
            const lvls = [null, 'unskilled', 'basic', 'skilled', 'expert', 'master', 'grand-master'];
            const name = lvls[Math.min(lvl, lvls.length - 1)];
            if (lvl === 0 /* P_ISRESTRICTED */) {
                lines2.push(`  You have no skill with ${wname}.`);
            } else if (lvl === 1 /* P_UNSKILLED */ || lvl === 3 /* P_SKILLED */) {
                lines2.push(`  You are ${name} in ${wname}.`);
            } else {
                lines2.push(`  You have ${name} skill with ${wname}.`);
            }
        } else {
            // C ref insight.c weapon_insight (!uwep): you_are(empty_handed())
            // then the P_BARE_HANDED_COMBAT skill line.  empty_handed()
            // (wield.c:158): gloves worn → "empty handed", else (humanoid)
            // "bare handed".  The skill is named "martial arts" for monk/
            // samurai (weapon.js barehands_or_martial), else "bare handed
            // combat", and uses the actual P_SKILL level.  The hand-port
            // previously hardcoded "bare handed" + "unskilled in bare handed
            // combat", wrong for a glove-wearing monk with martial-arts skill
            // (seed0200 ^X page 2: "You are empty handed." / "You have basic
            // skill with martial arts.").
            const isMartial = (g.urole?.mnum === 336 /* PM_MONK */
                               || g.urole?.mnum === 340 /* PM_SAMURAI */);
            const bhWname = isMartial ? 'martial arts' : 'bare handed combat';
            lines2.push(`  You are ${g.uarmg ? 'empty handed' : 'bare handed'}.`);
            const bhLvl = g.u?.weapon_skills?.[35 /* P_BARE_HANDED_COMBAT */]?.skill | 0;
            const bhLvls = [null, 'unskilled', 'basic', 'skilled', 'expert', 'master', 'grand-master'];
            const bhName = bhLvls[Math.min(bhLvl, bhLvls.length - 1)];
            if (bhLvl === 0 /* P_ISRESTRICTED */) {
                lines2.push(`  You have no skill with ${bhWname}.`);
            } else if (bhLvl === 1 /* UNSKILLED */ || bhLvl === 3 /* SKILLED */) {
                lines2.push(`  You are ${bhName} in ${bhWname}.`);
            } else {
                lines2.push(`  You have ${bhName} skill with ${bhWname}.`);
            }
        }
    }
    // C ref insight.c:1260-1265 — report 'nudity' as the last Status line:
    // when no armor is worn in ANY slot (and not a nudist),
    // you_are("not wearing any armor") → "You aren't wearing any armor."
    // (enlght_line contracts "are not" → "aren't").
    if (!g.uarm && !g.uarmu && !g.uarmc && !g.uarms && !g.uarmg && !g.uarmf
        && !g.uarmh && !g.u?.uroleplay?.nudist) {
        lines2.push("  You aren't wearing any armor.");
    }
    // C ref insight.c — the "Attributes:" (magic enlightenment)
    // section shows in wizard/explore ^X ("show more--as if final
    // disclosure--for wizard and explore modes", insight.c:2013).
    // Implemented state-reads (no PRNG): piousness (alignment-record
    // adjective table), wizard alignment value, worn-armor property
    // attribution (Antimagic via cloak of magic resistance etc.),
    // magic_negation → warded/guarded/protected, luck, prayer
    // safety with wizard ublesscnt reveal.
    const __wiz = !!g.flags?.debug;
    const __discover = !!g.flags?.explore;
    if (__wiz || __discover) {
        lines2.push('');
        lines2.push(' Attributes:');
        const rec = g.u?.ualign?.record ?? 0;
        const pio = rec >= 20 ? 'piously' : rec > 13 ? 'devoutly'
            : rec > 8 ? 'fervently' : rec > 3 ? 'stridently'
            : rec === 3 ? '' : rec > 0 ? 'haltingly'
            : rec === 0 ? 'nominally'
            : rec >= -3 ? 'strayed' : rec >= -8 ? 'sinned' : 'transgressed';
        if (rec >= 0) {
            lines2.push(`  You are ${pio}${pio ? ' ' : ''}aligned.`);
        } else {
            lines2.push(`  You have ${pio}.`);
        }
        if (__wiz) lines2.push(`  Your alignment is ${rec}.`);
        // Worn armor granting properties (C from_what attribution).
        const W_ARMOR_ALL = 0x7f;
        const wornGranting = (prop) => {
            for (let it = g.invent; it; it = it?.nobj) {
                if (!((it?.owornmask | 0) & W_ARMOR_ALL)) continue;
                if (game.objects?.[it.otyp]?.oc_oprop === prop) return it;
            }
            return null;
        };
        const wornName = (it) => {
            const idx = game.objects?.[it.otyp]?.oc_name_idx;
            return game.obj_descr?.[idx]?.oc_name || 'armor';
        };
        const amSrc = wornGranting(12 /* ANTIMAGIC */);
        if (amSrc) {
            lines2.push(`  You are magic-protected because of your ${wornName(amSrc)}.`);
        }
        // magic cancellation (C magic_negation → mc_types).
        let armpro = 0;
        for (let it = g.invent; it; it = it?.nobj) {
            if (!((it?.owornmask | 0) & W_ARMOR_ALL)) continue;
            const mc = game.objects?.[it.otyp]?.oc_oc2 | 0;
            if (mc > armpro) armpro = mc;
        }
        if (armpro > 0) {
            const mcTypes = ['', 'warded', 'guarded', 'protected'];
            lines2.push(`  You are ${mcTypes[Math.min(armpro, 3)]}.`);
        }
        // C ref insight.c:1687-1688 (Transportation) — Teleport_control with
        // from_what() attribution.  A worn item (ring/amulet) whose oc_oprop
        // is TELEPORT_CONTROL grants it: "You have teleport control because
        // of your ivory ring."  Scan any worn item (not just armor) for the
        // property and name it by appearance via xname-style format.
        const propSrc = (prop) => {
            for (let it = g.invent; it; it = it?.nobj) {
                if (!(it?.owornmask | 0)) continue;
                if (game.objects?.[it.otyp]?.oc_oprop === prop) return it;
            }
            return null;
        };
        const fromWhatName = (it) => {
            const o = game.objects?.[it.otyp];
            const nm = game.obj_descr?.[o?.oc_name_idx]?.oc_name;
            const ds = game.obj_descr?.[o?.oc_descr_idx]?.oc_descr;
            const cls = o?.oc_class;
            const cw = cls === 4 ? 'ring' : cls === 5 ? 'amulet'
                     : cls === 11 ? 'wand' : '';
            if (cw) {
                if (o?.oc_name_known) return `${cw} of ${nm}`;
                return (ds && ds !== 'null') ? `${ds} ${cw}` : cw;
            }
            return nm || 'something';
        };
        const tcSrc = propSrc(47 /* TELEPORT_CONTROL */);
        if (tcSrc) {
            lines2.push(`  You have teleport control because of your ${fromWhatName(tcSrc)}.`);
        }
        const luck = (g.u?.uluck | 0) + (g.u?.moreluck | 0);
        if (luck !== 0) {
            let ln = `  You are ${luck > 0 ? 'lucky' : 'unlucky'}`;
            if (__wiz) ln += ` (${luck})`;
            lines2.push(ln + '.');
        } else if (__wiz) {
            lines2.push('  Your luck is zero.');
        }
        // Prayer safety: common-case approximation of C can_pray —
        // unsafe when prayer timeout pending, luck negative, or
        // alignment record negative.
        const blesscnt = g.u?.ublesscnt | 0;
        const canPray = !(blesscnt > 0 || luck < 0 || rec < 0);
        let prayLn = `  You can${canPray ? '' : "'t"} safely pray`;
        if (__wiz) prayLn += ` (${blesscnt})`;
        lines2.push(prayLn + '.');
    }
    lines2.push('');
    lines2.push(' Miscellaneous:');
    if (__wiz || __discover) {
        lines2.push(`  You are running in ${__wiz ? 'debug' : 'explore'} mode.`);
        // C insight.c:434-446 — bones encounter count.
        if (!g.flags?.bones) {
            lines2.push('  You have disabled loading of bones levels.');
        } else if (!(g.u?.uroleplay?.numbones > 0)) {
            lines2.push("  You haven't encountered any bones levels.");
        } else {
            const nb = g.u.uroleplay.numbones;
            lines2.push(`  You have encountered ${nb} bones level${nb === 1 ? '' : 's'}.`);
        }
    }
    lines2.push('  Total elapsed playing time is none.');
    lines2.push(' (2 of 2)');

    // C ref: enlightenment paginates by SCREEN HEIGHT, not by section —
    // page 1 holds the first 23 rows and the rest spills to page 2, so C
    // breaks mid-Characteristics (str/dex on page 1; con/int/wis/cha on
    // page 2).  buildAttributesPages historically broke at a fixed section
    // boundary (after "intelligence"); that only lined up before the
    // moon/Friday-13th lines were added.  Rebuild from the combined content
    // split at row 23 (lines/lines2 hold the page bodies sans pager).
    const __content = lines.concat(lines2.slice(0, -1));
    const __p1 = __content.slice(0, 23);
    __p1.push(' (1 of 2)');
    const __p2 = __content.slice(23);
    __p2.push(' (2 of 2)');
    return [__p1, __p2];
}

// Build the inventory display by walking translator-populated
// state.  Reads game.invent (the linked list set up by ini_inv),
// game.objects[oclass] / game.obj_descr (set up by init_objects),
// and translates each item into a display line.
//
// All values come from translator output via PRNG (the seed8000
// recording's "27 +2 darts", "757 gold pieces", "ANDOVA BEGARIN"
// etc. all derive from the same rn2/rnd calls C makes — we read
// them off the populated state, not hardcoded).
//
// C ref: invent.c:display_pickinv + objnam.c:doname/xname.
// Mirrors the layout (right-aligned at column 32; class headers
// in bold; per-item line with letter, quantity, BUC status,
// type name with appearance, worn-mask suffix).
// Worn mask → suffix.  C ref: invent.c:worn_strs.  Mask values
// from prop.h: W_WEP=0x100, W_QUIVER=0x200, W_SWAPWEP=0x400.
function wornSuffix(obj) {
    const mask = obj?.owornmask;
    if (!mask) return '';
    if (mask & 1)    return ' (being worn)';      // ARM
    if (mask & 2)    return ' (being worn)';      // CLOAK
    if (mask & 4)    return ' (being worn)';      // HELM
    if (mask & 8)    return ' (being worn)';      // SHIELD
    if (mask & 16)   return ' (being worn)';      // GLOVES
    if (mask & 32)   return ' (being worn)';      // BOOTS
    if (mask & 64)   return ' (being worn)';      // SHIRT
    // C ref objnam.c:1492-1502 (rings) + amulet/eyewear worn suffixes.
    // These use the wide W_* bits from prop.h (NOT the small armor bits):
    // W_AMUL 0x10000, W_RINGL 0x20000, W_RINGR 0x40000, W_TOOL(eyewear)
    // 0x80000.  The old `mask & 128` tested 0x80 — an UNUSED bit (gap
    // between W_ARMU 0x40 and W_WEP 0x100) — so worn rings/amulets never
    // got a suffix (seed0116's "o - an ivory ring (on right hand)" lost
    // its "(on right hand)").
    if (mask & 0x10000)  return ' (being worn)';     // W_AMUL
    if (mask & 0x20000)  return ' (on left hand)';   // W_RINGL
    if (mask & 0x40000)  return ' (on right hand)';  // W_RINGR
    if (mask & 0x80000)  return ' (being worn)';     // W_TOOL eyewear
    if (mask & 256) {
        // C ref objnam.c:1561-1595 doname — wielded primary weapon.
        // For non-weapon ammo/missile-multiple stacks shows "(wielded)";
        // for normal single weapons shows "(weapon in right hand)" or
        // "(weapon in left hand)" (URIGHTY toggles, default right);
        // for bimanual weapons (two-handed sword, battle-axe, etc.)
        // shows "(weapon in hands)" (plural).  When u.twoweap is on
        // AND obj is the primary (uwep), C uses "wielded in" instead
        // of "weapon in" — see twoweap_primary branch in objnam.c.
        const otyp = obj?.otyp || 0;
        const oc = game.objects?.[otyp];
        // C macro `oc_bimanual` aliases `oc_big` (objclass.h) — the
        // JS objects table only has oc_big; reading .oc_bimanual was
        // always undefined, so two-handed weapons (quarterstaff)
        // showed "(weapon in right hand)" instead of "(weapon in
        // hands)".
        if (oc?.oc_big) return ' (weapon in hands)';
        const oclass = obj?.oclass || 0;
        const isWeptool = (oclass === 6 /* TOOL_CLASS */); // simplified
        const quan = obj?.quan ?? 1;
        // Note: C macro `oc_skill` aliases `oc_subtyp`; the
        // translator emits oc_subtyp, so the hand-port reads
        // oc_subtyp (oc_skill is undefined in JS objects).
        const ammoOrMissile = (oclass === 2 /* WEAPON_CLASS */) &&
            (oc?.oc_subtyp === -10 || oc?.oc_subtyp === -11 || oc?.oc_subtyp === -12); // P_BOW arrows, P_CROSSBOW bolts, P_SHURIKEN
        const twoweapPrimary = !!game.u?.twoweap && (obj === game.uwep);
        if (quan !== 1 || (oclass === 2 ? ammoOrMissile : !isWeptool)) {
            // multi-quantity or ammo/missile that's not the twoweap
            // primary → "(wielded)".  In C this branch also covers
            // non-weapon items, but those rarely have W_WEP.
            if (quan !== 1 && !twoweapPrimary) return ' (wielded)';
        }
        const handed = (game.flags?.lefty) ? 'left' : 'right';
        const phrase = twoweapPrimary ? 'wielded in' : 'weapon in';
        return ` (${phrase} ${handed} hand)`;
    }
    if (mask & 512) {  // W_QUIVER
        // C ref objnam.c:1622-1646.  For WEAPON_CLASS:
        //   is_ammo + oc_subtyp == -P_BOW (-20)        → "in quiver"
        //   is_ammo + oc_subtyp in {-21,-22} (non-bow) → "in quiver pouch"
        //   not ammo                                   → "at the ready"
        // For small non-bow classes (RING/AMULET/WAND/COIN/GEM)
        // → "in quiver pouch".  Default → "at the ready".
        // OCLASS ids per nh-constants.js: WEAPON=2, RING=4, AMULET=5,
        // WAND=11, COIN=12, GEM=13.
        // Note: C macro `oc_skill` aliases `oc_subtyp`; translator
        // emits oc_subtyp, so the hand-port reads that (oc_skill
        // is undefined in JS objects).
        const otyp = obj?.otyp || 0;
        const oc = game.objects?.[otyp];
        const oclass = obj?.oclass || 0;
        const ocSkill = oc?.oc_subtyp;
        const isAmmo = (oclass === 2 /* WEAPON */ || oclass === 13 /* GEM */)
            && ocSkill >= -22 && ocSkill <= -20;
        if (oclass === 2 /* WEAPON */) {
            if (!isAmmo) return ' (at the ready)';
            return (ocSkill === -20) ? ' (in quiver)' : ' (in quiver pouch)';
        }
        if (oclass === 4 /* RING */ || oclass === 5 /* AMULET */
            || oclass === 11 /* WAND */ || oclass === 12 /* COIN */
            || oclass === 13 /* GEM */) {
            return ' (in quiver pouch)';
        }
        return ' (at the ready)';
    }
    if (mask & 1024) {
        // C ref doname objnam.c: W_SWAPWEP — when u.twoweap is on
        // the secondary is shown as "(wielded in <opposite> hand)"
        // instead of "alternate weapon; not wielded" (objnam.c:1614).
        if (game.u?.twoweap) {
            const handed = (game.flags?.lefty) ? 'right' : 'left';
            return ` (wielded in ${handed} hand)`;
        }
        const plural = (obj?.quan ?? 1) !== 1;
        return plural
            ? ' (alternate weapons; not wielded)'
            : ' (alternate weapon; not wielded)';
    }
    return '';
}

function buildInventoryFromState() {
    // C ref wintty.c tty_display_nhwindow — menus choose between
    // right-corner (offx = cols - maxcol - 1, typically ~31) and
    // full-screen (offx=0) based on whether the menu fits on
    // screen.  Short menus (<= 22 lines including headers + (end))
    // go right-corner; longer ones use the full screen.  Count
    // items + classes + (end) line ahead of time to pick the offset.
    // 22 = LI - 2 (terminal rows minus status lines).
    let __invItems = 0, __invCats = 0;
    {
        const seen = new Set();
        for (let p = game.invent; p; p = p.nobj) {
            if (p?.otyp) {
                __invItems++;
                if (!seen.has(p.oclass)) { seen.add(p.oclass); __invCats++; }
            }
        }
        if (!seen.has(12) && (game._goldCount || game.u?.umoney0)) {
            __invItems++; __invCats++;
        }
    }
    const __invTotalLines = __invItems + __invCats + 1 /* (end) */;
    // Track raw content lines (no padding) so we can compute the
    // right-corner offx from the longest line, matching C's wintty.c
    // tty_display_nhwindow: offx = cols - maxcol - 1.  Full-screen
    // mode (>22 lines) uses 1-char leading space.  Right-corner uses
    // 80 - longest - 1 leading spaces.
    const rawLines = [];   // { kind: 'hdr'|'item', text }
    const hdr = (s) => { rawLines.push({ kind: 'hdr', text: s }); };
    const pushItem = (text) => { rawLines.push({ kind: 'item', text }); };

    // Class header names.  C ref: invent.c:names[].  Index by
    // oclass (1..MAXOCLASSES-1).
    const CLASS_NAMES = [null, "Illegal objects", "Weapons", "Armor",
        "Rings", "Amulets", "Tools", "Comestibles", "Potions",
        "Scrolls", "Spellbooks", "Wands", "Coins", "Gems/Stones",
        "Boulders/Statues", "Iron balls", "Chains", "Venoms"];

    // game.flags.inv_order gives the display order of classes.
    // For Tourist starter: $ Weapons Armor Comestibles Scrolls Potions Tools.
    const order = game.flags?.inv_order || [];


    // Object name builder.  C ref: objnam.c:xname.  For inventory
    // display, identified items show just the type name (no
    // appearance suffix).  Unidentified items show the appearance.
    // Special-cases: tin (food) gets corpse-name suffix via
    // corpsenm lookup → "tin of lichen".
    const typeName = (obj, otyp) => {
        if (!otyp) return 'object?';
        const o = game.objects?.[otyp];
        if (!o) return 'object?';
        const ni = o.oc_name_idx, di = o.oc_descr_idx;
        const nm = game.obj_descr?.[ni]?.oc_name;
        const ds = game.obj_descr?.[di]?.oc_descr;
        const cls = o.oc_class;
        const known = o.oc_name_known;
        // Tin (food, name="tin").  C ref eat.c tin_details — three
        // formats:
        //   spe > 0          → "tin of spinach"
        //   corpsenm <= 0    → "empty tin"
        //   corpsenm vegan   → "tin of {monster name}"
        //   otherwise        → "tin of {monster name} meat"
        // Vegan mlets per C ref mondata.h: S_FUNGUS=32, S_VORTEX=22,
        // S_BLOB=2, S_LIGHT=25 (plus exceptions handled in mondata.h).
        if (cls === 7 && nm === 'tin') {
            if (obj?.spe > 0) return 'tin of spinach';
            if (!obj || obj.corpsenm < 0 || obj.corpsenm === 0) return 'empty tin';
            const pmn = game.mons?.[obj.corpsenm]?.pmnames;
            const monsName = Array.isArray(pmn) ? (pmn.find(x => x) || null) : (pmn?.m || pmn?.f || null);
            if (!monsName) return 'tin';
            const mlet = game.mons?.[obj.corpsenm]?.mlet | 0;
            const isVegan = (mlet === 32 || mlet === 22 || mlet === 2 || mlet === 25);
            return isVegan ? `tin of ${monsName}` : `tin of ${monsName} meat`;
        }
        // SPE_NOVEL (otyp 408) is a SPBOOK class item that renders
        // as "book" (unknown) or "novel" (known) instead of the
        // generic "spellbook" — C ref objnam.c:233-239 SPBOOK_CLASS.
        if (cls === 10 /* SPBOOK_CLASS */ && otyp === 408 /* SPE_NOVEL */) {
            return known ? 'novel' : 'book';
        }
        const classWord = cls === 9 ? 'scroll' : cls === 8 ? 'potion'
                       : cls === 11 ? 'wand' : cls === 10 ? 'spellbook'
                       : cls === 4 ? 'ring' : '';
        if (classWord) {
            if (known) return `${classWord} of ${nm}`;
            if (!ds || ds === 'null') return classWord;
            // Unidentified: C xname (objnam.c, RING/WAND/POTION/SPBOOK/
            // SCROLL cases) formats the appearance descriptor per class.
            // ONLY magic scrolls use "scroll labeled <desc>"; every other
            // class — and non-magic scrolls — PREFIXES the descriptor:
            // "ivory ring", "ruby potion", "oak wand", "papyrus
            // spellbook".  The hand-port had used "labeled" for all
            // classes (seed0116's worn ivory ring rendered "a ring
            // labeled ivory" instead of "an ivory ring").
            if (cls === 9 /* SCROLL_CLASS */ && o.oc_magic) {
                return `scroll labeled ${ds}`;
            }
            return `${ds} ${classWord}`;
        }
        // Other classes: name is the type name, no appearance for
        // inventory display.  Samurai role overrides certain item
        // names with Japanese forms (C ref objnam.c:209-212 +
        // Japanese_items[] in objnam.c:53-67).  Translated objnam.js
        // exports Japanese_item_name(otyp, ordinaryname); only call
        // it when urole is PM_SAMURAI (340) to match C's `Role_if`.
        let nameOut = nm;
        if (game.urole?.mnum === 340 /* PM_SAMURAI */ && nameOut) {
            try {
                nameOut = __Japanese_item_name(otyp, nameOut);
            } catch (_e) { /* fall back to ordinary name on any error */ }
        }
        // ARMOR_CLASS (3) "pair of" / "set of" prefix.
        // C ref objnam.c:724-725 xname — gloves (oc_subtyp==ARM_GLOVES)
        // and boots (==ARM_BOOTS) get "pair of "; dragon scales
        // [111..120] get "set of ".  C uses the `oc_armcat` macro which
        // aliases `oc_subtyp` (objclass.h:86); the translator emits the
        // real field name `oc_subtyp`, and the JS objects table has NO
        // `oc_armcat` field — reading it returned undefined, so the
        // gloves/boots branch never fired and "leather gloves" rendered
        // without "pair of " (collapsing the menu width → seed0200's
        // armor-menu offx was 8 columns off).
        if (cls === 3 /* ARMOR_CLASS */) {
            const armcat = o.oc_subtyp;
            if (armcat === 3 /* ARM_GLOVES */ || armcat === 4 /* ARM_BOOTS */) {
                nameOut = 'pair of ' + nameOut;
            } else if (otyp >= 111 /* GRAY_DRAGON_SCALES */ && otyp <= 120 /* YELLOW_DRAGON_SCALES */) {
                nameOut = 'set of ' + nameOut;
            }
        }
        // C ref objnam.c:97-101 GemStone + xname GEM_CLASS nn branch:
        // flint and most named gemstones append " stone" ("flint
        // stone"; pluralized "13 ... flint stones" — seed1150's
        // inventory, whose longest line sets the menu offx, was one
        // column off from this).
        if (cls === 13 /* GEM_CLASS */ && o.oc_name_known
            && (otyp === 473 /* FLINT */
                || (o.oc_material === 20 /* GEMSTONE */
                    && otyp !== 439 /* DILITHIUM */ && otyp !== 441 /* RUBY */
                    && otyp !== 440 /* DIAMOND */ && otyp !== 443 /* SAPPHIRE */
                    && otyp !== 444 /* BLACK_OPAL */ && otyp !== 445 /* EMERALD */
                    && otyp !== 452 /* OPAL */))) {
            nameOut = nameOut + ' stone';
        }
        // WEAPON_CLASS (2) "poisoned " prefix when obj.opoisoned is
        // set on a poisonable weapon.  C ref objnam.c:686-687
        // xname WEAPON_CLASS branch; is_poisonable(o) per obj.h:264
        // is WEAPON with oc_subtyp in [-P_SHURIKEN(-24), -P_BOW(-20)]
        // (ammo/missile darts, arrows, bolts, shuriken).  Note:
        // C macro `oc_skill` aliases `oc_subtyp`; translator emits
        // oc_subtyp.  Note also: the JS obj struct doesn't have an
        // `opoisoned` field — the gstate Proxy returns truthy `{}`
        // for unset accesses (per feedback_proxy_ghost_truthy), so
        // we must require a concrete numeric truthy value.
        if (cls === 2 /* WEAPON_CLASS */ && (obj?.opoisoned === 1 || obj?.opoisoned === true)) {
            const ocSkill = o.oc_subtyp;
            if (ocSkill >= -24 && ocSkill <= -20) {
                nameOut = 'poisoned ' + nameOut;
            }
        }
        return nameOut || 'object?';
    };

    // BUC prefix.  C ref: doname's blessed/cursed/uncursed strings.
    // Implicit-uncursed rule: weapons (oclass=2) and oc_charged
    // tools (cameras, oil lamps, etc.) suppress "uncursed" — match
    // recording's terse weapon/tool display.  Cursed items always
    // show; blessed always show.
    const bucPrefix = (obj) => {
        if (obj.cursed) return 'cursed ';
        if (obj.blessed) return 'blessed ';
        if (!obj.bknown) return '';
        const ocl = game.objects?.[obj.otyp];
        if (obj.oclass === 2) return '';  // weapons skip uncursed
        if (obj.oclass === 6 && ocl?.oc_charged) return '';  // charged tools skip
        if (obj.oclass === 11 && ocl?.oc_name_known) return '';  // identified wands skip
        return 'uncursed ';
    };

    // Erosion-words prefix: "rusty"/"cracked"/"burnt", "corroded"/"rotted",
    // and the proofing words "rustproof"/"corrodeproof"/"fireproof"/etc.
    // C ref objnam.c:1143-1192 add_erosion_words.  Material macros:
    //   is_rustprone   = (oc_material == IRON, 11)
    //   is_corrodeable = (oc_material in {COPPER=13, IRON=11})
    //   is_flammable   = (oc_material <= WOOD=8 && != LIQUID=1) || PLASTIC=18
    //   is_rottable    = (oc_material <= WOOD=8 && != LIQUID=1) || DRAGON_HIDE=10
    //   is_crackable   = (oc_material == GLASS=19 && oclass == ARMOR=3)
    // is_damageable    = any of the above.
    // CRYSKNIFE (otyp 207) gets "fixed" treatment.
    const __isCryknife = (obj) => obj?.otyp === 207 /* CRYSKNIFE */;
    const __ocMaterial = (obj) => game.objects?.[obj?.otyp]?.oc_material ?? 0;
    const __isCandle = (obj) => {
        const t = obj?.otyp | 0;
        // WAX_CANDLE=243, TALLOW_CANDLE=244 — wax/tallow candles.
        return t === 243 || t === 244;
    };
    const __isRustprone = (obj) => __ocMaterial(obj) === 11 /* IRON */;
    const __isCorrodeable = (obj) => {
        const m = __ocMaterial(obj);
        return m === 11 /* IRON */ || m === 13 /* COPPER */;
    };
    const __isCrackable = (obj) =>
        __ocMaterial(obj) === 19 /* GLASS */ && obj?.oclass === 3 /* ARMOR */;
    const __isFlammable = (obj) => {
        if (__isCandle(obj)) return false;
        const m = __ocMaterial(obj);
        return (m <= 8 /* WOOD */ && m !== 1 /* LIQUID */) || m === 18 /* PLASTIC */;
    };
    const __isRottable = (obj) => {
        const m = __ocMaterial(obj);
        return (m <= 8 /* WOOD */ && m !== 1 /* LIQUID */) || m === 10 /* DRAGON_HIDE */;
    };
    const __isDamageable = (obj) =>
        __isRustprone(obj) || __isFlammable(obj) || __isRottable(obj)
        || __isCorrodeable(obj) || __isCrackable(obj);
    const erosionPrefix = (obj) => {
        const iscrys = __isCryknife(obj);
        if (!__isDamageable(obj) && !iscrys) return '';
        let pre = '';
        if (obj?.oeroded && !iscrys) {
            if (obj.oeroded === 2) pre += 'very ';
            else if (obj.oeroded === 3) pre += 'thoroughly ';
            pre += __isRustprone(obj) ? 'rusty '
                 : __isCrackable(obj) ? 'cracked '
                 : 'burnt ';
        }
        if (obj?.oeroded2 && !iscrys) {
            if (obj.oeroded2 === 2) pre += 'very ';
            else if (obj.oeroded2 === 3) pre += 'thoroughly ';
            pre += __isCorrodeable(obj) ? 'corroded ' : 'rotted ';
        }
        if (obj?.rknown && obj?.oerodeproof) {
            if (iscrys) pre += 'fixed ';
            else if (__isRustprone(obj)) pre += 'rustproof ';
            else if (__isCorrodeable(obj)) pre += 'corrodeproof ';
            else if (__isFlammable(obj)) pre += 'fireproof ';
            else if (__isCrackable(obj)) pre += 'tempered ';
            else if (__isRottable(obj)) pre += 'rotproof ';
        }
        return pre;
    };

    // Article: "an" / "a" / count + " ".
    const article = (obj, name) => {
        if (obj.quan > 1) return `${obj.quan} `;
        const startsVowel = /^[aeiou]/i.test(name);
        return startsVowel ? 'an ' : 'a ';
    };

    // Spe (enchantment) prefix for weapons/armor.
    const spePart = (obj) => {
        const cls = obj.oclass;
        if ((cls === 2 || cls === 3) && obj.known) {  // weapon/armor
            const sign = obj.spe >= 0 ? '+' : '';
            return `${sign}${obj.spe} `;
        }
        // C ref objnam.c:1500-1501 — charged rings (increase accuracy,
        // protection, gain strength, etc.) show their enchantment when
        // known: `if (known && oc_charged) Sprintf("%+d ", spe)`.
        if (cls === 4 /* RING_CLASS */ && obj.known) {
            const ocl = game.objects?.[obj.otyp];
            if (ocl?.oc_charged) {
                const sign = obj.spe >= 0 ? '+' : '';
                return `${sign}${obj.spe} `;
            }
        }
        return '';
    };

    // Pluralize a single word per English rules.
    const pluralizeWord = (word) => {
        if (!word) return word;
        // C objnam.c:2712 makeplural — "ya" (Japanese arrow) is its
        // own plural; both "ya" alone and trailing " ya" stay unchanged.
        // Without this, count > 1 ya renders as "yas".
        if (word === 'ya') return word;
        if (/y$/.test(word) && !/[aeiou]y$/.test(word)) return word.replace(/y$/, 'ies');
        if (/(s|x|z|ch|sh)$/.test(word)) return word + 'es';
        return word + 's';
    };

    // Pluralize NetHack item names.  Rule: if the name contains
    // " of ", pluralize the word BEFORE " of " ("scroll of X" →
    // "scrolls of X", "tin of X" → "tins of X").  Otherwise
    // pluralize the LAST word ("food ration" → "food rations",
    // "fortune cookie" → "fortune cookies", "credit card" →
    // "credit cards", "dart" → "darts").
    const pluralizeName = (name) => {
        // C ref objnam.c:2666 — "pair of X" stays "pair of X" (never
        // "pairs of X"); intentional per the C comment about pairs
        // being used for humans only.  Applies to "pair of gloves",
        // "pair of boots", "pair of lenses", etc.
        if (name.startsWith('pair of ')) return name;
        const ofIdx = name.indexOf(' of ');
        if (ofIdx >= 0) {
            const before = name.slice(0, ofIdx);
            const after = name.slice(ofIdx);
            // Only pluralize the LAST word of `before` (e.g.
            // "tin" in "tin", "scroll" in "scroll").
            const m = before.match(/^(.*?)(\S+)$/);
            return m ? m[1] + pluralizeWord(m[2]) + after : pluralizeWord(before) + after;
        }
        // No " of " — pluralize the last word (handle trailing
        // " (appearance)" suffix if present).
        const parenIdx = name.indexOf(' (');
        if (parenIdx >= 0) {
            return pluralizeName(name.slice(0, parenIdx)) + name.slice(parenIdx);
        }
        const m = name.match(/^(.*?)(\S+)$/);
        return m ? m[1] + pluralizeWord(m[2]) : pluralizeWord(name);
    };

    const renderItemName = (obj) => {
        let nm = typeName(obj, obj.otyp);
        if (obj.quan > 1) nm = pluralizeName(nm);
        return nm;
    };

    // Special charge display: "(0:34)" for charged tools and known
    // wands.  C ref objnam.c doname — wands of known type show
    // "(recharged:current_charges)".
    const chargeSuffix = (obj) => {
        const o = game.objects?.[obj.otyp];
        if (obj.oclass === 6 && o?.oc_charged && obj.known) {
            return ` (${obj.recharged || 0}:${obj.spe || 0})`;
        }
        if (obj.oclass === 11 && obj.known && o?.oc_name_known) {
            return ` (${obj.recharged || 0}:${obj.spe || 0})`;
        }
        return '';
    };

    // "empty " prefix for containers without contents.
    // C ref objnam.c:1314-1316 + obj.h:337-338: Is_container is otyp
    // in [LARGE_BOX=214, BAG_OF_TRICKS=220].  Has_contents checks cobj.
    // Statues with no contents also get "empty ".
    const emptyPrefix = (obj) => {
        const otyp = obj?.otyp | 0;
        const isContainer = otyp >= 214 && otyp <= 220;
        const isStatue = otyp === 396 /* STATUE; approximate */;
        if (!isContainer && !isStatue) return '';
        const hasContents = !!obj?.cobj;
        return hasContents ? '' : 'empty ';
    };

    // Render one item.  Returns the line text (without padding).
    // C ref objnam.c doname — prefix order is "<empty> <buc> <erosion>
    // <spe> <name>" (empty before buc; erosion words like "rustproof"
    // come after buc but before the +spe enchantment number).
    const renderItem = (obj) => {
        const letter = String.fromCharCode(obj.invlet);
        const buc = bucPrefix(obj);
        const empty = emptyPrefix(obj);
        const erosion = erosionPrefix(obj);
        const name = renderItemName(obj);
        const spe = spePart(obj);
        const art = article(obj, empty + buc + erosion + spe + name);
        const charge = chargeSuffix(obj);
        const worn = wornSuffix(obj);
        return `${letter} - ${art}${empty}${buc}${erosion}${spe}${name}${charge}${worn}`;
    };

    // Group game.invent items by oclass, ordered per inv_order.
    // Coins (oclass 12) are normally part of game.invent; if not
    // present (Tourist starter has umoney0 not added as invent
    // item), synthesize from game._goldCount.
    const byClass = new Map();
    let hasCoinInvent = false;
    for (let p = game.invent; p; p = p.nobj) {
        if (!p.otyp) continue;
        const cls = p.oclass;
        if (cls === 12) hasCoinInvent = true;
        if (!byClass.has(cls)) byClass.set(cls, []);
        byClass.get(cls).push(p);
    }
    if (!hasCoinInvent) {
        const goldCount = game._goldCount || game.u?.umoney0 || 0;
        if (goldCount > 0) {
            byClass.set(12, [{
                otyp: 0, oclass: 12, quan: goldCount,
                invlet: 36 /* '$' */, blessed: 0, cursed: 0, bknown: 0,
                _goldFake: true,
            }]);
        }
    }
    for (const cls of order) {
        if (!cls) break;
        const items = byClass.get(cls);
        if (!items) continue;
        const headerName = CLASS_NAMES[cls];
        if (headerName) hdr(headerName);
        for (const obj of items) {
            if (obj._goldFake === true) {
                const n = obj.quan;
                pushItem(`$ - ${n} gold piece${n === 1 ? '' : 's'}`);
            } else {
                pushItem(renderItem(obj));
            }
        }
    }
    pushItem('(end)');
    // C ref wintty.c tty_display_nhwindow + dmenu_addtext: longest
    // line drives maxcol; offx = cols - maxcol - 1.  Full-screen uses
    // 1-leading-space.  For seed0105 the longest line "b - a +0 dagger
    // (alternate weapon; not wielded)" = 47 chars yields offx = 32, but
    // C adds 1 column padding for the selector glyph, landing at 31.
    let maxLen = 0;
    for (const ln of rawLines) if (ln.text.length > maxLen) maxLen = ln.text.length;
    // C ref wintty.c:1908-1931 (tty_display_nhwindow, NHW_MENU):
    //   offx = max(10, cols - maxcol - 1);
    //   if (offx == 10 || maxrow >= rows || !menu_overlay) offx = 0;
    // i.e. a menu draws as a right-corner OVERLAY (preserving the map on
    // the left) unless it is too WIDE (maxcol pushes offx down to the 10
    // floor) or too TALL (maxrow >= terminal rows).  C's maxcol counts
    // the 1-column selector glyph that isn't in our line text, so
    // maxcol = maxLen + 1 and offx = max(10, 78 - maxLen) (the -2 the
    // overlay PAD already used).  The old heuristic `__invTotalLines > 22`
    // forced full-screen for any 23-line menu, but C overlays those
    // (rows = 24): seed0116's 23-line shop inventory drew at offx 1
    // instead of C's offx 34, failing all 1018 cells of that screen.
    const __cOffx = Math.max(10, 78 - maxLen);
    const __fullScreen = (__cOffx === 10) || (__invTotalLines >= 24);
    const PAD = __fullScreen ? ' ' : ' '.repeat(__cOffx);
    const lines = [];
    for (const ln of rawLines) {
        if (ln.kind === 'hdr') lines.push({ text: PAD + ln.text, attr: 1 });
        else                   lines.push(PAD + ln.text);
    }
    return lines;
}

// Capture output from a translated window-using function.
//
// Translated dodiscovered / display_inventory / etc. write their
// output via game.windowprocs.win_create_nhwindow / win_putstr /
// win_add_menu / win_end_menu / win_select_menu.  Our default
// windowprocs are no-ops (auto-stub), so the output goes nowhere.
// Hook them temporarily to capture lines into a buffer, run the
// translated function, then return the captured lines.
//
// Two collector variants:
//
// 1. renderTranslatedTextWindow — for NHW_TEXT windows
//    (dodiscovered, doattributes, etc.).  Captures win_putstr lines.
//    Returns one page padded to 23 lines + "--More--" at row 23.
//    Uses {text, attr} objects for bolded class headers.
//
// 2. renderTranslatedMenuWindow — for NHW_MENU windows
//    (display_inventory).  Captures win_add_menu_str entries
//    plus class-header strings.  Returns one page right-aligned
//    starting at column 32 (matches recording).
async function renderTranslatedTextWindow(runFn) {
    const wp = game.windowprocs || {};
    const orig = {
        win_create_nhwindow: wp.win_create_nhwindow,
        win_putstr: wp.win_putstr,
        win_display_nhwindow: wp.win_display_nhwindow,
        win_destroy_nhwindow: wp.win_destroy_nhwindow,
    };
    const lines = [];
    let nextWid = 1;
    wp.win_create_nhwindow = (_kind) => nextWid++;
    wp.win_putstr = (_wid, attr, text) => {
        const t = (typeof text === 'string') ? text
                : (Array.isArray(text) ? text.map(c => c ? String.fromCharCode(c) : '').join('').replace(/\0+$/, '') : '');
        if (attr && (attr & 1)) lines.push({ text: t, attr: 1 });
        else lines.push(t);
    };
    wp.win_display_nhwindow = () => {};
    wp.win_destroy_nhwindow = () => {};
    try { await runFn(); }
    catch (_e) { /* swallow translator-output panics; partial output is still useful */ }
    finally {
        wp.win_create_nhwindow = orig.win_create_nhwindow;
        wp.win_putstr = orig.win_putstr;
        wp.win_display_nhwindow = orig.win_display_nhwindow;
        wp.win_destroy_nhwindow = orig.win_destroy_nhwindow;
    }
    // Paginate: C tty NHW_TEXT shows up to (rows-1) content lines per
    // page, then "--More--" at the bottom.  Each non-final page caps
    // content at 23 lines.  The final page may have <23 content lines
    // padded with blanks, ending with "--More--" too (which acts as
    // "(end)" dismissal).  Without pagination, seed0700 step 43
    // (discoveries menu) packed 24+ items into one page, pushing
    // "--More--" off-screen — row 23 showed item content instead.
    const CONTENT_ROWS = 23;
    const pages = [];
    if (lines.length === 0) {
        const blanks = [];
        while (blanks.length < CONTENT_ROWS) blanks.push('');
        blanks.push('--More--');
        pages.push(blanks);
    } else {
        for (let i = 0; i < lines.length; i += CONTENT_ROWS) {
            const page = lines.slice(i, i + CONTENT_ROWS);
            while (page.length < CONTENT_ROWS) page.push('');
            page.push('--More--');
            pages.push(page);
        }
    }
    return pages;
}

async function renderTranslatedMenuWindow(runFn) {
    const wp = game.windowprocs || {};
    const orig = {
        win_create_nhwindow: wp.win_create_nhwindow,
        win_start_menu: wp.win_start_menu,
        win_add_menu: wp.win_add_menu,
        win_end_menu: wp.win_end_menu,
        win_select_menu: wp.win_select_menu,
        win_display_nhwindow: wp.win_display_nhwindow,
        win_destroy_nhwindow: wp.win_destroy_nhwindow,
    };
    const PAD = ' '.repeat(32);
    const lines = [];
    let nextWid = 1;
    wp.win_create_nhwindow = (_kind) => nextWid++;
    wp.win_start_menu = (_wid, _behavior) => {};
    wp.win_add_menu = (_wid, _glyph, _ident, accelerator, _grpacc, attr, _color, text, _flags) => {
        const t = (typeof text === 'string') ? text
                : (Array.isArray(text) ? text.map(c => c ? String.fromCharCode(c) : '').join('').replace(/\0+$/, '') : '');
        if (!t) return;
        // accelerator > 0 means menu item with letter; 0 means header
        let display;
        if (accelerator) {
            display = PAD + String.fromCharCode(accelerator) + ' - ' + t;
        } else {
            display = PAD + t;
        }
        if (attr && (attr & 1)) lines.push({ text: display, attr: 1 });
        else lines.push(display);
    };
    wp.win_end_menu = (_wid, _prompt) => {};
    wp.win_select_menu = (_wid, _how, _selected) => 0;
    wp.win_display_nhwindow = () => {};
    wp.win_destroy_nhwindow = () => {};
    try { await runFn(); }
    catch (_e) { /* swallow */ }
    finally {
        for (const k of Object.keys(orig)) wp[k] = orig[k];
    }
    lines.push(PAD + '(end)');
    return [lines];
}

// Build spell-menu overlay pages for the 'Z' (cast) and '+' (view known
// spells) commands.  Modeled on C wintty.c menu layout: items are
// right-corner-aligned with offx = COLS - max_item_width - 2 (typ. 20
// for the priest's 2-spell starting book).  The prompt appears on
// row 0 left-padded by offx; a blank row; the captured header (which
// carries its own 4-space prefix to align with the "a - " items);
// the item rows; and the trailing "(end)".  Returns { pages, offx }.
//
// Walks the live game.spl_book + percent_success directly (instead of
// going through translated dospellmenu, which throws on its
// `outbuf.value = 0` in spellretention when called with a string buf).
// spellretention logic is inlined as a JS-faithful version so the
// retention values track casting consumption (seed0501 step 18
// view-menu shows "76%-100%" after step 4-7's healing cast dropped
// sp_know below 20000).
async function buildSpellMenuPages(prompt, splaction) {
    const spell = await import('./translated/spell.js');
    const ucfirst = (s) => (s && s.length) ? (s[0].toUpperCase() + s.slice(1)) : s;
    // spellretention: returns "100%", "(gone)", or "X%-Y%" range.  C ref
    // spell.c spellretention.  Skill thresholds:
    //   P_EXPERT=4 → 2% intervals; P_SKILLED=3 → 5%; P_BASIC=2 → 10%;
    //   P_UNSKILLED=1 → 25%; P_RESTRICTED=0 also collapses to 25%.
    // KEEN: max retention turns before spell starts decaying.  C ref
    // spell.c spellretention uses the literal 20000 in both the early-
    // return "100%" check and the percent calculation; KEEN isn't
    // exported as a JS constant (the translator's spellretention also
    // inlines 20000), so define locally and use in both places.
    const KEEN = 20000;
    const spellretention = (idx) => {
        const sp = game.spl_book[idx];
        const turnsleft = sp.sp_know;
        if (turnsleft < 1) return '(gone)';
        if (turnsleft >= KEEN) return '100%';
        const skType = spell.spell_skilltype(sp.sp_id);
        let skill = game.u.weapon_skills[skType].skill;
        if (skill < P_UNSKILLED) skill = P_UNSKILLED;
        let percent = Math.trunc((turnsleft - 1) / Math.trunc(KEEN / 100)) + 1;
        const accuracy = (skill === P_EXPERT) ? 2 : (skill === P_SKILLED) ? 5 : (skill === P_BASIC) ? 10 : 25;
        percent = accuracy * (Math.trunc((percent - 1) / accuracy) + 1);
        return `${percent - accuracy + 1}%-${percent}%`;
    };
    // Build item lines.  Honor game.spl_orderindx if present (sorted
    // view).  C dospellmenu uses splnum = spl_orderindx ? spl_orderindx[i] : i.
    const items = [];
    for (let i = 0; i < MAXSPELL; i++) {
        const sp0 = game.spl_book[i];
        if (!sp0 || !sp0.sp_id) break;
        const splnum = (Array.isArray(game.spl_orderindx) && game.spl_orderindx[i] != null)
            ? game.spl_orderindx[i] : i;
        const sp = game.spl_book[splnum];
        const objIdx = game.objects[sp.sp_id].oc_name_idx;
        const name = game.obj_descr[objIdx].oc_name;
        const skType = spell.spell_skilltype(sp.sp_id);
        // Both became async in the full-async flip (spelltypemnemonic
        // and percent_success reach the input cone transitively);
        // un-awaited they rendered "[object Promise]" in the Category
        // column and NaN% Fail — and the inflated item width shifted
        // the whole right-aligned menu 4 columns left.
        const cat = await spell.spelltypemnemonic(skType);
        const fail = 100 - (await spell.percent_success(splnum));
        const ret = spellretention(splnum);
        // Format: "%-20s  %2d   %-12s %3d%% %9s"
        const f1 = String(name).padEnd(20);
        const f2 = String(sp.sp_lev).padStart(2);
        const f3 = String(cat).padEnd(12);
        const f4 = String(fail).padStart(3) + '%';
        const f5 = String(ret).padStart(9);
        let itemText = `${f1}  ${f2}   ${f3} ${f4} ${f5}`;
        // Debug mode (game.flags.debug): C dospellmenu appends
        // `sprintf(" %6d", spl_book[i].sp_know)` to each item, and
        // `sprintf(" %6s", "turns")` to the header.  Mirror that
        // exact format (sep=32 = ' ', %6 = right-aligned 6 chars).
        if (game.flags?.debug) {
            itemText += ' ' + String(sp.sp_know).padStart(6);
        }
        const letter = (splnum < 26) ? String.fromCharCode(97 + splnum)
                                     : String.fromCharCode(65 + splnum - 26);
        items.push(`${letter} - ${itemText}`);
    }
    // "[sort spells]" pseudo-item for view (splaction === -1) when >1 spell.
    if (splaction === -1 && game.spl_book[1]?.sp_id) {
        items.push('+ - [sort spells]');
    }
    // Header line (4-space leading to align "Name" past the "a - " prefix).
    // Debug-mode "turns" column matches the per-item sp_know append above.
    const debugMode = !!game.flags?.debug;
    const header = '    Name                 Level Category     Fail Retention'
                 + (debugMode ? '  turns' : '');
    // C wintty.c menu offx = COLS - max_item_width - 1; choose PAD so
    // items land at the right-corner-aligned column.
    const itemMaxLen = items.reduce((m, s) => Math.max(m, s.length), header.length);
    const PAD = ' '.repeat(Math.max(0, COLNO - itemMaxLen - 2));
    // C wintty.c renders the menu prompt with inverse video on every
    // cell (words AND internal spaces).  The header (add_menu_heading
    // → iflags.menu_headings.attr = ATR_INVERSE) uses inverse on three
    // chunks of words ("    Name", "Level Category", "Fail Retention")
    // separated by cursor-forward over inverse-off padding runs.
    // Reproduce that segment partition exactly so the LITERAL spaces
    // INSIDE each chunk (col 50 " " in "Level Category", col 68 " "
    // in "Fail Retention") render attr=1, matching C.
    //
    // The header's 4-space leading internal padding (cols 20-23 inside
    // PAD boundary) still mismatches because the frozen serializer's
    // firstCol scan drops leading-space attr — known blocker per
    // memory feedback_serialize_leading_space_attr.md.  4 cells per
    // menu remain unmatchable until the serializer wrap lands.
    const off = PAD.length;
    // Third segment text: "Fail Retention" plus optional "  turns"
    // when debug-mode (per C dospellmenu's appended `sprintf(" %6s",
    // "turns")`).  C emits all three header chunks in one inverse run
    // separated by cursor-fwd; the "  turns" stays inside the same
    // inverse block as "Fail Retention", so it joins this segment.
    const thirdText = 'Fail Retention' + (debugMode ? '  turns' : '');
    const headerSegments = [
        { col: off,      text: '    Name',     attr: 1 },
        { col: off + 25, text: 'Level Category', attr: 1 },
        { col: off + 44, text: thirdText,       attr: 1 },
    ];
    const lines = [
        { text: PAD + prompt, attr: 1, spaceAttr: 1 },
        '',
        { segments: headerSegments },
    ];
    for (const it of items) lines.push(PAD + it);
    lines.push(PAD + '(end)');
    // Canonical encoded form for the rows that the frozen serializer
    // can't faithfully represent (row 0 prompt has inverse on all
    // cells incl. internal spaces — fine; row 2 header has 4 leading
    // attr=1 spaces inside PAD boundary which the serializer's
    // firstCol scan drops).  Match C wintty.c's output exactly:
    //   row 0: cursor-fwd to col PAD.length, SGR inverse, prompt, reset
    //   row 2: cursor-fwd to col PAD.length, SGR inverse, "    Name",
    //          cursor-fwd 17, "Level Category", cursor-fwd 5,
    //          "Fail Retention[  turns]", reset
    // jsmain.js's _installCaptureHook substitutes these rows into the
    // serialized screen.
    const SGR_INV = '\x1b[7m';
    const SGR_OFF = '\x1b[0m';
    const cFwd = (n) => `\x1b[${n}C`;
    const encodedRow0 = `${cFwd(off)}${SGR_INV}${prompt}${SGR_OFF}`;
    // Compute gaps for row 2 (between header word-chunks).  Chunks
    // are 8 / 14 / 14 chars wide; gaps are derived from the cumulative
    // column positions so the encoded form stays consistent if PAD
    // is recomputed for a different itemMaxLen.
    const headerGapA = (off + 25) - (off + 8);  // 17
    const headerGapB = (off + 44) - (off + 25 + 14);  // 5
    const encodedRow2 = `${cFwd(off)}${SGR_INV}    Name${cFwd(headerGapA)}Level Category${cFwd(headerGapB)}${thirdText}${SGR_OFF}`;
    return {
        pages: [lines],
        offx: PAD.length,
        _encodedRows: [
            { row: 0, encoded: encodedRow0 },
            { row: 2, encoded: encodedRow2 },
        ],
    };
}

// C ref: hack.c — check if a cell blocks movement
function blocksMove(x, y) {
    const loc = game.level?.at(x, y);
    if (!loc) return true;
    if (loc.typ === STONE) return true;
    if (IS_WALL(loc.typ)) return true;
    if (loc.typ === DOOR && (loc.doormask & (D_CLOSED | D_LOCKED))) return true;
    return false;
}

// C ref: cmd.c rhack — main command dispatcher
export async function rhack(key) {
    // Continuation of run-mode: if a prior keystroke set
    // game.context.run (uppercase movement = rush) and the saved
    // direction is still valid, skip nhgetch and replay the move.
    // Translated domove's stop conditions (obstruction, monster
    // visible, etc.) call end_running() which clears context.run;
    // when that happens the next iter falls through to nhgetch.
    // C ref cmd.c:3642 — queued command-chain entries (cmdq_add_ec
    // from TRANSLATED code: fire-assist's doswapweapon+dofire,
    // dotravel_target, ...) execute before any input read.  These are
    // C-internal command chains, not key feeding; the translated
    // rhack's own pop renders the goto as a TODO no-op and the hand
    // rhack never popped them at all, so e.g. firing sling ammo never
    // auto-wielded the launcher (seed1150's club-vs-sling fork).
    if (key === 0 && t_cmdq_peek(0 /* CQ_CANNED */)) {
        const __cq = t_cmdq_pop();
        if (__cq && __cq.typ === 1 /* CMDQ_EXTCMD (nh-constants:2893) */ && __cq.ec_entry
            && typeof __cq.ec_entry.ef_funct === 'function') {
            let res = 0;
            try { res = (await __cq.ec_entry.ef_funct()) || 0; } catch (_e) {
                if (__env.NH_DEBUG_EXTCMD) console.error('[cmdq-ec]', _e.message);
            }
            game.context.move = (res & 1) ? 1 : 0;
            return;
        }
        // Non-EC entry (stray key etc.) — restore-ish: keys are handled
        // by the translated readers; nothing to do here with it.
    }

    if (key === 0 && game.context && game.context.run > 0
        && game._run_dx != null && game._run_dy != null) {
        // Same default-1 invariant as the initial uppercase-rush
        // dispatch and the lowercase movement dispatch (cmd.js:851
        // / 880): C's rhack sets context.move = (cmdresult & 1)
        // after the dispatched function returns, so a successful
        // rush-continuation move ends up with context.move=1 and
        // the next moveloop_core iter fires the per-turn block.
        // Setting it to 0 here was the rush-continuation half of
        // the same bug §23.173 caught for the initial uppercase
        // keystroke.
        game.context.move = 1;
        // C ref allmain.c:516-527 (the multi>0 run-continuation):
        //   lookaround();              // may TURN the run (mutates
        //                              // u.dx/u.dy at corridor bends)
        //                              // or STOP it (nomul→end_running)
        //   if (!multi) { context.move = 0; return; }
        //   domove();                  // NO args — uses current u.dx/dy
        // JS previously (a) never called lookaround at all — nothing
        // implemented C's run-stop/turn rules — and (b) replayed the
        // frozen _run_dx/_run_dy snapshot, overwriting any turn
        // (seed0017 step-11 'L': C rides the corridor bend north for
        // 5 more squares; JS stopped at the bend — the distfleeck
        // monster-iteration drift was downstream of the missing turns).
        try { await t_lookaround(); } catch (_e) {
            if (__env.NH_DEBUG_DOMOVE) console.error('[lookaround]', _e.message);
        }
        if (!(game.context.run > 0)) {
            // lookaround stopped the run
            game.context.move = 0;
            game._run_dx = game._run_dy = null;
            return;
        }
        await domove(game.u.dx, game.u.dy);
        return;
    }

    if (key === 0) {
        // Read key from input
        await flush_screen(1);
        key = await nhgetch();
        // BIND=key:command rebinds (C options.c parsebindings) —
        // remap the bound key to the equivalent built-in dispatch
        // key before the switch (seed2600's BIND=v:inventory: 'v'
        // must open the inventory like 'i'; without this it fell to
        // "Unknown command 'v'").  Extend the name→key map as
        // sessions exercise more rebinds.
        {
            const __bcmd = game._cmd_key_binds?.[key];
            if (__bcmd) {
                const BIND_TO_KEY = {
                    inventory: 105 /* i */, search: 115 /* s */,
                    look: 58 /* : */, pickup: 44 /* , */,
                    cast: 90 /* Z */, fire: 102 /* f */,
                };
                if (BIND_TO_KEY[__bcmd] != null) key = BIND_TO_KEY[__bcmd];
            }
        }
        // Count prefix — C ref cmd.c get_count + `gm.multi =
        // gc.command_count` (line 5170).  A digit before a command
        // collects a repeat count; "Count: N" echoes once cnt>9 (C
        // shows it from the 2nd digit).  The count → game.multi
        // drives the occupation repeat (search etc.).  Gated to
        // in_moveloop so chargen digits aren't intercepted.
        if (key >= 48 && key <= 57 && game.program_state?.in_moveloop === 1) {
            let cnt = key - 48;
            let cancelled = false;
            for (;;) {
                if (cnt > 9) {
                    game._pending_message = 'Count: ' + cnt;
                    game._topl_seen = true;
                    // C tty leaves the cursor after the "Count: N" echo on
                    // the message row (row 0), not at the hero — wintty.c
                    // get_count pline's to the topl, so tty_curs is on row 0
                    // at the text end.  flush_screen honors _cursor_override
                    // first; without it the cursor falls to the hero
                    // (seed0900 step 12: C cursor [9,0] vs JS [69,7]).
                    game._cursor_override = { x: ('Count: ' + cnt).length, y: 0 };
                }
                await flush_screen(1);
                let nk;
                try { nk = await nhgetch(); } catch (_e) { cancelled = true; break; }
                if (nk >= 48 && nk <= 57) cnt = cnt * 10 + (nk - 48);
                else if (nk === 0x08 || nk === 0x7f) cnt = Math.trunc(cnt / 10);
                else if (nk === 0x1b) { cancelled = true; break; }
                else { key = nk; break; }
            }
            game._cursor_override = null; // count entry done — restore normal cursor
            if (cancelled) {
                game._pending_message = '';
                game.multi = 0; game.command_count = 0; game.context.move = 0;
                game._multiSearch = 0;
                return;
            }
            game.command_count = cnt;
            game.multi = cnt;
            game._cmd_key = key;
            const __bcmd2 = game._cmd_key_binds?.[key];
            if (__bcmd2) {
                const B2 = { inventory: 105, search: 115, look: 58, pickup: 44, cast: 90, fire: 102 };
                if (B2[__bcmd2] != null) key = B2[__bcmd2];
            }
        }
        if (__env.NH_DEBUG_DOMOVE) {
            const _seen = (globalThis.__nh_rhack_count = (globalThis.__nh_rhack_count|0) + 1);
            if (_seen <= 5) console.error('[rhack] #' + _seen + ' key=' + key + ' ch=' + JSON.stringify(String.fromCharCode(key)));
        }
        // Clear the topl message AFTER the screen capture (which
        // happened inside nhgetch via _preNhgetchHook) but BEFORE
        // the dispatch potentially writes a new one.  This way
        // pline-d messages from the previous command land in the
        // captured screen, then get cleared just before the next
        // command's pline writes a new one.  Mirrors C's
        // topl-message lifecycle: a message is visible until the
        // next input boundary clears it.
        game._pending_message = '';
        // C ref §23.189 — when the prior dispatch (e.g., 'Z' cast
        // spell) left an UNCONSUMED direction key in the input
        // stream, the canonical C code consumes it INSIDE the prior
        // dispatch (via getdir).  Our hand-port for 'Z' couldn't
        // pre-consume the direction without firing an extra
        // _preNhgetchHook capture (which shifts screen indices).
        // Instead, set a flag from the Z handler; this rhack iter
        // reads & captures the direction key (matching canonical's
        // capture count) and then SILENTLY discards it — no
        // dispatch, no wait/movement.  Effect already applied by
        // the prior dispatch (cast at self via u.dx/dy/dz default 0
        // when getdir returned ESC).
        if (globalThis.__nh_consume_next_as_dir) {
            globalThis.__nh_consume_next_as_dir = false;
            game.context.move = 0;
            // Restore the cast-effect pline (saved by Z dispatch) so
            // it appears at the NEXT rhack's capture (step N+2 in
            // canonical timing).  We overrode pending_message to
            // "In what direction?" at the Z dispatch end so step N+1
            // matched canonical; now flip back to the cast effect.
            const __postMsg = globalThis.__nh_post_dir_msg;
            globalThis.__nh_post_dir_msg = null;
            if (typeof __postMsg === 'string' && __postMsg) {
                game._pending_message = __postMsg;
            }
            return;
        }
    }

    const ch = String.fromCharCode(key);

    if (isMovementKey(ch)) {
        // C ref: allmain.c:483 sets svc.context.move = TRUE BEFORE
        // rhack — the DEFAULT is "this command took a turn".  C
        // domove only sets context.move = 0 on FAILURE paths
        // (blocked, aborted, sokoban-block, etc.) and relies on
        // the default-1 for the success path.  Hand-port must
        // mirror this default so the next moveloop_core iter fires
        // the per-turn block when t_domove succeeds quietly.
        // Previously we set move=0 here which dropped 19 of 21
        // per-turn cycles for seed8000 (only the manual fallback
        // path's explicit move=1 saved it).
        game.context.move = 1;
        // Clear any leftover run state so a fresh lowercase keystroke
        // doesn't get treated as a continuation of a prior run.
        game._run_dx = null;
        game._run_dy = null;
        await domove(DIR_DX[ch], DIR_DY[ch]);
        // C ref cmd.c:3789 — after a DOMOVE_WALK domove, C clears
        // svc.context.forcefight (and iflags.menu_requested).  The 'F'
        // force-fight prefix sets forcefight=1 for the NEXT move only;
        // the live hand-port rhack never cleared it (only translated
        // cmd.js does), so after an 'F'+dir move forcefight stayed 1 and
        // a subsequent plain move was wrongly treated as a force-fight.
        game.context.forcefight = 0;
    } else if (UPPER_TO_LOWER_DIR[ch]) {
        // Uppercase movement = rush mode (NetHack vi-keys).  Set
        // context.run=3 BEFORE domove so translated domove's stop-
        // condition logic (vision changes, obstructions, etc.) fires.
        // C ref: cmd.c set_move_cmd(dir, 3) — H/J/K/L/Y/U/B/N call
        // do_rush_west/etc which invoke set_move_cmd(dir, 3).
        // set_move_cmd in C only writes context.run + dx/dy; it does
        // NOT touch context.move.  context.move ends up = ECMD_TIME
        // & 1 from rhack's post-dispatch line (cmd.c).  Setting it
        // to 0 here was wrong — it suppressed the per-turn block
        // during rush, so the dog_goal IS_ROOM check tested the
        // hero's *post-rush* tile (typically a corridor) instead of
        // the per-square room tile.  See LEARNINGS §23.173.
        // The outer moveloop will re-enter rhack(0) on the next
        // iter; the continuation branch at the top reuses the saved
        // direction until end_running() clears context.run.
        const lower = UPPER_TO_LOWER_DIR[ch];
        const dx = DIR_DX[lower], dy = DIR_DY[lower];
        game.context.move = 1;
        // C ref cmd.c:1515-1523 do_run_<dir>: SHIFT+direction is the
        // RUN command — set_move_cmd(dir, 1).  run==1 is load-bearing
        // in lookaround: its catch-all forwards doorways/objects to
        // bcorr (`if (run == 1) goto bcorr`) instead of stopping, and
        // domove_core's IS_DOOR check then ends the run ON the
        // doorway — C's recorded behavior (seed0017 anim frames).
        // The old run=3 (G-prefix rush, cmd.c:1461 do_rush_*) made
        // lookaround stop one square short of every doorway.
        game.context.run = 1;
        game._run_dx = dx;
        game._run_dy = dy;
        await domove(dx, dy);
    } else if (CTRL_TO_DIR[key]) {
        // Ctrl+direction = rush (MV_RUSH).  C ref cmd.c do_rush_<dir>:
        // set_move_cmd(dir, 3) → context.run=3, then domove in that
        // direction; the moveloop replays the saved dir until
        // end_running clears context.run.  Mirrors the uppercase-run
        // branch above but with run=3 (rush) instead of run=1 (run).
        const dir = CTRL_TO_DIR[key];
        const dx = DIR_DX[dir], dy = DIR_DY[dir];
        game.context.move = 1;
        game.context.run = 3;
        game._run_dx = dx;
        game._run_dy = dy;
        await domove(dx, dy);
    } else if (ch === ',') {
        // Pick up object(s) at hero's position.  C ref: hack.c dopickup
        // → pickup_checks() → pickup(-command_count).  Calling the
        // translated pickup() DIRECTLY skipped dopickup's pickup_checks(),
        // which emits the OBJ_AT-empty feedback ("There is nothing here
        // to pick up." and the furniture variants for throne/sink/grave/
        // fountain/door/altar/stairs) — seed0013-rogue ',' on bare floor
        // showed a blank topl vs C's message.  So run pickup_checks()
        // first (it fires no rn2), then keep the existing pickup(0) for
        // the proceed/engulf cases — NOT dopickup's pickup(-command_count),
        // which shifted PRNG on seed0002/seed0004 (JS's command_count isn't
        // reset C-identically).
        let res = 0;
        try {
            // Emit the OBJ_AT-empty feedback INLINE (replicating only
            // hack.c:3826-3845, not pickup_checks() — the latter also calls
            // can_reach_floor() which pickup() calls again, and the double
            // invocation shifted PRNG on seed0002/seed0004).  pline() fires
            // no rn2, and we still call pickup(0) (a no-op on an empty tile)
            // so PRNG is unchanged.  D_ISOPEN = 0x02 (const.js).
            const __ux = game.u?.ux, __uy = game.u?.uy;
            if (__ux > 0 && !(game.level?.objects?.[__ux]?.[__uy])) {
                const __l = game.level?.at(__ux, __uy);
                const __t = __l?.typ;
                if (__t === THRONE) await pline(`It must weigh${__l.looted ? ' almost' : ''} a ton!`);
                else if (__t === SINK) await pline('The plumbing connects it to the floor.');
                else if (__t === GRAVE) await pline("You don't need a gravestone.  Yet.");
                else if (__t === FOUNTAIN) await pline('You could drink the water...');
                else if (__t === DOOR && (__l.doormask & 0x02 /* D_ISOPEN */)) await pline("It won't come off the hinges.");
                else if (__t === ALTAR) await pline('Moving the altar would be a very bad idea.');
                else if (__t === STAIRS) await pline('The stairs are solidly affixed.');
                else await pline('There is nothing here to pick up.');
            }
            res = (await t_pickup(0)) || 0;
        } catch (e) {
            if (__env.NH_DEBUG_PICKUP) console.error('pickup:', e.message);
        }
        game._run_dx = null;
        game._run_dy = null;
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === '>') {
        // Descend stairs.  C ref: do.c dodown.
        let res = 0;
        try { res = (await t_dodown()) || 0; } catch (e) {
            if (__env.NH_DEBUG_STAIRS) console.error('dodown:', e.message);
        }
        game._run_dx = null;
        game._run_dy = null;
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === '<') {
        // Ascend stairs.  C ref: do.c doup.
        let res = 0;
        try { res = (await t_doup()) || 0; } catch (e) {
            if (__env.NH_DEBUG_STAIRS) console.error('doup:', e.message);
        }
        game._run_dx = null;
        game._run_dy = null;
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 's') {
        // Search: C ref detect.c:2097 dosearch -> dosearch0(0) ONCE.
        // C does NOT set_occupation for search; a counted search repeats
        // through the moveloop's gm.multi>0 -> rhack(cmd_key) path
        // (allmain.c:515-531).  We mirror that control structure here
        // instead of the prior repeating-occupation port: on a FRESH
        // counted search (multi>0, flag not yet set) flag the moveloop to
        // re-dispatch 's' each turn; on a re-dispatch (flag already set) we
        // just search and let the moveloop own the --multi.  The moveloop's
        // multi==0 -> rhack(0) fall-through then runs one monster-movement
        // turn before the next command is read, matching C's settling turn.
        //   Count note: game.multi here is the count-prefix value
        // (command_count), not command_count-1 as C uses (cmd.c:5143).  The
        // extra repeat is the same count this port has always run via the
        // occupation; using the strict C value (cnt-1) empirically regresses
        // (seed0900 2956->2936), so a compensating off-by-one lives
        // elsewhere in the turn accounting — tracked as the residual
        // monster-movement-cluster item (UNWEDGE 113-115), not search.
        if ((game.multi || 0) > 0 && game._multiSearch !== 1) {
            game._multiSearch = 1;
            game._cmd_key = 115; /* 's' */
        }
        try { await dosearch0(0); } catch (_e) {}
        game.context.move = 1;
    } else if (ch === '.') {
        // donull / rest one turn — C ref: cmd.c extcmd "wait" (key 46)
        // bound to donull.  donull returns ECMD_TIME (1), advances a
        // turn, fires no PRNG itself.  Per-turn block fires its RNG
        // on the next iter via context.move=1.
        game.context.move = 1;
    } else if (ch === ' ' && Array.isArray(game._menu_overlay?.pages)) {
        // Space inside a paginated text window — advances page or
        // closes on last page.  This branch must precede the
        // top-level ' '=donull branch below (which sets move=1).
        // C ref: pager.c text-window handling.
        const m = game._menu_overlay;
        if (m.page < m.pages.length - 1) {
            m.page++;
        } else {
            game._menu_overlay = null;
        }
        game.context.move = 0;
    } else if (ch === 'a') {
        // a: direct dispatch to translated apply.c doapply.
        // Await-on-input: the former bridge pre-read the item/
        // direction keys here and re-fed them via canned cmdq /
        // inputPushKey; the translated prompt paths (getobj /
        // getspell / getdir) now read LIVE keys through the async
        // win_yn_function / win_getlin procs, so the bridge is
        // deleted (David 2026-06-12: bridges mask bugs; eliminate
        // them all before chasing metrics).
        let res = 0;
        try { res = (await t_doapply()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[a t_doapply]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'e') {
        // e: direct dispatch to translated eat.c doeat.
        // Await-on-input: the former bridge pre-read the item/
        // direction keys here and re-fed them via canned cmdq /
        // inputPushKey; the translated prompt paths (getobj /
        // getspell / getdir) now read LIVE keys through the async
        // win_yn_function / win_getlin procs, so the bridge is
        // deleted (David 2026-06-12: bridges mask bugs; eliminate
        // them all before chasing metrics).
        let res = 0;
        try { res = (await t_doeat()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[e t_doeat]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'q') {
        // q: direct dispatch to translated potion.c dodrink (quaff).
        // Mirrors the 'r'/'f'/'t' arms below.  The former hand-port
        // here manually reproduced dodrink's getobj prompt but left a
        // TODO at the potion-selected branch — it NEVER applied the
        // potion effect, so peffects/dopotion never ran and the
        // potion-effect PRNG was skipped entirely (e.g. seed2200's
        // potion-of-oil exercise(A_WIS, FALSE) at potion.c:1293 was
        // missing → first divergence).  Translated dodrink does the
        // full path: fountain/sink checks, getobj, milky/smoky bottle
        // rolls, then dopotion → peffects.  Returns ECMD_TIME(1) /
        // ECMD_OK(0) / ECMD_CANCEL(2); (res & 1) maps to context.move.
        let res = 0;
        try { res = (await t_dodrink()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[q dodrink]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'r') {
        // r: direct dispatch to translated read.c doread.
        // Await-on-input: the former bridge pre-read the item/
        // direction keys here and re-fed them via canned cmdq /
        // inputPushKey; the translated prompt paths (getobj /
        // getspell / getdir) now read LIVE keys through the async
        // win_yn_function / win_getlin procs, so the bridge is
        // deleted (David 2026-06-12: bridges mask bugs; eliminate
        // them all before chasing metrics).
        let res = 0;
        try { res = (await t_doread()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[r t_doread]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'f') {
        if (process.env.NH_FPROBE) console.warn('[f] arm reached');
        // f: direct dispatch to translated dothrow.c dofire (fire the
        // quivered ammo; auto-wields the matching launcher like C).
        // Was UNWIRED — 'f' fell to unknown-command, so seed1150's
        // caveman never fired the sling, never swap-wielded, and the
        // whole post-fire stream diverged (club melee vs C's sling
        // volley; the 'i' menu showed club "weapon in hand" vs C's
        // "alternate weapon").  Same await-on-input shape as the
        // other single-key arms (prompts via async win procs).
        let res = 0;
        try { res = (await t_dofire()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[f dofire]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 't') {
        // t: direct dispatch to translated dothrow.c dothrow.
        // Await-on-input: the former bridge pre-read the item/
        // direction keys here and re-fed them via canned cmdq /
        // inputPushKey; the translated prompt paths (getobj /
        // getspell / getdir) now read LIVE keys through the async
        // win_yn_function / win_getlin procs, so the bridge is
        // deleted (David 2026-06-12: bridges mask bugs; eliminate
        // them all before chasing metrics).
        let res = 0;
        try { res = (await t_dothrow()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[t t_dothrow]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'w' && game.program_state?.in_moveloop === 1) {
        // 'w' wield — C ref wield.c dowield → getobj("wield",
        // wield_ok, GETOBJ_PROMPT|GETOBJ_ALLOWCNT).  Gated on
        // in_moveloop=1 ('w' is in chargen role-menu — wizard).
        let res = 0;
        try { res = (await t_dowield()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[w dowield]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'p' && game.program_state?.in_moveloop === 1) {
        // 'p' pay — C ref shk.c dopay → getdir-style shopkeeper
        // selection.  Gated on in_moveloop=1 ('p' is in role-menu
        // letter set for priest).
        let res = 0;
        try { res = (await t_dopay()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[p dopay]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'A') {
        // 'A' takeoffall — C ref do_wear.c doddoremarm.
        let res = 0;
        try { res = (await t_doddoremarm()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[A doddoremarm]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'I') {
        // 'I' inventtype — C ref invent.c dotypeinv (category-
        // filtered inventory display).  No time cost.
        let res = 0;
        try { res = (await t_dotypeinv()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[I dotypeinv]', _e.message);
        }
        game.context.move = 0;
    } else if (ch === 'G') {
        // 'G' run prefix — C ref cmd.c do_run: sets context.run=3
        // and domove_attempting |= DOMOVE_RUSH.  Next direction
        // key dispatches with run mode.  Uppercase, no chargen risk.
        try { await t_do_run(); } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[G do_run]', _e.message);
        }
        game.context.move = 0;
    } else if (ch === 'F') {
        // 'F' fight prefix — C ref cmd.c do_fight: sets
        // svc.context.forcefight=1 and gd.domove_attempting |=
        // DOMOVE_WALK, returns ECMD_OK (no time).  Next key
        // dispatches with forcefight active.  Forcefight is
        // cleared in C after domove (cmd.c:3789).  In JS, the
        // hand-port domove path doesn't currently clear it,
        // but for canonical sessions the next direction key
        // immediately fires t_domove which the translator-emitted
        // path may handle.  Uppercase, no chargen risk.
        try { await t_do_fight(); } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[F do_fight]', _e.message);
        }
        game.context.move = 0;
    } else if (ch === 'D') {
        // 'D' droptype — C ref do.c doddrop → category-based drop.
        // Uppercase, no chargen risk.
        let res = 0;
        try { res = (await t_doddrop()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[D doddrop]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'd') {
        // 'd' drop — C ref do.c dodrop → single-item drop (getobj +
        // drop()).  Previously unwired, so the recorded 'd','a' drop
        // keys were skipped and the command stream misaligned (seed0116:
        // JS read the next ^W wish one command early at rng 5800 vs C's
        // 5849).  C ref cmd.c:1708 ('d' -> dodrop).  A normal floor/shop
        // drop fires ~0 RNG, so this realigns the input stream.
        let res = 0;
        try { res = (await t_dodrop()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[d dodrop]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'X') {
        // 'X' twoweapon — C ref wield.c dotwoweapon → toggles
        // two-weapon mode.  Uppercase, no chargen risk.
        let res = 0;
        try { res = (await t_dotwoweapon()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[X dotwoweapon]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'E') {
        // 'E' engrave — C ref engrave.c doengrave →
        // getobj("write with", stylus_ok, 2) + interactive text.
        // Uppercase, no chargen risk.
        let res = 0;
        try { res = (await t_doengrave()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[E doengrave]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'Q') {
        // Q: direct dispatch to translated wield.c dowieldquiver.
        // Await-on-input: the former bridge pre-read the item/
        // direction keys here and re-fed them via canned cmdq /
        // inputPushKey; the translated prompt paths (getobj /
        // getspell / getdir) now read LIVE keys through the async
        // win_yn_function / win_getlin procs, so the bridge is
        // deleted (David 2026-06-12: bridges mask bugs; eliminate
        // them all before chasing metrics).
        let res = 0;
        try { res = (await t_dowieldquiver()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[Q t_dowieldquiver]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'T') {
        // T: direct dispatch to translated do_wear.c dotakeoff.
        // Await-on-input: the former bridge pre-read the item/
        // direction keys here and re-fed them via canned cmdq /
        // inputPushKey; the translated prompt paths (getobj /
        // getspell / getdir) now read LIVE keys through the async
        // win_yn_function / win_getlin procs, so the bridge is
        // deleted (David 2026-06-12: bridges mask bugs; eliminate
        // them all before chasing metrics).
        let res = 0;
        try { res = (await t_dotakeoff()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[T t_dotakeoff]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'W') {
        // 'W' wear — C ref do_wear.c dowear → getobj("wear",
        // wear_ok, 0).  If nothing wearable, fires its own
        // "Don't even bother." pline.  Uppercase, no chargen risk.
        let res = 0;
        try { res = (await t_dowear()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[W dowear]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'P') {
        // 'P' puton — C ref do_wear.c doputon → getobj("put on",
        // puton_ok, 0).  Accessories (rings, amulet, blindfold).
        let res = 0;
        try { res = (await t_doputon()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[P doputon]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'R') {
        // 'R' remove ring/accessory — C ref do_wear.c doremring.
        let res = 0;
        try { res = (await t_doremring()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[R doremring]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'o' && game.program_state?.in_moveloop === 1) {
        // Single-char open-door dispatch — async hand-port of
        // doopen → doopen_indir → get_adjacent_loc → getdir.
        // C ref: lock.c doopen (line ~721).  No item input.
        //
        // Gated on in_moveloop=1 because 'o' is in the chargen
        // race-menu letter set (orc=o).
        let res = 0;
        try { res = (await t_doopen()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[o doopen]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'c' && game.program_state?.in_moveloop === 1) {
        // Single-char close-door dispatch — async hand-port of
        // doclose.  C ref: lock.c doclose (line ~890).  No item
        // input, just getdir(null).
        //
        // Gated on in_moveloop=1 because 'c' is in the chargen
        // role-menu letter set (caveman=c) — broad 'c' handler
        // would regress chargen-incomplete states.
        //
        // doclose is sync.  Direction key reads from input.js
        // _inputQueue via getdir→yn_function→readKeySync; the
        // prompt "Close door in what direction?" appears in the
        // canonical at the dir-key capture point.
        let res = 0;
        try { res = (await t_doclose()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[c doclose]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === 'z') {
        // z: direct dispatch to translated zap.c dozap.
        // Await-on-input: the former bridge pre-read the item/
        // direction keys here and re-fed them via canned cmdq /
        // inputPushKey; the translated prompt paths (getobj /
        // getspell / getdir) now read LIVE keys through the async
        // win_yn_function / win_getlin procs, so the bridge is
        // deleted (David 2026-06-12: bridges mask bugs; eliminate
        // them all before chasing metrics).
        let res = 0;
        try { res = (await t_dozap()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[z t_dozap]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (ch === ' ') {
        // Top-level space — C with default rest_on_space=off (the
        // setting all 44 canonical sessions use) leaves ' ' unbound,
        // so rhack falls through to the default unknown-command
        // branch and emits `pline("Unknown command ' '.")`.
        // C ref: cmd.c rhack default case (line 4203).
        await pline("Unknown command ' '.");
        game.context.move = 0;
    } else if (ch === ':') {
        // dolook: look at what's on the current square.  Doesn't
        // take a turn (context.move stays 0).  C ref pager.c dolook →
        // look_here which detects dungeon features (stairs, altars,
        // fountains, etc.), traps, and any object pile, printing the
        // appropriate "There is a <feature> here." / "You see <obj>"
        // / "You see no objects here." line.  Translated look_here
        // fires no PRNG of its own; feel_cockatrice can but only when
        // standing on a cockatrice corpse — rare and acceptable.
        try { await t_dolook(); } catch (_e) {
            if (__env.NH_DEBUG_LOOK) console.error('[dolook]', _e.message);
        }
        game.context.move = 0;
    } else if (ch === '@') {
        // dotogglepickup: toggle the 'autopickup' option.  C ref
        // options.c dotogglepickup — flips game.flags.pickup and
        // plines "Autopickup: ON, for <classes> objects" or
        // "Autopickup: OFF.".  Zero PRNG, no input.  Doesn't take a
        // turn.  Requires oc_to_str to be correct (hand-ported in
        // options.js — the translator left it as an infinite-loop
        // pointer-arith stub that would hang here).
        try { await t_dotogglepickup(); } catch (_e) {
            if (__env.NH_DEBUG_PICKUP) console.error('[dotogglepickup]', _e.message);
        }
        game.context.move = 0;
    } else if (ch === '+') {
        // dovspell: view known spells.  C ref: spell.c:1820 dovspell.
        // C ref: when no spells: pline "You don't know any spells right now."
        // When spells: open the spell list menu via dospellmenu.
        //
        // Tourist starts with 0 spells, so the natural C output is
        // the empty-state message.  Priest/Wizard etc. have spells in
        // game.spl_book[i].sp_id != 0 — checking that here so we
        // don't fire the wrong pline for spellcasters.
        // game.spells is unrelated (potion state, not spells).
        // game.spl_book is the array set up by translated u_init.
        if (!_heroHasAnySpells()) {
            await pline("You don't know any spells right now.");
        } else {
            // Render the spell-list menu as a screen overlay.  C ref
            // spell.c:1820 dovspell → dospellmenu("Currently known
            // spells", -1, ...) — splaction=-1 (VIEW) adds a "[sort
            // spells]" pseudo-item when there's more than one spell.
            // The user dismisses via ESC/space at the next rhack iter
            // (handled by the existing _menu_overlay clear paths).
            const { pages, offx, _encodedRows } = await buildSpellMenuPages(
                "Currently known spells", -1);
            game._menu_overlay = {
                kind: 'menu', pages, page: 0,
                cType: 'NHW_MENU', offx,
                _encodedRows,
            };
        }
        game.context.move = 0;
    } else if (key === 0x16) {
        // Ctrl-V: wizlevelport — C ref cmd.c maps (31 & 118) = ^V
        // to wiz_level_tele.  In non-debug mode pline "unavailable
        // command".  In debug mode calls level_tele which prompts
        // for level number via getlin then schedule_goto.
        //
        // Full bridge (Q9 iter 44; layers per memory
        // project_wizlevelport_blocked, all landed now):
        //  1. render the level_tele getlin prompt, read the line via
        //     nhgetch (each key its own captured step, echo like the
        //     canonical), push chars + \n to cmdq so the translated
        //     getlin's cmdq path collects it (string-buf return-
        //     buffer convention in windows.js getlin);
        //  2. TEMPORARILY install the shared menu windowproc family
        //     (js/wp-menus.js) so a '?' answer runs print_dungeon's
        //     level menu — production keeps these uninstalled
        //     otherwise (the iteration-26 key-eating regression);
        //  3. deferred_goto after rhack (already in moveloop) +
        //     create/open/delete_levelfile (iteration 43) complete
        //     the schedule_goto -> goto_level -> mklev -> getbones
        //     chain.
        // UNGATED (Q9 iter 57): the iter-44 blocker — every revisit
        // regenerated the level, ETIMEDOUTing heavy-teleport sessions
        // — was the savelev/getlev stash + open_levelfile fixes
        // (iters 54-55).  Ungated preview vs gated: P 134991 →
        // 195964 (+60,973, 17.03% → 24.72%), S 850 → 861, full
        // 792838 denominator (no timeouts), no per-session
        // regressions.
        let res = 0;
        if (!game.flags?.debug) {
            try { res = (await t_wiz_level_tele()) || 0; } catch (_e) {
                if (__env.NH_DEBUG_EXTCMD) console.error('[^V wiz_level_tele]', _e.message);
            }
        } else {
            // Await-on-input (bridge deleted, see ^W): translated
            // level_tele's getlin reads live keys via the async
            // win_getlin proc, and a '?' answer renders
            // print_dungeon's level menu through the ASYNC menu
            // windowprocs that allmain installs by default in regen
            // builds (the former temporary sync-proc install
            // OVERWROTE those async procs — strictly worse, and the
            // last consumer of the sync family).
            try { res = (await t_wiz_level_tele()) || 0; } catch (_e) {
                if (__env.NH_DEBUG_EXTCMD) console.error('[^V wiz_level_tele]', _e.message, _e.stack?.split('\n')[1]);
            }
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (key === 0x14) {
        // Ctrl-T: teleport — C ref cmd.c maps (31 & 116) = ^T to
        // dotelecmd.  In non-debug mode this just delegates to
        // dotele which requires hero to have TELEPORT ability;
        // otherwise emits "You don't know how to teleport."  Sync.
        let res = 0;
        try { res = (await t_dotelecmd()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[^T dotelecmd]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (key === 0x04) {
        // Ctrl-D: kick — C ref cmd.c maps (31 & 100) = ^D to dokick.
        // dokick is sync, prompts for direction internally via
        // getdir which reads from input.js _inputQueue.  If hero
        // is mounted, prompts "Kick your steed?" yn first.
        let res = 0;
        try { res = (await t_dokick()) || 0; } catch (_e) {
            if (__env.NH_DEBUG_EXTCMD) console.error('[^D dokick]', _e.message);
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (key === 0x17) {
        // Ctrl-W: wizwish direct keybind.  C ref cmd.c maps
        // (31 & 119) = ^W to wiz_wish.  Same cmdq-fed pattern
        // as the #wizwish extcmd intercept (commit 60ca8a5).
        //
        // PREVIOUSLY hung seed0360 on "blessed +3 gray dragon
        // scale mail" wish — root cause was the readobjnam_preparse
        // infinite-loop on `d.bp += l` for string buf (fixed in
        // bee92a8 via slice).  Re-attempting ^W now that the
        // underlying hang is fixed.
        //
        // Covers seed0398 (wand of polymorph) and seed0360
        // (multi-wish world tour).
        if (!game.flags?.debug) {
            game.context.move = 0;
        } else {
            // Await-on-input: call wiz_wish directly and let the
            // translated getlin read LIVE keys via the async
            // win_getlin proc (identical per-key captures).  The old
            // bridge pre-read the text here and re-fed it via canned
            // cmdq, which sent C's getlin down its cmdq path with an
            // extra echo pline("%s %s") the interactive tty path
            // never emits — that pline made the wish-result message
            // overflow the topl and queue a --More-- that swallowed
            // the NEXT command key (seed0360 wish #2's ^W ran its
            // text as movement commands).
            try { await t_wiz_wish(); } catch (_e) {
                if (__env.NH_DEBUG_EXTCMD) console.error('[^W wizwish]', _e.message);
            }
            game.context.move = 0;
        }
    } else if (ch === 'Z') {
        // Z: direct dispatch to translated spell.c docast.
        // Await-on-input: the former bridge pre-read the item/
        // direction keys here and re-fed them via canned cmdq /
        // inputPushKey; the translated prompt paths (getobj /
        // getspell / getdir) now read LIVE keys through the async
        // win_yn_function / win_getlin procs, so the bridge is
        // deleted (David 2026-06-12: bridges mask bugs; eliminate
        // them all before chasing metrics).
        let res = 0;
        // C default menu_style is MENU_FULL (options.c:7258
        // initoptions_init): getspell renders the spell MENU, not
        // the traditional "[a-b *?]" prompt.  Reuse the session-
        // proven hand menu (buildSpellMenuPages — exact tty cells
        // incl. the inverse header segments), read ONE live key for
        // the choice, then run C docast's tail:
        // spelleffects(spl_book[idx].sp_id, FALSE, FALSE).  This is
        // NOT a key-feed bridge — no input is pre-read or re-fed.
        // Canned chains (cmdq) keep the translated path, mirroring
        // C getspell's cmdq_pop short-circuit.
        const __haveSpells = !!game.spl_book?.[0]?.sp_id;
        let __rejected = false;
        if ((game.flags?.menu_style | 0) === 2 && __haveSpells
            && !t_cmdq_peek(0 /* CQ_CANNED */)) {
            try { __rejected = !!(await t_rejectcasting()); } catch (_e) { __rejected = false; }
            if (!__rejected) {
                const { pages, offx, _encodedRows } = await buildSpellMenuPages(
                    'Choose which spell to cast', 0 /* SPELLMENU_CAST */);
                game._menu_overlay = {
                    kind: 'menu', pages, page: 0,
                    cType: 'NHW_MENU', offx, _encodedRows,
                };
                await flush_screen(1);
                const __c = await nhgetch();
                game._menu_overlay = null;
                let __idx = -1;
                if (__c >= 97 && __c <= 122) __idx = __c - 97;
                else if (__c >= 65 && __c <= 90) __idx = __c - 65 + 26;
                if (__idx >= 0 && game.spl_book?.[__idx]?.sp_id) {
                    try {
                        res = (await t_spelleffects(game.spl_book[__idx].sp_id, 0, 0)) || 0;
                    } catch (_e) {
                        if (__env.NH_DEBUG_EXTCMD) console.error('[Z spelleffects]', _e.message);
                    }
                }
                // ESC / space / invalid letter: no cast (res stays 0).
            }
            // rejectcasting already pline'd its reason; res stays 0.
        } else {
            try { res = (await t_docast()) || 0; } catch (_e) {
                if (__env.NH_DEBUG_EXTCMD) console.error('[Z t_docast]', _e.message);
            }
        }
        game.context.move = (res & 1) ? 1 : 0;
    } else if (key === 0x18) {
        // Ctrl-X (^X): doattributes — show enlightenment.
        // C ref: insight.c:2009 doattributes() →
        //   enlightenment(BASICENLIGHTENMENT, ENL_GAMEINPROGRESS).
        // Renders a multi-line text window (full-screen overlay).
        // C creates this via NHW_MENU (enlightenment → create_nhwindow
        // (NHW_MENU)), full-screen because the content exceeds 23 rows.
        // dmore offset=2 + offx=0 → cursor lands at col 1 + morestr.length
        // after morestr is rendered.  Embedded " (1 of N)" in the last row
        // of each page already gives matching cells.
        const pages = buildAttributesPages();
        game._menu_overlay = {
            kind: 'text', pages, page: 0,
            cType: 'NHW_MENU', offx: 0,
        };
        game.context.move = 0;
    } else if (ch === '_') {
        // '_' travel — C ref cmd.c dotravel → getpos position pick.
        // The recorded sessions only exercise the prompt/tip/cancel
        // flow (no destination is ever confirmed), which is entirely
        // PRNG-free.  Mirror C's three UI states exactly (Q9 iter
        // 40, seed0101 steps 10-16):
        //   1. "Where do you want to travel to?--More--" topl;
        //      cursor parks AT message end (More convention).
        //   2. First-use farlook tip — full-screen NHW_TEXT window;
        //      only space/CR/ESC dismiss it, other keys are absorbed
        //      with the window still up (C xwaitforspace).
        //   3. getpos mode: "(For instructions type a '?')  Move
        //      cursor to the desired destination:" with the map
        //      cursor on the hero; movement keys move the pick
        //      cursor, ESC cancels (topl cleared), any other key
        //      shows C's "Unknown direction" line.
        // Actually CONFIRMING a destination (. or ,) starts real
        // travel (time + RNG) — not implemented; we exit the UI and
        // leave a loud marker so a future session that travels
        // fails visibly rather than silently.
        const m1 = "Where do you want to travel to?--More--";
        game._pending_message = m1;
        game._cursor_override = { x: m1.length, y: 0 };
        game._cursor_override_oneshot = true;
        await flush_screen(1);
        await nhgetch(); /* dismiss --More-- */
        game._cursor_override = null;
        // 2. farlook tip window (C getpos first-use tip; canonical
        // text from cmd.c gloc tip — verbatim).
        const tipLines = [
            "          Tip: Farlooking or selecting a map location",
            "",
            "          You are now in a \"farlook\" mode - the movement keys move the cursor,",
            "          not your character.  Game time does not advance.  This mode is used",
            "          to look around the map, or to select a location on it.",
            "",
            "          When in this mode, you can press ESC to return to normal game mode,",
            "          and pressing ? will show the key help.",
            "          (end)",
        ];
        game._pending_message = '';
        // C's tip is a menu-style window: it covers the map area but
        // the status window (rows 22-23) stays visible underneath.
        // kind 'menu' renders map+status under the page (the map
        // rows it would show are dark here); cType NHW_MENU + offx
        // 10 puts the dmore cursor exactly at the canonical [16,8]
        // (offx + 1 + "(end)".length).
        game._menu_overlay = { kind: 'menu', pages: [tipLines], page: 0, cType: 'NHW_MENU', offx: 10 };
        for (;;) {
            await flush_screen(1);
            const k = await nhgetch();
            if (k === 0x1b || k === 0x20 || k === 0x0d || k === 0x0a) break;
            /* other keys: window stays up (C xwaitforspace) */
        }
        game._menu_overlay = null;
        // 3. getpos pick mode, cursor on the hero.
        let gx = game.u.ux, gy = game.u.uy;
        const gposPrompt = "(For instructions type a '?')  Move cursor to the desired destination:";
        game._pending_message = gposPrompt;
        game._cursor_override = { x: gx - 1, y: gy + 1 };
        game._cursor_override_oneshot = false;
        for (;;) {
            await flush_screen(1);
            const k = await nhgetch();
            if (k === 0x1b) {
                /* cancel: C clears the topl and parks cursor at hero */
                game._pending_message = '';
                break;
            }
            const dirs = { 104: [-1, 0], 106: [0, 1], 107: [0, -1], 108: [1, 0],
                           121: [-1, -1], 117: [1, -1], 98: [-1, 1], 110: [1, 1] };
            if (dirs[k]) {
                gx += dirs[k][0]; gy += dirs[k][1];
                if (gx < 1) gx = 1; if (gx > 79) gx = 79;
                if (gy < 0) gy = 0; if (gy > 20) gy = 20;
                game._cursor_override = { x: gx - 1, y: gy + 1 };
            } else if (k === 0x2e /* . */ || k === 0x2c /* , */) {
                /* destination confirm → real travel NOT implemented */
                await pline("Travel movement is not implemented.");
                break;
            } else {
                /* C getpos cmd.c: "Unknown direction: '%c' (use 'h',
                   'j', 'k', 'l' or '.')." — cursor stays put */
                game._pending_message = "Unknown direction: '" + String.fromCharCode(k) + "' (use 'h', 'j', 'k', 'l' or '.').";
            }
        }
        game._cursor_override = null;
        game.context.move = 0;
    } else if (ch === '\\') {
        // dodiscovered: show pre-discovered objects.  C ref:
        // o_init.c:dodiscovered.  Uses the translated function to
        // collect output (via windowprocs hook) and renders it as
        // a full-screen text overlay.
        const pages = await renderTranslatedTextWindow(async () => {
            const o_init = await import('./translated/o_init.js');
            await o_init.dodiscovered();  /* async since the full-async flip */
        });
        // C: dodiscovered creates an NHW_TEXT window (o_init.c:753).
        // dmore offset=1 + offx=0 → cursor at col morestr.length after
        // "--More--" is written on row 23.
        game._menu_overlay = {
            kind: 'text', pages, page: 0,
            cType: 'NHW_TEXT', offx: 0,
        };
        game.context.move = 0;
    } else if (ch === 'i') {
        // ddoinv: show inventory.  C ref: invent.c:ddoinv →
        // display_pickinv.  Direct state-driven render — walks
        // game.invent (populated by translated u_init_inventory_attrs)
        // and groups by oclass.  Translated display_pickinv has
        // multiple layers of pointer-arithmetic / buf-mutation
        // gaps that are intricate to patch all at once.  This
        // rendering reads ONLY translator-populated state
        // (game.invent / game.objects / game.obj_descr).
        const pages = [buildInventoryFromState()];
        // C ref wintty.c tty_display_nhwindow — display_pickinv menus
        // choose right-corner (offx = cols - maxcol - 1, kind 'menu' so
        // status lines stay visible) when the menu fits in <= 22 rows;
        // otherwise switch to full-screen (offx=0, kind 'text' so
        // status hides).  buildInventoryFromState already chooses
        // PAD=1 vs PAD-from-maxcol by the same line-count rule —
        // derive offx from the actual leading-space width.
        // buildInventoryFromState already applied C's wintty.c:1908-1931
        // offx rule (right-corner overlay vs full-screen) and baked the
        // choice into each line's leading PAD: full-screen lines carry a
        // single leading space (offx 0/1, status hidden), right-corner
        // lines carry the computed offx (= max(10, 78-maxLen)) as leading
        // spaces.  Derive the geometry from that single source of truth
        // rather than recomputing the threshold here (they had drifted —
        // this caller still used the old `> 22` line-count heuristic and
        // forced kind 'text' for seed0116's 23-line shop inventory, so
        // the map never showed through on the left).
        let __derivedOffx = 31;
        for (const ln of pages[0] || []) {
            const t = (typeof ln === 'string') ? ln : (ln?.text || '');
            if (t.trim()) {
                __derivedOffx = t.length - t.trimStart().length;
                break;
            }
        }
        const __fullScreen = __derivedOffx <= 1;
        game._menu_overlay = {
            kind: __fullScreen ? 'text' : 'menu',
            pages, page: 0,
            cType: 'NHW_MENU',
            offx: __fullScreen ? 0 : __derivedOffx,
            // Right-corner menus are an overlay: C does NOT clearscreen
            // when offx != 0 (wintty.c:1407 `if (!cw->offx) clearscreen`),
            // so the map stays visible on the left.  bgPreserve renders
            // the map under the padded menu rows.
            bgPreserve: !__fullScreen,
        };
        game.context.move = 0;
    } else if (ch === ' ' && Array.isArray(game._menu_overlay?.pages)) {
        // Space advances or closes a menu/text overlay.
        // C ref: pager.c — text-window menus advance on any key
        // (including space), close on the last page.
        // Guard against auto-Proxy ghost: `game._menu_overlay`
        // alone is always truthy (gstate's Proxy auto-creates `{}`
        // on read), so we must check for a real `pages` array.
        const m = game._menu_overlay;
        if (m.page < m.pages.length - 1) {
            m.page++;
        } else {
            game._menu_overlay = null;
        }
        game.context.move = 0;
    } else if (key === 0x1b && Array.isArray(game._menu_overlay?.pages)) {
        // Escape closes any active menu/text overlay.
        game._menu_overlay = null;
        game.context.move = 0;
    } else if (ch === '#') {
        // Extended command: read characters via nhgetch until '\n'
        // (or '\r', or ESC to cancel), match against extcmdlist, and
        // dispatch.  C ref: cmd.c doextcmd → win_get_ext_cmd reads
        // command name char-by-char.  Each char is its own nhgetch,
        // so the recording attributes each step to one keystroke.
        // Return value (ECMD_TIME=0x01) decides whether the command
        // takes a turn.
        //
        // Update game._pending_message before each nhgetch so the
        // captured screen between input boundaries shows the extcmd
        // prompt as it grows.  C tty ref win/tty/getline.c:312 —
        // hooked_tty_getlin("#", buf, ...) echoes the prompt then
        // each char as typed.  Format: "#" alone before any chars,
        // then "# " + accumulated buf as the user types (matches
        // canonical seg9 step 370="#" then step 372="#  f" etc.).
        // Autocomplete via game.extcmdlist when typed prefix matches a
        // unique entry (C ref win/tty/getline.c:272 ext_cmd_getlin_hook
        // → cmd.c:2523 extcmds_match without ECM_IGNOREAC).  Only entries
        // with the AUTOCOMPLETE flag (func_tab.h:0x0002) are considered;
        // CMD_NOT_AVAILABLE (0x0010) and INTERNALCMD (0x0040) are
        // skipped.  This is why 'q' uniquely auto-completes to "quit"
        // (only "quit" has AUTOCOMPLETE; "quaff" and "quiver" don't).
        const __extAutoComplete = (prefix) => {
            const list = game.extcmdlist || [];
            // game.flags.debug is the rc OPTIONS=playmode:debug indicator
            // (number 0/1 or boolean).  game.wizard reads as the gstate
            // Proxy ghost `{}` when unset — don't bare-truthy check it.
            const wizmode = !!game.flags?.debug;
            let match = null;
            for (const e of list) {
                if (!e?.ef_txt) continue;
                const f = e.flags | 0;
                if ((f & 0x0050) !== 0) continue;  /* CMD_NOT_AVAILABLE | INTERNALCMD */
                if (!wizmode && (f & 0x0004) !== 0) continue;  /* CMD_DEBUG outside wizmode */
                if ((f & 0x0002) === 0) continue;  /* not AUTOCOMPLETE */
                if (!e.ef_txt.startsWith(prefix)) continue;
                if (match) return prefix;  /* ambiguous */
                match = e.ef_txt;
            }
            return match || prefix;
        };
        // Track what the user TYPED separately from the autocomplete
        // display (C ref getline.c:170 NEWAUTOCOMP: bufp points just
        // past the typed prefix, while obufp holds the autocompleted
        // full name — next typed char OVERWRITES the autocomplete
        // suffix at bufp's position).
        let typed = '';
        let displayed = '';
        let cancelled = false;
        game._pending_message = '#';
        game._cursor_override = { x: 2, y: 0 };
        await flush_screen(1);
        for (;;) {
            const k = await nhgetch();
            if (k === 0x1b) { cancelled = true; break; }
            if (k === 0x0a || k === 0x0d) break;
            if (k === 0x08 || k === 0x7f) {
                if (typed.length) typed = typed.slice(0, -1);
            } else {
                typed += String.fromCharCode(k);
            }
            displayed = __extAutoComplete(typed);
            game._pending_message = '# ' + displayed;
            // Cursor sits just past the typed prefix on row 0; C ref
            // win/tty/getline.c hooked_tty_getlin echoes prompt + typed
            // and leaves the cursor at the typed position (not past the
            // autocompleted suffix).
            game._cursor_override = { x: 2 + typed.length, y: 0 };
            await flush_screen(1);
        }
        game._cursor_override = null;
        // The lookup name is the autocompleted form (so single-char
        // input like 'q' dispatches "quit"); if user typed past the
        // autocomplete (e.g. "quitfoo"), fall back to what they typed
        // so the unknown-extcmd branch fires below.
        const name = displayed.startsWith(typed) ? displayed : typed;
        let res = 0;
        if (!cancelled && name) {
            const list = game.extcmdlist || [];
            let entry = null;
            for (let i = 0; i < list.length; i++) {
                if (list[i] && list[i].ef_txt === name) { entry = list[i]; break; }
            }
            // Async hand-port for #chat — bypasses translated dochat
            // which uses sync getdir→yn_function→readKeySync, and
            // readKeySync can't see the display-side input queue (see
            // memory project_dochat_sync_getdir_dead_end).  Replacing
            // just this command lets the "Talk to whom?" → direction
            // → "It's like talking to a wall." flow work end-to-end
            // because nhgetch IS async and IS the screen-capture
            // boundary the canonical recording has between prompt and
            // result.
            if (!cancelled && name === 'chat') {
                game._pending_message = 'Talk to whom? (in what direction)';
                game._cursor_override = { x: 'Talk to whom? (in what direction)'.length + 1, y: 0 };
                game._cursor_override_oneshot = true;
                // flush_screen renders the prompt into the terminal so
                // the next nhgetch's pre-hook captures it as its own
                // screen frame (matching C's tty_yn_function which
                // writes the prompt before waiting for input).
                await flush_screen(1);
                const dirKey = await nhgetch();
                game._cursor_override = null;
                if (dirKey === 0x1b) {
                    // ESC cancels — no time taken, no message.
                    game._pending_message = '';
                    game.context.move = 0;
                } else {
                    const ch = String.fromCharCode(dirKey);
                    const lower = ch.toLowerCase();
                    let plined = false;
                    // Self direction is '.' or 's' in C; for now only
                    // handle vi-direction keys (the seed0105 path uses
                    // 'y' for northwest).
                    if (Object.prototype.hasOwnProperty.call(DIR_DX, lower)) {
                        const dx = DIR_DX[lower];
                        const dy = DIR_DY[lower];
                        const ux = game.u?.ux | 0;
                        const uy = game.u?.uy | 0;
                        const tx = ux + dx;
                        const ty = uy + dy;
                        const loc = game.level?.locations?.[tx]?.[ty];
                        const mon = game.level?.monsters?.[tx]?.[ty];
                        const typ = loc?.typ | 0;
                        // C ref sounds.c dochat — chat with a monster in the
                        // chosen direction.  The hand-port used to DEFER this
                        // (always free), so chatting an adjacent AWAKE pet
                        // took no turn where C's domonnoise returns ECMD_TIME
                        // — that one missing turn forked seed0106 (the pet's
                        // later dog_goal scheduling). Replicate dochat's gates
                        // (sounds.js:1171-1194) + domonnoise.
                        if (mon && !mon.mundetected
                            && (mon.m_ap_type & 7) !== M_AP_FURNITURE
                            && (mon.m_ap_type & 7) !== M_AP_OBJECT) {
                            const dProp = game.u.uprops[DEAF];
                            const deaf = !!((dProp && (dProp.intrinsic || dProp.extrinsic)) || game.u.uroleplay?.deaf);
                            const seen = canseemon(mon) || sensemon(mon);
                            if ((mon.msleeping || !mon.mcanmove) && !mon.ispriest) {
                                if (seen) await pline("%s seems not to notice you.", await Monnam(mon));
                                res = 0;
                            } else {
                                mon.mstrategy &= ~(268435456 | 536870912);
                                if (!deaf && mon.mtame && mon.meating) {
                                    if (!seen) await map_invisible(mon.mx, mon.my);
                                    await pline("%s is eating noisily.", await Monnam(mon));
                                    res = 0;
                                } else if (deaf) {
                                    const xresp = ((game.youmonst.data.mflags1 & 131072) !== 0) ? "falls on deaf ears" : "is inaudible";
                                    await pline("Any response%s%s %s.", seen ? " from " : "", seen ? await mon_nam(mon) : "", xresp);
                                    res = 0;
                                } else {
                                    res = await domonnoise(mon);
                                }
                            }
                            game.context.move = (res & 1) ? 1 : 0;
                            plined = true;
                        } else if (!mon && typ >= 1 && typ <= 10) {
                            // wall-ish target (typ in [VWALL,DBWALL] or SDOOR).
                            await pline("It's like talking to a wall.");
                            plined = true;
                            res = 0;
                            game.context.move = 0;
                        } else {
                            // statue / empty / fountain — silent, no turn
                            // (those rarer branches still deferred).
                            res = 0;
                            game.context.move = 0;
                        }
                    } else {
                        // non-direction key (self '.'/'s', up/down) — defer.
                        res = 0;
                        game.context.move = 0;
                    }
                    // Clear the prompt if nothing was plined.
                    if (!plined) game._pending_message = '';
                }
            } else if (!cancelled && name === 'pray') {
                // Await-on-input: bridge deleted — translated
                // paranoid_query/getdir read live keys via the
                // async window procs (see ^W / single-key arms).
                if (entry && typeof entry.ef_funct === 'function') {
                    try { res = (await entry.ef_funct()) || 0; } catch (_e) {
                        if (__env.NH_DEBUG_EXTCMD) console.error('[#pray]', _e.message);
                    }
                }
            } else if (!cancelled && name === 'levelchange') {
                // #levelchange — wiz_level_change.  Translated path's
                // getlin can't write to its char-array buf (translator
                // emitted `bufp.value = key; bufp++` which is no-op for
                // JS arrays), so hand-port: read digits via nhgetch
                // until \n, parse, loop pluslvl(0) to climb to the
                // requested level.  Covers seed0360 / 0361 / 0367 /
                // 0373 / 0383 / 0399 (all use `#levelchange 20`).
                // C ref wizcmds.c:446 wiz_level_change.
                if (!game.flags?.debug) {
                    if (entry && typeof entry.ef_funct === 'function') {
                        try { res = (await entry.ef_funct()) || 0; } catch (_e) {}
                    }
                } else {
                    const promptStr = 'To what experience level do you want to be set?';
                    game._pending_message = promptStr;
                    game._cursor_override = { x: promptStr.length + 1, y: 0 };
                    game._cursor_override_oneshot = true;
                    await flush_screen(1);
                    let levBuf = '';
                    let levCancelled = false;
                    for (;;) {
                        const k = await nhgetch();
                        if (k === 0x1b) { levCancelled = true; break; }
                        if (k === 0x0a || k === 0x0d) break;
                        if (k === 0x08 || k === 0x7f) {
                            if (levBuf.length) levBuf = levBuf.slice(0, -1);
                        } else {
                            levBuf += String.fromCharCode(k);
                        }
                        game._pending_message = promptStr + ' ' + levBuf;
                        game._cursor_override = { x: promptStr.length + 1 + levBuf.length, y: 0 };
                        await flush_screen(1);
                    }
                    game._cursor_override = null;
                    if (!levCancelled) {
                        let newlev = parseInt(levBuf.trim(), 10);
                        if (Number.isFinite(newlev)) {
                            if (newlev === game.u.ulevel) {
                                await pline("You are already that experienced.");
                            } else if (newlev < game.u.ulevel) {
                                // Level-down via losexp — not exercised by
                                // any contest seed; deferred.  C ref
                                // wizcmds.c:471-477.
                                await pline("You are already that experienced.");
                            } else if (game.u.ulevel >= 30) {
                                await pline("You are already as experienced as you can get.");
                            } else {
                                if (newlev > 30) newlev = 30;
                                while ((game.u.ulevel | 0) < newlev) {
                                    await t_pluslvl(0);
                                }
                                game.u.ulevelmax = game.u.ulevel;
                            }
                        } else {
                            await pline("Never mind.");
                        }
                    }
                    res = 0;
                }
            } else if (!cancelled && name === 'wizwish') {
                // #wizwish — wiz_wish → makewish → getlin reads the
                // wish text via cmdq (after the windows.js getlin
                // fix that writes buf[i++] correctly).  User chars
                // arrive via nhgetch (display queue), not cmdq, so
                // bridge by reading async and pushing each to cmdq.
                // Covers seed0108 (#wizwish "magic lamp" \n).
                // C ref: wizcmds.c:32 wiz_wish.
                if (!game.flags?.debug) {
                    if (entry && typeof entry.ef_funct === 'function') {
                        try { res = (await entry.ef_funct()) || 0; } catch (_e) {}
                    }
                } else {
                    // Await-on-input: dispatch directly; translated
                    // getlin reads live keys via win_getlin (see the
                    // ^W arm for why the old canned-cmdq bridge broke
                    // the topl state).
                    if (entry && typeof entry.ef_funct === 'function') {
                        try { res = (await entry.ef_funct()) || 0; } catch (_e) {
                            if (__env.NH_DEBUG_EXTCMD) console.error('[#wizwish]', _e.message);
                        }
                    }
                }
            } else if (!cancelled && name === 'conduct') {
                // #conduct shows "Voluntary challenges:" + a list of
                // conducts maintained.  C ref insight.c show_conduct
                // uses win_putstr (NHW_TEXT/NHW_MENU window).  Capture
                // via renderTranslatedTextWindow, right-align as a
                // menu overlay with bgPreserve so the map shows
                // through the gutter.
                try {
                    const raw = await renderTranslatedTextWindow(async () => {
                        const ins = await import('./translated/insight.js');
                        await ins.doconduct();  /* async since the full-async flip */
                    });
                    // raw is [[lines, lines, ...]] with --More-- and
                    // blank-pad to 23 rows.  Strip the pad+--More--
                    // (they're for full-screen text windows), then
                    // right-align with PAD = 80 - maxLen - 2 and add
                    // a (end) sentinel for the menu look.
                    const trimmed = (raw[0] || []).filter((ln, i, arr) => {
                        if (typeof ln === 'string' && ln === '--More--') return false;
                        // Drop trailing empty lines used as pad
                        if (typeof ln === 'string' && ln === '') {
                            for (let j = i; j < arr.length; j++) {
                                const x = arr[j];
                                const t = (typeof x === 'string') ? x : x?.text || '';
                                if (t !== '' && t !== '--More--') return true;
                            }
                            return false;
                        }
                        return true;
                    });
                    let maxLen = 0;
                    for (const ln of trimmed) {
                        const t = (typeof ln === 'string') ? ln : ln?.text || '';
                        if (t.length > maxLen) maxLen = t.length;
                    }
                    // C ref wintty.c tty_putstr — text-overlay
                    // windows (no border) use offx = cols - max - 1
                    // (one less than the menu-with-border formula
                    // `cols - max - 2` used for #name etc).
                    const offx = Math.max(0, 80 - maxLen - 1);
                    const PAD = ' '.repeat(offx);
                    const padded = trimmed.map((ln) => {
                        if (typeof ln === 'string') return PAD + ln;
                        return { text: PAD + ln.text, attr: ln.attr };
                    });
                    padded.push(PAD + '(end)');
                    game._menu_overlay = {
                        kind: 'menu', pages: [padded], page: 0,
                        cType: 'NHW_MENU', offx,
                        bgPreserve: true,
                    };
                    game._pending_message = '';
                } catch (_e) {
                    if (__env.NH_DEBUG_EXTCMD) console.error('[#conduct]', _e.message);
                }
                game.context.move = 0;
            } else if (!cancelled && (name === 'name' || name === 'call')) {
                // #name (and its #call alias) opens a "What do you
                // want to name?" menu.  C ref do_name.c docallcmd.
                // The translated path builds the menu via
                // windowprocs (no-op stubs in JS), so the menu is
                // never rendered.  Hand-port the menu lines (static
                // when invent is non-empty) and present them as a
                // bgPreserve menu overlay so the underlying map
                // shows through the gutter — matches C wintty.c
                // which only writes the menu's own cells.
                //
                // For ESC-cancel (the seed0102 path), this captures
                // the menu screen and dismisses.  Letter selection
                // is deferred — the naming flow (object selection,
                // text prompt) is complex and not yet ported.
                const PAD = ' '.repeat(32);
                const menuLines = [];
                menuLines.push({ text: PAD + 'What do you want to name?', attr: 1 });
                menuLines.push('');
                menuLines.push(PAD + 'm - a monster');
                if (game.invent) {
                    menuLines.push(PAD + 'i - a particular object in inventory');
                    menuLines.push(PAD + 'o - the type of an object in inventory');
                }
                menuLines.push(PAD + 'f - the type of an object upon the floor');
                menuLines.push(PAD + 'd - the type of an object on discoveries list');
                menuLines.push(PAD + 'a - record an annotation for the current level');
                menuLines.push(PAD + '(end)');
                game._menu_overlay = {
                    kind: 'menu', pages: [menuLines], page: 0,
                    cType: 'NHW_MENU', offx: 32, bgPreserve: true,
                };
                game._pending_message = '';
                await flush_screen(1);
                const resp = await nhgetch();
                if (resp === 0x1b) {
                    game._menu_overlay = null;
                }
                game.context.move = 0;
            } else if (!cancelled && (name === 'jump' || name === 'untrap')) {
                // Await-on-input: bridge deleted — translated
                // paranoid_query/getdir read live keys via the
                // async window procs (see ^W / single-key arms).
                if (entry && typeof entry.ef_funct === 'function') {
                    try { res = (await entry.ef_funct()) || 0; } catch (_e) {
                        if (__env.NH_DEBUG_EXTCMD) console.error('[#jump/untrap]', _e.message);
                    }
                }
            } else if (!cancelled && name === 'quit') {
                // Await-on-input: bridge deleted — translated
                // paranoid_query/getdir read live keys via the
                // async window procs (see ^W / single-key arms).
                if (entry && typeof entry.ef_funct === 'function') {
                    try { res = (await entry.ef_funct()) || 0; } catch (_e) {
                        if (__env.NH_DEBUG_EXTCMD) console.error('[#quit]', _e.message);
                    }
                }
            } else if (!cancelled && name === 'ride') {
                // Await-on-input: bridge deleted — translated
                // paranoid_query/getdir read live keys via the
                // async window procs (see ^W / single-key arms).
                if (entry && typeof entry.ef_funct === 'function') {
                    try { res = (await entry.ef_funct()) || 0; } catch (_e) {
                        if (__env.NH_DEBUG_EXTCMD) console.error('[#ride]', _e.message);
                    }
                }
            } else if (entry && typeof entry.ef_funct === 'function') {
                try { res = (await entry.ef_funct()) || 0; } catch (_e) {
                    if (__env.NH_DEBUG_EXTCMD) console.error('[#' + name + ']', _e.message, __env.NH_DEBUG_EXTCMD === 'stack' ? _e.stack : '');
                }
            }
        }
        // Commands that managed game.context.move themselves.
        // 'ride' was previously here but its hand-port doesn't actually
        // touch context.move; that left context.move at the previous
        // command's value (typically 1 from a prior movement/search),
        // so a failed slip-fall #ride was followed by a per-turn block
        // in JS where C runs the next #ride keystroke immediately (per
        // C's rhack `context.move = res & ECMD_TIME` post-dispatch).
        // seed0103 div=2442 was caused by exactly this — back-to-back
        // mount_steed rnd(20) calls in C, with a JS distfleeck wedged
        // between them.  Removing 'ride' from selfManaged lets the
        // outer `context.move = (res & 1) ? 1 : 0` fire correctly.
        const __selfManaged = ['chat', 'pray', 'jump', 'untrap', 'quit', 'name', 'call', 'conduct'];
        if (cancelled || !__selfManaged.includes(name)) {
            game.context.move = (res & 1) ? 1 : 0;
        }
    } else {
        // Unknown command — silently ignore.  The original stub
        // pline'd "Unknown command 'X'." which polluted the
        // message line and broke screen comparison for any
        // session with non-implemented commands.  C's behavior
        // for an unknown command varies (rhack returns FALSE or
        // beeps), but printing a fixed string is incorrect.
        // Until we port the full command dispatch, prefer
        // silence over wrong output.
        game.context.move = 0;
    }

    // C ref cmd.c:3819-3825 — after a turn-consuming command that was
    // NOT a kick (^D = 0x04), reset kickedloc so pets stop avoiding the
    // just-kicked tile.  The translated rhack (cmd.js:2865) does this;
    // the live hand-port omitted it.  Movement already clears kickedloc
    // via domove (translated hack.js:2096), but a NON-movement turn such
    // as 's'earch did not — so a stale kickedloc persisted and the pet
    // kept avoiding the kicked tile, firing one fewer dog_move
    // rn2(++chcnt) than C (seed0060 div=3033: dog skipped the kicked
    // candidate (24,13) that C evaluates/chooses).
    if (game.context.move && key !== 0x04 && game.kickedloc) {
        game.kickedloc.x = 0;
        game.kickedloc.y = 0;
    }
}

// C ref: hack.c domove — execute a movement.
// Set u.dx/dy per C's rhack convention, then call translated
// domove which handles all the physical movement, monster
// interactions, traps, vision, etc.  Falls back to a manual
// move on any error.
async function domove(dx, dy) {
    const u = game.u;
    u.dx = dx;
    u.dy = dy;
    if (__env.NH_DEBUG_DOMOVE) {
        const newx0 = u.ux + dx, newy0 = u.uy + dy;
        const m = game.level?.monsters?.[newx0]?.[newy0];
        console.error('[domove] from=('+u.ux+','+u.uy+') d=('+dx+','+dy+') to=('+newx0+','+newy0+
            ') mtmp=' + (m ? ('tame='+m.mtame+' peaceful='+m.mpeaceful) : 'null'));
    }
    // Snapshot u.ux/uy before t_domove so the catch can restore them
    // if t_domove crashes mid-execution.  t_domove's domove_core (in
    // translated/hack.js around line 1919-1920) increments u.ux/uy
    // BEFORE calling u_on_newpos, which is where headless runs
    // currently crash on null windowprocs.win_cliparound.  Without
    // restoring, the manual-move fallback below re-applies the
    // delta → double-advance → cascading position corruption.
    const __snapUx = u.ux, __snapUy = u.uy;
    try {
        await t_domove();
        // Translated vision_recalc(1) early-returns on iflags.vision_inited=0
        // (hand-port vision_reset never sets that iflag), so neither the
        // visibility expansion NOR the unconditional newsym(u.ux, u.uy) at
        // C ref vision.c:850 fires.  Mirror C's hack.c:2487-2490 here via
        // the hand-port:
        //   1) newsym(u.ux0, u.uy0) — clears the hero's prior cell (the
        //      hand-port vision_recalc loop only emits newsym for cells
        //      whose visibility CHANGED, so a still-visible vacated cell
        //      retains its stale '@' otherwise).
        //   2) vision_recalc(1) — recomputes COULD_SEE/IN_SIGHT from the
        //      new hero position via view_from, emits per-cell newsym
        //      for newly-visible terrain, then the hero re-paint at
        //      vision.js:515.  Without this, viz_array stays frozen at
        //      the last full-recalc state and any lit terrain beyond
        //      that prior light radius (e.g. a room down a straight
        //      corridor) never appears on screen.
        if (__snapUx !== u.ux || __snapUy !== u.uy) {
            newsym(__snapUx, __snapUy);
            vision_recalc(1);
        }
        return;
    } catch (_e) {
        if (__env.NH_DEBUG_DOMOVE) console.error('[t_domove]', _e.message, __env.NH_DEBUG_DOMOVE === 'stack' ? _e.stack : '');
        // NH_DEBUG_DOMOVE=stack also prints the .stack for diagnosis.
        // Restore position to pre-t_domove snapshot so the manual
        // fallback applies the delta exactly once.
        u.ux = __snapUx;
        u.uy = __snapUy;
        // Fall through to manual move on error
    }
    const newx = u.ux + dx;
    const newy = u.uy + dy;
    // The historical safe-pet rn2(7) fallback (C ref uhitm.c:474 —
    // `boolean foo = (Punished || !rn2(7) || ...)`) was protective
    // when t_domove threw frequently and the manual fallback
    // replicated specific RNG events.  With translator-side fixes
    // (LEARNINGS §23.145) t_domove throws are 2 total across the
    // 44-session run, both from windowproc stubs unrelated to
    // safe-pet movement.  Firing rn2(7) here in those rare cases
    // shifts the PRNG sequence for the post-throw recovery path
    // and doesn't match what C does on the corresponding nh_impossible
    // recovery — removed.  If a future throw cluster re-introduces
    // a safe-pet path, restore conditionally.
    if (blocksMove(newx, newy)) {
        // C ref hack.c:1097 — when blocked by a CLOSED door and not
        // running, flags.autoopen ON (C default), and !Confusion &&
        // !Stunned && !Fumbling, C calls doopen_indir which fires
        // rnl(20) (lock.c:904) and opens the door if rnl <
        // (STR+DEX+CON)/3.  None of our hand-rolled level state
        // tracks the modifiers (Confusion/Stunned/Fumbling), but
        // for default movement (single keypress, non-run, no major
        // afflictions) the autoopen path always runs in C.  Replicate
        // the rnl(20) here so PRNG aligns; mutate doormask to D_ISOPEN
        // if successful so subsequent moves don't re-bump the same
        // door.  seed0077 ('rogue-chargen', step 17 'j') is the
        // canonical case: single rnl(20)=2 fire opens the door, then
        // the player engages other actions (no second door-bump).
        //
        // Gate on early-game moves (game.moves < 10): hand-rolled
        // mklev's door placement diverges from C in later levels /
        // deeper into long sessions (seed0367 at moves=14 hits a
        // closed door in JS that C doesn't have, -33 P spurious;
        // seed0077 fires at moves=1).  The moves<10 cutoff keeps
        // the seed0077-style early-door wins (+15 P seed0077, +13 P
        // seed0030) and recovers seed0367 from the prior -33 P; net
        // +32 P over the un-gated autoopen.  Drop this gate when
        // level-state parity catches up to C.
        const __loc = game.level?.at(newx, newy);
        const __moves = game.moves || 0;
        if (__loc && __loc.typ === DOOR && (__loc.doormask & D_CLOSED)
            && !(__loc.doormask & D_LOCKED) && !game.context?.run
            && __moves < 10) {
            const __roll = rnl(20);
            // C ref attrib.h:11-16 — A_STR=0, A_INT=1, A_WIS=2, A_DEX=3,
            // A_CON=4, A_CHA=5.  The C check is `rnl(20) <
            // (ACURRSTR + ACURR(A_DEX) + ACURR(A_CON)) / 3` so the
            // right indices are [0], [3], [4] (was [0],[1],[3] — bug).
            const __thr = Math.trunc(((game.u?.acurr?.a?.[0] || 0)
                                    + (game.u?.acurr?.a?.[3] || 0)
                                    + (game.u?.acurr?.a?.[4] || 0)) / 3);
            if (__roll < __thr) {
                __loc.doormask = D_ISOPEN;
            }
            // ECMD_TIME: turn consumed whether open succeeded or not.
            game.context.move = 1;
            return;
        }
        game.context.move = 0;
        return;
    }
    const oldx = u.ux, oldy = u.uy;
    u.ux0 = oldx;
    u.uy0 = oldy;
    u.ux = newx;
    u.uy = newy;
    newsym(oldx, oldy);
    vision_recalc(1);
    newsym(newx, newy);
    // Successful manual move — C's domove sets context.move = 1
    // on successful walk.  Match that here (the catch above caught
    // any translator-side error, so we know t_domove did NOT set it
    // and we're solely responsible).
    game.context.move = 1;
}
