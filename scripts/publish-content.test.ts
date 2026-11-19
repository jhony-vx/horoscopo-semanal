import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./publish-content.ts', import.meta.url));

function workspace(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), 'zodiac-content-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', script, ...args], { cwd, encoding: 'utf8' });
}

function read(cwd: string, ...path: string[]): string {
  return readFileSync(join(cwd, 'src', 'content', ...path), 'utf8');
}

test('prepare-day writes 12 drafts for today and 12 for tomorrow', (t) => {
  const cwd = workspace(t);
  const result = run(cwd, 'prepare-day', '--date=2026-11-18');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Contenido prepare-day validado para 2026-11-18/);
  const files = readdirSync(join(cwd, 'src', 'content', 'forecasts'));
  assert.equal(files.filter((name) => name.includes('-today-2026-11-18')).length, 12);
  assert.equal(files.filter((name) => name.includes('-tomorrow-2026-11-19')).length, 12);
  const aries = read(cwd, 'forecasts', 'aries-today-2026-11-18.md');
  assert.match(aries, /^status: draft$/m);
  assert.match(aries, /^summary: 'Hoy, Aries: /m);
  assert.match(aries, /## Suerte general\n\nHoy, /);
});

test('publish-day publishes both groups and prepare never overwrites them', (t) => {
  const cwd = workspace(t);
  run(cwd, 'prepare-day', '--date=2026-11-18');
  const published = run(cwd, 'publish-day', '--date=2026-11-18');
  assert.equal(published.status, 0, published.stderr);
  const before = read(cwd, 'forecasts', 'leo-tomorrow-2026-11-19.md');
  assert.match(before, /^status: published$/m);
  writeFileSync(join(cwd, 'src', 'content', 'forecasts', 'leo-today-2026-11-18.md'), read(cwd, 'forecasts', 'leo-today-2026-11-18.md').replace('Hoy, Leo:', 'Hoy, Leo (editado):'));

  assert.equal(run(cwd, 'prepare-day', '--date=2026-11-18').status, 0);
  assert.match(read(cwd, 'forecasts', 'leo-today-2026-11-18.md'), /Leo \(editado\)/);
});

test('consecutive days get different readings', (t) => {
  const cwd = workspace(t);
  run(cwd, 'prepare-day', '--date=2026-11-18');
  run(cwd, 'prepare-day', '--date=2026-11-19');
  const body = (date: string) => read(cwd, 'forecasts', `virgo-today-${date}.md`).split('---')[2];
  assert.notEqual(body('2026-11-18'), body('2026-11-19'));
});

test('a group with mixed statuses is rejected', (t) => {
  const cwd = workspace(t);
  run(cwd, 'prepare-day', '--date=2026-11-18');
  const file = join(cwd, 'src', 'content', 'forecasts', 'piscis-today-2026-11-18.md');
  writeFileSync(file, readFileSync(file, 'utf8').replace('status: draft', 'status: published'));
  const result = run(cwd, 'publish-day', '--date=2026-11-18');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Estados inconsistentes/);
});

test('prepare-week ranks the 12 signs from the sky and publish-week publishes them', (t) => {
  const cwd = workspace(t);
  // Any day of the week maps to its Monday.
  assert.equal(run(cwd, 'prepare-week', '--date=2026-11-18').status, 0);
  const ranks = readdirSync(join(cwd, 'src', 'content', 'horoscopes')).map((name) => Number(read(cwd, 'horoscopes', name).match(/^rank: (\d+)$/m)?.[1]));
  assert.deepEqual(ranks.sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const week = read(cwd, 'weeks', '2026-11-16.md');
  assert.match(week, /^weekEnd: '2026-11-22'$/m);
  assert.match(week, /^title: 'El Sol entra en Sagitario'$/m);
  assert.match(read(cwd, 'horoscopes', 'aries-2026-11-16.md'), /## El tono de tu semana/);

  assert.equal(run(cwd, 'publish-week', '--date=2026-11-16').status, 0);
  assert.match(read(cwd, 'weeks', '2026-11-16.md'), /^status: published$/m);
});

test('prepare-month covers the whole month and can backfill a past month', (t) => {
  const cwd = workspace(t);
  assert.equal(run(cwd, 'prepare-month', '--date=2026-09-10').status, 0);
  const capricornio = read(cwd, 'forecasts', 'capricornio-month-2026-09-01.md');
  assert.match(capricornio, /^periodEnd: '2026-09-30'$/m);
  assert.match(capricornio, /Durante setiembre, /);
  assert.equal(run(cwd, 'publish-month', '--date=2026-09-01').status, 0);
});

test('rejects unknown modes and invalid dates', (t) => {
  const cwd = workspace(t);
  const unknown = run(cwd, 'prepare-year');
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Usa: publish-content\.ts/);
  const badDate = run(cwd, 'prepare-day', '--date=2026-02-30');
  assert.notEqual(badDate.status, 0);
  assert.match(badDate.stderr, /Fecha inválida: 2026-02-30/);
});
