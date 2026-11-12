# Project verification assessment

For a compact response, summarize scope, existing evidence, material gaps and
up to three pilots; place the ledger/category details in an appendix or linked
report when available. Do not discard uncertainty to shorten the report. Under
restricted tool access, mark command designs provisional and list what must be
verified before execution.

## Scope and outcome

- Repository/revision/dirty state:
- Product consumers and top promises:
- Inspected paths, runs, environments and date:
- Unavailable evidence and excluded scope:
- Main finding in plain language:

## What already works and where evidence is weak

Use every category from assessment.md; justify non-applicability.

| Category | Existing mechanism | Evidence IDs | Gap / uncertainty | User impact |
| --- | --- | --- | --- | --- |

## Evidence ledger

| ID | Claim | File/line or run URL + revision | Implemented | Configured | Executed/result | Enforced |
| --- | --- | --- | --- | --- | --- | --- |

For each execution attach command, environment, seed when applicable, duration,
selection/counts and artifact reference. Use unknown/not-run explicitly.

## Trace important promises

| Promise | Consumer entry | Implementation | Assertion/oracle | Run evidence | Missing link |
| --- | --- | --- | --- | --- | --- |

## Coverage domain and exclusions

List dimensions, feasible constraints, generator/oracle sources and measured
counts. Distinguish interaction strength from exhaustive coverage. If no defensible
denominator exists, describe scope without a percentage.

## Recommended pilots (maximum three initially)

For each: risk ID, priority rationale, existing mechanism to reuse, chosen method,
alternatives/deferred methods, rule and failure example, oracle, scope/exclusions,
proposed files/command, acceptance and negative control, estimated/measured cost,
owner role, rollout/CI triggers, artifacts, maintenance and rollback.

For formal pilots also state assumptions, bounds, open obligations, implementation
bridge and what the proof/search cannot establish.

## Implementation handoff

One self-contained work item per pilot, following integration.md. Clearly label
what was only proposed versus executed, implemented or enforced.
