// bigrm-4.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-4.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noflip");
  await des.map("-----------                                                     -----------\n|.........|                                                     |.........|\n|.........-------------                             -------------.........|\n---...................------------       ------------...................---\n  --.............................---------.............................--  \n   --.................................................................--   \n    --...............................................................--    \n     --......LLLLL.......................................LLLLL......--     \n      --.....LLLLL.......................................LLLLL.....--      \n      --.....LLLLL.......................................LLLLL.....--      \n     --......LLLLL.......................................LLLLL......--     \n    --...............................................................--    \n   --.................................................................--   \n  --.............................---------.............................--  \n---...................------------       ------------...................---\n|.........-------------                             -------------.........|\n|.........|                                                     |.........|\n-----------                                                     -----------\n");
  let terrains = [".", ".", ".", ".", "P", "L", "-", "T", "W", "Z"];
  let tidx = math.random(1, terrains.length);
  let toterr = terrains[(tidx) - 1];
  if ((toterr != "L")) {
      await des.replace_terrain({ fromterrain: "L", toterrain: toterr });
    }
  await des.feature("fountain", 5, 2);
  await des.feature("fountain", 5, 15);
  await des.feature("fountain", 69, 2);
  await des.feature("fountain", 69, 15);
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
