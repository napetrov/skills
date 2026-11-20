# Reduce CI configuration count

Treat test cases and execution configurations as separate dimensions. Optimize
(test group, configuration, cadence) assignments: not every group must run on
every configuration. Do not infer platform independence from equal past results.

1. Expand real workflows: reusable workflows, dynamic matrices, include/exclude,
   conditions, events, dependency jobs, shards and retry policies. Record actual
   runs as well as declared jobs. Distinguish an OS/compiler/runtime/backend factor
   from a shard or replicate; shards distribute work rather than cover a platform.
2. Define support obligations before reduction: promised OS/architecture/runtime
   versions, compiler/ABI, parser backend, packaging/install paths, dependencies,
   sanitizer/build modes and platform regressions. Tag each mandatory tuple and
   provenance. Oldest/newest versions alone need evidence; intermediate versions
   can have unique faults. A supported target must not disappear silently.
3. Encode valid combinations and explicit unsupported ones. Remove impossible
   combinations, not merely slow or failing ones. Separate one-factor guarantees
   from pair/triple interactions and mandatory end-to-end release configurations.
4. Build a constrained mixed-strength covering array or weighted set cover over
   candidate jobs. Pairwise is a starting hypothesis, not sufficient by default.
   Preserve mandatory tuples; increase strength for actual coupling such as
   OS x compiler x binary format or runtime x dependency x packaging. Each tuple
   must have a feasible full configuration witness. Validate coverage independently
   from the generator, with denominator and constraints recorded.
5. Assign test families to configurations from evidence: pure rules may have a
   primary environment plus runtime compatibility checks; native acquisition and
   packaging require their real supported boundaries. Keep actual cross-layer
   tests. Do not label tests portable without checking imports, native modules,
   filesystem/locale/encoding and subprocess assumptions.
6. Propose PR/nightly/release schedules, maximum delay to discovering a regression,
   and full-matrix shadow runs. Rotation covers a window, not a single revision;
   never report it as per-commit coverage. Workflow/toolchain/lockfile/shared-code
   changes and missing impact data trigger the full relevant fallback.
7. Compare actual run outcomes, fault replay, platform-specific witnesses and
   cost. Preserve required-check semantics with an aggregate that validates the
   expected nonempty job set and completion. Cancelled, skipped, continue-on-error
   and fail-fast omissions are not passes. Check branch protection compatibility.

Report baseline and proposed expanded jobs, valid/covered/missing mandatory tuples,
coverage strength per factor group, tests assigned to each job, runner-minute cost,
critical path, trigger frequency and detection delay. Include install/build/cache
costs and heterogeneous runner prices; increasing max-parallel changes latency,
not inherently total compute. Publish the factor model and chosen configurations
as reviewable artifacts, with regeneration and validation commands when implemented.

Example only: 3 OS x 4 runtimes x 2 modes gives 24 raw configurations before
constraints. Do not promise a reduced count until mandatory tuples and actual
factor domains are known. For abicheck inspect parser/compiler/binary-format and
CLI boundaries; for dokimi inspect runtime/provider-adapter/packaging boundaries,
separating deterministic framework CI from live stochastic evals.

Use the tool map in tool-references.md; record generator version, options, seed,
constraints and verifier output. No tool's generated matrix proves bug completeness.
