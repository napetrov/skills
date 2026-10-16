# Improving

Improve mode repairs the implementation so an existing outcome contract passes.
It does not weaken the contract.

## Loop

1. Reproduce the failure with `check --outcome <id>` and keep the result file.
2. Locate the broken link: the entry point is unreachable, the result is produced
   but not delivered to the consumer, or the behavior contradicts an acceptance condition.
3. Apply the smallest fix in the implementation.
4. Rerun the same outcome. Confirm the matched tests now execute and pass.
5. Keep the assertion. Do not replace a meaningful assertion with a weaker one.

## Constraints

- Changing acceptance criteria or intent is a maintain-mode change with its own diff.
- If the intent itself conflicts with the implementation, report the conflict and ask. Do not pick silently.
- Do not delete a component to make its evidence disappear. Removal needs a separate justified change with dependency and behavior checks.
