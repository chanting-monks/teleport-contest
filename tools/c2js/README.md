# tools/c2js

The C-to-readable-JS transpiler for the `transport` branch.

See `docs/TRANSPORT.md` for the design and phase plan, and
`docs/PORTING_SPEC.md` for the architectural target the output must
satisfy.

## Layout

- `c2js.config.mjs` — paths, platform defines, frozen-file list.
- `build.mjs` — CLI dispatcher.  `--conformance`, `--self-test`,
  `--print-config`.
- `conformance.mjs` — the nine-check spec-conformance pass.
- `tests/` — synthetic round-trip tests (Phase 0+).
- `prepare.mjs` (Phase 1+) — cpp + patch application.
- `parser.mjs` (Phase 1+) — clang AST dump wrapper.
- `translate.mjs` (Phase 1+) — AST walker → JS emitter.

## Usage

```bash
node tools/c2js/build.mjs --print-config
node tools/c2js/build.mjs --self-test
node tools/c2js/build.mjs --conformance
```

The conformance pass is the gate at every phase boundary: it must
report `9/9 checks green` before the phase commit lands.
