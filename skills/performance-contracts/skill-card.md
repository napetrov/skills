# Skill Card: performance-contracts

## Purpose

Set up and check repeatable performance contracts. Each contract pairs a
correctness oracle with deterministic counter budgets over declared workload sizes,
and every gated assertion carries a negative control that must trip its own metric.

## Owner

Nikolay Petrov and contributors.

## Inputs And Outputs

- Reads repository files, and `discover` lists benchmark, asv, pytest, Bazel test and CI candidates without running them.
- Runs declared benchmark commands with argument arrays.
- `discriminate` copies the repository, without `.git` or run artifacts, into a temporary directory for each control and applies the declared text change there. The working tree is not modified.
- Writes ignored evidence under `.artifacts/contracts/<run-id>/`, including `discrimination.json` from `discriminate`.
- Writes tracked contract, baseline, and config files only in setup mode, and only through the scaffold helper. Files the user edited are kept, never overwritten.

## Limits

- Wall-clock results are advisory and environment-specific.
- Finite sizes do not prove asymptotic behavior.
- A `synthetic` negative control proves that a counter is wired. It does not show that the counter catches a real regression.
- A counter that no run moves is flagged as `insensitive_counter`; the warning does not repair the workload.
- The agent comparison pilot has not been run.

## Review Notes

Check that a budget change is a maintain-mode diff with a stated reason, and that
`latest` never appears as a baseline reference. Check that every gated assertion
still has a negative control whose anchor occurs once, that no control was
weakened to make a gate pass, and that a `synthetic` control is not presented as
evidence of sensitivity to a real regression.
