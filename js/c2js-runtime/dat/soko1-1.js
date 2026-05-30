// soko1-1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/soko1-1.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport", "premapped", "sokoban", "solidify");
  await des.map("--------------------------\n|........................|\n|.......|---------------.|\n-------.------         |.|\n |...........|         |.|\n |...........|         |.|\n--------.-----         |.|\n|............|         |.|\n|............|         |.|\n-----.--------   ------|.|\n |..........|  --|.....|.|\n |..........|  |.+.....|.|\n |.........|-  |-|.....|.|\n-------.----   |.+.....+.|\n|........|     |-|.....|--\n|........|     |.+.....|  \n|...|-----     --|.....|  \n-----            -------  \n");
  globalThis.place = selection.new();
  globalThis.place.set(16, 11);
  globalThis.place.set(16, 13);
  globalThis.place.set(16, 15);
  await des.stair("down", 1, 1);
  await des.region(selection.area(0, 0, 25, 17), "lit");
  await des.non_diggable(selection.area(0, 0, 25, 17));
  await des.non_passwall(selection.area(0, 0, 25, 17));
  await des.object("boulder", 3, 5);
  await des.object("boulder", 5, 5);
  await des.object("boulder", 7, 5);
  await des.object("boulder", 9, 5);
  await des.object("boulder", 11, 5);
  await des.object("boulder", 4, 7);
  await des.object("boulder", 4, 8);
  await des.object("boulder", 6, 7);
  await des.object("boulder", 9, 7);
  await des.object("boulder", 11, 7);
  await des.object("boulder", 3, 12);
  await des.object("boulder", 4, 10);
  await des.object("boulder", 5, 12);
  await des.object("boulder", 6, 10);
  await des.object("boulder", 7, 11);
  await des.object("boulder", 8, 10);
  await des.object("boulder", 9, 12);
  await des.object("boulder", 3, 14);
  await des.exclusion({ type: "monster-generation", region: [7, 1, 23, 1] });
  await des.trap("hole", 7, 1);
  await des.trap("rolling boulder", 8, 1);
  await des.trap("hole", 9, 1);
  await des.trap("hole", 10, 1);
  await des.trap("hole", 11, 1);
  await des.trap("hole", 12, 1);
  await des.trap("hole", 13, 1);
  await des.trap("hole", 14, 1);
  await des.trap("hole", 15, 1);
  await des.trap("hole", 16, 1);
  await des.trap("hole", 17, 1);
  await des.trap("hole", 18, 1);
  await des.trap("hole", 19, 1);
  await des.trap("hole", 20, 1);
  await des.trap("hole", 21, 1);
  await des.trap("hole", 22, 1);
  await des.trap("hole", 23, 1);
  await des.monster({ id: "giant mimic", appear_as: "obj:boulder" });
  await des.monster({ id: "giant mimic", appear_as: "obj:boulder" });
  await des.object({ class: "%" });
  await des.object({ class: "%" });
  await des.object({ class: "%" });
  await des.object({ class: "%" });
  await des.object({ class: "=" });
  await des.object({ class: "/" });
  await des.door("locked", 23, 13);
  await des.door("closed", 17, 11);
  await des.door("closed", 17, 13);
  await des.door("closed", 17, 15);
  await des.region({ region: [18, 10, 22, 16], lit: 1, type: "zoo", filled: 1, irregular: 1 });
  let pt = selection.rndcoord(globalThis.place);
  if (percent(75)) {
      await des.object({ id: "bag of holding", coord: pt, buc: "not-cursed", achievement: 1 });
    } else {
      await des.object({ id: "amulet of reflection", coord: pt, buc: "not-cursed", achievement: 1 });
    }
  await des.engraving({ coord: pt, type: "burn", text: "Elbereth" });
  await des.object({ id: "scroll of scare monster", coord: pt, buc: "cursed" });
}
