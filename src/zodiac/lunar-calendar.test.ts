import assert from 'node:assert/strict';
import test from 'node:test';
import { lunarMonth } from './lunar-calendar.ts';
import { phaseEventsBetween } from './sky.ts';

test('a lunar month has one entry per day and starts the grid on Monday', () => {
  const november = lunarMonth('2026-11-19');
  assert.equal(november.start, '2026-11-01');
  assert.equal(november.end, '2026-11-30');
  assert.equal(november.days.length, 30);
  // 2026-11-01 is a Sunday: six blank cells before it.
  assert.equal(november.leadingBlanks, 6);
  assert.equal(lunarMonth('2026-06-10').leadingBlanks, 0);
});

test('the month lists its exact phase events in order', () => {
  const november = lunarMonth('2026-11-01');
  const full = november.events.find((event) => event.phase === 'full');
  assert.equal(full?.date, '2026-11-24');
  assert.equal(full?.sign.slug, 'geminis');
  assert.equal(november.events.find((event) => event.phase === 'new')?.date, '2026-11-09');
  assert.deepEqual(november.events.map((event) => event.date), [...november.events.map((event) => event.date)].sort());
  assert.ok(november.events.some((event) => event.phase === 'first-quarter'));
  assert.ok(november.events.some((event) => event.phase === 'last-quarter'));
});

test('each day carries the Moon sign, its ingress and the event of the day', () => {
  const november = lunarMonth('2026-11-01');
  const day24 = november.days.find((day) => day.date === '2026-11-24')!;
  assert.equal(day24.event?.name, 'Luna llena');
  assert.ok(day24.illumination >= 98, String(day24.illumination));
  // The Moon changes sign every two or three days.
  const ingresses = november.days.filter((day) => day.ingress).length;
  assert.ok(ingresses >= 11 && ingresses <= 15, String(ingresses));
  assert.equal(november.days.find((day) => day.date === '2026-11-18')?.moonSign.slug, 'piscis');
});

test('quarters fall between a new and a full moon', () => {
  const phases = phaseEventsBetween('2026-11-09', '2026-11-24').map((event) => event.phase);
  assert.deepEqual(phases, ['new', 'first-quarter', 'full']);
});
