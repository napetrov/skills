# Turn a finding into a maintained check

Select at most three initial pilots by user impact, likelihood, existing evidence
weakness and implementation/maintenance cost. Explain priorities qualitatively;
do not invent precision. Explicitly defer tools whose setup costs exceed value.

Each pilot needs:

- Risk ID, affected journey, precise rule and existing check to extend.
- Proposed target files and a runnable command design. Distinguish an existing
  verified command from an illustrative command requiring implementation.
- Oracle provenance and independence; bounded domain and exclusions.
- Acceptance condition: a healthy fixture passes, a concrete plausible fault
  fails, empty selection/timeout/skip does not count as a verified outcome.
- Environment/toolchain/seed capture, time and memory budget, artifact location,
  cache policy and reproducible failure output. Label budgets as estimates until measured.
- Owner role (unassigned if unknown), dependencies, effort range with assumptions,
  maintenance trigger and rollback path.

## Rollout

1. **Local pilot:** small representative scope and a negative control in a disposable
   copy. Preserve a minimal counterexample as a regression test. No production faults.
2. **Advisory CI:** run under explicit triggers, collect runtime and flakiness,
   review false positives and skipped/unsupported cases. No claimed release gate yet.
3. **Ratchet:** protect agreed new/changed scope against regression using a reviewed,
   versioned baseline. Never silently refresh a failing baseline.
4. **Gate:** promote only after measured stability, actionable failures and acceptable
   cost. Propose actual required-check/ruleset configuration and verify it separately.
   Define exception owner, expiry and documented rollback; retain advisory evidence
   if the blocking gate is withdrawn.

Cheap deterministic rules may be ready to gate sooner. Stochastic LLM scores or
large bounded searches often belong in scheduled/advisory runs. Separate fast PR
checks from broader nightly/release sweeps. Inspect path filters, fork behavior,
matrix exclusions, fail-open settings and all-skipped selections.

## Handoff to an implementation agent

Supply one concrete pilot per work item:

> At revision <sha>, risk <id> affects <consumer promise>. Existing evidence is
> <paths/runs>; the gap is <specific missing assertion or domain>. Implement
> <bounded change> in <proposed files>, reusing <existing mechanism>. Validate
> <healthy case> and <negative control> with <oracle>. Preserve <constraints>.
> Add <CI stage/trigger> with <budget and artifacts>. Do not claim <excluded
> guarantee>. Deliver a reviewable diff, measured results and remaining limits.

Do not ask the agent to install every tool in the method table. Avoid deploying
infrastructure or changing required checks unless that implementation is authorized.

## From discovered pattern to maintained protection

Reference the finding/model ID and contract, not just a tool name. A one-off
reproducer becomes a regression first; a recurring cross-codebase pattern may
justify a static rule after testing violating and legitimate lookalikes. State
parser/language/build scope and skipped analysis alongside detector findings.
A noisy heuristic stays advisory. Track baseline findings separately from new
ones; review exceptions with an owner and expiry instead of silently ignoring
whole directories. Invalidate model evidence when relevant guards, writers,
callers, support contracts or build variants change.
