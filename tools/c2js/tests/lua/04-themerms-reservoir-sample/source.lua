-- From nethack-c/upstream/dat/themerms.lua:953-963
-- Exercises: for-num with #table as bound, type(t) ~= "string"
-- (loose !=), nil check (~= nil), Lua string concat .., table
-- field access with variable subscript ([i] → [(i)-1]), implicit
-- global call (themerooms is module-level), nested if/elseif.
local pick = nil;
local total_frequency = 0;
for i = 1, #themerooms do
   if (type(themerooms[i]) ~= "table") then
      nh.impossible('themed room '..i..' is not a table')
   elseif is_eligible(themerooms[i], nil) then
      local this_frequency;
      if (themerooms[i].frequency ~= nil) then
         this_frequency = themerooms[i].frequency;
      end
   end
end
