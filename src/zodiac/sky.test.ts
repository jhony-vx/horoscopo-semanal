import assert from 'node:assert/strict';
import test from 'node:test';
import { moonPhaseFromAngle, skyOn } from './sky.ts';

const SCORPIO = 7;
const SAGITTARIUS = 8;

test('places the Sun in its tropical sign for the date', () => {
  assert.equal(skyOn('2026-11-18').bodies.sun.signIndex, SCORPIO);
  assert.equal(skyOn('2026-12-01').bodies.sun.signIndex, SAGITTARIUS);
});

test('the Moon changes sign within a few days', () => {
  const signs = new Set(['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'].map((date) => skyOn(date).bodies.moon.signIndex));
  assert.ok(signs.size >= 2, 'the Moon should cross at least one sign boundary in four days');
});

test('detects Mercury retrograde during its 2026 November station', () => {
  // Mercury is retrograde from 2026-10-24 to 2026-11-13 (geocentric ephemeris).
  assert.equal(skyOn('2026-11-01').bodies.mercury.retrograde, true);
  assert.equal(skyOn('2026-10-15').bodies.mercury.retrograde, false);
  assert.equal(skyOn('2026-11-18').bodies.mercury.retrograde, false);
});

test('the Sun and the Moon are never retrograde', () => {
  const sky = skyOn('2026-11-18');
  assert.equal(sky.bodies.sun.retrograde, false);
  assert.equal(sky.bodies.moon.retrograde, false);
});

test('names the Moon phase from its angle', () => {
  assert.equal(moonPhaseFromAngle(0), 'new');
  assert.equal(moonPhaseFromAngle(359), 'new');
  assert.equal(moonPhaseFromAngle(90), 'first-quarter');
  assert.equal(moonPhaseFromAngle(180), 'full');
  assert.equal(moonPhaseFromAngle(270), 'last-quarter');
  assert.equal(moonPhaseFromAngle(135), 'waxing-gibbous');
});

test('finds the exact new moon with its Lima date and sign', async () => {
  const { lunationsBetween } = await import('./sky.ts');
  // New moon 2027-02-06 15:56 UTC in Aquarius (index 10).
  assert.deepEqual(lunationsBetween('2027-02-01', '2027-02-07'), [{ phase: 'new', date: '2027-02-06', signIndex: 10 }]);
  // The 2027-07-04 new moon belongs to the previous week.
  assert.equal(lunationsBetween('2027-07-05', '2027-07-11').some((lunation) => lunation.phase === 'new'), false);
});
