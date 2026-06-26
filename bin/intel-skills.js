#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { copyDir, findSkill, readCatalog, targetDir } from "../tools/lib.js";

const [, , command, ...args] = process.argv;

function usage(code = 0) {
  console.log(`Usage:
  intel-skills list
  intel-skills show <skill>
  intel-skills install <skill> --target codex|claude-code [--link]
  intel-skills verify <skill>`);
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
    const skill = findSkill(args[0]);
    console.log(`ok ${skill.frontmatter.name} ${skill.frontmatter.version}`);
  } else if (command === "install") {
    const skillName = args[0];
    const target = argValue("--target");
    if (!skillName || !target) usage(1);
    const skill = findSkill(skillName);
    const root = targetDir(target);
    const dest = path.join(root, skill.frontmatter.name);
    fs.mkdirSync(root, { recursive: true });
    fs.rmSync(dest, { recursive: true, force: true });
    if (args.includes("--link")) {
      fs.symlinkSync(skill.dir, dest, "dir");
    } else {
      copyDir(skill.dir, dest);
    }
    console.log(`installed ${skill.frontmatter.name} to ${dest}`);
  } else {
    usage(1);
  }
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}
