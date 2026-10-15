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
| S03 | Second setup leaves tracked files unchanged and reports them unchanged | `setup is idempotent on a second run` |
| S04 | Changed file outside scope is reported as uncovered | `unmapped change is reported as uncovered and inconclusive` |
| S06 | Skill scripts run from an isolated copy | `skill installs and runs alone from an isolated copy` |
| S07 | A user edit with an unchanged template is `user_owned`, not a conflict | `setup keeps a user edit as user_owned while the template is unchanged` |
| S08 | A user edit is a conflict only when the template also changed | `a user edit becomes a conflict only when the template also changed` |
| S09 | A removed example is not recreated | `setup does not recreate the example after the user removed it` |
| S10 | The example is not created when a contract already exists | `setup does not create the example when a contract already exists` |
| S11 | Setup reports discovery candidates and says what it did not choose | `setup reports discovery candidates and states what it did not choose` |
| S12 | Discover lists asv, pytest, Bazel test and CI candidates without running them | `discover finds asv, pytest, bazel and workflow candidates without running them` |
| S13 | Setup does not adopt an identical file it never managed | `setup does not adopt an identical file it never managed` |
| P01 | Quadratic matcher with unchanged output fails on counters | `quadratic matcher fails the counter budget with unchanged output` |
| P02 | Legitimate n log n sorting passes its declared shape | `clean fixture passes, including the legitimate n log n sort` |
| P03 | Faster output that drops records fails the oracle | `dropped output fails the oracle` |
| P08 | A constant-shaped budget is checked at every declared size | `constant-shaped budgets are accepted and checked at every declared size` |
| P06 | Hanging command reports a timeout and no partial fit | `timeout is an error, never a partial fit` |
| N01 | Each fixture negative control violates its own metric; repository unchanged apart from artifacts | `discriminate detects each fixture negative control on its own metric` |
| N02 | A control that does not move its metric fails discrimination | `a negative control that does not move its metric fails discrimination` |
| N03 | A counter no run moves is reported as `insensitive_counter` | `a counter that no run moves is reported as insensitive` |
| N04 | An enabled contract without a negative control for an assertion is rejected | `enabled contracts must declare a negative control for every assertion` |
| N05 | An ambiguous negative-control anchor is rejected | `a negative control anchor must occur exactly once` |
| N06 | A control that breaks the run is an error, not a blind gate | `a negative control that breaks the run is an error, not a blind gate` |
| N07 | A control file that resolves outside the repository is rejected and nothing outside is written | `a negative control file that resolves outside the repository is rejected` |
| — | Placeholder contracts cannot be enabled | `enabled contract with placeholders is rejected by validate` |

The fixture's negative controls are two `synthetic` counter changes and one
`regression` change (dropped output). The synthetic controls prove the counters
are wired; they do not show that a real regression would be caught.

Not implemented in v1: P04 (warm-cache invalidation), P05 (noisy-runner timing
classification), P07 (repeated decode attribution), and the agent comparison pilot.

Not demonstrated: that a real iteration-count regression in a native
implementation is caught. In a target project, tolerance and initialization changes
either left the iteration count unchanged or changed the result itself, so an
iteration counter has only been checked with a synthetic `+1` change.
