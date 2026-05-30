-- From nethack-c/upstream/dat/themerms.lua:104-112 (Trap room)
-- Exercises: method-call chain (selection.room():percentage(30)),
-- shuffle (mutates Lua array, depends on 0-indexed JS access),
-- anonymous function with captured upvalue (traps), 1-indexed
-- subscript traps[1] (literal, must become traps[0]).
local traps = { "arrow", "dart", "falling rock", "bear",
                "land mine", "sleep gas", "rust",
                "anti magic" };
shuffle(traps);
local locs = selection.room():percentage(30);
local func = function(x,y)
   des.trap(traps[1], x, y);
end
locs:iterate(func);
