# Focused lifecycle assessment

**Outcome:** No reachable contract violation was found in the inspected supported API. The unguarded internal `Store._save` is protected by its actual caller; it is not a defect under the explicit ownership boundary. Missing maintained test/CI evidence is a validation gap, not evidence of incorrect behavior.

## Scope receipt

Inspected only `a/TASK.md`, `a/README.md`, `a/store.py`, and `a/service.py`, plus the supplied assessment skill and relevant references. Profile: in-memory worker/service; focus: state/lifecycle and locking dependencies. Sources below are relative to `a/`. Tools: file inventory (`rg --files`, `ls -la`), numbered source reads, Python 3.12.14 AST parsing and inspected local API probes using `python -B` (no bytecode writes). No target files changed, dependencies installed, external access, or other experiments inspected. No repository metadata exists inside the assigned directory; revision and dirty status remain unknown rather than inspecting its parent. No test/build/CI files were found in this inspected directory. External consumers, CI history, merge rules, alternative Python runtimes and persistence were not assessed. This is bounded discovery, not an exhaustive project-wide claim.

## Recovered model

One job per service is represented by `state`, `worker`, `epoch`, `deadline`, and `value` (`store.py:3`). The service owns that store and one lock (`service.py:5–7`).

| Transition | Guard | Mutation/effect | Provenance |
| --- | --- | --- | --- |
| Construct → queued | Constructor | worker=None, epoch=0, deadline=0, value=None | Implemented initialization, `store.py:2–3` |
| queued → running | Claim accepted | worker assigned, epoch incremented, deadline=now+ttl; returns worker/epoch token | `service.py:8–14` |
| running → running (new acquisition) | now >= deadline | Same claim mutation; same worker name permitted | Documented `README.md:4–5`; implementation `service.py:11–14` |
| running → done | Token matches worker **and** epoch | Store saves value and marks done under service lock | Documented `README.md:5–7`; `service.py:15–21`, `store.py:4–5` |
| Rejected operation → unchanged | Done/unexpired claim raises ValueError; nonrunning/wrong-token publish returns False | No writes before rejection | `service.py:11–12,18–19` |

`done` is terminal for the supported API (documented, `README.md:6`). Decision and write share the lock (`service.py:9–14,16–20`), meeting the documented concurrent-call requirement. Expiry permits reclaim; publication has no clock argument. Inferring that expiry alone revokes publication would add an undocumented requirement: the documented rule identifies the current acquisition by worker/epoch. Restart persistence is explicitly excluded (`README.md:7`). Input types, hostile custom Python objects and clock validity are unspecified; ordinary worker names, integer times and tuple tokens were assessed.

## Findings and execution

**L01 — confirmed safe in scope: guarded internal publication.** AST call inspection finds `_save` called at `service.py:20`, inside the lock after the running-state and full-token check. Direct store access is unsupported (`README.md:2–3`). The competing hypothesis—worker-name reuse lets an old acquisition overwrite fresh output—was falsified for the tested path: claim w at 0 → reclaim w at 10 → old token rejected → new token accepted → both old and duplicate new publications rejected. Terminal claim also raises. Current-owner publication is the healthy control; wrong-worker and queued publications fail. Thus no helper-local guard or state-machine framework is warranted.

**L02 — validation gap: no maintained regression/CI evidence in scope.** Local probes passed the above sequence, early-reclaim rejection, wrong-worker/current-worker controls, and 100 two-thread duplicate-publication trials (exactly one success each). See `probe-results.txt`; Python 3.12.14, 0.0204 seconds, deterministic inputs/no seed. This is executed evidence for selected cases, not systematic scheduling coverage. Configured or enforced CI is unknown. Exception/cancellation recovery beyond rejection paths and unusual input operations was not tested.

## Proportionate integration proposal

One pilot, owned by the service maintainer (unassigned): add `tests/test_job_lifecycle.py` using standard-library unittest, with a proposed `python -B -m unittest discover -s tests -v` command. Preserve the traces above, verify final saved value in a white-box assertion, and test both orderings of reclaim versus publish. The oracle comes from `README.md:4–7`, independently of implementation predicates. Acceptance: current token succeeds, stale/duplicate tokens fail, done cannot reopen, and competing publications produce one success. In a disposable copy, a worker-only token-check mutant must fail the same-name regression; this negative-control experiment is proposed, not executed.

Estimate: half a day implementation; under one second for this small suite before CI overhead, to be measured. Add an advisory PR job in the project's actual CI configuration once located; require nonzero test count, no skips, a 30-second timeout that fails, and retained test logs. Gate after stable results and review of the negative control; enforcement requires separate configuration verification. Revisit on changes to guards, writers or ownership. Roll back a problematic gate to advisory while retaining tests and failure evidence. Formal tools and generic pattern detectors are disproportionate here.
