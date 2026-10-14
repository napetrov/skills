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

function stepBlocks(source) {
  const blocks = [];
  let current = null;
  for (const line of source) {
    if (/^\s{6}-\s+/.test(line)) {
      if (current) blocks.push(current);
      current = [line.trim()];
    } else if (current) {
      current.push(line.trim());
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function stepType(block) {
  const first = block[0] ?? "";
  if (first.startsWith("- run: ")) return { type: "run", value: first.slice("- run: ".length).trim() };
  if (first.startsWith("- uses: ")) return { type: "uses", value: first.slice("- uses: ".length).trim() };
  return { type: "unknown", value: first };
}

function blockIncludes(block, value) {
  return block.some((line) => line === value);
}

if (!hasLine("on:") || !hasLine("release:") || !hasLine("types: [published]")) fail("missing release-trigger");

const permissions = topLevelBlock("permissions");
if (!permissions.includes("attestations: write")) fail("missing artifact-attestation-permission");
if (!permissions.includes("artifact-metadata: write")) fail("missing artifact-metadata-permission");
if (!permissions.includes("id-token: write")) fail("missing oidc-token-permission");
if (!permissions.includes("contents: read")) fail("missing read-only-contents");

const requiredStepOrder = [
  { type: "uses", value: "actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0" },
  { type: "uses", value: "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e" },
  { type: "run", value: "node tools/validate-release-context.js" },
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
const steps = stepBlocks(publishJob);
const typedSteps = steps.map(stepType);
let cursor = 0;
for (const step of typedSteps) {
  const required = requiredStepOrder[cursor];
  if (required && step.type === required.type && step.value === required.value) cursor += 1;
}
if (cursor !== requiredStepOrder.length) {
  fail(`steps must include ordered release gate: ${requiredStepOrder.map((step) => step.value).join(" -> ")}`);
}

const publishSteps = typedSteps.filter((step) => step.type === "run" && step.value.startsWith("npm publish"));
if (publishSteps.length !== 1) fail(`expected exactly one npm publish step, got ${publishSteps.length}`);
for (const step of publishSteps) {
  if (step.value !== "npm publish dist/*.tgz --provenance --access public") fail(`unexpected publish command: ${step.value}`);
}

const checkoutStep = steps.find((block) => stepType(block).value === "actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0");
if (!checkoutStep || !blockIncludes(checkoutStep, "persist-credentials: false")) {
  fail("missing explicit checkout credential disable");
}
if (!checkoutStep || !blockIncludes(checkoutStep, "fetch-depth: 0")) fail("missing full checkout history for release ancestry check");

const attestSteps = steps.filter((block) => stepType(block).value === "actions/attest@f6bf1532d7d6793fce74eac584813a8eee607999");
if (attestSteps.length !== 2) fail(`expected exactly two attest steps, got ${attestSteps.length}`);
if (!attestSteps[0] || !blockIncludes(attestSteps[0], "subject-path: skills.lock.json")) {
  fail("first attest step must attest skills.lock.json");
}
if (!attestSteps[1] || !blockIncludes(attestSteps[1], "subject-path: dist/*.tgz")) {
  fail("second attest step must attest dist/*.tgz");
}

for (const step of typedSteps) {
  if (step.type === "uses" && !/@[a-f0-9]{40}$/.test(step.value)) {
    fail(`action is not pinned to a full commit SHA: ${step.value}`);
  }
}
for (const { id, pattern } of forbiddenPatterns) {
  if (pattern.test(workflow)) fail(`forbidden ${id}`);
}

if (failures > 0) {
  console.error(`${failures} release provenance validation failure(s)`);
  process.exit(1);
}

console.log("release provenance validation passed");
