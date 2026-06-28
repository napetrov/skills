#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT, listSkillDirs } from "./lib.js";

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL common CLI compatibility: ${message}`);
}

const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
if (!readme.includes("npx skills add napetrov/skills")) {
  fail("README.md must document common skills CLI install");
}

for (const skillDir of listSkillDirs()) {
  const skillName = path.basename(skillDir);
  const expectedRel = `skills/${skillName}/SKILL.md`;
  if (!fs.existsSync(path.join(ROOT, expectedRel))) {
    fail(`${skillName}: missing ${expectedRel}`);
  }
  if (!readme.includes(`--skill ${skillName}`)) {
    fail(`README.md missing common CLI example for ${skillName}`);
  }
}

if (failures > 0) {
  console.error(`${failures} common CLI compatibility failure(s)`);
  process.exit(1);
}

console.log("common CLI compatibility validation passed");
