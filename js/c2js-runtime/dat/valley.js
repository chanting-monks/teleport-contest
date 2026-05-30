// valley.js — AUTO-GENERATED from
// nethack-c/upstream/dat/valley.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport", "hardfloor", "nommap", "temperate");
  await des.map("----------------------------------------------------------------------------\n|...S.|..|.....|  |.....-|      |................|   |...............| |...|\n|---|.|.--.---.|  |......--- ----..........-----.-----....---........---.-.|\n|   |.|.|..| |.| --........| |.............|   |.......---| |-...........--|\n|   |...S..| |.| |.......-----.......------|   |--------..---......------- |\n|----------- |.| |-......| |....|...-- |...-----................----       |\n|.....S....---.| |.......| |....|...|  |..............-----------          |\n|.....|.|......| |.....--- |......---  |....---.......|                    |\n|.....|.|------| |....--   --....-- |-------- ----....---------------      |\n|.....|--......---BBB-|     |...--  |.......|    |..................|      |\n|..........||........-|    --...|   |.......|    |...||.............|      |\n|.....|...-||-........------....|   |.......---- |...||.............--     |\n|.....|--......---...........--------..........| |.......---------...--    |\n|.....| |------| |--.......--|   |..B......----- -----....| |.|  |....---  |\n|.....| |......--| ------..| |----..B......|       |.--------.-- |-.....---|\n|------ |........|  |.|....| |.....----BBBB---------...........---.........|\n|       |........|  |...|..| |.....|  |-.............--------...........---|\n|       --.....-----------.| |....-----.....----------     |.........----  |\n|        |..|..B...........| |.|..........|.|              |.|........|    |\n----------------------------------------------------------------------------\n");
  if (percent(50)) {
      await des.terrain(selection.line(50, 8, 53, 8), "-");
      await des.terrain(selection.line(40, 8, 43, 8), "B");
    }
  if (percent(50)) {
      await des.terrain({ x: 27, y: 12, typ: "|" });
      await des.terrain(selection.line(27, 3, 29, 3), "B");
      await des.terrain({ x: 28, y: 2, typ: "-" });
    }
  if (percent(50)) {
      await des.terrain(selection.line(16, 10, 16, 11), "|");
      await des.terrain(selection.line(9, 13, 14, 13), "B");
    }
  await des.region({ region: [1, 6, 5, 14], lit: 1, type: "temple", filled: 2 });
  await des.region({ region: [19, 1, 24, 8], lit: 0, type: "morgue", filled: 1, irregular: 1 });
  await des.region({ region: [9, 14, 16, 18], lit: 0, type: "morgue", filled: 1, irregular: 1 });
  await des.region({ region: [37, 9, 43, 14], lit: 0, type: "morgue", filled: 1, irregular: 1 });
  await des.stair("down", 1, 1);
  await des.levregion({ type: "branch", region: [66, 17, 66, 17] });
  await des.teleport_region({ region: [58, 9, 72, 18], dir: "down" });
  await des.door("locked", 4, 1);
  await des.door("locked", 8, 4);
  await des.door("locked", 6, 6);
  await des.altar({ x: 3, y: 10, align: "noalign", type: "shrine" });
  await des.non_diggable(selection.area(0, 0, 75, 19));
  await des.object({ id: "corpse", montype: "archeologist" });
  await des.object({ id: "corpse", montype: "archeologist" });
  await des.object({ id: "corpse", montype: "barbarian" });
  await des.object({ id: "corpse", montype: "barbarian" });
  await des.object({ id: "corpse", montype: "caveman" });
  await des.object({ id: "corpse", montype: "cavewoman" });
  await des.object({ id: "corpse", montype: "healer" });
  await des.object({ id: "corpse", montype: "healer" });
  await des.object({ id: "corpse", montype: "knight" });
  await des.object({ id: "corpse", montype: "knight" });
  await des.object({ id: "corpse", montype: "ranger" });
  await des.object({ id: "corpse", montype: "ranger" });
  await des.object({ id: "corpse", montype: "rogue" });
  await des.object({ id: "corpse", montype: "rogue" });
  await des.object({ id: "corpse", montype: "samurai" });
  await des.object({ id: "corpse", montype: "samurai" });
  await des.object({ id: "corpse", montype: "tourist" });
  await des.object({ id: "corpse", montype: "tourist" });
  await des.object({ id: "corpse", montype: "valkyrie" });
  await des.object({ id: "corpse", montype: "valkyrie" });
  await des.object({ id: "corpse", montype: "wizard" });
  await des.object({ id: "corpse", montype: "wizard" });
  await des.object("[");
  await des.object("[");
  await des.object("[");
  await des.object("[");
  await des.object(")");
  await des.object(")");
  await des.object(")");
  await des.object(")");
  await des.object("ruby");
  await des.object("*");
  await des.object("*");
  await des.object("!");
  await des.object("!");
  await des.object("!");
  await des.object("?");
  await des.object("?");
  await des.object("?");
  await des.object("/");
  await des.object("/");
  await des.object("=");
  await des.object("=");
  await des.object("+");
  await des.object("+");
  await des.object("(");
  await des.object("(");
  await des.object("(");
  await des.trap("spiked pit", 5, 2);
  await des.trap("spiked pit", 14, 5);
  await des.trap("sleep gas", 3, 1);
  await des.trap("board", 21, 12);
  await des.trap("board");
  await des.trap("dart", 60, 1);
  await des.trap("dart", 26, 17);
  await des.trap("anti magic");
  await des.trap("anti magic");
  await des.trap("magic");
  await des.trap("magic");
  await des.monster("ghost");
  await des.monster("ghost");
  await des.monster("ghost");
  await des.monster("ghost");
  await des.monster("ghost");
  await des.monster("ghost");
  await des.monster("vampire bat");
  await des.monster("vampire bat");
  await des.monster("vampire bat");
  await des.monster("L");
  await des.monster("V");
  await des.monster("V");
  await des.monster("V");
  await des.monster("Z");
  await des.monster("Z");
  await des.monster("Z");
  await des.monster("Z");
  await des.monster("M");
  await des.monster("M");
  await des.monster("M");
  await des.monster("M");
}
