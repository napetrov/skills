---
name: linux-perf-repair
description: Route Linux perf triage, hotspot interpretation, and safe performance repair work to public benchmark-backed workflows.
version: 0.1.0
license: Apache-2.0
product: linux-perf
product_family: intel-performance-skills
tags: [linux-perf, perf, profiling, performance, optimization, c, cpp]
problems: [diagnose-linux-performance, interpret-perf-artifacts, repair-performance-regressions]
agents: [codex, claude-code]
maturity: experimental
data_classification: public
source_url: https://github.com/intel/intel-performance-skills
implementation_url: https://github.com/intel/intel-performance-skills/tree/main/skills/linux-perf
---

# Linux Perf Repair

Use this skill when the user asks an agent to diagnose or repair Linux CPU
performance problems using `perf` evidence, static profile artifacts, or small
C/C++ performance-repair tasks.

This skill is intentionally a thin installed trigger. The source skill and
detailed workflow references live in the public
`intel/intel-performance-skills` repository.

## When To Use

- The user provides `perf stat`, `perf report`, `perf annotate`, or `perf c2c`
  output and asks what is slow.
- The user asks to repair a Linux performance regression in C/C++ code.
- The workload involves low IPC, cache misses, branch misses, futex/lock
  contention, false sharing, missing `restrict`, or serial accumulators.
- The user wants a structured hotspot report from profiling artifacts.

## When Not To Use

- The task is only package installation, build cleanup, or general Linux admin.
- The target is a `pts/<name>` benchmark; route to a Phoronix Test Suite
  workflow first.
- There is no performance symptom, baseline, profile artifact, or reproducible
  command.
- The user asks for a guaranteed speedup without measurement.

## Workflow

1. Establish the target command, baseline, hardware, compiler, and workload size.
2. If `perf` artifacts already exist, interpret them before collecting more data.
3. If artifacts are missing, propose the smallest safe measurement plan.
4. Classify the regime:
   - low IPC with low cache/branch/kernel signals: compute or dependency chain;
   - high cache misses: memory locality or working-set issue;
   - high branch misses: branchy/control-flow issue;
   - high kernel/futex/lock cost: synchronization or syscall issue;
   - HITM/c2c evidence: true sharing or false sharing.
5. Map evidence to a repair pattern only after the classification is clear.
6. Make the smallest semantics-preserving change.
7. Verify with correctness tests and before/after timing; include counter changes
   when available.

## Repair Patterns

Common patterns covered by the public Intel performance skills:

- serial accumulator: split dependency chains or use independent accumulators;
- false sharing: separate independently written fields across cache lines;
- hot shared counter: replace hot global atomics with local aggregation;
- missing `restrict`: add a valid non-overlap contract in C code;
- hotspot report: produce evidence-only Markdown without claiming a code change.

## Public Source

Use the public Intel repository as the source of truth for workflow behavior:

- `https://github.com/intel/intel-performance-skills`
- `skills/linux-perf/SKILL.md`
- `skills/linux-perf/references/flow-a.md`
- `skills/linux-perf/references/flow-b.md`
- `skills/linux-perf/references/flow-c.md`
- `skills/linux-perf/references/flow-d.md`
- `skills/performance-patterns/SKILL.md`
- `skills/performance-patterns/triggers/from-profile.md`
- `skills/performance-patterns/triggers/from-source.md`
- `skills/performance-patterns/patterns/parallel-accumulator.md`
- `skills/performance-patterns/patterns/false-sharing.md`
- `skills/performance-patterns/patterns/missing-restrict.md`

Benchmark examples for this wrapper can be evaluated separately in
`napetrov/agent-benchmark`, but that benchmark repository is not the source of
the skill content.

## Reporting Contract

For triage, report:

- evidence source;
- inferred performance regime;
- top hotspot or contention signal;
- what conclusion is supported;
- what conclusion is not yet supported;
- next measurement or repair step.

For repair, report:

- baseline command and result;
- exact code change summary;
- correctness verification;
- before/after timing;
- remaining uncertainty.

## Safety And Limits

- Do not fabricate `perf` counters, timings, or speedups.
- Do not claim a binary was fixed when only a report was produced.
- Do not run privileged `perf` commands without explaining permissions and
  fallback options.
- Do not change compiler flags, ABI contracts, or synchronization semantics
  without calling out the risk.
- Do not add `restrict` unless the non-overlap contract is true.
- Do not optimize `pts/<name>` benchmark internals before routing through the
  benchmark lifecycle.
