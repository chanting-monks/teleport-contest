-- From nethack-c/upstream/dat/themerms.lua:155-168 (Buried zombies)
-- Exercises: multi-assign with subscript LHS (zombifiable[5], [6] =
-- both must become [4], [5] in JS), for-num with expression bound
-- (must be hoisted), shuffle mutation, 1-indexed literal access
-- (zombifiable[1]), method call (o:stop_timer).
local diff = nh.level_difficulty();
local zombifiable = { "kobold", "gnome", "orc", "dwarf" };
if diff > 3 then
   zombifiable[5], zombifiable[6] = "elf", "human";
   if diff > 6 then
      zombifiable[7], zombifiable[8] = "ettin", "giant";
   end
end
for i = 1, (rm.width * rm.height) / 2 do
   shuffle(zombifiable);
   local o = des.object({ id = "corpse", montype = zombifiable[1], buried = true });
   o:stop_timer("rot-corpse");
end
