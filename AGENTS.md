# AGENTS.md

This repository contains agent skills. Keep changes narrow and reviewable.

## Rules

- Read the target skill before editing it.
- Eval definitions live in the top-level `evals/` directory. Keep them out of the
  npm package (`package.json` `files` already excludes them). Do not commit heavy
  raw benchmark outputs.
- Keep `SKILL.md` concise; put deeper detail in `references/`.
- Update `skill-card.md`, `skill-card.json`, and `BENCHMARK.md` when skill behavior changes.
- Run `npm run build` and `npm test` before a PR.
- Do not hand-edit the generated catalog section in `README.md` or
  `skills.json`; run the generator.
