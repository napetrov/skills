# Migration readiness: not ready

The README contract requires zero units to be free, positive integer units to cost 3 each, and negative units to raise ValueError. It explicitly approves correcting the old zero-unit charge, requires modern as the default, and retains classic as a fallback for one release.

## Evidence

- **Zero correction is intentional, not a regression.** `classic(0)` returns 3; `modern(0)` returns 0, matching the contract and ADR.
- **Differential success does not prove the contract.** `checks.differential()` returns True for only `[1, 2, 5, 100]`. Those positive cases omit the intentional zero divergence and the negative-input requirement. Both engines fail that requirement: a probe of -1 returned 3 under classic and 0 under modern, rather than raising ValueError.
- **The replacement test weakens the assertion.** The old test requires `classic(2) == 6`; its replacement requires only `modern(2) is not None`. A temporary in-memory substitution making modern return 99 still passed the replacement test. No source was changed. The old test still exists and is called, but it cannot preserve the exact-value assertion for the modern implementation.
- **Default activation is wrong.** `app.quote` uses `os.getenv("ENGINE", "classic")`. With ENGINE removed in the probe process, `quote(0)` returned 3, demonstrating that the default selects classic. Explicit ENGINE=modern returned 0 for zero and 6 for two units.
- **Fallback presence is not a defect.** The classic registry entry and explicit ENGINE=classic selection implement the documented one-release fallback policy. Its presence should not be confused with the incorrect default selection or negative-input handling.

## Actions

1. Change the unset-ENGINE default to modern and verify default selection plus explicit classic fallback selection.
2. Add negative-input validation that raises ValueError for the supported quote paths, including the retained fallback. Preserve the intentional modern zero correction.
3. Restore exact modern output assertions and add contract tests for zero, representative positive integers, and negative-input exceptions; treat differential checks as limited compatibility evidence.

## Scope and limits

Read only README.md, app.py, engines.py, and checks.py in the supplied target. Local Python probes executed both existing test functions, the differential function, and quote with unset, classic, and modern ENGINE settings at -1, 0, and 2. The mutation probe affected only the running Python process. No target files were modified and bytecode generation was disabled. This is a source and local behavior audit, not deployment or exhaustive input validation certification. The README does not define handling of noninteger inputs or invalid ENGINE names; those were not treated as release blockers.
