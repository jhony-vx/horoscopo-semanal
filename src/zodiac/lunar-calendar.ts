import { addDays, monthEndOf, monthStartOf, type IsoDate } from './calendar.ts';
import { illumination } from './moon.ts';
import { datesBetween } from './scoring.ts';
import { ZODIAC_SIGNS, type ZodiacSign } from './signs.ts';
import { phaseEventsBetween, skyOn, type PhaseEventKey } from './sky.ts';
import { MOON_PHASE_NAMES } from './texts.ts';

export const PHASE_EVENT_NAMES: Record<PhaseEventKey, string> = {
  new: 'Luna nueva',
  'first-quarter': 'Cuarto creciente',
  full: 'Luna llena',
  'last-quarter': 'Cuarto menguante',
};

export interface LunarDay {
  date: IsoDate;
  day: number;
  phaseAngle: number;
  phaseName: string;
  /** Lit fraction, 0 to 100. */
  illumination: number;
  moonSign: ZodiacSign;
  /** True when the Moon changed sign since the previous day. */
  ingress: boolean;
  event?: { phase: PhaseEventKey; name: string; sign: ZodiacSign };
}

export interface LunarMonth {
  start: IsoDate;
  end: IsoDate;
  /** Empty cells before day 1 in a week that starts on Monday. */
  leadingBlanks: number;
  days: LunarDay[];
  events: { date: IsoDate; phase: PhaseEventKey; name: string; sign: ZodiacSign }[];
}

/** Day of the week with Monday = 0, for an ISO date (timezone independent). */
function weekdayFromMonday(date: IsoDate): number {
  return (new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7;
}

/** The Moon of every day of the month (noon in Lima) plus its exact phase events. */
export function lunarMonth(date: IsoDate): LunarMonth {
  const start = monthStartOf(date);
  const end = monthEndOf(date);
  const events = phaseEventsBetween(start, end).map((event) => ({
    date: event.date,
    phase: event.phase,
    name: PHASE_EVENT_NAMES[event.phase],
    sign: ZODIAC_SIGNS[event.signIndex],
  }));
  let previousSign = skyOn(addDays(start, -1)).bodies.moon.signIndex;

  const days = datesBetween(start, end).map((day): LunarDay => {
    const sky = skyOn(day);
    const signIndex = sky.bodies.moon.signIndex;
    const ingress = signIndex !== previousSign;
    previousSign = signIndex;
    const event = events.find((item) => item.date === day);
    return {
      date: day,
      day: Number(day.slice(8)),
      phaseAngle: sky.moonPhaseAngle,
      phaseName: MOON_PHASE_NAMES[sky.moonPhase],
      illumination: Math.round(illumination(sky.moonPhaseAngle) * 100),
      moonSign: ZODIAC_SIGNS[signIndex],
      ingress,
      event: event && { phase: event.phase, name: event.name, sign: event.sign },
    };
  });

  return { start, end, leadingBlanks: weekdayFromMonday(start), days, events };
}
