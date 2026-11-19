import assert from 'node:assert/strict';
import test from 'node:test';
import { polar, signAngle, trinePaths, WHEEL_CENTER, wheelSectors } from './wheel.ts';

test('Aries sits on the left and the signs follow counterclockwise', () => {
  assert.equal(signAngle(0), 180);
  // Tauro is below Aries on screen (the SVG y axis points down).
  assert.equal(signAngle(1), 150);
  assert.ok(polar(100, signAngle(1)).y > WHEEL_CENTER);
  assert.equal(signAngle(6), 0);
  assert.equal(signAngle(11), 210);
});

test('every sector has its Spanish name and a label inside the path', () => {
  const sectors = wheelSectors();
  assert.deepEqual(sectors.map((sector) => sector.name).slice(0, 3), ['Aries', 'Tauro', 'Géminis']);
  for (const sector of sectors) {
    assert.ok(sector.labelOffset > 3 && sector.labelOffset < 97, `${sector.slug}: ${sector.labelOffset}`);
  }
  assert.equal(new Set(sectors.map((sector) => sector.labelOffset)).size, 12);
});

test('each trine joins three signs of the same element', () => {
  const trines = trinePaths();
  assert.deepEqual(trines.map((trine) => trine.elementKey), ['fire', 'earth', 'air', 'water']);
  for (const trine of trines) assert.equal(trine.d.split('L').length, 3);
});
