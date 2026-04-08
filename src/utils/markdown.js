/**
 * Markdown processing utilities
 * Converts markdown to HTML and sanitizes output
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {
  enhanceMarkdownHtml,
  INLINE_ALLOWED_TAGS,
  MARKDOWN_ALLOWED_ATTR,
  MARKDOWN_ALLOWED_TAGS,
  renderMarkdown
} from './markdown-core.js';

// Create a JSDOM window for DOMPurify in Node.js environment
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Convert markdown to safe HTML
 * @param {string} markdown - Markdown text
 * @returns {string} Sanitized HTML
 */
export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  const html = enhanceMarkdownHtml(
    renderMarkdown(markdown),
    source => new JSDOM(source).window.document
  );

  const cleanHtml = purify.sanitize(html, {
    ALLOWED_TAGS: MARKDOWN_ALLOWED_TAGS,
    ALLOWED_ATTR: MARKDOWN_ALLOWED_ATTR
  });

  return cleanHtml;
}

/**
 * Process inline markdown (single line, no block elements)
 * @param {string} markdown - Markdown text
 * @returns {string} Sanitized HTML (inline)
 */
export function markdownInline(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  const html = renderMarkdown(markdown, true);

  const cleanHtml = purify.sanitize(html, {
    ALLOWED_TAGS: INLINE_ALLOWED_TAGS,
    ALLOWED_ATTR: MARKDOWN_ALLOWED_ATTR
  });

  return cleanHtml;
}

export default {
  markdownToHtml,
  markdownInline
};
