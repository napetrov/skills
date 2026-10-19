#!/usr/bin/env node
// verify-user-outcomes runner: validate, check, readiness and setup.
// Evidence is matched to tests by a bracketed id in the test name, for example
// "[scan-comparison-happy] ...". Zero matches are errors and skipped tests are inconclusive.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "./contract-core.js";

const GENERATOR = "verify-user-outcomes@0.1.0";
const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CRITICALITY = new Set(["high", "medium", "low"]);
// A change to contract state or the shared runtime selects every enabled outcome.
const invalidating = () => [new RegExp(`^${core.escapeRegExp(core.contractsDir())}/`), /^tools\/contracts\//];
const LOCKFILE = /(^|\/)(package-lock\.json|uv\.lock|poetry\.lock|requirements[^/]*\.txt)$/;

function fail(message) {
  throw new core.ContractError(message);
}

export function validateOutcomeContract(contract, file = "contract") {
  const errors = [];
  const need = (condition, message) => {
    if (!condition) errors.push(message);
  };
  need(contract.schema_version === "1.0", `${file}: schema_version must be 1.0`);
  need(core.ID_PATTERN.test(contract.id ?? ""), `${file}: invalid id`);
  need(["proposed", "enabled"].includes(contract.status), `${file}: status must be proposed or enabled`);
  need(typeof contract.actor === "string" && contract.actor.length > 0, `${file}: actor required`);
  need(typeof contract.entry_point === "string", `${file}: entry_point required`);
  need(typeof contract.result === "string", `${file}: result required`);
  need(Array.isArray(contract.acceptance) && contract.acceptance.length > 0, `${file}: acceptance required`);
  need(Array.isArray(contract.intent_refs), `${file}: intent_refs must be an array`);
  need(Array.isArray(contract.implementation_refs), `${file}: implementation_refs must be an array`);
  need(Array.isArray(contract.evidence_ids) && contract.evidence_ids.length > 0, `${file}: evidence_ids required`);
  need(CRITICALITY.has(contract.criticality), `${file}: criticality must be high, medium or low`);
  need(typeof contract.command_id === "string", `${file}: command_id required`);
  need(Array.isArray(contract.performance_contract_ids), `${file}: performance_contract_ids must be an array`);
  if (errors.length > 0) fail(`invalid outcome contract: ${errors.join("; ")}`);
  if (contract.status === "enabled") {
    core.scanEnabledContract(contract, file);
    need(contract.intent_refs.length > 0, `${file}: enabled outcome needs intent_refs`);
    need(contract.implementation_refs.length > 0, `${file}: enabled outcome needs implementation_refs`);
    if (errors.length > 0) fail(`invalid outcome contract: ${errors.join("; ")}`);
  }
  return contract;
}

export function loadOutcomes(repo) {
  const dir = core.resolveUnder(repo, core.contractsPath("outcomes"));
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => validateOutcomeContract(core.readJson(path.join(dir, name)), name));
}

// A stale reference is a finding, not a crash: enabled outcomes must point at real files.
export function missingReferences(repo, contract) {
  return [...contract.intent_refs, ...contract.implementation_refs]
    .map((ref) => ref.split("#")[0])
    .filter((file) => !fs.existsSync(core.resolveUnder(repo, file)));
}

export function parseTap(text) {
  const tests = [];
  for (const line of text.split(/\r?\n/)) {
    // Nested subtests (describe blocks) are indented by four spaces per level.
    const match = /^\s*(ok|not ok) \d+ - (.*)$/.exec(line);
    if (!match) continue;
    const [, state, rest] = match;
    tests.push({
      name: rest.replace(/\s+# SKIP.*$/i, ""),
      ok: state === "ok",
      skipped: /#\s*SKIP/i.test(rest),
    });
  }
  return tests;
}

export function selectOutcomes(outcomes, config, changed, requested) {
  const enabled = outcomes.filter((outcome) => outcome.status === "enabled");
  if (requested.length > 0) {
    const unknown = requested.filter((id) => !outcomes.some((outcome) => outcome.id === id));
    if (unknown.length > 0) fail(`unknown outcome id(s): ${unknown.join(", ")}`);
    return { selected: outcomes.filter((outcome) => requested.includes(outcome.id)), uncovered: [], reason: "requested" };
  }
  if (changed.files === null) return { selected: enabled, uncovered: [], reason: "full-enrolled-scope" };
  if (changed.files.some((file) => invalidating().some((pattern) => pattern.test(file)) || LOCKFILE.test(file))) {
    return { selected: enabled, uncovered: [], reason: "shared-input-changed" };
  }
  const scopePaths = config.scopes.flatMap((scope) => scope.paths);
  const selected = enabled.filter((outcome) =>
    changed.files.some((file) => [...outcome.intent_refs, ...outcome.implementation_refs].some((ref) => file === ref.split("#")[0] || file.startsWith(`${ref.split("#")[0]}/`))),
  );
  const uncovered = changed.files.filter(
    (file) => !core.matchesAny(file, scopePaths) && !file.startsWith(`${core.contractsDir()}/`) && !file.startsWith(".artifacts/"),
  );
  return { selected, uncovered, reason: "changed-paths" };
}

function runTests(repo, config, command, runDir) {
  const argv = command.argv;
  const cwd = core.resolveUnder(repo, command.cwd ?? ".");
  const run = core.runArgv(argv, { cwd, timeoutMs: command.timeout_seconds * 1000 });
  const tapFile = path.join(runDir, `${command.id}.tap`);
  fs.writeFileSync(tapFile, run.stdout);
  return { ...run, command_id: command.id, argv, tap_file: path.relative(runDir, tapFile).split(path.sep).join("/") };
}

function evaluateOutcome(outcome, execution, tests) {
  const id = outcome.id;
  if (execution.timed_out) return { contract_id: id, verdict: "error", reason: "test command timed out" };
  if (execution.missing_executable) return { contract_id: id, verdict: "error", reason: `executable not found for ${execution.command_id}` };
  const evidence = outcome.evidence_ids.map((evidenceId) => {
    const token = `[${evidenceId}]`;
    const matches = tests.filter((test) => test.name.includes(token));
    if (matches.length === 0) {
      return { evidence_id: evidenceId, verdict: "error", reason: `no test matches ${token}; a zero-test selector is never a pass` };
    }
    if (matches.some((test) => !test.ok && !test.skipped)) {
      return { evidence_id: evidenceId, verdict: "fail", reason: "matching test failed", tests: matches.map((test) => test.name) };
    }
    if (matches.every((test) => test.skipped)) {
      return { evidence_id: evidenceId, verdict: "inconclusive", reason: "every matching test was skipped" };
    }
    return { evidence_id: evidenceId, verdict: "pass", reason: "matching test passed", tests: matches.map((test) => test.name) };
  });
  const verdict = core.aggregateVerdict(evidence.map((item) => item.verdict));
  const anyFailureReported = tests.some((test) => !test.ok && !test.skipped);
  if (execution.status !== 0 && !anyFailureReported && verdict !== "error") {
    return { contract_id: id, verdict: "error", reason: `test runner exited ${execution.status} without a failing test`, evidence };
  }
  return { contract_id: id, verdict, reason: verdict === "pass" ? "all evidence passed" : "see evidence", evidence };
}

function check(repo, { base, requested, all, artifactRoot, skillPath }) {
  const startedAt = new Date();
  const config = core.loadConfig(repo);
  if (!config) return unconfigured(repo, startedAt, `no ${core.contractsPath("config.json")}; run setup for the requested scope`);
  const outcomes = loadOutcomes(repo);
  const changed = core.resolveChangedFiles(repo, { base });
  const selection = all
    ? { selected: outcomes.filter((outcome) => outcome.status === "enabled"), uncovered: [], reason: "full-requested" }
    : selectOutcomes(outcomes, config, changed, requested);
  const { selected, uncovered, reason } = selection;
  const runId = core.newRunId(startedAt);
  const runDir = core.resolveUnder(artifactRoot, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const findings = uncovered.map((file) => ({
    category: "uncovered_scope", severity: "info", evidence_label: "observed", locations: [file],
    expected: "changed path belongs to an enrolled scope", observed: "no enrolled scope matches this path",
  }));
  const limitations = [...changed.limitations];
  if (selected.length === 0) limitations.push(`no enabled outcome matched changed paths (selection: ${reason})`);

  const executions = new Map();
  const results = [];
  for (const outcome of selected) {
    if (outcome.status !== "enabled") {
      results.push({ contract_id: outcome.id, verdict: "not_applicable", reason: "outcome is proposed, not enabled" });
      continue;
    }
    const missing = missingReferences(repo, outcome);
    if (missing.length > 0) {
      findings.push({ category: "stale_mapping", severity: "medium", evidence_label: "observed", contract_id: outcome.id,
        locations: missing, expected: "referenced files exist", observed: `missing: ${missing.join(", ")}` });
      results.push({ contract_id: outcome.id, verdict: "error", reason: `stale references: ${missing.join(", ")}` });
      continue;
    }
    if (!executions.has(outcome.command_id)) {
      const command = core.findCommand(config, outcome.command_id);
      executions.set(outcome.command_id, { command, execution: runTests(repo, config, command, runDir) });
    }
    const { command, execution } = executions.get(outcome.command_id);
    const tests = fs.existsSync(path.join(runDir, execution.tap_file))
      ? parseTap(fs.readFileSync(path.join(runDir, execution.tap_file), "utf8"))
      : [];
    const result = evaluateOutcome(outcome, execution, tests);
    results.push(result);
    if (result.verdict === "fail" || result.verdict === "error") {
      findings.push({
        category: result.verdict === "fail" ? "behavior_mismatch" : "unverified_scope",
        severity: outcome.criticality === "high" ? "high" : "medium",
        evidence_label: "observed",
        contract_id: outcome.id,
        locations: outcome.implementation_refs,
        expected: outcome.acceptance.join("; "),
        observed: result.reason,
        reproduction: command.argv.join(" "),
      });
    }
  }
  for (const outcome of selected) {
    if (!results.some((item) => item.contract_id === outcome.id)) {
      results.push({ contract_id: outcome.id, verdict: "error", reason: "no terminal result produced" });
    }
  }

  const verdict = results.length === 0 ? "inconclusive" : core.aggregateVerdict(results.map((result) => result.verdict));
  const ids = results.map((result) => result.contract_id);
  const envelope = {
    schema_version: "1.0",
    run_id: runId,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    skill: "verify-user-outcomes",
    mode: "check",
    scope_ids: config.scopes.map((scope) => scope.id),
    contract_ids: selected.map((outcome) => outcome.id),
    repository: { ...core.repositoryIdentity(repo), diff_base: { method: changed.method, base: changed.base } },
    baseline: { references: {}, environment: { node: process.version, platform: process.platform }, skill_path: path.relative(repo, skillPath) || "." },
    execution: { commands: [...executions.values()].map((item) => item.execution), runner: { node: process.version, platform: process.platform } },
    observations: results.map((result) => ({ contract_id: result.contract_id, reason: result.reason, evidence: result.evidence ?? [] })),
    findings,
    coverage: {
      requested: requested.length > 0 ? requested : outcomes.map((outcome) => outcome.id),
      selected: ids,
      executed: results.filter((result) => result.verdict !== "not_applicable").map((result) => result.contract_id),
      passed: results.filter((result) => result.verdict === "pass").map((result) => result.contract_id),
      failed: results.filter((result) => result.verdict === "fail").map((result) => result.contract_id),
      unverified: results.filter((result) => ["error", "inconclusive"].includes(result.verdict)).map((result) => result.contract_id),
    },
    results,
    verdict,
    limitations: [
      ...limitations,
      "asserted evidence is limited to the fixture scenario; it does not show live provider or deployment behavior",
    ],
  };
  const errors = core.validateEnvelope(envelope);
  if (errors.length > 0) {
    envelope.verdict = "error";
    envelope.limitations.push(`envelope self-check failed: ${errors.join("; ")}`);
  }
  return { envelope, file: core.writeEnvelope(artifactRoot, runId, envelope) };
}

function unconfigured(repo, startedAt, reason) {
  const runId = core.newRunId(startedAt);
  return {
    envelope: {
      schema_version: "1.0", run_id: runId, started_at: startedAt.toISOString(), finished_at: new Date().toISOString(),
      skill: "verify-user-outcomes", mode: "check", scope_ids: [], contract_ids: [],
      repository: core.repositoryIdentity(repo), baseline: {}, execution: { commands: [] }, observations: [],
      findings: [{ category: "not_configured", severity: "info", evidence_label: "observed", expected: "contract configuration", observed: reason }],
      coverage: { requested: [], selected: [], executed: [], passed: [], failed: [], unverified: [] },
      results: [], verdict: "inconclusive", limitations: [reason], readiness: "unconfigured",
    },
    file: null,
  };
}

function readiness(repo) {
  const config = core.loadConfig(repo);
  if (!config) return { state: "unconfigured", reason: "no config" };
  const enabled = loadOutcomes(repo).filter((outcome) => outcome.status === "enabled");
  if (enabled.length === 0) return { state: "discovered", reason: "config exists; no enabled outcome" };
  return { state: "instrumented", reason: "enabled outcomes exist; validated, integrated and enforced need discrimination runs and CI evidence" };
}

function setup(repo) {
  const templates = [
    { source: path.join(SKILL_DIR, "assets", "config.template.json"), target: core.contractsPath("config.json") },
    { source: path.join(SKILL_DIR, "assets", "outcome-contract.template.json"), target: core.contractsPath("outcomes", "EXAMPLE-OUTCOME-001.json") },
  ];
  return core.scaffold(repo, { templates, generator: GENERATOR });
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { command, repo: process.cwd(), base: null, requested: [], contractsDir: process.env.CONTRACTS_DIR || null };
  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (flag === "--repo") { options.repo = path.resolve(value); index += 1; }
    else if (flag === "--base") { options.base = value; index += 1; }
    else if (flag === "--outcome") { options.requested.push(value); index += 1; }
    else if (flag === "--contracts-dir") {
      if (value === undefined || value.startsWith("--")) fail("--contracts-dir needs a directory");
      options.contractsDir = value;
      index += 1;
    }
    else if (flag === "--all") options.all = true;
    else fail(`unknown argument ${flag}`);
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repo = options.repo;
  core.useContractsDir(repo, options.contractsDir);
  if (options.command === "validate") {
    const config = core.loadConfig(repo);
    console.log(JSON.stringify({ config: config ? "ok" : "absent", outcomes: loadOutcomes(repo).map((item) => `${item.id}:${item.status}`) }));
    return 0;
  }
  if (options.command === "readiness") {
    console.log(JSON.stringify(readiness(repo), null, 2));
    return 0;
  }
  if (options.command === "setup") {
    console.log(JSON.stringify(setup(repo), null, 2));
    return 0;
  }
  if (options.command === "check") {
    const config = core.loadConfig(repo);
    const artifactRoot = path.join(repo, config?.artifact_dir ?? ".artifacts/contracts");
    const { envelope, file } = check(repo, {
      base: options.base,
      requested: options.requested,
      all: options.all,
      artifactRoot,
      skillPath: SKILL_DIR,
    });
    console.log(JSON.stringify({ verdict: envelope.verdict, result: file, outcomes: envelope.results }, null, 2));
    return core.exitCodeFor(envelope.verdict);
  }
  fail("usage: outcome-check.js validate|check|readiness|setup [--repo DIR] [--contracts-dir DIR] [--base REF] [--outcome ID] [--all]");
  return 2;
}

try {
  process.exitCode = main();
} catch (error) {
  if (error instanceof core.ContractError) {
    console.error(`error: ${error.message}`);
    process.exitCode = 2;
  } else {
    throw error;
  }
}
