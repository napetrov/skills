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
5. **Register stable identities.** Each evidence id appears in a test name. A
   selector that matches no test is an error.
6. **Wire CI and report.** Add the command to CI with failure artifacts. Report the
   scope, files, commands, CI state, and gaps.

## Files Written

- `.petrov/contracts/config.json`: the test command as an argument array and the enrolled scope.
- `.petrov/contracts/outcomes/<ID>.json`: one contract per outcome, with its intent and implementation references.
- `.petrov/contracts/setup-lock.json`: digests of files setup manages.

`node scripts/outcome-check.js setup --repo <repo>` writes the config and an
example proposed outcome. It reports a conflict instead of overwriting an edited file.

## Mapping Rules

- Start with one journey. Do not map the whole product.
- Use typed relationships in the contract: `implements`, `verifies`, `supports`, `depends_on`.
- Store each authoritative link once. Generate reverse indexes instead of maintaining backlinks by hand.
- Shared infrastructure that supports reliability, security, or recovery is a support relationship, not an orphan.
