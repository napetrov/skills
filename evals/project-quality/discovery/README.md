# Model-discovery validation (skill 0.2.0)

The new discovery workflow must recover a model, separate contract from inference,
inspect caller protections, classify findings correctly and propose durable checks.
Earlier 0.1.0 A/B results do not measure this expanded scope.

## Focused forward-test

Two small Python fixtures share the same public API and internal writer. The
writer itself has no guard. Variant a's public service checks state, worker and
epoch while holding a lock across the write; variant b checks state and worker
only. Both permit same-name reacquisition after expiry. Agent prompts are the
same focused state-machine request; no expected classification is provided.

Run `python evals/project-quality/discovery/check.py` to confirm the public-API
trace: a rejects stale completion and accepts the current token; b accepts stale
completion. This executable oracle checks the specific trace, not all concurrency.

A forward-test agent should produce:

- Source-linked entity/fields/transition/guard model and contract provenance.
- Variant a: no reachable missing-guard defect on the supported API; an explicit
  validation gap is allowed because no committed test suite exists.
- Variant b: concrete same-name/new-epoch stale-write violation, with sequence and
  consumer consequence; distinguish the public guard defect from the shared helper.
- Both: no claim of exhaustive discovery or remote CI enforcement; at most three
  focused integration pilots; no compulsory whole-project audit or framework rewrite.

Use a fresh context per target and only the skill, target files and assigned
output directory. No other fixture/oracle access. Model identifiers and token
usage are recorded only if exposed by the runner. Same-host instruction-scoped
isolation is not an OS security boundary. Reports are reviewed qualitatively
against this rubric, not scored by matching keywords.

## Coverage ledger

| Family | Evidence status | Next meaningful test |
| --- | --- | --- |
| P01 State/lifecycle | Current focused a/b forward-test | Multiple fields, callbacks and restored state |
| P02 Call ordering | Not independently evaluated | Invalid order versus constructor-enforced order |
| P03 Resource ownership | Not evaluated | Async buffer lifetime and RAII exception cleanup |
| P04 Atomicity/concurrency | Current a/b: lock+epoch boundary only | Separate-process persistence and atomic DB update |
| P05 Retry/idempotency | Not evaluated | Commit/ack interruption with duplicate delivery |
| P06 Decisions/configuration | Historical 0.1.0 Harbor domain example only | Constrained dispatch matrix and shadowed branches |
| P07 Error/unknown | Historical 0.1.0 Cedar metrics example only | Cross-layer fallback and partial success |
| P08 Representations | Historical 0.1.0 Harbor codec example only | Units/dtype narrowing with documented tolerance |
| P09 Cache/derived state | Not evaluated | Missing key dimension versus immutable versioning |
| P10 Compatibility | Historical 0.1.0 CLI/codec cases only | Versioned consumer and migration paths |
| P11 Oracles | Historical 0.1.0 circular/periodic fixtures only | Independent helper versus actual circular oracle |
| P12 Build/architecture | Not evaluated | Native declared action versus hidden shell input |

No percentages are justified by this ledger. Corporate profiles, compiler-backed
indexing, Semgrep/CodeQL queries and actual Lean/TLA+ verification are guidance,
not executed capabilities validated by these Python fixtures. The skill bundles
no new executable scanner. Keep unavailable-tool and correctly functioning cases
in future evaluations; do not tune until the skill appears to win.

## Observed result (2026-11-12)

Two fresh forward-tests used the revised skill and separate target directories.
Both reconstructed source-linked transition tables and contract provenance. The
protected variant was recognized as safe within its supported public API, while
the defective variant reproduced stale-first publication and loss of the current
result. Neither treated the internal helper alone as a separate bug or prescribed
a state-machine framework. Both reported absent maintained validation in scope.

The parent reviewed reports against the rubric above and executed `check.py`.
This is qualitative, non-blinded author review, not independent grading or an A/B
measurement. Exact model identity/token usage was unavailable. Evidence is under
`records/2026-11-12`; relative report links were rebased for the archive. Original
probe paths may refer to the run workspace; the portable oracle is `check.py`.
Dokimi strict skill check loads the new version, retaining only the repository's
intentional custom-frontmatter warning. All other families retain the limits in
the coverage ledger; no model-based novelty measurement was performed.
