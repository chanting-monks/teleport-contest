// minefill.js — AUTO-GENERATED from
// nethack-c/upstream/dat/minefill.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, percent }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noflip");
  await des.level_init({ style: "mines", fg: ".", bg: " ", smoothed: true, joined: true, walled: true });
  await des.stair("up");
  await des.stair("down");
  {
      const __hi = math.random(2, 5);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.object("*");
      }
    }
  await des.object("(");
  {
      const __hi = math.random(2, 4);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.object();
      }
    }
  if (percent(75)) {
      {
          const __hi = math.random(1, 2);
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            await des.object("boulder");
          }
        }
    }
  {
      const __hi = math.random(6, 8);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster("gnome");
      }
    }
  await des.monster("gnome lord");
  await des.monster("dwarf");
  await des.monster("dwarf");
  await des.monster("G");
  await des.monster("G");
  await des.monster(percent(50) && "h" || "G");
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
}
