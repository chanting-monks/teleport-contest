// Val-goal.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Val-goal.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: "L" });
  await des.level_flags("mazelevel", "icedpools");
  await des.level_init({ style: "mines", fg: ".", bg: "L", smoothed: true, joined: true, lit: 1, walled: false });
  await des.map("xxxxxx.....................xxxxxxxx\nxxxxx.......LLLLL.LLLLL......xxxxxx\nxxxx......LLLLLLLLLLLLLLL......xxxx\nxxxx.....LLL|---------|LLL.....xxxx\nxxxx....LL|--.........--|LL.....xxx\nx......LL|-...LLLLLLL...-|LL.....xx\n.......LL|...LL.....LL...|LL......x\n......LL|-..LL.......LL..-|LL......\n......LL|.................|LL......\n......LL|-..LL.......LL..-|LL......\n.......LL|...LL.....LL...|LL.......\nxx.....LL|-...LLLLLLL...-|LL......x\nxxx.....LL|--.........--|LL.....xxx\nxxxx.....LLL|---------|LLL...xxxxxx\nxxxxx.....LLLLLLLLLLLLLLL...xxxxxxx\nxxxxxx......LLLLL.LLLLL.....xxxxxxx\nxxxxxxxxx..................xxxxxxxx\n");
  await des.region(selection.area(0, 0, 34, 16), "lit");
  await des.replace_terrain({ region: [44, 9, 46, 11], fromterrain: "L", toterrain: ".", chance: 50 });
  await des.stair("up", 45, 10);
  await des.non_diggable(selection.area(0, 0, 34, 16));
  await des.drawbridge({ x: 17, y: 2, dir: "south", state: "random" });
  if (percent(75)) {
      await des.drawbridge({ x: 17, y: 14, dir: "north", state: "open" });
    } else {
      await des.drawbridge({ x: 17, y: 14, dir: "north", state: "random" });
    }
  await des.object({ id: "crystal ball", x: 17, y: 8, buc: "blessed", spe: 5, name: "The Orb of Fate" });
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
  await des.trap("board", 13, 8);
  await des.trap("board", 21, 8);
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("board");
  await des.trap();
  await des.trap();
  await des.monster("Lord Surtur", 17, 8);
  await des.monster("fire ant");
  await des.monster("fire ant");
  await des.monster("fire ant");
  await des.monster("fire ant");
  await des.monster("a");
  await des.monster("a");
  await des.monster({ id: "fire giant", x: 10, y: 6, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 10, y: 7, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 10, y: 8, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 10, y: 9, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 10, y: 10, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 24, y: 6, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 24, y: 7, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 24, y: 8, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 24, y: 9, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 24, y: 10, peaceful: 0 });
  await des.monster({ id: "fire giant", peaceful: 0 });
  await des.monster({ id: "fire giant", peaceful: 0 });
  await des.monster({ class: "H", peaceful: 0 });
}
