// fakewiz1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/fakewiz1.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, selection }) {
  await des.level_init({ style: "mazegrid", bg: "-" });
  await des.level_flags("mazelevel");
  let tmpbounds = selection.match("-");
  let bnds = tmpbounds.bounds();
  let bounds2 = selection.fillrect(bnds.lx, bnds.ly + 1, bnds.hx - 2, bnds.hy - 1);
  let fakewiz1 = des.map({ halign: "center", valign: "center", map: ".........\n.}}}}}}}.\n.}}---}}.\n.}--.--}.\n.}|...|}.\n.}--.--}.\n.}}---}}.\n.}}}}}}}.\n.........\n", contents: (async (rm) => {
      await des.levregion({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 8, 8], type: "stair-up" });
      await des.levregion({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 8, 8], type: "stair-down" });
      await des.levregion({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 8, 8], type: "branch" });
      await des.teleport_region({ region: [1, 0, 79, 20], region_islev: 1, exclude: [2, 2, 6, 6] });
      await des.levregion({ region: [4, 4, 4, 4], type: "portal", name: "wizard3" });
      await des.mazewalk(8, 5, "east");
      await des.region({ region: [4, 3, 6, 6], lit: 0, type: "ordinary", irregular: 1, arrival_room: true });
      await des.monster("L", 4, 4);
      await des.monster("vampire lord", 3, 4);
      await des.monster("kraken", 6, 6);
      await des.trap("board", 4, 3);
      await des.trap("board", 4, 5);
      await des.trap("board", 3, 4);
      await des.trap("board", 5, 4);
    }) });
  let protected_ = __lua_bor(bounds2.negate(), fakewiz1);
  globalThis.hell_tweaks(protected_);
}
