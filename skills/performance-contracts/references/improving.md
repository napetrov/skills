# Improving

Improve mode changes implementation under an existing contract. It does not
change the contract.

## Loop

1. Reproduce the failing or materially poor case with `check --contract <id>`.
   Keep the result file.
2. Diagnose the mechanism from the counters: which operation grows with which
   dimension, and where repeated work happens.
3. Apply the smallest change that addresses that mechanism.
4. Rerun the same workload, oracle, and sizes. Compare before and after counters.
5. Keep the correctness assertions. A faster result that drops output fails.

## Constraints

- Do not change the oracle, sizes, budgets, or assertions in the same diff as an
  optimization. A policy change goes through maintain mode, in a separate reviewable change.
- Do not make the candidate its own reference.
- Report wall-time changes only when the environment is comparable, and label them advisory.
- If the root cause is outside the requested scope, report it and stop. Do not widen the change silently.
