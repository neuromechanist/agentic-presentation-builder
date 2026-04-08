import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from '../src/utils/markdown.js';

test('markdownToHtml converts GitHub alerts into styled alert blocks', () => {
  const html = markdownToHtml('> [!WARNING]\n> Check this carefully before presenting.');

  assert.match(html, /markdown-alert markdown-alert-warning/);
  assert.match(html, /markdown-alert-title">Warning</);
  assert.match(html, /Check this carefully before presenting\./);
});

test('markdownToHtml preserves fenced code block language classes', () => {
  const html = markdownToHtml('```js\nconsole.log("hi");\n```');

  assert.match(html, /<pre><code class="language-js">/);
  assert.match(html, /console\.log/);
});

test('markdownToHtml preserves math delimiters for KaTeX rendering', () => {
  const html = markdownToHtml('Inline math $E=mc^2$ and block math:\n\n$$a^2+b^2=c^2$$');

  assert.match(html, /\$E=mc\^2\$/);
  assert.match(html, /\$\$a\^2\+b\^2=c\^2\$\$/);
});
