// roles.js — Role, race, gender, alignment data.
// C ref: role.c — roles[], races[], aligns[], genders[]
//
// Per-role data needed by chargen, welcome, status line, and the
// legacy book.  Each role's `gods` is [lawful, neutral, chaotic] from
// the role.c roles[] table; a leading underscore on a god name marks
// a goddess (per pray.c:2552 align_gname() — strips '_' before
// returning, and pray.c:2628 align_gtitle() — returns "goddess" iff
// the underlying name starts with '_').
//
// `rank1` is the role's rank-1 title (m/f).  `f: null` means no
// gendered alternative; the male form is used regardless of gender.

export const roles = [
    { name: { m: 'Archeologist', f: null }, mnum: 0,
      rank1: { m: 'Digger', f: null },
      gods: ['Quetzalcoatl', 'Camaxtli', 'Huhetotl'] },
    { name: { m: 'Barbarian', f: null }, mnum: 1,
      rank1: { m: 'Plunderer', f: 'Plunderess' },
      gods: ['Mitra', 'Crom', 'Set'] },
    { name: { m: 'Caveman', f: 'Cavewoman' }, mnum: 2,
      rank1: { m: 'Troglodyte', f: null },
      gods: ['Anu', '_Ishtar', 'Anshar'] },
    { name: { m: 'Healer', f: null }, mnum: 3,
      rank1: { m: 'Rhizotomist', f: null },
      gods: ['_Athena', 'Hermes', 'Poseidon'] },
    { name: { m: 'Knight', f: null }, mnum: 4,
      rank1: { m: 'Gallant', f: null },
      gods: ['Lugh', '_Brigit', 'Manannan Mac Lir'] },
    { name: { m: 'Monk', f: null }, mnum: 5,
      rank1: { m: 'Candidate', f: null },
      gods: ['Shan Lai Ching', 'Chih Sung-tzu', 'Huan Ti'] },
    { name: { m: 'Priest', f: 'Priestess' }, mnum: 6,
      rank1: { m: 'Aspirant', f: null },
      // Priest's gods are randomized at game start (rn2(13) loop in
      // role.c role_init() picks a non-Priest pantheon).  Leaving
      // this null means the legacy renderer should fall back to the
      // pantheon picked at chargen — see role.js for the loop.
      gods: null },
    { name: { m: 'Rogue', f: null }, mnum: 7,
      rank1: { m: 'Footpad', f: null },
      gods: ['Issek', 'Mog', 'Kos'] },
    { name: { m: 'Ranger', f: null }, mnum: 8,
      rank1: { m: 'Tenderfoot', f: null },
      gods: ['Mercury', '_Venus', 'Mars'] },
    { name: { m: 'Samurai', f: null }, mnum: 9,
      rank1: { m: 'Hatamoto', f: null },
      gods: ['_Amaterasu Omikami', 'Raijin', 'Susanowo'] },
    { name: { m: 'Tourist', f: null }, mnum: 10,
      rank1: { m: 'Rambler', f: null },
      title: [
          { m: 'Rambler', f: 'Rambler' },
          { m: 'Sightseer', f: 'Sightseer' },
      ],
      gods: ['Blind Io', '_The Lady', 'Offler'] },
    { name: { m: 'Valkyrie', f: null }, mnum: 11,
      rank1: { m: 'Stripling', f: null },
      gods: ['Tyr', 'Odin', 'Loki'] },
    { name: { m: 'Wizard', f: null }, mnum: 12,
      rank1: { m: 'Evoker', f: null },
      gods: ['Ptah', 'Thoth', 'Anhur'] },
];

export const races = [
    { name: 'human', adj: 'human', mnum: 0 },
    { name: 'elf', adj: 'elven', mnum: 1 },
    { name: 'dwarf', adj: 'dwarven', mnum: 2 },
    { name: 'gnome', adj: 'gnomish', mnum: 3 },
    { name: 'orc', adj: 'orcish', mnum: 4 },
];

export const aligns = [
    { name: 'lawful', value: 1 },
    { name: 'neutral', value: 0 },
    { name: 'chaotic', value: -1 },
];

export const genders = [
    { name: 'male', value: 0 },
    { name: 'female', value: 1 },
];

export function findRole(name) {
    if (!name) return null;
    const lc = name.toLowerCase();
    return roles.find(r => r.name.m.toLowerCase() === lc || (r.name.f && r.name.f.toLowerCase() === lc));
}

export function findRace(name) {
    if (!name) return null;
    const lc = name.toLowerCase();
    return races.find(r => r.name.toLowerCase() === lc);
}
