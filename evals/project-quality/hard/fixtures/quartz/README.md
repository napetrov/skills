# Quartz 1.0
Production support contract for this sample: scalar saturation on Python integer
operands in [0,31], Linux/Python3.12 only. Return the sum capped at 31. Invalid
operands (including booleans) raise ValueError. The batch entry returns one result
per input pair in input order. No floating-point, unbounded integer or Windows
performance guarantee is advertised. Fixed batch size 64 is an implementation
choice, not a limit on input count. Empty batch returns an empty list.

Run `python -m unittest discover -s tests -v`. CI workflow is supplied; no remote
run receipt or merge-protection settings are included. Historical release notes
are in docs/archive. Tests check the complete finite scalar domain, not every
possible batch or all runtimes. Timing assertions are deliberately absent.
