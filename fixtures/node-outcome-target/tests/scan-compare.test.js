import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { compareMeasurements } from "../src/compare.js";
import { MeasurementStore } from "../src/store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORE_FILE = path.join(ROOT, "data", "measurements.json");

function cli(...args) {
  return spawnSync(process.execPath, [path.join(ROOT, "src", "cli.js"), ...args, "--store", STORE_FILE], { encoding: "utf8" });
}

function loadStore() {
  return new MeasurementStore(JSON.parse(fs.readFileSync(STORE_FILE, "utf8")).measurements);
}

test("[scan-comparison-happy] two completed measurements show their changes at the CLI", () => {
  const result = cli("compare", "m-1", "m-2");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Comparable: yes/);
  assert.match(result.stdout, /modified src\/a\.js \(\+3 lines\)/);
  assert.match(result.stdout, /added src\/c\.js/);
});

test("[scan-comparison-incomparable] measurements with different fingerprints are flagged, not compared", () => {
  const result = cli("compare", "m-1", "m-3");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Comparable: no \(fingerprint-mismatch\)/);
  assert.doesNotMatch(result.stdout, /modified|added|removed/);
});

test("[scan-comparison-reuse] comparison reads stored measurements and starts no scan", () => {
  const store = loadStore();
  const result = compareMeasurements(store, "m-1", "m-2");
  assert.equal(result.comparable, true);
  assert.equal(store.scanCount, 0);
});

test("[scan-comparison-incomplete] a measurement that is still running is refused", () => {
  const result = cli("compare", "m-1", "m-4");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /not completed/);
});
