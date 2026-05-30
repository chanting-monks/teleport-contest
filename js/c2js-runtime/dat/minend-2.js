// minend-2.js — AUTO-GENERATED from
// nethack-c/upstream/dat/minend-2.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel");
  await des.map("---------------------------------------------------------------------------\n|...................................................|                     |\n|.|---------S--.--|...|--------------------------|..|                     |\n|.||---|   |.||-| |...|..........................|..|                     |\n|.||...| |-|.|.|---...|.............................|                ..   |\n|.||...|-|.....|....|-|..........................|..|.               ..   |\n|.||.....|-S|..|....|............................|..|..                   |\n|.||--|..|..|..|-|..|----------------------------|..|-.                   |\n|.|   |..|..|....|..................................|...                  |\n|.|   |..|..|----|..-----------------------------|..|....                 |\n|.|---|..|--|.......|----------------------------|..|.....                |\n|...........|----.--|......................|     |..|.......              |\n|-----------|...|.| |------------------|.|.|-----|..|.....|..             |\n|-----------|.{.|.|--------------------|.|..........|.....|....           |\n|...............|.S......................|-------------..-----...         |\n|.--------------|.|--------------------|.|.........................       |\n|.................|                    |.....................|........    |\n---------------------------------------------------------------------------\n");
  if (percent(50)) {
      await des.terrain([55, 14], "-");
      await des.terrain([56, 14], "-");
      await des.terrain([61, 15], "|");
      await des.terrain([52, 5], "S");
      await des.door("locked", 52, 5);
    }
  if (percent(50)) {
      await des.terrain([18, 1], "|");
      await des.terrain(selection.area(7, 12, 8, 13), ".");
    }
  if (percent(50)) {
      await des.terrain([49, 4], "|");
      await des.terrain([21, 5], ".");
    }
  if (percent(50)) {
      if (percent(50)) {
          await des.terrain([22, 1], "|");
        } else {
          await des.terrain([50, 7], "-");
          await des.terrain([51, 7], "-");
        }
    }
  await des.teleport_region({ region: [23, 3, 48, 16], region_islev: 1 });
  await des.feature("fountain", [14, 13]);
  await des.region(selection.area(23, 3, 48, 6), "lit");
  await des.region(selection.area(21, 6, 22, 6), "lit");
  await des.region(selection.area(14, 4, 14, 4), "unlit");
  await des.region(selection.area(10, 5, 14, 8), "unlit");
  await des.region(selection.area(10, 9, 11, 9), "unlit");
  await des.region(selection.area(15, 8, 16, 8), "unlit");
  await des.door("locked", 12, 2);
  await des.door("locked", 11, 6);
  await des.stair("up", 36, 4);
  await des.non_diggable(selection.area(0, 0, 52, 17));
  await des.non_diggable(selection.area(53, 0, 74, 0));
  await des.non_diggable(selection.area(53, 17, 74, 17));
  await des.non_diggable(selection.area(74, 1, 74, 16));
  await des.non_diggable(selection.area(53, 7, 55, 7));
  await des.non_diggable(selection.area(53, 14, 61, 14));
  await des.engraving([12, 3], "engrave", "You are now entering the Gnome King's wine cellar.");
  await des.engraving([12, 4], "engrave", "Trespassers will be persecuted!");
  await des.object("potion of booze", 10, 7);
  await des.object("potion of booze", 10, 7);
  await des.object("!", 10, 7);
  await des.object("potion of booze", 10, 8);
  await des.object("potion of booze", 10, 8);
  await des.object("!", 10, 8);
  await des.object("potion of booze", 10, 9);
  await des.object("potion of booze", 10, 9);
  await des.object("potion of object detection", 10, 9);
  await des.object("diamond", 69, 4);
  await des.object("*", 69, 4);
  await des.object("diamond", 69, 4);
  await des.object("*", 69, 4);
  await des.object("emerald", 70, 4);
  await des.object("*", 70, 4);
  await des.object("emerald", 70, 4);
  await des.object("*", 70, 4);
  await des.object("emerald", 69, 5);
  await des.object("*", 69, 5);
  await des.object("ruby", 69, 5);
  await des.object("*", 69, 5);
  await des.object("ruby", 70, 5);
  await des.object("amethyst", 70, 5);
  await des.object("*", 70, 5);
  await des.object("amethyst", 70, 5);
  await des.object({ id: "luckstone", x: 70, y: 5, buc: "not-cursed", achievement: 1 });
  await des.object("*");
  await des.object("*");
  await des.object("*");
  await des.object("*");
  await des.object("*");
  await des.object("*");
  await des.object("*");
  await des.object("(");
  await des.object("(");
  await des.object();
  await des.object();
  await des.object();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.monster("gnome king");
  await des.monster("gnome lord");
  await des.monster("gnome lord");
  await des.monster("gnome lord");
  await des.monster("gnomish wizard");
  await des.monster("gnomish wizard");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("gnome");
  await des.monster("hobbit");
  await des.monster("hobbit");
  await des.monster("dwarf");
  await des.monster("dwarf");
  await des.monster("dwarf");
  await des.monster("h");
}
