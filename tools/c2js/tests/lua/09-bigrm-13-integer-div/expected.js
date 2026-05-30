export default async function({ des, math }) {
  globalThis.filters = [((x, y) => {
      return (Math.floor((x + 1) / 3) == y);
    }), ((x, y) => {
      return ((x / 3) % 2 == y % 2);
    })];
  globalThis.idx = math.random(1, globalThis.filters.length);
  {
      const __hi = 2;
      const __step = 1;
      for (let y = 0; __step > 0 ? y <= __hi : y >= __hi; y += __step) {
        {
              const __hi = 6;
              const __step = 1;
              for (let x = 0; __step > 0 ? x <= __hi : x >= __hi; x += __step) {
                if ((globalThis.filters[(globalThis.idx) - 1](x, y))) {
                      await des.terrain(x, y, ".");
                    }
              }
            }
      }
    }
}