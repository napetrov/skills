# Skills

Intel agent skills for coding agents.

This repository packages small, portable `SKILL.md` instruction sets for agents
such as Codex and Claude Code. The first release focuses on authoring,
validation, catalog generation, and installation. Full benchmark/evaluation
harnesses live outside this repository.

## Quick Start

List available skills:

```bash
npx @napetrov/intel-skills list
```

Install a skill into Codex:

```bash
npx @napetrov/intel-skills install dpnp-quickstart --target codex
```

Install a skill into Claude Code:

```bash
npx @napetrov/intel-skills install dpnp-quickstart --target claude-code
```

## Skill Catalog

<!-- skills-catalog-start -->
| Skill | Product | Problems | Maturity | Description |
| --- | --- | --- | --- | --- |
| [dpnp-quickstart](skills/dpnp-quickstart) | dpnp | migrate-numpy-to-xpu, diagnose-device-selection, benchmark-python-kernels | experimental | Guide NumPy-to-dpnp migration, device checks, safe fallback patterns, and performance-minded usage. |
| [linux-perf-repair](skills/linux-perf-repair) | linux-perf | diagnose-linux-performance, interpret-perf-artifacts, repair-performance-regressions | experimental | Route Linux perf triage, hotspot interpretation, and safe performance repair work to public benchmark-backed workflows. |
<!-- skills-catalog-end -->

## Repository Layout

```text
skills/                 Skill directories consumed by agents
schemas/                Machine-readable validation contracts
templates/skill/        Template for new skills
tools/                  Validation and catalog generation scripts
bin/intel-skills.js     npm CLI entry point
```

Each skill must include:

- `SKILL.md`
- `skill-card.md`
- `skill-card.json`
- `BENCHMARK.md`

`evals/` are intentionally not part of this first repository version. Skill
quality gates here are basic smoke checks: metadata validation, trust metadata
validation, required files, catalog generation, package allowlisting, and
installed-package behavior.

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
