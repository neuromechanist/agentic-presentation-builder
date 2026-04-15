import test from 'node:test';
import assert from 'node:assert/strict';
import { getAssetIdFromPath } from '../scripts/present.js';

test('getAssetIdFromPath extracts the generated asset id from CLI asset routes', () => {
  assert.equal(
    getAssetIdFromPath('/__agentic__/asset/asset-1/claude-face.svg'),
    'asset-1'
  );
  assert.equal(
    getAssetIdFromPath('/__agentic__/asset/asset-12/sample-1.jpg'),
    'asset-12'
  );
});
