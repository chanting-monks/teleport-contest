// minetn-1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/minetn-1.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_band, des, math, percent, selection, shuffle }) {
  await des.level_flags("mazelevel");
  await des.level_init({ style: "mines", fg: ".", bg: " ", smoothed: true, joined: true, walled: true });
  await des.map(".....................................\n.----------------F------------------.\n.|.................................|.\n.|.-------------......------------.|.\n.|.|...|...|...|......|..|...|...|.|.\n.F.|...|...|...|......|..|...|...|.|.\n.|.|...|...|...|......|..|...|...|.F.\n.|.|...|...|----......------------.|.\n.|.---------.......................|.\n.|.................................|.\n.|.---------.....--...--...........|.\n.|.|...|...|----.|.....|.---------.|.\n.|.|...|...|...|.|.....|.|..|....|.|.\n.|.|...|...|...|.|.....|.|..|....|.|.\n.|.|...|...|...|.|.....|.|..|....|.|.\n.|.-------------.-------.---------.|.\n.|.................................F.\n.-----------F------------F----------.\n.....................................\n");
  await des.teleport_region({ region: [1, 1, 75, 19], exclude: [1, 0, 35, 21], region_islev: 1 });
  await des.region(selection.area(1, 1, 35, 17), "lit");
  await des.levregion({ type: "stair-up", region: [1, 3, 21, 19], region_islev: 1, exclude: [0, 1, 36, 17] });
  await des.levregion({ type: "stair-down", region: [57, 3, 75, 19], region_islev: 1, exclude: [0, 1, 36, 17] });
  await des.feature("fountain", 16, 9);
  await des.feature("fountain", 25, 9);
  await des.altar({ x: 20, y: 13, align: "noalign", type: "shrine" });
  await des.door("random", 5, 8);
  await des.door("random", 9, 8);
  await des.door("random", 13, 7);
  await des.door("random", 22, 5);
  await des.door("random", 27, 7);
  await des.door("random", 31, 7);
  await des.door("random", 5, 10);
  await des.door("random", 9, 10);
  await des.door("random", 15, 13);
  await des.door("random", 25, 13);
  await des.door("random", 31, 11);
  await des.replace_terrain({ region: [7, 4, 11, 6], fromterrain: "|", toterrain: ".", chance: 18 });
  await des.replace_terrain({ region: [25, 4, 29, 6], fromterrain: "|", toterrain: ".", chance: 18 });
  await des.replace_terrain({ region: [7, 12, 11, 14], fromterrain: "|", toterrain: ".", chance: 18 });
  await des.replace_terrain({ region: [28, 12, 28, 14], fromterrain: "|", toterrain: ".", chance: 33 });
  let place = [[5, 4], [9, 5], [13, 4], [26, 4], [31, 5], [30, 14], [5, 14], [10, 13], [26, 14], [27, 13]];
  await shuffle(place);
  await des.object({ id: "corpse", x: 20, y: 12, montype: "aligned cleric" });
  await des.object({ id: "corpse", coord: place[0], montype: "shopkeeper" });
  await des.object({ id: "corpse", coord: place[1], montype: "shopkeeper" });
  await des.object({ id: "corpse", coord: place[2], montype: "shopkeeper" });
  await des.object({ id: "corpse", coord: place[3], montype: "shopkeeper" });
  await des.object({ id: "corpse", coord: place[4], montype: "shopkeeper" });
  await des.object({ id: "corpse", montype: "watchman" });
  await des.object({ id: "corpse", montype: "watchman" });
  await des.object({ id: "corpse", montype: "watchman" });
  await des.object({ id: "corpse", montype: "watchman" });
  await des.object({ id: "corpse", montype: "watch captain" });
  {
      const __hi = math.random(10, 19);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        if (percent(90)) {
              await des.object("boulder");
            }
        await des.object("rock");
      }
    }
  await des.object({ id: "wax candle", coord: place[3], quantity: math.random(1, 2) });
  await des.object({ id: "wax candle", coord: place[0], quantity: math.random(2, 4) });
  await des.object({ id: "wax candle", coord: place[1], quantity: math.random(1, 2) });
  await des.object({ id: "tallow candle", coord: place[2], quantity: math.random(1, 3) });
  await des.object({ id: "tallow candle", coord: place[1], quantity: math.random(1, 2) });
  await des.object({ id: "tallow candle", coord: place[3], quantity: math.random(1, 2) });
  await des.object("oil lamp", place[1]);
  await des.object({ id: "wand of striking", coord: place[0], buc: "uncursed", spe: 0 });
  await des.object({ id: "wand of striking", coord: place[2], buc: "uncursed", spe: 0 });
  await des.object({ id: "wand of striking", coord: place[3], buc: "uncursed", spe: 0 });
  await des.object({ id: "wand of magic missile", coord: place[3], buc: "uncursed", spe: 0 });
  await des.object({ id: "wand of magic missile", coord: place[4], buc: "uncursed", spe: 0 });
  let inside = selection.floodfill(18, 8);
  let near_temple = __lua_band(selection.area(17, 8, 23, 14), inside);
  {
      const __hi = math.random(5, 15);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        if (percent(50)) {
              await des.monster({ id: "orc-captain", coord: inside.rndcoord(1), peaceful: 0 });
            } else {
              if (percent(80)) {
                  await des.monster({ id: "Uruk-hai", coord: inside.rndcoord(1), peaceful: 0 });
                } else {
                  await des.monster({ id: "Mordor orc", coord: inside.rndcoord(1), peaceful: 0 });
                }
            }
      }
    }
  {
      const __hi = math.random(1, 6);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster({ id: "orc shaman", coord: near_temple.rndcoord(0), peaceful: 0, m_lev_adj: (i == 1) && 3 || 0 });
      }
    }
  {
      const __hi = math.random(10, 19);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        if (percent(90)) {
              await des.monster({ id: "hill orc", peaceful: 0 });
            } else {
              await des.monster({ id: "goblin", peaceful: 0 });
            }
      }
    }
  await des.wallify();
}
