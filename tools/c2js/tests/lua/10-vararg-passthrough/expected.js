export default async function({  }) {
  globalThis.call_passthru = async (cb, ...__lua_varargs) => {
      if (cb) {
          await cb(...__lua_varargs);
        }
    };
}