#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exportPresentation } from "../src/export/index.js";
import {
  formatExportCliUsage,
  parseExportCliArgs,
} from "../src/utils/export-cli.js";

export async function main(argv = process.argv.slice(2)) {
  let args;

  try {
    args = parseExportCliArgs(argv);
  } catch (error) {
    console.error(error.message);
    console.error("");
    console.error(formatExportCliUsage());
    process.exit(1);
  }

  if (args.help) {
    console.log(formatExportCliUsage());
    return;
  }

  if (!args.presentationPath) {
    console.error("Missing presentation JSON path.");
    console.error("");
    console.error(formatExportCliUsage());
    process.exit(1);
  }

  try {
    await exportPresentation(args);
  } catch (error) {
    if (error.validationResult) {
      console.error(`${error.message}\n`);
      printErrors(error.validationResult.errors);
      printWarnings(error.validationResult.warnings);
      process.exit(1);
    }

    throw error;
  }

  console.log(`Exported ${args.format.toUpperCase()}: ${args.outputPath}`);
}

function printErrors(errors) {
  errors.forEach((error, index) => {
    const path = error.path || "root";

    console.error(`${index + 1}. Path: ${path}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Suggestion: ${error.suggestion}\n`);
  });
}

function printWarnings(warnings) {
  if (warnings.length === 0) {
    return;
  }

  console.log(`Warnings (${warnings.length}):\n`);

  warnings.forEach((warning, index) => {
    console.log(`${index + 1}. Slide: ${warning.slideTitle}`);
    console.log(`   Path: ${warning.path}`);
    console.log(`   Code: ${warning.code}`);
    console.log(`   Warning: ${warning.message}`);
    console.log(`   Suggestion: ${warning.suggestion}\n`);
  });
}

const isEntrypoint =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
