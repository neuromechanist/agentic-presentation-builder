import test from "node:test";
import assert from "node:assert/strict";
import {
  inferExportFormat,
  parseExportCliArgs,
  resolveDefaultOutputPath,
} from "../src/utils/export-cli.js";

test("parseExportCliArgs infers pdf output when format is omitted", () => {
  const args = parseExportCliArgs(["examples/hello-world.json"]);

  assert.equal(args.format, "pdf");
  assert.match(args.outputPath, /hello-world\.pdf$/);
});

test("parseExportCliArgs derives format from explicit output extension", () => {
  const args = parseExportCliArgs([
    "examples/hello-world.json",
    "--output",
    "dist/custom-deck.pptx",
  ]);

  assert.equal(args.format, "pptx");
  assert.match(args.outputPath, /dist\/custom-deck\.pptx$/);
});

test("inferExportFormat only accepts supported extensions", () => {
  assert.equal(inferExportFormat("/tmp/deck.pdf"), "pdf");
  assert.equal(inferExportFormat("/tmp/deck.pptx"), "pptx");
  assert.equal(inferExportFormat("/tmp/deck.odp"), null);
});

test("resolveDefaultOutputPath keeps the deck next to the source json", () => {
  assert.equal(
    resolveDefaultOutputPath("/tmp/slides/demo.json", "pptx"),
    "/tmp/slides/demo.pptx",
  );
});
