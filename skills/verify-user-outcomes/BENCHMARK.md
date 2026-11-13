# Benchmark Status

- Skill: `verify-user-outcomes`
- Version: `0.1.0`
- Status: deterministic acceptance only; agent eval pilot NOT RUN

## Deterministic Acceptance Cases

Run by `npm test` (`tests/contracts.test.js`) against the Node fixture
`fixtures/node-outcome-target`. Mutants are applied only to disposable copies.

| Case | Expectation | Test |
| --- | --- | --- |
| O01 | Valid journey with an asserted output passes | `clean fixture passes all outcome evidence` |
| O02 | Result computed but disconnected from the consumer fails at the CLI | `disconnected consumer output fails the outcome` |
| O03 | Selector matching zero tests is an error, never a pass | `zero-test selector is an error` |
| — | Behavior that contradicts an acceptance condition fails | `silent comparison of incomparable data fails the outcome` |
| — | Stale references are reported as stale mappings | `stale implementation reference is reported as a stale mapping` |
| O05 | Incomparable measurements are flagged, not compared | covered by `clean fixture passes all outcome evidence` (the incomparable evidence id passes) |

### pytest plugin

Run by `npm test` (`tests/pytest-outcomes.test.js`) against the Python fixture
`fixtures/python-outcome-target`, whose contracts live in `tests/contracts/`.
Skipped when pytest is not installed; CI installs it.

| Case | Expectation | Test |
| --- | --- | --- |
| PY01 | Clean fixture passes with a complete result envelope | `clean fixture passes and writes a complete result envelope` |
| PY02 | Broken calendar order fails its evidence id only | `a broken promise fails its evidence id` |
| PY03 | Unclaimed or deselected evidence is an error, never a pass | `an evidence id that no test claims is an error, never a pass`, `deselecting the evidence with -k makes it unclaimed, not passed` |
| PY04 | All claimed tests skipped is inconclusive | `evidence whose every test was skipped is inconclusive` |
| PY05 | Failed setup fails the evidence | `a failed fixture setup fails the evidence it guards` |
| PY06 | Unknown heading anchor is a stale mapping | `a reference to an unknown heading is a stale mapping` |
| PY07 | Contracts dir from flag, ini or `CONTRACTS_DIR`; outside the repo is rejected | `the contracts dir comes from the ini file or CONTRACTS_DIR as well`, `a contracts dir outside the repository is a usage error` |

Not implemented in v1: O04 (indirect support code), O06 (authorization isolation),
O07 (module rename repair), O08 (async completion), X01 (shared outcome across
both skills), and the agent comparison pilot.
