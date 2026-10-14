# Contract Skills: Design Note

This note records the first implementation of the `performance-contracts` and
`verify-user-outcomes` skills. It states what is built, what was verified, and
where the implementation departs from the handoff specification.

## Shape

- Two skills, each self-contained. Each carries its own `scripts/contract-core.js`
  and schema copies. `tools/sync-contract-assets.js --check` runs in `npm test`
  and fails if a copy drifts from its source.
- The shared runtime (`tools/contracts/contract-core.js`) owns the result envelope,
  verdict aggregation, config loading, diff-base resolution, argument-array command
  execution, redaction, and setup scaffolding with conflict detection.
- The Python performance fixture and the Node outcome fixture live under `fixtures/`.
  They are target-shaped projects and are not part of the npm package.
- Deterministic acceptance cases live in `tests/contracts.test.js`. Deliberate
  violations are applied to disposable copies, never to the fixtures.

## Decisions

- Performance gates use deterministic counters. Wall time is recorded as advisory.
- Budgets are declared as coefficient times a named shape (`linear`, `n_log_n`,
  `quadratic`). No expression language and no `eval`.
- Baseline references must match `<name>-v<N>`. The name `latest` is rejected.
- Outcome evidence is matched by a bracketed id in the test name. Zero matches
  are errors. Skipped matches are inconclusive.
- Readiness is derived from files and the most recent run. The helper reports
  `unconfigured`, `discovered`, or `instrumented`. It does not infer
  `validated`, `integrated`, or `enforced`.
- `setup` writes only files it manages. Files the user edited are reported as
  conflicts and are not overwritten.

## Deviations From The Handoff Specification

- **No `evals/` directory.** `AGENTS.md` and the package validators forbid it in
  this repository's first version. Eval task definitions are represented by the
  deterministic cases in each skill's `BENCHMARK.md`.
- **JSON Schema is documentary.** The repository has no dependencies, so the
  schema files describe the contract and the runtime checks enforce the subset
  that matters (enabled-contract completeness, placeholder markers, envelope
  fields, verdict consistency). The schemas are not validated by a full JSON Schema engine.
- **No `docs/engineering/contracts.md` in target repositories.** The fixture
  README and the skill references cover the same ground for v1.
- **Python fixture uses `python3` in its command.** A Windows runner without
  `python3` skips the Python-dependent tests and reports the skip. It does not
  count them as passed.

## Not Done In This Release

- Agent comparison pilot (A/B paired runs, cost and quality measurement) has not been run.
- P04 (warm-cache invalidation), P05 (noisy-runner classification), P07 (repeated
  decode attribution), and O04, O06, O07, O08 are not implemented.
- M7 (ABI-check and AIReady integration) requires access to those repositories and
  was not attempted.
- Branch protection and required-check enforcement were not verified. The
  repository's own CI runs the deterministic suite; the fixture CI example
  (`fixtures/python-perf-target/ci-example/contracts.workflow.example.yml`) is not active.

## Verification Performed

- `npm run build`, `npm test` (41 tests, including the fixture integrations and
  the discrimination cases), `npm run smoke:install`, and the package allowlist.
- Manual end-to-end runs of both adapters against git copies of the fixtures:
  clean pass, quadratic and dropped-output failures, disconnected and silent
  outcome failures, and the zero-test selector error.
