// Pri-goal.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Pri-goal.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel");
  await des.level_init({ style: "mines", fg: "L", bg: ".", smoothed: false, joined: false, lit: 0, walled: false });
  await des.map("xxxxxx..xxxxxx...xxxxxxxxx\nxxxx......xx......xxxxxxxx\nxx.xx.............xxxxxxxx\nx....................xxxxx\n......................xxxx\n......................xxxx\nxx........................\nxxx......................x\nxxx................xxxxxxx\nxxxx.....x.xx.......xxxxxx\nxxxxx...xxxxxx....xxxxxxxx\n");
  let place = [[14, 4], [13, 7]];
  let placeidx = math.random(1, place.length);
  await des.region(selection.area(0, 0, 25, 10), "unlit");
  await des.stair("up", 20, 5);
  await des.object({ id: "helm of brilliance", coord: place[(placeidx) - 1], buc: "blessed", spe: 0, eroded: -1, name: "The Mitre of Holiness" });
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
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("fire");
  await des.trap();
  await des.trap();
  await des.monster("Nalzok", place[(placeidx) - 1]);
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("human zombie");
  await des.monster("Z");
  await des.monster("Z");
  await des.monster("wraith");
  await des.monster("wraith");
  await des.monster("wraith");
  await des.monster("wraith");
  await des.monster("wraith");
  await des.monster("wraith");
  await des.monster("wraith");
  await des.monster("wraith");
  await des.monster("W");
}
