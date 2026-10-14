#!/usr/bin/env node
// Copies shared contract runtime and schema files into each contract skill so every
// skill installs alone. Sources are authoritative; the copies are generated.
//   node tools/sync-contract-assets.js          write copies
//   node tools/sync-contract-assets.js --check  fail if any copy differs from its source
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./lib.js";

const PERF = "skills/performance-contracts";
const OUTCOME = "skills/verify-user-outcomes";

export const SYNC_MAP = [
  { source: "tools/contracts/contract-core.js", targets: [`${PERF}/scripts/contract-core.js`, `${OUTCOME}/scripts/contract-core.js`] },
  { source: "schemas/contract-result.schema.json", targets: [`${PERF}/assets/contract-result.schema.json`, `${OUTCOME}/assets/contract-result.schema.json`] },
  { source: "schemas/performance-contract.schema.json", targets: [`${PERF}/assets/performance-contract.schema.json`] },
  { source: "schemas/outcome-contract.schema.json", targets: [`${OUTCOME}/assets/outcome-contract.schema.json`] },
  { source: "schemas/contract-config.schema.json", targets: [`${PERF}/assets/contract-config.schema.json`, `${OUTCOME}/assets/contract-config.schema.json`] },
];

export function syncContractAssets({ check = false, root = ROOT } = {}) {
  const drift = [];
  for (const { source, targets } of SYNC_MAP) {
    const expected = fs.readFileSync(path.join(root, source), "utf8");
    for (const target of targets) {
      const file = path.join(root, target);
      const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
      if (current === expected) continue;
      if (check) {
        drift.push(target);
      } else {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, expected);
      }
    }
  }
  return drift;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const drift = syncContractAssets({ check });
  if (check && drift.length > 0) {
    for (const file of drift) console.error(`FAIL out of date: ${file}; run node tools/sync-contract-assets.js`);
    process.exit(1);
  }
  console.log(check ? "contract assets are in sync" : "contract assets synced");
}
