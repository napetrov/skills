# dpnp Migration Notes

`dpnp` is useful when NumPy-style array work can benefit from Intel CPU/GPU
execution through SYCL. Treat it as a performance tool, not a transparent
drop-in for every NumPy program.

Good candidates:

- large arrays;
- math-heavy operations;
- reductions, linear algebra, FFT-like work;
- hot paths where conversion overhead is small relative to compute.

Poor candidates:

- tiny arrays in tight Python loops;
- I/O-heavy code;
- code dominated by host-only libraries;
- APIs or parameters not implemented by `dpnp`.

Recommended migration pattern:

1. Identify a measured hot path.
2. Port a small slice to `dpnp`.
3. Add correctness checks against NumPy.
4. Check selected SYCL device.
5. Benchmark warm runs.
6. Keep fallback for unsupported APIs.
