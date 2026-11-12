# Project-quality experiment suite

This is a development suite, not a held-out benchmark. It measures a small set of
facts and the usefulness/cost of the resulting integration plan separately.

## Tasks and ground truth

`grading-frozen.json` was fixed before agent runs. Three independent task units:

- **compat:** supplied synthetic evidence of empty green CI, circular corpus
  expectations and overclaimed bounded/open proof results. Derived from the
  user's request to assess logic, completeness and validation; a scenario
  hypothesis, not an observed defect in a public compatibility tool.
- **flow:** the repository's real Node consumer-outcome fixture with a deliberate
  presentation mutation. Existing CLI test and independent expected helper output
  establish that computation works while the consumer outcome is broken.
- **numeric:** the repository's real Python performance fixture plus a four-bucket
  nested loop. Source analysis under stated arithmetic assumptions and independent
  deterministic counters distinguish a fixed bound from quadratic growth.

Task instructions expose the output fields and answer choices, but not expected
values. This is a deliberately diagnostic benchmark with substantial answer
scaffolding. It does not measure unconstrained discovery of unknown risks.

Coverage: happy/error paths, false CI success, incomplete evidence, misleading
formal claims, circular oracle, consumer disconnection, unjustified complexity
claim and unauthorized external instruction. Not covered: real distributed
scheduling, theorem proving, production oneDAL/abicheck/AIReady behavior, live
LLM-judge validity, production deployment, large-repository completeness.

## Reproduce

Use the `intel/dokimi` revision recorded in `records/2026-11-12/summary.json`.
Create its environment per its own setup instructions. The observed runs used
Python 3.12.14, Dokimi source 0.2.0, regex 2026.11.9, PyYAML 6.0.3,
jsonschema 4.26.0, and the already available environment for the free commands.
The estimate-only path additionally used litellm 1.109.1 and openai 2.54.0 with
`LITELLM_LOCAL_MODEL_COST_MAP=True`; it made no model call.

From this repository:

```bash
python evals/project-quality/prepare.py /tmp/project-quality-run
```

Run every entry of `agent-manifest.json` in a fresh session. Keep the grading
file, other tasks, sibling answers and solution artifacts outside the agent's
allowed read scope. Do not call one agent sequentially for both arms. The original
experiment used instruction-scoped separation on a shared filesystem, not an OS
security boundary; no independent filesystem access-log audit was performed.
The task sources must remain unchanged. Store outputs in the prescribed folders.
Use the same model/configuration for both arms and record identity, usage and
latency if the runner exposes them. The initial run used inherited session
models, with exact model identity/token usage unavailable.

```bash
python evals/project-quality/run_dokimi.py \
  --dokimi-root /path/to/dokimi \
  --python /path/to/dokimi-python \
  --answers-dir /tmp/project-quality-run/outputs \
  --out /tmp/project-quality-results
```

This runs real Dokimi catalog checks, lexical routing, repository inspection and
`eval score reference --no-judge`. It imports agent outputs into `answers.v1`,
builds `questions.v2` grading and writes `eval.v1` results. It does not generate
answers, invoke a model, or claim that Dokimi orchestrated the agent sessions.
To rescore the committed small reports, point `--answers-dir` at
`evals/project-quality/records/2026-11-12/outputs`.

## Grader controls and interpretation

One question equals one whole task verdict object. Its 4–5 fields are correlated,
not independent statistical observations. A JSON-equality oracle is insensitive
to whitespace and key order but catches a changed value or missing key.

The harness constructs 22 control pairs: 13 single-field corruptions, three
malformed JSON responses, three missing-field responses and three empty answers.
Healthy formatted answers must all pass. Corruptions must fail or be reported as
errors, never pass. Empty answers are Dokimi errors, outside its scored denominator.
The runner records this distinction instead of claiming 22 scored failures.

Free-text reports are deliberately not graded by keyword matching. Review them
for evidence accuracy, actionable acceptance/negative controls, owner, estimated
budget, rollout, maintenance, rollback and unnecessary detail. A correct verdict
object can coexist with a poor report, so the deterministic score is only partial
evidence. A word count measures output verbosity, not token usage or dollar cost.

Routing queries include English and Russian user-shaped requests, independent of
skill headings. The free lexical floor can ignore non-English content words;
report unscored queries explicitly. It is not a model selector measurement.

Before claiming improvement: add independently sourced, harder tasks; use multiple
runs per arm and calibrated blinded report review; preserve a fresh holdout after
tuning. A three-task all-correct baseline has no measured headroom.
