#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.js";

const workflowPath = path.join(ROOT, ".github", "workflows", "release.yml");
const workflow = fs.readFileSync(workflowPath, "utf8");
const lines = workflow.split(/\r?\n/);
const requiredPatterns = [
  {
    id: "release-trigger",
    pattern: /on:\s*\n\s+release:\s*\n\s+types:\s*\[\s*published\s*]/,
  },
  {
    id: "clean-install",
    pattern: /run:\s+npm ci\b/,
  },
  {
    id: "test-before-publish",
    pattern: /run:\s+npm test\b/,
  },
  {
    id: "pack-check-before-publish",
    pattern: /run:\s+npm run pack:check\b/,
  },
  {
    id: "npm-provenance-publish",
    pattern: /run:\s+npm publish --provenance --access public\b/,
  },
];
const forbiddenPatterns = [
  {
    id: "npm-token-secret",
    pattern: /NODE_AUTH_TOKEN|NPM_TOKEN|secrets\./,
  },
  {
    id: "credential-persistence",
    pattern: /persist-credentials:\s+true\b/,
  },
];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL release provenance: ${message}`);
}

function topLevelBlock(name) {
  const start = lines.findIndex((line) => line === `${name}:`);
  if (start === -1) return [];
  const block = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    if (line.trim() !== "") block.push(line.trim());
  }
  return block;
}

const permissions = topLevelBlock("permissions");
if (!permissions.includes("id-token: write")) fail("missing oidc-token-permission");
if (!permissions.includes("contents: read")) fail("missing read-only-contents");

for (const { id, pattern } of requiredPatterns) {
  if (!pattern.test(workflow)) fail(`missing ${id}`);
}
for (const { id, pattern } of forbiddenPatterns) {
  if (pattern.test(workflow)) fail(`forbidden ${id}`);
}

if (failures > 0) {
  console.error(`${failures} release provenance validation failure(s)`);
  process.exit(1);
}

console.log("release provenance validation passed");
