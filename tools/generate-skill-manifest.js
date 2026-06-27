#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT, SKILL_MANIFEST_PATH, buildSkillArtifact, listSkillDirs } from "./lib.js";

const check = process.argv.includes("--check");
const schemaUrl = "https://github.com/napetrov/skills/schemas/skill-manifest.schema.json";

const manifest = {
  schema: schemaUrl,
  generated_by: "tools/generate-skill-manifest.js",
  hash_algorithm: "sha256",
  skills: listSkillDirs().map(buildSkillArtifact),
};
const json = `${JSON.stringify(manifest, null, 2)}\n`;

if (check) {
  if (!fs.existsSync(SKILL_MANIFEST_PATH) || fs.readFileSync(SKILL_MANIFEST_PATH, "utf8") !== json) {
    console.error("skills.lock.json is stale; run npm run manifest");
    process.exit(1);
  }
  console.log("skill artifact manifest is current");
  process.exit(0);
}

fs.writeFileSync(SKILL_MANIFEST_PATH, json);
console.log(`generated artifact manifest for ${manifest.skills.length} skill(s)`);
