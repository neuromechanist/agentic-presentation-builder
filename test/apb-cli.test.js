import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const testFilePath = fileURLToPath(import.meta.url);
const cwd = dirname(dirname(testFilePath));

function runApb(args, options = {}) {
  return execFileSync(process.execPath, ['bin/apb.js', ...args], {
    cwd,
    encoding: 'utf-8',
    stdio: 'pipe',
    ...options,
  });
}

test('apb dispatches validate to the same structured JSON output as the script', () => {
  const output = runApb(['validate', 'examples/image-demo.json', '--json']);
  const result = JSON.parse(output);

  assert.equal(result.valid, true);
  assert.equal(result.summary.errorCount, 0);
});

test('apb with no subcommand prints usage and exits 0', () => {
  const output = runApb([]);
  assert.match(output, /Usage: apb <command>/);
  assert.match(output, /validate/);
  assert.match(output, /present/);
  assert.match(output, /export/);
});

test('apb with an unknown subcommand exits non-zero and prints usage', () => {
  try {
    runApb(['unknown-cmd']);
    assert.fail('Expected apb to exit with a non-zero status for an unknown command');
  } catch (error) {
    assert.equal(error.status, 1);
    assert.match(error.stderr, /Unknown command: unknown-cmd/);
    assert.match(error.stderr, /Usage: apb <command>/);
  }
});
