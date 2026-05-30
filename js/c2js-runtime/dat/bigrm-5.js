// bigrm-5.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-5.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noflip");
  await des.map("                            ------------------                            \n                    ---------................---------                    \n              -------................................-------              \n         ------............................................------         \n      ----......................................................----      \n    ---............................................................---    \n  ---................................................................---  \n---....................................................................---\n|........................................................................|\n|........................................................................|\n|........................................................................|\n---....................................................................---\n  ---................................................................---  \n    ---............................................................---    \n      ----......................................................----      \n         ------............................................------         \n              -------................................-------              \n                    ---------................---------                    \n                            ------------------                            \n");
  if (percent(25)) {
      let sel = selection.match(".").percentage(2).grow();
      await des.replace_terrain({ selection: sel, fromterrain: ".", toterrain: percent(50) && "I" || "C" });
    }
  await des.region(selection.area(0, 0, 72, 18), "lit");
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
