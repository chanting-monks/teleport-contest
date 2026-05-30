// nhlib.js — AUTO-GENERATED from
// nethack-c/upstream/dat/nhlib.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ __lua_band, __lua_bor, des, math, nh, obj, pairs, selection, string, table, type }) {
  math.random = ((...__lua_varargs) => {
      let arg = [...__lua_varargs];
      if ((arg.length == 1)) {
              return 1 + nh.rn2(arg[0]);
            }
      else if ((arg.length == 2)) {
              return nh.random(arg[0], arg[1] + 1 - arg[0]);
            } else {
              globalThis.error("NetHack math.random requires at least one parameter");
            }
    });
  globalThis.shuffle = (list) => {
      {
          const __hi = 2;
          const __step = -1;
          for (let i = list.length; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
            let j = math.random(i);
            [list[(i) - 1], list[(j) - 1]] = [list[(j) - 1], list[(i) - 1]];
          }
        }
    };
  globalThis.align = ["law", "neutral", "chaos"];
  shuffle(globalThis.align);
  globalThis.d = (dice, faces) => {
      if ((faces == null)) {
          return math.random(1, dice);
        } else {
          let sum = 0;
          {
              const __hi = dice;
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                sum = sum + math.random(1, faces);
              }
            }
          return sum;
        }
    };
  globalThis.percent = (threshold) => {
      return math.random(0, 99) < threshold;
    };
  globalThis.monkfoodshop = () => {
      if ((globalThis.u.role == "Monk")) {
          return "health food shop";
        }
      return "food shop";
    };
  globalThis.hell_tweaks = async (protected_area) => {
      let liquid = "L";
      let ground = ".";
      let n_prot = protected_area.numpoints();
      let prot = protected_area.negate();
      if ((percent(20 + globalThis.u.depth))) {
          let pools = selection.new();
          let maxpools = 5 + math.random(globalThis.u.depth);
          {
              const __hi = maxpools;
              const __step = 1;
              for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
                pools.set();
              }
            }
          pools = __lua_bor(pools, selection.grow(selection.set(selection.new()), "west"));
          pools = __lua_bor(pools, selection.grow(selection.set(selection.new()), "north"));
          pools = __lua_bor(pools, selection.grow(selection.set(selection.new()), "random"));
          pools = __lua_band(pools, prot);
          if ((percent(80))) {
              let poolground = __lua_band(pools.clone().grow("all"), prot);
              let pval = math.random(1, 8) * 10;
              await des.terrain(poolground.percentage(pval), ground);
            }
          await des.terrain(pools, liquid);
        }
      if ((percent(50))) {
          let allrivers = selection.new();
          let reqpts = ((globalThis.nhc.COLNO * globalThis.nhc.ROWNO) - n_prot) / 12;
          let rpts = 0;
          let rivertries = 0;
          do {
              let floor = selection.match(ground);
              let a = selection.rndcoord(floor);
              let b = selection.rndcoord(floor);
              let lavariver = selection.randline(selection.new(), a.x, a.y, b.x, b.y, 10);
              if ((percent(50))) {
                  lavariver = selection.grow(lavariver, "north");
                }
              if ((percent(50))) {
                  lavariver = selection.grow(lavariver, "west");
                }
              allrivers = __lua_bor(allrivers, lavariver);
              allrivers = __lua_band(allrivers, prot);
              rpts = allrivers.numpoints();
              rivertries = rivertries + 1;
            } while (!(((rpts > reqpts) || (rivertries > 7))));
          if ((percent(60))) {
              let prc = 10 * math.random(1, 6);
              let riverbanks = selection.grow(allrivers);
              riverbanks = __lua_band(riverbanks, prot);
              await des.terrain(selection.percentage(riverbanks, prc), ground);
            }
          await des.terrain(allrivers, liquid);
        }
      if ((percent(20))) {
          let amount = 3 * math.random(1, 8);
          let bwalls = __lua_bor(selection.match(".w.").percentage(amount), selection.match(".\nw\n.").percentage(amount));
          bwalls = __lua_band(bwalls, prot);
          bwalls.iterate((async (x, y) => {
          await des.terrain(x, y, ".");
          await des.object("boulder", x, y);
        }));
        }
      if ((percent(20))) {
          let amount = 3 * math.random(1, 8);
          let fwalls = __lua_bor(selection.match(".w.").percentage(amount), selection.match(".\nw\n.").percentage(amount));
          fwalls = __lua_band(__lua_band(fwalls.grow(), selection.match("w")), prot);
          await des.terrain(fwalls, "F");
        }
    };
  globalThis.pline = (fmt, ...__lua_varargs) => {
      nh.pline(string.format(fmt, table.unpack([...__lua_varargs])));
    };
  globalThis.nh_set_variables_string = (key, tbl) => {
      return "nh_lua_variables[\"" + key + "\"]=" + table_stringify(tbl) + ";";
    };
  globalThis.nh_get_variables_string = (tbl) => {
      return "return " + table_stringify(tbl) + ";";
    };
  globalThis.table_stringify = (tbl) => {
      let str = "";
      for (const [key, value] of Object.entries(tbl)) {
          let typ = type(value);
          if ((typ == "table")) {
              str = str + "[\"" + key + "\"]=" + table_stringify(value);
            }
      else if ((typ == "string")) {
              str = str + "[\"" + key + "\"]=[[" + value + "]]";
            }
      else if ((typ == "boolean")) {
              str = str + "[\"" + key + "\"]=" + globalThis.tostring(value);
            }
      else if ((typ == "number")) {
              str = str + "[\"" + key + "\"]=" + value;
            }
      else if ((typ == "nil")) {
              str = str + "[\"" + key + "\"]=nil";
            }
          str = str + ",";
        }
      return "{" + str + "}";
    };
  let tutorial_blacklist_commands = { save: true };
  globalThis.tutorial_cmd_before = (cmd) => {
      if ((tutorial_blacklist_commands[(cmd) - 1])) {
          return false;
        }
      return true;
    };
  globalThis.tutorial_enter = () => {
      nh.callback("cmd_before", "tutorial_cmd_before");
      nh.callback("end_turn", "tutorial_turn");
      nh.gamestate();
    };
  globalThis.tutorial_leave = () => {
      nh.callback("cmd_before", "tutorial_cmd_before", true);
      nh.callback("end_turn", "tutorial_turn", true);
      nh.gamestate(true);
    };
  let tutorial_events = [{ func: (() => {
      if ((globalThis.u.uhunger < 148)) {
              let o = obj.new("blessed food ration");
              o.placeobj(globalThis.u.ux, globalThis.u.uy);
              nh.pline("Looks like you're getting hungry.  You'll starve to death, unless you eat something.", true);
              nh.pline("Comestibles are eaten with '" + nh.eckey("eat") + "'", true);
              return true;
            }
    }) }];
  globalThis.tutorial_turn = () => {
      for (const [k, v] of Object.entries(tutorial_events)) {
          if (((v.ucoord && globalThis.u.ux == v.ucoord[0] + 3 && globalThis.u.uy == v.ucoord[1] + 3) || (v.ucoord == null))) {
              if ((v.func() || v.remove)) {
                  tutorial_events[(k) - 1] = null;
                }
            }
        }
    };
}
