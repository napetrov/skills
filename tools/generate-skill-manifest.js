#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ROOT, listSkillDirs, loadSkill } from "./lib.js";

const check = process.argv.includes("--check");
const manifestPath = path.join(ROOT, "skills.lock.json");
const schemaUrl = "https://github.com/napetrov/skills/schemas/skill-manifest.schema.json";

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function skillManifest(skillDir) {
  const skill = loadSkill(skillDir);
  const files = walkFiles(skillDir).map((file) => {
    const bytes = fs.readFileSync(file);
    return {
      path: path.relative(skillDir, file).split(path.sep).join("/"),
      sha256: sha256(bytes),
      size: bytes.length,
    };
  });
  const canonicalPayload = JSON.stringify({
    name: skill.name,
    version: skill.frontmatter.version,
    files,
  });
  return {
    name: skill.name,
    version: skill.frontmatter.version,
    path: path.relative(ROOT, skillDir).split(path.sep).join("/"),
    artifact_sha256: sha256(Buffer.from(canonicalPayload, "utf8")),
    files,
  };
}

const manifest = {
  schema: schemaUrl,
  generated_by: "tools/generate-skill-manifest.js",
  hash_algorithm: "sha256",
  skills: listSkillDirs().map(skillManifest),
};
const json = `${JSON.stringify(manifest, null, 2)}\n`;

if (check) {
  if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, "utf8") !== json) {
    console.error("skills.lock.json is stale; run npm run manifest");
    process.exit(1);
  }
  console.log("skill artifact manifest is current");
  process.exit(0);
}

fs.writeFileSync(manifestPath, json);
console.log(`generated artifact manifest for ${manifest.skills.length} skill(s)`);
