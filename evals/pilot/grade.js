#!/usr/bin/env node
// Deterministic grader for the agent pilot. Usage: node evals/pilot/grade.js <workspaces-dir>
// Reads expectations from tasks.json; agents never see this file.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = path.resolve(process.argv[2]);
const tasks = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, "evals/pilot/tasks.json"), "utf8")).tasks.map((t) => [t.id, t]));
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));

const QUADRATIC = {
  before: "    index = {}\n    for name, key in new:\n        index.setdefault(key, name)\n    pairs = []\n    for name, key in old:\n        counters[\"candidate_visits\"] += 1\n        match = index.get(key)\n        if match is not None:\n            pairs.append((name, match))\n",
  after: "    pairs = []\n    for name, key in old:\n        for other_name, other_key in new:\n            counters[\"candidate_visits\"] += 1\n            if key == other_key:\n                pairs.append((name, other_name))\n                break\n",
};

function classify(report) {
  const t = report.toLowerCase();
  const noRegression = /no (performance )?regression|not a regression|no regression/.test(t);
  const regression = /\bregression\b/.test(t) && !noRegression;
  const doesNotMeet = /does not meet|do not meet|not meet/.test(t);
  const meets = /meets (its |the )?(performance )?expectations|meets expectations/.test(t) && !doesNotMeet;
  const broken = /\bbroken\b|does not work|not working|\bfails?\b|\bfailing\b/.test(t);
  const works = /\bworks\b/.test(t) && !/does not work/.test(t);
  return { regression, noRegression, meets, doesNotMeet, broken, works };
}

function gradeT1(ws) {
  const verify = path.join(ws, "VERIFY.md");
  if (!fs.existsSync(verify)) return { success: false, detail: "no VERIFY.md" };
  const command = fs.readFileSync(verify, "utf8").split("\n")[0].trim();
  if (!command) return { success: false, detail: "empty first line" };
  const clean = path.join(ws, "..", `${path.basename(ws)}__clean`);
  const mutant = path.join(ws, "..", `${path.basename(ws)}__mutant`);
  for (const dst of [clean, mutant]) {
    fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(ws, dst, { recursive: true, filter: (f) => !f.includes(`${path.sep}.git${path.sep}`) && !f.endsWith(`${path.sep}.git`) });
  }
  const mpath = path.join(mutant, "src/matcher.py");
  const text = fs.readFileSync(mpath, "utf8");
  if (text.split(QUADRATIC.before).length - 1 === 1) fs.writeFileSync(mpath, text.replace(QUADRATIC.before, () => QUADRATIC.after));
  const cleanRun = spawnSync("sh", ["-c", command], { cwd: clean, encoding: "utf8", timeout: 300_000 });
  const mutantRun = spawnSync("sh", ["-c", command], { cwd: mutant, encoding: "utf8", timeout: 300_000 });
  const ok = cleanRun.status === 0 && mutantRun.status !== 0 && mutantRun.status !== null;
  return { success: ok, false_pass: mutantRun.status === 0, false_positive: cleanRun.status !== 0, detail: `clean=${cleanRun.status} mutant=${mutantRun.status} command=${command}` };
}

function gradeReport(ws, expect) {
  const file = path.join(ws, "REPORT.md");
  if (!fs.existsSync(file)) return { success: false, detail: "no REPORT.md" };
  const c = classify(fs.readFileSync(file, "utf8"));
  if (expect.kind === "verdict") {
    const evidenceOk = (expect.evidence ?? []).every((term) => fs.readFileSync(file, "utf8").includes(term));
    const status = expect.correct === "meets" ? c.meets : expect.correct === "regression" ? c.regression : expect.correct === "no regression" ? c.noRegression : expect.correct === "broken" ? c.broken : false;
    const added = (expect.must_not_add ?? []).flatMap((p) => {
      const r = spawnSync("git", ["status", "--porcelain", "--", p], { cwd: ws, encoding: "utf8" });
      return r.stdout.trim() ? [p] : [];
    });
    const falsePass = expect.correct === "regression" ? c.noRegression : expect.correct === "broken" ? c.works && !c.broken : false;
    const falsePositive = expect.correct === "no regression" ? c.regression : false;
    return { success: status && evidenceOk && added.length === 0, false_pass: falsePass, false_positive: falsePositive, detail: `verdict-flags=${JSON.stringify(c)} evidence=${evidenceOk} added=${added.join(",") || "none"}` };
  }
  if (expect.kind === "retain") {
    const missing = expect.must_exist.filter((p) => !fs.existsSync(path.join(ws, p)));
    return { success: missing.length === 0, false_pass: false, false_positive: missing.length > 0, detail: `removed=${missing.join(",") || "none"}` };
  }
  return { success: false, detail: "unknown expectation kind" };
}

const results = [];
for (const run of manifest) {
  const expect = tasks[run.task].expect;
  const ws = path.join(DIR, path.basename(run.workspace));
  const graded = expect.kind === "command-discriminates" ? gradeT1(ws) : gradeReport(ws, expect);
  results.push({ task: run.task, condition: run.condition, rep: run.rep, ...graded });
}
fs.writeFileSync(path.join(DIR, "grades.json"), `${JSON.stringify(results, null, 2)}\n`);
const summary = {};
for (const r of results) {
  const key = `${r.task} ${r.condition}`;
  summary[key] ??= { runs: 0, success: 0, false_pass: 0, false_positive: 0 };
  summary[key].runs += 1;
  summary[key].success += r.success ? 1 : 0;
  summary[key].false_pass += r.false_pass ? 1 : 0;
  summary[key].false_positive += r.false_positive ? 1 : 0;
}
console.log(JSON.stringify(summary, null, 2));
