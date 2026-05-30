-- From nethack-c/upstream/dat/themerms.lua:1090-1097
-- Exercises: top-level function declaration (becomes globalThis.X),
-- for-in with ipairs (renderer emits 0-indexed JS loop with body
-- using 1-indexed `i`), field access on iter value (v.handler,
-- v.data), implicit global write (postprocess = {} reassigns the
-- module-level global), empty table literal.
function post_level_generate()
   for i, v in ipairs(postprocess) do
      v.handler(v.data);
   end
   postprocess = { };
end
