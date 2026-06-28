#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skills = ["dpnp-quickstart", "linux-perf-repair"];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    const rendered = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`${command} ${args.join(" ")} failed\n${rendered}`);
  }
  return result;
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function binPath(prefix) {
  return process.platform === "win32"
    ? path.join(prefix, "intel-skills.cmd")
    : path.join(prefix, "bin", "intel-skills");
}

function smokeEnv(home) {
  const env = { ...process.env, HOME: home };
  if (process.platform === "win32") {
    const parsed = path.parse(home);
    env.USERPROFILE = home;
    env.HOMEDRIVE = parsed.root.replace(/[\\/]$/, "");
    env.HOMEPATH = home.slice(env.HOMEDRIVE.length);
  }
  return env;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "intel-skills-install-smoke-"));

try {
  const pack = run(npmCommand(), ["pack", "--pack-destination", tmp, "--json"]);
  const [metadata] = JSON.parse(pack.stdout);
  const tarball = path.join(tmp, metadata.filename);
  const prefix = path.join(tmp, "prefix");
  const home = path.join(tmp, "home");
  const env = smokeEnv(home);

  run(npmCommand(), ["install", "--global", "--prefix", prefix, tarball], { env });

  const cli = binPath(prefix);
  const list = run(cli, ["list"], { env }).stdout;
  for (const skill of skills) {
    if (!list.includes(skill)) {
      throw new Error(`installed CLI list output is missing ${skill}`);
    }
    run(cli, ["show", skill], { env });
    run(cli, ["verify", skill], { env });
    run(cli, ["install", skill, "--target", "codex"], { env });
    const installed = path.join(home, ".codex", "skills", skill, "SKILL.md");
    if (!fs.existsSync(installed)) {
      throw new Error(`installed skill missing: ${installed}`);
    }
    run(cli, ["verify", skill, "--path", path.dirname(installed)], { env });
  }

  console.log(`install smoke passed (${metadata.filename})`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
