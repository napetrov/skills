# Cedar 1.4 quality assessment

Two documented consumer promises fail despite the existing suite passing: a restarted worker can overwrite newer results, and partial provider failures produce misleading visibility and coverage.

## Scope and evidence

Assessed clean revision `2368f4759e88ae8d01bc4b71cc2954c1a61f8152` on 2026-11-12. Inspected all supplied source, README, tests and workflow; no network or target changes. Consumers are local service-model callers and CLI users. Runtime was Python 3.12.14.

Executed `PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests -v`: selected/executed/passed 3, failed/skipped 0, exit 0, unittest-reported duration 0.000s. `python cli.py` exited 0 with `{"visibility": 0.5, "coverage": 1.0}`. These are current local observations, not CI evidence. `.github/workflows/test.yml:2-8` configures the suite for push/PR; execution history and enforcement are unavailable, consistent with README:12. No coverage percentage is warranted.

## Findings and traced promises

**R1 — stale result overwrites fresh result (high impact).** README:3-5 explicitly allows reused worker names and identifies acquisitions by epoch, including protection after newer completion. `Store.claim` increments epochs (`store.py:12-16`), but `Store.complete` checks only worker identity (`store.py:18-22`). Reproduction: `old=s.claim('w',0); new=s.claim('w',11); s.complete(new,'fresh'); s.complete(old,'stale')`. Both completions return `True`; stored result becomes `stale`. This is an observed contract violation, without requiring real concurrency. `tests/test_service.py:10-14` asserts the correct outcome only for different worker names, masking the restart path. Active-lease rejection at time 9 and takeover at exact expiry 10 worked in a local probe.

**R2 — unknown answers count against visibility and inflate coverage (high impact).** README:7-10 defines mentions/successful answers and successful/scheduled providers. `report.py:4-5` instead divides mentions by all records and hardcodes coverage to 1.0. The public CLI's one successful mention plus one timeout (`cli.py:5-8`) should yield visibility 1.0 and coverage 0.5; actual output is 0.5 and 1.0. An all-timeout record produces 0.0/1.0, falsely suggesting observed absence and full coverage. The empty input returns None/0; using None for zero successful answers is a consistent proposed policy, but that precise representation needs documenting. `test_all_answered` covers only the case where both denominators coincide.

The accompanying `probe.py` reproduces both failures. From the target root run `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH="$PWD" python ../outputs/cedar-with_docs/probe.py` (observational output, not a passing regression test).

## Two implementation work items

1. **Fence completions by acquisition.** Extend `tests/test_service.py` with same-name and different-name takeover sequences, stale completion before/after fresh completion, active-lease rejection and exact-expiry takeover. Update `store.py` to validate epoch as well as worker, preserving fresh results on rejection. Oracle: independently specified acquisition identity from README; bounded two-acquisition sequential histories, excluding distributed atomicity/persistence. Acceptance: fresh completion succeeds, all stale completions fail without mutation. Negative control: remove epoch comparison; same-name regression must fail. Owner: service maintainer, unassigned; estimated effort half a day.

2. **Correct aggregation and test the public output.** Update `report.py`, extend `tests/test_service.py`, and clarify zero-success behavior in README. Enumerate small lists (length 0–3) of successful mention, successful absence and timeout; use hand-calculated examples and CLI JSON assertions. Require timeout mention flags to have no effect. Scope assumes one record per scheduled provider; retries are excluded by contract. Negative controls: restore either current denominator or constant coverage; tests must fail. Owner: reporting maintainer, unassigned; estimated effort half a day.

For both, reuse the existing unittest command and workflow. Run locally, then advisory on push/PR; estimated shared budget 30 seconds/256 MB, no cache required. Retain revision, Python version, command, counts and failures as CI artifacts. After stable runs, require the actual check via separately verified branch rules. Empty/skip-only runs cannot satisfy acceptance. Maintain tests when contracts change; rollback blocking enforcement to advisory with maintainer-owned, expiring exceptions, retaining evidence.

No heavyweight formal tooling is needed for these concrete counterexamples. Distributed recovery, performance budgets and malformed-input semantics lack supplied requirements; AI-judge calibration and ABI compatibility are inapplicable to this Python model. Architecture is small and dependency-free; consumer semantics and weak test oracles dominate risk.
