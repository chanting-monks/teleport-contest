-- From nethack-c/upstream/dat/bigrm-13.lua:44-60 (condensed)
-- Exercises: array of anonymous functions, Lua // (integer division
-- — must NOT emit as JS `//` which would be a comment), implicit
-- global write (idx = ...), nested for-num loops with constant
-- bounds, dynamic dispatch (filters[idx](x, y) — variable-subscript
-- call with -1 translation), arithmetic mod (%).
filters = {
   function(x, y) return ((x+1)//3 == y); end,
   function(x, y) return ((x/3)%2 == y%2); end,
};

idx = math.random(1, #filters);

for y = 0,2 do
   for x = 0,6 do
      if (filters[idx](x, y)) then
         des.terrain(x, y, ".");
      end
   end
end
