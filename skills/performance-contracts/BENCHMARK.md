# Benchmark Status

- Skill: `performance-contracts`
- Version: `0.1.0`
- Status: deterministic acceptance only; agent eval pilot NOT RUN

## Deterministic Acceptance Cases

Run by `npm test` (`tests/contracts.test.js`) against the Python fixture
`fixtures/python-perf-target`. Mutants are applied only to disposable copies.

| Case | Expectation | Test |
| --- | --- | --- |
| S01 | Setup creates config, example contract, and lock | `setup creates config, example contract and lock` |
| S03 | Second setup leaves tracked files unchanged | `setup is idempotent on a second run` |
| S04 | Changed file outside scope is reported as uncovered | `unmapped change is reported as uncovered and inconclusive` |
| S06 | Skill scripts run from an isolated copy | `skill installs and runs alone from an isolated copy` |
| P01 | Quadratic matcher with unchanged output fails on counters | `quadratic matcher fails the counter budget with unchanged output` |
| P02 | Legitimate n log n sorting passes its declared shape | `clean fixture passes, including the legitimate n log n sort` |
| P03 | Faster output that drops records fails the oracle | `dropped output fails the oracle` |
| P06 | Hanging command reports a timeout and no partial fit | `timeout is an error, never a partial fit` |
| — | Placeholder contracts cannot be enabled | `enabled contract with placeholders is rejected by validate` |

Not implemented in v1: P04 (warm-cache invalidation), P05 (noisy-runner timing
classification), P07 (repeated decode attribution), and the agent comparison pilot.
