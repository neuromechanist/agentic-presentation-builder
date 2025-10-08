/**
 * Markdown processing utilities for browser
 * Converts markdown to HTML and sanitizes output
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Configure marked options
 */
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: false, // Don't add IDs to headers
  mangle: false // Don't mangle email addresses
});

/**
 * Convert markdown to safe HTML
 * @param {string} markdown - Markdown text
 * @returns {string} Sanitized HTML
 */
export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  // Convert markdown to HTML
  const html = marked.parse(markdown);

  // Sanitize HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'blockquote', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel']
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

  // Use marked's parseInline for inline content
  const html = marked.parseInline(markdown);

  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'u', 's', 'code', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel']
  });

  return cleanHtml;
}

export default {
  markdownToHtml,
  markdownInline
};
