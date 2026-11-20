# Methods and primary tool references

Use existing project tools first. These are optional candidates, not bundled or
required dependencies. Verify installation/version/license and supported features
before commands; report unavailable tools without pretending they ran. Do not
install services or upload source as a consequence of merely selecting a method.

| Need | Tool / primary reference | Use and limitation |
| --- | --- | --- |
| Constrained t-way and mixed strength | [NIST ACTS](https://www.nist.gov/publications/acts-combinatorial-test-generation-tool), [tools](https://github.com/usnistgov/combinatorial-testing-tools) | Generate feasible interaction coverage; check distribution/access and advanced-feature availability. Independently verify tuples; no universal fault guarantee. |
| Exact small selection / scheduling | [OR-Tools CP-SAT](https://developers.google.com/optimization/cp/cp_solver) | Encode mandatory coverage and costs. Record status, objective, bound, gap limits and timeout; FEASIBLE is not proven optimal. Even OPTIMAL may reflect configured gap tolerance. |
| Constraint feasibility | [Z3](https://github.com/Z3Prover/z3) | Validate factor constraints or find missing cases. Unknown is inconclusive; constraint fidelity is separate from solver correctness. |
| Per-test executed-code mapping | [coverage.py contexts](https://coverage.readthedocs.io/en/latest/contexts.html), [pytest-cov contexts](https://pytest-cov.readthedocs.io/en/latest/contexts.html) | Attribute execution to tests; does not capture assertion strength or all runtime dependencies. |
| Runtime profiling | [pytest durations](https://docs.pytest.org/en/stable/how-to/usage.html#profiling-test-execution-duration) | Locate expensive tests; separately account for collection, builds and shared setup. |
| Mutation strength | [mutmut](https://mutmut.readthedocs.io/en/latest/), [Stryker](https://stryker-mutator.io/docs/) | Replay targeted code mutations; exclude invalid/equivalent mutants transparently and retain holdout faults. Check platform support (current mutmut requires fork, Windows via WSL). |
| Properties / stateful generation | [Hypothesis](https://hypothesis.readthedocs.io/en/latest/), [fast-check](https://fast-check.dev/docs/introduction/) | Generate and shrink counterexamples under explicit strategies; model and implementation may share omissions. |
| Matrix execution | [GitHub Actions matrix](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations) | Emit selected include rows; verify include/exclude semantics, cancellation, required checks and dynamic selection. This is execution, not optimization. |
| State/protocol exploration | [TLA+ tools](https://github.com/tlaplus/tlaplus), [Alloy](https://alloytools.org/documentation.html) | Explore declared models/bounds; keep implementation correspondence separate. |
| Bounded C/C++ checks | [CBMC](https://www.cprover.org/cbmc/) | State loop/environment bounds and unwinding obligations; not a replacement for supported-platform execution. |

For mathematical scope and limitations, use [NIST SP 800-142](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-142.pdf),
[weighted greedy set cover](https://doi.org/10.1287/moor.4.3.233), and
[regression test selection research](https://digitalcommons.unl.edu/csearticles/11/).
Greedy approximates suite cost over the specified obligations, not bug coverage.
Constraint counting estimates space size, not the necessary number of tests.
