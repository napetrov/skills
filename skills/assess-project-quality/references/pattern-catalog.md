# Pattern families: discovery questions, not automatic smells

Every family uses the same pipeline and finding card. Select by product risk;
record not-applicable and unknown rather than scoring all projects identically.
Seeds below are search heuristics, not proof of a violation.

| ID / family | Seeds and model to recover | Check / healthy counterexample | Candidate durable check |
| --- | --- | --- | --- |
| P01 State/lifecycle | Enums, flags, null handles, status writes; state/transition table | Illegal combination or transition; caller-guarded state may be safe | Transition tests, stateful tests; TLA+ for consequential interleavings |
| P02 Call ordering | init/configure/start/finalize/close; preconditions and sequences | Use before init, repeated finalize; constructor can enforce order | API sequence/typestate tests, narrow static rule |
| P03 Resource ownership | alloc/free, maps, handles, buffers, RAII, locks; owner/borrow/lifetime graph | Leak, double release, async use after free; RAII cleanup may cover error paths | Sanitizers, fault-path tests, ownership analysis |
| P04 Atomicity/concurrency | check-then-act, leases/epochs, version counters; happens-before edges | Stale write or missing fence; atomic compare-and-write may already protect | Deterministic interleaving tests, race tools, protocol model |
| P05 Retry/idempotency | retries, message handlers, checkpoints; effect/commit/ack sequence | Duplicate effects or lost work; dedup must bind to full operation identity | Duplicate/restart tests, fault injection |
| P06 Decisions/configuration | dispatch, flags, if chains, tables; feasible decision space | Conflict, hole, shadowed branch; unsupported tuple may be intentional | Constrained generation, table checks, SMT |
| P07 Error/unknown handling | catch, fallback, sentinel, empty list; outcome algebra | Unknown becomes zero/success or partial becomes complete; explicit contract may permit best effort | Failure matrix, result-contract checks |
| P08 Data representations | casts, units, serialization, dtype/layout; conversion graph | Lost identity, precision, order or semantics; bounded loss may be accepted | Roundtrip, independent consumer/metamorphic checks |
| P09 Cache/derived state | keys, invalidation, duplicate aggregates; dependency graph | Key omits result-affecting input, stale values; immutable versioning may suffice | Perturb-one-input tests, invalidation/replay checks |
| P10 Boundaries/compatibility | API/ABI/CLI/schema versions; old/new consumer contract | Consumer breaks despite helper success; explicit version exclusion is not a defect | Real consumer, migration and contract tests |
| P11 Validation/oracles | generators, expected helpers, fixtures, skips; evidence dependency graph | Circular oracle, unsound reduction, insensitive fixture; shared setup alone is not circularity | Independent oracle, mutation, domain/selection receipts |
| P12 Architecture/build | imports, build actions, scripts, generated files; dependency/action graph | Hidden input, forbidden edge, host-dependent output; explicit tool/action declaration may be valid | Architecture rules, clean/cache rebuild comparison, build graph checks |

## Useful focused requests

- Find implicit state machines, including boolean combinations and resource handles.
- Find APIs whose correctness depends on undocumented call order.
- Trace ownership and cleanup across exceptions and asynchronous completion.
- Find operations whose retries can repeat external effects.
- Recover decision tables and identify feasible combinations without an outcome.
- Find error/unknown values that become a successful numeric result.
- Check whether cache keys include every result-affecting input.
- Find expected outputs derived from the implementation under test.
- Find build actions with undeclared inputs or dependencies.

Do not respond to these by listing matches alone. Require rule provenance,
consumer impact, refutation attempt and scoped evidence. A confirmed-safe pattern
or a documented design tradeoff is a useful outcome.
