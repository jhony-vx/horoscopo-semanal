import { Ecliptic, EclipticGeoMoon, GeoVector, MoonPhase, SearchMoonPhase, SunPosition, Body as AstronomyBody } from 'astronomy-engine';
import { addDays, todayInLima, type IsoDate } from './calendar.ts';

/** Bodies used by the editorial model, in display order. */
export const BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'] as const;
export type BodyKey = (typeof BODIES)[number];

export interface BodyPosition {
  /** Geocentric ecliptic longitude in degrees, 0 <= longitude < 360. */
  longitude: number;
  /** Zodiac sign index, 0 = Aries ... 11 = Piscis (tropical zodiac). */
  signIndex: number;
  retrograde: boolean;
}

export type MoonPhaseKey = 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';

export interface Sky {
  date: IsoDate;
  bodies: Record<BodyKey, BodyPosition>;
  /** Moon phase angle in degrees: 0 new, 90 first quarter, 180 full, 270 last quarter. */
  moonPhaseAngle: number;
  moonPhase: MoonPhaseKey;
}

const PLANETS: Partial<Record<BodyKey, AstronomyBody>> = {
  mercury: AstronomyBody.Mercury,
  venus: AstronomyBody.Venus,
  mars: AstronomyBody.Mars,
  jupiter: AstronomyBody.Jupiter,
  saturn: AstronomyBody.Saturn,
};

/** Readings describe the sky at noon in Lima (17:00 UTC), the middle of the editorial day. */
function editorialInstant(date: IsoDate): Date {
  return new Date(date + 'T17:00:00Z');
}

function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function longitudeAt(body: BodyKey, instant: Date): number {
  if (body === 'sun') return normalize(SunPosition(instant).elon);
  if (body === 'moon') return normalize(EclipticGeoMoon(instant).lon);
  return normalize(Ecliptic(GeoVector(PLANETS[body]!, instant, true)).elon);
}

/** Signed shortest angular motion from `from` to `to`, in degrees (-180, 180]. */
function angularDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

export function moonPhaseFromAngle(angle: number): MoonPhaseKey {
  const keys: MoonPhaseKey[] = ['new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent'];
  return keys[Math.floor(normalize(angle + 22.5) / 45) % 8];
}

export function skyOn(date: IsoDate): Sky {
  const instant = editorialInstant(date);
  const previous = editorialInstant(addDays(date, -1));
  const bodies = Object.fromEntries(
    BODIES.map((body) => {
      const longitude = longitudeAt(body, instant);
      // Sun and Moon never retrograde; planets do when their longitude decreases.
      const retrograde = body in PLANETS && angularDelta(longitudeAt(body, previous), longitude) < 0;
      return [body, { longitude, signIndex: Math.floor(longitude / 30), retrograde }];
    }),
  ) as Record<BodyKey, BodyPosition>;
  const moonPhaseAngle = normalize(MoonPhase(instant));

  return { date, bodies, moonPhaseAngle, moonPhase: moonPhaseFromAngle(moonPhaseAngle) };
}

export interface Lunation {
  phase: 'new' | 'full';
  /** Lima day of the exact event. */
  date: IsoDate;
  /** Sign the Moon occupies at the exact instant. */
  signIndex: number;
}

/** Exact new and full moons whose Lima day falls between start and end (inclusive). */
export function lunationsBetween(start: IsoDate, end: IsoDate): Lunation[] {
  // Search from the previous noon so an event early on the first Lima day is not missed.
  const from = new Date(addDays(start, -1) + 'T17:00:00Z');
  const lunations: Lunation[] = [];
  for (const [phase, angle] of [['new', 0], ['full', 180]] as const) {
    for (let cursor = from; ; ) {
      const event = SearchMoonPhase(angle, cursor, 40);
      if (!event) break;
      const date = todayInLima(event.date);
      if (date > end) break;
      if (date >= start) lunations.push({ phase, date, signIndex: Math.floor(normalize(EclipticGeoMoon(event.date).lon) / 30) });
      cursor = new Date(event.date.getTime() + 86_400_000);
    }
  }
  return lunations.sort((a, b) => a.date.localeCompare(b.date));
}
