// tower3.js — AUTO-GENERATED from
// nethack-c/upstream/dat/tower3.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport", "hardfloor", "solidify");
  await des.map({ halign: "half-left", valign: "center", map: "    --- --- ---    \n    |.| |.| |.|    \n  ---S---S---S---  \n  |.S.........S.|  \n-----.........-----\n|...|.........+...|\n|.---.........---.|\n|.|.S.........S.|.|\n|.---S---S---S---.|\n|...|.|.|.|.|.|...|\n---.---.---.---.---\n  |.............|  \n  ---------------  \n" });
  let place = [[5, 1], [9, 1], [13, 1], [3, 3], [15, 3], [3, 7], [15, 7], [5, 9], [9, 9], [13, 9]];
  await des.levregion({ type: "branch", region: [2, 5, 2, 5] });
  await des.ladder("up", 5, 7);
  await des.door("locked", 14, 5);
  await des.monster("D", 13, 5);
  await des.monster({ x: 12, y: 4 });
  await des.monster({ x: 12, y: 6 });
  await des.monster();
  await des.monster();
  await des.monster();
  await des.monster();
  await des.monster();
  await des.monster();
  await des.object("long sword", place[3]);
  await des.trap({ coord: place[3] });
  await des.object("lock pick", place[0]);
  await des.trap({ coord: place[0] });
  await des.object("elven cloak", place[1]);
  await des.trap({ coord: place[1] });
  await des.object("blindfold", place[2]);
  await des.trap({ coord: place[2] });
  await des.non_diggable(selection.area(0, 0, 18, 12));
}
