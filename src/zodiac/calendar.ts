/** Editorial calendar helpers. Every editorial date is an ISO day (YYYY-MM-DD) in America/Lima. */
export const EDITORIAL_TIME_ZONE = 'America/Lima';

export type IsoDate = string;

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function todayInLima(now: Date = new Date()): IsoDate {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: EDITORIAL_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDays(isoDate: IsoDate, days: number): IsoDate {
  const date = new Date(isoDate + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday of the ISO week that contains the date. */
export function weekStartOf(isoDate: IsoDate): IsoDate {
  const date = new Date(isoDate + 'T12:00:00Z');
  return addDays(isoDate, -((date.getUTCDay() + 6) % 7));
}

export function monthStartOf(isoDate: IsoDate): IsoDate {
  return isoDate.slice(0, 7) + '-01';
}

export function monthEndOf(isoDate: IsoDate): IsoDate {
  const date = new Date(monthStartOf(isoDate) + 'T12:00:00Z');
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}
