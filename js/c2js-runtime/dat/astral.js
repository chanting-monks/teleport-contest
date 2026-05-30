// astral.js — AUTO-GENERATED from
// nethack-c/upstream/dat/astral.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport", "hardfloor", "nommap", "shortsighted", "solidify");
  await des.message("You arrive on the Astral Plane!");
  await des.message("Here the High Temple of %d is located.");
  await des.message("You sense alarm, hostility, and excitement in the air!");
  await des.map("                              ---------------                              \n                              |.............|                              \n                              |..---------..|                              \n                              |..|.......|..|                              \n---------------               |..|.......|..|               ---------------\n|.............|               |..|.......|..|               |.............|\n|..---------..-|   |-------|  |..|.......|..|  |-------|   |-..---------..|\n|..|.......|...-| |-.......-| |..|.......|..| |-.......-| |-...|.......|..|\n|..|.......|....-|-.........-||..----+----..||-.........-|-....|.......|..|\n|..|.......+.....+...........||.............||...........+.....+.......|..|\n|..|.......|....-|-.........-|--|.........|--|-.........-|-....|.......|..|\n|..|.......|...-| |-.......-|   -|---+---|-   |-.......-| |-...|.......|..|\n|..---------..-|   |---+---|    |-.......-|    |---+---|   |-..---------..|\n|.............|      |...|-----|-.........-|-----|...|      |.............|\n---------------      |.........|...........|.........|      ---------------\n                     -------...|-.........-|...-------                     \n                           |....|-.......-|....|                           \n                           ---...|---+---|...---                           \n                             |...............|                             \n                             -----------------                             \n");
  {
      const __hi = 2;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        let hall;
        if (percent(60)) {
              if (i == 1) {
                  await des.terrain(selection.area(17, 14, 30, 18), ".");
                  await des.wallify();
                  await des.terrain(33, 18, "|");
                  hall = selection.floodfill(30, 16);
                  await des.terrain(33, 18, ".");
                } else {
                  await des.terrain(selection.area(44, 14, 57, 18), ".");
                  await des.wallify();
                  await des.terrain(41, 18, "|");
                  hall = selection.floodfill(44, 16);
                  await des.terrain(41, 18, ".");
                }
              {
                  const __hi = math.random(4, 9);
                  const __step = 1;
                  for (let j = 1; __step > 0 ? j <= __hi : j >= __hi; j += __step) {
                    await des.monster({ id: "Angel", coord: hall.rndcoord(1), align: "noalign", peaceful: 0 });
                    if (percent(50)) {
                          await des.monster({ coord: hall.rndcoord(1), peaceful: 0 });
                        }
                  }
                }
            }
      }
    }
  let place = selection.new();
  place.set(23, 9);
  place.set(37, 14);
  place.set(51, 9);
  await des.teleport_region({ region: [29, 15, 45, 15], exclude: [30, 15, 44, 15] });
  await des.region({ region: [1, 5, 16, 14], lit: 1, type: "ordinary", irregular: 1 });
  await des.region({ region: [31, 1, 44, 10], lit: 1, type: "ordinary", irregular: 1 });
  await des.region({ region: [61, 5, 74, 14], lit: 1, type: "ordinary", irregular: 1 });
  await des.region({ region: [4, 7, 10, 11], lit: 1, type: "temple", filled: 2 });
  await des.region({ region: [34, 3, 40, 7], lit: 1, type: "temple", filled: 2 });
  await des.region({ region: [64, 7, 70, 11], lit: 1, type: "temple", filled: 2 });
  await des.altar({ x: 7, y: 9, align: globalThis.align[0], type: "sanctum" });
  await des.altar({ x: 37, y: 5, align: globalThis.align[1], type: "sanctum" });
  await des.altar({ x: 67, y: 9, align: globalThis.align[2], type: "sanctum" });
  await des.door("closed", 11, 9);
  await des.door("closed", 17, 9);
  await des.door("locked", 23, 12);
  await des.door("locked", 37, 8);
  await des.door("closed", 37, 11);
  await des.door("closed", 37, 17);
  await des.door("locked", 51, 12);
  await des.door("locked", 57, 9);
  await des.door("closed", 63, 9);
  await des.non_diggable(selection.area(0, 0, 74, 19));
  await des.non_passwall(selection.area(0, 0, 74, 19));
  await des.monster({ id: "aligned cleric", x: 18, y: 9, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 19, y: 8, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 19, y: 9, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 19, y: 10, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Angel", x: 20, y: 9, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Angel", x: 20, y: 10, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Pestilence", coord: place.rndcoord(1), peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 36, y: 12, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 37, y: 12, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 38, y: 12, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 36, y: 13, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Angel", x: 38, y: 13, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Angel", x: 37, y: 13, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Death", coord: place.rndcoord(1), peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 56, y: 9, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 55, y: 8, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 55, y: 9, align: "noalign", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 55, y: 10, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Angel", x: 54, y: 9, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Angel", x: 54, y: 10, align: "noalign", peaceful: 0 });
  await des.monster({ id: "Famine", coord: place.rndcoord(1), peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 12, y: 7, align: "chaos", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 13, y: 7, align: "chaos", peaceful: 1 });
  await des.monster({ id: "aligned cleric", x: 14, y: 7, align: "law", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 12, y: 11, align: "law", peaceful: 1 });
  await des.monster({ id: "aligned cleric", x: 13, y: 11, align: "neutral", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 14, y: 11, align: "neutral", peaceful: 1 });
  await des.monster({ id: "Angel", x: 11, y: 5, align: "chaos", peaceful: 0 });
  await des.monster({ id: "Angel", x: 12, y: 5, align: "chaos", peaceful: 1 });
  await des.monster({ id: "Angel", x: 13, y: 5, align: "law", peaceful: 0 });
  await des.monster({ id: "Angel", x: 11, y: 13, align: "law", peaceful: 1 });
  await des.monster({ id: "Angel", x: 12, y: 13, align: "neutral", peaceful: 0 });
  await des.monster({ id: "Angel", x: 13, y: 13, align: "neutral", peaceful: 1 });
  await des.monster({ id: "aligned cleric", x: 32, y: 9, align: "chaos", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 33, y: 9, align: "chaos", peaceful: 1 });
  await des.monster({ id: "aligned cleric", x: 34, y: 9, align: "law", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 40, y: 9, align: "law", peaceful: 1 });
  await des.monster({ id: "aligned cleric", x: 41, y: 9, align: "neutral", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 42, y: 9, align: "neutral", peaceful: 1 });
  await des.monster({ id: "Angel", x: 31, y: 8, align: "chaos", peaceful: 0 });
  await des.monster({ id: "Angel", x: 32, y: 8, align: "chaos", peaceful: 1 });
  await des.monster({ id: "Angel", x: 31, y: 9, align: "law", peaceful: 0 });
  await des.monster({ id: "Angel", x: 42, y: 8, align: "law", peaceful: 1 });
  await des.monster({ id: "Angel", x: 43, y: 8, align: "neutral", peaceful: 0 });
  await des.monster({ id: "Angel", x: 43, y: 9, align: "neutral", peaceful: 1 });
  await des.monster({ id: "aligned cleric", x: 60, y: 7, align: "chaos", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 61, y: 7, align: "chaos", peaceful: 1 });
  await des.monster({ id: "aligned cleric", x: 62, y: 7, align: "law", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 60, y: 11, align: "law", peaceful: 1 });
  await des.monster({ id: "aligned cleric", x: 61, y: 11, align: "neutral", peaceful: 0 });
  await des.monster({ id: "aligned cleric", x: 62, y: 11, align: "neutral", peaceful: 1 });
  await des.monster({ id: "Angel", x: 61, y: 5, align: "chaos", peaceful: 0 });
  await des.monster({ id: "Angel", x: 62, y: 5, align: "chaos", peaceful: 1 });
  await des.monster({ id: "Angel", x: 63, y: 5, align: "law", peaceful: 0 });
  await des.monster({ id: "Angel", x: 61, y: 13, align: "law", peaceful: 1 });
  await des.monster({ id: "Angel", x: 62, y: 13, align: "neutral", peaceful: 0 });
  await des.monster({ id: "Angel", x: 63, y: 13, align: "neutral", peaceful: 1 });
  await des.monster({ class: "L", peaceful: 0 });
  await des.monster({ class: "L", peaceful: 0 });
  await des.monster({ class: "L", peaceful: 0 });
  await des.monster({ class: "V", peaceful: 0 });
  await des.monster({ class: "V", peaceful: 0 });
  await des.monster({ class: "V", peaceful: 0 });
  await des.monster({ class: "D", peaceful: 0 });
  await des.monster({ class: "D", peaceful: 0 });
  await des.monster({ class: "D", peaceful: 0 });
}
