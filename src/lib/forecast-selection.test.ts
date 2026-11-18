import assert from 'node:assert/strict';
import test from 'node:test';
import { pickForecast, type ForecastLike } from './forecast-selection.ts';

function forecast(sign: string, period: string, periodStart: string, status = 'published'): ForecastLike {
  return { data: { sign, period, periodStart, status } };
}

test('picks the published forecast that starts on the requested date', () => {
  const entries = [forecast('aries', 'today', '2026-11-17'), forecast('aries', 'today', '2026-11-18')];
  assert.equal(pickForecast(entries, 'aries', 'today', '2026-11-18')?.data.periodStart, '2026-11-18');
});

test('falls back to the latest earlier forecast when the requested day is missing', () => {
  const entries = [
    forecast('aries', 'today', '2026-11-15'),
    forecast('aries', 'today', '2026-11-16'),
    forecast('leo', 'today', '2026-11-17'),
  ];
  assert.equal(pickForecast(entries, 'aries', 'today', '2026-11-18', { fallback: true })?.data.periodStart, '2026-11-16');
});

test('never falls back to a future forecast, a draft or another sign', () => {
  const entries = [
    forecast('aries', 'today', '2026-11-19'),
    forecast('aries', 'today', '2026-11-17', 'draft'),
    forecast('leo', 'today', '2026-11-17'),
  ];
  assert.equal(pickForecast(entries, 'aries', 'today', '2026-11-18', { fallback: true }), undefined);
});

test('without fallback a missing day returns nothing', () => {
  const entries = [forecast('aries', 'tomorrow', '2026-11-18')];
  assert.equal(pickForecast(entries, 'aries', 'tomorrow', '2026-11-19'), undefined);
});
