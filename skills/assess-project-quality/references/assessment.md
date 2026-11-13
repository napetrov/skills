# Evidence-driven assessment

First identify the product's consumer: a person, API caller, compiled binary,
numerical algorithm user, or an agent. A passing internal helper may never
exercise the promised consumer outcome.

| Category | Inspect | Question to answer |
| --- | --- | --- |
| Intent and usability | requirements, examples, acceptance criteria, user research | Can the intended user achieve the goal, including errors and recovery? Automated E2E does not establish usability. |
| Logic and decisions | rules, conditionals, tables, invariants | Are rules contradictory, overlapping, incomplete or order-dependent? |
| Flows and concurrency | states, transitions, retries, leases, cancellation | Can work be lost, duplicated, stuck, or completed after cancellation? |
| Input and configuration space | dimensions, constraints, generators, skips | Which feasible combinations and boundaries are actually checked? |
| Oracle and test strength | assertions, fixtures, reference implementation, mutants | Would the checks detect a plausible wrong result? |
| Consumer compatibility | API/ABI, CLI, schema, migrations, error semantics | Does a real old consumer still work across a change? |
| Numerical/data quality | tolerances, conditioning, distributions, transformations | Are errors bounded meaningfully, including NaN, infinity and degenerate data? |
| Architecture and build | dependencies, boundaries, types, lint, build rules | Are architectural constraints and reproducibility checked? For build migrations inspect native dependency/action modeling, cache behavior and hermeticity. |
| Reliability and performance | fault tests, budgets, load, resource ownership | Are recovery and resource limits checked under realistic failure? |
| AI/evaluator validity | held-out tasks, judge calibration, grounding, stochastic runs | Is the harness correct, and separately does its score measure useful behavior? |
| CI and operational evidence | triggers, filters, selected tests, reports, deployment signals | What ran at this revision, and what actually blocks integration? |

Use this as the validation view alongside pattern-catalog.md, which is the
discovery view. In broad audits triage all categories; in focused audits record
which categories are relevant without expanding the task unnecessarily.

For each category record **existing mechanism**, **evidence**, **gap**, **risk**,
and **applicability**. Distinguish "not applicable", "unknown" and "not found".
Do not penalize a small library for not having a web UI or a distributed protocol.

## Evidence ledger

Use stable IDs (E01, E02) and cite paths/lines plus commit. For supplied excerpts
without line numbers or run URLs, identify the supplied source and mark missing
fields unavailable; never invent locators. For executions capture
command, environment, seed, duration, selected/executed/pass/fail/skip counts,
exit status and artifact/run link. Record unavailable fields honestly. An empty
selection means behavior was not-run and the validation result is inconclusive,
even when the enclosing CI process completed successfully.

Track these separately:

- Implemented: actual test/model/assertion inspected.
- Configured: CI invokes the relevant selection under specified triggers.
- Executed: observed run at a known revision; stale runs do not verify current code.
- Enforced: observed branch/ruleset or equivalent integration policy requires it.
  A workflow job named `required` is insufficient evidence of enforcement.
  Where you have read access, check the branch rulesets and classic branch
  protection for the default branch (on GitHub: `GET /repos/{owner}/{repo}/rulesets`,
  `GET /repos/{owner}/{repo}/rules/branches/{branch}`, and
  `GET /repos/{owner}/{repo}/branches/{branch}/protection`), and match the
  required status-check names against the CI job names. If they are not
  readable, record enforcement as unknown and say which source was unavailable.

Compare docs with code; keep both facts when they disagree. Sample breadth first,
then trace high-impact paths deeply. State directories and history not inspected.

## Completeness without inflated percentages

Define dimensions and constraints before claiming coverage. Example ABI space:
change kind × type/layout × compiler/ABI × consumer usage. Example SaaS space:
state × event × role × provider outcome. Include excluded/unsupported cases.

Report separate counts for feasible, generated, selected, executed, passed,
failed, skipped and unsupported cases. Show how each denominator was obtained.
Pairwise coverage covers feasible pairs, not all tuples or all semantics. A
shared generator and oracle may share the same omission: audit the domain and
use independent examples. If enumeration is infeasible, say so; use bounded
subdomains, t-wise interaction coverage and risk-weighted sampling explicitly.
