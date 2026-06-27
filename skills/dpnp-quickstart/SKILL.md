---
name: dpnp-quickstart
description: Guide NumPy-to-dpnp migration, device checks, safe fallback patterns, and performance-minded usage.
version: 0.1.0
license: Apache-2.0
product: dpnp
product_family: data-parallel-python
tags: [dpnp, numpy, sycl, xpu, performance, porting]
problems: [migrate-numpy-to-xpu, diagnose-device-selection, benchmark-python-kernels]
agents: [codex, claude-code]
maturity: experimental
data_classification: public
source_url: https://github.com/napetrov/skills
implementation_url: https://github.com/napetrov/skills/tree/main/skills/dpnp-quickstart
---

# dpnp Quickstart

Use this skill when working with Intel-optimized Python array operations or
migrating NumPy code to `dpnp` for Intel CPU/GPU execution.

## When To Use

- The user asks whether NumPy code can use `dpnp`.
- The user is migrating array-heavy code to Intel XPU/SYCL devices.
- The user needs to check `dpnp` install, device selection, or fallback behavior.
- The user wants to benchmark a NumPy hot path against `dpnp`.

## When Not To Use

- The task is generic Python with no array or performance angle.
- The workload is dominated by I/O, pandas, strings, or small scalar loops.
- The user needs a guaranteed speedup without benchmark evidence.
- The environment cannot install or import `dpnp` and the user only wants pure NumPy.

## Installation

Prefer an isolated environment. Conda is usually the safest first suggestion:

```bash
conda install -c intel dpnp
```

Pip may work, but native dependencies can be more fragile:

```bash
python -m pip install dpnp
```

Verify the import:

```bash
python -c "import dpnp; print(dpnp.__version__)"
```

## Device Check

Use `dpctl` to inspect the default SYCL device before assuming GPU execution:

```python
import dpctl
import dpnp as np

print(dpctl.select_default_device())
x = np.arange(1024)
print(x.sycl_device)
```

If this skill's helper scripts are available, run:

```bash
python scripts/collect_env.py
```

Report exactly what the environment returns. Do not claim XPU/GPU execution if
the output shows CPU fallback or no SYCL device.

## Basic Usage

```python
import dpnp as np

x = np.arange(1_000_000, dtype=np.float64)
total = np.sum(x)
```

`dpnp` follows many NumPy idioms, but it is not complete NumPy API parity. Check
critical functions and parameters before production migration.

## Compatibility And Fallback

Use explicit fallback for unsupported functions or parameters:

```python
import dpnp
import numpy as np

def safe_unique(x):
    try:
        return dpnp.unique(x)
    except (NotImplementedError, TypeError):
        host_x = dpnp.asnumpy(x) if isinstance(x, dpnp.ndarray) else x
        return np.unique(host_x)
```

Keep conversions at API boundaries. Repeated `dpnp.asnumpy()` calls inside tight
loops can erase any acceleration.

## Benchmark Guidance

- Warm up once before timing.
- Compare against NumPy with the same inputs and dtype.
- Use `numpy.testing.assert_allclose()` or exact checks before timing claims.
- Report array size, dtype, device, first-run/warm-run distinction, and timing method.
- Prefer end-to-end measurements when conversions are part of the real workload.

Never say `dpnp` is faster unless measured output supports it in this
environment.

## References

- `references/dpnp-migration.md`
- `references/benchmarking.md`

## Safety And Limits

- Do not modify the user's global Python environment by default.
- Do not remove lockfiles or rewrite dependency constraints unless asked.
- Do not upload benchmark data.
- Do not fabricate device, compatibility, or performance results.
- Ask before making broad production migrations.
