export default async function({ des, selection, shuffle }) {
  let traps = ["arrow", "dart", "falling rock", "bear", "land mine", "sleep gas", "rust", "anti magic"];
  shuffle(traps);
  let locs = selection.room().percentage(30);
  let func = (async (x, y) => {
      await des.trap(traps[0], x, y);
    });
  locs.iterate(func);
}