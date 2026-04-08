/**
 * Presentation JSON validator using Ajv
 * Validates presentation JSON against the schema and provides clear error messages
 */

import Ajv from 'ajv';
import presentationSchema from '../../schema/presentation.schema.json' with { type: 'json' };
export { getPresentationWarnings } from './advisory.js';
import { getPresentationWarnings } from './advisory.js';

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
 * @returns {{valid: boolean, errors: Array|null, warnings: Array}} Validation result
 */
export function validatePresentation(presentationData) {
  const warnings = getPresentationWarnings(presentationData);
  const valid = validate(presentationData);

  if (valid) {
    return {
      valid: true,
      errors: null,
      warnings
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
      code: `schema-${error.keyword}`,
      severity: 'error',
      path,
      message: friendlyMessage,
      suggestion: getValidationSuggestion(error),
      originalMessage: message,
      keyword: error.keyword,
      params
    };
  });

  return {
    valid: false,
    errors: formattedErrors,
    warnings
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
  const warningSection = formatWarningSection(result.warnings);

  if (result.valid) {
    return `✓ Presentation is valid${warningSection}`;
  }

  const errorList = result.errors.map((err, index) =>
    `${index + 1}. Path: ${err.path}\n   Error: ${err.message}`
  ).join('\n\n');

  return `✗ Presentation has ${result.errors.length} validation error(s):\n\n${errorList}${warningSection}`;
}

function formatWarningSection(warnings) {
  if (!warnings.length) {
    return '';
  }

  const warningList = warnings.map((warning, index) =>
    `${index + 1}. Slide: ${warning.slideTitle}\n   Warning: ${warning.message}\n   Suggestion: ${warning.suggestion}`
  ).join('\n\n');

  return `\n\nWarnings (${warnings.length}):\n\n${warningList}`;
}

function getValidationSuggestion(error) {
  if (error.keyword === 'required') {
    return `Add the missing \`${error.params.missingProperty}\` field at this location.`;
  }
  if (error.keyword === 'enum') {
    return `Replace the value with one of the allowed options: ${error.params.allowedValues.join(', ')}.`;
  }
  if (error.keyword === 'type') {
    return `Update the value so it matches the expected ${error.params.type} type.`;
  }
  if (error.keyword === 'minLength') {
    return `Provide at least ${error.params.limit} characters for this field.`;
  }
  if (error.keyword === 'pattern') {
    return 'Update the value to match the documented format for this field.';
  }

  return 'Adjust this field to satisfy the presentation schema.';
}

export default {
  validatePresentation,
  validatePresentationStrict,
  getValidationReport,
  getPresentationWarnings
};
