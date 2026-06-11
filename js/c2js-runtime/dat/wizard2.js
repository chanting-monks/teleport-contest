// wizard2.js — AUTO-GENERATED from
// nethack-c/upstream/dat/wizard2.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, selection }) {
  await des.level_init({ style: "mazegrid", bg: "-" });
  await des.level_flags("mazelevel", "noteleport", "hardfloor");
  let tmpbounds = selection.match("-");
  let bnds = tmpbounds.bounds();
  let bounds2 = selection.fillrect(bnds.lx, bnds.ly + 1, bnds.hx - 2, bnds.hy - 1);
  let wiz2 = des.map({ halign: "center", valign: "center", map: "----------------------------x\n|.....|.S....|.............|x\n|.....|.-------S--------S--|x\n|.....|.|.........|........|x\n|..-S--S|.........|........|x\n|..|....|.........|------S-|x\n|..|....|.........|.....|..|x\n|-S-----|.........|.....|..|x\n|.......|.........|S--S--..|x\n|.......|.........|.|......|x\n|-----S----S-------.|......|x\n|............|....S.|......|x\n----------------------------x\n", contents: (async (rm) => {
      await des.levregion({ type: "stair-up", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.levregion({ type: "stair-down", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.levregion({ type: "branch", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.teleport_region({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 27, 12] });
      await des.region({ region: [1, 1, 26, 11], lit: 0, type: "ordinary", arrival_room: true });
      await des.region({ region: [9, 3, 17, 9], lit: 0, type: "zoo", filled: 1 });
      await des.door("closed", 15, 2);
      await des.door("closed", 11, 10);
      await des.mazewalk(28, 5, "east");
      await des.ladder("up", 12, 1);
      await des.ladder("down", 14, 11);
      await des.non_diggable(selection.area(0, 0, 27, 12));
      await des.non_passwall(selection.area(0, 0, 27, 12));
      await des.trap("spiked pit");
      await des.trap("sleep gas");
      await des.trap("anti magic");
      await des.trap("magic");
      await des.object("!");
      await des.object("!");
      await des.object("?");
      await des.object("?");
      await des.object("+");
      await des.object("\"", 4, 6);
    }) });
  let protected_ = __lua_bor(bounds2.negate(), wiz2);
  await globalThis.hell_tweaks(protected_);
}
