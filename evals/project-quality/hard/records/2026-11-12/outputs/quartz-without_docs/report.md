# Quartz 1.0 assessment

No release-blocking defect was found within the stated support contract. The implementation and existing validation are well aligned with finite integer saturation and ordered batches. Historical defects should not be attributed to this release.

## Observations and evidence

- `core.py:saturated_add` requires exact Python `int` types, rejects values outside `[0,31]` with `ValueError`, and returns `min(a + b, 31)`. This excludes booleans as required. `(31,1)` returns `31`, not the wrapping result described in the explicitly superseded 0.3 review.
- `tests/test_core.py:test_domain` checks all 1,024 ordered pairs in the supported scalar domain, using a conditional expected-value expression. `test_invalid` checks six invalid values in both operand positions, including a boolean and out-of-range integers. This is exhaustive for valid scalar inputs, not for invalid objects or batches.
- `batch` processes contiguous slices in ascending order and appends every pair's scalar result. Existing tests cover empty input and lengths `1,63,64,65,129`, including chunk boundaries and multiple chunks. No 64-element input cap is imposed.
- The nested loops do not imply quadratic work: for ordinary lists or tuples, the inner iterations total exactly the input length; each slice copies at most 64 elements. Runtime is linear in the number of pairs, with linear returned storage and bounded slice storage. This is a source-based complexity inference, not a measured performance guarantee.
- `.github/workflows` contains a push/pull-request workflow on Ubuntu with Python 3.12 and the documented unittest command. Workflow configuration is present; successful hosted execution and required merge checks are not evidenced.

## Local validation

On Linux/Python 3.12.14, the following completed successfully (three tests):

```sh
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests -v
```

An additional read-only probe checked all scalar pairs together as a 1,024-item batch and invalid operands on either side of chunk boundaries:

```python
from core import saturated_add, batch
rows = [(a, b) for a in range(32) for b in range(32)]
assert batch(rows) == [min(a+b, 31) for a, b in rows]
assert saturated_add(31, 1) == 31
for index in [0, 63, 64, 65, 128]:
    rows = [(0, 0)] * 129
    rows[index] = (True, 0)
    try:
        batch(rows)
    except ValueError:
        continue
    raise AssertionError(index)
```

Both checks passed. No target files were changed.

## One proportionate improvement

Add a small batch-invalid-input regression test, placing an invalid operand at indices 63 and 64 of a longer batch and asserting `ValueError`. Existing scalar rejection tests and boundary tests independently pass, but do not lock down rejection through the public batch entry. The probe above demonstrates current correct behavior; promoting this check would guard against future batching changes silently dropping invalid rows or bypassing scalar validation. This is a modest coverage improvement, not a fix for an observed failure.

No additional tooling, timing assertions, or cross-platform matrix is justified by this support contract. Generator input and malformed pair structures are not explicitly promised; lack of those tests is not evidence of a supported-flow defect. Remote CI execution and merge protection remain unverified, so this review establishes local correctness evidence rather than enforced delivery gates.
