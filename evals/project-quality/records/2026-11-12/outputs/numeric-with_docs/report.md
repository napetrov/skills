# Numerical/performance fixture assessment

The release block based on `normalize` being quadratic is **unjustified**. With `BUCKETS = 4`, the inner loop performs exactly four tests per token: Θ(n) work under constant-cost integer arithmetic, and Θ(n) output storage. The matcher also records exactly one candidate visit per old symbol, but that metric does **not** establish linear total runtime or universal performance.

## Scope and evidence

Assessed 2026-11-12, revision `48dfef6441f7ae26ca1998f79da1d4047107d95f`; target-scoped `git status --short -- .` was empty. Inspected only this target's TASK, README, source, tests, benchmark, hidden contract configuration/baseline, and example workflow, plus the supplied assessment guidance. No network, dependency installation, source edits, CI history, other experiments, or grading inspection. No target AGENTS.md found. Consumers are Python callers partitioning tokens and matching symbol snapshots. Real user acceptance requirements and branch protection are unavailable.

| ID | Evidence at this revision | Assessment |
|---|---|---|
| E1 | `src/normalize.py:1–9` | Fixed four buckets; linear loop count. No normalize test found in inspected scope. |
| E2 | `src/matcher.py:28–41` | Builds first-name-per-key index, scans old once, sorts resulting pairs. Candidate counter increment is once per old row. |
| E3 | `src/matcher.py:7–25` | Merge sort of k matched rows, O(k log k) comparisons; string comparison cost and dict collision cost are separate. |
| E4 | `tests/contracts/test_matcher.py:10–19` | Two implemented assertions, pairing and candidate count. Executed: 2 selected, 2 passed, 0 failed/skipped. |
| E5 | `benchmarks/contracts/bench_symbol_match.py:19–55` | Four seeded generated workloads, truth generated independently of matcher; set+length checks omit ordering. Executed results below. |
| E6 | `.verification/contracts/performance/PERF-MATCH-001.json:10–56` and `config.json:5–18` | Enabled contract and executable benchmark configuration, thresholds and textual negative controls. Runner invocation/negative-control enforcement not executed. |
| E7 | `ci-example/contracts.workflow.example.yml:1–31` | Explicitly inactive example; unpinned placeholders and external skill runner path. Active CI and integration enforcement not found in inspected scope. |
| E8 | `.verification/contracts/baselines/fixture-reference-v1.json:5–30` | Stored deterministic baseline matches observed counters. Baseline provenance lacks source revision/environment; no universal guarantee. |

Local commands (target cwd): `python3 -B -m unittest discover -s tests/contracts` and `python3 -B benchmarks/contracts/bench_symbol_match.py --output <output-dir>/benchmark.json`. Both exited 0. Python 3.12.14, Linux x86_64/glibc 2.41; complete environment, commands, stdout/stderr and durations are in `execution.json`. Measured process times: 0.074 s tests and 0.064 s benchmark (different measurement contexts from individual timing medians). Seed 7, five timed repetitions per size plus one warm-up and one counted correctness run: 28 matcher calls overall. There are four workload points, all oracle booleans true; none skipped. Benchmark exit 0 alone is not contract verification: it writes observations and does not reject false booleans or excess counters.

| Symbols per side | Candidate visits | Sort comparisons | Oracle | Median ms (advisory) |
|---|---:|---:|---|---:|
| 250 | 250 | 815 | true | 0.213 |
| 500 | 500 | 1881 | true | 0.452 |
| 1000 | 1000 | 4323 | true | 1.025 |
| 2000 | 2000 | 9841 | true | 2.158 |

All observed candidate counts satisfy 12n; sort counts also satisfy 3n log2(n). This is a direct assessment of the four observations, not an observed run of the external contract checker. Negative controls are configured but **not-run**. CI is not established as configured actively, executed or enforced. Timings are host-specific, noisy and advisory; no latency SLA is supplied.

## Promise traces and limitations

1. Token partition: caller → `normalize` → four fixed bucket comparisons → appends matching remainder bucket. An integer belongs to exactly one bucket; negative integers follow Python modulo. Empty input returns four empty lists. These are source-derived conclusions, not executed normalize tests. If BUCKETS became input-scaled, work would be O(nB); arbitrary-size integers or user-defined modulo operations invalidate constant-cost arithmetic assumptions. A nested loop alone is not a quadratic argument.
2. Symbol matching: caller → first new name per hashable key → one old scan → sort by old name → unit test exact list and benchmark set oracle. Let m be new size, n old size, k output size: expected O(m+n+k log k) with ordinary hashing and bounded key/name operations. Hash collisions, long strings, custom objects, or costly equality may increase elapsed cost without affecting `candidate_visits`. This counter is linear even if dictionary internals are expensive.
3. Missing/invalid inputs: absent key gives no pair (unit test exercises missing matches); duplicate new keys choose first via `setdefault`. Unhashable keys raise during index construction/lookup; malformed rows fail unpacking; a matched name of None is silently treated as absent. These follow source, are not executed or necessarily bugs absent an input contract. Error semantics, duplicates, None, empty lists, and mismatched lengths need documented decisions and tests.

## Category review

| Category | Mechanism/evidence | Gap and practical impact |
|---|---|---|
| Intent/usability | README and matcher docstring, E2/E4 | API outcome tested narrowly; accepted types/duplicate policy unspecified. No UI usability claim applicable. |
| Logic/decisions | E1–E4 | Fixed bucket logic sound by inspection; duplicates/None and counters preconditions untested. |
| Flows/concurrency | Synchronous pure-local operations, E1/E2 | Missing-match path covered. Distributed retries, leases and cancellation not applicable; no concurrent API promise. |
| Input/configuration space | E4–E6 | n=250/500/1000/2000, equal sides, 80% matches, seed=7 only; no exhaustive denominator. |
| Oracle strength | E4/E5/E6 | Generator independent of matcher but shares restricted domain. Set oracle ignores order; negative controls unexecuted. |
| Consumer compatibility | Python tuple/list API, E2 | No old consumer compatibility test found; exceptions/types not specified. |
| Numerical/data quality | Integer modulo and symbolic keys, E1/E2 | Floating numerical tolerance/conditioning not applicable to intended integer/symbol operations; arbitrary-size operation costs remain relevant. |
| Architecture/build | Python standard library only in inspected source | No package/build reproducibility or supported-version matrix established. External CI checker unavailable in scope. |
| Reliability/performance | Counters, timings, E3/E5/E6 | No memory bound enforcement, hostile hashing coverage or measured SLA; sample evidence useful but limited. |
| AI/evaluator validity | No AI component | Not applicable. The benchmark oracle still needs ordinary test-strength validation. |
| CI/operational evidence | Inactive example, E7 | No active/gating evidence. Example emits artifacts only on failure; losing successful trends weakens auditability. |

Workload dimensions for future coverage: old/new sizes (including zero and unequal), match fraction (0/partial/1), duplicate-key policy, input/name ordering, key/name representation and length, collision patterns, seed, Python version. Constraints must be defined before percentages are meaningful. Existing coverage is four generated workloads and two example tests, not all feasible combinations.

## Proportional integration: two proposed pilots

### P1 — Cheap semantic and complexity regression tests (first priority)

Risk R1 is an incorrect quadratic release decision; R2 is incorrect or unordered matcher output escaping the set oracle. Extend existing unittest coverage in proposed `tests/contracts/test_normalize.py` and `tests/contracts/test_matcher.py`. Use explicit hand-calculated integer partition examples, empty input, negatives, and an independent reference list for first-match semantics after deciding valid input types. Check exact ordered output, no/all matches, duplicate old/new keys, unequal sides, and the agreed invalid-input behavior. Make benchmark correctness compare ordered expected pairs as well as cardinality; update `benchmarks/contracts/bench_symbol_match.py` and contract metadata accordingly.

Bounded domain: ordinary integer tokens, string names/hashable string keys, sizes 0–2000 plus selected duplicate/invalid cases. Oracle provenance: manually reviewed examples and a small simple reference matcher that scans new sequentially; do not call production matching helpers. Complexity check: a counting modulo test token or an explicit reviewed counter can confirm 4n bucket tests for fixed BUCKETS; document its limitations. Candidate count must equal n from zero-initialized counters. Negative controls in disposable copies: drop one match, reverse sorted output, or replace four-bucket loop with n-dependent repeated work; each relevant assertion must fail while healthy fixtures pass. Do not mutate the target during assessment.

Command after implementation: `python3 -B -m unittest discover -s tests/contracts` (existing command already verified). PR triggers: changes to source, tests, benchmarks, contracts or workflow; initially run all tests to avoid selection gaps. Estimated budget 10 seconds/256 MiB and 0.5–1 engineer-day, not measured pilot costs. Owner: library maintainer (unassigned). Capture revision, Python/OS, selected/passed/failed/skipped counts, command, duration and minimal failure fixtures in `.artifacts/contracts/semantic/`, upload on success and failure. Empty selection or unexpected skips fail validation. No generated-result cache; dependencies/toolchain may be cached with versioned keys. Review whenever supported input rules or BUCKETS changes; rollback only problematic new assertions with a tracked issue and retained advisory evidence.

### P2 — Make the existing performance contract operational

Risk R3 is treating observations or an example workflow as enforced performance assurance. Reuse PERF-MATCH-001 and its counter bounds rather than introduce another framework. Proposed files: `.github/workflows/contracts.yml`, existing `.verification/contracts/config.json`, existing performance JSON and benchmark; use an approved pinned installation of the existing performance-contracts checker only after availability/path is verified. Its sample `node skills/performance-contracts/scripts/perf-check.js check --repo . --base "origin/$BASE_REF"` is a **provisional command design**, not currently runnable evidence. No checker installation authorized here. `verify-user-outcomes` is not installed/inspected and is unnecessary for these pure-library checks.

Start with current four workloads, then add a small fixed matrix of size imbalance, zero/full matches, reverse/shuffled old names and independent seeds; nightly broader cases remain bounded. Keep timing advisory. Confirm correctness drop mutation fails; run configured synthetic candidate/sort-counter mutations in disposable copies and label these as metric/gate checks, not real quadratic-algorithm experiments. Add one real repeated-scan fault with faithful accounting to test that instrumentation detects changed work. Healthy runs must satisfy all assertions; any false correctness value, timeout, missing/empty observations or unexpected skip is not success. Preserve raw benchmark JSON, checker result, revision, tool versions, exact seed/workload, and negative-control results in `.artifacts/contracts/`; upload always. Initial configured timeout is 120 seconds; propose 2-minute PR/512 MiB job budget and 10-minute nightly budget (estimates), no observation caching, 1–2 engineer-days assuming checker is available. Owner: CI/performance maintainer (unassigned).

Rollout: local pilot and disposable controls → advisory PR/push and nightly runs → review runtime/flakiness over at least 20 runs → ratchet reviewed workloads/baselines → separately configure and verify the actual required check. Do not silently regenerate a failing baseline. Pin action SHAs and Python/checker versions; include contract/workflow changes in trigger scope. Define release-owner exception approval with seven-day expiry; rollback a flaky blocking check to advisory while retaining reports. Reassess on matcher, generator, Python or instrumentation changes.

Formal proofs, SMT and large mutation suites are deferred: direct fixed-loop reasoning and independent regression oracles address these risks more cheaply. A theorem about loop counts would still need arithmetic/hash assumptions and a code bridge, and would not prove wall-time for all inputs. No formal claim or independent formal statement read-back was performed. Universal performance is **not proved**.

## Implementation handoff

At revision above, implement P1's bounded tests and ordered oracle without changing public behavior until duplicate/type semantics are agreed. Deliver reviewed diff, healthy/control results and explicit domain exclusions. Then implement P2's advisory workflow using a verified pinned checker, retaining existing contract IDs and raw evidence; measure budgets before proposing branch protection. Neither pilot, CI enforcement, nor source fix was implemented during this assessment. Do not block the release for the alleged normalize quadratic loop; other release criteria remain outside this assessment.
