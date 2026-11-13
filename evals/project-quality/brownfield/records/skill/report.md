# Quote-engine migration readiness

**Not ready to release.** The default still activates classic, both engines fail the negative-input contract, and the replacement assertion is weaker. Keeping the explicit classic fallback and correcting zero pricing are intentional, not migration defects.

## Scope and recovered contract

Inspected all four target files: `README.md`, `app.py`, `engines.py`, and `checks.py`. Focus: Python pricing library, behavioral compatibility, validation integrity, and configuration activation. No target source changed; no network, dependencies, or external repository material used. Revision/dirty state are unverified: no repository metadata exists inside the authorized target scope. No CI, packaged artifacts, deployment history, or external callers were supplied.

The documented oracle is `README.md:1`: zero costs 0, positive integer n costs 3n, and negatives raise `ValueError`. The ADR intentionally corrects classic's zero charge. Classic remains an explicitly supported opt-in fallback for one release; the default must select modern. Treatment of nonintegers, invalid ENGINE values, and whether fallback preserves the historical zero bug are unresolved; none is needed to establish the release blockers.

Recovered model: `app.quote` reads ENGINE on each call and dispatches through `ENGINES` (`app.py:3–5`); engines independently clamp then multiply (`engines.py:1–5`). No caller-side negative guard exists in the inspected public path. This is a configuration/input decision model, not a lifecycle state machine.

## Findings

- **F1 — confirmed defect, default activation.** `app.py:5` defaults to classic. With ENGINE removed, `quote(0)` returned 3; explicit modern returned 0. Static routing confirms this is the wrong default, not merely two indistinguishable implementations. Explicit modern at 2 returned 6 as a healthy control.
- **F2 — confirmed defect, negative semantics.** `quote(-1)` returned 3 for default/classic and 0 for modern, instead of `ValueError`. Both implementations violate the documented error rule; correcting default activation alone cannot fix this. Positive controls 1, 2, 5, 100 returned 3, 6, 15, 300 in every configuration.
- **F3 — validation gap, lost assertion strength.** `checks.py:5` requires exactly 6; its replacement at line 7 only requires non-None. In-memory substitution of modern with a function returning 7 passed the replacement test. The retained old test still checks classic, not modern's exact output.
- **F4 — validation gap, insufficient differential evidence.** `checks.py:3` compares only four positive inputs and cannot establish the independent contract. All original checks passed. Rebinding modern to classic in the checks module also passed every existing assertion while charging 3 for zero. The real modern zero difference is an intentional correction, so blanket equivalence would itself be the wrong acceptance rule.

## Execution receipt and limits

Ran a `python -B` stdin probe under Python 3.12.14, executing `checks.py` through `runpy`, then 18 calls covering ENGINE unset/classic/modern × inputs -1, 0, 1, 2, 5, 100, plus the two in-memory controls above. Probe body took 0.012 seconds. No skips or failed setup; no universal coverage claim. Checks are implemented and locally executed; CI configuration/enforcement remain unknown.

## Prioritized actions (proposed only)

1. Fix `app.py` default to modern; add unset/explicit routing tests to `checks.py`. Healthy modern-default must pass; reverted classic-default must fail. Preserve explicit fallback.
2. Add negative rejection in `engines.py` or the public boundary according to the supported direct-call contract. Add independent zero/positive/error assertions; healthy results pass, missing rejection fails. Explicitly document fallback zero semantics.
3. Restore exact modern assertions in `checks.py`; retain differential checks only for preserved behavior. Require both demonstrated mutants to fail, while modern's zero correction passes.

Owner: quote-engine maintainer (unassigned). Estimated effort: hours, no added tooling. Run deterministic checks on PRs and releases, initially advisory until controls pass; estimated seconds per run. Record failures, then require the check. Revisit on contract/configuration changes; withdraw a noisy gate to advisory rather than silently weakening assertions. Fallback expiry remains one release per README.
