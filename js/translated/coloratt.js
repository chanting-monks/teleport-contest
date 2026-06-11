/* NetHack 5.0	coloratt.c	$NHDT-Date: 1737286550 2025/01/19 03:35:50 $  $NHDT-Branch: NetHack-3.7 $:$NHDT-Revision: 1.14 $ */
/* Copyright (c) Pasi Kallinen, 2024 */
/* NetHack may be freely redistributed.  See license for details. */
import { game } from '../gstate.js';
import { alloc, free, memcpy } from '../c2js-runtime/memory.js';
import { regex_id } from '../c2js-runtime/regex.js';
import { nh_snprintf, sprintf } from '../c2js-runtime/stdio.js';
import { __nh_advance_str, __nh_char_at0, atoi, nh_strchr_truncate, strchr, strlen, strncmpi, strncpy, strstri } from '../c2js-runtime/string.js';
import { cg, hexdd } from './decl.js';
import { nul_glyphinfo } from './display.js';
import { digit, fuzzymatch, mungspaces } from './hacklib.js';
import { HL_BLINK, HL_BOLD, HL_DIM, HL_INVERSE, HL_ITALIC, HL_NONE, HL_ULINE, _ISspace, nh_color, no_color, rgb_color } from './nh-constants.js';
import { add_menu, select_menu } from './windows.js';

// struct color_names: { name, color }
const colornames = [{ name: "black", color: 0 }, { name: "red", color: 1 }, { name: "green", color: 2 }, { name: "brown", color: 3 }, { name: "blue", color: 4 }, { name: "magenta", color: 5 }, { name: "cyan", color: 6 }, { name: "gray", color: 7 }, { name: "orange", color: 9 }, { name: "light green", color: 10 }, { name: "yellow", color: 11 }, { name: "light blue", color: 12 }, { name: "light magenta", color: 13 }, { name: "light cyan", color: 14 }, { name: "white", color: 15 }, { name: "no color", color: 8 }, { name: null, color: 0 }, { name: "transparent", color: 8 }, { name: "purple", color: 5 }, { name: "light purple", color: 13 }, { name: "bright purple", color: 13 }, { name: "grey", color: 7 }, { name: "bright red", color: 9 }, { name: "bright green", color: 10 }, { name: "bright blue", color: 12 }, { name: "bright magenta", color: 13 }, { name: "bright cyan", color: 14 }];
/* everything after this is an alias */
// struct attr_names: { name, attr }
const attrnames = [{ name: "none", attr: 0 }, { name: "bold", attr: 1 }, { name: "dim", attr: 2 }, { name: "italic", attr: 3 }, { name: "underline", attr: 4 }, { name: "blink", attr: 5 }, { name: "inverse", attr: 7 }, { name: null, attr: 0 }, { name: "normal", attr: 0 }, { name: "uline", attr: 4 }, { name: "reverse", attr: 7 }];
/* everything after this is an alias */
/* { colortyp, tableindex, rgbindx, name, r, g, b }, */
export const colortable = [{ colortyp: nh_color, tableindex: 0, rgbindex: 0, name: "black", r: 0, g: 0, b: 0 }, { colortyp: nh_color, tableindex: 1, rgbindex: 0, name: "red", r: 255, g: 0, b: 0 }, { colortyp: nh_color, tableindex: 2, rgbindex: 0, name: "green", r: 34, g: 139, b: 34 }, { colortyp: nh_color, tableindex: 3, rgbindex: 0, name: "brown", r: 165, g: 42, b: 42 }, { colortyp: nh_color, tableindex: 4, rgbindex: 0, name: "blue", r: 0, g: 0, b: 255 }, { colortyp: nh_color, tableindex: 5, rgbindex: 0, name: "magenta", r: 255, g: 0, b: 255 }, { colortyp: nh_color, tableindex: 6, rgbindex: 0, name: "cyan", r: 0, g: 255, b: 255 }, { colortyp: nh_color, tableindex: 7, rgbindex: 0, name: "gray", r: 128, g: 128, b: 128 }, { colortyp: no_color, tableindex: 8, rgbindex: 0, name: "nocolor", r: 0, g: 0, b: 0 }, { colortyp: nh_color, tableindex: 9, rgbindex: 0, name: "orange", r: 255, g: 165, b: 0 }, { colortyp: nh_color, tableindex: 10, rgbindex: 0, name: "bright-green", r: 0, g: 128, b: 0 }, { colortyp: nh_color, tableindex: 11, rgbindex: 0, name: "yellow", r: 255, g: 255, b: 0 }, { colortyp: nh_color, tableindex: 12, rgbindex: 0, name: "bright-blue", r: 173, g: 216, b: 230 }, { colortyp: nh_color, tableindex: 13, rgbindex: 0, name: "bright-magenta", r: 147, g: 112, b: 219 }, { colortyp: nh_color, tableindex: 14, rgbindex: 0, name: "light-cyan", r: 224, g: 255, b: 255 }, { colortyp: nh_color, tableindex: 15, rgbindex: 0, name: "white", r: 255, g: 255, b: 255 }, { colortyp: rgb_color, tableindex: 16, rgbindex: 0, name: "maroon", r: 128, g: 0, b: 0 }, { colortyp: rgb_color, tableindex: 17, rgbindex: 1, name: "dark-red", r: 139, g: 0, b: 0 }, { colortyp: rgb_color, tableindex: 18, rgbindex: 2, name: "brown", r: 165, g: 42, b: 42 }, { colortyp: rgb_color, tableindex: 19, rgbindex: 3, name: "firebrick", r: 178, g: 34, b: 34 }, { colortyp: rgb_color, tableindex: 20, rgbindex: 4, name: "crimson", r: 220, g: 20, b: 60 }, { colortyp: rgb_color, tableindex: 21, rgbindex: 5, name: "red", r: 255, g: 0, b: 0 }, { colortyp: rgb_color, tableindex: 22, rgbindex: 6, name: "tomato", r: 255, g: 99, b: 71 }, { colortyp: rgb_color, tableindex: 23, rgbindex: 7, name: "coral", r: 255, g: 127, b: 80 }, { colortyp: rgb_color, tableindex: 24, rgbindex: 8, name: "indian-red", r: 205, g: 92, b: 92 }, { colortyp: rgb_color, tableindex: 25, rgbindex: 9, name: "light-coral", r: 240, g: 128, b: 128 }, { colortyp: rgb_color, tableindex: 26, rgbindex: 10, name: "dark-salmon", r: 233, g: 150, b: 122 }, { colortyp: rgb_color, tableindex: 27, rgbindex: 11, name: "salmon", r: 250, g: 128, b: 114 }, { colortyp: rgb_color, tableindex: 28, rgbindex: 12, name: "light-salmon", r: 255, g: 160, b: 122 }, { colortyp: rgb_color, tableindex: 29, rgbindex: 13, name: "orange-red", r: 255, g: 69, b: 0 }, { colortyp: rgb_color, tableindex: 30, rgbindex: 14, name: "dark-orange", r: 255, g: 140, b: 0 }, { colortyp: rgb_color, tableindex: 31, rgbindex: 15, name: "orange", r: 255, g: 165, b: 0 }, { colortyp: rgb_color, tableindex: 32, rgbindex: 16, name: "gold", r: 255, g: 215, b: 0 }, { colortyp: rgb_color, tableindex: 33, rgbindex: 17, name: "dark-golden-rod", r: 184, g: 134, b: 11 }, { colortyp: rgb_color, tableindex: 34, rgbindex: 18, name: "golden-rod", r: 218, g: 165, b: 32 }, { colortyp: rgb_color, tableindex: 35, rgbindex: 19, name: "pale-golden-rod", r: 238, g: 232, b: 170 }, { colortyp: rgb_color, tableindex: 36, rgbindex: 20, name: "dark-khaki", r: 189, g: 183, b: 107 }, { colortyp: rgb_color, tableindex: 37, rgbindex: 21, name: "khaki", r: 240, g: 230, b: 140 }, { colortyp: rgb_color, tableindex: 38, rgbindex: 22, name: "olive", r: 128, g: 128, b: 0 }, { colortyp: rgb_color, tableindex: 39, rgbindex: 23, name: "yellow", r: 255, g: 255, b: 0 }, { colortyp: rgb_color, tableindex: 40, rgbindex: 24, name: "yellow-green", r: 154, g: 205, b: 50 }, { colortyp: rgb_color, tableindex: 41, rgbindex: 25, name: "dark-olive-green", r: 85, g: 107, b: 47 }, { colortyp: rgb_color, tableindex: 42, rgbindex: 26, name: "olive-drab", r: 107, g: 142, b: 35 }, { colortyp: rgb_color, tableindex: 43, rgbindex: 27, name: "lawn-green", r: 124, g: 252, b: 0 }, { colortyp: rgb_color, tableindex: 44, rgbindex: 28, name: "chart-reuse", r: 127, g: 255, b: 0 }, { colortyp: rgb_color, tableindex: 45, rgbindex: 29, name: "green-yellow", r: 173, g: 255, b: 47 }, { colortyp: rgb_color, tableindex: 46, rgbindex: 30, name: "dark-green", r: 0, g: 100, b: 0 }, { colortyp: rgb_color, tableindex: 47, rgbindex: 31, name: "green", r: 0, g: 128, b: 0 }, { colortyp: rgb_color, tableindex: 48, rgbindex: 32, name: "forest-green", r: 34, g: 139, b: 34 }, { colortyp: rgb_color, tableindex: 49, rgbindex: 33, name: "lime", r: 0, g: 255, b: 0 }, { colortyp: rgb_color, tableindex: 50, rgbindex: 34, name: "lime-green", r: 50, g: 205, b: 50 }, { colortyp: rgb_color, tableindex: 51, rgbindex: 35, name: "light-green", r: 144, g: 238, b: 144 }, { colortyp: rgb_color, tableindex: 52, rgbindex: 36, name: "pale-green", r: 152, g: 251, b: 152 }, { colortyp: rgb_color, tableindex: 53, rgbindex: 37, name: "dark-sea-green", r: 143, g: 188, b: 143 }, { colortyp: rgb_color, tableindex: 54, rgbindex: 38, name: "medium-spring-green", r: 0, g: 250, b: 154 }, { colortyp: rgb_color, tableindex: 55, rgbindex: 39, name: "spring-green", r: 0, g: 255, b: 127 }, { colortyp: rgb_color, tableindex: 56, rgbindex: 40, name: "sea-green", r: 46, g: 139, b: 87 }, { colortyp: rgb_color, tableindex: 57, rgbindex: 41, name: "medium-aqua-marine", r: 102, g: 205, b: 170 }, { colortyp: rgb_color, tableindex: 58, rgbindex: 42, name: "medium-sea-green", r: 60, g: 179, b: 113 }, { colortyp: rgb_color, tableindex: 59, rgbindex: 43, name: "light-sea-green", r: 32, g: 178, b: 170 }, { colortyp: rgb_color, tableindex: 60, rgbindex: 44, name: "dark-slate-gray", r: 47, g: 79, b: 79 }, { colortyp: rgb_color, tableindex: 61, rgbindex: 45, name: "teal", r: 0, g: 128, b: 128 }, { colortyp: rgb_color, tableindex: 62, rgbindex: 46, name: "dark-cyan", r: 0, g: 139, b: 139 }, { colortyp: rgb_color, tableindex: 63, rgbindex: 47, name: "aqua", r: 0, g: 255, b: 255 }, { colortyp: rgb_color, tableindex: 64, rgbindex: 48, name: "cyan", r: 0, g: 255, b: 255 }, { colortyp: rgb_color, tableindex: 65, rgbindex: 49, name: "light-cyan", r: 224, g: 255, b: 255 }, { colortyp: rgb_color, tableindex: 66, rgbindex: 50, name: "dark-turquoise", r: 0, g: 206, b: 209 }, { colortyp: rgb_color, tableindex: 67, rgbindex: 51, name: "turquoise", r: 64, g: 224, b: 208 }, { colortyp: rgb_color, tableindex: 68, rgbindex: 52, name: "medium-turquoise", r: 72, g: 209, b: 204 }, { colortyp: rgb_color, tableindex: 69, rgbindex: 53, name: "pale-turquoise", r: 175, g: 238, b: 238 }, { colortyp: rgb_color, tableindex: 70, rgbindex: 54, name: "aqua-marine", r: 127, g: 255, b: 212 }, { colortyp: rgb_color, tableindex: 71, rgbindex: 55, name: "powder-blue", r: 176, g: 224, b: 230 }, { colortyp: rgb_color, tableindex: 72, rgbindex: 56, name: "cadet-blue", r: 95, g: 158, b: 160 }, { colortyp: rgb_color, tableindex: 73, rgbindex: 57, name: "steel-blue", r: 70, g: 130, b: 180 }, { colortyp: rgb_color, tableindex: 74, rgbindex: 58, name: "corn-flower-blue", r: 100, g: 149, b: 237 }, { colortyp: rgb_color, tableindex: 75, rgbindex: 59, name: "deep-sky-blue", r: 0, g: 191, b: 255 }, { colortyp: rgb_color, tableindex: 76, rgbindex: 60, name: "dodger-blue", r: 30, g: 144, b: 255 }, { colortyp: rgb_color, tableindex: 77, rgbindex: 61, name: "light-blue", r: 173, g: 216, b: 230 }, { colortyp: rgb_color, tableindex: 78, rgbindex: 62, name: "sky-blue", r: 135, g: 206, b: 235 }, { colortyp: rgb_color, tableindex: 79, rgbindex: 63, name: "light-sky-blue", r: 135, g: 206, b: 250 }, { colortyp: rgb_color, tableindex: 80, rgbindex: 64, name: "midnight-blue", r: 25, g: 25, b: 112 }, { colortyp: rgb_color, tableindex: 81, rgbindex: 65, name: "navy", r: 0, g: 0, b: 128 }, { colortyp: rgb_color, tableindex: 82, rgbindex: 66, name: "dark-blue", r: 0, g: 0, b: 139 }, { colortyp: rgb_color, tableindex: 83, rgbindex: 67, name: "medium-blue", r: 0, g: 0, b: 205 }, { colortyp: rgb_color, tableindex: 84, rgbindex: 68, name: "blue", r: 0, g: 0, b: 255 }, { colortyp: rgb_color, tableindex: 85, rgbindex: 69, name: "royal-blue", r: 65, g: 105, b: 225 }, { colortyp: rgb_color, tableindex: 86, rgbindex: 70, name: "blue-violet", r: 138, g: 43, b: 226 }, { colortyp: rgb_color, tableindex: 87, rgbindex: 71, name: "indigo", r: 75, g: 0, b: 130 }, { colortyp: rgb_color, tableindex: 88, rgbindex: 72, name: "dark-slate-blue", r: 72, g: 61, b: 139 }, { colortyp: rgb_color, tableindex: 89, rgbindex: 73, name: "slate-blue", r: 106, g: 90, b: 205 }, { colortyp: rgb_color, tableindex: 90, rgbindex: 74, name: "medium-slate-blue", r: 123, g: 104, b: 238 }, { colortyp: rgb_color, tableindex: 91, rgbindex: 75, name: "medium-purple", r: 147, g: 112, b: 219 }, { colortyp: rgb_color, tableindex: 92, rgbindex: 76, name: "dark-magenta", r: 139, g: 0, b: 139 }, { colortyp: rgb_color, tableindex: 93, rgbindex: 77, name: "dark-violet", r: 148, g: 0, b: 211 }, { colortyp: rgb_color, tableindex: 94, rgbindex: 78, name: "dark-orchid", r: 153, g: 50, b: 204 }, { colortyp: rgb_color, tableindex: 95, rgbindex: 79, name: "medium-orchid", r: 186, g: 85, b: 211 }, { colortyp: rgb_color, tableindex: 96, rgbindex: 80, name: "purple", r: 128, g: 0, b: 128 }, { colortyp: rgb_color, tableindex: 97, rgbindex: 81, name: "thistle", r: 216, g: 191, b: 216 }, { colortyp: rgb_color, tableindex: 98, rgbindex: 82, name: "plum", r: 221, g: 160, b: 221 }, { colortyp: rgb_color, tableindex: 99, rgbindex: 83, name: "violet", r: 238, g: 130, b: 238 }, { colortyp: rgb_color, tableindex: 100, rgbindex: 84, name: "magenta", r: 255, g: 0, b: 255 }, { colortyp: rgb_color, tableindex: 101, rgbindex: 85, name: "orchid", r: 218, g: 112, b: 214 }, { colortyp: rgb_color, tableindex: 102, rgbindex: 86, name: "medium-violet-red", r: 199, g: 21, b: 133 }, { colortyp: rgb_color, tableindex: 103, rgbindex: 87, name: "pale-violet-red", r: 219, g: 112, b: 147 }, { colortyp: rgb_color, tableindex: 104, rgbindex: 88, name: "deep-pink", r: 255, g: 20, b: 147 }, { colortyp: rgb_color, tableindex: 105, rgbindex: 89, name: "hot-pink", r: 255, g: 105, b: 180 }, { colortyp: rgb_color, tableindex: 106, rgbindex: 90, name: "light-pink", r: 255, g: 182, b: 193 }, { colortyp: rgb_color, tableindex: 107, rgbindex: 91, name: "pink", r: 255, g: 192, b: 203 }, { colortyp: rgb_color, tableindex: 108, rgbindex: 92, name: "antique-white", r: 250, g: 235, b: 215 }, { colortyp: rgb_color, tableindex: 109, rgbindex: 93, name: "beige", r: 245, g: 245, b: 220 }, { colortyp: rgb_color, tableindex: 110, rgbindex: 94, name: "bisque", r: 255, g: 228, b: 196 }, { colortyp: rgb_color, tableindex: 111, rgbindex: 95, name: "blanched-almond", r: 255, g: 235, b: 205 }, { colortyp: rgb_color, tableindex: 112, rgbindex: 96, name: "wheat", r: 245, g: 222, b: 179 }, { colortyp: rgb_color, tableindex: 113, rgbindex: 97, name: "corn-silk", r: 255, g: 248, b: 220 }, { colortyp: rgb_color, tableindex: 114, rgbindex: 98, name: "lemon-chiffon", r: 255, g: 250, b: 205 }, { colortyp: rgb_color, tableindex: 115, rgbindex: 99, name: "light-golden-rod-yellow", r: 250, g: 250, b: 210 }, { colortyp: rgb_color, tableindex: 116, rgbindex: 100, name: "light-yellow", r: 255, g: 255, b: 224 }, { colortyp: rgb_color, tableindex: 117, rgbindex: 101, name: "saddle-brown", r: 139, g: 69, b: 19 }, { colortyp: rgb_color, tableindex: 118, rgbindex: 102, name: "sienna", r: 160, g: 82, b: 45 }, { colortyp: rgb_color, tableindex: 119, rgbindex: 103, name: "chocolate", r: 210, g: 105, b: 30 }, { colortyp: rgb_color, tableindex: 120, rgbindex: 104, name: "peru", r: 205, g: 133, b: 63 }, { colortyp: rgb_color, tableindex: 121, rgbindex: 105, name: "sandy-brown", r: 244, g: 164, b: 96 }, { colortyp: rgb_color, tableindex: 122, rgbindex: 106, name: "burly-wood", r: 222, g: 184, b: 135 }, { colortyp: rgb_color, tableindex: 123, rgbindex: 107, name: "tan", r: 210, g: 180, b: 140 }, { colortyp: rgb_color, tableindex: 124, rgbindex: 108, name: "rosy-brown", r: 188, g: 143, b: 143 }, { colortyp: rgb_color, tableindex: 125, rgbindex: 109, name: "moccasin", r: 255, g: 228, b: 181 }, { colortyp: rgb_color, tableindex: 126, rgbindex: 110, name: "navajo-white", r: 255, g: 222, b: 173 }, { colortyp: rgb_color, tableindex: 127, rgbindex: 111, name: "peach-puff", r: 255, g: 218, b: 185 }, { colortyp: rgb_color, tableindex: 128, rgbindex: 112, name: "misty-rose", r: 255, g: 228, b: 225 }, { colortyp: rgb_color, tableindex: 129, rgbindex: 113, name: "lavender-blush", r: 255, g: 240, b: 245 }, { colortyp: rgb_color, tableindex: 130, rgbindex: 114, name: "linen", r: 250, g: 240, b: 230 }, { colortyp: rgb_color, tableindex: 131, rgbindex: 115, name: "old-lace", r: 253, g: 245, b: 230 }, { colortyp: rgb_color, tableindex: 132, rgbindex: 116, name: "papaya-whip", r: 255, g: 239, b: 213 }, { colortyp: rgb_color, tableindex: 133, rgbindex: 117, name: "sea-shell", r: 255, g: 245, b: 238 }, { colortyp: rgb_color, tableindex: 134, rgbindex: 118, name: "mint-cream", r: 245, g: 255, b: 250 }, { colortyp: rgb_color, tableindex: 135, rgbindex: 119, name: "slate-gray", r: 112, g: 128, b: 144 }, { colortyp: rgb_color, tableindex: 136, rgbindex: 120, name: "light-slate-gray", r: 119, g: 136, b: 153 }, { colortyp: rgb_color, tableindex: 137, rgbindex: 121, name: "light-steel-blue", r: 176, g: 196, b: 222 }, { colortyp: rgb_color, tableindex: 138, rgbindex: 122, name: "lavender", r: 230, g: 230, b: 250 }, { colortyp: rgb_color, tableindex: 139, rgbindex: 123, name: "floral-white", r: 255, g: 250, b: 240 }, { colortyp: rgb_color, tableindex: 140, rgbindex: 124, name: "alice-blue", r: 240, g: 248, b: 255 }, { colortyp: rgb_color, tableindex: 141, rgbindex: 125, name: "ghost-white", r: 248, g: 248, b: 255 }, { colortyp: rgb_color, tableindex: 142, rgbindex: 126, name: "honeydew", r: 240, g: 255, b: 240 }, { colortyp: rgb_color, tableindex: 143, rgbindex: 127, name: "ivory", r: 255, g: 255, b: 240 }, { colortyp: rgb_color, tableindex: 144, rgbindex: 128, name: "azure", r: 240, g: 255, b: 255 }, { colortyp: rgb_color, tableindex: 145, rgbindex: 129, name: "snow", r: 255, g: 250, b: 250 }, { colortyp: rgb_color, tableindex: 146, rgbindex: 130, name: "black", r: 0, g: 0, b: 0 }, { colortyp: rgb_color, tableindex: 147, rgbindex: 131, name: "dim-gray", r: 105, g: 105, b: 105 }, { colortyp: rgb_color, tableindex: 148, rgbindex: 132, name: "gray", r: 128, g: 128, b: 128 }, { colortyp: rgb_color, tableindex: 149, rgbindex: 133, name: "dark-gray", r: 169, g: 169, b: 169 }, { colortyp: rgb_color, tableindex: 150, rgbindex: 134, name: "silver", r: 192, g: 192, b: 192 }, { colortyp: rgb_color, tableindex: 151, rgbindex: 135, name: "light-gray", r: 211, g: 211, b: 211 }, { colortyp: rgb_color, tableindex: 152, rgbindex: 136, name: "gainsboro", r: 220, g: 220, b: 220 }, { colortyp: rgb_color, tableindex: 153, rgbindex: 137, name: "white-smoke", r: 245, g: 245, b: 245 }, { colortyp: rgb_color, tableindex: 154, rgbindex: 138, name: "white", r: 255, g: 255, b: 255 }];
/*        CLR_BLACK */
/*          CLR_RED */
/*        CLR_GREEN */
/*        CLR_BROWN */
/*         CLR_BLUE */
/*      CLR_MAGENTA */
/*         CLR_CYAN */
/*         CLR_GRAY */
/*         NO_COLOR */
/*       CLR_ORANGE */
/* CLR_BRIGHT_GREEN */
/*       CLR_YELLOW */
/* CLR_BRIGHT_BLUE */
/* CLR_BRIGHT_MAGENTA */
/*  CLR_BRIGHT_CYAN */
/*        CLR_WHITE */
/* #800000 */
/* #8B0000 */
/* #A52A2A */
/* #B22222 */
/* #DC143C */
/* #FF0000 */
/* #FF6347 */
/* #FF7F50 */
/* #CD5C5C */
/* #F08080 */
/* #E9967A */
/* #FA8072 */
/* #FFA07A */
/* #FF4500 */
/* #FF8C00 */
/* #FFA500 */
/* #FFD700 */
/* #B8860B */
/* #DAA520 */
/* #EEE8AA */
/* #BDB76B */
/* #F0E68C */
/* #808000 */
/* #FFFF00 */
/* #9ACD32 */
/* #556B2F */
/* #6B8E23 */
/* #7CFC00 */
/* #7FFF00 */
/* #ADFF2F */
/* #006400 */
/* #008000 */
/* #228B22 */
/* #00FF00 */
/* #32CD32 */
/* #90EE90 */
/* #98FB98 */
/* #8FBC8F */
/* #00FA9A */
/* #00FF7F */
/* #2E8B57 */
/* #66CDAA */
/* #3CB371 */
/* #20B2AA */
/* #2F4F4F */
/* #008080 */
/* #008B8B */
/* #00FFFF */
/* #00FFFF */
/* #E0FFFF */
/* #00CED1 */
/* #40E0D0 */
/* #48D1CC */
/* #AFEEEE */
/* #7FFFD4 */
/* #B0E0E6 */
/* #5F9EA0 */
/* #4682B4 */
/* #6495ED */
/* #00BFFF */
/* #1E90FF */
/* #ADD8E6 */
/* #87CEEB */
/* #87CEFA */
/* #191970 */
/* #000080 */
/* #00008B */
/* #0000CD */
/* #0000FF */
/* #4169E1 */
/* #8A2BE2 */
/* #4B0082 */
/* #483D8B */
/* #6A5ACD */
/* #7B68EE */
/* #9370DB */
/* #8B008B */
/* #9400D3 */
/* #9932CC */
/* #BA55D3 */
/* #800080 */
/* #D8BFD8 */
/* #DDA0DD */
/* #EE82EE */
/* #FF00FF */
/* #DA70D6 */
/* #C71585 */
/* #DB7093 */
/* #FF1493 */
/* #FF69B4 */
/* #FFB6C1 */
/* #FFC0CB */
/* #FAEBD7 */
/* #F5F5DC */
/* #FFE4C4 */
/* #FFEBCD */
/* #F5DEB3 */
/* #FFF8DC */
/* #FFFACD */
/* #FAFAD2 */
/* #FFFFE0 */
/* #8B4513 */
/* #A0522D */
/* #D2691E */
/* #CD853F */
/* #F4A460 */
/* #DEB887 */
/* #D2B48C */
/* #BC8F8F */
/* #FFE4B5 */
/* #FFDEAD */
/* #FFDAB9 */
/* #FFE4E1 */
/* #FFF0F5 */
/* #FAF0E6 */
/* #FDF5E6 */
/* #FFEFD5 */
/* #FFF5EE */
/* #F5FFFA */
/* #708090 */
/* #778899 */
/* #B0C4DE */
/* #E6E6FA */
/* #FFFAF0 */
/* #F0F8FF */
/* #F8F8FF */
/* #F0FFF0 */
/* #FFFFF0 */
/* #F0FFFF */
/* #FFFAFA */
/* #000000 */
/* #696969 */
/* #808080 */
/* #A9A9A9 */
/* #C0C0C0 */
/* #D3D3D3 */
/* #DCDCDC */
/* #F5F5F5 */
/* #FFFFFF */
export function colortable_to_int32(cte) {
    let clr = 8 | 16777216;
    if (cte.colortyp == rgb_color) {
        clr = (cte.r << 16) | (cte.g << 8) | cte.b;
    } else if (cte.colortyp == nh_color) {
        clr = cte.tableindex | 16777216;
    }
    return clr;
}
let __color_attr_to_str_buf = '';
export function color_attr_to_str(ca) {
    __color_attr_to_str_buf = sprintf(__color_attr_to_str_buf, "%s&%s", clr2colorname(ca.color), attr2attrname(ca.attr));
    return __color_attr_to_str_buf;
}
/* parse string like "color&attr" into color_attr */
export function color_attr_parse_str(ca, str) {
    let buf = '';
    let amp = null;
    let tmp = 0;
    let c = 8;
    let a = 0;
    buf = strncpy(buf, str, 256 /* sizeof(char [256]) */ - 1);
    buf[256 /* sizeof(char [256]) */ - 1] = 0;
    if ((amp = strchr(buf, 38)) != null) {
        buf = nh_strchr_truncate(buf, 38, 'chr');
    }
    if (amp) {
        (amp = amp.substring(1));
        c = match_str2clr(buf, (0));
        a = match_str2attr(amp, (1));
        if (c >= 16 && a == -1) {
            /* FIXME: match_str2clr & match_str2attr give config_error_add(),
           so this is useless */
            c = match_str2clr(amp, (0));
            a = match_str2attr(buf, (1));
        }
        if (c >= 16 || a == -1) {
            return (0);
        }
    } else {
        tmp = match_str2attr(buf, (0));
        if (tmp == -1) {
            tmp = match_str2clr(buf, (0));
            if (tmp >= 16) {
                return (0);
            }
            c = tmp;
        } else {
            a = tmp;
        }
    }
    ca.attr = a;
    ca.color = c;
    return (1);
}
export function query_color_attr(ca, prompt) {
    let c = 0;
    let a = 0;
    c = query_color(prompt, ca.color);
    if (c == -1) {
        return (0);
    }
    a = query_attr(prompt, ca.attr);
    if (a == -1) {
        return (0);
    }
    ca.color = c;
    ca.attr = a;
    return (1);
}
export function attr2attrname(attr) {
    let i = 0;
    for (i = 0; i < (Math.trunc(11 /* sizeof(const struct attr_names [11]) */ / 1 /* sizeof(const struct attr_names) */)); i++) {
        if (attrnames[i].attr == attr) {
            return attrnames[i].name;
        }
    }
    return null;
}
/*
 * Color support functions and data for "color"
 *
 * Used by: optfn_()
 *
 */
export function clr2colorname(clr) {
    let i = 0;
    for (i = 0; i < (Math.trunc(27 /* sizeof(const struct color_names [27]) */ / 1 /* sizeof(const struct color_names) */)); i++) {
        if (colornames[i].name && colornames[i].color == clr) {
            return colornames[i].name;
        }
    }
    return null;
}
export function match_str2clr(str, suppress_msg) {
    let i = 0;
    let c = 16;
    for (i = 0; i < (Math.trunc(27 /* sizeof(const struct color_names [27]) */ / 1 /* sizeof(const struct color_names) */)); i++) {
        if (colornames[i].name && fuzzymatch(str, colornames[i].name, " -_", (1))) {
            /* allow "lightblue", "light blue", and "light-blue" to match "light blue"
       (also junk like "_l i-gh_t---b l u e" but we won't worry about that);
       also copes with trailing space; caller has removed any leading space */
            c = colornames[i].color;
            break;
        }
    }
    if (i == (Math.trunc(27 /* sizeof(const struct color_names [27]) */ / 1 /* sizeof(const struct color_names) */)) && digit(__nh_char_at0(str))) {
        c = atoi(str);
    }
    if (c < 0 || c >= 16) {
        if (!suppress_msg) {
            config_error_add("Unknown color '%.60s'", str);
        }
        c = 16;
    }
    return c;
}
export function match_str2attr(str, complain) {
    let i = 0;
    let a = -1;
    for (i = 0; i < (Math.trunc(11 /* sizeof(const struct attr_names [11]) */ / 1 /* sizeof(const struct attr_names) */)); i++) {
        if (attrnames[i].name && fuzzymatch(str, attrnames[i].name, " -_", (1))) {
            a = attrnames[i].attr;
            break;
        }
    }
    if (a == -1 && complain) {
        config_error_add("Unknown text attribute '%.50s'", str);
    }
    return a;
}
/* ask about highlighting attribute; for menu headers and menu
   coloring patterns, only one attribute at a time is allowed;
   for status highlighting, multiple attributes are allowed [overkill;
   life would be much simpler if that were restricted to one also...] */
export function query_attr(prompt, dflt_attr) {
    let tmpwin = 0;
    let any = 0;
    let i = 0;
    let pick_cnt = 0;
    let picks = null;
    let allow_many = (prompt && !strncmpi(prompt, "Choose", 6));
    let clr = 8;
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    any = cg.zeroany;
    for (i = 0; i < (Math.trunc(11 /* sizeof(const struct attr_names [11]) */ / 1 /* sizeof(const struct attr_names) */)); i++) {
        if (!attrnames[i].name) {
            break;
        }
        any.a_int = i + 1;
        add_menu(tmpwin, nul_glyphinfo, any, 0, 0, attrnames[i].attr, clr, attrnames[i].name, (attrnames[i].attr == dflt_attr) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, (prompt && __nh_char_at0(prompt)) ? prompt : "Pick an attribute");
    pick_cnt = select_menu(tmpwin, allow_many ? 2 : 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    if (pick_cnt > 0) {
        let j = 0;
        let k = 0;
        if (allow_many) {
            for (i = 0; i < pick_cnt; ++i) {
                /* PICK_ANY, with one preselected entry (ATR_NONE) which
               should be excluded if any other choices were picked */
                j = picks[i].item.a_int - 1;
                if (attrnames[j].attr != 0 || pick_cnt == 1) {
                    switch (attrnames[j].attr) {
                        case 0:
                            k = HL_NONE;
                            break;
                        case 1:
                            k |= HL_BOLD;
                            break;
                        case 2:
                            k |= HL_DIM;
                            break;
                        case 3:
                            k |= HL_ITALIC;
                            break;
                        case 4:
                            k |= HL_ULINE;
                            break;
                        case 5:
                            k |= HL_BLINK;
                            break;
                        case 7:
                            k |= HL_INVERSE;
                            break;
                    }
                }
            }
        } else {
            /* PICK_ONE, but might get 0 or 2 due to preselected entry */
            j = picks[0].item.a_int - 1;
            /* pick_cnt==2: explicitly picked something other than the
               preselected entry */
            if (pick_cnt == 2 && attrnames[j].attr == dflt_attr) {
                j = picks[1].item.a_int - 1;
            }
            k = attrnames[j].attr;
        }
        free(picks);
        return k;
    } else if (pick_cnt == 0 && !allow_many) {
        /* PICK_ONE, preselected entry explicitly chosen */
        return dflt_attr;
    }
    /* either ESC to explicitly cancel (pick_cnt==-1) or
       PICK_ANY with preselected entry toggled off and nothing chosen */
    return -1;
}
export function query_color(prompt, dflt_color) {
    let tmpwin = 0;
    let any = 0;
    let i = 0;
    let pick_cnt = 0;
    let picks = null;
    /* replace user patterns with color name ones and force 'menucolors' On */
    basic_menu_colors((1));
    tmpwin = (game.windowprocs.win_create_nhwindow)(4);
    (game.windowprocs.win_start_menu)(tmpwin, 0);
    any = cg.zeroany;
    for (i = 0; i < (Math.trunc(27 /* sizeof(const struct color_names [27]) */ / 1 /* sizeof(const struct color_names) */)); i++) {
        if (!colornames[i].name) {
            break;
        }
        any.a_int = i + 1;
        add_menu(tmpwin, nul_glyphinfo, any, 0, 0, 0, 8, colornames[i].name, (colornames[i].color == dflt_color) ? 1 : 0);
    }
    (game.windowprocs.win_end_menu)(tmpwin, (prompt && __nh_char_at0(prompt)) ? prompt : "Pick a color");
    pick_cnt = select_menu(tmpwin, 1, picks);
    (game.windowprocs.win_destroy_nhwindow)(tmpwin);
    /* remove temporary color name patterns and restore user-specified ones;
       reset 'menucolors' option to its previous value */
    basic_menu_colors((0));
    if (pick_cnt > 0) {
        i = colornames[picks[0].item.a_int - 1].color;
        /* pick_cnt==2: explicitly picked something other than the
           preselected entry */
        if (pick_cnt == 2 && i == 8) {
            i = colornames[picks[1].item.a_int - 1].color;
        }
        free(picks);
        return i;
    } else if (pick_cnt == 0) {
        /* pick_cnt==0: explicitly picking preselected entry toggled it off */
        return dflt_color;
    }
    return -1;
}
/* from sys/share/<various>regex.{c,cpp} */
/* set up a menu for picking a color, one that shows each name in its color;
   overrides player's MENUCOLORS with a set of "blue"=blue, "red"=red, and
   so forth; suppresses color for black and white because one of those will
   likely be invisible due to matching the background; the alternate set of
   MENUCOLORS is kept around for potential re-use */
/* True: temporarily replace menu color entries with
                          * a fake set of menu colors which match their names;
                          * False: restore user-specified colorings */
export function basic_menu_colors(load_colors) {
    if (load_colors) {
        /* replace normal menu colors with a set specifically for colors */
        game.save_menucolors = game.iflags.use_menu_color;
        game.save_colorings = game.menu_colorings;
        game.iflags.use_menu_color = (1);
        if (game.color_colorings) {
            /* use the alternate colorings which were set up previously */
            game.menu_colorings = game.color_colorings;
        } else {
            /* create the alternate colorings once */
            let cnm = '';
            let i = 0;
            let c = 0;
            let pmatchregex = !strncmpi((regex_id), ("pmatchregex"), -1);
            let patternfmt = pmatchregex ? "*%s" : "%s";
            /* menu_colorings pointer has been saved; clear it in order
               to add the alternate entries as if from scratch */
            game.menu_colorings = null;
            for (i = 0; i < (Math.trunc(27 /* sizeof(const struct color_names [27]) */ / 1 /* sizeof(const struct color_names) */)); ++i) {
                /* this orders the patterns last-in/first-out; that means
               that the "light <foo>" variations come before the basic
               "<foo>" ones, which is exactly what we want (so that the
               shorter basic names won't get false matches as substrings
               of the longer ones) */
                /* first alias entry has no name */
                if (!colornames[i].name) {
                    break;
                }
                c = colornames[i].color;
                if (c == 0 || c == 15 || c == 8) {
                    continue;
                }
                cnm = sprintf(cnm, patternfmt, colornames[i].name);
                add_menu_coloring_parsed(cnm, c, 0);
            }
            /* right now, menu_colorings contains the alternate color list;
               remember that list for future pick-a-color instances and
               also keep it as is for this instance */
            game.color_colorings = game.menu_colorings;
        }
    } else {
        /* restore normal user-specified menu colors */
        game.iflags.use_menu_color = game.save_menucolors;
        game.menu_colorings = game.save_colorings;
    }
}
const __add_menu_coloring_parsed_re_error = "Menucolor regex error";
export function add_menu_coloring_parsed(str, c, a) {
    let tmp = null;
    if (!str) {
        return (0);
    }
    tmp = alloc(1 /* sizeof(struct menucoloring) */);
    tmp.match = regex_init();
    if (!regex_compile(str, tmp.match)) {
        /* test_regex_pattern() has already validated this regexp but parsing
       it again could conceivably run out of memory */
        let errbuf = '';
        let re_error_desc = regex_error_desc(tmp.match, errbuf);
        /* free first in case reason for regcomp failure was out-of-memory */
        regex_free(tmp.match);
        free(tmp);
        config_error_add("%s: %s", __add_menu_coloring_parsed_re_error, re_error_desc);
        return (0);
    }
    tmp.next = game.menu_colorings;
    tmp.origstr = dupstr(str);
    tmp.color = c;
    tmp.attr = a;
    game.menu_colorings = tmp;
    game.iflags.use_menu_color = (1);
    return (1);
}
/* parse '"regex_string"=color&attr' and add it to menucoloring */
/* never Null but could be empty */
export function add_menu_coloring(tmpstr) {
    let c = 8;
    let a = 0;
    let tmps = null;
    let cs = null;
    let amp = null;
    let str = '';
    str = strncpy(str, tmpstr, 256 /* sizeof(char [256]) */ - 1);
    str[256 /* sizeof(char [256]) */ - 1] = 0;
    if ((cs = strchr(str, 61)) == null) {
        config_error_add("Malformed MENUCOLOR");
        return (0);
    }
    tmps = __nh_advance_str(cs, 1);
    tmps = mungspaces(tmps);
    if ((amp = strchr(tmps, 38)) != null) {
        tmps = nh_strchr_truncate(tmps, 38, 'chr');
    }
    c = match_str2clr(tmps, (0));
    if (c >= 16) {
        return (0);
    }
    if (amp) {
        tmps = amp.substring(1);
        a = match_str2attr(tmps, (1));
        if (a == -1) {
            return (0);
        }
    }
    /* the regexp portion here has not been condensed by mungspaces() */
    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
    tmps = str;
    if (__nh_char_at0(tmps) == 34 || __nh_char_at0(tmps) == 39) {
        (cs = __nh_advance_str(cs, -1));
        while (((__ctype_b_loc())[((__nh_char_at0(cs)))] & _ISspace)) {
            (cs = __nh_advance_str(cs, -1));
        }
        if (__nh_char_at0(cs) == __nh_char_at0(tmps)) {
            void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
            (tmps = __nh_advance_str(tmps, 1));
        }
    }
    return add_menu_coloring_parsed(tmps, c, a);
}
/* release all menu color patterns */
export function free_menu_coloring() {
    do {
        let tmp = null;
        let tmp2 = null;
        for (tmp = game.menu_colorings; tmp; tmp = tmp2) {
            /* either menu_colorings or color_colorings or both might need to
       be freed or already be Null; do-loop will iterate at most twice */
            tmp2 = tmp.next;
            regex_free(tmp.match);
            free(tmp.origstr);
            free(tmp);
        }
        game.menu_colorings = game.color_colorings;
        game.color_colorings = null;
    } while (game.menu_colorings);
}
/* release a specific menu color pattern; not used for color_colorings */
/* 0 .. */
export function free_one_menu_coloring(idx) {
    let tmp = game.menu_colorings;
    let prev = null;
    while (tmp) {
        if (idx == 0) {
            let next = tmp.next;
            regex_free(tmp.match);
            free(tmp.origstr);
            free(tmp);
            if (prev) {
                prev.next = next;
            } else {
                game.menu_colorings = next;
            }
            return;
        }
        idx--;
        prev = tmp;
        tmp = tmp.next;
    }
}
export function count_menucolors() {
    let tmp = null;
    let count = 0;
    for (tmp = game.menu_colorings; tmp; tmp = tmp.next) {
        count++;
    }
    return count;
}
/* returns -1 on no-match.
 * buf is NONNULLARG1
 */
export function check_enhanced_colors(buf) {
    /* used to catch trailing junk after "#rrggbb" */
    let xtra = 0;
    let r = 0;
    let g = 0;
    let b = 0;
    let retcolor = -1;
    let color = 0;
    if ((color = match_str2clr(buf, (1))) != 16) {
        retcolor = color | 16777216;
    } else if (sscanf(buf, "#%02x%02x%02x%c", r, g, b, xtra) >= 3) {
        retcolor = !xtra ? ((r << 16) | (g << 8) | b) : -1;
    } else {
        /* altbuf: allow user's "grey" to match colortable[]'s "gray";
         * fuzzymatch(): ignore spaces, hyphens, and underscores so that
         * space or underscore in user-supplied name will match hyphen
         * [note: caller splits text at spaces so we won't see any here]
         */
        let altbuf = null;
        let grey = strstri(buf, "grey");
        let greyoffset = grey ? ((buf.length - grey.length)) : -1;
        if (greyoffset >= 0) {
            altbuf = dupstr(buf);
            /* use direct copy because strsubst() is case-sensitive */
            /*(void) strncpy(&altbuf[greyoffset], "gray", 4);*/
            memcpy(__nh_advance_str(altbuf, greyoffset), "gray", 4);
        }
        for (color = 0; color < (Math.trunc(155 /* sizeof(const struct nethack_color [155]) */ / 1 /* sizeof(const struct nethack_color) */)); ++color) {
            if (fuzzymatch(buf, colortable[color].name, " -_", (1)) || (altbuf && fuzzymatch(altbuf, colortable[color].name, " -_", (1)))) {
                retcolor = colortable_to_int32(colortable[color]);
                break;
            }
        }
        if (altbuf) {
            free(altbuf);
        }
    }
    return retcolor;
}
/* return the canonical name of a particular color */
let __wc_color_name_hexcolor = '';
export function wc_color_name(colorindx) {
    let result = "no-color";
    if (colorindx >= 0) {
        let basicindx = colorindx & ~16777216;
        if (basicindx != colorindx) {
            (4 /* sizeof(int) */ , void 0 /* StmtExpr */);
            /* if colorindx has NH_BASIC_COLOR bit set, basicindx won't,
           so differing implies a basic color */
            result = colortable[basicindx].name;
        } else {
            let indx = 0;
            let r = (colorindx >> 16) & 255;
            let g = (colorindx >> 8) & 255;
            let b = colorindx & 255;
            __wc_color_name_hexcolor = nh_snprintf("wc_color_name", 784, __wc_color_name_hexcolor, 8 /* sizeof(char [8]) */, "#%02x%02x%02x", r, g, b);
            result = __wc_color_name_hexcolor;
            for (indx = 16; indx < (Math.trunc(155 /* sizeof(const struct nethack_color [155]) */ / 1 /* sizeof(const struct nethack_color) */)); ++indx) {
                if (colortable[indx].r == r && colortable[indx].g == g && colortable[indx].b == b) {
                    /* override hex value if this is a named color */
                    result = colortable[indx].name;
                    break;
                }
            }
        }
    }
    return result;
}
/* hexdd[] is defined in decl.c */
export function onlyhexdigits(buf) {
    let dp = buf;
    for (dp = buf; __nh_char_at0(dp); (dp = __nh_advance_str(dp, 1))) {
        if (!(strchr(hexdd, __nh_char_at0(dp)) || __nh_char_at0(dp) == 45)) {
            return (0);
        }
    }
    return (1);
}
export function rgbstr_to_int32(rgbstr) {
    let r = 0;
    let g = 0;
    let b = 0;
    let milestone = 0;
    let cp = null;
    let c_r = null;
    let c_g = null;
    let c_b = null;
    let rgb = 0;
    let buf = '';
    let dash = (0);
    buf = nh_snprintf("rgbstr_to_int32", 823, buf, 256 /* sizeof(char [256]) */, "%s", rgbstr ? rgbstr : "");
    if (buf && onlyhexdigits(buf)) {
        c_g = c_b = null;
        c_r = cp = buf;
        while (__nh_char_at0(cp)) {
            if (digit(__nh_char_at0(cp)) || __nh_char_at0(cp) == 45) {
                if (__nh_char_at0(cp) == 45) {
                    void 0 /* TODO Phase 5+: pointer-mutation lvalue (C: *p = 0) */;
                    milestone++;
                    dash = (1);
                }
                (cp = __nh_advance_str(cp, 1));
                if (dash) {
                    if (milestone < 2) {
                        c_g = cp;
                    } else {
                        c_b = cp;
                    }
                    dash = (0);
                }
            } else {
                return -1;
            }
        }
        if (c_r && c_g && c_b && (strlen(c_r) > 0 && strlen(c_r) < 4) && (strlen(c_g) > 0 && strlen(c_g) < 4) && (strlen(c_b) > 0 && strlen(c_b) < 4)) {
            r = atoi(c_r);
            g = atoi(c_g);
            b = atoi(c_b);
            rgb = (r << 16) | (g << 8) | (b << 0);
            /* perhaps an enhanced color name was used instead of rgb value? */
            return rgb;
        }
    } else if (buf) {
        if ((rgb = check_enhanced_colors(buf)) != -1) {
            return rgb;
        }
    }
    return -1;
}
export function set_map_customcolor(gmap, nhcolor) {
    let tmpgm = gmap;
    let closecolor = 0;
    let clridx = 0;
    if (!tmpgm) {
        return 0;
    }
    gmap.customcolor = nhcolor;
    if (closest_color(nhcolor, { get value() { return closecolor; }, set value(_v) { closecolor = _v; } }, { get value() { return clridx; }, set value(_v) { clridx = _v; } })) {
        gmap.color256idx = clridx;
    } else {
        gmap.color256idx = 0;
    }
    return 1;
}
game.color_256_definitions = [{ index: 16, value: 0 }, { index: 17, value: 95 }, { index: 18, value: 135 }, { index: 19, value: 175 }, { index: 20, value: 215 }, { index: 21, value: 255 }, { index: 22, value: 24320 }, { index: 23, value: 24415 }, { index: 24, value: 24455 }, { index: 25, value: 24495 }, { index: 26, value: 24535 }, { index: 27, value: 24575 }, { index: 28, value: 34560 }, { index: 29, value: 34655 }, { index: 30, value: 34695 }, { index: 31, value: 34735 }, { index: 32, value: 34775 }, { index: 33, value: 34815 }, { index: 34, value: 44800 }, { index: 35, value: 44895 }, { index: 36, value: 44935 }, { index: 37, value: 44975 }, { index: 38, value: 45015 }, { index: 39, value: 45055 }, { index: 40, value: 55040 }, { index: 41, value: 55135 }, { index: 42, value: 55175 }, { index: 43, value: 55215 }, { index: 44, value: 55255 }, { index: 45, value: 55295 }, { index: 46, value: 65280 }, { index: 47, value: 65375 }, { index: 48, value: 65415 }, { index: 49, value: 65455 }, { index: 50, value: 65495 }, { index: 51, value: 65535 }, { index: 52, value: 6225920 }, { index: 53, value: 6226015 }, { index: 54, value: 6226055 }, { index: 55, value: 6226095 }, { index: 56, value: 6226135 }, { index: 57, value: 6226175 }, { index: 58, value: 6250240 }, { index: 59, value: 6250335 }, { index: 60, value: 6250375 }, { index: 61, value: 6250415 }, { index: 62, value: 6250455 }, { index: 63, value: 6250495 }, { index: 64, value: 6260480 }, { index: 65, value: 6260575 }, { index: 66, value: 6260615 }, { index: 67, value: 6260655 }, { index: 68, value: 6260695 }, { index: 69, value: 6260735 }, { index: 70, value: 6270720 }, { index: 71, value: 6270815 }, { index: 72, value: 6270855 }, { index: 73, value: 6270895 }, { index: 74, value: 6270935 }, { index: 75, value: 6270975 }, { index: 76, value: 6280960 }, { index: 77, value: 6281055 }, { index: 78, value: 6281095 }, { index: 79, value: 6281135 }, { index: 80, value: 6281175 }, { index: 81, value: 6281215 }, { index: 82, value: 6291200 }, { index: 83, value: 6291295 }, { index: 84, value: 6291335 }, { index: 85, value: 6291375 }, { index: 86, value: 6291415 }, { index: 87, value: 6291455 }, { index: 88, value: 8847360 }, { index: 89, value: 8847455 }, { index: 90, value: 8847495 }, { index: 91, value: 8847535 }, { index: 92, value: 8847575 }, { index: 93, value: 8847615 }, { index: 94, value: 8871680 }, { index: 95, value: 8871775 }, { index: 96, value: 8871815 }, { index: 97, value: 8871855 }, { index: 98, value: 8871895 }, { index: 99, value: 8871935 }, { index: 100, value: 8881920 }, { index: 101, value: 8882015 }, { index: 102, value: 8882055 }, { index: 103, value: 8882095 }, { index: 104, value: 8882135 }, { index: 105, value: 8882175 }, { index: 106, value: 8892160 }, { index: 107, value: 8892255 }, { index: 108, value: 8892295 }, { index: 109, value: 8892335 }, { index: 110, value: 8892375 }, { index: 111, value: 8892415 }, { index: 112, value: 8902400 }, { index: 113, value: 8902495 }, { index: 114, value: 8902535 }, { index: 115, value: 8902575 }, { index: 116, value: 8902615 }, { index: 117, value: 8902655 }, { index: 118, value: 8912640 }, { index: 119, value: 8912735 }, { index: 120, value: 8912775 }, { index: 121, value: 8912815 }, { index: 122, value: 8912855 }, { index: 123, value: 8912895 }, { index: 124, value: 11468800 }, { index: 125, value: 11468895 }, { index: 126, value: 11468935 }, { index: 127, value: 11468975 }, { index: 128, value: 11469015 }, { index: 129, value: 11469055 }, { index: 130, value: 11493120 }, { index: 131, value: 11493215 }, { index: 132, value: 11493255 }, { index: 133, value: 11493295 }, { index: 134, value: 11493335 }, { index: 135, value: 11493375 }, { index: 136, value: 11503360 }, { index: 137, value: 11503455 }, { index: 138, value: 11503495 }, { index: 139, value: 11503535 }, { index: 140, value: 11503575 }, { index: 141, value: 11503615 }, { index: 142, value: 11513600 }, { index: 143, value: 11513695 }, { index: 144, value: 11513735 }, { index: 145, value: 11513775 }, { index: 146, value: 11513815 }, { index: 147, value: 11513855 }, { index: 148, value: 11523840 }, { index: 149, value: 11523935 }, { index: 150, value: 11523975 }, { index: 151, value: 11524015 }, { index: 152, value: 11524055 }, { index: 153, value: 11524095 }, { index: 154, value: 11534080 }, { index: 155, value: 11534175 }, { index: 156, value: 11534215 }, { index: 157, value: 11534255 }, { index: 158, value: 11534295 }, { index: 159, value: 11534335 }, { index: 160, value: 14090240 }, { index: 161, value: 14090335 }, { index: 162, value: 14090375 }, { index: 163, value: 14090415 }, { index: 164, value: 14090455 }, { index: 165, value: 14090495 }, { index: 166, value: 14114560 }, { index: 167, value: 14114655 }, { index: 168, value: 14114695 }, { index: 169, value: 14114735 }, { index: 170, value: 14114775 }, { index: 171, value: 14114815 }, { index: 172, value: 14124800 }, { index: 173, value: 14124895 }, { index: 174, value: 14124935 }, { index: 175, value: 14124975 }, { index: 176, value: 14125015 }, { index: 177, value: 14125055 }, { index: 178, value: 14135040 }, { index: 179, value: 14135135 }, { index: 180, value: 14135175 }, { index: 181, value: 14135215 }, { index: 182, value: 14135255 }, { index: 183, value: 14135295 }, { index: 184, value: 14145280 }, { index: 185, value: 14145375 }, { index: 186, value: 14145415 }, { index: 187, value: 14145455 }, { index: 188, value: 14145495 }, { index: 189, value: 14145535 }, { index: 190, value: 14155520 }, { index: 191, value: 14155615 }, { index: 192, value: 14155655 }, { index: 193, value: 14155695 }, { index: 194, value: 14155735 }, { index: 195, value: 14155775 }, { index: 196, value: 16711680 }, { index: 197, value: 16711775 }, { index: 198, value: 16711815 }, { index: 199, value: 16711855 }, { index: 200, value: 16711895 }, { index: 201, value: 16711935 }, { index: 202, value: 16736000 }, { index: 203, value: 16736095 }, { index: 204, value: 16736135 }, { index: 205, value: 16736175 }, { index: 206, value: 16736215 }, { index: 207, value: 16736255 }, { index: 208, value: 16746240 }, { index: 209, value: 16746335 }, { index: 210, value: 16746375 }, { index: 211, value: 16746415 }, { index: 212, value: 16746455 }, { index: 213, value: 16746495 }, { index: 214, value: 16756480 }, { index: 215, value: 16756575 }, { index: 216, value: 16756615 }, { index: 217, value: 16756655 }, { index: 218, value: 16756695 }, { index: 219, value: 16756735 }, { index: 220, value: 16766720 }, { index: 221, value: 16766815 }, { index: 222, value: 16766855 }, { index: 223, value: 16766895 }, { index: 224, value: 16766935 }, { index: 225, value: 16766975 }, { index: 226, value: 16776960 }, { index: 227, value: 16777055 }, { index: 228, value: 16777095 }, { index: 229, value: 16777135 }, { index: 230, value: 16777175 }, { index: 231, value: 16777215 }, { index: 232, value: 526344 }, { index: 233, value: 1184274 }, { index: 234, value: 1842204 }, { index: 235, value: 2500134 }, { index: 236, value: 3158064 }, { index: 237, value: 3815994 }, { index: 238, value: 4473924 }, { index: 239, value: 5131854 }, { index: 240, value: 5789784 }, { index: 241, value: 6447714 }, { index: 242, value: 7105644 }, { index: 243, value: 7763574 }, { index: 244, value: 8421504 }, { index: 245, value: 9079434 }, { index: 246, value: 9737364 }, { index: 247, value: 10395294 }, { index: 248, value: 11053224 }, { index: 249, value: 11711154 }, { index: 250, value: 12369084 }, { index: 251, value: 13027014 }, { index: 252, value: 13684944 }, { index: 253, value: 14342874 }, { index: 254, value: 15000804 }, { index: 255, value: 15658734 }];
/* color values are from unnethack */
/** Calculate the color distance between two colors.
 *
 * Algorithm taken from UnNetHack which took it from
 * https://www.compuphase.com/cmetric.htm
 **/
export function color_distance(rgb1, rgb2) {
    let r1 = (rgb1 >> 16) & 255;
    let g1 = (rgb1 >> 8) & 255;
    let b1 = (rgb1) & 255;
    let r2 = (rgb2 >> 16) & 255;
    let g2 = (rgb2 >> 8) & 255;
    let b2 = (rgb2) & 255;
    let rmean = Math.trunc((r1 + r2) / 2);
    let r = r1 - r2;
    let g = g1 - g2;
    let b = b1 - b2;
    return ((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}
export function closest_color(lcolor, closecolor, clridx) {
    let i = 0;
    let color_index = -1;
    let similar = 2147483647;
    let current = 0;
    let retbool = (0);
    for (i = 0; i < (Math.trunc(240 /* sizeof(struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/coloratt.c:885:8) [240]) */ / 1 /* sizeof(struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/coloratt.c:885:8)) */)); i++) {
        if (lcolor == game.color_256_definitions[i].value) {
            color_index = i;
            break;
        }
        /* find a close color match */
        current = color_distance(lcolor, game.color_256_definitions[i].value);
        if (current < similar) {
            color_index = i;
            similar = current;
        }
    }
    if (closecolor && clridx && color_index >= 0) {
        closecolor.value = game.color_256_definitions[color_index].value;
        clridx.value = game.color_256_definitions[color_index].index;
        retbool = (1);
    }
    return retbool;
}
export function get_nhcolor_from_256_index(idx) {
    let retcolor = 8 | 16777216;
    if (((idx) >= 0 && (idx) < (Math.trunc(240 /* sizeof(struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/coloratt.c:885:8) [240]) */ / 1 /* sizeof(struct (anonymous struct at /share/u/davidbau/git/teleport/monk/nethack-c/upstream/src/coloratt.c:885:8)) */)))) {
        retcolor = game.color_256_definitions[idx].value;
    }
    return retcolor;
}
/* some sanity checks */
/* use COLORVAL(ga.altpalette[coloridx]) to get
               the actual rgb value out of ga.altpalette[] */
/* hexdd[] is defined in decl.c */
/* for decimal, octal, hexadecimal cases */
/* simple val, or nothing left for \ to escape */
/* CHANGE_COLOR */
/*coloratt.c*/
