Working category review (revision 2368f4759e88ae8d01bc4b71cc2954c1a61f8152)

| Category | Mechanism/evidence | Gap and risk/applicability |
|---|---|---|
| Intent/usability | README:2-11; CLI demonstration | Applicable: CLI materially misreports its own example; no user research supplied. |
| Logic/decisions | report.py:1-5; store.py:18-22 | Applicable: wrong denominators and incomplete lease identity. |
| Flows/concurrency | claim/complete, tests:test_takeover | Applicable: same-name restart stale-write; sequential reproduction sufficient. Real distributed concurrency excluded from local model. |
| Input/configuration | three fixed tests | Applicable: timeout/empty/all-unknown and reused-name dimensions missing from tests; malformed input policy unspecified. |
| Oracle strength | hand-written expected values | Applicable: all-success aggregation and different-name takeover mask both defects. |
| Consumer compatibility | Python API and CLI | Applicable: semantic contract checked; no supplied prior-version consumer evidence. ABI not applicable. |
| Numerical/data quality | visibility/coverage fractions | Applicable: missing-data denominator error; numerical conditioning not material for bounded count ratios. |
| Architecture/build | three Python files, stdlib tests | Applicable: no external dependencies; no packaging/build promise supplied. |
| Reliability/performance | lease expiry and takeover tests | Applicable reliability failure reproduced; performance budgets unknown, no unsupported performance verdict. |
| AI/evaluator validity | aggregates provider records only | Judge calibration/stochastic evaluator not applicable: no model or evaluator implemented. |
| CI/operations | workflow push/PR runs unittest | Configured only; observed local execution 3/3; CI execution and branch enforcement unavailable. |
