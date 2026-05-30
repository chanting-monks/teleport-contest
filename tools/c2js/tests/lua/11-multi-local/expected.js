export default async function({ des }) {
  globalThis.build_box = async (lo, hi) => {
      let [x, y] = [lo, hi];
      let [w, h] = [1, 1];
      await des.terrain({ x: x + w, y: y + h, typ: "." });
    };
}