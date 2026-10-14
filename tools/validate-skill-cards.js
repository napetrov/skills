#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT, listSkillDirs, loadSkill, VOCAB } from "./lib.js";

const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", "skill-card.schema.json"), "utf8"));
const requiredFields = schema.required;
const githubUrlPattern = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/.*)?$/;
const scriptPattern = new RegExp(schema.properties.scripts.items.pattern);
const sourcePathPattern = new RegExp(schema.properties.source.properties.path.pattern);
const verificationStatuses = new Set(schema.properties.verification_status.enum);
const signatureStatuses = new Set(schema.properties.signature.properties.status.enum);
const releaseAttestations = new Set(schema.properties.release_evidence.properties.attestation.enum);
const catalogRepository = schema.properties.catalog.properties.repository.const;

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${path.basename(file)} is invalid JSON: ${error.message}`);
  }
}

function checkString(skillName, card, field) {
  if (typeof card[field] !== "string" || card[field].trim() === "") {
    fail(`${skillName}: skill-card.json ${field} must be a non-empty string`);
  }
}

function checkStringArray(skillName, card, field, { minItems = 0, pattern } = {}) {
  if (!Array.isArray(card[field])) {
    fail(`${skillName}: skill-card.json ${field} must be an array`);
    return;
  }
  if (card[field].length < minItems) {
    fail(`${skillName}: skill-card.json ${field} must contain at least ${minItems} item(s)`);
  }
  const seen = new Set();
  for (const item of card[field]) {
    if (typeof item !== "string" || item.trim() === "") {
      fail(`${skillName}: skill-card.json ${field} entries must be non-empty strings`);
      continue;
    }
    if (seen.has(item)) {
      fail(`${skillName}: skill-card.json ${field} has duplicate entry ${item}`);
    }
    seen.add(item);
    if (pattern && !pattern.test(item)) {
      fail(`${skillName}: skill-card.json ${field} entry has invalid format: ${item}`);
    }
  }
}

function checkRawStringArray(skillName, arrayName, items, { minItems = 0 } = {}) {
  if (!Array.isArray(items)) {
    fail(`${skillName}: skill-card.json ${arrayName} must be an array`);
    return;
  }
  if (items.length < minItems) {
    fail(`${skillName}: skill-card.json ${arrayName} must contain at least ${minItems} item(s)`);
  }
  const seen = new Set();
  for (const item of items) {
    if (typeof item !== "string" || item.trim() === "") {
      fail(`${skillName}: skill-card.json ${arrayName} entries must be non-empty strings`);
      continue;
    }
    if (seen.has(item)) fail(`${skillName}: skill-card.json ${arrayName} has duplicate entry ${item}`);
    seen.add(item);
  }
}

function checkDeclaredScripts(skillName, skillDir, declaredScripts) {
  const scriptsDir = path.join(skillDir, "scripts");
  const actualScripts = fs.existsSync(scriptsDir)
    ? fs
        .readdirSync(scriptsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => `scripts/${entry.name}`)
        .sort()
    : [];
  const declared = [...declaredScripts].sort();
  if (JSON.stringify(actualScripts) !== JSON.stringify(declared)) {
    fail(
      `${skillName}: skill-card.json scripts must match scripts/ files; expected [${actualScripts.join(", ")}]`,
    );
  }
}

function checkObjectKeys(skillName, objectName, value, keys) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${skillName}: skill-card.json ${objectName} must be an object`);
    return false;
  }
  for (const key of keys) {
    if (value[key] === undefined) {
      fail(`${skillName}: skill-card.json ${objectName}.${key} is required`);
    }
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) {
      fail(`${skillName}: skill-card.json ${objectName}.${key} is unknown`);
    }
  }
  return true;
}

function githubTreeUrl(repository, ref, relPath) {
  return `${repository}/tree/${ref}/${relPath}`;
}

for (const skillDir of listSkillDirs()) {
  const skillName = path.basename(skillDir);
  const cardPath = path.join(skillDir, "skill-card.json");
  const markdownPath = path.join(skillDir, "skill-card.md");
  if (!fs.existsSync(cardPath)) {
    fail(`${skillName}: missing skill-card.json`);
    continue;
  }
  if (!fs.existsSync(markdownPath)) {
    fail(`${skillName}: missing skill-card.md`);
  }

  let card;
  try {
    card = readJson(cardPath);
  } catch (error) {
    fail(`${skillName}: ${error.message}`);
    continue;
  }
  const skill = loadSkill(skillDir);

  for (const field of requiredFields) {
    if (card[field] === undefined) {
      fail(`${skillName}: skill-card.json missing ${field}`);
    }
  }
  for (const field of Object.keys(card)) {
    if (!requiredFields.includes(field)) {
      fail(`${skillName}: skill-card.json unknown field ${field}`);
    }
  }

  checkString(skillName, card, "name");
  checkString(skillName, card, "owner");
  checkString(skillName, card, "source_url");
  checkString(skillName, card, "implementation_url");
  checkString(skillName, card, "data_classification");
  checkString(skillName, card, "verification_status");
  checkStringArray(skillName, card, "deployment_geography", { minItems: 1 });
  checkStringArray(skillName, card, "tools");
  checkStringArray(skillName, card, "scripts", { pattern: scriptPattern });
  checkStringArray(skillName, card, "permissions");
  checkStringArray(skillName, card, "risks", { minItems: 1 });
  checkStringArray(skillName, card, "mitigations", { minItems: 1 });
  checkStringArray(skillName, card, "ethical_considerations", { minItems: 1 });

  if (card.name !== skillName) {
    fail(`${skillName}: skill-card.json name must match directory`);
  }
  if (card.data_classification !== skill.frontmatter.data_classification) {
    fail(`${skillName}: skill-card.json data_classification must match SKILL.md frontmatter`);
  }
  if (!VOCAB.data_classification.has(card.data_classification)) {
    fail(`${skillName}: skill-card.json unknown data_classification ${card.data_classification}`);
  }
  for (const field of ["source_url", "implementation_url"]) {
    if (typeof card[field] === "string" && !githubUrlPattern.test(card[field])) {
      fail(`${skillName}: skill-card.json ${field} must be an HTTPS GitHub URL`);
    }
    if (skill.frontmatter[field] !== card[field]) {
      fail(`${skillName}: skill-card.json ${field} must match SKILL.md frontmatter`);
    }
  }
  if (!verificationStatuses.has(card.verification_status)) {
    fail(`${skillName}: skill-card.json unknown verification_status ${card.verification_status}`);
  }
  if (checkObjectKeys(skillName, "source", card.source, ["repository", "ref", "path"])) {
    if (!githubUrlPattern.test(card.source.repository)) {
      fail(`${skillName}: skill-card.json source.repository must be an HTTPS GitHub repo URL`);
    }
    if (typeof card.source.path !== "string" || !sourcePathPattern.test(card.source.path)) {
      fail(`${skillName}: skill-card.json source.path has invalid format`);
    }
    if (card.source.repository !== card.source_url) {
      fail(`${skillName}: skill-card.json source.repository must match source_url`);
    }
    if (card.implementation_url !== githubTreeUrl(card.source.repository, card.source.ref, card.source.path)) {
      fail(`${skillName}: skill-card.json implementation_url must match source.repository/ref/path`);
    }
  }
  if (checkObjectKeys(skillName, "catalog", card.catalog, ["repository", "path"])) {
    const expectedPath = `skills/${skillName}`;
    if (card.catalog.repository !== catalogRepository) {
      fail(`${skillName}: skill-card.json catalog.repository must be ${catalogRepository}`);
    }
    if (card.catalog.path !== expectedPath) {
      fail(`${skillName}: skill-card.json catalog.path must be ${expectedPath}`);
    }
  }
  if (checkObjectKeys(skillName, "output", card.output, ["type", "format"])) {
    if (card.output.type !== "agent-instructions") {
      fail(`${skillName}: skill-card.json output.type must be agent-instructions`);
    }
    if (card.output.format !== "markdown") {
      fail(`${skillName}: skill-card.json output.format must be markdown`);
    }
  }
  if (checkObjectKeys(skillName, "release_evidence", card.release_evidence, [
    "artifact_manifest",
    "attestation",
    "signing_workflow",
  ])) {
    if (card.release_evidence.artifact_manifest !== "skills.lock.json") {
      fail(`${skillName}: skill-card.json release_evidence.artifact_manifest must be skills.lock.json`);
    }
    if (!releaseAttestations.has(card.release_evidence.attestation)) {
      fail(`${skillName}: skill-card.json unknown release_evidence.attestation ${card.release_evidence.attestation}`);
    }
    if (card.release_evidence.signing_workflow !== ".github/workflows/release.yml") {
      fail(`${skillName}: skill-card.json release_evidence.signing_workflow must be .github/workflows/release.yml`);
    }
  }
  if (checkObjectKeys(skillName, "signature", card.signature, ["status", "identity", "subjects"])) {
    if (!signatureStatuses.has(card.signature.status)) {
      fail(`${skillName}: skill-card.json unknown signature.status ${card.signature.status}`);
    }
    if (typeof card.signature.identity !== "string" || card.signature.identity.trim() === "") {
      fail(`${skillName}: skill-card.json signature.identity must be a non-empty string`);
    }
    checkRawStringArray(skillName, "signature.subjects", card.signature.subjects);
    if (card.signature.status === "github-attested") {
      for (const subject of ["skills.lock.json", "npm package tarball"]) {
        if (!card.signature.subjects.includes(subject)) {
          fail(`${skillName}: skill-card.json signature.subjects missing ${subject}`);
        }
      }
      if (card.release_evidence?.attestation !== "github-artifact-attestations") {
        fail(`${skillName}: skill-card.json github-attested signature requires release_evidence attestation`);
      }
    } else if (card.signature.status === "unsigned") {
      if (card.signature.identity !== "none") {
        fail(`${skillName}: skill-card.json unsigned signature.identity must be none`);
      }
      if (card.signature.subjects?.length !== 0) {
        fail(`${skillName}: skill-card.json unsigned signature.subjects must be empty`);
      }
      if (card.release_evidence?.attestation !== "none") {
        fail(`${skillName}: skill-card.json unsigned signature requires release_evidence.attestation none`);
      }
    }
  }
  if (card.verification_status === "verified") {
    if (card.signature?.status !== "github-attested") {
      fail(`${skillName}: verification_status verified requires github-attested signature`);
    }
    if (card.release_evidence?.attestation !== "github-artifact-attestations") {
      fail(`${skillName}: verification_status verified requires release_evidence attestation metadata`);
    }
  }
  if (card.risks?.length !== card.mitigations?.length) {
    fail(`${skillName}: skill-card.json risks and mitigations must have the same length`);
  }
  if (typeof card.network !== "object" || card.network === null || Array.isArray(card.network)) {
    fail(`${skillName}: skill-card.json network must be an object`);
  } else {
    if (typeof card.network.required !== "boolean") {
      fail(`${skillName}: skill-card.json network.required must be boolean`);
    }
    if (!Array.isArray(card.network.destinations)) {
      fail(`${skillName}: skill-card.json network.destinations must be an array`);
    } else if (!card.network.required && card.network.destinations.length > 0) {
      fail(`${skillName}: skill-card.json network.destinations must be empty when network.required is false`);
    } else {
      checkRawStringArray(skillName, "network.destinations", card.network.destinations);
    }
  }
  checkDeclaredScripts(skillName, skillDir, Array.isArray(card.scripts) ? card.scripts : []);
}

if (failures > 0) {
  console.error(`${failures} skill-card validation failure(s)`);
  process.exit(1);
}

console.log("skill-card validation passed");
