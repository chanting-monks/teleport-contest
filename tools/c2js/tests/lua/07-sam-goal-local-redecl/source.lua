-- From nethack-c/upstream/dat/Sam-goal.lua:33-54 (condensed)
-- Exercises: Lua same-scope local redeclaration (4 successive
-- `local place = ...`) — JS `let` would throw; renderer must emit
-- the 2nd+ as plain assignments.  Also: nested table literal (array
-- of {x,y} pairs), 1-indexed [placeidx] (variable subscript).
local place = { {02,11},{42,09} }
local placeidx = math.random(1, #place);
des.stair({ dir = "up", coord = place[placeidx] })

local place = { {22,14},{30,10},{22, 6},{14,10} }
local placeidx = math.random(1, #place);
des.terrain(place[placeidx], ".")

local place = { {22, 4},{35,10},{22,16},{ 9,10} }
local placeidx = math.random(1, #place);
des.terrain(place[placeidx], ".")
