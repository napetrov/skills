---
name: verify-user-outcomes
description: Set up and check that promised user outcomes are reachable, asserted by tests, and linked to intent and implementation.
version: 0.1.0
license: Apache-2.0
product: verification-contracts
product_family: engineering-verification
tags: [acceptance, traceability, end-to-end, outcomes, verification]
problems: [verify-user-outcome, detect-disconnected-result, trace-intent-to-evidence]
agents: [codex, claude-code]
maturity: experimental
data_classification: public
source_url: https://github.com/napetrov/skills
implementation_url: https://github.com/napetrov/skills/tree/main/skills/verify-user-outcomes
---

# Verify User Outcomes

Use this skill for feature work, changed user flows, design reviews, integration
changes, or an explicit audit of promised behavior. The chain it checks is
outcome, then acceptance criteria, then design decision, then implementation,
then executable evidence. A result passes only when a test that asserts the
user-visible result actually ran.

## Route The Request

| User intent | Mode | Reference |
| --- | --- | --- |
| prepare, enable, add scenario evidence | setup | `references/setup.md` |
| review, check, audit, explain status | check | `references/checking.md` |
| fix a broken outcome under its contract | improve | `references/improving.md` |
| move modules, revise intent, repair mappings | maintain | `references/maintenance.md` |

Load only the reference for the active mode.

## Readiness

Readiness is derived per enrolled scope from files and evidence:

```bash
node scripts/outcome-check.js readiness --repo <repo>
```

It reports `unconfigured`, `discovered`, or `instrumented`. Discrimination runs
and CI evidence establish `validated`, `integrated`, and `enforced`, and the helper
does not infer them.

## Commands

```bash
node scripts/outcome-check.js validate --repo <repo>
node scripts/outcome-check.js check --repo <repo> [--base <ref>] [--outcome <id>] [--all]
node scripts/outcome-check.js setup --repo <repo>
```

Evidence is matched to tests by a bracketed id in the test name, for example
`[scan-comparison-happy] ...`. Zero matches are errors. Skipped tests are
inconclusive. `check` writes `result.json` under `.artifacts/contracts/<run-id>/`.
Exit codes: 0 pass or not applicable, 1 violation, 2 error, 3 inconclusive.
`scripts/contract-core.js` is the shared runtime copied from the source;
do not edit the copy.

## Rules

- Evidence levels are linked, exercised, asserted, and observed. Claim only the level reached.
- An end-to-end label does not guarantee a meaningful assertion. Read the assertion.
- Check the consumer boundary: the outcome is verified where the user or caller receives it.
- Never create a new requirement to justify the current implementation.
- Do not delete a component for lacking telemetry or coverage. Investigate indirect value first.
- Do not commit production data or credentials.

## Completion

Each requested outcome has a verdict backed by a result file, its evidence ids
mapped to executed tests, and the missing link named precisely when it fails.
Report what the evidence does not cover.

## Safety And Limits

- Commands run as argument arrays without a shell.
- Fixture assertions show behavior inside the fixture. They do not show live provider, OAuth, or deployment behavior.
- Behavioral verification does not establish market demand or business value.
