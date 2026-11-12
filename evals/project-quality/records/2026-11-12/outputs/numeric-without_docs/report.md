# Assessment

The release block based on `normalize` being quadratic is unjustified. In `src/normalize.py`, `BUCKETS = 4`: each of n tokens performs exactly four bucket checks, so the loop takes Θ(n) time under ordinary constant-cost integer operations and Θ(n) output space. Nested syntax alone is not evidence of quadratic work. If bucket count were made an independent input B, this implementation would be Θ(nB); unusually large integers also change the cost of arithmetic. Neither qualification establishes quadratic scaling in token count for the code shown. No normalize test or benchmark is supplied, and this conclusion comes from source inspection, not measured normalize timing. A direct bucket append could reduce a constant factor, but is not required to resolve this release objection.

The matcher candidate-visit metric is linear: it increments once per old symbol, independently of new-list size. This does not establish linear total matcher runtime. Building a dictionary requires one insertion attempt per new symbol; each old symbol performs a dictionary lookup, and k matched pairs are merge-sorted. With ordinary hashing/comparison costs, expected total work is O(m + n + k log k), with linear auxiliary storage; pathological hash behavior and long keys/names are outside that simplified cost model. Candidate visits do not count dictionary collision work, index construction, or sorting.

# Observed evidence

Inspected the source, unit tests, benchmark, enabled contract, stored baseline, and example workflow before running local tests. No source changes or network access were made.

Commands executed from the numeric project:

- `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests/contracts`: both tests passed.
- `PYTHONDONTWRITEBYTECODE=1 python3 benchmarks/contracts/bench_symbol_match.py --output <output-directory>/observations.json`: exited successfully; five measured repetitions per size, after warm-up.

| Symbols per side | Oracle equality | Candidate visits | Sort comparisons | Median ms | Spread ms |
|---:|:---:|---:|---:|---:|---:|
| 250 | true | 250 | 815 | 0.219 | 0.055 |
| 500 | true | 500 | 1881 | 0.478 | 0.071 |
| 1000 | true | 1000 | 4323 | 1.054 | 0.325 |
| 2000 | true | 2000 | 9841 | 2.283 | 0.148 |

The deterministic counters exactly match `fixture-reference-v1`. Candidate visits double at each doubling of size. Sort comparisons grow approximately 2.3x, consistent with merge sort rather than quadratic growth. The observations satisfy the stated candidate limit of 12n and sorting limit of 3n log n under usual logarithm conventions. I ran the benchmark directly, not the external contract evaluator; this is not a claim that the full contract pipeline passed.

The oracle is independently constructed by the benchmark generator, a useful safeguard against testing the matcher against itself. However, equality uses length plus a set, so it does not validate the documented sorted-output order. Existing tests exercise only one simple mapping and one two-symbol counter case. The benchmark fixes seed 7, 80% matches, equal side sizes, and four modest sizes. It cannot prove universal performance or correctness. Timing is explicitly advisory, and this environment's measurements are not portable latency guarantees. No production workload or latency budget was provided.

The contract defines a real missing-pair regression control plus synthetic candidate and sorting counter inflation controls. The latter test whether gates reject inflated metrics, not whether instrumentation catches real slow implementations. None of these controls was executed here because source mutation was disallowed. The example CI workflow is explicitly inactive, contains action SHA placeholders, and references a runner absent from this project tree. Its existence is not evidence of enforced CI.

# Proportional integration plan

1. Resolve the normalize release objection with the fixed-bound analysis. Add small behavior tests for empty input, repeated/negative integers, bucket membership, preserved per-bucket order, and total output cardinality. If a performance contract is warranted by actual usage, count bucket checks and assert 4n across a few sizes. Avoid a noisy elapsed-time release gate or a rewrite solely because the source contains a nested loop.
2. Keep matcher correctness and deterministic work gates in the PR profile. Add assertions that returned pairs equal independently generated sorted expected pairs; cover empty sides, no/all matches, uneven side sizes, duplicate keys and first-new-match behavior, repeated old keys, and varied old-name order. Define permitted name/key types explicitly, including whether `None` names are supported, before codifying ambiguous cases.
3. Preserve separate metrics for candidate visits and sort comparisons. Add index insertion/lookup counts only if they protect a concrete risk; test multiple side-size ratios so equal sizes cannot obscure which dimension drives work. Retain a broad O(n log n) sorting envelope; document dimensions, logarithm definition, coefficient rationale, supported input assumptions, and counter semantics. The current 12n candidate allowance is generous relative to the exact n implementation and should be calibrated deliberately rather than silently treated as a proof of linear behavior at all sizes.
4. In disposable copies, validate each existing negative control and add at least one real nested candidate scan with truthful instrumentation. Require that the intended assertion fails while unrelated checks remain interpretable. Include an order-only regression to demonstrate that the strengthened correctness oracle catches it. Record control results; the present assessment supplies no evidence that those controls actually fail.
5. Integrate the reviewed contract runner into the target repository before activating the example workflow. Pin actions to actual reviewed commit SHAs, provide the runner's required Node/Python versions, use the correct PR merge base and explicit behavior when it is unavailable, and verify a clean run and intentional failures. Include contract/configuration and runner changes in triggering/revalidation rules. The scope pattern includes `src/**` while the matcher's contract path names only `src/matcher.py`; explicitly verify how a normalize-only change is handled rather than assuming matcher coverage applies to normalization. Upload failure observations and control diagnostics as artifacts, and require this job only after it has been demonstrated to run reliably.
6. Keep PR wall-clock results advisory. If production needs justify it, run a separate scheduled profile with larger inputs, several seeds, skew, variable key/name length, memory observations, and a stable machine/runtime. Compare repeated measurements with an explicitly reviewed baseline and a product-backed latency budget. Review baseline changes rather than automatically accepting regressions.

These steps provide inexpensive protection for the demonstrated behavior while keeping the claims limited to the inspected algorithm and measured workload.
