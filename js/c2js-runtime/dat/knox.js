// knox.js — AUTO-GENERATED from
// nethack-c/upstream/dat/knox.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport");
  await des.map("----------------------------------------------------------------------------\n| |........|...............................................................|\n| |........|.................................................------------..|\n| --S----S--.................................................|..........|..|\n|   #   |........}}}}}}}....................}}}}}}}..........|..........|..|\n|   #   |........}-----}....................}-----}..........--+--+--...|..|\n|   # ---........}|...|}}}}}}}}}}}}}}}}}}}}}}|...|}.................|...|..|\n|   # |..........}---S------------------------S---}.................|...|..|\n|   # |..........}}}|...............|..........|}}}.................+...|..|\n| --S----..........}|...............S..........|}...................|...|..|\n| |.....|..........}|...............|......\\...S}...................|...|..|\n| |.....+........}}}|...............|..........|}}}.................+...|..|\n| |.....|........}---S------------------------S---}.................|...|..|\n| |.....|........}|...|}}}}}}}}}}}}}}}}}}}}}}|...|}.................|...|..|\n| |..-S----......}-----}....................}-----}..........--+--+--...|..|\n| |..|....|......}}}}}}}....................}}}}}}}..........|..........|..|\n| |..|....|..................................................|..........|..|\n| -----------................................................------------..|\n|           |..............................................................|\n----------------------------------------------------------------------------\n");
  await des.non_diggable(selection.area(0, 0, 75, 19));
  await des.levregion({ region: [8, 16, 8, 16], type: "branch" });
  await des.teleport_region({ region: [6, 15, 9, 16], dir: "up" });
  await des.teleport_region({ region: [6, 15, 9, 16], dir: "down" });
  await des.region({ x1: 37, y1: 8, x2: 46, y2: 11, lit: 1, type: "throne", filled: 1 });
  if (percent(50)) {
      await des.monster({ id: "Croesus", x: 43, y: 10, peaceful: 0 });
    } else {
      await des.monster({ id: "Croesus", x: 43, y: 9, peaceful: 0 });
      await des.terrain(43, 9, "\\");
      await des.terrain(43, 10, ".");
    }
  if (percent(50)) {
      await des.terrain(47, 9, "S");
      await des.terrain(47, 10, "|");
    }
  globalThis.treasure_spot = async (x, y) => {
      await des.gold({ x: x, y: y, amount: 600 + math.random(0, 300) });
      if ((math.random(0, 2) == 0)) {
          if ((math.random(0, 2) == 0)) {
              await des.trap("spiked pit", x, y);
            } else {
              await des.trap("land mine", x, y);
            }
        }
    };
  await des.region({ region: [21, 8, 35, 11], lit: 1, type: "ordinary" });
  let treasury = selection.area(21, 8, 35, 11);
  treasury.iterate(treasure_spot);
  if (percent(50)) {
      await des.terrain(36, 9, "|");
      await des.terrain(36, 10, "S");
    }
  await des.region(selection.area(19, 6, 21, 6), "lit");
  await des.region(selection.area(46, 6, 48, 6), "lit");
  await des.region(selection.area(19, 13, 21, 13), "lit");
  await des.region(selection.area(46, 13, 48, 13), "lit");
  await des.region({ region: [3, 10, 7, 13], lit: 1, type: "zoo", filled: 1, irregular: 1 });
  await des.region({ region: [6, 15, 9, 16], lit: 0, type: "ordinary", arrival_room: true });
  await des.region(selection.area(5, 14, 5, 17), "unlit");
  await des.region(selection.area(5, 14, 9, 14), "unlit");
  await des.region({ region: [62, 3, 71, 4], lit: 1, type: "barracks", filled: 1, irregular: 1 });
  await des.door("closed", 6, 14);
  await des.door("closed", 9, 3);
  await des.door("open", 63, 5);
  await des.door("open", 66, 5);
  await des.door("open", 68, 8);
  await des.door("locked", 8, 11);
  await des.door("open", 68, 11);
  await des.door("closed", 63, 14);
  await des.door("closed", 66, 14);
  await des.door("closed", 4, 3);
  await des.door("closed", 4, 9);
  await des.monster("soldier", 12, 14);
  await des.monster("soldier", 12, 13);
  await des.monster("soldier", 11, 10);
  await des.monster("soldier", 13, 2);
  await des.monster("soldier", 14, 3);
  await des.monster("soldier", 20, 2);
  await des.monster("soldier", 30, 2);
  await des.monster("soldier", 40, 2);
  await des.monster("soldier", 30, 16);
  await des.monster("soldier", 32, 16);
  await des.monster("soldier", 40, 16);
  await des.monster("soldier", 54, 16);
  await des.monster("soldier", 54, 14);
  await des.monster("soldier", 54, 13);
  await des.monster("soldier", 57, 10);
  await des.monster("soldier", 57, 9);
  await des.monster("lieutenant", 15, 8);
  await des.monster("stone giant", 3, 1);
  await des.monster("D", 18, 9);
  await des.monster("D", 49, 10);
  await des.monster("D", 33, 5);
  await des.monster("D", 33, 14);
  await des.monster("giant eel", 17, 8);
  await des.monster("giant eel", 17, 11);
  await des.monster("giant eel", 48, 8);
  await des.monster("giant eel", 48, 11);
  await des.object("diamond", 19, 6);
  await des.object("diamond", 20, 6);
  await des.object("diamond", 21, 6);
  await des.object("emerald", 19, 13);
  await des.object("emerald", 20, 13);
  await des.object("emerald", 21, 13);
  await des.object("ruby", 46, 6);
  await des.object("ruby", 47, 6);
  await des.object("ruby", 48, 6);
  await des.object("amethyst", 46, 13);
  await des.object("amethyst", 47, 13);
  await des.object("amethyst", 48, 13);
}
