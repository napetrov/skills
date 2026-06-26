# Contributing

## Add a Skill

1. Copy `templates/skill` to `skills/<skill-name>`.
2. Use kebab-case for the directory and `name` frontmatter.
3. Keep `description` under 160 characters.
4. Fill in product, problem, tag, agent, and maturity metadata.
5. Update `skill-card.md` and `BENCHMARK.md`.
6. Run:

```bash
npm run build
npm test
```

## First-Version Scope

This repository intentionally does not include a full eval harness. Keep heavy
benchmark artifacts, terminal-bench tasks, and generated eval outputs in the
benchmark repository until a release policy is approved.

## Pull Request Checklist

- Skill metadata validates.
- Catalog is regenerated.
- Smoke checks pass.
- New scripts are declared in `SKILL.md`.
- Security and limitations are explicit.
