// Mon-loca.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Mon-loca.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel");
  await des.map("             ----------------------------------------------------   --------\n           ---.................................................-    --.....|\n         ---...--------........------........................---     ---...|\n       ---.....-      --.......-    ----..................----         --.--\n     ---.....----      ---------       --..................--         --..| \n   ---...-----                       ----.----.....----.....---      --..|| \n----..----                       -----..---  |...---  |.......---   --...|  \n|...---                       ----....---    |.---    |.........-- --...||  \n|...-                      ----.....---     ----      |..........---....|   \n|...----                ----......---       |         |...|.......-....||   \n|......-----          ---.........-         |     -----...|............|    \n|..........-----   ----...........---       -------......||...........||    \n|..............-----................---     |............|||..........|     \n|-S----...............................---   |...........|| |.........||     \n|.....|..............------.............-----..........||  ||........|      \n|.....|.............--    ---.........................||    |.......||      \n|.....|.............-       ---.....................--|     ||......|       \n|---S--------.......----      --.................----        |.....||       \n|...........|..........--------..............-----           ||....|        \n|...........|............................-----                |....|        \n------------------------------------------                    ------        \n");
  await des.region(selection.area(0, 0, 75, 20), "lit");
  await des.stair("up");
  await des.stair("down");
  await des.non_diggable(selection.area(0, 0, 75, 20));
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  await des.object();
  let tinplace = selection.negate().filter_mapchar(".");
  let tinloc = tinplace.rndcoord(0);
  await des.object({ id: "tin", coord: tinloc, quantity: 2, buc: "blessed", montype: "spinach" });
  await des.engraving({ coord: tinloc, type: "burn", text: "Elbereth" });
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("earth elemental");
  await des.monster("xorn");
  await des.monster("xorn");
  await des.monster("xorn");
  await des.monster("xorn");
  await des.monster("xorn");
  await des.monster("xorn");
  await des.monster("xorn");
  await des.monster("xorn");
  await des.monster("xorn");
}
