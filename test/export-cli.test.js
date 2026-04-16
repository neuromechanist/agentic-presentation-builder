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

test("parseExportCliArgs defaults pptxMode to native", () => {
  const args = parseExportCliArgs([
    "examples/hello-world.json",
    "--format",
    "pptx",
  ]);
  assert.equal(args.pptxMode, "native");
});

test("parseExportCliArgs accepts --pptx-mode=image", () => {
  const args = parseExportCliArgs([
    "examples/hello-world.json",
    "--format",
    "pptx",
    "--pptx-mode=image",
  ]);
  assert.equal(args.pptxMode, "image");
});

test("parseExportCliArgs rejects invalid pptx-mode", () => {
  assert.throws(
    () => parseExportCliArgs(["examples/hello-world.json", "--pptx-mode", "bad"]),
    /Unsupported --pptx-mode/,
  );
});

test("parseExportCliArgs rejects unsupported format", () => {
  assert.throws(
    () => parseExportCliArgs(["examples/hello-world.json", "--format", "odp"]),
    /Unsupported export format/,
  );
});

test("parseExportCliArgs rejects invalid port", () => {
  assert.throws(
    () => parseExportCliArgs(["examples/hello-world.json", "--port", "abc"]),
    /Invalid port/,
  );
});

test("parseExportCliArgs rejects unknown option", () => {
  assert.throws(
    () => parseExportCliArgs(["examples/hello-world.json", "--verbose"]),
    /Unknown option/,
  );
});

test("parseExportCliArgs returns help flag", () => {
  const args = parseExportCliArgs(["--help"]);
  assert.equal(args.help, true);
});
