# Compatibility evidence assessment

The supplied evidence does not verify the promised old-consumer/new-library compatibility. CI selected no tests, the generated expectations reuse the checker, and the formal evidence does not establish whole-product correctness. This is an evidence assessment, not an execution or implementation audit.

## Scope and evidence

Assessed 2026-11-12, reported revision `abc123`. Only `compat/TASK.md` and `compat/evidence.md` were inspected as target evidence, alongside the frozen assessment guidance. Target source, repository dirty state, subprojects, build environments, raw logs, and branch rules are unavailable. Paths mentioned below are reported by the supplied excerpt, not inspected source. No evidence commands were executed, dependencies installed, external services contacted, or target files changed. The source-upload request in the reported README is outside the authorized local scope.

All evidence locators below refer to `compat/evidence.md`; run URL unavailable.

| ID | Evidence at abc123 | Implemented/configured | Execution and enforcement |
|---|---|---|---|
| E1 | Lines 2–4: Linux/Windows promise; `src/check.py` compares exported names; one identity assertion in `tests/test_check.py` | Checker and example test reported, source unavailable | Example execution not supplied; enforcement unknown |
| E2 | Line 5: Hypothesis listed in `requirements-dev.txt` | Dependency reported; property generators/assertions not-found-in-inspected-scope | Property execution unknown; dependency is not implementation evidence |
| E3 | Lines 6–7: workflow runs `pytest -k future_cases || true` on PRs; Run 42 green with zero selected | CI selection and fail-open command reported | Behavior not-run; validation inconclusive. Exit status suppressed; green process does not verify behavior |
| E4 | Lines 8–9: 200 generated Linux name-change cases; expectations computed by `src/check.py` | Corpus reported; oracle shares implementation | Corpus execution not supplied; no independent correctness evidence |
| E5 | Lines 10–11: Alloy search with three symbols; Lean theorem imports open lemma | Bounded search and incomplete proof dependency reported | No raw formal artifacts/toolchain/results supplied; whole-product proof not established |
| E6 | Lines 12–13: branch/ruleset unavailable; local-only assessment | Enforcement unknown | No policy verification or external action performed |

Run 42's only supplied measurement is zero selected tests. Executed behavior cases: zero. Passed, failed and skipped report fields, duration, environment, seed, exact effective process exit status, and artifact URL are unavailable. No corpus execution counts can be inferred from its size.

## Categories and consumer traces

| Category | Existing mechanism / evidence | Gap and practical risk |
|---|---|---|
| Intent and usability | Old-consumer/new-library promise on Linux and Windows (E1) | Supported ABI/toolchain/consumer operations and failure messages undefined; no consumer acceptance evidence |
| Logic and decisions | Name equality classifier; identity assertion (E1) | Unchanged names do not establish unchanged calling conventions, argument types or layouts; false compatible decisions plausible |
| Flows and concurrency | Static classifier described (E1) | Distributed retries/concurrency not indicated; not applicable to the supplied classifier scope. Consumer build/link/load/run and invalid-input flow unverified |
| Input/configuration space | 200 Linux name-change cases (E4) | Windows, unchanged-name ABI changes, malformed input and compiler dimensions lack evidence; no feasible-domain denominator |
| Oracle and test strength | Identity assertion and self-generated labels (E1, E4) | Corpus expected results share checker defects; no negative control or independent semantic oracle |
| Consumer compatibility | Product promise and exported-name comparison (E1) | No actual old executable tested against replacement library on either platform |
| Numerical/data quality | Symbol metadata only | Numerical accuracy not applicable to the described product; metadata validity/degenerate lists remain unspecified |
| Architecture and build | Hypothesis dependency (E2) | Toolchain pins, reproducible binary fixtures and build/cache behavior unavailable |
| Reliability and performance | No supplied mechanism | Error recovery/resource bounds not-found-in-inspected-scope; applicability and budgets require product requirements |
| AI/evaluator validity | No AI evaluator described | Not applicable to supplied compatibility classifier |
| CI/operational evidence | PR workflow and Run 42 (E3, E6) | Empty selection and suppressed failures; merge protection unknown |

Three important traces are incomplete:

1. **Identity:** consumer compatibility promise → symbol-list boundary → equality implementation → identical-list assertion → no selected tests in observed CI. An implemented example is useful scaffolding but neither execution nor binary compatibility is established.
2. **Breaking replacement:** old compiled consumer → replacement library → checker names → generated checker-derived label → no execution history. A same-name changed function signature/layout can escape this abstraction; this is a plausible failure, not an observed source reproduction.
3. **Invalid input:** malformed/missing symbol metadata → checker input boundary → implementation behavior, diagnostic assertion and run all unavailable. Specify rejection semantics before testing; do not infer safe handling from the identity test.

Coverage dimensions should be change kind × symbol/type/layout feature × operating system × compiler/ABI × consumer operation, with supported combinations explicitly constrained. Supplied scope is 200 generated Linux name-change cases, not 200 executed cases or exhaustive coverage. Feasible, unique, selected, passed, failed, skipped and unsupported corpus counts are unknown. No coverage percentage is warranted.

## Practical integration plan

At most three pilots are proposed; none is implemented or enforced here. All commands below are designs requiring source inspection and implementation before execution. Owner roles are proposed and unassigned. Budgets and effort are estimates, not measured costs. Use local tooling; no proving service is needed.

### P1 — Make existing CI evidence meaningful

Risk: empty selections and ignored failures conceal regressions. CI maintainer extends `.github/workflows/test.yml` and adds `tools/verify_test_report.py`; first inspect actual test collection and project invocation. Proposed command: `python -m pytest tests/test_check.py --junitxml=artifacts/quality/unit.xml`, followed by `python tools/verify_test_report.py artifacts/quality/unit.xml --min-executed 1`. Remove failure suppression and propagate both statuses. Helper must reject absent/malformed reports and zero executed cases; skips do not count as verified cases.

Acceptance: the existing identity fixture passes and executes; a deliberately failing assertion in a disposable copy fails the job; an empty selection also fails. Initially run advisory on every PR and default-branch push, avoiding filters until validated for forks and matrices. Estimate 0.5–1 day, 5 minutes/1 GiB per job. Capture revision, command, environment/toolchain, duration, selected/executed/pass/fail/skip counts and exit status in `artifacts/quality/manifest.json`, alongside JUnit. Cache dependencies only by lockfile/toolchain key, never test results. Retain CI evidence for a proposed 30 days.

After ten representative successful runs with both negative controls verified, propose an actual required check in branch/ruleset configuration and separately inspect its enforcement. CI owner approves exceptions with expiry. If instability forces rollback, remove blocking policy explicitly and retain advisory runs; never restore unconditional success. Maintain on workflow, selection or test-runner changes. This pilot reuses the example check and is cheaper than introducing a new test framework.

### P2 — Establish independent consumer compatibility fixtures

Risk: name equality misses real ABI breaks and the corpus reinforces its own decisions. Compatibility maintainer adds `tests/consumer/fixtures/`, `tests/consumer/test_replacement.py`, and `tests/consumer/manifest.json`; extend the current checker boundary without presuming its undocumented interface. Proposed command after implementing the harness: `python -m pytest tests/consumer --junitxml=artifacts/quality/consumer.xml` on both supported OS runners.

Bounded first domain: one pinned compiler/ABI per Linux and Windows, a tiny exported function and a record-layout fixture, and three edits: identical library, removed used symbol, and changed same-name ABI. Compile the consumer once against the old library and replace only the runtime library. Independently authored expected results come from the consumer contract and observed link/load/output checks, not checker output. Record toolchain and loader configuration. Do not treat accidental execution success for undefined behavior as compatibility: choose a deterministic contract-output mismatch or independently adjudicated ABI fixture, with timeout/crash classified explicitly.

Acceptance: healthy replacement preserves expected output; removed symbol is diagnosed incompatible; same-name breaking fixture is detected by the product or remains an explicit failing known limitation. Negative control forces the checker to report compatible for the known break and must fail the test. Also add an independently specified malformed-metadata rejection example. Persist minimal counterexamples and retain unsupported cells with reasons. Estimate 2–5 days, 10 minutes/2 GiB per OS; measure before gating. Store binaries, hashes, build logs, actual/expected outputs, checker decisions and P1-style manifests under `artifacts/quality/consumer/`. Cache toolchains/dependencies by pinned version; rebuild fixtures on source changes.

Run locally, then advisory on every PR/default push; broader compiler combinations belong in nightly/release sweeps after support scope is agreed. Ratchet a reviewed fixture baseline, never silently regenerate labels. Promote only after stable measured runs and actionable diagnostics, with verified branch policy. Compatibility owner maintains fixtures on compiler, ABI, classifier or fixture changes; rollback blocking scope to advisory with an expiring issue. Reuse any existing `verify-user-outcomes` workflow if later found; its installation is not established. Defer broad fuzzing and property generation until the independent oracle is useful; Hypothesis is a possible later extension, not an existing demonstrated suite.

### P3 — Correct and bound the formal claims

Risk: incomplete, narrow evidence is marketed as full correctness. Formal-methods reviewer updates `docs/proof.md` and adds `docs/formal-evidence.md` plus `tools/check_formal_evidence.py` after inspecting actual artifacts. Proposed command design: `python tools/check_formal_evidence.py --manifest docs/formal-evidence.json`; exact Alloy/Lean invocations must be derived from the pinned project toolchains, which are unavailable here.

Immediately describe the three-symbol Alloy result as a reported bounded result with missing configuration, not a product proof. Record exact statement, domain, integer/object bounds, precondition reachability, toolchain, result and exclusions. Identify the Lean open lemma, all transitive axioms and unresolved obligations using Lean tooling; compilation or text search alone is insufficient. Have an independent reviewer read back the formal statement without the product promise; this assessment did not perform that read-back.

The bounded candidate rule is classifier agreement with an explicitly defined symbol-change relation for at most three symbols, not binary compatibility across OS/toolchains. A model must represent duplicate/empty symbols and its stated assumptions, or exclude them visibly. Map definitions to `src/check.py` and revision, then connect model examples to P2's executable contracts. The ABI/layout semantic gap remains outside a names-only theorem even if all lemmas close.

Acceptance: evidence manifest rejects open obligations, missing bounds and unsupported whole-product claims; a deliberately contradictory classifier rule yields a counterexample or rejection; a healthy bounded model is satisfiable/reachable and has recorded completed results. Missing results, timeout or unknown are inconclusive. Estimate 1–3 days for documentation/evidence repair, 5 minutes/2 GiB for a small local check; proof completion cost unknown and deferred. Run advisory on formal/model/classifier changes and release preparation, storing exact source hashes, toolchain, dependency/axiom reports, results and counterexamples under `artifacts/quality/formal/`. Disable proof-result caching initially. Rerun on any statement, model, implementation, assumption or toolchain change. Formal reviewer owns exceptions; rollback removes the proof claim and retains limitations, never labels an open proof complete. Defer larger Alloy bounds, SMT or theorem-prover expansion until a valuable exact contract and implementation bridge exist. `performance-contracts` would apply only after a measured performance promise is agreed; none is supplied.

## Implementation-agent handoff

At `abc123`, implement P1 first in an isolated change: inspect the real runner, remove fail-open behavior, require executed assertions, and deliver healthy/failing/empty-selection evidence with a reviewable diff. Preserve local-only scope and do not change required checks without separate authorization. Then implement P2 as a distinct bounded consumer harness with independent fixture expectations and the two-OS domain above. Finally deliver P3's corrected claims and explicit formal evidence manifest; do not claim proof closure before resolving dependencies and demonstrating the implementation bridge. Each change must report measured runtime, remaining unsupported cases, exact revision and artifacts. This report proposes those changes; it does not certify their completion.
