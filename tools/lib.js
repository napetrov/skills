import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SKILLS_DIR = path.join(ROOT, "skills");
export const SKILL_MANIFEST_PATH = path.join(ROOT, "skills.lock.json");
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const VOCAB = {
  agents: new Set(["codex", "claude-code"]),
  maturity: new Set(["experimental", "validated", "verified", "deprecated"]),
  data_classification: new Set(["public", "internal", "confidential"]),
};

export function parseFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("missing frontmatter");
  }
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("unterminated frontmatter");
  }
  const raw = normalized.slice(4, end).trim();
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      throw new Error(`unsupported frontmatter line: ${line}`);
    }
    const [, key, value] = match;
    data[key] = parseScalar(value);
  }
  return data;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => item.trim().replace(/^["']|["']$/g, ""));
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

export function listSkillDirs() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(SKILLS_DIR, entry.name))
    .sort();
}

function comparePathNames(left, right) {
  if (left.name < right.name) return -1;
  if (left.name > right.name) return 1;
  return 0;
}

export function loadSkill(skillDir) {
  const skillPath = path.join(skillDir, "SKILL.md");
  const body = fs.readFileSync(skillPath, "utf8");
  return {
    dir: skillDir,
    name: path.basename(skillDir),
    path: skillPath,
    body,
    frontmatter: parseFrontmatter(body),
  };
}

export function readCatalog() {
  return listSkillDirs().map((dir) => {
    const skill = loadSkill(dir);
    const card = readSkillCard(dir);
    const fm = skill.frontmatter;
    return {
      name: fm.name,
      description: fm.description,
      version: fm.version,
      product: fm.product,
      product_family: fm.product_family,
      tags: fm.tags ?? [],
      problems: fm.problems ?? [],
      agents: fm.agents ?? [],
      maturity: fm.maturity,
      data_classification: fm.data_classification,
      source_url: fm.source_url,
      implementation_url: fm.implementation_url,
      source: card.source,
      catalog: card.catalog,
      verification_status: card.verification_status,
      path: path.relative(ROOT, skill.dir).split(path.sep).join("/"),
    };
  });
}

export function readSkillCard(skillDir) {
  return JSON.parse(fs.readFileSync(path.join(skillDir, "skill-card.json"), "utf8"));
}

export function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function fileMode(file) {
  const relativeToRoot = path.relative(ROOT, file).split(path.sep).join("/");
  if (!relativeToRoot.startsWith("..") && fs.existsSync(path.join(ROOT, ".git"))) {
    try {
      const stage = execFileSync("git", ["ls-files", "--stage", "--", relativeToRoot], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim();
      const mode = stage.split(/\s+/)[0];
      if (mode === "100755") return "0755";
      if (mode === "100644") return "0644";
    } catch {
      // Fall back to filesystem mode outside normal git checkouts.
    }
  }
  const stat = fs.statSync(file);
  return (stat.mode & 0o777).toString(8).padStart(4, "0");
}

export function walkSkillFiles(skillDir) {
  const entries = fs.readdirSync(skillDir, { withFileTypes: true }).sort(comparePathNames);
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(skillDir, entry.name);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkSkillFiles(fullPath));
    } else if (stat.isFile()) {
      files.push(fullPath);
    } else {
      const rel = path.relative(skillDir, fullPath).split(path.sep).join("/");
      throw new Error(`unsupported skill artifact entry: ${rel}`);
    }
  }
  return files;
}

export function buildSkillArtifact(skillDir) {
  const skill = loadSkill(skillDir);
  const files = walkSkillFiles(skillDir).map((file) => {
    const bytes = fs.readFileSync(file);
    return {
      path: path.relative(skillDir, file).split(path.sep).join("/"),
      mode: fileMode(file),
      sha256: sha256(bytes),
      size: bytes.length,
    };
  });
  return {
    name: skill.name,
    version: skill.frontmatter.version,
    path: path.relative(ROOT, skillDir).split(path.sep).join("/"),
    artifact_sha256: skillArtifactHash(skill.name, skill.frontmatter.version, files),
    files,
  };
}

function skillArtifactHash(name, version, files) {
  const canonicalPayload = JSON.stringify({ name, version, files });
  return sha256(Buffer.from(canonicalPayload, "utf8"));
}

export function readSkillManifest() {
  return JSON.parse(fs.readFileSync(SKILL_MANIFEST_PATH, "utf8"));
}

export function verifySkillArtifact(skillDir, options = {}) {
  const actual = buildSkillArtifact(skillDir);
  const manifest = readSkillManifest();
  const expectedName = options.expectedName ?? actual.name;
  const expected = manifest.skills?.find((skill) => skill.name === expectedName);
  if (!expected) {
    throw new Error(`skill is missing from skills.lock.json: ${expectedName}`);
  }
  if (actual.name !== expected.name) {
    throw new Error(`skill artifact name mismatch: expected ${expected.name}, got ${actual.name}`);
  }
  actual.path = expected.path;
  if (process.platform === "win32") {
    for (const actualFile of actual.files) {
      const expectedFile = expected.files.find((file) => file.path === actualFile.path);
      if (expectedFile) actualFile.mode = expectedFile.mode;
    }
    actual.artifact_sha256 = skillArtifactHash(actual.name, actual.version, actual.files);
  }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`skill artifact hash mismatch: ${expected.name}${artifactMismatchDetails(actual, expected)}`);
  }
  return actual;
}

function artifactMismatchDetails(actual, expected) {
  if (actual.version !== expected.version) return ` version expected ${expected.version}, got ${actual.version}`;
  if (actual.path !== expected.path) return ` path expected ${expected.path}, got ${actual.path}`;
  if (actual.artifact_sha256 !== expected.artifact_sha256) {
    return ` artifact_sha256 expected ${expected.artifact_sha256}, got ${actual.artifact_sha256}`;
  }
  if (actual.files.length !== expected.files.length) {
    return ` file count expected ${expected.files.length}, got ${actual.files.length}`;
  }
  for (const expectedFile of expected.files) {
    const actualFile = actual.files.find((file) => file.path === expectedFile.path);
    if (!actualFile) return ` missing file ${expectedFile.path}`;
    for (const key of ["mode", "sha256", "size"]) {
      if (actualFile[key] !== expectedFile[key]) {
        return ` ${expectedFile.path} ${key} expected ${expectedFile[key]}, got ${actualFile[key]}`;
      }
    }
  }
  const extraFile = actual.files.find((file) => !expected.files.some((expectedFile) => expectedFile.path === file.path));
  return extraFile ? ` unexpected file ${extraFile.path}` : "";
}

export function targetDir(target) {
  if (target === "codex") return path.join(os.homedir(), ".codex", "skills");
  if (target === "claude-code") return path.join(os.homedir(), ".claude", "skills");
  throw new Error(`unknown target: ${target}`);
}

export function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const stat = fs.lstatSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    } else {
      throw new Error(`unsupported skill artifact entry: ${entry.name}`);
    }
  }
}

export function findSkill(name) {
  if (!SKILL_NAME_PATTERN.test(String(name ?? ""))) {
    throw new Error(`invalid skill name: ${name}`);
  }
  const dir = path.join(SKILLS_DIR, name);
  if (!fs.existsSync(dir)) {
    throw new Error(`skill not found: ${name}`);
  }
  const skillsRoot = fs.realpathSync.native(SKILLS_DIR);
  const resolvedDir = fs.realpathSync.native(dir);
  if (!resolvedDir.startsWith(`${skillsRoot}${path.sep}`)) {
    throw new Error(`skill path escapes catalog: ${name}`);
  }
  const skill = loadSkill(resolvedDir);
  if (skill.frontmatter.name !== name) {
    throw new Error(`skill frontmatter name mismatch: ${name}`);
  }
  return skill;
}
