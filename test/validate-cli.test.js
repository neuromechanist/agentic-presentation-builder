import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testFilePath = fileURLToPath(import.meta.url);
const cwd = dirname(dirname(testFilePath));

test('validate CLI supports structured JSON output for valid files', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate.js', 'examples/image-demo.json', '--json'],
    { cwd, encoding: 'utf-8' }
  );

  const result = JSON.parse(output);
  assert.equal(result.valid, true);
  assert.equal(result.summary.errorCount, 0);
  assert.equal(result.summary.warningCount, 2);
  assert.ok(result.warnings.every(warning => warning.code));
  assert.ok(result.warnings.every(warning => warning.suggestion));
});

test('validate CLI returns structured JSON and non-zero exit for invalid files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'presentation-validator-'));
  const invalidFile = join(dir, 'invalid.json');

  writeFileSync(invalidFile, JSON.stringify({
    presentation: {
      metadata: {
        title: 'Broken deck',
        theme: 'default'
      },
      slides: [
        {
          id: 'bad-slide',
          layout: 'single-column',
          elements: [
            {
              type: 'image'
            }
          ]
        }
      ]
    }
  }));

  try {
    execFileSync(
      process.execPath,
      ['scripts/validate.js', invalidFile, '--json'],
      { cwd, encoding: 'utf-8', stdio: 'pipe' }
    );
    assert.fail('Expected validation CLI to exit with a non-zero status');
  } catch (error) {
    const result = JSON.parse(error.stdout);
    assert.equal(result.valid, false);
    assert.ok(result.summary.errorCount > 0);
    assert.ok(result.errors.every(issue => issue.code));
    assert.ok(result.errors.every(issue => issue.suggestion));
  }
});
