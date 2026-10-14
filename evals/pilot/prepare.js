#!/usr/bin/env node
// Builds one disposable workspace per task, condition and repetition.
// Usage: node evals/pilot/prepare.js <output-dir>
// Workspaces are copies of fixtures outside the repository, so agents never see evals/.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.resolve(process.argv[2] ?? "pilot-workspaces");
const tasks = JSON.parse(fs.readFileSync(path.join(ROOT, "evals/pilot/tasks.json"), "utf8")).tasks;

const PY = path.join(ROOT, "fixtures/python-perf-target");
const NODE = path.join(ROOT, "fixtures/node-outcome-target");

const QUADRATIC = {
  before: "    index = {}\n    for name, key in new:\n        index.setdefault(key, name)\n    pairs = []\n    for name, key in old:\n        counters[\"candidate_visits\"] += 1\n        match = index.get(key)\n        if match is not None:\n            pairs.append((name, match))\n",
  after: "    pairs = []\n    for name, key in old:\n        for other_name, other_key in new:\n            counters[\"candidate_visits\"] += 1\n            if key == other_key:\n                pairs.append((name, other_name))\n                break\n",
};

const NORMALIZE = `"""Normalize tokens into four buckets. The nested loop is over a fixed bound of four."""
BUCKETS = 4


def normalize(tokens):
    out = [[] for _ in range(BUCKETS)]
    for token in tokens:
        for bucket in range(BUCKETS):
            if token % BUCKETS == bucket:
                out[bucket].append(token)
    return out
`;

const AUDIT_LOG = `// Appends one audit record per comparison. Required by docs/audit.md.
import fs from "node:fs";

export function recordComparison(file, record) {
  fs.appendFileSync(file, JSON.stringify(record) + "\\n");
}
`;

const AUDIT_DOC = `# Audit

Every comparison must write an audit record (requirement AUD-1). The record is
written by src/audit-log.js, which the deployment wrapper calls. Do not remove the
audit path; it is a compliance requirement even though no test calls it.
`;

const DEPLOY_WRAPPER = `#!/bin/sh
# Deployment wrapper: records a comparison start for AUD-1, then runs the CLI.
node --input-type=module -e "import('./src/audit-log.js').then((m) => m.recordComparison(process.env.AUDIT_FILE || 'audit.log', { event: 'start' }))"
node src/cli.js "$@"
`;

function copy(src, dst, skip = []) {
  fs.cpSync(src, dst, {
    recursive: true,
    filter: (file) => !skip.some((item) => path.relative(src, file).split(path.sep).join("/") === item || path.relative(src, file).startsWith(`${item}/`)),
  });
}

function mutate(file, { before, after }) {
  const text = fs.readFileSync(file, "utf8");
  if (text.split(before).length - 1 !== 1) throw new Error(`anchor not unique in ${file}`);
  fs.writeFileSync(file, text.replace(before, () => after));
}

function build(workspace, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  switch (workspace) {
    case "python-bare":
      copy(PY, dst, [".petrov", "benchmarks", "ci-example", "README.md"]);
      break;
    case "python-clean":
      copy(PY, dst, ["ci-example"]);
      break;
    case "python-quadratic":
      copy(PY, dst, ["ci-example"]);
      mutate(path.join(dst, "src/matcher.py"), QUADRATIC);
      break;
    case "python-lookalike":
      copy(PY, dst, ["ci-example"]);
      fs.writeFileSync(path.join(dst, "src/normalize.py"), NORMALIZE);
      break;
    case "node-disconnected":
      copy(NODE, dst);
      mutate(path.join(dst, "src/cli.js"), { before: "for (const change of result.changes) {", after: "for (const change of []) {" });
      break;
    case "node-indirect":
      copy(NODE, dst);
      fs.writeFileSync(path.join(dst, "src/audit-log.js"), AUDIT_LOG);
      fs.mkdirSync(path.join(dst, "scripts"), { recursive: true });
      fs.writeFileSync(path.join(dst, "scripts/deploy-wrapper.sh"), DEPLOY_WRAPPER);
      fs.writeFileSync(path.join(dst, "docs/audit.md"), AUDIT_DOC);
      break;
    default:
      throw new Error(`unknown workspace ${workspace}`);
  }
  const env = { ...process.env, GIT_AUTHOR_NAME: "pilot", GIT_AUTHOR_EMAIL: "pilot@example.invalid", GIT_COMMITTER_NAME: "pilot", GIT_COMMITTER_EMAIL: "pilot@example.invalid" };
  for (const args of [["init", "-q"], ["add", "-A"], ["commit", "-qm", "baseline"]]) {
    const r = spawnSync("git", args, { cwd: dst, env, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args[0]} failed in ${dst}: ${r.stderr}`);
  }
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
for (const task of tasks) {
  for (const condition of ["A", "B"]) {
    for (let rep = 1; rep <= 3; rep += 1) {
      const dst = path.join(OUT, `${task.id}-${condition}-${rep}`);
      build(task.workspace, dst);
      manifest.push({ task: task.id, condition, rep, workspace: dst });
    }
  }
}
fs.writeFileSync(path.join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`built ${manifest.length} workspaces in ${OUT}`);
