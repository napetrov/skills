# Checking

Check reads code and runs enabled contracts. It writes only ignored artifacts
under `.artifacts/contracts/`. It makes no tracked policy or implementation edits.

## Diff Base

Resolve the base explicitly, in this order:

1. The `--base` value, when supplied.
2. The verified pull-request merge base, when `GITHUB_BASE_REF` resolves.
3. The working tree against `HEAD`, including staged and untracked files.

If the intended base cannot be established, the helper runs the full enrolled
scope and records the limitation. The diff base and the performance baseline are
different references, and the report names both.

## Selection

- A contract is selected when a changed file matches one of its `paths`.
- A change to `.verification/contracts/`, `benchmarks/contracts/`, `tools/contracts/`,
  or a lockfile selects every enabled contract.
- A changed file that no enrolled scope covers is an `uncovered_scope` finding.
- Use `--contract <id>` for an explicit selection, or `--all` for the full enrolled scope.

## Verdicts

- `pass`: every declared size satisfies every assertion.
- `fail`: a demonstrated violation, with the metric, size, expected value, and observed value.
- `error`: a broken command, timeout, missing point, missing metric, or unreadable result.
- `inconclusive`: evidence is insufficient, or unmapped changes exist with no selected contract.
- `not_applicable`: the declared rule excludes every contract and nothing unmapped changed.

Aggregate precedence is error, fail, inconclusive, pass. A passing exit code alone
is never enough: the expected assertions must have run.

## Report

Give the verdict, each contract's verdict with its reason, the violated assertions
with sizes, the result file path, the diff base, the baseline references, and the
limitations. Separate a product regression from an execution error.
