---
name: performance-contracts
description: Set up and check repeatable performance contracts that catch scaling regressions and wrong optimized output in Python or Node projects.
version: 0.1.0
license: Apache-2.0
product: petrov-contracts
product_family: engineering-verification
tags: [performance, benchmarking, scaling, regression, contracts]
problems: [detect-scaling-regression, verify-optimization-correctness, enforce-resource-budget]
agents: [codex, claude-code]
maturity: experimental
data_classification: public
source_url: https://github.com/napetrov/skills
implementation_url: https://github.com/napetrov/skills/tree/main/skills/performance-contracts
---

# Performance Contracts

Use this skill when a change touches collection processing, matching, parsing,
cache ownership, batching, query construction, queues, concurrency, or repeated
work, or when the user asks for a performance review. Each contract ties one
operation's correctness and resource use to one independent oracle, so an
"optimization" cannot pass by dropping output.

## Route The Request

| User intent | Mode | Reference |
| --- | --- | --- |
| prepare, enable, instrument, add checks | setup | `references/setup.md` |
| review, check, audit, explain status | check | `references/checking.md` |
| fix or optimize under an existing contract | improve | `references/improving.md` |
| upgrade, repair wiring, revise a budget | maintain | `references/maintenance.md` |

Load only the reference for the active mode. Check is the default for review requests.

## Readiness

Readiness is derived per enrolled scope from files and evidence. It is never a stored flag:

```bash
node scripts/perf-check.js readiness --repo <repo>
```

The helper reports `unconfigured`, `discovered`, or `instrumented`. Reaching
`validated`, `integrated`, or `enforced` needs negative-control runs and CI
evidence that the helper does not infer, so report those states separately.

## Commands

```bash
node scripts/perf-check.js validate --repo <repo>
node scripts/perf-check.js check --repo <repo> [--base <ref>] [--contract <id>] [--all]
node scripts/perf-check.js setup --repo <repo>
```

`check` writes `result.json` under `.artifacts/contracts/<run-id>/`. Exit codes:
0 pass or not applicable, 1 violation, 2 error, 3 inconclusive.
`scripts/contract-core.js` is the shared runtime copied from the Petrov source;
do not edit the copy.

## Rules

- Verify correctness against an independent oracle before reading any timing.
- Gate on deterministic counters. Wall time and memory are advisory in v1.
- Never loosen a budget to make a failing check pass. That is a maintain-mode
  change with a stated reason and its own diff.
- Baseline references are versioned manifests such as `fixture-reference-v1`, never `latest`.
- Fit only declared sizes. A missing or timed-out size is an error, not a smaller fit.
- Do not commit production data, raw traces, or credentials.

## Completion

The requested scope has a verdict backed by a result file. Report the evidence
path, the diff base and the performance baseline as separate references, and the
limitations. In improve mode, the same workload and oracle must show preserved
correctness and better counters.

## Safety And Limits

- Contract commands run as argument arrays without a shell. Report text is never interpolated into a command.
- Finite workload sizes do not prove asymptotic complexity. A nested loop is a candidate, not a finding.
- Live external-service measurement needs explicit authorization and cost limits, and it is outside the default profiles.
