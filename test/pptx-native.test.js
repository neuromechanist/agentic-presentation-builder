import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { exportNativePptx } from "../src/export/pptx-native.js";

let tempDir;

test("native pptx exporter", async (t) => {
  tempDir = await mkdtemp(join(tmpdir(), "pptx-test-"));

  await t.test("exports hello-world to a valid pptx file", async () => {
    const output = join(tempDir, "hello-world.pptx");
    await exportNativePptx({
      presentationPath: "examples/hello-world.json",
      outputPath: output,
    });
    assert.ok(existsSync(output), "output file should exist");
    const { statSync } = await import("node:fs");
    const stat = statSync(output);
    assert.ok(stat.size > 1000, `file should be non-trivial (got ${stat.size} bytes)`);
  });

  await t.test("exports advanced-features-demo covering all element types", async () => {
    const output = join(tempDir, "advanced.pptx");
    await exportNativePptx({
      presentationPath: "examples/advanced-features-demo.json",
      outputPath: output,
    });
    assert.ok(existsSync(output));
  });

  await t.test("exports image-demo with real image assets", async () => {
    const output = join(tempDir, "images.pptx");
    await exportNativePptx({
      presentationPath: "examples/image-demo.json",
      outputPath: output,
    });
    assert.ok(existsSync(output));
  });

  await t.test("handles missing images gracefully", async () => {
    const output = join(tempDir, "week.pptx");
    await exportNativePptx({
      presentationPath: "examples/week-01-course.json",
      outputPath: output,
    });
    assert.ok(existsSync(output), "export should succeed even with missing assets");
  });

  await t.test("cleanup", async () => {
    await rm(tempDir, { force: true, recursive: true });
  });
});
