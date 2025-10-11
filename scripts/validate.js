#!/usr/bin/env node
/**
 * Command-line validation script for presentation JSON files
 * Usage: node scripts/validate.js <path-to-json>
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getValidationReport } from '../src/validator/index.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/validate.js <path-to-json>');
  console.error('Example: node scripts/validate.js examples/hello-world.json');
  process.exit(1);
}

const filePath = resolve(args[0]);

try {
  console.log(`Validating: ${filePath}\n`);

  const fileContent = readFileSync(filePath, 'utf-8');
  const presentation = JSON.parse(fileContent);

  const report = getValidationReport(presentation);
  console.log(report);

  // Exit with error code if invalid
  if (report.startsWith('✗')) {
    process.exit(1);
  }

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
