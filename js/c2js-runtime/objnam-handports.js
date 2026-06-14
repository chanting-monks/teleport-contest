// objnam-handports.js — JS-native hand ports for objnam.c functions
// whose C bodies are dense char-pointer surgery (write-through eos
// aliases, Strcasecpy onto interior pointers) that string mode cannot
// express (§23.247).  The translated makeplural's every suffix write
// was a silent no-op — even the default append-'s' path — so
// makeplural("level") returned "level" (seed2600's wizard teleport
// menu heading "levels 1 to 29"), "2 flint stones" class plurals
// degraded, etc.  Wired via HAND_PORTED_FUNCTIONS in c2js.config.mjs
// (the translator emits a thin delegating stub; conformance §4/§11
// preserved automatically).
//
// Pure string functions — no PRNG, no game state besides the genders
// table.  Faithful to nethack-c/recorder/src/objnam.c makeplural /
// singplur_lookup / singplur_compound / badman / ch_ksound and
// hacklib.c strcasecpy / chrcasecpy.

import { genders } from '../translated/role.js';

const VOWELS = 'aeiou';

function cstr(s) {
    if (typeof s === 'string') return s;
    if (Array.isArray(s)) {
        let out = '';
        for (let i = 0; i < s.length && s[i]; i++) out += String.fromCharCode(s[i]);
        return out;
    }
    if (s && typeof s === 'object' && 'value' in s) return cstr(s.value);
    return s == null ? '' : String(s);
}

const isLetter = (c) => /[A-Za-z]/.test(c);
const lowc = (c) => (c >= 'A' && c <= 'Z') ? c.toLowerCase() : c;

// hacklib.c chrcasecpy: convert nc into oc's case (only when oc is a
// letter; non-letter templates leave nc unchanged).
function chrcasecpy(oc, nc) {
    if (oc >= 'a' && oc <= 'z') {
        if (nc >= 'A' && nc <= 'Z') return nc.toLowerCase();
    } else if (oc >= 'A' && oc <= 'Z') {
        if (nc >= 'a' && nc <= 'z') return nc.toUpperCase();
    }
    return nc;
}

// hacklib.c strcasecpy(dst, src) where dst = str interior at `pos`:
// each src char takes the case of the dst char it overwrites; once
// dst is exhausted the LAST template char's case propagates.  The
// write NUL-terminates, so everything after the replacement is
// dropped — callers re-append `excess` themselves.
function strcasecpyAt(str, pos, src) {
    let out = str.slice(0, pos);
    let template;
    for (let i = 0; i < src.length; i++) {
        if (pos + i < str.length) template = str[pos + i];
        else if (i === 0) template = pos > 0 ? str[pos - 1] : 'a';
        // else: keep previous template (case of last real char)
        out += chrcasecpy(template, src[i]);
    }
    return out;
}

// C BSTRCMPI(base, ptr, str): match only when the suffix fits.
function endsWithI(str, suffix) {
    if (str.length < suffix.length) return false;
    return str.slice(str.length - suffix.length).toLowerCase()
        === suffix.toLowerCase();
}
const eqI = (a, b) => a.toLowerCase() === b.toLowerCase();

// objnam.c singplur_compound: find the compound split point ("foo of
// bar" → index of " of ...").  Returns -1 when not compound.
const COMPOUNDS = [
    ' of ', ' labeled ', ' called ',
    ' named ', ' above', ' versus ', ' from ', ' in ',
    ' on ', ' a la ', ' with', ' de ', " d'", ' du ',
    ' au ', '-in-', '-at-',
];
function singplurCompoundIdx(str) {
    for (let p = 0; p < str.length; p++) {
        const c = str[p];
        if (c !== ' ' && c !== '-') continue;
        for (const cmpd of COMPOUNDS) {
            if (str.slice(p, p + cmpd.length).toLowerCase() === cmpd.toLowerCase()) {
                return p;
            }
        }
    }
    return -1;
}

// objnam.c badman: *man words with no *men plural (and vice versa).
const NO_MEN = [
    'albu', 'antihu', 'anti', 'ata', 'auto', 'bildungsro', 'cai', 'cay',
    'ceru', 'corner', 'decu', 'des', 'dura', 'fir', 'hanu', 'het',
    'infrahu', 'inhu', 'nonhu', 'otto', 'out', 'prehu', 'protohu',
    'subhu', 'superhu', 'talis', 'unhu', 'sha',
    'hu', 'un', 'le', 're', 'so', 'to', 'at', 'a',
];
const NO_MAN = [
    'abdo', 'acu', 'agno', 'ceru', 'cogno', 'cycla', 'fleh', 'grava',
    'hegu', 'preno', 'sonar', 'speci', 'dai', 'exa', 'fla', 'sta', 'teg',
    'tegu', 'vela', 'da', 'hy', 'lu', 'no', 'nu', 'ra', 'ru', 'se', 'vi',
    'ya', 'o', 'a',
];
function badman(basestr, toPlural) {
    if (!basestr || basestr.length < 4) return false;
    const list = toPlural ? NO_MEN : NO_MAN;
    for (const pre of list) {
        // C: spot = endstr - (strlen(pre) + 3); prefix must sit right
        // before the trailing "man"/"men" and start the word.
        const spot = basestr.length - (pre.length + 3);
        if (spot < 0) continue;
        if (basestr.slice(spot, spot + pre.length).toLowerCase() === pre
            && (spot === 0 || basestr[spot - 1] === ' ')) {
            return true;
        }
    }
    return false;
}

// objnam.c ch_ksound: *ch words with a k-sound (pluralize with 's').
const CH_K = [
    'monarch', 'poch', 'tech', 'mech', 'stomach', 'psych',
    'amphibrach', 'anarch', 'atriarch', 'azedarach', 'broch',
    'gastrotrich', 'isopach', 'loch', 'oligarch', 'peritrich',
    'sandarach', 'sumach', 'symposiarch',
];
function chKsound(basestr) {
    if (!basestr || basestr.length < 4) return false;
    return CH_K.some((w) => endsWithI(basestr, w));
}

// objnam.c one_off[] / as_is[] tables.
const ONE_OFF = [
    ['child', 'children'], ['cubus', 'cubi'], ['culus', 'culi'],
    ['Cyclops', 'Cyclopes'], ['djinni', 'djinn'], ['erinys', 'erinyes'],
    ['foot', 'feet'], ['fungus', 'fungi'], ['goose', 'geese'],
    ['knife', 'knives'], ['labrum', 'labra'], ['louse', 'lice'],
    ['mouse', 'mice'], ['mumak', 'mumakil'], ['nemesis', 'nemeses'],
    ['ovum', 'ova'], ['ox', 'oxen'], ['passerby', 'passersby'],
    ['rtex', 'rtices'], ['serum', 'sera'], ['staff', 'staves'],
    ['tooth', 'teeth'],
];
const AS_IS = [
    'boots', 'shoes', 'gloves', 'lenses', 'scales',
    'eyes', 'gauntlets', 'iron bars',
    'bison', 'deer', 'elk', 'fish', 'fowl',
    'tuna', 'yaki', '-hai', 'krill', 'manes',
    'moose', 'ninja', 'sheep', 'ronin', 'roshi',
    'shito', 'tengu', 'ki-rin', 'Nazgul', 'gunyoki',
    'piranha', 'samurai', 'shuriken', 'haggis', 'Bordeaux',
];

// objnam.c singplur_lookup, to_plural=TRUE only (makesingular keeps
// its repaired translated form).  Returns null for "no decision" or
// the (possibly transformed) string.
function singplurLookupPlural(str, altAsIs) {
    for (const w of AS_IS) if (endsWithI(str, w)) return str;
    if (altAsIs) for (const w of altAsIs) if (endsWithI(str, w)) return str;
    if (str.length > 5 && endsWithI(str, 'craft')) return str;
    if (eqI(str, 'slice') || eqI(str, 'mongoose')) {
        return strcasecpyAt(str, str.length, 's');
    }
    if (str.length > 2 && endsWithI(str, 'ox')
        && !(str.length > 5 && endsWithI(str, 'muskox'))) {
        return strcasecpyAt(str, str.length, 'es');
    }
    if (str.length > 2 && endsWithI(str, 'man') && badman(str, true)) {
        return strcasecpyAt(str, str.length, 's');
    }
    for (const [sing, plur] of ONE_OFF) {
        if (endsWithI(str, plur)) return str; // already plural
        if (endsWithI(str, sing)) {
            return strcasecpyAt(str, str.length - sing.length, plur);
        }
    }
    return null;
}

// objnam.c makeplural.  Returns a JS string (the translated stub's
// callers treat the return as the C char* result).  Exported under
// the __nh_hp_ prefix per the HAND_PORTED_FUNCTIONS stub-import
// convention (translator emits `import { __nh_hp_makeplural }`).
export function __nh_hp_makeplural(oldstrIn) {
    let oldstr = cstr(oldstrIn);
    while (oldstr.startsWith(' ')) oldstr = oldstr.slice(1);
    if (!oldstr) return 's'; // C: impossible("plural of null?")

    // Pronouns (monsters): he/him/his → they/them/their.
    for (let i = 0; i <= 2; i++) {
        let rep = null;
        if (eqI(genders[i].he, oldstr)) rep = genders[3].he;
        else if (eqI(genders[i].him, oldstr)) rep = genders[3].him;
        else if (eqI(genders[i].his, oldstr)) rep = genders[3].his;
        if (rep) {
            if (oldstr[0] === oldstr[0].toUpperCase()) {
                rep = rep[0].toUpperCase() + rep.slice(1);
            }
            return rep;
        }
    }

    let str = oldstr;
    // "pair of boots" stays "pair of boots".
    if (str.slice(0, 8).toLowerCase() === 'pair of ') return str;

    // Compound split: pluralize "foo" in "foo of bar".
    let excess = '';
    const ci = singplurCompoundIdx(str);
    if (ci >= 0) {
        excess = oldstr.slice(ci);
        str = str.slice(0, ci);
    }
    // Strip trailing blanks.
    while (str.length > 1 && str.endsWith(' ')) str = str.slice(0, -1);

    const bottom = (s) => s + excess;
    const len = str.length;
    const spot = len - 1; // index of last char
    const last = str[spot];
    const lastLo = lowc(last);

    if (len === 1 || !isLetter(last)) {
        return bottom(str + "'s");
    }

    const looked = singplurLookupPlural(str, ['ae', 'eaux', 'matzot']);
    if (looked !== null) return bottom(looked);

    if ((len === 2 && eqI(str, 'ya'))
        || (len >= 3 && endsWithI(str, ' ya'))) {
        return bottom(str);
    }
    // man/men (cavemen) — excluding shamans, humans, etc.
    if (len >= 3 && endsWithI(str, 'man') && !badman(str, true)) {
        return bottom(strcasecpyAt(str, spot - 1, 'en'));
    }
    if (lastLo === 'f') {
        const lo_c = lowc(str[spot - 1] ?? '');
        if (len >= 3 && endsWithI(str, 'erf')) {
            ; // nerf/serf: fall through to default 's'
        } else if ('lr'.includes(lo_c) || VOWELS.includes(lo_c)) {
            return bottom(strcasecpyAt(str, spot, 'ves'));
        }
    }
    if (len >= 3 && endsWithI(str, 'ium')) {
        return bottom(strcasecpyAt(str, spot - 2, 'ia'));
    }
    if ((len >= 4 && endsWithI(str, 'alga'))
        || (len >= 5 && (endsWithI(str, 'hypha') || endsWithI(str, 'larva')))
        || (len >= 6 && endsWithI(str, 'amoeba'))
        || (len >= 8 && endsWithI(str, 'vertebra'))) {
        return bottom(strcasecpyAt(str, spot + 1, 'e'));
    }
    if (len > 3 && endsWithI(str, 'us')
        && !((len >= 5 && endsWithI(str, 'lotus'))
            || (len >= 6 && endsWithI(str, 'wumpus')))) {
        return bottom(strcasecpyAt(str, spot - 1, 'i'));
    }
    if (len >= 3 && endsWithI(str, 'sis')) {
        return bottom(strcasecpyAt(str, spot - 1, 'es'));
    }
    if (len >= 3 && endsWithI(str, 'eau')
        && !(len >= 6 && endsWithI(str, 'bureau'))) {
        return bottom(strcasecpyAt(str, spot + 1, 'x'));
    }
    if (len >= 6 && (endsWithI(str, 'matzoh') || endsWithI(str, 'matzah'))) {
        return bottom(strcasecpyAt(str, spot - 1, 'ot'));
    }
    if (len >= 5 && (endsWithI(str, 'matzo') || endsWithI(str, 'matza'))) {
        return bottom(strcasecpyAt(str, spot, 'ot'));
    }
    if (len >= 5
        && (endsWithI(str, 'dex') || endsWithI(str, 'dix') || endsWithI(str, 'tex'))
        && !endsWithI(str, 'index')) {
        return bottom(strcasecpyAt(str, spot - 1, 'ices'));
    }
    if ('zxs'.includes(lastLo)
        || (len >= 2 && lastLo === 'h' && 'cs'.includes(lowc(str[spot - 1]))
            && !(len >= 4 && lowc(str[spot - 1]) === 'c' && chKsound(str)))
        || (len >= 4 && endsWithI(str, 'ato'))
        || (len >= 5 && endsWithI(str, 'dingo'))) {
        return bottom(strcasecpyAt(str, spot + 1, 'es'));
    }
    if (lastLo === 'y' && !VOWELS.includes(lowc(str[spot - 1]))) {
        return bottom(strcasecpyAt(str, spot, 'ies'));
    }
    return bottom(strcasecpyAt(str, spot + 1, 's'));
}

export const makeplural = __nh_hp_makeplural; // test/unit convenience

// objnam.c vtense (§23.252): same interior-pointer surgery class as
// makeplural — the translated form's `spot = sp - 1` / `(spot - 3) <
// subj` pointer arithmetic is NaN in string mode, so conjugation
// never fired ("Your kitten step reluctantly onto ...", seed1500).
// Returns the singular 3rd-person present form of `verb` unless
// `subj` looks plural.
const SPECIAL_SUBJS = [
    'erinys', 'manes', 'Cyclops', 'Hippocrates', 'Pelias', 'aklys',
    'amnesia', 'detect monsters', 'paralysis', 'shape changers',
    'nemesis',
];
export function __nh_hp_vtense(subjIn, verbIn) {
    const subj = subjIn == null ? null : cstr(subjIn);
    const verb = cstr(verbIn);
    if (subj) {
        if (/^an? /i.test(subj)) return conjugate(verb);
        // find the core word end: just before " of ", " from ",
        // " called ", " named ", " labeled " — else end of string.
        let spot = -1;
        for (const m of [' of ', ' from ', ' called ', ' named ', ' labeled ']) {
            const i = subj.toLowerCase().indexOf(m);
            if (i > 0 && (spot < 0 || i - 1 < spot)) spot = i - 1;
        }
        // C scans left-to-right stopping at the FIRST matching
        // compound; the min-index reduction above is equivalent.
        if (spot < 0) spot = subj.length - 1;
        const at = (i) => (i >= 0 && i < subj.length) ? subj[i].toLowerCase() : '';
        const seg = subj.slice(0, spot + 1);
        const plural =
            (at(spot) === 's' && spot !== 0 && !'us'.includes(at(spot - 1)))
            || /eeth$/i.test(seg) || /feet$/i.test(seg)
            || /ia$/i.test(seg) || /ae$/i.test(seg);
        if (plural) {
            const len = spot + 1;
            for (const spec of SPECIAL_SUBJS) {
                if (len === spec.length
                    && subj.slice(0, len).toLowerCase() === spec.toLowerCase()) {
                    return conjugate(verb);
                }
                if (len > spec.length && subj[spot - spec.length] === ' '
                    && subj.slice(spot - spec.length + 1, spot + 1).toLowerCase()
                        === spec.toLowerCase()) {
                    return conjugate(verb);
                }
            }
            return verb; // plural subject: verb stays plural form
        }
        if (/^they$/i.test(subj) || /^you$/i.test(subj)) return verb;
    }
    return conjugate(verb);

    function conjugate(v) {
        const len = v.length;
        const last = v[len - 1] ? v[len - 1].toLowerCase() : '';
        const prev = len >= 2 ? v[len - 2].toLowerCase() : '';
        if (/^are$/i.test(v)) return strcasecpyAt(v, 0, 'is');
        if (/^have$/i.test(v)) return strcasecpyAt(v, len - 2, 's');
        if ('zxs'.includes(last)
            || (len >= 2 && last === 'h' && 'cs'.includes(prev))
            || (len === 2 && last === 'o')) {
            return strcasecpyAt(v, len, 'es');
        }
        if (last === 'y' && !VOWELS.includes(prev)) {
            return strcasecpyAt(v, len - 1, 'ies');
        }
        return strcasecpyAt(v, len, 's');
    }
}
export const vtense = __nh_hp_vtense; // unit-test convenience
