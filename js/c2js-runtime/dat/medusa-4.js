// medusa-4.js — AUTO-GENERATED from
// nethack-c/upstream/dat/medusa-4.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, percent, selection }) {
  await des.level_init({ style: "solidfill", fg: " " });
  await des.level_flags("noteleport", "mazelevel");
  await des.map("}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n}}}}}}}}}}}}}}........}}}}}}}}}}}}}}}}}}}}}}}..}}}.....}}}}}}}}}}}----|}}}}}\n}}}}}}..----------F-.....}}}}}}}}}}}}}}}}..---...}}}}....T.}}}}}}}....|}}}}}\n}}}.....|...F......S}}}}....}}}}}}}...}}.....|}}.}}}}}}}......}}}}|......}}}\n}}}.....+...|..{...|}}}}}}}}}}}}.....}}}}|...|}}}}}}}}}}}.}}}}}}}}----.}}}}}\n}}......|...|......|}}}}}}}}}......}}}}}}|.......}}}}}}}}}}}}}..}}}}}...}}}}\n}}|-+--F|-+--....|F|-|}}}}}....}}}....}}}-----}}.....}}}}}}}......}}}}.}}}}}\n}}|...}}|...|....|}}}|}}}}}}}..}}}}}}}}}}}}}}}}}}}}....}}}}}}}}....T.}}}}}}}\n}}|...}}F...+....F}}}}}}}..}}}}}}}}}}}}}}...}}}}}}}}}}}}}}}}}}}}}}....}}..}}\n}}|...}}|...|....|}}}|}....}}}}}}....}}}...}}}}}...}}}}}}}}}}}}}}}}}.....}}}\n}}--+--F|-+--....-F|-|....}}}}}}}}}}.T...}}}}....---}}}}}}}}}}}}}}}}}}}}}}}}\n}}......|...|......|}}}}}.}}}}}}}}}....}}}}}}}.....|}}}}}}}}}.}}}}}}}}}}}}}}\n}}}}....+...|..{...|.}}}}}}}}}}}}}}}}}}}}}}}}}}.|..|}}}}}}}......}}}}...}}}}\n}}}}}}..|...F......|...}}}}}}}}}}..---}}}}}}}}}}--.-}}}}}....}}}}}}....}}}}}\n}}}}}}}}-----S----F|....}}}}}}}}}|...|}}}}}}}}}}}}...}}}}}}...}}}}}}..}}}}}}\n}}}}}}}}}..............T...}}}}}.|.......}}}}}}}}}}}}}}..}...}.}}}}....}}}}}\n}}}}}}}}}}....}}}}...}...}}}}}.......|.}}}}}}}}}}}}}}.......}}}}}}}}}...}}}}\n}}}}}}}}}}..}}}}}}}}}}.}}}}}}}}}}-..--.}}}}}}}}..}}}}}}..T...}}}..}}}}}}}}}}\n}}}}}}}}}...}}}}}}}}}}}}}}}}}}}}}}}...}}}}}}}....}}}}}}}.}}}..}}}...}}}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}.}}}}}}....}}}}}}}}}}}}}}}}}}}...}}}}}}\n}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}\n");
  let place = selection.new();
  place.set(4, 8);
  place.set(10, 4);
  place.set(10, 8);
  place.set(10, 12);
  let medloc = place.rndcoord(1, 1);
  let altloc = place.rndcoord(1, 1);
  await des.region(selection.area(0, 0, 74, 19), "lit");
  await des.region({ region: [13, 3, 18, 13], lit: 1, type: "ordinary", irregular: 1 });
  await des.teleport_region({ region: [64, 1, 74, 17], dir: "down" });
  await des.teleport_region({ region: [2, 2, 18, 13], dir: "up" });
  await des.levregion({ region: [67, 1, 74, 20], type: "stair-up" });
  await des.stair("down", medloc);
  await des.door("locked", 4, 6);
  await des.door("locked", 4, 10);
  await des.door("locked", 8, 4);
  await des.door("locked", 8, 12);
  await des.door("locked", 10, 6);
  await des.door("locked", 10, 10);
  await des.door("locked", 12, 8);
  await des.levregion({ region: [27, 0, 79, 20], type: "branch" });
  await des.non_diggable(selection.area(1, 1, 22, 14));
  await des.object("crystal ball", 7, 8);
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
  {
      const __hi = 7;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.trap();
      }
    }
  await des.monster({ id: "Medusa", coord: medloc, asleep: 1 });
  await des.monster("kraken", 7, 7);
  await des.monster({ id: "yellow dragon", x: 5, y: 4, asleep: 1 });
  if (percent(50)) {
      await des.monster({ id: "baby yellow dragon", x: 4, y: 4, asleep: 1 });
    }
  if (percent(25)) {
      await des.monster({ id: "baby yellow dragon", x: 4, y: 5, asleep: 1 });
    }
  await des.object({ id: "egg", x: 5, y: 4, montype: "yellow dragon" });
  if (percent(50)) {
      await des.object({ id: "egg", x: 5, y: 4, montype: "yellow dragon" });
    }
  if (percent(25)) {
      await des.object({ id: "egg", x: 5, y: 4, montype: "yellow dragon" });
    }
  await des.monster("giant eel");
  await des.monster("giant eel");
  await des.monster("jellyfish");
  await des.monster("jellyfish");
  {
      const __hi = 14;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster("S");
      }
    }
  {
      const __hi = 4;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster("black naga hatchling");
        await des.monster("black naga");
      }
    }
}
