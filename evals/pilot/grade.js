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


// Subagents in this harness cannot write files (Write is refused), so the deliverable is the
// final assistant reply. It is read from the subagent transcript that quotes the workspace path.
const TASKS_DIR = process.env.PILOT_TASKS_DIR ?? "/tmp/claude-0/-home-user-skills/7f978ed2-04f5-562d-ad7a-f7c2c11ebd5b/tasks";
function finalReply(wsName) {
  if (!fs.existsSync(TASKS_DIR)) return null;
  // Plain substring match with an explicit boundary: no regular expression is built from the name.
  const needle = `pilot/${wsName}`;
  for (const file of fs.readdirSync(TASKS_DIR).filter((f) => f.endsWith(".output"))) {
    const text = fs.readFileSync(path.join(TASKS_DIR, file), "utf8");
    const head = text.slice(0, 20000);
    const at = head.indexOf(needle);
    if (at === -1 || /[0-9A-Za-z-]/.test(head[at + needle.length] ?? "")) continue;
    let last = null;
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      if (o.type !== "assistant" || !Array.isArray(o.message?.content)) continue;
      // Subagents hand back their report through a SubagentHandback tool call, not as plain text.
      const handback = o.message.content.find((c) => c.type === "tool_use" && c.name === "SubagentHandback");
      if (handback && typeof handback.input?.message === "string") {
        last = handback.input.message;
        continue;
      }
      const parts = o.message.content.filter((c) => c.type === "text").map((c) => c.text);
      if (parts.length) last = parts.join("\n");
    }
    if (last) return last;
  }
  return null;
}

function classify(report) {
  const t = report.toLowerCase();
  // Allows up to two words between "no" and "regression", e.g. "No counter regression".
  const noRegression = /\bno\b(?:\s+[a-z-]+){0,2}\s+regression|not a regression/.test(t);
  const regression = /\bregression\b/.test(t) && !noRegression;
  const doesNotMeet = /does not meet|do not meet|not meet/.test(t);
  const meets = /meets (its |the )?(performance )?expectations|meets expectations/.test(t) && !doesNotMeet;
  const broken = /\bbroken\b|does not work|not working|\bfails?\b|\bfailing\b/.test(t);
  const works = /\bworks\b/.test(t) && !/does not work/.test(t);
  return { regression, noRegression, meets, doesNotMeet, broken, works };
}

function gradeT1(ws) {
  const verify = path.join(ws, "VERIFY.md");
  let source = "file";
  let text = fs.existsSync(verify) ? fs.readFileSync(verify, "utf8") : null;
  if (text === null) {
    text = finalReply(path.basename(ws));
    source = "transcript";
    if (text === null) return { success: false, detail: "no VERIFY.md and no transcript" };
  }
  const command = source === "file"
    ? text.split("\n")[0].trim()
    : (text.match(/^(python3?|node|sh|bash|npm|pytest)\s.*$/m)?.[0] ?? "").trim();
  if (!command) return { success: false, detail: "empty first line" };
  const clean = path.join(ws, "..", `${path.basename(ws)}__clean`);
  const mutant = path.join(ws, "..", `${path.basename(ws)}__mutant`);
  for (const dst of [clean, mutant]) {
    fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(ws, dst, { recursive: true, filter: (f) => !f.includes(`${path.sep}.git${path.sep}`) && !f.endsWith(`${path.sep}.git`) });
  }
  const mpath = path.join(mutant, "src/matcher.py");
  const mtext = fs.readFileSync(mpath, "utf8");
  if (mtext.split(QUADRATIC.before).length - 1 === 1) fs.writeFileSync(mpath, mtext.replace(QUADRATIC.before, () => QUADRATIC.after));
  const cleanRun = spawnSync("sh", ["-c", command], { cwd: clean, encoding: "utf8", timeout: 300_000 });
  const mutantRun = spawnSync("sh", ["-c", command], { cwd: mutant, encoding: "utf8", timeout: 300_000 });
  const ok = cleanRun.status === 0 && mutantRun.status !== 0 && mutantRun.status !== null;
  const mutantNote = mutantRun.status === null ? ` mutant-killed-by=${mutantRun.signal ?? "error"}` : "";
  return { success: ok, false_pass: mutantRun.status === 0, false_positive: cleanRun.status !== 0, detail: `clean=${cleanRun.status} mutant=${mutantRun.status}${mutantNote} command=${command}` };
}

function gradeReport(ws, expect) {
  const file = path.join(ws, "REPORT.md");
  const fileText = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  const text = fileText ?? finalReply(path.basename(ws));
  if (text === null) return { success: false, detail: "no REPORT.md and no transcript" };
  const source = fileText === null ? "transcript" : "file";
  const c = classify(text);
  if (expect.kind === "verdict") {
    const evidenceOk = (expect.evidence ?? []).every((term) => text.includes(term));
    const status = expect.correct === "meets" ? c.meets : expect.correct === "regression" ? c.regression : expect.correct === "no regression" ? c.noRegression : expect.correct === "broken" ? c.broken : false;
    const added = (expect.must_not_add ?? []).flatMap((p) => {
      const r = spawnSync("git", ["status", "--porcelain", "--", p], { cwd: ws, encoding: "utf8" });
      return r.stdout.trim() ? [p] : [];
    });
    const falsePass = expect.correct === "regression" ? c.noRegression : expect.correct === "broken" ? c.works && !c.broken : false;
    const falsePositive = expect.correct === "no regression" ? c.regression : false;
    return { success: status && evidenceOk && added.length === 0, false_pass: falsePass, false_positive: falsePositive, detail: `source=${source} verdict-flags=${JSON.stringify(c)} evidence=${evidenceOk} added=${added.join(",") || "none"}` };
  }
  if (expect.kind === "retain") {
    const missing = expect.must_exist.filter((p) => !fs.existsSync(path.join(ws, p)));
    return { success: missing.length === 0, false_pass: false, false_positive: missing.length > 0, detail: `removed=${missing.join(",") || "none"}` };
  }
  return { success: false, detail: "unknown expectation kind" };
}

const results = [];
fs.mkdirSync(path.join(DIR, "replies"), { recursive: true });
for (const run of manifest) {
  const wsName = path.basename(run.workspace);
  const reply = finalReply(wsName);
  if (reply !== null) fs.writeFileSync(path.join(DIR, "replies", `${wsName}.txt`), reply);
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
