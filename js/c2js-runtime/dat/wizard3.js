// wizard3.js — AUTO-GENERATED from
// nethack-c/upstream/dat/wizard3.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, percent, selection }) {
  await des.level_init({ style: "mazegrid", bg: "-" });
  await des.level_flags("mazelevel", "noteleport", "hardfloor");
  let tmpbounds = selection.match("-");
  let bnds = tmpbounds.bounds();
  let bounds2 = selection.fillrect(bnds.lx, bnds.ly + 1, bnds.hx - 2, bnds.hy - 1);
  let wiz3 = des.map({ halign: "center", valign: "center", map: "----------------------------x\n|..|............S..........|x\n|..|..------------------S--|x\n|..|..|.........|..........|x\n|..S..|.}}}}}}}.|..........|x\n|..|..|.}}---}}.|-S--------|x\n|..|..|.}--.--}.|..|.......|x\n|..|..|.}|...|}.|..|.......|x\n|..---|.}--.--}.|..|.......|x\n|.....|.}}---}}.|..|.......|x\n|.....S.}}}}}}}.|..|.......|x\n|.....|.........|..|.......|x\n----------------------------x\n", contents: (async (rm) => {
      await des.levregion({ type: "stair-up", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.levregion({ type: "stair-down", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.levregion({ type: "branch", region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 28, 12] });
      await des.teleport_region({ region: [1, 0, 79, 20], region_islev: 1, exclude: [0, 0, 27, 12] });
      await des.levregion({ region: [25, 11, 25, 11], type: "portal", name: "fakewiz1" });
      await des.mazewalk(28, 9, "east");
      await des.region({ region: [7, 3, 15, 11], lit: 0, type: "morgue", filled: 2 });
      await des.region({ region: [17, 6, 18, 11], lit: 0, type: "beehive", filled: 1 });
      await des.region({ region: [20, 6, 26, 11], lit: 0, type: "ordinary", arrival_room: true, contents: (async () => {
          let w = "north";
          if (percent(50)) {
                      w = "west";
                    }
          await des.door({ state: "secret", wall: w });
        }) });
      await des.door("closed", 18, 5);
      await des.ladder("up", 11, 7);
      await des.non_diggable(selection.area(0, 0, 6, 12));
      await des.non_diggable(selection.area(6, 0, 27, 2));
      await des.non_diggable(selection.area(16, 2, 27, 12));
      await des.non_diggable(selection.area(6, 12, 16, 12));
      await des.non_passwall(selection.area(0, 0, 6, 12));
      await des.non_passwall(selection.area(6, 0, 27, 2));
      await des.non_passwall(selection.area(16, 2, 27, 12));
      await des.non_passwall(selection.area(6, 12, 16, 12));
      await des.monster("L", 10, 7);
      await des.monster("vampire lord", 12, 7);
      await des.monster("kraken", 8, 5);
      await des.monster("giant eel", 8, 8);
      await des.monster("kraken", 14, 5);
      await des.monster("giant eel", 14, 8);
      await des.monster("L");
      await des.monster("D");
      await des.monster("D", 26, 9);
      await des.monster("&");
      await des.monster("&");
      await des.monster("&");
      await des.trap("board", 10, 7);
      await des.trap("board", 12, 7);
      await des.trap("board", 11, 6);
      await des.trap("board", 11, 8);
      await des.object(")");
      await des.object("!");
      await des.object("?");
      await des.object("?");
      await des.object("(");
      await des.object("\"", 11, 7);
    }) });
  let protected_ = __lua_bor(bounds2.negate(), wiz3);
  globalThis.hell_tweaks(protected_);
}
