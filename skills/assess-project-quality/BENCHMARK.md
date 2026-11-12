# Benchmark Status

- Skill: `assess-project-quality`
- Version: `0.1.0`
- Status: package validation passed; three paired development tasks and one compact-output retest completed.

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
