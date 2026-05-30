export default async function({  }) {
  globalThis.call_passthru = (cb, ...__lua_varargs) => {
      if (cb) {
          cb(...__lua_varargs);
        }
    };
}