# dpnp Quickstart Skill Card

## Description

Guide agents through NumPy-to-dpnp migration, device checks, safe fallback
patterns, and performance-minded usage.

## Owner

Nikolay Petrov and contributors.

## License

Apache-2.0.

## Product

- Product: `dpnp`
- Product family: `data-parallel-python`
- Agents: Codex, Claude Code
- Maturity: experimental

## Use Cases

- Migrate NumPy hot paths to `dpnp`.
- Diagnose default SYCL device selection.
- Explain unsupported NumPy API fallback patterns.
- Benchmark `dpnp` responsibly against NumPy.

## Known Risks And Mitigations

- Risk: agent claims speedup without measurement.
  Mitigation: skill requires benchmark evidence and environment reporting.
- Risk: agent assumes GPU execution when runtime selected CPU.
  Mitigation: skill requires `dpctl`/array device checks.
- Risk: agent breaks production code through incomplete NumPy API coverage.
  Mitigation: skill recommends fallback and critical-path testing.

## References

- https://github.com/napetrov/agent-benchmark
- https://github.com/IntelPython/dpnp
- https://intelpython.github.io/dpnp/

## Evaluation Status

Full eval harness is intentionally out of scope for this repository version.
Current gate: smoke validation only.
