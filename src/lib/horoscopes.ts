import { getCollection, type CollectionEntry } from 'astro:content';
import { addDays, EDITORIAL_TIME_ZONE, isValidIsoDate, todayInLima } from '../zodiac/calendar';
import { getSign, type SignSlug } from '../zodiac/signs';
import { editionTimeline, type EditionTimeline } from './editions';
import { pickForecast } from './forecast-selection';

export type HoroscopeEntry = CollectionEntry<'horoscopes'>;
export type WeekEntry = CollectionEntry<'weeks'>;
export type ForecastEntry = CollectionEntry<'forecasts'>;

const LIMA_TIME_ZONE = EDITORIAL_TIME_ZONE;

export function dateInLima(offsetDays = 0): string {
  return addDays(todayInLima(), offsetDays);
}

export function currentDateInLima(): string {
  return todayInLima();
}

function groupByWeek(entries: HoroscopeEntry[]): Map<string, HoroscopeEntry[]> {
  return entries.reduce((groups, entry) => {
    const list = groups.get(entry.data.weekStart) ?? [];
    list.push(entry);
    groups.set(entry.data.weekStart, list);
    return groups;
  }, new Map<string, HoroscopeEntry[]>());
}

function validatePublishedWeeks(entries: HoroscopeEntry[]): void {
  const grouped = groupByWeek(entries.filter((entry) => entry.data.status === 'published'));
  const errors: string[] = [];

  for (const [weekStart, weekEntries] of grouped) {
    const ranks = weekEntries.map((entry) => entry.data.rank);
    const signs = weekEntries.map((entry) => entry.data.sign);
    const hasAllRanks = ranks.length === 12 && new Set(ranks).size === 12 && ranks.every((rank) => rank >= 1 && rank <= 12);
    const hasAllSigns = signs.length === 12 && new Set(signs).size === 12;
    const hasValidDates = weekEntries.every((entry) => isValidIsoDate(entry.data.weekStart) && isValidIsoDate(entry.data.weekEnd) && entry.data.weekStart <= entry.data.weekEnd);

    if (!hasAllRanks || !hasAllSigns || !hasValidDates) {
      errors.push(weekStart + ' debe tener 12 signos y puestos únicos del 1 al 12.');
    }
  }

  if (errors.length > 0) {
    throw new Error('Contenido publicado inválido: ' + errors.join(' | '));
  }
}

function forecastGroupKey(entry: ForecastEntry): string {
  return [entry.data.period, entry.data.periodStart, entry.data.periodEnd].join(':');
}

export function validatePublishedForecasts(entries: ForecastEntry[]): void {
  const grouped = entries
    .filter((entry) => entry.data.status === 'published')
    .reduce((groups, entry) => {
      const key = forecastGroupKey(entry);
      const list = groups.get(key) ?? [];
      list.push(entry);
      groups.set(key, list);
      return groups;
    }, new Map<string, ForecastEntry[]>());
  const errors: string[] = [];

  for (const [groupKey, groupEntries] of grouped) {
    const signs = groupEntries.map((entry) => entry.data.sign);
    const hasAllSigns = signs.length === 12 && new Set(signs).size === 12;
    const hasValidDates = groupEntries.every((entry) => isValidIsoDate(entry.data.periodStart) && isValidIsoDate(entry.data.periodEnd) && entry.data.periodStart <= entry.data.periodEnd);
    const hasContent = groupEntries.every((entry) => (entry.body ?? '').trim().length > 0);

    if (!hasAllSigns || !hasValidDates || !hasContent) {
      errors.push(groupKey + ' debe tener 12 signos únicos, fechas válidas y contenido completo.');
    }
  }

  if (errors.length > 0) {
    throw new Error('Pronósticos publicados inválidos: ' + errors.join(' | '));
  }
}

export type Edition = { week: WeekEntry; entries: HoroscopeEntry[] };

/** Every complete published edition up to today, with the current and previous ones. */
export async function getEditions(): Promise<EditionTimeline<Edition>> {
  const [weeks, entries] = await Promise.all([
    getCollection('weeks'),
    getCollection('horoscopes'),
  ]);

  validatePublishedWeeks(entries);

  const grouped = groupByWeek(entries.filter((entry) => entry.data.status === 'published'));
  const editions = weeks
    .filter((week) => week.data.status === 'published' && (grouped.get(week.data.weekStart)?.length ?? 0) === 12)
    .map((week) => ({ week, entries: grouped.get(week.data.weekStart)!.sort((a, b) => a.data.rank - b.data.rank) }));

  return editionTimeline(editions, (edition) => edition.week.data.weekStart, currentDateInLima());
}

export async function getCurrentEdition(): Promise<Edition | null> {
  return (await getEditions()).current ?? null;
}

export function getSignOrThrow(slug: string) {
  const sign = getSign(slug);
  if (!sign) {
    throw new Error('Signo zodiacal no encontrado: ' + slug);
  }
  return sign;
}

export async function getEntryForSign(slug: SignSlug) {
  const edition = await getCurrentEdition();
  return edition?.entries.find((entry) => entry.data.sign === slug);
}

export async function getForecastsForSign(slug: SignSlug) {
  const entries = await getCollection('forecasts');
  validatePublishedForecasts(entries);
  const today = currentDateInLima();
  const tomorrow = dateInLima(1);
  const monthStart = today.slice(0, 7) + '-01';

  return {
    // A failed daily run must not leave "Hoy" empty: show the latest reading with its real date.
    today: pickForecast(entries, slug, 'today', today, { fallback: true }),
    tomorrow: pickForecast(entries, slug, 'tomorrow', tomorrow),
    month: pickForecast(entries, slug, 'month', monthStart),
  };
}

export function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T12:00:00-05:00');
  const end = new Date(endDate + 'T12:00:00-05:00');
  const formatter = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: LIMA_TIME_ZONE });
  const partsFor = (date: Date) => Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value.toLowerCase()]));
  const startParts = partsFor(start);
  const endParts = partsFor(end);
  const sameMonth = startParts.month === endParts.month && startParts.year === endParts.year;

  return sameMonth
    ? 'Del ' + startParts.day + ' al ' + endParts.day + ' de ' + endParts.month + ' de ' + endParts.year
    : 'Del ' + startParts.day + ' de ' + startParts.month + ' al ' + endParts.day + ' de ' + endParts.month + ' de ' + endParts.year;
}

export function formatPeriodRange(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return 'Fecha por confirmar';

  const start = new Date(startDate + 'T12:00:00Z');
  const end = new Date(endDate + 'T12:00:00Z');
  const formatter = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  if (startDate === endDate) return formatter.format(start).toLowerCase();

  // Some ICU versions capitalize es-PE month names; the site always writes them in lowercase.
  const partsFor = (date: Date) => Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value.toLowerCase()]),
  );
  const startParts = partsFor(start);
  const endParts = partsFor(end);
  const sameMonth = startParts.month === endParts.month && startParts.year === endParts.year;

  return sameMonth
    ? 'Del ' + startParts.day + ' al ' + endParts.day + ' de ' + endParts.month + ' de ' + endParts.year
    : 'Del ' + startParts.day + ' de ' + startParts.month + ' al ' + endParts.day + ' de ' + endParts.month + ' de ' + endParts.year;
}

/** "24 de noviembre", always lowercase (some ICU versions capitalize es-PE months). */
export function formatDayMonth(date: string): string {
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z')).toLowerCase();
}
