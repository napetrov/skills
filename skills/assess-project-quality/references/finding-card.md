# Unified model and finding card

Maintain model inventory separately from problem findings. A model entry records
entity, fields, transitions/relations, rule provenance, source references and
inspection scope. Finding cards reference that model; do not make every inventory
entry an issue or duplicate one root cause across every affected file.

## Card fields

- **ID / family / model:** stable identifier, P01–P12, affected model(s).
- **Classification:** candidate-risk, confirmed-defect, validation-gap,
  improvement-opportunity, confirmed-safe-in-scope, or insufficient-evidence.
  Candidate is not confirmed; a validation gap does not prove production is wrong.
- **Rule and provenance:** exact consumer promise; documented source, inferred
  rationale, or unresolved interpretation. Separate severity/impact from evidence strength.
- **Scope:** commit/dirty state, paths, support domain, build/environment and exclusions.
- **Evidence:** entry, guards, writes, effects, consumers and existing assertions,
  with file/line references. Record inaccessible facts rather than guessing.
- **Hypothesis/refutation:** violating sequence/input; caller protections checked;
  healthy case or alternative explanation. Explain why the path is reachable.
- **Validation:** executed reproducer + observed/expected results and receipt, or
  static argument/model counterexample/unexecuted design with explicit limits.
- **Impact:** actual or plausible consumer consequence; qualitative priority rationale.
- **Existing checks:** implemented/configured/executed/enforced, each independently known.
- **Action:** fix, stronger assertion, explicit model/type, rule, documentation, or
  no change. Give the smallest useful choice and alternatives deferred.
- **Acceptance / healthy / negative control:** how the chosen check distinguishes
  valid behavior from the specific fault; no empty/skip/timeout success.
- **Integration:** proposed files/commands, owner role, estimated/measured cost,
  CI trigger/stage/artifacts, maintenance/expiry, exception and rollback.

Compact reports can combine these fields into a short paragraph or table row;
full cards belong in an appendix when requested or needed for review. Do not pad
every confirmed-safe inventory entry with a fictitious implementation pilot.

## Example classifications

- Lease trace reproduces stale overwrite against an explicit rule: confirmed-defect.
- Correct batching but a chunk-swap mutant passes tests: validation-gap.
- Scattered status writes are guarded correctly; central transition API may reduce
  maintenance cost: improvement-opportunity, with tradeoff and no release-blocking bug.
- Suspicious helper, unavailable caller implementation: insufficient-evidence.
- Healthy fixed-size nested loop traverses every item once: confirmed-safe-in-scope
  for that complexity claim, not certification of the entire function.
