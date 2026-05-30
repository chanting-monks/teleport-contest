// Kni-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Kni-strt.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, nh, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: "." });
  await des.level_flags("mazelevel", "noteleport", "hardfloor");
  await des.level_init({ style: "mines", fg: ".", bg: ".", smoothed: false, joined: false, lit: 1, walled: false });
  await des.map("..................................................\n.-----......................................-----.\n.|...|......................................|...|.\n.--|+-------------------++-------------------+|--.\n...|...................+..+...................|...\n...|.|-----------------|++|-----------------|.|...\n...|.|.................|..|.........|.......|.|...\n...|.|...\\.............+..+.........|.......|.|...\n...|.|.................+..+.........+.......|.|...\n...|.|.................|..|.........|.......|.|...\n...|.|--------------------------------------|.|...\n...|..........................................|...\n.--|+----------------------------------------+|--.\n.|...|......................................|...|.\n.-----......................................-----.\n..................................................\n");
  await des.region(selection.area(0, 0, 49, 15), "lit");
  await des.region(selection.area(4, 4, 45, 11), "unlit");
  await des.region({ region: [6, 6, 22, 9], lit: 1, type: "throne", filled: 2 });
  await des.region(selection.area(27, 6, 43, 9), "lit");
  await des.levregion({ region: [20, 14, 20, 14], type: "branch" });
  await des.stair("down", 40, 7);
  await des.door("locked", 24, 3);
  await des.door("locked", 25, 3);
  await des.door("closed", 23, 4);
  await des.door("closed", 26, 4);
  await des.door("locked", 24, 5);
  await des.door("locked", 25, 5);
  await des.door("closed", 23, 7);
  await des.door("closed", 26, 7);
  await des.door("closed", 23, 8);
  await des.door("closed", 26, 8);
  await des.door("closed", 36, 8);
  await des.door("closed", 4, 3);
  await des.door("closed", 45, 3);
  await des.door("closed", 4, 12);
  await des.door("closed", 45, 12);
  await des.monster({ id: "King Arthur", coord: [9, 7], inventory: (async () => {
      await des.object({ id: "long sword", spe: 4, buc: "blessed", name: "Excalibur" });
      await des.object({ id: "plate mail", spe: 4 });
    }) });
  await des.object("chest", 9, 7);
  await des.monster({ id: "knight", x: 4, y: 2, peaceful: 1 });
  await des.monster({ id: "knight", x: 4, y: 13, peaceful: 1 });
  await des.monster({ id: "knight", x: 45, y: 2, peaceful: 1 });
  await des.monster({ id: "knight", x: 45, y: 13, peaceful: 1 });
  await des.monster("page", 16, 6);
  await des.monster("page", 18, 6);
  await des.monster("page", 20, 6);
  await des.monster("page", 16, 9);
  await des.monster("page", 18, 9);
  await des.monster("page", 20, 9);
  await des.non_diggable(selection.area(0, 0, 49, 15));
  await des.trap("sleep gas", 24, 4);
  await des.trap("sleep gas", 25, 4);
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.monster({ id: "quasit", x: 14, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 16, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 18, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 20, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 22, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 24, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 26, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 28, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 30, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 32, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 34, y: 0, peaceful: 0 });
  await des.monster({ id: "quasit", x: 36, y: 0, peaceful: 0 });
  {
      const __hi = 2 + nh.rn2(3);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster({ id: "warhorse", peaceful: 1, inventory: (async () => {
          if (percent(50)) {
                      await des.object("saddle");
                    }
        }) });
      }
    }
}
