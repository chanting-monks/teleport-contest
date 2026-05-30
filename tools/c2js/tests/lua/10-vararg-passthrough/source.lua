-- From nethack-c/upstream/dat/nhcore.lua:39-46 — call-passthrough
-- pattern.  Vararg in function params, used as call argument.
-- The body conditional + global-table lookup is reduced to a
-- minimal passthrough so the test exercises ONLY the vararg
-- parser/renderer surface.
function call_passthru(cb, ...)
   if cb then cb(...) end
end
