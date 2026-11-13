# Benchmark Status

- Skill: `assess-project-quality`
- Version: `0.2.0`
- Status: historical 0.1.0 experiments below; 0.2.0 model-discovery validation recorded separately.

## Acceptance scope

Repository validators check metadata, packaging, manifests and trust declarations.
They do not measure assessment accuracy. Behavioral scenarios and grading criteria
live in `evals/project-quality/tasks.md`, outside the npm package.

A fresh-context agent forward-test should assess supplied repository evidence,
including misleading CI success and bounded formal claims. Record which scenarios
were actually exercised; do not claim representative product effectiveness from
one agent run. A small paired development experiment is reported below; no
powered, independently reviewed effectiveness benchmark has been performed.

## Observed forward-test

A fresh-context agent examined the combined synthetic case in
`evals/project-quality/forward-test.md`. It rejected empty green CI as behavioral
evidence, identified the circular oracle and missing platform domain, limited
formal claims, and proposed three bounded pilots without uploading source.
Missing-locator and compact-output guidance was clarified afterward. This does
not establish accuracy on real repositories; that initial forward-test had no
baseline. The subsequent paired experiment below is a separate measurement.

## Paired development experiment (2026-11-12)

Six fresh agent runs were scored with Dokimi reference checks: baseline 3/3,
initial skill 3/3. No accuracy improvement established. Reports with the initial
skill were 2.46× longer; compact output guidance reduced the compatibility retest
from 1,854 to 786 words while preserving its five verdicts. This retest is not a
holdout. Dokimi accepted 22 healthy grading controls, rejected 19 corruptions and
marked three empty responses as errors. Catalog/routing/inspection were run;
LLM novelty was estimate-only because no external model backend was configured.

Full methods, limitations and small evidence records: `evals/project-quality/`.
This is three task units, one run per arm, not a broad effectiveness benchmark.

## Harder source-discovery pilot (2026-11-12)

Three new source-based cases, six fresh task runs, no answer choices or verdict
keys, all supplied suites green, including one correct implementation. Both arms
found the seeded bugs and avoided false alarms. Two blinded reviewers agreed on
18/18 required report criteria with the skill versus 16/18 without; these are
agent-judged completeness criteria from three task units, not accuracy statistics.
One reviewer passed 6/6 calibration controls, the other 5/6; scores remain
provisional. No hard-case tuning of skill instructions was performed.

An extra chunk-order oracle weakness found by the skill agent was independently
reproduced, but not added to the frozen score. Portable executable checks, rubric,
reports, calibration limitations and Dokimi aggregation are in
`evals/project-quality/hard/`. No production or general-effectiveness claim.

## Model-discovery revision (0.2.0)

The workflow now includes family-specific discovery, rule recovery, refutation,
classification and organizational profiles. Earlier experiments evaluated 0.1.0;
they are not a measured effectiveness claim for the expanded workflow. New scope
and validation are tracked in `evals/project-quality/discovery/`.

Two fresh focused forward-tests on caller-guard fixtures completed: the protected
variant was classified safe within its supported API with a validation gap; the
worker-only variant produced a confirmed stale-first publication defect. Both
reconstructed source-linked transitions and limited scope without demanding a
framework rewrite. The independent public-API oracle passes the protected case
and fails the unfenced one. This is author-reviewed qualitative evidence, not
a new A/B comparison or validation of all twelve families. Dokimi strict skill
check loads the revised skill with the existing catalog-metadata warning only.

## Change assessment (0.3.0)

New brownfield guidance has packaging validation only. Prior agent experiments do not validate this mode; no new migration accuracy or production effectiveness claim is made.
