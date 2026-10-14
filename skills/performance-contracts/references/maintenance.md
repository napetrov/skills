# Maintenance

Maintenance handles drift without a full reset: a moved test, a renamed module,
a changed runtime, an upgraded schema, or a modified requirement.

## Sequence

1. Discover drift: run `validate`, `readiness`, and a check against the current tree.
2. Classify each change as a policy change (budget, size, oracle, baseline) or a
   wiring change (path, command, CI step, module name).
3. Propose a reviewable diff. Wiring changes and policy changes are separate changes.
4. Apply authorized changes.
5. Rerun a positive control and a negative control, then record the new versions and remaining gaps.

## Rules

- Use content digests to decide invalidation. Age alone does not make a contract stale.
- A `setup-lock.json` digest mismatch means the user edited the file. Produce a
  migration proposal and do not overwrite it.
- Unknown schema major versions fail clearly. Never downgrade silently.
- A requirement change that permits more work needs the product reason and a verified new budget.
- Existing regressions can be tracked as scoped debt with an owner and review date.
  An exception is never a successful measurement.
- Removing an integration preserves user-owned tests, docs, and CI jobs. Remove only
  generated wiring that has not been edited independently.
