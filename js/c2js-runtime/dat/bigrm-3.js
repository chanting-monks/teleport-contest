// bigrm-3.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-3.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noflip");
  await des.map("---------------------------------------------------------------------------\n|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|..............---.......................................---..............|\n|...............|.........................................|...............|\n|.....|.|.|.|.|---|.|.|.|.|...................|.|.|.|.|.|---|.|.|.|.|.....|\n|.....|--------   --------|...................|----------   --------|.....|\n|.....|.|.|.|.|---|.|.|.|.|...................|.|.|.|.|.|---|.|.|.|.|.....|\n|...............|.........................................|...............|\n|..............---.......................................---..............|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.........................................................................|\n|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|\n---------------------------------------------------------------------------\n");
  await des.region(selection.area(1, 1, 73, 16), "lit");
  if (percent(66)) {
      let sel = selection.match("[.w.]");
      let terrains = ["F", "T", "W", "Z"];
      let choice = terrains[(math.random(1, terrains.length)) - 1];
      await des.terrain(sel, choice);
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
  await des.monster({ x: 1, y: 1 });
  await des.monster({ x: 13, y: 1 });
  await des.monster({ x: 25, y: 1 });
  await des.monster({ x: 37, y: 1 });
  await des.monster({ x: 49, y: 1 });
  await des.monster({ x: 61, y: 1 });
  await des.monster({ x: 73, y: 1 });
  await des.monster({ x: 7, y: 7 });
  await des.monster({ x: 13, y: 7 });
  await des.monster({ x: 25, y: 7 });
  await des.monster({ x: 37, y: 7 });
  await des.monster({ x: 49, y: 7 });
  await des.monster({ x: 61, y: 7 });
  await des.monster({ x: 67, y: 7 });
  await des.monster({ x: 7, y: 9 });
  await des.monster({ x: 13, y: 9 });
  await des.monster({ x: 25, y: 9 });
  await des.monster({ x: 37, y: 9 });
  await des.monster({ x: 49, y: 9 });
  await des.monster({ x: 61, y: 9 });
  await des.monster({ x: 67, y: 9 });
  await des.monster({ x: 1, y: 16 });
  await des.monster({ x: 13, y: 16 });
  await des.monster({ x: 25, y: 16 });
  await des.monster({ x: 37, y: 16 });
  await des.monster({ x: 49, y: 16 });
  await des.monster({ x: 61, y: 16 });
  await des.monster({ x: 73, y: 16 });
}
