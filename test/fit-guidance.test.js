import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecommendations,
  calculateFitScore,
  createIssue,
  getFitSeverity,
  toIssueKey
} from '../src/utils/fit-guidance.js';

test('calculateFitScore starts at 100 and caps heavy penalties', () => {
  assert.equal(calculateFitScore([]), 100);
  assert.equal(calculateFitScore([createIssue('dense-media', 'Crowded slide', 24)]), 76);
  assert.equal(
    calculateFitScore([
      createIssue('dense-text', 'Too much copy', 80),
      createIssue('table-overflow', 'Table is too large', 40)
    ]),
    8
  );
});

test('getFitSeverity maps score bands to labels', () => {
  assert.equal(getFitSeverity(96), 'strong');
  assert.equal(getFitSeverity(88), 'good');
  assert.equal(getFitSeverity(76), 'tight');
  assert.equal(getFitSeverity(62), 'crowded');
});

test('buildRecommendations deduplicates by issue kind and limits output', () => {
  const recommendations = buildRecommendations([
    createIssue('dense-text', 'Long text block', 8),
    createIssue('dense-text', 'Another long text block', 8),
    createIssue('dense-media', 'Large image stack', 24),
    createIssue('table-overflow', 'Wide table', 18),
    createIssue('slide-overflow-horizontal', 'Layout spills right', 30)
  ]);

  assert.deepEqual(recommendations, [
    'Narrow wide content, break long strings, or simplify the layout.',
    'Shorten copy, reduce bullet count, or split the narrative across two slides.',
    'Reduce one media block or dedicate a separate slide to the larger visual.'
  ]);
});

test('toIssueKey normalizes labels for stable keys', () => {
  assert.equal(toIssueKey('Dense Media'), 'dense-media');
});
