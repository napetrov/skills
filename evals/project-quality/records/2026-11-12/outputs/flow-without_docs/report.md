# Scan comparison assessment

The CLI promise is broken at presentation. The comparison helper correctly computes the observed fixture's two changes, but the CLI prints only their count. No source was changed and no network was used.

## Evidence

- Inspected `TASK.md`, `package.json`, `src/{cli,compare,store}.js`, `tests/scan-compare.test.js`, `data/measurements.json`, and `.verification/contracts/{config.json,outcomes/OUTCOME-SCAN-COMPARE.json}`. Did not read `docs/journeys.md`.
- Ran `npm test`: exit 1; four tests, three pass, one fails. `[scan-comparison-happy]` fails because stdout lacks `modified src/a.js (+3 lines)`. Fingerprint mismatch, stored-measurement reuse, and incomplete-measurement refusal tests pass.
- Ran `node src/cli.js compare m-1 m-2`: exit 0, stdout exactly `Comparable: yes\nChanged files: 2\n`. The user receives no change details despite success status.
- Directly called `compareMeasurements` with the same fixture: returns comparable=true, modified `src/a.js` with delta=3, added `src/c.js` with lines=7, and no limitations. Store scanCount remains 0. The helper works for this tested comparison; this is not exhaustive proof for all inputs.
- Root cause: `src/cli.js` iterates `for (const change of [])` instead of the returned changes. Computation reaches the CLI, but its rendering loop never executes.
- The enabled outcome contract states that the user receives changes with comparability limitations and maps four acceptance evidence IDs to the local test command. Its existence and enabled status establish intended verification, not actual merge enforcement. No CI workflow or merge-policy evidence was supplied in the inspected project. Merge enforcement is therefore unknown.

## Concrete integration plan

1. Change the CLI rendering loop to iterate `result.changes`; retain the existing delta formatting. For m-1 versus m-2, require the two detail lines `modified src/a.js (+3 lines)` and `added src/c.js` in addition to the summary. Re-run the existing four tests before accepting the fix.
2. Add focused cases for removed files, negative deltas, identical measurements, different projects, and unknown IDs. Assert helper data independently and CLI output/exit status at the public entry point. Strengthen the mismatch test to require the explanatory limitation, not only the mismatch label.
3. Keep the existing no-new-scan test and extend coverage across the CLI boundary with an injectable or observable scan dependency if scans become available there. A direct helper assertion alone does not enforce future CLI behavior. Validate project authorization at the integration boundary when an authenticated store is introduced; the fixture currently has no authorization mechanism.
4. Wire the configured test command into the actual PR pipeline using a supported Node runtime. Include changes to `src/**`, `tests/**`, `data/**`, `docs/**`, and the contract configuration itself in verification triggers. Publish TAP output and contract-to-test coverage; reject missing evidence IDs and nonzero test exits.
5. Make that CI check required in the repository's merge rules, and verify the policy with a deliberately failing PR. Record the workflow/check name and merge-rule evidence before claiming enforcement. The current failing happy-path test must block merging until the presentation fix is verified.
