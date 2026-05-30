// bigrm-12.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-12.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_flags("mazelevel", "noflipy");
  await des.level_init({ style: "solidfill", fg: " " });
  await des.map("                                                                           \n         .......................           .......................         \n        .........................         .........................        \n       ...........................       ...........................       \n      .............................     .............................      \n     ........PPPPPPPPPPPPPPP........   ........LLLLLLLLLLLLLLL........     \n    ........PPPPPPPPPPPPPPPPP........ ........LLLLLLLLLLLLLLLLL........    \n   ........PPPWWWWWWWWWWWWWPPP...............LLLZZZZZZZZZZZZZLLL........   \n  ........PPPWWWWWWWWWWWWWWWPPP.............LLLZZZZZZZZZZZZZZZLLL........  \n ........PPPWWWWWWWWWWWWWWWWWPPP...........LLLZZZZZZZZZZZZZZZZZLLL........ \n  ........PPPWWWWWWWWWWWWWWWPPP.............LLLZZZZZZZZZZZZZZZLLL........  \n   ........PPPWWWWWWWWWWWWWPPP...............LLLZZZZZZZZZZZZZLLL........   \n    ........PPPPPPPPPPPPPPPPP........ ........LLLLLLLLLLLLLLLLL........    \n     ........PPPPPPPPPPPPPPP........   ........LLLLLLLLLLLLLLL........     \n      .............................     .............................      \n       ...........................       ...........................       \n        .........................         .........................        \n         .......................           .......................         \n                                                                           \n");
  if (percent(20)) {
      if (percent(50)) {
          await des.replace_terrain({ fromterrain: "W", toterrain: "-" });
        }
      if (percent(50)) {
          await des.replace_terrain({ fromterrain: "Z", toterrain: "-" });
        }
    }
  if (percent(25)) {
      await des.replace_terrain({ fromterrain: "P", toterrain: "." });
      if (percent(75)) {
          await des.replace_terrain({ fromterrain: "W", toterrain: "P" });
        }
    }
  if (percent(25)) {
      await des.replace_terrain({ fromterrain: "L", toterrain: "." });
      if (percent(75)) {
          await des.replace_terrain({ fromterrain: "Z", toterrain: "L" });
        }
    }
  if (percent(20)) {
      if (percent(50)) {
          await des.replace_terrain({ fromterrain: "P", toterrain: "L" });
          await des.replace_terrain({ fromterrain: "W", toterrain: "Z" });
        } else {
          await des.replace_terrain({ fromterrain: "L", toterrain: "P" });
          await des.replace_terrain({ fromterrain: "Z", toterrain: "W" });
        }
    }
  await des.region(selection.area(0, 0, 75, 19), "lit");
  await des.non_diggable();
  await des.wallify();
  await des.stair("up");
  await des.stair("down");
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
