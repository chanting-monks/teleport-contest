/* NetHack 5.0	utf8map.c	*/
/* Copyright (c) Michael Allison, 2021. */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free } from '../c2js-runtime/memory.js';
import { strchr, strcpy } from '../c2js-runtime/string.js';
import { hexdd } from './decl.js';
import { map_glyphinfo, nul_glyphinfo } from './display.js';
import { apply_customizations, find_matching_customization } from './glyphs.js';
import { MAX_GLYPH, custom_ureps, do_custom_symbols } from './nh-constants.js';
import { decode_glyph } from './windows.js';

/* symbols.c */
/* hexdd[] is defined in decl.c */
export function unicode_val(cp) {
    let dp = null;
    let cval = 0;
    let dcount = 0;
    if (cp && cp.value) {
        cval = dcount = 0;
        if ((cp.value == 85 || cp.value == 117) && cp[1] == 43 && cp[2] && (dp = strchr(hexdd, cp[2])) != null) {
            /* move past the 'U' and '+' */
            cp += 2;
            do {
                cval = (cval * 16) + (Math.trunc((dp - hexdd) / 2));
            } while (++cp && (dp = strchr(hexdd, cp.value)) != null && ++dcount < 7);
        }
    }
    return cval;
}
export function set_map_u(gmap, utf32ch, utf8str) {
    let tmpgm = gmap;
    if (!tmpgm || !utf32ch) {
        return 0;
    }
    if (gmap.u == null) {
        gmap.u = alloc(1 /* sizeof(struct unicode_representation) */);
        gmap.u.utf8str = null;
    }
    if (gmap.u.utf8str != null) {
        free(gmap.u.utf8str);
        gmap.u.utf8str = null;
    }
    gmap.u.utf8str = dupstr(utf8str);
    gmap.u.utf32ch = utf32ch;
    return 1;
}
export function free_all_glyphmap_u() {
    let glyph = 0;
    let x = 0;
    let y = 0;
    for (glyph = 0; glyph < MAX_GLYPH; ++glyph) {
        if (game.glyphmap[glyph].u) {
            if (game.glyphmap[glyph].u.utf8str) {
                free(game.glyphmap[glyph].u.utf8str);
                game.glyphmap[glyph].u.utf8str = null;
            }
            free(game.glyphmap[glyph].u);
            game.glyphmap[glyph].u = null;
        }
    }
    for (y = 0; y < 21; ++y) {
        for (x = 0; x < 80; ++x) {
            /* Prevent use after free from gg.gbuf */
            game.gbuf[y][x].glyphinfo.gm.u = null;
        }
    }
}
/* helper routine if a window port wants to embed any UTF-8 sequences
   for the glyph representation in the string in place of the \GNNNNNNNN
   reference */
export function mixed_to_utf8(buf, bufsz, str, retflags) {
    let put = buf;
    let glyphinfo = nul_glyphinfo;
    if (!str) {
        return strcpy(buf, "");
    }
    while (str.value && put < (buf + bufsz) - 1) {
        if (str.value == 92) {
            let dcount = 0;
            let so = 0;
            let ggv = 0;
            let save_str = null;
            save_str = str++;
            switch (str.value) {
                case 71:
                    if ((dcount = decode_glyph(str + 1, { get value() { return ggv; }, set value(_v) { ggv = _v; } }))) {
                        str += (dcount + 1);
                        map_glyphinfo(0, 0, ggv, 0, glyphinfo);
                        if (glyphinfo.gm.u && glyphinfo.gm.u.utf8str) {
                            let ucp = glyphinfo.gm.u.utf8str;
                            while (ucp && put < (buf + bufsz) - 1) {
                                void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = ucp++) */;
                            }
                            if (retflags) {
                                retflags.value = 1;
                            }
                        } else {
                            so = glyphinfo.gm.sym.symidx;
                            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = game.showsyms[so]) */;
                            if (retflags) {
                                retflags.value = 0;
                            }
                        }
                        /* 'str' is ready for the next loop iteration and
                        '*str' should not be copied at the end of this
                        iteration */
                        continue;
                    } else {
                        /* possible forgery - leave it the way it is */
                        str = save_str;
                    }
                    break;
                case 92:
                    break;
                case 0:
                    str = save_str;
                    break;
            }
        }
        if (put < (buf + bufsz) - 1) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = str++) */;
        }
    }
    put.value = 0;
    return buf;
}
export function add_custom_urep_entry(customization_name, glyphidx, utf32ch, utf8str, which_set) {
    let gdc = game.sym_customizations[which_set][custom_ureps];
    let details = null;
    let newdetails = null;
    if (!gdc.details) {
        gdc.customization_name = dupstr(customization_name);
        gdc.custtype = custom_ureps;
        gdc.details = null;
        gdc.details_end = null;
    }
    details = find_matching_customization(customization_name, custom_ureps, which_set);
    if (details) {
        while (details) {
            if (details.content.urep.glyphidx == glyphidx) {
                if (details.content.urep.u.utf8str) {
                    free(details.content.urep.u.utf8str);
                }
                if (utf32ch) {
                    details.content.urep.u.utf8str = dupstr(utf8str);
                    details.content.urep.u.utf32ch = utf32ch;
                } else {
                    details.content.urep.u.utf8str = null;
                    details.content.urep.u.utf32ch = 0;
                }
                return 1;
            }
            details = details.next;
        }
    }
    /* create new details entry */
    newdetails = alloc(1 /* sizeof(struct customization_detail) */);
    newdetails.content.urep.glyphidx = glyphidx;
    if (utf8str && utf8str) {
        newdetails.content.urep.u.utf8str = dupstr(utf8str);
    } else {
        newdetails.content.urep.u.utf8str = null;
    }
    newdetails.content.urep.u.utf32ch = utf32ch;
    newdetails.next = null;
    if (gdc.details == (null)) {
        gdc.details = newdetails;
    } else {
        gdc.details_end.next = newdetails;
    }
    gdc.details_end = newdetails;
    gdc.count++;
    return 1;
}
/* ENHANCED_SYMBOLS */
export function reset_customsymbols() {
    free_all_glyphmap_u();
    apply_customizations(game.currentgraphics, do_custom_symbols);
}
/* utf8map.c */
/* String ended with '\\'.  This can happen when someone
                    names an object with a name ending with '\\', drops the
                    named object on the floor nearby and does a look at all
                    nearby objects. */
/* brh - should we perhaps not allow things to have names
                    that contain '\\' */
