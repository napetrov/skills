# Maintenance

Maintenance handles drift without a full reset: a moved test, a renamed module,
a changed runtime, an upgraded schema, or a modified requirement.

## Sequence

1. Discover drift: run `validate`, `discover`, `readiness`, and a check against the current tree.
2. Classify each change as a policy change (budget, size, oracle, baseline, negative
   control) or a wiring change (path, command, CI step, module name).
3. Propose a reviewable diff. Wiring changes and policy changes are separate changes.
4. Apply authorized changes.
5. Rerun `discriminate` for every changed contract, then record the new versions and remaining gaps.

## Rules

- Use content digests to decide invalidation. Age alone does not make a contract stale.
- A `setup-lock.json` digest mismatch alone is not a conflict. When the template is
  unchanged, the file is `user_owned` and setup leaves it as the user left it. When
  the template also changed, setup reports a conflict: produce a migration proposal
  and do not overwrite it.
- Unknown schema major versions fail clearly. Never downgrade silently.
- A requirement change that permits more work needs the product reason and a verified new budget.
- Changing or removing a `negative_control`, or changing its anchor, is a policy
  change. A control whose anchor no longer violates its metric makes the gate blind:
  it fails `discriminate` and needs the same review as a budget change.
- Existing regressions can be tracked as scoped debt with an owner and review date.
  An exception is never a successful measurement.
- Removing an integration preserves user-owned tests, docs, and CI jobs. Remove only
  generated wiring that has not been edited independently.
