-- Multi-target local declaration.  Lua allows `local a, b = e1, e2`
-- (parallel) and `local a, b = f()` (multi-return spread).
-- This test exercises only the matched-count parallel form, which
-- maps cleanly to JS destructuring.  Adapted from a common Lua
-- coordinate-pair pattern.
function build_box(lo, hi)
   local x, y = lo, hi
   local w, h = 1, 1
   des.terrain({ x = x + w, y = y + h, typ = "." })
end
