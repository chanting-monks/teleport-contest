// nhcore.js — AUTO-GENERATED from
// nethack-c/upstream/dat/nhcore.lua.  Do NOT edit by hand.
// Regenerate via tools/c2js/build-dat-bundle.mjs.
// Category: jsmodule.
export default async function({ nh, pairs, table, type }) {
  globalThis.nh_lua_variables = [];
  globalThis.get_variables_string = () => {
      return "nh_lua_variables=" + globalThis.table_stringify(globalThis.nh_lua_variables) + ";";
    };
  globalThis.nh_callback_set = (cb, fn) => {
      let cbname = "_CB_" + cb;
      if ((type(globalThis.nh_lua_variables[(cbname) - 1]) != "table")) {
          globalThis.nh_lua_variables[(cbname) - 1] = [];
        }
      globalThis.nh_lua_variables[(cbname) - 1][(fn) - 1] = true;
    };
  globalThis.nh_callback_rm = (cb, fn) => {
      let cbname = "_CB_" + cb;
      if ((type(globalThis.nh_lua_variables[(cbname) - 1]) != "table")) {
          globalThis.nh_lua_variables[(cbname) - 1] = [];
        }
      globalThis.nh_lua_variables[(cbname) - 1][(fn) - 1] = null;
    };
  globalThis.nh_callback_run = (cb, ...__lua_varargs) => {
      let cbname = "_CB_" + cb;
      if ((type(globalThis.nh_lua_variables[(cbname) - 1]) != "table")) {
          globalThis.nh_lua_variables[(cbname) - 1] = [];
        }
      for (const [k, v] of Object.entries(globalThis.nh_lua_variables[(cbname) - 1])) {
          if ((!globalThis._G[(k) - 1](table.unpack([...__lua_varargs])))) {
              return false;
            }
        }
      return true;
    };
  let prev_dgl_extrainfo = 0;
  globalThis.mk_dgl_extrainfo = () => {
      if (((prev_dgl_extrainfo == 0) || (prev_dgl_extrainfo + 50 < globalThis.u.moves))) {
          let filename = nh.dump_fmtstr("/tmp/nethack.%n.%d.log");
          let [extrai, err] = globalThis.io.open(filename, "w");
          if (extrai) {
              let sortval = 0;
              let dname = nh.dnum_name(globalThis.u.dnum);
              let dstr = "";
              let astr = " ";
              if (globalThis.u.uhave_amulet == 1) {
                  sortval = sortval + 1024;
                  astr = "A";
                }
              if (dname == "Fort Ludios") {
                  dstr = "Knx";
                  sortval = sortval + 245;
                }
        else if (dname == "The Quest") {
                  dstr = "Q" + globalThis.u.dlevel;
                  sortval = sortval + 250 + globalThis.u.dlevel;
                }
        else if (dname == "The Elemental Planes") {
                  dstr = "End";
                  sortval = sortval + 256;
                }
        else if (dname == "Vlad's Tower") {
                  dstr = "T" + globalThis.u.dlevel;
                  sortval = sortval + 235 + globalThis.u.depth;
                }
        else if (dname == "Sokoban") {
                  dstr = "S" + globalThis.u.dlevel;
                  sortval = sortval + 225 + globalThis.u.depth;
                }
        else if (dname == "The Gnomish Mines") {
                  dstr = "M" + globalThis.u.dlevel;
                  sortval = sortval + 215 + globalThis.u.dlevel;
                } else {
                  dstr = "D" + globalThis.u.depth;
                  sortval = sortval + globalThis.u.depth;
                }
              let str = sortval + "|" + astr + " " + dstr;
              extrai.write(str);
              extrai.close();
            } else {
              nh.pline("Failed to open dgl extrainfo file: " + err);
            }
          prev_dgl_extrainfo = globalThis.u.moves;
        }
    };
  globalThis.show_getpos_tip = () => {
      nh.text("Tip: Farlooking or selecting a map location\n\nYou are now in a \"farlook\" mode - the movement keys move the cursor,\nnot your character.  Game time does not advance.  This mode is used\nto look around the map, or to select a location on it.\n\nWhen in this mode, you can press ESC to return to normal game mode,\nand pressing ? will show the key help.\n");
    };
  globalThis.nhcore = { getpos_tip: show_getpos_tip, enter_tutorial: globalThis.tutorial_enter, leave_tutorial: globalThis.tutorial_leave };
}
