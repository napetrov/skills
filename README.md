# Skills

Agent skills for coding agents.

This repository packages small, portable `SKILL.md` instruction sets for agents
such as Codex and Claude Code. It focuses on authoring, validation, catalog
generation, and installation. Full benchmark/evaluation harnesses live outside
this repository.

## Quick Start

List available skills:

```bash
npx @napetrov/intel-skills list
```

Install a skill into Codex:

```bash
npx @napetrov/intel-skills install <skill-name> --target codex
```

Install a skill into Claude Code:

```bash
npx @napetrov/intel-skills install <skill-name> --target claude-code
```

Install through the common skills CLI layout:

```bash
npx skills add napetrov/skills --skill <skill-name> --agent codex
```

## Skill Catalog

<!-- skills-catalog-start -->
| Skill | Product | Problems | Maturity | Description |
| --- | --- | --- | --- | --- |
| [performance-contracts](skills/performance-contracts) | petrov-contracts | detect-scaling-regression, verify-optimization-correctness, enforce-resource-budget | experimental | Set up and check repeatable performance contracts that catch scaling regressions and wrong optimized output in Python or Node projects. |
| [verify-user-outcomes](skills/verify-user-outcomes) | petrov-contracts | verify-user-outcome, detect-disconnected-result, trace-intent-to-evidence | experimental | Set up and check that promised user outcomes are reachable, asserted by tests, and linked to intent and implementation. |
<!-- skills-catalog-end -->

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
bin/intel-skills.js     npm CLI entry point
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
