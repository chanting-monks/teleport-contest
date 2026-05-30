// minetn-5.js — AUTO-GENERATED from
// nethack-c/upstream/dat/minetn-5.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel");
  await des.map("-----         ---------                                                    \n|...---  ------.......--    -------                       ---------------  \n|.....----.........--..|    |.....|          -------      |.............|  \n--..-....-.----------..|    |.....|          |.....|     --+---+--.----+-  \n --.--.....----     ----    |.....|  ------  --....----  |..-...--.-.+..|  \n  ---.........----  -----   ---+---  |..+.|   ---..-..----..---+-..---..|  \n    ----.-....|..----...--    |.|    |..|.|    ---+-.....-+--........--+-  \n       -----..|....-.....---- |.|    |..|.------......--................|  \n    ------ |..|.............---.--   ----.+..|-.......--..--------+--..--  \n    |....| --......---...........-----  |.|..|-...{....---|.........|..--  \n    |....|  |........-...-...........----.|..|--.......|  |.........|...|  \n    ---+--------....-------...---......--.-------....---- -----------...|  \n ------.---...--...--..-..--...-..---...|.--..-...-....------- |.......--  \n |..|-.........-..---..-..---.....--....|........---...-|....| |.-------   \n |..+...............-+---+-----..--..........--....--...+....| |.|...S.    \n-----.....{....----...............-...........--...-...-|....| |.|...|     \n|..............-- --+--.---------.........--..-........------- |.--+-------\n-+-----.........| |...|.|....|  --.......------...|....---------.....|....|\n|...| --..------- |...|.+....|   ---...---    --..|...--......-...{..+..-+|\n|...|  ----       ------|....|     -----       -----.....----........|..|.|\n-----                   ------                     -------  ---------------\n");
  if (percent(75)) {
      if (percent(50)) {
          await des.terrain(selection.line(25, 8, 25, 9), "|");
        } else {
          await des.terrain(selection.line(16, 13, 17, 13), "-");
        }
    }
  if (percent(75)) {
      if (percent(50)) {
          await des.terrain(selection.line(36, 10, 36, 11), "|");
        } else {
          await des.terrain(selection.line(32, 15, 33, 15), "-");
        }
    }
  if (percent(50)) {
      await des.terrain(selection.area(21, 4, 22, 5), ".");
      await des.terrain(selection.line(14, 9, 14, 10), "|");
    }
  if (percent(50)) {
      await des.terrain([46, 13], "|");
      await des.terrain(selection.line(43, 5, 47, 5), "-");
      await des.terrain(selection.line(42, 6, 46, 6), ".");
      await des.terrain(selection.line(46, 7, 47, 7), ".");
    }
  if (percent(50)) {
      await des.terrain(selection.area(69, 11, 71, 11), "-");
    }
  await des.stair("up", 1, 1);
  await des.stair("down", 46, 3);
  await des.feature("fountain", 50, 9);
  await des.feature("fountain", 10, 15);
  await des.feature("fountain", 66, 18);
  await des.region(selection.area(0, 0, 74, 20), "unlit");
  await des.region(selection.area(9, 13, 11, 17), "lit");
  await des.region(selection.area(8, 14, 12, 16), "lit");
  await des.region(selection.area(49, 7, 51, 11), "lit");
  await des.region(selection.area(48, 8, 52, 10), "lit");
  await des.region(selection.area(64, 17, 68, 19), "lit");
  await des.region(selection.area(37, 13, 39, 17), "lit");
  await des.region(selection.area(36, 14, 40, 17), "lit");
  await des.region(selection.area(59, 2, 72, 10), "lit");
  await des.monster({ id: "watchman", peaceful: 1 });
  await des.monster({ id: "watchman", peaceful: 1 });
  await des.monster({ id: "watchman", peaceful: 1 });
  await des.monster({ id: "watchman", peaceful: 1 });
  await des.monster({ id: "watch captain", peaceful: 1 });
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome lord");
  await des.monster("gnome lord");
  await des.monster("dwarf");
  await des.monster("dwarf");
  await des.monster("dwarf");
  await des.region({ region: [25, 17, 28, 19], lit: 1, type: "candle shop", filled: 1 });
  await des.door("closed", 24, 18);
  await des.region({ region: [59, 9, 67, 10], lit: 1, type: "shop", filled: 1 });
  await des.door("closed", 66, 8);
  await des.region({ region: [57, 13, 60, 15], lit: 1, type: "tool shop", filled: 1 });
  await des.door("closed", 56, 14);
  await des.region({ region: [5, 9, 8, 10], lit: 1, type: globalThis.monkfoodshop(), filled: 1 });
  await des.door("closed", 7, 11);
  await des.door("closed", 4, 14);
  await des.door("locked", 1, 17);
  await des.monster("gnomish wizard", 2, 19);
  await des.door("locked", 20, 16);
  await des.monster("G", 20, 18);
  await des.door("random", 21, 14);
  await des.door("random", 25, 14);
  await des.door("random", 42, 8);
  await des.door("locked", 40, 5);
  await des.monster("G", 38, 7);
  await des.door("random", 59, 3);
  await des.door("random", 58, 6);
  await des.door("random", 63, 3);
  await des.door("random", 63, 5);
  await des.door("locked", 71, 3);
  await des.door("locked", 71, 6);
  await des.door("closed", 69, 4);
  await des.door("closed", 67, 16);
  await des.monster("gnomish wizard", 67, 14);
  await des.object("=", 70, 14);
  await des.door("locked", 69, 18);
  await des.monster("gnome lord", 71, 19);
  await des.door("locked", 73, 18);
  await des.object("chest", 73, 19);
  await des.door("locked", 50, 6);
  await des.object("(", 50, 3);
  await des.object({ id: "statue", x: 38, y: 15, montype: "gnome king", historic: 1 });
  await des.region({ region: [29, 2, 33, 4], lit: 1, type: "temple", filled: 1 });
  await des.door("closed", 31, 5);
  await des.altar({ x: 31, y: 3, align: globalThis.align[0], type: "shrine" });
}
