#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { listSkillDirs, loadSkill, VOCAB } from "./lib.js";

const requiredFrontmatter = [
  "name",
  "description",
  "version",
  "license",
  "product",
  "product_family",
  "tags",
  "problems",
  "agents",
  "maturity",
  "data_classification",
  "source_url",
  "implementation_url",
];

const requiredFiles = ["SKILL.md", "skill-card.md", "skill-card.json", "BENCHMARK.md"];
const forbiddenPatterns = [
  /curl\s+[^|]+\|\s*(sh|bash)/i,
  /rm\s+-rf\s+\//i,
  /exfiltrate/i,
  /disable\s+(firewall|security|antivirus)/i,
];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

for (const skillDir of listSkillDirs()) {
  const dirName = path.basename(skillDir);
  let skill;
  try {
    skill = loadSkill(skillDir);
  } catch (error) {
    fail(`${dirName}: ${error.message}`);
    continue;
  }

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(skillDir, file))) {
      fail(`${dirName}: missing ${file}`);
    }
  }

  const fm = skill.frontmatter;
  for (const key of requiredFrontmatter) {
    if (fm[key] === undefined || fm[key] === "") {
      fail(`${dirName}: missing frontmatter ${key}`);
    }
  }

  if (fm.name !== dirName) {
    fail(`${dirName}: frontmatter name must match directory`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dirName)) {
    fail(`${dirName}: skill name must be kebab-case`);
  }
  if (String(fm.description ?? "").length > 160) {
    fail(`${dirName}: description exceeds 160 characters`);
  }
  if (fm.license !== "Apache-2.0") {
    fail(`${dirName}: license must be Apache-2.0 for MVP`);
  }

  for (const field of ["tags", "problems", "agents"]) {
    if (!Array.isArray(fm[field]) || fm[field].length === 0) {
      fail(`${dirName}: ${field} must be a non-empty array`);
    }
  }
  for (const agent of fm.agents ?? []) {
    if (!VOCAB.agents.has(agent)) fail(`${dirName}: unknown agent ${agent}`);
  }
  if (!VOCAB.maturity.has(fm.maturity)) {
    fail(`${dirName}: unknown maturity ${fm.maturity}`);
  }
  if (!VOCAB.data_classification.has(fm.data_classification)) {
    fail(`${dirName}: unknown data_classification ${fm.data_classification}`);
  }

  if (!/## Safety And Limits/i.test(skill.body)) {
    fail(`${dirName}: missing '## Safety And Limits' section`);
  }
  if (fs.existsSync(path.join(skillDir, "evals"))) {
    fail(`${dirName}: evals/ is out of scope for MVP`);
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(skill.body)) {
      fail(`${dirName}: forbidden instruction pattern ${pattern}`);
    }
  }

  const scriptsDir = path.join(skillDir, "scripts");
  if (fs.existsSync(scriptsDir)) {
    for (const entry of fs.readdirSync(scriptsDir)) {
      const rel = `scripts/${entry}`;
      if (!skill.body.includes(rel)) {
        fail(`${dirName}: script ${rel} is not declared in SKILL.md`);
      }
    }
  }
}

if (failures > 0) {
  console.error(`${failures} validation failure(s)`);
  process.exit(1);
}

console.log("skills validation passed");
