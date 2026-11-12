# Recover implicit state machines

Use for explicit "find implicit state machines" requests and lifecycle candidates.
Do not require a literal `state` field: booleans, object presence, counters,
resource ownership, queue membership and persisted rows can jointly encode state.

## Reconstruction

1. Identify entity and lifetime boundary: job, connection, allocation, model,
   stream, build artifact. Locate creation, restoration, disposal and consumers.
2. Inventory state-bearing fields and reachable writes, including serializers,
   callbacks, exception handlers, retries, SQL updates and generated adapters.
   Enumerate combinations symbolically where necessary; 2^N flags is a syntactic
   upper bound, not a count of reachable states.
3. Extract transitions: event/caller → guard → atomic mutation → side effect.
   Read relevant callers before concluding a guard is missing. Record operations
   that span transactions, processes or asynchronous waits.
4. Recover invariants from contract and implementation; distinguish inference.
   Include terminal-state semantics, ownership/fencing, exactly/at-most-once
   effects, cleanup and progress requirements. Cancellation may be best-effort;
   do not assume it forbids completion without contract evidence.
5. Test candidate traces and healthy alternatives. Separate safety (bad state is
   unreachable) from progress (eventually completes), which needs environmental
   assumptions such as scheduling, time and provider responses.

## Model output

| Entity/fields | From state | Event / source | Guard / source | Writes / effects / source | To state | Atomicity / unknowns |
| --- | --- | --- | --- | --- | --- | --- |

Use concise named states; attach field predicates defining them. Unknown states
or inferred edges stay labeled, not silently filled in. A Mermaid state diagram
is optional when it clarifies branching; the cited transition table remains the
reviewable evidence. Include build variant and external dependencies in scope.

## Questions worth testing

- Can flags encode finished AND cancelled, and does that actually violate policy?
- Can an operation run before initialization or after cleanup through any caller?
- Can an older attempt overwrite a newer one, including reuse of the same worker ID?
- Does an exception leave a lock, buffer or persisted state inconsistent?
- Do timeout/retry/cancel events have intentional destinations and observable outcomes?
- Can a terminal state be re-entered or reopened, and is that allowed?
- Does a callback outlive the resource it uses? What establishes completion?

## Worked example: lease fencing

A store increments `epoch` on claim but checks only `worker` on complete. Contract:
only the latest acquisition may publish. Candidate trace: worker w claims epoch1;
lease expires; w claims epoch2; epoch2 publishes fresh; epoch1 publishes stale.
Confirm whether the actual write checks epoch atomically and whether a caller
adds equivalent protection. If absent and reachable, a reproducer can establish
stale overwrite. A different-worker test does not cover same-name reacquisition.

Minimal change may be a conditional write on worker AND epoch, plus tests for
old completion before/after new completion. No framework rewrite is implied.
A TLA+ model can explore wider interleavings, but its transitions must correspond
to real atomic operations and the regression must exercise implementation.

## Healthy lookalike

A helper contains no local guard, but every reachable caller holds an ownership
capability and performs a versioned atomic update. Report the reconstructed rule
and evidence of protection; do not report a bug based on the helper alone. If
call graph completeness is unknown, state that limit rather than claiming safety
for uninspected callbacks/plugins.
