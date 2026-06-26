import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { findSkill, parseFrontmatter, readCatalog } from "../tools/lib.js";

function runCli(args, env = process.env) {
  return spawnSync(process.execPath, ["bin/intel-skills.js", ...args], {
    encoding: "utf8",
    env,
  });
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
  const env = { ...process.env, HOME: home };
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
