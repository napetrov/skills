import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import * as core from "../tools/contracts/contract-core.js";
import { syncContractAssets } from "../tools/sync-contract-assets.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PERF_CHECK = path.join(ROOT, "skills", "performance-contracts", "scripts", "perf-check.js");
const OUTCOME_CHECK = path.join(ROOT, "skills", "verify-user-outcomes", "scripts", "outcome-check.js");
const PY_FIXTURE = path.join(ROOT, "fixtures", "python-perf-target");
const NODE_FIXTURE = path.join(ROOT, "fixtures", "node-outcome-target");

const hasPython = spawnSync("python3", ["--version"]).status === 0;
const hasGit = spawnSync("git", ["--version"]).status === 0;
const skipPython = hasPython ? false : "python3 not available on this runner";
const skipGit = hasGit ? false : "git not available on this runner";

function tmpCopy(source, name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  fs.cpSync(source, dir, { recursive: true });
  return dir;
}

function gitInit(dir) {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "fixture",
    GIT_AUTHOR_EMAIL: "fixture@example.invalid",
    GIT_COMMITTER_NAME: "fixture",
    GIT_COMMITTER_EMAIL: "fixture@example.invalid",
  };
  spawnSync("git", ["init", "-q"], { cwd: dir });
  spawnSync("git", ["add", "-A"], { cwd: dir });
  spawnSync("git", ["commit", "-qm", "base"], { cwd: dir, env });
}

// Subprocesses never inherit GITHUB_BASE_REF: CI sets it on pull_request runs, and
// selection would then depend on the runner rather than on the fixture under test.
function run(script, args, cwd) {
  const env = { ...process.env };
  delete env.GITHUB_BASE_REF;
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8", env });
}

function envelopeFrom(result) {
  const summary = JSON.parse(result.stdout);
  return JSON.parse(fs.readFileSync(summary.result, "utf8"));
}

function replaceOnce(text, before, after) {
  assert.equal(text.split(before).length - 1, 1, "mutation anchor must match exactly once");
  return text.replace(before, () => after);
}

// Mutants are applied only to disposable copies. Each mutation must match exactly once.
const QUADRATIC_MATCHER = {
  before: [
    "    index = {}",
    "    for name, key in new:",
    "        index.setdefault(key, name)",
    "    pairs = []",
    "    for name, key in old:",
    '        counters["candidate_visits"] += 1',
    "        match = index.get(key)",
    "        if match is not None:",
    "            pairs.append((name, match))",
    "",
  ].join("\n"),
  after: [
    "    pairs = []",
    "    for name, key in old:",
    "        for other_name, other_key in new:",
    '            counters["candidate_visits"] += 1',
    "            if key == other_key:",
    "                pairs.append((name, other_name))",
    "                break",
    "",
  ].join("\n"),
};

const DROPPED_OUTPUT_MATCHER = {
  before: "            pairs.append((name, match))\n",
  after: "            if int(name.split('_')[1]) % 20 != 0:\n                pairs.append((name, match))\n",
};

const HANGING_MATCHER = {
  before: "    if counters is None:\n",
  after: "    import time\n    time.sleep(600)\n    if counters is None:\n",
};

function mutateMatcher(dir, mutation) {
  const file = path.join(dir, "src", "matcher.py");
  fs.writeFileSync(file, replaceOnce(fs.readFileSync(file, "utf8"), mutation.before, mutation.after));
}

function mutateFile(dir, rel, before, after) {
  const file = path.join(dir, rel);
  fs.writeFileSync(file, replaceOnce(fs.readFileSync(file, "utf8"), before, after));
}

function snapshot(dir) {
  const files = {};
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else files[path.relative(dir, full)] = fs.readFileSync(full, "utf8");
    }
  };
  walk(dir);
  return files;
}

// ---- shared runtime -------------------------------------------------------

test("aggregate precedence is error, fail, inconclusive, pass", () => {
  assert.equal(core.aggregateVerdict(["pass", "fail"]), "fail");
  assert.equal(core.aggregateVerdict(["error", "fail"]), "error");
  assert.equal(core.aggregateVerdict(["pass", "inconclusive"]), "inconclusive");
  assert.equal(core.aggregateVerdict(["pass", "not_applicable"]), "pass");
  assert.equal(core.aggregateVerdict(["not_applicable"]), "not_applicable");
  assert.equal(core.aggregateVerdict([]), "inconclusive");
});

test("terminal results must cover each selected contract exactly once", () => {
  const errors = core.validateTerminalResults(["A", "B"], [
    { contract_id: "A" },
    { contract_id: "A" },
    { contract_id: "C" },
  ]);
  assert.ok(errors.some((error) => error.includes("duplicate terminal result for A")));
  assert.ok(errors.some((error) => error.includes("unexpected contract result C")));
  assert.ok(errors.some((error) => error.includes("missing terminal result for B")));
});

test("unsupported schema major versions are rejected", () => {
  assert.throws(() => core.assertSupportedVersion("2.0"), /unsupported schema_version 2\.0/);
  assert.throws(() => core.assertSupportedVersion("one"), /invalid schema_version/);
});

test("truncated result files are execution errors", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contracts-truncated-"));
  const file = path.join(dir, "result.json");
  fs.writeFileSync(file, '{"schema_version": "1.0", "observations": [');
  assert.throws(() => core.readJson(file), /invalid or truncated JSON/);
});

test("artifact paths must stay under their run root", () => {
  const root = path.resolve("/tmp/contract-root");
  assert.throws(() => core.resolveUnder(root, "../escape"), /must be relative/);
  assert.throws(() => core.resolveUnder(root, "/etc/passwd"), /must be relative/);
  assert.equal(core.resolveUnder(root, "run-1"), path.join(root, "run-1"));
});

test("commands run as argument arrays and never through a shell", () => {
  const run = core.runArgv(
    ["node", "-e", "process.stdout.write(process.argv[1])", "a; echo injected"],
    { cwd: ROOT, timeoutMs: 20_000 },
  );
  assert.equal(run.status, 0);
  assert.equal(run.stdout, "a; echo injected");
});

test("glob selection handles double-star paths", () => {
  assert.equal(core.matchesAny("src/a/b.py", ["src/**"]), true);
  assert.equal(core.matchesAny("tests/x.py", ["src/**"]), false);
  assert.equal(core.matchesAny("src/matcher.py", ["src/*.py"]), true);
});

test("logs redact secret assignments and stay bounded", () => {
  const clipped = core.clipLog("status ok api_key=abc123 done");
  assert.match(clipped, /\[REDACTED\]/);
  assert.doesNotMatch(clipped, /abc123/);
  assert.match(core.clipLog("x".repeat(70_000)), /\[truncated\]$/);
});

test("enabled contracts with unresolved markers are rejected", () => {
  assert.throws(
    () => core.scanEnabledContract({ id: "PERF-X-001", status: "enabled", operation: "TODO: fill in" }, "x.json"),
    /unresolved placeholders/,
  );
  assert.deepEqual(core.findPlaceholders({ note: "measure <measurement-a>" }), []);
});

test("unresolvable PR merge base falls back to the full enrolled scope", { skip: skipGit }, () => {
  const dir = tmpCopy(PY_FIXTURE, "perf-no-merge-base");
  gitInit(dir);
  const previous = process.env.GITHUB_BASE_REF;
  process.env.GITHUB_BASE_REF = "no-such-base";
  try {
    const changed = core.resolveChangedFiles(dir);
    assert.equal(changed.files, null);
    assert.equal(changed.method, "unavailable");
    assert.match(changed.limitations[0], /enrolled scope used/);
  } finally {
    if (previous === undefined) delete process.env.GITHUB_BASE_REF;
    else process.env.GITHUB_BASE_REF = previous;
  }
});

test("skill copies of shared runtime and schemas match their sources", () => {
  assert.deepEqual(syncContractAssets({ check: true }), []);
});

// ---- performance-contracts ------------------------------------------------

test("setup creates config, example contract and lock", { skip: false }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "perf-setup-"));
  const result = run(PERF_CHECK, ["setup", "--repo", dir], dir);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(dir, ".petrov", "contracts", "config.json")));
  assert.ok(fs.existsSync(path.join(dir, ".petrov", "contracts", "performance", "EXAMPLE-PERF-001.json")));
  const lock = core.readJson(path.join(dir, ".petrov", "contracts", "setup-lock.json"));
  assert.equal(lock.generator, "performance-contracts@0.1.0");
  assert.ok(Object.keys(lock.managed_files).length >= 2);
});

test("setup is idempotent on a second run", { skip: false }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "perf-setup-twice-"));
  run(PERF_CHECK, ["setup", "--repo", dir], dir);
  const before = snapshot(dir);
  const second = run(PERF_CHECK, ["setup", "--repo", dir], dir);
  assert.equal(second.status, 0, second.stderr);
  const report = JSON.parse(second.stdout);
  assert.deepEqual(report.created, []);
  assert.deepEqual(report.updated, []);
  assert.deepEqual(report.conflicts, []);
  assert.deepEqual(snapshot(dir), before);
});

test("setup reports a user edit as a conflict instead of overwriting it", { skip: false }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "perf-setup-edit-"));
  run(PERF_CHECK, ["setup", "--repo", dir], dir);
  const config = path.join(dir, ".petrov", "contracts", "config.json");
  fs.appendFileSync(config, "\n");
  const report = JSON.parse(run(PERF_CHECK, ["setup", "--repo", dir], dir).stdout);
  assert.deepEqual(report.conflicts, [".petrov/contracts/config.json"]);
  assert.ok(fs.readFileSync(config, "utf8").endsWith("\n\n"));
});

test("clean fixture passes, including the legitimate n log n sort", { skip: skipPython }, () => {
  const dir = tmpCopy(PY_FIXTURE, "perf-clean");
  const result = run(PERF_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.equal(envelope.verdict, "pass");
  assert.deepEqual(envelope.coverage.passed, ["PERF-MATCH-001"]);
  assert.equal(envelope.baseline.references["PERF-MATCH-001"], "fixture-reference-v1");
  assert.match(envelope.baseline.digests["PERF-MATCH-001"], /^sha256:[a-f0-9]{64}$/);
});

test("quadratic matcher fails the counter budget with unchanged output", { skip: skipPython }, () => {
  const dir = tmpCopy(PY_FIXTURE, "perf-quadratic");
  mutateMatcher(dir, QUADRATIC_MATCHER);
  const result = run(PERF_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  const violated = new Set(envelope.results[0].violations.map((violation) => violation.metric));
  assert.ok(violated.has("candidate_visits"));
  assert.ok(!violated.has("matched_pairs_equal_oracle"), "output must remain correct for this mutant");
});

test("dropped output fails the oracle", { skip: skipPython }, () => {
  const dir = tmpCopy(PY_FIXTURE, "perf-drop");
  mutateMatcher(dir, DROPPED_OUTPUT_MATCHER);
  const result = run(PERF_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.ok(envelope.findings.some((finding) => finding.category === "correctness_violation"));
  assert.ok(envelope.results[0].violations.some((violation) => violation.metric === "matched_pairs_equal_oracle"));
});

test("timeout is an error, never a partial fit", { skip: skipPython }, () => {
  const dir = tmpCopy(PY_FIXTURE, "perf-hang");
  mutateMatcher(dir, HANGING_MATCHER);
  const configFile = path.join(dir, ".petrov", "contracts", "config.json");
  const config = core.readJson(configFile);
  config.commands[0].timeout_seconds = 2;
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  const result = run(PERF_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.equal(envelope.results[0].verdict, "error");
  assert.match(envelope.results[0].reason, /timed out/);
  assert.equal(envelope.results[0].violations, undefined);
});

test("enabled contract with placeholders is rejected by validate", { skip: skipPython }, () => {
  const dir = tmpCopy(PY_FIXTURE, "perf-placeholder");
  const contract = path.join(dir, ".petrov", "contracts", "performance", "PERF-MATCH-001.json");
  mutateFile(dir, path.relative(dir, contract), '"operation": "match old and new symbol tables by canonical key"', '"operation": "TODO: describe"');
  const result = run(PERF_CHECK, ["validate", "--repo", dir], dir);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unresolved placeholders/);
});

test("unmapped change is reported as uncovered and inconclusive", { skip: skipGit || skipPython }, () => {
  const dir = tmpCopy(PY_FIXTURE, "perf-uncovered");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "notes"));
  fs.writeFileSync(path.join(dir, "notes", "todo.txt"), "not covered by any scope\n");
  const result = run(PERF_CHECK, ["check", "--repo", dir], dir);
  assert.equal(result.status, 3, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.ok(envelope.findings.some((finding) => finding.category === "uncovered_scope" && finding.locations[0] === "notes/todo.txt"));
  assert.equal(envelope.repository.diff_base.method, "working-tree-vs-head");
});

test("skill installs and runs alone from an isolated copy", { skip: skipPython }, () => {
  const install = fs.mkdtempSync(path.join(os.tmpdir(), "perf-isolated-"));
  fs.cpSync(path.join(ROOT, "skills", "performance-contracts"), install, { recursive: true });
  const dir = tmpCopy(PY_FIXTURE, "perf-isolated-repo");
  const result = run(path.join(install, "scripts", "perf-check.js"), ["validate", "--repo", dir], dir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"config":"ok"/);
});

// ---- verify-user-outcomes -------------------------------------------------

test("clean fixture passes all outcome evidence", () => {
  const dir = tmpCopy(NODE_FIXTURE, "outcome-clean");
  const result = run(OUTCOME_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.equal(envelope.verdict, "pass");
  assert.equal(envelope.observations[0].evidence.length, 4);
  assert.ok(envelope.observations[0].evidence.every((item) => item.verdict === "pass"));
});

test("disconnected consumer output fails the outcome", () => {
  const dir = tmpCopy(NODE_FIXTURE, "outcome-disconnected");
  mutateFile(dir, "src/cli.js", "for (const change of result.changes) {", "for (const change of []) {");
  const result = run(OUTCOME_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.equal(envelope.results[0].verdict, "fail");
  assert.ok(envelope.findings.some((finding) => finding.category === "behavior_mismatch"));
});

test("zero-test selector is an error", () => {
  const dir = tmpCopy(NODE_FIXTURE, "outcome-zero");
  mutateFile(dir, "tests/scan-compare.test.js", "[scan-comparison-happy]", "[scan-comparison-happy-renamed]");
  const result = run(OUTCOME_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.equal(envelope.results[0].verdict, "error");
  assert.match(envelope.observations[0].evidence.find((item) => item.evidence_id === "scan-comparison-happy").reason, /no test matches/);
});

test("evidence tests nested under describe blocks are matched", () => {
  const dir = tmpCopy(NODE_FIXTURE, "outcome-nested");
  fs.writeFileSync(
    path.join(dir, "tests", "scan-compare.test.js"),
    [
      'import { describe, test } from "node:test";',
      'describe("scan comparison", () => {',
      '  test("[scan-comparison-happy] nested happy path passes", () => {});',
      "});",
      "",
    ].join("\n"),
  );
  const result = run(OUTCOME_CHECK, ["check", "--repo", dir, "--all"], dir);
  const envelope = envelopeFrom(result);
  const happy = envelope.observations[0].evidence.find((item) => item.evidence_id === "scan-comparison-happy");
  assert.equal(happy.verdict, "pass", JSON.stringify(happy));
});

test("silent comparison of incomparable data fails the outcome", () => {
  const dir = tmpCopy(NODE_FIXTURE, "outcome-silent");
  mutateFile(dir, "src/compare.js", "if (left.projectId !== right.projectId || left.fingerprint !== right.fingerprint) {", "if (false) {");
  const result = run(OUTCOME_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.equal(envelope.observations[0].evidence.find((item) => item.evidence_id === "scan-comparison-incomparable").verdict, "fail");
});

test("stale implementation reference is reported as a stale mapping", () => {
  const dir = tmpCopy(NODE_FIXTURE, "outcome-stale");
  const contract = path.join(dir, ".petrov", "contracts", "outcomes", "OUTCOME-SCAN-COMPARE.json");
  mutateFile(dir, path.relative(dir, contract), '"src/compare.js", "src/cli.js"', '"src/compare.js", "src/cli.js", "src/renamed-away.js"');
  const result = run(OUTCOME_CHECK, ["check", "--repo", dir, "--all"], dir);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  const envelope = envelopeFrom(result);
  assert.ok(envelope.findings.some((finding) => finding.category === "stale_mapping"));
});
