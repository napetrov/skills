// The pytest plugin of verify-user-outcomes, run against fixtures/python-outcome-target.
// Mutants are applied only to disposable copies.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN_DIR = path.join(ROOT, "skills", "verify-user-outcomes", "scripts");
const FIXTURE = path.join(ROOT, "fixtures", "python-outcome-target");
const PYTHON = process.platform === "win32" ? "python" : "python3";
const hasPytest = spawnSync(PYTHON, ["-m", "pytest", "--version"]).status === 0;
const skip = hasPytest ? false : "pytest not available on this runner";
const REQUIRED = [
  "schema_version", "run_id", "started_at", "finished_at", "skill", "mode", "scope_ids", "contract_ids",
  "repository", "baseline", "execution", "observations", "findings", "coverage", "results", "verdict", "limitations",
];

function copy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pytest-outcomes-"));
  fs.cpSync(FIXTURE, dir, { recursive: true });
  return dir;
}

function pytest(dir, args, extraEnv = {}) {
  const env = { ...process.env, PYTHONPATH: PLUGIN_DIR, PYTHONDONTWRITEBYTECODE: "1", ...extraEnv };
  delete env.CONTRACTS_DIR;
  Object.assign(env, extraEnv);
  const report = path.join(dir, "result.json");
  const run = spawnSync(
    PYTHON,
    ["-m", "pytest", "-q", "-p", "no:cacheprovider", "-p", "pytest_outcomes", `--outcomes-report=${report}`, ...args],
    { cwd: dir, encoding: "utf8", env },
  );
  const envelope = fs.existsSync(report) ? JSON.parse(fs.readFileSync(report, "utf8")) : null;
  return { ...run, envelope, output: run.stdout + run.stderr };
}

const DIR_ARGS = ["--outcomes", "--contracts-dir=tests/contracts"];

function edit(dir, file, before, after) {
  const target = path.join(dir, file);
  const text = fs.readFileSync(target, "utf8");
  assert.equal(text.split(before).length - 1, 1, "mutation anchor must match exactly once");
  fs.writeFileSync(target, text.replace(before, () => after));
}

test("clean fixture passes and writes a complete result envelope", { skip }, () => {
  const run = pytest(copy(), DIR_ARGS);
  assert.equal(run.status, 0, run.output);
  assert.equal(run.envelope.verdict, "pass");
  for (const key of REQUIRED) assert.ok(key in run.envelope, `envelope lacks ${key}`);
  assert.equal(run.envelope.skill, "verify-user-outcomes");
  assert.deepEqual(run.envelope.coverage.passed, ["OUTCOME-MONTHLY-TOTALS"]);
  assert.match(run.envelope.repository.content_digest, /^sha256:[a-f0-9]{64}$/);
  assert.match(run.output, /outcome OUTCOME-MONTHLY-TOTALS: pass/);
});

test("a broken promise fails its evidence id", { skip }, () => {
  const dir = copy();
  edit(dir, "src/ledger/totals.py", "return dict(sorted(totals.items()))", "return totals");
  const run = pytest(dir, DIR_ARGS);
  assert.equal(run.status, 1, run.output);
  assert.equal(run.envelope.verdict, "fail");
  const [observation] = run.envelope.observations;
  assert.deepEqual(observation.evidence.map((e) => [e.evidence_id, e.verdict]), [
    ["monthly-totals-happy", "fail"],
    ["monthly-totals-bad-amount", "pass"],
  ]);
  assert.equal(run.envelope.findings[0].category, "behavior_mismatch");
});

test("an evidence id that no test claims is an error, never a pass", { skip }, () => {
  const dir = copy();
  edit(dir, "tests/test_totals.py", '@pytest.mark.outcome("monthly-totals-bad-amount")\n', "");
  const run = pytest(dir, DIR_ARGS);
  assert.equal(run.status, 2, run.output);
  assert.equal(run.envelope.verdict, "error");
  assert.equal(run.envelope.findings[0].category, "promised_but_missing");
});

test("deselecting the evidence with -k makes it unclaimed, not passed", { skip }, () => {
  const run = pytest(copy(), [...DIR_ARGS, "-k", "bookkeeper"]);
  assert.equal(run.status, 2, run.output);
  assert.equal(run.envelope.verdict, "error");
});

test("evidence whose every test was skipped is inconclusive", { skip }, () => {
  const dir = copy();
  edit(dir, "tests/test_totals.py", "def test_unparsable_amount", '@pytest.mark.skip(reason="mutant")\ndef test_unparsable_amount');
  const run = pytest(dir, DIR_ARGS);
  assert.equal(run.status, 3, run.output);
  assert.equal(run.envelope.verdict, "inconclusive");
});

test("a failed fixture setup fails the evidence it guards", { skip }, () => {
  const dir = copy();
  fs.appendFileSync(path.join(dir, "tests", "conftest.py"), '\nimport pytest\n\n@pytest.fixture(autouse=True)\ndef broken():\n    raise RuntimeError("setup")\n');
  const run = pytest(dir, DIR_ARGS);
  assert.equal(run.status, 1, run.output);
  assert.equal(run.envelope.verdict, "fail");
});

test("a reference to an unknown heading is a stale mapping", { skip }, () => {
  const dir = copy();
  edit(dir, "docs/journeys.md", "## Monthly totals", "## Totals per month");
  const run = pytest(dir, DIR_ARGS);
  assert.equal(run.status, 2, run.output);
  assert.equal(run.envelope.findings[0].category, "stale_mapping");
});

test("an empty contracts dir is an error", { skip }, () => {
  const run = pytest(copy(), ["--outcomes"]);
  assert.equal(run.status, 2, run.output);
  assert.match(run.envelope.results[0].reason, /no enabled outcome under \.verification\/contracts\/outcomes/);
  assert.equal(run.envelope.findings[0].category, "not_configured");
});

test("the contracts dir comes from the ini file or CONTRACTS_DIR as well", { skip }, () => {
  const ini = copy();
  fs.appendFileSync(path.join(ini, "pyproject.toml"), 'outcomes = true\ncontracts_dir = "tests/contracts"\n');
  const fromIni = pytest(ini, []);
  assert.equal(fromIni.status, 0, fromIni.output);
  assert.equal(fromIni.envelope.verdict, "pass");
  const fromEnv = pytest(copy(), ["--outcomes"], { CONTRACTS_DIR: "tests/contracts" });
  assert.equal(fromEnv.status, 0, fromEnv.output);
  assert.equal(fromEnv.envelope.verdict, "pass");
});

test("a contracts dir outside the repository is a usage error", { skip }, () => {
  const run = pytest(copy(), ["--outcomes", "--contracts-dir=../elsewhere"]);
  assert.notEqual(run.status, 0, run.output);
  assert.match(run.output, /contracts dir must be a relative path inside the repository/);
  assert.doesNotMatch(run.output, /passed/, "a bad contracts dir must stop pytest before the suite runs");
  assert.equal(run.envelope, null);
});

test("without --outcomes the plugin only registers the marker", { skip }, () => {
  const dir = copy();
  const run = pytest(dir, ["-W", "error::pytest.PytestUnknownMarkWarning"]);
  assert.equal(run.status, 0, run.output);
  assert.equal(run.envelope, null);
  assert.ok(!fs.existsSync(path.join(dir, ".artifacts")));
});

test("a contracts dir that symlinks outside the repository is a usage error", { skip: skip || (process.platform === "win32" && "symlink creation needs privilege on Windows") }, () => {
  const dir = copy();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "pytest-outside-"));
  fs.symlinkSync(outside, path.join(dir, "qa"), "dir");
  const run = pytest(dir, ["--outcomes", "--contracts-dir=qa/contracts"]);
  assert.notEqual(run.status, 0, run.output);
  assert.match(run.output, /resolves outside the repository/);
  assert.deepEqual(fs.readdirSync(outside), []);
});
