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

        // C ref options.c parsebindings — BIND=key:command rebinds a
        // key to an extended command (seed2600's rc: BIND=v:inventory).
        const bindMatch = line.match(/^BIND=(.+)/i);
        if (bindMatch) {
            const bi = bindMatch[1].indexOf(':');
            if (bi > 0) {
                const keyTxt = bindMatch[1].slice(0, bi).trim();
                const cmdTxt = bindMatch[1].slice(bi + 1).trim().toLowerCase();
                // Key forms: single char, ^X (ctrl), M-x (meta).
                let code = null;
                if (keyTxt.length === 1) code = keyTxt.charCodeAt(0);
                else if (keyTxt.length === 2 && keyTxt[0] === '^') {
                    code = keyTxt.toUpperCase().charCodeAt(1) & 0x1f;
                }
                if (code != null) {
                    (result.binds = result.binds || []).push({ key: code, cmd: cmdTxt });
                }
            }
            continue;
        }
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
