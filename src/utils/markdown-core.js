/**
 * Shared markdown rendering helpers.
 */

import { marked } from 'marked';

const ALERT_TITLES = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution'
};

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

export const MARKDOWN_ALLOWED_TAGS = [
  'a', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong', 'u', 'ul'
];

export const MARKDOWN_ALLOWED_ATTR = ['class', 'href', 'rel', 'target', 'title'];

export const INLINE_ALLOWED_TAGS = ['a', 'code', 'em', 's', 'span', 'strong', 'u'];

export function renderMarkdown(markdown, inline = false) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  return inline ? marked.parseInline(markdown) : marked.parse(markdown);
}

export function enhanceMarkdownHtml(html, createDocument) {
  const document = createDocument(`<body>${html}</body>`);
  transformGitHubAlerts(document);
  return document.body.innerHTML;
}

function transformGitHubAlerts(document) {
  document.querySelectorAll('blockquote').forEach(blockquote => {
    const firstParagraph = Array.from(blockquote.children).find(child => child.tagName === 'P');
    if (!firstParagraph) {
      return;
    }

    const markerMatch = firstParagraph.textContent.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
    if (!markerMatch) {
      return;
    }

    const type = markerMatch[1].toLowerCase();
    const alert = document.createElement('div');
    alert.className = `markdown-alert markdown-alert-${type}`;

    const title = document.createElement('p');
    title.className = 'markdown-alert-title';
    title.textContent = ALERT_TITLES[type];
    alert.appendChild(title);

    firstParagraph.innerHTML = firstParagraph.innerHTML
      .replace(/^\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '')
      .replace(/^(<br\s*\/?>\s*)+/i, '');

    if (!firstParagraph.textContent.trim()) {
      firstParagraph.remove();
    }

    while (blockquote.firstChild) {
      alert.appendChild(blockquote.firstChild);
    }

    blockquote.replaceWith(alert);
  });
}
