import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_TERMINAL_PROMPT: '0' };

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function commit(cwd, path, content) {
  mkdirSync(dirname(join(cwd, path)), { recursive: true });
  writeFileSync(join(cwd, path), content);
  git(cwd, 'add', path);
  git(cwd, 'commit', '-m', 'fixture');
}

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'zodiac-push-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const remote = join(dir, 'remote.git');
  const editor = join(dir, 'editor');
  const runner = join(dir, 'runner');
  git(dir, 'init', '--bare', '--initial-branch=main', remote);
  git(dir, 'clone', remote, editor);
  git(editor, 'config', 'user.name', 'Test');
  git(editor, 'config', 'user.email', 'test@example.com');
  commit(editor, 'src/content/forecasts/existing.md', 'original\n');
  git(editor, 'push', 'origin', 'main');
  git(dir, 'clone', remote, runner);
  const helper = join(root, 'scripts/push-publication.sh');
  if (existsSync(helper)) {
    mkdirSync(join(runner, 'scripts'));
    writeFileSync(join(runner, 'scripts/push-publication.sh'), readFileSync(helper));
    git(runner, 'config', 'user.name', 'Test');
    git(runner, 'config', 'user.email', 'test@example.com');
    git(runner, 'add', 'scripts');
    git(runner, 'commit', '-m', 'test helper');
  }
  return { remote, editor, runner };
}

function publish(runner, period = 'monthly') {
  const workflow = readFileSync(join(root, `.github/workflows/publish-${period}.yml`), 'utf8');
  const block = workflow.split('      - name: Commit and push publication')[1].split('        run: |')[1];
  const script = block.replace(/^          /gm, '');
  return spawnSync(bash, ['-e', '-c', script], { cwd: runner, env, encoding: 'utf8' });
}

test('publica el mes aunque main avance después del checkout', (t) => {
  const { remote, editor, runner } = fixture(t);
  commit(editor, 'README.md', 'cambio remoto\n');
  git(editor, 'push', 'origin', 'main');
  writeFileSync(join(runner, 'src/content/forecasts/aries-month.md'), 'publicado\n');
  const result = publish(runner);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(git(remote, 'show', 'main:README.md'), 'cambio remoto');
  assert.equal(git(remote, 'show', 'main:src/content/forecasts/aries-month.md'), 'publicado');
});

test('sin contenido nuevo no crea commits ni publica', (t) => {
  const { remote, runner } = fixture(t);
  const before = git(remote, 'rev-parse', 'main');
  const result = publish(runner);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(git(remote, 'rev-parse', 'main'), before);
});

for (const [period, contentPath] of [
  ['daily', 'src/content/forecasts/aries-day.md'],
  ['weekly', 'src/content/weeks/week.md'],
]) {
  test(`sincroniza también el flujo ${period}`, (t) => {
    const { remote, editor, runner } = fixture(t);
    commit(editor, 'README.md', 'cambio remoto\n');
    git(editor, 'push', 'origin', 'main');
    mkdirSync(join(runner, 'src/content/horoscopes'), { recursive: true });
    mkdirSync(dirname(join(runner, contentPath)), { recursive: true });
    writeFileSync(join(runner, contentPath), 'publicado\n');
    const result = publish(runner, period);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(git(remote, 'show', 'main:README.md'), 'cambio remoto');
    assert.equal(git(remote, 'show', `main:${contentPath}`), 'publicado');
  });
}

test('reintenta si main avanza entre el fetch y el push', (t) => {
  const { remote, editor, runner } = fixture(t);
  commit(editor, 'README.md', 'cambio durante el push\n');
  // El primer pre-push adelanta el remoto; el siguiente ya no lo modifica.
  const quote = (value) => `'${value.replaceAll('\\', '/').replaceAll("'", "'\\''")}'`;
  const hook = join(runner, '.git/hooks/pre-push');
  writeFileSync(hook, `#!/bin/sh\nif [ ! -f .git/push-race-done ]; then\n  touch .git/push-race-done\n  git -C ${quote(editor)} push origin main || exit 1\nfi\n`);
  chmodSync(hook, 0o755);
  git(runner, 'config', 'core.hooksPath', '.git/hooks');
  writeFileSync(join(runner, 'src/content/forecasts/aries-month.md'), 'publicado\n');
  const result = publish(runner);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, /intento 1\/3/);
  assert.equal(git(remote, 'show', 'main:README.md'), 'cambio durante el push');
  assert.equal(git(remote, 'show', 'main:src/content/forecasts/aries-month.md'), 'publicado');
});

test('un conflicto detiene la publicación y conserva main remoto', (t) => {
  const { remote, editor, runner } = fixture(t);
  commit(editor, 'src/content/forecasts/existing.md', 'edición remota\n');
  git(editor, 'push', 'origin', 'main');
  const before = git(remote, 'rev-parse', 'main');
  writeFileSync(join(runner, 'src/content/forecasts/existing.md'), 'edición automática\n');
  const result = publish(runner);
  assert.notEqual(result.status, 0);
  assert.equal(git(remote, 'rev-parse', 'main'), before);
  assert.equal(git(runner, 'diff', '--name-only', '--diff-filter=U'), '');
});
