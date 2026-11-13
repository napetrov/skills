#!/usr/bin/env python3
"""Create isolated task workspaces. Agent answers are supplied separately."""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    out = args.output.resolve()
    if out.exists():
        parser.error("output must not exist; preserve prior experiments")
    out.mkdir(parents=True)
    shutil.copytree(REPO / "skills/assess-project-quality", out / "frozen-skill")
    tasks = json.loads((HERE / "grading-frozen.json").read_text())
    for name, fixture in [("flow", "node-outcome-target"), ("numeric", "python-perf-target")]:
        shutil.copytree(REPO / "fixtures" / fixture, out / name)
    target = out / "flow/src/cli.js"
    source = target.read_text()
    anchor = "for (const change of result.changes) {"
    if source.count(anchor) != 1:
        raise RuntimeError("flow mutation anchor changed; review fixture and oracle")
    target.write_text(source.replace(anchor, "for (const change of []) {"))
    (out / "numeric/src/normalize.py").write_text(
        "BUCKETS = 4\n\ndef normalize(tokens):\n    out = [[] for _ in range(BUCKETS)]\n"
        "    for token in tokens:\n        for bucket in range(BUCKETS):\n"
        "            if token % BUCKETS == bucket:\n                out[bucket].append(token)\n"
        "    return out\n")
    (out / "compat").mkdir()
    shutil.copy2(HERE / "compat-evidence.md", out / "compat/evidence.md")
    manifest = []
    for name, task in tasks.items():
        target = out / name
        (target / "TASK.md").write_text(task["prompt"] +
            "\nReturn report.md with evidence and a concrete integration plan; verdicts.json "
            "must contain exactly these keys, using one listed value per key:\n" +
            json.dumps(task["fields"], indent=2) +
            "\nReport missing evidence honestly. Do not inspect other experiment directories or grading files.\n")
        for cmd in (["git", "init", "-q"], ["git", "add", "."],
                    ["git", "-c", "user.name=experiment", "-c", "user.email=experiment@example.invalid",
                     "commit", "-qm", "Frozen task evidence"]):
            subprocess.run(cmd, cwd=target, check=True)
        for condition in ["without_docs", "with_docs"]:
            result = out / "outputs" / f"{name}-{condition}"
            skill = (f"Read {out / 'frozen-skill/SKILL.md'} and referenced guidance. "
                     if condition == "with_docs" else "Do not load any skills. ")
            manifest.append({"task": name, "condition": condition,
                "prompt": skill + f"Read only {target} and follow TASK.md. Do not inspect grading, "
                "other task directories or outputs. No network or source edits. "
                f"Write report.md and verdicts.json to {result}. Give concise evidence and a practical integration plan."})
    (out / "agent-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Prepared {len(manifest)} independent agent runs at {out}; not executed.")


if __name__ == "__main__":
    main()
