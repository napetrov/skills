# Setup

Setup enrolls one bounded journey. It adds a scenario test only where the
required evidence is missing, and it proves that the check can fail.

## Procedure

1. **Start from intent.** Read the existing product specification, journey
   documents, and issues. Extract one journey with a concrete result and failure
   branches. Mark any inferred intent for review.
2. **Trace the path.** From the real entry point to the output the user or caller
   consumes. For async work, follow persistence, job completion, and result retrieval.
3. **Reuse evidence.** Inspect existing tests and their assertions. Add a minimal
   scenario test only where an assertion is absent. Cover CLI and API journeys as
   well as UI flows.
4. **Prove discrimination.** In a disposable copy, disconnect the result from its
   consumer, or violate one acceptance condition. The outcome check must fail.
5. **Register stable identities.** Each evidence id appears in a test name, or,
   with the pytest plugin, in `@pytest.mark.outcome("<id>")` on the test. A
   selector that matches no test is an error.
6. **Wire CI and report.** Add the command to CI with failure artifacts. Report the
   scope, files, commands, CI state, and gaps.

## Upgrading From The Previous Layout

Projects configured before the state directory was renamed to `.verification/`
keep their files in the previous dot-directory, and the checkers report them as
unconfigured. Once, from the repository root, move the contracts folder:

```bash
mv <previous-state-dir>/contracts .verification/contracts
```

Then run `setup` again and review its report.

## Contract Location

State lives in `.verification/contracts/` unless the project keeps it elsewhere.
Pass `--contracts-dir <dir>` (or set `CONTRACTS_DIR`) to every command, the same
value each time; it must be a relative path inside the repository. The paths below
are shown for the default directory; with `--contracts-dir <dir>`, replace
`.verification/contracts/` with `<dir>/`. For the pytest plugin, set `contracts_dir` in the
pytest ini file instead of repeating the flag.

## Files Written

- `.verification/contracts/config.json`: the test command as an argument array and the enrolled scope.
- `.verification/contracts/outcomes/<ID>.json`: one contract per outcome, with its intent and implementation references.
- `.verification/contracts/setup-lock.json`: digests of files setup manages.

In a Python project that uses the pytest plugin, the plugin is the check: add
`python -m pytest -p pytest_outcomes --outcomes` to CI as its own step, with
`PYTHONPATH` pointing at the skill's `scripts/` (or a copy of `pytest_outcomes.py`
listed in `pytest_plugins`). Do not put that command in `config.json` for
`outcome-check.js`: it reads TAP with bracketed ids in test names, and pytest
output has neither, so every id would be unmatched. The plugin reads only
`artifact_dir` from `config.json`; `commands` can stay empty.

`node scripts/outcome-check.js setup --repo <repo>` writes the config and an
example proposed outcome. It never overwrites an edited file: an edit with an
unchanged template is reported as `user_owned`. A conflict is reported when the
template also changed, or when an existing file differs from the template and setup
never wrote it.

## Mapping Rules

- Start with one journey. Do not map the whole product.
- Use typed relationships in the contract: `implements`, `verifies`, `supports`, `depends_on`.
- Store each authoritative link once. Generate reverse indexes instead of maintaining backlinks by hand.
- Shared infrastructure that supports reliability, security, or recovery is a support relationship, not an orphan.
