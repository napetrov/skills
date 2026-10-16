#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareMeasurements } from "./compare.js";
import { MeasurementStore } from "./store.js";

const DEFAULT_STORE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "measurements.json");

function main(argv) {
  const [command, idA, idB, ...rest] = argv;
  const storeFlag = rest.indexOf("--store");
  const storeFile = storeFlag === -1 ? DEFAULT_STORE : rest[storeFlag + 1];
  if (command !== "compare" || !idA || !idB) {
    console.error("usage: cli.js compare <measurement-a> <measurement-b> [--store FILE]");
    return 2;
  }
  const store = new MeasurementStore(JSON.parse(fs.readFileSync(storeFile, "utf8")).measurements);
  const result = compareMeasurements(store, idA, idB);
  const lines = [`Comparable: ${result.comparable ? "yes" : "no"}${result.reason ? ` (${result.reason})` : ""}`];
  if (result.comparable) {
    lines.push(`Changed files: ${result.changes.length}`);
    for (const change of result.changes) {
      const delta = change.delta === undefined ? "" : ` (${change.delta > 0 ? "+" : ""}${change.delta} lines)`;
      lines.push(`  ${change.type} ${change.path}${delta}`);
    }
  } else {
    lines.push(...result.limitations.map((limitation) => `Note: ${limitation}`));
  }
  console.log(lines.join("\n"));
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exitCode = 2;
}
