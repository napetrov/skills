#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT, readCatalog } from "./lib.js";

const check = process.argv.includes("--check");
const catalog = readCatalog();
const json = `${JSON.stringify({ generated_by: "tools/generate-catalog.js", skills: catalog }, null, 2)}\n`;
const skillsJsonPath = path.join(ROOT, "skills.json");

const table = [
  "| Skill | Product | Problems | Maturity | Description |",
  "| --- | --- | --- | --- | --- |",
  ...catalog.map(
    (skill) =>
      `| [${skill.name}](${skill.path}) | ${skill.product} | ${skill.problems.join(", ")} | ${skill.maturity} | ${skill.description} |`,
  ),
].join("\n");

const readmePath = path.join(ROOT, "README.md");
const readme = fs.readFileSync(readmePath, "utf8");
const start = "<!-- skills-catalog-start -->";
const end = "<!-- skills-catalog-end -->";
const startIndex = readme.indexOf(start);
const endIndex = readme.indexOf(end);
if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  throw new Error("README catalog markers missing");
}
const newReadme = `${readme.slice(0, startIndex + start.length)}\n${table}\n${readme.slice(endIndex)}`;

if (check) {
  let ok = true;
  if (!fs.existsSync(skillsJsonPath) || fs.readFileSync(skillsJsonPath, "utf8") !== json) {
    console.error("skills.json is stale; run npm run build");
    ok = false;
  }
  if (readme !== newReadme) {
    console.error("README catalog is stale; run npm run build");
    ok = false;
  }
  process.exit(ok ? 0 : 1);
}

fs.writeFileSync(skillsJsonPath, json);
fs.writeFileSync(readmePath, newReadme);
console.log(`generated catalog for ${catalog.length} skill(s)`);
