// asmodeus.js — AUTO-GENERATED from
// nethack-c/upstream/dat/asmodeus.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, selection }) {
  await des.level_init({ style: "mazegrid", bg: "-" });
  await des.level_flags("mazelevel");
  let tmpbounds = selection.match("-");
  let bnds = tmpbounds.bounds();
  let bounds2 = selection.fillrect(bnds.lx, bnds.ly + 1, bnds.hx - 2, bnds.hy - 1);
  let asmo1 = des.map({ halign: "half-left", valign: "center", map: "---------------------\n|.............|.....|\n|.............S.....|\n|---+------------...|\n|.....|.........|-+--\n|..---|.........|....\n|..|..S.........|....\n|..|..|.........|....\n|..|..|.........|-+--\n|..|..-----------...|\n|..S..........|.....|\n---------------------\n", contents: (async (rm) => {
      await des.door("closed", 4, 3);
      await des.door("locked", 18, 4);
      await des.door("closed", 18, 8);
      await des.stair("down", 13, 7);
      await des.non_diggable(selection.area(0, 0, 20, 11));
      await des.region(selection.area(1, 1, 20, 10), "unlit");
      await des.monster("Asmodeus", 12, 7);
      await des.object("[");
      await des.object("[");
      await des.object(")");
      await des.object(")");
      await des.object("*");
      await des.object("!");
      await des.object("!");
      await des.object("?");
      await des.object("?");
      await des.object("?");
      await des.trap("spiked pit", 5, 2);
      await des.trap("fire", 8, 6);
      await des.trap("sleep gas");
      await des.trap("anti magic");
      await des.trap("fire");
      await des.trap("magic");
      await des.trap("magic");
      await des.monster("ghost", 11, 7);
      await des.monster("horned devil", 10, 5);
      await des.monster("L");
      await des.monster("V");
      await des.monster("V");
      await des.monster("V");
    }) });
  await des.levregion({ region: [1, 0, 6, 20], region_islev: 1, exclude: [6, 1, 70, 16], exclude_islev: 1, type: "stair-up" });
  await des.levregion({ region: [1, 0, 6, 20], region_islev: 1, exclude: [6, 1, 70, 16], exclude_islev: 1, type: "branch" });
  await des.teleport_region({ region: [1, 0, 6, 20], region_islev: 1, exclude: [6, 1, 70, 16], exclude_islev: 1 });
  let asmo2 = des.map({ halign: "half-right", valign: "center", map: "---------------------------------\n................................|\n................................+\n................................|\n---------------------------------\n", contents: (async (rm) => {
      await des.mazewalk(32, 2, "east");
      await des.non_diggable(selection.area(0, 0, 32, 4));
      await des.door("closed", 32, 2);
      await des.monster("&");
      await des.monster("&");
      await des.monster("&");
      await des.trap("anti magic");
      await des.trap("fire");
      await des.trap("magic");
    }) });
  let protected_ = __lua_bor(__lua_bor(bounds2.negate(), asmo1), asmo2);
  globalThis.hell_tweaks(protected_);
}
