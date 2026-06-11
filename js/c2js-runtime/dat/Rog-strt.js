// Rog-strt.js — AUTO-GENERATED from
// nethack-c/upstream/dat/Rog-strt.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ d, des, math, selection, shuffle }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("mazelevel", "noteleport", "hardfloor", "nommap");
  await des.map("---------------------------------.------------------------------------------\n|.....|.||..........|....|......|.|.........|.......+............---.......|\n|.....|..+..........+....---....S.|...-S-----.-----.|............+.+.......|\n|.....+.||........---......|....|.|...|.....|.|...|.---.....------.--------|\n|-----|.-------|..|........------.-----.....|.--..|...-------..............|\n|.....|........------+------..........+.....|..--S---.........------.-----..\n|.....|.------...............-----.}}.--------.|....-------.---....|.+...--|\n|..-+--.|....|-----.--------.|...|.....+.....|.|....|.....+.+......|.--....|\n|..|....|....|....+.|......|.|...-----.|.....|.--...|.....|.|......|..|....|\n|..|.-----S----...|.+....-----...|...|.----..|..|.---....--.---S-----.|----|\n|..|.|........|...------.|.S.....|...|....-----.+.|......|..|.......|.|....|\n|---.-------..|...|....|.|.|.....|...----.|...|.|---.....|.|-.......|.---..|\n...........|..S...|....---.----S----..|...|...+.|..-------.---+-....|...--+|\n|---------.---------...|......|....S..|.---...|.|..|...........----.---....|\n|........|.........|...+.------....|---.---...|.--+-.----.----....|.+...--+|\n|........|.---+---.|----.--........|......-----......|..|..|.--+-.|.-S-.|..|\n|........|.|.....|........----------.----.......---.--..|-.|....|.-----.|..|\n|----....+.|.....----+---............|..|--------.+.|...SS.|....|.......|..|\n|...--+-----.....|......|.------------............---...||.------+--+----..|\n|..........S.....|......|.|..........S............|.....||...|.....|....|..|\n-------------------------.--------------------------------------------------\n");
  let streets = selection.floodfill(0, 12);
  let place = [[33, 0], [0, 12], [25, 20], [75, 5]];
  await shuffle(place);
  await des.stair({ dir: "down", coord: place[0] });
  await des.monster({ id: "giant mimic", coord: place[1], appear_as: "ter:staircase down" });
  await des.monster({ id: "large mimic", coord: place[2], appear_as: "ter:staircase down" });
  await des.monster({ id: "small mimic", coord: place[3], appear_as: "ter:staircase down" });
  await des.levregion({ region: [19, 9, 19, 9], type: "branch" });
  await des.door("locked", 32, 2);
  await des.door("locked", 63, 9);
  await des.door("locked", 27, 10);
  await des.door("locked", 31, 12);
  await des.door("locked", 35, 13);
  await des.door("locked", 69, 15);
  await des.door("locked", 56, 17);
  await des.door("locked", 57, 17);
  await des.door("locked", 11, 19);
  await des.door("locked", 37, 19);
  await des.door("locked", 39, 2);
  await des.door("locked", 49, 5);
  await des.door("locked", 10, 9);
  await des.door("locked", 14, 12);
  await des.door("closed", 52, 1);
  await des.door("closed", 9, 2);
  await des.door("closed", 20, 2);
  await des.door("closed", 65, 2);
  await des.door("closed", 67, 2);
  await des.door("closed", 6, 3);
  await des.door("closed", 21, 5);
  await des.door("closed", 38, 5);
  await des.door("closed", 69, 6);
  await des.door("closed", 4, 7);
  await des.door("closed", 39, 7);
  await des.door("closed", 58, 7);
  await des.door("closed", 60, 7);
  await des.door("closed", 18, 8);
  await des.door("closed", 20, 9);
  await des.door("closed", 48, 10);
  await des.door("closed", 46, 12);
  await des.door("closed", 62, 12);
  await des.door("closed", 74, 12);
  await des.door("closed", 23, 14);
  await des.door("closed", 23, 14);
  await des.door("closed", 50, 14);
  await des.door("closed", 68, 14);
  await des.door("closed", 74, 14);
  await des.door("closed", 14, 15);
  await des.door("closed", 63, 15);
  await des.door("closed", 9, 17);
  await des.door("closed", 21, 17);
  await des.door("closed", 50, 17);
  await des.door("closed", 6, 18);
  await des.door("closed", 65, 18);
  await des.door("closed", 68, 18);
  await des.monster({ id: "Master of Thieves", coord: [36, 11], inventory: (async () => {
      await des.object({ id: "leather armor", spe: 5 });
      await des.object({ id: "silver dagger", spe: 4 });
      await des.object({ id: "dagger", spe: 2, quantity: d(2, 4), buc: "not-cursed" });
    }) });
  await des.object("chest", 36, 11);
  await des.monster("thug", 28, 10);
  await des.monster("thug", 29, 11);
  await des.monster("thug", 30, 9);
  await des.monster("thug", 31, 7);
  await des.monster("thug", 31, 13);
  await des.monster("thug", 33, 14);
  await des.monster("thug", 30, 15);
  await des.monster("thug", 35, 9);
  await des.monster("thug", 36, 13);
  await des.non_diggable(selection.area(0, 0, 75, 20));
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.trap();
  await des.monster({ id: "leprechaun", x: 1, y: 12, peaceful: 0 });
  await des.monster({ id: "water nymph", x: 2, y: 12, peaceful: 0 });
  await des.monster({ id: "water nymph", x: 33, y: 1, peaceful: 0 });
  await des.monster({ id: "leprechaun", x: 33, y: 2, peaceful: 0 });
  await des.monster({ id: "water nymph", x: 74, y: 5, peaceful: 0 });
  await des.monster({ id: "leprechaun", x: 74, y: 4, peaceful: 0 });
  await des.monster({ id: "leprechaun", x: 25, y: 19, peaceful: 0 });
  await des.monster({ id: "water nymph", x: 25, y: 18, peaceful: 0 });
  {
      const __hi = math.random(4, 7);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster({ id: "water nymph", coord: streets.rndcoord(1), peaceful: 0 });
        await des.monster({ id: "leprechaun", coord: streets.rndcoord(1), peaceful: 0 });
      }
    }
  {
      const __hi = math.random(7, 10);
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster({ id: "chameleon", coord: streets.rndcoord(1), peaceful: 0 });
      }
    }
}
