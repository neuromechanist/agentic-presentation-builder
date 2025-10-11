/**
 * Presentation JSON validator using Ajv
 * Validates presentation JSON against the schema and provides clear error messages
 */

import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schema from file
const schemaPath = join(__dirname, '../../schema/presentation.schema.json');
const presentationSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

/**
 * Initialize Ajv validator with the presentation schema
 */
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
});

// Compile the schema
const validate = ajv.compile(presentationSchema);

/**
 * Validate a presentation JSON object
 * @param {object} presentationData - The presentation data to validate
 * @returns {{valid: boolean, errors: Array|null}} Validation result
 */
export function validatePresentation(presentationData) {
  const valid = validate(presentationData);

  if (valid) {
    return {
      valid: true,
      errors: null
    };
  }

  // Format errors to be more human/LLM-friendly
  const formattedErrors = validate.errors.map(error => {
    const { instancePath, message, params } = error;
    const path = instancePath || 'root';

    // Create helpful error messages
    let friendlyMessage = message;

    if (error.keyword === 'required') {
      friendlyMessage = `Missing required field: ${params.missingProperty}`;
    } else if (error.keyword === 'enum') {
      friendlyMessage = `Invalid value. Must be one of: ${params.allowedValues.join(', ')}`;
    } else if (error.keyword === 'type') {
      friendlyMessage = `Expected ${params.type} but got ${typeof error.data}`;
    } else if (error.keyword === 'minLength') {
      friendlyMessage = `Value must be at least ${params.limit} characters`;
    } else if (error.keyword === 'pattern') {
      friendlyMessage = `Value does not match required format (e.g., hex color: #FFFFFF)`;
    }

    return {
      path,
      message: friendlyMessage,
      originalMessage: message,
      keyword: error.keyword,
      params
    };
  });

  return {
    valid: false,
    errors: formattedErrors
  };
}

/**
 * Validate and throw if invalid
 * @param {object} presentationData - The presentation data to validate
 * @throws {Error} If validation fails
 */
export function validatePresentationStrict(presentationData) {
  const result = validatePresentation(presentationData);

  if (!result.valid) {
    const errorMessages = result.errors.map(err =>
      `  - ${err.path}: ${err.message}`
    ).join('\n');

    throw new Error(`Presentation validation failed:\n${errorMessages}`);
  }

  return true;
}

/**
 * Get a formatted validation report
 * @param {object} presentationData - The presentation data to validate
 * @returns {string} Human-readable validation report
 */
export function getValidationReport(presentationData) {
  const result = validatePresentation(presentationData);

  if (result.valid) {
    return '✓ Presentation is valid';
  }

  const errorList = result.errors.map((err, index) =>
    `${index + 1}. Path: ${err.path}\n   Error: ${err.message}`
  ).join('\n\n');

  return `✗ Presentation has ${result.errors.length} validation error(s):\n\n${errorList}`;
}

export default {
  validatePresentation,
  validatePresentationStrict,
  getValidationReport
};
