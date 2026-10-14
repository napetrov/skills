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

Not implemented in v1: O04 (indirect support code), O06 (authorization isolation),
O07 (module rename repair), O08 (async completion), X01 (shared outcome across
both skills), and the agent comparison pilot.
