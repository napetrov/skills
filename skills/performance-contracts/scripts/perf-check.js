#!/usr/bin/env node
// performance-contracts runner: validate, check, readiness and setup.
// Commands run from argument arrays without a shell. Verdicts come only from
// declared assertions over every declared workload size.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "./contract-core.js";

const GENERATOR = "performance-contracts@0.1.0";
const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_DIR = [".petrov", "contracts", "performance"];
const SHAPES = {
  linear: (n) => n,
  n_log_n: (n) => (n <= 1 ? 0 : n * Math.ceil(Math.log2(n))),
  quadratic: (n) => n * n,
};
const UNITS = new Set(["bool", "count", "ms", "bytes"]);
const CACHE_STATES = new Set(["cold", "warm", "invalidated", "none"]);
const PROFILES = new Set(["pr", "scheduled", "manual"]);
// Changes here invalidate every enabled contract because they change what is measured.
const INVALIDATING = [/^\.petrov\/contracts\//, /^benchmarks\/contracts\//, /^tools\/contracts\//];
const LOCKFILE = /(^|\/)(package-lock\.json|uv\.lock|poetry\.lock|requirements[^/]*\.txt)$/;

function fail(message) {
  throw new core.ContractError(message);
}

export function validatePerformanceContract(contract, file = "contract") {
  const errors = [];
  const need = (condition, message) => {
    if (!condition) errors.push(message);
  };
  need(contract.schema_version === "1.0", `${file}: schema_version must be 1.0`);
  need(core.ID_PATTERN.test(contract.id ?? ""), `${file}: invalid id`);
  need(["proposed", "enabled"].includes(contract.status), `${file}: status must be proposed or enabled`);
  need(typeof contract.scope === "string" && core.SCOPE_PATTERN.test(contract.scope), `${file}: invalid scope`);
  need(typeof contract.operation === "string" && contract.operation.length > 0, `${file}: operation required`);
  need(Array.isArray(contract.paths) && contract.paths.length > 0, `${file}: paths required`);
  need(typeof contract.command_id === "string", `${file}: command_id required`);
  need(typeof contract.oracle_id === "string", `${file}: oracle_id required`);
  need(PROFILES.has(contract.profile), `${file}: profile must be pr, scheduled or manual`);
  need(typeof contract.baseline_ref === "string", `${file}: baseline_ref required`);
  const workload = contract.workload ?? {};
  need(typeof workload.dimension === "string", `${file}: workload.dimension required`);
  need(
    Array.isArray(workload.sizes) && workload.sizes.length >= 2 && workload.sizes.every((n) => Number.isInteger(n) && n > 0),
    `${file}: workload.sizes needs at least two positive integers`,
  );
  need(CACHE_STATES.has(workload.cache_state), `${file}: invalid workload.cache_state`);
  need(Array.isArray(contract.assertions) && contract.assertions.length > 0, `${file}: assertions required`);
  for (const assertion of contract.assertions ?? []) {
    need(typeof assertion.metric === "string" && assertion.metric.length > 0, `${file}: assertion needs a metric`);
    if (assertion.operator === "eq") {
      need(assertion.value !== undefined, `${file}: eq assertion ${assertion.metric} needs value`);
    } else if (assertion.operator === "le") {
      need(assertion.coefficient > 0, `${file}: le assertion ${assertion.metric} needs positive coefficient`);
      need(SHAPES[assertion.shape] !== undefined, `${file}: unknown shape ${assertion.shape}`);
      need(assertion.dimension === workload.dimension, `${file}: ${assertion.metric} must use dimension ${workload.dimension}`);
    } else {
      errors.push(`${file}: unknown operator ${assertion.operator}`);
    }
  }
  if (errors.length > 0) fail(`invalid performance contract: ${errors.join("; ")}`);
  if (contract.status === "enabled") core.scanEnabledContract(contract, file);
  return contract;
}

export function loadContracts(repo) {
  const dir = path.join(repo, ...CONTRACT_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => validatePerformanceContract(core.readJson(path.join(dir, name)), name));
}

// Diff selection: contracts whose paths match a changed file, plus every enabled
// contract when a shared runner, contract or lockfile changed. Unknown base means all enabled.
export function selectContracts(contracts, config, changed, requested) {
  const enabled = contracts.filter((contract) => contract.status === "enabled");
  if (requested.length > 0) {
    const unknown = requested.filter((id) => !contracts.some((contract) => contract.id === id));
    if (unknown.length > 0) fail(`unknown contract id(s): ${unknown.join(", ")}`);
    return { selected: contracts.filter((contract) => requested.includes(contract.id)), uncovered: [], reason: "requested" };
  }
  if (changed.files === null) {
    return { selected: enabled, uncovered: [], reason: "full-enrolled-scope" };
  }
  const invalidated = changed.files.some(
    (file) => INVALIDATING.some((pattern) => pattern.test(file)) || LOCKFILE.test(file),
  );
  if (invalidated) return { selected: enabled, uncovered: [], reason: "shared-input-changed" };
  const selected = enabled.filter((contract) => changed.files.some((file) => core.matchesAny(file, contract.paths)));
  const scopePaths = config.scopes.flatMap((scope) => scope.paths);
  const uncovered = changed.files.filter(
    (file) => !core.matchesAny(file, scopePaths) && !file.startsWith(".petrov/") && !file.startsWith(".artifacts/"),
  );
  return { selected, uncovered, reason: "changed-paths" };
}

// Baseline references name immutable, versioned manifests; "latest" is rejected by design.
function resolveBaseline(repo, ref) {
  if (!/^[a-z0-9][a-z0-9.-]*-v\d+$/.test(ref ?? "")) {
    return { ok: false, reason: `baseline_ref ${ref} must be a versioned name such as fixture-reference-v1` };
  }
  const file = path.join(repo, ".petrov", "contracts", "baselines", `${ref}.json`);
  if (!fs.existsSync(file)) return { ok: false, reason: `baseline ${ref} not found` };
  return { ok: true, digest: `sha256:${core.sha256Text(fs.readFileSync(file, "utf8"))}` };
}

function substitute(argv, values) {
  return argv.map((item) => item.replace(/\{(output|artifact_dir)\}/g, (_, key) => values[key]));
}

function runCommand(repo, config, command, runDir) {
  const outputFile = path.join(runDir, command.output_file ?? `${command.id}.json`);
  const argv = substitute(command.argv, { output: outputFile, artifact_dir: runDir });
  const cwd = core.resolveUnder(repo, command.cwd ?? ".");
  const run = core.runArgv(argv, { cwd, timeoutMs: command.timeout_seconds * 1000 });
  return {
    command_id: command.id,
    argv: command.argv,
    status: run.status,
    signal: run.signal,
    timed_out: run.timed_out,
    missing_executable: run.missing_executable,
    error: run.error,
    duration_ms: run.duration_ms,
    stderr_excerpt: run.stderr,
    output_file: path.relative(runDir, outputFile).split(path.sep).join("/"),
  };
}

function evaluateContract(contract, execution, observationFile) {
  const id = contract.id;
  if (execution.timed_out) return { contract_id: id, verdict: "error", reason: "command timed out; no partial points are used" };
  if (execution.missing_executable) return { contract_id: id, verdict: "error", reason: `executable not found: ${contract.command_id}` };
  if (execution.status !== 0) {
    return { contract_id: id, verdict: "error", reason: `command exited with status ${execution.status}` };
  }
  let document;
  try {
    document = core.readJson(observationFile);
  } catch (error) {
    return { contract_id: id, verdict: "error", reason: error.message };
  }
  const observation = (document.observations ?? []).find((item) => item.contract_id === id);
  if (!observation) return { contract_id: id, verdict: "error", reason: "no observations for contract" };
  if (observation.dimension !== contract.workload.dimension) {
    return { contract_id: id, verdict: "error", reason: `observed dimension ${observation.dimension} is not ${contract.workload.dimension}` };
  }
  const points = new Map((observation.points ?? []).map((point) => [point.dimension_value, point]));
  const unexpected = [...points.keys()].filter((size) => !contract.workload.sizes.includes(size));
  if (unexpected.length > 0) return { contract_id: id, verdict: "error", reason: `unexpected sizes ${unexpected.join(", ")}` };

  const violations = [];
  for (const size of contract.workload.sizes) {
    const point = points.get(size);
    if (!point) return { contract_id: id, verdict: "error", reason: `missing point for size ${size}; partial sizes are not fitted` };
    for (const assertion of contract.assertions) {
      const metric = point.metrics?.[assertion.metric];
      if (!metric) return { contract_id: id, verdict: "error", reason: `missing metric ${assertion.metric} at size ${size}` };
      if (!UNITS.has(metric.unit)) return { contract_id: id, verdict: "error", reason: `invalid unit ${metric.unit} for ${assertion.metric}` };
      if (metric.advisory) continue;
      if (assertion.operator === "eq") {
        if (metric.value !== assertion.value) {
          violations.push({ size, metric: assertion.metric, expected: assertion.value, observed: metric.value });
        }
      } else {
        if (typeof metric.value !== "number") return { contract_id: id, verdict: "error", reason: `${assertion.metric} is not numeric` };
        const limit = assertion.coefficient * SHAPES[assertion.shape](size);
        if (metric.value > limit) violations.push({ size, metric: assertion.metric, expected: `<= ${limit}`, observed: metric.value });
      }
    }
  }
  if (violations.length > 0) return { contract_id: id, verdict: "fail", reason: "assertion violated", violations };
  return { contract_id: id, verdict: "pass", reason: "all declared sizes satisfy every assertion" };
}

function findingFor(contract, result, command) {
  const first = result.violations[0];
  const correctness = first.expected === true || typeof first.expected === "boolean";
  return {
    category: correctness ? "correctness_violation" : "budget_violation",
    severity: correctness ? "high" : "medium",
    evidence_label: "observed",
    contract_id: contract.id,
    locations: contract.paths,
    expected: `${first.metric} ${String(first.expected)} at ${contract.workload.dimension}=${first.size}`,
    observed: `${first.metric}=${String(first.observed)}`,
    violations: result.violations,
    reproduction: command.argv.join(" "),
  };
}

function check(repo, { base, requested, all, artifactRoot, skillPath }) {
  const startedAt = new Date();
  const config = core.loadConfig(repo);
  if (!config) {
    return unconfiguredEnvelope(repo, startedAt, "no .petrov/contracts/config.json; run setup for the requested scope");
  }
  const contracts = loadContracts(repo);
  const changed = core.resolveChangedFiles(repo, { base });
  const selection = all
    ? { selected: contracts.filter((contract) => contract.status === "enabled"), uncovered: [], reason: "full-requested" }
    : selectContracts(contracts, config, changed, requested);
  const { selected, uncovered, reason } = selection;
  const runId = core.newRunId(startedAt);
  const runDir = core.resolveUnder(artifactRoot, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const limitations = [...changed.limitations];
  const findings = [];
  for (const file of uncovered) {
    findings.push({ category: "uncovered_scope", severity: "info", evidence_label: "observed", locations: [file],
      expected: "changed path belongs to an enrolled scope", observed: "no enrolled scope matches this path" });
  }
  const executions = new Map();
  const baselineDigests = {};
  const results = [];
  if (selected.length === 0) {
    limitations.push(`no enabled contract matched changed paths (selection: ${reason})`);
  }
  // Zero selected contracts: unmapped changes are inconclusive; otherwise the declared rule excluded everything.
  const emptyVerdict = uncovered.length > 0 ? "inconclusive" : "not_applicable";
  for (const contract of selected) {
    if (contract.status !== "enabled") {
      results.push({ contract_id: contract.id, verdict: "not_applicable", reason: "contract is proposed, not enabled" });
      continue;
    }
    const baseline = resolveBaseline(repo, contract.baseline_ref);
    if (!baseline.ok) {
      results.push({ contract_id: contract.id, verdict: "error", reason: baseline.reason });
      continue;
    }
    baselineDigests[contract.id] = baseline.digest;
    if (!executions.has(contract.command_id)) {
      const command = core.findCommand(config, contract.command_id);
      executions.set(contract.command_id, { command, execution: runCommand(repo, config, command, runDir) });
    }
    const { command, execution } = executions.get(contract.command_id);
    const result = evaluateContract(contract, execution, path.join(runDir, execution.output_file));
    results.push(result);
    if (result.verdict === "fail") findings.push(findingFor(contract, result, command));
    if (result.verdict === "error") {
      findings.push({ category: "execution_error", severity: "high", evidence_label: "observed", contract_id: contract.id,
        locations: contract.paths, expected: "complete evidence", observed: result.reason, reproduction: command.argv.join(" ") });
    }
  }
  for (const contract of selected) {
    if (!results.some((item) => item.contract_id === contract.id)) {
      results.push({ contract_id: contract.id, verdict: "error", reason: "no terminal result produced" });
    }
  }

  const finishedAt = new Date();
  const verdict = results.length === 0 ? emptyVerdict : core.aggregateVerdict(results.map((result) => result.verdict));
  const ids = results.map((result) => result.contract_id);
  const envelope = {
    schema_version: "1.0",
    run_id: runId,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    skill: "performance-contracts",
    mode: "check",
    scope_ids: config.scopes.map((scope) => scope.id),
    contract_ids: selected.map((contract) => contract.id),
    repository: { ...core.repositoryIdentity(repo), diff_base: { method: changed.method, base: changed.base } },
    baseline: {
      references: Object.fromEntries(selected.map((contract) => [contract.id, contract.baseline_ref])),
      digests: baselineDigests,
      environment: { node: process.version, platform: process.platform },
      skill_path: path.relative(repo, skillPath) || ".",
    },
    execution: {
      commands: [...executions.values()].map((item) => item.execution),
      runner: { node: process.version, platform: process.platform },
    },
    observations: results.map((result) => ({ contract_id: result.contract_id, reason: result.reason, violations: result.violations ?? [] })),
    findings,
    coverage: {
      requested: requested.length > 0 ? requested : contracts.map((contract) => contract.id),
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
      "wall-time metrics are advisory and never gate in v1",
      "finite workload sizes do not prove asymptotic complexity",
    ],
  };
  const errors = core.validateEnvelope(envelope);
  if (errors.length > 0) {
    envelope.verdict = "error";
    envelope.limitations.push(`envelope self-check failed: ${errors.join("; ")}`);
  }
  const file = core.writeEnvelope(artifactRoot, runId, envelope);
  return { envelope, file };
}

function unconfiguredEnvelope(repo, startedAt, reason) {
  const runId = core.newRunId(startedAt);
  return {
    envelope: {
      schema_version: "1.0", run_id: runId, started_at: startedAt.toISOString(), finished_at: new Date().toISOString(),
      skill: "performance-contracts", mode: "check", scope_ids: [], contract_ids: [],
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
  const contracts = loadContracts(repo);
  const enabled = contracts.filter((contract) => contract.status === "enabled");
  if (enabled.length === 0) return { state: "discovered", reason: "config exists; no enabled contract" };
  const lastRun = latestRun(repo, config);
  if (!lastRun) return { state: "instrumented", reason: "enabled contracts exist; no recorded run" };
  return { state: "instrumented", reason: "last run recorded; validated, integrated and enforced need negative controls and CI evidence", last_run: lastRun };
}

function latestRun(repo, config) {
  const root = path.join(repo, config.artifact_dir);
  if (!fs.existsSync(root)) return null;
  const runs = fs.readdirSync(root).filter((name) => fs.existsSync(path.join(root, name, "result.json"))).sort();
  return runs.length ? { run_id: runs.at(-1), verdict: core.readJson(path.join(root, runs.at(-1), "result.json")).verdict } : null;
}

function setup(repo) {
  const templates = [
    { source: path.join(SKILL_DIR, "assets", "config.template.json"), target: ".petrov/contracts/config.json" },
    { source: path.join(SKILL_DIR, "assets", "performance-contract.template.json"), target: ".petrov/contracts/performance/EXAMPLE-PERF-001.json" },
  ];
  return core.scaffold(repo, { templates, generator: GENERATOR });
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { command, repo: process.cwd(), base: null, requested: [] };
  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (flag === "--repo") { options.repo = path.resolve(value); index += 1; }
    else if (flag === "--base") { options.base = value; index += 1; }
    else if (flag === "--contract") { options.requested.push(value); index += 1; }
    else if (flag === "--all") options.all = true;
    else fail(`unknown argument ${flag}`);
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repo = options.repo;
  if (options.command === "validate") {
    const config = core.loadConfig(repo);
    const contracts = loadContracts(repo);
    console.log(JSON.stringify({ config: config ? "ok" : "absent", contracts: contracts.map((item) => `${item.id}:${item.status}`) }));
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
    console.log(JSON.stringify({ verdict: envelope.verdict, result: file, contracts: envelope.results }, null, 2));
    return core.exitCodeFor(envelope.verdict);
  }
  fail("usage: perf-check.js validate|check|readiness|setup [--repo DIR] [--base REF] [--contract ID] [--all]");
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
