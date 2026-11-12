# Choose by the question, not the tool

These are candidate methods, not required dependencies. Verify current primary
documentation and target-language support before proposing exact installation or
version-sensitive commands. First improve an existing assertion if that solves
the risk more cheaply.

| Question | Candidate method/tool | What evidence it adds / limit |
| --- | --- | --- |
| Does this example work? | Unit, integration, consumer E2E; pytest, Playwright | Executed examples; UI success still needs output assertions. |
| Does a general rule survive many inputs? | Property-based: Hypothesis, fast-check | Generated and minimized counterexamples; not universal proof. |
| Do action sequences preserve rules? | Stateful/model-based tests | Runs real code against a simpler state model; shared model bugs remain possible. |
| Did we cover interactions? | Constrained pairwise/t-wise generation | Feasible interactions at a stated strength; higher-order bugs can remain. |
| Can the program survive hostile input? | Fuzzing: libFuzzer, Atheris; sanitizers | Crash/UB discovery and reproducible inputs; no-crash is not semantic correctness. |
| Would tests notice a bug? | Mutation: Stryker, mutmut, language-specific tools | Deliberate changes should fail; triage equivalent and irrelevant mutants. |
| Is this output right? | Differential/reference testing | Compare independent implementations; disagreement requires adjudication. |
| No exact answer is available? | Metamorphic testing | Check relations: reorder independent inputs, duplicate samples, scale units; justify each relation mathematically. |
| Are consumers protected? | Contract/schema/API/ABI tests; Pact, Schemathesis | Boundary expectations; schemas alone miss semantic or ABI compatibility. |
| Are structural constraints obeyed? | Types, static analysis, dependency rules | Earlier detection; dynamic behavior and external assumptions remain. |
| Can failures corrupt the workflow? | Fault injection, replay, scheduler exploration; Jepsen where appropriate | Selected failures/histories; realistic fault model required. |
| Do rules conflict or omit a case? | SMT: Z3 | Ask for an input satisfying a violation formula; sat gives a witness, unsat is scoped to encoding, unknown is inconclusive. |
| Can a relationship structure violate a rule? | Alloy | Counterexample object/relationship models within declared scope; not all sizes. |
| Can ordering/retries break a protocol? | TLA+ with TLC | Explore reachable modeled states; finite configuration and fairness assumptions must be stated. TLA+ also supports proof workflows. |
| Does bounded code execution violate a contract? | CBMC | Checks encoded C/C++ behavior under explicit loop/bound and environment assumptions; inspect unwinding obligations. |
| Can code contracts be proved? | Dafny | Verification conditions for specified code/contracts; trust boundary includes external code and compilation. |
| Is a precisely stated theorem true? | Lean | Kernel-checked proof under explicit axioms; requires a bridge to implementation and a faithful statement. |
| Is performance/recovery acceptable? | Benchmarks, load tests, observability | Environment-specific budgets and production signals; distinguish noise from regression. |
| Does an LLM evaluator measure what matters? | Human-labeled holdout, calibration, repeated trials, adversarial cases | Agreement, uncertainty and bias evidence; mocked judge tests prove only harness behavior. |

## One simple example across methods

Promise: a vending machine with one can never sells two cans.

- Example test: buy once; stock becomes zero; the second purchase fails.
- Property test: generate stocks and purchases; stock never becomes negative.
- Stateful test: mix purchase, cancel and refill on the real implementation.
- TLA+: model two buyers both reading stock=1 before either reserves it. A
  counterexample trace can expose two successful purchases. Fix the model, then
  test the corresponding interleaving in code.
- Z3: encode purchase eligibility rules and ask for a state assigned both
  `allow` and `deny`, or neither. Include the valid-input constraints.
- Alloy: model orders, cans and reservations; ask whether two active orders can
  own the same can in a small scope.
- Lean: prove that the specified atomic reservation function preserves nonnegative
  stock. This does not prove the real database operation is atomic.
- Mutation: remove the stock check; the tests should now fail.

## Application examples (proposals, not repository audit results)

| Product family | Useful first hypothesis | Possible deeper pilot |
| --- | --- | --- |
| Numerical library such as oneDAL | Independent reference and justified metamorphic relations across data shapes/backends | Prove a reduction or arithmetic helper; numerical error and backend agreement remain separate obligations. |
| Compatibility analyzer such as abicheck | Generated edits plus independently built old-consumer/new-library experiments | Z3 for decision-table gaps; Lean for a precise classifier/reduction lemma, with compiler/layout assumptions explicit. |
| Agent evaluator such as Dokimi | Trace intent to executed assertions; mutate evaluator/harness decisions | Judge calibration on held-out human labels; formalize aggregation rules only where ambiguity merits it. |
| SaaS such as AIReady | End-to-end scan/report outcomes, role isolation, retry/cancel tests | TLA+ for worker leases/retries; decision-table checks for partial provider results. |

Reuse existing outcome/performance contract skills when the selected intervention
is a traceable consumer outcome or a measured performance budget.
