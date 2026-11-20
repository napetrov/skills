# Reduce the project's own testing cost

## Scope and evidence

Distinguish four operations: accelerate execution without dropping checks; select
checks for a change; move checks to another cadence; permanently remove tests.
Report each separately. Moving checks nightly reduces PR latency, not necessarily
total compute. Prioritization alone does not reduce total work.

Read repository instructions and inventory actual test IDs, parameter cases,
assertions, fixtures, subprocesses, build steps and CI matrix expansion. Record
revision, environment, commands, skips and collection count. Measure collection,
setup, execution and teardown separately; include build/install time, retries,
CPU minutes and critical-path wall time. Use repeated comparable runs where noise
matters; do not sum parallel durations and call the result wall time. Start with
a bounded representative subsystem and disclose missing platforms and evidence.

Map tests to observable obligations: public outputs, errors, boundaries, resource
lifetimes, platform contracts and named regression bugs. Record oracle strength,
not just executed lines. Similar names, identical line coverage and identical
passing results do not establish redundancy. Preserve tests that distinguish
different outputs or faults even when their coverage is identical.

## Reduction order

1. Remove repeated work first: share immutable compiled fixtures, cache builds
   with complete source/toolchain/flags keys, reduce unnecessary process startup,
   and batch independent checks. Verify isolation, invalidation and parallel use;
   do not broaden mutable fixture scope or mock away the integration contract.
2. Split assertion layers. Exercise pure decisions cheaply across many cases;
   retain real parser/compiler/provider/CLI boundary checks and representative
   end-to-end paths. A fake is not evidence that the real adapter still works.
3. Reduce parameter products only after defining factors, validity constraints,
   boundary values and mandatory interactions. Use covering arrays for genuinely
   interacting configuration factors; retain known higher-order regressions and
   required platform checks regardless of pairwise coverage. Verify coverage of
   valid tuples independently; never interpret t-way coverage as fault completeness.
4. Select by change impact only with dependency evidence. Include shared fixtures,
   configuration, generated code, dependencies and transitive callers. Unknown or
   stale mappings, collection failures and infrastructure changes fall back to
   the full relevant suite. Empty selection is not success. Keep a full-suite
   cadence and shadow selected-versus-full runs before adopting selection.
5. Consolidate or delete only with a documented replacement for each obligation
   and regression witness. Preserve distinct oracle strength and failure modes.
   Quarantining flakes must retain visibility, owner and repair criteria.

## Exact and approximate selection

Build a test-to-obligation matrix with measured costs and mandatory tests. For a
small candidate set use exact weighted set cover via ILP/MaxSAT; report optimality
only if the solver proves it. For larger sets use greedy new obligations per cost,
then verify every mandatory obligation. Timeouts yield incumbents and bounds,
not proven optima. Solver overhead can exceed any test savings. Shared setup costs
and parallel scheduling invalidate a naive additive wall-time objective; model
setup groups or explicitly label the estimate. Pairwise generation, suite selection
and constrained-space counting are different problems. Do not estimate required
tests from LOC or cyclomatic complexity alone.

## Validate the proposed reduction

Compare full and reduced suites at the same revision and environment. Replay
historical defects using pre-fix/fixed controls where available; add targeted
non-equivalent mutants and adversarial boundary cases. Hold out some faults from
selection and repeat randomized baselines with recorded seeds. Report unique
faults/classes detected, not inflated counts of equivalent failing cases. Treat
invalid mutants, timeouts and unknown outcomes separately. Retaining observed
fault detection does not prove preservation for all future bugs. Equal branch
coverage is supporting evidence, not an acceptance criterion by itself.

Predeclare acceptance: mandatory obligations retained, no lost known regression
witness, measured cost improvement, and explicit residual gaps. Validate the
proposed commands and CI selection; keep rollback to the full suite. If evidence
is insufficient, recommend instrumentation and a shadow pilot, not deletion.

## Project profiles (hypotheses to verify in source)

- **abicheck itself:** separate pure rule/matcher/graph/serialization tests from
  parser acquisition, compiler-built fixtures, CLI and cross-platform integrations.
  Investigate repeated builds and redundant parameter cross-products. Keep real
  acquisition-to-verdict checks, public output/exit-code contracts, malformed-input
  handling and named false-positive/false-negative regressions. Do not replace
  this audit with generating more ABI scenarios or evaluating client libraries.
- **dokimi itself:** inventory deterministic parsing, configuration, scoring,
  aggregation, persistence, scheduling and CLI tests separately from provider
  contract tests and live agent/judge evaluations. Cheap recorded responses can
  test orchestration but cannot validate live provider behavior or judge quality.
  Preserve error/retry/cancellation and output-contract checks where implemented.
  Apply repeated-run statistics only to stochastic evaluations; do not assume
  ordinary framework unit tests need model calls. Report live-eval spend separately.
- **oneDAL:** distinguish numerical correctness, configuration support, performance
  and ABI contracts. Retain numerical edge cases and backend-specific regressions;
  do not replace reference tolerances or invariants with configuration coverage.

## Deliverable

Produce a compact table: test/group, obligation and oracle, measured cost,
proposed action (retain/accelerate/consolidate/select/reschedule/remove), replacement
witness, supporting evidence, residual risk and validation command. Include before
and after test counts, PR wall time, total matrix CPU minutes, setup costs and
separately billed calls if relevant. Mark estimates versus measurements. Offer
at most three prioritized pilots and state what remains uninspected. Implement
only within the user's authorized scope; preserve unrelated tests and CI policy.

## Research anchors

- NIST, Practical Combinatorial Testing: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-142.pdf
- Chvatal, weighted greedy set cover: https://doi.org/10.1287/moor.4.3.233
- Rothermel and Harrold, regression selection evidence: https://digitalcommons.unl.edu/csearticles/11/
- Bounded exhaustive testing: https://dspace.mit.edu/entities/publication/ce661fc6-3b5d-4187-817c-c828dc650466

Use these as method references, not proof that a particular repository can safely
remove tests or achieve a predetermined percentage saving.
