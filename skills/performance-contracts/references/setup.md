# Setup

Setup adds the smallest runnable performance contract for one vertical slice.
It is an engineering deliverable: files, a passing positive case, a deliberate
violation that fails for every gated assertion, and CI wiring. A written plan alone
does not complete setup.

The helper does not do the engineering. `discover` lists candidates and `setup`
writes files; choosing the benchmark, the oracle, the scope and the budget is the
agent's work, and each choice is written into a contract file.

## Procedure

1. **Discover.** Run `node scripts/perf-check.js discover --repo <repo>`. It lists
   benchmark directories and files, asv configs, pytest configs, Bazel test
   targets, and CI workflows that mention benchmarks. Then read the repository
   instructions, build manifest, and those candidates. Record working, broken,
   and unwired checks separately. Reuse an existing benchmark before adding one.
   The inventory names candidates only; nothing in it has run.
2. **Select one slice.** Choose one important operation with a concrete input,
   environment, success condition, and exclusions. Derive these from code and
   docs. Ask only about unresolved intent or policy.
3. **Implement missing evidence.** Add the smallest fixture, benchmark command,
   and assertions. Keep production behavior unchanged. Measure observer overhead
   if the instrumentation touches a hot path.
4. **Establish a trustworthy reference.** Write expected results from an
   independent source: generator ground truth, a simpler trusted implementation,
   or a stated invariant. Never use the candidate as its own oracle. When an
   independent implementation gives an exact count, compare with `eq` against it.
5. **Prove discrimination per gated assertion.** Give every assertion a
   `negative_control`: `kind` is `regression` for a behavior change in product code
   and `synthetic` for a counter-only change, `file` is the file the change applies
   to, and `before` is exact text that occurs once in that file. Then run
   `node scripts/perf-check.js discriminate --repo <repo> --contract <ID>`. It runs
   the unmodified case, then each control in a copy of the repository, and requires
   each control to violate its own metric. A control that stays green is a blind
   gate: fix the workload or the counter before enabling the contract. An
   `insensitive_counter` warning means no run moved that counter.
6. **Wire execution.** Add the command to CI with artifacts kept on failure.
   Document the local command. Keep existing jobs.
7. **Verify repeatability.** Run setup again. Expect `unchanged` for files you did
   not touch, `user_owned` for files you edited while the template is unchanged,
   no `conflicts`, no recreated example, no tracked diff beyond your edits, and
   no reset baseline. A conflict means the file was edited and its template changed
   since setup last applied it, or setup never wrote the file and it differs from the
   template. Either needs a reviewed migration, not a rerun.
8. **Report readiness.** Give the scope, files, commands, observed CI state, known
   gaps, the discrimination result per assertion, and the next normal check command.

## Upgrading From The Previous Layout

Projects configured before the state directory was renamed to `.verification/`
keep their files in the previous dot-directory, and the checkers report them as
unconfigured. Once, from the repository root, move the contracts folder:

```bash
mv <previous-state-dir>/contracts .verification/contracts
```

Then run `setup` again and review its report.

## Files Written

- `.verification/contracts/config.json`: command argument arrays, scopes, artifact directory.
- `.verification/contracts/performance/<ID>.json`: one contract per operation.
- `.verification/contracts/performance/EXAMPLE-PERF-001.json`: written only while no
  contract exists. Once removed, setup does not recreate it.
- `.verification/contracts/baselines/<ref>.json`: immutable reference counters.
- `.verification/contracts/setup-lock.json`: digests of files setup manages.
- The benchmark command and its oracle, in the project's own layout.

`node scripts/perf-check.js setup --repo <repo>` writes the config and, when
needed, the example. It reports each file as `created`, `updated`, `unchanged`,
`user_owned`, `conflicts`, or `skipped`, and includes the discovery inventory. It
never overwrites a file the user edited.

## Budgets

If the project has no approved budget, record observed counters in a baseline and
a proposed contract in observation mode. Do not invent an approved budget.
Set numeric thresholds before evaluating the candidate.

Counters that do not grow with the workload (iterations, kernel calls, allocations,
device transfers) use a constant bound. The bound applies at every declared size:

```json
{"metric": "n_iter", "operator": "le", "coefficient": 10, "shape": "constant", "dimension": "n_samples"}
```

`dimension` must match the workload dimension, as for every `le` assertion. A
constant bound is a budget: it needs the same approval as any other, and its
negative control must move the counter, or the warning above applies.
