#!/usr/bin/env node

import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { validatePresentation } from '../src/validator/index.js';

const examplesDir = resolve('examples');
const exampleFiles = readdirSync(examplesDir)
  .filter(fileName => fileName.endsWith('.json'))
  .sort();

let hasErrors = false;

for (const fileName of exampleFiles) {
  const filePath = join(examplesDir, fileName);
  const presentation = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = validatePresentation(presentation);

  if (!result.valid) {
    hasErrors = true;
    console.error(`✗ ${fileName} failed schema validation`);
    result.errors.forEach(error => {
      console.error(`  - ${error.path}: ${error.message}`);
    });
    continue;
  }

  const warningSummary = result.warnings.length
    ? ` (${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'})`
    : '';

  console.log(`✓ ${fileName}${warningSummary}`);
}

if (hasErrors) {
  process.exit(1);
}
