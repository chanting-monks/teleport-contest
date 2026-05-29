// wintty.js — runtime shims for the tty windowing system.
// upstream NetHack 5.0 declares these in include/wintty.h:
//   extern struct window_procs tty_procs;     // line 135
//   extern void win_tty_init(int);            // line 234
// and defines them in win/tty/wintty.c.  We don't translate the
// curses-based tty implementation (the contest renders to its own
// js/terminal.js), so the C-side references would otherwise emit as
// bare globals at module load.
//
// `windows.c` and other TUs reference tty_procs as part of the
// window-procs registry table.  Provide an empty placeholder; the
// engine doesn't read its fields during PRNG-faithful play, so the
// shape doesn't matter for parity.  win_tty_init is called from
// chargen and is a no-op for our purposes.
export const tty_procs = {};
export function win_tty_init(_dir) {}
