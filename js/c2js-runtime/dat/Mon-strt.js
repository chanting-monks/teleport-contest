// Mon-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Mon-strt.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport", "hardfloor");
  await des.map("............................................................................\n............................................................................\n............................................................................\n....................------------------------------------....................\n....................|................|.....|.....|.....|....................\n....................|..------------..|--+-----+-----+--|....................\n....................|..|..........|..|.................|....................\n....................|..|..........|..|+---+---+-----+--|....................\n..................---..|..........|......|...|...|.....|....................\n..................+....|..........+......|...|...|.....|....................\n..................+....|..........+......|...|...|.....|....................\n..................---..|..........|......|...|...|.....|....................\n....................|..|..........|..|+-----+---+---+--|....................\n....................|..|..........|..|.................|....................\n....................|..------------..|--+-----+-----+--|....................\n....................|................|.....|.....|.....|....................\n....................------------------------------------....................\n............................................................................\n............................................................................\n............................................................................\n");
  await des.region(selection.area(0, 0, 75, 19), "lit");
  await des.region({ region: [24, 6, 33, 13], lit: 1, type: "temple" });
  await des.replace_terrain({ region: [0, 0, 10, 19], fromterrain: ".", toterrain: "T", chance: 10 });
  await des.replace_terrain({ region: [65, 0, 75, 19], fromterrain: ".", toterrain: "T", chance: 10 });
  let spacelocs = selection.floodfill(5, 4);
  await des.terrain([5, 4], ".");
  await des.levregion({ region: [5, 4, 5, 4], type: "branch" });
  await des.stair("down", 52, 9);
  await des.door("locked", 18, 9);
  await des.door("locked", 18, 10);
  await des.door("closed", 34, 9);
  await des.door("closed", 34, 10);
  await des.door("closed", 40, 5);
  await des.door("closed", 46, 5);
  await des.door("closed", 52, 5);
  await des.door("locked", 38, 7);
  await des.door("closed", 42, 7);
  await des.door("closed", 46, 7);
  await des.door("closed", 52, 7);
  await des.door("locked", 38, 12);
  await des.door("closed", 44, 12);
  await des.door("closed", 48, 12);
  await des.door("closed", 52, 12);
  await des.door("closed", 40, 14);
  await des.door("closed", 46, 14);
  await des.door("closed", 52, 14);
  await des.altar({ x: 28, y: 9, align: "noalign", type: "altar" });
  await des.monster({ id: "Grand Master", coord: [28, 10], inventory: (async () => {
      await des.object({ id: "robe", spe: 6 });
    }) });
  await des.monster("abbot", 32, 7);
  await des.monster("abbot", 32, 8);
  await des.monster("abbot", 32, 11);
  await des.monster("abbot", 32, 12);
  await des.monster("abbot", 33, 7);
  await des.monster("abbot", 33, 8);
  await des.monster("abbot", 33, 11);
  await des.monster("abbot", 33, 12);
  await des.non_diggable(selection.area(18, 3, 55, 16));
  {
      const __hi = 2;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.trap("dart", spacelocs.rndcoord(1));
      }
    }
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  {
      const __hi = 8;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster("earth elemental", spacelocs.rndcoord(1));
      }
    }
  {
      const __hi = 4;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster("xorn", spacelocs.rndcoord(1));
      }
    }
  await des.object({ id: "tin", coord: [29, 9], quantity: 2, montype: "spinach" });
  await des.object({ id: "food ration", coord: [46, 4], quantity: 4 });
}
