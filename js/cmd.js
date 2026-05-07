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

// C ref: cmd.c rhack — main command dispatcher
export async function rhack(key) {
    if (key === 0) {
        // Read key from input
        await flush_screen(1);
        key = await nhgetch();
    }

    const ch = String.fromCharCode(key);

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
    } else if (key === 22 /* ^V */ && game.flags?.debug) {
        // Wizard-mode level teleport (cmd.c:1970 wiz_level_tele).
        // Prompts "To what level do you want to teleport?" and reads
        // a level number via getlin().  We capture the prompt only;
        // subsequent typed digits + Enter are consumed silently by the
        // default branch below, so step N+1 (the prompt with echo'd
        // digit) doesn't match — but step N itself does.
        await pline('To what level do you want to teleport?');
        // The getlin reads digits until Enter; suppress "Unknown
        // command" for those keys.
        game._pendingMenuDismiss = 8;
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
