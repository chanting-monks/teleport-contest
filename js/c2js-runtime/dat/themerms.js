// themerms.js — AUTO-GENERATED from
// nethack-c/upstream/dat/themerms.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ d, des, ipairs, math, nh, obj, percent, pline, selection, shuffle, string, table, type }) {
  let postprocess = [];
  globalThis.themeroom_fills = [{ name: "Ice room", contents: (async (rm) => {
      let ice = selection.room();
      await des.terrain(ice, "I");
      if ((percent(25))) {
              let mintime = 1000 - (nh.level_difficulty() * 100);
              let ice_melter = ((x, y) => {
            nh.start_timer_at(x, y, "melt-ice", mintime + nh.rn2(1000));
          });
              ice.iterate(ice_melter);
            }
    }) }, { name: "Cloud room", contents: (async (rm) => {
      let fog = selection.room();
      {
              const __hi = (fog.numpoints() / 4);
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                await des.monster({ id: "fog cloud", asleep: true });
              }
            }
      await des.gas_cloud({ selection: fog });
    }) }, { name: "Boulder room", mindiff: 4, contents: (async (rm) => {
      let locs = selection.room().percentage(30);
      let func = (async (x, y) => {
          if ((percent(50))) {
                      await des.object("boulder", x, y);
                    } else {
                      await des.trap("rolling boulder", x, y);
                    }
        });
      locs.iterate(func);
    }) }, { name: "Spider nest", contents: (async (rm) => {
      let spooders = nh.level_difficulty() > 8;
      let locs = selection.room().percentage(30);
      let func = (async (x, y) => {
          await des.trap({ type: "web", x: x, y: y, spider_on_web: spooders && percent(80) });
        });
      locs.iterate(func);
    }) }, { name: "Trap room", contents: (async (rm) => {
      let traps = ["arrow", "dart", "falling rock", "bear", "land mine", "sleep gas", "rust", "anti magic"];
      shuffle(traps);
      let locs = selection.room().percentage(30);
      let func = (async (x, y) => {
          await des.trap(traps[0], x, y);
        });
      locs.iterate(func);
    }) }, { name: "Garden", eligible: ((rm) => {
      return rm.lit == true;
    }), contents: (async (rm) => {
      let s = selection.room();
      let npts = (s.numpoints() / 6);
      {
              const __hi = npts;
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                await des.monster({ id: "wood nymph", asleep: true });
                if ((percent(30))) {
                      await des.feature("fountain");
                    }
              }
            }
      await table.insert(postprocess, { handler: make_garden_walls, data: { sel: selection.room() } });
    }) }, { name: "Buried treasure", contents: (async (rm) => {
      await des.object({ id: "chest", buried: true, contents: (async (otmp) => {
          let xobj = otmp.totable();
          if ((xobj.NO_OBJ == null)) {
                      await table.insert(postprocess, { handler: make_dig_engraving, data: { x: xobj.ox, y: xobj.oy } });
                    }
          {
                      const __hi = d(3, 4);
                      const __step = 1;
                      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                        await des.object();
                      }
                    }
        }) });
    }) }, { name: "Buried zombies", contents: ((rm) => {
      let diff = nh.level_difficulty();
      let zombifiable = ["kobold", "gnome", "orc", "dwarf"];
      if (diff > 3) {
              [zombifiable[4], zombifiable[5]] = ["elf", "human"];
              if (diff > 6) {
                  [zombifiable[6], zombifiable[7]] = ["ettin", "giant"];
                }
            }
      {
              const __hi = (rm.width * rm.height) / 2;
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                shuffle(zombifiable);
                let o = des.object({ id: "corpse", montype: zombifiable[0], buried: true });
                o.stop_timer("rot-corpse");
                o.start_timer("zombify-mon", math.random(990, 1010));
              }
            }
    }) }, { name: "Massacre", contents: (async (rm) => {
      let mon = ["apprentice", "warrior", "ninja", "thug", "hunter", "acolyte", "abbot", "page", "attendant", "neanderthal", "chieftain", "student", "wizard", "valkyrie", "tourist", "samurai", "rogue", "ranger", "priestess", "priest", "monk", "knight", "healer", "cavewoman", "caveman", "barbarian", "archeologist"];
      let idx = math.random(mon.length);
      {
              const __hi = d(5, 5);
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                if ((percent(10))) {
                      idx = math.random(mon.length);
                    }
                await des.object({ id: "corpse", montype: mon[(idx) - 1] });
              }
            }
    }) }, { name: "Statuary", contents: (async (rm) => {
      {
              const __hi = d(5, 5);
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                await des.object({ id: "statue" });
              }
            }
      {
              const __hi = d(3);
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                await des.trap("statue");
              }
            }
    }) }, { name: "Light source", eligible: ((rm) => {
      return rm.lit == false;
    }), contents: (async (rm) => {
      await des.object({ id: "oil lamp", lit: true });
    }) }, { name: "Temple of the gods", contents: (async (rm) => {
      await des.altar({ align: globalThis.align[0] });
      await des.altar({ align: globalThis.align[1] });
      await des.altar({ align: globalThis.align[2] });
    }) }, { name: "Ghost of an Adventurer", contents: (async (rm) => {
      let loc = selection.room().rndcoord(0);
      await des.monster({ id: "ghost", asleep: true, waiting: true, coord: loc });
      if (percent(65)) {
              await des.object({ id: "dagger", coord: loc, buc: "not-blessed" });
            }
      if (percent(55)) {
              await des.object({ class: ")", coord: loc, buc: "not-blessed" });
            }
      if (percent(45)) {
              await des.object({ id: "bow", coord: loc, buc: "not-blessed" });
              await des.object({ id: "arrow", coord: loc, buc: "not-blessed" });
            }
      if (percent(65)) {
              await des.object({ class: "[", coord: loc, buc: "not-blessed" });
            }
      if (percent(20)) {
              await des.object({ class: "=", coord: loc, buc: "not-blessed" });
            }
      if (percent(20)) {
              await des.object({ class: "?", coord: loc, buc: "not-blessed" });
            }
    }) }, { name: "Storeroom", contents: (async (rm) => {
      let locs = selection.room().percentage(30);
      let func = (async (x, y) => {
          if ((percent(25))) {
                      await des.object("chest");
                    } else {
                      await des.monster({ class: "m", appear_as: "obj:chest" });
                    }
        });
      locs.iterate(func);
    }) }, { name: "Teleportation hub", contents: (async (rm) => {
      let locs = selection.room().filter_mapchar(".");
      {
              const __hi = 2 + nh.rn2(3);
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                let pos = locs.rndcoord(1);
                if ((pos.x > 0)) {
                      pos.x = pos.x + rm.region.x1 - 1;
                      pos.y = pos.y + rm.region.y1;
                      await table.insert(postprocess, { handler: make_a_trap, data: { type: "teleport", seen: true, coord: pos, teledest: 1 } });
                    }
              }
            }
    }) }];
  globalThis.themerooms = [{ name: "default", frequency: 1000, contents: (async () => {
      await des.room({ type: "ordinary", filled: 1 });
    }) }, { name: "Fake Delphi", contents: (async () => {
      await des.room({ type: "ordinary", w: 11, h: 9, filled: 1, contents: (async () => {
          await des.room({ type: "ordinary", x: 4, y: 3, w: 3, h: 3, filled: 1, contents: (async () => {
              await des.door({ state: "random", wall: "all" });
            }) });
        }) });
    }) }, { name: "Room in a room", contents: (async () => {
      await des.room({ type: "ordinary", filled: 1, contents: (async () => {
          await des.room({ type: "ordinary", contents: (async () => {
              await des.door({ state: "random", wall: "all" });
            }) });
        }) });
    }) }, { name: "Huge room with another room inside", contents: (async () => {
      await des.room({ type: "ordinary", w: nh.rn2(10) + 11, h: nh.rn2(5) + 8, filled: 1, contents: (async () => {
          if ((percent(90))) {
                      await des.room({ type: "ordinary", filled: 1, contents: (async () => {
                await des.door({ state: "random", wall: "all" });
                if ((percent(50))) {
                                  await des.door({ state: "random", wall: "all" });
                                }
              }) });
                    }
        }) });
    }) }, { name: "Nesting rooms", contents: (async () => {
      await des.room({ type: "ordinary", w: 9 + nh.rn2(4), h: 9 + nh.rn2(4), filled: 1, contents: (async (rm) => {
          let wid = math.random(math.floor(rm.width / 2), rm.width - 2);
          let hei = math.random(math.floor(rm.height / 2), rm.height - 2);
          await des.room({ type: "ordinary", w: wid, h: hei, filled: 1, contents: (async () => {
              if ((percent(90))) {
                              await des.room({ type: "ordinary", filled: 1, contents: (async () => {
                    await des.door({ state: "random", wall: "all" });
                    if ((percent(15))) {
                                          await des.door({ state: "random", wall: "all" });
                                        }
                  }) });
                            }
              await des.door({ state: "random", wall: "all" });
              if ((percent(15))) {
                              await des.door({ state: "random", wall: "all" });
                            }
            }) });
        }) });
    }) }, { name: "Default room with themed fill", frequency: 6, contents: (async () => {
      await des.room({ type: "themed", contents: themeroom_fill });
    }) }, { name: "Unlit room with themed fill", frequency: 2, contents: (async () => {
      await des.room({ type: "themed", lit: 0, contents: themeroom_fill });
    }) }, { name: "Room with both normal contents and themed fill", frequency: 2, contents: (async () => {
      await des.room({ type: "themed", filled: 1, contents: themeroom_fill });
    }) }, { name: "Pillars", contents: (async () => {
      await des.room({ type: "themed", w: 10, h: 10, contents: (async (rm) => {
          let terr = ["-", "-", "-", "-", "L", "P", "T"];
          shuffle(terr);
          {
                      const __hi = (rm.width / 4) - 1;
                      const __step = 1;
                      for (let x = 0; __step > 0 ? x <= __hi : x >= __hi; x += __step) {
                        {
                              const __hi = (rm.height / 4) - 1;
                              const __step = 1;
                              for (let y = 0; __step > 0 ? y <= __hi : y >= __hi; y += __step) {
                                await des.terrain({ x: x * 4 + 2, y: y * 4 + 2, typ: terr[0], lit: -2 });
                                await des.terrain({ x: x * 4 + 3, y: y * 4 + 2, typ: terr[0], lit: -2 });
                                await des.terrain({ x: x * 4 + 2, y: y * 4 + 3, typ: terr[0], lit: -2 });
                                await des.terrain({ x: x * 4 + 3, y: y * 4 + 3, typ: terr[0], lit: -2 });
                              }
                            }
                      }
                    }
        }) });
    }) }, { name: "Mausoleum", contents: (async () => {
      await des.room({ type: "themed", w: 5 + nh.rn2(3) * 2, h: 5 + nh.rn2(3) * 2, contents: (async (rm) => {
          await des.room({ type: "themed", x: (rm.width - 1) / 2, y: (rm.height - 1) / 2, w: 1, h: 1, joined: false, contents: (async () => {
              if ((percent(50))) {
                              let mons = ["M", "V", "L", "Z"];
                              shuffle(mons);
                              await des.monster({ class: mons[0], x: 0, y: 0, waiting: 1 });
                            } else {
                              await des.object({ id: "corpse", montype: "@", coord: [0, 0] });
                            }
              if ((percent(20))) {
                              await des.door({ state: "secret", wall: "all" });
                            }
            }) });
        }) });
    }) }, { name: "Random dungeon feature in the middle of an odd-sized room", contents: (async () => {
      let wid = 3 + (nh.rn2(3) * 2);
      let hei = 3 + (nh.rn2(3) * 2);
      await des.room({ type: "ordinary", filled: 1, w: wid, h: hei, contents: (async (rm) => {
          let feature = ["C", "L", "I", "P", "T"];
          shuffle(feature);
          await des.terrain((rm.width - 1) / 2, (rm.height - 1) / 2, feature[0]);
        }) });
    }) }, { name: "L-shaped", contents: (async () => {
      await des.map({ map: "-----xxx\n|...|xxx\n|...|xxx\n|...----\n|......|\n|......|\n|......|\n--------", contents: ((m) => {
          filler_region(1, 1);
        }) });
    }) }, { name: "L-shaped, rot 1", contents: (async () => {
      await des.map({ map: "xxx-----\nxxx|...|\nxxx|...|\n----...|\n|......|\n|......|\n|......|\n--------", contents: ((m) => {
          filler_region(5, 1);
        }) });
    }) }, { name: "L-shaped, rot 2", contents: (async () => {
      await des.map({ map: "--------\n|......|\n|......|\n|......|\n----...|\nxxx|...|\nxxx|...|\nxxx-----", contents: ((m) => {
          filler_region(1, 1);
        }) });
    }) }, { name: "L-shaped, rot 3", contents: (async () => {
      await des.map({ map: "--------\n|......|\n|......|\n|......|\n|...----\n|...|xxx\n|...|xxx\n-----xxx", contents: ((m) => {
          filler_region(1, 1);
        }) });
    }) }, { name: "Blocked center", contents: (async () => {
      await des.map({ map: "-----------\n|.........|\n|.........|\n|.........|\n|...LLL...|\n|...LLL...|\n|...LLL...|\n|.........|\n|.........|\n|.........|\n-----------", contents: (async (m) => {
          if ((percent(30))) {
                      let terr = ["-", "P"];
                      shuffle(terr);
                      await des.replace_terrain({ region: [1, 1, 9, 9], fromterrain: "L", toterrain: terr[0] });
                    }
          filler_region(1, 1);
        }) });
    }) }, { name: "Circular, small", contents: (async () => {
      await des.map({ map: "xx---xx\nx--.--x\n--...--\n|.....|\n--...--\nx--.--x\nxx---xx", contents: ((m) => {
          filler_region(3, 3);
        }) });
    }) }, { name: "Circular, medium", contents: (async () => {
      await des.map({ map: "xx-----xx\nx--...--x\n--.....--\n|.......|\n|.......|\n|.......|\n--.....--\nx--...--x\nxx-----xx", contents: ((m) => {
          filler_region(4, 4);
        }) });
    }) }, { name: "Circular, big", contents: (async () => {
      await des.map({ map: "xxx-----xxx\nx---...---x\nx-.......-x\n--.......--\n|.........|\n|.........|\n|.........|\n--.......--\nx-.......-x\nx---...---x\nxxx-----xxx", contents: ((m) => {
          filler_region(5, 5);
        }) });
    }) }, { name: "T-shaped", contents: (async () => {
      await des.map({ map: "xxx-----xxx\nxxx|...|xxx\nxxx|...|xxx\n----...----\n|.........|\n|.........|\n|.........|\n-----------", contents: ((m) => {
          filler_region(5, 5);
        }) });
    }) }, { name: "T-shaped, rot 1", contents: (async () => {
      await des.map({ map: "-----xxx\n|...|xxx\n|...|xxx\n|...----\n|......|\n|......|\n|......|\n|...----\n|...|xxx\n|...|xxx\n-----xxx", contents: ((m) => {
          filler_region(2, 2);
        }) });
    }) }, { name: "T-shaped, rot 2", contents: (async () => {
      await des.map({ map: "-----------\n|.........|\n|.........|\n|.........|\n----...----\nxxx|...|xxx\nxxx|...|xxx\nxxx-----xxx", contents: ((m) => {
          filler_region(2, 2);
        }) });
    }) }, { name: "T-shaped, rot 3", contents: (async () => {
      await des.map({ map: "xxx-----\nxxx|...|\nxxx|...|\n----...|\n|......|\n|......|\n|......|\n----...|\nxxx|...|\nxxx|...|\nxxx-----", contents: ((m) => {
          filler_region(5, 5);
        }) });
    }) }, { name: "S-shaped", contents: (async () => {
      await des.map({ map: "-----xxx\n|...|xxx\n|...|xxx\n|...----\n|......|\n|......|\n|......|\n----...|\nxxx|...|\nxxx|...|\nxxx-----", contents: ((m) => {
          filler_region(2, 2);
        }) });
    }) }, { name: "S-shaped, rot 1", contents: (async () => {
      await des.map({ map: "xxx--------\nxxx|......|\nxxx|......|\n----......|\n|......----\n|......|xxx\n|......|xxx\n--------xxx", contents: ((m) => {
          filler_region(5, 5);
        }) });
    }) }, { name: "Z-shaped", contents: (async () => {
      await des.map({ map: "xxx-----\nxxx|...|\nxxx|...|\n----...|\n|......|\n|......|\n|......|\n|...----\n|...|xxx\n|...|xxx\n-----xxx", contents: ((m) => {
          filler_region(5, 5);
        }) });
    }) }, { name: "Z-shaped, rot 1", contents: (async () => {
      await des.map({ map: "--------xxx\n|......|xxx\n|......|xxx\n|......----\n----......|\nxxx|......|\nxxx|......|\nxxx--------", contents: ((m) => {
          filler_region(2, 2);
        }) });
    }) }, { name: "Cross", contents: (async () => {
      await des.map({ map: "xxx-----xxx\nxxx|...|xxx\nxxx|...|xxx\n----...----\n|.........|\n|.........|\n|.........|\n----...----\nxxx|...|xxx\nxxx|...|xxx\nxxx-----xxx", contents: ((m) => {
          filler_region(6, 6);
        }) });
    }) }, { name: "Four-leaf clover", contents: (async () => {
      await des.map({ map: "-----x-----\n|...|x|...|\n|...---...|\n|.........|\n---.....---\nxx|.....|xx\n---.....---\n|.........|\n|...---...|\n|...|x|...|\n-----x-----", contents: ((m) => {
          filler_region(6, 6);
        }) });
    }) }, { name: "Water-surrounded vault", contents: (async () => {
      await des.map({ map: "}}}}}}\n}----}\n}|..|}\n}|..|}\n}----}\n}}}}}}", contents: (async (m) => {
          await des.region({ region: [3, 3, 3, 3], type: "themed", irregular: true, filled: 0, joined: false });
          let nasty_undead = ["giant zombie", "ettin zombie", "vampire lord"];
          let chest_spots = [[2, 2], [3, 2], [2, 3], [3, 3]];
          shuffle(chest_spots);
          let escape_items = ["scroll of teleportation", "ring of teleportation", "wand of teleportation", "wand of digging"];
          let itm = obj.new(escape_items[(math.random(escape_items.length)) - 1]);
          let itmcls = itm.class();
          let box;
          if (itmcls["material"] == "glass") {
                      box = des.object({ id: "chest", coord: chest_spots[0], olocked: "no" });
                    } else {
                      box = des.object({ id: "chest", coord: chest_spots[0] });
                    }
          box.addcontent(itm);
          {
                      const __hi = chest_spots.length;
                      const __step = 1;
                      for (let i = 2; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                        await des.object({ id: "chest", coord: chest_spots[(i) - 1] });
                      }
                    }
          shuffle(nasty_undead);
          await des.monster(nasty_undead[0], 2, 2);
          await des.exclusion({ type: "teleport", region: [2, 2, 3, 3] });
        }) });
    }) }, { name: "Twin businesses", mindiff: 4, contents: (async () => {
      await des.room({ type: "themed", w: 9, h: 5, contents: (async () => {
          globalThis.southeast = (() => {
              return percent(50) && "south" || "east";
            });
          globalThis.northeast = (() => {
              return percent(50) && "north" || "east";
            });
          globalThis.northwest = (() => {
              return percent(50) && "north" || "west";
            });
          globalThis.southwest = (() => {
              return percent(50) && "south" || "west";
            });
          globalThis.placements = [{ lx: 1, ly: 1, rx: 4, ry: 1, lwall: "south", rwall: globalThis.southeast() }, { lx: 1, ly: 2, rx: 4, ry: 2, lwall: "north", rwall: globalThis.northeast() }, { lx: 1, ly: 1, rx: 5, ry: 1, lwall: globalThis.southeast(), rwall: globalThis.southwest() }, { lx: 1, ly: 1, rx: 5, ry: 2, lwall: globalThis.southeast(), rwall: globalThis.northwest() }, { lx: 1, ly: 2, rx: 5, ry: 1, lwall: globalThis.northeast(), rwall: globalThis.southwest() }, { lx: 1, ly: 2, rx: 5, ry: 2, lwall: globalThis.northeast(), rwall: globalThis.northwest() }, { lx: 2, ly: 1, rx: 5, ry: 1, lwall: globalThis.southwest(), rwall: "south" }, { lx: 2, ly: 2, rx: 5, ry: 2, lwall: globalThis.northwest(), rwall: "north" }];
          [globalThis.ltype, globalThis.rtype] = ["weapon shop", "armor shop"];
          if (percent(50)) {
                      [globalThis.ltype, globalThis.rtype] = [globalThis.rtype, globalThis.ltype];
                    }
          globalThis.shopdoorstate = (() => {
              if (percent(1)) {
                              return "locked";
                            }
              else if (percent(50)) {
                              return "closed";
                            } else {
                              return "open";
                            }
            });
          globalThis.p = globalThis.placements[(d(globalThis.placements.length)) - 1];
          await des.room({ type: globalThis.ltype, x: globalThis.p["lx"], y: globalThis.p["ly"], w: 3, h: 3, filled: 1, joined: false, contents: (async () => {
              await des.door({ state: globalThis.shopdoorstate(), wall: globalThis.p["lwall"] });
            }) });
          await des.room({ type: globalThis.rtype, x: globalThis.p["rx"], y: globalThis.p["ry"], w: 3, h: 3, filled: 1, joined: false, contents: (async () => {
              await des.door({ state: globalThis.shopdoorstate(), wall: globalThis.p["rwall"] });
            }) });
        }) });
    }) }];
  globalThis.debug_rm_idx = null;
  globalThis.debug_fill_idx = null;
  globalThis.filler_region = async (x, y) => {
      let rmtyp = "ordinary";
      let func = null;
      if ((percent(30))) {
          rmtyp = "themed";
          func = themeroom_fill;
        }
      await des.region({ region: [x, y, x, y], type: rmtyp, irregular: true, filled: 1, contents: func });
    };
  globalThis.is_eligible = (room, mkrm) => {
      let t = type(room);
      let diff = nh.level_difficulty();
      if ((room.mindiff != null && diff < room.mindiff)) {
          return false;
        }
    else if ((room.maxdiff != null && diff > room.maxdiff)) {
          return false;
        }
      if ((mkrm != null && room.eligible != null)) {
          return room.eligible(mkrm);
        }
      return true;
    };
  globalThis.lookup_by_name = (name, checkfills) => {
      if (name == null) {
          return null;
        }
      if (checkfills) {
          {
              const __hi = globalThis.themeroom_fills.length;
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                if (globalThis.themeroom_fills[(i) - 1].name == name) {
                      return i;
                    }
              }
            }
        } else {
          {
              const __hi = globalThis.themerooms.length;
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                if (globalThis.themerooms[(i) - 1].name == name) {
                      return i;
                    }
              }
            }
        }
      return null;
    };
  globalThis.themerooms_generate = () => {
      if (globalThis.debug_rm_idx != null) {
          let actualrm = lookup_by_name("default", false);
          if (percent(50)) {
              if (is_eligible(globalThis.themerooms[(globalThis.debug_rm_idx) - 1])) {
                  actualrm = globalThis.debug_rm_idx;
                } else {
                  pline("Warning: themeroom '" + globalThis.themerooms[(globalThis.debug_rm_idx) - 1].name + "' is ineligible");
                }
            }
          globalThis.themerooms[(actualrm) - 1].contents();
          return;
        }
    else if (globalThis.debug_fill_idx != null) {
          let actualrm = lookup_by_name(percent(50) && "Default room with themed fill" || "default");
          globalThis.themerooms[(actualrm) - 1].contents();
          return;
        }
      let pick = null;
      let total_frequency = 0;
      {
          const __hi = globalThis.themerooms.length;
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            if ((type(globalThis.themerooms[(i) - 1]) != "table")) {
                  nh.impossible("themed room " + i + " is not a table");
                }
        else if (is_eligible(globalThis.themerooms[(i) - 1], null)) {
                  let this_frequency;
                  if ((globalThis.themerooms[(i) - 1].frequency != null)) {
                      this_frequency = globalThis.themerooms[(i) - 1].frequency;
                    } else {
                      this_frequency = 1;
                    }
                  total_frequency = total_frequency + this_frequency;
                  if (this_frequency > 0 && nh.rn2(total_frequency) < this_frequency) {
                      pick = i;
                    }
                }
          }
        }
      if (pick == null) {
          nh.impossible("no eligible themed rooms?");
          return;
        }
      globalThis.themerooms[(pick) - 1].contents();
    };
  globalThis.pre_themerooms_generate = () => {
      let debug_themerm = nh.debug_themerm(false);
      let debug_fill = nh.debug_themerm(true);
      let xtrainfo = "";
      globalThis.debug_rm_idx = lookup_by_name(debug_themerm, false);
      globalThis.debug_fill_idx = lookup_by_name(debug_fill, true);
      if (debug_themerm != null && globalThis.debug_rm_idx == null) {
          if (lookup_by_name(debug_themerm, true) != null) {
              xtrainfo = "; it is a fill type";
            }
          pline("Warning: themeroom '" + debug_themerm + "' not found in themerooms" + xtrainfo, true);
        }
      if (debug_fill != null && globalThis.debug_fill_idx == null) {
          if (lookup_by_name(debug_fill, false) != null) {
              xtrainfo = "; it is a room type";
            }
          pline("Warning: themeroom fill '" + debug_fill + "' not found in themeroom_fills" + xtrainfo, true);
        }
    };
  globalThis.post_themerooms_generate = () => {
    };
  globalThis.themeroom_fill = (rm) => {
      if (globalThis.debug_fill_idx != null) {
          if (is_eligible(globalThis.themeroom_fills[(globalThis.debug_fill_idx) - 1], rm)) {
              globalThis.themeroom_fills[(globalThis.debug_fill_idx) - 1].contents(rm);
            } else {
              pline("Warning: fill '" + globalThis.themeroom_fills[(globalThis.debug_fill_idx) - 1].name + "' is not eligible in room that generated it");
            }
          return;
        }
      let pick = null;
      let total_frequency = 0;
      {
          const __hi = globalThis.themeroom_fills.length;
          const __step = 1;
          for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            if ((type(globalThis.themeroom_fills[(i) - 1]) != "table")) {
                  nh.impossible("themeroom fill " + i + " must be a table");
                }
        else if (is_eligible(globalThis.themeroom_fills[(i) - 1], rm)) {
                  let this_frequency;
                  if ((globalThis.themeroom_fills[(i) - 1].frequency != null)) {
                      this_frequency = globalThis.themeroom_fills[(i) - 1].frequency;
                    } else {
                      this_frequency = 1;
                    }
                  total_frequency = total_frequency + this_frequency;
                  if (this_frequency > 0 && nh.rn2(total_frequency) < this_frequency) {
                      pick = i;
                    }
                }
          }
        }
      if (pick == null) {
          nh.impossible("no eligible themed room fills?");
          return;
        }
      globalThis.themeroom_fills[(pick) - 1].contents(rm);
    };
  globalThis.make_dig_engraving = async (data) => {
      let floors = selection.negate().filter_mapchar(".");
      let pos = floors.rndcoord(0);
      let tx = data.x - pos.x - 1;
      let ty = data.y - pos.y;
      let dig = "";
      if ((tx == 0 && ty == 0)) {
          dig = " here";
        } else {
          if ((tx < 0 || tx > 0)) {
              dig = string.format(" %i %s", math.abs(tx), (tx > 0) && "east" || "west");
            }
          if ((ty < 0 || ty > 0)) {
              dig = dig + string.format(" %i %s", math.abs(ty), (ty > 0) && "south" || "north");
            }
        }
      await des.engraving({ coord: pos, type: "burn", text: "Dig" + dig });
    };
  globalThis.make_garden_walls = async (data) => {
      let sel = data.sel.grow();
      await des.replace_terrain({ selection: sel, fromterrain: "w", toterrain: "T" });
      await des.replace_terrain({ selection: sel, fromterrain: "S", toterrain: "A" });
    };
  globalThis.make_a_trap = async (data) => {
      if ((data.teledest == 1 && data.type == "teleport")) {
          let locs = selection.negate().filter_mapchar(".");
          do {
              data.teledest = locs.rndcoord(1);
            } while (!((data.teledest.x != data.coord.x && data.teledest.y != data.coord.y)));
        }
      await des.trap(data);
    };
  globalThis.post_level_generate = () => {
      for (let __ip_i = 0; __ip_i < postprocess.length; __ip_i++) {
          const i = __ip_i + 1;
          const v = postprocess[__ip_i];
          v.handler(v.data);
        }
      postprocess = [];
    };
}
