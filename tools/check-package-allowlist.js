#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const allowed = [
  /^bin\/[^/]+\.js$/,
  /^skills\.json$/,
  /^skills\.lock\.json$/,
  /^docs\/trust-model\.md$/,
  /^README\.md$/,
  /^LICENSE$/,
  /^NOTICE$/,
  /^package\.json$/,
  /^schemas\/(?:skill-card|skill-manifest)\.schema\.json$/,
  /^templates\/skill\/(?:SKILL\.md|BENCHMARK\.md|skill-card\.(?:md|json)|references\/README\.md)$/,
  /^tools\/(?:generate-catalog|generate-skill-manifest|validate-skills|validate-skill-cards|validate-skills-security|validate-release-provenance|validate-trust-policy|check-package-allowlist|install-smoke|lib)\.js$/,
  /^skills\/[a-z0-9]+(?:-[a-z0-9]+)*\/(?:SKILL\.md|BENCHMARK\.md|skill-card\.(?:md|json))$/,
  /^skills\/[a-z0-9]+(?:-[a-z0-9]+)*\/references\/[A-Za-z0-9_.-]+\.md$/,
  /^skills\/[a-z0-9]+(?:-[a-z0-9]+)*\/scripts\/[A-Za-z0-9_.-]+\.(?:py|sh|js)$/,
  /^skills\/[a-z0-9]+(?:-[a-z0-9]+)*\/assets\/[A-Za-z0-9_./-]+$/,
  /^skills\/README\.md$/,
];

const forbidden = [/(^|\/)evals\//, /(^|\/)(results|reports|tmp|node_modules)\//, /\.tgz$/, /\.log$/];
const maxUnpackedBytes = 1_000_000;

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

const result = spawnSync(npmCommand(), ["pack", "--dry-run", "--json"], { encoding: "utf8" });
if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const [pack] = JSON.parse(result.stdout);
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

if (pack.unpackedSize > maxUnpackedBytes) {
  fail(`package unpacked size ${pack.unpackedSize} exceeds ${maxUnpackedBytes}`);
}

for (const file of pack.files) {
  const path = file.path;
  if (forbidden.some((pattern) => pattern.test(path))) {
    fail(`forbidden file in package: ${path}`);
  }
  if (!allowed.some((pattern) => pattern.test(path))) {
    fail(`file is not in package allowlist: ${path}`);
  }
}

if (failures > 0) {
  console.error(`${failures} package allowlist failure(s)`);
  process.exit(1);
}

console.log(`package allowlist passed (${pack.files.length} files, ${pack.unpackedSize} bytes unpacked)`);
