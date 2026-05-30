export default async function({ __lua_band, des, selection }) {
  let ogrelocs = __lua_band(selection.floodfill(37, 7), selection.area(40, 3, 45, 20));
  {
      const __hi = 11;
      const __step = 1;
      for (let i = 0; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        await des.monster({ id: "ogre", coord: ogrelocs.rndcoord(1), peaceful: 0 });
      }
    }
}