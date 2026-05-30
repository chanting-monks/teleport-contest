-- From nethack-c/upstream/dat/castle.lua:54-58
-- Exercises: a local with the same name as an ALLOWED_NAMESPACE
-- (`monster`).  Renderer must EXCLUDE `monster` from the env
-- destructure so the `let monster = ...` doesn't collide with the
-- function-param destructure.  Also exercises shuffle on a
-- string-array and array-literal of single-char strings.
local monster = { "L", "N", "E", "H", "M", "O", "R", "T", "X", "Z" }
shuffle(monster)
des.feature("fountain", 10, 08)
