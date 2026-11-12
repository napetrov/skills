# Job lifecycle assessment

One supported API sequence violates the documented acquisition fence: after the same worker reclaims an expired lease, its old token can publish first and prevent the current acquisition from publishing. The service correctly protects terminal state and serializes its supported operations; the internal save helper's missing guards are not a separate defect.

## Scope and evidence

Focused lifecycle/ownership assessment of `b/README.md`, `b/TASK.md`, `b/service.py` and `b/store.py`, the four files returned by file inventory, on 2026-11-12. Sources below are relative to `b/`. Read both Python files completely and searched `claim|publish|_save|epoch|state|Lock` to check writers and callers. The only inspected `_save` caller is `JobService.publish`; both public methods own the same instance lock. This is a small in-memory service profile, with persisted restart behavior explicitly excluded ([README.md:2–7](../../../fixtures/b/README.md)).

Tools: local `rg`, `ls -la`, numbered source reads and Python 3.12.14. Ran `python -B /workspace/scratch/c0a9fdcf5a68/discovery-check/outputs/b/probe.py`; [probe.py](probe.py) and [probe.log](probe-output.txt) preserve execution evidence. Imports were inspected first; bytecode writes were disabled, and probes used only supported API calls. No target edits, external access, other experiments or oracle access. No `.git`, test, build or CI configuration was present in the inspected directory; revision/dirty state, upstream callers, CI history and required-check enforcement remain unknown. No parser-backed call graph or threaded stress test was run; discovery is scoped, not exhaustive.

## Recovered model

One service-owned job row encodes lifecycle through `state`, `worker`, `epoch`, `deadline`, `value` ([store.py:1–5](../../../fixtures/b/store.py)); a per-service lock supplies the ownership/atomicity boundary ([service.py:5–7](../../../fixtures/b/service.py)).

| Transition | Fields, guards and effects | Provenance |
| --- | --- | --- |
| Create → queued | `state=queued`, worker/value absent, epoch/deadline zero | Implemented initialization, store.py:3 |
| queued → running | Claim records worker, increments epoch, sets deadline to `now+ttl`, returns `(worker, epoch)` | service.py:8–14; acquisition meaning documented README.md:4–5 |
| running → running | Claim rejected while `now < deadline`; at/after deadline replaces acquisition and increments epoch | service.py:11–14; reclaim documented, exact equality boundary inferred from code |
| running → done | Publish checks running and matching worker, then writes value and done | service.py:15–21; store.py:4–5; intended worker **and epoch** rule documented README.md:5 |
| done → done | Publish returns false; claim raises `ValueError`; no mutation | service.py:11–12,18–19; terminality documented README.md:6 |

Every supported decision and write is inside the same lock. This statically supports the concurrent atomicity contract within one service instance. Claim failure leaves the prior acquisition unchanged; rejected publication leaves state unchanged. No retry/cancellation API was found. Expiration enables reclaim; the documentation does not expressly require expiration alone to invalidate publication, so absence of a clock check in publish is not classified as a defect. Malformed-token and clock/TTL validation contracts are unresolved, outside the demonstrated valid-token case.

## Findings

**B-01 — Confirmed defect, acquisition fencing; high priority.** The current-acquisition rule is documented, not inferred (README.md:4–5). `claim('w',0)` returns epoch 1; `claim('w',10)` returns epoch 2. Publishing epoch 1 then returns `True` (expected `False`); publishing epoch 2 returns `False` (expected `True`). Executed trace is in probe.log. Publish's caller-level lock prevents interleaving but does not compare `token[1]` (service.py:18–20). The supported service entry itself therefore admits stale publication; direct Store access is unnecessary. Impact: stale results become terminal and legitimate current work is lost. Refutation controls passed: a different worker's stale token is rejected, an unexpired lease cannot be reclaimed, and current-first publication blocks later stale publication. Thus this is stale-first acceptance, not overwrite after completion.

**B-02 — Validation gap in inspected scope.** No maintained tests or CI were found here. Terminal guards and caller-owned synchronization are healthy static patterns, with sequential controls executed; concurrency scheduling remains untested. Implemented behavior and local execution are established, configured/enforced CI is not.

## Proportionate integration

One proposed pilot: add the epoch comparison under the existing lock in `service.py`, plus `tests/test_service.py` using standard-library unittest; proposed command `python -m unittest discover -s tests -v`. Assert stale-first rejection followed by current success, including same-worker reacquisition; retain different-worker, current-first, active-lease and terminal controls. A disposable negative control removing only the epoch comparison must fail the regression. Add a bounded simultaneous-publication case asserting exactly one success to preserve the documented atomicity rule.

Owner: service maintainer, unassigned. Estimated half-day implementation, under 5 seconds runtime and 128 MB; measure before gating. Initially run on pull requests changing service/store/tests in the existing CI system once identified, saving test counts/logs; zero selection, skips or timeout are not acceptance. Promote after stable runs and explicit required-check configuration. Review tests when guards, token format or ownership change; rollback a noisy gate to advisory while retaining regressions and evidence. No state framework, generic static detector or formal-tool pilot is warranted by this bounded finding. Changes and CI integration remain proposed, not implemented.
