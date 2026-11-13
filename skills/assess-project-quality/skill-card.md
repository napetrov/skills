# Skill Card: assess-project-quality

## Purpose

Recover hidden behavioral models and contracts, validate candidate risks and
existing checks, and propose selective integration into development and CI.

## Owner

Skills contributors.

## Inputs And Outputs

Reads project files and available execution evidence. Produces a Markdown report
with model inventory, classified finding cards, evidence, prioritized pilots
and implementation-agent handoffs.
No bundled scripts, external accounts or network dependency. Local tools or
connectors may be used when available and authorized.

## Limits

An assessment is not a proof, certification or automatic implementation. The
skill cannot infer execution or enforcement from static files. Public package
metadata does not authorize disclosure of private input repositories.

## Review Notes

Check the evidence-to-claim mapping, coverage denominator, oracle independence,
formal-model boundary and concrete pilot acceptance conditions. See BENCHMARK.md
for validation scope; no quantitative improvement claim is made.

## Experimental Evidence

Three paired development tasks reached the same correct verdicts with and without
the skill. A targeted compact-output retest retained its verdicts with less text.
Default output is now 400–800 words; full ledgers are optional. See BENCHMARK.md
for limits. No novelty or production-effectiveness claim is made.

A harder three-task source-discovery pilot found the same core defects in both
arms; the skill reports met more completeness criteria and found one additional
oracle weakness. Reviewer calibration was imperfect; see BENCHMARK.md. This is
experimental evidence, not a verified general improvement.

## Model-discovery workflow (0.2.0)

Discovers hidden state, ordering, ownership, concurrency, retry, decision, error,
representation, cache, boundary, oracle and build models. Profiles prioritize
questions for personal and enterprise repositories without prescribing company
policy. A common finding card separates candidates, defects, validation gaps,
opportunities and safe-in-scope patterns. No new executable scanner is bundled.
Historical 0.1.0 task results do not validate every 0.2.0 discovery family.

## Multi-round lessons (0.4.0)

Adds full-output differential oracles, sequential merging of parallel pilots on a fresh base, cross-branch CI triage, matrix-wide cost measurement, profiles as hypotheses, an optional next-round step with stop criteria, a cost warning, and where to check enforcement.

## Change assessment (0.3.0)

Adds optional change contracts, replay/shadow assessment, test-integrity and release-activation checks. Legacy behavior is not automatically normative.
