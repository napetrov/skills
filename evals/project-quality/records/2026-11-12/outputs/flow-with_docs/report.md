# Scan-comparison assessment

The CLI promise is broken at presentation: the helper computes the correct two changes, but `src/cli.js:23` iterates over `[]` instead of `result.changes`. The CLI exits successfully and prints only comparability and the count. The existing consumer-level test already detects this defect. Merge enforcement is unknown, not established by an enabled outcome contract.

## Scope and evidence

Assessed only the supplied `flow` repository, revision `f39747ac417c389b28dd9fb834b4d73a689f4cb4`, clean working tree at inspection, on 2026-11-12. Read all tracked project files, including task, source, fixture, tests, journey and `.verification` contracts. No source changes, dependencies installed, network requests, history review, external CI runs or branch/ruleset inspection. The consumer is a business owner using the CLI to compare existing completed measurements of one authorized project. Authorization is a documented precondition; enforcement is not demonstrated in this local fixture.

Every path/line below refers to this revision.

| ID | Evidence | Implemented / configured / executed / enforced |
|---|---|---|
| E01 | `docs/journeys.md:5-13`; `.verification/contracts/outcomes/OUTCOME-SCAN-COMPARE.json:3-26` define result, limitations, reuse and four evidence IDs | Intent and metadata implemented; no observed CI execution or enforcement |
| E02 | `src/compare.js:2-22`; `data/measurements.json:3-6` | Real comparison computes modified `src/a.js`, delta 3, and added `src/c.js`, lines 7; exact helper assertion executed successfully (E06) |
| E03 | `src/cli.js:19-25` | Helper result consumed, but empty array at line 23 discards detail rendering; executed failure in E05 |
| E04 | `tests/scan-compare.test.js:21-47`; `package.json:7`; `.verification/contracts/config.json:5-17` | Four tests implemented; package and contract command configured. No CI workflow found in inspected files; enforced unknown |
| E05 | Local command `node --test --test-reporter=tap tests/scan-compare.test.js` | Node v24.22.1, Linux local workspace; 4 selected/executed, 3 passed, 1 failed, 0 skipped/cancelled/todo; exit 1; TAP duration 304.510294 ms; no random seed. Happy-path fails at test line 25; other three pass |
| E06 | Read-only inline Node import of `MeasurementStore` and `compareMeasurements`, followed by `assert.deepEqual` against fixture-derived full expected result and `assert.equal(store.scanCount,0)` | 1 helper scenario, two assertions passed, exit 0; separate runner count unavailable; shell tool elapsed 30.8 ms for combined helper and CLI invocation; no seed |
| E07 | `node src/cli.js compare m-1 m-2` | Exit 0; stdout `Comparable: yes\nChanged files: 2\n`; no detail lines |

Execution artifacts are reproduced here; no remote run URL exists. E06 expected and observed result:

```json
{"comparable":true,"reason":null,"changes":[{"path":"src/a.js","type":"modified","delta":3},{"path":"src/c.js","type":"added","lines":7}],"limitations":[]}
```

E05 failure: expected `/modified src\/a\.js \(\+3 lines\)/`, actual `Comparable: yes\nChanged files: 2\n`. The added-file assertion is after that failure and was not reached in that test; source and E07 establish both details are omitted.

## Consumer traces

| Promise | Boundary → implementation → assertion → result | Missing link |
|---|---|---|
| Selected measurements yield changes | CLI compare m-1 m-2 → store reads → helper computes two changes → CLI renderer → test lines 21-27 checks content | Presentation drops computed entries; test fails despite exit 0 |
| Incomparable data is identified | CLI m-1 m-3 → helper fingerprint check lines 5-10 → renderer lines 27-28 → test lines 29-34 | Executed pass; test checks reason/no changes but not explanatory limitation text |
| Reuse and reject incomplete measurement | Helper m-1 m-2 → store scanCount remains zero → test lines 36-41; CLI m-1 m-4 → store lines 8-12 throws → CLI lines 34-38 exits 2 → test lines 43-47 | Both pass; reuse is asserted at helper boundary, not instrumented across the CLI |

## Category review

| Category | Existing mechanism / evidence | Gap and impact / applicability |
|---|---|---|
| Intent and usability | Journey and outcome E01; actual CLI tests E04 | Applicable: desired result absent. No usability study evidence; tests cannot establish comprehensibility |
| Logic and decisions | Sorted union, add/remove/delta, comparability guard E02 | Applicable: helper works on observed case; removal, negative delta and cross-project branch not executed by supplied suite |
| Flows and concurrency | Synchronous read-only flow; completion check; scan counter E02/E04 | Applicable to rejection/reuse; no distributed worker or retry mechanism here, so lease/concurrency model unnecessary |
| Input/configuration space | Four fixture records and four cases | Applicable: unknown IDs, malformed/missing store, same measurement, alternate CLI arguments and empty file maps untested |
| Oracle/test strength | Real subprocess plus content assertions E04/E05 | Strong existing oracle catches actual bug. Helper reuse test alone would miss dropped output; exact helper check added only as assessment execution |
| Consumer compatibility | CLI text and exit codes asserted E04 | Applicable: no historical consumer fixture inspected; formatting compatibility beyond these examples unknown |
| Numerical/data quality | Integer line subtraction E02 | Limited applicability: negative/zero/invalid values need domain rules; scientific tolerances and conditioning not relevant |
| Architecture/build | ES modules, Node built-ins; package test command | Applicable: minimal build; runtime pin, lint and reproducibility checks not found in inspected scope |
| Reliability/performance | Errors mapped to exit 2; configured 120-second command timeout | Applicable: malformed input recovery untested; no measured workload/resource contract. Timing above is test duration, not product SLO evidence |
| AI/evaluator validity | None in inspected fixture | Not applicable: deterministic measurement comparison, no model or judge |
| CI/operational evidence | Outcome-to-test IDs and command mapping E01/E04 | Applicable: metadata is useful but no observed runner, CI workflow, required check or deployment signal. Merge enforcement unknown |

## Coverage boundaries

Relevant dimensions are completion state × project match × fingerprint match × file change kind × input validity × boundary (helper/CLI). Comparable valid cases require both completed and same project/fingerprint. Fixture has four records and the suite selects four scenarios, not all possible record pairs or semantic combinations. Executed CLI scenarios cover one comparable result, one fingerprint mismatch and one running-right-hand record; helper reuse covers the comparable pair. File fixture covers added, modified positive delta and unchanged files; removed, negative delta and empty results are not exercised. There is no justified whole-product coverage denominator, percentage or exhaustive claim. Schema constraints and authorization mechanism are unknown.

## Integration plan: two initial pilots (proposed only)

### P1 — Restore and preserve the consumer outcome

Highest priority because the implemented check already exposes a user-visible failure. In `src/cli.js`, replace the empty iterable with `result.changes`; preserve status/error semantics. Reuse `tests/scan-compare.test.js` and existing outcome IDs. Extend that file with an independent fixture-derived exact helper result and CLI cases for removal, negative delta, empty changes, unknown ID and limitations text; use temporary fixture files for additional scenarios without mutating checked-in data. For reuse, add a bounded CLI test seam or instrumented store adapter that fails if `startScan` is invoked; current CLI source merely reads stored data, but the existing assertion proves only helper behavior.

Oracle: manually specified expected paths/types/deltas from small records, independent of comparison implementation. Scope: deterministic, valid finite file maps plus explicit invalid-ID/completion cases; do not imply authorization, arbitrary JSON validation or concurrency certification. Existing verified command: `node --test --test-reporter=tap tests/scan-compare.test.js`. Acceptance: all selected cases pass, no skip/empty selection, expected full CLI content and error exit codes. Negative control in a disposable copy: restore `for (const change of [])`; the happy-path test must fail. Current E05 already provides empirical evidence that this fault is detected. Also verify that a deliberately incrementing scan implementation is caught by the reuse assertion.

Owner: CLI maintainer (identity unassigned). Estimated effort 0.5–1 day, assuming test seam remains local. Estimated PR budget 10 seconds, 256 MiB, with timeout a failure; current four-case run is measured at 0.305 seconds, expanded run unmeasured. Capture Node version, revision, command, duration and TAP at `.artifacts/contracts/scan-compare/`; deterministic, seed not applicable; no dependency cache needed. Revisit expected output on intentional CLI/schema changes. Rollback any unstable added case to advisory with an issue and owner; retain the original happy-path regression. No fix or test additions were made in this assessment.

### P2 — Connect existing contracts to observable CI and enforcement

Propose `.github/workflows/scan-compare.yml` (only if GitHub Actions is the actual host; hosting unverified) using the inspected direct Node command, a pinned reviewed Node version and an artifact upload of TAP plus revision/runtime/exit status. Run on every pull request and default-branch push initially to avoid path-filter omissions; include forks without secrets or writes. If scope filtering is later introduced, include source, tests, data, docs, package, `.verification/**` and workflow changes, not just the current contract's four path globs. Fail on exit nonzero, zero tests, any skipped required scenario or timeout; do not use continue-on-error for the eventual gate. No contract-runner executable was found, so do not invent one or claim the metadata executes itself.

Reuse existing outcome contracts and their evidence IDs rather than creating a duplicate outcome system. `verify-user-outcomes` is relevant as a future integration point, but availability in target is unverified; `performance-contracts` should be deferred until a real latency/size promise exists. Acceptance: successful run links show four or more intended tests selected and executed at the PR SHA; the known presentation negative control produces a failed job; artifact and exit status agree. Begin advisory, collect 10 consecutive representative runs and runtime/flake evidence, then explicitly configure and independently verify the repository ruleset requires this exact check. Until that verification, merge enforcement remains unknown. If blocking enforcement is rolled back, record exception owner/expiry and retain advisory runs and evidence.

Owner: repository/CI maintainer (unassigned); estimated 0.5 day excluding hosting/permission discovery. Initial command timeout 120 seconds matches existing metadata; target ordinary runtime under 10 seconds is estimated and must be measured. Artifact retention proposal 30 days, no cache until dependencies warrant one. Review on test selection, contract, Node or workflow changes. Failure reports should identify revision, selected IDs and exact assertion, not just a green aggregate.

Stateful testing, property libraries, broad mutation tools, TLC/SMT and theorem provers are deferred: a deterministic boundary bug is already caught by inexpensive existing tests, and no concurrent protocol or hard algebraic claim needs modeling. A few hand-written negative controls and independent fixtures are sufficient first steps. No formal proof was performed or claimed; independent formal-statement read-back is not applicable.

## Implementation handoff

At revision f39747ac417c389b28dd9fb834b4d73a689f4cb4, implement P1 as a reviewable bounded diff, using E05 as the failing baseline and E06 to preserve correct computation. Validate healthy output and the empty-renderer negative control, capture measured results and remaining domain limits. Then implement P2 separately once the actual CI host is identified; preserve the outcome IDs, show run artifacts and propose the explicit required-check change for review. Do not label a configured workflow or enabled contract as enforced without ruleset evidence. Assessment and plan only: neither pilot has been implemented or promoted to a gate.
