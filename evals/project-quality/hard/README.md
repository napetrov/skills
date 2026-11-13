# Harder project-assessment development evals

These cases replace answer recognition with code discovery. Agents see source,
public tests, support contracts and ordinary project docs, but no answer choices,
expected verdict fields or grading rubric. The identical task requests a report
of at most 800 words and no more than two prioritized improvements.

## Cases and provenance

All cases are constructed hypotheses derived from the user's request to assess
logic, flows, completeness and validation. They are not claims about defects in
oneDAL, abicheck, Dokimi or AIReady. Status: **draft development cases**; their
executable facts are self-checked, but user relevance has not been independently
reviewed. None is a holdout: results are visible to the skill author.

| Case | Initial state | Required outcome | Valid inaction |
| --- | --- | --- | --- |
| cedar | Green unit tests, lease store and provider report | Find same-owner stale completion and timeout denominator errors, propose targeted regressions | Target source stays unchanged; a no-findings assessment is incorrect |
| harbor | Green generated tests, packed integer codec and coverage dashboard | Reproduce a same-size consumer break and diagnose unsound domain reduction/shared oracle | Target source stays unchanged; asserting compatibility is incorrect |
| quartz | Correct bounded arithmetic and batching, obsolete review | Credit current checks, reject stale/modulo and nested-loop false alarms; scope any improvement | Yes: leaving implementation unchanged is correct |

The grading file is evaluator-only. `prepare.py` copies only fixtures and a common
TASK.md into separate workspaces for each task/arm; it freezes a skill snapshot
and writes a manifest. Unlike the first suite, the two arms do not share target
workspaces. Shared host storage still means isolation depends on scoped agent
instructions; this is not a Docker or OS security boundary.

## Run

From the repository root:

```bash
python evals/project-quality/hard/selfcheck.py
python evals/project-quality/hard/prepare.py /tmp/quality-hard-run
```

Run the six manifest prompts in fresh same-configuration agent sessions. Do not
expose `rubric.json`, this README, `selfcheck.py`, sibling outputs or prior reports
to task agents. Record the model and usage when available; do not invent missing
metadata. Source edits/network access are forbidden; inspected local tests and
probes in each assigned output folder are allowed.

## Executable oracle checks

`selfcheck.py` independently confirms all three public suites pass. Contract
assertions then fail on both Cedar defects and Harbor's consumer counterexample.
In disposable copies, matching reference fixes make those assertions pass.
Quartz's public suite fails after a real modulo mutation; the original passes.
These prove the chosen cases/controls discriminate the seeded behaviors, not
that the report grader can interpret an answer correctly.

## Report assessment

Freeze `rubric.json` before generating answers. Two fresh reviewers should receive
anonymized reports, task-specific rubrics and calibration controls, but no arm
mapping, skill text, expected A/B winner or sibling reviewer grades. Give a short
supporting quotation for every criterion marked met. Score conjunctive criteria
only when all named requirements are explicit; distinguish an untested proposal
from an executed check. Record critical false claims separately from omissions.

Calibrate on known-good and degraded reports; never count calibration controls as
agent task outcomes. Report reviewer disagreements rather than silently averaging
them away. A criterion count is an agent-judged coverage measure, not a deterministic
correctness metric, statistical significance or an implementation success rate.
The grading task unit remains the report/task: six criteria from one report are
correlated. Keep false-positive performance on Quartz separate from bug discovery.

The task agents are not requested to modify a product, so "no code change" is
not failure. A correct report can recommend no change on Quartz. Generic advice
without finding a concrete seeded violation on Cedar/Harbor is insufficient.

## Still uncovered

No production repository scale, unknown real defects, long noisy histories,
parallel database processes, real compiler ABI matrix, numerical conditioning,
Lean/TLA+ execution, external LLM calibration or multi-model stability. One run
per task/arm is a pilot; do not claim representative effectiveness from it.

## Reproduce report grading

After collecting reports, `python hard/blind_reports.py <work>` (using the full
repository-relative script path) prepares `review-packet.json`. Give only that
file to two fresh reviewers. Require every report/criterion and a short evidence
quote, using this shape:

```json
{"reports":[{"id":"r01","criteria":{"C1":{"met":true,"evidence":"exact supporting text"}},"critical_false_claims":[]}]}
```

Use the actual six IDs for the report's rubric. Store as `reviewer1.json` and
`reviewer2.json`, keeping `review-map.json` hidden. Then run:

```bash
python evals/project-quality/hard/score_reviews.py \
  --work /tmp/quality-hard-run \
  --dokimi-root /path/to/dokimi --python /path/to/dokimi-python
```

This reports control calibration, disagreements and agent-judged criterion
coverage. It does not gate on the apparent winner. See RESULTS.md for the retained
calibration disagreement in the first run. Calibration controls are in
`calibration.json`; they are not agent-task inputs.

## Fixture workflow maintenance

After the recorded experiments, Cedar and Quartz workflow examples were hardened
with immutable action pins, read-only contents permission and disabled credential
persistence. Application/test semantics are unchanged. Historical freeze hashes
refer to the original inputs; new preparation runs hash the updated fixtures.
