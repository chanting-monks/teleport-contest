export default async function({ des, math }) {
  let place = [[2, 11], [42, 9]];
  let placeidx = math.random(1, place.length);
  await des.stair({ dir: "up", coord: place[(placeidx) - 1] });
  place = [[22, 14], [30, 10], [22, 6], [14, 10]];
  placeidx = math.random(1, place.length);
  await des.terrain(place[(placeidx) - 1], ".");
  place = [[22, 4], [35, 10], [22, 16], [9, 10]];
  placeidx = math.random(1, place.length);
  await des.terrain(place[(placeidx) - 1], ".");
}