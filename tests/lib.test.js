import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { findSkill, parseFrontmatter, readCatalog, verifySkillArtifact } from "../tools/lib.js";

// Tests that exercise an installed skill use the first catalog entry. They are
// skipped while the catalog is empty so the suite stays green on a fresh repo.
const sample = readCatalog()[0];
const skipNoSkills = sample ? false : "catalog has no skills yet";

function runCli(args, env = process.env) {
  return spawnSync(process.execPath, ["bin/intel-skills.js", ...args], {
    encoding: "utf8",
    env,
  });
}

function isolatedHomeEnv(home) {
  const env = { ...process.env, HOME: home };
  if (process.platform === "win32") {
    const parsed = path.parse(home);
    env.USERPROFILE = home;
    env.HOMEDRIVE = parsed.root.replace(/[\\/]$/, "");
    env.HOMEPATH = home.slice(env.HOMEDRIVE.length);
  }
  return env;
}

test("parseFrontmatter parses arrays", () => {
  const parsed = parseFrontmatter(`---
name: demo
tags: [one, two]
---
# Demo
`);
  assert.equal(parsed.name, "demo");
  assert.deepEqual(parsed.tags, ["one", "two"]);
});

test("verifySkillArtifact checks bundled manifest hash", { skip: skipNoSkills }, () => {
  const artifact = verifySkillArtifact(findSkill(sample.name).dir);
  assert.equal(artifact.name, sample.name);
  assert.match(artifact.artifact_sha256, /^[a-f0-9]{64}$/);
  assert.match(artifact.files[0].mode, /^[0-7]{4}$/);
});

test("cli verify reports artifact hash", { skip: skipNoSkills }, () => {
  const result = runCli(["verify", sample.name]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, new RegExp(`^ok ${sample.name} ${sample.version} [a-f0-9]{64}\\n$`));
});

test("cli verify rejects missing path value", { skip: skipNoSkills }, () => {
  const result = runCli(["verify", sample.name, "--path"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--path requires a value/);
});

test("cli verify rejects flag-like path value", { skip: skipNoSkills }, () => {
  const result = runCli(["verify", sample.name, "--path", "--target"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--path requires a value/);
});

test("cli verify checks installed skill path", { skip: skipNoSkills }, () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-home-"));
  const env = isolatedHomeEnv(home);
  try {
    assert.equal(runCli(["install", sample.name, "--target", "codex"], env).status, 0);
    const installedDir = path.join(home, ".codex", "skills", sample.name);
    const verify = runCli(["verify", sample.name, "--path", installedDir], env);
    assert.equal(verify.status, 0);
    assert.match(verify.stdout, new RegExp(`^ok ${sample.name} ${sample.version} [a-f0-9]{64}\\n$`));
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("cli verify fails after installed skill tampering", { skip: skipNoSkills }, () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-home-"));
  const env = isolatedHomeEnv(home);
  try {
    assert.equal(runCli(["install", sample.name, "--target", "codex"], env).status, 0);
    const installedDir = path.join(home, ".codex", "skills", sample.name);
    fs.appendFileSync(path.join(installedDir, "SKILL.md"), "\n<!-- tampered -->\n");
    const verify = runCli(["verify", sample.name, "--path", installedDir], env);
    assert.notEqual(verify.status, 0);
    assert.match(verify.stderr, /skill artifact hash mismatch/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("cli verify fails when installed skill contains unsupported entry", { skip: skipNoSkills }, () => {
  if (process.platform === "win32") return;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-home-"));
  const env = isolatedHomeEnv(home);
  try {
    assert.equal(runCli(["install", sample.name, "--target", "codex"], env).status, 0);
    const installedDir = path.join(home, ".codex", "skills", sample.name);
    fs.symlinkSync("/etc/passwd", path.join(installedDir, "EXTRA_SYMLINK"));
    const verify = runCli(["verify", sample.name, "--path", installedDir], env);
    assert.notEqual(verify.status, 0);
    assert.match(verify.stderr, /unsupported skill artifact entry/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("findSkill rejects traversal", () => {
  assert.throws(() => findSkill("../templates/skill"), /invalid skill name/);
});

test("cli rejects traversal", () => {
  const result = runCli(["show", "../templates/skill"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /invalid skill name/);
});

test("install rejects link mode", { skip: skipNoSkills }, () => {
  const result = runCli(["install", sample.name, "--target", "codex", "--link"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--link is not supported/);
});

test("install refuses overwrite without --force", { skip: skipNoSkills }, () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-home-"));
  const env = isolatedHomeEnv(home);
  try {
    assert.equal(runCli(["install", sample.name, "--target", "codex"], env).status, 0);
    const overwrite = runCli(["install", sample.name, "--target", "codex"], env);
    assert.notEqual(overwrite.status, 0);
    assert.match(overwrite.stderr, /destination already exists/);
    assert.equal(runCli(["install", sample.name, "--target", "codex", "--force"], env).status, 0);
    assert.ok(fs.existsSync(path.join(home, ".codex", "skills", sample.name, "SKILL.md")));
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
