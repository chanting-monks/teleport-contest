export default async function({ __lua_bor, des, math, percent, selection }) {
  if (percent(80)) {
      let terrains = ["-", "F", "L", "T", "C"];
      let tidx = math.random(1, terrains.length);
      let choice = math.random(0, 5);
      if (choice == 0) {
          await des.terrain(selection.line(10, 8, 65, 8), terrains[(tidx) - 1]);
        }
    else if (choice == 1) {
          let sel = __lua_bor(selection.line(15, 4, 15, 13), selection.line(59, 4, 59, 13));
          await des.terrain(sel, terrains[(tidx) - 1]);
        }
    }
}