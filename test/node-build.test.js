import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildPresentation } from "../src/index.js";

test("buildPresentation works in Node without browser globals", async () => {
  const data = JSON.parse(await readFile("examples/hello-world.json", "utf-8"));
  const built = buildPresentation(data);

  assert.equal(built.metadata.title, "Hello World");
  assert.match(built.slidesHTML, /<section id="slide-0"/);
  assert.equal(built.dimensions.width, 1920);
  assert.equal(built.dimensions.height, 1080);
});
