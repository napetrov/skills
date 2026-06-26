#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { listSkillDirs, loadSkill } from "./lib.js";

const dangerousPatterns = [
  {
    id: "curl-pipe-shell",
    pattern: /\b(curl|wget)\b[\s\S]{0,160}\|\s*(sudo\s+)?(sh|bash)\b/i,
  },
  {
    id: "destructive-root-delete",
    pattern: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-rf|-fr)\s+(\/|\$HOME|~)(\s|$)/i,
  },
  {
    id: "prompt-injection",
    pattern: /\b(ignore|override|bypass)\b.{0,80}\b(previous|prior|system|developer)\b.{0,80}\binstructions?\b/i,
  },
  {
    id: "secret-exfiltration",
    pattern: /\b(exfiltrate|leak|steal|upload|send)\b.{0,80}\b(secret|token|credential|api[_-]?key|password)\b/i,
  },
  {
    id: "disable-security-controls",
    pattern: /\b(disable|turn off|bypass)\b.{0,80}\b(firewall|antivirus|security|selinux|app(?:armor)?|secret scanning)\b/i,
  },
];

const githubUrlPattern = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/.*)?$/;
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

function walkFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function textFiles(skillDir) {
  return walkFiles(skillDir).filter((file) =>
    [".md", ".txt", ".js", ".mjs", ".cjs", ".py", ".sh", ".json", ".yaml", ".yml"].includes(path.extname(file)),
  );
}

function checkDangerousPatterns(skill) {
  for (const file of textFiles(skill.dir)) {
    const relative = path.relative(skill.dir, file);
    const content = fs.readFileSync(file, "utf8");
    for (const { id, pattern } of dangerousPatterns) {
      if (pattern.test(content)) {
        fail(`${skill.name}: ${id} in ${relative}`);
      }
    }
  }
}

function checkExternalUrls(skill) {
  const fm = skill.frontmatter;
  for (const key of ["source_url", "implementation_url"]) {
    if (fm[key] !== undefined && !githubUrlPattern.test(fm[key])) {
      fail(`${skill.name}: ${key} must be an HTTPS GitHub URL`);
    }
  }
}

function collectReferencedLocalFiles(body) {
  const codeSpanRefs = [...body.matchAll(/`((?:references|scripts|assets)\/[^`]+)`/g)].map((match) => match[1]);
  const markdownRefs = [...body.matchAll(/!?\[[^\]]*]\(((?:references|scripts|assets)\/[^)\s]+)(?:\s+"[^"]*")?\)/g)].map(
    (match) => match[1],
  );

  return [...new Set([...codeSpanRefs, ...markdownRefs].map((ref) => ref.split(/[?#]/)[0]))].filter(Boolean);
}

function checkReferencedLocalFiles(skill) {
  const referenced = collectReferencedLocalFiles(skill.body);
  for (const rel of referenced) {
    const resolved = path.resolve(skill.dir, rel);
    if (!resolved.startsWith(`${path.resolve(skill.dir)}${path.sep}`) || !fs.existsSync(resolved)) {
      fail(`${skill.name}: referenced file does not exist or escapes skill directory: ${rel}`);
    }
  }

  const referencesDir = path.join(skill.dir, "references");
  if (fs.existsSync(referencesDir)) {
    const skillCardPath = path.join(skill.dir, "skill-card.md");
    const skillCardBody = fs.existsSync(skillCardPath) ? fs.readFileSync(skillCardPath, "utf8") : "";
    for (const file of walkFiles(referencesDir)) {
      const rel = path.relative(skill.dir, file);
      if (!skill.body.includes(rel) && !skillCardBody.includes(rel)) {
        fail(`${skill.name}: reference file is not mentioned by SKILL.md or skill-card.md: ${rel}`);
      }
    }
  }
}

for (const skillDir of listSkillDirs()) {
  const skill = loadSkill(skillDir);
  checkDangerousPatterns(skill);
  checkExternalUrls(skill);
  checkReferencedLocalFiles(skill);
}

if (failures > 0) {
  console.error(`${failures} skill security failure(s)`);
  process.exit(1);
}

console.log("skill security validation passed");
