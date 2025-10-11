#!/usr/bin/env node
/**
 * Command-line validation script for presentation JSON files
 * Usage: node scripts/validate.js <path-to-json>
 */

import { readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/validate.js <path-to-json>');
  console.error('Example: node scripts/validate.js examples/hello-world.json');
  process.exit(1);
}

const filePath = resolve(args[0]);

try {
  console.log(`Validating: ${filePath}\n`);

  // Load schema
  const schemaPath = join(__dirname, '../schema/presentation.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

  // Load presentation
  const fileContent = readFileSync(filePath, 'utf-8');
  const presentation = JSON.parse(fileContent);

  // Validate
  const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(presentation);

  if (valid) {
    console.log('✓ Presentation is valid');
  } else {
    console.log(`✗ Presentation has ${validate.errors.length} validation error(s):\n`);

    validate.errors.forEach((error, index) => {
      const path = error.instancePath || 'root';
      let message = error.message;

      if (error.keyword === 'required') {
        message = `Missing required field: ${error.params.missingProperty}`;
      } else if (error.keyword === 'enum') {
        message = `Invalid value. Must be one of: ${error.params.allowedValues.join(', ')}`;
      } else if (error.keyword === 'type') {
        message = `Expected ${error.params.type}`;
      }

      console.log(`${index + 1}. Path: ${path}`);
      console.log(`   Error: ${message}\n`);
    });

    process.exit(1);
  }

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
