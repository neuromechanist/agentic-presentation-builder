/**
 * Browser-compatible entry point
 * Same as index.js but without Node.js specific modules
 */

import { validatePresentationStrict } from './validator/index.js';
import { parsePresentation } from './parser/index.js';
import { renderPresentation } from './renderer/index.js';
import { generateThemeCSS } from './utils/theme.js';

/**
 * Build presentation from JSON
 * @param {object} presentationData - Raw presentation JSON
 * @returns {object} Built presentation with HTML and metadata
 */
export function buildPresentation(presentationData) {
  // Step 1: Validate
  validatePresentationStrict(presentationData);

  // Step 2: Parse
  const parsed = parsePresentation(presentationData);

  // Step 3: Generate theme CSS
  const themeCSS = generateThemeCSS(parsed.metadata.theme, parsed.metadata.customTheme);

  // Step 4: Render slides to HTML
  const slidesHTML = renderPresentation(parsed);

  // Step 5: Get aspect ratio dimensions
  const dimensions = getAspectRatioDimensions(parsed.metadata.aspectRatio);

  return {
    metadata: parsed.metadata,
    slidesHTML,
    themeCSS,
    dimensions
  };
}

/**
 * Get dimensions for aspect ratio
 * @param {string} aspectRatio - Aspect ratio (16:9 or 4:3)
 * @returns {object} Width and height
 */
function getAspectRatioDimensions(aspectRatio) {
  if (aspectRatio === '4:3') {
    return { width: 1024, height: 768 };
  }
  // Default to 16:9
  return { width: 1920, height: 1080 };
}

export default {
  buildPresentation
};
