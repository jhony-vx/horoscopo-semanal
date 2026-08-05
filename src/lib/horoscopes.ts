import { getCollection, type CollectionEntry } from 'astro:content';
import { getSign, type SignSlug } from '../data-signs';

export type HoroscopeEntry = CollectionEntry<'horoscopes'>;
export type WeekEntry = CollectionEntry<'weeks'>;

const LIMA_TIME_ZONE = 'America/Lima';

function currentDateInLima(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
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

    if (!hasAllRanks || !hasAllSigns) {
      errors.push(`${weekStart} debe tener 12 signos y puestos únicos del 1 al 12.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Contenido publicado inválido:\n${errors.join('\n')}`);
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
  const grouped = groupByWeek(entries);
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
    throw new Error(`Signo zodiacal no encontrado: ${slug}`);
  }
  return sign;
}

export async function getEntryForSign(slug: SignSlug) {
  const edition = await getCurrentEdition();
  return edition?.entries.find((entry) => entry.data.sign === slug);
}

export function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T12:00:00-05:00`);
  const end = new Date(`${endDate}T12:00:00-05:00`);
  const formatter = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: LIMA_TIME_ZONE });
  const yearFormatter = new Intl.DateTimeFormat('es-PE', { year: 'numeric', timeZone: LIMA_TIME_ZONE });
  const startMonth = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: LIMA_TIME_ZONE }).format(start);
  const endMonth = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: LIMA_TIME_ZONE }).format(end);
  const sameMonth = startMonth === endMonth;
  const startLabel = formatter.format(start).replace(` de ${startMonth}`, '').trim();
  const endLabel = formatter.format(end).replace(` de ${endMonth}`, '').trim();
  const year = yearFormatter.format(end);

  return sameMonth
    ? `Del ${startLabel} al ${endLabel} de ${endMonth} de ${year}`
    : `Del ${startLabel} de ${startMonth} al ${endLabel} de ${endMonth} de ${year}`;
}
