# Project profiles and organizational use

Profiles prioritize questions; they are not audits of named repositories and do
not hard-code corporate policy. Start with declared support contracts and actual
architecture, then override this guidance using project evidence. A named
profile is an example and a starting hypothesis, not a complete list: add a
family whenever the repository shows its signal (a cache or persisted snapshot →
P09, a non-trivial native or multi-variant build → P12, and so on), and record
why each family was added or skipped.

| Profile / examples | Initial families | Specific boundaries to recover |
| --- | --- | --- |
| Numerical/HPC library; oneDAL | P02/P03/P04/P06/P08/P10 | Training/inference lifecycle, device buffers, async dependencies, backend dispatch, numerical error contracts, binary consumers |
| Array/device interface; dpnp/dpctl | P02/P03/P04/P06/P08 | Queue/context association, USM/borrowed memory lifetime, event completion, dtype/device combinations |
| Compatibility analyzer; abicheck | P06/P07/P08/P09/P10/P11/P12 | Unknown versus compatible, layout representation, independent consumers, generator domain and reduction soundness, snapshot/cache invalidation, native toolchain and build-variant reproducibility |
| Evaluation system; Dokimi | P07/P09/P11 | Partial/unscored outcomes, denominator and provenance, cached results, judge failure, report completeness |
| SaaS/workers; AIReady | P01/P04/P05/P07/P09/P10 | Jobs, retries/cancellation, provider incompleteness, tenant boundaries, cache invalidation, billing effects |
| Build/infrastructure | P02/P06/P12 | Declared inputs/tools, dependency graph, hermetic actions, generated artifacts, cache correctness, migration parity |

Always consider relevant cross-cutting authorization/security boundaries; this
skill does not replace a dedicated security assessment. Do not force numerical
conditioning checks on a CLI-only utility or retry protocols on a pure function.

## Portable scope configuration (optional report input, not an executable format)

```yaml
profile: numerical-library
focus: [P03, P04, P06]
include: [src, tests, build]
exclude: [vendor, generated]
supported: [linux, cpu, gpu]
mode: assess
execution: local-disposable-tests
network: none
outputs: internal-report
max_initial_pilots: 3
```

This example is a human/agent scope declaration, not a shipped parser or a policy
that overrides repository instructions. Replace with actual support evidence.
Explain exclusions and inspect generation sources where generated code matters.

## Personal and enterprise projects

Use the same finding format and methodology, with repository-specific boundaries:

- Read project guidance for allowed tools, build environments, model endpoints and
  data handling. If absent, work with existing local read-only access; do not invent
  an Intel policy, approved vendor list, blanket prohibition or approval process.
- Source, logs, traces, prompts and report excerpts may contain proprietary data.
  Keep them in authorized destinations; publishing this public skill does not
  authorize publishing private findings. No external service is required.
- Select only tools available and permitted in that environment. A recommendation
  is not evidence of procurement, licensing or deployment approval. Record missing
  tooling as a limitation and continue with available evidence.
- Reuse existing CI and ownership structures. Keep exploratory heuristics advisory;
  promote validated, actionable rules on an agreed scope before broad rollouts.
- Produce two views when useful: maintainer details with references/reproducers,
  and a concise engineering summary of impact, opportunities, effort and coverage
  limits. Avoid cross-repository league tables based on incomparable raw counts.
