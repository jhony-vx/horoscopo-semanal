import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { addDays, isValidIsoDate, monthEndOf, monthStartOf, todayInLima, weekStartOf, type IsoDate } from '../src/zodiac/calendar.ts';
import { monthRawScores, periodRawScores, rawScoresFor, toScores, weeklyRanking, type RawScores } from '../src/zodiac/scoring.ts';
import { SIGN_SLUGS, type SignSlug } from '../src/zodiac/signs.ts';
import { skyOn } from '../src/zodiac/sky.ts';
import { composeDailyForecast, composeMonthlyForecast, composeWeekEdition, composeWeeklyHoroscope } from '../src/zodiac/texts.ts';

/**
 * Prepares and publishes editorial content as Markdown files.
 *
 *   node --experimental-strip-types scripts/publish-content.ts <mode> [--date=YYYY-MM-DD]
 *
 * Modes: prepare-day, publish-day, prepare-week, publish-week, prepare-month, publish-month.
 * `prepare-*` writes missing drafts only (existing files are never overwritten);
 * `publish-*` validates the complete group and switches it from draft to published.
 * `--date` defaults to today in America/Lima and allows recovering a missed day.
 */

const USAGE = 'Usa: publish-content.ts <prepare-day|publish-day|prepare-week|publish-week|prepare-month|publish-month> [--date=AAAA-MM-DD]';

const root = process.cwd();
const weeksDir = join(root, 'src', 'content', 'weeks');
const horoscopesDir = join(root, 'src', 'content', 'horoscopes');
const forecastsDir = join(root, 'src', 'content', 'forecasts');
const SCORE_KEYS = ['generalScore', 'loveScore', 'professionalScore', 'financialScore', 'wellbeingScore'] as const;

type Status = 'draft' | 'published';

function yamlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function frontmatterValue(source: string, key: string): string | undefined {
  const raw = source.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'))?.[1];
  if (raw === undefined) return undefined;
  return raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1).replaceAll("''", "'") : raw.replace(/^"|"$/g, '');
}

function bodyOf(source: string): string {
  return source.split('---').slice(2).join('---').trim();
}

function scoreLines(raw: RawScores): string {
  const scores = toScores(raw);
  return [
    `generalScore: ${scores.general}`,
    `loveScore: ${scores.love}`,
    `professionalScore: ${scores.professional}`,
    `financialScore: ${scores.financial}`,
    `wellbeingScore: ${scores.wellbeing}`,
  ].join('\n');
}

function monthName(isoDate: IsoDate): string {
  // es-PE capitalizes some month names ("Setiembre"); Spanish writes them in lowercase.
  return new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' }).format(new Date(isoDate + 'T12:00:00Z')).toLocaleLowerCase('es-PE');
}

function formatDay(isoDate: IsoDate): string {
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(isoDate + 'T12:00:00Z')).toLocaleLowerCase('es-PE');
}

function writeIfMissing(file: string, render: () => string): void {
  if (!existsSync(file)) writeFileSync(file, render(), 'utf8');
}

function publishFiles(files: readonly string[]): void {
  for (const file of files) {
    writeFileSync(file, readFileSync(file, 'utf8').replace(/^status: draft$/m, 'status: published'), 'utf8');
  }
}

function singleStatus(statuses: Set<string | undefined>, label: string): Status {
  const [status] = statuses;
  if (statuses.size !== 1 || (status !== 'draft' && status !== 'published')) {
    throw new Error(`Estados inconsistentes en ${label}: ${[...statuses].join(', ')}`);
  }
  return status;
}

function assertScoresAndContent(source: string, file: string): void {
  const invalidScore = SCORE_KEYS.some((key) => {
    const value = Number(frontmatterValue(source, key));
    return !Number.isInteger(value) || value < 1 || value > 5;
  });
  if (invalidScore || (frontmatterValue(source, 'summary')?.length ?? 0) < 30 || !bodyOf(source)) {
    throw new Error(`Contenido o puntuación inválida: ${file}`);
  }
}

// Forecast groups: 12 files that share a period and dates.

type ForecastPeriod = 'today' | 'tomorrow' | 'month';

function forecastFile(sign: SignSlug, period: ForecastPeriod, start: IsoDate): string {
  return join(forecastsDir, `${sign}-${period}-${start}.md`);
}

function renderForecast(sign: SignSlug, period: ForecastPeriod, start: IsoDate, end: IsoDate, raw: RawScores, reading: { summary: string; body: string }): string {
  return `---
sign: ${sign}
period: ${period}
periodStart: '${start}'
periodEnd: '${end}'
status: draft
${scoreLines(raw)}
summary: ${yamlString(reading.summary)}
---
${reading.body}`;
}

function assertForecastGroup(period: ForecastPeriod, start: IsoDate, end: IsoDate): Status {
  const files = SIGN_SLUGS.map((sign) => forecastFile(sign, period, start));
  if (files.some((file) => !existsSync(file))) throw new Error(`Grupo incompleto: ${period} ${start}`);
  const statuses = new Set<string | undefined>();
  files.forEach((file, index) => {
    const source = readFileSync(file, 'utf8');
    statuses.add(frontmatterValue(source, 'status'));
    if (frontmatterValue(source, 'sign') !== SIGN_SLUGS[index]) throw new Error(`Signo inválido o duplicado: ${file}`);
    if (frontmatterValue(source, 'period') !== period || frontmatterValue(source, 'periodStart') !== start || frontmatterValue(source, 'periodEnd') !== end) {
      throw new Error(`Fecha o periodo inválido: ${file}`);
    }
    assertScoresAndContent(source, file);
  });
  return singleStatus(statuses, `el grupo ${period} ${start}`);
}

function publishForecastGroup(period: ForecastPeriod, start: IsoDate, end: IsoDate): void {
  if (assertForecastGroup(period, start, end) === 'draft') publishFiles(SIGN_SLUGS.map((sign) => forecastFile(sign, period, start)));
  if (assertForecastGroup(period, start, end) !== 'published') throw new Error(`El grupo ${period} ${start} no quedó publicado`);
}

function prepareDay(today: IsoDate): void {
  mkdirSync(forecastsDir, { recursive: true });
  for (const [period, date, lead] of [['today', today, 'Hoy'], ['tomorrow', addDays(today, 1), 'Mañana']] as const) {
    const sky = skyOn(date);
    for (const sign of SIGN_SLUGS) {
      writeIfMissing(forecastFile(sign, period, date), () => {
        const raw = rawScoresFor(sky, sign);
        return renderForecast(sign, period, date, date, raw, composeDailyForecast(sign, date, lead, raw));
      });
    }
    assertForecastGroup(period, date, date);
  }
}

function publishDay(today: IsoDate): void {
  publishForecastGroup('today', today, today);
  const tomorrow = addDays(today, 1);
  publishForecastGroup('tomorrow', tomorrow, tomorrow);
}

function prepareMonth(date: IsoDate): void {
  const start = monthStartOf(date);
  const end = monthEndOf(date);
  mkdirSync(forecastsDir, { recursive: true });
  for (const sign of SIGN_SLUGS) {
    writeIfMissing(forecastFile(sign, 'month', start), () => {
      const raw = monthRawScores(sign, start);
      return renderForecast(sign, 'month', start, end, raw, composeMonthlyForecast(sign, start, monthName(start), raw));
    });
  }
  assertForecastGroup('month', start, end);
}

function publishMonth(date: IsoDate): void {
  publishForecastGroup('month', monthStartOf(date), monthEndOf(date));
}

// Weekly edition: one week file plus 12 ranked horoscopes.

function weekFiles(start: IsoDate): { week: string; horoscopes: string[] } {
  return {
    week: join(weeksDir, `${start}.md`),
    horoscopes: SIGN_SLUGS.map((sign) => join(horoscopesDir, `${sign}-${start}.md`)),
  };
}

function assertWeek(start: IsoDate, end: IsoDate): Status {
  const files = weekFiles(start);
  if (!existsSync(files.week) || files.horoscopes.some((file) => !existsSync(file))) throw new Error(`Semana incompleta: ${start}`);
  const week = readFileSync(files.week, 'utf8');
  const statuses = new Set([frontmatterValue(week, 'status')]);
  if (frontmatterValue(week, 'weekStart') !== start || frontmatterValue(week, 'weekEnd') !== end || !frontmatterValue(week, 'title') || !frontmatterValue(week, 'theme') || (frontmatterValue(week, 'intro')?.length ?? 0) < 40 || !bodyOf(week)) {
    throw new Error(`Metadatos o contenido inválido: ${files.week}`);
  }
  const ranks = new Set<number>();
  files.horoscopes.forEach((file, index) => {
    const source = readFileSync(file, 'utf8');
    statuses.add(frontmatterValue(source, 'status'));
    const rank = Number(frontmatterValue(source, 'rank'));
    ranks.add(rank);
    if (frontmatterValue(source, 'sign') !== SIGN_SLUGS[index] || frontmatterValue(source, 'weekStart') !== start || frontmatterValue(source, 'weekEnd') !== end || !Number.isInteger(rank) || rank < 1 || rank > 12) {
      throw new Error(`Signo, puesto o fecha inválidos: ${file}`);
    }
    assertScoresAndContent(source, file);
  });
  if (ranks.size !== 12) throw new Error(`Puestos duplicados en la semana ${start}`);
  return singleStatus(statuses, `la semana ${start}`);
}

function prepareWeek(date: IsoDate): void {
  const start = weekStartOf(date);
  const end = addDays(start, 6);
  const files = weekFiles(start);
  mkdirSync(weeksDir, { recursive: true });
  mkdirSync(horoscopesDir, { recursive: true });
  const ranking = weeklyRanking(start);

  writeIfMissing(files.week, () => {
    const edition = composeWeekEdition(start, end, ranking, formatDay);
    return `---
weekStart: '${start}'
weekEnd: '${end}'
status: draft
title: ${yamlString(edition.title)}
theme: ${yamlString(edition.theme)}
intro: ${yamlString(edition.intro)}
---

${edition.body}`;
  });

  SIGN_SLUGS.forEach((sign, index) => {
    writeIfMissing(files.horoscopes[index], () => {
      const entry = ranking.find((item) => item.sign === sign)!;
      const raw = periodRawScores(sign, start, end);
      const reading = composeWeeklyHoroscope(sign, start, raw);
      return `---
weekStart: '${start}'
weekEnd: '${end}'
status: draft
sign: ${sign}
rank: ${entry.rank}
summary: ${yamlString(reading.summary)}
${scoreLines(raw)}
---

${reading.body}`;
    });
  });
  assertWeek(start, end);
}

function publishWeek(date: IsoDate): void {
  const start = weekStartOf(date);
  const end = addDays(start, 6);
  if (assertWeek(start, end) === 'draft') {
    const files = weekFiles(start);
    publishFiles([files.week, ...files.horoscopes]);
  }
  if (assertWeek(start, end) !== 'published') throw new Error(`La semana ${start} no quedó publicada`);
}

const MODES: Record<string, (date: IsoDate) => void> = {
  'prepare-day': prepareDay,
  'publish-day': publishDay,
  'prepare-week': prepareWeek,
  'publish-week': publishWeek,
  'prepare-month': prepareMonth,
  'publish-month': publishMonth,
};

const [mode, ...options] = process.argv.slice(2);
const dateOption = options.find((option) => option.startsWith('--date='))?.slice('--date='.length);
const run = mode ? MODES[mode] : undefined;

if (!run) throw new Error(USAGE);
if (dateOption !== undefined && !isValidIsoDate(dateOption)) throw new Error(`Fecha inválida: ${dateOption}. ${USAGE}`);

const date = dateOption ?? todayInLima();
run(date);
console.log(`Contenido ${mode} validado para ${date} (America/Lima)`);
