// fakewiz2.js — AUTO-GENERATED from
// nethack-c/upstream/dat/fakewiz2.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, selection }) {
  await des.level_init({ style: "mazegrid", bg: "-" });
  await des.level_flags("mazelevel");
  let tmpbounds = selection.match("-");
  let bnds = tmpbounds.bounds();
  let bounds2 = selection.fillrect(bnds.lx, bnds.ly + 1, bnds.hx - 2, bnds.hy - 1);
  let fakewiz2 = des.map({ halign: "center", valign: "center", map: ".........\n.}}}}}}}.\n.}}---}}.\n.}--.--}.\n.}|...|}.\n.}--.--}.\n.}}---}}.\n.}}}}}}}.\n.........\n", contents: (async (rm) => {
      await des.levregion({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 8, 8], type: "stair-up" });
      await des.levregion({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 8, 8], type: "stair-down" });
      await des.levregion({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 8, 8], type: "branch" });
      await des.teleport_region({ region: [1, 0, 79, 20], region_islev: 1, exclude: [2, 2, 6, 6] });
      await des.mazewalk(8, 5, "east");
      await des.monster("L", 4, 4);
      await des.monster("vampire lord", 3, 4);
      await des.monster("kraken", 6, 6);
      await des.trap("board", 4, 3);
      await des.trap("board", 4, 5);
      await des.trap("board", 3, 4);
      await des.trap("board", 5, 4);
      await des.object("\"", 4, 4);
    }) });
  let protected_ = __lua_bor(bounds2.negate(), fakewiz2);
  await globalThis.hell_tweaks(protected_);
}
