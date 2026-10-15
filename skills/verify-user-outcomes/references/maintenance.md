# Maintenance

Maintenance repairs mappings and evidence after structural change: a renamed
module, a moved test, a revised requirement, or a new consumer.

## Sequence

1. Run `validate` and a check against the current tree. Read every `stale_mapping` finding.
2. Classify each change: a wiring change (path, test name, command) or a policy
   change (acceptance criteria, intent, criticality).
3. Repair wiring with the history and code evidence that shows the move.
4. Apply policy changes only with the product reason and in a separate diff.
5. Rerun the affected outcomes and report the remaining gaps.

## Rules

- A renamed test keeps its evidence id. Changing an id changes the contract and needs a policy diff.
- Do not create new requirements retrospectively to justify current behavior.
- A `setup-lock.json` digest mismatch alone is not a conflict: while the template is unchanged, the user-edited file is `user_owned` and is left alone. When the template also changed, produce a migration proposal instead of overwriting it.
- Unknown schema major versions fail clearly. Never downgrade silently.
- Removing a test or outcome preserves user-owned tests, docs, and CI jobs.
