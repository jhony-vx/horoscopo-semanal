import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pruneDailyForecasts, selectExpiredDailyForecasts } from './prune-forecasts.ts';

test('selects daily forecasts older than the retention window', () => {
  const files = [
    'aries-today-2026-10-18.md',
    'aries-today-2026-10-19.md',
    'leo-tomorrow-2026-10-17.md',
    'leo-tomorrow-2026-11-19.md',
  ];
  assert.deepEqual(selectExpiredDailyForecasts(files, '2026-11-18', 30), [
    'aries-today-2026-10-18.md',
    'leo-tomorrow-2026-10-17.md',
  ]);
});

test('keeps monthly forecasts and files that do not follow the naming pattern', () => {
  const files = ['aries-month-2026-01-01.md', 'README.md', 'aries-today-draft.md'];
  assert.deepEqual(selectExpiredDailyForecasts(files, '2026-11-18', 30), []);
});

test('deletes only the expired files from the directory', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'zodiac-prune-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(dir, { recursive: true });
  for (const name of ['aries-today-2026-01-01.md', 'aries-today-2026-11-18.md', 'aries-month-2026-01-01.md']) {
    writeFileSync(join(dir, name), 'x');
  }

  const removed = pruneDailyForecasts(dir, '2026-11-18', 30);

  assert.deepEqual(removed, ['aries-today-2026-01-01.md']);
  assert.deepEqual(readdirSync(dir).sort(), ['aries-month-2026-01-01.md', 'aries-today-2026-11-18.md']);
});
