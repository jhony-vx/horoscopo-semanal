import assert from 'node:assert/strict';
import test from 'node:test';
import { editionTimeline, movementDescription, movementLabel, rankMovement, ranksBySign } from './editions.ts';

const weeks = ['2026-11-02', '2026-11-16', '2026-11-09', '2026-11-23'].map((start) => ({ start }));
const startOf = (week: { start: string }) => week.start;

test('the current edition is the latest one that already started', () => {
  const timeline = editionTimeline(weeks, startOf, '2026-11-19');
  assert.equal(timeline.current?.start, '2026-11-16');
  assert.equal(timeline.previous?.start, '2026-11-09');
  // The week prepared ahead of time is not in the archive yet.
  assert.deepEqual(timeline.archive.map(startOf), ['2026-11-16', '2026-11-09', '2026-11-02']);
});

test('a new week replaces the current one on its first day', () => {
  assert.equal(editionTimeline(weeks, startOf, '2026-11-23').current?.start, '2026-11-23');
});

test('without started editions the newest prepared one is shown', () => {
  const timeline = editionTimeline(weeks, startOf, '2026-10-01');
  assert.equal(timeline.current?.start, '2026-11-23');
  assert.equal(timeline.previous, undefined);
  assert.deepEqual(editionTimeline([], startOf, '2026-10-01'), { current: undefined, previous: undefined, archive: [] });
});

test('rank movement compares with the previous edition', () => {
  const previous = ranksBySign([{ sign: 'leo', rank: 5 }, { sign: 'aries', rank: 1 }, { sign: 'virgo', rank: 3 }]);
  assert.deepEqual(rankMovement(2, previous.get('leo')), { kind: 'up', places: 3 });
  assert.deepEqual(rankMovement(4, previous.get('aries')), { kind: 'down', places: 3 });
  assert.deepEqual(rankMovement(3, previous.get('virgo')), { kind: 'same' });
  assert.deepEqual(rankMovement(7, previous.get('piscis')), { kind: 'new' });
});

test('movement labels avoid arrows and read naturally', () => {
  assert.equal(movementLabel({ kind: 'up', places: 2 }), '+2');
  assert.equal(movementLabel({ kind: 'down', places: 1 }), '−1');
  assert.equal(movementLabel({ kind: 'same' }), '=');
  assert.equal(movementLabel({ kind: 'new' }), '');
  assert.equal(movementDescription({ kind: 'up', places: 1 }), 'Subió 1 puesto desde la semana pasada');
  assert.equal(movementDescription({ kind: 'down', places: 4 }), 'Bajó 4 puestos desde la semana pasada');
});
