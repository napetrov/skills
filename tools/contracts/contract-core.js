// Shared contract runtime for the contract skills.
// Source of truth: tools/contracts/contract-core.js. tools/sync-contract-assets.js
// copies this file into each skill's scripts/ directory; edit the source only.
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const SUPPORTED_MAJOR = 1;
export const VERDICTS = ["pass", "fail", "inconclusive", "error", "not_applicable"];
export const EXIT_CODES = { pass: 0, not_applicable: 0, fail: 1, error: 2, inconclusive: 3 };
export const ID_PATTERN = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;
export const SCOPE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const COMMAND_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOG_LIMIT_CHARS = 64 * 1024;
const SECRET_PATTERN = /((?:token|secret|password|passwd|api[_-]?key|credential)\s*[=:]\s*)\S+/gi;
// Explicit markers only: angle brackets are valid CLI syntax such as <measurement-a>.
const PLACEHOLDER_PATTERN = /\b(TODO|TBD|PLACEHOLDER|UNRESOLVED)\b/;

export class ContractError extends Error {}

// Contract state lives in one repository-relative directory. The default is
// .verification/contracts; --contracts-dir or CONTRACTS_DIR moves it, for example
// into tests/contracts in a repository that keeps no dot-directories.
export const DEFAULT_CONTRACTS_DIR = ".verification/contracts";
let contractsDirectory = DEFAULT_CONTRACTS_DIR;

export function setContractsDir(relative) {
  const value = String(relative ?? "").replace(/\\/g, "/").replace(/\/+$/, "");
  if (value === "" || value === "." || path.posix.isAbsolute(value) || value.split("/").includes("..")) {
    throw new ContractError(`contracts dir must be a relative path inside the repository: ${relative}`);
  }
  contractsDirectory = path.posix.normalize(value);
  return contractsDirectory;
}

// The contracts dir, as far as it exists, must not lead outside the repository
// through a symlink: setup writes config and lock files into it.
export function assertContractsDirInside(repo) {
  const root = fs.realpathSync(repo);
  let probe = path.resolve(repo, contractsDirectory);
  while (!fs.existsSync(probe) && probe !== path.dirname(probe)) probe = path.dirname(probe);
  const real = fs.realpathSync(probe);
  if (real !== root && !real.startsWith(`${root}${path.sep}`)) {
    throw new ContractError(`contracts dir ${contractsDirectory} resolves outside the repository`);
  }
}

// Set the contracts dir for this run (null keeps the default) and check where it leads.
export function useContractsDir(repo, relative) {
  if (relative !== null && relative !== undefined) setContractsDir(relative);
  if (fs.existsSync(repo)) assertContractsDirInside(repo);
  return contractsDirectory;
}

export function contractsDir() {
  return contractsDirectory;
}

// Repository-relative POSIX path under the contracts directory.
export function contractsPath(...parts) {
  return [contractsDirectory, ...parts].join("/");
}

export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function readJson(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    throw new ContractError(`cannot read ${file}: ${error.code ?? error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ContractError(`${path.basename(file)} is invalid or truncated JSON: ${error.message}`);
  }
}

export function assertSupportedVersion(version) {
  if (typeof version !== "string" || !/^\d+\.\d+$/.test(version)) {
    throw new ContractError(`invalid schema_version ${JSON.stringify(version)}`);
  }
  const major = Number(version.split(".")[0]);
  if (major !== SUPPORTED_MAJOR) {
    throw new ContractError(`unsupported schema_version ${version}; this tool reads major ${SUPPORTED_MAJOR}`);
  }
}

// Precedence from the evidence protocol: error > fail > inconclusive > pass.
// not_applicable only when every selected contract was legitimately excluded.
export function aggregateVerdict(verdicts) {
  if (verdicts.length === 0) return "inconclusive";
  for (const verdict of ["error", "fail", "inconclusive"]) {
    if (verdicts.includes(verdict)) return verdict;
  }
  if (verdicts.includes("pass")) return "pass";
  return "not_applicable";
}

export function clipLog(text) {
  const redacted = String(text ?? "").replace(SECRET_PATTERN, "$1[REDACTED]");
  if (redacted.length <= LOG_LIMIT_CHARS) return redacted;
  return `${redacted.slice(0, LOG_LIMIT_CHARS)}\n[truncated]`;
}

export function resolveUnder(root, relative) {
  if (typeof relative !== "string" || path.isAbsolute(relative) || relative.split(/[\\/]/).includes("..")) {
    throw new ContractError(`path must be relative and stay inside its root: ${relative}`);
  }
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new ContractError(`path escapes its root: ${relative}`);
  }
  return resolved;
}

export function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function findPlaceholders(value, where = "$") {
  if (typeof value === "string") return PLACEHOLDER_PATTERN.test(value) ? [where] : [];
  if (Array.isArray(value)) return value.flatMap((item, index) => findPlaceholders(item, `${where}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => findPlaceholders(item, `${where}.${key}`));
  }
  return [];
}

// Runs an argument array without a shell. Output is captured and clipped.
export function runArgv(argv, { cwd, timeoutMs }) {
  if (!Array.isArray(argv) || argv.length === 0 || argv.some((item) => typeof item !== "string")) {
    throw new ContractError("command argv must be a non-empty array of strings");
  }
  const started = Date.now();
  // A parent node --test sets NODE_TEST_CONTEXT, which switches a child runner away from TAP.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd,
    encoding: "utf8",
    env,
    timeout: timeoutMs,
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  return {
    status: result.status,
    signal: result.signal,
    timed_out: result.error?.code === "ETIMEDOUT",
    missing_executable: result.error?.code === "ENOENT",
    error: result.error && !["ETIMEDOUT"].includes(result.error.code) ? result.error.message : null,
    stdout: result.stdout ?? "",
    stderr: clipLog(result.stderr ?? ""),
    duration_ms: Date.now() - started,
  };
}

function git(repo, args) {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8", shell: false, maxBuffer: 64 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : null;
}

function splitLines(text) {
  return (text ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

// Diff base policy: explicit base, else verified PR merge base, else working tree vs HEAD
// (staged, unstaged and untracked). Unknown bases return files: null so callers run the full scope.
export function resolveChangedFiles(repo, { base } = {}) {
  if (git(repo, ["rev-parse", "--is-inside-work-tree"]) === null) {
    return { files: null, method: "unavailable", base: null, limitations: ["not a git work tree; enrolled scope used"] };
  }
  const untracked = splitLines(git(repo, ["ls-files", "--others", "--exclude-standard"]));
  const head = git(repo, ["rev-parse", "--verify", "--quiet", "HEAD^{commit}"]);

  let baseRef = null;
  let method = "working-tree-vs-head";
  if (base) {
    if (git(repo, ["rev-parse", "--verify", "--quiet", `${base}^{commit}`]) === null) {
      return { files: null, method: "unavailable", base, limitations: [`supplied diff base ${base} not found`] };
    }
    baseRef = base;
    method = "explicit-base";
  } else if (process.env.GITHUB_BASE_REF && head !== null) {
    // A shallow checkout has no origin/<base>; comparing against HEAD would select nothing.
    const mergeBase = git(repo, ["merge-base", "HEAD", `origin/${process.env.GITHUB_BASE_REF}`]);
    if (!mergeBase) {
      return {
        files: null,
        method: "unavailable",
        base: null,
        limitations: [`merge base with origin/${process.env.GITHUB_BASE_REF} not found; enrolled scope used`],
      };
    }
    baseRef = mergeBase.trim();
    method = "pr-merge-base";
  }

  if (baseRef === null && head === null) {
    return { files: null, method: "unavailable", base: null, limitations: ["repository has no commits; enrolled scope used"] };
  }
  const tracked = splitLines(git(repo, ["diff", "--name-only", baseRef ?? "HEAD"]));
  const files = [...new Set([...tracked, ...untracked])].sort();
  const limitations = method === "working-tree-vs-head" && head === null ? ["no HEAD commit; untracked files only"] : [];
  return { files, method, base: baseRef, limitations };
}

export function repositoryIdentity(repo) {
  const commit = git(repo, ["rev-parse", "--verify", "--quiet", "HEAD^{commit}"])?.trim() ?? null;
  const status = git(repo, ["status", "--porcelain"]);
  const dirty = status === null ? null : status.trim().length > 0;
  const hash = crypto.createHash("sha256");
  hash.update(git(repo, ["diff", "HEAD", "--binary"]) ?? "");
  for (const file of splitLines(git(repo, ["ls-files", "--others", "--exclude-standard"]))) {
    hash.update(file);
    try {
      hash.update(fs.readFileSync(path.join(repo, file)));
    } catch {
      hash.update("<unreadable>");
    }
  }
  return { commit, dirty, content_digest: `sha256:${hash.digest("hex")}` };
}

export function globToRegExp(glob) {
  let source = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*" && glob[index + 1] === "*") {
      source += ".*";
      index += 1;
      if (glob[index + 1] === "/") index += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else {
      source += char.replace(/[.+^${}()|[\]\\?]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

export function matchesAny(file, globs) {
  return globs.some((glob) => globToRegExp(glob).test(file));
}

export function loadConfig(repo) {
  const file = resolveUnder(repo, contractsPath("config.json"));
  if (!fs.existsSync(file)) return null;
  const config = readJson(file);
  validateConfig(config);
  return config;
}

export function validateConfig(config) {
  const errors = [];
  try {
    assertSupportedVersion(config.schema_version);
  } catch (error) {
    errors.push(error.message);
  }
  const commandIds = new Set();
  for (const command of Array.isArray(config.commands) ? config.commands : []) {
    if (!COMMAND_PATTERN.test(command.id ?? "")) errors.push(`invalid command id ${command.id}`);
    if (commandIds.has(command.id)) errors.push(`duplicate command id ${command.id}`);
    commandIds.add(command.id);
    if (!Array.isArray(command.argv) || command.argv.length === 0 || command.argv.some((item) => typeof item !== "string")) {
      errors.push(`command ${command.id} argv must be a non-empty string array`);
    }
    if (!(command.timeout_seconds > 0)) errors.push(`command ${command.id} needs a positive timeout_seconds`);
    if (command.cwd !== undefined && (path.isAbsolute(command.cwd) || command.cwd.split(/[\\/]/).includes(".."))) {
      errors.push(`command ${command.id} cwd must be relative`);
    }
  }
  if (!Array.isArray(config.commands)) errors.push("commands must be an array");
  if (!Array.isArray(config.scopes)) errors.push("scopes must be an array");
  for (const scope of Array.isArray(config.scopes) ? config.scopes : []) {
    if (!SCOPE_PATTERN.test(scope.id ?? "")) errors.push(`invalid scope id ${scope.id}`);
    if (!Array.isArray(scope.paths) || scope.paths.length === 0) errors.push(`scope ${scope.id} needs paths`);
  }
  if (typeof config.artifact_dir !== "string" || path.isAbsolute(config.artifact_dir)) {
    errors.push("artifact_dir must be a relative path");
  }
  if (errors.length > 0) throw new ContractError(`invalid contract config: ${errors.join("; ")}`);
  return config;
}

export function findCommand(config, id) {
  const command = config.commands.find((item) => item.id === id);
  if (!command) throw new ContractError(`contract references unknown command ${id}`);
  return command;
}

export function newRunId(now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return `${stamp}-${crypto.randomBytes(3).toString("hex")}`;
}

export function writeEnvelope(artifactRoot, runId, envelope) {
  const runDir = resolveUnder(artifactRoot, runId);
  fs.mkdirSync(runDir, { recursive: true });
  const file = path.join(runDir, "result.json");
  fs.writeFileSync(file, `${JSON.stringify(envelope, null, 2)}\n`);
  return file;
}

const ENVELOPE_REQUIRED = [
  "schema_version", "run_id", "started_at", "finished_at", "skill", "mode", "scope_ids", "contract_ids",
  "repository", "baseline", "execution", "observations", "findings", "coverage", "verdict", "limitations",
];

export function validateEnvelope(envelope) {
  const errors = [];
  for (const key of ENVELOPE_REQUIRED) {
    if (envelope[key] === undefined) errors.push(`missing field ${key}`);
  }
  try {
    assertSupportedVersion(envelope.schema_version);
  } catch (error) {
    errors.push(error.message);
  }
  if (!VERDICTS.includes(envelope.verdict)) errors.push(`unknown verdict ${envelope.verdict}`);
  const results = Array.isArray(envelope.results) ? envelope.results : [];
  const perContract = results.map((result) => result.contract_id);
  if (new Set(perContract).size !== perContract.length) errors.push("duplicate contract result");
  for (const result of results) {
    if (!VERDICTS.includes(result.verdict)) errors.push(`unknown verdict for ${result.contract_id}`);
  }
  if (Array.isArray(envelope.contract_ids) && Array.isArray(envelope.results)) {
    errors.push(...validateTerminalResults(envelope.contract_ids, results));
  }
  if (VERDICTS.includes(envelope.verdict) && results.length > 0) {
    const expected = aggregateVerdict(results.map((result) => result.verdict));
    if (expected !== envelope.verdict) errors.push(`verdict ${envelope.verdict} disagrees with contract results (${expected})`);
  }
  return errors;
}

// Adapters must emit exactly one terminal result per selected contract.
export function validateTerminalResults(selectedIds, results) {
  const errors = [];
  const seen = new Map();
  for (const result of results) {
    seen.set(result.contract_id, (seen.get(result.contract_id) ?? 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) errors.push(`duplicate terminal result for ${id}`);
    if (!selectedIds.includes(id)) errors.push(`unexpected contract result ${id}`);
  }
  for (const id of selectedIds) {
    if (!seen.has(id)) errors.push(`missing terminal result for ${id}`);
  }
  return errors;
}

export function exitCodeFor(verdict) {
  return EXIT_CODES[verdict] ?? EXIT_CODES.error;
}

export function scanEnabledContract(contract, where) {
  const placeholders = findPlaceholders(contract, where);
  if (contract.status === "enabled" && placeholders.length > 0) {
    throw new ContractError(`enabled contract ${contract.id} has unresolved placeholders at ${placeholders.join(", ")}`);
  }
  return placeholders;
}

// Setup scaffolding. setup-lock.json records the digest setup last applied to each file.
//   absent                         -> created (optional templates: see below)
//   identical to template          -> unchanged
//   still as setup applied it      -> updated when the template changed
//   edited, template unchanged     -> user_owned: kept as the user left it, not a conflict
//   edited, template changed       -> conflict: needs a reviewed migration, never overwritten
//   never applied by setup         -> conflict: setup does not own the file
// Optional templates are created only when createIf() holds, and are never recreated
// after the user removed a file that setup had written.
export function scaffold(repo, { templates, generator }) {
  const lockFile = resolveUnder(repo, contractsPath("setup-lock.json"));
  const previous = fs.existsSync(lockFile) ? readJson(lockFile) : { managed_files: {} };
  const managed = { ...(previous.managed_files ?? {}) };
  const report = { created: [], updated: [], unchanged: [], user_owned: [], conflicts: [], skipped: [] };

  for (const template of templates) {
    const content = fs.readFileSync(template.source, "utf8");
    const target = resolveUnder(repo, template.target);
    const digest = sha256Text(content);
    const recorded = managed[template.target];
    const onDisk = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
    if (onDisk === content) {
      report.unchanged.push(template.target);
      // Identical content does not make setup the owner: only a file it already manages is re-recorded.
      if (recorded !== undefined) managed[template.target] = digest;
    } else if (onDisk === null) {
      if (template.optional && recorded !== undefined) {
        report.skipped.push({ target: template.target, reason: "removed_by_user" });
        continue;
      }
      if (template.optional && !template.optional.createIf()) {
        report.skipped.push({ target: template.target, reason: template.optional.reason });
        continue;
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
      report.created.push(template.target);
      managed[template.target] = digest;
    } else if (recorded === undefined) {
      report.conflicts.push(template.target);
    } else if (sha256Text(onDisk) === recorded) {
      fs.writeFileSync(target, content);
      report.updated.push(template.target);
      managed[template.target] = digest;
    } else if (recorded === digest) {
      report.user_owned.push(template.target);
    } else {
      report.conflicts.push(template.target);
    }
  }

  const lock = {
    schema_version: "1.0",
    generator,
    template_digest: `sha256:${sha256Text(JSON.stringify(Object.entries(managed).sort()))}`,
    managed_files: Object.fromEntries(Object.entries(managed).sort()),
  };
  const lockText = `${JSON.stringify(lock, null, 2)}\n`;
  if (!fs.existsSync(lockFile) || fs.readFileSync(lockFile, "utf8") !== lockText) {
    fs.mkdirSync(path.dirname(lockFile), { recursive: true });
    fs.writeFileSync(lockFile, lockText);
  }
  return report;
}
