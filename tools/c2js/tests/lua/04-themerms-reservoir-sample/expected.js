export default async function({ nh, type }) {
  let pick = null;
  let total_frequency = 0;
  {
      const __hi = globalThis.themerooms.length;
      const __step = 1;
      for (let i = 1; __step > 0 ? i <= __hi : i >= __hi; i += __step) {
        if ((type(globalThis.themerooms[(i) - 1]) != "table")) {
              nh.impossible("themed room " + i + " is not a table");
            }
      else if (globalThis.is_eligible(globalThis.themerooms[(i) - 1], null)) {
              let this_frequency;
              if ((globalThis.themerooms[(i) - 1].frequency != null)) {
                  this_frequency = globalThis.themerooms[(i) - 1].frequency;
                }
            }
      }
    }
}