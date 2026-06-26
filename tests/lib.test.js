import assert from "node:assert/strict";
import test from "node:test";
import { parseFrontmatter, readCatalog } from "../tools/lib.js";

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
});
