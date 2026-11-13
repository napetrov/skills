# Change and migration assessment

Use for an existing system being refactored, rewritten, replatformed or migrated.
Reuse the discovery workflow and finding cards; do not require a rewrite or an
external service. This guide adds an assessment mode, not a shipped replay tool.

## Define the change contract

Record old/new revisions, supported consumers, build variants, intended change,
observables, preserved properties, intentional fixes, allowed differences and
unresolved requirements. Attach provenance and an owner role to each rule.
Observed legacy behavior is evidence, not automatically the desired specification.
Classify each disagreement as regression, intentional correction, allowed variation,
or unresolved. A green differential comparison cannot detect a shared defect.

For numerical software define justified absolute/relative tolerances, NaN/Inf,
shape and error semantics. For CLIs include exit status, machine-readable schema,
partial output and diagnostics. Normalize only contract-irrelevant differences;
test the normalizer itself with differences it must retain.

## Select evidence

| Surface | Investigation | Limit or control |
| --- | --- | --- |
| Characterization | Capture undocumented behavior and consumer expectations | Label known bugs; snapshots are not specifications |
| Differential | Run old/new on identical cases and compare defined observables | Add an independent property or oracle for shared bugs |
| Replay | Capture requests, dependency responses, clock, randomness and ordering | Pin versions; missing inputs make replay incomplete |
| Shadow | Compare representative workloads without serving new output | Isolate writes, queues, billing and external side effects |
| Consumer contracts | Exercise supported clients and bindings | Record consumer versions and untested consumers |
| Fault simulation | Control time, failures and event order | Save seed/trace; a simulator's fidelity is an assumption |
| Reconciliation | Compare migrated records, relationships and aggregates | Counts alone miss wrong values and duplicated identities |
| Test integrity | Compare assertions, skips, selections, fixtures and runners | Unchanged test count does not establish equivalent checks |
| Activation | Trace entry points to build actions, dependencies and release artifacts | New source may exist while old implementation still runs |
| Cutover | Define canary population, divergence budget and stop criteria | State/schema changes may need forward repair, not code rollback |

Sampled traffic needs a coverage receipt: sampled population, omitted rare paths,
error paths, configuration variants and privacy/redaction constraints. Do not
claim production representativeness from a convenient fixture corpus. Synthetic
users can exercise workflows but do not establish actual user behavior or demand.

## Verify the verifier

Freeze acceptance criteria before implementation. Where practical keep held-out
cases from the implementation agent, and use independently constructed properties.
Seed a plausible defect and confirm the checker rejects it. Include healthy cases
and intentional corrections that it must accept. Retain disagreement witnesses.
An adversarial agent's claim becomes evidence only after reproduction. Proofs of
a model need a tested implementation bridge; model equality is not deployment proof.

## Report and integrate

Append a compact change contract to relevant finding cards:

- Change and revisions; consumers and configurations.
- Preserved behavior, intentional corrections, allowed variation, unresolved rules.
- Comparator/oracle, provenance, execution evidence and negative controls.
- Activation evidence: default route, build actions, dependency graph, package contents.
- Cutover population, owner, stop conditions, data recovery and remaining uncertainty.

Retiring an implementation requires checking source, dependencies and release
artifacts against the agreed scope. Intentional fallback retention must be explicit,
owned and tested; its mere presence is not automatically an incomplete migration.
Choose at most three bounded pilots. Promote checks to CI only after their failure
and healthy controls work. Record commands and measured cost; mark unrun checks.

## Project applications (proposals, not completed audits)

- abicheck: compare extraction/verdicts across old/new backends; independently test
  known breakage properties, partial-analysis semantics and JSON contracts.
- oneDAL: compare numerical/error contracts; trace native build migration through
  actual actions and packaged artifacts, including retained compatibility paths.
- AIReady: replay provider responses and lease events locally; isolate shadow
  writes and billing; reconcile report completeness as well as displayed scores.
- Dokimi: check score denominators, unscored records, assertion integrity and
  whether the evaluated implementation is the one installed and invoked.

## Source and boundaries

Inspired by [Diffusion Brownfield resources](https://diffusion.io/brownfield),
read November 12, 2026. That index distinguishes characterization, differential
and replay techniques; generated inputs; testing the tests; specification/proof;
simulated users; migration/cutover. This guide's project mappings and change-card
format are our proposed integration, not claims made or validated by Diffusion.
Follow original primary references before adopting a particular tool. No linked
paper or tool is treated as evidence that this skill improves production outcomes.
