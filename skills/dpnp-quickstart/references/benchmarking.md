# Benchmarking dpnp

Benchmark evidence should include:

- NumPy version;
- dpnp version;
- dpctl/SYCL device;
- array shape and dtype;
- timing method;
- warm-up behavior;
- correctness comparison;
- conversion cost if host/device copies are part of the workflow.

Minimal timing pattern:

```python
import time
import numpy as onp
import dpnp as dnp
import numpy.testing as npt

size = 1_000_000
x_np = onp.arange(size, dtype=onp.float64)
x_dp = dnp.arange(size, dtype=dnp.float64)

# Warm-up
dnp.sum(x_dp)

t0 = time.perf_counter()
got = dnp.sum(x_dp)
t1 = time.perf_counter()

expected = onp.sum(x_np)
npt.assert_allclose(dnp.asnumpy(got), expected)
print({"dpnp_seconds": t1 - t0, "size": size})
```

Do not compare a cold `dpnp` first run against a warm NumPy run and call that a
steady-state result.
