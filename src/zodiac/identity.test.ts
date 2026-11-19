import assert from 'node:assert/strict';
import test from 'node:test';
import { affinitiesFor, compatibilityMatrix, relationBetween } from './compatibility.ts';
import { illumination, moonLitPath } from './moon.ts';
import { SIGN_PROFILES } from './profiles.ts';
import { SIGN_SLUGS } from './signs.ts';
import { moonNoteFor, skySummary } from './sky-summary.ts';

test('every sign has a complete profile and a drawable constellation', () => {
  for (const sign of SIGN_SLUGS) {
    const { constellation, keywords, strengths, challenges } = SIGN_PROFILES[sign];
    assert.equal(keywords.length, 3);
    assert.equal(strengths.length, 3);
    assert.equal(challenges.length, 2);
    assert.ok(constellation.lines.length > 0, sign);
    for (const [from, to] of constellation.lines) {
      assert.ok(constellation.stars[from] && constellation.stars[to], `${sign}: ${from}-${to}`);
    }
    for (const [x, y] of constellation.stars) assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 60, `${sign}: ${x},${y}`);
  }
});

test('modalities and rulers follow the tradition', () => {
  assert.deepEqual(SIGN_SLUGS.filter((sign) => SIGN_PROFILES[sign].modality === 'Cardinal'), ['aries', 'cancer', 'libra', 'capricornio']);
  assert.equal(SIGN_PROFILES.escorpio.ruler, 'Plutón');
  assert.equal(SIGN_PROFILES.escorpio.classicalRuler, 'Marte');
});

test('compatibility follows the distance between signs', () => {
  assert.equal(relationBetween('aries', 'leo').kind, 'trine');
  assert.equal(relationBetween('aries', 'geminis').kind, 'sextile');
  assert.equal(relationBetween('aries', 'cancer').kind, 'square');
  assert.equal(relationBetween('aries', 'libra').kind, 'opposition');
  assert.equal(relationBetween('piscis', 'aries').kind, 'semisextile');
  assert.equal(relationBetween('tauro', 'tauro').kind, 'same');
  assert.deepEqual(relationBetween('leo', 'escorpio'), relationBetween('escorpio', 'leo'));
});

test('affinities list flowing, opposite and tense signs', () => {
  assert.deepEqual(affinitiesFor('aries'), { best: ['leo', 'sagitario', 'geminis', 'acuario'], complement: 'libra', challenging: ['cancer', 'capricornio'] });
  assert.equal(Object.keys(compatibilityMatrix()).length, 144);
});

test('the Moon is dark when new and fully lit when full', () => {
  assert.equal(illumination(0), 0);
  assert.equal(illumination(180), 1);
  assert.equal(Math.round(illumination(90) * 100), 50);
  // A waxing crescent is lit on the right: the outer arc sweeps clockwise.
  assert.match(moonLitPath(45, 10, 12, 12), /^M 12 2 A 10 10 0 0 1 12 22 A 7.07 10 0 0 0 12 2 Z$/);
  // A waning crescent is lit on the left.
  assert.match(moonLitPath(315, 10, 12, 12), /A 10 10 0 0 0 12 22 A 7.07 10 0 0 1 12 2/);
});

test('the sky summary names the real Moon and the next lunation', () => {
  // 2026-11-18: Moon in Piscis (see texts.test.ts); new moon on 2026-11-09, full moon on 2026-11-24.
  const summary = skySummary('2026-11-18');
  assert.equal(summary.sun.slug, 'escorpio');
  assert.equal(summary.moon.sign.slug, 'piscis');
  assert.ok(summary.moon.illumination > 40 && summary.moon.illumination < 70, String(summary.moon.illumination));
  assert.equal(summary.nextLunation?.phase, 'full');
  assert.equal(summary.nextLunation?.date, '2026-11-24');
  assert.match(moonNoteFor(summary, 'piscis'), /La Luna está en tu signo/);
});
