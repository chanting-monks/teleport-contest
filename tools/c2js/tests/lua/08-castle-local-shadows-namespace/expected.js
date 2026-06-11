export default async function({ des, shuffle }) {
  let monster = ["L", "N", "E", "H", "M", "O", "R", "T", "X", "Z"];
  await shuffle(monster);
  await des.feature("fountain", 10, 8);
}