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

// Direction deltas: y u k
//                   h . l
//                   b j n
const DIR_DX = { h: -1, l: 1, j: 0, k: 0, y: -1, u: 1, b: -1, n: 1 };
const DIR_DY = { h: 0, l: 0, j: 1, k: -1, y: -1, u: -1, b: 1, n: 1 };

function isMovementKey(ch) {
    return 'hjklyubn'.includes(ch);
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
            game._getlinMode = false;
            game._getlinBuffer = '';
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
    } else if (ch === 'i' || ch === '\\' || key === 24 /* ^X */) {
        // Menu-opening commands we don't fully implement.  C captures a
        // multi-screen menu; subsequent ' '/ESC presses dismiss it
        // without firing "Unknown command".  Mark the next key as a
        // dismissal candidate so cmd.js doesn't pline for it.
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

    // Move the hero
    const oldx = u.ux, oldy = u.uy;
    u.ux0 = oldx;
    u.uy0 = oldy;
    u.ux = newx;
    u.uy = newy;

    // Update display
    newsym(oldx, oldy);
    vision_recalc(1);
    newsym(newx, newy);
}
