# Benchmark Status

- Skill: `assess-project-quality`
- Version: `0.1.0`
- Status: package validation passed; one synthetic agent forward-test completed.

## Acceptance scope

Repository validators check metadata, packaging, manifests and trust declarations.
They do not measure assessment accuracy. Behavioral scenarios and grading criteria
live in `evals/project-quality/tasks.md`, outside the npm package.

A fresh-context agent forward-test should assess supplied repository evidence,
including misleading CI success and bounded formal claims. Record which scenarios
were actually exercised; do not claim representative product effectiveness from
one agent run. No controlled with/without-skill benchmark has been performed.

## Observed forward-test

A fresh-context agent examined the combined synthetic case in
`evals/project-quality/forward-test.md`. It rejected empty green CI as behavioral
evidence, identified the circular oracle and missing platform domain, limited
formal claims, and proposed three bounded pilots without uploading source.
Missing-locator and compact-output guidance was clarified afterward. This does
not establish accuracy on real repositories; no controlled baseline was run.
