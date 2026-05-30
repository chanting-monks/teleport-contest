-- Provides the module-level `themerooms` that the snippet iterates.
-- The snippet only reads `themerooms[i].frequency` (nil) and calls
-- `type(themerooms[i]) ~= "table"`; populate with 3 tables so the
-- for-loop iterates 3× firing the PRNG calls the snippet emits.
themerooms = { {}, {}, {} };
function is_eligible(r, m) return true; end
