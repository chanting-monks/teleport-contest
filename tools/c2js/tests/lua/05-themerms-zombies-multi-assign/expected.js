export default async function({ des, nh, shuffle }) {
  let diff = nh.level_difficulty();
  let zombifiable = ["kobold", "gnome", "orc", "dwarf"];
  if (diff > 3) {
      [zombifiable[4], zombifiable[5]] = ["elf", "human"];
      if (diff > 6) {
          [zombifiable[6], zombifiable[7]] = ["ettin", "giant"];
        }
    }
  {
      const __hi = (globalThis.rm.width * globalThis.rm.height) / 2;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await shuffle(zombifiable);
        let o = des.object({ id: "corpse", montype: zombifiable[0], buried: true });
        o.stop_timer("rot-corpse");
      }
    }
}