/* NetHack 5.0	questpgr.c	$NHDT-Date: 1704043695 2023/12/31 17:28:15 $  $NHDT-Branch: keni-luabits2 $:$NHDT-Revision: 1.87 $ */
/*      Copyright 1991, M. Stephenson                             */
/* NetHack may be freely redistributed.  See license for details. */
/*  quest-specific pager routines. */
import { game } from '../gstate.js';
import { get_table_option, get_table_str_opt, luaL_checkstring, lua_getfield, lua_getglobal, lua_gettable, lua_istable, lua_len, lua_pop, lua_pushinteger, lua_settop, lua_tointeger, nhl_done, nhl_init, nhl_loadlua } from '../c2js-runtime/lua.js';
import { free } from '../c2js-runtime/memory.js';
import { impossible, panic } from '../c2js-runtime/panic.js';
import { pline } from '../c2js-runtime/pline.js';
import { sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, nh_strchr_truncate, strcat, strchr, strcpy, strlen, strncmpi, strstri } from '../c2js-runtime/string.js';
import { artiname } from './artifact.js';
import { rank_of } from './botl.js';
import { copynchars, eos, highc, lowc, s_suffix, strNsubst } from './hacklib.js';
import { align_str } from './insight.js';
import { mkclass } from './makemon.js';
import { BLINDED, MS_GUARDIAN, MS_LEADER, MS_NEMESIS, NEUTRAL, NON_PM } from './nh-constants.js';
import { An, an, makeplural, makesingular, the } from './objnam.js';
import { align_gname, align_gtitle } from './pray.js';
import { rn2 } from './rnd.js';
import { genders } from './role.js';

/* sometimes find_qarti(gi.invent), and gi.invent can be null */
export async function quest_info(typ) {
    switch (typ) {
        case 0:
            return game.urole.questarti;
        case MS_LEADER:
            return game.urole.ldrnum;
        case MS_NEMESIS:
            return game.urole.neminum;
        case MS_GUARDIAN:
            return game.urole.guardnum;
        default:
            await impossible("quest_info(%d)", typ);
    }
    return 0;
}
/* return your role leader's name */
export function ldrname() {
    let i = game.urole.ldrnum;
    game.nambuf = sprintf(game.nambuf, "%s%s", (((game.mons[i]).mflags2 & 524288) != 0) ? "" : "the ", game.mons[i].pmnames[NEUTRAL]);
    return game.nambuf;
}
/* return your intermediate target string */
export function intermed() {
    return game.urole.intermed;
}
export function is_quest_artifact(otmp) {
    return (otmp.oartifact == game.urole.questarti);
}
export function find_qarti(ochain) {
    let otmp = null;
    let qarti = null;
    for (otmp = ochain; otmp; otmp = otmp.nobj) {
        if (is_quest_artifact(otmp)) {
            return otmp;
        }
        if (((otmp).cobj != null) && (qarti = find_qarti(otmp.cobj)) != null) {
            return qarti;
        }
    }
    return null;
}
/* check several object chains for the quest artifact to determine
   whether it is present on the current level */
export function find_quest_artifact(whichchains) {
    let mtmp = null;
    let qarti = null;
    if ((whichchains & (1 << 3)) != 0) {
        qarti = find_qarti(game.invent);
    }
    if (!qarti && (whichchains & (1 << 1)) != 0) {
        qarti = find_qarti(game.level.objlist);
    }
    if (!qarti && (whichchains & (1 << 4)) != 0) {
        for (mtmp = game.level.monlist; mtmp; mtmp = mtmp.nmon) {
            /* check migrating objects and minvent of migrating monsters */
            if (((mtmp).mhp < 1)) {
                continue;
            }
            if ((qarti = find_qarti(mtmp.minvent)) != null) {
                break;
            }
        }
    }
    if (!qarti && (whichchains & (1 << 5)) != 0) {
        for (mtmp = game.migrating_mons; mtmp; mtmp = mtmp.nmon) {
            if (((mtmp).mhp < 1)) {
                continue;
            }
            if ((qarti = find_qarti(mtmp.minvent)) != null) {
                break;
            }
        }
        if (!qarti) {
            qarti = find_qarti(game.migrating_objs);
        }
    }
    if (!qarti && (whichchains & (1 << 6)) != 0) {
        qarti = find_qarti(game.level.buriedobjlist);
    }
    return qarti;
}
/* return your role nemesis' name */
export function neminame() {
    let i = game.urole.neminum;
    game.nambuf = sprintf(game.nambuf, "%s%s", (((game.mons[i]).mflags2 & 524288) != 0) ? "" : "the ", game.mons[i].pmnames[NEUTRAL]);
    return game.nambuf;
}
/* return your role leader's guard monster name */
export function guardname() {
    let i = game.urole.guardnum;
    return game.mons[i].pmnames[NEUTRAL];
}
/* return your role leader's location */
export function homebase() {
    return game.urole.homebase;
}
/* returns 1 if nemesis death message mentions noxious fumes, otherwise 0;
   does not display the message */
export async function stinky_nemesis(mon) {
    let mesg = null;
    let res = 0;
    ((mon));
    await com_pager_core(game.urole.filecode, "killed_nemesis", 0, { get value() { return mesg; }, set value(_v) { mesg = _v; } });
    if (mesg) {
        /* this is somewhat fragile; it assumes that when both {noxious or
       poisonous or toxic} and {gas or fumes} are present, the latter
       refers to the former rather than to something unrelated; it does
       make sure that fumes occurs after noxious rather than before */
        let p = null;
        /* change newlines into spaces to cope with "...noxious\nfumes..." */
        strNsubst(mesg, "\n", " ", 0);
        if (((p = strstri(mesg, "noxious")) != null || (p = strstri(mesg, "poisonous")) != null || (p = strstri(mesg, "toxic")) != null) && (strstri(p, " gas") || strstri(p, " fumes"))) {
            res = 1;
        }
        free(mesg);
    }
    return res;
}
/* replace deity, leader, nemesis, or artifact name with pronoun;
   overwrites cvt_buf[] */
/* 'd' => deity, 'l' => leader, 'n' => nemesis, 'o' => arti */
/* 'h'|'H'|'i'|'I'|'j'|'J' */
export async function qtext_pronoun(who, which) {
    let pnoun = null;
    let godgend = 0;
    let lwhich = lowc(which);
    if (who == 111 && (strstri(game.cvt_buf, "Eyes ") || strncmpi((game.cvt_buf), (await makesingular(game.cvt_buf)), -1))) {
        /*
     * Invalid subject (not d,l,n,o) yields neuter, singular result.
     *
     * For %o, treat all artifacts as neuter; some have plural names,
     * which genders[] doesn't handle; cvt_buf[] already contains name.
     */
        pnoun = (lwhich == 104) ? "they" : (lwhich == 105) ? "them" : (lwhich == 106) ? "their" : "?";
    } else {
        godgend = (who == 100) ? game.quest_status.godgend : (who == 108) ? game.quest_status.ldrgend : (who == 110) ? game.quest_status.nemgend : 2;
        pnoun = (lwhich == 104) ? genders[godgend].he : (lwhich == 105) ? genders[godgend].him : (lwhich == 106) ? genders[godgend].his : "?";
    }
    game.cvt_buf = strcpy(game.cvt_buf, pnoun);
    if (lwhich != which) {
        game.cvt_buf[0] = highc(game.cvt_buf[0]);
    }
    return;
}
export async function convert_arg(c) {
    let str = null;
    switch (c) {
        case 112:
            str = game.plname;
            break;
        case 99:
            str = (game.flags.female && game.urole.name.f) ? game.urole.name.f : game.urole.name.m;
            break;
        case 114:
            str = rank_of(game.u.ulevel, (game.urole.mnum), game.flags.female);
            break;
        case 82:
            str = rank_of(14, (game.urole.mnum), game.flags.female);
            break;
        case 115:
            str = (game.flags.female) ? "sister" : "brother";
            break;
        case 83:
            str = (game.flags.female) ? "daughter" : "son";
            break;
        case 108:
            str = ldrname();
            break;
        case 105:
            str = intermed();
            break;
        case 79:
        case 111:
            str = await the(artiname(game.urole.questarti));
            if (c == 79) {
                /* shorten "the Foo of Bar" to "the Foo"
               (buffer returned by the() is modifiable) */
                let p = strstri(str, " of ");
                if (p) {
                    str = nh_strchr_truncate(str, " of ", 'stri');
                }
            }
            break;
        case 110:
            str = neminame();
            break;
        case 103:
            str = guardname();
            break;
        case 71:
            str = align_gtitle(game.u.ualignbase[1]);
            break;
        case 72:
            str = homebase();
            break;
        case 97:
            str = align_str(game.u.ualignbase[1]);
            break;
        case 65:
            str = align_str(game.u.ualign.type);
            break;
        case 100:
            str = await align_gname(game.u.ualignbase[1]);
            break;
        case 68:
            str = await align_gname(1);
            break;
        case 67:
            str = "chaotic";
            break;
        case 78:
            str = "neutral";
            break;
        case 76:
            str = "lawful";
            break;
        case 120:
            str = ((game.u.uprops[BLINDED].intrinsic || game.u.uprops[BLINDED].extrinsic) && !game.u.uprops[BLINDED].blocked) ? "sense" : "see";
            break;
        case 90:
            str = game.dungeons[0].dname;
            break;
        case 37:
            str = "%";
            break;
        default:
            str = "";
            break;
    }
    game.cvt_buf = strcpy(game.cvt_buf, str);
}
export async function convert_line(in_line, out_line) {
    let c = null;
    let cc = null;
    cc = out_line;
    for (c = in_line; __nh_char_at0(c); (c = __nh_advance_str(c, 1))) {
        void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
        switch (__nh_char_at0(c)) {
            case 13:
            case 10:
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
                return;
            case 37:
                if (__nh_char_at0((__nh_advance_str(c, 1)))) {
                    await convert_arg(__nh_char_at0(((c = __nh_advance_str(c, 1)))));
                    switch (__nh_char_at0(((c = __nh_advance_str(c, 1))))) {
                        case 65:
                            cc = strcat(cc, await An(game.cvt_buf));
                            cc = __nh_advance_str(cc, strlen(cc));
                            continue;
                        case 97:
                            cc = strcat(cc, await an(game.cvt_buf));
                            cc = __nh_advance_str(cc, strlen(cc));
                            continue;
                        case 67:
                            game.cvt_buf[0] = highc(game.cvt_buf[0]);
                            break;
                        case 104:
                        case 72:
                        case 105:
                        case 73:
                        case 106:
                        case 74:
                            if (strchr("dlno", lowc(__nh_char_at0((c - 1))))) {
                                await qtext_pronoun(__nh_char_at0((c - 1)), __nh_char_at0(c));
                            /* replace name with pronoun;
                   valid for %d, %l, %n, and %o */
                            } else {
                                (c = __nh_advance_str(c, -1));
                            }
                            break;
                        case 80:
                            game.cvt_buf[0] = highc(game.cvt_buf[0]);
                            ;
                        case 112:
                            game.cvt_buf = strcpy(game.cvt_buf, await makeplural(game.cvt_buf));
                            break;
                        /* append possessive suffix */
                        case 83:
                            game.cvt_buf[0] = highc(game.cvt_buf[0]);
                            ;
                        case 115:
                            game.cvt_buf = strcpy(game.cvt_buf, s_suffix(game.cvt_buf));
                            break;
                        case 116:
                            if (!strncmpi(game.cvt_buf, "the ", 4)) {
                                cc = strcat(cc, game.cvt_buf[4]);
                                cc = __nh_advance_str(cc, strlen(cc));
                                continue;
                            }
                            break;
                        default:
                            (c = __nh_advance_str(c, -1));
                            break;
                    }
                    cc = strcat(cc, game.cvt_buf);
                    cc = __nh_advance_str(cc, strlen(game.cvt_buf));
                    break;
                }
                ;
            default:
                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = __nh_char_at0(c)) */;
                break;
        }
        if (cc > __nh_advance_str(out_line, 256 - 1)) {
            await panic("convert_line: overflow");
        }
    }
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    return;
}
export async function deliver_by_pline(str) {
    let in_line = '';
    let out_line = '';
    let msgp = str;
    let msgend = eos(str);
    while (msgp < msgend) {
        /* copynchars() will stop at newline if it finds one */
        in_line = copynchars(in_line, msgp, 256 /* sizeof(char [256]) */ - 1);
        msgp = __nh_advance_str(msgp, strlen(in_line) + 1);
        await convert_line(in_line, out_line);
        await pline("%s", out_line);
    }
}
export async function deliver_by_window(msg, how) {
    let in_line = '';
    let out_line = '';
    let msgp = msg;
    let msgend = eos(msg);
    let datawin = (game.windowprocs.win_create_nhwindow)(how);
    while (msgp < msgend) {
        in_line = copynchars(in_line, msgp, 256 /* sizeof(char [256]) */ - 1);
        msgp = __nh_advance_str(msgp, strlen(in_line) + 1);
        await convert_line(in_line, out_line);
        (game.windowprocs.win_putstr)(datawin, 0, out_line);
    }
    await (game.windowprocs.win_display_nhwindow)(datawin, 1);
    (game.windowprocs.win_destroy_nhwindow)(datawin);
}
export function skip_pager(common) {
    /* WIZKIT: suppress plot feedback if starting with quest artifact */
    if (game.program_state.wizkit_wishing) {
        return 1;
    }
    return 0;
}
const __com_pager_core_howtoput = ["pline", "window", "text", "menu", "default", null];
const __com_pager_core_howtoput2i = [1, 2, 2, 3, 0, 0];
export async function com_pager_core(section, msgid, showerror, rawtext) {
    let output = 0;
    let L = null;
    let text = null;
    let synopsis = null;
    let fallback_msgid = null;
    let res = 0;
    let sbi = { flags: 0, memlimit: 0, steps: 0, perpcall: 0 };
    text = null;
    synopsis = null;
    fallback_msgid = null;
    res = 0;
    sbi = { flags: 2147483648, memlimit: 1 * 1024 * 1024, steps: 0, perpcall: 1 * 1024 * 1024 };
    if (skip_pager(1)) {
        return 0;
    }
    compagerdone: {
    L = await nhl_init(sbi);
    if (!L) {
        if (showerror) {
            await impossible("com_pager: nhl_init() failed");
        }
        break compagerdone;
    }
    if (!await nhl_loadlua(L, "quest.lua")) {
        if (showerror) {
            await impossible("com_pager: %s not found.", "quest.lua");
        }
        break compagerdone;
    }
    lua_settop(L, 0);
    lua_getglobal(L, "questtext");
    if (!lua_istable(L, -1)) {
        if (showerror) {
            await impossible("com_pager: questtext in %s is not a lua table", "quest.lua");
        }
        break compagerdone;
    }
    lua_getfield(L, -1, section);
    if (!lua_istable(L, -1)) {
        if (showerror) {
            await impossible("com_pager: questtext[%s] in %s is not a lua table", section, "quest.lua");
        }
        break compagerdone;
    }
    tryagain: while (true) {
        lua_getfield(L, -1, fallback_msgid ? fallback_msgid : msgid);
        if (!lua_istable(L, -1)) {
            if (!fallback_msgid) {
                /* Do we have questtxt[msg_fallbacks][<msgid>]? */
                lua_getfield(L, -3, "msg_fallbacks");
                if (lua_istable(L, -1)) {
                    fallback_msgid = get_table_str_opt(L, msgid, null);
                    lua_pop(L, 2);
                    if (fallback_msgid) {
                        continue tryagain;
                    }
                }
            }
            if (showerror) {
                if (!fallback_msgid) {
                    await impossible("com_pager: questtext[%s][%s] in %s is not a lua table", section, msgid, "quest.lua");
                } else {
                    await impossible("com_pager: questtext[%s][%s] and [][%s] in %s are not lua tables", section, msgid, fallback_msgid, "quest.lua");
                }
            }
            break compagerdone;
        }
        text = get_table_str_opt(L, "text", null);
        if (rawtext) {
            rawtext.value = dupstr(text);
            res = 1;
            break compagerdone;
        }
        synopsis = get_table_str_opt(L, "synopsis", null);
        output = __com_pager_core_howtoput2i[get_table_option(L, "output", "default", __com_pager_core_howtoput)];
        if (!text) {
            let nelems = 0;
            lua_len(L, -1);
            nelems = lua_tointeger(L, -1);
            lua_pop(L, 1);
            if (nelems < 2) {
                if (showerror) {
                    await impossible("com_pager: questtext[%s][%s] in %s is not an array of strings", section, fallback_msgid ? fallback_msgid : msgid, "quest.lua");
                }
                break compagerdone;
            }
            nelems = rn2(nelems) + 1;
            lua_pushinteger(L, nelems);
            lua_gettable(L, -2);
            text = dupstr(luaL_checkstring(L, -1));
        }
        if (output == 0 && (strchr(text, 10) || strlen(text) >= 256 - 1)) {
            /* switch from by_pline to by_window if line has multiple segments or
       is unreasonably long (the latter ought to checked after formatting
       conversions rather than before...) */
            output = 2;
            if (!synopsis) {
                /*
         * FIXME:  should update quest.lua to include proper synopsis line
         * for any item subject to having its delivery converted to by_window.
         */
                let tmpbuf = '';
                tmpbuf = sprintf(tmpbuf, "[%.*s]", 256 - 1 - 2, text);
                /* change every newline character to a space */
                strNsubst(tmpbuf, "\n", " ", 0);
                synopsis = dupstr(tmpbuf);
            }
        }
        if (output == 0 || output == 1) {
            await deliver_by_pline(text);
        } else {
            await deliver_by_window(text, (output == 3) ? 4 : 5);
        }
        if (synopsis) {
            let in_line = '';
            let out_line = '';
            in_line = strcpy(in_line, synopsis);
            await convert_line(in_line, out_line);
            /* bypass message delivery but be available for ^P recall */
            (game.windowprocs.win_putmsghistory)(out_line, 0);
        }
        res = 1;
        break tryagain;
    }
    }
    if (text) {
        free(text);
    }
    if (synopsis) {
        free(synopsis);
    }
    if (fallback_msgid) {
        free(fallback_msgid);
    }
    nhl_done(L);
    return res;
}
export async function com_pager(msgid) {
    await com_pager_core("common", msgid, 1, null);
}
export async function qt_pager(msgid) {
    if (!await com_pager_core(game.urole.filecode, msgid, 0, null)) {
        await com_pager_core("common", msgid, 1, null);
    }
}
export async function qt_montype() {
    let qpm = 0;
    if (rn2(5)) {
        qpm = game.urole.enemy1num;
        if (qpm != NON_PM && rn2(5) && !(game.mvitals[qpm].mvflags & 2)) {
            return game.mons[qpm];
        }
        return await mkclass(game.urole.enemy1sym, 0);
    }
    qpm = game.urole.enemy2num;
    if (qpm != NON_PM && rn2(5) && !(game.mvitals[qpm].mvflags & 2)) {
        return game.mons[qpm];
    }
    return await mkclass(game.urole.enemy2sym, 0);
}
/* special levels can include a custom arrival message; display it */
export async function deliver_splev_message() {
    if (game.lev_message) {
        await deliver_by_pline(game.lev_message);
        free(game.lev_message);
        game.lev_message = null;
    }
}
/*questpgr.c*/
/* get the quest text for dying nemesis; don't assume that mon is
       hero's own role's nemesis (overkill since m_detach() and nemdead()
       both make that assumption--valid for normal play but not necessarily
       valid for wizard mode) */
/* since nemdead() just gave the message for hero's nemesis even if 'mon'
       is some other role's nemesis (feasible in wizard mode), base any gas
       cloud on the text that was shown even if not appropriate for 'mon' */
/* not yet -- brackets need to be removed from quest.lua */
/* there's no provision for delivering via window instead of pline */
