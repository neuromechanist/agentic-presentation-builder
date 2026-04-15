import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createImportedDeckFileCatalog,
  rewriteImportedPresentationAssetPaths
} from '../src/utils/local-deck.js';

test('createImportedDeckFileCatalog strips the selected root folder prefix', () => {
  const files = [
    { name: 'demo.json', webkitRelativePath: 'deck/demo.json' },
    { name: 'chart.png', webkitRelativePath: 'deck/images/chart.png' },
    { name: 'logo.png', webkitRelativePath: 'deck/shared/logo.png' }
  ];

  const catalog = createImportedDeckFileCatalog(files);

  assert.deepEqual(catalog.jsonFiles, ['demo.json']);
  assert.ok(catalog.filesByPath.has('images/chart.png'));
  assert.ok(catalog.filesByPath.has('shared/logo.png'));
});

test('rewriteImportedPresentationAssetPaths resolves relative and root-relative asset paths', () => {
  const presentation = {
    presentation: {
      metadata: {
        title: 'Local Deck',
        theme: 'default'
      },
      slides: [
        {
          background: './images/background.png',
          elements: [
            {
              type: 'image',
              src: '../shared/logo.png'
            },
            {
              type: 'image',
              src: '/shared/logo.png'
            },
            {
              type: 'image',
              src: 'https://example.com/remote.png'
            }
          ]
        }
      ]
    }
  };

  const filesByPath = new Map([
    ['decks/demo.json', { name: 'demo.json' }],
    ['decks/images/background.png', { name: 'background.png' }],
    ['shared/logo.png', { name: 'logo.png' }]
  ]);

  const seenFiles = [];
  const result = rewriteImportedPresentationAssetPaths(presentation, {
    createObjectUrl(file) {
      seenFiles.push(file.name);
      return `blob:${file.name}`;
    },
    filesByPath,
    jsonRelativePath: 'decks/demo.json'
  });

  assert.equal(result.presentationData.presentation.slides[0].background, 'blob:background.png');
  assert.equal(result.presentationData.presentation.slides[0].elements[0].src, 'blob:logo.png');
  assert.equal(result.presentationData.presentation.slides[0].elements[1].src, 'blob:logo.png');
  assert.equal(
    result.presentationData.presentation.slides[0].elements[2].src,
    'https://example.com/remote.png'
  );
  assert.deepEqual(seenFiles, ['background.png', 'logo.png']);
  assert.equal(result.objectUrls.length, 2);
  assert.equal(result.unresolvedAssets.length, 0);
});

test('rewriteImportedPresentationAssetPaths reports unresolved relative assets', () => {
  const presentation = {
    presentation: {
      metadata: {
        title: 'Missing Assets',
        theme: 'default'
      },
      slides: [
        {
          elements: [
            {
              type: 'image',
              src: './images/missing.png'
            }
          ]
        }
      ]
    }
  };

  const result = rewriteImportedPresentationAssetPaths(presentation, {
    createObjectUrl() {
      assert.fail('createObjectUrl should not be called for missing assets');
    },
    filesByPath: new Map([['demo.json', { name: 'demo.json' }]]),
    jsonRelativePath: 'demo.json'
  });

  assert.equal(result.presentationData.presentation.slides[0].elements[0].src, './images/missing.png');
  assert.deepEqual(result.unresolvedAssets, [
    {
      assetPath: './images/missing.png',
      resolvedPath: 'images/missing.png'
    }
  ]);
});
