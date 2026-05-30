// wizard1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/wizard1.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, math, selection }) {
  await des.level_init({ style: "mazegrid", bg: "-" });
  await des.level_flags("mazelevel", "noteleport", "hardfloor");
  let tmpbounds = selection.match("-");
  let bnds = tmpbounds.bounds();
  let bounds2 = selection.fillrect(bnds.lx, bnds.ly + 1, bnds.hx - 2, bnds.hy - 1);
  let wiz1 = des.map({ halign: "center", valign: "center", map: "----------------------------x\n|.......|..|.........|.....|x\n|.......S..|.}}}}}}}.|.....|x\n|..--S--|..|.}}---}}.|---S-|x\n|..|....|..|.}--.--}.|..|..|x\n|..|....|..|.}|...|}.|..|..|x\n|..--------|.}--.--}.|..|..|x\n|..|.......|.}}---}}.|..|..|x\n|..S.......|.}}}}}}}.|..|..|x\n|..|.......|.........|..|..|x\n|..|.......|-----------S-S-|x\n|..|.......S...............|x\n----------------------------x\n", contents: (async (rm) => {
      await des.levregion({ type: "stair-up", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.levregion({ type: "stair-down", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.levregion({ type: "branch", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.teleport_region({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 27, 12] });
      await des.region({ region: [12, 1, 20, 9], lit: 0, type: "morgue", filled: 2, contents: (async () => {
          let sdwall = ["south", "west", "east"];
          await des.door({ wall: sdwall[(math.random(1, sdwall.length)) - 1], state: "secret" });
        }) });
      await des.region({ region: [1, 1, 10, 11], lit: 0, type: "ordinary", arrival_room: true });
      await des.mazewalk(28, 5, "east");
      await des.ladder("down", 6, 5);
      await des.non_diggable(selection.area(0, 0, 11, 12));
      await des.non_diggable(selection.area(11, 0, 21, 0));
      await des.non_diggable(selection.area(11, 10, 27, 12));
      await des.non_diggable(selection.area(21, 0, 27, 10));
      await des.non_passwall(selection.area(0, 0, 11, 12));
      await des.non_passwall(selection.area(11, 0, 21, 0));
      await des.non_passwall(selection.area(11, 10, 27, 12));
      await des.non_passwall(selection.area(21, 0, 27, 10));
      await des.monster({ id: "Wizard of Yendor", x: 16, y: 5, asleep: 1 });
      await des.monster("hell hound", 15, 5);
      await des.monster("vampire lord", 17, 5);
      await des.object("Book of the Dead", 16, 5);
      await des.monster("kraken", 14, 2);
      await des.monster("giant eel", 17, 2);
      await des.monster("kraken", 13, 4);
      await des.monster("giant eel", 13, 6);
      await des.monster("kraken", 19, 4);
      await des.monster("giant eel", 19, 6);
      await des.monster("kraken", 15, 8);
      await des.monster("giant eel", 17, 8);
      await des.monster("piranha", 15, 2);
      await des.monster("piranha", 19, 8);
      await des.monster("D");
      await des.monster("H");
      await des.monster("&");
      await des.monster("&");
      await des.monster("&");
      await des.monster("&");
      await des.trap("board", 16, 4);
      await des.trap("board", 16, 6);
      await des.trap("board", 15, 5);
      await des.trap("board", 17, 5);
      await des.trap("spiked pit");
      await des.trap("sleep gas");
      await des.trap("anti magic");
      await des.trap("magic");
      await des.object("ruby");
      await des.object("!");
      await des.object("!");
      await des.object("?");
      await des.object("?");
      await des.object("+");
      await des.object("+");
      await des.object("+");
    }) });
  let protected_ = __lua_bor(bounds2.negate(), wiz1);
  globalThis.hell_tweaks(protected_);
}
