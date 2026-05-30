export default async function({ ipairs }) {
  globalThis.post_level_generate = () => {
      for (let __ip_i = 0; __ip_i < globalThis.postprocess.length; __ip_i++) {
          const i = __ip_i + 1;
          const v = globalThis.postprocess[__ip_i];
          v.handler(v.data);
        }
      globalThis.postprocess = [];
    };
}