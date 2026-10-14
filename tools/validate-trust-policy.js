#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.js";

const requiredDocs = [
  {
    file: "docs/trust-model.md",
    terms: [
      "skill-card.json",
      "skills.lock.json",
      "verification_status",
      "GitHub Artifact Attestations",
      "validate-release-context.js",
      "npm publish dist/*.tgz --provenance --access public",
      "intel-skills verify <skill>",
      "npx skills add napetrov/skills",
    ],
  },
  {
    file: ".github/pull_request_template.md",
    terms: ["Trust Checklist", "npm run build", "npm test", "npm run security", "npm run pack:check"],
  },
];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL trust policy: ${message}`);
}

for (const { file, terms } of requiredDocs) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    fail(`missing ${file}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, "utf8");
  for (const term of terms) {
    if (!content.includes(term)) fail(`${file} missing ${term}`);
  }
}

if (failures > 0) {
  console.error(`${failures} trust policy validation failure(s)`);
  process.exit(1);
}

console.log("trust policy validation passed");
