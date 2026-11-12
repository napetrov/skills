# Cedar assessment

The snapshot violates two explicit README contracts, despite all three supplied tests passing. Both issues affect consumer-visible correctness; the highest priority is preventing an obsolete lease from replacing a newer result.

## 1. Fence completion by lease acquisition

**Observed:** `Store.claim` increments the epoch and returns it in `Lease`, but `Store.complete` checks only the worker name. The README explicitly allows a restarted process to reuse its configured worker name and requires expired work never to overwrite a newer lease's result, including after that newer work finishes.

Reproduce from the project directory with `PYTHONDONTWRITEBYTECODE=1 python`:

```python
from store import Store
s = Store()
old = s.claim("w", 0)
new = s.claim("w", 11)
assert s.complete(new, "fresh")
print(s.complete(old, "stale"), s.row["result"])
# Actual: True stale; required: False fresh
```

The old and new tokens have epochs 1 and 2 respectively. This is a deterministic stale-write failure without requiring concurrent execution. The supplied takeover test changes the worker name from `a` to `b`, so it cannot detect the restart case. Keeping the worker on the row after completion means the same defect remains after the newer work finishes.

**Change worth integrating:** Require both worker and epoch to match the current acquisition before updating the result, and preserve the current epoch through completion. Add regression tests for same-name reacquisition at expiry, old completion before and after new completion, and unchanged stored results after rejection. Retain the existing different-name takeover and ordinary completion tests. If this model is later implemented in a shared database, make the comparison and write one conditional atomic operation; that is an implementation requirement inferred from concurrency, not a demonstrated database defect in this snapshot.

## 2. Calculate report metrics from successful answers

**Observed:** `summarize` divides successful mentions by all records and unconditionally reports coverage as 1.0 for nonempty inputs. The README instead defines visibility as mentions divided by successful answers, and coverage as successful answers divided by scheduled providers. Timeouts must remain unknown evidence.

The public consumer already exposes the error: `PYTHONDONTWRITEBYTECODE=1 python cli.py` emits `{"visibility": 0.5, "coverage": 1.0}` for one successful mention and one timeout. Under the documented contract, this must be `{"visibility": 1.0, "coverage": 0.5}`. A single timeout returns visibility 0.0 and coverage 1.0, incorrectly presenting absence and complete coverage.

**Change worth integrating:** Count successful records separately; divide successful mentions by successful answers, and successful answers by scheduled providers. Return `None` visibility when no answers succeed, consistent with the existing empty-input behavior and the contract's treatment of unknown evidence. Add table-driven unit cases for mixed success/timeout, all-timeout, all-success, successful nonmentions, and empty input. Add a CLI subprocess assertion that parses JSON and checks this mixed-provider example, so the public flow is covered as well as the helper.

**Assumption to make explicit:** Using record count for scheduled providers is valid if every scheduled provider contributes one record, including timeouts. This is consistent with the supplied one-attempt example. If records can be omitted, the denominator must instead come from explicit scheduling data; the snapshot does not show that producer boundary. Retries are explicitly out of scope.

## Validation limits

I ran the documented unittest discovery command: all three tests passed. I also ran the public CLI and the direct lease/report probes above. These results show narrow happy-path coverage, not contract compliance. No CI execution records or branch-protection configuration are supplied, so whether these tests run or gate merges is unknown. Integrating the two regression groups into the existing unittest command is the useful immediate validation improvement; introducing additional tools would not address the demonstrated failures.
