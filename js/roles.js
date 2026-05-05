// roles.js — Role, race, gender, alignment data.
// C ref: role.c — roles[], races[], aligns[], genders[]
//
// STUB: contestants should port the full role data from C.
// This minimal version provides just enough for Tourist.

export const roles = [
    { name: { m: 'Archeologist', f: 'Archeologist' }, mnum: 0 },
    { name: { m: 'Barbarian', f: 'Barbarian' }, mnum: 1 },
    { name: { m: 'Caveman', f: 'Cavewoman' }, mnum: 2 },
    { name: { m: 'Healer', f: 'Healer' }, mnum: 3 },
    { name: { m: 'Knight', f: 'Knight' }, mnum: 4 },
    { name: { m: 'Monk', f: 'Monk' }, mnum: 5 },
    { name: { m: 'Priest', f: 'Priestess' }, mnum: 6 },
    { name: { m: 'Rogue', f: 'Rogue' }, mnum: 7 },
    { name: { m: 'Ranger', f: 'Ranger' }, mnum: 8 },
    { name: { m: 'Samurai', f: 'Samurai' }, mnum: 9 },
    { name: { m: 'Tourist', f: 'Tourist' }, mnum: 10,
      title: [
          { m: 'Rambler', f: 'Rambler' },
          { m: 'Sightseer', f: 'Sightseer' },
      ],
    },
    { name: { m: 'Valkyrie', f: 'Valkyrie' }, mnum: 11 },
    { name: { m: 'Wizard', f: 'Wizard' }, mnum: 12 },
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
    return roles.find(r => r.name.m.toLowerCase() === lc || r.name.f.toLowerCase() === lc);
}

export function findRace(name) {
    if (!name) return null;
    const lc = name.toLowerCase();
    return races.find(r => r.name.toLowerCase() === lc);
}
