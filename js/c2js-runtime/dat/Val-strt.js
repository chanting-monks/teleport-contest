// Val-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Val-strt.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, selection }) {
  await des.level_flags("mazelevel", "noteleport", "hardfloor", "icedpools");
  await des.level_init({ style: "solidfill", fg: "I" });
  let pools = selection.new();
  {
      const __hi = 13;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        pools.set();
      }
    }
  pools = __lua_bor(pools, selection.grow(selection.set(selection.new()), "west"));
  pools = __lua_bor(pools, selection.grow(selection.set(selection.new()), "north"));
  pools = __lua_bor(pools, selection.grow(selection.set(selection.new()), "random"));
  await des.terrain(pools.clone().grow("all"), "P");
  await des.terrain(pools, "L");
  await des.map("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nxxxxxxxxxxxxxxxxx..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...xxxxxxxxxxxxxxxxxxxxx\nxxxxxxxxxxxxxxxx..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..{..xxxxxxxxxxxxxxxxxxxx\nxxxxxxxxxxxxxxx..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.....xxxxxxxxxxxxxxxxxxx\nxxxxxxxxxxxxxx..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxx\nxxxxxxxxxxxxx..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxx\nxxxxxxxxxxxx..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..xxxxxxxxxxxxxxxxxxx\nxxxxxxxx.....xxxxxxxxxxxxx|----------------|xxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxx\nxxxxxxx..xxx...xxxxxxxxxxx|................|xxxxxxxxxx..xxxxxxxxxxxxxxxxxxxx\nxxxxxx..xxxxxx......xxxxx.|................|.xxxxxxxxx.xxxxxxxxxxxxxxxxxxxxx\nxxxxx..xxxxxxxxxxxx.......+................+...xxxxxxx.xxxxxxxxxxxxxxxxxxxxx\nxxxx..xxxxxxxxx.....xxxxx.|................|.x...xxxxx.xxxxxxxxxxxxxxxxxxxxx\nxxx..xxxxxxxxx..xxxxxxxxxx|................|xxxx.......xxxxxxxxxxxxxxxxxxxxx\nxxxx..xxxxxxx..xxxxxxxxxxx|----------------|xxxxxxxxxx...xxxxxxxxxxxxxxxxxxx\nxxxxxx..xxxx..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...xxxxxxxxxxxxxxxxx\nxxxxxxx......xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...xxxxxxxxxxxxxxx\nxxxxxxxxx...xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...x......xxxxxx\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.........xxxxx\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.......xxxxxx\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n");
  await des.region(selection.area(0, 0, 75, 19), "lit");
  await des.levregion({ region: [66, 17, 66, 17], type: "branch" });
  await des.stair("down", 18, 1);
  await des.feature("fountain", 53, 2);
  await des.door("locked", 26, 10);
  await des.door("locked", 43, 10);
  await des.monster({ id: "Norn", coord: [35, 10], inventory: (async () => {
      await des.object({ id: "banded mail", spe: 5 });
      await des.object({ id: "long sword", spe: 4 });
    }) });
  await des.object("chest", 36, 10);
  await des.monster("warrior", 27, 8);
  await des.monster("warrior", 27, 9);
  await des.monster("warrior", 27, 11);
  await des.monster("warrior", 27, 12);
  await des.monster("warrior", 42, 8);
  await des.monster("warrior", 42, 9);
  await des.monster("warrior", 42, 11);
  await des.monster("warrior", 42, 12);
  await des.non_diggable(selection.area(26, 7, 43, 13));
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("fire");
  await des.trap("fire");
  await des.monster("fire ant", 4, 12);
  await des.monster("fire ant", 8, 8);
  await des.monster("fire ant", 14, 4);
  await des.monster("fire ant", 17, 11);
  await des.monster("fire ant", 24, 10);
  await des.monster("fire ant", 45, 10);
  await des.monster("fire ant", 54, 2);
  await des.monster("fire ant", 55, 7);
  await des.monster("fire ant", 58, 14);
  await des.monster("fire ant", 63, 17);
  await des.monster({ id: "fire giant", x: 18, y: 1, peaceful: 0 });
  await des.monster({ id: "fire giant", x: 10, y: 16, peaceful: 0 });
}
