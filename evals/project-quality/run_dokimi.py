#!/usr/bin/env python3
"""Run Dokimi static checks and score supplied paired answers without model calls."""
import argparse
import json
import subprocess
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]


def dump(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dokimi-root", type=Path, required=True, help="intel/dokimi checkout root")
    parser.add_argument("--python", required=True, help="Python with Dokimi command dependencies")
    parser.add_argument("--answers-dir", type=Path, required=True, help="parent of task-condition output folders")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    project = args.dokimi_root.resolve() / "dokimi"
    tasks = json.loads((HERE / "grading-frozen.json").read_text())
    questions, answers, controls, control_questions = [], [], [], []
    for name, task in tasks.items():
        q = {"id": name, "question": task["prompt"],
             "grading": {"checks": [{"type": "json", "values": [task["expected"]]}]}}
        questions.append(q)
        answer = {"question_id": name, "question_text": task["prompt"]}
        for condition in ["with_docs", "without_docs"]:
            file = args.answers_dir / f"{name}-{condition}" / "verdicts.json"
            # Preserve raw answers: malformed/missing answers must never become repaired successes.
            answer[condition] = {"answer": file.read_text()} if file.is_file() else None
        answers.append(answer)
        variants = []
        for field, choices in task["fields"].items():
            changed = dict(task["expected"])
            changed[field] = next(v for v in choices if v != changed[field])
            variants.append((field, json.dumps(changed)))
        variants.extend([("empty", ""), ("malformed", "{"), ("missing_field", json.dumps(
            {k: v for k, v in task["expected"].items() if k != next(iter(task["expected"]))}))])
        for label, bad in variants:
            cid = f"{name}-{label}"
            control_questions.append({**q, "id": cid})
            controls.append({"question_id": cid, "question_text": task["prompt"],
                             "with_docs": {"answer": json.dumps(task["expected"], indent=2)},
                             "without_docs": {"answer": bad}})
    for name, rows in [("questions", questions), ("control-questions", control_questions)]:
        dump(out / f"{name}.json", {"schema_version": "questions.v2", "questions": rows})
    for name, rows in [("answers", answers), ("control-answers", controls)]:
        dump(out / f"{name}.json", {"schema_version": "answers.v1", "model": None, "provider": None,
                                   "answers": rows, "total_questions": len(rows)})
    runs = []

    def run(label, flags):
        command = [args.python, str(project / "cli.py"), *map(str, flags)]
        start = time.monotonic()
        proc = subprocess.run(command, cwd=project, capture_output=True, text=True, timeout=180)
        (out / f"{label}.stdout").write_text(proc.stdout)
        (out / f"{label}.stderr").write_text(proc.stderr)
        runs.append({"label": label, "command": command, "exit_code": proc.returncode,
                     "seconds": round(time.monotonic() - start, 4)})
        dump(out / "commands.json", runs)
        if proc.returncode:
            raise RuntimeError(f"{label} exited {proc.returncode}; see captured output")

    run("catalog", ["catalog", "check", "--root", REPO, "--kind", "skills", "--strict", "--format", "json"])
    run("routing", ["novelty", "routing", "--all-vs-all", "--catalog", REPO / "skills",
                    "--queries-by-skill", HERE / "routing-queries.json", "--out", out / "routing.json"])
    for name, target in [("skills", REPO), ("dokimi", args.dokimi_root.resolve())]:
        run(f"inspect-{name}", ["repo", "inspect", target, "--out", out / f"repo-{name}.json"])
    for prefix in ["", "control-"]:
        run(prefix + "score", ["eval", "score", "reference", "--answers", out / f"{prefix}answers.json",
                               "--questions", out / f"{prefix}questions.json", "--no-judge",
                               "-o", out / f"{prefix}score.json"])
    control = json.loads((out / "control-score.json").read_text())["run_metadata"]["summary"]
    if control["with_docs"]["n"] != len(controls) or control["with_docs"]["pass_rate"] != 1.0:
        raise RuntimeError("healthy grading controls did not all pass")
    bad = control["without_docs"]
    if bad["n"] + bad["errors"] != len(controls) or bad["pass_rate"] != 0.0:
        raise RuntimeError("corrupted grading controls were accepted or lost")
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=args.dokimi_root, text=True).strip()
    dump(out / "provenance.json", {"dokimi_commit": revision, "agent_runner": "external; see experiment record",
        "model_id": None, "token_usage": None, "repetitions_per_task_arm": 1,
        "grading_unit": "whole task verdict object; fields are correlated, not independent samples",
        "scope": "structured verdict correctness only; free-text report quality requires separate review"})
    print(f"Dokimi checks and scoring complete: {out}")


if __name__ == "__main__":
    main()
