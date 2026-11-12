# Project models and verification assessment

This is the full-report template, not mandatory output length. Default to
400–800 words covering scope, cited findings, limits and up to three pilots.
Consider all categories during inspection; include full category/ledger tables
only on request or when needed to resolve uncertainty. Avoid repeated findings. Do not discard uncertainty to shorten the report. Under
restricted tool access, mark command designs provisional and list what must be
verified before execution.

## Scope and outcome

- Repository/revision/dirty state:
- Product consumers and top promises:
- Inspected paths, runs, environments and date:
- Unavailable evidence and excluded scope:
- Main finding in plain language:

## Models and search scope

Selected profile/families; inspected entry points, reads/writes and build variants;
excluded/unsupported areas; tools used and remaining search limits. Summarize
recovered models and rule provenance. For focused requests, only the requested
family and necessary dependencies need assessment. Do not claim "all" without a
justified finite domain and a complete method for it.

## Findings and opportunities

Use finding-card.md classifications and stable IDs. Separate confirmed defects,
validation gaps, optional improvements, safe patterns and unresolved candidates.
Give cited rule, consumer impact, refutation attempt, validation result and next
step. No-change conclusions are valid. Add transition/ownership/decision tables
only when they clarify evidence; do not label every implicit model a defect.

## What already works and where evidence is weak

For broad audits triage every category from assessment.md; for focused audits
report relevant categories and scope exclusions. Keep full tables optional.

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
