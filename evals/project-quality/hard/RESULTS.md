# Harder development eval results — 2026-11-12

The harder suite demonstrates executable counterexamples and a useful exploratory
finding, but still does not establish a general accuracy advantage for the skill.
Both arms found the seeded defects and avoided the healthy-case false alarms.
The observed difference was report completeness and an extra test-strength probe.

## What became harder

- Source repositories replace prose that already names the failure.
- No answer menu, prescribed verdict keys or expected findings in task prompts.
- The same generic assessment request is used for all cases.
- Every supplied test suite passes, including two repositories with real seeded
  contract violations. A third repository is correct for its support contract.
- Agents must cross module/consumer boundaries, reconstruct a 64-case input space,
  distinguish a shared oracle from independent expected values, and reject stale
  documentation and misleading nested-loop concerns.
- Each arm has its own target checkout. Six reports are graded blind to arm by two
  fresh reviewers, with six mixed-in calibration reports and a frozen rubric.

## Executable checks and task outcomes

| Case | Independently checked ground truth | Baseline | Skill |
| --- | --- | --- | --- |
| Cedar | New epoch with same worker permits stale overwrite; timeout report returns 0.5/1.0 instead of 1.0/0.5 | Found both | Found both |
| Harbor | Equal-size layouts corrupt old consumer values; 64 pairs collapse to 9 cases; oracle calls classifier | Found all | Found all |
| Quartz | Current saturation/batching correct; old modulo report obsolete; scalar domain has 1,024 checked pairs | No false alarm | No false alarm |

`selfcheck.py` verifies that original visible suites pass, independent contract
assertions fail on the planted defects, disposable reference fixes pass those
assertions, and a modulo mutation fails Quartz's existing suite. These are actual
executions, not a language-model judgment of code correctness. The Harbor agents
also enumerated 16 false-positive verdicts among 64 supported layout pairs.

## Blinded report grading, imported into Dokimi

Each task has six conjunctive criteria covering discovery, evidence, scope and
integration. Both reviewers gave the same real-report decisions:

| Case | Without skill | With skill |
| --- | --- | --- |
| Cedar | 4/6 | 6/6 |
| Harbor | 6/6 | 6/6 |
| Quartz | 6/6 | 6/6 |
| Criterion coverage | 16/18 | 18/18 |
| Reports satisfying every criterion | 2/3 | 3/3 |

No critical false claims were marked in any real report. Cedar's baseline found
both bugs, but did not explicitly connect the report tests' all-success data to
the missing partial-provider case, or provide an explicit negative control and
concrete CI plan. These are omissions in report completeness, not missed bugs.

Reviewers received randomized anonymous reports and rubrics, never the mapping or
skill text. They used the inherited model configuration, not different verified
model families. One reviewer passed all 6 calibration reports; the second passed
5/6, refusing one known-good Cedar criterion because it did not explicitly say
reacquisition creates a new epoch. Preserve this calibration/explicitness problem:
it makes the scores provisional even though real-report decisions agreed. No
rubric or control was changed after seeing the grades. Style may still reveal an
arm despite removal of names/paths; blinding is not guaranteed.

`score_reviews.py` imports reviewer decisions into Dokimi `answers.v1` and uses
`eval score reference --no-judge` to aggregate them. The six criteria remain
**agent-judged**, not transformed into independent deterministic correctness
measurements by that aggregation. Three task units, one repetition each, and two
reviews of the same reports are not six independent task replications.

## Exploratory result not added to the score

On Quartz, the skill agent created a chunk-swap mutant. Existing batch data repeat
every 32 rows, so swapping two 64-row output chunks passes all existing tests.
An independently constructed sequence of 64 ones, 64 twos and a final three catches
it. The parent reproduced this using portable `order_probe.py`: original and
mutant both pass the supplied 3-test suite, but the distinct-chunk probe accepts
only the original. The baseline suggested an invalid-input batch regression but
did not report this order-oracle weakness.

This is a valuable observed test-strength finding, not a current implementation
bug, an after-the-fact rubric point, or proof that the skill caused the difference.

## Cost and limits

| Report | Without skill, words | With skill, words |
| --- | --- | --- |
| Cedar | 584 | 608 |
| Harbor | 575 | 625 |
| Quartz | 494 | 629 |

All six satisfy the common 800-word limit. Totals: 1,653 without versus 1,862 with
(~13% more). Exact token usage, model identity and agent wall-time were not exposed;
word counts are not token or dollar costs. Skill instructions were frozen during
these runs and were not tuned to improve the hard-case score.

These are still small constructed development cases, not production audits or
held-out natural failures. User relevance and the grading rubric have not had
independent human review. Remaining work should target larger noisy repositories,
multiple runs/model families and fresh user-sourced holdouts; do not tune until
one arm wins. See [README.md](README.md) for scope and reproduction.

Small evidence records, probes and judgments are under
[records/2026-11-12](records/2026-11-12). Original agent probes may contain the run's
absolute paths; portable `selfcheck.py` and `order_probe.py` reproduce the core
claims without that workspace. No external LLM novelty run was performed.
