# Skill Card: performance-contracts

## Purpose

Set up and check repeatable performance contracts. Each contract pairs a
correctness oracle with deterministic counter budgets over declared workload sizes.

## Owner

Nikolay Petrov and contributors.

## Inputs And Outputs

- Reads repository files and runs declared benchmark commands with argument arrays.
- Writes ignored evidence under `.artifacts/contracts/<run-id>/`.
- Writes tracked contract, baseline, and config files only in setup mode, and only through the scaffold helper.

## Limits

- Wall-clock results are advisory and environment-specific.
- Finite sizes do not prove asymptotic behavior.
- The agent comparison pilot has not been run.

## Review Notes

Check that a budget change is a maintain-mode diff with a stated reason, and that
`latest` never appears as a baseline reference.
