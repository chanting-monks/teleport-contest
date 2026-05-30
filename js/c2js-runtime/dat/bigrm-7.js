// bigrm-7.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-7.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel");
  await des.map("                                                        -----              \n                                                ---------...---            \n                                        ---------.........L...---          \n                                ---------.......................---        \n                        ---------.................................---      \n                ---------...........................................---    \n        ---------.....................................................---  \n---------...............................................................---\n|.........................................................................|\n|.L.....................................................................L.|\n|.........................................................................|\n---...............................................................---------\n  ---.....................................................---------        \n    ---...........................................---------                \n      ---.................................---------                        \n        ---.......................---------                                \n          ---...L.........---------                                        \n            ---...---------                                                \n              -----                                                        \n");
  let terrain = ["L", "T", "{", "."];
  let tidx = math.random(1, terrain.length);
  await des.replace_terrain({ region: [0, 0, 74, 18], fromterrain: "L", toterrain: terrain[(tidx) - 1] });
  await des.region(selection.area(1, 1, 73, 17), "lit");
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
