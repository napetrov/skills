# Setup

Setup adds the smallest runnable performance contract for one vertical slice.
It is an engineering deliverable: files, a passing positive case, a deliberate
violation that fails, and CI wiring. A written plan alone does not complete setup.

## Procedure

1. **Discover.** Read the repository instructions, build manifest, existing tests,
   benchmark scripts, and CI. Record working, broken, and unwired checks
   separately. Reuse an existing benchmark before adding one.
2. **Select one slice.** Choose one important operation with a concrete input,
   environment, success condition, and exclusions. Derive these from code and
   docs. Ask only about unresolved intent or policy.
3. **Implement missing evidence.** Add the smallest fixture, benchmark command,
   and assertions. Keep production behavior unchanged. Measure observer overhead
   if the instrumentation touches a hot path.
4. **Establish a trustworthy reference.** Write expected results from an
   independent source: generator ground truth, a simpler trusted implementation,
   or a stated invariant. Never use the candidate as its own oracle.
5. **Prove discrimination.** Run the accepted case, then a deliberate violation
   in a disposable copy or isolated worktree. Restore and rerun the accepted case.
6. **Wire execution.** Add the command to CI with artifacts kept on failure.
   Document the local command. Keep existing jobs.
7. **Verify repeatability.** Run setup again. Expect no tracked diff, no duplicate
   CI steps, and no reset baseline.
8. **Report readiness.** Give the scope, files, commands, observed CI state, known
   gaps, and the next normal check command.

## Files Written

- `.petrov/contracts/config.json`: command argument arrays, scopes, artifact directory.
- `.petrov/contracts/performance/<ID>.json`: one contract per operation.
- `.petrov/contracts/baselines/<ref>.json`: immutable reference counters.
- `.petrov/contracts/setup-lock.json`: digests of files setup manages.
- The benchmark command and its oracle, in the project's own layout.

`node scripts/perf-check.js setup --repo <repo>` writes the config and an example
proposed contract. It never overwrites a file the user edited; it reports a conflict instead.

## Budgets

If the project has no approved budget, record observed counters in a baseline and
a proposed contract in observation mode. Do not invent an approved budget.
Set numeric thresholds before evaluating the candidate.
