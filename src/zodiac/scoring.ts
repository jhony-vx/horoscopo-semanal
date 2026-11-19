import { addDays, monthEndOf, monthStartOf, type IsoDate } from './calendar.ts';
import { SIGN_SLUGS, type SignSlug } from './signs.ts';
import { BODIES, skyOn, type BodyKey, type Sky } from './sky.ts';

/**
 * Editorial scoring model (entertainment, not a prediction).
 * Each body's sign is compared with the reader's sign by whole-sign distance,
 * which maps to the classic aspects. Every domain weighs the bodies it is traditionally tied to.
 */

export const DOMAINS = ['general', 'love', 'professional', 'financial', 'wellbeing'] as const;
export type Domain = (typeof DOMAINS)[number];

export type AspectKey = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export type Scores = Record<Domain, number>;

/** Raw domain values in [-1, 1]; used to average periods before rounding. */
export type RawScores = Record<Domain, number>;

export interface Influence {
  body: BodyKey;
  aspect: AspectKey;
  /** Weighted signed contribution to the general domain. */
  weight: number;
}

const ASPECT_BY_DISTANCE: Record<number, AspectKey | undefined> = {
  0: 'conjunction',
  2: 'sextile',
  10: 'sextile',
  3: 'square',
  9: 'square',
  4: 'trine',
  8: 'trine',
  6: 'opposition',
};

type Nature = 'benefic' | 'neutral' | 'challenging';

const NATURE: Record<BodyKey, Nature> = {
  sun: 'benefic',
  moon: 'benefic',
  venus: 'benefic',
  jupiter: 'benefic',
  mercury: 'neutral',
  mars: 'challenging',
  saturn: 'challenging',
};

const ASPECT_VALUE: Record<Nature, Record<AspectKey, number>> = {
  benefic: { conjunction: 2, sextile: 1, trine: 2, square: -1, opposition: -1 },
  neutral: { conjunction: 1, sextile: 1, trine: 1, square: -1, opposition: -1 },
  challenging: { conjunction: -1, sextile: 1, trine: 1, square: -2, opposition: -2 },
};

const DOMAIN_WEIGHTS: Record<Domain, Partial<Record<BodyKey, number>>> = {
  general: { sun: 1.5, moon: 1, jupiter: 1, saturn: 1, mars: 0.5, venus: 0.5, mercury: 0.5 },
  love: { venus: 2, moon: 1.5, mars: 1 },
  professional: { saturn: 1.5, mercury: 1.5, sun: 1, mars: 1 },
  financial: { jupiter: 2, venus: 1.5, saturn: 1 },
  wellbeing: { moon: 2, mars: 1, sun: 1 },
};

const MAX_ASPECT_VALUE = 2;

export function aspectBetween(bodySignIndex: number, readerSignIndex: number): AspectKey | undefined {
  return ASPECT_BY_DISTANCE[(bodySignIndex - readerSignIndex + 12) % 12];
}

/**
 * How close the body is to the exact aspect with the middle of the reader's sign:
 * 1 when exact, 0.5 at the sign boundary. It moves daily with the Moon.
 */
function exactness(longitude: number, readerSignIndex: number): number {
  const separation = Math.abs(((longitude - (readerSignIndex * 30 + 15) + 540) % 360) - 180);
  const deviation = Math.abs(separation - Math.round(separation / 30) * 30);
  return 1 - deviation / 30;
}

function bodyValue(sky: Sky, body: BodyKey, readerSignIndex: number): number {
  const position = sky.bodies[body];
  const aspect = aspectBetween(position.signIndex, readerSignIndex);
  if (!aspect) return 0;
  const value = ASPECT_VALUE[NATURE[body]][aspect] * exactness(position.longitude, readerSignIndex);
  // A retrograde body softens its support and adds friction.
  return position.retrograde ? (value > 0 ? value / 2 : value - 0.5) : value;
}

const SLOW_BODIES: readonly BodyKey[] = ['jupiter', 'saturn'];

/**
 * Jupiter and Saturn stay about a year in each sign. In the weekly ranking they weigh less,
 * so the leader follows what changes during the week instead of the same background for months.
 */
export const RANKING_SLOW_BODY_FACTOR = 0.25;

/** A sign leads the weekly ranking at most this many consecutive weeks. */
export const MAX_CONSECUTIVE_LEADS = 2;

interface ScoringOptions {
  /** Multiplier for Jupiter and Saturn weights (1 for daily and monthly readings). */
  slowBodyFactor?: number;
}

export function rawScoresFor(sky: Sky, sign: SignSlug, { slowBodyFactor = 1 }: ScoringOptions = {}): RawScores {
  const readerSignIndex = SIGN_SLUGS.indexOf(sign);
  return Object.fromEntries(
    DOMAINS.map((domain) => {
      const weights = (Object.entries(DOMAIN_WEIGHTS[domain]) as [BodyKey, number][]).map(
        ([body, weight]): [BodyKey, number] => [body, SLOW_BODIES.includes(body) ? weight * slowBodyFactor : weight],
      );
      const total = weights.reduce((sum, [body, weight]) => sum + weight * bodyValue(sky, body, readerSignIndex), 0);
      const max = weights.reduce((sum, [, weight]) => sum + weight * MAX_ASPECT_VALUE, 0);
      return [domain, total / max];
    }),
  ) as RawScores;
}

/** Maps a raw value in [-1, 1] to the 1..5 scale used by the content schema. */
export function toScore(raw: number): number {
  return Math.min(5, Math.max(1, Math.round(3 + raw * 5)));
}

export function toScores(raw: RawScores): Scores {
  return Object.fromEntries(DOMAINS.map((domain) => [domain, toScore(raw[domain])])) as Scores;
}

export function averageRawScores(samples: readonly RawScores[]): RawScores {
  return Object.fromEntries(
    DOMAINS.map((domain) => [domain, samples.reduce((sum, sample) => sum + sample[domain], 0) / samples.length]),
  ) as RawScores;
}

/** The body aspects that shape the reading, strongest first. */
export function influencesFor(sky: Sky, sign: SignSlug, domain: Domain = 'general'): Influence[] {
  const readerSignIndex = SIGN_SLUGS.indexOf(sign);
  return BODIES.flatMap((body) => {
    const aspect = aspectBetween(sky.bodies[body].signIndex, readerSignIndex);
    const weight = (DOMAIN_WEIGHTS[domain][body] ?? 0) * bodyValue(sky, body, readerSignIndex);
    return aspect && weight !== 0 ? [{ body, aspect, weight }] : [];
  }).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight) || BODIES.indexOf(a.body) - BODIES.indexOf(b.body));
}

export function datesBetween(start: IsoDate, end: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) dates.push(date);
  return dates;
}

export function periodRawScores(sign: SignSlug, start: IsoDate, end: IsoDate, options: ScoringOptions = {}): RawScores {
  return averageRawScores(datesBetween(start, end).map((date) => rawScoresFor(skyOn(date), sign, options)));
}

export function monthRawScores(sign: SignSlug, date: IsoDate): RawScores {
  return periodRawScores(sign, monthStartOf(date), monthEndOf(date));
}

function overall(raw: RawScores): number {
  return DOMAINS.reduce((sum, domain) => sum + raw[domain], 0) + raw.general;
}

export interface RankedSign {
  sign: SignSlug;
  rank: number;
  raw: RawScores;
}

interface RankingOptions {
  /** Published leaders of the previous weeks, most recent first. */
  previousLeaders?: readonly SignSlug[];
}

/**
 * Weekly ranking: the general domain counts twice; ties keep the zodiac order.
 * Editorial rule: when the sky would crown a sign that already led the last
 * MAX_CONSECUTIVE_LEADS published weeks, the runner-up takes first place.
 */
export function weeklyRanking(weekStart: IsoDate, { previousLeaders = [] }: RankingOptions = {}): RankedSign[] {
  const weekEnd = addDays(weekStart, 6);
  const ordered = SIGN_SLUGS.map((sign, order) => ({ sign, order, raw: periodRawScores(sign, weekStart, weekEnd, { slowBodyFactor: RANKING_SLOW_BODY_FACTOR }) }))
    .sort((a, b) => overall(b.raw) - overall(a.raw) || a.order - b.order);
  const recent = previousLeaders.slice(0, MAX_CONSECUTIVE_LEADS);
  if (recent.length === MAX_CONSECUTIVE_LEADS && recent.every((leader) => leader === ordered[0].sign)) {
    [ordered[0], ordered[1]] = [ordered[1], ordered[0]];
  }
  return ordered.map(({ sign, raw }, index) => ({ sign, raw, rank: index + 1 }));
}
