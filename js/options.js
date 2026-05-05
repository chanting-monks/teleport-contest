// options.js — Parse .nethackrc options.
// C ref: options.c — handles OPTIONS=, BIND=, etc.

import { game } from './gstate.js';

export function parseNethackrc(rc) {
    const result = {
        name: '', role: -1, race: -1, gender: -1, align: -1,
        flags: {}, iflags: {},
    };
    if (!rc) return result;

    for (const rawLine of rc.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const optMatch = line.match(/^OPTIONS=(.+)/i);
        if (!optMatch) continue;

        for (const opt of optMatch[1].split(',')) {
            const trimmed = opt.trim();
            if (!trimmed) continue;

            const negated = trimmed.startsWith('!');
            const stripped = negated ? trimmed.slice(1) : trimmed;

            const colonIdx = stripped.indexOf(':');
            if (colonIdx >= 0) {
                const key = stripped.slice(0, colonIdx).trim().toLowerCase();
                const val = stripped.slice(colonIdx + 1).trim();

                if (key === 'name') result.name = val;
                else if (key === 'role') result.role = val;
                else if (key === 'race') result.race = val;
                else if (key === 'gender') result.gender = val;
                else if (key === 'align') result.align = val;
                else if (key === 'playmode' && val === 'debug') result.flags.debug = true;
                else if (key === 'playmode' && val === 'explore') result.flags.explore = true;
                else if (key === 'pettype' || key === 'pet') {
                    result.flags.pettype = val;
                    if (val === 'none' || val === 'n') result.preferred_pet = 'n';
                    else if (val === 'dog' || val === 'd') result.preferred_pet = 'd';
                    else if (val === 'cat' || val === 'c') result.preferred_pet = 'c';
                }
                else if (key === 'symset') result.symset = val;
                else if (key === 'suppress_alert') result.flags.suppress_alert = val;
                else if (key === 'msg_window') result.iflags.prevmsg_window = val;
                else result.flags[key] = val;
            } else {
                // Boolean flag
                const lname = stripped.toLowerCase();
                const value = !negated;

                if (lname === 'autopickup') result.flags.pickup = value;
                else if (lname === 'color') result.flags.color = value;
                else if (lname === 'legacy') result.flags.legacy = value;
                else if (lname === 'tutorial') { result.flags.tutorial = value; result.tutorial_set = true; }
                else if (lname === 'splash_screen') result.iflags.wc_splash_screen = value;
                else if (lname === 'pushweapon') result.flags.pushweapon = value;
                else if (lname === 'showexp') result.flags.showexp = value;
                else if (lname === 'time') result.flags.time = value;
                else if (lname === 'verbose') result.flags.verbose = value;
                else result.flags[lname] = value;
            }
        }
    }
    return result;
}

// Detects the "full-random chargen" pattern: the user's nethackrc lacks
// role/race/gender/align AND the first chargen-prompt response is one
// of y/a/space/return/@/* (all of which trigger pick_role+pick_race+
// pick_gend+pick_align via role.c:2300). The chargen prompt fires after
// name entry; in moves the name is the run of letters/digits before the
// first \r or \n.
//
// C ref: role.c:2249-2301 — "Shall I pick a character for you? [ynaq]"
// y/a/space/\r/\n/@/* → randomize; n → manual menu (different rn2 path,
// not handled here).
//
// Returns true if the pattern matches, false otherwise (rc has any of
// role/race/gender/align set, or first response is 'n'/'q'/letter).
export function detectFullRandomChargen(opts, moves) {
    if (!moves) return false;
    const hasRole = opts.role && opts.role !== -1;
    const hasRace = opts.race && opts.race !== -1;
    const hasGend = opts.gender && opts.gender !== -1;
    const hasAlgn = opts.align && opts.align !== -1;
    if (hasRole || hasRace || hasGend || hasAlgn) return false;
    let idx = 0;
    while (idx < moves.length && moves[idx] !== '\r' && moves[idx] !== '\n') idx++;
    if (idx >= moves.length - 1) return false;
    idx++;
    const ch = moves[idx];
    return ch === 'y' || ch === 'Y' || ch === 'a' || ch === 'A'
        || ch === ' ' || ch === '\r' || ch === '\n'
        || ch === '@' || ch === '*';
}
