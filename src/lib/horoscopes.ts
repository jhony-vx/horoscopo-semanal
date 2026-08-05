import { getCollection, type CollectionEntry } from 'astro:content';
import { getSign, type SignSlug } from '../data-signs';

export type HoroscopeEntry = CollectionEntry<'horoscopes'>;
export type WeekEntry = CollectionEntry<'weeks'>;
export type ForecastEntry = CollectionEntry<'forecasts'>;

const LIMA_TIME_ZONE = 'America/Lima';

function isValidIsoDate(value: string): boolean {
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function dateInLima(offsetDays = 0): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays));
  return date.toISOString().slice(0, 10);
}

export function currentDateInLima(): string {
  return dateInLima();
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

export async function getCurrentEdition() {
  const [weeks, entries] = await Promise.all([
    getCollection('weeks'),
    getCollection('horoscopes'),
  ]);

  validatePublishedWeeks(entries);

  const publishedWeeks = weeks
    .filter((week) => week.data.status === 'published')
    .sort((a, b) => b.data.weekStart.localeCompare(a.data.weekStart));
  const publishedEntries = entries.filter((entry) => entry.data.status === 'published');
  const grouped = groupByWeek(publishedEntries);
  const today = currentDateInLima();
  const completeWeeks = publishedWeeks.filter((week) => (grouped.get(week.data.weekStart)?.length ?? 0) === 12);
  const currentWeek = completeWeeks.find((week) => week.data.weekStart <= today) ?? completeWeeks[0];

  if (!currentWeek) {
    return null;
  }

  return {
    week: currentWeek,
    entries: (grouped.get(currentWeek.data.weekStart) ?? []).sort((a, b) => a.data.rank - b.data.rank),
  };
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
    today: entries.find((entry) => entry.data.status === 'published' && entry.data.sign === slug && entry.data.period === 'today' && entry.data.periodStart === today),
    tomorrow: entries.find((entry) => entry.data.status === 'published' && entry.data.sign === slug && entry.data.period === 'tomorrow' && entry.data.periodStart === tomorrow),
    month: entries.find((entry) => entry.data.status === 'published' && entry.data.sign === slug && entry.data.period === 'month' && entry.data.periodStart === monthStart),
  };
}

export function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T12:00:00-05:00');
  const end = new Date(endDate + 'T12:00:00-05:00');
  const formatter = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: LIMA_TIME_ZONE });
  const partsFor = (date: Date) => Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const startParts = partsFor(start);
  const endParts = partsFor(end);
  const sameMonth = startParts.month === endParts.month && startParts.year === endParts.year;

  return sameMonth
    ? 'Del ' + startParts.day + ' al ' + endParts.day + ' de ' + endParts.month + ' de ' + endParts.year
    : 'Del ' + startParts.day + ' de ' + startParts.month + ' al ' + endParts.day + ' de ' + endParts.month + ' de ' + endParts.year;
}
