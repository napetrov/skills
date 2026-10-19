# python-outcome-target

Target-shaped Python project for the `verify-user-outcomes` pytest plugin.
Its outcome contracts live in `tests/contracts/`, not the default
`.verification/contracts/`, so the tests also exercise `--contracts-dir`.

```bash
PYTHONPATH=../../skills/verify-user-outcomes/scripts \
  python3 -m pytest -p pytest_outcomes --outcomes --contracts-dir=tests/contracts
```
