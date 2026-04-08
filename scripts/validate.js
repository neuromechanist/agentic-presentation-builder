#!/usr/bin/env node
/**
 * Command-line validation script for presentation JSON files
 * Usage: node scripts/validate.js <path-to-json>
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { validatePresentation } from '../src/validator/index.js';

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const positionalArgs = args.filter(arg => arg !== '--json');

if (positionalArgs.length === 0) {
  console.error('Usage: node scripts/validate.js <path-to-json>');
  console.error('Example: node scripts/validate.js examples/hello-world.json --json');
  process.exit(1);
}

const filePath = resolve(positionalArgs[0]);

try {
  // Load presentation
  const fileContent = readFileSync(filePath, 'utf-8');
  const presentation = JSON.parse(fileContent);

  // Validate
  const result = validatePresentation(presentation);
  const payload = buildValidationPayload(filePath, result);

  if (jsonOutput) {
    console.log(JSON.stringify(payload, null, 2));
    process.exit(result.valid ? 0 : 1);
  }

  console.log(`Validating: ${filePath}\n`);

  if (result.valid) {
    console.log('✓ Presentation is valid');
    printWarnings(result.warnings);
  } else {
    console.log(`✗ Presentation has ${result.errors.length} validation error(s):\n`);

    result.errors.forEach((error, index) => {
      const path = error.path || 'root';

      console.log(`${index + 1}. Path: ${path}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Error: ${error.message}\n`);
      console.log(`   Suggestion: ${error.suggestion}\n`);
    });

    printWarnings(result.warnings);
    process.exit(1);
  }

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

function printWarnings(warnings) {
  if (!warnings.length) {
    return;
  }

  console.log(`\nWarnings (${warnings.length}):\n`);

  warnings.forEach((warning, index) => {
    console.log(`${index + 1}. Slide: ${warning.slideTitle}`);
    console.log(`   Path: ${warning.path}`);
    console.log(`   Code: ${warning.code}`);
    console.log(`   Warning: ${warning.message}\n`);
    console.log(`   Suggestion: ${warning.suggestion}\n`);
  });
}

function buildValidationPayload(filePath, result) {
  return {
    filePath,
    valid: result.valid,
    summary: {
      errorCount: result.errors?.length || 0,
      warningCount: result.warnings.length
    },
    errors: result.errors || [],
    warnings: result.warnings
  };
}
