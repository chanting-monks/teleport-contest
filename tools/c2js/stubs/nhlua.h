/* nhlua.h — stub for the c2js translator.
 *
 * The real nhlua.h lives in lib/lua-5.4.8/src (a submodule we don't
 * check out on this branch).  Phase 9 of the c2js plan replaces this
 * stub with a proper Lua bridge.
 *
 * For now we provide just enough so NetHack source files that
 * mention `lua_State *` etc. parse cleanly.  Types defined in
 * NetHack's own include/global.h (nhl_sandbox_info, NHL_pcall_action)
 * are NOT redefined here.
 */

#ifndef NHJS_STUB_NHLUA_H
#define NHJS_STUB_NHLUA_H

/* Opaque Lua VM handle.  NetHack passes `lua_State *` around without
 * dereferencing, so an empty forward declaration is enough. */
typedef struct lua_State lua_State;
typedef int (*lua_CFunction)(lua_State *);
typedef long lua_Integer;
typedef double lua_Number;

/* Lua API constants used in NetHack source.  Values from Lua 5.4. */
#define LUA_GCCOLLECT       2
#define LUA_GCSTOP          0
#define LUA_GCRESTART       1
#define LUA_GCCOUNT         3
#define LUA_GCSTEP          5
#define LUA_REGISTRYINDEX   (-1001000)
#define LUA_TNONE           (-1)
#define LUA_TNIL            0
#define LUA_TBOOLEAN        1
#define LUA_TNUMBER         3
#define LUA_TSTRING         4
#define LUA_TTABLE          5
#define LUA_TFUNCTION       6
#define LUA_TUSERDATA       7
#define LUA_TTHREAD         8

/* Lua API functions stub-declared so call sites parse.  Bodies live
 * in nhlua.c (untranslated) or in js/c2js-runtime/lua.js once Phase
 * 9 lands. */
extern void lua_getglobal(lua_State *, const char *);
extern int  lua_pcall(lua_State *, int, int, int);
extern void lua_pushinteger(lua_State *, lua_Integer);
extern void lua_pushstring(lua_State *, const char *);
extern void lua_pushvalue(lua_State *, int);
extern void lua_settop(lua_State *, int);
extern int  lua_gettop(lua_State *);
extern int  lua_isnumber(lua_State *, int);
extern int  lua_isnil(lua_State *, int);
extern int  lua_type(lua_State *, int);
extern int  lua_gc(lua_State *, int, ...);
extern lua_Integer lua_tointeger(lua_State *, int);
extern const char *lua_tostring(lua_State *, int);

/* lauxlib.h surface used in sp_lev.c et al. */
typedef struct luaL_Reg {
    const char *name;
    lua_CFunction func;
} luaL_Reg;
extern void luaL_setfuncs(lua_State *, const luaL_Reg *, int);

#endif /* NHJS_STUB_NHLUA_H */
