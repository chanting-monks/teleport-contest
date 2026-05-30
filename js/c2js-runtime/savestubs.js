// savestubs.js — runtime stubs for save / system-shell / mail
// functions defined in TUs we intentionally don't translate
// (src/save.c, sys/unix/unixmain.c, src/mail.c, src/cfgfiles.c).
//
// cmd.c's extcmdlist[] is a static initializer that stores these
// function references in an array at module load.  The PRNG-faithful
// game path never invokes them — they fire only on user request
// (#save, #shell, #suspend, #bugreport).  The stubs let cmd.js's
// module load complete; if a real test exercises one of these
// commands, replace the stub with a translation of the underlying
// TU.  C ref: src/save.c:43 dosave, src/cfgfiles.c
// do_write_config_file, sys/unix/unixmain.c dosh_core / dosuspend_core,
// src/mail.c dobugreport.
export function dosave(_arg) { return 0; }
export function do_write_config_file(_arg) { return 0; }
export function dosh_core(_arg) { return 0; }
export function dosuspend_core(_arg) { return 0; }
export function dobugreport(_arg) { return 0; }
