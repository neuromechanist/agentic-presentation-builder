import test from 'node:test';
import assert from 'node:assert/strict';
import { getPresentationWarnings, validatePresentation } from '../src/validator/index.js';

function createPresentation(slides) {
  return {
    presentation: {
      metadata: {
        title: 'Validation Demo',
        theme: 'default'
      },
      slides
    }
  };
}

test('getPresentationWarnings flags dense authoring patterns', () => {
  const warnings = getPresentationWarnings(createPresentation([
    {
      id: 'dense-slide',
      elements: [
        {
          type: 'text',
          content: '# Intro\n' + 'word '.repeat(61).trim()
        },
        {
          type: 'bullets',
          items: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']
        },
        {
          type: 'image',
          src: '/examples/assets/sample-1.jpg'
        },
        {
          type: 'mermaid',
          diagram: 'graph TD\nA[One] --> B[Two]\nB --> C[Three]\nC --> D[Four]\nD --> E[Five]\nE --> F[Six]\nF --> G[Seven]\nG --> H[Eight]\nH --> I[Nine]\nI --> J[Ten]\nJ --> K[Eleven]'
        },
        {
          type: 'code',
          code: "console.log('hello');"
        },
        {
          type: 'text',
          content: 'Reveal item',
          animation: { fragment: true }
        },
        {
          type: 'text',
          content: 'Reveal item',
          animation: { fragment: true }
        },
        {
          type: 'text',
          content: 'Reveal item',
          animation: { fragment: true }
        },
        {
          type: 'text',
          content: 'Reveal item',
          animation: { fragment: true }
        },
        {
          type: 'text',
          content: 'Reveal item',
          animation: { fragment: true }
        },
        {
          type: 'text',
          content: 'Reveal item',
          animation: { fragment: true }
        }
      ]
    }
  ]));

  assert.equal(warnings.length, 6);
  assert.equal(warnings[0].severity, 'warning');
  assert.equal(warnings[0].slideId, 'dense-slide');
  assert.ok(warnings[0].suggestion);
  assert.match(warnings[0].message, /dense/i);
  assert.ok(warnings.some(warning => /bullet items/.test(warning.message)));
  assert.ok(warnings.some(warning => /heavy media blocks/.test(warning.message)));
  assert.ok(warnings.some(warning => /missing alt text/i.test(warning.message)));
  assert.ok(warnings.some(warning => /complex/i.test(warning.message)));
  assert.ok(warnings.some(warning => /fragments/i.test(warning.message)));
});

test('getPresentationWarnings recommends percentages on dense fixed-size image slides', () => {
  const warnings = getPresentationWarnings(createPresentation([
    {
      id: 'image-sizing-warning',
      layout: 'single-column',
      elements: [
        {
          type: 'image',
          src: '/examples/assets/sample-1.jpg',
          width: '900px',
          height: 'auto',
          alt: 'Landscape image'
        },
        {
          type: 'code',
          code: "console.log('dense media');"
        }
      ]
    }
  ]));

  assert.equal(warnings.length, 2);
  assert.ok(warnings.some(warning => /heavy media blocks/i.test(warning.message)));
  assert.ok(warnings.some(warning => /percentage widths/i.test(warning.message)));
});

test('validatePresentation returns warnings without failing valid decks', () => {
  const result = validatePresentation(createPresentation([
    {
      id: 'warning-only',
      layout: 'single-column',
      elements: [
        {
          type: 'image',
          src: '/examples/assets/sample-1.jpg'
        }
      ]
    }
  ]));

  assert.equal(result.valid, true);
  assert.equal(result.errors, null);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, 'missing-image-alt');
  assert.match(result.warnings[0].message, /alt text/i);
});

test('validatePresentation still fails schema-invalid decks while keeping warnings', () => {
  const result = validatePresentation(createPresentation([
    {
      id: 'invalid-slide',
      layout: 'single-column',
      elements: [
        {
          type: 'image'
        }
      ]
    }
  ]));

  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
  assert.equal(result.errors[0].severity, 'error');
  assert.ok(result.errors[0].suggestion);
  assert.equal(result.warnings.length, 1);
});
