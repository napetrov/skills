# Skills

Agent skills for coding agents.

This repository packages small, portable `SKILL.md` instruction sets for agents
such as Codex and Claude Code. It focuses on authoring, validation, catalog
generation, and installation. The full evaluation engine is external; focused fixtures, runners and experiment
records live under `evals/` and stay out of the npm package.

## Quick Start

List available skills:

```bash
npx @napetrov/skills list
```

Install a skill into Codex:

```bash
npx @napetrov/skills install <skill-name> --target codex
```

Install a skill into Claude Code:

```bash
npx @napetrov/skills install <skill-name> --target claude-code
```

Install through the common skills CLI layout:

```bash
npx skills add napetrov/skills --skill <skill-name> --agent codex
```

## Skill Catalog

<!-- skills-catalog-start -->
| Skill | Product | Problems | Maturity | Description |
| --- | --- | --- | --- | --- |
| [assess-project-quality](skills/assess-project-quality) | project-quality | validation-gaps, incomplete-flows, weak-oracles | experimental | Use when finding implicit state machines, hidden contracts and validation gaps, then verifying risks and proposing project-specific checks and CI integration. |
| [performance-contracts](skills/performance-contracts) | verification-contracts | detect-scaling-regression, verify-optimization-correctness, enforce-resource-budget | experimental | Set up and check repeatable performance contracts that catch scaling regressions and wrong optimized output in Python or Node projects. |
| [verify-user-outcomes](skills/verify-user-outcomes) | verification-contracts | verify-user-outcome, detect-disconnected-result, trace-intent-to-evidence | experimental | Set up and check that promised user outcomes are reachable, asserted by tests, and linked to intent and implementation. |
<!-- skills-catalog-end -->

## Project Quality Assessment

[assess-project-quality](skills/assess-project-quality/SKILL.md) helps an agent
understand an existing project, validate suspected problems, and propose up to
three practical checks to integrate into development and CI. It is an instruction
workflow, not a bundled scanner or a certification.

| Mode | Questions it answers | Output |
| --- | --- | --- |
| Discover hidden models | Where are implicit states, call-order rules, ownership and decision tables? | Source-linked models and inspection boundaries |
| Assess validation | Do tests assert consumer promises? Can the oracle miss or share a defect? | Classified findings, reproduction evidence and controls |
| Assess a change | What must survive a rewrite or migration? Is the replacement actually active? | Preservation contract, allowed differences and rollout checks |
| Integrate | Which checks are worth maintaining, and where should they run? | Bounded pilots with acceptance criteria, ownership and cost |

Example agent requests after loading the skill:

- “Find implicit state machines; trace callers and guards before declaring defects.”
- “Assess logic, error/retry flows and validation gaps; propose three CI improvements.”
- “Review this migration: distinguish intentional fixes from regressions, check
  assertion integrity, and trace the default implementation into release artifacts.”

The [pattern catalog](skills/assess-project-quality/references/pattern-catalog.md)
covers 12 families, from state and resources to concurrency, compatibility and
build structure. [Project profiles](skills/assess-project-quality/references/project-profiles.md)
include numerical/HPC, device arrays, compatibility tools, evaluators and SaaS.
[Change assessment](skills/assess-project-quality/references/change-assessment.md)
adds differential/replay, isolated shadow execution, reconciliation and cutover.
Choose methods according to evidence and cost; formal tools are optional.
An implicit model is not inherently a bug, and old behavior is not automatically
correct. Reports distinguish confirmed defects, validation gaps, opportunities,
safe-in-scope cases and insufficient evidence.

### Evidence and limits

[Benchmark notes](skills/assess-project-quality/BENCHMARK.md) separate packaging
checks from agent behavior. [Discovery cases](evals/project-quality/discovery/README.md)
exercise caller protection and stale lease results; the
[brownfield comparison](evals/project-quality/brownfield/README.md) uses fresh
agents with and without the skill and real Dokimi scoring. Both arms passed the
single brownfield task: no accuracy gain is established. Historical
[hard-suite results](evals/project-quality/hard/RESULTS.md) provide additional,
limited development evidence. These experiments do not validate all 12 families
or constitute completed audits of oneDAL, abicheck, AIReady or Dokimi.

To try this PR's version before an npm release, check out its branch and use:

```bash
node bin/skills.js install assess-project-quality --target codex
```

## Contract Skills

Two skills turn promises into repeatable checks in a target project:

- `skills/performance-contracts`: budgets over workload sizes, with an independent oracle and deterministic counters.
- `skills/verify-user-outcomes`: user outcomes linked to intent, implementation, and tests that assert the result.

Design, decisions, and deviations from the handoff spec: [docs/contracts-design.md](docs/contracts-design.md).

## Repository Layout

```text
skills/                 Skill directories consumed by agents
schemas/                Machine-readable validation contracts
skills.lock.json        SHA-256 manifest for packaged skill artifacts
templates/skill/        Template for new skills
tools/                  Validation and catalog generation scripts
bin/skills.js     npm CLI entry point
docs/trust-model.md     Skill trust and admission policy
```

Each skill must include:

- `SKILL.md`
- `skill-card.md`
- `skill-card.json`
- `BENCHMARK.md`

Eval definitions live in the top-level `evals/` directory and are excluded from
the npm package. Skill quality gates in `npm test` are smoke checks: metadata
validation, trust metadata validation, required files, catalog generation,
artifact hash manifest checks, package allowlisting, common skills CLI layout
checks, and installed-package behavior.

## Development

```bash
npm run build
npm test
npm run smoke:install
```

`npm test` runs the smoke checks used in CI, including a packaged install smoke
that installs the generated tarball into a temporary prefix and verifies the CLI
can list, show, verify, and install the bundled skills.

## License

Apache-2.0. See [LICENSE](LICENSE).
