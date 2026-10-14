# Python performance fixture

Target-shaped project used by the performance-contracts acceptance tests.

- `src/matcher.py` is the reference implementation under contract.
- `benchmarks/contracts/bench_symbol_match.py` emits observations; its expected pairs come from the generator.
- `.petrov/contracts/` holds the enabled contract `PERF-MATCH-001` and the command configuration.
- `tests/contracts/` holds unit tests run with `python3 -m unittest discover -s tests/contracts`.

The fixture is never installed into a user project. Deliberate violations are applied
to disposable copies by `tests/contracts.test.js`.
