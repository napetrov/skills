#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.js";

const workflowPath = path.join(ROOT, ".github", "workflows", "release.yml");
const workflow = fs.readFileSync(workflowPath, "utf8");
const lines = workflow.split(/\r?\n/);
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

function hasLine(value, source = lines) {
  return source.some((line) => line.trim() === value);
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

function nestedBlock(name) {
  const start = lines.findIndex((line) => line.trim() === `${name}:`);
  if (start === -1) return [];
  const indent = lines[start].match(/^\s*/)[0].length;
  const block = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") continue;
    const lineIndent = line.match(/^\s*/)[0].length;
    if (lineIndent <= indent) break;
    block.push(line);
  }
  return block;
}

function runCommands(source) {
  return source
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- run: "))
    .map((line) => line.slice("- run: ".length).trim());
}

function stepSequence(source) {
  return source
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- run: ") || line.startsWith("- uses: "))
    .map((line) => {
      if (line.startsWith("- run: ")) return { type: "run", value: line.slice("- run: ".length).trim() };
      return { type: "uses", value: line.slice("- uses: ".length).trim() };
    });
}

if (!hasLine("on:") || !hasLine("release:") || !hasLine("types: [published]")) fail("missing release-trigger");

const permissions = topLevelBlock("permissions");
if (!permissions.includes("attestations: write")) fail("missing artifact-attestation-permission");
if (!permissions.includes("artifact-metadata: write")) fail("missing artifact-metadata-permission");
if (!permissions.includes("id-token: write")) fail("missing oidc-token-permission");
if (!permissions.includes("contents: read")) fail("missing read-only-contents");

const requiredStepOrder = [
  { type: "run", value: "npm ci" },
  { type: "run", value: "npm test" },
  { type: "run", value: "npm run pack:check" },
  { type: "run", value: "mkdir -p dist" },
  { type: "run", value: "npm pack --pack-destination dist --json > dist/npm-pack.json" },
  { type: "uses", value: "actions/attest@f6bf1532d7d6793fce74eac584813a8eee607999" },
  { type: "uses", value: "actions/attest@f6bf1532d7d6793fce74eac584813a8eee607999" },
  { type: "run", value: "npm publish dist/*.tgz --provenance --access public" },
];
const publishJob = nestedBlock("npm-publish");
if (publishJob.length === 0) fail("missing npm-publish job");
if (!hasLine("persist-credentials: false", publishJob)) fail("missing explicit checkout credential disable");
const runs = runCommands(publishJob);
const steps = stepSequence(publishJob);
let cursor = 0;
for (const step of steps) {
  const required = requiredStepOrder[cursor];
  if (required && step.type === required.type && step.value === required.value) cursor += 1;
}
if (cursor !== requiredStepOrder.length) {
  fail(`steps must include ordered release gate: ${requiredStepOrder.map((step) => step.value).join(" -> ")}`);
}
for (const command of runs) {
  if (command.startsWith("npm publish") && command !== "npm publish dist/*.tgz --provenance --access public") {
    fail(`unexpected publish command: ${command}`);
  }
}
for (const subject of ["subject-path: skills.lock.json", "subject-path: dist/*.tgz"]) {
  if (!hasLine(subject, publishJob)) fail(`missing attestation ${subject}`);
}
for (const { id, pattern } of forbiddenPatterns) {
  if (pattern.test(workflow)) fail(`forbidden ${id}`);
}

if (failures > 0) {
  console.error(`${failures} release provenance validation failure(s)`);
  process.exit(1);
}

console.log("release provenance validation passed");
