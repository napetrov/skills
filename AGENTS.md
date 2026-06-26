# AGENTS.md

This repository contains agent skills. Keep changes narrow and reviewable.

## Rules

- Read the target skill before editing it.
- Do not add `evals/` or heavy benchmark artifacts in the first-version repo.
- Keep `SKILL.md` concise; put deeper detail in `references/`.
- Update `skill-card.md` and `BENCHMARK.md` when skill behavior changes.
- Run `npm run build` and `npm test` before a PR.
- Do not hand-edit the generated catalog section in `README.md` or
  `skills.json`; run the generator.
