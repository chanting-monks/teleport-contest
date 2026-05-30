// bigrm-10.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-10.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noflip");
  await des.map(".......................................................................\n.......................................................................\n.......................................................................\n.......................................................................\n...C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C...\n...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...\n...C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C...\n...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...\n...C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C...\n...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...\n...C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C...\n...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...\n...C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C...\n...CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC...\n...C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C C...\n.......................................................................\n.......................................................................\n.......................................................................\n.......................................................................\n");
  if (percent(40)) {
      let terrain = ["L", "}", "T", "-", "F"];
      let tidx = math.random(1, terrain.length);
      await des.replace_terrain({ region: [0, 0, 70, 18], fromterrain: "C", toterrain: ".", chance: 5 });
      await des.replace_terrain({ region: [0, 0, 70, 18], fromterrain: "C", toterrain: terrain[(tidx) - 1] });
    }
  await des.region(selection.area(0, 0, 70, 18), "lit");
  await des.teleport_region({ region: [0, 0, 70, 18], exclude: [2, 3, 68, 15], dir: "down" });
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
  await des.mazewalk({ x: 4, y: 2, dir: "south", stocked: 0 });
  await des.levregion({ region: [0, 0, 70, 18], exclude: [2, 3, 68, 15], type: "stair-up" });
  await des.stair("down");
}
