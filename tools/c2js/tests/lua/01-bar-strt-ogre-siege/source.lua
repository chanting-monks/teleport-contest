-- From nethack-c/upstream/dat/Bar-strt.lua:94-98
-- Exercises: local decl, & (selection intersection metamethod via
-- __lua_band), for-num with constant bound, method call (:rndcoord),
-- table literal in args.
local ogrelocs = selection.floodfill(37,7) & selection.area(40,03, 45,20)
for i = 0, 11 do
   des.monster({ id = "ogre", coord = ogrelocs:rndcoord(1), peaceful = 0 })
end
