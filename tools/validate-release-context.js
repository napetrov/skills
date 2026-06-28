#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.js";

function fail(message) {
  console.error(`FAIL release context: ${message}`);
  process.exit(1);
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

if (process.env.GITHUB_EVENT_NAME !== "release") fail("workflow must run from release event");
if (process.env.GITHUB_REF_TYPE !== "tag") fail("release ref must be a tag");

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) fail("missing GITHUB_EVENT_PATH");
const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
if (event.release?.prerelease) fail("prereleases must not publish to latest");

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const expectedTag = `v${pkg.version}`;
if (process.env.GITHUB_REF_NAME !== expectedTag) {
  fail(`release tag ${process.env.GITHUB_REF_NAME} does not match package version ${expectedTag}`);
}

const tagCommit = git(["rev-list", "-n", "1", process.env.GITHUB_REF_NAME]);
const headCommit = git(["rev-parse", "HEAD"]);
if (headCommit !== tagCommit) fail("checked-out HEAD does not match release tag commit");

git(["fetch", "--no-tags", "origin", "main:refs/remotes/origin/main"]);
try {
  git(["merge-base", "--is-ancestor", tagCommit, "origin/main"]);
} catch {
  fail("release tag commit is not reachable from origin/main");
}

console.log(`release context validation passed (${expectedTag} ${tagCommit})`);
