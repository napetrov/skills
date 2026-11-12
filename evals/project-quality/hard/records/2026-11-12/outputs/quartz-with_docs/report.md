# Quartz 1.0 assessment

At clean revision `273751628643ff9e7ce067ac61c8fb778587582d`, I found **no current implementation defect in the documented support contract**. There is one demonstrated batch-order regression gap worth fixing. Assessment is read-only, local, dated 2026-11-12; target code was not changed.

## Evidence and consumer journeys

The inspected scope comprises `README.md`, `core.py`, all tests, the CI workflow and the archived review. Consumers call two synchronous Python functions; supported execution is Linux/Python 3.12, integer operands 0–31, saturation at 31, invalid operands rejected, and ordered batches of unrestricted count (`README.md:2–7`). Malformed row structures, arbitrary iterators, floating-point arithmetic and other runtime guarantees are outside the stated contract or unspecified.

* **Scalar correctness:** `saturated_add` validates exact integer type and bounds, then returns `min(a+b,31)` (`core.py:1–4`). The independent conditional oracle in `tests/test_core.py:5–10` exercises all 32×32 = 1,024 supported ordered operand pairs. The historical `(31,1) → 0` defect described in `docs/archive/v0.3-review.md:1–5` does not describe this revision: current code returns 31 and the exhaustive test covers it.
* **Invalid-input journey:** `tests/test_core.py:11–15` checks six invalid representatives in both operand positions: 12 rejection cases, including `True`. Bounds and exact-type checks explain the implementation's broader rejection behavior; these examples do not exhaust all invalid Python objects. Batch delegates to the same validator (`core.py:10`). Local probes confirmed `ValueError` for a boolean at indices 0, 63, 64 and 128 of 129-row batches. This propagation is not asserted by the committed tests.
* **Batch journey:** `core.py:6–11` traverses successive slices and appends each scalar result; empty input returns `[]`. Tests compare exact lists at lengths 0, 1, 63, 64, 65 and 129 (`tests/test_core.py:16–20`). However, their values repeat every 32 rows, making adjacent 64-row chunks indistinguishable. A temporary mutant swapping the first two output chunks passes all three existing tests. A 129-row fixture with 64 results of 1, 64 of 2 and a final 3 detects it. This is an observed weakness in the oracle's data, not evidence that current batching reorders results.

The nested loops do **not** imply quadratic cost: each input row is processed once, slices contain at most 64 rows, and output storage is linear for supported bounded integers. This is code-based complexity reasoning, not a timing measurement. No advertised latency budget requires a new benchmark.

## Validation status and limits

`PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests -v` passed 3/3 methods, zero failures/skips, in 0.006 seconds on Linux/Python 3.12.14. Counts above distinguish scalar cases, invalid examples and six batch lengths; no exhaustive batch denominator is claimed. Reproduction and original/mutant executions are in `probe.py` and `probe.log` beside this report; run `python probe.py` there. No randomness is used.

`.github/workflows/test.yml:1–11` configures this suite on push and pull requests with Python 3.12 and Ubuntu, without path filters or fail-open settings. Remote execution and branch enforcement are unknown, explicitly unavailable in `README.md:9–12`. Architecture/build inspection found a dependency-free module; compatibility evidence concerns these direct function calls only. Concurrency, resource leases, AI evaluation and floating-point numerical conditioning are inapplicable. No human usability study is supplied or needed to establish these narrow arithmetic assertions.

## One proposed integration change

**Owner: library maintainer, unassigned.** Extend `tests/test_core.py` with distinguishable chunk contents at lengths 128/129/193 and invalid operands before/at/after a chunk boundary. Use hand-constructed expected sequences, including reversed chunk values; assert `ValueError` without assuming unspecified partial-result behavior. Reuse the existing unittest command and workflow. Healthy implementation must pass; disposable chunk-swap and invalid-row-skipping mutants must fail. Empty selection or skipped cases cannot count as acceptance.

Estimated effort: half a day; CI budget: 5 seconds and 128 MiB, unmeasured. Start locally, collect advisory PR evidence, then request a required check only after stable runs and policy verification. Archive revision, interpreter, counts, durations and negative-control results; revisit fixtures when chunking/contracts change. Rollback removes blocking enforcement while retaining tests and evidence. Formal proof, mutation frameworks and performance tooling add little value here compared with this focused regression change.
