# Agent pilot results

Six tasks, three repetitions, two conditions (A: agent without the skills;
B: skills available at their installed paths). 36 runs, graded by
`evals/pilot/grade.js` from the final deliverable (REPORT.md or VERIFY.md, or
the subagent's final report when the file could not be written).

| Task | A success | B success | False pass (A/B) | False positive (A/B) |
| --- | --- | --- | --- | --- |
| T1 setup: runnable check that discriminates | 3/3 | 3/3 | 0/0 | 0/0 |
| T2 reuse existing check | 3/3 | 3/3 | 0/0 | 0/0 |
| T3 quadratic regression | 3/3 | 3/3 | 0/0 | 0/0 |
| T4 legitimate lookalike | 3/3 | 3/3 | 0/0 | 0/0 |
| T5 disconnected outcome | 3/3 | 3/3 | 0/0 | 0/0 |
| T6 indirect support code kept | 3/3 | 3/3 | 0/0 | 0/0 |

## What this shows

- Both conditions reach the ceiling. The pilot cannot tell whether the skills
  help. It shows only that these tasks are too easy for the current agent.
- No false passes or false positives occurred in either condition.
- The T5 defect (an empty loop in `src/cli.js`) was found in every run. The
  deliberate defect is in the agent's workspace only, never in the repository.

## Limits and known problems

- **Ceiling effect.** Tasks need harder fixtures before a difference can appear.
  Candidates: a regression hidden behind a correct-looking benchmark, outcomes
  whose failure is visible only through a second entry point, and maintenance
  tasks with real dead code.
- **Weak reuse evidence.** `scan-comparison-reuse` asserts `scanCount === 0`, but
  nothing calls `startScan()`, so the assertion cannot fail. Reported by several
  runs; the fixture needs a guard that a scan would actually trip.
- **Deliverables from subagents.** The harness refused `REPORT.md` and
  `VERIFY.md` writes from subagents. Grading therefore reads the final report
  from the `SubagentHandback` call in the transcript. Each run's text is kept in
  the pilot scratch directory, not in this repository.
- **Grading is shallow.** Verdicts are classified by keywords. The T1 check runs
  the agent's command on a clean copy and on a mutant copy, so it does not judge
  the quality of the agent's check, only whether it discriminates.
- **Concurrency.** Two grader runs over the same workspaces race on the
  `__clean` and `__mutant` copies. Run one grader at a time.
- **Sample size.** Three repetitions per cell is too small for any statistical
  claim, as the plan states.
