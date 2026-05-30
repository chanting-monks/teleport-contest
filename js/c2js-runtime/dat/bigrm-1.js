// bigrm-1.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-1.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, math, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noflip");
  await des.map("---------------------------------------------------------------------------\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n---------------------------------------------------------------------------\n");
  if (percent(80)) {
      let terrains = ["-", "F", "L", "T", "C"];
      let tidx = math.random(1, terrains.length);
      let choice = math.random(0, 5);
      if (choice == 0) {
          await des.terrain(selection.line(10, 8, 65, 8), terrains[(tidx) - 1]);
        }
    else if (choice == 1) {
          let sel = __lua_bor(selection.line(15, 4, 15, 13), selection.line(59, 4, 59, 13));
          await des.terrain(sel, terrains[(tidx) - 1]);
        }
    else if (choice == 2) {
          let sel = __lua_bor(selection.line(10, 8, 64, 8), selection.line(37, 3, 37, 14));
          await des.terrain(sel, terrains[(tidx) - 1]);
        }
    else if (choice == 3) {
          await des.terrain(selection.rect(4, 4, 70, 13), terrains[(tidx) - 1]);
          let sel = __lua_bor(selection.line(25, 4, 50, 4), selection.line(25, 13, 50, 13));
          await des.terrain(sel, ".");
        }
    else if (choice == 4) {
          await des.terrain(selection.fillrect(5, 5, 69, 12), terrains[(tidx) - 1]);
          {
              const __hi = 7;
              const __step = 1;
              for (let i = 0; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                let x = 6 + i * 8;
                let y = 5 + (i % 2);
                await des.terrain(selection.fillrect(x, y, x + 6, y + 6), ".");
              }
            }
        } else {
        }
    }
  await des.region(selection.area(1, 1, 73, 16), "lit");
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
