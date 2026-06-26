# Linux Perf Repair Skill Card

## Description

Route Linux `perf` triage, hotspot interpretation, and safe performance repair
work to public benchmark-backed workflows.

## Owner

Nikolay Petrov and contributors.

## License

Apache-2.0.

## Product

- Product: `linux-perf`
- Product family: `intel-performance-skills`
- Agents: Codex, Claude Code
- Maturity: experimental

## Use Cases

- Interpret `perf stat`, `perf report`, `perf annotate`, and `perf c2c`.
- Produce structured hotspot reports.
- Repair small C/C++ performance regressions with evidence.
- Route agents to public benchmark tasks instead of copying heavy task fixtures
  into this repository.

## Public Source

The installed skill is a thin trigger/wrapper. The source skill and detailed
workflow references live in:

- https://github.com/intel/intel-performance-skills
- https://github.com/intel/intel-performance-skills/tree/main/skills/linux-perf
- https://github.com/intel/intel-performance-skills/tree/main/skills/performance-patterns

Relevant public skill material includes:

- `skills/linux-perf/SKILL.md`
- `skills/linux-perf/references/flow-a.md`
- `skills/linux-perf/references/flow-b.md`
- `skills/linux-perf/references/flow-c.md`
- `skills/linux-perf/references/flow-d.md`
- `skills/performance-patterns/triggers/from-profile.md`
- `skills/performance-patterns/triggers/from-source.md`
- `skills/performance-patterns/patterns/parallel-accumulator.md`
- `skills/performance-patterns/patterns/false-sharing.md`
- `skills/performance-patterns/patterns/missing-restrict.md`

Benchmark examples may live in `napetrov/agent-benchmark`, but that repository
is not the source of the skill.

## Known Risks And Mitigations

- Risk: agent proposes a fix from weak counter evidence.
  Mitigation: skill requires regime classification and explicit unsupported
  conclusions.
- Risk: agent fabricates speedups.
  Mitigation: skill requires before/after timing and correctness checks.
- Risk: agent runs privileged `perf` commands blindly.
  Mitigation: skill requires permission explanation and fallback to static
  artifacts where needed.

## Evaluation Status

Full evals are intentionally outside this repository. Source skill material
lives in `intel/intel-performance-skills`.
