// medusa-3.js — AUTO-GENERATED from
// nethack-c/upstream/dat/medusa-3.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("noteleport", "mazelevel", "shortsighted");
  await des.map("}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}.}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}.}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}T..T.}}}}}}}}}}}}}}}}}}}}..}}}}}}}}.}}}...}}}}}}}.}}}}}......}}}}}}}\n}}}}}}.......T.}}}}}}}}}}}..}}}}..T.}}}}}}...T...T..}}...T..}}..-----..}}}}}\n}}}...-----....}}}}}}}}}}.T..}}}}}...}}}}}.....T..}}}}}......T..|...|.T..}}}\n}}}.T.|...|...T.}}}}}}}.T......}}}}..T..}}.}}}.}}...}}}}}.T.....+...|...}}}}\n}}}}..|...|.}}.}}}}}.....}}}T.}}}}.....}}}}}}.T}}}}}}}}}}}}}..T.|...|.}}}}}}\n}}}}}.|...|.}}}}}}..T..}}}}}}}}}}}}}T.}}}}}}}}..}}}}}}}}}}}.....-----.}}}}}}\n}}}}}.--+--..}}}}}}...}}}}}}}}}}}}}}}}}}}T.}}}}}}}}}}}}}}}}.T.}........}}}}}\n}}}}}.......}}}}}}..}}}}}}}}}.}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}.}}}.}}.T.}}}}}}\n}}.T...T...}}}}T}}}}}}}}}}}....}}}}}}}}}}T}}}}}.T}}...}}}}}}}}}}}}}}...}}}}}\n}}}...T}}}}}}}..}}}}}}}}}}}.T...}}}}}}}}.T.}.T.....T....}}}}}}}}}}}}}.}}}}}}\n}}}}}}}}}}}}}}}....}}}}}}}...}}.}}}}}}}}}}............T..}}}}}.T.}}}}}}}}}}}\n}}}}}}}}}}}}}}}}..T..}}}}}}}}}}}}}}..}}}}}..------+--...T.}}}....}}}}}}}}}}}\n}}}}.}..}}}}}}}.T.....}}}}}}}}}}}..T.}}}}.T.|...|...|....}}}}}.}}}}}...}}}}}\n}}}.T.}...}..}}}}T.T.}}}}}}.}}}}}}}....}}...|...+...|.}}}}}}}}}}}}}..T...}}}\n}}}}..}}}.....}}...}}}}}}}...}}}}}}}}}}}}}T.|...|...|}}}}}}}}}}}....T..}}}}}\n}}}}}..}}}.T..}}}.}}}}}}}}.T..}}}}}}}}}}}}}}---S-----}}}}}}}}}}}}}....}}}}}}\n}}}}}}}}}}}..}}}}}}}}}}}}}}}.}}}}}}}}}}}}}}}}}T..T}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n");
  let place = selection.new();
  place.set(8, 6);
  place.set(66, 5);
  place.set(46, 15);
  let medloc = place.rndcoord(1, 1);
  let altloc = place.rndcoord(1, 1);
  let othloc = place.rndcoord(1, 1);
  await des.region(selection.area(0, 0, 74, 19), "lit");
  await des.region({ region: [49, 14, 51, 16], lit: -1, type: "ordinary", arrival_room: true });
  await des.region(selection.area(7, 5, 9, 7), "unlit");
  await des.region(selection.area(65, 4, 67, 6), "unlit");
  await des.region(selection.area(45, 14, 47, 16), "unlit");
  await des.non_diggable(selection.area(6, 4, 10, 8));
  await des.non_diggable(selection.area(64, 3, 68, 7));
  await des.non_diggable(selection.area(44, 13, 48, 17));
  await des.teleport_region({ region: [33, 2, 38, 7], dir: "down" });
  await des.levregion({ region: [32, 1, 39, 7], type: "stair-up" });
  await des.stair("down", medloc);
  await des.door("locked", 8, 8);
  await des.door("locked", 64, 5);
  await des.door("random", 50, 13);
  await des.door("locked", 48, 15);
  await des.feature("fountain", othloc);
  await des.object({ id: "statue", coord: medloc, buc: "uncursed", montype: "knight", historic: 1, male: 1, name: "Perseus", contents: (async () => {
      if (percent(75)) {
              await des.object({ id: "shield of reflection", buc: "cursed", spe: 0 });
            }
      if (percent(25)) {
              await des.object({ id: "levitation boots", spe: 0 });
            }
      if (percent(50)) {
              await des.object({ id: "scimitar", buc: "blessed", spe: 2 });
            }
      if (percent(50)) {
              await des.object("sack");
            }
    }) });
  await des.object({ id: "statue", coord: altloc, contents: 0 });
  await des.object({ id: "statue", contents: 0 });
  await des.object({ id: "statue", contents: 0 });
  await des.object({ id: "statue", contents: 0 });
  await des.object({ id: "statue", contents: 0 });
  await des.object({ id: "statue", contents: 0 });
  await des.object({ id: "statue", contents: 0 });
  {
      const __hi = 8;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.object();
      }
    }
  await des.object("scroll of blank paper", 48, 18);
  await des.object("scroll of blank paper", 48, 18);
  await des.trap("rust");
  await des.trap("rust");
  await des.trap("board");
  await des.trap("board");
  await des.trap();
  await des.monster({ id: "Medusa", coord: medloc, asleep: 1 });
  await des.monster("giant eel");
  await des.monster("giant eel");
  await des.monster("jellyfish");
  await des.monster("jellyfish");
  await des.monster("wood nymph");
  await des.monster("wood nymph");
  await des.monster("water nymph");
  await des.monster("water nymph");
  {
      const __hi = 30;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster({ id: "raven", peaceful: 0 });
      }
    }
}
