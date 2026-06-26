import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
export const SKILLS_DIR = path.join(ROOT, "skills");

export const VOCAB = {
  agents: new Set(["codex", "claude-code"]),
  maturity: new Set(["experimental", "validated", "verified", "deprecated"]),
  data_classification: new Set(["public", "internal", "confidential"]),
};

export function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    throw new Error("missing frontmatter");
  }
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("unterminated frontmatter");
  }
  const raw = markdown.slice(4, end).trim();
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
      path: path.relative(ROOT, skill.dir),
    };
  });
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
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function findSkill(name) {
  const dir = path.join(SKILLS_DIR, name);
  if (!fs.existsSync(dir)) {
    throw new Error(`skill not found: ${name}`);
  }
  return loadSkill(dir);
}
