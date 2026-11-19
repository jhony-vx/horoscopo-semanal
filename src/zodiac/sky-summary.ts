import { addDays, type IsoDate } from './calendar.ts';
import { relationBetween, type RelationKind } from './compatibility.ts';
import { illumination } from './moon.ts';
import { ZODIAC_SIGNS, type SignSlug, type ZodiacSign } from './signs.ts';
import { lunationsBetween, skyOn, type BodyKey } from './sky.ts';
import { MOON_PHASE_NAMES } from './texts.ts';

const PLANET_NAMES: Partial<Record<BodyKey, string>> = {
  mercury: 'Mercurio',
  venus: 'Venus',
  mars: 'Marte',
  jupiter: 'Júpiter',
  saturn: 'Saturno',
};

export interface SkySummary {
  date: IsoDate;
  sun: ZodiacSign;
  moon: {
    sign: ZodiacSign;
    phaseAngle: number;
    phaseName: string;
    /** Lit fraction, 0 to 100. */
    illumination: number;
  };
  retrogrades: string[];
  nextLunation?: { phase: 'new' | 'full'; date: IsoDate; sign: ZodiacSign };
}

/** The sky of the editorial day (noon in Lima), as the site shows it. */
export function skySummary(date: IsoDate): SkySummary {
  const sky = skyOn(date);
  const next = lunationsBetween(addDays(date, 1), addDays(date, 31))[0];
  return {
    date,
    sun: ZODIAC_SIGNS[sky.bodies.sun.signIndex],
    moon: {
      sign: ZODIAC_SIGNS[sky.bodies.moon.signIndex],
      phaseAngle: sky.moonPhaseAngle,
      phaseName: MOON_PHASE_NAMES[sky.moonPhase],
      illumination: Math.round(illumination(sky.moonPhaseAngle) * 100),
    },
    retrogrades: (Object.keys(PLANET_NAMES) as BodyKey[]).filter((body) => sky.bodies[body].retrograde).map((body) => PLANET_NAMES[body]!),
    nextLunation: next && { phase: next.phase, date: next.date, sign: ZODIAC_SIGNS[next.signIndex] },
  };
}

const MOON_FOR_READER: Record<RelationKind, string> = {
  same: 'La Luna está en tu signo: tus emociones van al frente y conviene escucharlas.',
  trine: 'La Luna fluye con tu signo: buen día para confiar en tu intuición.',
  sextile: 'La Luna te tiende una mano: las conversaciones y los encuentros suman.',
  square: 'La Luna te tensa un poco: baja el ritmo antes de reaccionar.',
  opposition: 'La Luna se opone a tu signo: los demás te muestran lo que necesitas ver.',
  semisextile: 'La Luna pasa cerca de tu signo: pequeños ajustes hacen la diferencia.',
  quincunx: 'La Luna pide flexibilidad: no todo tiene que salir como lo planeaste.',
};

/** One line on how today's Moon relates to the reader's sign. */
export function moonNoteFor(summary: SkySummary, sign: SignSlug): string {
  return MOON_FOR_READER[relationBetween(summary.moon.sign.slug, sign).kind];
}
