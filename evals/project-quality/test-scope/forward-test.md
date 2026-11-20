# Test scope reduction forward-test

Synthetic input: A/B hit identical branches, cost 1s each, and assert exit code
and full JSON respectively. C/D each build the same immutable fixture for 20s
and run a separate 1s historical-regression check. Nightly costs 100 CPU minutes;
PR costs 30 CPU minutes and 10 wall minutes. Proposed deletion: B/D; move remaining
checks nightly and claim 90% total compute savings.

One fresh-context agent read the revised skill and supplied recommendations.
Observed: retained distinct A/B assertions and both regression witnesses; proposed
fixture sharing; labeled 44s -> 24s as an additive estimate, not measurement;
rejected 90% and separated cadence, frequency, CPU and wall time. Requested replay,
cache invalidation/isolation checks and full-versus-reduced validation.

Author-reviewed qualitative pass on this synthetic case only. No baseline,
production run, measured savings, or general effectiveness claim.
