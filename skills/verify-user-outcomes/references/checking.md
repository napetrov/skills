# Checking

Check runs the enabled outcome contracts and reads their evidence. It writes only
ignored artifacts under `.artifacts/contracts/`. It makes no tracked edits.

## Selection

- Enabled outcomes whose intent or implementation references match a changed file are selected.
- A change to `.petrov/contracts/` or `tools/contracts/` selects every enabled outcome.
- Use `--base <ref>` for an explicit diff base. Without it, the helper uses the verified
  pull-request merge base, then the working tree against `HEAD` including staged and
  untracked files. If no base can be established, it runs the full enrolled scope.
- A changed file outside every enrolled scope is an `uncovered_scope` finding.
- A stale reference (a missing intent or implementation file) is a `stale_mapping` finding and an error for that outcome.

## Verdicts

- `pass`: every evidence id matched at least one test, and every match passed.
- `fail`: a matching test failed. Report the test name and the failing assertion.
- `error`: no test matches the id, the runner timed out, or a reference is stale.
- `inconclusive`: every matching test was skipped.

## Report

Give each outcome's verdict, the evidence ids with their matched test names, the
result file path, and the limitations. For a failure, name the broken link:
the entry point, the consumer boundary, or the acceptance condition.
