import test from 'node:test';
import assert from 'node:assert/strict';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { parsePresentation } from '../src/parser/index.js';
import { renderPresentation } from '../src/renderer/index.js';

const { window } = new JSDOM('');
const purify = DOMPurify(window);
DOMPurify.sanitize = purify.sanitize.bind(purify);
globalThis.window = window;
globalThis.document = window.document;

function renderDeck(slides) {
  return renderPresentation(parsePresentation({
    presentation: {
      metadata: {
        title: 'Fragment Tests',
        theme: 'default'
      },
      slides
    }
  }));
}

test('renderPresentation applies fragment classes to callouts and code blocks', () => {
  const html = renderDeck([
    {
      id: 'mixed-fragments',
      elements: [
        {
          type: 'callout',
          calloutType: 'info',
          content: 'Callout reveal',
          animation: {
            fragment: true,
            type: 'slide-up',
            index: 0
          }
        },
        {
          type: 'code',
          code: "console.log('fragment');",
          animation: {
            fragment: true,
            type: 'zoom',
            index: 1
          }
        }
      ]
    }
  ]);

  assert.match(html, /class="callout callout-info fragment fade-up"/);
  assert.match(html, /class="code-element fragment zoom-in"/);
  assert.match(html, /data-fragment-index="0"/);
  assert.match(html, /data-fragment-index="1"/);
});

test('renderPresentation supports fragment animations on individual bullet items', () => {
  const html = renderDeck([
    {
      id: 'bullet-item-fragments',
      elements: [
        {
          type: 'bullets',
          items: [
            {
              text: 'First reveal',
              animation: {
                fragment: true,
                type: 'fade',
                index: 0
              }
            },
            {
              text: 'Second reveal',
              animation: {
                fragment: true,
                type: 'slide-up',
                index: 1
              },
              children: [
                {
                  text: 'Nested reveal',
                  animation: {
                    fragment: true,
                    type: 'zoom',
                    index: 2
                  }
                }
              ]
            },
            'Always visible'
          ]
        }
      ]
    }
  ]);

  assert.match(html, /<li class="fragment fade-in" data-fragment-index="0"><p>First reveal<\/p>\s*<\/li>/);
  assert.match(html, /<li class="fragment fade-up" data-fragment-index="1"><p>Second reveal<\/p>\s*<ul>/);
  assert.match(html, /<li class="fragment zoom-in" data-fragment-index="2"><p>Nested reveal<\/p>\s*<\/li>/);
  assert.match(html, /<li><p>Always visible<\/p>\s*<\/li>/);
});

test('renderPresentation renders speaker notes as markdown HTML', () => {
  const html = renderDeck([
    {
      id: 'speaker-notes-markdown',
      speakerNotes: '[Press -> 3x]\n\n- First point\n- Second point',
      elements: [
        {
          type: 'text',
          content: 'Slide body'
        }
      ]
    }
  ]);

  assert.match(html, /<aside class="notes">/);
  assert.match(html, /<p>\[Press -&gt; 3x\]<\/p>/);
  assert.match(html, /<ul>\s*<li>First point<\/li>\s*<li>Second point<\/li>\s*<\/ul>/);
});
