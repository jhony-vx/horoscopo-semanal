import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays } from './calendar.ts';
import { aspectBetween, influencesFor, rawScoresFor, toScore, toScores, weeklyRanking } from './scoring.ts';
import { SIGN_SLUGS } from './signs.ts';
import { skyOn } from './sky.ts';

test('maps whole-sign distances to the classic aspects', () => {
  assert.equal(aspectBetween(0, 0), 'conjunction');
  assert.equal(aspectBetween(2, 0), 'sextile');
  assert.equal(aspectBetween(3, 0), 'square');
  assert.equal(aspectBetween(4, 0), 'trine');
  assert.equal(aspectBetween(6, 0), 'opposition');
  assert.equal(aspectBetween(1, 0), undefined);
  assert.equal(aspectBetween(7, 2), undefined);
  assert.equal(aspectBetween(10, 0), 'sextile');
});

test('scores stay within the 1..5 schema range', () => {
  assert.equal(toScore(-1), 1);
  assert.equal(toScore(0), 3);
  assert.equal(toScore(1), 5);
  for (const sign of SIGN_SLUGS) {
    for (const value of Object.values(toScores(rawScoresFor(skyOn('2026-11-18'), sign)))) {
      assert.ok(Number.isInteger(value) && value >= 1 && value <= 5);
    }
  }
});

test('daily scores change from one day to the next', () => {
  const day = (date: string) => SIGN_SLUGS.map((sign) => Object.values(toScores(rawScoresFor(skyOn(date), sign))).join('')).join('|');
  assert.notEqual(day('2026-11-18'), day('2026-11-19'));
});

test('the weekly ranking has 12 unique signs with ranks 1 to 12', () => {
  const ranking = weeklyRanking('2026-11-16');
  assert.deepEqual(ranking.map((entry) => entry.rank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.equal(new Set(ranking.map((entry) => entry.sign)).size, 12);
});

test('the weekly leader changes across the year', () => {
  const leaders = new Set(Array.from({ length: 26 }, (_, week) => weeklyRanking(addDays('2026-01-05', week * 14))[0].sign));
  assert.ok(leaders.size >= 4, `expected several leaders, got ${[...leaders].join(', ')}`);
});

test('the same week always produces the same ranking', () => {
  assert.deepEqual(weeklyRanking('2026-11-16'), weeklyRanking('2026-11-16'));
});

test('influences list only aspected bodies, strongest first', () => {
  const influences = influencesFor(skyOn('2026-11-18'), 'escorpio');
  assert.ok(influences.length > 0);
  assert.ok(influences.some((influence) => influence.body === 'sun' && influence.aspect === 'conjunction'));
  for (let index = 1; index < influences.length; index++) {
    assert.ok(Math.abs(influences[index - 1].weight) >= Math.abs(influences[index].weight));
  }
});

test('a sign never leads more than two consecutive published weeks', () => {
  const leaders: string[] = [];
  for (let week = 0; week < 104; week++) {
    const start = addDays('2026-01-05', week * 7);
    const [leader] = weeklyRanking(start, { previousLeaders: leaders.slice(-2).reverse() as never });
    leaders.push(leader.sign);
  }
  for (let index = 2; index < leaders.length; index++) {
    assert.ok(!(leaders[index] === leaders[index - 1] && leaders[index] === leaders[index - 2]), `${leaders[index]} led three weeks in a row at week ${index}`);
  }
});

test('the cap swaps only the top two and keeps ranks 1 to 12', () => {
  const free = weeklyRanking('2026-11-16');
  const capped = weeklyRanking('2026-11-16', { previousLeaders: [free[0].sign, free[0].sign] });
  assert.equal(capped[0].sign, free[1].sign);
  assert.equal(capped[1].sign, free[0].sign);
  assert.deepEqual(capped.slice(2).map((entry) => entry.sign), free.slice(2).map((entry) => entry.sign));
  assert.deepEqual(capped.map((entry) => entry.rank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test('one previous lead or a different leader does not trigger the cap', () => {
  const free = weeklyRanking('2026-11-16');
  assert.equal(weeklyRanking('2026-11-16', { previousLeaders: [free[0].sign] })[0].sign, free[0].sign);
  assert.equal(weeklyRanking('2026-11-16', { previousLeaders: [free[0].sign, free[1].sign] })[0].sign, free[0].sign);
});

test('slow planets weigh less in the ranking than in daily readings', async () => {
  const { RANKING_SLOW_BODY_FACTOR, rawScoresFor: score } = await import('./scoring.ts');
  assert.equal(RANKING_SLOW_BODY_FACTOR, 0.25);
  // Leo has Jupiter in its own sign in late 2026; reducing slow planets lowers its general score.
  const sky = skyOn('2026-11-18');
  assert.ok(score(sky, 'leo', { slowBodyFactor: 0.25 }).general < score(sky, 'leo').general);
});
