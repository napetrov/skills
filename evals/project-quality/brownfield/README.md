# Brownfield Dokimi evaluation — 2026-11-12 (Pacific)

Tested skill 0.3.0 at public commit 5f363985fea0e81b467064e3ff3e16e518ab4d49.
Two fresh agents assessed the same four-file synthetic migration, one with the
skill and one without. Sources and six expected booleans were fixed before runs.
Agents received target-only instructions (plus the skill for that arm), no oracle
or sibling answers. Separation was instruction-scoped on a shared filesystem,
not an audited OS boundary. Model identity and token usage are unavailable.

Real Dokimi imported and scored answers with `eval score reference --no-judge`:
both arms passed the single whole-task JSON verdict. Six booleans are correlated,
not six independent tasks. This is a diagnostic, scaffolded development case with
all-false expected values, not a balanced or held-out benchmark. No accuracy gain
is established. Free-text reports were author-reviewed, not blindly scored.
Both agents found wrong default activation, negative-input violations and weakened
assertions, and accepted intentional zero correction and retained fallback.
The skill report additionally made negative controls, scope and process integration
more explicit. Reports and independent concrete probe observations are retained.

Dokimi catalog/skill checks load the current skill; the intentional extra metadata
warning remains. Existing answer re-scoring gives 3/3 per arm; it is not a new
behavioral evaluation of 0.3.0. Grader controls: 22 healthy accepted, 19 corruptions
rejected, three empty answers recorded as errors. Lexical routing: 8/10 scored
queries correct, two unscored; no model-based routing or novelty claim.

## Reproduce scoring

Run `score.py --answers records --out /tmp/brown-score --python /path/to/python
--dokimi /path/to/dokimi` (one command line). This only re-scores saved answers.
To repeat behavior, give fresh separate sessions the target README and source;
only the skill arm receives assess-project-quality 0.3.0. Write report.md and
verdicts.json to separate directories named baseline and skill. Keep this README,
score.py and records outside their allowed scope. Then pass their output parent
to --answers. Do not treat re-scoring as regenerating answers.

No real product migration, production replay, fault simulation, shadow safety,
release-artifact audit, or full brownfield-method coverage was measured.
