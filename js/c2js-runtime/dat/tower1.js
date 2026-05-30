// tower1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/tower1.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, nh, selection, shuffle }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport", "hardfloor", "solidify");
  await des.map({ halign: "half-left", valign: "center", map: "  --- --- ---  \n  |.| |.| |.|  \n---S---S---S---\n|.......+.+...|\n---+-----.-----\n  |...\\.|.+.|  \n---+-----.-----\n|.......+.+...|\n---S---S---S---\n  |.| |.| |.|  \n  --- --- ---  \n" });
  let niches = [[3, 1], [3, 9], [7, 1], [7, 9], [11, 1], [11, 9]];
  shuffle(niches);
  await des.ladder("down", 11, 5);
  await des.monster("Vlad the Impaler", 6, 5);
  await des.monster("V", niches[0]);
  await des.monster("V", niches[1]);
  await des.monster("V", niches[2]);
  let Vgenod = nh.is_genocided("vampire");
  let Vnames = [null, null, null];
  if ((!Vgenod)) {
      Vnames = ["Madame", "Marquise", "Countess"];
    }
  await des.monster({ id: "vampire lady", coord: niches[3], name: Vnames[0], waiting: 1 });
  await des.monster({ id: "vampire lady", coord: niches[4], name: Vnames[1], waiting: 1 });
  await des.monster({ id: "vampire lady", coord: niches[5], name: Vnames[2], waiting: 1 });
  await des.door("closed", 8, 3);
  await des.door("closed", 10, 3);
  await des.door("closed", 3, 4);
  await des.door("locked", 10, 5);
  await des.door("locked", 8, 7);
  await des.door("locked", 10, 7);
  await des.door("closed", 3, 6);
  await des.object("chest", 7, 5);
  await des.object("chest", niches[5]);
  await des.object("chest", niches[0]);
  await des.object("chest", niches[1]);
  await des.object("chest", niches[2]);
  await des.object({ id: "chest", coord: niches[3], contents: (async () => {
      await des.object({ id: "wax candle", quantity: math.random(4, 8) });
    }) });
  await des.object({ id: "chest", coord: niches[4], contents: (async () => {
      await des.object({ id: "tallow candle", quantity: math.random(4, 8) });
    }) });
  await des.non_diggable(selection.area(0, 0, 14, 10));
}
