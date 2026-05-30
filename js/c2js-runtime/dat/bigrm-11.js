// bigrm-11.js — AUTO-GENERATED from
// nethack-c/upstream/dat/bigrm-11.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_bor, des, nh, percent, selection }) {
  globalThis.t_or_f = () => {
      return percent(50) && true || false;
    };
  await des.level_flags("mazelevel", "noflip");
  await des.level_init({ style: "maze", corrwid: 3 + nh.rn2(3), wallthick: 1, deadends: t_or_f() });
  await des.region(selection.area(0, 0, 75, 18), "lit");
  await des.non_diggable();
  globalThis.replace_wall_boulder = async (x, y) => {
      await des.terrain(x, y, ".");
      await des.object("boulder", x, y);
    };
  let sel = __lua_bor(selection.match(".w."), selection.match(".\nw\n."));
  sel.iterate(replace_wall_boulder);
  sel = selection.match(".w.");
  sel.iterate(replace_wall_boulder);
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
        await des.trap("rolling boulder");
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
