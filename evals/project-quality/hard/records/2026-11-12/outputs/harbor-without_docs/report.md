# Harbor compatibility assessment

The reported 100% pass rate does not establish the documented compatibility guarantee. The analyzer accepts layout changes that silently corrupt named values for an old consumer, and its generated expectations repeat its own answer.

## Scope and observed evidence

README.md specifies eight layouts: fields `a` and `b`, independently 4 or 8 bytes, in either declaration order, packed little-endian signed integers with values in the signed 32-bit range. The applicable consumer flow is `decode(old, encode(new, values)) == values`, not a same-layout round trip. Windows, native alignment, source ABI and floating point are excluded from this assessment.

Executed without modifying the target:

- `PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests -v`: two tests pass.
- `PYTHONDONTWRITEBYTECODE=1 python cli.py`: `{"generated": 9, "passed": 9, "pass_percent": 100.0}`.
- `PYTHONDONTWRITEBYTECODE=1 python /workspace/scratch/c0a9fdcf5a68/quality-hard/outputs/harbor-without_docs/probe.py`: exercises all 64 directed layout pairs against cross-products of `[-2147483648, -1, 0, 1, 7, 11, 2147483647]`, stopping at the first counterexample per pair. The rule accepts 24 pairs; only eight survive consumer checks; 16 accepted pairs have counterexamples.

## Important findings

**1. Equal total size is insufficient (observed correctness failure).** `rules.py:compatible` compares only total byte counts. With values `{'a': 7, 'b': 11}`:

| Old consumer layout | New writer layout | Actual old-consumer result |
|---|---|---|
| `a4,b4` | `b4,a4` | `{'a': 11, 'b': 7}` |
| `a4,b8` | `a8,b4` | `{'a': 7, 'b': 47244640256}` |

Both pairs return `compatible=True`. The second result even exceeds the permitted input range. These are concrete supported-format failures, not hypothetical platform concerns. A consumer trusting the verdict can read incorrect field values without an exception.

**2. Generation suppresses precisely the distinctions that matter (observed validation failure).** `generate.py:corpus` groups the 64 pairs by `(size(old), size(new))`, yielding nine cases. Representatives use `ab` order only; its three positive cases are identical-layout pairs. It removes equal-size changes in offsets, widths and names that expose the bug. Further, every `expected` value comes from `compatible` itself. Both `test_generated` and `cli.py:dashboard` compare that answer with another call to the same deterministic function, so a consistently wrong implementation still passes. `test_consumer` covers only `a4,b4` reading its own output with two positive values; it never crosses layouts.

## Two changes worth integrating

1. **Implement the actual supported-layout compatibility criterion.** Compare the ordered `(name, width)` sequence (normalizing sequence representation if necessary), rather than total size. For this fixed eight-layout universe and the provided exact-length decoder, only identical layouts preserve every named signed-32-bit value: unequal sizes fail unpacking, while every nonidentical equal-size pair has a demonstrated value mismatch. This conclusion is confined to the stated format and codec; it is not a general ABI rule.

2. **Replace the circular, size-deduplicated suite with a complete independent consumer matrix, and use it for the dashboard/release check.** Enumerate all 64 directed pairs. Establish expected compatibility from explicit field offsets/widths or an independently reviewed eight-by-eight table, never from `compatible`. Check the verdict and exercise new-writer/old-reader decoding with distinct values, zero, negatives and signed-32-bit limits. Require accepted pairs to preserve names and values; retain counterexamples for rejected same-size pairs and expected unpack failures for size changes. Report matrix coverage and failures alongside pass percentage, and make failures fail the local command and CI job. This small finite contract needs no additional test framework.

The probe’s finite values provide counterexamples and regression evidence, not an exhaustive proof over all integers; structural reasoning supports the identical-layout criterion. No live CI logs or protection-rule export are supplied, so actual CI execution, required checks and merge enforcement remain unverified.
