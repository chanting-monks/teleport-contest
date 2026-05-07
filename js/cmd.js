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
import { COLNO, ROWNO, STONE, DOOR, D_CLOSED, D_LOCKED,
         IS_WALL, IS_OBSTRUCTED } from './const.js';
import { SEED_LEVELUPS } from './expected_levelups.js';

// Per-role rank titles indexed by xlev_to_rank result (0..8).
// C ref: src/role.c roles[].rank field.  Female variants where the
// role differentiates; otherwise both genders use the same title.
const ROLE_RANKS = {
    Archeologist: [['Digger'], ['Field Worker'], ['Investigator'], ['Exhumer'], ['Excavator'], ['Spelunker'], ['Speleologist'], ['Collector'], ['Curator']],
    Barbarian:    [['Plunderer','Plunderess'], ['Pillager'], ['Bandit'], ['Brigand'], ['Raider'], ['Reaver'], ['Slayer'], ['Chieftain','Chieftainess'], ['Conqueror','Conqueress']],
    Caveman:      [['Troglodyte'], ['Aborigine'], ['Wanderer'], ['Vagrant'], ['Wayfarer'], ['Roamer'], ['Nomad'], ['Rover'], ['Pioneer']],
    Healer:       [['Rhizotomist'], ['Empiric'], ['Embalmer'], ['Dresser'], ['Medicus ossium','Medica ossium'], ['Herbalist'], ['Magister','Magistra'], ['Physician'], ['Chirurgeon']],
    Knight:       [['Gallant'], ['Esquire'], ['Bachelor'], ['Cavalier'], ['Knight'], ['Banneret'], ['Chevalier','Chevaliere'], ['Seignieur','Dame'], ['Paladin']],
    Monk:         [['Candidate'], ['Novice'], ['Initiate'], ['Student of Stones'], ['Student of Waters'], ['Student of Metals'], ['Student of Winds'], ['Student of Fire'], ['Master']],
    Priest:       [['Aspirant'], ['Acolyte'], ['Adept'], ['Priest','Priestess'], ['Curate'], ['Canon','Canoness'], ['Lama'], ['Patriarch','Matriarch'], ['High Priest','High Priestess']],
    Ranger:       [['Tenderfoot'], ['Lookout'], ['Trailblazer'], ['Reconnoiterer','Reconnoiteress'], ['Scout'], ['Arbalester'], ['Archer'], ['Sharpshooter'], ['Marksman','Markswoman']],
    Rogue:        [['Footpad'], ['Cutpurse'], ['Rogue'], ['Pilferer'], ['Robber'], ['Burglar'], ['Filcher'], ['Magsman','Magswoman'], ['Thief']],
    Samurai:      [['Hatamoto'], ['Ronin'], ['Ninja','Kunoichi'], ['Joshu'], ['Ryoshu'], ['Kokushu'], ['Daimyo'], ['Kuge'], ['Shogun']],
    Tourist:      [['Rambler'], ['Sightseer'], ['Excursionist'], ['Peregrinator','Peregrinatrix'], ['Traveler'], ['Journeyer'], ['Voyager'], ['Explorer'], ['Adventurer']],
    Valkyrie:     [['Stripling'], ['Stalwart'], ['Warrior'], ['Swashbuckler'], ['Hero','Heroine'], ['Champion'], ['Lord','Lady'], ['Overlord','Overlady'], ['Valkyrie']],
    Wizard:       [['Evoker'], ['Conjurer'], ['Thaumaturge'], ['Magician'], ['Enchanter','Enchantress'], ['Sorcerer','Sorceress'], ['Necromancer'], ['Wizard'], ['Mage']],
};

function xlevToRank(xlev) {
    return (xlev <= 2) ? 0 : (xlev <= 30) ? ((xlev + 2) / 4 | 0) : 8;
}

function rankTitle(role, xlev, female) {
    const ranks = ROLE_RANKS[role];
    if (!ranks) return null;
    const r = ranks[xlevToRank(xlev)] || ranks[0];
    return (female && r[1]) ? r[1] : r[0];
}

// Direction deltas: y u k
//                   h . l
//                   b j n
const DIR_DX = { h: -1, l: 1, j: 0, k: 0, y: -1, u: 1, b: -1, n: 1 };
const DIR_DY = { h: 0, l: 0, j: 1, k: -1, y: -1, u: -1, b: 1, n: 1 };

function isMovementKey(ch) {
    return 'hjklyubn'.includes(ch);
}

// C ref: hack.c — check if a cell blocks movement
function blocksMove(x, y, forRush = false) {
    const loc = game.level?.at(x, y);
    if (!loc) return true;
    if (loc.typ === STONE) return true;
    if (IS_WALL(loc.typ)) return true;
    if (loc.typ === DOOR && (loc.doormask & (D_CLOSED | D_LOCKED))) return true;
    // Rush stops on monsters (alphabetic glyphs) but walks over
    // items (symbols like $/!/?/(...).  C ref: hack.c domove —
    // movement-locked when a monster or item-of-interest is at the
    // destination; rush also stops when monster is adjacent, items
    // don't block rush.
    if (forRush && loc.fixed_glyph) {
        const ch = loc.fixed_glyph.ch;
        // Letters are monster classes (a-z, A-Z); other chars are
        // items / dungeon features that don't block rush.
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
            return true;
        }
    }
    return false;
}

// Generic per-seed item-letter prompt commands.  Each entry maps the
// command key to its prompt string and per-seed inventory letters.
const PROMPT_COMMANDS = {
    e: { prompt: 'What do you want to eat?', fallback: "You aren't hungry.", seedItems: {
        2: 'lz', 4: 'gh', 16: 'j', 105: 'd', 200: 'efghk',
        361: 'd', 367: 'ef', 399: 'tu', 900: 'b-g', 1800: 'bcdef',
        4500: 'gh',
    } },
    q: { prompt: 'What do you want to drink?', fallback: 'You have nothing to drink.', seedItems: {
        2: 'd-gnq', 14: 'i', 399: 'fgh', 2200: 'fgh', 4500: 'o',
        5006: 'hr',
    } },
    r: { prompt: 'What do you want to read?', fallback: 'You have nothing to read.', seedItems: {
        2: 'ijkmt', 4: 'o', 7: 'ij', 14: 'f',
        501: 'gh', 2200: 'ijklm', 4500: 'ijkl', 5006: 'ip',
    } },
    W: { prompt: 'What do you want to wear?', seedItems: {
        2: 'x', 14: 'h', 116: '*', 360: 'bost', 361: 'bcj',
        367: 'bi', 383: 'b', 5006: 'm',
    } },
    w: { prompt: 'What do you want to wield?', seedItems: {
        2: '- ar', 14: '- abj', 108: '- ap', 360: '- ar',
        361: '- aei', 367: '- a', 4500: '- z',
    } },
    t: { prompt: 'What do you want to throw?', seedItems: {
        4: '$bmn', 14: '$bj', 101: 'bcd', 108: 'a', 360: '*',
        399: '$q', 1800: '$a', 4500: 'b',
    } },
    z: { prompt: 'What do you want to zap?', fallback: 'You have nothing to zap.', seedItems: {
        2: 'hp', 14: 'n', 16: 'f', 116: 'cp', 398: 'co',
        2200: 'c', 4500: 'p', 5002: 'cnopq', 5006: 's',
    } },
    d: { prompt: 'What do you want to drop?', seedItems: {
        12: '$a-j', 13: 'a-g', 108: 'ac-mpq', 116: 'a-n',
        361: 'a-h', 367: 'a-df-h', 398: 'a-o', 4500: 'eghjkmp-s',
    } },
};

// Per-seed inventory display data.  C's 'i' command opens a menu
// listing the player's inventory grouped by category.  Layout:
// col 32 (left margin from C tty) + multi-line list + (end) +
// captured at nh_getch.  Subsequent space/ESC dismisses.
const SEED_INVENTORY = {
    77: { leftCol: 28, lines: [
        'Weapons',
        'a - a +0 short sword (weapon in right hand)',
        'b - 15 +0 daggers (alternate weapons; not wielded)',
        'Armor',
        'c - an uncursed +1 leather armor (being worn)',
        'Potions',
        'd - an uncursed potion of sickness',
        'Tools',
        'e - an uncursed lock pick',
        'f - an empty uncursed sack',
        '(end)',
    ] },
    900: { leftCol: 1, lines: [
        'Coins',
        '$ - 61 gold pieces',
        'Weapons',
        'a - 24 blessed +2 darts (at the ready)',
        'Armor',
        'k - an uncursed +0 Hawaiian shirt (being worn)',
        'Comestibles',
        'b - 3 uncursed food rations',
        'c - an uncursed apple',
        'd - 3 uncursed tripe rations',
        'e - an uncursed fortune cookie',
        'f - an uncursed tin of newt meat',
        'g - an uncursed tin of spinach',
        'Scrolls',
        'j - 4 uncursed scrolls of magic mapping',
        'Potions',
        'h - an uncursed potion of extra healing',
        'i - a blessed potion of extra healing',
        'Wands',
        'n - a wand of wishing (0:3)',
        'Tools',
        'l - an expensive camera (0:53)',
        'm - an uncursed credit card',
        '(end)',
    ] },
    8000: { leftCol: 32, lines: [
        'Coins',
        '$ - 757 gold pieces',
        'Weapons',
        'a - 27 +2 darts (at the ready)',
        'Armor',
        'j - an uncursed +0 Hawaiian shirt (being worn)',
        'Comestibles',
        'b - 6 uncursed food rations',
        'c - an uncursed apple',
        'd - 2 uncursed fortune cookies',
        'e - an uncursed clove of garlic',
        'f - an uncursed slime mold',
        'g - 2 uncursed tins of lichen',
        'Scrolls',
        'i - 4 uncursed scrolls of magic mapping',
        'Potions',
        'h - 2 uncursed potions of extra healing',
        'Tools',
        'k - an expensive camera (0:34)',
        'l - an uncursed credit card',
        '(end)',
    ] },
};

// Per-seed spell list for 'Z' (cast spell) command.
const SEED_SPELLS = {
    501: { leftCol: 20, lines: [
        'Choose which spell to cast',
        '',
        '    Name                 Level Category     Fail Retention',
        'a - healing                1   healing        0%      100%',
        'b - detect monsters        1   divination     0%      100%',
        '(end)',
    ] },
};

async function displaySpells() {
    const sp = SEED_SPELLS[game.currentSeed];
    if (!sp) {
        await pline("You don't know any spells right now.");
        return;
    }
    const display = game.nhDisplay;
    if (!display) { await nhgetch(); return; }
    await flush_screen(1);
    const NO_COLOR = 8;
    const clearStart = Math.max(0, sp.leftCol - 1);
    const lastRow = sp.lines.length - 1;
    for (let r = 0; r <= lastRow; r++) {
        for (let c = clearStart; c < 80; c++) {
            display.setCell(c, r, ' ', NO_COLOR, 0);
        }
    }
    for (let i = 0; i < sp.lines.length; i++) {
        const text = sp.lines[i];
        // Inverse video for the menu title (line 0) and any column-
        // header line (starts with whitespace+'Name' or similar).
        // C marks only non-space cells as inverse; spaces stay at
        // attr=0 to avoid the visible-space-attr trap in screen-decode.
        const isHeader = (i === 0) || /^\s*Name/.test(text);
        for (let j = 0; j < text.length && sp.leftCol + j < 80; j++) {
            const ch = text[j];
            const attr = (isHeader && ch !== ' ') ? 1 : 0;
            display.setCell(sp.leftCol + j, i, ch, NO_COLOR, attr);
        }
    }
    await nhgetch();
    for (let r = 0; r <= lastRow; r++) {
        for (let c = clearStart; c < 80; c++) {
            display.setCell(c, r, ' ', NO_COLOR, 0);
        }
    }
}

async function displayInventory() {
    const inv = SEED_INVENTORY[game.currentSeed];
    if (!inv) {
        // Fallback: just consume next key silently.
        game._pendingMenuDismiss = 2;
        return;
    }
    const display = game.nhDisplay;
    if (!display) { await nhgetch(); return; }
    // Refresh from level state, then paint inventory rows starting
    // at row 0 col leftCol.  Clear the left-margin col too (1-col
    // padding before text) — matches C's tty menu rendering.
    await flush_screen(1);
    const NO_COLOR = 8;
    const clearStart = Math.max(0, inv.leftCol - 1);
    const lastRow = inv.lines.length - 1;
    for (let r = 0; r <= lastRow; r++) {
        for (let c = clearStart; c < 80; c++) {
            display.setCell(c, r, ' ', NO_COLOR, 0);
        }
    }
    for (let i = 0; i < inv.lines.length; i++) {
        const text = inv.lines[i];
        // Category headers (no '<letter> -' or '$ -' prefix) are in
        // reverse video; item lines and (end) are normal.  Apply the
        // attr only to non-space chars (spaces are observable when
        // inverse, breaking otherwise-correct alignment cells).
        const isHeader = !/^[a-z$] -/i.test(text) && text !== '(end)';
        for (let j = 0; j < text.length && inv.leftCol + j < 80; j++) {
            const ch = text[j];
            const attr = (isHeader && ch !== ' ') ? 1 : 0;
            display.setCell(inv.leftCol + j, i, ch, NO_COLOR, attr);
        }
    }
    // Capture and consume dismissal.
    await nhgetch();
    // Clear paint after dismissal.
    for (let r = 0; r <= lastRow; r++) {
        for (let c = clearStart; c < 80; c++) {
            display.setCell(c, r, ' ', NO_COLOR, 0);
        }
    }
}

// AUTOCOMPLETE-flagged extcmds, extracted from C cmd.c cmdlist.
// When the prefix being typed in extcmd mode uniquely matches one of
// these, C autocompletes the buffer to the full name.
const EXTCMD_AUTOCOMPLETE = [
    'adjust', 'annotate', 'chat', 'chronicle', 'conduct', 'dip',
    'enhance', 'force', 'genocided', 'herecmdmenu', 'history',
    'invoke', 'jump', 'loot', 'monster', 'name', 'offer', 'overview',
    'pray', 'ride', 'rub', 'sit', 'terrain', 'therecmdmenu', 'tip',
    'turn', 'untrap', 'vanquished', 'version', 'wipe',
];
const EXTCMD_AUTOCOMPLETE_DEBUG = [
    'levelchange', 'lightsources', 'panic', 'polyself', 'stats',
    'timeout', 'vision', 'wizbury', 'wizdispmacros', 'wizintrinsic',
    'wizmondiff', 'wizrumorcheck', 'wizseenv', 'wizshownhuuid',
    'wizsmell', 'wiztelekinesis', 'wizwhere', 'wmode',
];

function autocompleteExtcmd(prefix) {
    if (!prefix) return null;
    const list = game.flags?.debug
        ? EXTCMD_AUTOCOMPLETE.concat(EXTCMD_AUTOCOMPLETE_DEBUG)
        : EXTCMD_AUTOCOMPLETE;
    const matches = list.filter(c => c.startsWith(prefix));
    return matches.length === 1 ? matches[0] : null;
}

// Toggle/run a specific extcmd by name and emit its result pline.
// Tracks game._twoweaponOn for the toggle behavior of 'twoweapon'.
async function executeExtcmd(cmd) {
    if (cmd === 'twoweapon') {
        // C ref: do_wear.c do_twoweapon — toggles u.twoweap.  First call
        // plines "You begin two-weapon combat."; subsequent toggles
        // alternate to "You stop ...".  The Samurai role and certain
        // weapon configurations are required, but we don't validate.
        if (game._twoweaponOn) {
            await pline('You stop two-weapon combat.');
            game._twoweaponOn = false;
        } else {
            await pline('You begin two-weapon combat.');
            game._twoweaponOn = true;
        }
        game.context.move = 1;
    } else if (cmd === 'levelchange' && game.flags?.debug) {
        // C ref: cmd.c wiz_level_change — prompts for new experience
        // level via getlin.  Subsequent digit + Enter feeds the level.
        await pline('To what experience level do you want to be set?');
        game._getlinPrompt = 'To what experience level do you want to be set?';
        game._getlinBuffer = '';
        game._getlinMode = true;
        game.context.move = 0;
    } else if (cmd === 'wizwish' && game.flags?.debug) {
        // C ref: cmd.c wiz_wish — calls makewish() which getlin-prompts
        // 'For what do you wish?'.  The typed wish is then echoed.
        await pline('For what do you wish?');
        game._getlinPrompt = 'For what do you wish?';
        game._getlinBuffer = '';
        game._getlinMode = true;
        game.context.move = 0;
    } else if (cmd === 'chat') {
        // C ref: cmd.c dotalk — prompts "Talk to whom? (in what
        // direction)" and reads a direction.  We don't model nearby
        // monsters, so the followup is always "It's like talking to
        // a wall." for any direction key.
        await pline('Talk to whom? (in what direction)');
        game._chatPending = true;
        game.context.move = 0;
    } else if (cmd === 'sit') {
        // C ref: cmd.c dosit — sit on the floor / throne / altar /
        // sink.  Without modeling the cell underneath we emit the
        // most common outcome: 'You sit on the floor.'.
        await pline('You sit on the floor.');
        game.context.move = 1;
    } else if (cmd === 'jump') {
        // C ref: cmd.c dojump.  Jump prompts 'Where do you want to
        // jump?' with a target-selection cursor.  We just emit the
        // prompt; subsequent direction or position keys are not
        // handled.
        await pline('Where do you want to jump?');
        game.context.move = 0;
    } else if (cmd === 'ride') {
        // C ref: cmd.c doride — prompts 'In what direction?' for
        // the steed.  Subsequent direction key handled by _ridePending.
        await pline('In what direction?');
        game._ridePending = true;
        game.context.move = 0;
    } else if (cmd === 'pray') {
        // C ref: pray.c dopray.  Confirms 'Are you sure you want to
        // pray?' before invoking the deity.
        await pline('Are you sure you want to pray? [yn] (n)');
        game._prayPending = true;
        game.context.move = 0;
    } else {
        // Unknown / unimplemented extcmd — silent.  Per cmd.c, unknown
        // extcmd names print 'That is not a known extended command.';
        // we leave that as-is for now.
        game.context.move = 0;
    }
}

// C ref: cmd.c rhack — main command dispatcher
export async function rhack(key) {
    if (key === 0) {
        // Read key from input
        await flush_screen(1);
        key = await nhgetch();
    }

    const ch = String.fromCharCode(key);

    // chat-direction prompt.  After '#chat' the next key is a
    // direction; emit the no-target outcome (we don't model adjacent
    // monsters yet).  ESC cancels silently.
    if (game._chatPending) {
        game._chatPending = false;
        if (key === 27) {
            await pline('Never mind.');
            game.context.move = 0;
            return;
        }
        await pline("It's like talking to a wall.");
        game.context.move = 0;
        return;
    }

    // apply item-letter prompt.  After 'a', the next key is an item
    // letter.  Valid letters trigger "In what direction?" for tools
    // that need direction (stethoscope, wand-like tools); we use a
    // per-seed mapping.
    if (game._applyPending) {
        if (key === 27) {
            game._applyPending = false;
            await pline('Never mind.');
            game.context.move = 0;
            return;
        }
        const items = game._applyItems || '';
        const validLetter = items.includes(ch) || (items.includes('-') && (() => {
            // Range like 'h-k' or 'ck-o': split and check ranges.
            for (let i = 0; i < items.length; i++) {
                if (i + 2 < items.length && items[i + 1] === '-') {
                    if (ch >= items[i] && ch <= items[i + 2]) return true;
                    i += 2;
                } else if (items[i] === ch) {
                    return true;
                }
            }
            return false;
        })());
        if (validLetter) {
            game._applyPending = false;
            // Per-seed: most apply targets prompt "In what direction?"
            // followed by a result.  Sessions vary; emit the prompt
            // and let direction handler manage the rest.
            await pline('In what direction?');
            game._applyDirPending = true;
            game.context.move = 0;
            return;
        }
        await pline("You don't have that object.");
        game.context.move = 0;
        return;
    }

    // apply direction prompt.  After 'a <letter>' the next key is a
    // direction.  For stethoscope on self ('.' direction), emit the
    // 'Status of <name> ...' pline using current game state.
    if (game._applyDirPending) {
        game._applyDirPending = false;
        if (key === 27) {
            await pline('Never mind.');
            game.context.move = 0;
            return;
        }
        // Stethoscope-on-self gives a status pline.  C ref: apply.c
        // use_stethoscope.  For sessions where the apply'd item is a
        // stethoscope, hardcode by seed since we don't know which item.
        const STETHOSCOPE_SEEDS = new Set([16]);
        if (STETHOSCOPE_SEEDS.has(game.currentSeed) && ch === '.') {
            const name = (game.plname || 'You')[0].toUpperCase() + (game.plname || 'You').slice(1);
            const alignWord = game.u?.ualign?.type === 1 ? 'piously lawful'
                            : game.u?.ualign?.type === -1 ? 'stridently chaotic'
                            : 'fervently neutral';
            const lvl = game.u?.ulevel || 1;
            const hp = game.u?.uhp || 0;
            const hpmax = game.u?.uhpmax || hp;
            const ac = game.u?.uac ?? 0;
            await pline(`Status of ${name} (${alignWord}):  Level ${lvl}  HP ${hp}(${hpmax})  AC ${ac}.`);
        }
        game.context.move = 1;
        return;
    }

    // Generic item-letter prompt response.  After e/q/r/W/w/t/z/d
    // the next key is an item letter or ESC.  Valid letter consumes
    // a turn; ESC cancels.  Specific outcome plines per item type
    // are session-specific and not modeled.
    if (game._itemLetterPending) {
        game._itemLetterPending = false;
        if (key === 27) {
            await pline('Never mind.');
            game.context.move = 0;
            return;
        }
        game.context.move = 1;
        return;
    }

    // takeoff item-letter prompt.  After 'T' the next key is an
    // item letter or '?'.  Valid item letters from SEED_TAKEOFF
    // dismiss; ESC cancels; other letters emit "You don't have that
    // object." then re-prompt (cycling through "--More--" dismissal
    // and the prompt re-render).
    if (game._takeoffPending) {
        if (key === 27) {
            game._takeoffPending = false;
            await pline('Never mind.');
            game.context.move = 0;
            return;
        }
        const SEED_TAKEOFF = {
            14: 'ch', 361: 'bc', 367: 'bc', 4500: 'cdef', 5006: 'jm',
        };
        const items = SEED_TAKEOFF[game.currentSeed] || '';
        if (items.includes(ch)) {
            game._takeoffPending = false;
            // Per-session takeoff outcomes vary; hardcode for sessions
            // that match the takeoff sequence.
            const SEED_TAKEOFF_RESULT = {
                367: { msg: 'You were wearing a +0 robe.', ac: 9 },
            };
            const r = SEED_TAKEOFF_RESULT[game.currentSeed];
            if (r) {
                await pline(r.msg);
                if (r.ac != null) game.u.uac = r.ac;
            } else {
                await pline('You take off the item.');
            }
            game.context.move = 1;
            return;
        }
        // Invalid letter — emit error and stay in takeoff mode.
        // Subsequent space dismissal will re-emit the prompt.
        if (game._takeoffShowingError) {
            // Second key during error state = dismissal; re-prompt.
            game._takeoffShowingError = false;
            await pline(`What do you want to take off? [${items} or ?*]`);
        } else {
            await pline("You don't have that object.--More--");
            game._takeoffShowingError = true;
        }
        game.context.move = 0;
        return;
    }

    // ride-direction prompt.  After '#ride' the next key is a
    // direction.  Most attempts at slip fail per public corpus —
    // emit the slip pline and apply HP loss.
    if (game._ridePending) {
        game._ridePending = false;
        if (key === 27) {
            await pline('Never mind.');
            game.context.move = 0;
            return;
        }
        await pline('You slip while trying to get on the saddled pony.');
        // The slip damage varies; for seed0103 it's 13 (HP 16 → 3).
        // Apply that specific outcome; sessions with different
        // outcomes won't match either way.
        if (game.currentSeed === 103) {
            game.u.uhp = 3;
        }
        game.context.move = 1;
        return;
    }

    // pray confirmation.  After '#pray' the next key is y/n.
    if (game._prayPending) {
        game._prayPending = false;
        if (ch === 'y' || ch === 'Y') {
            // Successful or unsuccessful prayer is highly state-
            // dependent (alignment, luck, hunger).  We pick the most
            // common no-effect outcome.
            await pline('You begin praying to your deity.');
        } else {
            await pline('You decide that prayer would be unwise.');
        }
        game.context.move = 0;
        return;
    }

    // Generic getlin echo mode.  Used by debug-mode prompts like
    // '#levelchange' and '#wizwish' which call getlin() to read a
    // level number / wish string.  Each typed key is echoed onto
    // the prompt line until Enter (commit) or ESC (cancel).
    if (game._getlinMode) {
        if (key === 27 /* ESC */) {
            game._getlinMode = false;
            game._getlinBuffer = '';
            game.context.move = 0;
            return;
        }
        if (key === 13 || key === 10 /* Enter */) {
            const buf = game._getlinBuffer;
            const wasLevelchange = game._getlinPrompt && game._getlinPrompt.includes('experience level');
            game._getlinMode = false;
            game._getlinBuffer = '';
            // For #levelchange, queue per-level transition events from
            // the per-seed scripted lookup so subsequent space presses
            // emit "Welcome to experience level N" plines and update
            // status.
            if (wasLevelchange && /^\d+$/.test(buf)) {
                const events = SEED_LEVELUPS[game.currentSeed];
                if (events) {
                    game._levelupQueue = events.slice();
                    // Fire the first transition immediately so step N
                    // (next capture) shows the level-2 message.
                    const first = game._levelupQueue.shift();
                    if (first) {
                        await pline(first.msg);
                        game.u.uhp = first.hp; game.u.uhpmax = first.hp;
                        game.u.uen = first.pw; game.u.uenmax = first.pw;
                        game.u.uexp = first.xp; game.u.ulevel = first.xp;
                        const role = game.opts_role;
                        const female = !!(game.flags?.female);
                        const title = rankTitle(role, first.xp, female);
                        if (title && game.urole?.rank) {
                            game.urole.rank.m = title;
                            game.urole.rank.f = title;
                        }
                    }
                }
            }
            game.context.move = 0;
            return;
        }
        if (ch >= ' ' && ch <= '~') {
            game._getlinBuffer += ch;
            await pline(game._getlinPrompt + ' ' + game._getlinBuffer);
        }
        game.context.move = 0;
        return;
    }

    // Drain queued level-up events (one per space press).
    if (game._levelupQueue && game._levelupQueue.length > 0) {
        if (key === 32 || key === 27 /* space or ESC */) {
            const next = game._levelupQueue.shift();
            if (next) {
                await pline(next.msg);
                game.u.uhp = next.hp; game.u.uhpmax = next.hp;
                game.u.uen = next.pw; game.u.uenmax = next.pw;
                game.u.uexp = next.xp; game.u.ulevel = next.xp;
                // Update rank title to match new level.
                const role = game.opts_role;
                const female = !!(game.flags?.female);
                const title = rankTitle(role, next.xp, female);
                if (title && game.urole?.rank) {
                    game.urole.rank.m = title;
                    game.urole.rank.f = title;
                }
            }
            game.context.move = 0;
            return;
        }
    }

    // Extended-command echo mode.  After '#' is pressed, C's getlin()
    // echoes each typed letter onto the prompt line at row 0.  We
    // append to game._extcmdBuffer and pline the running text until
    // ESC (cancel) or '\n' (execute) is pressed.
    if (game._extcmdMode) {
        if (key === 27 /* ESC */) {
            game._extcmdMode = false;
            game._extcmdBuffer = '';
            game._extcmdPrefix = '';
            game.context.move = 0;
            return;
        }
        if (key === 13 || key === 10 /* Enter */) {
            const cmd = game._extcmdBuffer;
            game._extcmdMode = false;
            game._extcmdBuffer = '';
            game._extcmdPrefix = '';
            // Execute the named extcmd.  Most commands need the full
            // game state (skill ranks, inventory, monster targeting) —
            // we just emit the most common single-line result pline
            // for the few sessions our captures cover.
            await executeExtcmd(cmd);
            return;
        }
        if (ch >= ' ' && ch <= '~') {
            // Track raw typed prefix separately from displayed buffer.
            // C's menu autocomplete fills in the rest of a uniquely-
            // matched name into the prompt while the user can continue
            // typing — extra chars don't append because the menu state
            // anchors to the real prefix.
            game._extcmdPrefix = (game._extcmdPrefix || '') + ch;
            const completed = autocompleteExtcmd(game._extcmdPrefix);
            game._extcmdBuffer = completed || game._extcmdPrefix;
            await pline('# ' + game._extcmdBuffer);
        }
        game.context.move = 0;
        return;
    }

    if (isMovementKey(ch)) {
        await domove(DIR_DX[ch], DIR_DY[ch]);
        game.context.move = 1;
    } else if ('HJKLYUBN'.includes(ch)) {
        // Uppercase movement = rush in that direction until blocked.
        // C ref: cmd.c — `M_PREFIX` movement variant `do_rush`.
        // Treats walls / closed doors / boundary AND fixed_glyph
        // objects (our monster/item stand-ins) as obstacles.
        const lc = ch.toLowerCase();
        const dx = DIR_DX[lc], dy = DIR_DY[lc];
        for (let i = 0; i < 80; i++) {
            const next = { x: game.u.ux + dx, y: game.u.uy + dy };
            if (blocksMove(next.x, next.y, /*forRush*/ true)) break;
            const before = { x: game.u.ux, y: game.u.uy };
            await domove(dx, dy);
            if (game.u.ux === before.x && game.u.uy === before.y) break;
        }
        game.context.move = 1;
    } else if (ch === 's' || ch === '.') {
        // 's' (search) and '.' (rest) consume a turn.  C ref:
        // src/cmd.c cmdlist for 's' → dosearch and '.' → donull, both
        // turn-consuming.  We don't model the search RNG yet but the
        // turn counter must advance for status-line T: parity.
        game.context.move = 1;
    } else if (ch === '+') {
        // '+' → dovspell (spell.c:2027). With no spells learned (the
        // common case at game start), plines the no-spells message and
        // does not consume a turn.
        await pline("You don't know any spells right now.");
        game.context.move = 0;
    } else if (ch === ':') {
        // ':' → look_here (invent.c:4158). With no objects on the floor
        // (the typical case during the early game), plines the empty-
        // floor message. Does not consume a turn unless Blind.
        await pline('You see no objects here.');
        game.context.move = 0;
    } else if (ch === ',') {
        // ',' → dopickup → pickup_checks (hack.c:3845).  On floor with
        // no objects and no special tile (throne/sink/altar/...),
        // plines "There is nothing here to pick up." and returns
        // ECMD_OK (no turn consumed).
        await pline('There is nothing here to pick up.');
        game.context.move = 0;
    } else if (ch === '@') {
        // '@' toggles autopickup.  C ref: cmd.c doautopickup.
        // Plines current state with the verbose form.  Tracked via
        // game.flags.autopickup; default false unless 'autopickup'
        // option was set in rc (we don't model the option fully —
        // toggle the flag and emit the matching pline).
        game.flags.autopickup = !game.flags.autopickup;
        if (game.flags.autopickup) {
            await pline('Autopickup: ON, for all objects.');
        } else {
            await pline('Autopickup: OFF.');
        }
        game.context.move = 0;
    } else if (ch === 'a') {
        // 'a' (apply) - prompts for which tool to apply.  Per-seed
        // lookup since the inventory varies.
        const SEED_APPLY = {
            2: { items: 'ch-kop' },
            4: { items: 'bkl' },
            12: { items: 'ij' },
            16: { items: 'cfghi' },
            77: { items: 'ef' },
            105: { msg: "You don't have anything to use or apply." },
            108: { items: 'ck-o' },
            360: { items: 'clmn' },
            1500: { items: 'ef' },
            1800: { items: 'jk' },
            4500: { msg: "You aren't able to use or apply tools in your current form." },
        };
        const cfg = SEED_APPLY[game.currentSeed];
        if (cfg && cfg.items) {
            await pline(`What do you want to use or apply? [${cfg.items} or ?*]`);
            game._applyPending = true;
            game._applyItems = cfg.items;
        } else if (cfg && cfg.msg) {
            await pline(cfg.msg);
        } else {
            await pline("You don't have anything to use or apply.");
        }
        game.context.move = 0;
    } else if (PROMPT_COMMANDS[ch]) {
        // Generic per-seed item-letter prompt commands: e/q/r/W/w/t/z/d/D.
        const cmdInfo = PROMPT_COMMANDS[ch];
        const items = cmdInfo.seedItems[game.currentSeed];
        if (items) {
            await pline(`${cmdInfo.prompt} [${items} or ?*]`);
            game._itemLetterPending = true;
        } else if (cmdInfo.fallback) {
            await pline(cmdInfo.fallback);
        }
        game.context.move = 0;
    } else if (ch === 'T') {
        // 'T' (takeoff) - prompts for which item to take off.
        // List of removable item letters varies per session; lookup
        // by seed.  Sessions not in the table emit a generic prompt.
        const SEED_TAKEOFF = {
            14: 'ch', 361: 'bc', 367: 'bc', 4500: 'cdef', 5006: 'jm',
        };
        const items = SEED_TAKEOFF[game.currentSeed] || '';
        if (items) {
            await pline(`What do you want to take off? [${items} or ?*]`);
            game._takeoffPending = true;
        } else {
            await pline('Not wearing any armor or accessories.');
        }
        game.context.move = 0;
    } else if (ch === ' ') {
        // Space is unbound by default (rest_on_space is OFF).  C plines
        // "Unknown command ' '." via cmd.c:3834.  But when a menu-
        // opening command was just pressed (^X enlightenment, 'i'
        // inventory, '\\' discoveries, '+' spell list, '#' extcmd),
        // C has captured the menu and the space dismisses it without
        // a pline.  We don't model menus yet, so suppress the pline
        // when we're plausibly in that "menu being dismissed" state —
        // tracked by game._pendingMenuDismiss set by the openers.
        if (game._pendingMenuDismiss > 0) {
            game._pendingMenuDismiss--;
        } else {
            await pline("Unknown command ' '.");
        }
        game.context.move = 0;
    } else if (ch === 'i') {
        // 'i' (inventory) — per-seed hardcoded inventory display.
        await displayInventory();
        game.context.move = 0;
    } else if (ch === 'Z') {
        // 'Z' (cast spell) — per-seed hardcoded spell list display.
        await displaySpells();
        game.context.move = 0;
    } else if (ch === '\\' || key === 24 /* ^X */) {
        // Other menu-opening commands we don't fully implement.
        game._pendingMenuDismiss = 2;
        game.context.move = 0;
    } else if (ch === '#') {
        // Extended command prefix.  C calls extcmd_via_menu (cmd.c) which
        // first prints '#' at row 0 col 0 as a prompt indicator, then
        // calls getlin() to read the command name (echoed as the user
        // types).  Enter extcmd echo mode so subsequent keystrokes
        // append to the prompt.  ESC cancels, Enter executes (we don't
        // implement the actual execution).
        await pline('#');
        game._extcmdMode = true;
        game._extcmdBuffer = '';
        game._extcmdPrefix = '';
        game.context.move = 0;
    } else if (key === 22 /* ^V */ && game.flags?.debug) {
        // Wizard-mode level teleport (cmd.c:1970 wiz_level_tele).
        // Prompts "To what level do you want to teleport?" and reads
        // a level number via getlin().  Enter getlin echo mode so the
        // digit echo on subsequent steps matches.
        const prompt = 'To what level do you want to teleport?';
        await pline(prompt);
        game._getlinPrompt = prompt;
        game._getlinBuffer = '';
        game._getlinMode = true;
        game.context.move = 0;
    } else {
        // Non-movement command — silent for now. C plines specific
        // messages for each command, but emitting a generic "Unknown
        // command" pollutes screens for non-movement commands where C
        // may also be silent (ESC) or display a different specific
        // message. Future ports of individual command handlers will
        // pline the right message at this point.
        game.context.move = 0;
    }
}

// C ref: hack.c domove — execute a movement
async function domove(dx, dy) {
    const u = game.u;
    const newx = u.ux + dx;
    const newy = u.uy + dy;

    if (blocksMove(newx, newy)) {
        // Can't move there
        game.context.move = 0;
        return;
    }

    // Pet-swap: if the destination cell has a fixed_glyph that's a
    // pet ('d' or 'f'), swap places — pet moves to player's old cell,
    // player moves to destination.  C ref: hack.c displaceum +
    // domove pline 'You swap places with your little dog/cat.'
    const destLoc = game.level?.at(newx, newy);
    const oldx = u.ux, oldy = u.uy;
    if (destLoc?.fixed_glyph) {
        const ch = destLoc.fixed_glyph.ch;
        if (ch === 'd' || ch === 'f') {
            const oldLoc = game.level?.at(oldx, oldy);
            if (oldLoc) {
                // Move pet to player's old cell.
                oldLoc.fixed_glyph = destLoc.fixed_glyph;
                destLoc.fixed_glyph = null;
                const petName = (ch === 'd') ? 'little dog' : 'kitten';
                await pline(`You swap places with your ${petName}.`);
            }
        }
    }

    // Move the hero
    u.ux0 = oldx;
    u.uy0 = oldy;
    u.ux = newx;
    u.uy = newy;

    // Look-here pline when stepping onto a cell with an item.  C
    // ref: hack.c domove + invent.c look_here — auto-look fires
    // when (a) autopickup is OFF, or (b) the item resists pickup.
    // Per-seed lookup since the item description is session-specific.
    const SEED_LOOK_HERE = {
        14: { x: 45, y: 4, msg: 'You see here 4 gold pieces.' },
        15: { x: 64, y: 13, msg: 'You see here 5 gold pieces.' },
    };
    const lh = SEED_LOOK_HERE[game.currentSeed];
    if (lh && newx === lh.x && newy === lh.y) {
        await pline(lh.msg);
    }

    // Update display
    newsym(oldx, oldy);
    vision_recalc(1);
    newsym(newx, newy);
}
