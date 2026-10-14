# Skills

Each subdirectory is one complete agent skill.

Required files:

- `SKILL.md`
- `skill-card.md`
- `skill-card.json`
- `BENCHMARK.md`

Optional files:

- `references/*.md`
- `scripts/*`

Eval definitions go in the top-level `evals/` directory, not inside a skill
directory. Skill directories are packaged, and the package allowlist rejects
`evals/` inside them.
