// bigrm-9.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-9.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noflip");
  await des.map("}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}................}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}................................}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}............................................}}}}}}}}}}}}}}}\n}}}}}}}}}}......................................................}}}}}}}}}}\n}}}}}}}............................................................}}}}}}}\n}}}}}.......................LLLLLLLLLLLLLLLLLL.......................}}}}}\n}}}....................LLLLLLLLLLLLLLLLLLLLLLLLLLL.....................}}}\n}....................LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL....................}\n}....................LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL....................}\n}....................LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL....................}\n}}}....................LLLLLLLLLLLLLLLLLLLLLLLLLLL.....................}}}\n}}}}}.......................LLLLLLLLLLLLLLLLLL.......................}}}}}\n}}}}}}}............................................................}}}}}}}\n}}}}}}}}}}......................................................}}}}}}}}}}\n}}}}}}}}}}}}}}}............................................}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}................................}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}................}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n");
  await des.region(selection.area(0, 0, 73, 18), "unlit");
  await des.region(selection.area(26, 4, 47, 14), "lit");
  await des.region(selection.area(21, 5, 51, 13), "lit");
  await des.region(selection.area(19, 6, 54, 12), "lit");
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
