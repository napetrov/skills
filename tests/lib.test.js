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
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].name, "dpnp-quickstart");
  assert.equal(catalog[0].product, "dpnp");
  assert.equal(catalog[0].data_classification, "public");
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
