// hellfill.js — AUTO-GENERATED from
// nethack-c/upstream/dat/hellfill.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ des, math, percent, selection, shuffle, type }) {
  globalThis.hellobjects = async () => {
      let objclass = ["(", "/", "=", "+", ")", "[", "?", "*", "%"];
      await shuffle(objclass);
      await des.object(objclass[0]);
      await des.object(objclass[0]);
      await des.object(objclass[1]);
      await des.object(objclass[2]);
      await des.object(objclass[3]);
      await des.object(objclass[4]);
      await des.object();
      await des.object();
    };
  globalThis.hellmonsters = async () => {
      let monclass = ["V", "D", " ", "&", "Z"];
      await shuffle(monclass);
      await des.monster({ class: monclass[0], peaceful: 0 });
      await des.monster({ class: monclass[0], peaceful: 0 });
      await des.monster({ class: monclass[1], peaceful: 0 });
      await des.monster({ class: monclass[1], peaceful: 0 });
      await des.monster({ class: monclass[2], peaceful: 0 });
      await des.monster({ class: monclass[3], peaceful: 0 });
      await des.monster({ peaceful: 0 });
      await des.monster({ class: "H", peaceful: 0 });
    };
  globalThis.helltraps = async () => {
      {
          const __hi = 12;
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            await des.trap();
          }
        }
    };
  globalThis.populatemaze = async () => {
      {
          const __hi = math.random(8) + 11;
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            if ((percent(50))) {
                  await des.object("*");
                } else {
                  await des.object();
                }
          }
        }
      {
          const __hi = math.random(10) + 2;
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            await des.object("`");
          }
        }
      {
          const __hi = math.random(3);
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            await des.monster({ id: "minotaur", peaceful: 0 });
          }
        }
      {
          const __hi = math.random(5) + 7;
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            await des.monster({ peaceful: 0 });
          }
        }
      {
          const __hi = math.random(6) + 7;
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            await des.gold();
          }
        }
      {
          const __hi = math.random(6) + 7;
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            await des.trap();
          }
        }
    };
  globalThis.rnd_halign = () => {
      let aligns = ["half-left", "center", "half-right"];
      return aligns[(math.random(1, aligns.length)) - 1];
    };
  globalThis.rnd_valign = () => {
      let aligns = ["top", "center", "bottom"];
      return aligns[(math.random(1, aligns.length)) - 1];
    };
  let hell_prefabs = [{ repeatable: true, contents: (async () => {
      await des.map({ halign: rnd_halign(), valign: "center", map: "......\n......\n......\n......\n......\n......\n......\n......\n......\n......\n......\n......\n......\n......\n......\n......", contents: (() => {
        }) });
    }) }, { repeatable: true, contents: (async () => {
      await des.map({ halign: rnd_halign(), valign: "center", map: "xxxxxx.....xxxxxx\nxxxx.........xxxx\nxx.............xx\nxx.............xx\nx...............x\nx...............x\n.................\n.................\n.................\n.................\n.................\nx...............x\nx...............x\nxx.............xx\nxx.............xx\nxxxx.........xxxx\nxxxxxx.....xxxxxx\n", contents: (() => {
        }) });
    }) }, (async (coldhell) => {
      await des.map({ halign: rnd_halign(), valign: rnd_valign(), map: "xxxxxx.xxxxxx\nxLLLLLLLLLLLx\nxL---------Lx\nxL|.......|Lx\nxL|.......|Lx\n.L|.......|L.\nxL|.......|Lx\nxL|.......|Lx\nxL---------Lx\nxLLLLLLLLLLLx\nxxxxxx.xxxxxx\n", contents: (async () => {
          await des.non_diggable(selection.area(2, 2, 10, 8));
          await des.region(selection.area(4, 4, 8, 6), "lit");
          await des.exclusion({ type: "teleport", region: [2, 2, 10, 8] });
          if ((coldhell)) {
                      await des.replace_terrain({ region: [1, 1, 11, 9], fromterrain: "L", toterrain: "P" });
                    }
          let dblocs = [{ x: 1, y: 5, dir: "east", state: "closed" }, { x: 11, y: 5, dir: "west", state: "closed" }, { x: 6, y: 1, dir: "south", state: "closed" }, { x: 6, y: 9, dir: "north", state: "closed" }];
          await shuffle(dblocs);
          {
                      const __hi = math.random(1, dblocs.length);
                      const __step = 1;
                      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                        await des.drawbridge(dblocs[(i) - 1]);
                      }
                    }
          let mons = ["H", "T", "@"];
          await shuffle(mons);
          {
                      const __hi = 3 + math.random(1, 5);
                      const __step = 1;
                      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                        await des.monster(mons[0], 6, 5);
                      }
                    }
        }) });
    }), { repeatable: true, contents: (async () => {
      await des.map({ halign: "center", valign: "center", map: "..............................................................\n..............................................................\n..............................................................\n..............................................................\n..............................................................", contents: (() => {
        }) });
    }) }, { repeatable: true, contents: (async () => {
      await des.map({ halign: rnd_halign(), valign: rnd_valign(), lit: true, map: "x.....x\n.......\n.......\n.......\n.......\n.......\nx.....x", contents: (() => {
        }) });
    }) }, (async () => {
      await des.map({ halign: rnd_halign(), valign: rnd_valign(), map: "BBBBBBB\nB.....B\nB.....B\nB.....B\nB.....B\nB.....B\nBBBBBBB", contents: (async () => {
          await des.region({ region: [2, 2, 2, 2], type: "temple", filled: 1, irregular: 1 });
          await des.altar({ x: 3, y: 3, align: "noalign", type: percent(75) && "altar" || "shrine" });
        }) });
    }), (async () => {
      await des.map({ halign: rnd_halign(), valign: rnd_valign(), map: "..........\n..........\n..........\n...FFFF...\n...F..F...\n...F..F...\n...FFFF...\n..........\n..........\n..........", contents: (async () => {
          await des.exclusion({ type: "teleport", region: [4, 4, 5, 5] });
          let mons = ["Angel", "D", "H", "L"];
          await des.monster(mons[(math.random(1, mons.length)) - 1], 4, 4);
        }) });
    }), (async () => {
      await des.map({ halign: rnd_halign(), valign: rnd_valign(), map: ".........\n.}}}}}}}.\n.}}---}}.\n.}--.--}.\n.}|...|}.\n.}--.--}.\n.}}---}}.\n.}}}}}}}.\n.........\n", contents: (async (rm) => {
          await des.exclusion({ type: "teleport", region: [3, 3, 5, 5] });
          await des.monster("L", 4, 4);
        }) });
    }), (async () => {
      let mapstr = percent(30) && ".....\n.LLL.\n.LZL.\n.LLL.\n....." || ".....\n.PPP.\n.PWP.\n.PPP.\n.....";
      {
              const __hi = 5;
              const __step = 1;
              for (let dx = 1; __step > 0 ? dx <= __hi : dx >= __hi; dx += __step) {
                await des.map({ x: dx * 14 - 4, y: math.random(3, 15), map: mapstr, contents: (() => {
            }) });
              }
            }
    }), { repeatable: true, contents: (async () => {
      let mapstr = "...\n...\n...\n...\n...\n...\n...\n...\n...\n...\n...\n...\n...\n...\n...\n...\n...";
      {
              const __hi = 3;
              const __step = 1;
              for (let dx = 1; __step > 0 ? dx <= __hi : dx >= __hi; dx += __step) {
                await des.map({ x: math.random(3, 75), y: 3, map: mapstr, contents: (() => {
            }) });
              }
            }
    }) }];
  globalThis.rnd_hell_prefab = async (coldhell) => {
      let dorepeat = true;
      let nloops = 0;
      do {
          nloops = nloops + 1;
          let pf = math.random(1, hell_prefabs.length);
          let fab = hell_prefabs[(pf) - 1];
          let fabtype = type(fab);
          if ((fabtype == "function")) {
              await fab(coldhell);
              dorepeat = false;
            }
      else if ((fabtype == "table")) {
              await fab.contents(coldhell);
              dorepeat = !(fab.repeatable && math.random(0, nloops * 2) == 0);
            }
        } while (!(((!dorepeat) || (nloops > 5))));
    };
  globalThis.hells = [(async () => {
      await des.level_init({ style: "solidfill", fg: " ", lit: 0 });
      await des.level_flags("mazelevel", "noflip");
      await des.level_init({ style: "mines", fg: ".", smoothed: true, joined: true, lit: 0, walled: true });
      await des.replace_terrain({ fromterrain: " ", toterrain: "L" });
      await des.replace_terrain({ fromterrain: ".", toterrain: "L", chance: 5 });
      await des.replace_terrain({ mapfragment: "w", toterrain: "L", chance: 20 });
      await des.replace_terrain({ mapfragment: "w", toterrain: ".", chance: 15 });
    }), (async () => {
      await des.level_init({ style: "solidfill", fg: " ", lit: 0 });
      await des.level_flags("mazelevel", "noflip");
      await des.level_init({ style: "mazegrid", bg: "-" });
      await des.mazewalk({ coord: [1, 10], dir: "east", stocked: false });
      let tmpbounds = selection.match("-");
      let bnds = tmpbounds.bounds();
      let protected_area = selection.fillrect(bnds.lx, bnds.ly + 1, bnds.hx - 2, bnds.hy - 1);
      await globalThis.hell_tweaks(protected_area.negate());
      if ((percent(25))) {
              await rnd_hell_prefab(false);
            }
    }), (async () => {
      await des.level_init({ style: "solidfill", fg: " ", lit: 0 });
      await des.level_flags("mazelevel", "noflip");
      await des.level_init({ style: "maze", wallthick: 1 });
    }), (async () => {
      let cwid = math.random(4);
      await des.level_init({ style: "solidfill", fg: " ", lit: 0 });
      await des.level_flags("mazelevel", "noflip");
      await des.level_init({ style: "maze", wallthick: 1, corrwid: cwid });
      let outside_walls = selection.match(" ");
      let wallterrain = ["F", "L"];
      await shuffle(wallterrain);
      await des.replace_terrain({ mapfragment: "w", toterrain: wallterrain[0] });
      if ((cwid == 1)) {
              if ((wallterrain[0] == "F" && percent(80))) {
                  await des.replace_terrain({ mapfragment: ".\nF\n.", toterrain: ".", chance: 25 * math.random(4) });
                }
        else if ((percent(25))) {
                  await rnd_hell_prefab(false);
                }
            }
      await des.terrain(outside_walls, " ");
    }), (async () => {
      let wwid = 1 + math.random(2);
      await des.level_init({ style: "solidfill", fg: " ", lit: 0 });
      await des.level_flags("mazelevel", "noflip");
      await des.level_init({ style: "maze", wallthick: wwid, corrwid: math.random(2) });
      if ((percent(50))) {
              let outside_walls = selection.match(" ");
              await des.replace_terrain({ mapfragment: "w", toterrain: "L" });
              await des.terrain(outside_walls, " ");
              if ((wwid == 3 && percent(40))) {
                  let sel = selection.match("LLL\nLLL\nLLL");
                  await des.terrain(sel.percentage(30 * math.random(4)), "Z");
                }
            }
    }), (async () => {
      let cwid = math.random(4);
      await des.level_init({ style: "solidfill", fg: " ", lit: 0 });
      await des.level_flags("mazelevel", "noflip", "cold");
      await des.level_init({ style: "maze", wallthick: 1, corrwid: cwid });
      let outside_walls = selection.match(" ");
      let icey = selection.negate().percentage(10).grow().filter_mapchar(".");
      await des.terrain(icey, "I");
      if ((cwid > 1)) {
              await des.terrain(icey.percentage(1), "W");
            }
      await des.terrain(icey.percentage(5), "P");
      if ((percent(25))) {
              await des.terrain(selection.match("w"), "W");
            }
      if ((cwid == 1 && percent(25))) {
              await rnd_hell_prefab(true);
            }
      await des.terrain(outside_walls, " ");
    }), (async () => {
      let wter = percent(50) && " " || "L";
      await des.level_init({ style: "solidfill", fg: " ", lit: 0 });
      await des.level_flags("mazelevel", "noflip");
      await des.level_init({ style: "mines", fg: ".", bg: wter, smoothed: true, joined: true, lit: 0 });
      let sel = selection.match(".").grow();
      await des.terrain({ selection: sel, typ: ".", lit: 0 });
      let border = selection.rect(0, 0, 78, 20);
      await des.terrain({ selection: border, typ: wter, lit: 0 });
      await des.wallify();
    })];
  let hellno = math.random(1, globalThis.hells.length);
  globalThis.hells[(hellno) - 1]();
  await des.stair("up");
  if ((globalThis.u.invocation_level)) {
      await des.trap("vibrating square");
    } else {
      await des.stair("down");
    }
  await populatemaze();
}
