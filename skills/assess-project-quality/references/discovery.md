# Discovery, validation and durable checks

## Modes and search receipts

- **Discover:** inventory candidate models and contracts; no implication of bugs.
- **Assess:** investigate reachable violations and validation gaps, with support boundaries.
- **Integrate:** design or, if authorized, implement a small maintained check.

A focused request defaults to discover + assess for its requested family. A broad
assessment starts with a applicability pass over the catalog, then a bounded deep
inspection; do not imply every family was exhaustively analyzed. Record skipped
areas, time/tool limits and the next useful search. Stop a candidate when evidence
resolves it; do not invent findings to fill a quota.

## Four layers

1. **Cheap seeds.** Use `rg` or available search over source/configuration/schema
   files. Search assignments and mutations as well as names: flags, enums, nullable
   handles, initialization methods, status columns, version counters, resource
   APIs, error conversions, dispatch branches. A keyword match is not a finding.
2. **Structural facts.** Use an available language parser or semantic index to
   resolve symbols, read/write sites, callers, control flow and data flow. Semgrep
   can express recurring code patterns; CodeQL can query semantic relations and
   paths. For C/C++, prefer compiler-backed AST/index information for types,
   aliases and instantiated code; capture compile flags and analyzed build variants.
   Verify available language/edition capabilities before selecting tools. No one
   of these is a general complete state-machine extractor. Regex-only conclusions
   about ownership, concurrency or cross-file behavior must remain limited.
3. **Model recovery.** The agent relates facts to contracts and produces a small
   model: transitions, resource ownership, decision table, dependency graph, or
   input domain. Cite source for every important edge. Mark inferred/missing edges
   and guards, external calls and assumptions. Group duplicate symptoms by the
   same root cause while preserving the consumers affected.
4. **Hypothesis checks.** Inspect guards at actual entry points and callers. Build
   a minimal sequence/input that violates the contract, then a healthy control.
   Use a disposable copy for mutation or fault injection; preserve original code
   and environment. A model counterexample without a code bridge remains a model
   result. Failed setup or missing tools is not confirmation of a bug.

## Scope receipt

Record: repository/ref/dirty state; selected families; paths and exclusions;
entry points and callers inspected; languages/build variants; tools/versions;
commands actually run; unparsed/generated/vendored files; unavailable dependencies,
CI history and merge rules; unsupported semantic features. For external tools,
record inspected/skipped/failed counts when available, not only finding count.

## Reusable family prompt

> Within <scope and support contract>, discover <family> and reconstruct its
> rules using code references. Separate documented rules, inferences and unknowns.
> Trace the relevant consumers, guards and side effects across files. Identify
> reachable violations or validation weaknesses; look for evidence that refutes
> each suspicion. Provide a minimal reproducer or mark it unexecuted, plus a
> healthy control. Report finding cards, correctly functioning patterns and search
> limitations. Recommend at most <N> proportionate checks, with CI integration.

## Promotion to automation

A useful one-off discovery is not yet a reliable detector. Before a rule can block
merges, collect known violations **and** legitimate lookalikes, measure observed
false positives/negatives on that reviewed set, and document unsupported cases.
Prefer a narrow explicit-contract rule over a heuristic "bad pattern" ban.
Triage/advisory output can remain agent-assisted. Cheap deterministic regression
checks belong in PRs; broader semantic discovery can run periodically or on
changed modules. Revisit affected models when writes, guards, public APIs or
build configurations change. Use stable finding IDs and reviewed exceptions with
owners/expiry; avoid recurring duplicate warnings.

References for optional tooling: [Semgrep pattern syntax](https://semgrep.dev/docs/writing-rules/pattern-syntax),
[CodeQL overview](https://codeql.github.com/docs/codeql-overview/about-codeql/),
[CodeQL C/C++ data flow](https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-cpp/).
These are tool candidates, not required dependencies or corporate deployment approvals.
