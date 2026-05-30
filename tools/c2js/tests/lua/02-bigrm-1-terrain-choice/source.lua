-- From nethack-c/upstream/dat/bigrm-1.lua:30-42
-- Exercises: if/elseif, percent(), math.random with two args, #table
-- length operator, table literal, 1-indexed [tidx] (variable subscript),
-- | (selection union via __lua_bor), local with bitwise expr.
if percent(80) then
   local terrains = { "-", "F", "L", "T", "C" };
   local tidx = math.random(1, #terrains);
   local choice = math.random(0, 5);
   if choice == 0 then
      des.terrain(selection.line(10,8, 65,8), terrains[tidx]);
   elseif choice == 1 then
      local sel = selection.line(15,4, 15, 13) | selection.line(59,4, 59, 13);
      des.terrain(sel, terrains[tidx]);
   end
end
