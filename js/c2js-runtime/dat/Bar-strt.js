// Bar-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Bar-strt.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_band, des, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport", "hardfloor");
  await des.map("..................................PP........................................\n...................................PP.......................................\n...................................PP.......................................\n....................................PP......................................\n........--------------......-----....PPP....................................\n........|...S........|......+...|...PPP.....................................\n........|----........|......|...|....PP.....................................\n........|.\\..........+......-----...........................................\n........|----........|...............PP.....................................\n........|...S........|...-----.......PPP....................................\n........--------------...+...|......PPPPP...................................\n.........................|...|.......PPP....................................\n...-----......-----......-----........PP....................................\n...|...+......|...+..--+--.............PP...................................\n...|...|......|...|..|...|..............PP..................................\n...-----......-----..|...|.............PPPP.................................\n.....................-----............PP..PP................................\n.....................................PP...PP................................\n....................................PP...PP.................................\n....................................PP....PP................................\n");
  await des.replace_terrain({ region: [37, 0, 59, 19], fromterrain: ".", toterrain: "T", chance: 5 });
  await des.replace_terrain({ region: [60, 0, 64, 19], fromterrain: ".", toterrain: "T", chance: 10 });
  await des.replace_terrain({ region: [65, 0, 75, 19], fromterrain: ".", toterrain: "T", chance: 20 });
  await des.terrain(selection.randline(selection.new(), 37, 7, 62, 2, 7), ".");
  await des.terrain([62, 2], ".");
  await des.region(selection.area(0, 0, 75, 19), "lit");
  await des.region(selection.area(9, 5, 11, 5), "unlit");
  await des.region(selection.area(9, 7, 11, 7), "lit");
  await des.region(selection.area(9, 9, 11, 9), "unlit");
  await des.region(selection.area(13, 5, 20, 9), "lit");
  await des.region(selection.area(29, 5, 31, 6), "lit");
  await des.region(selection.area(26, 10, 28, 11), "lit");
  await des.region(selection.area(4, 13, 6, 14), "lit");
  await des.region(selection.area(15, 13, 17, 14), "lit");
  await des.region(selection.area(22, 14, 24, 15), "lit");
  await des.stair("down", 9, 9);
  await des.levregion({ region: [62, 2, 62, 2], type: "branch" });
  await des.door("locked", 12, 5);
  await des.door("locked", 12, 9);
  await des.door("closed", 21, 7);
  await des.door("open", 7, 13);
  await des.door("open", 18, 13);
  await des.door("open", 23, 13);
  await des.door("open", 25, 10);
  await des.door("open", 28, 5);
  await des.monster({ id: "Pelias", coord: [10, 7], inventory: (async () => {
      await des.object({ id: "runesword", spe: 5 });
      await des.object({ id: "chain mail", spe: 5 });
    }) });
  await des.object("chest", 9, 5);
  await des.monster("chieftain", 10, 5);
  await des.monster("chieftain", 10, 9);
  await des.monster("chieftain", 11, 5);
  await des.monster("chieftain", 11, 9);
  await des.monster("chieftain", 14, 5);
  await des.monster("chieftain", 14, 9);
  await des.monster("chieftain", 16, 5);
  await des.monster("chieftain", 16, 9);
  await des.non_diggable(selection.area(0, 0, 75, 19));
  await des.trap("spiked pit", 37, 7);
  await des.monster("giant eel", 36, 1);
  await des.monster("giant eel", 37, 9);
  await des.monster("giant eel", 39, 15);
  let ogrelocs = __lua_band(selection.floodfill(37, 7), selection.area(40, 3, 45, 20));
  {
      const __hi = 11;
      const __step = 1;
      for (let i = 0; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster({ id: "ogre", coord: ogrelocs.rndcoord(1), peaceful: 0 });
      }
    }
}
