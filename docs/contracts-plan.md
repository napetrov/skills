# Contract Skills: Remaining Plan

Status of `performance-contracts` and `verify-user-outcomes` after the first
implementation (PR #25). Done work and deviations are in
[contracts-design.md](contracts-design.md). This file lists what is still open,
in the order it should be picked up.

## 1. Decisions needed from the owner

- **Eval pilot scope.** The first pilot ran and reached ceiling (`evals/pilot/RESULTS.md`). Decide whether to build harder tasks for item 3, or accept the
  deterministic cases as the v1 quality bar.
- **Target layout for contracts.** Confirm `.petrov/contracts/` and
  `.artifacts/contracts/` as the v1 paths, or name a different convention used by
  the target projects.

## 2. Verification gaps in v1

- **Enforcement is unverified.** Check branch protection and required checks for
  `main`. Record the required-check name that gates contract jobs. Only then can a
  contract be reported as `enforced`.
- **Negative-control evidence is written but not read.** `discriminate` runs every
  assertion's control and writes `discrimination.json`, but readiness still reports
  `instrumented` at most. Derive `validated` from the latest discrimination record
  for each enabled contract, and keep `synthetic` controls out of that claim unless
  a real regression has also been caught.
- **Fixture CI is not active.** The example workflow in
  `fixtures/python-perf-target/ci-example/` is a placeholder with unpinned actions.
  Pin SHAs for `actions/setup-python` and `actions/upload-artifact` and run it in
  a real target project. Then record an observed CI result.
- **Windows Python path.** The fixture command calls `python3`. Add an explicit
  interpreter setting in config, or a Windows-specific command, so the Python tests
  run on Windows instead of being skipped.

## 3. Agent evaluation

Status: the first pilot ran (36 runs) and reached ceiling, so it did not measure
skill benefit. The items below describe the next, harder pilot.

- Pilot design: six representative tasks, three repetitions each. Cover setup,
  reuse, a performance regression, a legitimate lookalike, a broken outcome, and
  indirect infrastructure value. Use the same model, tools, time limit, and task
  wording across paired runs (A: agent alone; B: agent with the skills).
- Score separately: task success, correct scope, false positives, false passes,
  oracle independence, policy preservation, evidence usefulness, tokens, tool calls,
  and elapsed time. Report setup cost apart from recurring-run cost.
- Release gate: zero false passes on zero-test, missing-result, and dropped-output
  cases.
- Location: `evals/` at the repository top level, with task definitions and a
  runner. Raw transcripts stay out of the repository.

## 4. Performance contracts: missing behavior

- **P04 warm-cache invalidation.** Needs a cached fixture (warm, cold, and
  invalidated states) plus hit, miss, and bypass counters.
- **P05 noisy timing.** Classify timing evidence as inconclusive on unstable
  runners, and keep valid counter results. Needs repeats, spread, and a runner
  fingerprint in the envelope.
- **P07 repeated decode.** Attribute repeated work across phases and show a bounded
  repair. Needs a second fixture with a deliberate repeated decode.
- **Live external-service profile.** Separate profile with authorization, cost
  limits, and environment caveats. Not started.
- **Static-analysis rules.** Language-aware candidates such as full scans inside
  loops, N+1 queries, and unbounded fan-out. Each enforced rule needs a motivating
  defect, a failing example, a legitimate lookalike, and an exception record with
  owner, rationale, scope, and review date.
- **Schema validation.** The JSON Schema files are documentary. Decide whether to
  add a validator dependency or keep the runtime subset. A dependency needs
  approval because the package has none today.

## 5. Outcome verification: missing behavior

- **O04 indirect support code.** Security, migration, and recovery code without a
  direct user action. Typed relations (`supports`, `depends_on`) and a rule that
  blocks automatic deletion.
- **O06 isolation.** Outcome test that verifies unauthorized project access is
  refused, without production data.
- **O07 module rename.** Detect a stale reference and repair it with history and
  code evidence. Requirements must not change.
- **O08 async completion.** Job completes but the result is inaccessible to the user.
  Needs a fixture with a job store and a result endpoint.
- **X01 shared outcome across both skills.** Link contract IDs between the two
  skills without duplicating authoritative content.
- **Reverse indexes.** Generate them from authoritative links, instead of
  maintaining backlinks by hand.

## 6. Lifecycle and maintenance

- **Scheduled and manual profiles.** The `scheduled` and `manual` profiles exist in
  the schema but have no runner behavior. Define the larger workloads, cache
  coverage, memory measurement, and mapping drift checks.
- **Migration policy.** Write the schema migration rules: unknown major versions
  fail, minor versions upgrade explicitly, and no silent downgrade.
- **Target guide.** Add `docs/engineering/contracts.md` to target projects as the
  always-loaded pointer. It lists commands, ownership, and links to the contracts.
- **Setup-lock digests.** Verify the `user_owned` and conflict rules on every
  scaffolded file, for both skills. The example-recreation rule is implemented for
  performance-contracts only.

## 7. Composition with other skills

- Use shared artifacts as integration points when the Matt Pocock practices are
  installed: outcome IDs carried into specs, contract violations read by
  architecture review, and executable evidence read by code review.
- Do not install or modify that package automatically. Check its current invocation
  conventions and record the source commit before publishing examples.
- Upstream contribution is optional. A future change should be a small correction
  backed by an eval.

## Order of work

1. Decisions in section 1.
2. Verification gaps in section 2, because enforcement claims depend on them.
3. Agent evaluation in section 3, since it measures whether the skills help.
4. Missing behavior in sections 4 and 5, one item at a time, each with a fixture
   and a discrimination case.
5. Lifecycle items in section 6, then composition in section 7.
