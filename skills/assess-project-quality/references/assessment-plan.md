# Plan and deepen a project assessment

## Planning pass

Read assessment.md and pattern-catalog.md. Inventory every assessment category
and pattern family for a broad plan, with applicability and evidence status; do
not force irrelevant methods onto a project. Include test redundancy, fixture
cost, configuration matrices, CI selection/enforcement, oracle strength,
compatibility, numerical correctness and evaluator validity where applicable.
Inspect representative entry points, tests and workflows to ground the plan.
Mark unexplored areas unknown, not healthy. Planning may use existing measurements;
label proposed experiments not-run. Avoid costly full runs unless needed and
within scope. Keep an executive summary with three priorities, but retain the
complete backlog rather than dropping lower-priority categories.

Use stable IDs and this row schema:
ID | category/model | question/contract | paths and revision | current evidence |
unknowns | risk/priority rationale | next investigation | candidate method/tool |
expected artifact | acceptance and negative control | cost/budget (estimated or
measured) | dependencies | status | next action.

Statuses: uninspected, scoped, investigating, confirmed defect, validation gap,
supported-in-scope, deferred, not applicable. Keep implementation/execution/
enforcement status separately. Do not invent effort precision or numeric risk
scores. Group duplicate underlying contracts; one finding can map to many tests.
Save the plan in the requested project location when authorized, and make it
resumable by ID. A plan request alone must not modify test policy or delete tests.

## Deep dive for any ID

1. Refresh revision and guidance. Identify changed evidence since planning.
2. Trace public entry -> implementation -> dependencies -> side effects -> oracle
   -> actual CI invocation. Inspect callers and transitive/shared fixtures; do not
   stop at matching filenames or an isolated function.
3. Recover assumptions and alternative interpretations. Enumerate boundaries,
   invalid/error/retry paths, relevant configurations and ownership/lifetimes.
4. Run the cheapest discriminating experiment with a healthy control and a
   counterexample/mutant where appropriate. Expand only when findings justify it;
   record failed hypotheses, unavailable tools, seeds and precise execution scope.
5. Classify findings using finding-card.md, then update the original row with
   evidence, proposed change, acceptance, cost, rollback and residual questions.
   Split newly discovered independent work into child IDs; retain links.
6. Stop at a supported answer within explicit scope, an agreed budget, or a concrete
   blocker. Report the reason and next discriminating step. A green test or no new
   findings is not proof of completeness. No endless whole-repository expansion.

Keep tooling proportional. Read tool-references.md to select an existing tool;
formal reasoning, mutation or solver work is optional and must answer a specific
question. Do not automatically launch one agent per backlog row.
