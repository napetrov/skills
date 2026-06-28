import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { findSkill, parseFrontmatter, readCatalog, verifySkillArtifact } from "../tools/lib.js";

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

test("catalog includes dpnp skill", () => {
  const catalog = readCatalog();
  const dpnp = catalog.find((skill) => skill.name === "dpnp-quickstart");
  assert.ok(dpnp);
  assert.equal(dpnp.product, "dpnp");
  assert.equal(dpnp.data_classification, "public");
});

test("catalog includes linux perf repair implementation links", () => {
  const catalog = readCatalog();
  const linuxPerf = catalog.find((skill) => skill.name === "linux-perf-repair");
  assert.ok(linuxPerf);
  assert.equal(linuxPerf.product, "linux-perf");
  assert.equal(linuxPerf.source_url, "https://github.com/intel/intel-performance-skills");
  assert.match(linuxPerf.implementation_url, /skills\/linux-perf/);
  assert.equal(linuxPerf.source.repository, "https://github.com/intel/intel-performance-skills");
  assert.equal(linuxPerf.catalog.path, "skills/linux-perf-repair");
});

test("verifySkillArtifact checks bundled manifest hash", () => {
  const artifact = verifySkillArtifact(findSkill("dpnp-quickstart").dir);
  assert.equal(artifact.name, "dpnp-quickstart");
  assert.match(artifact.artifact_sha256, /^[a-f0-9]{64}$/);
  assert.match(artifact.files[0].mode, /^[0-7]{4}$/);
});

test("cli verify reports artifact hash", () => {
  const result = runCli(["verify", "dpnp-quickstart"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^ok dpnp-quickstart 0\.1\.0 [a-f0-9]{64}\n$/);
});

test("cli verify rejects missing path value", () => {
  const result = runCli(["verify", "dpnp-quickstart", "--path"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--path requires a value/);
});

test("cli verify rejects flag-like path value", () => {
  const result = runCli(["verify", "dpnp-quickstart", "--path", "--target"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--path requires a value/);
});

test("cli verify checks installed skill path", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-home-"));
  const env = isolatedHomeEnv(home);
  try {
    assert.equal(runCli(["install", "dpnp-quickstart", "--target", "codex"], env).status, 0);
    const installedDir = path.join(home, ".codex", "skills", "dpnp-quickstart");
    const verify = runCli(["verify", "dpnp-quickstart", "--path", installedDir], env);
    assert.equal(verify.status, 0);
    assert.match(verify.stdout, /^ok dpnp-quickstart 0\.1\.0 [a-f0-9]{64}\n$/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("cli verify fails after installed skill tampering", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-home-"));
  const env = isolatedHomeEnv(home);
  try {
    assert.equal(runCli(["install", "dpnp-quickstart", "--target", "codex"], env).status, 0);
    const installedDir = path.join(home, ".codex", "skills", "dpnp-quickstart");
    fs.appendFileSync(path.join(installedDir, "SKILL.md"), "\n<!-- tampered -->\n");
    const verify = runCli(["verify", "dpnp-quickstart", "--path", installedDir], env);
    assert.notEqual(verify.status, 0);
    assert.match(verify.stderr, /skill artifact hash mismatch/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("cli verify fails when installed skill contains unsupported entry", () => {
  if (process.platform === "win32") return;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-home-"));
  const env = isolatedHomeEnv(home);
  try {
    assert.equal(runCli(["install", "dpnp-quickstart", "--target", "codex"], env).status, 0);
    const installedDir = path.join(home, ".codex", "skills", "dpnp-quickstart");
    fs.symlinkSync("/etc/passwd", path.join(installedDir, "EXTRA_SYMLINK"));
    const verify = runCli(["verify", "dpnp-quickstart", "--path", installedDir], env);
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

test("install rejects link mode", () => {
  const result = runCli(["install", "dpnp-quickstart", "--target", "codex", "--link"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--link is not supported/);
});

test("install refuses overwrite without --force", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-home-"));
  const env = isolatedHomeEnv(home);
  try {
    assert.equal(runCli(["install", "dpnp-quickstart", "--target", "codex"], env).status, 0);
    const overwrite = runCli(["install", "dpnp-quickstart", "--target", "codex"], env);
    assert.notEqual(overwrite.status, 0);
    assert.match(overwrite.stderr, /destination already exists/);
    assert.equal(runCli(["install", "dpnp-quickstart", "--target", "codex", "--force"], env).status, 0);
    assert.ok(fs.existsSync(path.join(home, ".codex", "skills", "dpnp-quickstart", "SKILL.md")));
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
