import assert from 'node:assert/strict';
import test from 'node:test';
import { periodRawScores, rawScoresFor, weeklyRanking } from './scoring.ts';
import { skyOn } from './sky.ts';
import { composeDailyForecast, composeMonthlyForecast, composeWeekEdition, composeWeeklyHoroscope, FORECAST_HEADINGS } from './texts.ts';

const formatDay = (date: string) => date.slice(8) + '/' + date.slice(5, 7);

test('a daily forecast has every section, the lead word and the Moon of the day', () => {
  const reading = composeDailyForecast('aries', '2026-11-18', 'Hoy', rawScoresFor(skyOn('2026-11-18'), 'aries'));
  for (const heading of Object.values(FORECAST_HEADINGS)) assert.match(reading.body, new RegExp(`## ${heading}\\n\\nHoy, `));
  assert.match(reading.body, /La Luna transita Piscis/);
  assert.match(reading.summary, /^Hoy, Aries: /);
  assert.ok(reading.summary.length >= 30);
});

test('consecutive days produce different readings for the same sign', () => {
  const day = (date: string) => composeDailyForecast('leo', date, 'Hoy', rawScoresFor(skyOn(date), 'leo')).body;
  assert.notEqual(day('2026-11-18'), day('2026-11-19'));
});

test('the same inputs always produce the same text', () => {
  const raw = rawScoresFor(skyOn('2026-11-18'), 'virgo');
  assert.deepEqual(composeDailyForecast('virgo', '2026-11-18', 'Hoy', raw), composeDailyForecast('virgo', '2026-11-18', 'Hoy', raw));
});

test('the reading names a real influence of the sky', () => {
  // On 2026-11-18 the Sun is in Scorpio, a conjunction for Scorpio readers.
  const reading = composeDailyForecast('escorpio', '2026-11-18', 'Hoy', rawScoresFor(skyOn('2026-11-18'), 'escorpio'));
  assert.match(reading.body, /el Sol en Escorpio, en tu propio signo/);
});

test('weekly horoscopes keep the editorial headings and skip the fast Moon', () => {
  const reading = composeWeeklyHoroscope('tauro', '2026-11-16', periodRawScores('tauro', '2026-11-16', '2026-11-22'));
  assert.match(reading.body, /## El tono de tu semana\n\nEsta semana, /);
  assert.match(reading.body, /## Amor y vínculos/);
  assert.match(reading.body, /## Trabajo y bienestar/);
  assert.doesNotMatch(reading.body, /con la Luna/);
});

test('monthly forecasts use the month name as lead', () => {
  const reading = composeMonthlyForecast('piscis', '2026-11-01', 'noviembre', periodRawScores('piscis', '2026-11-01', '2026-11-30'));
  assert.match(reading.body, /## Suerte general\n\nDurante noviembre, /);
});

test('the week edition names the leader and real sky events', async () => {
  const edition = composeWeekEdition('2026-11-16', '2026-11-22', weeklyRanking('2026-11-16'), formatDay);
  const { getSign } = await import('./signs.ts');
  const leader = getSign(weeklyRanking('2026-11-16')[0].sign)!.name;
  assert.ok(edition.title.length > 0 && edition.theme.length > 0);
  assert.ok(edition.intro.length >= 40);
  assert.match(edition.intro, new RegExp(`${leader} encabeza el ranking`));
  // The Sun enters Sagittarius on 2026-11-22.
  assert.equal(edition.title, 'El Sol entra en Sagitario');
});

test('a supportive section never cites a tense aspect', async () => {
  const { PHRASES } = await import('./texts.ts');
  const { addDays } = await import('./calendar.ts');
  const { SIGN_SLUGS } = await import('./signs.ts');
  const supportive = Object.values(PHRASES).flatMap((tones) => tones.high);
  for (let offset = 0; offset < 60; offset++) {
    const date = addDays('2026-09-01', offset);
    for (const sign of SIGN_SLUGS) {
      const lines = composeDailyForecast(sign, date, 'Hoy', rawScoresFor(skyOn(date), sign)).body.split('\n');
      for (const line of lines.filter((text) => /en cuadratura|en oposición/.test(text))) {
        assert.ok(!supportive.some((phrase) => line.endsWith(phrase)), `${date} ${sign}: ${line}`);
      }
    }
  }
});

test('the week edition dates new and full moons by the exact event', () => {
  const longDay = (date: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z')).toLowerCase();
  const edition = composeWeekEdition('2027-02-01', '2027-02-07', weeklyRanking('2027-02-01'), longDay);
  assert.match(edition.intro, /La luna nueva del 6 de febrero cae en Acuario\./);
});

test('the week edition lists several retrograde planets with "y"', () => {
  for (let week = 0; week < 52; week++) {
    const start = new Date(Date.UTC(2027, 0, 4 + week * 7)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(2027, 0, 10 + week * 7)).toISOString().slice(0, 10);
    const { body } = composeWeekEdition(start, end, weeklyRanking(start), formatDay);
    assert.doesNotMatch(body, /avanzan? en retrógrado/);
    assert.doesNotMatch(body, /\w, \w+ están retrógrados/);
  }
});
