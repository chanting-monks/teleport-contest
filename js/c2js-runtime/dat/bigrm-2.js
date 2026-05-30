// bigrm-2.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-2.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, math, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noflip");
  await des.map("---------------------------------------------------------------------------\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n---------------------------------------------------------------------------\n");
  await des.region(selection.area(1, 1, 73, 16), "lit");
  let darkness;
  let choice = math.random(0, 3);
  if (choice == 0) {
      darkness = __lua_bor(__lua_bor(__lua_bor(selection.area(1, 7, 22, 9), selection.area(24, 1, 50, 5)), selection.area(24, 11, 50, 16)), selection.area(52, 7, 73, 9));
    }
  else if (choice == 1) {
      darkness = selection.area(24, 1, 50, 16);
    }
  else if (choice == 2) {
      darkness = __lua_bor(selection.area(1, 1, 22, 16), selection.area(52, 1, 73, 16));
    }
  if (darkness != null) {
      await des.region(darkness, "unlit");
      if (percent(25)) {
          await des.replace_terrain({ selection: darkness.grow(), fromterrain: ".", toterrain: "I" });
        }
    }
  await des.stair("up");
  await des.stair("down");
  await des.non_diggable();
  {
      const __hi = 15;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.object();
      }
    }
  {
      const __hi = 6;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.trap();
      }
    }
  {
      const __hi = 28;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster();
      }
    }
}
