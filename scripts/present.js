#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startLocalPresentationServer } from "../src/utils/local-presentation-server.js";
import {
  formatPresentCliUsage,
  parsePresentCliArgs,
} from "../src/utils/present-cli.js";

export async function main(argv = process.argv.slice(2)) {
  let args;

  try {
    args = parsePresentCliArgs(argv);
  } catch (error) {
    console.error(error.message);
    console.error("");
    console.error(formatPresentCliUsage());
    process.exit(1);
  }

  if (args.help) {
    console.log(formatPresentCliUsage());
    return;
  }

  if (!args.presentationPath) {
    console.error("Missing presentation JSON path.");
    console.error("");
    console.error(formatPresentCliUsage());
    process.exit(1);
  }

  let runtime;

  try {
    runtime = await startLocalPresentationServer({
      host: args.host,
      open: args.open,
      port: args.port,
      presentationPath: args.presentationPath,
    });
  } catch (error) {
    if (error.validationResult) {
      console.error(`${error.message}\n`);
      printErrors(error.validationResult.errors);
      printWarnings(error.validationResult.warnings);
      process.exit(1);
    }

    throw error;
  }

  const { presentationPath, presentationUrl, server, validationResult } =
    runtime;

  console.log(`Serving presentation: ${presentationPath}`);
  console.log(`Presentation URL: ${presentationUrl}`);

  if (validationResult.warnings.length > 0) {
    console.log("");
    printWarnings(validationResult.warnings);
  }

  console.log("\nPress Ctrl+C to stop the server.");

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
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
    console.error(error.message);
    process.exit(1);
  });
}
