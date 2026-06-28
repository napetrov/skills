#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { copyDir, findSkill, readCatalog, targetDir, verifySkillArtifact } from "../tools/lib.js";

const [, , command, ...args] = process.argv;

function usage(code = 0) {
  console.log(`Usage:
  intel-skills list
  intel-skills show <skill>
  intel-skills install <skill> --target codex|claude-code [--force]
  intel-skills verify <skill> [--path <installed-skill-dir>]`);
  process.exit(code);
}

function argValue(name) {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
}

try {
  if (!command || command === "--help" || command === "-h") usage(0);

  if (command === "list") {
    for (const skill of readCatalog()) {
      console.log(`${skill.name}\t${skill.product}\t${skill.description}`);
    }
  } else if (command === "show") {
    const skill = findSkill(args[0]);
    console.log(skill.body);
  } else if (command === "verify") {
    const skillName = args[0];
    const verifyPath = argValue("--path");
    if (!skillName || skillName.startsWith("--")) usage(1);
    const skill = verifyPath ? { dir: path.resolve(verifyPath), frontmatter: { name: skillName } } : findSkill(skillName);
    const artifact = verifySkillArtifact(skill.dir, {
      expectedName: skill.frontmatter.name,
      allowDifferentPath: Boolean(verifyPath),
    });
    console.log(`ok ${artifact.name} ${artifact.version} ${artifact.artifact_sha256}`);
  } else if (command === "install") {
    const skillName = args[0];
    const target = argValue("--target");
    if (!skillName || !target) usage(1);
    if (args.includes("--link")) {
      throw new Error("--link is not supported by the packaged CLI");
    }
    const skill = findSkill(skillName);
    verifySkillArtifact(skill.dir);
    const root = targetDir(target);
    const dest = path.join(root, skill.frontmatter.name);
    const resolvedRoot = path.resolve(root);
    const resolvedDest = path.resolve(dest);
    if (!resolvedDest.startsWith(`${resolvedRoot}${path.sep}`)) {
      throw new Error("install destination escapes target directory");
    }
    if (fs.existsSync(dest) && !args.includes("--force")) {
      throw new Error(`destination already exists: ${dest}; use --force to overwrite`);
    }
    fs.mkdirSync(root, { recursive: true });
    fs.rmSync(dest, { recursive: true, force: true });
    copyDir(skill.dir, dest);
    try {
      verifySkillArtifact(dest, { expectedName: skill.frontmatter.name, allowDifferentPath: true });
    } catch (error) {
      fs.rmSync(dest, { recursive: true, force: true });
      throw error;
    }
    console.log(`installed ${skill.frontmatter.name} to ${dest}`);
  } else {
    usage(1);
  }
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}
