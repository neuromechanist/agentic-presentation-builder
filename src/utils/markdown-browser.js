/**
 * Markdown processing utilities for browser
 * Converts markdown to HTML and sanitizes output
 */

import DOMPurify from 'dompurify';
import {
  enhanceMarkdownHtml,
  INLINE_ALLOWED_TAGS,
  MARKDOWN_ALLOWED_ATTR,
  MARKDOWN_ALLOWED_TAGS,
  renderMarkdown
} from './markdown-core.js';

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
    source => {
      const doc = document.implementation.createHTMLDocument('');
      doc.body.innerHTML = source.replace(/^<body>|<\/body>$/g, '');
      return doc;
    }
  );

  const cleanHtml = DOMPurify.sanitize(html, {
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

  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: INLINE_ALLOWED_TAGS,
    ALLOWED_ATTR: MARKDOWN_ALLOWED_ATTR
  });

  return cleanHtml;
}

export default {
  markdownToHtml,
  markdownInline
};
